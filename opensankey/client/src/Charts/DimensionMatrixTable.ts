// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1519 — LE DESSIN DU TABLEAU CROISÉ : un <table> HTML, rien de plus. Pas de SVG : un tableau se
// lit, se sélectionne, se copie et se parcourt au clavier comme un tableau.
//
// Lecture d'abord : chiffres alignés à droite en chiffres tabulaires, unité dans l'en-tête et non
// dans chaque cellule, un sous-total en gras au-dessus de ses enfants, le « non réparti » en
// italique, la ligne et la colonne Total séparées d'un trait. Encre du texte toujours, jamais de
// couleur de série : un tableau ne code rien par la couleur.

import { MATRIX_SORT_LABEL } from './DimensionMatrix'
import type { Type_DimensionMatrix, Type_MatrixRow } from './DimensionMatrix'
import { appendTableExportButtons } from './TableExport'
import type { Type_TableExportFormat } from './TableExport'

export interface Type_DimensionMatrixTableOptions {
  /** Le nombre écrit dans une cellule (unité NON comprise : elle est dans l'en-tête). */
  format: (v: number) => string
  /** La part (0..1) écrite en pourcentage. */
  format_share: (v: number) => string
  /** Ce que mesure le tableau : « Produits agricoles → Monde - Export · 2015 ». */
  title: string
  /** L'unité affichée, `''` sans unité. */
  unit: string
  /** `export_xlsx` / `export_csv` : les infobulles des deux boutons d'export (sa#593). */
  labels: { expand: string, collapse: string, export_xlsx: string, export_csv: string, empty: string }
  on_toggle: (member_id: string, expanded: boolean) => void
  /** sa#593 — exporter le tableau TEL QU'IL EST AFFICHÉ, en Excel ou en CSV. */
  on_export: (format: Type_TableExportFormat) => void
  /** Clic sur un en-tête : la clé de la colonne, ou `MATRIX_SORT_LABEL` pour l'en-tête des lignes. */
  on_sort: (key: string) => void
  /** « Trier par » : l'info-bulle des en-têtes. */
  sort_label: string
  /**
   * 06/10/2026 — LES AXES, dans la barre du tableau : le choix de la dimension en colonnes et ⇄ qui
   * échange lignes et colonnes. Absent : rien (tableau hors fenêtre, page publiée).
   */
  axes?: {
    columns_label: string
    /** La dimension en colonnes (`''` : aucune), et les choix possibles. */
    column: string
    choices: { value: string, label: string }[]
    on_column: (value: string) => void
    /** ⇄ : absent quand il n'y a pas de colonnes. */
    swap?: { label: string, on_swap: () => void }
  }
}

const INDENT_PX = 16

const css = (el: HTMLElement, style: Partial<CSSStyleDeclaration>) => { Object.assign(el.style, style) }

