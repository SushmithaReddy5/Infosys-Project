const chat = document.getElementById("chat");
const typingDiv = document.getElementById("typing");

/* ask username until valid */

let username = "";

while (!username) {
  username = prompt("Enter your name:");

  if (username) {
    username = username.trim();
  }
}

const socket = new WebSocket("ws://localhost:8000/ws");

/* color generator */

const colors = [
  "#ff6b6b",
  "#4ecdc4",
  "#1a73e8",
  "#ff9f43",
  "#6c5ce7",
  "#00b894",
  "#e84393",
];

let userColors = {};

function getColor(user) {
  if (!userColors[user]) {
    userColors[user] = colors[Math.floor(Math.random() * colors.length)];
  }

  return userColors[user];
}

socket.onopen = () => {
  socket.send(
    JSON.stringify({
      username: username,
    }),
  );
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  const div = document.createElement("div");

  if (data.type === "chat") {
    div.classList.add("message");

    div.style.background = getColor(data.username);

    div.innerHTML =
      "<b>" + data.username + "</b> [" + data.time + "] : " + data.message;

    chat.appendChild(div);
  }

  if (data.type === "system") {
    div.classList.add("system");

    div.innerText = data.message;

    chat.appendChild(div);
  }

  if (data.type === "typing") {
    typingDiv.innerText = data.username + " is typing...";
  }

  if (data.type === "stop_typing") {
    typingDiv.innerText = "";
  }

  chat.scrollTop = chat.scrollHeight;
};

function sendMessage() {
  const msg = document.getElementById("msg").value;

  if (msg === "") return;

  socket.send(
    JSON.stringify({
      type: "chat",
      message: msg,
    }),
  );

  socket.send(
    JSON.stringify({
      type: "stop_typing",
    }),
  );

  document.getElementById("msg").value = "";
}

document.getElementById("msg").addEventListener("input", () => {
  socket.send(
    JSON.stringify({
      type: "typing",
    }),
  );
});
