import { create } from 'zustand'

const SELECTED_INPUT_DEVICE_KEY = 'ayo-selectedInputDevice'
const WAKE_MODE_KEY = 'ayo-wakeMode'
const WAKE_HOTKEY_KEY = 'ayo-wakeHotkey'
const PTT_ENABLED_KEY = 'ayo-pttEnabled'
const PTT_HOTKEY_KEY = 'ayo-pttHotkey'

function getStoredInputDevice(): number | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const s = localStorage.getItem(SELECTED_INPUT_DEVICE_KEY)
    if (s == null || s === '') return null
    const n = parseInt(s, 10)
    return Number.isNaN(n) ? null : n
  } catch {
    return null
  }
}

function setStoredInputDevice(value: number | null) {
  if (typeof localStorage === 'undefined') return
  try {
    if (value == null) localStorage.removeItem(SELECTED_INPUT_DEVICE_KEY)
    else localStorage.setItem(SELECTED_INPUT_DEVICE_KEY, String(value))
  } catch { /* ignore */ }
}

function getStoredWakeMode(): 'voice' | 'hotkey' | 'both' {
  if (typeof localStorage === 'undefined') return 'both'
  try {
    const s = localStorage.getItem(WAKE_MODE_KEY)
    if (s === 'voice' || s === 'hotkey' || s === 'both') return s
  } catch { /* ignore */ }
  return 'both'
}

function getStoredWakeHotkey(): string {
  if (typeof localStorage === 'undefined') return 'CommandOrControl+Shift+A'
  try {
    return localStorage.getItem(WAKE_HOTKEY_KEY) || 'CommandOrControl+Shift+A'
  } catch { /* ignore */ }
  return 'CommandOrControl+Shift+A'
}

function getStoredPttEnabled(): boolean {
  if (typeof localStorage === 'undefined') return false
  try {
    return localStorage.getItem(PTT_ENABLED_KEY) === 'true'
  } catch { /* ignore */ }
  return false
}

function getStoredPttHotkey(): string {
  if (typeof localStorage === 'undefined') return 'CommandOrControl+Space'
  try {
    return localStorage.getItem(PTT_HOTKEY_KEY) || 'CommandOrControl+Space'
  } catch { /* ignore */ }
  return 'CommandOrControl+Space'
}

export type AssistantStatus = 'idle' | 'listening' | 'processing' | 'responding'
export type ConnectionStatus = 'online' | 'offline' | 'connecting'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    usedAI?: boolean
    contextUsed?: boolean
    processingTime?: number
  }
}

export interface LogEntry {
  id: string
  type: 'info' | 'warning' | 'error' | 'ai' | 'system'
  message: string
  timestamp: Date
  details?: string
}

export interface AudioDevice {
  index: number
  name: string
  channels: number
  sampleRate: number
  isDefault: boolean
}

export interface Settings {
  serverUrl: string
  proactivityLevel: 'low' | 'medium' | 'high'
  cooldownDuration: number
  enableProactiveSuggestions: boolean
  enableCameraAccess: boolean
  enableContextCapture: boolean
  dataRetention: boolean
  selectedInputDevice: number | null
  selectedOutputDevice: string | null
  wakeMode: 'voice' | 'hotkey' | 'both'
  wakeHotkey: string
  enablePushToTalk: boolean
  pushToTalkHotkey: string
  hotkeys: {
    privacyMode: string
    cameraToggle: string
    pushToTalk: string
  }
}

export type WakeWordStatus = 'stopped' | 'listening' | 'disconnected' | 'detected'

interface AppState {
  // Status
  assistantStatus: AssistantStatus
  connectionStatus: ConnectionStatus
  
  // Wake Word
  wakeWordStatus: WakeWordStatus
  wakeWordEnabled: boolean
  lastWakeWordTranscript: string | null
  lastWakeWordTime: number | null
  
  // Privacy
  privacyMode: boolean
  cameraEnabled: boolean
  contextCaptureEnabled: boolean
  
  // Messages
  messages: Message[]
  
  // Logs
  logs: LogEntry[]
  
  // Settings
  settings: Settings
  
  // System Info
  cpuUsage: number
  memoryUsage: number
  serverLatency: number
  lastInteractionTime: Date | null
  
  // Actions
  setAssistantStatus: (status: AssistantStatus) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setWakeWordStatus: (status: WakeWordStatus) => void
  setWakeWordEnabled: (enabled: boolean) => void
  onWakeWordDetected: (transcript: string, timestamp: number) => void
  clearWakeWordDetection: () => void
  togglePrivacyMode: () => void
  toggleCamera: () => void
  toggleContextCapture: () => void
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void
  updateSettings: (settings: Partial<Settings>) => void
  updateSystemInfo: (info: { cpuUsage?: number; memoryUsage?: number; serverLatency?: number }) => void
  clearLogs: () => void
}

