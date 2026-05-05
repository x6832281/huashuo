<template>
  <div class="card-preview">
    <div class="card-canvas-wrapper">
      <canvas ref="canvasRef" width="600" height="800" class="card-canvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  card: { type: Object, required: true }
})

const canvasRef = ref(null)

function drawCard() {
  const canvas = canvasRef.value
  if (!canvas || !props.card) return
  const ctx = canvas.getContext('2d')
  const w = 600, h = 800

  const grad = ctx.createLinearGradient(0, 0, w, h)
  grad.addColorStop(0, '#1a1a2e')
  grad.addColorStop(0.5, '#252540')
  grad.addColorStop(1, '#1a1a2e')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  ctx.strokeStyle = 'rgba(240, 194, 127, 0.15)'
  ctx.lineWidth = 1
  ctx.strokeRect(30, 30, w - 60, h - 60)

  ctx.strokeStyle = 'rgba(240, 194, 127, 0.08)'
  ctx.strokeRect(36, 36, w - 72, h - 72)

  const moodIcons = { 0: '🌧️', 1: '🌤️', 2: '☀️' }
  ctx.font = '32px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(moodIcons[props.card.mood_band] || '🌤️', w / 2, 100)

  ctx.font = '24px "Noto Serif SC", serif'
  ctx.fillStyle = '#f0c27f'
  ctx.textAlign = 'center'
  wrapText(ctx, props.card.ai_poem || '', w / 2, 200, w - 120, 40)

  const stickerMap = {
    comfort: props.card.sticker_comfort,
    gossip: props.card.sticker_gossip,
    roast: props.card.sticker_roast
  }
  const selectedType = props.card.sticker_selected_type || 'comfort'
  const stickerText = stickerMap[selectedType] || ''

  if (stickerText) {
    const stickerY = 380
    const metrics = ctx.measureText(stickerText)
    const bw = Math.min(metrics.width + 40, w - 120)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
    roundRect(ctx, (w - bw) / 2, stickerY - 20, bw, 44, 22)
    ctx.fill()

    ctx.font = '18px "Noto Sans SC", sans-serif'
    ctx.fillStyle = '#e8e6f0'
    ctx.textAlign = 'center'
    ctx.fillText(stickerText, w / 2, stickerY + 8)
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'
  ctx.fillRect(w / 2 - 60, h - 180, 120, 120)
  ctx.font = '12px monospace'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
  ctx.textAlign = 'center'
  ctx.fillText((props.card.share_id || '').slice(0, 8), w / 2, h - 115)

  ctx.font = '12px "Noto Sans SC", sans-serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
  ctx.fillText('话说 · 零压力匿名情绪记录', w / 2, h - 50)
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  let line = ''
  let lineY = y
  for (let i = 0; i < text.length; i++) {
    const testLine = line + text[i]
    if (ctx.measureText(testLine).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, lineY)
      line = text[i]
      lineY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, lineY)
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

onMounted(() => {
  drawCard()
})

watch(() => props.card, () => {
  drawCard()
}, { deep: true })
</script>

<style scoped>
.card-preview {
  display: flex;
  justify-content: center;
}

.card-canvas-wrapper {
  width: 100%;
  max-width: 360px;
}

.card-canvas {
  width: 100%;
  height: auto;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-glow);
}
</style>
