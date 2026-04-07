import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import { UserRole } from '../../types'

// Mock axios before importing authService
const mockAxiosInstance = {
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  interceptors: {
    request: {
      use: vi.fn()
    },
    response: {
      use: vi.fn()
    }
  }
}

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
    isAxiosError: vi.fn()
  }
}))

// Import authService after mocking axios
const { authService, AuthService } = await import('../../services/authService')

interface LoginRequest {
  email: string
  password: string
}

interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  company?: string
}

// Mock window.location
delete (window as any).location
window.location = {
  pathname: '/',
  href: '',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn()
} as any

describe('AuthService', () => {
  let localStorageMock: any

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()

    // Setup localStorage mock
    localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true
    })

    // Reset window.location
    window.location.pathname = '/'
    window.location.href = ''
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      }

      const mockResponse = {
        data: {
          success: true,
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              role: UserRole.OPERATOR,
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            tokens: {
              accessToken: 'access-token-123',
              refreshToken: 'refresh-token-123',
              expiresAt: new Date()
            }
          }
        }
      }

      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const result = await authService.login(credentials)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', credentials)
      expect(result).toEqual(mockResponse.data)
      expect(result.success).toBe(true)
      expect(result.data?.user.email).toBe('test@example.com')
      expect(result.data?.tokens.accessToken).toBe('access-token-123')
    })

    it('should handle login with invalid credentials', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'wrongpassword'
      }

      const mockErrorResponse = {
        response: {
          data: {
            success: false,
            error: 'Invalid credentials'
          }
        }
      }

      mockAxiosInstance.post.mockRejectedValue(mockErrorResponse)

      const result = await authService.login(credentials)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid credentials')
    })

    it('should handle network errors during login', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      }

      mockAxiosInstance.post.mockRejectedValue(new Error('Network error'))

      await expect(authService.login(credentials)).rejects.toThrow('Network error')
    })

    it('should handle empty response data', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      }

      mockAxiosInstance.post.mockRejectedValue({
        message: 'Request failed'
      })

      await expect(authService.login(credentials)).rejects.toThrow('Request failed')
    })
  })

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const userData: RegisterRequest = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        phone: '555-1234',
        company: 'Test Company'
      }

      const mockResponse = {
        data: {
          success: true,
          data: {
            user: {
              id: 'user-456',
              email: 'newuser@example.com',
              firstName: 'New',
              lastName: 'User',
              phone: '555-1234',
              company: 'Test Company',
              role: UserRole.OPERATOR,
              emailVerified: false,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            tokens: {
              accessToken: 'access-token-456',
              refreshToken: 'refresh-token-456',
              expiresAt: new Date()
            }
          }
        }
      }

      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const result = await authService.register(userData)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/register', userData)
      expect(result).toEqual(mockResponse.data)
      expect(result.success).toBe(true)
      expect(result.data?.user.email).toBe('newuser@example.com')
    })

    it('should handle registration with existing email', async () => {
      const userData: RegisterRequest = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User'
      }

      const mockErrorResponse = {
        response: {
          data: {
            success: false,
            error: 'Email already exists'
          }
        }
      }

      mockAxiosInstance.post.mockRejectedValue(mockErrorResponse)

      const result = await authService.register(userData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Email already exists')
    })

    it('should handle validation errors during registration', async () => {
      const userData: RegisterRequest = {
        email: 'invalid-email',
        password: '123', // too short
        firstName: '',
        lastName: ''
      }

      const mockErrorResponse = {
        response: {
          data: {
            success: false,
            error: 'Validation failed'
          }
        }
      }

      mockAxiosInstance.post.mockRejectedValue(mockErrorResponse)

      const result = await authService.register(userData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation failed')
    })
  })

  describe('getProfile', () => {
    it('should successfully get user profile', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              role: UserRole.OPERATOR,
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        }
      }

      mockAxiosInstance.get.mockResolvedValue(mockResponse)

      const result = await authService.getProfile()

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/auth/profile')
      expect(result).toEqual(mockResponse.data)
      expect(result.success).toBe(true)
      expect(result.data?.user.email).toBe('test@example.com')
    })

    it('should handle unauthorized access to profile', async () => {
      const mockErrorResponse = {
        response: {
          data: {
            success: false,
            error: 'Unauthorized'
          }
        }
      }

      mockAxiosInstance.get.mockRejectedValue(mockErrorResponse)

      const result = await authService.getProfile()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('updateProfile', () => {
    it('should successfully update user profile', async () => {
      const updates = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '555-9999'
      }

      const mockResponse = {
        data: {
          success: true,
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              firstName: 'Updated',
              lastName: 'Name',
              phone: '555-9999',
              role: UserRole.OPERATOR,
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        }
      }

      mockAxiosInstance.put.mockResolvedValue(mockResponse)

      const result = await authService.updateProfile(updates)

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/auth/profile', updates)
      expect(result).toEqual(mockResponse.data)
      expect(result.success).toBe(true)
      expect(result.data?.user.firstName).toBe('Updated')
    })

    it('should handle validation errors during profile update', async () => {
      const updates = {
        phone: 'invalid-phone-number'
      }

      const mockErrorResponse = {
        response: {
          data: {
            success: false,
            error: 'Invalid phone number format'
          }
        }
      }

      mockAxiosInstance.put.mockRejectedValue(mockErrorResponse)

      const result = await authService.updateProfile(updates)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid phone number format')
    })
  })

  describe('changePassword', () => {
    it('should successfully change password', async () => {
      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmNewPassword: 'newpassword123'
      }

      const mockResponse = {
        data: {
          success: true,
          message: 'Password changed successfully'
        }
      }

      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const result = await authService.changePassword(passwordData)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/change-password', passwordData)
      expect(result).toEqual(mockResponse.data)
      expect(result.success).toBe(true)
    })

    it('should handle incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
        confirmNewPassword: 'newpassword123'
      }

      const mockErrorResponse = {
        response: {
          data: {
            success: false,
            error: 'Current password is incorrect'
          }
        }
      }

      mockAxiosInstance.post.mockRejectedValue(mockErrorResponse)

      const result = await authService.changePassword(passwordData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Current password is incorrect')
    })

    it('should handle password mismatch', async () => {
      const passwordData = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
        confirmNewPassword: 'differentpassword'
      }

      const mockErrorResponse = {
        response: {
          data: {
            success: false,
            error: 'Passwords do not match'
          }
        }
      }

      mockAxiosInstance.post.mockRejectedValue(mockErrorResponse)

      const result = await authService.changePassword(passwordData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Passwords do not match')
    })
  })

  describe('verifyToken', () => {
    it('should successfully verify valid token', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            user: {
              id: 'user-123',
              email: 'test@example.com',
              firstName: 'Test',
              lastName: 'User',
              role: UserRole.OPERATOR,
              emailVerified: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            valid: true
          }
        }
      }

      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const result = await authService.verifyToken()

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/verify-token')
      expect(result).toEqual(mockResponse.data)
      expect(result.success).toBe(true)
      expect(result.data?.valid).toBe(true)
    })

    it('should handle invalid token verification', async () => {
      const mockErrorResponse = {
        response: {
          data: {
            success: false,
            error: 'Invalid token',
            data: {
              valid: false
            }
          }
        }
      }

      mockAxiosInstance.post.mockRejectedValue(mockErrorResponse)

      const result = await authService.verifyToken()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid token')
    })
  })

  describe('logout', () => {
    it('should successfully logout', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Logged out successfully'
        }
      }

      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const result = await authService.logout()

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/logout')
      expect(result).toEqual(mockResponse.data)
      expect(result.success).toBe(true)
    })

    it('should handle logout gracefully even if server request fails', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Server error'))

      const result = await authService.logout()

      // Should still return success because local cleanup is what matters
      expect(result.success).toBe(true)
      expect(result.message).toBe('Logged out')
    })
  })

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      const refreshToken = 'refresh-token-123'
      const mockResponse = {
        data: {
          success: true,
          data: {
            tokens: {
              accessToken: 'new-access-token',
              refreshToken: 'new-refresh-token',
              expiresAt: new Date()
            }
          }
        }
      }

      mockAxiosInstance.post.mockResolvedValue(mockResponse)

      const result = await authService.refreshToken(refreshToken)

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken })
      expect(result).toEqual(mockResponse.data)
      expect(result.success).toBe(true)
      expect(result.data?.tokens.accessToken).toBe('new-access-token')
    })

    it('should handle invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token'
      const mockErrorResponse = {
        response: {
          data: {
            success: false,
            error: 'Invalid refresh token'
          }
        }
      }

      mockAxiosInstance.post.mockRejectedValue(mockErrorResponse)

      const result = await authService.refreshToken(refreshToken)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid refresh token')
    })

    it('should handle expired refresh token', async () => {
      const refreshToken = 'expired-refresh-token'
      const mockErrorResponse = {
        response: {
          data: {
            success: false,
            error: 'Refresh token expired'
          }
        }
      }

      mockAxiosInstance.post.mockRejectedValue(mockErrorResponse)

      const result = await authService.refreshToken(refreshToken)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Refresh token expired')
    })
  })

  describe('service functionality', () => {
    it('should be properly configured', () => {
      // The axios instance is created and configured during module initialization
      // This is tested implicitly by the other tests that verify API calls work correctly
      expect(authService).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should handle network errors consistently', async () => {
      const networkError = {
        message: 'Network Error'
      }

      mockAxiosInstance.get.mockRejectedValue(networkError)

      await expect(authService.getProfile()).rejects.toThrow('Network Error')
    })

    it('should handle malformed response data', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123'
      }

      // Response with no data property
      const malformedError = {
        response: null,
        message: 'Malformed response'
      }

      mockAxiosInstance.post.mockRejectedValue(malformedError)

      await expect(authService.login(credentials)).rejects.toThrow('Malformed response')
    })

    it('should handle timeout errors', async () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded'
      }

      mockAxiosInstance.post.mockRejectedValue(timeoutError)

      await expect(authService.verifyToken()).rejects.toThrow('timeout of 5000ms exceeded')
    })
  })

  describe('service instance', () => {
    it('should expose setToken and clearToken methods for compatibility', () => {
      expect(typeof authService.setToken).toBe('function')
      expect(typeof authService.clearToken).toBe('function')

      // These methods should not throw errors
      expect(() => authService.setToken('some-token')).not.toThrow()
      expect(() => authService.clearToken()).not.toThrow()
    })

    it('should be an instance of AuthService', () => {
      expect(authService).toBeInstanceOf(AuthService)
    })
  })
})