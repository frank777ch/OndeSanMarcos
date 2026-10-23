import { Navigate, type RouteObject } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { ChatPage } from '@/pages/ChatPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const routes: RouteObject[] = [
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
