<template>
  <div class="pdf-viewer-container">
    <!-- 划词翻译对话框 - 现在可拖拽和缩放 -->
    <div
      class="translation-dialog"
      v-show="isTranslationMode && !isTranslationMinimized"
      :style="{
        left: dialogPosition.x + 'px',
        top: dialogPosition.y + 'px',
        width: dialogSize.width + 'px',
        height: dialogSize.height + 'px'
      }"
    >
      <!-- 顶部拖拽区域 -->
      <div
        class="translation-header"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="endDrag"
        @mouseleave="endDrag"
      >
        <span class="dialog-title">划词翻译</span>
        <div class="dialog-actions">
          <el-button @click="openTranslationSettings" size="small" circle>
            <el-icon><Setting /></el-icon>
          </el-button>
          <el-button @click="minimizeTranslationDialog" size="small" circle>
            <el-icon><Minus /></el-icon>
          </el-button>
          <el-button @click="exitTranslationMode" size="small" circle type="danger">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="translation-content" v-if="!showTranslationSettings">
        <el-scrollbar>
          <!-- <div class="original-text">{{ selectedText }}</div> -->

          <el-input
            class="original-text"
            v-model="editableText"
            @input="handleTextChange"
            placeholder="可在此修改选中的文本"
            clearable
          >
            <template #prefix>
              <el-icon><Edit /></el-icon>
            </template>
          </el-input>

          <div class="translation-result" v-if="translationResult">
            <!-- <div class="translated-text" style="white-space: pre-wrap">
              {{ translationResult }}
            </div> -->
            <div class="translated-text" v-html="translationResult"></div>
            <!-- <div class="translated-text">{{ translationResult }}</div> -->
          </div>
          <div class="translation-placeholder" v-else>
            <el-icon><Promotion /></el-icon>
            <p>请划选文本进行翻译</p>
          </div>
        </el-scrollbar>
      </div>

      <!-- 设置区域 -->
      <div class="translation-settings" v-else>
        <h3>翻译设置</h3>
        <el-form label-width="100px">
          <el-form-item label="翻译API">
            <el-select v-model="translationSettings.api" placeholder="请选择翻译API">
              <el-option label="Free Dictionary" value="freeDictionary"></el-option>
              <el-option label="Google翻译" value="google"></el-option>
              <el-option label="百度翻译" value="baidu"></el-option>
              <el-option label="有道翻译" value="youdao"></el-option>
              <el-option label="腾讯翻译" value="tencent"></el-option>
              <el-option label="Ai翻译" value="OpenAiN3"></el-option>
              <el-option label="自定义API" value="custom"></el-option>
            </el-select>
          </el-form-item>
          <!-- OpenAiN3 -->
          <template v-if="translationSettings.api === 'OpenAiN3'">
            <el-form-item label="API密钥">
              <el-input
                v-model="translationSettings.apiKey"
                placeholder="请输入API密钥"
                show-password
              ></el-input>
            </el-form-item>

            <el-form-item label="全文理解">
              <el-switch v-model="AllText" active-text="Open" inactive-text="Close" />
            </el-form-item>

            <el-form-item label="提示词">
              <el-input v-model="MyPrompt" />
            </el-form-item>

            <el-form-item label="Model">
              <el-select v-model="translationSettings.openai.model" placeholder="请选择模型">
                <el-option label="GPT-4" value="gpt-4"></el-option>
                <el-option label="GPT-4 Turbo" value="gpt-4-turbo-preview"></el-option>
                <el-option label="GPT-3.5 Turbo" value="gpt-3.5-turbo"></el-option>
                <el-option label="GPT-3.5 Turbo 16K" value="gpt-3.5-turbo-16k"></el-option>
                <el-option label="GPT-4 32K" value="gpt-4-32k"></el-option>
              </el-select>
            </el-form-item>
          </template>

          <!-- 百度/有道API设置 -->
          <template
            v-if="translationSettings.api === 'baidu' || translationSettings.api === 'youdao'"
          >
            <el-form-item label="API ID">
              <el-input v-model="translationSettings.apiId" placeholder="请输入API ID"></el-input>
            </el-form-item>
            <el-form-item label="API密钥">
              <el-input
                v-model="translationSettings.apiKey"
                placeholder="请输入API密钥"
                show-password
              ></el-input>
            </el-form-item>
          </template>

          <!-- 腾讯翻译API设置 -->
          <template v-if="translationSettings.api === 'tencent'">
            <el-form-item label="SecretId">
              <el-input
                v-model="translationSettings.tencent.secretId"
                placeholder="请输入腾讯云SecretId"
              ></el-input>
            </el-form-item>
            <el-form-item label="SecretKey">
              <el-input
                v-model="translationSettings.tencent.secretKey"
                placeholder="请输入腾讯云SecretKey"
                show-password
              ></el-input>
            </el-form-item>
            <el-form-item label="区域">
              <el-select v-model="translationSettings.tencent.region" placeholder="请选择区域">
                <el-option label="重庆" value="ap-chongqing"></el-option>
                <el-option label="上海" value="ap-shanghai"></el-option>
                <el-option label="北京" value="ap-beijing"></el-option>
                <el-option label="广州" value="ap-guangzhou"></el-option>
              </el-select>
            </el-form-item>
            <el-alert title="安全提示" type="warning" :closable="false" style="margin-bottom: 15px">
              腾讯云密钥属于敏感信息，请妥善保管。建议定期轮换密钥。
            </el-alert>
          </template>

          <!-- 自定义API设置 -->
          <template v-if="translationSettings.api === 'custom'">
            <el-form-item label="API地址">
              <el-input
                v-model="translationSettings.apiUrl"
                placeholder="https://api.example.com/translate"
              ></el-input>
            </el-form-item>

            <el-form-item label="请求方法">
              <el-radio-group v-model="translationSettings.apiMethod">
                <el-radio label="GET">GET</el-radio>
                <el-radio label="POST">POST</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="请求头">
              <el-input
                type="textarea"
                v-model="translationSettings.apiHeaders"
                placeholder="JSON格式，如: {'Content-Type': 'application/json'}"
                :rows="2"
              ></el-input>
            </el-form-item>
            <el-form-item label="请求体">
              <el-input
                type="textarea"
                v-model="translationSettings.apiBody"
                placeholder="JSON格式，使用{{text}}和{{target}}作为变量"
                :rows="3"
              ></el-input>
            </el-form-item>
            <el-form-item label="结果路径">
              <el-input
                v-model="translationSettings.apiResultPath"
                placeholder="如: data.result.translation"
              ></el-input>
            </el-form-item>
          </template>

          <el-form-item label="目标语言">
            <el-input
              v-if="translationSettings.api === 'OpenAiN3'"
              v-model="translationSettings.targetLanguage"
              placeholder="请输入目标语言"
            >
            </el-input>
            <el-select
              v-else
              v-model="translationSettings.targetLanguage"
              placeholder="请选择目标语言"
            >
              <el-option
                v-for="lang in languageOptions"
                :key="lang.value"
                :label="lang.label"
                :value="lang.value"
              ></el-option>
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="saveTranslationSettings">保存设置</el-button>
            <el-button @click="showTranslationSettings = false">取消</el-button>

            <!-- <el-button
              type="default"
              @click="testTranslation"
              :loading="isTesting"
              :disabled="!canTestConnection"
            >
              测试连接
            </el-button> -->
          </el-form-item>
        </el-form>
      </div>

      <!-- 缩放控制点 -->
      <div class="resize-handle" @mousedown="startResize"></div>
    </div>

    <!-- 最小化时的翻译按钮 -->
    <div
      class="translation-minimized"
      v-show="isTranslationMinimized"
      @click="restoreTranslationDialog"
    >
      <el-tooltip content="恢复翻译窗口" placement="left">
        <el-icon><Comment /></el-icon>
      </el-tooltip>
    </div>

    <div
      class="thumbnail-sidebar"
      :class="{ active: showThumbnails }"
      :style="{ width: sidebarWidth + 'px' }"
    >
      <!-- Add sidebar header with toggle buttons -->
      <div class="sidebar-header-left">
        <el-button
          @click="activeSidebarView = 'thumbnails'"
          :type="activeSidebarView === 'thumbnails' ? 'primary' : ''"
          size="small"
          plain
        >
          <el-icon size="16"><Picture /></el-icon>
        </el-button>
        <el-button
          @click="activeSidebarView = 'structure'"
          :type="activeSidebarView === 'structure' ? 'primary' : ''"
          size="small"
          plain
        >
          <SvgIcon name="menu" :size="20" color="#333" />
        </el-button>

        <el-button @click="ifFixLeft = !ifFixLeft" :type="ifFixLeft ? 'primary' : ''" size="small">
          <SvgIcon name="pin" :size="14" color="#333" />
        </el-button>
      </div>

      <!-- 这里放置缩略图内容 -->
      <el-scrollbar>
        <div v-show="activeSidebarView === 'thumbnails'">
          <div
            v-for="page in pdfState.numPages"
            :key="page"
            class="thumbnail-item"
            :class="{ active: pdfState.pageNum === page }"
            @click="switchPage(page)"
          >
            <!-- 缩略图容器 -->
            <canvas class="thumbnail-canvas" :data-page="page"></canvas>
            <div class="page-number">{{ page }}</div>
          </div>
        </div>

        <!-- Structure view -->
        <div v-show="activeSidebarView === 'structure'" class="structure-view">
          <div v-if="pdfOutline.length > 0" class="outline-container">
            <pdf-outline-item
              v-for="(item, index) in pdfOutline"
              :key="index"
              :item="item"
              @navigate="jumpToOutlineDestination"
            />
          </div>
          <div v-else class="no-outline">本文档没有可用的目录结构</div>
        </div>
      </el-scrollbar>

      <!-- 添加可拖拽调整宽度的元素 -->
      <div class="sidebar-resizer" @mousedown="startResizeSidebar"></div>
    </div>

    <div class="main-content">
      <Toolbar :class="{ collapsed: isToolbarCollapsed }">
        <el-button
          :style="{ width: '36px', height: '36px' }"
          @click="showThumbnails = !showThumbnails"
        >
          <el-icon><Menu /></el-icon>
        </el-button>

        <!-- <input
          type="file"
          id="pdf-upload"
          accept=".pdf"
          @change="handleFileChange($event)"
          style="display: none"
        /> -->

        <el-button @click="openPdfFile" :bg="true" :style="{ width: '36px', height: '36px' }">
          <SvgIcon name="openFile" :size="14" color="#333" />
        </el-button>
        <el-button @click="translationText" :style="{ width: '36px', height: '36px' }">
          <SvgIcon name="translation" :size="16" color="#333" />
        </el-button>
        <el-button @click="pageUp" :style="{ width: '36px', height: '36px' }"
          ><el-icon><ArrowLeft /></el-icon
        ></el-button>

        <el-input
          type="number"
          @keyup.enter="jumpToPage"
          v-model="jumpPage"
          style="width: 50px"
          class="page-input"
          :class="{ 'hidden-input': isToolbarCollapsed }"
        />

        <el-button @click="pageDown" :style="{ width: '36px', height: '36px' }">
          <el-icon><ArrowRight /></el-icon>
        </el-button>

        <el-button @click="zoomIn" :style="{ width: '36px', height: '36px' }"
          ><el-icon><ZoomIn /></el-icon
        ></el-button>
        <el-button @click="zoomOut" :style="{ width: '36px', height: '36px' }"
          ><el-icon><ZoomOut /></el-icon
        ></el-button>
        <el-button @click="pageRest" :style="{ width: '36px', height: '36px' }"
          ><el-icon><Refresh /></el-icon
        ></el-button>
        <el-button @click="PDFDownload" :style="{ width: '36px', height: '36px' }"
          ><el-icon><Download /></el-icon
        ></el-button>
        <el-button @click="PDFPrint" :style="{ width: '36px', height: '36px' }"
          ><el-icon><Printer /></el-icon
        ></el-button>

        <!-- 绘图模式按钮（只控制模式） -->
        <button
          @click="toggleDrawingMode"
          class="tool-button-top"
          :class="{ active: isDrawingMode }"
        >
          <SvgIcon name="drawMode" :size="18" color="#333" />
          <component :is="isDrawingMode ? 'Close' : 'EditPen'" />
        </button>

        <!-- 图层侧边栏按钮（只控制侧边栏） -->
        <el-button @click="showLayers = !showLayers" :style="{ width: '36px', height: '36px' }">
          <SvgIcon name="layers" :size="18" color="#333" />
          <component :is="showLayers ? 'Close' : 'Collection'" />
        </el-button>

        <!-- 新增全屏按钮 -->
        <el-button @click="toggleFullScreen" :style="{ width: '36px', height: '36px' }">
          <el-icon><FullScreen /></el-icon>
        </el-button>

        <!-- 新增联系按钮 -->

        <el-popover placement="top" width="400px" trigger="click">
          <template #reference>
            <el-button :style="{ width: '36px', height: '36px' }">
              <SvgIcon name="contact" :size="16" color="#333" />
            </el-button>
          </template>

          <el-scrollbar height="590px">
            <div class="total-settings">
              <!-- 上半部分：形状设置 -->
              <h2>💓 感谢使用(*^-^)ρ 🎉</h2>
              <div class="shape-settings">
                <h3 style="margin-bottom: 5px; margin-top: 5px">联系我📞:</h3>
                <div>
                  <span><b>Email📧:</b> sinceresitzx@qq.com</span>
                </div>
                <div style="margin-top: 5px"><b>WeChat💬:</b></div>
                <el-image :src="WechatImgUrl" />
              </div>
              <!-- 分隔线 <\(^o^)/~> -->
            </div>
          </el-scrollbar>
        </el-popover>

        <!-- 新增的错误标签按钮 -->
        <el-button
          @click="toggleToolbarCollapse"
          class="error-button"
          :style="{ width: '36px', height: '36px' }"
        >
          {{ isToolbarCollapsed ? '≡' : '×' }}
        </el-button>
      </Toolbar>

      <div id="pdf-container" tabindex="0">
        <div id="vue-pdf-view">
          <div
            id="page-view"
            :style="{
              transform: `scale(${scaleData})`,
              width: '100%',
              height: 'auto',
              margin: '0 auto'
            }"
          >
            <VuePdfEmbed
              ref="vuePdfRef"
              :source="pdfState.pdfSource"
              :page="pdfState.pageNum"
              :text-Layer="!isDrawingMode"
              :annotation-Layer="!isDrawingMode"
              @click="closeSidebar"
              @rendered="handlePdfRendered"
            />

            <!-- 添加图层容器 -->
            <div class="layers-container">
              <div
                v-for="(layer, index) in layers"
                :key="index"
                class="canvas-layer"
                :style="{ zIndex: index + 1 }"
              >
                <canvas
                  ref="canvasLayers"
                  :style="{ pointerEvents: canvasPointerEvents }"
                  @mousedown="startDrawing($event, index)"
                  @mousemove="draw($event, index)"
                  @mouseup="stopDrawing"
                  @mouseleave="stopDrawing"
                ></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 文字输入框  class="text-input"-->

      <div
        v-show="textInputVisible"
        class="text-input-container"
        :style="{
          left: `${textInputPosition.x}px`,
          top: `${textInputPosition.y}px`,
          transform: `scale(${scaleData})`,
          'transform-origin': 'left top'
        }"
        @mousedown.stop
      >
        <!--  取消回车 @keydown.enter="saveTextAnnotation" -->

        <textarea
          ref="textInputRef"
          v-model="textInputValue"
          type="textarea"
          :autosize="{ minRows: 1 }"
          @blur="handleBlur"
          placeholder="输入文字..."
          class="exact-position-input"
        />
        <!-- <div class="text-actions">
          <el-button size="small" @click="saveTextAnnotation">确定</el-button>
          <el-button size="small" @click="cancelTextInput">取消</el-button>
        </div> -->
      </div>
    </div>

    <!-- 添加右侧图层侧边栏 -->
    <div class="layer-sidebar" :class="{ active: showLayers }">
      <div class="page-list-sidebar">
        <el-scrollbar>
          <div
            v-for="page in pdfState.numPages"
            :key="page"
            class="page-item"
            :class="{ active: pdfState.pageNum === page }"
            @click="switchPage(page)"
          >
            <span class="page-number">{{ page }}</span>
          </div>
        </el-scrollbar>
      </div>

      <div class="right-panel">
        <div class="sidebar-header">
          <div class="sidebar-header">
            <h3>Layers</h3>
            <!-- 添加重命名按钮 -->

            <div>
              <el-button @click="startRenameLayer" circle size="small" :disabled="!layers.length">
                <el-icon><EditPen /></el-icon>
              </el-button>

              <el-button @click="addLayer" circle size="small">
                <el-icon><Plus /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <div class="layer-list">
          <el-scrollbar>
            <div
              v-for="(layer, index) in layers"
              :key="index"
              class="layer-item"
              :class="{ active: activeLayerIndex === index }"
              @click="setActiveLayer(index)"
            >
              <!-- 显示图层名称或输入框 -->
              <div v-if="renamingIndex === index" class="layer-name-input">
                <el-input
                  ref="layerNameInput"
                  v-model="layer.name"
                  size="small"
                  @keyup.enter="finishRenaming"
                  @blur="finishRenaming"
                  autofocus
                />
              </div>
              <span v-else class="layer-name">
                {{ layer.name || `Layer ${index + 1}` }}
              </span>
              <div class="layer-actions">
                <el-button
                  @click.stop="toggleLayerVisibility(index)"
                  circle
                  size="small"
                  :type="layer.visible ? '' : 'info'"
                >
                  <el-icon><View /></el-icon>
                </el-button>
                <el-button @click.stop="clearLayer(index)" circle size="small">
                  <el-icon><Refresh /></el-icon>
                </el-button>

                <el-button
                  @click.stop="changeBackgroudColor(index)"
                  circle
                  size="small"
                  :type="layers[index].backgroundColor === 'white' ? 'primary' : ''"
                >
                  <el-icon><ToiletPaper /></el-icon>
                </el-button>

                <el-button @click.stop="removeLayer(index)" circle size="small" type="danger">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </el-scrollbar>
        </div>
      </div>
    </div>

    <!-- 添加底部画笔工具栏 -->
    <div class="brush-toolbar" v-show="showBrushToolbar">
      <!-- 颜色选择按钮 -->
      <el-popover placement="top" width="210" trigger="hover" v-model:visible="showColorPicker">
        <template #reference>
          <button class="tool-button">
            <div class="color-preview" :style="{ backgroundColor: brushColor }" />
          </button>
        </template>

        <div class="color-picker">
          <div
            v-for="color in presetColors"
            :key="color"
            class="color-option"
            :style="{ backgroundColor: color }"
            @click="(brushColor = color), (showColorPicker = false)"
          />
          <el-color-picker v-model="brushColor" show-alpha @change="showColorPicker = false" />
        </div>
      </el-popover>

      <!-- 添加选择按钮 -->
      <button
        @click="setActiveTool('select')"
        :class="{ active: activeTool === 'select' }"
        class="tool-button"
      >
        <el-icon><Pointer /></el-icon>
      </button>

      <button
        @click="setActiveTool('rectangle')"
        :class="{ active: activeTool === 'rectangle' }"
        class="tool-button"
      >
        <SvgIcon name="rectangle" :size="16" color="#333" />
      </button>

      <button
        @click="setActiveTool('ellipse')"
        :class="{ active: activeTool === 'ellipse' }"
        class="tool-button"
      >
        <SvgIcon name="ellipse" :size="16" color="#333" />
      </button>

      <button
        @click="setActiveTool('line')"
        :class="{ active: activeTool === 'line' }"
        class="tool-button"
      >
        <el-icon><Minus /></el-icon>
      </button>

      <!-- 文字按钮 -->
      <button
        @click="setActiveTool('text')"
        :class="{ active: activeTool === 'text' }"
        class="tool-button"
      >
        <SvgIcon name="text" :size="16" color="#333" />
      </button>

      <!-- 画笔按钮 -->
      <button
        @click="setActiveTool('brush')"
        :class="{ active: activeTool === 'brush' }"
        class="tool-button"
      >
        <SvgIcon name="brush" :size="16" color="#333" />
      </button>

      <!-- 橡皮擦按钮 -->
      <button
        @click="setActiveTool('eraser')"
        :class="{ active: activeTool === 'eraser' }"
        class="tool-button"
      >
        <SvgIcon name="eraser" :size="18" color="#333" />
      </button>

      <!-- 清空画布 -->
      <button
        @click="setBrushMode('clear'), (shapeMode = null), clearLayer(activeLayerIndex)"
        :type="brushMode === 'clear' && !shapeMode ? 'primary' : ''"
        class="tool-button"
      >
        <SvgIcon name="clear" :size="16" color="#333" />
      </button>

      <!-- 总设置按钮 -->
      <el-popover placement="top" width="400px" trigger="click">
        <template #reference>
          <button class="tool-button">
            <el-icon :size="16"><Setting /></el-icon>
          </button>
        </template>

        <el-scrollbar height="600px">
          <div class="total-settings">
            <!-- 上半部分：形状设置 -->
            <div class="shape-settings">
              <h4>形状设置</h4>
              <el-checkbox v-model="shapeSettings.fill">填充形状</el-checkbox>
              <div class="setting-item">
                <span>边框粗细:</span>
                <el-slider v-model="shapeSettings.borderWidth" :min="1" :max="20" />
              </div>
              <div class="setting-item">
                <span>透明度:</span>
                <el-slider v-model="shapeSettings.opacity" :min="0.01" :max="1" :step="0.01" />
              </div>
            </div>
            <!-- 分隔线 -->
            <el-divider />

            <!-- 中间部分：文字设置 -->
            <div class="text-settings">
              <h4>文字设置</h4>
              <div class="setting-item">
                <span>字体:</span>
                <el-select v-model="textSettings.fontFamily" size="small">
                  <el-option value="Arial">Arial</el-option>
                  <el-option value="Times New Roman">Times New Roman</el-option>
                  <el-option value="Courier New">Courier New</el-option>
                  <el-option value="SimSun">宋体</el-option>
                  <el-option value="Microsoft YaHei">微软雅黑</el-option>
                </el-select>
              </div>
              <div class="setting-item">
                <span>大小:</span>
                <el-slider v-model="textSettings.fontSize" :min="8" :max="72" />
              </div>
              <div class="setting-item">
                <span>粗细:</span>
                <el-radio-group v-model="textSettings.fontWeight" size="small">
                  <el-radio-button value="normal">常规</el-radio-button>
                  <el-radio-button value="bold">加粗</el-radio-button>
                </el-radio-group>
              </div>
              <div class="setting-item">
                <el-checkbox v-model="textSettings.underline">下划线</el-checkbox>
              </div>
              <div class="setting-item">
                <el-checkbox v-model="textSettings.hasBackground">背景</el-checkbox>
                <el-color-picker
                  v-model="textSettings.backgroundColor"
                  size="small"
                  :disabled="!textSettings.hasBackground"
                />
              </div>
            </div>

            <!-- 分隔线 -->
            <el-divider />

            <!-- 下半部分：画笔设置 -->
            <div class="brush-settings">
              <h4>画笔设置</h4>
              <div class="setting-item">
                <span>画笔粗细:</span>
                <el-slider v-model="brushSettings.size" :min="1" :max="50" />
              </div>
              <div class="setting-item">
                <span>透明度:</span>
                <el-slider v-model="brushSettings.opacity" :min="0.01" :max="1" :step="0.01" />
              </div>
            </div>
          </div>
        </el-scrollbar>
      </el-popover>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch, onUnmounted, nextTick, computed, toRef, toRaw } from 'vue'
