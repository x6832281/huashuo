<template>
  <div class="share-landing">
    <div class="share-card-display">
      <div class="share-poem">{{ cardData?.ai_poem || '...' }}</div>
      <div class="share-mood">{{ moodIcons[cardData?.mood_band] || '🌤️' }}</div>
    </div>

    <div class="hug-section">
      <p class="hug-prompt">给TA一个拥抱吧</p>
      <button
        class="hug-btn"
        :class="{ hugged: hasHugged }"
        @click="sendHug"
        :disabled="hasHugged"
      >
        <span class="hug-emoji">{{ hasHugged ? '🤗' : '🫂' }}</span>
        <span class="hug-text">{{ hasHugged ? '已拥抱' : '送拥抱' }}</span>
      </button>
      <p class="hug-count" v-if="hugCount > 0">已收到 {{ hugCount }} 个拥抱</p>
    </div>

    <div class="share-footer">
      <p class="footer-text">话说 · 零压力匿名情绪记录</p>
      <button class="download-btn" @click="goApp">打开话说</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const cardData = ref(null)
const hasHugged = ref(false)
const hugCount = ref(0)
const moodIcons = { 0: '🌧️', 1: '🌤️', 2: '☀️' }

async function sendHug() {
  if (hasHugged.value) return
  try {
    const resp = await fetch('/api/share/hug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        share_id: route.params.shareId,
        device_id: getDeviceId()
      })
    })
    const data = await resp.json()
    if (resp.ok) {
      hasHugged.value = true
      hugCount.value = data.hugs_count || hugCount.value + 1
    }
  } catch {
    hasHugged.value = true
    hugCount.value++
  }
}

function getDeviceId() {
  let id = localStorage.getItem('huashuo_device_id')
  if (!id) {
    id = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
    localStorage.setItem('huashuo_device_id', id)
  }
  return id
}

function goApp() {
  window.location.href = '/'
}

onMounted(async () => {
  const shareId = route.params.shareId
  if (!shareId) return
  try {
    const resp = await fetch('/api/share/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ share_ids: [shareId] })
    })
    const data = await resp.json()
    if (data.items && data.items.length > 0) {
      cardData.value = data.items[0]
      hugCount.value = data.items[0].hugs_count || 0
    }
  } catch {
    cardData.value = { ai_poem: '月光下的心事', mood_band: 1 }
  }
})
</script>

<style scoped>
.share-landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  background: var(--bg-primary);
}

.share-card-display {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 32px 24px;
  text-align: center;
  border: 1px solid var(--border-subtle);
  margin-bottom: 32px;
  width: 100%;
  max-width: 320px;
}

.share-poem {
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--accent-warm);
  letter-spacing: 2px;
  line-height: 1.8;
  margin-bottom: 12px;
}

.share-mood {
  font-size: 28px;
}

.hug-section {
  text-align: center;
  margin-bottom: 40px;
}

.hug-prompt {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.hug-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 40px;
  background: linear-gradient(135deg, var(--accent-warm), #e8a060);
  color: var(--bg-primary);
  border-radius: var(--radius-xl);
  transition: var(--transition-bounce);
  margin: 0 auto;
}

.hug-btn:active:not(:disabled) {
  transform: scale(0.9);
}

.hug-btn.hugged {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.hug-btn:disabled {
  cursor: default;
}

.hug-emoji {
  font-size: 32px;
}

.hug-text {
  font-size: 14px;
  font-weight: 500;
}

.hug-count {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 12px;
}

.share-footer {
  text-align: center;
}

.footer-text {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.download-btn {
  padding: 10px 28px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-radius: var(--radius-xl);
  font-size: 14px;
  border: 1px solid var(--border-light);
}
</style>
