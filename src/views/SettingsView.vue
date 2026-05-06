<template>
  <div class="settings-view">
    <section class="settings-section">
      <h3 class="section-title">身份管理</h3>
      <div class="identity-list">
        <div
          v-for="identity in identityStore.identityList"
          :key="identity.id"
          class="identity-item"
          :class="{ active: identity.id === identityStore.currentIdentity?.id, archived: identity.archived_at }"
          @click="switchTo(identity)"
        >
          <span class="identity-emoji">{{ identity.emoji }}</span>
          <div class="identity-info">
            <span class="identity-name">{{ identity.nickname }}</span>
            <span class="identity-status">{{ identity.archived_at ? '已归档' : '使用中' }}</span>
          </div>
          <div class="identity-actions" v-if="!identity.archived_at">
            <button class="icon-btn" @click.stop="archiveIdentity(identity.id)" title="归档">📦</button>
          </div>
          <div class="identity-actions" v-else>
            <button class="icon-btn" @click.stop="deleteIdentity(identity.id)" title="删除">🗑️</button>
          </div>
        </div>
      </div>

      <button class="add-btn" @click="showCreate = true" v-if="!showCreate">
        + 新建身份
      </button>

      <div class="create-form" v-if="showCreate">
        <div class="form-row">
          <input
            v-model="newNickname"
            class="form-input"
            placeholder="昵称（2-8字）"
            maxlength="8"
          />
          <div class="emoji-picker">
            <button
              v-for="e in emojiOptions"
              :key="e"
              class="emoji-option"
              :class="{ active: newEmoji === e }"
              @click="newEmoji = e"
            >{{ e }}</button>
          </div>
        </div>
        <div class="form-actions">
          <button class="cancel-btn" @click="cancelCreate">取消</button>
          <button class="confirm-btn" @click="createIdentity" :disabled="!canCreate">创建</button>
        </div>
      </div>
    </section>

    <section class="settings-section">
      <h3 class="section-title">数据管理</h3>
      <div class="setting-item" @click="exportData">
        <span class="setting-label">导出我的数据</span>
        <span class="setting-arrow">›</span>
      </div>
      <div class="setting-item" @click="clearAllData">
        <span class="setting-label">清除所有数据</span>
        <span class="setting-arrow">›</span>
      </div>
    </section>

    <section class="settings-section">
      <h3 class="section-title">隐私与安全</h3>
      <div class="privacy-box">
        <p>🔒 你的隐私是我们的底线</p>
        <ul>
          <li>所有心事内容<strong>仅存储在你的设备本地</strong>，不会上传到服务器</li>
          <li>AI加密翻译后的卡片内容<strong>不包含任何原文信息</strong></li>
          <li>身份信息<strong>匿名化处理</strong>，无法关联到真实身份</li>
          <li>网页端送拥抱功能<strong>无需登录</strong>，通过设备指纹去重</li>
        </ul>
      </div>
    </section>

    <section class="settings-section">
      <h3 class="section-title">反馈与建议</h3>
      <div class="feedback-box">
        <textarea
          v-model="feedbackText"
          class="feedback-input"
          placeholder="有任何建议或问题，欢迎告诉我们..."
          maxlength="500"
        ></textarea>
        <div class="feedback-footer">
          <span class="feedback-count">{{ feedbackText.length }}/500</span>
          <button class="confirm-btn" @click="submitFeedback" :disabled="!feedbackText.trim()">提交</button>
        </div>
      </div>
    </section>

    <section class="settings-section">
      <h3 class="section-title">关于</h3>
      <div class="about-info">
        <p class="about-name">话说APP</p>
        <p class="about-version">V1.0.0</p>
        <p class="about-desc">社恐/高敏感人群专属·零压力匿名情绪记录与加密分享工具</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useIdentityStore } from '@/stores/identity'
import localStorageModule from '@/storage/localStorage.js'

const identityStore = useIdentityStore()

const showCreate = ref(false)
const newNickname = ref('')
const newEmoji = ref('😊')
const feedbackText = ref('')

const emojiOptions = ['😊', '🌙', '🌸', '🍀', '🎵', '🦋', '🐱', '☕']

const canCreate = computed(() => {
  const len = newNickname.value.replace(/[\u4e00-\u9fff]/g, 'xx').length
  return len >= 2 && len <= 8
})

async function switchTo(identity) {
  if (identity.archived_at) return
  if (identity.id !== identityStore.currentIdentity?.id) {
    await identityStore.switchIdentity(identity.id)
  }
}

async function archiveIdentity(id) {
  await identityStore.archiveIdentity(id)
}

async function deleteIdentity(id) {
  await identityStore.deleteIdentity(id)
}

