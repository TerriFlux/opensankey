// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1511, 03/10/2026 — LES PETITS VISUELS DU DESSIN D'UNE COURONNE, dessinés UNE fois.
//
// Julien : « un petit visuel devant chacun des trois choix ». En secteurs : un anneau découpé en
// secteurs. En sunburst : des anneaux concentriques. Une couronne par membre : trois petites
// couronnes côte à côte. SVG en ligne, `currentColor` : ils prennent la couleur du texte du menu
// (clair, sombre, grisé avec le choix quand il est désactivé). La barre du haut et le panneau de la
// figure les importent d'ici ; les choix les nomment par leur clé (`Type_TopbarFigureChoice`).

import React from 'react'

export type Type_FigureDrawingIconName = 'sectors' | 'rings' | 'multiples' | 'table_flat' | 'table_tree' | 'table_multiples'

/** Un secteur d'anneau, de `a0` à `a1` (radians, 0 en haut, sens horaire), rayons `r0` < `r1`. */
const sector = (cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string => {
  const pt = (r: number, a: number) => `${(cx + r * Math.sin(a)).toFixed(2)} ${(cy - r * Math.cos(a)).toFixed(2)}`
  const large = a1 - a0 > Math.PI ? 1 : 0
  return `M${pt(r1, a0)}A${r1} ${r1} 0 ${large} 1 ${pt(r1, a1)}L${pt(r0, a1)}A${r0} ${r0} 0 ${large} 0 ${pt(r0, a0)}Z`
}

/** Un anneau découpé en parts (fractions du tour), séparées d'un petit jour. */
const ring = (cx: number, cy: number, r0: number, r1: number, parts: number[], gap = 0.16): string[] => {
  const out: string[] = []
  let a = 0
  parts.forEach(p => {
    const span = p * 2 * Math.PI
    out.push(sector(cx, cy, r0, r1, a + gap / 2, a + span - gap / 2))
    a += span
  })
  return out
}

/** Un rectangle plein (une cellule, une barre d'en-tête). */
const rect = (x: number, y: number, w: number, h: number): string => `M${x} ${y}h${w}v${h}h${-w}Z`

/** 07/10/2026 — un petit tableau : une colonne de libellés et `cols` colonnes de `rows` lignes. */
const grid = (x: number, y: number, w: number, rows: number, cols: number, indent: number[] = []): string[] => {
  const out: string[] = []
  const rh = 2
  const cw = (w - 4) / cols
  for (let r = 0; r < rows; r++) {
    const yy = y + r * (rh + 1)
    const ind = indent[r] ?? 0
    out.push(rect(x + ind, yy, 3 - ind, rh))
    for (let c = 0; c < cols; c++) out.push(rect(x + 4 + c * cw, yy, cw - 0.6, rh))
  }
  return out
}

const PATHS: { [name in Type_FigureDrawingIconName]: string[] } = {
  sectors: ring(8, 8, 3.6, 7.5, [0.45, 0.3, 0.25]),
  rings: [
    ...ring(8, 8, 2.4, 4.6, [0.55, 0.45], 0.22),
    ...ring(8, 8, 5.2, 7.6, [0.3, 0.25, 0.25, 0.2], 0.14)
  ],
  multiples: [
    ...ring(2.9, 8, 1.2, 2.6, [0.6, 0.4], 0.35),
    ...ring(8, 8, 1.2, 2.6, [0.5, 0.5], 0.35),
    ...ring(13.1, 8, 1.2, 2.6, [0.7, 0.3], 0.35)
  ],
  // 07/10/2026 — le tableau croisé : plat (des lignes égales), hiérarchique (un groupe et ses lignes en
  // retrait), un tableau par membre (deux petits tableaux).
  table_flat: [rect(1, 1.5, 14, 2), ...grid(1, 5, 14, 4, 3)],
  table_tree: [rect(1, 1.5, 14, 2), ...grid(1, 5, 14, 4, 3, [0, 1.2, 1.2, 0])],
  table_multiples: [...grid(0.5, 3, 7, 4, 1), ...grid(8.5, 3, 7, 4, 1)]
}

export const isFigureDrawingIconName = (name: unknown): name is Type_FigureDrawingIconName =>
  typeof name === 'string' && Object.prototype.hasOwnProperty.call(PATHS, name)

/** Le visuel d'un choix de dessin, à la taille du texte voisin (16 px par défaut). */
export const FigureDrawingIcon = ({ name, size = 16 }: { name: Type_FigureDrawingIconName, size?: number }) => (
  <svg
    width={size} height={size} viewBox='0 0 16 16' fill='currentColor' aria-hidden='true' focusable='false'
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    {PATHS[name].map((d, i) => <path key={i} d={d} />)}
  </svg>
)

/** 04/10/2026 — le même visuel en DOM pur, pour le tableau de navigation d'une couronne (os#1511). */
export const figureDrawingIconElement = (name: Type_FigureDrawingIconName, size = 14): SVGSVGElement => {
  const ns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('width', String(size))
  svg.setAttribute('height', String(size))
  svg.setAttribute('viewBox', '0 0 16 16')
  svg.setAttribute('fill', 'currentColor')
  svg.setAttribute('aria-hidden', 'true')
  svg.style.display = 'inline-block'
  svg.style.verticalAlign = 'middle'
  svg.style.flexShrink = '0'
  PATHS[name].forEach(d => {
    const path = document.createElementNS(ns, 'path')
    path.setAttribute('d', d)
    svg.appendChild(path)
  })
  return svg
}
