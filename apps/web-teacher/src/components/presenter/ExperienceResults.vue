<template>
  <div class="experience-results">
    <!-- 测验结果 -->
    <div v-if="type === 'quiz'" class="quiz-results">
      <div class="results-summary">
        <div class="summary-cards">
          <div class="summary-card">
            <div class="card-value">{{ stats.totalParticipants }}</div>
            <div class="card-label">参与人数</div>
          </div>
          <div class="summary-card">
            <div class="card-value">{{ Math.round(stats.averageScore) }}%</div>
            <div class="card-label">平均得分率</div>
          </div>
          <div class="summary-card">
            <div class="card-value">{{ stats.completionRate }}%</div>
            <div class="card-label">完成率</div>
          </div>
          <div class="summary-card">
            <div class="card-value">{{ formatDuration(stats.avgDuration) }}</div>
            <div class="card-label">平均用时</div>
          </div>
        </div>
      </div>

      <div class="score-distribution">
        <h4>分数分布</h4>
        <div class="distribution-chart">
          <div class="distribution-bars">
            <div
              v-for="(range, index) in scoreRanges"
              :key="index"
              class="distribution-item"
            >
              <div class="range-label">{{ range.label }}</div>
              <div class="range-bar">
                <div
                  class="range-fill"
                  :style="{ height: `${getDistributionHeight(range.count)}%` }"
                ></div>
              </div>
              <div class="range-count">{{ range.count }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="question-results">
        <h4>题目详细结果</h4>
        <div class="questions-grid">
          <div
            v-for="(question, index) in questions"
            :key="index"
            class="question-result-card"
          >
            <div class="question-header">
              <span class="question-number">Q{{ index + 1 }}</span>
              <span class="question-type">{{ getQuestionTypeLabel(question.type) }}</span>
              <span class="question-points">{{ question.points }} 分</span>
            </div>
            <div class="question-content">{{ question.text }}</div>
            <div class="question-stats">
              <div class="stat-row">
                <span>正确率: {{ question.correctRate }}%</span>
                <span>正确: {{ question.correctCount }}</span>
                <span>错误: {{ question.incorrectCount }}</span>
              </div>
              <div v-if="question.type === 'multiple'" class="options-analysis">
                <div
                  v-for="(option, optIndex) in question.options"
                  :key="optIndex"
                  class="option-analysis"
                >
                  <span class="option-label">{{ String.fromCharCode(65 + optIndex) }}</span>
                  <span class="option-text">{{ option.text }}</span>
                  <span class="option-percentage">
                    {{ getPercentage(option.selectionCount, stats.totalParticipants) }}%
                  </span>
                  <div class="option-bar">
                    <div
                      class="option-fill"
                      :style="{ width: `${getPercentage(option.selectionCount, stats.totalParticipants)}%` }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 投票结果 -->
    <div v-else-if="type === 'poll'" class="poll-results">
      <div
        v-for="(question, qIndex) in pollQuestions"
        :key="qIndex"
        class="poll-question-result"
      >
        <h4>{{ question.text }}</h4>
        <div class="poll-chart">
          <div class="poll-total">
            <span>总投票数: {{ question.totalVotes }}</span>
            <span>参与率: {{ getPercentage(question.totalVotes, totalParticipants) }}%</span>
          </div>
          <div class="poll-options">
            <div
              v-for="(option, index) in question.options"
              :key="index"
              class="poll-option-result"
            >
              <div class="option-info">
                <span class="option-index">{{ index + 1 }}.</span>
                <span class="option-text">{{ option.text }}</span>
                <span class="option-votes">{{ option.votes }} 票</span>
                <span class="option-percentage">
                  {{ getPercentage(option.votes, question.totalVotes) }}%
                </span>
              </div>
              <div class="option-visual">
                <div class="option-bar">
                  <div
                    class="option-fill"
                    :style="{ width: `${getPercentage(option.votes, question.totalVotes)}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 视频结果 -->
    <div v-else-if="type === 'video'" class="video-results">
      <div class="video-summary">
        <div class="summary-cards">
          <div class="summary-card">
            <div class="card-value">{{ stats.totalViews }}</div>
            <div class="card-label">观看人数</div>
          </div>
          <div class="summary-card">
            <div class="card-value">{{ formatDuration(stats.avgWatchTime) }}</div>
            <div class="card-label">平均观看时长</div>
          </div>
          <div class="summary-card">
            <div class="card-value">{{ stats.completionRate }}%</div>
            <div class="card-label">完成率</div>
          </div>
          <div class="summary-card">
            <div class="card-value">{{ stats.totalInteractions }}</div>
            <div class="card-label">总互动次数</div>
          </div>
        </div>
      </div>

      <div class="video-timeline">
        <h4>观看进度分析</h4>
        <div class="timeline-container">
          <div class="timeline-header">
            <span>时间进度</span>
            <span>观看人数</span>
          </div>
          <div class="timeline-bars">
            <div
              v-for="(point, index) in timelineData"
              :key="index"
              class="timeline-point"
              :style="{ left: `${(point.time / totalDuration) * 100}%` }"
            >
              <div class="timeline-bar" :style="{ height: `${(point.viewers / stats.totalViews) * 100}%` }"></div>
              <div class="timeline-tooltip">
                <div>{{ formatDuration(point.time) }}</div>
                <div>{{ point.viewers }} 人观看</div>
              </div>
            </div>
          </div>
          <div class="timeline-labels">
            <span>0:00</span>
            <span>{{ formatDuration(totalDuration) }}</span>
          </div>
        </div>
      </div>

      <div class="interaction-points">
        <h4>互动热点</h4>
        <div class="interactions-grid">
          <div
            v-for="(interaction, index) in interactionPoints"
            :key="index"
            class="interaction-card"
          >
            <div class="interaction-time">{{ formatDuration(interaction.time) }}</div>
            <div class="interaction-type">{{ interaction.type }}</div>
            <div class="interaction-count">{{ interaction.count }} 次</div>
            <div class="interaction-percentage">
              {{ getPercentage(interaction.count, stats.totalInteractions) }}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 自定义 HTML 结果 -->
    <div v-else-if="type === 'custom'" class="custom-results">
      <div class="custom-summary">
        <div class="summary-cards">
          <div class="summary-card">
            <div class="card-value">{{ stats.uniqueVisitors }}</div>
            <div class="card-label">独立访客</div>
          </div>
          <div class="summary-card">
            <div class="card-value">{{ stats.totalSessions }}</div>
            <div class="card-label">总会话数</div>
          </div>
          <div class="summary-card">
            <div class="card-value">{{ formatDuration(stats.avgSessionDuration) }}</div>
            <div class="card-label">平均会话时长</div>
          </div>
          <div class="summary-card">
            <div class="card-value">{{ stats.bounceRate }}%</div>
            <div class="card-label">跳出率</div>
          </div>
        </div>
      </div>

      <div class="event-analytics">
        <h4>事件分析</h4>
        <div class="event-chart">
          <div
            v-for="(event, index) in eventAnalytics"
            :key="index"
            class="event-row"
          >
            <div class="event-name">{{ event.name }}</div>
            <div class="event-bar-container">
              <div
                class="event-bar"
                :style="{ width: `${getPercentage(event.count, maxEventCount)}%` }"
              ></div>
            </div>
            <div class="event-count">{{ event.count }}</div>
            <div class="event-users">{{ event.uniqueUsers }} 用户</div>
          </div>
        </div>
      </div>

      <div class="user-flow">
        <h4>用户流向</h4>
        <div class="flow-diagram">
          <div class="flow-step">
            <div class="step-circle">开始</div>
            <div class="step-count">{{ stats.startUsers }} 人</div>
          </div>
          <div class="flow-arrow">→</div>
          <div
            v-for="(step, index) in userFlowSteps"
            :key="index"
            class="flow-step"
          >
            <div class="step-circle">{{ step.name }}</div>
            <div class="step-count">{{ step.users }} 人</div>
            <div class="step-rate">
              {{ getPercentage(step.users, stats.startUsers) }}%
            </div>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step">
            <div class="step-circle">完成</div>
            <div class="step-count">{{ stats.completionUsers }} 人</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ExperienceApiService } from '@/api/experience'

