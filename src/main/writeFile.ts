import { BrowserWindow, dialog } from 'electron'
// import path from 'node:path'
import fs from 'node:fs' // 需要文件系统模块来写入文件

export const writeDrawFile = async (_: any, data: string, suggestedName: string) => {
  console.log('Main process received save-drawings-dialog request.')
  const win = BrowserWindow.getFocusedWindow() // 获取当前聚焦的窗口
  if (!win) {
    console.error('No focused window found for save dialog.')
    return false
  }

  try {
    const result = await dialog.showSaveDialog(win, {
      title: '保存绘图数据',
      defaultPath: `${suggestedName}.drawdata`, // 使用建议的名称，并添加自定义扩展名
      filters: [
        { name: '绘图数据文件', extensions: ['drawdata'] }, // 定义你的文件类型
        { name: '所有文件', extensions: ['*'] }
      ]
    })

    if (!result.canceled && result.filePath) {
      console.log('User selected file path:', result.filePath)
      // 写入数据到文件
      await fs.promises.writeFile(result.filePath, data, 'utf-8')
      console.log('Drawings data saved to:', result.filePath)
      return true // 保存成功
    } else {
      console.log('Save dialog was cancelled by user.')
      return false // 用户取消或未选择路径
    }
  } catch (error) {
    console.error('Error during save drawings dialog or file write:', error)
    // 可以考虑向渲染进程发送错误消息
    return false // 保存失败
  }
}
