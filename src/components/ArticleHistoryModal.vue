<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/25 backdrop-blur-sm animate-fadeIn"
      @click="handleOverlayClick"
    >
      <div
        class="history-modal bg-white rounded-2xl w-[85%] max-w-[680px] max-h-[84vh] flex flex-col shadow-xl border border-gray-200 animate-slideUp"
        :class="{ 'w-[95%] max-h-[90vh]': isMobile }"
        @click.stop
      >
        <!-- Floating Close Button -->
        <button
          class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-xl hover:bg-gray-50 z-10"
          @click="close"
        >
          <X :size="16" class="text-gray-500" />
        </button>

        <!-- Tabs -->
        <div class="history-tabs px-4 pt-4 pb-2 border-b border-gray-200 flex-shrink-0">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="history-tab"
            :class="{ 'is-active': activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <component :is="tab.icon" :size="14" />
            <span>{{ tab.label }}</span>
            <span class="tab-count">{{ tab.count }}</span>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-5 pt-4 scrollbar-thin scrollbar-track-transparent">
          <!-- Empty states -->
          <div v-if="visibleArticles.length === 0" class="text-center py-14 px-4">
            <component
              :is="activeTabConfig.emptyIcon"
              :size="42"
              class="mx-auto text-sky-300"
            />
            <p class="mt-4 text-sm font-semibold text-slate-600">
              {{ activeTabConfig.emptyTitle }}
            </p>
            <p class="text-xs text-slate-400 mt-1 max-w-[340px] mx-auto leading-relaxed">
              {{ activeTabConfig.emptyDetail }}
            </p>
          </div>

          <div v-else class="space-y-3">
            <!-- Header -->
            <div class="flex justify-between items-center gap-3 pb-2 border-b border-gray-200">
              <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {{ visibleArticles.length }}
                {{ visibleArticles.length === 1 ? 'article' : 'articles' }}
                <span class="normal-case tracking-normal font-medium text-slate-400">
                  · {{ readCount }} read · {{ unreadCount }} unread
                </span>
              </span>
              <button
                v-if="articles.length > 0"
                @click="confirmDeleteAll"
                class="text-xs text-slate-400 hover:text-red-500 transition-colors duration-200 flex items-center gap-1 flex-shrink-0"
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
                class="group relative bg-white rounded-xl border border-gray-200 transition-all duration-200 hover:border-sky-300 hover:shadow-md"
                :class="{ 'border-sky-300 bg-sky-50/40 shadow-sm': isCurrentArticle(article.id) }"
              >
                <div class="p-4 pr-28 cursor-pointer" @click="selectArticle(article)">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <h3 class="text-sm font-semibold text-slate-800 leading-tight mb-1.5 line-clamp-2">
                        <span
                          v-if="!article.read"
                          class="inline-block w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5 align-middle"
                          aria-label="Unread"
                        ></span>
                        {{ article.title }}
                      </h3>

                      <p class="text-xs text-slate-700 leading-relaxed mb-1">
                        <span class="text-[10px] font-bold text-sky-500 uppercase tracking-wider mr-1">RU</span>
                        {{ truncateText(article.russianContent, 72) }}
                      </p>

                      <p class="text-xs text-slate-500 leading-relaxed">
                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">EN</span>
                        {{ truncateText(article.englishContent, 90) }}
                      </p>
                    </div>

                    <span class="text-[10px] text-slate-400 whitespace-nowrap pt-0.5 flex-shrink-0">
                      {{ formatDate(article.timestamp) }}
                    </span>
                  </div>

                  <div class="mt-2 flex flex-wrap items-center gap-1.5">
                    <span v-if="!article.read" class="badge badge-unread">Unread</span>
                    <span
                      v-if="getLikeCount(article) > 0"
                      class="badge badge-like"
                      :title="`${getLikeCount(article)} liked paragraph${getLikeCount(article) === 1 ? '' : 's'}`"
                    >
                      <Heart :size="10" fill="currentColor" />
                      {{ getLikeCount(article) }}
                    </span>
                    <span v-if="article.sharedBy" class="badge badge-shared">
                      <Share2 :size="10" />
                      Shared by {{ article.sharedBy }}
                    </span>
                    <span v-if="article.archived" class="badge badge-muted">
                      <Archive :size="10" />
                      Archived
                    </span>
                    <span
                      v-if="hasBookmark(article)"
                      class="badge badge-bookmark"
                    >
                      <Bookmark :size="10" fill="currentColor" />
                      Continue at paragraph {{ article.bookmark + 1 }}
                    </span>
                    <span
                      v-if="needsTruncation(article.russianContent, 72) || needsTruncation(article.englishContent, 90)"
                      class="text-[10px] text-sky-500 font-medium"
                    >
                      Read more →
                    </span>
                  </div>
                </div>

                <!-- Hover actions -->
                <div class="article-actions absolute top-2.5 right-2.5 flex items-center gap-1">
                  <button
                    @click.stop="$emit('share-article', article)"
                    class="card-action"
                    title="Share article"
                  >
                    <Share2 :size="14" />
                  </button>
                  <button
                    @click.stop="$emit('toggle-archive', article.id)"
                    class="card-action"
                    :title="article.archived ? 'Unarchive article' : 'Archive article'"
                  >
                    <ArchiveRestore v-if="article.archived" :size="14" />
                    <Archive v-else :size="14" />
                  </button>
                  <button
                    @click.stop="confirmDeleteArticle(article.id)"
                    class="card-action card-action-danger"
                    title="Delete article"
                  >
                    <Trash2 :size="14" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 pt-2 flex items-center justify-between gap-2 flex-shrink-0 border-t border-gray-100">
          <div class="flex items-center gap-1 min-w-0">
            <button class="backup-link" @click="$emit('import-file')">
              <FileUp :size="15" />
              Open shared file
            </button>
            <button class="backup-link" @click="$emit('open-backup')">
              <Database :size="15" />
              Backup &amp; sync
            </button>
          </div>
          <button
            class="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors duration-200 px-4 py-2 flex-shrink-0"
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
import {
  X,
  BookOpen,
  BookMarked,
  Bookmark,
  Library,
  Trash2,
  Heart,
  Share2,
  Archive,
  ArchiveRestore,
  CircleDot,
  Database,
  FileUp,
} from 'lucide-vue-next'
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
  getLikeCount: {
    type: Function,
    default: () => 0,
  },
})

