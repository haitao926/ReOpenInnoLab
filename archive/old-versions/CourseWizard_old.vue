<template>
  <div class="course-wizard">
    <div class="wizard-header">
      <h2 class="wizard-title">
        <el-icon><Document /></el-icon>
        {{ isEditing ? '编辑课程' : '创建新课程' }}
      </h2>
      <div class="wizard-progress">
        <el-steps :active="currentStep" align-center>
          <el-step
            v-for="(step, index) in steps"
            :key="index"
            :title="step.title"
            :description="step.description"
          />
        </el-steps>
      </div>
    </div>

    <div class="wizard-layout">
      <div class="wizard-content">
      <!-- 步骤1: 基本信息 -->
      <div v-if="currentStep === 0" class="wizard-step">
        <div class="step-header">
          <h3>课程基本信息</h3>
          <p>设置课程的基本属性和目标受众</p>
        </div>

        <el-form
          ref="basicInfoRef"
          :model="courseForm.info"
          :rules="basicInfoRules"
          label-width="120px"
          class="wizard-form"
        >
          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="课程标题" prop="title">
                <el-input
                  v-model="courseForm.info.title"
                  placeholder="请输入课程标题"
                  maxlength="100"
                  show-word-limit
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="学科" prop="subject">
                <el-select v-model="courseForm.info.subject" placeholder="选择学科">
                  <el-option
                    v-for="subject in subjects"
                    :key="subject.value"
                    :label="subject.label"
                    :value="subject.value"
                  >
                    <span class="subject-option">
                      <el-icon :color="subject.color">
                        <component :is="subject.icon" />
                      </el-icon>
                      {{ subject.label }}
                    </span>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="年级" prop="grade">
                <el-select v-model="courseForm.info.grade" placeholder="选择年级">
                  <el-option
                    v-for="grade in grades"
                    :key="grade.value"
                    :label="grade.label"
                    :value="grade.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="课时" prop="duration">
                <el-input-number
                  v-model="courseForm.info.duration"
                  :min="1"
                  :max="200"
                  controls-position="right"
                />
                <span class="unit">课时</span>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="难度等级" prop="difficulty">
                <el-select v-model="courseForm.info.difficulty" placeholder="选择难度">
                  <el-option label="入门" value="beginner" />
                  <el-option label="进阶" value="intermediate" />
                  <el-option label="高级" value="advanced" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="课程封面">
                <el-upload
                  class="cover-uploader"
                  :show-file-list="false"
                  :before-upload="beforeCoverUpload"
                  :http-request="handleCoverUpload"
                >
                  <img v-if="courseForm.info.coverImage" :src="courseForm.info.coverImage" class="cover-preview" />
                  <div v-else class="cover-upload-btn">
                    <el-icon><Plus /></el-icon>
                    <div>上传封面</div>
                  </div>
                </el-upload>
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="课程描述" prop="description">
                <el-input
                  v-model="courseForm.info.description"
                  type="textarea"
                  :rows="4"
                  placeholder="请输入课程描述"
                  maxlength="500"
                  show-word-limit
                />
              </el-form-item>
            </el-col>

            <el-col :span="24">
              <el-form-item label="课程标签">
                <el-select
                  v-model="courseForm.info.tags"
                  multiple
                  filterable
                  allow-create
                  placeholder="添加标签"
                  class="tag-select"
                >
                  <el-option
                    v-for="tag in suggestedTags"
                    :key="tag"
                    :label="tag"
                    :value="tag"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <!-- AI生成建议 -->
        <div class="ai-suggestions">
          <div class="suggestions-header">
            <el-icon><MagicStick /></el-icon>
            <span>AI课程建议</span>
            <div class="suggestion-actions">
              <el-button size="small" @click="toggleMultiSubjectMode">
                <el-icon><Collection /></el-icon>
                {{ showMultiSubjectMode ? '单学科模式' : '多学科模式' }}
              </el-button>
              <el-button size="small" type="primary" @click="generateAISuggestions">
                获取建议
              </el-button>
            </div>
          </div>

          <!-- 多学科模板模式 -->
          <div v-if="showMultiSubjectMode" class="multi-subject-mode">
            <EnhancedCourseWizard
              v-if="showEnhancedWizard"
              @template-applied="onMultiSubjectTemplateApplied"
              @template-saved="onTemplateSaved"
            />
          </div>

          <!-- 传统AI建议模式 -->
          <div v-else-if="aiSuggestions.length > 0" class="suggestions-content">
            <div
              v-for="suggestion in aiSuggestions"
              :key="suggestion.title"
              class="suggestion-item"
              @click="applySuggestion(suggestion)"
            >
              <h4>{{ suggestion.title }}</h4>
              <p>{{ suggestion.description }}</p>
              <div class="suggestion-tags">
                <el-tag
                  v-for="tag in suggestion.targetAudience.split('、')"
                  :key="tag"
                  size="small"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤2: 章节结构 -->
      <div v-if="currentStep === 1" class="wizard-step">
        <div class="step-header">
          <h3>课程章节结构</h3>
          <p>设计课程的学习路径和章节安排</p>
        </div>

        <div class="chapter-structure">
          <div class="structure-toolbar">
            <el-button type="primary" @click="addChapter">
              <el-icon><Plus /></el-icon>
              添加章节
            </el-button>
            <el-button @click="generateAIChapterStructure">
              <el-icon><MagicStick /></el-icon>
              AI生成结构
            </el-button>
            <el-button @click="importChapterTemplate">
              <el-icon><Upload /></el-icon>
              导入模板
            </el-button>
          </div>

          <div class="chapters-list">
            <draggable
              v-model="courseForm.chapters"
              item-key="id"
              @end="handleChapterReorder"
            >
              <template #item="{ element: chapter, index }">
                <div class="chapter-item" :class="{ 'is-ai-enhanced': chapter.aiEnhanced }">
                  <div class="chapter-header">
                    <div class="chapter-info">
                      <div class="chapter-number">第{{ index + 1 }}章</div>
                      <div class="chapter-title">
                        <el-input
                          v-model="chapter.title"
                          placeholder="章节标题"
                          class="title-input"
                        />
                      </div>
                      <div class="chapter-type">
                        <el-select v-model="chapter.type" size="small">
                          <el-option label="课程引入" value="introduction" />
                          <el-option label="新知讲解" value="knowledge" />
                          <el-option label="体验理解" value="experience" />
                          <el-option label="实验活动" value="experiment" />
                          <el-option label="作业测试" value="assignment" />
                        </el-select>
                      </div>
                    </div>
                    <div class="chapter-actions">
                      <el-button
                        v-if="chapter.type === 'experiment'"
                        size="small"
                        type="success"
                        @click="configureExperiment(chapter)"
                      >
                        <el-icon><Operation /></el-icon>
                        配置实验
                      </el-button>
                      <el-button
                        v-if="chapter.type === 'experience'"
                        size="small"
                        type="warning"
                        @click="uploadInteractive(chapter)"
                      >
                        <el-icon><Upload /></el-icon>
                        上传互动
                      </el-button>
                      <el-button
                        size="small"
                        :type="chapter.aiEnhanced ? 'primary' : 'default'"
                        @click="toggleAIEnhancement(chapter)"
                      >
                        <el-icon><MagicStick /></el-icon>
                        AI增强
                      </el-button>
                      <el-button size="small" type="danger" @click="removeChapter(index)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                  <div class="chapter-content">
                    <el-input
                      v-model="chapter.description"
                      type="textarea"
                      :rows="2"
                      placeholder="章节描述"
                    />
                    <div class="chapter-meta">
                      <div class="meta-item">
                        <label>预计时长:</label>
                        <el-input-number
                          v-model="chapter.duration"
                          :min="5"
                          :max="180"
                          size="small"
                          controls-position="right"
                        />
                        <span>分钟</span>
                      </div>
                      <div class="meta-item">
                        <label>学习目标:</label>
                        <el-input
                          v-model="chapter.objectivesText"
                          placeholder="用逗号分隔多个目标"
                          size="small"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </div>
      </div>

      <!-- 步骤3: 内容设计 -->
      <div v-if="currentStep === 2" class="wizard-step">
        <div class="step-header">
          <h3>课程内容设计</h3>
          <p>为每个章节设计具体的教学内容</p>
        </div>

        <div class="content-design">
          <el-tabs v-model="activeChapterTab" tab-position="left">
            <el-tab-pane
              v-for="(chapter, index) in courseForm.chapters"
              :key="chapter.id"
              :label="`第${index + 1}章: ${chapter.title}`"
              :name="chapter.id"
            >
              <div class="chapter-editor">
                <div class="editor-toolbar">
                  <el-button-group>
                    <el-button
                      v-for="tool in editorTools"
                      :key="tool.type"
                      :type="activeEditorTool === tool.type ? 'primary' : 'default'"
                      @click="activeEditorTool = tool.type"
                    >
                      <el-icon>
                        <component :is="tool.icon" />
                      </el-icon>
                      {{ tool.name }}
                    </el-button>
                  </el-button-group>
                  <div class="editor-actions">
                    <el-button @click="saveChapterContent(chapter)">
                      <el-icon><Check /></el-icon>
                      保存
                    </el-button>
                    <el-button @click="previewChapter(chapter)">
                      <el-icon><View /></el-icon>
                      预览
                    </el-button>
                  </div>
                </div>

                <div class="editor-content">
                  <!-- 知识内容编辑器 -->
                  <div v-if="activeEditorTool === 'knowledge'" class="knowledge-editor">
                    <div class="section-title">概念定义</div>
                    <div class="concepts-list">
                      <div
                        v-for="(concept, idx) in chapter.content?.knowledge?.concepts || []"
                        :key="idx"
                        class="concept-item"
                      >
                        <el-input
                          v-model="concept.name"
                          placeholder="概念名称"
                          class="concept-name"
                        />
                        <el-input
                          v-model="concept.definition"
                          type="textarea"
                          placeholder="概念定义"
                          :rows="2"
                        />
                        <el-button size="small" type="danger" @click="removeConcept(chapter, idx)">
                          删除
                        </el-button>
                      </div>
                      <el-button size="small" @click="addConcept(chapter)">
                        <el-icon><Plus /></el-icon>
                        添加概念
                      </el-button>
                    </div>

                    <div class="section-title">示例</div>
                    <div class="examples-list">
                      <div
                        v-for="(example, idx) in chapter.content?.knowledge?.examples || []"
                        :key="idx"
                        class="example-item"
                      >
                        <el-input
                          v-model="example.title"
                          placeholder="示例标题"
                          class="example-title"
                        />
                        <el-input
                          v-model="example.description"
                          type="textarea"
                          placeholder="示例描述"
                          :rows="3"
                        />
                        <div class="example-media">
                          <el-select v-model="example.type" size="small">
                            <el-option label="文本" value="text" />
                            <el-option label="图片" value="image" />
                            <el-option label="视频" value="video" />
                            <el-option label="音频" value="audio" />
                          </el-select>
                          <el-input
                            v-if="example.type !== 'text'"
                            v-model="example.mediaUrl"
                            placeholder="媒体URL"
                            size="small"
                          />
                        </div>
                      </div>
                      <el-button size="small" @click="addExample(chapter)">
                        <el-icon><Plus /></el-icon>
                        添加示例
                      </el-button>
                    </div>
                  </div>

                  <!-- 实验配置 -->
                  <div v-else-if="activeEditorTool === 'experiment'" class="experiment-editor">
                    <div class="experiment-type-selector">
                      <el-radio-group v-model="chapter.experimentType" @change="handleExperimentTypeChange">
                        <el-radio-button label="jupyter">Jupyter Notebook</el-radio-button>
                        <el-radio-button label="ai-generated">AI生成实验</el-radio-button>
                        <el-radio-button label="uploaded">上传文件</el-radio-button>
                      </el-radio-group>
                    </div>

                    <div v-if="chapter.experimentType === 'jupyter'" class="jupyter-config">
                      <div class="section-title">Jupyter环境配置</div>
                      <el-form :model="chapter.experimentConfig" label-width="120px">
                        <el-form-item label="镜像版本">
                          <el-select v-model="chapter.experimentConfig.image">
                            <el-option
                              v-for="image in jupyterImages"
                              :key="image.value"
                              :label="image.label"
                              :value="image.value"
                            />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="Python包">
                          <el-select
                            v-model="chapter.experimentConfig.packages"
                            multiple
                            filterable
                            allow-create
                            placeholder="选择或输入Python包"
                          >
                            <el-option
                              v-for="pkg in commonPackages"
                              :key="pkg"
                              :label="pkg"
                              :value="pkg"
                            />
                          </el-select>
                        </el-form-item>
                        <el-form-item label="资源配置">
                          <el-row :gutter="16">
                            <el-col :span="8">
                              <el-input-number
                                v-model="chapter.experimentConfig.resources.cpu"
                                :min="0.5"
                                :max="8"
                                :step="0.5"
                                controls-position="right"
                              />
                              <span class="resource-label">CPU核</span>
                            </el-col>
                            <el-col :span="8">
                              <el-input-number
                                v-model="chapter.experimentConfig.resources.memory"
                                :min="1"
                                :max="32"
                                controls-position="right"
                              />
                              <span class="resource-label">GB内存</span>
                            </el-col>
                            <el-col :span="8">
                              <el-input-number
                                v-model="chapter.experimentConfig.resources.storage"
                                :min="1"
                                :max="100"
                                controls-position="right"
                              />
                              <span class="resource-label">GB存储</span>
                            </el-col>
                          </el-row>
                        </el-form-item>
                      </el-form>
                    </div>

                    <div v-else-if="chapter.experimentType === 'ai-generated'" class="ai-experiment">
                      <div class="ai-prompt-section">
                        <div class="section-title">AI实验生成</div>
                        <el-input
                          v-model="chapter.aiExperimentPrompt"
                          type="textarea"
                          :rows="4"
                          placeholder="描述您想要生成的实验内容，例如：创建一个物理实验，展示牛顿第二定律..."
                        />
                        <div class="ai-options">
                          <el-checkbox v-model="chapter.aiIncludeCode">包含代码示例</el-checkbox>
                          <el-checkbox v-model="chapter.aiIncludeData">包含示例数据</el-checkbox>
                          <el-checkbox v-model="chapter.aiIncludeQuestions">包含思考题</el-checkbox>
                        </div>
                        <el-button type="primary" @click="generateAIExperiment(chapter)">
                          <el-icon><MagicStick /></el-icon>
                          生成实验
                        </el-button>
                      </div>
                    </div>

                    <div v-else-if="chapter.experimentType === 'uploaded'" class="uploaded-experiment">
                      <div class="upload-section">
                        <div class="section-title">上传实验文件</div>
                        <el-upload
                          drag
                          multiple
                          :file-list="chapter.uploadedFiles"
                          :before-upload="beforeExperimentUpload"
                          :http-request="handleExperimentUpload"
                          :on-change="handleExperimentFileChange"
                        >
                          <el-icon class="el-icon--upload"><Upload /></el-icon>
                          <div class="el-upload__text">
                            将文件拖到此处，或<em>点击上传</em>
                          </div>
                          <template #tip>
                            <div class="el-upload__tip">
                              支持 .ipynb, .py, .json, .csv 等格式文件
                            </div>
                          </template>
                        </el-upload>
                      </div>
                    </div>
                  </div>

                  <!-- 互动体验 -->
                  <div v-else-if="activeEditorTool === 'interactive'" class="interactive-editor">
                    <div class="upload-interactive">
                      <div class="section-title">互动体验上传</div>
                      <el-upload
                        drag
                        accept=".html,.css,.js,.zip"
                        :before-upload="beforeInteractiveUpload"
                        :http-request="handleInteractiveUpload"
                        :on-change="handleInteractiveFileChange"
                      >
                        <el-icon class="el-icon--upload"><Upload /></el-icon>
                        <div class="el-upload__text">
                          上传HTML文件或包含HTML/CSS/JS的ZIP包
                        </div>
                        <template #tip>
                          <div class="el-upload__tip">
                            支持 .html 单文件或 .zip 压缩包
                          </div>
                        </template>
                      </el-upload>

                      <div v-if="chapter.interactiveFiles?.length" class="interactive-preview">
                        <div class="section-title">预览设置</div>
                        <el-form :model="chapter.interactiveSettings" label-width="120px">
                          <el-form-item label="全屏模式">
                            <el-switch v-model="chapter.interactiveSettings.fullscreen" />
                          </el-form-item>
                          <el-form-item label="响应式">
                            <el-switch v-model="chapter.interactiveSettings.responsive" />
                          </el-form-item>
                          <el-form-item label="允许调整大小">
                            <el-switch v-model="chapter.interactiveSettings.allowResize" />
                          </el-form-item>
                        </el-form>
                        <div class="preview-actions">
                          <el-button type="primary" @click="previewInteractive(chapter)">
                            <el-icon><View /></el-icon>
                            预览互动内容
                          </el-button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 评估设计 -->
                  <div v-else-if="activeEditorTool === 'assessment'" class="assessment-editor">
                    <div class="assessment-type">
                      <div class="section-title">评估类型</div>
                      <el-radio-group v-model="chapter.assessmentType">
                        <el-radio-button label="quiz">随堂测验</el-radio-button>
                        <el-radio-button label="assignment">课后作业</el-radio-button>
                        <el-radio-button label="project">项目实践</el-radio-button>
                      </el-radio-group>
                    </div>

                    <div class="questions-section" v-if="chapter.assessmentType === 'quiz'">
                      <div class="section-title">题目设计</div>
                      <div class="questions-list">
                        <div
                          v-for="(question, idx) in chapter.questions || []"
                          :key="idx"
                          class="question-item"
                        >
                          <div class="question-header">
                            <span class="question-number">题目 {{ idx + 1 }}</span>
                            <el-select v-model="question.type" size="small">
                              <el-option label="单选题" value="choice" />
                              <el-option label="多选题" value="multiple" />
                              <el-option label="填空题" value="text" />
                              <el-option label="问答题" value="essay" />
                            </el-select>
                            <el-button size="small" type="danger" @click="removeQuestion(chapter, idx)">
                              删除
                            </el-button>
                          </div>
                          <el-input
                            v-model="question.question"
                            type="textarea"
                            placeholder="题目内容"
                            :rows="2"
                          />
                          <div v-if="question.type === 'choice' || question.type === 'multiple'" class="options-section">
                            <div
                              v-for="(option, optIdx) in question.options || []"
                              :key="optIdx"
                              class="option-item"
                            >
                              <el-input
                                v-model="question.options[optIdx]"
                                :placeholder="`选项 ${optIdx + 1}`"
                                size="small"
                              />
                              <el-button
                                v-if="question.type === 'choice'"
                                size="small"
                                :type="question.correctAnswer === optIdx ? 'primary' : 'default'"
                                @click="question.correctAnswer = optIdx"
                              >
                                正确答案
                              </el-button>
                              <el-button size="small" type="danger" @click="removeOption(question, optIdx)">
                                删除
                              </el-button>
                            </div>
                            <el-button size="small" @click="addOption(question)">
                              <el-icon><Plus /></el-icon>
                              添加选项
                            </el-button>
                          </div>
                        </div>
                        <el-button size="small" @click="addQuestion(chapter)">
                          <el-icon><Plus /></el-icon>
                          添加题目
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 步骤4: 预览和发布 -->
      <div v-if="currentStep === 3" class="wizard-step">
        <div class="step-header">
          <h3>课程预览和发布</h3>
          <p>检查课程设置并发布课程</p>
        </div>

        <div class="preview-section">
          <div class="preview-toolbar">
            <el-button-group>
              <el-button
                v-for="view in previewViews"
                :key="view.type"
                :type="activePreviewView === view.type ? 'primary' : 'default'"
                @click="activePreviewView = view.type"
              >
                <el-icon>
                  <component :is="view.icon" />
                </el-icon>
                {{ view.name }}
              </el-button>
            </el-button-group>
            <div class="preview-actions">
              <el-button @click="exportCourse">
                <el-icon><Download /></el-icon>
                导出课程
              </el-button>
              <el-button @click="saveAsDraft">
                <el-icon><Document /></el-icon>
                保存草稿
              </el-button>
            </div>
          </div>

          <div class="preview-content">
            <!-- 课程信息预览 -->
            <div v-if="activePreviewView === 'info'" class="course-preview-info">
              <div class="preview-card">
                <div class="card-header">
                  <img v-if="courseForm.info.coverImage" :src="courseForm.info.coverImage" class="cover-image" />
                  <div class="header-info">
                    <h2>{{ courseForm.info.title }}</h2>
                    <p>{{ courseForm.info.description }}</p>
                    <div class="meta-info">
                      <el-tag>{{ getSubjectLabel(courseForm.info.subject) }}</el-tag>
                      <el-tag type="success">{{ courseForm.info.grade }}</el-tag>
                      <el-tag type="warning">{{ courseForm.info.duration }}课时</el-tag>
                      <el-tag type="info">{{ getDifficultyLabel(courseForm.info.difficulty) }}</el-tag>
                    </div>
                  </div>
                </div>
                <div class="card-content">
                  <h3>课程标签</h3>
                  <div class="tags-list">
                    <el-tag
                      v-for="tag in courseForm.info.tags"
                      :key="tag"
                      class="tag-item"
                    >
                      {{ tag }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>

            <!-- 章节结构预览 -->
            <div v-else-if="activePreviewView === 'structure'" class="course-preview-structure">
              <div class="timeline">
                <div
                  v-for="(chapter, index) in courseForm.chapters"
                  :key="chapter.id"
                  class="timeline-item"
                >
                  <div class="timeline-marker">
                    <div class="marker-dot" :class="`marker-${chapter.type}`"></div>
                    <div class="marker-line" v-if="index < courseForm.chapters.length - 1"></div>
                  </div>
                  <div class="timeline-content">
                    <div class="chapter-preview-card">
                      <div class="card-header">
                        <h4>第{{ index + 1 }}章 {{ chapter.title }}</h4>
                        <div class="chapter-meta">
                          <el-tag :type="getChapterTypeColor(chapter.type)">
                            {{ getChapterTypeLabel(chapter.type) }}
                          </el-tag>
                          <span class="duration">{{ chapter.duration }}分钟</span>
                          <el-tag v-if="chapter.aiEnhanced" type="success" size="small">
                            <el-icon><MagicStick /></el-icon>
                            AI增强
                          </el-tag>
                        </div>
                      </div>
                      <p>{{ chapter.description }}</p>
                      <div v-if="chapter.objectives?.length" class="objectives">
                        <strong>学习目标：</strong>
                        <ul>
                          <li v-for="objective in chapter.objectives" :key="objective">{{ objective }}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 完整预览 -->
            <div v-else-if="activePreviewView === 'full'" class="course-preview-full">
              <div class="preview-container">
                <div class="preview-header">
                  <h2>{{ courseForm.info.title }}</h2>
                  <div class="preview-nav">
                    <el-button-group>
                      <el-button
                        v-for="(chapter, index) in courseForm.chapters"
                        :key="chapter.id"
                        size="small"
                        :type="currentPreviewChapter === index ? 'primary' : 'default'"
                        @click="currentPreviewChapter = index"
                      >
                        {{ index + 1 }}
                      </el-button>
                    </el-button-group>
                  </div>
                </div>
                <div class="preview-body">
                  <div v-if="currentChapter" class="chapter-content-preview">
                    <h3>{{ currentChapter.title }}</h3>
                    <p>{{ currentChapter.description }}</p>
                    <!-- 这里可以根据章节类型显示不同的内容预览 -->
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 发布设置 -->
        <div class="publish-settings">
          <h3>发布设置</h3>
          <el-form :model="courseForm.settings" label-width="120px">
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="课程状态">
                  <el-radio-group v-model="publishStatus">
                    <el-radio-button label="draft">保存草稿</el-radio-button>
                    <el-radio-button label="published">立即发布</el-radio-button>
                    <el-radio-button label="scheduled">定时发布</el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="可见性">
                  <el-radio-group v-model="courseForm.settings.publicAccess">
                    <el-radio-button label="true">公开</el-radio-button>
                    <el-radio-button label="false">私有</el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="AI功能">
                  <el-switch
                    v-model="courseForm.settings.aiEnabled"
                    active-text="启用"
                    inactive-text="禁用"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="下载权限">
                  <el-switch
                    v-model="courseForm.settings.allowDownload"
                    active-text="允许"
                    inactive-text="禁止"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="目标班级">
              <el-select
                v-model="targetClasses"
                multiple
                placeholder="选择目标班级"
                style="width: 100%"
              >
                <el-option
                  v-for="cls in availableClasses"
                  :key="cls.id"
                  :label="cls.name"
                  :value="cls.id"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 右侧步骤导航栏 -->
      <div class="wizard-sidebar">
        <div class="sidebar-content">
          <div class="progress-indicator">
            <h4>课程创建进度</h4>
            <div class="progress-circle">
              <el-progress
                type="circle"
                :percentage="Math.round((currentStep + 1) / steps.length * 100)"
                :width="80"
                :stroke-width="6"
                color="#5B8FF9"
              >
                <template #default="{ percentage }">
                  <span class="progress-text">{{ currentStep + 1 }}/{{ steps.length }}</span>
                </template>
              </el-progress>
            </div>
            <p class="progress-description">{{ steps[currentStep].title }}</p>
          </div>

          <!-- 步骤列表 -->
          <div class="steps-list">
            <h4>所有步骤</h4>
            <div
              v-for="(step, index) in steps"
              :key="index"
              class="step-item"
              :class="{
                'step-item--active': index === currentStep,
                'step-item--completed': index < currentStep,
                'step-item--upcoming': index > currentStep
              }"
              @click="goToStep(index)"
            >
              <div class="step-icon">
                <el-icon v-if="index < currentStep"><Check /></el-icon>
                <span v-else>{{ index + 1 }}</span>
              </div>
              <div class="step-info">
                <div class="step-title">{{ step.title }}</div>
                <div class="step-desc">{{ step.description }}</div>
              </div>
            </div>
          </div>

          <!-- AI 建议折叠面板 -->
          <div class="ai-suggestions">
            <el-collapse v-model="aiExpanded">
              <el-collapse-item name="ai" class="ai-collapse">
                <template #title>
                  <div class="ai-title">
                    <el-icon><MagicStick /></el-icon>
                    AI 智能建议
                  </div>
                </template>
                <div class="ai-content">
                  <div class="ai-tip">
                    <el-icon><Star /></el-icon>
                    <span>基于您的学科选择，建议添加实践性实验</span>
                  </div>
                  <div class="ai-tip">
                    <el-icon><TrendCharts /></el-icon>
                    <span>推荐加入互动内容提升学习效果</span>
                  </div>
                  <el-button type="text" size="small" @click="showEnhancedWizard">
                    查看详细建议 →
                  </el-button>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>

          <!-- 快速保存 -->
          <div class="quick-save">
            <el-button
              type="default"
              size="small"
              style="width: 100%"
              @click="saveDraft"
              :loading="saving"
            >
              <el-icon><Document /></el-icon>
              保存草稿
            </el-button>
            <div v-if="lastSaved" class="last-saved">
              上次保存: {{ formatTime(lastSaved) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 向导操作按钮 -->
    <div class="wizard-actions">
      <el-button v-if="currentStep > 0" @click="previousStep">
        <el-icon><ArrowLeft /></el-icon>
        上一步
      </el-button>
      <el-button
        v-if="currentStep < steps.length - 1"
        type="primary"
        @click="nextStepWithAutoSave"
      >
        下一步
        <el-icon><ArrowRight /></el-icon>
      </el-button>
      <el-button
        v-else
        type="primary"
        size="large"
        :loading="publishing"
        @click="publishCourse"
      >
        <el-icon><Check /></el-icon>
        {{ isEditing ? '更新课程' : '发布课程' }}
      </el-button>
    </div>

    <!-- 课程创建完成状态 -->
    <div v-if="courseCompleted" class="completion-modal">
      <div class="completion-content">
        <div class="completion-header">
          <div class="success-icon">
            <el-icon><SuccessFilled /></el-icon>
          </div>
          <h3>课程创建成功！</h3>
          <p>您的课程"{{ courseForm.info.title }}"已成功创建</p>
        </div>

        <div class="completion-actions">
          <el-button type="primary" size="large" @click="goToCourseDetail">
            <el-icon><View /></el-icon>
            前往课程详情
          </el-button>
          <el-button size="large" @click="assignToClass">
            <el-icon><User /></el-icon>
            分配班级
          </el-button>
          <el-button type="default" size="large" @click="createAnother">
            <el-icon><Plus /></el-icon>
            继续创建
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Document, Plus, MagicStick, Upload, Delete, Operation, Check, View,
  Download, ArrowLeft, ArrowRight, Collection
} from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
import type { Course, CourseSubject, AICourseSuggestion, MultiSubjectTemplate } from '@/types/course'
import { subjects, grades, suggestedTags, jupyterImages, commonPackages } from '@/config/courseData'
import EnhancedCourseWizard from '@/components/ai/EnhancedCourseWizard.vue'

interface Props {
  courseId?: string
}

const props = defineProps<Props>()
const router = useRouter()

// 向导步骤
const steps = [
  { title: '基本信息', description: '设置课程基本信息' },
  { title: '章节结构', description: '设计课程章节安排' },
  { title: '内容设计', description: '编辑章节具体内容' },
  { title: '预览发布', description: '预览并发布课程' }
]

// 响应式数据
const currentStep = ref(0)
const isEditing = ref(!!props.courseId)
const publishing = ref(false)
const activeChapterTab = ref('')
const activeEditorTool = ref('knowledge')
const activePreviewView = ref('info')
const currentPreviewChapter = ref(0)
const publishStatus = ref('draft')
const targetClasses = ref<string[]>([])

// 新增状态管理
const courseCompleted = ref(false)
const saving = ref(false)
const lastSaved = ref<Date | null>(null)
const aiExpanded = ref([])
const autoSaveTimer = ref<NodeJS.Timeout | null>(null)

// 表单数据
const courseForm = ref<Course>({
  info: {
    id: '',
    title: '',
    description: '',
    subject: 'math' as CourseSubject,
    grade: '',
    duration: 1,
    difficulty: 'beginner',
    tags: [],
    coverImage: '',
    createdBy: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'draft',
    version: '1.0.0'
  },
  chapters: [],
  settings: {
    aiEnabled: true,
    autoSave: true,
    collaboration: false,
    publicAccess: false,
    allowDownload: false,
    certificateEnabled: false,
    customization: {
      theme: 'default',
      branding: false
    }
  }
})

// AI建议
const aiSuggestions = ref<AICourseSuggestion[]>([])

// 多学科模板相关
const showMultiSubjectMode = ref(false)
const showEnhancedWizard = ref(false)
const currentMultiSubjectTemplate = ref<MultiSubjectTemplate | null>(null)

// 可用班级
const availableClasses = ref([
  { id: 'class1', name: '高一1班' },
  { id: 'class2', name: '高一2班' },
  { id: 'class3', name: '高一3班' }
])

// 编辑器工具
const editorTools = [
  { type: 'knowledge', name: '知识内容', icon: 'Document' },
  { type: 'experiment', name: '实验配置', icon: 'Operation' },
  { type: 'interactive', name: '互动体验', icon: 'Monitor' },
  { type: 'assessment', name: '评估设计', icon: 'EditPen' }
]

// 预览视图
const previewViews = [
  { type: 'info', name: '基本信息', icon: 'InfoFilled' },
  { type: 'structure', name: '章节结构', icon: 'List' },
  { type: 'full', name: '完整预览', icon: 'View' }
]

// 计算属性
const currentChapter = computed(() => {
  if (currentPreviewChapter.value >= 0 && currentPreviewChapter.value < courseForm.value.chapters.length) {
    return courseForm.value.chapters[currentPreviewChapter.value]
  }
  return null
})

// 表单验证规则
const basicInfoRules = {
  title: [
    { required: true, message: '请输入课程标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在2到100个字符之间', trigger: 'blur' }
  ],
  subject: [
    { required: true, message: '请选择学科', trigger: 'change' }
  ],
  grade: [
    { required: true, message: '请选择年级', trigger: 'change' }
  ],
  duration: [
    { required: true, message: '请输入课时', trigger: 'blur' },
    { type: 'number', min: 1, max: 200, message: '课时在1到200之间', trigger: 'blur' }
  ],
  difficulty: [
    { required: true, message: '请选择难度等级', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入课程描述', trigger: 'blur' },
    { min: 10, max: 500, message: '描述长度在10到500个字符之间', trigger: 'blur' }
  ]
}

// 方法
const generateCourseId = () => {
  return `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const beforeCoverUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('上传图片只能是JPG/PNG格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过2MB!')
    return false
  }
  return false // 阻止自动上传
}

const handleCoverUpload = async (options: any) => {
  const file = options.file
  // 这里实现文件上传逻辑
  const formData = new FormData()
  formData.append('file', file)

  try {
    // 模拟上传
    await new Promise(resolve => setTimeout(resolve, 1000))
    const imageUrl = URL.createObjectURL(file)
    courseForm.value.info.coverImage = imageUrl
    ElMessage.success('封面上传成功')
  } catch (error) {
    ElMessage.error('封面上传失败')
  }
}

const generateAISuggestions = async () => {
  try {
    // 模拟AI建议生成
    await new Promise(resolve => setTimeout(resolve, 1500))

    aiSuggestions.value = [
      {
        title: '高中物理力学基础',
        description: '从牛顿运动定律开始，通过实验和互动体验深入理解力学原理',
        targetAudience: '高一学生、物理入门',
        learningObjectives: ['掌握牛顿三定律', '理解力的概念', '能够解决基本力学问题'],
        suggestedChapters: [
          { title: '力的概念', duration: 45, content: '介绍力的定义和分类', type: 'content' },
          { title: '牛顿第一定律', duration: 30, content: '惯性定律的理解与应用', type: 'content' },
          { title: '力学实验', duration: 60, content: '通过实验验证定律', type: 'experiment' }
        ],
        recommendedResources: [
          { type: 'video', title: '物理学史', description: '了解牛顿发现定律的历史' },
          { type: 'simulation', title: '力学模拟器', description: '交互式力学实验' }
        ]
      },
      {
        title: '数学函数探索',
        description: '通过可视化和实践，深入理解函数的概念和应用',
        targetAudience: '高一学生、数学学习',
        learningObjectives: ['理解函数概念', '掌握常见函数类型', '能够分析函数图像'],
        suggestedChapters: [
          { title: '函数的定义', duration: 40, content: '什么是函数', type: 'content' },
          { title: '函数图像', duration: 50, content: '绘制和分析函数图像', type: 'interactive' },
          { title: '函数应用', duration: 45, content: '实际问题中的函数', type: 'assessment' }
        ],
        recommendedResources: [
          { type: 'tool', title: '函数绘图工具', description: '在线函数图像绘制' },
          { type: 'exercise', title: '函数练习题', description: '巩固函数概念' }
        ]
      }
    ]

    ElMessage.success('AI建议生成成功')
  } catch (error) {
    ElMessage.error('AI建议生成失败')
  }
}

const applySuggestion = (suggestion: AICourseSuggestion) => {
  courseForm.value.info.title = suggestion.title
  courseForm.value.info.description = suggestion.description
  courseForm.value.info.tags = suggestion.targetAudience.split('、')

  // 根据建议生成章节
  courseForm.value.chapters = suggestion.suggestedChapters.map((chapter, index) => ({
    id: `chapter_${index}`,
    order: index,
    title: chapter.title,
    description: chapter.content,
    type: chapter.type,
    duration: chapter.duration,
    objectives: suggestion.learningObjectives,
    aiEnhanced: true
  }))

  ElMessage.success('已应用AI建议')
}

// 多学科模板相关方法
const toggleMultiSubjectMode = () => {
  showMultiSubjectMode.value = !showMultiSubjectMode.value
  if (showMultiSubjectMode.value) {
    showEnhancedWizard.value = true
  } else {
    showEnhancedWizard.value = false
  }
}

const onMultiSubjectTemplateApplied = (template: MultiSubjectTemplate) => {
  // 将多学科模板应用到课程表单
  currentMultiSubjectTemplate.value = template

  // 更新课程基本信息
  courseForm.value.info.title = template.title
  courseForm.value.info.description = template.description
  courseForm.value.info.subject = template.primarySubject
  courseForm.value.info.duration = template.duration
  courseForm.value.info.difficulty = template.difficulty
  courseForm.value.info.tags = template.tags

  // 转换多学科章节数据
  courseForm.value.chapters = template.chapters.map(chapter => ({
    id: chapter.id,
    title: chapter.title,
    description: chapter.description,
    type: chapter.type,
    duration: Math.ceil(chapter.duration / 60), // 转换为小时
    objectives: chapter.objectives.map(obj => obj.title),
    aiEnhanced: true,
    resources: [],
    assignments: []
  }))

  // 添加协作计划和评估策略信息
  if (template.collaborationPlan) {
    courseForm.value.info.tags.push('协作学习')
  }

  ElMessage.success('多学科模板应用成功')
  showMultiSubjectMode.value = false
  showEnhancedWizard.value = false

  // 自动跳转到下一步
  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

const onTemplateSaved = (template: MultiSubjectTemplate) => {
  ElMessage.success('模板保存成功')
}

const addChapter = () => {
  const newChapter = {
    id: `chapter_${Date.now()}`,
    order: courseForm.value.chapters.length,
    title: '',
    description: '',
    type: 'content' as const,
    duration: 45,
    objectives: [],
    aiEnhanced: false,
    content: {},
    experimentType: 'jupyter',
    experimentConfig: {
      image: 'jupyter/scipy-notebook:latest',
      packages: ['numpy', 'pandas', 'matplotlib'],
      resources: {
        cpu: 1,
        memory: 2,
        storage: 5
      }
    },
    interactiveFiles: [],
    interactiveSettings: {
      fullscreen: true,
      responsive: true,
      allowResize: true
    }
  }

  courseForm.value.chapters.push(newChapter)
  activeChapterTab.value = newChapter.id
}

const removeChapter = (index: number) => {
  courseForm.value.chapters.splice(index, 1)
}

const handleChapterReorder = () => {
  courseForm.value.chapters.forEach((chapter, index) => {
    chapter.order = index
  })
}

const nextStep = async () => {
  if (currentStep.value === 0) {
    // 验证基本信息
    try {
      await (basicInfoRef as any).value.validate()
    } catch (error) {
      ElMessage.error('请完善基本信息')
      return
    }
  }

  if (currentStep.value < steps.length - 1) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const publishCourse = async () => {
  try {
    publishing.value = true

    // 验证所有必填信息
    if (!courseForm.value.info.title || !courseForm.value.chapters.length) {
      ElMessage.error('请完善课程信息并添加至少一个章节')
      return
    }

    // 模拟发布过程
    await new Promise(resolve => setTimeout(resolve, 2000))

    courseForm.value.info.id = courseForm.value.info.id || generateCourseId()
    courseForm.value.info.status = publishStatus.value === 'published' ? 'published' : 'draft'
    courseForm.value.info.updatedAt = new Date()

    ElMessage.success(`课程${publishStatus.value === 'published' ? '发布' : '保存'}成功！`)

    // 跳转到课程详情页
    router.push(`/courses/${courseForm.value.info.id}`)
  } catch (error) {
    ElMessage.error('发布失败，请重试')
  } finally {
    publishing.value = false
  }
}

// 工具方法
const getSubjectLabel = (subject: CourseSubject) => {
  const subjectMap = {
    chinese: '语文',
    math: '数学',
    english: '英语',
    physics: '物理',
    chemistry: '化学',
    biology: '生物',
    history: '历史',
    geography: '地理',
    politics: '政治',
    art: '艺术',
    music: '音乐',
    pe: '体育',
    it: '信息技术',
    comprehensive: '综合实践'
  }
  return subjectMap[subject] || subject
}

const getDifficultyLabel = (difficulty: string) => {
  const labels = {
    beginner: '入门',
    intermediate: '进阶',
    advanced: '高级'
  }
  return labels[difficulty as keyof typeof labels] || difficulty
}

const getChapterTypeLabel = (type: string) => {
  const labels = {
    introduction: '课程引入',
    knowledge: '新知讲解',
    experience: '体验理解',
    experiment: '实验活动',
    assignment: '作业测试'
  }
  return labels[type as keyof typeof labels] || type
}

const getChapterTypeColor = (type: string) => {
  const colors = {
    introduction: 'info',
    knowledge: '',
    experience: 'warning',
    experiment: 'success',
    assignment: 'danger'
  }
  return colors[type as keyof typeof colors] || ''
}

// 新增方法
const goToStep = (stepIndex: number) => {
  if (stepIndex >= 0 && stepIndex < steps.length) {
    // 保存当前步骤的进度
    saveCurrentStepProgress()
    currentStep.value = stepIndex
  }
}

const saveDraft = async () => {
  try {
    saving.value = true
    // 模拟保存草稿API调用
    await new Promise(resolve => setTimeout(resolve, 1000))

    lastSaved.value = new Date()
    ElMessage.success({ message: '草稿保存成功' })
  } catch (error) {
    console.error('保存草稿失败:', error)
    ElMessage.error({ message: '保存草稿失败' })
  } finally {
    saving.value = false
  }
}

const saveCurrentStepProgress = () => {
  // 自动保存当前步骤进度
  localStorage.setItem('course-wizard-progress', JSON.stringify({
    currentStep: currentStep.value,
    formData: courseForm.value,
    timestamp: Date.now()
  }))
}

const autoSave = () => {
  if (autoSaveTimer.value) {
    clearTimeout(autoSaveTimer.value)
  }

  autoSaveTimer.value = setTimeout(() => {
    saveDraft()
  }, 5000) // 5秒后自动保存
}

const formatTime = (date: Date): string => {
  return new Date(date).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const showEnhancedWizardAction = () => {
  ElMessage.info({ message: 'AI增强向导功能开发中' })
}

// 完成状态相关方法
const goToCourseDetail = () => {
  if (courseForm.value.info.id) {
    router.push(`/courses/${courseForm.value.info.id}`)
  }
}

const assignToClass = () => {
  ElMessage.info({ message: '班级分配功能开发中' })
}

const createAnother = () => {
  // 重置表单
  courseForm.value = {
    info: {
      id: '',
      title: '',
      description: '',
      subject: 'math' as CourseSubject,
      grade: '',
      duration: 1,
      difficulty: 'beginner',
      coverImage: '',
      tags: [],
      objectives: [],
      prerequisites: []
    },
    chapters: [],
    assessments: [],
    resources: [],
    settings: {
      allowDownload: true,
      allowComment: true,
      requireApproval: false
    }
  }

  currentStep.value = 0
  courseCompleted.value = false
  lastSaved.value = null
}

// 配置实验方法
const configureExperiment = async (chapter: any) => {
  try {
    // 打开实验配置对话框
    ElMessageBox.prompt(
      '请输入实验名称和描述',
      `配置实验 - ${chapter.title}`,
      {
        confirmButtonText: '配置实验',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '描述实验目标、步骤和预期结果...',
        inputValidator: (value) => {
          if (!value || value.trim().length < 10) {
            return '实验描述至少需要10个字符'
          }
          return true
        }
      }
    ).then(({ value }) => {
      if (value) {
        // 保存实验配置
        chapter.experimentConfig = {
          name: chapter.title,
          description: value,
          type: 'virtual_lab',
          tools: ['Jupyter', 'Python', '数据分析工具'],
          duration: 45, // 分钟
          objectives: ['掌握核心概念', '完成实践操作', '分析实验结果'],
          resources: [],
          createdAt: new Date().toISOString()
        }

        chapter.configured = true
        ElMessage.success('实验配置已保存')
      }
    })
  } catch (error) {
    console.error('配置实验失败:', error)
    ElMessage.error('配置实验失败')
  }
}

// 上传互动内容方法
const uploadInteractive = async (chapter: any) => {
  try {
    // 创建隐藏的文件输入
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = '.html,.zip,.json'

    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files
      if (!files || files.length === 0) return

      const uploadedFiles = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // 模拟上传过程
        await new Promise(resolve => setTimeout(resolve, 1000))

        uploadedFiles.push({
          id: `file_${Date.now()}_${i}`,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          url: `/uploads/interactive/${file.name}`, // 模拟URL
          status: 'uploaded'
        })
      }

      // 保存到章节配置
      chapter.interactiveContent = {
        files: uploadedFiles,
        title: `${chapter.title} - 互动内容`,
        type: 'html_package',
        status: 'ready',
        uploadedAt: new Date().toISOString()
      }

      chapter.hasInteractive = true
      ElMessage.success(`成功上传 ${uploadedFiles.length} 个文件`)
    }

    input.click()
  } catch (error) {
    console.error('上传互动内容失败:', error)
    ElMessage.error('上传互动内容失败')
  }
}

// 切换AI增强方法
const toggleAIEnhancement = (chapter: any) => {
  chapter.aiEnhanced = !chapter.aiEnhanced

  if (chapter.aiEnhanced) {
    // 启用AI增强功能
    chapter.aiFeatures = {
      autoGenerateQuestions: true,
      adaptiveContent: true,
      realTimeFeedback: true,
      personalizedPath: true,
      smartHints: true
    }

    // 生成AI增强建议
    setTimeout(() => {
      chapter.aiSuggestions = [
        {
          type: 'engagement',
          content: '建议在此环节添加互动问答，提高学生参与度',
          priority: 'high'
        },
        {
          type: 'assessment',
          content: '可以设置一个快速检查点，了解学生理解程度',
          priority: 'medium'
        },
        {
          type: 'personalization',
          content: '根据学生水平提供不同难度的内容',
          priority: 'low'
        }
      ]
    }, 1500)

    ElMessage.success('AI增强功能已启用')
  } else {
    // 禁用AI增强功能
    delete chapter.aiFeatures
    delete chapter.aiSuggestions
    ElMessage.info('AI增强功能已关闭')
  }
}

// 更新发布课程方法
const publishCourseUpdate = async () => {
  try {
    publishing.value = true

    // 模拟发布API调用
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 生成课程ID
    courseForm.value.info.id = `course_${Date.now()}`

    // 显示完成状态
    courseCompleted.value = true

    ElMessage.success({ message: '课程发布成功！' })

    // 清除自动保存定时器
    if (autoSaveTimer.value) {
      clearTimeout(autoSaveTimer.value)
    }

  } catch (error) {
    console.error('发布课程失败:', error)
    ElMessage.error({ message: '发布课程失败' })
  } finally {
    publishing.value = false
  }
}

// 更新nextStep方法以支持自动保存
const nextStepWithAutoSave = () => {
  if (currentStep.value < steps.length - 1) {
    saveCurrentStepProgress()
    currentStep.value++
    autoSave() // 设置自动保存
  }
}

// 生命周期
onMounted(() => {
  if (props.courseId) {
    // 加载现有课程数据
    console.log('Loading course:', props.courseId)
  }

  // 如果有章节，设置第一个为激活状态
  if (courseForm.value.chapters.length > 0) {
    activeChapterTab.value = courseForm.value.chapters[0].id
  }
})
</script>

<style lang="scss" scoped>
.course-wizard {
  max-width: 1400px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.wizard-header {
  margin-bottom: var(--spacing-xl);
}

.wizard-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--edu-text-primary);
  margin-bottom: var(--spacing-lg);
}

.wizard-progress {
  margin-bottom: var(--spacing-lg);
}

.wizard-layout {
  display: flex;
  gap: var(--spacing-lg);
  align-items: flex-start;
}

.wizard-content {
  flex: 1;
  background: var(--edu-bg-primary);
  border-radius: var(--edu-radius-lg);
  box-shadow: var(--edu-shadow-sm);
  border: 1px solid var(--edu-border-light);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.wizard-sidebar {
  width: 320px;
  position: sticky;
  top: var(--spacing-lg);
  background: var(--edu-bg-primary);
  border-radius: var(--edu-radius-lg);
  box-shadow: var(--edu-shadow-sm);
  padding: var(--spacing-lg);
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.sidebar-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.progress-indicator {
  text-align: center;

  h4 {
    margin-bottom: var(--spacing-md);
    color: var(--edu-text-primary);
    font-weight: var(--font-weight-semibold);
  }

  .progress-circle {
    margin-bottom: var(--spacing-md);
  }

  .progress-text {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
  }

  .progress-description {
    color: var(--edu-text-secondary);
    font-size: var(--font-size-sm);
    margin: 0;
  }
}

.steps-list {
  h4 {
    margin-bottom: var(--spacing-md);
    color: var(--edu-text-primary);
    font-weight: var(--font-weight-semibold);
  }
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  border-radius: var(--edu-radius-md);
  cursor: pointer;
  transition: all var(--transition-normal);

  &:hover {
    background: var(--edu-bg-secondary);
  }

  &--active {
    background: var(--edu-primary-50);
    border: 1px solid var(--edu-primary-200);

    .step-icon {
      background: var(--edu-primary-500);
      color: white;
    }
  }

  &--completed {
    .step-icon {
      background: var(--edu-success-500);
      color: white;
    }
  }

  &--upcoming {
    opacity: 0.6;
  }
}

.step-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--edu-gray-200);
  color: var(--edu-gray-500);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  flex-shrink: 0;
  transition: all var(--transition-normal);
}

.step-info {
  flex: 1;
  min-width: 0;
}

.step-title {
  font-weight: var(--font-weight-medium);
  color: var(--edu-text-primary);
  font-size: var(--font-size-sm);
  margin-bottom: 2px;
}

.step-desc {
  font-size: var(--font-size-xs);
  color: var(--edu-text-secondary);
  line-height: 1.3;
}

.ai-suggestions {
  .ai-collapse {
    border: none;

    :deep(.el-collapse-item__header) {
      background: var(--edu-bg-secondary);
      border-radius: var(--edu-radius-md);
      padding: var(--spacing-sm) var(--spacing-md);
      margin-bottom: var(--spacing-sm);
      font-weight: var(--font-weight-medium);
      color: var(--edu-text-primary);

      &:hover {
        background: var(--edu-bg-tertiary);
      }
    }

    :deep(.el-collapse-item__content) {
      padding: 0 var(--spacing-md) var(--spacing-md);
    }
  }
}

.ai-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.ai-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.ai-tip {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: var(--font-size-xs);
  color: var(--edu-text-secondary);

  .el-icon {
    color: var(--edu-primary-500);
  }
}

.quick-save {
  .last-saved {
    text-align: center;
    font-size: var(--font-size-xs);
    color: var(--edu-text-tertiary);
    margin-top: var(--spacing-xs);
  }
}

.completion-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.completion-content {
  background: white;
  border-radius: var(--edu-radius-xl);
  padding: var(--spacing-2xl);
  text-align: center;
  max-width: 500px;
  box-shadow: var(--edu-shadow-xl);
}

.completion-header {
  margin-bottom: var(--spacing-xl);
}

.success-icon {
  width: 80px;
  height: 80px;
  background: var(--edu-success-100);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-lg);

  .el-icon {
    font-size: 40px;
    color: var(--edu-success-500);
  }
}

.completion-header h3 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--edu-text-primary);
  margin-bottom: var(--spacing-sm);
}

.completion-header p {
  color: var(--edu-text-secondary);
  font-size: var(--font-size-base);
}

.completion-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);

  .el-button {
    height: 48px;
    font-weight: var(--font-weight-medium);
  }
}

.wizard-step {
  .step-header {
    margin-bottom: var(--spacing-xl);
    padding-bottom: var(--spacing-base);
    border-bottom: 1px solid var(--edu-border-light);

    h3 {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-semibold);
      color: var(--edu-text-primary);
      margin-bottom: var(--spacing-xs);
    }

    p {
      color: var(--edu-text-secondary);
      margin: 0;
    }
  }
}

.wizard-form {
  .subject-option {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .unit {
    margin-left: var(--spacing-xs);
    color: var(--edu-text-secondary);
    font-size: var(--font-size-sm);
  }

  .tag-select {
    width: 100%;
  }
}

.cover-uploader {
  .cover-preview {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: var(--edu-radius-base);
  }

  .cover-upload-btn {
    width: 100%;
    height: 200px;
    border: 2px dashed var(--edu-border-base);
    border-radius: var(--edu-radius-base);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

    &:hover {
      border-color: var(--edu-primary-500);
      background-color: var(--edu-primary-50);
    }

    .el-icon {
      font-size: var(--font-size-2xl);
      color: var(--edu-text-secondary);
      margin-bottom: var(--spacing-sm);
    }
  }
}

.ai-suggestions {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-lg);
  background: var(--edu-primary-50);
  border-radius: var(--edu-radius-lg);
  border: 1px solid var(--edu-primary-200);

  .suggestions-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--spacing-base);

    .suggestion-actions {
      display: flex;
      gap: var(--spacing-sm);
    }
  }

  .multi-subject-mode {
    margin-top: var(--spacing-base);
  }

  .suggestions-header {
    span {
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-weight: var(--font-weight-medium);
      color: var(--edu-primary-600);
    }
  }

  .suggestions-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--spacing-base);
  }

  .suggestion-item {
    background: white;
    padding: var(--spacing-base);
    border-radius: var(--edu-radius-base);
    border: 1px solid var(--edu-primary-200);
    cursor: pointer;
    transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

    &:hover {
      box-shadow: var(--edu-shadow-md);
      transform: translateY(-2px);
    }

    h4 {
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--edu-text-primary);
    }

    p {
      margin: 0 0 var(--spacing-sm) 0;
      color: var(--edu-text-secondary);
      font-size: var(--font-size-sm);
    }

    .suggestion-tags {
      display: flex;
      gap: var(--spacing-xs);
      flex-wrap: wrap;
    }
  }
}

.chapter-structure {
  .structure-toolbar {
    display: flex;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
  }

  .chapters-list {
    .chapter-item {
      background: var(--edu-bg-secondary);
      border: 1px solid var(--edu-border-light);
      border-radius: var(--edu-radius-lg);
      padding: var(--spacing-lg);
      margin-bottom: var(--spacing-base);
      transition: all var(--edu-duration-fast) var(--edu-easing-in-out);

      &:hover {
        box-shadow: var(--edu-shadow-md);
      }

      &.is-ai-enhanced {
        border-color: var(--edu-primary-300);
        background: var(--edu-primary-50);
      }

      .chapter-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: var(--spacing-base);

        .chapter-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);

          .chapter-number {
            font-weight: var(--font-weight-semibold);
            color: var(--edu-primary-600);
            min-width: 60px;
          }

          .title-input {
            flex: 1;
            min-width: 200px;
          }
        }

        .chapter-actions {
          display: flex;
          gap: var(--spacing-xs);
        }
      }

      .chapter-content {
        .chapter-meta {
          display: flex;
          gap: var(--spacing-lg);
          margin-top: var(--spacing-sm);

          .meta-item {
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);

            label {
              font-size: var(--font-size-sm);
              color: var(--edu-text-secondary);
              min-width: 80px;
            }
          }
        }
      }
    }
  }
}

.content-design {
  .editor-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-base);
    background: var(--edu-bg-secondary);
    border-radius: var(--edu-radius-lg) var(--edu-radius-lg) 0 0;
    border: 1px solid var(--edu-border-light);
    border-bottom: none;
  }

  .editor-content {
    border: 1px solid var(--edu-border-light);
    border-radius: 0 0 var(--edu-radius-lg) var(--edu-radius-lg);
    background: white;
    min-height: 500px;
  }

  .chapter-editor {
    .section-title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      color: var(--edu-text-primary);
      margin: var(--spacing-lg) var(--spacing-lg) var(--spacing-base) var(--spacing-lg);
      padding-bottom: var(--spacing-sm);
      border-bottom: 1px solid var(--edu-border-light);
    }

    .concepts-list,
    .examples-list {
      padding: 0 var(--spacing-lg) var(--spacing-lg);

      .concept-item,
      .example-item {
        background: var(--edu-bg-secondary);
        border: 1px solid var(--edu-border-light);
        border-radius: var(--edu-radius-base);
        padding: var(--spacing-base);
        margin-bottom: var(--spacing-sm);

        .concept-name,
        .example-title {
          margin-bottom: var(--spacing-sm);
        }
      }
    }

    .experiment-type-selector {
      padding: var(--spacing-lg);
    }

    .ai-prompt-section {
      padding: var(--spacing-lg);

      .ai-options {
        margin: var(--spacing-base) 0;
        display: flex;
        gap: var(--spacing-lg);
      }
    }

    .upload-section {
      padding: var(--spacing-lg);
    }
  }
}

.preview-section {
  margin-bottom: var(--spacing-xl);

  .preview-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-lg);
  }

  .preview-content {
    background: var(--edu-bg-secondary);
    border-radius: var(--edu-radius-lg);
    padding: var(--spacing-lg);
    min-height: 400px;
  }
}

.course-preview-info {
  .preview-card {
    background: white;
    border-radius: var(--edu-radius-lg);
    border: 1px solid var(--edu-border-light);
    overflow: hidden;

    .card-header {
      display: flex;
      gap: var(--spacing-lg);
      padding: var(--spacing-lg);

      .cover-image {
        width: 200px;
        height: 150px;
        object-fit: cover;
        border-radius: var(--edu-radius-base);
      }

      .header-info {
        flex: 1;

        h2 {
          margin: 0 0 var(--spacing-sm) 0;
        }

        p {
          color: var(--edu-text-secondary);
          margin-bottom: var(--spacing-base);
        }

        .meta-info {
          display: flex;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }
      }
    }

    .card-content {
      padding: 0 var(--spacing-lg) var(--spacing-lg);

      h3 {
        margin-bottom: var(--spacing-sm);
      }

      .tags-list {
        display: flex;
        gap: var(--spacing-xs);
        flex-wrap: wrap;

        .tag-item {
          margin: 0;
        }
      }
    }
  }
}

.course-preview-structure {
  .timeline {
    position: relative;

    .timeline-item {
      display: flex;
      margin-bottom: var(--spacing-lg);

      .timeline-marker {
        position: relative;
        width: 24px;
        margin-right: var(--spacing-lg);

        .marker-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid var(--edu-border-light);

          &.marker-content {
            background: var(--edu-primary-500);
            border-color: var(--edu-primary-500);
          }

          &.marker-experiment {
            background: var(--edu-success);
            border-color: var(--edu-success);
          }

          &.marker-interactive {
            background: var(--edu-warning);
            border-color: var(--edu-warning);
          }

          &.marker-assessment {
            background: var(--edu-info);
            border-color: var(--edu-info);
          }
        }

        .marker-line {
          position: absolute;
          top: 24px;
          left: 10px;
          width: 2px;
          height: calc(100% + var(--spacing-lg));
          background: var(--edu-border-light);
        }
      }

      .timeline-content {
        flex: 1;

        .chapter-preview-card {
          background: white;
          border: 1px solid var(--edu-border-light);
          border-radius: var(--edu-radius-lg);
          padding: var(--spacing-lg);

          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: var(--spacing-sm);

            h4 {
              margin: 0;
              color: var(--edu-text-primary);
            }

            .chapter-meta {
              display: flex;
              align-items: center;
              gap: var(--spacing-sm);

              .duration {
                font-size: var(--font-size-sm);
                color: var(--edu-text-secondary);
              }
            }
          }

          p {
            color: var(--edu-text-secondary);
            margin-bottom: var(--spacing-sm);
          }

          .objectives {
            strong {
              color: var(--edu-text-primary);
            }

            ul {
              margin: var(--spacing-xs) 0 0 var(--spacing-lg);
              padding-left: var(--spacing-lg);
            }
          }
        }
      }
    }
  }
}

.publish-settings {
  background: var(--edu-bg-secondary);
  border-radius: var(--edu-radius-lg);
  padding: var(--spacing-lg);
  border: 1px solid var(--edu-border-light);

  h3 {
    margin: 0 0 var(--spacing-lg) 0;
    color: var(--edu-text-primary);
  }
}

.wizard-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 深色模式适配 */
[data-theme="dark"] {
  .wizard-content,
  .preview-section .preview-content,
  .publish-settings {
    background: var(--edu-bg-primary);
    border-color: var(--edu-border-dark);
  }

  .suggestion-item,
  .chapter-item,
  .chapter-preview-card {
    background: var(--edu-bg-secondary);
    border-color: var(--edu-border-dark);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .course-wizard {
    padding: var(--spacing-base);
  }

  .wizard-content {
    padding: var(--spacing-base);
  }

  .structure-toolbar,
  .preview-toolbar {
    flex-direction: column;
    gap: var(--spacing-sm);
    align-items: stretch;
  }

  .chapter-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }

  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>