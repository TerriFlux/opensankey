// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// External imports
//import React, { Dispatch, FC, MutableRefObject, SetStateAction, useRef } from 'react'
import LZString from 'lz-string'
import pako from 'pako'
import i18next from 'i18next'
import * as d3 from '../d3Modules'

import FileSaver from 'file-saver'

import { StepType } from '@reactour/tour'
import { Class_GuidedTour } from './GuidedTour'
import { CreateToastFnReturn } from '@chakra-ui/react'

import {
  Class_MenuConfig, URL_MAIN_ZONE_SHORT_NAMES, URL_MAIN_ZONE_LONG_NAMES,
  mainZoneSubjectUsesOwnWindowId, mainZoneSubjectSheet, mainZoneSubjectView, MAIN_ZONE_CANVAS_ID
} from '../types/MenuConfig'
// os#1482 — les tableaux de bord (vue de l'espace de travail) : magasin pur + règles d'identifiants.
import {
  implicitDashboardId, viewIdOfImplicitDashboard, migratedDashboardId, mainZoneWithViewOnCurrentSheet,
  dashboardViewRefs, type Type_Dashboard
} from './Dashboards'
import { const_default_position_x, const_default_position_y, default_file_name, default_main_sankey_id, getStringFromJSON, makeId, Type_DataSource, Type_IntervalDisplay, Type_JSON } from './Utils'
import { PublishOptions } from './PublishOptions'
// os#1385 — L'ESPACE DE TRAVAIL. Import en VALEUR dans les deux sens (Workspace importe cette
// classe pour sa fabrique de documents), mais aucun des deux fichiers n'utilise l'autre au
// PREMIER NIVEAU du module : pas d'`extends`, pas d'appel top-level, seulement des corps de
// méthodes. C'est le cas bénin du cycle ; le cas TDZ est l'héritage (cf. elementInitCycle.test).
import { Class_Workspace, OFFSCREEN_CONTAINER_SELECTOR, Type_Clipboard } from './Workspace'
import { Class_ApplicationHistory } from './ApplicationHistory'
import { ViewsReader } from './ViewsReader'
import { afterViewChange } from './viewSwitchProgress'
import { decodeViewsFromDelta } from './viewDelta'
import type { Type_ViewEntry, Type_ViewLabelDef } from './ViewsQuery'
import { Class_IconLibrary } from '../css/IconLibrairie'
import { Class_DrawingArea } from './DrawingArea'
import type { Type_CanvasFrame } from './DrawingArea'
import { exposeDrawCounters } from './DrawCounters'
import { EXPORT_TOPIC, SAVE_TOPIC } from './EventBus'
import { compressJSONToGzip, decompressUploadedFileUniversal } from '../Persistence/UniversalJSONCompression'
import { parseSankeymaticText } from '../Persistence/sankeymaticParser'
import { loadEsankeyFile } from '../Persistence/esankeyParser'
import { convertForeignObjectsInPlace } from '../Persistence/foreignObjectToSvgText'
import { updateFrom } from '../Algorithms/UpdateFrom'
import { centerChildrenOnParent } from '../Algorithms/Hierarchies'
import { DrawingAreaPersistence } from '../Persistence/SankeyPersistence'
import {
  Type_DocMarkdownMap, serializeDocMarkdown, parseDocMarkdown,
  resolveDocMarkdown, normalizeDocLang
} from '../Persistence/persistenceMigrations'
// Module FEUILLE sans aucun import (cf. legendIds.ts) : sûr à tirer ici, où
// tout autre chemin vers LegendGenerator créerait un cycle à l'initialisation.
import { isLegendElementId } from '../Elements/legendIds'
// os#1385 (lot 5, D9) — LE REGISTRE DES TYPES DE DOCUMENTS. Import en VALEUR dans ce sens-là
// SEULEMENT : le registre, lui, ne prend d'ici que des TYPES (effacés à la compilation), donc
// aucun cycle à l'exécution.
import { document_type_registry, SANKEY_DOCUMENT_TYPE } from './DocumentTypeRegistry'
import type { Type_DocumentType } from './DocumentTypeRegistry'

// SPECIFIC TYPES **********************************************************************/

/**
 * Lit un paramètre d'URL contenant un dict `{ groupe : tag }` sérialisé en JSON
 * (cf. `Class_ApplicationData.getUrlStateParams`). `null` si absent ou malformé — un
 * paramètre d'URL est une entrée non fiable, on ne casse pas le chargement pour autant.
 */
const parseJSONRecordParam = (raw: string | null, name: string): { [k: string]: string } | null => {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as { [k: string]: string }
  } catch {
    // eslint-disable-next-line no-console
    console.warn(`[OpenSankey] paramètre d'URL ${name} : JSON invalide « ${raw} »`)
    return null
  }
}

export type Type_TextForToastPromise = {
  success?: {
    title?: string,
    desc?: string
  }
  error?: {
    title?: string,
    desc?: string
  },
  loading?: {
    title?: string,
    desc?: string
  }
}

export type MenuColorPickerProps = {
  initialColor: string;
  functionOnBlur: (x: string) => void;
  isDisabled?: boolean,
  textDisabled?: string
}

// sa#563 (lot 5) — `Type_ElementAnalysis` A DISPARU, et c'etait le contrat du CHEMIN PARALLELE.
//
// Il decrivait les « analyses d'un element » de la colonne droite de la pop-up de presentation
// (Unit. / Couronne / Barres) : un bouton, un libelle, et un `render(container) => cleanup` jete
// dans un `div` de 260 px. Or ces trois dessins sont des entrees du REGISTRE DES REPRESENTATIONS
// depuis os#1473 et os#1422 — la colonne les redemandait donc une seconde fois, sous un autre
// contrat, a un autre hote, avec d'autres reglages. Elles sont desormais des natures du volet
// qu'un clic sur l'element ouvre, et ce contrat-ci n'a plus d'appelant.
//
// Ne pas le rouvrir : un dessin d'element est une entree de `representation_registry`, et rien
// d'autre. C'est la lecon du lot — tant que deux chemins coexistent, les reglages d'une meme
// nature divergent entre les deux places.

/**
 * sa#456 — PAGE PUBLIÉE d'où vient le diagramme affiché, quand il a été ouvert par
 * `?url=` sur une adresse du parc que le serveur a reconnue.
 *
 * C'est l'autre visage d'une provenance : `Type_SankeythequeOrigin` désignait un
 * fichier du DÉPÔT source, elle ne savait pas dire « la page <slug>/<feuille> du
 * parc, fichier X.json.gz ». `data_file` est le nom que le MANIFESTE de publication
 * déclare pour cette adresse (jamais celui de l'URL, le parc servant `X.json.gz`,
 * `X.json`, `X.gz` et jusqu'à `X` tout court) : c'est lui, et lui seul, que la mise
 * à jour remplace — une page multi-diagrammes voit corriger celui qu'on a ouvert.
 *
 * `kind` dit la NATURE de la source du portfolio, donc celle du geste de mise à
 * jour : 'mfadata' (le portfolio vient d'un dépôt : commit + page, geste
 * historique) ou 'workbook' (il est rendu depuis un classeur : brique de
 * bibliothèque + page, cf. server/publish_provenance.py).
 */
export type Type_PublicationOrigin = {
  page_url: string
  slug: string
  leaf: string
  data_file: string
  /** 'mfadata' (portfolio issu d'un dépôt) ou 'workbook' (rendu depuis un classeur). */
  kind: string
}

/**
 * Provenance d'un diagramme ouvert depuis une galerie réenregistrable : chemin du
 * modèle dans l'index, relatif à la racine de sa source, et nom affiché.
 * `source` désigne la galerie donc le dépôt écrit — 'mfadata' = la sankeythèque
 * (études), 'sankeydata' = les modèles. Le couple (source, chemin) est le seul
 * qui compte côté serveur : le chemin doit être exactement celui de l'index de
 * cette source, lequel fait liste blanche d'écriture.
 *
 * sa#456 — `file_path` peut être VIDE : une page publiée dont la source n'est pas
 * un fichier de dépôt (portfolio rendu depuis un classeur, ou étude absente de
 * l'index curaté) a bien une provenance, mais rien à réenregistrer dans un dépôt.
 * Le volet dépôt du dialogue se ferme alors, et `source` n'est pas consulté ;
 * `publication.kind` porte la vérité de ce qui met la page à jour.
 */
export type Type_SankeythequeOrigin = {
  file_path: string
  title: string
  source: 'mfadata' | 'sankeydata'
  publication?: Type_PublicationOrigin
}

/**
 * OS#85 — Une FEUILLE du document : un AUTRE diagramme, indépendant, dans le même
 * fichier (règle des deux niveaux, cf. NOTE-CONSTRUCTEUR-DE-SITE.md §6) : une VUE
 * suit les données de son diagramme (heredited_attr), une FEUILLE porte d'autres
 * données et vit sa vie. Mécanisme FRÈRE des vues mais au niveau DOCUMENT.
 */
export type Type_SheetEntry = {
  /** Nom affiché dans l'onglet (bas de la grande zone). */
  name: string
  /**
   * os#1385 (lot 4, D8) — TYPE du document que porte la feuille. ABSENT vaut
   * `'sankey'` : tout fichier écrit avant ce champ se relit à l'identique, et tout
   * fichier qui n'a que des feuilles Sankey se réécrit sans gagner une seule clé.
   *
   * Un type INCONNU se conserve tel quel, sans jamais être chargé : le registre des
   * types arrive au lot 5, et d'ici là une feuille d'un autre type est une entrée
   * OPAQUE (`{ name, type, json }`) qu'on transporte sans la comprendre — la perdre à
   * la première sauvegarde serait bien pire que ne pas savoir l'afficher.
   */
  type?: string
  /**
   * Snapshot gzip du diagramme complet de la feuille (JSON du document SANS la clé
   * racine `sheets` — cf. `toSheetContentJSON`). `undefined` pour la feuille
   * COURANTE quand elle porte un Sankey : son contenu est l'état vivant
   * (drawing_area + vues), rafraîchi ici à chaque bascule / sauvegarde.
   *
   * os#1385 (lot 4, D8) — RÈGLE DE LA RACINE, transitoire : « la racine du fichier
   * porte toujours un Sankey, le courant s'il en est un, sinon le dernier Sankey
   * actif ». Une feuille courante d'un AUTRE type garde donc son `json` à elle, la
   * racine restant lisible par tous les lecteurs qui supposent un Sankey (viewer,
   * parc publié, serveur, SEP, cartofob).
   */
  json?: Uint8Array
}

/**
 * os#1385 (lot 4, D8) — le type d'une feuille qui porte un diagramme Sankey.
 *
 * os#1385 (lot 5, D9) — UNE SEULE ÉCRITURE DE LA CHAÎNE, désormais celle du registre des types
 * (`SANKEY_DOCUMENT_TYPE`) : deux constantes indépendantes portant le même identifiant de format
 * finiraient par diverger. Ce nom-ci reste exporté parce qu'il est celui que lit le code du
 * format (lot 4) et ses tests.
 */
export const SHEET_TYPE_SANKEY = SANKEY_DOCUMENT_TYPE

/**
 * os#1385 (lot 4, D8) — « cette feuille porte-t-elle un Sankey ? ». Dit à un seul
 * endroit que l'ABSENCE de type vaut `'sankey'` : c'est cette équivalence qui fait
 * qu'aucun fichier antérieur n'a besoin de migration.
 */
export const isSankeySheetType = (type?: string): boolean =>
  type === undefined || type === SHEET_TYPE_SANKEY

/**
 * os#1385 (lot 4, D8) — L'ÉTAT DE L'ESPACE DE TRAVAIL, LU DEPUIS UN FICHIER.
 *
 * `language` et `panels` ne décrivent pas le diagramme : ce sont des préférences
 * d'INTERFACE, partagées par tous les documents ouverts (inventaire 4 §1.2, « trois
 * clés d'hôte rangées dans le document »). Elles vivent désormais sous la clé racine
 * `workspace`, écrite par le document PRINCIPAL seulement.
 *
 * REPLI SUR LA RACINE, dit ici UNE fois pour les deux `_fromJSON` (OS et OS+) : un
 * fichier antérieur porte `language` et `panels` à la racine et doit se relire tel
 * quel — aucune migration, aucun incrément de `format_version`.
 */
export const workspaceStateFromJSON = (
  json_object: Type_JSON
): { language?: string, panels?: Type_JSON } => {
  const raw = json_object['workspace']
  const workspace = (raw && typeof raw === 'object' && !Array.isArray(raw))
    ? raw as Type_JSON
    : undefined
  const state: { language?: string, panels?: Type_JSON } = {}
  const language = workspace?.['language'] ?? json_object['language']
  if (typeof language === 'string' && language !== '') state.language = language
  const panels = workspace?.['panels'] ?? json_object['panels']
  if (panels && typeof panels === 'object' && !Array.isArray(panels)) state.panels = panels as Type_JSON
  return state
}

/**
 * Association du document ouvert à sa BRIQUE de bibliothèque (sa#399) : id du
 * projet côté serveur (server/library.py) et chemin du fichier dans le manifeste
 * des versions. PERSISTÉE dans le JSON du diagramme (clé racine `library_ref`)
 * pour survivre au fichier : rouvrir le JSON ré-associe le document à sa brique,
 * et « enregistrer dans ma bibliothèque » y dépose la version suivante au lieu
 * d'en créer une nouvelle. Un fichier SANS cette clé = nouvelle brique.
 */
export type Type_LibraryRef = {
  project_id: number
  path: string
}

/** Relecture défensive de la clé racine `library_ref` : absente ou malformée => null. */
export const parseLibraryRef = (value: unknown): Type_LibraryRef | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const ref = value as { project_id?: unknown, path?: unknown }
  if (typeof ref.project_id !== 'number' || typeof ref.path !== 'string' || !ref.path) return null
  return { project_id: ref.project_id, path: ref.path }
}

// CLASS APPLICATION DATA **************************************************************/

/**
 * Class that contains all elements to make the application work
 *
 * @class Class_ApplicationData
 */
export class Class_ApplicationData {

  // Per-side SVG-space padding applied around the diagram in raster/PDF/SVG exports
  // to absorb stroke-widths and font ascenders that getBBox doesn't include.
  public static readonly export_edge_padding: number = 5

  /**
   * os#1385 — L'ESPACE DE TRAVAIL qui porte ce document. Posé par le constructeur AVANT
   * `createNewDrawingArea()` : la zone de dessin lit `is_static`, qui vient de lui.
   * Déclaré sans initialiseur (`!`) pour cette raison — un initialiseur tournerait avant le
   * corps du constructeur et écraserait ce que celui-ci vient de poser.
   */
  protected _workspace!: Class_Workspace
  public get workspace(): Class_Workspace { return this._workspace }

  /**
   * Ce document est-il LE document principal de son espace de travail ?
   *
   * Seul le principal écrit la disposition de l'hôte (panneaux), la langue de l'interface et
   * repeint les menus. Un document secondaire (instantané de feuille, source Excel, brique
   * extraite) n'avait jusqu'ici qu'une configuration de menus ORPHELINE : les gardes posées
   * sur cette propriété reproduisent ce comportement, maintenant que la configuration est
   * partagée avec l'hôte.
   */
  public get is_main(): boolean { return this.workspace.main === this }

  /**
   * os#1385 (lot 2) — L'IDENTITÉ du document dans son espace de travail.
   *
   * Vide tant que le document n'est enregistré nulle part (le temps d'un constructeur), puis
   * posé une fois pour toutes par `Class_Workspace.registerDocument`. Il nomme l'emplacement de
   * cache du document (`cache_key`) : c'est son seul lecteur au lot 2, et c'est ce qui permet à
   * deux documents ouverts d'écrire Ctrl+S sans s'écraser l'un l'autre.
   */
  protected _document_id: string = ''
  public get document_id(): string { return this._document_id }

  /**
   * Posé par l'espace de travail à l'enregistrement, jamais par le document lui-même — c'est
   * l'espace qui sait ce qui est unique en son sein. Sans effet si le document en a déjà un :
   * un identifiant ne change pas en cours de vie, le cache qu'il nomme deviendrait orphelin.
   */
  public assignDocumentId(id?: string): void {
    if (this._document_id !== '') return
    this._document_id = (id !== undefined && id !== '') ? id : makeId('doc')
  }

  /**
   * os#1385 (lot 2) — L'EMPLACEMENT DE CACHE de ce document dans le stockage local.
   *
   * Le principal garde `'data'`, mot pour mot : c'est la clé que lit la reprise de session
   * (`App.tsx`), celle qu'écrivent toutes les versions publiées, et la casser rendrait
   * inaccessible le travail en cours de tous les utilisateurs au premier déploiement. Les autres
   * documents écrivent à côté, sous `data:<identifiant>` — l'index qui permettra de les rouvrir
   * est le lot 3 ; au lot 2 ils sont écrits sans être relus, ce qui est déjà mieux que de voir
   * un document secondaire écraser le travail du principal.
   */
  protected get cache_key(): string {
    return this.is_main ? 'data' : 'data:' + this._document_id
  }

  /**
   * Options de la page publiée : lues UNE fois par espace de travail (`window.sankey`), donc
   * communes à tous ses documents. L'objet doit rester le MÊME à chaque lecture : les viewers
   * React mutent ses champs.
   */
  public get publish_options(): PublishOptions { return this.workspace.publish_options }

  // Licences : l'espace de travail porte la licence BRUTE du compte, le document y ajoute
  // `is_static` — c'est lui qui sait s'il est affiché dans une page publiée.
  public get has_sankey_dev() { return this.workspace.has_sankey_dev }
  public set has_sankey_dev(_) { this.workspace.has_sankey_dev = _ }
  public get has_sankey_plus() { return this.workspace.has_sankey_plus || this.is_static }
  public set has_sankey_plus(_) { this.workspace.has_sankey_plus = _ }
  public get has_sankey_afm() { return this.workspace.has_sankey_afm || this.is_static }
  public set has_sankey_afm(_) { this.workspace.has_sankey_afm = _ }

  /**
   * Libellé de l'édition active, affiché en pastille à droite du logo de la barre
   * du haut — le wordmark seul ne dit pas quelle édition tourne. Null = rien à
   * afficher (OpenSankey libre : le logo suffit). Surchargé en OpenSankey+.
   */
  public get edition_badge(): string | null { return null }

  /** True hors mode publish, ou en publish si l'option `editable` est activée. */
  public get is_editable(): boolean { return !this.is_static || this.publish_options.editable }

  /**
   * os#1385 (lot 3, D4) — LE DROIT D'ÉDITION DE CE DOCUMENT-CI.
   *
   * `is_editable` dit ce que la PAGE permet (éditeur, ou page publiée avec l'option
   * `editable`) : c'est une propriété de l'espace de travail, la même pour tous ses documents.
   * Ce drapeau-ci dit ce que CE document permet, et c'est une notion distincte : deux documents
   * ouverts côte à côte dans la même page n'ont aucune raison d'être modifiables tous les deux
   * au même instant.
   *
   * Vrai par défaut — un document qu'on ouvre, on l'édite. Faux pour un document créé HORS
   * ÉCRAN (cf. `Class_Workspace.createDocument`), qui n'a personne devant lui. La phase B le
   * repasse à vrai quand elle donne un cadre à la feuille, et à faux quand elle le lui retire.
   *
   * Ce qui compte est ce qu'on ne lit PLUS : la PLACE à l'écran ne décide plus du droit
   * d'éditer (`DrawingArea.is_detached` ne parle que de géométrie, cf. D4). Un document peut
   * être affiché hors du conteneur principal et modifiable ; un autre peut être dans le
   * conteneur principal et en lecture seule.
   */
  protected _edition_allowed: boolean = true
  public get edition_allowed(): boolean { return this._edition_allowed }
  public set edition_allowed(_: boolean) { this._edition_allowed = _ }

  /**
   * os#1385 (lot 3, D4) — CE DOCUMENT EST-IL MODIFIABLE, MAINTENANT ? Droit de la PAGE ×
   * droit du DOCUMENT. C'est ce que lit `Class_DrawingArea.editable`, qui y ajoute la seule
   * question qui reste de son ressort : « suis-je la zone VIVANTE de ce document ? » (une zone
   * fabriquée à côté — board unitaire, source de mise en page, vue extraite en coulisse — ne
   * s'édite pas, quel que soit le droit du document).
   */
  public get editable(): boolean { return this.is_editable && this._edition_allowed }

  /**
   * os#1385 (lot 3, D6) — LE DOCUMENT QUI PORTE LE FICHIER DONT CELUI-CI EST UNE FEUILLE.
   *
   * Posé par `sheetApplication` sur le document de feuille, null partout ailleurs (un document
   * ouvert depuis un fichier est son propre porteur). Il n'a qu'un rôle, mais il est central :
   * ENREGISTRER DEPUIS LA FEUILLE B ENREGISTRE LE FICHIER, dont B fait partie (cf. `saveInCache`
   * et `saveToJSON`). Une feuille n'est pas un fichier.
   */
  protected _file_holder: Class_ApplicationData | null = null
  public get file_holder(): Class_ApplicationData | null { return this._file_holder }
  public set file_holder(_: Class_ApplicationData | null) { this._file_holder = _ }

  /**
   * os#1385 (lot 3, D6) — CE DOCUMENT A CESSÉ DE VIVRE (cf. `dispose()`).
   *
   * Un document disposé n'est plus la vérité de quoi que ce soit : `sheetsToJSON` ne le
   * sérialise pas, l'espace de travail l'a oublié, et sa zone de dessin est démontée. Le
   * drapeau existe pour que les détenteurs d'une référence tardive — une fenêtre en cours de
   * fermeture, un effet React qui se dénoue — puissent le constater sans jeter.
   */
  protected _disposed: boolean = false
  public get disposed(): boolean { return this._disposed }

  /**
   * os#1385 (lot 3, D6) — FAIRE CESSER DE VIVRE CE DOCUMENT : il n'est plus affiché, plus
   * joignable, et ce qu'il portait a déjà été remis en instantané par l'appelant s'il y avait
   * lieu (cf. `releaseSheetDocument`).
   *
   * IDEMPOTENT, et ce n'est pas une politesse : les trois chemins qui en appellent — la
   * bascule d'onglet vers la feuille, la suppression de la feuille, le chargement d'un autre
   * fichier — peuvent se croiser sur la même feuille.
   *
   * LE DOCUMENT PRINCIPAL NE SE DISPOSE PAS : il est l'application elle-même, sa zone de
   * dessin est celle de l'écran, et la démonter reviendrait à effacer le diagramme de
   * l'utilisateur. On refuse plutôt que de faire confiance à l'appelant.
   */
  public dispose(): void {
    if (this._disposed || this.is_main) return
    this._disposed = true
    // La zone de dessin d'abord : `unDraw` retire son SVG du conteneur (vide, pour un
    // document hors écran — d3 travaille alors sur une sélection vide, cf. `detachOffscreen`),
    // `delete` purge la sélection, le lien fantôme et les éléments contextualisés, c'est-à-dire
    // les références croisées qui retiendraient tout le modèle en mémoire.
    this._drawing_area?.unDraw()
    this._drawing_area?.delete()
    // Un historique neuf : chaque entrée est une FERMETURE qui capture des nœuds, des flux et
    // une zone de dessin morts. Les garder ne servirait qu'à les empêcher d'être collectés.
    if (this._menu_configuration) this._history = new Class_ApplicationHistory(this._menu_configuration)
    // Plus d'écran, donc plus de droit d'édition : une référence tardive (un effet React qui
    // se dénoue, une fenêtre en cours de fermeture) ne doit pas écrire dans un modèle mort.
    // `_file_holder` est GARDÉ : un « Enregistrer » parti juste avant doit encore savoir
    // quel fichier il visait.
    this._edition_allowed = false
    this.workspace.forgetDocument(this)
  }

  /**
   * os#1365 — ARBITRE UNIQUE entre les deux sélecteurs de la topbar : la navigation entre
   * vues (BannerViewNavOSP) rend le sélecteur quand ce drapeau est vrai, le sélecteur de
   * view tags (BannerViewTagTopbar) quand il est faux. Les deux bannières lisent CETTE
   * propriété et elle seule : conditions complémentaires, donc jamais deux sélecteurs à
   * l'écran, jamais zéro.
   *
   * Le critère est la PRÉSENCE DE VUES, pas la licence. Dès qu'un view tag a engendré des
   * vues (préfixe `vt__<groupe>__<tag>`), ce sont les vues qui pilotent — une seule source
   * de vérité. Sans vues, le sélecteur de view tags reste : c'est la seule UI du diagramme,
   * le retirer le rendrait inutilisable.
   *
   * La version précédente valait `has_sankey_plus` en OpenSankey+, ce qui divergeait de la
   * garde `has_views` de BannerViewNavOSP et produisait DEUX défauts symétriques :
   *   - éditeur, vues présentes sans licence plus → les DEUX sélecteurs (le doublon CARTOFOB) ;
   *   - viewer d'une publication, où `has_sankey_plus` est vrai par `is_static` : sans vues,
   *     AUCUN sélecteur, le diagramme publié perdait sa seule UI de filtrage.
   *
   * Le mécanisme de visibilité, lui, reste en OS (Sankey.view_taggs / Node) : c'est ici une
   * question d'AFFICHAGE.
   */
  public get views_replace_viewtag_topbar(): boolean { return this.has_views }

  /**
   * sa#283 — Vues contextuelles : slot OPTIONNEL enregistré par la couche OSP (pattern
   * d'enregistrement, AUCUN import runtime OS → OSP — piège TDZ Element→Handler). Appelé
   * par les méthodes de sélection des groupes de tags (TagGroup.selectTagsFromId /
   * selectTagsFromIds, Tag.toogleSelected) juste APRÈS le basculement des tags et AVANT
   * le redraw, pour que l'overlay d'attributs contextuels parte dans le dessin. Null en
   * OS base : la feature vit entièrement en OpenSankey+.
   */
  public after_tag_selection_change: (() => void) | null = null

  // os#1372 — `applyPublishStateOptions` a-t-il déjà tourné ? Les viewers React le rappellent à
  // chaque changement de prop de sélection ; seules ces RÉ-applications sautent une sélection déjà
  // posée (cf. applyTagSelections, paramètre `only_if_changed`). La première passe est intacte.
  protected _publish_state_applied_once = false

  /**
   * os#1372 — Compteur de dessins COMPLETS, incrémenté par `Class_DrawingArea.draw()`.
   *
   * Sert à savoir si un geste a DÉJÀ redessiné avant d'en déclencher un de plus. Mesuré sur
   * CARTOFOB : une bascule de dataTag enchaînait DEUX dessins complets (celui de
   * `selectTagsFromId` → `updateTagsReferences`, puis celui de fin d'`applyPublishStateOptions`)
   * et une bascule de vue heavy QUATRE. Supprimer le seul dessin redondant du chemin dataTag
   * ramène le geste de 1 564 ms à 878 ms (A/B alterné, médianes sur 4 tours).
   *
   * Vit sur l'application et non sur la zone de dessin : celle-ci est REMPLACÉE en cours de
   * geste sur le chemin heavy (`extractViewFromJSON` → `replaceDrawingArea`), un compteur porté
   * par elle repartirait donc de zéro au milieu du geste.
   */
  protected _draw_epoch = 0
  public get draw_epoch(): number { return this._draw_epoch }
  /** Appelé par `Class_DrawingArea.draw()` — ne pas appeler ailleurs. */
  public notifyFullDraw(): void { this._draw_epoch++ }

  /**
   * os#1372 — Époque de référence posée par un SURCHARGEUR d'`applyPublishStateOptions` avant
   * son propre travail (OSP ouvre la vue demandée AVANT d'appeler `super`). Sans elle, la garde
   * du dessin final ne verrait pas le dessin déclenché par cette ouverture et en ajouterait un
   * second. Consommée par la méthode de base au premier usage.
   */
  protected _publish_apply_epoch: number | null = null
  /** À appeler en tête d'une surcharge d'`applyPublishStateOptions`, avant tout dessin. */
  protected markPublishApplyStart(): void { this._publish_apply_epoch = this._draw_epoch }

  /**
   * os#1377 — Vrai pendant la lecture d'un fichier qui se terminera par un dessin complet
   * (`fromJSON(..., draw = true)`). Ce que la lecture dessine d'elle-même serait alors refait
   * à l'identique : `ViewsReader.viewsFromJSON` s'en abstient, ce qui économise une passe
   * ENTIÈRE au chargement — 70 dessins de flux sur 211 pour CARTOFOB, sur la géométrie de la
   * vue enregistrée que les options de publication remplacent aussitôt après.
   *
   * Faux hors chargement et pour un `fromJSON(..., draw = false)` (réconciliation, tests de
   * corpus) : là, le dessin de la lecture est le seul, et rien ne change.
   */
  protected _from_json_will_draw = false
  public get from_json_will_draw(): boolean { return this._from_json_will_draw }

  /**
   * os#1359 — un mot bref, non bloquant, sur une conséquence que la saisie ne montre pas
   * d'elle-même. Délégué à l'espace de travail : une seule file de messages à l'écran,
   * quel que soit le document qui parle.
   */
  public notifyUser(
    id: string,
    title: string,
    description?: string,
    status: 'info' | 'warning' = 'info',
    once: boolean = false
  ): void {
    this.workspace.notifyUser(id, title, description, status, once)
  }

  /**
   * (Re)crée la configuration de menus DU DOCUMENT, adossée à celle de l'HÔTE.
   *
   * Appelée au montage par `useMenuConfiguration` : c'est ce qu'elle demandait — une
   * configuration neuve pour le document, avec le toast Chakra acquis dans le rendu. Celle de
   * l'hôte, elle, ne bouge pas : les composants d'interface s'y abonnent une fois pour toutes.
   */
  public createNewMenuConfiguration(toast: CreateToastFnReturn | null = null): Class_MenuConfig {
    this.workspace.toast = toast
    this._menu_configuration = new Class_MenuConfig(this.workspace.menu_configuration)
    this._history = new Class_ApplicationHistory(this._menu_configuration)
    return this._menu_configuration
  }

