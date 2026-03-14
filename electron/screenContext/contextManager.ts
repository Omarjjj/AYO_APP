import { ContextSnapshot, ContextLogEntry } from './types'
import { getActiveWindow } from './activeWindow'
import { captureScreen } from './capture'
import { initOcr, getTextFromImage, terminateOcr } from './ocr'
import { computeInterestScore } from './interestLevel'

const INTEREST_THRESHOLD = 5
const INTERVAL_MS = 60_000 // 1 minute

let isRunning = false
let intervalId: NodeJS.Timeout | null = null
let previousSnapshot: ContextSnapshot | null = null

// Time tracking
const appTimeStats: Record<string, number> = {}
const appSessionCounts: Record<string, number> = {}
let sessionStartTime: number = Date.now()
let lastTickTime: number = Date.now()
let currentActiveApp: string | null = null

// In-memory rolling log
const contextLogs: ContextLogEntry[] = []
const MAX_LOGS = 100

// Helper to format time spent
function formatTime(ms: number): string {
  if (ms < 1000) return 'Just now'
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

export async function startContextPipeline() {
  if (isRunning) return
  isRunning = true
  
  // Initialize Tesseract worker
  await initOcr()
  
  lastTickTime = Date.now()
  sessionStartTime = Date.now()
  
  console.log(`[Context] Starting periodic screen context pipeline (every ${INTERVAL_MS}ms)`)
  intervalId = setInterval(runContextTick, INTERVAL_MS)
  
  // Run first tick immediately
  runContextTick()
}

export async function stopContextPipeline() {
  if (!isRunning) return
  isRunning = false
  
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
  
  await terminateOcr()
  console.log('[Context] Stopped screen context pipeline.')
}

export async function runContextTick() {
  try {
    const timestamp = Date.now()
    const timeSinceLast = timestamp - lastTickTime
    lastTickTime = timestamp
    
    // 1. Get active window
    const activeWin = await getActiveWindow()
    if (!activeWin) {
      console.log('[Context] No active window detected.')
      return
    }

    // Handle session switching
    if (activeWin.app !== currentActiveApp) {
      if (!appSessionCounts[activeWin.app]) {
        appSessionCounts[activeWin.app] = 0
      }
      appSessionCounts[activeWin.app] += 1
      currentActiveApp = activeWin.app
    }

    // Credit time to the active app
    if (!appTimeStats[activeWin.app]) {
      appTimeStats[activeWin.app] = 0
    }
    appTimeStats[activeWin.app] += timeSinceLast

    let ocrText = ''

    // 2. Decide if we need OCR
    let shouldRunOcr = false
    const ocrReasons: string[] = []
    
    // Check if app or title changed
    const windowChanged = !previousSnapshot || 
                          previousSnapshot.app !== activeWin.app || 
                          previousSnapshot.title !== activeWin.title

    if (windowChanged) {
      ocrReasons.push('App or window title changed')
      sessionStartTime = timestamp // Reset session time for new window/app
    }

    const sessionTimeMs = timestamp - sessionStartTime
    const totalAppTimeMs = appTimeStats[activeWin.app]
    const appSessionCount = appSessionCounts[activeWin.app]


    // If the last score was 3 or 4, keep a close eye on them
    const wasStruggling = previousSnapshot && (previousSnapshot as any).lastScore >= 3
    if (wasStruggling) {
      ocrReasons.push('User had a high interest score recently (>= 3)')
    }

    // Periodically force an OCR check even if they haven't switched windows (every ~3 minutes)
    const forceOcr = (Date.now() % (INTERVAL_MS * 3)) < INTERVAL_MS

    // Check if it's a high-signal app where errors usually happen (IDE, terminal, browser)
    const highSignalApps = ['code', 'cursor', 'terminal', 'powershell', 'chrome', 'msedge']
    const isHighSignalApp = highSignalApps.some(app => activeWin.app.toLowerCase().includes(app))

    if (forceOcr && isHighSignalApp) {
      ocrReasons.push('Periodic 3-minute check in high-signal app')
    }

    if (windowChanged || wasStruggling || (forceOcr && isHighSignalApp)) {
      shouldRunOcr = true
    }

    console.log('\n========================================')
    console.log(`[Context Tick] Time: ${new Date(timestamp).toLocaleTimeString()}`)
    console.log(`[Context Tick] App: ${activeWin.app} (Total Time: ${formatTime(totalAppTimeMs)}, Sessions: ${appSessionCount})`)
    console.log(`[Context Tick] Title: ${activeWin.title} (Session Time: ${formatTime(sessionTimeMs)})`)

    if (shouldRunOcr) {
      console.log(`[Context Tick] -> RUNNING FULL OCR CHECK.`)
      console.log(`[Context Tick] -> Why? ${ocrReasons.join(' | ')}`)
      const buffer = await captureScreen()
      if (buffer) {
        ocrText = await getTextFromImage(buffer)
      }
    } else {
      console.log(`[Context Tick] -> SKIPPING OCR (Reusing previous text).`)
      console.log(`[Context Tick] -> Why? No window change, not struggling, and not due for periodic check.`)
      // Reuse previous text if we don't need to re-scan
      ocrText = previousSnapshot?.ocrText || ''
    }

    // 3. Build current snapshot
    const currentSnapshot: ContextSnapshot & { lastScore?: number } = {
      timestamp,
      app: activeWin.app,
      title: activeWin.title,
      ocrText,
    }

    // 4. Compute interest score
    const { score, reasons } = computeInterestScore(currentSnapshot, previousSnapshot)

    // 5. Check against threshold and stub "Send to AI"
    let sentToAI = false
    
    console.log(`[Context Tick] Total Interest Score: ${score} (Threshold: ${INTEREST_THRESHOLD})`)
    console.log(`[Context Tick] Score Reasoning:`)
    reasons.forEach(r => console.log(`  -> ${r}`))

    if (score >= INTEREST_THRESHOLD) {
      sentToAI = true
      // TODO: Actually send to AI Server
      console.log(`[Context Tick] ★ ACTION: Threshold met. WOULD SEND TO AI! ★`)
      
      // Stub the AI summary
      const dummySummary = `User is using ${activeWin.app} on ${activeWin.title} and encountered significant changes/errors.`
      
      addLogEntry({
        timestamp,
        app: activeWin.app,
        title: activeWin.title,
        summary: dummySummary,
        interestScore: score,
        sentToAI,
        sessionTimeMs,
        totalAppTimeMs,
        appSessionCount
      })
    } else {
      console.log(`[Context Tick] ACTION: Score below threshold. Skipping AI.`)
      // Add a log entry just to keep a record, but not sent to AI
      addLogEntry({
        timestamp,
        app: activeWin.app,
        title: activeWin.title,
        interestScore: score,
        sentToAI,
        sessionTimeMs,
        totalAppTimeMs,
        appSessionCount
      })
    }
    console.log('========================================\n')

    // Update previous snapshot and remember the score for the next tick
    currentSnapshot.lastScore = score
    previousSnapshot = currentSnapshot

  } catch (error) {
    console.error('[Context] Error during context tick:', error)
  }
}

function addLogEntry(entry: ContextLogEntry) {
  contextLogs.push(entry)
  if (contextLogs.length > MAX_LOGS) {
    contextLogs.shift()
  }
}

// Helper to retrieve logs for the UI
export function getContextStatus() {
  return {
    isRunning,
    lastSnapshot: previousSnapshot,
    logs: [...contextLogs].reverse() // latest first
  }
}
