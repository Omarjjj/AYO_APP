import { app, BrowserWindow, ipcMain, screen } from 'electron'
import path from 'path'
import { spawn, ChildProcess } from 'child_process'
import WebSocket from 'ws'

const isDev = process.env.NODE_ENV !== 'production'

const WAKE_WORD_WS_URL = 'ws://127.0.0.1:8765'
const GLOW_DURATION_MS = 4000

let mainWindow: BrowserWindow | null = null
let overlayWindow: BrowserWindow | null = null
let pythonProcess: ChildProcess | null = null
let wakeWordSocket: WebSocket | null = null
let wakeWordEnabled = false
let wsReconnectTimer: ReturnType<typeof setTimeout> | null = null

// ── Window ──────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ── Screen Glow Overlay ──────────────────────────────────────────────

function createOverlayWindow() {
  if (overlayWindow) return

  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.bounds

  overlayWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width,
    height,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    hasShadow: false,
    resizable: false,
    movable: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  overlayWindow.setAlwaysOnTop(true, 'screen-saver')
  overlayWindow.setIgnoreMouseEvents(true)
  overlayWindow.setVisibleOnAllWorkspaces(true)

  const overlayPath = isDev
    ? path.join(__dirname, '..', 'electron', 'overlay.html')
    : path.join(__dirname, 'overlay.html')
  overlayWindow.loadFile(overlayPath)

  overlayWindow.on('closed', () => {
    overlayWindow = null
  })
}

function showScreenGlow(duration: number = GLOW_DURATION_MS) {
  if (!overlayWindow) createOverlayWindow()
  if (!overlayWindow) return

  overlayWindow.show()
  overlayWindow.webContents.send('show-glow', { duration })

  setTimeout(() => {
    overlayWindow?.hide()
  }, duration + 1500)
}

// ── Python Wake Word Process ────────────────────────────────────────

function getWakeWordPaths() {
  const projectRoot = isDev
    ? path.join(__dirname, '..')
    : path.join(process.resourcesPath!)

  const scriptPath = path.join(projectRoot, 'wake-word', 'ayo_listener.py')
  const modelPath = path.join(projectRoot, 'wake-word', 'model')
  return { scriptPath, modelPath }
}

let pythonRestartCount = 0
const MAX_PYTHON_RESTARTS = 3
let pythonRestartTimer: ReturnType<typeof setTimeout> | null = null

function startPythonProcess() {
  if (pythonProcess) return

  const { scriptPath, modelPath } = getWakeWordPaths()
  console.log('[main] Starting wake word Python process...')
  console.log('[main] Script:', scriptPath)
  console.log('[main] Model:', modelPath)

  pythonProcess = spawn('python', [scriptPath, modelPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
  })

  pythonProcess.stdout?.on('data', (data: Buffer) => {
    const msg = data.toString().trim()
    if (msg) console.log(`[python] ${msg}`)
    // Reset restart count on successful output (means it's running)
    if (msg.includes('Starting mic capture')) {
      pythonRestartCount = 0
    }
  })

  pythonProcess.stderr?.on('data', (data: Buffer) => {
    const msg = data.toString().trim()
    if (msg) console.error(`[python:err] ${msg}`)
  })

  pythonProcess.on('close', (code: number | null) => {
    console.log(`[main] Python process exited with code ${code}`)
    pythonProcess = null
    disconnectWakeWordSocket()

    if (wakeWordEnabled && code !== 0) {
      pythonRestartCount++
      if (pythonRestartCount <= MAX_PYTHON_RESTARTS) {
        const delay = pythonRestartCount * 5000
        console.log(`[main] Restart attempt ${pythonRestartCount}/${MAX_PYTHON_RESTARTS} in ${delay / 1000}s...`)
        pythonRestartTimer = setTimeout(() => {
          if (wakeWordEnabled) {
            startPythonProcess()
            setTimeout(connectWakeWordSocket, 3000)
          }
        }, delay)
      } else {
        console.error('[main] Wake word Python process failed too many times. Giving up.')
        mainWindow?.webContents.send('wake-word-status', { status: 'error' })
      }
    }
  })
}

function stopPythonProcess() {
  if (pythonRestartTimer) {
    clearTimeout(pythonRestartTimer)
    pythonRestartTimer = null
  }
  pythonRestartCount = 0
  if (!pythonProcess) return
  const pid = pythonProcess.pid
  console.log(`[main] Stopping wake word Python process (PID ${pid})...`)
  try {
    if (process.platform === 'win32' && pid) {
      // SIGTERM doesn't work on Windows; use taskkill for reliable cleanup
      spawn('taskkill', ['/F', '/T', '/PID', pid.toString()], { stdio: 'ignore' })
    } else {
      pythonProcess.kill('SIGTERM')
    }
  } catch { /* already dead */ }
  pythonProcess = null
}

// ── WebSocket Connection to Python ──────────────────────────────────

