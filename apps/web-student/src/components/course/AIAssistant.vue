<template>
  <div class="ai-assistant-panel">
    <div class="ai-header">
      <h3>AI 学习助手</h3>
      <el-tag size="small" type="success" effect="plain">在线</el-tag>
    </div>
    
    <div class="ai-messages" ref="messagesRef">
      <div v-if="messages.length === 0" class="empty-state">
        <p>👋 你好！我是你的 AI 助教。</p>
        <p>遇到不懂的问题随时问我，或者选中课文内容让我解释。</p>
      </div>
      
      <div 
        v-for="(msg, index) in messages" 
        :key="index"
        class="message-item"
        :class="msg.role"
      >
        <div class="message-content">{{ msg.content }}</div>
      </div>
    </div>

    <div class="ai-input">
      <el-input
        v-model="input"
        placeholder="输入问题..."
        @keyup.enter="sendMessage"
      >
        <template #append>
          <el-button @click="sendMessage">发送</el-button>
        </template>
      </el-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const input = ref('')
const messages = ref<Message[]>([])
const messagesRef = ref<HTMLElement | null>(null)

const sendMessage = () => {
  if (!input.value.trim()) return

  // 1. 添加用户消息
  messages.value.push({
    role: 'user',
    content: input.value
  })

  // 2. 模拟 AI 回复 (实际应调用 API)
  setTimeout(() => {
    messages.value.push({
      role: 'assistant',
      content: `这里是针对 "${input.value}" 的智能解答模拟。在实际系统中，这里会连接 AI Service。`
    })
    
    // 滚动到底部
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight
    }
  }, 1000)

  input.value = ''
}
</script>

<style scoped lang="scss">
.ai-assistant-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: var(--edu-spacing-md);
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--edu-spacing-md);
  
  h3 {
    margin: 0;
    font-size: var(--edu-text-base);
  }
}

.ai-messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--edu-spacing-md);
  margin-bottom: var(--edu-spacing-md);
  padding-right: 4px;
}

.message-item {
  max-width: 85%;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: var(--edu-text-sm);
  line-height: 1.5;
  
  &.user {
    align-self: flex-end;
    background: var(--edu-primary);
    color: white;
    border-bottom-right-radius: 2px;
  }
  
  &.assistant {
    align-self: flex-start;
    background: var(--edu-bg-tertiary);
    color: var(--edu-text-primary);
    border-bottom-left-radius: 2px;
  }
}

.empty-state {
  text-align: center;
  color: var(--edu-text-secondary);
  font-size: var(--edu-text-sm);
  padding-top: 20px;
}

.ai-input {
  margin-top: auto;
}
</style>
