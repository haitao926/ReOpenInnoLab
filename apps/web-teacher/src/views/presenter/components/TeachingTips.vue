<template>
  <div class="teaching-tips">
    <div class="tips-header">
      <h3>
        <el-icon><Guide /></el-icon>
        教学提示
      </h3>
      <div class="header-actions">
        <el-button size="small" circle @click="refreshTips">
          <el-icon><Refresh /></el-icon>
        </el-button>
        <el-button size="small" circle @click="toggleSettings">
          <el-icon><Setting /></el-icon>
        </el-button>
      </div>
    </div>

    <!-- 提示筛选 -->
    <div class="tips-filters">
      <el-tabs v-model="activeTab" @tab-click="filterTips">
        <el-tab-pane label="全部" name="all">
          <template #label>
            <span class="tab-label">
              <el-icon><List /></el-icon>
              全部
              <el-badge :value="allTipsCount" :max="99" class="tab-badge" />
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="AI建议" name="ai">
          <template #label>
            <span class="tab-label">
              <el-icon><Magic /></el-icon>
              AI建议
              <el-badge :value="aiTipsCount" :max="99" class="tab-badge" />
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="时间管理" name="timing">
          <template #label>
            <span class="tab-label">
              <el-icon><Timer /></el-icon>
              时间管理
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="学生互动" name="engagement">
          <template #label>
            <span class="tab-label">
              <el-icon><User /></el-icon>
              学生互动
            </span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="内容重点" name="content">
          <template #label>
            <span class="tab-label">
              <el-icon><Document /></el-icon>
              内容重点
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 提示内容 -->
    <div class="tips-content">
      <!-- 优先级提示 -->
      <div v-if="priorityTips.length > 0" class="priority-tips">
        <div class="priority-header">
          <el-icon><Warning /></el-icon>
          <span>重要提醒</span>
        </div>
        <div
          v-for="tip in priorityTips"
          :key="tip.id"
          class="tip-item priority"
        >
          <div class="tip-content">
            <div class="tip-title">{{ tip.title }}</div>
            <div class="tip-description">{{ tip.description }}</div>
            <div v-if="tip.actionable" class="tip-actions">
              <el-button
                size="small"
                type="danger"
                @click="executeTipAction(tip)"
              >
                {{ tip.actionText || '立即处理' }}
              </el-button>
            </div>
          </div>
          <div class="tip-meta">
            <el-tag :type="getTipPriorityColor(tip.priority)" size="small">
              {{ getTipPriorityLabel(tip.priority) }}
            </el-tag>
            <el-button
              size="small"
              text
              @click="dismissTip(tip)"
            >
              忽略
            </el-button>
          </div>
        </div>
      </div>

      <!-- 常规提示 -->
      <div class="regular-tips">
        <div
          v-for="tip in filteredTips"
          :key="tip.id"
          class="tip-item"
          :class="[tip.type, { dismissed: tip.dismissed }]"
        >
          <div class="tip-icon">
            <el-icon>
              <component :is="getTipIcon(tip.type)" />
            </el-icon>
          </div>

          <div class="tip-content">
            <div class="tip-title">{{ tip.title }}</div>
            <div class="tip-description">{{ tip.description }}</div>

            <!-- 进度指示器 -->
            <div v-if="tip.progress" class="tip-progress">
              <div class="progress-info">
                <span>{{ tip.progress.label }}</span>
                <span>{{ tip.progress.value }}%</span>
              </div>
              <el-progress
                :percentage="tip.progress.value"
                :stroke-width="4"
                :show-text="false"
                :color="getProgressColor(tip.progress.value)"
              />
            </div>

            <!-- 操作按钮 -->
            <div v-if="tip.actionable" class="tip-actions">
              <el-button
                size="small"
                :type="tip.actionType || 'primary'"
                @click="executeTipAction(tip)"
              >
                {{ tip.actionText }}
              </el-button>
              <el-button
                v-if="tip.secondaryAction"
                size="small"
                text
                @click="executeSecondaryAction(tip)"
              >
                {{ tip.secondaryActionText }}
              </el-button>
            </div>

            <!-- 时间戳 -->
            <div class="tip-timestamp">
              {{ formatTime(tip.timestamp) }}
            </div>
          </div>

          <div class="tip-actions-right">
            <el-dropdown @command="handleTipCommand">
              <el-button size="small" text>
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{ action: 'dismiss', tip }">
                    忽略此提示
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'snooze', tip }">
                    稍后提醒
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'share', tip }">
                    分享给同事
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'details', tip }">
                    查看详情
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredTips.length === 0" class="empty-state">
          <el-icon size="48"><Guide /></el-icon>
          <p>{{ activeTab === 'all' ? '暂无教学提示' : '该分类暂无提示' }}</p>
        </div>
      </div>
    </div>

    <!-- 设置对话框 -->
    <el-dialog
      v-model="showSettings"
      title="教学提示设置"
      width="500px"
    >
      <div class="settings-content">
        <div class="setting-item">
          <div class="setting-label">自动提示</div>
          <el-switch v-model="settings.autoTips" />
        </div>
        <div class="setting-item">
          <div class="setting-label">优先级提醒</div>
          <el-switch v-model="settings.priorityAlerts" />
        </div>
        <div class="setting-item">
          <div class="setting-label">时间间隔</div>
          <el-select v-model="settings.tipInterval" style="width: 120px">
            <el-option label="1分钟" :value="1" />
            <el-option label="2分钟" :value="2" />
            <el-option label="5分钟" :value="5" />
            <el-option label="10分钟" :value="10" />
          </el-select>
        </div>
        <div class="setting-item">
          <div class="setting-label">提示类型</div>
          <el-checkbox-group v-model="settings.enabledTypes">
            <el-checkbox label="ai">AI建议</el-checkbox>
            <el-checkbox label="timing">时间管理</el-checkbox>
            <el-checkbox label="engagement">学生互动</el-checkbox>
            <el-checkbox label="content">内容重点</el-checkbox>
          </el-checkbox-group>
        </div>
      </div>
      <template #footer>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="saveSettings">保存设置</el-button>
      </template>
    </el-dialog>

    <!-- 提示详情对话框 -->
    <el-dialog
      v-model="showDetails"
      :title="selectedTip?.title"
      width="600px"
    >
      <div v-if="selectedTip" class="tip-details">
        <div class="detail-section">
          <h4>详细说明</h4>
          <p>{{ selectedTip.description }}</p>
          <div v-if="selectedTip.details" class="details-content">
            {{ selectedTip.details }}
          </div>
        </div>

        <div v-if="selectedTip.data" class="detail-section">
          <h4>相关数据</h4>
          <div class="data-grid">
            <div
              v-for="(value, key) in selectedTip.data"
              :key="key"
              class="data-item"
            >
              <span class="data-label">{{ key }}:</span>
              <span class="data-value">{{ value }}</span>
            </div>
          </div>
        </div>

        <div v-if="selectedTip.recommendations" class="detail-section">
          <h4>建议措施</h4>
          <ul class="recommendations-list">
            <li v-for="rec in selectedTip.recommendations" :key="rec">
              {{ rec }}
            </li>
          </ul>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Guide,
  Refresh,
  Setting,
  List,
  Magic,
  Timer,
  User,
  Document,
  Warning,
  MoreFilled,
  Clock,
  ChatDotRound,
  DataAnalysis,
  Trophy
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface TeachingTip {
  id: string
  type: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  actionable: boolean
  actionText?: string
  actionType?: 'primary' | 'success' | 'warning' | 'danger'
  secondaryAction?: boolean
  secondaryActionText?: string
  dismissed?: boolean
  timestamp: Date
  progress?: {
    label: string
    value: number
  }
  details?: string
  data?: Record<string, any>
  recommendations?: string[]
}

