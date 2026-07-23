// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// #242 — Domaine « cascade de style » extrait de Class_DrawingArea en fonctions libres : copie du
// style d'un élément vers un autre (pinceau de style), et propagation d'un parent à toute sa
// descendance dans la hiérarchie de dimensions (nœuds désagrégés, flux enfants) — plus l'assignation
// de colonne, qui suit la même mécanique de collecte + transition d'historique unique.
//
// Chaque fonction COLLECTE ses undo/redo puis les regroupe en UNE transition d'historique : c'est
// l'invariant du domaine (un geste utilisateur = un undo). Les fonctions n'accèdent qu'à l'API
// publique de la DA ; la classe garde des méthodes-délégatrices.

import type { Class_DrawingArea } from './DrawingArea'
import { Class_ProtoElement } from '../Elements/Element'
import { Class_NodeElement } from '../Elements/Node'
import { Class_LinkElement } from '../Elements/Link'
import { NodePositioning } from '../Algorithms/NodePositioning'

/**
 * Applique le style (styles custom + attributs) de `source` sur `target` et renvoie les fonctions
 * undo/redo correspondantes (SANS les enregistrer dans l'historique — c'est à l'appelant de les
 * regrouper). Renvoie null si les deux éléments ne sont pas de même nature (nœud→nœud, flux→flux).
 */
export function applyStyleFromSourceToTarget(
  source: Class_ProtoElement,
  target: Class_ProtoElement
): { undo: () => void, redo: () => void } | null {
  // Même type uniquement (nœud→nœud, flux→flux)
  if ((source instanceof Class_NodeElement) !== (target instanceof Class_NodeElement)) return null
  // Capturer l'état avant pour undo
  const old_storage = target.snapshotStorage()
  const old_custom_styles = target.getCustomStyles()
  // Capturer l'état source pour redo
  const new_custom_styles = source.style.slice(1)
  const new_storage = source.snapshotStorage()
  // Undo : restaurer l'ancien état
  const undo = () => {
    target.removeAllStyles()
    old_custom_styles.forEach(s => target.addStyle(s))
    target.restoreStorage(old_storage)
    target.draw()
  }
  // Redo : ré-appliquer le style source
  const redo = () => {
    target.removeAllStyles()
    new_custom_styles.forEach(s => target.addStyle(s))
    target.restoreStorage(new_storage)
    target.draw()
  }
  // Appliquer
  target.removeAllStyles()
  new_custom_styles.forEach(s => target.addStyle(s))
  target.copyAttrFrom(source)
  target.draw()
  return { undo, redo }
}

/** Regroupe les transitions collectées en UNE transition d'historique (no-op si rien à faire). */
function commitTransitions(
  da: Class_DrawingArea,
  undos: Array<() => void>,
  redos: Array<() => void>
): void {
  if (undos.length === 0) return
  da.application_data.history.saveUndo(() => undos.forEach(u => u()))
  da.application_data.history.saveRedo(() => redos.forEach(r => r()))
}

/**
 * Collecte les transitions de propagation du style du nœud `source` à toute sa descendance dans la
 * hiérarchie de dimensions. Partagé par la variante mono- et multi-source.
 */
function collectStyleToNodeChildren(
  source: Class_NodeElement,
  undos: Array<() => void>,
  redos: Array<() => void>
): void {
  // collectNodeDescendants inclut le nœud lui-même ; on l'exclut pour ne pas
  // « réappliquer » le style du parent sur lui-même.
  const descendants = [...NodePositioning.collectNodeDescendants(source)].filter(n => n !== source)
  descendants.forEach(target => {
    const transition = applyStyleFromSourceToTarget(source, target)
    if (transition) {
      undos.push(transition.undo)
      redos.push(transition.redo)
    }
  })
}

/**
 * Propage le style de CHAQUE nœud parent de `sources` à toute sa descendance dans la hiérarchie de
 * dimensions (désagrégation), même si les enfants sont actuellement agrégés/masqués. Le tout dans
 * une seule transition d'historique.
 */
export function applyStyleToNodesChildren(da: Class_DrawingArea, sources: Class_NodeElement[]): void {
  const undos: Array<() => void> = []
  const redos: Array<() => void> = []
  sources.forEach(source => collectStyleToNodeChildren(source, undos, redos))
  commitTransitions(da, undos, redos)
}