const props = defineProps<{
    runId: string
    type: string
  }>()

// 状态
const stats = ref<any>({})
const questions = ref<any[]>([])
const pollQuestions = ref<any[]>([])
const scoreRanges = ref<any[]>([])
const totalParticipants = ref(0)
const totalDuration = ref(0)
const timelineData = ref<any[]>([])
const interactionPoints = ref<any[]>([])
const eventAnalytics = ref<any[]>([])
const maxEventCount = ref(0)
const userFlowSteps = ref<any[]>([])

// 计算属性
const getDistributionHeight = (count: number): number => {
  const maxCount = Math.max(...scoreRanges.value.map(r => r.count))
  return maxCount > 0 ? (count / maxCount) * 100 : 0
}

// 方法
const loadResults = async () => {
  try {
    const results = await ExperienceApiService.getExperienceRunResults(props.runId)

    // 基础统计
    stats.value = results.summary || {}
    totalParticipants.value = results.summary?.totalParticipants || 0
    totalDuration.value = results.summary?.duration || 0

    // 根据类型加载不同数据
    if (props.type === 'quiz') {
      loadQuizResults(results)
    } else if (props.type === 'poll') {
      loadPollResults(results)
    } else if (props.type === 'video') {
      loadVideoResults(results)
    } else if (props.type === 'custom') {
      loadCustomResults(results)
    }
  } catch (error) {
    console.error('加载体验结果失败:', error)
  }
}

