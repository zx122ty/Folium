import { defineStore } from 'pinia'
import routerpdfUrl from '@renderer/assets/default.pdf'

interface Tab {
  id: string
  title: string
  route: string
  pdfUrl?: string
  pdfName?: string // 新增字段存储 PDF 文件名
}

export const useAppStore = defineStore('app', {
  state: () => ({
    tabs: [{ id: '1', title: 'PDF Viewer', route: '/base' }] as Tab[],
    activeTabId: '1',
    defaultPdfUrl: routerpdfUrl
  }),
  getters: {
    activeTab(): Tab | undefined {
      return this.tabs.find((tab) => tab.id === this.activeTabId)
    },
    activePdfUrl(): string {
      return this.activeTab?.pdfUrl || ''
    }
  },
  actions: {
    addTab() {
      const newId = Date.now().toString()
      this.tabs.push({
        id: newId,
        title: 'New Tab',
        route: '/base'
      })
      this.activeTabId = newId
      // router.push('/base')
    },
    removeTab(id: string) {
      if (this.tabs.length <= 1) return

      const index = this.tabs.findIndex((tab) => tab.id === id)
      if (index !== -1) {
        this.tabs.splice(index, 1)
        if (this.activeTabId === id) {
          this.activeTabId = this.tabs[Math.max(0, index - 1)].id
        }
      }
    },
    setActiveTab(id: string) {
      this.activeTabId = id
    },

    setPdfUrlForTab(id: string, url: string, name?: string) {
      const tab = this.tabs.find((tab) => tab.id === id)
      if (tab) {
        tab.pdfUrl = url
        tab.title = name || 'PDF Viewer' // 设置标签页标题为 PDF 文件名
        tab.pdfName = name
      }
    }
  }
})
