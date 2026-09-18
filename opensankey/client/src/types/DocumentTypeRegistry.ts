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

// os#1385 (lot 5, D9) — REGISTRE DES TYPES DE DOCUMENTS.
//
// « Un document est typé. Le Sankey est un type » (NOTE-APPLI-D-APPLIS.md, D9). Une FEUILLE du
// fichier porte un document (lot 4 : `Type_SheetEntry.type`, absent = `'sankey'`) ; ce registre
// dit ce qu'on sait faire de ce type-là, et c'est tout ce que le reste du code a besoin d'en
// savoir. Même patron que le registre des représentations : une entrée par type, des fonctions
// déclarées, aucun `switch` à compléter ailleurs.
//
// QUATRE QUESTIONS, ET PAS UNE DE PLUS :
//  - `has_canvas` : ce document peut-il devenir la feuille COURANTE, donc la racine du fichier ?
//    Vrai pour un Sankey seul, tant que dure la règle de la racine (D8). C'est ce champ, et non
//    le nom du type, que lisent `switchToSheet` et `deleteSheet` : la question posée est « y
//    a-t-il un canevas à montrer ? », pas « est-ce un Sankey ? ».
//  - `load` / `serialize` : comment une entrée devient un document vivant, et l'inverse.
//  - `defaultWindow` : la fenêtre qui s'ouvre quand on « ouvre » cette feuille.
//  - `offers` : les représentations qui ont un sens sur ce document (filtre du registre des
//    représentations, par identifiant) ; absent = toutes.
//
// AJOUTER UN TYPE : écrire l'entrée, l'enregistrer depuis la fonction d'enregistrement de sa
// couche (`registerBaseDocumentTypes` ici, `registerOSPDocumentTypes` chez OS+) — JAMAIS au
// niveau module : un effet de bord d'import se déclenche à l'importation d'un type et casse le
// rechargement à chaud. L'enregistrement est idempotent PAR ID, donc une couche supérieure peut
// remplacer une entrée de base sans que l'ordre des imports compte.
//
// CE FICHIER N'IMPORTE `ApplicationData` QU'EN TYPE (effacé à la compilation) : c'est
// `ApplicationData` qui importe le registre en VALEUR, dans ce sens-là uniquement, et il n'y a
// donc aucun cycle à l'exécution. Le chargeur de base n'a besoin d'aucune valeur de là-bas :
// `createDocument`, `fromJSON` et `toSheetContentJSON` sont des méthodes des instances qu'on
// lui passe.

import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'

import type { Class_ApplicationData, Type_SheetEntry } from './ApplicationData'
import type { Type_JSON } from './Utils'
import type { Type_MainZoneSubject } from './MenuConfig'
import { MAIN_ZONE_CANVAS_ID } from './MenuConfig'

/** os#1385 (lot 5, D9) — le type d'un document qui porte un diagramme Sankey. */
export const SANKEY_DOCUMENT_TYPE = 'sankey'

/**
 * La fenêtre qu'un type ouvre par défaut : un SUJET (sans `sheet` — c'est l'appelant qui sait de
 * quelle feuille il parle, et qui le pose) et une représentation du registre des représentations.
 */
export type Type_DocumentDefaultWindow = {
  subject: Type_MainZoneSubject
  representation: string
}

