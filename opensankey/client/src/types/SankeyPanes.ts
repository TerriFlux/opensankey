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

// sa#581 — TOUS LES SANKEY SE VALENT.
//
// CE QUI A ÉTÉ DEMANDÉ (Alexandre, 30/09). N'importe quel volet Sankey se comporte comme l'ancien
// diagramme principal, avec strictement les mêmes options : menu de configuration, outils de
// dessin, filtres, zoom, clavier, historique. Les volets partagent les DONNÉES du modèle (nœuds,
// flux, valeurs, étiquettes, hiérarchie) ; leur MISE EN PAGE (positions, apparence des nœuds et
// des flux, zones de texte, légende, réglages de la zone) est propre à chacun, SAUF ce que les
// volets partagent (sa#568, cf. « MISE EN PAGE PARTAGÉE » plus bas) : un volet créé partage tout
// avec celui dont il part, et l'auteur désynchronise réglage par réglage.
//
// POURQUOI UN SEUL DESSIN VIVANT, QUI SE DÉPLACE. Tout ce qui fait « les mêmes options » — le menu,
// la sélection, le clavier, l'historique, les exports — vise la zone de dessin du document. Donner
// ces options à un second dessin du même modèle voudrait deux zones vivantes sur les mêmes objets,
// ce que le modèle refuse de bout en bout (un élément n'a qu'une zone, qu'un `d3_selection`). On
// fait donc l'inverse : la zone vivante VA dans le volet Sankey qu'on active — c'est littéralement
// le même dessin, donc les mêmes options, sans rien à compléter nulle part. Les autres volets
// Sankey montrent chacun un RENDU : une copie hors écran des données, habillée de leur propre mise
// en page, qu'on ne manipule pas — le premier clic l'active, et le dessin vivant la remplace.
//
// LE PASSAGE D'UN VOLET À L'AUTRE est un transfert de mise en page (`updateFrom`, celui qui sert
// déjà à « reprendre la mise en page d'une autre vue ») : la mise en page du volet quitté est
// gardée, celle du volet activé est appliquée au dessin vivant. Les données, elles, ne bougent pas
// — c'est le même modèle.
//
// OÙ VIT LA MISE EN PAGE D'UN VOLET :
//  - un volet ENREGISTRÉ comme vue « à mise en page propre » (`own_layout`) : dans sa vue — c'est ce
//    qui s'écrit dans le fichier ;
//  - un volet NON ENREGISTRÉ sur le modèle : dans son rendu (données + sa mise en page) ;
//  - un volet sur une vue LOURDE (héritage : une vue qui porte ses propres données) : dans la vue
//    elle-même, partagée par tous les volets qui la montrent.
//
// LA MISE EN PAGE DE BASE — celle du maître, que les vues légères ordinaires partagent et que le
// fichier écrit à sa racine — vit dans la zone de dessin du modèle tant qu'elle y est montrée. Une
// vue à mise en page propre s'applique PAR-DESSUS cette même zone : avant, la mise en page de base
// est mise à l'abri (`parkBase`), et elle revient dès qu'on retourne sur le maître ou sur une vue
// légère ordinaire (`restoreBaseLayout`). Sans quoi la dernière vue à mise en page propre
// montrée deviendrait, à l'enregistrement, celle du maître et de toutes les vues légères.
//
// LES RENDUS APPARTIENNENT AU MODÈLE, pas à React : un volet qu'un plein écran masque est démonté,
// et sa mise en page ne doit pas partir avec son composant.

import pako from 'pako'
import type { Class_ApplicationData } from './ApplicationData'
import type { Class_DrawingArea } from './DrawingArea'
import type { Class_Sankey } from './Sankey'
import { updateFrom } from '../Algorithms/UpdateFrom'
import { SankeyPersistence } from '../Persistence/SankeyPersistence'
import { compressJSONToGzip } from '../Persistence/UniversalJSONCompression'
import { DRAW_TOPIC, HISTORY_TOPIC } from './EventBus'
import type { Type_HistoryContext } from './ApplicationHistory'
import { isSankeyPane, mainZoneSubjectView, type Type_MainZoneOccupant } from './MenuConfig'
import { default_main_sankey_id, type Type_JSON } from './Utils'
import {
  SANKEY_LAYOUT_SETTINGS, hasLayoutChanges, layoutChangesOf, layoutPrintOf, layoutSetting, modesForChanges,
  type Type_LayoutChanges, type Type_LayoutPrint
} from '../Representations/paneSync'
import {
  applyReading, changedReadingSettings, dataSettingOfGroup, groupOfDataSetting, parseDataSetting, pickReading,
  readingOf, readingPrintOf, sankeyDataSettings, type Type_GroupReading, type Type_PaneReading
} from '../Representations/paneReading'

/**
 * CE QUI FAIT LA MISE EN PAGE D'UN VOLET, en modes de `updateFrom` : positions, apparence et
 * styles attribués des nœuds, des flux et des zones de texte ; réglages de la zone et légende ;
 * échelle. Et rien de ce qui fait le modèle — ni nœuds ajoutés ou retirés, ni étiquettes, ni
 * valeurs, ni définitions de styles. `keepPositionType` garde intact le mode de position global,
 * qui est un style du modèle (cf. `updateFrom`).
 */
export const PANE_LAYOUT_MODES = [
  'posNode', 'attrNode', 'styleNode',
  'posFlux', 'attrFlux', 'styleFlux',
  'posFreeLabel', 'attrFreeLabel', 'styleFreeLabel',
  'attrDrawingArea', 'scale',
  'keepPositionType'
]

/** Les clés d'un élément sérialisé qui disent sa MISE EN PAGE, et non les données du modèle. */
const ELEMENT_LAYOUT_KEYS = [
  'x', 'y', 'u', 'v', 'local', 'style', 'is_visible',
  'links_order', 'inputLinksId', 'outputLinksId',
  'source_side_locked', 'source_side_frozen', 'target_side_locked', 'target_side_frozen',
  'source_anchor_delta', 'target_anchor_delta'
]

/** sa#603 — les familles de groupes dont un volet a sa propre LECTURE (cf. `paneReading`). */
const READING_TAG_FAMILIES = ['dataTags', 'levelTags', 'nodeTags', 'fluxTags']

/** sa#603 — ce que l'état d'une dimension de nœud dit du NIVEAU montré, et non de la structure. */
const DIMENSION_READING_KEYS = [
  'force_show_children', 'force_show_parent', 'container_mode', 'expanded_left', 'expanded_right',
  'split_links', 'preferred_disaggregation'
]

/** Une valeur JSON qui est un objet (et non un tableau). */
const asObject = (value: unknown): Type_JSON | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Type_JSON : null

/**
 * LA CLÉ DES DONNÉES d'un diagramme : ce que tous les volets partagent, et donc ce dont le
 * changement oblige à refaire leurs rendus. Arranger le volet actif — le cas de loin le plus
 * fréquent — ne la change pas, et les autres volets ne se refont pas pour rien.
 *
 * La sélection des étiquettes de VUE n'en fait pas partie : c'est la coordonnée de chaque volet
 * qui la porte (cf. `Class_SankeyPanes.renderOf`). sa#603 — et plus aucune LECTURE n'en fait
 * partie : étiquettes choisies, niveaux actifs, état des dimensions. Un volet Sankey peut avoir les
 * siens, et c'est la réconciliation des lectures qui les pose (cf. « LECTURE DES VOLETS »). Les y
 * laisser referait tous les rendus à chaque changement d'année — avec l'année du volet vivant,
 * même pour un volet qui a choisi la sienne.
 */
export const sankeyDataKey = (sankey: Class_Sankey): string => {
  const json = SankeyPersistence.toJSON(sankey) as Type_JSON
  ;['nodes', 'links', 'labels'].forEach(family => {
    const dict = json[family]
    if (!dict || typeof dict !== 'object') return
    Object.values(dict as Type_JSON).forEach(element => {
      if (!element || typeof element !== 'object') return
      ELEMENT_LAYOUT_KEYS.forEach(key => { delete (element as Type_JSON)[key] })
    })
  })
  READING_TAG_FAMILIES.forEach(family => {
    Object.values(asObject(json[family]) ?? {}).forEach(raw => {
      const group = asObject(raw)
      if (!group) return
      delete group['activated']
      Object.values(asObject(group['tags']) ?? {}).forEach(tag => { if (asObject(tag)) delete (tag as Type_JSON)['selected'] })
      const untagged = asObject(group['untagged_tag'])
      if (untagged) delete untagged['selected']
    })
  })
  Object.values(asObject(json['nodes']) ?? {}).forEach(node => {
    Object.values(asObject(asObject(node)?.['dimensions']) ?? {}).forEach(entry => {
      const dim = asObject(entry)
      if (dim) DIMENSION_READING_KEYS.forEach(key => { delete dim[key] })
    })
  })
  delete json['viewTags']
  return JSON.stringify(json)
}

/** sa#603 — ce qu'un volet Sankey montre pour lui seul (cf. `Type_MainZoneOccupant.reading`). */
const ownReadingOf = (o: Type_MainZoneOccupant): Type_PaneReading => o.reading ?? {}

/** sa#603 — deux volets ont-ils choisi la même chose pour eux seuls ? */
const sameOwnReading = (a: Type_MainZoneOccupant, b: Type_MainZoneOccupant): boolean => {
  const pa = readingPrintOf(ownReadingOf(a))
  const pb = readingPrintOf(ownReadingOf(b))
  return changedReadingSettings(pa, pb).length === 0
}

type Type_Camera = NonNullable<ReturnType<Class_DrawingArea['getCameraTransform']>>

/**
 * sa#568 — DEUX CAMÉRAS QUI MONTRENT LA MÊME CHOSE (à un demi-pixel près). Poser une caméra n'est
 * pas gratuit — elle recale les étiquettes de tout le dessin : ≈ 0,5 s sur 300 nœuds, mesuré le
 * 03/10 —, et deux volets créés l'un de l'autre ont le plus souvent la même : on ne la pose donc
 * que si elle change quelque chose.
 */
