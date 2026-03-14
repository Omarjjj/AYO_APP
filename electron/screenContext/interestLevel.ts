import { ContextSnapshot } from './types'

// Helper: Normalize text into an array of lowercase words
function getWords(text: string): string[] {
  if (!text) return []
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
}

// Compute Jaccard similarity between two texts
// returns a value from 0 (completely different) to 1 (identical)
function computeJaccardSimilarity(textA: string, textB: string): number {
  const wordsA = new Set(getWords(textA))
  const wordsB = new Set(getWords(textB))

  if (wordsA.size === 0 && wordsB.size === 0) return 1
  if (wordsA.size === 0 || wordsB.size === 0) return 0

  let intersection = 0
  wordsA.forEach(word => {
    if (wordsB.has(word)) intersection++
  })

  const union = wordsA.size + wordsB.size - intersection
  return intersection / union
}

export function computeInterestScore(current: ContextSnapshot, previous: ContextSnapshot | null): { score: number, reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  // If there's no previous context, treat as high interest to capture initial state
  if (!previous) {
    return { score: 2, reasons: ['No previous context (Initial snapshot) (+2)'] }
  }

  // --- 1. Change magnitude ---
  if (current.app !== previous.app) {
    score += 1
    reasons.push(`App changed from '${previous.app}' to '${current.app}' (+1)`)
  } else if (current.title !== previous.title) {
    score += 1
    reasons.push(`Title changed from '${previous.title}' to '${current.title}' (+1)`)
  }

  const currentOcr = current.ocrText || ''
  const prevOcr = previous.ocrText || ''

  // Only compute similarity if we actually have text
  if (currentOcr || prevOcr) {
    const similarity = computeJaccardSimilarity(currentOcr, prevOcr)
    if (similarity < 0.3) {
      score += 2
      reasons.push(`High on-screen text change (Similarity: ${similarity.toFixed(2)}) (+2)`)
    } else if (similarity < 0.6) {
      score += 1
      reasons.push(`Medium on-screen text change (Similarity: ${similarity.toFixed(2)}) (+1)`)
    } else {
      reasons.push(`Low on-screen text change (Similarity: ${similarity.toFixed(2)}) (0)`)
    }
  }

  // --- 2. Keyword / pattern signals (Help-seeking) ---
  const titleAndOcr = `${current.title} ${currentOcr}`.toLowerCase()

  // Error patterns
  const errorPatterns = ['error:', 'exception', 'failed to', 'undefined', 'null', 'at line', 'stack trace']
  const foundErrors = errorPatterns.filter(pattern => titleAndOcr.includes(pattern))
  if (foundErrors.length > 0) {
    score += 2
    reasons.push(`Found error patterns [${foundErrors.join(', ')}] (+2)`)
  }

  // Help sites / URLs
  const helpSites = ['stackoverflow.com', 'github.com', 'reddit.com', 'youtube.com/watch']
  const foundSites = helpSites.filter(site => titleAndOcr.includes(site))
  if (foundSites.length > 0) {
    score += 2
    reasons.push(`Found help sites [${foundSites.join(', ')}] (+2)`)
  }

  // --- 3. Negative signals (Entertainment) ---
  const entertainmentApps = ['spotify', 'netflix', 'youtube']
  const currentAppLow = current.app.toLowerCase()
  const foundEntertainment = entertainmentApps.filter(ent => currentAppLow.includes(ent) || current.title.toLowerCase().includes(ent))
  if (foundEntertainment.length > 0) {
    score -= 3
    reasons.push(`Detected entertainment context [${foundEntertainment.join(', ')}] (-3)`)
  }

  return { score, reasons }
}
