import { motion } from 'framer-motion'
import { Minus, Square, X, Circle } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { cn } from '../../lib/utils'

export default function Header() {
  const { connectionStatus } = useStore()

  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow()
  }

  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow()
  }

  const handleClose = () => {
    window.electronAPI?.closeWindow()
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="h-12 flex items-center justify-between px-4 drag-region border-b border-ayo-border/20"
    >
      {/* Left - Connection status */}
      <div className="flex items-center gap-3 no-drag">
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-1.5 h-1.5 rounded-full",
            connectionStatus === 'online' 
              ? "bg-ayo-success shadow-[0_0_6px_rgba(125,211,168,0.6)]" 
              : "bg-ayo-error shadow-[0_0_6px_rgba(232,123,123,0.6)]"
          )} />
          <span className="text-xs text-ayo-muted uppercase tracking-wider">
            {connectionStatus}
          </span>
        </div>
      </div>

      {/* Center - Brand */}
      <div className="absolute left-1/2 -translate-x-1/2 no-drag">
        <span className="text-sm font-medium text-ayo-silver tracking-wide">ayo</span>
      </div>

      {/* Right - Window controls */}
      <div className="flex items-center gap-0.5 no-drag">
        <motion.button
          whileHover={{ backgroundColor: 'rgba(157, 140, 255, 0.1)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleMinimize}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-ayo-muted hover:text-ayo-silver transition-colors"
        >
          <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
        </motion.button>
        <motion.button
          whileHover={{ backgroundColor: 'rgba(157, 140, 255, 0.1)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleMaximize}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-ayo-muted hover:text-ayo-silver transition-colors"
        >
          <Square className="w-3 h-3" strokeWidth={1.5} />
        </motion.button>
        <motion.button
          whileHover={{ backgroundColor: 'rgba(232, 123, 123, 0.15)' }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-ayo-muted hover:text-ayo-error transition-colors"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
        </motion.button>
      </div>
    </motion.header>
  )
}
