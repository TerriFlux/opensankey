// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// Mode « ECHELLE ADAPTEE » (#1231, lot #243 c5) — au lieu de bouger les noeuds pour absorber un
// changement de datatag, on ajuste l'ECHELLE (valeur -> px) pour que le DIAGRAMME garde la meme
// hauteur rendue. Les positions des noeuds ne sont pas touchees ; seul l'affichage est recale
// (anti-chevauchement par colonne), jamais persiste.
//
// #384 — La reference n'est plus un ELEMENT designe (flux / noeud-stock) mais la GRANDEUR DU
// DIAGRAMME ENTIER (cf. `diagramMagnitude`). Un element unique cassait dans deux cas d'usage :
// absent (ou nul) a certains datatags, l'echelle n'etait pas adaptee du tout, silencieusement ;
// et on ne pouvait pas s'adapter sur plusieurs flux a la fois. L'element de reference garde son
// role pour le mode PROPORTIONNEL et pour le plafond d'epaisseur par view tag ; ce mode-ci n'a
// plus AUCUN etat commun avec lui (le socle NodePositioningReference n'est plus lu ici).
//
// Sous-service compose : `drawingArea` est expose en getter pour que les corps de methodes
// soient deplaces VERBATIM depuis NodePositioning.

import type { Class_DrawingArea } from '../types/DrawingArea'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { NodePositioning } from './NodePositioning'

export class NodePositioningScaleAdapted {
  constructor(private readonly np: NodePositioning) { }

  private get drawingArea(): Class_DrawingArea { return this.np.drawingArea }

  // #1231/#384 — Mode « échelle adaptée » : au lieu de bouger les nœuds, on ajuste l'échelle
  // (valeur→px) pour que le diagramme garde TOUJOURS la même hauteur. Comme la hauteur
  // ∝ grandeur / échelle, on garde `échelle / grandeur` constant : à chaque datatag,
  // échelle = échelle_ref × (grandeur_courante / grandeur_ref). On capture l'échelle et la
  // grandeur à l'entrée du mode. Transitoires.
  private _scale_adapted_ref_magnitude: number | undefined = undefined

  private _scale_adapted_ref_scale: number | undefined = undefined

  /**
   * #384 — Grandeur du diagramme au datatag/viewtag courant : la SOMME DE LA COLONNE LA PLUS
   * HAUTE, exprimée EN VALEURS et non en pixels (aucune circularité avec l'échelle qu'elle sert
   * à fixer). C'est bien elle qui détermine la hauteur rendue du diagramme : la hauteur d'un
   * nœud vaut sa valeur ÷ échelle, et la hauteur totale est celle de la colonne la plus chargée.
   *
   * Mêmes conventions de colonne que `resolveScaleAdaptedOverlaps` : groupage par `position_u`,
   * exclusion des nœuds `echange` (import/export, placés au niveau de leur flux — ils gonfleraient
   * artificiellement une colonne), des nœuds relatifs et des cadres tied. Seuls les éléments
   * VISIBLES comptent : le cas du mode vue se règle ainsi sans code séparé.
   *
   * 0 si le diagramme n'a aucune valeur (garde-fou de `applyAdaptedScale`).
   */
  public diagramMagnitude(): number {
    return this._columnsMagnitude(undefined)
  }

  /**
   * os#1372 — La même grandeur, mais lue à un jeu de datatags EXPLICITE : c'est elle qui sert de
   * référence quand le document désigne un datatag de référence.
   *
   * La VISIBILITÉ reste celle de la sélection courante — seules les VALEURS changent. C'est
   * voulu : le mode compare une même vue d'un datatag à l'autre, donc la référence doit être la
   * grandeur de CETTE vue au datatag de référence. C'est aussi ce qui règle le défaut qui avait
   * motivé sa#384 : plus besoin qu'un élément désigné soit visible dans la vue.
   *
   * Limites héritées de `Link.valueForDataTags` (mêmes que le mode proportionnel) : un flux
   * d'expansion, dont la valeur est calculée depuis la sélection courante, et les valeurs
   * coordonnées d'un groupe porteur ne sont pas relues au datatag demandé.
   */
  public diagramMagnitudeForDataTags(tags: Class_DataTag[]): number {
    return this._columnsMagnitude(tags)
  }