const emit = defineEmits<{
  tipAction: [tip: TeachingTip, action: string]
}>()

// 响应式数据
const tips = ref<TeachingTip[]>([])
const activeTab = ref('all')
const showSettings = ref(false)
const showDetails = ref(false)
const selectedTip = ref<TeachingTip | null>(null)
let tipsInterval: NodeJS.Timeout | null = null

const settings = ref({
  autoTips: true,
  priorityAlerts: true,
  tipInterval: 2,
  enabledTypes: ['ai', 'timing', 'engagement', 'content']
})

// 计算属性
const filteredTips = computed(() => {
  let filtered = tips.value.filter(tip => !tip.dismissed)

  if (activeTab.value !== 'all') {
    filtered = filtered.filter(tip => tip.type === activeTab.value)
  }

  return filtered
})

const priorityTips = computed(() => {
  return filteredTips.value.filter(tip => tip.priority === 'high')
})

const allTipsCount = computed(() => tips.value.filter(tip => !tip.dismissed).length)
const aiTipsCount = computed(() => tips.value.filter(tip => tip.type === 'ai' && !tip.dismissed).length)

// 提示图标映射
const getTipIcon = (type: string) => {
  const iconMap = {
    'ai': Magic,
    'timing': Clock,
    'engagement': ChatDotRound,
    'content': Document,
    'performance': DataAnalysis,
    'achievement': Trophy
  }
  return iconMap[type] || Guide
}