  /**
   * Fait de ce document un document HORS ÉCRAN, définitivement.
   *
   * LE CONTENEUR EST POSÉ SUR LA FABRIQUE, ET PAS SEULEMENT SUR LA PREMIÈRE ZONE. Poser
   * `container_selector` sur `drawing_area` avant `fromJSON` ne suffirait PAS, et pas
   * seulement parce que `reset()` remplace la zone par une neuve : le chargement en crée
   * d'autres en chemin — une par vue lourde extraite (`ViewsReader.extractViewFromJSON`,
   * `ViewsManager`), une pour la source de mise en page — et l'une d'elles DESSINE. Le cas
   * n'a rien de théorique : quand l'instantané a été enregistré sur une vue autre que le
   * maître, `ViewsReader.viewsFromJSON` appelle `drawing_area.draw()` de sa propre autorité,
   * précisément parce qu'on charge avec `draw = false` et que personne d'autre ne dessinera
   * (os#1377). Et `draw()` remet `bypass_redraws` à `false` en entrant : ce drapeau ne
   * protège de rien. Une seule ligne de défense tient donc : que TOUTE zone de dessin de ce
   * document naisse hors écran, d'où l'enveloppe posée ici sur sa fabrique. Un dessin sur un
   * conteneur introuvable est inoffensif — d3 travaille alors sur une sélection vide — là où
   * un dessin sur `'#sankey_app'` effacerait le diagramme de l'utilisateur.
   *
   * L'enveloppe est posée sur l'INSTANCE, et c'est voulu : `createNewDrawingArea` est
   * surchargée par OpenSankey+ (elle construit une `Class_DrawingAreaOSP`), et envelopper la
   * méthode telle que la sous-classe la fournit garde ce dispatch intact. Elle n'empêche
   * personne de repointer ensuite une zone vers un vrai conteneur — c'est ce que fait le
   * board unitaire pour sa vignette, juste après l'avoir demandée.
   */
  public detachOffscreen(): void {
    this.showIn(OFFSCREEN_CONTAINER_SELECTOR, null)
  }

  /**
   * os#1385 — LE LIEU D'ACCUEIL EST UNE PROPRIÉTÉ DU DOCUMENT, PAS DE SA ZONE DE DESSIN.
   *
   * `detachOffscreen` posait son sélecteur sur la FABRIQUE de zones, pour la raison expliquée
   * ci-dessus : le chargement en crée d'autres en chemin, et l'une d'elles dessine. La même
   * raison vaut, en sens inverse, pour un document qu'on MONTRE quelque part — le canevas d'une
   * feuille ouvert dans une fenêtre de navigateur, sur un second écran. Sa zone est remplacée à
   * chaque `resetDocument()` et à chaque bascule de vue : la neuve naissait avec le conteneur
   * hors écran de son document, et la fenêtre se vidait au premier changement de vue, sans un
   * mot. Le lieu d'accueil vit donc ici, une fois pour toutes, et la fabrique le réapplique.
   *
   * `owner_document` est le document DOM qui héberge le conteneur : celui de la page pour une
   * case de la grande zone (`null`), celui de la fenêtre fille pour un canevas détaché. C'est
   * lui qui décide où la zone cherche son conteneur, mesure, et construit son SVG.
   */
  public showIn(container_selector: string, owner_document: Document | null): void {
    this._container_selector = container_selector
    this._container_owner_document = owner_document
    if (!this._wrapped_drawing_area_factory) {
      const create_drawing_area = this.createNewDrawingArea.bind(this)
      this.createNewDrawingArea = (id?: string): Class_DrawingArea => {
        const drawing_area = create_drawing_area(id)
        this._applyContainer(drawing_area)
        return drawing_area
      }
      this._wrapped_drawing_area_factory = true
    }
    this._applyContainer(this._drawing_area)
  }

  /** Le lieu d'accueil du document, reporté sur une zone (la sienne, ou une neuve). */
  protected _applyContainer(drawing_area: Class_DrawingArea): void {
    if (this._container_selector === null) return
    drawing_area.container_selector = this._container_selector
    drawing_area.container_owner_document = this._container_owner_document
  }

  /** Sélecteur du conteneur où ce document se montre ; `null` = la zone décide (défaut). */
  protected _container_selector: string | null = null
  protected _container_owner_document: Document | null = null
  private _wrapped_drawing_area_factory = false
  public get container_selector(): string | null { return this._container_selector }
  public get container_owner_document(): Document | null { return this._container_owner_document }

  public createNewDrawingArea(id?: string): Class_DrawingArea {
    const drawing_area = new Class_DrawingArea(
      this,
      id
    )
    return drawing_area
  }

  /** Load a drawing area from JSON. Override in subclasses to use a subclass-specific persistence layer. */
  public loadDrawingAreaFromJSON(drawing_area: Class_DrawingArea, json_object: Type_JSON): void {
    DrawingAreaPersistence.fromJSON(drawing_area, json_object)
  }

  /** Replace the current drawing_area with a freshly-built one.
   * Unmounts the previous DA's DOM (if attached) and swaps the internal
   * reference. Callers keep using `app_data.drawing_area` (getter) so no
   * downstream binding needs updating. */
  public replaceDrawingArea(new_drawing_area: Class_DrawingArea): void {
    if (this._drawing_area?.d3_selection_zoom_area != null) {
      this._drawing_area.unDraw()
    }
    this._drawing_area = new_drawing_area
  }

  public createNewIconLibrary(): Class_IconLibrary {
    return new Class_IconLibrary()
  }

  // App
  public version: string = '1.3.5'
  public fit_screen: boolean
  public static_path: string = 'static/opensankey'

  /** Options d'instanciation de l'application : de l'espace de travail (`no_key_event`…). */
  public get options(): { [_: string]: boolean | string } { return this.workspace.options }

  // Attributes to transfer between sankeys — réglage de session partagé par deux dialogues,
  // donc de l'espace de travail. Le tableau est muté EN PLACE par ses lecteurs : l'accesseur
  // doit rendre le même objet à chaque lecture, ce que garantit la délégation.
  public get data_var_to_update(): string[] { return this.workspace.data_var_to_update }
  public set data_var_to_update(_: string[]) { this.workspace.data_var_to_update = _ }

  // Crochets injectés par OS+ sur l'application : ils vivent dans l'espace de travail, donc
  // TOUS les documents en héritent — y compris ceux qu'une fenêtre ouvre sur une autre feuille.
  /** Called after applying a layout from an external source.
   * tmp_DA is the already-converted source DrawingArea.
   * json is the raw source file JSON (null for view sources).
   * mode overrides data_var_to_update when provided (e.g. when called from App.tsx with all attrs). */
  public get post_apply_layout_callback() { return this.workspace.post_apply_layout_callback }
  public set post_apply_layout_callback(_) { this.workspace.post_apply_layout_callback = _ }

  /** Hook injecté par OS+ : dessine le nœud EN CAMEMBERT (surface on_node, OS#1278)
   * dans le groupe SVG `group_el` du nœud, aux dimensions passées. Utilisé par
   * NodeDrawShape quand le descripteur du nœud a surfaces.on_node. Couleurs du
   * diagramme (le graphique fait partie du langage visuel). Absent hors OS+.
   *
   * os#1421 — `figure_options` : le sac EFFECTIF de la FIGURE posée sur le nœud (placement,
   * cf. Representations/Placement), quand il y en a une : descripteur, étiquette de données
   * épinglée… Le hook dessine alors CETTE figure — un lien vers la fenêtre où on l'a réglée —
   * et non une couronne recalculée depuis l'attribut du nœud. Absent = chemin hérité
   * `surfaces.on_node`, qui relit `analysis_descriptor` sur le nœud.
   * os#1385 — le crochet vit dans l'espace de travail (sa signature est dans `Class_Workspace`). */
  public get draw_node_analysis_overlay() { return this.workspace.draw_node_analysis_overlay }
  public set draw_node_analysis_overlay(_) { this.workspace.draw_node_analysis_overlay = _ }

  protected _waiting_processes: { [id: string]: NodeJS.Timeout } = {}
  protected _waiting_time_for_processes: number = 50 // ms


  // PROTECTED ATTRIBUTES ==============================================================

  protected _file_name = default_file_name

  // Viewer statique (publish) : nom/URL du fichier .gz réellement chargé (diagramme
  // initial de window.sankey.diagram ou sélection du dropdown multi-diagrammes).
  // Nécessaire au bouton « Éditer dans OpenSankey » : _file_name ne convient pas,
  // fromJSON l'écrase avec le `name_file` interne du JSON (nom d'affichage, pas le
  // fichier servi). Non persisté.
  protected _static_diagram_file: string | null = null

  // Modèle de galerie (sankeythèque MFAData ou modèles SankeyData) dont vient le
  // diagramme affiché, quand il a été ouvert depuis la galerie. Sert au
  // réenregistrement en place réservé aux développeurs (voir MFADataSaveModal /
  // route serveur menus_templates_save).
  // NON persisté : c'est une provenance de session, pas une propriété du diagramme —
  // un JSON téléchargé puis rouvert ne doit surtout pas se croire réenregistrable.
  // Effacé par reset(), donc par tout chargement (fromJSON) ou nouveau diagramme.
  protected _sankeytheque_origin: Type_SankeythequeOrigin | null = null

  // Documentation markdown libre attachée au diagramme (onglet « Doc »), persistée en JSON.
  // Stockée par langue { fr, en, ... } : un même diagramme peut embarquer la doc
  // traduite (cf. tutoriels multilingues). Le getter/setter public expose une
  // string résolue pour la langue active (repli en→fr). Voir persistenceMigrations.
  protected _documentation_markdown: Type_DocMarkdownMap = {}
  // Pièces jointes images de la doc : map id -> data-URI base64. Référencées dans le markdown par
  // `img://<id>` (garde l'éditeur lisible) ; persistées en JSON avec le diagramme (autonome).
  protected _documentation_images: { [id: string]: string } = {}
  // Derniers paramètres du dialogue « Publier le site (zip) » choisis pour ce diagramme (flags
  // d'affichage du viewer, mode de position, en-tête, nom de publication, logo en data-URI).
  // Persistés en JSON pour qu'une re-publication / mise à jour reparte exactement des mêmes réglages.
  // /!\ Distinct de `publish_options` (config viewer runtime read-only issue de window.sankey).
  protected _publish_settings: Type_JSON = {}
  // sa#399 — Brique de bibliothèque associée au document ouvert. PERSISTÉE en JSON
  // (contrairement à _sankeytheque_origin, provenance de session) : la référence est une
  // propriété du diagramme, elle voyage avec le fichier. Null = document jamais déposé,
  // « enregistrer dans ma bibliothèque » créera un projet (nouvelle brique).
  protected _library_ref: Type_LibraryRef | null = null


  /**
   * Drawing area
   *
   * @protected
   * @type {Class_DrawingArea}
   * @memberof Class_ApplicationData
   */
  protected _drawing_area: Class_DrawingArea

  // ==========================================================================================
  // ÉTAT DE VUES (#1316 — viewer intégral)
  // ------------------------------------------------------------------------------------------
  // L'état LECTURE des vues vit désormais en OpenSankey pour que la couche viewer sache
  // restituer un fichier multi-vues. La création/édition des vues (heredited_attr, snapshot
  // « original », dialogues de sauvegarde) reste en OpenSankey+ (Class_ApplicationDataOSP), qui
  // hérite de ces champs. Voir ViewsReader (lecture) / ViewsManager OSP (édition).
  // ==========================================================================================

  /** DA du Sankey MAÎTRE (référence de mise en page) quand le fichier porte des vues. */
  protected _master_drawing_area: Class_DrawingArea | undefined
  public get master_drawing_area() { return this._master_drawing_area }
  public set master_drawing_area(master) { this._master_drawing_area = master }

  /** Vues enregistrées, indexées par id : snapshot gzip + concept unifié vue ⊕ viewtag. */
  protected _views: { [id: string]: Type_ViewEntry } = {}
  public get views_dict() { return this._views }

  /** Ordre des vues (le maître n'y figure pas). Muté en place par les méthodes d'ordre. */
  protected _views_order: string[] = []
  public get views_order() { return this._views_order }

  // Affiche le Sankey maître comme une entrée à part entière dans la liste des vues
  // (sélecteur topbar + table de config). Par défaut masqué. Libellé éditable = _master_view_name.
  protected _show_master_in_views: boolean = false
  public get show_master_in_views() { return this._show_master_in_views }
  public set show_master_in_views(v: boolean) { this._show_master_in_views = v }
  protected _master_view_name: string = ''
  public get master_view_name() { return this._master_view_name }
  public set master_view_name(v: string) { this._master_view_name = v }

  // OS#1315 — Conserver le réglage caméra (zoom/pan) d'une vue à l'autre. true (défaut) : la
  // caméra de la vue sortante est reportée sur l'entrante (cadrage 'none'). false : chaque vue
  // applique son propre cadrage à l'arrivée.
  protected _keep_camera_across_views: boolean = true
  public get keep_camera_across_views(): boolean { return this._keep_camera_across_views }
  public set keep_camera_across_views(v: boolean) { this._keep_camera_across_views = v }

  // sa#397 — Label de vue imposé par la page publiée (`window.sankey.view_label`) : restreint
  // l'ordre de navigation (sélecteur + flèches) aux vues portant ce label de vue (cf. sa#396,
  // labels ≠ view tags de génération). Posé UNIQUEMENT par applyPublishStateOptions quand le
  // label matche au moins une vue ; null = comportement historique inchangé.
  protected _publish_view_label_filter: string | null = null
  public get publish_view_label_filter(): string | null { return this._publish_view_label_filter }
  public set publish_view_label_filter(v: string | null) { this._publish_view_label_filter = v }

  // sa#412 — Labels de page déclarés par la page publiée (`window.sankey.view_label` en LISTE) :
  // le viewer publié rend un sélecteur de label VISIBLE à côté du sélecteur de vues dès que la
  // liste compte plus d'un label présent dans le fichier ; le filtre ACTIF reste
  // `publish_view_label_filter` ci-dessus. État runtime, jamais sérialisé ; [] = pas de
  // sélecteur (comportement historique). L'éditeur n'en tient pas compte.
  protected _publish_view_labels: string[] = []
  public get publish_view_labels(): string[] { return this._publish_view_labels }
  public set publish_view_labels(v: string[]) { this._publish_view_labels = v }

  // os#1357 — Annuaire des labels de vues : id stable, nom modifiable, groupe optionnel.
  //
  // Vit à la RACINE du fichier et non sur le Sankey : chaque vue lourde sérialise son propre
  // Sankey complet, un annuaire posé là serait dupliqué par vue et divergerait en silence.
  // Ordonné par le tableau lui-même — pas de second registre d'ordre à tenir cohérent.
  protected _view_label_defs: Type_ViewLabelDef[] = []
  public get view_label_defs(): Type_ViewLabelDef[] { return this._view_label_defs }
  public set view_label_defs(v: Type_ViewLabelDef[]) { this._view_label_defs = v }

  // Identité LOGIQUE de la vue courante, découplée de l'id du Sankey de la DA. Nécessaire pour
  // les vues light qui RÉUTILISENT la DA maître : sans ce champ, une vue light serait confondue
  // avec le maître (is_view_master, navigation, suppression…). Vaut default_main_sankey_id pour
  // le maître, l'id du Sankey de la DA pour une vue heavy.
  protected _current_view_id: string = default_main_sankey_id
  public get current_view_id() { return this._current_view_id }
  public set current_view_id(v: string) { this._current_view_id = v }

  // ==========================================================================================
  // ÉTAT DES FEUILLES (OS#85 — plusieurs feuilles de dessin, comme draw.io)
  // ------------------------------------------------------------------------------------------
  // Une feuille = un diagramme indépendant du document (autres données), quand une vue = une
  // autre lecture des MÊMES données (règle des deux niveaux). Le système de vues reste INTACT :
  // chaque feuille embarque son diagramme complet, vues comprises. La feuille COURANTE est
  // l'état vivant de l'application ; les autres sont des snapshots gzip (comme les vues).
  // Un document sans feuilles (cas historique) a un état vide : aucune clé `sheets` en JSON.
  // ==========================================================================================

  /** Feuilles du document, indexées par id (snapshot gzip sauf feuille courante). */
  protected _sheets: { [id: string]: Type_SheetEntry } = {}
  public get sheets_dict() { return this._sheets }

  /** Ordre d'affichage des onglets de feuilles. Vide = document mono-feuille historique. */
  protected _sheets_order: string[] = []
  public get sheets_order() { return this._sheets_order }

  /** Id de la feuille courante ('' tant que le document n'a pas de feuilles). */
  protected _current_sheet_id: string = ''
  // os#1385 (lot 3) — `_loading_into_sheet` a disparu : le fait qu'il portait (« ce
  // chargement-ci reste dans le fichier ouvert ») est désormais une OPTION du chargement,
  // `keep_file_state`, lue par `fromJSON` et par `_loadSheetContent`.
  public get current_sheet_id() { return this._current_sheet_id }

  /** True dès que le document porte des feuilles nommées (au moins une entrée). */
  public get has_sheets(): boolean { return this._sheets_order.length > 0 }

  /**
   * os#1386 / os#1385 (lot 3) — DOCUMENTS VIVANTS des feuilles NON courantes, par id de
   * feuille, avec l'instantané dont ils sont issus. Voir `sheetApplication` pour le pourquoi
   * et la politique d'invalidation, `releaseSheetDocument` pour la sortie.
   */
  protected _sheet_apps: { [id: string]: { snapshot: Uint8Array, app: Class_ApplicationData } } = {}

  // Service de LECTURE des vues (#1316). Instancié via une fabrique virtuelle : OpenSankey+
  // (Class_ApplicationDataOSP) la surcharge pour fournir un `ViewsManager` (édition) à la place,
  // sans dupliquer le corps de lecture. Ce champ vit ici pour qu'un viewer OS pur sache
  // restituer un fichier multi-vues.
  protected _views_reader: ViewsReader = this.instanciateViewsReader()
  protected instanciateViewsReader(): ViewsReader { return new ViewsReader(this) }

  /**
   * os#1369 — Exécute un geste LOURD d'interface (filtrage par dataTag, et tout ce qui
   * redessine le diagramme entier) en cédant d'abord la main au navigateur, voile et sillon
   * posés. Suite directe d'os#1368 : la cause est la même — le travail est synchrone, donc
   * un indicateur posé juste avant ne serait JAMAIS peint —, et l'ordonnanceur est le MÊME
   * instance que celui de la bascule de vue, pour qu'il n'y ait qu'un voile à l'écran et que
   * l'ordre soit préservé entre les deux familles de gestes.
   *
   * `then` court APRÈS le travail, cédé ou non : les hôtes y rafraîchissent leurs composants,
   * qui sinon liraient l'état d'avant, une frame trop tôt.
   *
   * Réservé aux gestes d'UTILISATEUR. Les chemins programmatiques — exports, options de
   * publication, suites de tests, qui lisent l'état au retour — appellent le travail
   * directement et restent strictement synchrones, comme `setCurrentView` face à
   * `requestViewChange`.
   */
  public runHeavyGesture(work: () => void, then?: () => void): void {
    afterViewChange(this._views_reader.gesture_progress.run('heavy', work),
      then ?? (() => { /* rien à rafraîchir */ }))
  }

  /**
   * History of all actions
   *
   * @protected
   * @type {Class_ApplicationHistory}
   * @memberof Class_ApplicationData
   */
  protected _history?: Class_ApplicationHistory
  // os#1385 (lot 2) — `_clipboard_node_ids` a migré dans l'espace de travail
  // (`Class_Workspace.clipboard`) : un presse-papiers par document ne permettait pas de coller
  // ce qu'on venait de copier ailleurs, et ne le disait pas.

  /**
   * Configuration Menu
   *
   * @protected
   * @type {Class_MenuConfig}
   * @memberof Class_ApplicationData
   */
  protected _menu_configuration?: Class_MenuConfig

  /**
 * Librairie containing icon for the app
 *
 * @protected
 * @type {Class_MenuConfig}
 * @memberof Class_ApplicationData
 */
  protected _icon_library: Class_IconLibrary

  /**
   * All possible attr to update in copyFrom
   * @protected
   * @type {string[]}
   * @memberof Class_ApplicationData
   */
  protected get _transform_layout_all_attr(): string[] {
    return this.expandLayoutMode(
      ['allNodes', 'allFlux', 'allFreeLabels',
        'allTagNode', 'allTagFlux',
        'allTagData', 'allTagLevel',
        'allDA',
        'allStyles'])
  }

  // Langue de l'interface, logos, préfixe d'URL : de l'espace de travail (cf. leurs accesseurs
  // délégués dans la section GETTERS / SETTERS).

  /**
   * Varaible to save language selected
   * @private
   * @type {(string | undefined)}
   * @memberof Class_ApplicationData
   */
  private _language?: string | undefined

  // Toasts : file d'attente UNIQUE, portée par l'espace de travail (`sendWaitingToast`,
  // `notifyUser` délèguent). Deux documents ne se volent plus leur spinner.

  /**
   * Guided visite steps to show app
   * @private
   * @type {StepType[]}
   * @memberof Class_ApplicationData
   */
  private _steps: StepType[] = []

  /**
   * #1255 — Scénario de la visite guidée (cf. Class_GuidedTour). Porte l'état du tour en cours :
   * gestes attendus, contenu de repli créé, nettoyage de fin.
   * @private
   * @memberof Class_ApplicationData
   */
  private _guided_tour: Class_GuidedTour = new Class_GuidedTour(this)

  // Réglages « de session » de la mise en page automatique : partagés par le menu contextuel et
  // le dialogue d'import Excel, donc de l'espace de travail. Accesseurs délégués.

  /**
   * Session-only horizontal spacing for auto-layout. `null` = use style default.
   * Shared between the auto-layout context menu widget and the Excel import dialog.
   */
  public get layout_h_spacing(): number | null { return this.workspace.layout_h_spacing }
  public set layout_h_spacing(_: number | null) { this.workspace.layout_h_spacing = _ }

  /**
   * Session-only vertical spacing for auto-layout. `null` = use style default.
   * Shared between the auto-layout context menu widget and the Excel import dialog.
   */
  public get layout_v_spacing(): number | null { return this.workspace.layout_v_spacing }
  public set layout_v_spacing(_: number | null) { this.workspace.layout_v_spacing = _ }

  /**
   * Session-only placement mode for nodes without incoming flows (auto-layout).
   * 'before_neighbor' = one column before the earliest successor (default),
   * 'left_extremity' = pinned to the leftmost column (index 0).
   */
  public get layout_sources_mode(): 'before_neighbor' | 'left_extremity' { return this.workspace.layout_sources_mode }
  public set layout_sources_mode(_: 'before_neighbor' | 'left_extremity') { this.workspace.layout_sources_mode = _ }

  /**
   * Session-only placement mode for nodes without outgoing flows (auto-layout).
   * 'after_neighbor' = one column after the latest predecessor (default),
   * 'right_extremity' = pinned to the rightmost column.
   */
  public get layout_sinks_mode(): 'after_neighbor' | 'right_extremity' { return this.workspace.layout_sinks_mode }
  public set layout_sinks_mode(_: 'after_neighbor' | 'right_extremity') { this.workspace.layout_sinks_mode = _ }

  /**
   * Session-only mode for the auto-layout: whether to minimize link crossings.
   * `true` = "Minimiser les croisements", `false` = "Centrer les nœuds".
   * Used by the Excel import dialog; the right-click menu exposes the choice via two buttons instead.
   */
  public get layout_optimize_crossing(): boolean { return this.workspace.layout_optimize_crossing }
  public set layout_optimize_crossing(_: boolean) { this.workspace.layout_optimize_crossing = _ }

  /**
   * sankeyapplication#153 — Recalcul automatique du statut recyclage après un déplacement
   * de nœud : un flux dont la cible ne se trouve plus à droite de sa source passe en
   * recyclage, et réciproquement.
   *
   * `true` (défaut) = « Recalcul auto », `false` = « Mise en page figée » — indispensable
   * sur un diagramme particulier dont l'utilisateur a réglé le recyclage à la main (le
   * verrou par flux reste de toute façon prioritaire sur la géométrie).
   *
   * Ne déplace AUCUN nœud : une mise en page manuelle survit au recalcul.
   *
   * PERSISTÉ (clé racine `layout_auto_recycling`, sérialisée seulement si `false`) — contrairement
   * aux autres `layout_*`, qui sont des réglages de session du dialogue de mise en page auto :
   * celui-ci décrit une propriété du diagramme (« ma disposition est libre, n'y touche pas »), et
   * repartait à `true` à chaque rechargement, rendant le choix inopérant.
   */
  public layout_auto_recycling: boolean = true