  /**
   * os#1383 — Valeur-équivalente du nœud VISIBLE le plus haut, tous nœuds confondus (le plafond
   * de hauteur s'applique à chacun, sans les exclusions de colonne de `diagramMagnitude`).
   *
   * Sert au plafond EXACT du mode « échelle adaptée » sans élément de référence : l'échelle qui
   * amène ce nœud à `maximum_node` px vaut `grandeur × 100 / maximum_node`. Calculée EN VALEURS
   * et non depuis la hauteur rendue, parce que celle-ci est plancher-ée (hauteur minimale de
   * nœud, `minimum_flux`) : à grande échelle, un nœud de 3 px rend 40, et un facteur pris sur
   * 40 ne l'amènerait jamais au plafond.
   *
   * 0 si aucun nœud visible ne porte de valeur. `tags` : lire les valeurs à un jeu de datatags
   * EXPLICITE (la visibilité reste celle de la sélection courante, cf. `diagramMagnitudeForDataTags`).
   */
  public tallestNodeMagnitude(tags?: Class_DataTag[]): number {
    let max = 0
    this.drawingArea.sankey.visible_nodes_list.forEach(n => {
      if (!n.is_visible) return
      const v = this.nodeMagnitude(n, tags)
      if (v > max) max = v
    })
    return max
  }

  /**
   * os#1383 — Mode « adaptée au maximum » (la « grille » de Julien) : la plus grande valeur-
   * équivalente du nœud le plus haut, TOUTES VALEURS DE LA DIMENSION CONFONDUES — pour la vue
   * courante, en gardant la sélection courante des autres dimensions.
   *
   * L'idée : une échelle par VUE, valable pour toute la dimension. Adapté entre vues (chaque
   * essence remplit le cadre avec sa région la plus grosse), absolu entre valeurs de la dimension
   * (Corse est vraiment plus petite qu'Auvergne-Rhône-Alpes). Calé sur le nœud le plus haut et
   * non sur le stock : pour le peuplier, dont les flux d'import dominent le stock, c'est Récolte
   * qui définit le cadre — l'image dit vrai, rien n'est écrasé, et la bride de 200 px par vue
   * qui compensait ça n'a plus d'objet. Sans état : recalculé à chaque dessin.
   *
   * 0 si la dimension n'a aucun tag ou qu'aucun nœud visible ne porte de valeur.
   */
  public maxDimensionMagnitude(group: Class_DataTagGroup): number {
    let max = 0
    group.tags_list.forEach(candidate => {
      const tags: Class_DataTag[] = []
      this.drawingArea.sankey.data_taggs_list.forEach(tagg => {
        const kept = tagg === group ? candidate : tagg.selected_tags_list[0]
        if (kept) tags.push(kept as Class_DataTag)
      })
      const v = this.tallestNodeMagnitude(tags)
      if (v > max) max = v
    })
    return max
  }

  /** Corps commun : somme par colonne (`position_u`), maximum des colonnes. */
  private _columnsMagnitude(tags: Class_DataTag[] | undefined): number {
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    const columns = new Map<number, number>()
    this.drawingArea.sankey.visible_nodes_list.forEach(n => {
      if (!n.is_visible) return
      if (echangeTag && n.hasGivenTag(echangeTag)) return
      if (n.shape_position_type === 'relative') return
      if (n.tied_to_nodes && n.attached_node.length > 0) return
      const v = this.nodeMagnitude(n, tags)
      if (!(v > 0)) return
      columns.set(n.position_u, (columns.get(n.position_u) ?? 0) + v)
    })
    let max = 0
    columns.forEach(sum => { if (sum > max) max = sum })
    return max
  }

