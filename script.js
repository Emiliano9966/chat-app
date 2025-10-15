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
let replyTo = null;

// --- Banned words for usernames ---
const bannedWords = ["nigger", "nigga"];

// --- Username overlay ---
usernameSubmit.addEventListener("click", setUsername);
usernameInput.addEventListener("keypress", e => { if (e.key === "Enter") setUsername(); });

function setUsername() {
  let name = usernameInput.value.trim().toLowerCase();
  if (!name) return;

  for (const word of bannedWords) {
    if (name.includes(word)) {
      alert("err: user not allowed");
      return;
    }
  }

  username = name;
  overlay.style.display = "none";
  messageInput.disabled = false;
  sendButton.disabled = false;

  // Send a system message (orange glow)
  pushMessage("system", `${username} joined the chat`);
}

// --- Daily wipe ---
function dailyWipe() {
  const lastWipe = localStorage.getItem("lastWipe") || "";
  const today = new Date().toISOString().slice(0, 10);
  if (lastWipe !== today) {
    db.ref("messages").remove();
    localStorage.setItem("lastWipe", today);
  }
}
dailyWipe();

const MAX_MESSAGES = 500;

// --- Push message to database ---
function pushMessage(sender, text, replyId = null, isNotice = false) {
  const msg = { sender, text, ts: Date.now(), replyId, isNotice };
  const ref = db.ref("messages");

  ref.push(msg).then(() => {
    ref.orderByChild("ts").once("value", snapshot => {
      const messages = snapshot.val();
      const keys = Object.keys(messages || {});
      if (keys.length > MAX_MESSAGES) {
        const oldest = keys.slice(0, keys.length - MAX_MESSAGES);
        oldest.forEach(k => ref.child(k).remove());
      }
    });
  });
}

// --- Listen for new messages ---
db.ref("messages").limitToLast(MAX_MESSAGES).on("child_added", snapshot => {
  const id = snapshot.key;
  const m = snapshot.val();

  const msgElement = document.createElement("div");
  msgElement.classList.add("message");

  // Self highlight
  if (m.sender === username) msgElement.classList.add("self");

  // 🟧 Add system class for orange-glow messages
  if (m.sender === "system") msgElement.classList.add("system");

  const timestamp = new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const content = document.createElement("div");
  content.classList.add("message-content");

  const usernameClass = m.sender === "system" ? "username system" : "username";
  const colonClass = m.sender === "system" ? "colon system" : "colon"; // 🟧 colon glow for system

  content.innerHTML = `
    <span class="timestamp">${timestamp}</span>
    <span class="${usernameClass}">${m.sender}</span>
    <span class="${colonClass}">:</span>
    <span class="text">${m.text}</span>
    ${m.sender !== "system" ? '<span class="reply-btn" title="Reply">↩️</span>' : ""}
  `;

  // Reply button logic
  if (m.sender !== "system") {
    content.querySelector(".reply-btn").addEventListener("click", () => {
      replyTo = id;
      messageInput.placeholder = `Replying to ${m.sender}...`;
      messageInput.focus();
    });
  }

  msgElement.appendChild(content);

  // --- If message is a reply ---
  if (m.replyId) {
    db.ref("messages").child(m.replyId).once("value", snap => {
      const parent = snap.val();
      if (parent) {
        const replyEl = document.createElement("div");
        replyEl.classList.add("reply-container");
        replyEl.textContent = `${parent.sender}: ${parent.text}`;
        msgElement.appendChild(replyEl);
      }
    });
  }

  chatDisplay.appendChild(msgElement);
  chatDisplay.scrollTop = chatDisplay.scrollHeight;
});

// --- Send message ---
sendButton.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;

  pushMessage(username || "Anonymous", text, replyTo);
  messageInput.value = "";
  replyTo = null;
  messageInput.placeholder = "Type a message...";
}
