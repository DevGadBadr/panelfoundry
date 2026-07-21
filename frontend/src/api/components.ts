import { api } from './client'
import type { Component, PaginatedResponse, PriceListEntry } from './types'

export const componentsApi = {
  list: () => api.get<PaginatedResponse<Component>>('/api/components/'),
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
}
