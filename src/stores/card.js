import { defineStore } from 'pinia'
import aiTranslationModule from '@/ai/aiTranslation.js'
import cardGenerationModule from '@/card/cardGeneration.js'

export const useCardStore = defineStore('card', {
  state: () => ({
    currentCard: null,
    aiResult: null,
    translating: false,
    generating: false
  }),

  getters: {
    hasCard: (state) => !!state.currentCard,
    hasAiResult: (state) => !!state.aiResult
  },

  actions: {
    async translateText(text) {
      this.translating = true
      this.aiResult = null
      try {
        const result = await aiTranslationModule.translateText(text)
        this.aiResult = result
        return result
      } catch (e) {
        console.error('Translate error:', e)
        const fallback = aiTranslationModule.getLocalTemplate(text)
        this.aiResult = fallback
        return fallback
      } finally {
        this.translating = false
      }
    },

    async generateCard(postId, aiResult) {
      this.generating = true
      try {
        const card = await cardGenerationModule.createCard(postId, aiResult)
        this.currentCard = card
        return card
      } catch (e) {
        console.error('Generate card error:', e)
        throw e
      } finally {
        this.generating = false
      }
    },

    async updateCard(cardId, updates) {
      const card = await cardGenerationModule.updateCard(cardId, updates)
      if (this.currentCard?.id === cardId) {
        this.currentCard = card
      }
      return card
    },

    async deleteCard(cardId) {
      await cardGenerationModule.deleteCard(cardId)
      if (this.currentCard?.id === cardId) {
        this.currentCard = null
      }
    },

    async incrementHug(cardId) {
      return await cardGenerationModule.incrementHug(cardId)
    },

    generateShareLink(shareId) {
      return cardGenerationModule.generateShareLink(shareId)
    },

    reset() {
      this.currentCard = null
      this.aiResult = null
    }
  }
})
