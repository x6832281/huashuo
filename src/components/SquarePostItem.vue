<template>
  <div class="square-post" :class="`mood-${post.mood_band}`">
    <div class="post-header">
      <span class="post-avatar">{{ post.emoji || '🌙' }}</span>
      <span class="post-nickname">{{ post.nickname || '匿名' }}</span>
      <span class="post-mood-tag" :class="`tag-${post.mood_band}`">{{ moodLabel }}</span>
    </div>
    <div class="post-content">{{ post.content_text }}</div>
    <div class="post-actions">
      <button class="action-btn" :class="{ liked }" @click="handleLike">
        <span class="action-icon">{{ liked ? '🫂' : '🤗' }}</span>
        <span class="action-count">{{ post.hugs_count || 0 }}</span>
      </button>
      <button class="action-btn" @click="toggleComments">
        <span class="action-icon">💬</span>
        <span class="action-count">{{ commentCount }}</span>
      </button>
      <span class="post-time">{{ formattedTime }}</span>
    </div>

    <div class="comments-section" v-if="showComments">
      <div class="comment-list" v-if="comments.length > 0">
        <div class="comment-item" v-for="c in comments" :key="c.id">
          <span class="comment-avatar">{{ c.emoji || '🌙' }}</span>
          <div class="comment-body">
            <span class="comment-name">{{ c.nickname || '匿名' }}</span>
            <span class="comment-text">{{ c.content }}</span>
          </div>
        </div>
      </div>
      <div class="comment-empty" v-else-if="!squareStore.loadingComments[post.id]">
        <span>还没有评论，来说点什么吧</span>
      </div>
      <div class="comment-input-wrap">
        <input
          class="comment-input"
          v-model="commentText"
          placeholder="写条评论..."
          maxlength="500"
          @keyup.enter="handleComment"
        />
        <button class="comment-send" :disabled="!commentText.trim()" @click="handleComment">
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSquareStore } from '@/stores/square'
import { useIdentityStore } from '@/stores/identity'

const props = defineProps({
  post: { type: Object, required: true },
})

const emit = defineEmits(['needLogin'])

const squareStore = useSquareStore()
const identityStore = useIdentityStore()

const liked = ref(false)
const showComments = ref(false)
const commentText = ref('')

const moodLabel = computed(() => {
  const labels = { 0: '🌧️ 悲伤', 1: '🍃 平静', 2: '☀️ 开心' }
  return labels[props.post.mood_band] || '🍃 平静'
})

const comments = computed(() => squareStore.commentsMap[props.post.id] || [])
const commentCount = computed(() => comments.value.length)

const formattedTime = computed(() => {
  if (!props.post.created_at) return ''
  const d = new Date(props.post.created_at)
  const now = new Date()
  const diff = now - d
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'
  return (d.getMonth() + 1) + '月' + d.getDate() + '日'
})

function handleLike() {
  if (liked.value) return
  if (!identityStore.hasIdentity) {
    emit('needLogin')
    return
  }
  const deviceId = squareStore.getDeviceId()
  squareStore.likePost(props.post.id, deviceId).then((data) => {
    if (data.liked) liked.value = true
  }).catch(() => {})
}

function toggleComments() {
  showComments.value = !showComments.value
  if (showComments.value && comments.value.length === 0) {
    squareStore.fetchComments(props.post.id)
  }
}

function handleComment() {
  if (!commentText.value.trim()) return
  if (!identityStore.hasIdentity) {
    emit('needLogin')
    return
  }
  squareStore.addComment(props.post.id, {
    content: commentText.value.trim(),
    nickname: identityStore.currentIdentity?.nickname || '匿名',
    emoji: identityStore.currentIdentity?.emoji || '🌙',
  }).then(() => {
    commentText.value = ''
  }).catch(() => {})
}
</script>

<style scoped>
.square-post {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 16px;
  border: 1px solid var(--border-subtle);
  animation: fadeIn 0.4s ease;
  transition: var(--transition-gentle);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.post-avatar {
  font-size: 20px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: 50%;
}

.post-nickname {
  font-size: 13px;
  color: var(--text-secondary);
  flex: 1;
}

.post-mood-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
}

.tag-0 { color: var(--mood-low); }
.tag-1 { color: var(--mood-mid); }
.tag-2 { color: var(--mood-high); }

.post-content {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-primary);
  margin-bottom: 12px;
  word-break: break-word;
}

.mood-0 .post-content { color: var(--mood-low); }
.mood-1 .post-content { color: var(--accent-lavender); }
.mood-2 .post-content { color: var(--mood-high); }

.post-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: var(--transition-gentle);
}

.action-btn:active {
  transform: scale(0.9);
}

.action-btn.liked {
  opacity: 0.7;
}

.action-icon {
  font-size: 16px;
}

.action-count {
  font-size: 12px;
  color: var(--text-muted);
}

.post-time {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-muted);
}

.comments-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-subtle);
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.comment-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.comment-avatar {
  font-size: 14px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: 50%;
  flex-shrink: 0;
}

.comment-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.comment-name {
  font-size: 11px;
  color: var(--text-muted);
}

.comment-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.comment-empty {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  padding: 8px 0;
}

.comment-input-wrap {
  display: flex;
  gap: 8px;
  align-items: center;
}

.comment-input {
  flex: 1;
  padding: 8px 12px;
  background: var(--bg-input);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  font-size: 13px;
  color: var(--text-primary);
}

.comment-input::placeholder {
  color: var(--text-muted);
}

.comment-send {
  padding: 8px 14px;
  background: var(--accent-warm);
  color: var(--bg-primary);
  border-radius: var(--radius-xl);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  transition: var(--transition-gentle);
}

.comment-send:disabled {
  opacity: 0.4;
}

.comment-send:not(:disabled):active {
  transform: scale(0.95);
}
</style>
