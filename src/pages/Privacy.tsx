import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { 
  Shield, 
  ShieldOff,
  Camera,
  Eye,
  Brain,
  MessageSquare,
  Lock,
  Unlock,
  Check,
  AlertTriangle
} from 'lucide-react'
import Card from '../components/ui/Card'
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

interface StatusCardProps {
  icon: React.ReactNode
  label: string
  status: 'on' | 'off' | 'blocked'
  description: string
}

function StatusCard({ icon, label, status, description }: StatusCardProps) {
  const statusConfig = {
    on: { color: 'text-ayo-success', bg: 'bg-ayo-success/10', border: 'border-ayo-success/30' },
    off: { color: 'text-ayo-muted', bg: 'bg-ayo-bg-card', border: 'border-ayo-border/50' },
    blocked: { color: 'text-ayo-warning', bg: 'bg-ayo-warning/10', border: 'border-ayo-warning/30' }
  }
  const config = statusConfig[status]

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn("p-4 rounded-xl border transition-all", config.bg, config.border)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("icon-box-sm", config.bg, config.border)}>
          <span className={config.color}>{icon}</span>
        </div>
        <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full uppercase", config.bg, config.color)}>
          {status}
        </span>
      </div>
      <p className="text-sm text-ayo-white">{label}</p>
      <p className="text-[10px] text-ayo-muted mt-0.5">{description}</p>
    </motion.div>
  )
}

export default function Privacy() {
  const shieldRef = useRef<HTMLDivElement>(null)
  const { privacyMode, cameraEnabled, contextCaptureEnabled, togglePrivacyMode } = useStore()

  useEffect(() => {
    if (shieldRef.current && privacyMode) {
      gsap.to(shieldRef.current, {
        scale: 1.03,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
      })
    }
  }, [privacyMode])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full flex flex-col gap-5"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-light text-ayo-white">Privacy Mode</h1>
        <p className="text-ayo-muted text-xs mt-1">Control your data and privacy</p>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-5">
        {/* Left - Shield */}
        <motion.div variants={itemVariants} className="col-span-5">
          <Card className="h-full p-8 flex flex-col items-center justify-center" variant={privacyMode ? 'glow' : 'default'} hover={false}>
            {/* Shield */}
            <div className="relative mb-8">
              <AnimatePresence>
                {privacyMode && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 0.2 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="absolute inset-0 rounded-full bg-ayo-purple blur-3xl"
                  />
                )}
              </AnimatePresence>

              <motion.div
                ref={shieldRef}
                animate={{ rotate: privacyMode ? 0 : -5 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className={cn(
                  "relative w-28 h-28 rounded-3xl flex items-center justify-center transition-all duration-500",
                  privacyMode 
                    ? "bg-gradient-to-br from-ayo-purple/30 to-ayo-purple-dark/30 border border-ayo-purple/40 shadow-glow-md" 
                    : "glass-card"
                )}
              >
                <AnimatePresence mode="wait">
                  {privacyMode ? (
                    <motion.div
                      key="shield"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                    >
                      <Shield className="w-14 h-14 text-ayo-purple" strokeWidth={1} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="shield-off"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 180 }}
                    >
                      <ShieldOff className="w-14 h-14 text-ayo-muted" strokeWidth={1} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Lock badge */}
                <motion.div
                  animate={{ scale: privacyMode ? 1 : 0 }}
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-ayo-success flex items-center justify-center shadow-lg"
                >
                  <Lock className="w-4 h-4 text-white" strokeWidth={1.5} />
                </motion.div>
              </motion.div>
            </div>

            {/* Status */}
            <AnimatePresence mode="wait">
              <motion.div
                key={privacyMode ? 'enabled' : 'disabled'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center mb-8"
              >
                <h2 className={cn(
                  "text-xl font-medium mb-1",
                  privacyMode ? "text-ayo-purple text-glow" : "text-ayo-white"
                )}>
                  {privacyMode ? 'Privacy Enabled' : 'Privacy Disabled'}
                </h2>
                <p className="text-xs text-ayo-muted max-w-[200px]">
                  {privacyMode 
                    ? 'All data collection paused' 
                    : 'Standard operation mode'}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Toggle */}
            <Button
              variant={privacyMode ? 'danger' : 'primary'}
              icon={privacyMode ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              onClick={togglePrivacyMode}
            >
              {privacyMode ? 'Disable' : 'Enable'} Privacy
            </Button>

            <p className="text-[9px] text-ayo-muted mt-3 tracking-wider">
              HOTKEY: <code className="text-ayo-purple">Ctrl+Shift+P</code>
            </p>
          </Card>
        </motion.div>

        {/* Right */}
        <div className="col-span-7 flex flex-col gap-4">
          {/* Status Grid */}
          <motion.div variants={itemVariants}>
            <Card className="p-5" hover={false}>
              <h3 className="text-xs text-ayo-muted uppercase tracking-wider mb-4">Data Collection Status</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatusCard
                  icon={<Camera className="w-4 h-4" strokeWidth={1.5} />}
                  label="Camera"
                  status={privacyMode ? 'blocked' : cameraEnabled ? 'on' : 'off'}
                  description={privacyMode ? 'Blocked by privacy' : cameraEnabled ? 'Active' : 'Disabled'}
                />
                <StatusCard
                  icon={<Eye className="w-4 h-4" strokeWidth={1.5} />}
                  label="Screen Capture"
                  status={privacyMode ? 'blocked' : contextCaptureEnabled ? 'on' : 'off'}
                  description={privacyMode ? 'Blocked by privacy' : contextCaptureEnabled ? 'Active' : 'Disabled'}
                />
                <StatusCard
                  icon={<Brain className="w-4 h-4" strokeWidth={1.5} />}
                  label="Emotion Detection"
                  status="off"
                  description="Not available"
                />
                <StatusCard
                  icon={<MessageSquare className="w-4 h-4" strokeWidth={1.5} />}
                  label="Text Chat"
                  status="on"
                  description="Always available"
                />
              </div>
            </Card>
          </motion.div>

          {/* Info */}
          <motion.div variants={itemVariants} className="flex-1">
            <Card className="h-full p-5" hover={false}>
              <h3 className="text-xs text-ayo-muted uppercase tracking-wider mb-4">What Privacy Mode Does</h3>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-ayo-success/5 border border-ayo-success/20">
                  <Check className="w-4 h-4 text-ayo-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-ayo-white">Stops all data capture</p>
                    <p className="text-[10px] text-ayo-muted mt-0.5">Camera and screen paused immediately</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-ayo-success/5 border border-ayo-success/20">
                  <Check className="w-4 h-4 text-ayo-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-ayo-white">Text chat remains available</p>
                    <p className="text-[10px] text-ayo-muted mt-0.5">AI interaction through text only</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-ayo-warning/5 border border-ayo-warning/20">
                  <AlertTriangle className="w-4 h-4 text-ayo-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-ayo-white">Limited context</p>
                    <p className="text-[10px] text-ayo-muted mt-0.5">AI may be less contextually aware</p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
