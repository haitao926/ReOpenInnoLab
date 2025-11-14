<template>
  <div class="security-indicator" :class="`security-indicator--${riskLevel}`">
    <div class="indicator-icon">
      <el-icon>
        <component :is="getRiskIcon(riskLevel)" />
      </el-icon>
    </div>
    <div class="indicator-content">
      <div class="indicator-title">{{ getRiskTitle(riskLevel) }}</div>
      <div class="indicator-description">{{ getRiskDescription(riskLevel) }}</div>
    </div>
    <div class="indicator-actions" v-if="activeThreats.length > 0">
      <el-button size="small" type="primary" @click="$emit('showDetails')">
        查看详情
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Shield, Warning, InfoFilled } from '@element-plus/icons-vue'

interface Props {
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  activeThreats: string[]
  recommendations: string[]
}

const props = defineProps<Props>()

defineEmits<{
  showDetails: []
}>()

const getRiskIcon = (level: string) => {
  const icons = {
    low: Shield,
    medium: Warning,
    high: Warning,
    critical: Warning
  }
  return icons[level as keyof typeof icons] || Shield
}

const getRiskTitle = (level: string) => {
  const titles = {
    low: '安全环境',
    medium: '低风险',
    high: '高风险',
    critical: '极高风险'
  }
  return titles[level as keyof typeof titles] || '安全环境'
}

const getRiskDescription = (level: string) => {
  const descriptions = {
    low: '当前登录环境安全',
    medium: '检测到轻微异常',
    high: '检测到安全威胁',
    critical: '检测到严重安全威胁'
  }
  return descriptions[level as keyof typeof descriptions] || '当前登录环境安全'
}
</script>

<style scoped lang="scss">
.security-indicator {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease;

  &--low {
    background: rgba(72, 187, 120, 0.1);
    border: 1px solid rgba(72, 187, 120, 0.2);
    color: #38a169;
  }

  &--medium {
    background: rgba(237, 137, 54, 0.1);
    border: 1px solid rgba(237, 137, 54, 0.2);
    color: #ed8936;
  }

  &--high, &--critical {
    background: rgba(252, 129, 129, 0.1);
    border: 1px solid rgba(252, 129, 129, 0.2);
    color: #fc8181;
  }
}

.indicator-icon {
  font-size: 1.5rem;
}

.indicator-content {
  flex: 1;
}

.indicator-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.indicator-description {
  font-size: 0.9rem;
  opacity: 0.8;
}
</style>