  /**
   * os#1372 — Grandeur du diagramme AU DATATAG DE RÉFÉRENCE désigné par le document, ou
   * `undefined` s'il n'y en a pas (ou s'il ne désigne plus rien de connu).
   *
   * CALCULÉE, jamais stockée : c'est tout l'objet du réglage. La grandeur capturée au vol
   * (`scale_adapted_ref_magnitude`) figeait un nombre pris au dataTag qui se trouvait à l'écran
   * quand le mode a pris, que rien ne nommait et que la moindre correction de données rendait
   * faux. Ici la référence est ÉNONCÉE (des tags), et la grandeur s'en déduit à chaque dessin.
   */
  public referenceDataTagMagnitude(): number | undefined {
    // os#1383 — Régime `element` : la grandeur de référence est la VALEUR DE L'ÉLÉMENT au
    // datatag de référence (`prop_reference_datatag`), recalculée à chaque dessin. La grandeur
    // de diagramme n'est pas commensurable avec la grandeur courante de ce régime (valeur de
    // l'élément) : la mélanger au ratio gonflait Corse ×8 dès qu'un datatag était désigné.
    if (this.drawingArea.scale_adapted_reference === 'element') {
      if (this.np.reference.resolveReferenceDataTags().length === 0) return undefined
      const v = this.np.reference.referenceFluxRefValue()
      return v !== undefined && v > 0 ? v : undefined
    }
    const tags = this.referenceDataTags()
    if (tags === undefined) return undefined
    const m = this.diagramMagnitudeForDataTags(tags)
    return m > 0 ? m : undefined
  }

  /**
   * Tags du datatag de référence, résolus depuis les ids persistés. `undefined` si aucun n'est
   * désigné — un id inconnu (dimension supprimée depuis) est simplement ignoré, la référence
   * restant valable sur les dimensions qui subsistent.
   */
  private referenceDataTags(): Class_DataTag[] | undefined {
    // os#1383 — UN SEUL datatag de référence pour le document : à défaut d'une désignation
    // propre au mode adapté (os#1372), celle du couple élément/datatag (`prop_reference_datatag`,
    // que l'interface pose désormais) fait foi.
    let ids = this.drawingArea.scale_adapted_reference_datatag
    if (!ids || ids.length === 0) ids = this.np.reference.proportionalReferenceDatatagIds ?? []
    if (ids.length === 0) return undefined
    const tags: Class_DataTag[] = []
    this.drawingArea.sankey.data_taggs_list.forEach(tagg => {
      const found = tagg.tags_list.find(t => ids.includes(t.id))
      // Dimension non nommée par la référence : on garde sa sélection courante, comme le fait
      // `Link.valueForTag`. La référence peut donc ne porter que sur UNE dimension.
      const kept = found ?? tagg.selected_tags_list[0]
      if (kept) tags.push(kept as Class_DataTag)
    })
    return tags.length > 0 ? tags : undefined
  }

  /**
   * #384 — Valeur-équivalente de la hauteur d'un nœud : `max(Σ entrées, Σ sorties)`, augmentée
   * de la valeur de stock quand le nœud est dimensionné par son stock (miroir en valeurs de
   * `Node._getNaturalShapeHeight`, dont la hauteur-stock est divisée par
   * `stock_height_scale_factor`). Les planchers/plafonds en pixels (`minimum_flux`,
   * `maximum_node`) sont volontairement ignorés : ils ne suivent pas l'échelle, et les faire
   * entrer ici rendrait la grandeur dépendante de l'échelle courante.
   */
  private nodeMagnitude(n: Class_NodeElement, tags?: Class_DataTag[]): number {
    let sum_in = 0
    let sum_out = 0
    n.visible_input_links_list.forEach(l => { sum_in += this.linkMagnitude(l, tags) })
    n.visible_output_links_list.forEach(l => { sum_out += this.linkMagnitude(l, tags) })
    let magnitude = Math.max(sum_in, sum_out)
    if (n.use_stock_for_height) {
      const si = tags ? n.stockInitialForDataTags(tags) : n.currentStockInitialForHeight()
      if (si !== null && isFinite(si)) {
        const factor = n.stock_height_scale_factor > 0 ? n.stock_height_scale_factor : 1
        magnitude = Math.max(magnitude, Math.abs(si) / factor)
      }
    }
    return magnitude
  }

