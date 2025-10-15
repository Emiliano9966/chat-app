// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyAdJ2gLIuPMKoSC9CMlvYpK_GIJBONZaz4",
  authDomain: "chat-app-c26ce.firebaseapp.com",
  databaseURL: "https://chat-app-c26ce-default-rtdb.firebaseio.com/",
  projectId: "chat-app-c26ce",
  storageBucket: "chat-app-c26ce.firebasestorage.app",
  messagingSenderId: "184708383215",
  appId: "1:184708383215:web:7ef6d3b7060e52796f361a",
  measurementId: "G-YX3CM2QRZB"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// DOM Elements
const overlay = document.getElementById("username-overlay");
const usernameInput = document.getElementById("username-input");
const usernameSubmit = document.getElementById("username-submit");
const chatDisplay = document.getElementById("chat-display");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");

let username = "";

// --- Username overlay ---
usernameSubmit.addEventListener("click", setUsername);
usernameInput.addEventListener("keypress", e => { if(e.key==="Enter") setUsername(); });

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

// --- Push message to Firebase ---
function pushMessage(sender, text) {
  const msg = { sender, text, ts: Date.now() };
  db.ref("messages").push(msg);
}

// --- Listen for new messages ---
db.ref("messages").limitToLast(100).on("child_added", snapshot => {
  const m = snapshot.val();
  const msgElement = document.createElement("div");
  msgElement.classList.add("message");
  if (m.sender === username) msgElement.classList.add("self");

  const timestamp = new Date(m.ts).toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"});

  msgElement.innerHTML = `
    <span class="timestamp">${timestamp}</span>
    <span class="username">${m.sender}</span>
    <span class="colon">:</span>
    <span class="text">${m.text}</span>
  `;
  chatDisplay.appendChild(msgElement);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
});

// --- Send message ---
sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", e => { if(e.key==="Enter") sendMessage(); });

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  pushMessage(username || "Anonymous", text);
  messageInput.value = "";
}
