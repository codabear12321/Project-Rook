
const form = document.getElementById('chatForm');
const input = document.getElementById('messageInput');
const messages = document.getElementById('messages');
const voiceButton = document.getElementById('voiceButton');
const voiceLabel = document.getElementById('voiceLabel');
const voiceNote = document.getElementById('voiceNote');

const API_URL = 'https://rook-core.artzdakotaevo.workers.dev/chat';

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
    voiceNote.textContent = 'Storage unavailable.';
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

function speakRook(text) {
  if (!('speechSynthesis' in window)) {
    voiceNote.textContent = 'Speech is not supported in this browser.';
    return;
  }

  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = 'en-US';
  speech.rate = 1;
  speech.pitch = 1;

  speech.onstart = () => {
    voiceLabel.textContent = 'ROOK SPEAKING…';
    voiceButton.classList.add('speaking');
  };

  speech.onend = () => {
    voiceLabel.textContent = 'TAP TO TALK';
    voiceButton.classList.remove('speaking');
  };

  speech.onerror = () => {
    voiceLabel.textContent = 'TAP TO TALK';
    voiceButton.classList.remove('speaking');
    voiceNote.textContent = 'Voice playback failed.';
  };

  window.speechSynthesis.speak(speech);
}

chatHistory.forEach(item => {
  addBubble(item.text, item.who, false);
});

async function respond(message) {
  const command = message.trim();
  const lower = command.toLowerCase();

  if (lower.startsWith('remember:')) {
    const note = command.slice(9).trim();

    if (!note) {
      return 'Tell me what to remember after remember:.';
    }

    memories.push(note);
    saveData(MEMORY_KEY, memories);

    return `Saved to Rook's local memory: "${note}"`;
  }

  if (
    lower.includes('what do you remember') ||
    lower.includes('show my memories') ||
    lower.includes('recall my memories')
  ) {
    if (!memories.length) {
      return 'My local memory is empty. Try remember: followed by your note.';
    }

    return 'Here is what I remember:\n\n' +
      memories.map((note, i) => `${i + 1}. ${note}`).join('\n\n');
  }

  if (lower === 'forget all my memories') {
    memories = [];
    saveData(MEMORY_KEY, memories);
    return 'All local memories have been cleared.';
  }

  const previousMessages = chatHistory
    .slice(0, -1)
    .slice(-12)
    .map(item => ({
      role: item.who === 'user' ? 'user' : 'assistant',
      content: item.text
    }));

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: command,
        history: previousMessages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.details || data.error || 'Rook could not respond.');
    }

    return data.reply || 'Rook returned an empty response.';

  } catch (error) {
    console.error('Rook connection error:', error);
    return `I couldn't reach Rook Core. ${error.message || 'Check your connection and try again.'}`;
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();

  const value = input.value.trim();
  if (!value) return;

  addBubble(value, 'user');
  input.value = '';
  input.disabled = true;

  const sendButton = form.querySelector('button[type="submit"]');
  if (sendButton) sendButton.disabled = true;

  addBubble('Thinking...', 'rook', false);

  const reply = await respond(value);

  const thinkingBubble = messages.lastElementChild;
  if (thinkingBubble) thinkingBubble.remove();

  addBubble(reply, 'rook');
  speakRook(reply);

  input.disabled = false;
  if (sendButton) sendButton.disabled = false;
  input.focus();
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
    voiceNote.textContent = 'Rook is listening.';
  };

  recognition.onend = () => {
    voiceButton.classList.remove('listening');
    voiceLabel.textContent = 'TAP TO TALK';
  };

  recognition.onerror = () => {
    voiceNote.textContent =
      'Microphone unavailable. Check browser permissions.';
  };

  recognition.onresult = event => {
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