  /**
   * #384 — Valeur-équivalente de l'épaisseur d'un flux. `shape_local_link_scale` divise
   * l'échelle du flux (cf. `Link.scaleValueToPx`) : un flux à l'échelle locale f rend f fois
   * plus fin, sa contribution à la hauteur de la colonne est donc valeur/f. Les flux portés par
   * un tag d'unité ont leur propre échelle, indépendante de celle du diagramme : ils comptent
   * ici pour leur valeur brute (limite assumée, cf. #382).
   */
  private linkMagnitude(l: Class_LinkElement, tags?: Class_DataTag[]): number {
    const v = tags ? l.valueForDataTags(tags) : l.valueCurrent
    if (v === null || v === undefined || !isFinite(v)) return 0
    const factor = l.shape_local_link_scale || 1
    return Math.abs(v) / factor
  }

  /**
   * #1231/#384 — Mode « échelle adaptée » : capture l'échelle courante et la grandeur du
   * diagramme. Sert de base au ratio appliqué ensuite (`applyAdaptedScale`). À l'entrée du
   * mode, grandeur_courante == grandeur_ref → échelle inchangée → pas de saut.
   *
   * #384 — Appelée aussi à chaque frame tant que le mode est ARMÉ mais pas appliqué (cf.
   * `DrawingArea.drawElements`) : la frame affichée est alors la référence. D'où le no-op sur
   * grandeur nulle — un datatag sans aucune valeur ne doit pas EFFACER une référence déjà
   * posée, sans quoi la capture repartirait de zéro au datatag suivant (pas de retard).
   * L'oubli explicite de la capture, lui, est le rôle de `clearScaleAdaptation`.
   */
  public captureScaleReference() {
    // os#1372 — Datatag de référence désigné : la grandeur est CALCULÉE, on ne capture donc que
    // l'échelle de base, et une seule fois (sans quoi chaque frame la ramènerait à l'échelle
    // déjà adaptée et le ratio se composerait avec lui-même).
    // os#1383 — La base capturée est l'échelle de BASE (`base_scale`), jamais l'échelle
    // effective d'une frame : celle-ci porte déjà les plafonds, et la prendre pour base
    // composait le ratio avec eux à la frame suivante.
    // Datatag désigné : rien à capturer, l'échelle adaptée est sans état (cf. applyAdaptedScale).
    if (this.referenceDataTagMagnitude() !== undefined) return
    const m = this.referenceMagnitudeForCapture()
    if (m === undefined || !(m > 0)) return
    this._scale_adapted_ref_magnitude = m
    this._scale_adapted_ref_scale = this.drawingArea.base_scale
  }

  /**
   * os#1352 — GRANDEUR DE RÉFÉRENCE du régime courant, au moment de la CAPTURE.
   *
   * Régime `diagram` (défaut, sa#384) : grandeur du diagramme au datatag/viewtag courant.
   * Régime `element` : valeur de l'élément de référence AU DATATAG DE RÉFÉRENCE — et non sa
   * valeur courante. C'est la convention d'avant sa#384 (`referenceFluxRefValue`), qui fait du
   * couple (élément, datatag de référence) le gabarit de taille ; s'en écarter changerait le
   * comportement des fichiers qu'on cherche justement à réhabiliter.
   *
   * `undefined` = pas de référence exploitable (aucun élément désigné, ou valeur nulle).
   */
  private referenceMagnitudeForCapture(): number | undefined {
    if (this.drawingArea.scale_adapted_reference !== 'element') {
      const m = this.diagramMagnitude()
      return m > 0 ? m : undefined
    }
    // Élément BRUT : la valeur de référence doit rester capturable même si un filtre vue masque
    // momentanément l'élément (cf. referenceFluxRefValue).
    const ref = this.np.reference.rawReference
    if (!ref) return undefined
    const v = this.np.reference.referenceFluxRefValue()
    return v !== undefined && v > 0 ? v : undefined
  }

