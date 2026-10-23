import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IconButton } from './IconButton'

describe('IconButton', () => {
  it('expone el label como nombre accesible', async () => {
    const onClick = vi.fn()
    render(
      <IconButton label="Mi ubicación" onClick={onClick}>
        <span>•</span>
      </IconButton>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Mi ubicación' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
