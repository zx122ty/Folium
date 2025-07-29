// renderer/src/global.d.ts
interface Window {
  Myapi: {
    readPdf: (filePath: string) => Promise<any>
    openPdfDialog: () => Promise<string | null>
    getPdfFileData: (filePath: string) => Promise<{
      success: boolean
      data?: ArrayBuffer
      fileName?: string
      error?: string
    }>
  }
  electron: typeof import('@electron-toolkit/preload').electronAPI
}