  /**
   * os#1352 — GRANDEUR COURANTE du régime courant, celle dont le ratio à la grandeur de référence
   * donne l'échelle.
   *
   * Régime `element` : en mode VUE, la valeur du CORRESPONDANT de la vue (l'enfant visible portant
   * l'étiquette sélectionnée, `referenceViewValue`) — c'est ce qui normalise une vue d'essence sur
   * une autre ; hors mode vue, la valeur courante de l'élément (`referenceCurrentValue`). Reprend
   * verbatim la dissymétrie d'avant sa#384, seule à traiter correctement un élément de référence
   * masqué par le filtre de vue (cas de CARTOFOB, dont le stock « Bois sur pied » est invisible
   * dans chaque vue d'essence).
   *
   * `undefined` = grandeur inexploitable → l'appelant SIGNALE au lieu de figer l'échelle en
   * silence, ce qui était le défaut ayant motivé le retrait du régime en sa#384.
   */
  private currentMagnitude(): number | undefined {
    if (this.drawingArea.scale_adapted_reference !== 'element') {
      const m = this.diagramMagnitude()
      return m > 0 ? m : undefined
    }
    const view_active = this.drawingArea.sankey.view_mode_active
    const ref = view_active ? this.np.reference.rawReference : this.np.reference.gatedReference
    if (!ref) return undefined
    const v = view_active
      ? this.np.reference.referenceViewValue()
      : this.np.reference.referenceCurrentValue()
    return v > 0 ? v : undefined
  }

  // os#1352 — Dernier diagnostic du régime `element`, EXPOSÉ (pas seulement journalisé) pour que
  // l'interface, une page publiée ou un test puissent constater que l'échelle n'a pas pu être
  // adaptée. `undefined` = tout va bien au dernier dessin.
  private _scale_adapted_warning: string | undefined = undefined

  public get scaleAdaptedWarning(): string | undefined { return this._scale_adapted_warning }

  // Empreinte de la dernière sélection signalée : le dessin repasse ici à chaque frame, on ne
  // journalise donc qu'au CHANGEMENT de sélection (sinon la console se remplit en boucle).
  private _warned_selection: string | undefined = undefined

  /**
   * os#1352 — Signale que le régime `element` n'a pas de grandeur exploitable au datatag/viewtag
   * courant. Le défaut reproché à l'ancien régime n'était pas de ne rien faire, c'était de ne rien
   * faire SANS LE DIRE : l'échelle restait celle de la sélection précédente et l'affichage
   * devenait inexploitable sans explication. On journalise une fois par sélection et on expose
   * l'état ; l'échelle précédente est conservée (rien de mieux à faire, mais ce n'est plus muet).
   */
  private warnElementReferenceUnusable() {
    const ref = this.np.reference.rawReference
    const reason = ref
      ? 'sa valeur est nulle ou absente pour la sélection courante'
      : 'aucun élément de référence n\'est désigné dans ce document'
    const msg = '[échelle adaptée] régime « élément » : échelle NON adaptée — ' + reason
      + '. L\'échelle de la sélection précédente est conservée.'
    this._scale_adapted_warning = msg
    const selection = this.drawingArea.sankey.selected_data_tags_list.map(t => t.id).join('|')
      + '#' + this.drawingArea.sankey.view_taggs_list
        .map(g => g.selected_tags_list.map(t => t.id).join(',')).join('|')
    if (this._warned_selection === selection) return
    this._warned_selection = selection
    console.warn(msg)
  }

  /**
   * os#1352 — Oublie la capture SANS toucher à l'échelle courante (à la différence de
   * `clearScaleAdaptation`, qui restaure l'échelle de base parce qu'on QUITTE le mode). Sert au
   * changement de RÉGIME : les grandeurs des deux régimes ne sont pas commensurables, la capture
   * de l'un ne peut pas servir de base à l'autre. La capture paresseuse repart au dessin suivant.
   */
  public forgetScaleAdaptedCapture() {
    this._scale_adapted_ref_magnitude = undefined
    this._scale_adapted_ref_scale = undefined
    this._scale_adapted_warning = undefined
    this._warned_selection = undefined
  }

