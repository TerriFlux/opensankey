// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// SOCLE « element de reference » (#243 c5) — partage par les DEUX modes de positionnement :
//   - mode PROPORTIONNEL (`anchorProportionalNodes`) : la mediane suit le centre de l'element,
//     et le facteur f suit sa valeur ;
//   - mode ECHELLE ADAPTEE (`applyAdaptedScale`) : l'echelle suit la valeur de l'element, pour
//     que sa taille rendue reste constante.
// Les deux lisent `rawReference` / `gatedReference` : le prefixe historique `_prop_reference_*`
// est TROMPEUR, cet etat n'appartient pas au mode proportionnel. L'extraire une seule fois est
// le prealable a la separation des deux modes (lots c5 / c6).
//
// L'element de reference est un FLUX ou un NOEUD-STOCK (#1231b), mutuellement exclusifs. Le
// couple (element, datatag de reference) est PERSISTE via les marqueurs `shape_is_reference_flux`
// / `shape_is_reference_stock` et `proportionalReferenceDatatagIds` ; le MODE, lui, ne l'est pas.
//
// Sous-service compose detenu par NodePositioning : le champ s'appelle `drawingArea` pour que les
// corps de methodes soient deplaces VERBATIM. NodePositioning conserve des delegateurs (l'API
// publique est consommee par la persistance, les menus contextuels et DrawingArea).

import type { Class_DrawingArea } from '../types/DrawingArea'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_DataTag } from '../types/Tag'

export class NodePositioningReference {
  public readonly drawingArea: Class_DrawingArea

  constructor(drawingArea: Class_DrawingArea) {
    this.drawingArea = drawingArea
  }

  // #1231 — Flux de référence (sélectionné au clic droit) du mode proportionnel. Si défini
  // et visible :
  //  - la médiane (centre de gravité, FIXE) = centre vertical du flux à mi-parcours,
  //  - le facteur f = épaisseur courante du flux / épaisseur capturée (`_prop_ref_flux_thickness`).
  // Sinon : fallback sur l'ancien calcul (moyenne des centres de colonnes / max ratio de sommes).
  // Transitoires (jamais persistés).
  private _prop_reference_link: Class_LinkElement | undefined = undefined

  // #1231b — Élément de référence GÉNÉRALISÉ : un nœud (dans sa représentation stock) peut
  // jouer le même rôle que le flux de référence. Mutuellement exclusif avec
  // `_prop_reference_link` (un seul élément de référence à la fois). Si défini et visible :
  //  - la médiane (centre de gravité) = centre vertical du nœud,
  //  - le facteur f = stock courant / stock au datatag de référence.
  // La valeur du stock = stock initial (cf. Node.currentStockInitialForHeight). Transitoire.
  private _prop_reference_node: Class_NodeElement | undefined = undefined

  // #1231 — Datatag de RÉFÉRENCE (ids des tags datatag sélectionnés au moment où le flux de
  // référence a été défini). Les pourcentages sont calculés pour le couple (flux, datatag) :
  // f = valeur(flux, datatag courant) / valeur(flux, datatag de réf). PERSISTÉ (avec le flux
  // de référence) ; le MODE proportionnel lui-même n'est pas persisté.
  private _prop_reference_datatag_ids: string[] | undefined = undefined

  /**
   * #1231 — Flux de référence du mode proportionnel (sélectionné au clic droit).
   * Invalidé automatiquement s'il n'est plus visible (désagrégation, suppression…).
   */
  public get proportionalReferenceLink(): Class_LinkElement | undefined {
    if (this._prop_reference_link && !this._prop_reference_link.is_visible) return undefined
    return this._prop_reference_link
  }

  /** #1231b — Nœud de référence (visibilité-gated), pour l'état coché du menu nœud. */
  public get proportionalReferenceNode(): Class_NodeElement | undefined {
    if (this._prop_reference_node && !this._prop_reference_node.is_visible) return undefined
    return this._prop_reference_node
  }

  /** #1231b — Nœud-stock de référence BRUT (sans filtre de visibilité). undefined si la
   * référence est un flux, ou s'il n'y en a aucune. */
  public get rawReferenceNode(): Class_NodeElement | undefined {
    return this._prop_reference_node
  }

  /** #1231b — Élément de référence BRUT (lien OU nœud), sans filtre de visibilité. */
  public get rawReference(): Class_LinkElement | Class_NodeElement | undefined {
    return this._prop_reference_link ?? this._prop_reference_node
  }

  /** #1231b — Élément de référence visibilité-gated (undefined si masqué). */
  public get gatedReference(): Class_LinkElement | Class_NodeElement | undefined {
    const ref = this.rawReference
    if (ref && !ref.is_visible) return undefined
    return ref
  }

