<template>
  <TeacherWorkspaceLayout
    title="交互体验管理"
    subtitle="上传和管理HTML互动内容，提供沉浸式学习体验"
    v-model:leftCollapsed="leftSidebarCollapsed"
    v-model:rightCollapsed="rightSidebarCollapsed"
  >
    <template #header-controls>
      <div class="workspace-actions">
        <el-button type="primary" @click="showUploadModal = true">
          <el-icon><Plus /></el-icon>
          上传互动内容
        </el-button>
        <el-button @click="refreshList">
          <el-icon><Refresh /></el-icon>
          刷新列表
        </el-button>
      </div>
    </template>

    <template #summary>
      <EduCard
        v-for="card in summaryCards"
        :key="card.id"
        class="summary-card"
        variant="glass"
        size="sm"
        :hoverable="true"
        body-class="summary-card__body"
      >
        <div class="summary-card__content">
          <span class="summary-card__icon" :style="{ background: card.gradient }">
            <el-icon><component :is="card.icon" /></el-icon>
          </span>
          <div class="summary-card__text">
            <span class="summary-card__value">{{ card.value }}</span>
            <span class="summary-card__label">{{ card.label }}</span>
          </div>
        </div>
      </EduCard>
    </template>

    <template #left>
      <ManagementSidebarLeft
        :sections="leftSidebarSections"
        @quick-action="handleQuickAction"
        @filter-change="handleFilterChange"
      >
        <!-- 自定义筛选器插槽 -->
        <template #filters="{ data }">
          <div class="experience-filters">
            <div class="filter-section">
              <h5>内容类型</h5>
              <div class="category-stats">
                <div
                  v-for="category in contentTypeStats"
                  :key="category.type"
                  class="category-item"
                  :class="{ active: selectedType === category.type }"
                  @click="filterByType(category.type)"
                >
                  <span class="category-icon" :style="{ backgroundColor: category.color }">
                    <el-icon><component :is="category.icon" /></el-icon>
                  </span>
                  <div class="category-info">
                    <div class="category-name">{{ category.name }}</div>
                    <div class="category-count">{{ category.count }} 个</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="filter-section">
              <h5>学科筛选</h5>
              <div class="subject-filter">
                <div
                  v-for="subject in subjects"
                  :key="subject.value"
                  class="subject-item"
                  :class="{ active: selectedSubject === subject.value }"
                  @click="filterBySubject(subject.value)"
                >
                  <EduTag :variant="getSubjectVariant(subject.value)" size="sm">
                    {{ subject.label }}
                  </EduTag>
                  <span class="subject-count">{{ getSubjectContentCount(subject.value) }} 个</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 自定义快捷操作插槽 -->
        <template #quick-actions="{ data }">
          <div class="experience-quick-actions">
            <el-button type="primary" size="small" style="width: 100%; margin-bottom: 8px;" @click="showUploadModal = true">
              <el-icon><Plus /></el-icon>
              上传互动内容
            </el-button>
            <el-button type="default" size="small" style="width: 100%; margin-bottom: 8px;" @click="refreshList">
              <el-icon><Refresh /></el-icon>
              刷新列表
            </el-button>
            <el-button type="default" size="small" style="width: 100%;" @click="batchExport">
              <el-icon><Download /></el-icon>
              批量导出
            </el-button>
          </div>
        </template>

        <!-- 自定义教学动态插槽 -->
        <template #activity="{ data }">
          <div class="experience-activity">
            <div class="usage-overview">
              <div class="usage-item">
                <div class="usage-label">今日使用</div>
                <div class="usage-value">{{ todayUsage }} 次</div>
              </div>
              <div class="usage-item">
                <div class="usage-label">本周使用</div>
                <div class="usage-value">{{ weekUsage }} 次</div>
              </div>
              <div class="usage-item">
                <div class="usage-label">总使用量</div>
                <div class="usage-value">{{ totalUsage }} 次</div>
              </div>
            </div>

            <div class="upload-history">
              <h5>最近上传</h5>
              <div
                v-for="history in uploadHistory.slice(0, 3)"
                :key="history.id"
                class="history-item"
              >
                <div class="history-icon" :class="`history-icon--${history.type}`">
                  <el-icon><component :is="history.icon" /></el-icon>
                </div>
                <div class="history-content">
                  <div class="history-title">{{ history.title }}</div>
                  <div class="history-time">{{ formatTime(history.timestamp) }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </ManagementSidebarLeft>
    </template>

    <template #right>
      <ManagementSidebarRight
        :sections="rightSidebarSections"
        @resource-action="handleResourceAction"
        @collaboration-action="handleCollaborationAction"
      >
        <!-- 自定义数据洞察插槽 -->
        <template #insights="{ data }">
          <div class="experience-insights">
            <div class="quick-stats">
              <div class="stat-item">
                <div class="stat-label">平均评分</div>
                <div class="stat-value">{{ averageRating }}/5</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">热门内容</div>
                <div class="stat-value">{{ featuredCount }} 个</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">总内容数</div>
                <div class="stat-value">{{ contentList.length }} 个</div>
              </div>
            </div>
          </div>
        </template>

        <!-- 自定义资源参考插槽 -->
        <template #resources="{ data }">
          <div class="experience-resources">
            <h5>推荐资源</h5>
            <div class="resource-list">
              <div v-for="resource in recommendedResources" :key="resource.id" class="resource-item">
                <div class="resource-icon" :style="{ backgroundColor: resource.color }">
                  <el-icon><component :is="resource.icon" /></el-icon>
                </div>
                <div class="resource-content">
                  <div class="resource-title">{{ resource.title }}</div>
                  <div class="resource-desc">{{ resource.description }}</div>
                </div>
                <el-button text size="small" @click="openResource(resource)">查看</el-button>
              </div>
            </div>
          </div>
        </template>
      </ManagementSidebarRight>
    </template>

    <div class="interactive-content">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 上传管理 -->
        <el-tab-pane label="上传管理" name="upload">
          <EduCard
            class="content-section"
            variant="elevated"
            :hoverable="false"
            body-class="content-section__body"
          >
            <template #header>
              <div class="section-header">
                <div class="section-info">
                  <h3 class="section-title">内容管理</h3>
                  <p class="section-description">上传和管理您的互动学习内容</p>
                </div>
                <div class="section-actions">
                  <el-input
                    v-model="searchKeyword"
                    placeholder="搜索互动内容..."
                    style="width: 300px;"
                    clearable
                  >
                    <template #prefix>
                      <el-icon><Search /></el-icon>
                    </template>
                  </el-input>
                  <el-select v-model="filterType" placeholder="内容类型" style="width: 150px;">
                    <el-option label="全部类型" value="" />
                    <el-option label="HTML单页" value="html" />
                    <el-option label="互动包" value="package" />
                    <el-option label="模拟器" value="simulation" />
                    <el-option label="游戏" value="game" />
                  </el-select>
                  <el-select v-model="filterSubject" placeholder="适用学科" style="width: 150px;">
                    <el-option label="全部学科" value="" />
                    <el-option
                      v-for="subject in subjects"
                      :key="subject.value"
                      :label="subject.label"
                      :value="subject.value"
                    />
                  </el-select>
                </div>
              </div>
            </template>

            <div class="upload-actions">
              <el-button type="primary" @click="showUploadModal = true">
                <el-icon><Plus /></el-icon>
                上传新内容
              </el-button>
              <el-button @click="batchImport">
                <el-icon><FolderOpened /></el-icon>
                批量导入
              </el-button>
              <el-button @click="refreshList">
                <el-icon><Refresh /></el-icon>
                刷新列表
              </el-button>
            </div>

        <div class="content-container">
          <div class="content-grid">
            <div
              v-for="content in filteredContentList"
              :key="content.id"
              class="content-card"
              :class="{ 'content-card--featured': content.featured }"
              @click="previewContent(content)"
            >
              <div class="card-thumbnail">
                <div class="thumbnail-container">
                  <img
                    v-if="content.thumbnail"
                    :src="content.thumbnail"
                    :alt="content.title"
                    class="thumbnail-image"
                  />
                  <div v-else class="thumbnail-placeholder">
                    <el-icon>
                      <component :is="getContentIcon(content.type)" />
                    </el-icon>
                  </div>
                  <div class="thumbnail-overlay">
                    <el-button
                      type="primary"
                      size="small"
                      @click.stop="previewContent(content)"
                    >
                      <el-icon><View /></el-icon>
                      预览
                    </el-button>
                  </div>
                </div>
                <div class="content-type-badge">
                  <EduTag :variant="getTypeColor(content.type)" size="small">
                    {{ getTypeLabel(content.type) }}
                  </EduTag>
                </div>
              </div>

              <div class="card-content">
                <div class="content-header">
                  <h4 class="content-title">{{ content.title }}</h4>
                  <div class="content-actions">
                    <el-dropdown @command="handleContentAction">
                      <el-button size="small" text>
                        <el-icon><MoreFilled /></el-icon>
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item :command="{ action: 'edit', content }">
                            <el-icon><Edit /></el-icon>
                            编辑
                          </el-dropdown-item>
                          <el-dropdown-item :command="{ action: 'duplicate', content }">
                            <el-icon><CopyDocument /></el-icon>
                            复制
                          </el-dropdown-item>
                          <el-dropdown-item :command="{ action: 'export', content }">
                            <el-icon><Download /></el-icon>
                            导出
                          </el-dropdown-item>
                          <el-dropdown-item :command="{ action: 'delete', content }" divided>
                            <el-icon><Delete /></el-icon>
                            删除
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>

                <p class="content-description">{{ content.description }}</p>

                <div class="content-meta">
                  <div class="meta-item">
                    <el-icon><User /></el-icon>
                    <span>{{ content.author }}</span>
                  </div>
                  <div class="meta-item">
                    <el-icon><Clock /></el-icon>
                    <span>{{ formatDate(content.createdAt) }}</span>
                  </div>
                  <div class="meta-item">
                    <el-icon><DataAnalysis /></el-icon>
                    <span>{{ content.usageCount }}次使用</span>
                  </div>
                </div>

                <div class="content-tags">
                  <EduTag
                    v-for="tag in content.tags"
                    :key="tag"
                    size="small"
                    class="tag-item"
                  >
                    {{ tag }}
                  </EduTag>
                </div>

                <div class="content-footer">
                  <div class="content-stats">
                    <div class="stat-item">
                      <span class="stat-label">评分</span>
                      <div class="rating">
                        <el-icon
                          v-for="i in 5"
                          :key="i"
                          :class="{ 'is-active': i <= content.rating }"
                        >
                          <Star />
                        </el-icon>
                        <span class="rating-value">{{ content.rating }}/5</span>
                      </div>
                    </div>
                    <div class="stat-item">
                      <span class="stat-label">时长</span>
                      <span>{{ content.duration }}分钟</span>
                    </div>
                  </div>
                  <div class="content-actions-footer">
                    <el-button size="small" @click.stop="assignToCourse(content)">
                      <el-icon><Plus /></el-icon>
                      分配到课程
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredContentList.length === 0" class="empty-state">
            <el-empty description="暂无互动内容">
              <el-button type="primary" @click="showUploadModal = true">
                <el-icon><Upload /></el-icon>
                上传互动内容
              </el-button>
            </el-empty>
          </div>
        </div>
      </EduCard>
        </el-tab-pane>

        <!-- 预览&测试 -->
        <el-tab-pane label="预览&测试" name="preview">
          <EduCard
            class="content-section"
            variant="elevated"
            :hoverable="false"
            body-class="content-section__body"
          >
            <template #header>
              <div class="section-header">
                <div class="section-info">
                  <h3 class="section-title">内容预览与测试</h3>
                  <p class="section-description">实时预览和测试您的互动内容</p>
                </div>
                <div class="section-actions">
                  <el-select v-model="selectedContent" placeholder="选择要预览的内容" style="width: 200px;">
                    <el-option
                      v-for="content in contentList"
                      :key="content.id"
                      :label="content.title"
                      :value="content"
                    />
                  </el-select>
                  <el-button @click="openPreviewInNewTab" :disabled="!selectedContent">
                    <el-icon><View /></el-icon>
                    新窗口打开
                  </el-button>
                  <el-button @click="runTests" :disabled="!selectedContent">
                    <el-icon><Monitor /></el-icon>
                    运行测试
                  </el-button>
                </div>
              </div>
            </template>

            <div class="preview-content">
              <!-- 预览区域 -->
              <div class="preview-main">
                <div class="preview-header">
                  <div class="preview-info">
                    <h4>{{ selectedContent?.title || '请选择内容' }}</h4>
                    <div class="preview-meta">
                      <span v-if="selectedContent" class="meta-item">
                        <el-icon><Document /></el-icon>
                        {{ selectedContent.type }}
                      </span>
                      <span v-if="selectedContent" class="meta-item">
                        <el-icon><User /></el-icon>
                        {{ selectedContent.author }}
                      </span>
                      <span v-if="selectedContent" class="meta-item">
                        <el-icon><Clock /></el-icon>
                        {{ formatDate(selectedContent.createdAt) }}
                      </span>
                    </div>
                  </div>
                  <div class="preview-controls">
                    <el-button-group>
                      <el-button size="small" @click="previewFullscreen" :disabled="!selectedContent">
                        <el-icon><FullScreen /></el-icon>
                        全屏
                      </el-button>
                      <el-button size="small" @click="previewReload" :disabled="!selectedContent">
                        <el-icon><Refresh /></el-icon>
                        刷新
                      </el-button>
                    </el-button-group>
                    <el-button-group>
                      <el-button size="small" @click="togglePreviewMode">
                        <el-icon><Monitor /></el-icon>
                        {{ previewMode === 'desktop' ? '移动端' : '桌面端' }}
                      </el-button>
                      <el-button size="small" @click="toggleResponsive" :disabled="!selectedContent">
                        <el-icon><MagicStick /></el-icon>
                        响应式
                      </el-button>
                    </el-button-group>
                  </div>
                </div>

                <div class="preview-frame-container">
                  <div
                    v-if="selectedContent"
                    class="preview-frame"
                    :class="{ 'preview-mobile': previewMode === 'mobile' }"
                  >
                    <iframe
                      :src="selectedContent.url"
                      :style="getPreviewStyle()"
                      class="content-iframe"
                      frameborder="0"
                      @load="handlePreviewLoad"
                      @error="handlePreviewError"
                    />
                  </div>
                  <div v-else class="preview-placeholder">
                    <el-icon><Monitor /></el-icon>
                    <p>请选择要预览的内容</p>
                  </div>
                </div>
              </div>

              <!-- 测试区域 -->
              <div class="test-section">
                <div class="test-header">
                  <h4>兼容性测试</h4>
                  <div class="test-stats">
                    <el-tag :type="testStatus === 'idle' ? 'info' : testStatus === 'running' ? 'warning' : testStatus === 'success' ? 'success' : 'danger'">
                      {{ getTestStatusText() }}
                    </el-tag>
                  </div>
                </div>
                <div class="test-content">
                  <div class="test-grid">
                    <div
                      v-for="test in testResults"
                      :key="test.name"
                      class="test-item"
                      :class="getTestClass(test.status)"
                    >
                      <div class="test-icon">
                        <el-icon>
                          <component :is="getTestIcon(test.status)" />
                        </el-icon>
                      </div>
                      <div class="test-info">
                        <div class="test-name">{{ test.name }}</div>
                        <div class="test-description">{{ test.description }}</div>
                        <div class="test-result">
                          <span v-if="test.status === 'success'">✓ 通过</span>
                          <span v-else-if="test.status === 'failed'">✗ 失败</span>
                          <span v-else>⏳ 等待中</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="test-actions">
                  <el-button type="primary" @click="runAllTests" :disabled="testStatus !== 'idle'">
                    <el-icon><VideoPlay /></el-icon>
                    运行所有测试
                  </el-button>
                  <el-button @click="exportTestReport" :disabled="!hasTestResults">
                    <el-icon><Download /></el-icon>
                    导出报告
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 性能指标 -->
            <div class="performance-section">
              <div class="performance-header">
                <h4>性能指标</h4>
                <el-button size="small" @click="measurePerformance">
                  <el-icon><DataAnalysis /></el-icon>
                  重新测量
                </el-button>
              </div>
              <div class="performance-metrics">
                <div class="metric-item">
                  <div class="metric-label">加载时间</div>
                  <div class="metric-value">{{ performanceMetrics.loadTime }}ms</div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">交互响应</div>
                  <div class="metric-value">{{ performanceMetrics.responseTime }}ms</div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">内存使用</div>
                  <div class="metric-value">{{ performanceMetrics.memoryUsage }}MB</div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">CPU使用</div>
                  <div class="metric-value">{{ performanceMetrics.cpuUsage }}%</div>
                </div>
              </div>
            </div>
          </EduCard>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 上传模态框 -->
    <el-dialog
      v-model="showUploadModal"
      title="上传互动内容"
      width="600px"
      :before-close="handleCloseUpload"
    >
      <div class="upload-content">
        <el-steps :active="uploadStep" align-center>
          <el-step title="选择文件" description="上传HTML或ZIP包" />
          <el-step title="内容配置" description="设置基本信息" />
          <el-step title="预览确认" description="预览并发布" />
        </el-steps>

        <div class="upload-form">
          <!-- 步骤1: 文件上传 -->
          <div v-if="uploadStep === 0" class="upload-step">
            <div class="upload-area">
              <el-upload
                drag
                multiple
                :file-list="uploadFiles"
                :before-upload="beforeUpload"
                :http-request="handleFileUpload"
                :on-change="handleFileChange"
                :on-remove="handleFileRemove"
                accept=".html,.css,.js,.zip,.json"
              >
                <el-icon class="el-icon--upload"><Upload /></el-icon>
                <div class="el-upload__text">
                  将文件拖到此处，或<em>点击上传</em>
                </div>
                <template #tip>
                  <div class="el-upload__tip">
                    支持 .html 单文件或包含 .html/.css/.js 的 .zip 压缩包，文件大小不超过 50MB
                  </div>
                </template>
              </el-upload>
            </div>
          </div>

          <!-- 步骤2: 内容配置 -->
          <div v-if="uploadStep === 1" class="config-step">
            <el-form :model="contentForm" :rules="contentRules" label-width="100px">
              <el-form-item label="标题" prop="title">
                <el-input v-model="contentForm.title" placeholder="输入互动内容标题" />
              </el-form-item>
              <el-form-item label="描述" prop="description">
                <el-input
                  v-model="contentForm.description"
                  type="textarea"
                  :rows="3"
                  placeholder="描述这个互动内容的功能和用途"
                />
              </el-form-item>
              <el-form-item label="类型" prop="type">
                <el-select v-model="contentForm.type" placeholder="选择内容类型">
                  <el-option label="HTML单页" value="html" />
                  <el-option label="互动包" value="package" />
                  <el-option label="模拟器" value="simulation" />
                  <el-option label="游戏" value="game" />
                </el-select>
              </el-form-item>
              <el-form-item label="适用学科" prop="subject">
                <el-select v-model="contentForm.subject" placeholder="选择适用学科">
                  <el-option
                    v-for="subject in subjects"
                    :key="subject.value"
                    :label="subject.label"
                    :value="subject.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="预计时长" prop="duration">
                <el-input-number
                  v-model="contentForm.duration"
                  :min="1"
                  :max="120"
                  controls-position="right"
                />
                <span class="unit">分钟</span>
              </el-form-item>
              <el-form-item label="标签">
                <el-select
                  v-model="contentForm.tags"
                  multiple
                  filterable
                  allow-create
                  placeholder="添加标签"
                >
                  <el-option
                    v-for="tag in suggestedTags"
                    :key="tag"
                    :label="tag"
                    :value="tag"
                  />
                </el-select>
              </el-form-item>
            </el-form>
          </div>

          <!-- 步骤3: 预览确认 -->
          <div v-if="uploadStep === 2" class="preview-step">
            <div class="preview-header">
              <h4>内容预览</h4>
            </div>
            <div class="preview-container">
              <iframe
                v-if="previewUrl"
                :src="previewUrl"
                class="preview-iframe"
                frameborder="0"
              />
              <div v-else class="preview-placeholder">
                <el-icon><Loading /></el-icon>
                <p>正在生成预览...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseUpload">取消</el-button>
          <el-button v-if="uploadStep > 0" @click="previousStep">上一步</el-button>
          <el-button
            v-if="uploadStep < 2"
            type="primary"
            @click="nextStep"
            :disabled="!canProceed"
          >
            下一步
          </el-button>
          <el-button
            v-else
            type="primary"
            :loading="uploading"
            @click="completeUpload"
          >
            完成上传
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 预览模态框 -->
    <el-dialog
      v-model="showPreviewModal"
      :title="currentPreviewContent?.title"
      width="90%"
      fullscreen
      :before-close="handleClosePreview"
    >
      <div class="preview-modal">
        <div class="preview-toolbar">
          <div class="toolbar-left">
            <el-button-group>
              <el-button @click="reloadPreview">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </el-button-group>
          </div>
          <div class="toolbar-right">
            <el-button type="primary" @click="useInCourse">
              <el-icon><Plus /></el-icon>
              用于课程
            </el-button>
          </div>
        </div>
        <div class="preview-frame">
          <iframe
            v-if="currentPreviewContent?.url"
            :src="currentPreviewContent.url"
            class="content-iframe"
            frameborder="0"
            @load="handlePreviewLoad"
            @error="handlePreviewError"
          />
          <div v-else class="preview-error">
            <el-icon><Warning /></el-icon>
            <p>预览加载失败</p>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 分配到课程对话框 -->
    <el-dialog
      v-model="showAssignModal"
      title="分配到课程"
      width="500px"
    >
      <div class="assign-content">
        <el-form :model="assignForm" label-width="100px">
          <el-form-item label="选择课程">
            <el-select
              v-model="assignForm.courseId"
              placeholder="选择要分配的课程"
              style="width: 100%"
            >
              <el-option
                v-for="course in availableCourses"
                :key="course.id"
                :label="course.title"
                :value="course.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showAssignModal = false">取消</el-button>
        <el-button type="primary" @click="confirmAssign">确认分配</el-button>
      </template>
    </el-dialog>
  </TeacherWorkspaceLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Upload, Refresh, Search, MagicStick, Document, View, MoreFilled,
  Edit, CopyDocument, Download, Delete, User, Clock, DataAnalysis,
  Star, Monitor, Warning, SuccessFilled, CircleCloseFilled, FullScreen,
  VideoPlay, Picture, TrendCharts
} from '@element-plus/icons-vue'

