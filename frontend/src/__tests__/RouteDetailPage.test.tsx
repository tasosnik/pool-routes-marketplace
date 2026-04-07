import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from './test-utils'
import RouteDetailPage from '../pages/Routes/RouteDetailPage'
import toast from 'react-hot-toast'

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

// Mock react-router-dom useParams
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
    useNavigate: () => mockNavigate
  }
})

// Mock window.confirm
global.confirm = vi.fn(() => false)

describe('RouteDetailPage', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should show loading state initially', () => {
      render(<RouteDetailPage />)

      expect(screen.getByText('', { selector: '.animate-pulse' })).toBeInTheDocument()
    })

    it('should render route detail page after loading', async () => {
      render(<RouteDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Beverly Hills Premium Route')).toBeInTheDocument()
      })
    })

    it('should render all tabs', async () => {
      render(<RouteDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Overview')).toBeInTheDocument()
        expect(screen.getByText(/Accounts \(\d+\)/)).toBeInTheDocument()
        expect(screen.getByText('Analytics')).toBeInTheDocument()
      })
    })

    it('should show back button', async () => {
      render(<RouteDetailPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/back to routes/i)).toBeInTheDocument()
      })
    })

    it('should show action buttons', async () => {
      render(<RouteDetailPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/edit route/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/delete route/i)).toBeInTheDocument()
      })
    })
  })

  describe('Overview Tab', () => {
    it('should display route statistics by default', async () => {
      render(<RouteDetailPage />)

      await waitFor(() => {
        expect(screen.getByText(/total accounts/i)).toBeInTheDocument()
        expect(screen.getByText(/monthly revenue/i)).toBeInTheDocument()
        expect(screen.getByText(/avg. service rate/i)).toBeInTheDocument()
        expect(screen.getByText(/active accounts/i)).toBeInTheDocument()
      })
    })

    it('should display route values', async () => {
      render(<RouteDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('45')).toBeInTheDocument() // total accounts
        expect(screen.getByText('$8,500')).toBeInTheDocument() // revenue
        expect(screen.getByText('42')).toBeInTheDocument() // active accounts
      })
    })
  })

  describe('Tab Navigation', () => {
    it('should switch to accounts tab when clicked', async () => {
      render(<RouteDetailPage />)

      await waitFor(() => {
        expect(screen.getByText(/Accounts \(\d+\)/)).toBeInTheDocument()
      })

      const accountsTab = screen.getByText(/Accounts \(\d+\)/)
      await user.click(accountsTab)

      expect(screen.getByText(/customer accounts/i)).toBeInTheDocument()
      // Should show table headers
      expect(screen.getByText('Customer')).toBeInTheDocument()
      expect(screen.getByText('Address')).toBeInTheDocument()
      expect(screen.getByText('Rate')).toBeInTheDocument()
    })

    it('should switch to analytics tab when clicked', async () => {
      render(<RouteDetailPage />)

      await waitFor(() => {
        expect(screen.getByText('Analytics')).toBeInTheDocument()
      })

      const analyticsTab = screen.getByText('Analytics')
      await user.click(analyticsTab)

      expect(screen.getByText(/performance metrics/i)).toBeInTheDocument()
      expect(screen.getByText(/revenue trend/i)).toBeInTheDocument()
    })
  })

  describe('Actions', () => {
    it('should handle edit route click', async () => {
      render(<RouteDetailPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/edit route/i)).toBeInTheDocument()
      })

      const editButton = screen.getByLabelText(/edit route/i)
      await user.click(editButton)

      expect(toast.info).toHaveBeenCalledWith('Edit mode enabled')
    })

    it('should handle delete route click', async () => {
      render(<RouteDetailPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/delete route/i)).toBeInTheDocument()
      })

      const deleteButton = screen.getByLabelText(/delete route/i)
      await user.click(deleteButton)

      // Should show confirmation modal
      expect(screen.getByText(/Delete Route\?/)).toBeInTheDocument()
      expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument()
      // There are two buttons with "Delete Route" text - get the one in the modal
      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i })
      const modalDeleteButton = deleteButtons.find(btn => btn.textContent === 'Delete Route')
      expect(modalDeleteButton).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should close delete modal on cancel', async () => {
      render(<RouteDetailPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/delete route/i)).toBeInTheDocument()
      })

      const deleteButton = screen.getByLabelText(/delete route/i)
      await user.click(deleteButton)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      // Modal should be closed
      expect(screen.queryByText(/Delete Route\?/)).not.toBeInTheDocument()
    })

    it('should handle confirm delete', async () => {
      render(<RouteDetailPage />)

      await waitFor(() => {
        expect(screen.getByLabelText(/delete route/i)).toBeInTheDocument()
      })

      const deleteButton = screen.getByLabelText(/delete route/i)
      await user.click(deleteButton)

      // Get the modal delete button specifically
      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i })
      const modalDeleteButton = deleteButtons.find(btn => btn.textContent === 'Delete Route')
      if (modalDeleteButton) {
        await user.click(modalDeleteButton)
      }

      expect(toast.success).toHaveBeenCalledWith('Route deleted successfully')
      expect(mockNavigate).toHaveBeenCalledWith('/routes')
    })
  })

  describe('Customer Accounts Tab', () => {
    beforeEach(async () => {
      render(<RouteDetailPage />)

      await waitFor(() => {
        expect(screen.getByText(/Accounts \(\d+\)/)).toBeInTheDocument()
      })

      const accountsTab = screen.getByText(/Accounts \(\d+\)/)
      await user.click(accountsTab)
    })

    it('should display customer list', () => {
      expect(screen.getByText('John Smith')).toBeInTheDocument()
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
      expect(screen.getByText('Robert Johnson')).toBeInTheDocument()
    })

    it('should show add account button', () => {
      expect(screen.getByRole('button', { name: /add account/i })).toBeInTheDocument()
    })

    it('should show customer addresses', () => {
      expect(screen.getByText(/123 Rodeo Drive/)).toBeInTheDocument()
      expect(screen.getByText(/456 Sunset Blvd/)).toBeInTheDocument()
    })
  })
})
