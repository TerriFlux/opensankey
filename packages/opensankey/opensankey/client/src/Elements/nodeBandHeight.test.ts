import { clampBandThickness } from './nodeBandHeight'

// Regression guard for issue #201 — en mode structure/intervalle, un nœud
// s'affichait plus haut (ou plus large) que sa bande de flux : la hauteur était
// la SOMME des épaisseurs BRIDÉES (≥ minimum_flux) lien par lien, alors que le
// reste de la géométrie (ancres, éventail des flèches #199) vit dans l'espace
// BRUT. Sur N flux fins (sous-pixel), chaque lien comptait pour minimum_flux →
// nœud = N × minimum_flux, alors que les flux se SUPERPOSENT en une seule bande
// de ~minimum_flux.
//
// Correctif : dimensionner sur Σ des bruts par côté (les flux fins se superposent)
// puis appliquer le plancher de flux UNE fois sur la bande — pas par lien.
// clampBandThickness isole cette politique pure, sans le graphe d3/DOM de
// Class_NodeElement.
//
// La « taille limite des nœuds et flux » (minimum_flux) s'applique désormais au
// nœud comme aux flux, dans TOUS les modes d'affichage (getSideBandExtent appelle
// clampBandThickness sans condition) : un nœud n'est jamais plus fin que ses flux
// (couvre aussi #200 — nœud trop fin en affichage valeurs).

// Cas Pruneaux (F&L 2015, user_scale 3000) : 4 sorties sous-pixel, Σ brut ~1.33px.
const PRUNEAUX_SORTIES_RAW = 1.33 // Σ des 4 sorties brutes
const PRUNEAUX_NB_SORTIES = 4
const MIN = 2

describe('AFMBase issue #201 — bande bridée GLOBALE, pas Σ planchers', () => {
  it('une bande sous-pixel est bridée à minimum_flux (≈ 2px), PAS N × 2px', () => {
    const ancien_bugge = PRUNEAUX_NB_SORTIES * MIN // 8px (somme des planchers lien par lien)
    const corrige = clampBandThickness(PRUNEAUX_SORTIES_RAW, true, MIN)
    expect(corrige).toBe(MIN) // ~2px = hauteur de la bande visible
    expect(corrige).toBeLessThan(ancien_bugge) // le nœud ne domine plus ses flux
  })

  it('une bande plus épaisse que le plancher garde sa hauteur brute', () => {
    expect(clampBandThickness(40, true, MIN)).toBe(40)
  })

  it('respecte un minimum_flux personnalisé', () => {
    expect(clampBandThickness(1.33, true, 5)).toBe(5)
    expect(clampBandThickness(8, true, 5)).toBe(8)
  })

  it('plancher dur à 2px quand minimum_flux est absent', () => {
    expect(clampBandThickness(1.33, true, undefined)).toBe(2)
    expect(clampBandThickness(1.33, true, null)).toBe(2)
    expect(clampBandThickness(0, true, undefined)).toBe(2) // bande de flux structurels (brut 0) → bande visible 2px
  })

  it('un côté sans flux reste à 0 (shape_min_height prend le relais)', () => {
    // Préserve le comportement pré-#201 : un côté sans lien ne doit pas être
    // bridé à minimum_flux, sinon un nœud sans lien ferait max(2,2,min_height).
    expect(clampBandThickness(0, false, MIN)).toBe(0)
    expect(clampBandThickness(0, false, undefined)).toBe(0)
  })

  it('des flux structurels (brut 0) mais présents → bande visible bridée', () => {
    // force_min : les liens structurels contribuent 0 brut (ils se superposent
    // à l\'ancre) mais sont TRACÉS à minimum_flux → la bande visible vaut ~2px.
    expect(clampBandThickness(0, true, MIN)).toBe(MIN)
  })

  // #200 — le plancher de bande suit le même fluxFloor que les liens : avec
  // minimum_flux = 0 (flux à épaisseur réelle), la bande épouse la somme brute,
  // donc le nœud n'est jamais plus haut que ses flux fins.
  it('plancher 0 → la bande épouse la somme brute (nœud à épaisseur réelle)', () => {
    expect(clampBandThickness(1.33, true, 0)).toBe(1.33)
    expect(clampBandThickness(0, true, 0)).toBe(0)
    expect(clampBandThickness(40, true, 0)).toBe(40)
  })
})