export const sameCameraTransform = (
  a: { k: number, x: number, y: number } | null | undefined,
  b: { k: number, x: number, y: number } | null | undefined
): boolean =>
  !!a && !!b && Math.abs(a.k - b.k) < 1e-9 && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5

/** Le rendu d'un volet inactif : un document hors écran, ses données et SA mise en page. */
type Type_PaneRender = {
  doc: Class_ApplicationData
  /** La vue que le rendu montre (la coordonnée du volet au moment où il a été fait). */
  coordinate: string
  /** La clé des données au moment du rendu ; `null` pour un rendu figé (vue lourde endormie). */
  data_key: string | null
  /** Vrai pour le MIROIR d'une vue lourde courante : il suit tout le dessin vivant. */
  mirror: boolean
}

/** Ce qu'on retient d'un volet Sankey pour réagir à sa fermeture, une fois qu'il est parti. */
type Type_PaneMemo = { coordinate: string, saved_view?: string }

/** Délai de regroupement des reconstructions, après le dernier dessin du vivant. */
const REFRESH_DELAY_MS = 250

export class Class_SankeyPanes {
  /** Les rendus des volets inactifs, par identifiant de volet. */
  protected _renders = new Map<string, Type_PaneRender>()
  /**
   * Le volet dont la zone de dessin montre en ce moment la mise en page PROPRE — et non une vue de
   * passage (un export qui parcourt les vues, une option de publication). C'est lui, et lui seul,
   * dont on garde la mise en page quand le dessin s'en va.
   */
  protected _layout_owner: string | null = null
  /** Dernier état connu des volets Sankey : leur fermeture se constate après coup. */
  protected _known = new Map<string, Type_PaneMemo>()
  /** La caméra de chaque volet quand il a cessé d'être vivant : il la retrouve en le redevenant. */
  protected _cameras = new Map<string, Type_Camera>()
  /** Garde de ré-entrance : changer de vivant notifie la grande zone, qui rappelle la synchro. */
  protected _busy = false
  /** Vrai pendant l'activation d'un volet : la bascule de vue qu'elle commande ne replace rien. */
  protected _activating = false
  protected _refresh_timer: ReturnType<typeof setTimeout> | null = null
  protected _unsubscribe_draw: (() => void) | null = null
  /** L'époque de dessin du vivant au dernier rafraîchissement des miroirs. */
  protected _mirror_epoch = -1
  /**
   * La VERSION du rendu de chaque volet, qui avance à chaque rendu refait ou jeté. C'est ce que
   * l'affichage lit pendant son rendu React — un nombre, sans rien bâtir — pour savoir qu'il doit
   * remonter le rendu du volet dans sa case.
   */
  protected _render_versions = new Map<string, number>()
  /**
   * LA MISE EN PAGE DE BASE MISE À L'ABRI, pendant qu'une vue à mise en page propre occupe la zone
   * de dessin du modèle (cf. l'en-tête) — avec la zone de dessin à laquelle elle appartient : un
   * autre contenu chargé (fichier, feuille, annulation) apporte une autre zone, et l'abri périmé
   * est alors jeté.
   */
  protected _base: { owner: Class_DrawingArea, doc: Class_ApplicationData } | null = null
  /** sa#568 — l'empreinte du dessin vivant au dernier partage, et de quel volet (cf. `shareLiveLayout`). */
  protected _print: { pane: string, print: Type_LayoutPrint } | null = null
  /**
   * sa#568 — LES VOLETS FERMÉS, gardés un temps : fermer un volet s'annule, et le volet rouvert doit
   * retrouver SA mise en page (son rendu, sa caméra). Les plus anciens partent au-delà de
   * `BURIED_MAX` : chaque rendu est un document entier.
   */
  protected _buried = new Map<string, { render: Type_PaneRender, camera?: Type_Camera }>()
  protected static readonly BURIED_MAX = 4
  /** sa#568 — l'observateur du DOM du dessin vivant, et l'élément observé (cf. `observeLive`). */
  protected _observer: { disconnect: () => void } | null = null
  protected _observed: Element | null = null
  /**
   * sa#603 — LA VALEUR COMMUNE (celle de la barre générale) des groupes que le volet vivant a choisis
   * pour lui seul. Le modèle montre alors SA lecture, et la valeur commune attend ici. Pour tout
   * autre groupe, la valeur commune est celle que montre le modèle.
   */
  protected _common: Type_PaneReading = {}
  /**
   * sa#603 — CE QUE LE MODÈLE MONTRE POUR LE VOLET VIVANT, quand il montre sa lecture à lui : le
   * volet, la zone de dessin, et par réglage l'empreinte voulue (son choix) et l'empreinte obtenue
   * (ce que le modèle en a fait). Un écart entre l'obtenue et ce que montre le modèle, c'est la
   * barre générale qui a parlé (cf. `reconcileLive`).
   */
  protected _applied: {
    pane: string | null
    area: Class_DrawingArea | null
    wanted: { [setting: string]: string }
    actual: { [setting: string]: string }
  } = { pane: null, area: null, wanted: {}, actual: {} }
  /** sa#603 — par rendu, l'empreinte de la lecture qu'on y a posée (cf. `reconcileRenders`). */
  protected _render_prints = new WeakMap<Class_ApplicationData, { [setting: string]: string }>()
  /** sa#603 — un contrôle de la lecture du vivant est déjà prévu (cf. `guardSoon`). */
  protected _guard_queued = false

  constructor(protected readonly host: Class_ApplicationData) { }

  // ACCÈS ==========================================================================================

  public get activating(): boolean { return this._activating }

  /** La vue que montre un volet Sankey : sa coordonnée, sinon la vue courante. */
  public coordinateOf(o: { subject: Type_MainZoneOccupant['subject'] }): string {
    return mainZoneSubjectView(o.subject) || this.host.current_view_id
  }

  /** Une vue LOURDE porte ses propres données ; le maître et les vues légères, celles du modèle. */
  public isHeavyView(view_id: string): boolean {
    const entry = this.host.views_dict[view_id]
    return view_id !== default_main_sankey_id && !!entry && !entry.is_light
  }

  /** Ce volet est-il le volet enregistré de la vue qu'il montre ? */
  protected isRegisteredOn(o: { saved_view?: string }, view_id: string): boolean {
    return o.saved_view === view_id
  }

  /** Le volet ouvert `id`, s'il est un volet Sankey. */
  protected paneById(id: string | null): Type_MainZoneOccupant | undefined {
    if (id === null) return undefined
    const o = this.host.menu_configuration?.mainZoneOccupantById(id)
    return o && isSankeyPane(o) ? o : undefined
  }

  /** Un volet Sankey ouvert montre-t-il cette vue ? */
  public anyPaneShows(view_id: string): boolean {
    const mc = this.host.menu_configuration
    if (!mc) return false
    return mc.main_zone_sankey_panes.some(p => this.coordinateOf(p) === view_id)
  }

  // MISES EN PAGE ==================================================================================

  /** Applique la mise en page de `source` au dessin `target` — les données ne bougent pas. */
  protected applyLayout(target: Class_DrawingArea, source: Class_DrawingArea): void {
    updateFrom(target, source, PANE_LAYOUT_MODES)
  }

  /** La zone de dessin enregistrée d'une vue, bâtie hors écran. À supprimer par l'appelant. */
  protected viewDrawingArea(view_id: string): Class_DrawingArea | null {
    const entry = this.host.views_dict[view_id]
    if (!entry) return null
    const json = JSON.parse(pako.inflate(new Uint8Array(entry.json), { to: 'string' })) as Type_JSON
    const da = this.host.createNewDrawingArea('__sa581_layout__')
    da.bypass_redraws = true
    this.host.loadDrawingAreaFromJSON(da, json)
    da.afterFromJSON()
    return da
  }

  /** Applique au dessin vivant la mise en page ENREGISTRÉE de la vue `view_id` (`own_layout`). */
  public applyViewLayout(view_id: string): boolean {
    if (!this.host.views_dict[view_id]?.own_layout) return false
    const da = this.viewDrawingArea(view_id)
    if (!da) return false
    this.parkBase()
    try { this.applyLayout(this.host.drawing_area, da) } finally { da.delete() }
    return true
  }

  // MISE EN PAGE DE BASE ===========================================================================

  /** La mise en page de base à l'abri, si elle appartient bien à la zone de dessin du modèle. */
  protected parkedBase(): Class_ApplicationData | null {
    if (!this._base) return null
    if (this._base.owner === this.baseDrawingArea() && !this._base.doc.disposed) return this._base.doc
    this.dropBase()
    return null
  }

  /**
   * MET À L'ABRI LA MISE EN PAGE DE BASE, juste avant qu'une vue à mise en page propre ne s'applique
   * par-dessus. Une seule fois : si une telle vue occupe déjà la zone, ce qu'elle montre n'est pas
   * la base, qui est déjà à l'abri.
   */
  public parkBase(): void {
    if (this.parkedBase()) return
    const base = this.baseDrawingArea()
    if (!base) return
    this._base = { owner: base, doc: this.buildDocument(this.host.dumpDrawingAreaToJSON(base)) }
  }

  /**
   * LA MISE EN PAGE DE BASE REVIENT sur la zone de dessin du modèle, qui retourne sur la base. Rend
   * `true` si elle a changé quelque chose.
   */
  public restoreBaseLayout(): boolean {
    const parked = this.parkedBase()
    const base = this.baseDrawingArea()
    if (!parked || !base) return false
    this.applyLayout(base, parked.drawing_area)
    this.dropBase()
    return true
  }

  /** Jette l'abri : un autre contenu arrive, dont la zone de dessin montre sa propre base. */
  public dropBase(): void {
    if (this._base) this.disposeDocument(this._base.doc)
    this._base = null
  }

  /**
   * Exécute `work` — l'écriture de la racine du fichier — sur la zone de dessin du modèle revenue
   * à sa MISE EN PAGE DE BASE, puis lui rend celle qu'elle montrait, sans rien redessiner.
   */
  public withBaseLayout<T>(work: () => T): T {
    const parked = this.parkedBase()
    const base = this.baseDrawingArea()
    if (!parked || !base) return work()
    const was_bypassing = base.bypass_redraws
    base.bypass_redraws = true
    const shown = this.buildDocument(this.host.dumpDrawingAreaToJSON(base))
    try {
      this.applyLayout(base, parked.drawing_area)
      return work()
    } finally {
      try { this.applyLayout(base, shown.drawing_area) } finally {
        this.disposeDocument(shown)
        base.bypass_redraws = was_bypassing
      }
    }
  }

