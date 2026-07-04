import { clampLinkThickness, fluxFloor } from './flowThickness'

// Regression guard for issue #200 — l'épaisseur minimale plancher des flux était
// un `Math.max(2, px)` dur : régler `minimum_flux` SOUS 2px n'avait quasi aucun
// effet (un flux entre minimum_flux et 2 sautait quand même à 2px). Sur les nœuds
// à forte convergence, les flux fins bridés à 2px se chevauchaient.
//
// Correctif : le plancher EST `minimum_flux` quand il est défini — 0 compris
// (flux à épaisseur réelle) — et retombe sur 2px par défaut (clé absente).
// clampLinkThickness / fluxFloor isolent cette politique pure, hors du graphe
// d3/DOM de Class_LinkElement.

describe('AFMBase issue #200 — fluxFloor : plancher configurable, défaut 2px', () => {
  it('clé absente (null/undefined) → plancher dur de 2px', () => {
    expect(fluxFloor(undefined)).toBe(2)
    expect(fluxFloor(null)).toBe(2)
  })

  it('0 est une valeur valide → plancher 0 (épaisseur réelle)', () => {
    expect(fluxFloor(0)).toBe(0)
  })

  it('un plancher personnalisé (au-dessus comme en dessous de 2px) est respecté', () => {
    expect(fluxFloor(0.2)).toBe(0.2)
    expect(fluxFloor(5)).toBe(5)
  })
})

describe('AFMBase issue #200 — clampLinkThickness', () => {
  it('défaut (sans minimum_flux) : un flux fin est bridé à 2px (comportement historique)', () => {
    expect(clampLinkThickness(0.2, undefined, undefined)).toBe(2)
    expect(clampLinkThickness(0.2, null, undefined)).toBe(2)
  })

  it('un flux épais garde son épaisseur brute', () => {
    expect(clampLinkThickness(40, undefined, undefined)).toBe(40)
  })

  it('minimum_flux SOUS 2px abaisse réellement le plancher (le cœur de #200)', () => {
    // Avant le correctif, ce flux à 1px sautait à 2px (Math.max(2, …)).
    expect(clampLinkThickness(1, 0.5, undefined)).toBe(1)
    // Un flux sous le plancher personnalisé est ramené à ce plancher, pas à 2px.
    expect(clampLinkThickness(0.2, 0.5, undefined)).toBe(0.5)
  })

  it('plancher 0 → tout flux est tracé à son épaisseur réelle', () => {
    expect(clampLinkThickness(0.2, 0, undefined)).toBe(0.2)
    expect(clampLinkThickness(0, 0, undefined)).toBe(0)
  })

  it('minimum_flux AU-DESSUS de 2px relève le plancher (réglage existant préservé)', () => {
    expect(clampLinkThickness(1, 5, undefined)).toBe(5)
    expect(clampLinkThickness(8, 5, undefined)).toBe(8)
  })

  it('le plafond maximum_flux borne le haut', () => {
    expect(clampLinkThickness(40, undefined, 20)).toBe(20)
    expect(clampLinkThickness(10, undefined, 20)).toBe(10)
  })

  it('maximum_flux falsy (0/absent) = pas de plafond', () => {
    expect(clampLinkThickness(40, undefined, 0)).toBe(40)
    expect(clampLinkThickness(40, undefined, null)).toBe(40)
  })

  it('config aberrante (min > max) : le plafond gagne, comme l\'ancien _clampThickness', () => {
    expect(clampLinkThickness(10, 5, 3)).toBe(3)
  })
})