const loadQuizResults = (results: any) => {
  questions.value = results.questions || []

  // 生成分数范围
  const scores = results.scores || []
  const ranges = [
    { label: '90-100', min: 90, max: 100, count: 0 },
    { label: '80-89', min: 80, max: 89, count: 0 },
    { label: '70-79', min: 70, max: 79, count: 0 },
    { label: '60-69', min: 60, max: 69, count: 0 },
    { label: '0-59', min: 0, max: 59, count: 0 }
  ]

  scores.forEach((score: number) => {
    const range = ranges.find(r => score >= r.min && score <= r.max)
    if (range) range.count++
  })

  scoreRanges.value = ranges
}

const loadPollResults = (results: any) => {
  pollQuestions.value = results.questions || []
}

const loadVideoResults = (results: any) => {
  timelineData.value = results.timeline || []
  interactionPoints.value = results.interactions || []
}

const loadCustomResults = (results: any) => {
  eventAnalytics.value = results.events || []
  maxEventCount.value = Math.max(...eventAnalytics.value.map((e: any) => e.count), 1)
  userFlowSteps.value = results.userFlow || []
}

const getQuestionTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    single: '单选题',
    multiple: '多选题',
    'true-false': '判断题',
    fill: '填空题',
    essay: '简答题'
  }
  return labels[type] || type
}

