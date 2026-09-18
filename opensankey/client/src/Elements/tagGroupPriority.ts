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
 * Deux familles (nœuds, flux) ne se disputent aucun paramètre : un style de nœud ne s'applique
 * qu'aux nœuds. Dans la légende, elles gardent donc leur ordre historique : groupes de nœuds, puis
 * groupes de flux.
 *
 * Module FEUILLE, sans import, testable sans diagramme (même parti pris que `tagStyles.ts`).
 */

/**
 * Groupes de toutes les familles, du PLUS prioritaire au MOINS prioritaire, pour la légende.
 *
 * @param families groupes de chaque famille, chacune dans son ordre de priorité (du moins au plus
 *                 prioritaire), familles dans leur ordre d'affichage historique
 */
export function legendGroupsByPriority<G extends { id: string }>(
  families: readonly (readonly G[])[]
): G[] {
  return families.flatMap(family => [...family].reverse())
}

/**
 * SA#551 — groupes vus par la cascade pendant l'aperçu d'un groupe survolé dans la légende : ce seul
 * groupe, présenté comme ouvert (son interrupteur réel n'est pas touché). Hors aperçu, ou si le
 * groupe n'est pas de cette famille : les groupes tels quels.
 */
export function previewedTagGroups<G extends { id: string, use_colors?: boolean }>(
  groups: readonly G[],
  preview_group_id: string | undefined
): readonly G[] {
  if (preview_group_id === undefined) return groups
  const previewed = groups.find(group => group.id === preview_group_id)
  if (previewed === undefined) return groups
  return [Object.create(previewed, { use_colors: { value: true } }) as G]
}
