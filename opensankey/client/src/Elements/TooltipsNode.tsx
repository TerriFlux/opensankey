import * as d3 from 'd3'
import { Class_NodeElement } from './Node'
import { Class_LinkElement } from './Link'
import { TOOLTIP_STYLES, TooltipBehaviorManager } from './TooltipsCSS'
import { getNameLabelValues } from './ElementsAttributesConfig'
import { TFunction } from 'i18next'

// Conteneur DOM (id fixe) de la zone de dessin du sankey unitaire embarqué dans
// l'onglet du tooltip. Un seul tooltip à la fois → id unique suffisant.
const UNITARY_TOOLTIP_CONTAINER_ID = 'unitary_tooltip_sankey_container'


export class NodeTooltip {
  private _node: Class_NodeElement
  public behaviorManager?: TooltipBehaviorManager
  public mousePosition: { x: number; y: number } = { x: 0, y: 0 }

  // Onglet « Sankey unitaire » : handle de dessin (fourni par le hook OS+) et
  // observer de redimensionnement. Dessin paresseux à la 1re activation.
  private _unitaryHandle?: { redraw: () => void, cleanup: () => void }
  private _unitaryResizeObserver?: ResizeObserver
  private _unitaryDrawn = false

  constructor(node: Class_NodeElement) {
    this._node = node
  }

  public moveTooltip(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    d3.selectAll('.sankey-tooltip')
      .style('top', event.pageY + 'px')
      .style('left', event.pageX + 'px')
  }

  public removeTooltip() {
    this.behaviorManager?.cleanup()
    this.cleanupUnitary()
    d3.selectAll('.sankey-tooltip').remove()
    this._node.d3_selection?.classed('tooltip_shown', false)
  }

  /** Détruit le sankey unitaire embarqué (DA détachée + observer) s'il existe. */
  private cleanupUnitary() {
    this._unitaryResizeObserver?.disconnect()
    this._unitaryResizeObserver = undefined
    this._unitaryHandle?.cleanup()
    this._unitaryHandle = undefined
    this._unitaryDrawn = false
  }

  public drawTooltip() {
    this.cleanupUnitary()
    d3.selectAll('.sankey-tooltip').remove()

    let x = this.mousePosition.x || this._node.position_x
    let y = this.mousePosition.y || this._node.position_y

    x = Math.min(x + 10, window.innerWidth - 650)
    y = Math.min(y + 10, window.innerHeight - 500)

    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'sankey-tooltip')
      .attr('tabindex', '0')
      .style('opacity', 0)
      .style('top', y + 'px')
      .style('left', x + 'px')
      //.style('width', '600px')
      .html(this.getTooltipHTML())

