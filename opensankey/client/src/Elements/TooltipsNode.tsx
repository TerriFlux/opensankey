import * as d3 from '../d3Modules'
import { Class_NodeElement } from './Node'
import { Class_LinkElement } from './Link'
import { TOOLTIP_STYLES, TooltipBehaviorManager } from './TooltipsCSS'
import { getNameLabelValues } from './ElementsAttributesConfig'
import { Type_AnalysisDescriptor } from '../Charts/AnalysisDescriptor'
import { isTooltipBlockVisible, Type_TooltipHiddenBlocks } from './TooltipBlocks'
import { TFunction } from 'i18next'

// Conteneur DOM (id fixe) de la zone de dessin du sankey unitaire embarqué dans
// l'onglet du tooltip. Un seul tooltip à la fois → id unique suffisant.
const UNITARY_TOOLTIP_CONTAINER_ID = 'unitary_tooltip_sankey_container'
// Conteneur (id fixe) de l'onglet « Analyse » (OS#1278) — graphique couronne /
// histogramme décrit par analysis_descriptor. Un seul tooltip à la fois.
const ANALYSIS_TOOLTIP_CONTAINER_ID = 'analysis_tooltip_chart_container'


export class NodeTooltip {
  private _node: Class_NodeElement
  public behaviorManager?: TooltipBehaviorManager
  public mousePosition: { x: number; y: number } = { x: 0, y: 0 }

  // Onglet « Sankey unitaire » : handle de dessin (fourni par le hook OS+) et
  // observer de redimensionnement. Dessin paresseux à la 1re activation.
  private _unitaryHandle?: { redraw: () => void, cleanup: () => void }
  private _unitaryResizeObserver?: ResizeObserver
  private _unitaryDrawn = false

  // Onglet « Analyse » (OS#1278) : même patron paresseux que l'unitaire.
  private _analysisHandle?: { redraw: () => void, cleanup: () => void }
  private _analysisResizeObserver?: ResizeObserver
  private _analysisDrawn = false

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
    this.cleanupAnalysis()
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

  /** Détruit le graphique d'analyse embarqué (observer + conteneur) s'il existe. */
  private cleanupAnalysis() {
    this._analysisResizeObserver?.disconnect()
    this._analysisResizeObserver = undefined
    this._analysisHandle?.cleanup()
    this._analysisHandle = undefined
    this._analysisDrawn = false
  }

