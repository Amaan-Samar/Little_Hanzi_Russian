<template>
  <div class="converter-wrapper">
    <!-- Header with Logo and Settings -->
    <div class="app-header">
      <div class="logo-section">
        <h1 class="logo">Little Hanzi 한국어</h1>
      </div>
      <div class="header-buttons">
        <!-- Save Button -->
        <button
          class="save-icon-btn"
          @click="handleManualSave"
          title="Save Article"
          :disabled="!inputText.trim() || isSaving"
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

      <!-- Success Toast for Save -->
      <div v-if="showSaveToast" class="toast toast-success animate-slideDown">
        <span>{{ toastMessage }}</span>
      </div>

      <div class="input-display-row">
        <!-- Korean Text Input -->
        <div class="text-section" :style="{fontFamily: getFontFamily, fontSize: `${fontSize}px` }">
          <div class="input-wrapper">
            <textarea
              v-model="inputText"
              placeholder="Enter Korean text here..."
              class="text-input w-full"
            ></textarea>
            <button
              v-if="inputText.trim()"
              @click="openEditModal('korean')"
              class="edit-btn"
              title="Edit in popup"
            >
              <EditIcon :size="16" />
            </button>
          </div>
          <button @click="clearOrPasteText('korean')" class="action-btn">
            {{ inputText.trim() ? 'Clear' : 'Paste' }}
          </button>
        </div>

        <!-- English Translation Input -->
        <div class="text-section" :style="{fontSize: `${fontSize}px` }">
          <div class="input-wrapper">
            <textarea
              v-model="englishText"
              placeholder="Enter English translation here..."
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
        </div>
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

      <div v-if="inputText.trim() && (showEnglish || showKorean)" class="comparison-section">
        <div class="comparison-display relative">
          <div v-for="(block, sentenceId) in comparisonData" :key="sentenceId"
               class="comparison-block relative"
               :data-paragraph-index="sentenceId">

            <template v-if="displayOrder === 'en-kr'">
              <div v-if="showEnglish && englishSegments[sentenceId]" class="english-translation-box" :style="{ fontFamily: getFontFamily }">
                <div class="english-text" :style="{ fontSize: `${englishFontSize}px`, lineHeight: '1.6' }">
                  {{ englishSegments[sentenceId] }}
                </div>
              </div>

              <div
                v-if="showKorean"
                class="line-container"
                :class="{ 'is-focused': focusedParagraph === sentenceId }"
                :style="{ fontFamily: getFontFamily }"
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

                <template v-if="focusedParagraph === sentenceId && currentBookmark !== sentenceId">
                  <button
                    class="paragraph-menu-btn"
                    @click.stop="toggleParagraphMenu(sentenceId, $event)"
                    title="More actions"
                  >
                    <MoreVertical :size="14" />
                  </button>
                </template>

                <div class="text-line relative">
                  <div class="line-words" :style="{ fontSize: `${fontSize}px` }">
                    <span v-for="(wordData, wordIndex) in block.words" :key="wordIndex" class="word-group">
                      <span class="word-with-romanization">
                        <span class="romanization-above" :style="{ display: showRomanization ? 'flex' : 'none' }">
                          <span
                            v-for="(char, charIndex) in wordData.romanizedChars"
                            :key="charIndex"
                            class="romanization-char"
                            :style="{
                              fontSize: `${romanizationFontSize}px`,
                              minWidth: `${romanizationFontSize * 0.6}px`,
                              textAlign: 'center'
                            }"
                          >
                            {{ char }}
                          </span>
                        </span>
                        <span class="word" :style="{fontWeight: '400'}">
                          <span v-for="(char, charIndex) in wordData.koreanChars" :key="charIndex" class="korean-char">
                            {{ char }}
                          </span>
                        </span>
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </template>

            <template v-else>
              <div
                v-if="showKorean"
                class="line-container"
                :class="{ 'is-focused': focusedParagraph === sentenceId }"
                :style="{ fontFamily: getFontFamily }"
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

                <template v-if="focusedParagraph === sentenceId && currentBookmark !== sentenceId">
                  <button
                    class="paragraph-menu-btn"
                    @click.stop="toggleParagraphMenu(sentenceId, $event)"
                    title="More actions"
                  >
                    <MoreVertical :size="14" />
                  </button>
                </template>

                <div class="text-line relative">
                  <div class="line-words" :style="{ fontSize: `${fontSize}px` }">
                    <span v-for="(wordData, wordIndex) in block.words" :key="wordIndex" class="word-group">
                      <span class="word-with-romanization">
                        <span class="romanization-above" :style="{ display: showRomanization ? 'flex' : 'none' }">
                          <span
                            v-for="(char, charIndex) in wordData.romanizedChars"
                            :key="charIndex"
                            class="romanization-char"
                            :style="{
                              fontSize: `${romanizationFontSize}px`,
                              minWidth: `${romanizationFontSize * 0.6}px`,
                              textAlign: 'center'
                            }"
                          >
                            {{ char }}
                          </span>
                        </span>
                        <span class="word" :style="{fontWeight: '400'}">
                          <span v-for="(char, charIndex) in wordData.koreanChars" :key="charIndex" class="korean-char">
                            {{ char }}
                          </span>
                        </span>
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div v-if="showEnglish && englishSegments[sentenceId]" class="english-translation-box" :style="{ fontFamily: getFontFamily }">
                <div class="english-text" :style="{ fontSize: `${englishFontSize}px`, lineHeight: '1.6' }">
                  {{ englishSegments[sentenceId] }}
                </div>
              </div>
            </template>
          </div>

          <div v-if="inputText.trim()" class="quick-actions">
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

      <!-- Empty state when both English and Korean are hidden -->
      <div v-else-if="inputText.trim() && !showEnglish && !showKorean" class="empty-state">
        <p>Both English and Korean paragraphs are hidden. Enable them in settings.</p>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmModal
      :isOpen="showConfirmModal"
      title="Clear All Text"
      message="Are you sure you want to clear all Korean and English text? This action cannot be undone."
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
          Bookmark
        </button>
        <button
          class="paragraph-menu-item"
          @click.stop="copyParagraph(openMenuParagraph)"
        >
          Copy
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script>
import ArticleHistoryModal from './ArticleHistoryModal.vue';
import { useArticleHistory } from '../composables/useArticleHistory';
import {
  Edit as EditIcon, Settings, BookOpen, Save, Info,
  Bookmark, MoreVertical
} from 'lucide-vue-next';
import EditModal from './EditModal.vue';
import ConfirmModal from './ConfirmModal.vue';
import SettingsModal from './SettingsModal.vue';
import InfoModal from './InfoModal.vue';
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { romanize } from 'koroman';
import LoadingSpinner from './LoadingSpinner.vue';
import { useSettings } from '../composables/useSettings';

