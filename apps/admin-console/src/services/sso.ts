import { api } from '@/utils/request'
import { ElMessage } from 'element-plus'

export interface SSOProvider {
  id: string
  name: string
  displayName: string
  icon: string
  authUrl: string
  clientId: string
  redirectUri: string
  scope: string[]
}

export interface SSOConfig {
  enabled: boolean
  providers: SSOProvider[]
  defaultProvider?: string
  autoRedirect?: boolean
}

export interface SSOAuthRequest {
  provider: string
  redirectUri?: string
  state?: string
}

export interface SSOAuthResponse {
  success: boolean
  token?: string
  user?: any
  error?: string
  requiresMFA?: boolean
  mfaMethods?: string[]
}

class SSOService {
  private config: SSOConfig | null = null

  async getConfig(): Promise<SSOConfig> {
    if (this.config) {
      return this.config
    }

    try {
      const response = await api.get('/auth/sso/config')
      this.config = response.data
      return this.config
    } catch (error) {
      console.error('Failed to load SSO config:', error)
      return {
        enabled: false,
        providers: []
      }
    }
  }

  async initiateSSO(provider: string, redirectUri?: string): Promise<void> {
    try {
      const config = await this.getConfig()
      const providerConfig = config.providers.find(p => p.id === provider)

      if (!providerConfig) {
        throw new Error(`SSO provider '${provider}' not found`)
      }

      // Generate state for security
      const state = this.generateState()
      localStorage.setItem('admin-sso-state', state)
      localStorage.setItem('admin-sso-provider', provider)

      // Build authorization URL
      const params = new URLSearchParams({
        client_id: providerConfig.clientId,
        redirect_uri: redirectUri || providerConfig.redirectUri,
        response_type: 'code',
        scope: providerConfig.scope.join(' '),
        state
      })

      const authUrl = `${providerConfig.authUrl}?${params.toString()}`

      // Redirect to SSO provider
      window.location.href = authUrl
    } catch (error: any) {
      ElMessage.error(error.message || 'SSO初始化失败')
      throw error
    }
  }

  async handleSSOCallback(code: string, state: string): Promise<SSOAuthResponse> {
    try {
      // Verify state to prevent CSRF
      const savedState = localStorage.getItem('admin-sso-state')
      const savedProvider = localStorage.getItem('admin-sso-provider')

      if (!savedState || savedState !== state) {
        throw new Error('Invalid state parameter')
      }

      if (!savedProvider) {
        throw new Error('No SSO provider found')
      }

      // Exchange authorization code for token
      const response = await api.post('/auth/sso/callback', {
        provider: savedProvider,
        code,
        state,
        redirectUri: window.location.origin + '/auth/sso/callback'
      })

      // Clean up stored state
      localStorage.removeItem('admin-sso-state')
      localStorage.removeItem('admin-sso-provider')

      return response.data
    } catch (error: any) {
      localStorage.removeItem('admin-sso-state')
      localStorage.removeItem('admin-sso-provider')
      throw error
    }
  }

  async linkAccount(provider: string, token: string): Promise<boolean> {
    try {
      await api.post('/auth/sso/link', { provider, token })
      ElMessage.success('账户关联成功')
      return true
    } catch (error: any) {
      ElMessage.error(error.message || '账户关联失败')
      return false
    }
  }

  async unlinkAccount(provider: string): Promise<boolean> {
    try {
      await api.post('/auth/sso/unlink', { provider })
      ElMessage.success('账户解绑成功')
      return true
    } catch (error: any) {
      ElMessage.error(error.message || '账户解绑失败')
      return false
    }
  }

  async getLinkedAccounts(): Promise<any[]> {
    try {
      const response = await api.get('/auth/sso/linked-accounts')
      return response.data
    } catch (error) {
      console.error('Failed to get linked accounts:', error)
      return []
    }
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15)
  }

  // Check if SSO callback is being processed
  isSSOCallback(): boolean {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.has('code') && urlParams.has('state')
  }

  // Process SSO callback from URL
  async processCurrentCallback(): Promise<SSOAuthResponse | null> {
    if (!this.isSSOCallback()) {
      return null
    }

    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const state = urlParams.get('state')

    if (!code || !state) {
      throw new Error('Missing required callback parameters')
    }

    return this.handleSSOCallback(code, state)
  }
}

export const ssoService = new SSOService()

// Vue composable for easy use
export const useSSO = () => {
  const initiateLogin = async (provider: string) => {
    return ssoService.initiateSSO(provider)
  }

  const processCallback = async () => {
    return ssoService.processCurrentCallback()
  }

  const getProviders = async () => {
    const config = await ssoService.getConfig()
    return config.providers
  }

  return {
    initiateLogin,
    processCallback,
    getProviders,
    linkAccount: ssoService.linkAccount.bind(ssoService),
    unlinkAccount: ssoService.unlinkAccount.bind(ssoService),
    getLinkedAccounts: ssoService.getLinkedAccounts.bind(ssoService),
    isCallback: ssoService.isSSOCallback.bind(ssoService)
  }
}