import VuePdfEmbed from 'vue-pdf-embed'
import 'pdfjs-dist/web/pdf_viewer.css'
import WechatImgUrl from '../../assets/wechat-contact.jpg'
import { ElButton, ElInput, ElScrollbar, ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Menu,
  Plus,
  Delete,
  View,
  Refresh,
  CirclePlus,
  Crop,
  Minus,
  Pointer,
  Setting,
  Document,
  Close,
  Promotion,
  Edit,
  FullScreen,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Printer,
  Download,
  EditPen,
  Picture,
  ToiletPaper,
  Comment
} from '@element-plus/icons-vue'
import PdfOutlineItem from './Outline/PdfOutlineItem.vue'
import Toolbar from './Toolbar.vue'

import { useRoute, useRouter } from 'vue-router'
const router = useRouter()
const route = useRoute()

import { useAppStore } from '@renderer/store'
const appStore = useAppStore()

const loadPdfFile = async (routerUrl) => {
  try {
    if (!routerUrl) return null

    // 如果是本地文件路径(file://开头)，则使用Electron API读取文件
    if (routerUrl.startsWith('file://')) {
      if (!window.Myapi) {
        throw new Error('Electron API 不可用')
      }

      const filePath = routerUrl.replace('file://', '')
      const result = await window.Myapi.getPdfFileData(filePath)
      if (!result.success) {
        throw new Error(result.error || '无法读取PDF文件')
      }

      if (!result.data) {
        throw new Error('未获取到PDF文件数据')
      }

      // 创建Blob对象
      const blob = new Blob([new Uint8Array(result.data)], { type: 'application/pdf' })
      return URL.createObjectURL(blob)
    } else {
      return routerUrl
    }
  } catch (error) {
    console.error('加载PDF失败:', error instanceof Error ? error.message : String(error))
    return null
  }
}

const loadPdf = async (url, tabId) => {
  if (!url) return

  // 确保当前确实是这个标签页的PDF
  if (tabId && tabId !== appStore.activeTabId) {
    return
  }

  const pdfUrl = await loadPdfFile(url)
  if (pdfUrl) {
    pdfState.pdfSource.url = pdfUrl

    const loadingTask = createLoadingTask(pdfState.pdfSource)
    loadingTask.promise
      .then((pdf) => {
        pdfState.numPages = pdf.numPages
        // 初始化所有页面的绘图数据
        for (let i = 1; i <= pdf.numPages; i++) {
          initPageDrawings(i)
        }
        loadThumbnails()
        parsePdfOutline()
        renderThumbnails()
      })
      .catch((error) => {
        console.error('PDF 加载失败:', error)
      })
  }
}
// const props = defineProps({
//   pdfUrl: {
//     type: String,
//     required: true
//   }
// })

const pdfState = reactive({
  pdfSource: {
    url: '',
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.9.359/cmaps/',
    cMapPacked: true
  },
  pageNum: 1,
  numPages: 1
})

const getCurrentPdfUrl = () => {
  return route.query.pdfUrl || appStore.activePdfUrl
}

// onMounted(async () => {
//   const pdfUrl = getCurrentPdfUrl()
//   await loadPdf(pdfUrl)
// })

// watch(
//   () => appStore.activeTabId,
//   async (newVal, oldVal) => {
//     if (newVal !== oldVal) {
//       const pdfUrl = getCurrentPdfUrl()
//       await loadPdf(pdfUrl)
//     }
//   }
// )

onMounted(async () => {
  await loadPdf(route.query.pdfUrl?.toString(), route.query.tabId?.toString())
})

// 监听路由变化
watch(
  () => route.query,
  async (newQuery) => {
    await loadPdf(newQuery.pdfUrl?.toString(), newQuery.tabId?.toString())
  }
)
// 监听标签页切换
watch(
  () => appStore.activeTabId,
  async (newId) => {
    const activeTab = appStore.activeTab
    if (activeTab?.pdfUrl) {
      // 确保路由同步
      if (route.path !== '/PdfViewer' || route.query.pdfUrl !== activeTab.pdfUrl) {
        router.push({
          path: '/PdfViewer',
          query: {
            pdfUrl: activeTab.pdfUrl,
            tabId: newId
          }
        })
      }
    }
  }
)

// import { useRouter } from 'vue-router'
// const router = useRouter()
// watch(
//   () => appStore.activeTabId,
//   async (newId) => {
//     const activeTab = appStore.tabs.find((tab) => tab.id === newId)
//     if (activeTab?.pdfUrl) {
//       await loadPdf(activeTab.pdfUrl)
//     } else {
//       // 如果没有PDF，跳转到基础页面
//       router.push(activeTab?.route || '/base')
//     }
//   },
//   { immediate: true }
// )

// import { createLoadingTask } from 'vue3-pdfjs/esm '
// ../../assets/js/pdf.worker.js
import * as pdfjsLib2 from 'pdfjs-dist'
pdfjsLib2.GlobalWorkerOptions.workerSrc = new URL(
  '@renderer/assets/js/pdf.worker.js',
  import.meta.url
).href

var createLoadingTask = function createLoadingTask(src) {
  // pdfjsLib2.GlobalWorkerOptions.workerSrc = PDFJSWorker2
  var loadingTask = pdfjsLib2.getDocument(src)
  return loadingTask
}

function pageUp() {
  if (pdfState.pageNum > 1) {
    saveCurrentPage()

    pdfState.pageNum--
    jumpPage.value = pdfState.pageNum
    loadCurrentPage()
  }
}

function pageDown() {
  if (pdfState.pageNum < pdfState.numPages) {
    saveCurrentPage()
    pdfState.pageNum++
    jumpPage.value = pdfState.pageNum
    loadCurrentPage()
  }
}

// 快捷键
// 键盘事件处理
const handleKeyDown = (e) => {
  // 如果焦点在输入框，则不处理
  if (document.activeElement.tagName === 'INPUT') return

  switch (e.key) {
    case 'ArrowLeft':
      pageUp()
      break
    case 'ArrowRight':
      pageDown()
      break
    case 'Delete':
      deleteSelectedShape()
      break
    case 'Backspace':
      deleteSelectedShape()
      break
  }
}

const jumpPage = ref('1') // 保持字符串类型

function jumpToPage() {
  const pageNum = Number(jumpPage.value) // 转换为数字
  if (pageNum <= pdfState.numPages && pageNum > 0) {
    saveCurrentPage()
    pdfState.pageNum = pageNum
    loadCurrentPage()
  } else {
    console.log('--指定页面不存在--')
  }
}

// 确保页码变化时同步输入框的值
watch(
  () => pdfState.pageNum,
  (val) => {
    jumpPage.value = String(val)
  }
)
watch(
  () => pdfState.pageNum,
  (newPage, oldPage) => {
    if (oldPage) saveCurrentPage()
    loadCurrentPage()
  }
)

const scaleData = ref(1)

function zoomIn() {
  scaleData.value += 0.1
}

function zoomOut() {
  if (scaleData.value > 0.2) {
    scaleData.value -= 0.1
  }
}

function pageRest() {
  console.log('click pageRset')
  saveCurrentPage()
  scaleData.value = 1.0
  loadCurrentPage()
  // loadCurrentPage()
  // if (pdfState.pageNum < pdfState.numPages) {
  //     saveCurrentPage()
  //     pdfState.pageNum++
  //     jumpPage.value = pdfState.pageNum
  //     loadCurrentPage()
  //   }

  // nextTick(() => {
  //   initCanvases()
  //   redrawAllVisibleLayers()
  // })
}

const vuePdfRef = ref(null)

function getPDFFileName() {
  const last_index = pdfState.pdfSource.url.lastIndexOf('/')
  return pdfState.pdfSource.url.slice(last_index + 1)
}

//带笔迹PDF下载功能-------------
import { PDFDocument, rgb } from 'pdf-lib'
import download from 'downloadjs'

