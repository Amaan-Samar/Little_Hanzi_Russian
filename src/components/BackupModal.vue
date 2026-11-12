<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[2500] flex items-center justify-center bg-slate-900/25 backdrop-blur-sm animate-fadeIn"
      @click="close"
    >
      <div
        class="relative bg-white rounded-2xl w-[90%] max-w-[480px] max-h-[90vh] flex flex-col animate-slideUp border border-gray-200 shadow-xl"
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
          <h3 class="text-lg font-bold text-gray-800">Backup &amp; sync</h3>
          <p class="text-xs text-gray-500 mt-1 leading-relaxed">
            Your library stays in the browser, but a backup file lives on your
            disk. Clearing browser data won't touch it.
          </p>

          <!-- Status card -->
          <div class="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div class="flex items-start gap-3">
              <div class="status-icon" :class="statusTone">
                <ShieldCheck v-if="backupStatus === 'connected'" :size="20" />
                <AlertTriangle v-else-if="backupStatus === 'needs-permission' || backupStatus === 'error'" :size="20" />
                <Database v-else :size="20" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-800">{{ statusTitle }}</p>
                <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">{{ statusDetail }}</p>
                <p v-if="backupFileName" class="text-[11px] text-gray-400 mt-1 truncate">
                  {{ backupFileName }}
                </p>
                <p v-if="backupLastSaved" class="text-[11px] text-gray-400 mt-0.5">
                  Last saved {{ formatSaved(backupLastSaved) }}
                </p>
              </div>
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-if="backupStatus === 'needs-permission'"
                class="primary-btn"
                @click="$emit('reconnect-backup')"
              >
                <RefreshCw :size="14" />
                Reconnect
              </button>
              <button
                v-else-if="backupStatus === 'off' || backupStatus === 'error'"
                class="primary-btn"
                :disabled="!backupSupported"
                @click="$emit('choose-backup')"
              >
                <FolderOpen :size="14" />
                Choose backup file
              </button>
              <button
                v-if="backupStatus === 'connected'"
                class="ghost-btn"
                @click="$emit('disable-backup')"
              >
                <Link2Off :size="14" />
                Disconnect
              </button>
            </div>
          </div>

          <!-- Export / import -->
          <div class="mt-5">
            <label class="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Move your library
            </label>
            <div class="space-y-2">
              <button class="row-btn" @click="$emit('download-backup')">
                <Download :size="17" class="row-icon" />
                <span class="flex-1 min-w-0 text-left">
                  <span class="row-title">Download backup</span>
                  <span class="row-sub">Save all articles, likes, and archives to a file</span>
                </span>
                <span class="row-count">{{ articleCount }}</span>
              </button>

              <button class="row-btn" @click="$emit('import-backup')">
                <Upload :size="17" class="row-icon" />
                <span class="flex-1 min-w-0 text-left">
                  <span class="row-title">Open a shared file or backup</span>
                  <span class="row-sub">Pick a .json file from this device</span>
                </span>
              </button>

              <button class="row-btn" @click="$emit('export-share')">
                <Share2 :size="17" class="row-icon" />
                <span class="flex-1 min-w-0 text-left">
                  <span class="row-title">Share my whole library</span>
                  <span class="row-sub">Creates a bundle a friend can import as unread</span>
                </span>
              </button>
            </div>
          </div>

          <p class="text-[11px] text-gray-400 mt-5 leading-relaxed">
            Received an article file? Open it here, or just drag the .json file
            onto the app. Imported articles arrive unread and keep the name of the
            person who shared them. Your own read, bookmark, and archive state is
            never overwritten.
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import {
  X,
  Database,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  FolderOpen,
  Link2Off,
  Download,
  Upload,
  Share2,
} from 'lucide-vue-next'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  backupSupported: { type: Boolean, default: false },
  backupStatus: { type: String, default: 'off' },
  backupFileName: { type: String, default: '' },
  backupLastSaved: { type: Number, default: null },
  articleCount: { type: Number, default: 0 },
})

const emit = defineEmits([
  'close',
  'choose-backup',
  'reconnect-backup',
  'disable-backup',
  'download-backup',
  'import-backup',
  'export-share',
])

const close = () => emit('close')

const statusTone = computed(() => {
  if (props.backupStatus === 'connected') return 'is-good'
  if (props.backupStatus === 'needs-permission' || props.backupStatus === 'error') return 'is-warn'
  return 'is-off'
})

const statusTitle = computed(() => {
  switch (props.backupStatus) {
    case 'connected':
      return 'Auto-backup is on'
    case 'needs-permission':
      return 'Backup file needs permission'
    case 'error':
      return 'Backup could not be written'
    case 'unsupported':
      return 'Auto-backup is not available here'
    default:
      return 'Auto-backup is off'
  }
})

const statusDetail = computed(() => {
  switch (props.backupStatus) {
    case 'connected':
      return 'Changes are written to your backup file automatically.'
    case 'needs-permission':
      return 'Reconnect to let the app write to your existing backup file.'
    case 'error':
      return 'Check that the file still exists, then choose it again.'
    case 'unsupported':
      return 'This browser cannot write files automatically. Use Download backup instead.'
    default:
      return 'Choose a file once and the app will keep it up to date as you read.'
  }
})

const formatSaved = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

.status-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-icon.is-good {
  background: var(--p-50);
  color: var(--primary);
}

.status-icon.is-warn {
  background: #fffbeb;
  color: #b45309;
}

.status-icon.is-off {
  background: var(--surface-muted);
  color: var(--text-muted);
}

.primary-btn,
.ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.primary-btn {
  background: var(--primary);
  color: #fff;
  border: 1px solid transparent;
}

.primary-btn:hover:not(:disabled) {
  background: var(--primary-dark);
}

.primary-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ghost-btn {
  background: var(--surface);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.ghost-btn:hover {
  background: var(--surface-muted);
  border-color: var(--border-strong);
  color: var(--text);
}

.row-btn {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  padding: 11px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease;
}

.row-btn:hover {
  background: var(--surface-soft);
  border-color: var(--border-strong);
}

.row-icon {
  color: var(--primary);
  flex-shrink: 0;
}

.row-title {
  display: block;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text);
}

.row-sub {
  display: block;
  font-size: 11px;
  color: var(--text-light);
  margin-top: 1px;
  line-height: 1.35;
}

.row-count {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--surface-muted);
  border-radius: 999px;
  padding: 2px 8px;
  flex-shrink: 0;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.24);
  border-radius: 20px;
}
</style>
