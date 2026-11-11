<template>
  <div class="converter-wrapper">
    <!-- Header with Logo and Settings -->
    <div class="app-header">
      <div class="logo-section">
        <span class="logo-mark"><Snowflake :size="18" /></span>
        <h1 class="logo">Little Hanzi <span class="logo-lang">Русский</span></h1>
      </div>
      <div class="header-buttons">
        <!-- Save Button -->
        <button
          class="save-icon-btn"
          @click="handleManualSave"
          title="Save Article"
          :disabled="!russianText.trim() || isSaving"
        >
          <Save :size="20" />
          <span v-if="isSaving" class="save-spinner"></span>
        </button>

        <button class="history-icon-btn" @click="openHistoryModal" title="Reading History">
          <BookOpen :size="22" />
        </button>

        <button class="settings-icon-btn" @click="openSettingsModal" title="Settings">
          <Settings :size="24" />
        </button>

        <button class="info-icon-btn" @click="openInfoModal" title="Information">
          <Info :size="22" />
        </button>
      </div>
    </div>

    <!-- History Modal -->
    <ArticleHistoryModal
      :isOpen="isHistoryModalOpen"
      :articles="articles"
      :isCurrentArticle="isCurrentArticle"
      :formatDate="formatDate"
      @close="closeHistoryModal"
      @load-article="loadArticleIntoEditor"
      @delete-article="handleDeleteArticle"
      @delete-all="handleDeleteAllArticles"
    />

    <!-- Info Modal -->
    <InfoModal :isOpen="isInfoModalOpen" @close="closeInfoModal" />

    <div class="main-content">
      <LoadingSpinner :isLoading="isLoading" :text="loadingText" />

      <!-- Toast notification -->
      <div v-if="showSaveToast" class="toast" :class="`toast-${toastType}`">
        <span>{{ toastMessage }}</span>
      </div>

      <!-- "Continue where you left off" prompt -->
      <Transition name="resume">
        <div v-if="resumeArticle" class="resume-banner">
          <div class="resume-icon"><BookMarked :size="20" /></div>
          <div class="resume-copy">
            <strong>Continue where you left off?</strong>
            <p>
              Last time you left <em>“{{ resumeArticle.title }}”</em> mid-reading.
              Your bookmark is at paragraph {{ Number(resumeArticle.bookmark) + 1 }}.
            </p>
          </div>
          <div class="resume-actions">
            <button class="resume-primary" @click="resumeReading">
              Continue reading
            </button>
            <button class="resume-dismiss" @click="dismissResume">Not now</button>
          </div>
        </div>
      </Transition>

      <div class="input-display-row">
        <!-- Russian Text Input -->
        <div class="text-section" :style="{ fontFamily: getFontFamily }">
          <div class="input-label-row">
            <label class="input-label">Russian</label>
            <span class="input-meta">
              {{ russianParagraphCount }} {{ russianParagraphCount === 1 ? 'paragraph' : 'paragraphs' }}
              · {{ russianTotalWords }} {{ russianTotalWords === 1 ? 'word' : 'words' }}
            </span>
          </div>
          <div class="input-wrapper">
            <textarea
              ref="russianTextareaRef"
              v-model="russianText"
              placeholder="Paste Russian text here..."
              class="text-input w-full"
              @input="handleRussianInput"
            ></textarea>
            <button
              v-if="russianText.trim()"
              @click="openEditModal('russian')"
              class="edit-btn"
              title="Edit in popup"
            >
              <EditIcon :size="16" />
            </button>
          </div>
          <button @click="clearOrPasteText('russian')" class="action-btn">
            {{ russianText.trim() ? 'Clear' : 'Paste' }}
          </button>
        </div>

        <!-- English Translation Input -->
        <div class="text-section" :style="{ fontFamily: getFontFamily }">
          <div class="input-label-row">
            <label class="input-label">English</label>
            <span class="input-meta">
              {{ englishParagraphCount }} {{ englishParagraphCount === 1 ? 'paragraph' : 'paragraphs' }}
              · {{ englishTotalWords }} {{ englishTotalWords === 1 ? 'word' : 'words' }}
            </span>
          </div>
          <div class="input-wrapper">
            <textarea
              v-model="englishText"
              placeholder="Paste English translation here..."
              class="text-input w-full english-input"
            ></textarea>
            <button
              v-if="englishText.trim()"
              @click="openEditModal('english')"
              class="edit-btn"
              title="Edit in popup"
            >
              <EditIcon :size="16" />
            </button>
          </div>
          <button @click="clearOrPasteText('english')" class="action-btn">
            {{ englishText.trim() ? 'Clear' : 'Paste' }}
          </button>
          <p class="article-note">Articles “a”, “an” and “the” are removed automatically.</p>
        </div>
      </div>

      <!-- Paragraph count validation -->
      <div v-if="paragraphCountMismatch" class="paragraph-warning" role="alert">
        <AlertTriangle :size="18" />
        <p>
          Paragraph count mismatch: Russian has
          <strong>{{ russianParagraphCount }}</strong>, English has
          <strong>{{ englishParagraphCount }}</strong>. Each Russian paragraph needs a
          matching English paragraph.
        </p>
      </div>

      <!-- Edit Modal -->
      <EditModal
        :isOpen="isEditModalOpen"
        :title="editModalTitle"
        :content="editModalContent"
        :fontSize="Number(fontSize)"
        :fontFamily="getFontFamily"
        @close="closeEditModal"
        @save="saveEditModalContent"
      />

      <!-- Settings Modal -->
      <SettingsModal
        :isOpen="isSettingsModalOpen"
        :settings="settings"
        @close="closeSettingsModal"
        @save="saveSettings"
        @reset="resetToDefaults"
      />

      <div
        v-if="russianText.trim() && (showEnglish || showRussian)"
        class="comparison-section"
      >
        <div class="comparison-display relative">
          <div
            v-for="(block, sentenceId) in comparisonData"
            :key="sentenceId"
            class="comparison-block relative"
            :data-paragraph-index="sentenceId"
          >
            <!-- English translation -->
            <div
              v-if="showEnglish && englishSegments[sentenceId]"
              class="english-translation-box"
              :style="{
                order: displayOrder === 'en-ru' ? 1 : 2,
                fontFamily: getFontFamily,
              }"
            >
              <div class="paragraph-topline">
                <span class="lang-badge lang-badge-en">EN</span>
                <span class="word-count">
                  {{ englishWordCounts[sentenceId] || 0 }}
                  {{ (englishWordCounts[sentenceId] || 0) === 1 ? 'word' : 'words' }}
                </span>
              </div>
              <div
                class="english-text"
                :style="{ fontSize: `${englishFontSize}px`, lineHeight: '1.65' }"
              >
                {{ englishSegments[sentenceId] }}
              </div>
            </div>

            <!-- Russian reading line -->
            <div
              v-if="showRussian"
              class="line-container"
              :class="{ 'is-focused': focusedParagraph === sentenceId }"
              :style="{
                order: displayOrder === 'ru-en' ? 1 : 2,
                fontFamily: getFontFamily,
              }"
              @click="handleParagraphClick(sentenceId)"
              @dblclick="handleParagraphDoubleClick(sentenceId)"
              @touchstart.passive="handleTouchStart"
              @touchmove.passive="handleTouchMove"
              @touchend.passive="handleTouchEnd(sentenceId)"
            >
              <button
                v-if="currentBookmark === sentenceId"
                class="bookmark-btn is-active"
                @click.stop="toggleBookmark(sentenceId)"
                title="Remove bookmark"
              >
                <Bookmark :size="14" fill="currentColor" />
              </button>

              <template
                v-if="focusedParagraph === sentenceId && currentBookmark !== sentenceId"
              >
                <button
                  class="paragraph-menu-btn"
                  @click.stop="toggleParagraphMenu(sentenceId, $event)"
                  title="More actions"
                >
                  <MoreVertical :size="14" />
                </button>
              </template>

              <div class="paragraph-topline">
                <span class="lang-badge lang-badge-ru">RU</span>
                <span class="word-count">
                  {{ block.wordCount }}
                  {{ block.wordCount === 1 ? 'word' : 'words' }}
                </span>
              </div>

              <div class="text-line">
                <div class="line-words" :style="{ fontSize: `${fontSize}px` }">
                  <span
                    v-for="(wordData, wordIndex) in block.words"
                    :key="wordIndex"
                    class="word-group"
                  >
                    <span class="russian-word">{{ wordData.text }}</span>
                    <span
                      v-if="showRomanization && wordData.romanized"
                      class="romanization-below"
                      :style="{
                        fontSize: `${romanizationFontSize}px`,
                      }"
                    >
                      {{ wordData.romanized }}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="russianText.trim()" class="quick-actions">
            <button @click="requestClearAll" class="clear-all-btn">
              Clear All Text
            </button>
          </div>

          <div
            class="scroll-spacer"
            :style="{ minHeight: `calc(66vh - ${fontSize * 2}px)` }"
          ></div>
        </div>
      </div>

      <!-- Empty state when both English and Russian are hidden -->
      <div
        v-else-if="russianText.trim() && !showEnglish && !showRussian"
        class="empty-state"
      >
        <p>Both English and Russian paragraphs are hidden. Enable them in settings.</p>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmModal
      :isOpen="showConfirmModal"
      title="Clear All Text"
      message="Are you sure you want to clear all Russian and English text? This action cannot be undone."
      confirmText="Yes, Clear All"
      cancelText="Cancel"
      @confirm="confirmClearAll"
      @cancel="cancelClearAll"
    />

    <!-- Teleported paragraph ⋮ menu -->
    <Teleport to="body">
      <div
        v-if="openMenuParagraph !== null && menuPosition"
        class="paragraph-menu paragraph-menu--teleported"
        :style="{ top: menuPosition.top + 'px', left: menuPosition.left + 'px' }"
        @click.stop
      >
        <button
          class="paragraph-menu-item"
          @click.stop="bookmarkFromMenu(openMenuParagraph)"
        >
          <Bookmark :size="14" />
          Bookmark
        </button>
        <button
          class="paragraph-menu-item"
          @click.stop="editParagraphFromMenu(openMenuParagraph)"
        >
          <PencilLine :size="14" />
          Edit paragraph
        </button>
        <button
          class="paragraph-menu-item"
          @click.stop="copyParagraph(openMenuParagraph)"
        >
          <Copy :size="14" />
          Copy
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import {
  Edit as EditIcon,
  Settings,
  BookOpen,
  Save,
  Info,
  Bookmark,
  BookMarked,
  MoreVertical,
  AlertTriangle,
  Snowflake,
  PencilLine,
  Copy,
} from 'lucide-vue-next'

