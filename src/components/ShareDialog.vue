<template>
  <div class="share-overlay" @click.self="$emit('close')">
    <div class="share-dialog">
      <div class="share-header">
        <h3 class="share-title">分享卡片</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="share-options">
        <button class="share-option" @click="shareViaSystem" v-if="canSystemShare">
          <span class="option-icon">📤</span>
          <span class="option-label">系统分享</span>
        </button>
        <button class="share-option" @click="saveImage">
          <span class="option-icon">💾</span>
          <span class="option-label">保存图片</span>
        </button>
        <button class="share-option" @click="copyLink">
          <span class="option-icon">🔗</span>
          <span class="option-label">复制链接</span>
        </button>
        <button class="share-option" @click="copyText">
          <span class="option-icon">📝</span>
          <span class="option-label">复制文案</span>
        </button>
      </div>

      <div class="share-status" v-if="statusMsg">
        <span class="status-text">{{ statusMsg }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import shareFunctionalityModule from '@/share/shareFunctionality.js'

const props = defineProps({
  card: { type: Object, required: true }
})
defineEmits(['close'])

const statusMsg = ref('')

const canSystemShare = computed(() => {
  return typeof navigator !== 'undefined' && navigator.share
})

async function shareViaSystem() {
  try {
    const link = shareFunctionalityModule.generateShareLink(props.card.share_id)
    await navigator.share({
      title: '话说 - 情绪加密分享',
      text: props.card.ai_poem,
      url: link
    })
    statusMsg.value = '分享成功'
  } catch {
    statusMsg.value = '分享取消'
  }
}

async function saveImage() {
  try {
    const canvas = document.querySelector('.card-canvas')
    if (!canvas) return
    const dataUrl = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `huashuo_${props.card.share_id}.png`
    a.click()
    statusMsg.value = '图片已保存'
  } catch {
    statusMsg.value = '保存失败'
  }
}

async function copyLink() {
  try {
    const link = shareFunctionalityModule.generateShareLink(props.card.share_id)
    await navigator.clipboard.writeText(link)
    statusMsg.value = '链接已复制'
  } catch {
    statusMsg.value = '复制失败'
  }
}

async function copyText() {
  try {
    const text = `${props.card.ai_poem}\n\n来自「话说」- 零压力匿名情绪记录`
    await navigator.clipboard.writeText(text)
    statusMsg.value = '文案已复制'
  } catch {
    statusMsg.value = '复制失败'
  }
}
</script>

<style scoped>
.share-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: flex-end;
  z-index: 100;
  animation: fadeIn 0.2s ease;
}

.share-dialog {
  width: 100%;
  background: var(--bg-secondary);
  border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  padding: 24px 20px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
  animation: slideUp 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.share-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.share-title {
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--text-primary);
}

.close-btn {
  font-size: 18px;
  color: var(--text-muted);
  padding: 4px 8px;
}

.share-options {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  transition: var(--transition-gentle);
}

.share-option:active {
  transform: scale(0.95);
  background: var(--bg-tertiary);
}

.option-icon {
  font-size: 24px;
}

.option-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.share-status {
  text-align: center;
  margin-top: 16px;
  padding: 8px;
  animation: fadeIn 0.3s ease;
}

.status-text {
  font-size: 13px;
  color: var(--accent-warm);
}
</style>