import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'
import ManagementSidebarLeft from '@/components/layout/ManagementSidebarLeft.vue'
import ManagementSidebarRight from '@/components/layout/ManagementSidebarRight.vue'
import { EduCard, EduTag } from '@reopeninnolab/ui-kit'
import { formatDate, formatTime } from '@/utils/date'
import { subjects, grades, suggestedTags } from '@/config/courseData'
import { PAGE_SIDEBAR_CONFIGS } from '@/constants/managementSidebar'

interface InteractiveContent {
  id: string
  title: string
  description: string
  type: 'html' | 'package' | 'simulation' | 'game'
  subject: string
  grade: string
  author: string
  thumbnail?: string
  url: string
  tags: string[]
  duration: number
  rating: number
  usageCount: number
  createdAt: Date
  updatedAt: Date
  featured: boolean
  settings: {
    fullscreen: boolean
    responsive: boolean
    resize: boolean
  }
}

const router = useRouter()

// 响应式数据
const activeTab = ref('upload')
const searchKeyword = ref('')
const selectedType = ref('')
const selectedSubject = ref('')
const filterType = ref('')
const filterSubject = ref('')
const leftSidebarCollapsed = ref(false)
const rightSidebarCollapsed = ref(false)

// 侧边栏配置
const leftSidebarSections = computed(() => PAGE_SIDEBAR_CONFIGS.experiences.left)
const rightSidebarSections = computed(() => PAGE_SIDEBAR_CONFIGS.experiences.right)
const aiPrompt = ref('')
const aiGenerating = ref(false)
const showUploadModal = ref(false)
const showPreviewModal = ref(false)
const showAssignModal = ref(false)
const currentPreviewContent = ref<InteractiveContent | null>(null)
const uploadStep = ref(0)
const uploadFiles = ref<any[]>([])
const uploading = ref(false)
const previewUrl = ref('')
const selectedContent = ref<InteractiveContent | null>(null)
const availableCourses = ref<any[]>([])
const assignForm = ref({
  courseId: ''
})