import ArticleHistoryModal from './ArticleHistoryModal.vue'
import EditModal from './EditModal.vue'
import ConfirmModal from './ConfirmModal.vue'
import SettingsModal from './SettingsModal.vue'
import InfoModal from './InfoModal.vue'
import LoadingSpinner from './LoadingSpinner.vue'

import { useArticleHistory } from '../composables/useArticleHistory'
import { useSettings } from '../composables/useSettings'
import { tokenizeRussianParagraph } from '../utils/russianRomanizer'
import {
  normalizeParagraphBreaks,
  splitParagraphs,
  countWords,
  stripEnglishArticles,
  getParagraphRanges,
} from '../utils/textProcessing'

const {
  fontSize,
  selectedFont,
  showRomanization,
  showRussian,
  showEnglish,
  displayOrder,
  romanizationFontSize,
  englishFontSize,
  resetSettings,
} = useSettings()

const {
  articles,
  currentArticleId,
  createArticle,
  updateArticle,
  setCurrentArticle,
  clearCurrentArticle,
  flushAutoSave,
  scheduleAutoSave,
  cancelAutoSave,
  deleteArticle,
  deleteAllArticles,
  isCurrentArticle,
  formatDate,
  isSaving,
  setBookmark,
  getResumeArticle,
  clearLastSession,
} = useArticleHistory()

