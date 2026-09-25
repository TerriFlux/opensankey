// Réduire la boite de stock pour qu'elle tienne dans son nœud (`stock_label_shrink_to_fit`).
//
// En police verrouillée, la boite mesure police / zoom en coordonnées diagramme : sur un petit
// écran le zoom d'ajustement baisse, la boite grandit et déborde du nœud en largeur, ce que
// `pos_auto` (hauteur seule) ne rattrape pas. Ce module ne dessine rien : il dit à quelle police
// redessiner, à partir des mesures faites à la police demandée. Les glyphes suivent linéairement
// la police ; la hauteur de ligne garde un interligne fixe, corrigé en second.

export type StockBoxFitInput = {
  /** police courante, en coordonnées locales (déjà compensée du zoom) */
  font_size: number
  /** interligne fixe ajouté à chaque ligne, qui ne suit pas la police */
  line_gap: number
  nb_lines: number
  /** largeur de la ligne la plus large, mesurée à `font_size` */
  text_width: number
  /** place disponible pour le TEXTE : nœud moins marges et padding */
  avail_width: number
  avail_height: number
  /** la boite est intérieure sur cet axe (inside_* ou centrage) : l'axe contraint */
  inside_h: boolean
  inside_v: boolean
}

/**
 * Police à laquelle redessiner la boite pour qu'elle tienne. Renvoie `font_size` inchangée
 * quand elle tient déjà ou qu'aucun axe ne contraint ; jamais négative.
 */
export function stockBoxFittedFontSize(i: StockBoxFitInput): number {
  if (i.nb_lines <= 0 || i.font_size <= 0) return i.font_size
  const ratio_w = i.inside_h && i.text_width > 0 ? i.avail_width / i.text_width : 1
  const ratio_h = i.inside_v ? i.avail_height / (i.nb_lines * (i.font_size + i.line_gap)) : 1
  const ratio = Math.min(1, ratio_w, ratio_h)
  if (ratio >= 1) return i.font_size
  let font_size = Math.max(0, i.font_size * ratio)
  if (i.inside_v && i.nb_lines * (font_size + i.line_gap) > i.avail_height) {
    font_size = Math.max(0, i.avail_height / i.nb_lines - i.line_gap)
  }
  return font_size
}
