<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[2500] flex items-center justify-center bg-slate-900/25 backdrop-blur-sm animate-fadeIn"
      @click="close"
    >
      <div
        class="relative bg-white rounded-2xl w-[90%] max-w-[460px] max-h-[90vh] flex flex-col animate-slideUp border border-gray-200 shadow-xl"
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

          <!-- Single QR: everything fits -->
          <div v-if="!splitMode" class="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
            <img
              v-if="qrFull"
              :src="qrFull"
              alt="QR code containing the shared article"
              class="qr-image mx-auto"
            />
            <div v-else class="qr-placeholder">
              <Loader2 :size="24" class="animate-spin text-sky-500 mx-auto" />
              <p class="text-xs text-gray-400 mt-2">Generating QR…</p>
            </div>
            <p class="text-[11px] text-gray-500 mt-3 line-clamp-2">{{ articleTitle }}</p>
          </div>

          <!-- Split QR: Russian first, English second -->
          <template v-else>
            <div class="mt-4 flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-sky-800">
              <ScanLine :size="18" class="flex-shrink-0 mt-0.5" />
              <p v-if="hasEnglish" class="text-xs leading-relaxed">
                This article is too large for one QR code. Share it in two steps:
                scan the Russian code first, then the English code. They merge into
                one article.
              </p>
              <p v-else class="text-xs leading-relaxed">
                This article is too large for a single QR code. Use the article
                file below instead.
              </p>
            </div>

            <div class="qr-block mt-3">
              <div class="qr-head">
                <span class="step-badge">1</span>
                <span>Russian</span>
              </div>
              <img
                v-if="qrRu"
                :src="qrRu"
                alt="QR code containing the Russian text"
                class="qr-image mx-auto"
              />
              <div v-else class="qr-placeholder">
                <AlertTriangle v-if="!ruCanQr" :size="22" class="text-amber-500 mx-auto" />
                <Loader2 v-else :size="22" class="animate-spin text-sky-500 mx-auto" />
                <p class="text-[11px] text-gray-500 mt-2 text-center">
                  {{ ruCanQr ? 'Generating QR…' : 'Russian text is too large for a QR.' }}
                </p>
              </div>
            </div>

            <div v-if="hasEnglish" class="qr-block mt-3">
              <div class="qr-head">
                <span class="step-badge">2</span>
                <span>English translation</span>
              </div>
              <img
                v-if="qrEn"
                :src="qrEn"
                alt="QR code containing the English translation"
                class="qr-image mx-auto"
              />
              <div v-else class="qr-placeholder">
                <AlertTriangle v-if="!enCanQr" :size="22" class="text-amber-500 mx-auto" />
                <Loader2 v-else :size="22" class="animate-spin text-sky-500 mx-auto" />
                <p class="text-[11px] text-gray-500 mt-2 text-center">
                  {{ enCanQr ? 'Generating QR…' : 'English is too large for a QR. Use the article file.' }}
                </p>
              </div>
            </div>

            <p class="text-[11px] text-gray-500 mt-3 leading-relaxed">
              The English code looks up the article by its Russian text, so keep the
              article until both codes have been scanned.
            </p>
          </template>

          <!-- Share link(s) -->
          <div v-if="!splitMode" class="mt-4">
            <label class="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Share link
            </label>
            <div class="flex gap-2">
              <input
                :value="fullShare.url"
                readonly
                class="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 bg-gray-50 outline-none"
                @focus="$event.target.select()"
              />
              <button class="copy-btn" @click="copyLink(fullShare.url, 'full')">
                <Check v-if="copiedKey === 'full'" :size="14" />
                <Copy v-else :size="14" />
                {{ copiedKey === 'full' ? 'Copied' : 'Copy' }}
              </button>
            </div>
          </div>

          <div v-else class="mt-4 space-y-3">
            <div>
              <label class="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Russian link
              </label>
              <div class="flex gap-2">
                <input
                  :value="ruShare.url"
                  readonly
                  class="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 bg-gray-50 outline-none"
                  @focus="$event.target.select()"
                />
                <button class="copy-btn" @click="copyLink(ruShare.url, 'ru')">
                  <Check v-if="copiedKey === 'ru'" :size="14" />
                  <Copy v-else :size="14" />
                  {{ copiedKey === 'ru' ? 'Copied' : 'Copy' }}
                </button>
              </div>
            </div>

            <div v-if="hasEnglish">
              <label class="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                English link
              </label>
              <div class="flex gap-2">
                <input
                  :value="enShare.url"
                  readonly
                  class="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 bg-gray-50 outline-none"
                  @focus="$event.target.select()"
                />
                <button class="copy-btn" @click="copyLink(enShare.url, 'en')">
                  <Check v-if="copiedKey === 'en'" :size="14" />
                  <Copy v-else :size="14" />
                  {{ copiedKey === 'en' ? 'Copied' : 'Copy' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Fallback: file -->
          <div
            v-if="splitMode && !ruCanQr"
            class="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-amber-800"
          >
            <AlertTriangle :size="18" class="flex-shrink-0 mt-0.5" />
            <p class="text-xs leading-relaxed">
              Even the Russian text is too large for a QR code. Download the article
              file below and send it to your friend; they can open it with
              History → Open shared file.
            </p>
          </div>

          <!-- Actions -->
          <div class="mt-5 grid grid-cols-2 gap-2">
            <button class="secondary-btn" :disabled="!primaryQr" @click="downloadQr">
              <Download :size="15" />
              Download QR
            </button>
            <button class="secondary-btn" @click="downloadFile">
              <FileDown :size="15" />
              Article file
            </button>
          </div>

          <p class="text-[11px] text-gray-400 mt-3 leading-relaxed">
            Received a .json file instead? Open History → Open shared file to pick it.
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import {
  X,
  Copy,
  Check,
  Download,
  FileDown,
  AlertTriangle,
  Loader2,
  ScanLine,
} from 'lucide-vue-next'
import QRCode from 'qrcode'
import {
  buildSharePayload,
  buildShareUrl,
  makeShareBundle,
  downloadJson,
  slugify,
} from '../utils/sharePayload'
import { copyText } from '../utils/clipboard'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  article: { type: Object, default: null },
  displayName: { type: String, default: '' },
})

