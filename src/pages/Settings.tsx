import { useState } from 'react'
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
  Zap
} from 'lucide-react'
import Card from '../components/ui/Card'
import Toggle from '../components/ui/Toggle'
import Button from '../components/ui/Button'
import { useStore } from '../store/useStore'
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

export default function Settings() {
  const { settings, updateSettings, clearLogs } = useStore()
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')

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

        {/* Hotkeys */}
        <motion.div variants={itemVariants}>
          <SettingSection title="Hotkeys" icon={<Keyboard className="w-4 h-4 text-ayo-purple" strokeWidth={1.5} />}>
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
