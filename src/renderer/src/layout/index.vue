<template>
  <div class="layout-container" :class="{ 'dark-theme': themeStore.isDarkTheme }">
    <el-container>
      <el-aside :style="{ width: asideWidth + 'px', maxWidth: '800px' }">
        <Aside
          v-model:width="asideWidth"
          v-model:collapsed="isCollapsed"
          @update:width="handleAsideWidthChange"
        />
      </el-aside>
      <el-container>
        <el-header height="auto"><TabsBar /></el-header>
        <el-main height="auto"><router-view /></el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import TabsBar from './TabsBar.vue'
import Aside from './Aside.vue'
import { useThemeStore } from '../store/LayoutTheme'
const themeStore = useThemeStore()
import { ref } from 'vue'

const DEFAULT_WIDTH = 250

const isCollapsed = ref(true) // 初始折叠
const asideWidth = ref(isCollapsed.value ? 48 : DEFAULT_WIDTH)

// 处理宽度更新（可选，用于调试或同步状态）
const handleAsideWidthChange = (newWidth) => {
  asideWidth.value = newWidth
}
</script>
<style scoped>
.layout-container {
  display: flex;
  height: 100vh;
  background-color: #ffffff;
  color: #333333;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

.layout-container.dark-theme {
  background-color: #1e1e1e;
  color: #cccccc;
}

.el-container {
  height: 100%;
}

.el-aside {
  /* background-color: #1e1e1e;
  color: #fff;
  height: 100%; */
  transition: width 0.2s ease;
  overflow: hidden;
}

.el-header {
  padding: 0;
  background-color: #f5f5f5;
}

.layout-container.dark-theme .el-header {
  background-color: #2d2d30;
}

.el-main {
  padding: 0;
  background-color: #fff;
}

.layout-container.dark-theme .el-main {
  background-color: #1e1e1e;
}
</style>