function connectWakeWordSocket() {
  if (wakeWordSocket?.readyState === WebSocket.OPEN) return

  console.log(`[main] Connecting to wake word WebSocket at ${WAKE_WORD_WS_URL}...`)

  wakeWordSocket = new WebSocket(WAKE_WORD_WS_URL)

  wakeWordSocket.on('open', () => {
    console.log('[main] Connected to wake word WebSocket')
    mainWindow?.webContents.send('wake-word-status', { status: 'listening' })
  })

  wakeWordSocket.on('message', (raw: Buffer) => {
    try {
      const data = JSON.parse(raw.toString())

      if (data.type === 'wake-word-detected') {
        console.log('[main] ★ AYO detected! Notifying renderer...')
        mainWindow?.webContents.send('wake-word-detected', {
          transcript: data.transcript,
          timestamp: Date.now(),
        })
        showScreenGlow()
      } else if (data.type === 'status') {
        mainWindow?.webContents.send('wake-word-status', { status: data.status })
      } else if (data.type === 'mic-test-audio') {
        mainWindow?.webContents.send('mic-test-audio', {
          audio: data.audio,
          sampleRate: data.sampleRate,
        })
      }
    } catch (err) {
      console.error('[main] Failed to parse WS message:', err)
    }
  })

  wakeWordSocket.on('close', () => {
    console.log('[main] Wake word WebSocket closed')
    wakeWordSocket = null
    mainWindow?.webContents.send('wake-word-status', { status: 'disconnected' })

    if (wakeWordEnabled) {
      wsReconnectTimer = setTimeout(connectWakeWordSocket, 2000)
    }
  })

  wakeWordSocket.on('error', (err: Error) => {
    console.error('[main] Wake word WebSocket error:', err.message)
    wakeWordSocket?.close()
  })
}

function disconnectWakeWordSocket() {
  if (wsReconnectTimer) {
    clearTimeout(wsReconnectTimer)
    wsReconnectTimer = null
  }
  if (wakeWordSocket) {
    wakeWordSocket.close()
    wakeWordSocket = null
  }
}

function startWakeWord() {
  if (wakeWordEnabled) return
  wakeWordEnabled = true
  startPythonProcess()
  setTimeout(connectWakeWordSocket, 2000)
}

function stopWakeWord() {
  wakeWordEnabled = false
  disconnectWakeWordSocket()
  stopPythonProcess()
  mainWindow?.webContents.send('wake-word-status', { status: 'stopped' })
}

// ── App Lifecycle ───────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow()
  createOverlayWindow()
  startWakeWord()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopWakeWord()
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.on('before-quit', () => {
  stopWakeWord()
  if (overlayWindow) {
    overlayWindow.close()
    overlayWindow = null
  }
})

// ── IPC: Window Controls ────────────────────────────────────────────

ipcMain.on('minimize-window', () => {
  mainWindow?.minimize()
})

ipcMain.on('maximize-window', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.on('close-window', () => {
  mainWindow?.close()
})

// ── IPC: Wake Word Controls ─────────────────────────────────────────

ipcMain.handle('wake-word-start', () => {
  startWakeWord()
  return { success: true }
})

ipcMain.handle('wake-word-stop', () => {
  stopWakeWord()
  return { success: true }
})

ipcMain.handle('wake-word-status', () => {
  return {
    enabled: wakeWordEnabled,
    pythonRunning: pythonProcess !== null,
    wsConnected: wakeWordSocket?.readyState === WebSocket.OPEN,
  }
})

// ── IPC: Audio Device Management ────────────────────────────────────

function sendToPython(command: Record<string, unknown>): boolean {
  if (wakeWordSocket?.readyState === WebSocket.OPEN) {
    wakeWordSocket.send(JSON.stringify(command))
    return true
  }
  return false
}

ipcMain.handle('audio-list-devices', () => {
  return new Promise((resolve) => {
    if (!sendToPython({ command: 'list-devices' })) {
      resolve({ input: [], output: [], currentDevice: null })
      return
    }

    const timeout = setTimeout(() => resolve({ input: [], output: [], currentDevice: null }), 5000)

    const onMessage = (raw: Buffer) => {
      try {
        const data = JSON.parse(raw.toString())
        if (data.type === 'audio-devices') {
          clearTimeout(timeout)
          wakeWordSocket?.off('message', onMessage)
          resolve(data.devices ? { ...data.devices, currentDevice: data.currentDevice } : data)
        }
      } catch { /* ignore parse errors */ }
    }
    wakeWordSocket?.on('message', onMessage)
  })
})

ipcMain.handle('audio-set-input-device', (_event, deviceIndex: number | null) => {
  return new Promise((resolve) => {
    if (!sendToPython({ command: 'set-device', deviceIndex })) {
      resolve({ success: false })
      return
    }

    const timeout = setTimeout(() => resolve({ success: false }), 5000)

    const onMessage = (raw: Buffer) => {
      try {
        const data = JSON.parse(raw.toString())
        if (data.type === 'device-changed') {
          clearTimeout(timeout)
          wakeWordSocket?.off('message', onMessage)
          resolve({ success: data.success, deviceIndex: data.deviceIndex })
        }
      } catch { /* ignore parse errors */ }
    }
    wakeWordSocket?.on('message', onMessage)
  })
})

ipcMain.handle('audio-start-mic-test', () => {
  return sendToPython({ command: 'start-mic-test' })
})

ipcMain.handle('audio-stop-mic-test', () => {
  sendToPython({ command: 'stop-mic-test' })
  return true
})