// 预览和测试相关数据
const previewMode = ref<'desktop' | 'mobile'>('desktop')
const testStatus = ref<'idle' | 'running' | 'success' | 'failed'>('idle')
const responsive = ref(false)

const testResults = ref([
  {
    name: 'HTML5 兼容性',
    description: '检查HTML5标准支持',
    status: 'pending' as 'pending' | 'success' | 'failed'
  },
  {
    name: 'CSS3 兼容性',
    description: '检查CSS3样式支持',
    status: 'pending' as 'pending' | 'success' | 'failed'
  },
  {
    name: 'JavaScript 执行',
    description: '检查JavaScript代码执行',
    status: 'pending' as 'pending' | 'success' | 'failed'
  },
  {
    name: '响应式布局',
    description: '检查不同屏幕尺寸适配',
    status: 'pending' as 'pending' | 'success' | 'failed'
  },
  {
    name: '交互功能',
    description: '检查用户交互功能',
    status: 'pending' as 'pending' | 'success' | 'failed'
  },
  {
    name: '性能测试',
    description: '检查加载性能和运行效率',
    status: 'pending' as 'pending' | 'success' | 'failed'
  }
])

const performanceMetrics = ref({
  loadTime: 0,
  responseTime: 0,
  memoryUsage: 0,
  cpuUsage: 0
})

