import * as d3 from '../d3Modules'

// os#1516 — PALETTE HIÉRARCHIQUE d'une dimension : la couleur d'un membre suit l'arbre des membres.
//
// L'ancien bouton « palette » prenait les membres À PLAT et leur donnait `palette(i / n)` : sur une
// dimension hiérarchisée (os#1511), un enfant pouvait tomber à l'autre bout de la palette de son
// parent, et changer de niveau perdait le fil visuel. Six règles ont été comparées au banc
// (écart ΔE minimal au niveau le plus fin, Filière 4 niveaux / Pays 3 niveaux avec une fratrie de
// 12) : à plat 3,2 / 2,3 ; arbre de teintes pur 2,1 / 2,5 ; héritage + luminance 0,0 (deux cousins
// identiques) ; HYBRIDE 7,9 / 8,9. C'est l'hybride qui est retenu :
//
// - ARBRE DE TEINTES (HCL) : au premier embranchement, le cercle chromatique est partagé en
//   secteurs, chaque enfant prend un sous-secteur de son parent, un cran plus clair et moins
//   saturé. Les secteurs suivent le NOMBRE DE FEUILLES de la branche : une famille de douze pays
//   a besoin de plus de nuances qu'une famille de deux.
// - GRILLE teinte × luminance : quand la part de teinte par frère passe sous `narrow`, un partage
//   en teinte seule ne les sépare plus (c'est ce qui fait tomber l'arbre pur à ΔE 2). Les frères
//   sont alors rangés en 2 ou 3 rangs de luminance : douze frères font 4 teintes × 3 luminances.
// - RACINES UNIQUES NEUTRES : « Tous produits », « Monde » n'ont personne à qui s'opposer ; les
//   colorer gaspillerait tout le cercle sur un seul membre. Le partage commence au premier
//   embranchement réel.
// - COULEUR VERROUILLÉE : un membre verrouillé garde sa couleur, et son secteur est recentré sur sa
//   teinte — ses descendants s'en dérivent au lieu de garder la teinte calculée.
//
// Module PUR (aucune dépendance au modèle) : il travaille sur un arbre minimal, ce qui le rend
// testable seul et évite un cycle d'import avec les groupes de tags.

export type Type_PaletteNode = {
  id: string
  children: Type_PaletteNode[]
}

export type Type_HierarchicalPaletteParams = {
  /** Part du secteur de chaque membre effectivement utilisée (le reste sépare les familles). */
  sector_fill: number
  /** Teinte de départ du cercle, en degrés. */
  hue_start: number
  /** Luminance HCL du premier embranchement. */
  lightness: number
  /** Luminance gagnée à chaque niveau plus fin. */
  lightness_step: number
  /** Chroma HCL du premier embranchement. */
  chroma: number
  /** Chroma perdue à chaque niveau plus fin. */
  chroma_step: number
  /** Part de teinte par frère (degrés) sous laquelle on passe en grille teinte × luminance. */
  narrow: number
  /** Écart total de luminance entre le rang le plus foncé et le plus clair de la grille. */
  spread: number
}

export const default_hierarchical_palette_params: Type_HierarchicalPaletteParams = {
  sector_fill: 0.75,
  hue_start: 20,
  lightness: 52,
  lightness_step: 11,
  chroma: 62,
  chroma_step: 12,
  narrow: 25,
  spread: 30,
}

export const hierarchical_palette_neutral = '#8d929b'

const clampLightness = (l: number) => Math.max(18, Math.min(92, l))
const wrapHue = (h: number) => ((h % 360) + 360) % 360

/**
 * Couleurs des membres d'un arbre, par id.
 *
 * @param roots membres sans parent de la dimension
 * @param params réglages (cf. `default_hierarchical_palette_params`)
 * @param locks couleurs imposées à la main, par id : gardées telles quelles, et leurs
 *   descendants se dérivent de leur teinte
 */
export function computeHierarchicalColors(
  roots: Type_PaletteNode[],
  params: Type_HierarchicalPaletteParams = default_hierarchical_palette_params,
  locks: { [id: string]: string } = {}
): { [id: string]: string } {
  const colors: { [id: string]: string } = {}
  const leaf_count = new Map<string, number>()
  const countLeaves = (node: Type_PaletteNode): number => {
    const known = leaf_count.get(node.id)
    if (known !== undefined) return known
    const n = node.children.length === 0 ? 1 : node.children.reduce((s, c) => s + countLeaves(c), 0)
    leaf_count.set(node.id, n)
    return n
  }

  // Chaîne de racines uniques : neutres (sauf verrou), le partage commence au premier embranchement.
  let top: Type_PaletteNode[] = roots
  while (top.length === 1 && top[0].children.length > 0) {
    colors[top[0].id] = locks[top[0].id] ?? hierarchical_palette_neutral
    top = top[0].children
  }

  const split = (kids: Type_PaletteNode[], a: number, b: number, depth: number) => {
    const n = kids.length
    if (n === 0) return
    const total = kids.reduce((s, k) => s + countLeaves(k), 0)
    // Grille teinte × luminance si la part de teinte par frère est trop étroite
    const grid = n > 1 && (b - a) / n < params.narrow
    const rows = !grid ? 1 : (n <= 3 ? n : n <= 8 ? 2 : 3)
    const cols = Math.ceil(n / rows)
    let cursor = a
    kids.forEach((kid, i) => {
      let hue: number
      let half: number
      let dl = 0
      if (grid) {
        const col_width = (b - a) / cols
        hue = a + col_width * ((i % cols) + 0.5)
        half = col_width * params.sector_fill / 2
        dl = rows === 1 ? 0 : -params.spread / 2 + params.spread * Math.floor(i / cols) / (rows - 1)
      } else {
        const slot = (b - a) * countLeaves(kid) / total
        hue = cursor + slot / 2
        half = slot * params.sector_fill / 2
        cursor += slot
      }
      const lock = locks[kid.id]
      if (lock !== undefined) {
        colors[kid.id] = lock
        const locked_hue = d3.hcl(lock).h
        if (!isNaN(locked_hue)) hue = locked_hue
      } else {
        colors[kid.id] = d3.hcl(
          wrapHue(hue),
          Math.max(8, params.chroma - params.chroma_step * (depth - 1)),
          clampLightness(params.lightness + params.lightness_step * (depth - 1) + dl)
        ).formatHex()
      }
      split(kid.children, hue - half, hue + half, depth + 1)
    })
  }
  // Un seul membre sans enfant (dimension d'un membre) : rien à partager, il prend la teinte de départ.
  split(top, params.hue_start, params.hue_start + 360, 1)
  return colors
}
