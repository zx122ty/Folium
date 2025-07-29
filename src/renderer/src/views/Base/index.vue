<template>
  <div class="base-container">
    <el-link @click="openDefaultPdf" type="primary">Open default PDF</el-link>
    <el-link @click="openLocalPdf" type="primary">Choose local file</el-link>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAppStore } from '@renderer/store'

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

const openLocalPdf = async () => {
  try {
    if (!window.Myapi) throw new Error('here Electron API 不可用')

    const filePath = await window.Myapi.openPdfDialog()
    if (!filePath) return

    // 从文件路径中提取文件名
    const fileName = filePath.split(/[\\/]/).pop() || 'PDF Document'
    const pdfUrl = `file://${filePath}`

    // 更新当前标签页状态
    appStore.setPdfUrlForTab(appStore.activeTabId, pdfUrl, fileName)

    router.push({
      path: '/PdfViewer',
      query: { pdfUrl: `file://${filePath}` }
    })
  } catch (error) {
    console.error('Error:', error)
  }
}
</script>

<style scoped>
.base-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  gap: 20px;
}
</style>
