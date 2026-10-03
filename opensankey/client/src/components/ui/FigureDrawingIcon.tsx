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

export type Type_FigureDrawingIconName = 'sectors' | 'rings' | 'multiples'

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
  ]
}

export const isFigureDrawingIconName = (name: unknown): name is Type_FigureDrawingIconName =>
  name === 'sectors' || name === 'rings' || name === 'multiples'

/** Le visuel d'un choix de dessin, à la taille du texte voisin (16 px par défaut). */
export const FigureDrawingIcon = ({ name, size = 16 }: { name: Type_FigureDrawingIconName, size?: number }) => (
  <svg
    width={size} height={size} viewBox='0 0 16 16' fill='currentColor' aria-hidden='true' focusable='false'
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    {PATHS[name].map((d, i) => <path key={i} d={d} />)}
  </svg>
)
