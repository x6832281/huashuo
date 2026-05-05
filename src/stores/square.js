import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSquareStore = defineStore('square', () => {
  const posts = ref([])
  const loading = ref(false)
  const hasMore = ref(true)
  const currentPage = ref(1)
  const moodFilter = ref(null)
  const total = ref(0)
  const commentsMap = ref({})
  const loadingComments = ref({})

  const moodBands = [
    { value: null, label: '全部', emoji: '🌈' },
    { value: 0, label: '悲伤', emoji: '🌧️' },
    { value: 1, label: '平静', emoji: '🍃' },
    { value: 2, label: '开心', emoji: '☀️' },
  ]

  const isEmpty = computed(() => !loading.value && posts.value.length === 0)

  async function fetchPosts(reset = false) {
    if (loading.value) return
    if (!reset && !hasMore.value) return

    loading.value = true

    if (reset) {
      currentPage.value = 1
      posts.value = []
      hasMore.value = true
    }

    try {
      const res = await fetch('/api/share/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood_filter: moodFilter.value,
          page: currentPage.value,
          page_size: 20,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const newPosts = data.posts || []
      total.value = data.total || 0

      if (reset) {
        posts.value = newPosts
      } else {
        posts.value = [...posts.value, ...newPosts]
      }

      if (newPosts.length < 20) {
        hasMore.value = false
      }

      currentPage.value++
    } catch (err) {
      console.error('获取广场数据失败:', err)
    } finally {
      loading.value = false
    }
  }

  async function publishPost({ content_text, mood_band, nickname, emoji, share_id }) {
    try {
      const res = await fetch('/api/share/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_text, mood_band, nickname, emoji, share_id }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      if (data.post) {
        posts.value = [data.post, ...posts.value]
        total.value++
      }
      return data.post
    } catch (err) {
      console.error('发布失败:', err)
      throw err
    }
  }

  async function likePost(postId, deviceId) {
    try {
      const res = await fetch('/api/share/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, device_id: deviceId }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const idx = posts.value.findIndex((p) => p.id === postId)
      if (idx !== -1) {
        posts.value[idx] = { ...posts.value[idx], hugs_count: data.hugs_count }
      }
      return data
    } catch (err) {
      console.error('点赞失败:', err)
      throw err
    }
  }

  async function fetchComments(postId) {
    if (loadingComments.value[postId]) return
    loadingComments.value = { ...loadingComments.value, [postId]: true }

    try {
      const res = await fetch(`/api/share/comment?post_id=${postId}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      commentsMap.value = { ...commentsMap.value, [postId]: data.comments || [] }
    } catch (err) {
      console.error('获取评论失败:', err)
    } finally {
      loadingComments.value = { ...loadingComments.value, [postId]: false }
    }
  }

  async function addComment(postId, { content, nickname, emoji }) {
    try {
      const res = await fetch('/api/share/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, content, nickname, emoji }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      const existing = commentsMap.value[postId] || []
      commentsMap.value = { ...commentsMap.value, [postId]: [...existing, data.comment] }
      return data.comment
    } catch (err) {
      console.error('评论失败:', err)
      throw err
    }
  }

  function setMoodFilter(value) {
    moodFilter.value = value
    fetchPosts(true)
  }

  function getDeviceId() {
    let id = localStorage.getItem('huashuo_device_id')
    if (!id) {
      id = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10)
      localStorage.setItem('huashuo_device_id', id)
    }
    return id
  }

  return {
    posts,
    loading,
    hasMore,
    moodFilter,
    total,
    moodBands,
    isEmpty,
    commentsMap,
    loadingComments,
    fetchPosts,
    publishPost,
    likePost,
    fetchComments,
    addComment,
    setMoodFilter,
    getDeviceId,
  }
})
