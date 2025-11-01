module.exports = {
  // 基础配置
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: true,
  quoteProps: 'as-needed',
  trailingComma: 'none',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',

  // Vue 配置
  vueIndentScriptAndStyle: true,

  // HTML 配置
  htmlWhitespaceSensitivity: 'ignore',

  // JSON 配置
  proseWrap: 'preserve',
  endOfLine: 'lf',

  // 插件配置
  plugins: [],

  // 覆盖规则
  overrides: [
    {
      files: '*.vue',
      options: {
        parser: 'vue'
      }
    },
    {
      files: '*.md',
      options: {
        parser: 'markdown',
        proseWrap: 'always'
      }
    },
    {
      files: '*.json',
      options: {
        parser: 'json'
      }
    },
    {
      files: '*.yaml',
      files: '*.yml',
      options: {
        parser: 'yaml'
      }
    }
  ]
}