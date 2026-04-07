import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from './test-utils'
import Footer from '../components/Layout/Footer'

describe('Footer', () => {
  describe('Rendering', () => {
    it('should render footer with logo and app name', () => {
      render(<Footer />)

      expect(screen.getByText('PoolRoute OS')).toBeInTheDocument()
      const footer = screen.getByRole('contentinfo')
      expect(footer).toBeInTheDocument()
    })

    it('should display current year in copyright', () => {
      render(<Footer />)

      const currentYear = new Date().getFullYear()
      expect(screen.getByText(new RegExp(`© ${currentYear} PoolRoute OS`))).toBeInTheDocument()
    })

    it('should show all rights reserved text', () => {
      render(<Footer />)

      expect(screen.getByText(/all rights reserved/i)).toBeInTheDocument()
    })
  })

  describe('Footer Links', () => {
    it('should render privacy policy link', () => {
      render(<Footer />)

      const privacyLink = screen.getByRole('link', { name: /privacy policy/i })
      expect(privacyLink).toBeInTheDocument()
      expect(privacyLink).toHaveAttribute('href', '/privacy')
    })

    it('should render terms of service link', () => {
      render(<Footer />)

      const termsLink = screen.getByRole('link', { name: /terms of service/i })
      expect(termsLink).toBeInTheDocument()
      expect(termsLink).toHaveAttribute('href', '/terms')
    })

    it('should render support link', () => {
      render(<Footer />)

      const supportLink = screen.getByRole('link', { name: /support/i })
      expect(supportLink).toBeInTheDocument()
      expect(supportLink).toHaveAttribute('href', '/support')
    })
  })

  describe('Styling', () => {
    it('should have hover styles on links', () => {
      render(<Footer />)

      const privacyLink = screen.getByRole('link', { name: /privacy policy/i })
      expect(privacyLink).toHaveClass('hover:text-gray-700')
      expect(privacyLink).toHaveClass('transition-colors')
    })

    it('should have proper footer background', () => {
      render(<Footer />)

      const footer = screen.getByRole('contentinfo')
      expect(footer).toHaveClass('bg-white')
      expect(footer).toHaveClass('border-t')
    })
  })
})