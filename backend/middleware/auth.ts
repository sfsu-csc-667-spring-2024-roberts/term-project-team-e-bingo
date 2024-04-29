import {NextFunction, Request, Response} from 'express'
import session from 'express-session'

declare module 'express-session' {
	interface SessionData {
		user?: { sessionID:string, username:string, // email:string
		}
	}
}

const users = [
	{username: 'user1', email:'test1@bingo.edu', password: 'password1'},
	{username: 'user2', email:'test2@bingo.edu', password: 'password2'},
]

const sessionData = session({
	secret: process.env.SECRET_KEY_BINGO || 'your-secret-key',
	resave: false,
	saveUninitialized: false,
	cookie: {
		secure: false,
		httpOnly: true,
		maxAge: 1 * 10 * 60 * 1000,
	},
})

const authenticate = (username: string, password: string): boolean => {
	const user = users.find((user) => user.username === username && user.password === password)
	return !!user
}

const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    console.log(req.session.user);
	console.log(req.session);
	if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

const requiredLoginAllSites = (req: Request, res: Response, next: NextFunction) => {
	(req.path != '/login') ? isAuthenticated(req, res, next) : next();
}

const loginRequest = (req: Request, res: Response) => {
	const sessionID = req.session.id;

    const {username, password} = req.body
	if (!username || !password) {
		return res.render('login', {errorMessage: 'Please log in to access the game!'})
	}
	if (authenticate(username, password)) {
		req.session.user = { sessionID , username }
		return res.redirect('/')
	} else {
		return res.render('login', {errorMessage: 'Invalid username or password'})
	}
}


export { sessionData, requiredLoginAllSites, loginRequest }
