import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'

// Layout components
import Layout from './components/Layout/Layout'
import PrivateRoute from './components/Auth/PrivateRoute'

// Pages
import HomePage from './pages/HomePage'
import LoginPage from './pages/Auth/LoginPage'
import RegisterPage from './pages/Auth/RegisterPage'
import DashboardPage from './pages/Dashboard/DashboardPage'
import RoutesPage from './pages/Routes/RoutesPage'
import RouteDetailPage from './pages/Routes/RouteDetailPage'
import ImportPage from './pages/Import/ImportPage'
import MarketplacePage from './pages/Marketplace/MarketplacePage'
import ProfilePage from './pages/Profile/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  const { initializeAuth, isLoading } = useAuthStore()

  // Initialize authentication on app load
  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  // Show loading spinner while initializing auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PoolRoute OS...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<PrivateRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="routes/:id" element={<RouteDetailPage />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="marketplace" element={<MarketplacePage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* 404 page */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App