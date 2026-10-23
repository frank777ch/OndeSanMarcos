import { Navigate, type RouteObject } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { MapPage } from '@/pages/MapPage'
import { ChatPage } from '@/pages/ChatPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Navigate to="/mapa" replace /> },
      { path: '/mapa', element: <MapPage /> },
      { path: '/asistente', element: <ChatPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
