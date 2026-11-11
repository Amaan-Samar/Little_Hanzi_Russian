// Small text helpers shared by the reader.
//
// Paragraphs are separated by a blank line (the same convention the old
// Korean app used). Everything here is deliberately dependency-free.

/**
 * Normalize line endings and collapse long runs of blank lines.
 * @param {string} text
 * @returns {string}
 */
export function normalizeParagraphBreaks(text) {
  return (text || '')
    .replace(/\r\n?/g, '\n')
    .replace(/(?:\n[ \t]*){3,}/g, '\n\n')
    .replace(/[ \t]+$/gm, '')
}

/**
 * Split a text into non-empty paragraphs.
 * @param {string} text
 * @returns {string[]}
 */
export function splitParagraphs(text) {
  if (!text || !text.trim()) return []
  return normalizeParagraphBreaks(text)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

/**
 * Count paragraphs in a text.
 * @param {string} text
 * @returns {number}
 */
export function countParagraphs(text) {
  return splitParagraphs(text).length
}

/**
 * Count words in a paragraph. Hyphenated words count as one word, and
 * punctuation on its own is ignored.
 * @param {string} text
 * @returns {number}
 */
export function countWords(text) {
  if (!text || !text.trim()) return 0
  return text
    .trim()
    .split(/\s+/)
    .filter((token) => /[\p{L}\p{N}]/u.test(token)).length
}

/**
 * Return the character range of every paragraph in a textarea value.
 * Useful for scrolling/focusing the paragraph the reader tapped in the
 * reading view.
 *
 * @param {string} text
 * @returns {{ start: number, end: number, text: string }[]}
 */
export function getParagraphRanges(text) {
  const normalized = (text || '').replace(/\r\n?/g, '\n')
  if (!normalized) return []

  const parts = normalized.split(/(\n\s*\n)/)
  const ranges = []
  let offset = 0

  for (const part of parts) {
    // Separator captured by the split — just advance the offset.
    if (/^\n\s*\n$/.test(part)) {
      offset += part.length
      continue
    }

    const leading = part.length - part.trimStart().length
    const trailing = part.length - part.trimEnd().length
    const content = part.trim()

    if (content) {
      ranges.push({
        start: offset + leading,
        end: offset + part.length - trailing,
        text: content,
      })
    }

    offset += part.length
  }

  return ranges
}

/**
 * Remove English indefinite/definite articles ("a", "an", "the") from a text.
 * This is intentionally done on rendering as well as on paste, so articles
 * pasted or typed later still disappear from the reading view.
 *
 * @param {string} text
 * @returns {string}
 */
export function stripEnglishArticles(text) {
  if (!text) return ''

  return normalizeParagraphBreaks(text)
    .split('\n')
    .map((line) => cleanEnglishLine(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
}

function cleanEnglishLine(line) {
  if (!line.trim()) return ''

  let cleaned = line.replace(/\b(?:the|an|a)\b/gi, ' ')
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ')
  cleaned = cleaned.replace(/\s+([,.;:!?%])/g, '$1')
  cleaned = cleaned.replace(/([,;:])(?=\S)/g, '$1 ')
  cleaned = cleaned.trimStart()

  return capitalizeSentenceStarts(cleaned)
}

function capitalizeSentenceStarts(text) {
  let result = ''
  let capitalizeNext = true

  for (const char of text) {
    if (capitalizeNext) {
      if (/\p{L}/u.test(char)) {
        result += char.toUpperCase()
        capitalizeNext = false
        continue
      }
      if (/\p{N}/u.test(char)) {
        result += char
        capitalizeNext = false
        continue
      }
      // Keep waiting through spaces, quotes, brackets, etc.
      result += char
      continue
    }

    result += char
    if (/[.!?]/.test(char)) capitalizeNext = true
  }

  return result
}
