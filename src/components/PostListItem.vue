<template>
  <div class="post-item" @click="$emit('click')">
    <div class="post-header">
      <span class="mood-badge" :class="'mood-' + post.mood_band_final">
        {{ moodIcons[post.mood_band_final] }}
      </span>
      <span class="post-time">{{ formatTime(post.created_at) }}</span>
    </div>
    <p class="post-content">{{ post.content_text }}</p>
    <div class="post-footer">
      <span class="post-status" v-if="post.archived_at">已归档</span>
      <div class="post-actions">
        <button class="action-link" @click.stop="$emit('archive')" v-if="!post.archived_at">归档</button>
        <button class="action-link danger" @click.stop="$emit('delete')">删除</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  post: { type: Object, required: true }
})
defineEmits(['click', 'archive', 'delete'])

const moodIcons = { 0: '🌧️', 1: '🌤️', 2: '☀️' }

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return (d.getMonth() + 1) + '/' + d.getDate()
}
</script>

<style scoped>
.post-item {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: var(--transition-gentle);
}

.post-item:active {
  transform: scale(0.98);
  background: var(--bg-tertiary);
}

.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.mood-badge {
  font-size: 14px;
}

.mood-badge.mood-0 { color: var(--mood-low); }
.mood-badge.mood-1 { color: var(--mood-mid); }
.mood-badge.mood-2 { color: var(--mood-high); }

.post-time {
  font-size: 11px;
  color: var(--text-muted);
}

.post-content {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 8px;
}

.post-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.post-status {
  font-size: 11px;
  color: var(--text-muted);
  font-style: italic;
}

.post-actions {
  display: flex;
  gap: 12px;
}

.action-link {
  font-size: 12px;
  color: var(--text-muted);
  padding: 2px 6px;
  transition: color 0.2s;
}

.action-link:active {
  color: var(--text-primary);
}

.action-link.danger:active {
  color: var(--accent-rose);
}
</style>
