socket.on('player ready', function (data) {
    const { userId } = data;
    const statusElement = document.getElementById('status-' + userId);
    if (statusElement) {
        if (statusElement.textContent === 'Ready') {
            statusElement.textContent = 'Not Ready';
        } else {
            statusElement.textContent = 'Ready';
        }
    }
    const buttonElement = document.getElementById('readyButton-' + userId);
    if (buttonElement) {
        if (buttonElement.textContent === 'Ready') {
            buttonElement.textContent = 'Not Ready';
        } else {
            buttonElement.textContent = 'Ready';
        }
    }
});

// Listen for 'player exited' events
socket.on('player exited', function (data) {
    const { userId } = data;
    // Example: Remove the player's element or update it to show they've exited
    const playerElement = document.getElementById('player-' + userId);
    if (playerElement) {
        playerElement.parentNode.removeChild(playerElement);
    }
});

socket.on('new player joined', function (data) {
    const player = data.username;
    const roomId = data.roomId;
    const userId = data.userId;
    addPlayer(player, roomId, userId);
});
function markReady(roomId, userId) {
    console.log("clicked ready")
    socket.emit('player ready', { roomId: roomId, userId: userId });
}

function exitRoom(roomId, userId) {
    console.log("clicked exit")
    const playerElement = document.getElementById(`players`);
    if (userId === hostId && playerElement.childElementCount > 1) {
        window.alert('Host cannot exit the room if there are other players in the room. Please ask other players to exit the room first.');
        return;
    }
    if (userId === hostId && playerElement.childElementCount === 1) {
        const userResponse = confirm("Do you want to proceed? This will delete the room.");
        if (userResponse) {
            socket.emit('exit room', { roomId: roomId, userId: userId });
            socket.emit('delete room', { roomId: roomId, userId: userId });
            window.location.href = '/lobby';
            return;
        }
        else {
            return;
        }
    }
    socket.emit('exit room', { roomId: roomId, userId: userId });

    window.location.href = '/lobby';
}



function addPlayer(player, roomId, userId) {
    const playersDiv = document.getElementById('players');
    let playerDiv = document.getElementById(`player-${userId}`);

    // If playerDiv does not exist, create it
    if (!playerDiv) {
        playerDiv = document.createElement('div');
        playerDiv.className = 'player';
        playerDiv.id = `player-${userId}`;

        const playerInfo = document.createElement('p');

        const usernameSpan = document.createElement('span');
        usernameSpan.id = `username-${userId}`;
        usernameSpan.textContent = player;

        const statusSpan = document.createElement('span');
        statusSpan.id = `status-${userId}`;
        statusSpan.textContent = 'Not Ready';

        playerInfo.appendChild(usernameSpan);
        playerInfo.appendChild(document.createTextNode(' - '));
        playerInfo.appendChild(statusSpan);

        playerDiv.appendChild(playerInfo);

        // Create buttons for the current session user
        if (userId === sessionUserId) { // Assuming sessionUserId is globally defined
            const readyButton = document.createElement('button');
            readyButton.id = `readyButton-${userId}`;
            readyButton.textContent = 'Ready';
            readyButton.onclick = function () { markReady(roomId, userId); };
            playerInfo.appendChild(readyButton);

            const exitButton = document.createElement('button');
            exitButton.textContent = 'Exit';
            exitButton.onclick = function () { exitRoom(roomId, userId); };
            playerInfo.appendChild(exitButton);
        }

        // Create a kick button if the current session user is the host and not the same as the player
        if (hostId === sessionUserId && userId !== sessionUserId) { // Assuming hostId is globally defined
            const kickButton = document.createElement('button');
            kickButton.textContent = 'Kick';
            kickButton.onclick = function () { kick(roomId, userId); };
            playerInfo.appendChild(kickButton);
        }

        playersDiv.appendChild(playerDiv);
    }
}

function kick(roomId, userId) {
    socket.emit('exit room', { roomId: roomId, userId: userId });
    socket.emit('kicking player', { roomId: roomId, userId: userId });
}

socket.on('player kicked', function (data) {
    user_id = parseInt(data.userId);
    session_id = parseInt(sessionUserId);
    console.log(user_id === session_id)
    if (user_id === session_id) {
        window.alert('You have been kicked from the room.');
        window.location.href = '/lobby';
    }
});





function startGame() {
    const playersDiv = document.getElementById('players');
    const players = playersDiv.getElementsByClassName('player');
    const playerIds = Array.from(players).map(player => parseInt(player.id.replace('player-', '')));
    if (playerIds.length < 4) {
        window.alert('You need at least 4 players to start the game');
        return;
    }
    const allPlayers = document.querySelectorAll('#players .player'); // Get all player divs
    let allReady = true; // Assume all are ready initially

    allPlayers.forEach(player => {
        const statusSpan = player.querySelector('span[id^="status-"]'); // Get the status span
        if (statusSpan.textContent.trim() !== 'Ready') { // Check if the text is not 'Ready'
            allReady = false; // Set allReady to false if any player is not ready
        }
    });

    if (allReady) {
        const userResponse = window.confirm("Are you sure you want to start the game?")
        if (!userResponse) {
            return;
        }
        startingGame(playerIds, roomId, hostId);
    } else {
        window.alert("Not all players are ready.");
    }
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
                room_id: parseInt(roomId)
            }),
        });
        const data = await response.json(); // Convert the response to JSON
        if (response.ok) {
            socket.emit('starting game', { roomId: roomId })
            window.location.href = `/game/${roomId}`; // Redirect only if fetch was successful
        } else {
            window.alert('Failed to join room:', data.message); // Display server error message if available
        }
    } catch (error) {
        console.error('Failed to join room', error);
    }
}
socket.on('game started', function (data) {
    window.location.href = `/game/${data.roomId}`;
});