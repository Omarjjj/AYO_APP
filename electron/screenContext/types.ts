export interface ContextSnapshot {
  timestamp: number
  app: string
  title: string
  ocrText?: string
}

export interface ContextLogEntry {
  timestamp: number
  app: string
  title: string
  summary?: string
  interestScore: number
  sentToAI: boolean
  sessionTimeMs?: number // Time spent in this app/title during this continuous session
  totalAppTimeMs?: number // Total accumulated time spent in this app overall
  appSessionCount?: number // Number of times the user switched into this application
}
