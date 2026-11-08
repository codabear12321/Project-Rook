
const form = document.getElementById('chatForm');
const input = document.getElementById('messageInput');
const messages = document.getElementById('messages');
const voiceButton = document.getElementById('voiceButton');
const voiceLabel = document.getElementById('voiceLabel');
const voiceNote = document.getElementById('voiceNote');

const CHAT_KEY = 'rook_chat_v1';
const MEMORY_KEY = 'rook_memory_v1';

let chatHistory = loadData(CHAT_KEY, []);
let memories = loadData(MEMORY_KEY, []);

function loadData(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    voiceNote.textContent = 'Storage unavailable. Your data may not be saved.';
  }
}

function addBubble(text, who, save = true) {
  const el = document.createElement('div');
  el.className = `bubble ${who}`;

  const label = document.createElement('b');
  label.textContent = who === 'user' ? 'YOU' : 'ROOK';

  const p = document.createElement('p');
  p.textContent = text;

  el.append(label, p);
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;

  if (save) {
    chatHistory.push({ text, who });
    saveData(CHAT_KEY, chatHistory);
  }
}

// Restore previous conversation
chatHistory.forEach(item => {
  addBubble(item.text, item.who, false);
});

function respond(message) {
  const command = message.trim();
  const lower = command.toLowerCase();

  // Save a memory
  if (lower.startsWith('remember:')) {
    const note = command.slice(9).trim();

    if (!note) {
      return 'Tell me what to remember after the words "remember:".';
    }

    memories.push(note);
    saveData(MEMORY_KEY, memories);

    return `Got it. I've saved this to Rook's local memory: "${note}"`;
  }

  // Recall memories
  if (
    lower.includes('what do you remember') ||
    lower.includes('show my memories') ||
    lower.includes('recall my memories')
  ) {
    if (memories.length === 0) {
      return 'My memory is empty right now. Tell me something using "remember:".';
    }

    return 'Here is what I have saved:\n\n' +
      memories.map((note, index) =>
        `${index + 1}. ${note}`
      ).join('\n\n');
  }

  // Clear memories
  if (lower === 'forget all my memories') {
    memories = [];
    saveData(MEMORY_KEY, memories);
    return 'All local memories have been cleared.';
  }

  // Basic offline responses
  if (lower.includes('hello') || lower.includes('hey rook')) {
    return 'I'm here. Rook systems are online. What are we working on?';
  }

  if (lower.includes('who are you')) {
    return 'I'm Rook, your personal assistant project. My local memory is active. My AI connection is still being built.';
  }

  return 'I received your message. My local memory system is working, but my real AI brain has not been connected yet.';
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const value = input.value.trim();
  if (!value) return;

  addBubble(value, 'user');

  const reply = respond(value);
  addBubble(reply, 'rook');

  input.value = '';
});

// Voice input
const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;

  recognition.onstart = () => {
    voiceButton.classList.add('listening');
    voiceLabel.textContent = 'LISTENING…';
  };

  recognition.onend = () => {
    voiceButton.classList.remove('listening');
    voiceLabel.textContent = 'TAP TO TALK';
  };

  recognition.onerror = () => {
    voiceNote.textContent =
      'Microphone unavailable. Check browser permissions.';
  };

  recognition.onresult = (event) => {
    input.value = event.results[0][0].transcript;
    voiceNote.textContent =
      'Voice captured. Press Send to talk to Rook.';
  };

  voiceButton.addEventListener('click', () => {
    try {
      recognition.start();
    } catch {
      voiceNote.textContent = 'Voice recognition is already running.';
    }
  });

} else {
  voiceButton.addEventListener('click', () => {
    voiceNote.textContent =
      'Speech recognition is not supported in this browser.';
  });
}
