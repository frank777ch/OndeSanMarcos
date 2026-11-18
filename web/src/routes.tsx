import { Navigate, type RouteObject } from 'react-router-dom'
import { AdminGuard } from '@/features/admin/components/AdminGuard'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AppLayout } from '@/layouts/AppLayout'
import { AdminCategoriesPage } from '@/pages/AdminCategoriesPage'
import { AdminLoginPage } from '@/pages/AdminLoginPage'
import { AdminEventsPage } from '@/pages/AdminEventsPage'
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
          // Tras iniciar sesión se abre la primera pestaña del menú.
          { index: true, element: <Navigate to="lugares" replace /> },
          { path: 'lugares', element: <AdminPlacesPage /> },
          { path: 'eventos', element: <AdminEventsPage /> },
          { path: 'categorias', element: <AdminCategoriesPage /> },
          { path: 'perfil', element: <AdminProfilePage /> },
        ],
      },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Navigate to="/mapa" replace /> },
      // El mapa lo dibuja AppLayout (siempre montado, ver PersistentMap); aquí solo existe la ruta.
      { path: '/mapa', element: null },
      { path: '/asistente', element: <ChatPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
