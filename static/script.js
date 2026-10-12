
const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const messagesContainer = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const newChatButton = document.getElementById("new-chat");
const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.querySelector(".sidebar");

let conversation = [];
let isWaiting = false;

function createMessage(role, content) {
    const message = document.createElement("div");
    message.className = `message ${role}`;

    if (role === "assistant") {
        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.textContent = "✳";
        message.appendChild(avatar);
    }

    const messageContent = document.createElement("div");
    messageContent.className = "message-content";

    // Use textContent so responses are displayed safely as text.
    messageContent.textContent = content;

    message.appendChild(messageContent);
    messagesContainer.appendChild(message);

    message.scrollIntoView({
        behavior: "smooth",
        block: "end"
    });

    return message;
}

function showWelcome() {
    welcome.hidden = false;
    messagesContainer.replaceChildren();
}

function hideWelcome() {
    welcome.hidden = true;
}

function resizeInput() {
    messageInput.style.height = "auto";
    messageInput.style.height =
        Math.min(messageInput.scrollHeight, 180) + "px";
}

async function sendMessage(text) {
    const content = text.trim();

    if (!content || isWaiting) {
        return;
    }

    hideWelcome();

    conversation.push({
        role: "user",
        content
    });

    createMessage("user", content);

    messageInput.value = "";
    resizeInput();

    isWaiting = true;
    sendButton.disabled = true;
    sendButton.textContent = "…";
    messageInput.disabled = true;

    const loadingMessage = createMessage(
        "assistant",
        "Thinking..."
    );

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: conversation
            })
        });

        const data = await response.json();

        loadingMessage.remove();

        if (!response.ok) {
            throw new Error(
                data.error || "The request could not be completed."
            );
        }

        const reply = data.reply || "I couldn't generate a response.";

        conversation.push({
            role: "assistant",
            content: reply
        });

        createMessage("assistant", reply);
    } catch (error) {
        loadingMessage.remove();

        // Remove the unanswered user turn so it is not
        // accidentally resent as part of the conversation.
        conversation.pop();

        createMessage(
            "assistant",
            "Sorry, I couldn't get a response. " +
            error.message +
            "\n\nCheck that the server is running and your API key is configured."
        );
    } finally {
        isWaiting = false;
        sendButton.disabled = false;
        sendButton.textContent = "↑";
        messageInput.disabled = false;
        messageInput.focus();
    }
}

chatForm.addEventListener("submit", function (event) {
    event.preventDefault();
    sendMessage(messageInput.value);
});

messageInput.addEventListener("input", resizeInput);

messageInput.addEventListener("keydown", function (event) {
    if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.isComposing
    ) {
        event.preventDefault();
        chatForm.requestSubmit();
    }
});

document.querySelectorAll(".suggestion").forEach(function (button) {
    button.addEventListener("click", function () {
        const prompt = button.dataset.prompt;

        if (prompt) {
            sendMessage(prompt);
        }
    });
});

newChatButton.addEventListener("click", function () {
    if (isWaiting) {
        return;
    }

    conversation = [];
    messagesContainer.replaceChildren();
    welcome.hidden = false;
    messageInput.value = "";
    resizeInput();
    messageInput.focus();
    sidebar.classList.remove("open");
});

menuToggle.addEventListener("click", function () {
    sidebar.classList.toggle("open");
});
