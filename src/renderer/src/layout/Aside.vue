<template>
  <div class="aside-container" :class="{ 'dark-theme': themeStore.isDarkTheme }">
    <div class="aside-bar" :style="{ width: '48px' }" @mousedown="startResize">
      <div class="icons">
        <div class="icon" @click="toggleCollapse">
          <el-icon :size="20">
            <Menu />
          </el-icon>
        </div>
        <div
          class="icon"
          @click="activeView = 'explorer'"
          :class="{ active: activeView === 'explorer' }"
        >
          <el-icon :size="20">
            <Folder />
          </el-icon>
        </div>
        <div
          class="icon"
          @click="activeView = 'search'"
          :class="{ active: activeView === 'search' }"
        >
          <el-icon :size="20">
            <Search />
          </el-icon>
        </div>
        <!-- 新增主题切换按钮 -->
        <div class="icon" @click="toggleTheme">
          <el-icon :size="20">
            <Sunny v-if="!themeStore.isDarkTheme" />
            <Moon v-else />
          </el-icon>
        </div>
      </div>
    </div>

    <div class="aside-content" :style="{ width: asideWidth + 'px' }" v-show="!isCollapsed">
      <div class="content-header">
        <span>{{ viewTitles[activeView] }}</span>
      </div>

      <div class="content-body">
        <el-scrollbar>
          <div v-if="activeView === 'explorer'">
            <el-button type="primary" @click="openFolder" class="open-folder-btn">
              <el-icon><FolderOpened /></el-icon>
              Open Folder
            </el-button>

            <div v-if="currentFolder">
              <FileTreeNode
                v-for="item in fileTree"
                :key="item.path"
                :node="item"
                @file-click="handleFileClick"
              />
            </div>
          </div>

          <div v-else-if="activeView === 'search'">
            <div class="search-placeholder">
              <el-icon :size="40"><Search /></el-icon>
              <p>Search</p>
            </div>
          </div>
        </el-scrollbar>
      </div>
    </div>

    <!-- 在 .aside-container 内部最外层添加 -->
    <div class="resize-handle" @mousedown="startResize" v-if="!isCollapsed" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import {
  Menu,
  Folder,
  Search,
  FolderOpened,
  Document,
  Picture,
  VideoCamera,
  ArrowRight,
  ArrowDown,
  Sunny,
  Moon
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import FileTreeNode from './FolderTree/index.vue'
import { useAppStore } from '@renderer/store'
import { useThemeStore } from '@renderer/store/LayoutTheme'

const appStore = useAppStore()

import { useRouter } from 'vue-router'
const router = useRouter()
const themeStore = useThemeStore()

const props = defineProps({
  width: {
    type: Number,
    default: 250
  },
  collapsed: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['update:width'])

const MIN_WIDTH = 48 //200
const MAX_WIDTH = 800
const DEFAULT_WIDTH = 250
const COLLAPSED_WIDTH = 48

const asideWidth = ref(props.width)

watch(asideWidth, (newVal) => {
  emit('update:width', newVal)
})

onMounted(() => {
  asideWidth.value = props.collapsed ? COLLAPSED_WIDTH : props.width
  isCollapsed.value = props.collapsed
})

const isCollapsed = ref(true)
const activeView = ref('explorer')
const folderItems = ref([])
const isDarkTheme = ref(false) // 默认白天主题

// 新增主题切换方法
const toggleTheme = () => {
  themeStore.toggleTheme()
}

const viewTitles = {
  explorer: 'EXPLORER',
  search: 'SEARCH'
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  asideWidth.value = isCollapsed.value ? COLLAPSED_WIDTH : DEFAULT_WIDTH
}

const startResize = (e) => {
  if (isCollapsed.value) return

  const startX = e.clientX
  const startWidth = asideWidth.value

  const doResize = (moveEvent) => {
    let newWidth = startWidth + (moveEvent.clientX - startX)
    newWidth = Math.max(MIN_WIDTH, Math.min(newWidth, MAX_WIDTH))
    asideWidth.value = newWidth
  }

  const stopResize = () => {
    window.removeEventListener('mousemove', doResize)
    window.removeEventListener('mouseup', stopResize)
    // 可选：最终同步一次
    emit('update:width', asideWidth.value)
  }

  window.addEventListener('mousemove', doResize)
  window.addEventListener('mouseup', stopResize)
}

// Aside.vue 中完善 openFolder 函数
const openFolder = async () => {
  try {
    const result = await window.Myapi?.openFolderDialog()
    if (!result || !result.fileTree) return
    console.log('result.rootPath:', result.rootPath)
    console.log('result.fileTree:', result.fileTree)
    currentFolder.value = result.rootPath
    fileTree.value = result.fileTree
  } catch (error) {
    console.error('Error opening folder:', error)
  }
}

const handleFileClick = (filePath) => {
  if (!filePath.toLowerCase().endsWith('.pdf')) {
    ElMessage.warning("Can't open this file. Only PDF files are supported.")
    return
  }

  openLocalPdfFromFolder(filePath)
}

const fileTree = ref([])
const currentFolder = ref('')

// 添加点击PDF文件的处理函数
const openLocalPdfFromFolder = async (filePath) => {
  try {
    if (!window.Myapi) throw new Error('Electron API not available')

    const fileName = filePath.split(/[\\/]/).pop() || 'PDF Document'
    const pdfUrl = `file://${filePath}`

    // 新建标签页
    // appStore.addTab()
    // 更新当前标签页状态
    appStore.setPdfUrlForTab(appStore.activeTabId, pdfUrl, fileName)

    router.push({
      path: '/PdfViewer',
      query: { pdfUrl }
    })
  } catch (error) {
    console.error('Error opening PDF:', error)
    ElMessage.error('Failed to open PDF file')
  }
}

onMounted(() => {
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault()
      toggleCollapse()
    }
  })
})

