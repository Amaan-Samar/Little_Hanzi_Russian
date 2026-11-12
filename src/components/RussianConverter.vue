<template>
  <div class="converter-wrapper" @dragover.prevent @drop.prevent="handleFileDrop">
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

        <button
          class="share-icon-btn"
          @click="shareCurrentArticle"
          title="Share this article"
          :disabled="!russianText.trim()"
        >
          <Share2 :size="20" />
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
      :getLikeCount="getLikeCount"
      @close="closeHistoryModal"
      @load-article="loadArticleIntoEditor"
      @delete-article="handleDeleteArticle"
      @delete-all="handleDeleteAllArticles"
      @share-article="openShareModal"
      @toggle-archive="handleToggleArchive"
      @open-backup="openBackupModal"
      @import-file="handleImportBackup"
    />

    <!-- Share Modal -->
    <ShareModal
      :isOpen="isShareModalOpen"
      :article="shareTarget"
      :displayName="displayName"
      @close="closeShareModal"
      @save-name="handleSaveDisplayName"
    />

    <!-- Backup Modal -->
    <BackupModal
      :isOpen="isBackupModalOpen"
      :backupSupported="backupSupported"
      :backupStatus="backupStatus"
      :backupFileName="backupFileName"
      :backupLastSaved="backupLastSaved"
      :articleCount="articles.length"
      @close="closeBackupModal"
      @choose-backup="handleChooseBackup"
      @reconnect-backup="handleReconnectBackup"
      @disable-backup="handleDisableBackup"
      @download-backup="handleDownloadBackup"
      @import-backup="handleImportBackup"
      @export-share="handleExportShareLibrary"
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
              <div class="paragraph-actions">
                <button
                  class="paragraph-like-btn"
                  :class="{ 'is-liked': isLikedParagraph(sentenceId) }"
                  @click.stop="toggleLike(sentenceId)"
                  :title="
                    isLikedParagraph(sentenceId)
                      ? 'Remove like from this paragraph'
                      : 'Like this paragraph'
                  "
                >
                  <Heart
                    :size="14"
                    :fill="isLikedParagraph(sentenceId) ? 'currentColor' : 'none'"
                  />
                </button>

                <button
                  v-if="currentBookmark === sentenceId"
                  class="bookmark-btn is-active"
                  @click.stop="toggleBookmark(sentenceId)"
                  title="Remove bookmark"
                >
                  <Bookmark :size="14" fill="currentColor" />
                </button>

                <button
                  v-if="focusedParagraph === sentenceId && currentBookmark !== sentenceId"
                  class="paragraph-menu-btn"
                  @click.stop="toggleParagraphMenu(sentenceId, $event)"
                  title="More actions"
                >
                  <MoreVertical :size="14" />
                </button>
              </div>

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
  Share2,
  Heart,
} from 'lucide-vue-next'

import ArticleHistoryModal from './ArticleHistoryModal.vue'
import EditModal from './EditModal.vue'
import ConfirmModal from './ConfirmModal.vue'
import SettingsModal from './SettingsModal.vue'
import InfoModal from './InfoModal.vue'
import LoadingSpinner from './LoadingSpinner.vue'
import ShareModal from './ShareModal.vue'
import BackupModal from './BackupModal.vue'

import { useArticleHistory } from '../composables/useArticleHistory'
import { useSettings } from '../composables/useSettings'
import { useBackup } from '../composables/useBackup'
import { tokenizeRussianParagraph } from '../utils/russianRomanizer'
import {
  makeBackupBundle,
  makeShareBundle,
  parseBundle,
  parseShareHash,
  downloadJson,
  contentSignature,
} from '../utils/sharePayload'
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
  displayName,
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
  markArticleRead,
  toggleParagraphLike,
  isParagraphLiked,
  getLikeCount,
  toggleArchived,
  importBundle,
} = useArticleHistory()

const {
  backupSupported,
  backupFileName,
  backupStatus,
  backupLastSaved,
  initBackup,
  chooseBackupFile,
  reconnectBackup,
  disableBackup,
  scheduleBackup,
  downloadBackup,
  pickImportFile,
} = useBackup()

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
const isShareModalOpen = ref(false)
const isBackupModalOpen = ref(false)
const shareTarget = ref(null)
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

