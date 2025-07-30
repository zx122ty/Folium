import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'

import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/build/icons/png/1024x1024.png?asset'
import { readPdf, getFolder, translateWithFreeDictionary } from './function'
import { getCompletion } from './ai'
import { writeDrawFile } from './writeFile'

import { dialog } from 'electron'
import fs from 'fs'
import path from 'path'
// import { fileURLToPath } from 'url'
// import { dirname } from 'path'
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)

// 添加类型定义
interface PdfFileDataResponse {
  success: boolean
  data?: Buffer
  fileName?: string
  error?: string
}

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

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../../resources/folium.png'),
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: false
      // webSecurity: false // 仅开发环境使用
    }
  })

  mainWindow.on('ready-to-show', () => {
    // mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 添加一个IPC处理程序
  ipcMain.handle('read-file', readPdf)
  // ipcMain.handle('open-pdf-dialog', async () => {
  //   const result = await dialog.showOpenDialog({
  //     properties: ['openFile'],
  //     filters: [
  //       { name: 'PDF Files', extensions: ['pdf'] },
  //       { name: 'draw data', extensions: ['drawdata'] },
  //       { name: 'All Files', extensions: ['*'] }
  //     ]
  //   })
  //   return result.filePaths[0] || null
  // })
  ipcMain.handle('open-pdf-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: '绘图数据文件', extensions: ['drawdata'] }, // 添加你的文件类型
        { name: 'All Files', extensions: ['*'] }
      ]
    })

    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0]
      console.log('Selected file path in main:', selectedPath)

      // --- 修改逻辑：区分处理 .drawdata 文件 ---
      if (path.extname(selectedPath).toLowerCase() === '.drawdata') {
        try {
          const fileContent = await fs.promises.readFile(selectedPath, 'utf-8')
          const drawingData = JSON.parse(fileContent)

          // --- 核心修改点 ---
          // 假设 .drawdata 文件结构为 { pdfPath: "实际PDF文件路径", drawings: { ... } }
          // 你需要根据你实际保存的 .drawdata 文件结构来调整这里。
          if (drawingData && drawingData.pdfPath && typeof drawingData.pdfPath === 'string') {
            const pdfPath = drawingData.pdfPath // 提取 PDF 路径
            const pdfUrl = `file://${pdfPath}` // 转换为 file:// URL
            const drawings = drawingData.drawings || {} // 提取绘图数据

            // 返回一个特殊结构，包含 PDF URL 和绘图数据
            return {
              type: 'drawdata',
              pdfUrl: pdfUrl,
              drawings: drawings,
              // 可以添加其他元数据，如文件名等
              sourceFileName: path.basename(selectedPath)
            }
          } else {
            throw new Error("Invalid .drawdata file format: Missing or invalid 'pdfPath'.")
          }
        } catch (err: any) {
          console.error('Failed to read or parse .drawdata file:', err)
          dialog.showErrorBox('打开文件失败', `无法读取或解析绘图数据文件: ${err.message}`)
          return { type: 'error', message: err.message } // 返回错误信息给渲染进程
        }
      } else {
        // 处理普通的 PDF 文件
        return {
          type: 'pdf',
          pdfUrl: `file://${selectedPath}`,
          sourceFileName: path.basename(selectedPath)
        }
      }
    }
    // 用户取消选择
    return { type: 'cancelled' }
  })

  ipcMain.handle('save-drawings-dialog', writeDrawFile)

  ipcMain.handle('open-localFolder-dialog', getFolder)

  ipcMain.handle('translate-word', async (_, word) => {
    return await translateWithFreeDictionary(word)
  })

  ipcMain.handle('get-completion', async (_, request: TranslationRequest) => {
    return await getCompletion(request)
  })
  // ipcMain.handle('get-pdf-file-data', async (event, filePath) => {
  //   try {
  //     const normalizedPath = path.normalize(filePath)
  //     const data = await fs.promises.readFile(normalizedPath)
  //     return {
  //       success: true,
  //       data: data.buffer,
  //       fileName: path.basename(normalizedPath)
  //     }
  //   } catch (error) {
  //     return {
  //       success: false,
  //       error: error.message
  //     }
  //   }
  // })
  ipcMain.handle(
    'get-pdf-file-data',
    async (_event, filePath: string): Promise<PdfFileDataResponse> => {
      if (!filePath || typeof filePath !== 'string') {
        return {
          success: false,
          error: 'Invalid file path provided'
        }
      }

      try {
        const normalizedPath = path.normalize(filePath)

        // 添加文件存在性检查
        if (!fs.existsSync(normalizedPath)) {
          return {
            success: false,
            error: 'File does not exist'
          }
        }

        const data = await fs.promises.readFile(normalizedPath)
        return {
          success: true,
          data: data,
          fileName: path.basename(normalizedPath)
        }
      } catch (error: unknown) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }
  )
  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