  /**
   * Mode « afficher aussi les flux porteurs de données » : quand actif, EN PLUS de
   * la vue courante, on révèle les flux portant une valeur collectée saisie
   * (`Class_LinkElement.has_collected_data`) et leurs nœuds, tous niveaux
   * d'agrégation confondus (bypass des portes niveau/dimension). Union avec la vue
   * normale, pas un filtre. Vue d'exploration de session (non persistée).
   */
  public reveal_data_links: boolean = false



  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_ApplicationData — LE DOCUMENT (os#1385).
   *
   * Deux formes, et une seule vérité derrière :
   *  - `new Class_ApplicationData(workspace)` : le geste normal, fait par
   *    `Class_Workspace.createDocument()`, qui enregistre ensuite le document ;
   *  - `new Class_ApplicationData(published_mode, options)` : la forme HISTORIQUE, toujours
   *    valide (soixante fichiers de tests, consommateurs npm). Le document se crée alors son
   *    PROPRE espace de travail, dont il est le document principal.
   *
   * @param {Class_Workspace | boolean} workspace_or_published_mode
   * @memberof Class_ApplicationData
   */
  constructor(
    workspace_or_published_mode: Class_Workspace | boolean,
    options: { [_: string]: boolean | string } = {}
  ) {
    // L'ESPACE DE TRAVAIL D'ABORD, AVANT TOUT LE RESTE : `createNewDrawingArea()` plus bas
    // construit une zone de dessin qui lit `is_static`, lequel vient de lui.
    if (typeof workspace_or_published_mode === 'boolean') {
      this._workspace = this.createOwnWorkspace(workspace_or_published_mode, options)
      this._workspace.registerDocument(this)
    } else {
      this._workspace = workspace_or_published_mode
    }
    // super()
    // Initialiser le système de tooltip (idempotent ; appelé ici plutôt qu'au top-level
    // pour ne pas marquer le module comme side-effectful, ce qui casse l'analyse webpack
    // des named imports Chakra dans les consommateurs externes).
    // OS#305 — le MÉCANISME d'info-bulle hérité (overlay propre, positionnement,
    // barre d'onglets, gestionnaire d'événements) est RETIRÉ : il doublait les
    // panneaux unifiés (#300). Son CONTENU est conservé et réutilisé comme blocs
    // de présentation, et la composition PAR DÉFAUT le reproduit — un diagramme
    // déjà produit affiche donc la même chose qu'avant, sans que son auteur ait
    // rien à faire (cf. defaultCompositionFor).
    // initializeTooltipSystem()  // <- retiré, cf. ci-dessus
    //
    // L'ancienne migration de l'option de publication `tooltip_on_hover` vers un
    // déclencheur DOCUMENT a été retirée : le déclencheur est désormais un attribut
    // de style PAR ÉLÉMENT (`tooltip_trigger`), il n'y a plus de réglage global à
    // poser ici.
    // os#1376 — expose `window.sankey_draw_counters` (éteint par défaut). Ici, dans un
    // constructeur, et non au premier niveau du module : un appel exécutable au top-level
    // casse l'analyse webpack des consommateurs externes (même raison que ci-dessus).
    exposeDrawCounters()
    // Deals with UI menu updates / each modifications
    // Contains all drawn objects
    this._drawing_area = this.createNewDrawingArea()
    // For published mode only — `static` est désormais LU de l'espace de travail (getter de
    // la zone de dessin) : il n'y a plus rien à poser, ni ici ni après un reset().
    this.fit_screen = this.workspace.published_mode
    // menu_configuration : les constructeurs des classes modèle n'appellent plus de hooks
    // React (cf. #21), donc on peut la créer dès l'instanciation (sans toast). Sans ça,
    // un appel précoce (ex. checkTokens/setLicenses du LoginComponent avant le 1er render)
    // trouvait menu_configuration undefined et jetait. Le render l'ré-injecte avec le toast.
    // Dispatch virtuel : construit la sous-classe (MenuConfigOSP/SA) comme createNewDrawingArea.
    this.createNewMenuConfiguration()
    // Librairie of icon
    this._icon_library = this.createNewIconLibrary()

    if (this.options.no_key_event === true) {
      return
    }
  }

  /**
   * L'espace de travail PRIVÉ que se donne un document construit par la forme historique
   * `new Class_ApplicationData(published_mode, options)`. Virtuelle : OS+ et la couche SaaS
   * la surchargent pour se donner le leur (essai, préférences, composant de connexion).
   */
  protected createOwnWorkspace(
    published_mode: boolean,
    options: { [_: string]: boolean | string }
  ): Class_Workspace {
    return new Class_Workspace(published_mode, options)
  }

  // // CLEANING METHODS ===================================================================
  // /**
  //  * Reset drawing area -> clean data & undraw
  //  * Use a waiting spinner
  //  * @memberof Class_ApplicationData
  //  */
  // public reset(kwargs: Type_JSON) {
  //   this._reset(kwargs)
  // }

  /**
   * Reset drawing area -> clean data & undraw
   * @protected
   * @memberof Class_ApplicationData
   */
  public reset(kwargs?: Type_JSON) {
    // os#1385 (lot 3, D6) — `reset()` DISAIT DEUX CHOSES À LA FOIS : « oublie le FICHIER »
    // (les feuilles, leurs documents, la provenance) et « repars d'un DIAGRAMME neuf » (la
    // zone de dessin, l'historique, la doc, les réglages de publication). Charger le contenu
    // d'une feuille n'a besoin que du second, d'où le stash/restore que `_loadSheetContent`
    // faisait autour de l'appel — et d'où la provenance perdue à chaque bascule d'onglet
    // (inventaire 4 §2, « ce qui est PERDU »). Les deux gestes sont maintenant nommés.
    //
    // `only_current_view` SAUTE le premier : c'est un rafraîchissement de la vue courante
    // (réconciliation dans une vue, « vider la vue ») et la branche OSP correspondante ne
    // touchait déjà ni au fichier ni au reste du document. Le fichier n'est pas concerné.
    if (!(kwargs && kwargs['only_current_view'])) this.resetFile()
    this.resetDocument(kwargs)
  }

  /**
   * os#1385 (lot 3, D6) — OUBLIER LE FICHIER : ses feuilles, les documents vivants qui les
   * portent, et sa provenance. C'est la moitié de l'ancien `reset()` qu'une bascule de feuille
   * ne doit PAS faire — elle reste dans le même fichier.
   */
  public resetFile(): void {
    // OS#85 — Les feuilles appartiennent au FICHIER : en charger un autre les efface.
    this._sheets = {}
    this._sheets_order = []
    this._current_sheet_id = ''
    // os#1386/os#1385 — et donc les documents qui les portent : ils sont le modèle d'un
    // fichier qui n'est plus ouvert. `dispose()` démonte leur zone de dessin et les retire
    // de l'espace de travail (cf. `sheetApplication`).
    this._clearSheetApplications()
    // Provenance sankeythèque : un autre diagramme est chargé, celui d'avant n'est
    // plus à l'écran — le réenregistrement en place doit donc redevenir impossible.
    // (Le chargement d'une étude la repose juste après, cf. loadJsonTemplate.)
    // Ici, et non dans `resetDocument` : une bascule de feuille reste DANS l'étude ouverte,
    // et lui faire perdre son « réenregistrer en place » n'avait aucune raison d'être.
    this._sankeytheque_origin = null
  }

  /**
   * os#1385 (lot 3, D6) — REPARTIR D'UN DIAGRAMME NEUF, sans rien dire du fichier : zone de
   * dessin, historique, nom, brique, doc, réglages de publication. C'est ce que fait un
   * chargement de contenu de feuille, et c'est ce que surcharge OpenSankey+ (vues, contextes,
   * vignettes — y compris la branche `only_current_view`, qui ne recrée que la zone).
   */
  public resetDocument(_?: Type_JSON): void {
    // Reset drawing area
    const by_pass_redraw = this._drawing_area.bypass_redraws
    this._file_name = default_file_name
    // sa#399 — Nouveau document = nouvelle brique : la référence bibliothèque ne survit
    // qu'au travers du JSON (fromJSON la repose juste après si le fichier la porte).
    this._library_ref = null
    // La doc markdown est attachée au diagramme : un nouveau diagramme repart d'une doc vide.
    this._documentation_markdown = {}
    this._documentation_images = {}
    // Les paramètres de publication sont attachés au diagramme : nouveau diagramme => réglages vierges.
    this._publish_settings = {}
    // Undraw and create new DA
    this._drawing_area.unDraw()
    this._drawing_area = this.createNewDrawingArea()

    this._drawing_area.bypass_redraws = by_pass_redraw

    // Reset Class_DataHistory
    this._history = new Class_ApplicationHistory(this._menu_configuration!)
    // Update menus — SEULEMENT le document principal (os#1385). Les emplacements repeints ici
    // sont ceux de l'HÔTE (sous-menus, préférences, page d'accueil) : les laisser à un document
    // secondaire (instantané de feuille, source unitaire) ferait repeindre l'interface de
    // l'utilisateur au chargement d'un document qu'il ne regarde pas. Avant le lot 1, cette
    // configuration était simplement ORPHELINE : on reproduit ce comportement.
    if (this.is_main) this.menu_configuration?.updateAllMenuComponents()
  }

  /**
   * Reset data & delete application data in navigator cache
   *
   * @memberof Class_ApplicationData
   */
  public reinitialization(redraw: boolean = true) {
    localStorage.removeItem('diff')
    localStorage.removeItem('data')
    // os#1385 (lot 2) — ET LES EMPLACEMENTS DES AUTRES DOCUMENTS. « Tout effacer » ne peut pas
    // laisser derrière lui les feuilles et les briques écrites à côté (`cache_key`) : elles
    // reviendraient au prochain index de documents (lot 3) comme des fantômes d'un diagramme
    // que l'utilisateur croit avoir jeté.
    Object.keys(localStorage)
      .filter(k => k.startsWith('data:'))
      .forEach(k => localStorage.removeItem(k))
    localStorage.removeItem('last_save')
    localStorage.removeItem('initial_data')
    localStorage.removeItem('icon_imported')

    // os#1433 — ET LES FENÊTRES (arbitrage de Julien : « ça doit supprimer les fenêtres »).
    //
    // « Tout effacer » ne les touchait pas, et ce n'était pas un oubli mais une conséquence : la
    // grande zone appartient à l'HÔTE depuis le lot 3, et `reset()` ne remet à zéro que le
    // DOCUMENT. On repartait donc d'un diagramme vierge dans la mise en page du précédent, avec
    // un tableur et une doc ouverts sur un modèle qui n'existait plus.
    //
    // Posé HORS du `if (redraw)`, contrairement au reste : la grande zone n'est pas un dessin,
    // c'est l'état de l'écran, et les deux appelants qui ne redessinent pas (dialogue d'accueil,
    // suppression de toutes les vues) doivent la voir revenir au diagramme comme les autres.
    this.menu_configuration?.resetMainZoneToCanvas()
    // Reset Class_ApplicationData instance
    if (redraw) {
      this.reset({})
      this.drawing_area.draw()
    }

    sessionStorage.setItem('dismiss_warning_sankey_plus', '0')
    sessionStorage.setItem('dismiss_warning_sankey_mfa', '0')
  }

  // SAVING METHODS =====================================================================

  /**
   * Save in JSON in browser cache
   *
   * /!\ Add to waiting spinner queue
   *
   * @memberof Class_ApplicationData
   */
  public saveInCache(): void {
    // os#1385 (lot 3, D6) — ENREGISTRER DEPUIS LA FEUILLE B ENREGISTRE LE FICHIER, dont B fait
    // partie. Une feuille n'est pas un fichier : son document est une PARTIE du document
    // porteur, et c'est le porteur qui sait écrire les autres feuilles à côté d'elle. Le
    // détour n'est pas une perte de fidélité, c'est le contraire : `sheetsToJSON` du porteur
    // sérialise B EN L'APPELANT tant qu'elle est vivante — l'état à l'écran part dans le
    // fichier, pas l'instantané d'avant. C'est très exactement le point de D6.
    if (this._file_holder) return this._file_holder.saveInCache()
    this.sendWaitingToast(
      () => {
        // Read json file
        this._saveInCache()
      },
      {
        success: {
          title: this.t('toast.save_in_cache.success.title')
        },
        loading: {
          title: this.t('toast.save_in_cache.loading.title')
        },
        error: {
          title: this.t('toast.save_in_cache.error.title')
        }
      })
  }

  /**
   * Save as JSON in browser cache
   * @protected
   * @memberof Class_ApplicationData
   */
  protected _saveInCache() {
    // Push to storage — os#1385 (lot 2) : à l'emplacement de CE document (cf. `cache_key`).
    localStorage.setItem(this.cache_key, LZString.compress(JSON.stringify(this._toJSON())))
    // `last_save` et `last_save_at` restent GLOBAUX, délibérément : il n'y a qu'un bouton
    // Enregistrer et qu'un horodatage à montrer au survol. Les distinguer par document
    // demanderait d'abord de montrer lequel, ce que l'écran ne fait pas encore.
    localStorage.setItem('last_save', 'true')
    // sa#424 (lot 4) — HORODATAGE de l'enregistrement, pas seulement son
    // existence : « enregistré » sans date ne dit pas si cela remonte à une
    // minute ou à avant-hier. Affiché au survol du bouton.
    localStorage.setItem('last_save_at', new Date().toISOString())
    // Update logo save in cache
    this.menu_configuration.ref_to_save_in_cache_indicator.current(true)
    this.menu_configuration.ref_to_last_download_updater.current()
    this.requestPersistentStorage()
  }

  /**
   * sa#424 (lot 4) — DEMANDER AU NAVIGATEUR DE NE PAS ÉVINCER CE STOCKAGE.
   *
   * Ctrl+S écrit dans le stockage local, qui est par défaut « best-effort » : le
   * navigateur peut le purger sous pression de disque. `storage.persist()` le
   * fait passer en durable.
   *
   * Appelé au moment de l'enregistrement, PAS au démarrage : sous Firefox la
   * demande peut ouvrir une autorisation, et une invite surgissant à l'ouverture
   * de l'application serait incompréhensible — ici elle suit un geste délibéré
   * de l'utilisateur. Une seule tentative par session ; l'échec est sans
   * conséquence (on retombe sur le comportement d'avant).
   */
  protected _persistence_requested = false
  public requestPersistentStorage() {
    if (this._persistence_requested) return
    this._persistence_requested = true
    const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined
    if (!storage?.persist) return
    storage.persisted()
      .then((already) => (already ? true : storage.persist()))
      .catch(() => undefined)
  }

  /**
   * sa#424 (lot 4) — DATE DU DERNIER VRAI FICHIER ÉCRIT (JSON ou Excel).
   *
   * Le stockage de l'application n'est pas une sauvegarde : il est lié à un
   * navigateur, un profil et une origine, et part avec un nettoyage de données.
   * Cette date est la seule information qui prévienne d'une perte — d'où son
   * affichage à côté du bouton d'enregistrement, « jamais » compris.
   *
   * Les EXPORTS (PNG, PDF, SVG) ne comptent pas : ce sont des rendus figés, pas
   * des fichiers réouvrables — la distinction même qui sépare « Enregistrer
   * sous » d'« Exporter ».
   */
  public noteDocumentDownloaded() {
    localStorage.setItem('last_download', new Date().toISOString())
    this.menu_configuration.ref_to_last_download_updater.current()
    // sa#524 — un vrai fichier vient d'être écrit : signalé aux couches qui
    // veulent y réagir (la couche applicative y propose le compte gratuit).
    this.menu_configuration.notify(SAVE_TOPIC)
  }

  /**
   * sa#531 — UNE IMAGE VIENT D'ÊTRE EXPORTÉE (PNG, SVG, PDF).
   *
   * Volontairement séparé de `noteDocumentDownloaded` : un export est un rendu
   * figé, pas un fichier réouvrable, et il ne doit donc RIEN changer à la date
   * du dernier enregistrement — sinon l'avertissement de perte de travail
   * mentirait à quelqu'un qui n'a exporté qu'une image.
   *
   * Ne fait que signaler : c'est la couche applicative qui journalise. Depuis
   * que le rendu est rasterisé dans le navigateur, aucune route serveur ne voit
   * plus passer un export.
   */
  public noteImageExported(format: string) {
    this.menu_configuration.last_export = { format }
    this.menu_configuration.notify(EXPORT_TOPIC)
  }

  public get last_document_download(): Date | null {
    return this._storedDate('last_download')
  }

  /** Horodatage du dernier enregistrement dans le stockage de l'application. */
  public get last_cache_save(): Date | null {
    return this._storedDate('last_save_at')
  }

  protected _storedDate(key: string): Date | null {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const date = new Date(raw)
    return isNaN(date.getTime()) ? null : date
  }

  /**
   * save to JSON format
   *
   * /!\ Add to waiting spinner queue
   *
   * @memberof Class_ApplicationData
   */
  public saveToJSON(kwargs?: Type_JSON): void {
    // os#1385 (lot 3, D6) — même règle qu'`saveInCache` : « Enregistrer sous » depuis une
    // fenêtre ouverte sur la feuille B écrit LE FICHIER, feuilles comprises, et non le
    // diagramme de B tout seul. Exporter B seule reste possible, mais c'est un autre geste
    // (« exporter cette feuille »), qui devra le dire.
    if (this._file_holder) return this._file_holder.saveToJSON(kwargs)
    this.sendWaitingToast(
      async () => {
        await this.beforeSaveToJSON()
        this._saveToJSON(kwargs)
      },
      {
        success: {
          title: this.t('toast.save_as_json.success.title')
        },
        loading: {
          title: this.t('toast.save_as_json.loading.title')
        },
        error: {
          title: this.t('toast.save_as_json.error.title')
        }
      })
  }

  /**
   * Hook ASYNCHRONE exécuté juste avant la sérialisation d'une sauvegarde JSON (dans le toast
   * d'attente, donc l'utilisateur voit le spinner). OS : rien. OSP y prépare les vignettes de
   * vues, dont la rasterisation est asynchrone alors que `_toJSON` est synchrone.
   */
  protected async beforeSaveToJSON(): Promise<void> { /* rien à préparer en lecture */ }

  /**
   * Save to JSON format
   * @protected
   * @memberof Class_ApplicationData
   */
  protected _saveToJSON(kwargs?: Type_JSON) {
    // Convert all datas as JSON
    const json_data = this.drawing_area.withBypassRedraws(() => this._toJSON(kwargs))
    if (kwargs && kwargs['compression'] === 'gzip') {
      const compressed = compressJSONToGzip(json_data)
      const blob = new Blob([compressed as BlobPart], { type: 'application/gzip' })
      const gzFilename = this._file_name.endsWith('.json')
        ? this._file_name.replace('.json', '.json.gz')
        : this._file_name + '.json.gz'

      FileSaver.saveAs(blob, gzFilename)
    } else {
      const json_data_str = JSON.stringify(json_data, null, 2)
      const blob = new Blob([json_data_str], { type: 'text/plain;charset=utf-8' })
      FileSaver.saveAs(blob, this._file_name + '.json')
    }
    this.noteDocumentDownloaded()
  }

  /**
   * Save as Excel format
   *
   * /!\ Add to waiting spinner queue
   *
   * @param {string} url_prefix
   * @param {string} [file_name='sankey']
   * @memberof Class_ApplicationData
   */
  public saveToExcel(
    url_prefix: string,
    kwargs?: Type_JSON
  ) {
    this.sendWaitingToast(
      () => {
        this._saveToExcel(
          url_prefix,
          kwargs
        )
      },
      {
        success: {
          title: this.t('toast.save_as_excel.success.title')
        },
        loading: {
          title: this.t('toast.save_as_excel.loading.title')
        },
        error: {
          title: this.t('toast.save_as_excel.error.title')
        }
      })
  }

  /**
   * Save to Excel format
   * @protected
   * @param {string} url_prefix
   * @param {string} [file_name='sankey']
   * @memberof Class_ApplicationData
   */
  protected _saveToExcel(
    _name: string,
    _args?: Type_JSON
  ) {
  }

  /**
   * Enregistre un geste LOURD (hiérarchies, pré-positionnement global, import/export…)
   * comme UNE seule entrée d'historique, par snapshots avant/après.
   *
   * Pourquoi ne pas rejouer l'action au redo, comme le fait executeWithUndo ? Parce que
   * fromJSON() passe par reset(), qui REMPLACE la drawing_area : après un undo, toute
   * référence capturée (nœud, tag group, drawing_area) pointe sur des instances mortes.
   * Restaurer l'état sérialisé des deux côtés évite complètement le problème.
   *
   * À réserver aux gestes qui mutent large : deux toJSON complets par appel.
   * `onRestore` sert à rafraîchir les menus après restauration.
   */
  public runWithSnapshotUndo(action: () => void, onRestore?: () => void) {
    const before = this.toJSON()
    action()
    const after = this.toJSON()
    // On reste sur le MÊME diagramme : fromJSON passe par reset(), qui efface la
    // provenance sankeythèque — sans ce report, annuler un geste lourd ferait
    // disparaître le réenregistrement en place de l'étude ouverte.
    const origin = this._sankeytheque_origin
    const restore = (snapshot: Type_JSON) => {
      this.fromJSON(snapshot)
      this._sankeytheque_origin = origin
      onRestore?.()
    }
    // saveUndo PUIS saveRedo, après l'action : saveUndo ouvre le slot, saveRedo écrit
    // sur celui-là (cf. Class_ApplicationHistory).
    this.history.saveUndo(() => restore(before))
    this.history.saveRedo(() => restore(after))
  }

  public toJSON(kwargs?: Type_JSON) {
    return this._toJSON(kwargs)
  }

  /**
   * os#1421 — SOLDE LES FIGURES PROMUES QUE PLUS RIEN NE CITE, avant de sérialiser le registre.
   *
   * VIRTUELLE, et c'est ce qui la rend sûre : une application à VUES (OS+) travaille sur une zone
   * de dessin qui n'est pas celle qu'elle sérialise, et ne regarder que l'une des deux solderait
   * une figure posée dans l'autre. Elle y surcharge donc ce point unique, et tous les chemins
   * d'écriture — y compris ceux qui passent par `super._toJSON` — en bénéficient.
   *
   * `?.` sur la zone de dessin : une application de feuille, ou un document lu hors écran, peut
   * n'en avoir aucune, et un balayage n'est jamais une raison de faire échouer une écriture.
   */
  protected _pruneUnreferencedFiguresBeforeWrite(): void {
    const mc = this.menu_configuration
    if (!mc) return
    mc.pruneUnreferencedFigures(mc.placedFigureIds(this.drawing_area?.sankey?.nodes_list ?? []))
  }

  /**
   * Create json file that contains all application datas
   * @memberof Class_ApplicationData
   */
  protected _toJSON(kwargs?: Type_JSON) {
    const json_object = {} as Type_JSON
    // os#1385 (lot 4, D8) — LA LANGUE ET LES PANNEAUX SONT DE L'ESPACE DE TRAVAIL, et
    // partent ensemble sous la clé racine `workspace` (cf. `workspaceToJSON`).
    this.workspaceToJSON(json_object, kwargs)
    if (this._file_name != default_file_name) json_object['name_file'] = this._file_name
    const doc_serialized = serializeDocMarkdown(this._documentation_markdown)
    if (doc_serialized !== undefined) json_object['documentation_markdown'] = doc_serialized
    if (Object.keys(this._documentation_images).length > 0) json_object['documentation_images'] = this._documentation_images
    if (Object.keys(this._publish_settings).length > 0) json_object['publish_settings'] = this._publish_settings
    // sa#399 — Référence de brique de bibliothèque, clé racine persistée avec le diagramme.
    if (this._library_ref) json_object['library_ref'] = { ...this._library_ref }
    // os#1385 (lot 3) — LA GRANDE ZONE EST DE L'HÔTE, comme les panneaux : une seule disposition
    // à l'écran quel que soit le nombre de documents ouverts, donc seul le PRINCIPAL l'écrit.
    // Sans cette garde, chaque document secondaire (feuille vivante, source Excel, brique)
    // recopierait la disposition de l'utilisateur dans sa propre entrée du fichier.
    //
    // os#1433 (19/09/2026) — ET JAMAIS DANS UN CONTENU DE FEUILLE, la seconde garde qui
    // manquait. `is_main` seule ne suffit pas : c'est le document PRINCIPAL lui-même qui
    // sérialise l'instantané de sa feuille courante (`toSheetContentJSON`, appelée à chaque
    // bascule et à chaque enregistrement), donc `is_main` y est vraie et la disposition partait
    // dans l'instantané. Chaque feuille emportait ainsi les fenêtres telles qu'on l'avait
    // quittée, et y revenir les rejouait : la grande zone se mettait à appartenir à la feuille
    // alors que D1 la déclare de l'espace de travail. Julien l'a vu par l'autre bout — une
    // feuille neuve arrivait avec les fenêtres de la précédente (§5.1 de l'audit du 19/09).
    //
    // La règle est celle de `workspaceToJSON`, quatre clés plus bas, et elle est reprise MOT
    // POUR MOT : il n'y a qu'un espace de travail à l'écran, il n'a donc qu'un seul écrivain,
    // et une feuille n'en est pas un. `without_sheets` couvre du même coup la brique unitaire
    // (`UnitaryExtraction`), qui est elle aussi le contenu d'une feuille.
    if (this.is_main && !(kwargs && kwargs['without_sheets'] === true)) {
      json_object['main_zone'] = this.menu_configuration.mainZoneStateToJSON()
    }
    // os#1482 — LES TABLEAUX DE BORD, clé racine `dashboards`, sous la même garde que `main_zone` et pour la
    // même raison : elles décrivent l'écran, un seul écrivain. Additive (absente sans tableau de bord).
    this.dashboardsToJSON(json_object, kwargs)
    // os#1418 — STYLES DES NATURES DE FIGURE (étoile unitaire, couronne, histogrammes,
    // sunburst), clé racine ADDITIVE : absente tant qu'aucun style n'a été réglé, donc un
    // fichier antérieur se relit à l'identique. Remplace `representation_defaults` (os#1394),
    // que la lecture sait encore migrer.
    const figure_styles = this.menu_configuration.figureStylesToJSON()
    if (figure_styles) json_object['figure_styles'] = figure_styles
    // os#1421 — LE BALAYAGE, JUSTE AVANT D'ÉCRIRE LE REGISTRE. Une figure promue que plus rien ne
    // cite — ni vignette d'une fenêtre VIVANTE, ni placement sur un nœud — a été nommée pour être
    // posée puis dépossée : plus personne ne la regarde, et la garder ne ferait que grossir le
    // fichier. L'enregistrement est le seul moment où quelqu'un SAIT les placements (il a les
    // nœuds), d'où l'appel ici et non dans `Class_MenuConfig`. Idempotent : la seconde passe ne
    // trouve plus rien à solder.
    this._pruneUnreferencedFiguresBeforeWrite()
    // os#1421 — LE REGISTRE DES FIGURES DU DOCUMENT (celles qu'un placement cite), clé racine
    // ADDITIVE elle aussi : absente tant qu'aucune figure n'a été POSÉE. Racine et non `main_zone`,
    // parce qu'une figure posée sur un nœud survit à la fenêtre où on l'a réglée — l'écrire dans
    // la fenêtre la perdrait précisément dans le cas où elle compte.
    const figures = this.menu_configuration.figuresToJSON()
    if (figures) json_object['figures'] = figures
    // OS#85 — Feuilles du document (clé racine `sheets`). La racine du fichier EST le
    // contenu de la feuille courante (compat : un ancien lecteur l'affiche telle quelle).
    this.sheetsToJSON(json_object, kwargs)
    return {
      ...json_object,
      ...DrawingAreaPersistence.toJSON(this.drawing_area, kwargs)
    }
  }

  /**
   * Reset value of drawing_area and substructur with data from JSON
   * then assign newly created drawing_area as Class_ApplicationData currentdrawing_area attribute
   *
   * /!\ Add to waiting spinner queue
   *
   * @param {Type_JSON} json_object
   * @memberof Class_ApplicationData
   */
  public fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON,
    draw: boolean = true
  ) {
    // OS#85 — Charger un fichier SANS feuilles alors que le document en a = charger
    // DANS la feuille courante : les autres feuilles restent (sémantique draw.io/Excel,
    // demandée par Julien le 10/08 — « le chargement devrait être associé à la feuille »).
    //
    // sa#539 — ce chargement-là est désormais DEMANDÉ, plus DÉDUIT. Tant qu'il se
    // déclenchait sur la seule absence de clé `sheets`, « Fichier → Ouvrir » laissait
    // survivre les feuilles du document précédent : on se retrouvait avec un document
    // hybride, sans que rien ne le signale. `fromJSON` = j'ouvre un document (reset
    // complet) ; `into_current_sheet` = je charge dans la feuille que j'ai sous les yeux.
    // Le dialogue d'ouverture propose l'option DÉCOCHÉE ; la réconciliation blob→blob et
    // « ouvrir dans une nouvelle feuille » (bibliothèque) la posent, eux, à `true`.
    //
    // Un fichier AVEC feuilles reste un DOCUMENT complet : il remplace tout, feuilles
    // comprises — même quand l'option est demandée.
    //
    // os#1385 (lot 3) — la garde qui coupe la récursion n'est plus un drapeau d'instance
    // (`_loading_into_sheet`) mais l'option qui la décrit : `keep_file_state`. C'est le même
    // fait dit une seule fois — « ce chargement-ci n'ouvre pas un autre fichier, il pose un
    // contenu dans le fichier déjà ouvert » — et il sert aussi, plus bas, à sauter `resetFile`.
    const into_current_sheet = Boolean(kwargs && kwargs['into_current_sheet'])
    const keep_file_state = Boolean(kwargs && kwargs['keep_file_state'])
    if (into_current_sheet && this.has_sheets && !keep_file_state && !json_object['sheets']) {
      this._loadSheetContent(json_object, draw)
      this.menu_configuration?.ref_to_sheet_tabs_updater.current()
      return
    }
    // this.sendWaitingToast(
    //   () => {
    // Always bypass redrawings
    this._drawing_area.bypass_redraws = true
    // Reset everything — os#1385 (lot 3) : le FICHIER n'est oublié que si on en ouvre un autre.
    // `keep_file_state` = « je charge un contenu DANS le fichier ouvert » (bascule de feuille,
    // nouvelle feuille) : les feuilles, leurs documents vivants et la provenance traversent.
    if (!keep_file_state) this.resetFile()
    this.resetDocument(kwargs)
    this._drawing_area.bypass_redraws = true
    // Read json file
    // os#1377 — le temps de la lecture, on annonce à qui lit le fichier qu'un dessin complet
    // suivra (ou non) : `ViewsReader.viewsFromJSON` s'abstient alors du sien, que celui de la
    // fin de méthode referait à l'identique. La valeur précédente est restaurée plutôt
    // qu'effacée : `_loadSheetContent` repasse par `fromJSON` (chargement imbriqué).
    const previous_will_draw = this._from_json_will_draw
    this._from_json_will_draw = draw
    try {
      this._fromJSON(json_object, kwargs)
    } finally {
      this._from_json_will_draw = previous_will_draw
    }
    // Post processing & menu updating
    this._afterFromJSON()
    // Le « filtre vue » fait partie de l'état persistant du diagramme : s'il était actif
    // à l'enregistrement (œil ON / view_mode), il est RESTAURÉ tel quel à l'ouverture pour
    // que le sous-ensemble curé de la vue s'affiche sans réintervention manuelle.
    // view_mode (et activated) sont déjà désérialisés par Class_ViewTagGroup ; on se contente
    // d'INVALIDER les caches (node_tags_fingerprint + visibilité) quand le filtre est actif
    // pour qu'ils soient recalculés AVEC le filtre — sinon la visibilité reste figée sur un
    // cache périmé et des nœuds de la vue resteraient masqués au chargement.
    if (this._drawing_area.sankey.view_mode_active) {
      this._drawing_area.sankey.nodeTagsUpdated()
      this._drawing_area.sankey.nodes_list.forEach(n => n.updateVisibilityFingerprint())
    }
    // Then draw if asked
    if (draw) {
      this._drawing_area.sankey.sortNodes()
      // If the JSON has no geometric info, auto-layout the diagram
      if (!('height' in json_object) && !('width' in json_object) && !('user_scale' in json_object)) {
        this._drawing_area.nodePositioning.computeAutoSankey(true, true)
        // Puis centrer chaque enfant sur son ancêtre niveau 1 (version légère : pose juste
        // les centres, pas de désagrégation/ré-agrégation récursive — bien plus rapide au
        // chargement) pour que le filtre vue révèle des nœuds déjà placés.
        centerChildrenOnParent(this)
      } else {
        // sankeyapplication#153 — le fichier fait foi sur le statut recyclage : tout flux dont
        // le statut chargé diverge de ce que la géométrie recalculerait est verrouillé
        // (tristate #711), sinon le recalcul auto au premier drag le rebasculerait. Réservé
        // aux fichiers porteurs d'une géométrie (sinon computeAutoSankey ci-dessus vient de
        // poser des statuts cohérents) et au chargement pour affichage (draw) : les flux
        // internes en draw=false (réconciliation, tests corpus) réappliquent leur propre
        // mise en page derrière.
        this._drawing_area.nodePositioning.lockRecyclingStatusDivergences()
      }
      this._drawing_area.draw()
      // OS#1250 phase 2 — no-op sauf fichier < 0.92 (cf. markForLegacyNormalization).
      // C'était déjà le cas avant : le garde `to_recenter` de recenter() n'était armé
      // au chargement que par la migration legacy ; l'appel est juste devenu explicite.
      this._drawing_area.normalizeLegacyWorldCoordinates()
      // #680 — Re-cadrage DIFFÉRÉ après le chargement : le premier fit (draw ci-dessus)
      // tourne avant que la disposition (tableur/doc de main_zone, frise de séquence,
      // légende) soit stabilisée → window_fitting_* périmé. On ré-applique le cadrage
      // « d'arrivée » (mode actif, ou fit initial centré / origine en mode 'none',
      // cf. OS#1315) une fois la mise en page posée (débouncé).
      this._drawing_area.application_data._add_waiting_process(
        'autofit_mode_after_load',
        () => this._drawing_area.applyInitialFraming(),
        200
      )
    }
    // })
  }

  /**
   * Overridable method to read JSON
   * @protected
   * @param {Type_JSON} json_object
   * @memberof Class_ApplicationData
   */
  protected _fromJSON(
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    // os#1385 (lot 4, D8) — LA LANGUE D'AVANT, retenue pour `workspaceFromJSON` : la
    // relecture de la zone de dessin écrase `language` depuis la clé RACINE du même nom
    // (`SankeyPersistence.fromJSON`), et un contenu de feuille n'en porte plus.
    const language_before = this._language
    // Update drawing area
    DrawingAreaPersistence.fromJSON(this._drawing_area, json_object, kwargs)
    // os#1385 (lot 4, D8) — Langue et panneaux : clé racine `workspace`, repli sur la
    // racine pour les fichiers antérieurs. Lu AVANT la documentation, qui range une doc
    // historique en chaîne sous la langue déclarée du fichier.
    this.workspaceFromJSON(json_object, kwargs, language_before)
    this._file_name = getStringFromJSON(json_object, 'name_file', this._file_name)
    this._documentation_markdown = parseDocMarkdown(
      json_object['documentation_markdown'],
      workspaceStateFromJSON(json_object).language
    )
    const imgs = json_object['documentation_images']
    this._documentation_images = (imgs && typeof imgs === 'object') ? imgs as { [id: string]: string } : {}
    const pub_opts = json_object['publish_settings']
    this._publish_settings = (pub_opts && typeof pub_opts === 'object' && !Array.isArray(pub_opts))
      ? pub_opts as Type_JSON : {}
    // sa#399 — Brique associée : relue du fichier ; absente ou malformée => null
    // (un fichier sans library_ref est une nouvelle brique, cf. reset()).
    this._library_ref = parseLibraryRef(json_object['library_ref'])
    // os#1418 — LES STYLES DE FIGURE SE LISENT AVANT `main_zone`, ET L'ORDRE EST INVERSÉ EXPRÈS.
    //
    // La migration des fenêtres d'un fichier d'avant (sac `options` + `panes`) doit savoir si la
    // nature a un style qui dit quelque chose : c'est ce qui décidait, dans la résolution de
    // os#1394, entre « la figure suit le défaut » et « elle reprend le repli de la fenêtre ».
    // Lire la grande zone d'abord, comme on le faisait, ferait migrer chaque vignette contre un
    // style encore vide — et le repli gagnerait là où le défaut gagnait.
    //
    // Relus seulement si la clé est là : un fichier qui n'en porte pas ne doit pas effacer ce
    // que la session a déjà appris.
    const figure_styles = json_object['figure_styles']
    if (figure_styles && typeof figure_styles === 'object') {
      this.menu_configuration?.figureStylesFromJSON(figure_styles)
    }
    // os#1394 — défauts par nature de représentation, format HÉRITÉ : relu comme le style
    // `default` de la nature, les clés liées au sujet étant écartées et rapportées.
    const repr_defaults = json_object['representation_defaults']
    if (repr_defaults && typeof repr_defaults === 'object') {
      this.menu_configuration?.representationDefaultsFromJSON(repr_defaults)
    }
    // os#1421 — LE REGISTRE DES FIGURES SE LIT AVANT `main_zone`, ET APRÈS LES STYLES. Après les
    // styles parce qu'une figure suit des styles qu'il faut avoir lus ; avant la grande zone parce
    // que les vignettes CITENT le registre (`figures[clé] = { ref: 'f_N' }`), et qu'une vignette
    // lue d'abord ne trouverait qu'un renvoi dans le vide. Clé absente = registre préservé.
    const figures = json_object['figures']
    if (figures && typeof figures === 'object') {
      this.menu_configuration?.figuresFromJSON(figures)
    }
    const mz = json_object['main_zone']
    // Garde défensive : menu_configuration n'est posée que par createNewMenuConfiguration ; si
    // _fromJSON s'exécute avant, l'appel jetait et avortait tout le chargement (et donc
    // l'application du filtre de vue). Le `?.` saute proprement ce cas (cf. ligne ~608).
    //
    // os#1385 (lot 3) — et SEULEMENT pour le document principal, même raison que les panneaux
    // ci-dessous : la disposition est celle de l'HÔTE. Un document secondaire qui se charge
    // (feuille B ouverte dans une fenêtre, source Excel, brique) réécrirait sinon la grande zone
    // de l'écran avec celle enregistrée dans SON entrée du fichier.
    //
    // os#1433 (19/09/2026) — ET PAS NON PLUS EN CHARGEANT LE CONTENU D'UNE FEUILLE, symétrique
    // exact de la garde d'écriture posée plus haut. Deux raisons, et la seconde vaut pour
    // toujours : les fichiers ÉCRITS AVANT ce correctif portent une disposition dans chacun de
    // leurs instantanés de feuille, et la rejouer ferait encore changer les fenêtres à chaque
    // bascule d'onglet ; et un contenu de feuille, par définition, ne décrit pas l'écran.
    // Même condition que `workspaceFromJSON` : `keep_file_state` dit « je charge un contenu
    // DANS le fichier ouvert » (bascule d'onglet, création de feuille), `only_current_view` un
    // rafraîchissement de la vue courante.
    const loading_into_open_file = Boolean(
      kwargs && (kwargs['keep_file_state'] === true || kwargs['only_current_view'])
    )
    if (this.is_main && !loading_into_open_file && mz && typeof mz === 'object') {
      this.menu_configuration?.mainZoneStateFromJSON(mz as Type_JSON)
    }
    // os#1482 — LES TABLEAUX DE BORD, sous la même garde (cf. `dashboardsFromJSON`).
    this.dashboardsFromJSON(json_object, kwargs)
    // os#1419 — ce que la migration n'a pas su porter, dit UNE fois les trois lectures faites.
    this.menu_configuration?.flushFigureMigrationReport()
    // #1316 — Viewer intégral : lit le bloc `views` (+ delta __patch) et rouvre sur la vue active.
    // No-op si le fichier n'a pas de clé `views`. OpenSankey+ réimplémente `_fromJSON` (sans super)
    // et pilote ses propres appels vues + migration viewtag ; ce chemin ne sert qu'au viewer OS pur.
    this._views_reader.viewsFromJSON(json_object)
    // os#1482 — et les dispositions figées par vue (`view_main_zone`) deviennent des tableaux de bord.
    this.migrateViewMainZonesToDashboards(kwargs)
    // OS#85 — Feuilles du document. No-op (silencieux) si le fichier n'a pas de clé `sheets`.
    this.sheetsFromJSON(json_object)
  }

