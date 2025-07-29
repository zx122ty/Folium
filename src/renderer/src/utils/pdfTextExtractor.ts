// src/utils/pdfTextExtractor.ts

/**
 * 提取并拼接字符串
 * @param items - PDF 文本内容项列表
 * @returns 拼接后的文本
 */
export function extractAndJoinStrings(items: { str: string }[]): string {
  const fullText = items.map((item) => item.str).join(' ')
  const abstractIndex = fullText.indexOf('Abstract')
  return abstractIndex !== -1 ? fullText.substring(abstractIndex) : fullText
}

/**
 * 提取 Abstract 到 References 之间的内容
 * @param text - 完整文本
 * @returns 截取后的文本
 */
export function extractMainContent(text: string): string {
  const abstractMatch = text.match(/Abstract/i)
  const referencesMatch = text.match(/References|Bibliography|Works Cited/i)
  const stopKeywords = /Acknowledgements|Supplementary data|Conflict of interest|Funding/i
  const stopMatch = text.match(stopKeywords)

  let startIndex = 0
  let endIndex = text.length

  if (abstractMatch) {
    startIndex = abstractMatch.index || 0
  }

  if (referencesMatch) {
    endIndex = referencesMatch.index || text.length
  }

  if (stopMatch && (!referencesMatch || (stopMatch.index || 0) < (referencesMatch.index || 0))) {
    endIndex = stopMatch.index || text.length
  }

  if (abstractMatch && endIndex > (abstractMatch.index || 0)) {
    return text.substring(startIndex, endIndex)
  } else if (abstractMatch) {
    return text.substring(startIndex)
  } else if (endIndex < text.length) {
    return text.substring(0, endIndex)
  }

  return text
}

/**
 * 去除引用标记，如 [1], [2,3], [4-6]
 * @param text - 输入文本
 * @returns 去除引用后的文本
 */
export function removeReferenceMarkers(text: string): string {
  return text.replace(/\[\d+(,\s*\d+)*(-\d+)*\]/g, '')
}

/**
 * 获取 URL 的 ArrayBuffer 数据
 * @param url - 要获取的 URL
 * @returns ArrayBuffer 数据
 */
export const fetchAsArrayBuffer = async (url: string): Promise<ArrayBuffer> => {
  const response = await fetch(url)
  const reader = response.body?.getReader()

  if (!reader) {
    throw new Error('Failed to get response body reader')
  }

  const chunks: Uint8Array[] = []
  let totalSize = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    if (value) {
      totalSize += value.length
      chunks.push(value)
    }
  }

  // 使用更高效的合并方式
  const mergedArray = new Uint8Array(totalSize)
  let offset = 0
  for (const chunk of chunks) {
    mergedArray.set(chunk, offset)
    offset += chunk.length
  }

  return mergedArray.buffer
}
