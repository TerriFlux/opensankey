import { figureDrawsSunburst } from './couronneSunburstMode'

// os#1527 (Julien, 11/10 : « le centre est toujours trop gros ») — le sunburst choisi dans le menu
// de la dimension s'ecrit dans l'etat de la couronne : il doit compter comme un sunburst.

describe('os#1527 — la couronne est-elle en sunburst ?', () => {
  test('anciennes cles', () => {
    expect(figureDrawsSunburst({ levels_display: 'rings' })).toBe(true)
    expect(figureDrawsSunburst({ levels_display_by: { filiere: 'rings' } })).toBe(true)
  })
  test('etat de la couronne : une dimension dessinee en sunburst', () => {
    expect(figureDrawsSunburst({ couronne: { version: 2, order: ['produits'], dims: { produits: { drawing: 'sunburst', active: true } } } })).toBe(true)
  })
  test('etat de la couronne en secteurs : pas un sunburst', () => {
    expect(figureDrawsSunburst({ couronne: { version: 2, order: ['produits'], dims: { produits: { drawing: 'sectors', active: true } } } })).toBe(false)
    expect(figureDrawsSunburst({})).toBe(false)
  })
})
