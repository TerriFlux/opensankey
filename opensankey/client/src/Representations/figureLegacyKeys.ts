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

// 03/10/2026 — LES CLÉS DE FIGURE QUI ONT CHANGÉ DE FORME, RELUES ICI ET NULLE PART AILLEURS.
//
// Un sac de réglages écrit par une version d'avant entre par `Class_Figure.loadOwn` (surcharge
// propre d'une figure) ou par `Class_FigureNature.fromJSON` (un style de figure). Les deux passent
// par cette fonction : le tracé, le panneau et la persistance ne voient ensuite que la clé neuve.
// Le panneau annonce donc ce que le fichier disait, et le fichier se réécrit sous la clé neuve.

import type { Type_OptionBag } from './Figure'
import { figureDrawsSunburst } from './couronneSunburstMode'

/**
 * `labels_callout_small` (booléen, 01/10/2026) → `labels_small` (quatre choix, 03/10/2026).
 * VRAI = « Détacher » (le défaut), FAUX = « Masquer ». Une clé neuve déjà posée l'emporte.
 */
const LEGACY_LABELS_CALLOUT_SMALL = 'labels_callout_small'

/**
 * os#1527 (11/10/2026) — `name_label_callout` AU NIVEAU D'UNE COURONNE → `labels_small: 'detach'`.
 *
 * Deux clés pour un sens : le catalogue la libelle « Étiquettes qui ne tiennent pas : dehors,
 * reliées d'un trait », c'est mot pour mot le choix « Détacher » de « Si l'étiquette ne tient pas ».
 * Le sunburst les lisait ainsi (`callout || labels_small === 'detach'`), la couronne à plat sortait
 * TOUTES ses étiquettes : la même case disait deux choses selon le mode. La couronne ne l'offre plus
 * (`DONUT_HONOURS`) ; VRAI se relit « Détacher » quand rien n'est posé, FAUX (le défaut) s'efface.
 *
 * SEULEMENT POUR UNE NATURE QUI DÉCLARE `labels_small` : les barres n'ont pas ce sélecteur, et leur
 * `name_label_callout` garde son sens (l'étiquette sort au-dessus de la barre).
 */
const LEGACY_FIGURE_CALLOUT = 'name_label_callout'

/**
 * os#1527 (11/10/2026) — LE TROU DU SUNBURST A SA CLÉ, `centre_hole_rings`.
 *
 * Le trou de la couronne (`centre_hole`, 55 %) s'appliquait aussi aux anneaux : trois niveaux s'y
 * partageaient 45 % du rayon. Une figure ENREGISTRÉE EN SUNBURST dont l'auteur avait réglé le trou
 * le garde pour ses anneaux (le trou de la couronne à plat reste ce qu'il a posé).
 */
const RINGS_HOLE = 'centre_hole_rings'

/**
 * Le sac, avec ses clés d'avant traduites. Rend le MÊME objet quand il n'y a rien à traduire.
 *
 * `declares` dit ce que la nature qui relit le sac déclare : une clé ne se traduit que vers une
 * clé neuve que cette nature porte. Absent, seules les traductions communes à toutes s'appliquent.
 */
export const upgradeLegacyFigureKeys = (
  bag: Type_OptionBag,
  declares?: (key: string) => boolean
): Type_OptionBag => {
  let out = bag
  const own = () => { if (out === bag) out = { ...bag } }
  if (LEGACY_LABELS_CALLOUT_SMALL in out) {
    own()
    const old = out[LEGACY_LABELS_CALLOUT_SMALL]
    delete out[LEGACY_LABELS_CALLOUT_SMALL]
    if (out['labels_small'] === undefined && typeof old === 'boolean') {
      out['labels_small'] = old ? 'detach' : 'hide'
    }
  }
  if (declares?.('labels_small') && LEGACY_FIGURE_CALLOUT in out) {
    own()
    const old = out[LEGACY_FIGURE_CALLOUT]
    delete out[LEGACY_FIGURE_CALLOUT]
    if (out['labels_small'] === undefined && old === true) out['labels_small'] = 'detach'
  }
  if (declares?.(RINGS_HOLE) && out[RINGS_HOLE] === undefined &&
    typeof out['centre_hole'] === 'number' && figureDrawsSunburst(out)) {
    own()
    out[RINGS_HOLE] = out['centre_hole']
  }
  return out
}
