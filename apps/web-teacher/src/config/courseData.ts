/**
 * 课程相关数据配置
 */

import type { CourseSubject } from '@/types/course'

// 学科配置
export const subjects = [
  { value: 'chinese', label: '语文', color: '#E74C3C', icon: 'Reading' },
  { value: 'math', label: '数学', color: '#3498DB', icon: 'Calculator' },
  { value: 'english', label: '英语', color: '#9B59B6', icon: 'ChatDotRound' },
  { value: 'physics', label: '物理', color: '#F39C12', icon: 'Lightning' },
  { value: 'chemistry', label: '化学', color: '#2ECC71', icon: 'Operation' },
  { value: 'biology', label: '生物', color: '#27AE60', icon: 'Leaf' },
  { value: 'history', label: '历史', color: '#E67E22', icon: 'Clock' },
  { value: 'geography', label: '地理', color: '#16A085', icon: 'Location' },
  { value: 'politics', label: '政治', color: '#C0392B', icon: 'Management' },
  { value: 'art', label: '艺术', color: '#8E44AD', icon: 'Picture' },
  { value: 'music', label: '音乐', color: '#D35400', icon: 'Headphones' },
  { value: 'pe', label: '体育', color: '#7F8C8D', icon: 'Trophy' },
  { value: 'it', label: '信息技术', color: '#2980B9', icon: 'Monitor' },
  { value: 'comprehensive', label: '综合实践', color: '#34495E', icon: 'Set-Up' }
]

// 年级配置
export const grades = [
  { value: 'grade1', label: '一年级' },
  { value: 'grade2', label: '二年级' },
  { value: 'grade3', label: '三年级' },
  { value: 'grade4', label: '四年级' },
  { value: 'grade5', label: '五年级' },
  { value: 'grade6', label: '六年级' },
  { value: 'grade7', label: '七年级' },
  { value: 'grade8', label: '八年级' },
  { value: 'grade9', label: '九年级' },
  { value: 'grade10', label: '高一' },
  { value: 'grade11', label: '高二' },
  { value: 'grade12', label: '高三' }
]

// 建议标签
export const suggestedTags = [
  '基础入门', '进阶提升', '高级拓展',
  '概念理解', '实验操作', '实践应用',
  '考试辅导', '趣味学习', '互动体验',
  'AI增强', '可视化教学', '项目式学习',
  'STEM教育', '跨学科整合', '创新思维'
]

// Jupyter镜像配置
export const jupyterImages = [
  { value: 'jupyter/scipy-notebook:latest', label: 'Python科学计算' },
  { value: 'jupyter/tensorflow-notebook:latest', label: 'TensorFlow机器学习' },
  { value: 'jupyter/pytorch-notebook:latest', label: 'PyTorch深度学习' },
  { value: 'jupyter/r-notebook:latest', label: 'R语言数据分析' },
  { value: 'jupyter/scilab-notebook:latest', label: 'Scilab科学计算' },
  { value: 'jupyter/all-spark-notebook:latest', label: 'Apache Spark大数据' },
  { value: 'custom/python-edu:latest', label: '教育定制版' }
]

// 常用Python包
export const commonPackages = [
  'numpy', 'pandas', 'matplotlib', 'seaborn', 'plotly',
  'scipy', 'scikit-learn', 'tensorflow', 'torch', 'keras',
  'opencv-python', 'pillow', 'requests', 'beautifulsoup4', 'selenium',
  'sympy', 'networkx', 'bokeh', 'dash', 'streamlit',
  'jupyter', 'ipywidgets', 'nbconvert', 'notebook', 'jupyterlab'
]

