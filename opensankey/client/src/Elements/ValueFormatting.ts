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

// OS#305 — Formatage d'une valeur POUR LE LECTEUR, extrait des info-bulles.
//
// La règle de formatage (modèle d'unité, notation scientifique, chiffres
// significatifs, séparateur de milliers) était dupliquée entre TooltipsNode
// (`formatValue`) et TooltipsLink (`fmtNum`). Les blocs de présentation (#305)
// en auraient fait une TROISIÈME copie : on l'extrait ici, une fois.
//
// Le format se lit sur la config `value_label` d'un flux REPRÉSENTATIF : c'est
// lui qui porte l'unité et la précision d'affichage. Sans flux de référence
// (cas d'un total isolé), on retombe sur la chaîne brute séparée.

import { getNameLabelValues } from './ElementsAttributesConfig'
import type { Class_LinkElement } from './Link'
import type { Type_ResolvedUnit } from '../types/Units'
import { addThousandsSeparator } from './numberFormat'

export { addThousandsSeparator }

/**
 * Formate `n` avec les règles d'affichage du flux `sample_link`.
 */
export const formatElementValue = (n: number, sample_link?: Class_LinkElement): string => {
  if (!sample_link) return addThousandsSeparator(String(n))
  const lv = getNameLabelValues(sample_link, 'value_label')
  return formatDigits(n / resolveValueUnitFactor(sample_link), lv)
}

/**
 * Le DIVISEUR des valeurs de `sample_link` : ce que l'unité affichée vaut en unité du fichier
 * (59 320 kt écrits « 59,32 Mt » : 1 000). 1 quand il n'y en a pas.
 *
 * OS#1286 — en mode unit_model, le facteur vient du registre : coefficient de l'unité affichée
 * rapporté à celui de l'unité de référence de sa grandeur (os#1518). Sorti de
 * `formatElementValue` le 30/09/2026 pour que les FIGURES divisent comme le dessin : la couronne
 * écrivait « 59 320 Mt » à côté d'un flux étiqueté « 59.32 Mt » (os#1511).
 */
export const resolveValueUnitFactor = (sample_link?: Class_LinkElement): number => {
  if (!sample_link) return 1
  const lv = getNameLabelValues(sample_link, 'value_label')
  const model = lv.unit_type === 'unit_model' ? sample_link.sankey.units.resolve(lv.unit) : undefined
  if (model) return model.unit_type.displayFactor(model.unit)
  return (lv.unit_factor && lv.unit_factor > 1) ? lv.unit_factor : 1
}

/**
 * sa#623 — L'UNITÉ DU REGISTRE que `sample_link` affiche, avec sa GRANDEUR : ce qu'il faut à une
 * figure pour écrire ses valeurs dans une autre unité de la même grandeur (le tableau croisé en Mt
 * quand le diagramme écrit kt). `undefined` hors du registre (texte libre, aucune unité).
 */
export const resolveValueUnitModel = (sample_link?: Class_LinkElement): Type_ResolvedUnit | undefined => {
  if (!sample_link) return undefined
  const lv = getNameLabelValues(sample_link, 'value_label')
  return lv.unit_type === 'unit_model' ? sample_link.sankey.units.resolve(lv.unit) : undefined
}

/**
 * Précision d'affichage seule (notation scientifique, chiffres significatifs, décimales,
 * séparateur de milliers), SANS conversion d'unité : pour une valeur déjà exprimée dans
 * son unité propre (bande d'un groupe de type unité).
 */
export const formatDigits = (v: number, lv: ReturnType<typeof getNameLabelValues>): string => {
  let text: string
  if (lv.scientific_notation) {
    text = lv.significant_digits
      ? v.toExponential((lv.nb_significant_digits ?? 1) - 1)
      : v.toExponential()
  } else if (lv.significant_digits) {
    text = String(parseFloat(v.toPrecision(lv.nb_significant_digits ?? 3)))
    if (lv.custom_digit) text = String(parseFloat(parseFloat(text).toFixed(lv.nb_digit ?? 0)))
  } else if (lv.custom_digit) {
    text = String(parseFloat(v.toFixed(lv.nb_digit ?? 0)))
  } else {
    text = String(v)
  }
  return addThousandsSeparator(text)
}

/**
 * Symbole d'unité à afficher pour les valeurs de `sample_link` ('' si l'unité
 * est masquée ou absente).
 */
export const resolveValueUnit = (sample_link?: Class_LinkElement): string => {
  if (!sample_link) return ''
  const lv = getNameLabelValues(sample_link, 'value_label')
  if (!lv.unit_visible) return ''
  // OS#1286 — en mode unit_model, `unit` porte un id : on résout le symbole.
  return lv.unit_type === 'unit_model'
    ? (sample_link.sankey.units.resolve(lv.unit)?.unit.label ?? '')
    : (lv.unit ?? '').toString().trim()
}
