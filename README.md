# ServyAI

A modern desktop application that combines AI chat assistance with powerful app installation capabilities, built with Electron, React, and Python.

## Features

### 💬 AI Chat Interface
- Interactive chat interface with an AI assistant
- Message history with timestamps
- Modern, animated message bubbles
- Real-time responses

### 📦 App Installer
- Search for applications using Windows Package Manager (winget)
- One-click installation of apps
- Verification badges for trusted publishers (Google, Mozilla, Microsoft, etc.)
- View official app homepages
- Activity logging

### ✨ Modern UI
- Dark theme with glassmorphic design
- Sidebar navigation
- Responsive layout
- Loading indicators and animations

## Tech Stack

**Frontend:**
- Electron
- React + TypeScript
- Vite
- React Router

**Backend:**
- Python 3.x
- Windows Package Manager (winget)

## Prerequisites

- Node.js (v16 or higher)
- Python 3.x
- Windows 10/11 with winget installed

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AayanShaikh007/ServAI.git
   cd ServyAI
   ```

2. **Set up the Python backend:**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set up the frontend:**
   ```bash
   cd frontend
   npm install
   ```

## Running the App

From the `frontend` directory:

```bash
npm run dev
```

This will:
- Start the Vite development server
- Launch the Electron app
- Start the Python backend automatically

## Project Structure

```
ServyAI/
├── frontend/
│   ├── electron/          # Electron main process
│   │   ├── main.ts        # Main process entry
│   │   └── preload.ts     # Preload script for IPC
│   ├── src/
│   │   ├── pages/         # React pages
│   │   │   ├── ChatPage.tsx
│   │   │   └── AppInstallerPage.tsx
│   │   ├── components/    # React components
│   │   │   └── Navigation.tsx
│   │   ├── App.tsx        # Main app with routing
│   │   └── App.css        # Global styles
│   └── package.json
└── backend/
    ├── api.py             # Python backend with IPC
    └── requirements.txt
```

## Features in Detail

### App Installer
- **Search**: Find apps from the winget repository
- **Verification**: Trusted apps show a green checkmark badge
- **Source Links**: View official app homepages before installing
- **Interactive Install**: Supports apps that require GUI interaction during installation

### AI Chat (Placeholder)
Currently uses placeholder responses. Ready for integration with:
- Local LLMs (Ollama, LM Studio)
- Cloud APIs (OpenAI, Anthropic, Google Gemini)

## Development

### Building for Production

```bash
npm run build
```

### Key Technologies
- **IPC Communication**: Electron's IPC for frontend-backend communication
- **Process Management**: Python subprocess for winget commands
- **State Management**: React hooks for UI state
- **Routing**: React Router for multi-page navigation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Powered by [Windows Package Manager](https://github.com/microsoft/winget-cli)
- UI inspired by modern design trends

---

**Note**: This is an active development project. The AI chat feature currently uses placeholder responses and is ready for LLM integration.
