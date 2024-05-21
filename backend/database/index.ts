import { Pool, PoolConfig, QueryResult } from 'pg'
import * as card from '../middleware/card'
const result = require('dotenv').config()

if (result.error) {
	console.error(result.error)
}

const dbConfig: PoolConfig = {
	user: process.env.POSTGRE_ID,
	password: process.env.POSTGRE_PASS,
	host: process.env.DB_HOST,
	port: 5432,
	database: 'csc667bingodb',
	ssl: true,
}

const pool = new Pool(dbConfig)

async function query(text: string, params: any[]): Promise<QueryResult<any>> {
	const start = Date.now()
	const res = await pool.query(text, params)
	const duration = Date.now() - start
	//console.log("executed query", { text, duration, rows: res.rowCount });
	return res
}

async function insertUser(username: string, password: string, email: string): Promise<void> {
	try {
		const queryText = 'INSERT INTO bingo_schema."Users" (username, password, email) VALUES ($1, $2, $3)'
		const queryParams = [username, password, email]
		await query(queryText, queryParams)
		console.log('User inserted successfully')
	} catch (error) {
		console.error('Error inserting user:', error)
		throw error
	}
}

async function checkConnection(): Promise<void> {
	try {
		const result = await query('SELECT NOW() as now', [])
		const currentTime = result.rows[0].now

		console.log('Successfully connected to PostgreSQL server. Current time:', currentTime)
	} catch (error) {
		console.error('Error connecting to PostgreSQL server:', error)
		throw error
	}
}

