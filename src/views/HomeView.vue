<template>
  <div class="home-view">
    <div class="home-hero">
      <div class="hero-glow"></div>
      <p class="hero-greeting">{{ greeting }}</p>
      <p class="hero-identity" v-if="identityStore.hasIdentity">
        {{ identityStore.emoji }} {{ identityStore.nickname }}
      </p>
    </div>

    <div class="home-actions">
      <button class="action-btn primary" @click="startWriting">
        <span class="action-icon">✍️</span>
        <span class="action-text">写下心事</span>
      </button>
      <button class="action-btn secondary" @click="goTreeHole">
        <span class="action-icon">🌳</span>
        <span class="action-text">进入树洞</span>
      </button>
    </div>

    <div class="home-stats" v-if="stats.total > 0">
      <div class="stat-item">
        <span class="stat-value">{{ stats.total }}</span>
        <span class="stat-label">心事</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.cards }}</span>
        <span class="stat-label">卡片</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value">{{ stats.hugs }}</span>
        <span class="stat-label">拥抱</span>
      </div>
    </div>

    <PostCreateForm v-if="showForm" @close="showForm = false" @submitted="onSubmitted" />

    <div class="home-recent" v-if="recentPosts.length > 0">
      <h3 class="section-title">最近心事</h3>
      <PostListItem
        v-for="post in recentPosts"
        :key="post.id"
        :post="post"
        @click="goPost(post)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useIdentityStore } from '@/stores/identity'
import { useEmotionStore } from '@/stores/emotion'
import { useHugStore } from '@/stores/hug'
import PostCreateForm from '@/components/PostCreateForm.vue'
import PostListItem from '@/components/PostListItem.vue'

const router = useRouter()
const identityStore = useIdentityStore()
const emotionStore = useEmotionStore()
const hugStore = useHugStore()

const showForm = ref(false)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '夜深了，还在想什么呢'
  if (h < 12) return '早安，新的一天'
  if (h < 18) return '午后时光，歇一歇'
  return '晚上好，辛苦了'
})

const recentPosts = computed(() => emotionStore.activePosts.slice(0, 5))

const stats = computed(() => ({
  total: emotionStore.activePosts.length,
  cards: hugStore.echoData.length,
  hugs: hugStore.totalHugs
}))

function startWriting() {
  showForm.value = true
}

function goTreeHole() {
  router.push('/tree-hole')
}

function goPost(post) {
  router.push(`/card/${post.id}`)
}

function onSubmitted() {
  showForm.value = false
}

onMounted(async () => {
  await emotionStore.loadPosts()
  await hugStore.loadEchoData()
})
</script>

<style scoped>
.home-view {
  padding: 24px 20px;
  min-height: 100%;
}

.home-hero {
  text-align: center;
  padding: 32px 0 24px;
  position: relative;
}

.hero-glow {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(240, 194, 127, 0.08) 0%, transparent 70%);
  pointer-events: none;
}

.hero-greeting {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--text-primary);
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.hero-identity {
  font-size: 14px;
  color: var(--text-secondary);
}

.home-actions {
  display: flex;
  gap: 12px;
  margin: 16px 0 28px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  border-radius: var(--radius-lg);
  transition: var(--transition-gentle);
  font-size: 15px;
  font-weight: 500;
}

.action-btn:active {
  transform: scale(0.97);
}

.action-btn.primary {
  background: linear-gradient(135deg, var(--accent-warm), #e8a060);
  color: var(--bg-primary);
}

.action-btn.secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
}

.action-icon {
  font-size: 20px;
}

.home-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 20px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  margin-bottom: 28px;
  border: 1px solid var(--border-subtle);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  color: var(--accent-warm);
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
}

.stat-divider {
  width: 1px;
  height: 28px;
  background: var(--border-light);
}

.section-title {
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.home-recent {
  animation: fadeIn 0.4s ease;
}
</style>