/** Ce qu'un type de document sait faire. Cf. l'en-tête du fichier pour le pourquoi de chacun. */
export type Type_DocumentType = {
  /** Id stable, écrit dans le fichier (`sheets.entries[*].type`). On ne le renomme pas. */
  id: string
  /** Libellé traduit (onglet de feuille, menu). */
  label: (t: TFunction) => string
  /** Icône de l'onglet et des menus. Absente = l'onglet garde son aspect d'aujourd'hui. */
  icon?: ReactNode
  /**
   * Ce document peut-il devenir la feuille COURANTE, donc la racine du fichier ? Vrai pour un
   * Sankey seul (règle de la racine, D8) : tous les lecteurs hors éditeur supposent un Sankey à
   * la racine (viewer, parc publié, serveur, SEP, cartofob).
   */
  has_canvas: boolean
  /**
   * Charge une entrée de feuille dans un document VIVANT de l'espace de travail (hors écran).
   * `holder` est le document PORTEUR du fichier, `id` l'identifiant de la feuille.
   */
  load: (holder: Class_ApplicationData, json: Type_JSON, id: string) => Class_ApplicationData
  /** Sérialise un document vivant en contenu d'entrée de feuille. */
  serialize: (doc: Class_ApplicationData) => Type_JSON
  /**
   * La fenêtre qui s'ouvre quand on « ouvre » cette feuille. `null` = ce type ne s'ouvre pas de
   * lui-même (l'appelant le dit à l'écran plutôt que d'ouvrir une fenêtre vide).
   */
  defaultWindow: (doc: Class_ApplicationData) => Type_DocumentDefaultWindow | null
  /**
   * Les représentations offertes à une fenêtre sur ce document, par identifiant de registre.
   * ABSENT = toutes — un type qui ne dit rien ne retire rien.
   */
  offers?: (representation_id: string) => boolean
}

/**
 * LE CHARGEMENT PAR DÉFAUT — celui d'un Sankey, et l'unique vérité de ce qu'était
 * `_loadSheetSnapshotApplication` avant ce lot.
 *
 * CE QUE L'ESPACE DE TRAVAIL LUI DONNE. Le registre des représentations filtre ses entrées sur
 * l'application du CONTEXTE — `isOfferedToReader` lit `is_static` et les options de publication,
 * les `gate` lisent les licences, les libellés passent par `t`. Sans ces quatre-là, une fenêtre
 * sur une autre feuille proposerait une autre liste de natures que la même fenêtre sur la
 * feuille courante, et l'écrirait sans traduction. Le document naît DANS l'espace de travail,
 * qui les lui donne tous d'un coup : il n'y a rien à recopier.
 *
 * LA MÊME CLASSE QUE L'HÔTE, toujours : `createDocument` passe par `instantiateDocument`,
 * virtuelle, donc c'est l'espace de travail OSP/SA qui construit son propre type de document. En
 * OpenSankey+ le modèle, la persistance (vues, view tags) et le rendu unitaire sont ceux
 * d'`ApplicationDataOSP`, et un document de base relirait de travers un fichier qu'OSP a écrit.
 *
 * `offscreen: true` : cf. `Class_Workspace.detachOffscreen()`, qui explique pourquoi le
 * conteneur se pose sur la FABRIQUE et pas seulement sur la première zone.
 *
 * `draw = false` : ce document n'a pas ENCORE d'écran. Ce sont les représentations qui dessinent,
 * chacune dans le conteneur que son hôte lui donne — et, depuis le lot 3, une fenêtre canevas
 * peut lui donner un vrai cadre et le droit d'éditer.
 *
 * L'IDENTIFIANT est celui de la FEUILLE, pas un tirage au sort (os#1385, lot 2) : son
 * emplacement de cache doit être le même d'un chargement d'instantané au suivant.
 */
export const loadSheetDocumentByDefault = (
  holder: Class_ApplicationData,
  json: Type_JSON,
  id: string
): Class_ApplicationData => {
  const app = holder.workspace.createDocument({
    offscreen: true,
    id: id !== '' ? 'sheet:' + id : undefined
  })
  app.fromJSON(json, {}, false)
  return app
}

/** La sérialisation par défaut : le document, vu comme un contenu de feuille. */
export const serializeSheetDocumentByDefault = (doc: Class_ApplicationData): Type_JSON =>
  doc.toSheetContentJSON()

/**
 * LE TYPE DE BASE — un Sankey, celui que portent toutes les feuilles écrites avant ce chantier.
 *
 * Il ouvre le CANEVAS sur la feuille : c'est la fenêtre historique d'une feuille, celle que le
 * clic d'onglet et « ouvrir dans une nouvelle fenêtre » ouvraient déjà.
 *
 * Pas d'`offers` : un Sankey accepte toutes les représentations, c'est le sujet de référence du
 * registre des représentations. Pas d'`icon` : l'onglet d'une feuille Sankey garde exactement
 * l'aspect qu'il a aujourd'hui.
 */
