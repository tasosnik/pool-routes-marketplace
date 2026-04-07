import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '../types'
import { authService } from '../services/authService'

// Note: This store maintains state management while React Query handles API caching and data fetching
// The hooks in useAuth.ts provide React Query integration for components

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
    company?: string
  }) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateProfile: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>
  initializeAuth: () => void
  setLoading: (loading: boolean) => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      // Actions
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true })

          const response = await authService.login({ email, password })

          if (response.success && response.data) {
            set({
              user: response.data.user,
              token: response.data.tokens.accessToken,
              refreshToken: response.data.tokens.refreshToken,
              isAuthenticated: true,
              isLoading: false
            })
            return { success: true }
          } else {
            set({ isLoading: false })
            return { success: false, error: response.error || 'Login failed' }
          }
        } catch (error) {
          set({ isLoading: false })
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error'
          }
        }
      },

      register: async (userData) => {
        try {
          set({ isLoading: true })

          const response = await authService.register(userData)

          if (response.success && response.data) {
            set({
              user: response.data.user,
              token: response.data.tokens.accessToken,
              refreshToken: response.data.tokens.refreshToken,
              isAuthenticated: true,
              isLoading: false
            })
            return { success: true }
          } else {
            set({ isLoading: false })
            return { success: false, error: response.error || 'Registration failed' }
          }
        } catch (error) {
          set({ isLoading: false })
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error'
          }
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false
        })

        // Clear token from API service
        authService.clearToken()
      },

      updateProfile: async (userData) => {
        try {
          const { user } = get()
          if (!user) return { success: false, error: 'Not authenticated' }

          const response = await authService.updateProfile(userData)

          if (response.success && response.data) {
            set({
              user: response.data.user
            })
            return { success: true }
          } else {
            return { success: false, error: response.error || 'Update failed' }
          }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Network error'
          }
        }
      },

      initializeAuth: () => {
        const { token } = get()

        if (token) {
          // Verify token is still valid by fetching the user profile
          authService.setToken(token)

          // Timeout to prevent hanging forever
          const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Auth init timeout')), 5000)
          )

          Promise.race([authService.getProfile(), timeout])
            .then((response) => {
              if (response.success && response.data?.user) {
                set({
                  user: response.data.user,
                  isAuthenticated: true,
                  isLoading: false
                })
              } else {
                // Token is invalid, clear auth state
                get().logout()
              }
            })
            .catch(() => {
              // Token verification failed, clear auth state
              get().logout()
            })
            .finally(() => {
              // Guarantee loading is always cleared
              set({ isLoading: false })
            })
        } else {
          set({ isLoading: false })
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      }
    }),
    {
      name: 'poolroute-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)