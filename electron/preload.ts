import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),

  // Wake word controls
  startWakeWord: () => ipcRenderer.invoke('wake-word-start'),
  stopWakeWord: () => ipcRenderer.invoke('wake-word-stop'),
  getWakeWordStatus: () => ipcRenderer.invoke('wake-word-status'),

  // Context pipeline
  getContextStatus: () => ipcRenderer.invoke('context-get-status'),

  // Wake word events (main → renderer)
  onWakeWordDetected: (callback: (data: { transcript: string; timestamp: number }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { transcript: string; timestamp: number }) => callback(data)
    ipcRenderer.on('wake-word-detected', handler)
    return () => ipcRenderer.removeListener('wake-word-detected', handler)
  },

  onWakeWordStatus: (callback: (data: { status: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { status: string }) => callback(data)
    ipcRenderer.on('wake-word-status', handler)
    return () => ipcRenderer.removeListener('wake-word-status', handler)
  },

  // Audio device management
  listAudioDevices: () => ipcRenderer.invoke('audio-list-devices'),
  setInputDevice: (deviceIndex: number | null) => ipcRenderer.invoke('audio-set-input-device', deviceIndex),
  startMicTest: () => ipcRenderer.invoke('audio-start-mic-test'),
  stopMicTest: () => ipcRenderer.invoke('audio-stop-mic-test'),

  onMicTestAudio: (callback: (data: { audio: string; sampleRate: number }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { audio: string; sampleRate: number }) => callback(data)
    ipcRenderer.on('mic-test-audio', handler)
    return () => ipcRenderer.removeListener('mic-test-audio', handler)
  },
})

export interface AudioDevice {
  index: number
  name: string
  channels: number
  sampleRate: number
  isDefault: boolean
}

export interface AudioDeviceList {
  input: AudioDevice[]
  output: AudioDevice[]
  currentDevice: number | null
}

declare global {
  interface Window {
    electronAPI: {
      minimizeWindow: () => void
      maximizeWindow: () => void
      closeWindow: () => void
      startWakeWord: () => Promise<{ success: boolean }>
      stopWakeWord: () => Promise<{ success: boolean }>
      getWakeWordStatus: () => Promise<{
        enabled: boolean
        pythonRunning: boolean
        wsConnected: boolean
      }>
      getContextStatus: () => Promise<any>
      onWakeWordDetected: (
        callback: (data: { transcript: string; timestamp: number }) => void
      ) => () => void
      onWakeWordStatus: (
        callback: (data: { status: string }) => void
      ) => () => void
      listAudioDevices: () => Promise<AudioDeviceList>
      setInputDevice: (deviceIndex: number | null) => Promise<{ success: boolean; deviceIndex?: number }>
      startMicTest: () => Promise<boolean>
      stopMicTest: () => Promise<boolean>
      onMicTestAudio: (
        callback: (data: { audio: string; sampleRate: number }) => void
      ) => () => void
    }
  }
}
