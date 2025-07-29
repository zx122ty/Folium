import { IpcMainInvokeEvent } from 'electron'

import fs from 'fs'
import path from 'path'
import { dialog } from 'electron'

interface ReadFileResponse {
  success: boolean

  path?: string

  error?: string
}

export const readPdf = async (
  _event: IpcMainInvokeEvent,

  filePath: string
): Promise<ReadFileResponse> => {
  console.log('here is readPdf')
  console.log('filePath:', filePath)
  try {
    if (!filePath) {
      throw new Error('No file path provided')
    }

    return {
      success: true,

      path: filePath
    }
  } catch (error: unknown) {
    return {
      success: false,

      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

interface FileItem {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileItem[]
}

const readDirectory = (dirPath: string): FileItem[] => {
  try {
    return fs.readdirSync(dirPath).map((fileName) => {
      const filePath = path.join(dirPath, fileName)
      const stats = fs.statSync(filePath)

      return {
        name: fileName,
        path: filePath,
        type: stats.isDirectory() ? 'directory' : 'file',
        children: stats.isDirectory() ? readDirectory(filePath) : undefined
      }
    })
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error)
    return []
  }
}

export const getFolder = async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })

  if (result.canceled || result.filePaths.length === 0) {
    return { rootPath: null, fileTree: [] } // 明确返回对象结构
  }
  return {
    rootPath: result.filePaths[0],
    fileTree: readDirectory(result.filePaths[0]) || []
  }
}

export const translateWithFreeDictionary = async (word: string) => {
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    )
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('FreeDictionary API错误:', error)
    throw error
  }
}
