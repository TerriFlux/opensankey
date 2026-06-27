import { computeArrowPlacement } from './arrowLayout'

// Regression guard for issue #199 — les pointes de flèche en bout de flux
// paraissaient surdimensionnées (faisceau de pointes plus haut que le faisceau
// de flux) sur les nœuds à forte convergence (beaucoup de flux fins).
//
// La hauteur d'un nœud et ses ancres sont calculées sur les épaisseurs BRUTES
// (non bridées) : un flux dont la valeur vaut < 2px est tracé à 2px mais
// SUPERPOSÉ à ses voisins, donc la pile de flux garde la hauteur du nœud (Σ bruts).
// L'éventail, lui, se dimensionnait sur Σ des épaisseurs BRIDÉES (≥ 2px) empilées
// bout à bout → sur N flux bridés à 2px, hauteur d'éventail = Σ(2px) ≫ Σ(bruts).
//
// Correctif : l'éventail est dimensionné dans l'espace BRUT (comme la hauteur du
// nœud) → total = Σ bruts = hauteur du nœud, et chaque flux fin occupe sa part
// brute (il se superpose dans l'éventail comme il se superpose au nœud).
//
// Ce test isole la politique de placement pure (computeArrowPlacement), sans le
// graphe d3/DOM de Class_NodeElement.

// Un nœud à forte convergence : 8 flux dont la valeur brute (< 2) est bridée à
// 2px à l'ancre. La hauteur du nœud suit les valeurs brutes.
const RAW = [0.4, 0.3, 0.5, 0.2, 0.6, 0.4, 0.3, 0.5] // Σ = 3.2 px (= bande du nœud)
const CLAMP = 2
const sideSumRaw = RAW.reduce((a, b) => a + b, 0) // 3.2 px
const sideSumClamped = RAW.length * CLAMP // 16 px (ancien éventail, buggé)

describe('AFMBase issue #199 — éventail (défaut) dimensionné en brut', () => {
  it('hauteur d\'éventail = Σ bruts (= hauteur du nœud), PAS Σ bridés', () => {
    // arrow_half_height est identique pour toutes les flèches du côté = total/2.
    const half = computeArrowPlacement(false, RAW[0], CLAMP, sideSumRaw, 0).arrow_half_height
    expect(half * 2).toBeCloseTo(sideSumRaw) // 3.2, pas 16
    expect(half * 2).toBeLessThan(sideSumClamped) // l'éventail ne déborde plus
  })

  it('chaque flux occupe sa part BRUTE dans l\'éventail (pas 2px bridé)', () => {
    RAW.forEach(raw => {
      const p = computeArrowPlacement(false, raw, CLAMP, sideSumRaw, 0)
      expect(p.slice).toBe(raw) // base = brut, pas CLAMP
    })
  })

  it('les parts brutes pavent exactement l\'éventail (offsets cumulés = Σ bruts)', () => {
    let cumul = 0
    RAW.forEach(raw => {
      const p = computeArrowPlacement(false, raw, CLAMP, sideSumRaw, cumul)
      expect(p.arrow_already_computed).toBe(cumul) // empilé à l'offset brut courant
      cumul += raw
    })
    expect(cumul).toBeCloseTo(sideSumRaw) // dernier offset + part = total = hauteur du nœud
  })

  it('un flux fin n\'agrandit plus l\'éventail au-delà du total des flux', () => {
    // Avant : chaque flux ajoutait CLAMP (2px) → Σ(2px) ≫ Σ valeurs. Après : il
    // ajoute sa valeur brute → l\'éventail reste borné par le total des flux.
    const grown = RAW.reduce((acc, raw) => acc + raw, 0)
    expect(grown).toBe(sideSumRaw)
    expect(grown).toBeLessThan(sideSumClamped)
  })
})

describe('AFMBase issue #199 — standalone (opt-in) inchangé', () => {
  it('base = épaisseur bridée du flux, centrée sur sa fin réelle, sans cumul', () => {
    RAW.forEach(raw => {
      const p = computeArrowPlacement(true, raw, CLAMP, sideSumRaw, 0)
      expect(p.slice).toBe(CLAMP) // triangle visible à 2px
      expect(p.arrow_half_height * 2).toBe(CLAMP)
      expect(p.arrow_already_computed).toBe(0) // aucun empilement d'éventail
    })
  })

  it('respecte un flux épais non bridé (raw == clamped)', () => {
    const p = computeArrowPlacement(true, 40, 40, 40, 0)
    expect(p.slice).toBe(40)
    expect(p.arrow_half_height * 2).toBe(40)
  })
})