const russianText = ref('')
const englishText = ref('')
const russianTextareaRef = ref(null)

const showConfirmModal = ref(false)
const isSettingsModalOpen = ref(false)
const isInfoModalOpen = ref(false)
const isLoading = ref(false)
const loadingText = ref('Processing...')
const showSaveToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success')
let toastTimeout = null

const isEditModalOpen = ref(false)
const editModalType = ref('russian')
const editModalTitle = computed(() =>
  editModalType.value === 'russian' ? 'Russian Text' : 'English Translation',
)
const editModalContent = computed(() =>
  editModalType.value === 'russian' ? russianText.value : englishText.value,
)

const isHistoryModalOpen = ref(false)
const resumeArticle = ref(null)

// Bookmark & paragraph menu state
const currentBookmark = ref(null)
const pendingBookmark = ref(null)
const focusedParagraph = ref(null)
const openMenuParagraph = ref(null)
const menuPosition = ref(null)

// ---------- Fonts ----------
const fonts = {
  Inter: "'Inter', 'Noto Sans', system-ui, sans-serif",
  NotoSans: "'Noto Sans', 'Inter', system-ui, sans-serif",
  PTSerif: "'PT Serif', Georgia, 'Times New Roman', serif",
  NotoSerif: "'Noto Serif', Georgia, serif",
  Roboto: "'Roboto', 'Noto Sans', system-ui, sans-serif",
  Poppins: "'Poppins', 'Noto Sans', system-ui, sans-serif",
  Georgia: "Georgia, 'Times New Roman', serif",
}
const getFontFamily = computed(() => fonts[selectedFont.value] || fonts.Inter)

// ---------- Toast ----------
const showToastMessage = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showSaveToast.value = true
  if (toastTimeout) clearTimeout(toastTimeout)
  toastTimeout = setTimeout(() => {
    showSaveToast.value = false
  }, 3200)
}

// ---------- Parsing ----------
const comparisonData = computed(() => {
  const paragraphs = splitParagraphs(russianText.value)
  return paragraphs.map((paragraph) => ({
    raw: paragraph,
    words: tokenizeRussianParagraph(paragraph),
    wordCount: countWords(paragraph),
  }))
})

const processedEnglishText = computed(() => stripEnglishArticles(englishText.value))
const englishParagraphList = computed(() => splitParagraphs(processedEnglishText.value))
const russianParagraphCount = computed(() => Object.keys(comparisonData.value).length)
const englishParagraphCount = computed(() => englishParagraphList.value.length)
const russianTotalWords = computed(() => countWords(russianText.value))
const englishTotalWords = computed(() => countWords(processedEnglishText.value))

const paragraphCountMismatch = computed(
  () =>
    russianParagraphCount.value > 0 &&
    englishParagraphCount.value > 0 &&
    russianParagraphCount.value !== englishParagraphCount.value,
)