// 优先级颜色
const getTipPriorityColor = (priority: string) => {
  const colorMap = {
    'high': 'danger',
    'medium': 'warning',
    'low': 'info'
  }
  return colorMap[priority] || 'info'
}

const getTipPriorityLabel = (priority: string) => {
  const labelMap = {
    'high': '高优先级',
    'medium': '中优先级',
    'low': '低优先级'
  }
  return labelMap[priority] || '普通'
}

// 进度条颜色
const getProgressColor = (value: number) => {
  if (value < 30) return 'var(--edu-color-error-default)'
  if (value < 70) return 'var(--edu-color-warning-default)'
  return 'var(--edu-color-success-default)'
}

// 时间格式化
const formatTime = (timestamp: Date): string => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const minutes = Math.floor(diff / (1000 * 60))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  return timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 方法
const addTip = (tip: Partial<TeachingTip>) => {
  const fullTip: TeachingTip = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    priority: 'medium',
    actionable: false,
    dismissed: false,
    timestamp: new Date(),
    ...tip
  } as TeachingTip

  tips.value.unshift(fullTip)

  // 限制提示数量
  if (tips.value.length > 50) {
    tips.value = tips.value.slice(0, 50)
  }
}

const filterTips = () => {
  // 筛选逻辑已在计算属性中处理
}

const refreshTips = () => {
  // 模拟刷新提示
  generateMockTips()
  ElMessage.success('教学提示已刷新')
}

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const saveSettings = () => {
  showSettings.value = false
  ElMessage.success('设置已保存')

  // 重新启动定时器
  if (tipsInterval) {
    clearInterval(tipsInterval)
  }
  if (settings.value.autoTips) {
    startTipsInterval()
  }
}

const startTipsInterval = () => {
  if (tipsInterval) {
    clearInterval(tipsInterval)
  }

  tipsInterval = setInterval(() => {
    if (settings.value.autoTips) {
      generateMockTips()
    }
  }, settings.value.tipInterval * 60 * 1000)
}

const executeTipAction = (tip: TeachingTip) => {
  emit('tipAction', tip, 'primary')
  ElMessage.success(`执行操作: ${tip.title}`)
}

const executeSecondaryAction = (tip: TeachingTip) => {
  emit('tipAction', tip, 'secondary')
  ElMessage.info(`执行次要操作: ${tip.title}`)
}

const dismissTip = (tip: TeachingTip) => {
  tip.dismissed = true
  ElMessage.success('提示已忽略')
}