async function PDFDownload() {
  saveCurrentPage()
  // console.log("layers.value----:", layers.value);
  // console.log("pageDrawings.value----:", pageDrawings.value);
  // console.group("开始导出PDF流程");
  try {
    //console.log("1. 准备获取原始PDF...");
    const response = await fetch(pdfState.pdfSource.url)
    if (!response.ok) throw new Error(`HTTP错误! 状态码: ${response.status}`)

    // console.log("2. 转换为ArrayBuffer...");
    const originalPdfBytes = await response.arrayBuffer()
    // console.log("原始PDF字节长度:", originalPdfBytes.byteLength);

    // console.log("3. 加载PDF文档...");
    const pdfDoc = await PDFDocument.load(originalPdfBytes)
    const pageCount = pdfDoc.getPageCount()
    // console.log(`共 ${pageCount} 页`);

    // 打印所有页面的绘图数据概览
    // console.log("4. 检查绘图数据:", {
    //   pageDrawings: Object.keys(pageDrawings.value).map((pageNum) => ({
    //     page: pageNum,
    //     layerCount: pageDrawings.value[pageNum]?.layers?.length || 0,
    //     visibleLayers:
    //       pageDrawings.value[pageNum]?.layers?.filter((l) => l.visible)
    //         .length || 0,
    //   })),
    // });

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
      const pageNumber = pageIndex + 1
      // console.group(`处理第 ${pageNumber} 页`);

      const pdfPage = pdfDoc.getPage(pageIndex)
      const { width, height } = pdfPage.getSize()
      // console.log(`页面尺寸: ${width}x${height}`);

      // 获取该页的绘图数据
      const pageData = pageDrawings.value[pageNumber] || {
        layers: [
          {
            visible: true,
            shapes: []
          }
        ]
      }
      //   console.log(`本页图层数: ${pageData.layers.length}`);

      // 创建临时canvas
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = width
      tempCanvas.height = height
      const ctx = tempCanvas.getContext('2d')
      //   console.log("创建临时canvas:", tempCanvas);

      // 绘制所有可见图层的笔迹
      let totalShapes = 0
      pageData.layers.forEach((layer, layerIndex) => {
        if (layer.visible && layer.shapes) {
          // console.log(
          //   `图层 ${layerIndex} (${layer.name || "未命名"}): ${
          //     layer.shapes.length
          //   } 个笔迹`
          // );
          layer.shapes.forEach((shape, shapeIndex) => {
            // console.log(`  绘制笔迹 ${shapeIndex}:`, {
            //   type: shape.type,
            //   x1: shape.x1,
            //   y1: shape.y1,
            //   x2: shape.x2,
            //   y2: shape.y2,
            // });
            const container = document.querySelector('#page-view')
            const width = container.scrollWidth
            const height = container.scrollHeight
            drawShapeOnCanvas2(ctx, shape, width, height)
            totalShapes++
          })
        }
      })
      // console.log(`本页共绘制 ${totalShapes} 个笔迹`);

      // 检查canvas是否有内容
      const imageData = ctx.getImageData(0, 0, 10, 10).data
      const isEmpty = Array.from(imageData).every((v) => v === 0)
      // console.log("Canvas内容检查:", isEmpty ? "空白" : "有内容");

      // 将canvas转换为图像
      //  console.log("将canvas转换为PNG...");
      const imageBytes = await new Promise((resolve) => {
        tempCanvas.toBlob((blob) => {
          const reader = new FileReader()
          reader.onload = () => {
            //   console.log("PNG图像大小:", reader.result.byteLength);
            resolve(reader.result)
          }
          reader.readAsArrayBuffer(blob)
        }, 'image/png')
      })

      // 嵌入PDF
      // console.log("将图像嵌入PDF页面...");
      const image = await pdfDoc.embedPng(imageBytes)
      pdfPage.drawImage(image, {
        x: 0,
        y: 0,
        width,
        height,
        opacity: 1
      })

      console.groupEnd()
    }

    // 保存PDF
    // console.log("5. 保存合并后的PDF...");
    const mergedPdfBytes = await pdfDoc.save()
    // console.log("合并后PDF大小:", mergedPdfBytes.byteLength);

    // 下载
    //   console.log("6. 创建下载链接...");
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = getPDFFileName()
    document.body.appendChild(a)
    a.click()
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)

    //  console.log("导出流程完成！");
    console.groupEnd()
    return true
  } catch (error) {
    console.error('导出过程中出错:', error)
    console.groupEnd()
    alert(`导出失败: ${error.message}`)
    return false
  }
}

// Canvas转图像字节（优化版本）
function canvasToImageBytes(canvas) {
  return new Promise((resolve) => {
    // 使用高质量的PNG格式
    canvas.toBlob(
      (blob) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.readAsArrayBuffer(blob)
      },
      'image/png',
      1.0
    ) // 最高质量
  })
}

// function PDFDownload() {
//   if (vuePdfRef.value) {
//     vuePdfRef.value.download(getPDFFileName());
//   } else {
//     console.error("PDF component not ready");
//   }
// }

//-------------------

function PDFPrint() {
  vuePdfRef.value.print(300, getPDFFileName(), true)
}

//缩略图
const showThumbnails = ref(true) // 控制缩略图显示状态

const loadThumbnails = async () => {
  try {
    const loadingTask = getDocument(pdfState.pdfSource)
    const pdf = await loadingTask.promise

    // 清空之前的缩略图
    const thumbnails = document.querySelectorAll('.thumbnail-canvas')
    thumbnails.forEach((canvas) => {
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    })

    // 渲染新的缩略图
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 0.2 })
      const canvas = document.querySelector(`.thumbnail-canvas[data-page="${i}"]`)

      if (!canvas) continue

      const context = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise
    }
  } catch (error) {
    console.error('加载缩略图失败:', error)
  }
}

//更换文件
const pdfFile = ref(null) // 添加这行

const handleFileChange = async (e) => {
  const input = e.target

  if (!input || !input.files || input.files.length === 0) {
    return
  }

  const file = input.files[0]
  if (file.type !== 'application/pdf') {
    console.error('请选择PDF文件')
    return
  }

  const fileUrl = URL.createObjectURL(file)
  pdfState.pdfSource = {
    url: fileUrl,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.9.359/cmaps/',
    cMapPacked: true
  }

  // 重置状态
  pdfState.pageNum = 1
  jumpPage.value = '1'
  scaleData.value = 1
  pdfOutline.value = [] // 清空目录结构

  // 重新加载PDF
  try {
    const loadingTask = createLoadingTask(pdfState.pdfSource)
    const pdf = await loadingTask.promise
    pdfState.numPages = pdf.numPages

    // 新增：重新加载缩略图和目录
    await loadThumbnails()
    await parsePdfOutline()
  } catch (error) {
    console.error('加载PDF失败:', error)
  }
}

const triggerFileSelect = () => {
  const input = document.getElementById('pdf-upload')
  input.value = '' // 清除之前的选择，允许选择同一个文件
  input?.click()
}

const openPdfFile = async () => {
  try {
    if (!window.Myapi) {
      throw new Error('Electron API 不可用')
    }

    const filePath = await window.Myapi.openPdfDialog()
    if (!filePath) return

    const result = await window.Myapi.getPdfFileData(filePath)
    if (!result.success) {
      throw new Error(result.error || '无法读取PDF文件')
    }

    if (!result.data) {
      throw new Error('未获取到PDF文件数据')
    }

    // 创建Blob对象
    const blob = new Blob([new Uint8Array(result.data)], { type: 'application/pdf' })
    const blobUrl = URL.createObjectURL(blob)

    // 先清理之前的Blob URL
    if (pdfState.pdfSource.url.startsWith('blob:')) {
      URL.revokeObjectURL(pdfState.pdfSource.url)
    }

    // 更新PDF源
    pdfState.pdfSource = {
      url: blobUrl,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.9.359/cmaps/',
      cMapPacked: true
    }

    // 重置状态
    pdfState.pageNum = 1

    // 验证PDF文件
    const loadingTask = createLoadingTask(pdfState.pdfSource)
    const pdf = await loadingTask.promise
    pdfState.numPages = pdf.numPages
    console.log(`成功加载PDF: ${result.fileName}，共${pdfState.numPages}页`)
  } catch (error) {
    console.error('加载PDF失败:', error instanceof Error ? error.message : String(error))
  }
}

onUnmounted(() => {
  if (pdfState.pdfSource.url && pdfState.pdfSource.url.startsWith('blob:')) {
    URL.revokeObjectURL(pdfState.pdfSource.url)
  }
})

//多图层绘制相关

//模式切换
const isDrawingMode = ref(false)
const showLayers = ref(false)

const canvasPointerEvents = computed(() => {
  return isDrawingMode.value ? 'auto' : 'none'
})

const toggleLayerVisibility = (index) => {
  layers.value[index].visible = !layers.value[index].visible
  updateCanvasVisibility()
}

// 修改原因：正确处理图层可见性而不影响其他图层
const changeBackgroudColor = (index) => {
  // 获取当前图层
  console.log('run changeBack')
  const layer = layers.value[index]

  // 切换背景颜色（如果已经是白色就变回透明）
  layer.backgroundColor = layer.backgroundColor === 'white' ? 'transparent' : 'white'

  // 重绘画布
  redrawAllVisibleLayers()
}

const layers = ref([
  {
    id: Date.now(),
    visible: true,
    name: 'Layer 1',
    shapes: [], // 每个图层有自己的形状数据
    backgroundColor: 'transparent'
  }
])

const activeLayerIndex = ref(0)
const canvasLayers = ref([])

// 画笔相关状态

const showBrushToolbar = ref(false) // 控制画笔工具栏显示

// 画笔设置
const brushSettings = ref({
  size: 3,
  opacity: 1
})

// 形状设置
const shapeSettings = ref({
  borderWidth: 2,
  opacity: 1,
  fill: false
})

// 修改绘图模式切换函数
const toggleDrawingMode = () => {
  isDrawingMode.value = !isDrawingMode.value
  showBrushToolbar.value = isDrawingMode.value // 同步控制画笔工具栏
}

const brushMode = ref('brush')
const brushColor = ref('#000000')
// const isEraser = ref(false);
const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)

// const setBrushMode = (mode) => {
//   brushMode.value = mode;
//   //shapeMode.value = null; // 确保退出其他形状模式
// };
// 修改 setBrushMode 函数

const setBrushMode = (mode) => {
  // 点击相同工具时取消选择
  if (brushMode.value === mode) {
    brushMode.value = null
    shapeMode.value = null
  } else {
    brushMode.value = mode
    // 确保切换到画笔模式时取消形状模式
    shapeMode.value = null
  }
}

// const setBrushMode = (mode) => {
//   if (brushMode.value === mode) {
//     brushMode.value = null; // 点击已激活的工具按钮时取消选择
//   } else {
//     brushMode.value = mode;
//   }

//   // 橡皮擦模式时禁用其他模式
//   if (brushMode.value === "eraser") {
//     shapeMode.value = null;
//     textInputVisible.value = false;
//   } else {
//     shapeMode.value = null; // 确保退出形状模式
//   }
// };

const updateCanvasVisibility = () => {
  nextTick(() => {
    layers.value.forEach((layer, index) => {
      const canvas = canvasLayers.value[index]
      if (canvas) {
        canvas.style.display = layer.visible ? 'block' : 'none'
      }
    })
  })
}
// 图层操作

const clearLayer = (index) => {
  const canvas = canvasLayers.value[index]
  if (canvas) {
    layers.value[index].shapes = []
    selectedShape.value = null
    redrawAllVisibleLayers() // 改为调用新函数
  }
}

// 修改 addLayer 方法，添加 name 属性
// 修改原因：新建图层时应保持其他图层状态不变
const addLayer = () => {
  const newLayer = {
    id: Date.now(),
    visible: true,
    name: `图层 ${layers.value.length + 1}`,
    shapes: [] // 新图层初始化空的 shapes 数组
  }

  layers.value = [...layers.value, newLayer]
  activeLayerIndex.value = layers.value.length - 1

  nextTick(() => {
    initCanvases()
  })
}

// 新增函数：修改原因：避免不必要的全局重绘
// const redrawCurrentLayer = () => {
//   //  console.log("run redrawCurrentLayer ");
//   const canvas = canvasLayers.value[activeLayerIndex.value];
//   if (!canvas) return;

//   const ctx = canvas.getContext("2d");
//   ctx.clearRect(0, 0, canvas.width, canvas.height);

//   // 添加防御性检查
//   const currentLayer = layers.value[activeLayerIndex.value];
//   if (!currentLayer || !currentLayer.shapes) return;

//   //console.log("currentLayer ", currentLayer);
//   // 只绘制当前图层的 shapes
//   currentLayer.shapes.forEach((shape) => {
//     drawShapeOnCanvas(ctx, shape);
//   });
// };

// const redrawAllVisibleLayers = () => {
//   canvasLayers.value.forEach((canvas, layerIndex) => {
//     if (!canvas || !layers.value[layerIndex]?.visible) return;

