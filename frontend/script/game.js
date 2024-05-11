const createElement = (tag, attributes, id, content) => {
	const element = document.createElement(tag)
	for (const key in attributes) {
		element.setAttribute(key, attributes[key])
	}
	if (id) element.id = id
	if (content) element.textContent = content
	return element
}


function generateRandomNumber() {
	return Math.floor(Math.random() * 75) + 1
}

function updateBingoNumber(number) {
	const bossCell = document.getElementById('boss')
	bossCell.textContent = data.number
}

const calledNumbers = document.getElementById('called-numbers')
const currentNumber = document.getElementById('boss')


socket.on('number generated', function (data) {
	console.log('socket.on: ' + data)
	
	calledNumbers.append( createElement('div', {class:'ball'}, null, data.number) )
	calledNumbers.scrollLeft = calledNumbers.scrollWidth;
	document.getElementById('boss').innerText = data.number
})

function callNumber() {
	setInterval(function () {
		// console.log(`host Id = ${hostId}, user id = ${userId}`)
		if (userId == hostId) {
			const number = generateRandomNumber()
			socket.emit('generate random number', {
				roomId: roomId,
				userId: userId,
				session: userId,
				number: number,
			})
		}
	}, 7000)
}


function startTimer(duration, display) {
	let timer = duration,
		minutes,
		seconds
	setInterval(function () {
		minutes = parseInt(timer / 60, 10)
		seconds = parseInt(timer % 60, 10)

		minutes = minutes < 10 ? '0' + minutes : minutes
		seconds = seconds < 10 ? '0' + seconds : seconds

		display.textContent = minutes + ':' + seconds

		if (--timer < 0) {
			timer = duration
		}
	}, 1000)
}

window.onload = function () {
	var minutes = 8.74
	var display = document.querySelector('#timer')
	startTimer(minutes * 60, display)
	callNumber()
}


function markNumber(cell) {
	const [playerId, row, col, number] = cell.id.split('-');
	const isMarked = cell.classList.contains("marked");
	socket.emit('user marked number', { roomId, playerId, row, col, number, isMarked  })
	
}

socket.on('update card marked', function (data) {
	const userCard = document.getElementById(`${data.playerId}-${data.row}-${data.col}-${data.number}`)
	userCard.classList.toggle('marked')
})


const BINGO = (userID) => {
	console.log(userID)
}


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
