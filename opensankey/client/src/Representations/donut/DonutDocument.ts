// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1445 — LE DOCUMENT D'UNE COURONNE.
//
// Une zone de dessin exige un document (`Class_DrawingArea` le prend au constructeur) : celui-ci
// est le plus petit qui tienne. Il ne sert pas à montrer un diagramme — la couronne est tracée par
// `SunburstChart` — mais à donner aux parts un modèle complet : un sankey, des styles, une cascade.
//
// Trois façons dont une couronne N'EST PAS un document comme les autres, et ce sont les mêmes que
// pour l'étoile (`StarDocument.ts`) :
//
//  1. ELLE PARTAGE L'HISTORIQUE DE SA SOURCE. Renommer une part renomme un nœud du diagramme : un
//     seul Ctrl+Z pour l'auteur, et il doit défaire ce geste-là où il a eu lieu.
//  2. ELLE NE S'ENREGISTRE JAMAIS. Elle n'est la feuille de personne et n'a pas d'adresse ; le
//     fichier qu'elle montre est celui de sa source. `file_holder` renvoie tout geste
//     d'enregistrement là-bas — c'est le mécanisme des feuilles, et il dit exactement ce qu'il
//     faut ici.
//  3. ELLE VIT LE TEMPS DE SA FIGURE. `dispose()` la démonte et l'espace de travail l'oublie.
//
// HORS ÉCRAN, toujours : contrairement à l'étoile, aucune vignette ne rend CE document. Il n'a donc
// pas de conteneur, et `detachOffscreen` lui évite de chercher un `#sankey_app` qui ne le concerne
// pas.

import { Class_ApplicationData } from '../../types/ApplicationData'
import type { CreateToastFnReturn } from '@chakra-ui/react'
import { Class_DonutDrawingArea } from './DonutDrawingArea'

export class Class_DonutDocument extends Class_ApplicationData {

  /**
   * Le document dont les nœuds sont les sujets. Posé au constructeur, jamais changé — une couronne
   * qui changerait de source serait une autre couronne.
   *
   * `| undefined` et non `!` : la classe mère appelle `createNewMenuConfiguration` et
   * `createNewDrawingArea` depuis SON constructeur, donc avant que le corps de celui-ci n'ait posé
   * la source. Les gardes ci-dessous ne sont pas décoratives, elles couvrent cette fenêtre-là — et
   * le type doit les autoriser.
   */
  protected _source: Class_ApplicationData | undefined = undefined
  public get source(): Class_ApplicationData { return this._source as Class_ApplicationData }

  constructor(source: Class_ApplicationData) {
    // Le MÊME espace de travail que la source : la couronne partage sa langue, ses licences et sa
    // configuration de menus hôte. Un espace jetable en ferait un document que l'inspecteur ne
    // saurait pas atteindre.
    super(source.workspace)
    this._source = source

    // (1) UN SEUL HISTORIQUE — ET LE CHAMP, PAS SEULEMENT L'ACCESSEUR. `Class_ApplicationData` lit
    // tantôt `history`, tantôt le champ `this._history!` directement (Ctrl+Z, l'undo du
    // déplacement aux flèches, le setter générique d'attribut). Ne surcharger que le getter
    // donnerait DEUX piles, divergentes en silence : c'est le piège vécu au lot 6 des figures.
    this._history = source.history

    // (2) TOUT GESTE D'ENREGISTREMENT PART À LA SOURCE.
    this.file_holder = source

    // (3) AUCUNE VIGNETTE NE REND CE DOCUMENT : il n'a pas de conteneur à lui.
    this.detachOffscreen()

    // Une couronne ne s'édite pas comme un diagramme : ses parts se règlent par l'inspecteur, et
    // le droit d'écrire vient de la SOURCE — une couronne dans une page publiée ne se repeint pas.
    this.edition_allowed = source.edition_allowed
  }

  // FABRIQUES ==========================================================================

  public override createNewDrawingArea(id?: string) {
    return new Class_DonutDrawingArea(this, id)
  }

  /**
   * Appelée par le CONSTRUCTEUR de la classe mère, donc AVANT que `_source` ne soit posé : d'où la
   * garde. Elle refabrique un historique neuf — on le repointe aussitôt, sans quoi le premier
   * geste rendrait à la couronne une pile propre et la ferait diverger de sa source.
   */
  public override createNewMenuConfiguration(toast: CreateToastFnReturn | null = null) {
    const menu_configuration = super.createNewMenuConfiguration(toast)
    if (this._source !== undefined) this._history = this._source.history
    return menu_configuration
  }

  /** Même raison : rendre sa pile à la couronne la ferait diverger. */
  public override resetHistory(): void {
    if (this._source === undefined) { super.resetHistory(); return }
    this._history = this._source.history
  }

  /**
   * Une couronne n'écrit jamais la barre d'adresse : elle n'est pas ce que la page montre, et deux
   * couronnes ouvertes se la disputeraient.
   */
  public override syncUrlState(): void { /* rien : cf. l'en-tête, règle 2 */ }
}
