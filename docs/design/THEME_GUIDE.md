# ReOpenInnoLab 主题设计指南 (InnoFlow Edition)

## 📖 概述

ReOpenInnoLab 的设计语言已全面升级为 **"InnoFlow" (流光)**。本指南定义了打造高级、优雅、通透用户体验的核心规范。

我们追求的不是简单的堆砌颜色，而是通过**克制（Restraint）**、**质感（Texture）**和**微光（Glow）**来体现教育科技的温度与智慧。

---

## 🎨 色彩系统 (Color System)

### 核心品牌色 (Brand Colors)

我们采用了“三位一体”的色彩架构，每种颜色都有明确的功能定义：

#### 1. 基调色：深靛蓝 (Royal Indigo)
*   **定义**：`#6366F1` (Indigo-500)
*   **角色**：**理智、深度、基石**。
*   **应用**：全局主色、导航栏、一级标题、容器背景。
*   **变体**：
    *   `Indigo-50` (`#EEF2FF`): 极淡背景，用于大面积铺底。
    *   `Indigo-900` (`#312E81`): 深邃文字，替代纯黑。

#### 2. 智慧色：丁香紫 (Electric Violet)
*   **定义**：`#8B5CF6` (Violet-500)
*   **角色**：**AI、灵感、创造**。
*   **应用**：AI 助手交互、加载动画、选中状态、微光投影。
*   **搭配**：与 Indigo 形成完美的邻近色过渡，营造“流光”感。

#### 3. 点睛色：爱马仕橙 (Hermès Orange)
*   **定义**：`#F97316` (Orange-500)
*   **角色**：**行动、焦点、活力**。
*   **应用**：**Call-to-Action (CTA)** 按钮、关键数据高亮、通知红点。
*   **原则**：**极度克制**。一个屏幕上通常只允许出现 1-2 处，作为视觉锚点。

### 中性色 (Neutrals)
放弃纯灰 (`Gray`)，全面转向 **蓝灰 (Slate)**。
*   `Slate-50` ~ `Slate-900`: 带有微弱蓝色的灰色，让界面显得更干净、冷峻。

### 渐变体系 (Gradients)
*   **品牌主渐变 (Brand Flow)**:
    `linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #F97316 100%)`
    *应用：Logo、Loading 条、主按钮 Hover 态。*
*   **深空渐变 (Deep Space)**:
    `linear-gradient(180deg, #312E81 0%, #1E1B4B 100%)`
    *应用：侧边栏深色模式背景。*

---

## 💎 质感与材质 (Materials)

高级感来源于对光影的细腻处理。

### 1. 弥散光影 (Diffused Glow)
不要使用黑色阴影 (`rgba(0,0,0,0.2)`)，那是“脏”的来源。
**请使用彩光阴影**：
*   `shadow-glow-sm`: `0 2px 4px rgba(99, 102, 241, 0.1)`
*   `shadow-glow-lg`: `0 10px 25px -5px rgba(99, 102, 241, 0.15)`
*   *效果：物体仿佛自身在发光，而不是遮挡了光。*

### 2. 玻璃拟态 (Glassmorphism 2.0)
在深色或复杂背景上，使用磨砂玻璃增加通透感。
*   `background`: `rgba(255, 255, 255, 0.7)` (Light) / `rgba(30, 41, 59, 0.7)` (Dark)
*   `backdrop-filter`: `blur(12px)`
*   `border`: `1px solid rgba(255, 255, 255, 0.2)`

### 3. 圆角 (Radius)
*   **小圆角 (6px)**: 输入框、内部小元素。
*   **大圆角 (12px/16px)**: 卡片、弹窗。
*   **全圆角 (999px)**: 按钮、标签。
*   *原则：外圆内方，层级越高圆角越大。*

---

## 🧩 组件设计规范 (Component Specs)

### 按钮 (Buttons)

*   **Primary (主操作)**
    *   背景：`Indigo-500` 或 `Brand Gradient`。
    *   文字：白色。
    *   光影：`shadow-glow-lg`。
*   **CTA (关键行动)**
    *   背景：`Orange-500`。
    *   形状：全圆角 (Pill)。
    *   *场景：开始上课、发布任务。*
*   **Secondary (次要)**
    *   背景：透明。
    *   边框：`1px solid Slate-200`。
    *   文字：`Slate-600`。
    *   Hover: 背景变 `Indigo-50`，文字变 `Indigo-600`。

### 卡片 (Cards)

*   **去边框化**：默认状态下**不要**加深色边框。
*   **悬浮感**：利用 `shadow-glow` 让卡片与背景分离。
*   **微交互**：Hover 时，卡片上浮 `translateY(-4px)`，阴影扩散并带有微弱的紫色光晕。

### 输入框 (Inputs)

*   **常态**：背景 `Slate-50`，无边框或极淡边框。
*   **聚焦**：背景变白，出现 `Indigo-500` 的光圈 (`ring-2 ring-indigo-500/20`)。

---

## 📏 布局与排版 (Layout & Typography)

### 字体
*   **中文**：PingFang SC, Noto Sans SC
*   **英文**：Inter, SF Pro Display
*   **字重**：
    *   标题使用 `600` (SemiBold)，不要用 `700` (Bold)，保持精致。
    *   正文使用 `400` (Regular)。

### 间距 (Spacing)
拥抱留白。
*   模块间距：`32px` (2rem) 起步。
*   卡片内边距：`24px` (1.5rem) 起步。
*   *让内容呼吸，不要挤在一起。*

---

## 🌙 深色模式 (Dark Mode)

InnoFlow 的深色模式不是纯黑，而是**深海蓝**。
*   **背景**：`#0F172A` (Slate-900)
*   **卡片**：`#1E293B` (Slate-800)
*   **文字**：`#F1F5F9` (Slate-100)
*   *在深色模式下，橙色的点缀作用会更加明显，需更加克制使用。*
