import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authService, LoginRequest, RegisterRequest } from '../services/authService'
import { User } from '../types'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

// Query keys for auth operations
export const authKeys = {
  profile: () => ['auth', 'profile'] as const,
  verify: () => ['auth', 'verify'] as const,
}

// Get user profile
export const useProfile = () => {
  const { isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: async () => {
      const response = await authService.getProfile()
      if (!response.success) {
        throw new Error(response.error || 'Failed to fetch profile')
      }
      return response.data!.user
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}

// Login mutation
export const useLogin = () => {
  const { login } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const result = await login(credentials.email, credentials.password)
      if (!result.success) {
        throw new Error(result.error || 'Login failed')
      }
      return result
    },
    onSuccess: () => {
      // Invalidate auth queries on successful login
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      toast.success('Login successful')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// Register mutation
export const useRegister = () => {
  const { register } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userData: RegisterRequest) => {
      const result = await register(userData)
      if (!result.success) {
        throw new Error(result.error || 'Registration failed')
      }
      return result
    },
    onSuccess: () => {
      // Invalidate auth queries on successful registration
      queryClient.invalidateQueries({ queryKey: ['auth'] })
      toast.success('Registration successful')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// Logout mutation
export const useLogout = () => {
  const { logout } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await authService.logout()
      logout()
    },
    onSuccess: () => {
      // Clear all queries on logout
      queryClient.clear()
      toast.success('Logged out successfully')
    },
    onError: (_error: Error) => {
      // Even if logout fails on server, clear local state
      logout()
      queryClient.clear()
      toast.error('Logout completed (with errors)')
    },
  })
}

// Update profile mutation
export const useUpdateProfile = () => {
  const { updateProfile } = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Partial<User>) => {
      const result = await updateProfile(updates)
      if (!result.success) {
        throw new Error(result.error || 'Profile update failed')
      }
      return result
    },
    onSuccess: () => {
      // Invalidate profile query to refetch updated data
      queryClient.invalidateQueries({ queryKey: authKeys.profile() })
      toast.success('Profile updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// Change password mutation
export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: {
      currentPassword: string
      newPassword: string
      confirmNewPassword: string
    }) => {
      const response = await authService.changePassword(data)
      if (!response.success) {
        throw new Error(response.error || 'Password change failed')
      }
      return response
    },
    onSuccess: () => {
      toast.success('Password changed successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// Verify token mutation
export const useVerifyToken = () => {
  const { setLoading } = useAuthStore()

  return useMutation({
    mutationFn: async () => {
      const response = await authService.verifyToken()
      if (!response.success) {
        throw new Error(response.error || 'Token verification failed')
      }
      return response.data!
    },
    onMutate: () => {
      setLoading(true)
    },
    onSettled: () => {
      setLoading(false)
    },
    onError: (error: Error) => {
      console.warn('Token verification failed:', error.message)
    },
  })
}

// Refresh token mutation
export const useRefreshToken = () => {
  return useMutation({
    mutationFn: async (refreshToken: string) => {
      const response = await authService.refreshToken(refreshToken)
      if (!response.success) {
        throw new Error(response.error || 'Token refresh failed')
      }
      return response.data!.tokens
    },
    onError: (error: Error) => {
      console.warn('Token refresh failed:', error.message)
    },
  })
}