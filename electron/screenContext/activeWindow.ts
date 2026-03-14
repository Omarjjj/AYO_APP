/**
 * Gets the current active (foreground) window on the system.
 */
export async function getActiveWindow(): Promise<{ app: string; title: string } | null> {
  try {
    // active-win is often ESM-only in newer versions, so we dynamically import it
    const activeWin = (await import('active-win')).default
    const win = await activeWin()
    
    if (!win) {
      return null
    }

    return {
      app: win.owner?.name || 'Unknown',
      title: win.title || 'Unknown',
    }
  } catch (error) {
    console.error('[Context] Error getting active window:', error)
    return null
  }
}
