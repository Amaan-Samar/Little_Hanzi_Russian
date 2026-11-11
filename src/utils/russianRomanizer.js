// Russian → Latin romanization.
//
// We use `iuliia` (MIT) with its Wikipedia schema. It understands Russian
// letter combinations and word endings (for example объявление → obyavleniye,
// подъезд → podyezd, его → yego) and produces clean ASCII that is easy to read
// for a learner. The schema is designed for names, but it is the most
// learner-friendly of the built-in schemas and works well for running text.
//
// We keep the romanization lowercase, matching the old Korean app's style, so
// the reading aid stays visually quiet underneath the Russian text.
import { translate, WIKIPEDIA } from 'iuliia'

const SCHEMA = WIKIPEDIA
const CYRILLIC_RE = /[\u0400-\u04FF]/

/**
 * Romanize a single word or a short token. Punctuation is preserved.
 * @param {string} text
 * @returns {string}
 */
export function romanizeRussian(text) {
  if (!text) return ''
  try {
    return translate(text, SCHEMA).toLowerCase()
  } catch (error) {
    console.error('Russian romanization failed:', error)
    return text
  }
}

/**
 * Split a paragraph into word-level tokens for the reading view.
 * Each token keeps its original punctuation and gets a romanization that can
 * be rendered directly underneath it.
 *
 * @param {string} paragraph
 * @returns {{ text: string, romanized: string, isWord: boolean }[]}
 */
export function tokenizeRussianParagraph(paragraph) {
  if (!paragraph) return []

  return paragraph
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const isWord = CYRILLIC_RE.test(token)
      return {
        text: token,
        romanized: isWord ? romanizeRussian(token) : '',
        isWord,
      }
    })
}
