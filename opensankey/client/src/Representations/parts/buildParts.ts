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
import { createPartsDocument } from './PartsDocument'
import type { Class_PartsDocument } from './PartsDocument'
import { Class_PartElement } from './PartElement'
import { NO_SUBJECT } from './PartSubject'
import type { Type_PartSubject } from './PartSubject'
import { carryPartStyleOver, partStyleOf, seedPartStyles } from './partStyle'

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
  // os#1454 — PAR LA FABRIQUE, jamais par `new` : dans un espace de travail OS+, tout document
  // doit etre un document OS+ (cf. l en-tete de PartsDocument, et le plantage qu il raconte).
  const document = createPartsDocument(source)
  const drawing_area = document.drawing_area

  // os#1448 — LE STYLE DES PARTS, AVANT LA MOINDRE PART. Le constructeur d'un élément lit sa
  // liste de styles et s'y enregistre : un style posé après coup ne serait pas celui sur lequel
  // la part a été construite. C'est l'ordre du semis de l'étoile, et pour la même raison.
  //
  // C'est aussi sa simple PRÉSENCE dans `sankey.styles_list` que l'onglet Styles de l'inspecteur
  // montre : sans elle, « éditer globalement » n'a rien à proposer.
  seedPartStyles(drawing_area.sankey)
  const part_style = partStyleOf(drawing_area.sankey)
  // Ce que l'auteur avait réglé sur le style au dessin précédent — sans ce report, « toutes les
  // parts d'un coup » ne survivrait pas au premier dépliage (cf. `carryPartStyleOver`).
  carryPartStyleOver(
    reuse ? partStyleOf(reuse.document.drawing_area.sankey) : undefined,
    part_style
  )

  const by_id: { [part_id: string]: Class_PartElement } = {}
  const ordered: Class_PartElement[] = []

  parts.forEach(input => {
    // Une même décomposition peut citer deux fois le même identifiant (un treillis, cf. os#1424).
    // On garde la PREMIÈRE : deux éléments pour une seule part auraient des réglages divergents,
    // et le second écraserait le premier dans le registre sans qu'on sache lequel est dessiné.
    if (by_id[input.id] !== undefined) return
    // Le style de part, et non le style par défaut : c'est par lui que passe « toutes les parts
    // d'un coup ». Le constructeur d'élément empile de toute façon le style par défaut en dessous.
    const part = new Class_PartElement(input.id, drawing_area, part_style)
    part.bindSubject(input.subject ?? NO_SUBJECT)

    // Les réglages que l'auteur avait posés sur CETTE part, et eux seuls — VERBATIM.
    //
    // os#1448 : ce n'est plus `copyAttrFrom`, et c'est pour la même raison qui fait qu'une part
    // lit son sac par simple présence (cf. `Class_PartElement.isAttributeOverloaded`).
    // `copyAttrFrom` MINIMISE contre le style résolu de la source : une part qui porte la valeur
    // que son style porte aussi y perdait son réglage — « cocher le liséré sur ce secteur »
    // aurait tenu jusqu'au redessin suivant, puis disparu. La minimisation sert un autre cas (un
    // transfert de disposition entre deux diagrammes dont les styles diffèrent) ; ici le style
    // d'arrivée EST celui de départ, à l'amorce et au report près, et elle ne peut que perdre.
    const previous = reuse?.by_id[input.id]
    if (previous !== undefined) part.restoreStorage(previous.snapshotStorage())

    by_id[input.id] = part
    ordered.push(part)
  })

  // L'ancien document a fini de servir : ses parts ont donné ce qu'elles portaient.
  reuse?.document.dispose()

  // os#1456 — le document sait ce qu'il porte : c'est par là que le sélecteur d'éléments les
  // trouve, lui qui ne reçoit qu'un document (cf. `partsOfDocument`).
  _parts_of_document.set(document, ordered)

  return { document, by_id, ordered }
}

// ── LES PARTS D'UN DOCUMENT, POUR CEUX QUI NE CONNAISSENT QUE LUI ────────────────────────────
//
// os#1456 — Le sélecteur d'éléments de l'inspecteur (« Sélectionner des éléments : Nœuds, Flux,
// Zones ») demande à chaque nature la liste de ce qu'elle contient, et il ne reçoit qu'un
// DOCUMENT. Julien, à l'écran : « la sélection des éléments n'est pas pertinente puisqu'il n'y a
// pas les parts » — et il a raison deux fois : elles manquaient, et les trois natures proposées
// n'existent pas dans une figure.
//
// Les parts ne sont PAS dans `sankey.nodes_dict` — c'est tout le sens de la correction du 20/09,
// une part n'est pas un nœud — donc rien ne les retrouve depuis le document. On tient donc le lien
// ici, dans une table FAIBLE : la figure qui cesse de vivre emporte son entrée sans qu'on ait à
// penser à la retirer.

const _parts_of_document = new WeakMap<Class_PartsDocument, Class_PartElement[]>()

/** Les parts que ce document porte, dans l'ordre du tracé. Vide pour tout autre document. */
export const partsOfDocument = (document: unknown): Class_PartElement[] =>
  _parts_of_document.get(document as Class_PartsDocument) ?? []
