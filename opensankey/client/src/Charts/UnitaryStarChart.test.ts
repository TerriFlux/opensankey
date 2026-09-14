import { fitRowMinima, layoutStarRows, unitaryStarScale } from './UnitaryStarChart'
import type { Type_UnitaryStarBranch } from './unitaryStarTypes'

/**
 * os#1390 — L ECHELLE DE L ETOILE : une EPAISSEUR, pas un remplissage.
 *
 * Le moteur remplissait la case : il rendait la plus grande echelle qui tienne. Sur
 * l etoile la plus courante — un procede, une entree, une sortie — les deux rubans
 * prenaient donc toute la hauteur, quelle que soit la valeur, et la figure ne disait
 * plus rien de ce qu elle mesurait. Ces tests figent la regle inverse : la plus grande
 * des deux piles vise une FRACTION de la case, et la dichotomie ne sert qu a redescendre
 * quand planchers et ecarts saturent deja la hauteur.
 *
 * La fraction visee doit rester d accord avec UNITARY_CENTRAL_HEIGHT_FRACTION
 * (types/DrawingArea) : c est la meme figure, vue par deux moteurs de rendu.
 */

const TARGET = 0.3
const H = 500
// Le plancher et l ecart reels du module, passes explicitement par l appelant.
const NO_MINIMA = { floor: 0, gap: 0 }

const branch = (id: string, value: number): Type_UnitaryStarBranch =>
  ({ id, label: id, value, text: String(value), color: '#888' })

/** Hauteur occupee par une pile a une echelle donnee, planchers et ecarts compris. */
const stackHeight = (values: number[], k: number, floor = 0, gap = 0) =>
  values.reduce((acc, v) => acc + Math.max(v * k, floor), 0) +
  Math.max(0, values.length - 1) * gap

describe('unitaryStarScale', () => {

  it('ne remplit PAS la case quand une entree fait face a une sortie', () => {
    // Le cas de tous les jours, et celui qui avait motive le correctif : un flux entre,
    // le meme ressort. Avant, chaque ruban faisait la hauteur entiere de la case.
    const k = unitaryStarScale([100], [100], H, NO_MINIMA.gap, NO_MINIMA.floor)
    expect(stackHeight([100], k)).toBeCloseTo(H * TARGET)
    // Et il reste donc largement de quoi respirer autour.
    expect(stackHeight([100], k)).toBeLessThan(H / 2)
  })

  it('garde l epaisseur proportionnelle a la valeur', () => {
    // Deux etoiles de meme forme mais de valeurs differentes se dessinent a l identique :
    // l echelle s adapte a la donnee, c est la figure qui est stable.
    const petit = unitaryStarScale([1], [1], H, 0, 0)
    const grand = unitaryStarScale([1000], [1000], H, 0, 0)
    expect(stackHeight([1], petit)).toBeCloseTo(stackHeight([1000], grand))
    // Au sein d une meme etoile, en revanche, un flux deux fois plus gros est deux fois
    // plus epais — c est tout le propos du dessin.
    const k = unitaryStarScale([60, 30], [90], H, 0, 0)
    expect(60 * k).toBeCloseTo(2 * (30 * k))
  })

  it('prend la plus contraignante des deux piles, jamais une echelle par cote', () => {
    // Trois entrees de 30 contre une sortie de 90 : les deux cotes totalisent 90, donc une
    // entree de 30 et la sortie de 90 gardent un rapport de 1 a 3. Deux echelles
    // independantes auraient donne deux piles egales, en mentant sur les valeurs.
    const k = unitaryStarScale([30, 30, 30], [90], H, 0, 0)
    expect(stackHeight([30, 30, 30], k)).toBeCloseTo(stackHeight([90], k))
    expect(90 * k).toBeCloseTo(3 * (30 * k))
  })

  it('montre le desequilibre d un bilan par des piles inegales', () => {
    // Un nœud qui puise dans un stock sort plus qu il ne recoit : les piles DOIVENT
    // differer, c est l information.
    const k = unitaryStarScale([40], [100], H, 0, 0)
    expect(stackHeight([100], k)).toBeCloseTo(H * TARGET)
    expect(stackHeight([40], k)).toBeCloseTo(H * TARGET * 0.4)
  })

  it('redescend sous la cible quand les planchers saturent la case', () => {
    // Cent branches minuscules : planchers et ecarts remplissent la hauteur a eux seuls.
    // La dichotomie doit alors chercher EN DESSOUS de la cible, et surtout ne jamais
    // deborder — une etoile tronquee perdrait des flux.
    const many = Array.from({ length: 100 }, () => 1)
    const { floor, gap } = fitRowMinima(many.length, H)
    const k = unitaryStarScale(many, [100], H, gap, floor)
    expect(stackHeight(many, k, floor, gap)).toBeLessThanOrEqual(H + 1e-6)
    expect(k).toBeGreaterThan(0)
  })

  it('rend zero plutot que NaN sur une etoile sans valeur ou sans place', () => {
    expect(unitaryStarScale([], [], H, 0, 0)).toBe(0)
    expect(unitaryStarScale([0], [0], H, 0, 0)).toBe(0)
    expect(unitaryStarScale([100], [100], 0, 0, 0)).toBe(0)
  })
})

describe('layoutStarRows', () => {

  it('centre la pile dans la case, laissant du blanc en haut et en bas', () => {
    // Consequence directe de l echelle visee : la pile ne touche plus les bords.
    const branches = [branch('a', 100)]
    const k = unitaryStarScale([100], [100], H, 0, 0)
    const rows = layoutStarRows(branches, k, 0, 0, H, 0, H)
    expect(rows[0].outer_y).toBeGreaterThan(0)
    expect(rows[0].outer_y + rows[0].thickness).toBeLessThan(H)
    // Et le blanc est reparti symetriquement.
    expect(rows[0].outer_y).toBeCloseTo(H - (rows[0].outer_y + rows[0].thickness))
  })
})
