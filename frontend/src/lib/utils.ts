import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format mm dimensions: drop trailing zeros (380.00 → 380, 78.60 → 78.6). */
export function formatMm(value: string | number | null | undefined): string | null {
  if (value == null || value === '') return null
  const n = Number(value)
  if (Number.isNaN(n)) return String(value)
  return String(parseFloat(n.toFixed(2)))
}

/** Canonical manufacturer spellings (case-insensitive). */
const MANUFACTURER_CANONICAL: Record<string, string> = {
  wago: 'Wago',
}

/** Normalize manufacturer aliases to a single display spelling (e.g. WAGO → Wago). */
export function normalizeManufacturer(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return ''
  return MANUFACTURER_CANONICAL[trimmed.toLowerCase()] ?? trimmed
}