  /**
   * #369 — Couple capturé du mode « échelle adaptée » (échelle de BASE + grandeur du diagramme),
   * exposé pour la PERSISTANCE. Le mode étant désormais restitué à l'ouverture (cf.
   * `positionModeOnLoad`), ce couple doit l'être aussi : la grandeur capturée d'un document à
   * élément de référence n'est pas recalculable à l'ouverture. os#1383 — `user_scale`, lui,
   * est désormais toujours l'échelle de BASE de l'utilisateur (l'adaptation n'écrit plus que
   * l'échelle effective de la frame). undefined tant que rien n'a été capturé (rien à écrire).
   */
  public get scaleAdaptedReference(): { scale: number, magnitude: number } | undefined {
    if (this._scale_adapted_ref_scale === undefined) return undefined
    if (this._scale_adapted_ref_magnitude === undefined) return undefined
    return { scale: this._scale_adapted_ref_scale, magnitude: this._scale_adapted_ref_magnitude }
  }

  /**
   * #369 — Restaure le couple capturé lu dans le fichier (cf. `scaleAdaptedReference`). Valeurs
   * aberrantes ignorées : la capture paresseuse de `applyAdaptedScale` reprend alors la main
   * (comportement d'un fichier antérieur, qui ne porte pas ces clés).
   */
  public restoreScaleReference(scale: number, magnitude: number) {
    if (!isFinite(scale) || scale <= 0) return
    if (!isFinite(magnitude) || magnitude <= 0) return
    this._scale_adapted_ref_scale = scale
    this._scale_adapted_ref_magnitude = magnitude
  }

  /**
   * #1231/#384 — Mode « échelle adaptée » : ajuste l'échelle (valeur→px) du diagramme pour qu'il
   * garde sa hauteur de référence à tous les datatags. Appelé en tête de `drawElements` avant
   * `_sankey.draw()`. Écrit l'échelle EFFECTIVE de la frame (`setEffectiveScale`, os#1383) —
   * jamais `_scale`, l'échelle absolue de l'utilisateur, ni via le setter `scale` (redraw →
   * récursion).
   *
   * Retourne vrai si une échelle a été adaptée, faux si le document ne fournit aucune grandeur
   * de référence exploitable (CARTOFOB : régime `element` sans élément désigné). Dans ce cas
   * `drawElements` rend le plafond de hauteur EXACT : c'est lui qui adapte.
   */
  public applyAdaptedScale(): boolean {
    // os#1383 — Variante « adaptée au maximum » portée par une dimension (cf.
    // `maxDimensionMagnitude`) : une échelle par vue, celle qui amène le nœud le plus haut de la
    // plus grande valeur de la dimension à `maximum_node`. Sans état, sans référence à désigner.
    // Exige un plafond de hauteur : sans lui, « remplir » n'a pas de définition — on retombe
    // alors sur l'échelle adaptée ordinaire.
    const max_group = this.drawingArea.sankey.data_taggs_list
      .find(g => g.position_mode === 'scale_adapted_max')
    const max_node = this.drawingArea.maximum_node
    if (max_group && max_node && max_node > 0) {
      const magnitude = this.maxDimensionMagnitude(max_group)
      if (magnitude > 0) {
        this._scale_adapted_warning = undefined
        this.drawingArea.setEffectiveScale(magnitude * 100 / max_node)
        return true
      }
    }
    // os#1372 — Grandeur de référence : celle du datatag DÉSIGNÉ si le document en nomme un
    // (calculée à chaque dessin), sinon celle capturée au vol (fichiers antérieurs).
    const designated = this.referenceDataTagMagnitude()
    // Capture paresseuse (1er dessin / après chargement) : base = échelle + grandeur courantes
    // → ratio 1 à cette frame, pas de saut. os#1383 — Avec un datatag désigné, RIEN n'est
    // capturé : la base est l'échelle de base de l'utilisateur et la grandeur de référence se
    // recalcule à chaque dessin. L'échelle adaptée ne dépend alors d'aucun état, donc d'aucun
    // chemin — et le ratio vaut 1 uniquement SUR le datatag de référence, ce qui est le propre
    // d'une référence énoncée.
    if (designated === undefined
      && (this._scale_adapted_ref_magnitude === undefined || this._scale_adapted_ref_scale === undefined)) {
      this.captureScaleReference()
      // os#1352 — régime `element` : si la capture n'a rien pu prendre, c'est que l'élément de
      // référence manque. Le dire tout de suite plutôt qu'au dessin suivant.
      if (this._scale_adapted_ref_magnitude === undefined
        && this.drawingArea.scale_adapted_reference === 'element') {
        this.warnElementReferenceUnusable()
      }
      // Capture faite (ratio 1 à cette frame) ou impossible : rien d'adapté cette frame.
      return false
    }
    // Grandeur au datatag/viewtag courant, selon le régime. Inexploitable (datatag sans aucune
    // valeur, ou élément de référence absent/nul) : rien d'adapté — mais, en régime `element`,
    // on le SIGNALE (os#1352).
    const m = this.currentMagnitude()
    if (m === undefined || !(m > 0)) {
      if (this.drawingArea.scale_adapted_reference === 'element') this.warnElementReferenceUnusable()
      return false
    }
    this._scale_adapted_warning = undefined
    this._warned_selection = undefined
    const ref_magnitude = designated ?? (this._scale_adapted_ref_magnitude as number)
    // Datatag désigné : base = échelle de base de l'utilisateur (sans état) ; sinon la base
    // capturée avec la grandeur (fichiers antérieurs, régime sans référence énoncée).
    const base = designated !== undefined
      ? this.drawingArea.base_scale
      : (this._scale_adapted_ref_scale as number)
    const new_scale = base * m / ref_magnitude
    if (!(isFinite(new_scale) && new_scale > 0)) return false
    this.drawingArea.setEffectiveScale(new_scale)
    return true
  }

