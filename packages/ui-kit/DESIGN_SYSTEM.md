# ReOpenInnoLab UI Kit - 设计系统规范

## 概览

本文档定义了 ReOpenInnoLab 教师端的完整视觉语法规范，包括颜色、圆角、阴影、动效等设计要素的统一标准。

## 1. 色彩系统

### 1.1 主色调 - 学术蓝

```scss
--edu-primary-50: #e3f2fd;
--edu-primary-100: #bbdefb;
--edu-primary-200: #90caf9;
--edu-primary-300: #64b5f6;
--edu-primary-400: #42a5f5;
--edu-primary-500: #2196f3;  // 主色
--edu-primary-600: #1e88e5;
--edu-primary-700: #1976d2;
--edu-primary-800: #1565c0;
--edu-primary-900: #0d47a1;
```

### 1.2 学科色彩体系

| 学科 | 主色 | 浅色 | 深色 |
|------|------|------|------|
| 物理 | #1976d2 | #e3f2fd | #0d47a1 |
| 化学 | #388e3c | #e8f5e8 | #1b5e20 |
| 数学 | #f57c00 | #fff3e0 | #e65100 |
| 生物 | #7b1fa2 | #f3e5f5 | #4a148c |
| 语文 | #d32f2f | #ffebee | #b71c1c |
| 历史 | #ff6f00 | #fff3e0 | #e65100 |
| 地理 | #0277bd | #e1f5fe | #01579b |
| 英语 | #2e7d32 | #e8f5e8 | #1b5e20 |

### 1.3 语义化颜色

```scss
// 成功色
--edu-color-success-light: #B7EB8F;
--edu-color-success-default: #10B981;
--edu-color-success-dark: #389E0D;

// 警告色
--edu-color-warning-light: #FFE58F;
--edu-color-warning-default: #FAAD14;
--edu-color-warning-dark: #D48806;

// 错误色
--edu-color-error-light: #FF7875;
--edu-color-error-default: #F5222D;
--edu-color-error-dark: #CF1322;

// 信息色
--edu-color-info-light: #91D5FF;
--edu-color-info-default: #0EA5E9;
--edu-color-info-dark: #0958D9;
```

### 1.4 中性色系统

```scss
--edu-color-white: #FFFFFF;
--edu-color-gray-50: #FAFAFA;
--edu-color-gray-100: #F5F5F5;
--edu-color-gray-200: #F0F0F0;
--edu-color-gray-300: #D9D9D9;
--edu-color-gray-400: #BFBFBF;
--edu-color-gray-500: #8C8C8C;
--edu-color-gray-600: #595959;
--edu-color-gray-700: #434343;
--edu-color-gray-800: #262626;
--edu-color-gray-900: #1F1F1F;
```

## 2. 圆角系统

### 2.1 圆角规范

```scss
--radius-xs: 2px;     // 极小圆角 - 按钮、输入框
--radius-sm: 4px;     // 小圆角 - 标签、徽章
--radius-base: 6px;   // 基础圆角 - 卡片、面板
--radius-lg: 8px;     // 大圆角 - 大型卡片
--radius-xl: 12px;    // 特大圆角 - 特殊容器
--radius-2xl: 16px;   // 超大圆角 - 主要容器
--radius-full: 9999px; // 全圆角 - 头像、按钮
```

### 2.2 使用场景

- **xs (2px)**: 按钮圆角、输入框圆角
- **sm (4px)**: 标签圆角、徽章圆角
- **base (6px)**: 小卡片圆角、列表项圆角
- **lg (8px)**: 标准卡片圆角、面板圆角
- **xl (12px)**: 大型卡片圆角、对话框圆角
- **2xl (16px)**: 主要容器圆角、侧边栏圆角
- **full**: 头像、圆形按钮

## 3. 阴影系统

### 3.1 阴影层级

```scss
--edu-shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 5%);
--edu-shadow-base: 0 1px 3px 0 rgb(0 0 0 / 10%), 0 1px 2px 0 rgb(0 0 0 / 6%);
--edu-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 10%), 0 2px 4px -1px rgb(0 0 0 / 6%);
--edu-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 10%), 0 4px 6px -2px rgb(0 0 0 / 5%);
--edu-shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 10%), 0 10px 10px -5px rgb(0 0 0 / 4%);
--edu-shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 25%);
```

### 3.2 特殊阴影效果