const emit = defineEmits(['close', 'save-name'])

const name = ref('')
const qrFull = ref('')
const qrRu = ref('')
const qrEn = ref('')
const copiedKey = ref('')
let copiedTimeout = null
let qrToken = 0

const articleTitle = computed(() => props.article?.title || 'Untitled article')
const hasEnglish = computed(() => Boolean((props.article?.englishContent || '').trim()))

const shareBy = computed(() => name.value.trim() || 'A friend')

const fullShare = computed(() =>
  buildShareUrl(buildSharePayload(props.article, shareBy.value, 'full')),
)
const ruShare = computed(() =>
  buildShareUrl(buildSharePayload(props.article, shareBy.value, 'ru')),
)
const enShare = computed(() =>
  hasEnglish.value
    ? buildShareUrl(buildSharePayload(props.article, shareBy.value, 'en'))
    : { url: '', encoded: '', tooLarge: false },
)

// If the combined article will not fit in a QR, switch to two codes.
const splitMode = computed(() => fullShare.value.tooLarge)
const ruCanQr = computed(() => Boolean(ruShare.value.url) && !ruShare.value.tooLarge)
const enCanQr = computed(
  () => hasEnglish.value && Boolean(enShare.value.url) && !enShare.value.tooLarge,
)
const primaryQr = computed(() => (splitMode.value ? qrRu.value : qrFull.value))

const emitName = () => {
  emit('save-name', name.value.slice(0, 40))
}

const close = () => emit('close')

const renderQr = (url) =>
  QRCode.toDataURL(url, {
    errorCorrectionLevel: 'L',
    margin: 2,
    width: 560,
    color: { dark: '#103d60', light: '#ffffff' },
  })

const generateQrs = async () => {
  const token = ++qrToken
  qrFull.value = ''
  qrRu.value = ''
  qrEn.value = ''

  if (!props.isOpen || !props.article) return

  try {
    if (!splitMode.value) {
      const data = await renderQr(fullShare.value.url)
      if (token === qrToken) qrFull.value = data
      return
    }

    if (ruCanQr.value) {
      const data = await renderQr(ruShare.value.url)
      if (token !== qrToken) return
      qrRu.value = data
    }

    if (enCanQr.value) {
      const data = await renderQr(enShare.value.url)
      if (token !== qrToken) return
      qrEn.value = data
    }
  } catch (error) {
    console.error('QR generation failed:', error)
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      name.value = props.displayName || ''
      copiedKey.value = ''
      generateQrs()
    }
  },
)

watch([name, () => props.article], () => {
  if (props.isOpen) generateQrs()
})

const copyLink = async (url, key) => {
  if (!url) return
  if (!(await copyText(url))) {
    console.error('Copy failed:', url)
    return
  }

  copiedKey.value = key
  if (copiedTimeout) clearTimeout(copiedTimeout)
  copiedTimeout = setTimeout(() => {
    copiedKey.value = ''
  }, 1800)
}

const downloadQr = () => {
  if (!primaryQr.value) return
  const suffix = splitMode.value ? '-russian-qr' : '-qr'
  const link = document.createElement('a')
  link.href = primaryQr.value
  link.download = `${slugify(articleTitle.value, 'article')}${suffix}.png`
  document.body.appendChild(link)
  link.click()
  link.remove()
}

const downloadFile = () => {
  if (!props.article) return
  const bundle = makeShareBundle([props.article], shareBy.value)
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
  min-height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.qr-block {
  border: 1px solid var(--border);
  background: var(--surface-soft);
  border-radius: 12px;
  padding: 12px;
}

.qr-head {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 9px;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0;
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