  /** Enregistre dans la vue `view_id` l'état du dessin vivant. */
  protected storeLiveInView(view_id: string): void {
    const entry = this.host.views_dict[view_id]
    if (!entry) return
    entry.json = compressJSONToGzip(this.host.dumpDrawingAreaToJSON(this.host.drawing_area)) as Uint8Array
  }

  /**
   * GARDER LA MISE EN PAGE DU VOLET QUI QUITTE LE DESSIN VIVANT, là où elle vit (cf. l'en-tête) :
   * dans sa vue s'il en est le volet enregistré ou si la vue est lourde, dans son rendu sinon.
   */
  protected keepLayoutOf(pane_id: string): void {
    const memo = this._known.get(pane_id)
    const o = this.paneById(pane_id)
    const coordinate = o ? this.coordinateOf(o) : memo?.coordinate
    if (coordinate === undefined) return
    const saved_view = o ? o.saved_view : memo?.saved_view
    const entry = this.host.views_dict[coordinate]
    const camera = this.host.drawing_area.getCameraTransform()
    if (camera) this._cameras.set(pane_id, camera)
    if (this.isHeavyView(coordinate) || (entry?.own_layout && saved_view === coordinate)) {
      this.storeLiveInView(coordinate)
      this.disposeRender(pane_id)
      return
    }
    // Un volet qui n'est plus ouvert et qu'aucune vue ne garde : sa mise en page s'en va avec lui.
    if (!o) return
    this.setRender(pane_id, {
      doc: this.buildDocument(this.host.dumpDrawingAreaToJSON(this.host.drawing_area)),
      coordinate,
      data_key: sankeyDataKey(this.host.drawing_area.sankey),
      mirror: false
    })
  }

  /**
   * APPLIQUER AU DESSIN VIVANT LA MISE EN PAGE PROPRE du volet qui le reçoit. Rien pour une vue
   * lourde : sa zone de dessin est la vue elle-même. Rend `true` si la mise en page a changé.
   */
  protected applyLayoutOf(o: Type_MainZoneOccupant): boolean {
    const coordinate = this.coordinateOf(o)
    if (this.isHeavyView(coordinate)) { this.disposeRender(o.id); return false }
    const entry = this.host.views_dict[coordinate]
    // Une vue à mise en page propre s'applique par-dessus la base, qu'on met à l'abri ; le maître
    // et les vues légères ordinaires la retrouvent.
    let changed = false
    if (entry?.own_layout) this.parkBase()
    else changed = this.restoreBaseLayout()
    const render = this._renders.get(o.id)
    const registered = !!entry?.own_layout && this.isRegisteredOn(o, coordinate)
    if (!registered && render && !render.doc.disposed && render.coordinate === coordinate) {
      this.applyLayout(this.host.drawing_area, render.doc.drawing_area)
      changed = true
    } else if (entry?.own_layout) {
      changed = this.applyViewLayout(coordinate) || changed
    }
    // Le volet est vivant : son rendu ne montre plus rien, le dessin le remplace.
    this.disposeRender(o.id)
    return changed
  }

  /**
   * La vue à mise en page propre que le volet vivant EST reçoit l'état du dessin — avant d'écrire
   * le fichier, comme une vue lourde courante reçoit le sien. Son statut est vivant.
   */
  public flushLiveLayout(): void {
    const owner = this.paneById(this._layout_owner)
    if (!owner) return
    const coordinate = this.coordinateOf(owner)
    if (coordinate !== this.host.current_view_id) return
    if (this.host.views_dict[coordinate]?.own_layout && owner.saved_view === coordinate) {
      this.storeLiveInView(coordinate)
    }
  }

  /**
   * Le dessin vivant cesse d'appartenir à un volet sans que sa mise en page soit gardée : la vue
   * lourde qu'il montrait est supprimée, et sa zone de dessin avec elle.
   */
  public releaseLayoutOwner(): void {
    this._layout_owner = null
  }

  // BASCULES DE VUE ================================================================================
  // Appelées par `ViewsReader.applyViewChange`, avant et après le changement de zone de dessin.

  /** Avant une bascule : la mise en page propre du volet vivant est mise à l'abri. */
  public beforeViewChange(): void {
    if (this._layout_owner === null) return
    const owner = this._layout_owner
    this._layout_owner = null
    this.keepLayoutOf(owner)
  }

  /**
   * Après la bascule : la mise en page qui convient. Le volet vivant retrouve la SIENNE quand la
   * vue est sa coordonnée ; sinon la vue se montre telle qu'enregistrée (un export qui parcourt
   * les vues les dessine chacune avec sa propre mise en page, et non avec celle du volet).
   */
  public afterViewChange(view_id: string): void {
    const live = this.paneById(this.host.menu_configuration?.main_zone_live_sankey_id ?? null)
    if (live && this.coordinateOf(live) === view_id) {
      this.applyLayoutOf(live)
      this._layout_owner = live.id
      return
    }
    if (this.host.views_dict[view_id]?.own_layout) this.applyViewLayout(view_id)
    else if (!this.isHeavyView(view_id)) this.restoreBaseLayout()
  }

  // ACTIVATION =====================================================================================

  /**
   * LE VOLET `id` DEVIENT LE VIVANT : le dessin du document quitte le volet où il était — dont la
   * mise en page est gardée — et se pose sur celui-ci, avec sa mise en page à lui.
   *
   * Même vue : un transfert de mise en page et un dessin. Autre vue : la bascule de vue ordinaire,
   * sans interception ni replacement de volets — c'est elle qui garde et qui applique (cf.
   * `beforeViewChange` / `afterViewChange`).
   */
  public activate(id: string): void {
    const host = this.host
    const mc = host.menu_configuration
    const o = this.paneById(id)
    if (!mc || !o || mc.main_zone_live_sankey_id === id) return
    const coordinate = this.coordinateOf(o)
    const was_busy = this._busy
    this._busy = true
    this._activating = true
    try {
      // sa#568 — ce que le vivant n'a pas encore donné à ses volets synchronisés part AVANT qu'il ne
      // cède la place (le relevé attend la fin du geste) : sinon le volet activé reprendrait une
      // mise en page d'avant le dernier geste. Et le relevé se fait même sans signal en attente :
      // c'est le filet, si un geste a échappé à l'observation (cf. `observeLive`).
      this.flushPendingShare()
      this.shareLiveLayout()
      // Un vivant parti dans une fenêtre du système y laissait le dessin : il rentre d'abord, le
      // volet qu'on active le reçoit dans la page.
      const previous = mc.main_zone_live_sankey_id
      if (previous !== null && mc.isMainZoneDetached(previous)) mc.setMainZoneDetached(previous, false)
      const from = this.paneById(previous)
      if (from && this.canSwap(from, o)) {
        // sa#568 — les deux volets montrent le même dessin : rien à recopier ni à redessiner.
        this.swapLive(from, o)
      } else if (coordinate === host.current_view_id || !this.viewExists(coordinate)) {
        this.beforeViewChange()
        mc.main_zone_live_sankey_id = id
        const was_bypassing = host.drawing_area.bypass_redraws
        host.drawing_area.bypass_redraws = true
        let changed = false
        try {
          changed = this.applyLayoutOf(o)
          // sa#603 — et SA lecture : ce qu'il a choisi pour lui seul, la valeur commune pour le reste.
          if (this.reconcileLive()) changed = true
        } finally { host.drawing_area.bypass_redraws = was_bypassing }
        this._layout_owner = id
        // Le dessin PASSE d'un volet à l'autre : il se redessine avec la mise en page de celui qui le
        // reçoit. Rien de tout cela quand il se POSE pour la première fois sans que rien ne change
        // (ouverture d'un document, premier geste dans la grande zone) : ce serait redessiner en
        // plein geste — un survol a ainsi remplacé les éléments qu'il désignait.
        //
        // sa#568 — L'HISTORIQUE NE REPART PLUS (Alexandre, 03/10 : annuler / rétablir valent pour
        // toutes les actions du fichier, quel que soit le volet). Il « parlait de l'autre volet » :
        // chaque entrée retient désormais le volet de son geste, qui redevient le vivant avant
        // qu'on la rejoue (cf. `history_context`).
        if (previous !== null || changed) {
          host.drawing_area.draw()
          mc.updateAllMenuComponents()
        }
      } else {
        mc.main_zone_live_sankey_id = id
        host.switchViewForPane(coordinate)
      }
      // sa#603 — l'échange et la bascule de vue posent le dessin sans sa lecture : on la pose ici
      // (rien à faire après le chemin ordinaire, qui l'a posée avant de dessiner).
      if (this.reconcileLive()) this.redrawLive()
      const camera = this._cameras.get(id)
      if (camera && !sameCameraTransform(camera, host.drawing_area.getCameraTransform())) {
        host.drawing_area.setCamera(camera)
      }
      // sa#568 — le volet activé a posé sa mise en page, synchronisée, sur le dessin : c'est l'état
      // de référence du prochain geste. Et son DOM est peut-être neuf (une vue lourde en change).
      this.markShared()
      this.observeLive()
    } finally {
      this._activating = false
      this._busy = was_busy
    }
    this.remember()
  }

  /** La vue existe-t-elle encore dans le document (le maître existe toujours) ? */
  protected viewExists(view_id: string): boolean {
    return view_id === default_main_sankey_id || !!this.host.views_dict[view_id]
  }

