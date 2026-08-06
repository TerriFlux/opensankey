// ==================================================================================================
// #392 — Politique d'ENVELOPPE d'un cadre englobant (nœud ou ZDT `tied_to_nodes`)
// sur ses membres.
//
// Isolé ici en fonction PURE, comme les autres politiques de géométrie du dossier
// (cf. `tiedFrameRefit`, `anchorLockTransfer`, `ioOrderGeometry`) : la décision se
// teste sans le graphe d3/DOM de `Class_NodeBase`, dont dépend la MESURE des
// membres (`getBBox()` du SVG). `Class_NodeBase._computeEnvelopeBBox` mesure,
// délègue ici, puis applique.
//
// La politique est ASYMÉTRIQUE, et c'est l'objet du #392 :
//
//  - HORIZONTALEMENT, l'enveloppe est LABELS INCLUS. C'est l'acquis du #363 : un
//    membre dont le libellé déborde à gauche (`name_label_horiz: 'left'` +
//    `name_label_inside_horiz: false`) doit être entouré libellé compris, sinon le
//    cadre encadre les formes et laisse les textes dehors.
//
//  - VERTICALEMENT, l'enveloppe épouse les seules BOÎTES des membres. Un libellé
//    est une étiquette, pas un contenu : il ne doit pas peser sur la hauteur.
//    Avant le #392, la hauteur venait aussi du `getBBox()` : le libellé d'un
//    membre plus FIN que son propre texte (texte centré, `dominant-baseline:
//    middle` → il déborde de part et d'autre) gonflait l'enveloppe, et le cadre
//    devenait plus haut que sa pile d'enfants. Symptôme : une marge résiduelle
//    sous le dernier membre, visible seulement sur les cadres au contenu fin —
//    sur une colonne de cadres volontairement collés, elle désalignait les
//    groupes sans que rien dans les réglages (marges à 0, `shape_min_height` à 0,
//    espacement à 0) ne l'explique.
//
// Le bord haut d'un cadre appartient de toute façon au mode de positionnement
// actif, qui le réécrit à chaque dessin (cf. la note du #363 dans
// `refitTiedFrameToLabels`) : le mesurer libellés inclus n'avait pas de sens
// stable, là où le bord gauche, que rien ne réécrit, en a un.
// ==================================================================================================

/** Un membre déjà mesuré : boîte logique + bbox SVG locale (labels inclus). */
export type Type_EnvelopeMember = {
  /** Coin haut/gauche de la boîte logique du membre, en coordonnées monde. */
  position_x: number,
  position_y: number,
  /** Taille logique du membre (`getShape{Width,Height}ToUse()`). */
  logical_w: number,
  logical_h: number,
  /**
   * `getBBox()` du `<g>` du membre, en coordonnées LOCALES au membre (donc à
   * décaler de `position_*`). `null` quand la mesure DOM n'est pas disponible ou
   * pas fiable — cadre tied dont le `getBBox()` peut être en retard d'un tick
   * après un re-stack en cascade : la taille logique fait alors autorité.
   */
  svg_bbox: { x: number, y: number, width: number, height: number } | null,
}

export type Type_EnvelopeBBox = {
  min_x: number, min_y: number, max_x: number, max_y: number
}

/**
 * Enveloppe des membres : X labels inclus, Y sur les seules boîtes logiques.
 * `null` si la liste est vide (aucun membre à envelopper).
 */
export const envelopeBBoxOfMembers = (
  members: Type_EnvelopeMember[]
): Type_EnvelopeBBox | null => {
  let min_x = Infinity, min_y = Infinity, max_x = -Infinity, max_y = -Infinity
  let found = false
  members.forEach(m => {
    // Horizontal : bbox SVG si elle a une étendue, sinon repli sur la boîte logique.
    const bbox = m.svg_bbox
    const usable = bbox && (bbox.width > 0 || bbox.height > 0)
    const left = usable ? m.position_x + bbox!.x : m.position_x
    const right = usable ? left + bbox!.width : m.position_x + m.logical_w
    // Vertical : TOUJOURS la boîte logique (#392) — le libellé ne pèse pas.
    const top = m.position_y
    const bottom = top + m.logical_h
    if (left < min_x) min_x = left
    if (top < min_y) min_y = top
    if (right > max_x) max_x = right
    if (bottom > max_y) max_y = bottom
    found = true
  })
  if (!found) return null
  return { min_x, min_y, max_x, max_y }
}