// 课程模板
export const courseTemplates = {
  physics: {
    basic: {
      title: '高中物理基础',
      description: '从力学基础开始，系统学习高中物理核心概念',
      chapters: [
        { title: '运动的描述', duration: 45, type: 'content' },
        { title: '匀变速直线运动', duration: 60, type: 'experiment' },
        { title: '牛顿运动定律', duration: 50, type: 'content' },
        { title: '力学实验设计', duration: 90, type: 'experiment' }
      ]
    },
    advanced: {
      title: '物理竞赛进阶',
      description: '针对物理竞赛的深入学习和实验训练',
      chapters: [
        { title: '力学综合应用', duration: 60, type: 'assessment' },
        { title: '电磁学基础', duration: 45, type: 'content' },
        { title: '光学实验', duration: 75, type: 'experiment' },
        { title: '近代物理入门', duration: 50, type: 'interactive' }
      ]
    }
  },
  mathematics: {
    algebra: {
      title: '代数基础',
      description: '从基本概念到复杂方程，全面掌握代数知识',
      chapters: [
        { title: '实数与代数式', duration: 40, type: 'content' },
        { title: '一元一次方程', duration: 45, type: 'content' },
        { title: '函数图像探索', duration: 60, type: 'interactive' },
        { title: '方程应用实践', duration: 50, type: 'assessment' }
      ]
    },
    geometry: {
      title: '几何与证明',
      description: '平面几何和立体几何的系统学习',
      chapters: [
        { title: '基本图形与性质', duration: 35, type: 'content' },
        { title: '几何证明方法', duration: 50, type: 'content' },
        { title: '几何作图实验', duration: 70, type: 'experiment' },
        { title: '立体几何建模', duration: 80, type: 'interactive' }
      ]
    }
  },
  chemistry: {
    basic: {
      title: '化学基础',
      description: '原子结构到化学反应的化学启蒙',
      chapters: [
        { title: '原子与分子', duration: 45, type: 'content' },
        { title: '化学方程式', duration: 50, type: 'content' },
        { title: '化学实验基础', duration: 90, type: 'experiment' },
        { title: '酸碱中和反应', duration: 60, type: 'experiment' }
      ]
    },
    organic: {
      title: '有机化学入门',
      description: '有机化合物的结构和反应',
      chapters: [
        { title: '烃类化合物', duration: 50, type: 'content' },
        { title: '有机反应机理', duration: 60, type: 'interactive' },
        { title: '有机合成实验', duration: 120, type: 'experiment' },
        { title: '高分子化学', duration: 45, type: 'content' }
      ]
    }
  }
}

// 实验环境预设
export const experimentPresets = {
  physics: {
    mechanics: {
      name: '力学实验环境',
      image: 'jupyter/scipy-notebook:latest',
      packages: ['numpy', 'matplotlib', 'scipy', 'sympy'],
      resources: { cpu: 1, memory: 2, storage: 5 },
      description: '适用于力学实验、运动学分析'
    },
    electromagnetics: {
      name: '电磁学实验环境',
      image: 'jupyter/scipy-notebook:latest',
      packages: ['numpy', 'matplotlib', 'scipy'],
      resources: { cpu: 1.5, memory: 3, storage: 8 },
      description: '适用于电学实验、电磁感应'
    }
  },
  chemistry: {
    analytical: {
      name: '分析化学环境',
      image: 'jupyter/scipy-notebook:latest',
      packages: ['numpy', 'pandas', 'matplotlib', 'scipy'],
      resources: { cpu: 1, memory: 2, storage: 6 },
      description: '适用于数据分析、实验结果处理'
    },
    computational: {
      name: '计算化学环境',
      image: 'jupyter/r-notebook:latest',
      packages: ['ggplot2', 'dplyr', 'tidyr'],
      resources: { cpu: 2, memory: 4, storage: 10 },
      description: '适用于分子建模、量子化学计算'
    }
  },
  mathematics: {
    statistics: {
      name: '统计分析环境',
      image: 'jupyter/scipy-notebook:latest',
      packages: ['numpy', 'pandas', 'matplotlib', 'seaborn', 'scipy'],
      resources: { cpu: 1, memory: 2, storage: 5 },
      description: '适用于数据统计、概率分析'
    },
    calculus: {
      name: '微积分可视化环境',
      image: 'jupyter/scipy-notebook:latest',
      packages: ['numpy', 'matplotlib', 'sympy'],
      resources: { cpu: 1, memory: 2, storage: 4 },
      description: '适用于微积分概念可视化'
    }
  }
}