  // TABLEAUX DE BORD (os#1482) ===================================================================
  // La vue de l'ESPACE DE TRAVAIL (cf. NOTE-TABLEAUX DE BORD.md). Le magasin est de l'hôte
  // (`menu_configuration.dashboards`) ; ici vivent la persistance — mêmes gardes que `main_zone`
  // et `workspace` — et les commandes qui opèrent les documents (activer, capturer).

  /**
   * Écrit la clé racine `dashboards`. PAR LE PRINCIPAL SEULEMENT, et jamais dans un contenu de
   * feuille (`without_sheets`) : les deux disent la même chose, il n'y a qu'un écran.
   * Clé ADDITIVE : rien n'est écrit sans tableau de bord, un fichier d'aujourd'hui ne change pas.
   *
   * /!\ Clé RACINE : chez OpenSankey+ elle doit être posée AVANT `encodeViewsAsDelta`.
   */
  protected dashboardsToJSON(json_object: Type_JSON, kwargs?: Type_JSON): void {
    if (kwargs && kwargs['without_sheets'] === true) return
    if (!this.is_main) return
    const dashboards = this.menu_configuration?.dashboards.toJSON()
    if (dashboards) json_object['dashboards'] = dashboards
  }

  /**
   * Relit la clé racine `dashboards`. Symétrique de l'écriture, et sous la condition de
   * `workspaceFromJSON` : jamais en chargeant un contenu DANS le fichier ouvert
   * (`keep_file_state`, `only_current_view`) — l'écran ne change pas de fichier. Clé absente
   * sur un vrai chargement : le magasin est VIDÉ, c'est un autre fichier.
   */
  protected dashboardsFromJSON(json_object: Type_JSON, kwargs?: Type_JSON): void {
    if (kwargs && (kwargs['keep_file_state'] === true || kwargs['only_current_view'])) return
    if (!this.is_main) return
    this.menu_configuration?.dashboards.fromJSON(json_object['dashboards'])
  }

  /**
   * MIGRATION — chaque vue qui porte une disposition figée (`view_main_zone`, os#1355) devient
   * un tableau de bord `dashboard_<vue>` du nom de la vue, dont les fenêtres diagramme de la feuille courante
   * reçoivent `view: <vue>`. Idempotente : un tableau de bord déjà là sous cet identifiant n'est pas
   * recréée. L'entrée de vue perd sa disposition en mémoire ; à l'enregistrement suivant le
   * fichier est au format nouveau (`view_main_zone` n'est plus écrite, cf. ApplicationDataOSP).
   *
   * Appelée APRÈS la lecture des vues, sous la garde de `dashboardsFromJSON`. Le tableau de bord courante, si
   * rien ne l'a dite, est celle de la vue active : ce que le fichier rouvrait avant les tableaux de bord.
   */
  protected migrateViewMainZonesToDashboards(kwargs?: Type_JSON): void {
    if (kwargs && (kwargs['keep_file_state'] === true || kwargs['only_current_view'])) return
    if (!this.is_main) return
    const dashboards = this.menu_configuration?.dashboards
    if (!dashboards) return
    this._views_order.forEach(view_id => {
      const entry = this._views[view_id]
      if (!entry || !entry.main_zone) return
      const id = migratedDashboardId(view_id)
      if (!dashboards.byId(id)) {
        const migree: Type_Dashboard = {
          id, name: entry.name, main_zone: mainZoneWithViewOnCurrentSheet(entry.main_zone, view_id)
        }
        // os#1492 — la disposition figée dans une vue décrivait forcément la feuille où cette
        // vue vit, c'est-à-dire celle qu'on est en train de lire.
        if (this._current_sheet_id !== '') migree.sheet = this._current_sheet_id
        dashboards.add(migree)
      }
      delete entry.main_zone
    })
    if (dashboards.current === null) {
      const migrated = migratedDashboardId(this._current_view_id)
      dashboards.current = dashboards.byId(migrated) ? migrated : implicitDashboardId(this._current_view_id)
    }
  }

  /** L'identifiant de le tableau de bord ACTIVE : l'explicite posée, sinon l'implicite de la vue courante. */
  public get current_dashboard_id(): string {
    const current = this.menu_configuration.dashboards.current
    if (current !== null && (viewIdOfImplicitDashboard(current) !== null || this.menu_configuration.dashboards.byId(current))) {
      return current
    }
    return implicitDashboardId(this._current_view_id)
  }

  /**
   * L'ordre de navigation des TABLEAUX DE BORD : la seule liste du sélecteur, des flèches et de F8/F9
   * (règle du repli automatique, cf. `Class_DashboardsStore.navigationOrder`).
   */
  public get dashboard_navigation_order(): string[] {
    return this.menu_configuration.dashboards.navigationOrder(this.views_navigation_order, this._current_sheet_id)
  }

  public get has_dashboard_before(): boolean {
    return this.dashboard_navigation_order.indexOf(this.current_dashboard_id) > 0
  }

  public get has_dashboard_after(): boolean {
    const order = this.dashboard_navigation_order
    // Courante hors liste (maître non affiché) => Suiv. va vers la première.
    return order.length > 0 && order.indexOf(this.current_dashboard_id) < order.length - 1
  }

  /** Le libellé d'un tableau de bord : le sien, ou celui de la vue pour une implicite. */
  public dashboardName(id: string): string {
    const view_id = viewIdOfImplicitDashboard(id)
    if (view_id !== null) {
      return view_id === default_main_sankey_id ? this._master_view_name : (this._views[view_id]?.name ?? view_id)
    }
    return this.menu_configuration.dashboards.byId(id)?.name ?? id
  }

  /**
   * LA VUE PRINCIPALE d'un tableau de bord (celle de son canevas sur la feuille courante, sinon de sa
   * première fenêtre diagramme de la feuille courante), ou `null` : c'est elle dont la vignette
   * représente le tableau de bord, et elle que le canevas principal reçoit à l'activation.
   */
  public dashboardMainViewId(id: string): string | null {
    const view_id = viewIdOfImplicitDashboard(id)
    if (view_id !== null) return view_id
    const dashboard = this.menu_configuration.dashboards.byId(id)
    if (!dashboard) return null
    const refs = dashboardViewRefs(dashboard.main_zone)
      .filter(r => r.sheet === '' || r.sheet === this._current_sheet_id)
    const canvas = refs.find(r => r.representation === MAIN_ZONE_CANVAS_ID)
    return (canvas ?? refs[0])?.view ?? null
  }

  /**
   * ACTIVER un tableau de bord. Implicite : la vue, sans toucher à la disposition — ce que faisait une
   * vue sans `view_main_zone`. Explicite : la GRILLE d'abord (`mainZoneStateFromJSON`), pour que
   * le dessin se cadre d'emblée dans la bonne géométrie, puis la vue demandée sur chaque
   * document : le principal pour la feuille courante, le document de feuille pour une fenêtre
   * dépaysée (`sheetApplication` le charge au besoin).
   *
   * `interactive` : le chemin du geste d'utilisateur (indicateur + cession de la main,
   * `requestViewChange`) ; `false` = le chemin programmatique, strictement synchrone.
   */
  public activateDashboard(id: string, interactive: boolean = true): void | Promise<void> {
    const dashboards = this.menu_configuration.dashboards
    const switchTo = (view_id: string): void | Promise<void> =>
      interactive ? this.requestViewChange(view_id) : this.setCurrentView(view_id)
    const implicit_view = viewIdOfImplicitDashboard(id)
    if (implicit_view !== null) {
      if (implicit_view !== default_main_sankey_id && !this._views[implicit_view]) return
      dashboards.current = id
      if (implicit_view === this._current_view_id) return
      return switchTo(implicit_view)
    }
    const dashboard = dashboards.byId(id)
    if (!dashboard) return
    dashboards.current = id
    dashboards.activating = true
    let result: void | Promise<void> = undefined
    try {
      // os#1492 — L'ONGLET D'ABORD. Un tableau de bord retient la feuille qui était au premier plan, et
      // la rétablit avant tout le reste : basculer remplace la zone de dessin et ferme les
      // fenêtres épinglées sur la feuille quittée (`switchToSheet`), donc le faire APRÈS aurait
      // défait la grille qu'on vient de poser. Sans cette bascule, activer depuis un autre
      // onglet ne rejouait qu'une moitié de le tableau de bord — ses fenêtres sans son diagramme.
      // `dashboards.activating` protège le tableau de bord courante : la bascule ne doit pas nous en sortir.
      if (dashboard.sheet && dashboard.sheet !== this._current_sheet_id && this._sheets[dashboard.sheet]) {
        this.switchToSheet(dashboard.sheet, false)
      }
      this.menu_configuration.mainZoneStateFromJSON(dashboard.main_zone)
      // Les fenêtres dépaysées d'abord, en synchrone : elles ne passent pas par le voile.
      const refs = dashboardViewRefs(dashboard.main_zone)
      refs.filter(r => r.sheet !== '' && r.sheet !== this._current_sheet_id).forEach(r => {
        const doc = this.sheetApplication(r.sheet)
        if (!doc || doc === this) return
        if (r.view !== default_main_sankey_id && !doc.views_dict[r.view]) return
        if (doc.current_view_id !== r.view) doc.setCurrentView(r.view)
      })
      const main_view = this.dashboardMainViewId(id)
      if (main_view !== null && main_view !== this._current_view_id
        && (main_view === default_main_sankey_id || this._views[main_view])) {
        result = switchTo(main_view)
      } else {
        // Pas de bascule de vue : la grille vient de changer, le dessin doit se recadrer.
        this.menu_configuration.updateAllMenuComponents()
      }
    } finally {
      if (result) void Promise.resolve(result).finally(() => { dashboards.activating = false })
      else dashboards.activating = false
    }
    return result
  }

  public setCurrentDashboardToNext(): void | Promise<void> {
    if (!this.has_dashboard_after) return
    const order = this.dashboard_navigation_order
    return this.activateDashboard(order[order.indexOf(this.current_dashboard_id) + 1])
  }

  public setCurrentDashboardToPrev(): void | Promise<void> {
    if (!this.has_dashboard_before) return
    const order = this.dashboard_navigation_order
    return this.activateDashboard(order[order.indexOf(this.current_dashboard_id) - 1])
  }

  /**
   * CAPTURER L'ÉCRAN : la disposition de la grande zone, et pour chaque fenêtre diagramme la vue
   * que son document montre en ce moment (le principal pour la feuille courante, le document de
   * feuille pour une fenêtre dépaysée). C'est ce qu'un tableau de bord fige.
   */
  /**
   * os#1492 — SORTIR DE LE TABLEAU DE BORD COURANTE, parce que l'écran ne lui ressemble plus.
   *
   * Appelé quand l'utilisateur change d'onglet lui-même : le tableau de bord décrivait une feuille au
   * premier plan, ce n'est plus celle-là. La laisser marquée courante faisait mentir le
   * sélecteur, qui affichait « 1. Lire la filière » alors qu'on regardait une autre feuille.
   * Sans tableau de bord courante, `current_dashboard_id` retombe sur le tableau de bord implicite de la vue courante
   * — donc sur ce qu'on regarde vraiment.
   *
   * Muet pendant une activation : c'est elle qui bascule l'onglet, et elle sait ce qu'elle fait.
   */
  public leaveCurrentDashboard(): void {
    const dashboards = this.menu_configuration?.dashboards
    if (!dashboards || dashboards.activating) return
    dashboards.current = null
  }

  public captureDashboardMainZone(): Type_JSON {
    const main_zone = this.menu_configuration.mainZoneStateToJSON()
    const raw = main_zone['occupants'] as Type_JSON
    this.menu_configuration.main_zone_occupants.forEach(o => {
      if (o.subject.kind !== 'diagram') return
      const entry = raw[o.id] as Type_JSON | undefined
      if (!entry) return
      const sheet = mainZoneSubjectSheet(o.subject)
      const doc = (sheet === '' || sheet === this._current_sheet_id) ? this : this.sheetApplication(sheet)
      const view = doc ? doc.current_view_id : mainZoneSubjectView(o.subject)
      if (view === '') return
      const subject = { ...(entry['subject'] as Type_JSON ?? { kind: 'diagram' }), view }
      entry['subject'] = subject
    })
    return main_zone
  }

  /** Crée un tableau de bord depuis l'écran, la rend courante, et la rend. */
  public createDashboardFromScreen(name: string): Type_Dashboard {
    const dashboards = this.menu_configuration.dashboards
    const dashboard: Type_Dashboard = { id: dashboards.newId(), name: name.trim() || 'Tableau de bord', main_zone: this.captureDashboardMainZone() }
    // os#1492 — l'onglet actif fait partie de ce qu'on capture (cf. `Type_Dashboard.sheet`).
    if (this._current_sheet_id !== '') dashboard.sheet = this._current_sheet_id
    dashboards.add(dashboard)
    dashboards.current = dashboard.id
    return dashboard
  }

  /** Recapture l'écran dans un tableau de bord existante. */
  public updateDashboardFromScreen(id: string): boolean {
    const dashboard = this.menu_configuration.dashboards.byId(id)
    if (!dashboard) return false
    dashboard.main_zone = this.captureDashboardMainZone()
    if (this._current_sheet_id !== '') dashboard.sheet = this._current_sheet_id
    else delete dashboard.sheet
    return true
  }

  public deleteDashboard(id: string): boolean {
    return this.menu_configuration.dashboards.remove(id)
  }

  // ESPACE DE TRAVAIL DANS LE FICHIER (os#1385, lot 4, D8) ==============================

  /**
   * Sérialise la clé racine `workspace` : `{ language?, panels? }`.
   *
   * POURQUOI UNE CLÉ À PART. La langue de l'interface et la disposition des panneaux
   * étaient rangées à la racine, au milieu des clés du diagramme, alors qu'elles ne
   * décrivent pas le diagramme : ce sont des préférences de l'ESPACE DE TRAVAIL,
   * partagées par tous les documents ouverts (inventaire 4 §1.2). Les laisser au
   * niveau du document, c'était laisser la feuille B décider de la langue de
   * l'interface et de la largeur de la barre latérale de l'utilisateur.
   *
   * ÉCRITE PAR LE PRINCIPAL SEULEMENT, et jamais dans un contenu de feuille
   * (`without_sheets`) — les deux disent la même chose : il n'y a qu'un espace de
   * travail à l'écran, il n'a donc qu'un seul écrivain, et une feuille n'en est pas un.
   * C'est la garde `is_main` du lot 1 (panneaux) et du lot 3 (grande zone), REMPLACÉE
   * ici et non empilée.
   *
   * LA LISTE DES FENÊTRES N'Y ENTRE PAS À CE LOT : depuis le lot 3, `main_zone` (clé
   * racine, écrite par le principal) EST la disposition de l'espace de travail —
   * l'écrire une seconde fois sous `workspace` serait une copie, donc deux vérités.
   * Elle rejoindra `workspace` quand elle se distinguera de la disposition par DÉFAUT
   * du document (lot 6). Les dispositions NOMMÉES, elles, sont les `dashboards` (os#1482).
   *
   * /!\ Clé RACINE : chez OpenSankey+ (fichier avec vues) elle doit être posée AVANT
   * `encodeViewsAsDelta`, comme `sheets`, `library_ref` et `contexts` — la base du
   * delta est « la racine privée de `views` », strictement identique à l'écriture et à
   * la lecture (cf. `sheetsToJSON`).
   */
  protected workspaceToJSON(json_object: Type_JSON, kwargs?: Type_JSON): void {
    if (kwargs && kwargs['without_sheets'] === true) return
    if (!this.is_main) return
    const workspace = {} as Type_JSON
    if (this._language !== undefined) workspace['language'] = this._language
    // OS#300 Lot 4 — tailles + mode des panneaux (barre latérale / pop-ups).
    workspace['panels'] = this.menu_configuration.panels.toJSON()
    json_object['workspace'] = workspace
  }

  /**
   * Relit la clé racine `workspace` (repli sur la racine : `workspaceStateFromJSON`).
   *
   * PAR LE PRINCIPAL SEULEMENT, symétrique de l'écriture : un document secondaire qui
   * se charge (feuille ouverte dans une fenêtre, source Excel, brique) remplacerait
   * sinon la langue et les panneaux de l'utilisateur par ceux enregistrés dans SON
   * entrée du fichier.
   *
   * ET PAS QUAND LE FICHIER NE CHANGE PAS. Deux chargements posent un contenu DANS le
   * fichier déjà ouvert plutôt que d'en ouvrir un autre : `keep_file_state` (bascule de
   * feuille, nouvelle feuille) et `only_current_view` (bascule de vue). L'espace de
   * travail ne change donc pas non plus — et la langue est REPOSÉE telle qu'elle était,
   * parce que la relecture de la zone de dessin vient de l'écraser depuis la clé racine
   * `language` que ni un contenu de feuille ni une entrée de vue ne portent.
   *
   * Lire l'espace de travail sur ces chemins-là serait pire qu'inutile : une entrée de
   * vue DÉCODÉE porte la base du delta, donc les clés racines d'un fichier ANTÉRIEUR —
   * chaque bascule de vue rejouerait la barre latérale du fichier par-dessus celle de
   * l'utilisateur.
   *
   * `language` n'est posée que si le fichier en dit une : sinon on garde ce que la
   * zone de dessin a lu (fichier antérieur), et donc l'état d'avant.
   */
  protected workspaceFromJSON(
    json_object: Type_JSON,
    kwargs: Type_JSON | undefined,
    language_before: string | undefined
  ): void {
    if (kwargs && (kwargs['keep_file_state'] === true || kwargs['only_current_view'])) {
      this._language = language_before
      return
    }
    if (!this.is_main) return
    const state = workspaceStateFromJSON(json_object)
    if (state.language !== undefined) this._language = state.language
    // Garde défensive `?.` : `menu_configuration` n'est posée que par
    // `createNewMenuConfiguration` (cf. `main_zone` ci-dessus).
    if (state.panels) this.menu_configuration?.panels.fromJSON(state.panels)
  }

  // FEUILLES DE DESSIN (OS#85) =========================================================
  // Le document peut porter PLUSIEURS feuilles (diagrammes indépendants), naviguées par
  // des onglets en bas de la grande zone. Voir le bloc « ÉTAT DES FEUILLES » plus haut.

  /**
   * Sérialise la clé racine `sheets` : `{ current, order, entries: { id: { name, json? } } }`.
   * L'entrée de la feuille COURANTE n'a pas de `json` : la racine du fichier est son contenu
   * (un lecteur qui ignore `sheets` affiche donc la feuille courante, sans rien perdre).
   *
   * /!\ Chez OpenSankey+ (fichier avec vues), cette clé doit être écrite AVANT
   * encodeViewsAsDelta : la base du delta = la racine privée de `views`, STRICTEMENT
   * identique à l'écriture et à la lecture — sinon chaque vue hériterait de `sheets`
   * (même piège que les vignettes de vues, cf. ApplicationDataOSP._toJSON).
   */
  protected sheetsToJSON(json_object: Type_JSON, kwargs?: Type_JSON): void {
    // `without_sheets` : sérialisation du CONTENU d'une feuille (snapshot) — la clé
    // racine `sheets` n'y a pas sa place, sinon chaque feuille embarquerait les autres.
    if (kwargs && kwargs['without_sheets'] === true) return
    if (this._sheets_order.length === 0) return
    const entries = {} as Type_JSON
    this._sheets_order.forEach(id => {
      const sheet = this._sheets[id]
      if (!sheet) return
      const entry = { name: sheet.name } as Type_JSON
      const is_sankey = isSankeySheetType(sheet.type)
      // os#1385 (lot 4, D8) — LE TYPE, écrit seulement s'il dit autre chose que `'sankey'` :
      // un document qui n'a que des feuilles Sankey — c'est-à-dire tous ceux d'aujourd'hui —
      // se réécrit octet pour octet identique, et aucun lecteur antérieur ne voit rien changer.
      if (!is_sankey) entry['type'] = sheet.type as string
      if (id !== this._current_sheet_id) {
        // os#1385 (lot 3, D6) — UN DOCUMENT VIVANT EST LA VÉRITÉ, son instantané ne l'est
        // plus. Depuis qu'une feuille ouverte dans une fenêtre est ÉDITABLE, son instantané
        // date du moment où elle a cessé d'être courante : l'enregistrer reviendrait à jeter
        // tout ce que l'utilisateur vient d'y faire. On la sérialise donc EN L'APPELANT.
        //
        // `toSheetContentJSON()` enveloppe SA zone de dessin dans `withBypassRedraws`, pas
        // celle du porteur : la sérialisation OSP d'un document à vues recapture la vue
        // courante depuis la zone vivante, et c'est la zone de CE document-là qu'il ne faut
        // pas laisser redessiner pendant qu'on la lit.
        //
        // os#1385 (lot 5, D9) — PAR LE TYPE, et non plus par un appel câblé : c'est le type qui
        // sait comment SON document redevient un contenu d'entrée. Le défaut (sankey) est
        // exactement l'appel d'avant, et un type inconnu n'a de toute façon jamais de document
        // vivant (`sheetApplication` rend `null`) : son instantané passe par la branche suivante,
        // intact.
        const live = this._sheet_apps[id]?.app
        const live_type = document_type_registry.typeOf(sheet)
        if (live && !live.disposed && live_type) {
          entry['json'] = live_type.serialize(live)
        } else if (sheet.json) {
          entry['json'] = JSON.parse(pako.inflate(sheet.json, { to: 'string' })) as Type_JSON
        }
      } else if (!is_sankey && sheet.json) {
        // os#1385 (lot 4, D8) — RÈGLE DE LA RACINE. La feuille courante n'a d'ordinaire pas
        // de `json` : la racine du fichier EST son contenu. Mais la racine doit rester un
        // SANKEY — tous les lecteurs hors éditeur en supposent un (viewer, parc publié,
        // serveur, SEP, cartofob) —, donc une feuille courante d'un autre type porte son
        // contenu ICI, et la racine garde le dernier Sankey actif.
        entry['json'] = JSON.parse(pako.inflate(sheet.json, { to: 'string' })) as Type_JSON
      }
      entries[id] = entry
    })
    json_object['sheets'] = {
      current: this._current_sheet_id,
      order: [...this._sheets_order],
      entries
    } as unknown as Type_JSON
  }

  /**
   * Relit la clé racine `sheets`. Un fichier ancien (sans la clé) ou une clé malformée
   * chargent SANS BRUIT un document mono-feuille : l'état feuilles reste vide.
   */
  protected sheetsFromJSON(json_object: Type_JSON): void {
    const raw = json_object['sheets']
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return
    const sheets_json = raw as Type_JSON
    const order = sheets_json['order']
    const entries = sheets_json['entries']
    const current = sheets_json['current']
    if (!Array.isArray(order) || !entries || typeof entries !== 'object' || Array.isArray(entries) || typeof current !== 'string') return
    const entries_json = entries as Type_JSON
    const valid_order = (order as unknown[]).filter(
      (id): id is string => typeof id === 'string' && !!entries_json[id] && typeof entries_json[id] === 'object'
    )
    if (valid_order.length === 0 || !valid_order.includes(current)) return
    const sheets: { [id: string]: Type_SheetEntry } = {}
    valid_order.forEach(id => {
      const entry = entries_json[id] as Type_JSON
      const name = typeof entry['name'] === 'string' && entry['name'] !== '' ? entry['name'] as string : this._defaultSheetName(1)
      // os#1385 (lot 4, D8) — le TYPE est CONSERVÉ tel quel, même inconnu de cette version :
      // le registre des types arrive au lot 5, et transporter une entrée qu'on ne sait pas
      // afficher vaut infiniment mieux que la perdre à la première sauvegarde.
      const raw_type = entry['type']
      const type = (typeof raw_type === 'string' && raw_type !== '') ? raw_type : undefined
      const content = entry['json']
      let json: Uint8Array | undefined = undefined
      // os#1385 (lot 4, D8) — LA COURANTE AUSSI, quand elle en porte un. Jusqu'ici le `json`
      // d'une entrée courante était ignoré (la racine était forcément son contenu) ; avec la
      // règle de la racine, une feuille courante d'un autre type porte le sien, et l'ignorer
      // reviendrait à jeter son contenu à la relecture.
      if (content && typeof content === 'object' && !Array.isArray(content)) {
        // Défense en profondeur : le contenu d'une feuille ne doit jamais porter lui-même
        // une clé `sheets` (pas de récursion) — on la retire si un fichier bricolé en a une.
        const content_json = { ...(content as Type_JSON) }
        delete content_json['sheets']
        json = compressJSONToGzip(content_json)
      }
      sheets[id] = { name, type, json }
    })
    // La feuille courante est portée par la racine du fichier (état vivant) : pas de snapshot.
    this._sheets = sheets
    this._sheets_order = valid_order
    this._current_sheet_id = current
  }

  /** Nom par défaut d'une feuille (« Feuille N », traduit quand i18n est branché). */
  protected _defaultSheetName(n: number): string {
    const raw = this.t('sheets.sheet') as unknown
    const base = (typeof raw === 'string' && raw !== '' && raw !== 'sheets.sheet') ? raw : 'Feuille'
    return base + ' ' + n
  }

  /**
   * Contenu de CE document comme contenu de feuille : sérialisation COMPLÈTE (diagramme +
   * vues + doc + réglages) SANS la clé racine `sheets` — c'est exactement ce que serait le
   * fichier si cette feuille était seule.
   *
   * PUBLIQUE depuis os#1385 (lot 3) : ce n'est plus seulement « ma feuille courante », c'est
   * « mon contenu, vu comme une feuille » — et c'est ce que le document PORTEUR demande à
   * chaque document de feuille vivant quand il sérialise le fichier (cf. `sheetsToJSON`).
   */
  public toSheetContentJSON(): Type_JSON {
    return this.drawing_area.withBypassRedraws(() => this._toJSON({ without_sheets: true }) as Type_JSON)
  }

  /**
   * Charge le contenu d'une feuille dans CE document, en restant DANS le fichier ouvert.
   *
   * os#1385 (lot 3) — PLUS DE STASH/RESTORE. `fromJSON` passait par `reset()`, qui effaçait
   * les feuilles (sémantique « j'ouvre un autre fichier »), et il fallait sauver puis
   * replacer `_sheets`, `_sheets_order`, `_current_sheet_id` et `_sheet_apps` autour de
   * l'appel. La séparation `resetFile()` / `resetDocument()` rend le contournement inutile :
   * `keep_file_state` dit que le fichier n'est pas concerné, et rien n'est effacé.
   *
   * Ce que le contournement ne rattrapait PAS, et qui est réparé du même coup : la provenance
   * sankeythèque, qu'il n'avait pas pensé à sauver — une étude ouverte depuis la galerie
   * perdait son « réenregistrer en place » à la première bascule d'onglet (inventaire 4 §2).
   */
  protected _loadSheetContent(json_object: Type_JSON, draw: boolean): void {
    // os#1386 — les documents des AUTRES feuilles traversent l'opération : une bascule de
    // feuille ne change pas leurs instantanés, donc les recharger serait payer O(feuille)
    // pour un modèle identique. La feuille CIBLE, elle, a été libérée par `switchToSheet`
    // avant qu'on n'en lise l'instantané : son document ne peut plus être périmé.
    this.fromJSON(json_object, { keep_file_state: true } as Type_JSON, draw)
  }

  /**
   * Enregistre le document courant comme première feuille si le document n'en a pas encore
   * (passage du monde mono-feuille au monde multi-feuilles). Idempotent.
   */
  protected _ensureSheetsInitialized(): void {
    if (this._sheets_order.length > 0) return
    const id = makeId('sheet')
    this._sheets[id] = { name: this._defaultSheetName(1) }
    this._sheets_order = [id]
    this._current_sheet_id = id
  }

  /** Rafraîchit le snapshot gzip de la feuille courante depuis l'état vivant. */
  protected _snapshotCurrentSheet(): void {
    const current = this._sheets[this._current_sheet_id]
    if (current) current.json = compressJSONToGzip(this.toSheetContentJSON())
  }