// 表单数据
const contentForm = ref({
  title: '',
  description: '',
  type: 'html',
  subject: '',
  grade: '',
  duration: 30,
  tags: [],
  settings: ['fullscreen', 'responsive']
})

// 表单验证规则
const contentRules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在2到100个字符之间', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入描述', trigger: 'blur' },
    { min: 10, max: 500, message: '描述长度在10到500个字符之间', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择类型', trigger: 'change' }
  ],
  subject: [
    { required: true, message: '请选择学科', trigger: 'change' }
  ],
  duration: [
    { required: true, message: '请输入预计时长', trigger: 'blur' },
    { type: 'number', min: 1, max: 120, message: '时长在1到120分钟之间', trigger: 'blur' }
  ]
}

// 模拟数据
const contentList = ref<InteractiveContent[]>([
  {
    id: '1',
    title: '物理电路模拟器',
    description: '交互式电路搭建和实验模拟器，支持多种电子元件和测量工具',
    type: 'simulation',
    subject: 'physics',
    grade: 'grade10',
    author: '张老师',
    thumbnail: '/thumbnails/circuit-simulator.jpg',
    url: '/interactive/circuit-simulator/index.html',
    tags: ['物理', '电路', '模拟', '实验'],
    duration: 45,
    rating: 5,
    usageCount: 128,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    featured: true,
    settings: {
      fullscreen: true,
      responsive: true,
      resize: true
    }
  },
  {
    id: '2',
    title: '化学分子结构3D',
    description: '3D分子结构可视化工具，支持旋转、缩放和元素信息展示',
    type: 'html',
    subject: 'chemistry',
    grade: 'grade11',
    author: '李老师',
    url: '/interactive/molecule-3d/index.html',
    tags: ['化学', '分子', '3D', '可视化'],
    duration: 30,
    rating: 4,
    usageCount: 89,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    featured: false,
    settings: {
      fullscreen: true,
      responsive: false,
      resize: true
    }
  },
  {
    id: '3',
    title: '数学函数图像绘制',
    description: '动态数学函数图像绘制工具，支持多种函数类型和参数调节',
    type: 'html',
    subject: 'math',
    grade: 'grade9',
    author: '王老师',
    url: '/interactive/function-plotter/index.html',
    tags: ['数学', '函数', '图像', '绘图'],
    duration: 25,
    rating: 4,
    usageCount: 156,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-22'),
    featured: true,
    settings: {
      fullscreen: true,
      responsive: true,
      resize: false
    }
  }
])

