import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from './test-utils'
import ProfilePage from '../pages/Profile/ProfilePage'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

// Mock the auth store
vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn()
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

// Mock window.confirm
global.confirm = vi.fn(() => false)

describe('ProfilePage', () => {
  const user = userEvent.setup()
  const mockUpdateProfile = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
      user: {
        id: '1',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'operator',
        phone: '555-1234',
        company: 'Pool Service Inc'
      },
      updateProfile: mockUpdateProfile,
      logout: vi.fn(),
      token: 'test-token',
      login: vi.fn(),
      register: vi.fn(),
      initializeAuth: vi.fn(),
      isLoading: false,
      setLoading: vi.fn(),
    })
  })

  describe('Rendering', () => {
    it('should render profile page heading', () => {
      render(<ProfilePage />)

      expect(screen.getByRole('heading', { name: /profile settings/i })).toBeInTheDocument()
    })

    it('should render all tabs', () => {
      render(<ProfilePage />)

      expect(screen.getByRole('button', { name: /personal info/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /security/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /billing/i })).toBeInTheDocument()
    })

    it('should show personal info tab by default', () => {
      render(<ProfilePage />)

      expect(screen.getByRole('heading', { name: /personal information/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/first name/i)).toHaveValue('John')
      expect(screen.getByLabelText(/last name/i)).toHaveValue('Doe')
    })
  })

  describe('Tab Navigation', () => {
    it('should switch to security tab when clicked', async () => {
      render(<ProfilePage />)

      const securityTab = screen.getByRole('button', { name: /security/i })
      await user.click(securityTab)

      expect(screen.getByRole('heading', { name: /security settings/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument()
    })

    it('should switch to notifications tab when clicked', async () => {
      render(<ProfilePage />)

      const notifTab = screen.getByRole('button', { name: /notifications/i })
      await user.click(notifTab)

      expect(screen.getByRole('heading', { name: /notification preferences/i })).toBeInTheDocument()
    })

    it('should switch to billing tab when clicked', async () => {
      render(<ProfilePage />)

      const billingTab = screen.getByRole('button', { name: /billing/i })
      await user.click(billingTab)

      expect(screen.getByRole('heading', { name: /billing information/i })).toBeInTheDocument()
    })
  })

  describe('Personal Info Tab', () => {
    it('should display user information', () => {
      render(<ProfilePage />)

      expect(screen.getByLabelText(/first name/i)).toHaveValue('John')
      expect(screen.getByLabelText(/last name/i)).toHaveValue('Doe')
      expect(screen.getByLabelText(/email address/i)).toHaveValue('john.doe@example.com')
    })

    it('should toggle edit mode', async () => {
      render(<ProfilePage />)

      const editButton = screen.getByRole('button', { name: /^edit$/i })
      await user.click(editButton)

      // Should show save and cancel buttons in edit mode
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should save profile changes', async () => {
      mockUpdateProfile.mockResolvedValue({ success: true })
      render(<ProfilePage />)

      const editButton = screen.getByRole('button', { name: /^edit$/i })
      await user.click(editButton)

      const firstNameInput = screen.getByLabelText(/first name/i)
      await user.clear(firstNameInput)
      await user.type(firstNameInput, 'Jane')

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      expect(mockUpdateProfile).toHaveBeenCalled()
    })
  })

  describe('Security Tab', () => {
    beforeEach(async () => {
      render(<ProfilePage />)
      const securityTab = screen.getByRole('button', { name: /security/i })
      await user.click(securityTab)
    })

    it('should display password change form', () => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument()
      // There are two fields with "new password" in the label
      const newPasswordFields = screen.getAllByLabelText(/new password/i)
      expect(newPasswordFields).toHaveLength(2) // New Password and Confirm New Password
    })

    it('should handle password update', async () => {
      await user.type(screen.getByLabelText(/current password/i), 'oldpassword')
      // Get specific field by ID
      await user.type(screen.getByLabelText('New Password'), 'newpassword')
      await user.type(screen.getByLabelText(/confirm new password/i), 'newpassword')

      const updateBtn = screen.getByRole('button', { name: /update password/i })
      await user.click(updateBtn)

      expect(toast.success).toHaveBeenCalledWith('Password updated successfully')
    })

    it('should show delete account button', () => {
      expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument()
      // The danger zone section heading
      expect(screen.getByText('Danger Zone')).toBeInTheDocument()
    })
  })

  describe('Notifications Tab', () => {
    beforeEach(async () => {
      render(<ProfilePage />)
      const notifTab = screen.getByRole('button', { name: /notifications/i })
      await user.click(notifTab)
    })

    it('should display notification toggles', () => {
      expect(screen.getByRole('heading', { name: /email notifications/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /sms notifications/i })).toBeInTheDocument()
    })

    it('should save notification preferences', async () => {
      const saveButton = screen.getByRole('button', { name: /save preferences/i })
      await user.click(saveButton)

      expect(toast.success).toHaveBeenCalledWith('Preferences saved successfully')
    })
  })

  describe('Billing Tab', () => {
    beforeEach(async () => {
      render(<ProfilePage />)
      const billingTab = screen.getByRole('button', { name: /billing/i })
      await user.click(billingTab)
    })

    it('should display billing information', () => {
      expect(screen.getByText(/current plan/i)).toBeInTheDocument()
      expect(screen.getByText(/payment method/i)).toBeInTheDocument()
    })

    it('should show billing history', () => {
      expect(screen.getByRole('heading', { name: /billing history/i })).toBeInTheDocument()
    })

    it('should handle update payment method click', async () => {
      const updateBtn = screen.getByRole('button', { name: /^update$/i })
      await user.click(updateBtn)

      expect(toast.info).toHaveBeenCalledWith('Payment method update coming soon')
    })

    it('should handle upgrade plan click', async () => {
      const upgradeBtn = screen.getByRole('button', { name: /upgrade plan/i })
      await user.click(upgradeBtn)

      expect(toast.info).toHaveBeenCalledWith('Plan upgrade coming soon')
    })
  })
})