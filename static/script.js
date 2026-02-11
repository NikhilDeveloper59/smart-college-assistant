/* ===============================
   ELEMENT REFERENCES
================================ */
const themeToggle = document.getElementById("theme-toggle");
const body = document.body;
const chatBody = document.getElementById("chat-body");
const userInput = document.getElementById("user-input");
const sendBtn = document.querySelector(".send-btn");
const micBtn = document.getElementById("mic-btn");
const listeningIndicator = document.getElementById("listening-indicator");

/* ===============================
   THEME TOGGLE
================================ */
if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        localStorage.setItem(
            "theme",
            body.classList.contains("dark-mode") ? "dark" : "light"
        );
        themeToggle.textContent = body.classList.contains("dark-mode") ? "🌙" : "☀️";
    });
}

window.addEventListener("load", () => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
        body.classList.remove("dark-mode");
        if (themeToggle) themeToggle.textContent = "☀️";
    }
});

/* ===============================
   TIME FORMAT
================================ */
function getTime() {
    return new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

/* ===============================
   ADD MESSAGE
================================ */
function addMessage(text, sender = "bot") {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;

    const timestamp = document.createElement("div");
    timestamp.className = "timestamp";
    timestamp.textContent = getTime();

    bubble.appendChild(timestamp);
    messageDiv.appendChild(bubble);
    chatBody.appendChild(messageDiv);

    chatBody.scrollTop = chatBody.scrollHeight;

    return messageDiv; // 🔥 IMPORTANT
}

/* ===============================
   TYPING INDICATOR
================================ */
function showTypingIndicator() {
    if (!chatBody) return;

    const typingDiv = document.createElement("div");
    typingDiv.id = "typing";
    typingDiv.className = "message bot";

    typingDiv.innerHTML = `
        <div class="bubble">
            <div class="typing-dots">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;
    chatBody.appendChild(typingDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
}

function removeTypingIndicator() {
    const typing = document.getElementById("typing");
    if (typing) typing.remove();
}

/* ===============================
   SEND MESSAGE
================================ */

const MAIN_FEATURE_OPTIONS = [
    { label: "🎓 Admissions", value: "admissions" },
    { label: "📄 Documents", value: "documents" },
    { label: "💰 Fees & Scholarship", value: "fees" },
    { label: "🏫 Branches", value: "branches" },
    { label: "💼 Placement", value: "placement" },
    { label: "📚 Exams & Results", value: "exams" },
    { label: "🏠 Hostel & Mess", value: "hostel" },
    { label: "💻 Projects", value: "projects" },
    { label: "🎯 Interview & Resume", value: "resume" },
    { label: "😊 Motivation", value: "motivation" }
];

function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessage(message, "user");
    userInput.value = "";

    showTypingIndicator();

    fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
    })
    .then(res => {
        if (!res.ok) {
            throw new Error("Network response not ok");
        }
        return res.json();
    })
    .then(data => {
    removeTypingIndicator();

   if (data && data.reply) {
    addMessage(data.reply, "bot");

    // ✅ Wait for DOM to update
    setTimeout(() => {
        if (data.follow_up && data.follow_up.length > 0) {

            // 🔥 Get the LAST bot message bubble
            const botMessages = document.querySelectorAll(".message.bot");
            const lastBotMessage = botMessages[botMessages.length - 1];
            const bubble = lastBotMessage.querySelector(".bubble");

            // Create suggestion container
            const suggestionContainer = document.createElement("div");
            suggestionContainer.className = "suggestion-container";

            data.follow_up.forEach(suggestion => {
                const btn = document.createElement("button");
                btn.className = "suggestion-btn";
                btn.textContent = suggestion;

                btn.onclick = () => {
                    userInput.value = suggestion;
                    sendMessage();
                };

                suggestionContainer.appendChild(btn);
            });

            // ✅ Append INSIDE the bubble
            bubble.appendChild(suggestionContainer);

            chatBody.scrollTop = chatBody.scrollHeight;
        }
    }, 100);

    } else {
        addMessage("⚠ Unexpected server response.", "bot");
    }

    const msg = message.toLowerCase();

    // Branch button clicked
    if (msg === "branches") {
        showOptions(BRANCH_OPTIONS);
        return;
    }

    // Otherwise DO NOT hide automatically
    })
    .catch(error => {
        console.error("Fetch error:", error);
        removeTypingIndicator();
        addMessage("Server error 😕 Please try again.", "bot");
    });
}

/* ===============================
   VOICE INPUT
================================ */
let recognition;
let isListening = false;

if ("webkitSpeechRecognition" in window && micBtn) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    micBtn.addEventListener("click", () => {
        if (!isListening) {
            recognition.start();
            isListening = true;
            if (listeningIndicator)
                listeningIndicator.classList.remove("hidden");
        } else {
            recognition.stop();
        }
    });

    recognition.onresult = event => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        userInput.value = transcript;
    };

    recognition.onend = () => {
        isListening = false;
        if (listeningIndicator)
            listeningIndicator.classList.add("hidden");
    };
}

/* ===============================
   EVENT LISTENERS
================================ */
if (sendBtn)
    sendBtn.addEventListener("click", sendMessage);

userInput.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
});

/* ===============================
   SHOW OPTIONS
================================ */
const FACILITY_OPTIONS = [
    { label: "🏫 Branches", value: "branches" },
    { label: "🍽 Mess", value: "mess" },
    { label: "🎓 Workshop", value: "workshop" },
    { label: "🏆 Sports", value: "sports" },
    { label: "💼 Placement", value: "placement" }
];

const BRANCH_OPTIONS = [
    { label: "💻 CSE", value: "cse branch" },
    { label: "📡 ECE", value: "ece branch" },
    { label: "⚙ ME", value: "me branch" },
    { label: "🏗 Civil", value: "civil branch" }
];

const optionsDiv = document.getElementById("dynamic-options");

function showOptions(options) {
    if (!optionsDiv) return;

    optionsDiv.innerHTML = "";
    optionsDiv.classList.remove("hidden");

    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "option-btn";
        btn.textContent = opt.label;

        btn.onclick = () => {
            optionsDiv.classList.add("hidden");
            userInput.value = opt.value;
            sendMessage();
        };

        optionsDiv.appendChild(btn);
    });
}

function hideOptions() {
    if (!optionsDiv) return;

    optionsDiv.classList.add("hidden");
    optionsDiv.innerHTML = "";
}


/* ===============================
   AUTO WELCOME MESSAGE
================================ */

window.addEventListener("load", () => {

    setTimeout(() => {
        showTypingIndicator();

        setTimeout(() => {
            removeTypingIndicator();

            const hour = new Date().getHours();
            let greeting;

            if (hour >= 5 && hour < 12) {
                greeting = "🌅 Good Morning";
            } else if (hour >= 12 && hour < 17) {
                greeting = "☀️ Good Afternoon";
            } else if (hour >= 17 && hour < 21) {
                greeting = "🌇 Good Evening";
            } else {
                greeting = "🌙 Welcome";
            }

            addMessage(
                `${greeting} 👋\n\nWelcome to Smart College Assistant 🤖\nHow can I help you today?`,
                "bot"
            );

        }, 1200);

    }, 600);
});


// Top feature button show 
function sendTopFeature(value) {

    // remove previous active
    document.querySelectorAll(".top-features button")
        .forEach(btn => btn.classList.remove("active"));

    // highlight clicked
    event.target.classList.add("active");

    const userInput = document.getElementById("user-input");
    userInput.value = value;
    sendMessage();
}