const aiSuggestions = ref([
  { id: '1', text: '创建物理实验模拟器', icon: 'Experiment' },
  { id: '2', text: '设计数学互动练习', icon: 'Math' },
  { id: '3', text: '制作化学3D模型', icon: 'Science' },
  { id: '4', text: '生成教学游戏', icon: 'Trophy' }
])

const recentActivities = ref([
  { id: '1', text: '上传了物理电路模拟器', type: 'upload', icon: 'Upload', timestamp: Date.now() - 3600000 },
  { id: '2', text: '编辑了化学分子结构3D', type: 'edit', icon: 'Edit', timestamp: Date.now() - 7200000 },
  { id: '3', text: '发布了数学函数绘制工具', type: 'publish', icon: 'Check', timestamp: Date.now() - 10800000 }
])

const uploadHistory = ref([
  { id: '1', title: '物理电路模拟器', type: 'upload', icon: 'Upload', timestamp: Date.now() - 1800000 },
  { id: '2', title: '化学分子结构3D', type: 'edit', icon: 'Edit', timestamp: Date.now() - 3600000 },
  { id: '3', title: '数学函数图像绘制', type: 'create', icon: 'Plus', timestamp: Date.now() - 5400000 }
])

// 计算属性
const summaryCards = computed(() => [
  {
    id: 'total',
    label: '总内容数',
    value: contentList.value.length,
    icon: Document,
    gradient: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)'
  },
  {
    id: 'featured',
    label: '精选内容',
    value: contentList.value.filter(c => c.featured).length,
    icon: Star,
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    id: 'average',
    label: '平均评分',
    value: averageRating.value,
    icon: TrendCharts,
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #667eea 100%)'
  }
])

const filteredContentList = computed(() => {
  let filtered = contentList.value

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(content =>
      content.title.toLowerCase().includes(keyword) ||
      content.description.toLowerCase().includes(keyword) ||
      content.tags.some(tag => tag.toLowerCase().includes(keyword))
    )
  }

  if (selectedType.value) {
    filtered = filtered.filter(content => content.type === selectedType.value)
  }

  if (selectedSubject.value) {
    filtered = filtered.filter(content => content.subject === selectedSubject.value)
  }

  return filtered.sort((a, b) => {
    // 精选内容优先
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    // 按使用次数排序
    return b.usageCount - a.usageCount
  })
})

const averageRating = computed(() => {
  if (contentList.value.length === 0) return 0
  const total = contentList.value.reduce((sum, content) => sum + content.rating, 0)
  return (total / contentList.value.length).toFixed(1)
})

const featuredCount = computed(() => contentList.value.filter(c => c.featured).length)

const todayUsage = computed(() => 28)
const weekUsage = computed(() => 156)
const totalUsage = computed(() => contentList.value.reduce((sum, content) => sum + content.usageCount, 0))

