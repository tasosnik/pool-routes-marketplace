import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from './test-utils'
import Header from '../components/Layout/Header'
import { useAuthStore } from '../store/authStore'

// Mock the auth store
vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn()
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' })
  }
})

describe('Header', () => {
  const user = userEvent.setup()
  const mockLogout = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Logo and Branding', () => {
    it('should render logo and app name', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: false,
        user: null,
        logout: mockLogout,
        token: null,
        login: vi.fn(),
        register: vi.fn(),
        updateProfile: vi.fn(),
        initializeAuth: vi.fn(),
        isLoading: false,
        setLoading: vi.fn(),
      })

      render(<Header />)

      expect(screen.getByText('PoolRoute OS')).toBeInTheDocument()
      const logo = screen.getByRole('link', { name: /poolroute os/i })
      expect(logo).toHaveAttribute('href', '/')
    })
  })

  describe('Unauthenticated State', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: false,
        user: null,
        logout: mockLogout,
        token: null,
        login: vi.fn(),
        register: vi.fn(),
        updateProfile: vi.fn(),
        initializeAuth: vi.fn(),
        isLoading: false,
        setLoading: vi.fn(),
      })
    })

    it('should show login and register links when not authenticated', () => {
      render(<Header />)

      const loginLink = screen.getByRole('link', { name: /sign in/i })
      const registerLink = screen.getByRole('link', { name: /get started/i })

      expect(loginLink).toBeInTheDocument()
      expect(loginLink).toHaveAttribute('href', '/login')
      expect(registerLink).toBeInTheDocument()
      expect(registerLink).toHaveAttribute('href', '/register')
    })

    it('should show browse routes link for unauthenticated users', () => {
      render(<Header />)

      expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /my routes/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: /import/i })).not.toBeInTheDocument()
      // Marketplace is shown as "Browse Routes" for unauthenticated users
      expect(screen.getByRole('link', { name: /browse routes/i })).toBeInTheDocument()
    })
  })

  describe('Authenticated State', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        user: {
          id: '1',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'operator'
        },
        logout: mockLogout,
        token: 'test-token',
        login: vi.fn(),
        register: vi.fn(),
        updateProfile: vi.fn(),
        initializeAuth: vi.fn(),
        isLoading: false,
        setLoading: vi.fn(),
      })
    })

    it('should show navigation links when authenticated', () => {
      render(<Header />)

      expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /my routes/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /import/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /marketplace/i })).toBeInTheDocument()
    })

    it('should show user name when authenticated', () => {
      render(<Header />)

      // The header shows full name on desktop
      expect(screen.getByText(/john/i)).toBeInTheDocument()
      expect(screen.getByText(/doe/i)).toBeInTheDocument()
    })

    it('should toggle profile menu on user button click', async () => {
      render(<Header />)

      // Find the user menu button (button containing the user icon and name)
      const userButtons = screen.getAllByRole('button')
      const userButton = userButtons.find(btn => btn.textContent?.includes('John'))

      // Menu should be closed initially
      expect(screen.queryByRole('link', { name: /profile/i })).not.toBeInTheDocument()

      // Click to open menu
      if (userButton) {
        await user.click(userButton)
        expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /profile settings/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()

        // Click again to close
        await user.click(userButton)
        expect(screen.queryByRole('link', { name: /profile/i })).not.toBeInTheDocument()
      }
    })

    it('should navigate to profile when profile link clicked', async () => {
      render(<Header />)

      const userButtons = screen.getAllByRole('button')
      const userButton = userButtons.find(btn => btn.textContent?.includes('John'))

      if (userButton) {
        await user.click(userButton)
        const profileLink = screen.getByRole('link', { name: /profile/i })
        expect(profileLink).toHaveAttribute('href', '/profile')
      }
    })

    it('should handle logout', async () => {
      render(<Header />)

      const userButtons = screen.getAllByRole('button')
      const userButton = userButtons.find(btn => btn.textContent?.includes('John'))

      if (userButton) {
        await user.click(userButton)
        const logoutButton = screen.getByRole('button', { name: /sign out/i })
        await user.click(logoutButton)

        expect(mockLogout).toHaveBeenCalled()
        expect(mockNavigate).toHaveBeenCalledWith('/')
      }
    })
  })

  describe('Mobile Menu', () => {
    beforeEach(() => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        user: {
          id: '1',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'operator'
        },
        logout: mockLogout,
        token: 'test-token',
        login: vi.fn(),
        register: vi.fn(),
        updateProfile: vi.fn(),
        initializeAuth: vi.fn(),
        isLoading: false,
        setLoading: vi.fn(),
      })
    })

    it('should have mobile menu button', () => {
      render(<Header />)

      // The mobile menu button doesn't have an aria-label, find it by checking for the menu icon
      const buttons = screen.getAllByRole('button')
      const mobileMenuButton = buttons.find(btn => btn.querySelector('.lucide-menu'))
      expect(mobileMenuButton).toBeInTheDocument()
    })

    it('should toggle mobile menu on button click', async () => {
      render(<Header />)

      const buttons = screen.getAllByRole('button')
      const mobileMenuButton = buttons.find(btn => btn.querySelector('.lucide-menu'))

      // Menu should be closed initially
      const navLinks = screen.queryAllByRole('link', { name: /dashboard/i })
      // Desktop nav is always visible, mobile nav is hidden
      expect(navLinks).toHaveLength(1)

      // Click to open mobile menu
      if (mobileMenuButton) {
        await user.click(mobileMenuButton)

        // Now should have both desktop and mobile nav links
        const expandedNavLinks = screen.queryAllByRole('link', { name: /dashboard/i })
        expect(expandedNavLinks).toHaveLength(2) // One for desktop, one for mobile
      }
    })

    it('should show close icon when mobile menu is open', async () => {
      render(<Header />)

      const buttons = screen.getAllByRole('button')
      const mobileMenuButton = buttons.find(btn => btn.querySelector('.lucide-menu'))

      if (mobileMenuButton) {
        await user.click(mobileMenuButton)
        // After clicking, the icon should change to X
        const closeIcon = document.querySelector('.lucide-x')
        expect(closeIcon).toBeInTheDocument()
      }
    })
  })

  describe('Active Route Highlighting', () => {
    it('should highlight active route', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        isAuthenticated: true,
        user: {
          id: '1',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'operator'
        },
        logout: mockLogout,
        token: 'test-token',
        login: vi.fn(),
        register: vi.fn(),
        updateProfile: vi.fn(),
        initializeAuth: vi.fn(),
        isLoading: false,
        setLoading: vi.fn(),
      })

      render(<Header />)

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
      expect(dashboardLink).toHaveClass('text-primary-600')

      const routesLink = screen.getByRole('link', { name: /my routes/i })
      expect(routesLink).toHaveClass('text-gray-500')
    })
  })
})