//     const ctx = canvas.getContext("2d");
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     layers.value[layerIndex].shapes?.forEach((shape) => {
//       if (shape.type === "brush") {
//         drawBrushStroke(ctx, shape);
//       } else if (shape.type === "text") {
//         drawText(ctx, shape);
//       } else {
//         drawShape(
//           ctx,
//           shape.x1,
//           shape.y1,
//           shape.x2,
//           shape.y2,
//           shape.type,
//           shape.fill,
//           shape.color,
//           shape.opacity,
//           shape.borderWidth
//         );
//       }
//     });

//     // 绘制选择框（仅在选择模式且正在选择时）
//     if (shapeMode.value === "select" && isSelecting.value) {
//       ctx.strokeStyle = "#0095FF";
//       ctx.lineWidth = 1;
//       ctx.setLineDash([5, 5]);
//       ctx.strokeRect(
//         Math.min(selectionBox.x1, selectionBox.x2),
//         Math.min(selectionBox.y1, selectionBox.y2),
//         Math.abs(selectionBox.x2 - selectionBox.x1),
//         Math.abs(selectionBox.y2 - selectionBox.y1)
//       );
//       ctx.setLineDash([]);
//     }

//     // 绘制选中元素的高亮框
//     selectedElements.value.forEach(({ shape }) => {
//       drawSelectionHighlight(ctx, shape);
//     });
//     // 显示选中数量提示
//     if (selectedElements.value.length > 0) {
//       ctx.fillStyle = "#0095FF";
//       ctx.font = "12px Arial";
//       ctx.fillText(
//         `已选中 ${selectedElements.value.length} 个元素`,
//         10,
//         canvas.height - 10
//       );
//     }
//   });
// };

const redrawAllVisibleLayers = () => {
  canvasLayers.value.forEach((canvas, layerIndex) => {
    if (!canvas || !layers.value[layerIndex]?.visible) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制背景颜色
    const bgColor = layers.value[layerIndex].backgroundColor
    if (bgColor && bgColor !== 'transparent') {
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // 绘制所有形状
    layers.value[layerIndex].shapes?.forEach((shape) => {
      drawShapeOnCanvas(ctx, shape)
    })

    // 绘制选择框（如果正在选择）
    if (shapeMode.value === 'select' && isSelecting.value) {
      ctx.strokeStyle = '#0095FF'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.strokeRect(
        Math.min(selectionBox.x1, selectionBox.x2),
        Math.min(selectionBox.y1, selectionBox.y2),
        Math.abs(selectionBox.x2 - selectionBox.x1),
        Math.abs(selectionBox.y2 - selectionBox.y1)
      )
      ctx.setLineDash([])
    }

    // 绘制选中元素的高亮框
    selectedElements.value.forEach(({ shape }) => {
      drawSelectionHighlight(ctx, shape)
    })

    // 显示选中数量提示
    if (selectedElements.value.length > 0) {
      ctx.fillStyle = '#0095FF'
      ctx.font = '12px Arial'
      ctx.fillText(`已选中 ${selectedElements.value.length} 个元素`, 10, canvas.height - 10)
    }
  })
}

const drawSelectionHighlight = (ctx, shape) => {
  ctx.strokeStyle = '#0095FF'
  ctx.lineWidth = 2
  ctx.setLineDash([3, 3])

  // 根据不同类型绘制高亮框
  switch (shape.type) {
    case 'rectangle':
      ctx.strokeRect(
        Math.min(shape.x1, shape.x2) - 3,
        Math.min(shape.y1, shape.y2) - 3,
        Math.abs(shape.x2 - shape.x1) + 6,
        Math.abs(shape.y2 - shape.y1) + 6
      )
      break
    case 'ellipse':
      const centerX = (shape.x1 + shape.x2) / 2
      const centerY = (shape.y1 + shape.y2) / 2
      const radiusX = Math.abs(shape.x2 - shape.x1) / 2 + 3
      const radiusY = Math.abs(shape.y2 - shape.y1) / 2 + 3
      ctx.beginPath()
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2)
      ctx.stroke()
      break
    case 'line':
      ctx.beginPath()
      ctx.moveTo(shape.x1, shape.y1)
      ctx.lineTo(shape.x2, shape.y2)
      ctx.stroke()
      // 添加端点标记
      drawHandle(ctx, shape.x1, shape.y1)
      drawHandle(ctx, shape.x2, shape.y2)
      break
    case 'brush':
      const minX = Math.min(...shape.points.map((p) => p.x))
      const maxX = Math.max(...shape.points.map((p) => p.x))
      const minY = Math.min(...shape.points.map((p) => p.y))
      const maxY = Math.max(...shape.points.map((p) => p.y))
      ctx.strokeRect(minX - 3, minY - 3, maxX - minX + 6, maxY - minY + 6)
      break
    case 'text':
      const textCtx = document.createElement('canvas').getContext('2d')
      textCtx.font = `${shape.fontWeight} ${shape.fontSize}px ${shape.fontFamily}`
      const width = textCtx.measureText(shape.text).width
      ctx.strokeRect(shape.x - 3, shape.y - shape.fontSize - 3, width + 6, shape.fontSize + 6)
      break
  }
  ctx.setLineDash([])
}

// 绘制拖动控制点
const drawHandle = (ctx, x, y) => {
  ctx.fillStyle = '#0095FF'
  ctx.beginPath()
  ctx.arc(x, y, 4, 0, Math.PI * 2)
  ctx.fill()
}

// 修改原因：删除图层时应正确处理剩余图层的状态
const removeLayer = (index) => {
  if (layers.value.length <= 1) return

  const newLayers = layers.value.filter((_, i) => i !== index)
  let newActiveIndex = activeLayerIndex.value
  if (index <= activeLayerIndex.value) {
    newActiveIndex = Math.max(0, activeLayerIndex.value - 1)
  }

  layers.value = newLayers
  activeLayerIndex.value = newActiveIndex
  redrawAllVisibleLayers() // 改为调用新函数
}

const setActiveLayer = (index) => {
  activeLayerIndex.value = index
}

// 初始化画布
// 修改画布初始化
// 修改原因：确保初始化时正确处理所有图层的可见性
const initCanvases = () => {
  nextTick(() => {
    const windowH = document.body.scrollHeight

    const container = document.querySelector('#page-view')
    if (!container) return

    // const rect = container.getBoundingClientRect();
    // const width = rect.width;
    //   const height = rect.height;
    // 获取整个文档的尺寸，而不仅仅是视窗
    const width = container.scrollWidth
    const height = container.scrollHeight

    //console.log("sgdsgsg", height);
    // if (!pdfPage) {
    //   console.warn("PDF页面未渲染完成，延迟初始化");
    //   setTimeout(initCanvases, 100);
    //   return;
    // }
    ;-canvasLayers.value.forEach((canvas, index) => {
      if (canvas) {
        canvas.width = width
        canvas.height = height
        // canvas.style.width = "100%";
        // canvas.style.height = "auto";
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`

        // 根据图层可见性设置显示状态
        canvas.style.display = layers.value[index]?.visible ? 'block' : 'none'

        // 只重绘可见图层
        if (layers.value[index]?.visible) {
          redrawAllVisibleLayers() // 初始化后重绘所有可见图层
        }
      }
    })
  })
}

// 绘图函数
const startDrawing = (e, layerIndex) => {
  //console.log("here is startDrawing");
  if (layerIndex !== activeLayerIndex.value) return

  const canvas = canvasLayers.value[layerIndex]
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  // 记录起始位置（用于所有工具）
  dragStart.value = { x, y }
  lastX.value = x
  lastY.value = y

  // 形状工具处理
  if (['rectangle', 'ellipse', 'line'].includes(shapeMode.value)) {
    isDrawingShape.value = true
    shapeStartX.value = x
    shapeStartY.value = y
    return
  }

  // 文字工具处理
  if (brushMode.value === 'text') {
    //  console.log("createTextInput");
    createTextInput(x, y, layerIndex)
    return
  }

  // 选择工具处理
  if (shapeMode.value === 'select') {
    isSelecting.value = true
    selectionBox.x1 = x
    selectionBox.y1 = y
    selectionBox.x2 = x
    selectionBox.y2 = y

    // 检查是否点击了已有元素
    const clickedShape = findShapeAtPosition(x, y, layerIndex)

    if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd键多选逻辑
      if (clickedShape) {
        const alreadySelected = selectedElements.value.some(
          (item) => item.index === clickedShape.index
        )
        if (alreadySelected) {
          selectedElements.value = selectedElements.value.filter(
            (item) => item.index !== clickedShape.index
          )
        } else {
          selectedElements.value.push(clickedShape)
        }
      }
    } else {
      // 普通点击逻辑
      if (clickedShape) {
        // 检查是否点击了已选中的元素
        const isSelected = selectedElements.value.some((item) => item.index === clickedShape.index)
        if (isSelected) {
          // 准备拖动所有选中元素
          isDragging.value = true
        } else {
          // 只选择当前点击的元素
          selectedElements.value = [clickedShape]
          isDragging.value = true
        }
      } else {
        // 开始框选
        selectedElements.value = []
        isSelecting.value = true
      }
    }
  }

  // 默认画笔/橡皮擦处理
  currentShape.value = {
    type: brushMode.value,
    points: [{ x, y }],
    color: brushColor.value,
    size: brushSettings.value.size,
    layerIndex
  }
  isDrawing.value = true
}

const findShapeAtPosition = (x, y, layerIndex) => {
  const shapes = layers.value[layerIndex]?.shapes || []

  // 从最新绘制的形状开始检查
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i]

    // 检查点击是否在形状范围内
    if (isPointInShape(x, y, shape)) {
      return { index: i, shape }
    }
  }
  return null
}

const isPointInShape = (x, y, shape) => {
  if (!shape) return false

  switch (shape.type) {
    case 'rectangle':
      return (
        x >= Math.min(shape.x1, shape.x2) &&
        x <= Math.max(shape.x1, shape.x2) &&
        y >= Math.min(shape.y1, shape.y2) &&
        y <= Math.max(shape.y1, shape.y2)
      )
    case 'ellipse':
      const centerX = (shape.x1 + shape.x2) / 2
      const centerY = (shape.y1 + shape.y2) / 2
      const radiusX = Math.abs(shape.x2 - shape.x1) / 2
      const radiusY = Math.abs(shape.y2 - shape.y1) / 2
      return Math.pow((x - centerX) / radiusX, 2) + Math.pow((y - centerY) / radiusY, 2) <= 1
    case 'line':
      return distanceToLine(x, y, shape.x1, shape.y1, shape.x2, shape.y2) <= 5
    case 'brush':
      return shape.points.some((p) => Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2)) <= 10)
    case 'text':
      const ctx = document.createElement('canvas').getContext('2d')
      ctx.font = `${shape.fontWeight} ${shape.fontSize}px ${shape.fontFamily}`
      const width = ctx.measureText(shape.text).width
      return x >= shape.x && x <= shape.x + width && y >= shape.y - shape.fontSize && y <= shape.y
    default:
      return false
  }
}

const distanceToLine = (x, y, x1, y1, x2, y2) => {
  // 计算点到线段的距离
  const A = x - x1
  const B = y - y1
  const C = x2 - x1
  const D = y2 - y1

  const dot = A * C + B * D
  const len_sq = C * C + D * D
  let param = -1
  if (len_sq !== 0) param = dot / len_sq

  let xx, yy

  if (param < 0) {
    xx = x1
    yy = y1
  } else if (param > 1) {
    xx = x2
    yy = y2
  } else {
    xx = x1 + param * C
    yy = y1 + param * D
  }

  const dx = x - xx
  const dy = y - yy
  return Math.sqrt(dx * dx + dy * dy)
}

// 添加颜色选择器状态
const showColorPicker = ref(false)
const presetColors = [
  // 冷色系（蓝、青、绿）
  '#0000ff', // 纯蓝
  '#0066ff', // 深天蓝
  '#0099ff', // 亮蓝
  '#00ccff', // 天蓝
  '#00ffff', // 青色
  '#00ffcc', // 绿松石
  '#00ff99', // 中春绿
  '#00ff66', // 亮绿
  '#00ff00', // 纯绿
  '#66ff00', // 鲜绿

  // 中性色系（黄、紫）
  '#99ff00', // 黄绿色
  '#ccff00', // 柠檬绿
  '#ffff00', // 黄色
  '#ffcc00', // 金黄
  '#ff9900', // 橙色
  '#ff6600', // 亮橙
  '#ff0099', // 粉红
  '#cc00ff', // 紫罗兰
  '#9900ff', // 紫

  // 暖色系（红、橙）
  '#ff00ff', // 品红
  '#ff0066', // 玫红
  '#ff0000', // 红色
  '#ff3300', // 朱红
  '#ff6600', // 橙红

  // 中性色（灰）
  '#c0c0c0', // 银色

  // 最后是黑白
  '#000000', // 黑色
  '#ffffff' // 白色
]

const brushPoints = ref([]) // 用于临时存储画笔点

//
// const draw = (e, layerIndex) => {
//   if (!isDrawing.value || layerIndex !== activeLayerIndex.value) return;

//   const canvas = canvasLayers.value[layerIndex];
//   const rect = canvas.getBoundingClientRect();
//   const x = e.clientX - rect.left;
//   const y = e.clientY - rect.top;

//   currentShape.value.points.push({ x, y });

//   // 直接绘制到画布上，不触发重绘
//   const ctx = canvas.getContext("2d");
//   drawCurrentShape(ctx);
// };
const draw = (e, layerIndex) => {
  //console.log("here is F draw");
  if (layerIndex !== activeLayerIndex.value) return

  const canvas = canvasLayers.value[layerIndex]
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top

  // 更新最后位置
  lastX.value = x
  lastY.value = y

  // 形状绘制模式
  if (isDrawingShape.value && shapeMode.value) {
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 先绘制所有已有形状
    redrawAllShapesToContext(ctx, layerIndex)

    // 绘制当前预览形状
    drawShape(
      ctx,
      shapeStartX.value,
      shapeStartY.value,
      x,
      y,
      shapeMode.value,
      shapeSettings.value.fill,
      brushColor.value,
      shapeSettings.value.opacity,
      shapeSettings.value.borderWidth
    )
    return
  }

  // 选择模式
  if (shapeMode.value === 'select') {
    if (isDragging.value && selectedElements.value.length) {
      // 计算移动距离
      const dx = x - dragStart.value.x
      const dy = y - dragStart.value.y

      // 移动所有选中元素
      selectedElements.value.forEach(({ index }) => {
        const shape = layers.value[layerIndex].shapes[index]
        updateShapePosition(shape, dx, dy)
      })

      // 更新起始位置为当前位置
      dragStart.value = { x, y }

      // 重绘画布
      redrawAllVisibleLayers()
    } else if (isSelecting.value) {
      // 更新选择框位置
      selectionBox.x2 = x
      selectionBox.y2 = y

      // 实时更新框选结果
      if (!e.ctrlKey && !e.metaKey) {
        selectedElements.value = findElementsInSelectionBox(layerIndex)
      }

      // 重绘画布
      redrawAllVisibleLayers()
    }
  }

  // 画笔/橡皮擦模式
  if (isDrawing.value) {
    if (brushMode.value === 'eraser') {
      // 添加视觉反馈
      // const canvas = canvasLayers.value[layerIndex];
      // const ctx = canvas.getContext("2d");

      // // 绘制橡皮擦圆形光标
      // ctx.beginPath();
      // ctx.arc(x, y, brushSettings.value.size / 2, 0, Math.PI * 2);
      // ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
      // ctx.fill();
      // ctx.strokeStyle = "#999";
      // ctx.lineWidth = 1;
      // ctx.stroke();

      eraseElements(x, y, layerIndex)
      return
    }

    if (brushMode.value === 'brush') {
      currentShape.value.points.push({ x, y })
      const ctx = canvas.getContext('2d')
      drawCurrentShape(ctx)
    }
  }
}

// 辅助函数：更新形状位置
const updateShapePosition = (shape, dx, dy) => {
  if (!shape) return

  switch (shape.type) {
    case 'rectangle':
    case 'ellipse':
    case 'line':
      shape.x1 += dx
      shape.y1 += dy
      shape.x2 += dx
      shape.y2 += dy
      break
    case 'brush':
      shape.points.forEach((p) => {
        p.x += dx
        p.y += dy
      })
      break
    case 'text':
      shape.x += dx
      shape.y += dy
      break
  }
}

const eraseElements = (x, y, layerIndex) => {
  const eraseRadius = brushSettings.value.size / 2
  const shapes = layers.value[layerIndex].shapes

  // 从后往前检查
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i]
    let shouldErase = false

    if (shape.type === 'brush') {
      // 检查笔迹点是否在擦除范围内
      shouldErase = shape.points.some((p) => {
        return Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2)) <= eraseRadius
      })
    } // 处理文字元素（新增部分）
    else if (shape.type === 'text') {
      shouldErase = isPointInText(x, y, shape, eraseRadius)
    } else if (['rectangle', 'ellipse', 'line'].includes(shape.type)) {
      // 简化检查：判断鼠标是否在形状边界附近
      const minX = Math.min(shape.x1, shape.x2) - eraseRadius
      const maxX = Math.max(shape.x1, shape.x2) + eraseRadius
      const minY = Math.min(shape.y1, shape.y2) - eraseRadius
      const maxY = Math.max(shape.y1, shape.y2) + eraseRadius
      shouldErase = x >= minX && x <= maxX && y >= minY && y <= maxY
    }

    if (shouldErase) {
      shapes.splice(i, 1)
    }
  }
  redrawAllVisibleLayers()
}

// 新增：文字元素的碰撞检测
const isPointInText = (x, y, textShape, tolerance = 0) => {
  const ctx = document.createElement('canvas').getContext('2d')
  ctx.font = `${textShape.fontWeight} ${textShape.fontSize}px ${textShape.fontFamily}`
  const width = ctx.measureText(textShape.text).width

  return (
    x >= textShape.x - tolerance &&
    x <= textShape.x + width + tolerance &&
    y >= textShape.y - textShape.fontSize - tolerance &&
    y <= textShape.y + tolerance
  )
}

//辅助函数

const redrawAllShapesToContext = (ctx, layerIndex) => {
  layers.value[layerIndex]?.shapes?.forEach((shape) => {
    if (shape.type === 'brush') {
      drawBrushStroke(ctx, shape)
    } else if (shape.type === 'text') {
      drawText(ctx, shape)
    } else {
      drawShape(
        ctx,
        shape.x1,
        shape.y1,
        shape.x2,
        shape.y2,
        shape.type,
        shape.fill,
        shape.color,
        shape.opacity,
        shape.borderWidth
      )
    }
  })
}

// 添加形状绘制函数
const drawShape = (ctx, x1, y1, x2, y2, shapeType, fill, color, opacity, borderWidth) => {
  ctx.save()
  ctx.strokeStyle = `rgba(${hexToRgb(color)}, ${opacity})`
  ctx.fillStyle = `rgba(${hexToRgb(color)}, ${opacity * 0.3})`
  ctx.lineWidth = borderWidth

  ctx.beginPath()

  switch (shapeType) {
    case 'rectangle':
      ctx.rect(x1, y1, x2 - x1, y2 - y1)
      break
    case 'ellipse':
      const centerX = (x1 + x2) / 2
      const centerY = (y1 + y2) / 2
      const radiusX = Math.abs(x2 - x1) / 2
      const radiusY = Math.abs(y2 - y1) / 2
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2)
      break
    case 'line':
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      break
  }

  if (fill) ctx.fill()
  ctx.stroke()
  ctx.restore()
}

// 添加hex转rgba的函数
const hexToRgb = (hex) => {
  if (!hex || typeof hex !== 'string') return '0, 0, 0' // 默认返回黑色

  // 处理简写形式如 #RGB
  if (hex.length === 4) {
    const r = parseInt(hex.slice(1, 2).repeat(2), 16)
    const g = parseInt(hex.slice(2, 3).repeat(2), 16)
    const b = parseInt(hex.slice(3, 4).repeat(2), 16)
    return `${r}, ${g}, ${b}`
  }

  // 处理标准形式 #RRGGBB
  if (hex.length === 7) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r}, ${g}, ${b}`
  }

  // 默认返回黑色
  return '0, 0, 0'
}
// 添加形状存储
const shapes = ref([])

// const drawShapePreview = (ctx, shape) => {
//   ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

//   // 先绘制所有已保存的形状
//   redrawAllShapes();

//   // 再绘制当前预览的形状
//   ctx.beginPath();
//   ctx.moveTo(shape.points[0].x, shape.points[0].y);

//   for (let i = 1; i < shape.points.length; i++) {
//     ctx.lineTo(shape.points[i].x, shape.points[i].y);
//   }

//   ctx.strokeStyle = `rgba(${hexToRgb(shape.color)}, 0.8)`;
//   ctx.lineWidth = shape.size;
//   ctx.lineCap = "round";
//   ctx.lineJoin = "round";
//   ctx.stroke();
// };

// 停止绘制时保存形状
// 修改原因：确保形状保存到正确的图层

const stopDrawing = () => {
  const layerIndex = activeLayerIndex.value

  // 形状绘制完成
  if (isDrawingShape.value && shapeMode.value) {
    const newShape = {
      type: shapeMode.value,
      x1: shapeStartX.value,
      y1: shapeStartY.value,
      x2: lastX.value,
      y2: lastY.value,
      color: brushColor.value,
      fill: shapeSettings.value.fill,
      opacity: shapeSettings.value.opacity,
      borderWidth: shapeSettings.value.borderWidth,
      layerIndex
    }

    layers.value[layerIndex].shapes.push(newShape)
    isDrawingShape.value = false
    redrawAllVisibleLayers()
    return
  }

  // 选择模式结束
  if (shapeMode.value === 'select') {
    isSelecting.value = false
    isDragging.value = false
    return
  }

  // 画笔结束
  if (isDrawing.value && currentShape.value) {
    if (currentShape.value.points.length > 1) {
      layers.value[layerIndex].shapes.push({
        ...currentShape.value,
        id: Date.now()
      })
    }
    currentShape.value = null
    isDrawing.value = false
    redrawAllVisibleLayers()
  }
}

const findElementsInSelectionBox = (layerIndex) => {
  const shapes = layers.value[layerIndex]?.shapes || []
  const selected = []

  const minX = Math.min(selectionBox.x1, selectionBox.x2)
  const maxX = Math.max(selectionBox.x1, selectionBox.x2)
  const minY = Math.min(selectionBox.y1, selectionBox.y2)
  const maxY = Math.max(selectionBox.y1, selectionBox.y2)

  shapes.forEach((shape, index) => {
    if (isShapeInSelectionBox(shape, minX, maxX, minY, maxY)) {
      selected.push({ index, shape })
    }
  })

  return selected
}

const isShapeInSelectionBox = (shape, minX, maxX, minY, maxY) => {
  if (!shape) return false

  // 获取形状的边界框
  let shapeMinX, shapeMaxX, shapeMinY, shapeMaxY

  switch (shape.type) {
    case 'rectangle':
      shapeMinX = Math.min(shape.x1, shape.x2)
      shapeMaxX = Math.max(shape.x1, shape.x2)
      shapeMinY = Math.min(shape.y1, shape.y2)
      shapeMaxY = Math.max(shape.y1, shape.y2)
      break
    case 'ellipse':
      shapeMinX = Math.min(shape.x1, shape.x2) - Math.abs(shape.x2 - shape.x1) / 2
      shapeMaxX = Math.max(shape.x1, shape.x2) + Math.abs(shape.x2 - shape.x1) / 2
      shapeMinY = Math.min(shape.y1, shape.y2) - Math.abs(shape.y2 - shape.y1) / 2
      shapeMaxY = Math.max(shape.y1, shape.y2) + Math.abs(shape.y2 - shape.y1) / 2
      break
    case 'line':
      shapeMinX = Math.min(shape.x1, shape.x2)
      shapeMaxX = Math.max(shape.x1, shape.x2)
      shapeMinY = Math.min(shape.y1, shape.y2)
      shapeMaxY = Math.max(shape.y1, shape.y2)
      break
    case 'brush':
      shapeMinX = Math.min(...shape.points.map((p) => p.x))
      shapeMaxX = Math.max(...shape.points.map((p) => p.x))
      shapeMinY = Math.min(...shape.points.map((p) => p.y))
      shapeMaxY = Math.max(...shape.points.map((p) => p.y))
      break
    case 'text':
      const ctx = document.createElement('canvas').getContext('2d')
      ctx.font = `${shape.fontWeight} ${shape.fontSize}px ${shape.fontFamily}`
      const width = ctx.measureText(shape.text).width
      shapeMinX = shape.x
      shapeMaxX = shape.x + width
      shapeMinY = shape.y - shape.fontSize
      shapeMaxY = shape.y
      break
    default:
      return false
  }

  // 检查形状边界框是否与选择框相交
  return !(shapeMaxX < minX || shapeMinX > maxX || shapeMaxY < minY || shapeMinY > maxY)
}

// 辅助函数：检查线段是否与矩形相交
const lineIntersectsRect = (x1, y1, x2, y2, rx1, ry1, rx2, ry2) => {
  // 检查线段是否在矩形内
  if (
    x1 >= rx1 &&
    x1 <= rx2 &&
    y1 >= ry1 &&
    y1 <= ry2 &&
    x2 >= rx1 &&
    x2 <= rx2 &&
    y2 >= ry1 &&
    y2 <= ry2
  )
    return true

  // 检查线段是否与矩形的任何边相交
  return (
    lineIntersectsLine(x1, y1, x2, y2, rx1, ry1, rx2, ry1) || // 上边
    lineIntersectsLine(x1, y1, x2, y2, rx2, ry1, rx2, ry2) || // 右边
    lineIntersectsLine(x1, y1, x2, y2, rx1, ry2, rx2, ry2) || // 下边
    lineIntersectsLine(x1, y1, x2, y2, rx1, ry1, rx1, ry2) // 左边
  )
}

// 辅助函数：检查两条线段是否相交
const lineIntersectsLine = (x1, y1, x2, y2, x3, y3, x4, y4) => {
  // 实现线段相交算法
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1)
  if (denom === 0) return false // 平行

  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom

  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1
}

const deleteSelectedShape = () => {
  if (shapeMode.value === 'select') {
    if (selectedElements.value.length === 0) return

    const layerIndex = activeLayerIndex.value
    // 按索引从大到小删除
    selectedElements.value
      .sort((a, b) => b.index - a.index)
      .forEach(({ index }) => {
        layers.value[layerIndex].shapes.splice(index, 1)
      })

    selectedElements.value = []
    redrawAllVisibleLayers()
  }
}

// const redrawAllShapes = () => {
//   canvasLayers.value.forEach((canvas, index) => {
//     if (canvas && layers.value[index].visible) {
//       const ctx = canvas.getContext("2d");
//       ctx.clearRect(0, 0, canvas.width, canvas.height);

//       // 绘制该图层的 shapes
//       layers.value[index].shapes.forEach((shape) => {
//         drawShapeOnCanvas(ctx, shape);
//       });
//     }
//   });
// };

const handleKeyUp = (e) => {
  // 可以添加按键释放的逻辑
}

// 新增：专门绘制当前形状的函数
const drawCurrentShape = (ctx) => {
  if (!currentShape.value) return

  ctx.beginPath()
  ctx.moveTo(currentShape.value.points[0].x, currentShape.value.points[0].y)

  for (let i = 1; i < currentShape.value.points.length; i++) {
    ctx.lineTo(currentShape.value.points[i].x, currentShape.value.points[i].y)
  }

  ctx.strokeStyle = currentShape.value.color
  ctx.lineWidth = currentShape.value.size
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
}

const drawShapeOnCanvas = (ctx, shape) => {
  if (!shape) return

  // onsole.log("shape.type:", shape.type);
  // 处理画笔笔迹
  if (shape.type === 'brush' && shape.points && shape.points.length > 0) {
    ctx.beginPath()
    ctx.moveTo(shape.points[0].x, shape.points[0].y)

    for (let i = 1; i < shape.points.length; i++) {
      ctx.lineTo(shape.points[i].x, shape.points[i].y)
    }

    ctx.strokeStyle = shape.color
    ctx.lineWidth = shape.size
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
  // 处理文本
  else if (shape.type === 'text') {
    // console.log("text here");
    drawText(ctx, shape)
  }
  // 处理其他形状（矩形、圆形、椭圆、直线等）
  else if (shape.type && shape.x1 !== undefined && shape.y1 !== undefined) {
    drawShape(
      ctx,
      shape.x1,
      shape.y1,
      shape.x2 || shape.x1, // 提供默认值
      shape.y2 || shape.y1, // 提供默认值
      shape.type,
      shape.fill,
      shape.color,
      shape.opacity,
      shape.borderWidth
    )
  }
}

const drawShapeOnCanvas2 = (ctx, shape, containerWidth, containerHeight) => {
  if (!shape) return

  // PDF A4 尺寸（单位：pt）
  const pdfWidth = 595
  const pdfHeight = 842
  const margin = 0 // PDF 边距（可选）

  // 计算缩放比例（确保内容适应 PDF，并保持比例）
  const scaleX = (pdfWidth - 2 * margin) / containerWidth
  const scaleY = (pdfHeight - 2 * margin) / containerHeight
  const scale = Math.min(scaleX, scaleY) // 取较小值，防止变形

  // 调整坐标和尺寸的函数
  const adjustPoint = (x, y) => ({
    x: x * scale + margin,
    y: y * scale + margin
  })

  const adjustSize = (size) => size * scale

  // 处理画笔笔迹
  if (shape.type === 'brush' && shape.points?.length > 0) {
    ctx.beginPath()
    const adjustedStart = adjustPoint(shape.points[0].x, shape.points[0].y)
    ctx.moveTo(adjustedStart.x, adjustedStart.y)

    for (let i = 1; i < shape.points.length; i++) {
      const adjustedPoint = adjustPoint(shape.points[i].x, shape.points[i].y)
      ctx.lineTo(adjustedPoint.x, adjustedPoint.y)
    }

    ctx.strokeStyle = shape.color || 'black'
    ctx.lineWidth = adjustSize(shape.size || 3) // 调整线宽
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
  // 处理文本
  else if (shape.type === 'text') {
    // 注意：文本可能需要额外处理字体大小缩放
    const adjustedShape = {
      ...shape,
      x: shape.x * scale + margin,
      y: shape.y * scale + margin,
      fontSize: shape.fontSize ? adjustSize(shape.fontSize) : 16
    }
    drawText(ctx, adjustedShape)
  }
  // 处理其他形状（矩形、圆形、椭圆、直线等）
  else if (shape.type && shape.x1 !== undefined && shape.y1 !== undefined) {
    const adjustedShape = {
      ...shape,
      x1: shape.x1 * scale + margin,
      y1: shape.y1 * scale + margin,
      x2: (shape.x2 || shape.x1) * scale + margin,
      y2: (shape.y2 || shape.y1) * scale + margin,
      borderWidth: adjustSize(shape.borderWidth || 1)
    }
    drawShape(
      ctx,
      adjustedShape.x1,
      adjustedShape.y1,
      adjustedShape.x2,
      adjustedShape.y2,
      adjustedShape.type,
      adjustedShape.fill,
      adjustedShape.color,
      adjustedShape.opacity,
      adjustedShape.borderWidth
    )
  }
}

const drawBrushStroke = (ctx, shape) => {
  ctx.beginPath()
  ctx.moveTo(shape.points[0].x, shape.points[0].y)

  for (let i = 1; i < shape.points.length; i++) {
    ctx.lineTo(shape.points[i].x, shape.points[i].y)
  }

  ctx.strokeStyle = `rgba(${hexToRgb(shape.color)}, ${shape.opacity})`
  ctx.lineWidth = shape.size
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
}

//形状工具
// 在script部分添加以下状态
const shapeMode = ref(null) // 'rectangle' | 'line' | 'circle' | 'arrow' | null

const isDrawingShape = ref(false)
const shapeStartX = ref(0)
const shapeStartY = ref(0)

// 添加状态
const selectedShape = ref(null)
const dragStart = ref({ x: 0, y: 0 })

// 添加状态
const fillShapes = ref(false)
const shapeBorderWidth = ref(2)

//选择工具 多选
// 选择框相关状态
const isSelecting = ref(false) // 是否正在选择
const selectionBox = reactive({
  x1: 0,
  y1: 0,
  x2: 0,
  y2: 0
})
const selectedElements = ref([]) // 存储选中的多个元素

//文字工具

// 添加文字设置状态
const textSettings = ref({
  fontFamily: 'Arial',
  fontSize: 16,
  fontWeight: 'normal',
  underline: false,
  hasBackground: false,
  backgroundColor: '#ffffcc'
})

// 添加新的状态变量
const textInputRef = ref(null)
const textInputVisible = ref(false)
const textInputPosition = ref({ x: 0, y: 0 })

// 添加创建文本输入框的方法
//  createTextInput 函数

// const createTextInput = (x, y, layerIndex) => {

//   console.log('run createTextInput')
//   // 如果有未保存的文本，先保存
//   if (textInputVisible.value && textInputValue.value.trim()) {
//     saveTextAnnotation();
//   }

//   //console.log("createTextInput called with:", { x, y, layerIndex });

//   const canvas = canvasLayers.value[layerIndex];
//   const rect = canvas.getBoundingClientRect();
//   //const scale = scaleData.value; // 获取当前缩放比例
//   const x2 = x + rect.left;
//   const y2 = y + rect.top;

//   //console.log("createTextInput called with2:", { x2, y2, layerIndex });

//   textInputPosition.value = {
//     x: x2,
//     y: y2,
//   };

//   textInputVisible.value = true;
//   activeLayerIndex.value = layerIndex;
//   textInputValue.value = ""; // 清空之前的内容

//   nextTick(() => {
//     //  console.log("nextTick: textInputRef.value =", textInputRef.value);
//     textInputRef.value?.focus();
//     textInputRef.value?.textarea?.scrollIntoView({ block: "nearest" });
//   });
// };
const createTextInput = (x, y, layerIndex) => {
  // 如果有未保存的文本，先保存
  if (textInputVisible.value && textInputValue.value.trim()) {
    saveTextAnnotation()
  }

  const canvas = canvasLayers.value[layerIndex]
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()

  // 计算相对于文档的位置
  textInputPosition.value = {
    x: x + rect.left,
    y: y + rect.top
  }

  textInputVisible.value = true
  textInputValue.value = '' // 清空之前的内容

  console.log('textInputVisible.value:', textInputVisible.value)

  // 下一个tick聚焦输入框
  nextTick(() => {
    if (textInputRef.value) {
      textInputRef.value.focus()
      // 确保输入框可见
      textInputRef.value.textarea?.scrollIntoView({ block: 'nearest' })
    }
  })
}
// 处理输入框失去焦点
// const handleBlur = (e) => {
//   // 检查是否点击了输入框以外的区域
//   // console.log("handleBLur run");
//   const relatedTarget = e.relatedTarget;
//   if (!relatedTarget || !textInputRef.value?.textarea.contains(relatedTarget)) {
//     saveTextAnnotation();
//   }
// };

const handleBlur = (e) => {
  // 确保在任何情况下都保存文字
  saveTextAnnotation()
}

// 修改文本输入相关逻辑
const textInputValue = ref('')
const pendingTextAnnotation = ref(null)

// 保存文本注释
const saveTextAnnotation = () => {
  // 只有当有内容时才保存
  if (textInputValue.value.trim()) {
    const layerIndex = activeLayerIndex.value
    const canvas = canvasLayers.value[layerIndex]

    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      const x = textInputPosition.value.x - rect.left
      const y = textInputPosition.value.y - rect.top

      const newTextElement = {
        type: 'text',
        x: x,
        y: y,
        text: textInputValue.value.trim(),
        fontFamily: textSettings.value.fontFamily,
        fontSize: textSettings.value.fontSize,
        fontWeight: textSettings.value.fontWeight,
        color: brushColor.value,
        layerIndex: layerIndex
      }

      // 确保图层存在
      if (!layers.value[layerIndex]) {
        layers.value[layerIndex] = createNewLayer()
      }

      layers.value[layerIndex].shapes.push(newTextElement)
      redrawAllVisibleLayers()
    }
  }

  // 不自动关闭输入框，改为由外部控制
  // 保留 textInputValue 不清空，方便连续输入
}

const handleTextToolClick = () => {
  // 如果已有打开的输入框，先保存
  if (textInputVisible.value) {
    saveTextAnnotation()
  }

  // 不自动关闭输入框，保持工具激活状态
  setActiveTool('text')
}

const handleCanvasClick = (e, layerIndex) => {
  if (brushMode.value === 'text') {
    // 如果点击时输入框已显示且不在输入框上，先保存
    if (textInputVisible.value && !e.target.closest('.text-input-container')) {
      saveTextAnnotation()
    }
    createTextInput(e, layerIndex)
  }
  // 其他工具处理...
}

const cancelTextInput = () => {
  if (textInputVisible.value) {
    textInputVisible.value = false
    textInputValue.value = ''
  }
}

// 添加绘制文本的方法

const drawText = (ctx, textElement) => {
  // console.log("run drawText");

  if (!ctx || !textElement?.text) return

  const {
    text = '',
    x = 0,
    y = 0,
    color = '#000000',
    fontWeight = 'normal',
    fontSize = 16,
    fontFamily = 'Arial',
    hasBackground = false,
    backgroundColor = '#FFFFCC',
    underline = false,
    textAlign = 'left',
    lineHeight = fontSize * 1.2 // 默认行高为字体大小的1.2倍
  } = textElement

  ctx.save()
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  ctx.fillStyle = color
  ctx.textAlign = textAlign

  // 分割文本为多行
  const lines = text.split('\n')
  const textWidth = Math.max(...lines.map((line) => ctx.measureText(line).width))
  const totalHeight = lines.length * lineHeight

  // 绘制背景（如果有）
  if (hasBackground) {
    const padding = 4
    ctx.fillStyle = backgroundColor
    ctx.fillRect(
      x - padding,
      y - fontSize - padding / 2,
      textWidth + padding * 2,
      totalHeight + padding * 1.5
    )
    ctx.fillStyle = color
  }

  // 绘制每一行文本
  lines.forEach((line, index) => {
    const yPos = y + index * lineHeight

    let renderX = x
    if (textAlign === 'center') renderX -= ctx.measureText(line).width / 2
    else if (textAlign === 'right') renderX -= ctx.measureText(line).width

    ctx.fillText(line, renderX, yPos)

    // 绘制下划线
    if (underline) {
      const lineWidth = ctx.measureText(line).width
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(renderX, yPos + 2)
      ctx.lineTo(renderX + lineWidth, yPos + 2)
      ctx.stroke()
    }
  })

  ctx.restore()
}

//划词翻译

// 新增划词翻译相关状态
const isTranslationMode = ref(false)
const isTranslationMinimized = ref(false)
const showTranslationSettings = ref(false)
const selectedText = ref('')
const translationResult = ref('')

// 对话框位置和大小
const dialogPosition = reactive({
  x: window.innerWidth / 2 - 300,
  y: window.innerHeight - 300
})

const dialogSize = reactive({
  width: 600,
  height: 250,
  minWidth: 300,
  minHeight: 200
})

// 拖拽状态
const isDragging = ref(false)
const dragStartPos = reactive({ x: 0, y: 0 })

// 缩放状态
const isResizing = ref(false)
const resizeStartPos = reactive({ x: 0, y: 0 })
const resizeStartSize = reactive({ width: 0, height: 0 })

// 翻译设置
const translationSettings = reactive({
  api: 'freeDictionary',
  apiId: '',
  apiKey: '',
  apiUrl: '',
  apiMethod: 'POST',
  apiHeaders: '{"Content-Type": "application/json"}',
  apiBody: '{"text": "{{text}}", "target": "{{target}}"}',
  apiResultPath: 'data.result.translation',
  targetLanguage: 'zh',

  // 腾讯云翻译特有设置
  tencent: {
    secretId: '',
    secretKey: '',
    region: 'ap-chongqing',
    endpoint: 'tmt.tencentcloudapi.com'
  },

  openai: {
    model: 'gpt-3.5-turbo',
    Content: '',
    MyPrompt: `You are a helpful assistant, help me translate this sentence or word into Chinese`
  }
})

const AllText = ref(false)

const MyPrompt = computed(() =>
  !AllText.value
    ? 'You are a helpful assistant, help me translate this sentence or word into Chinese'
    : 'I need help understanding a scientific paper. Please assist me by the following question'
)

// 语言选项
const languageOptions = [
  { label: '自动检测', value: 'auto' },
  { label: '中文', value: 'zh' },
  { label: '英语', value: 'en' },
  { label: '日语', value: 'ja' },
  { label: '韩语', value: 'ko' },
  { label: '法语', value: 'fr' },
  { label: '德语', value: 'de' },
  { label: '西班牙语', value: 'es' },
  { label: '俄语', value: 'ru' }
]

// const canTestConnection = computed(() => {
//   const { api } = translationSettings.value;
//   if (api === "tencent") {
//     return (
//       translationSettings.value.tencent.secretId &&
//       translationSettings.value.tencent.secretKey
//     );
//   }
//   if (api === "baidu" || api === "youdao") {
//     return translationSettings.value.apiId && translationSettings.value.apiKey;
//   }
//   if (api === "custom") {
//     return translationSettings.value.apiUrl;
//   }
//   return true; // Google等不需要配置的API
// });

// 开始拖拽
const startDrag = (e) => {
  if (e.target.classList.contains('resize-handle')) return
  isDragging.value = true
  dragStartPos.x = e.clientX - dialogPosition.x
  dragStartPos.y = e.clientY - dialogPosition.y
  e.preventDefault()
}

// 拖拽中
const onDrag = (e) => {
  if (!isDragging.value) return

  // 限制在窗口范围内
  dialogPosition.x = Math.max(
    0,
    Math.min(window.innerWidth - dialogSize.width, e.clientX - dragStartPos.x)
  )
  dialogPosition.y = Math.max(
    0,
    Math.min(window.innerHeight - dialogSize.height, e.clientY - dragStartPos.y)
  )
}

// 结束拖拽
const endDrag = () => {
  isDragging.value = false
}

// 开始缩放
const startResize = (e) => {
  isResizing.value = true
  resizeStartPos.x = e.clientX
  resizeStartPos.y = e.clientY
  resizeStartSize.width = dialogSize.width
  resizeStartSize.height = dialogSize.height
  e.preventDefault()
  e.stopPropagation()
}

// 缩放处理
const handleResize = (e) => {
  if (!isResizing.value) return

  const dx = e.clientX - resizeStartPos.x
  const dy = e.clientY - resizeStartPos.y

  dialogSize.width = Math.max(dialogSize.minWidth, resizeStartSize.width + dx)
  dialogSize.height = Math.max(dialogSize.minHeight, resizeStartSize.height + dy)
}

// 停止缩放
const stopResize = () => {
  isResizing.value = false
}

// 监听鼠标移动和抬起事件
onMounted(() => {
  window.addEventListener('mousemove', (e) => {
    if (isResizing.value) handleResize(e)
    if (isDragging.value) onDrag(e)
  })

  window.addEventListener('mouseup', () => {
    if (isResizing.value) stopResize()
    if (isDragging.value) endDrag()
  })
})

// // 测试翻译API连接
// const testTranslation = async () => {
//   isTesting.value = true;
//   try {
//     // 这里应该是测试API连接的实际代码
//     await new Promise((resolve) => setTimeout(resolve, 1000));
//     ElMessage.success("API连接测试成功");
//   } catch (error) {
//     ElMessage.error("API连接测试失败: " + error.message);
//   } finally {
//     isTesting.value = false;
//   }
// };

// 保存设置
const saveTranslationSettings = () => {
  try {
    // 验证自定义API设置
    if (translationSettings.api === 'custom') {
      JSON.parse(translationSettings.value.apiHeaders || '{}')
      JSON.parse(translationSettings.value.apiBody || '{}')
    }

    // 保存到localStorage
    localStorage.setItem('translationSettings', JSON.stringify(translationSettings.value))

    ElMessage.success('设置保存成功')
    showTranslationSettings.value = false
  } catch (error) {
    ElMessage.error('设置保存失败: ' + error.message)
  }

  // console.log('translationSettings',translationSettings)
}

// 加载设置
const loadTranslationSettings = () => {
  const savedSettings = localStorage.getItem('translationSettings')
  if (savedSettings) {
    try {
      Object.assign(translationSettings, JSON.parse(savedSettings))
      // translationSettings.value = JSON.parse(savedSettings);
    } catch (error) {
      console.error('加载翻译设置失败:', error)
    }
  }
}

// 初始化时加载设置
//onMounted(loadTranslationSettings);

// 显示划词翻译功能界面
const translationText = () => {
  isTranslationMode.value = !isTranslationMode.value
  isTranslationMinimized.value = false

  if (isTranslationMode.value) {
    setupTextSelectionListener()
  } else {
    removeTextSelectionListener()
  }
}

// 设置文本选择监听器
const setupTextSelectionListener = () => {
  document.addEventListener('mouseup', handleTextSelection)
}

// 移除文本选择监听器
const removeTextSelectionListener = () => {
  document.removeEventListener('mouseup', handleTextSelection)
}

// 处理文本选择
const handleTextSelection = (e) => {
  const translationDialog = document.querySelector('.translation-dialog')
  if (translationDialog && translationDialog.contains(e.target)) return

  const selection = window.getSelection()
  if (!selection || selection.isCollapsed) return

  const selected = selection.toString().trim()
  if (selected) {
    editableText.value = selected
    lastSearchedText.value = selected
    translateText(selected) // 立即翻译选中的文本
  }
}

// 翻译文本

const translateText = async (text) => {
  // console.log("run translateText");

  if (!text || !text.trim()) {
    translationResult.value = '请选择或输入要翻译的单词'
    return
  }

  try {
    translationResult.value = '翻译中...'

    let result
    const { api, targetLanguage } = translationSettings

    const langMap = { zh: 'zh', en: 'en', ja: 'ja', ko: 'ko' }
    const targetLang = langMap[targetLanguage] || 'zh'

    switch (api) {
      case 'baidu':
        // console.log("baidu");
        result = 'baidu here'
        break
      case 'freeDictionary':
        // console.log("run case");
        result = await translateWithFreeDictionary(text)
        break
      case 'OpenAiN3':
        // console.log("run OpenAiN3");
        translationResult.value = '理解中...'
        result = await AiTranslator(text)
        break
      case 'tencent':
        //  console.log("run Tencent");
        const TencentTranslator = require('./services/tencentTranslate')
        const translator = new TencentTranslator(
          translationSettings.value.tencent.secretId,
          translationSettings.value.tencent.secretKey,
          translationSettings.value.tencent.region,
          translationSettings.value.tencent.endpoint
        )
        result = await translator.translate(text, 'auto', targetLang)
        // console.log("tencent result");
        break

      case 'deepl':
        // 原有的DeepL翻译逻辑
        const response = await fetch('https://api.deeplx.org/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            source_lang: 'auto',
            target_lang: targetLanguage.toUpperCase()
          })
        })
        const data = await response.json()
        result = data.data
        break

      case 'google':
      default:
        // 其他翻译API的逻辑
        break
    }

    translationResult.value = result || '未获取到翻译结果'
    // console.log(translationResult.value);
  } catch (error) {
    console.error('翻译失败:', error)
    translationResult.value = `翻译失败: ${getErrorMessage(error)}`
  }
}

// 新增 freeDictionary 翻译函数---------
const translateWithFreeDictionary = async (word) => {
  // console.log("word:", word);
  try {
    const data = await window.Myapi.translateWord(word)
    return formatDictionaryResult(data, word)
  } catch (error) {
    console.error('FreeDictionary API错误:', error)
    throw error
  }
}

//AI-------------
// import axios from 'axios'

// async function getCompletion(text) {
//   const client = axios.create({
//     baseURL: 'https://api.xty.app/v1',
//     headers: {
//       Authorization: `Bearer ${translationSettings.apiKey}`,
//       'Content-Type': 'application/json'
//     },
//     maxRedirects: 5 // equivalent to follow_redirects=True
//   })

//   try {
//     const response = await client.post('/chat/completions', {
//       model: translationSettings.openai.model,
//       messages: [
//         {
//           role: 'system',
//           content: `You are a helpful assistant, help me translate this sentence or word into ${translationSettings.targetLanguage}`
//         },
//         { role: 'user', content: text }
//       ]
//     })

//     const content = response.data.choices[0].message.content
//     console.log(content)
//     return content
//   } catch (error) {
//     console.error('Error:', error.response ? error.response.data : error.message)
//   }
// }

const getCompletion = async (text) => {
  try {
    const result = await window.Myapi.aiTranslate({
      text: text,
      settings: toRaw(translationSettings)
    })
    return result
  } catch (error) {
    console.error('翻译错误:', error)
    throw error
  }
}

const AiTranslator = async (text) => {
  if (!AllText.value) {
    const data = await getCompletion(text)
    return formatResult(data)
  } else {
    const content = await getAllTextContent()
    translationSettings.openai.MyPrompt = `
${MyPrompt.value}

Paper content:
${content}
`
    const data = await getCompletion(text)
    return formatResult(data)
  }
}

//获取全文------------------------------
// 在你的主组件中导入这些函数
import {
  extractAndJoinStrings,
  extractMainContent,
  removeReferenceMarkers,
  fetchAsArrayBuffer
} from '@renderer/utils/pdfTextExtractor.ts'

const getAllTextContent = async () => {
  const loadingTask = createLoadingTask(pdfState.pdfSource)
  const pdfDoc = await loadingTask.promise
  if (!pdfDoc) return

  let fullText = ''

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum) // 添加 await
    const textContent = await page.getTextContent()
    const pageText = extractAndJoinStrings(textContent.items)
    fullText += pageText + '\n\n'
  }

  const refinedText = extractMainContent(fullText)
  const cleanText = removeReferenceMarkers(refinedText)

  return cleanText.slice(0, 3000)
}

//--------------------

function formatResult(str) {
  // 1. 解码 HTML 实体
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = str
  let decodedStr = tempDiv.textContent || tempDiv.innerText || ''

  // 2. 处理 **加粗**
  decodedStr = decodedStr.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  // 3. 处理 - 开头的列表项
  decodedStr = decodedStr.replace(/^- (.+?)(<br>|$)/gm, '<li>$1</li>')
  decodedStr = decodedStr.replace(/<li>.*?<\/li>/g, (match) => {
    if (!decodedStr.includes('<ul>')) {
      decodedStr = '<ul>' + decodedStr.replace(/<li>(.*?)<\/li>/g, '<li>$1</li>') + '</ul>'
    }
    return match
  })

  // 4. 保留 <br> 换行
  decodedStr = decodedStr.replace(/<br\s*\/?>/gi, '<br>')

  return decodedStr
}
// 格式化字典API返回结果
// const formatDictionaryResult = (data, word) => {
//   if (!data || !data.length) return `未找到"${word}"的释义`;

//   const entry = data[0]; // 取第一个结果
//   let result = `单词: ${entry.word}\n\n`;

//   // 添加音标
//   if (entry.phonetics && entry.phonetics.length) {
//     const phonetic = entry.phonetics.find((p) => p.text) || entry.phonetics[0];
//     result += `音标: ${phonetic.text || "无"}\n`;
//   }

//   // 添加释义
//   if (entry.meanings && entry.meanings.length) {
//     entry.meanings.forEach((meaning) => {
//       result += `\n[${meaning.partOfSpeech}]\n`;

//       if (meaning.definitions && meaning.definitions.length) {
//         meaning.definitions.forEach((def, index) => {
//           result += `${index + 1}. ${def.definition}\n`;
//           if (def.example) {
//             result += `   例: ${def.example}\n`;
//           }
//         });
//       }

//       if (meaning.synonyms && meaning.synonyms.length) {
//         result += `同义词: ${meaning.synonyms.join(", ")}\n`;
//       }

//       if (meaning.antonyms && meaning.antonyms.length) {
//         result += `反义词: ${meaning.antonyms.join(", ")}\n`;
//       }
//     });
//   }

//   // 添加来源
//   if (entry.sourceUrls && entry.sourceUrls.length) {
//     result += `\n来源: ${entry.sourceUrls[0]}`;
//   }

//   return result;
// };

const formatDictionaryResult = (data, word) => {
  if (!data || !data.length) return `未找到"${word}"的释义`

  const entry = data[0] // 取第一个结果
  let result = `<strong>单词:</strong> ${entry.word}<br><br>`

  // 添加音标
  if (entry.phonetics && entry.phonetics.length) {
    const phonetic = entry.phonetics.find((p) => p.text) || entry.phonetics[0]
    result += `<strong>音标:</strong> ${phonetic.text || '无'}<br>`
  }

  // 添加释义
  if (entry.meanings && entry.meanings.length) {
    entry.meanings.forEach((meaning) => {
      result += `<br><strong>[${meaning.partOfSpeech}]</strong><br>`

      if (meaning.definitions && meaning.definitions.length) {
        meaning.definitions.forEach((def, index) => {
          result += `${index + 1}. ${def.definition}<br>`
          if (def.example) {
            result += `&nbsp;&nbsp;&nbsp;&nbsp;例: <em>${def.example}</em><br>`
          }
        })
      }

      if (meaning.synonyms && meaning.synonyms.length) {
        result += `<strong>同义词:</strong> ${meaning.synonyms.join(', ')}<br>`
      }

      if (meaning.antonyms && meaning.antonyms.length) {
        result += `<strong>反义词:</strong> ${meaning.antonyms.join(', ')}<br>`
      }
    })
  }

  // 添加来源
  if (entry.sourceUrls && entry.sourceUrls.length) {
    result += `<br><small>来源: <a href="${entry.sourceUrls[0]}" target="_blank">${entry.sourceUrls[0]}</a></small>`
  }

  return result
}

// 辅助函数：获取友好的错误信息
const getErrorMessage = (error) => {
  if (error.message.includes('Failed to fetch')) return '网络连接失败'
  if (error.message.includes('SecretId')) return '腾讯云API密钥无效'
  if (error.message.includes('限频')) return '请求过于频繁'
  if (error.message.includes('404')) return '未找到该单词的释义'
  return error.message || '未知错误'
}

// 打开翻译设置
const openTranslationSettings = () => {
  showTranslationSettings.value = !showTranslationSettings.value
  //selectedText.value = null;
}

// 最小化翻译对话框
const minimizeTranslationDialog = () => {
  isTranslationMode.value = false
  isTranslationMinimized.value = true
  //selectedText.value = null;
}

// 恢复翻译对话框
const restoreTranslationDialog = () => {
  isTranslationMode.value = true
  isTranslationMinimized.value = false
}

// 退出翻译模式
const exitTranslationMode = () => {
  isTranslationMode.value = false
  isTranslationMinimized.value = false
  removeTextSelectionListener()
}

//翻译框内容可编辑
const editableText = ref('') // 可编辑的文本
const lastSearchedText = ref('') // 最后一次成功搜索的文本
const debounceTimer = ref(null) // 防抖计时器

// 添加文本变化处理（带防抖）
const handleTextChange = (value) => {
  // 清除之前的计时器
  if (debounceTimer.value) {
    clearTimeout(debounceTimer.value)
  }

  // 设置新的计时器（500毫秒防抖）
  debounceTimer.value = setTimeout(() => {
    if (value && value !== lastSearchedText.value) {
      lastSearchedText.value = value
      translateText(value)
    }
  }, 500)
}

// 添加PDF缩略图渲染逻辑

// import * as pdfjsLib from 'pdfjs-dist'
// pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
//   '../../assets/js/pdf.worker.js',
//   import.meta.url
// ).href
import { getDocument } from 'pdfjs-dist'

//在PDF加载完成后调用
// const renderThumbnails = async () => {
//   const loadingTask = getDocument(pdfState.pdfSource);
//   const pdf = await loadingTask.promise;
//   let lastRenderTime = 0;
//   const renderInterval = 100; // 每100ms渲染一页（可根据性能调整）

//   // 先清除所有现有缩略图
//   const thumbnails = document.querySelectorAll(".thumbnail-canvas");
//   thumbnails.forEach((canvas) => {
//     const ctx = canvas.getContext("2d");
//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//   });

//   // 创建渲染队列
//   const renderQueue = [];
//   for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
//     renderQueue.push(pageNum);
//   }

//   // 使用递归实现节流渲染
//   const renderNextPage = async () => {
//     if (renderQueue.length === 0) return;

//     const now = Date.now();
//     const elapsed = now - lastRenderTime;

//     if (elapsed < renderInterval) {
//       await new Promise((resolve) =>
//         setTimeout(resolve, renderInterval - elapsed)
//       );
//     }

//     const pageNum = renderQueue.shift();
//     lastRenderTime = Date.now();

//     try {
//       const page = await pdf.getPage(pageNum);
//       const viewport = page.getViewport({ scale: 0.2 });

//       const canvas = document.querySelector(
//         `.thumbnail-canvas[data-page="${pageNum}"]`
//       );

//       if (!canvas) {
//         console.warn(`找不到第 ${pageNum} 页的缩略图canvas元素`);
//         return renderNextPage();
//       }

//       const context = canvas.getContext("2d");
//       canvas.height = viewport.height;
//       canvas.width = viewport.width;

//       await page.render({
//         canvasContext: context,
//         viewport: viewport,
//       }).promise;
//     } catch (error) {
//       console.error(`渲染第 ${pageNum} 页缩略图失败:`, error);
//     }

//     // 继续渲染下一页（使用requestAnimationFrame减少主线程阻塞）
//     requestAnimationFrame(renderNextPage);
//   };

//   // 启动渲染（初始并发数设为2，平衡速度和性能）
//   const initialConcurrency = Math.min(2, renderQueue.length);
//   for (let i = 0; i < initialConcurrency; i++) {
//     renderNextPage();
//   }
// };

const renderThumbnails = async () => {
  try {
    // 1. 创建新的PDF文档实例（避免共享状态）
    const loadingTask = getDocument({
      url: pdfState.pdfSource.url,
      cMapUrl: pdfState.pdfSource.cMapUrl,
      cMapPacked: pdfState.pdfSource.cMapPacked
    })

    const pdf = await loadingTask.promise

    // 2. 使用全新的canvas渲染队列
    const renderQueue = []
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      renderQueue.push({
        pageNum,
        canvas: document.querySelector(`.thumbnail-canvas[data-page="${pageNum}"]`)
      })
    }

    // 3. 串行渲染+canvas克隆技术
    for (const item of renderQueue) {
      if (!item.canvas) continue

      try {
        // 创建临时canvas进行渲染
        const tempCanvas = document.createElement('canvas')
        const page = await pdf.getPage(item.pageNum)
        const viewport = page.getViewport({ scale: 0.2 })

        tempCanvas.width = viewport.width
        tempCanvas.height = viewport.height

        // 在临时canvas上渲染
        await page.render({
          canvasContext: tempCanvas.getContext('2d'),
          viewport: viewport
        }).promise

        // 将结果复制到目标canvas
        const targetCtx = item.canvas.getContext('2d')
        item.canvas.width = viewport.width
        item.canvas.height = viewport.height
        targetCtx.drawImage(tempCanvas, 0, 0)

        // 销毁临时资源
        tempCanvas.width = 1
        tempCanvas.height = 1
        await new Promise((resolve) => setTimeout(resolve, 30))
      } catch (error) {
        console.error(`渲染第 ${item.pageNum} 页缩略图失败:`, error)
      }
    }
  } catch (error) {
    console.error('加载缩略图失败:', error)
  }
}

