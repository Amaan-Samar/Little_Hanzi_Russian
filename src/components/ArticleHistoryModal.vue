<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/10 backdrop-blur-md animate-fadeIn"
      @click="handleOverlayClick"
    >
      <div
        class="history-modal bg-white/85 backdrop-blur-xl rounded-2xl w-[85%] max-w-[620px] max-h-[82vh] flex flex-col shadow-2xl border border-white/60 animate-slideUp"
        :class="{ 'w-[95%] max-h-[88vh]': isMobile }"
        @click.stop
      >
        <!-- Floating Close Button -->
        <button
          class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg border border-gray-100/50 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-xl hover:bg-gray-50 z-10"
          @click="close"
        >
          <X :size="16" class="text-gray-500" />
        </button>

        <!-- Tabs -->
        <div class="flex gap-1.5 px-5 pt-5 pb-3 border-b border-sky-100/70 flex-shrink-0">
          <button
            class="history-tab"
            :class="{ 'is-active': activeTab === 'reading' }"
            @click="activeTab = 'reading'"
          >
            <BookMarked :size="14" />
            <span>Reading</span>
            <span class="tab-count">{{ unfinishedArticles.length }}</span>
          </button>
          <button
            class="history-tab"
            :class="{ 'is-active': activeTab === 'all' }"
            @click="activeTab = 'all'"
          >
            <Library :size="14" />
            <span>All articles</span>
            <span class="tab-count">{{ articles.length }}</span>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-5 pt-4 scrollbar-thin scrollbar-thumb-sky-100 scrollbar-track-transparent">
          <!-- Empty states -->
          <div v-if="visibleArticles.length === 0" class="text-center py-14 px-4">
            <template v-if="activeTab === 'reading'">
              <BookMarked :size="42" class="mx-auto text-sky-300" />
              <p class="mt-4 text-sm font-semibold text-slate-600">No unfinished reads</p>
              <p class="text-xs text-slate-400 mt-1 max-w-[320px] mx-auto leading-relaxed">
                Bookmark a paragraph while reading and it will wait for you here.
              </p>
              <button
                v-if="articles.length"
                class="mt-4 text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
                @click="activeTab = 'all'"
              >
                Browse all articles →
              </button>
            </template>
            <template v-else>
              <BookOpen :size="42" class="mx-auto text-sky-300" />
              <p class="mt-4 text-sm font-semibold text-slate-600">No saved articles yet</p>
              <p class="text-xs text-slate-400 mt-1">Articles you read will appear here.</p>
            </template>
          </div>

          <div v-else class="space-y-3">
            <!-- Header -->
            <div class="flex justify-between items-center pb-2 border-b border-sky-100/60">
              <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {{ visibleArticles.length }}
                {{ visibleArticles.length === 1 ? 'article' : 'articles' }}
              </span>
              <button
                v-if="articles.length > 0"
                @click="confirmDeleteAll"
                class="text-xs text-slate-400 hover:text-red-500 transition-colors duration-200 flex items-center gap-1"
              >
                <Trash2 :size="14" />
                Delete All
              </button>
            </div>

            <!-- Article cards -->
            <div class="space-y-3">
              <div
                v-for="article in visibleArticles"
                :key="article.id"
                class="group relative bg-white/55 rounded-xl border border-sky-100/70 transition-all duration-200 hover:border-sky-300 hover:shadow-md hover:bg-white/85"
                :class="{ 'border-sky-300 bg-sky-50/60 shadow-sm': isCurrentArticle(article.id) }"
              >
                <div class="p-4 pr-12 cursor-pointer" @click="selectArticle(article)">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <h3 class="text-sm font-semibold text-slate-800 leading-tight mb-1.5 line-clamp-2">
                        {{ article.title }}
                      </h3>

                      <!-- Russian content -->
                      <p class="text-xs text-slate-700 leading-relaxed mb-1">
                        <span class="text-[10px] font-bold text-sky-500 uppercase tracking-wider mr-1">RU</span>
                        {{ truncateText(article.russianContent, 64) }}
                      </p>

                      <!-- English content -->
                      <p class="text-xs text-slate-500 leading-relaxed">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">EN</span>
                        {{ truncateText(article.englishContent, 84) }}
                      </p>
                    </div>

                    <span class="text-[10px] text-slate-400 whitespace-nowrap pt-0.5 flex-shrink-0">
                      {{ formatDate(article.timestamp) }}
                    </span>
                  </div>

                  <div class="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      v-if="hasBookmark(article)"
                      class="text-[10px] text-sky-700 font-semibold flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-100/80 border border-sky-200/70"
                    >
                      <Bookmark :size="10" fill="currentColor" />
                      Continue at paragraph {{ article.bookmark + 1 }}
                    </span>
                    <span v-else class="text-[10px] text-slate-400 font-medium">
                      No bookmark
                    </span>

                    <span
                      v-if="needsTruncation(article.russianContent, 64) || needsTruncation(article.englishContent, 84)"
                      class="text-[10px] text-sky-500 font-medium"
                    >
                      Read more →
                    </span>
                  </div>
                </div>

                <!-- Delete Button -->
                <button
                  @click="confirmDeleteArticle(article.id)"
                  class="absolute top-3 right-3 w-7 h-7 rounded-full bg-transparent hover:bg-red-50 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110"
                  title="Delete article"
                >
                  <Trash2 :size="14" class="text-slate-300 group-hover:text-red-400 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 pt-0 flex justify-end flex-shrink-0">
          <button
            class="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors duration-200 px-4 py-2"
            @click="close"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmModal
      :isOpen="showConfirmModal"
      :title="confirmModalTitle"
      :message="confirmModalMessage"
      :confirmText="confirmModalConfirmText"
      cancelText="Cancel"
      @confirm="handleConfirmDelete"
      @cancel="cancelDelete"
    />
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { X, BookOpen, BookMarked, Bookmark, Library, Trash2 } from 'lucide-vue-next'
import ConfirmModal from './ConfirmModal.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  articles: {
    type: Array,
    default: () => [],
  },
  isCurrentArticle: {
    type: Function,
    default: () => false,
  },
  formatDate: {
    type: Function,
    default: () => '',
  },
})