function cancelCreate() {
  showCreate.value = false
  newNickname.value = ''
  newEmoji.value = '😊'
}

async function createIdentity() {
  if (!canCreate.value) return
  await identityStore.createIdentity(newNickname.value, newEmoji.value)
  cancelCreate()
}

async function exportData() {
  try {
    const identities = await localStorageModule.getAllData('identities')
    const posts = await localStorageModule.getAllData('posts')
    const cards = await localStorageModule.getAllData('cards')
    const exportObj = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      identities,
      posts,
      cards,
    }
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `huashuo_backup_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('导出数据失败:', error)
    alert('导出失败，请重试')
  }
}

function submitFeedback() {
  if (!feedbackText.value.trim()) return
  const feedbacks = JSON.parse(localStorage.getItem('huashuo_feedbacks') || '[]')
  feedbacks.push({
    text: feedbackText.value.trim(),
    created_at: new Date().toISOString(),
  })
  localStorage.setItem('huashuo_feedbacks', JSON.stringify(feedbacks))
  feedbackText.value = ''
  alert('感谢你的反馈！')
}

async function clearAllData() {
  if (confirm('确定清除所有数据？此操作不可恢复。')) {
    await localStorageModule.clearData('identities')
    await localStorageModule.clearData('posts')
    await localStorageModule.clearData('cards')
    await identityStore.init()
    window.location.reload()
  }
}
</script>

<style scoped>
.settings-view {
  padding: 24px 20px;
  min-height: 100%;
}

.settings-section {
  margin-bottom: 28px;
}

.section-title {
  font-family: var(--font-display);
  font-size: 14px;
  color: var(--text-muted);
  letter-spacing: 2px;
  margin-bottom: 12px;
  text-transform: uppercase;
}

.identity-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.identity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  transition: var(--transition-gentle);
  cursor: pointer;
}

.identity-item.active {
  border-color: var(--accent-warm);
  background: rgba(240, 194, 127, 0.05);
}

.identity-item.archived {
  opacity: 0.5;
}

.identity-emoji {
  font-size: 24px;
}

.identity-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.identity-name {
  font-size: 15px;
  color: var(--text-primary);
}

.identity-status {
  font-size: 11px;
  color: var(--text-muted);
}

.icon-btn {
  font-size: 16px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
}

.add-btn {
  width: 100%;
  padding: 12px;
  border-radius: var(--radius-md);
  font-size: 14px;
  color: var(--accent-warm);
  background: var(--bg-card);
  border: 1px dashed var(--border-light);
  transition: var(--transition-gentle);
}

.add-btn:active {
  transform: scale(0.98);
}

.create-form {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 16px;
  border: 1px solid var(--accent-warm);
  animation: fadeIn 0.3s ease;
}

.form-row {
  margin-bottom: 12px;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-primary);
  border: 1px solid var(--border-light);
}

.emoji-picker {
  display: flex;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.emoji-option {
  font-size: 20px;
  padding: 6px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  transition: var(--transition-gentle);
}

.emoji-option.active {
  background: var(--accent-warm);
  transform: scale(1.1);
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.cancel-btn,
.confirm-btn {
  padding: 8px 20px;
  border-radius: var(--radius-xl);
  font-size: 13px;
  font-weight: 500;
}

.cancel-btn {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.confirm-btn {
  background: var(--accent-warm);
  color: var(--bg-primary);
}

.confirm-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: var(--transition-gentle);
}

.setting-item:active {
  transform: scale(0.98);
}

.setting-label {
  font-size: 14px;
  color: var(--text-primary);
}

.setting-arrow {
  color: var(--text-muted);
  font-size: 18px;
}

.about-info {
  text-align: center;
  padding: 20px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}

.about-name {
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--text-primary);
  letter-spacing: 3px;
  margin-bottom: 4px;
}

.about-version {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.about-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.privacy-box {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  padding: 16px;
}

.privacy-box p {
  font-size: 14px;
  color: var(--accent-warm);
  margin-bottom: 10px;
}

.privacy-box ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.privacy-box li {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.8;
  padding-left: 16px;
  position: relative;
}

.privacy-box li::before {
  content: '·';
  position: absolute;
  left: 0;
  color: var(--accent-warm);
}

.feedback-box {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
  padding: 16px;
}

.feedback-input {
  width: 100%;
  min-height: 80px;
  padding: 10px 14px;
  background: var(--bg-input);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-primary);
  border: 1px solid var(--border-light);
  resize: vertical;
  font-family: inherit;
}

.feedback-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.feedback-count {
  font-size: 12px;
  color: var(--text-muted);
}
</style>
