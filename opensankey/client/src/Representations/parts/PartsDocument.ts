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

    // (1) UN SEUL HISTORIQUE — ET LE CHAMP, PAS SEULEMENT L'ACCESSEUR. `Class_ApplicationData` lit
    // tantôt `history`, tantôt le champ `this._history!` directement. Ne surcharger que le getter
    // donnerait DEUX piles, divergentes en silence : c'est le piège vécu au lot 6 des figures.
    this._history = source.history

    // (2) TOUT GESTE D'ENREGISTREMENT PART À LA SOURCE.
    this.file_holder = source

    // (3) AUCUNE VIGNETTE NE REND CE DOCUMENT : il n'a pas de conteneur à lui.
    this.detachOffscreen()

    // Le droit d'écrire vient de la SOURCE : les parts d'une figure dans une page publiée ne se
    // repeignent pas.
    this.edition_allowed = source.edition_allowed
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