const englishSegments = computed(() => {
  const result = {}
  englishParagraphList.value.forEach((paragraph, index) => {
    if (index < comparisonData.value.length) result[index] = paragraph
  })
  return result
})

const englishWordCounts = computed(() => {
  const counts = {}
  for (const [key, text] of Object.entries(englishSegments.value)) {
    counts[key] = countWords(text)
  }
  return counts
})

// ---------- Autosave ----------
watch(
  [russianText, englishText],
  ([newRu, newEn]) => {
    if (newRu && newRu.trim()) scheduleAutoSave(newRu, newEn)
    else cancelAutoSave()
  },
  { deep: true },
)

// ---------- Modals ----------
const openHistoryModal = () => {
  isHistoryModalOpen.value = true
}
const closeHistoryModal = () => {
  isHistoryModalOpen.value = false
}
const openInfoModal = () => {
  isInfoModalOpen.value = true
}
const closeInfoModal = () => {
  isInfoModalOpen.value = false
}

const handleManualSave = () => {
  if (!russianText.value.trim()) return

  let article
  if (currentArticleId.value) {
    flushAutoSave(russianText.value, englishText.value)
    article = updateArticle(currentArticleId.value, {
      russianContent: russianText.value,
      englishContent: englishText.value,
    })
  } else {
    article = createArticle(russianText.value, englishText.value)
  }

  if (article) {
    resumeArticle.value = null
    showToastMessage('❄️ Article saved successfully!')
  }
}

// ---------- Resume prompt ----------
const resumeReading = async () => {
  const article = resumeArticle.value
  if (!article) return
  await loadArticleIntoEditor(article)
}

const dismissResume = () => {
  clearLastSession()
  resumeArticle.value = null
}

const handleRussianInput = () => {
  // The reader has started typing/pasting something else — stop offering the
  // old article in the banner. The history entry is untouched.
  if (resumeArticle.value) resumeArticle.value = null
}

const loadArticleIntoEditor = async (article) => {
  isLoading.value = true
  loadingText.value = 'Loading article...'
  await new Promise((resolve) => setTimeout(resolve, 200))

  const bookmark =
    article.bookmark === null || article.bookmark === undefined
      ? null
      : Number(article.bookmark)

  russianText.value = article.russianContent || ''
  englishText.value = article.englishContent || ''
  currentBookmark.value = Number.isFinite(bookmark) ? bookmark : null
  resumeArticle.value = null
  cancelAutoSave()
  setCurrentArticle(article.id)

  isLoading.value = false

  if (currentBookmark.value !== null) {
    if (comparisonData.value[currentBookmark.value]) {
      await nextTick()
      scrollToBookmark(currentBookmark.value)
    } else {
      pendingBookmark.value = currentBookmark.value
    }
  }
}

const scrollToBookmark = (paragraphIndex) => {
  const index = Number(paragraphIndex)
  const el = document.querySelector(`[data-paragraph-index="${index}"]`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// ---------- Bookmark toggle ----------
const toggleBookmark = (paragraphIndex) => {
  const index = Number(paragraphIndex)
  if (!currentArticleId.value) {
    const article = createArticle(russianText.value, englishText.value)
    if (!article) return
  }
  if (!currentArticleId.value) return

  const nextBookmark = currentBookmark.value === index ? null : index
  currentBookmark.value = nextBookmark
  setBookmark(currentArticleId.value, nextBookmark)
}

// ---------- Paragraph focus & menu ----------
const handleParagraphClick = (index) => {
  focusedParagraph.value = index
}

const closeParagraphMenu = () => {
  openMenuParagraph.value = null
  menuPosition.value = null
}

const toggleParagraphMenu = (index, event) => {
  if (openMenuParagraph.value === index) {
    closeParagraphMenu()
    return
  }
  openMenuParagraph.value = index
  focusedParagraph.value = index

  const btn = event?.currentTarget
  if (btn) {
    const rect = btn.getBoundingClientRect()
    const MENU_WIDTH = 210
    const MENU_HEIGHT = 140
    const MARGIN = 8

    const left = Math.min(
      window.innerWidth - MENU_WIDTH - MARGIN,
      Math.max(MARGIN, rect.right - MENU_WIDTH),
    )

    const spaceBelow = window.innerHeight - rect.bottom
    const top =
      spaceBelow >= MENU_HEIGHT + MARGIN
        ? rect.bottom + 4
        : rect.top - MENU_HEIGHT - 4

    menuPosition.value = { top, left }
  }
}

const handleDocumentClick = (e) => {
  const inside = e.target.closest('.line-container, .paragraph-menu')
  if (!inside) {
    focusedParagraph.value = null
    closeParagraphMenu()
  }
}

const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    closeParagraphMenu()
    focusedParagraph.value = null
  }
}

// ---------- Double-click / double-tap ----------
const handleParagraphDoubleClick = (index) => {
  toggleBookmark(index)
}

