<template>
  <div class="tree-hole-view">
    <div class="filter-bar">
      <button
        v-for="f in filters"
        :key="f.value"
        class="filter-btn"
        :class="{ active: emotionStore.filter === f.value }"
        @click="emotionStore.setFilter(f.value)"
      >
        {{ f.icon }} {{ f.label }}
      </button>
    </div>

    <div class="post-list" v-if="emotionStore.filteredPosts.length > 0">
      <PostListItem
        v-for="post in emotionStore.filteredPosts"
        :key="post.id"
        :post="post"
        @click="selectPost(post)"
        @archive="archivePost(post.id)"
        @delete="deletePost(post.id)"
      />
    </div>

    <div class="empty-state" v-else>
      <span class="empty-icon">🌿</span>
      <p class="empty-text">{{ emotionStore.filter === 'all' ? '树洞空空的，写下第一件心事吧' : '这个频段还没有心事' }}</p>
      <button class="empty-btn" @click="goHome">写下心事</button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEmotionStore } from '@/stores/emotion'
import PostListItem from '@/components/PostListItem.vue'

const router = useRouter()
const emotionStore = useEmotionStore()

const filters = [
  { value: 'all', icon: '🍃', label: '全部' },
  { value: 0, icon: '🌧️', label: '低落' },
  { value: 1, icon: '🌤️', label: '波动' },
  { value: 2, icon: '☀️', label: '轻松' }
]

function selectPost(post) {
  router.push(`/card/${post.id}`)
}

function goHome() {
  router.push('/')
}

async function archivePost(postId) {
  await emotionStore.archivePost(postId)
}

async function deletePost(postId) {
  await emotionStore.deletePost(postId)
}

onMounted(() => {
  emotionStore.loadPosts()
})
</script>

<style scoped>
.tree-hole-view {
  padding: 16px 20px;
  min-height: 100%;
}

.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 4px;
}

.filter-bar::-webkit-scrollbar {
  display: none;
}

.filter-btn {
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: var(--radius-xl);
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-subtle);
  transition: var(--transition-gentle);
  white-space: nowrap;
}

.filter-btn.active {
  background: var(--accent-warm);
  color: var(--bg-primary);
  border-color: var(--accent-warm);
}

.filter-btn:active {
  transform: scale(0.95);
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
  transition: var(--transition-gentle);
}

.empty-btn:active {
  transform: scale(0.95);
}
</style>