  /**
   * LA SYNCHRONISATION, sur chaque changement de la grande zone : les volets fermés rendent leur
   * rendu, les coordonnées implicites deviennent explicites, et le volet Sankey ACTIF devient le
   * vivant. Tolérante à tout : branchée sur un bus, elle ne doit jamais lever.
   */
  public sync(): void {
    const mc = this.host.menu_configuration
    if (this._busy || !mc || !this.host.is_main || this.host.is_static) return
    this.listen()
    this.observeLive()
    // sa#568 — les réglages de figure s'inscrivent à l'historique de ce document (cf. `undo_recorder`).
    if (mc.undo_recorder === null) mc.undo_recorder = this.undo_recorder
    this._busy = true
    try {
      const panes = mc.main_zone_sankey_panes
      const open = new Set(panes.map(p => p.id))
      this._known.forEach((memo, id) => { if (!open.has(id)) this.onPaneClosed(id, memo) })
      // sa#568 — un volet qui revient (« annuler » sa fermeture) reprend sa mise en page gardée.
      open.forEach(id => { if (!this._known.has(id) && this._buried.has(id)) this.resurrect(id) })
      // Une coordonnée implicite (fichier d'avant, volet ouvert sans vue) suit la vue courante. Dès
      // qu'il y a DEUX volets Sankey, elle se fige ici, sans quoi le volet changerait de vue avec
      // le suivant qu'on active. Seul, il n'y a rien à figer : sa vue EST la vue courante, et le
      // fichier d'un document à un seul volet reste celui d'avant.
      const several = panes.length > 1
      panes.forEach(p => {
        const view = mainZoneSubjectView(p.subject)
        // Une vue qui n'existe plus (supprimée, ou d'un autre contenu) : le volet retombe sur la
        // vue courante, comme une coordonnée implicite.
        if (view !== '' && !this.viewExists(view)) mc.setSankeyPaneView(p.id, several ? this.host.current_view_id : '')
        else if (view === '' && several) mc.setSankeyPaneView(p.id, this.host.current_view_id)
      })
      // Le vivant montre SA mise en page dès que la vue courante est la sienne — y compris après
      // un rechargement du même document (annulation, reprise de session), qui a remis à zéro qui
      // la possédait sans rien changer au dessin.
      const live = this.paneById(mc.main_zone_live_sankey_id)
      if (this._layout_owner === null && live && this.coordinateOf(live) === this.host.current_view_id) {
        this._layout_owner = live.id
      }
      // Un vivant revenu sur la base sans bascule (sa vue supprimée l'y a fait retomber) : la
      // mise en page de base qu'une vue propre lui avait prise lui revient.
      const current = this.host.current_view_id
      if (live && this.coordinateOf(live) === current && !this.host.views_dict[current]?.own_layout &&
        !this.isHeavyView(current) && this.parkedBase()) {
        this.restoreBaseLayout()
        this.host.drawing_area.draw()
      }
      const active = mc.main_zone_active_id
      let next: string | null = null
      if (active !== null && open.has(active) && mc.main_zone_live_sankey_id !== active) next = active
      // Plus de vivant (on vient de le fermer) alors qu'il reste des volets Sankey : le dessin se
      // pose sur l'un d'eux — celui qui montre la vue courante, sinon le premier —, faute de quoi
      // il resterait masqué derrière des rendus qu'on ne peut pas éditer.
      else if (mc.main_zone_live_sankey_id === null && panes.length > 0) {
        next = (panes.find(p => this.coordinateOf(p) === this.host.current_view_id) ?? panes[0]).id
      }
      if (next !== null) {
        this._busy = false
        this.activate(next)
        this._busy = true
      }
      // sa#603 — un choix d'en-tête posé, retiré ou annulé : chaque volet montre ce qu'il doit.
      // Pas de notification pour les rendus : la grande zone se redessine déjà sur celle qu'on sert.
      if (this.reconcileLive()) this.redrawLive()
      this.reconcileRenders()
      this.remember()
    } catch (error) {
      console.error('sa#581 — synchronisation des volets Sankey :', error)
    } finally {
      this._busy = false
    }
  }

  /**
   * Exécute `work` sans que la synchronisation ne s'en mêle : une bascule de vue change le volet
   * vivant, des coordonnées et le volet actif, et chaque changement notifie la grande zone. L'état
   * des volets est relevé à la fin, une fois.
   */
  public hold(work: () => void): void {
    const was_busy = this._busy
    this._busy = true
    try { work() } finally { this._busy = was_busy }
    if (!was_busy) this.remember()
  }

  /** Retient l'état des volets Sankey, pour en constater la fermeture. */
  protected remember(): void {
    const mc = this.host.menu_configuration
    if (!mc) return
    this._known = new Map(mc.main_zone_sankey_panes.map(p =>
      [p.id, { coordinate: this.coordinateOf(p), saved_view: p.saved_view }]))
  }

  /** Un volet Sankey vient d'être fermé. */
  protected onPaneClosed(id: string, memo: Type_PaneMemo): void {
    // sa#568 — sa mise en page est gardée un temps (`bury`) : « annuler » peut le rouvrir.
    const camera = this._cameras.get(id)
    if (this._layout_owner === id) {
      // Sa mise en page n'est gardée que si une vue la garde ; un volet éphémère l'emporte.
      this._layout_owner = null
      const entry = this.host.views_dict[memo.coordinate]
      if (this.isHeavyView(memo.coordinate) || (entry?.own_layout && memo.saved_view === memo.coordinate)) {
        this.storeLiveInView(memo.coordinate)
      } else if (!this.isHeavyView(memo.coordinate)) {
        this.bury(id, {
          doc: this.buildDocument(this.host.dumpDrawingAreaToJSON(this.host.drawing_area)),
          coordinate: memo.coordinate,
          data_key: sankeyDataKey(this.host.drawing_area.sankey),
          mirror: false
        }, this.host.drawing_area.getCameraTransform() ?? camera)
      }
    }
    const render = this._renders.get(id)
    if (render && !render.mirror) {
      this._renders.delete(id)
      this.bumpVersion(id)
      this.bury(id, render, camera)
    } else this.disposeRender(id)
    this._cameras.delete(id)
    this._known.delete(id)
    // Une vue éphémère que plus rien ne montre est oubliée (cf. `Type_ViewEntry.ephemeral`).
    const entry = this.host.views_dict[memo.coordinate]
    if (entry?.ephemeral && memo.coordinate !== this.host.current_view_id && !this.anyPaneShows(memo.coordinate)) {
      this.host.forgetEphemeralViewOf(memo.coordinate)
    }
  }

  /** Garde le rendu d'un volet fermé (cf. `_buried`). */
  protected bury(id: string, render: Type_PaneRender, camera?: Type_Camera): void {
    const previous = this._buried.get(id)
    if (previous && previous.render.doc !== render.doc) this.disposeDocument(previous.render.doc)
    this._buried.delete(id)
    this._buried.set(id, { render, camera })
    while (this._buried.size > Class_SankeyPanes.BURIED_MAX) {
      const oldest = this._buried.keys().next().value as string
      const gone = this._buried.get(oldest)
      this._buried.delete(oldest)
      if (gone) this.disposeDocument(gone.render.doc)
    }
  }

  /** Un volet fermé revient (« annuler ») : il reprend son rendu et sa caméra. */
  protected resurrect(id: string): void {
    const buried = this._buried.get(id)
    if (!buried) return
    this._buried.delete(id)
    const o = this.paneById(id)
    if (!o || buried.render.doc.disposed || buried.render.coordinate !== this.coordinateOf(o)) {
      this.disposeDocument(buried.render.doc)
      return
    }
    this.setRender(id, buried.render)
    if (buried.camera) this._cameras.set(id, buried.camera)
  }

  // RENDUS DES VOLETS INACTIFS =====================================================================

  /** Un document hors écran, non éditable, bâti sur une zone de dessin sérialisée. */
  protected buildDocument(json: Type_JSON): Class_ApplicationData {
    const doc = this.host.workspace.createDocument({ offscreen: true })
    const da = doc.drawing_area
    da.bypass_redraws = true
    doc.loadDrawingAreaFromJSON(da, json)
    da.afterFromJSON()
    doc.edition_allowed = false
    return doc
  }

  protected setRender(pane_id: string, render: Type_PaneRender): void {
    const previous = this._renders.get(pane_id)
    this._renders.set(pane_id, render)
    this.bumpVersion(pane_id)
    if (previous && previous.doc !== render.doc) this.disposeDocument(previous.doc)
  }

  protected disposeRender(pane_id: string): void {
    const render = this._renders.get(pane_id)
    if (!render) return
    this._renders.delete(pane_id)
    this.bumpVersion(pane_id)
    this.disposeDocument(render.doc)
  }

  protected bumpVersion(pane_id: string): void {
    this._render_versions.set(pane_id, (this._render_versions.get(pane_id) ?? 0) + 1)
  }

  /** La version du rendu du volet (cf. `_render_versions`). */
  public renderVersionOf(pane_id: string): number {
    return this._render_versions.get(pane_id) ?? 0
  }

  protected disposeDocument(doc: Class_ApplicationData): void {
    try { if (!doc.disposed) doc.dispose() } catch { /* un document déjà défait n'a rien à défaire */ }
  }

  /**
   * LE RENDU DU VOLET `pane_id`, s'il est un volet Sankey inactif : bâti au premier appel, gardé
   * ensuite (et refait quand les données du modèle changent, cf. `refresh`). `null` pour le volet
   * vivant, qui montre le dessin lui-même.
   */
  public renderOf(pane_id: string): Class_ApplicationData | null {
    const mc = this.host.menu_configuration
    const o = this.paneById(pane_id)
    if (!mc || !o || mc.main_zone_live_sankey_id === pane_id) return null
    const coordinate = this.coordinateOf(o)
    const existing = this._renders.get(pane_id)
    if (existing && !existing.doc.disposed && existing.coordinate === coordinate) return existing.doc
    const render = this.buildRender(o, coordinate, existing && existing.coordinate === coordinate ? existing : undefined)
    if (!render) return null
    this.setRender(pane_id, render)
    return render.doc
  }