const snoozeTip = (tip: TeachingTip) => {
  tip.dismissed = true
  setTimeout(() => {
    tip.dismissed = false
  }, 5 * 60 * 1000) // 5分钟后重新显示
  ElMessage.success('提示已稍后提醒')
}

const shareTip = (tip: TeachingTip) => {
  // 实现分享功能
  ElMessage.info('分享功能开发中...')
}

const showTipDetails = (tip: TeachingTip) => {
  selectedTip.value = tip
  showDetails.value = true
}

const handleTipCommand = ({ action, tip }: { action: string, tip: TeachingTip }) => {
  switch (action) {
    case 'dismiss':
      dismissTip(tip)
      break
    case 'snooze':
      snoozeTip(tip)
      break
    case 'share':
      shareTip(tip)
      break
    case 'details':
      showTipDetails(tip)
      break
  }
}

// 生成模拟提示数据
const generateMockTips = () => {
  const mockTips = [
    {
      type: 'ai',
      title: '学生参与度下降',
      description: '过去5分钟内学生互动减少了30%，建议增加互动环节。',
      priority: 'high' as const,
      actionable: true,
      actionText: '查看详情',
      actionType: 'warning' as const,
      data: {
        '参与学生': '12/20',
        '互动次数': '15次',
        '平均时长': '2.3分钟'
      },
      recommendations: [
        '提问引导学生思考',
        '增加小组讨论环节',
        '使用互动工具活跃气氛'
      ]
    },
    {
      type: 'timing',
      title: '时间进度提醒',
      description: '当前环节已进行15分钟，建议准备进入下一环节。',
      priority: 'medium' as const,
      actionable: true,
      actionText: '进入下一环节',
      progress: {
        label: '当前环节进度',
        value: 75
      }
    },
    {
      type: 'engagement',
      title: '学生提问活跃',
      description: '王五同学连续提出了3个高质量问题，建议给予表扬。',
      priority: 'low' as const,
      actionable: true,
      actionText: '表扬学生',
      secondaryAction: true,
      secondaryActionText: '查看问题'
    },
    {
      type: 'content',
      title: '重点内容强调',
      description: '第三章的概念是本节课的重点，建议详细讲解。',
      priority: 'medium' as const,
      actionable: false,
      details: '这一部分内容在考试中占比30%，学生需要重点理解公式推导过程和应用场景。'
    },
    {
      type: 'ai',
      title: '个性化教学建议',
      description: '根据学生答题情况，建议补充讲解第2.3节的内容。',
      priority: 'medium' as const,
      actionable: true,
      actionText: '查看答题统计',
      data: {
        '正确率': '65%',
        '易错点': '公式应用',
        '建议时间': '5分钟'
      }
    }
  ]

  // 随机选择一个提示添加
  if (Math.random() > 0.7) {
    const randomTip = mockTips[Math.floor(Math.random() * mockTips.length)]
    addTip(randomTip)
  }
}

// 生命周期
onMounted(() => {
  generateMockTips()
  if (settings.value.autoTips) {
    startTipsInterval()
  }
})

onUnmounted(() => {
  if (tipsInterval) {
    clearInterval(tipsInterval)
  }
})

// 暴露方法供父组件调用
defineExpose({
  addTip,
  refreshTips,
  generateMockTips
})
</script>

<style scoped lang="scss">
.teaching-tips {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--edu-color-white);
  border-radius: var(--radius-base);
  box-shadow: var(--edu-shadow-sm);
}

.tips-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--edu-color-gray-200);

  h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--edu-color-gray-900);
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.tips-filters {
  border-bottom: 1px solid var(--edu-color-gray-200);

  .tab-label {
    display: flex;
    align-items: center;
    gap: 4px;

    .tab-badge {
      margin-left: 4px;
    }
  }
}