export const useStore = create<AppState>((set) => ({
  // Initial Status
  assistantStatus: 'idle',
  connectionStatus: 'online',
  
  // Wake Word
  wakeWordStatus: 'stopped',
  wakeWordEnabled: true,
  lastWakeWordTranscript: null,
  lastWakeWordTime: null,
  
  // Privacy defaults
  privacyMode: false,
  cameraEnabled: false,
  contextCaptureEnabled: true,
  
  // Messages
  messages: [
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m Ayo, your AI copilot assistant. How can I help you today?',
      timestamp: new Date(),
      metadata: { usedAI: true, contextUsed: false }
    }
  ],
  
  // Initial Logs
  logs: [
    { id: '1', type: 'system', message: 'Application started', timestamp: new Date() },
    { id: '2', type: 'info', message: 'Connected to AI server', timestamp: new Date() },
    { id: '3', type: 'ai', message: 'AI model initialized', timestamp: new Date() },
  ],
  
  // Default Settings (selectedInputDevice persisted to localStorage)
  settings: {
    serverUrl: 'https://localhost:8443',
    proactivityLevel: 'medium',
    cooldownDuration: 30,
    enableProactiveSuggestions: true,
    enableCameraAccess: false,
    enableContextCapture: true,
    dataRetention: false,
    selectedInputDevice: getStoredInputDevice(),
    selectedOutputDevice: null,
    wakeMode: getStoredWakeMode(),
    wakeHotkey: getStoredWakeHotkey(),
    enablePushToTalk: getStoredPttEnabled(),
    pushToTalkHotkey: getStoredPttHotkey(),
    hotkeys: {
      privacyMode: 'Ctrl+Shift+P',
      cameraToggle: 'Ctrl+Shift+C',
      pushToTalk: 'Space',
    }
  },
  
  // System Info
  cpuUsage: 23,
  memoryUsage: 45,
  serverLatency: 42,
  lastInteractionTime: new Date(),
  
  // Actions
  setAssistantStatus: (status) => set({ assistantStatus: status }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  
  setWakeWordStatus: (status) => set({ wakeWordStatus: status }),
  setWakeWordEnabled: (enabled) => set({ wakeWordEnabled: enabled }),

  onWakeWordDetected: (transcript, timestamp) => set((state) => ({
    wakeWordStatus: 'detected',
    lastWakeWordTranscript: transcript,
    lastWakeWordTime: timestamp,
    assistantStatus: 'listening',
    logs: [...state.logs, {
      id: Date.now().toString(),
      type: 'ai',
      message: `Wake word detected: "${transcript}"`,
      timestamp: new Date(timestamp),
    }],
  })),

  clearWakeWordDetection: () => set({
    wakeWordStatus: 'listening',
    assistantStatus: 'idle',
  }),
  
  togglePrivacyMode: () => set((state) => {
    const newPrivacyMode = !state.privacyMode
    return {
      privacyMode: newPrivacyMode,
      cameraEnabled: newPrivacyMode ? false : state.cameraEnabled,
      contextCaptureEnabled: newPrivacyMode ? false : state.contextCaptureEnabled,
      logs: [...state.logs, {
        id: Date.now().toString(),
        type: 'system',
        message: newPrivacyMode ? 'Privacy mode enabled' : 'Privacy mode disabled',
        timestamp: new Date()
      }]
    }
  }),
  
  toggleCamera: () => set((state) => ({
    cameraEnabled: state.privacyMode ? false : !state.cameraEnabled,
    logs: [...state.logs, {
      id: Date.now().toString(),
      type: 'system',
      message: `Camera ${!state.cameraEnabled ? 'enabled' : 'disabled'}`,
      timestamp: new Date()
    }]
  })),
  
  toggleContextCapture: () => set((state) => ({
    contextCaptureEnabled: state.privacyMode ? false : !state.contextCaptureEnabled,
    logs: [...state.logs, {
      id: Date.now().toString(),
      type: 'system',
      message: `Context capture ${!state.contextCaptureEnabled ? 'enabled' : 'disabled'}`,
      timestamp: new Date()
    }]
  })),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    }],
    lastInteractionTime: new Date()
  })),
  
  addLog: (log) => set((state) => ({
    logs: [...state.logs, {
      ...log,
      id: Date.now().toString(),
      timestamp: new Date()
    }]
  })),
  
  updateSettings: (newSettings) => set((state) => {
    if (newSettings.selectedInputDevice !== undefined) {
      setStoredInputDevice(newSettings.selectedInputDevice)
    }
    if (newSettings.wakeMode !== undefined) {
      try { localStorage.setItem(WAKE_MODE_KEY, newSettings.wakeMode) } catch {}
    }
    if (newSettings.wakeHotkey !== undefined) {
      try { localStorage.setItem(WAKE_HOTKEY_KEY, newSettings.wakeHotkey) } catch {}
    }
    if (newSettings.enablePushToTalk !== undefined) {
      try { localStorage.setItem(PTT_ENABLED_KEY, String(newSettings.enablePushToTalk)) } catch {}
    }
    if (newSettings.pushToTalkHotkey !== undefined) {
      try { localStorage.setItem(PTT_HOTKEY_KEY, newSettings.pushToTalkHotkey) } catch {}
    }
    return { settings: { ...state.settings, ...newSettings } }
  }),
  
  updateSystemInfo: (info) => set((state) => ({
    cpuUsage: info.cpuUsage ?? state.cpuUsage,
    memoryUsage: info.memoryUsage ?? state.memoryUsage,
    serverLatency: info.serverLatency ?? state.serverLatency
  })),
  
  clearLogs: () => set({ logs: [] })
}))