  /**
   * Crée une NOUVELLE feuille (diagramme vierge, indépendant — règle des deux niveaux :
   * pour une lecture qui SUIT les données, c'est une vue qu'il faut créer) et bascule dessus.
   * @returns l'id de la feuille créée.
   */
  public createNewSheet(draw: boolean = true): string {
    this._ensureSheetsInitialized()
    this._snapshotCurrentSheet()
    // Diagramme vierge : sérialisation d'une drawing area neuve (et non `{}`, qu'un
    // chargement sans clé `version` enverrait dans le convertisseur legacy pré-0.9).
    const blank_da = this.createNewDrawingArea()
    blank_da.bypass_redraws = true
    const blank_json = this.dumpDrawingAreaToJSON(blank_da)
    blank_da.delete()
    const name = this._defaultSheetName(this._sheets_order.length + 1)
    // os#1433 — UNE FEUILLE VIERGE N'A QU'UNE FENÊTRE, la zone de dessin (arbitrage de Julien).
    // Pas seulement les épinglées : TOUTES. Une page blanche n'a rien dont un tableur, une doc
    // ou une couronne puissent parler, et garder la mise en page devant elle oblige à fermer les
    // fenêtres une par une avant de pouvoir travailler. Cf. `resetMainZoneToCanvas`, qui dit
    // aussi pourquoi BASCULER vers une feuille qui existe, à l'inverse, garde la grille.
    this.menu_configuration?.resetMainZoneToCanvas()
    // os#1492 — et on sort de le tableau de bord courante, pour la même raison qu'à la bascule : une page
    // blanche, dont on vient de vider les fenêtres, ne ressemble à aucun tableau de bord composée.
    this.leaveCurrentDashboard()
    this._loadSheetContent(blank_json, draw)
    const id = makeId('sheet')
    this._sheets[id] = { name }
    this._sheets_order.push(id)
    this._current_sheet_id = id
    this.menu_configuration?.ref_to_save_in_cache_indicator.current(true)
    this.menu_configuration?.ref_to_sheet_tabs_updater.current()
    return id
  }

  /**
   * Duplique la feuille courante en NOUVELLE FEUILLE INDÉPENDANTE (les données ne se
   * propageront pas — le pendant « suivra les données » est la création d'une VUE).
   * Le contenu affiché ne change pas : seule l'identité de feuille change.
   * @returns l'id de la feuille créée.
   */
  public duplicateCurrentSheetAsNewSheet(): string {
    this._ensureSheetsInitialized()
    this._snapshotCurrentSheet()
    const source = this._sheets[this._current_sheet_id]
    const id = makeId('sheet')
    // Insérée juste après la feuille source, comme draw.io.
    const idx = this._sheets_order.indexOf(this._current_sheet_id)
    this._sheets[id] = { name: this._copyPrefix() + source.name }
    this._sheets_order.splice(idx + 1, 0, id)
    this._current_sheet_id = id
    this.menu_configuration?.ref_to_save_in_cache_indicator.current(true)
    this.menu_configuration?.ref_to_sheet_tabs_updater.current()
    return id
  }

  /**
   * os#1443 — DUPLIQUER N'IMPORTE QUELLE FEUILLE, courante ou non.
   *
   * Ce corps vivait dans la barre d'onglets (`SheetTabs.tsx`), et l'audit du 19/09 le relevait :
   * un composant y choisissait la SOURCE DE VÉRITÉ d'une feuille, décompressait un instantané et
   * nommait la copie — trois décisions de modèle, invérifiables sans monter du React, et que la
   * prochaine surface qui voudrait dupliquer aurait dû réécrire. Rien d'autre n'a changé : le
   * comportement est celui d'avant, à la virgule près.
   *
   * `duplicateCurrentSheetAsNewSheet` ne sait partir que de la feuille VIVANTE : elle en prend
   * l'instantané et le nomme. Une feuille classeur n'est JAMAIS la courante — elle n'a pas de
   * canevas —, donc ce chemin ne l'aurait jamais atteinte. Pour les autres, on duplique ce que
   * la feuille EST : son contenu et son TYPE (sans le type, la copie d'un classeur se relirait
   * comme un Sankey de plus).
   *
   * LE CONTENU VIENT DU DOCUMENT VIVANT quand il y en a un (la feuille est ouverte dans une
   * fenêtre et on y a travaillé) : c'est lui la vérité, l'instantané date de son ouverture
   * (lot 3, D6). `sheetApplication` rend ce document, ou le charge depuis l'instantané — dans
   * les deux cas, ce qu'il sérialise est à jour. L'instantané brut n'est le repli que pour un
   * type sans chargeur, où il n'y a rien d'autre à copier.
   *
   * La copie est ajoutée EN FIN de barre (`addSheetFromJSON`), là où la duplication de la
   * courante l'insère juste après sa source : différence assumée, `addSheetFromJSON` n'offre
   * pas de position et un classeur n'a pas de voisinage qui veuille dire quelque chose.
   *
   * @returns l'id de la feuille créée, ou `null` quand il n'y a rien à dupliquer (feuille
   *   inconnue, ou type sans chargeur et sans instantané).
   */
  public duplicateSheet(sheet_id: string): string | null {
    if (!this.has_sheets) return null
    if (sheet_id === '' || sheet_id === this._current_sheet_id) {
      return this.duplicateCurrentSheetAsNewSheet()
    }
    const entry = this._sheets[sheet_id]
    if (!entry) return null
    const type = this.sheetType(sheet_id)
    // Le document vivant s'il existe, chargé sinon — mais jamais `this` : la feuille courante
    // est partie par la branche du dessus, et `sheetApplication` rend `this` en cas de
    // ré-entrance (chargement en cours), ce qui sérialiserait le mauvais diagramme.
    const doc = type ? this.sheetApplication(sheet_id) : null
    let content: Type_JSON | null = null
    if (type && doc && doc !== this) content = type.serialize(doc)
    else if (entry.json) content = JSON.parse(pako.inflate(entry.json, { to: 'string' })) as Type_JSON
    if (!content) return null
    return this.addSheetFromJSON(content, {
      name: this._copyPrefix() + entry.name,
      type: entry.type
    })
  }

  /**
   * os#1443 — « Copie de », ou le repli quand les catalogues ne sont pas chargés.
   *
   * `t()` rend la CLÉ quand la traduction manque (et `null` sous jest, où rien n'est chargé) :
   * sans ce garde-fou, une feuille dupliquée s'appellerait « sheets.copy_prefixVentes ». Le
   * même repli existait aux deux endroits qui dupliquent ; il n'en existe plus qu'un.
   */
  protected _copyPrefix(): string {
    const raw = this.t('sheets.copy_prefix') as unknown
    return (typeof raw === 'string' && raw !== 'sheets.copy_prefix') ? raw : 'Copie de '
  }

  /**
   * os#1385 (lot 5, D9) — AJOUTE UNE FEUILLE DEPUIS UN JSON DÉJÀ CONSTRUIT, SANS BASCULER.
   *
   * Le geste d'IMPORT : un classeur Excel converti, un diagramme reçu d'ailleurs, arrive comme
   * une feuille DE PLUS du document ouvert. Trois différences avec `createNewSheet`, et elles
   * sont toutes les trois le sujet du lot :
   *  - le contenu vient du DEHORS (il n'est pas une zone de dessin vierge) ;
   *  - la feuille porte un TYPE, qui peut n'être pas un Sankey ;
   *  - **on ne bascule pas** : la feuille courante ne change pas, la racine du fichier non plus
   *    (règle de la racine, D8), et un type sans canevas ne pourrait de toute façon pas devenir
   *    courant. L'appelant OUVRE ensuite une FENÊTRE sur elle, par la fenêtre par défaut de son
   *    type (`sheetType(id)?.defaultWindow`).
   *
   * @param json contenu de la feuille (JSON d'un document, tel que `toSheetContentJSON`).
   * @param options `name` : nom de l'onglet (vide = nom par défaut) ; `type` : type du document
   *   porté (absent ou `'sankey'` = un Sankey, et l'entrée ne gagne alors aucune clé).
   * @returns l'id de la feuille créée.
   */
  public addSheetFromJSON(json: Type_JSON, options?: { name?: string, type?: string }): string {
    // Le document mono-feuille devient multi-feuilles : sa feuille 1, c'est ce qu'on a sous les
    // yeux, et elle doit exister AVANT qu'on en ajoute une seconde.
    this._ensureSheetsInitialized()
    // Défense en profondeur, comme à la relecture (`sheetsFromJSON`) : le contenu d'une feuille
    // ne porte jamais lui-même une clé `sheets` — sinon chaque feuille embarquerait les autres.
    const content = { ...json }
    delete content['sheets']
    const id = makeId('sheet')
    const raw_name = (options?.name ?? '').trim()
    const name = raw_name !== '' ? raw_name : this._defaultSheetName(this._sheets_order.length + 1)
    const type = options?.type
    // `type` écrit seulement s'il dit autre chose que `'sankey'` (lot 4) : un document qui
    // n'ajoute que des feuilles Sankey se réécrit sans gagner une seule clé.
    this._sheets[id] = (type !== undefined && type !== SANKEY_DOCUMENT_TYPE)
      ? { name, type, json: compressJSONToGzip(content) }
      : { name, json: compressJSONToGzip(content) }
    this._sheets_order.push(id)
    this.menu_configuration?.ref_to_save_in_cache_indicator.current(true)
    this.menu_configuration?.ref_to_sheet_tabs_updater.current()
    return id
  }

  /**
   * os#1385 (lot 5, D9) — LE TYPE DE DOCUMENT d'une feuille (cf. `DocumentTypeRegistry`).
   *
   * `null` pour une feuille inconnue, et pour une feuille d'un type que cette version ne connaît
   * pas : son entrée se transporte sans se comprendre (lot 4). L'appelant le DIT à l'écran.
   * Le point d'entrée unique de l'écran vers le registre — `has_canvas`, `defaultWindow`,
   * `offers` et `icon` se lisent tous à travers lui.
   */
  public sheetType(id: string): Type_DocumentType | null {
    const entry = this._sheets[id]
    return entry ? document_type_registry.typeOf(entry) : null
  }

  /**
   * Bascule vers une autre feuille : snapshot de la courante, puis chargement du snapshot
   * de la cible (même mécanique que les vues : unDraw + remplacement de la drawing_area,
   * via fromJSON/reset). L'historique undo/redo repart de zéro (comme à tout chargement).
   */
  public switchToSheet(id: string, draw: boolean = true): void {
    if (!this.has_sheets || id === this._current_sheet_id) return
    const target = this._sheets[id]
    if (!target || !target.json) return
    // os#1385 (lot 4, D8) — ON NE BASCULE PAS SUR UN DOCUMENT QUI N'A PAS DE CANEVAS. Basculer,
    // c'est faire de cette feuille la RACINE du fichier et charger son contenu dans la zone de
    // dessin : un document qui ne se montre pas dans un canevas (un classeur et ses graphiques)
    // n'a rien à y mettre, et la racine doit rester un Sankey pour tous les lecteurs qui en
    // supposent un (viewer, parc publié, serveur, SEP, cartofob).
    //
    // os#1385 (lot 5, D9) — la question posée n'est plus « est-ce un Sankey ? » mais « ce type
    // a-t-il un canevas ? » (`has_canvas`), et un type INCONNU se refuse comme avant : on
    // transporte son entrée, on ne l'ouvre pas. Sa feuille s'ouvre en FENÊTRE, par la fenêtre
    // par défaut de son type (cf. `Type_DocumentType.defaultWindow`).
    const target_type = document_type_registry.typeOf(target)
    if (!target_type || !target_type.has_canvas) {
      console.warn(
        'os#1385 — la feuille « ' + target.name + ' » est de type « ' + (target.type ?? SHEET_TYPE_SANKEY) +
        ' » : ' + (target_type ? 'ce type n\'a pas de canevas' : 'aucun lecteur pour ce type') +
        ', bascule refusée.'
      )
      return
    }
    // os#1385 (lot 3, D6) — LA CIBLE CESSE DE VIVRE AVANT QU'ON N'EN LISE L'INSTANTANÉ.
    // Si une fenêtre l'avait ouverte et qu'on y a travaillé, son instantané date d'avant :
    // le charger tel quel afficherait un diagramme périmé et perdrait le travail. On le
    // réécrit donc depuis le document vivant, puis on dispose celui-ci — la feuille devient
    // courante, elle EST l'état vivant, il n'y a plus de second document à tenir.
    this.releaseSheetDocument(id)
    // Relu APRÈS la libération : c'est elle qui vient, le cas échéant, de réécrire l'instantané.
    const target_snapshot = this._sheets[id]?.json
    if (!target_snapshot) return
    this._snapshotCurrentSheet()
    // os#1433 — les fenêtres épinglées sur les éléments de la feuille qu'on QUITTE s'en vont
    // avec elle (cf. `closeWindowsPinnedOnSheet`, qui dit ce qui survit et pourquoi). Fermées
    // APRÈS l'instantané — il doit décrire la feuille telle qu'on l'a travaillée — et AVANT le
    // chargement, pour qu'aucune d'elles ne tente de se résoudre sur le diagramme d'arrivée.
    this.menu_configuration?.closeWindowsPinnedOnSheet(this._current_sheet_id)
    // os#1492 — CHANGER D'ONGLET SORT DE LE TABLEAU DE BORD. Un tableau de bord retient la feuille qui était au
    // premier plan ; dès qu'on en change soi-même, elle ne décrit plus l'écran. No-op quand
    // c'est une activation de tableau de bord qui bascule (cf. `leaveCurrentDashboard`).
    this.leaveCurrentDashboard()
    const target_json = JSON.parse(pako.inflate(target_snapshot, { to: 'string' })) as Type_JSON
    this._loadSheetContent(target_json, draw)
    this._current_sheet_id = id
    this.menu_configuration?.ref_to_sheet_tabs_updater.current()
  }

  /** Renomme une feuille (nom vide ignoré). */
  public renameSheet(id: string, name: string): void {
    const sheet = this._sheets[id]
    const trimmed = name.trim()
    if (!sheet || trimmed === '' || sheet.name === trimmed) return
    sheet.name = trimmed
    this.menu_configuration?.ref_to_save_in_cache_indicator.current(true)
    this.menu_configuration?.ref_to_sheet_tabs_updater.current()
  }

  /**
   * os#1385 (lot 5, D9) — LA VOISINE SUR LAQUELLE ON PEUT ATTERRIR : la plus proche qui ait un
   * CANEVAS (précédente d'abord, puis suivante), en s'éloignant d'un cran à la fois.
   *
   * Depuis qu'une feuille peut porter un document sans canevas (un classeur), « la voisine de
   * gauche » n'est plus une réponse : `switchToSheet` la refuserait, et la feuille courante
   * resterait celle qu'on vient de supprimer — un document dont la racine pointe une feuille
   * disparue. `null` = aucune feuille de ce fichier ne peut devenir la racine (cas théorique
   * tant que la règle de la racine tient : le fichier en contient forcément un, puisque la
   * racine EN EST un).
   */
  protected _neighbourSheetWithCanvas(id: string): string | null {
    const idx = this._sheets_order.indexOf(id)
    if (idx < 0) return null
    const hasCanvas = (sheet_id: string): boolean => {
      const entry = this._sheets[sheet_id]
      return !!entry && (document_type_registry.typeOf(entry)?.has_canvas ?? false)
    }
    for (let d = 1; d < this._sheets_order.length; d++) {
      const before = idx - d
      if (before >= 0 && hasCanvas(this._sheets_order[before])) return this._sheets_order[before]
      const after = idx + d
      if (after < this._sheets_order.length && hasCanvas(this._sheets_order[after])) return this._sheets_order[after]
    }
    return null
  }

  /**
   * Supprime une feuille (jamais la dernière). Si c'est la courante, bascule d'abord sur
   * sa voisine (précédente, sinon suivante) — la plus proche qui ait un CANEVAS.
   */
  public deleteSheet(id: string, draw: boolean = true): void {
    if (!this._sheets[id] || this._sheets_order.length < 2) return
    if (id === this._current_sheet_id) {
      const fallback = this._neighbourSheetWithCanvas(id)
      if (!fallback) {
        // os#1385 (lot 5, D9) — REFUS PLUTÔT QU'UN FICHIER SANS RACINE. Supprimer la courante
        // sans pouvoir atterrir laisserait `_current_sheet_id` sur une feuille qui n'existe
        // plus. Théorique sous la règle de la racine ; dit à voix haute plutôt que subi.
        console.warn(
          'os#1385 — suppression refusée : aucune autre feuille de ce document n\'a de canevas ' +
          'où atterrir après « ' + this._sheets[id].name + ' ».'
        )
        return
      }
      this.switchToSheet(fallback, draw)
    }
    delete this._sheets[id]
    // os#1386 — plus d'instantané, donc plus de document de feuille. Les fenêtres qui
    // pointaient cette feuille le découvriront par `sheetApplication`, qui rend `null`,
    // et le diront à l'écran. os#1385 (lot 3) — `dispose()` et NON `releaseSheetDocument` :
    // la feuille n'existe plus, il n'y a aucun instantané à réécrire, seulement un document
    // à démonter et à retirer de l'espace de travail.
    this._sheet_apps[id]?.app.dispose()
    delete this._sheet_apps[id]
    const idx = this._sheets_order.indexOf(id)
    if (idx >= 0) this._sheets_order.splice(idx, 1)
    this.menu_configuration?.ref_to_save_in_cache_indicator.current(true)
    this.menu_configuration?.ref_to_sheet_tabs_updater.current()
  }

  // os#1386 — LIRE UNE AUTRE FEUILLE SANS QUITTER LA SIENNE ==============================
  //
  // La moitié LECTURE du multi-document (NOTE-FENETRES-ET-POINTAGE.md §4bis) : une fenêtre
  // de la grande zone peut pointer un nœud ou un flux d'une AUTRE feuille — son sujet porte
  // alors `sheet` (cf. `Type_MainZoneSubject`) — et le montrer en couronne, en barres, en
  // sunburst ou en Sankey unitaire pendant qu'on travaille sur la sienne.
  //
  // POURQUOI IL FAUT UNE APPLICATION, ET PAS SEULEMENT DU JSON. Les représentations lisent
  // des OBJETS DE MODÈLE — un `Class_NodeElement`, ses flux visibles, ses tags, son
  // sankey — et rien dans l'arbre ne sait tracer une couronne depuis un dictionnaire JSON.
  // L'instantané d'une feuille doit donc être CHARGÉ, dans une application à part, et c'est
  // très exactement ce que l'issue demande : « rendre depuis l'instantané ».
  //
  // os#1385 (lot 3, D6) — CE N'EST PLUS UNE APPLICATION DE LECTURE, C'EST UN DOCUMENT VIVANT.
  // Le contrat « lecture seule » d'os#1386 tombe : le document d'une feuille ouverte dans une
  // fenêtre s'édite dès qu'on lui en donne le droit (`edition_allowed`), et c'est LUI la
  // vérité de cette feuille tant qu'il vit — `sheetsToJSON` le sérialise en l'appelant, et
  // l'instantané n'est réécrit qu'au moment où il cesse de vivre (`releaseSheetDocument`).

  /**
   * os#1385 (lot 3, D6) — REMETTRE UNE FEUILLE EN INSTANTANÉ ET LIBÉRER SON DOCUMENT.
   *
   * Le geste symétrique de `sheetApplication` : « cette feuille cesse de vivre ». On écrit
   * d'abord l'instantané DEPUIS le document vivant — c'est lui la vérité, celui d'avant est
   * périmé de tout ce qu'on y a fait —, puis on démonte le document.
   *
   * Publique parce que c'est la phase B qui l'appellera en fermant la fenêtre d'une feuille.
   * Sans effet quand la feuille n'a pas de document vivant, ou quand c'est la feuille
   * courante (elle EST l'état vivant, il n'y a rien à libérer).
   */
  public releaseSheetDocument(sheet_id: string): void {
    const entry = this._sheet_apps[sheet_id]
    if (!entry) return
    delete this._sheet_apps[sheet_id]
    const sheet = this._sheets[sheet_id]
    if (sheet && !entry.app.disposed) {
      sheet.json = compressJSONToGzip(entry.app.toSheetContentJSON())
    }
    // Le verrou du chargement, posé ici pour la raison SYMÉTRIQUE : `dispose()` retire le
    // document de l'espace de travail, ce qui recalcule l'ACTIF — et si une fenêtre regarde
    // encore cette feuille, résoudre l'actif repasse par `sheetApplication`, qui rechargerait
    // à l'instant le document qu'on est en train de libérer.
    this._sheet_apps_loading.add(sheet_id)
    try {
      entry.app.dispose()
    } finally {
      this._sheet_apps_loading.delete(sheet_id)
    }
  }

  /**
   * Le DOCUMENT qui porte le modèle d'une feuille.
   *
   * Rend `this` pour la feuille COURANTE (elle est l'état vivant, il n'y a rien à charger)
   * et pour un `sheet_id` vide (un sujet sans feuille désigne la feuille courante, c'est la
   * convention de `Type_MainZoneSubject`). Rend `null` quand la feuille a disparu ou n'a pas
   * d'instantané : l'appelant le DIT à l'écran, il ne casse rien — une fenêtre épinglée sur
   * une feuille supprimée est une fenêtre sans sujet, pas une erreur.
   *
   * LE COÛT, ET LE CACHE. Charger un instantané est O(feuille) : décompression, parsing,
   * construction du modèle complet, vues comprises. C'est une dépense d'OUVERTURE, pas de
   * rendu — elle ne doit être payée ni à chaque dessin, ni à chaque redessin, ni à chaque
   * re-rendu React de la fenêtre, qui sont tous bien plus fréquents. D'où ce cache par
   * feuille, dont l'invalidation tient en trois portes :
   *
   *  - L'INSTANTANÉ LUI-MÊME est la clé, par l'identité de son `Uint8Array` et non par un
   *    hachage : `_snapshotCurrentSheet` REMPLACE le tableau chaque fois qu'une feuille
   *    cesse d'être courante, et `sheetsFromJSON` les recrée tous. Comparer la référence
   *    suffit donc à voir « cette feuille a changé », pour un coût nul.
   *  - `resetFile()` vide le cache : les feuilles appartiennent au FICHIER, charger un autre
   *    fichier les efface toutes, et dispose leurs documents avec.
   *  - `deleteSheet` retire l'entrée de la feuille supprimée.
   *
   * os#1385 (lot 3) — LA CLÉ NE CHANGE PAS, ET C'EST COHÉRENT AVEC LE DOCUMENT VIVANT. Un
   * instantané n'est réécrit que dans deux cas : la feuille était courante (elle n'avait donc
   * pas de document vivant à elle), ou un fichier vient d'être chargé (tout a été disposé).
   * Jamais pendant qu'un document vivant porte la feuille — c'est `releaseSheetDocument` qui
   * écrit, et il dispose dans le même geste. L'invariant « le vivant est la vérité » tient
   * donc sans que le cache ait à savoir quoi que ce soit de plus.
   *
   * CE DOCUMENT S'ÉDITE (lot 3, D6). Le contrat « lecture seule » d'os#1386 est levé : le
   * document est VIVANT, et modifiable dès que `edition_allowed` lui est donné. Ce qu'on y
   * fait remonte au fichier, parce que `sheetsToJSON` le sérialise en l'appelant, et parce
   * qu'« enregistrer » depuis sa fenêtre enregistre le fichier (cf. `file_holder`).
   */
  /**
   * os#1442 — LE DOCUMENT VIVANT DE CETTE FEUILLE, S'IL Y EN A UN, ET SANS EN CRÉER.
   *
   * `sheetApplication` CHARGE l'instantané quand la feuille n'a pas encore de document : c'est
   * son office, et c'est ce qu'il faut quand on va montrer la feuille. C'est exactement ce qu'il
   * ne faut PAS pour un affichage qui ne fait que *rendre compte* — la pastille « modifié » de
   * la barre d'onglets, qui passe sur toutes les feuilles à chaque rendu. L'appeler là
   * déserialiserait tout le fichier pour peindre des points.
   *
   * Et l'absence de document vivant est une réponse, pas un manque : une feuille qui n'en a pas
   * n'a pas pu être modifiée depuis, puisque son contenu EST son instantané.
   *
   * La feuille courante fait exception, comme partout : c'est `this` qui la porte.
   */
  public liveSheetDocument(sheet_id: string): Class_ApplicationData | null {
    if (sheet_id === '' || sheet_id === this._current_sheet_id) return this
    const entry = this._sheet_apps[sheet_id]
    return entry && !entry.app.disposed ? entry.app : null
  }

  /**
   * os#1444 — QUELLE FEUILLE CE DOCUMENT MONTRE-T-IL EN CE MOMENT ?
   *
   * Deux réponses possibles, et c'est tout l'intérêt de la question :
   *  - un document de FEUILLE (né de `sheetApplication`) montre TOUJOURS la sienne, et elle ne
   *    change pas de sa vie ;
   *  - le document PORTEUR montre sa feuille courante, et celle-là change à chaque onglet cliqué.
   *
   * C'est la seconde qui rendait le presse-papiers faux (os#1444) : le document est une adresse
   * STABLE, ce qu'il montre ne l'est pas. Chaîne vide quand il n'y a pas de feuilles du tout —
   * le document mono-feuille historique, où la question ne se pose pas.
   */
  public get shown_sheet_id(): string {
    const holder = this._file_holder
    if (holder) {
      // Je suis le document d'une feuille : laquelle, mon porteur le sait. Recherche et non
      // champ mémorisé — l'annuaire du porteur est la seule vérité, et il est court.
      return holder.sheets_order.find(id => holder.liveSheetDocument(id) === this) ?? ''
    }
    return this.has_sheets ? this._current_sheet_id : ''
  }

  /**
   * os#1442 — CE DOCUMENT A-T-IL DES CHANGEMENTS NON ENREGISTRÉS ?
   *
   * La valeur vit dans `menu_configuration` depuis toujours, écrite par une quarantaine de
   * gestes d'interface ; ce qui manquait n'était pas le fait mais un nom pour le lire. Le
   * poser ici évite que chaque surface refasse le chemin par le slot — et dit que la question
   * est du DOCUMENT, quand bien même la réponse transite encore par sa configuration de menus.
   */
  public get has_unsaved_changes(): boolean {
    return !this.menu_configuration.ref_to_save_in_cache_indicator_value.current
  }

  public sheetApplication(sheet_id: string): Class_ApplicationData | null {
    const sheet = this._sheets[sheet_id]
    // os#1385 (lot 5, D9) — C'EST LE TYPE QUI CHARGE. Un type INCONNU de cette version n'a aucun
    // chargeur : son entrée reste OPAQUE, transportée et jamais ouverte (lot 4), et `null` fait
    // dire à la fenêtre qu'elle n'a pas de sujet — ce qui est exact.
    const type = sheet ? document_type_registry.typeOf(sheet) : null
    if (sheet && !type) return null
    // La feuille COURANTE est l'état vivant : il n'y a rien à charger. Un `sheet_id` vide
    // désigne la feuille courante (convention de `Type_MainZoneSubject`).
    //
    // …SAUF pour un type SANS CANEVAS : sous la règle de la racine (D8), `this` porte alors le
    // dernier Sankey actif et NON cette feuille-là — rendre `this` montrerait le mauvais
    // diagramme, en silence. Son contenu est dans son propre `json` (c'est très exactement ce
    // que la règle de la racine y met), on le charge donc comme celui de n'importe quelle autre
    // feuille. Cas théorique — `switchToSheet` refuse de rendre une telle feuille courante —,
    // mais un fichier bricolé le pose, et il vaut mieux le lire que le mentir.
    if (sheet_id === '' || (sheet_id === this._current_sheet_id && (!type || type.has_canvas))) return this
    if (!sheet || !sheet.json || !type) return null
    const cached = this._sheet_apps[sheet_id]
    if (cached && cached.snapshot === sheet.json) return cached.app
    // os#1385 (lot 2) — RÉ-ENTRANCE PENDANT LE CHARGEMENT. Depuis que `workspace.active` passe
    // par ici, un chemin appelé DANS le chargement de l'instantané (l'enregistrement du
    // document, une synchronisation d'URL) peut redemander la même feuille avant que le cache
    // ne soit posé — et repartirait pour un chargement, sans fin. Pendant cette fenêtre on
    // rend la feuille vivante : ce n'est pas le bon modèle, mais c'en est un, et l'appelant
    // suivant aura le bon.
    if (this._sheet_apps_loading.has(sheet_id)) return this
    // Le verrou est posé AVANT la libération de l'ancien document, et pas seulement autour du
    // chargement : `dispose()` recalcule l'actif, qui peut repasser par ici (os#1385, lot 3).
    this._sheet_apps_loading.add(sheet_id)
    let app: Class_ApplicationData
    try {
      // L'ANCIEN DOCUMENT S'EN VA D'ABORD. Un instantané périmé laissait
      // son document dans la liste de l'espace de travail : il n'était plus joignable par
      // personne, mais comptait encore comme document ouvert (et deux documents auraient porté
      // le même `document_id`, donc le même emplacement de cache).
      // os#1385 (lot 3) — `dispose()` et non `forgetDocument` : il faut aussi démonter sa zone
      // de dessin. Rien à réécrire dans l'instantané : s'il est ici, c'est que l'instantané
      // vient de changer sous lui, donc qu'un autre écrivain a déjà fait foi.
      if (cached) cached.app.dispose()
      const json = JSON.parse(pako.inflate(sheet.json, { to: 'string' })) as Type_JSON
      app = type.load(this, json, sheet_id)
    } finally {
      this._sheet_apps_loading.delete(sheet_id)
    }
    // os#1385 (lot 3, D6) — LE PORTEUR DU FICHIER. Ce document est une feuille de CE
    // fichier-ci : « enregistrer » depuis sa fenêtre doit écrire le fichier entier, feuilles
    // comprises, et non le diagramme de la feuille tout seul (cf. `file_holder`).
    app.file_holder = this
    this._sheet_apps[sheet_id] = { snapshot: sheet.json, app }
    return app
  }

  /** Feuilles dont le document est EN COURS de chargement (cf. `sheetApplication`). */
  protected _sheet_apps_loading: Set<string> = new Set()

  // os#1385 (lot 5, D9) — `_loadSheetSnapshotApplication` A DÉMÉNAGÉ, et c'est tout ce qui lui
  // est arrivé : son corps et son commentaire sont devenus le `load` du type `sankey`
  // (`loadSheetDocumentByDefault`, DocumentTypeRegistry.ts). Une seule vérité, et le chargement
  // d'une feuille passe désormais par le TYPE de cette feuille-là, quel qu'il soit. Les
  // commentaires qui citent encore l'ancien nom (DrawingArea, MainZoneTabs, mainZoneWindow)
  // parlent de ce chargement-là : c'est la même chose, sous son nouveau nom.

