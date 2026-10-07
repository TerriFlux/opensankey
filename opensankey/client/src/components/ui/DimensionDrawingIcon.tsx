// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1511, 07/10/2026 — LES PETITS VISUELS DU DESSIN D'UNE DIMENSION DU DIAGRAMME, comme ceux de la
// couronne (`FigureDrawingIcon`). Julien : « l'icône de placement des dataTags hiérarchiques devrait
// changer selon qu'on est en bandes, en nœuds ou en diagrammes séparés, comme pour les couronnes ».
//  - un membre : un flux simple ;
//  - en bandes : le même flux, rayé de ses membres ;
//  - en nœuds : un nœud qui se divise en trois, un flux vers chacun ;
//  - diagrammes séparés (en nœuds, un diagramme par membre) : trois petits diagrammes empilés.
// SVG en ligne, `currentColor` : ils prennent la couleur du texte du bouton ou du menu.

import React from 'react'

export type Type_DimensionDrawingIconName = 'one' | 'bands' | 'nodes' | 'separate'

type Type_Shape = { d: string, o?: number }

/** Un rectangle en tracé. */
const rect = (x: number, y: number, w: number, h: number): string => `M${x} ${y}h${w}v${h}h${-w}Z`

/** Un flux de (x0, y0..y0+h0) à (x1, y1..y1+h1), en trapèze. */
const band = (x0: number, y0: number, h0: number, x1: number, y1: number, h1: number): string =>
  `M${x0} ${y0}L${x1} ${y1}L${x1} ${y1 + h1}L${x0} ${y0 + h0}Z`

const SHAPES: { [name in Type_DimensionDrawingIconName]: Type_Shape[] } = {
  one: [
    { d: rect(1, 4, 2, 8) },
    { d: rect(3, 6, 10, 4), o: 0.55 },
    { d: rect(13, 4, 2, 8) }
  ],
  bands: [
    { d: rect(1, 3, 2, 10) },
    { d: rect(3, 4.5, 10, 2.2) },
    { d: rect(3, 6.9, 10, 2.2), o: 0.6 },
    { d: rect(3, 9.3, 10, 2.2), o: 0.3 },
    { d: rect(13, 3, 2, 10) }
  ],
  nodes: [
    { d: rect(1, 3, 2, 10) },
    { d: band(3, 3, 3.2, 12.5, 1, 3.2), o: 0.55 },
    { d: band(3, 6.4, 3.2, 12.5, 6.4, 3.2), o: 0.55 },
    { d: band(3, 9.8, 3.2, 12.5, 11.8, 3.2), o: 0.55 },
    { d: rect(12.5, 1, 2.5, 3.2) },
    { d: rect(12.5, 6.4, 2.5, 3.2) },
    { d: rect(12.5, 11.8, 2.5, 3.2) }
  ],
  separate: [0.5, 6, 11.5].flatMap(y => [
    { d: rect(1, y, 1.8, 4) },
    { d: rect(2.8, y + 1, 10.4, 2), o: 0.55 },
    { d: rect(13.2, y, 1.8, 4) }
  ])
}

/** Le visuel d'un dessin de dimension, à la taille du texte voisin (16 px par défaut). */
export const DimensionDrawingIcon = ({ name, size = 16 }: { name: Type_DimensionDrawingIconName, size?: number }) => (
  <svg
    className={`dimension_drawing_icon dimension_drawing_icon_${name}`}
    width={size} height={size} viewBox='0 0 16 16' fill='currentColor' aria-hidden='true' focusable='false'
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    {SHAPES[name].map((s, i) => <path key={i} d={s.d} fillOpacity={s.o} />)}
  </svg>
)

/**
 * Le visuel du dessin EN COURS d'une dimension : un membre, en bandes, en nœuds — et, rangée un
 * diagramme par membre (`dimensionInMemberBands`, en nœuds comme en bandes), des diagrammes séparés.
 */
export const dimensionDrawingIconName = (
  drawing: 'one' | 'multi' | 'nodes' | 'other', in_member_bands: boolean
): Type_DimensionDrawingIconName => {
  if (drawing !== 'multi' && drawing !== 'nodes') return 'one'
  if (in_member_bands) return 'separate'
  return drawing === 'nodes' ? 'nodes' : 'bands'
}
