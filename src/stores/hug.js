import { defineStore } from 'pinia'
import hugFeedbackModule from '@/hug/hugFeedback.js'

export const useHugStore = defineStore('hug', {
  state: () => ({
    echoData: [],
    statistics: { total_cards: 0, total_hugs: 0, hug_cards_count: 0, avg_hugs: 0 },
    newHugs: [],
    loading: false,
    showNotification: false,
    notificationData: null
  }),

  getters: {
    hasNewHugs: (state) => state.newHugs.length > 0,
    totalHugs: (state) => state.statistics.total_hugs
  },

  actions: {
    async loadEchoData() {
      this.loading = true
      try {
        this.echoData = await hugFeedbackModule.getEchoPageData()
        this.statistics = await hugFeedbackModule.getHugStatistics()
      } catch (e) {
        console.error('Load echo data error:', e)
      } finally {
        this.loading = false
      }
    },

    async fetchHugUpdates() {
      try {
        const result = await hugFeedbackModule.fetchAndUpdateHugCounts()
        if (result.newHugs && result.newHugs.length > 0) {
          this.newHugs = result.newHugs
          this.notificationData = result.newHugs[0]
          this.showNotification = true
          setTimeout(() => { this.showNotification = false }, 3000)
        }
        await this.loadEchoData()
        return result
      } catch (e) {
        console.error('Fetch hug updates error:', e)
      }
    },

    async incrementHugLocally(cardId) {
      return await hugFeedbackModule.incrementHugLocally(cardId)
    },

    dismissNotification() {
      this.showNotification = false
      this.notificationData = null
    }
  }
})