const emit = defineEmits([
  'close',
  'load-article',
  'delete-article',
  'delete-all',
  'share-article',
  'toggle-archive',
  'open-backup',
  'import-file',
])

const activeTab = ref('reading') // reading | unread | liked | shared | all | archived
const isMobile = ref(false)
const showConfirmModal = ref(false)
const pendingDeleteId = ref(null)
const pendingDeleteAll = ref(false)

const confirmModalTitle = ref('')
const confirmModalMessage = ref('')
const confirmModalConfirmText = ref('')

const hasBookmark = (article) =>
  article.bookmark !== null && article.bookmark !== undefined

const unfinishedArticles = computed(() =>
  props.articles.filter((article) => hasBookmark(article) && !article.archived),
)

const unreadArticles = computed(() =>
  props.articles.filter((article) => !article.read && !article.archived),
)

const likedArticles = computed(() =>
  props.articles
    .filter((article) => props.getLikeCount(article) > 0 && !article.archived)
    .sort(
      (a, b) =>
        props.getLikeCount(b) - props.getLikeCount(a) ||
        b.timestamp - a.timestamp,
    ),
)

const sharedArticles = computed(() =>
  props.articles
    .filter((article) => article.sharedBy && !article.archived)
    .sort(
      (a, b) =>
        (b.sharedAt || b.timestamp) - (a.sharedAt || a.timestamp),
    ),
)

const allArticles = computed(() =>
  [...props.articles]
    .filter((article) => !article.archived)
    .sort((a, b) => b.timestamp - a.timestamp),
)

const archivedArticles = computed(() =>
  [...props.articles]
    .filter((article) => article.archived)
    .sort((a, b) => b.timestamp - a.timestamp),
)

const readCount = computed(
  () => props.articles.filter((article) => article.read && !article.archived).length,
)
const unreadCount = computed(() => unreadArticles.value.length)

