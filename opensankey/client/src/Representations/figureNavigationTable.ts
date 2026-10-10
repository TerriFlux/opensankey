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
// niveaux) et des cases de zoom : celle du niveau zoomé nomme le membre (« Céréales ✕ »). Cliquer un en-tête = la couronne découpe par cette colonne ; ✕ annule ce zoom et ceux en
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
// comprise (⌄ discret au survol). La colonne de gauche porte le petit sélecteur de dessin de la
// dimension (en secteurs / en sunburst / une couronne par membre), venu du menu Couronne de la barre du
// haut.
//
// 05/10/2026 — UNE LIGNE PAR DIMENSION : « Zoom sélectionné » disparaît, le sélecteur de dessin passe
// devant le nom de la dimension, et chaque case de zoom suit l'en-tête de son niveau sur la même ligne.

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
  /** 05/10/2026 — un résumé discret après le nom (« — mixte — » quand plusieurs niveaux sont dessinés). */
  summary?: string
  /**
   * os#1526 — UN ÉLÉMENT DE L'HÔTE posé devant le nom, à la place du bouton de dessin d'une couronne :
   * le menu de la dimension du diagramme (Afficher / Dessiner / Placer), rendu par l'hôte (portail
   * React). L'élément appartient à l'hôte : le tableau rebâti le reprend tel quel.
   */
  leading?: HTMLElement
  /**
   * os#1511 (Jean-Yves, 09/10) — LA COMMANDE DU LECTEUR, à la place des colonnes de niveaux : une
   * case, une liste de niveaux ou un choix de membres (cf. `types/ReaderControl`).
   */
  control?: Type_FigureNavControl
}

/** Une option de liste. */
export interface Type_FigureNavOption { value: string, label: string }

/** os#1511 — les trois commandes du lecteur, déjà résolues (état et gestes). */
export type Type_FigureNavControl =
  | {
    kind: 'toggle', label: string, checked: boolean,
    /** La case est gelée ; la raison en info-bulle. */
    frozen?: string,
    set: (on: boolean) => void
  }
  | { kind: 'level', label: string, options: Type_FigureNavOption[], value: string, set: (value: string) => void }
  | {
    kind: 'pick', label: string, options: Type_FigureNavOption[], chosen: string[],
    /** Plusieurs membres à la fois (un diagramme par membre) : la case et son libellé. */
    multi: boolean, multi_label: string, set_multi: (on: boolean) => void,
    choose: (value: string) => void,
    /** Mode « plusieurs » : la liste à cases. */
    pick?: Type_FigureNavZoomPick,
    /** Le niveau suivant, seulement si le membre choisi en a. */
    sub?: { label: string, summary: string, pick: Type_FigureNavZoomPick }
  }

