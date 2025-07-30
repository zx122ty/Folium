<!-- <template>
  <div><el-image :src="iconFolium" style="width: 20px; height: 20px" fit="fill"></el-image>
  <div>A powerful, open-source PDF reader built for academic research and deep reading</div>
  </div>
  <div class="base-container">
    <el-link @click="openDefaultPdf" type="primary">Open default PDF</el-link>
    <el-link @click="openLocalPdf" type="primary">Choose local file</el-link>
  </div>
</template> -->

<template>
  <div class="welcome-container">
    <!-- 标题部分 -->
    <div class="title-section">
      <el-image :src="iconFolium" class="logo-image" fit="scale-down"></el-image>
      <h1 class="app-title">Folium 🍃</h1>
    </div>

    <!-- 描述部分 -->
    <div class="description-section">
      <p class="app-description">
        A powerful, open-source PDF reader built for academic research and deep reading ✨📚
      </p>
    </div>

    <!-- 按钮部分 -->
    <div class="buttons-section">
      <el-link @click="openDefaultPdf" type="primary" class="action-link">
        Open default PDF 📖
      </el-link>
      <span class="divider">|</span>
      <el-link @click="openLocalPdf" type="primary" class="action-link">
        Choose local file 📁
      </el-link>
    </div>

    <!-- 装饰性元素 -->
    <div class="decorative-elements">
      <div class="emoji-row">📚 📖 ✨ 🍃 📚</div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAppStore } from '@renderer/store'

import { useDrawDataStore } from '@renderer/store/DrawData'

import iconFolium from '@renderer/assets/icon.png'

const drawDataStore = useDrawDataStore()

const router = useRouter()
const appStore = useAppStore()

const openDefaultPdf = async () => {
  const pdfUrl = appStore.defaultPdfUrl
  if (pdfUrl) {
    appStore.setPdfUrlForTab(appStore.activeTabId, pdfUrl, 'Default PDF')
    router.push({
      path: '/PdfViewer',
      query: { pdfUrl }
    })
  }
}

// const openLocalPdf = async () => {
//   try {
//     if (!window.Myapi) throw new Error('here Electron API 不可用')

//     const filePath = await window.Myapi.openPdfDialog()
//     if (!filePath) return

//     // 从文件路径中提取文件名
//     const fileName = filePath.split(/[\\/]/).pop() || 'PDF Document'
//     const pdfUrl = `file://${filePath}`

//     // 更新当前标签页状态
//     appStore.setPdfUrlForTab(appStore.activeTabId, pdfUrl, fileName)

//     router.push({
//       path: '/PdfViewer',
//       query: { pdfUrl: `file://${filePath}` }
//     })
//   } catch (error) {
//     console.error('Error:', error)
//   }
// }