  public drawTooltip() {
    this.cleanupUnitary()
    this.cleanupAnalysis()
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
          const key = content.getAttribute('data-tab-key')
          if (key === 'unitary') {
            this.drawUnitaryTab()
          } else if (key === 'analysis') {
            this.drawAnalysisTab()
          }
        }
      })
    })
  }

  /**
   * Dessine (une seule fois) le graphique d'analyse dans le conteneur de l'onglet,
   * via le hook OS+ (draw_analysis_in_container). Observe le redimensionnement pour
   * recadrer. Pas d'épingle : le graphique est statique (pas d'interaction lourde).
   */
  private drawAnalysisTab() {
    if (this._analysisDrawn) return
    const hook = this._node.drawing_area.application_data.draw_analysis_in_container
    if (typeof hook !== 'function') return
    const container = document.getElementById(ANALYSIS_TOOLTIP_CONTAINER_ID)
    if (!container) return
    this._analysisDrawn = true

    const handle = hook(this._node, '#' + ANALYSIS_TOOLTIP_CONTAINER_ID)
    if (handle) this._analysisHandle = handle

    // Recadrage au redimensionnement du tooltip (poignée resize CSS).
    if (typeof ResizeObserver !== 'undefined') {
      let raf = 0
      let first = true
      this._analysisResizeObserver = new ResizeObserver(() => {
        if (first) { first = false; return }
        if (raf) cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => this._analysisHandle?.redraw())
      })
      this._analysisResizeObserver.observe(container)
    }
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
      // Taille par défaut explicite à la 1re ouverture de l'onglet unitaire : le
      // conteneur de dessin est désormais flex (remplit le tooltip), donc la chaîne
      // flex a besoin d'une hauteur définie sinon elle s'effondre aux tailles mini.
      // On ne touche pas si l'utilisateur a déjà redimensionné (style inline posé).
      if (!tooltip.style.width) tooltip.style.width = '40vw'
      if (!tooltip.style.height) tooltip.style.height = '60vh'
    }

    try {
      const handle = hook(this._node, '#' + UNITARY_TOOLTIP_CONTAINER_ID)
      if (handle) this._unitaryHandle = handle
    } catch (e) {
      console.error('[unitary-tooltip] dessin du sankey unitaire échoué:', e)
      this._unitaryDrawn = false
      return
    }

    // Autofit fiable à l'ouverture : le 1er dessin (hook ci-dessus) a lieu alors que
    // l'onglet vient de passer visible et que la taille du tooltip vient d'être posée,
    // donc le conteneur n'est pas toujours mesuré à sa taille finale → areaAutoFit
    // cadre sur une taille périmée. On reprogramme un redraw une fois le layout
    // appliqué (double rAF) pour que l'unitaire rentre dans la taille du tooltip.
    requestAnimationFrame(() => requestAnimationFrame(() => this._unitaryHandle?.redraw()))

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
    return this._node.sankey.drawing_area.withBypassRedraws(() => {
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
      // Onglet analyse (OS#1278) : hook OS+ présent ET le nœud publie un graphique
      // d'analyse dans l'info-bulle (surfaces.tooltip du descripteur résolu).
      const analysis_descriptor = this._node.getElementProperty('analysis_descriptor') as Type_AnalysisDescriptor | undefined
      const hasAnalysis = typeof app_data.draw_analysis_in_container === 'function'
        && !!analysis_descriptor?.surfaces?.tooltip
        && (!!analysis_descriptor.decompose || !!analysis_descriptor.compare)

      // OS#1285 — visibilité configurable des blocs (attribut de style résolu).
      const hidden_blocks = this._node.getElementProperty('tooltip_hidden_blocks') as Type_TooltipHiddenBlocks | undefined
      const vis = (id: string) => isTooltipBlockVisible(hidden_blocks, id)

      // Définition des onglets disponibles (clé, libellé, contenu HTML).
      const tabs: { key: string, label: string, content: string }[] = []
      if (vis('values')) {
        tabs.push({
          key: 'values',
          label: t('Noeud.drawing_area_tooltip.values_tab') || 'Valeurs & Ratios',
          content: this.getValuesTabHTML(hasInputs, hasOutputs, input_val, output_val, t)
        })
      }
      if (hasTags && vis('tags')) {
        tabs.push({
          key: 'tags',
          label: t('Noeud.drawing_area_tooltip.tags_tab') || 'Tags de flux',
          content: this.getTagsTabHTML(hasInputs, hasOutputs, input_val, output_val, t)
        })
      }
      if (hasUnitary && vis('unitary')) {
        tabs.push({
          key: 'unitary',
          label: t('Noeud.drawing_area_tooltip.unitary_tab') || 'Sankey unitaire',
          // Conteneur vide : OS+ y dessine la DA unitaire à l'activation de l'onglet.
          content: `<div class="unitary-tooltip-container" id="${UNITARY_TOOLTIP_CONTAINER_ID}"></div>`
        })
      }
      if (hasAnalysis && vis('analysis')) {
        tabs.push({
          key: 'analysis',
          label: t('Noeud.drawing_area_tooltip.analysis_tab') || 'Analyse',
          // Conteneur vide : OS+ y dessine le graphique d'analyse à l'activation.
          content: `<div class="analysis-tooltip-container" id="${ANALYSIS_TOOLTIP_CONTAINER_ID}"></div>`
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
      } else if (tabs.length === 1) {
        // Un seul onglet : affichage direct du contenu. (0 onglet = tout masqué
        // par la config OS#1285 → header/titre seuls.)
        html += tabs[0].content
      }

      html += '</div>'
      return html
    }, false)
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
    // OS#1286 — en mode unit_model le facteur est le coefficient de l'unité du registre.
    const model = lv.unit_type === 'unit_model' ? sampleLink.sankey.units.resolve(lv.unit) : undefined
    if (model) {
      if (model.unit.coefficient !== 0) v = v / model.unit.coefficient
    } else if (lv.unit_factor && lv.unit_factor > 1) {
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
      if (lv.unit_visible) {
        // OS#1286 — en mode unit_model, `unit` porte un id : symbole résolu.
        unit = lv.unit_type === 'unit_model'
          ? (sampleLink.sankey.units.resolve(lv.unit)?.unit.name ?? '')
          : (lv.unit ?? '').toString().trim()
      }
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

    // OS#1272 — Section « Bilan » : entrée / sortie / différence. Toujours affichée
    // quand le nœud a des flux des deux côtés (indépendante de l'activation du
    // marqueur). Signale l'état si le marqueur est actif (⚠ déséquilibré / ✓ ok).
    if (hasInputs && hasOutputs) {
      const bal = this._node.getFluxBalance()
      const sampleLink = this._node.input_links_list.filter(l => l.is_visible)[0]
        ?? this._node.output_links_list.filter(l => l.is_visible)[0]
      const status = this._node.balance_status
      html += `<tr class="section-header"><td colspan="3">${t('Noeud.drawing_area_tooltip.balance') || 'Bilan'}</td></tr>`
      html += `<tr><td>${t('Noeud.drawing_area_tooltip.prov') || 'Entrées'}</td><td class="value">${this.formatValue(bal.input, sampleLink)}</td><td></td></tr>`
      html += `<tr><td>${t('Noeud.drawing_area_tooltip.dest') || 'Sorties'}</td><td class="value">${this.formatValue(bal.output, sampleLink)}</td><td></td></tr>`
      let statusCell = ''
      if (status) {
        statusCell = status.violated
          ? `⚠ ${t('Noeud.drawing_area_tooltip.balance_ko') || 'Déséquilibré'}`
          : `✓ ${t('Noeud.drawing_area_tooltip.balance_ok') || 'Équilibré'}`
      }
      html += `<tr class="total-row"><td>${t('Noeud.drawing_area_tooltip.balance_diff') || 'Différence (E − S)'}</td><td class="value">${this.formatValue(bal.diff, sampleLink)}</td><td>${statusCell}</td></tr>`
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
      /* Onglet unitaire : la zone de dessin doit REMPLIR le tooltip pour suivre
         son redimensionnement (poignée resize CSS). On rend le panneau d'onglet
         flex-colonne pleine hauteur ; le conteneur de dessin prend tout l'espace. */
      .tab-content[data-tab-key="unitary"].active {
        display: flex;
        flex-direction: column;
        height: 100%;
        box-sizing: border-box;
      }
      /* Conteneur du sankey unitaire embarqué : zone de dessin qui remplit le
         panneau (la DA détachée recadre via areaAutoFit). En suivant la taille du
         tooltip, son redimensionnement déclenche le ResizeObserver → redraw. */
      .unitary-tooltip-container {
        position: relative;
        flex: 1 1 auto;
        width: 100%;
        /* min-width/height à 0 : le conteneur doit pouvoir RÉTRÉCIR avec le tooltip
           (le diagramme se remet à l'échelle pour rentrer). Un min non nul figeait sa
           taille quand on réduisait le tooltip → débordement tronqué + ResizeObserver
           qui ne se redéclenchait plus (taille du conteneur gelée au min). */
        min-width: 0;
        min-height: 0;
        background: white;
        overflow: hidden;
      }
      /* Aperçu auto-fit : pas de pan/zoom attendu. Les scrollbars internes de la
         DA (dessinées quand la bbox AVEC labels dépasse le viewport, alors que le
         fit cadre sur les formes seules) ne sont que du bruit visuel ici. */
      .unitary-tooltip-container .scrollbar {
        display: none !important;
      }
      /* Onglet analyse (OS#1278) : même stratégie flex pleine hauteur que l'unitaire
         pour que le graphique suive le redimensionnement du tooltip. */
      .tab-content[data-tab-key="analysis"].active {
        display: flex;
        flex-direction: column;
        height: 100%;
        box-sizing: border-box;
      }
      .analysis-tooltip-container {
        position: relative;
        flex: 1 1 auto;
        width: 100%;
        min-width: 0;
        /* Hauteur mini pour que la couronne/l'histogramme aient la place de se
           dessiner même dans un tooltip non redimensionné. */
        min-height: 220px;
        background: white;
        overflow: hidden;
      }
    `
  }
}