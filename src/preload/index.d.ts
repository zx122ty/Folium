import { ElectronAPI } from '@electron-toolkit/preload'

// declare global {
//   interface Window {
//     electron: ElectronAPI
//     // Myapi: unknown
//   }
// }

declare global {
  interface Window {
    Myapi: PdfApi
    electron: typeof electronAPI
  }
}