  /**
   * Fait cesser de vivre TOUS les documents de feuille (cf. `sheetApplication`).
   *
   * Sans réécrire d'instantané, et c'est voulu : le seul appelant est `resetFile()`, donc un
   * autre fichier s'ouvre — les feuilles d'avant n'existent plus, il n'y a rien à conserver.
   * Écrire dans `_sheets` ici serait écrire dans un dictionnaire que l'appelant vide juste après.
   */
  protected _clearSheetApplications(): void {
    Object.values(this._sheet_apps).forEach(entry => entry.app.dispose())
    this._sheet_apps = {}
  }

  /**
   * Sérialise une drawing area avec la couche de persistance de la classe (miroir de
   * `loadDrawingAreaFromJSON`, surchargé en OpenSankey+ pour la persistance OSP).
   */
  public dumpDrawingAreaToJSON(drawing_area: Class_DrawingArea): Type_JSON {
    return DrawingAreaPersistence.toJSON(drawing_area) as Type_JSON
  }


  /**
   * Ouvre le dialogue draggable de l'éditeur texte SankeyMATIC (format d'échange).
   * Appelé après tout import SankeyMATIC : le texte source reste ainsi sous les yeux
   * de l'utilisateur, éditable et réappliquable. Sans effet en mode publish/statique,
   * qui ne monte pas les dialogues d'édition.
   *
   * @memberof Class_ApplicationData
   */
  public openSankeymaticEditor() {
    if (this.is_static) return
    const mc = this._menu_configuration
    if (!mc) return // _fromJSON peut précéder createNewMenuConfiguration
    mc.dict_setter_show_dialog.ref_setter_show_sankeymatic_editor.current(true)
  }

  /**
 * Function to that fetch json data from an url (the file has to be compressed with gzip)
 *
 * @param {string} url_data
 * @memberof Class_ApplicationData
 */
  public readUrlJSON(url_data: string): Promise<void> {
    const root = window.location.origin
    const url = root + this.url_prefix + 'url/load_json'

    const form_data = new FormData()
    form_data.append('url', url_data)

    // Promesse rendue : l'appelant enchaîne l'état d'affichage transmis par l'URL
    // (`applyUrlStateParams`) une fois le diagramme réellement chargé.
    return fetch(url, {
      method: 'POST',
      body: form_data
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.arrayBuffer() // Utiliser arrayBuffer pour gérer binaire et texte
      })
      .then(arrayBuffer => {
        const filename = url_data.split('?')[0].split('/').pop() || 'file'

        // Fichiers STAN (.smfa SQLite / .zmfa XML gzippé) : binaires non-JSON,
        // on délègue la conversion au serveur (open_stan, dispatch par magic
        // number), comme l'import fichier de MenuTop.
        if (/\.(smfa|zmfa)$/i.test(filename)) {
          const form_data = new FormData()
          form_data.append('file_content', new File([arrayBuffer], filename))
          return fetch(root + this.url_prefix + 'open_stan', {
            method: 'POST',
            body: form_data
          })
            .then(response => {
              if (!response.ok) {
                throw new Error(`open_stan HTTP error! status: ${response.status}`)
              }
              return response.json()
            })
            .then(json_data => {
              this.fromJSON(json_data as Type_JSON)
            })
        }

        // Fichiers e!Sankey (.sankey = ZIP + XML) : binaires, dézippés et
        // parsés 100 % côté front, comme l'import fichier de MenuTop.
        // Import direct du parseur (et non esankeyLoad) : esankeyLoad importe
        // Class_ApplicationData, ce qui créerait un cycle depuis ce fichier.
        if (/\.sankey$/i.test(filename)) {
          return loadEsankeyFile(arrayBuffer)
            .then(diagram => {
              this.fromJSON(diagram as never)
            })
        }

        // Convertir en text pour tester JSON
        const decoder = new TextDecoder()
        const text = decoder.decode(arrayBuffer)

        // Format natif SankeyMATIC (.txt) : parsé 100 % côté front, comme
        // l'import fichier de MenuTop (aucun aller-retour Python).
        if (/\.txt$/i.test(filename)) {
          this.fromJSON(parseSankeymaticText(text) as never)
          this.openSankeymaticEditor()
          return
        }

        // Tester si c'est du JSON valide
        try {
          const json_data = JSON.parse(text)
          this.fromJSON(json_data)
        } catch {
          // Contenu non JSON : tenter une décompression
          // Créer un File à partir de l'ArrayBuffer pour la décompression
          const file = new File([arrayBuffer], filename)

          // `return` indispensable : c'est le chemin des .gz (donc du bouton « Éditer » des
          // sites publiés). Sans lui la chaîne se résout AVANT le fromJSON.
          return decompressUploadedFileUniversal(file)
            .then(json_data => {
              this.fromJSON(json_data as Type_JSON)
            })
            .catch(decompressError => {
              console.error('Error in decompression:', decompressError)
              throw new Error('Content is neither valid JSON nor valid compressed file')
            })
        }
      })
      .catch((error) => {
        console.error('Error in readUrlJSON:', error)
      })
  }

  /**
   * Postprocessing drawing area after JSON affectation
   * @protected
   * @memberof Class_ApplicationData
   */
  protected _afterFromJSON() {
    this._drawing_area.setToModeEdition(false) // Default mode after reading json is Selection
    this._drawing_area.afterFromJSON()
    // os#1385 — la langue de l'interface est celle de l'ESPACE DE TRAVAIL, et un seul document
    // a le droit de la changer : le principal. Ouvrir une fenêtre sur une feuille écrite dans
    // une autre langue basculait toute l'interface de l'utilisateur ; c'est corrigé ici.
    if (this.is_main && this._language !== undefined && i18next.language !== this.language)
      i18next.changeLanguage(this.language)

    // #370 — Pas de restitution du mode par les dimensions ici : c'est le #369 qui
    // restitue le mode ENREGISTRÉ (`positionModeOnLoad`) et l'ARME sans l'appliquer
    // (`suspendPositionModeUntilDataChange`), de sorte que le fichier se rouvre
    // exactement tel qu'il a été enregistré. Réappliquer ici le mode d'une dimension
    // recapturerait sa référence géométrique sur l'état du fichier — précisément le saut
    // d'échelle que le #369 corrige. Les modes des dimensions reprennent la main au
    // premier changement de sélection, qui lève la suspension (cf. `_effectivePositionMode`).

    // ?. : _afterFromJSON peut s'exécuter avant que menu_configuration soit prêt
    // (course à l'auto-chargement au montage en mode publish) — cf. l. 610. (#196)
    // `is_main` : cf. `reset()` — les emplacements repeints sont ceux de l'hôte.
    if (this.is_main) this.menu_configuration?.updateAllMenuComponents()
  }

  /**
   * Update current drawing area data from a json_object
   *
   * /!\ Add to waiting spinner queue
   *
   * @param {Type_JSON} json_object
   * @memberof Class_ApplicationData
   */
  public updateFromJSON(json_object: Type_JSON, kwargs?: Type_JSON) {
    this._updateFromJSON(json_object, kwargs)
    // `is_main` : cf. `reset()` — les emplacements repeints sont ceux de l'hôte.
    if (this.is_main) this._menu_configuration!.updateAllMenuComponents()
  }

  /**
   * Renvoie le JSON de mise en page à réappliquer pour une vue donnée, extrait
   * d'un `current_json` produit par `toJSON()`.
   *
   * ATTENTION : `_toJSON` encode les vues en DELTA (`__patch`, cf. #254), ce qui
   * RETIRE de l'entrée de vue les clés identiques au master — dont
   * `version`/`format_version`. Réappliquer telle quelle une entrée delta ferait
   * croire à `fromJSON` qu'il s'agit d'un fichier pré-0.9 et déclencherait le
   * convertisseur legacy (crash `convert_tags`). Depuis #1316 (delta descendu en
   * OS), on DÉCODE donc le delta sur une copie pour retrouver le snapshot complet
   * de la vue avant réapplication — comportement identique en OS et OSP.
   */
  public getViewLayoutJSON(view_id: string, current_json: Type_JSON): Type_JSON {
    const views = current_json['views'] as Type_JSON | undefined
    if (!views || !(view_id in views)) {
      return current_json
    }
    const decoded = JSON.parse(JSON.stringify(current_json)) as Type_JSON
    decodeViewsFromDelta(decoded)
    const view_layout = (decoded['views'] as Type_JSON | undefined)?.[view_id] as Type_JSON | undefined
    return view_layout ?? current_json
  }

  /**
   * Persist the state of the current drawing area into a per-view compressed
   * cache. No-op for plain OS; ApplicationDataOSP overrides it to refresh
   * `_views[current_view_id].json` so a subsequent view switch or save reflects
   * the latest changes done on the current view's drawing area.
   */
  public saveCurrentViewToCache(): void {
    // No-op: plain ApplicationData has no per-view cache.
  }

  /**
   * Update current drawing area data from a json_object
   * @param {Type_JSON} json_object
   * @memberof Class_ApplicationData
   */
  protected _updateFromJSON(json_object: Type_JSON, kwargs?: Type_JSON) {
    //if (json_object['layout'] !== undefined) {
    const json_layout = json_object as Type_JSON
    const drawing_area_from_layout = this.createNewDrawingArea()
    drawing_area_from_layout.bypass_redraws = true
    DrawingAreaPersistence.fromJSON(drawing_area_from_layout, json_layout)
    drawing_area_from_layout.sankey.nodes_list.forEach(n => n.setVisible())
    this.file_name = getStringFromJSON(json_layout, 'name_file', this.file_name)
    // `exclude_scale` : au chargement d'un Excel (réconciliation « garder le layout »),
    // l'échelle a déjà été calculée par computeScale() sur les nouvelles données ; ne pas
    // la réécraser avec l'échelle stockée dans le layout. Le chargement d'un fichier de
    // mise en page séparé (window.sankey.diagram_layout), lui, veut bien appliquer l'échelle.
    const mode = ['attrDrawingArea', 'scale', 'posNode', 'posFlux', 'attrNode', 'attrFlux', 'attrGeneral', 'addFreeLabel', 'removeFreeLabel', 'attrFreeLabel', 'posFreeLabel', 'Views', 'tagLevel', 'addTagLevel', 'removeTagLevel', 'tagNode', 'assignTagNode', 'tagFlux', 'assignTagFlux', 'tagData', 'icon_catalog', 'styleDA', 'styleNode', 'styleFlux', 'styleFreeLabel']
      .filter(m => !(kwargs?.['exclude_scale'] && m === 'scale'))
    updateFrom(
      this.drawing_area,
      drawing_area_from_layout,
      mode
    )
    //}
  }

  // PUBLIC METHODS =====================================================================

  public draw() {
    this.sendWaitingToast(
      () => {
        this._drawing_area.draw()
      },
      {
        success: {
          title: this.t('toast.draw.success.title'),
          desc: this.t('toast.draw.success.desc')
        },
        loading: {
          title: this.t('toast.draw.loading.title'),
          desc: this.t('toast.draw.loading.desc')
        }
      }
    )
  }

  /**
   * OS#388 — À appeler quand seule la LARGEUR RÉSERVÉE du fenêtrage change (barre latérale
   * ancrée ouverte/fermée/redimensionnée, colonne tableur/doc…). Contrairement à `draw()`,
   * ne reconstruit pas le SVG et ne passe PAS par le toast d'attente : un geste de fenêtrage
   * doit être instantané, le toast reste réservé aux opérations réellement lourdes.
   * @memberof Class_ApplicationData
   */
  public refreshWindowFraming() {
    this._drawing_area.refreshWindowFraming()
  }

  /**
   * os#1387 — CADRE du canevas quand le diagramme n'est pas la fenêtre principale de la
   * grande zone : sa case, ou 'hidden' quand il est fermé. `null` = disposition ordinaire (le
   * SVG remplit la page et réserve à droite / en bas). Posé par l'hôte (MainZoneTabs), lu par
   * la drawing area affichée (cf. DrawingArea.canvas_frame). TRANSITOIRE : la disposition,
   * elle, vit dans menu_configuration et se recalcule à l'ouverture.
   */
  public main_zone_canvas_frame: Type_CanvasFrame | null = null

  /**
   * os#1385 (lot 6, D8/D10) — OUVRIR LA PAGE SUR UNE FEUILLE (`window.sankey.sheet`).
   *
   * Un document à plusieurs feuilles se publie ENTIER : la page porte le fichier, et son
   * visiteur navigue d'un onglet à l'autre. L'option dit sur laquelle elle s'OUVRE — par id ou
   * par NOM d'onglet, comme `view` pour les vues, parce qu'une page publiée s'écrit aussi à la
   * main et qu'un nom y est lisible là où un identifiant tiré au sort ne l'est pas.
   *
   * EN PREMIER, avant `view_label` et `view` : basculer de feuille REMPLACE la zone de dessin et
   * le jeu de vues du document. C'est pour cela que c'est une méthode à part et non trois lignes
   * dans `applyPublishStateOptions` — la surcharge d'OpenSankey+ ouvre une vue AVANT d'appeler
   * `super`, et doit donc l'appeler en tête elle aussi.
   *
   * IDEMPOTENTE : les viewers React rappellent `applyPublishStateOptions` à chaque changement de
   * leurs props (os#1372). La feuille déjà courante ne se recharge pas — sinon chaque
   * ré-application jetterait la navigation du visiteur pour le remettre au point de départ.
   *
   * Tolérante comme ses voisines : feuille inconnue => warn, rien. Feuille sans canevas =>
   * `switchToSheet` refuse et le dit (règle de la racine, D8).
   */
  protected applyPublishSheetOption(): void {
    const wanted = this.publish_options.sheet
    if (!wanted) return
    // Les options de publication sont celles de la PAGE, donc partagées par tous les documents
    // de l'espace de travail : seul celui qui porte le FICHIER a des feuilles à ouvrir. Un
    // document de feuille qui repasserait par ici n'aurait rien à dire, et le dirait en boucle.
    if (!this.is_main) return
    if (!this.has_sheets) {
      // eslint-disable-next-line no-console
      console.warn(`[OpenSankey] sheet : ce document n'a pas de feuilles « ${wanted} »`)
      return
    }
    const id = this._sheets[wanted]
      ? wanted
      : this._sheets_order.find(sheet_id => this._sheets[sheet_id]?.name === wanted)
    if (!id) {
      // eslint-disable-next-line no-console
      console.warn(`[OpenSankey] sheet : feuille introuvable « ${wanted} »`)
      return
    }
    if (id === this._current_sheet_id) return
    this.switchToSheet(id, true)
  }

  /**
   * Applique l'état initial demandé par les options de publication (`publish_options`) :
   * présélection d'un data tag dans un ou plusieurs groupes, puis mode de navigation
   * (absolu / proportionnel / échelle adaptée). À appeler APRÈS le chargement du diagramme
   * (et l'éventuel layout), une fois que les tags et positions existent.
   *
   * - `data_tag_selection` est un dict { groupe : tag } où groupe/tag se résolvent par id OU par nom.
   *   Appliqué AVANT le mode car les modes proportionnel/échelle capturent leur référence sur le
   *   datatag courant.
   * - `view_tag_selection` est un dict { groupe : tag } (même résolution id/nom) qui sélectionne la
   *   valeur ET active le filtre vue (view_mode) du groupe, comme l'œil dans la barre du bas.
   * - `position_mode` impose le mode de positionnement, comme un clic dans la barre du bas.
   * - sa#397 : `view` ouvre sur une vue (id OU nom) ; `view_label` restreint le sélecteur de vues
   *   aux vues portant ce LABEL DE VUE (sa#396) et ouvre sur la première du groupe. Les deux sont
   *   additives et tolérantes : valeur inconnue => option ignorée (warn), affichage inchangé.
   * @memberof Class_ApplicationData
   */
  public applyPublishStateOptions(): void {
    // os#1385 (lot 6) — LA FEUILLE D'ABORD, avant toute vue : une bascule de feuille REMPLACE la
    // zone de dessin et le jeu de vues (cf. `_loadSheetContent`). Poser une vue puis changer de
    // feuille l'aurait posée sur le document qu'on quitte.
    this.applyPublishSheetOption()
    const opts = this.publish_options
    // sa#409 — crochet d'upgrade headless : exposé D'ABORD (la suite de la méthode a une sortie
    // anticipée), et idempotent (les viewers React repassent ici à chaque ré-application).
    if (opts.export_json) this._exportUpgradedJSON()
    // Panneau documentation : ouvert d'office en publish si l'option `doc` est active et qu'une doc existe.
    if (opts.doc && this.documentation_markdown !== '') {
      this.menu_configuration.main_zone_show_doc = true
    }
    // sa#373 — plancher d'épaisseur des flux imposé par la page hôte (window.sankey.minimum_flux),
    // prioritaire sur la valeur du document. Posé AVANT la sortie anticipée ci-dessous : c'est une
    // option d'état à part entière, indépendante des présélections de tags. Champ direct (le
    // setter redessinerait aussitôt) ; le redessin est celui de la fin de méthode.
    const forced_minimum_flux = opts.minimum_flux
    if (forced_minimum_flux !== null) this._drawing_area['_minimum_flux'] = forced_minimum_flux

    // os#1372 — Époque de dessin à l'entrée, et suivi des mutations qui NE redessinent PAS
    // d'elles-mêmes. Le dessin de fin de méthode n'est déclenché que s'il sert vraiment :
    // soit une de ces mutations muettes a eu lieu, soit rien n'a redessiné entre-temps.
    // Sans cette garde, une bascule de dataTag payait DEUX dessins complets et une bascule de
    // vue heavy QUATRE (mesuré sur CARTOFOB).
    const epoch_on_entry = this._publish_apply_epoch ?? this._draw_epoch
    this._publish_apply_epoch = null
    let mutated_without_draw = forced_minimum_flux !== null

    // sa#397 — Ouverture sur une vue (`view`) ou sur un groupe de vues par LABEL (`view_label`).
    // Labels de vues = étiquettes de SÉLECTION posées par l'auteur (sa#396) ; rien à voir avec
    // `view_tag_selection`, qui manipule les view tags GÉNÉRATEURS de vues. Doctrine additive et
    // tolérante (comme diagrams_list) : label sans aucune vue ou vue inconnue => option ignorée
    // (warn), l'affichage reste strictement celui d'aujourd'hui.
    if (!opts.view_label) {
      // Ré-application réactive (viewers React) : plus de label demandé => plus de restriction.
      this._publish_view_label_filter = null
    } else {
      const labeled_ids = this._views_reader.viewIdsWithLabel(opts.view_label)
      if (labeled_ids.length === 0) {
        // eslint-disable-next-line no-console
        console.warn(`[OpenSankey] view_label : aucune vue ne porte le label « ${opts.view_label} »`)
      } else {
        // Restreint le sélecteur/la navigation aux vues du label (cf. views_navigation_order) ;
        // la vue courante devient la première du groupe si elle n'en fait pas partie.
        this._publish_view_label_filter = opts.view_label
        if (!labeled_ids.includes(this._current_view_id)) {
          this.setCurrentView(labeled_ids[0])
        }
      }
    }
    // sa#412 — liste des labels de page (`view_label` en liste) : stockée telle quelle (état
    // runtime, ré-application réactive : option absente => plus de sélecteur). Le filtre ACTIF
    // (premier label) est posé par le bloc view_label ci-dessus, garde-fou compris ; l'UI
    // publish ne rend le sélecteur de label que si > 1 label est présent dans le fichier.
    this._publish_view_labels = opts.view_labels ?? []

    if (opts.view) {
      const view_id = this._views_reader.resolveViewIdFromSelection(opts.view)
      if (!view_id) {
        // eslint-disable-next-line no-console
        console.warn(`[OpenSankey] view : vue introuvable « ${opts.view} »`)
      } else if (view_id !== this._current_view_id) {
        this.setCurrentView(view_id)
      }
    }

    if (!opts.data_tag_selection && !opts.view_tag_selection && !opts.position_mode
      && !opts.scale_adapted_reference) {
      if (forced_minimum_flux !== null) this._drawing_area.draw()
      return
    }

    // 0) os#1352 — Régime de référence de l'« échelle adaptée », AVANT le mode : c'est lui qui
    //    décide de la grandeur que `setScaleAdaptedMode` va capturer. Posé sur la DA courante ET
    //    sur la DA MAÎTRE, parce qu'une vue `is_light` réutilise cette dernière : ne le poser que
    //    sur la vue ouverte le perdrait à la première navigation.
    if (opts.scale_adapted_reference) {
      this._drawing_area.scale_adapted_reference = opts.scale_adapted_reference
      if (this._master_drawing_area && this._master_drawing_area !== this._drawing_area) {
        this._master_drawing_area.scale_adapted_reference = opts.scale_adapted_reference
      }
      // Mutation muette : rien ne redessine ici, le dessin de fin de méthode doit avoir lieu.
      mutated_without_draw = true
    }

    // 1) et 2) Présélections de tags (logique partagée avec l'état transmis par l'URL,
    //    cf. applyUrlStateParams).
    //    os#1372 — à partir de la DEUXIÈME passe (ré-application réactive d'un viewer React), une
    //    sélection déjà posée n'est pas rejouée : elle ne coûterait qu'un dessin complet de plus.
    this.applyTagSelections(
      opts.data_tag_selection, opts.view_tag_selection, this._publish_state_applied_once)
    this._publish_state_applied_once = true

    // 3) Mode de navigation — posé sur la DA COURANTE **et** sur la DA MAÎTRE.
    //
    // os#1352 : les vues « légères » (une sélection de view tags, comme les vues par essence de
    // CARTOFOB) réutilisent la DA MAÎTRE. En ne posant le mode que sur la DA ouverte, le style
    // du maître restait `absolute` : à la première navigation, `applyViewChange` constatait
    // l'écart et rappelait le setter, lequel RÉ-ARME la suspension #369 — cette frame-là était
    // donc dessinée en absolu, et le lecteur voyait le mode « sauter » un geste. Poser le mode
    // aux deux endroits supprime l'écart, donc le ré-armement.
    if (opts.position_mode) {
      const mode = opts.position_mode
      const applyMode = (da: Class_DrawingArea | undefined) => {
        if (!da) return
        // os#1383 — Le mode d'affichage est celui de la DIMENSION pilotée (#370) : on le pose
        // aussi sur les dimensions affichées. Sans quoi chaque changement de datatag rejouait le
        // mode du FICHIER (`applyPositionModeToDrawing`, sur le groupe) avant que la prop ne
        // repose le sien : deux bascules muettes par sélection — et deux « settle » des centres.
        da.sankey.data_taggs_list.forEach(g => { if (g.banner !== 'none') g.position_mode = mode })
        if (da.sankey.styles_dict['default'].shape_position_type === mode) return
        if (mode === 'absolute') da.setAbsoluteMode()
        else if (mode === 'proportional') da.setProportionalMode()
        // os#1372 — `false` : le dessin de fin de méthode s'en charge.
        else if (mode === 'scale_adapted') da.setScaleAdaptedMode(false)
        // Aucun des trois setters ne redessine désormais depuis ici : c'est donc une mutation
        // MUETTE, et le dessin de fin de méthode devient obligatoire — y compris si la sélection
        // de tags vient d'en déclencher un, celui-ci étant antérieur au changement de mode.
        mutated_without_draw = true
      }
      applyMode(this._drawing_area)
      applyMode(this._master_drawing_area)
    }

    // os#1372 — Un seul dessin par geste. On ne redessine ici que si rien ne l'a fait depuis
    // l'entrée (sélection et mode inchangés), ou si une mutation muette l'exige. Le cas
    // fréquent — le viewer ré-applique ses props, la sélection de dataTag change et redessine —
    // économise un dessin complet entier.
    if (mutated_without_draw || this._draw_epoch === epoch_on_entry) {
      this._drawing_area.draw()
    }
  }

