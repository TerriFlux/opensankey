// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import * as d3 from 'd3'

import { Class_NodeElement } from './Node'
import { Class_LinkStyle } from './ElementStyle'
import { Class_LinkElement } from './Link'

/**
 * Class that handles all tooltip operations for NodeElement
 */
export class NodeTooltip {

  private _node: Class_NodeElement

  constructor(node: Class_NodeElement) {
    this._node = node
  }

  /**
   * Display the tooltip on drawing area
   */
  // public drawTooltip() {
  //   // Clean previous label
  //   d3.selectAll('.sankey-tooltip').remove()

  //   const tooltip = d3.select('body')
  //     .append('div')
  //     .attr('class', 'sankey-tooltip')
  //     .attr('tabindex', '0') // Permet de prendre le focus
  //     .style('opacity', 0)
  //     .style('top', this._node.position_y + 'px')
  //     .style('left', this._node.position_x + 'px')
  //     .html(this.getTooltipHTML())

  //   // Animation d'apparition et prise de focus
  //   tooltip.transition()
  //     .duration(200)
  //     .style('opacity', 1)
  //     .on('end', () => {
  //       // Prendre le focus après l'animation
  //       ;(tooltip.node() as HTMLElement)?.focus()
  //     })
  // }

  /**
   * Move tooltip to follow mouse cursor
   */
  public moveTooltip(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    d3.selectAll('.sankey-tooltip')
      .style('top', event.pageY + 'px')
      .style('left', event.pageX + 'px')
  }

  /**
   * Remove tooltip from display
   */
  public removeTooltip() {
    d3.selectAll('.sankey-tooltip').remove()
    this._node.d3_selection?.classed('tooltip_shown', false)
  }
  /*
   * Display the tooltip on drawing area
   */
  public drawTooltip() {
    // Clean previous label
    d3.selectAll('.sankey-tooltip').remove()

    // Utiliser la position de la souris stockée par l'event handler
    let x = this._node.position_x
    let y = this._node.position_y

    // Si on a la position de la souris depuis l'event handler, l'utiliser
    const mousePos = this._node._nodeEventsHandler.getMousePosition()
    if (mousePos.x && mousePos.y) {
      x = Math.min(mousePos.x + 10, window.innerWidth - 650)
      y = Math.min(mousePos.y + 10, window.innerHeight - 500)
    } else {
      // Fallback vers position du noeud
      x = Math.min(this._node.position_x, window.innerWidth - 650)
      y = Math.min(this._node.position_y, window.innerHeight - 500)
    }

    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'sankey-tooltip')
      .attr('tabindex', '0')
      .style('opacity', 0)
      .style('top', y + 'px')
      .style('left', x + 'px')
      .html(this.getTooltipHTML())

