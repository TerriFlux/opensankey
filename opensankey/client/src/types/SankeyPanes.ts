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
import { isSankeyPane, mainZoneSubjectView, type Type_MainZoneOccupant } from './MenuConfig'
import { default_main_sankey_id, type Type_JSON } from './Utils'
import { SANKEY_LAYOUT_SETTINGS, layoutSetting } from '../Representations/paneSync'

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

/**
 * LA CLÉ DES DONNÉES d'un diagramme : ce que tous les volets partagent, et donc ce dont le
 * changement oblige à refaire leurs rendus. Arranger le volet actif — le cas de loin le plus
 * fréquent — ne la change pas, et les autres volets ne se refont pas pour rien.
 *
 * La sélection des étiquettes de VUE n'en fait pas partie : c'est la coordonnée de chaque volet
 * qui la porte (cf. `Class_SankeyPanes.renderOf`). Celle des niveaux et des données (l'année), si :
 * elle reste commune aux volets en attendant sa#568.
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
  delete json['viewTags']
  return JSON.stringify(json)
}

type Type_Camera = NonNullable<ReturnType<Class_DrawingArea['getCameraTransform']>>

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
  /** sa#568 — la mise en page du vivant au dernier partage (cf. `shareLiveLayout`). */
  protected _shared_layout_key: string | null = null

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
      // Un vivant parti dans une fenêtre du système y laissait le dessin : il rentre d'abord, le
      // volet qu'on active le reçoit dans la page.
      const previous = mc.main_zone_live_sankey_id
      if (previous !== null && mc.isMainZoneDetached(previous)) mc.setMainZoneDetached(previous, false)
      if (coordinate === host.current_view_id || !this.viewExists(coordinate)) {
        this.beforeViewChange()
        mc.main_zone_live_sankey_id = id
        const was_bypassing = host.drawing_area.bypass_redraws
        host.drawing_area.bypass_redraws = true
        let changed = false
        try { changed = this.applyLayoutOf(o) } finally { host.drawing_area.bypass_redraws = was_bypassing }
        this._layout_owner = id
        // Le dessin PASSE d'un volet à l'autre : il se redessine avec la mise en page de celui qui le
        // reçoit, et l'historique repart — il parlait de l'autre volet. Rien de tout cela quand il se
        // POSE pour la première fois sans que rien ne change (ouverture d'un document, premier geste
        // dans la grande zone) : ce serait redessiner en plein geste — un survol a ainsi remplacé
        // les éléments qu'il désignait — et oublier pour rien l'historique de l'utilisateur.
        if (previous !== null || changed) {
          host.drawing_area.draw()
          host.resetHistory()
          mc.updateAllMenuComponents()
        }
      } else {
        mc.main_zone_live_sankey_id = id
        host.switchViewForPane(coordinate)
      }
      const camera = this._cameras.get(id)
      if (camera) host.drawing_area.setCamera(camera)
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
    this._busy = true
    try {
      const panes = mc.main_zone_sankey_panes
      const open = new Set(panes.map(p => p.id))
      this._known.forEach((memo, id) => { if (!open.has(id)) this.onPaneClosed(id, memo) })
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
    if (this._layout_owner === id) {
      // Sa mise en page n'est gardée que si une vue la garde ; un volet éphémère l'emporte.
      this._layout_owner = null
      const entry = this.host.views_dict[memo.coordinate]
      if (this.isHeavyView(memo.coordinate) || (entry?.own_layout && memo.saved_view === memo.coordinate)) {
        this.storeLiveInView(memo.coordinate)
      }
    }
    this.disposeRender(id)
    this._cameras.delete(id)
    this._known.delete(id)
    // Une vue éphémère que plus rien ne montre est oubliée (cf. `Type_ViewEntry.ephemeral`).
    const entry = this.host.views_dict[memo.coordinate]
    if (entry?.ephemeral && memo.coordinate !== this.host.current_view_id && !this.anyPaneShows(memo.coordinate)) {
      this.host.forgetEphemeralViewOf(memo.coordinate)
    }
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
    const off_draw = mc.subscribe(DRAW_TOPIC, () => this.scheduleRefresh())
    const off_history = mc.subscribe(HISTORY_TOPIC, () => this.scheduleRefresh())
    this._unsubscribe_draw = () => { off_draw(); off_history() }
  }

  protected scheduleRefresh(): void {
    if (this._renders.size === 0 || typeof setTimeout === 'undefined') return
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
    if (!mc || this._renders.size === 0) return false
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
    // sa#568 — APRÈS les rendus refaits : un rendu rebâti part de sa mise en page d'avant, et
    // reçoit ensuite ce que le vivant partage avec lui.
    if (this.shareLiveLayout()) changed = true
    if (changed) mc.notifyMainZone()
    return changed
  }

  // MISE EN PAGE PARTAGÉE (sa#568) =================================================================
  //
  // Deux volets Sankey qui partagent un réglage de mise en page (positions des nœuds, attributs des
  // flux, échelle… — les cases du menu Transformations) montrent la même chose pour ce réglage. Le
  // seul dessin qu'on édite est le vivant : c'est donc de lui que la mise en page part, vers les
  // RENDUS des volets du même groupe, après chaque geste (le rafraîchissement suit les dessins et
  // l'historique du vivant). L'inverse va de soi : un volet qu'on active pose sa mise en page — déjà
  // partagée — sur le dessin, et c'est lui qui la donne ensuite.
  //
  // Le mode est passé TOUT ENTIER : partager les positions des nœuds, c'est recopier toutes les
  // positions, pas seulement celle du nœud qu'on vient de bouger. C'est ce qui garantit que deux
  // volets partagés ne divergent jamais, même après un geste que le partage n'aurait pas vu.

  /**
   * PORTE AUX VOLETS DU MÊME GROUPE la mise en page du vivant, si elle a changé depuis la dernière
   * fois. Rend `true` si un rendu a reçu quelque chose.
   */
  public shareLiveLayout(): boolean {
    const mc = this.host.menu_configuration
    const live = this.paneById(mc?.main_zone_live_sankey_id ?? null)
    if (!mc || !live || this.isHeavyView(this.coordinateOf(live))) return false
    const by_partner = new Map<string, string[]>()
    SANKEY_LAYOUT_SETTINGS.forEach(({ mode }) => {
      mc.mainZoneSyncPartners(live.id, layoutSetting(mode)).forEach(id => {
        by_partner.set(id, [...(by_partner.get(id) ?? []), mode])
      })
    })
    if (by_partner.size === 0) { this._shared_layout_key = null; return false }
    // Une SIGNATURE de ce que montre le vivant : un geste à la souris ne fait pas de dessin complet
    // (l'époque de dessin ne bouge pas), mais il change la zone sérialisée.
    const key = live.id + '|' + JSON.stringify(this.host.dumpDrawingAreaToJSON(this.host.drawing_area))
    if (key === this._shared_layout_key) return false
    this._shared_layout_key = key
    let changed = false
    by_partner.forEach((modes, id) => {
      const o = this.paneById(id)
      if (o && this.shareInto(o, this.host.drawing_area, modes)) changed = true
    })
    return changed
  }

  /**
   * ALIGNE la mise en page du volet `to_id` sur celle de `from_id`, pour ces modes seulement : le
   * geste « relier ce volet à celui-ci » (cf. `Class_ApplicationData.linkMainZonePanes`).
   */
  public alignLayout(from_id: string, to_id: string, modes: string[]): void {
    const mc = this.host.menu_configuration
    const to = this.paneById(to_id)
    if (!mc || !to || !this.paneById(from_id) || modes.length === 0) return
    const live_id = mc.main_zone_live_sankey_id
    const source = from_id === live_id ? this.host.drawing_area : this.renderOf(from_id)?.drawing_area
    if (!source) return
    if (to_id === live_id) {
      updateFrom(this.host.drawing_area, source, [...modes, 'keepPositionType'])
      this.host.drawing_area.draw()
      return
    }
    if (this.shareInto(to, source, modes)) mc.notifyMainZone()
  }

  /**
   * Pose ces modes de `source` sur le RENDU du volet inactif `o` — et dans sa vue quand il en est le
   * volet enregistré à mise en page propre, puisque c'est elle que son activation relira. Rien pour
   * une vue lourde, qui porte ses propres données (et souvent d'autres éléments).
   */
  protected shareInto(o: Type_MainZoneOccupant, source: Class_DrawingArea, modes: string[]): boolean {
    const coordinate = this.coordinateOf(o)
    if (this.isHeavyView(coordinate)) return false
    const doc = this.renderOf(o.id)
    const render = this._renders.get(o.id)
    if (!doc || !render || render.mirror || doc.drawing_area === source) return false
    updateFrom(doc.drawing_area, source, [...modes, 'keepPositionType'])
    this.bumpVersion(o.id)
    const entry = this.host.views_dict[coordinate]
    if (entry?.own_layout && this.isRegisteredOn(o, coordinate)) {
      entry.json = compressJSONToGzip(this.host.dumpDrawingAreaToJSON(doc.drawing_area)) as Uint8Array
    }
    return true
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
    this._cameras.clear()
    this._known.clear()
    if (this._refresh_timer !== null) { clearTimeout(this._refresh_timer); this._refresh_timer = null }
  }

  public dispose(): void {
    this.reset()
    this.dropBase()
    this._unsubscribe_draw?.()
    this._unsubscribe_draw = null
  }
}
