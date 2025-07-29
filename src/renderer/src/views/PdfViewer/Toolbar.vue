<template>
  <div
    class="toolbar"
    :class="{ vertical: isVertical, 'dark-theme': themeStore.isDarkTheme }"
    ref="toolbarEl"
    @mousedown="startDrag"
    @touchstart.passive="startDrag"
  >
    <slot></slot>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@renderer/store/LayoutTheme'

const themeStore = useThemeStore()

const toolbarEl = ref(null)
const isVertical = ref(false)
const isDragging = ref(false)
const startPos = ref({ x: 0, y: 0 })
const offset = ref({ x: 0, y: 0 })

// 初始化位置
onMounted(() => {
  // 默认居中
  const el = toolbarEl.value
  el.style.left = '60%'
  el.style.top = '50px'
  checkOrientation()
})

// 开始拖动
const startDrag = (e) => {
  isDragging.value = true
  const el = toolbarEl.value
  const rect = el.getBoundingClientRect()

  // 处理鼠标和触摸事件
  const clientX = e.clientX ?? e.touches[0].clientX
  const clientY = e.clientY ?? e.touches[0].clientY

  offset.value = {
    x: clientX - rect.left,
    y: clientY - rect.top
  }

  startPos.value = {
    x: rect.left,
    y: rect.top
  }

  // 防止默认行为和文本选择
  e.preventDefault()
  document.body.style.userSelect = 'none'
}

// 处理拖动
const handleMove = (e) => {
  if (!isDragging.value) return

  const clientX = e.clientX ?? e.touches[0].clientX
  const clientY = e.clientY ?? e.touches[0].clientY

  const newX = clientX - offset.value.x
  const newY = clientY - offset.value.y

  toolbarEl.value.style.left = `${newX}px`
  toolbarEl.value.style.top = `${newY}px`
  toolbarEl.value.style.transform = 'none'

  checkOrientation()
}

// 停止拖动
const stopDrag = () => {
  isDragging.value = false
  document.body.style.userSelect = ''
}

// 检查方向
const checkOrientation = () => {
  const el = toolbarEl.value
  const rect = el.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const windowWidth = window.innerWidth

  isVertical.value = centerX < 200 || centerX > windowWidth - 200
}

// 添加事件监听
onMounted(() => {
  document.addEventListener('mousemove', handleMove)
  document.addEventListener('touchmove', handleMove, { passive: false })
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchend', stopDrag)
})

// 移除事件监听
onUnmounted(() => {
  document.removeEventListener('mousemove', handleMove)
  document.removeEventListener('touchmove', handleMove)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('touchend', stopDrag)
})
</script>

<!-- <style scoped>
.toolbar {
  position: fixed;
  top: 50px;
  left: 60%;
  transform: translateX(-60%);
  z-index: 1000;
  background: white;
  padding: 8px 16px;
  border-radius: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: inline-flex;
  justify-content: center;
  transition: all 0.3s ease;
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.toolbar:active {
  cursor: grabbing;
}

.toolbar.vertical {
  flex-direction: column;
  justify-content: center; /* 垂直方向居中 */
  align-items: center; /* 水平方向居中 */
}

.toolbar.vertical :deep(.el-button + .el-button) {
  margin-left: 0;
}
</style> -->
<style scoped>
.toolbar {
  position: fixed;
  top: 50px;
  left: 60%;
  transform: translateX(-60%);
  z-index: 1000;
  background: white;
  padding: 8px 16px;
  border-radius: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: inline-flex;
  justify-content: center;
  transition: all 0.3s ease;
  cursor: grab;
  user-select: none;
  touch-action: none;
}

/* 暗色主题样式 */
.toolbar.dark-theme {
  background: #2d2d30;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  color: #cccccc;
}

.toolbar:active {
  cursor: grabbing;
}

.toolbar.vertical {
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.toolbar.vertical :deep(.el-button + .el-button) {
  margin-left: 0;
}

/* 暗色主题下的垂直布局 */
.toolbar.vertical.dark-theme :deep(.el-button + .el-button) {
  margin-left: 0;
  margin-top: 4px;
}

/* 暗色主题下 Element Plus 组件的样式调整 */
.toolbar.dark-theme :deep(.el-button) {
  background-color: #3c3c3c;
  border-color: #555;
  color: #cccccc;
}

.toolbar.dark-theme :deep(.el-button:hover) {
  background-color: #4d4d4d;
  border-color: #666;
}

.toolbar.dark-theme :deep(.el-button:active) {
  background-color: #2d2d2d;
}

/* 暗色主题下的分隔线 */
.toolbar.dark-theme :deep(.divider) {
  background-color: #555;
}
</style>
