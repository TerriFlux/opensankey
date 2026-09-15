// ==================================================================================================
// SA#552 — Indices visuels de la ligne de rappel d'une dimension (« Unité : kt PB ») : une main au
// survol et une petite flèche vers le bas à droite du libellé, qui disent qu'un clic ouvre une liste.
//
// Module FEUILLE, sans import runtime : il est appelé par LegendGenerator, que le cœur charge tôt
// (cf. l'en-tête de ce dernier) ; tirer d'ici le module de présentation risquerait un cycle.
//
// ⚠️ La flèche est un `<text>` VOISIN du libellé, jamais un `tspan` dedans : l'empreinte de rendu du
// corpus (#530) fige le texte de `.name_label_text` de chaque zone de légende.
// ==================================================================================================

import type { Class_ContainerElement } from './TextZone'

export const LEGEND_DIMENSION_CARET_CLASS = 'legend_dimension_caret'
export const LEGEND_DIMENSION_CARET = '▾'

// La flèche transmet ces gestes au libellé : cliquer la flèche, c'est cliquer la ligne — même
// chemin (ouverture de la liste, sélection en édition), sans logique en double ici.
const FORWARDED_EVENTS = ['mousedown', 'mouseup', 'click', 'dblclick']

const SVG_NS = 'http://www.w3.org/2000/svg'

/**
 * Pose (ou repose, après un redessin de la zone) la flèche. La main, elle, vient de la classe CSS
 * des zones cliquables de la légende (SA#549, `legend_toggle_entry`), posée par LegendGenerator :
 * un curseur en ligne sur le groupe perdrait contre le curseur texte que DrawLabel pose sur le
 * libellé en édition.
 */
export function decorateLegendDimensionZone(zone: Class_ContainerElement): void {
  const group = zone.d3_selection?.node() as SVGGElement | null | undefined
  if (!group) return
  group.querySelectorAll('.' + LEGEND_DIMENSION_CARET_CLASS).forEach(caret => caret.remove())
  const text = group.querySelector('.name_label_text') as SVGTextElement | null
  const parent = text?.parentNode
  if (!text || !parent) return

  const box = text.getBBox()
  const font_size = text.getAttribute('font-size') ?? text.style.fontSize
  const fill = text.getAttribute('fill') ?? text.style.fill
  const gap = 0.3 * (parseFloat(font_size) || 12)

  const caret = document.createElementNS(SVG_NS, 'text')
  caret.setAttribute('class', LEGEND_DIMENSION_CARET_CLASS)
  caret.setAttribute('x', String(box.x + box.width + gap))
  caret.setAttribute('y', String(box.y + box.height / 2))
  caret.setAttribute('dominant-baseline', 'central')
  const transform = text.getAttribute('transform')
  if (transform) caret.setAttribute('transform', transform)
  if (font_size) caret.style.fontSize = /^[\d.]+$/.test(font_size) ? font_size + 'px' : font_size
  if (fill) caret.style.fill = fill
  caret.textContent = LEGEND_DIMENSION_CARET
  FORWARDED_EVENTS.forEach(type => caret.addEventListener(type, event => {
    event.stopPropagation()
    text.dispatchEvent(new MouseEvent(type, event as MouseEvent))
  }))
  parent.appendChild(caret)
}
