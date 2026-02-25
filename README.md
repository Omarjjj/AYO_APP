# Ayo - AI Copilot Assistant

A modern, privacy-focused desktop AI assistant built with Electron and React.

![Ayo Logo](public/ayo-logo.svg)

## Features

- **Dashboard**: Real-time system status and quick controls
- **Chat Interface**: Interact with your AI assistant through text
- **Privacy Mode**: Full control over data collection
- **Settings**: Comprehensive configuration options
- **Activity Logs**: Monitor system events and AI interactions

## Tech Stack

- **Electron** - Cross-platform desktop app
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **GSAP** - Advanced animations
- **Zustand** - State management
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Running in Electron

```bash
# Run Electron with hot reload
npm run electron:dev
```

### Building for Production

```bash
# Build the application
npm run electron:build
```

## Project Structure

```
ayoApp/
├── electron/           # Electron main process
│   ├── main.ts        # Main window setup
│   └── preload.ts     # Context bridge
├── public/            # Static assets
├── src/
│   ├── components/    # React components
│   │   ├── Layout/    # App layout
│   │   └── ui/        # Reusable UI components
│   ├── pages/         # Application pages
│   │   ├── Dashboard.tsx
│   │   ├── Chat.tsx
│   │   ├── Settings.tsx
│   │   ├── Privacy.tsx
│   │   └── Logs.tsx
│   ├── store/         # Zustand state management
│   ├── lib/           # Utilities
│   └── App.tsx        # Main app component
├── package.json
└── README.md
```

## Pages

### 1. Dashboard
The control center showing:
- Assistant status (idle, listening, processing, responding)
- Quick toggles for Privacy, Camera, and Context
- System health metrics

### 2. Chat
Interactive conversation interface with:
- Message history with timestamps
- AI response metadata (used AI, context)
- Voice input support

### 3. Settings
Configuration options for:
- General settings (proactivity, cooldown)
- Privacy & permissions
- Hotkey configuration
- AI server connection

### 4. Privacy Mode
Dedicated screen showing:
- Current privacy status
- Data collection indicators
- Privacy mode benefits

### 5. Logs
System monitoring with:
- Event filtering
- Search functionality
- System health metrics
- Quick stats

## Privacy-First Design

- Camera OFF by default
- No raw data sent to servers
- User always in control
- GDPR compliant architecture

## License

MIT
