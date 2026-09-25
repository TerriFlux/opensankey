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
// RÉCONCILIER, ET NON REBÂTIR — os#1453, ET C'EST UN RETOURNEMENT ASSUMÉ.
//
// Ce fichier a d'abord rebâti : un document neuf et des éléments neufs à chaque dessin, les
// réglages repris par identifiant. C'était défendable tant que RIEN NE POINTAIT SUR UNE PART.
//
// Depuis, trois choses pointent dessus : la SÉLECTION de la zone de dessin (os#1446), le DOCUMENT
// ACTIF de l'espace de travail (`bindWindowDocument`), et l'INSPECTEUR qui lit l'un et l'autre. Et
// depuis os#1459, écrire un attribut demande un redessin. Rebâtir revenait donc à détruire, à
// chaque réglage, l'objet même qu'on était en train de régler. Julien l'a vu en trois symptômes
// d'un seul défaut : « je clique sur une part, l'interface apparaît mais EN CLIQUANT DEUX FOIS ; je
// clique sur Fond, ça ne fait rien ; et EN PLUS ça ramène sur Graphe ».
//
// Le « ça ramène sur Graphe » dit tout : le document actif était remplacé par un neuf, dont la
// sélection était vide, et l'inspecteur retombait sur la figure faute de sélection.
//
// On réconcilie donc : le document VIT, les parts que la décomposition cite encore sont les MÊMES
// objets, seules les nouvelles sont construites, et celles qui disparaissent quittent la sélection.
// Ce n'est pas plus cher qu'avant — c'est le même parcours de la liste — et ça retire le report de
// réglages, qui n'a plus rien à reporter.

import type { Class_ApplicationData } from '../../types/ApplicationData'
import { createPartsDocument } from './PartsDocument'
import type { Class_PartsDocument } from './PartsDocument'
import { Class_PartElement } from './PartElement'
import { NO_SUBJECT } from './PartSubject'
import type { Type_PartSubject } from './PartSubject'
import {
  partNatureStyleIdOf, partNatureStyleOf, partStyleOf, seedPartStyles
} from './partStyle'

/** Une part telle que les décompositions la produisent, quelle que soit la nature. */
export interface Type_PartInput {
  id: string
  label: string
  value: number
  color?: string
  /** Ce que la part désigne. Absent = elle ne désigne rien (secteur de complément). */
  subject?: Type_PartSubject
  // ── CE QUE LA MONNAIE TRANSPORTE SANS LE DÉPENSER (23/09/2026) ──────────────────────────────
  //
  // Une décomposition HIÉRARCHIQUE met dans une même liste des parts venues de niveaux différents
  // (cf. `decomposeNodeHierarchy`). Ces trois champs disent d'où chacune vient ; ils vont du
  // décomposeur AU TRACÉ, qui reçoit précisément cette liste (`Type_FigureNatureSpec.draw`).
  //
  // ⚠️ CE FICHIER NE LES LIT PAS, et c'est voulu : un élément de part n'a ni profondeur ni parent
  // — il a une forme, un libellé et une valeur. Les déclarer ici plutôt que de les faire voyager
  // en douce est le prix honnête du passage ; les oublier les ferait disparaître au premier
  // `map` qu'on écrirait sans y penser.
  /** Rang sous la racine de la décomposition. 0 = enfant direct. */
  depth?: number
  /** Le nom du parent DESSINÉ, celui que la légende met devant. */
  parent_label?: string
  /** L'ancêtre de premier rang : c'est lui qui donne la TEINTE, la profondeur donnant la clarté. */
  branch_id?: string
  /** La route DESSINÉE jusqu'à cette part, racine comprise : c'est elle que le clic déplie. */
  path?: string[]
  /** Reste-t-il quelque chose à déplier sous cette part ? */
  has_children?: boolean
}