let touchMoved = false
let lastTapIndex = null
let lastTapTime = 0
const handleTouchStart = () => {
  touchMoved = false
}
const handleTouchMove = () => {
  touchMoved = true
}
const handleTouchEnd = (index) => {
  if (touchMoved) return
  const now = Date.now()
  if (lastTapIndex === index && now - lastTapTime < 300) {
    toggleBookmark(index)
    lastTapIndex = null
    lastTapTime = 0
  } else {
    lastTapIndex = index
    lastTapTime = now
    focusedParagraph.value = index
  }
}

// ---------- Menu actions ----------
const bookmarkFromMenu = (index) => {
  toggleBookmark(index)
  closeParagraphMenu()
}

const editParagraphFromMenu = (index) => {
  const block = comparisonData.value[index]
  if (!block) return

  closeParagraphMenu()
  focusedParagraph.value = null

  const ranges = getParagraphRanges(russianText.value)
  const range = ranges[index]
  if (!range) return

  nextTick(() => {
    const el = russianTextareaRef.value
    if (!el) return

    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.focus({ preventScroll: true })
    el.setSelectionRange(range.start, range.end)

    const before = russianText.value.slice(0, range.start)
    const lineCount = before.split('\n').length - 1
    const computedStyle = window.getComputedStyle(el)
    const lineHeight = parseFloat(computedStyle.lineHeight) || Number(fontSize.value) * 1.4
    el.scrollTop = Math.max(0, lineCount * lineHeight - el.clientHeight / 2)
  })

  showToastMessage('Paragraph selected in the editor above.', 'info')
}

const copyParagraph = async (index) => {
  const block = comparisonData.value[index]
  if (!block?.raw) return

  try {
    await navigator.clipboard.writeText(block.raw)
    showToastMessage('📋 Paragraph copied!')
  } catch (error) {
    console.error('Copy failed:', error)
    showToastMessage('Failed to copy paragraph.', 'error')
  }
  closeParagraphMenu()
}

// ---------- Lifecycle ----------
onMounted(() => {
  resumeArticle.value = getResumeArticle()
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
  clearTimeout(toastTimeout)
})

const handleDeleteArticle = (articleId) => {
  deleteArticle(articleId)
}
const handleDeleteAllArticles = () => {
  deleteAllArticles()
}

// ---------- Settings ----------
const settings = computed(() => ({
  fontSize: Number(fontSize.value),
  selectedFont: selectedFont.value,
  showRomanization: showRomanization.value,
  showEnglish: showEnglish.value,
  showRussian: showRussian.value,
  displayOrder: displayOrder.value,
  romanizationFontSize: romanizationFontSize.value,
  englishFontSize: englishFontSize.value,
}))

const openSettingsModal = () => {
  isSettingsModalOpen.value = true
}
const requestClearAll = () => {
  if (russianText.value.trim() || englishText.value.trim()) showConfirmModal.value = true
}
const confirmClearAll = () => {
  clearText('both')
  clearCurrentArticle()
  showConfirmModal.value = false
}
const cancelClearAll = () => {
  showConfirmModal.value = false
}
const closeSettingsModal = () => {
  isSettingsModalOpen.value = false
}

const saveSettings = (newSettings) => {
  fontSize.value = newSettings.fontSize
  selectedFont.value = newSettings.selectedFont
  showRomanization.value = newSettings.showRomanization
  showEnglish.value = newSettings.showEnglish
  showRussian.value = newSettings.showRussian
  displayOrder.value = newSettings.displayOrder
  romanizationFontSize.value = newSettings.romanizationFontSize
  englishFontSize.value = newSettings.englishFontSize
}

const resetToDefaults = () => {
  resetSettings()
  closeSettingsModal()
}
const openEditModal = (type) => {
  editModalType.value = type
  isEditModalOpen.value = true
}
const closeEditModal = () => {
  isEditModalOpen.value = false
}

const saveEditModalContent = (newContent) => {
  if (editModalType.value === 'russian') {
    russianText.value = normalizeParagraphBreaks(newContent)
  } else {
    englishText.value = stripEnglishArticles(newContent)
  }
  closeEditModal()
}

// ---------- Clipboard ----------
const pasteFromClipboard = async (target = null) => {
  isLoading.value = true
  loadingText.value = 'Pasting from clipboard...'
  try {
    await new Promise((resolve) => setTimeout(resolve, 80))
    const clipboardText = await navigator.clipboard.readText()
    const targetType = target || 'russian'

    if (targetType === 'russian') {
      russianText.value = normalizeParagraphBreaks(clipboardText)
    } else {
      englishText.value = stripEnglishArticles(clipboardText)
    }

    resumeArticle.value = null
    await nextTick()

    if (paragraphCountMismatch.value) {
      showToastMessage(
        `Paragraph count mismatch: Russian has ${russianParagraphCount.value}, English has ${englishParagraphCount.value}.`,
        'error',
      )
    }
  } catch (error) {
    console.error('Failed to read clipboard: ', error)
    showToastMessage('Could not read the clipboard. Please paste manually.', 'error')
  } finally {
    isLoading.value = false
  }
}

