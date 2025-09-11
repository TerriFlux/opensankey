import * as d3 from 'd3'
import { Class_LinkElement } from './Link'
import { TOOLTIP_STYLES, TooltipBehaviorManager } from './TooltipsCSS'

export class LinkTooltip {

  private _link: Class_LinkElement;
  public behaviorManager?: TooltipBehaviorManager;
    // ✅ AJOUT : Propriété pour stocker la position de la souris
  public mousePosition: { x: number; y: number } = { x: 0, y: 0 };

  constructor(link: Class_LinkElement) {
    this._link = link
  }

  private initTooltipBehavior() {
    const tooltip = document.querySelector('.sankey-tooltip') as HTMLElement;
    if (!tooltip) return;

    this.behaviorManager = new TooltipBehaviorManager(tooltip, () => this.removeTooltip());
    this.behaviorManager.initialize();
  }

  public drawTooltip() {
    // Clean previous tooltips
    d3.selectAll('.sankey-tooltip').remove()

    // ✅ CHANGEMENT : Utiliser la position de la souris sauvegardée
    let x, y;
    
    if (this.mousePosition.x && this.mousePosition.y) {
      // Utiliser la position de la souris si elle est définie
      x = Math.min(this.mousePosition.x + 10, window.innerWidth - 400);
      y = Math.min(this.mousePosition.y + 10, window.innerHeight - 300);
    } else {
      // Fallback sur la position entre source et target
      x = Math.min((this._link.source.position_x + this._link.target.position_x) / 2, window.innerWidth - 400);
      y = Math.min((this._link.source.position_y + this._link.target.position_y) / 2, window.innerHeight - 300);
    }

    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'sankey-tooltip')
      .attr('tabindex', '0')
      .style('opacity', 0)
      .style('top', y + 'px')
      .style('left', x + 'px')
      //.style('width', '400px') // Plus étroit que NodeTooltip
      .html(this.getTooltipHTML())

    // Animation d'apparition
    tooltip.transition()
      .duration(300)
      .style('opacity', 1)
      .on('end', () => {
        this.initTooltipBehavior()
      })
  }

  public moveTooltip(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
  }

  public removeTooltip() {
      this.behaviorManager?.cleanup();
    d3.selectAll('.sankey-tooltip').remove()
  }

  private getTooltipHTML(): string {
    let html = '<style>'+TOOLTIP_STYLES + '</style>'

    // Header
    html += '<div class="tooltip-header">'
    html += '<button class="tooltip-close">&times;</button>'
    html += `<h4 class="tooltip-title">${this._link.source.name.split('\\n').join(' ')} → ${this._link.target.name.split('\\n').join(' ')}</h4>`
    
    if (this._link.tooltip_text) {
      html += `<p class="tooltip-subtitle">${this._link.tooltip_text.split('\n').join('<br>')}</p>`
    }
    html += '</div>'

    // Content
    html += '<div class="tooltip-content">'
    html += '<table class="tooltip-table">'
    
    const data_label_visible = this._link.value_label_is_visible
    this._link.value_label_is_visible = true
    // Valeur du lien
    const prev_type = this._link.drawing_area.type_data
    this._link.drawing_area.type_data = 'reconciled'
    html += '<tr>'
    html += `<th>${this._link.drawing_area.application_data.t('Noeud.drawing_area_tooltip.result_value')}</th>`
    html += `<td>${this._link.data_label}</td>`
    html += '</tr>'

    if (this._link.value?.valueData !== null && this._link.value?.valueResult !== null) {
      this._link.drawing_area.type_data = 'data'
      html += '<tr>'
      html += `<th>${this._link.drawing_area.application_data.t('Noeud.drawing_area_tooltip.data_value')}</th>`
      html += `<td>${this._link.data_label}</td>`
      html += '</tr>'
    }
    this._link.value_label_is_visible = data_label_visible
    
    this._link.drawing_area.type_data = prev_type
    // Tags de flux
    this._link.flux_taggs_list.forEach(tagg => {
      const tagNames = this._link.flux_tags_list
        .filter(tag => tag.group === tagg)
        .map(tag => tag.name)
        .join(', ')

      html += '<tr>'
      html += `<th>${tagg.name}</th>`
      html += `<td>${tagNames || '-'}</td>`
      html += '</tr>'
    })

    html += '</table></div>'
    return html
  }
}