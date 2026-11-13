import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from './Pagination'

describe('Pagination', () => {
  it('RF-31.6a: muestra el rango y la página', () => {
    render(<Pagination page={2} pageSize={20} total={54} onPageChange={() => {}} />)
    expect(screen.getByText('21–40 de 54 · Página 2 de 3')).toBeInTheDocument()
  })

  it('la última página muestra su rango real y deshabilita «Siguiente»', () => {
    render(<Pagination page={3} pageSize={20} total={54} onPageChange={() => {}} />)
    expect(screen.getByText('41–54 de 54 · Página 3 de 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Siguiente/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Anterior/ })).toBeEnabled()
  })

  it('«Anterior» y «Siguiente» piden la página vecina', async () => {
    const onPageChange = vi.fn()
    render(<Pagination page={2} pageSize={20} total={54} onPageChange={onPageChange} />)
    await userEvent.click(screen.getByRole('button', { name: /Siguiente/ }))
    await userEvent.click(screen.getByRole('button', { name: /Anterior/ }))
    expect(onPageChange.mock.calls).toEqual([[3], [1]])
  })

  it('con una sola página no se muestra', () => {
    const { container } = render(<Pagination page={1} pageSize={20} total={20} onPageChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })
})
