// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// #243 — Post-processing « flux droit » (#665/#1231) extrait de NodePositioning en fonctions
// libres prenant la DrawingArea. Ces méthodes n'ont besoin que de `drawingArea` (pas de l'état
// de NodePositioning). NodePositioning garde des méthodes-délégatrices publiques.

import { collectNodeDescendants } from './NodePositioningGeometry'
import type { Class_DrawingArea } from '../types/DrawingArea'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_NodeElement } from '../Elements/Node'
import type { Type_StraightMode } from '../Elements/ElementsAttributesConfig'

export function straightenLink(da: Class_DrawingArea, link: Class_LinkElement): boolean {
  if (link.shape_is_recycling || link.source === link.target) return false
  da.drawElements()
  return true
}

/**
 * #665 (refonte #1231) — Post-processing « flux droit » appliqué APRÈS placement, dans les
 * **trois modes** (paramétrique, absolu, proportionnel). Modèle simple **par flux** : pour chaque
 * flux marqué `shape_must_stay_straight`, on déplace le nœud cible verticalement pour que son
 * accroche coïncide avec celle de la source (source = référence). Pas de groupes rigides, pas de
 * back-calc : la droiture est re-appliquée à chaque dessin (après `drawElements`).
 *
 * Les flux sont traités triés par `position_u` de la source (amont → aval). Option par flux
 * `shape_straight_include_children` : redresse aussi les flux enfant-enfant (descendants dans la
 * hiérarchie de dimensions) → la droiture survit à la désagrégation.
 *
 * @returns `true` si au moins un nœud cible a bougé (le caller redessine).
 */
export function enforceStraightLinks(da: Class_DrawingArea): boolean {
  const echangeTag = da.sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
  const isStraightenable = (L: Class_LinkElement): boolean =>
    L.is_visible && !L.shape_is_recycling && L.source !== L.target &&
    !(echangeTag && (L.source.hasGivenTag(echangeTag) || L.target.hasGivenTag(echangeTag)))

  // Mode d'ancrage effectif d'un flux. Source de vérité = `shape_straight_mode` (enum).
  // Rétrocompat : un ancien fichier ne portant que `shape_must_stay_straight` se comporte comme
  // l'ancien modèle, soit l'ancrage 'source'. 'none' = libre.
  const effectiveMode = (L: Class_LinkElement): Type_StraightMode | null => {
    const m = L.shape_straight_mode
    if (m && m !== 'none') return m
    return L.shape_must_stay_straight ? 'source' : null
  }

  // Flux à redresser → mode. Marqués visibles + (si include_children) flux visibles dont source
  // ET cible descendent des nœuds d'un flux marqué (même hidden) ; les enfants héritent du mode.
  const to_straighten = new Map<Class_LinkElement, Type_StraightMode>()
  da.sankey.links_list.forEach(L => {
    const mode = effectiveMode(L as Class_LinkElement)
    if (!mode) return
    if (isStraightenable(L)) to_straighten.set(L as Class_LinkElement, mode)
    if (L.shape_straight_include_children) {
      collectDescendantStraightLinks(da, L as Class_LinkElement, isStraightenable)
        .forEach(c => { if (!to_straighten.has(c)) to_straighten.set(c, mode) })
    }
  })
  if (to_straighten.size === 0) return false

  // Offsets d'accroche relatifs (invariants par translation), capturés depuis le cache AVANT
  // tout déplacement.
  type SItem = { L: Class_LinkElement, mode: Type_StraightMode, startOff: number, endOff: number }
  const items: SItem[] = []
  to_straighten.forEach((mode, L) => {
    const s = (L.source as Class_NodeElement).getOutputLinkStartingPoint(L)
    const e = (L.target as Class_NodeElement).getInputLinkEndingPoint(L)
    if (!s || !e) return
    items.push({ L, mode, startOff: s.y - L.source.position_y, endOff: e.y - L.target.position_y })
  })
  // Amont → aval : un nœud déplacé comme cible doit l'être avant d'être source.
  items.sort((a, b) => a.L.source.position_u - b.L.source.position_u)

  let moved = false
  items.forEach(({ L, mode, startOff, endOff }) => {
    const srcAccr = L.source.position_y + startOff   // y de l'accroche côté source
    const tgtAccr = L.target.position_y + endOff      // y de l'accroche côté cible
    // Écart vertical constant à maintenir entre l'accroche source et l'accroche cible (px, y
    // croît vers le bas → positif = cible plus bas). 0 = horizontal.
    const off = L.shape_straight_offset || 0
    // Lignes cibles src/tgt telles que `tgtLine - srcLine == off`. Le nœud de référence du mode
    // reste en place (delta nul), l'autre est amené pour satisfaire l'écart.
    let srcLine: number, tgtLine: number
    switch (mode) {
    case 'target':
      tgtLine = tgtAccr; srcLine = tgtAccr - off; break
    case 'highest': // ancre = accroche la plus haute (min y)
      if (srcAccr <= tgtAccr) { srcLine = srcAccr; tgtLine = srcAccr + off }
      else { tgtLine = tgtAccr; srcLine = tgtAccr - off }
      break
    case 'lowest': // ancre = accroche la plus basse (max y)
      if (srcAccr >= tgtAccr) { srcLine = srcAccr; tgtLine = srcAccr + off }
      else { tgtLine = tgtAccr; srcLine = tgtAccr - off }
      break
    // 'source' (défaut) et 'absolute' (réservé → repli sur 'source' pour l'instant).
    default: srcLine = srcAccr; tgtLine = srcAccr + off; break
    }
    const ds = srcLine - srcAccr
    if (Math.abs(ds) > 0.5) { L.source.position_y += ds; moved = true }
    const dt = tgtLine - tgtAccr
    if (Math.abs(dt) > 0.5) { L.target.position_y += dt; moved = true }
  })
  return moved
}

/**
 * #1231 — Flux « enfant-enfant » d'un flux marqué avec `shape_straight_include_children` : flux
 * visibles redressables dont la source descend (hiérarchie de dimensions) de la source du flux
 * marqué ET la cible descend de sa cible. Calculé à la volée → la droiture survit à la désagrégation.
 */
function collectDescendantStraightLinks(
  da: Class_DrawingArea,
  parent_link: Class_LinkElement,
  isStraightenable: (L: Class_LinkElement) => boolean
): Class_LinkElement[] {
  const src_desc = collectNodeDescendants(parent_link.source as Class_NodeElement)
  const tgt_desc = collectNodeDescendants(parent_link.target as Class_NodeElement)
  return da.sankey.links_list.filter(L =>
    L !== parent_link && isStraightenable(L) &&
    src_desc.has(L.source as Class_NodeElement) && tgt_desc.has(L.target as Class_NodeElement)
  ) as Class_LinkElement[]
}
