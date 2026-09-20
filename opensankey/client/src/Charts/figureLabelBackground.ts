// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1468 — LE CARTOUCHE DERRIÈRE UNE ÉTIQUETTE DE PART.
//
// Julien, à l'écran : « et il n'y a pas de fonds sur les labels ». La famille `name_label_background_*`
// existe depuis toujours pour les nœuds et les flux — un rectangle derrière le texte, sa couleur,
// son opacité, son liséré, ses coins arrondis — et l'inspecteur la propose sur une part depuis
// qu'une part est un élément. Aucun tracé de figure ne la dessinait.
//
// C'est utile et pas décoratif : une étiquette blanche sur un secteur clair, ou un nom qui court
// sur deux secteurs de teintes différentes, ne se lit pas. Le cartouche est la réponse que le
// diagramme donne déjà à ce problème ; les figures doivent donner la même.
//
// ── POURQUOI UN MODULE, ET NON TROIS FOIS LE MÊME BLOC ───────────────────────────────────────
//
// Trois tracés écrivent des étiquettes de part — le sunburst, la couronne, les barres — et Julien
// a été clair sur ce point : « tout le look and feel doit être similaire d'un graphe à l'autre,
// comme sur Excel ». Un cartouche dessiné trois fois divergerait trois fois : la marge d'ici, les
// coins de là. Il s'écrit donc une fois.
//
// ── LA MESURE SE FAIT SUR LE TEXTE DÉJÀ POSÉ ─────────────────────────────────────────────────
//
// `getBBox()` sur le nœud de texte, et non un calcul de largeur : le texte peut être sur plusieurs
// lignes (`tspan`), dans une police que seul le navigateur connaît, à une taille que la part a
// réglée. Toute estimation se tromperait, et un cartouche trop court est pire que pas de
// cartouche — il souligne l'erreur.
//
// Conséquence : ce module s'appelle APRÈS que le texte a été écrit, jamais avant. Et il rend
// silencieusement la main quand la mesure est impossible (jsdom n'a pas de mise en page, donc pas
// de `getBBox` utile) : un test de tracé ne doit pas tomber pour ça.

import * as d3 from '../d3Modules'

/** Ce qu'une part dit de son cartouche. Tout est facultatif : absent = pas de cartouche. */
export interface Type_FigureLabelBackground {
  /** `name_label_background_visible` — rien n'est dessiné tant qu'elle n'est pas vraie. */
  bg_visible?: boolean
  /** `name_label_background_color` / `_opacity`. */
  bg_color?: string
  bg_opacity?: number
  /** `name_label_background_border_*`. */
  bg_border_visible?: boolean
  bg_border_color?: string
  bg_border_thickness?: number
  bg_border_radius?: number
}

/** La marge entre le texte et le bord de son cartouche, en pixels. */
const LABEL_BG_PADDING_X = 4
const LABEL_BG_PADDING_Y = 2

/**
 * Pose le cartouche DERRIÈRE une étiquette déjà écrite.
 *
 * @param text l'élément `<text>` d3, ses `tspan` compris.
 * @param bg ce que la part dit de son cartouche ; sans `bg_visible`, rien ne se passe.
 */
export const drawFigureLabelBackground = (
  text: d3.Selection<SVGTextElement, unknown, null, undefined>,
  bg: Type_FigureLabelBackground | undefined
): void => {
  if (!bg?.bg_visible) return
  const node = text.node()
  if (!node || typeof node.getBBox !== 'function') return
  let box: DOMRect
  try {
    box = node.getBBox()
  } catch {
    // Un nœud détaché du document n'a pas de boîte. Pas de cartouche, pas d'erreur.
    return
  }
  // Une boîte vide veut dire « pas encore mis en page » (jsdom, ou un texte vide) : on ne dessine
  // pas un rectangle de rien.
  if (box.width === 0 && box.height === 0) return

  const parent = node.parentNode
  if (!parent) return
  const rect = d3.select(parent as Element)
    .insert('rect', () => node)
    .attr('class', 'figure_label_background')
    .attr('x', box.x - LABEL_BG_PADDING_X)
    .attr('y', box.y - LABEL_BG_PADDING_Y)
    .attr('width', box.width + 2 * LABEL_BG_PADDING_X)
    .attr('height', box.height + 2 * LABEL_BG_PADDING_Y)
    // Le cartouche ne prend pas le clic : c'est la part qu'on veut sélectionner en cliquant, pas
    // le rectangle qui traîne devant elle.
    .attr('pointer-events', 'none')
    .attr('fill', bg.bg_color ?? '#ffffff')
    .attr('fill-opacity', bg.bg_opacity ?? 1)

  if (bg.bg_border_radius !== undefined && bg.bg_border_radius > 0) {
    rect.attr('rx', bg.bg_border_radius).attr('ry', bg.bg_border_radius)
  }
  if (bg.bg_border_visible) {
    rect
      .attr('stroke', bg.bg_border_color ?? '#000000')
      .attr('stroke-width', bg.bg_border_thickness ?? 1)
  }

  // LE MÊME `transform` QUE SON TEXTE. Le cartouche est inséré dans le même parent, juste avant
  // lui : sans cette recopie il resterait à l'origine du groupe pendant que le texte est posé au
  // centroïde de son secteur. `insert` place l'élément AVANT le texte dans le document, donc
  // DERRIÈRE lui à l'écran — c'est tout ce dont on a besoin, sans toucher à l'ordre des calques.
  const transform = text.attr('transform')
  if (transform) rect.attr('transform', transform)
}
