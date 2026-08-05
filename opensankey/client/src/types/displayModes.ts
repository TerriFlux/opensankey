// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// #242 — Domaine « modes d'affichage » (bascule absolu / paramétrique / proportionnel / échelle
// adaptée) extrait de Class_DrawingArea en fonctions libres prenant la DA. Ce sont de fines
// façades orchestrant `da.nodePositioning.*` ; elles n'accèdent qu'à des membres publics de la
// DA. La classe garde des méthodes-délégatrices. Extrait en fonctions libres (et non déplacé
// dans NodePositioning) pour ne pas interférer avec le découpage de NodePositioning (#243).

import type { Class_DrawingArea } from './DrawingArea'

// #369 — Choisir un mode est un geste EXPLICITE : il lève la suspension d'ouverture (qui fait
// dessiner en absolu jusqu'au premier changement de datatag, cf. DrawingArea) pour que le mode
// s'applique tout de suite, comme avant #369.
export function setParametricMode(da: Class_DrawingArea) {
  da.clearPositionModeSuspension()
  da.withBypassRedraws(() => {
    const default_style = da.sankey.styles_dict['default']

    // 1. Initialise position_u depuis position_x pour les nœuds non verrouillés.
    //    Nécessaire car on vient potentiellement du mode absolu où les nœuds
    //    ont été placés librement.
    da.nodePositioning.inferPositionUFromX()

    // 2. Back-calcul de shape_position_dy depuis les positions absolues actuelles.
    //    Si overlap détecté, shape_position_dy est clampé à 0 — la bascule provoquera
    //    un saut visuel pour ces nœuds.
    const overlap_count = da.nodePositioning.backCalculateShapePositionDyFromY()
    if (overlap_count > 0) {
      console.warn(
        `[setParametricMode] ${overlap_count} nœud(s) en chevauchement détecté(s) en absolu — ` +
        'shape_position_dy clampé à 0, certaines positions vont changer lors de la bascule.'
      )
    }

    // 3. Bascule du mode et recalcul du V (les Y restent stables car le dy a été
    //    back-calculé pour reproduire les positions actuelles).
    default_style.shape_position_type = 'parametric'
    da.sankey.nodes_list.forEach(n => {
      if (n.shape_position_v_locked !== true) n.position_v = -1
    })
    // #1231 — mode « écart » : capturer le cadre de référence (médiane globale + centre
    // par colonne + sommes par colonne) sur l'état courant cohérent, comme le mode
    // proportionnel. Les centres de colonne suivront ensuite le % au changement de
    // datatag/dimension, avec écarts constants. Fait après backCalculateShapePositionDyFromY
    // et avant computeParametrization (l'ordre V ne change pas l'étendue géométrique).
    da.nodePositioning.captureProportionalReference()
    da.nodePositioning.computeParametrization(false)
  }, false)
}

export function setAbsoluteMode(da: Class_DrawingArea) {
  da.clearPositionModeSuspension()
  const default_style = da.sankey.styles_dict['default']
  const prev_mode = default_style.shape_position_type
  // #1231 — quitter l'« échelle adaptée » restaure l'échelle de base.
  da.nodePositioning.clearScaleAdaptation()
  // #1231 — le flux/datatag de référence sont PERSISTÉS et conservés en mode absolu (on ne
  // les efface plus) : seul le MODE change. Re-entrer en % réutilisera le couple de réf.
  default_style.shape_position_type = 'absolute'
  if (prev_mode === 'scale_adapted' || prev_mode === 'proportional') {
    // #1231 (1.1.5) — sortie d'un mode d'AFFICHAGE (échelle / proportionnel) : le coin
    // courant est du scratch (rescalé par l'échelle adaptée, ou comprimé par le %). On
    // FORCE le retour aux vrais centres stockés, sinon les positions d'affichage
    // deviendraient les positions absolues (le % « collait »). Centres invariants → on
    // retrouve exactement la position absolue d'avant l'entrée du mode.
    da.nodePositioning.deriveAbsoluteNodesFromCenter()
  } else {
    // #1230 — prev = absolu / parametric (ex. ops structurelles) : le coin courant EST la
    // nouvelle vérité → on le commit comme centre (settle), pour que le 1er draw n'introduise
    // aucun saut.
    da.sankey.nodes_list.forEach(n => n.settleCenterAnchor())
  }
}

