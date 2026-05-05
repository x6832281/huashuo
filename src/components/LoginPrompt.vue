<template>
  <Teleport to="body">
    <Transition name="fade">
      <div class="login-overlay" v-if="visible" @click.self="close">
        <div class="login-dialog">
          <span class="login-emoji">🌸</span>
          <h3 class="login-title">先选个身份吧</h3>
          <p class="login-desc">选好身份后就能点赞和评论啦</p>
          <div class="login-actions">
            <button class="login-btn primary" @click="goSettings">去选身份</button>
            <button class="login-btn secondary" @click="close">先不了</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])
const router = useRouter()

function close() {
  emit('close')
}

function goSettings() {
  emit('close')
  router.push('/settings')
}
</script>

<style scoped>
.login-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.login-dialog {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 32px 24px;
  text-align: center;
  max-width: 300px;
  width: 100%;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-soft);
}

.login-emoji {
  font-size: 40px;
  display: block;
  margin-bottom: 12px;
}

.login-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.login-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 24px;
  line-height: 1.5;
}

.login-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.login-btn {
  padding: 12px 24px;
  border-radius: var(--radius-xl);
  font-size: 14px;
  font-weight: 500;
  transition: var(--transition-gentle);
}

.login-btn.primary {
  background: linear-gradient(135deg, var(--accent-warm), #e8a060);
  color: var(--bg-primary);
}

.login-btn.primary:active {
  transform: scale(0.95);
}

.login-btn.secondary {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border-light);
}

.login-btn.secondary:active {
  transform: scale(0.95);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
