<template>
  <div>
    <el-button
      @click="openPdfFile"
      style="margin-left: 10px"
      :bg="true"
      :style="{ width: '36px', height: '36px' }"
    >
      测试按钮
    </el-button>

    <VuePdfEmbed
      ref="vuePdfRef"
      :source="pdfState.pdfSource"
      :page="pdfState.pageNum"
      @loaded="onPdfLoaded"
      :text-Layer="!isDrawingMode"
      :annotation-Layer="!isDrawingMode"
    />
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch, onUnmounted, nextTick, computed, toRef } from 'vue'
import VuePdfEmbed from 'vue-pdf-embed'
import 'pdfjs-dist/web/pdf_viewer.css'

import * as pdfjsLib2 from 'pdfjs-dist'

import { useRoute } from 'vue-router'
const route = useRoute()

pdfjsLib2.GlobalWorkerOptions.workerSrc = new URL(
  '../../assets/js/pdf.worker.js',
  import.meta.url
).href

var createLoadingTask = function createLoadingTask(src) {
  var loadingTask = pdfjsLib2.getDocument(src)
  return loadingTask
}

// const props = defineProps({
//   pdfUrl: {
//     type: String,
//     required: true
//   }
// })

const vuePdfRef = ref(null)
const isDrawingMode = ref(false)

// import routerpdfUrl from '@renderer/assets/default.pdf'
// let routerpdfUrl = loadPdfFile(route.query.pdfUrl)

const pdfState = reactive({
  pdfSource: {
    url: '',
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.9.359/cmaps/',
    cMapPacked: true
  },
  pageNum: 1,
  numPages: 1
})

const onPdfLoaded = (pdfDocument) => {
  pdfState.numPages = pdfDocument.numPages
  console.log('PDF loaded, total pages:', pdfState.numPages)
}

//更换文件
const pdfFile = ref(null) // 添加这行
const error = ref('')
const loading = ref(false)

const openPdfFile = async () => {
  console.log('test window.Myapi:', window.Myapi)
  try {
    if (!window.Myapi) {
      throw new Error('Electron API 不可用')
    }

    const filePath = await window.Myapi.openPdfDialog()
    if (!filePath) return

    const result = await window.Myapi.getPdfFileData(filePath)
    if (!result.success) {
      throw new Error(result.error || '无法读取PDF文件')
    }

    if (!result.data) {
      throw new Error('未获取到PDF文件数据')
    }

    // 创建Blob对象
    const blob = new Blob([new Uint8Array(result.data)], { type: 'application/pdf' })
    const blobUrl = URL.createObjectURL(blob)

    // 先清理之前的Blob URL
    if (pdfState.pdfSource.url.startsWith('blob:')) {
      URL.revokeObjectURL(pdfState.pdfSource.url)
    }

    // 更新PDF源
    pdfState.pdfSource = {
      url: blobUrl,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.9.359/cmaps/',
      cMapPacked: true
    }

    // 重置状态
    pdfState.pageNum = 1

    // 验证PDF文件
    const loadingTask = createLoadingTask(pdfState.pdfSource)
    const pdf = await loadingTask.promise
    pdfState.numPages = pdf.numPages
    console.log(`成功加载PDF: ${result.fileName}，共${pdfState.numPages}页`)
  } catch (error) {
    console.error('加载PDF失败:', error instanceof Error ? error.message : String(error))
  }
}

const loadPdfFile = async (routerUrl) => {
  try {
    if (!routerUrl) return

    // 如果是本地文件路径(file://开头)，则使用Electron API读取文件
    if (routerUrl.startsWith('file://')) {
      if (!window.Myapi) {
        throw new Error('Electron API 不可用')
      }

      const filePath = routerUrl.replace('file://', '')
      const result = await window.Myapi.getPdfFileData(filePath)
      if (!result.success) {
        throw new Error(result.error || '无法读取PDF文件')
      }

      if (!result.data) {
        throw new Error('未获取到PDF文件数据')
      }

      // 创建Blob对象
      const blob = new Blob([new Uint8Array(result.data)], { type: 'application/pdf' })
      const blobUrl = URL.createObjectURL(blob)

      // 先清理之前的Blob URL
      if (pdfState.pdfSource.url.startsWith('blob:')) {
        URL.revokeObjectURL(pdfState.pdfSource.url)
      }

      return blobUrl
    } else {
      return routerUrl
    }
    // 更新PDF源
    //   pdfState.pdfSource = {
    //     url: blobUrl,
    //     cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.9.359/cmaps/',
    //     cMapPacked: true
    //   }
    // } else {
    //   // 处理非本地文件路径(如http/https或默认PDF)
    //   pdfState.pdfSource = {
    //     url: routerUrl,
    //     cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.9.359/cmaps/',
    //     cMapPacked: true
    //   }
    // }

    //   // 重置状态
    //   pdfState.pageNum = 1

    //   // 验证PDF文件
    //   const loadingTask = createLoadingTask(pdfState.pdfSource)
    //   const pdf = await loadingTask.promise
    //   pdfState.numPages = pdf.numPages
    //   console.log(`成功加载PDF，共${pdfState.numPages}页`)
  } catch (error) {
    console.error('加载PDF失败:', error instanceof Error ? error.message : String(error))
  }
}

onMounted(async () => {
  const pdfUrl = await loadPdfFile(route.query.pdfUrl)
  if (pdfUrl) {
    pdfState.pdfSource.url = pdfUrl
  }
})
// onMounted(() => {
//   loadPdfFile(routerpdfUrl)
// })

onUnmounted(() => {
  if (pdfState.pdfSource.url && pdfState.pdfSource.url.startsWith('blob:')) {
    URL.revokeObjectURL(pdfState.pdfSource.url)
  }
})
</script>

<style lang="scss" scoped></style>
