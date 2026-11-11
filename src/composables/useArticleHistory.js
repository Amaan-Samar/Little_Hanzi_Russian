// composables/useArticleHistory.js
import { ref } from 'vue'

const STORAGE_KEY = 'littleRussian_articles'
const LAST_SESSION_KEY = 'littleRussian_lastSession'
const MAX_ARTICLES = 100
const AUTOSAVE_DELAY = 60 * 1000 // 1 minute

export function useArticleHistory() {
  const articles = ref([])
  const currentArticleId = ref(null) // single source of truth for the "live" article context
  const lastSession = ref(null)
  const autoSaveTimeout = ref(null)
  const isSaving = ref(false)

  // ---- persistence ----
  const loadArticles = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (!saved) return
      const parsed = JSON.parse(saved)
      if (!Array.isArray(parsed)) return

      articles.value = parsed.map((article) => {
        const bookmark =
          article.bookmark === null || article.bookmark === undefined
            ? null
            : Number(article.bookmark)
        return {
          ...article,
          // Defensive migration in case an older build stored Korean fields.
          russianContent: article.russianContent ?? article.koreanContent ?? '',
          englishContent: article.englishContent ?? '',
          bookmark: Number.isFinite(bookmark) ? bookmark : null,
        }
      })
    } catch (error) {
      console.error('Failed to load articles:', error)
      articles.value = []
    }
  }

  const loadLastSession = () => {
    try {
      const saved = localStorage.getItem(LAST_SESSION_KEY)
      if (saved) lastSession.value = JSON.parse(saved)
    } catch (error) {
      console.error('Failed to load last reading session:', error)
      lastSession.value = null
    }
  }

  const saveArticles = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(articles.value))
    } catch (error) {
      console.error('Failed to save articles:', error)
    }
  }

  const saveLastSession = () => {
    try {
      if (lastSession.value) {
        localStorage.setItem(LAST_SESSION_KEY, JSON.stringify(lastSession.value))
      } else {
        localStorage.removeItem(LAST_SESSION_KEY)
      }
    } catch (error) {
      console.error('Failed to save last reading session:', error)
    }
  }

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

  const extractTitle = (content) => {
    if (!content) return 'Untitled'
    const lines = content.split('\n').filter((line) => line.trim())
    if (lines.length === 0) return 'Untitled'
    const firstLine = lines[0].trim()
    return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine
  }

  // ---- last-session helpers ----

  /**
   * Remember which article the reader was in. The resume prompt only appears
   * when that article has a bookmark (i.e. it was actually left mid-read).
   */
  const touchLastSession = (articleId, bookmarkOverride) => {
    if (!articleId) return
    const article = articles.value.find((item) => item.id === articleId)
    lastSession.value = {
      articleId,
      bookmark:
        bookmarkOverride !== undefined
          ? bookmarkOverride
          : (article?.bookmark ?? null),
      timestamp: Date.now(),
    }
    saveLastSession()
  }

  const clearLastSession = () => {
    lastSession.value = null
    saveLastSession()
  }

  /**
   * Article that should be offered in the "continue reading" prompt.
   * Returns null when there is nothing worth resuming.
   */
  const getResumeArticle = () => {
    const session = lastSession.value
    if (!session?.articleId) return null
    const article = articles.value.find((item) => item.id === session.articleId)
    if (!article) return null
    if (article.bookmark === null || article.bookmark === undefined) return null
    return article
  }

  // ---- core API ----

  /**
   * Create a brand-new article and make it the current one.
   * Use ONLY when there is no active context.
   */
  const createArticle = (russianContent, englishContent = '') => {
    if (!russianContent || !russianContent.trim()) return null

    const now = Date.now()
    const article = {
      id: generateId(),
      russianContent,
      englishContent: englishContent || '',
      title: extractTitle(russianContent),
      timestamp: now,
      bookmark: null,
    }
    articles.value.unshift(article)
    if (articles.value.length > MAX_ARTICLES) {
      articles.value = articles.value.slice(0, MAX_ARTICLES)
    }
    saveArticles()
    currentArticleId.value = article.id
    touchLastSession(article.id, null)
    return article
  }

  /**
   * Update an EXISTING article in place. Does not append.
   * Accepts partial patches: { russianContent?, englishContent?, title?, bookmark? }
   */
  const updateArticle = (id, patch) => {
    if (!id) return null
    const article = articles.value.find((item) => item.id === id)
    if (!article) return null

    if (patch.russianContent !== undefined) {
      article.russianContent = patch.russianContent
      article.title = extractTitle(patch.russianContent)
    }
    if (patch.englishContent !== undefined) {
      article.englishContent = patch.englishContent
    }
    if (patch.bookmark !== undefined) {
      article.bookmark = patch.bookmark
    }
    article.timestamp = Date.now()

    saveArticles()
    return article
  }

  const setCurrentArticle = (id) => {
    currentArticleId.value = id
    touchLastSession(id)
  }

  const clearCurrentArticle = () => {
    currentArticleId.value = null
    clearLastSession()
  }

  const scheduleAutoSave = (russianContent, englishContent = '') => {
    if (autoSaveTimeout.value) clearTimeout(autoSaveTimeout.value)

    // If no context, do nothing — creating requires explicit user action.
    if (!currentArticleId.value) return
    if (!russianContent && !englishContent) return

    autoSaveTimeout.value = setTimeout(() => {
      if (currentArticleId.value) {
        updateArticle(currentArticleId.value, {
          russianContent,
          englishContent,
        })
      }
      autoSaveTimeout.value = null
    }, AUTOSAVE_DELAY)
  }

  const flushAutoSave = (russianContent, englishContent = '') => {
    if (autoSaveTimeout.value) {
      clearTimeout(autoSaveTimeout.value)
      autoSaveTimeout.value = null
    }
    if (currentArticleId.value) {
      return updateArticle(currentArticleId.value, {
        russianContent,
        englishContent,
      })
    }
    return null
  }

  const cancelAutoSave = () => {
    if (autoSaveTimeout.value) {
      clearTimeout(autoSaveTimeout.value)
      autoSaveTimeout.value = null
    }
  }

  const deleteArticle = (articleId) => {
    articles.value = articles.value.filter((article) => article.id !== articleId)
    if (currentArticleId.value === articleId) currentArticleId.value = null
    if (lastSession.value?.articleId === articleId) clearLastSession()
    saveArticles()
  }

  const deleteAllArticles = () => {
    articles.value = []
    currentArticleId.value = null
    clearLastSession()
    saveArticles()
  }

  const loadArticle = (articleId) => {
    const article = articles.value.find((item) => item.id === articleId)
    if (article) {
      currentArticleId.value = articleId
      touchLastSession(articleId)
      return article
    }
    return null
  }

  const isCurrentArticle = (articleId) => currentArticleId.value === articleId

  const setBookmark = (articleId, paragraphIndex) => {
    const article = articles.value.find((item) => item.id === articleId)
    if (article) {
      article.bookmark = paragraphIndex
      saveArticles()
      touchLastSession(articleId, paragraphIndex)
    }
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Load before the component mounts so the resume prompt has data on first paint.
  loadArticles()
  loadLastSession()

  return {
    // state
    articles,
    currentArticleId,
    lastSession,
    isSaving,
    // core API
    createArticle,
    updateArticle,
    setCurrentArticle,
    clearCurrentArticle,
    flushAutoSave,
    scheduleAutoSave,
    cancelAutoSave,
    deleteArticle,
    deleteAllArticles,
    loadArticle,
    isCurrentArticle,
    setBookmark,
    formatDate,
    saveArticles,
    // resume support
    getResumeArticle,
    clearLastSession,
  }
}
