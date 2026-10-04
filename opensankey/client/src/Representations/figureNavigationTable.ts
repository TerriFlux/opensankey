// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// 03/10/2026 — LE TABLEAU DE NAVIGATION D'UNE COURONNE (os#1511), à la place du fil d'Ariane.
//
// Jean-Yves : « peux-tu mettre un tableau à la place de ton fil d'Ariane ? Ce qu'il manque encore,
// c'est de jongler d'une dimension à une autre ». Pour chaque dimension, une ligne d'EN-TÊTES (ses
// niveaux) et une ligne « Zoom sélectionné » dont la case du niveau zoomé nomme le membre (« Céréales
// ✕ »). Cliquer un en-tête = la couronne découpe par cette colonne ; ✕ annule ce zoom et ceux en
// dessous dans la même dimension.
//
// Posé par `mountFigureTextZones` AVANT que le dessin ne mesure sa place : le disque se dimensionne
// sur ce qui reste. Module PUR DOM : le modèle (quelle colonne, quels zooms) et les gestes viennent de
// la nature (`registerAnalysisRepresentations`).

/** Une colonne : un niveau d'une dimension. */
export interface Type_FigureNavLevel {
  label: string
  /** La couronne découpe par cette colonne (en-tête surligné). */
  active: boolean
  /** Le membre zoomé à ce niveau, s'il y en a un. */
  zoom?: string
  /** Découper par cette colonne ; absent, l'en-tête est inerte. */
  choose?: () => void
  /** Annuler ce zoom et ceux en dessous. */
  clear?: () => void
}

export interface Type_FigureNavDimension {
  id: string
  name: string
  levels: Type_FigureNavLevel[]
}

export interface Type_FigureNavTable {
  dimensions: Type_FigureNavDimension[]
  labels: {
    title: string
    zoom: string
    dimension: (name: string) => string
    cut_by: (level: string) => string
    clear_zoom: string
  }
  /** La clé sous laquelle le repli se souvient (fenêtre + vignette). */
  memory_key: string
}

/** Le repli, par vignette, le temps de la session (un état d'affichage, pas un réglage). */
const collapsed_tables = new Set<string>()

const ACCENT = '#2b6cb0'

/** Un nom de niveau sans son numéro (« 1 - Filières » → « Filières »). */
export const levelShortName = (text: string): string => text.replace(/^\s*\d+\s*-\s+/, '')

/** Le clic reste au tableau : la vignette dessous le prendrait pour une sélection. */
const keepClick = (el: HTMLElement, go: () => void) => {
  el.addEventListener('pointerdown', e => e.stopPropagation())
  el.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); go() })
}

const plainButton = (text: string, title: string): HTMLButtonElement => {
  const b = document.createElement('button')
  b.type = 'button'
  b.textContent = text
  b.title = title
  b.style.background = 'none'
  b.style.border = 'none'
  b.style.padding = '0'
  b.style.margin = '0'
  b.style.font = 'inherit'
  b.style.cursor = 'pointer'
  return b
}

