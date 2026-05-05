import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: '话说', tab: 'home' }
  },
  {
    path: '/tree-hole',
    name: 'treeHole',
    component: () => import('@/views/TreeHoleView.vue'),
    meta: { title: '情绪树洞', tab: 'treeHole' }
  },
  {
    path: '/card/:postId?',
    name: 'card',
    component: () => import('@/views/CardView.vue'),
    meta: { title: '生成卡片', tab: 'card' }
  },
  {
    path: '/square',
    name: 'square',
    component: () => import('@/views/SquareView.vue'),
    meta: { title: '广场', tab: 'square' }
  },
  {
    path: '/echo',
    name: 'echo',
    component: () => import('@/views/EchoView.vue'),
    meta: { title: '回声', tab: 'echo' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/views/SettingsView.vue'),
    meta: { title: '设置', tab: 'settings' }
  },
  {
    path: '/s/:shareId',
    name: 'share',
    component: () => import('@/views/ShareLandingView.vue'),
    meta: { title: '送拥抱', hideTab: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  document.title = to.meta.title || '话说'
})

export default router
