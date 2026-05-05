<template>
  <div class="sensitive-warning" v-if="warnings.length > 0">
    <span class="warn-icon">⚠️</span>
    <div class="warn-content">
      <p class="warn-text" v-for="(w, i) in warnings" :key="i">{{ w }}，请注意隐私安全</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  warnings: { type: Array, default: () => [] }
})
</script>

<style scoped>
.sensitive-warning {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(232, 160, 191, 0.08);
  border-radius: var(--radius-sm);
  margin-top: 10px;
  border: 1px solid rgba(232, 160, 191, 0.15);
}

.warn-icon {
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 1px;
}

.warn-content {
  flex: 1;
}

.warn-text {
  font-size: 12px;
  color: var(--accent-rose);
  line-height: 1.5;
}
</style>