// 左侧栏数据
const contentTypeStats = computed(() => [
  { name: 'HTML单页', count: contentList.value.filter(c => c.type === 'html').length, icon: 'Document', color: '#4ecdc4', type: 'html' },
  { name: '互动包', count: contentList.value.filter(c => c.type === 'package').length, icon: 'FolderOpened', color: '#45b7d1', type: 'package' },
  { name: '模拟器', count: contentList.value.filter(c => c.type === 'simulation').length, icon: 'Monitor', color: '#96ceb4', type: 'simulation' },
  { name: '游戏', count: contentList.value.filter(c => c.type === 'game').length, icon: 'Trophy', color: '#ffb347', type: 'game' },
  { name: '全部内容', count: contentList.value.length, icon: 'Grid', color: '#667eea', type: '' }
])

// 方法
const filterByType = (type: string) => {
  selectedType.value = type === selectedType.value ? '' : type
}

const filterBySubject = (subject: string) => {
  selectedSubject.value = subject === selectedSubject.value ? '' : subject
}

const getSubjectContentCount = (subject: string) => {
  return contentList.value.filter(c => c.subject === subject).length
}

const getSubjectVariant = (subject: string): string => {
  const variants: Record<string, string> = {
    physics: 'physics',
    chemistry: 'chemistry',
    math: 'math',
    biology: 'biology',
    language: 'language',
    history: 'history',
    geography: 'geography',
    english: 'english',
    art: 'art',
    music: 'music',
    pe: 'pe',
    it: 'it'
  }
  return variants[subject] || 'default'
}

const refreshList = () => {
  ElMessage.success('列表已刷新')
}

const previewContent = (content: InteractiveContent) => {
  currentPreviewContent.value = content
  showPreviewModal.value = true
}

const handleContentAction = ({ action, content }: { action: string, content: InteractiveContent }) => {
  switch (action) {
    case 'edit':
      ElMessage.info(`编辑功能开发中: ${content.title}`)
      break
    case 'duplicate':
      ElMessage.success(`复制成功: ${content.title}`)
      break
    case 'export':
      ElMessage.info(`导出功能开发中: ${content.title}`)
      break
    case 'delete':
      deleteContent(content)
      break
  }
}

const deleteContent = async (content: InteractiveContent) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除互动内容 "${content.title}" 吗？此操作不可撤销。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const index = contentList.value.findIndex(item => item.id === content.id)
    if (index > -1) {
      contentList.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  } catch {
    // 用户取消删除
  }
}

const assignToCourse = (content: InteractiveContent) => {
  selectedContent.value = content
  showAssignModal.value = true
}

const confirmAssign = () => {
  if (!assignForm.value.courseId) {
    ElMessage.warning('请选择课程')
    return
  }

  ElMessage.success(`已将 "${selectedContent.value?.title}" 分配到课程`)
  showAssignModal.value = false
  assignForm.value.courseId = ''
}

const beforeUpload = (file: File) => {
  const allowedTypes = ['text/html', 'application/zip', 'text/css', 'application/javascript', 'application/json']
  const isValidType = allowedTypes.includes(file.type) ||
    file.name.toLowerCase().endsWith('.html') ||
    file.name.toLowerCase().endsWith('.zip') ||
    file.name.toLowerCase().endsWith('.css') ||
    file.name.toLowerCase().endsWith('.js') ||
    file.name.toLowerCase().endsWith('.json')

  if (!isValidType) {
    ElMessage.error('只支持 HTML、CSS、JavaScript 文件或 ZIP 压缩包')
    return false
  }

  const isLt50M = file.size / 1024 / 1024 < 50
  if (!isLt50M) {
    ElMessage.error('文件大小不能超过 50MB')
    return false
  }

  return false
}

const handleFileUpload = async (options: any) => {
  const file = options.file
  await new Promise(resolve => setTimeout(resolve, 1000))
  ElMessage.success(`文件 ${file.name} 上传成功`)
}

const handleFileChange = (file: any, fileList: any[]) => {
  uploadFiles.value = fileList
}

const handleFileRemove = (file: any, fileList: any[]) => {
  uploadFiles.value = fileList
}

const handleCloseUpload = () => {
  showUploadModal.value = false
  resetUploadForm()
}

const resetUploadForm = () => {
  uploadStep.value = 0
  uploadFiles.value = []
  contentForm.value = {
    title: '',
    description: '',
    type: 'html',
    subject: '',
    grade: '',
    duration: 30,
    tags: [],
    settings: ['fullscreen', 'responsive']
  }
  previewUrl.value = ''
}

const nextStep = () => {
  if (uploadStep.value < 2) {
    uploadStep.value++

    if (uploadStep.value === 2) {
      generatePreview()
    }
  }
}

const previousStep = () => {
  if (uploadStep.value > 0) {
    uploadStep.value--
  }
}

const generatePreview = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000))
    previewUrl.value = URL.createObjectURL(new Blob(['<html><body><h1>预览内容</h1></body></html>'], { type: 'text/html' }))
  } catch (error) {
    console.error('生成预览失败:', error)
  }
}

const completeUpload = async () => {
  try {
    uploading.value = true

    await new Promise(resolve => setTimeout(resolve, 2000))

    const newContent: InteractiveContent = {
      id: `content_${Date.now()}`,
      title: contentForm.value.title,
      description: contentForm.value.description,
      type: contentForm.value.type as any,
      subject: contentForm.value.subject,
      grade: contentForm.value.grade,
      author: '当前用户',
      url: `/interactive/${Date.now()}/index.html`,
      tags: contentForm.value.tags,
      duration: contentForm.value.duration,
      rating: 0,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      featured: false,
      settings: {
        fullscreen: contentForm.value.settings.includes('fullscreen'),
        responsive: contentForm.value.settings.includes('responsive'),
        resize: contentForm.value.settings.includes('resize')
      }
    }

    contentList.value.unshift(newContent)
    ElMessage.success('互动内容上传成功')
    showUploadModal.value = false
    resetUploadForm()
  } catch (error) {
    console.error('上传失败:', error)
    ElMessage.error('上传失败')
  } finally {
    uploading.value = false
  }
}

const previewInNewWindow = () => {
  if (previewUrl.value) {
    window.open(previewUrl.value, '_blank')
  }
}

const handleClosePreview = () => {
  showPreviewModal.value = false
  currentPreviewContent.value = null
}

const reloadPreview = () => {
  const iframe = document.querySelector('.content-iframe') as HTMLIFrameElement
  if (iframe) {
    iframe.src = iframe.src
  }
}

