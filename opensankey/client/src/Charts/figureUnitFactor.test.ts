import { FIGURE_VALUE_FORMAT_DEFAULTS, figureNumberText, figureValueFormatOf, figureValueFormatter } from './figureFormat'

// 30/09/2026 — LE FACTEUR D UNITE ARRIVE DANS LES FIGURES (os#1511). Julien, capture a l appui :
// « la couronne ne gere pas bien les unites » — le flux disait « 59.32 Mt », la couronne
// « 59 320 Mt » : elle prenait le symbole du diagramme sans son diviseur (kt -> Mt : 1 000).

describe('le facteur d unite des figures', () => {
  test('il divise le nombre ecrit, comme le dessin', () => {
    const format = figureValueFormatOf({}, 'Mt', FIGURE_VALUE_FORMAT_DEFAULTS, 1000)
    expect(figureValueFormatter(format)(59320).replace(/\s/g, ' ')).toBe(new Intl.NumberFormat().format(59.3) + ' Mt')
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

// 03/10/2026 — DES DECIMALES REGULIERES. Julien : dans une meme couronne « 1,194 Mt » cotoyait
// « 0,2 Mt », « 35,2 Mt », « 4,134 Mt ». Trois chiffres significatifs, zeros de fin gardes.
describe('les decimales d une figure', () => {
  const ecrit = (v: number) => figureNumberText(v, FIGURE_VALUE_FORMAT_DEFAULTS)
  const attendu = (n: number, d: number) =>
    new Intl.NumberFormat(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }).format(n)

  test('trois chiffres significatifs et les zeros de fin', () => {
    expect(ecrit(39.27)).toBe(attendu(39.3, 1))
    expect(ecrit(4.134)).toBe(attendu(4.13, 2))
    expect(ecrit(1.194)).toBe(attendu(1.19, 2))
    expect(ecrit(0.2)).toBe(attendu(0.2, 2))
    expect(ecrit(0.5612)).toBe(attendu(0.56, 2))
  })

  test('sous 1, deux chiffres significatifs au moins', () => {
    expect(ecrit(0.0563)).toBe(attendu(0.056, 3))
  })

  test('les grands nombres et les entiers', () => {
    expect(ecrit(1194.2)).toBe(attendu(1190, 0))
    expect(ecrit(12)).toBe(attendu(12, 0))
  })
})
