<template>
  <div class="app-shell">
    <header class="app-header" v-if="!hideTab">
      <h1 class="app-title">{{ currentTitle }}</h1>
      <div class="header-identity" v-if="identityStore.hasIdentity" @click="goSettings">
        <span class="identity-emoji">{{ identityStore.emoji }}</span>
      </div>
    </header>

    <main class="app-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <nav class="app-tab-bar" v-if="!hideTab">
      <router-link
        v-for="tab in tabs"
        :key="tab.name"
        :to="tab.to"
        class="tab-item"
        :class="{ active: activeTab === tab.name }"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
      </router-link>
    </nav>

    <HugNotification />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useIdentityStore } from '@/stores/identity'
import { useHugStore } from '@/stores/hug'
import HugNotification from '@/components/HugNotification.vue'

const route = useRoute()
const identityStore = useIdentityStore()
const hugStore = useHugStore()

const tabs = [
  { name: 'home', to: '/', icon: '🌙', label: '心事' },
  { name: 'treeHole', to: '/tree-hole', icon: '🌳', label: '树洞' },
  { name: 'card', to: '/card', icon: '🎴', label: '卡片' },
  { name: 'echo', to: '/echo', icon: '💫', label: '回声' },
  { name: 'settings', to: '/settings', icon: '⚙️', label: '设置' }
]

const activeTab = computed(() => route.meta.tab || 'home')
const hideTab = computed(() => route.meta.hideTab)
const currentTitle = computed(() => route.meta.title || '话说')

function goSettings() {
  if (route.name !== 'settings') {
    window.location.hash = '#/settings'
  }
}

onMounted(async () => {
  await identityStore.init()
  hugStore.fetchHugUpdates()
})
</script>

<style scoped>
.app-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.app-header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.app-title {
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 2px;
}

.header-identity {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border-radius: 50%;
  cursor: pointer;
  transition: var(--transition-gentle);
}

.header-identity:active {
  transform: scale(0.9);
}

.identity-emoji {
  font-size: 18px;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

.app-tab-bar {
  height: var(--tab-height);
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
  padding-bottom: env(safe-area-inset-bottom);
  position: relative;
  z-index: 10;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 0;
  min-width: 56px;
  text-decoration: none;
  color: var(--text-muted);
  transition: var(--transition-gentle);
  border-radius: var(--radius-sm);
}

.tab-item.active {
  color: var(--accent-warm);
}

.tab-item:active {
  transform: scale(0.9);
}

.tab-icon {
  font-size: 22px;
  line-height: 1;
  transition: var(--transition-bounce);
}

.tab-item.active .tab-icon {
  transform: scale(1.15);
}

.tab-label {
  font-size: 10px;
  letter-spacing: 0.5px;
}
</style>