// import * as pdfjsLib from 'pdfjs-dist'
// pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
//   '../../assets/js/pdf.worker.js',
//   import.meta.url
// ).href

// onMounted(async () => {
//   const pdfUrl = await loadPdfFile(route.query.pdfUrl)
//   console.log('pdfUrl:', pdfUrl)
//   if (pdfUrl) {
//     pdfState.pdfSource.url = pdfUrl
//   }
// })

// onMounted(async () => {
//   const pdfUrl = await loadPdfFile(route.query.pdfUrl)
//   if (pdfUrl) {
//     pdfState.pdfSource.url = pdfUrl

//     const loadingTask = createLoadingTask(pdfState.pdfSource)
//     loadingTask.promise.then((pdf) => {
//       pdfState.numPages = pdf.numPages
//       // 初始化所有页面的绘图数据
//       // console.log('ok:', pdf.numPages)
//       for (let i = 1; i <= pdf.numPages; i++) {
//         initPageDrawings(i)
//       }
//       // 加载第一页数据
//       // loadPageData(1);
//       loadThumbnails()
//       parsePdfOutline()
//       renderThumbnails()
//     })
//   }
// })

onUnmounted(() => {
  // 取消任何未完成的PDF操作
  if (pdfState.pdfSource && pdfState.pdfSource.destroy) {
    pdfState.pdfSource.destroy()
  }
})