const tabs = computed(() => [
  {
    id: 'reading',
    label: 'Reading',
    icon: BookMarked,
    count: unfinishedArticles.value.length,
  },
  {
    id: 'unread',
    label: 'Unread',
    icon: CircleDot,
    count: unreadArticles.value.length,
  },
  {
    id: 'liked',
    label: 'Liked',
    icon: Heart,
    count: likedArticles.value.length,
  },
  {
    id: 'shared',
    label: 'Shared',
    icon: Share2,
    count: sharedArticles.value.length,
  },
  {
    id: 'all',
    label: 'All',
    icon: Library,
    count: allArticles.value.length,
  },
  {
    id: 'archived',
    label: 'Archived',
    icon: Archive,
    count: archivedArticles.value.length,
  },
])

const activeTabConfig = computed(() => {
  switch (activeTab.value) {
    case 'reading':
      return {
        emptyIcon: BookMarked,
        emptyTitle: 'No unfinished reads',
        emptyDetail: 'Bookmark a paragraph while reading and it will wait for you here.',
      }
    case 'unread':
      return {
        emptyIcon: CircleDot,
        emptyTitle: 'Nothing unread',
        emptyDetail: 'Articles you have not opened yet, including shared ones, appear here.',
      }
    case 'liked':
      return {
        emptyIcon: Heart,
        emptyTitle: 'No liked paragraphs yet',
        emptyDetail: 'Tap the heart on any paragraph you enjoy; articles are ranked by likes.',
      }
    case 'shared':
      return {
        emptyIcon: Share2,
        emptyTitle: 'No shared articles',
        emptyDetail: 'Articles a friend sends you appear here with their name.',
      }
    case 'archived':
      return {
        emptyIcon: Archive,
        emptyTitle: 'No archived articles',
        emptyDetail: 'Archive articles to keep your main reading list tidy.',
      }
    default:
      return {
        emptyIcon: BookOpen,
        emptyTitle: 'No saved articles yet',
        emptyDetail: 'Articles you read or import will appear here.',
      }
  }
})

const visibleArticles = computed(() => {
  switch (activeTab.value) {
    case 'reading':
      return unfinishedArticles.value
    case 'unread':
      return unreadArticles.value
    case 'liked':
      return likedArticles.value
    case 'shared':
      return sharedArticles.value
    case 'archived':
      return archivedArticles.value
    default:
      return allArticles.value
  }
})

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
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
}

/* Tabs */
.history-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}

.history-tabs::-webkit-scrollbar {
  display: none;
}

.history-tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 11px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.18s ease;
  flex-shrink: 0;
}

.history-tab:hover {
  background: var(--surface-muted);
  color: var(--text);
}

.history-tab.is-active {
  background: var(--p-50);
  border-color: var(--p-200);
  color: var(--p-700);
  box-shadow: var(--shadow-sm);
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
  background: rgba(43, 143, 216, 0.15);
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 999px;
  border: 1px solid transparent;
  white-space: nowrap;
}

.badge-unread {
  color: var(--p-700);
  background: var(--p-50);
  border-color: var(--p-200);
}

.badge-like {
  color: #be123c;
  background: #fff1f2;
  border-color: #fecdd3;
}

.badge-shared {
  color: var(--p-700);
  background: var(--p-50);
  border-color: var(--p-200);
}

.badge-bookmark {
  color: var(--p-700);
  background: var(--p-50);
  border-color: var(--p-200);
}

.badge-muted {
  color: var(--text-muted);
  background: var(--surface-muted);
  border-color: var(--border);
}

/* Card actions */
.article-actions {
  opacity: 1;
}

.card-action {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  background: var(--surface);
  color: var(--text-light);
  cursor: pointer;
  transition: all 0.18s ease;
}

.card-action:hover {
  background: var(--surface-muted);
  border-color: var(--border);
  color: var(--primary-dark);
}

.card-action-danger:hover {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.backup-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.backup-link:hover {
  background: var(--surface-muted);
  border-color: var(--border);
  color: var(--text);
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
  background: rgba(100, 116, 139, 0.24);
  border-radius: 20px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 116, 139, 0.4);
}

.scrollbar-thin {
  scrollbar-width: thin;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .w-\[95\%\] {
    width: 95%;
  }

  .max-h-\[90vh\] {
    max-height: 90vh;
  }

  .history-tab {
    padding: 7px 9px;
  }

  .p-4.pr-28 {
    padding-right: 1rem;
  }

  .article-actions {
    position: static;
    padding: 0 1rem 0.9rem;
    justify-content: flex-end;
  }
}

/* Smooth hover transitions */
.group {
  transition: all 0.2s ease;
}
</style>
