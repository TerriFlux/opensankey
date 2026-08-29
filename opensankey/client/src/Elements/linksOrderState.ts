// sa#283 lot 6 — ORDRE DES FLUX autour d'un nœud : réordonnancement PUR et EXACTEMENT
// RÉVERSIBLE, à côté de `reorganizeIOOrder` (qui, lui, calcule un ordre à partir de la
// géométrie).
//
// POURQUOI UN MODULE À PART, alors que `Class_NodeElement.reorganizeIOFromListIds` existe
// déjà. Cette méthode trie par `l.indexOf(link.id)` : un flux ABSENT de la liste reçoit
// l'index −1 et remonte donc EN TÊTE, devant tous les flux cités. Pour une liste PARTIELLE
// — le cas d'une vue contextuelle, dont la liste vient d'un fichier d'époque qui ne
// connaissait pas tous les flux du réseau réconcilié — cela empile les flux inconnus avant
// les flux ordonnés, et l'ordre entre ces inconnus dépend de la stabilité du `sort`. Ce
// n'est ni ce qu'on veut ni réversible.
//
// LA RÈGLE RETENUE : les flux CITÉS d'abord, dans l'ordre de la liste ; les autres ENSUITE,
// dans leur ordre courant. Deux propriétés en découlent :
//  - `reorderLinksByIds(links, links.map(l => l.id))` est l'identité — donc réappliquer
//    l'ordre COMPLET mémorisé restaure exactement l'ordre d'origine (patch inverse) ;
//  - un id inconnu du nœud est IGNORÉ silencieusement, et un flux du nœud absent de la
//    liste garde une place DÉTERMINÉE (à la suite, ordre courant préservé) — jamais
//    intercalé entre les bandes ordonnées par le contexte.
//
// Module PUR : aucun import (ni d3, ni modèle) — testable seul.

/**
 * Réordonne `current` pour suivre `ordered_ids`.
 *
 * @param current      les flux du nœud, dans leur ordre courant.
 * @param ordered_ids  ordre visé, éventuellement PARTIEL. Les ids inconnus de `current`
 *                     sont ignorés ; un id répété n'est honoré qu'une fois.
 * @returns un tableau NEUF de même contenu que `current` (même longueur, mêmes éléments).
 */
export function reorderLinksByIds<T extends { id: string }>(
  current: readonly T[],
  ordered_ids: readonly string[]
): T[] {
  const by_id = new Map<string, T>()
  current.forEach(link => { if (!by_id.has(link.id)) by_id.set(link.id, link) })
  const taken = new Set<T>()
  const out: T[] = []
  ordered_ids.forEach(id => {
    const link = by_id.get(id)
    if (link === undefined || taken.has(link)) return // id inconnu du nœud, ou déjà placé
    taken.add(link)
    out.push(link)
  })
  // Les flux non cités conservent leur ordre COURANT, à la suite.
  current.forEach(link => { if (!taken.has(link)) out.push(link) })
  return out
}