    // Animation d'apparition
    tooltip.transition()
      .duration(300)
      .style('opacity', 1)
      .on('end', () => {
        // Exécuter le JavaScript après que le DOM soit prêt
        this.initTooltipBehavior()
      })
  }

  /**
   * Initialiser le comportement du tooltip après création
   */
  private initTooltipBehavior() {
    const tooltip = document.querySelector('.sankey-tooltip') as HTMLElement
    if (!tooltip) return

    console.log('Initializing tooltip behavior');

    // PROTECTION AGGRESSIVE contre la fermeture
    // Stocker la référence globalement pour éviter la fermeture
    (window as any).activeTooltip = tooltip

    // Override de TOUS les événements qui pourraient fermer le tooltip
    const originalRemove = tooltip.remove
    tooltip.remove = function () {
      // Ne permettre la fermeture que si explicitement demandée
      if ((window as any).allowTooltipClose) {
        originalRemove.call(this)
        delete (window as any).activeTooltip
      }
    }

    // Test de focus agressif
    const forceFocus = () => {
      console.log('Attempting focus...')
      tooltip.focus()
      console.log('Active element after focus:', document.activeElement?.className)
      console.log('Tooltip has focus:', document.activeElement === tooltip)
    }

    // Focus immédiat et répété
    forceFocus()
    setTimeout(forceFocus, 50)
    setTimeout(forceFocus, 100)
    setTimeout(forceFocus, 200)

    // Zone de protection étendue autour du tooltip
    const createSafeZone = () => {
      const rect = tooltip.getBoundingClientRect()
      const safeZone = {
        left: rect.left - 20,
        right: rect.right + 20,
        top: rect.top - 20,
        bottom: rect.bottom + 20
      }

        // Stocker la zone de sécurité
        ; (window as any).tooltipSafeZone = safeZone
    }

    setTimeout(createSafeZone, 100)

    // Event listener global pour protéger le tooltip
    const protectTooltip = (e: Event) => {
      const target = e.target as HTMLElement

      // Si c'est un événement sur ou dans le tooltip, permettre l'interaction normale
      if (tooltip.contains(target)) {
        return // Laisser l'événement se propager normalement pour les scrollbars
      }

      // Si c'est dans la zone de sécurité mais PAS sur le tooltip, protéger
      if ((window as any).tooltipSafeZone) {
        const mouseEvent = e as MouseEvent
        const zone = (window as any).tooltipSafeZone
        if (mouseEvent.clientX >= zone.left && mouseEvent.clientX <= zone.right &&
          mouseEvent.clientY >= zone.top && mouseEvent.clientY <= zone.bottom) {
          e.stopPropagation()
          return
        }
      }
    }

    // Protéger contre tous les types d'événements - SAUF sur le tooltip lui-même
    ['click', 'mousedown', 'mouseup'].forEach(eventType => {
      document.addEventListener(eventType, protectTooltip, true) // capture phase
    })

    // Forcer l'interactivité du scroll après création
    setTimeout(() => {
      const content = tooltip.querySelector('.tooltip-content') as HTMLElement
      if (content) {
        // Supprimer tous les event listeners qui pourraient bloquer
        content.style.pointerEvents = 'auto'
        content.style.touchAction = 'auto'

        // Force la scrollbar à être visible et interactive
        content.addEventListener('wheel', (e) => {
          if (e.shiftKey || content.scrollWidth > content.clientWidth) {
            e.preventDefault()
            content.scrollLeft += e.deltaY > 0 ? 50 : -50
          }
        })

        // Debug : vérifier si on peut capturer les événements de scroll
        content.addEventListener('mousedown', (e) => {
          console.log('Mousedown on content:', e.target)
        })

        content.addEventListener('scroll', (e) => {
          console.log('Scroll event detected, scrollLeft:', content.scrollLeft)
        })
      }
    }, 100)

    // Bouton close fonctionnel
    const closeBtn = tooltip.querySelector('.tooltip-close') as HTMLElement
    if (closeBtn) {
      closeBtn.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log('Close button clicked')
          ; (window as any).allowTooltipClose = true
        tooltip.remove()
      }
    }

    // ESC pour fermer
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('ESC pressed, closing tooltip')
          ; (window as any).allowTooltipClose = true
        tooltip.remove()
        document.removeEventListener('keydown', escHandler)
      }
    }
    document.addEventListener('keydown', escHandler)

  }

  /**
   * Generate HTML content for scrollable tooltip
   */
  private getTooltipHTML() {
  // Sommes inputs/outputs visibles
  let input_val = 0
  let output_val = 0
  this._node.input_links_list.filter(l => l.is_visible).forEach(l => input_val += l.valueCurrent ?? 0)
  this._node.output_links_list.filter(l => l.is_visible).forEach(l => output_val += l.valueCurrent ?? 0)

  const t = this._node.drawing_area.application_data.t.bind(this._node.drawing_area.application_data)
  const hasInputs = this._node.hasInputLinks()
  const hasOutputs = this._node.hasOutputLinks()

  // En-tête (titre + éventuel sous-titre)
  let html = '<div class="tooltip-header">'
  html += `<h4 class="tooltip-title">${this._node.name.split('\\n').join(' ')}</h4>`
  if (this._node.tooltip_text) {
    html += `<p class="tooltip-subtitle">${this._node.tooltip_text.split('\n').join('<br>')}</p>`
  }
  html += '</div>'

  // ---- CSS (inchangé ou quasi) ----
  html += `
  <style>
    .sankey-tooltip {
      position: fixed !important;
      background: white;
      border: 2px solid #333;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 12px;
      width: 600px;
      max-width: 90vw;
      max-height: 80vh;
      z-index: 10000;
      overflow: visible;
      outline: none;
    }
    .sankey-tooltip:focus {
      outline: 3px solid #4a9eff; outline-offset: 2px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15), inset 0 0 0 2px #4a9eff;
    }
    .tooltip-header {
      padding: 12px 16px 8px 16px;
      border-bottom: 1px solid #eee; background: #fafafa;
      position: sticky; top: 0; z-index: 1;
    }
    .tooltip-title { margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #333; }
    .tooltip-subtitle { margin: 0 0 8px 0; color: #666; font-size: 11px; }
    .tooltip-content { max-height: 400px; overflow: auto !important; padding: 12px 0; position: relative; }

    .tooltip-table {
      width: 100%; border-collapse: collapse; font-size: 11px;
      white-space: nowrap; table-layout: auto; /* un seul tableau => alignement naturel */
    }
    .tooltip-table td.value,
    .tooltip-table td.ratio,
    .tooltip-table th.value,
    .tooltip-table th.ratio {
      text-align: right !important;
    }
    .tooltip-table th {
      background: #f9f9f9; font-weight: 600; padding: 5px 5px !important;
      text-align: center; border-bottom: 2px solid #ddd; border-right: 1px solid #d0d0d0;
      position: sticky; top: var(--sticky-top, 0px); z-index: 1;
    }
    .tooltip-table th:first-child {
      position: sticky; left: 0; z-index: 3; background: #f9f9f9;
      box-shadow: 2px 0 4px rgba(0,0,0,0.1); min-width: 120px; max-width: 120px; width: auto;
    }
    .tooltip-table td {
      padding: 8px 18px; border-bottom: 1px solid #f0f0f0; border-right: 1px solid #e8e8e8; background: white;
    }
    .tooltip-table td:first-child {
      position: sticky; left: 0; z-index: 2; background: white;
      box-shadow: 2px 0 4px rgba(0,0,0,0.05); font-weight: 500;
      min-width: 120px; max-width: 200px; width: auto; text-align: left !important;
    }
    .tooltip-table tr:hover td { background: #fafafa; }
    .tooltip-table tr:hover td:first-child { background: #f5f5f5; }

    .total-row td { font-weight: 600; border-top: 2px solid #ddd; background: #f8f8f8 !important; }
    .total-row td:first-child { background: #f0f0f0 !important; }

    .section-header td {
      padding: 6px 12px; font-weight: 600; color: #333;
      background: linear-gradient(90deg, #f0f8ff 0%, #e6f3ff 100%);
      border-left: 3px solid #4a9eff; border-right: 0; border-top: 0; border-bottom: 1px solid #e0e0e0;
      position: sticky; left: 0; z-index: 2;
    }

    /* Scrollbar custom */
    .tooltip-content::-webkit-scrollbar { width: 8px; height: 8px; }
    .tooltip-content::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
    .tooltip-content::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
    .tooltip-content::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
  </style>
  `

  // ---- Contenu : table unique ----
  html += '<div class="tooltip-content">'

  // En-têtes : libellé combiné pour la 1re colonne (Provenance / Destination)
  const firstColLabel = `${t('Noeud.drawing_area_tooltip.prov')} / ${t('Noeud.drawing_area_tooltip.dest')}`

  html += '<table class="tooltip-table"><thead><tr>'
  html += `<th>${firstColLabel}</th>`
  html += `<th>${t('Noeud.drawing_area_tooltip.val')}</th>`
  html += `<th>${t('Noeud.drawing_area_tooltip.rat')}</th>`
  this._node.sankey.flux_taggs_list.forEach(tagg => {
    html += `<th>${tagg.name}</th>`
  })
  html += '</tr></thead><tbody>'

  const colCount = 3 + this._node.sankey.flux_taggs_list.length

  // Helpers pour rendu de lignes
  const renderRow = (link: Class_LinkElement, totalVal: number, isInput: boolean) => {
    const nodeName = isInput ? link.source.name : link.target.name
    const ratio = totalVal > 0 ? Math.round(((link.valueCurrent ?? 0) / totalVal) * 100) + '%' : '-'
    let row = '<tr>'
    row += `<td>${nodeName}</td>`
    row += `<td class="value">${link.data_label}</td>`
    row += `<td class="ratio">${ratio}</td>`
    // Colonnes tags
    this._node.sankey.flux_taggs_list.forEach(tagg => {
      const names: string[] = []
      link.flux_tags_list.forEach(tag => {
        if (tag.group === tagg) names.push(tag.name)
      })
      row += `<td>${names.join(', ')}</td>`
    })
    row += '</tr>'
    return row
  }

  const renderTotalRow = (totalVal: number) => {
    const totalValStr = String(totalVal).replace(/(?<!\..*)(\d)(?=(?:\d{3})+(?:\.|$))/g, '$1 ')
    let row = '<tr class="total-row">'
    row += `<td>Total</td>`
    row += `<td class="value">${totalValStr}</td>`
    row += `<td></td>`
    for (let i = 0; i < this._node.sankey.flux_taggs_list.length; i++) row += '<td></td>'
    row += '</tr>'
    return row
  }

  // ---- Section Entrées ----
  if (hasInputs) {
    html += `<tr class="section-header"><td colspan="${colCount}">${t('Noeud.drawing_area_tooltip.prov')}</td></tr>`
    this._node.input_links_list.filter(l => l.is_visible).forEach(l => {
      html += renderRow(l, input_val, true)
    })
    html += renderTotalRow(input_val)
  }

  // ---- Section Sorties ----
  if (hasOutputs) {
    html += `<tr class="section-header"><td colspan="${colCount}">${t('Noeud.drawing_area_tooltip.dest')}</td></tr>`
    this._node.output_links_list.filter(l => l.is_visible).forEach(l => {
      html += renderRow(l, output_val, false)
    })
    html += renderTotalRow(output_val)
  }

  html += '</tbody></table></div>'
  return html
}

}