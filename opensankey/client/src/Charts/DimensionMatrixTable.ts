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
import type { Type_DimensionMatrix, Type_MatrixColumn, Type_MatrixRow } from './DimensionMatrix'
import { appendTableExportButtons } from './TableExport'
import type { Type_TableExportFormat } from './TableExport'
import type { Type_FigureZoomHandle } from './figureZoomBridge'

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
  labels: { expand: string, collapse: string, export_xlsx: string, export_csv: string, empty: string, subtotal?: (name: string) => string }
  /** +/− d'une ligne ; `gesture.shift` : tout le niveau (07/10/2026). */
  on_toggle: (member_id: string, expanded: boolean, gesture: { shift: boolean }) => void
  /** 07/10/2026 (lot 2) — +/− d'un en-tête de colonne ; absent : colonnes à plat. */
  on_column_toggle?: (member_id: string, expanded: boolean, gesture: { shift: boolean }) => void
  /** « Maj+clic : tout le niveau », ajouté à l'info-bulle des +/− quand le geste existe. */
  level_hint?: string
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
  /**
   * 07/10/2026 — LE TABLEAU DE NAVIGATION de la fenêtre (`buildFigureNavigationTable`, celui de la
   * couronne), posé sous le titre. Présent, il remplace le sélecteur « Colonnes » et ⇄.
   */
  navigation?: HTMLElement
  axes?: {
    columns_label: string
    /** La dimension en colonnes (`''` : aucune), et les choix possibles. */
    column: string
    choices: { value: string, label: string }[]
    on_column: (value: string) => void
    /** ⇄ : absent quand il n'y a pas de colonnes. */
    swap?: { label: string, on_swap: () => void }
  }
  /**
   * 07/10/2026 — LE ZOOM, COMME DANS UN TABLEUR (Julien : « la taille des cases et la police »). Tout
   * le tableau se met à l'échelle `scale` ; Ctrl+molette, et les boutons −/+/% de la fenêtre par la
   * poignée publiée (`publish`, `null` au démontage). `on_scale` : l'échelle retenue, pour la
   * retrouver au redessin. Absent : pas de zoom.
   */
  zoom?: {
    scale: number
    on_scale: (k: number) => void
    publish: (handle: Type_FigureZoomHandle | null) => void
  }
}

/** Les bornes du zoom d'un tableau, comme un tableur (10 % à 400 % chez Excel ; ici lisible). */
export const MATRIX_ZOOM_MIN = 0.5
export const MATRIX_ZOOM_MAX = 3

const INDENT_PX = 16

const css = (el: HTMLElement, style: Partial<CSSStyleDeclaration>) => { Object.assign(el.style, style) }

