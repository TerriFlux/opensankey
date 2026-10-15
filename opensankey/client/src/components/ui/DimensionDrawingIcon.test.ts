import { dimensionDrawingIconName } from './DimensionDrawingIcon'

// os#1511 — le bouton d une dimension dit son dessin, comme celui d une couronne.

describe('os#1511 icone du dessin d une dimension', () => {
  test('un membre, en bandes, en noeuds', () => {
    expect(dimensionDrawingIconName('one', false)).toBe('one')
    expect(dimensionDrawingIconName('other', false)).toBe('one')
    expect(dimensionDrawingIconName('multi', false)).toBe('bands')
    expect(dimensionDrawingIconName('nodes', false)).toBe('nodes')
  })

  test('un diagramme par membre : diagrammes separes, en noeuds comme en bandes', () => {
    expect(dimensionDrawingIconName('nodes', true)).toBe('separate')
    expect(dimensionDrawingIconName('multi', true)).toBe('separate')
    // Un seul membre affiche : rien a separer.
    expect(dimensionDrawingIconName('one', true)).toBe('one')
  })

  test('en expansion : son propre visuel, seulement en noeuds', () => {
    expect(dimensionDrawingIconName('nodes', false, true)).toBe('expansion')
    expect(dimensionDrawingIconName('multi', false, true)).toBe('bands')
  })
})
