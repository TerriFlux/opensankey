// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1445 — FABRIQUER LES ÉLÉMENTS D'UNE FIGURE À PARTIR DE SES PARTS.
//
// L'ENTRÉE EST CELLE DE TOUTES LES NATURES, et c'est la seconde correction du 20/09. La première
// version partait de l'arbre de la couronne, ce qui la réduisait aux parts-nœuds. Elle part
// désormais de la forme commune `{id, label, value, color}` — celle que produisent aussi bien la
// hiérarchie que la décomposition par flux ou par étiquette (`Type_ChartPart`, OS+). C'est ce qui
// fait que le même chemin servira aux barres : « chaque graphe doit être vu comme un ensemble
// d'éléments ».
//
// STRUCTUREL ET NON NOMINAL : le type d'entrée est décrit ici plutôt qu'importé d'OpenSankey+, qui
// dépend de ce paquet et non l'inverse. Même procédé que `Type_SunburstSankey`, pour la même
// raison.
//
// REBÂTIR PLUTÔT QUE SYNCHRONISER. Les parts changent à chaque geste de navigation (on déplie un
// niveau, on filtre une étiquette, on change d'axe) : tenir un diff coûterait plus cher que de
// refaire des éléments qui ne portent que leur figure. Ce qu'il faut préserver, ce sont les
// RÉGLAGES posés à la main — d'où `reuse`, qui les reprend par identifiant.

import type { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_PartsDocument } from './PartsDocument'
import { Class_PartElement } from './PartElement'
import { NO_SUBJECT } from './PartSubject'
import type { Type_PartSubject } from './PartSubject'

/** Une part telle que les décompositions la produisent, quelle que soit la nature. */
export interface Type_PartInput {
  id: string
  label: string
  value: number
  color?: string
  /** Ce que la part désigne. Absent = elle ne désigne rien (secteur de complément). */
  subject?: Type_PartSubject
}

export interface Type_FigureParts {
  /** Le document qui porte les parts. À `dispose()` quand la figure disparaît. */
  document: Class_PartsDocument
  /** Les parts par identifiant — la même clé que celle de la décomposition. */
  by_id: { [part_id: string]: Class_PartElement }
  /** Dans l'ordre où la décomposition les a données : c'est l'ordre du tracé. */
  ordered: Class_PartElement[]
}

/**
 * Construit les éléments d'une figure.
 *
 * @param source le document dont les objets sont les sujets.
 * @param parts les parts de la figure, dans l'ordre du tracé.
 * @param reuse les parts d'un tracé précédent, dont on reprend les réglages posés à la main.
 */
export const buildParts = (
  source: Class_ApplicationData,
  parts: Type_PartInput[],
  reuse?: Type_FigureParts
): Type_FigureParts => {
  const document = new Class_PartsDocument(source)
  const drawing_area = document.drawing_area
  const default_style = drawing_area.sankey.default_style
  const by_id: { [part_id: string]: Class_PartElement } = {}
  const ordered: Class_PartElement[] = []

  parts.forEach(input => {
    // Une même décomposition peut citer deux fois le même identifiant (un treillis, cf. os#1424).
    // On garde la PREMIÈRE : deux éléments pour une seule part auraient des réglages divergents,
    // et le second écraserait le premier dans le registre sans qu'on sache lequel est dessiné.
    if (by_id[input.id] !== undefined) return
    const part = new Class_PartElement(input.id, drawing_area, default_style)
    part.bindSubject(input.subject ?? NO_SUBJECT)

    // Les réglages que l'auteur avait posés sur CETTE part, et eux seuls : `copyAttrFrom` ne
    // transporte que les surcharges propres de l'élément, minimisées contre son style — ce qui est
    // hérité le reste.
    const previous = reuse?.by_id[input.id]
    if (previous !== undefined) part.copyAttrFrom(previous)

    by_id[input.id] = part
    ordered.push(part)
  })

  // L'ancien document a fini de servir : ses parts ont donné ce qu'elles portaient.
  reuse?.document.dispose()

  return { document, by_id, ordered }
}
