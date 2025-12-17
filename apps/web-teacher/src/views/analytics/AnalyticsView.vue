<template>
  <TeacherWorkspaceLayout
    title="学习分析"
    subtitle="数据驱动教学优化"
    :leftCollapsible="false"
    :rightCollapsible="true"
    v-model:rightCollapsed="rightCollapsed"
  >
    <!-- 左侧筛选 -->
    <template #left>
      <div class="filter-sidebar">
        <!-- 维度筛选 -->
        <div class="filter-section">
          <div class="filter-title">分析维度</div>
          <div class="filter-menu">
            <div class="filter-item" :class="{ active: viewType === 'course' }" @click="viewType = 'course'">
              <el-icon><Reading /></el-icon> <span>课程分析</span>
            </div>
            <div class="filter-item" :class="{ active: viewType === 'student' }" @click="viewType = 'student'">
              <el-icon><User /></el-icon> <span>学生分析</span>
            </div>
            <div class="filter-item" :class="{ active: viewType === 'ai' }" @click="viewType = 'ai'">
              <el-icon><MagicStick /></el-icon> <span>AI 效能</span>
            </div>
          </div>
        </div>

        <!-- 时间筛选 -->
        <div class="filter-section mt-6">
          <div class="filter-title">时间范围</div>
          <div class="filter-tree">
             <div class="filter-tree-item" :class="{ active: timeRange === '7d' }" @click="timeRange = '7d'">
                <span class="tree-dot" style="background: #22c55e"></span>
                <span class="tree-text">最近 7 天</span>
             </div>
             <div class="filter-tree-item" :class="{ active: timeRange === '30d' }" @click="timeRange = '30d'">
                <span class="tree-dot" style="background: #3b82f6"></span>
                <span class="tree-text">最近 30 天</span>
             </div>
             <div class="filter-tree-item" :class="{ active: timeRange === 'term' }" @click="timeRange = 'term'">
                <span class="tree-dot" style="background: #f59e0b"></span>
                <span class="tree-text">本学期</span>
             </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 右侧洞察 -->
    <template #right>
       <div class="right-sidebar-panel">
          <div class="panel-header"><h3>AI 洞察建议</h3></div>
          <div class="insight-list">
             <div v-for="item in aiInsights" :key="item.id" class="insight-card">
                <div class="insight-icon" :class="item.type">
                   <el-icon><component :is="item.icon" /></el-icon>
                </div>
                <div class="insight-body">
                   <div class="insight-title">{{ item.title }}</div>
                   <div class="insight-desc">{{ item.desc }}</div>
                </div>
             </div>
          </div>
       </div>
    </template>

    <!-- 主画布 -->
    <div class="analytics-canvas">
       
       <!-- 头部 -->
       <div class="canvas-header">
          <div class="search-bar-floating">
             <el-icon class="search-icon"><Search /></el-icon>
             <input 
               v-model="searchQuery" 
               type="text" 
               placeholder="搜索特定课程或学生..." 
               class="search-input-clean"
             />
          </div>
          <div class="quick-actions-row">
             <button class="action-card" @click="exportReport">
                <div class="icon-box blue"><el-icon><Download /></el-icon></div>
                <span>导出报告</span>
             </button>
          </div>
       </div>

       <!-- 核心指标 KPI -->
       <div class="kpi-row">
          <div class="kpi-card">
             <div class="kpi-label">平均完成率</div>
             <div class="kpi-value">87.5<span class="unit">%</span></div>
             <div class="kpi-trend up"><el-icon><Top /></el-icon> 2.4%</div>
          </div>
          <div class="kpi-card">
             <div class="kpi-label">活跃学生数</div>
             <div class="kpi-value">142<span class="unit">人</span></div>
             <div class="kpi-trend down"><el-icon><Bottom /></el-icon> 1.2%</div>
          </div>
          <div class="kpi-card">
             <div class="kpi-label">AI 辅导次数</div>
             <div class="kpi-value">893<span class="unit">次</span></div>
             <div class="kpi-trend up"><el-icon><Top /></el-icon> 15.8%</div>
          </div>
          <div class="kpi-card">
             <div class="kpi-label">作业平均分</div>
             <div class="kpi-value">B+<span class="unit">等级</span></div>
             <div class="kpi-trend">持平</div>
          </div>
       </div>

       <!-- 图表区域 -->
       <div class="charts-grid">
          <!-- 趋势图 -->
          <div class="clean-card chart-card wide">
             <div class="card-header">
                <h3 class="card-title">学习投入趋势</h3>
                <div class="chart-legend">
                   <span class="legend-item"><span class="dot blue"></span>时长</span>
                   <span class="legend-item"><span class="dot green"></span>互动</span>
                </div>
             </div>
             <div class="chart-placeholder">
                <!-- Mock Chart Visual -->
                <div class="mock-chart-line"></div>
             </div>
          </div>

          <!-- 分布图 -->
          <div class="clean-card chart-card">
             <div class="card-header">
                <h3 class="card-title">能力雷达</h3>
             </div>
             <div class="chart-placeholder radar">
                <div class="mock-radar"></div>
             </div>
          </div>
       </div>

       <!-- 预警列表 -->
       <div class="section-block">
          <h3 class="section-header">学情预警</h3>
          <div class="alert-list">
             <div class="alert-item warning">
                <div class="alert-icon"><el-icon><Warning /></el-icon></div>
                <div class="alert-content">
                   <div class="alert-title">3 名学生连续未提交作业</div>
                   <div class="alert-desc">高一(2)班：张伟、李娜、王强</div>
                </div>
                <el-button link type="primary">查看</el-button>
             </div>
             <div class="alert-item info">
                <div class="alert-icon"><el-icon><InfoFilled /></el-icon></div>
                <div class="alert-content">
                   <div class="alert-title">物理实验课参与度偏低</div>
                   <div class="alert-desc">建议增加课前引导环节</div>
                </div>
                <el-button link type="primary">详情</el-button>
             </div>
          </div>
       </div>

    </div>
  </TeacherWorkspaceLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Reading, User, MagicStick, Search, Download, Close,
  Top, Bottom, Warning, InfoFilled, TrendCharts, CaretTop
} from '@element-plus/icons-vue'
import TeacherWorkspaceLayout from '@/components/layout/TeacherWorkspaceLayout.vue'

