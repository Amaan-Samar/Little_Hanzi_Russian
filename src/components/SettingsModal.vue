<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/25 backdrop-blur-sm animate-fadeIn" @click="handleOverlayClick">
      <div class="relative bg-white rounded-2xl w-[90%] max-w-[520px] max-h-[90vh] flex flex-col animate-slideUp border border-gray-200 shadow-xl" :class="{ 'w-[92%] max-h-[90vh] rounded-xl': isMobile }" @click.stop>
        
        <!-- Floating Close Button -->
        <button class="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full bg-white border border-gray-200 cursor-pointer flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-gray-50 hover:border-gray-300 text-gray-400 hover:text-gray-600 shadow-md hover:shadow-lg z-10" @click="close">
          <X :size="16" />
        </button>

        <div class="flex-1 overflow-y-auto p-6 pb-8 scrollbar-thin scrollbar-thumb-gray-200/50 scrollbar-track-transparent">
          <!-- Live Preview Section -->
          <div class="mb-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
            <label class="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Live Preview</label>
            <div class="bg-white rounded-lg p-4 border border-gray-200">
              <!-- Russian with Romanization Preview -->
              <div class="mb-3" :style="{ fontFamily: getSelectedFontFamily() }">
                <div class="flex flex-wrap items-start gap-x-2.5 gap-y-1">
                  <span
                    v-for="(word, index) in previewWords"
                    :key="index"
                    class="flex flex-col items-center"
                  >
                    <span
                      class="font-semibold text-gray-800"
                      :style="{ fontSize: `${localSettings.fontSize}px` }"
                    >
                      {{ word }}
                    </span>
                    <span
                      v-if="localSettings.showRomanization"
                      class="text-sky-600 font-light leading-tight"
                      :style="{ fontSize: `${Math.min(localSettings.romanizationFontSize, localSettings.fontSize)}px` }"
                    >
                      {{ getRomanizationForWord(word) }}
                    </span>
                  </span>
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
                  {{ localSettings.displayOrder === 'ru-en' ? 'Russian → English' : 'English → Russian' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Russian Font Size -->
          <div class="mb-6 last:mb-0">
            <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Russian Font Size</label>
            <div class="flex items-center gap-3.5 mb-3.5">
              <button 
                class="w-9 h-9 rounded-full border border-gray-200 bg-white cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                @click="decreaseFontSize"
                :disabled="localSettings.fontSize <= 12"
              >
                <Minus :size="16" />
              </button>
              <span class="text-lg font-semibold text-gray-800 min-w-[48px] text-center">{{ localSettings.fontSize }}</span>
              <button 
                class="w-9 h-9 rounded-full border border-gray-200 bg-white cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
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
                class="px-2.5 py-1 border border-gray-200 rounded-md bg-white cursor-pointer text-xs font-medium transition-all duration-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300"
                :class="{ 'bg-sky-50 border-sky-200 text-sky-700 shadow-sm': localSettings.fontSize === size }"
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
                class="w-9 h-9 rounded-full border border-gray-200 bg-white cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                @click="decreaseRomanizationSize"
                :disabled="localSettings.romanizationFontSize <= 4"
              >
                <Minus :size="16" />
              </button>
              <span class="text-lg font-semibold text-gray-800 min-w-[48px] text-center">{{ localSettings.romanizationFontSize }}</span>
              <button 
                class="w-9 h-9 rounded-full border border-gray-200 bg-white cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
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
                class="px-2.5 py-1 border border-gray-200 rounded-md bg-white cursor-pointer text-xs font-medium transition-all duration-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                :class="{ 'bg-sky-50 border-sky-200 text-sky-700 shadow-sm': localSettings.romanizationFontSize === size }"
                :disabled="size > localSettings.fontSize"
                @click="setRomanizationSize(size)"
              >
                {{ size }}
              </button>
            </div>
            <p class="text-xs text-gray-400 mt-2">Maximum: {{ localSettings.fontSize }}px (same as Russian)</p>
          </div>

          <!-- English Font Size -->
          <div class="mb-6 last:mb-0">
            <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">English Size</label>
            <div class="flex items-center gap-3.5 mb-3.5">
              <button 
                class="w-9 h-9 rounded-full border border-gray-200 bg-white cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                @click="decreaseEnglishSize"
                :disabled="localSettings.englishFontSize <= 4"
              >
                <Minus :size="16" />
              </button>
              <span class="text-lg font-semibold text-gray-800 min-w-[48px] text-center">{{ localSettings.englishFontSize }}</span>
              <button 
                class="w-9 h-9 rounded-full border border-gray-200 bg-white cursor-pointer flex items-center justify-center transition-all duration-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
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
                class="px-2.5 py-1 border border-gray-200 rounded-md bg-white cursor-pointer text-xs font-medium transition-all duration-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                :class="{ 'bg-sky-50 border-sky-200 text-sky-700 shadow-sm': localSettings.englishFontSize === size }"
                :disabled="size > localSettings.fontSize"
                @click="setEnglishSize(size)"
              >
                {{ size }}
              </button>
            </div>
            <p class="text-xs text-gray-400 mt-2">Maximum: {{ localSettings.fontSize }}px (same as Russian)</p>
          </div>

          <!-- Font Family -->
          <div class="mb-6 last:mb-0">
            <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Font Family</label>
            <div class="relative font-select-wrapper">
              <button 
                class="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg flex justify-between items-center cursor-pointer transition-all duration-200 text-gray-600 text-sm hover:bg-gray-50 hover:border-gray-300"
                :style="{ fontFamily: getSelectedFontFamily() }"
                @click="toggleFontDropdown"
              >
                <span>{{ getSelectedFontLabel() }}</span>
                <ChevronDown :size="16" class="transition-transform duration-200" :class="{ 'rotate-180': isFontDropdownOpen }" />
              </button>
              <div v-if="isFontDropdownOpen" class="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg max-h-[200px] overflow-y-auto z-10 shadow-lg animate-slideDown">
                <button
                  v-for="font in fontOptions"
                  :key="font.value"
                  class="w-full px-4 py-2.5 bg-transparent border-none text-left cursor-pointer transition-all duration-200 text-gray-600 text-sm hover:bg-gray-50"
                  :class="{ 'bg-sky-50 text-sky-700': localSettings.selectedFont === font.value }"
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
                <input type="checkbox" v-model="localSettings.showRomanization" class="w-4.5 h-4.5 cursor-pointer accent-sky-500" @change="handleShowRomanizationChange">
                <span>Romanization</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer text-sm text-gray-600">
                <input type="checkbox" v-model="localSettings.showRussian" class="w-4.5 h-4.5 cursor-pointer accent-sky-500" @change="handleShowRussianChange">
                <span>Russian</span>
              </label>
              <label class="flex items-center gap-3 cursor-pointer text-sm text-gray-600">
                <input type="checkbox" v-model="localSettings.showEnglish" class="w-4.5 h-4.5 cursor-pointer accent-sky-500" @change="handleShowEnglishChange">
                <span>English</span>
              </label>
            </div>
          </div>

          <!-- Display Order -->
          <div class="mb-6 last:mb-0">
            <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Display Order</label>
            <div class="flex gap-6" :class="{ 'flex-col gap-3': isMobile }">
              <label class="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                <input type="radio" v-model="localSettings.displayOrder" value="en-ru" class="w-4.5 h-4.5 cursor-pointer accent-sky-500" @change="handleDisplayOrderChange">
                <span>English → Russian</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                <input type="radio" v-model="localSettings.displayOrder" value="ru-en" class="w-4.5 h-4.5 cursor-pointer accent-sky-500" @change="handleDisplayOrderChange">
                <span>Russian → English</span>
              </label>
            </div>
          </div>

          <!-- Your Name -->
          <div class="mb-6 last:mb-0">
            <label class="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Name</label>
            <input
              v-model="localSettings.displayName"
              maxlength="40"
              placeholder="e.g. Amaan"
              class="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none transition-all duration-200 focus:border-sky-400 placeholder:text-gray-400"
              @input="emitSave"
            />
            <p class="text-xs text-gray-400 mt-2">Shown as “Shared by …” when you send articles to a friend.</p>
          </div>

          <div class="mt-2">
            <button class="w-full px-5 py-2.5 bg-red-50 border border-red-200 rounded-lg text-red-600 font-medium cursor-pointer transition-all duration-200 hover:bg-red-100 hover:-translate-y-0.5" @click="resetToDefaults">
              Reset to defaults
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <span class="text-[11px] text-gray-400">Changes save automatically</span>
          <button
            class="px-5 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer transition-all duration-200 hover:-translate-y-0.5"
            style="background: var(--primary); box-shadow: var(--shadow-primary)"
            @click="close"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { X, Minus, Plus, ChevronDown } from 'lucide-vue-next'
import { romanizeRussian } from '../utils/russianRomanizer'

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
  selectedFont: 'Inter',
  showRomanization: true,
  showRussian: true,
  showEnglish: true,
  displayOrder: 'ru-en',
  romanizationFontSize: 12,
  englishFontSize: 14,
  displayName: '',
  ...props.settings,
})

