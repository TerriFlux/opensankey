import * as d3 from 'd3'
import { Class_NodeElement } from './Node'
import { Class_LinkElement } from './Link'
import { TOOLTIP_STYLES,TooltipBehaviorManager } from './TooltipsCSS'
import { TFunction } from 'i18next'



export class NodeTooltip {
  private _node: Class_NodeElement
  public behaviorManager?: TooltipBehaviorManager
  public mousePosition: { x: number; y: number } = { x: 0, y: 0 }

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
    d3.selectAll('.sankey-tooltip').remove()
    this._node.d3_selection?.classed('tooltip_shown', false)
  }

  public drawTooltip() {
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
        if (tabContents[index]) {
          tabContents[index].classList.add('active')
        }
      })
    })
  }

  private getTooltipHTML(): string {
    // Calculs des valeurs
    let input_val = 0
    let output_val = 0
    this._node.input_links_list.filter(l => l.is_visible).forEach(l => input_val += l.valueCurrent ?? 0)
    this._node.output_links_list.filter(l => l.is_visible).forEach(l => output_val += l.valueCurrent ?? 0)

    const t = this._node.drawing_area.application_data.t.bind(this._node.drawing_area.application_data)
    const hasInputs = this._node.hasInputLinks()
    const hasOutputs = this._node.hasOutputLinks()
    const hasTags = this._node.sankey.flux_taggs_list.length > 0

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

    // Onglets (seulement si on a des tags)
    if (hasTags) {
      html += '<div class="tab-container">'
      html += '<div class="tab-buttons">'
      html += `<button class="tab-button active">${t('Noeud.drawing_area_tooltip.values_tab') || 'Valeurs & Ratios'}</button>`
      html += `<button class="tab-button">${t('Noeud.drawing_area_tooltip.tags_tab') || 'Tags de flux'}</button>`
      html += '</div>'
      html += '</div>'
    }

    html += '</div>'

    // Contenu avec onglets
    html += '<div class="tooltip-content">'

    if (hasTags) {
      // Premier onglet : Valeurs et ratios
      html += '<div class="tab-content active">'
      html += this.getValuesTabHTML(hasInputs, hasOutputs, input_val, output_val, t)
      html += '</div>'

      // Deuxième onglet : Tags de flux
      html += '<div class="tab-content">'
      html += this.getTagsTabHTML(hasInputs, hasOutputs, input_val, output_val, t)
      html += '</div>'
    } else {
      // Pas d'onglets, affichage direct des valeurs
      html += this.getValuesTabHTML(hasInputs, hasOutputs, input_val, output_val, t)
    }

    html += '</div>'
    return html
  }

  private getValuesTabHTML(hasInputs: boolean, hasOutputs: boolean, input_val: number, output_val: number, t: TFunction): string {
    let html = '<table class="tooltip-table"><thead><tr>'
    html += `<th>${t('Noeud.drawing_area_tooltip.prov')} / ${t('Noeud.drawing_area_tooltip.dest')}</th>`
    html += `<th>${t('Noeud.drawing_area_tooltip.val')}</th>`
    html += `<th>${t('Noeud.drawing_area_tooltip.rat')}</th>`
    html += '</tr></thead><tbody>'

    const renderRow = (link: Class_LinkElement, totalVal: number, isInput: boolean) => {
      const nodeName = isInput ? link.source.name : link.target.name
      const ratio = totalVal > 0 ? Math.round(((link.valueCurrent ?? 0) / totalVal) * 100) + '%' : '-'
      let row = '<tr>'
      row += `<td>${nodeName}</td>`
      const data_label_visible = link.value_label_is_visible
      link.value_label_is_visible = true
      row += `<td class="value">${link.data_label}</td>`
      link.value_label_is_visible = data_label_visible
      row += `<td class="ratio">${ratio}</td>`
      row += '</tr>'
      return row
    }

    const renderTotalRow = (totalVal: number) => {
      const totalValStr = String(totalVal).replace(/(?<!\..*)(\d)(?=(?:\d{3})+(?:\.|$))/g, '$1 ')
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
      this._node.input_links_list.filter(l => l.is_visible).forEach(l => {
        html += renderRow(l, input_val, true)
      })
      html += renderTotalRow(input_val)
    }

    // Section Sorties
    if (hasOutputs) {
      html += `<tr class="section-header"><td colspan="3">${t('Noeud.drawing_area_tooltip.dest')}</td></tr>`
      this._node.output_links_list.filter(l => l.is_visible).forEach(l => {
        html += renderRow(l, output_val, false)
      })
      html += renderTotalRow(output_val)
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
          if (tag.group === tagg) names.push(tag.name)
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
    `
  }
}