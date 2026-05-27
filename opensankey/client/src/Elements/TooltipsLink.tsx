import * as d3 from 'd3'
import { Class_LinkElement } from './Link'
import { Class_NodeElement } from './Node'
import { TOOLTIP_STYLES, TooltipBehaviorManager } from './TooltipsCSS'
import { link_data_label } from '../types/Utils'

export class LinkTooltip {

  private _link: Class_LinkElement
  public behaviorManager?: TooltipBehaviorManager
  // ✅ AJOUT : Propriété pour stocker la position de la souris
  public mousePosition: { x: number; y: number } = { x: 0, y: 0 }

  constructor(link: Class_LinkElement) {
    this._link = link
  }

  private initTooltipBehavior() {
    const tooltip = document.querySelector('.sankey-tooltip') as HTMLElement
    if (!tooltip) return

    this.behaviorManager = new TooltipBehaviorManager(tooltip, () => this.removeTooltip())
    this.behaviorManager.initialize()
  }

  public drawTooltip() {
    // Clean previous tooltips
    d3.selectAll('.sankey-tooltip').remove()

    // Position initiale = souris (ou milieu source/target en fallback)
    let x, y
    if (this.mousePosition.x && this.mousePosition.y) {
      x = this.mousePosition.x + 10
      y = this.mousePosition.y + 10
    } else {
      x = (this._link.source.position_x + this._link.target.position_x) / 2
      y = (this._link.source.position_y + this._link.target.position_y) / 2
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

    // Recaler dans le viewport selon la hauteur/largeur réelles : le tooltip à
    // onglets peut être haut (header + ~400px de contenu) et déborder sous l'écran.
    const node = tooltip.node() as HTMLElement
    if (node) {
      const margin = 10
      const rect = node.getBoundingClientRect()
      if (y + rect.height > window.innerHeight - margin) {
        y = Math.max(margin, window.innerHeight - rect.height - margin)
      }
      if (x + rect.width > window.innerWidth - margin) {
        x = Math.max(margin, window.innerWidth - rect.width - margin)
      }
      node.style.top = y + 'px'
      node.style.left = x + 'px'
    }

    // Animation d'apparition
    tooltip.transition()
      .duration(300)
      .style('opacity', 1)
      .on('end', () => {
        this.initTooltipBehavior()
        this.setupTabBehavior()
      })
  }

  public moveTooltip() {
  }

  public removeTooltip() {
    this.behaviorManager?.cleanup()
    d3.selectAll('.sankey-tooltip').remove()
  }

  private setupTabBehavior() {
    const tabButtons = document.querySelectorAll('.tab-button')
    const tabContents = document.querySelectorAll('.tab-content')

    tabButtons.forEach((button, index) => {
      button.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()

        tabButtons.forEach(btn => btn.classList.remove('active'))
        tabContents.forEach(content => content.classList.remove('active'))

        button.classList.add('active')
        if (tabContents[index]) {
          tabContents[index].classList.add('active')
        }
      })
    })
  }

  private getTooltipHTML(): string {
    // Flux enfants groupés par dimension (axe d'agrégation). Les dimensions
    // sont antagonistes : par essences, par propriétés… → un tableau par axe.
    const groups = this.getChildLinkGroups()
    const has_children = groups.length > 0

    let html = '<style>' + TOOLTIP_STYLES + this.getTabStyles() + '</style>'

    // Header
    html += '<div class="tooltip-header">'
    html += '<button class="tooltip-close">&times;</button>'
    html += `<h4 class="tooltip-title">${this._link.source.name.split('\\n').join(' ')} → ${this._link.target.name.split('\\n').join(' ')}</h4>`

    if (this._link.tooltip_text) {
      html += `<p class="tooltip-subtitle">${this._link.tooltip_text.split('\n').join('<br>')}</p>`
    }

    // Onglets (seulement si on a des flux enfants avec des données)
    if (has_children) {
      html += '<div class="tab-container">'
      html += '<div class="tab-buttons">'
      html += '<button class="tab-button active">Flux</button>'
      html += '<button class="tab-button">Données</button>'
      html += '</div>'
      html += '</div>'
    }
    html += '</div>'

    // Content
    html += '<div class="tooltip-content">'
    if (has_children) {
      html += '<div class="tab-content active">'
      html += this.getMainTabHTML()
      html += '</div>'
      html += '<div class="tab-content">'
      html += this.getDataTabHTML(groups)
      html += '</div>'
    } else {
      html += this.getMainTabHTML()
    }
    html += '</div>'

    return html
  }

  /** Onglet principal : valeur du lien, donnée, tags de flux (contenu historique). */
  private getMainTabHTML(): string {
    let html = '<table class="tooltip-table">'

    const data_label_visible = this._link.value_label_is_visible
    this._link.value_label_is_visible = true
    // Valeur du lien
    html += '<tr>'
    html += '<th>Valeur</th>'
    const tmp = this._link.value_label_unit_type
    this._link.value_label_unit_type = 'unit_name'
    html += `<td>${link_data_label('free_value', this._link, 'value_label')}</td>`
    this._link.value_label_unit_type = tmp
    html += '</tr>'

    if (this._link.value?.valueData !== null && this._link.value?.valueResult !== null) {
      html += '<tr>'
      html += `<th>${this._link.drawing_area.application_data.t('Noeud.drawing_area_tooltip.data_value')}</th>`
      html += `<td>${link_data_label('data', this._link, 'value_label')}</td>`
      html += '</tr>'
    }
    this._link.value_label_is_visible = data_label_visible

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

    html += '</table>'
    return html
  }

  /**
   * Onglet Données : un tableau par dimension (axe d'agrégation). Chaque tableau
   * liste les flux enfants feuille→feuille de cet axe avec valeur et ratio.
   */
  private getDataTabHTML(groups: { axisName: string, links: Class_LinkElement[] }[]): string {
    const parent_total = this._link.valueCurrent

    let html = ''
    groups.forEach((group, gi) => {
      html += `<div class="data-axis"${gi > 0 ? ' style="margin-top:14px;"' : ''}>`
      html += `<div class="data-axis-title">${group.axisName}</div>`
      html += '<table class="tooltip-table"><thead><tr>'
      html += '<th>Origine</th>'
      html += '<th>Destination</th>'
      html += '<th class="value">Valeur</th>'
      html += '<th class="ratio">Ratio</th>'
      html += '</tr></thead><tbody>'

      const sorted = [...group.links].sort(
        (a, b) => (b.valueCurrent ?? 0) - (a.valueCurrent ?? 0)
      )
      sorted.forEach(l => {
        const ratio = (parent_total && parent_total > 0 && l.valueCurrent != null)
          ? Math.round((l.valueCurrent / parent_total) * 100) + '%'
          : '-'
        html += '<tr>'
        html += `<td>${l.source.name.split('\\n').join(' ')}</td>`
        html += `<td>${l.target.name.split('\\n').join(' ')}</td>`
        html += `<td class="value">${this.formatLinkValue(l)}</td>`
        html += `<td class="ratio">${ratio}</td>`
        html += '</tr>'
      })

      html += '</tbody></table>'
      html += '</div>'
    })
    return html
  }

  /** Formate la valeur d'un lien comme dans l'onglet principal (unité nommée). */
  private formatLinkValue(link: Class_LinkElement): string {
    const data_label_visible = link.value_label_is_visible
    link.value_label_is_visible = true
    const tmp = link.value_label_unit_type
    link.value_label_unit_type = 'unit_name'
    const label = link_data_label('free_value', link, 'value_label')
    link.value_label_unit_type = tmp
    link.value_label_is_visible = data_label_visible
    return label
  }

  /**
   * Collecte les flux enfants groupés par dimension (axe d'agrégation).
   *
   * Les dimensions d'un nœud sont antagonistes (ex. par essences vs par
   * propriétés) : chacune est une partition différente du même nœud. On produit
   * donc un groupe par axe présent comme parent sur la source OU la target. Pour
   * chaque axe, on descend récursivement jusqu'aux feuilles EN NE SUIVANT QUE les
   * dimensions de cet axe, puis on collecte les flux feuille→feuille (avec donnée).
   * Un axe n'est gardé que s'il désagrège au moins un côté et a au moins un flux.
   */
  private getChildLinkGroups(): { axisName: string, links: Class_LinkElement[] }[] {
    const source = this._link.source
    const target = this._link.target

    // Ensemble des axes (id de groupe de level tags) présents comme parent.
    const axis_ids: string[] = []
    const add_axes = (node: Class_NodeElement) => {
      node.dimensions_as_parent.forEach(dim => {
        if (!axis_ids.includes(dim.id)) axis_ids.push(dim.id)
      })
    }
    add_axes(source)
    add_axes(target)

    const level_taggs = this._link.drawing_area.sankey.level_taggs_dict
    const groups: { axisName: string, links: Class_LinkElement[] }[] = []

    axis_ids.forEach(axis_id => {
      const source_leaves = this.collectLeafNodesInAxis(source, axis_id, new Set<string>())
      const target_leaves = this.collectLeafNodesInAxis(target, axis_id, new Set<string>())

      const source_disagg = !(source_leaves.length === 1 && source_leaves[0] === source)
      const target_disagg = !(target_leaves.length === 1 && target_leaves[0] === target)
      if (!source_disagg && !target_disagg) return // cet axe ne désagrège pas ce flux

      const links = this.collectLinksBetween(source_leaves, target_leaves)
      if (links.length === 0) return

      const axisName = level_taggs[axis_id]?.name ?? axis_id
      groups.push({ axisName, links })
    })

    return groups
  }

  /**
   * Descend récursivement jusqu'aux feuilles en ne suivant que les dimensions
   * de l'axe donné (même id de groupe de level tags). Une feuille = nœud sans
   * dimension parente sur cet axe.
   */
  private collectLeafNodesInAxis(node: Class_NodeElement, axis_id: string, visited: Set<string>): Class_NodeElement[] {
    if (visited.has(node.id)) return []
    visited.add(node.id)

    const dim = node.dimensions_as_parent.find(d => d.id === axis_id)
    const children = dim ? dim.children : []
    if (children.length === 0) return [node]

    const leaves: Class_NodeElement[] = []
    children.forEach(c => {
      this.collectLeafNodesInAxis(c, axis_id, visited).forEach(l => leaves.push(l))
    })
    return leaves.length > 0 ? leaves : [node]
  }

  /** Flux (avec donnée) reliant les feuilles source aux feuilles target, hors flux courant. */
  private collectLinksBetween(source_leaves: Class_NodeElement[], target_leaves: Class_NodeElement[]): Class_LinkElement[] {
    const target_ids = new Set(target_leaves.map(n => n.id))
    const seen = new Set<string>()
    const links: Class_LinkElement[] = []
    source_leaves.forEach(ls => {
      ls.output_links_list.forEach(l => {
        if (l === this._link) return
        if (l.valueCurrent === null || l.valueCurrent === undefined) return
        if (target_ids.has(l.target.id) && !seen.has(l.id)) {
          seen.add(l.id)
          links.push(l)
        }
      })
    })
    return links
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
      .data-axis-title {
        font-size: 12px;
        font-weight: 600;
        color: #333;
        padding: 4px 8px;
        margin-bottom: 4px;
        background: linear-gradient(90deg, #f0f8ff 0%, #e6f3ff 100%);
        border-left: 3px solid #4a9eff;
      }
    `
  }
}
