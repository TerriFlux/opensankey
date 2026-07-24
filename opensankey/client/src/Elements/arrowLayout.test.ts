import { computeArrowPlacement, applyFanMinWidth, arrowMinWidthApplies } from './arrowLayout'

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

// Issue #304 — sur un nœud alimenté par beaucoup de flux (63 imports du nœud « Blé »,
// SOCLE Céréales 2015), le côté gauche affichait DES DIZAINES de pointes distinctes au
// lieu de l'unique éventail convergent. Cause constatée sur le SVG réellement produit :
// la largeur mini de pointe (défaut 10 px) remplaçait la géométrie d'éventail par un
// TRIANGLE INDÉPENDANT dès qu'un flux passait sous 10 px — ce qui est le cas de 32 des
// 32 flux visibles. La largeur mini est donc désormais portée par l'ÉVENTAIL.
const MIN_WIDTH = 10

describe('issue #304 — largeur mini portée par l\'éventail, pas par flux', () => {
  it('un éventail déjà plus large que la largeur mini n\'est pas touché (cas « Blé »)', () => {
    // Σ bruts du côté = 14,2 px > 10 px : la pointe commune est déjà visible.
    const total = 14.2
    const p = computeArrowPlacement(false, 0.0003, 0.0003, total, 3.5)
    const f = applyFanMinWidth(p, MIN_WIDTH, total, 4, 32)
    expect(f).toEqual(p) // aucune pointe indépendante ne vient casser l'éventail
    // ... alors que la règle par flux, elle, s'appliquait bien à ce flux (d'où le bug).
    expect(arrowMinWidthApplies(MIN_WIDTH, 0.0003)).toBe(true)
  })

  it('un éventail plus fin que la largeur mini est mis à l\'échelle en BLOC', () => {
    const total = 2 // côté fin : la pointe commune serait quasi invisible
    const slices = [0.5, 1, 0.5]
    let cumul = 0
    const scaled = slices.map((raw, i) => {
      const f = applyFanMinWidth(
        computeArrowPlacement(false, raw, raw, total, cumul), MIN_WIDTH, total, i, slices.length
      )
      cumul += raw
      return f
    })
    // Une seule géométrie d'éventail pour tout le côté (hauteur = largeur mini)...
    scaled.forEach(f => expect(f.arrow_half_height * 2).toBeCloseTo(MIN_WIDTH))
    // ... les tranches gardent leurs proportions et pavent exactement la pointe.
    expect(scaled.map(f => f.slice)).toEqual([2.5, 5, 2.5])
    expect(scaled.map(f => f.arrow_already_computed)).toEqual([0, 2.5, 7.5])
    expect(scaled[2].arrow_already_computed + scaled[2].slice).toBeCloseTo(MIN_WIDTH)
  })

  it('un côté d\'épaisseur nulle (flux structurels) répartit la pointe à parts égales', () => {
    // Σ bruts = 0 → la mise à l'échelle proportionnelle serait un 0/0 : on répartit.
    const placements = [0, 1, 2, 3].map(i => applyFanMinWidth(
      computeArrowPlacement(false, 0, 2, 0, 0), MIN_WIDTH, 0, i, 4
    ))
    placements.forEach(f => expect(f.slice).toBe(MIN_WIDTH / 4))
    expect(placements.map(f => f.arrow_already_computed)).toEqual([0, 2.5, 5, 7.5])
    expect(placements.every(f => f.arrow_half_height * 2 === MIN_WIDTH)).toBe(true)
  })

  it('largeur mini désactivée (0) : éventail strictement proportionnel', () => {
    const p = computeArrowPlacement(false, 0.4, 2, 3.2, 0.7)
    expect(applyFanMinWidth(p, 0, 3.2, 1, 8)).toEqual(p)
  })

  it('la pointe indépendante par flux reste possible — en mode standalone (opt-in)', () => {
    // Le mode standalone (#681) dessine un triangle par flux : la largeur mini y garde
    // tout son sens, c'est le seul mode où elle s'applique flux par flux.
    expect(arrowMinWidthApplies(MIN_WIDTH, 0.4)).toBe(true)
    expect(arrowMinWidthApplies(MIN_WIDTH, 12)).toBe(false)
  })
})