// ---------- Sharing ----------
const shareCurrentArticle = () => {
  if (!russianText.value.trim()) return
  const current = currentArticleId.value
    ? articles.value.find((item) => item.id === currentArticleId.value)
    : null
  const firstLine = splitParagraphs(russianText.value)[0] || 'Untitled article'
  shareTarget.value = {
    ...(current || {}),
    title:
      current?.title ||
      (firstLine.length > 60 ? `${firstLine.slice(0, 60)}...` : firstLine),
    russianContent: russianText.value,
    englishContent: englishText.value,
  }
  isShareModalOpen.value = true
}

const openShareModal = (article) => {
  if (!article?.russianContent?.trim()) return
  shareTarget.value = article
  isShareModalOpen.value = true
}

const closeShareModal = () => {
  isShareModalOpen.value = false
}

const handleSaveDisplayName = (name) => {
  displayName.value = (name || '').slice(0, 40)
}

// ---------- Backup & sync ----------
const datedName = (prefix) => `${prefix}-${new Date().toISOString().slice(0, 10)}.json`

const backupData = () => makeBackupBundle(articles.value)

// Keep the durable backup file current whenever the library changes.
watch(articles, () => scheduleBackup(backupData), { deep: true })

const openBackupModal = () => {
  isBackupModalOpen.value = true
}

const closeBackupModal = () => {
  isBackupModalOpen.value = false
}

const handleChooseBackup = async () => {
  const result = await chooseBackupFile(backupData)
  if (result.ok) {
    showToastMessage(`Auto-backup connected to ${result.fileName}`)
  } else if (!result.canceled) {
    showToastMessage(result.error || 'Could not set up auto-backup.', 'error')
  }
}

const handleReconnectBackup = async () => {
  const result = await reconnectBackup(backupData)
  if (result.ok) showToastMessage('Auto-backup reconnected.')
  else showToastMessage(result.error || 'Could not reconnect the backup.', 'error')
}

const handleDisableBackup = async () => {
  await disableBackup()
  showToastMessage('Auto-backup disconnected.', 'info')
}

const handleDownloadBackup = () => {
  downloadBackup(backupData(), datedName('little-hanzi-russian-backup'))
  showToastMessage('Backup file downloaded.')
}

const importBundleText = (text, sourceName = '') => {
  const parsed = parseBundle(text)
  if (!parsed.ok) {
    showToastMessage(parsed.error, 'error')
    return false
  }

  const { added, merged } = importBundle(parsed.bundle)
  if (!added && !merged) {
    showToastMessage('Nothing new to import.', 'info')
    return true
  }

  showToastMessage(
    `Imported ${added} new ${added === 1 ? 'article' : 'articles'}` +
      (merged ? `, merged ${merged}.` : '.') +
      (sourceName ? ` (${sourceName})` : ''),
  )
  return true
}

const handleImportBackup = async () => {
  const picked = await pickImportFile()
  if (!picked.ok) {
    if (!picked.canceled) {
      showToastMessage(picked.error || 'Could not read that file.', 'error')
    }
    return
  }

  importBundleText(picked.text, picked.name)
}

const handleFileDrop = async (event) => {
  const file = event.dataTransfer?.files?.[0]
  if (!file) return

  if (!/\.json$/i.test(file.name) && file.type !== 'application/json') {
    showToastMessage('Drop a Little Hanzi .json file.', 'error')
    return
  }

  try {
    importBundleText(await file.text(), file.name)
  } catch (error) {
    console.error('Could not read dropped file:', error)
    showToastMessage('Could not read that file.', 'error')
  }
}