    tooltip.transition()
      .duration(300)
      .style('opacity', 1)
      .on('end', () => {
        this.initTooltipBehavior()
        this.setupTabBehavior()
      })
  }

  private initTooltipBehavior() {
    const tooltip = document.querySelector('.sankey-tooltip') as HTMLElement
    if (!tooltip) return

    this.behaviorManager = new TooltipBehaviorManager(tooltip, () => this.removeTooltip())
    this.behaviorManager.initialize()
  }

  private setupTabBehavior() {
    const tabButtons = document.querySelectorAll('.tab-button')
    const tabContents = document.querySelectorAll('.tab-content')

    tabButtons.forEach((button, index) => {
      button.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()

        // Désactiver tous les onglets
        tabButtons.forEach(btn => btn.classList.remove('active'))
        tabContents.forEach(content => content.classList.remove('active'))

        // Activer l'onglet cliqué
        button.classList.add('active')
        const content = tabContents[index] as HTMLElement | undefined
        if (content) {
          content.classList.add('active')
          // L'onglet « Sankey unitaire » se dessine paresseusement : son conteneur
          // n'a une taille non nulle qu'une fois affiché (display:block).
          if (content.getAttribute('data-tab-key') === 'unitary') {
            this.drawUnitaryTab()
          }
        }
      })
    })
  }

  /**
   * Dessine (une seule fois) le sankey unitaire dans le conteneur de l'onglet, via
   * le hook injecté par OS+. Épingle le tooltip pour qu'il ne se ferme pas pendant
   * qu'on interagit avec le diagramme, et observe le redimensionnement pour recadrer.
   */
  private drawUnitaryTab() {
    if (this._unitaryDrawn) return
    const hook = this._node.drawing_area.application_data.draw_unitary_in_container
    if (typeof hook !== 'function') return
    const container = document.getElementById(UNITARY_TOOLTIP_CONTAINER_ID)
    if (!container) return
    this._unitaryDrawn = true

    // Épingle : l'utilisateur va survoler le diagramme, ne pas auto-fermer.
    const tooltip = container.closest('.sankey-tooltip') as HTMLElement | null
    if (tooltip) {
      tooltip.classList.add('pinned')
      const pin = tooltip.querySelector('.tooltip-pin') as HTMLElement | null
      if (pin) { pin.classList.add('active'); pin.title = 'Désépingler' }
    }

    try {
      const handle = hook(this._node, '#' + UNITARY_TOOLTIP_CONTAINER_ID)
      if (handle) this._unitaryHandle = handle
    } catch (e) {
      console.error('[unitary-tooltip] dessin du sankey unitaire échoué:', e)
      this._unitaryDrawn = false
      return
    }

    // Recadrage au redimensionnement du tooltip (poignée resize CSS).
    if (typeof ResizeObserver !== 'undefined') {
      let raf = 0
      let first = true
      this._unitaryResizeObserver = new ResizeObserver(() => {
        if (first) { first = false; return } // 1er callback = taille initiale, déjà dessinée
        if (raf) cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => this._unitaryHandle?.redraw())
      })
      this._unitaryResizeObserver.observe(container)
    }
  }

  private getTooltipHTML(): string {
    this._node.sankey.drawing_area.bypass_redraws = true
    // Calculs des valeurs
    let input_val = 0
    let output_val = 0
    this._node.input_links_list.filter(l => l.is_visible).forEach(l => input_val += l.valueCurrent ?? 0)
    this._node.output_links_list.filter(l => l.is_visible).forEach(l => output_val += l.valueCurrent ?? 0)

    const app_data = this._node.drawing_area.application_data
    const t = app_data.t.bind(app_data)
    const hasInputs = this._node.hasInputLinks()
    const hasOutputs = this._node.hasOutputLinks()
    const hasTags = this._node.sankey.flux_taggs_list.length > 0
    // Onglet unitaire : seulement si OS+ a injecté le hook de dessin.
    const hasUnitary = app_data.has_sankey_plus && typeof app_data.draw_unitary_in_container === 'function'

    // Définition des onglets disponibles (clé, libellé, contenu HTML).
    const tabs: { key: string, label: string, content: string }[] = [{
      key: 'values',
      label: t('Noeud.drawing_area_tooltip.values_tab') || 'Valeurs & Ratios',
      content: this.getValuesTabHTML(hasInputs, hasOutputs, input_val, output_val, t)
    }]
    if (hasTags) {
      tabs.push({
        key: 'tags',
        label: t('Noeud.drawing_area_tooltip.tags_tab') || 'Tags de flux',
        content: this.getTagsTabHTML(hasInputs, hasOutputs, input_val, output_val, t)
      })
    }
    if (hasUnitary) {
      tabs.push({
        key: 'unitary',
        label: t('Noeud.drawing_area_tooltip.unitary_tab') || 'Sankey unitaire',
        // Conteneur vide : OS+ y dessine la DA unitaire à l'activation de l'onglet.
        content: `<div class="unitary-tooltip-container" id="${UNITARY_TOOLTIP_CONTAINER_ID}"></div>`
      })
    }

    // Structure HTML
    let html = `<style>${TOOLTIP_STYLES}${this.getTabStyles()}</style>`

    // Header avec bouton de fermeture
    //html += `<p class="tooltip-subtitle">u:${this._node.position_u } | v:${this._node.position_v } | x:${this._node.position_x } | y:${this._node.position_y }</p>`;
    html += '<div class="tooltip-header">'
    html += '<button class="tooltip-close" type="button" aria-label="Fermer">&times;</button>'
    html += `<h4 class="tooltip-title">${this._node.name.split('\\n').join(' ')}</h4>`
    if (this._node.tooltip_text) {
      html += `<p class="tooltip-subtitle">${this._node.tooltip_text.split('\n').join('<br>')}</p>`
    }

    const useTabs = tabs.length > 1
    // Onglets (seulement si plus d'un onglet disponible)
    if (useTabs) {
      html += '<div class="tab-container"><div class="tab-buttons">'
      tabs.forEach((tab, i) => {
        html += `<button class="tab-button${i === 0 ? ' active' : ''}">${tab.label}</button>`
      })
      html += '</div></div>'
    }

    html += '</div>'

    // Contenu avec onglets
    html += '<div class="tooltip-content">'
    if (useTabs) {
      tabs.forEach((tab, i) => {
        html += `<div class="tab-content${i === 0 ? ' active' : ''}" data-tab-key="${tab.key}">${tab.content}</div>`
      })
    } else {
      // Un seul onglet : affichage direct du contenu (valeurs)
      html += tabs[0].content
    }

    html += '</div>'
    this._node.sankey.drawing_area.bypass_redraws = false
    return html
  }

  /**
   * Formate une valeur de total avec le même nombre de chiffres que les valeurs
   * de flux (config value_label d'un lien représentatif) — réplique fmtNum de
   * TooltipsLink. Sans lien de référence, repli sur la chaîne brute séparée.
   */
  private formatValue(n: number, sampleLink?: Class_LinkElement): string {
    const addSep = (s: string) => s.replace(/(?<!\..*)(\d)(?=(?:\d{3})+(?:\.|$))/g, '$1 ')
    if (!sampleLink) return addSep(String(n))
    const lv = getNameLabelValues(sampleLink, 'value_label')
    let v = n
    if (lv.unit_factor && lv.unit_factor > 1) {
      v = v / lv.unit_factor
    }
    let text: string
    if (lv.scientific_notation) {
      text = lv.significant_digits
        ? v.toExponential((lv.nb_significant_digits ?? 1) - 1)
        : v.toExponential()
    } else if (lv.significant_digits) {
      text = String(parseFloat(v.toPrecision(lv.nb_significant_digits ?? 3)))
      if (lv.custom_digit) text = String(parseFloat(parseFloat(text).toFixed(lv.nb_digit ?? 0)))
    } else if (lv.custom_digit) {
      text = String(parseFloat(v.toFixed(lv.nb_digit ?? 0)))
    } else {
      text = String(v)
    }
    return addSep(text)
  }

  private getValuesTabHTML(hasInputs: boolean, hasOutputs: boolean, input_val: number, output_val: number, t: TFunction): string {
    // Unité commune affichée une seule fois dans l'en-tête de la colonne
    // « Valeurs » plutôt que répétée sur chaque ligne.
    const sampleLink = this._node.input_links_list.filter(l => l.is_visible)[0]
      ?? this._node.output_links_list.filter(l => l.is_visible)[0]
    let unit = ''
    if (sampleLink) {
      const lv = getNameLabelValues(sampleLink, 'value_label')
      if (lv.unit_visible) unit = (lv.unit ?? '').toString().trim()
    }
    const valHeader = unit
      ? `${t('Noeud.drawing_area_tooltip.val')} (${unit})`
      : t('Noeud.drawing_area_tooltip.val')

    let html = '<table class="tooltip-table"><thead><tr>'
    html += `<th>${t('Noeud.drawing_area_tooltip.prov')} / ${t('Noeud.drawing_area_tooltip.dest')}</th>`
    html += `<th>${valHeader}</th>`
    html += `<th>${t('Noeud.drawing_area_tooltip.rat')}</th>`
    html += '</tr></thead><tbody>'

    const renderRow = (link: Class_LinkElement, totalVal: number, isInput: boolean) => {
      const nodeName = isInput ? link.source.name : link.target.name
      const ratio = totalVal > 0 ? Math.round(((link.valueCurrent ?? 0) / totalVal) * 100) + '%' : '-'
      let row = '<tr>'
      row += `<td>${nodeName}</td>`
      // Valeur sans unité : l'unité est déjà dans l'en-tête de colonne.
      row += `<td class="value">${this.formatValue(link.valueCurrent ?? 0, link)}</td>`
      row += `<td class="ratio">${ratio}</td>`
      row += '</tr>'
      return row
    }

    const renderTotalRow = (totalVal: number, sampleLink?: Class_LinkElement) => {
      const totalValStr = this.formatValue(totalVal, sampleLink)
      let row = '<tr class="total-row">'
      row += '<td>Total</td>'
      row += `<td class="value">${totalValStr}</td>`
      row += '<td></td>'
      row += '</tr>'
      return row
    }

    // Section Entrées
    if (hasInputs) {
      html += `<tr class="section-header"><td colspan="3">${t('Noeud.drawing_area_tooltip.prov')}</td></tr>`
      const inputLinks = this._node.input_links_list.filter(l => l.is_visible)
      inputLinks.forEach(l => {
        html += renderRow(l, input_val, true)
      })
      html += renderTotalRow(input_val, inputLinks[0])
    }

    // Section Sorties
    if (hasOutputs) {
      html += `<tr class="section-header"><td colspan="3">${t('Noeud.drawing_area_tooltip.dest')}</td></tr>`
      const outputLinks = this._node.output_links_list.filter(l => l.is_visible)
      outputLinks.forEach(l => {
        html += renderRow(l, output_val, false)
      })
      html += renderTotalRow(output_val, outputLinks[0])
    }

    html += '</tbody></table>'
    return html
  }

  private getTagsTabHTML(hasInputs: boolean, hasOutputs: boolean, input_val: number, output_val: number, t: TFunction): string {
    let html = '<table class="tooltip-table"><thead><tr>'
    html += `<th>${t('Noeud.drawing_area_tooltip.prov')} / ${t('Noeud.drawing_area_tooltip.dest')}</th>`

    this._node.sankey.flux_taggs_list.forEach(tagg => {
      html += `<th>${tagg.name}</th>`
    })
    html += '</tr></thead><tbody>'

    const renderTagRow = (link: Class_LinkElement, isInput: boolean) => {
      const nodeName = isInput ? link.source.name : link.target.name
      let row = '<tr>'
      row += `<td>${nodeName}</td>`

      this._node.sankey.flux_taggs_list.forEach(tagg => {
        const names: string[] = []
        link.flux_tags_list.forEach(tag => {
          if (tag.group === tagg) names.push(tag.display_name)
        })
        row += `<td>${names.join(', ') || '-'}</td>`
      })
      row += '</tr>'
      return row
    }

    // Section Entrées
    if (hasInputs) {
      const colCount = 1 + this._node.sankey.flux_taggs_list.length
      html += `<tr class="section-header"><td colspan="${colCount}">${t('Noeud.drawing_area_tooltip.prov')}</td></tr>`
      this._node.input_links_list.filter(l => l.is_visible).forEach(l => {
        html += renderTagRow(l, true)
      })
    }

    // Section Sorties
    if (hasOutputs) {
      const colCount = 1 + this._node.sankey.flux_taggs_list.length
      html += `<tr class="section-header"><td colspan="${colCount}">${t('Noeud.drawing_area_tooltip.dest')}</td></tr>`
      this._node.output_links_list.filter(l => l.is_visible).forEach(l => {
        html += renderTagRow(l, false)
      })
    }

    html += '</tbody></table>'
    return html
  }

  private getTabStyles(): string {
    return `
      .tab-container {
        margin-top: 8px;
      }
      .tab-buttons {
        display: flex;
        border-bottom: 2px solid #e0e0e0;
        background: #f9f9f9;
      }
      .tab-button {
        padding: 8px 16px;
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 11px;
        font-weight: 500;
        color: #666;
        border-bottom: 2px solid transparent;
        transition: all 0.2s ease;
        flex: 1;
        text-align: center;
       /* ✅ FORCER LA CLICABILITÉ */
        pointer-events: auto !important;
        z-index: 10001;
        position: relative;
      }
      .tab-button:hover {
        background: #f0f0f0;
        color: #333;
      }
      .tab-button.active {
        color: #4a9eff;
        border-bottom-color: #4a9eff;
        background: white;
        font-weight: 600;
      }
      .tab-content {
        display: none;
        padding-top: 12px;
      }
      .tab-content.active {
        display: block;
      }
      /* Conteneur du sankey unitaire embarqué : zone de dessin dimensionnée
         (la DA détachée recadre via areaAutoFit), redimensionnable avec le tooltip. */
      .unitary-tooltip-container {
        position: relative;
        width: 40vw;
        height: 50vh;
        min-width: 22rem;
        min-height: 16rem;
        background: white;
        overflow: hidden;
      }
    `
  }
}