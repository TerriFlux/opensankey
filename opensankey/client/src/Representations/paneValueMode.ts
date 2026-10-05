// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// sa#598 — LE TYPE DE VALEUR QU'UN VOLET MONTRE : pourcentage, valeur normalisée ou valeur absolue,
// choisi depuis l'en-tête du volet, lecteur d'une page publiée compris.
//
// MODULE FEUILLE : aucun import, comme `representationIds` — `format_value` (Utils) le lit à chaque
// libellé de flux, et l'en-tête des volets à chaque rendu.
//
// LE CHOIX EST CELUI DU VOLET (`Type_MainZoneOccupant.value_mode`), et non de ses vignettes. Une
// étoile Unit. réglait son mode vignette par vignette : une vignette NÉE après le choix (le lecteur
// change de filière) serait repartie en pourcentages. Le volet le donne donc, au dessin, à chaque
// figure qui DÉCLARE `value_mode` (cf. `withPaneValueMode`, éditeur) ; le réglage PROPRE d'une
// vignette, posé depuis le menu de configuration après le choix, garde la main — et le bouton de
// l'en-tête le retire, le dernier geste l'emportant.
//
// UN VOLET SANKEY le lit au formatage des libellés de valeur des flux (`sankeyPaneValueLabelOverrides`,
// appelé par `format_value`) : le canevas n'a pas de réglage de figure (cf.
// `registerBaseRepresentations`), et ce que le volet montre ne doit pas changer le diagramme qu'on
// édite.

export type Type_PaneValueMode = 'percent' | 'normalized' | 'value'

/** Les trois modes, dans l'ordre des boutons de l'en-tête. */
export const PANE_VALUE_MODES: readonly Type_PaneValueMode[] = ['percent', 'normalized', 'value']

/** La clé du réglage, sur une figure comme sur un volet. */
export const PANE_VALUE_MODE_KEY = 'value_mode'

export const isPaneValueMode = (v: unknown): v is Type_PaneValueMode =>
  typeof v === 'string' && (PANE_VALUE_MODES as readonly string[]).includes(v)

/**
 * CE QUE DEVIENT LE LIBELLÉ DE VALEUR D'UN FLUX dans un volet Sankey qui montre `mode`.
 *
 *  - `percent` : la part du flux dans les SORTIES DE SA SOURCE (`%OS`), c'est-à-dire le coefficient
 *    de répartition du process qu'il quitte — la lecture d'un Sankey de gauche à droite ; arrondie à
 *    l'entier, comme sur une étoile Unit. ;
 *  - `normalized` : rapportée à la somme que retient la règle de sa SOURCE (sa#595 :
 *    `normalized_source`), à trois chiffres significatifs — l'arrondi d'une valeur en kilotonnes
 *    écraserait un rapport ;
 *  - `value` : le libellé tel que l'auteur l'a réglé, sauf s'il l'a réglé en pourcentage ou en
 *    valeur normalisée — on montre alors la valeur dans son unité.
 *
 * `undefined` : rien à surcharger. `unit_type` est le type d'unité que l'auteur a réglé.
 */
export const sankeyPaneValueLabelOverrides = (
  mode: Type_PaneValueMode | null | undefined, unit_type: string
): { [key: string]: unknown } | undefined => {
  if (mode === 'percent') {
    return {
      unit_type: '%OS', unit_visible: true, custom_digit: true, nb_digit: 0,
      significant_digits: false, scientific_notation: false
    }
  }
  if (mode === 'normalized') {
    return {
      unit_type: 'normalized_source', custom_digit: false,
      significant_digits: true, nb_significant_digits: 3, scientific_notation: false
    }
  }
  if (mode === 'value' && (unit_type.startsWith('%') || unit_type.startsWith('normalized'))) {
    return { unit_type: 'unit_tag', unit_visible: true, custom_digit: false }
  }
  return undefined
}
