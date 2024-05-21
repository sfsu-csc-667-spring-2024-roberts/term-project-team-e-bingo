import express, { Request, Response, NextFunction } from 'express'
import { loginRequest, isUserExist, isUserExistAndGameStarted } from '../middleware/auth'
import { createTable, insertUser, getUsers, getRooms } from '../database/index'
import * as db from '../database/index'
import bcrypt from 'bcrypt'

const router = express.Router()

router.get('/', async (req, res) => {
	res.render('index', { session: req.session })
})

router.get('/lobby', (req, res) => {
	res.render('lobby', { session: req.session })
})

router.get('/login', (req: Request, res: Response) => {
	res.render('login', { session: req.session, errorMessage: '' })
})

router.get('/register', (req: Request, res: Response) => {
	res.render('register', { session: req.session, errorMessage: '' })
})

router.post('/register', async (req, res) => {
	try{
		const { username, email, password } = req.body
		const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		const validEmail = pattern.test(email);
		if (!validEmail) {
			return res.render('register', { session: req.session, errorMessage: 'Invalid email format!' })
		}
	
		const allUser = await db.getUsers() // Await the getUsers() function call
		const userExist = allUser?.find((user) => user.username === username)
		if (userExist) {
			return res.render('register', { session: req.session, errorMessage: 'Username already exist!' })
		}
	
		const emailExist = allUser?.find((user) => user.email === email)
		if (emailExist) {
			return res.render('register', { session: req.session, errorMessage: 'Email already exist!' })
		}
	
		const salt = await bcrypt.genSalt()
		const hash = await bcrypt.hash(password, salt)
	
		await insertUser(username, hash, email)
		res.render('login', { session: req.session, errorMessage: '' })
	}catch(error){
		console.error('Failed to register:', error)
		res.status(500).send('Internal Server Error')
	}
})

router.post('/login', (req: Request, res: Response) => {
	try{
		loginRequest(req, res)
	}catch(error){
		console.error('Failed to login:', error)
		res.status(500).send('Internal Server Error')
	}
})

router.post('/logout', (req: Request, res: Response) => {
	try{
		req.session.destroy((err) => {
			if (err) {
				return res.redirect('/')
			}
			res.clearCookie('connect.sid')
			res.redirect('/login')
		})
	}catch(error){
		console.error('Failed to logout:', error)
		res.status(500).send('Internal Server Error')
	}
	
})

router.get('/available_rooms', async (req: Request, res: Response) => {
	try {
		const result = await getRooms() // Await the getRooms() function call
		if (result) {
			res.json(result) // Send the result directly
		} else {
			res.status(500).send('Error retrieving rooms')
		}
	} catch (err) {
		console.error(err)
		res.status(500).send('Error retrieving rooms')
	}
})

router.get('/waiting/:roomId', isUserExist, async (req, res) => {
	const roomId = req.params.roomId

	try {
		const rawData = await db.getRoomDetails(parseInt(roomId))
		const playerStatuses = await db.getAllPlayerStatus(parseInt(roomId)) // Fetch statuses

		// Assuming all entries have the same room details
		const roomDetails = {
			room_id: rawData[0].room_id,
			room_name: rawData[0].room_name,
			host_id: rawData[0].host_id,
			players: rawData.map((player) => ({
				user_id: player.user_id,
				username: player.username,
				status: playerStatuses.find((status) => parseInt(status.player_id) === parseInt(player.user_id)).status,
			})),
		}

		const host = rawData.find((player) => player.host_id === player.user_id)
		res.render('waitroom', {
			roomDetails: roomDetails,
			players: roomDetails.players,
			host: host,
			user: req.session.user, // Assuming session management
			session: req.session,
		})
	} catch (error) {
		console.error('Failed to load room details:', error)
		res.status(500).send('Internal Server Error')
	}
})

router.post('/add_user_status', async (req: Request, res: Response) => {
	try {
		const { username, room_id } = req.body
		const user_id = await db.getUserIdByUsername(username)
		const statusExist = await db.getPlayerStatus(user_id, room_id)
		if (statusExist === undefined) {
			await db.insertPlayerStatus(user_id, room_id)
		}
		res.status(201).json({ message: 'Player status added' })
	} catch (error) {
		console.error('Failed to join room:', error)
		res.status(500).send('Internal Server Error')
	}
})

router.post('/join_room/:roomId', async (req: Request, res: Response) => {
	if (req.session.user) {
		try {
			const player_id = await db.getUserIdByUsername(req.session.user.username)
			const room_id = parseInt(req.params.roomId)

			// It's better to check if player_id or room_id are valid before proceeding
			if (!player_id || isNaN(room_id)) {
				return res.status(400).json({ message: 'Invalid user or room ID' })
			}

			const playerExistInRoom = await db.ifPlayerInRoom(player_id, room_id)
			const allPlayers = await db.getPlayerInRoom(room_id)
			if (allPlayers.length >= 4 && !playerExistInRoom) {
				res.status(403).json({ message: 'Room is full' })
			} else {
				if (playerExistInRoom) {
					res.status(200).json({ message: 'Player added to room, joining' })
				} else {
					await db.addPlayerToRoom(player_id, room_id)
					res.status(201).json({ message: 'Player added to room' })
				}
			}
		} catch (error) {
			console.error('Failed to join room:', error)
			res.status(500).send('Internal Server Error')
		}
	} else {
		res.status(401).json({ message: 'User not logged in' }) // 401 for unauthorized access
	}
})

