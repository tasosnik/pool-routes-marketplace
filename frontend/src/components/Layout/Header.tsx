import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { Menu, X, User, LogOut, Settings, MapPin, Upload, TrendingUp } from 'lucide-react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsProfileMenuOpen(false)
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mr-2">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">PoolRoute OS</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/dashboard')
                      ? 'text-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/routes"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/routes')
                      ? 'text-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  My Routes
                </Link>
                <Link
                  to="/import"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/import')
                      ? 'text-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Import
                </Link>
                <Link
                  to="/marketplace"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/marketplace')
                      ? 'text-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Marketplace
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/marketplace"
                  className={`text-sm font-medium transition-colors ${
                    isActive('/marketplace')
                      ? 'text-primary-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Browse Routes
                </Link>
              </>
            )}
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700 hidden lg:block">
                    {user?.firstName} {user?.lastName}
                  </span>
                </button>

                {isProfileMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Profile Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive('/dashboard')
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <TrendingUp className="w-4 h-4 inline mr-2" />
                    Dashboard
                  </Link>
                  <Link
                    to="/routes"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive('/routes')
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <MapPin className="w-4 h-4 inline mr-2" />
                    My Routes
                  </Link>
                  <Link
                    to="/import"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive('/import')
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Upload className="w-4 h-4 inline mr-2" />
                    Import
                  </Link>
                  <Link
                    to="/marketplace"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive('/marketplace')
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <TrendingUp className="w-4 h-4 inline mr-2" />
                    Marketplace
                  </Link>

                  {/* Mobile user menu */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center px-3 py-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-700">
                        {user?.firstName} {user?.lastName}
                      </span>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 inline mr-2" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-700"
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/marketplace"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive('/marketplace')
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Browse Routes
                  </Link>
                  <div className="pt-4 border-t border-gray-200">
                    <Link
                      to="/login"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:text-gray-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="block px-3 py-2 rounded-md text-base font-medium bg-primary-600 text-white hover:bg-primary-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}