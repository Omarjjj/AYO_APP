import { createWorker } from 'tesseract.js'

let worker: Tesseract.Worker | null = null
let workerReady = false

/**
 * Initializes the Tesseract OCR worker.
 * This should be called once to download language data and prepare the engine.
 */
export async function initOcr() {
  if (workerReady) return
  
  try {
    worker = await createWorker('eng')
    workerReady = true
    console.log('[Context] OCR Worker initialized successfully.')
  } catch (error) {
    console.error('[Context] Failed to initialize OCR Worker:', error)
  }
}

/**
 * Extracts text from an image buffer using Tesseract OCR.
 */
export async function getTextFromImage(imageBuffer: Buffer): Promise<string> {
  if (!workerReady || !worker) {
    console.warn('[Context] OCR Worker not ready. Call initOcr() first.')
    return ''
  }

  try {
    const { data: { text } } = await worker.recognize(imageBuffer)
    return text.trim()
  } catch (error) {
    console.error('[Context] Error during OCR text extraction:', error)
    return ''
  }
}

/**
 * Terminates the Tesseract OCR worker to free resources.
 */
export async function terminateOcr() {
  if (worker) {
    await worker.terminate()
    worker = null
    workerReady = false
    console.log('[Context] OCR Worker terminated.')
  }
}
