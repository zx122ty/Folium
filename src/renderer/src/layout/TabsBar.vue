<template>
  <div class="tabs-container" :class="{ 'dark-theme': themeStore.isDarkTheme }">
    <div class="tabs-scroll">
      <div class="tabs-wrapper">
        <!-- 新增 wrapper 容器 -->
        <div
          v-for="tab in appStore.tabs"
          :key="tab.id"
          class="tab"
          :class="{ active: tab.id === appStore.activeTabId }"
          @click="switchTab(tab.id)"
        >
          <span class="tab-text">{{ tab.pdfName || tab.title }}</span>
          <el-icon @click.stop="closeTab(tab.id)">
            <Close />
          </el-icon>
        </div>
        <!-- 将 add-tab 移入 tabs-wrapper 内部 -->
        <el-button class="add-tab" @click="addTab" :icon="Plus" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick } from 'vue'
import { Close, Plus } from '@element-plus/icons-vue'
import { useAppStore } from '@renderer/store'
import { useRouter, useRoute } from 'vue-router'
import { useThemeStore } from '@renderer/store/LayoutTheme'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useDrawDataStore } from '@renderer/store/DrawData'

const themeStore = useThemeStore()
const drawDataStore = useDrawDataStore()

//console.log('Store methods:', Object.keys(drawDataStore))

const appStore = useAppStore()
const router = useRouter()
const route = useRoute()

const switchTab = async (id) => {
  appStore.setActiveTab(id)
  // 确保状态更新完成
  await nextTick()

  const activeTab = appStore.activeTab
  if (activeTab.pdfUrl) {
    // 如果标签页有PDF，跳转到PDF查看器
    router.push({
      path: '/PdfViewer',
      query: { pdfUrl: activeTab.pdfUrl, tabId: id }
    })
  } else {
    // 否则跳转到基础页面
    router.push(activeTab.route || '/base')
  }
}

// const closeTab = (id) => {
//   appStore.removeTab(id)
// }

// Toolbar.vue 修改 closeTab 函数
const closeTab = async (id) => {
  const currentIndex = appStore.tabs.findIndex((tab) => tab.id === id)
  const willActivateTab = appStore.tabs[currentIndex - 1] || appStore.tabs[currentIndex + 1]

  // --- 新增逻辑：弹出确认框 ---
  const tabToClose = appStore.tabs.find((tab) => tab.id === id)
  // console.log('tabToClose:', tabToClose)
  console.log('route:', route.path)
  //tabToClose && (tabToClose.pdfUrl || tabToClose.title !== 'New Tab')
  if (tabToClose.id !== '1' && route.path !== '/base') {
    // 如果标签页有内容（PDF或非默认名称）
    try {
      await ElMessageBox.confirm('Do you want to save the drawing data of this tab?', 'Close', {
        confirmButtonText: 'Save',
        cancelButtonText: "Don't save",
        type: 'warning'
      })
      // 用户点击了“保存”
      //  console.log('User chose to save data for tab:', id)
      drawDataStore.triggerCloseSave()
      await nextTick()
      // 2. 从 Store 获取即将关闭标签页的所有绘图数据
      const drawingsToSave = drawDataStore.drawings[id] // 获取该 tabId 下的所有数据
      // console.log('drawingsToSave:', drawingsToSave)
      if (drawingsToSave) {
        const pdfUrl = tabToClose.pdfUrl
        console.log('tabToClose.pdfUrl:', tabToClose.pdfUrl)
        let pdfFileSystemPath = ''

        // 尝试从 file:// URL 中提取文件系统路径
        if (pdfUrl && pdfUrl.startsWith('file://')) {
          // 简单处理，对于 Windows 路径可能需要额外处理 file:///C:/... 的情况
          pdfFileSystemPath = decodeURIComponent(pdfUrl.substring(7)) // 去掉 'file://' 前缀
          // 在 Windows 上，可能需要去掉额外的 '/'
          if (
            window.process &&
            window.process.platform === 'win32' &&
            pdfFileSystemPath.startsWith('/')
          ) {
            pdfFileSystemPath = pdfFileSystemPath.substring(1)
          }
        }

        if (!pdfFileSystemPath) {
          console.warn('Could not extract file system path from pdfUrl:', pdfUrl)
          // 可以选择不保存，或者保存一个不包含 pdfPath 的文件（但打开时就无法自动加载PDF了）
          // 这里我们选择提示用户并继续（保存不完整的数据）
          ElMessage.warning(
            'Unable to obtain the PDF file path. The saved file may not be automatically associated with the PDF.'
          )
        }

        // 3. 包装数据，包含 PDF 路径
        const dataToSave = {
          pdfPath: pdfFileSystemPath, // 添加 PDF 文件系统路径
          drawings: drawingsToSave, // 原有的绘图数据 ({ pdfUrl: { pageNum: ... } })
          // 可以添加其他元数据
          savedAt: new Date().toISOString(),
          appVersion: '1.0.0' // 示例
        }

        // 3. 序列化数据
        const serializedData = JSON.stringify(dataToSave, null, 2) // 格式化输出，便于调试
        const fileName = tabToClose.pdfName
          ? `${tabToClose.pdfName}_drawings`
          : `Tab_${id}_drawings`

        // 4. 调用主进程保存文件 (通过 preload 暴露的 API)
        if (window.Myapi && typeof window.Myapi.saveDrawingsToFile === 'function') {
          const success = await window.Myapi.saveDrawingsToFile(serializedData, fileName)
          if (success) {
            console.log('Drawings saved successfully for tab:', id)
          } else {
            console.warn('Drawings save was cancelled or failed for tab:', id)
            // 可以选择在这里 return 或继续关闭标签页
          }
        } else {
          console.error('Myapi.saveDrawingsToFile is not available!')
          ElMessage.error('Save function is unavailable. Please check the configuration.')
          // 可以选择在这里 return 或继续关闭标签页
        }
      } else {
        // console.log('No drawings found to save for tab:', id)
        ElMessage.warning('No drawings found to save')
      }
    } catch (error) {
      // 用户点击了“取消”或关闭了对话框
      if (error === 'cancel' || error === 'close') {
        console.log('User cancelled save for tab:', id)
        // 不执行任何操作，继续关闭流程
      } else {
        // 其他错误
        console.error('Error during save confirmation:', error)
      }
    }
  }
  // --- 结束新增逻辑 ---
  // 先删除标签页
  appStore.removeTab(id)

  // 如果有激活的标签页，恢复其状态
  if (willActivateTab) {
    if (willActivateTab.pdfUrl) {
      // 如果激活的标签页有PDF，跳转到PDF查看器
      router.push({
        path: '/PdfViewer',
        query: { pdfUrl: willActivateTab.pdfUrl }
      })
    } else {
      // 否则跳转到基础页面
      router.push(willActivateTab.route || '/base')
    }
  }
}

