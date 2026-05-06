<template>
  <div class="echo-view">
    <transition name="slide-down">
      <div v-if="newHugNotification" class="hug-notification">
        <span class="hug-notification-icon">🤗</span>
        <span class="hug-notification-text">{{ newHugNotification }}</span>
      </div>
    </transition>

    <div class="echo-header">
      <p class="echo-subtitle">来自远方的温暖</p>
    </div>

    <div class="echo-stats" v-if="hugStore.statistics.total_cards > 0">
      <div class="stat-row">
        <span class="stat-num">{{ hugStore.totalHugs }}</span>
        <span class="stat-unit">个拥抱</span>
      </div>
      <p class="stat-desc">共 {{ hugStore.statistics.total_cards }} 张卡片收到了温暖</p>
    </div>

    <div class="echo-list" v-if="hugStore.echoData.length > 0">
      <div
        v-for="card in hugStore.echoData"
        :key="card.id"
        class="echo-card"
      >
        <div class="echo-poem">{{ card.ai_poem }}</div>
        <div class="echo-hugs">
          <span class="hug-icon">🤗</span>
          <span class="hug-count">{{ card.hugs_count }}</span>
        </div>
        <div class="echo-time">{{ formatTime(card.created_at) }}</div>
      </div>
    </div>

    <div class="empty-state" v-else>
      <span class="empty-icon">💫</span>
      <p class="empty-text">还没有回声，分享卡片后等待拥抱吧</p>
      <button class="empty-btn" @click="goCard">生成卡片</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useHugStore } from '@/stores/hug'

const router = useRouter()
const hugStore = useHugStore()
const newHugNotification = ref('')
let previousTotalHugs = 0
let pollTimer = null

function checkForNewHugs() {
  const currentTotal = hugStore.totalHugs
  if (previousTotalHugs > 0 && currentTotal > previousTotalHugs) {
    const diff = currentTotal - previousTotalHugs
    newHugNotification.value = `收到 ${diff} 个新拥抱`
    setTimeout(() => {
      newHugNotification.value = ''
    }, 3000)
  }
  previousTotalHugs = currentTotal
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return d.getMonth() + 1 + '月' + d.getDate() + '日'
}

function goCard() {
  router.push('/card')
}

onMounted(async () => {
  await hugStore.loadEchoData()
  previousTotalHugs = hugStore.totalHugs
  pollTimer = setInterval(async () => {
    await hugStore.fetchHugUpdates()
    checkForNewHugs()
  }, 30000)
})

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
  }
})
</script>

<style scoped>
.echo-view {
  padding: 24px 20px;
  min-height: 100%;
  position: relative;
}

.hug-notification {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, var(--accent-warm), #e8a87c);
  color: var(--bg-primary);
  padding: 10px 20px;
  border-radius: var(--radius-xl);
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 100;
  box-shadow: 0 4px 16px rgba(240, 194, 127, 0.3);
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.4s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.echo-header {
  text-align: center;
  margin-bottom: 8px;
}

.echo-subtitle {
  font-size: 13px;
  color: var(--text-muted);
  letter-spacing: 2px;
}

.echo-stats {
  text-align: center;
  padding: 24px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  margin-bottom: 24px;
  border: 1px solid var(--border-subtle);
}

.stat-row {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  margin-bottom: 4px;
}

.stat-num {
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 700;
  color: var(--accent-warm);
}

.stat-unit {
  font-size: 14px;
  color: var(--text-secondary);
}

.stat-desc {
  font-size: 12px;
  color: var(--text-muted);
}

.echo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.echo-card {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 16px;
  border: 1px solid var(--border-subtle);
  animation: fadeIn 0.4s ease;
}

.echo-poem {
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--accent-lavender);
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.echo-hugs {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hug-icon {
  font-size: 18px;
}

.hug-count {
  font-size: 14px;
  color: var(--accent-warm);
  font-weight: 600;
}

.echo-time {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 8px;
  text-align: right;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.empty-text {
  font-size: 14px;
  color: var(--text-muted);
  margin-bottom: 20px;
}

.empty-btn {
  padding: 10px 24px;
  background: var(--accent-warm);
  color: var(--bg-primary);
  border-radius: var(--radius-xl);
  font-size: 14px;
  font-weight: 500;
}
</style>
