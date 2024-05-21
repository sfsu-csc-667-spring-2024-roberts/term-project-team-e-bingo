const getByID = (id) => {
	return document.getElementById(id)
}

const createElement = (tag, attributes, id, content) => {
	const element = document.createElement(tag)
	for (const key in attributes) {
		element.setAttribute(key, attributes[key])
	}
	if (id) element.id = id
	if (content) element.textContent = content
	return element
}

/* Update color status on player change */
const updateUserStatus = (userId, status) => {
	const statusText = getByID(`status-${userId}`)
	statusText.textContent = status ? 'Ready' : 'Not Ready'

	const buttonsStatus = getByID(`readyButton-${userId}`)
	if (buttonsStatus) buttonsStatus.textContent = status ? 'Ready' : 'Not Ready'

	const statusColor = getByID(`status-color-${userId}`)
	statusColor.style.backgroundColor = status ? 'rgb(181, 255, 69)' : 'rgb(255, 0, 0)'
}

socket.on('player ready', function (data) {
	const {userId, status} = data
	updateUserStatus(userId, status)
})

//OLD VERSION
// socket.on('player ready', function (data) {
// 	const {userId} = data
// 	const statusElement = document.getElementById('status-' + userId)
// 	if (statusElement) {
// 		if (statusElement.textContent === 'Ready') {
// 			statusElement.textContent = 'Not Ready'
// 		} else {
// 			statusElement.textContent = 'Ready'
// 		}
// 	}
// 	const buttonElement = document.getElementById('readyButton-' + userId)
// 	if (buttonElement) {
// 		if (buttonElement.textContent === 'Ready') {
// 			buttonElement.textContent = 'Not Ready'
// 		} else {
// 			buttonElement.textContent = 'Ready'
// 		}
// 	}
// })

// Listen for 'player exited' events
socket.on('player exited', function (data) {
	const {userId} = data
	// Example: Remove the player's element or update it to show they've exited
	const playerElement = document.getElementById('player-' + userId)
	if (playerElement) {
		playerElement.parentNode.removeChild(playerElement)
	}
})

socket.on('new player joined', function (data) {
	const player = data.username
	const roomId = data.roomId
	const userId = data.userId
	addPlayer(player, roomId, userId)
})
function markReady(roomId, userId) {
	console.log('clicked ready')
	socket.emit('player ready', {roomId: roomId, userId: userId})
}

