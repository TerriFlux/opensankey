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
import { addThousandsSeparator } from './numberFormat'

export { addThousandsSeparator }

/**
 * Formate `n` avec les règles d'affichage du flux `sample_link`.
 */
export const formatElementValue = (n: number, sample_link?: Class_LinkElement): string => {
  if (!sample_link) return addThousandsSeparator(String(n))
  const lv = getNameLabelValues(sample_link, 'value_label')
  let v = n
  // OS#1286 — en mode unit_model, le facteur est le coefficient de l'unité du registre.
  const model = lv.unit_type === 'unit_model' ? sample_link.sankey.units.resolve(lv.unit) : undefined
  if (model) {
    if (model.unit.coefficient !== 0) v = v / model.unit.coefficient
  } else if (lv.unit_factor && lv.unit_factor > 1) {
    v = v / lv.unit_factor
  }
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
    ? (sample_link.sankey.units.resolve(lv.unit)?.unit.name ?? '')
    : (lv.unit ?? '').toString().trim()
}
