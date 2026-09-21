// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1469 — ÉCRIRE UN TEXTE DE PART : une fois, pour toutes les figures et pour les deux textes.
//
// Julien : « est-ce que tu arrives à factoriser les codes de dessin, comme on avait fait en partie
// pour les nœuds et les flux ? »
//
// Oui, et c'est le même précédent : `Elements/DrawLabel` écrit le libellé d'un nœud ET celui d'un
// flux — deux objets très différents, un seul code, parce qu'un LIBELLÉ est un libellé. Une figure
// n'avait pas son équivalent : le sunburst posait sa police, la couronne reposait la sienne, les
// barres une troisième, et la valeur d'une barre n'en posait aucune.
//
// ── CE QUE LA DUPLICATION COÛTAIT, ET CE N'EST PAS THÉORIQUE ──────────────────────────────────
//
// Sur les quatre endroits qui écrivaient un texte de part, la valeur d'une barre lisait la
// typographie du NOM (`name_label_font_size`, `name_label_font_family`…) : régler la police du
// nombre n'avait aucun effet, et régler celle du nom déplaçait aussi le nombre. Personne ne l'avait
// écrit exprès — c'est ce qui arrive quand on recopie un bloc en changeant une ligne.
//
// ── LA FRONTIÈRE ──────────────────────────────────────────────────────────────────────────────
//
// Ce module ne place pas le texte : c'est le tracé qui sait où va un nom sous un axe, au centroïde
// d'un arc ou au-dessus d'une barre. Il applique ce qu'un texte DIT DE LUI-MÊME — sa police, sa
// graisse, son encre, ses lignes, son cartouche — et rien d'autre. La place reste au tracé, le
// style vient d'ici.

import * as d3 from '../d3Modules'
import { drawFigureLabelBackground } from './figureLabelBackground'
import type { Type_FigurePartTextAspect } from './figureChartStyle'

/** Ce que la FIGURE dit, quand la part ne dit rien. */
export interface Type_FigureTextDefaults {
  font_size: number
  font_family?: string
  bold?: boolean
  italic?: boolean
  /** L'encre du tracé — blanche dans un secteur, ardoise sous un axe. */
  color: string
}

/**
 * Applique à un `<text>` ce que la part dit de CE texte, puis pose son cartouche.
 *
 * @param text le `<text>` déjà placé par le tracé, et déjà rempli de ses lignes.
 * @param aspect ce que la part dit de ce texte-ci — son nom, ou sa valeur.
 * @param defaults ce que la figure dit, pour tout ce que la part tait.
 */
export const applyPartTextStyle = (
  text: d3.Selection<SVGTextElement, unknown, null, undefined>,
  aspect: Type_FigurePartTextAspect | undefined,
  defaults: Type_FigureTextDefaults
): void => {
  text
    .attr('font-size', aspect?.font_size ?? defaults.font_size)
    // `null` RETIRE l'attribut chez d3 : un texte muet reste donc exactement comme hier — sans
    // famille, sans graisse, sans style déclarés, donc ceux de la page.
    .attr('font-family', (aspect?.font_family ?? defaults.font_family) || null)
    .attr('font-weight', (aspect?.bold ?? defaults.bold) ? 'bold' : null)
    .attr('font-style', (aspect?.italic ?? defaults.italic) ? 'italic' : null)
    .attr('fill', aspect?.color || defaults.color)
  drawFigureLabelBackground(text, aspect)
}

/**
 * os#1481 — LE LISÉRÉ TIRETÉ D'UNE PART, et l'OMBRE PORTÉE sous sa forme.
 *
 * Julien, à l'écran : « ni opacité ne marche, ni tireté, ni ombre ». Les deux dernières n'étaient
 * dessinées NULLE PART — l'audit les comptait parmi les cinquante-et-une « à implémenter », ce qui
 * n'est une excuse pour personne : la case était offerte dans l'inspecteur.
 *
 * ÉCRITES ICI, avec les textes de part, parce que les trois natures dessinent des formes et que la
 * même règle posée trois fois divergerait trois fois. C'est la leçon de tout ce chantier.
 *
 * Le motif reprend celui des nœuds et des flux (`4 2`, cf. `DrawNodes`) : un tireté d'une figure
 * doit ressembler à un tireté du diagramme, sinon « le look and feel diverge d'un graphe à
 * l'autre ». Il s'échelonne sur l'épaisseur du trait, sans quoi un liséré de 4 px tireté par 4 px
 * paraît plein.
 */
export const partDashArray = (
  aspect: { border_dashed?: boolean, border_thickness?: number } | undefined
): string | null => {
  if (!aspect?.border_dashed) return null
  const w = Math.max(1, aspect.border_thickness ?? 1)
  return `${w * 4} ${w * 2}`
}

/** L'identifiant du filtre d'ombre, posé une fois par dessin dans les `defs` du SVG. */
const PART_SHADOW_ID = 'figure_part_shadow'