```scss
// 玻璃效果阴影
--edu-shadow-glass: 0 8px 32px rgb(31 38 135 / 15%);

// 教育主题阴影
--edu-shadow-education: 0 4px 20px rgb(91 143 249 / 15%);
```

### 3.3 使用场景

- **sm**: 悬浮提示、小型组件
- **base**: 输入框、按钮
- **md**: 标准卡片、列表项
- **lg**: 大型卡片、重要组件
- **xl**: 模态框、弹窗
- **2xl**: 重要提示、高亮元素

## 4. 字体系统

### 4.1 字体族

```scss
--font-family-sans: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, "Noto Sans SC", sans-serif;
--font-family-serif: "Songti SC", "SimSun", "Noto Serif SC", Georgia, serif;
--font-family-mono: "SF Mono", "Monaco", "Inconsolata", "Fira Code", "Source Code Pro", monospace;
```

### 4.2 字号体系

```scss
--font-size-xs: 12px;    // 辅助信息
--font-size-sm: 14px;    // 正文小字
--font-size-base: 16px;  // 基础字号
--font-size-lg: 18px;    // 标题小字
--font-size-xl: 20px;    // 小标题
--font-size-2xl: 24px;   // 中标题
--font-size-3xl: 30px;   // 大标题
--font-size-4xl: 36px;   // 超大标题
--font-size-5xl: 48px;   // 特大标题
```

### 4.3 字重规范

```scss
--font-weight-light: 300;      // 轻体
--font-weight-normal: 400;     // 常规
--font-weight-medium: 500;     // 中等
--font-weight-semibold: 600;   // 半粗
--font-weight-bold: 700;       // 粗体
```

### 4.4 行高规范

```scss
--line-height-tight: 1.25;     // 紧凑行高 - 标题使用
--line-height-snug: 1.375;     // 适中行高 - 小文本使用
--line-height-normal: 1.5;     // 标准行高 - 正文使用
--line-height-relaxed: 1.625;  // 宽松行高 - 长段落使用
--line-height-loose: 2;        // 最宽行高 - 特殊场景
```

## 5. 间距系统

### 5.1 基础间距

```scss
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-base: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
--spacing-3xl: 64px;
```

### 5.2 使用场景

- **xs (4px)**: 紧密元素间距、图标与文字间距
- **sm (8px)**: 相关元素间距、列表项间距
- **base (16px)**: 标准元素间距、卡片内边距
- **lg (24px)**: 区块间距、卡片外边距
- **xl (32px)**: 主要区块间距、页面边距
- **2xl (48px)**: 页面顶级间距
- **3xl (64px)**: 特殊大间距

## 6. 动效系统

### 6.1 缓动函数

```scss
--edu-easing-linear: linear;
--edu-easing-in: cubic-bezier(0.4, 0, 1, 1);
--edu-easing-out: cubic-bezier(0, 0, 0.2, 1);
--edu-easing-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--edu-easing-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--edu-easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### 6.2 持续时间

```scss
--edu-duration-fast: 0.15s;   // 快速交互
--edu-duration-normal: 0.3s;  // 标准交互
--edu-duration-slow: 0.5s;    // 复杂动画
```

### 6.3 常用动效

- **悬停变换**: `translateY(-2px)` - 卡片悬停上浮
- **激活状态**: `translateY(0)` - 按钮按下回弹
- **淡入淡出**: `opacity` 变化 - 模态框出现/消失
- **滑入动画**: `translateX/Y` - 侧边栏、抽屉

## 7. 玻璃效果

### 7.1 玻璃效果变量

```scss
// 浅色模式玻璃效果
--edu-glass-bg: rgba(255, 255, 255, 0.95);
--edu-glass-border: 1px solid rgba(255, 255, 255, 0.18);
--edu-glass-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
--edu-glass-blur: saturate(180%) blur(20px);

