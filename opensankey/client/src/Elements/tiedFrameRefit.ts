// ==================================================================================================
// #363 — Politique de recalage HORIZONTAL d'un cadre englobant (nœud ou ZDT
// `tied_to_nodes`) sur l'enveloppe LABELS INCLUS de ses membres.
//
// Isolé ici en fonction PURE, comme les autres politiques de géométrie du dossier
// (cf. `anchorLockTransfer`, `ioOrderGeometry`) : la décision se teste sans le
// graphe d3/DOM de `Class_NodeBase`, dont dépend la MESURE de l'enveloppe
// (`getBBox()` du SVG). `Class_NodeBase.refitTiedFrameToLabels` mesure, délègue
// ici, puis applique.
// ==================================================================================================

export type Type_TiedFrameRefitInput = {
  /** Bord gauche courant de la boîte de CONTENU du cadre (position_x + marge gauche). */
  current_left: number,
  /** Enveloppe des membres, labels inclus. */
  envelope_min_x: number,
  envelope_max_x: number,
  /** Marges du cadre. */
  margin_left: number,
  margin_right: number,
  /** Largeur mini persistée du cadre (0 = largeur pilotée par l'enveloppe). */
  shape_min_width: number,
}

/**
 * Nouveau bord gauche de la boîte de contenu, ou `null` s'il ne faut pas bouger.
 *
 * - L'enveloppe déborde à GAUCHE du cadre → on suit toujours. C'est le défaut de
 *   #363 : la taille du cadre est label-incluse (`_envelopeSize`) mais son coin ne
 *   l'était qu'en fin de drag, si bien qu'un fichier dont les libellés débordent à
 *   gauche s'ouvrait avec un cadre de la bonne largeur, translaté du débord.
 * - L'enveloppe s'est RESSERRÉE (elle commence à droite du bord courant) → on ne
 *   suit que si la largeur du cadre est celle de l'enveloppe. En police verrouillée
 *   la largeur des libellés en unités monde varie avec le zoom : sans ce
 *   rattrapage, un dézoom suivi d'un rezoom laisserait le cadre débordant à gauche.
 *   Mais un cadre volontairement ÉLARGI (OS#1259 : `shape_min_width` au-delà de
 *   l'enveloppe) garde son bord gauche — on ne défait pas un redimensionnement
 *   manuel.
 */
export const tiedFrameRefitLeft = (
  input: Type_TiedFrameRefitInput
): number | null => {
  const {
    current_left, envelope_min_x, envelope_max_x,
    margin_left, margin_right, shape_min_width,
  } = input
  if (envelope_min_x === current_left) return null
  if (envelope_min_x > current_left) {
    const envelope_w = (envelope_max_x - envelope_min_x) + margin_left + margin_right
    if (shape_min_width > envelope_w) return null
  }
  return envelope_min_x
}
