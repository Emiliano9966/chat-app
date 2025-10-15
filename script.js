const ws = new WebSocket("wss://echo.websocket.org");
const chatDisplay = document.getElementById("chat-display");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");

let username = "";

// Username overlay
const overlay = document.getElementById("username-overlay");
const usernameInput = document.getElementById("username-input");
const usernameSubmit = document.getElementById("username-submit");

usernameSubmit.addEventListener("click", setUsername);
usernameInput.addEventListener("keypress", e => {
  if (e.key === "Enter") setUsername();
});

function setUsername() {
  const name = usernameInput.value.trim();
  if (!name) return;
  username = name;
  overlay.style.display = "none";
  messageInput.disabled = false;
  sendButton.disabled = false;

  const notice = document.createElement("div");
  notice.classList.add("notice");
  notice.textContent = `You are now chatting as: ${username}`;
  chatDisplay.appendChild(notice);
}

ws.onopen = () => console.log("Connected to WebSocket");

ws.onmessage = (event) => {
  addMessage(event.data, "other");
};

sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function sendMessage() {
  const message = messageInput.value.trim();
  if (message && ws.readyState === WebSocket.OPEN) {
    ws.send(message);
    addMessage(message, "self", username);
    messageInput.value = "";
  }
}

function addMessage(message, type, sender = "Anonymous") {
  const msgElement = document.createElement("div");
  msgElement.classList.add("message");
  if (type === "self") msgElement.classList.add("self");

  const timestamp = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  msgElement.innerHTML = `
    <span class="timestamp">${timestamp}</span>
    <span class="username">${sender}</span>
    <span class="colon">:</span>
    <span class="text">${message}</span>
  `;

  chatDisplay.appendChild(msgElement);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
}
