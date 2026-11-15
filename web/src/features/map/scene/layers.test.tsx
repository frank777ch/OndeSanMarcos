import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'

vi.mock('@react-three/drei', () => ({
  Line: (props: { dashed?: boolean; lineWidth?: number; color?: string }) => (
    <div data-testid="line" data-dashed={String(!!props.dashed)} data-color={props.color} />
  ),
}))

import { campusOsm } from '../data/campusData'
import { Boundary } from './layers'
import { readMapColors } from './useMapColors'

const wrap = (node: ReactNode) => render(<>{node}</>)

describe('layers', () => {
  it('RF-40.8: el contorno del campus es una línea punteada del color del tema', () => {
    const colors = readMapColors()
    wrap(<Boundary colors={colors} />)
    const lines = screen.getAllByTestId('line')
    expect(lines).toHaveLength(campusOsm.boundary.length)
    for (const l of lines) {
      expect(l.dataset.dashed).toBe('true')
      expect(l.dataset.color).toBe(colors.boundary)
    }
  })
})
