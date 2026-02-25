import { create } from 'zustand'

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

export interface Settings {
  serverUrl: string
  proactivityLevel: 'low' | 'medium' | 'high'
  cooldownDuration: number
  enableProactiveSuggestions: boolean
  enableCameraAccess: boolean
  enableContextCapture: boolean
  dataRetention: boolean
  hotkeys: {
    privacyMode: string
    cameraToggle: string
    pushToTalk: string
  }
}

interface AppState {
  // Status
  assistantStatus: AssistantStatus
  connectionStatus: ConnectionStatus
  
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
  
  // Default Settings
  settings: {
    serverUrl: 'https://localhost:8443',
    proactivityLevel: 'medium',
    cooldownDuration: 30,
    enableProactiveSuggestions: true,
    enableCameraAccess: false,
    enableContextCapture: true,
    dataRetention: false,
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
  
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),
  
  updateSystemInfo: (info) => set((state) => ({
    cpuUsage: info.cpuUsage ?? state.cpuUsage,
    memoryUsage: info.memoryUsage ?? state.memoryUsage,
    serverLatency: info.serverLatency ?? state.serverLatency
  })),
  
  clearLogs: () => set({ logs: [] })
}))
