<!-- components/InfoModal.vue -->
<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/25 backdrop-blur-sm animate-fadeIn" @click="close">
      <div class="relative bg-white rounded-2xl w-[90%] max-w-[600px] max-h-[90vh] flex flex-col animate-slideUp border border-gray-200 shadow-xl" @click.stop>

        <!-- Close Button -->
        <button class="absolute -top-2.5 -right-2.5 w-8 h-8 rounded-full bg-white border border-gray-200 cursor-pointer flex items-center justify-center transition-all duration-200 hover:scale-110 hover:bg-gray-50 hover:border-gray-300 text-gray-400 hover:text-gray-600 shadow-md hover:shadow-lg z-10" @click="close">
          <X :size="16" />
        </button>

        <div class="flex-1 overflow-y-auto p-6 pb-8 scrollbar-thin scrollbar-thumb-gray-200/50 scrollbar-track-transparent">

          <!-- Tabs -->
          <div class="flex gap-2 mb-5 border-b border-gray-100 pb-2">
            <button
              class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
              :class="activeTab === 'learn'
                ? 'bg-sky-50 text-sky-600'
                : 'text-gray-500 hover:bg-gray-50'"
              @click="activeTab = 'learn'"
            >
              Guide & Resources
            </button>
            <button
              class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
              :class="activeTab === 'apps'
                ? 'bg-sky-50 text-sky-600'
                : 'text-gray-500 hover:bg-gray-50'"
              @click="activeTab = 'apps'"
            >
              Similar Apps
            </button>
          </div>

          <!-- ================= TAB: Learn ================= -->
          <div v-show="activeTab === 'learn'">
            <!-- App Info -->
            <div class="mb-6">
              <h2 class="text-xl font-bold text-gray-800 mb-2">About Little Hanzi Russian</h2>
              <p class="text-sm text-slate-600 leading-relaxed">
                A tool for learning Russian through reading. Paste Russian text and get
                instant romanization underneath each word, plus paragraph-by-paragraph
                English translations to help you read and understand better.
              </p>
            </div>

            <!-- Tips -->
            <div class="mb-6 bg-amber-50/80 rounded-xl p-4 border border-amber-100/50">
              <h4 class="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">💡 Tips</h4>
              <ul class="text-sm text-slate-600 space-y-1.5">
                <li class="flex items-start gap-2">
                  <span class="text-amber-500 mt-0.5">•</span>
                  <span>Paste Russian text in the left box and English translation in the right</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-amber-500 mt-0.5">•</span>
                  <span>Adjust font sizes and display settings using the Settings gear icon</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-amber-500 mt-0.5">•</span>
                  <span>Your articles are automatically saved in History for later reading</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-amber-500 mt-0.5">•</span>
                  <span>Double-click (or double-tap) any paragraph to bookmark it, then use the paragraph menu to jump straight to it in the editor</span>
                </li>
              </ul>
            </div>

            <!-- Learning Resources -->
            <div class="mb-6">
              <label class="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Learning Resources</label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <a
                  v-for="resource in resources"
                  :key="resource.name"
                  :href="resource.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="group block p-4 bg-white border border-gray-200 rounded-xl hover:border-sky-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center group-hover:bg-sky-100 transition-colors duration-200">
                      <span class="text-lg">{{ resource.icon }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h4 class="text-sm font-semibold text-gray-800 group-hover:text-sky-700 transition-colors duration-200">
                        {{ resource.name }}
                      </h4>
                      <p class="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {{ resource.description }}
                      </p>
                    </div>
                  </div>
                </a>
              </div>
            </div>

            <!-- Author appreciation card -->
            <div class="rounded-xl p-4 border border-gray-200 bg-gray-50">
              <div class="flex items-start gap-3">
                <img
                  :src="author.avatarUrl"
                  :alt="author.name"
                  class="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0"
                  @error="authorAvatarFailed = true"
                  v-show="!authorAvatarFailed"
                />
                <div v-if="authorAvatarFailed" class="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold flex-shrink-0">
                  {{ author.name.charAt(0) }}
                </div>

                <div class="flex-1 min-w-0">
                  <p class="text-[11px] font-semibold text-sky-600 uppercase tracking-wider mb-0.5">Made with care by</p>
                  <a
                    :href="author.githubUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 text-sm font-semibold text-gray-800 hover:text-sky-700 transition-colors group"
                  >
                    {{ author.name }}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-300 group-hover:text-sky-500 transition-colors">
                      <path d="M7 17L17 7"/>
                      <path d="M7 7h10v10"/>
                    </svg>
                  </a>
                  <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                    {{ author.tagline }}
                  </p>
                  <div class="mt-2 flex flex-wrap gap-3 text-[11px]">
                    <a
                      :href="author.githubUrl"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-slate-400 hover:text-sky-600 transition-colors font-medium"
                    >
                      GitHub →
                    </a>
                    <a
                      :href="author.githubUrl + '/Little_Hanzi_Russian'"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-slate-400 hover:text-sky-600 transition-colors font-medium"
                    >
                      Source code →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ================= TAB: Similar Apps ================= -->
          <div v-show="activeTab === 'apps'">
            <div class="mb-5">
              <h2 class="text-xl font-bold text-gray-800 mb-2">More from Little Hanzi</h2>
              <p class="text-sm text-slate-600 leading-relaxed">
                Same reading-first approach, for other languages. Pick whichever you're learning next.
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <a
                v-for="app in siblingApps"
                :key="app.name"
                :href="app.url"
                target="_blank"
                rel="noopener noreferrer"
                class="group relative flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-sky-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                :class="{ 'ring-1 ring-sky-200 bg-sky-50/40': app.isCurrent }"
              >
                <span
                  v-if="app.isCurrent"
                  class="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-sky-500 text-white text-[9px] font-bold uppercase tracking-wide shadow-sm"
                >
                  Here
                </span>

                <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden group-hover:bg-sky-50 transition-colors duration-200">
                  <img
                    v-if="!app.iconFailed"
                    :src="app.iconUrl"
                    :alt="app.name"
                    class="w-8 h-8 object-contain"
                    @error="app.iconFailed = true"
                  />
                  <span v-else class="text-2xl">{{ app.fallbackIcon }}</span>
                </div>

                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-semibold text-gray-800 group-hover:text-sky-700 transition-colors duration-200 leading-snug">
                    {{ app.name }}
                  </h4>
                  <span class="block text-[10px] font-medium uppercase tracking-wider text-slate-400 group-hover:text-sky-400 transition-colors mt-0.5">
                    {{ app.language }}
                  </span>
                  <p class="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    {{ app.description }}
                  </p>
                </div>

                <div class="flex-shrink-0 text-slate-300 group-hover:text-sky-400 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M7 17L17 7"/>
                    <path d="M7 7h10v10"/>
                  </svg>
                </div>
              </a>
            </div>

            <p class="text-[11px] text-center text-slate-400 mt-6">
              Built with the same philosophy — read real content, don't drill flashcards.
            </p>
          </div>

          <!-- Persistent credit line, visible on both tabs -->
          <p class="mt-6 pt-4 border-t border-gray-100 text-center text-[11px] text-slate-400">
            Made with 🇷🇺 by
            <a
              :href="author.githubUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="font-medium text-slate-500 hover:text-sky-600 transition-colors"
            >
              {{ author.name }}
            </a>
          </p>

        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const activeTab = ref('learn')   // 'learn' | 'apps'

// Reset to "Learn" tab each time the modal opens
watch(() => props.isOpen, (open) => {
  if (open) activeTab.value = 'learn'
})

// Author info — edit these three fields to match your profile
const author = {
  name: 'Amaan Samar',
  githubUrl: 'https://github.com/Amaan-Samar',
  avatarUrl: 'https://github.com/Amaan-Samar.png',
  tagline: 'Built for learners who want to read real Russian, not drill flashcards.'
}
const authorAvatarFailed = ref(false)

const resources = [
  // --- News (real reading practice) ---
  {
    name: 'ТАСС (TASS)',
    icon: '🇷🇺',
    url: 'https://tass.ru/',
    description: 'Russia\'s state news agency — short, clear reports on current events.'
  },
  {
    name: 'РИА Новости (RIA)',
    icon: '📡',
    url: 'https://ria.ru/',
    description: 'Large Russian news agency with politics, economy, science, and culture coverage.'
  },
  {
    name: 'Коммерсантъ',
    icon: '📰',
    url: 'https://www.kommersant.ru/',
    description: 'One of Russia\'s leading business newspapers, with well-written articles.'
  },
  {
    name: 'РБК (RBC)',
    icon: '📈',
    url: 'https://www.rbc.ru/',
    description: 'Business and current-affairs news with plenty of short readable pieces.'
  },
  {
    name: 'Lenta.ru',
    icon: '📱',
    url: 'https://lenta.ru/',
    description: 'Popular Russian news site with simple, direct headlines and articles.'
  },
  {
    name: 'Медуза (Meduza)',
    icon: '🕊️',
    url: 'https://meduza.io/',
    description: 'Independent Russian-language journalism covering news and explainers.'
  },

  // --- Learning / reference ---
  {
    name: 'Russian Wiktionary',
    icon: '📖',
    url: 'https://ru.wiktionary.org/',
    description: 'Definitions, stress marks, and example sentences for Russian words.'
  },
  {
    name: 'Master Russian',
    icon: '🎓',
    url: 'https://masterrussian.com/',
    description: 'Grammar explanations, vocabulary, and reading practice for learners.'
  }
]

const siblingApps = ref([
  {
    name: 'Little Hanzi Russian',
    language: 'Russian',
    description: "The app you're using right now — read Russian with romanization below each word and English translations.",
    url: 'https://amaan-samar.github.io/Little_Hanzi_Russian/',
    iconUrl: 'https://amaan-samar.github.io/Little_Hanzi_Russian/icons/favicon-196.png',
    fallbackIcon: '🇷🇺',
    iconFailed: false,
    isCurrent: true
  },
  {
    name: 'Little Hanzi Korean',
    language: 'Korean',
    description: 'Read Korean with romanization and English translations, paragraph by paragraph.',
    url: 'https://amaan-samar.github.io/Little_Hanzi_Korean/',
    iconUrl: 'https://amaan-samar.github.io/Little_Hanzi_Korean/icons/favicon-196.png',
    fallbackIcon: '🇰🇷',
    iconFailed: false,
    isCurrent: false
  },
  {
    name: 'Little Hanzi Japanese',
    language: 'Japanese',
    description: 'Read Japanese with furigana annotations and English translations, paragraph by paragraph.',
    url: 'https://amaan-samar.github.io/Little_Hanzi_Japanese/',
    iconUrl: 'https://amaan-samar.github.io/Little_Hanzi_Japanese/icons/favicon-196.png',
    fallbackIcon: '🇯🇵',
    iconFailed: false,
    isCurrent: false
  },
  {
    name: 'Little Hanzi Chinese',
    language: 'Chinese',
    description: 'Read Chinese articles with pinyin annotations and English translations, paragraph by paragraph.',
    url: 'https://amaan-samar.github.io/Little_Hanzi_Chinese/',
    iconUrl: 'https://amaan-samar.github.io/Little_Hanzi_Chinese/icons/favicon-196.png',
    fallbackIcon: '🀄',
    iconFailed: false,
    isCurrent: false
  },
  {
    name: 'Little Hanzi Greek',
    language: 'Greek',
    description: 'Read Greek text with transliteration and English translations — same clean reading experience.',
    url: 'https://amaan-samar.github.io/Little_Hanzi_Greek/',
    iconUrl: 'https://amaan-samar.github.io/Little_Hanzi_Greek/icons/favicon-196.png',
    fallbackIcon: '🇬🇷',
    iconFailed: false,
    isCurrent: false
  }
])

const close = () => {
  emit('close')
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

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>