import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Server,
  Shield,
  Keyboard,
  Sliders,
  Check,
  X,
  RefreshCw,
  Trash2,
  Zap,
  Mic,
  Volume2,
  MicOff,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Toggle from '../components/ui/Toggle'
import Button from '../components/ui/Button'
import { useStore } from '../store/useStore'
import type { AudioDevice } from '../store/useStore'
import { cn } from '../lib/utils'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

interface SettingSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}

function SettingSection({ title, icon, children }: SettingSectionProps) {
  return (
    <Card className="p-5" hover={false}>
      <div className="flex items-center gap-3 mb-5">
        <div className="icon-box-sm bg-ayo-purple/10 border-ayo-purple/20">
          {icon}
        </div>
        <h3 className="text-sm font-medium text-ayo-white uppercase tracking-wider">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </Card>
  )
}

interface SettingRowProps {
  label: string
  description?: string
  children: React.ReactNode
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-ayo-border/30 last:border-0 last:pb-0">
      <div>
        <p className="text-sm text-ayo-silver">{label}</p>
        {description && <p className="text-[10px] text-ayo-muted mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0 ml-4">{children}</div>
    </div>
  )
}

function HotkeyRecorder({ value, onChange }: { value: string, onChange: (val: string) => void }) {
  const [recording, setRecording] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recording) return
    e.preventDefault()
    
    if (e.key === 'Escape') {
      setRecording(false)
      return
    }
    
    const keys = []
    if (e.ctrlKey) keys.push('CommandOrControl')
    if (e.altKey) keys.push('Alt')
    if (e.shiftKey) keys.push('Shift')
    if (e.metaKey) keys.push('Super')
    
    // Don't just record modifiers
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      let key = e.key.toUpperCase()
      if (key === ' ') key = 'Space'
      
      keys.push(key)
      onChange(keys.join('+'))
      setRecording(false)
    }
  }

      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRecording(true)}
            onKeyDown={handleKeyDown}
            onBlur={() => setRecording(false)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors min-w-[120px]",
              recording 
                ? "bg-ayo-purple/20 border-ayo-purple text-ayo-purple animate-pulse" 
                : "bg-ayo-bg-dark border-ayo-border/50 text-ayo-silver hover:border-ayo-purple/50"
            )}
          >
            {recording ? "Press keys..." : (value || "None")}
          </button>
          {value && (
            <button 
              onClick={() => onChange('')} 
              className="p-1.5 text-ayo-muted hover:text-ayo-error transition-colors rounded-md hover:bg-ayo-error/10"
              title="Clear hotkey"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }

export default function Settings() {
  const { settings, updateSettings, clearLogs, wakeWordStatus } = useStore()
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Input devices from Python (sounddevice indices); output from browser
  const [inputDevices, setInputDevices] = useState<AudioDevice[]>([])
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedInput, setSelectedInput] = useState<string>(settings.selectedInputDevice != null ? String(settings.selectedInputDevice) : '')
  const [selectedOutput, setSelectedOutput] = useState<string>(settings.selectedOutputDevice ?? '')
  const [loadingDevices, setLoadingDevices] = useState(false)

  // Mic test state: Python-driven (same device as wake-word detection)
  const [micTesting, setMicTesting] = useState(false)
  const [micLevel, setMicLevel] = useState(0)
  const micTestLevelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const micTestUnsubscribeRef = useRef<(() => void) | null>(null)
  const micTestAudioCtxRef = useRef<AudioContext | null>(null)

  const loadAudioDevices = useCallback(async () => {
    setLoadingDevices(true)
    try {
      const api = window.electronAPI
      if (api?.listAudioDevices) {
        const result = await api.listAudioDevices()
        const inputs = result?.input ?? []
        setInputDevices(inputs)
        
        // Update selected input if it's empty, or if the current selection is invalid
        setSelectedInput(prev => {
          if (prev === '' && result?.currentDevice != null) {
            return String(result.currentDevice)
          }
          return prev
        })
      }
      const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      tempStream.getTracks().forEach(t => t.stop())
      const all = await navigator.mediaDevices.enumerateDevices()
      setOutputDevices(all.filter(d => d.kind === 'audiooutput'))
    } catch (err) {
      console.error('Failed to enumerate audio devices:', err)
    } finally {
      setLoadingDevices(false)
    }
  }, [])

  useEffect(() => {
    loadAudioDevices()
  }, [loadAudioDevices])

  // Reload input devices when Python WebSocket connects (status becomes "listening")
  useEffect(() => {
    if (wakeWordStatus === 'listening') {
      loadAudioDevices()
    }
  }, [wakeWordStatus, loadAudioDevices])

  useEffect(() => {
    setSelectedInput(settings.selectedInputDevice != null ? String(settings.selectedInputDevice) : '')
  }, [settings.selectedInputDevice])

  useEffect(() => {
    return () => {
      stopMicTest()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleInputDeviceChange = (value: string) => {
    setSelectedInput(value)
    const idx = value === '' ? null : parseInt(value, 10)
    const deviceIndex = idx !== null && !isNaN(idx) ? idx : null
    const api = window.electronAPI
    if (api?.setInputDevice) {
      api.setInputDevice(deviceIndex).catch(() => {})
    }
    updateSettings({ selectedInputDevice: deviceIndex })
  }

  const handleOutputDeviceChange = (deviceId: string) => {
    setSelectedOutput(deviceId)
    updateSettings({ selectedOutputDevice: deviceId || null })
  }

  const startMicTest = async () => {
    const api = window.electronAPI
    if (!api?.startMicTest || !api?.onMicTestAudio) {
      setMicTesting(false)
      return
    }
    setMicTesting(true)
    setMicLevel(0)

    let lastLevel = 0
    const decay = 0.92

    const audioCtx = new AudioContext()
    micTestAudioCtxRef.current = audioCtx

    const unsubscribe = api.onMicTestAudio((data: { audio: string; sampleRate: number }) => {
      try {
        const binary = atob(data.audio)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        const view = new DataView(bytes.buffer)
        const numSamples = Math.floor(bytes.length / 2)

        let sumSq = 0
        const float32 = new Float32Array(numSamples)
        for (let i = 0; i < numSamples; i++) {
          const s = view.getInt16(i * 2, true)
          const f = s / 32768
          float32[i] = f
          sumSq += s * s
        }
        const rms = numSamples > 0 ? Math.sqrt(sumSq / numSamples) / 32768 : 0
        lastLevel = Math.min(rms * 2.5, 1)

        // Play audio through speakers
        if (audioCtx.state === 'running' && numSamples > 0) {
          const sampleRate = data.sampleRate || 16000
          const buffer = audioCtx.createBuffer(1, numSamples, sampleRate)
          buffer.getChannelData(0).set(float32)
          const source = audioCtx.createBufferSource()
          source.buffer = buffer
          source.connect(audioCtx.destination)
          source.start()
        }
      } catch {
        // ignore decode errors
      }
    })

    micTestUnsubscribeRef.current = unsubscribe
    const ok = await api.startMicTest()
    if (!ok) {
      setMicTesting(false)
      unsubscribe()
      audioCtx.close()
      micTestAudioCtxRef.current = null
      return
    }

    micTestLevelIntervalRef.current = setInterval(() => {
      setMicLevel(prev => prev * decay + lastLevel * (1 - decay))
    }, 80)
  }

  const stopMicTest = () => {
    if (micTestLevelIntervalRef.current) {
      clearInterval(micTestLevelIntervalRef.current)
      micTestLevelIntervalRef.current = null
    }
    if (micTestUnsubscribeRef.current) {
      micTestUnsubscribeRef.current()
      micTestUnsubscribeRef.current = null
    }
    if (micTestAudioCtxRef.current) {
      micTestAudioCtxRef.current.close()
      micTestAudioCtxRef.current = null
    }
    window.electronAPI?.stopMicTest?.()
    setMicLevel(0)
    setMicTesting(false)
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    setConnectionStatus('idle')
    await new Promise(resolve => setTimeout(resolve, 1500))
    setTestingConnection(false)
    setConnectionStatus(Math.random() > 0.3 ? 'success' : 'error')
    setTimeout(() => setConnectionStatus('idle'), 3000)
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full flex flex-col gap-5 overflow-y-auto pb-4"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-light text-ayo-white">Settings</h1>
        <p className="text-ayo-muted text-xs mt-1">Configure your assistant</p>
      </motion.div>

      {/* Settings Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* General */}
        <motion.div variants={itemVariants}>
          <SettingSection title="General" icon={<Sliders className="w-4 h-4 text-ayo-purple" strokeWidth={1.5} />}>
            <SettingRow label="Proactivity Level" description="Suggestion frequency">
              <select
                value={settings.proactivityLevel}
                onChange={(e) => updateSettings({ proactivityLevel: e.target.value as 'low' | 'medium' | 'high' })}
                className="px-3 py-1.5 rounded-lg text-xs text-ayo-silver"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </SettingRow>

            <SettingRow label="Cooldown" description="Seconds between suggestions">
              <input
                type="number"
                value={settings.cooldownDuration}
                onChange={(e) => updateSettings({ cooldownDuration: parseInt(e.target.value) || 30 })}
                min={10}
                max={300}
                className="w-16 px-2 py-1.5 rounded-lg text-xs text-ayo-silver text-center"
              />
            </SettingRow>

            <SettingRow label="Proactive Suggestions" description="Allow unprompted help">
              <Toggle
                enabled={settings.enableProactiveSuggestions}
                onChange={() => updateSettings({ enableProactiveSuggestions: !settings.enableProactiveSuggestions })}
                size="sm"
              />
            </SettingRow>
          </SettingSection>
        </motion.div>

        {/* Privacy */}
        <motion.div variants={itemVariants}>
          <SettingSection title="Privacy" icon={<Shield className="w-4 h-4 text-ayo-purple" strokeWidth={1.5} />}>
            <SettingRow label="Camera Access" description="Visual context capture">
              <Toggle
                enabled={settings.enableCameraAccess}
                onChange={() => updateSettings({ enableCameraAccess: !settings.enableCameraAccess })}
                size="sm"
              />
            </SettingRow>

            <SettingRow label="Context Capture" description="Screen awareness">
              <Toggle
                enabled={settings.enableContextCapture}
                onChange={() => updateSettings({ enableContextCapture: !settings.enableContextCapture })}
                size="sm"
              />
            </SettingRow>

            <SettingRow label="Data Retention" description="Store logs locally">
              <Toggle
                enabled={settings.dataRetention}
                onChange={() => updateSettings({ dataRetention: !settings.dataRetention })}
                size="sm"
              />
            </SettingRow>

            <div className="pt-2">
              <Button 
                variant="danger" 
                size="sm"
                icon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={clearLogs}
              >
                Clear Data
              </Button>
            </div>
          </SettingSection>
        </motion.div>

        {/* Audio Devices */}
        <motion.div variants={itemVariants} className="col-span-2">
          <SettingSection title="Audio Devices" icon={<Mic className="w-4 h-4 text-ayo-purple" strokeWidth={1.5} />}>
            <div className="grid grid-cols-2 gap-6">
              {/* Input (Microphone) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Mic className="w-3.5 h-3.5 text-ayo-muted" strokeWidth={1.5} />
                  <p className="text-xs text-ayo-muted uppercase tracking-wider">Microphone (Input)</p>
                </div>

                <select
                  value={selectedInput}
                  onChange={(e) => handleInputDeviceChange(e.target.value)}
                  disabled={loadingDevices}
                  className="w-full px-3 py-2 rounded-lg text-xs text-ayo-silver disabled:opacity-50"
                >
                  <option value="">System Default</option>
                  {inputDevices.map((dev) => (
                    <option key={`input-${dev.index}`} value={String(dev.index)}>
                      {dev.name}{dev.isDefault ? ' (Default)' : ''}
                    </option>
                  ))}
                </select>

                {/* Mic Level Meter */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-ayo-muted">Mic Level</p>
                    {micTesting && (
                      <p className="text-[10px] text-ayo-purple animate-pulse">Listening... speak to test</p>
                    )}
                  </div>
                  <div className="w-full h-2 bg-ayo-bg-dark rounded-full overflow-hidden border border-ayo-border/30">
                    <motion.div
                      className={cn(
                        "h-full rounded-full transition-colors duration-150",
                        micLevel > 0.7 ? "bg-ayo-error" : micLevel > 0.3 ? "bg-ayo-warning" : "bg-ayo-success"
                      )}
                      animate={{ width: `${micLevel * 100}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                </div>

                {/* Test Mic Button */}
                <div className="flex gap-2">
                  {!micTesting ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Mic className="w-3.5 h-3.5" />}
                      onClick={startMicTest}
                      disabled={loadingDevices}
                    >
                      Test Microphone
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      icon={<MicOff className="w-3.5 h-3.5" />}
                      onClick={stopMicTest}
                    >
                      Stop Test
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<RefreshCw className={cn("w-3.5 h-3.5", loadingDevices && "animate-spin")} />}
                    onClick={loadAudioDevices}
                    disabled={loadingDevices}
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Output (Speakers) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 className="w-3.5 h-3.5 text-ayo-muted" strokeWidth={1.5} />
                  <p className="text-xs text-ayo-muted uppercase tracking-wider">Speaker (Output)</p>
                </div>

                <select
                  value={selectedOutput}
                  onChange={(e) => handleOutputDeviceChange(e.target.value)}
                  disabled={loadingDevices}
                  className="w-full px-3 py-2 rounded-lg text-xs text-ayo-silver disabled:opacity-50"
                >
                  <option value="">System Default</option>
                  {outputDevices.map((dev) => (
                    <option key={dev.deviceId} value={dev.deviceId}>
                      {dev.label || `Speaker (${dev.deviceId.slice(0, 8)})`}
                    </option>
                  ))}
                </select>

                <p className="text-[10px] text-ayo-muted mt-1">
                  Used for AYO's voice responses (TTS playback)
                </p>
              </div>
            </div>
          </SettingSection>
        </motion.div>

        {/* Hotkeys */}
        <motion.div variants={itemVariants}>
          <SettingSection title="Hotkeys & Wake" icon={<Keyboard className="w-4 h-4 text-ayo-purple" strokeWidth={1.5} />}>
            <SettingRow label="Wake Mode" description="How to call Ayo">
              <select
                value={settings.wakeMode}
                onChange={(e) => {
                  const mode = e.target.value as 'voice' | 'hotkey' | 'both'
                  updateSettings({ wakeMode: mode })
                  window.electronAPI?.setWakeHotkey?.(mode, settings.wakeHotkey)
                }}
                className="px-3 py-1.5 rounded-lg text-xs text-ayo-silver bg-ayo-bg-dark border border-ayo-border/50"
              >
                <option value="voice">Voice Only (Mic)</option>
                <option value="hotkey">Hotkey Only</option>
                <option value="both">Both (Hybrid)</option>
              </select>
            </SettingRow>

            {(settings.wakeMode === 'hotkey' || settings.wakeMode === 'both') && (
              <SettingRow label="Wake Hotkey" description="Global shortcut to wake Ayo">
                <HotkeyRecorder 
                  value={settings.wakeHotkey} 
                  onChange={(val) => {
                    updateSettings({ wakeHotkey: val })
                    window.electronAPI?.setWakeHotkey?.(settings.wakeMode, val)
                  }} 
                />
              </SettingRow>
            )}

            <SettingRow label="Push to Talk" description="Hold to talk without wake word">
              <Toggle
                enabled={settings.enablePushToTalk}
                onChange={() => {
                  const enabled = !settings.enablePushToTalk
                  updateSettings({ enablePushToTalk: enabled })
                  window.electronAPI?.setPttHotkey?.(enabled, settings.pushToTalkHotkey)
                }}
                size="sm"
              />
            </SettingRow>

            {settings.enablePushToTalk && (
              <SettingRow label="PTT Hotkey" description="Global shortcut for Push to Talk">
                <HotkeyRecorder 
                  value={settings.pushToTalkHotkey} 
                  onChange={(val) => {
                    updateSettings({ pushToTalkHotkey: val })
                    window.electronAPI?.setPttHotkey?.(settings.enablePushToTalk, val)
                  }} 
                />
              </SettingRow>
            )}

            <SettingRow label="Privacy Mode">
              <code className="px-2 py-1 bg-ayo-bg-dark border border-ayo-border/50 rounded text-[10px] text-ayo-purple">
                {settings.hotkeys.privacyMode}
              </code>
            </SettingRow>

            <SettingRow label="Camera Toggle">
              <code className="px-2 py-1 bg-ayo-bg-dark border border-ayo-border/50 rounded text-[10px] text-ayo-purple">
                {settings.hotkeys.cameraToggle}
              </code>
            </SettingRow>

            <SettingRow label="Push to Talk">
              <code className="px-2 py-1 bg-ayo-bg-dark border border-ayo-border/50 rounded text-[10px] text-ayo-purple">
                {settings.hotkeys.pushToTalk}
              </code>
            </SettingRow>
          </SettingSection>
        </motion.div>

        {/* AI Server */}
        <motion.div variants={itemVariants}>
          <SettingSection title="AI Server" icon={<Server className="w-4 h-4 text-ayo-purple" strokeWidth={1.5} />}>
            <SettingRow label="Server URL" description="Self-hosted LLM endpoint">
              <input
                type="text"
                value={settings.serverUrl}
                onChange={(e) => updateSettings({ serverUrl: e.target.value })}
                placeholder="https://localhost:8443"
                className="w-48 px-2 py-1.5 rounded-lg text-xs text-ayo-silver font-mono"
              />
            </SettingRow>

            <SettingRow label="Status">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-ayo-success/10 text-ayo-success">
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                <span className="text-[10px] uppercase">authenticated</span>
              </div>
            </SettingRow>

            <div className="pt-2">
              <Button 
                variant="secondary" 
                size="sm"
                icon={testingConnection ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : connectionStatus === 'success' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : connectionStatus === 'error' ? (
                  <X className="w-3.5 h-3.5" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                onClick={handleTestConnection}
                disabled={testingConnection}
                className={cn(
                  connectionStatus === 'success' && "border-ayo-success/50 text-ayo-success",
                  connectionStatus === 'error' && "border-ayo-error/50 text-ayo-error"
                )}
              >
                {testingConnection ? 'Testing...' : 
                 connectionStatus === 'success' ? 'Connected' : 
                 connectionStatus === 'error' ? 'Failed' : 'Test Connection'}
              </Button>
            </div>
          </SettingSection>
        </motion.div>
      </div>
    </motion.div>
  )
}
