import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from './test-utils'
import MarketplacePage from '../pages/Marketplace/MarketplacePage'
import toast from 'react-hot-toast'

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn()
  }
}))

describe('MarketplacePage', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render page heading', () => {
      render(<MarketplacePage />)
      expect(screen.getByRole('heading', { name: /route marketplace/i, level: 1 })).toBeInTheDocument()
    })

    it('should render list route button in header', () => {
      render(<MarketplacePage />)
      const headerButton = screen.getByRole('button', { name: /list a route for sale/i })
      expect(headerButton).toBeInTheDocument()
      expect(headerButton).toHaveClass('btn', 'btn-primary')
    })

    it('should render welcome message initially', () => {
      render(<MarketplacePage />)
      expect(screen.getByText('Welcome to the Marketplace')).toBeInTheDocument()
      expect(screen.getByText(/browse available routes or list your own/i)).toBeInTheDocument()
    })

    it('should render both CTA buttons in empty state', () => {
      render(<MarketplacePage />)
      expect(screen.getByRole('button', { name: /^list route for sale$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /browse available routes/i })).toBeInTheDocument()
    })
  })

  describe('List Route for Sale CTA', () => {
    it('should open listing modal when header button clicked', async () => {
      render(<MarketplacePage />)

      const headerButton = screen.getByRole('button', { name: /list a route for sale/i })

      // Modal should not be visible initially
      expect(screen.queryByRole('heading', { name: /create marketplace listing/i })).not.toBeInTheDocument()

      await user.click(headerButton)

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create marketplace listing/i })).toBeInTheDocument()
      })
    })

    it('should open listing modal when empty state button clicked', async () => {
      render(<MarketplacePage />)

      const listButton = screen.getByRole('button', { name: /^list route for sale$/i })
      await user.click(listButton)

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /create marketplace listing/i })).toBeInTheDocument()
      })
    })

    it('should show all form sections in modal', async () => {
      render(<MarketplacePage />)

      const headerButton = screen.getByRole('button', { name: /list a route for sale/i })
      await user.click(headerButton)

      await waitFor(() => {
        expect(screen.getByText('Listing Information')).toBeInTheDocument()
        expect(screen.getByText('Route Details')).toBeInTheDocument()
        expect(screen.getByText('Pricing')).toBeInTheDocument()
        expect(screen.getByText("What's Included")).toBeInTheDocument()
        expect(screen.getByText('Contact Information')).toBeInTheDocument()
      })
    })

    it('should close modal when cancel clicked', async () => {
      render(<MarketplacePage />)

      const headerButton = screen.getByRole('button', { name: /list a route for sale/i })
      await user.click(headerButton)

      const cancelButton = await screen.findByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /create marketplace listing/i })).not.toBeInTheDocument()
      })
    })

    it('should validate required fields', async () => {
      render(<MarketplacePage />)

      const headerButton = screen.getByRole('button', { name: /list a route for sale/i })
      await user.click(headerButton)

      // Try to submit without filling required fields
      const submitButton = await screen.findByRole('button', { name: /create listing/i })
      await user.click(submitButton)

      expect(toast.error).toHaveBeenCalledWith('Please fill in required fields')
      // Modal should still be open
      expect(screen.getByRole('heading', { name: /create marketplace listing/i })).toBeInTheDocument()
    })

    it('should submit with valid data', async () => {
      render(<MarketplacePage />)

      const headerButton = screen.getByRole('button', { name: /list a route for sale/i })
      await user.click(headerButton)

      // Fill required fields
      await user.type(screen.getByLabelText(/listing title/i), 'Test Listing')
      await user.type(screen.getByLabelText(/route name \*/i), 'Test Route')
      await user.type(screen.getByLabelText(/asking price/i), '50000')

      // Submit
      const submitButton = screen.getByRole('button', { name: /create listing/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Listing created successfully!')
        // Modal should close
        expect(screen.queryByRole('heading', { name: /create marketplace listing/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Browse Routes CTA', () => {
    it('should show listings when browse clicked', async () => {
      render(<MarketplacePage />)

      const browseButton = screen.getByRole('button', { name: /browse available routes/i })

      // Should show empty state initially
      expect(screen.getByText('Welcome to the Marketplace')).toBeInTheDocument()

      await user.click(browseButton)

      // Should show listings
      await waitFor(() => {
        expect(screen.getByText('Beverly Hills Premium Route')).toBeInTheDocument()
        expect(screen.getByText('Santa Monica Coastal Route')).toBeInTheDocument()
        expect(screen.getByText('Pasadena Family Route')).toBeInTheDocument()
      })
    })

    it('should show filter button when listings visible', async () => {
      render(<MarketplacePage />)

      const browseButton = screen.getByRole('button', { name: /browse available routes/i })
      await user.click(browseButton)

      await waitFor(() => {
        const filterButton = screen.getByRole('button', { name: /filters/i })
        expect(filterButton).toBeInTheDocument()
      })
    })

    it('should toggle filter panel', async () => {
      render(<MarketplacePage />)

      const browseButton = screen.getByRole('button', { name: /browse available routes/i })
      await user.click(browseButton)

      const filterButton = await screen.findByRole('button', { name: /filters/i })

      // Filter panel should be hidden initially
      expect(screen.queryByLabelText(/location/i)).not.toBeInTheDocument()

      await user.click(filterButton)

      // Filter panel should appear
      await waitFor(() => {
        expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/min accounts/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/max price/i)).toBeInTheDocument()
      })
    })

    it('should show info message when apply filters clicked', async () => {
      render(<MarketplacePage />)

      const browseButton = screen.getByRole('button', { name: /browse available routes/i })
      await user.click(browseButton)

      const filterButton = await screen.findByRole('button', { name: /filters/i })
      await user.click(filterButton)

      const applyButton = await screen.findByRole('button', { name: /apply filters/i })
      await user.click(applyButton)

      expect(toast.info).toHaveBeenCalledWith('Filters will be applied soon')
    })

    it('should show view details button on each listing', async () => {
      render(<MarketplacePage />)

      const browseButton = screen.getByRole('button', { name: /browse available routes/i })
      await user.click(browseButton)

      await waitFor(() => {
        const viewButtons = screen.getAllByRole('button', { name: /view details/i })
        expect(viewButtons).toHaveLength(3) // 3 mock listings
      })
    })

    it('should show info message when view details clicked', async () => {
      render(<MarketplacePage />)

      const browseButton = screen.getByRole('button', { name: /browse available routes/i })
      await user.click(browseButton)

      const viewButtons = await screen.findAllByRole('button', { name: /view details/i })
      await user.click(viewButtons[0])

      expect(toast.info).toHaveBeenCalledWith('Contact seller feature coming soon')
    })
  })

  describe('Listing Display', () => {
    beforeEach(async () => {
      render(<MarketplacePage />)
      const browseButton = screen.getByRole('button', { name: /browse available routes/i })
      await user.click(browseButton)
    })

    it('should display listing details', async () => {
      await waitFor(() => {
        // Check first listing
        expect(screen.getByText('Beverly Hills Premium Route')).toBeInTheDocument()
        expect(screen.getByText('Beverly Hills, CA')).toBeInTheDocument()
        expect(screen.getByText('45')).toBeInTheDocument() // accounts
        expect(screen.getByText('$8,500')).toBeInTheDocument() // monthly revenue
        expect(screen.getByText('$85,000')).toBeInTheDocument() // price
        expect(screen.getByText('Elite Pool Services')).toBeInTheDocument() // seller
      })
    })

    it('should display all three mock listings', async () => {
      await waitFor(() => {
        const cards = document.querySelectorAll('.card')
        // Filter card + 3 listing cards = 4 cards total (header has filters card)
        expect(cards.length).toBeGreaterThanOrEqual(3)
      })
    })

    it('should have proper labels for listing data', async () => {
      render(<MarketplacePage />)

      const browseButton = screen.getByRole('button', { name: /browse available routes/i })
      await user.click(browseButton)

      await waitFor(() => {
        const accountLabels = screen.getAllByText('Accounts:')
        const revenueLabels = screen.getAllByText('Monthly Revenue:')
        const sellerLabels = screen.getAllByText('Seller:')

        expect(accountLabels.length).toBeGreaterThan(0)
        expect(revenueLabels.length).toBeGreaterThan(0)
        expect(sellerLabels.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Create Listing Modal Fields', () => {
    beforeEach(async () => {
      render(<MarketplacePage />)
      const headerButton = screen.getByRole('button', { name: /list a route for sale/i })
      await user.click(headerButton)
    })

    it('should have all required fields marked', async () => {
      await waitFor(() => {
        // Check that required fields are marked with asterisk in label
        expect(screen.getByText('Listing Title *')).toBeInTheDocument()
        expect(screen.getByText('Route Name *')).toBeInTheDocument()
        expect(screen.getByText(/Asking Price.*\*/)).toBeInTheDocument()
      })
    })

    it('should have reason for selling dropdown', async () => {
      const reasonSelect = await screen.findByLabelText(/reason for selling/i)
      expect(reasonSelect).toBeInTheDocument()

      const options = reasonSelect.querySelectorAll('option')
      expect(options).toHaveLength(5) // blank + 4 options
      expect(options[1]).toHaveTextContent('Retirement')
      expect(options[2]).toHaveTextContent('Relocation')
    })

    it('should have checkboxes for included items', async () => {
      await waitFor(() => {
        expect(screen.getByLabelText(/equipment included/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/vehicle included/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/customer list included/i)).toBeInTheDocument()
      })
    })

    it('should have contact fields', async () => {
      await waitFor(() => {
        expect(screen.getByLabelText(/contact email/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/contact phone/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria labels', () => {
      render(<MarketplacePage />)

      expect(screen.getByLabelText(/list a route for sale/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/list route for sale/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/browse available routes/i)).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      render(<MarketplacePage />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('Route Marketplace')
    })
  })
})