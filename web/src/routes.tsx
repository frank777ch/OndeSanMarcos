import { Navigate, type RouteObject } from 'react-router-dom'
import { AdminGuard } from '@/features/admin/components/AdminGuard'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AppLayout } from '@/layouts/AppLayout'
import { AdminCategoriesPage } from '@/pages/AdminCategoriesPage'
import { AdminLoginPage } from '@/pages/AdminLoginPage'
import { AdminPlacesPage } from '@/pages/AdminPlacesPage'
import { AdminProfilePage } from '@/pages/AdminProfilePage'
import { ChatPage } from '@/pages/ChatPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const routes: RouteObject[] = [
  // Área de administración: sin enlace desde la web pública (se entra por la dirección).
  { path: '/admin/login', element: <AdminLoginPage /> },
  {
    path: '/admin',
    element: <AdminGuard />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminProfilePage /> },
          { path: 'lugares', element: <AdminPlacesPage /> },
          { path: 'categorias', element: <AdminCategoriesPage /> },
        ],
      },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Navigate to="/mapa" replace /> },
      {
        path: '/mapa',
        // Carga diferida: mapbox-gl pesa mucho y no hace falta en el resto de páginas.
        lazy: async () => ({
          Component: (await import('@/pages/MapPage')).MapPage,
        }),
      },
      { path: '/asistente', element: <ChatPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
