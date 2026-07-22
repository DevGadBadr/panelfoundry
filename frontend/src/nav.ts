import { Boxes, Home } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/** Tab entries shown in the header. Add new tabs here as modules grow. */
export type AppTab = {
  path: string
  label: string
  icon: LucideIcon
}

export const appTabs: AppTab[] = [
  { path: '/home', label: 'Home', icon: Home },
  { path: '/components', label: 'Components', icon: Boxes },
]
