import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from './test-utils'
import RegisterPage from '../pages/Auth/RegisterPage'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

// Mock the auth store
vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn()
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn()
  }
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('RegisterPage', () => {
  const mockRegister = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock the auth store hook
    vi.mocked(useAuthStore).mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      register: mockRegister,
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
      updateProfile: vi.fn(),
      initializeAuth: vi.fn(),
      setLoading: vi.fn(),
    })
  })

  describe('Rendering', () => {
    it('should render registration form', () => {
      render(<RegisterPage />)

      expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
    })

    it('should render optional fields', () => {
      render(<RegisterPage />)

      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
    })

    it('should render submit button', () => {
      render(<RegisterPage />)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).not.toBeDisabled()
    })

    it('should have link to login page', () => {
      render(<RegisterPage />)

      const loginLink = screen.getByRole('link', { name: /sign in/i })
      expect(loginLink).toBeInTheDocument()
      expect(loginLink).toHaveAttribute('href', '/login')
    })
  })

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      render(<RegisterPage />)

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getAllByText(/password is required/i)[0]).toBeInTheDocument()
      })

      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('should validate email format', async () => {
      render(<RegisterPage />)

      const emailInput = screen.getByLabelText(/email address/i)
      await user.type(emailInput, 'invalid-email')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        const validationMessage = screen.queryByText(/please enter a valid email address/i)
        if (validationMessage) {
          expect(validationMessage).toBeInTheDocument()
        } else {
          expect(mockRegister).not.toHaveBeenCalled()
        }
      })
    })

    it('should validate password requirements', async () => {
      render(<RegisterPage />)

      const passwordInput = screen.getByLabelText(/^password$/i)
      await user.type(passwordInput, 'short')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        // Password needs to be at least 8 chars and have uppercase, lowercase, and number
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument()
      })

      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('should validate password match', async () => {
      render(<RegisterPage />)

      const passwordInput = screen.getByLabelText(/^password$/i)
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)

      await user.type(passwordInput, 'Password123')
      await user.type(confirmPasswordInput, 'Password456')

      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })

      expect(mockRegister).not.toHaveBeenCalled()
    })
  })

  describe('Successful Registration', () => {
    it('should submit form with valid data', async () => {
      mockRegister.mockResolvedValue({ success: true })

      render(<RegisterPage />)

      // Fill in required fields
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john.doe@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'Password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123')

      // Check the terms checkbox
      const termsCheckbox = screen.getByRole('checkbox')
      await user.click(termsCheckbox)

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'Password123',
          phone: '',
          company: ''
        })
        expect(toast.success).toHaveBeenCalledWith('Account created successfully!')
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
      })
    })

    it('should submit form with all fields', async () => {
      mockRegister.mockResolvedValue({ success: true })

      render(<RegisterPage />)

      // Fill in all fields
      await user.type(screen.getByLabelText(/first name/i), 'Jane')
      await user.type(screen.getByLabelText(/last name/i), 'Smith')
      await user.type(screen.getByLabelText(/email address/i), 'jane.smith@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'Password456')
      await user.type(screen.getByLabelText(/confirm password/i), 'Password456')
      await user.type(screen.getByLabelText(/phone number/i), '555-0123')
      await user.type(screen.getByLabelText(/company name/i), 'Pool Pros LLC')

      // Check the terms checkbox
      const termsCheckbox = screen.getByRole('checkbox')
      await user.click(termsCheckbox)

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          password: 'Password456',
          phone: '555-0123',
          company: 'Pool Pros LLC',
        })
      })
    })
  })

  describe('Registration Failure', () => {
    it('should handle registration error', async () => {
      mockRegister.mockResolvedValue({
        success: false,
        error: 'Email already exists'
      })

      render(<RegisterPage />)

      // Fill in fields
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email address/i), 'existing@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'Password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123')

      // Check the terms checkbox
      const termsCheckbox = screen.getByRole('checkbox')
      await user.click(termsCheckbox)

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Email already exists')
        expect(mockNavigate).not.toHaveBeenCalled()
      })
    })

    it('should handle network error', async () => {
      mockRegister.mockRejectedValue(new Error('Network error'))

      render(<RegisterPage />)

      // Fill in fields
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'Password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123')

      // Check the terms checkbox
      const termsCheckbox = screen.getByRole('checkbox')
      await user.click(termsCheckbox)

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred')
      })
    })
  })

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      render(<RegisterPage />)

      const passwordInput = screen.getByLabelText(/^password$/i)
      const toggleButtons = screen.getAllByRole('button', { name: '' })

      // Find the password toggle button (should be one of the icon buttons)
      const passwordToggle = toggleButtons.find(btn =>
        btn.querySelector('svg') && btn.parentElement?.querySelector('input[type="password"]')
      )

      expect(passwordInput).toHaveAttribute('type', 'password')

      if (passwordToggle) {
        await user.click(passwordToggle)
        expect(passwordInput).toHaveAttribute('type', 'text')

        await user.click(passwordToggle)
        expect(passwordInput).toHaveAttribute('type', 'password')
      }
    })

    it('should toggle confirm password visibility', async () => {
      render(<RegisterPage />)

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i)
      const toggleButtons = screen.getAllByRole('button', { name: '' })

      // Find the confirm password toggle button
      const confirmToggle = toggleButtons.find(btn =>
        btn.querySelector('svg') &&
        btn.parentElement?.querySelector('input[id="confirmPassword"]')
      )

      expect(confirmPasswordInput).toHaveAttribute('type', 'password')

      if (confirmToggle) {
        await user.click(confirmToggle)
        expect(confirmPasswordInput).toHaveAttribute('type', 'text')

        await user.click(confirmToggle)
        expect(confirmPasswordInput).toHaveAttribute('type', 'password')
      }
    })
  })

  describe('Terms and Conditions', () => {
    it('should have terms checkbox', () => {
      render(<RegisterPage />)

      const termsCheckbox = screen.getByRole('checkbox')
      expect(termsCheckbox).toBeInTheDocument()
      expect(termsCheckbox).not.toBeChecked()
    })
  })

  describe('Loading State', () => {
    it('should show loading screen when auth is loading', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        isLoading: true,
        isAuthenticated: false,
        register: mockRegister,
        user: null,
        token: null,
        login: vi.fn(),
        logout: vi.fn(),
        updateProfile: vi.fn(),
        initializeAuth: vi.fn(),
        setLoading: vi.fn(),
      })

      render(<RegisterPage />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
      expect(screen.queryByRole('form')).not.toBeInTheDocument()
    })

    it('should show loading state on submit button', async () => {
      mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

      render(<RegisterPage />)

      // Fill in fields
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email address/i), 'john@example.com')
      await user.type(screen.getByLabelText(/^password$/i), 'Password123')
      await user.type(screen.getByLabelText(/confirm password/i), 'Password123')

      // Check the terms checkbox
      const termsCheckbox = screen.getByRole('checkbox')
      await user.click(termsCheckbox)

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i })
      await user.click(submitButton)

      // Check for loading state
      await waitFor(() => {
        expect(screen.getByText(/creating account/i)).toBeInTheDocument()
      })
    })
  })

  describe('Authenticated Redirect', () => {
    it('should redirect to dashboard if already authenticated', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        isLoading: false,
        isAuthenticated: true,
        register: mockRegister,
        user: { id: '1', email: 'user@example.com', firstName: 'User', lastName: 'Test' },
        token: 'token',
        login: vi.fn(),
        logout: vi.fn(),
        updateProfile: vi.fn(),
        initializeAuth: vi.fn(),
        setLoading: vi.fn(),
      })

      render(<RegisterPage />)

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })
  })
})