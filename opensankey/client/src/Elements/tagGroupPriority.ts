// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

/**
 * SA#551 — ORDRE DE PRIORITÉ des groupes d'étiquettes, celui de la cascade des styles d'étiquette :
 * la liste des groupes de chaque famille (`Class_Sankey.tagGroupsInPriorityOrder`, qui est aussi
 * l'ordre du menu Étiquettes), du MOINS prioritaire au PLUS prioritaire — le groupe le plus BAS
 * gagne (SA#541).
 *
 * La légende ne le lit PLUS à l'envers (25/09/2026) : elle garde l'ordre du fichier, cf.
 * `legendTagGroupsOrder` (legendItems.ts). Il reste ici l'aperçu d'un groupe survolé.
 *
 * Module FEUILLE, sans import, testable sans diagramme (même parti pris que `tagStyles.ts`).
 */

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
