<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[2000] flex items-center justify-center bg-black/5 backdrop-blur-md animate-fadeIn" @click="handleOverlayClick">
      <div class="relative bg-white/85 backdrop-blur-xl rounded-2xl w-[90%] max-w-[520px] max-h-[90vh] flex flex-col animate-slideUp border border-white/50 shadow-2xl" :class="{ 'w-[92%] max-h-[90vh] rounded-xl': isMobile }" @click.stop>
        
        <!-- Floating Close Button -->
        <button class="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full bg-white border border-black/5 cursor-pointer flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-gray-50 hover:border-black/10 text-gray-400 hover:text-gray-600 shadow-md hover:shadow-lg z-10" @click="close">
          <X :size="16" />
        </button>

        <div class="flex-1 overflow-y-auto p-6 pb-8 scrollbar-thin scrollbar-thumb-gray-200/50 scrollbar-track-transparent">
          
          <!-- Live Preview Section -->
          <div class="mb-6 bg-gradient-to-br from-purple-50/50 to-blue-50/50 rounded-xl p-4 border border-purple-100/50">
            <label class="block text-[11px] font-semibold text-purple-600 uppercase tracking-wider mb-3">Live Preview</label>
            <div class="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50">
              <!-- Korean with Romanization Preview -->
              <div class="mb-3" :style="{ fontFamily: getSelectedFontFamily() }">
                <div class="flex flex-col items-start">
                  <!-- Romanization above Korean -->
                  <div class="flex gap-0 mb-0.5" v-if="localSettings.showRomanization">
                    <span 
                      v-for="(char, index) in previewKoreanChars" 
                      :key="index"
                      class="text-purple-500 font-light"
                      :style="{ fontSize: `${Math.min(localSettings.romanizationFontSize, localSettings.fontSize)}px` }"
                    >
                      {{ getRomanizationForChar(char) }}
                    </span>
                  </div>
                  <!-- Korean text -->
                  <div class="flex gap-0 font-semibold" :style="{ fontSize: `${localSettings.fontSize}px` }">
                    <span v-for="(char, index) in previewKoreanChars" :key="index">
                      {{ char }}
                    </span>
                  </div>
                </div>
              </div>
              
              <!-- English Preview -->
              <div v-if="localSettings.showEnglish" class="mt-2 pt-2 border-t border-gray-100/50" :style="{ fontFamily: getSelectedFontFamily() }">
                <div :style="{ fontSize: `${Math.min(localSettings.englishFontSize, localSettings.fontSize)}px` }">
                  <span class="text-gray-700">Hello, this is a preview</span>
                </div>
              </div>
              
              <!-- Display order indicator -->
              <div class="mt-2 text-[10px] text-gray-400 flex items-center gap-2">
                <span class="font-medium">Order:</span>
                <span class="px-2 py-0.5 bg-gray-100 rounded-full">
                  {{ localSettings.displayOrder === 'kr-en' ? 'Korean → English' : 'English → Korean' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Korean Font Size -->
          <div class="mb-6 last:mb-0">
            <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Korean Font Size</label>
            <div class="flex items-center gap-3.5 mb-3.5">
              <button 
                class="w-9 h-9 rounded-full border border-black/5 bg-white cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-500 hover:bg-gray-50 hover:border-black/10 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                @click="decreaseFontSize"
                :disabled="localSettings.fontSize <= 12"
              >
                <Minus :size="16" />
              </button>
              <span class="text-lg font-semibold text-gray-800 min-w-[48px] text-center">{{ localSettings.fontSize }}</span>
              <button 
                class="w-9 h-9 rounded-full border border-black/5 bg-white cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-500 hover:bg-gray-50 hover:border-black/10 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                @click="increaseFontSize"
                :disabled="localSettings.fontSize >= 32"
              >
                <Plus :size="16" />
              </button>
            </div>
            <div class="flex gap-1.5 flex-wrap">
              <button
                v-for="size in fontSizePresets"
                :key="size"
                class="px-2.5 py-1 border border-black/5 rounded-md bg-white cursor-pointer text-xs font-medium transition-all duration-200 text-gray-500 hover:bg-gray-50 hover:border-black/10"
                :class="{ 'bg-gray-100 border-gray-300 text-gray-700 shadow-sm': localSettings.fontSize === size }"
                @click="setFontSize(size)"
              >
                {{ size }}
              </button>
            </div>
          </div>

          <!-- Romanization Font Size -->
          <div class="mb-6 last:mb-0">
            <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Romanization Size</label>
            <div class="flex items-center gap-3.5 mb-3.5">
              <button 
                class="w-9 h-9 rounded-full border border-black/5 bg-white cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-500 hover:bg-gray-50 hover:border-black/10 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                @click="decreaseRomanizationSize"
                :disabled="localSettings.romanizationFontSize <= 4"
              >
                <Minus :size="16" />
              </button>
              <span class="text-lg font-semibold text-gray-800 min-w-[48px] text-center">{{ localSettings.romanizationFontSize }}</span>
              <button 
                class="w-9 h-9 rounded-full border border-black/5 bg-white cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-500 hover:bg-gray-50 hover:border-black/10 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                @click="increaseRomanizationSize"
                :disabled="localSettings.romanizationFontSize >= localSettings.fontSize"
              >
                <Plus :size="16" />
              </button>
            </div>
            <div class="flex gap-1.5 flex-wrap">
              <button
                v-for="size in romanizationPresets"
                :key="size"
                class="px-2.5 py-1 border border-black/5 rounded-md bg-white cursor-pointer text-xs font-medium transition-all duration-200 text-gray-500 hover:bg-gray-50 hover:border-black/10"
                :class="{ 'bg-gray-100 border-gray-300 text-gray-700 shadow-sm': localSettings.romanizationFontSize === size }"
                @click="setRomanizationSize(size)"
              >
                {{ size }}
              </button>
            </div>
            <p class="text-xs text-gray-400 mt-2">Maximum: {{ localSettings.fontSize }}px (same as Korean)</p>
          </div>

          <!-- English Font Size -->
          <div class="mb-6 last:mb-0">
            <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">English Size</label>
            <div class="flex items-center gap-3.5 mb-3.5">
              <button 
                class="w-9 h-9 rounded-full border border-black/5 bg-white cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-500 hover:bg-gray-50 hover:border-black/10 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                @click="decreaseEnglishSize"
                :disabled="localSettings.englishFontSize <= 4"
              >
                <Minus :size="16" />
              </button>
              <span class="text-lg font-semibold text-gray-800 min-w-[48px] text-center">{{ localSettings.englishFontSize }}</span>
              <button 
                class="w-9 h-9 rounded-full border border-black/5 bg-white cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-500 hover:bg-gray-50 hover:border-black/10 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                @click="increaseEnglishSize"
                :disabled="localSettings.englishFontSize >= localSettings.fontSize"
              >
                <Plus :size="16" />
              </button>
            </div>
            <div class="flex gap-1.5 flex-wrap">
              <button
                v-for="size in englishPresets"
                :key="size"
                class="px-2.5 py-1 border border-black/5 rounded-md bg-white cursor-pointer text-xs font-medium transition-all duration-200 text-gray-500 hover:bg-gray-50 hover:border-black/10"
                :class="{ 'bg-gray-100 border-gray-300 text-gray-700 shadow-sm': localSettings.englishFontSize === size }"
                @click="setEnglishSize(size)"
              >
                {{ size }}
              </button>
            </div>
            <p class="text-xs text-gray-400 mt-2">Maximum: {{ localSettings.fontSize }}px (same as Korean)</p>
          </div>

          <!-- Font Family -->
          <div class="mb-6 last:mb-0">
            <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Font Family</label>
            <div class="relative font-select-wrapper">
              <button 
                class="w-full px-4 py-3 bg-white border border-black/5 rounded-lg flex justify-between items-center cursor-pointer transition-all duration-200 text-gray-600 text-sm hover:bg-gray-50 hover:border-black/10"
                :style="{ fontFamily: getSelectedFontFamily() }"
                @click="toggleFontDropdown"
              >
                <span>{{ getSelectedFontLabel() }}</span>
                <ChevronDown :size="16" class="transition-transform duration-200" :class="{ 'rotate-180': isFontDropdownOpen }" />
              </button>
              <div v-if="isFontDropdownOpen" class="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-black/5 rounded-lg max-h-[200px] overflow-y-auto z-10 shadow-lg animate-slideDown">
                <button
                  v-for="font in fontOptions"
                  :key="font.value"
                  class="w-full px-4 py-2.5 bg-transparent border-none text-left cursor-pointer transition-all duration-200 text-gray-600 text-sm hover:bg-purple-50"
                  :class="{ 'bg-purple-50/50 text-purple-700': localSettings.selectedFont === font.value }"
                  :style="{ fontFamily: font.fontFamily }"
                  @click="handleFontChange(font.value)"
                >
                  {{ font.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- Display Sections -->
          <div class="mb-6 last:mb-0">
            <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Display Sections</label>
            <div class="flex flex-col gap-3">
              <label class="flex items-center gap-3 cursor-pointer text-sm text-gray-600">
                <input type="checkbox" v-model="localSettings.showRomanization" class="w-4.5 h-4.5 cursor-pointer accent-purple-500" @change="handleShowRomanizationChange">
                <span>Romanization</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer text-sm text-gray-600">
                <input type="checkbox" v-model="localSettings.showKorean" class="w-4.5 h-4.5 cursor-pointer accent-purple-500" @change="handleShowKoreanChange">
                <span>Korean</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer text-sm text-gray-600">
                <input type="checkbox" v-model="localSettings.showEnglish" class="w-4.5 h-4.5 cursor-pointer accent-purple-500" @change="handleShowEnglishChange">
                <span>English</span>
              </label>
            </div>
          </div>

          <!-- Display Order -->
          <div class="mb-6 last:mb-0">
            <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Display Order</label>
            <div class="flex gap-6" :class="{ 'flex-col gap-3': isMobile }">
              <label class="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                <input type="radio" v-model="localSettings.displayOrder" value="en-kr" class="w-4.5 h-4.5 cursor-pointer accent-purple-500" @change="handleDisplayOrderChange">
                <span>English → Korean</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                <input type="radio" v-model="localSettings.displayOrder" value="kr-en" class="w-4.5 h-4.5 cursor-pointer accent-purple-500" @change="handleDisplayOrderChange">
                <span>Korean → English</span>
              </label>
            </div>
          </div>

          <div class="mt-2">
            <button class="w-full px-5 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 font-medium cursor-pointer transition-all duration-200 hover:bg-red-100 hover:-translate-y-0.5" @click="resetToDefaults">
              Reset to defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { X, Minus, Plus, ChevronDown } from 'lucide-vue-next'
import { romanize } from 'koroman'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  settings: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'save', 'reset'])

const localSettings = ref({ 
  fontSize: 18,
  selectedFont: 'NotoSansSC',
  showRomanization: true,
  showKorean: true,
  showEnglish: true,
  displayOrder: 'kr-en',
  romanizationFontSize: 10,
  englishFontSize: 14,
  ...props.settings 
})

const isMobile = ref(false)
const isFontDropdownOpen = ref(false)
const fontSizePresets = [12, 14, 16, 18, 20, 24, 28, 32]
const romanizationPresets = [4, 6, 8, 10, 12, 14, 16, 18]
const englishPresets = [6, 8, 10, 12, 14, 16, 18, 20]

const fontOptions = [
  { value: 'NotoSansSC', label: 'Noto Sans SC', fontFamily: "'Noto Sans SC', sans-serif" },
  { value: 'NotoSerifSC', label: 'Noto Serif SC', fontFamily: "'Noto Serif SC', serif" },
  { value: 'Inter', label: 'Inter', fontFamily: "'Inter', sans-serif" },
  { value: 'Roboto', label: 'Roboto', fontFamily: "'Roboto', sans-serif" },
  { value: 'Poppins', label: 'Poppins', fontFamily: "'Poppins', sans-serif" },
  { value: 'ZCOOLKuaiLe', label: 'ZCOOL KuaiLe', fontFamily: "'ZCOOL KuaiLe', cursive" },
  { value: 'MaShanZheng', label: 'Ma Shan Zheng', fontFamily: "'Ma Shan Zheng', cursive" }
]

// Preview Korean characters
const previewKoreanChars = ['안', '녕', '하', '세', '요']

// Helper function to get romanization for a character
const getRomanizationForChar = (char) => {
  try {
    return romanize(char, { 
      usePronunciationRules: true,
      casingOption: 'lowercase'
    })
  } catch {
    return char
  }
}

let fontSizeTimeout = null

const getSelectedFontLabel = () => {
  const font = fontOptions.find(f => f.value === localSettings.value.selectedFont)
  return font ? font.label : 'Noto Sans SC'
}

const getSelectedFontFamily = () => {
  const font = fontOptions.find(f => f.value === localSettings.value.selectedFont)
  return font ? font.fontFamily : "'Noto Sans SC', sans-serif"
}

const toggleFontDropdown = () => {
  isFontDropdownOpen.value = !isFontDropdownOpen.value
}

// Korean font size controls
const increaseFontSize = () => {
  if (localSettings.value.fontSize < 32) {
    localSettings.value.fontSize += 2
    emitSave()
  }
}

const decreaseFontSize = () => {
  if (localSettings.value.fontSize > 12) {
    localSettings.value.fontSize -= 2
    emitSave()
  }
}

const setFontSize = (size) => {
  localSettings.value.fontSize = size
  // Ensure romanization and English don't exceed the new Korean size
  if (localSettings.value.romanizationFontSize > size) {
    localSettings.value.romanizationFontSize = size
  }
  if (localSettings.value.englishFontSize > size) {
    localSettings.value.englishFontSize = size
  }
  emitSave()
}

// Romanization font size controls
const increaseRomanizationSize = () => {
  if (localSettings.value.romanizationFontSize < localSettings.value.fontSize) {
    localSettings.value.romanizationFontSize += 1
    emitSave()
  }
}

const decreaseRomanizationSize = () => {
  if (localSettings.value.romanizationFontSize > 4) {
    localSettings.value.romanizationFontSize -= 1
    emitSave()
  }
}

const setRomanizationSize = (size) => {
  if (size <= localSettings.value.fontSize) {
    localSettings.value.romanizationFontSize = size
    emitSave()
  }
}

// English font size controls
const increaseEnglishSize = () => {
  if (localSettings.value.englishFontSize < localSettings.value.fontSize) {
    localSettings.value.englishFontSize += 1
    emitSave()
  }
}

const decreaseEnglishSize = () => {
  if (localSettings.value.englishFontSize > 4) {
    localSettings.value.englishFontSize -= 1
    emitSave()
  }
}

const setEnglishSize = (size) => {
  if (size <= localSettings.value.fontSize) {
    localSettings.value.englishFontSize = size
    emitSave()
  }
}

const emitSave = () => {
  if (fontSizeTimeout) clearTimeout(fontSizeTimeout)
  fontSizeTimeout = setTimeout(() => {
    emit('save', localSettings.value)
  }, 50)
}

const handleFontChange = (fontValue) => {
  localSettings.value.selectedFont = fontValue
  isFontDropdownOpen.value = false
  emit('save', localSettings.value)
}

const handleShowRomanizationChange = () => {
  emit('save', localSettings.value)
}

const handleShowKoreanChange = () => {
  emit('save', localSettings.value)
}

const handleShowEnglishChange = () => {
  emit('save', localSettings.value)
}

const handleDisplayOrderChange = () => {
  emit('save', localSettings.value)
}

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const handleOverlayClick = () => {
  // Don't close on overlay click - user must click the close button
}

const close = () => {
  isFontDropdownOpen.value = false
  emit('close')
}

const resetToDefaults = () => {
  const defaults = {
    fontSize: 18,
    selectedFont: 'NotoSansSC',
    showRomanization: true,
    showKorean: true,
    showEnglish: true,
    displayOrder: 'kr-en',
    romanizationFontSize: 10,
    englishFontSize: 14
  }
  localSettings.value = { ...defaults }
  emit('reset')
  emit('save', localSettings.value)
}

const handleEscape = (e) => {
  if (e.key === 'Escape' && props.isOpen) {
    close()
  }
}

// Close font dropdown when clicking outside
const handleClickOutside = (e) => {
  if (isFontDropdownOpen.value) {
    const wrapper = document.querySelector('.font-select-wrapper')
    if (wrapper && !wrapper.contains(e.target)) {
      isFontDropdownOpen.value = false
    }
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    localSettings.value = { ...props.settings }
    isFontDropdownOpen.value = false
  }
})

watch(() => props.settings, (newVal) => {
  if (props.isOpen) {
    localSettings.value = { ...newVal }
  }
}, { deep: true })

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  document.addEventListener('keydown', handleEscape)
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('keydown', handleEscape)
  window.removeEventListener('click', handleClickOutside)
  if (fontSizeTimeout) clearTimeout(fontSizeTimeout)
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

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.25s ease;
}

.animate-slideUp {
  animation: slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.animate-slideDown {
  animation: slideDown 0.2s ease;
}

/* Custom scrollbar */
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.08);
  border-radius: 20px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.15);
}

.scrollbar-thin {
  scrollbar-width: thin;
}

/* Custom checkbox and radio styles using accent-color */
input[type="checkbox"],
input[type="radio"] {
  accent-color: #8B5CF6;
}

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .w-\[92\%\] {
    width: 92%;
  }
  
  .max-h-\[90vh\] {
    max-height: 90vh;
  }
  
  .rounded-xl {
    border-radius: 16px;
  }
}

/* Smooth hover transitions for buttons */
button {
  transition: all 0.2s ease;
}

/* Font dropdown custom scroll */
.font-dropdown::-webkit-scrollbar {
  width: 4px;
}

.font-dropdown::-webkit-scrollbar-track {
  background: transparent;
}

.font-dropdown::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.08);
  border-radius: 20px;
}

/* Live preview styles */
.preview-romanization {
  transition: all 0.2s ease;
}

/* Responsive adjustments for preview */
@media (max-width: 480px) {
  .preview-container {
    padding: 12px;
  }
}
</style>