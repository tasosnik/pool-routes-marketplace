import axios, { AxiosResponse } from 'axios'
import { RouteListing } from '../types'

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('poolroute-auth')
  if (token) {
    try {
      const authData = JSON.parse(token)
      if (authData?.state?.token) {
        config.headers.Authorization = `Bearer ${authData.state.token}`
      }
    } catch {}
  }
  return config
})

export interface MarketplaceListResponse {
  data: RouteListing[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface CreateListingRequest {
  routeId: string
  title: string
  description: string
  askingPrice: number
  accountCount: number
  monthlyRevenue: number
  retentionRate: number
  averageAccountAge: number
  equipmentIncluded?: boolean
  customerTransition?: boolean
  escrowPeriod?: number
  retentionGuaranteePercentage?: number
  retentionGuaranteePeriod?: number
  retentionPenaltyRate?: number
}

class MarketplaceService {
  async getListings(params?: Record<string, string | number>): Promise<{ success: boolean; data?: MarketplaceListResponse; error?: string }> {
    try {
      const query = params ? '?' + new URLSearchParams(params as any).toString() : ''
      const response: AxiosResponse<MarketplaceListResponse> = await api.get(`/marketplace${query}`)
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || error.message || 'Network error' }
    }
  }

  async getListing(id: string): Promise<{ success: boolean; data?: RouteListing; error?: string }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: RouteListing }> = await api.get(`/marketplace/${id}`)
      return { success: true, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || error.message || 'Network error' }
    }
  }

  async createListing(data: CreateListingRequest): Promise<{ success: boolean; data?: RouteListing; error?: string }> {
    try {
      const response: AxiosResponse<{ success: boolean; data: RouteListing }> = await api.post('/marketplace', data)
      return { success: true, data: response.data.data }
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || error.message || 'Network error' }
    }
  }
}

export const marketplaceService = new MarketplaceService()
