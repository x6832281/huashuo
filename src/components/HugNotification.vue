<template>
  <Transition name="slide-down">
    <div class="hug-notification" v-if="hugStore.showNotification" @click="hugStore.dismissNotification()">
      <span class="notif-icon">🤗</span>
      <div class="notif-content">
        <p class="notif-title">收到新的拥抱</p>
        <p class="notif-desc">你的卡片收到了来自远方的温暖</p>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { useHugStore } from '@/stores/hug'

const hugStore = useHugStore()
</script>

<style scoped>
.hug-notification {
  position: fixed;
  top: 12px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--accent-warm);
  box-shadow: 0 4px 24px rgba(240, 194, 127, 0.15);
  z-index: 200;
  cursor: pointer;
}

.notif-icon {
  font-size: 24px;
}

.notif-content {
  flex: 1;
}

.notif-title {
  font-size: 14px;
  color: var(--accent-warm);
  font-weight: 500;
}

.notif-desc {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 2px;
}

.slide-down-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-40px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
