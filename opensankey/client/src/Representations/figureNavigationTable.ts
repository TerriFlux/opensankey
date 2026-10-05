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
// sur ce qui reste. Module DOM : le modèle (quelle colonne, quels zooms) et les gestes viennent de la
// nature (`registerAnalysisRepresentations`) ; les surcouches (liste du zoom, menu de dessin) sont des
// racines React à part (`figureNavigationPopover`).
//
// 04/10/2026 — LA CASE NE S'ÉTEND PLUS (Julien : « ça ne va pas cette interface »). Les puces d'un zoom
// à plusieurs membres et le menu natif « + » élargissaient la colonne et tout le tableau. Une case de
// zoom tient sur UNE ligne de largeur fixe : « Céréales », « Céréales +2 » (info-bulle : la liste), un
// ✕ qui annule ce zoom et ceux en dessous ; un clic (ou le ⌄) ouvre la liste à cases du sélecteur
// « Par niveau » pour cocher les membres du zoom de CE niveau — à n'importe quel niveau, une case vide
// comprise (⌄ discret au survol). La colonne de gauche porte, devant « Zoom sélectionné », le petit
// sélecteur de dessin de la dimension (en secteurs / en sunburst / une couronne par membre), venu du
// menu Couronne de la barre du haut.

import type { ReactNode } from 'react'
import type { Type_TopbarFigureChoice } from '../types/MenuConfig'
import { figureDrawingIconElement, isFigureDrawingIconName } from '../components/ui/FigureDrawingIcon'
import {
  drawingMenuContent, refreshFigureNavPopover, settingsMenuContent, toggleFigureNavPopover, zoomPickerContent,
  type Type_FigureNavZoomPick
} from './figureNavigationPopover'

/** Une colonne : un niveau d'une dimension. */
export interface Type_FigureNavLevel {
  label: string
  /** La couronne découpe par cette colonne (en-tête surligné). */
  active: boolean
  /**
   * Les noms des membres zoomés à ce niveau (ou de leurs ancêtres), s'il y en a. La case les résume
   * sur une ligne de largeur fixe, « Céréales +2 », la liste entière en info-bulle.
   */
  zooms?: string[]
  /** ✕ : annule le zoom de ce niveau et ceux en dessous dans la même dimension. */
  clear?: () => void
  /**
   * 04/10/2026 — LA LISTE À CASES DU ZOOM DE CE NIVEAU (celle du sélecteur « Par niveau »), ouverte
   * par la case ou son ⌄ ; une case vide l'ouvre aussi, pour poser un zoom sans passer par la
   * couronne. Absente : la case est inerte.
   */
  pick?: Type_FigureNavZoomPick
  /**
   * Le clic simple : découper par cette colonne seule ; sur la colonne qui découpe (`column`), ne plus
   * découper par cette dimension. Absent, l'en-tête est inerte.
   */
  choose?: () => void
  /**
   * 04/10/2026 — CTRL+CLIC (⌘+clic) : ajouter cette colonne à celles qui découpent (une autre
   * dimension) ; sur une colonne qui découpe, la retirer.
   */
  choose_with?: () => void
  /** 04/10/2026 — cette colonne découpe la couronne : la recliquer la désélectionne. */
  column?: boolean
}

export interface Type_FigureNavDimension {
  id: string
  name: string
  levels: Type_FigureNavLevel[]
  /**
   * 04/10/2026 — COMMENT CETTE DIMENSION SE DESSINE quand elle découpe (en secteurs / en sunburst /
   * une couronne par membre). Absent : rien à choisir.
   */
  drawing?: Type_TopbarFigureChoice | null
  /**
   * 04/10/2026 (lot 3) — LE SÉLECTEUR ARBRE de la dimension (les membres montrés, à n'importe quels
   * niveaux), ouvert par le ▾ de son nom. Absent : le nom est inerte.
   */
  members?: ((close: () => void) => ReactNode) | null
}