  /**
   * #1231 — Sortie du mode « échelle adaptée » : oublie la capture. os#1383 — plus rien à
   * restaurer : l'adaptation n'écrivait que l'échelle effective de la frame, l'échelle de base
   * de l'utilisateur est intacte et la prochaine frame repart d'elle.
   */
  public clearScaleAdaptation() {
    this._scale_adapted_ref_magnitude = undefined
    this._scale_adapted_ref_scale = undefined
  }

  /**
   * #1231 — Mode « échelle adaptée » : dérive le coin de chaque nœud « libre » depuis son CENTRE
   * stocké, SANS jamais recommiter le coin dans le centre. Remplace `anchorAbsoluteNodesByCenter`
   * dans la branche scale_adapted de `drawElements` : on garde la même dérivation centre→coin,
   * mais on supprime la branche « taille inchangée → captureCenterFromCorner » qui figerait le
   * recalage d'affichage (anti-chevauchement / clamp, cf. `resolveScaleAdaptedOverlaps`) dans le
   * centre persisté → ce recalage se traînerait alors d'un viewtag/datatag à l'autre.
   *
   * Le centre reste la SEULE vérité : il n'est modifié que par les gestes utilisateur (drag,
   * resize → `settleCenterAnchor`) et les opérations structurelles, jamais par le dessin. À chaque
   * frame on repart donc du centre propre, et le recalage d'espacement est recalculé pour le
   * datatag/viewtag courant (transitoire, jamais persistant).
   *
   * Mêmes exclusions que `anchorAbsoluteNodesByCenter` : nœuds visibles, libres (non relatifs),
   * hors cadres tied. Lazy-init du centre au 1er dessin (fichier sans centre encore posé).
   */
  public deriveScaleAdaptedCornersFromCenter() {
    this.drawingArea.sankey.nodes_list.forEach(n => {
      if (!n.is_visible) return
      if (n.shape_position_type === 'relative') return
      if (n.tied_to_nodes && n.attached_node.length > 0) return
      if (n.center_x === undefined || n.center_y === undefined) {
        n.captureCenterFromCorner() // init unique ; le coin est déjà cohérent
      } else {
        n.forceDeriveFromCenter() // coin = centre − taille/2, sans recommit du centre
      }
    })
  }

