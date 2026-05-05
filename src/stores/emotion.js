import { defineStore } from 'pinia'
import emotionTreeHoleModule from '@/emotion/emotionTreeHole.js'
import { useIdentityStore } from './identity'

export const useEmotionStore = defineStore('emotion', {
  state: () => ({
    posts: [],
    currentPost: null,
    filter: 'all',
    loading: false
  }),

  getters: {
    filteredPosts(state) {
      if (state.filter === 'all') return state.posts
      return state.posts.filter(p => p.mood_band_final === state.filter)
    },
    activePosts: (state) => state.posts.filter(p => !p.archived_at && !p.deleted_at)
  },

  actions: {
    async loadPosts() {
      this.loading = true
      try {
        const identityStore = useIdentityStore()
        if (!identityStore.currentIdentity) return
        this.posts = await emotionTreeHoleModule.getPostList()
      } catch (e) {
        console.error('Load posts error:', e)
      } finally {
        this.loading = false
      }
    },

    async createPost(content) {
      const result = await emotionTreeHoleModule.createPost(content)
      await this.loadPosts()
      return result
    },

    async editMoodBand(postId, moodBand) {
      const post = await emotionTreeHoleModule.editMoodBand(postId, moodBand)
      await this.loadPosts()
      return post
    },

    async archivePost(postId) {
      await emotionTreeHoleModule.archivePost(postId)
      await this.loadPosts()
    },

    async restorePost(postId) {
      await emotionTreeHoleModule.restorePost(postId)
      await this.loadPosts()
    },

    async deletePost(postId) {
      await emotionTreeHoleModule.deletePost(postId)
      await this.loadPosts()
    },

    setFilter(filter) {
      this.filter = filter
    }
  }
})
