<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[3000] flex items-center justify-center bg-black/5 backdrop-blur-md animate-fadeIn" @click="handleOverlayClick">
      <div class="relative bg-white/85 backdrop-blur-xl rounded-2xl w-[90%] max-w-[700px] h-[80vh] max-h-[650px] flex flex-col animate-slideUp border border-white/50 shadow-2xl" :class="{ 'w-[95%] h-[85vh] max-h-none rounded-xl': isMobile }" @click.stop>
        
        <!-- Floating Close Button -->
        <button class="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full bg-white border border-black/5 cursor-pointer flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-gray-50 hover:border-black/10 text-gray-400 hover:text-gray-600 shadow-md hover:shadow-lg z-10" @click="close">
          <X :size="16" />
        </button>

        <!-- Header -->
        <div class="flex-shrink-0 px-6 pt-6 pb-4 border-b border-gray-100/50">
          <h3 class="m-0 text-base font-semibold text-gray-800">Edit {{ title }}</h3>
        </div>

        <!-- Body -->
        <div class="flex-1 p-5 overflow-hidden min-h-0">
          <textarea
            ref="textareaRef"
            v-model="editText"
            :placeholder="`Edit ${title} text...`"
            class="w-full h-full min-h-[200px] p-4 border border-gray-200/60 rounded-xl font-inherit leading-relaxed resize-none outline-none transition-all duration-200 bg-white/60 text-gray-700 focus:border-purple-400 focus:bg-white focus:shadow-purple-100/20 placeholder:text-gray-400"
            :style="{ fontSize: `${fontSize}px`, fontFamily: fontFamily }"
          ></textarea>
        </div>

        <!-- Footer -->
        <div class="flex-shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-100/50" :class="{ 'flex-col-reverse': isMobile }">
          <button class="px-6 py-2.5 rounded-xl font-medium cursor-pointer transition-all duration-200 text-sm bg-white/60 border border-gray-200/60 text-gray-500 hover:bg-gray-50 hover:border-gray-300" :class="{ 'w-full justify-center': isMobile }" @click="close">
            Cancel
          </button>
          <button class="px-6 py-2.5 rounded-xl font-medium cursor-pointer transition-all duration-200 text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white border-none hover:-translate-y-0.5 hover:shadow-purple-500/25" :class="{ 'w-full justify-center': isMobile }" @click="save">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  fontSize: {
    type: Number,
    default: 15
  },
  fontFamily: {
    type: String,
    default: "'Noto Sans SC', sans-serif"
  }
})

const emit = defineEmits(['close', 'save'])

const editText = ref(props.content)
const textareaRef = ref(null)
const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const handleOverlayClick = () => {
  close()
}

const close = () => {
  emit('close')
}

const save = () => {
  emit('save', editText.value)
  close()
}

// Handle escape key
const handleEscape = (e) => {
  if (e.key === 'Escape' && props.isOpen) {
    close()
  }
}

// Auto-focus textarea when opened
watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    editText.value = props.content
    await nextTick()
    if (textareaRef.value) {
      textareaRef.value.focus()
      textareaRef.value.select()
    }
  }
})

// Update editText when content prop changes
watch(() => props.content, (newVal) => {
  if (props.isOpen) {
    editText.value = newVal
  }
})

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

/* Textarea scrollbar styling */
textarea::-webkit-scrollbar {
  width: 6px;
}

textarea::-webkit-scrollbar-track {
  background: transparent;
}

textarea::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.08);
  border-radius: 20px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.15);
}

textarea {
  scrollbar-width: thin;
}

/* Focus ring for textarea */
textarea:focus {
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.06);
}

/* Mobile responsive overrides */
@media (max-width: 768px) {
  .w-\[95\%\] {
    width: 95%;
  }
  
  .h-\[85vh\] {
    height: 85vh;
  }
  
  .max-h-none {
    max-height: none;
  }
  
  .rounded-xl {
    border-radius: 16px;
  }
}

/* Smooth transitions for buttons */
button {
  transition: all 0.2s ease;
}

/* Gradient button hover shadow */
.hover\:shadow-purple-500\/25:hover {
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.25);
}
</style>