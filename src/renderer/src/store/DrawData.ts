// src/store/DrawData.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定义绘图数据的类型
interface Shape {
  // 根据你的实际形状数据结构定义属性
  type: string
  [key: string]: any // 临时使用，最好为每种形状类型定义具体接口
}

interface Layer {
  id: number
  visible: boolean
  name: string
  shapes: Shape[]
  backgroundColor?: string
  // ... 其他图层属性
}

interface PageDrawingData {
  layers: Layer[]
  activeLayerIndex: number
}

interface TabPdfDrawings {
  [pdfUrl: string]: {
    [pageNum: number]: PageDrawingData
  }
}
interface Drawings {
  [tabId: string]: TabPdfDrawings
}

export const useDrawDataStore = defineStore('drawData', () => {
  // 存储所有标签页、PDF的绘图数据
  const drawings = ref<Drawings>({})

  // 获取特定标签页、特定PDF、特定页面的绘图数据
  const getDrawings = (tabId: string, pdfUrl: string, pageNum: number) => {
    return drawings.value[tabId]?.[pdfUrl]?.[pageNum]
  }

  // 设置特定标签页、特定PDF、特定页面的绘图数据
  const setDrawings = (tabId: string, pdfUrl: string, pageNum: number, data: PageDrawingData) => {
    if (!drawings.value[tabId]) {
      drawings.value[tabId] = {}
    }
    if (!drawings.value[tabId][pdfUrl]) {
      drawings.value[tabId][pdfUrl] = {}
    }
    // 使用深拷贝确保数据独立性
    drawings.value[tabId][pdfUrl][pageNum] = JSON.parse(JSON.stringify(data))
  }

  // (可选) 清除特定标签页的所有绘图数据
  const clearDrawingsForTab = (tabId: string) => {
    delete drawings.value[tabId]
  }

  // (可选) 清除特定标签页下特定PDF的所有绘图数据
  const clearDrawingsForPdfInTab = (tabId: string, pdfUrl: string) => {
    if (drawings.value[tabId]) {
      delete drawings.value[tabId][pdfUrl]
    }
  }

  // --- 新增状态 ---
  const ifCloseSave = ref(false)

  // --- 可选：提供 action 来修改状态，使意图更明确 ---
  const triggerCloseSave = () => {
    ifCloseSave.value = true
  }

  const resetCloseSave = () => {
    ifCloseSave.value = false
  }

  return {
    drawings,
    getDrawings,
    setDrawings,
    clearDrawingsForTab,
    clearDrawingsForPdfInTab,
    ifCloseSave,
    triggerCloseSave,
    resetCloseSave
  }
})