const clearText = (type = 'both') => {
  if (type === 'russian' || type === 'both') russianText.value = ''
  if (type === 'english' || type === 'both') englishText.value = ''
  if (type === 'both') {
    cancelAutoSave()
    currentBookmark.value = null
    pendingBookmark.value = null
    focusedParagraph.value = null
    closeParagraphMenu()
  }
}

const clearOrPasteText = (type) => {
  const text = type === 'russian' ? russianText.value : englishText.value
  if (text.trim()) clearText(type)
  else pasteFromClipboard(type)
}

// When comparisonData recomputes (fresh parse), satisfy pending bookmark scroll
watch(comparisonData, async () => {
  if (pendingBookmark.value !== null) {
    const target = pendingBookmark.value
    pendingBookmark.value = null
    await nextTick()
    scrollToBookmark(target)
  }
})
</script>

<style scoped>
/* ============================================================
   Ice / liquid-glass theme
   ============================================================ */

.converter-wrapper {
  width: 100%;
  min-height: 100vh;
  background: transparent;
}

/* App Header */
.app-header {
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(22px) saturate(170%);
  -webkit-backdrop-filter: blur(22px) saturate(170%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.75);
  box-shadow: 0 1px 0 rgba(14, 116, 144, 0.06), 0 10px 30px rgba(56, 155, 220, 0.07);
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.logo-mark {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: linear-gradient(140deg, #0f4f83 0%, #2c9be6 58%, #7dd3fc 100%);
  box-shadow: 0 8px 20px rgba(44, 155, 230, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.45);
  flex-shrink: 0;
}

.logo {
  font-size: 20px;
  font-weight: 650;
  letter-spacing: -0.01em;
  background: var(--gradient-logo);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  white-space: nowrap;
}

.logo-lang {
  font-weight: 600;
  opacity: 0.9;
}

.header-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Save Button */
.save-icon-btn {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.55);
  cursor: pointer;
  padding: 8px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: var(--text-muted);
  position: relative;
}

.save-icon-btn:hover:not(:disabled) {
  background: var(--p-100);
  color: var(--primary-dark);
  transform: translateY(-1px) scale(1.03);
  box-shadow: 0 8px 18px rgba(58, 166, 240, 0.16);
}

.save-icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.save-spinner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid var(--p-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.history-icon-btn,
.settings-icon-btn,
.info-icon-btn {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.55);
  cursor: pointer;
  padding: 8px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: var(--text-muted);
}

.history-icon-btn:hover {
  background: var(--p-100);
  color: var(--primary-dark);
  transform: translateY(-1px) scale(1.03);
}

.settings-icon-btn:hover {
  background: var(--p-100);
  color: var(--primary-dark);
  transform: rotate(90deg) scale(1.03);
}

.info-icon-btn:hover {
  background: #fff7ed;
  color: #c2740b;
  transform: translateY(-1px) scale(1.03);
}

/* Toast notification */
.toast {
  position: fixed;
  top: 82px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 22px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 500;
  z-index: 3000;
  box-shadow: 0 18px 50px rgba(15, 79, 131, 0.16);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.7);
  animation: slideDown 0.3s ease;
  max-width: min(92vw, 560px);
  text-align: center;
}

.toast-success {
  color: #0f7a55;
  border-color: rgba(16, 185, 129, 0.22);
}

.toast-error {
  color: #b42318;
  border-color: rgba(239, 68, 68, 0.24);
}

.toast-info {
  color: var(--primary-dark);
  border-color: rgba(58, 166, 240, 0.24);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-16px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* ============================================================
   Resume banner
   ============================================================ */

.resume-banner {
  width: calc(100% - 32px);
  max-width: 1168px;
  margin: 18px auto 0;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-radius: var(--radius-lg);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.82) 0%,
    rgba(232, 246, 255, 0.72) 100%
  );
  backdrop-filter: blur(22px) saturate(170%);
  -webkit-backdrop-filter: blur(22px) saturate(170%);
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 16px 40px rgba(37, 137, 201, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
  z-index: 20;
}

.resume-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  background: linear-gradient(140deg, #1f86d6 0%, #54b7f3 100%);
  box-shadow: 0 8px 18px rgba(44, 155, 230, 0.24);
}

.resume-copy {
  flex: 1;
  min-width: 0;
}

.resume-copy strong {
  display: block;
  color: var(--text);
  font-size: 14px;
  font-weight: 650;
  margin-bottom: 2px;
}

.resume-copy p {
  margin: 0;
  color: var(--text-light);
  font-size: 13px;
  line-height: 1.45;
}

.resume-copy em {
  color: var(--primary-dark);
  font-style: normal;
  font-weight: 600;
}

