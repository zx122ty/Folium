import { createApp } from 'vue'
import App from './App.vue'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import router from './router/index'
import { svgSprites } from './assets/PdfViewerIcons/svg-sprite'
import SvgIcon from '@renderer/views/PdfViewer/components/SvgIcon.vue'
// 状态管理
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const app = createApp(App)

// 创建并配置 Pinia
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 创建 SVG sprite 容器并注入到页面
const svgContainer = document.createElement('div')
svgContainer.innerHTML = svgSprites
document.body.appendChild(svgContainer)

// 按正确顺序安装插件
app.use(pinia) // Pinia 必须先于 router 安装
app.use(ElementPlus)
app.use(router)
// 全局注册 SVG 图标组件
app.component('SvgIcon', SvgIcon)
app.mount('#app')
