#!/usr/bin/env node

/**
 * 主题验证脚本
 * 检查 CSS 变量命名、Element Plus 映射、应用集成与硬编码颜色
 */

const fs = require('fs')
const path = require('path')

// 配置
const config = {
  uiKitPath: path.join(__dirname, '../packages/ui-kit'),
  webTeacherPath: path.join(__dirname, '../apps/web-teacher'),
  webStudentPath: path.join(__dirname, '../apps/web-student'),
  themesPath: path.join(__dirname, '../packages/ui-kit/src/theme'),
  stylesPath: path.join(__dirname, '../packages/ui-kit/src/styles')
}

const COLOR_FILE_ALLOWLIST = new Set([
  path.join(config.themesPath, 'tokens.json')
])

// Element Plus 必需变量
const REQUIRED_ELEMENT_PLUS_VARS = [
  '--el-color-primary',
  '--el-color-primary-light-3',
  '--el-color-primary-light-5',
  '--el-color-primary-light-7',
  '--el-color-primary-light-8',
  '--el-color-primary-light-9',
  '--el-color-primary-dark-2',
  '--el-color-success',
  '--el-color-success-light-3',
  '--el-color-success-light-5',
  '--el-color-success-light-7',
  '--el-color-success-light-8',
  '--el-color-success-light-9',
  '--el-color-success-dark-2',
  '--el-color-warning',
  '--el-color-warning-light-3',
  '--el-color-warning-light-5',
  '--el-color-warning-light-7',
  '--el-color-warning-light-8',
  '--el-color-warning-light-9',
  '--el-color-warning-dark-2',
  '--el-color-error',
  '--el-color-error-light-3',
  '--el-color-error-light-5',
  '--el-color-error-light-7',
  '--el-color-error-light-8',
  '--el-color-error-light-9',
  '--el-color-error-dark-2',
  '--el-color-info',
  '--el-color-info-light-3',
  '--el-color-info-light-5',
  '--el-color-info-light-7',
  '--el-color-info-light-8',
  '--el-color-info-light-9',
  '--el-color-info-dark-2',
  '--el-font-family',
  '--el-font-size-base',
  '--el-font-size-small',
  '--el-font-size-large',
  '--el-font-size-extra-large',
  '--el-font-weight-primary',
  '--el-border-radius-base',
  '--el-border-radius-small',
  '--el-border-radius-round',
  '--el-box-shadow',
  '--el-box-shadow-light',
  '--el-box-shadow-dark',
  '--el-transition-duration',
  '--el-transition-duration-fast'
]

class ThemeValidator {
  constructor() {
    this.errors = []
    this.warnings = []
    this.stats = {
      totalVariables: 0,
      validVariables: 0,
      invalidVariables: 0,
      elementPlusMapped: 0,
      elementPlusMissing: 0
    }
  }