const openLocalPdf = async () => {
  try {
    if (!window.Myapi) throw new Error('Electron API 不可用')

    // --- 修改：接收更复杂的数据结构 ---
    const fileResult = await window.Myapi.openPdfDialog()

    // 检查用户是否取消
    if (fileResult.type === 'cancelled') {
      console.log('User cancelled file selection.')
      return
    }

    // 检查是否有错误
    if (fileResult.type === 'error') {
      console.error('Error from main process:', fileResult.message)
      alert(`打开文件时出错: ${fileResult.message}`)
      return
    }

    let pdfUrlToLoad = null
    let fileName = 'PDF Document'
    let drawingDataToLoad = null

    // --- 核心修改点：根据返回类型处理 ---
    if (fileResult.type === 'pdf') {
      // 处理普通 PDF 文件
      pdfUrlToLoad = fileResult.pdfUrl
      fileName = fileResult.sourceFileName || path.basename(pdfUrlToLoad)
    } else if (fileResult.type === 'drawdata') {
      // 处理 .drawdata 文件
      pdfUrlToLoad = fileResult.pdfUrl
      fileName = fileResult.sourceFileName
        ? `${fileResult.sourceFileName.replace('.drawdata', '')}`
        : path.basename(pdfUrlToLoad)
      drawingDataToLoad = fileResult.drawings // 获取绘图数据

      //   console.log('Opening PDF from .drawdata:', pdfUrlToLoad)
      // console.log('Loading drawing data:', drawingDataToLoad)
    } else {
      console.warn('Unknown file type returned from main process:', fileResult)
      alert('不支持的文件类型或返回数据格式错误。')
      return
    }

    if (!pdfUrlToLoad) {
      console.error('Could not determine PDF URL to open.')
      alert('无法确定要打开的 PDF 文件。')
      return
    }

    // --- 更新当前标签页状态 ---
    appStore.setPdfUrlForTab(appStore.activeTabId, pdfUrlToLoad, fileName)

    // --- 如果加载了绘图数据，则存入 Store ---
    if (drawingDataToLoad) {
      //  console.log(`Loading drawing data into Store for Tab ${appStore.activeTabId}`)

      // 将数据存入 Pinia Store
      // 注意：drawDataStore.drawings 是一个 Ref，修改其 value 属性
      // 并且数据结构应为 { [tabId]: { [pdfUrl]: { [pageNum]: ... } } }
      // fileResult.drawings 应该已经是 { [pdfUrl]: { [pageNum]: ... } } 的结构

      // 确保 Store 中该 tabId 的位置存在
      //  console.log('1drawDataStore----', drawDataStore.drawings)
      // console.log('drawingDataToLoad:-----', drawingDataToLoad)

      if (!drawDataStore.drawings[appStore.activeTabId]) {
        drawDataStore.drawings[appStore.activeTabId] = {}
      }

      // console.log('2drawDataStore----', drawDataStore.drawings)

      // console.log('here------')
      // 将 .drawdata 文件中的数据（按 PDF URL 组织）加载到当前标签页下
      // 假设 fileResult.drawings 就是 { [pdfUrl]: { [pageNum]: ... } } 结构
      // 我们需要将其放在当前 tabId 下，且 key 是当前要加载的 pdfUrl
      // 但 Store 的结构是 { tabId: { pdfUrl: { pageNum: ... } } }
      // 所以我们应该把 fileResult.drawings 中与 pdfUrlToLoad 相关的数据放进去
      // 最简单的方法是直接赋值，如果 fileResult.drawings 只包含一个 PDF 的数据：[pdfUrlToLoad]
      drawDataStore.drawings[appStore.activeTabId] = drawingDataToLoad //drawingDataToLoad[pdfUrlToLoad] || drawingDataToLoad;

      console.log('3drawDataStore----', drawDataStore.drawings)
      // 更健壮的方式：遍历 fileResult.drawings 的所有 PDF URL
      // 但如果 .drawdata 文件是为特定 PDF 保存的，drawingDataToLoad 本身可能就是 { pageNum: ... } 的结构
      // 需要根据你实际保存的结构来调整。这里假设 drawingDataToLoad 是 { [pdfUrl]: { pageNum: ... } }

      // 如果 drawingDataToLoad 直接就是 { pageNum: ... }，则：
      // drawDataStore.drawings.value[appStore.activeTabId][pdfUrlToLoad] = drawingDataToLoad;

      // 如果 drawingDataToLoad 是 { somePdfUrl: { pageNum: ... } }，则：
      const pdfUrlInDrawData = Object.keys(drawingDataToLoad)[0] // 假设只有一个
      // console.log('pdfUrlInDrawData:', pdfUrlInDrawData)
      if (pdfUrlInDrawData) {
        // drawDataStore.drawings.value[appStore.activeTabId][pdfUrlToLoad] =
        //   drawingDataToLoad[pdfUrlInDrawData]
      } else {
        // 如果 drawingDataToLoad 本身就是 { pageNum: ... } 结构
        drawDataStore.drawings.value[appStore.activeTabId][pdfUrlToLoad] = drawingDataToLoad
      }

      // 或者，如果你在保存 .drawdata 时，`drawings` 字段直接就是按页码组织的数据：
      // drawDataStore.drawings.value[appStore.activeTabId][pdfUrlToLoad] = drawingDataToLoad;

      //  console.log('Drawing data loaded into Store:', toRaw(drawDataStore.drawings.value))
    }

    // --- 路由到 PDF 查看器 ---

    // console.log('pdfUrlToLoad:', pdfUrlToLoad)

    router.push({
      path: '/PdfViewer',
      query: { pdfUrl: pdfUrlToLoad }
    })
  } catch (error) {
    console.error('Error in openLocalPdf:', error)
    alert(`打开文件时出错: ${error.message}`) // 向用户显示错误
  }
}
</script>

<!-- <style scoped>
.base-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  gap: 20px;
}
</style> -->
<style scoped>
.welcome-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%);
  position: relative;
  /* overflow: hidden; */
}

.title-section {
  text-align: center;
  margin-bottom: 30px;
  animation: fadeInDown 0.8s ease-out;
}

.logo-image {
  width: 80px;
  height: 80px;
  margin-bottom: 15px;
  border-radius: 50%;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.logo-image:hover {
  transform: scale(1.1);
}

.app-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  background: linear-gradient(45deg, #3498db, #2c3e50);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.description-section {
  text-align: center;
  margin-bottom: 40px;
  max-width: 600px;
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.app-description {
  font-size: 1.1rem;
  color: #555;
  line-height: 1.6;
  margin: 0;
  padding: 0 20px;
}

.buttons-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
  animation: fadeIn 0.8s ease-out 0.4s both;
}

.action-link {
  font-size: 1.1rem;
  font-weight: 500;
  padding: 12px 24px;
  border-radius: 25px;
  background: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid #3498db;
}

.action-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(52, 152, 219, 0.3);
  background: #3498db;
  color: white !important;
}

.divider {
  font-size: 1.2rem;
  color: #95a5a6;
  font-weight: bold;
}

.decorative-elements {
  position: absolute;
  bottom: 30px;
  width: 100%;
  text-align: center;
}

.emoji-row {
  font-size: 1.5rem;
  color: #95a5a6;
  opacity: 0.7;
  animation: float 3s ease-in-out infinite;
}

/* 动画效果 */
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-title {
    font-size: 2rem;
  }

  .app-description {
    font-size: 1rem;
  }

  .buttons-section {
    flex-direction: column;
    gap: 20px;
  }

  .divider {
    display: none;
  }

  .action-link {
    width: 200px;
    text-align: center;
  }
}
</style>