.tips-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.priority-tips {
  margin-bottom: 16px;

  .priority-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding: 8px 12px;
    background: var(--edu-color-error-light);
    border: 1px solid var(--edu-color-error-light);
    border-radius: 4px;
    color: var(--edu-color-error-default);
    font-weight: 500;
  }

  .tip-item.priority {
    background: var(--edu-color-error-light);
    border-color: var(--edu-color-error-light);
  }
}

.regular-tips {
  .tip-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 8px;
    border: 1px solid var(--edu-color-gray-200);
    transition: all 0.3s ease;

    &:hover {
      background: var(--edu-color-gray-50);
      border-color: var(--edu-color-gray-200);
    }

    &.dismissed {
      opacity: 0.5;
      background: var(--edu-color-gray-50);
    }

    &.ai {
      border-left: 3px solid var(--edu-primary-500);
    }

    &.timing {
      border-left: 3px solid var(--edu-color-warning-default);
    }

    &.engagement {
      border-left: 3px solid var(--edu-color-success-default);
    }

    &.content {
      border-left: 3px solid var(--edu-color-gray-500);
    }
  }
}

.tip-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  font-size: 14px;

  .ai & {
    background: var(--edu-primary-500);
  }

  .timing & {
    background: var(--edu-color-warning-default);
  }

  .engagement & {
    background: var(--edu-color-success-default);
  }

  .content & {
    background: var(--edu-color-gray-500);
  }
}

.tip-content {
  flex: 1;
  min-width: 0;
}

.tip-title {
  font-weight: 500;
  color: var(--edu-color-gray-900);
  font-size: 14px;
  margin-bottom: 4px;
}

.tip-description {
  color: var(--edu-color-gray-600);
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 8px;
}

.tip-progress {
  margin: 8px 0;

  .progress-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    font-size: 12px;
    color: var(--edu-color-gray-500);
  }
}

.tip-actions {
  display: flex;
  gap: 8px;
  margin: 8px 0;
  flex-wrap: wrap;
}

.tip-timestamp {
  font-size: 11px;
  color: var(--edu-color-gray-400);
  margin-top: 8px;
}

.tip-actions-right {
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: var(--edu-color-gray-500);

  .el-icon {
    margin-bottom: 16px;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

.settings-content {
  .setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .setting-label {
      font-weight: 500;
      color: var(--edu-color-gray-900);
    }
  }
}

.tip-details {
  .detail-section {
    margin-bottom: 20px;

    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: var(--edu-color-gray-900);
      border-bottom: 1px solid var(--edu-color-gray-200);
      padding-bottom: 8px;
    }

    p {
      margin: 0 0 12px 0;
      color: var(--edu-color-gray-600);
      line-height: 1.6;
    }
  }

  .details-content {
    color: var(--edu-color-gray-600);
    line-height: 1.6;
    padding: 12px;
    background: var(--edu-color-gray-50);
    border-radius: 4px;
  }

  .data-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;

    .data-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 12px;
      background: var(--edu-color-gray-50);
      border-radius: 4px;

      .data-label {
        color: var(--edu-color-gray-500);
        font-size: 13px;
      }

      .data-value {
        color: var(--edu-color-gray-900);
        font-weight: 500;
      }
    }
  }

  .recommendations-list {
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      position: relative;
      padding-left: 16px;
      margin-bottom: 8px;
      color: var(--edu-color-gray-600);
      line-height: 1.5;

      &:before {
        content: '•';
        position: absolute;
        left: 0;
        color: var(--edu-primary-500);
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .tips-header {
    padding: 12px;
  }

  .tips-content {
    padding: 8px;
  }

  .tip-item {
    padding: 8px;
    gap: 8px;
  }

  .tip-content {
    .tip-title {
      font-size: 13px;
    }

    .tip-description {
      font-size: 12px;
    }
  }

  .tip-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .settings-content {
    .setting-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
  }

  .data-grid {
    grid-template-columns: 1fr;
  }
}
</style>
