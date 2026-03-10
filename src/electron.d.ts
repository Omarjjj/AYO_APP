interface AudioDeviceList {
  input: Array<{ index: number; name: string; channels: number; sampleRate: number; isDefault: boolean }>
  output: Array<{ index: number; name: string; channels: number; sampleRate: number; isDefault: boolean }>
  currentDevice: number | null
}

declare global {
  interface Window {
    electronAPI?: {
      minimizeWindow: () => void
      maximizeWindow: () => void
      closeWindow: () => void
      startWakeWord: () => Promise<{ success: boolean }>
      stopWakeWord: () => Promise<{ success: boolean }>
      getWakeWordStatus: () => Promise<{ enabled: boolean; pythonRunning: boolean; wsConnected: boolean }>
      onWakeWordDetected: (callback: (data: { transcript: string; timestamp: number }) => void) => () => void
      onWakeWordStatus: (callback: (data: { status: string }) => void) => () => void
      listAudioDevices: () => Promise<AudioDeviceList>
      setInputDevice: (deviceIndex: number | null) => Promise<{ success: boolean; deviceIndex?: number }>
      startMicTest: () => Promise<boolean>
      stopMicTest: () => Promise<boolean>
      onMicTestAudio: (callback: (data: { audio: string; sampleRate: number }) => void) => () => void
    }
  }
}

export {}
