import axios, { AxiosResponse } from 'axios'
import { ApiResponse, User } from '@shared/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth and redirect to login
      localStorage.removeItem('poolroute-auth')
      window.location.href = '/login'
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
  private token: string | null = null

  setToken(token: string) {
    this.token = token
  }

  clearToken() {
    this.token = null
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