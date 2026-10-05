import { pickTileColumns, sameTileFit, tileHeightFor, tileScaleFor, tileTextPxAt, Type_TileFit } from './TileFit'

/**
 * sa#601 — la grille des vignettes choisit ses colonnes d'après la taille des libellés.
 *
 * Valeurs du cas de l'issue : étoiles du Référentiel Coefficients SOCLE, libellés de 20 unités,
 * volet plein écran de ~1850 px, bandeau de titre à 0,65 rem = 10,4 px.
 */
const star = (content_width: number, content_height = content_width / 3, min_font_size: number | null = 20): Type_TileFit =>
  ({ content_width, content_height, margin_px: 20, min_font_size })

describe('sa#601 — TileFit', () => {
  test('l’échelle est celle de la largeur, bornée par la hauteur quand on la donne', () => {
    const fit = star(1000, 400)
    expect(tileScaleFor(fit, 520)).toBeCloseTo(0.5)
    expect(tileScaleFor(fit, 520, 120)).toBeCloseTo(0.25)
  })

  test('la case a la hauteur du dessin cadré dans sa largeur', () => {
    // k = (520 - 20) / 1000 = 0,5 → 400 × 0,5 + 20
    expect(tileHeightFor(star(1000, 400), 520)).toBeCloseTo(220)
  })

  test('on retire des colonnes jusqu’à ce que les libellés atteignent le bandeau de titre', () => {
    const fits = [star(1600), star(1700), star(1500)]
    const n = pickTileColumns({ inner_width: 1840, gap: 5, chrome: 4, count: 31, fits, min_text_px: 10.4 })
    // Texte du plus large (1700) : 20 × (w − 20) / 1700 ≥ 10,4 ⇔ w ≥ 904 → 2 colonnes.
    expect(n).toBe(2)
    const w = (1840 - (n - 1) * 5) / n - 4
    expect(20 * tileScaleFor(star(1700), w)).toBeGreaterThanOrEqual(10.4)
    const w_more = (1840 - n * 5) / (n + 1) - 4
    expect(20 * tileScaleFor(star(1700), w_more)).toBeLessThan(10.4)
  })

  test('au seuil par défaut de 9 px, les étoiles du Référentiel tiennent à 4 par ligne', () => {
    const params = { inner_width: 1840, gap: 4.8, chrome: 4, count: 31, fits: [star(626), star(847), star(880)], min_text_px: 9 }
    expect(pickTileColumns(params)).toBe(4)
    // Un cran de zoom de la grille : le seuil prend la taille des libellés à 3 colonnes.
    expect(pickTileColumns({ ...params, min_text_px: (tileTextPxAt(3, params) as number) * 0.999 })).toBe(3)
    expect(pickTileColumns({ ...params, min_text_px: (tileTextPxAt(5, params) as number) * 0.999 })).toBe(5)
    expect(tileTextPxAt(1, { ...params, fits: [star(500, 100, null)] })).toBeNull()
  })

  test('un libellé déjà assez grand garde toutes les vignettes sur la ligne', () => {
    expect(pickTileColumns({ inner_width: 1840, gap: 5, chrome: 4, count: 3, fits: [star(300)], min_text_px: 10.4 })).toBe(3)
  })

  test('bornée par la hauteur, la grille ne se vide pas pour rien', () => {
    // Case de 100 px de haut au plus : k ≤ (100 − 20) / 400 = 0,2 → 4 px quelle que soit la largeur.
    const n = pickTileColumns({
      inner_width: 1840, gap: 5, chrome: 4, count: 12, fits: [star(1000, 400)], min_text_px: 10.4, max_height: 100
    })
    expect(n).toBeGreaterThan(1)
    const w = (1840 - (n - 1) * 5) / n - 4
    expect(tileScaleFor(star(1000, 400), w, 100)).toBeCloseTo(0.2)
  })

  test('sans police à protéger, la règle d’avant : des colonnes d’au moins 240 px', () => {
    expect(pickTileColumns({ inner_width: 1840, gap: 5, chrome: 4, count: 31, fits: [star(1000, 400, null)], min_text_px: 10.4 })).toBe(7)
    expect(pickTileColumns({ inner_width: 1840, gap: 5, chrome: 4, count: 1, fits: [star(5000)], min_text_px: 10.4 })).toBe(1)
  })

  test('une mesure qui ne bouge que d’un arrondi ne relance pas la grille', () => {
    expect(sameTileFit(star(1000), { ...star(1000), content_width: 1000.3 })).toBe(true)
    expect(sameTileFit(star(1000), star(1100))).toBe(false)
    expect(sameTileFit(star(1000), star(1000, 333, null))).toBe(false)
    expect(sameTileFit(null, undefined)).toBe(true)
  })
})