/** Le tableau, replié en une ligne de résumé si l'utilisateur l'a replié. */
export const buildFigureNavigationTable = (model: Type_FigureNavTable): HTMLElement => {
  const box = document.createElement('div')
  box.className = 'figure_navigation'
  box.style.flex = '0 0 auto'
  box.style.padding = '0.1rem 0.4rem 0.2rem'
  box.style.fontSize = '11px'
  box.style.lineHeight = '1.25'
  box.style.color = '#2d3748'
  box.style.display = 'flex'
  box.style.alignItems = 'flex-start'
  box.style.gap = '0.3rem'
  box.style.overflow = 'hidden'

  const collapsed = collapsed_tables.has(model.memory_key)
  const fold = plainButton(collapsed ? '▸' : '▾', model.labels.title)
  fold.className = 'figure_navigation_fold'
  fold.style.color = '#718096'
  fold.style.flex = '0 0 auto'
  fold.style.width = '0.9rem'
  keepClick(fold, () => {
    if (collapsed) collapsed_tables.delete(model.memory_key)
    else collapsed_tables.add(model.memory_key)
    const next = buildFigureNavigationTable(model)
    box.replaceWith(next)
    // La place du tableau change : le dessin se remesure (cf. les observateurs de taille des tracés).
    window.dispatchEvent(new Event('resize'))
  })
  box.appendChild(fold)

  if (collapsed) {
    // UNE LIGNE : la colonne active et les zooms, « Produits : Céréales › [Pays] ».
    const line = document.createElement('div')
    line.style.whiteSpace = 'nowrap'
    line.style.overflow = 'hidden'
    line.style.textOverflow = 'ellipsis'
    line.style.minWidth = '0'
    line.textContent = model.dimensions.map(d => {
      const zooms = d.levels.filter(l => l.zoom !== undefined).map(l => l.zoom)
      const active = d.levels.find(l => l.active)
      return [d.name, ...zooms, ...(active ? [`[${active.label}]`] : [])].join(' › ')
    }).join('  ·  ')
    line.title = line.textContent
    box.appendChild(line)
    return box
  }

  const table = document.createElement('table')
  table.className = 'figure_navigation_table'
  table.style.borderCollapse = 'collapse'
  table.style.tableLayout = 'auto'
  table.style.maxWidth = '100%'
  const columns = Math.max(0, ...model.dimensions.map(d => d.levels.length))
  model.dimensions.forEach((dim, i) => {
    const head = table.insertRow()
    const zoom = table.insertRow()
    head.className = 'figure_navigation_head'
    zoom.className = 'figure_navigation_zoom'
    const name = head.insertCell()
    name.textContent = dim.name
    name.title = model.labels.dimension(dim.name)
    name.style.fontWeight = '700'
    name.style.padding = '0.05rem 0.5rem 0.05rem 0'
    name.style.whiteSpace = 'nowrap'
    name.style.maxWidth = '12rem'
    name.style.overflow = 'hidden'
    name.style.textOverflow = 'ellipsis'
    if (i > 0) name.style.paddingTop = '0.25rem'
    const zlabel = zoom.insertCell()
    zlabel.textContent = model.labels.zoom
    zlabel.style.color = '#718096'
    zlabel.style.padding = '0 0.5rem 0 0'
    zlabel.style.whiteSpace = 'nowrap'
    for (let c = 0; c < columns; c++) {
      const level = dim.levels[c]
      const th = head.insertCell()
      const td = zoom.insertCell()
      for (const cell of [th, td]) {
        cell.style.padding = '0.05rem 0.4rem'
        cell.style.whiteSpace = 'nowrap'
        cell.style.borderLeft = level ? '1px solid #e2e8f0' : 'none'
      }
      if (i > 0) th.style.paddingTop = '0.25rem'
      if (!level) continue
      th.className = level.active ? 'figure_navigation_level figure_navigation_active' : 'figure_navigation_level'
      if (level.active) {
        th.style.background = '#ebf4ff'
        th.style.boxShadow = `inset 0 -2px 0 ${ACCENT}`
      }
      const head_btn = plainButton(level.label, model.labels.cut_by(level.label))
      head_btn.style.color = level.active ? ACCENT : '#2d3748'
      head_btn.style.fontWeight = level.active ? '700' : '600'
      if (level.choose && !level.active) {
        const go = level.choose
        head_btn.addEventListener('mouseenter', () => { head_btn.style.textDecoration = 'underline' })
        head_btn.addEventListener('mouseleave', () => { head_btn.style.textDecoration = 'none' })
        keepClick(head_btn, go)
      } else {
        head_btn.style.cursor = 'default'
        keepClick(head_btn, () => { /* colonne déjà active */ })
      }
      th.appendChild(head_btn)
      if (level.zoom !== undefined) {
        td.className = 'figure_navigation_zoomed'
        const label = document.createElement('span')
        label.textContent = level.zoom
        label.style.fontWeight = '600'
        td.appendChild(label)
        if (level.clear) {
          const x = plainButton(' ✕', model.labels.clear_zoom)
          x.className = 'figure_navigation_clear'
          x.style.color = '#c53030'
          x.style.marginLeft = '0.2rem'
          keepClick(x, level.clear)
          td.appendChild(x)
        }
      }
    }
  })
  box.appendChild(table)
  return box
}