// #1231 — Mode « échelle adaptée » : le flux de référence (clic droit) garde toujours la
// même épaisseur ; l'échelle du diagramme s'adapte à chaque datatag en conséquence. Les
// nœuds gardent leur centre fixe (comme l'absolu) pendant qu'ils se redimensionnent.
export function setScaleAdaptedMode(da: Class_DrawingArea) {
  da.clearPositionModeSuspension()
  const default_style = da.sankey.styles_dict['default']
  // #1231 (1.1.5) — si on vient d'un mode d'AFFICHAGE (proportionnel), le coin courant est
  // comprimé. On revient d'abord aux VRAIS centres (sinon settleCenterAnchor figerait le
  // coin comprimé comme centre → centres faussés). L'échelle adaptée part donc des positions
  // absolues réelles ; le draw applique ensuite le rescale autour des centres invariants.
  da.nodePositioning.deriveAbsoluteNodesFromCenter()
  default_style.shape_position_type = 'scale_adapted'
  da.nodePositioning.captureScaleReference()
  // #1231 — redessiner immédiatement pour appliquer l'échelle adaptée dès l'entrée du
  // mode (sinon le rescale n'apparaissait qu'au draw suivant : navigation datatag).
  da.draw()
}

export function setProportionalMode(da: Class_DrawingArea) {
  da.clearPositionModeSuspension()
  const default_style = da.sankey.styles_dict['default']
  // #1231 — quitter l'« échelle adaptée » restaure l'échelle de base.
  da.nodePositioning.clearScaleAdaptation()
  // #1231 (1.1.5) — si on vient d'un mode d'AFFICHAGE (échelle), le coin courant est du
  // scratch rescalé. On revient d'abord aux VRAIS centres pour que la capture de référence
  // (médiane, centres de colonne) parte des positions absolues réelles, pas de l'affichage.
  da.nodePositioning.deriveAbsoluteNodesFromCenter()
  default_style.shape_position_type = 'proportional'
  // #1231 — identifier les colonnes (position_u, sans déplacer les nœuds) puis
  // capturer le cadre de référence (médiane = centre de gravité, haut/bas, sommes
  // par colonne, centre de réf de chaque nœud). Au datatag courant f=1 → pas de saut
  // à la bascule ; les autres datatags compriment/dilatent autour de la médiane.
  da.nodePositioning.inferPositionUFromX()
  da.nodePositioning.captureProportionalReference()
}

export function resetAllVerticalIntervals(da: Class_DrawingArea, v_spacing?: number) {
  // La clé dans le config prefixée est `shape_position_dy` (cf.
  // createConfigWithPrefix + NODE_SHAPE_SPECIFIC_CONFIG). Utiliser `position_dy`
  // supprimait une clé inexistante → les overrides persistaient.
  const affected_nodes = Object.values(da.sankey.nodes_dict)
    .filter(node => node.shape_position_type !== 'relative')
  const snapshots = affected_nodes.map(node => ({ node, snapshot: node.snapshotStorage() }))
  const default_style = da.sankey.styles_dict['default']
  const prev_style_dy = default_style.shape_position_dy

  const apply = () => {
    if (v_spacing !== undefined) {
      default_style.shape_position_dy = v_spacing
    }
    affected_nodes.forEach(node => node.delete_attribute('shape_position_dy'))
    da.draw()
  }
  const revert = () => {
    if (v_spacing !== undefined) {
      default_style.shape_position_dy = prev_style_dy
    }
    snapshots.forEach(({ node, snapshot }) => node.restoreStorage(snapshot))
    da.draw()
  }

  da.application_data.history.saveUndo(revert)
  da.application_data.history.saveRedo(apply)
  apply()
}
