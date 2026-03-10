import { useEffect } from 'react'
import { useStore } from '../store/useStore'

const DETECTION_DISPLAY_MS = 4000

/**
 * Connects Electron's wake-word IPC events to the Zustand store.
 * Mount this once at the app root (e.g. in App.tsx or Layout).
 */
export function useWakeWord() {
  const { setWakeWordStatus, onWakeWordDetected, clearWakeWordDetection } = useStore()

  useEffect(() => {
    const api = window.electronAPI
    if (!api?.onWakeWordDetected) return

    const removeDetected = api.onWakeWordDetected((data) => {
      console.log('[useWakeWord] AYO detected:', data.transcript)
      onWakeWordDetected(data.transcript, data.timestamp)

      setTimeout(() => {
        clearWakeWordDetection()
      }, DETECTION_DISPLAY_MS)
    })

    const removeStatus = api.onWakeWordStatus?.((data) => {
      console.log('[useWakeWord] Status:', data.status)
      if (data.status === 'listening' || data.status === 'stopped' || data.status === 'disconnected') {
        setWakeWordStatus(data.status)
        if (data.status === 'listening') {
          const savedDevice = useStore.getState().settings.selectedInputDevice
          if (savedDevice != null && api.setInputDevice) {
            api.setInputDevice(savedDevice).catch(() => {})
          }
        }
      }
    })

    return () => {
      removeDetected()
      removeStatus?.()
    }
  }, [setWakeWordStatus, onWakeWordDetected, clearWakeWordDetection])
}
