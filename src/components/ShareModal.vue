<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[2500] flex items-center justify-center bg-slate-900/25 backdrop-blur-sm animate-fadeIn"
      @click="close"
    >
      <div
        class="relative bg-white rounded-2xl w-[90%] max-w-[440px] max-h-[90vh] flex flex-col animate-slideUp border border-gray-200 shadow-xl"
        @click.stop
      >
        <button
          class="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full bg-white border border-gray-200 cursor-pointer flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-gray-50 hover:border-gray-300 text-gray-400 hover:text-gray-600 shadow-md hover:shadow-lg z-10"
          @click="close"
          title="Close"
        >
          <X :size="16" />
        </button>

        <div class="flex-1 overflow-y-auto p-6 pb-7 scrollbar-thin scrollbar-track-transparent">
          <h3 class="text-lg font-bold text-gray-800">Share article</h3>
          <p class="text-xs text-gray-500 mt-1 leading-relaxed">
            Ask your friend to scan this with their phone camera. The article opens
            directly in Little Hanzi Russian.
          </p>

          <!-- Your name -->
          <div class="mt-4">
            <label class="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Your name
            </label>
            <input
              v-model="name"
              maxlength="40"
              placeholder="Shown to the person you share with"
              class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-gray-50 outline-none transition-all focus:border-sky-400 focus:bg-white placeholder:text-gray-400"
              @input="emitName"
            />
          </div>

          <!-- Too large fallback -->
          <div
            v-if="tooLarge"
            class="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-amber-800"
          >
            <AlertTriangle :size="18" class="flex-shrink-0 mt-0.5" />
            <p class="text-xs leading-relaxed">
              This article is too long for a single QR code. Copy the link or
              download the article file and send it another way.
            </p>
          </div>

          <!-- QR -->
          <div v-else class="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
            <img
              v-if="qrDataUrl"
              :src="qrDataUrl"
              alt="QR code containing the shared article"
              class="qr-image mx-auto"
            />
            <div v-else class="qr-placeholder">
              <Loader2 :size="24" class="animate-spin text-sky-500 mx-auto" />
              <p class="text-xs text-gray-400 mt-2">Generating QR…</p>
            </div>
            <p class="text-[11px] text-gray-500 mt-3 line-clamp-2">{{ articleTitle }}</p>
          </div>

          <!-- Share link -->
          <div class="mt-4">
            <label class="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Share link
            </label>
            <div class="flex gap-2">
              <input
                :value="shareUrl"
                readonly
                class="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 bg-gray-50 outline-none"
                @focus="$event.target.select()"
              />
              <button class="copy-btn" @click="copyLink">
                <Check v-if="copied" :size="14" />
                <Copy v-else :size="14" />
                {{ copied ? 'Copied' : 'Copy' }}
              </button>
            </div>
          </div>

          <!-- Fallback actions -->
          <div class="mt-5 grid grid-cols-2 gap-2">
            <button class="secondary-btn" :disabled="!qrDataUrl" @click="downloadQr">
              <Download :size="15" />
              Download QR
            </button>
            <button class="secondary-btn" @click="downloadFile">
              <FileDown :size="15" />
              Article file
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { X, Copy, Check, Download, FileDown, AlertTriangle, Loader2 } from 'lucide-vue-next'
import QRCode from 'qrcode'
import {
  buildSharePayload,
  buildShareUrl,
  makeShareBundle,
  downloadJson,
  slugify,
} from '../utils/sharePayload'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  article: { type: Object, default: null },
  displayName: { type: String, default: '' },
})

const emit = defineEmits(['close', 'save-name'])

const name = ref('')
const qrDataUrl = ref('')
const qrError = ref(false)
const copied = ref(false)
let copiedTimeout = null

const articleTitle = computed(() => props.article?.title || 'Untitled article')

const payload = computed(() => buildSharePayload(props.article, name.value || 'A friend'))
const share = computed(() => buildShareUrl(payload.value))
const shareUrl = computed(() => share.value.url)
const tooLarge = computed(() => share.value.tooLarge || qrError.value)

const emitName = () => {
  emit('save-name', name.value.slice(0, 40))
}

const close = () => emit('close')

const generateQr = async () => {
  qrDataUrl.value = ''
  qrError.value = false
  if (!props.isOpen || !share.value.url || share.value.tooLarge) return
  try {
    qrDataUrl.value = await QRCode.toDataURL(share.value.url, {
      errorCorrectionLevel: 'L',
      margin: 2,
      width: 560,
      color: { dark: '#103d60', light: '#ffffff' },
    })
  } catch (error) {
    console.error('QR generation failed:', error)
    qrError.value = true
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      name.value = props.displayName || ''
      copied.value = false
      generateQr()
    }
  },
)

watch(shareUrl, () => {
  if (props.isOpen) generateQr()
})

const copyLink = async () => {
  if (!shareUrl.value) return
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    if (copiedTimeout) clearTimeout(copiedTimeout)
    copiedTimeout = setTimeout(() => {
      copied.value = false
    }, 1800)
  } catch (error) {
    console.error('Copy failed:', error)
  }
}

const downloadQr = () => {
  if (!qrDataUrl.value) return
  const link = document.createElement('a')
  link.href = qrDataUrl.value
  link.download = `${slugify(articleTitle.value, 'article')}-qr.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
}

const downloadFile = () => {
  if (!props.article) return
  const bundle = makeShareBundle([props.article], name.value || 'A friend')
  downloadJson(bundle, `${slugify(articleTitle.value, 'article')}-shared.json`)
}
</script>

<style scoped>
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

.qr-image {
  width: 100%;
  max-width: 260px;
  height: auto;
  border-radius: 8px;
  image-rendering: pixelated;
}

.qr-placeholder {
  min-height: 160px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.copy-btn,
.secondary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.copy-btn {
  padding: 0 14px;
  background: var(--primary);
  color: #fff;
  border: 1px solid transparent;
  white-space: nowrap;
}

.copy-btn:hover {
  background: var(--primary-dark);
}

.secondary-btn {
  padding: 9px 10px;
  background: var(--surface);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.secondary-btn:hover:not(:disabled) {
  background: var(--surface-muted);
  border-color: var(--border-strong);
  color: var(--text);
}

.secondary-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.24);
  border-radius: 20px;
}
</style>