const getPercentage = (value: number, total: number): number => {
  return total > 0 ? Math.round((value / total) * 100) : 0
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours > 0 ? `${hours}:` : ''}${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

// 生命周期
onMounted(() => {
  loadResults()
})
</script>

<style lang="scss" scoped>
  .experience-results {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xl);
  }

  // 通用样式
  .results-summary {
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--spacing-base);

      .summary-card {
        text-align: center;
        padding: var(--spacing-lg);
        background-color: var(--edu-color-gray-50);
        border-radius: var(--radius-lg);

        .card-value {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--edu-primary-500);
          margin-bottom: var(--spacing-xs);
        }

        .card-label {
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
        }
      }
    }
  }

  // 测验结果
  .quiz-results {
    .score-distribution {
      h4 {
        margin: 0 0 var(--spacing-base) 0;
        color: var(--text-primary);
      }

      .distribution-chart {
        .distribution-bars {
          display: flex;
          align-items: end;
          justify-content: space-around;
          height: 200px;
          background-color: var(--edu-color-gray-50);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);

          .distribution-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: var(--spacing-sm);

            .range-label {
              font-size: var(--font-size-xs);
              color: var(--text-secondary);
            }

            .range-bar {
              width: 40px;
              height: 120px;
              background-color: var(--edu-color-gray-200);
              border-radius: var(--radius-base);
              position: relative;
              overflow: hidden;

              .range-fill {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background-color: var(--edu-primary-500);
                transition: height var(--edu-duration-normal) var(--edu-easing-in-out);
              }
            }

            .range-count {
              font-weight: var(--font-weight-medium);
              color: var(--text-primary);
            }
          }
        }
      }
    }

    .question-results {
      h4 {
        margin: 0 0 var(--spacing-base) 0;
        color: var(--text-primary);
      }

      .questions-grid {
        display: grid;
        gap: var(--spacing-lg);

        .question-result-card {
          padding: var(--spacing-lg);
          border: 1px solid var(--edu-color-gray-200);
          border-radius: var(--radius-lg);

          .question-header {
            display: flex;
            align-items: center;
            gap: var(--spacing-base);
            margin-bottom: var(--spacing-base);

            .question-number {
              width: 32px;
              height: 32px;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: var(--edu-primary-500);
              color: white;
              border-radius: var(--radius-full);
              font-weight: var(--font-weight-bold);
            }

            .question-type,
            .question-points {
              font-size: var(--font-size-sm);
              color: var(--text-secondary);
            }
          }

          .question-content {
            margin-bottom: var(--spacing-base);
            color: var(--text-primary);
          }

          .question-stats {
            .stat-row {
              display: flex;
              gap: var(--spacing-lg);
              font-size: var(--font-size-sm);
              color: var(--text-secondary);
              margin-bottom: var(--spacing-sm);
            }

            .options-analysis {
              .option-analysis {
                display: grid;
                grid-template-columns: 40px 1fr 80px 1fr;
                gap: var(--spacing-sm);
                align-items: center;
                margin-bottom: var(--spacing-xs);

                .option-label {
                  font-weight: var(--font-weight-bold);
                  color: var(--edu-primary-500);
                }

                .option-bar {
                  height: 8px;
                  background-color: var(--edu-color-gray-200);
                  border-radius: var(--radius-full);
                  overflow: hidden;

                  .option-fill {
                    height: 100%;
                    background-color: var(--edu-primary-500);
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  // 投票结果
  .poll-results {
    .poll-question-result {
      margin-bottom: var(--spacing-xl);

      h4 {
        margin: 0 0 var(--spacing-base) 0;
        color: var(--text-primary);
      }

      .poll-total {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--spacing-base);
        font-size: var(--font-size-sm);
        color: var(--text-secondary);
      }

      .poll-option-result {
        margin-bottom: var(--spacing-base);

        .option-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--spacing-sm);

          .option-index {
            font-weight: var(--font-weight-medium);
            color: var(--text-primary);
          }

          .option-text {
            flex: 1;
            margin: 0 var(--spacing-sm);
          }

          .option-votes,
          .option-percentage {
            font-weight: var(--font-weight-medium);
            color: var(--edu-primary-500);
          }
        }

        .option-visual {
          .option-bar {
            height: 32px;
            background-color: var(--edu-color-gray-200);
            border-radius: var(--radius-base);
            overflow: hidden;

            .option-fill {
              height: 100%;
              background-color: var(--edu-primary-500);
              transition: width var(--edu-duration-normal) var(--edu-easing-in-out);
            }
          }
        }
      }
    }
  }

  // 视频结果
  .video-results {
    .video-timeline {
      h4 {
        margin: 0 0 var(--spacing-base) 0;
        color: var(--text-primary);
      }

      .timeline-container {
        .timeline-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: var(--spacing-sm);
          font-size: var(--font-size-sm);
          color: var(--text-secondary);
        }

        .timeline-bars {
          position: relative;
          height: 200px;
          background-color: var(--edu-color-gray-50);
          border-radius: var(--radius-lg);
          overflow: hidden;

          .timeline-point {
            position: absolute;
            bottom: 0;
            transform: translateX(-50%);

            .timeline-bar {
              width: 4px;
              background-color: var(--edu-primary-500);
              transition: height var(--edu-duration-normal) var(--edu-easing-in-out);
            }

            &:hover .timeline-tooltip {
              opacity: 1;
            }
          }

          .timeline-tooltip {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--text-primary);
            color: white;
            padding: var(--spacing-xs) var(--spacing-sm);
            border-radius: var(--radius-base);
            font-size: var(--font-size-xs);
            white-space: nowrap;
            opacity: 0;
            transition: opacity var(--edu-duration-fast);
            pointer-events: none;

            &::after {
              content: '';
              position: absolute;
              top: 100%;
              left: 50%;
              transform: translateX(-50%);
              border: 4px solid transparent;
              border-top-color: var(--text-primary);
            }
          }
        }

        .timeline-labels {
          display: flex;
          justify-content: space-between;
          margin-top: var(--spacing-sm);
          font-size: var(--font-size-xs);
          color: var(--text-tertiary);
        }
      }
    }

    .interaction-points {
      h4 {
        margin: 0 0 var(--spacing-base) 0;
        color: var(--text-primary);
      }

      .interactions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: var(--spacing-base);

        .interaction-card {
          padding: var(--spacing-base);
          background-color: var(--edu-color-gray-50);
          border-radius: var(--radius-lg);
          text-align: center;

          .interaction-time {
            font-weight: var(--font-weight-bold);
            color: var(--edu-primary-500);
            margin-bottom: var(--spacing-xs);
          }

          .interaction-type {
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
            margin-bottom: var(--spacing-xs);
          }

          .interaction-count {
            font-size: var(--font-size-lg);
            font-weight: var(--font-weight-medium);
            color: var(--text-primary);
          }

          .interaction-percentage {
            font-size: var(--font-size-xs);
            color: var(--text-tertiary);
          }
        }
      }
    }
  }

  // 自定义结果
  .custom-results {
    .event-analytics {
      h4 {
        margin: 0 0 var(--spacing-base) 0;
        color: var(--text-primary);
      }

      .event-chart {
        .event-row {
          display: grid;
          grid-template-columns: 150px 1fr 60px 80px;
          gap: var(--spacing-sm);
          align-items: center;
          margin-bottom: var(--spacing-sm);

          .event-name {
            font-size: var(--font-size-sm);
            color: var(--text-primary);
          }

          .event-bar-container {
            height: 24px;
            background-color: var(--edu-color-gray-200);
            border-radius: var(--radius-base);
            overflow: hidden;

            .event-bar {
              height: 100%;
              background-color: var(--edu-primary-500);
              transition: width var(--edu-duration-normal) var(--edu-easing-in-out);
            }
          }

          .event-count,
          .event-users {
            font-size: var(--font-size-sm);
            color: var(--text-secondary);
            text-align: right;
          }
        }
      }
    }

    .user-flow {
      h4 {
        margin: 0 0 var(--spacing-base) 0;
        color: var(--text-primary);
      }

      .flow-diagram {
        display: flex;
        align-items: center;
        justify-content: space-around;
        overflow-x: auto;
        padding: var(--spacing-lg);
        background-color: var(--edu-color-gray-50);
        border-radius: var(--radius-lg);

        .flow-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-sm);
          flex-shrink: 0;

          .step-circle {
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--edu-primary-500);
            color: white;
            border-radius: var(--radius-full);
            font-weight: var(--font-weight-bold);
            font-size: var(--font-size-xs);
          }

          .step-count {
            font-weight: var(--font-weight-medium);
            color: var(--text-primary);
          }

          .step-rate {
            font-size: var(--font-size-xs);
            color: var(--text-secondary);
          }
        }

        .flow-arrow {
          font-size: var(--font-size-xl);
          color: var(--edu-color-gray-400);
          margin: 0 var(--spacing-sm);
        }
      }
    }
  }
</style>