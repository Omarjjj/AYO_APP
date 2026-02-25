import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Info,
  Bot,
  Settings,
  Search,
  Cpu,
  HardDrive,
  Wifi,
  ChevronDown
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useStore, LogEntry } from '../store/useStore'
import { cn, formatTime } from '../lib/utils'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 }
}

type FilterType = 'all' | 'info' | 'warning' | 'error' | 'ai' | 'system'

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warn' },
  { value: 'error', label: 'Error' },
  { value: 'ai', label: 'AI' },
  { value: 'system', label: 'Sys' },
]

function LogItem({ log }: { log: LogEntry }) {
  const [expanded, setExpanded] = useState(false)
  
  const typeConfig = {
    info: { color: 'text-ayo-info', icon: <Info className="w-3.5 h-3.5" strokeWidth={1.5} /> },
    warning: { color: 'text-ayo-warning', icon: <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} /> },
    error: { color: 'text-ayo-error', icon: <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.5} /> },
    ai: { color: 'text-ayo-purple', icon: <Bot className="w-3.5 h-3.5" strokeWidth={1.5} /> },
    system: { color: 'text-ayo-muted', icon: <Settings className="w-3.5 h-3.5" strokeWidth={1.5} /> }
  }
  const config = typeConfig[log.type]

  return (
    <motion.div
      variants={itemVariants}
      layout
      className="p-3 rounded-xl glass-card cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <span className={config.color}>{config.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-ayo-silver truncate">{log.message}</p>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[9px] text-ayo-muted">{formatTime(log.timestamp)}</span>
              {log.details && (
                <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
                  <ChevronDown className="w-3 h-3 text-ayo-muted" />
                </motion.div>
              )}
            </div>
          </div>
          <span className={cn("text-[9px] uppercase tracking-wider", config.color)}>{log.type}</span>
          
          <AnimatePresence>
            {expanded && log.details && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <pre className="mt-2 p-2 bg-ayo-bg-dark rounded-lg text-[10px] text-ayo-muted font-mono">
                  {log.details}
                </pre>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

export default function Logs() {
  const { logs, clearLogs, cpuUsage, memoryUsage, serverLatency, connectionStatus } = useStore()
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLogs = useMemo(() => {
    return logs
      .filter(log => filter === 'all' || log.type === filter)
      .filter(log => log.message.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [logs, filter, searchQuery])

  const logCounts = useMemo(() => ({
    all: logs.length,
    info: logs.filter(l => l.type === 'info').length,
    warning: logs.filter(l => l.type === 'warning').length,
    error: logs.filter(l => l.type === 'error').length,
    ai: logs.filter(l => l.type === 'ai').length,
    system: logs.filter(l => l.type === 'system').length,
  }), [logs])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="h-full flex flex-col gap-5"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-ayo-white">Activity Logs</h1>
          <p className="text-ayo-muted text-xs mt-1">Monitor system events</p>
        </div>
        <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={clearLogs}>
          Clear
        </Button>
      </motion.div>

      {/* Main */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Logs */}
        <div className="col-span-8 flex flex-col gap-3 min-h-0">
          {/* Search & Filters */}
          <motion.div variants={itemVariants}>
            <Card className="p-3" hover={false}>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ayo-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search logs..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg text-xs text-ayo-silver placeholder-ayo-muted"
                  />
                </div>
                <div className="flex items-center gap-0.5 p-1 bg-ayo-bg-dark rounded-lg">
                  {filterOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFilter(option.value)}
                      className={cn(
                        "px-2 py-1 rounded-md text-[10px] transition-all",
                        filter === option.value
                          ? "bg-ayo-purple/20 text-ayo-purple"
                          : "text-ayo-muted hover:text-ayo-silver"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Log List */}
          <motion.div variants={itemVariants} className="flex-1 min-h-0">
            <Card className="h-full p-3 overflow-hidden" hover={false}>
              <div className="h-full overflow-y-auto space-y-2 pr-1">
                <AnimatePresence>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map(log => <LogItem key={log.id} log={log} />)
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-full py-8"
                    >
                      <Activity className="w-10 h-10 text-ayo-muted mb-3" strokeWidth={1} />
                      <p className="text-xs text-ayo-muted">No logs found</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Stats */}
        <div className="col-span-4 flex flex-col gap-3">
          {/* System Health */}
          <motion.div variants={itemVariants}>
            <Card className="p-4" hover={false}>
              <h3 className="text-[10px] text-ayo-muted uppercase tracking-wider mb-4">System Health</h3>
              
              <div className="space-y-4">
                {/* CPU */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 text-ayo-muted">
                      <Cpu className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span className="text-[10px]">CPU</span>
                    </div>
                    <span className="text-xs text-ayo-white">{cpuUsage}%</span>
                  </div>
                  <div className="h-1.5 bg-ayo-bg-dark rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cpuUsage}%` }}
                      className={cn(
                        "h-full rounded-full",
                        cpuUsage > 80 ? "bg-ayo-error" : cpuUsage > 50 ? "bg-ayo-warning" : "bg-ayo-purple"
                      )}
                    />
                  </div>
                </div>

                {/* Memory */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 text-ayo-muted">
                      <HardDrive className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span className="text-[10px]">Memory</span>
                    </div>
                    <span className="text-xs text-ayo-white">{memoryUsage}%</span>
                  </div>
                  <div className="h-1.5 bg-ayo-bg-dark rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${memoryUsage}%` }}
                      className="h-full rounded-full bg-ayo-info"
                    />
                  </div>
                </div>

                {/* Latency */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 text-ayo-muted">
                      <Wifi className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span className="text-[10px]">Latency</span>
                    </div>
                    <span className="text-xs text-ayo-white">{serverLatency}ms</span>
                  </div>
                  <div className="h-1.5 bg-ayo-bg-dark rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(serverLatency / 2, 100)}%` }}
                      className="h-full rounded-full bg-ayo-success"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Quick Stats */}
          <motion.div variants={itemVariants}>
            <Card className="p-4" hover={false}>
              <h3 className="text-[10px] text-ayo-muted uppercase tracking-wider mb-3">Quick Stats</h3>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-ayo-bg-dark border border-ayo-border/30">
                  <p className="text-lg font-medium text-ayo-white">{logs.length}</p>
                  <p className="text-[9px] text-ayo-muted">Total</p>
                </div>
                <div className="p-2.5 rounded-xl bg-ayo-error/10 border border-ayo-error/20">
                  <p className="text-lg font-medium text-ayo-error">{logCounts.error}</p>
                  <p className="text-[9px] text-ayo-muted">Errors</p>
                </div>
                <div className="p-2.5 rounded-xl bg-ayo-purple/10 border border-ayo-purple/20">
                  <p className="text-lg font-medium text-ayo-purple">{logCounts.ai}</p>
                  <p className="text-[9px] text-ayo-muted">AI Events</p>
                </div>
                <div className="p-2.5 rounded-xl bg-ayo-success/10 border border-ayo-success/20">
                  <div className="flex items-center gap-1">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      connectionStatus === 'online' ? "bg-ayo-success" : "bg-ayo-error"
                    )} />
                    <span className="text-xs text-ayo-success capitalize">{connectionStatus}</span>
                  </div>
                  <p className="text-[9px] text-ayo-muted mt-0.5">Server</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
