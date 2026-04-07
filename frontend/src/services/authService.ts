import axios, { AxiosResponse } from 'axios'
import { ApiResponse, User } from '../types'

// Use Vite proxy in dev (/api → localhost:3001), allow override for production
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || ''

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('poolroute-auth')
    if (token) {
      try {
        const authData = JSON.parse(token)
        if (authData?.state?.token) {
          config.headers.Authorization = `Bearer ${authData.state.token}`
        }
      } catch (error) {
        console.error('Error parsing auth token:', error)
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Track ongoing refresh promise to avoid concurrent refresh attempts
let refreshPromise: Promise<any> | null = null

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Get current auth data
        const authData = localStorage.getItem('poolroute-auth')
        if (!authData) {
          throw new Error('No auth data found')
        }

        const parsed = JSON.parse(authData)
        const refreshToken = parsed?.state?.refreshToken

        if (!refreshToken) {
          throw new Error('No refresh token available')
        }

        // Use existing refresh promise or create new one
        if (!refreshPromise) {
          refreshPromise = authService.refreshToken(refreshToken)
        }

        const refreshResponse = await refreshPromise
        refreshPromise = null // Clear the promise

        if (refreshResponse.success && refreshResponse.data?.tokens) {
          // Update stored tokens
          const newAuthData = {
            ...parsed,
            state: {
              ...parsed.state,
              token: refreshResponse.data.tokens.accessToken,
              refreshToken: refreshResponse.data.tokens.refreshToken
            }
          }
          localStorage.setItem('poolroute-auth', JSON.stringify(newAuthData))

          // Update the original request header
          originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.tokens.accessToken}`

          // Retry original request
          return api(originalRequest)
        } else {
          throw new Error('Token refresh failed')
        }
      } catch (refreshError) {
        // Refresh failed - clear auth state and let React Router handle redirect
        console.warn('Token refresh failed:', refreshError)
        localStorage.removeItem('poolroute-auth')
        refreshPromise = null
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  company?: string
}

export interface LoginResponse {
  user: User
  tokens: {
    accessToken: string
    refreshToken: string
    expiresAt: Date
  }
}

export class AuthService {
  setToken(_token: string) {
    // Token is managed via localStorage and interceptors
  }

  clearToken() {
    // Token is managed via localStorage and interceptors
  }

  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const response: AxiosResponse<ApiResponse<LoginResponse>> = await api.post('/auth/login', credentials)
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      throw new Error(error.message || 'Network error')
    }
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const response: AxiosResponse<ApiResponse<LoginResponse>> = await api.post('/auth/register', userData)
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      throw new Error(error.message || 'Network error')
    }
  }

  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ user: User }>> = await api.get('/auth/profile')
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      throw new Error(error.message || 'Network error')
    }
  }

  async updateProfile(updates: Partial<User>): Promise<ApiResponse<{ user: User }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ user: User }>> = await api.put('/auth/profile', updates)
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      throw new Error(error.message || 'Network error')
    }
  }

  async changePassword(data: {
    currentPassword: string
    newPassword: string
    confirmNewPassword: string
  }): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await api.post('/auth/change-password', data)
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      throw new Error(error.message || 'Network error')
    }
  }

  async verifyToken(): Promise<ApiResponse<{ user: User; valid: boolean }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ user: User; valid: boolean }>> = await api.post('/auth/verify-token')
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      throw new Error(error.message || 'Network error')
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await api.post('/auth/logout')
      return response.data
    } catch (error: any) {
      // Even if logout fails on server, we should clear local storage
      return { success: true, message: 'Logged out' }
    }
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ tokens: any }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ tokens: any }>> = await api.post('/auth/refresh', {
        refreshToken
      })
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      throw new Error(error.message || 'Network error')
    }
  }
}

export const authService = new AuthService()