// AI提示词模板
export const aiPromptTemplates = {
  courseGeneration: {
    basic: `请为{subject}{grade}设计一个{duration}课时的课程，主题是"{topic}"。
要求：
1. 学习目标明确，符合{grade}学生的认知水平
2. 包含3-4个章节，每个章节都有清晰的学习目标
3. 设计适当的教学活动和实验
4. 提供相关的学习资源建议`,

    advanced: `请基于以下教学目标生成详细的课程大纲：
学科：{subject}
年级：{grade}
目标：{objectives}
特殊要求：{requirements}

请提供：
1. 完整的章节结构
2. 每个章节的具体内容建议
3. 推荐的教学方法和活动
4. 评估方式和标准`
  },

  experimentGeneration: {
    basic: `请为{subject}设计一个实验，主题是"{topic}"。
要求：
1. 实验目的明确
2. 步骤详细清晰
3. 需要的材料和设备清单
4. 预期结果和分析方法
5. 安全注意事项`,

    jupyter: `请为{topic}实验生成Jupyter Notebook代码，要求：
1. 包含数据生成和可视化
2. 添加详细的代码注释
3. 包含思考题和练习
4. 适合{grade}学生水平
5. 使用标准科学计算库`
  },

  contentEnhancement: {
    concept: `请为概念"{concept}"提供：
1. 通俗易懂的定义
2. 3个具体例子
3. 常见误区和纠正
4. 相关概念的关联
5. 适合{grade}学生的解释方式`,

    example: `请为{topic}生成教学示例，要求：
1. 贴近学生生活实际
2. 难度适中
3. 具有启发性
4. 包含详细解析
5. 可扩展为互动练习`
  },

  assessmentGeneration: {
    quiz: `请为{topic}生成5道测试题，要求：
1. 包含不同难度梯度
2. 题型多样化（选择、填空、问答）
3. 每题都有标准答案和解析
4. 适合{grade}学生水平
5. 覆盖主要知识点`,

    rubric: `请为{assignmentType}设计评分标准，包含：
1. 3-4个评价维度
2. 每个维度4个等级描述
3. 总分和通过分数设定
4. 具体的评价指导
5. 反馈建议模板`
  }
}

// 课程验证规则
export const courseValidationRules = {
  info: {
    title: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[\u4e00-\u9fa5a-zA-Z0-9\s]+$/
    },
    description: {
      required: true,
      minLength: 10,
      maxLength: 500
    },
    subject: {
      required: true,
      enum: ['chinese', 'math', 'english', 'physics', 'chemistry', 'biology', 'history', 'geography', 'politics', 'art', 'music', 'pe', 'it', 'comprehensive']
    },
    grade: {
      required: true,
      pattern: /^grade(1[0-2]|[1-9])$/
    },
    duration: {
      required: true,
      min: 1,
      max: 200,
      type: 'number'
    },
    difficulty: {
      required: true,
      enum: ['beginner', 'intermediate', 'advanced']
    }
  },
  chapters: {
    required: true,
    minLength: 1,
    maxLength: 50,
    itemType: {
      title: { required: true, minLength: 1, maxLength: 100 },
      description: { required: true, minLength: 5, maxLength: 500 },
      duration: { required: true, min: 5, max: 180, type: 'number' },
      type: { required: true, enum: ['content', 'experiment', 'interactive', 'assessment'] },
      objectives: { required: true, minLength: 1, maxLength: 10 }
    }
  }
}

// 课程导入导出配置
export const courseExportConfig = {
  version: '1.0.0',
  format: 'json',
  compression: true,
  includeAssets: true,
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedFileTypes: ['.json', '.zip', '.ipynb', '.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf', '.doc', '.docx', '.ppt', '.pptx']
}

// 课程搜索配置
export const courseSearchConfig = {
  fields: ['title', 'description', 'tags', 'subject', 'grade'],
  weights: {
    title: 3,
    description: 2,
    tags: 2,
    subject: 1.5,
    grade: 1
  },
  filters: {
    subject: true,
    grade: true,
    difficulty: true,
    duration: true,
    tags: true,
    aiEnabled: true,
    hasExperiments: true,
    hasInteractive: true,
    status: true
  },
  sorting: {
    relevance: '相关度',
    newest: '最新发布',
    popular: '最受欢迎',
    rating: '评分最高',
    duration: '课时数'
  }
}