/**
 * Assigne la colonne du nœud parent à toute sa descendance dans la hiérarchie de dimensions
 * (désagrégation), même si les enfants sont actuellement agrégés/masqués. Tous les descendants sont
 * réassignés ET reverrouillés (y compris ceux déjà verrouillés), pour qu'ils suivent le parent même
 * après un déplacement de celui-ci.
 *
 * Pour chaque enfant on combine trois choses :
 * - `position_u` = colonne du parent (l'index de colonne) ;
 * - `shape_position_u_locked = true` : le verrou est le signal « édité, à garder ».
 *   C'est lui qui fait persister `position_u` (cf. NodeBasePersistence.toJSON, qui ne
 *   sérialise u/v qu'en mode parametric OU si verrouillé) et qui empêche autosankey /
 *   `inferPositionUFromX` de recalculer la colonne depuis x au chargement ;
 * - le CENTRE stocké (`setStoredCenter`) aligné sur le coin du parent : en mode
 *   `absolute` le nœud est DESSINÉ d'après sa géométrie, et c'est le centre (pas
 *   position_x seul) qui est persisté — sans ça l'enfant « reviendrait » à sa place.
 */
export function assignColumnToNodesChildren(da: Class_DrawingArea, sources: Class_NodeElement[]): void {
  const undos: Array<() => void> = []
  const redos: Array<() => void> = []
  sources.forEach(source => {
    const target_u = source.position_u
    const target_x = source.position_x
    // collectNodeDescendants inclut le nœud lui-même ; on l'exclut.
    const descendants = [...NodePositioning.collectNodeDescendants(source)].filter(n => n !== source)
    descendants.forEach(target => {
      const old_u = target.position_u
      const old_x = target.position_x
      const old_u_locked = target.shape_position_u_locked === true
      // Rien à faire si déjà dans la bonne colonne ET déjà verrouillé.
      if (old_u === target_u && old_x === target_x && old_u_locked) return
      // 1) Le nœud est sérialisé par son CENTRE stocké (cf. centerForPersistence),
      //    pas par position_x : modifier seulement position_x laisse `_center_x`
      //    périmé et le nœud « revient » à sa place au rechargement (écueil
      //    documenté dans translateStoredCenter). On passe donc par setStoredCenter
      //    pour viser un centre tel que le COIN (position_x) s'aligne sur le parent.
      // 2) On VERROUILLE la colonne (shape_position_u_locked) : c'est ce verrou qui
      //    fait persister position_u (cf. NodeBasePersistence.toJSON) et empêche
      //    autosankey/inferPositionUFromX de le recalculer depuis x au chargement.
      const old_center = target.centerForPersistence()
      const new_center_x = target_x + target.getShapeWidthToUse() / 2
      const apply = () => {
        target.position_u = target_u
        target.shape_position_u_locked = true
        target.setStoredCenter(new_center_x, old_center.y)
        target.draw()
      }
      const undo = () => {
        target.position_u = old_u
        target.shape_position_u_locked = old_u_locked
        target.setStoredCenter(old_center.x, old_center.y)
        target.draw()
      }
      undos.push(undo)
      redos.push(apply)
      apply()
    })
  })
  commitTransitions(da, undos, redos)
}

/**
 * Collecte les transitions de propagation du style du flux `source` à ses flux enfants : les flux
 * existants reliant un descendant de la source à un descendant de la cible.
 */
function collectStyleToLinkChildren(
  da: Class_DrawingArea,
  source: Class_LinkElement,
  undos: Array<() => void>,
  redos: Array<() => void>
): void {
  // Même logique que NodePositioning.collectChildLinks (propagation de la
  // droiture aux flux désagrégés) : on parcourt TOUS les liens du sankey (les
  // flux enfants existent même quand le parent est agrégé, juste invisibles) et
  // on retient ceux reliant un descendant de la source à un descendant de la
  // cible. collectNodeDescendants inclut le nœud lui-même, donc a→b avec b
  // désagrégé en b1,b2 cible bien a→b1 et a→b2.
  const src_descendants = NodePositioning.collectNodeDescendants(source.source as Class_NodeElement)
  const tgt_descendants = NodePositioning.collectNodeDescendants(source.target as Class_NodeElement)
  const child_links = da.sankey.links_list.filter(link =>
    link !== source &&
    src_descendants.has(link.source as Class_NodeElement) &&
    tgt_descendants.has(link.target as Class_NodeElement)
  ) as Class_LinkElement[]
  child_links.forEach(target => {
    const transition = applyStyleFromSourceToTarget(source, target)
    if (transition) {
      undos.push(transition.undo)
      redos.push(transition.redo)
    }
  })
}

/**
 * Propage le style de CHAQUE flux parent de `sources` à ses propres flux enfants, le tout regroupé
 * dans une seule transition d'historique.
 */
export function applyStyleToLinksChildren(da: Class_DrawingArea, sources: Class_LinkElement[]): void {
  const undos: Array<() => void> = []
  const redos: Array<() => void> = []
  sources.forEach(source => collectStyleToLinkChildren(da, source, undos, redos))
  commitTransitions(da, undos, redos)
}
