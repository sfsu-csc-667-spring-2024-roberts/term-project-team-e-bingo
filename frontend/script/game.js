const createElement = (tag, attributes, id, content) => {
	const element = document.createElement(tag)
	for (const key in attributes) {
		element.setAttribute(key, attributes[key])
	}
	if (id) element.id = id
	if (content) element.textContent = content
	return element
}
const totalNumbers = 75
const deck = Array.from({length: totalNumbers}, (_, i) => i + 1)
const calledNumbers = deck.filter((number) => !drawnNumbers.includes(number))
// Function to shuffle an array
function shuffle(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[array[i], array[j]] = [array[j], array[i]] // Swap elements
	}
}

// Shuffle the numbers initially
shuffle(calledNumbers)

function generateRandomNumber() {
	if (calledNumbers.length === 0) {
		return null
	}
	return calledNumbers.pop()
}

function updateBingoNumber(number) {
	const bossCell = document.getElementById('boss')
	bossCell.textContent = data.number
}

socket.on('number generated', function (data) {
	// console.log('socket.on: ' + data)
	const calledNumbersDiv = document.getElementById('called-numbers')
	calledNumbersDiv.append(createElement('div', {class: 'ball'}, null, data.number))
	calledNumbersDiv.scrollLeft = calledNumbersDiv.scrollWidth
	document.getElementById('boss').innerText = data.number
})



function startSynchronizedTimer(startTime, maxDuration, display) {
	const start = new Date(startTime).getTime() // Get start time in milliseconds
	const totalDuration = maxDuration * 60 * 1000 // Convert maxDuration from minutes to milliseconds

	const countdown = setInterval(function () {
		const now = Date.now() // Current time in milliseconds
		const elapsedTime = now - start // Time elapsed since start in milliseconds
		let remainingTime = totalDuration - elapsedTime // Remaining time in milliseconds

		if (remainingTime < 0) {
			clearInterval(countdown)
			display.textContent = '00:00'
			console.log('Time up! Game Over.')
			// Optionally trigger any end of game logic here
			return
		}

		// Convert remaining time from milliseconds to minutes and seconds
		let secondsLeft = Math.floor(remainingTime / 1000)
		let minutes = parseInt(secondsLeft / 60, 10)
		let seconds = parseInt(secondsLeft % 60, 10)

		minutes = minutes < 10 ? '0' + minutes : minutes
		seconds = seconds < 10 ? '0' + seconds : seconds

		display.textContent = minutes + ':' + seconds
	}, 1000)
}

window.onload = async function () {
	const maxGameTime = 10 // Maximum game time in minutes
	var display = document.querySelector('#timer')
	startSynchronizedTimer(startTime, maxGameTime, display)
	if (userId == hostId) {
		const response = await fetch(`/api/draw_number/${roomId}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				roomId: parseInt(roomId),
			}),
		})
		if (!response.ok) {
			socket.emit('generate random number', {
				roomId: roomId,
			})
		}
	}
}

function callNumber() {
	setInterval(function () {
		// console.log(`host Id = ${hostId}, user id = ${userId}`)
		if (userId == hostId) {
			const number = generateRandomNumber()
			if (number == null) {
				return
			}
			socket.emit('generate random number', {
				roomId: roomId,
				userId: userId,
				session: userId,
				number: number,
			})
		}
	}, 1000)
}

function markNumber(cell) {
	const [playerId, row, col] = cell.id.split('-')
	const cell_id = cell.id
	const isMarked = cell.classList.contains('marked')
	socket.emit('user marked number', {roomId, playerId, row, col, isMarked, cell_id})
}

socket.on('update card marked', function (data) {
	const userCard = document.getElementById(`${data.playerId}-${data.row}-${data.col}`)
	userCard.classList.toggle('marked')
})

function checkWon(user_id, room_id) {
	socket.emit('check won', {user_id: user_id, room_id: room_id, user_name: userName})
}

socket.on('player won', function (data) {
	if (userId == data.playerId) {
		socket.emit('game ended', {roomId: roomId})
		alert('You won the game!')
	} else {
		alert(data.playerUsername + ' won the game!')
	}
})
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

socket.on('finished cleanup', async function (data) {
	await sleep(1000)
	window.location.href = `/waiting/${data.roomId}`
})
socket.on('player not won', function (data) {
	if (userId == data.playerId) {
		alert('You did not win, check your card again!')
	}
})

// document.querySelectorAll('.bingo-cell').forEach(function (cell, index) {
// 	cell.addEventListener('click', function () {
// 		var playerId = this.parentElement.parentElement.id
// 		handleClick(playerId, index + 1)
// 	})
// })

// function handleClick(playerId, number) {
// 	console.log('Number: ' + number)
// 	markNumber(playerId, number)
// }