export interface Type_FigureNavTable {
  dimensions: Type_FigureNavDimension[]
  labels: {
    title: string
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
  /** os#1511 (10/10) — en colonne (haut de la légende) : les commandes passent à la ligne. */
  vertical?: boolean
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

/**
 * 05/10/2026 — LE DÉBUT COMMUN DES NOMS DE DIMENSIONS (Julien : « Il faut enlever "Niveau de détail"
 * des noms (c'est redondant) mais le mettre en titre de colonne »). En mots entiers, sur au moins deux
 * noms, et chaque nom doit garder un reste : « Niveau de détail produits » / « Niveau de détail pays
 * partenaires » → titre « Niveau de détail », lignes « Produits » / « Pays partenaires ». Sans début
 * commun : pas de titre, les noms entiers.
 */
export const dimensionNamesPrefix = (names: string[]): { title: string, short: string[] } | null => {
  if (names.length < 2) return null
  const words = names.map(n => n.trim().split(/\s+/))
  let k = 0
  while (
    words.every(w => w.length > k + 1) &&
    words.every(w => w[k] === words[0][k])
  ) k++
  if (k === 0) return null
  const capitalize = (s: string) => s.charAt(0).toLocaleUpperCase() + s.slice(1)
  return { title: words[0].slice(0, k).join(' '), short: words.map(w => capitalize(w.slice(k).join(' '))) }
}

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
  // 05/10/2026 — un cran plus grand et plus aéré (Jean-Yves) : 12 px (11 avant), interligne 1,45.
  box.style.fontSize = '12px'
  box.style.lineHeight = '1.45'
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
  if (model.vertical) table.style.width = '100%'
  const columns = Math.max(0, ...model.dimensions.map(d => d.control ? 0 : d.levels.length))
  // os#1511 — des commandes du LECTEUR : ni échange de dessin, ni titre commun ; elles se lisent seules.
  const has_controls = model.dimensions.some(d => d.control !== undefined)
  // 04/10/2026 — L'ORDRE : une colonne tout à gauche. Deux lignes : un ⇅ qui les échange, à cheval
  // sur les deux ; davantage : ▲▼ par ligne.
  const move = model.dimensions.length > 1 && !has_controls ? model.move : undefined
  const prefix = has_controls ? null : dimensionNamesPrefix(model.dimensions.map(d => d.name))
  if (prefix) {
    // Le début commun, une fois, au-dessus de la colonne des noms (style d'un en-tête de niveau).
    const top = table.insertRow()
    top.className = 'figure_navigation_title_row'
    if (move) top.insertCell()
    const title = top.insertCell()
    title.className = 'figure_navigation_names_title'
    title.textContent = prefix.title
    title.style.fontWeight = '600'
    title.style.color = '#718096'
    title.style.whiteSpace = 'nowrap'
    title.style.padding = '0 0.5rem 0 0'
    if (columns > 0) top.insertCell().colSpan = 2 * columns
  }
  // 05/10/2026 — UNE LIGNE PAR DIMENSION (Julien : « pas besoin du texte "Zoom sélectionné", et le
  // sélecteur pourrait être placé à gauche du label du groupe »). À gauche : [dessin ⌄] [nom ▾] ; puis,
  // par niveau, l'en-tête et sa case de zoom côte à côte. Le tableau perd une ligne par dimension, et le
  // dessin, mesuré sur ce qui reste (`mountFigureTextZones`), récupère la place.
  model.dimensions.forEach((dim, i) => {
    const head = table.insertRow()
    head.className = 'figure_navigation_head'
    // 05/10/2026 — un filet fin entre les lignes de dimensions (Jean-Yves : séparer les en-têtes).
    if (i > 0) head.style.borderTop = '1px solid #e2e8f0'
    if (move && (model.dimensions.length > 2 || i === 0)) {
      const order = head.insertCell()
      order.className = 'figure_navigation_order'
      order.rowSpan = model.dimensions.length === 2 ? 2 : 1
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
    if (dim.control) {
      const cell = head.insertCell()
      cell.className = 'figure_navigation_control'
      cell.colSpan = 1 + 2 * columns
      cell.style.padding = '0.15rem 0.5rem 0.15rem 0'
      cell.style.whiteSpace = model.vertical ? 'normal' : 'nowrap'
      if (i > 0) cell.style.paddingTop = '0.35rem'
      fillControlCell(model, cell, dim.id, dim.control)
      return
    }
    const name = head.insertCell()
    name.className = 'figure_navigation_name'
    if (dim.drawing) name.appendChild(drawingButton(model, dim.id, dim.drawing))
    else if (dim.leading) name.appendChild(dim.leading)
    const dim_label = document.createElement('span')
    // Sous un titre commun, le reste du nom ; l'info-bulle garde le nom complet.
    dim_label.textContent = prefix ? prefix.short[i] : dim.name
    dim_label.title = model.labels.dimension(dim.name)
    name.appendChild(dim_label)
    if (dim.summary) {
      const sum = document.createElement('span')
      sum.className = 'figure_navigation_summary'
      sum.textContent = ` ${dim.summary}`
      sum.style.fontWeight = '400'
      sum.style.color = '#718096'
      sum.style.fontStyle = 'italic'
      name.appendChild(sum)
    }
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
    // Un résumé (« — mixte — ») ne doit pas être rogné : la case s'élargit d'autant.
    name.style.maxWidth = dim.summary ? 'none' : '12rem'
    name.style.overflow = dim.summary ? 'visible' : 'hidden'
    name.style.textOverflow = 'ellipsis'
    if (i > 0) name.style.paddingTop = '0.35rem'
    for (let c = 0; c < columns; c++) {
      const level = dim.levels[c]
      const th = head.insertCell()
      const td = head.insertCell()
      th.style.padding = '0.2rem 0.35rem 0.2rem 0.45rem'
      th.style.borderLeft = level ? '1px solid #e2e8f0' : 'none'
      td.style.padding = '0.2rem 0.45rem 0.2rem 0.3rem'
      // 05/10/2026 — L'EN-TÊTE ET SA CASE DE ZOOM SE DISTINGUENT : un filet pointillé les sépare.
      td.style.borderLeft = level ? '1px dotted #cbd5e0' : 'none'
      for (const cell of [th, td]) {
        cell.style.whiteSpace = 'nowrap'
        if (i > 0) cell.style.paddingTop = '0.35rem'
      }
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
  // 05/10/2026 — la case est sur la ligne des en-têtes : vide, elle ne garde que la place de son ⌄ ;
  // la colonne prend la largeur fixe dès qu'une dimension y pose un zoom.
  td.style.width = zooms.length > 0 ? ZOOM_CELL_WIDTH : '0.8rem'
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
    // 05/10/2026 — le zoom en poids normal : l'en-tête actif seul est en gras.
    label.style.fontWeight = '400'
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
      more.style.fontWeight = '400'
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
    // Collé au membre : en fin de case, il toucherait l'en-tête du niveau suivant.
    keepClick(x, level.clear)
    wrap.appendChild(x)
  }
}

/** Une case à cocher et son libellé, cliquables ensemble. */
const checkbox = (label: string, checked: boolean, set: (on: boolean) => void, frozen?: string): HTMLLabelElement => {
  const wrap = document.createElement('label')
  wrap.style.display = 'inline-flex'
  wrap.style.alignItems = 'center'
  wrap.style.gap = '0.3rem'
  wrap.style.cursor = frozen ? 'not-allowed' : 'pointer'
  wrap.style.color = frozen ? '#a0aec0' : '#2d3748'
  if (frozen) wrap.title = frozen
  const box = document.createElement('input')
  box.type = 'checkbox'
  box.checked = checked
  box.disabled = frozen !== undefined
  box.style.margin = '0'
  box.style.cursor = 'inherit'
  box.addEventListener('pointerdown', e => e.stopPropagation())
  box.addEventListener('click', e => e.stopPropagation())
  box.addEventListener('change', () => set(box.checked))
  wrap.addEventListener('pointerdown', e => e.stopPropagation())
  const text = document.createElement('span')
  text.textContent = label
  wrap.appendChild(box)
  wrap.appendChild(text)
  return wrap
}

/** Une liste déroulante à choix unique. */
const dropdown = (options: Type_FigureNavOption[], value: string, set: (value: string) => void): HTMLSelectElement => {
  const select = document.createElement('select')
  select.style.font = 'inherit'
  select.style.padding = '0 0.2rem'
  select.style.border = '1px solid #cbd5e0'
  select.style.borderRadius = '3px'
  select.style.background = 'white'
  select.style.maxWidth = '16rem'
  options.forEach(o => {
    const opt = document.createElement('option')
    opt.value = o.value
    opt.textContent = o.label
    opt.selected = o.value === value
    select.appendChild(opt)
  })
  select.addEventListener('pointerdown', e => e.stopPropagation())
  select.addEventListener('click', e => e.stopPropagation())
  select.addEventListener('change', () => set(select.value))
  return select
}

/** Un libellé gras de commande. */
const controlLabel = (text: string): HTMLSpanElement => {
  const span = document.createElement('span')
  span.textContent = text
  span.style.fontWeight = '700'
  return span
}

/** Un résumé cliquable (« Céréales +2 ▾ ») qui ouvre la liste à cases d'un choix multiple. */
const pickButton = (model: Type_FigureNavTable, key: string, title: string, summary: string, pick: Type_FigureNavZoomPick): HTMLElement => {
  const b = plainButton(`${summary} ▾`, title)
  b.className = 'figure_navigation_reader_pick'
  b.style.border = '1px solid #cbd5e0'
  b.style.borderRadius = '3px'
  b.style.background = 'white'
  b.style.padding = '0 0.3rem'
  b.style.maxWidth = '16rem'
  b.style.overflow = 'hidden'
  b.style.textOverflow = 'ellipsis'
  b.style.whiteSpace = 'nowrap'
  b.style.verticalAlign = 'middle'
  b.dataset.navPopover = key
  keepClick(b, () => toggleFigureNavPopover(key, b, zoomPickerContent(model.t, title, pick)))
  refreshFigureNavPopover(key, zoomPickerContent(model.t, title, pick))
  return b
}

/** Le résumé d'une liste de membres choisis : le premier, « +N » pour les autres. */
const summaryOf = (labels: string[], empty: string): string =>
  labels.length === 0 ? empty : labels.length === 1 ? labels[0] : `${labels[0]} +${labels.length - 1}`

/** os#1511 — LA COMMANDE DU LECTEUR d'une ligne : case, liste de niveaux ou choix de membres. */
const fillControlCell = (model: Type_FigureNavTable, cell: HTMLTableCellElement, dim_id: string, control: Type_FigureNavControl) => {
  const row = document.createElement('div')
  row.style.display = 'flex'
  row.style.alignItems = 'center'
  row.style.gap = model.vertical ? '0.2rem 0.5rem' : '0.5rem'
  row.style.flexWrap = 'wrap'
  cell.appendChild(row)
  // En colonne, une liste prend la largeur qui reste (elle ne déborde pas de la légende).
  const fit = (el: HTMLElement) => {
    if (!model.vertical) return el
    el.style.flex = '1 1 8rem'
    el.style.minWidth = '0'
    el.style.maxWidth = '100%'
    return el
  }
  if (control.kind === 'toggle') {
    row.appendChild(checkbox(control.label, control.checked, control.set, control.frozen))
    return
  }
  row.appendChild(controlLabel(control.label))
  if (control.kind === 'level') {
    row.appendChild(fit(dropdown(control.options, control.value, control.set)))
    return
  }
  if (control.multi && control.pick) {
    const labels = control.options.filter(o => control.chosen.includes(o.value)).map(o => o.label)
    row.appendChild(fit(pickButton(model, `${model.memory_key}|reader|${dim_id}`, control.label, summaryOf(labels, '—'), control.pick)))
  } else {
    row.appendChild(fit(dropdown(control.options, control.chosen[0] ?? '', control.choose)))
  }
  const sub = control.sub
  if (sub && !control.multi) {
    if (model.vertical) {
      // En colonne, la sous-filière a sa propre ligne, sous la filière.
      const brk = document.createElement('div')
      brk.style.flexBasis = '100%'
      brk.style.height = '0'
      row.appendChild(brk)
    }
    row.appendChild(controlLabel(sub.label))
    row.appendChild(fit(pickButton(model, `${model.memory_key}|reader_sub|${dim_id}`, sub.label, sub.summary, sub.pick)))
  }
  const multi = checkbox(control.multi_label, control.multi, control.set_multi)
  multi.style.fontSize = '11px'
  multi.style.color = '#4a5568'
  row.appendChild(multi)
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