const toggleFullscreen = () => {
  const iframe = document.querySelector('.content-iframe') as HTMLIFrameElement
  if (iframe) {
    if (iframe.requestFullscreen) {
      iframe.requestFullscreen()
    }
  }
}

const useInCourse = () => {
  if (currentPreviewContent.value) {
    assignToCourse(currentPreviewContent.value)
    showPreviewModal.value = false
  }
}

const handlePreviewLoad = () => {
  // 预览加载完成
}

const handlePreviewError = () => {
  ElMessage.error('预览加载失败')
}


const canProceed = computed(() => {
  if (uploadStep.value === 0) return uploadFiles.value.length > 0
  if (uploadStep.value === 1) return contentForm.value.title && contentForm.value.subject
  return true
})

const getTypeLabel = (type: string): string => {
  const types: Record<string, string> = {
    html: 'HTML单页',
    package: '互动包',
    simulation: '模拟器',
    game: '游戏'
  }
  return types[type] || type
}

const getTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    html: 'primary',
    package: 'success',
    simulation: 'warning',
    game: 'danger'
  }
  return colors[type] || 'info'
}

const getContentIcon = (type: string): string => {
  const icons: Record<string, string> = {
    html: 'Document',
    package: 'FolderOpened',
    simulation: 'Monitor',
    game: 'Trophy'
  }
  return icons[type] || 'Document'
}

// 预览和测试相关计算属性和方法
const hasTestResults = computed(() =>
  testResults.value.some(result => result.status !== 'pending')
)

const getTestStatusText = () => {
  switch (testStatus.value) {
    case 'idle': return '待测试'
    case 'running': return '测试中...'
    case 'success': return '测试完成'
    case 'failed': return '测试失败'
    default: return '未知状态'
  }
}

const getTestClass = (status: string) => {
  return {
    'test-item': true,
    'test-item--success': status === 'success',
    'test-item--failed': status === 'failed',
    'test-item--pending': status === 'pending'
  }
}

const getTestIcon = (status: string) => {
  switch (status) {
    case 'success': return 'SuccessFilled'
    case 'failed': return 'CircleCloseFilled'
    default: return 'Clock'
  }
}

const getPreviewStyle = () => {
  const styles: Record<string, string> = {}

  if (previewMode.value === 'mobile') {
    styles.width = '375px'
    styles.height = '667px'
    styles.border = '1px solid #ddd'
    styles.borderRadius = '8px'
  } else {
    styles.width = '100%'
    styles.height = '600px'
  }

  return styles
}

// 预览和测试相关方法
const openPreviewInNewTab = () => {
  if (selectedContent.value) {
    window.open(selectedContent.value.url, '_blank')
  }
}

const previewFullscreen = () => {
  const iframe = document.querySelector('.content-iframe') as HTMLIFrameElement
  if (iframe && iframe.requestFullscreen) {
    iframe.requestFullscreen()
  }
}

const previewReload = () => {
  const iframe = document.querySelector('.content-iframe') as HTMLIFrameElement
  if (iframe) {
    iframe.src = iframe.src
  }
}

const togglePreviewMode = () => {
  previewMode.value = previewMode.value === 'desktop' ? 'mobile' : 'desktop'
}

const toggleResponsive = () => {
  responsive.value = !responsive.value
}

const runTests = async () => {
  testStatus.value = 'running'

  // 重置所有测试状态
  testResults.value.forEach(result => {
    result.status = 'pending'
  })

  // 模拟测试过程
  for (let i = 0; i < testResults.value.length; i++) {
    await new Promise(resolve => setTimeout(resolve, 800))

    // 随机生成测试结果
    const success = Math.random() > 0.3
    testResults.value[i].status = success ? 'success' : 'failed'
  }

  // 设置最终状态
  const allSuccess = testResults.value.every(result => result.status === 'success')
  testStatus.value = allSuccess ? 'success' : 'failed'

  ElMessage[allSuccess ? 'success' : 'warning'](
    allSuccess ? '所有测试通过' : '部分测试未通过，请检查内容'
  )
}

const runAllTests = runTests

