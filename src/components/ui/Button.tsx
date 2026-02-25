import { ReactNode, ButtonHTMLAttributes } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  loading?: boolean
}

export default function Button({ 
  children, 
  className, 
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = "relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none"
  
  const variants = {
    primary: "bg-ayo-purple/90 text-white hover:bg-ayo-purple shadow-glow-sm hover:shadow-glow-md",
    secondary: "bg-ayo-bg-card text-ayo-silver border border-ayo-border hover:border-ayo-purple/40 hover:text-white",
    ghost: "text-ayo-muted hover:text-ayo-silver hover:bg-ayo-border/30",
    danger: "bg-ayo-error/10 text-ayo-error border border-ayo-error/30 hover:bg-ayo-error/20",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-sm gap-2",
  }

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        (disabled || loading) && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  )
}