  /**
   * BÂTIR LE RENDU d'un volet : les données de sa vue, habillées de sa mise en page.
   *
   *  - vue lourde endormie : l'instantané de la vue, tel quel (il porte sa mise en page) ;
   *  - vue lourde courante : un MIROIR du dessin vivant — tous les volets d'une vue lourde la
   *    partagent ;
   *  - le modèle (maître, vue légère) : les données du maître, puis la mise en page du volet — son
   *    rendu précédent, sinon celle que sa vue enregistre —, puis la sélection d'étiquettes de vue
   *    de sa coordonnée.
   */
  protected buildRender(
    o: Type_MainZoneOccupant, coordinate: string, previous?: Type_PaneRender
  ): Type_PaneRender | null {
    const host = this.host
    if (this.isHeavyView(coordinate)) {
      if (coordinate === host.current_view_id) {
        return {
          doc: this.buildDocument(host.dumpDrawingAreaToJSON(host.drawing_area)),
          coordinate, data_key: null, mirror: true
        }
      }
      const entry = host.views_dict[coordinate]
      const json = JSON.parse(pako.inflate(new Uint8Array(entry.json), { to: 'string' })) as Type_JSON
      return { doc: this.buildDocument(json), coordinate, data_key: null, mirror: false }
    }
    const base = this.baseDrawingArea()
    if (!base) return null
    const doc = this.buildDocument(host.dumpDrawingAreaToJSON(base))
    const entry = host.views_dict[coordinate]
    const registered = !!entry?.own_layout && this.isRegisteredOn(o, coordinate)
    const parked = this.parkedBase()
    if (!registered && previous && !previous.doc.disposed) {
      this.applyLayout(doc.drawing_area, previous.doc.drawing_area)
    } else if (entry?.own_layout) {
      const da = this.viewDrawingArea(coordinate)
      if (da) {
        try { this.applyLayout(doc.drawing_area, da) } finally { da.delete() }
      }
    } else if (parked) {
      // La zone du modèle montre une vue à mise en page propre : la base est à l'abri.
      this.applyLayout(doc.drawing_area, parked.drawing_area)
    }
    doc.applyViewTagSelection(entry?.tag_selection)
    // sa#603 — le modèle montrait la lecture du vivant : le rendu prend celle de SON volet.
    this.giveRenderReading(o, doc)
    return { doc, coordinate, data_key: sankeyDataKey(base.sankey), mirror: false }
  }

  /** La zone de dessin qui porte les données du MODÈLE : le vivant s'il le montre, sinon le maître. */
  protected baseDrawingArea(): Class_DrawingArea | null {
    const host = this.host
    if (!this.isHeavyView(host.current_view_id)) return host.drawing_area
    return host.master_drawing_area ?? null
  }

  // FRAÎCHEUR DES RENDUS ===========================================================================

  /**
   * Branche la fraîcheur des rendus sur les dessins du vivant ET sur son historique : un geste de
   * l'utilisateur ne redessine souvent que ce qu'il touche — un nœud créé à la souris ne dessine
   * que lui —, mais il s'inscrit toujours à l'historique. Sans ce second signal, le nœud ne
   * paraissait dans les autres volets qu'à leur activation (retour d'Alexandre, 30/09).
   */
  public listen(): void {
    const mc = this.host.menu_configuration
    if (!mc || this._unsubscribe_draw) return
    const off_draw = mc.subscribe(DRAW_TOPIC, () => { this.scheduleRefresh(); this.guardSoon() })
    const off_history = mc.subscribe(HISTORY_TOPIC, () => this.scheduleRefresh())
    this._unsubscribe_draw = () => { off_draw(); off_history() }
  }

  /**
   * sa#568 — OBSERVER LE DOM DU DESSIN VIVANT : tout ce qui change à l'écran programme un relevé.
   *
   * Recette du 03/10 (Alexandre : « la nouvelle position du nœud ne s'affiche que lorsque les volets
   * sont actifs, idem pour les couleurs de flux ») : ni l'historique, ni le dessin complet, ni même
   * `Element.draw` ne voient tous les gestes — un glisser pose sa position directement sur le SVG
   * (`setPosXY` → `applyPosition`), un réglage d'élément redessine une sous-partie. Le DOM, lui, voit
   * tout : c'est le seul signal qui ne dépende d'aucun chemin de code. L'observateur ne lit pas ce
   * qui a changé (l'empreinte s'en charge) : il ne fait que programmer le relevé différé.
   *
   * Observé : le conteneur du dessin vivant, qui survit aux dessins complets. Les rendus des autres
   * volets sont ailleurs dans la page : leurs propres redessins ne relancent rien.
   */
  public observeLive(): void {
    const da = this.host.drawing_area
    const doc = da.container_owner_document ?? (typeof document !== 'undefined' ? document : null)
    const el = doc ? doc.querySelector(da.container_selector) : null
    if (el === this._observed) return
    this._observer?.disconnect()
    this._observer = null
    this._observed = el
    const Observer = doc?.defaultView?.MutationObserver
    if (!el || !Observer) return
    const observer = new Observer(() => this.scheduleRefresh())
    observer.observe(el, { subtree: true, childList: true, attributes: true, characterData: true })
    this._observer = observer
  }

  /**
   * sa#568 — LE CONTEXTE D'UN GESTE, pour l'historique (cf. `Type_HistoryContext`) : le volet Sankey
   * vivant au moment du geste. L'annuler ou le rétablir le fait d'abord redevenir le vivant — sans
   * quoi un geste fait dans le volet A, défait pendant que B est le vivant, toucherait la mise en
   * page de B. Un volet fermé depuis ne se rouvre pas : le geste se rejoue là où l'on est.
   */
  /** sa#568 — la dernière entrée inscrite par `undo_recorder`, pour fondre un geste continu. */
  protected _last_record: { key: string, stamp: number, at: number } | null = null

  /** Délai sous lequel deux écritures des mêmes réglages font un seul geste (un curseur qui glisse). */
  protected static readonly MERGE_MS = 600

  /**
   * sa#568 — L'HISTORIQUE DES RÉGLAGES DE FIGURE (cf. `Class_MenuConfig.recordUndoable`) : chaque
   * geste y entre, mais un geste CONTINU n'y entre qu'une fois — une écriture qui suit la précédente
   * sur la même clé (même figure, mêmes réglages), sans aucune entrée entre les deux et dans la
   * foulée, en remplace seulement le rétablissement. « Annuler » ramène donc au début du geste, et
   * « rétablir » à sa fin. Hors contexte : l'entrée vise sa figure elle-même.
   */
  public readonly undo_recorder = (undo: () => void, redo: () => void, merge_key: string): void => {
    const history = this.host.history
    const now = Date.now()
    const last = this._last_record
    if (last && last.key === merge_key && last.stamp === history.stamp &&
      now - last.at < Class_SankeyPanes.MERGE_MS) {
      history.saveRedo(redo, false)
      last.at = now
      return
    }
    history.saveUndo(undo, false)
    history.saveRedo(redo, false)
    this._last_record = { key: merge_key, stamp: history.stamp, at: now }
  }

  public readonly history_context: Type_HistoryContext = {
    capture: () => this.host.menu_configuration?.main_zone_live_sankey_id ?? null,
    restore: (context: unknown) => {
      const mc = this.host.menu_configuration
      if (!mc || typeof context !== 'string' || mc.main_zone_live_sankey_id === context) return
      if (!this.paneById(context)) return
      mc.main_zone_active_id = context
      this.sync()
    }
  }

  protected scheduleRefresh(): void {
    if ((this._renders.size === 0 && !this.showsOwnReading()) || typeof setTimeout === 'undefined') return
    if (this._refresh_timer !== null) clearTimeout(this._refresh_timer)
    this._refresh_timer = setTimeout(() => {
      this._refresh_timer = null
      this.refresh()
    }, REFRESH_DELAY_MS)
  }

  /**
   * REFAIRE LES RENDUS QUE LE VIVANT A RENDUS FAUX : ceux du modèle quand ses DONNÉES ont changé
   * (la mise en page propre de chaque volet est reprise de son rendu précédent), et les miroirs
   * d'une vue lourde courante à chaque dessin. Rend `true` si un rendu a été refait.
   */
  public refresh(): boolean {
    const host = this.host
    const mc = host.menu_configuration
    if (!mc) return false
    // sa#603 — un geste de la barre générale sur un groupe que le vivant a choisi pour lui (filet :
    // `guardSoon` l'a d'ordinaire déjà vu).
    if (this.reconcileLive()) this.redrawLive()
    if (this._renders.size === 0) return false
    const current_heavy = this.isHeavyView(host.current_view_id)
    const base_key = current_heavy ? null : sankeyDataKey(host.drawing_area.sankey)
    const epoch = host.draw_epoch
    let changed = false
    Array.from(this._renders.entries()).forEach(([pane_id, render]) => {
      const o = this.paneById(pane_id)
      if (!o) { this.disposeRender(pane_id); return }
      if (render.mirror) {
        if (render.coordinate !== host.current_view_id || epoch !== this._mirror_epoch) {
          const next = this.buildRender(o, this.coordinateOf(o), render)
          if (next) { this.setRender(pane_id, next); changed = true }
        }
        return
      }
      if (render.data_key === null || base_key === null || render.data_key === base_key) return
      const next = this.buildRender(o, this.coordinateOf(o), render)
      if (next) { this.setRender(pane_id, next); changed = true }
    })
    this._mirror_epoch = epoch
    // sa#603 — la valeur commune a peut-être changé (barre générale) : les volets qui la suivent la
    // prennent. Avant la mise en page : un rendu qu'elle change se redessine en entier.
    if (this.reconcileRenders()) changed = true
    // sa#568 — APRÈS les rendus refaits : un rendu rebâti part de sa mise en page d'avant, et
    // reçoit ensuite ce que le vivant partage avec lui.
    if (this.shareLiveLayout()) changed = true
    if (changed) mc.notifyMainZone()
    return changed
  }