const exportTestReport = () => {
  const reportData = {
    content: selectedContent.value?.title,
    timestamp: new Date().toISOString(),
    results: testResults.value,
    status: testStatus.value,
    performance: performanceMetrics.value
  }

  const blob = new Blob([JSON.stringify(reportData, null, 2)], {
    type: 'application/json'
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `test-report-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  ElMessage.success('测试报告已导出')
}

const measurePerformance = async () => {
  // 模拟性能测量
  performanceMetrics.value = {
    loadTime: Math.floor(Math.random() * 1000) + 500,
    responseTime: Math.floor(Math.random() * 100) + 20,
    memoryUsage: Math.floor(Math.random() * 50) + 10,
    cpuUsage: Math.floor(Math.random() * 30) + 5
  }

  ElMessage.success('性能指标已更新')
}

const batchImport = () => {
  ElMessage.info('批量导入功能开发中')
}

// 侧边栏相关数据和方法
const recommendedResources = [
  {
    id: 1,
    title: 'HTML5 互动教程',
    description: '学习创建互动式HTML5内容',
    color: '#1890ff',
    icon: 'Document'
  },
  {
    id: 2,
    title: 'CSS3 动画库',
    description: '丰富的CSS3动画效果集合',
    color: '#52c41a',
    icon: 'VideoPlay'
  },
  {
    id: 3,
    title: 'JavaScript 框架',
    description: '轻量级JS交互框架',
    color: '#722ed1',
    icon: 'TrendCharts'
  }
]

// 侧边栏事件处理
const handleQuickAction = (action: string) => {
  switch (action) {
    case 'create':
      showUploadModal.value = true
      break
    case 'import':
      batchImport()
      break
    case 'export':
      batchExport()
      break
  }
}

const handleFilterChange = (filters: any) => {
  console.log('Experience filters changed:', filters)
  // 应用筛选逻辑
}

const handleResourceAction = (action: string, id: string | number) => {
  console.log('Resource action:', action, id)
  if (action === 'open') {
    openResource(recommendedResources.find(r => r.id === id))
  }
}

const handleCollaborationAction = (action: string, data: any) => {
  console.log('Collaboration action:', action, data)
}

const batchExport = () => {
  ElMessage.info('批量导出功能开发中...')
}

const openResource = (resource: any) => {
  if (resource) {
    ElMessage.info(`查看资源: ${resource.title}`)
  }
}

// 生命周期
onMounted(() => {
  // 初始化逻辑
})
</script>

<style scoped lang="scss">
.workspace-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-card {
  width: 100%;
  :deep(.edu-card__body-content) {
    padding: 16px;
  }
}

.summary-card__content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.summary-card__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-card__value {
  font-size: 22px;
  font-weight: 700;
  color: var(--edu-text-primary);
}

.summary-card__label {
  font-size: 13px;
  color: var(--edu-text-secondary);
}


.category-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(15, 23, 42, 0.04);
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
  color: inherit;

  &:hover {
    transform: translateX(4px);
    background: rgba(99, 102, 241, 0.12);
  }

  &.active {
    background: rgba(99, 102, 241, 0.12);
    color: var(--edu-primary-600);
  }
}

.category-icon {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.category-info {
  flex: 1;
  margin-left: 12px;
}

.category-name {
  font-weight: 600;
  color: var(--edu-text-primary);
}

.category-count {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.subject-filter {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.subject-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--edu-color-gray-50);
  }

  &.active {
    background-color: var(--edu-primary-50);
  }
}

.subject-count {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.usage-overview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.usage-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.usage-label {
  font-size: 13px;
  color: var(--edu-text-secondary);
}

.usage-value {
  font-weight: 600;
  color: var(--edu-text-primary);
}

.upload-history {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.history-icon {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.12);
  color: #4f46e5;

  &--upload {
    background: rgba(76, 175, 80, 0.12);
    color: #4caf50;
  }

  &--edit {
    background: rgba(249, 115, 22, 0.12);
    color: #f97316;
  }

  &--create {
    background: rgba(33, 150, 243, 0.12);
    color: #2196f3;
  }
}

.history-content {
  flex: 1;
}

.history-title {
  font-weight: 600;
  color: var(--edu-text-primary);
  margin-bottom: 4px;
}

.history-time {
  font-size: 12px;
  color: var(--edu-text-secondary);
}


.quick-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.stat-label {
  font-size: 13px;
  color: var(--edu-text-secondary);
}

.stat-value {
  font-weight: 600;
  color: var(--edu-text-primary);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(99, 102, 241, 0.12);
  color: #4f46e5;

  &--upload {
    background: rgba(76, 175, 80, 0.12);
    color: #4caf50;
  }

  &--edit {
    background: rgba(249, 115, 22, 0.12);
    color: #f97316;
  }

  &--publish {
    background: rgba(33, 150, 243, 0.12);
    color: #2196f3;
  }
}

.activity-content {
  flex: 1;
}

.activity-text {
  font-weight: 600;
  color: var(--edu-text-primary);
  margin-bottom: 4px;
}

.activity-time {
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.interactive-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-section {
  width: 100%;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.section-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0;
}

.section-description {
  margin: 0;
  color: var(--edu-text-secondary);
  font-size: 14px;
}

.section-actions {
  display: flex;
  gap: 12px;
}

:deep(.content-section__body) {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.content-card {
  background: var(--edu-color-white);
  border: 1px solid var(--edu-color-gray-200);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    transform: translateY(-4px);
  }

  &--featured {
    border-left: 4px solid var(--edu-primary-default);
  }
}

.card-thumbnail {
  position: relative;
  height: 200px;
  background: var(--edu-color-gray-100);
}

.thumbnail-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--edu-color-gray-400);
  font-size: 48px;
}

.thumbnail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.content-card:hover .thumbnail-overlay {
  opacity: 1;
}

.content-type-badge {
  position: absolute;
  top: 12px;
  right: 12px;
}

.card-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.content-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--edu-text-primary);
  margin: 0;
  line-height: 1.4;
}

.content-actions {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.content-card:hover .content-actions {
  opacity: 1;
}

.content-description {
  font-size: 13px;
  color: var(--edu-text-secondary);
  margin: 0;
  line-height: 1.4;
}

.content-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.content-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-item {
  font-size: 11px;
}

.content-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--edu-color-gray-100);
}

.content-stats {
  display: flex;
  gap: 16px;
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating .is-active {
  color: #f39c12;
}

.rating-value {
  font-size: 12px;
  color: var(--edu-text-secondary);
  margin-left: 4px;
}

.content-actions-footer {
  display: flex;
  gap: 8px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.upload-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.upload-form {
  margin-top: 24px;
}

.upload-step {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-area {
  border: 2px dashed var(--edu-color-gray-300);
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  background: var(--edu-color-gray-50);
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--edu-primary-400);
  }
}

.config-step {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-step {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preview-container {
  border: 1px solid var(--edu-color-gray-200);
  border-radius: 8px;
  overflow: hidden;
}

.preview-iframe {
  width: 100%;
  height: 400px;
  border: none;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: var(--edu-text-secondary);
  font-size: 48px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.preview-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--edu-color-gray-50);
  border-radius: 8px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.preview-frame {
  border: 1px solid var(--edu-color-gray-200);
  border-radius: 8px;
  overflow: hidden;
}

.content-iframe {
  width: 100%;
  height: 600px;
  border: none;
}

.preview-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 600px;
  color: var(--edu-text-secondary);
  font-size: 48px;
}

.assign-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.unit {
  margin-left: 8px;
  color: var(--edu-text-secondary);
}

// 响应式设计
@media (max-width: 1200px) {
  .section-actions {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .workspace-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .category-item {
    padding: 10px 12px;
  }

  .content-card {
    margin-bottom: 16px;
  }

  .upload-area {
    padding: 24px;
  }
}

// 深色模式适配
[data-theme="dark"] {
  .category-item {
    background: rgba(255, 255, 255, 0.05);

    &:hover {
      background: rgba(99, 102, 241, 0.2);
    }

    &.active {
      background: rgba(99, 102, 241, 0.2);
    }
  }

  .subject-item {
    &:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    &.active {
      background: rgba(99, 102, 241, 0.2);
    }
  }

  .content-card {
    background: var(--edu-color-gray-800);
    border-color: var(--edu-color-gray-600);
  }

  .suggestion-item {
    border-color: var(--edu-color-gray-600);

    &:hover {
      background: rgba(99, 102, 241, 0.2);
      border-color: var(--edu-primary-400);
    }
  }

  .upload-area {
    background: rgba(255, 255, 255, 0.02);
    border-color: var(--edu-color-gray-600);
  }
}

// 动画效果
.content-card,
.suggestion-item,
.category-item {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.content-card:hover,
.suggestion-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