// 深色模式玻璃效果
--edu-dark-glass-bg: rgba(0, 0, 0, 0.95);
--edu-dark-glass-border: 1px solid rgba(255, 255, 255, 0.1);
--edu-dark-glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
```

### 7.2 玻璃效果特性

- **背景**: 半透明背景，支持模糊效果
- **边框**: 微妙的边框线条
- **阴影**: 增强层次感的阴影
- **模糊**: 背景模糊效果

## 8. 渐变色系统

### 8.1 主题渐变

```scss
--edu-gradient-primary: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
--edu-gradient-secondary: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
--edu-gradient-warm: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
--edu-gradient-cool: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
--edu-gradient-education: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
```

### 8.2 语义化渐变

```scss
--edu-gradient-success: linear-gradient(135deg, #10B981 0%, #34D399 100%);
--edu-gradient-warning: linear-gradient(135deg, #FAAD14 0%, #FFD666 100%);
--edu-gradient-error: linear-gradient(135deg, #F5222D 0%, #FF7875 100%);
```

## 9. 组件尺寸规范

### 9.1 按钮尺寸

```scss
--btn-height-xs: 24px;
--btn-height-sm: 32px;
--btn-height-base: 40px;
--btn-height-lg: 48px;
--btn-height-xl: 56px;
```

### 9.2 标签尺寸

```scss
--tag-height-xs: 20px;
--tag-height-sm: 24px;
--tag-height-base: 28px;
--tag-height-lg: 32px;
```

### 9.3 卡片尺寸

```scss
--card-padding-sm: 16px;
--card-padding-base: 24px;
--card-padding-lg: 32px;
```

### 9.4 图标尺寸

```scss
--icon-xs: 12px;     // 极小图标
--icon-sm: 16px;     // 小图标
--icon-base: 20px;   // 基础图标
--icon-lg: 24px;     // 大图标
--icon-xl: 32px;     // 特大图标
--icon-2xl: 48px;    // 超大图标
```

## 10. 响应式断点

```scss
--edu-breakpoint-xs: 480px;   // 超小屏
--edu-breakpoint-sm: 768px;   // 小屏
--edu-breakpoint-md: 1024px;  // 中屏
--edu-breakpoint-lg: 1280px;  // 大屏
--edu-breakpoint-xl: 1536px;  // 超大屏
--edu-breakpoint-2xl: 1920px; // 2K屏
```

## 11. 无障碍设计

### 11.1 焦点状态

```scss
--focus-ring: 2px solid var(--edu-primary-500);
--focus-offset: 2px;
```

### 11.2 对比度要求

- **文本对比度**: WCAG AA 标准 - 4.5:1
- **大文本对比度**: WCAG AA 标准 - 3:1
- **非文本元素**: WCAG AA 标准 - 3:1

## 12. 深色主题适配

### 12.1 背景色调整

```scss
--bg-primary: #121212;
--bg-secondary: #1e1e1e;
--bg-surface: #262626;
--bg-elevated: #2f2f2f;
```

### 12.2 文本色调整

```scss
--text-primary: rgba(255, 255, 255, 0.87);
--text-secondary: rgba(255, 255, 255, 0.68);
--text-tertiary: rgba(255, 255, 255, 0.38);
```

### 12.3 阴影调整

深色模式下阴影使用更深的不透明度，增强层次感。

## 13. 使用指南

### 13.1 颜色使用原则

1. **主色**: 用于主要操作、重要元素
2. **学科色**: 用于学科标识、分类标签
3. **语义色**: 用于状态指示、反馈信息
4. **中性色**: 用于文本、边框、背景

### 13.2 间距使用原则

1. **4px 基础**: 所有间距都是 4px 的倍数
2. **8px 规则**: 相邻元素使用 8px 间距
3. **16px 规则**: 区块级元素使用 16px 间距
4. **24px 规则**: 主要区块使用 24px 间距

### 13.3 圆角使用原则

1. **统一性**: 同类型组件使用相同圆角
2. **层次性**: 重要组件使用更大圆角
3. **功能性**: 按钮等交互元素使用适中圆角

### 13.4 阴影使用原则

1. **轻微**: 基础元素使用轻微阴影
2. **适度**: 重要元素使用适中阴影
3. **明显**: 浮层元素使用明显阴影
4. **适度**: 避免过度使用阴影

## 14. 实现建议

### 14.1 CSS 变量使用

```scss
.component {
  background: var(--edu-bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--edu-shadow-md);
  padding: var(--spacing-base);
  transition: all var(--edu-duration-normal) var(--edu-easing-in-out);
}
```

### 14.2 响应式实现

```scss
.component {
  padding: var(--spacing-sm);

  @media (min-width: 768px) {
    padding: var(--spacing-base);
  }

  @media (min-width: 1024px) {
    padding: var(--spacing-lg);
  }
}
```

### 14.3 主题切换实现

```scss
[data-theme="dark"] {
  --edu-bg-primary: #121212;
  --edu-text-primary: rgba(255, 255, 255, 0.87);
  // 其他深色主题变量...
}
```

---

本设计系统规范确保了整个 ReOpenInnoLab 教师端应用的视觉一致性和用户体验质量。所有组件都应严格遵循这些规范进行设计和实现。