  /**
   * #1231 — Mode « échelle adaptée » : décale un nœud verticalement de `dy` POUR L'AFFICHAGE
   * seulement (coin `position_y`), SANS toucher au centre stocké. Le recalage d'espacement est
   * propre au datatag/viewtag courant : il est recalculé à chaque dessin à partir du centre
   * (cf. `deriveScaleAdaptedCornersFromCenter`) et ne doit donc jamais être persisté, sinon il se
   * traînerait d'un datatag/viewtag à l'autre. No-op si `dy` nul.
   */
  private shiftNodeY(n: Class_NodeElement, dy: number) {
    if (!dy) return
    n.position_y += dy
  }

  /**
   * #1231 — Mode « échelle adaptée » : anti-chevauchement par colonne (DEPUIS LE HAUT) + clamp
   * du haut du diagramme. Appelé après `deriveScaleAdaptedCornersFromCenter` dans la branche
   * scale_adapted de `drawElements`.
   *
   * En mode échelle, les nœuds grossissent autour de leur centre FIXE quand l'échelle monte
   * (bascule datatag/viewtag). Deux effets indésirables :
   *  - deux nœuds d'une même colonne peuvent se recouvrir ;
   *  - le nœud du haut, dont le coin = centre − hauteur/2, peut passer AU-DESSUS du haut du
   *    diagramme (y < 0).
   *
   * On ne re-layoute PAS le diagramme :
   *  1. anti-chevauchement : le nœud le plus haut de chaque colonne garde sa place, chaque nœud
   *     suivant est descendu juste assez pour rétablir l'écart minimal (push vers le bas only) ;
   *  2. clamp du haut : si le sommet de la colonne dépasse y=0, on décale TOUTE la colonne vers
   *     le bas pour que son sommet tienne pile au haut du diagramme.
   * Ces décalages sont D'AFFICHAGE (coin seulement, cf. `shiftNodeY`) : recalculés à chaque
   * dessin depuis le centre, donc propres au datatag/viewtag courant et jamais persistés.
   *
   * Mêmes conventions de colonne que `backCalculateShapePositionDyFromY` : groupage par
   * `position_u`, exclusion des nœuds `echange` (import/export, placés au niveau de leur flux),
   * des nœuds relatifs et des cadres tied. `écart_min` = `shape_position_dy` GLOBAL.
   */
  public resolveScaleAdaptedOverlaps() {
    const min_gap = this.drawingArea.sankey.styles_dict['default'].shape_position_dy ?? 50
    const echangeTag = this.drawingArea.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    const columns = new Map<number, Class_NodeElement[]>()
    this.drawingArea.sankey.visible_nodes_list.forEach(n => {
      if (!n.is_visible) return
      if (echangeTag && n.hasGivenTag(echangeTag)) return
      if (n.shape_position_type === 'relative') return
      if (n.tied_to_nodes && n.attached_node.length > 0) return
      const arr = columns.get(n.position_u) ?? []
      arr.push(n)
      columns.set(n.position_u, arr)
    })
    columns.forEach(col => {
      // Ordre vertical = ordre LOGIQUE de la colonne (`position_v`), PAS la géométrie courante :
      // en échelle adaptée, position_y est dérivée du centre et peut différer d'un pouième entre
      // deux nœuds quasi alignés → un tri par position_y inverserait leur ordre (ex. v=1 au-dessus
      // de v=0) et le push figerait l'inversion. position_v est l'ordre stable (calculé au load,
      // u/v verrouillés). position_y en départage seulement les v égaux (ne devrait pas arriver).
      col.sort((a, b) => (a.position_v - b.position_v) || (a.position_y - b.position_y))
      // 1. anti-chevauchement, depuis le haut : descendre les nœuds qui se recouvrent.
      for (let i = 1; i < col.length; i++) {
        const prev = col[i - 1]
        const curr = col[i]
        const min_top = prev.position_y + prev.getShapeHeightToUse() + min_gap
        if (curr.position_y < min_top) this.shiftNodeY(curr, min_top - curr.position_y)
      }
      // 2. clamp du haut : le sommet de la colonne (nœud le plus haut, jamais descendu) ne doit
      //    pas dépasser y=0. Sinon on décale toute la colonne vers le bas (affichage seulement).
      const top = col[0].position_y
      if (top < 0) col.forEach(n => this.shiftNodeY(n, -top))
    })
  }
}
