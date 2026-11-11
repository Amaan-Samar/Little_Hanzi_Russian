// composables/useArticleHistory.js
import { ref, onMounted } from 'vue'

const STORAGE_KEY = 'littleKorean_articles'
const MAX_ARTICLES = 100
const AUTOSAVE_DELAY = 60 * 1000 // 1 minute

export function useArticleHistory() {
  const articles = ref([])
  const currentArticleId = ref(null)   // single source of truth for the "live" article context
  const autoSaveTimeout = ref(null)
  const isSaving = ref(false)

  // ---- persistence ----
  const loadArticles = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) articles.value = JSON.parse(saved)
    } catch (error) {
      console.error('Failed to load articles:', error)
      articles.value = []
    }
  }

  const saveArticles = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(articles.value))
    } catch (error) {
      console.error('Failed to save articles:', error)
    }
  }

  const generateId = () =>
    Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

  const extractTitle = (content) => {
    if (!content) return 'Untitled'
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length === 0) return 'Untitled'
    const firstLine = lines[0].trim()
    return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine
  }

  // ---- core API ----

  /**
   * Create a brand-new article and make it the current one.
   * Use ONLY when there is no active context.
   */
  const createArticle = (koreanContent, englishContent = '') => {
    if (!koreanContent || !koreanContent.trim()) return null

    const now = Date.now()
    const article = {
      id: generateId(),
      koreanContent,
      englishContent: englishContent || '',
      title: extractTitle(koreanContent),
      timestamp: now,
      bookmark: null,
    }
    articles.value.unshift(article)
    if (articles.value.length > MAX_ARTICLES) {
      articles.value = articles.value.slice(0, MAX_ARTICLES)
    }
    saveArticles()
    currentArticleId.value = article.id
    return article
  }

  /**
   * Update an EXISTING article in place. Does not append.
   * Accepts partial patches: { koreanContent?, englishContent?, title?, bookmark? }
   */
  const updateArticle = (id, patch) => {
    if (!id) return null
    const article = articles.value.find(a => a.id === id)
    if (!article) return null

    if (patch.koreanContent !== undefined) {
      article.koreanContent = patch.koreanContent
      article.title = extractTitle(patch.koreanContent)
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
  }

  const clearCurrentArticle = () => {
    currentArticleId.value = null
  }

  const scheduleAutoSave = (koreanContent, englishContent = '') => {
    if (autoSaveTimeout.value) clearTimeout(autoSaveTimeout.value)

    // If no context, do nothing — creating requires explicit user action.
    if (!currentArticleId.value) return
    if (!koreanContent && !englishContent) return

    autoSaveTimeout.value = setTimeout(() => {
      if (currentArticleId.value) {
        updateArticle(currentArticleId.value, {
          koreanContent,
          englishContent,
        })
      }
      autoSaveTimeout.value = null
    }, AUTOSAVE_DELAY)
  }

  const flushAutoSave = (koreanContent, englishContent = '') => {
    if (autoSaveTimeout.value) {
      clearTimeout(autoSaveTimeout.value)
      autoSaveTimeout.value = null
    }
    if (currentArticleId.value) {
      return updateArticle(currentArticleId.value, {
        koreanContent,
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
    articles.value = articles.value.filter(a => a.id !== articleId)
    if (currentArticleId.value === articleId) currentArticleId.value = null
    saveArticles()
  }

  const deleteAllArticles = () => {
    articles.value = []
    currentArticleId.value = null
    saveArticles()
  }

  const loadArticle = (articleId) => {
    const article = articles.value.find(a => a.id === articleId)
    if (article) {
      currentArticleId.value = articleId
      return article
    }
    return null
  }

  const isCurrentArticle = (articleId) =>
    currentArticleId.value === articleId

  const setBookmark = (articleId, paragraphIndex) => {
    const article = articles.value.find(a => a.id === articleId)
    if (article) {
      article.bookmark = paragraphIndex
      saveArticles()
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

  onMounted(() => {
    loadArticles()
  })

  return {
    // state
    articles,
    currentArticleId,
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
  }
}