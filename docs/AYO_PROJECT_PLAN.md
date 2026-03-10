# AYO — AI Companion: Full Project Plan

> **Version:** 1.0
> **Date:** February 26, 2026
> **Status:** Planning Phase

---

## Table of Contents

1. [Project Vision](#1-project-vision)
2. [System Architecture](#2-system-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Feature Breakdown](#4-feature-breakdown)
   - 4.1 [Wake Word Detection (Porcupine)](#41-wake-word-detection)
   - 4.2 [Speech-to-Text (STT)](#42-speech-to-text)
   - 4.3 [LLM Brain / Orchestrator](#43-llm-brain--orchestrator)
   - 4.4 [Agentic Task Execution (OpenClaw)](#44-agentic-task-execution-openclaw)
   - 4.5 [Text-to-Speech (TTS)](#45-text-to-speech)
   - 4.6 [Screen Context Pipeline](#46-screen-context-pipeline)
   - 4.7 [Emotion Detection](#47-emotion-detection)
   - 4.8 [Proactive Conversation Initiation](#48-proactive-conversation-initiation)
   - 4.9 [System Tray & Floating Overlay](#49-system-tray--floating-overlay)
   - 4.10 [Gaming Mode](#410-gaming-mode)
   - 4.11 [On-Demand Screen Share with AI](#411-on-demand-screen-share-with-ai)
5. [Infrastructure & Networking](#5-infrastructure--networking)
   - 5.1 [Testing Server (Local)](#51-testing-server-local)
   - 5.2 [WAN Access](#52-wan-access)
   - 5.3 [Domain & Subdomains](#53-domain--subdomains)
   - 5.4 [Production Deployment (AWS)](#54-production-deployment-aws)
6. [Privacy Architecture](#6-privacy-architecture)
7. [Development Phases](#7-development-phases)
8. [Dependency & Package Map](#8-dependency--package-map)

---

## 1. Project Vision

AYO is an AI desktop companion designed to be your **best friend on your PC**. Unlike traditional AI assistants that are purely reactive (waiting for you to ask), AYO:

- **Sees your screen** — understands what you're doing at all times through intelligent context extraction
- **Detects your emotions** — knows when you're struggling, frustrated, or need help
- **Initiates conversations** — proactively offers help based on context and emotional state
- **Executes tasks for you** — performs agentic work (file management, web browsing, API calls, automation)
- **Respects your privacy** — no raw data is ever stored; only summarized context logs
- **Knows when to back off** — gaming mode, cooldowns, and user controls ensure it's never annoying

The key differentiator: **AYO already knows what you're doing before you ask.** When you say "AYO, help me with this," it already has full context — like talking to a friend who's been sitting next to you.

---

## 2. System Architecture

### High-Level Overview

```
┌─ User's Machine (Electron App) ──────────────────────────────────────┐
│                                                                       │
│  ┌─ Background Services (Electron Main Process) ──────────────────┐  │
│  │                                                                 │  │
│  │  Porcupine ──────────── Wake word detection ("AYO")            │  │
│  │  Screen Monitor ──────── Window title + Accessibility API       │  │
│  │  OCR Engine ──────────── Windows OCR (on screen changes)       │  │
│  │  Change Detector ─────── Text similarity filtering              │  │
│  │  Context Manager ─────── Rolling log (last 100 summaries)      │  │
│  │  Emotion Detector ────── SpeechBrain (Python sidecar)          │  │
│  │  Audio Player ────────── Plays TTS audio responses              │  │
│  │  System Tray ─────────── Background indicator + menu            │  │
│  │                                                                 │  │
│  └─────────────────────────────┬───────────────────────────────────┘  │
│                                │ IPC                                   │
│  ┌─ UI Layer (Electron Renderer / React) ─────────────────────────┐  │
│  │                                                                 │  │
│  │  Dashboard ─── Chat ─── Settings ─── Privacy ─── Logs          │  │
│  │  Floating Overlay (always-on-top, transparent)                  │  │
│  │                                                                 │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
└───────────────────────────┬───────────────────────┬───────────────────┘
                            │ Tailscale / CF Tunnel  │ HTTPS
                            ▼                        ▼
┌─ AYO Server ──────────────────────────┐    ┌──────────────────┐
│                                        │    │ Azure Neural TTS │
│  Ollama ─── Qwen 2.5 7B (LLM Brain)  │    │ (API, free tier) │
│  OpenClaw ── Agent Runtime             │    └──────────────────┘
│  API Layer ─ Routes requests           │
│                                        │    ┌──────────────────┐
│                                        │    │ GPT-4o / Claude  │
│                                        │    │ (Vision, on-     │
│                                        │    │  demand only)    │
└────────────────────────────────────────┘    └──────────────────┘
```

### Request Flow

```
User says "AYO" ──► Porcupine detects (500ms)
                         │
User speaks question ──► Vosk/Whisper STT (1-3s)
                         │
Capture screen context ──► Accessibility API + OCR + Screenshot
                         │
Package & send to server:
  { question, screen_context, accessibility_tree, recent_logs, emotion }
                         │
                    ┌────▼────┐
                    │ Qwen 2.5│ Orchestrator decides:
                    │   7B    │
                    └────┬────┘
                         │
              ┌──────────┼──────────┐
              ▼                     ▼
        Simple response        Agentic task
              │                     │
              │                ┌────▼────┐
              │                │ OpenClaw │ Executes tools
              │                └────┬────┘
              │                     │
              ◄─────────────────────┘
              │
        Response text sent back to client
              │
              ├──► Azure TTS API → Audio → Plays in AYO (200-300ms)
              └──► Displayed in overlay / chat UI
```

---

## 3. Tech Stack

### Client (Electron App)

| Component | Technology | Purpose |
|---|---|---|
| Framework | Electron 28 | Desktop app shell |
| UI | React 18 + TypeScript | User interface |
| Build | Vite 5 | Bundling & dev server |
| Styling | Tailwind CSS 3 | UI styling |
| Animations | Framer Motion + GSAP | UI animations |
| State | Zustand | State management |
| Wake Word | @picovoice/porcupine-node | "AYO" detection |
| Mic Capture | @picovoice/pvrecorder-node | Audio input for wake word |
| STT | Vosk (fast) or Whisper.cpp (accurate) | Speech-to-text |
| Screen Capture | Electron desktopCapturer | Screenshots |
| OCR | Windows.Media.Ocr (native) | Text extraction from screen |
| Accessibility | Windows UI Automation API | UI tree extraction |
| Emotion | SpeechBrain (Python sidecar) | Voice emotion recognition |
| Image Processing | sharp | Perceptual hashing, resize |
| Audio Playback | Web Audio API | Playing TTS responses |

### Server

| Component | Technology | Purpose |
|---|---|---|
| LLM Serving | Ollama | Hosts Qwen 2.5 7B Q4_K_M |
| LLM Model | Qwen 2.5 7B Instruct (Q4_K_M) | Brain / orchestrator |
| Agent Runtime | OpenClaw | Agentic task execution |
| API Layer | Node.js (Express/Fastify) or Python (FastAPI) | Request routing |
| Reverse Proxy | Nginx or Caddy | HTTPS termination, routing |

### External APIs

| Service | Purpose | Cost |
|---|---|---|
| Azure Neural TTS | Text-to-Speech (warm, natural voices) | Free tier: 500K chars/month |
| GPT-4o or Claude Vision | On-demand screenshot understanding | ~$0.01/call, only when user asks |
| Picovoice Console | Training custom "AYO" wake word | Free tier |

---

## 4. Feature Breakdown

### 4.1 Wake Word Detection

**Goal:** Detect when the user says "AYO" to activate the assistant.

**Technology:** Picovoice Porcupine

**How it works:**
1. PvRecorder continuously captures microphone audio in the Electron main process
2. Audio frames are fed to the Porcupine engine on each loop iteration
3. Porcupine checks against the custom "AYO" `.ppn` model
4. On detection, IPC event `wake-word-detected` is sent to the renderer
5. Overlay window appears, STT starts recording user's question

**Setup requirements:**
- Picovoice account + Access Key (free tier)
- Custom "AYO" wake word trained for Windows platform (`.ppn` file)
- `@picovoice/porcupine-node` and `@picovoice/pvrecorder-node` packages
- `@electron/rebuild` for native module compatibility
- Visual Studio Build Tools (C++ workload) for compiling native addons

**Performance:** ~1-2% CPU, <500ms detection latency, runs continuously in background.

**Files to modify:**
- `electron/main.ts` — Initialize Porcupine, start audio loop, send IPC on detection
- `electron/preload.ts` — Expose `onWakeWordDetected`, `startListening`, `stopListening`
- `src/` (React) — Listen for wake word event, trigger overlay

---

### 4.2 Speech-to-Text

**Goal:** Convert user's spoken question into text after wake word detection.

**Technology:** Vosk (primary, for speed) or Whisper.cpp (for accuracy)

| Model | Engine | Size | Latency | Accuracy | Runs On |
|---|---|---|---|---|---|
| vosk-model-small-en | Vosk | ~50MB | Real-time | Decent | CPU |
| whisper-tiny | Whisper.cpp | ~75MB | 1-2s | Good | CPU |
| whisper-base | Whisper.cpp | ~150MB | 2-3s | Very good | CPU |
| whisper-small | Whisper.cpp | ~500MB | 3-5s | Excellent | CPU |

**Recommended:** Start with **Vosk** for the demo (fastest). Switch to **Whisper base** if accuracy is insufficient.

**How it works:**
1. After wake word detection, start recording user audio
2. Feed audio to Vosk/Whisper for transcription
3. Detect end-of-speech (silence detection)
4. Return transcribed text
5. Send text + context to LLM server

**Files to modify:**
- `electron/main.ts` — STT initialization, audio recording after wake word
- `electron/preload.ts` — Expose STT events to renderer

---

### 4.3 LLM Brain / Orchestrator

**Goal:** Process user requests, maintain conversation, decide if tasks need agentic execution.

**Technology:** Qwen 2.5 7B Instruct (Q4_K_M quantization) via Ollama

**Why Qwen 2.5 7B:**
- Best function calling and tool routing at the 7B parameter size
- Fits in 4GB VRAM with Q4 quantization
- Strong instruction following and reasoning
- Ollama exposes an OpenAI-compatible API

**Orchestrator logic:**
```
User request arrives with context
    │
    ├─ Simple question (factual, conversational)
    │   → LLM responds directly
    │
    ├─ Context-dependent question ("help me with this")
    │   → LLM uses screen context + logs to answer
    │
    └─ Agentic task ("search for X", "open Y", "create Z")
        → LLM routes to OpenClaw with task description
        → OpenClaw executes and returns result
        → LLM formats response for user
```

**Server setup:**
```bash
# Install Ollama
# Download from https://ollama.com

# Pull the model
ollama pull qwen2.5:7b-instruct-q4_K_M

# Verify it's running
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen2.5:7b-instruct-q4_K_M", "messages": [{"role": "user", "content": "Hello"}]}'
```

**System prompt for the orchestrator (to be refined):**
```
You are AYO, a proactive AI desktop companion. You have access to:
- The user's current screen context (what app they're using, visible text)
- Recent activity logs (what they've been doing)
- The user's current emotional state
- Agentic capabilities via OpenClaw (web browsing, file management, shell commands, APIs)

When responding:
1. Use the screen context to give relevant, specific answers
2. Be warm and friendly — you're a companion, not a tool
3. If the task requires action (searching, creating files, running commands), 
   route it to OpenClaw by responding with a structured tool call
4. Keep responses concise and helpful
```

**Performance expectations (GTX 1650):**
- ~5-15 tokens/second
- ~10-30s for typical responses
- One user at a time (requests queue for others)

---

### 4.4 Agentic Task Execution (OpenClaw)

**Goal:** Execute multi-step tasks autonomously — web browsing, file management, shell commands, API calls.

**Technology:** OpenClaw framework

**Architecture:**
```
OpenClaw Instance (on server)
├── Gateway — Long-running process, orchestrates everything
├── Brain — Points to Ollama (same Qwen 2.5 7B model)
├── Hands (Tools):
│   ├── Shell execution
│   ├── Browser automation
│   ├── File system access
│   ├── API calls
│   └── Custom tools (extensible)
└── Memory — Local Markdown files, persistent across restarts
```

**Integration with AYO:**
- The LLM orchestrator decides when a task is agentic
- Agentic tasks are forwarded to OpenClaw via its API
- OpenClaw plans, executes, and returns results
- Results are sent back to the user through AYO's UI

**Testing setup:** OpenClaw runs on the same server as Ollama, pointed at the same LLM.

**Production setup:** OpenClaw runs on AWS EC2 (CPU instance), pointed at Amazon Bedrock for its LLM Brain.

---

### 4.5 Text-to-Speech

**Goal:** Natural, warm, human-like voice for AYO's responses.

**Technology:** Azure Neural TTS (API)

**Why Azure Neural TTS:**
- 500K free characters/month (sufficient for 3 users)
- Voices like `en-US-JennyNeural` and `en-US-GuyNeural` are warm and natural
- ~200-300ms latency
- Simple REST API, no SDK required
- No GPU/CPU load on client or server

**How it works:**
1. LLM generates response text
2. Client sends text to Azure TTS API
3. API returns WAV/MP3 audio
4. Client plays audio via Web Audio API

**Streaming optimization:** Send text to TTS sentence-by-sentence as the LLM streams its response. This way, the user hears the first sentence within seconds while the rest generates.

**Fallback:** If internet is unavailable, fall back to Piper TTS (offline, CPU-based, bundled with app). Lower quality but functional.

**Azure setup:**
- Create free Azure account → Speech Services resource → get API key
- Endpoint: `https://<region>.tts.speech.microsoft.com/cognitiveservices/v1`

---

### 4.6 Screen Context Pipeline

**Goal:** Continuously understand what the user is doing, without storing raw data.

**Architecture: Tiered Context Pipeline**

```
TIER 1 — ALWAYS ON (every 15-30s, near-zero cost)
├── Active window title + process name (Win32 API)
├── Accessibility tree of foreground app (Windows UI Automation)
└── Cost: ~0.1% CPU, ~5MB RAM

TIER 2 — ON CHANGE (only when app/context changes)
├── OCR of active window (Windows.Media.Ocr, lower resolution)
├── Text similarity check (Jaccard) vs previous OCR
├── If similarity < 0.85 → proceed to Tier 3
└── Cost: ~5% CPU spike for ~200ms, occasional

TIER 3 — SUMMARIZE (only on significant changes)
├── Send OCR text + accessibility data to LLM (Qwen 2.5 7B)
├── Prompt: "Summarize what the user is doing in 1-2 sentences"
├── Save summary to rolling context log
├── Delete raw OCR text and screenshot from memory
└── Cost: ~2-5s LLM inference, only on meaningful changes

TIER 4 — EVALUATE (every 2-5 minutes)
├── Review recent context summaries + emotion state
├── Compute interest/intervention score
├── If score > threshold → initiate conversation
└── Cost: ~1-2s LLM inference, periodic
```

**Text Similarity Algorithm (Duplicate Filtering):**

```
FILTER 1: Jaccard Word Similarity
  → Compare sets of unique words between current and previous OCR
  → If similarity > 0.85 → SKIP (screen barely changed)

FILTER 2: Key Signal Extraction
  → Extract: app name, file name, page title, URL
  → If same app + same file/page → SKIP (minor scroll/edit)

FILTER 3 (optional): LLM Judgment
  → Ask LLM: "Is this meaningfully different from the previous context?"
  → Only used in ambiguous cases
```

**Context Log Format:**
```json
{
  "timestamp": "2026-02-26T14:30:00",
  "app": "VS Code",
  "window_title": "main.ts - ayoApp",
  "summary": "User editing Electron main process, working on window creation",
  "emotion": "neutral",
  "interest_score": 2
}
```

**Storage:** Rolling window of last 100 entries (~50KB). Older entries compressed into daily summaries.

---

### 4.7 Emotion Detection

**Goal:** Detect user's emotional state from voice to inform proactive behavior.

**Technology:** SpeechBrain (offline, Python sidecar)

**Detectable emotions:** Happy, sad, angry, neutral, frustrated, confused

**Integration with Electron:**

```
Electron App
├── On startup: spawns Python sidecar (emotion_server.exe)
│   └── Built with PyInstaller (single executable, no Python install needed)
│   └── Runs Flask/FastAPI on localhost:5555
│   └── SpeechBrain model loaded in memory (~100-300MB)
│
├── When user speaks to AYO:
│   └── Audio also sent to localhost:5555/detect-emotion
│   └── Returns: { "emotion": "frustrated", "confidence": 0.82 }
│
└── Emotion data feeds into:
    ├── Context log (stored with each entry)
    ├── Interest scoring (frustrated → higher score)
    └── Response tone adaptation (LLM adjusts its tone)
```

**Bundling:**
- Use PyInstaller to compile `emotion_server.py` + SpeechBrain + model into a single `.exe`
- Ship alongside the Electron app in `resources/emotion/`
- Adds ~200-500MB to install size

**Performance:** ~50-100ms per audio clip on CPU, minimal background impact.

---

### 4.8 Proactive Conversation Initiation

**Goal:** AYO starts conversations when it detects the user needs help.

**Interest/Intervention Score Model:**

```
Score Component                              Weight
───────────────────────────────────────────────────
Error messages on screen (OCR)               +3
User emotion: frustrated/confused            +3
Same task repeated 3+ times (context logs)   +2
Searching for help (Google, StackOverflow)   +2
Long time on same screen, no progress        +2
New application/context switch               +1
User watching video/entertainment            -2
User dismissed AYO recently (cooldown)       -3
Gaming mode active                           -5

THRESHOLD: Score >= 5 → AYO initiates
COOLDOWN: Minimum 10 minutes between initiations
```

**How it works:**
1. Every 2-5 minutes, the client sends recent context + emotion to the LLM
2. LLM evaluates the score and decides whether to initiate
3. If yes, LLM generates an appropriate opening message
4. AYO overlay appears with the message + option to engage or dismiss

**Example initiations:**
- "Hey, I noticed you've been stuck on that error for a while. Want me to take a look?"
- "You've been searching for Electron docs — I can help with that. What are you trying to do?"
- "You seem frustrated. Need a hand with something?"

**Controls (in Settings page):**
- Toggle proactive mode on/off
- Adjust sensitivity (threshold slider)
- Set cooldown period
- Set "Do Not Disturb" hours

---

### 4.9 System Tray & Floating Overlay

**Goal:** AYO lives in the system tray and shows a floating overlay when activated.

**System Tray (Electron `Tray`):**
- Always-visible icon in Windows taskbar notification area
- Indicates status: listening (green), processing (yellow), paused (gray), error (red)
- Right-click menu: Open AYO, Pause Listening, Gaming Mode, Settings, Quit
- Balloon notifications for important events

**Floating Overlay (Second BrowserWindow):**
- Appears when wake word "AYO" is detected or when AYO initiates a conversation
- Always-on-top, frameless, transparent window
- Positioned center-screen or bottom-right (user configurable)
- Shows: listening animation, AI response, quick actions
- Can be dismissed by clicking outside, pressing Escape, or saying "dismiss"

**Overlay window properties:**
```typescript
{
  width: 420,
  height: 320,
  alwaysOnTop: true,
  frame: false,
  transparent: true,
  skipTaskbar: true,
  resizable: false,
  focusable: true,
}
```

---

### 4.10 Gaming Mode

**Goal:** Minimize AYO's resource footprint during gaming while remaining available via wake word.

**Game Detection Methods:**
1. Foreground window is fullscreen exclusive (not a known productivity app)
2. Known game process names detected (Steam, Epic, Riot, etc.)
3. User manually enables via tray menu or Settings

**What changes in Gaming Mode:**

| Feature | Normal Mode | Gaming Mode |
|---|---|---|
| Porcupine (wake word) | Active | Active (~1% CPU) |
| Screen monitoring | Every 15-30s | Paused |
| OCR | On change | Paused |
| Emotion detection | Active | Paused |
| Context pipeline | Full | Title/process only |
| Overlay | Anytime | Only on wake word |
| Proactive initiation | Active | Paused |
| **Total overhead** | **~3% CPU, ~60MB** | **~1% CPU, ~10MB** |

**Gaming-specific features (when user calls "AYO"):**
- AYO knows which game is running (from process name)
- Can answer game-specific questions (tips, builds, walkthroughs)
- Can report play time ("You've been playing for 2 hours")
- Uses OpenClaw for web lookups about the game

---

### 4.11 On-Demand Screen Share with AI

**Goal:** When user calls "AYO, help me with this," the AI gets a detailed visual understanding of the current screen.

**Two-tier approach:**

**Tier 1 — Default (free, uses self-hosted LLM):**
```
On wake word:
  1. Capture accessibility tree (instant, structured)
  2. OCR active window (fast, text)
  3. Gather last 10 context log entries
  4. Package as text and send to Qwen 2.5 7B

→ Works for most cases: code errors, UI navigation, document help
```

**Tier 2 — Visual (API, on-demand, ~$0.01/call):**
```
When text context isn't enough, or user says "look at my screen":
  1. Capture full-resolution screenshot
  2. Send to GPT-4o or Claude Vision API
  3. Get detailed visual understanding

→ For: complex UI issues, design feedback, image-heavy screens
```

**Decision logic:** Start with Tier 1. If the LLM's response indicates it doesn't have enough context ("I'm not sure what you're looking at"), automatically escalate to Tier 2.

---

## 5. Infrastructure & Networking

### 5.1 Testing Server (Local)

**Hardware:**
| Component | Spec |
|---|---|
| CPU | Intel i7 13th Gen (16 cores: 8P + 8E) |
| GPU | NVIDIA GTX 1650 (4GB VRAM) |
| RAM | 16GB (recommended, 8GB minimum) |
| Storage | SSD recommended for model loading |

**Software stack on server:**
```
Windows 11 / Ubuntu Server
├── Ollama (serves Qwen 2.5 7B)
│   └── Port 11434
├── OpenClaw (agent runtime)
│   └── Brain → localhost:11434 (Ollama)
│   └── Gateway + Tools
├── API Layer (Express.js or FastAPI)
│   └── Port 3000
│   └── Routes /api/chat, /api/agent, /api/context
├── Nginx or Caddy (reverse proxy)
│   └── Port 443 (HTTPS)
└── Tailscale / Cloudflare Tunnel
```

### 5.2 WAN Access

**For Testing Phase: Tailscale (Recommended)**
- Install Tailscale on server + each user's machine
- Private mesh VPN, no port forwarding needed
- Server gets a stable IP like `100.64.0.1`
- Free for up to 100 devices
- Most secure option (private network)
- Setup: 5 minutes

**For Production / Public Access: Cloudflare Tunnel**
- Install `cloudflared` on server
- Outbound-only tunnel (no ports opened)
- Get a public URL like `https://api.ayoapp.com`
- Free tier includes DDoS protection, SSL, basic access control
- Add Cloudflare Access for authentication (also free)
- Requires a domain name

**Security rules (non-negotiable):**
- Never expose Ollama (port 11434) directly to the internet
- Never expose OpenClaw without authentication
- Always use HTTPS
- Implement API key authentication on all endpoints
- Rate limiting on all API routes

### 5.3 Domain & Subdomains

Purchase one domain (e.g., `ayoapp.com`, ~$10-15/year).

| Subdomain | Purpose | Hosted On |
|---|---|---|
| `ayoapp.com` | Marketing/landing page | Vercel, Netlify, or GitHub Pages |
| `api.ayoapp.com` | LLM + OpenClaw API | Your server (via Cloudflare Tunnel) |
| `app.ayoapp.com` | Web dashboard (future) | Vercel or AWS |
| `docs.ayoapp.com` | Documentation | GitBook, Docusaurus, or Notion |

All subdomains are managed via DNS records — no extra cost.

### 5.4 Production Deployment (AWS)

**Recommended architecture:**

| Component | AWS Service | Instance/Tier | Estimated Cost |
|---|---|---|---|
| LLM Brain | **Amazon Bedrock** | Claude Haiku / Llama 3.1 | Pay-per-token |
| OpenClaw | **EC2** | t3.large (2 vCPU, 8GB RAM) | ~$60/month |
| API Layer | **EC2** (same instance) | Bundled with OpenClaw | — |
| TTS | **Azure Neural TTS** | Free tier → paid if needed | Free / $1 per 1M chars |
| Vision (on-demand) | **OpenAI / Anthropic API** | GPT-4o / Claude | ~$0.01/call |
| Database (future) | **RDS / DynamoDB** | — | — |
| Storage (future) | **S3** | — | — |
| CDN | **CloudFront** | For website/assets | — |

**Why Bedrock for LLM (not self-hosted on GPU instances):**
- GPU instances (g5.12xlarge) cost ~$150-170/day running 24/7
- Bedrock charges per-token — far cheaper for moderate usage
- No GPU driver/CUDA management
- Access to top-tier models (Claude, Llama 3.1 405B)
- Auto-scaling built in

---

## 6. Privacy Architecture

Privacy is a core product principle. The design ensures no raw data is ever persisted.

**Data flow:**
```
Screenshot captured (in memory only)
    ↓
OCR extracts text (in memory only)
    ↓
Screenshot DELETED from memory (never touches disk)
    ↓
OCR text sent to LLM for summarization
    ↓
Raw OCR text DELETED (never persisted)
    ↓
Only the 1-2 sentence SUMMARY is stored in context log
    ↓
Summaries older than configured retention period → deleted
```

**Privacy controls (available to user in Settings/Privacy pages):**
- Toggle screen monitoring on/off
- Toggle emotion detection on/off
- Toggle proactive initiation on/off
- Set data retention period (1hr, 4hr, 12hr, 24hr, 1 week)
- View all stored context logs
- Delete all logs with one click
- Pause all monitoring ("Do Not Disturb" mode)

**What is NEVER stored:**
- Raw screenshots
- Raw OCR text
- Audio recordings
- Webcam footage
- Keystrokes

**What IS stored (and fully deletable):**
- Short text summaries of user activity (1-2 sentences each)
- Emotion labels (e.g., "neutral", "frustrated")
- Timestamps
- Chat history (user's messages + AYO's responses)

---

## 7. Development Phases

### Phase 1: Foundation (Weeks 1-2)

> Get the core loop working: wake word → speak → get response → hear response

| # | Task | Priority | Complexity |
|---|---|---|---|
| 1.1 | Set up Picovoice account, train "AYO" wake word | High | Low |
| 1.2 | Integrate Porcupine in `electron/main.ts` | High | Medium |
| 1.3 | Integrate PvRecorder for mic capture | High | Medium |
| 1.4 | Set up Ollama + Qwen 2.5 7B on server | High | Low |
| 1.5 | Build API layer (Express/FastAPI) for chat endpoint | High | Medium |
| 1.6 | Integrate Vosk STT for speech-to-text | High | Medium |
| 1.7 | Integrate Azure Neural TTS for responses | High | Low |
| 1.8 | Update `electron/preload.ts` with new IPC channels | High | Low |
| 1.9 | Connect React Chat page to the full pipeline | High | Medium |
| 1.10 | Set up Tailscale for WAN access between devices | High | Low |

**Milestone:** User says "AYO" → speaks a question → gets a spoken response. End-to-end voice loop working.

### Phase 2: Screen Awareness (Weeks 3-4)

> AYO understands what you're doing

| # | Task | Priority | Complexity |
|---|---|---|---|
| 2.1 | Implement active window title + process name monitoring | High | Low |
| 2.2 | Implement Windows Accessibility API integration | High | High |
| 2.3 | Implement Windows OCR integration | High | Medium |
| 2.4 | Build text similarity algorithm (Jaccard) for dedup | Medium | Low |
| 2.5 | Build context manager (rolling log, storage, retrieval) | High | Medium |
| 2.6 | Build Tier 3 LLM summarization pipeline | High | Medium |
| 2.7 | Feed context into LLM system prompt on every request | High | Low |
| 2.8 | Update Logs page to display context entries | Medium | Low |
| 2.9 | Add screen monitoring toggle to Settings page | Medium | Low |

**Milestone:** AYO knows what app you're using and what you're working on. When you ask "help me with this," it already has context.

### Phase 3: UI & Overlay (Weeks 4-5)

> AYO appears wherever you are

| # | Task | Priority | Complexity |
|---|---|---|---|
| 3.1 | Implement System Tray with status indicator and menu | High | Medium |
| 3.2 | Build floating overlay BrowserWindow | High | Medium |
| 3.3 | Design overlay UI (listening animation, response display) | High | Medium |
| 3.4 | Implement overlay show/hide on wake word detection | High | Low |
| 3.5 | Minimize-to-tray behavior (app runs in background) | Medium | Low |
| 3.6 | Tray balloon notifications | Low | Low |

**Milestone:** AYO lives in the system tray. Saying "AYO" shows a beautiful floating overlay on top of any app.

### Phase 4: OpenClaw Integration (Weeks 5-6)

> AYO can take action

| # | Task | Priority | Complexity |
|---|---|---|---|
| 4.1 | Install and configure OpenClaw on server | High | Medium |
| 4.2 | Point OpenClaw's Brain at Ollama (same Qwen 2.5 7B) | High | Low |
| 4.3 | Build orchestrator routing logic (simple vs. agentic) | High | High |
| 4.4 | Implement function calling format for Qwen 2.5 → OpenClaw | High | High |
| 4.5 | Test agentic tasks: web search, file ops, shell commands | High | Medium |
| 4.6 | Display agentic results in overlay/chat UI | Medium | Medium |

**Milestone:** User can say "AYO, search for the best React animation library" and OpenClaw performs the search, returns results.

### Phase 5: Emotion & Proactive (Weeks 6-8)

> AYO becomes a friend, not just a tool

| # | Task | Priority | Complexity |
|---|---|---|---|
| 5.1 | Set up SpeechBrain emotion model | Medium | Medium |
| 5.2 | Build Python sidecar server (emotion_server.py) | Medium | Medium |
| 5.3 | Package with PyInstaller as standalone .exe | Medium | Medium |
| 5.4 | Integrate emotion data into context pipeline | Medium | Low |
| 5.5 | Implement interest/intervention scoring model | Medium | High |
| 5.6 | Build proactive initiation logic | Medium | High |
| 5.7 | Design proactive overlay messages | Medium | Medium |
| 5.8 | Add proactive settings (sensitivity, cooldown, DND) | Medium | Low |
| 5.9 | Test and tune initiation thresholds with real users | Medium | Medium |

**Milestone:** AYO notices you're struggling and offers help before you ask.

### Phase 6: Gaming Mode & Polish (Weeks 8-9)

> AYO respects your playtime

| # | Task | Priority | Complexity |
|---|---|---|---|
| 6.1 | Implement fullscreen/game detection | Low | Medium |
| 6.2 | Build gaming mode switching logic | Low | Medium |
| 6.3 | Reduce resource footprint in gaming mode | Low | Low |
| 6.4 | Test wake word reliability during gameplay | Low | Low |
| 6.5 | On-demand screen share (Tier 1: text, Tier 2: vision API) | Medium | Medium |
| 6.6 | Performance optimization pass across all features | Medium | Medium |
| 6.7 | UI/UX polish, animations, transitions | Medium | Medium |

**Milestone:** Full feature set working. AYO is a complete AI companion.

### Phase 7: Production & Deployment (Weeks 9-10)

> Ship it

| # | Task | Priority | Complexity |
|---|---|---|---|
| 7.1 | Set up AWS account + Bedrock access | High | Low |
| 7.2 | Deploy OpenClaw to EC2, point Brain at Bedrock | High | Medium |
| 7.3 | Set up Cloudflare Tunnel for production API | High | Medium |
| 7.4 | Purchase domain, configure subdomains | Medium | Low |
| 7.5 | Build Electron installer (NSIS for Windows) | High | Medium |
| 7.6 | Test full pipeline on AWS infrastructure | High | Medium |
| 7.7 | Build landing page for ayoapp.com | Low | Medium |

**Milestone:** AYO is deployed, accessible from anywhere, installable on any Windows PC.

---

## 8. Dependency & Package Map

### NPM Packages to Add (Client — Electron App)

```bash
# Wake Word
npm install @picovoice/porcupine-node @picovoice/pvrecorder-node

# Native module rebuild
npm install --save-dev @electron/rebuild

# Image processing (for perceptual hashing, resize)
npm install sharp

# HTTP client (for API calls to server, Azure TTS)
npm install axios

# STT (Vosk — Node.js bindings)
npm install vosk
# OR for Whisper: use whisper.cpp as a native binary, spawned from Electron
```

### Python Packages (Emotion Detection Sidecar)

```bash
# Create a virtual environment
python -m venv emotion_env

# Install dependencies
pip install speechbrain
pip install flask          # or fastapi + uvicorn
pip install torch torchaudio
pip install pyinstaller    # for packaging into .exe
```

### Server Packages

```bash
# Ollama (install from https://ollama.com)
ollama pull qwen2.5:7b-instruct-q4_K_M

# OpenClaw (follow OpenClaw installation docs)
# https://github.com/openclaw/openclaw

# API Layer (if using Node.js)
npm install express cors helmet jsonwebtoken

# API Layer (if using Python)
pip install fastapi uvicorn httpx
```

### External Services Accounts Needed

| Service | URL | What You Need |
|---|---|---|
| Picovoice | https://console.picovoice.ai | Account + Access Key + trained "AYO" model |
| Azure Speech | https://portal.azure.com | Account + Speech Services API key |
| Tailscale | https://tailscale.com | Account (free tier) |
| Cloudflare | https://cloudflare.com | Account (free tier) + domain |
| OpenAI or Anthropic | https://platform.openai.com | API key (for vision, on-demand) |
| AWS | https://aws.amazon.com | Account (for production deployment) |

---

> **Next step:** Begin with Phase 1 — set up Picovoice, install Ollama, and get the core voice loop working end-to-end.
