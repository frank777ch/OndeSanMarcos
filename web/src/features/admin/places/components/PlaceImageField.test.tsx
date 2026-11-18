import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '@/services/api/client'
import { PlaceImageField } from './PlaceImageField'

const upload = vi.fn()
vi.mock('@/services/api/adminPlacesApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/adminPlacesApi')>()),
  uploadPlaceImage: (file: File) => upload(file),
}))

const file = (name = 'foto.jpg', type = 'image/jpeg', size = 10) => {
  const f = new File(['x'], name, { type })
  Object.defineProperty(f, 'size', { value: size })
  return f
}

function setup(value = '') {
  const onChange = vi.fn()
  const onBusyChange = vi.fn()
  render(<PlaceImageField id="img" value={value} onChange={onChange} onBusyChange={onBusyChange} />)
  const input = screen.getByLabelText('Imagen de portada') as HTMLInputElement
  // `applyAccept: false`: el filtro `accept` del input lo aplica el navegador, no el código que probamos.
  const choose = (f: File) => userEvent.setup({ applyAccept: false }).upload(input, f)
  return { onChange, onBusyChange, input, choose }
}

beforeEach(() => {
  upload.mockReset()
})

describe('PlaceImageField', () => {
  it('sin imagen: invita a subir una, es opcional y no hay vista previa ni «Quitar»', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Subir imagen' })).toBeInTheDocument()
    expect(screen.getByText(/Opcional/)).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Quitar' })).not.toBeInTheDocument()
  })

  it('el selector solo ofrece JPG, PNG y WebP', () => {
    const { input } = setup()
    expect(input).toHaveAttribute('type', 'file')
    expect(input).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp')
  })

  it('al elegir un archivo lo sube y entrega la dirección que devuelve el servidor', async () => {
    upload.mockResolvedValue('http://localhost:3902/uploads/a.jpg')
    const { onChange, onBusyChange, choose } = setup()
    const chosen = file()
    await choose(chosen)
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('http://localhost:3902/uploads/a.jpg'))
    expect(upload).toHaveBeenCalledWith(chosen)
    expect(onBusyChange.mock.calls.map((c) => c[0])).toEqual([true, false])
  })

  it('con imagen: muestra la vista previa y permite cambiarla o quitarla', async () => {
    const { onChange } = setup('http://x/y.jpg')
    expect(screen.getByRole('img', { name: 'Vista previa de la portada' })).toHaveAttribute('src', 'http://x/y.jpg')
    expect(screen.getByRole('button', { name: 'Cambiar imagen' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Quitar' }))
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('rechaza un tipo que no es JPG, PNG o WebP sin llamar al servidor', async () => {
    const { onChange, choose } = setup()
    await choose(file('animada.gif', 'image/gif'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Solo se admiten imágenes JPG, PNG o WebP.')
    expect(upload).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('rechaza más de 5 MB sin llamar al servidor, pero acepta justo 5 MB', async () => {
    upload.mockResolvedValue('http://x/ok.jpg')
    const { onChange, choose } = setup()
    await choose(file('grande.jpg', 'image/jpeg', 5 * 1024 * 1024 + 1))
    expect(await screen.findByRole('alert')).toHaveTextContent('La imagen pesa más de 5 MB.')
    expect(upload).not.toHaveBeenCalled()
    await choose(file('justa.jpg', 'image/jpeg', 5 * 1024 * 1024))
    await waitFor(() => expect(onChange).toHaveBeenCalledWith('http://x/ok.jpg'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('muestra el motivo que da el servidor y no cambia la imagen', async () => {
    upload.mockImplementation(() => Promise.reject(new ApiError('http', 'POST: 415', 415, undefined, { detail: 'Solo se admiten imágenes JPG, PNG o WebP.' })))
    const { onChange, onBusyChange, choose } = setup('http://x/y.jpg')
    await choose(file())
    expect(await screen.findByRole('alert')).toHaveTextContent('Solo se admiten imágenes JPG, PNG o WebP.')
    expect(onChange).not.toHaveBeenCalled()
    expect(onBusyChange).toHaveBeenLastCalledWith(false)
  })

  it('un fallo de red da un mensaje genérico', async () => {
    upload.mockImplementation(() => Promise.reject(new ApiError('network', 'sin conexión')))
    const { choose } = setup()
    await choose(file())
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo subir la imagen. Revisa tu conexión')
  })

  it('un 401 no añade mensaje (la sesión ya se cerró)', async () => {
    upload.mockImplementation(() => Promise.reject(new ApiError('http', 'POST: 401', 401)))
    const { onBusyChange, choose } = setup()
    await choose(file())
    await waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(false))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('muestra el error que llega del formulario (p. ej. una dirección no válida)', () => {
    render(<PlaceImageField id="img" value="" error="Debe ser una dirección http o https." onChange={vi.fn()} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Debe ser una dirección http o https.')
  })
})
