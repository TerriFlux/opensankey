// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

/**
 * SA#551 — ORDRE DE PRIORITÉ des groupes d'étiquettes, servi à la fois à la cascade des styles
 * d'étiquette et à la légende. Il n'en existe qu'un : la liste des groupes de chaque famille
 * (`Class_Sankey.tagGroupsInPriorityOrder`, qui est aussi l'ordre du menu Étiquettes), du MOINS
 * prioritaire au PLUS prioritaire — le groupe le plus BAS gagne (SA#541). La légende le lit à
 * l'envers : le plus prioritaire en tête. Les deux sens ne peuvent donc pas diverger.
 *
 * Ouvrir un groupe depuis la légende le place tout en bas de sa liste (`withTopPriority`).
 *
 * Deux familles (nœuds, flux) ne se disputent aucun paramètre : un style de nœud ne s'applique
 * qu'aux nœuds. Leur entrelacement dans la légende n'est donc qu'une présentation, réglée par le
 * RANG D'OUVERTURE (le dernier ouvert en tête) ; à rang égal — tout diagramme chargé — les
 * familles gardent leur ordre historique (nœuds puis flux).
 *
 * Module FEUILLE, sans import, testable sans diagramme (même parti pris que `tagStyles.ts`).
 */

/** Liste de groupes dans laquelle `id` passe en dernière position, la plus prioritaire. */
export function withTopPriority(order: readonly string[], id: string): string[] {
  return [...order.filter(other => other !== id), id]
}

/**
 * Groupes de toutes les familles, du PLUS prioritaire au MOINS prioritaire, pour la légende.
 *
 * @param families    groupes de chaque famille, chacune dans son ordre de priorité (du moins au
 *                    plus prioritaire), familles dans leur ordre d'affichage historique
 * @param opened_rank rang d'ouverture d'un groupe (plus grand = ouvert plus récemment, 0 = jamais)
 *
 * Fusion : dans une famille, l'ordre de priorité est respecté à la lettre ; entre familles, la tête
 * au plus grand rang d'ouverture passe d'abord, la première famille à rang égal.
 */
export function legendGroupsByPriority<G extends { id: string }>(
  families: readonly (readonly G[])[],
  opened_rank: (id: string) => number
): G[] {
  const queues = families.map(family => [...family].reverse())
  const merged: G[] = []
  for (;;) {
    let best = -1
    queues.forEach((queue, i) => {
      if (queue.length === 0) return
      if (best < 0 || opened_rank(queue[0].id) > opened_rank(queues[best][0].id)) best = i
    })
    if (best < 0) return merged
    merged.push(queues[best].shift() as G)
  }
}
