<template>
  <div class="enhanced-cards-demo">
    <!-- 渐变卡片 -->
    <div class="demo-section">
      <h3>渐变卡片</h3>
      <div class="cards-grid">
        <div class="gradient-card gradient-primary">
          <div class="card-icon">
            <el-icon><Star /></el-icon>
          </div>
          <div class="card-content">
            <h4>优秀表现</h4>
            <p>基于AI分析的学生优秀表现识别</p>
            <div class="card-stats">
              <span class="stat-number">28</span>
              <span class="stat-label">名学生</span>
            </div>
          </div>
        </div>

        <div class="gradient-card gradient-success">
          <div class="card-icon">
            <el-icon><Trophy /></el-icon>
          </div>
          <div class="card-content">
            <h4>完成目标</h4>
            <p>本周学习目标完成情况</p>
            <div class="card-stats">
              <span class="stat-number">85%</span>
              <span class="stat-label">完成率</span>
            </div>
          </div>
        </div>

        <div class="gradient-card gradient-warning">
          <div class="card-icon">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="card-content">
            <h4>需要关注</h4>
            <p>学习进度较慢的学生</p>
            <div class="card-stats">
              <span class="stat-number">12</span>
              <span class="stat-label">名学生</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 玻璃态卡片 -->
    <div class="demo-section">
      <h3>玻璃态卡片</h3>
      <div class="cards-grid">
        <div class="glass-card">
          <div class="glass-header">
            <div class="glass-icon">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="glass-title">
              <h4>学习分析</h4>
              <p>深度学习数据分析</p>
            </div>
          </div>
          <div class="glass-content">
            <div class="chart-placeholder">
              <el-icon><TrendCharts /></el-icon>
              <span>数据图表</span>
            </div>
          </div>
        </div>

        <div class="glass-card">
          <div class="glass-header">
            <div class="glass-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="glass-title">
              <h4>学生画像</h4>
              <p>个性化学习分析</p>
            </div>
          </div>
          <div class="glass-content">
            <div class="student-tags">
              <el-tag type="primary">理科优势</el-tag>
              <el-tag type="success">勤奋努力</el-tag>
              <el-tag type="warning">需要辅导</el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 悬浮卡片 -->
    <div class="demo-section">
      <h3>悬浮交互卡片</h3>
      <div class="cards-grid">
        <div class="hover-card">
          <div class="hover-background"></div>
          <div class="hover-content">
            <div class="hover-icon">
              <el-icon><MagicStick /></el-icon>
            </div>
            <h4>AI助手</h4>
            <p>智能教学助手，提供个性化建议</p>
            <div class="hover-features">
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>智能推荐</span>
              </div>
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>内容优化</span>
              </div>
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>学习分析</span>
              </div>
            </div>
          </div>
        </div>

        <div class="hover-card">
          <div class="hover-background hover-bg-2"></div>
          <div class="hover-content">
            <div class="hover-icon">
              <el-icon><Monitor /></el-icon>
            </div>
            <h4>虚拟实验室</h4>
            <p>安全便捷的在线实验环境</p>
            <div class="hover-features">
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>Jupyter支持</span>
              </div>
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>实时协作</span>
              </div>
              <div class="feature-item">
                <el-icon><Check /></el-icon>
                <span>数据保存</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3D卡片效果 -->
    <div class="demo-section">
      <h3>3D卡片效果</h3>
      <div class="cards-grid">
        <div class="card-3d" @mousemove="handle3DMove" @mouseleave="handle3DLeave">
          <div class="card-3d-inner">
            <div class="card-3d-front">
              <div class="card-3d-content">
                <div class="card-3d-icon">
                  <el-icon><Reading /></el-icon>
                </div>
                <h4>课程管理</h4>
                <p>创建和管理课程内容</p>
              </div>
            </div>
            <div class="card-3d-back">
              <div class="card-3d-content">
                <h4>快速操作</h4>
                <div class="back-actions">
                  <el-button type="primary" size="small">创建课程</el-button>
                  <el-button size="small">查看课程</el-button>
                  <el-button size="small">导入课程</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card-3d" @mousemove="handle3DMove" @mouseleave="handle3DLeave">
          <div class="card-3d-inner">
            <div class="card-3d-front">
              <div class="card-3d-content">
                <div class="card-3d-icon">
                  <el-icon><School /></el-icon>
                </div>
                <h4>班级管理</h4>
                <p>管理学生和班级信息</p>
              </div>
            </div>
            <div class="card-3d-back">
              <div class="card-3d-content">
                <h4>班级操作</h4>
                <div class="back-actions">
                  <el-button type="primary" size="small">添加学生</el-button>
                  <el-button size="small">分配课程</el-button>
                  <el-button size="small">查看进度</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 霓虹边框卡片 -->
    <div class="demo-section">
      <h3>霓虹边框卡片</h3>
      <div class="cards-grid">
        <div class="neon-card neon-blue">
          <div class="neon-content">
            <div class="neon-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <h4>实时数据</h4>
            <p>监控学习进度和表现</p>
            <div class="neon-stats">
              <div class="neon-stat">
                <span class="neon-number">156</span>
                <span class="neon-label">活跃用户</span>
              </div>
            </div>
          </div>
        </div>

        <div class="neon-card neon-purple">
          <div class="neon-content">
            <div class="neon-icon">
              <el-icon><Medal /></el-icon>
            </div>
            <h4>成就系统</h4>
            <p>激励学生学习动力</p>
            <div class="neon-stats">
              <div class="neon-stat">
                <span class="neon-number">89%</span>
                <span class="neon-label">完成率</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Star, Trophy, Warning, DataAnalysis, User, TrendCharts, Check, MagicStick,
  Monitor, Reading, School, Medal
} from '@element-plus/icons-vue'

