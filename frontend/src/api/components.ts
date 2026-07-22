import { api } from './client'
import type { Component, PaginatedResponse, PriceListEntry } from './types'

export interface ComponentListParams {
  page?: number
  page_size?: number
  type?: string | null
  manufacturer?: string | null
  search?: string | null
}

export interface ComponentFacets {
  types: string[]
  manufacturers: string[]
  count: number
}

function buildQuery(params: ComponentListParams): string {
  const qs = new URLSearchParams()
  if (params.page != null) qs.set('page', String(params.page))
  if (params.page_size != null) qs.set('page_size', String(params.page_size))
  if (params.type) qs.set('type', params.type)
  if (params.manufacturer) qs.set('manufacturer', params.manufacturer)
  const search = params.search?.trim()
  if (search) qs.set('search', search)
  const s = qs.toString()
  return s ? `?${s}` : ''
}

export const componentsApi = {
  list: (params: ComponentListParams = {}) =>
    api.get<PaginatedResponse<Component>>(
      `/api/components/${buildQuery(params)}`,
    ),
  facets: () => api.get<ComponentFacets>('/api/components/facets/'),
  get: (sn: string) => api.get<Component>(`/api/components/${sn}/`),
  create: (data: Omit<Component, 'created_at' | 'updated_at' | 'pricelist_id'>) =>
    api.post<Component>('/api/components/', data),
  update: (sn: string, data: Partial<Omit<Component, 'pricelist_id'>>) =>
    api.patch<Component>(`/api/components/${sn}/`, data),
  delete: (sn: string) => api.delete(`/api/components/${sn}/`),

  listPrices: (sn: string) =>
    api.get<PriceListEntry[]>(`/api/components/${sn}/prices/`),
  addPrice: (
    sn: string,
    data: Pick<PriceListEntry, 'price' | 'quantity' | 'order_time'>,
  ) => api.post<PriceListEntry>(`/api/components/${sn}/prices/`, data),
  updatePrice: (
    id: number,
    data: Pick<PriceListEntry, 'price' | 'quantity' | 'order_time'>,
  ) => api.patch<PriceListEntry>(`/api/prices/${id}/`, data),
  deletePrice: (id: number) => api.delete(`/api/prices/${id}/`),
}
