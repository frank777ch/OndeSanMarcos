import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from './AppLayout'

function renderLayout() {
  const router = createMemoryRouter([{ path: '/', element: <AppLayout />, children: [{ index: true, element: <p>hola</p> }] }])
  render(<RouterProvider router={router} />)
}

describe('AppLayout · barra lateral', () => {
  beforeEach(() => localStorage.clear())

  it('empieza expandida y el botón la contrae y la expande', async () => {
    renderLayout()
    const toggle = screen.getByRole('button', { name: 'Contraer barra lateral' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Expandir barra lateral' })).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(screen.getByRole('button', { name: 'Expandir barra lateral' }))
    expect(screen.getByRole('button', { name: 'Contraer barra lateral' })).toBeInTheDocument()
  })

  it('contraída, los enlaces conservan su nombre accesible', async () => {
    renderLayout()
    await userEvent.click(screen.getByRole('button', { name: 'Contraer barra lateral' }))
    expect(screen.getByRole('link', { name: 'Mapa' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Asistente' })).toBeInTheDocument()
  })

  it('recuerda la preferencia', async () => {
    renderLayout()
    await userEvent.click(screen.getByRole('button', { name: 'Contraer barra lateral' }))
    document.body.innerHTML = ''
    renderLayout()
    expect(screen.getByRole('button', { name: 'Expandir barra lateral' })).toBeInTheDocument()
  })
})
