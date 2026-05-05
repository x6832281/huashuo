import { defineStore } from 'pinia'
import identityManagementModule from '@/identity/identityManagement.js'

export const useIdentityStore = defineStore('identity', {
  state: () => ({
    currentIdentity: null,
    identityList: [],
    loading: false
  }),

  getters: {
    hasIdentity: (state) => !!state.currentIdentity,
    activeIdentities: (state) => state.identityList.filter(i => !i.archived_at),
    nickname: (state) => state.currentIdentity?.nickname || '',
    emoji: (state) => state.currentIdentity?.emoji || '😊'
  },

  actions: {
    async init() {
      this.loading = true
      try {
        this.currentIdentity = await identityManagementModule.getCurrentIdentity()
        this.identityList = await identityManagementModule.getIdentityList({ activeOnly: false })
      } catch (e) {
        console.error('Identity init error:', e)
      } finally {
        this.loading = false
      }
    },

    async createIdentity(nickname, emoji) {
      const identity = await identityManagementModule.createIdentity(nickname, emoji)
      this.identityList = await identityManagementModule.getIdentityList({ activeOnly: false })
      if (!this.currentIdentity) {
        this.currentIdentity = identity
      }
      return identity
    },

    async switchIdentity(identityId) {
      await identityManagementModule.switchIdentity(identityId)
      this.currentIdentity = await identityManagementModule.getCurrentIdentity()
    },

    async archiveIdentity(identityId) {
      await identityManagementModule.archiveIdentity(identityId)
      this.identityList = await identityManagementModule.getIdentityList({ activeOnly: false })
      this.currentIdentity = await identityManagementModule.getCurrentIdentity()
    },

    async deleteIdentity(identityId) {
      await identityManagementModule.deleteIdentity(identityId)
      this.identityList = await identityManagementModule.getIdentityList({ activeOnly: false })
      this.currentIdentity = await identityManagementModule.getCurrentIdentity()
    }
  }
})
