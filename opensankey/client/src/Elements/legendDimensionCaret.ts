// ==================================================================================================
// SA#552 — Petite flèche vers le bas à droite du libellé de la ligne de rappel d'une dimension
// (« Unité : kt PB »), qui dit qu'un clic ouvre une liste. Visible AU SURVOL de la ligne seulement.
//
// Module FEUILLE, sans import runtime : il est appelé par LegendGenerator, que le cœur charge tôt
// (cf. l'en-tête de ce dernier) ; tirer d'ici le module de présentation risquerait un cycle.
//
// ⚠️ La flèche est un `<text>` VOISIN du libellé, jamais un `tspan` dedans : l'empreinte de rendu du
// corpus (#530) fige le texte de `.name_label_text` de chaque zone de légende.
//
// Survol géré par ÉCOUTEURS sur la zone, pas par une règle CSS `:hover` (retour du test local du
// 2026-09-15 : la flèche n'apparaissait pas) : à chaque survol, la flèche est reposée si un
// redessin du libellé l'a retirée, puis rendue visible.
// ==================================================================================================

import type { Class_ContainerElement } from './TextZone'

export const LEGEND_DIMENSION_CARET_CLASS = 'legend_dimension_caret'
export const LEGEND_DIMENSION_CARET = '▾'

// Espace de noms des écouteurs d3 : reposés à chaque régénération sans s'empiler, et sans
// toucher aux écouteurs propres de l'élément (posés, eux, sans espace de noms).
const NS = '.legend_dimension_caret'

// La flèche transmet ces gestes au libellé : cliquer la flèche, c'est cliquer la ligne — même
// chemin (ouverture de la liste, sélection en édition), sans logique en double ici.
const FORWARDED_EVENTS = ['mousedown', 'mouseup', 'click', 'dblclick']

const SVG_NS = 'http://www.w3.org/2000/svg'

/** Flèche de la zone, créée TRANSPARENTE si elle manque (premier dessin ou libellé redessiné). */
function ensureCaret(group: SVGGElement): SVGTextElement | null {
  const existing = group.querySelector('.' + LEGEND_DIMENSION_CARET_CLASS) as SVGTextElement | null
  if (existing) return existing
  const text = group.querySelector('.name_label_text') as SVGTextElement | null
  const parent = text?.parentNode
  if (!text || !parent) return null

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
  // Transparente plutôt que masquée : elle reste cliquable.
  caret.style.opacity = '0'
  caret.style.transition = 'opacity 0.1s ease-in'
  caret.textContent = LEGEND_DIMENSION_CARET
  FORWARDED_EVENTS.forEach(type => caret.addEventListener(type, event => {
    event.stopPropagation()
    text.dispatchEvent(new MouseEvent(type, event as MouseEvent))
  }))
  parent.appendChild(caret)
  return caret
}

/**
 * Pose (ou repose, à chaque régénération) la flèche et son survol ; `enabled` faux — dimension à
 * étiquette unique — les retire. La main, elle, vient de la classe CSS des zones cliquables de la
 * légende (SA#549, `legend_toggle_entry`), posée par LegendGenerator.
 */
export function decorateLegendDimensionZone(zone: Class_ContainerElement, enabled: boolean): void {
  const selection = zone.d3_selection
  const group = selection?.node() as SVGGElement | null | undefined
  if (!selection || !group) return
  // Zone réutilisée par id : on repart de zéro (position du libellé, dimension devenue unique).
  group.querySelectorAll('.' + LEGEND_DIMENSION_CARET_CLASS).forEach(caret => caret.remove())
  if (!enabled) {
    selection.on('mouseover' + NS, null).on('mousemove' + NS, null).on('mouseleave' + NS, null)
    return
  }
  ensureCaret(group)
  const show = () => {
    const caret = ensureCaret(group)
    if (caret) caret.style.opacity = '1'
  }
  const hide = () => {
    group.querySelectorAll('.' + LEGEND_DIMENSION_CARET_CLASS)
      .forEach(caret => { (caret as SVGTextElement).style.opacity = '0' })
  }
  selection.on('mouseover' + NS, show).on('mousemove' + NS, show).on('mouseleave' + NS, hide)
}
