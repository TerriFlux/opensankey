import * as d3 from 'd3'
import { Class_LinkElement } from './Link'
import { Class_NodeElement } from './Node'
import { Class_LinkValue } from './LinkValues'
import { Class_DataTag } from '../types/Tag'
import { TOOLTIP_STYLES, TooltipBehaviorManager } from './TooltipsCSS'
import { link_data_label } from '../types/Utils'
import { getNameLabelValues } from './ElementsAttributesConfig'

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
    // Combinaisons de dataTags (séries) du flux parent.
    const combos = this.getValueComboEntries(this._link)
    const has_series = combos.length > 1

    // Construction des onglets présents.
    const tabs: { label: string, html: string }[] = []
    tabs.push({ label: 'Flux', html: this.getMainTabHTML() })
    if (has_series) tabs.push({ label: 'Séries flux', html: this.getSeriesFluxHTML(combos) })
    if (has_children) tabs.push({ label: 'Données', html: this.getDataTabHTML(groups) })
    if (has_children && has_series) tabs.push({ label: 'Séries données', html: this.getSeriesDataHTML(groups, combos) })

    let html = '<style>' + TOOLTIP_STYLES + this.getTabStyles() + '</style>'

    // Header
    html += '<div class="tooltip-header">'
    html += '<button class="tooltip-close">&times;</button>'
    html += `<h4 class="tooltip-title">${this._link.source.name.split('\\n').join(' ')} → ${this._link.target.name.split('\\n').join(' ')}</h4>`

    if (this._link.tooltip_text) {
      html += `<p class="tooltip-subtitle">${this._link.tooltip_text.split('\n').join('<br>')}</p>`
    }

    if (tabs.length > 1) {
      html += '<div class="tab-container"><div class="tab-buttons">'
      tabs.forEach((t, i) => {
        html += `<button class="tab-button${i === 0 ? ' active' : ''}">${t.label}</button>`
      })
      html += '</div></div>'
    }
    html += '</div>'

    // Content
    html += '<div class="tooltip-content">'
    if (tabs.length > 1) {
      tabs.forEach((t, i) => {
        html += `<div class="tab-content${i === 0 ? ' active' : ''}">${t.html}</div>`
      })
    } else {
      html += tabs[0].html
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

    // Contexte dataTags courant (Année, région…)
    html += this.getDataTagContextRows()

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

    // Contexte dataTags courant en haut (valeur du flux parent + Année/région…)
    let html = ''
    const context_rows = this.getDataTagContextRows()
    if (context_rows) {
      html += '<table class="tooltip-table" style="margin-bottom:10px;">'
      html += `<tr><th>Valeur</th><td class="value">${this.formatLinkValue(this._link)}</td></tr>`
      html += context_rows
      html += '</table>'
    }

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

  /** Lignes <tr> du contexte dataTags courant : un groupe par ligne (tag(s) sélectionné(s)). */
  private getDataTagContextRows(): string {
    let html = ''
    this._link.drawing_area.sankey.data_taggs_list.forEach(tagg => {
      const sel = tagg.selected_tags_list.map(t => t.name).join(', ')
      html += `<tr><th>${tagg.name}</th><td>${sel || '-'}</td></tr>`
    })
    return html
  }

  /** Trie une combinaison de dataTags selon l'ordre des groupes du sankey. */
  private orderTags(tags: Class_DataTag[]): Class_DataTag[] {
    const order = this._link.drawing_area.sankey.data_taggs_list.map(g => g.id)
    return [...tags].sort((a, b) => order.indexOf(a.group.id) - order.indexOf(b.group.id))
  }

  /**
   * Combinaisons de dataTags d'un lien (séries) : pour chaque feuille de l'arbre
   * de valeurs, une entrée { clé stable, libellé "tag / tag", valeur }.
   * Vide si le lien n'a pas de dataTags (valeur unique).
   */
  private getValueComboEntries(link: Class_LinkElement): { key: string, label: string, value: Class_LinkValue }[] {
    const all = link.getAllValues()
    const entries: { key: string, label: string, value: Class_LinkValue }[] = []
    Object.values(all).forEach(([val, tags]) => {
      if (!tags || tags.length === 0) return
      const ordered = this.orderTags(tags as Class_DataTag[])
      entries.push({
        key: ordered.map(t => t.group.id + ':' + t.id).join('|'),
        label: ordered.map(t => t.name).join(' / '),
        value: val as Class_LinkValue
      })
    })
    return entries
  }

  /** Nombre affiché d'une valeur de lien selon le mode (data vs réconcilié). */
  private linkValueNumber(v: Class_LinkValue | null): number | null {
    if (!v) return null
    if (this._link.drawing_area.type_data === 'data') return v.valueData ?? null
    return v.valueResult ?? v.valueData ?? null
  }

  /**
   * Formate un nombre avec le même nombre de chiffres significatifs que la
   * valeur du flux (config value_label : significant_digits, scientific_notation,
   * custom_digit, unit_factor) — réplique l'étape de formatage de format_value,
   * SANS suffixe d'unité (l'unité est indiquée une fois au-dessus de la série).
   */
  private fmtNum(n: number | null): string {
    if (n === null || n === undefined) return '-'
    const lv = getNameLabelValues(this._link, 'value_label')
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
    return text.replace(/(?<!\..*)(\d)(?=(?:\d{3})+(?:\.|$))/g, '$1 ')
  }

  /** Libellé « Unité : X » à afficher au-dessus des séries (vide si pas d'unité visible). */
  private getSeriesUnitLabelHTML(): string {
    const lv = getNameLabelValues(this._link, 'value_label')
    if (!lv.unit_visible || !lv.unit) return ''
    return `<div class="series-unit">Unité : ${lv.unit}</div>`
  }

  /** Onglet Séries flux : valeur du flux par combinaison de dataTags (combinaisons en colonnes). */
  private getSeriesFluxHTML(combos: { key: string, label: string, value: Class_LinkValue }[]): string {
    let html = this.getSeriesUnitLabelHTML()
    html += '<table class="tooltip-table"><thead><tr>'
    combos.forEach(c => html += `<th class="value">${c.label}</th>`)
    html += '</tr></thead><tbody><tr>'
    combos.forEach(c => html += `<td class="value">${this.fmtNum(this.linkValueNumber(c.value))}</td>`)
    html += '</tr></tbody></table>'
    return html
  }

  /**
   * Onglet Séries données : un tableau par dimension ; flux enfants en lignes,
   * combinaisons de dataTags du flux parent en colonnes.
   */
  private getSeriesDataHTML(
    groups: { axisName: string, links: Class_LinkElement[] }[],
    combos: { key: string, label: string, value: Class_LinkValue }[]
  ): string {
    let html = this.getSeriesUnitLabelHTML()
    groups.forEach((group, gi) => {
      html += `<div class="data-axis"${gi > 0 ? ' style="margin-top:14px;"' : ''}>`
      html += `<div class="data-axis-title">${group.axisName}</div>`
      html += '<table class="tooltip-table"><thead><tr><th>Origine</th><th>Destination</th>'
      combos.forEach(c => html += `<th class="value">${c.label}</th>`)
      html += '</tr></thead><tbody>'
      group.links.forEach(l => {
        const childMap: { [key: string]: Class_LinkValue } = {}
        this.getValueComboEntries(l).forEach(e => { childMap[e.key] = e.value })
        html += '<tr>'
        html += `<td>${l.source.name.split('\\n').join(' ')}</td>`
        html += `<td>${l.target.name.split('\\n').join(' ')}</td>`
        combos.forEach(c => {
          html += `<td class="value">${this.fmtNum(this.linkValueNumber(childMap[c.key] ?? null))}</td>`
        })
        html += '</tr>'
      })
      html += '</tbody></table></div>'
    })
    return html
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
      .series-unit {
        font-size: 11px;
        font-weight: 600;
        color: #555;
        margin-bottom: 6px;
      }
    `
  }
}
