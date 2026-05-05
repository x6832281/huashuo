<template>
  <div class="card-view">
    <div class="card-steps" v-if="!cardStore.hasCard">
      <div class="step" v-if="!cardStore.hasAiResult">
        <h2 class="step-title">AI 情绪加密</h2>
        <p class="step-desc">将心事翻译成诗句，保护你的隐私</p>

        <div class="input-area" v-if="post">
          <div class="post-preview">
            <span class="mood-badge" :class="'mood-' + post.mood_band_final">
              {{ moodIcons[post.mood_band_final] }}
            </span>
            <p class="post-text">{{ post.content_text }}</p>
          </div>
        </div>

        <div class="no-post" v-else>
          <p class="no-post-text">请先从树洞选择一件心事</p>
          <button class="go-btn" @click="goTreeHole">前往树洞</button>
        </div>

        <button
          class="translate-btn"
          v-if="post"
          :disabled="cardStore.translating"
          @click="translate"
        >
          <span v-if="cardStore.translating" class="loading-dot">...</span>
          <span v-else>开始翻译 ✨</span>
        </button>
      </div>

      <div class="step" v-else>
        <h2 class="step-title">翻译结果</h2>

        <div class="ai-result">
          <div class="poem-card">
            <span class="mood-badge" :class="'mood-' + cardStore.aiResult.mood_band">
              {{ moodIcons[cardStore.aiResult.mood_band] }}
            </span>
            <p class="poem-text">{{ cardStore.aiResult.ai_poem }}</p>
          </div>

          <div class="sticker-section">
            <h3 class="sticker-title">选择表情包</h3>
            <div class="sticker-options">
              <button
                v-for="(sticker, type) in cardStore.aiResult.stickers"
                :key="type"
                class="sticker-btn"
                :class="{ active: selectedSticker === type }"
                @click="selectedSticker = type"
              >
                <span class="sticker-text">{{ sticker }}</span>
                <span class="sticker-type">{{ stickerLabels[type] }}</span>
              </button>
            </div>
          </div>
        </div>

        <button class="generate-btn" :disabled="cardStore.generating" @click="generateCard">
          <span v-if="cardStore.generating">生成中...</span>
          <span v-else>生成卡片 🎴</span>
        </button>
      </div>
    </div>

    <div class="card-result" v-else>
      <CardPreview :card="cardStore.currentCard" />

      <div class="card-actions">
        <button class="action-btn share" @click="showShare = true">分享卡片</button>
        <button class="action-btn new" @click="resetCard">再来一张</button>
      </div>

      <ShareDialog
        v-if="showShare"
        :card="cardStore.currentCard"
        @close="showShare = false"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEmotionStore } from '@/stores/emotion'
import { useCardStore } from '@/stores/card'
import CardPreview from '@/components/CardPreview.vue'
import ShareDialog from '@/components/ShareDialog.vue'

const route = useRoute()
const router = useRouter()
const emotionStore = useEmotionStore()
const cardStore = useCardStore()

const selectedSticker = ref('comfort')
const showShare = ref(false)

const moodIcons = { 0: '🌧️', 1: '🌤️', 2: '☀️' }
const stickerLabels = { comfort: '安慰', gossip: '吃瓜', roast: '损友' }

const post = computed(() => {
  const postId = route.params.postId
  if (!postId) return emotionStore.activePosts[0]
  return emotionStore.posts.find(p => p.id === postId)
})

async function translate() {
  if (!post.value) return
  await cardStore.translateText(post.value.content_text)
}

async function generateCard() {
  if (!post.value || !cardStore.aiResult) return
  const aiResult = {
    ...cardStore.aiResult,
    sticker_selected_type: selectedSticker.value
  }
  await cardStore.generateCard(post.value.id, aiResult)
}

function resetCard() {
  cardStore.reset()
  selectedSticker.value = 'comfort'
}

function goTreeHole() {
  router.push('/tree-hole')
}

onMounted(() => {
  if (emotionStore.posts.length === 0) {
    emotionStore.loadPosts()
  }
})

watch(() => route.params.postId, () => {
  cardStore.reset()
  selectedSticker.value = 'comfort'
})
</script>

<style scoped>
.card-view {
  padding: 24px 20px;
  min-height: 100%;
}

.step-title {
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--text-primary);
  margin-bottom: 6px;
  letter-spacing: 1px;
}

.step-desc {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 24px;
}

.post-preview {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 16px;
  border: 1px solid var(--border-subtle);
  margin-bottom: 20px;
}

.mood-badge {
  display: inline-block;
  font-size: 14px;
  margin-bottom: 8px;
}

.mood-badge.mood-0 { color: var(--mood-low); }
.mood-badge.mood-1 { color: var(--mood-mid); }
.mood-badge.mood-2 { color: var(--mood-high); }

.post-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.no-post {
  text-align: center;
  padding: 40px 0;
}

.no-post-text {
  color: var(--text-muted);
  font-size: 14px;
  margin-bottom: 16px;
}

.go-btn {
  padding: 10px 24px;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-radius: var(--radius-xl);
  font-size: 14px;
  border: 1px solid var(--border-light);
}

.translate-btn,
.generate-btn {
  width: 100%;
  padding: 14px;
  border-radius: var(--radius-lg);
  font-size: 15px;
  font-weight: 500;
  transition: var(--transition-gentle);
  margin-top: 8px;
}

.translate-btn {
  background: linear-gradient(135deg, var(--accent-warm), #e8a060);
  color: var(--bg-primary);
}

.generate-btn {
  background: linear-gradient(135deg, var(--accent-teal), #5eb8b8);
  color: var(--bg-primary);
}

.translate-btn:disabled,
.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.translate-btn:active:not(:disabled),
.generate-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.ai-result {
  animation: fadeIn 0.4s ease;
}

.poem-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 24px;
  text-align: center;
  border: 1px solid var(--border-subtle);
  margin-bottom: 20px;
}

.poem-text {
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--accent-warm);
  letter-spacing: 3px;
  line-height: 1.8;
}

.sticker-section {
  margin-bottom: 20px;
}

.sticker-title {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.sticker-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sticker-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  transition: var(--transition-gentle);
}

.sticker-btn.active {
  border-color: var(--accent-warm);
  background: rgba(240, 194, 127, 0.08);
}

.sticker-btn:active {
  transform: scale(0.98);
}

.sticker-text {
  font-size: 14px;
  color: var(--text-primary);
}

.sticker-type {
  font-size: 12px;
  color: var(--text-muted);
  padding: 2px 10px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-xl);
}

.sticker-btn.active .sticker-type {
  background: var(--accent-warm);
  color: var(--bg-primary);
}

.card-result {
  animation: fadeIn 0.5s ease;
}

.card-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.action-btn {
  flex: 1;
  padding: 14px;
  border-radius: var(--radius-lg);
  font-size: 15px;
  font-weight: 500;
  transition: var(--transition-gentle);
}

.action-btn:active {
  transform: scale(0.97);
}

.action-btn.share {
  background: linear-gradient(135deg, var(--accent-warm), #e8a060);
  color: var(--bg-primary);
}

.action-btn.new {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
}

.loading-dot {
  animation: pulse 1s ease-in-out infinite;
}
</style>