.resume-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.resume-primary,
.resume-dismiss {
  border-radius: 9px;
  font-size: 13px;
  font-weight: 600;
  padding: 9px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.resume-primary {
  color: #fff;
  border: 1px solid transparent;
  background: var(--gradient-btn);
  box-shadow: 0 8px 18px rgba(31, 134, 214, 0.22);
}

.resume-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgba(31, 134, 214, 0.28);
}

.resume-dismiss {
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(58, 166, 240, 0.14);
}

.resume-dismiss:hover {
  background: rgba(255, 255, 255, 0.9);
  color: var(--primary-dark);
}

.resume-enter-active,
.resume-leave-active {
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.resume-enter-from,
.resume-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ============================================================
   Inputs
   ============================================================ */

.main-content {
  display: block;
}

.input-display-row {
  margin: 20px auto;
  padding: 5px;
  display: block;
  width: 100%;
  max-width: 1200px;
}

.text-section {
  width: 100%;
  padding: 14px;
  margin: 0 1rem 20px;
  border-radius: var(--radius-lg);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.66) 0%,
    rgba(238, 248, 255, 0.52) 100%
  );
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.78);
  box-shadow: 0 10px 30px rgba(37, 137, 201, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  box-sizing: border-box;
  width: calc(100% - 2rem);
}

.input-label-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
}

.input-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--primary-dark);
}

.input-meta {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-light);
  white-space: nowrap;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.text-input,
.english-input {
  width: 100%;
  min-height: 44px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(58, 166, 240, 0.16);
  border-radius: var(--radius-md);
  font-size: 14px;
  transition: all 0.2s ease;
  resize: vertical;
  font-family: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  box-sizing: border-box;
  color: var(--text);
}

.english-input {
  min-height: 34px;
  padding: 9px;
}

.text-input:focus,
.english-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(58, 166, 240, 0.12);
  background: rgba(255, 255, 255, 0.9);
}

.text-input::placeholder,
.english-input::placeholder {
  color: var(--p-400);
  opacity: 0.7;
}

.action-btn {
  padding: 8px 20px;
  margin-top: 9px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.62);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(58, 166, 240, 0.15);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--p-100);
  border-color: var(--primary);
  color: var(--primary-dark);
  transform: translateY(-1px);
}

.edit-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(58, 166, 240, 0.16);
  border-radius: var(--radius-sm);
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: var(--text-muted);
  z-index: 10;
}

.edit-btn:hover {
  background: var(--p-100);
  border-color: var(--primary);
  color: var(--primary-dark);
  transform: scale(1.05);
}

.article-note {
  margin: 8px 0 0;
  font-size: 11px;
  color: var(--text-light);
  opacity: 0.9;
}

/* Count mismatch warning */
.paragraph-warning {
  max-width: 1168px;
  margin: 0 auto 16px;
  padding: 12px 16px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border-radius: var(--radius-md);
  background: rgba(255, 247, 237, 0.78);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid rgba(245, 158, 11, 0.28);
  color: #9a5b06;
  box-shadow: 0 10px 26px rgba(180, 120, 20, 0.08);
}

.paragraph-warning p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}

.paragraph-warning strong {
  color: #7a4500;
}

/* ============================================================
   Reader
   ============================================================ */

.quick-actions {
  max-width: 1200px;
  margin: 20px auto;
  padding: 0 1rem;
  text-align: center;
}

.clear-all-btn {
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  background: var(--r-100);
  border: 1px solid var(--r-200);
  border-radius: var(--radius-sm);
  color: var(--r-600);
  cursor: pointer;
  transition: all 0.2s ease;
}

.clear-all-btn:hover {
  background: var(--r-200);
  transform: translateY(-1px);
}

.relative {
  position: relative;
}

.comparison-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  overflow-x: hidden;
}

.comparison-display {
  max-width: 100%;
  width: 100%;
  overflow-x: hidden;
}

.comparison-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 28px;
  width: 100%;
  overflow-x: hidden;
}

.line-container {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.74) 0%,
    rgba(240, 249, 255, 0.58) 100%
  );
  backdrop-filter: blur(20px) saturate(165%);
  -webkit-backdrop-filter: blur(20px) saturate(165%);
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 0;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 14px 36px rgba(37, 137, 201, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.85);
  width: 100%;
  overflow-x: auto;
  word-wrap: break-word;
  word-break: break-word;
  transition: all 0.28s ease;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.line-container:hover {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.86) 0%,
    rgba(234, 247, 255, 0.68) 100%
  );
  box-shadow: 0 18px 44px rgba(37, 137, 201, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  border-color: rgba(125, 211, 252, 0.5);
}

.line-container.is-focused {
  border-color: rgba(58, 166, 240, 0.55);
  box-shadow: 0 18px 46px rgba(58, 166, 240, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(229, 245, 255, 0.75) 100%
  );
}

.paragraph-topline {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 9px;
  padding-right: 34px;
  min-height: 20px;
}

.lang-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1.4;
}

.lang-badge-ru {
  color: #0f5f96;
  background: rgba(186, 230, 253, 0.55);
  border: 1px solid rgba(125, 211, 252, 0.5);
}

