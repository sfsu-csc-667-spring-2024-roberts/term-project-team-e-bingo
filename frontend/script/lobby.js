const roomNameInput = document.getElementById('roomNameInput');
const createRoomBtn = document.getElementById('createRoomBtn');

createRoomBtn.onclick = () => {
    const roomName = roomNameInput.value;
    if (roomName) {
        socket.emit('create room', { roomName: roomName, user: user });
    }
};
socket.on('failed create room', (data) => {
    if (data.error && data.user === user) {
        alert(data.error);
    }
});


socket.on('update room', (room) => {
    if (room.user === user) {
        window.location.href = `/waiting/${room.roomId}`;
    } else {
        const roomsList = document.getElementById('roomsList');
        addEntry(room.user, room.roomName, room.roomId, room.status, roomsList, false);
    }
});
function addEntry(host, roomName, roomId, roomStatus, roomsList, isRejoin) {
    const row = document.createElement('tr');
    row.setAttribute('room', roomId);

    const roomNameCell = document.createElement('td');
    roomNameCell.textContent = roomName;

    const hostCell = document.createElement('td');
    hostCell.textContent = host;

    const actionCell = document.createElement('td');

    const joinButton = document.createElement('div');
    joinButton.id = `status-${roomId}`
    joinButton.classList.add('join-btn'); // Add a class for styling if needed
    joinButton.setAttribute('room-id', roomId); // Store room ID in data attribute

    if (isRejoin) {
        joinButton.textContent = 'Rejoin';
        joinButton.onclick = () => window.location.href = `/game/${roomId}`;
    } else if (!roomStatus) {
        joinButton.textContent = 'Join';
        joinButton.onclick = () => joinRoom(roomId);
    } else {
        joinButton.textContent = "Playing";
        joinButton.classList.add('playing')
    }

    actionCell.appendChild(joinButton);

    row.appendChild(roomNameCell);
    row.appendChild(hostCell);
    row.appendChild(actionCell);

    roomsList.appendChild(row);
}



socket.on('update status game', (data) => {
    const joinButton = document.getElementById(`status-${data.roomId}`);

    if (data.status) {
        joinButton.innerText = "Playing";
        joinButton.onclick = null;
        joinButton.classList.add('playing')
    } else {
        joinButton.innerText = "Join"
        joinButton.onclick = () => joinRoom(data.roomId);
        joinButton.classList.remove('playing')
    }
});

socket.on('room deleted', (data) => {
    const roomId = data.roomId;
    const roomElement = document.querySelector(`[room="${roomId}"]`);
    roomElement.parentNode.removeChild(roomElement);
});

async function fetchRooms() {
    try {
        const response = await fetch('/available_rooms');
        const rooms = await response.json();
        const roomsList = document.getElementById('roomsList');
        roomsList.innerHTML = ''; // Clear existing entries

        for (const room of rooms) {
            const isRejoin = await checkUserInRoomAndGameStarted(room.room_id);
            addEntry(room.host, room.room_name, room.room_id, room.status, roomsList, isRejoin);
        }
    } catch (error) {
        console.error('Failed to fetch rooms', error);
    }
}

async function joinRoom(roomId) {
    try {
        const response = await fetch(`/join_room/${roomId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user: user,
                roomId: roomId
            }),
        });
        const data = await response.json(); // Convert the response to JSON
        if (response.ok) {
            socket.emit('new player joined', { user: user, roomId: roomId });
            const response = await fetch(`/add_user_status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: user,
                    room_id: roomId
                }),
            });
            if (response.ok) {
                window.location.href = `/waiting/${roomId}`; // Redirect only if fetch was successful
            }
        }
    } catch (error) {
        console.error('Failed to join room', error);
    }
}

async function checkUserInRoomAndGameStarted(roomId) {
    try {
        const response = await fetch(`/check_user_and_game/${roomId}`);
        const data = await response.json();
        return data.isUserInRoom && data.isGameStarted;
    } catch (error) {
        console.error('Failed to check user and game status', error);
        return false;
    }
}

fetchRooms();
