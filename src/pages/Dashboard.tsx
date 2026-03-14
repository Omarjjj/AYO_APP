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
    lastInteractionTime,
    wakeWordStatus,
  } = useStore()

  const isAyoDetected = wakeWordStatus === 'detected'

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
          {/* Outer glow ring — intensifies on AYO detection */}
          <motion.div
            animate={{
              scale: isAyoDetected ? 2 : 1.5,
              opacity: isAyoDetected ? 1 : 0.6,
            }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 rounded-full bg-ayo-purple/20 blur-3xl"
          />
          
          {/* Main orb */}
          <motion.div
            animate={{ 
              boxShadow: isAyoDetected
                ? ['0 0 60px rgba(157,140,255,0.8), 0 0 100px rgba(157,140,255,0.9)', '0 0 90px rgba(157,140,255,1), 0 0 150px rgba(157,140,255,1)', '0 0 60px rgba(157,140,255,0.8), 0 0 100px rgba(157,140,255,0.9)']
                : assistantStatus !== 'idle' 
                  ? ['0 0 40px rgba(157,140,255,0.3)', '0 0 60px rgba(157,140,255,0.5)', '0 0 40px rgba(157,140,255,0.3)']
                  : '0 0 30px rgba(157,140,255,0.2)',
              scale: isAyoDetected ? 1.15 : 1,
            }}
            transition={{ 
              duration: isAyoDetected ? 0.6 : 2, 
              repeat: (isAyoDetected || assistantStatus !== 'idle') ? Infinity : 0,
              ease: "easeInOut"
            }}
            className={cn(
              "relative w-24 h-24 rounded-full border flex items-center justify-center transition-colors duration-300 overflow-hidden",
              isAyoDetected
                ? "bg-gradient-to-br from-ayo-purple/60 to-ayo-purple-dark/60 border-ayo-purple shadow-[inset_0_0_20px_rgba(157,140,255,0.5)]"
                : "bg-gradient-to-br from-ayo-purple/30 to-ayo-purple-dark/30 border-ayo-purple/30"
            )}
          >
            <video
              className="w-full h-full rounded-full object-cover mix-blend-screen"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
            >
              <source src="/ayo_animatelogo.mp4" type="video/mp4" />
            </video>
            
            {/* Detection pulse rings */}
            {isAyoDetected && (
              <>
                <motion.div
                  initial={{ scale: 1, opacity: 0.9 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border-[3px] border-ayo-purple shadow-[0_0_20px_rgba(157,140,255,0.8),inset_0_0_20px_rgba(157,140,255,0.8)]"
                />
                <motion.div
                  initial={{ scale: 1, opacity: 0.9 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.4, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border-[2px] border-ayo-purple shadow-[0_0_30px_rgba(157,140,255,0.9)]"
                />
                <motion.div
                  initial={{ scale: 1, opacity: 0.9 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.8, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full border-[2px] border-ayo-purple shadow-[0_0_15px_rgba(157,140,255,0.6)]"
                />
              </>
            )}

            {/* Processing rings */}
            {assistantStatus === 'processing' && !isAyoDetected && (
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
          key={isAyoDetected ? 'detected' : assistantStatus}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          {isAyoDetected ? (
            <>
              <p className="text-ayo-purple text-sm font-medium uppercase tracking-widest">AYO detected!</p>
              <p className="text-ayo-muted text-xs mt-1">Listening for your request...</p>
            </>
          ) : (
            <p className="text-ayo-silver text-sm uppercase tracking-widest">
              {wakeWordStatus === 'listening' ? 'listening for "AYO"' : assistantStatus}
            </p>
          )}
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
          className={cn(
            "p-5 rounded-2xl border transition-all duration-300",
            privacyMode 
              ? "bg-ayo-purple/10 border-ayo-purple/40" 
              : "glass-card"
          )}
        >
          <div className="flex items-center justify-between mb-4 h-10">
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
          className={cn(
            "p-5 rounded-2xl border transition-all duration-300",
            cameraEnabled && !privacyMode
              ? "bg-ayo-purple/10 border-ayo-purple/40" 
              : "glass-card"
          )}
        >
          <div className="flex items-center justify-between mb-4 h-10">
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
          className={cn(
            "p-5 rounded-2xl border transition-all duration-300",
            contextCaptureEnabled && !privacyMode
              ? "bg-ayo-purple/10 border-ayo-purple/40" 
              : "glass-card"
          )}
        >
          <div className="flex items-center justify-between mb-4 h-10">
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
