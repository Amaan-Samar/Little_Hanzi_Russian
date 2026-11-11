<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[2000] flex items-center justify-center bg-black/5 backdrop-blur-md animate-fadeIn" @click="handleOverlayClick">
      <div class="bg-white/90 backdrop-blur-xl rounded-2xl w-[85%] max-w-[600px] max-h-[80vh] flex flex-col shadow-2xl border border-white/20 animate-slideUp" :class="{ 'w-[95%] max-h-[85vh]': isMobile }" @click.stop>
        
        <!-- Floating Close Button -->
        <button class="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg border border-gray-100/50 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-xl hover:bg-gray-50 z-10" @click="close">
          <X :size="16" class="text-gray-500" />
        </button>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-6 pt-8 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <div v-if="articles.length === 0" class="text-center py-16">
            <BookOpen :size="40" class="mx-auto text-purple-300" />
            <p class="mt-4 text-sm font-medium text-gray-500">No saved articles yet</p>
            <p class="text-xs text-gray-400 mt-1">Articles you read will appear here</p>
          </div>

          <div v-else class="space-y-3">
            <!-- Header -->
            <div class="flex justify-between items-center pb-3 border-b border-gray-100">
              <span class="text-xs font-medium text-gray-400 uppercase tracking-wider">{{ articles.length }} article{{ articles.length === 1 ? '' : 's' }}</span>
              <button v-if="articles.length > 0" @click="confirmDeleteAll" class="text-xs text-gray-400 hover:text-red-500 transition-colors duration-200 flex items-center gap-1">
                <Trash2 :size="14" />
                Delete All
              </button>
            </div>

            <!-- Articles -->
            <div class="space-y-3">
              <div
                v-for="article in articles"
                :key="article.id"
                class="group relative bg-white/50 rounded-xl border border-gray-100/80 transition-all duration-200 hover:border-purple-200 hover:shadow-md hover:bg-white/80"
                :class="{ 'border-purple-300 bg-purple-50/50 shadow-sm': isCurrentArticle(article.id) }"
              >
                <!-- Article Content -->
                <div class="p-4 pr-12 cursor-pointer" @click="selectArticle(article)">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <h3 class="text-sm font-semibold text-gray-800 leading-tight mb-1.5 line-clamp-2">
                        {{ article.title }}
                      </h3>
                      
                      <!-- Korean Content -->
                      <p class="text-xs text-gray-700 leading-relaxed mb-1">
                        <span class="text-[10px] font-medium text-purple-400 uppercase tracking-wider mr-1">KR</span>
                        {{ truncateText(article.koreanContent, 60) }}
                      </p>
                      
                      <!-- English Content -->
                      <p class="text-xs text-gray-500 leading-relaxed">
                        <span class="text-[10px] font-medium text-gray-400 uppercase tracking-wider mr-1">EN</span>
                        {{ truncateText(article.englishContent, 80) }}
                      </p>
                    </div>
                    
                    <span class="text-[10px] text-gray-400 whitespace-nowrap pt-0.5 flex-shrink-0">
                      {{ formatDate(article.timestamp) }}
                    </span>
                    <div v-if="article.bookmark !== null && article.bookmark !== undefined" class="mt-1.5">
                      <span class="text-[10px] text-purple-500 font-medium flex items-center gap-1">
                        🔖 Bookmarked
                      </span>
                    </div>
                  </div>
                  
                  <!-- Read More Indicator -->
                  <div v-if="needsTruncation(article.koreanContent, 60) || needsTruncation(article.englishContent, 80)" class="mt-1.5">
                    <span class="text-[10px] text-purple-400 font-medium">Read more →</span>
                  </div>
                </div>

                <!-- Delete Button -->
                <button 
                  @click="confirmDeleteArticle(article.id)" 
                  class="absolute top-3 right-3 w-7 h-7 rounded-full bg-transparent hover:bg-red-50 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110"
                  title="Delete article"
                >
                  <Trash2 :size="14" class="text-gray-300 group-hover:text-red-400 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 pt-0 flex justify-end">
          <button class="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors duration-200 px-4 py-2" @click="close">
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
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { X, BookOpen, Trash2 } from 'lucide-vue-next'
import ConfirmModal from './ConfirmModal.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  articles: {
    type: Array,
    default: () => []
  },
  isCurrentArticle: {
    type: Function,
    default: () => false
  },
  formatDate: {
    type: Function,
    default: () => ''
  }
})

const emit = defineEmits(['close', 'load-article', 'delete-article', 'delete-all'])

const isMobile = ref(false)
const showConfirmModal = ref(false)
const pendingDeleteId = ref(null)
const pendingDeleteAll = ref(false)

const confirmModalTitle = ref('')
const confirmModalMessage = ref('')
const confirmModalConfirmText = ref('')

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
  confirmModalMessage.value = 'Are you sure you want to delete this article from your history?'
  confirmModalConfirmText.value = 'Yes, Delete'
  showConfirmModal.value = true
}

const confirmDeleteAll = () => {
  pendingDeleteAll.value = true
  pendingDeleteId.value = null
  confirmModalTitle.value = 'Delete All Articles'
  confirmModalMessage.value = 'Are you sure you want to delete ALL articles from your history? This action cannot be undone.'
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
  from { opacity: 0; }
  to { opacity: 1; }
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
  background: rgba(0, 0, 0, 0.1);
  border-radius: 20px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .w-\[95\%\] {
    width: 95%;
  }
  
  .max-h-\[85vh\] {
    max-height: 85vh;
  }
}

/* Hide scrollbar for cleaner look */
.scrollbar-thin {
  scrollbar-width: thin;
}

/* Smooth hover transitions */
.group {
  transition: all 0.2s ease;
}

/* Current article indicator */
.border-purple-300 {
  border-color: rgba(139, 92, 246, 0.3);
}

.bg-purple-50\/50 {
  background: rgba(139, 92, 246, 0.05);
}

/* Floating close button hover */
.absolute.-top-3.-right-3 {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
</style>