# 主题统一与落地执行文档（蓝紫橙 / InnoFlow）

## 目标
- 全站唯一设计源：以 `packages/ui-kit/src/theme/tokens.json` 为唯一真源，所有 App 只通过 UI Kit 注入主题。
- 品牌色落地：主色 Indigo (#6366F1)、次色 Violet (#8B5CF6)、CTA 橙 (#F97316) 贯穿交互与组件。
- 体验一致：按钮/卡片/导航/背景/表格等组件视觉和间距统一；消灭旧工业蓝、交通绿。
- 可验证：提供自动校验，禁止硬编码颜色，确保对比度、性能（玻璃态范围可控）。

## 现状关键问题
- 多套主题共存：教师端存在 `theme.scss` 与 `styles/element-plus-theme.scss` 双重覆盖；学生端用 Apple 色盘；管理端用 Element 默认色；UI Kit 仍有旧蓝 (#2196f3)。
- 品牌色未进入语义层：登录页定义了蓝紫橙，但主应用未引用；CTA 与 warning 共用橙色，语义混乱。
- 组件风格杂糅：玻璃/渐变/纯色大底混用，卡片大面积色块、阴影/圆角不统一。
- 缺少门禁：无“禁止硬编码色”的校验，`validate-theme.js` 仅检查命名和 Element Plus 覆盖。

## 统一策略
1) **唯一主题入口**
   - UI Kit 导出：`@ui-kit/index.scss` + `ThemeManager.applyFullTheme()`；App 仅允许这一路径注入 `:root` 变量与 Element Plus 映射。
   - 禁用本地 `:root` 颜色覆盖；教师/学生/管理端删除自定义主色定义。

2) **对齐 Token 值**
   - 主色系用 `tokens.json` 的 primary/secondary/tertiary（Indigo/Violet/Orange），覆盖 UI Kit `styles/variables.scss` 旧色。
   - 品牌渐变/光晕使用 `tokens.json` 的 `gradient.brand`、`shadow.glow`。
   - 新增 CTA 语义：`--edu-color-cta-*`（橙系），与 `--edu-color-warning-*` 分离。

3) **Element Plus 映射统一**
   - 仅保留 UI Kit 内一处映射（ThemeManager 或单一 SCSS 层），禁止 App 层再设 `--el-color-*`。
   - 语义映射：Primary=Indigo，Success/Warning/Error/Info 按 tokens，CTA 通过按钮样式实现，不占用 warning。

4) **组件视觉规范**
   - 按方案：圆角 12px / 8px，Pill 用于按钮；阴影改为彩光 (`--edu-shadow-glow`)，禁止黑色粗阴影。
   - 卡片：中性底 + 细描边/浅阴影，顶部色带/角标取品牌色；禁用整卡高饱和底。
   - 按钮：Primary=品牌渐变+光晕；CTA=橙色+光晕；Secondary=玻璃态+描边；Hover 上浮 2px。
   - 导航：玻璃态侧边栏，选中项“光剑”高亮（左侧亮条+渐变）。
   - 背景：中性灰底 + 轻噪点/淡光斑；`backdrop-filter` 仅用于侧边栏/浮层，小面积且有 @supports fallback。

5) **门禁与校验**
   - 扩展 `scripts/validate-theme.js`：扫描 repo 硬编码颜色（#RRGGBB/rgb），白名单仅 tokens.json、少量图片；检查唯一主题注入文件。
   - Lint：禁止 `:root` 中非 `--edu-*` 变量；禁止直接设置 `--el-color-*` 在 app。
   - 对比度检查：新增 `--text-on-primary`/`--text-on-gradient`/`--focus-ring`，确保 AA。

6) **性能与降级**
   - `backdrop-filter` 限制范围；提供无 blur 的 fallback。
   - 渐变/光晕用于小面积强调，不做大面积平铺背景。

## 执行顺序（建议）
1. **UI Kit 对齐**
   - 更新 `styles/variables.scss` 颜色为 tokens.json；
   - 为 CTA 新增语义；调整组件 SCSS（按钮/卡片/表格等）用品牌渐变与彩光阴影；
   - 校正 ThemeManager 的 Element Plus 映射。
2. **教师端落地**
   - 移除/合并本地 `theme.scss`、`styles/element-plus-theme.scss` 的颜色定义；
   - 页面卡片/按钮/导航改用 UI Kit 变量与 class；禁用大面积彩色卡片底。
3. **学生端与管理端切换**
   - 移除 Apple/默认 Element 色盘，使用 UI Kit 变量；替换组件样式。
4. **背景与骨架**
   - 应用全局背景（中性底+轻噪点/光斑）；统一 surface card/toolbar 间距。
5. **门禁上线**
   - 扩展 `validate-theme.js` 并接入 CI/预提交；对比度抽查。

## 验收标准
- 颜色：全局无旧工业蓝/交通绿硬编码；主、次、CTA 色只来自 tokens。
- 入口：仅一处主题注入；App 不再定义 `--el-color-*`。
- 组件：按钮/卡片/导航/表格视觉统一；卡片无大面积纯彩底。
- 可访问性：渐变/玻璃上的文字对比达到 AA，存在可见 focus-ring。
- 性能：backdrop-filter 使用受控且有 fallback。
