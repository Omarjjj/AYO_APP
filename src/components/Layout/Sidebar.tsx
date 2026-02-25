import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  Shield, 
  Activity
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useStore } from '../../store/useStore'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/settings', icon: Settings, label: 'Settings' },
  { path: '/privacy', icon: Shield, label: 'Privacy' },
  { path: '/logs', icon: Activity, label: 'Logs' },
]

export default function Sidebar() {
  const { privacyMode } = useStore()

  return (
    <motion.aside
      initial={{ x: -80, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="w-16 h-screen bg-ayo-bg-dark/80 flex flex-col items-center py-6 border-r border-ayo-border/30"
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="mb-10"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ayo-purple to-ayo-purple-dim flex items-center justify-center shadow-glow-sm">
          <span className="text-white font-bold text-lg">A</span>
        </div>
      </motion.div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
          >
            {({ isActive }) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index + 0.3 }}
                className={cn(
                  "relative group w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
                  isActive 
                    ? "bg-ayo-purple/20 text-ayo-purple" 
                    : "text-ayo-muted hover:text-ayo-silver hover:bg-ayo-border/30"
                )}
              >
                <item.icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
                
                {/* Active indicator line */}
                {isActive && (
                  <motion.div
                    layoutId="sidebarIndicator"
                    className="absolute left-0 w-0.5 h-5 bg-ayo-purple rounded-r-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                
                {/* Tooltip */}
                <div className="absolute left-full ml-3 px-2 py-1 bg-ayo-bg-card border border-ayo-border/50 rounded-lg text-xs text-ayo-silver opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Privacy indicator */}
      {privacyMode && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-10 h-10 rounded-xl bg-ayo-purple/10 border border-ayo-purple/30 flex items-center justify-center"
        >
          <Shield className="w-4 h-4 text-ayo-purple" strokeWidth={1.5} />
        </motion.div>
      )}
    </motion.aside>
  )
}