  // MISE EN PAGE SYNCHRONISÉE (sa#568) =============================================================
  //
  // Deux volets Sankey synchronisés sur un réglage de mise en page (positions des nœuds, attributs
  // des flux, échelle… — les cases du menu Transformations) montrent la même chose pour ce réglage.
  // Le seul dessin qu'on édite est le vivant : c'est donc de lui que la mise en page part, vers les
  // RENDUS des volets synchronisés, après chaque geste. L'inverse va de soi : un volet qu'on active
  // pose sa mise en page — déjà synchronisée — sur le dessin, et c'est lui qui la donne ensuite.
  //
  // CE QUI A ÉTÉ CORRIGÉ À LA RECETTE DU 03/10 (Alexandre : « déplacer un nœud dans un volet ne le
  // bouge pas dans l'autre, idem pour la couleur d'un flux » ; « c'est super lent ») :
  //  - LE SIGNAL. La première passe n'écoutait que l'historique et les dessins complets. Or un
  //    glisser n'inscrit son annulation que si le nœud a bougé en x ET en y (un déplacement
  //    aimanté sur une ligne n'en inscrit pas), pose sa position directement sur le SVG, et un
  //    réglage d'élément ne redessine qu'une partie de l'élément. Le signal est désormais le DOM du
  //    dessin vivant lui-même (`observeLive`), et chaque activation relève ce qui aurait échappé.
  //  - LA RECOPIE. `updateFrom` réapparie tout le modèle et, sur un rendu déjà dessiné, redessinait
  //    chaque élément touché — 1,2 s sur 300 nœuds, puis 1,8 s de dessin complet. On compare
  //    désormais une EMPREINTE du dessin élément par élément (quelques ms), on ne rejoue que les
  //    modes concernés sans redessiner, puis on ne redessine QUE les éléments changés.
  //  - LES VUES LOURDES : leurs volets montrent un MIROIR du vivant, qui ne se refaisait qu'aux
  //    dessins complets. Un miroir est un volet synchronisé sur tout : il suit chaque geste.

  /** Au-delà, redessiner élément par élément coûte plus qu'un dessin complet. */
  protected static readonly INCREMENTAL_MAX = 60

  /** Les volets à qui le vivant donne sa mise en page, et quels modes : synchronisés, et miroirs. */
  protected layoutTargetsOf(live: Type_MainZoneOccupant): Map<string, string[]> {
    const mc = this.host.menu_configuration
    const out = new Map<string, string[]>()
    SANKEY_LAYOUT_SETTINGS.forEach(({ mode }) => {
      mc.mainZoneSyncPartners(live.id, layoutSetting(mode)).forEach(id => {
        out.set(id, [...(out.get(id) ?? []), mode])
      })
    })
    // Le miroir d'une vue lourde EST le dessin vivant (#581) : il en suit toute la mise en page.
    this._renders.forEach((render, id) => {
      if (render.mirror && id !== live.id) out.set(id, SANKEY_LAYOUT_SETTINGS.map(s => s.mode))
    })
    return out
  }

  /**
   * PORTE AUX VOLETS SYNCHRONISÉS ce qui a changé dans le dessin vivant depuis la dernière fois.
   * Rend `true` si un rendu doit être remonté (il a été trop changé pour un redessin élément par
   * élément) — c'est ce qui oblige la grande zone à se rafraîchir ; un redessin élément par élément
   * se fait sur place, sans elle.
   */
  public shareLiveLayout(): boolean {
    const mc = this.host.menu_configuration
    const live = this.paneById(mc?.main_zone_live_sankey_id ?? null)
    if (!mc || !live) { this._print = null; return false }
    const targets = this.layoutTargetsOf(live)
    if (targets.size === 0) { this._print = null; return false }
    const print = layoutPrintOf(this.host.dumpDrawingAreaToJSON(this.host.drawing_area))
    const before = this._print
    this._print = { pane: live.id, print }
    // Premier relevé, ou un autre volet vient de devenir le vivant : il a posé sa mise en page, déjà
    // synchronisée, sur le dessin — il n'y a rien à donner.
    if (!before || before.pane !== live.id) return false
    const changes = layoutChangesOf(before.print, print)
    if (!hasLayoutChanges(changes)) return false
    let remount = false
    targets.forEach((modes, id) => {
      const o = this.paneById(id)
      const todo = modesForChanges(changes, modes)
      if (!o || todo.length === 0) return
      if (this.applyToRender(o, this.host.drawing_area, todo, changes) === 'remount') remount = true
    })
    return remount
  }

  /**
   * L'ÉTAT DE RÉFÉRENCE : le vivant et ses volets synchronisés montrent la même chose, on en prend
   * l'empreinte — le prochain relevé ne donnera que ce qui aura changé depuis. À prendre AVANT le
   * geste suivant : à la fin d'une activation et après un cochage. Pris au premier relevé, il
   * arriverait après le premier geste, qui ne partirait jamais.
   */
  public markShared(): void {
    const mc = this.host.menu_configuration
    const live = this.paneById(mc?.main_zone_live_sankey_id ?? null)
    if (!mc || !live || this.layoutTargetsOf(live).size === 0) { this._print = null; return }
    this._print = { pane: live.id, print: layoutPrintOf(this.host.dumpDrawingAreaToJSON(this.host.drawing_area)) }
  }

  /** Ce qui reste à donner part MAINTENANT : un volet va devenir le vivant, ou le fichier s'écrire. */
  public flushPendingShare(): void {
    if (this._refresh_timer === null) return
    clearTimeout(this._refresh_timer)
    this._refresh_timer = null
    this.refresh()
  }

  /**
   * SYNCHRONISE la mise en page du volet `to_id` sur celle de `from_id`, pour ces modes seulement : le
   * geste « cocher la colonne de `from_id` dans le menu de `to_id` » (cf.
   * `Class_ApplicationData.linkMainZonePanes`).
   */
  public alignLayout(from_id: string, to_id: string, modes: string[]): void {
    const mc = this.host.menu_configuration
    const to = this.paneById(to_id)
    if (!mc || !to || !this.paneById(from_id) || modes.length === 0) return
    const live_id = mc.main_zone_live_sankey_id
    const source = from_id === live_id ? this.host.drawing_area : this.renderOf(from_id)?.drawing_area
    if (!source) return
    if (to_id === live_id) {
      const da = this.host.drawing_area
      const was = da.bypass_redraws
      da.bypass_redraws = true
      try { updateFrom(da, source, [...modes, 'keepPositionType']) } finally { da.bypass_redraws = was }
      // Le vivant a changé : le prochain relevé le donnera à ses autres volets synchronisés.
      da.draw()
      return
    }
    this.renderOf(to_id)
    if (this.applyToRender(to, source, modes, null) === 'remount') mc.notifyMainZone()
  }

  /**
   * Pose ces modes de `source` sur le RENDU du volet inactif `o`, sans redessin pendant la recopie,
   * puis redessine ce qui a changé : élément par élément quand on sait lesquels et qu'ils sont peu
   * nombreux, sinon en remontant le rendu (dessin complet). Garde aussi la vue dont le volet est
   * le volet enregistré à mise en page propre, puisque c'est elle que son activation relira. Rien
   * pour un volet sans rendu (il naîtra du dessin vivant) ni pour une vue lourde qui n'est pas un
   * miroir (elle porte ses propres données).
   */
  protected applyToRender(
    o: Type_MainZoneOccupant, source: Class_DrawingArea, modes: string[], changes: Type_LayoutChanges | null
  ): 'none' | 'drawn' | 'remount' {
    const coordinate = this.coordinateOf(o)
    const render = this._renders.get(o.id)
    if (!render || render.doc.disposed || (!render.mirror && this.isHeavyView(coordinate))) return 'none'
    const da = render.doc.drawing_area
    if (da === source) return 'none'
    const was = da.bypass_redraws
    da.bypass_redraws = true
    try { updateFrom(da, source, [...modes, 'keepPositionType']) } finally { da.bypass_redraws = was }
    const entry = this.host.views_dict[coordinate]
    if (!render.mirror && entry?.own_layout && this.isRegisteredOn(o, coordinate)) {
      entry.json = compressJSONToGzip(this.host.dumpDrawingAreaToJSON(da)) as Uint8Array
    }
    // Jamais dessiné (pas encore monté) : il se dessinera en montant, déjà à jour.
    if (was || !da.d3_selection_zoom_area) return 'none'
    const count = changes ? changes.nodes.length + changes.links.length + changes.labels.length : Infinity
    if (changes && !changes.area && count <= Class_SankeyPanes.INCREMENTAL_MAX) {
      this.redrawChanged(da, changes)
      return 'drawn'
    }
    this.bumpVersion(o.id)
    return 'remount'
  }

  /** Redessine, dans un rendu, les éléments changés — et les flux des nœuds changés. */
  protected redrawChanged(da: Class_DrawingArea, changes: Type_LayoutChanges): void {
    const sankey = da.sankey
    changes.nodes.forEach(id => {
      const node = sankey.nodes_dict[id]
      if (!node) return
      node.draw()
      node.drawLinks()
    })
    changes.links.forEach(id => sankey.links_dict[id]?.draw())
    if (changes.labels.length > 0) {
      const ids = new Set(changes.labels)
      sankey.containers_list.forEach(c => { if (ids.has(c.id)) c.draw() })
    }
  }

  /**
   * DEUX VOLETS QUI MONTRENT LE MÊME DESSIN : synchronisés sur toute la mise en page, sur la même
   * vue ordinaire (ni lourde, ni à mise en page propre), le premier vivant et maître de sa mise en
   * page, le second avec un rendu prêt. Passer de l'un à l'autre n'a alors rien à recopier ni à
   * redessiner (cf. `swapLive`).
   */
  protected canSwap(from: Type_MainZoneOccupant, to: Type_MainZoneOccupant): boolean {
    const mc = this.host.menu_configuration
    const coordinate = this.coordinateOf(to)
    if (this._layout_owner !== from.id || this.coordinateOf(from) !== coordinate) return false
    if (coordinate !== this.host.current_view_id || this.isHeavyView(coordinate)) return false
    if (this.host.views_dict[coordinate]?.own_layout || this.parkedBase()) return false
    const render = this._renders.get(to.id)
    if (!render || render.doc.disposed || render.mirror || render.coordinate !== coordinate) return false
    // sa#603 — et ils montrent les mêmes données : rien de choisi pour l'un seul.
    if (!sameOwnReading(from, to)) return false
    return SANKEY_LAYOUT_SETTINGS.every(({ mode }) =>
      mc.mainZoneSyncPartners(from.id, layoutSetting(mode)).includes(to.id))
  }

