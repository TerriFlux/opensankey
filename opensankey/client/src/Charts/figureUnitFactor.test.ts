import { FIGURE_VALUE_FORMAT_DEFAULTS, figureValueFormatOf, figureValueFormatter } from './figureFormat'

// 30/09/2026 — LE FACTEUR D UNITE ARRIVE DANS LES FIGURES (os#1511). Julien, capture a l appui :
// « la couronne ne gere pas bien les unites » — le flux disait « 59.32 Mt », la couronne
// « 59 320 Mt » : elle prenait le symbole du diagramme sans son diviseur (kt -> Mt : 1 000).

describe('le facteur d unite des figures', () => {
  test('il divise le nombre ecrit, comme le dessin', () => {
    const format = figureValueFormatOf({}, 'Mt', FIGURE_VALUE_FORMAT_DEFAULTS, 1000)
    expect(figureValueFormatter(format)(59320).replace(/\s/g, ' ')).toBe(new Intl.NumberFormat().format(59.32) + ' Mt')
  })

  test('sans facteur, rien ne change', () => {
    const format = figureValueFormatOf({}, 'kt')
    expect(figureValueFormatter(format)(42)).toBe(new Intl.NumberFormat().format(42) + ' kt')
  })

  test('un facteur nul ou negatif est ignore', () => {
    expect(figureValueFormatter({ ...FIGURE_VALUE_FORMAT_DEFAULTS, factor: 0 })(42))
      .toBe(new Intl.NumberFormat().format(42))
  })
})
