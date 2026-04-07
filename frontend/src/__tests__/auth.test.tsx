import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/authService'
import { createMockUser, mockTokens, mockApiResponse, mockApiError } from './test-utils'

// Mock the auth service
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
    verifyToken: vi.fn(),
    setToken: vi.fn(),
    clearToken: vi.fn(),
  }
}))

describe('Authentication Store', () => {
  beforeEach(() => {
    // Reset Zustand store
    useAuthStore.getState().logout()

    // Clear all mocks
    vi.clearAllMocks()

    // Clear localStorage
    localStorage.clear()
  })

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockUser = createMockUser()
      const mockResponse = mockApiResponse({
        user: mockUser,
        tokens: mockTokens
      })

      vi.mocked(authService.login).mockResolvedValue(mockResponse)

      await act(async () => {
        const result = await useAuthStore.getState().login('test@example.com', 'password123')
        expect(result.success).toBe(true)
      })

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.token).toBe(mockTokens.accessToken)
      expect(state.isAuthenticated).toBe(true)
      expect(state.isLoading).toBe(false)
    })

    it('should handle login failure', async () => {
      const mockError = mockApiError('Invalid credentials')
      vi.mocked(authService.login).mockResolvedValue(mockError)

      await act(async () => {
        const result = await useAuthStore.getState().login('test@example.com', 'wrongpassword')
        expect(result.success).toBe(false)
        expect(result.error).toBe('Invalid credentials')
      })

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
    })

    it('should handle network errors', async () => {
      vi.mocked(authService.login).mockRejectedValue(new Error('Network error'))

      await act(async () => {
        const result = await useAuthStore.getState().login('test@example.com', 'password123')
        expect(result.success).toBe(false)
        expect(result.error).toBe('Network error')
      })

      const state = useAuthStore.getState()
      expect(state.isLoading).toBe(false)
    })
  })

  describe('register', () => {
    it('should register user successfully', async () => {
      const mockUser = createMockUser()
      const mockResponse = mockApiResponse({
        user: mockUser,
        tokens: mockTokens
      })

      vi.mocked(authService.register).mockResolvedValue(mockResponse)

      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        phone: '+1-555-0123',
        company: 'New Company'
      }

      await act(async () => {
        const result = await useAuthStore.getState().register(userData)
        expect(result.success).toBe(true)
      })

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.isAuthenticated).toBe(true)
    })

    it('should handle registration failure', async () => {
      const mockError = mockApiError('Email already exists')
      vi.mocked(authService.register).mockResolvedValue(mockError)

      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      }

      await act(async () => {
        const result = await useAuthStore.getState().register(userData)
        expect(result.success).toBe(false)
        expect(result.error).toBe('Email already exists')
      })

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('logout', () => {
    it('should logout user successfully', () => {
      // First set up authenticated state
      const { user, token, isAuthenticated } = useAuthStore.getState()
      useAuthStore.setState({
        user: createMockUser(),
        token: 'some-token',
        isAuthenticated: true,
        isLoading: false
      })

      act(() => {
        useAuthStore.getState().logout()
      })

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(authService.clearToken).toHaveBeenCalled()
    })
  })

  describe('updateProfile', () => {
    beforeEach(() => {
      // Set up authenticated state
      useAuthStore.setState({
        user: createMockUser(),
        token: 'some-token',
        isAuthenticated: true,
        isLoading: false
      })
    })

    it('should update profile successfully', async () => {
      const updatedUser = createMockUser({ firstName: 'Updated', lastName: 'Name' })
      const mockResponse = mockApiResponse({ user: updatedUser })
      vi.mocked(authService.updateProfile).mockResolvedValue(mockResponse)

      await act(async () => {
        const result = await useAuthStore.getState().updateProfile({
          firstName: 'Updated',
          lastName: 'Name'
        })
        expect(result.success).toBe(true)
      })

      const state = useAuthStore.getState()
      expect(state.user?.firstName).toBe('Updated')
      expect(state.user?.lastName).toBe('Name')
    })

    it('should handle unauthenticated state', async () => {
      // Clear authenticated state
      useAuthStore.setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false
      })

      await act(async () => {
        const result = await useAuthStore.getState().updateProfile({ firstName: 'Test' })
        expect(result.success).toBe(false)
        expect(result.error).toBe('Not authenticated')
      })
    })
  })

  describe('initializeAuth', () => {
    it('should initialize auth with valid token', async () => {
      const mockUser = createMockUser()
      const mockResponse = mockApiResponse({ user: mockUser })
      vi.mocked(authService.verifyToken).mockResolvedValue(mockResponse)

      // Set up persisted token
      useAuthStore.setState({
        user: null,
        token: 'valid-token',
        isAuthenticated: false,
        isLoading: true
      })

      await act(async () => {
        useAuthStore.getState().initializeAuth()
      })

      // Wait for async operation
      await vi.waitFor(() => {
        const state = useAuthStore.getState()
        expect(state.user).toEqual(mockUser)
        expect(state.isAuthenticated).toBe(true)
        expect(state.isLoading).toBe(false)
      })
    })

    it('should clear invalid token', async () => {
      const mockError = mockApiError('Invalid token')
      vi.mocked(authService.verifyToken).mockResolvedValue(mockError)

      // Set up invalid persisted token
      useAuthStore.setState({
        user: createMockUser(),
        token: 'invalid-token',
        isAuthenticated: true,
        isLoading: true
      })

      await act(async () => {
        useAuthStore.getState().initializeAuth()
      })

      // Wait for async operation
      await vi.waitFor(() => {
        const state = useAuthStore.getState()
        expect(state.user).toBeNull()
        expect(state.token).toBeNull()
        expect(state.isAuthenticated).toBe(false)
        expect(state.isLoading).toBe(false)
      })
    })

    it('should handle no token gracefully', () => {
      useAuthStore.setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: true
      })

      act(() => {
        useAuthStore.getState().initializeAuth()
      })

      const state = useAuthStore.getState()
      expect(state.isLoading).toBe(false)
      expect(authService.verifyToken).not.toHaveBeenCalled()
    })
  })
})