export default {
  components: {
    ArticleHistoryModal, EditModal, ConfirmModal, SettingsModal, InfoModal,
    LoadingSpinner, BookOpen, EditIcon, Settings, Save, Info, Bookmark, MoreVertical,
  },
  name: 'KoreanConverter',
  setup() {
    const {
      fontSize, selectedFont, showRomanization, showKorean, showEnglish,
      displayOrder, romanizationFontSize, englishFontSize,
      resetSettings
    } = useSettings()

    const {
      articles, currentArticleId,
      createArticle, updateArticle, setCurrentArticle, clearCurrentArticle, flushAutoSave,
      scheduleAutoSave, cancelAutoSave,
      deleteArticle, deleteAllArticles, isCurrentArticle, formatDate,
      isSaving, setBookmark
    } = useArticleHistory()

    const inputText = ref('');
    const englishText = ref('');
    const showConfirmModal = ref(false);
    const isSettingsModalOpen = ref(false);
    const isInfoModalOpen = ref(false);
    const isLoading = ref(false);
    const loadingText = ref('Processing...');
    const showSaveToast = ref(false);
    const toastMessage = ref('');
    let toastTimeout = null;

    const isEditModalOpen = ref(false)
    const editModalType = ref('korean')
    const editModalTitle = computed(() => editModalType.value === 'korean' ? 'Korean Text' : 'English Translation')
    const editModalContent = computed(() => editModalType.value === 'korean' ? inputText.value : englishText.value)

    const isHistoryModalOpen = ref(false)

    // Bookmark & paragraph menu state
    const currentBookmark = ref(null)
    const pendingBookmark = ref(null)
    const focusedParagraph = ref(null)
    const openMenuParagraph = ref(null)
    const menuPosition = ref(null)

    // ---------- Toast ----------
    const showSaveToastMessage = (message) => {
      toastMessage.value = message
      showSaveToast.value = true
      if (toastTimeout) clearTimeout(toastTimeout)
      toastTimeout = setTimeout(() => { showSaveToast.value = false }, 3000)
    }

    const handleManualSave = () => {
      if (!inputText.value.trim()) return

      let article
      if (currentArticleId.value) {
        flushAutoSave(inputText.value, englishText.value)
        article = updateArticle(currentArticleId.value, {
          koreanContent: inputText.value,
          englishContent: englishText.value,
        })
      } else {
        article = createArticle(inputText.value, englishText.value)
      }

      if (article) showSaveToastMessage('🌸 Article saved successfully!')
    }

    watch([inputText, englishText], ([newKo, newEn]) => {
      if (newKo && newKo.trim()) {
        scheduleAutoSave(newKo, newEn)
      } else {
        cancelAutoSave()
      }
    }, { deep: true })

    // ---------- Modals ----------
    const openHistoryModal = () => { isHistoryModalOpen.value = true }
    const closeHistoryModal = () => { isHistoryModalOpen.value = false }
    const openInfoModal = () => { isInfoModalOpen.value = true }
    const closeInfoModal = () => { isInfoModalOpen.value = false }

    const loadArticleIntoEditor = async (article) => {
      isLoading.value = true
      loadingText.value = 'Loading article...'
      await new Promise(resolve => setTimeout(resolve, 300))

      inputText.value = article.koreanContent || ''
      englishText.value = article.englishContent || ''
      currentBookmark.value = article.bookmark ?? null
      cancelAutoSave()
      setCurrentArticle(article.id)

      isLoading.value = false

      if (article.bookmark !== null && article.bookmark !== undefined) {
        if (comparisonData.value[article.bookmark]) {
          await nextTick()
          scrollToBookmark(article.bookmark)
        } else {
          pendingBookmark.value = article.bookmark
        }
      }
    }

    const scrollToBookmark = (paragraphIndex) => {
      const el = document.querySelector(`[data-paragraph-index="${paragraphIndex}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }

    // ---------- Bookmark toggle ----------
    const toggleBookmark = (paragraphIndex) => {
      if (!currentArticleId.value) {
        const article = createArticle(inputText.value, englishText.value)
        if (!article) return
      }
      if (!currentArticleId.value) return

      const nextBookmark =
        currentBookmark.value === paragraphIndex ? null : paragraphIndex
      currentBookmark.value = nextBookmark
      setBookmark(currentArticleId.value, nextBookmark)
    }

    // ---------- Paragraph focus & menu ----------
    const handleParagraphClick = (index) => {
      focusedParagraph.value = index
    }

    const toggleParagraphMenu = (index, event) => {
      if (openMenuParagraph.value === index) {
        openMenuParagraph.value = null
        menuPosition.value = null
        return
      }
      openMenuParagraph.value = index
      focusedParagraph.value = index

      const btn = event?.currentTarget
      if (btn) {
        const rect = btn.getBoundingClientRect()
        const MENU_WIDTH = 200
        const MENU_HEIGHT = 88
        const MARGIN = 8

        const left = Math.min(
          window.innerWidth - MENU_WIDTH - MARGIN,
          Math.max(MARGIN, rect.right - MENU_WIDTH)
        )

        const spaceBelow = window.innerHeight - rect.bottom
        const top = spaceBelow >= MENU_HEIGHT + MARGIN
          ? rect.bottom + 4
          : rect.top - MENU_HEIGHT - 4

        menuPosition.value = { top, left }
      }
    }

    const handleDocumentClick = (e) => {
      const inside = e.target.closest('.line-container, .paragraph-menu')
      if (!inside) {
        focusedParagraph.value = null
        openMenuParagraph.value = null
        menuPosition.value = null
      }
    }

    // ---------- Double-click / double-tap ----------
    const handleParagraphDoubleClick = (index) => {
      toggleBookmark(index)
    }

    let touchMoved = false
    let lastTapIndex = null
    let lastTapTime = 0
    const handleTouchStart = () => { touchMoved = false }
    const handleTouchMove = () => { touchMoved = true }
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
      openMenuParagraph.value = null
      menuPosition.value = null
    }

    const copyParagraph = async (index) => {
      // Korean comparisonData stores { words }, so re-join word tokens
      const block = comparisonData.value[index]
      if (!block?.words) return
      const plain = block.words.map(w => w.korean).join('')
      try {
        await navigator.clipboard.writeText(plain)
        showSaveToastMessage('📋 Paragraph copied!')
      } catch (err) {
        console.error('Copy failed:', err)
        showSaveToastMessage('Failed to copy')
      }
      openMenuParagraph.value = null
      menuPosition.value = null
    }

    // ---------- Lifecycle ----------
    onMounted(() => {
      document.addEventListener('click', handleDocumentClick)
    })
    onBeforeUnmount(() => {
      document.removeEventListener('click', handleDocumentClick)
      clearTimeout(toastTimeout)
    })

    const handleDeleteArticle = (articleId) => { deleteArticle(articleId) }
    const handleDeleteAllArticles = () => { deleteAllArticles() }

    const settings = computed(() => ({
      fontSize: Number(fontSize.value),
      selectedFont: selectedFont.value,
      showRomanization: showRomanization.value,
      showEnglish: showEnglish.value,
      showKorean: showKorean.value,
      displayOrder: displayOrder.value,
      romanizationFontSize: romanizationFontSize.value,
      englishFontSize: englishFontSize.value
    }))

    const openSettingsModal = () => { isSettingsModalOpen.value = true }
    const requestClearAll = () => { if (inputText.value.trim() || englishText.value.trim()) showConfirmModal.value = true }
    const confirmClearAll = () => {
      clearText('both')
      clearCurrentArticle()
      showConfirmModal.value = false
    }
    const cancelClearAll = () => { showConfirmModal.value = false }
    const closeSettingsModal = () => { isSettingsModalOpen.value = false }

    const saveSettings = (newSettings) => {
      fontSize.value = newSettings.fontSize
      selectedFont.value = newSettings.selectedFont
      showRomanization.value = newSettings.showRomanization
      showEnglish.value = newSettings.showEnglish
      showKorean.value = newSettings.showKorean
      displayOrder.value = newSettings.displayOrder
      romanizationFontSize.value = newSettings.romanizationFontSize
      englishFontSize.value = newSettings.englishFontSize
      closeSettingsModal()
    }

    const resetToDefaults = () => { resetSettings(); closeSettingsModal() }
    const openEditModal = (type) => { editModalType.value = type; isEditModalOpen.value = true }
    const closeEditModal = () => { isEditModalOpen.value = false }

    const saveEditModalContent = (newContent) => {
      if (editModalType.value === 'korean') inputText.value = newContent
      else englishText.value = newContent
      closeEditModal()
    }

    // Font configurations
    const fonts = {
      NotoSansSC: "'Noto Sans SC', 'Inter', sans-serif",
      NotoSerifSC: "'Noto Serif SC', 'Georgia', serif",
      Inter: "'Inter', 'Noto Sans SC', sans-serif",
      Roboto: "'Roboto', 'Noto Sans SC', sans-serif",
      Poppins: "'Poppins', 'Noto Sans SC', sans-serif",
      ZCOOLKuaiLe: "'ZCOOL KuaiLe', cursive",
      MaShanZheng: "'Ma Shan Zheng', cursive",
    };
    const getFontFamily = computed(() => fonts[selectedFont.value]);

    const breakEnglishText = (englishText, koreanSegments) => {
      if (!englishText.trim()) return {}
      const normalizedText = englishText.replace(/\r\n/g, '\n').replace(/\n\s*\n(\s*\n)*/g, '\n\n')
      const englishParagraphs = normalizedText.split(/\n\n/).map(p => p.trim()).filter(p => p)
      const result = {}
      const koreanSegmentKeys = koreanSegments ? Object.keys(koreanSegments) : []
      englishParagraphs.forEach((paragraph, index) => {
        if (index < koreanSegmentKeys.length) result[koreanSegmentKeys[index]] = paragraph
      })
      return result
    }

    const englishSegments = computed(() => breakEnglishText(englishText.value, comparisonData.value))

    const pasteFromClipboard = async (target = null) => {
      isLoading.value = true
      loadingText.value = 'Pasting from clipboard...'
      try {
        await new Promise(resolve => setTimeout(resolve, 100))
        const clipboardText = await navigator.clipboard.readText()
        const targetType = target || 'korean'
        if (targetType === 'korean') inputText.value = clipboardText
        else englishText.value = clipboardText
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error('Failed to read clipboard: ', error)
      } finally {
        isLoading.value = false
      }
    }

    const clearText = (type = 'both') => {
      if (type === 'korean' || type === 'both') inputText.value = ''
      if (type === 'english' || type === 'both') englishText.value = ''
      if (type === 'both') {
        cancelAutoSave()
        currentBookmark.value = null
        pendingBookmark.value = null
        focusedParagraph.value = null
        openMenuParagraph.value = null
        menuPosition.value = null
      }
    }

    const clearOrPasteText = (type) => {
      const text = type === 'korean' ? inputText.value : englishText.value
      if (text.trim()) clearText(type)
      else pasteFromClipboard(type)
    }

    // Korean word-based romanization
    const getWordsWithRomanization = (text) => {
      if (!text) return []
      const tokens = text.split(/(\s+|[.,!?;:()"'])/g).filter(t => t.trim() || t === ' ')
      const result = []
      let currentWord = ''
      for (const token of tokens) {
        if (token.trim() === '') {
          if (currentWord) { result.push(processWord(currentWord)); currentWord = '' }
          result.push({ korean: token, koreanChars: [], romanized: '', romanizedChars: [], isPunctuation: false })
        } else if (/[\uAC00-\uD7AF]/.test(token)) {
          if (currentWord) { result.push(processWord(currentWord)); currentWord = '' }
          result.push(processWord(token))
        } else if (/[.,!?;:()"']/.test(token)) {
          if (currentWord) { result.push(processWord(currentWord)); currentWord = '' }
          result.push({ korean: token, koreanChars: [token], romanized: token, romanizedChars: [token], isPunctuation: true })
        } else {
          currentWord += token
        }
      }
      if (currentWord) result.push(processWord(currentWord))
      return result
    }

    const processWord = (word) => {
      const koreanChars = [...word]
      const romanized = romanize(word, { usePronunciationRules: true, casingOption: 'lowercase' })
      const romanizedChars = koreanChars.map(char =>
        romanize(char, { usePronunciationRules: true, casingOption: 'lowercase' }) || ''
      )
      return {
        korean: word, koreanChars, romanized, romanizedChars, isPunctuation: false
      }
    }

    const comparisonData = computed(() => {
      if (!inputText.value) return {}
      const normalizedText = inputText.value
        .replace(/\r\n/g, '\n')
        .replace(/\n\s*\n(\s*\n)*/g, '\n\n')
      const koreanParagraphs = normalizedText.split(/\n\n/).map(p => p.trim()).filter(p => p)
      const result = {}
      koreanParagraphs.forEach((paragraph, index) => {
        result[index] = { words: getWordsWithRomanization(paragraph) }
      })
      return result
    })

    // When comparisonData recomputes (fresh parse), satisfy pending bookmark scroll
    watch(comparisonData, async () => {
      if (pendingBookmark.value !== null) {
        const target = pendingBookmark.value
        pendingBookmark.value = null
        await nextTick()
        scrollToBookmark(target)
      }
    })

    return {
      articles, currentArticleId, isHistoryModalOpen, openHistoryModal, closeHistoryModal,
      loadArticleIntoEditor, handleDeleteArticle, handleDeleteAllArticles,
      isCurrentArticle, formatDate,
      isInfoModalOpen, openInfoModal, closeInfoModal,
      inputText, englishText, selectedFont, fontSize,
      showRomanization, showKorean, showEnglish, displayOrder,
      romanizationFontSize, englishFontSize,
      isLoading, loadingText, isSaving, showSaveToast, toastMessage,
      getFontFamily, comparisonData, englishSegments, settings,
      clearOrPasteText, clearAllText: clearText, handleManualSave, showSaveToastMessage,
      EditIcon, Settings, Save, Info, Bookmark, MoreVertical,
      isEditModalOpen, editModalTitle, editModalContent, openEditModal, closeEditModal, saveEditModalContent,
      isSettingsModalOpen, openSettingsModal, closeSettingsModal, saveSettings, resetToDefaults,
      showConfirmModal, requestClearAll, confirmClearAll, cancelClearAll,
      currentBookmark, toggleBookmark,
      focusedParagraph, openMenuParagraph, menuPosition,
      handleParagraphClick, toggleParagraphMenu,
      handleParagraphDoubleClick,
      handleTouchStart, handleTouchMove, handleTouchEnd,
      copyParagraph, bookmarkFromMenu,
    };
  },
};
</script>

<style scoped>
/* App Header */
.app-header {
  position: sticky;
  top: 0;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  border-bottom: var(--border-primary-light);
  padding: 12px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo {
  font-size: 20px;
  font-weight: 600;
  background: var(--gradient-logo);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.header-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Save Button */
.save-icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: var(--text-muted);
  position: relative;
}

.save-icon-btn:hover:not(:disabled) {
  background: #dbeafe;
  color: #2563eb;
  transform: scale(1.05);
}

.save-icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.save-spinner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.history-icon-btn,
.settings-icon-btn,
.info-icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: var(--text-muted);
}

.history-icon-btn:hover {
  background: var(--p-100);
  transform: scale(1.05);
}

.settings-icon-btn:hover {
  background: var(--p-100);
  transform: rotate(90deg);
}

.info-icon-btn:hover {
  background: #fef3c7;
  color: #d97706;
  transform: scale(1.05);
}

/* Toast notification */
.toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  z-index: 3000;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(34, 197, 94, 0.2);
  color: #16a34a;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.main-content { display: block; }

.converter-wrapper {
  width: 100%;
  min-height: 100vh;
  background: var(--gradient-main);
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
  padding: 0 1rem;
  margin-bottom: 20px;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.text-input,
.english-input {
  width: 100%;
  min-height: 40px;
  padding: 12px;
  background: var(--bg-input);
  backdrop-filter: blur(10px);
  border: var(--border-primary-strong);
  border-radius: var(--radius-md);
  font-size: 14px;
  transition: all 0.2s;
  resize: vertical;
  font-family: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  box-sizing: border-box;
  color: var(--text);
}

.english-input { min-height: 30px; padding: 8px; }

.text-input:focus,
.english-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  background: rgba(255, 255, 255, 0.95);
}

.text-input::placeholder,
.english-input::placeholder {
  color: var(--p-400);
  opacity: 0.5;
}

.action-btn {
  padding: 8px 20px;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: var(--border-primary);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--p-100);
  border-color: var(--primary);
  color: var(--primary-dark);
}

.edit-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--bg-input);
  backdrop-filter: blur(10px);
  border: var(--border-primary);
  border-radius: var(--radius-sm);
  padding: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: var(--text-muted);
  z-index: 10;
}

.edit-btn:hover {
  background: var(--p-100);
  border-color: var(--primary);
  color: var(--primary-dark);
  transform: scale(1.05);
}

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
  transition: all 0.2s;
}

.clear-all-btn:hover {
  background: var(--r-200);
  transform: translateY(-1px);
}

/* Korean word-based romanization */
.line-words {
  text-wrap: wrap;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  line-height: 1.4;
}

.word-group {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  white-space: normal;
  margin: 0 1px;
}

.word-with-romanization {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
}

.romanization-above {
  display: flex;
  gap: 0px;
  justify-content: center;
  margin-bottom: 1px;
  flex-wrap: nowrap;
}

.romanization-char {
  color: var(--primary);
  font-weight: 400;
  letter-spacing: 0.5px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  display: inline-block;
  opacity: 0.7;
}

.word {
  display: inline-flex;
  font-weight: 400;
  color: var(--text);
  gap: 0px;
}

.korean-char {
  display: inline-block;
}

.english-translation-box {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  margin-bottom: 8px;
  border: var(--border-secondary);
}

.english-text {
  color: var(--g-800);
  line-height: 1.6;
  font-family: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--primary);
  font-style: italic;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
}

.relative { position: relative; }
.comparison-section { max-width: 1200px; margin: 0 auto; padding: 0 1rem; overflow-x: hidden; }
.comparison-display { max-width: 100%; width: 100%; overflow-x: hidden; }
.comparison-block { margin-bottom: 24px; width: 100%; overflow-x: hidden; }

.line-container {
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 12px;
  border: var(--border-primary-light);
  box-shadow: var(--shadow-primary);
  width: 100%;
  overflow-x: auto;
  word-wrap: break-word;
  word-break: break-word;
  transition: all 0.3s;
  position: relative;
}

.line-container:hover {
  background: rgba(255, 255, 255, 0.85);
  box-shadow: var(--shadow-primary-hover);
  border-color: rgba(139, 92, 246, 0.15);
}

.text-line {
  display: block;
  word-wrap: break-word;
  white-space: normal;
  overflow-wrap: break-word;
}

/* ===== Bookmark UX additions ===== */

/* Disable text selection on paragraphs — double-click is our gesture now */
.line-container {
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* Focused paragraph highlight */
.line-container.is-focused {
  border-color: var(--primary);
  box-shadow: 0 4px 24px rgba(139, 92, 246, 0.12);
  background: rgba(255, 255, 255, 0.85);
}

/* Bookmark button */
.bookmark-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.2s;
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
}

/* ⋮ menu button — top-right of the focused paragraph */
.paragraph-menu-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.2s;
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
  background: #fff;
  border: 1px solid rgba(139, 92, 246, 0.15);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 4px;
  z-index: 1500;
  min-width: 200px;
}

.paragraph-menu-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
  transition: background 0.15s;
  font-family: inherit;
}

.paragraph-menu-item:hover {
  background: var(--p-100);
  color: var(--primary);
}

/* Mobile specific fixes */
@media (max-width: 768px) {
  .app-header { padding: 8px 16px; }
  .logo { font-size: 18px; }
  .input-display-row { margin: 10px auto; }
  .text-section { padding: 0 0.5rem; }
  .comparison-section { padding: 0 0.5rem; }
  .line-container { padding: 12px; }
  .line-words { gap: 2px 4px; }
  .toast { top: 70px; font-size: 12px; padding: 10px 16px; max-width: 90%; }
}

/* For very small screens */
@media (max-width: 480px) {
  .line-words { gap: 1px 3px; }
  .line-container { padding: 8px; }
  .english-text { font-size: 0.9em; }
}
</style>