const isMobile = ref(false)
const isFontDropdownOpen = ref(false)
const fontSizePresets = [12, 14, 16, 18, 20, 24, 28, 32]
const romanizationPresets = [4, 6, 8, 10, 12, 14, 16, 18]
const englishPresets = [6, 8, 10, 12, 14, 16, 18, 20]

const fontOptions = [
  { value: 'Inter', label: 'Inter', fontFamily: "'Inter', 'Noto Sans', sans-serif" },
  { value: 'NotoSans', label: 'Noto Sans', fontFamily: "'Noto Sans', 'Inter', sans-serif" },
  { value: 'PTSerif', label: 'PT Serif', fontFamily: "'PT Serif', Georgia, serif" },
  { value: 'NotoSerif', label: 'Noto Serif', fontFamily: "'Noto Serif', Georgia, serif" },
  { value: 'Roboto', label: 'Roboto', fontFamily: "'Roboto', 'Noto Sans', sans-serif" },
  { value: 'Poppins', label: 'Poppins', fontFamily: "'Poppins', 'Noto Sans', sans-serif" },
  { value: 'Georgia', label: 'Georgia', fontFamily: "Georgia, 'Times New Roman', serif" },
]

// Preview words (Russian)
const previewWords = ['Привет,', 'это', 'пример', 'текста']

