import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from './test-utils'
import ImportPage from '../pages/Import/ImportPage'
import toast from 'react-hot-toast'

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn()
  }
}))

describe('ImportPage', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render page heading', () => {
      render(<ImportPage />)
      expect(screen.getByRole('heading', { name: /import routes/i, level: 1 })).toBeInTheDocument()
    })

    it('should render CSV upload card', () => {
      render(<ImportPage />)

      expect(screen.getByRole('heading', { name: /upload csv file/i })).toBeInTheDocument()
      expect(screen.getByText(/import multiple routes at once/i)).toBeInTheDocument()
    })

    it('should render manual entry card', () => {
      render(<ImportPage />)

      expect(screen.getByRole('heading', { name: /manual entry/i })).toBeInTheDocument()
      expect(screen.getByText(/enter route information manually/i)).toBeInTheDocument()
    })

    it('should render CSV format guide', () => {
      render(<ImportPage />)

      expect(screen.getByRole('heading', { name: /csv format guide/i })).toBeInTheDocument()
      expect(screen.getByText(/your csv file should include/i)).toBeInTheDocument()
    })

    it('should display sample CSV format', () => {
      render(<ImportPage />)

      expect(screen.getByText(/route name.*customer name.*address/i)).toBeInTheDocument()
    })
  })

  describe('CSV Upload CTA', () => {
    it('should render upload button', () => {
      render(<ImportPage />)

      const uploadButton = screen.getByRole('button', { name: /select csv file to upload/i })
      expect(uploadButton).toBeInTheDocument()
      expect(uploadButton).not.toBeDisabled()
    })

    it('should trigger file input when button clicked', async () => {
      render(<ImportPage />)

      const uploadButton = screen.getByRole('button', { name: /select csv file to upload/i })
      const fileInput = screen.getByLabelText(/csv file input/i) as HTMLInputElement

      // Create a mock click on the file input
      const clickSpy = vi.spyOn(fileInput, 'click')

      await user.click(uploadButton)

      expect(clickSpy).toHaveBeenCalled()
    })

    it('should accept only CSV files', () => {
      render(<ImportPage />)

      const fileInput = screen.getByLabelText(/csv file input/i) as HTMLInputElement
      expect(fileInput.accept).toBe('.csv')
    })

    it('should process valid CSV file', async () => {
      render(<ImportPage />)

      const file = new File(['test,data'], 'test.csv', { type: 'text/csv' })
      const fileInput = screen.getByLabelText(/csv file input/i) as HTMLInputElement

      // Simulate file selection
      await waitFor(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } })
      })

      // Should show processing state
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /processing/i })
        expect(button).toBeInTheDocument()
      })

      // Should show success message after processing
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('test.csv'))
      }, { timeout: 3000 })
    })

    it('should reject non-CSV files', async () => {
      render(<ImportPage />)

      const file = new File(['test'], 'test.txt', { type: 'text/plain' })
      const fileInput = screen.getByLabelText(/csv file input/i) as HTMLInputElement

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Please upload a CSV file')
      })
    })

    it('should reject files over 10MB', async () => {
      render(<ImportPage />)

      // Create a large file (over 10MB)
      const largeContent = new Array(11 * 1024 * 1024).join('a')
      const file = new File([largeContent], 'large.csv', { type: 'text/csv' })
      const fileInput = screen.getByLabelText(/csv file input/i) as HTMLInputElement

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('File size must be less than 10MB')
      })
    })

    it('should display file constraints', () => {
      render(<ImportPage />)

      expect(screen.getByText('Supported format: CSV')).toBeInTheDocument()
      expect(screen.getByText('Max file size: 10MB')).toBeInTheDocument()
    })
  })

  describe('Manual Entry CTA', () => {
    it('should render manual entry button', () => {
      render(<ImportPage />)

      const manualButton = screen.getByRole('button', { name: /open manual entry form/i })
      expect(manualButton).toBeInTheDocument()
      expect(manualButton).not.toBeDisabled()
    })

    it('should open modal when clicked', async () => {
      render(<ImportPage />)

      const manualButton = screen.getByRole('button', { name: /open manual entry form/i })

      // Modal should not be visible initially
      expect(screen.queryByRole('heading', { name: /manual route entry/i })).not.toBeInTheDocument()

      await user.click(manualButton)

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /manual route entry/i })).toBeInTheDocument()
      })
    })

    it('should show form fields in modal', async () => {
      render(<ImportPage />)

      const manualButton = screen.getByRole('button', { name: /open manual entry form/i })
      await user.click(manualButton)

      await waitFor(() => {
        // Check for form sections
        expect(screen.getByText('Route Information')).toBeInTheDocument()
        expect(screen.getByText('Customer Information')).toBeInTheDocument()
        expect(screen.getByText('Address')).toBeInTheDocument()

        // Check for required fields
        expect(screen.getByLabelText(/route name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/customer name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/street address/i)).toBeInTheDocument()
      })
    })

    it('should close modal when close button clicked', async () => {
      render(<ImportPage />)

      const manualButton = screen.getByRole('button', { name: /open manual entry form/i })
      await user.click(manualButton)

      const closeButton = await screen.findByRole('button', { name: /close modal/i })
      await user.click(closeButton)

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /manual route entry/i })).not.toBeInTheDocument()
      })
    })

    it('should close modal when cancel clicked', async () => {
      render(<ImportPage />)

      const manualButton = screen.getByRole('button', { name: /open manual entry form/i })
      await user.click(manualButton)

      const cancelButton = await screen.findByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /manual route entry/i })).not.toBeInTheDocument()
      })
    })

    it('should validate required fields', async () => {
      render(<ImportPage />)

      const manualButton = screen.getByRole('button', { name: /open manual entry form/i })
      await user.click(manualButton)

      // Try to submit without filling required fields
      const submitButton = await screen.findByRole('button', { name: /add route/i })
      await user.click(submitButton)

      // Modal should still be open
      expect(screen.getByRole('heading', { name: /manual route entry/i })).toBeInTheDocument()
      expect(toast.error).toHaveBeenCalledWith('Please fill in required fields')
    })

    it('should submit form with valid data', async () => {
      render(<ImportPage />)

      const manualButton = screen.getByRole('button', { name: /open manual entry form/i })
      await user.click(manualButton)

      // Fill required fields
      await user.type(screen.getByLabelText(/route name/i), 'Test Route')
      await user.type(screen.getByLabelText(/customer name/i), 'Test Customer')
      await user.type(screen.getByLabelText(/street address/i), '123 Test St')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add route/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Route data added successfully!')
        // Modal should close
        expect(screen.queryByRole('heading', { name: /manual route entry/i })).not.toBeInTheDocument()
      })
    })
  })

  describe('Download Sample Template Link', () => {
    it('should render download template link', () => {
      render(<ImportPage />)

      const templateLink = screen.getByText(/download sample template/i)
      expect(templateLink).toBeInTheDocument()
    })

    it('should show info message when clicked', async () => {
      render(<ImportPage />)

      const templateLink = screen.getByText(/download sample template/i)
      await user.click(templateLink)

      expect(toast.info).toHaveBeenCalledWith('Sample CSV template will be available soon')
    })
  })

  describe('Manual Entry Modal Fields', () => {
    beforeEach(async () => {
      render(<ImportPage />)
      const manualButton = screen.getByRole('button', { name: /open manual entry form/i })
      await user.click(manualButton)
    })

    it('should have service frequency dropdown', async () => {
      const frequencySelect = await screen.findByLabelText(/service frequency/i)
      expect(frequencySelect).toBeInTheDocument()

      // Check options
      const options = frequencySelect.querySelectorAll('option')
      expect(options).toHaveLength(3)
      expect(options[0]).toHaveTextContent('Weekly')
      expect(options[1]).toHaveTextContent('Bi-Weekly')
      expect(options[2]).toHaveTextContent('Monthly')
    })

    it('should have all customer fields', async () => {
      expect(await screen.findByLabelText(/customer name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/service rate/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
    })

    it('should have all address fields', async () => {
      expect(await screen.findByLabelText(/street address/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/city/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/state/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/zip code/i)).toBeInTheDocument()
    })

    it('should have notes field', async () => {
      const notesField = await screen.findByLabelText(/notes/i)
      expect(notesField).toBeInTheDocument()
      expect(notesField.tagName.toLowerCase()).toBe('textarea')
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria labels', () => {
      render(<ImportPage />)

      expect(screen.getByLabelText(/select csv file to upload/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/open manual entry form/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/csv file input/i)).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      render(<ImportPage />)

      const h1 = screen.getByRole('heading', { level: 1 })
      const h2 = screen.getByRole('heading', { level: 2 })

      expect(h1).toHaveTextContent('Import Routes')
      expect(h2).toHaveTextContent('CSV Format Guide')
    })
  })
})