export interface Type_FigureNavTable {
  dimensions: Type_FigureNavDimension[]
  labels: {
    title: string
    zoom: string
    dimension: (name: string) => string
    cut_by: (level: string) => string
    clear_zoom: string
    pick_zoom: string
    drawing: string
    /** 04/10/2026 — l'info-bulle d'une colonne qui découpe : la recliquer la désélectionne. */
    uncut: (level: string) => string
    /** 04/10/2026 — la ligne d'info-bulle du ctrl+clic. */
    ctrl_hint: string
    /** 04/10/2026 — ⇅ (deux lignes) et ▲▼ (plus de deux). */
    swap: string
    move_up: string
    move_down: string
    /** 04/10/2026 (lot 3) — la ⚙ et le ▾ du nom d'une dimension. */
    settings: string
    members: string
  }
  /**
   * 04/10/2026 (lot 3) — LES RÉGLAGES DE LA ⚙ (colonne de gauche, en haut) : clic sur une part, liée /
   * détachée. Absents ou vides : pas de ⚙.
   */
  settings?: Type_TopbarFigureChoice[]
  /**
   * 04/10/2026 — L'ORDRE DES LIGNES = L'ORDRE D'EMBOÎTEMENT (ligne du haut = anneau intérieur) : la
   * ligne `dim_id` monte (-1) ou descend (+1). Absent : pas de bouton.
   */
  move?: (dim_id: string, delta: -1 | 1) => void
  /** La traduction, pour la liste à cases. */
  t: (key: string, options?: { [k: string]: unknown }) => unknown
  /** La clé sous laquelle le repli se souvient (fenêtre + vignette). */
  memory_key: string
}

/** Le repli, par vignette, le temps de la session (un état d'affichage, pas un réglage). */
const collapsed_tables = new Set<string>()

const ACCENT = '#2b6cb0'