export interface Type_FigureParts {
  /** Le document qui porte les parts. À `dispose()` quand la figure disparaît. */
  document: Class_PartsDocument
  /** Les parts par identifiant — la même clé que celle de la décomposition. */
  by_id: { [part_id: string]: Class_PartElement }
  /** Dans l'ordre où la décomposition les a données : c'est l'ordre du tracé. */
  ordered: Class_PartElement[]
  /**
   * 25/09/2026 — LA NATURE QUE CES PARTS SERVENT, et c'est ce qui manquait pour la reprise.
   *
   * Le dépôt est indexé par (fenêtre, vignette) — pas par nature (`figurePartsRegistry`). Changer
   * la représentation d'un volet reprend donc le jeu précédent, ce qui est voulu : la sélection,
   * le document actif et les réglages de l'auteur survivent au geste. Mais il faut alors savoir
   * qu'on change de figure, sans quoi les parts restent celles de l'ancienne.
   */
  nature: string
}

/**
 * Les éléments d'une figure, réconciliés sur les parts du moment.
 *
 * @param source le document dont les objets sont les sujets.
 * @param parts les parts de la figure, dans l'ordre du tracé.
 * @param reuse le jeu du dessin précédent. Son document et ses parts sont REPRIS, pas remplacés.
 * @param nature la sorte de figure (`sunburst`, `donut`, `bars`) — elle décide du second étage de
 *   styles. Absente : les parts s'en tiennent au style générique.
 */