const emit = defineEmits(['close', 'load-article', 'delete-article', 'delete-all'])

const activeTab = ref('reading') // 'reading' | 'all'
const isMobile = ref(false)
const showConfirmModal = ref(false)
const pendingDeleteId = ref(null)
const pendingDeleteAll = ref(false)

const confirmModalTitle = ref('')
const confirmModalMessage = ref('')
const confirmModalConfirmText = ref('')

const hasBookmark = (article) =>
  article.bookmark !== null && article.bookmark !== undefined

const unfinishedArticles = computed(() => props.articles.filter(hasBookmark))

// In "All articles", unfinished reads stay at the top.
const sortedAllArticles = computed(() =>
  [...props.articles].sort((a, b) => {
    const aUnfinished = hasBookmark(a) ? 1 : 0
    const bUnfinished = hasBookmark(b) ? 1 : 0
    if (aUnfinished !== bUnfinished) return bUnfinished - aUnfinished
    return b.timestamp - a.timestamp
  }),
)

const visibleArticles = computed(() =>
  activeTab.value === 'reading' ? unfinishedArticles.value : sortedAllArticles.value,
)

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const handleOverlayClick = () => {
  close()
}

const close = () => {
  emit('close')
}

const truncateText = (text, maxLength) => {
  if (!text) return 'No content available'
  const cleaned = text.replace(/\n/g, ' ').trim()
  if (cleaned.length <= maxLength) return cleaned
  return cleaned.substring(0, maxLength) + '...'
}

const needsTruncation = (text, maxLength) => {
  if (!text) return false
  const cleaned = text.replace(/\n/g, ' ').trim()
  return cleaned.length > maxLength
}

const selectArticle = (article) => {
  emit('load-article', article)
  close()
}

const confirmDeleteArticle = (articleId) => {
  pendingDeleteId.value = articleId
  pendingDeleteAll.value = false
  confirmModalTitle.value = 'Delete Article'
  confirmModalMessage.value =
    'Are you sure you want to delete this article from your history?'
  confirmModalConfirmText.value = 'Yes, Delete'
  showConfirmModal.value = true
}

const confirmDeleteAll = () => {
  pendingDeleteAll.value = true
  pendingDeleteId.value = null
  confirmModalTitle.value = 'Delete All Articles'
  confirmModalMessage.value =
    'Are you sure you want to delete ALL articles from your history? This action cannot be undone.'
  confirmModalConfirmText.value = 'Yes, Delete All'
  showConfirmModal.value = true
}

const handleConfirmDelete = () => {
  if (pendingDeleteAll.value) {
    emit('delete-all')
  } else if (pendingDeleteId.value) {
    emit('delete-article', pendingDeleteId.value)
  }
  showConfirmModal.value = false
  pendingDeleteId.value = null
  pendingDeleteAll.value = false
}

const cancelDelete = () => {
  showConfirmModal.value = false
  pendingDeleteId.value = null
  pendingDeleteAll.value = false
}

const handleEscape = (e) => {
  if (e.key === 'Escape' && props.isOpen && !showConfirmModal.value) {
    close()
  }
}

// Unfinished reads are the default tab every time the history opens.
watch(
  () => props.isOpen,
  (open) => {
    if (open) activeTab.value = 'reading'
  },
)

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
/* Animation keyframes */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-fadeIn {
  animation: fadeIn 0.25s ease;
}

.animate-slideUp {
  animation: slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.history-modal {
  position: relative;
  background:
    linear-gradient(150deg, rgba(255, 255, 255, 0.86) 0%, rgba(238, 248, 255, 0.78) 100%);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow:
    0 30px 80px rgba(15, 79, 131, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

/* Tabs */
.history-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 11px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.history-tab:hover {
  background: rgba(224, 242, 254, 0.6);
  color: #0c75b8;
}

.history-tab.is-active {
  background: linear-gradient(135deg, rgba(224, 242, 254, 0.95), rgba(240, 249, 255, 0.9));
  border-color: rgba(125, 211, 252, 0.7);
  color: #0b6aa5;
  box-shadow: 0 6px 16px rgba(58, 166, 240, 0.1);
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.16);
  color: inherit;
  font-size: 10px;
  font-weight: 700;
}

.history-tab.is-active .tab-count {
  background: rgba(58, 166, 240, 0.15);
}

/* Line clamping for titles */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Custom scrollbar */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(58, 166, 240, 0.22);
  border-radius: 20px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(58, 166, 240, 0.35);
}

.scrollbar-thin {
  scrollbar-width: thin;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .w-\[95\%\] {
    width: 95%;
  }

  .max-h-\[88vh\] {
    max-height: 88vh;
  }

  .history-tab {
    flex: 1;
    justify-content: center;
    padding: 7px 8px;
  }
}

/* Smooth hover transitions */
.group {
  transition: all 0.2s ease;
}

/* Floating close button hover */
.absolute.-top-3.-right-3 {
  box-shadow: 0 4px 12px rgba(15, 79, 131, 0.1);
}
</style>
