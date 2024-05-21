import {NextFunction, Request, Response} from 'express'
import session from 'express-session'
import { getUserData, getUsers,getUserIdByUsername, getPlayerInRoom,getRoomDetail,ifPlayerInAnyRoom } from '../database';
import bcrypt from "bcrypt";

declare module 'express-session' {
	interface SessionData {
		user?: { sessionID:string, username:string, userId:number
		}
	}
}

const sessionData = session({
	secret: process.env.SECRET_KEY_BINGO || 'your-secret-key',
	resave: false,
	saveUninitialized: false,
	cookie: {
		secure: false,
		httpOnly: true,
		maxAge: 1 * 60 * 60 * 1000,
	},
})


const authenticate = async (username: string, password: string): Promise<boolean> => {
	try {
	  const dbUser = await getUserData(username);
	  if (dbUser) return await bcrypt.compare(password, dbUser.password);
	  return false;
	} catch (err) {
	  console.error(err);
	  return false;
	}
}

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
	if (req.session.user) {
        next();
    } else {
        res.render('login',{errorMessage: 'Please log in to access the page!', session: req.session});
    }
}

const requiredLoginAllSites = (req: Request, res: Response, next: NextFunction) => {
	!['/login', '/register', '/'].includes(req.path) ? isAuthenticated(req, res, next) : next();
}

const loginRequest = async (req: Request, res: Response) => {
	const sessionID = req.session.id;

    const {username, password} = req.body
	if (!username) {
		return res.render('login', {errorMessage: 'Please enter your username', session: req.session})
	}else if(!password){
		return res.render('login', {errorMessage: 'Please enter your password!', session: req.session})
	}
	
	if (await authenticate(username, password)) {
		const userId = parseInt(await getUserIdByUsername(username))
		req.session.user = { sessionID , username, userId }
		return res.redirect('/login')
	} else {
		return res.render('login', {errorMessage: 'Invalid username or password', session: req.session})
	}
}



const isUserExist = async (req: Request, res: Response, next: NextFunction) => {

    try{
        const roomId = parseInt(req.params.roomId);
        const userId = req.session.user?.userId;

        if (!userId) {
            return res.status(403).render('status403');
        }

        const [players, roomDetail] = await Promise.all([
            getPlayerInRoom(roomId),
            getRoomDetail(roomId),
        ]);

        const found = players.find((player) => player.user_id == req.session.user?.userId)
        const gameStarted = roomDetail?.status;
        if(!found || gameStarted) {
            res.status(403).render('status403')
            return
        }
        next();
    }catch(error){
        console.error('Error in isUserExist middleware:', error);
        res.status(500).send('Internal Server Error');

    }
	
}

const isUserExistAndGameStarted = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const roomId = parseInt(req.params.roomId);
        const userId = req.session.user?.userId;

        if (!userId) {
            return res.status(403).render('status403');
        }

        const [players, roomDetail] = await Promise.all([
            getPlayerInRoom(roomId),
            getRoomDetail(roomId),
        ]);

        const playerExists = players.some((player) => player.user_id === userId);
        const gameStarted = roomDetail?.status;

        if (!playerExists || !gameStarted) {
            return res.status(403).render('status403');
        }

        next();
    } catch (error) {
        console.error('Error in isUserExistAndGameStarted middleware:', error);
        res.status(500).send('Internal Server Error');
    }
};

const isPlayerInAnyRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.session.user) {
            return next();
        }

        if (!['/login'].includes(req.path)) {
            return next();
        }

        const userId = req.session.user.userId;
        const players = await ifPlayerInAnyRoom(userId);

        if (players.length > 0) {
            const rooms = await Promise.all(players.map(async (room: any) => {
                const roomStatus = await getRoomDetail(room.room_id);
                const status = roomStatus.status;
                return { room_id: room.room_id, status: status, room_name: roomStatus.room_name};
            }));

            return res.render('redirect', { rooms:rooms, session: req.session});
        }

        return res.render('index', {session: req.session});
    } catch (error) {
        console.error('Error in isPlayerInAnyRoom middleware:', error);
        res.status(500).send('Internal Server Error');
    }
};

export default isPlayerInAnyRoom;


export { sessionData, requiredLoginAllSites, loginRequest ,isUserExist,isUserExistAndGameStarted,isPlayerInAnyRoom}