async function exitRoom(roomId, userId) {
	console.log('clicked exit')
	const playerElement = document.getElementById(`players`)
	if (userId === hostId && playerElement.childElementCount > 1) {
		window.alert('Host cannot exit the room if there are other players in the room. Please ask other players to exit the room first.')
		return
	}
	if (userId === hostId && playerElement.childElementCount === 1) {
		const userResponse = confirm('Do you want to proceed? This will delete the room.')
		if (userResponse) {
			const response = await fetch(`/host_exit/${roomId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					userId: parseInt(userId),
					roomId: parseInt(roomId),
				}),
			})
			if (response.ok) {
				socket.emit('delete room', {roomId: roomId, userId: userId})
				window.location.href = '/lobby'
			} else {
				window.alert('Failed to delete room:', data.message) // Display server error message if available
			}
			return
		} else {
			return
		}
	}
	socket.emit('exit room', {roomId: roomId, userId: userId})

	window.location.href = '/lobby'
}

/* Create player element for new design */
const createPlayerElement = (userId, username) => {
	const cardPlayer = createElement('div', {class: 'card'}, `player-${userId}`)
	const faceTag = createElement('i', {class: 'fa-solid fa-face-smile'})

	const cardContent = createElement('div', {class: 'card-content'})
	const playerTag = createElement('p', {class: 'name'}, `username-${userId}`, username.toUpperCase())
	cardContent.append(playerTag)

	const statusText = createElement('span', {class: 'userStatus'}, `status-${userId}`, 'Not Ready')
	const statusColor = createElement('span', {class: 'statusColor', style: 'background-color: rgb(255, 0, 0)'}, `status-color-${userId}`)

	cardPlayer.append(faceTag, cardContent, statusText, statusColor)
	return cardPlayer
}

// const createButtonForPlayer()

function addPlayer(player, roomId, userId) {
	const playerContainer = getByID('players')
	let playerCard = getByID(`player-${userId}`)

	if (!playerCard) {
		playerCard = createPlayerElement(userId, player)

		const divStartAndExit = createElement('div', {class: 'actionBtn'})
		if (userId === sessionUserId) {
			const readyButton = createElement('button', {class: 'button ready'}, `readyButton-${userId}`, 'Not Ready')
			readyButton.onclick = () => {
				markReady(roomId, userId)
			}
			playerCard.append(readyButton)

			const exitButton = createElement('button', {class: 'exitButton'})
			exitButton.onclick = () => {
				exitRoom(roomId, userId)
			}
			divStartAndExit.appendChild(exitButton)
			playerCard.append(divStartAndExit)
		}

		if (hostId === sessionUserId && userId !== sessionUserId) {
			const kickButton = createElement('button', {class: 'buttons kick'}, null, 'Kick')
			kickButton.onclick = function () {
				kick(roomId, userId)
			}
			playerCard.appendChild(kickButton)
		}
		playerContainer.appendChild(playerCard)

		/*
        // playerCard = document.createElement('div')
		// playerCard.className = 'player'
		// playerCard.id = `player-${userId}`

		// const playerInfo = document.createElement('p')

		// const usernameSpan = document.createElement('span')
		// usernameSpan.id = `username-${userId}`
		// usernameSpan.textContent = player

		// const statusSpan = document.createElement('span')
		// statusSpan.id = `status-${userId}`
		// statusSpan.textContent = 'Not Ready'

		// playerInfo.appendChild(usernameSpan)
		// playerInfo.appendChild(document.createTextNode(' - '))
		// playerInfo.appendChild(statusSpan)

		// playerCard.appendChild(playerInfo)
        */

		// Create buttons for the current session user
		// if (userId === sessionUserId) {
		// 	// Assuming sessionUserId is globally defined
		// 	const readyButton = document.createElement('button')
		// 	readyButton.id = `readyButton-${userId}`
		// 	readyButton.textContent = 'Ready'
		// 	readyButton.onclick = function () {
		// 		markReady(roomId, userId)
		// 	}
		// 	playerInfo.appendChild(readyButton)

		// 	const exitButton = document.createElement('button')
		// 	exitButton.textContent = 'Exit'
		// 	exitButton.onclick = function () {
		// 		exitRoom(roomId, userId)
		// 	}
		// 	playerInfo.appendChild(exitButton)
		// }

		// Create a kick button if the current session user is the host and not the same as the player
		// if (hostId === sessionUserId && userId !== sessionUserId) {
		// 	// Assuming hostId is globally defined
		// 	const kickButton = document.createElement('button')
		// 	kickButton.textContent = 'Kick'
		// 	kickButton.onclick = function () {
		// 		kick(roomId, userId)
		// 	}
		// 	playerInfo.appendChild(kickButton)
		// }

		// playerContainer.appendChild(playerCard)
	}
}

function kick(roomId, userId) {
	socket.emit('exit room', {roomId: roomId, userId: userId})
	socket.emit('kicking player', {roomId: roomId, userId: userId})
}

socket.on('player kicked', function (data) {
	user_id = parseInt(data.userId)
	session_id = parseInt(sessionUserId)
	console.log(user_id === session_id)
	if (user_id === session_id) {
		window.alert('You have been kicked from the room.')
		window.location.href = '/lobby'
	}
})

function startGame() {
	const playersContainer = document.getElementById('players')
	const players = playersContainer.querySelectorAll('.card')
	const playerIds = Array.from(players).map((player) => parseInt(player.id.replace('player-', '')))

	if (playerIds.length < 2 || playerIds.length > 4) {
		window.alert('You need at least 2 and maximum 4 players to start the game')
		return
	}
	const allPlayers = document.querySelectorAll('.userStatus') // Get all player divs
	const playersStatus = Array.from(allPlayers).map((player) => player.innerText)

	if (playersStatus.includes('Not Ready')) {
		window.alert('Not all players are ready.')
		return
	}

	const userResponse = window.confirm('Are you sure you want to start the game?')
	if (!userResponse) return
	startingGame(playerIds, roomId, hostId)

	// Old version:
	// const playersDiv = document.getElementById('players');
	// const players = playersDiv.getElementsByClassName('player');
	// const playerIds = Array.from(players).map(player => parseInt(player.id.replace('player-', '')));
	// if (playerIds.length < 4) {
	//     window.alert('You need at least 4 players to start the game');
	//     return;
	// }
	// const allPlayers = document.querySelectorAll('#players .player'); // Get all player divs
	// let allReady = true; // Assume all are ready initially

	// allPlayers.forEach(player => {
	//     const statusSpan = player.querySelector('span[id^="status-"]'); // Get the status span
	//     if (statusSpan.textContent.trim() !== 'Ready') { // Check if the text is not 'Ready'
	//         allReady = false; // Set allReady to false if any player is not ready
	//     }
	// });

	// if (allReady) {
	//     const userResponse = window.confirm("Are you sure you want to start the game?")
	//     if (!userResponse) {
	//         return;
	//     }
	//     startingGame(playerIds, roomId, hostId);
	// } else {
	//     window.alert("Not all players are ready.");
	// }
}

async function startingGame(playerIds, roomId, hostId) {
	try {
		const response = await fetch(`/starting_game/${roomId}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				host_id: parseInt(hostId),
				players: playerIds,
				room_id: parseInt(roomId),
			}),
		})
		const data = await response.json() // Convert the response to JSON
		if (response.ok) {
			socket.emit('starting game', {roomId: roomId})
			window.location.href = `/game/${roomId}` // Redirect only if fetch was successful
		} else {
			window.alert('Failed to join room:', data.message) // Display server error message if available
		}
	} catch (error) {
		console.error('Failed to join room', error)
	}
}
socket.on('game started', function (data) {
	window.location.href = `/game/${data.roomId}`
})