const addTab = () => {
  console.log('tabsbar addtab')
  appStore.addTab()
  router.push('/base')
}
</script>

<style scoped>
.tabs-container {
  display: flex;
  height: 30px; /* 设置固定高度 */
  align-items: center;
  /* border-bottom: 1px solid #ddd; */
  padding-right: 10px;
  /* padding-left: 10px; */

  background: #f5f5f5;
  position: relative;
}

.tabs-container::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 1px;
  background-color: #ddd;
  z-index: 0;
}

.tabs-scroll {
  flex: 1;
  overflow: hidden;
  height: 100%;
  /* overflow-x: auto;  */
}

.tabs-wrapper {
  display: flex;
  height: 100%;
  width: 100%;
  /* min-width: min-content;  */
}

.tabs {
  display: flex;
  height: 100%;
  min-width: 100%;
}

.tab {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 140px; /* 固定宽度 */
  min-width: 80px; /* 最小宽度 */
  max-width: 200px; /* 最大宽度 */
  padding: 0 15px;
  height: 100%;
  /* border: 1px solid #ddd; */
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  cursor: pointer;
  /* background: #f0f0f0; */
  box-sizing: border-box;
  margin-right: 5px;
  flex-shrink: 1; /* 允许收缩 */
}

.tab:hover {
  background-color: rgb(255, 255, 255);
}

.tab.active {
  background: white;
  border-color: #ddd;
  border: 1px solid #ddd;
  /* border-left: 0px; */
  border-bottom: 1px solid white; /* 覆盖底部边框 */
  margin-bottom: -1px;
  height: calc(100% + 1px); /* 增加1px高度覆盖底部线 */
  position: relative; /* 新增 */
  z-index: 1; /* 新增，确保激活标签覆盖底部边框 */
}

.tab .el-icon {
  margin-left: 8px;
  font-size: 12px;
  color: #999;
}

.tab .el-icon:hover {
  color: #666;
}

.tab-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.add-tab {
  margin-left: 10px;
  width: 28px;
  height: 28px;
  border: 0;
  flex-shrink: 0; /* 禁止收缩 */
  background: #f5f5f5;
}

/* 暗色主题 */
.tabs-container.dark-theme {
  background: #2d2d30;
}

.tabs-container.dark-theme::after {
  background-color: #3c3c3c;
}

.tabs-container.dark-theme .tab {
  background: #252526;
  border-color: #3c3c3c;
}

.tabs-container.dark-theme .tab:hover {
  background-color: #2d2d30;
}

.tabs-container.dark-theme .tab.active {
  background: #1e1e1e;
  border-color: #3c3c3c;
  border-bottom: 1px solid #1e1e1e;
}

.tabs-container.dark-theme .tab .el-icon {
  color: #cccccc;
}

.tabs-container.dark-theme .tab .el-icon:hover {
  color: #ffffff;
}

.tabs-container.dark-theme .tab-text {
  color: #cccccc;
}

.tabs-container.dark-theme .add-tab {
  background: #2d2d30;
  color: #cccccc;
}

.tabs-container.dark-theme .add-tab:hover {
  background: #3c3c3c;
}
</style>
