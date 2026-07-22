export interface Component {
  serial_number: string
  name: string
  description: string
  type: string
  part_number: string
  manufacturer: string
  pricelist_id: number
  width_mm: string | null
  height_mm: string | null
  depth_mm: string | null
  consumed_dc_current_ma: string | null
  env_temp_c: number | null
  env_coated: boolean
  serial_is_generated: boolean
  created_at: string
  updated_at: string
}

export type Currency = 'EUR' | 'USD'

export interface PriceListEntry {
  id: number
  pricelist_id: number
  component_id: string
  price: string
  quantity: number
  currency: Currency
  total: string
  order_time: string
  created_at: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
