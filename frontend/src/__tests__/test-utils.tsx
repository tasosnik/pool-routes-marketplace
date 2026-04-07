import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import { User, UserRole } from '../types'

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock user data
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'mock-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: '+1-555-0100',
  company: 'Test Company',
  role: UserRole.OPERATOR,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

// Mock demo users
export const mockDemoUsers = [
  createMockUser({
    email: 'admin@poolroute.com',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN
  }),
  createMockUser({
    email: 'john.smith@example.com',
    firstName: 'John',
    lastName: 'Smith',
    role: UserRole.OPERATOR
  }),
  createMockUser({
    email: 'sarah.johnson@example.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: UserRole.OPERATOR
  }),
  createMockUser({
    email: 'mike.wilson@example.com',
    firstName: 'Mike',
    lastName: 'Wilson',
    role: UserRole.SELLER
  }),
  createMockUser({
    email: 'lisa.brown@example.com',
    firstName: 'Lisa',
    lastName: 'Brown',
    role: UserRole.BUYER
  }),
]

// Mock tokens
export const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
}

// Mock API responses
export const mockApiResponse = <T,>(data: T, success = true) => ({
  success,
  data,
  message: success ? 'Success' : 'Error',
})

export const mockApiError = (error = 'Test error') => ({
  success: false,
  error,
})

// Utility to mock localStorage auth data
export const mockAuthStorage = (user: User | null = null, token: string | null = null) => {
  const authData = user && token ? {
    state: {
      user,
      token,
      isAuthenticated: true,
    }
  } : null

  return authData ? JSON.stringify(authData) : null
}

// Mock window.location methods
export const mockLocationReload = vi.fn()
export const mockLocationAssign = vi.fn()

Object.defineProperty(window, 'location', {
  value: {
    ...window.location,
    reload: mockLocationReload,
    assign: mockLocationAssign,
  },
  writable: true,
})

export { customRender as render }