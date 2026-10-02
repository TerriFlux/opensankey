// ==================================================================================================
// os#1511 — LA LÉGENDE D'UNE HIÉRARCHIE, partie PURE et partagée.
//
// Julien (02/10/2026), devant la légende d'une couronne qui listait des chemins à plat
// (« Produits bruts - Céréales › Blé ») : « pour la légende il faut faire comme pour les
// diagrammes : un décalage qui suit le niveau hiérarchique ».
//
// La règle est celle de la légende du diagramme (legendItems.ts, dimension à niveaux) : les membres
// désagrégés prennent ENSEMBLE la place de leur parent, dans l'ordre de l'arbre, en retrait d'un cran
// par niveau. Elle vit ici pour servir aux deux légendes — le diagramme (zones générées) et les
// figures (couronne seule, légende commune des petits multiples) — sans que l'une recopie l'autre.
//
// Module feuille : aucune dépendance, testable sans DOM.
// ==================================================================================================

/**
 * Le pas du retrait, en hauteurs de police (em) par niveau. La légende du diagramme le compte en px
 * monde (`legendIndentWidth` = indent × police), celle des figures en `em` CSS : le même pas.
 */
export const LEGEND_INDENT_EM = 1

/**
 * Retraits relatifs : la profondeur de chacun moins celle du moins profond. `undefined` si personne
 * n'a de profondeur (liste plate) — la légende reste celle d'avant.
 */
export function relativeIndents<T>(entries: readonly T[], depthOf: (entry: T) => number): Map<T, number> | undefined {
  const depths = new Map(entries.map(entry => [entry, depthOf(entry)] as [T, number]))
  if (![...depths.values()].some(depth => depth > 0)) return undefined
  const min_depth = Math.min(...depths.values())
  depths.forEach((depth, entry) => depths.set(entry, depth - min_depth))
  return depths
}

/**
 * Range `entries` (en place) dans l'ordre de l'arbre : chacun est repéré par la suite des rangs de
 * ses ancêtres puis de lui-même. Les enfants d'un même parent se suivent donc, à l'endroit où ce
 * parent se trouvait. Tri stable : à suite égale, l'ordre reçu reste.
 */
export function sortByTreeRanks<T>(entries: T[], rankPathOf: (entry: T) => number[]): void {
  const paths = new Map(entries.map(entry => [entry, rankPathOf(entry)] as [T, number[]]))
  entries.sort((a, b) => {
    const pa = paths.get(a) ?? []
    const pb = paths.get(b) ?? []
    for (let i = 0; i < Math.min(pa.length, pb.length); i++) {
      if (pa[i] !== pb[i]) return pa[i] - pb[i]
    }
    return pa.length - pb.length
  })
}

/** Un ancêtre DESSINÉ d'une entrée : son identifiant et son nom (déjà résolu dans la langue). */
export type Type_LegendTreeAncestor = { id: string, label: string }

/**
 * Une ligne de légende hiérarchique : un EN-TÊTE (ancêtre ouvert, sans pastille) ou une ENTRÉE (une
 * part dessinée). `indent` en niveaux, à multiplier par `LEGEND_INDENT_EM`.
 */
export type Type_LegendTreeRow<T> =
  | { kind: 'heading', key: string, label: string, indent: number }
  | { kind: 'entry', entry: T, indent: number }

/**
 * Les lignes d'une légende hiérarchique, dans l'ordre de l'arbre.
 *
 * `ancestorsOf` donne les ancêtres DESSINÉS d'une entrée, du plus haut au plus proche, sujet exclu
 * (vide ou absent : entrée de premier niveau). Chaque ancêtre ouvert s'écrit une fois, en en-tête,
 * à la place de sa première entrée ; ses entrées le suivent, un cran plus loin. Deux chemins qui
 * passent par le même nœud (treillis) sont deux en-têtes : c'est la route qui identifie l'ancêtre.
 *
 * `isTrailing` : les entrées qui restent en DERNIER, sans retrait — « Autres ».
 */
export function legendTreeRows<T>(
  entries: readonly T[],
  ancestorsOf: (entry: T) => readonly Type_LegendTreeAncestor[] | undefined,
  isTrailing: (entry: T) => boolean = () => false
): Type_LegendTreeRow<T>[] {
  const keysOf = (entry: T): string[] => {
    const keys: string[] = []
    ;(ancestorsOf(entry) ?? []).forEach((a, i) => keys.push((i === 0 ? '' : keys[i - 1] + '\u0000') + a.id))
    return keys
  }
  // Un rang par nœud de l'arbre (ancêtre ou entrée), dans l'ordre de première apparition.
  const rank = new Map<unknown, number>()
  const rankOf = (k: unknown) => {
    if (!rank.has(k)) rank.set(k, rank.size)
    return rank.get(k) as number
  }
  const body = entries.filter(entry => !isTrailing(entry))
  const trailing = entries.filter(entry => isTrailing(entry))
  const rank_paths = new Map(body.map(entry => [entry, [...keysOf(entry).map(rankOf), rankOf(entry)]] as [T, number[]]))
  const sorted = [...body]
  sortByTreeRanks(sorted, entry => rank_paths.get(entry) ?? [])
  const rows: Type_LegendTreeRow<T>[] = []
  let open: string[] = []
  sorted.forEach(entry => {
    const ancestors = ancestorsOf(entry) ?? []
    const keys = keysOf(entry)
    let common = 0
    while (common < Math.min(open.length, keys.length) && open[common] === keys[common]) common++
    for (let level = common; level < keys.length; level++) {
      rows.push({ kind: 'heading', key: keys[level], label: ancestors[level].label, indent: level })
    }
    open = keys
    rows.push({ kind: 'entry', entry, indent: keys.length })
  })
  trailing.forEach(entry => rows.push({ kind: 'entry', entry, indent: 0 }))
  return rows
}