// State
const rightCollapsed = ref(false)
const viewType = ref('course')
const timeRange = ref('30d')
const searchQuery = ref('')

// Mock Data
const aiInsights = ref([
   { id: 1, title: '课程难度适中', desc: '85% 的学生能在预定时间内完成实验', type: 'success', icon: 'CaretTop' },
   { id: 2, title: '互动建议', desc: '建议在第 3 章节增加互动问答', type: 'warning', icon: 'MagicStick' }
])

// Methods
const exportReport = () => ElMessage.success('报告生成中...')

</script>

<style scoped lang="scss">
/* Reuse Global Styles */
.filter-sidebar { padding: 8px 0; display: flex; flex-direction: column; gap: 24px; }
.filter-section { display: flex; flex-direction: column; gap: 12px; }
.filter-title { font-size: 12px; font-weight: 700; color: #94A3B8; padding-left: 12px; text-transform: uppercase; }
.filter-menu, .filter-tree { display: flex; flex-direction: column; gap: 4px; }

.filter-item, .filter-tree-item {
  display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: 8px; cursor: pointer; color: #475569; font-size: 14px; transition: all 0.2s;
  &:hover { background: #F1F5F9; color: #0F172A; }
  &.active { background: #E0E7FF; color: #4F46E5; font-weight: 500; }
}
.tree-dot { width: 8px; height: 8px; border-radius: 50%; }

/* Right Panel */
.right-sidebar-panel { padding: 16px; }
.panel-header h3 { font-size: 16px; font-weight: 600; margin: 0 0 16px 0; color: #0F172A; }
.insight-list { display: flex; flex-direction: column; gap: 12px; }
.insight-card {
   background: #F8FAFC; border-radius: 12px; padding: 12px; display: flex; gap: 12px;
   &:hover { background: #F1F5F9; }
}
.insight-icon {
   width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 18px;
   &.success { background: #DCFCE7; color: #16A34A; }
   &.warning { background: #FEF3C7; color: #D97706; }
}
.insight-title { font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 4px; }
.insight-desc { font-size: 12px; color: #64748B; line-height: 1.4; }

/* Canvas */
.analytics-canvas { display: flex; flex-direction: column; gap: 24px; max-width: 1200px; margin: 0 auto; width: 100%; }
.canvas-header { display: flex; flex-direction: column; gap: 24px; padding-bottom: 24px; border-bottom: 1px solid #F1F5F9; }

.search-bar-floating {
  background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); padding: 8px 16px; display: flex; align-items: center; gap: 12px;
  &:focus-within { box-shadow: 0 8px 30px rgba(99, 102, 241, 0.1); }
}
.search-input-clean { border: none; outline: none; font-size: 16px; flex: 1; color: #0F172A; }
.search-icon { font-size: 20px; color: #94A3B8; }

.quick-actions-row { display: flex; gap: 16px; }
.action-card {
  flex: 1; background: white; border: 1px solid #F1F5F9; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s;
  &:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.03); border-color: #E2E8F0; }
}
.icon-box {
  width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;
  &.blue { background: #E0E7FF; color: #4F46E5; }
}

/* KPI */
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.kpi-card { background: white; border-radius: 16px; padding: 20px; border: 1px solid #F1F5F9; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.kpi-label { font-size: 13px; color: #64748B; margin-bottom: 8px; }
.kpi-value { font-size: 28px; font-weight: 700; color: #0F172A; font-family: monospace; .unit { font-size: 14px; font-weight: 400; margin-left: 4px; color: #94A3B8; } }
.kpi-trend { 
   font-size: 12px; display: flex; align-items: center; gap: 4px; margin-top: 8px; color: #94A3B8;
   &.up { color: #16A34A; } &.down { color: #EF4444; }
}

/* Charts Grid */
.charts-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
.clean-card { background: white; border-radius: 16px; padding: 20px; border: 1px solid #F1F5F9; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.card-title { font-size: 16px; font-weight: 600; color: #0F172A; margin: 0; }
.chart-legend { display: flex; gap: 12px; font-size: 12px; color: #64748B; }
.legend-item { display: flex; align-items: center; gap: 6px; }
.dot { width: 8px; height: 8px; border-radius: 50%; &.blue { background: #4F46E5; } &.green { background: #10B981; } }

.chart-placeholder {
   height: 240px; background: #F8FAFC; border-radius: 8px; display: flex; align-items: flex-end; padding: 20px;
   &.radar { align-items: center; justify-content: center; }
}
.mock-chart-line { width: 100%; height: 60%; background: linear-gradient(90deg, transparent, rgba(79, 70, 229, 0.1)); border-top: 2px solid #4F46E5; border-radius: 4px; position: relative; }
.mock-radar { width: 160px; height: 160px; background: rgba(79, 70, 229, 0.1); border-radius: 50%; border: 2px solid #4F46E5; }

/* Alerts */
.section-block { margin-top: 24px; }
.section-header { font-size: 16px; font-weight: 600; color: #0F172A; margin: 0 0 16px 0; }
.alert-list { display: flex; flex-direction: column; gap: 12px; }
.alert-item {
   display: flex; align-items: center; gap: 16px; padding: 16px; border-radius: 12px; background: white; border: 1px solid transparent;
   &.warning { border-color: #FED7AA; background: #FFF7ED; .alert-icon { color: #F97316; } }
   &.info { border-color: #BFDBFE; background: #EFF6FF; .alert-icon { color: #3B82F6; } }
}
.alert-icon { font-size: 20px; }
.alert-content { flex: 1; }
.alert-title { font-size: 14px; font-weight: 600; color: #1E293B; }
.alert-desc { font-size: 13px; color: #64748B; }

@media (max-width: 900px) {
   .kpi-row { grid-template-columns: repeat(2, 1fr); }
   .charts-grid { grid-template-columns: 1fr; }
}
</style>