const handle3DMove = (event: MouseEvent) => {
  const card = event.currentTarget as HTMLElement
  const rect = card.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  const centerX = rect.width / 2
  const centerY = rect.height / 2

  const rotateX = (y - centerY) / 10
  const rotateY = (centerX - x) / 10

  card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
}

const handle3DLeave = (event: MouseEvent) => {
  const card = event.currentTarget as HTMLElement
  card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)'
}
</script>

<style lang="scss" scoped>
.enhanced-cards-demo {
  padding: var(--spacing-xl);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
}

.demo-section {
  margin-bottom: var(--spacing-2xl);

  h3 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--edu-text-primary);
    margin-bottom: var(--spacing-lg);
  }
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

/* 渐变卡片 */
.gradient-card {
  background: white;
  border-radius: 20px;
  padding: var(--spacing-xl);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
  }

  &.gradient-primary::before {
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  }

  &.gradient-success::before {
    background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%);
  }

  &.gradient-warning::before {
    background: linear-gradient(90deg, #f093fb 0%, #f5576c 100%);
  }
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-lg);

  .el-icon {
    font-size: 28px;
  }
}

.gradient-primary .card-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.gradient-success .card-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.gradient-warning .card-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.card-content {
  h4 {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--edu-text-primary);
    margin: 0 0 var(--spacing-sm) 0;
  }

  p {
    color: var(--edu-text-secondary);
    margin: 0 0 var(--spacing-lg) 0;
    line-height: 1.5;
  }

  .card-stats {
    display: flex;
    align-items: baseline;
    gap: var(--spacing-xs);

    .stat-number {
      font-size: 2rem;
      font-weight: 800;
      color: var(--edu-text-primary);
    }

    .stat-label {
      color: var(--edu-text-secondary);
      font-size: 0.9rem;
    }
  }
}

/* 玻璃态卡片 */
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: var(--spacing-xl);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }
}

.glass-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-base);
  margin-bottom: var(--spacing-lg);
}

.glass-icon {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  .el-icon {
    font-size: 24px;
    color: var(--edu-text-primary);
  }
}

.glass-title {
  h4 {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--edu-text-primary);
    margin: 0 0 var(--spacing-xs) 0;
  }

  p {
    color: var(--edu-text-secondary);
    margin: 0;
    font-size: 0.9rem;
  }
}

.glass-content {
  .chart-placeholder {
    height: 120px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--edu-text-secondary);
    gap: var(--spacing-sm);

    .el-icon {
      font-size: 32px;
    }
  }

  .student-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }
}

/* 悬浮卡片 */
.hover-card {
  background: white;
  border-radius: 20px;
  padding: var(--spacing-xl);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  &:hover {
    transform: translateY(-12px) scale(1.02);
    box-shadow: 0 30px 60px rgba(0, 0, 0, 0.2);
  }

  .hover-background {
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    border-radius: 50%;
    transition: all 0.6s ease;
    opacity: 0.1;
  }

  .hover-bg-2 {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }
}

.hover-card:hover .hover-background {
  top: -25%;
  right: -25%;
  opacity: 0.15;
}

