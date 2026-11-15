import { CATEGORY_ICONS, CATEGORY_ICON_NAMES, getCategoryIcon } from './categoryIcons'

describe('categoryIcons', () => {
  it('un nombre desconocido o vacío usa el ícono por defecto', () => {
    expect(getCategoryIcon('no-existe')).toBe(CATEGORY_ICONS['map-pin'])
    expect(getCategoryIcon(undefined)).toBe(CATEGORY_ICONS['map-pin'])
  })

  it('los nombres son kebab-case y los íconos de las categorías originales existen', () => {
    for (const name of CATEGORY_ICON_NAMES) expect(name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    for (const name of ['graduation-cap', 'utensils-crossed', 'theater', 'trophy', 'door-open', 'briefcase', 'stethoscope', 'wrench', 'shapes'])
      expect(getCategoryIcon(name)).toBe(CATEGORY_ICONS[name])
  })
})
