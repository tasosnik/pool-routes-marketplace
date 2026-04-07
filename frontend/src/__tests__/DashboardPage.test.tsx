import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from './test-utils'
import DashboardPage from '../pages/Dashboard/DashboardPage'

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn()
  }
}))

describe('DashboardPage', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render dashboard heading', () => {
      render(<DashboardPage />)
      expect(screen.getByRole('heading', { name: /dashboard/i, level: 1 })).toBeInTheDocument()
    })

    it('should render all metric cards', () => {
      render(<DashboardPage />)

      expect(screen.getByText('Total Routes')).toBeInTheDocument()
      expect(screen.getByText('Total Accounts')).toBeInTheDocument()
      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument()
      expect(screen.getByText('Avg. Rate')).toBeInTheDocument()
    })

    it('should render getting started section', () => {
      render(<DashboardPage />)

      expect(screen.getByText('Getting Started')).toBeInTheDocument()
      expect(screen.getByText('Welcome to PoolRoute OS!')).toBeInTheDocument()
    })

    it('should render both CTA buttons', () => {
      render(<DashboardPage />)

      expect(screen.getByRole('button', { name: /navigate to import page/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /open create route modal/i })).toBeInTheDocument()
    })
  })

  describe('Import Existing Routes CTA', () => {
    it('should navigate to import page when clicked', async () => {
      render(<DashboardPage />)

      const importButton = screen.getByRole('button', { name: /navigate to import page/i })
      await user.click(importButton)

      expect(mockNavigate).toHaveBeenCalledWith('/import')
      expect(mockNavigate).toHaveBeenCalledTimes(1)
    })

    it('should be enabled by default', () => {
      render(<DashboardPage />)

      const importButton = screen.getByRole('button', { name: /navigate to import page/i })
      expect(importButton).not.toBeDisabled()
    })

    it('should have correct styling', () => {
      render(<DashboardPage />)

      const importButton = screen.getByRole('button', { name: /navigate to import page/i })
      expect(importButton).toHaveClass('btn', 'btn-primary')
    })
  })

  describe('Create New Route CTA', () => {
    it('should open create route modal when clicked', async () => {
      render(<DashboardPage />)

      const createButton = screen.getByRole('button', { name: /open create route modal/i })

      // Modal should not be visible initially
      expect(screen.queryByRole('heading', { name: /create new route/i })).not.toBeInTheDocument()

      await user.click(createButton)

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create new route/i })).toBeInTheDocument()
      })
    })

    it('should be enabled by default', () => {
      render(<DashboardPage />)

      const createButton = screen.getByRole('button', { name: /open create route modal/i })
      expect(createButton).not.toBeDisabled()
    })

    it('should have correct styling', () => {
      render(<DashboardPage />)

      const createButton = screen.getByRole('button', { name: /open create route modal/i })
      expect(createButton).toHaveClass('btn', 'btn-outline')
    })
  })

  describe('Create Route Modal', () => {
    it('should open modal with form fields', async () => {
      render(<DashboardPage />)

      const createButton = screen.getByRole('button', { name: /open create route modal/i })
      await user.click(createButton)

      await waitFor(() => {
        // Check for form fields
        expect(screen.getByLabelText(/route name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/service area/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/number of accounts/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/monthly revenue/i)).toBeInTheDocument()
      })
    })

    it('should close modal when close button is clicked', async () => {
      render(<DashboardPage />)

      const createButton = screen.getByRole('button', { name: /open create route modal/i })
      await user.click(createButton)

      const closeButton = await screen.findByRole('button', { name: /close modal/i })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /create new route/i })).not.toBeInTheDocument()
      })
    })

    it('should close modal when cancel button is clicked', async () => {
      render(<DashboardPage />)

      const createButton = screen.getByRole('button', { name: /open create route modal/i })
      await user.click(createButton)

      const cancelButton = await screen.findByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /create new route/i })).not.toBeInTheDocument()
      })
    })

    it('should close modal when backdrop is clicked', async () => {
      render(<DashboardPage />)

      const createButton = screen.getByRole('button', { name: /open create route modal/i })
      await user.click(createButton)

      // Wait for modal to appear
      await screen.findByRole('heading', { name: /create new route/i })

      // Click the backdrop (the overlay div)
      const backdrop = document.querySelector('.fixed.inset-0.bg-black')
      if (backdrop) {
        await user.click(backdrop)
      }

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /create new route/i })).not.toBeInTheDocument()
      })
    })

    it('should navigate to routes page after successful creation', async () => {
      render(<DashboardPage />)

      const createButton = screen.getByRole('button', { name: /open create route modal/i })
      await user.click(createButton)

      // Fill in required fields
      const routeNameInput = await screen.findByLabelText(/route name/i)
      const serviceAreaInput = await screen.findByLabelText(/service area/i)

      await user.type(routeNameInput, 'Test Route')
      await user.type(serviceAreaInput, 'Test Area')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /^create route$/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/routes')
      })
    })

    it('should show validation error when required fields are empty', async () => {
      render(<DashboardPage />)

      const createButton = screen.getByRole('button', { name: /open create route modal/i })
      await user.click(createButton)

      // Try to submit without filling required fields
      const submitButton = await screen.findByRole('button', { name: /^create route$/i })
      await user.click(submitButton)

      // Modal should still be open (not submitted)
      expect(screen.getByRole('heading', { name: /create new route/i })).toBeInTheDocument()
    })
  })

  describe('Metric Cards', () => {
    it('should display zero values initially', () => {
      render(<DashboardPage />)

      // Check each metric displays 0
      const zeroValues = screen.getAllByText(/\$?0/)
      expect(zeroValues.length).toBeGreaterThanOrEqual(4)
    })

    it('should display correct metric labels', () => {
      render(<DashboardPage />)

      expect(screen.getByText('Active routes in your portfolio')).toBeInTheDocument()
      expect(screen.getByText('Pool service accounts')).toBeInTheDocument()
      expect(screen.getByText('Recurring monthly income')).toBeInTheDocument()
      expect(screen.getByText('Per account monthly')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria labels on CTAs', () => {
      render(<DashboardPage />)

      expect(screen.getByLabelText(/navigate to import page/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/open create route modal/i)).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      render(<DashboardPage />)

      const h1 = screen.getByRole('heading', { level: 1 })
      const h2 = screen.getByRole('heading', { level: 2 })

      expect(h1).toHaveTextContent('Dashboard')
      expect(h2).toHaveTextContent('Getting Started')
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid clicking of create button', async () => {
      render(<DashboardPage />)

      const createButton = screen.getByRole('button', { name: /open create route modal/i })

      // Click multiple times rapidly
      await user.click(createButton)
      await user.click(createButton)
      await user.click(createButton)

      // Should only have one modal open
      const modals = screen.getAllByRole('heading', { name: /create new route/i })
      expect(modals).toHaveLength(1)
    })

    it('should handle navigation error gracefully', async () => {
      // Mock navigate to throw error
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation failed')
      })

      render(<DashboardPage />)

      const importButton = screen.getByRole('button', { name: /navigate to import page/i })

      // Should not crash when navigation fails
      await expect(async () => {
        await user.click(importButton)
      }).not.toThrow()
    })
  })
})