.hover-content {
  position: relative;
  z-index: 2;
  text-align: center;

  .hover-icon {
    width: 70px;
    height: 70px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--spacing-lg) auto;
    color: white;

    .el-icon {
      font-size: 32px;
    }
  }

  h4 {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--edu-text-primary);
    margin: 0 0 var(--spacing-sm) 0;
  }

  p {
    color: var(--edu-text-secondary);
    margin: 0 0 var(--spacing-lg) 0;
    line-height: 1.5;
  }

  .hover-features {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);

    .feature-item {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      color: var(--edu-text-secondary);
      font-size: 0.9rem;

      .el-icon {
        color: var(--edu-success);
        font-size: 16px;
      }
    }
  }
}

/* 3D卡片 */
.card-3d {
  width: 100%;
  height: 250px;
  perspective: 1000px;
  cursor: pointer;
}

.card-3d-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.card-3d:hover .card-3d-inner {
  transform: rotateY(180deg);
}

.card-3d-front,
.card-3d-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.card-3d-front {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-3d-back {
  background: white;
  color: var(--edu-text-primary);
  transform: rotateY(180deg);
}

.card-3d-content {
  padding: var(--spacing-xl);
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  .card-3d-icon {
    width: 60px;
    height: 60px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--spacing-lg);

    .el-icon {
      font-size: 28px;
    }
  }

  h4 {
    font-size: 1.3rem;
    font-weight: 700;
    margin: 0 0 var(--spacing-sm) 0;
  }

  p {
    margin: 0;
    line-height: 1.4;
    opacity: 0.9;
  }

  .back-actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    width: 100%;
  }
}

/* 霓虹边框卡片 */
.neon-card {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 20px;
  padding: var(--spacing-xl);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-8px);
  }

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 20px;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
  }

  &:hover::before,
  &:hover::after {
    opacity: 1;
  }
}

.neon-blue {
  &::before {
    border: 2px solid #00d4ff;
    box-shadow: 0 0 20px #00d4ff, inset 0 0 20px rgba(0, 212, 255, 0.2);
  }

  &::after {
    border: 2px solid #0099ff;
    box-shadow: 0 0 40px #0099ff, inset 0 0 40px rgba(0, 153, 255, 0.1);
  }

  &:hover {
    box-shadow: 0 0 30px #00d4ff, 0 0 60px #0099ff;
  }
}

.neon-purple {
  &::before {
    border: 2px solid #ff00ff;
    box-shadow: 0 0 20px #ff00ff, inset 0 0 20px rgba(255, 0, 255, 0.2);
  }

  &::after {
    border: 2px solid #cc00ff;
    box-shadow: 0 0 40px #cc00ff, inset 0 0 40px rgba(204, 0, 255, 0.1);
  }

  &:hover {
    box-shadow: 0 0 30px #ff00ff, 0 0 60px #cc00ff;
  }
}

.neon-content {
  text-align: center;
  color: white;

  .neon-icon {
    width: 60px;
    height: 60px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto var(--spacing-lg) auto;

    .el-icon {
      font-size: 28px;
    }
  }

  h4 {
    font-size: 1.3rem;
    font-weight: 700;
    margin: 0 0 var(--spacing-sm) 0;
  }

  p {
    margin: 0 0 var(--spacing-lg) 0;
    line-height: 1.4;
    opacity: 0.8;
  }

  .neon-stats {
    .neon-stat {
      .neon-number {
        display: block;
        font-size: 2rem;
        font-weight: 800;
        margin-bottom: var(--spacing-xs);
      }

      .neon-label {
        font-size: 0.9rem;
        opacity: 0.7;
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .enhanced-cards-demo {
    padding: var(--spacing-base);
  }

  .cards-grid {
    grid-template-columns: 1fr;
  }

  .hover-card:hover {
    transform: translateY(-8px) scale(1);
  }

  .card-3d {
    height: 200px;
  }

  .back-actions {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
}

/* 深色模式适配 */
[data-theme="dark"] {
  .enhanced-cards-demo {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }

  .gradient-card,
  .hover-card {
    background: var(--edu-bg-primary);
  }

  .glass-card {
    background: rgba(30, 30, 46, 0.6);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .glass-icon {
    background: rgba(255, 255, 255, 0.1);
  }

  .glass-content .chart-placeholder {
    background: rgba(255, 255, 255, 0.05);
  }
}
</style>