export const buildParts = (
  source: Class_ApplicationData,
  parts: Type_PartInput[],
  reuse?: Type_FigureParts,
  nature?: string
): Type_FigureParts => {
  // LE DOCUMENT SURVIT AU DESSIN. C'est lui que la vignette a déclaré à l'espace de travail, et
  // `bindWindowDocument` est idempotent : reposer le même ne fait basculer aucun actif. En poser un
  // neuf, si — et c'était le « ça ramène sur Graphe ».
  //
  // os#1454 — PAR LA FABRIQUE, jamais par `new` : dans un espace de travail OS+, tout document
  // doit etre un document OS+ (cf. l en-tete de PartsDocument, et le plantage qu il raconte).
  const document = reuse?.document ?? createPartsDocument(source)
  const drawing_area = document.drawing_area

  // os#1449 — LE STYLE DES PARTS, AVANT LA MOINDRE PART. Le constructeur d'un élément lit sa
  // liste de styles et s'y enregistre : un style posé après coup ne serait pas celui sur lequel
  // la part a été construite. C'est l'ordre du semis de l'étoile, et pour la même raison.
  //
  // C'est aussi sa simple PRÉSENCE dans `sankey.styles_list` que l'onglet Styles de l'inspecteur
  // montre : sans elle, « éditer globalement » n'a rien à proposer.
  //
  // UNE SEULE FOIS, au premier dessin : le document vivant garde son style, avec ce que l'auteur y
  // a réglé. C'est ce qui a rendu `carryPartStyleOver` inutile — il n'existait que pour rattraper
  // le document qu'on jetait.
  //
  // 25/09/2026 — ET AU CHANGEMENT DE REPRÉSENTATION AUSSI. Julien : « si je passe par Couronne et
  // que je sélectionne Barres dans le sélecteur de la fenêtre, ça ne met pas à jour l'inspecteur. »
  //
  // Le volet garde son jeu de parts — c'est ce qui fait survivre la sélection et le document actif
  // (os#1453) — mais la FIGURE, elle, a changé. Sans ce semis, `BarPartStyle` n'existait jamais :
  // l'inspecteur continuait d'offrir « Part de couronne », de lire les défauts de la couronne, et
  // de masquer ce que la portée réserve aux figures carrées.
  const figure_nature = nature ?? ''
  const nature_changed = reuse !== undefined && reuse.nature !== figure_nature
  if (reuse === undefined || nature_changed) seedPartStyles(drawing_area.sankey, nature)
  const part_style = partStyleOf(drawing_area.sankey)
  // os#1462 — L'ÉTAGE DE LA NATURE, qui se pose PAR-DESSUS le générique et gagne donc sur lui :
  // « en haut c'est générique, et en bas ça se spécialise ». Absent pour une nature qu'aucun style
  // ne décrit encore — la part s'en tient alors au générique, c'est-à-dire à l'aspect d'avant.
  const nature_style = partNatureStyleOf(drawing_area.sankey, nature)
  // Le style de la nature qu'on QUITTE : il reste au document — l'auteur peut revenir à la
  // couronne, et ses réglages de secteur l'y attendent — mais il ne doit plus parler aux parts.
  const former_nature_style_id = nature_changed
    ? partNatureStyleIdOf(reuse?.nature)
    : undefined

  const by_id: { [part_id: string]: Class_PartElement } = {}
  const ordered: Class_PartElement[] = []

  parts.forEach(input => {
    // Une même décomposition peut citer deux fois le même identifiant (un treillis, cf. os#1424).
    // On garde la PREMIÈRE : deux éléments pour une seule part auraient des réglages divergents,
    // et le second écraserait le premier dans le registre sans qu'on sache lequel est dessiné.
    if (by_id[input.id] !== undefined) return
    // LA MÊME PART QU'AU DESSIN PRÉCÉDENT, quand la décomposition la cite encore. C'est toute la
    // correction : l'objet que l'inspecteur tient, que la sélection désigne et que le tracé lit
    // est un seul et même objet, d'un dessin à l'autre.
    //
    // Le style de part, et non le style par défaut, pour celles qu'on construit : c'est par lui
    // que passe « toutes les parts d'un coup ». Le constructeur empile le style par défaut dessous.
    let part = reuse?.by_id[input.id]
    if (part === undefined) {
      part = new Class_PartElement(input.id, drawing_area, part_style)
      // os#1483 — la part sait de quelle FIGURE elle est une part (cf. `figure_nature`).
      part.figure_nature = figure_nature
      // Empilé APRÈS la construction, car un élément ne se construit qu'avec un style : la cascade
      // d'une part est donc `[défaut, générique, nature]`, dans cet ordre de priorité croissante.
      if (nature_style !== undefined) part.addStyle(nature_style)
    } else if (nature_changed) {
      // LA MÊME PART, UNE AUTRE FIGURE. Elle garde son identifiant, son sujet et ce que l'auteur a
      // posé en propre — un alias, une couleur : ce sont des réglages de CETTE part, et ils valent
      // pour un secteur comme pour une barre. Ce qui change est ce qui dit de quelle figure elle
      // est une part : sa nature, et l'étage de style qui va avec.
      if (former_nature_style_id !== undefined) part.removeStyleById(former_nature_style_id)
      part.figure_nature = figure_nature
      if (nature_style !== undefined) part.addStyle(nature_style)
    }
    // Le SUJET se relie à chaque fois : une part peut garder son identifiant en changeant ce
    // qu'elle désigne (un axe de comparaison qui bascule), et son nom en dépend.
    part.bindSubject(input.subject ?? NO_SUBJECT)

    by_id[input.id] = part
    ordered.push(part)
  })

  // LES PARTS QUE LA DÉCOMPOSITION NE CITE PLUS. Elles quittent la sélection avant d'être oubliées :
  // sans cela l'inspecteur continuerait de proposer les réglages d'un secteur qui n'est plus à
  // l'écran — et l'auteur les poserait sur rien.
  Object.entries(reuse?.by_id ?? {}).forEach(([id, part]) => {
    if (by_id[id] === part) return
    drawing_area.removeElementFromSelection(part)
    part.delete()
  })

  // os#1456 — le document sait ce qu'il porte : c'est par là que le sélecteur d'éléments les
  // trouve, lui qui ne reçoit qu'un document (cf. `partsOfDocument`).
  _parts_of_document.set(document, ordered)

  return { document, by_id, ordered, nature: figure_nature }
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