export const SANKEY_DOCUMENT_TYPE_ENTRY: Type_DocumentType = {
  id: SANKEY_DOCUMENT_TYPE,
  // La clé est posée par la couche éditeur (7 langues) ; `defaultValue` fait que le libellé est
  // juste même quand i18n n'est pas branché (tests, rendu hors écran).
  label: (t: TFunction) => t('sheets.type_sankey', { defaultValue: 'Sankey' }),
  has_canvas: true,
  load: loadSheetDocumentByDefault,
  serialize: serializeSheetDocumentByDefault,
  defaultWindow: () => ({ subject: { kind: 'diagram' }, representation: MAIN_ZONE_CANVAS_ID })
}

/** Registre plat des types de documents. Même patron que `representation_registry`. */
export class Class_DocumentTypeRegistry {
  private _entries: Map<string, Type_DocumentType> = new Map()

  /**
   * LE TYPE SANKEY EST LÀ DÈS LA CONSTRUCTION, et ce n'est pas un doublon de
   * `registerBaseDocumentTypes()` : charger une feuille Sankey ne doit dépendre d'AUCUN appel
   * d'initialisation. `registerBaseRepresentations` est appelée au premier rendu du sélecteur de
   * la barre du haut de l'éditeur — une page publiée, un viewer React ou un test qui ne montent
   * pas cette barre n'y passent jamais, et une feuille qui cesserait de se charger là serait une
   * régression parfaitement silencieuse. `registerBaseDocumentTypes()` reste le point d'accroche
   * documenté, idempotent, à côté de son homologue des représentations.
   */
  constructor() {
    this._entries.set(SANKEY_DOCUMENT_TYPE_ENTRY.id, SANKEY_DOCUMENT_TYPE_ENTRY)
  }

  /** Enregistre (ou remplace, par id) — idempotent, sûr au rechargement à chaud. */
  public register(type: Type_DocumentType): void {
    this._entries.set(type.id, type)
  }

  public unregister(id: string): void {
    this._entries.delete(id)
  }

  /** `undefined` pour un type INCONNU : l'entrée de feuille reste opaque (lot 4). */
  public get(id: string): Type_DocumentType | undefined {
    return this._entries.get(id)
  }

  public has(id: string): boolean {
    return this._entries.has(id)
  }

  /** Tous les types connus, dans l'ordre d'enregistrement. */
  public list(): Type_DocumentType[] {
    return [...this._entries.values()]
  }

  public get size(): number {
    return this._entries.size
  }

  /**
   * LE TYPE D'UNE ENTRÉE DE FEUILLE. Un seul endroit pour appliquer l'équivalence du lot 4
   * (`type` absent = `'sankey'`) — c'est elle qui fait qu'aucun fichier antérieur n'a besoin de
   * migration.
   *
   * `null` pour un type INCONNU de cette version : l'entrée se transporte sans se comprendre
   * (lot 4), et l'appelant le DIT à l'écran plutôt que de l'ouvrir de travers.
   */
  public typeOf(entry: Type_SheetEntry): Type_DocumentType | null {
    return this._entries.get(entry.type ?? SANKEY_DOCUMENT_TYPE) ?? null
  }
}

/** Instance unique partagée par toutes les couches. */
export const document_type_registry = new Class_DocumentTypeRegistry()

/**
 * Les types de documents de BASE. Appelée là où `registerBaseRepresentations()` l'est (barre du
 * haut de l'éditeur) ; idempotente, et sans effet réel puisque le registre pose déjà le type
 * Sankey à sa construction (cf. le constructeur). Elle existe pour que la couche qui ajoute un
 * type ait un endroit évident où le faire, et pour que l'enregistrement de base se relise au
 * même endroit que celui des représentations.
 */
export const registerBaseDocumentTypes = (): void => {
  document_type_registry.register(SANKEY_DOCUMENT_TYPE_ENTRY)
}