  /**
   * L'ÉCHANGE (sa#568, retour d'Alexandre du 03/10 : « c'est super lent de passer d'un volet à
   * l'autre ») : le volet activé reçoit le dessin vivant TEL QU'IL EST — seul son cadre bouge, ce
   * qui ne redessine rien —, et le volet quitté reprend le rendu du volet activé, qui montrait déjà
   * la même chose — l'affichage le récupère sans le redessiner (cf. `SankeyRenderOccupant`).
   * Mesuré sur 300 nœuds : deux dessins complets (≈ 3 s) évités à chaque bascule.
   *
   * L'historique n'est pas remis à zéro : il parlait de ce même dessin, qui n'a pas changé — on
   * peut annuler, après avoir changé de volet, le geste fait dans l'autre.
   */
  protected swapLive(from: Type_MainZoneOccupant, to: Type_MainZoneOccupant): void {
    const mc = this.host.menu_configuration
    const camera = this.host.drawing_area.getCameraTransform()
    if (camera) this._cameras.set(from.id, camera)
    const render = this._renders.get(to.id)!
    this._renders.delete(to.id)
    this._renders.set(from.id, render)
    this.bumpVersion(from.id)
    this.bumpVersion(to.id)
    mc.main_zone_live_sankey_id = to.id
    this._layout_owner = to.id
  }

  /**
   * sa#568 — LA MISE EN PAGE DE CES VOLETS, telle qu'elle est (pour défaire un cochage) : le dessin
   * vivant pour le vivant, le rendu pour les autres. Un volet sans rendu n'a rien à retenir : il
   * renaîtra du dessin vivant.
   */
  public layoutSnapshots(ids: string[]): { pane: string, json: Type_JSON }[] {
    const live_id = this.host.menu_configuration?.main_zone_live_sankey_id ?? null
    const out: { pane: string, json: Type_JSON }[] = []
    ids.forEach(id => {
      if (!this.paneById(id)) return
      if (id === live_id) { out.push({ pane: id, json: this.host.dumpDrawingAreaToJSON(this.host.drawing_area) }); return }
      const render = this._renders.get(id)
      if (render && !render.doc.disposed) out.push({ pane: id, json: this.host.dumpDrawingAreaToJSON(render.doc.drawing_area) })
    })
    return out
  }

  /** sa#568 — rend au volet `id` ces modes de la mise en page `json` (cf. `layoutSnapshots`). */
  public restoreLayout(id: string, json: Type_JSON, modes: string[]): void {
    const mc = this.host.menu_configuration
    const o = this.paneById(id)
    if (!mc || !o || modes.length === 0) return
    const source = this.buildDocument(json)
    try {
      if (mc.main_zone_live_sankey_id === id) {
        const da = this.host.drawing_area
        const was = da.bypass_redraws
        da.bypass_redraws = true
        try { updateFrom(da, source.drawing_area, [...modes, 'keepPositionType']) } finally { da.bypass_redraws = was }
        da.draw()
      } else if (this.applyToRender(o, source.drawing_area, modes, null) === 'remount') {
        mc.notifyMainZone()
      }
    } finally {
      this.disposeDocument(source)
    }
  }

  // LECTURE DES VOLETS (sa#603) ====================================================================
  //
  // Un volet Sankey peut choisir, dans le bandeau sous son en-tête, ce qu'il montre d'un groupe
  // d'étiquettes (l'année, le niveau, un filtre) : c'est SA lecture (`occupant.reading`), écrite
  // dans le fichier. Pour un groupe qu'il n'a pas choisi, il SUIT LA BARRE GÉNÉRALE : il montre la
  // VALEUR COMMUNE.
  //
  // Où vit la valeur commune : dans le modèle, que la barre générale et tous les menus lisent et
  // règlent — sauf pour les groupes que le volet VIVANT a choisis pour lui, où le modèle montre son
  // choix. La valeur commune attend alors à côté (`_common`), et c'est elle que le fichier écrit à sa
  // racine (`withCommonReading`).
  //
  // LA BARRE GÉNÉRALE RÈGLE TOUJOURS LA VALEUR COMMUNE (l'exemple de l'issue : le second volet a
  // choisi 2021, on passe la barre à 2020, seul le premier change — même si le second est l'actif).
  // Elle a une dizaine d'entrées (barre du haut, panneau de filtres, menus, tableau de navigation…),
  // qui toutes changent le modèle : plutôt que de les détourner une à une, on CONSTATE l'écart après
  // coup (`reconcileLive`). Si le modèle ne montre plus ce que le volet vivant a choisi, c'est la
  // valeur commune qui vient de changer : on la retient, et le choix du volet revient — avant que
  // l'écran ne se peigne (`guardSoon`). Les sélecteurs de la barre affichent la valeur commune
  // (`commonReadingOfGroup`).
  //
  // Les RENDUS des volets inactifs montrent leur choix, la valeur commune pour le reste
  // (`reconcileRenders`), après chaque geste.

  /** Les réglages de données du modèle : un par groupe d'étiquettes (cf. `paneReading`). */
  protected dataSettings(): string[] {
    const base = this.baseDrawingArea()
    return base ? sankeyDataSettings(base.sankey) : []
  }

  /** Le modèle montre-t-il en ce moment ce qu'un volet a choisi pour lui seul ? */
  protected showsOwnReading(): boolean {
    return Object.keys(this._applied.actual).length > 0
  }

  /** Le volet vivant, s'il se dessine sur le modèle (une vue lourde porte ses propres données). */
  protected liveOnModel(): Type_MainZoneOccupant | undefined {
    const live = this.paneById(this.host.menu_configuration?.main_zone_live_sankey_id ?? null)
    if (!live || this.isHeavyView(this.coordinateOf(live))) return undefined
    return live
  }

  /** LA VALEUR COMMUNE de ces réglages : celle qui attend à côté, sinon celle que montre le modèle. */
  public commonReading(settings: string[]): Type_PaneReading {
    const base = this.baseDrawingArea()
    const out: Type_PaneReading = base ? readingOf(base.sankey, settings.filter(s => !this._common[s])) : {}
    settings.forEach(s => { if (this._common[s]) out[s] = this._common[s] })
    return out
  }

  /**
   * CE QUE LE VOLET `pane_id` MONTRE D'UN GROUPE : son propre choix (`own`), ou `null` s'il suit la
   * barre générale ; et ce qu'il montre (`shown`) — son choix, sinon la valeur commune.
   */
  public paneReadingState(pane_id: string, setting: string): { own: Type_GroupReading | null, shown: Type_GroupReading | null } {
    const o = this.paneById(pane_id)
    const own = o ? ownReadingOf(o)[setting] ?? null : null
    return { own, shown: own ?? this.commonReading([setting])[setting] ?? null }
  }

  /**
   * POUR LA BARRE GÉNÉRALE : la valeur commune d'un groupe du modèle quand le volet vivant en
   * montre une autre (son choix), `null` quand le modèle montre la valeur commune — la barre lit
   * alors le groupe, comme toujours.
   */
  public commonReadingOfGroup(group: unknown): Type_GroupReading | null {
    const live = this.liveOnModel()
    if (!live) return null
    const setting = dataSettingOfGroup(this.host.drawing_area.sankey, group)
    if (setting === null || !ownReadingOf(live)[setting]) return null
    return this._common[setting] ?? null
  }

  /**
   * Pose une lecture sur une zone de dessin, sans dessiner ; un niveau changé réordonne les flux
   * des nœuds, comme le fait le changement de niveau de la barre générale.
   */
  protected setReadings(da: Class_DrawingArea, reading: Type_PaneReading): void {
    if (!applyReading(da.sankey, reading)) return
    if (Object.keys(reading).some(s => parseDataSetting(s)?.family === 'lt')) {
      da.reorganizeIOLinksOf(da.sankey.nodes_list)
    }
  }

  /** Pose sur le modèle la lecture `r` d'un réglage, si elle n'y est pas. Rend `true` s'il a changé. */
  protected setReadingIfNeeded(da: Class_DrawingArea, setting: string, r: Type_GroupReading): boolean {
    if (readingPrintOf(readingOf(da.sankey, [setting]))[setting] === JSON.stringify(r)) return false
    this.setReadings(da, { [setting]: r })
    return true
  }

  /** Oublie ce que le modèle montrait pour un volet : il montre la valeur commune. */
  protected forgetApplied(): void {
    this._common = {}
    this._applied = { pane: null, area: null, wanted: {}, actual: {} }
  }

  /**
   * LE MODÈLE MONTRE CE QUE LE VOLET VIVANT DOIT MONTRER : son choix pour les groupes qu'il a
   * choisis, la valeur commune pour les autres. Ne dessine pas ; rend `true` si le modèle a changé.
   *
   *  1. Un groupe choisi par le vivant que le modèle ne montre plus tel qu'on l'y avait posé : la
   *     barre générale (ou une annulation) a réglé la VALEUR COMMUNE — on la retient.
   *  2. Un groupe que le vivant ne choisit plus (il suit de nouveau, ou un autre volet est devenu
   *     le vivant) : la valeur commune revient sur le modèle.
   *  3. Un groupe qu'il a choisi : son choix va sur le modèle, la valeur commune attend à côté.
   */
  public reconcileLive(): boolean {
    const mc = this.host.menu_configuration
    if (!mc || !this.host.is_main) return false
    const live = this.liveOnModel()
    if (!live) return false
    const da = this.host.drawing_area
    // Un autre modèle est venu (fichier rouvert, geste lourd annulé) : il montre la valeur commune,
    // celle que le fichier écrit à sa racine.
    if (this._applied.area !== null && this._applied.area !== da) this.forgetApplied()
    const settings = new Set(this.dataSettings())
    const own = ownReadingOf(live)
    let changed = false
    const was = da.bypass_redraws
    da.bypass_redraws = true
    try {
      const shown = Object.keys(this._applied.actual)
      if (shown.length > 0) {
        const now = readingPrintOf(readingOf(da.sankey, shown))
        shown.forEach(s => {
          if (now[s] === this._applied.actual[s]) return
          const r = readingOf(da.sankey, [s])[s]
          if (r) this._common[s] = r
          else delete this._common[s]
          delete this._applied.actual[s]
          delete this._applied.wanted[s]
        })
      }
      Object.keys(this._common).forEach(s => {
        if (own[s] && settings.has(s)) return
        const common = this._common[s]
        delete this._common[s]
        delete this._applied.actual[s]
        delete this._applied.wanted[s]
        if (settings.has(s) && this.setReadingIfNeeded(da, s, common)) changed = true
      })
      Object.entries(own).forEach(([s, r]) => {
        if (!settings.has(s)) return
        const want = JSON.stringify(r)
        if (this._applied.pane === live.id && this._applied.wanted[s] === want && s in this._common) return
        if (!(s in this._common)) {
          const common = readingOf(da.sankey, [s])[s]
          if (common) this._common[s] = common
        }
        if (this.setReadingIfNeeded(da, s, r)) changed = true
        this._applied.wanted[s] = want
        this._applied.actual[s] = readingPrintOf(readingOf(da.sankey, [s]))[s]
      })
      this._applied.pane = live.id
      this._applied.area = Object.keys(this._applied.actual).length > 0 ? da : null
    } finally {
      da.bypass_redraws = was
    }
    return changed
  }

