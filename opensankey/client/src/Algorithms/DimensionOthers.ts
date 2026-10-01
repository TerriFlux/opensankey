// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// os#1511 — « AUTRES », À LA VOLÉE, SUR LE DIAGRAMME.
//
// Julien, 30/09/2026 : « dans le mode dataTags + niveaux, il faut créer une catégorie "autre" à la
// volée pour les flux trop petits, et les agréger ; c'est déjà le cas pour la couronne, il faut
// faire la même chose sur le diagramme ». Un flux découpé par les 263 pays d'une dimension en
// montre 263 bandes, dont 240 font moins d'un pixel : illisible, et sans rien à survoler.
//
// Même règle que la couronne (`figureChartStyle` : `parts_group_under` 0,5 %, `parts_max` 20) :
// on classe les parts par valeur décroissante, et on replie dans « Autres » celles qui pèsent
// moins que le seuil OU qui dépassent le nombre maximal. Replier UNE seule part ne sert à rien —
// elle resterait seule sous un autre nom — : il en faut au moins deux.
//
// « Autres » est une construction du DESSIN, comme le secteur replié de la couronne : il ne
// désigne aucun membre, n'entre dans aucune sélection et ne se sérialise pas.
// ==================================================================================================

/** Identifiant de la part repliée ; aucun membre de dimension ne le porte. */
export const OTHERS_ID = '__autres__'

/** Même gris que la part « Autres » de la couronne (cf. Charts/NodeStatsCharts). */
export const OTHERS_COLOR = '#CFD0CB'

/** Seuil de repli, en pourcentage du total (même défaut que la couronne). */
export const OTHERS_MIN_SHARE_PCT = 0.5

/** Nombre maximal de parts montrées, « Autres » compris. */
export const OTHERS_MAX_PARTS = 20

/**
 * os#1511 — dimension en bandes : un membre replié AU TOTAL (sur tous les flux visibles) reste en
 * propre sur un flux où il pèse au moins ce pourcentage du flux (règle arrêtée avec Julien le
 * 01/10 : « une bande peut être grosse sur un flux et petite sur tous les autres »).
 */
export const OTHERS_EXCEPTION_SHARE_PCT = 5

export type Type_OthersOptions = { min_share_pct?: number, max_parts?: number }

/**
 * Sépare les parts gardées de celles qui se replient dans « Autres ». L'ordre des parts gardées
 * est celui d'ENTRÉE (l'ordre du diagramme), pas celui des valeurs : seul le choix se fait par
 * valeur. `folded` est vide quand il n'y aurait qu'une part à replier.
 */
export const foldSmallParts = <T extends { value: number }>(
  parts: readonly T[],
  opts: Type_OthersOptions = {}
): { kept: T[], folded: T[] } => {
  const min_share = Math.max(0, opts.min_share_pct ?? OTHERS_MIN_SHARE_PCT) / 100
  const max_parts = Math.max(0, Math.floor(opts.max_parts ?? OTHERS_MAX_PARTS))
  const total = parts.reduce((sum, part) => sum + Math.max(0, part.value), 0)
  if (total <= 0 || parts.length < 3) return { kept: [...parts], folded: [] }
  // Le rang de chaque part, par valeur décroissante (à valeur égale, l'ordre d'entrée).
  const ranked = parts
    .map((part, index) => ({ part, index }))
    .sort((a, b) => (b.part.value - a.part.value) || (a.index - b.index))
  // Au-delà du plafond, la dernière place revient à « Autres » : on garde max_parts - 1 parts.
  const cap = max_parts > 0 ? Math.max(1, max_parts - 1) : Infinity
  const folded_idx = new Set<number>()
  ranked.forEach(({ part, index }, rank) => {
    if (part.value / total < min_share || rank >= cap) folded_idx.add(index)
  })
  if (folded_idx.size < 2) return { kept: [...parts], folded: [] }
  return {
    kept: parts.filter((_, index) => !folded_idx.has(index)),
    folded: parts.filter((_, index) => folded_idx.has(index))
  }
}
