/**
 * sa#601 — CE QU'UNE FIGURE DIT DE SA TAILLE À LA GRILLE QUI LA RANGE.
 *
 * Une fenêtre à plusieurs vignettes les rangeait en grille sans rien savoir de ce qu'elles
 * dessinent : autant de colonnes de 240 px que la largeur en admettait, des cases d'au moins
 * 260 px de haut étirées à la hauteur du volet. Pensé pour deux à quatre cases, cela devient
 * illisible à trente : une étoile se cadre dans la LARGEUR de sa case (ses libellés latéraux),
 * sa police suit le cadrage, et ses libellés tombaient à 5 px au milieu d'une case quasi carrée.
 *
 * La grille ne peut pas deviner ces deux choses — la proportion du dessin, la taille de ses
 * libellés une fois cadré — et la figure ne peut pas choisir sa case. Le partage est donc
 * celui-ci : la figure DÉCRIT son contenu dans ses propres unités, indépendamment de la case
 * qu'on lui donne ; la grille en déduit le nombre de colonnes et la hauteur des cases.
 *
 * Une figure qui ne dit rien (couronne, histogramme, « Infos ») garde la grille d'avant.
 */
export type Type_TileFit = {
  /** Largeur du contenu à cadrer, en unités du dessin. */
  content_width: number
  /** Hauteur du contenu à cadrer, mêmes unités. */
  content_height: number
  /** Marge que le cadrage laisse autour du contenu, en px ÉCRAN (sur chaque axe, au total). */
  margin_px: number
  /**
   * Plus petite police de libellé dessinée, en unités du dessin : à l'écran elle vaut ce nombre
   * multiplié par l'échelle du cadrage. `null` = aucun libellé qui suive l'échelle (police à
   * taille d'écran constante, ou pas de texte) — la grille n'a alors rien à protéger.
   */
  min_font_size: number | null
}

/**
 * Ce que l'hôte d'une vignette lui confie (`Type_RepresentationContext.tile`).
 *
 * `in_grid` : la vignette est l'une de plusieurs. Elle se cadre alors sur son contenu ENTIER,
 * sur les deux axes, puisque la grille dimensionne sa case d'après lui ; seule, elle garde le
 * cadrage qu'elle a toujours eu.
 *
 * `reportFit` : à appeler après chaque dessin. Rappeler avec une description inchangée ne
 * coûte rien (cf. `sameTileFit`).
 */
export type Type_TileHost = {
  in_grid: boolean
  reportFit: (fit: Type_TileFit | null) => void
}

/** Échelle (px écran par unité du dessin) du contenu cadré dans une case `width` × `height`. */
export const tileScaleFor = (fit: Type_TileFit, width: number, height?: number): number => {
  const k_w = fit.content_width > 0 ? (width - fit.margin_px) / fit.content_width : Infinity
  const k_h = height !== undefined && fit.content_height > 0
    ? (height - fit.margin_px) / fit.content_height
    : Infinity
  const k = Math.min(k_w, k_h)
  return Number.isFinite(k) ? Math.max(0, k) : 0
}

/** Hauteur de case qui montre le contenu entier, cadré dans la largeur `width`. */
export const tileHeightFor = (fit: Type_TileFit, width: number): number =>
  fit.content_height * tileScaleFor(fit, width) + fit.margin_px

/**
 * Deux descriptions qui ne diffèrent que d'un arrondi. Une étoile se redessine à chaque
 * changement de taille de sa case, et la grille change la taille des cases quand une
 * description change : sans cette tolérance, une mesure qui bouge d'un millième relancerait
 * la boucle.
 */
export const sameTileFit = (a: Type_TileFit | null | undefined, b: Type_TileFit | null | undefined): boolean => {
  if (!a || !b) return a == b
  const close = (x: number, y: number) => Math.abs(x - y) <= Math.max(0.5, 0.005 * Math.max(Math.abs(x), Math.abs(y)))
  return close(a.content_width, b.content_width)
    && close(a.content_height, b.content_height)
    && a.margin_px === b.margin_px
    && (a.min_font_size === null || b.min_font_size === null
      ? a.min_font_size === b.min_font_size
      : close(a.min_font_size, b.min_font_size))
}

/** Largeur minimale d'une colonne quand aucune figure ne dit rien de ses libellés (grille d'avant). */
export const TILE_MIN_COLUMN_PX = 240

/**
 * LE NOMBRE DE VIGNETTES PAR LIGNE.
 *
 * Le plus grand qui laisse TOUS les libellés dessinés à au moins `min_text_px` à l'écran — la
 * taille du bandeau de titre des vignettes : un libellé plus petit que le titre de sa case ne se
 * lit plus. On retire donc des colonnes jusqu'à ce que le plus petit libellé de la grille
 * atteigne ce seuil.
 *
 * Et si on n'y arrive pas, on s'arrête là où retirer une colonne n'agrandit plus rien : une case
 * bornée par la HAUTEUR du volet (`max_height`) ne grossit plus en s'élargissant, et la passer
 * seule sur sa ligne ne ferait que vider la grille.
 *
 * `inner_width` : largeur utile de la grille ; `gap` : écart entre colonnes ; `chrome` : ce
 * qu'une case prend sur la largeur du dessin (bordures). Sans aucune police à protéger, la règle
 * est celle d'avant : des colonnes d'au moins `TILE_MIN_COLUMN_PX`.
 */
export const pickTileColumns = (
  { inner_width, gap, chrome, count, fits, min_text_px, max_height }: {
    inner_width: number
    gap: number
    chrome: number
    count: number
    fits: Type_TileFit[]
    min_text_px: number
    max_height?: number
  }
): number => {
  if (count <= 1) return 1
  const fonted = fits.filter(f => f.min_font_size !== null && f.content_width > 0)
  if (fonted.length === 0) {
    return Math.max(1, Math.min(count, Math.floor((inner_width + gap) / (TILE_MIN_COLUMN_PX + gap))))
  }
  const textAt = (n: number): number => {
    const width = (inner_width - (n - 1) * gap) / n - chrome
    if (width <= 0) return 0
    return Math.min(...fonted.map(f => (f.min_font_size as number) * tileScaleFor(f, width, max_height)))
  }
  const best = textAt(1)
  for (let n = count; n > 1; n--) {
    const text = textAt(n)
    if (text >= min_text_px || text >= best * 0.999) return n
  }
  return 1
}
