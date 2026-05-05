<template>
  <div class="post-form-overlay" @click.self="$emit('close')">
    <div class="post-form">
      <div class="form-header">
        <h3 class="form-title">写下心事</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="form-body">
        <textarea
          ref="textareaRef"
          v-model="content"
          class="content-input"
          placeholder="此刻的心情..."
          maxlength="1000"
          rows="6"
        ></textarea>
        <div class="char-count" :class="{ warn: content.length > 900 }">
          {{ content.length }}/1000
        </div>

        <SensitiveWarning :warnings="sensitiveWarnings" />
      </div>

      <div class="form-footer">
        <button class="submit-btn" :disabled="!canSubmit || submitting" @click="submit">
          {{ submitting ? '发布中...' : '发布心事' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useEmotionStore } from '@/stores/emotion'
import SensitiveWarning from './SensitiveWarning.vue'

const emit = defineEmits(['close', 'submitted'])
const emotionStore = useEmotionStore()

const content = ref('')
const submitting = ref(false)
const sensitiveWarnings = ref([])
const textareaRef = ref(null)

const canSubmit = computed(() => content.value.trim().length > 0)

function checkSensitive(text) {
  const warnings = []
  if (/1[3-9]\d{9}/.test(text)) warnings.push('检测到手机号')
  if (/[\w.-]+@[\w.-]+\.\w+/.test(text)) warnings.push('检测到邮箱')
  if (/\d{6}(?:\d{2})?\d{2}[\dXx]/.test(text)) warnings.push('检测到身份证号')
  return warnings
}

async function submit() {
  if (!canSubmit.value || submitting.value) return
  sensitiveWarnings.value = checkSensitive(content.value)
  submitting.value = true
  try {
    await emotionStore.createPost(content.value)
    content.value = ''
    sensitiveWarnings.value = []
    emit('submitted')
  } catch (e) {
    console.error('Submit error:', e)
  } finally {
    submitting.value = false
  }
}

nextTick(() => {
  textareaRef.value?.focus()
})
</script>

<style scoped>
.post-form-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: flex-end;
  z-index: 100;
  animation: fadeIn 0.2s ease;
}

.post-form {
  width: 100%;
  background: var(--bg-secondary);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding: 24px 20px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
  animation: slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.form-title {
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--text-primary);
  letter-spacing: 1px;
}

.close-btn {
  font-size: 18px;
  color: var(--text-muted);
  padding: 4px 8px;
}

.content-input {
  width: 100%;
  padding: 14px;
  background: var(--bg-input);
  border-radius: var(--radius-md);
  font-size: 15px;
  color: var(--text-primary);
  line-height: 1.7;
  resize: none;
  border: 1px solid var(--border-subtle);
  transition: border-color 0.2s;
}

.content-input:focus {
  border-color: var(--accent-warm);
}

.content-input::placeholder {
  color: var(--text-muted);
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 6px;
}

.char-count.warn {
  color: var(--accent-rose);
}

.form-footer {
  margin-top: 16px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, var(--accent-warm), #e8a060);
  color: var(--bg-primary);
  border-radius: var(--radius-lg);
  font-size: 15px;
  font-weight: 500;
  transition: var(--transition-gentle);
}

.submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.98);
}
</style>
