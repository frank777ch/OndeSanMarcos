import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from './Modal'

describe('Modal', () => {
  it('no renderiza nada si está cerrado', () => {
    render(
      <Modal open={false} title="Hola" onClose={() => {}}>
        contenido
      </Modal>,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('muestra título y contenido cuando está abierto', () => {
    render(
      <Modal open title="Hola" onClose={() => {}}>
        contenido
      </Modal>,
    )
    expect(screen.getByRole('dialog', { name: 'Hola' })).toBeInTheDocument()
    expect(screen.getByText('contenido')).toBeInTheDocument()
  })

  it('se cierra con Esc y con el botón', async () => {
    const onClose = vi.fn()
    render(
      <Modal open title="Hola" onClose={onClose}>
        contenido
      </Modal>,
    )
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})

describe('Modal · foco', () => {
  function Harness({ initialFocus }: { initialFocus?: () => HTMLElement | null }) {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button onClick={() => setOpen(true)}>abrir</button>
        <Modal open={open} title="Hola" onClose={() => setOpen(false)} initialFocus={initialFocus}>
          <input aria-label="uno" />
          <input aria-label="dos" />
        </Modal>
      </>
    )
  }

  it('RF-13.4: al abrir el foco va al elemento indicado y al cerrar vuelve al botón', async () => {
    render(<Harness initialFocus={() => screen.getByLabelText('dos')} />)
    const opener = screen.getByRole('button', { name: 'abrir' })
    await userEvent.click(opener)
    expect(screen.getByLabelText('dos')).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(opener).toHaveFocus()
  })

  it('RF-13.34: sin indicación el foco va al primer elemento y Tab no sale del diálogo', async () => {
    render(<Harness />)
    await userEvent.click(screen.getByRole('button', { name: 'abrir' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
    for (let i = 0; i < 6; i++) {
      await userEvent.tab()
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }
    await userEvent.tab({ shift: true })
    expect(dialog).toContainElement(document.activeElement as HTMLElement)
  })
})

describe('Modal · panel desde arriba', () => {
  const handle = () => document.querySelector<HTMLElement>('[data-sheet-handle]')!
  const drag = (from: number, to: number) => {
    fireEvent.pointerDown(handle(), { clientY: from, pointerId: 1 })
    fireEvent.pointerMove(handle(), { clientY: to, pointerId: 1 })
    fireEvent.pointerUp(handle(), { clientY: to, pointerId: 1 })
  }
  const setup = (mobileSheet?: boolean) => {
    const onClose = vi.fn()
    render(
      <Modal open title="Hola" onClose={onClose} mobileSheet={mobileSheet}>
        contenido
      </Modal>,
    )
    return onClose
  }

  it('RF-13.46 y RF-13.49: con mobileSheet el panel es de tipo «arriba» y tiene asa; sin la prop no', () => {
    setup(true)
    expect(screen.getByRole('dialog')).toHaveAttribute('data-sheet', 'top')
    expect(handle()).toBeInTheDocument()
  })

  it('RF-13.49: sin mobileSheet no hay asa ni data-sheet', () => {
    setup()
    expect(screen.getByRole('dialog')).not.toHaveAttribute('data-sheet')
    expect(document.querySelector('[data-sheet-handle]')).not.toBeInTheDocument()
  })

  it('RF-13.48: arrastrar el asa más de 80 px hacia arriba cierra', () => {
    const onClose = setup(true)
    drag(300, 200)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('RF-13.48: soltar antes de 80 px no cierra y el panel vuelve a su sitio', () => {
    const onClose = setup(true)
    fireEvent.pointerDown(handle(), { clientY: 300, pointerId: 1 })
    fireEvent.pointerMove(handle(), { clientY: 260, pointerId: 1 })
    expect(screen.getByRole('dialog').style.transform).toBe('translateY(-40px)')
    fireEvent.pointerUp(handle(), { clientY: 260, pointerId: 1 })
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog').style.transform).toBe('')
  })

  it('RF-13.48: arrastrar hacia abajo no mueve el panel ni lo cierra', () => {
    const onClose = setup(true)
    fireEvent.pointerDown(handle(), { clientY: 300, pointerId: 1 })
    fireEvent.pointerMove(handle(), { clientY: 400, pointerId: 1 })
    expect(screen.getByRole('dialog').style.transform).toBe('')
    fireEvent.pointerUp(handle(), { clientY: 400, pointerId: 1 })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('RF-13.49: Esc y «Cerrar» siguen cerrando', async () => {
    const onClose = setup(true)
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})

describe('Modal · difuminado y modo ancho (HU-31)', () => {
  it('RF-31.11: blurBackdrop difumina el fondo y sin él no', () => {
    const { rerender } = render(
      <Modal open title="Hola" onClose={() => {}} blurBackdrop>
        x
      </Modal>,
    )
    expect(screen.getByRole('dialog').parentElement).toHaveClass('backdrop-blur-sm')
    rerender(
      <Modal open title="Hola" onClose={() => {}}>
        x
      </Modal>,
    )
    expect(screen.getByRole('dialog').parentElement).not.toHaveClass('backdrop-blur-sm')
  })

  it('RF-31.12: en modo ancho el diálogo no hace scroll y el cuerpo ocupa el resto', () => {
    render(
      <Modal open title="Hola" onClose={() => {}} wide>
        x
      </Modal>,
    )
    expect(screen.getByRole('dialog')).toHaveClass('overflow-hidden', 'flex-col')
    expect(screen.getByRole('dialog').querySelector('[data-modal-body]')).toHaveClass('min-h-0', 'flex-1')
  })

  it('RF-31.11: la capa está por encima de todo (z-[1000])', () => {
    render(
      <Modal open title="Hola" onClose={() => {}} blurBackdrop>
        x
      </Modal>,
    )
    expect(screen.getByRole('dialog').parentElement).toHaveClass('fixed', 'inset-0', 'z-[1000]')
  })
})
