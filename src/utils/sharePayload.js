// utils/sharePayload.js
// Encoding helpers for QR article shares and JSON bundles.
import LZString from 'lz-string'
import { splitParagraphs, countWords } from './textProcessing'

export const SHARE_APP_ID = 'little-hanzi-russian'
export const SHARE_VERSION = 1
export const SHARE_HASH_PREFIX = '#share='

// A QR code can hold roughly 2.9 kB in byte mode at the lowest error
// correction. Keep a margin so phones can still resolve it comfortably.
export const MAX_QR_CHARS = 2400

const cleanString = (value) => (typeof value === 'string' ? value : '')

const normalizeLikes = (value) => {
  if (!Array.isArray(value)) return []
  return [
    ...new Set(
      value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item >= 0),
    ),
  ].sort((a, b) => a - b)
}

/**
 * Small, QR-friendly payload. Short keys keep the URL inside QR limits.
 */
export const buildSharePayload = (article, sharedBy) => {
  if (!article?.russianContent?.trim()) return null
  return {
    v: SHARE_VERSION,
    t: 'article',
    id: article.id || undefined,
    ti: article.title || cleanString(article.russianContent).slice(0, 60),
    ru: article.russianContent,
    en: article.englishContent || '',
    lk: normalizeLikes(article.likedParagraphs),
    by: sharedBy || article.sharedBy || 'A friend',
    at: Date.now(),
  }
}

export const encodeSharePayload = (payload) => {
  if (!payload) return ''
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload))
}

export const decodeSharePayload = (encoded) => {
  if (!encoded) return null
  const attempts = [encoded]
  try {
    attempts.push(decodeURIComponent(encoded))
  } catch {
    // The raw value was already decoded.
  }

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(LZString.decompressFromEncodedURIComponent(candidate))
      if (!parsed || typeof parsed !== 'object') continue
      if (parsed.t !== 'article' || !cleanString(parsed.ru).trim()) continue
      return {
        id: parsed.id || undefined,
        title: cleanString(parsed.ti) || cleanString(parsed.ru).slice(0, 60),
        russianContent: cleanString(parsed.ru),
        englishContent: cleanString(parsed.en),
        likedParagraphs: normalizeLikes(parsed.lk),
        sharedBy: cleanString(parsed.by) || 'A friend',
        sharedAt: Number(parsed.at) || Date.now(),
        timestamp: Number(parsed.at) || Date.now(),
      }
    } catch {
      // Try the next candidate.
    }
  }
  return null
}

const basePath = () => {
  const base = import.meta.env.BASE_URL || '/'
  return base.endsWith('/') ? base : `${base}/`
}

export const buildShareUrl = (payload) => {
  const encoded = encodeSharePayload(payload)
  if (!encoded) return { url: '', encoded: '', tooLarge: false }
  const url = `${window.location.origin}${basePath()}${SHARE_HASH_PREFIX}${encoded}`
  return { url, encoded, tooLarge: encoded.length > MAX_QR_CHARS }
}

export const parseShareHash = (hash) => {
  if (!hash) return null
  const value = hash.startsWith('#') ? hash.slice(1) : hash
  if (!value.startsWith('share=')) return null
  return decodeSharePayload(value.slice('share='.length))
}

export const makeShareBundle = (articles, sharedBy) => ({
  app: SHARE_APP_ID,
  version: SHARE_VERSION,
  kind: 'share',
  sharedBy: sharedBy || 'A friend',
  exportedAt: Date.now(),
  articles: (articles || []).map((article) => ({
    id: article.id,
    title: article.title,
    russianContent: article.russianContent || '',
    englishContent: article.englishContent || '',
    likedParagraphs: normalizeLikes(article.likedParagraphs),
    sharedBy: article.sharedBy || null,
    sharedAt: article.sharedAt || null,
    timestamp: article.timestamp || Date.now(),
  })),
})

export const makeBackupBundle = (articles) => ({
  app: SHARE_APP_ID,
  version: SHARE_VERSION,
  kind: 'backup',
  exportedAt: Date.now(),
  articles: (articles || []).map((article) => ({
    id: article.id,
    title: article.title,
    russianContent: article.russianContent || '',
    englishContent: article.englishContent || '',
    bookmark:
      article.bookmark === null || article.bookmark === undefined
        ? null
        : Number(article.bookmark),
    likedParagraphs: normalizeLikes(article.likedParagraphs),
    read: Boolean(article.read),
    archived: Boolean(article.archived),
    sharedBy: article.sharedBy || null,
    sharedAt: article.sharedAt || null,
    timestamp: article.timestamp || Date.now(),
  })),
})

export const parseBundle = (text) => {
  let parsed
  try {
    parsed = typeof text === 'string' ? JSON.parse(text) : text
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' }
  }
  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'The bundle is empty or malformed.' }
  }
  if (!Array.isArray(parsed.articles)) {
    return { ok: false, error: 'The bundle does not contain an articles list.' }
  }
  if (parsed.app && parsed.app !== SHARE_APP_ID) {
    return { ok: false, error: 'This bundle belongs to a different Little Hanzi app.' }
  }
  return {
    ok: true,
    bundle: {
      kind: parsed.kind === 'share' ? 'share' : 'backup',
      sharedBy: cleanString(parsed.sharedBy) || 'A friend',
      exportedAt: Number(parsed.exportedAt) || Date.now(),
      articles: parsed.articles,
    },
  }
}

export const articlePreview = (article, maxLength = 84) => {
  const paragraphs = splitParagraphs(article?.russianContent || '')
  const first = paragraphs[0] || ''
  return first.length > maxLength ? `${first.slice(0, maxLength)}...` : first
}

export const articleWordCount = (article) =>
  countWords(`${article?.russianContent || ''} ${article?.englishContent || ''}`)

export const slugify = (value, fallback = 'article') => {
  const slug = cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return slug || fallback
}

export const downloadJson = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
