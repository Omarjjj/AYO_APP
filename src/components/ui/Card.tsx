import { ReactNode } from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '../../lib/utils'

interface CardProps extends HTMLMotionProps<'div'> {
  children: ReactNode
  className?: string
  variant?: 'default' | 'glow' | 'subtle'
  hover?: boolean
}

export default function Card({ 
  children, 
  className, 
  variant = 'default',
  hover = true,
  ...props 
}: CardProps) {
  const baseStyles = "rounded-2xl transition-all duration-300"
  
  const variants = {
    default: "glass-card",
    glow: "glass-card border-ayo-purple/30 shadow-glow-sm",
    subtle: "bg-ayo-bg-card/50 border border-ayo-border/50"
  }

  const hoverStyles = hover ? "hover-lift" : ""

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(baseStyles, variants[variant], hoverStyles, className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}
