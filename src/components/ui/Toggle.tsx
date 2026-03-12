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
  const sizes: Record<NonNullable<ToggleProps['size']>, { w: number; h: number; thumb: number }> = {
    sm: { w: 36, h: 20, thumb: 14 },
    md: { w: 44, h: 24, thumb: 16 },
    lg: { w: 56, h: 28, thumb: 20 },
  }
  const s = sizes[size]
  const inset = (s.h - s.thumb) / 2
  const travel = s.w - s.thumb - inset * 2

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onChange()
      }}
      disabled={disabled}
      className={cn(
        "relative inline-flex p-0 border-0 rounded-full transition-all duration-300 focus:outline-none appearance-none",
        enabled 
          ? "bg-ayo-purple/80 shadow-glow-sm" 
          : "bg-ayo-border/60",
        disabled && "opacity-40 cursor-not-allowed"
      )}
      style={{ width: s.w, height: s.h }}
    >
      <motion.div
        initial={false}
        animate={{
          x: enabled ? travel : 0,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          "absolute rounded-full shadow-md transition-colors",
          enabled ? "bg-white" : "bg-ayo-silver/80"
        )}
        style={{
          left: inset,
          top: inset,
          width: s.thumb,
          height: s.thumb,
        }}
      />
    </button>
  )
}