onUnmounted(() => {
  // 清除所有缩略图canvas
  document.querySelectorAll('.thumbnail-canvas').forEach((canvas) => {
    canvas.width = 1
    canvas.height = 1
  })
})

// 左侧边栏结构图
// Add PDF outline state
const pdfOutline = ref([])
const activeSidebarView = ref('thumbnails') // 'thumbnails' or 'structure'

// Add method to parse PDF outline
const parsePdfOutline = async () => {
  try {
    const loadingTask = getDocument(pdfState.pdfSource)
    const pdf = await loadingTask.promise
    const outline = await pdf.getOutline()

    if (outline) {
      pdfOutline.value = processOutlineItems(outline)
    } else {
      pdfOutline.value = []
    }
  } catch (error) {
    console.error('Failed to parse PDF outline:', error)
    pdfOutline.value = []
  }
}

// Helper to process outline items recursively
const processOutlineItems = (items) => {
  if (!items) return []

  return items.map((item) => ({
    title: item.title,
    dest: item.dest,
    items: processOutlineItems(item.items),
    bold: item.bold,
    italic: item.italic,
    color: item.color
  }))
}

// Method to navigate to outline destination
const jumpToOutlineDestination = async (dest) => {
  saveCurrentPage()
  try {
    const loadingTask = getDocument(pdfState.pdfSource)
    const pdf = await loadingTask.promise

    let pageRef = null

    if (Array.isArray(dest)) {
      // Handle array-style destinations
      if (dest.length === 0) return

      // First element could be a page reference object
      if (dest[0] instanceof Object) {
        pageRef = dest[0]
      }
      // First element could be a named destination string
      else if (typeof dest[0] === 'string') {
        const resolvedDest = await pdf.getDestination(dest[0])
        if (resolvedDest && resolvedDest[0]) {
          pageRef = resolvedDest[0]
        }
      }
      // First element could be a direct page number
      else if (typeof dest[0] === 'number') {
        pdfState.pageNum = Math.max(1, dest[0] + 1)
        return
      }
    }
    // Handle string destinations (named destinations)
    else if (typeof dest === 'string') {
      const resolvedDest = await pdf.getDestination(dest)
      if (resolvedDest && resolvedDest[0]) {
        pageRef = resolvedDest[0]
      }
    }

    // If we have a page reference, get its index
    if (pageRef) {
      const pageIndex = await pdf.getPageIndex(pageRef)
      if (pageIndex !== null && pageIndex !== undefined) {
        pdfState.pageNum = Math.max(1, pageIndex + 1)
      }
    }
  } catch (error) {
    console.error('Failed to navigate to outline destination:', error)
    // Fallback: Try to extract page number from the destination string
    try {
      const pageNum = extractPageNumberFromDestination(dest)
      if (pageNum) {
        pdfState.pageNum = pageNum
      }
    } catch (fallbackError) {
      console.error('Fallback extraction failed:', fallbackError)
    }
  }

  loadCurrentPage()
}

