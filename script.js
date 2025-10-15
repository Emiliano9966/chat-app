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

// --- Banned words list for usernames ---
const bannedWords = ["nigger", "nigga"]; // Add your full list

// --- Username overlay ---
usernameSubmit.addEventListener("click", setUsername);
usernameInput.addEventListener("keypress", e => { if(e.key==="Enter") setUsername(); });

function setUsername() {
  let name = usernameInput.value.trim().toLowerCase(); // convert to lowercase
  if (!name) return;

  // Check for banned words
  for (const word of bannedWords) {
    if (name.includes(word)) {
      alert("Please choose a username without bad words!");
      return;
    }
  }

  username = name;
  overlay.style.display = "none";
  messageInput.disabled = false;
  sendButton.disabled = false;

  const notice = document.createElement("div");
  notice.classList.add("notice");
  notice.textContent = `You are now chatting as: ${username}`;
  chatDisplay.appendChild(notice);
}

// --- Daily Wipe ---
function dailyWipe() {
  const lastWipe = localStorage.getItem("lastWipe") || "";
  const today = new Date().toISOString().slice(0,10); // YYYY-MM-DD

  if(lastWipe !== today) {
    db.ref("messages").remove(); // wipe all messages
    localStorage.setItem("lastWipe", today);
    console.log("Daily chat wipe executed!");
    
    // Optional: show a notice in chat
    const notice = document.createElement("div");
    notice.classList.add("notice");
    notice.textContent = "Chat has been wiped for the day.";
    chatDisplay.appendChild(notice);
  }
}
dailyWipe();

// --- Push message & trim old messages ---
const MAX_MESSAGES = 500;

function pushMessage(sender, text) {
  const msg = { sender, text, ts: Date.now() };
  const ref = db.ref("messages");

  ref.push(msg).then(() => {
    // Keep only last MAX_MESSAGES
    ref.orderByChild("ts").once("value", snapshot => {
      const messages = snapshot.val();
      const keys = Object.keys(messages || {});
      if(keys.length > MAX_MESSAGES) {
        const oldest = keys.slice(0, keys.length - MAX_MESSAGES);
        oldest.forEach(k => ref.child(k).remove());
      }
    });
  });
}

// --- Listen for new messages ---
db.ref("messages").limitToLast(MAX_MESSAGES).on("child_added", snapshot => {
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
  if(!text) return;
  pushMessage(username || "Anonymous", text);
  messageInput.value = "";
}
