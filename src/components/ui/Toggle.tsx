import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface ToggleProps {
  enabled: boolean
  onChange: () => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function Toggle({ 
  enabled, 
  onChange, 
  disabled = false,
  size = 'md'
}: ToggleProps) {
  const sizes = {
    sm: { track: 'w-9 h-5', thumb: 'w-3.5 h-3.5', translate: 16 },
    md: { track: 'w-11 h-6', thumb: 'w-4 h-4', translate: 20 },
    lg: { track: 'w-14 h-7', thumb: 'w-5 h-5', translate: 28 },
  }

  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={cn(
        "relative rounded-full transition-all duration-300 focus:outline-none",
        sizes[size].track,
        enabled 
          ? "bg-ayo-purple/80 shadow-glow-sm" 
          : "bg-ayo-border/60",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <motion.div
        initial={false}
        animate={{
          x: enabled ? sizes[size].translate : 4,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 rounded-full shadow-md transition-colors",
          sizes[size].thumb,
          enabled ? "bg-white" : "bg-ayo-silver/80"
        )}
      />
    </button>
  )
}
