# AYO — What We're Building & How

Hey team, here's the rundown of everything we're doing with AYO and what each piece does. Read this before we start working.

---

## What is AYO?

An AI desktop companion that actually knows what you're doing. You say "AYO" and it wakes up, already aware of your screen, your context, and your mood. It can talk to you, do stuff for you, and even start conversations when it sees you struggling.

Think of it like having a smart friend sitting next to you while you work.

---

## The Big Picture

```
Your PC (Electron App)                    Our Server (i7 + GTX 1650)
┌──────────────────────┐                  ┌──────────────────────┐
│ "AYO" wake word      │                  │ Ollama (LLM brain)   │
│ Mic → Speech to text │ ──── network ──► │ OpenClaw (does tasks) │
│ Screen monitoring    │ ◄── network ──── │ API layer            │
│ Emotion detection    │                  └──────────────────────┘
│ Overlay UI           │
│ Plays voice response │ ──── internet ──► Azure TTS (voice API)
└──────────────────────┘
```

Short version: the app runs on the user's PC, the brain runs on our server.

---

## What We're Using (and Why)

### On the User's PC (Electron App)

| What | Tool | Why this one |
|---|---|---|
| Wake word ("AYO") | **Porcupine** (by Picovoice) | Offline, lightweight, custom wake words, free tier |
| Speech to text | **Vosk** | Offline, fast, small model (~50MB) |
| Screen reading | **Windows OCR** + **Accessibility API** | Built into Windows, free, no GPU needed |
| Emotion detection | **SpeechBrain** (Python) | Offline, detects frustration/mood from voice |
| Voice response | **Azure Neural TTS** (API call) | Warm natural voices, 500K chars/month free |
| The app itself | **Electron + React + TypeScript** | Already built, desktop app with nice UI |

### On Our Server

| What | Tool | Why this one |
|---|---|---|
| LLM (the brain) | **Qwen 2.5 7B** via **Ollama** | Best reasoning at our hardware limit, fits in 4GB VRAM |
| Agent tasks | **OpenClaw** | Handles web searches, file ops, shell commands, automation |
| Network access | **Tailscale** | Free VPN so we can access the server from anywhere |
| Reverse proxy | **Nginx** | Routes requests, handles HTTPS |

### External Accounts We Need

| Service | What for | Link |
|---|---|---|
| Picovoice | Wake word model + API key | console.picovoice.ai |
| Azure | TTS voice API key | portal.azure.com |
| Tailscale | VPN between our devices | tailscale.com |
| OpenAI or Anthropic | Vision API (screenshot understanding, optional) | platform.openai.com |

---

## Features — What Each One Does

### 1. Wake Word — "AYO"
You say "AYO" anywhere on your PC and the assistant activates. Like "Hey Siri" but ours. Uses Porcupine which listens in the background using barely any CPU (~1-2%). We train a custom model on Picovoice's website.

### 2. Voice Conversation
After saying "AYO", you speak your question. Vosk converts your speech to text (offline, on your PC). Text goes to the server → LLM thinks → response comes back → Azure TTS turns it into natural speech → you hear it. The whole loop.

### 3. Screen Awareness
AYO knows what you're doing at all times. Every ~30 seconds it checks:
- What app are you using (window title, process name)
- What's on screen (Accessibility API reads UI elements, OCR reads text)
- Is this different from last time? (text comparison algorithm)

If something changed, it sends the text to the LLM to summarize into one sentence like "User is editing main.ts in VS Code, working on the login function." These summaries go into a rolling log. **No screenshots are ever saved.**

### 4. Emotion Detection
When you talk to AYO, it also checks your voice tone using SpeechBrain. Detects: happy, sad, angry, neutral, frustrated. This feeds into the proactive system — if you sound frustrated, AYO is more likely to offer help.

### 5. Proactive Conversations
AYO can START talking to you. It has a scoring system:
- Error messages on screen? +3 points
- You sound frustrated? +3 points
- Same task repeated multiple times? +2 points
- Searching for help on Google? +2 points
- Score hits 5+ → AYO offers help

Has a cooldown so it doesn't spam you. User can adjust sensitivity or turn it off in Settings.

### 6. Floating Overlay
When AYO activates (wake word or proactive), a small floating window appears ON TOP of whatever you're doing. Transparent, frameless, always-on-top. Shows the listening animation, AI response, etc. Works even when you're in another app.

### 7. System Tray
AYO icon sits in the Windows taskbar tray (bottom right). Shows it's running and listening. Right-click for options. App can minimize to tray and run in background.

### 8. Agent Tasks (OpenClaw)
When you ask AYO to DO something (not just answer), the LLM routes it to OpenClaw. OpenClaw can:
- Search the web
- Read/create/edit files
- Run shell commands
- Call APIs
- Multi-step tasks (search → read → summarize)

### 9. Gaming Mode
When AYO detects a game (fullscreen app, known game processes), it goes to sleep. Stops all screen monitoring and emotion detection. Only keeps the wake word running (~1% CPU). You can still say "AYO" to ask about the game. It knows what game you're playing from the process name.

### 10. Screen Share on Demand
When you call "AYO" and ask for help, it grabs a detailed snapshot of your screen at that moment — accessibility tree + OCR text + recent context logs. All packaged and sent to the LLM so it understands exactly what you're looking at. For complex visual stuff, we can optionally send a screenshot to GPT-4o/Claude Vision (~$0.01 per call).

---

## How to Think About the Architecture