  // #1231b — Nettoie les marqueurs persistés de référence (lien ET nœud) sur TOUS les
  // éléments, sauf `keep` (l'élément qu'on est en train de désigner). Le set n'a pas
  // d'action → pas de dessin parasite (cf. ElementsAttributesConfig).
  private clearReferenceMarkers(keep?: Class_LinkElement | Class_NodeElement) {
    this.drawingArea.sankey.links_list.forEach(l => {
      if (l.shape_is_reference_flux && l !== keep) l.shape_is_reference_flux = false
    })
    this.drawingArea.sankey.nodes_list.forEach(n => {
      if (n.shape_is_reference_stock && n !== keep) n.shape_is_reference_stock = false
    })
  }

  public setProportionalReferenceLink(link: Class_LinkElement | undefined) {
    // Un seul élément de référence à la fois : on retire tout marqueur (lien/nœud) existant.
    this.clearReferenceMarkers(link)
    this._prop_reference_link = link
    this._prop_reference_node = undefined
    if (link) {
      link.shape_is_reference_flux = true
      // Mémoriser le datatag courant comme datatag de référence (couple élément/datatag).
      this._prop_reference_datatag_ids = this.drawingArea.sankey.selected_data_tags_list.map(t => t.id)
    } else {
      this._prop_reference_datatag_ids = undefined
    }
  }

  /**
   * #1231b — Désigne (ou retire) un NŒUD-STOCK comme élément de référence. Mutuellement
   * exclusif avec le flux de référence. Le marqueur persisté `shape_is_reference_stock` est
   * posé sur le nœud (relu au chargement par `attachReferenceLinkFromAttributes`).
   */
  public setProportionalReferenceNode(node: Class_NodeElement | undefined) {
    this.clearReferenceMarkers(node)
    this._prop_reference_node = node
    this._prop_reference_link = undefined
    if (node) {
      node.shape_is_reference_stock = true
      this._prop_reference_datatag_ids = this.drawingArea.sankey.selected_data_tags_list.map(t => t.id)
    } else {
      this._prop_reference_datatag_ids = undefined
    }
  }

  /** #1231 — Datatag de référence (ids) — accesseurs pour la persistance (cf. DrawingArea toJSON/fromJSON). */
  public get proportionalReferenceDatatagIds(): string[] | undefined { return this._prop_reference_datatag_ids }

  public set proportionalReferenceDatatagIds(ids: string[] | undefined) {
    this._prop_reference_datatag_ids = (ids && ids.length > 0) ? ids : undefined
  }

  /** #1231 — Résout les ids du datatag de référence en objets Class_DataTag (via les groupes du sankey). */
  public resolveReferenceDataTags(): Class_DataTag[] {
    const ids = this._prop_reference_datatag_ids
    if (!ids || ids.length === 0) return []
    const out: Class_DataTag[] = []
    this.drawingArea.sankey.data_taggs_list.forEach(tagg => {
      ids.forEach(id => { const t = tagg.tags_dict[id]; if (t) out.push(t) })
    })
    return out
  }

  /**
   * #1231 — Valeur (absolue) du flux de référence AU DATATAG DE RÉFÉRENCE. Définit le
   * dénominateur du facteur f. Fallback sur la valeur courante si aucun datatag de réf
   * (rétrocompat). undefined si pas de flux de référence ou valeur indisponible.
   */
  public referenceFluxRefValue(): number | undefined {
    // Élément brut (pas le getter visibilité-gated) : en mode vue l'élément de référence peut
    // être caché par le filtre, mais sa valeur de référence (dénominateur de l'échelle) reste
    // définie. Pour le proportionnel ce chemin n'est emprunté que si visible → inchangé.
    const tags = this.resolveReferenceDataTags()
    // #1231b — Nœud-stock de référence : valeur = stock initial (cf. currentStockInitialForHeight).
    const node = this._prop_reference_node
    if (node) {
      // #1231b — On ancre l'échelle adaptée sur la hauteur RÉELLEMENT rendue du nœud
      // (max stock / bande de flux), pas sur la seule valeur de stock.
      if (tags.length > 0) {
        const v = node.stockInitialForDataTags(tags)
        if (v != null && isFinite(v)) return node.stockValueAugmentedByFluxBand(v)
      }
      const vc = node.currentStockInitialForHeight()
      return (vc != null && isFinite(vc)) ? node.stockValueAugmentedByFluxBand(vc) : undefined
    }
    const ref = this._prop_reference_link
    if (!ref) return undefined
    if (tags.length > 0) {
      const v = ref.valueForDataTags(tags)
      if (v != null && isFinite(v)) return Math.abs(v)
    }
    const vc = ref.valueCurrent
    return (vc != null && isFinite(vc)) ? Math.abs(vc) : undefined
  }

