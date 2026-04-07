import axios, { AxiosResponse } from 'axios'
import { ApiResponse, Route, PoolAccount } from '../types'

// Use Vite proxy in dev (/api → localhost:3001), allow override for production
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || ''

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('poolroute-auth')
    if (token) {
      try {
        const authData = JSON.parse(token)
        if (authData?.state?.token) {
          config.headers.Authorization = `Bearer ${authData.state.token}`
        }
      } catch (error) {
        console.error('Error parsing auth token:', error)
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export interface RouteStatsResponse {
  totalRoutes: number
  totalAccounts: number
  monthlyRevenue: number
  averageRate: number
}

export interface CreateRouteRequest {
  name: string
  description?: string
  location: string
  isForSale?: boolean
  askingPrice?: number
}

// Build serviceArea object from a location string for the backend API
// Uses a simple hash to generate unique-per-location placeholder coordinates.
// In production, this should be replaced with a geocoding service (e.g., Mapbox).
function buildServiceArea(location: string) {
  // Generate deterministic but location-specific coordinates from the string
  let hash = 0
  for (let i = 0; i < location.length; i++) {
    hash = ((hash << 5) - hash) + location.charCodeAt(i)
    hash |= 0
  }
  // Map hash to a plausible US lat/lng range (lat: 25-48, lng: -124 to -70)
  const lat = 25 + Math.abs(hash % 2300) / 100  // 25.00 to 48.00
  const lng = -124 + Math.abs((hash >> 8) % 5400) / 100  // -124.00 to -70.00

  const offset = 0.01
  return {
    name: location,
    boundaries: [
      { latitude: lat - offset, longitude: lng - offset },
      { latitude: lat + offset, longitude: lng - offset },
      { latitude: lat + offset, longitude: lng + offset }
    ],
    centerPoint: { latitude: lat, longitude: lng }
  }
}

export interface UpdateRouteRequest extends Partial<CreateRouteRequest> {}

export interface RouteFilters {
  page?: number
  limit?: number
  search?: string
  location?: string
  isForSale?: boolean
}

export interface RoutesListResponse {
  routes: Route[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export class RouteService {
  async getUserStats(): Promise<ApiResponse<RouteStatsResponse>> {
    try {
      // Get user's routes to calculate stats
      const routesResponse = await this.getRoutes({ limit: 1000 }) // Get all routes

      if (!routesResponse.success || !routesResponse.data) {
        return {
          success: false,
          error: 'Failed to fetch routes for stats calculation'
        }
      }

      const routes = routesResponse.data.routes

      const stats: RouteStatsResponse = {
        totalRoutes: routes.length,
        totalAccounts: routes.reduce((sum, route) => sum + (route.totalAccounts || 0), 0),
        monthlyRevenue: routes.reduce((sum, route) => sum + (route.monthlyRevenue || 0), 0),
        averageRate: routes.length > 0 ?
          routes.reduce((sum, route) => sum + (route.averageRate || 0), 0) / routes.length : 0
      }

      return {
        success: true,
        data: stats
      }
    } catch (error: any) {
      console.error('Error calculating user stats:', error)
      return {
        success: false,
        error: error.message || 'Network error'
      }
    }
  }

  async getRoutes(filters: RouteFilters = {}): Promise<ApiResponse<RoutesListResponse>> {
    try {
      const params = new URLSearchParams()
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.search) params.append('search', filters.search)
      if (filters.location) params.append('location', filters.location)
      if (filters.isForSale !== undefined) params.append('isForSale', filters.isForSale.toString())

      const response: AxiosResponse = await api.get(`/routes?${params}`)
      const raw = response.data
      // Backend returns { success, data: Route[], pagination } — normalize to { routes, pagination }
      return {
        success: raw.success,
        data: {
          routes: Array.isArray(raw.data) ? raw.data : [],
          pagination: raw.pagination || { page: 1, limit: 10, total: 0, totalPages: 0 }
        }
      }
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      throw new Error(error.message || 'Network error')
    }
  }

  async getRoute(id: string): Promise<ApiResponse<{ route: Route; accounts?: PoolAccount[] }>> {
    try {
      const response: AxiosResponse = await api.get(`/routes/${id}`)
      const raw = response.data
      // Backend returns { success, data: RouteObject } — normalize to { route, accounts }
      const routeData = raw.data || {}
      return {
        success: raw.success,
        data: {
          route: routeData,
          accounts: routeData.accounts || []
        }
      }
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      throw new Error(error.message || 'Network error')
    }
  }

  async createRoute(routeData: CreateRouteRequest): Promise<ApiResponse<{ route: Route }>> {
    try {
      // Backend expects serviceArea object, not a location string
      const payload = {
        name: routeData.name,
        description: routeData.description,
        serviceArea: buildServiceArea(routeData.location),
      }
      const response: AxiosResponse<ApiResponse<{ route: Route }>> = await api.post('/routes', payload)
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      throw new Error(error.message || 'Network error')
    }
  }

  async updateRoute(id: string, updates: UpdateRouteRequest): Promise<ApiResponse<{ route: Route }>> {
    try {
      // Transform location string to serviceArea object if provided
      const payload: any = { ...updates }
      if (payload.location) {
        payload.serviceArea = buildServiceArea(payload.location)
        delete payload.location
      }
      const response: AxiosResponse = await api.put(`/routes/${id}`, payload)
      const raw = response.data
      return {
        success: raw.success,
        data: { route: raw.data || raw }
      } as ApiResponse<{ route: Route }>
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      throw new Error(error.message || 'Network error')
    }
  }

  async deleteRoute(id: string): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await api.delete(`/routes/${id}`)
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      throw new Error(error.message || 'Network error')
    }
  }

  async updateSaleStatus(id: string, isForSale: boolean, askingPrice?: number): Promise<ApiResponse<{ route: Route }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ route: Route }>> = await api.put(`/routes/${id}/sale-status`, {
        isForSale,
        askingPrice
      })
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      throw new Error(error.message || 'Network error')
    }
  }

  async recalculateStats(id: string): Promise<ApiResponse<{ route: Route }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ route: Route }>> = await api.put(`/routes/${id}/stats`)
      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      throw new Error(error.message || 'Network error')
    }
  }

  async addAccount(routeId: string, accountData: {
    customerName: string
    customerEmail?: string
    customerPhone?: string
    street: string
    city?: string
    state?: string
    zipCode?: string
    monthlyRate?: number
    serviceType?: string
    frequency?: string
    notes?: string
  }): Promise<ApiResponse<{ account: PoolAccount }>> {
    try {
      const response: AxiosResponse = await api.post(`/routes/${routeId}/accounts`, accountData)
      const raw = response.data
      return { success: raw.success, data: { account: raw.data } }
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data
      }
      throw new Error(error.message || 'Network error')
    }
  }
}

export const routeService = new RouteService()