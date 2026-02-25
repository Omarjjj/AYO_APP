import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import { useNavigate } from 'react-router-dom'
import { 
  Shield, 
  ShieldOff,
  Camera,
  CameraOff,
  Scan,
  ScanLine,
  Sparkles,
  ArrowRight,
  Wifi,
  Clock
} from 'lucide-react'
import Card from '../components/ui/Card'
import Toggle from '../components/ui/Toggle'
import Button from '../components/ui/Button'
import { useStore } from '../store/useStore'
import { cn, formatRelativeTime } from '../lib/utils'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const orbRef = useRef<HTMLDivElement>(null)
  const {
    assistantStatus,
    connectionStatus,
    privacyMode,
    cameraEnabled,
    contextCaptureEnabled,
    togglePrivacyMode,
    toggleCamera,
    toggleContextCapture,
    serverLatency,
    lastInteractionTime
  } = useStore()

  // GSAP floating animation for orb
  useEffect(() => {
    if (orbRef.current) {
      gsap.to(orbRef.current, {
        y: -8,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut'
      })
    }
  }, [])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full flex flex-col relative"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="text-center pt-8 pb-16">
        <h1 className="text-4xl font-light text-ayo-white tracking-tight">
          Welcome back<span className="text-ayo-purple">!</span>
        </h1>
        <p className="text-ayo-muted mt-2 text-sm">Your AI assistant is ready to help</p>
      </motion.div>

      {/* Center Orb Section */}
      <motion.div 
        variants={itemVariants}
        className="flex-1 flex flex-col items-center justify-center -mt-8"
      >
        {/* Floating Orb */}
        <div ref={orbRef} className="relative mb-8">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-ayo-purple/20 blur-3xl scale-150" />
          
          {/* Main orb */}
          <motion.div
            animate={{ 
              boxShadow: assistantStatus !== 'idle' 
                ? ['0 0 40px rgba(157,140,255,0.3)', '0 0 60px rgba(157,140,255,0.5)', '0 0 40px rgba(157,140,255,0.3)']
                : '0 0 30px rgba(157,140,255,0.2)'
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative w-24 h-24 rounded-full bg-gradient-to-br from-ayo-purple/30 to-ayo-purple-dark/30 border border-ayo-purple/30 flex items-center justify-center"
          >
            <Sparkles className="w-10 h-10 text-ayo-purple" strokeWidth={1.5} />
            
            {/* Processing rings */}
            {assistantStatus === 'processing' && (
              <>
                <motion.div
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border border-ayo-purple/50"
                />
                <motion.div
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                  className="absolute inset-0 rounded-full border border-ayo-purple/50"
                />
              </>
            )}
          </motion.div>
        </div>

        {/* Status Text */}
        <motion.div 
          key={assistantStatus}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <p className="text-ayo-silver text-sm uppercase tracking-widest">{assistantStatus}</p>
        </motion.div>

        {/* Quick Action */}
        <Button 
          variant="secondary" 
          icon={<ArrowRight className="w-4 h-4" />}
          onClick={() => navigate('/chat')}
        >
          Start Conversation
        </Button>

        {/* Status Bar */}
        <motion.div 
          variants={itemVariants}
          className="flex items-center gap-6 mt-8 text-xs text-ayo-muted"
        >
          <div className="flex items-center gap-2">
            <Wifi className="w-3.5 h-3.5" />
            <span>{serverLatency}ms</span>
          </div>
          <div className="w-px h-3 bg-ayo-border" />
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>{lastInteractionTime ? formatRelativeTime(lastInteractionTime) : 'No activity'}</span>
          </div>
          <div className="w-px h-3 bg-ayo-border" />
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-1.5 h-1.5 rounded-full",
              connectionStatus === 'online' ? "bg-ayo-success" : "bg-ayo-error"
            )} />
            <span className="capitalize">{connectionStatus}</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Bottom Control Cards */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-3 gap-4 pb-6"
      >
        {/* Privacy Mode */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={togglePrivacyMode}
          className={cn(
            "p-5 rounded-2xl border cursor-pointer transition-all duration-300",
            privacyMode 
              ? "bg-ayo-purple/10 border-ayo-purple/40" 
              : "glass-card"
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={cn(
              "icon-box",
              privacyMode ? "bg-ayo-purple/20 border-ayo-purple/30" : ""
            )}>
              {privacyMode ? (
                <Shield className="w-4 h-4 text-ayo-purple" strokeWidth={1.5} />
              ) : (
                <ShieldOff className="w-4 h-4 text-ayo-muted" strokeWidth={1.5} />
              )}
            </div>
            <Toggle enabled={privacyMode} onChange={togglePrivacyMode} size="sm" />
          </div>
          <p className="text-xs text-ayo-purple uppercase tracking-wider mb-1">✦ privacy</p>
          <p className="text-sm font-medium text-ayo-white">Privacy Mode</p>
          <p className="text-xs text-ayo-muted mt-1">
            {privacyMode ? 'on' : 'off'}
          </p>
        </motion.div>

        {/* Camera */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={toggleCamera}
          className={cn(
            "p-5 rounded-2xl border cursor-pointer transition-all duration-300",
            cameraEnabled && !privacyMode
              ? "bg-ayo-purple/10 border-ayo-purple/40" 
              : "glass-card"
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={cn(
              "icon-box",
              cameraEnabled && !privacyMode ? "bg-ayo-purple/20 border-ayo-purple/30" : ""
            )}>
              {cameraEnabled && !privacyMode ? (
                <Camera className="w-4 h-4 text-ayo-purple" strokeWidth={1.5} />
              ) : (
                <CameraOff className="w-4 h-4 text-ayo-muted" strokeWidth={1.5} />
              )}
            </div>
            <Toggle 
              enabled={cameraEnabled && !privacyMode} 
              onChange={toggleCamera} 
              size="sm"
              disabled={privacyMode}
            />
          </div>
          <p className="text-xs text-ayo-purple uppercase tracking-wider mb-1">✦ camera</p>
          <p className="text-sm font-medium text-ayo-white">Camera</p>
          <p className="text-xs text-ayo-muted mt-1">
            {privacyMode ? 'blocked' : cameraEnabled ? 'on' : 'off'}
          </p>
        </motion.div>

        {/* Context Capture */}
        <motion.div
          whileHover={{ y: -2 }}
          onClick={toggleContextCapture}
          className={cn(
            "p-5 rounded-2xl border cursor-pointer transition-all duration-300",
            contextCaptureEnabled && !privacyMode
              ? "bg-ayo-purple/10 border-ayo-purple/40" 
              : "glass-card"
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={cn(
              "icon-box",
              contextCaptureEnabled && !privacyMode ? "bg-ayo-purple/20 border-ayo-purple/30" : ""
            )}>
              {contextCaptureEnabled && !privacyMode ? (
                <Scan className="w-4 h-4 text-ayo-purple" strokeWidth={1.5} />
              ) : (
                <ScanLine className="w-4 h-4 text-ayo-muted" strokeWidth={1.5} />
              )}
            </div>
            <Toggle 
              enabled={contextCaptureEnabled && !privacyMode} 
              onChange={toggleContextCapture} 
              size="sm"
              disabled={privacyMode}
            />
          </div>
          <p className="text-xs text-ayo-purple uppercase tracking-wider mb-1">✦ context capture</p>
          <p className="text-sm font-medium text-ayo-white">Context Capture</p>
          <p className="text-xs text-ayo-muted mt-1">
            {privacyMode ? 'blocked' : contextCaptureEnabled ? 'on' : 'off'}
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