/** Monte le tableau dans `container` ; rend la fonction de démontage. */
export const drawDimensionMatrixTable = (
  container: HTMLElement,
  matrix: Type_DimensionMatrix | null,
  o: Type_DimensionMatrixTableOptions
): (() => void) => {
  container.innerHTML = ''
  const root = document.createElement('div')
  root.className = 'dimension_matrix'
  css(root, {
    display: 'flex', flexDirection: 'column', width: '100%', height: '100%', boxSizing: 'border-box',
    padding: '8px', gap: '6px', fontSize: '13px', color: 'inherit'
  })
  container.appendChild(root)

  // ── EN-TÊTE : ce que mesure le tableau, son unité, l'export ─────────────────────────────────
  const head = document.createElement('div')
  css(head, { display: 'flex', alignItems: 'baseline', gap: '8px' })
  const title = document.createElement('div')
  title.className = 'dimension_matrix_title'
  title.textContent = o.unit ? `${o.title} · ${o.unit}` : o.title
  css(title, { fontWeight: '600', flex: '1 1 auto', minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })
  head.appendChild(title)
  if (o.axes) {
    const axes = o.axes
    const label = document.createElement('label')
    label.className = 'dimension_matrix_columns'
    css(label, { display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', fontSize: '12px' })
    label.appendChild(document.createTextNode(axes.columns_label))
    const select = document.createElement('select')
    css(select, { font: 'inherit', padding: '1px 2px', maxWidth: '180px' })
    axes.choices.forEach(c => {
      const opt = document.createElement('option')
      opt.value = c.value
      opt.textContent = c.label
      opt.selected = c.value === axes.column
      select.appendChild(opt)
    })
    select.addEventListener('change', () => axes.on_column(select.value))
    label.appendChild(select)
    head.appendChild(label)
    if (axes.swap) {
      const swap = axes.swap
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'dimension_matrix_swap'
      button.textContent = '⇄'
      button.title = swap.label
      button.setAttribute('aria-label', swap.label)
      css(button, {
        font: 'inherit', fontSize: '14px', lineHeight: '18px', padding: '0 6px', cursor: 'pointer', borderRadius: '3px',
        border: '1px solid rgba(127,127,127,0.5)', background: 'transparent', color: 'inherit'
      })
      button.addEventListener('click', () => swap.on_swap())
      head.appendChild(button)
    }
  }
  // sa#593 — les deux boutons d'export, communs à tout tableau (cf. `TableExport`). Dans CET en-tête,
  // celui du tableau, et non dans celui du volet : le lecteur d'une page publiée ne voit pas le second.
  const removeExport = appendTableExportButtons(head, {
    titles: { xlsx: o.labels.export_xlsx, csv: o.labels.export_csv },
    on_export: o.on_export
  })
  root.appendChild(head)

  if (matrix === null || matrix.rows.length === 0) {
    const empty = document.createElement('div')
    empty.textContent = o.labels.empty
    css(empty, { opacity: '0.7', padding: '12px 0' })
    root.appendChild(empty)
    return () => {
      removeExport()
      container.innerHTML = ''
    }
  }

  // ── LE TABLEAU ──────────────────────────────────────────────────────────────────────────────
  const scroller = document.createElement('div')
  css(scroller, { flex: '1 1 auto', overflow: 'auto', minHeight: '0' })
  root.appendChild(scroller)
  const table = document.createElement('table')
  css(table, { borderCollapse: 'separate', borderSpacing: '0', fontVariantNumeric: 'tabular-nums', minWidth: '100%' })
  scroller.appendChild(table)

  const line = '1px solid rgba(127,127,127,0.35)'
  const strong_line = '1px solid rgba(127,127,127,0.8)'
  const sticky_bg = 'var(--chakra-colors-chakra-body-bg, Canvas)'

  const thead = document.createElement('thead')
  const hr = document.createElement('tr')
  /** Un en-tête TRIABLE : un bouton dans le <th>, `aria-sort` sur le <th>, la flèche du sens. */
  const sortable = (th: HTMLTableCellElement, text: string, key: string, align: 'left' | 'right') => {
    const active = matrix.sort.key === key
    th.setAttribute('aria-sort', active ? (matrix.sort.dir === 'asc' ? 'ascending' : 'descending') : 'none')
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'dimension_matrix_sort'
    button.title = `${o.sort_label} ${text}`
    button.textContent = active ? (align === 'right' ? `${matrix.sort.dir === 'asc' ? '▲' : '▼'} ${text}` : `${text} ${matrix.sort.dir === 'asc' ? '▲' : '▼'}`) : text
    css(button, {
      font: 'inherit', fontWeight: '600', padding: '0', borderWidth: '0', borderStyle: 'none', background: 'transparent', color: 'inherit',
      cursor: 'pointer', textAlign: align, whiteSpace: 'nowrap'
    })
    button.addEventListener('click', () => o.on_sort(key))
    th.appendChild(button)
  }
  const corner = document.createElement('th')
  corner.scope = 'col'
  sortable(corner, matrix.column_dimension
    ? `${matrix.row_dimension.label} \\ ${matrix.column_dimension.label}`
    : matrix.row_dimension.label, MATRIX_SORT_LABEL, 'left')
  css(corner, {
    textAlign: 'left', fontWeight: '600', padding: '4px 8px', position: 'sticky', top: '0', left: '0', zIndex: '2',
    background: sticky_bg, borderBottom: strong_line, whiteSpace: 'nowrap'
  })
  hr.appendChild(corner)
  matrix.columns.forEach(c => {
    const th = document.createElement('th')
    th.scope = 'col'
    sortable(th, c.label, c.key, 'right')
    css(th, {
      textAlign: 'right', fontWeight: '600', padding: '4px 8px', position: 'sticky', top: '0', zIndex: '1',
      background: sticky_bg, borderBottom: strong_line, whiteSpace: 'nowrap',
      ...(c.kind === 'total' ? { borderLeft: strong_line } : {})
    })
    hr.appendChild(th)
  })
  thead.appendChild(hr)
  table.appendChild(thead)

  const tbody = document.createElement('tbody')
  table.appendChild(tbody)
  matrix.rows.forEach((r: Type_MatrixRow) => {
    const tr = document.createElement('tr')
    tr.className = `dimension_matrix_row dimension_matrix_${r.kind}`
    if (r.member_id) tr.dataset.memberId = r.member_id
    const is_total = r.kind === 'total'
    const is_subtotal = r.kind === 'member' && r.expanded
    const weight = is_total || is_subtotal ? '600' : '400'

    const th = document.createElement('th')
    th.scope = 'row'
    css(th, {
      textAlign: 'left', fontWeight: weight, padding: `3px 8px 3px ${8 + r.depth * INDENT_PX}px`,
      position: 'sticky', left: '0', background: sticky_bg, whiteSpace: 'nowrap',
      borderBottom: line, ...(is_total ? { borderTop: strong_line } : {}),
      ...(r.kind === 'residual' ? { fontStyle: 'italic', opacity: '0.75' } : {})
    })
    if (r.kind === 'member' && r.has_children && r.member_id) {
      const toggle = document.createElement('button')
      toggle.type = 'button'
      toggle.className = 'dimension_matrix_toggle'
      toggle.setAttribute('aria-expanded', String(r.expanded))
      const label = r.expanded ? o.labels.collapse : o.labels.expand
      toggle.setAttribute('aria-label', `${label} ${r.label}`)
      toggle.title = label
      toggle.textContent = r.expanded ? '−' : '+'
      css(toggle, {
        font: 'inherit', width: '18px', height: '18px', lineHeight: '14px', padding: '0', marginRight: '6px',
        cursor: 'pointer', borderRadius: '3px', border: '1px solid rgba(127,127,127,0.5)',
        background: 'transparent', color: 'inherit', verticalAlign: 'middle'
      })
      const member_id = r.member_id
      toggle.addEventListener('click', () => o.on_toggle(member_id, !r.expanded))
      th.appendChild(toggle)
    } else {
      // L'alignement des libellés ne doit pas dépendre de la présence d'un bouton.
      const spacer = document.createElement('span')
      css(spacer, { display: 'inline-block', width: '24px' })
      th.appendChild(spacer)
    }
    th.appendChild(document.createTextNode(r.label))
    tr.appendChild(th)

    r.cells.forEach((v, i) => {
      const col = matrix.columns[i]
      const td = document.createElement('td')
      td.textContent = v === null ? '' : (col.kind === 'share' ? o.format_share(v) : o.format(v))
      css(td, {
        textAlign: 'right', padding: '3px 8px', fontWeight: col.kind === 'total' ? '600' : weight,
        borderBottom: line, whiteSpace: 'nowrap',
        ...(col.kind === 'total' ? { borderLeft: strong_line } : {}),
        ...(is_total ? { borderTop: strong_line } : {}),
        ...(r.kind === 'residual' ? { fontStyle: 'italic', opacity: '0.75' } : {})
      })
      tr.appendChild(td)
    })
    tbody.appendChild(tr)
  })

  return () => {
    removeExport()
    container.innerHTML = ''
  }
}