// Helper function to extract page number from complex destinations
const extractPageNumberFromDestination = (dest) => {
  if (!dest) return null

  // Try to find a number in the destination string/array
  const str = JSON.stringify(dest)
  const matches = str.match(/"page":(\d+)|"num":(\d+)|(\d+)/)
  if (matches) {
    for (let i = 1; i < matches.length; i++) {
      if (matches[i]) {
        const num = parseInt(matches[i])
        if (!isNaN(num)) return Math.max(1, num + 1)
      }
    }
  }
  return null
}

const ifFixLeft = ref(false)

const closeSidebar = () => {
  if (!ifFixLeft.value && showThumbnails.value) {
    showThumbnails.value = false
  }
  // if (showLayers.value) {
  //   showLayers.value = false;
  // }
}

//全屏显示
// 添加全屏状态
const isFullScreen = ref(false)

// 添加全屏切换函数
const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    // 进入全屏
    document.documentElement
      .requestFullscreen()
      .then(() => {
        isFullScreen.value = true
      })
      .catch((err) => {
        console.error('全屏错误:', err)
      })
  } else {
    // 退出全屏
    if (document.exitFullscreen) {
      document.exitFullscreen().then(() => {
        isFullScreen.value = false
      })
    }
  }
}

//顶部工具栏伸缩

// 画笔工具切换逻辑
// 添加activeTool状态
const activeTool = ref(null)
const toolButtons = ref([])

// 设置激活工具
const setActiveTool = (tool) => {
  //console.log("here is  setActiveTool:", tool);
  // 如果当前有未保存的文字，先保存
  // if (textInputVisible.value && textInputValue.value.trim()) {
  //   saveTextAnnotation();
  // }

  // 原有的工具切换逻辑
  if (activeTool.value === tool) {
    activeTool.value = null
    shapeMode.value = null
    brushMode.value = null
  } else {
    activeTool.value = tool

    if (['rectangle', 'ellipse', 'line'].includes(tool)) {
      shapeMode.value = tool
      brushMode.value = null
      //console.log("here is  shape-select:", shapeMode.value);
    } else if (tool === 'select') {
      shapeMode.value = 'select'
      brushMode.value = null
    } else if (['brush', 'eraser', 'text'].includes(tool)) {
      brushMode.value = tool
      shapeMode.value = null
      // console.log("here is  tool-select:", brushMode.value);
    } else {
      console.log('nothing in tool here is setActiveTool function')
    }
  }
}

// 添加工具栏折叠状态
const isToolbarCollapsed = ref(false)

// 切换工具栏折叠状态
const toggleToolbarCollapse = () => {
  isToolbarCollapsed.value = !isToolbarCollapsed.value
}

// 监听全屏变化
const handleFullScreenChange = () => {
  isFullScreen.value = !!document.fullscreenElement
}

// 右侧图层可重命名---------
// 添加状态
const renamingIndex = ref(-1) // 当前正在重命名的图层索引

// 添加方法
const startRenameLayer = () => {
  if (activeLayerIndex.value === -1) return
  renamingIndex.value = activeLayerIndex.value

  nextTick(() => {
    // 自动聚焦到输入框
    const inputRef = document.querySelector('.layer-name-input input')
    if (inputRef) {
      inputRef.focus()
      // 选中现有文本
      inputRef.select()
    }
  })
}

const finishRenaming = () => {
  renamingIndex.value = -1
}

// 左侧边栏固定

// 左侧边栏拉伸------------
// 添加状态
const sidebarWidth = ref(200) // 默认宽度
const isResizingSidebar = ref(false)
const sidebarMinWidth = 200 // 最小宽度

// 添加方法
const startResizeSidebar = (e) => {
  isResizingSidebar.value = true
  document.addEventListener('mousemove', handleResizeSidebar)
  document.addEventListener('mouseup', stopResizeSidebar)
  e.preventDefault()
}

const handleResizeSidebar = (e) => {
  if (!isResizingSidebar.value) return

  // 计算新宽度，限制最小宽度
  const newWidth = Math.max(sidebarMinWidth, e.clientX)
  sidebarWidth.value = newWidth
}

const stopResizeSidebar = () => {
  isResizingSidebar.value = false
  document.removeEventListener('mousemove', handleResizeSidebar)
  document.removeEventListener('mouseup', stopResizeSidebar)
}

onUnmounted(() => {
  // 清理侧边栏调整大小的事件监听器
  document.removeEventListener('mousemove', handleResizeSidebar)
  document.removeEventListener('mouseup', stopResizeSidebar)
})

watch(showThumbnails, () => {
  if (!showThumbnails.value) {
    sidebarWidth.value = 200
  }
})

// 分页绘图功能-------------
// 修改原有的绘图数据存储结构
const pageDrawings = ref({}) // 改为按页码存储绘图数据
const currentShape = ref(null) // 用于临时存储正在绘制的形状

const currentPageData = computed(() => {
  //console.log("here is currentPageData");
  if (!pageDrawings.value[pdfState.pageNum]) {
    console.log('Initializing page data for page', pdfState.pageNum)
    pageDrawings.value[pdfState.pageNum] = {
      layers: [
        {
          id: Date.now(),
          visible: true,
          name: '图层 1',
          shapes: []
        }
      ],
      activeLayerIndex: 0
    }
  }
  return pageDrawings.value[pdfState.pageNum]
})

// 初始化当前页的绘图数据
const initPageDrawings = (pageNum) => {
  if (!pageDrawings.value[pageNum]) {
    pageDrawings.value[pageNum] = {
      layers: [
        {
          id: Date.now(),
          visible: true,
          name: '图层 1',
          shapes: [] // 确保初始图层有 shapes 数组
        }
      ],
      activeLayerIndex: 0
    }
  }
}

// 切换页面时保存当前状态
const switchPage = (newPage) => {
  // 保存当前页状态
  saveCurrentPage()

  // 更新页码
  pdfState.pageNum = newPage

  // 加载新页面数据
  loadCurrentPage()
}

// 加载页面数据
// const loadPageData = (pageNum) => {
//   const pageData = getCurrentPageData();
//   layers.value = pageData.layers;
//   activeLayerIndex.value = pageData.activeLayerIndex;
//   shapes.value = pageData.shapes || [];

//   nextTick(() => {
//     // initCanvases();
//     redrawAllShapes();
//   });
// };

const saveCurrentPage = () => {
  pageDrawings.value[pdfState.pageNum] = {
    layers: layers.value.map((layer) => ({
      ...layer,
      shapes: [...layer.shapes] // 深拷贝 shapes 数组
    })),
    activeLayerIndex: activeLayerIndex.value
  }
}

