import { Navigate, type RouteObject } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { HomePage } from '@/pages/HomePage'
import { ComponentsPage } from '@/pages/ComponentsPage'

/**
 * Route tree for the SPA. Nest new module pages under AppLayout
 * and register a matching entry in `nav.ts` (`appTabs`) for header navigation.
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: 'home', element: <HomePage /> },
      { path: 'components', element: <ComponentsPage /> },
    ],
  },
]
