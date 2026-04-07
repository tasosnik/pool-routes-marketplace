import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from './test-utils'
import RoutesPage from '../pages/Routes/RoutesPage'

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

describe('RoutesPage', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render page heading', () => {
      render(<RoutesPage />)
      expect(screen.getByRole('heading', { name: /my routes/i, level: 1 })).toBeInTheDocument()
    })

    it('should render header create button', () => {
      render(<RoutesPage />)

      // Get the first button with this name (header button)
      const headerButton = screen.getAllByRole('button', { name: /create new route/i })[0]
      expect(headerButton).toBeInTheDocument()
    })

    it('should render empty state message', () => {
      render(<RoutesPage />)

      expect(screen.getByText('No routes yet')).toBeInTheDocument()
      expect(screen.getByText(/create your first route to start managing/i)).toBeInTheDocument()
    })

    it('should render empty state create button', () => {
      render(<RoutesPage />)

      const createFirstButton = screen.getByRole('button', { name: /create your first route/i })
      expect(createFirstButton).toBeInTheDocument()
    })
  })

  describe('Header Create New Route CTA', () => {
    it('should open modal when clicked', async () => {
      render(<RoutesPage />)

      // Get the header button
      const headerButton = screen.getAllByRole('button', { name: /create new route/i })[0]

      // Modal should not be visible initially
      expect(screen.queryByRole('heading', { name: /^create new route$/i })).not.toBeInTheDocument()

      await user.click(headerButton)

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /^create new route$/i })).toBeInTheDocument()
      })
    })

    it('should be enabled by default', () => {
      render(<RoutesPage />)

      const headerButton = screen.getAllByRole('button', { name: /create new route/i })[0]
      expect(headerButton).not.toBeDisabled()
    })

    it('should have correct styling', () => {
      render(<RoutesPage />)

      const headerButton = screen.getAllByRole('button', { name: /create new route/i })[0]
      expect(headerButton).toHaveClass('btn', 'btn-primary')
    })
  })

  describe('Empty State Create Your First Route CTA', () => {
    it('should open modal when clicked', async () => {
      render(<RoutesPage />)

      const createFirstButton = screen.getByRole('button', { name: /create your first route/i })

      // Modal should not be visible initially
      expect(screen.queryByRole('heading', { name: /^create new route$/i })).not.toBeInTheDocument()

      await user.click(createFirstButton)

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /^create new route$/i })).toBeInTheDocument()
      })
    })

    it('should be enabled by default', () => {
      render(<RoutesPage />)

      const createFirstButton = screen.getByRole('button', { name: /create your first route/i })
      expect(createFirstButton).not.toBeDisabled()
    })

    it('should have correct styling', () => {
      render(<RoutesPage />)

      const createFirstButton = screen.getByRole('button', { name: /create your first route/i })
      expect(createFirstButton).toHaveClass('btn', 'btn-primary')
    })
  })

  describe('Create Route Modal Behavior', () => {
    it('should open same modal from both buttons', async () => {
      render(<RoutesPage />)

      // Click header button
      const headerButton = screen.getAllByRole('button', { name: /create new route/i })[0]
      await user.click(headerButton)

      // Check modal is open
      let modal = await screen.findByRole('heading', { name: /^create new route$/i })
      expect(modal).toBeInTheDocument()

      // Close modal
      const closeButton = screen.getByRole('button', { name: /close modal/i })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /^create new route$/i })).not.toBeInTheDocument()
      })

      // Now click empty state button
      const createFirstButton = screen.getByRole('button', { name: /create your first route/i })
      await user.click(createFirstButton)

      // Same modal should appear
      modal = await screen.findByRole('heading', { name: /^create new route$/i })
      expect(modal).toBeInTheDocument()
    })

    it('should close modal when cancel is clicked', async () => {
      render(<RoutesPage />)

      const headerButton = screen.getAllByRole('button', { name: /create new route/i })[0]
      await user.click(headerButton)

      const cancelButton = await screen.findByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /^create new route$/i })).not.toBeInTheDocument()
      })
    })

    it('should close modal when backdrop is clicked', async () => {
      render(<RoutesPage />)

      const headerButton = screen.getAllByRole('button', { name: /create new route/i })[0]
      await user.click(headerButton)

      // Wait for modal
      await screen.findByRole('heading', { name: /^create new route$/i })

      // Click the backdrop
      const backdrop = document.querySelector('.fixed.inset-0.bg-black')
      if (backdrop) {
        await user.click(backdrop)
      }

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /^create new route$/i })).not.toBeInTheDocument()
      })
    })

    it('should show required fields in modal', async () => {
      render(<RoutesPage />)

      const headerButton = screen.getAllByRole('button', { name: /create new route/i })[0]
      await user.click(headerButton)

      await waitFor(() => {
        // Check for required form fields
        expect(screen.getByLabelText(/route name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/service area/i)).toBeInTheDocument()

        // Check for optional fields
        expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/number of accounts/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/monthly revenue/i)).toBeInTheDocument()
      })
    })

    it('should not submit form without required fields', async () => {
      render(<RoutesPage />)

      const headerButton = screen.getAllByRole('button', { name: /create new route/i })[0]
      await user.click(headerButton)

      // Try to submit without filling fields
      const submitButton = await screen.findByRole('button', { name: /^create route$/i })
      await user.click(submitButton)

      // Modal should still be open
      expect(screen.getByRole('heading', { name: /^create new route$/i })).toBeInTheDocument()
    })

    it('should navigate to routes page after successful creation', async () => {
      render(<RoutesPage />)

      const headerButton = screen.getAllByRole('button', { name: /create new route/i })[0]
      await user.click(headerButton)

      // Fill required fields
      const routeNameInput = await screen.findByLabelText(/route name/i)
      const serviceAreaInput = await screen.findByLabelText(/service area/i)

      await user.type(routeNameInput, 'Test Route')
      await user.type(serviceAreaInput, 'Test City, CA')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /^create route$/i })
      await user.click(submitButton)

      // Should navigate to routes (stays on same page in this case)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/routes')
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria labels on buttons', () => {
      render(<RoutesPage />)

      expect(screen.getByLabelText(/^create new route$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/create your first route/i)).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      render(<RoutesPage />)

      const h1 = screen.getByRole('heading', { level: 1 })
      const h3 = screen.getByRole('heading', { level: 3 })

      expect(h1).toHaveTextContent('My Routes')
      expect(h3).toHaveTextContent('No routes yet')
    })
  })

  describe('Edge Cases', () => {
    it('should handle rapid clicking without opening multiple modals', async () => {
      render(<RoutesPage />)

      const headerButton = screen.getAllByRole('button', { name: /create new route/i })[0]

      // Click multiple times rapidly
      await user.click(headerButton)
      await user.click(headerButton)
      await user.click(headerButton)

      // Should only have one modal
      const modals = screen.getAllByRole('heading', { name: /^create new route$/i })
      expect(modals).toHaveLength(1)
    })

    it('should not break when clicking both create buttons sequentially', async () => {
      render(<RoutesPage />)

      const headerButton = screen.getAllByRole('button', { name: /create new route/i })[0]
      const createFirstButton = screen.getByRole('button', { name: /create your first route/i })

      // Click both buttons
      await user.click(headerButton)
      await user.click(createFirstButton)

      // Should still only have one modal
      const modals = screen.getAllByRole('heading', { name: /^create new route$/i })
      expect(modals).toHaveLength(1)
    })

    it('should maintain form state when closing and reopening modal', async () => {
      render(<RoutesPage />)

      const headerButton = screen.getAllByRole('button', { name: /create new route/i })[0]
      await user.click(headerButton)

      // Enter some data
      const routeNameInput = await screen.findByLabelText(/route name/i)
      await user.type(routeNameInput, 'Test Route')

      // Close modal
      const closeButton = screen.getByRole('button', { name: /close modal/i })
      await user.click(closeButton)

      // Reopen modal
      await user.click(headerButton)

      // Check if form was reset (it should be)
      const newRouteNameInput = await screen.findByLabelText(/route name/i)
      expect(newRouteNameInput).toHaveValue('')
    })
  })

  describe('Empty State', () => {
    it('should show appropriate icon in empty state', () => {
      render(<RoutesPage />)

      // Check for map emoji
      expect(screen.getByText('🗺️')).toBeInTheDocument()
    })

    it('should show helpful message when no routes exist', () => {
      render(<RoutesPage />)

      expect(screen.getByText(/create your first route to start managing your pool service accounts/i)).toBeInTheDocument()
    })
  })
})