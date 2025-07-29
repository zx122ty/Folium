import axios from 'axios'

// 定义 TypeScript 接口
interface TencentSettings {
  secretId: string
  secretKey: string
  region: string
  endpoint: string
}

interface OpenAISettings {
  model: string
  MyPrompt: string
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

// OpenAI Completion 函数
export const getCompletion = async (request: TranslationRequest) => {
  const { text, settings } = request

  const client = axios.create({
    baseURL: 'https://api.xty.app/v1',
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000, // 30秒超时
    maxRedirects: 5
  })

  try {
    const response = await client.post('/chat/completions', {
      model: settings.openai.model,
      messages: [
        {
          role: 'system',
          content: settings.openai.MyPrompt
        },
        { role: 'user', content: text }
      ]
    })

    const content = response.data.choices[0].message.content
    return content
  } catch (error: any) {
    console.error('OpenAI API错误:', error.response ? error.response.data : error.message)
    throw new Error(error.response ? JSON.stringify(error.response.data) : error.message)
  }
}