async function createTable(): Promise<void> {
	try {
		const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL
      )
    `
		await query(createTableQuery, [])
		console.log('Table "users" created successfully')
	} catch (error) {
		console.error('Error creating table:', error)
		throw error // Rethrow the error for handling at a higher level
	}
}

async function getUsers() {
	try {
		const result = await query('SELECT * FROM bingo_schema."Users"', [])
		return result.rows
	} catch (error) {
		console.error('Error executing query', error)
	}
}

async function getUserData(userVerify: string) {
	try {
		const user = await query(`SELECT * FROM bingo_schema."Users" WHERE username = $1`, [userVerify])
		return user.rows[0]
	} catch (error) {
		console.error('Error executing query', error)
	}
}

async function getUserIdByUsername(username: string) {
	try {
		const user = await query(`SELECT user_id FROM bingo_schema."Users" WHERE username = $1`, [username])
		return user.rows[0].user_id
	} catch (error) {
		console.error('Error executing query', error)
	}
}

async function RoomNameOrHostExist(roomName: string, host: string) {
	try {
		const queryText = 'SELECT * FROM bingo_schema."Rooms" WHERE room_name = $1'
		const queryParams = [roomName]
		return (await query(queryText, queryParams)).rows
	} catch (error) {
		console.error('Error inserting room:', error)
		throw error
	}
}

async function createRoom(roomName: string, host: string, status: boolean) {
	try {
		const queryText = 'INSERT INTO bingo_schema."Rooms" (room_name, host, status) VALUES ($1, $2, $3)'
		const queryParams = [roomName, host, false]
		await query(queryText, queryParams)
		console.log('Room inserted successfully')
	} catch (error) {
		console.error('Error inserting room:', error)
		throw error
	}
}

async function deleteRoom(roomId: number) {
	try {
		const queryText = 'DELETE FROM bingo_schema."Rooms" WHERE room_id = $1'
		const queryParams = [roomId]
		await query(queryText, queryParams)
		console.log('Room deleted successfully')
	} catch (error) {
		console.error('Error deleting room:', error)
		throw error
	}
}

async function getRooms() {
	try {
		const result = await query('SELECT * FROM bingo_schema."Rooms"', [])
		return result.rows
	} catch (error) {
		console.error('Error executing query', error)
	}
}
async function getRoomId(roomName: string, host: string): Promise<any> {
	try {
		const queryText = `
    Select room_id from bingo_schema."Rooms"
    WHERE room_name =  $1 AND host = $2`
		const queryParams = [roomName, host]
		const result = await query(queryText, queryParams)
		return result.rows[0].room_id
	} catch (error) {
		console.error('Error executing query', error)
	}
}

async function getRoomDetail(roomId: Number): Promise<any> {
	try {
		const queryText = `
    Select * from bingo_schema."Rooms"
    WHERE room_id = $1`
		const queryParams = [roomId]
		const result = await query(queryText, queryParams)
		return result.rows[0]
	} catch (error) {
		console.error('Error executing query', error)
	}
}

/**
 * Add player to the room.
 *
 * @param player_id Player ID joining the room.
 * @param room_id Room ID.
 */
async function addPlayerToRoom(player_id: number, room_id: number) {
	try {
		const queryText = `INSERT INTO bingo_schema.room_player_table(user_id, room_id)VALUES ($1, $2);`
		const queryParams = [player_id, room_id]
		await query(queryText, queryParams)
		console.log('User inserted successfully')
	} catch (error) {
		console.error('Error inserting user:', error)
		throw error
	}
}

/**
 * Removes the player in the room. Can be used in a leave button.
 * @param player_id Player ID joining the room.
 * @param room_id  Room ID.
 */
async function removePlayerFromRoom(player_id: number, room_id: number) {
	try {
		const queryText = `DELETE FROM bingo_schema.room_player_table WHERE user_id = $1 AND room_id = $2;`
		const queryParams = [player_id, room_id]
		await query(queryText, queryParams)
		console.log('User deleted successfully')
	} catch (error) {
		console.error('Error inserting user:', error)
		throw error
	}
}

/**
 * Fetch the Player in the room.
 * @param player_id ID of the player in the room
 * @param room_id ID of the specified room.
 * @returns A row of the user if it exist in the table
 */
async function getPlayerInRoom(room_id: number) {
	try {
		const user = await query(`SELECT * FROM bingo_schema.room_player_table WHERE room_id = $1`, [room_id])
		return user.rows
	} catch (error) {
		console.error('Error inserting user:', error)
		throw error
	}
}
async function ifPlayerInRoom(user_id: Number, room_id: Number) {
	try {
		const user = await query(`SELECT * FROM bingo_schema.room_player_table WHERE room_id = $1 AND user_id = $2`, [room_id, user_id])
		return user.rows[0]
	} catch (error) {
		console.error('Error inserting user:', error)
		throw error
	}
}
async function ifPlayerInAnyRoom(user_id: Number|undefined) {
	try {
		if (user_id === undefined) return []
		const user = await query(`SELECT * FROM bingo_schema.room_player_table WHERE user_id = $1`, [user_id])
		return user.rows
	} catch (error) {
		console.error('Error inserting user:', error)
		throw error
	}
}

/**
 * Inserts the generated card into the database
 * @param arrayOfNum An array of integer array.
 */
async function insertCard(arrayOfNum: number[][]) {
	try {
		const cardData = JSON.stringify(arrayOfNum)

		const queryText = `
      INSERT INTO bingo_schema.cards_table(card_data)
      VALUES ($1)
    `

		const queryParams = [cardData]

		await query(queryText, queryParams)
		console.log('Card inserted successfully')
	} catch (error) {
		console.error('Error inserting card:', error)
		throw error
	}
}
/**
 * Get a card from our database
 * @param card_id ID of the specified card.
 * @returns The card information
 */
async function getCard(card_id: number) {
	try {
		const card = await query(`SELECT * FROM bingo_schema.cards_table WHERE card_id = $1;`, [card_id])
		return card.rows[0]
	} catch (error) {
		console.error('Error inserting user:', error)
		throw error
	}
}

async function getRoomDetails(room_id: Number) {
	try {
		const room = await query(`
			SELECT 
			r.room_id, 
			r.room_name,
			p.user_id,
			host.user_id as host_id,
			u.username
			FROM 
			bingo_schema."Rooms" AS r
			JOIN 
			bingo_schema.room_player_table AS p ON r.room_id = p.room_id
			JOIN 
			bingo_schema."Users" AS host ON r.host = host.username
			JOIN 
			bingo_schema."Users" AS u ON p.user_id = u.user_id
			where
				r.room_id = $1;
    `,
			[room_id]
		)
		return room.rows
	} catch (error) {
		console.error('Error inserting user:', error)
		throw error
	}
}

async function insertFourCard() {
	const collection: number[][][] = []
	for (let i = 0; i < 4; i++) {
		collection.push(card.generateCard())
	}
	try {
		const queryText = `
        INSERT INTO bingo_schema.cards_table (card_data)
        VALUES ($1), ($2), ($3), ($4)
        RETURNING card_id, card_data;
      `
		const queryParams = [JSON.stringify(collection[0]), JSON.stringify(collection[1]), JSON.stringify(collection[2]), JSON.stringify(collection[3])]

		const result = await query(queryText, queryParams)
		console.log('4 cards inserted successfully')
		return result.rows
	} catch (error) {
		console.error('Error inserting card:', error)
		throw error
	}
}

async function insertNumCard(room_id: number) {
	try {
		const countResult = await query(
			`SELECT COUNT(*) as count FROM bingo_schema.player_ready_status WHERE room_id = $1`,
			[room_id]
		);
		const playerCount = parseInt(countResult.rows[0].count);
		const collection: number[][][] = []
		for (let i = 0; i < playerCount; i++) {
			collection.push(card.generateCard())
		}
		const values = collection.map((card, index) => `($${index + 1})`).join(", ");
		const queryParams = collection.map(card => JSON.stringify(card));
		const queryText = `
	  		INSERT INTO bingo_schema.cards_table (card_data)
	  		VALUES ${values}
	  		RETURNING card_id, card_data;
  `;
		// Execute the insertion query
		const result = await query(queryText, queryParams);
		console.log(`${playerCount} cards inserted successfully`);
		return result.rows;
	} catch (error) {
		console.error('Error inserting cards:', error);
		throw error;
	}
}

async function assignCardToPlayer(player_id: number, card_id: number, room_id: number) {
	try {
		const queryText = `INSERT INTO bingo_schema.player_card(player_id, card_id, room_id)VALUES ($1, $2, $3);`
		const queryParams = [player_id, card_id, room_id]
		await query(queryText, queryParams)
		console.log('card assigned to player successfully')
	} catch (error) {
		console.error('Error inserting user:', error)
		throw error
	}
}

async function insertPlayerStatus(player_id: number, room_id: number) {
	try {
		const queryText = `INSERT INTO bingo_schema.player_ready_status(player_id, room_id)VALUES ($1, $2);`
		const queryParams = [player_id, room_id]
		await query(queryText, queryParams)
		console.log('Player status inserted successfully')
	} catch (error) {
		console.error('Error inserting status:', error)
		throw error
	}
}

async function getPlayerStatus(player_id: number, room_id: number) {
	try {
		const status = await query(`SELECT status FROM bingo_schema.player_ready_status WHERE player_id = $1 AND room_id = $2`, [player_id, room_id])
		return status.rows[0]
	} catch (error) {
		console.error('Error inserting user:', error)
		throw error
	}
}

async function updatePlayerStatus(player_id: number, room_id: number, status: boolean) {
	try {
		const queryText = `UPDATE bingo_schema.player_ready_status SET status = $1 WHERE player_id = $2 AND room_id = $3;`
		const queryParams = [status, player_id, room_id]
		await query(queryText, queryParams)
		// console.log(`Player ${player_id} in ${room_id} changed status to "${status ? 'Ready': 'Not Ready'}" successfully`);
		return status
	} catch (error) {
		console.error('Error inserting user:', error)
		throw error
	}
}
async function resetPlayerStatus(room_id: number) {
	try {
		const queryText = `UPDATE bingo_schema.player_ready_status SET status = false WHERE room_id = $1;`
		const queryParams = [room_id]
		await query(queryText, queryParams)
		console.log('Player status reset successfully')
	} catch (error) {
		console.error('Error inserting user:', error)
		throw error
	}
}

async function deletePlayerStatus(player_id: number, room_id: number) {
	try {
		const queryText = `DELETE FROM bingo_schema.player_ready_status WHERE player_id = $1 AND room_id = $2;`
		const queryParams = [player_id, room_id]
		await query(queryText, queryParams)
		console.log('Player status deleted successfully')
	} catch (error) {
		console.error('Error inserting user:', error)
		throw error
	}
}

async function getAllPlayerStatus(room_id: number) {
	try {
		const status = await query(`SELECT * FROM bingo_schema.player_ready_status WHERE room_id = $1`, [room_id])
		return status.rows
	} catch (error) {
		console.error('Error inserting user:', error)
		throw error
	}
}

async function getGameInfo(room_id: Number) {
	try {
		const gameInfo = await query(
			`
			SELECT 
			r.room_id, 
			p.user_id, 
			host.user_id as host_id,
			  u.username,
			  pc.card_id as card_id,
			cid.card_data as card_data
			FROM 
			  bingo_schema."Rooms" AS r
			JOIN 
			  bingo_schema.room_player_table AS p ON r.room_id = p.room_id
			JOIN 
			  bingo_schema."Users" AS host ON r.host = host.username
			JOIN 
			  bingo_schema."Users" AS u ON p.user_id = u.user_id
			JOIN 
			  bingo_schema.player_card AS pc ON p.user_id = pc.player_id and r.room_id = pc.room_id
			join
			  bingo_schema.cards_table AS cid ON pc.card_id = cid.card_id
		  WHERE
			  r.room_id = $1;
    `,
			[room_id]
		)
		return gameInfo.rows
	} catch (error) {
		console.error('Error inserting user:', error)
		throw error
	}
}



async function deleteOldCards(roomId: number) {
	try {
		const selectQuery = `SELECT card_id FROM bingo_schema.player_card WHERE room_id = $1`
		const selectParams = [roomId]
		const result = await query(selectQuery, selectParams)

		const queryText = `DELETE FROM bingo_schema.player_card
		WHERE room_id = $1`
		const queryParams = [roomId]
		await query(queryText, queryParams)

		if (result) {
			result.rows.forEach(async (row: any) => {
				const queryText = `DELETE FROM bingo_schema.cards_table WHERE card_id = $1`
				const queryParams = [row.card_id]
				await query(queryText, queryParams)
				console.log('Cards deleted successfully')
			})
		}

		console.log('Cards deleted successfully')
	} catch (error) {
		console.error('Error deleting room:', error)
		throw error
	}
}

async function insertStartTime(roomId: number) {
	try {
		// createTableTimer();
		// const currentTime = new Date()
		// const endTime = new Date(currentTime.getTime() + 10 * 60 * 1000)

		const queryText = 'INSERT INTO bingo_schema.room_timer (room_id) VALUES ($1)';
		const queryParams = [roomId];
		await query(queryText, queryParams)
		console.log('Room Insert Time successfully')
	} catch (error) {
		console.error('Error inserting time:', error)
	}
}

async function deleteStartTime(roomId: number) {
	try {
		// createTableTimer();
		// const currentTime = new Date()
		// const endTime = new Date(currentTime.getTime() + 10 * 60 * 1000)

		const queryText = 'DELETE FROM bingo_schema.room_timer WHERE room_id = $1';
		const queryParams = [roomId];

		await query(queryText, queryParams)
		console.log('Room Insert Time successfully')
	} catch (error) {
		console.error('Error inserting time:', error)
	}
}

async function getCardByPlayer(player_id: number, room_id: number) {
	try {

		const queryText = `
		select * from bingo_schema.player_card as p
		join bingo_schema."cards_table" as c
		on p.card_id = c.card_id
		where p.room_id = $1 and p.player_id = $2
`
		const queryParams = [room_id, player_id]
		const result = await query(queryText, queryParams)
		return result.rows[0].card_data
	} catch (error) {
		console.error('Error inserting user:', error)
		throw error
	}
}


async function getDrawnNumber(roomId: number) {
	try {
		const queryText = `SELECT * FROM bingo_schema.drawn_numbers WHERE room_id = $1`
		const queryParams = [roomId]
		const result = await query(queryText, queryParams)
		return result.rows
	} catch (error) {
		console.error('Error inserting user:', error)
		throw error
	}
}

async function insertDrawnNumber(roomId: number, number: number) {
	try {
		const queryText = `INSERT INTO bingo_schema.drawn_numbers (room_id, drawn_number) VALUES ($1, $2)`
		const queryParams = [roomId, number]
		await query(queryText, queryParams)
		console.log('Number inserted successfully')
	} catch (error) {
		console.error('Error inserting user:', error)
		throw error
	}
}

async function deleteDrawnNumber(roomId: number) {
	try {
		const queryText = `DELETE FROM bingo_schema.drawn_numbers WHERE room_id = $1`
		const queryParams = [roomId]
		await query(queryText, queryParams)
		console.log('Number deleted successfully')
	} catch (error) {
		console.error('Error inserting user:', error)
		throw error
	}
}

async function updateRoomStatus(room_id:number, status:boolean) {
	try {
		const queryText = 'UPDATE bingo_schema."Rooms" SET status=$2 WHERE room_id=$1';
		const queryParams = [room_id, status];
		await query(queryText, queryParams);
		console.log('Marked cell inserted successfully!');
	} catch (error) {
		console.error('Error inserting room:', error);
		throw error;
	}
}

async function getStartTime(room_id: number) {
	try {
		const status = await query(
			`select * from bingo_schema.room_timer where room_id = $1`,
			[room_id]
		);
		return status.rows[0].timestamp;
	} catch (error) {
		console.error("Error inserting user:", error);
		throw error;
	}
}
async function insertMarkedNumber(user_id: Number, room_id: Number, div_cell_id: String) {
	try {

		const queryText = 'INSERT INTO bingo_schema.marked_cells_table(room_id, user_id, div_cell_id)VALUES ($1, $2, $3);';
		const queryParams = [room_id, user_id, div_cell_id];
		await query(queryText, queryParams);
		console.log('Marked cell inserted successfully!');
	} catch (error) {
		console.error('Error inserting room:', error);
		throw error;
	}
}
async function deleteMarkedNumber(user_id: Number, room_id: Number, div_cell_id: String) {
	try {
		const queryText = 'DELETE FROM bingo_schema.marked_cells_table WHERE user_id = $1 AND room_id = $2 AND div_cell_id = $3;';
		const queryParams = [user_id, room_id, div_cell_id];
		await query(queryText, queryParams);
		console.log('Marked cell deleted successfully!');
	} catch (error) {
		console.error('Error inserting room:', error);
		throw error;
	}
}
async function deleteAllMarkedNumber(room_id: Number) {
	try {
		const queryText = 'DELETE FROM bingo_schema.marked_cells_table WHERE room_id = $1;';
		const queryParams = [room_id];
		await query(queryText, queryParams);
		console.log('Marked cell deleted successfully!');
	} catch (error) {
		console.error('Error inserting room:', error);
		throw error;
	}
}

async function getMarkedCells(room_id: Number) {
	try {
		const markedCellsInfo = await query(`
	  SELECT room_id, user_id, div_cell_id FROM bingo_schema.marked_cells_table WHERE room_id = $1;
	  `, [room_id]);
		return markedCellsInfo.rows;
	} catch (error) {
		console.error("Error fetching marked cells:", error);
		throw error;
	}
}

// async function createTableTimer(): Promise<void> {
// 	try {
// 		const createTableQuery = `
//       	CREATE TABLE IF NOT EXISTS room_timer (
// 		room_id INT,
// 		timestamp_start TIMESTAMP,
// 		time_start TIME
//       )
//     `
// 		await query(createTableQuery, [])
// 		console.log('Table "users" created successfully')
// 	} catch (error) {
// 		console.error('Error creating table:', error)
// 		throw error // Rethrow the error for handling at a higher level
// 	}
// }

export {
	insertUser,
	getUsers,
	createTable,
	getUserData,
	createRoom,
	addPlayerToRoom,
	removePlayerFromRoom,
	getPlayerInRoom,
	insertCard,
	getCard,
	getRooms,
	getRoomId,
	getRoomDetail,
	getUserIdByUsername,
	ifPlayerInRoom,
	getRoomDetails,
	deleteRoom,
	insertFourCard,
	assignCardToPlayer,
	insertPlayerStatus,
	getPlayerStatus,
	updatePlayerStatus,
	deletePlayerStatus,
	getAllPlayerStatus,
	getGameInfo,
	deleteOldCards,
	insertStartTime,
	deleteStartTime,
	insertNumCard,
	getCardByPlayer,
	getDrawnNumber,
	insertDrawnNumber,
	deleteDrawnNumber,
	resetPlayerStatus,
	getStartTime,
	insertMarkedNumber,
	deleteMarkedNumber,
	getMarkedCells,
	deleteAllMarkedNumber,
	RoomNameOrHostExist,
	updateRoomStatus,
	ifPlayerInAnyRoom
}