  /**
   * #1231b — Valeur COURANTE (datatags sélectionnés, hors vue) de l'élément de référence.
   * Flux : épaisseur via valeur courante. Nœud-stock : stock initial courant. abs ; 0 si rien.
   */
  public referenceCurrentValue(): number {
    const node = this._prop_reference_node
    if (node) {
      // #1231b — Ancrage sur la hauteur réelle (max stock / bande de flux).
      const v = node.currentStockInitialForHeight()
      return (v != null && isFinite(v)) ? node.stockValueAugmentedByFluxBand(v) : 0
    }
    const ref = this._prop_reference_link
    return ref ? Math.abs(ref.valueCurrent ?? 0) : 0
  }

  /**
   * #1231b — Valeur de l'élément de référence dans la VUE courante (correspondant visible).
   * Flux : somme des liens enfants visibles (referenceFluxViewValue). Nœud-stock : somme des
   * stocks des nœuds descendants visibles portant l'étiquette view tag sélectionnée.
   */
  public referenceViewValue(): number {
    const node = this._prop_reference_node
    if (node) return this.referenceStockViewValue(node)
    const ref = this._prop_reference_link
    return ref ? this.referenceFluxViewValue(ref) : 0
  }

  /**
   * #1231 — Au chargement (persistance) : ré-attache le flux de référence depuis le marqueur
   * persisté `shape_is_reference_flux`. La capture (médiane proportionnelle / échelle) se
   * fait paresseusement au 1er dessin (anchorProportionalNodes / applyAdaptedScale).
   */
  public attachReferenceLinkFromAttributes() {
    const flagged_link = this.drawingArea.sankey.links_list.find(l => l.shape_is_reference_flux)
    const flagged_node = this.drawingArea.sankey.nodes_list.find(n => n.shape_is_reference_stock)
    this._prop_reference_link = flagged_link ?? undefined
    // #1231b — Un seul élément de référence à la fois : si les deux marqueurs cohabitent
    // (fichier incohérent), le flux prime et on ignore le nœud.
    this._prop_reference_node = flagged_link ? undefined : (flagged_node ?? undefined)
  }

  /** #1231 — Centre vertical d'un flux à mi-parcours = moyenne des lignes centrales source/cible. */
  public fluxCenterY(link: Class_LinkElement): number {
    return (link.position_y_start + link.position_y_end) / 2
  }

  /** #1231 — Épaisseur représentative d'un flux = moyenne des épaisseurs source/cible (px). */
  public fluxThickness(link: Class_LinkElement): number {
    return (link.thicknessSource + link.thicknessTarget) / 2
  }

  /**
   * Mode vue — valeur du flux de référence dans la VUE courante : somme des liens visibles dont
   * la source descend de `ref.source`, la cible descend de `ref.target`, ET dont les DEUX
   * extrémités portent l'étiquette view tag sélectionnée (viewTagVisibility === true). Ce dernier
   * filtre est indispensable car la hiérarchie a plusieurs dimensions (essences ET propriétés) :
   * sans lui on cumulerait les liens croisés (ex. essence chêne → propriété domaniale).
   */
  public referenceFluxViewValue(ref: Class_LinkElement): number {
    const src = ref.source as Class_NodeElement
    const tgt = ref.target as Class_NodeElement
    const src_set = new Set<Class_NodeElement>([src, ...src.getListDescendantOfNode()])
    const tgt_set = new Set<Class_NodeElement>([tgt, ...tgt.getListDescendantOfNode()])
    let sum = 0
    this.drawingArea.sankey.visible_links_list.forEach(l => {
      const ls = l.source as Class_NodeElement
      const lt = l.target as Class_NodeElement
      if (!src_set.has(ls) || !tgt_set.has(lt)) return
      if (ls.viewTagVisibility() !== true || lt.viewTagVisibility() !== true) return
      const v = l.valueCurrent
      if (v != null && isFinite(v)) sum += Math.abs(v)
    })
    return sum
  }

  /**
   * #1231b — Mode vue — valeur du nœud-stock de référence dans la VUE courante : somme des
   * stocks des nœuds visibles qui descendent du nœud de référence ET portent l'étiquette view
   * tag sélectionnée (viewTagVisibility === true). Analogue stock de referenceFluxViewValue.
   */
  public referenceStockViewValue(node: Class_NodeElement): number {
    const node_set = new Set<Class_NodeElement>([node, ...node.getListDescendantOfNode()])
    let sum = 0
    this.drawingArea.sankey.visible_nodes_list.forEach(n => {
      if (!node_set.has(n)) return
      if (!n.has_stock) return
      if (n.viewTagVisibility() !== true) return
      const v = n.currentStockInitialForHeight()
      if (v != null && isFinite(v)) sum += Math.abs(v)
    })
    // #1231b — Ancrage sur la hauteur réelle : si la bande de flux du nœud de
    // référence dépasse la hauteur-stock (cumul des correspondants visibles), on
    // ancre l'échelle sur cette bande.
    return node.stockValueAugmentedByFluxBand(sum)
  }
}
