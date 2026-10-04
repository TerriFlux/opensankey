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
  /**
   * 30/09/2026 — LE DIVISEUR de l'unité affichée (kt → Mt : 1 000), lu avec le symbole sur le même
   * flux que le dessin. Il DIVISE le nombre écrit, jamais la géométrie (os#1463 : c'est au graphe
   * d'en répondre, pour toutes ses parts). Absent : 1.
   */
  factor?: number
}

/**
 * Le défaut : UNE DÉCIMALE (04/10/2026). Trois chiffres significatifs du 03/10, quatre avant.
 *
 * Jean-Yves, relayé par Julien : « mets un seul chiffre après la virgule ». Les chiffres
 * significatifs donnaient 39,3 / 4,13 / 1,19 / 0,20 dans une même couronne — des nombres de
 * décimales différents d'un secteur à l'autre ; une décimale fixe écrit 39,3 / 4,1 / 1,2 / 0,2.
 * Une valeur non nulle qui s'arrondirait à 0,0 garde assez de décimales pour ne pas mentir
 * (cf. `figureNumberText`). Les chiffres significatifs restent cochables ; posés par l'auteur,
 * ils reprennent la main (cf. `figureValueFormatOf`).
 */
export const FIGURE_VALUE_FORMAT_DEFAULTS: Type_FigureValueFormat = {
  significant_digits: false,
  nb_significant_digits: 3,
  custom_digit: true,
  nb_digit: 1,
  scientific_notation: false,
  unit: ''
}

/** Le format, lu sur le sac de réglages d'une figure (clés `value_label_*` du catalogue). */
export const figureValueFormatOf = (
  options: Type_OptionBag,
  unit: string,
  fallback: Type_FigureValueFormat = FIGURE_VALUE_FORMAT_DEFAULTS,
  factor = 1
): Type_FigureValueFormat => {
  const bool = (key: string, d: boolean) => typeof options[key] === 'boolean' ? options[key] as boolean : d
  const num = (key: string, d: number) => typeof options[key] === 'number' ? options[key] as number : d
  return {
    significant_digits: bool('value_label_significant_digits', fallback.significant_digits),
    nb_significant_digits: num('value_label_nb_significant_digits', fallback.nb_significant_digits),
    // 04/10/2026 — DES CHIFFRES SIGNIFICATIFS COCHÉS PAR L'AUTEUR, SANS DÉCIMALES DITES : ils
    // décident seuls, comme avant que la décimale unique devienne le défaut. Sans cette règle, une
    // figure enregistrée en « 3 chiffres significatifs » serait bornée à une décimale en silence.
    custom_digit: bool('value_label_custom_digit',
      options['value_label_significant_digits'] === true ? false : fallback.custom_digit),
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
    unit: bool('value_label_unit_visible', true) ? unit : '',
    factor
  }
}

const clamp = (n: number, max: number) => Math.max(0, Math.min(max, Math.round(n)))

/**
 * 03/10/2026 — LE NOMBRE ÉCRIT, sans l'unité : la règle de TOUTES les figures (couronne, barres,
 * sunburst), centre, secteurs, étiquettes sorties, info-bulle et légende.
 *
 * Julien, capture du SOCLE à l'appui : dans une même couronne « 1,194 Mt » côtoyait « 0,2 Mt »,
 * « 35,2 Mt », « 4,134 Mt ». Deux causes : quatre chiffres significatifs par défaut, et `parseFloat`
 * qui mangeait les zéros de fin (0,20 → 0,2). D'où, en chiffres significatifs :
 *
 * - le nombre de DÉCIMALES se déduit de la grandeur — `nb` moins les chiffres de la partie entière —
 *   et les zéros de fin restent : 39,3 / 4,13 / 1,19 / 0,20 / 0,56 ;
 * - sous 1, au moins deux chiffres significatifs (0,056, pas 0,06) ;
 * - au-delà de `nb` chiffres entiers, l'arrondi des chiffres significatifs (1 194 → 1 190 en 3) ;
 * - un ENTIER exact reste entier (un dénombrement ne s'écrit pas « 12,0 »).
 *
 * Décimales imposées (`custom_digit`, le défaut depuis le 04/10/2026 : une) : ce nombre-là, zéros
 * de fin compris, et au plus autant que la règle des chiffres significatifs quand les deux sont
 * cochés. Une valeur NON NULLE qui s'arrondirait à zéro garde les décimales qu'il faut pour montrer
 * son premier chiffre (0,04 et non 0,0) : écrire 0 d'une part qui existe serait un mensonge.
 */
export const figureNumberText = (
  v: number,
  f: Pick<Type_FigureValueFormat, 'significant_digits' | 'nb_significant_digits' | 'custom_digit' | 'nb_digit' | 'scientific_notation'>
): string => {
  if (f.scientific_notation) {
    return f.significant_digits
      ? v.toExponential(clamp(f.nb_significant_digits - 1, 20))
      : v.toExponential()
  }
  if (!Number.isFinite(v)) return String(v)
  let n = v
  let decimals: number | undefined
  if (f.significant_digits) {
    const nb = clamp(f.nb_significant_digits, 21) || 1
    const abs = Math.abs(v)
    const int_digits = abs < 1 ? 1 : Math.floor(Math.log10(abs)) + 1
    if (int_digits > nb) n = parseFloat(v.toPrecision(nb))
    decimals = Math.max(0, nb - int_digits)
    if (abs > 0 && abs < 1) decimals = Math.max(decimals, 1 - Math.floor(Math.log10(abs)))
    decimals = Math.min(decimals, 20)
  }
  if (f.custom_digit) {
    const nb_digit = clamp(f.nb_digit, 20)
    decimals = decimals === undefined ? nb_digit : Math.min(decimals, nb_digit)
    const abs = Math.abs(v)
    if (abs > 0 && Number(abs.toFixed(decimals)) === 0) {
      decimals = Math.min(20, Math.max(decimals, -Math.floor(Math.log10(abs))))
    }
  }
  if (decimals === undefined) return new Intl.NumberFormat().format(n)
  n = parseFloat(n.toFixed(decimals))
  if (Number.isInteger(v)) decimals = 0
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n)
}

/** La fonction qui écrit un nombre selon ce format, unité comprise. */
export const figureValueFormatter = (f: Type_FigureValueFormat): ((v: number) => string) => {
  const suffix = f.unit ? ' ' + f.unit : ''
  const factor = (f.factor !== undefined && f.factor > 0) ? f.factor : 1
  return (raw: number) => figureNumberText(raw / factor, f) + suffix
}

/**
 * 04/10/2026 — LE POURCENTAGE ÉCRIT PAR UNE FIGURE : un entier, et « <1% » pour une part non nulle
 * qui s'arrondirait à 0 (ou à 1 sans l'atteindre). Une seule règle pour le secteur, l'étiquette
 * sortie, l'info-bulle et la légende : le même secteur ne s'écrit plus « 0,45% » au survol et « 0% »
 * sur le dessin.
 */
export const figurePercentText = (value: number, total: number): string => {
  const pct = total !== 0 ? value / total * 100 : 0
  if (pct > 0 && pct < 1) return '<1%'
  return Math.round(pct) + '%'
}
