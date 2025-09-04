import * as d3 from 'd3';
import { Class_NodeElement } from './Node';
import { Class_LinkElement } from './Link';
import { TOOLTIP_STYLES,TooltipBehaviorManager } from './TooltipsCSS';



export class NodeTooltip {
  private _node: Class_NodeElement;
  public behaviorManager?: TooltipBehaviorManager;
  public mousePosition: { x: number; y: number } = { x: 0, y: 0 }; // ✅ AJOUTÉ

  constructor(node: Class_NodeElement) {
    this._node = node;
  }

  public moveTooltip(event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>) {
    d3.selectAll('.sankey-tooltip')
      .style('top', event.pageY + 'px')
      .style('left', event.pageX + 'px');
  }

  public removeTooltip() {
    this.behaviorManager?.cleanup();
    d3.selectAll('.sankey-tooltip').remove();
    this._node.d3_selection?.classed('tooltip_shown', false);
  }

  public drawTooltip() {
    d3.selectAll('.sankey-tooltip').remove();

    // ✅ CORRECTION : Utiliser la position de la souris sauvegardée
    let x = this.mousePosition.x || this._node.position_x;
    let y = this.mousePosition.y || this._node.position_y;

    // Ajuster la position pour éviter de sortir de l'écran
    x = Math.min(x + 10, window.innerWidth - 650);
    y = Math.min(y + 10, window.innerHeight - 500);

    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'sankey-tooltip')
      .attr('tabindex', '0')
      .style('opacity', 0)
      .style('top', y + 'px')
      .style('left', x + 'px')
      .style('width', '600px') // Largeur spécifique pour NodeTooltip
      .html(this.getTooltipHTML());

    tooltip.transition()
      .duration(300)
      .style('opacity', 1)
      .on('end', () => {
        this.initTooltipBehavior();
      });
  }

  private initTooltipBehavior() {
    const tooltip = document.querySelector('.sankey-tooltip') as HTMLElement;
    if (!tooltip) return;

    this.behaviorManager = new TooltipBehaviorManager(tooltip, () => this.removeTooltip());
    this.behaviorManager.initialize();
  }

  private getTooltipHTML(): string {
    // Calculs des valeurs
    let input_val = 0;
    let output_val = 0;
    this._node.input_links_list.filter(l => l.is_visible).forEach(l => input_val += l.valueCurrent ?? 0);
    this._node.output_links_list.filter(l => l.is_visible).forEach(l => output_val += l.valueCurrent ?? 0);

    const t = this._node.drawing_area.application_data.t.bind(this._node.drawing_area.application_data);
    const hasInputs = this._node.hasInputLinks();
    const hasOutputs = this._node.hasOutputLinks();

    // Structure HTML
    let html = `<style>${TOOLTIP_STYLES}</style>`;

    // Header avec bouton de fermeture
    html += '<div class="tooltip-header">';
    html += '<button class="tooltip-close">&times;</button>';
    html += `<h4 class="tooltip-title">${this._node.name.split('\\n').join(' ')}</h4>`;
    if (this._node.tooltip_text) {
      html += `<p class="tooltip-subtitle">${this._node.tooltip_text.split('\n').join('<br>')}</p>`;
    }
    html += '</div>';

    // Contenu
    html += '<div class="tooltip-content">';

    const firstColLabel = `${t('Noeud.drawing_area_tooltip.prov')} / ${t('Noeud.drawing_area_tooltip.dest')}`;

    html += '<table class="tooltip-table"><thead><tr>';
    html += `<th>${firstColLabel}</th>`;
    html += `<th>${t('Noeud.drawing_area_tooltip.val')}</th>`;
    html += `<th>${t('Noeud.drawing_area_tooltip.rat')}</th>`;
    this._node.sankey.flux_taggs_list.forEach(tagg => {
      html += `<th>${tagg.name}</th>`;
    });
    html += '</tr></thead><tbody>';

    const colCount = 3 + this._node.sankey.flux_taggs_list.length;

    // Fonctions helpers
    const renderRow = (link: Class_LinkElement, totalVal: number, isInput: boolean) => {
      const nodeName = isInput ? link.source.name : link.target.name;
      const ratio = totalVal > 0 ? Math.round(((link.valueCurrent ?? 0) / totalVal) * 100) + '%' : '-';
      let row = '<tr>';
      row += `<td>${nodeName}</td>`;
      const  data_label_visible = link.value_label_is_visible
      link.value_label_is_visible = true
      row += `<td class="value">${link.data_label}</td>`;
       link.value_label_is_visible = data_label_visible
      row += `<td class="ratio">${ratio}</td>`;
      this._node.sankey.flux_taggs_list.forEach(tagg => {
        const names: string[] = [];
        link.flux_tags_list.forEach(tag => {
          if (tag.group === tagg) names.push(tag.name);
        });
        row += `<td>${names.join(', ')}</td>`;
      });
      row += '</tr>';
      return row;
    };

    const renderTotalRow = (totalVal: number) => {
      const totalValStr = String(totalVal).replace(/(?<!\..*)(\d)(?=(?:\d{3})+(?:\.|$))/g, '$1 ');
      let row = '<tr class="total-row">';
      row += `<td>Total</td>`;
      row += `<td class="value">${totalValStr}</td>`;
      row += `<td></td>`;
      for (let i = 0; i < this._node.sankey.flux_taggs_list.length; i++) row += '<td></td>';
      row += '</tr>';
      return row;
    };

    // Section Entrées
    if (hasInputs) {
      html += `<tr class="section-header"><td colspan="${colCount}">${t('Noeud.drawing_area_tooltip.prov')}</td></tr>`;
      this._node.input_links_list.filter(l => l.is_visible).forEach(l => {
        html += renderRow(l, input_val, true);
      });
      html += renderTotalRow(input_val);
    }

    // Section Sorties
    if (hasOutputs) {
      html += `<tr class="section-header"><td colspan="${colCount}">${t('Noeud.drawing_area_tooltip.dest')}</td></tr>`;
      this._node.output_links_list.filter(l => l.is_visible).forEach(l => {
        html += renderRow(l, output_val, false);
      });
      html += renderTotalRow(output_val);
    }

    html += '</tbody></table></div>';
    return html;
  }
}