<template>
  <div class="poll-player">
    <div v-if="loading" class="loading">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else-if="poll" class="poll-content">
      <!-- Before Voting -->
      <div v-if="!hasVoted" class="poll-voting">
        <div class="poll-header">
          <h3>{{ poll.question }}</h3>
          <p v-if="poll.description" class="poll-description">{{ poll.description }}</p>
        </div>

        <div class="poll-options">
          <el-radio-group v-if="poll.type === 'single'" v-model="selectedOption" size="large">
            <el-radio
              v-for="(option, index) in poll.options"
              :key="index"
              :label="index"
              class="poll-option"
            >
              <span class="option-text">{{ option.text }}</span>
            </el-radio>
          </el-radio-group>

          <el-checkbox-group v-else v-model="selectedOptions" size="large">
            <el-checkbox
              v-for="(option, index) in poll.options"
              :key="index"
              :label="index"
              class="poll-option"
            >
              <span class="option-text">{{ option.text }}</span>
            </el-checkbox>
          </el-checkbox-group>
        </div>

        <div class="poll-actions">
          <el-button
            type="primary"
            size="large"
            @click="submitVote"
            :disabled="!canSubmit"
          >
            提交投票
          </el-button>
          <el-button v-if="allowSkip" size="large" @click="skipPoll">
            跳过
          </el-button>
        </div>
      </div>

      <!-- After Voting -->
      <div v-else class="poll-results">
        <div class="results-header">
          <h3>投票结果</h3>
          <div class="results-summary">
            <span class="total-votes">{{ totalVotes }} 人参与</span>
            <span v-if="poll.type === 'multiple'" class="multiple-info">
              （多选，每人可选 {{ poll.maxSelections || poll.options.length }} 项）
            </span>
          </div>
        </div>

        <div class="results-options">
          <div
            v-for="(option, index) in poll.options"
            :key="index"
            class="result-option"
          >
            <div class="option-info">
              <span class="option-text">{{ option.text }}</span>
              <span class="option-votes">{{ getOptionVotes(index) }} 票</span>
              <span class="option-percentage">{{ getOptionPercentage(index) }}%</span>
            </div>
            <div class="option-bar">
              <div
                class="option-fill"
                :style="{ width: `${getOptionPercentage(index)}%` }"
                :class="{ 'option-fill--selected': isOptionSelected(index) }"
              ></div>
            </div>
          </div>
        </div>

        <div v-if="showLiveResults" class="live-indicator">
          <el-tag type="success" size="small">
            <el-icon><Timer /></el-icon>
            实时更新中
          </el-tag>
        </div>

        <div v-if="userVote" class="your-vote">
          <p>您的投票：
            <span v-if="poll.type === 'single'">{{ getOptionText(userVote[0]) }}</span>
            <span v-else>
              {{ userVote.map(i => getOptionText(i)).join(', ') }}
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Timer } from '@element-plus/icons-vue'

const props = defineProps<{
    poll: {
      question: string
      description?: string
      type: 'single' | 'multiple'
      options: Array<{
        text: string
        votes?: number
      }>
      maxSelections?: number
      allowAnonymous?: boolean
      showResults?: boolean
    }
    config?: {
      allowSkip?: boolean
      showLiveResults?: boolean
      anonymous?: boolean
    }
    initialVotes?: Array<number>
  }>()

const emit = defineEmits<{
    complete: [result: any]
    vote: [vote: any]
  }>()

// 状态
const loading = ref(false)
const selectedOption = ref<number>(-1)
const selectedOptions = ref<number[]>([])
const hasVoted = ref(false)
const userVote = ref<number[]>([])
const votes = ref<number[]>(props.poll.options.map(() => 0))

// 计算属性
const canSubmit = computed(() => {
  if (props.poll.type === 'single') {
    return selectedOption.value >= 0
  } else {
    const min = 1
    const max = props.poll.maxSelections || props.poll.options.length
    return selectedOptions.value.length >= min && selectedOptions.value.length <= max
  }
})

const allowSkip = computed(() => {
  return props.config?.allowSkip === true
})

const showLiveResults = computed(() => {
  return props.config?.showLiveResults === true
})

const totalVotes = computed(() => {
  return votes.value.reduce((sum, count) => sum + count, 0)
})