  // 读取文件内容
  readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8')
    } catch (error) {
      this.addError(`无法读取文件: ${filePath}`)
      return ''
    }
  }

  addError(message) {
    this.errors.push(message)
  }

  addWarning(message) {
    this.warnings.push(message)
  }

  // 检查 CSS 变量命名规范
  validateCSSVariableNaming() {
    console.log('🔍 检查 CSS 变量命名规范...')

    const scssFiles = [
      path.join(config.stylesPath, 'variables.scss'),
      path.join(config.stylesPath, 'index.scss'),
      path.join(config.uiKitPath, 'src/index.scss')
    ]

    scssFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const content = this.readFile(file)
        const variableRegex = /var\(--([a-zA-Z0-9-]+)/g
        let match

        while ((match = variableRegex.exec(content)) !== null) {
          const variableName = match[1]
          this.stats.totalVariables++

          if (!variableName.startsWith('edu-')) {
            this.stats.invalidVariables++
            this.addError(`变量命名不规范: --${variableName} (应为 --edu-${variableName})`)
          } else {
            this.stats.validVariables++
          }
        }
      }
    })

    console.log('✅ CSS 变量命名检查完成')
    console.log(`   总变量: ${this.stats.totalVariables}`)
    console.log(`   有效变量: ${this.stats.validVariables}`)
    console.log(`   无效变量: ${this.stats.invalidVariables}`)
  }

  // 检查主题文件完整性
  validateThemeFile() {
    console.log('🔍 检查主题文件完整性...')

    const themeIndexPath = path.join(config.themesPath, 'index.ts')

    if (!fs.existsSync(themeIndexPath)) {
      this.addError('主题管理器文件不存在')
      return
    }

    const content = this.readFile(themeIndexPath)

    const requiredMethods = [
      'generateCSSVariables',
      'applyCSSVariables',
      'applyElementPlusTheme',
      'applyFullTheme',
      'getColor',
      'getSubjectColor'
    ]

    requiredMethods.forEach(method => {
      if (!content.includes(method)) {
        this.addError(`主题管理器缺少方法: ${method}`)
      }
    })

    const themeTypes = ['light', 'dark', 'high-contrast']
    themeTypes.forEach(type => {
      if (!content.includes(type)) {
        this.addWarning(`主题类型定义可能缺少: ${type}`)
      }
    })

    console.log('✅ 主题文件完整性检查完成')
  }

  // 检查 Element Plus 映射完整性
  validateElementPlusMapping() {
    console.log('🔍 检查 Element Plus 映射完整性...')

    const themeIndexPath = path.join(config.themesPath, 'index.ts')
    const content = this.readFile(themeIndexPath)

    const applyElementPlusThemeMatch = content.match(/applyElementPlusTheme\(\)[\s\S]*?^}/m)

    if (!applyElementPlusThemeMatch) {
      this.addError('找不到 applyElementPlusTheme 方法')
      return
    }

    const methodContent = applyElementPlusThemeMatch[0]

    REQUIRED_ELEMENT_PLUS_VARS.forEach(variable => {
      if (methodContent.includes(variable)) {
        this.stats.elementPlusMapped++
      } else {
        this.stats.elementPlusMissing++
        this.addError(`Element Plus 变量未映射: ${variable}`)
      }
    })

    console.log('✅ Element Plus 映射检查完成')
    console.log(`   已映射变量: ${this.stats.elementPlusMapped}`)
    console.log(`   缺失变量: ${this.stats.elementPlusMissing}`)
  }

  // 检查应用集成
  validateAppIntegration() {
    console.log('🔍 检查应用集成情况...')

    const mainTsPath = path.join(config.webTeacherPath, 'src/main.ts')
    const appStorePath = path.join(config.webTeacherPath, 'src/stores/app.ts')
    const appVuePath = path.join(config.webTeacherPath, 'src/App.vue')

    const mainContent = this.readFile(mainTsPath)
    const requiredImports = [
      '@reopeninnolab/ui-kit/styles',
      'themeManager'
    ]

    requiredImports.forEach(item => {
      if (!mainContent.includes(item)) {
        this.addError(`main.ts 缺少 UI Kit 集成: ${item}`)
      }
    })

    const appStoreContent = this.readFile(appStorePath)
    const requiredStoreMethods = [
      'setTheme',
      'applyTheme',
      'isDarkMode',
      'isHighContrastMode',
      'getThemeColor',
      'getSubjectColor'
    ]

    requiredStoreMethods.forEach(method => {
      if (!appStoreContent.includes(method)) {
        this.addError(`app store 缺少主题管理方法: ${method}`)
      }
    })

    const appVueContent = this.readFile(appVuePath)
    const requiredVariables = [
      '--edu-color-',
      '--edu-spacing-',
      '--edu-font-'
    ]

    let hasValidVariables = false
    requiredVariables.forEach(variable => {
      if (appVueContent.includes(variable)) {
        hasValidVariables = true
      }
    })

    if (!hasValidVariables) {
      this.addError('App.vue 未使用 UI Kit CSS 变量')
    }

    console.log('✅ 应用集成检查完成')
  }

  // 扫描硬编码颜色（代码层面）
  scanHardcodedColors() {
    console.log('🔍 扫描硬编码颜色...')

    const targetRoots = [
      path.join(config.uiKitPath, 'src'),
      path.join(config.webTeacherPath, 'src'),
      path.join(config.webStudentPath, 'src')
    ]

    const colorRegex = /#(?:[0-9a-fA-F]{3,8})\b/g
    const rgbRegex = /rgba?\(/g
    const skipDirs = new Set(['node_modules', 'dist', '.turbo', '.git', '.cache'])
    const validExt = new Set(['.vue', '.scss', '.css', '.ts', '.tsx', '.js', '.jsx', '.json'])

    const walk = dir => {
      if (!fs.existsSync(dir)) return
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      entries.forEach(entry => {
        if (skipDirs.has(entry.name)) return
        const fullPath = path.join(dir, entry.name)

        if (entry.isDirectory()) {
          walk(fullPath)
          return
        }

        const ext = path.extname(entry.name)
        if (!validExt.has(ext)) return
        if (COLOR_FILE_ALLOWLIST.has(fullPath)) return

        const content = this.readFile(fullPath)
        if (!content) return

        const hexMatches = content.match(colorRegex) || []
        const rgbMatches = content.match(rgbRegex) || []

        if (hexMatches.length > 0 || rgbMatches.length > 0) {
          this.addWarning(`检测到硬编码颜色: ${fullPath} (${hexMatches.length} hex, ${rgbMatches.length} rgb/rgba)`)
        }
      })
    }

    targetRoots.forEach(walk)
    console.log('✅ 硬编码颜色扫描完成')
  }

  // 检查组件样式一致性
  validateComponentConsistency() {
    console.log('🔍 检查组件样式一致性...')

    const componentShowcasePath = path.join(config.webTeacherPath, 'src/components/ComponentShowcase.vue')

    if (fs.existsSync(componentShowcasePath)) {
      const content = this.readFile(componentShowcasePath)

      const validVariablePatterns = [
        /var\(--edu-color-[a-z-]+(\d+)?\)/g,
        /var\(--edu-spacing-[a-z0-9-]+\)/g,
        /var\(--edu-font-[a-z-]+\)/g,
        /var\(--edu-border-radius-[a-z-]+\)/g,
        /var\(--edu-shadow-[a-z-]+\)/g,
        /var\(--edu-duration-[a-z-]+\)/g,
        /var\(--edu-easing-[a-z-]+\)/g
      ]

      let validVariableCount = 0
      validVariablePatterns.forEach(pattern => {
        const matches = content.match(pattern)
        if (matches) {
          validVariableCount += matches.length
        }
      })

      if (validVariableCount < 10) {
        this.addWarning(`ComponentShowcase.vue 使用的 UI Kit 变量较少 (${validVariableCount} 个)`)
      }

      const hardcodedColorRegex = /#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/g
      const hardcodedColors = content.match(hardcodedColorRegex)
      if (hardcodedColors && hardcodedColors.length > 5) {
        this.addWarning(`ComponentShowcase.vue 可能存在过多硬编码颜色 (${hardcodedColors.length} 个)`)
      }
    }

    console.log('✅ 组件样式一致性检查完成')
  }

  // 生成报告
  generateReport() {
    console.log('\n' + '='.repeat(60))
    console.log('📊 主题验证报告')
    console.log('='.repeat(60))

    if (this.errors.length === 0) {
      console.log('✅ 所有检查通过！')
    } else {
      console.log(`❌ 发现 ${this.errors.length} 个错误:`)
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`)
      })
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  ${this.warnings.length} 个警告:`)
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`)
      })
    }

    console.log('\n📈 统计信息:')
    console.log(`   CSS 变量: ${this.stats.validVariables}/${this.stats.totalVariables} 有效`)
    console.log(`   Element Plus 映射: ${this.stats.elementPlusMapped}/${this.stats.elementPlusMapped + this.stats.elementPlusMissing} 已映射`)

    console.log('\n💡 建议:')
    if (this.errors.length > 0) {
      console.log('   - 请修复上述错误以确保主题系统正常工作')
    }
    if (this.warnings.length > 0) {
      console.log('   - 建议处理警告以提升代码质量')
    }
    if (this.stats.elementPlusMissing > 0) {
      console.log('   - 完善 Element Plus 变量映射以确保组件样式一致性')
    }

    console.log('\n📎 相关文档:')
    console.log('   - 设计指南: docs/design/THEME_GUIDE.md')
    console.log('   - 组件展示: http://localhost:5173/component-showcase')
    console.log('   - UI Kit 令牌: packages/ui-kit/src/theme/tokens.json')

    return this.errors.length === 0
  }

  // 运行所有验证
  validate() {
    console.log('🚀 开始主题验证...\n')

    this.validateCSSVariableNaming()
    this.validateThemeFile()
    this.validateElementPlusMapping()
    this.validateAppIntegration()
    this.scanHardcodedColors()
    this.validateComponentConsistency()

    return this.generateReport()
  }
}

// 主程序
function main() {
  const validator = new ThemeValidator()
  const success = validator.validate()

  process.exit(success ? 0 : 1)
}

if (require.main === module) {
  main()
}

module.exports = ThemeValidator
