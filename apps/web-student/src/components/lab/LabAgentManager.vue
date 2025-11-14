<template>
  <div class="lab-agent-manager">
    <!-- Agent状态卡片 -->
    <div class="agent-status-card">
      <div class="status-header">
        <div class="status-info">
          <h4>实验代理</h4>
          <el-tag
            :type="agentStatus?.status === 'online' ? 'success' : 'danger'"
            size="small"
          >
            <el-icon>
              <component :is="getStatusIcon(agentStatus?.status)" />
            </el-icon>
            {{ getStatusText(agentStatus?.status) }}
          </el-tag>
        </div>
        <div class="status-actions">
          <el-button
            size="small"
            @click="refreshAgentStatus"
            :loading="refreshing"
          >
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>

      <div class="status-content">
        <!-- Agent详细信息 -->
        <div v-if="agentStatus" class="agent-details">
          <div class="detail-item">
            <span class="label">版本:</span>
            <span class="value">{{ agentStatus.version || '未知' }}</span>
          </div>
          <div class="detail-item">
            <span class="label">最后心跳:</span>
            <span class="value">{{ formatTime(agentStatus.lastHeartbeat) }}</span>
          </div>
          <div class="detail-item">
            <span class="label">运行时长:</span>
            <span class="value">{{ formatUptime(agentStatus.lastHeartbeat) }}</span>
          </div>
          <div v-if="agentStatus.capabilities" class="detail-item">
            <span class="label">支持功能:</span>
            <div class="capabilities">
              <el-tag
                v-for="cap in agentStatus.capabilities"
                :key="cap"
                size="small"
                type="info"
              >
                {{ cap }}
              </el-tag>
            </div>
          </div>
          <div v-if="agentStatus.config" class="detail-item">
            <span class="label">配置信息:</span>
            <div class="config-info">
              <div class="config-item">
                <span>最大会话数:</span>
                <span>{{ agentStatus.config.maxSessions }}</span>
              </div>
              <div class="config-item">
                <span>默认运行时:</span>
                <span>{{ agentStatus.config.defaultRuntime }}</span>
              </div>
              <div class="config-item">
                <span>资源限制:</span>
                <span>{{ agentStatus.config.resourceLimits.cpu }} CPU, {{ agentStatus.config.resourceLimits.memory }} 内存</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-agent">
          <el-empty description="Agent未连接">
            <el-button type="primary" @click="connectAgent">连接Agent</el-button>
          </el-empty>
        </div>
      </div>
    </div>

    <!-- 连接配置卡片 -->
    <div class="connection-card">
      <div class="card-header">
        <h4>连接配置</h4>
        <el-switch
          v-model="autoReconnect"
          active-text="自动重连"
          inactive-text="手动连接"
          @change="handleAutoReconnectChange"
        />
      </div>

      <div class="connection-content">
        <div class="config-form">
          <el-form :model="connectionConfig" label-width="100px" size="small">
            <el-form-item label="Agent地址">
              <el-input
                v-model="connectionConfig.url"
                placeholder="ws://localhost:8080"
                :disabled="agentStatus?.status === 'online'"
              />
            </el-form-item>
            <el-form-item label="认证Token">
              <el-input
                v-model="connectionConfig.token"
                type="password"
                placeholder="可选的认证令牌"
                show-password
                :disabled="agentStatus?.status === 'online'"
              />
            </el-form-item>
            <el-form-item label="心跳间隔">
              <el-input-number
                v-model="connectionConfig.heartbeatInterval"
                :min="5"
                :max="60"
                :step="5"
                suffix-text="秒"
                :disabled="agentStatus?.status === 'online'"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                @click="connectAgent"
                :loading="connecting"
                :disabled="agentStatus?.status === 'online'"
              >
                {{ agentStatus?.status === 'online' ? '已连接' : '连接' }}
              </el-button>
              <el-button
                v-if="agentStatus?.status === 'online'"
                type="danger"
                @click="disconnectAgent"
                :loading="disconnecting"
              >
                断开连接
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </div>

    <!-- 实时通信测试 -->
    <div class="communication-card">
      <div class="card-header">
        <h4>通信测试</h4>
        <el-button size="small" @click="clearMessages">
          <el-icon><Delete /></el-icon>
          清空
        </el-button>
      </div>

      <div class="communication-content">
        <div class="message-area">
          <div class="message-list" ref="messageListRef">
            <div
              v-for="message in messages"
              :key="message.id"
              class="message-item"
              :class="`message-${message.type}`"
            >
              <div class="message-header">
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                <span class="message-direction">
                  <el-icon>
                    <component :is="message.type === 'sent' ? 'Upload' : 'Download'" />
                  </el-icon>
                  {{ message.type === 'sent' ? '发送' : '接收' }}
                </span>
              </div>
              <div class="message-content">
                <pre>{{ message.content }}</pre>
              </div>
            </div>

            <div v-if="messages.length === 0" class="messages-empty">
              暂无通信记录
            </div>
          </div>

          <div class="message-input">
            <el-input
              v-model="testMessage"
              type="textarea"
              :rows="3"
              placeholder="输入测试消息 (JSON格式)"
              @keydown.ctrl.enter="sendMessage"
            />
            <div class="input-actions">
              <el-button
                type="primary"
                @click="sendMessage"
                :disabled="!testMessage.trim() || !isConnected"
                :loading="sending"
              >
                <el-icon><Position /></el-icon>
                发送 (Ctrl+Enter)
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Agent命令执行 -->
    <div v-if="agentStatus?.status === 'online'" class="commands-card">
      <div class="card-header">
        <h4>Agent命令</h4>
      </div>

      <div class="commands-content">
        <div class="command-categories">
          <el-tabs v-model="activeCommandTab">
            <!-- 系统命令 -->
            <el-tab-pane label="系统" name="system">
              <div class="command-grid">
                <el-button
                  v-for="cmd in systemCommands"
                  :key="cmd.name"
                  size="small"
                  @click="executeCommand(cmd)"
                  :loading="commandLoading[cmd.name]"
                >
                  {{ cmd.label }}
                </el-button>
              </div>
            </el-tab-pane>

            <!-- 会话管理 -->
            <el-tab-pane label="会话" name="sessions">
              <div class="command-grid">
                <el-button
                  v-for="cmd in sessionCommands"
                  :key="cmd.name"
                  size="small"
                  @click="executeCommand(cmd)"
                  :loading="commandLoading[cmd.name]"
                >
                  {{ cmd.label }}
                </el-button>
              </div>
            </el-tab-pane>

            <!-- 监控命令 -->
            <el-tab-pane label="监控" name="monitoring">
              <div class="command-grid">
                <el-button
                  v-for="cmd in monitoringCommands"
                  :key="cmd.name"
                  size="small"
                  @click="executeCommand(cmd)"
                  :loading="commandLoading[cmd.name]"
                >
                  {{ cmd.label }}
                </el-button>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Refresh,
  CircleCheck,
  CircleClose,
  Warning,
  Delete,
  Upload,
  Download,
  Position
} from '@element-plus/icons-vue'