.lang-badge-en {
  color: #475569;
  background: rgba(226, 232, 240, 0.6);
  border: 1px solid rgba(203, 213, 225, 0.65);
}

.word-count {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.03em;
  color: var(--text-light);
  opacity: 0.95;
}

.text-line {
  display: block;
  word-wrap: break-word;
  white-space: normal;
  overflow-wrap: break-word;
}

/* Russian word + romanization underneath */
.line-words {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 5px 10px;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  line-height: 1.25;
}

.word-group {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  max-width: 100%;
  padding: 1px 0;
}

.russian-word {
  display: inline-block;
  font-weight: 450;
  color: var(--text);
  white-space: nowrap;
  line-height: 1.25;
}

.romanization-below {
  display: block;
  margin-top: 1px;
  color: var(--primary-dark);
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: 1.2;
  opacity: 0.68;
  font-family: 'Inter', 'Noto Sans', system-ui, sans-serif;
  white-space: nowrap;
  text-align: center;
}

/* Bookmark button */
.bookmark-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #8aa4b8;
  transition: all 0.2s ease;
  z-index: 5;
}

.bookmark-btn:hover {
  background: var(--p-100);
  color: var(--primary);
  transform: scale(1.1);
}

.bookmark-btn.is-active {
  color: var(--primary);
  background: var(--p-100);
  border-color: rgba(58, 166, 240, 0.3);
}

/* ⋮ menu button — top-right of the focused paragraph */
.paragraph-menu-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #8aa4b8;
  transition: all 0.2s ease;
  z-index: 5;
}

.paragraph-menu-btn:hover {
  background: var(--p-100);
  color: var(--primary);
  transform: scale(1.1);
}

/* Teleported menu (rendered into <body>) */
.paragraph-menu--teleported {
  position: fixed;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(22px) saturate(170%);
  -webkit-backdrop-filter: blur(22px) saturate(170%);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  box-shadow: 0 18px 44px rgba(15, 79, 131, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.9);
  padding: 5px;
  z-index: 1500;
  min-width: 210px;
}

.paragraph-menu-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  text-align: left;
  padding: 8px 11px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  color: #33546b;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  font-family: inherit;
}

.paragraph-menu-item:hover {
  background: var(--p-100);
  color: var(--primary-dark);
}

/* English translation box */
.english-translation-box {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.6) 0%,
    rgba(241, 245, 249, 0.5) 100%
  );
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border-radius: var(--radius-md);
  padding: 13px 16px;
  margin-bottom: 0;
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 10px 26px rgba(37, 137, 201, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.english-text {
  color: var(--text-secondary);
  line-height: 1.65;
  font-family: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--primary-dark);
  font-style: italic;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-lg);
}

/* ============================================================
   Responsive
   ============================================================ */

@media (max-width: 768px) {
  .app-header {
    padding: 8px 14px;
  }

  .logo {
    font-size: 17px;
  }

  .logo-mark {
    width: 30px;
    height: 30px;
    border-radius: 9px;
  }

  .header-buttons {
    gap: 4px;
  }

  .save-icon-btn,
  .history-icon-btn,
  .settings-icon-btn,
  .info-icon-btn {
    padding: 7px;
  }

  .resume-banner {
    flex-wrap: wrap;
    gap: 10px;
    padding: 12px;
    width: calc(100% - 20px);
  }

  .resume-copy {
    flex-basis: calc(100% - 54px);
  }

  .resume-actions {
    width: 100%;
    padding-left: 50px;
  }

  .resume-primary,
  .resume-dismiss {
    flex: 1;
    padding: 9px 10px;
  }

  .input-display-row {
    margin: 10px auto;
  }

  .text-section {
    padding: 11px;
    margin-bottom: 14px;
    width: calc(100% - 1rem);
  }

  .comparison-section {
    padding: 0 0.5rem;
  }

  .comparison-block {
    gap: 9px;
    margin-bottom: 20px;
  }

  .line-container {
    padding: 12px;
  }

  .line-words {
    gap: 4px 8px;
  }

  .toast {
    top: 70px;
    font-size: 12px;
    padding: 10px 14px;
    max-width: 92%;
  }

  .paragraph-warning {
    width: calc(100% - 20px);
    padding: 11px 12px;
  }
}

@media (max-width: 480px) {
  .logo {
    font-size: 15px;
  }

  .logo-mark {
    display: none;
  }

  .line-words {
    gap: 3px 7px;
  }

  .line-container {
    padding: 10px;
  }

  .english-text {
    font-size: 0.95em !important;
  }

  .romanization-below {
    opacity: 0.75;
  }

  .input-label-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .toast,
  .resume-enter-active,
  .resume-leave-active {
    animation: none;
    transition: none;
  }
}

/* Fallback when backdrop-filter is unavailable */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .app-header,
  .text-section,
  .line-container,
  .english-translation-box,
  .resume-banner,
  .paragraph-menu--teleported {
    background: rgba(255, 255, 255, 0.96);
  }
}
</style>
