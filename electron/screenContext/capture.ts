import screenshot from 'screenshot-desktop'

/**
 * Captures the current primary screen and returns it as a Buffer (PNG/JPG).
 */
export async function captureScreen(): Promise<Buffer | null> {
  try {
    // Return a buffer directly
    const imgBuffer = await screenshot({ format: 'png' })
    return imgBuffer
  } catch (error) {
    console.error('[Context] Error capturing screen:', error)
    return null
  }
}