  /**
   * sa#409 — Crochet du banc d'upgrade headless (`window.sankey.export_json = true`).
   * Expose sur `window` le fichier re-sérialisé au format COURANT (`__sankey_upgraded_json`,
   * chaîne JSON) et un résumé indépendant du delta (`__sankey_upgrade_meta`) que le pilote
   * (Playwright, cf. server/publish_upgrade.py) confronte au fichier SOURCE : version, comptes
   * nœuds/flux racine, et par vue son nom, ses labels de vues et son nombre de zones de texte
   * (clé `labels` du diagramme de la vue — cf. la collision corrigée d'sa#396 : c'est
   * précisément ce que l'upgrade ne doit jamais perdre). En cas d'échec, `__sankey_upgrade_error`
   * porte le message et rien d'autre n'est posé.
   */
  protected _exportUpgradedJSON(): void {
    const w = window as unknown as Record<string, unknown>
    try {
      const out = this.toJSON() as Type_JSON
      // Résumé calculé sur la forme À PLAT (les vues d'un fichier sont encodées en delta,
      // #254) : le pilote python n'a pas à connaître cet encodage.
      const flat = JSON.parse(JSON.stringify(out)) as Type_JSON
      decodeViewsFromDelta(flat)
      const count = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v)) ? Object.keys(v as Type_JSON).length : 0
      // Zones LIBRES : la légende est faite de zones de texte depuis OS#1254
      // (cadre `legend` + enfants `legend-*`), qu'un fichier antérieur n'a pas.
      // Les compter avec les autres rendait tout upgrade « en écart » — c'est
      // ce compte-ci que le vérificateur compare strictement.
      const countFree = (v: unknown) => (v && typeof v === 'object' && !Array.isArray(v))
        ? Object.keys(v as Type_JSON).filter(id => !isLegendElementId(id)).length
        : 0
      const views = Object.values((flat['views'] ?? {}) as { [id: string]: Type_JSON }).map(v => ({
        name: v['name'] ?? null,
        view_labels: Array.isArray(v['view_labels']) ? v['view_labels'] : [],
        zones: count(v['labels']),
        zones_free: countFree(v['labels']),
        nodes: count(v['nodes']),
        links: count(v['links']),
      }))
      w['__sankey_upgrade_meta'] = JSON.stringify({
        version: flat['version'] ?? null,
        nodes: count(flat['nodes']),
        links: count(flat['links']),
        zones: count(flat['labels']),
        zones_free: countFree(flat['labels']),
        views,
      })
      w['__sankey_upgraded_json'] = JSON.stringify(out)
    } catch (e) {
      w['__sankey_upgrade_error'] = String(e)
    }
  }

  /**
   * Applique une sélection de tags `{ groupe : tag }` (groupe/tag résolus par id OU par nom),
   * partagée par les options de publication (`applyPublishStateOptions`) et par l'état
   * d'affichage transmis en paramètres d'URL (`applyUrlStateParams`). Ne redessine pas :
   * l'appelant enchaîne son propre `draw()`.
   *
   * os#1372 — `only_if_changed` : ne ré-applique pas une sélection DÉJÀ posée. Réservé aux
   * RÉ-applications (cf. `applyPublishStateOptions`) ; la toute première passe reste inchangée.
   * @memberof Class_ApplicationData
   */
  public applyTagSelections(
    data_tag_selection?: { [group: string]: string } | null,
    view_tag_selection?: { [group: string]: string } | null,
    only_if_changed: boolean = false
  ): void {
    const sankey = this._drawing_area.sankey

    // os#1372 — Les viewers React rappellent `applyPublishStateOptions` dès qu'une SEULE de leurs
    // props de sélection change (cf. ViewApp / ViewAppSA) : changer de vue ré-appliquait à
    // l'identique la sélection de dataTag, et `selectTagsFromId` enchaîne `updateTagsReferences`
    // → `drawing_area.draw()`. Sur CARTOFOB cela coûtait un dessin complet de trop par geste
    // (882 ms mesurés sur une bascule de vue de 4,4 s), et empilait au passage une entrée
    // d'undo/redo sans changement.
    //
    // La garde ne vaut que pour les RÉ-applications, et elle est stricte : dès qu'un seul élément
    // de l'état diffère, tout est appliqué comme avant. La PREMIÈRE passe ne saute jamais rien —
    // `selectTagsFromId` y porte deux effets qui ne sont pas des redessins : le mode d'affichage
    // que la dimension impose (#370) et le crochet des vues contextuelles (sa#283). Ce dernier
    // abandonne un enregistrement « personnaliser pour ‹tag› » quand la sélection CHANGE : ne pas
    // le déclencher sur une ré-application identique est d'ailleurs plus fidèle à son intention.
    const alreadySelected = (
      group: { selected_tags_list: { id: string }[] },
      tag_id: string
    ): boolean =>
      only_if_changed &&
      group.selected_tags_list.length === 1 && group.selected_tags_list[0].id === tag_id

    // 1) Présélection des data tags
    if (data_tag_selection) {
      for (const [group_key, tag_key] of Object.entries(data_tag_selection)) {
        const group = sankey.data_taggs_list.find(g => g.id === group_key || g.name === group_key)
        if (!group) {
          // eslint-disable-next-line no-console
          console.warn(`[OpenSankey] position/data_tag_selection : groupe de data tag introuvable « ${group_key} »`)
          continue
        }
        const tag = group.tags_list.find(t => t.id === tag_key || t.name === tag_key)
        if (!tag) {
          // eslint-disable-next-line no-console
          console.warn(`[OpenSankey] data_tag_selection : tag « ${tag_key} » introuvable dans le groupe « ${group_key} »`)
          continue
        }
        if (alreadySelected(group, tag.id)) continue
        group.selectTagsFromId(tag.id)
      }
    }

    // 2) Présélection des view tags + activation du filtre vue (view_mode) du groupe.
    //    Un view tag n'a aucun effet visuel tant que view_mode n'est pas actif ; on reproduit
    //    donc la séquence de l'œil de la barre du bas (cf. Toolbar.applyViewFilter) : activer le
    //    groupe + view_mode, sélectionner la valeur, puis recalculer la visibilité (caches
    //    node_tags_fingerprint + is_visible) et éventuellement relancer une mise en page auto si
    //    le filtre révèle des nœuds encore à la position par défaut.
    if (view_tag_selection) {
      let any_view_applied = false
      for (const [group_key, tag_key] of Object.entries(view_tag_selection)) {
        const group = sankey.view_taggs_list.find(g => g.id === group_key || g.name === group_key)
        if (!group) {
          // eslint-disable-next-line no-console
          console.warn(`[OpenSankey] view_tag_selection : groupe de view tag introuvable « ${group_key} »`)
          continue
        }
        // Mots-clés spéciaux « all » / « none » / « * » : désactivent le filtre vue du groupe →
        // toutes les valeurs redeviennent visibles (équivalent de décocher l'œil dans la barre du bas).
        const tag_key_lc = tag_key.toLowerCase()
        if (tag_key_lc === 'all' || tag_key_lc === 'none' || tag_key === '*') {
          if (only_if_changed && !group.view_mode) continue
          group.view_mode = false
          any_view_applied = true
          continue
        }
        const tag = group.tags_list.find(t => t.id === tag_key || t.name === tag_key)
        if (!tag) {
          // eslint-disable-next-line no-console
          console.warn(`[OpenSankey] view_tag_selection : tag « ${tag_key} » introuvable dans le groupe « ${group_key} »`)
          continue
        }
        // État déjà en place (groupe activé, filtre vue actif, valeur sélectionnée) : rien à faire.
        if (group.activated && group.view_mode && alreadySelected(group, tag.id)) continue
        group.activated = true
        group.view_mode = true
        group.selectTagsFromId(tag.id)
        any_view_applied = true
      }
      if (any_view_applied) {
        sankey.nodeTagsUpdated()
        sankey.nodes_list.forEach(n => n.updateVisibilityFingerprint())
        sankey.nodes_list.forEach(n => { void n.is_visible })
        sankey.nodes_list.forEach(n => { void n.is_visible })
        if (sankey.view_mode_active && this._drawing_area.view_filter_kind === 'auto') {
          const needs_auto_layout = sankey.visible_nodes_list.some(n =>
            n.position_x === const_default_position_x &&
            n.position_y === const_default_position_y)
          if (needs_auto_layout) this._drawing_area.nodePositioning.computeAutoSankey(true, true)
        }
        // os#1383 — Une sélection d'étiquette de vue recompose le diagramme : c'est un
        // changement de VUE, pas un défilement de datatag. En taille verrouillée, le dessin qui
        // suit doit donc recalculer le cadrage de référence comme à l'ouverture. Sans ça, un
        // viewer embarqué gardait la caméra resserrée d'une essence peu fournie (peuplier :
        // k = 0,326) en revenant à la vue agrégée (k = 0,405 à l'aller) — là où l'application,
        // dont les essences sont des vues, se remettait d'aplomb. Ni `recenter()` ni
        // `areaAutoFit()` n'agissent sous verrou : mesuré, les deux laissaient 0,326.
        //
        // SAUF en « échelle adaptée » : ce mode tient déjà la taille apparente côté DONNÉES
        // (l'échelle s'ajuste pour que le diagramme garde sa hauteur). Recadrer par-dessus, c'est
        // réguler la même grandeur par la caméra — le même conflit qu'os#1371 avait tranché pour
        // le dézoom de secours (`locked_overflow_shrink_allowed`, faux dans ce mode). Et comme le
        // cadrage suit la boîte englobante, qui varie d'une essence à l'autre (libellés, hauteurs),
        // chaque essence prenait un zoom différent : mesuré sur AURA, bbox 3483 → k=0,405
        // (agrégées), 3372 → 0,429 (chêne), 3491 → 0,347 (douglas), 3356 → 0,450 (peuplier), d'où
        // un déplacement horizontal à chaque changement. Sans refit, la caméra reste posée : le
        // mode garantit seul que le diagramme garde sa taille.
        if (this._drawing_area.effective_position_mode !== 'scale_adapted') {
          this._drawing_area.invalidateLockedFit()
        }
      }
    }
  }

  /**
   * Sérialise l'état d'affichage COURANT (vue active + sélections de data tags / view tags) en
   * paramètres d'URL. Sert à rouvrir le diagramme ailleurs exactement tel qu'il est affiché ici
   * — bouton « Éditer » d'un site publié (cf. MenuTop), qui sans cela retombait sur la vue
   * maître. Symétrique de `applyUrlStateParams`.
   * @memberof Class_ApplicationData
   */
  // os#1354 — Clés d'état de lecture portées par l'URL. Listées ici parce que la
  // synchronisation doit RETIRER les anciennes avant de reposer les nouvelles : sans ça,
  // désélectionner un axe laisserait sa clé dans l'adresse.
  // os#1385 (lot 2) — `sheet` les rejoint : quand un document a plusieurs feuilles, laquelle
  // est ouverte fait partie de l'état partageable, au même titre que la vue.
  private static readonly URL_STATE_KEYS = ['view', 'dt', 'vt', 'lvl', 'ds', 'iv', 'rep', 'sheet']

  /** Signature du dernier état écrit dans la barre d'adresse — évite un `replaceState` inutile. */
  private _url_state_signature: string | null = null

  /**
   * Reporte l'état de lecture courant dans la barre d'adresse, sans entrée d'historique
   * (`replaceState` : le bouton Retour reste celui de la navigation, pas des réglages).
   *
   * C'est ce qui rend l'état PARTAGEABLE : avant, `getUrlStateParams` n'avait qu'un appelant,
   * le bouton « Éditer » d'une page publiée — l'adresse ne bougeait jamais, et il n'y avait donc
   * rien à copier.
   * @memberof Class_ApplicationData
   */
  /**
   * Arme la synchronisation sans rien appliquer. Pour les chargements qui ne passent pas
   * par `?url=` (reprise du cache, diagramme inline, page vierge) : il n'y a alors aucun
   * état à lire, mais l'adresse doit tout de même devenir vivante.
   * @memberof Class_ApplicationData
   */
  public enableUrlStateSync(): void { this.workspace.enableUrlStateSync() }

  public syncUrlState(): void {
    if (!this.workspace.url_sync_enabled) return
    // os#1385 (lot 2) — SEUL L'ACTIF ÉCRIT DANS L'ADRESSE. Il n'y a qu'une barre d'adresse pour
    // toute la page : deux documents qui s'y synchronisent se réécrivent l'un l'autre, et
    // l'adresse finit par décrire le document que l'utilisateur ne regarde pas. Un document
    // hors écran (instantané de feuille, brique extraite) dessine pourtant, donc appelle ceci.
    if (this.workspace.active !== this) return
    if (typeof window === 'undefined' || !window.history?.replaceState) return
    const next = this.getUrlStateParams()
    const signature = next.toString()
    if (signature === this._url_state_signature) return
    this._url_state_signature = signature
    try {
      const url = new URL(window.location.href)
      Class_ApplicationData.URL_STATE_KEYS.forEach(k => url.searchParams.delete(k))
      next.forEach((value, key) => url.searchParams.set(key, value))
      window.history.replaceState(null, '', url.toString())
    } catch (e) {
      // Une URL exotique (blob:, data:) ne se réécrit pas : l'application continue.
      // eslint-disable-next-line no-console
      console.warn('[OpenSankey] synchronisation de l\'URL impossible', e)
      this.workspace.url_sync_enabled = false
    }
  }

  public getUrlStateParams(): URLSearchParams {
    const params = new URLSearchParams()
    const sankey = this._drawing_area.sankey
    // os#1385 (lot 2) — LA FEUILLE OUVERTE, quand elle n'est pas celle par défaut. Écrite
    // seulement par un document qui A des feuilles : l'application de lecture d'une feuille est
    // mono-feuille (son `current_sheet_id` vaut `''`), donc une fenêtre de feuille devenue
    // active n'écrit rien — cohérent avec le lot 0, où ces fenêtres ne s'écrivent déjà pas dans
    // l'adresse (leur identifiant est propre à la session).
    if (this.has_sheets && this._current_sheet_id !== this._sheets_order[0]) {
      params.set('sheet', this._current_sheet_id)
    }
    if (this._current_view_id !== default_main_sankey_id) {
      params.set('view', this._current_view_id)
    }
    // Data tags : une valeur sélectionnée par groupe (comme le sélecteur de la barre du haut).
    const data_tag_selection: { [group: string]: string } = {}
    sankey.data_taggs_list.forEach(group => {
      const selected = group.selected_tags_list[0]
      if (selected) data_tag_selection[group.id] = selected.id
    })
    if (Object.keys(data_tag_selection).length > 0) {
      params.set('dt', JSON.stringify(data_tag_selection))
    }
    // View tags : un groupe hors mode filtre est transmis explicitement comme « all ». Le fichier
    // cible peut avoir le filtre actif par défaut : sans ce marqueur, l'état d'arrivée différerait.
    const view_tag_selection: { [group: string]: string } = {}
    sankey.view_taggs_list.forEach(group => {
      const selected = group.selected_tags_list[0]
      view_tag_selection[group.id] = (group.view_mode && selected) ? selected.id : 'all'
    })
    if (Object.keys(view_tag_selection).length > 0) {
      params.set('vt', JSON.stringify(view_tag_selection))
    }
    // sa#1354 — Le NIVEAU d'agrégation, même forme que les data tags. Il manquait :
    // une URL rouvrait le diagramme replié alors qu'on l'avait déplié.
    const level_tag_selection: { [group: string]: string } = {}
    sankey.level_taggs_list.forEach(group => {
      const selected = group.selected_tags_list[0]
      if (selected) level_tag_selection[group.id] = selected.id
    })
    if (Object.keys(level_tag_selection).length > 0) {
      params.set('lvl', JSON.stringify(level_tag_selection))
    }
    // sa#1354 — La COUCHE DE DONNÉES (structure / collectées / calculées) et l'affichage
    // des intervalles. Seulement quand ils s'écartent du défaut, pour ne pas allonger
    // toutes les URL : `applyUrlStateParams` laisse le fichier décider en leur absence.
    if (this._drawing_area.data_source !== 'reconciled') {
      params.set('ds', this._drawing_area.data_source)
    }
    if (this._drawing_area.interval_display !== 'free_value') {
      params.set('iv', this._drawing_area.interval_display)
    }
    // sa#1354 — La REPRÉSENTATION : les occupants de la grande zone, dans l'ordre. Une liste
    // et non une valeur unique (diagramme + tableur côte à côte est un état légitime).
    // os#1355 — ce sont des ids du registre ; les quatre historiques gardent leur nom court
    // dans l'URL (`diagram`, `spreadsheet`, `doc`, `unitary`) pour que les adresses déjà
    // partagées restent lisibles. Absent = l'état par défaut, diagramme seul.
    // `_menu_configuration` est optionnel (posé à la première lecture de
    // `menu_configuration`) : sans lui, pas de grande zone à décrire.
    const mc = this._menu_configuration
    if (mc) {
      // os#1387 — seules les fenêtres à sujet DIAGRAMME ont un sens dans une adresse : une
      // fenêtre épinglée sur un nœud désigne un objet que le destinataire n'a pas sélectionné.
      //
      // os#1385 (lot 0) — et pas TOUTES les fenêtres à sujet diagramme : celle qui regarde une
      // AUTRE FEUILLE porte un identifiant de session (`w_N`) et non un id du registre. L'écrire
      // dans l'adresse y mettrait un nom qui ne désigne aucune représentation, et une session
      // neuve en ferait une fenêtre fantôme. Le prédicat du modèle dit lequel est lequel : une
      // fenêtre garde l'identifiant de sa représentation TANT QU'ELLE n'a pas de sujet propre.
      const shown = mc.main_zone_occupants
        .filter(o => !mainZoneSubjectUsesOwnWindowId(o.subject))
        .map(o => URL_MAIN_ZONE_SHORT_NAMES[o.id] ?? o.id)
      if (shown.join(',') !== 'diagram') {
        params.set('rep', shown.join(','))
      }
    }
    return params
  }

  /**
   * Rejoue l'état d'affichage transmis en paramètres d'URL (`view`, `dt`, `vt`) — cf.
   * `getUrlStateParams`. À appeler APRÈS le chargement du diagramme (`readUrlJSON`), une fois
   * les vues et les tags présents. Sans effet si aucun de ces paramètres n'est présent.
   * @memberof Class_ApplicationData
   */
  public applyUrlStateParams(params: URLSearchParams): void {
    const sheet_selection = params.get('sheet')
    const view_selection = params.get('view')
    const data_tag_selection = parseJSONRecordParam(params.get('dt'), 'dt')
    const view_tag_selection = parseJSONRecordParam(params.get('vt'), 'vt')
    // sa#1354 — niveau, couche de données, représentation.
    const level_tag_selection = parseJSONRecordParam(params.get('lvl'), 'lvl')
    const data_source = params.get('ds')
    const interval_display = params.get('iv')
    const representation = params.get('rep')
    // os#1354 — L'état initial de l'URL est LU : à partir d'ici, les dessins suivants peuvent
    // la réécrire sans risque d'écraser ce qu'on n'aurait pas encore appliqué. Posé avant le
    // retour anticipé : une URL sans paramètre doit elle aussi devenir vivante.
    this.workspace.url_sync_enabled = true
    if (
      !sheet_selection && !view_selection && !data_tag_selection && !view_tag_selection &&
      !level_tag_selection && !data_source && !interval_display && representation === null
    ) return
    // os#1385 (lot 2) — LA FEUILLE AVANT TOUT LE RESTE : basculer de feuille REMPLACE la zone de
    // dessin (même mécanique qu'une vue lourde), et poser une vue ou des tags avant la bascule
    // les poserait sur le diagramme qu'on s'apprête à ranger. `switchToSheet` refuse en silence
    // une feuille qu'il ne connaît pas : une adresse écrite pour un autre fichier ouvre le
    // fichier tel quel, elle ne casse rien.
    // `draw = true` : le diagramme est déjà à l'écran quand on arrive ici (`readUrlJSON` l'a
    // dessiné), et une bascule sans dessin laisserait l'ancienne feuille affichée.
    if (sheet_selection) this.switchToSheet(sheet_selection, true)
    // La vue ensuite : le switch reconstruit la drawing area (vue heavy) et applique la
    // visibilité propre de la vue — les sélections de tags se posent PAR-DESSUS.
    if (view_selection) {
      const view_id = this._views_reader.resolveViewIdFromSelection(view_selection)
      if (!view_id) {
        // eslint-disable-next-line no-console
        console.warn(`[OpenSankey] paramètre d'URL view : vue introuvable « ${view_selection} »`)
      } else if (view_id !== this._current_view_id) {
        this.setCurrentView(view_id)
      }
    }
    // sa#1354 — La REPRÉSENTATION d'abord : elle ne touche pas au modèle, seulement à la
    // grande zone, et l'appliquer avant le dessin évite un rendu dans la mauvaise géométrie.
    if (representation !== null) {
      // os#1355 — noms courts historiques OU ids de registre. Un id inconnu du registre est
      // gardé tel quel : c'est la grande zone qui l'ignorera (pas d'entrée, pas de cadre), et
      // une URL écrite par une version plus récente ne doit pas casser l'écran.
      const ids = representation.split(',').map(s => s.trim()).filter(Boolean)
        .map(s => URL_MAIN_ZONE_LONG_NAMES[s] ?? s)
      // Garde explicite plutôt que le getter `menu_configuration`, qui porte une
      // assertion non-nulle : un viewer sans configuration de menus ne doit pas lever.
      const mc = this._menu_configuration
      if (mc && ids.length > 0) mc.setMainZoneOccupantIds(ids)
    }
    // sa#1354 — La COUCHE DE DONNÉES. Valeurs validées : une URL bricolée ne doit pas poser
    // un mode que le rendu ne sait pas lire.
    if (data_source !== null) {
      const valid: Type_DataSource[] = ['structure', 'data', 'data_label', 'reconciled']
      if (valid.includes(data_source as Type_DataSource)) {
        this._drawing_area.data_source = data_source as Type_DataSource
      } else {
        // eslint-disable-next-line no-console
        console.warn(`[OpenSankey] paramètre d'URL ds : couche de données inconnue « ${data_source} »`)
      }
    }
    if (interval_display !== null) {
      const valid: Type_IntervalDisplay[] = ['structure', 'free_value', 'free_interval']
      if (valid.includes(interval_display as Type_IntervalDisplay)) {
        this._drawing_area.interval_display = interval_display as Type_IntervalDisplay
      } else {
        // eslint-disable-next-line no-console
        console.warn(`[OpenSankey] paramètre d'URL iv : affichage d'intervalle inconnu « ${interval_display} »`)
      }
    }
    // sa#1354 — Le NIVEAU passe par l'applicateur injecté par l'éditeur (cf.
    // `MenuConfig.level_selection_applier`) : agréger/désagréger n'est pas un setter.
    if (level_tag_selection) {
      const applier = this._menu_configuration?.level_selection_applier ?? null
      if (!applier) {
        // eslint-disable-next-line no-console
        console.warn('[OpenSankey] paramètre d\'URL lvl : aucun applicateur de niveau enregistré, niveau ignoré')
      } else {
        for (const [group_key, tag_key] of Object.entries(level_tag_selection)) {
          const group = this._drawing_area.sankey.level_taggs_list
            .find(g => g.id === group_key || g.name === group_key)
          if (!group) {
            // eslint-disable-next-line no-console
            console.warn(`[OpenSankey] paramètre d'URL lvl : groupe de niveau introuvable « ${group_key} »`)
            continue
          }
          const tag = group.tags_list.find(t => t.id === tag_key || t.name === tag_key)
          if (!tag) {
            // eslint-disable-next-line no-console
            console.warn(`[OpenSankey] paramètre d'URL lvl : niveau « ${tag_key} » introuvable dans « ${group_key} »`)
            continue
          }
          applier(group.id, tag.id)
        }
      }
    }
    if (data_tag_selection || view_tag_selection) {
      this.applyTagSelections(data_tag_selection, view_tag_selection)
      this._drawing_area.draw()
    } else if (data_source !== null || interval_display !== null) {
      // La couche de données ne passe pas par `applyTagSelections` : redessiner ici, sinon
      // l'épaisseur des flux resterait celle du mode précédent.
      this._drawing_area.draw()
    }
  }

  /**
   * Create a waiting toast and add function to waiting queue.
   * Délégué à l'espace de travail : UNE file d'attente pour toute la session.
   * @param {() => void} funct
   * @param {Type_TextForToastPromise} [intake] Info text for loading, success or error
   * @memberof Class_ApplicationData
   */
  public sendWaitingToast(
    funct: () => void | Promise<void>,  // Accepte async
    intake?: Type_TextForToastPromise
  ) {
    this.workspace.sendWaitingToast(funct, intake)
  }

  public pre_process_export_svg(convert_fo: boolean = false) {
    const d3_select = this._pre_process_export_svg()

    // Labels rich-text → <text> SVG natifs, pour que l'export se rende sans la feuille de
    // style de la page (cf. Persistence/foreignObjectToSvgText).
    const clone_node = d3_select?.node()
    if (clone_node && convert_fo) {
      convertForeignObjectsInPlace(clone_node)
      // Blink (Chrome, Edge) considère qu'un SVG contenant un <foreignObject> n'est PAS
      // « origin-clean » : le dessiner sur un canvas souille celui-ci, et toBlob lève
      // alors « Tainted canvases may not be exported ». L'export PNG échouait donc sous
      // Chrome sur TOUT diagramme, même à un seul flux, alors qu'il passait sous Firefox.
      // Or il en reste toujours : convertForeignObjectsInPlace épargne délibérément ceux
      // qui portent un [contenteditable] — le champ d'édition en ligne posé sous chaque
      // label, masqué tant qu'on ne double-clique pas. Ce sont des accessoires d'édition,
      // ils n'ont rien à faire dans un export : on les retire du clone. Les <foreignObject>
      // que la conversion n'a pas su traduire partent aussi, faute de quoi ils
      // continueraient de bloquer l'export entier pour un seul label récalcitrant.
      clone_node.querySelectorAll('foreignObject').forEach(fo => fo.remove())
    }

    const legend_w = !this.drawing_area.legend.masked ? this.drawing_area.legend.width : 0

    // Matches the SVG-space inset applied to the g_drawing translate so the diagram
    // sits inside the export viewport with comfortable padding on every side.
    const edge_pad = Class_ApplicationData.export_edge_padding
    let export_width: number, export_height: number
    // OS#1250 phase 4 — la taille d'export dérive du CONTENU (bounds via la façade
    // caméra), plus du canvas. Doit rester d'accord avec le translate posé par
    // _pre_process_export_svg : même origine, même padding.
    const bounds = this.drawing_area.contentBounds()
    if (this.drawing_area.is_paper_mode) {
      // Paper mode: use paper dimensions, but expand if content (labels) extends beyond.
      // La page est ancrée à (0,0) : on mesure donc jusqu'où le contenu va à droite/en bas.
      const dims = this.drawing_area.getPaperDimensionsMm()
      const paper_w = Class_DrawingArea.mmToPx(dims.width)
      const paper_h = Class_DrawingArea.mmToPx(dims.height)
      const content_right = bounds ? bounds.x + bounds.width : 0
      const content_bottom = bounds ? bounds.y + bounds.height : 0
      export_width = Math.max(paper_w, content_right + 5) + 2 * edge_pad
      export_height = Math.max(paper_h, content_bottom + 5) + 2 * edge_pad
    } else {
      // Mode libre : le contenu est ancré à son coin haut-gauche, donc la taille est celle
      // du contenu — et non plus celle du canvas, qui valait au minimum la fenêtre et
      // faisait embarquer ses marges vides dans l'export.
      const scale_da = this.drawing_area.getZoomScale()
      export_width = ((bounds?.width ?? this.drawing_area.width) * scale_da) + legend_w + 5 + 2 * edge_pad
      export_height = ((bounds?.height ?? this.drawing_area.height) * scale_da) + 5 + 2 * edge_pad
    }

    // Watermark "réalisé avec OpenSankey.fr" for raster/PDF exports without
    // an active OpenSankey+ license. Gated on convert_fo so raw SVG export
    // stays watermark-free. has_sankey_plus is overridden in OS+ to include
    // the free trial, so trial users don't get the mark either.
    let watermark = ''
    if (convert_fo && !this.has_sankey_plus) {
      const font_size = Math.max(12, Math.min(export_width, export_height) * 0.018)
      // Inset >= 1 line-height keeps the baseline clear of the body's default 8px
      // margin in wkhtmltopdf/wkhtmltoimage, so the watermark never overflows the page.
      const inset = font_size * 1.6
      watermark =
        `<text x='${export_width - inset}' y='${export_height - inset}'` +
        ' text-anchor=\'end\' dominant-baseline=\'alphabetic\'' +
        ` font-family='Arial, Helvetica, sans-serif' font-size='${font_size}'` +
        ' fill=\'#000000\' fill-opacity=\'0.45\'>' +
        'réalisé avec OpenSankey.fr' +
        '</text>'
    }

    const svg_with_header = '<svg version="1.1" ' +
      ' height=\'' + export_height.toString() + '\'' +
      ' width=\'' + export_width.toString() + '\'' +
      ' xmlns="http://www.w3.org/2000/svg"' +
      ' xmlns:xlink="http://www.w3.org/1999/xlink">' +
      (d3_select?.node()?.innerHTML ?? '') +
      watermark +
      '</svg>'
    d3_select?.remove()
    return svg_with_header
  }

  /**
   * (Re)construit le scénario de la visite guidée. Appelé à chaque lancement du tour (bouton Aide,
   * écran d'accueil) car le scénario dépend de l'état du diagramme au moment du lancement.
   *
   * `_steps` est muté EN PLACE : le TourProvider reçoit `app_data.steps` et garde la même
   * référence de tableau d'un lancement à l'autre.
   */
  public setSteps() {
    this._steps.splice(0, this._steps.length) // Reset list
    this._guided_tour.buildSteps().forEach(step => this._steps.push(step))
  }

  public get guided_tour(): Class_GuidedTour { return this._guided_tour }

  /**
   * Generatric function used to save undo/redo of some basic attribute mutation
   * (exemple : the color of the DA background),
   * it generate types of key, value and func according to model passed has parameter
   *
   * @template TModel
   * @template TKey
   * @param {TModel} model
   * @param {TKey} key
   * @param {TModel[TKey]} value
   * @param {(_:TModel[TKey])=>void} func
   * @memberof Class_ApplicationData
   */
  public setValueAndSaveHistory<TModel, TKey extends keyof TModel>(
    model: TModel,
    key: TKey,
    value: TModel[TKey],
    func: (_: TModel[TKey]) => void
  ) {
    const old_val = model[key]
    this._history!.saveUndo(() => { func(old_val) })
    this._history!.saveRedo(() => { func(value) })
    func(value)
  }

  /**
   * Create a timed out process - Used to avoid multiple reloading of components
   *
   * The process_func is meant to be use by setTimeout(),
   * and inside setTimeOut 'this' keyword has another meaning,
   * so the current object must be passed directly as an argument.
   * see : https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#the_this_problem
   *
   * @protected
   * @param {string} process_id
   * @param {() => void} process_func
   * @memberof Class_MenuConfig
   */
  public _add_waiting_process(
    process_id: string,
    process_func: () => void,
    timer = this._waiting_time_for_processes
  ) {
    this._cancel_waiting_process(process_id)
    this._waiting_processes[process_id] = setTimeout(
      (_this) => { process_func() },
      timer,
      this
    )
  }
  /**
  * Cancel a timed out process - It wont happen
  * @protected
  * @param {string} process_id
  * @memberof Class_MenuConfig
  */
  protected _cancel_waiting_process(process_id: string) {
    if (this._waiting_processes[process_id] !== undefined)
      clearTimeout(this._waiting_processes[process_id])
  }

  // PROTECTED METHODS ==================================================================

  /**
   * FAÇADE DÉPRÉCIÉE (os#1385 lot 2). Poser `document.onkeydown = app.keyboardEventListener(app)`
   * CAPTURAIT l'application : la frappe partait toujours au même document, quelle que soit la
   * fenêtre regardée. L'écouteur s'installe désormais par l'espace de travail
   * (`app.workspace.installKeyboardListener()`), qui résout l'actif à chaque frappe.
   *
   * Conservée pour les consommateurs npm : le paramètre est ignoré, et la fonction rendue fait
   * la bonne chose (elle passe par l'espace de travail).
   *
   * @deprecated cf. `Class_Workspace.installKeyboardListener`
   * @memberof Class_ApplicationData
   */
  public keyboardEventListener(
    _app_ref?: Class_ApplicationData
  ) {
    return (evt: KeyboardEvent) => { this.workspace.dispatchKeyboardEvent(evt) }
  }

  /**
   * os#1385 (lot 2) — LE POINT D'ENTRÉE CLAVIER D'UN DOCUMENT. Appelé par
   * `Class_Workspace.dispatchKeyboardEvent` sur le document ACTIF, résolu à la frappe.
   * @memberof Class_ApplicationData
   */
  public handleKeyboardEvent(evt: KeyboardEvent): void {
    this._keyboardEventProcessing(evt)
  }

  /**
   * Process all keyboard events on application.
   *
   * os#1385 (lot 2) — `app_ref` a disparu : il valait TOUJOURS `this` aux quatre sites d'appel,
   * et la note qui le justifiait (« 'this' prend une autre portée quand on est appelé depuis
   * onkeydown ») décrivait un problème que la fonction fléchée de l'écouteur règle depuis
   * longtemps. Le garder était pire qu'inutile : il laissait croire qu'une frappe pouvait viser
   * un autre document que celui qui la traite, alors que c'est l'espace de travail qui choisit.
   * @param evt
   */
  protected _keyboardEventProcessing(
    evt: KeyboardEvent) {
    // Events booleans ----------------------------------------------------------------
    const evtOnDrawingArea = this._isDrawingAreaActive() // Avoid using hotkeys in text-inputs
    const isMac = navigator.platform.toUpperCase().includes('MAC')
    const evtModifier = isMac ? evt.metaKey : evt.ctrlKey
    const evtCtrl = evtModifier && (!evt.shiftKey) && (!evt.altKey)
    const evtCtrlShift = evtModifier && (evt.shiftKey) && (!evt.altKey)
    const evtCtrlAlt = evtModifier && (!evt.shiftKey) && (evt.altKey)
    const evtKeyTab = (evt.key === 'Tab') && evtOnDrawingArea
    const evtKeyDel = (evt.key === 'Delete' || evt.key === 'Backspace') && evtOnDrawingArea
    const evtKeyEsc = (evt.key === 'Escape') // Allow escape event even when focused on input so we can close menus
    const evtKeyEnter = (evt.key === 'Enter')
    const evtKeyA = ((evt.key === 'a') || (evt.key === 'A')) && evtOnDrawingArea
    const evtKeyS = ((evt.key === 's') || (evt.key === 'S')) && evtOnDrawingArea
    // Comme A/S/C/V : pendant une édition inline (contenteditable) ou dans un input
    // de menu, Ctrl+Z/Y doit rester l'undo natif du champ. Sans ce garde-fou, le
    // preventDefault plus bas bloquait la frappe ET annulait l'action Sankey d'avant.
    const evtKeyZ = ((evt.key === 'z') || (evt.key === 'Z')) && evtOnDrawingArea
    const evtKeyY = ((evt.key === 'y') || (evt.key === 'Y')) && evtOnDrawingArea
    const evtKeyC = ((evt.key === 'c') || (evt.key === 'C')) && evtOnDrawingArea
    const evtKeyV = ((evt.key === 'v') || (evt.key === 'V')) && evtOnDrawingArea
    // os#1340 — Ctrl+D duplique la sélection (nœuds + liens internes + zones de texte).
    const evtKeyD = ((evt.key === 'd') || (evt.key === 'D')) && evtOnDrawingArea
    // OS#1273 — Ctrl+F ouvre la barre de recherche d'élément. Contrairement aux
    // autres raccourcis, il reste actif même hors zone de dessin (dans un input),
    // pour rester déclenchable quand le focus est ailleurs — comme un Ctrl+F natif.
    const evtKeyF = (evt.key === 'f') || (evt.key === 'F')
    // OS#300 Lot 2 — Ctrl+B affiche/masque la barre latérale. Restreint à la zone
    // de dessin (contrairement à Ctrl+F) pour ne pas capter le gras natif dans un input.
    const evtKeyB = ((evt.key === 'b') || (evt.key === 'B')) && evtOnDrawingArea
    const evtCtrlA = evtCtrl && evtKeyA
    const evtCtrlS = evtCtrl && evtKeyS
    const evtCtrlShiftS = evtCtrlShift && evtKeyS
    const evtCtrlAltS = evtCtrlAlt && evtKeyS
    const evtCtrlF = evtCtrl && evtKeyF
    const evtCtrlB = evtCtrl && evtKeyB
    const evtCtrlZ = evtCtrl && evtKeyZ
    const evtCtrlY = evtCtrl && evtKeyY
    const evtCtrlShiftZ = evtCtrlShift && evtKeyZ

    // Ultra-shortcuts: typing on selected element opens inline edit ------------------
    // (issue su-model/opensankey#688)
    const evtIsPrintable = evt.key?.length === 1 && !evtModifier && !evt.altKey
    // os#1340 — F2 ouvre l'édition inline du nom (comme la frappe directe, mais
    // sans injecter de caractère : le texte existant est sélectionné en entier).
    const evtIsRename = (evt.key === 'F2')
    const selectedNodes = this.drawing_area.selected_nodes_list
    const selectedLinks = this.drawing_area.selected_links_list
    const selectedContainers = this.drawing_area.selected_containers_list
    if (
      (evtIsPrintable || evtIsRename) &&
      evtOnDrawingArea &&
      selectedLinks.length === 0 &&
      (
        (selectedNodes.length === 1 && selectedContainers.length === 0) ||
        (selectedContainers.length === 1 && selectedNodes.length === 0)
      )
    ) {
      evt.preventDefault()
      const target = selectedNodes.length === 1 ? selectedNodes[0] : selectedContainers[0]
      if (!target.name_label_is_visible) {
        target.name_label_is_visible = true
        target.drawNameLabel()
      }
      target.setInputLabelVisible(evtIsRename ? undefined : evt.key)
      return
    }
    // Event to move all selected elements with keyboard arrows -----------------------
    // os#1340 — nudge : flèches = 1 px, Maj+flèches = pas de grille (comme draw.io).
    // Porte sur toute la sélection déplaçable (nœuds ET zones de texte — avant, les
    // zones n'étaient déplacées que par une surcharge OSP, retirée depuis).
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(evt.key) &&
      evtOnDrawingArea // Avoid using this hotkey in text-inputs
    ) {
      const moved = [
        ...this.drawing_area.selected_nodes_list,
        ...this.drawing_area.selected_containers_list
      ]
      if (moved.length > 0) {
        // os#1385 (lot 2) — DÉPLACER, C'EST ÉDITER : une zone non éditable (page publiée,
        // document regardé dans une fenêtre) refuse. Rien ne le testait jusqu'ici, parce que
        // la frappe ne pouvait atteindre qu'un seul document, forcément celui qu'on édite.
        if (!this.drawing_area.editable) return
        // Ne pas laisser la page défiler pendant qu'on déplace la sélection.
        evt.preventDefault()
        const step = evt.shiftKey ? this.drawing_area.grid_size : 1
        const dx = evt.key === 'ArrowLeft' ? -step : (evt.key === 'ArrowRight' ? step : 0)
        const dy = evt.key === 'ArrowUp' ? -step : (evt.key === 'ArrowDown' ? step : 0)
        // #1230/#1231 — La position PERSISTÉE d'un nœud est son CENTRE (_center_x/_center_y,
        // cf. centerForPersistence). Un déplacement aux flèches ne met à jour que le coin et
        // ne déclenche pas de passe drawElements() complète qui resynchroniserait le centre :
        // sans settleCenterAnchor, sauver après un déplacement clavier persiste le centre
        // d'AVANT et le nœud revient à sa place au rechargement. Les zones de texte
        // persistent leur coin et ne sont donc pas concernées (cohérent avec le drag).
        const applyDelta = (sign: 1 | -1) => () => {
          moved.forEach(el => {
            el.position_x += sign * dx
            el.position_y += sign * dy
            el.draw()
          })
          // Settle sur les éléments DÉPLACÉS (pas la sélection vivante : au moment
          // d'un undo, elle peut avoir changé). Sans effet pour les zones de texte.
          moved.forEach(el => el.settleCenterAnchor())
        }
        // Un appui = une transition d'historique (comme le drag souris) : sans ça,
        // Ctrl+Z après un nudge annulait silencieusement une action plus ancienne.
        this._history!.saveUndo(applyDelta(-1))
        this._history!.saveRedo(applyDelta(1))
        applyDelta(1)()
        // Update drawing area size so none of elements are outside the DA.
        // Mode 'none' (revu post-#680) : pas de recadrage auto après un déplacement clavier
        // (cohérent avec le drag souris).
        if (this.drawing_area.auto_fit_mode !== 'none') this.drawing_area.areaAutoFit()
      }
    }
    // Open config menu ---------------------------------------------------------------
    else if (evtKeyTab) {
      this.menu_configuration.ref_menu_opened.current[1](!this.menu_configuration.ref_menu_opened.current[0])
    }
    // Event to restore application display as neutral --------------------------------
    else if (evtKeyEsc) {
      // Exit style paint mode if active
      if (this.drawing_area.isInStylePaintMode())
        this.drawing_area.exitStylePaintMode()
      // Échap relâche l'outil de création actif (nœud, flux, zone de texte, ligne),
      // verrouillé ou non, et rend la main à la sélection.
      else if (this.drawing_area.active_creation_tool !== null)
        this.drawing_area.setCreationTool(null)

      // Deselect all element
      this.drawing_area.purgeSelection()

      // Close all menus
      this.menu_configuration.closeAllMenus()
      this.drawing_area.closeAllContextMenus()
      // OS#321 — et TOUTES les pop-ups, épinglées ou non : Échap est la demande
      // explicite de rendre l'écran au neutre, l'épingle ne s'y oppose pas (elle
      // ne protège que du clic posé ailleurs). Couvre aussi les présentations
      // d'éléments, que closeAllMenus ne connaît pas.
      this.menu_configuration.panels.closeAllPopups()
    }
    // Event to delete all selected elements ------------------------------------------
    else if (evtKeyDel) {
      // os#1385 (lot 2) — supprimer, c'est éditer (cf. le nudge plus haut).
      if (!this.drawing_area.editable) return
      // Delete selected elements
      this.drawing_area.deleteSelection()
    }
    // Event to blur the input we are currently focused on ----------------------------
    // (It's in adequation with event on input that update drawing area when we blur input)
    // TODO surement à supprimer lorsque les inputs se feront avec menuConfigurationTextInput && menuConfigurationNumberInput
    else if (
      (evtKeyEnter) &&
      (document.activeElement?.tagName == 'INPUT') &&
      (['form-control', 'chakra-numberinput__field', 'chakra-input', 'name_label_input'].some(r => document.activeElement?.className.includes(r)))
    ) {
      (document.activeElement as HTMLInputElement).blur()
    }
    // Event to select all visible elements -------------------------------------------
    else if (evtCtrlA) {
      // Prevent default event on ctrl + a
      evt.preventDefault()

      // Select all node & links (les zones de la légende sont des conteneurs,
      // déjà couvertes par addAllVisibleElementsToSelection — OS#1254)
      this.drawing_area.addAllVisibleElementsToSelection()
    }
    // Event to save current diagram in cache -----------------------------------------
    else if (evtCtrlS) {
      // Prevent default event on ctrl + s
      evt.preventDefault()
      // Save in cache
      this.saveInCache()
    }
    // event to download current sankey in JSON --------------------------------------
    else if (evtCtrlShiftS) {
      // Prevent default event on ctrl + shift + s
      evt.preventDefault()
      // Trigger saving via JSON saving button
      this.saveToJSON()
    }
    // event to download current sankey in Excel -------------------------------------
    else if (evtCtrlAltS) {
      // Prevent default event on ctrl + shift + s
      evt.preventDefault()
      // Trigger saving via Excel saving button
      this.saveToExcel('/opensankey/', {})
    }
    // Search an element in the diagram (OS#1273) ------------------------------------
    else if (evtCtrlF) {
      // Prevent default event (browser find bar)
      evt.preventDefault()
      // Toggle the element search bar (registered by ElementSearchOverlay)
      this.menu_configuration.ref_toggle_search.current()
    }
    // OS#300 Lot 2 — Afficher/masquer la barre latérale (Ctrl+B) --------------------
    else if (evtCtrlB) {
      evt.preventDefault()
      this.menu_configuration.panels.toggleSidebar()
    }
    // Undo
    else if (evtCtrlZ) {
      evt.preventDefault()
      this._history!.applyUndo()
    }
    // Redo
    else if (evtCtrlY || evtCtrlShiftZ) {
      evt.preventDefault()
      this._history!.applyRedo()
    }
    // os#1340 — Ctrl+D : duplique la sélection (nœuds + liens internes + zones de texte)
    else if (evtCtrl && evtKeyD) {
      // Prevent default event on ctrl + d (marque-page navigateur)
      evt.preventDefault()
      // os#1385 (lot 2) — dupliquer, c'est éditer (cf. le nudge plus haut).
      if (!this.drawing_area.editable) return
      if (this.drawing_area.selected_nodes_list.length > 0 ||
        this.drawing_area.selected_containers_list.length > 0) {
        this.drawing_area.duplicateSelection()
        this.saveInCache()
      }
    }
    // Copy selected nodes — os#1385 (lot 2) : le presse-papiers est de l'ESPACE DE TRAVAIL,
    // et porte le document d'où le contenu vient. Copier n'est pas éditer : permis partout,
    // y compris depuis une fenêtre qui regarde une autre feuille.
    else if (evtCtrl && evtKeyC) {
      evt.preventDefault()
      this.workspace.clipboard = {
        source: this,
        node_ids: this.drawing_area.selected_nodes_list.map(n => n.id),
        // os#1444 — LA FEUILLE AUSSI. Le document est une adresse stable, ce qu'il MONTRE ne
        // l'est pas : un onglet cliqué et le même document porte un autre diagramme.
        sheet_id: this.shown_sheet_id
      }
    }
    // Paste copied nodes
    else if (evtCtrl && evtKeyV) {
      evt.preventDefault()
      const clipboard = this.workspace.clipboard
      if (!clipboard || clipboard.node_ids.length === 0) return
      // os#1440 (19/09/2026) — COLLER ENTRE DOCUMENTS, POUR DE BON.
      //
      // Le lot 2 avait posé ici un refus expliqué : « cela demande une sérialisation du contenu
      // copié, pas des identifiants ; c'est le lot 3 ». Le lot 3 est passé — il a rendu un second
      // document éditable — et la sérialisation n'a jamais été reprise. Le message renvoyait donc
      // à une étape terminée, ce qui est la pire forme d'attente : elle promet ce qui est censé
      // être déjà arrivé.
      //
      // ET LA SÉRIALISATION N'ÉTAIT PAS NÉCESSAIRE. La crainte était de transporter des
      // références qui ne désignent rien ailleurs ; le code y répondait déjà. Les étiquettes se
      // résolvent dans le diagramme d'ARRIVÉE et celles qui n'y existent pas sont ignorées
      // (`addTagsReferencingFrom`) ; les styles ne suivent pas, seules les surcharges propres de
      // l'élément voyagent (`copyAttrFrom`). Un nœud collé prend donc l'allure de son nouveau
      // document et garde ce que son auteur avait réglé à la main — ce que font Excel et Figma.
      //
      // os#1444 — ON RETROUVE LA FEUILLE, PAS LE DOCUMENT. Voir `_clipboardSourceArea` : le
      // document est une adresse stable, ce qu'il montre ne l'est pas, et os#1440 avait pris
      // l'un pour l'autre. Un seul refus subsiste, quand la feuille d'origine n'est plus
      // atteignable du tout (fichier refermé, feuille supprimée).
      const source_area = this._clipboardSourceArea(clipboard)
      if (!source_area) {
        this.notifyUser(
          'clipboard_cross_document',
          this.t('toast.clipboard.source_gone.title'),
          this.t('toast.clipboard.source_gone.desc'),
          'info',
          true
        )
        return
      }
      // os#1385 (lot 2) — coller, c'est éditer (cf. le nudge plus haut).
      if (!this.drawing_area.editable) return
      if (source_area === this.drawing_area) this.drawing_area.copyNodes(clipboard.node_ids)
      else this.drawing_area.copyNodesFrom(source_area, clipboard.node_ids)
      this.saveInCache()
    }
  }

  /**
   * os#1444 — LA ZONE DE DESSIN D'OÙ VIENT CE QUI A ÉTÉ COPIÉ, ou `null` si elle n'est plus
   * atteignable.
   *
   * CE QUE os#1440 AVAIT MANQUÉ. Il traitait le DOCUMENT comme l'adresse du contenu copié :
   * juste pour deux documents côte à côte (deux fenêtres, deux modèles vivants), faux pour le
   * geste le plus ordinaire — copier dans une feuille, cliquer l'onglet d'une autre, coller.
   * Changer d'onglet ne crée pas un second document : il RECHARGE le même. Le presse-papiers
   * désignait donc toujours le bon objet, `source !== this` était faux, et le collage cherchait
   * les identifiants copiés dans un diagramme où ils n'existaient plus. Résultat : rien, et
   * sans un mot.
   *
   * Ce qui ne bouge pas, c'est la FEUILLE. Quitter une feuille en met le contenu en instantané
   * avant toute autre chose (`_snapshotCurrentSheet`, appelé par `switchToSheet` comme par
   * `createNewSheet`) : ce qu'on a copié y est, intact. Trois cas, dans l'ordre du moins cher :
   *
   *  1. le document d'origine montre ENCORE cette feuille — c'est le cas courant, y compris le
   *     collage chez soi : on lui prend sa zone de dessin, telle quelle ;
   *  2. c'est le PORTEUR du fichier qui la montre maintenant — on a copié depuis la fenêtre
   *     d'une feuille, puis cette feuille est devenue courante ;
   *  3. sinon on la redemande au porteur (`sheetApplication`), qui la rend vivante ou la
   *     recharge depuis son instantané.
   *
   * `null` ne reste que pour ce qui n'existe vraiment plus : porteur disposé (un autre fichier
   * a été chargé), ou feuille supprimée.
   */
  protected _clipboardSourceArea(clipboard: Type_Clipboard): Class_DrawingArea | null {
    const source = clipboard.source
    if (!source.disposed && source.shown_sheet_id === clipboard.sheet_id) {
      return source.drawing_area
    }
    const holder = source.file_holder ?? source
    if (holder.disposed) return null
    if (holder.shown_sheet_id === clipboard.sheet_id) return holder.drawing_area
    // LE DOCUMENT QUI GAGNE DES FEUILLES PENDANT QU'ON A QUELQUE CHOSE AU PRESSE-PAPIERS.
    //
    // Un document mono-feuille n'a pas d'identité de feuille : on a noté la chaîne vide. S'il
    // en a depuis — c'est précisément ce que fait « nouvelle feuille » sur un document qui
    // n'en avait pas —, son contenu d'alors est devenu la PREMIÈRE feuille
    // (`_ensureSheetsInitialized` la crée pour lui, puis `createNewSheet` en prend
    // l'instantané). Sans ce cas, la chaîne vide retomberait sur la convention « feuille
    // courante » de `sheetApplication` et on chercherait les nœuds copiés dans la feuille
    // neuve — c'est-à-dire dans la page blanche où l'on veut justement les coller.
    if (clipboard.sheet_id === '' && holder.has_sheets) {
      return holder.sheetApplication(holder.sheets_order[0])?.drawing_area ?? null
    }
    return holder.sheetApplication(clipboard.sheet_id)?.drawing_area ?? null
  }

  /**
   * Check if focus is on drawing area or not.
   * Avoid colisions between text inputs in menu & keyboard events on drawing area
   * @returns
   */
  protected _isDrawingAreaActive() {
    const inputs = ['input', 'textarea']
    const ae = document.activeElement as HTMLElement | null
    if (
      ae && (
        inputs.indexOf(ae.tagName.toLowerCase()) !== -1 ||
        ae.isContentEditable
      )
    ) {
      return false
    }
    return true
  }

  // os#1385 — `_sendWaitingToast`, `_toast_processes` et `_toast_bypass` ont migré dans
  // `Class_Workspace` : la file d'attente des toasts est UNE, comme l'écran.

  /**
   * Some pre-process to correct html we will send to converter
   * because there is some difference between what our code produce
   * & what the converter wait to correctly produce an image
   *
   * @protected
   * @return {*}
   * @memberof Class_ApplicationData
   */
  protected _pre_process_export_svg() {
    this.drawing_area.purgeSelection()
    // center_on_content=false EXPLICITE (OS#1315) : le fit d'export doit tourner même en
    // mode 'none' (le routeur d'areaAutoFit neutralise les fits GÉNÉRIQUES en caméra libre).
    this.drawing_area.areaAutoFit(undefined, undefined, false)
    // areaAutoFit ne rafraîchit les labels que si k_fit a changé ; en export il faut
    // que la font-size (compensée par 1/k) corresponde TOUJOURS au zoom d'export (= k_fit),
    // sinon la police reste à la taille d'un zoom précédent → non réajustée dans le SVG capturé.
    this.drawing_area.refreshLabelsForExport()

    const svg = this.drawing_area.d3_selection_zoom_area
    const svg_clone = svg?.clone(true) // clone so next instructions don't change displayed svg

    // In paper mode, export at scale 1:1 (drawing area px = paper px)
    // In free mode, use the current zoom scale
    const scale_da = this.drawing_area.is_paper_mode ? 1 : this.drawing_area.getZoomScale()

    // OS#1250 phase 4 — l'export s'ancre sur l'origine du CONTENU, plus sur celle du
    // canvas (background_shift), qui n'existe plus : le canvas était un rectangle fini
    // dimensionné sur la fenêtre, sans rapport avec ce qu'on exporte. Le contenu peut
    // vivre en coordonnées négatives (labels de valeur au-dessus des flux) : on
    // contre-translate pour que son coin haut-gauche tombe à (0,0) au lieu d'être rogné.
    //
    // Mode papier : c'est la PAGE qu'on exporte, ancrée à son origine (0,0) — pas le
    // contenu, qui peut déborder d'un côté sans devoir décaler la page.
    //
    // Le export_edge_padding absorbe le stroke du rect de fond (5 px → 2,5 px de
    // demi-trait hors bornes) et les hauteurs d'ascendantes, pour que rien ne dépasse du
    // viewport d'export. Le padding correspondant sur export_width/height laisse
    // bas/droite inchangés (cf. pre_process_export_svg, qui doit rester d'accord avec ce
    // calcul).
    const export_bounds = this.drawing_area.contentBounds()
    const origin_x = this.drawing_area.is_paper_mode ? 0 : (export_bounds?.x ?? 0)
    const origin_y = this.drawing_area.is_paper_mode ? 0 : (export_bounds?.y ?? 0)
    const tx = -origin_x * scale_da + Class_ApplicationData.export_edge_padding
    const ty = -origin_y * scale_da + Class_ApplicationData.export_edge_padding
    // os#1385 (lot 3) — les identifiants structurels du SVG sont ceux de la ZONE exportée
    // (préfixés hors du conteneur principal, donc inchangés pour l'export du diagramme que
    // l'utilisateur édite) : on les demande à la zone plutôt que de les écrire en dur.
    svg_clone?.select(this.drawing_area.domIdSelector('g_drawing'))
      .attr('transform', `translate(${tx},${ty}) scale(${scale_da})`)
    svg_clone?.selectAll('input').remove()

    // Drop editor-only chrome from the export. The editable-area frame (#viewport_border)
    // lives on the zoom layer OUTSIDE g_drawing, so it keeps its on-screen position
    // (offset by the nav bar height) instead of following the re-anchored diagram —
    // it would otherwise be baked into the SVG/PNG/PDF as a stray border cutting across
    // the export, shifted down by the top menu height.
    svg_clone?.select(this.drawing_area.domIdSelector('viewport_border')).remove()

    // #291 — Le clip du contenu (groupe #g_clip enveloppant g_drawing) découpe l'affichage éditeur
    // au cadre de la fenêtre. À l'export, on veut le diagramme COMPLET (le contenu peut vivre
    // hors de la fenêtre courante après un pan/zoom) : on neutralise donc le clip-path sur le clone.
    svg_clone?.select(this.drawing_area.domIdSelector('g_clip')).attr('clip-path', null)

    // wkhtmltoimage doesn't honor `dominant-baseline` consistently — node labels
    // render fine but link labels collide with their value-label sibling. We
    // convert non-default baselines to an equivalent y-offset (and drop the
    // attribute) only for link labels, to avoid regressing node rendering.
    svg_clone?.selectAll('.link_name_text, .link_value_text').nodes().forEach((el: d3.BaseType) => {
      const sel = d3.select(el)
      const db = sel.attr('dominant-baseline')
      if (!db || db === 'alphabetic' || db === 'auto') return
      const fontSizeAttr = sel.attr('font-size') ?? (el as Element).getAttribute('font-size') ?? ''
      const fontSize = parseFloat(fontSizeAttr.replace('px', ''))
      if (!Number.isFinite(fontSize)) return
      const yPos = parseFloat((sel.attr('y') ?? '0').replace('px', ''))
      let dy = 0
      if (db === 'text-after-edge' || db === 'ideographic') dy = -fontSize / 2
      else if (db === 'text-before-edge' || db === 'hanging') dy = fontSize * 0.8
      else if (db === 'middle' || db === 'central') dy = fontSize * 0.35
      sel.attr('y', yPos + dy)
      sel.attr('dominant-baseline', null)
    })
    // Legacy fix for node labels with 'text-after-edge' baseline.
    svg_clone?.selectAll('.name_label_text, .value_label_text').nodes().forEach((el: d3.BaseType) => {
      if (d3.select(el).classed('link_name_text') || d3.select(el).classed('link_value_text')) return
      if (d3.select(el).attr('dominant-baseline') == 'text-after-edge') {
        const fontSize = +d3.select(el).attr('font-size').replace('px', '')
        const yPos = +d3.select(el).attr('y').replace('px', '')
        d3.select(el).attr('y', yPos - (fontSize / 2))
      }
    })

    return svg_clone
  }

  // GETTERS / SETTERS ==================================================================

  public get t() { return this.workspace.t }
  public set t(_) { this.workspace.t = _ }
  public get i18n() { return this.workspace.i18n }
  public set i18n(_) { this.workspace.i18n = _ }

  /**
   * Mode de PAGE. Lu de l'ESPACE DE TRAVAIL depuis os#1385, et non plus de la zone de dessin :
   * celle-ci est remplacée à chaque `reset()`, et son défaut retombait sur `window.sankey`, ce
   * qui obligeait chaque document hors écran à réaligner le drapeau APRÈS son chargement.
   */
  public get is_static(): boolean { return this.workspace.published_mode }

  public get history(): Class_ApplicationHistory { return this._history! }

  /** Réinitialise l'historique undo/redo (appelé au switch de vue par ViewsReader). */
  public resetHistory(): void {
    this._history = new Class_ApplicationHistory(this._menu_configuration!)
  }

  // ==========================================================================================
  // VUES — délégations de LECTURE vers le ViewsReader (#1316). Un viewer OS pur restitue ainsi
  // un fichier multi-vues (décodage, bascule, navigation). OpenSankey+ surcharge celles qui
  // ont besoin d'un comportement d'édition (elles délèguent alors au ViewsManager, même objet).
  // ==========================================================================================
  public viewsFromJSON(json_object: Type_JSON): void { this._views_reader.viewsFromJSON(json_object) }
  public setCurrentView(id: string): void { this._views_reader.setCurrentView(id) }
  // os#1368 — chemin INTERACTIF : indicateur + cession de la main avant le travail lourd.
  public requestViewChange(id: string): void | Promise<void> { return this._views_reader.requestViewChange(id) }
  public setCurrentViewToMaster(): void | Promise<void> { return this._views_reader.setCurrentViewToMaster() }
  public setCurrentViewToNext(): void | Promise<void> { return this._views_reader.setCurrentViewToNext() }
  public setCurrentViewToPrev(): void | Promise<void> { return this._views_reader.setCurrentViewToPrev() }
  public navigateToView(id: string): void | Promise<void> { return this._views_reader.navigateToView(id) }
  public extractViewFromJSON(json_object: Uint8Array, view_id: string): void { this._views_reader.extractViewFromJSON(json_object, view_id) }
  public getDrawingAreaFromViewId(id: string): Class_DrawingArea | undefined { return this._views_reader.getDrawingAreaFromViewId(id) }
  public pushViewIdInViewOrder(id: string): void { this._views_reader.pushViewIdInViewOrder(id) }
  public moveViewUpInOrder(id: string): void { this._views_reader.moveViewUpInOrder(id) }
  public moveViewDownInOrder(id: string): void { this._views_reader.moveViewDownInOrder(id) }
  public applyViewTagSelection(selection: { [view_tagg_id: string]: string } | undefined): void { this._views_reader.applyViewTagSelection(selection) }

  public get has_views(): boolean { return this._views_reader.has_views }
  public get is_view_master(): boolean { return this._views_reader.is_view_master }
  public get is_current_view_light(): boolean { return this._views_reader.is_current_view_light }
  public get has_master_sankey(): boolean { return this._views_reader.has_master_sankey }
  public get views_navigation_order(): string[] { return this._views_reader.views_navigation_order }
  // sa#396/397 — labels de vues (étiquettes de SÉLECTION posées sur les vues, cf. Type_ViewEntry).
  public get all_view_labels(): string[] { return this._views_reader.all_view_labels }
  public viewIdsWithLabel(label: string): string[] { return this._views_reader.viewIdsWithLabel(label) }
  // os#1357 — annuaire : définitions utilisées, résolution id/nom, libellé affichable.
  public get used_view_label_defs(): Type_ViewLabelDef[] { return this._views_reader.used_view_label_defs }
  public labelIdFromIdOrName(v: string): string { return this._views_reader.labelIdFromIdOrName(v) }
  public labelNameOf(id: string): string { return this._views_reader.labelNameOf(id) }
  public renameViewLabel(id: string, name: string): boolean { return this._views_reader.renameViewLabel(id, name) }
  public setViewLabelGroup(id: string, group: string): boolean { return this._views_reader.setViewLabelGroup(id, group) }
  public deleteViewLabel(id: string): boolean { return this._views_reader.deleteViewLabel(id) }
  public get view_label_groups(): string[] { return this._views_reader.view_label_groups }
  public labelDefsInGroup(group: string): Type_ViewLabelDef[] { return this._views_reader.labelDefsInGroup(group) }
  /** Crée le label s'il n'existe pas, et renvoie son id. Utilisé à la saisie d'un label. */
  public ensureViewLabelId(name: string): string { return this._views_reader.labelIdFromIdOrName(name, true) }
  public get master_view(): Class_DrawingArea | undefined { return this._views_reader.master_view }
  public get has_view_before(): boolean { return this._views_reader.has_view_before }
  public get has_view_after(): boolean { return this._views_reader.has_view_after }
  public get layout_view_sources(): Array<{ id: string, name: string }> { return this._views_reader.layout_view_sources }

  public get icon_library(): Class_IconLibrary { return this._icon_library }

  public get steps(): StepType[] { return this._steps }

  public get drawing_area(): Class_DrawingArea { return this._drawing_area }
  protected set drawing_area(value: Class_DrawingArea) { this._drawing_area = value } // Only extended Class_ApplicationData instance can modify these parameter (for sub-module)

  public get menu_configuration(): Class_MenuConfig { return this._menu_configuration! }
  protected set menu_configuration(value: Class_MenuConfig) { this._menu_configuration = value } // Only extended Class_ApplicationData instance can modify these parameter (for sub-module)

  public get url_prefix(): string { return this.workspace.url_prefix }

  public get logo(): string {
    if (this.is_static && this.publish_options.logo !== null) {
      return this.publish_options.logo
    }
    return this.workspace.logo_opensankey
  }

  public get logo_opensankey(): string { return this.workspace.logo_opensankey }
  public get logo_terriflux(): string { return this.workspace.logo_terriflux }

  public get logo_width(): number { return this.workspace.logo_width }
  public set logo_width(value: number) { this.workspace.logo_width = value }

  public get app_name(): string { return this.workspace.app_name }
  public set app_name(value: string) { this.workspace.app_name = value }

  public get transform_layout_all_attr(): string[] { return this._transform_layout_all_attr }

  /**
   * Group aliases for diagram_layout_options.
   * Override in subclasses to add module-specific groups.
   */
  protected get _layout_groups(): Record<string, string[]> {
    return {
      allNodes: ['addNode', 'removeNode', 'posNode', 'attrNode'],
      allFlux: ['addFlux', 'removeFlux', 'posFlux', 'attrFlux'],
      allFreeLabels: ['addFreeLabel', 'removeFreeLabel', 'attrFreeLabel', 'posFreeLabel'],
      allTagNode: ['addTagNode', 'removeTagNode', 'tagNode', 'assignTagNode'],
      allTagFlux: ['addTagFlux', 'removeTagFlux', 'tagFlux', 'assignTagFlux'],
      allTagData: ['addTagData', 'removeTagData', 'tagData'],
      allTagLevel: ['addTagLevel', 'removeTagLevel', 'tagLevel'],
      allTags: ['addTagNode', 'removeTagNode', 'tagNode', 'assignTagNode', 'addTagFlux', 'removeTagFlux', 'tagFlux', 'assignTagFlux', 'addTagData', 'removeTagData', 'tagData', 'addTagLevel', 'removeTagLevel', 'tagLevel'],
      allStyles: ['styleDA', 'styleNode', 'styleFlux', 'styleFreeLabel'],
      allDA: ['attrDrawingArea', 'scale'],
      allValues: ['Values']
    }
  }

  /**
   * Expands group aliases in a mode array into their constituent keys.
   * Unknown keys are passed through as-is (they may be valid leaf keys).
   */
  public expandLayoutMode(mode: string[]): string[] {
    const groups = this._layout_groups
    const result: string[] = []
    mode.forEach(key => {
      if (groups[key]) {
        groups[key].forEach(k => { if (!result.includes(k)) result.push(k) })
      } else {
        if (!result.includes(key)) result.push(key)
      }
    })
    return result
  }

  public get language(): string | undefined { return this._language }
  public set language(value: string | undefined) { this._language = value }

  public get file_name(): string { return this._file_name }
  public set file_name(value: string) { this._file_name = value }

  public get static_diagram_file(): string | null { return this._static_diagram_file }
  public set static_diagram_file(value: string | null) { this._static_diagram_file = value }

  public get sankeytheque_origin(): Type_SankeythequeOrigin | null { return this._sankeytheque_origin }
  public set sankeytheque_origin(value: Type_SankeythequeOrigin | null) { this._sankeytheque_origin = value }

  // sa#399 — brique de bibliothèque associée au document ouvert (persistée en JSON).
  public get library_ref(): Type_LibraryRef | null { return this._library_ref }
  public set library_ref(value: Type_LibraryRef | null) { this._library_ref = value }

  // Doc résolue pour la langue active (i18next), repli en→fr→première. Le setter
  // écrit dans le slot de la langue active : éditer en mode 'en' ne touche que la
  // doc anglaise. Voir _documentation_markdown (map par langue).
  public get documentation_markdown(): string {
    return resolveDocMarkdown(this._documentation_markdown, i18next.language)
  }

  public set documentation_markdown(value: string) {
    const lang = normalizeDocLang(i18next.language || this._language)
    if (value === '') delete this._documentation_markdown[lang]
    else this._documentation_markdown[lang] = value
  }

  // Map complète { langue -> markdown } pour les outils qui manipulent toutes les
  // traductions (édition multilingue, sérialisation). Le getter string ci-dessus
  // reste l'accès courant pour l'affichage.
  public get documentation_markdown_map(): Type_DocMarkdownMap { return this._documentation_markdown }
  public set documentation_markdown_map(value: Type_DocMarkdownMap) { this._documentation_markdown = value }

  public get documentation_images(): { [id: string]: string } { return this._documentation_images }
  public set documentation_images(value: { [id: string]: string }) { this._documentation_images = value }

  public get publish_settings(): Type_JSON { return this._publish_settings }
  public set publish_settings(value: Type_JSON) { this._publish_settings = value }

  // #1316 — `layout_view_sources`, `navigateToView`, `getDrawingAreaFromViewId` étaient des
  // stubs neutres (subclass-only) ; ils délèguent désormais au ViewsReader (voir plus haut).

}