const getRomanizationForWord = (word) => romanizeRussian(word)

let fontSizeTimeout = null

const getSelectedFontLabel = () => {
  const font = fontOptions.find((f) => f.value === localSettings.value.selectedFont)
  return font ? font.label : 'Inter'
}

const getSelectedFontFamily = () => {
  const font = fontOptions.find((f) => f.value === localSettings.value.selectedFont)
  return font ? font.fontFamily : "'Inter', 'Noto Sans', sans-serif"
}

const toggleFontDropdown = () => {
  isFontDropdownOpen.value = !isFontDropdownOpen.value
}

// Romanization and English text must never render larger than the Russian
// text. Keep the three controls in sync whenever the main size changes.
const clampSubSizes = () => {
  const max = localSettings.value.fontSize
  if (localSettings.value.romanizationFontSize > max) {
    localSettings.value.romanizationFontSize = max
  }
  if (localSettings.value.englishFontSize > max) {
    localSettings.value.englishFontSize = max
  }
}

// Russian font size controls
const increaseFontSize = () => {
  if (localSettings.value.fontSize < 32) {
    localSettings.value.fontSize += 2
    clampSubSizes()
    emitSave()
  }
}

const decreaseFontSize = () => {
  if (localSettings.value.fontSize > 12) {
    localSettings.value.fontSize -= 2
    clampSubSizes()
    emitSave()
  }
}

const setFontSize = (size) => {
  localSettings.value.fontSize = size
  clampSubSizes()
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

const handleShowRussianChange = () => {
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
    selectedFont: 'Inter',
    showRomanization: true,
    showRussian: true,
    showEnglish: true,
    displayOrder: 'ru-en',
    romanizationFontSize: 12,
    englishFontSize: 14,
    displayName: '',
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
    clampSubSizes()
    isFontDropdownOpen.value = false
  }
})

watch(() => props.settings, (newVal) => {
  if (props.isOpen) {
    localSettings.value = { ...newVal }
    clampSubSizes()
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
  accent-color: var(--primary);
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