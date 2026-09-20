// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1445 — LE DOCUMENT QUI PORTE LES PARTS D'UNE FIGURE.
//
// Un élément exige une zone de dessin (elle lui donne le style par défaut, et c'est par elle que
// remonte la cascade), et une zone de dessin exige un document. Celui-ci est le plus petit qui
// tienne : il ne montre rien — le graphique trace — mais il donne aux parts un modèle complet, avec
// des styles auxquels « éditer globalement » pourra s'adresser.
//
// PAS DE SOUS-CLASSE DE SANKEY NI DE ZONE DE DESSIN, contrairement à l'étoile. Une étoile EST un
// Sankey : ses nœuds et ses flux doivent entrer dans le modèle par les fabriques. Une part n'est
// pas un nœud — c'est tout le sens de la correction du 20/09 — et n'a donc rien à faire dans
// `nodes_dict`. Elle est construite directement et vit dans le registre de sa figure
// (`buildParts`), ce qui évite au passage de faire croire au reste du code qu'une couronne contient
// des nœuds.
//
// Trois façons dont ce document n'en est pas un comme les autres, et ce sont celles de l'étoile
// (`StarDocument.ts`) :
//
//  1. IL PARTAGE L'HISTORIQUE DE SA SOURCE — un seul Ctrl+Z pour l'auteur.
//  2. IL NE S'ENREGISTRE JAMAIS : il n'est la feuille de personne et n'a pas d'adresse ; le fichier
//     qu'il montre est celui de sa source, où `file_holder` renvoie tout geste d'enregistrement.
//  3. IL VIT LE TEMPS DE SA FIGURE.

import { Class_ApplicationData } from '../../types/ApplicationData'
import type { CreateToastFnReturn } from '@chakra-ui/react'

/**
 * os#1471 — LES REGLES D'UN DOCUMENT DE PARTS, ECRITES UNE SEULE FOIS.
 *
 * ⚠️ CE MODULE EXISTE PARCE QUE LA DUPLICATION A MORDU DEUX FOIS, et la seconde etait annoncee.
 *
 * TypeScript n'a pas d'heritage multiple : `Class_PartsDocument` descend du document d'OpenSankey,
 * `Class_PartsDocumentOSP` du document d'OpenSankey+ — et dans un espace de travail OS+, c'est la
 * seconde qui sert (os#1454). Les deux portaient donc les MEMES regles, recopiees.
 *
 * Le test d'os#1454 le disait en toutes lettres : « la classe OS+ REECRIT ces regles ; si l'une
 * d'elles etait oubliee ici, elle ne manquerait qu'en OS+, c'est-a-dire chez tous les
 * utilisateurs ». C'est exactement ce qui est arrive a la cinquieme regle — le catalogue d'icones
 * partage (os#1465) — posee cote OS seulement. Julien, deux fois : « l'icone ne marche toujours
 * pas ». Elle marchait, dans la classe que personne n'utilise.
 *
 * Une regle ajoutee ici vaut desormais pour les deux, sans que personne ait a y penser.
 */
export const applyPartsDocumentRules = (
  document: Class_ApplicationData,
  source: Class_ApplicationData
): void => {
  // (1) UN SEUL HISTORIQUE — ET LE CHAMP, PAS SEULEMENT L'ACCESSEUR. `Class_ApplicationData` lit
  // tantot `history`, tantot le champ directement : ne surcharger que le getter donnerait DEUX
  // piles, divergentes en silence (piege vecu au lot 6 des figures).
  ;(document as unknown as { _history: unknown })._history = source.history

  // (2) TOUT GESTE D'ENREGISTREMENT PART A LA SOURCE.
  document.file_holder = source

  // (3) AUCUNE VIGNETTE NE REND CE DOCUMENT : il n'a pas de conteneur a lui.
  document.detachOffscreen()

  // (4) LE DROIT D'ECRIRE VIENT DE LA SOURCE : les parts d'une figure dans une page publiee ne se
  // repeignent pas.
  document.edition_allowed = source.edition_allowed

  // (5) LE CATALOGUE D'ICONES EST CELUI DE LA SOURCE — os#1465, et c'est un defaut vecu.
  //
  // Un document de parts en fabrique un neuf comme tout document, et personne n'y avait jamais rien
  // mis. La consequence etait double, et la premiere est la pire : le SELECTEUR d'icones de
  // l'inspecteur lit le catalogue du document ACTIF — donc celui des parts. Il n'avait rien a
  // proposer. L'auteur ne pouvait meme pas choisir, avant de ne pas voir.
  //
  // PARTAGE PAR REFERENCE, comme l'historique ci-dessus et pour la meme raison : un pictogramme
  // nomme dans le diagramme doit designer le meme dessin dans la figure. Deux catalogues, c'est
  // deux verites — et celle de la figure serait vide.
  const source_sankey = source.drawing_area?.sankey
  if (source_sankey !== undefined && document.drawing_area !== undefined) {
    document.drawing_area.sankey.icon_catalog = source_sankey.icon_catalog
  }
}

