function generateRandomNumber() {
  return Math.floor(Math.random() * 75) + 1;
}

function markNumber(cell) {
  cell.classList.add("marked");
}

function updateBingoNumber(number) {
  const bossCell = document.getElementById("boss");
  bossCell.textContent = data.number;
}

socket.on("number generated", function (data) { 
    console.log("socket.on: " + data)
  const calledNumbersDiv = document.getElementById("called-numbers");
  calledNumbersDiv.innerHTML += data.number + ", ";
  document.getElementById("boss").innerText = "Boss: " + data.number;
});

function callNumber() {
  setInterval(function () {
    console.log(`host Id = ${hostId}, user id = ${userId}`)
    if (userId == hostId) {
        
        const number = generateRandomNumber();
        socket.emit("generate random number", {
        roomId: roomId,
        userId: userId,
        session: userId,
        number: number,
      });
    }
  }, 7000);
}

function handleClick(playerId, number) {
  console.log("Number: " + number);
  markNumber(playerId, number);
}

function startTimer(duration, display) {
  let timer = duration,
    minutes,
    seconds;
  setInterval(function () {
    minutes = parseInt(timer / 60, 10);
    seconds = parseInt(timer % 60, 10);

    minutes = minutes < 10 ? "0" + minutes : minutes;
    seconds = seconds < 10 ? "0" + seconds : seconds;

    display.textContent = minutes + ":" + seconds;

    if (--timer < 0) {
      timer = duration;
    }
  }, 1000);
}

window.onload = function () {
  var minutes = 8.74;
  var display = document.querySelector("#timer");
  startTimer(minutes * 60, display);
  callNumber();
};

document.querySelectorAll(".bingo-cell").forEach(function (cell, index) {
  cell.addEventListener("click", function () {
    var playerId = this.parentElement.parentElement.id;
    handleClick(playerId, index + 1);
  });
});