router.get('/game', async (req, res) => {
	res.render('game')
})

router.get('/game/:roomId', isUserExistAndGameStarted, async (req, res) => {
	try {
		const roomId = req.params.roomId
		const startTime = await db.getStartTime(parseInt(roomId))
		const rawData = await db.getGameInfo(parseInt(roomId))
		const drawnNumber = await db.getDrawnNumber(parseInt(roomId))
		const markedNumber = await db.getMarkedCells(parseInt(roomId))
		//const getDrawnBalls = await db.getDrawnBalls(roomId);

		const gameInfo = {
			room_id: rawData[0].room_id,
			host_id: rawData[0].host_id,
			players: rawData.map((player) => ({
				user_id: player.user_id,
				username: player.username,
				card_id: player.card_id,
				card_data: player.user_id == req.session.user?.userId ? player.card_data : player.card_data.map(() => [0, 0, 0, 0, 0])

			})),
			start_time: startTime,
			drawn_number: drawnNumber
				.map((result) => result.drawn_number)
				.filter((value) => value !== 0)
				.join(', '),
			markedCells: markedNumber.map((result) => result.div_cell_id),
		}

		const host = rawData.find((player) => player.host_id === player.user_id)
		res.render('game', {
			gameInfo: gameInfo,
			players: gameInfo.players,
			host: host,
			user: req.session.user, // Assuming session management
			session: req.session,
		})
	} catch (error) {
		console.error('Failed to load game room', error)
		res.status(500).send('Internal Server Error')
	}
})

router.post('/starting_game/:roomId', async (req: Request, res: Response) => {
	try{
		const { host_id, players, room_id } = req.body
		await db.deleteOldCards(room_id)
		await db.deleteStartTime(room_id)
		await db.deleteDrawnNumber(room_id)
		await db.insertDrawnNumber(room_id, 0)
		await db.updateRoomStatus(room_id, true)
	
		// ONLY INSERT CARDS BASE ON NUMBER OF USERs
		const cardCollection = await db.insertNumCard(room_id)
	
		if (Array.isArray(cardCollection) && cardCollection.length >= players.length) {
			for (let i = 0; i < players.length; i++) {
				await db.assignCardToPlayer(players[i], cardCollection[i].card_id, room_id)
			}
			await db.insertStartTime(room_id)
			res.status(200).json({ message: 'Game started' })
		} else {
			res.status(400).json({ message: 'Invalid players or card collection' })
		}
	}catch(error){
		console.error('Failed to start game:', error)
		res.status(500).send('Internal Server Error')
	}
})

router.post('/host_exit/:roomId', async (req: Request, res: Response) => {
	const { userId, roomId } = req.body
	try{
		if (userId && roomId) {
			await db.removePlayerFromRoom(userId, roomId)
			await db.deletePlayerStatus(userId, roomId)
			await db.deleteRoom(roomId)
			res.status(200).json({ message: 'Room Deleted' })
		} else {
			res.status(400).json({ message: 'Invalid user or room ID' })
		}
	}catch(error){
		console.error('Failed to delete room:', error)
		res.status(500).send('Internal Server Error')
	}
})
router.post('/api/draw_number/:roomId', async (req: Request, res: Response) => {
	try{
		const { roomId } = req.body
		if (roomId) {
			const drawnNumbers = await db.getDrawnNumber(parseInt(roomId));
			const draw_number_without_zero = drawnNumbers.filter((result) => result.drawn_number !== 0)
			if (draw_number_without_zero.length <= 0) {
				return res.status(400).json({ message: 'No number drawn yet' })
			} else {
				return res.status(200).json({ message: 'Number started drawing' })
			}
		}
	}catch(error){
		console.error('Failed to draw number:', error)
		res.status(500).send('Internal Server Error')
	}
});

router.get('/check_user_and_game/:roomId', async (req, res) => {
	try {
		const roomId = parseInt(req.params.roomId);
		const userId = req.session.user?.userId;

		if (!userId) {
			return res.status(200).json({ isUserInRoom: false, isGameStarted: false });
		}

		const [players, roomDetail] = await Promise.all([
			db.getPlayerInRoom(roomId),
			db.getRoomDetail(roomId),
		]);

		const isUserInRoom = players.some((player) => player.user_id === userId);
		const isGameStarted = roomDetail?.status;

		res.status(200).json({ isUserInRoom, isGameStarted });
	} catch (error) {
		console.error('Error in checkUserInRoomAndGameStarted:', error);
		res.status(500).send('Internal Server Error');
	}
});
export default router

