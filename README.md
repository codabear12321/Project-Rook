# Project ROOK — Build 0.1

This is the first front-end interface prototype for ROOK. It is intentionally a static prototype:
- No AI API key is included.
- No messages are sent to a server.
- The chat area demonstrates the layout only.
- Microphone input uses browser speech recognition when supported; captured speech is placed in the input field and is not sent anywhere.

## Run locally
Open `index.html` in a modern browser. For best results, use a local development server (for example VS Code Live Server) because browser microphone and install features may require HTTPS or localhost.

## Next build steps
1. Choose the backend and AI provider.
2. Add a server-side API route; keep all secrets on the server.
3. Add user authentication and encrypted storage for memory.
4. Connect a narrow set of approved actions through iOS Shortcuts.
5. Add confirmation before sending messages, deleting data, spending money, or taking other sensitive actions.

## Cross-platform
The interface is a responsive web app and can be developed on Windows or macOS. It can later be hosted securely and added to the iPhone Home Screen.