/** Le bouton +/− d'une ligne ou d'un en-tête de colonne. */
const toggleButton = (
  label: string, expanded: boolean, text: string, hint: string | undefined,
  on: (gesture: { shift: boolean }) => void
): HTMLButtonElement => {
  const toggle = document.createElement('button')
  toggle.type = 'button'
  toggle.className = 'dimension_matrix_toggle'
  toggle.setAttribute('aria-expanded', String(expanded))
  toggle.setAttribute('aria-label', `${label} ${text}`)
  toggle.title = hint ? `${label} — ${hint}` : label
  toggle.textContent = expanded ? '−' : '+'
  css(toggle, {
    font: 'inherit', width: '18px', height: '18px', lineHeight: '14px', padding: '0', marginRight: '6px',
    cursor: 'pointer', borderRadius: '3px', border: '1px solid rgba(127,127,127,0.5)',
    background: 'transparent', color: 'inherit', verticalAlign: 'middle'
  })
  toggle.addEventListener('click', (e) => { e.stopPropagation(); on({ shift: e.shiftKey }) })
  return toggle
}

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
  // 07/10/2026 — LE TABLEAU DE NAVIGATION dit déjà lignes, colonnes (⇅) et tableaux par membre : le
  // sélecteur « Colonnes » et ⇄ ne restent que sans lui.
  if (o.axes && !o.navigation) {
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
  if (o.navigation) root.appendChild(o.navigation)

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
  // Ce qui se zoome : le tableau, ou la grille des tableaux par membre.
  const zoomed = document.createElement('div')
  zoomed.className = 'dimension_matrix_zoom'
  css(zoomed, { minWidth: '100%' })
  scroller.appendChild(zoomed)
  // 07/10/2026 — LE ZOOM DU TABLEAU : cases, police et boutons ensemble (`zoom` CSS : le défilement
  // et les en-têtes figés suivent). Ctrl+molette, comme un tableur ; les boutons de la fenêtre par la
  // poignée publiée.
  const unpublish = (() => {
    const zoom = o.zoom
    if (zoom === undefined) return () => { /* pas de zoom */ }
    let k = Math.min(MATRIX_ZOOM_MAX, Math.max(MATRIX_ZOOM_MIN, zoom.scale))
    const apply = (next: number) => {
      k = Math.min(MATRIX_ZOOM_MAX, Math.max(MATRIX_ZOOM_MIN, next))
      ;(zoomed.style as CSSStyleDeclaration & { zoom: string }).zoom = String(k)
      zoomed.style.minWidth = `${100 / k}%`
      zoom.on_scale(k)
    }
    ;(zoomed.style as CSSStyleDeclaration & { zoom: string }).zoom = String(k)
    zoomed.style.minWidth = `${100 / k}%`
    scroller.addEventListener('wheel', (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.deltaY === 0) return
      e.preventDefault()
      apply(k * Math.pow(2, -e.deltaY / 500))
    }, { passive: false })
    zoom.publish({
      getScale: () => k,
      setScale: (next) => apply(next),
      scaleBy: (factor) => apply(k * factor),
      fit: () => apply(1)
    })
    return () => zoom.publish(null)
  })()

  const cellText = (v: number | null, i: number) =>
    v === null ? '' : (matrix.columns[i].kind === 'share' ? o.format_share(v) : o.format(v))

  /**
   * 07/10/2026 — UN TABLEAU, d'après les lignes et les colonnes de la matrice et `cellsOf` (ses
   * cellules, ou celles d'un des tableaux parallèles). `small` : un des petits tableaux d'une grille
   * (en-têtes non collants, largeurs de colonnes imposées pour qu'ils s'alignent).
   */
  const buildTable = (cellsOf: (j: number) => (number | null)[], small?: { widths: string[], label_width: string }): HTMLTableElement => {
    const table = document.createElement('table')
    css(table, { borderCollapse: 'separate', borderSpacing: '0', fontVariantNumeric: 'tabular-nums', minWidth: small ? '0' : '100%' })

    const line = '1px solid rgba(127,127,127,0.35)'
    const strong_line = '1px solid rgba(127,127,127,0.8)'
    const sticky_bg = 'var(--chakra-colors-chakra-body-bg, Canvas)'

    const thead = document.createElement('thead')
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

    // 07/10/2026 (lot 2) — LES EN-TÊTES DE COLONNES EN ARBRE. Un membre ouvert coiffe ses colonnes
    // (« − Europe » au-dessus de ses sous-régions et de son sous-total) ; sa propre colonne, À DROITE
    // (comme Excel), est son sous-total (« Total Europe »). Autant de rangées d'en-têtes que de crans
    // ouverts ; une colonne fermée occupe toutes les rangées sous elle. Sans colonne ouverte : une
    // seule rangée, comme avant.
    const header_rows = 1 + Math.max(0, ...matrix.columns.map(c => (c.kind === 'member' && c.expanded ? (c.depth ?? 0) + 1 : 0)))
    const hrs: HTMLTableRowElement[] = Array.from({ length: header_rows }, () => document.createElement('tr'))
    const head_cell = (th: HTMLTableCellElement, c: Type_MatrixColumn | null, bottom: boolean) => {
      css(th, {
        textAlign: c === null ? 'left' : 'right', fontWeight: '600', padding: '4px 8px', position: 'sticky',
        top: '0', zIndex: c === null ? '2' : '1', background: sticky_bg, whiteSpace: 'nowrap',
        ...(small ? { position: 'static' } : {}),
        borderBottom: bottom ? strong_line : line,
        ...(c?.kind === 'total' ? { borderLeft: strong_line } : {})
      })
    }
    const corner = document.createElement('th')
    corner.scope = 'col'
    corner.rowSpan = header_rows
    sortable(corner, matrix.column_dimension
      ? `${matrix.row_dimension.label} \\ ${matrix.column_dimension.label}`
      : matrix.row_dimension.label, MATRIX_SORT_LABEL, 'left')
    head_cell(corner, null, true)
    css(corner, { left: '0', verticalAlign: 'bottom', ...(small ? { width: small.label_width, minWidth: small.label_width } : {}) })
    hrs[0].appendChild(corner)
    /** Les groupes qui COMMENCENT à chaque colonne : un ouvert coiffe ses descendants, qui le précèdent. */
    const groups_at = new Map<number, number[]>()
    matrix.columns.forEach((c, j) => {
      if (!(c.kind === 'member' && c.expanded)) return
      const d = c.depth ?? 0
      let start = j
      while (start - 1 >= 0 && matrix.columns[start - 1].kind === 'member' && (matrix.columns[start - 1].depth ?? 0) > d) start--
      groups_at.set(start, [...(groups_at.get(start) ?? []), j])
    })
    /** Le +/− d'un en-tête de colonne, devant son nom, comme les lignes. */
    const columnToggle = (th: HTMLTableCellElement, c: Type_MatrixColumn) => {
      if (!o.on_column_toggle || c.kind !== 'member' || !c.has_children || !c.member_id) return
      const member_id = c.member_id
      const expanded = c.expanded === true
      th.appendChild(toggleButton(expanded ? o.labels.collapse : o.labels.expand, expanded, c.label, o.level_hint,
        g => o.on_column_toggle?.(member_id, !expanded, g)))
    }
    const foldedTitle = (th: HTMLElement, c: Type_MatrixColumn) => {
      if (c.folded_names) th.title = c.folded_names.join(', ')
    }
    // Le haut d'une rangée sticky : les rangées d'en-têtes s'empilent.
    const ROW_PX = 26
    matrix.columns.forEach((c, i) => {
      // Les groupes qui commencent ici, du plus haut au plus bas.
      ;(groups_at.get(i) ?? []).sort((a, b) => (matrix.columns[a].depth ?? 0) - (matrix.columns[b].depth ?? 0)).forEach(j => {
        const g = matrix.columns[j]
        const d = g.depth ?? 0
        const group = document.createElement('th')
        group.scope = 'colgroup'
        group.colSpan = j - i + 1
        head_cell(group, g, false)
        css(group, { textAlign: 'center', borderLeft: line, top: `${d * ROW_PX}px` })
        columnToggle(group, g)
        group.appendChild(document.createTextNode(g.label))
        foldedTitle(group, g)
        hrs[d].appendChild(group)
      })
      const depth = c.kind === 'member' ? (c.depth ?? 0) : 0
      if (c.kind === 'member' && c.expanded) {
        // Son sous-total, sous le groupe, à droite de ses enfants : « Total Europe ».
        const sub = document.createElement('th')
        sub.scope = 'col'
        sub.rowSpan = header_rows - depth - 1
        head_cell(sub, c, true)
        if (small) css(sub, { width: small.widths[i], minWidth: small.widths[i] })
        css(sub, { borderLeft: line, top: `${(depth + 1) * ROW_PX}px`, verticalAlign: 'bottom' })
        sortable(sub, o.labels.subtotal ? o.labels.subtotal(c.label) : `Total ${c.label}`, c.key, 'right')
        hrs[depth + 1].appendChild(sub)
        return
      }
      const th = document.createElement('th')
      th.scope = 'col'
      th.rowSpan = header_rows - depth
      head_cell(th, c, true)
      if (small) css(th, { width: small.widths[i], minWidth: small.widths[i] })
      css(th, { top: `${depth * ROW_PX}px`, verticalAlign: 'bottom' })
      columnToggle(th, c)
      sortable(th, c.label, c.key, 'right')
      foldedTitle(th, c)
      hrs[depth].appendChild(th)
    })
    hrs.forEach(tr => {
      if (header_rows > 1) css(tr, { height: `${ROW_PX}px` })
      thead.appendChild(tr)
    })
    table.appendChild(thead)

    const tbody = document.createElement('tbody')
    table.appendChild(tbody)
    matrix.rows.forEach((r: Type_MatrixRow, j: number) => {
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
        position: small ? 'static' : 'sticky', left: '0', background: sticky_bg, whiteSpace: 'nowrap',
        borderBottom: line, ...(is_total ? { borderTop: strong_line } : {}),
        ...(r.kind === 'residual' ? { fontStyle: 'italic', opacity: '0.75' } : {})
      })
      if (r.kind === 'member' && r.has_children && r.member_id) {
        const member_id = r.member_id
        th.appendChild(toggleButton(r.expanded ? o.labels.collapse : o.labels.expand, r.expanded, r.label, o.level_hint,
          g => o.on_toggle(member_id, !r.expanded, g)))
        if (r.folded_names) th.title = r.folded_names.join(', ')
      } else {
        // L'alignement des libellés ne doit pas dépendre de la présence d'un bouton.
        const spacer = document.createElement('span')
        css(spacer, { display: 'inline-block', width: '24px' })
        th.appendChild(spacer)
      }
      th.appendChild(document.createTextNode(r.label))
      tr.appendChild(th)

      cellsOf(j).forEach((v, i) => {
        const col = matrix.columns[i]
        const td = document.createElement('td')
        td.textContent = cellText(v, i)
        css(td, {
          textAlign: 'right', padding: '3px 8px', fontWeight: col.kind === 'total' || col.expanded ? '600' : weight,
          borderBottom: line, whiteSpace: 'nowrap',
          ...(col.kind === 'total' ? { borderLeft: strong_line } : {}),
          ...(is_total ? { borderTop: strong_line } : {}),
          ...(r.kind === 'residual' ? { fontStyle: 'italic', opacity: '0.75' } : {})
        })
        tr.appendChild(td)
      })
      tbody.appendChild(tr)
    })
    return table
  }

  const cases = matrix.cases
  if (!cases) {
    zoomed.appendChild(buildTable(j => matrix.rows[j].cells))
  } else {
    // 07/10/2026 — UN TABLEAU PAR MEMBRE : une grille de petits tableaux titrés par leur membre,
    // « Autres » en dernier. Mêmes lignes, mêmes colonnes, mêmes largeurs : ils se lisent côte à côte.
    const CH = 0.62
    const chars = matrix.columns.map((c, i) => Math.max(
      (o.labels.subtotal && c.expanded ? o.labels.subtotal(c.label) : c.label).length + 2,
      ...cases.tables.flatMap(tb => tb.cells.map(row => cellText(row[i], i).length))
    ))
    const widths = chars.map(n => `${(n * CH + 1.2).toFixed(1)}em`)
    const label_chars = Math.max(...matrix.rows.map(r => r.label.length + 2 * r.depth + 3))
    const label_width = `${(label_chars * CH + 1).toFixed(1)}em`
    const grid = document.createElement('div')
    grid.className = 'dimension_matrix_cases'
    css(grid, { display: 'flex', flexWrap: 'wrap', gap: '14px 18px', alignItems: 'flex-start' })
    cases.tables.forEach(tb => {
      const cell = document.createElement('div')
      cell.className = 'dimension_matrix_case'
      cell.dataset.memberId = tb.member_id
      const caption = document.createElement('div')
      caption.className = 'dimension_matrix_case_title'
      caption.textContent = tb.label
      if (tb.folded_names) caption.title = tb.folded_names.join(', ')
      css(caption, { fontWeight: '600', padding: '2px 8px', borderBottom: '2px solid rgba(127,127,127,0.6)' })
      cell.appendChild(caption)
      cell.appendChild(buildTable(j => tb.cells[j], { widths, label_width }))
      grid.appendChild(cell)
    })
    zoomed.appendChild(grid)
  }

  return () => {
    unpublish()
    removeExport()
    container.innerHTML = ''
  }
}