const loadCurrentPage = () => {
  const pageData = currentPageData.value
  // console.log("run loadCurrenPage,get currentOageData", pageData);
  // 确保每个图层都有 shapes 数组
  layers.value = pageData.layers.map((layer) => ({
    ...layer,
    shapes: layer.shapes || [] // 如果 shapes 不存在则初始化为空数组
  }))

  activeLayerIndex.value = pageData.activeLayerIndex || 0 // 默认激活第一个图层

  nextTick(() => {
    initCanvases()
    redrawAllVisibleLayers() // 改为调用新函数
  })
}

// 修改获取当前页绘图数据的方法
const getCurrentPageDrawings = () => {
  const currentPage = pdfState.pageNum
  initPageDrawings(currentPage)
  return pageDrawings.value[currentPage]
}

// 更新本地图层引用
const updateLocalLayers = () => {
  const pageData = getCurrentPageData()
  layers.value = pageData.layers.map((layer) => ({
    ...layer,
    // 确保新创建的图层有默认visible属性
    visible: layer.visible !== false
  }))
  activeLayerIndex.value = pageData.activeLayerIndex
}

// 获取当前页绘图数据
const getCurrentPageData = () => {
  const page = pdfState.pageNum
  if (!pageDrawings.value[page]) {
    initPageDrawings(page)
  }
  return pageDrawings.value[page]
}

// 初始化所有页面数据（加载PDF时调用）
const initAllPagesData = () => {
  for (let i = 1; i <= pdfState.numPages; i++) {
    getCurrentPageData(i)
  }
}

// 在PDF加载完成后调用
// onMounted(() => {
//   const loadingTask = createLoadingTask(pdfState.pdfSource);
//   loadingTask.promise.then((pdf) => {
//     pdfState.numPages = pdf.numPages;
//     initAllPagesData();
//   });
// });

//画布只在视窗有效
// 修改 startDrawing 和 draw 方法中的位置计算
const getCanvasPosition = (clientX, clientY, canvas) => {
  const rect = canvas.getBoundingClientRect()
  const scrollX = window.scrollX || window.pageXOffset
  const scrollY = window.scrollY || window.pageYOffset
  return {
    x: clientX - rect.left + scrollX,
    y: clientY - rect.top + scrollY
  }
}

//其他-------------
onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullScreenChange)

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && textInputVisible.value) {
      cancelTextInput()
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullScreenChange)

  window.removeEventListener('keydown', (e) => {
    if (e.key === 'Escape' && textInputVisible.value) {
      cancelTextInput()
    }
  })
})

// Watch for PDF source changes to reload outline
watch(
  () => pdfState.pdfSource,
  () => {
    parsePdfOutline()
  },
  { deep: true }
)

// Initial load
onMounted(() => {})

// 组件卸载时移除监听器
onUnmounted(() => {
  removeTextSelectionListener()
})

// 添加观察器，当 brushMode 变化时重置其他模式
watch(brushMode, (newVal) => {
  if (newVal === 'text') {
    shapeMode.value = null
  } else {
    textInputVisible.value = false
  }
})

// 同样观察 shapeMode
watch(shapeMode, (newVal) => {
  if (newVal) {
    brushMode.value = null
  }
})

// 监听页面变化和缩放
// watch(
//   () => [pdfState.pageNum, scaleData.value],
//   () => {
//     initCanvases();
//   },
//   { deep: true }
// );

// watch(
//   scaleData,
//   () => {
//     initCanvases();
//   },
//   { immediate: true }
// );

// 添加 PDF 渲染完成处理
const handlePdfRendered = () => {
  // console.log("PDF rendered, initializing canvases");
  initCanvases()
}

// 添加对绘图模式的监听
// watch(
//   isDrawingMode,
//   (newVal) => {
//     nextTick(() => {
//       canvasLayers.value.forEach((canvas) => {
//         if (canvas) {
//           canvas.style.pointerEvents = newVal ? "auto" : "none";
//         }
//       });
//       initCanvases(); // 重新初始化确保尺寸正确
//     });
//   },
//   { immediate: true }
// );

watch(isDrawingMode, (newVal) => {
  canvasLayers.value.forEach((canvas) => {
    if (canvas) {
      canvas.style.pointerEvents = newVal ? 'auto' : 'none'
    }
  })
})

watch(isFullScreen, () => {
  // 重新初始化画布和事件
  nextTick(() => {
    initCanvases()
    bindDrawingEvents()
  })
})

// onMounted(() => {
//   initCanvases();
//   window.addEventListener("resize", initCanvases);
// });

// onUnmounted(() => {
//   window.removeEventListener("resize", initCanvases);
// });

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})
// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<style>
.pdf-viewer-container {
  display: flex;
  position: relative;
  height: 100%;
  overflow: hidden;
  /* height: 100vh;  */
}

.thumbnail-sidebar {
  position: relative;
  left: -300px;
  top: 0px;
  width: 200px; /* 扩大宽度以容纳缩略图  #f5f5f5*/
  height: 100%;
  background: rgba(255, 255, 255, 1);
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  /* z-index: 100; */
  transition: all 0.3s ease;
  /* padding: 10px 0; */
  border-right: 1px solid #e0e0e0;
}

.thumbnail-sidebar.active {
  left: 0px;
}

.sidebar-resizer {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 5px;
  cursor: col-resize;
  z-index: 10;
}

.sidebar-resizer:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

.main-content {
  position: relative; /* 添加这行 */
  flex: 1;
  /* transition: all 0.3s ease; */
  margin-left: 0;
  width: 100%;
}

/* .el-scrollbar {
  height: 100%;
  padding: 0 20px;
} */

.thumbnail-item {
  padding: 8px;
  margin: 8px;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.thumbnail-item:hover {
  background: #f0f7ff;
}

.thumbnail-item.active {
  border-left: 3px solid var(--el-color-primary);
  background: #e6f7ff;
}

.thumbnail-canvas {
  width: 100%;
  height: auto;
  margin-bottom: 6px;
  border: 1px solid #eee;
  display: block; /* 避免canvas默认inline间隙 */
}

.page-number {
  font-size: 12px;
  color: #666;
  text-align: center;
}

.main-content.sidebar-open {
  margin-left: 280px;
}
/*
.toolbar {
  display: flex;
  justify-content: center;
  padding: 10px;
  background: #f5f5f5;
  margin-bottom: 10px;
  transition: all 0.3s ease;
  overflow: hidden;
} */

.page-input {
  margin: 0 10px;
  transition: all 0.3s ease;
}

/* 工具栏折叠时的样式 */
.toolbar.collapsed {
  padding: 8px; /* 折叠后缩小 */
  min-width: 40px; /* 最小宽度 */
  justify-content: flex-end;
  padding: 10px;
}

/* .toolbar.collapsed .el-button:not(.error-button) {
  display: none;
} */

.toolbar.collapsed > *:not(.error-button) {
  display: none; /* 隐藏除错误按钮外的所有子元素 */
}

.toolbar.collapsed .error-button {
  margin-left: 0; /* 移除左边距 */
}

.toolbar .el-button {
  transition: all 0.2s ease;
}

/* 移除所有按钮边框（包括默认、hover、active状态） */
.toolbar .el-button {
  border: none !important;
  box-shadow: none !important;
}

/* 错误按钮样式 */
/* .error-button {
  margin-left: 10px;
  background-color: #f56c6c;
  color: white;
  border-color: #f56c6c;
} */

/* .error-button:hover {
  background-color: #f78989;
  border-color: #f78989;
} */

#pdf-container {
  width: 100%;
  height: 100%;
  /* height: calc(100vh - 60px); */
  overflow: auto;
  outline: none; /* 移除焦点时的默认轮廓线 */
  transition: width 0.3s ease; /* 添加过渡效果 */
}

#vue-pdf-view {
  position: relative;
  width: 100%;
  min-height: 100%;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
}

#page-view {
  transition: transform 0.3s ease;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

/* 滚动条样式 */
#pdf-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

#pdf-container::-webkit-scrollbar-thumb {
  border-radius: 15px;
  background-color: #eee;
}

#pdf-container::-webkit-scrollbar-thumb:hover {
  background-color: #cbcbff;
}

/* 右侧图层侧边栏 */
.layer-sidebar {
  position: fixed;
  right: 0;
  top: 30px;
  height: 100%;
  width: 300px; /* 总宽度 */
  background: #f5f5f5;
  display: flex; /* 启用横向flex布局 */
  z-index: 100;
  transition: transform 0.3s ease;
  transform: translateX(100%);
}

.layer-sidebar.active {
  transform: translateX(0);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px 10px;
  border-bottom: 1px solid #ddd;
  margin-bottom: 10px;
  gap: 5px;
  padding: 10px;
}

.sidebar-header-left {
  display: flex;
  justify-content: left;
  align-items: center;
  padding: 10px 20px 10px;
  border-bottom: 1px solid #ddd;
  margin-bottom: 10px;
}

/* 侧边栏结构 */

.structure-view {
  padding: 0 10px;
  font-size: 13px;
}

.outline-container {
  padding: 5px 10px;
}

.outline-item {
  padding: 6px 0;
  cursor: pointer;
  transition: all 0.2s;
  /* border: 2px solid transparent; */
}

.outline-item:hover {
  color: var(--el-color-primary);
  /* border-color: var(--el-color-primary); */
}

.outline-item.active {
  color: var(--el-color-primary);
  font-weight: bold;
  /* border-color: var(--el-color-primary); */
}

.outline-children {
  padding-left: 15px;
  border-left: 1px dashed #e0e0e0;
  margin-left: 5px;
}

.no-outline {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

/* next */

/* .layer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  margin: 5px 10px;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
} */

.layer-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.layer-item:hover {
  background-color: #f5f5f5;
}

.layer-item.active {
  background-color: #e6f7ff;
}

/* 图层容器 */
.layers-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 默认禁用 */
}

.canvas-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.canvas-layer-inner {
  height: 100%;
}

.is-drawing .canvas-layer {
  pointer-events: auto; /* 绘图模式启用 */
}

.is-drawing #vue-pdf-view {
  pointer-events: none;
}

.canvas-layer canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 默认禁用 */
}

/* 底部画笔工具栏 */
.brush-toolbar {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 8px 20px;
  border-radius: 50px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  z-index: 100;
  transition: all 0.3s ease;
  opacity: 1;
}

/* 移除所有按钮边框（包括默认、hover、active状态） */
.brush-toolbar .el-button {
  border: none !important;
}

.tool-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
  z-index: 1;
  transition: all 0.2s;
  margin-left: 5px;
  margin-right: 5px;
}

.tool-button-top {
  width: 36px;
  height: 36px;
  margin-left: 10px;
  margin-right: 10px;
  border-radius: 5px;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  cursor: pointer;
  display: flex;
  transition: all 0.3s;
  z-index: 1;
  position: relative;
}

.tool-button:hover,
.tool-button-top:hover {
  background: rgba(0, 0, 0, 0.05);
}

.tool-button-top.active,
.tool-button.active {
  background-color: #caf0ff;
}

.layer-actions {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.layer-name-input {
  flex-grow: 1;
  margin-right: 8px;
}

.layer-name-input .el-input {
  width: 100%;
}

/* .layer-actions .el-button {
  margin-left: 5px;
} */

/* 颜色选择器样式 */
.color-preview {
  width: 16px;
  height: 16px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  display: inline-block;
}

.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
}

.color-option {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid #eee;
  transition: transform 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.tool-group {
  display: flex;
  align-items: center;
  margin: 0 10px;
}

.tool-group span {
  margin-right: 5px;
  font-size: 12px;
  color: #666;
}

/* 添加形状工具样式 */
.shape-tools {
  display: flex;
  gap: 5px;
  margin: 0 10px;
}

.shape-tool {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  background: #f5f5f5;
}

.shape-tool:hover {
  background: #e0e0e0;
}

.shape-tool.active {
  background: var(--el-color-primary);
  color: white;
}

.total-settings {
  width: 90%;
  padding-left: 10px;
  /* padding: 5px; */
  box-sizing: border-box; /* 确保 padding 和 border 包含在宽度内 */
  /* 如果需要内边距 */
}

/* :deep(.el-scrollbar) {
    height: 100%;
    padding: 0 0px;
} */

/* 添加设置项样式 */
.setting-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
}

.setting-item span {
  margin-bottom: 5px;
  font-size: 14px;
  color: #666;
}

/* .brush-settings,
.shape-settings {
  padding: 10px;
} */

/* 选择框样式 */
.selection-box {
  position: absolute;
  border: 1px dashed #0099ff;
  background-color: rgba(0, 153, 255, 0.1);
  pointer-events: none;
}

/* .text-input-container {
  position: absolute;
  z-index: 9999 !important;
  transform-origin: top left;
  background: white;
  padding: 5px;
  border-radius: 4px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
} */

/* 添加样式防止点击穿透 */
/* .text-input-container {
  position: absolute;
  pointer-events: auto;
  z-index: 1000;
  transform-origin: 0 0;
} */

.text-input-container {
  position: absolute;
  /* background: white; */
  /* padding: 8px; */
  /* border-radius: 4px; */
  /* box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15); */
  z-index: 1000;
}

.text-actions {
  margin-top: 8px;
  display: flex;
  justify-content: flex-end;
  /* gap: 8px; */
}

/* :deep(.text-input-container .el-textarea__inner) {
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  min-width: 100px;
} */

.text-input {
  min-width: 120px;
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid #409eff;
  border-radius: 4px;
  padding: 5px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

:deep(.text-input .el-textarea__inner) {
  background-color: transparent;
  border: none;
  padding: 0;
}

/* 消除Element UI输入框的默认边距 */
/* :deep(.exact-position-input .el-textarea__inner) {
  padding: 4px 8px;
  margin: 0;
  line-height: 1.2;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  min-width: 100px;
  border: 1px solid #409eff;
  border-radius: 4px;
  font-family: inherit;
} */

.exact-position-input {
  margin: 0;
  height: 40px;
  line-height: 1.2;
  border: 1px solid #b7b7b7;
  border-radius: 4px;
  font-family: inherit;
}

.exact-position-input:focus {
  border: 1px solid #409eff;
  outline: none;
}

/* 消除textarea的默认样式 */
/* :deep(.exact-position-input textarea) {
  margin: 0;
  padding: 2px 5px;
  height: 60px;
} */

/* 新增划词翻译对话框样式 */
.translation-dialog {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  user-select: none;
}

.translation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  cursor: grab; /* 鼠标悬停时显示可抓取手势 */
}

.translation-header:active {
  cursor: grabbing; /* 拖拽时显示抓取中手势 */
}
.dialog-title {
  font-weight: bold;
  color: #333;
}

.dialog-actions {
  display: flex;
  gap: 4px;
}

/* .translation-content {
  flex: 1;
  padding: 16px;
  overflow: auto;
} */

.translation-settings {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 12px;
  height: 12px;
  background: #409eff;
  cursor: nwse-resize;
  z-index: 1001;
}

/* 最小化按钮样式 */
.translation-minimized {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: var(--el-color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transition: all 0.2s;
}

.translation-minimized:hover {
  background: var(--el-color-primary-light-3);
  transform: scale(1.1);
}

/* 2 */
.translation-content {
  padding: 16px;
  min-height: 120px;
}

.translation-result {
  padding: 8px;
}

.original-text {
  padding: 8px;
  margin-bottom: 12px;
  background: #f8f8f8;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
}

/* 使输入框更紧凑 */
:deep(.original-text .el-input__wrapper) {
  padding: 4px 8px;
  background: #f8f8f8;
}

/* 输入框聚焦样式 */
:deep(.original-text .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

.translation-result,
.translated-text {
  user-select: text !important; /* 确保文本可选中 */
  -webkit-user-select: text !important; /* 兼容 Safari */
}

.translated-text {
  padding: 8px;
  font-size: 16px;
  line-height: 1.5;
}

.translation-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #909399;
}

.translation-placeholder .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.translation-settings {
  padding: 16px;
}

.translation-minimized {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: var(--el-color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
}

.translation-minimized:hover {
  background: var(--el-color-primary-light-3);
}

/* 图层重命名 */

/* 页码侧边栏样式 */
.page-list-sidebar {
  width: 50px;
  border-right: 1px solid #e0e0e0;
  overflow-y: auto;
  background: #fff;
}

.page-item {
  padding: 12px 0;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.page-item.active {
  background: #e6f7ff;
  color: var(--el-color-primary);
}

.page-item.active {
  background-color: #e6f7ff;
  font-weight: bold;
  color: var(--el-color-primary);
}

.page-number {
  font-size: 14px;
}

/* 右侧面板 */
.right-panel {
  flex: 1; /* 占据剩余空间 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 10px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0; /* 防止头部被压缩 */
}
</style>
