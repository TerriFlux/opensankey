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

// os#1425 — LE FORMAT D'UNE VALEUR DANS UNE FIGURE, lu sur les clés du catalogue.
//
// Exactement la règle des étiquettes de valeur d'un flux (`formatElementValue`, Elements) : la
// notation scientifique d'abord, puis les chiffres significatifs, puis les décimales imposées —
// dans cet ordre, parce qu'une notation scientifique ne se cumule pas avec un nombre de décimales.
// Écrite ici une fois pour toutes les figures : couronne, sunburst, barres lisent les mêmes
// clés (`value_label_*`) et doivent écrire le même nombre de la même façon.
//
// Module PUR : pas de modèle, pas de DOM.

import type { Type_OptionBag } from '../Representations/Figure'

export interface Type_FigureValueFormat {
  significant_digits: boolean
  nb_significant_digits: number
  custom_digit: boolean
  nb_digit: number
  scientific_notation: boolean
  /** L'unité, déjà résolue par l'appelant ; `''` quand il n'y en a pas ou qu'on ne la veut pas. */
  unit: string
}

/** Ce que le tracé faisait avant que ces clés existent : quatre chiffres significatifs. */
export const FIGURE_VALUE_FORMAT_DEFAULTS: Type_FigureValueFormat = {
  significant_digits: true,
  nb_significant_digits: 4,
  custom_digit: false,
  nb_digit: 0,
  scientific_notation: false,
  unit: ''
}

/** Le format, lu sur le sac de réglages d'une figure (clés `value_label_*` du catalogue). */
export const figureValueFormatOf = (
  options: Type_OptionBag,
  unit: string,
  fallback: Type_FigureValueFormat = FIGURE_VALUE_FORMAT_DEFAULTS
): Type_FigureValueFormat => {
  const bool = (key: string, d: boolean) => typeof options[key] === 'boolean' ? options[key] as boolean : d
  const num = (key: string, d: number) => typeof options[key] === 'number' ? options[key] as number : d
  return {
    significant_digits: bool('value_label_significant_digits', fallback.significant_digits),
    nb_significant_digits: num('value_label_nb_significant_digits', fallback.nb_significant_digits),
    custom_digit: bool('value_label_custom_digit', fallback.custom_digit),
    nb_digit: num('value_label_nb_digit', fallback.nb_digit),
    scientific_notation: bool('value_label_scientific_notation', fallback.scientific_notation),
    // os#1500 — L'UNITÉ DU DIAGRAMME S'ÉCRIT SANS QU'ON AIT À LA COCHER.
    //
    // Julien : « je trouve que s'il y a une unité au départ dans le diagramme principal, elle
    // devrait être là aussi dans la charte (barre ou couronne) ».
    //
    // La figure savait déjà la LIRE — `figureUnitOf`, sur un flux représentatif, exactement comme
    // les étiquettes du dessin — mais ne l'écrivait que sur demande. Une couronne posée sur un
    // diagramme en kt montrait donc des nombres nus à côté d'un dessin qui dit « kt » partout.
    //
    // ⚠️ CE N'EST PAS UN RENVERSEMENT RISQUÉ : quand le diagramme n'a pas d'unité, `unit` vaut ''
    // et rien ne change. C'est la même condition qu'avant, lue au bon endroit — et un auteur qui
    // avait décoché garde son réglage, la surcharge primant sur le défaut.
    unit: bool('value_label_unit_visible', true) ? unit : ''
  }
}

const clamp = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(n)))

/** La fonction qui écrit un nombre selon ce format, unité comprise. */
export const figureValueFormatter = (f: Type_FigureValueFormat): ((v: number) => string) => {
  const suffix = f.unit ? ' ' + f.unit : ''
  return (v: number) => {
    if (f.scientific_notation) {
      const text = f.significant_digits
        ? v.toExponential(clamp(f.nb_significant_digits - 1, 20))
        : v.toExponential()
      return text + suffix
    }
    let n = v
    if (f.significant_digits) n = parseFloat(n.toPrecision(clamp(f.nb_significant_digits, 21) || 1))
    if (f.custom_digit) n = parseFloat(n.toFixed(clamp(f.nb_digit, 20)))
    return new Intl.NumberFormat().format(n) + suffix
  }
}
