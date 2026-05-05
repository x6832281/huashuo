<template>
  <div class="square-view">
    <div class="square-header">
      <h2 class="square-title">广场</h2>
      <p class="square-subtitle">看看大家都在说什么</p>
    </div>

    <div class="mood-filter">
      <button
        v-for="mood in squareStore.moodBands"
        :key="mood.value"
        class="filter-chip"
        :class="{ active: squareStore.moodFilter === mood.value }"
        @click="squareStore.setMoodFilter(mood.value)"
      >
        <span class="filter-emoji">{{ mood.emoji }}</span>
        <span class="filter-label">{{ mood.label }}</span>
      </button>
    </div>

    <div class="post-list" v-if="squareStore.posts.length > 0">
      <SquarePostItem
        v-for="post in squareStore.posts"
        :key="post.id"
        :post="post"
        @need-login="showLoginPrompt = true"
      />
      <div class="load-more" v-if="squareStore.hasMore">
        <button
          class="load-btn"
          :disabled="squareStore.loading"
          @click="squareStore.fetchPosts()"
        >
          {{ squareStore.loading ? '加载中...' : '加载更多' }}
        </button>
      </div>
      <div class="list-end" v-else>
        <span class="end-icon">🌙</span>
        <span class="end-text">已经到底了</span>
      </div>
    </div>

    <div class="loading-state" v-else-if="squareStore.loading">
      <div class="loading-spinner"></div>
      <p class="loading-text">正在加载广场...</p>
    </div>

    <div class="empty-state" v-else>
      <span class="empty-icon">🌌</span>
      <p class="empty-text">广场还没有心事</p>
      <p class="empty-hint">成为第一个分享的人吧</p>
      <button class="empty-btn" @click="goCard">写下心事</button>
    </div>

    <LoginPrompt :visible="showLoginPrompt" @close="showLoginPrompt = false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSquareStore } from '@/stores/square'
import SquarePostItem from '@/components/SquarePostItem.vue'
import LoginPrompt from '@/components/LoginPrompt.vue'

const router = useRouter()
const squareStore = useSquareStore()
const showLoginPrompt = ref(false)

function goCard() {
  router.push('/card')
}

onMounted(() => {
  squareStore.fetchPosts(true)
})
</script>

<style scoped>
.square-view {
  padding: 24px 20px;
  min-height: 100%;
  padding-bottom: 100px;
}

.square-header {
  text-align: center;
  margin-bottom: 20px;
}

.square-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 2px;
  margin-bottom: 4px;
}

.square-subtitle {
  font-size: 13px;
  color: var(--text-muted);
  letter-spacing: 1px;
}

.mood-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}

.mood-filter::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-subtle);
  white-space: nowrap;
  transition: var(--transition-gentle);
  flex-shrink: 0;
}

.filter-chip.active {
  background: var(--accent-warm);
  color: var(--bg-primary);
  border-color: var(--accent-warm);
}

.filter-emoji {
  font-size: 14px;
}

.filter-label {
  font-size: 13px;
  font-weight: 500;
}

.filter-chip.active .filter-label {
  color: var(--bg-primary);
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.load-more {
  text-align: center;
  padding: 16px 0;
}

.load-btn {
  padding: 10px 32px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  font-size: 14px;
  color: var(--text-secondary);
  transition: var(--transition-gentle);
}

.load-btn:disabled {
  opacity: 0.5;
}

.load-btn:not(:disabled):active {
  transform: scale(0.95);
}

.list-end {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;
  gap: 8px;
}

.end-icon {
  font-size: 24px;
  opacity: 0.4;
}

.end-text {
  font-size: 12px;
  color: var(--text-muted);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border-subtle);
  border-top-color: var(--accent-warm);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 14px;
  color: var(--text-muted);
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
  font-size: 15px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.empty-hint {
  font-size: 13px;
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
  transition: var(--transition-gentle);
}

.empty-btn:active {
  transform: scale(0.95);
}
</style>