// onUnmounted(() => {
//   document.removeEventListener('keydown')
// })
</script>

<style scoped>
.aside-container {
  height: 100vh;
  display: flex;
  background-color: white;
  color: #333;
  /* transition: width 0.2s ease; */
  transition:
    width 0.2s ease,
    background-color 0.3s ease,
    color 0.3s ease;
  position: relative;
  width: 100%;
}

.aside-container.dark-theme {
  background-color: #1e1e1e;
  color: #cccccc;
}

.aside-container.dark-theme .aside-bar {
  background-color: #252526;
}

.aside-bar {
  width: 48px;
  height: 100%;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 10px;
  user-select: none;
  cursor: ew-resize;
}

.icons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
}

.icon:hover {
  background-color: #e8e8e8;
}

.aside-container.dark-theme .icon:hover {
  background-color: #2a2d2e;
}

.icon.active {
  background-color: #e0e0e0;
}

.aside-container.dark-theme .icon.active {
  background-color: #37373d;
}
.aside-content {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  padding: 8px 16px;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid #c2c2c4;
}

.aside-container.dark-theme .content-header {
  border-bottom: 1px solid #3c3c3c;
}

.content-body {
  flex: 1;
  padding: 10px;
  height: 100%;
  /* overflow-y: auto; */
  border: 1px solid #dfdfdf;
}

.aside-container.dark-theme .content-body {
  border: 1px solid #3c3c3c;
}

.open-folder-btn {
  width: 100%;
  margin-bottom: 15px;
  background-color: #409eff;
  border: none;
}

.aside-container.dark-theme .open-folder-btn {
  background-color: #0e639c;
}

.open-folder-btn:hover {
  background-color: #66b1ff;
}

.aside-container.dark-theme .open-folder-btn:hover {
  background-color: #1177bb;
}

.folder-structure {
  padding-left: 5px;
}

.folder-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  cursor: pointer;
}

.folder-item:hover {
  background-color: #2a2d2e;
}

.search-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
}

.search-placeholder p {
  margin-top: 10px;
}

.aside-container.dark-theme .search-placeholder {
  color: #999;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 3px;
  height: 100%;
  cursor: ew-resize;
  z-index: 10; /* 确保在其他内容之上 */
  /* 可选：hover 时高亮 */
  background-color: transparent;
}

.resize-handle:hover {
  background-color: rgba(13, 65, 237, 0.1);
}
</style>