/** La largeur d'une case de zoom : au-delà, le nom se coupe (« Produits bruts - Cér… +1 »). */
const ZOOM_CELL_WIDTH = '8.5rem'

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
  // 04/10/2026 (lot 3) — LA ⚙ : les réglages de la couronne qui ne sont pas des colonnes (clic sur une
  // part, liée / détachée). En publication, l'en-tête de fenêtre est masqué : c'est le seul accès.
  const settings = model.settings ?? []
  if (settings.length > 0) {
    const gear = plainButton('⚙', model.labels.settings)
    gear.className = 'figure_navigation_settings'
    gear.style.color = '#718096'
    gear.style.flex = '0 0 auto'
    gear.style.fontSize = '12px'
    const key = `${model.memory_key}|settings`
    gear.dataset.navPopover = key
    keepClick(gear, () => toggleFigureNavPopover(key, gear, settingsMenuContent(model.labels.settings, settings)))
    refreshFigureNavPopover(key, settingsMenuContent(model.labels.settings, settings))
    box.appendChild(gear)
  }

  if (collapsed) {
    // UNE LIGNE : la colonne active et les zooms, « Produits : Céréales › [Pays] ».
    const line = document.createElement('div')
    line.style.whiteSpace = 'nowrap'
    line.style.overflow = 'hidden'
    line.style.textOverflow = 'ellipsis'
    line.style.minWidth = '0'
    line.textContent = model.dimensions.map(d => {
      const zooms = d.levels.filter(l => l.zooms !== undefined).map(l => (l.zooms ?? []).join(', '))
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
  // 04/10/2026 — L'ORDRE : une colonne tout à gauche. Deux lignes : un ⇅ qui les échange, à cheval
  // sur les deux ; davantage : ▲▼ par ligne.
  const move = model.dimensions.length > 1 ? model.move : undefined
  model.dimensions.forEach((dim, i) => {
    const head = table.insertRow()
    const zoom = table.insertRow()
    head.className = 'figure_navigation_head'
    zoom.className = 'figure_navigation_zoom'
    if (move && (model.dimensions.length > 2 || i === 0)) {
      const order = head.insertCell()
      order.className = 'figure_navigation_order'
      order.rowSpan = model.dimensions.length === 2 ? 4 : 2
      order.style.verticalAlign = 'middle'
      order.style.padding = '0 0.3rem 0 0'
      order.style.whiteSpace = 'nowrap'
      const arrow = (text: string, title: string, go: () => void, disabled = false) => {
        const b = plainButton(text, title)
        b.style.display = 'block'
        b.style.color = disabled ? '#cbd5e0' : '#4a5568'
        b.style.fontSize = '12px'
        b.style.lineHeight = '1'
        b.style.padding = '0.05rem 0.15rem'
        b.style.border = '1px solid #cbd5e0'
        b.style.borderRadius = '3px'
        b.style.background = 'white'
        b.style.margin = '0.05rem 0'
        if (disabled) { b.disabled = true; b.style.cursor = 'default' }
        keepClick(b, disabled ? () => { /* rien au-delà du bord */ } : go)
        return b
      }
      if (model.dimensions.length === 2) {
        const b = arrow('⇅', model.labels.swap, () => move(dim.id, 1))
        b.className = 'figure_navigation_swap'
        order.appendChild(b)
      } else {
        const up = arrow('▲', model.labels.move_up, () => move(dim.id, -1), i === 0)
        up.className = 'figure_navigation_up'
        const down = arrow('▼', model.labels.move_down, () => move(dim.id, 1), i === model.dimensions.length - 1)
        down.className = 'figure_navigation_down'
        up.style.fontSize = down.style.fontSize = '8px'
        order.appendChild(up)
        order.appendChild(down)
      }
    }
    const name = head.insertCell()
    name.textContent = dim.name
    name.title = model.labels.dimension(dim.name)
    const members = dim.members
    if (members) {
      // 04/10/2026 (lot 3) — ▾ : le sélecteur Arbre de la dimension.
      const key = `${model.memory_key}|members|${dim.id}`
      const caret = plainButton(' ▾', model.labels.members)
      caret.className = 'figure_navigation_members'
      caret.style.color = '#718096'
      caret.style.fontSize = '9px'
      caret.dataset.navPopover = key
      keepClick(caret, () => toggleFigureNavPopover(key, caret, members))
      refreshFigureNavPopover(key, members)
      name.appendChild(caret)
    }
    name.style.fontWeight = '700'
    name.style.padding = '0.05rem 0.5rem 0.05rem 0'
    name.style.whiteSpace = 'nowrap'
    name.style.maxWidth = '12rem'
    name.style.overflow = 'hidden'
    name.style.textOverflow = 'ellipsis'
    if (i > 0) name.style.paddingTop = '0.25rem'
    const zlabel = zoom.insertCell()
    zlabel.style.color = '#718096'
    zlabel.style.padding = '0 0.5rem 0 0'
    zlabel.style.whiteSpace = 'nowrap'
    if (dim.drawing) zlabel.appendChild(drawingButton(model, dim.id, dim.drawing))
    zlabel.appendChild(document.createTextNode(model.labels.zoom))
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
      if (level.column) th.className += ' figure_navigation_column'
      const tip = level.column ? model.labels.uncut(level.label) : model.labels.cut_by(level.label)
      const head_btn = plainButton(level.label, level.choose_with ? `${tip}\n${model.labels.ctrl_hint}` : tip)
      head_btn.style.color = level.active ? ACCENT : '#2d3748'
      head_btn.style.fontWeight = level.active ? '700' : '600'
      // 04/10/2026 — clic simple : cette colonne seule (sur la colonne qui découpe : la désélectionner) ;
      // ctrl+clic ou ⌘+clic : l'ajouter aux colonnes qui découpent, ou l'en retirer.
      const plain = level.choose
      const with_ctrl = level.choose_with
      if (plain || with_ctrl) {
        head_btn.addEventListener('mouseenter', () => { head_btn.style.textDecoration = 'underline' })
        head_btn.addEventListener('mouseleave', () => { head_btn.style.textDecoration = 'none' })
        head_btn.addEventListener('pointerdown', e => e.stopPropagation())
        head_btn.addEventListener('click', e => {
          e.stopPropagation()
          e.preventDefault()
          const go = (e.ctrlKey || e.metaKey) && with_ctrl ? with_ctrl : plain
          go?.()
        })
      } else {
        head_btn.style.cursor = 'default'
        keepClick(head_btn, () => { /* en-tête inerte */ })
      }
      th.appendChild(head_btn)
      fillZoomCell(model, td, `${dim.id}|${c}`, level)
    }
  })
  box.appendChild(table)
  return box
}

/**
 * LA CASE DE ZOOM D'UN NIVEAU, sur une ligne de largeur fixe : le résumé (« Céréales +2 »), le ⌄ qui
 * ouvre la liste à cases (discret au survol d'une case vide), le ✕ qui annule ce zoom.
 */
const fillZoomCell = (model: Type_FigureNavTable, td: HTMLTableCellElement, where: string, level: Type_FigureNavLevel) => {
  const zooms = level.zooms ?? []
  // `width` sur une case de tableau en disposition automatique est un MINIMUM ; le contenu, de largeur
  // nulle mais au moins toute la case, ne pousse pas la colonne : elle garde la largeur de son en-tête
  // ou de ce minimum, quel que soit le zoom.
  td.style.width = ZOOM_CELL_WIDTH
  td.style.maxWidth = ZOOM_CELL_WIDTH
  const wrap = document.createElement('div')
  wrap.style.display = 'flex'
  wrap.style.alignItems = 'center'
  wrap.style.gap = '0.2rem'
  wrap.style.width = '0'
  wrap.style.minWidth = '100%'
  td.appendChild(wrap)
  if (zooms.length > 0) {
    td.className = 'figure_navigation_zoomed'
    td.title = zooms.join('\n')
  }
  const pick = level.pick
  const key = `${model.memory_key}|zoom|${where}`
  const title = `${level.label} — ${model.labels.pick_zoom}`
  const openPick = pick ? () => toggleFigureNavPopover(key, td, zoomPickerContent(model.t, title, pick)) : undefined
  if (zooms.length > 0) {
    const label = document.createElement('span')
    label.className = 'figure_navigation_member'
    label.textContent = zooms[0]
    label.style.fontWeight = '600'
    label.style.overflow = 'hidden'
    label.style.textOverflow = 'ellipsis'
    label.style.whiteSpace = 'nowrap'
    label.style.minWidth = '0'
    label.style.flex = '0 1 auto'
    if (openPick) { label.style.cursor = 'pointer'; keepClick(label, openPick) }
    wrap.appendChild(label)
    if (zooms.length > 1) {
      const more = document.createElement('span')
      more.className = 'figure_navigation_more'
      more.textContent = `+${zooms.length - 1}`
      more.style.color = ACCENT
      more.style.fontWeight = '600'
      more.style.flex = '0 0 auto'
      if (openPick) { more.style.cursor = 'pointer'; keepClick(more, openPick) }
      wrap.appendChild(more)
    }
  }
  if (openPick && pick) {
    td.dataset.navPopover = key
    const caret = plainButton('▾', model.labels.pick_zoom)
    caret.className = 'figure_navigation_pick'
    caret.style.color = '#718096'
    caret.style.flex = '0 0 auto'
    caret.style.fontSize = '9px'
    caret.style.padding = '0 0.1rem'
    keepClick(caret, openPick)
    if (zooms.length === 0) {
      // Une case vide : le ⌄ ne se montre qu'au survol.
      caret.style.opacity = '0'
      td.addEventListener('mouseenter', () => { caret.style.opacity = '1' })
      td.addEventListener('mouseleave', () => { caret.style.opacity = '0' })
      caret.addEventListener('focus', () => { caret.style.opacity = '1' })
    }
    wrap.appendChild(caret)
    // La liste ouverte suit le redessin : elle reçoit le modèle d'après le geste.
    refreshFigureNavPopover(key, zoomPickerContent(model.t, title, pick))
  }
  if (zooms.length > 0 && level.clear) {
    const x = plainButton('✕', model.labels.clear_zoom)
    x.className = 'figure_navigation_clear'
    x.style.color = '#c53030'
    x.style.flex = '0 0 auto'
    x.style.marginLeft = 'auto'
    keepClick(x, level.clear)
    wrap.appendChild(x)
  }
}

/** LE SÉLECTEUR DE DESSIN d'une dimension : l'icône du dessin courant, un ⌄, et son menu. */
const drawingButton = (model: Type_FigureNavTable, dim_id: string, choice: Type_TopbarFigureChoice): HTMLElement => {
  const current = choice.options.find(o => o.value === choice.value)
  const b = plainButton('', `${model.labels.drawing} : ${current?.label ?? ''}`)
  b.className = 'figure_navigation_drawing'
  b.style.display = 'inline-flex'
  b.style.alignItems = 'center'
  b.style.gap = '0.1rem'
  b.style.color = '#4a5568'
  b.style.border = '1px solid #cbd5e0'
  b.style.borderRadius = '3px'
  b.style.padding = '0 0.15rem'
  b.style.marginRight = '0.3rem'
  b.style.verticalAlign = 'middle'
  b.style.background = 'white'
  const icon = current?.icon
  if (isFigureDrawingIconName(icon)) b.appendChild(figureDrawingIconElement(icon, 12))
  const caret = document.createElement('span')
  caret.textContent = '▾'
  caret.style.fontSize = '9px'
  caret.style.color = '#718096'
  b.appendChild(caret)
  const key = `${model.memory_key}|draw|${dim_id}`
  b.dataset.navPopover = key
  keepClick(b, () => toggleFigureNavPopover(key, b, drawingMenuContent(choice)))
  refreshFigureNavPopover(key, drawingMenuContent(choice))
  return b
}