```
User says "AYO"
    ↓
Porcupine catches it
    ↓
User speaks: "How do I fix this error?"
    ↓
Vosk converts speech → text
    ↓
App grabs screen context (what app, what's on screen, recent activity)
    ↓
Everything sent to our server
    ↓
Qwen 2.5 7B decides:
    ├── Simple answer → responds directly
    └── Needs action → sends to OpenClaw → OpenClaw does it → returns result
    ↓
Response text sent back to app
    ↓
Azure TTS converts to speech → user hears it
    ↓
Displayed in floating overlay too
```

---

## Work Order — What to Build First

### Round 1: Core Voice Loop ⭐ START HERE

Get this working first. Everything else builds on it.

**What:** Say "AYO" → speak → get a spoken response back.

**Tasks:**
- [ ] Sign up for Picovoice, train the "AYO" wake word, download the `.ppn` file
- [ ] Install Porcupine + PvRecorder in our Electron main process
- [ ] Install Ollama on the server, pull Qwen 2.5 7B
- [ ] Build a basic API endpoint on the server (`POST /api/chat`)
- [ ] Integrate Vosk for speech-to-text in Electron
- [ ] Integrate Azure TTS for the voice response
- [ ] Wire it all together: wake word → STT → server → TTS → play audio
- [ ] Set up Tailscale so we can reach the server from our PCs

**When this works:** you can talk to AYO and it talks back. That's the demo.

---

### Round 2: Screen Context

**What:** AYO knows what you're doing.

**Tasks:**
- [ ] Read active window title + process name (Win32 API)
- [ ] Integrate Windows Accessibility API (reads UI element tree)
- [ ] Integrate Windows OCR (reads text from screen)
- [ ] Build the text comparison algorithm (Jaccard similarity) to skip duplicate captures
- [ ] Build the context manager (stores rolling log of summaries)
- [ ] Feed context into the LLM prompt on every request
- [ ] Show context logs in the Logs page

**When this works:** you ask "help me with this" and AYO already knows what "this" is.

---

### Round 3: Overlay + Tray

**What:** AYO appears on screen wherever you are.

**Tasks:**
- [ ] Build the system tray icon + menu
- [ ] Build the floating overlay window (always-on-top, transparent)
- [ ] Design the overlay UI (listening state, response state, dismiss)
- [ ] Connect wake word detection → overlay appears
- [ ] Minimize-to-tray behavior

**When this works:** AYO pops up over any app when you call it.

---

### Round 4: OpenClaw (Agent Tasks)

**What:** AYO can do things, not just talk.

**Tasks:**
- [ ] Install and configure OpenClaw on the server
- [ ] Point OpenClaw at our Ollama instance (same LLM)
- [ ] Build the routing logic in the LLM — decide simple vs agentic
- [ ] Test: web search, file operations, shell commands
- [ ] Show agent results in the overlay/chat

**When this works:** "AYO, find me the best React animation library" → actually searches and returns results.

---

### Round 5: Emotion + Proactive

**What:** AYO reads your mood and starts conversations.

**Tasks:**
- [ ] Set up SpeechBrain emotion model
- [ ] Build the Python sidecar (small server, packaged with PyInstaller into .exe)
- [ ] Feed emotion data into the context pipeline
- [ ] Build the interest/intervention scoring system
- [ ] Build proactive conversation initiation
- [ ] Add sensitivity/cooldown controls in Settings
- [ ] Test and tune thresholds (this takes trial and error)

**When this works:** AYO notices you're frustrated and asks if you need help.

---

### Round 6: Gaming Mode + Polish

**What:** AYO knows when to shut up. Final polish.

**Tasks:**
- [ ] Detect fullscreen games / known game processes
- [ ] Pause monitoring, keep only wake word active
- [ ] Performance optimization across everything
- [ ] UI polish, animations, edge cases
- [ ] On-demand vision API integration (optional)

**When this works:** full product. AYO is a complete AI companion.

---

### Round 7: Deploy to Production (AWS)

**What:** Move from our local server to AWS.

**Tasks:**
- [ ] Set up AWS + Amazon Bedrock (replaces our local Ollama)
- [ ] Deploy OpenClaw to EC2 (cheap CPU instance, no GPU needed)
- [ ] Buy domain, set up Cloudflare Tunnel
- [ ] Configure subdomains (ayoapp.com, api.ayoapp.com)
- [ ] Build the Electron installer for distribution
- [ ] Build a landing page

---

## Quick Reference — Who Needs What Installed

### Everyone (developers)
- Node.js 18+
- npm
- Visual Studio Build Tools (C++ workload) — for native Electron modules
- Tailscale — for accessing the server
- Git

### Server machine (i7 + GTX 1650)
- Ollama + Qwen 2.5 7B model
- OpenClaw
- Node.js or Python (for API layer)
- Nginx
- Tailscale

### For the emotion detection feature
- Python 3.10+
- PyInstaller
- SpeechBrain + PyTorch

---

## Quick Answers to Common Questions

**Q: Does the user need a GPU?**
No. Everything on the user's PC runs on CPU. The GPU is only on our server for the LLM.

**Q: Does it work offline?**
Partially. Wake word, screen monitoring, and STT work offline. The LLM brain needs network access to our server. TTS needs internet (Azure API) but we have Piper as an offline fallback.

**Q: How much does it cost to run?**
For testing: $0 (all free tiers + our own hardware). For AWS production: ~$60-100/month depending on usage.

**Q: How much RAM/CPU does AYO use on the user's PC?**
Normal mode: ~60MB RAM, ~3% CPU. Gaming mode: ~10MB RAM, ~1% CPU.

**Q: What about privacy?**
No screenshots saved. No audio saved. No raw text saved. Only short summaries (1-2 sentences) stored in a rolling log that the user can delete anytime.

---

Let's start with Round 1. Once we can talk to AYO and hear it talk back, everything else is building on top of that.