const handleExportShareLibrary = () => {
  const bundle = makeShareBundle(articles.value, displayName.value || 'A friend')
  downloadJson(bundle, datedName('little-hanzi-russian-library'))
  showToastMessage('Library bundle downloaded. Send it to a friend!')
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
  markArticleRead(article.id)

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

// ---------- Paragraph likes ----------
const isLikedParagraph = (paragraphIndex) => {
  if (!currentArticleId.value) return false
  return isParagraphLiked(currentArticleId.value, paragraphIndex)
}

const toggleLike = (paragraphIndex) => {
  if (!currentArticleId.value) {
    const article = createArticle(russianText.value, englishText.value)
    if (!article) return
  }
  if (!currentArticleId.value) return

  const liked = toggleParagraphLike(currentArticleId.value, paragraphIndex)
  showToastMessage(
    liked ? '❤️ Paragraph liked' : 'Like removed',
    liked ? 'success' : 'info',
  )
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

// ---------- Incoming shares ----------
const PENDING_EN_KEY = 'littleRussian_pendingEnglish'

const readPendingEnglish = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(PENDING_EN_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const writePendingEnglish = (pending) => {
  try {
    if (Object.keys(pending).length) {
      localStorage.setItem(PENDING_EN_KEY, JSON.stringify(pending))
    } else {
      localStorage.removeItem(PENDING_EN_KEY)
    }
  } catch {
    // Pending translations are a convenience; ignore storage failures.
  }
}

const handleIncomingShare = async () => {
  const shared = parseShareHash(window.location.hash)
  if (!shared) return false

  // Drop the payload from the address bar so a refresh never re-imports it.
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${window.location.search}`,
  )

  const hash = shared.contentHash
  const findRussianArticle = () =>
    articles.value.find(
      (article) => contentSignature(article.russianContent) === hash,
    )

  // ---- English half of a split share ----
  if (shared.part === 'en') {
    const target = findRussianArticle()

    if (!target) {
      const pending = readPendingEnglish()
      pending[hash] = {
        en: shared.englishContent,
        by: shared.sharedBy,
        at: shared.sharedAt,
      }
      writePendingEnglish(pending)
      showToastMessage(
        'English saved. Now scan the Russian QR to complete the article.',
        'info',
      )
      return true
    }

    if (String(target.englishContent || '').trim()) {
      await loadArticleIntoEditor(target)
      showToastMessage(
        `${shared.sharedBy} shared a translation you already have.`,
        'info',
      )
      return true
    }

    updateArticle(target.id, {
      englishContent: shared.englishContent,
      sharedBy: target.sharedBy || shared.sharedBy,
      sharedAt: target.sharedAt || shared.sharedAt,
    })
    await loadArticleIntoEditor(target)
    showToastMessage(`English translation received from ${shared.sharedBy}.`)
    return true
  }

  // ---- Full article or Russian half ----
  const isRussianOnly = shared.part === 'ru'
  const { added } = importBundle({
    articles: [{ ...shared, id: undefined }],
    sharedBy: shared.sharedBy,
  })

  const key = shared.russianContent.trim()
  const target = articles.value.find(
    (article) => (article.russianContent || '').trim() === key,
  )

  // The English code may have arrived before the Russian one.
  let mergedTranslation = false
  if (
    target &&
    !String(target.englishContent || '').trim() &&
    hash
  ) {
    const pending = readPendingEnglish()
    const entry = pending[hash]
    if (entry?.en) {
      updateArticle(target.id, {
        englishContent: entry.en,
        sharedBy: target.sharedBy || entry.by || shared.sharedBy,
      })
      delete pending[hash]
      writePendingEnglish(pending)
      mergedTranslation = true
    }
  }

  if (target) await loadArticleIntoEditor(target)

  if (isRussianOnly) {
    showToastMessage(
      mergedTranslation
        ? `Russian and English received from ${shared.sharedBy}.`
        : `Russian text received from ${shared.sharedBy}. Now scan the English QR.`,
    )
  } else {
    showToastMessage(
      added
        ? `Shared by ${shared.sharedBy}: article opened.`
        : `${shared.sharedBy} shared an article you already have.`,
    )
  }
  return true
}

// ---------- Lifecycle ----------
onMounted(async () => {
  const openedShare = await handleIncomingShare()
  if (!openedShare) resumeArticle.value = getResumeArticle()

  await initBackup()

  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('hashchange', handleIncomingShare)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('hashchange', handleIncomingShare)
  clearTimeout(toastTimeout)
})

const handleDeleteArticle = (articleId) => {
  deleteArticle(articleId)
}
const handleDeleteAllArticles = () => {
  deleteAllArticles()
}

const handleToggleArchive = (articleId) => {
  const archived = toggleArchived(articleId)
  showToastMessage(
    archived ? '🗄️ Article archived' : 'Article restored from archive',
    'info',
  )
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
  displayName: displayName.value,
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
  displayName.value = (newSettings.displayName || '').slice(0, 40)
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
   Clean icy theme — neutral surfaces, blue accents
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
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
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
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: var(--primary);
  box-shadow: var(--shadow-primary);
  flex-shrink: 0;
}

.logo {
  font-size: 20px;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--text);
  margin: 0;
  white-space: nowrap;
}

.logo-lang {
  font-weight: 600;
  color: var(--primary-dark);
}

.header-buttons {
  display: flex;
  gap: 4px;
  align-items: center;
}

/* Header icon buttons */
.save-icon-btn,
.share-icon-btn,
.history-icon-btn,
.settings-icon-btn,
.info-icon-btn {
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
  color: var(--text-muted);
  position: relative;
}

.save-icon-btn:hover:not(:disabled),
.share-icon-btn:hover:not(:disabled),
.history-icon-btn:hover,
.settings-icon-btn:hover,
.info-icon-btn:hover {
  background: var(--surface-muted);
  border-color: var(--border);
  color: var(--primary-dark);
}

.save-icon-btn:disabled,
.share-icon-btn:disabled {
  opacity: 0.35;
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

/* Toast notification */
.toast {
  position: fixed;
  top: 82px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 22px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  z-index: 3000;
  box-shadow: var(--shadow-lg);
  background: var(--surface);
  border: 1px solid var(--border);
  animation: slideDown 0.3s ease;
  max-width: min(92vw, 560px);
  text-align: center;
}

.toast-success {
  color: var(--g-800);
  border-color: var(--g-200);
}

.toast-error {
  color: var(--r-700);
  border-color: var(--r-200);
}

.toast-info {
  color: var(--primary-dark);
  border-color: var(--border-accent);
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
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 3px solid var(--primary);
  box-shadow: var(--shadow-sm);
  position: relative;
  z-index: 20;
}

.resume-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  background: var(--primary);
  box-shadow: var(--shadow-primary);
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
  background: var(--primary);
  box-shadow: var(--shadow-primary);
}

.resume-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-primary-hover);
}

.resume-dismiss {
  color: var(--text-secondary);
  background: var(--surface);
  border: 1px solid var(--border);
}

.resume-dismiss:hover {
  background: var(--surface-muted);
  color: var(--text);
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
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
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
  color: var(--text-secondary);
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
  min-height: 96px;
  padding: 12px;
  background: var(--surface-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 14px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
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
  min-height: 72px;
  padding: 9px;
}

.text-input:focus,
.english-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(43, 143, 216, 0.14);
  background: var(--surface);
}

.text-input::placeholder,
.english-input::placeholder {
  color: var(--text-light);
  opacity: 0.9;
}

.action-btn {
  padding: 8px 20px;
  margin-top: 9px;
  font-size: 13px;
  font-weight: 600;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.action-btn:hover {
  background: var(--surface-muted);
  border-color: var(--border-strong);
  color: var(--text);
}

.edit-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
  color: var(--text-muted);
  z-index: 10;
}

.edit-btn:hover {
  background: var(--surface-muted);
  border-color: var(--border-strong);
  color: var(--primary-dark);
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
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  box-shadow: var(--shadow-sm);
}

.paragraph-warning p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}

.paragraph-warning strong {
  color: #78350f;
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
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 0;
  border: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
  width: 100%;
  overflow-x: auto;
  word-wrap: break-word;
  word-break: break-word;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.line-container:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
}

.line-container.is-focused {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(43, 143, 216, 0.12), var(--shadow-md);
}

.paragraph-topline {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 9px;
  padding-right: 68px;
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
  color: var(--p-700);
  background: var(--p-100);
  border: 1px solid var(--p-200);
}

.lang-badge-en {
  color: var(--gray-600);
  background: var(--gray-100);
  border: 1px solid var(--gray-200);
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
  opacity: 0.82;
  font-family: 'Inter', 'Noto Sans', system-ui, sans-serif;
  white-space: nowrap;
  text-align: center;
}

/* Paragraph actions: like is always visible; bookmark/menu appear in context */
.paragraph-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 5;
}

.paragraph-like-btn,
.bookmark-btn,
.paragraph-menu-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-light);
  transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.paragraph-like-btn:hover,
.bookmark-btn:hover,
.paragraph-menu-btn:hover {
  background: var(--p-50);
  border-color: var(--border-accent);
  color: var(--primary);
}

.paragraph-like-btn.is-liked {
  color: #e11d48;
  background: #fff1f2;
  border-color: #fecdd3;
}

.paragraph-like-btn.is-liked:hover {
  color: #be123c;
  background: #ffe4e6;
}

.bookmark-btn.is-active {
  color: var(--primary);
  background: var(--p-50);
  border-color: var(--p-200);
}

/* Teleported menu (rendered into <body>) */
.paragraph-menu--teleported {
  position: fixed;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
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
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
  font-family: inherit;
}

.paragraph-menu-item:hover {
  background: var(--surface-muted);
  color: var(--text);
}

/* English translation box */
.english-translation-box {
  background: var(--surface-soft);
  border-radius: var(--radius-md);
  padding: 13px 16px;
  margin-bottom: 0;
  border: 1px solid var(--border);
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
  color: var(--text-muted);
  font-style: italic;
  background: var(--surface);
  border: 1px solid var(--border);
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
  .app-header {
    background: var(--surface);
  }
}
</style>