  /** Vrai pendant que le document redessine le vivant pour sa lecture (cf. `guardSoon`). */
  protected _redrawing_live = false

  /**
   * Redessine le vivant après qu'on a posé sa lecture, et remet à jour la barre générale. Ce que le
   * dessin a fait de la lecture (il en normalise parfois une) est ce qu'on retient comme posé.
   */
  protected redrawLive(): void {
    const da = this.host.drawing_area
    this._redrawing_live = true
    try { da.draw() } finally { this._redrawing_live = false }
    const shown = Object.keys(this._applied.actual)
    if (shown.length > 0) Object.assign(this._applied.actual, readingPrintOf(readingOf(da.sankey, shown)))
    this.host.menu_configuration?.updateAllComponentsRelatedToTags()
  }

  /**
   * APRÈS UN DESSIN DU VIVANT, AVANT QUE L'ÉCRAN NE SE PEIGNE : si la barre générale vient de changer
   * un groupe que le vivant a choisi pour lui, la valeur commune est retenue et son choix revient
   * (cf. `reconcileLive`). Une micro-tâche : le geste a fini de régler le modèle, et le navigateur
   * n'a encore rien montré.
   */
  protected guardSoon(): void {
    if (this._guard_queued || this._redrawing_live || !this.showsOwnReading()) return
    if (typeof queueMicrotask !== 'function') return
    this._guard_queued = true
    queueMicrotask(() => {
      this._guard_queued = false
      if (this._busy) return
      try {
        if (this.reconcileLive()) this.redrawLive()
        if (this.reconcileRenders()) this.host.menu_configuration?.notifyMainZone()
      } catch (error) {
        console.error('sa#603 — lecture des volets Sankey :', error)
      }
    })
  }

  /**
   * LES RENDUS DES VOLETS INACTIFS montrent ce qu'ils doivent : leur choix, la valeur commune pour
   * le reste. Rend `true` si un rendu doit être remonté.
   */
  public reconcileRenders(): boolean {
    if (this._renders.size === 0) return false
    const settings = this.dataSettings()
    if (settings.length === 0) return false
    const common = this.commonReading(settings)
    let remount = false
    this._renders.forEach((render, id) => {
      const o = this.paneById(id)
      if (!o || render.mirror || render.doc.disposed || this.isHeavyView(this.coordinateOf(o))) return
      if (this.giveRenderReading(o, render.doc, settings, common)) remount = true
    })
    return remount
  }

  /**
   * Pose sur le rendu `doc` du volet `o` ce qu'il doit montrer, sans dessiner. Rend `true` — et
   * avance la version du rendu — s'il était déjà dessiné et qu'il faut le remonter.
   */
  protected giveRenderReading(
    o: Type_MainZoneOccupant, doc: Class_ApplicationData,
    settings: string[] = this.dataSettings(), common: Type_PaneReading = this.commonReading(settings)
  ): boolean {
    const own = ownReadingOf(o)
    const wanted: Type_PaneReading = {}
    settings.forEach(s => {
      const r = own[s] ?? common[s]
      if (r) wanted[s] = r
    })
    const print = readingPrintOf(wanted)
    const da = doc.drawing_area
    const before = this._render_prints.get(doc) ?? readingPrintOf(readingOf(da.sankey, settings))
    const diff = changedReadingSettings(before, print).filter(s => wanted[s])
    this._render_prints.set(doc, print)
    if (diff.length === 0) return false
    const was = da.bypass_redraws
    da.bypass_redraws = true
    try { this.setReadings(da, pickReading(wanted, diff)) } finally { da.bypass_redraws = was }
    // Jamais dessiné (pas encore monté) : il se dessinera en montant, déjà à jour.
    if (was || !da.d3_selection_zoom_area) return false
    this.bumpVersion(o.id)
    return true
  }

  /**
   * LE CHOIX D'UN VOLET, DEPUIS SON EN-TÊTE : `choose` règle le groupe sur le document du volet (le
   * dessin vivant, ou son rendu) avec le geste ordinaire de ce groupe, et rend `true` s'il a déjà
   * dessiné. Ce que le groupe montre ensuite devient la lecture du volet, retenue dans la grande
   * zone (annulable par l'appelant, cf. `undoableMainZone`). Rien pour un volet sur une vue lourde.
   */
  public choosePaneReading(pane_id: string, setting: string, choose: (doc: Class_ApplicationData) => boolean): void {
    const mc = this.host.menu_configuration
    const o = this.paneById(pane_id)
    if (!mc || !o || this.isHeavyView(this.coordinateOf(o))) return
    const live = mc.main_zone_live_sankey_id === pane_id
    const doc = live ? this.host : this.renderOf(pane_id)
    if (!doc) return
    const da = doc.drawing_area
    if (live) {
      // Le modèle montre d'abord ce qu'il doit ; la valeur commune est mise à l'abri avant le geste.
      this.reconcileLive()
      if (!(setting in this._common)) {
        const common = readingOf(da.sankey, [setting])[setting]
        if (common) this._common[setting] = common
      }
    }
    const drew = choose(doc)
    const r = readingOf(da.sankey, [setting])[setting]
    if (!r) return
    const print = JSON.stringify(r)
    if (live) {
      this._applied.pane = pane_id
      this._applied.area = da
      this._applied.wanted[setting] = print
      this._applied.actual[setting] = print
      if (!drew) this.redrawLive()
      else mc.updateAllComponentsRelatedToTags()
    } else {
      const prints = this._render_prints.get(doc)
      if (prints) prints[setting] = print
      if (!drew && da.d3_selection_zoom_area) this.bumpVersion(pane_id)
    }
    mc.setSankeyPaneReading(pane_id, setting, r)
  }

  /**
   * Le choix des étiquettes d'un groupe (année, filtre…) depuis l'en-tête du volet `pane_id`.
   * L'étiquette générée « sans étiquette » (SA#553) peut faire partie de `ids`.
   */
  public setPaneSelection(pane_id: string, setting: string, ids: string[]): void {
    this.choosePaneReading(pane_id, setting, doc => {
      const da = doc.drawing_area
      const current = readingOf(da.sankey, [setting])[setting]
      const group = groupOfDataSetting(da.sankey, setting) as unknown as { untagged_tag?: { id: string } } | undefined
      if (!current || !group) return false
      const untagged_id = group.untagged_tag?.id
      const next: Type_GroupReading = { ...current, selected: ids.filter(id => id !== untagged_id) }
      if (untagged_id !== undefined) next.untagged = ids.includes(untagged_id)
      const was = da.bypass_redraws
      da.bypass_redraws = true
      try { this.setReadings(da, { [setting]: next }) } finally { da.bypass_redraws = was }
      return false
    })
  }

  /**
   * EXÉCUTE `work` — l'écriture du fichier — SUR LE MODÈLE REVENU À LA VALEUR COMMUNE : c'est elle
   * que la racine du fichier écrit (les choix des volets sont écrits sur les volets). Puis le modèle
   * reprend ce qu'il montrait, sans rien redessiner.
   */
  public withCommonReading<T>(work: () => T): T {
    const area = this._applied.area
    const settings = Object.keys(this._applied.actual).filter(s => this._common[s])
    if (!area || settings.length === 0) return work()
    const was = area.bypass_redraws
    area.bypass_redraws = true
    const shown = readingOf(area.sankey, settings)
    try {
      applyReading(area.sankey, pickReading(this._common, settings))
      return work()
    } finally {
      try { applyReading(area.sankey, shown) } finally { area.bypass_redraws = was }
    }
  }

  /** Le volet dont `doc` est le rendu, s'il y en a un (cf. l'échange, `swapLive`). */
  public renderOwnerOf(doc: Class_ApplicationData): string | null {
    for (const [id, render] of this._renders) if (render.doc === doc) return id
    return null
  }

  // CYCLE DE VIE ===================================================================================

  /** Le caméra d'un volet quand il a cessé d'être vivant. */
  public cameraOf(pane_id: string): Type_Camera | undefined {
    return this._cameras.get(pane_id)
  }

  /**
   * OUBLIER TOUT : un autre fichier s'ouvre, une autre feuille passe au premier plan. Les rendus
   * montraient un modèle qui n'est plus là ; les coordonnées nommaient des vues qui n'existent plus.
   */
  public reset(): void {
    Array.from(this._renders.keys()).forEach(id => this.disposeRender(id))
    // L'abri de la base décrit la zone de dessin du modèle, pas les volets : il reste tant qu'elle
    // reste (ouvrir un modèle remet les volets à zéro APRÈS l'avoir chargé, abri compris).
    this.parkedBase()
    this._layout_owner = null
    this._print = null
    // sa#603 — le modèle chargé montre la valeur commune (cf. `withCommonReading`).
    this._common = {}
    this._applied = { pane: null, area: null, wanted: {}, actual: {} }
    this._buried.forEach(b => this.disposeDocument(b.render.doc))
    this._buried.clear()
    this._cameras.clear()
    this._known.clear()
    if (this._refresh_timer !== null) { clearTimeout(this._refresh_timer); this._refresh_timer = null }
  }

  public dispose(): void {
    this.reset()
    this.dropBase()
    this._unsubscribe_draw?.()
    this._unsubscribe_draw = null
    this._observer?.disconnect()
    this._observer = null
    this._observed = null
  }
}