export class Class_PartsDocument extends Class_ApplicationData {

  /**
   * Le document dont les objets sont les sujets des parts.
   *
   * `| undefined` et non `!` : la classe mère appelle `createNewMenuConfiguration` et
   * `createNewDrawingArea` depuis SON constructeur, donc avant que le corps de celui-ci n'ait posé
   * la source. Les gardes ci-dessous ne sont pas décoratives, elles couvrent cette fenêtre-là.
   */
  protected _source: Class_ApplicationData | undefined = undefined
  public get source(): Class_ApplicationData { return this._source as Class_ApplicationData }

  constructor(source: Class_ApplicationData) {
    // Le MÊME espace de travail que la source : la figure partage sa langue, ses licences et sa
    // configuration de menus hôte. Un espace jetable en ferait un document que l'inspecteur ne
    // saurait pas atteindre.
    super(source.workspace)
    this._source = source

    // os#1471 — LES CINQ REGLES SONT ECRITES UNE FOIS, ET LES DEUX CLASSES LES APPLIQUENT.
    // Les recopier ici a coute deux defauts, dont un chez tous les utilisateurs d'OS+ : cf.
    // l'en-tete de `applyPartsDocumentRules`.
    applyPartsDocumentRules(this, source)
  }

  /**
   * Appelée par le CONSTRUCTEUR de la classe mère, donc AVANT que `_source` ne soit posé : d'où la
   * garde. Elle refabrique un historique neuf — on le repointe aussitôt, sans quoi le premier
   * geste rendrait à la figure une pile propre et la ferait diverger de sa source.
   */
  public override createNewMenuConfiguration(toast: CreateToastFnReturn | null = null) {
    const menu_configuration = super.createNewMenuConfiguration(toast)
    if (this._source !== undefined) this._history = this._source.history
    return menu_configuration
  }

  /** Même raison : rendre sa pile à la figure la ferait diverger. */
  public override resetHistory(): void {
    if (this._source === undefined) { super.resetHistory(); return }
    this._history = this._source.history
  }

  /**
   * Une figure n'écrit jamais la barre d'adresse : elle n'est pas ce que la page montre, et deux
   * figures ouvertes se la disputeraient.
   */
  public override syncUrlState(): void { /* rien : cf. l'en-tête, règle 2 */ }
}

// ── QUI FABRIQUE LE DOCUMENT DE PARTS ────────────────────────────────────────────────────────
//
// os#1454 — L'INVARIANT QUE LA PREMIÈRE VERSION A CASSÉ, ET QUI A PLANTÉ dev.
//
// `BannerViewsOSP` l'énonce noir sur blanc : « dans un espace de travail OS+, TOUT document est un
// `Class_ApplicationDataOSP` — c'est sa fabrique qui les crée », et il en tire un resserrement de
// type sans garde. La classe ci-dessus est un document d'OpenSankey : dès qu'elle devient l'ACTIF
// — ce qui est tout l'objet du branchement de l'inspecteur (os#1446) — les bannières d'OS+ lisent
// `menu_configuration_osp`, qui n'existe pas sur elle. Erreur à la première fenêtre touchée :
//   TypeError: can't access property "ref_to_banner_views_updater", a is undefined
//
// On ne peut pas régler ça en sous-classant ici : `Representations/parts/` est en OpenSankey, et
// OpenSankey ne connaît pas OpenSankey+. C'est donc la couche du dessus qui pose SA fabrique, au
// même titre que `Class_WorkspaceOSP.instantiateDocument` pose la sienne — et pour exactement la
// même raison.
//
// Le défaut reste la classe d'OpenSankey : un éditeur OS pur n'a pas de bannières de vues, et rien
// à surcharger.

export type Type_PartsDocumentFactory = (source: Class_ApplicationData) => Class_PartsDocument

let _parts_document_factory: Type_PartsDocumentFactory = (source) => new Class_PartsDocument(source)

/**
 * Pose la fabrique de documents de parts. Appelée par la couche qui sait quelle classe de document
 * son espace de travail exige — jamais au chargement du module (effet de bord), toujours depuis
 * l'enregistrement de ses représentations.
 */

export const setPartsDocumentFactory = (factory: Type_PartsDocumentFactory): void => {
  _parts_document_factory = factory
}

/** Le document de parts d'une figure, de la classe que la couche en place exige. */
export const createPartsDocument = (source: Class_ApplicationData): Class_PartsDocument =>
  _parts_document_factory(source)