import { useLabStore } from '@/stores/lab'
import type { LabAgentStatus } from '@/types/course'

const labStore = useLabStore()

// 响应式数据
const refreshing = ref(false)
const connecting = ref(false)
const disconnecting = ref(false)
const sending = ref(false)
const autoReconnect = ref(true)
const testMessage = ref('')
const messages = ref<any[]>([])
const activeCommandTab = ref('system')
const commandLoading = ref<Record<string, boolean>>({})

// 连接配置
const connectionConfig = ref({
  url: 'ws://localhost:8080',
  token: '',
  heartbeatInterval: 30
})

// 引用
const messageListRef = ref<HTMLElement>()

// 计算属性
const agentStatus = computed(() => labStore.agentStatus)
const isConnected = computed(() => agentStatus.value?.status === 'online')

// 预定义命令
const systemCommands = [
  { name: 'ping', label: 'Ping', description: '测试连接' },
  { name: 'status', label: '状态', description: '获取详细状态' },
  { name: 'version', label: '版本信息', description: '获取Agent版本' },
  { name: 'config', label: '配置信息', description: '获取Agent配置' },
  { name: 'restart', label: '重启Agent', description: '重启Agent服务' }
]

const sessionCommands = [
  { name: 'list_sessions', label: '列出会话', description: '获取所有活动会话' },
  { name: 'session_count', label: '会话统计', description: '获取会话数量统计' },
  { name: 'cleanup_sessions', label: '清理会话', description: '清理超时会话' },
  { name: 'session_details', label: '会话详情', description: '获取特定会话详情' }
]

