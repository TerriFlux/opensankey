// ==================================================================================================
// OS#305 — FOURNISSEUR DE CONTENU (ex-info-bulle).
// ==================================================================================================
// Cette classe ne dessine plus rien : le MÉCANISME d'info-bulle hérité (overlay
// propre, positionnement, barre d'onglets, gestionnaire d'événements) a été
// retiré, car il doublait les panneaux unifiés (#300). Ne subsiste que ce qui a
// de la valeur : les constructeurs de CONTENU, de simples fonctions
// données -> HTML, exposés par `getBlockHTML(block_id)` et consommés comme blocs
// de présentation (#305).
// ==================================================================================================

import { Class_NodeElement } from './Node'
import { Class_LinkElement } from './Link'
import { getNameLabelValues } from './ElementsAttributesConfig'
import { formatElementValue } from './ValueFormatting'
import { escapeHtml } from './htmlEscape'
import { TFunction } from 'i18next'

export class NodeTooltip {
  private _node: Class_NodeElement

  constructor(node: Class_NodeElement) {
    this._node = node
  }

  private formatValue(n: number, sampleLink?: Class_LinkElement): string {
    // OS#305 — règle extraite dans ValueFormatting (elle était dupliquée ici et
    // dans TooltipsLink, et les blocs de présentation en auraient fait une 3ᵉ copie).
    return formatElementValue(n, sampleLink)
  }

  /**
   * OS#305 — Contenu d'un BLOC de présentation, en HTML. Les constructeurs
   * ci-dessous sont de simples fonctions données -> HTML : le chantier #305
   * retire le MÉCANISME d'info-bulle hérité (overlay, positionnement, barre
   * d'onglets, gestionnaire d'événements), qui double désormais les panneaux
   * unifiés, mais RÉUTILISE ce contenu tel quel — contenu identique, aucune
   * régression. Rend `null` quand le bloc n'a rien à montrer.
   */
  public getBlockHTML(block_id: string): string | null {
    const app_data = this._node.drawing_area.application_data
    const t = app_data.t.bind(app_data) as TFunction
    let input_val = 0
    let output_val = 0
    this._node.input_links_list.filter(l => l.is_visible).forEach(l => input_val += l.valueCurrent ?? 0)
    this._node.output_links_list.filter(l => l.is_visible).forEach(l => output_val += l.valueCurrent ?? 0)
    const hasInputs = this._node.hasInputLinks()
    const hasOutputs = this._node.hasOutputLinks()
    if (!hasInputs && !hasOutputs) return null
    switch (block_id) {
    case 'values':
      return this.getValuesTabHTML(hasInputs, hasOutputs, input_val, output_val, t)
    case 'tags':
      return this._node.sankey.flux_taggs_list.length > 0
        ? this.getTagsTabHTML(hasInputs, hasOutputs, input_val, output_val, t)
        : null
    default:
      return null
    }
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
          ? (sampleLink.sankey.units.resolve(lv.unit)?.unit.label ?? '')
          : (lv.unit ?? '').toString().trim()
      }
    }
    const valHeader = unit
      ? `${t('Noeud.drawing_area_tooltip.val')} (${escapeHtml(unit)})`
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
      row += `<td>${escapeHtml(nodeName)}</td>`
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
      html += `<th>${escapeHtml(tagg.name)}</th>`
    })
    html += '</tr></thead><tbody>'

    const renderTagRow = (link: Class_LinkElement, isInput: boolean) => {
      const nodeName = isInput ? link.source.name : link.target.name
      let row = '<tr>'
      row += `<td>${escapeHtml(nodeName)}</td>`

      this._node.sankey.flux_taggs_list.forEach(tagg => {
        const names: string[] = []
        link.flux_tags_list.forEach(tag => {
          if (tag.group === tagg) names.push(tag.display_name)
        })
        row += `<td>${escapeHtml(names.join(', ')) || '-'}</td>`
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

}