/**
 * L'OMBRE PORTÉE d'une part, rendue comme une référence de filtre — ou `null`.
 *
 * Le filtre lui-même est déclaré à la demande dans les `defs` du dessin : un `<filter>` par part
 * serait ruineux sur une couronne de cent secteurs, et l'ombre est la même pour toutes. Elle est
 * DOUCE et courte (2 px de flou, 1 px de décalage) : une ombre de figure souligne un relief, elle
 * ne fait pas flotter le secteur au-dessus de la page.
 *
 * ⚠️ `filter` N'EST PAS RENDU PAR TOUS LES EXPORTS. L'export PNG passe par un rendu navigateur et
 * l'honore ; un consommateur SVG qui ne suit pas la référence perdra l'ombre, pas la forme. C'est
 * la raison pour laquelle l'ombre reste un ornement et jamais un porteur d'information.
 */
export const partShadow = (
  aspect: { shadow_visible?: boolean } | undefined,
  defs: d3.Selection<SVGDefsElement, unknown, null, undefined> | null
): string | null => {
  if (!aspect?.shadow_visible || !defs) return null
  if (defs.select(`#${PART_SHADOW_ID}`).empty()) {
    const filter = defs.append('filter')
      .attr('id', PART_SHADOW_ID)
      // Une ombre déborde de la boîte du dessin : sans marge, elle est coupée net.
      .attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%')
    filter.append('feDropShadow')
      .attr('dx', 1).attr('dy', 1).attr('stdDeviation', 2)
      .attr('flood-opacity', 0.35)
  }
  return `url(#${PART_SHADOW_ID})`
}

/**
 * os#1480 — L'ENCRE D'UNE ÉTIQUETTE SORTIE DE SA PART, en trois modes et pas un de plus.
 *
 * Arbitrage de Julien (21/09/2026) sur `*_color_sustainable`, une clé qui existait dans l'inspecteur
 * sans que rien ne la lise. Le drapeau dit « garde TA couleur au lieu de suivre celle de la forme » :
 * décoché, il demande donc à l'encre de suivre la part.
 *
 *   1. la part impose une teinte (`color`)              → celle-là ;
 *   2. elle décoche « Couleur fixe » (`ink_follows_shape`) → LA COULEUR DE LA PART ;
 *   3. elle ne dit rien                                  → le repli du tracé.
 *
 * POURQUOI SEULEMENT DEHORS. Écrire le nom d'un secteur dans la couleur de ce secteur le rend
 * invisible : dedans, les tracés gardent le contraste ou la teinte imposée. Au bout d'un trait de
 * rappel, au contraire, c'est le mode le plus lisible — rien n'y sert de fond à contraster, et la
 * couleur RATTACHE l'étiquette à la part qu'elle nomme.
 *
 * ÉCRITE ICI parce que les trois natures ont des étiquettes sorties, et que la même règle posée
 * trois fois divergerait trois fois — c'est tout ce que ce chantier aura montré.
 *
 * @param aspect ce que la part dit de ce texte.
 * @param part_color la couleur de la part telle que le tracé l'a résolue (palette, modèle, ou
 *   surcharge de la part).
 * @param fallback ce que le tracé écrirait sans rien de tout cela.
 */
export const calloutInk = (
  aspect: Type_FigurePartTextAspect | undefined,
  part_color: string | undefined,
  fallback: { name_label_color?: string } | string
): string => {
  const plain = typeof fallback === 'string'
    ? fallback
    : (fallback.name_label_color || DEFAULT_CALLOUT_INK)
  if (aspect?.color) return aspect.color
  if (aspect?.ink_follows_shape === true && part_color) return part_color
  return plain
}

/** L'encre d'une mention hors figure, telle que les tracés l'écrivaient en dur. */
const DEFAULT_CALLOUT_INK = '#2D3748'

/**
 * La CASSE d'un texte de part.
 *
 * Appliquée AU TEXTE et non par `text-transform` : tous les moteurs SVG ne l'honorent pas, et
 * l'export PNG en dépend. Même raison qu'au sunburst, et c'est pourquoi elle est ici et non dans
 * `applyPartTextStyle` — elle change la chaîne, pas l'attribut.
 */
export const partTextCase = (
  raw: string,
  aspect: Type_FigurePartTextAspect | undefined
): string => aspect?.uppercase ? raw.toLocaleUpperCase() : raw

/** Où se pose un texte, une fois que la part a dit ce qu'elle en pense. */
export interface Type_PartTextPlacement {
  x: number
  y: number
  anchor: 'start' | 'middle' | 'end'
  /** Vrai quand le tracé fait pivoter le texte (les noms serrés sous un axe). */
  rotate: boolean
}

/**
 * Le PLACEMENT d'un texte de part : la position que le tracé propose, corrigée de ce que la part
 * demande (décalages fins et ancrage).
 *
 * Volontairement pauvre : « dedans / dehors » et « haut / milieu / bas » dépendent de la forme de
 * la part — un rectangle a un dedans, un arc n'en a pas de la même façon — et restent donc au
 * tracé. Ce qui est commun, et seulement lui, est ici.
 */
export const partTextPlacement = (
  proposed: Type_PartTextPlacement,
  aspect: Type_FigurePartTextAspect | undefined
): Type_PartTextPlacement => {
  const align = aspect?.text_align
  return {
    x: proposed.x + (aspect?.shift_x ?? 0),
    y: proposed.y + (aspect?.shift_y ?? 0),
    anchor: align === 'left' ? 'start' : align === 'right' ? 'end' : align === 'middle'
      ? 'middle' : proposed.anchor,
    rotate: proposed.rotate
  }
}
