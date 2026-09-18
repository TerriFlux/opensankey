// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// os#1425 — LE TITRE D'UNE FIGURE, POSÉ DANS SON CADRE (arbitrage du 18/09).
//
// Une figure a un titre comme le diagramme a le sien, et il se dessine de la même façon pour
// toutes — sunburst, couronne, barres : une ligne au-dessus ou au-dessous du dessin, qui prend
// sa hauteur et laisse le reste au tracé. Un seul endroit pour le poser, sinon trois moteurs
// finiraient par écrire trois titres différents.
//
// Le moteur appelle `mountFigureTitle` sur le conteneur VIDÉ qu'on lui prête, et dessine dans
// l'élément rendu : sans titre à écrire, c'est le conteneur lui-même, et rien ne change.

import type { Type_FigureTitle } from './figureChartStyle'
import { figureTitleText } from './figureChartStyle'

/**
 * Pose le titre dans `container` et rend L'ÉLÉMENT OÙ DESSINER — le conteneur lui-même quand il
 * n'y a pas de titre. L'élément rendu prend toute la place restante, en largeur comme en hauteur.
 */
export const mountFigureTitle = (
  container: HTMLElement,
  title: Type_FigureTitle | undefined,
  fallback_text: string
): HTMLElement => {
  const text = title ? figureTitleText(title, fallback_text) : ''
  if (!text) return container
  const wrap = document.createElement('div')
  wrap.className = 'figure_titled'
  wrap.style.display = 'flex'
  wrap.style.flexDirection = title!.title_position === 'bottom' ? 'column-reverse' : 'column'
  wrap.style.width = '100%'
  wrap.style.height = '100%'
  wrap.style.minHeight = '0'

  const head = document.createElement('div')
  head.className = 'figure_title'
  head.textContent = text
  head.title = text
  head.style.flex = '0 0 auto'
  head.style.textAlign = 'center'
  head.style.padding = '0.15rem 0.4rem'
  head.style.fontSize = `${title!.title_font_size}px`
  head.style.fontWeight = title!.title_bold ? '700' : '400'
  head.style.lineHeight = '1.25'
  head.style.color = '#2D3748'
  head.style.overflow = 'hidden'
  head.style.textOverflow = 'ellipsis'
  head.style.whiteSpace = 'nowrap'

  const body = document.createElement('div')
  body.className = 'figure_body'
  body.style.flex = '1 1 auto'
  body.style.minHeight = '0'
  body.style.minWidth = '0'
  body.style.width = '100%'
  body.style.position = 'relative'

  wrap.appendChild(head)
  wrap.appendChild(body)
  container.appendChild(wrap)
  return body
}
