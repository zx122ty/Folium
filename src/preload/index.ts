import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileItem[]
}

// 定义接口
interface TencentSettings {
  secretId: string
  secretKey: string
  region: string
  endpoint: string
}

interface OpenAISettings {
  model: string
}

interface TranslationSettings {
  api: string
  apiId: string
  apiKey: string
  apiUrl: string
  apiMethod: string
  apiHeaders: string
  apiBody: string
  apiResultPath: string
  targetLanguage: string
  tencent: TencentSettings
  openai: OpenAISettings
}

interface TranslationRequest {
  text: string
  settings: TranslationSettings
}

interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  children?: FileItem[]
}

interface PdfApi {
  readPdf: (filePath: string) => Promise<any>
  openPdfDialog: () => Promise<string | null>
  getPdfFileData: (filePath: string) => Promise<{
    success: boolean
    data?: ArrayBuffer
    fileName?: string
    error?: string
  }>
  openFolderDialog: () => Promise<{
    rootPath: string
    fileTree: FileItem[]
  } | null>

  // 新增的翻译方法
  translateWord: (word: string) => Promise<any>
  aiTranslate: (request: TranslationRequest) => Promise<any>
}

// Custom APIs for renderer
// const api = {
//   readPdf: (filePath: string) => {
//     return ipcRenderer.invoke('read-file', filePath)
//   },
//   openPdfDialog: () => {
//     return ipcRenderer.invoke('open-pdf-dialog')
//   },
//   getPdfFileData: (filePath: string) => {
//     return ipcRenderer.invoke('get-pdf-file-data', filePath)
//   }
// }

// Custom APIs for renderer
const api: PdfApi = {
  readPdf: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  openPdfDialog: () => ipcRenderer.invoke('open-pdf-dialog'),
  getPdfFileData: (filePath: string) => ipcRenderer.invoke('get-pdf-file-data', filePath),
  openFolderDialog: () => ipcRenderer.invoke('open-localFolder-dialog'),

  // 新增的翻译方法实现
  translateWord: (word: string) => ipcRenderer.invoke('translate-word', word),
  aiTranslate: (request: TranslationRequest) => ipcRenderer.invoke('get-completion', request)
}

// 暴露给渲染进程的类型声明
declare global {
  interface Window {
    Myapi: PdfApi
    electron: typeof electronAPI
  }
}
// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('Myapi', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