// 方法
const submitVote = () => {
  if (!canSubmit.value) return

  const vote = props.poll.type === 'single'
    ? [selectedOption.value]
    : [...selectedOptions.value]

  // Update votes
  vote.forEach(index => {
    votes.value[index]++
  })

  userVote.value = vote
  hasVoted.value = true

  const result = {
    type: props.poll.type,
    vote: vote,
    totalVotes: totalVotes.value,
    votes: [...votes.value]
  }

  emit('vote', result)
  emit('complete', result)
}

const skipPoll = () => {
  hasVoted.value = true
  emit('complete', { skipped: true })
}

const getOptionVotes = (index: number): number => {
  return votes.value[index] || 0
}

const getOptionPercentage = (index: number): number => {
  if (totalVotes.value === 0) return 0
  return Math.round((getOptionVotes(index) / totalVotes.value) * 100)
}

const getOptionText = (index: number): string => {
  return props.poll.options[index]?.text || ''
}

const isOptionSelected = (index: number): boolean => {
  return userVote.value.includes(index)
}

// Load initial votes if provided
if (props.initialVotes) {
  props.initialVotes.forEach(index => {
    if (index >= 0 && index < votes.value.length) {
      votes.value[index]++
    }
  })
  hasVoted.value = true
  userVote.value = [...props.initialVotes]
}

// Watch for external vote updates (for live results)
watch(
  () => props.poll.options,
  (newOptions) => {
    if (newOptions && showLiveResults.value) {
      votes.value = newOptions.map(opt => opt.votes || 0)
    }
  },
  { deep: true }
)
</script>

<style lang="scss" scoped>
  .poll-player {
    padding: var(--spacing-lg);
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .loading {
    flex: 1;
  }

  .poll-content {
    max-width: 600px;
    width: 100%;
    margin: 0 auto;
  }

  .poll-voting,
  .poll-results {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  .poll-header {
    text-align: center;

    h3 {
      margin: 0 0 var(--spacing-base) 0;
      color: var(--text-primary);
      font-size: var(--font-size-xl);
    }

    .poll-description {
      margin: 0;
      color: var(--text-secondary);
      line-height: var(--line-height-relaxed);
    }
  }

  .poll-options {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-base);
  }

  .poll-option {
    width: 100%;
    padding: var(--spacing-lg);
    border: 2px solid var(--edu-color-gray-200);
    border-radius: var(--radius-lg);
    transition: all var(--edu-duration-fast);
    cursor: pointer;

    &:hover {
      border-color: var(--edu-primary-300);
      background-color: var(--edu-primary-50);
    }

    .option-text {
      font-size: var(--font-size-base);
      color: var(--text-primary);
    }
  }

  .poll-actions {
    display: flex;
    justify-content: center;
    gap: var(--spacing-base);
  }

  .results-header {
    text-align: center;

    h3 {
      margin: 0 0 var(--spacing-base) 0;
      color: var(--text-primary);
    }

    .results-summary {
      color: var(--text-secondary);
      font-size: var(--font-size-sm);

      .multiple-info {
        margin-left: var(--spacing-xs);
      }
    }
  }

  .results-options {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-base);
  }

  .result-option {
    .option-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--spacing-xs);

      .option-text {
        flex: 1;
        color: var(--text-primary);
      }

      .option-votes {
        margin: 0 var(--spacing-base);
        color: var(--text-secondary);
        font-weight: var(--font-weight-medium);
      }

      .option-percentage {
        color: var(--edu-primary-500);
        font-weight: var(--font-weight-bold);
        min-width: 50px;
        text-align: right;
      }
    }

    .option-bar {
      height: 32px;
      background-color: var(--edu-color-gray-200);
      border-radius: var(--radius-base);
      overflow: hidden;
      position: relative;

      .option-fill {
        height: 100%;
        background-color: var(--edu-primary-500);
        transition: width var(--edu-duration-normal) var(--edu-easing-in-out);
        position: relative;

        &--selected {
          background-color: var(--edu-color-success-500);
        }

        &::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, rgba(255,255,255,0.2) 0%, transparent 100%);
        }
      }
    }
  }

  .live-indicator {
    display: flex;
    justify-content: center;
    margin-top: var(--spacing-lg);
  }

  .your-vote {
    text-align: center;
    padding-top: var(--spacing-lg);
    border-top: 1px solid var(--edu-color-gray-200);
    color: var(--text-secondary);

    span {
      color: var(--edu-primary-500);
      font-weight: var(--font-weight-medium);
    }
  }
</style>