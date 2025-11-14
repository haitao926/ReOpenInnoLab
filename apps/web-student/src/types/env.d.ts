/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_VERSION: string
  readonly VITE_AI_SERVICE_URL: string
  readonly VITE_LAB_SERVICE_URL: string
  readonly VITE_COURSE_SERVICE_URL: string
  readonly VITE_CLASSROOM_SERVICE_URL: string
  readonly VITE_IDENTITY_SERVICE_URL: string
  readonly VITE_UPLOAD_URL: string
  readonly VITE_MAX_FILE_SIZE: string
  readonly VITE_ALLOWED_FILE_TYPES: string
  readonly VITE_ENABLE_MOCK: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_ENABLE_PWA: string
  readonly VITE_STRIPE_PUBLIC_KEY: string
  readonly VITE_MICROSOFT_CLIENT_ID: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_WECHAT_APP_ID: string
  readonly VITE_GITHUB_CLIENT_ID: string
  readonly VITE_QQ_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}