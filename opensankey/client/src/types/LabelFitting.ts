// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// #377 — Logique PURE de l'élagage des étiquettes qui ne tiennent pas dans la hauteur de leur
// élément (nœud, cadre englobant, flux). Aucune dépendance au DOM ni à d3 : la mesure de texte
// est INJECTÉE par l'appelant (canvas.measureText côté rendu, fonction déterministe en test).
//
// L'élagage s'active PAR ÉTIQUETTE (attribut `prune_if_unfitting` du libellé et de la valeur,
// cf. BASE_LABEL_CONFIG) : l'utilisateur arbitre élément par élément, ou d'un coup par les
// styles. Ce n'est pas un masquage figé dans le document — la place disponible est réévaluée à
// chaque dessin, donc la réponse suit la sélection de dataTags affichée à l'instant.
//
// Règle du ticket, dans cet ordre :
//   1. le LIBELLÉ s'affiche s'il tient dans la hauteur disponible ;
//   2. la VALEUR s'affiche seulement s'il reste de la place APRÈS le libellé ;
//   3. rien sinon.
//
// « Hauteur disponible » = hauteur de l'ÉLÉMENT (hauteur rendue d'un nœud / d'un cadre englobant,
// épaisseur d'un flux) — jamais la place autour du texte : la règle vaut donc aussi pour une
// étiquette posée à l'extérieur de son élément (libellé de cadre englobant à gauche, valeur de
// flux repoussée au-dessus du flux par `pos_auto`, …).

/** Mesure la largeur rendue d'une chaîne, dans la même unité que `box_width`. */
export type Type_TextMeasure = (text: string) => number

export type Type_LabelFitPlan = {
  /** true = le libellé peut être dessiné (au regard du seul critère de place). */
  name: boolean
  /** true = la valeur peut être dessinée (au regard du seul critère de place). */
  value: boolean
}

/**
 * Découpe un mot plus large que la boîte en morceaux qui y tiennent (miroir de
 * `breakLongWords` de DrawLabel, réduit au seul comptage : on ne restitue pas les traits d'union).
 * Ne sert que si l'attribut `wrap_long_words` du label est actif — sinon un mot unique déborde
 * sans jamais être coupé (comportement de d3-textwrap).
 */
function splitOversizedWord(
  word: string,
  box_width: number,
  measure: Type_TextMeasure
): string[] {
  if (measure(word) <= box_width) return [word]
  const parts: string[] = []
  let current = ''
  for (const ch of Array.from(word)) {
    const next = current + ch
    if (current !== '' && measure(next) > box_width) {
      parts.push(current)
      current = ch
    } else {
      current = next
    }
  }
  if (current !== '') parts.push(current)
  return parts.length > 0 ? parts : [word]
}

/**
 * Nombre de lignes qu'occupera un texte une fois replié dans une boîte de largeur `box_width`.
 * Repli glouton par mots — même stratégie que d3-textwrap, qui pose le rendu réel.
 *
 * Cas particuliers volontaires :
 * - texte vide => 0 ligne (rien à dessiner, donc rien à réserver) ;
 * - `box_width` <= 0 (pas de contrainte de largeur) => 1 ligne ;
 * - mot unique plus large que la boîte et `break_long_words` faux => 1 ligne qui déborde
 *   latéralement (c'est le rendu actuel : sans espace, d3-textwrap ne replie pas).
 */
export function countWrappedLines(
  text: string,
  box_width: number,
  measure: Type_TextMeasure,
  break_long_words: boolean = false
): number {
  if (!text || text.trim() === '') return 0
  const words = text.split(/\s+/).filter(w => w !== '')
  if (words.length === 0) return 0
  if (!(box_width > 0)) return 1

  let lines = 1
  let current = ''
  for (const word of words) {
    const pieces = break_long_words ? splitOversizedWord(word, box_width, measure) : [word]
    for (const piece of pieces) {
      const candidate = current === '' ? piece : current + ' ' + piece
      if (current !== '' && measure(candidate) > box_width) {
        lines += 1
        current = piece
      } else {
        current = candidate
      }
    }
  }
  return lines
}

/** Une étiquette vue par la règle : la hauteur qu'elle prendrait, et son opt-in à l'élagage. */
export type Type_LabelFitCandidate = {
  /** hauteur qu'occuperait l'étiquette si elle était dessinée (0 = rien à dessiner) */
  required: number
  /** attribut `prune_if_unfitting` de CETTE étiquette : false => jamais élaguée */
  prune: boolean
}

/**
 * Décide, pour UN élément, ce qui tient dans sa hauteur : le libellé d'abord, la valeur ensuite.
 *
 * @param available_height hauteur rendue de l'élément (repère local du diagramme)
 * @param name             libellé de l'élément
 * @param value            valeur de l'élément
 *
 * L'opt-in est PAR ÉTIQUETTE (attribut `prune_if_unfitting`), ce qui donne trois nuances :
 * - une étiquette dont l'attribut est décoché n'est jamais élaguée — mais si elle est dessinée,
 *   elle occupe quand même sa hauteur, donc elle prive l'autre de la place correspondante ;
 * - une hauteur requise nulle vaut « rien à placer » : réponse `true`, aucune contrainte
 *   ajoutée (les autres portes d'affichage tranchent déjà le cas) ;
 * - un libellé qui est élagué faute de place emporte la valeur avec lui (point 3 de la règle) —
 *   afficher un nombre seul à la place du nom d'un élément n'aiderait pas à lire le diagramme.
 *   Sauf si la valeur, elle, a explicitement renoncé à l'élagage : son affichage est alors un
 *   choix assumé de l'utilisateur, que la règle ne défait pas.
 */
export function computeLabelFitPlan(
  available_height: number,
  name: Type_LabelFitCandidate,
  value: Type_LabelFitCandidate
): Type_LabelFitPlan {
  const height = Number.isFinite(available_height) ? available_height : 0
  const has_name = name.required > 0
  const has_value = value.required > 0

  const name_fits = !has_name || !name.prune || name.required <= height
  const name_drawn = has_name && name_fits
  const consumed = name_drawn ? name.required : 0

  let value_fits: boolean
  if (!has_value || !value.prune) {
    value_fits = true
  } else if (has_name && !name_fits) {
    value_fits = false
  } else {
    value_fits = consumed + value.required <= height
  }

  return { name: name_fits, value: value_fits }
}
