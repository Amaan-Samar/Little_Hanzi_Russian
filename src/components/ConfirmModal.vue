<template>
  <Teleport to="body">
    <div v-if="isOpen" class="confirm-modal-overlay" @click="handleOverlayClick">
      <div class="confirm-modal" :class="{ 'mobile': isMobile }" @click.stop>
        <div class="confirm-modal-header">
          <div class="icon-wrapper">
            <AlertTriangle :size="32" />
          </div>
          <h3>{{ title }}</h3>
        </div>
        
        <div class="confirm-modal-body">
          <p>{{ message }}</p>
        </div>
        
        <div class="confirm-modal-footer">
          <button class="cancel-btn" @click="cancel">
            {{ cancelText }}
          </button>
          <button class="confirm-btn" @click="confirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Confirm Action'
  },
  message: {
    type: String,
    default: 'Are you sure you want to proceed?'
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

const handleOverlayClick = () => {
  cancel()
}

const confirm = () => {
  emit('confirm')
}

const cancel = () => {
  emit('cancel')
}

const handleEscape = (e) => {
  if (e.key === 'Escape' && props.isOpen) {
    cancel()
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
.confirm-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(139, 92, 246, 0.08);
  backdrop-filter: blur(20px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.confirm-modal {
  background: var(--bg-card);
  backdrop-filter: blur(30px);
  border-radius: var(--radius-2xl);
  width: 90%;
  max-width: 400px;
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.confirm-modal.mobile {
  width: 95%;
  border-radius: var(--radius-xl);
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.confirm-modal-header {
  padding: 24px 24px 16px;
  text-align: center;
}

.icon-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
  color: #F59E0B;
}

.confirm-modal-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
}

.confirm-modal-body {
  padding: 0 24px 24px;
  text-align: center;
}

.confirm-modal-body p {
  margin: 0;
  color: var(--gray-500);
  line-height: 1.6;
}

.confirm-modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px 24px;
  border-top: var(--border-primary-light);
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  padding: 12px;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  font-size: 14px;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.5);
  border: var(--border-primary);
  color: var(--text-muted);
}

.cancel-btn:hover {
  background: var(--p-100);
  transform: translateY(-1px);
}

.confirm-btn {
  background: var(--gradient-danger);
  color: var(--text-white);
}

.confirm-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-danger);
}

@media (max-width: 768px) {
  .confirm-modal-header {
    padding: 20px 20px 12px;
  }
  
  .confirm-modal-body {
    padding: 0 20px 20px;
  }
  
  .confirm-modal-footer {
    padding: 12px 20px 20px;
    flex-direction: column;
  }
  
  .cancel-btn,
  .confirm-btn {
    padding: 12px;
  }
}
</style>