const monitoringCommands = [
  { name: 'resource_usage', label: '资源使用', description: '获取资源使用情况' },
  { name: 'performance_stats', label: '性能统计', description: '获取性能统计数据' },
  { name: 'error_logs', label: '错误日志', description: '获取错误日志' },
  { name: 'health_check', label: '健康检查', description: '执行健康检查' }
]

// 方法
const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'online':
      return CircleCheck
    case 'offline':
      return CircleClose
    case 'starting':
    case 'error':
      return Warning
    default:
      return CircleClose
  }
}

const getStatusText = (status?: string) => {
  switch (status) {
    case 'online':
      return '在线'
    case 'offline':
      return '离线'
    case 'starting':
      return '启动中'
    case 'error':
      return '错误'
    default:
      return '未知'
  }
}

const formatTime = (date?: Date): string => {
  if (!date) return '-'
  return date.toLocaleString('zh-CN')
}

const formatUptime = (lastHeartbeat?: Date): string => {
  if (!lastHeartbeat) return '-'

  const now = Date.now()
  const uptime = now - lastHeartbeat.getTime()

  if (uptime < 60000) {
    return '< 1分钟'
  }

  const minutes = Math.floor(uptime / 60000)
  const hours = Math.floor(minutes / 60)

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`
  }

  return `${minutes}分钟`
}

// Agent连接管理
const refreshAgentStatus = async () => {
  refreshing.value = true
  try {
    // 模拟刷新状态
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 更新Agent状态
    const mockStatus: LabAgentStatus = {
      status: Math.random() > 0.2 ? 'online' : 'offline',
      version: '1.0.0',
      lastHeartbeat: new Date(),
      capabilities: ['jupyter', 'python', 'ai', 'simulation'],
      resources: {
        cpu: Math.round(Math.random() * 50),
        memory: Math.round(Math.random() * 2 * 1024 * 1024 * 1024),
        disk: Math.round(Math.random() * 20),
        network: Math.round(Math.random() * 1024 * 1024)
      },
      config: {
        maxSessions: 10,
        defaultRuntime: 'python3',
        resourceLimits: {
          cpu: '2',
          memory: '4Gi',
          disk: '10Gi'
        },
        allowedRuntimes: ['python', 'r', 'javascript'],
        securityPolicies: ['sandbox', 'resource-limits']
      }
    }

    labStore.updateAgentStatus(mockStatus)
    ElMessage.success('Agent状态已更新')

  } catch (error) {
    ElMessage.error('刷新失败')
  } finally {
    refreshing.value = false
  }
}

const connectAgent = async () => {
  if (isConnected.value) return

  connecting.value = true
  try {
    // 模拟连接过程
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 连接成功
    const status: LabAgentStatus = {
      status: 'online',
      version: '1.0.0',
      lastHeartbeat: new Date(),
      capabilities: ['jupyter', 'python', 'ai', 'simulation'],
      resources: {
        cpu: 10,
        memory: 1024 * 1024 * 1024,
        disk: 5,
        network: 512 * 1024
      },
      config: {
        maxSessions: 10,
        defaultRuntime: 'python3',
        resourceLimits: {
          cpu: '2',
          memory: '4Gi',
          disk: '10Gi'
        },
        allowedRuntimes: ['python', 'r', 'javascript'],
        securityPolicies: ['sandbox', 'resource-limits']
      }
    }

    labStore.updateAgentStatus(status)
    ElMessage.success('Agent连接成功')

    addMessage('received', JSON.stringify({ type: 'connected', status }, null, 2))

  } catch (error) {
    ElMessage.error('Agent连接失败')
    addMessage('error', `连接失败: ${error instanceof Error ? error.message : '未知错误'}`)
  } finally {
    connecting.value = false
  }
}

const disconnectAgent = async () => {
  if (!isConnected.value) return

  disconnecting.value = true
  try {
    // 模拟断开连接
    await new Promise(resolve => setTimeout(resolve, 1000))

    labStore.updateAgentStatus({
      status: 'offline',
      version: '1.0.0',
      lastHeartbeat: new Date()
    })

    ElMessage.info('Agent已断开连接')
    addMessage('received', JSON.stringify({ type: 'disconnected' }, null, 2))

  } catch (error) {
    ElMessage.error('断开连接失败')
  } finally {
    disconnecting.value = false
  }
}

const handleAutoReconnectChange = (value: boolean) => {
  if (value && !isConnected.value) {
    // 自动重连
    connectAgent()
  }
}

// 消息通信
const sendMessage = async () => {
  if (!testMessage.value.trim() || !isConnected.value) return

  sending.value = true
  try {
    let messageContent = testMessage.value.trim()

    // 尝试解析为JSON，如果失败则作为纯文本
    try {
      const parsed = JSON.parse(messageContent)
      messageContent = JSON.stringify(parsed, null, 2)
    } catch {
      // 保持原样
    }

    // 添加发送消息
    addMessage('sent', messageContent)

    // 模拟发送和接收响应
    await new Promise(resolve => setTimeout(resolve, 500))

    const response = generateMockResponse(testMessage.value.trim())
    addMessage('received', JSON.stringify(response, null, 2))

    testMessage.value = ''

  } catch (error) {
    ElMessage.error('发送失败')
    addMessage('error', `发送失败: ${error instanceof Error ? error.message : '未知错误'}`)
  } finally {
    sending.value = false
  }
}

const addMessage = (type: 'sent' | 'received' | 'error', content: string) => {
  messages.value.push({
    id: Date.now().toString(),
    type,
    content,
    timestamp: new Date()
  })

  // 限制消息数量
  if (messages.value.length > 100) {
    messages.value = messages.value.slice(-100)
  }

  // 自动滚动到底部
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

const clearMessages = () => {
  messages.value = []
  ElMessage.info('通信记录已清空')
}

const generateMockResponse = (message: string): any => {
  try {
    const parsed = JSON.parse(message)
    return {
      type: 'response',
      request: parsed,
      status: 'success',
      data: `Echo: ${JSON.stringify(parsed)}`,
      timestamp: new Date().toISOString()
    }
  } catch {
    return {
      type: 'response',
      status: 'success',
      data: `Echo: ${message}`,
      timestamp: new Date().toISOString()
    }
  }
}

// 命令执行
const executeCommand = async (command: any) => {
  if (!isConnected.value) {
    ElMessage.warning('请先连接Agent')
    return
  }

  commandLoading.value[command.name] = true
  try {
    const commandMessage = {
      type: 'command',
      command: command.name,
      params: {},
      timestamp: new Date().toISOString()
    }

    addMessage('sent', JSON.stringify(commandMessage, null, 2))

    // 模拟命令执行
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    const response = generateCommandResponse(command.name)
    addMessage('received', JSON.stringify(response, null, 2))

    ElMessage.success(`命令 "${command.label}" 执行成功`)

  } catch (error) {
    ElMessage.error(`命令执行失败: ${error instanceof Error ? error.message : '未知错误'}`)
    addMessage('error', `命令执行失败: ${error instanceof Error ? error.message : '未知错误'}`)
  } finally {
    commandLoading.value[command.name] = false
  }
}

const generateCommandResponse = (commandName: string): any => {
  const responses: Record<string, any> = {
    ping: { type: 'pong', timestamp: new Date().toISOString() },
    status: { status: 'running', uptime: '2h 30m', version: '1.0.0' },
    version: { version: '1.0.0', build: '20240115-1430', git_commit: 'abc123' },
    config: { config: connectionConfig.value },
    restart: { status: 'restarting', eta: '30s' },
    list_sessions: { sessions: [], total: 0 },
    session_count: { total: 0, running: 0, stopped: 0 },
    cleanup_sessions: { cleaned: 0, errors: [] },
    session_details: { session: null },
    resource_usage: { cpu: 15, memory: 1024, disk: 5, network: 100 },
    performance_stats: { requests_per_second: 10, avg_response_time: 150 },
    error_logs: { logs: [], total: 0 },
    health_check: { status: 'healthy', checks: [] }
  }

  return responses[commandName] || { status: 'unknown_command', command: commandName }
}

// 生命周期
onMounted(() => {
  // 初始化时刷新Agent状态
  refreshAgentStatus()
})

onUnmounted(() => {
  // 清理资源
})
</script>

<style scoped lang="scss">
.lab-agent-manager {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: var(--edu-bg-color);
  border-radius: 12px;
}

.agent-status-card,
.connection-card,
.communication-card,
.commands-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  border: 1px solid var(--edu-border-color);
  overflow: hidden;
  backdrop-filter: blur(8px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(15, 23, 42, 0.04);
  border-bottom: 1px solid var(--edu-border-color);

  h4 {
    font-size: 16px;
    font-weight: 600;
    color: var(--edu-text-primary);
    margin: 0;
  }
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-content,
.connection-content,
.communication-content,
.commands-content {
  padding: 20px;
}

.agent-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .label {
    color: var(--edu-text-secondary);
    font-size: 14px;
    font-weight: 500;
  }

  .value {
    color: var(--edu-text-primary);
    font-weight: 600;
    font-size: 14px;
  }
}

.capabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.config-info {
  background: rgba(15, 23, 42, 0.04);
  border-radius: 8px;
  padding: 12px;
  margin-top: 4px;
}

.config-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 13px;

  span:first-child {
    color: var(--edu-text-secondary);
  }

  span:last-child {
    color: var(--edu-text-primary);
    font-weight: 500;
  }
}

.empty-agent {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.message-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--edu-border-color);
  border-radius: 8px;
  padding: 12px;
  background: rgba(15, 23, 42, 0.02);
}

.message-item {
  margin-bottom: 12px;
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid;

  &.message-sent {
    background: rgba(99, 102, 241, 0.1);
    border-left-color: var(--edu-primary-500);
  }

  &.message-received {
    background: rgba(34, 197, 94, 0.1);
    border-left-color: var(--edu-success-500);
  }

  &.message-error {
    background: rgba(239, 68, 68, 0.1);
    border-left-color: var(--edu-danger-500);
  }
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--edu-text-secondary);
}

.message-direction {
  display: flex;
  align-items: center;
  gap: 4px;
}

.message-content {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.messages-empty {
  text-align: center;
  color: var(--edu-text-disabled);
  padding: 40px 0;
  font-style: italic;
}

.message-input {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
}

.command-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

// 响应式设计
@media (max-width: 768px) {
  .lab-agent-manager {
    padding: 12px;
    gap: 12px;
  }

  .card-header {
    padding: 12px 16px;
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .status-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .status-content,
  .connection-content,
  .communication-content,
  .commands-content {
    padding: 16px;
  }

  .command-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 8px;
  }
}
</style>