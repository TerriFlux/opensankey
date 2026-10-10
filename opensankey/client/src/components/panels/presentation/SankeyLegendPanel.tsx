// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// os#1527 — LA LÉGENDE DU DIAGRAMME DANS SA COLONNE, à la façon de celle des couronnes : une case par
// étiquette qui se coche, l'ordre stable, à côté du dessin et jamais par-dessus.
//
// Le CONTENU reste celui du générateur (`computeLegendItems`, relu dans `legend.panel_items`), et les
// GESTES restent ceux de la légende dessinée, par l'identifiant de zone de chaque entrée — rien n'est
// réécrit, les mécanismes d'Alexandre passent tels quels :
//  - SA#549 cocher / décocher une étiquette de nœuds ou de flux (`toggleEntryTag`, annulable) ;
//  - os#1526 cocher un membre d'une dimension à niveaux (le choisir dans le diagramme) ;
//  - SA#549 renommer au double-clic (`canRenameEntry` / `renameEntry`) ;
//  - SA#551 titre de groupe → sa pop-up (fiche, « Vue »), par la zone du modèle ;
//  - SA#552 ligne de rappel d'une dimension → la liste de ses tranches ;
//  - SA#545 survol → surbrillance, et mise en forme du style de l'étiquette (carré, nom, valeur) ;
//  - SA#550 groupe épinglé, #542 définition en info-bulle, OS#1314 gabarit (déjà dans le texte).
//
// Styles écrits en dur : le lecteur MIT monte ce panneau sans le thème de l'application.

import React from 'react'

import type { Class_ApplicationData } from '../../../types/ApplicationData'
import type { Type_LegendItem } from '../../../Elements/legendItems'
import { LEGEND_SAMPLE_VALUE } from '../../../Elements/legendTagStyle'
import { openPresentationFor } from './openPresentation'
import { isLegendDimensionZoneId, openLegendDimensionChoice } from './legendDimensionChoice'
import { ZOOM_TOPIC } from '../../../types/EventBus'
import type { Class_DataTagGroup } from '../../../types/TagGroup'
import { applyMembersColorFlows } from '../../ui/dimensionDrawingHost'
import { ui_bg_subtle, ui_ink, ui_ink_disabled, ui_ink_muted, ui_ink_secondary, ui_ink_strong, ui_line_strong, ui_white } from '../../../css/uiTokens'

/** Largeur de la colonne de légende, en px d'écran. */
export const SANKEY_LEGEND_PANEL_PX = 240

// Même teinte qu'une ligne décochée de la légende des couronnes (`Charts/legendChecks.ts`).
const UNCHECKED_SWATCH = ui_line_strong
const UNCHECKED_INK = ui_ink_disabled
const INK = ui_ink_strong
const HOVER_BG = ui_bg_subtle
const INDENT_EM = 1

/** Les entrées du panneau, relues à chaque régénération de la légende. */
export const useSankeyLegendItems = (app_data: Class_ApplicationData): readonly Type_LegendItem[] => {
  const legend = app_data.drawing_area.legend
  const [, refresh] = React.useReducer((n: number) => n + 1, 0)
  React.useEffect(() => legend.subscribePanel(refresh), [legend])
  return legend.panel_items
}

// Le préfixe « ☑ / ☐ » que la légende dessinée écrit en tête d'un membre de dimension (os#1526) : ici
// la vraie case le remplace.
const textOf = (item: Type_LegendItem): string =>
  item.checked !== undefined ? item.text.replace(/^[☑☐]\s*/, '') : item.text

/**
 * L'échelle : un trait dont la hauteur est l'épaisseur d'un flux de la valeur écrite, AU ZOOM COURANT
 * (50 px monde, cf. SCALE_BAR_HEIGHT_PX). Abonné seul au zoom : un tick ne redessine que lui.
 */
const ScaleBar = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const [, refresh] = React.useReducer((n: number) => n + 1, 0)
  React.useEffect(() => app_data.menu_configuration.subscribe(ZOOM_TOPIC, refresh), [app_data])
  const h = Math.max(4, Math.min(160, 50 * (app_data.drawing_area.getZoomScale?.() ?? 1)))
  return <svg width={8} height={h} style={{ flex: '0 0 auto' }} aria-hidden>
    <rect x={3} y={0} width={2} height={h} fill='black' />
  </svg>
}

// Les hachures d'un nœud (`shape_hatch`), dans l'orientation du style : un motif de traits.
const HATCH_ANGLE: { [k: string]: number } = { vertical: 0, horizontal: 90, diagonal: 45, antidiagonal: -45 }

const Swatch = ({ app_data, item, unchecked }: { app_data: Class_ApplicationData, item: Type_LegendItem, unchecked: boolean }) => {
  const pattern_id = React.useId().replace(/:/g, '_')
  if (item.scale_bar === true) return <ScaleBar app_data={app_data} />
  const swatch = item.format?.swatch
  const color = unchecked ? UNCHECKED_SWATCH : (swatch?.color ?? item.swatch_color)
  const icon = item.format?.icon
  if (color === undefined && icon === undefined) return null
  const value = item.format?.value
  const has_value = value !== undefined
  // os#1527 — la pastille de la légende des couronnes : 0,7 em de côté, coins de 2 px (cf.
  // `appendDonutLegendRows`) ; élargie quand elle porte la valeur d'exemple.
  const w = has_value ? 30 : 14
  const h = 14
  const border = swatch?.border_visible === true
  const dashed = swatch?.border_dashed === true || swatch?.link_dashed === true
  const hatch = swatch?.hatch !== undefined && swatch.hatch !== 'none' ? HATCH_ANGLE[swatch.hatch] : undefined
  const ink = unchecked ? UNCHECKED_INK : ui_ink
  // L'icône par son nom : le tracé du catalogue du diagramme, comme sur un nœud (`DrawLabel`).
  const icon_path = icon !== undefined && !icon.is_image && icon.icon_name
    ? app_data.drawing_area.sankey.getIconFromCatalog(icon.icon_name) as string | undefined
    : undefined
  return <svg width={`${(0.7 * w) / h}em`} height='0.7em' viewBox={`0 0 ${w} ${h}`}
    style={{ flex: '0 0 auto', marginTop: '0.15em' }} aria-hidden>
    {hatch !== undefined
      ? <defs>
        <pattern id={pattern_id} width={3} height={3} patternUnits='userSpaceOnUse' patternTransform={`rotate(${hatch})`}>
          <rect width={3} height={3} fill={color ?? 'none'} />
          <line x1={0} y1={0} x2={0} y2={3} stroke={ink} strokeWidth={1} />
        </pattern>
      </defs>
      : null}
    <rect
      x={0.5} y={0.5} width={w - 1} height={h - 1} rx={2}
      fill={hatch !== undefined ? `url(#${pattern_id})` : (color ?? 'none')}
      fillOpacity={unchecked ? 1 : (swatch?.opacity ?? 1)}
      stroke={border || dashed ? (swatch?.border_color ?? ui_ink_secondary) : 'none'}
      strokeWidth={border ? Math.min(3, swatch?.border_thickness ?? 1) : 1}
      strokeDasharray={dashed ? '3 2' : undefined}
    />
    {icon?.is_image === true && icon.image_src !== undefined
      ? <image href={icon.image_src} x={1} y={1} width={h - 2} height={h - 2} />
      : null}
    {icon_path !== undefined && icon_path !== ''
      ? <svg x={1} y={1} width={h - 2} height={h - 2} viewBox={icon?.view_box || '0 0 24 24'}>
        <path d={icon_path} fill={unchecked ? UNCHECKED_INK : (icon?.color ?? ink)} />
      </svg>
      : null}
    {has_value
      ? <text x={w / 2} y={h / 2} dominantBaseline='central' textAnchor='middle' fontSize={9}
        fill={value?.color ?? INK} fontWeight={value?.bold === true ? 700 : 400}
        fontStyle={value?.italic === true ? 'italic' : undefined}
        fontFamily={value?.font_family || undefined}
      >{value?.uppercase === true ? LEGEND_SAMPLE_VALUE.toLocaleUpperCase() : LEGEND_SAMPLE_VALUE}</text>
      : null}
  </svg>
}

const LegendRow = ({ app_data, item }: {
  app_data: Class_ApplicationData
  item: Type_LegendItem
}) => {
  const legend = app_data.drawing_area.legend
  const [editing, setEditing] = React.useState(false)
  const [hover, setHover] = React.useState(false)
  const toggles = legend.isToggleEntry(item.id)
  const checked = item.checked ?? item.dimmed !== true
  const unchecked = toggles && !checked
  const is_title = legend.tagGroupIdOfTitle(item.id) !== undefined
  const is_dimension_choice = item.dimension_choice === true && isLegendDimensionZoneId(item.id)
  const clickable = toggles || is_title || is_dimension_choice
  const name_format = item.format?.name
  const text = textOf(item)

  // Simple clic CONFIRMÉ quand la ligne se renomme aussi au double-clic, comme sur la zone dessinée :
  // un double-clic ne doit pas basculer deux fois l'étiquette avant de l'éditer.
  const click_timer = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => window.clearTimeout(click_timer.current), [])

  const act = (anchor: { x: number, y: number }) => {
    if (toggles) { legend.toggleEntryTag(item.id); return }
    if (is_title) {
      const zone = app_data.drawing_area.sankey.containers_dict[item.id]
      if (zone !== undefined) openPresentationFor(app_data, zone as unknown as Parameters<typeof openPresentationFor>[1], anchor)
      return
    }
    if (is_dimension_choice) openLegendDimensionChoice(app_data, item.id, anchor)
  }
  const onClick = (evt: React.MouseEvent) => {
    if (editing || !clickable) return
    const rect = (evt.currentTarget as HTMLElement).getBoundingClientRect()
    const anchor = { x: rect.left, y: rect.bottom }
    window.clearTimeout(click_timer.current)
    if (!legend.canRenameEntry(item.id)) { act(anchor); return }
    click_timer.current = window.setTimeout(() => act(anchor), 250)
  }

  const label_style: React.CSSProperties = {
    flex: '1 1 auto', minWidth: 0, overflowWrap: 'anywhere',
    fontWeight: item.bold === true || name_format?.bold === true ? 600 : 400,
    fontStyle: name_format?.italic === true || item.pinned === true ? 'italic' : undefined,
    textTransform: name_format?.uppercase === true ? 'uppercase' : undefined,
    fontFamily: name_format?.font_family,
    color: unchecked ? UNCHECKED_INK : (name_format?.color ?? INK)
  }
  const label = editing
    ? <input
      autoFocus defaultValue={text} style={{ ...label_style, font: 'inherit', width: '100%' }}
      onClick={e => e.stopPropagation()}
      onBlur={e => { legend.renameEntry(item.id, e.currentTarget.value); setEditing(false) }}
      onKeyDown={e => {
        if (e.key === 'Enter') e.currentTarget.blur()
        if (e.key === 'Escape') setEditing(false)
      }}
    />
    : item.pinned_name !== undefined
      ? <span style={label_style}>
        <span style={{ textDecoration: 'underline' }}>{item.pinned_name}</span>
        {text.slice(item.pinned_name.length)}
      </span>
      : <span style={label_style}>{text}</span>

  return <div
    className='sankey_legend_panel_row'
    data-legend-id={item.id}
    title={item.description || undefined}
    role={toggles ? 'menuitemcheckbox' : undefined}
    aria-checked={toggles ? checked : undefined}
    style={{
      // os#1527 — mêmes mesures qu'une ligne de la légende des couronnes (`appendDonutLegendRows`).
      display: 'flex', alignItems: 'flex-start', gap: '0.35rem',
      padding: '0.1rem 0.2rem', borderRadius: '0.2rem',
      marginTop: item.starts_group === true || is_title ? '0.5rem' : 0,
      paddingLeft: `calc(0.2rem + ${(item.indent ?? 0) * INDENT_EM}em)`,
      cursor: clickable ? 'pointer' : 'default',
      background: hover && clickable ? HOVER_BG : undefined
    }}
    onMouseEnter={() => { setHover(true); if (!item.heading) legend.highlightEntry(item.id) }}
    onMouseLeave={() => { setHover(false); legend.clearHighlight() }}
    onClick={onClick}
    onDoubleClick={evt => {
      if (!legend.canRenameEntry(item.id)) return
      evt.preventDefault()
      window.clearTimeout(click_timer.current)
      setEditing(true)
    }}
  >
    {toggles
      ? <input
        type='checkbox' checked={checked} readOnly tabIndex={-1}
        style={{ margin: '0.1em 0 0', flex: '0 0 auto', cursor: 'pointer' }}
      />
      : null}
    {item.heading === true ? null : <Swatch app_data={app_data} item={item} unchecked={unchecked} />}
    {label}
    {/* os#1511 (Jean-Yves, 09/10) — un ▾ dit que la valeur se change (« Année : 2023 ▾ »). */}
    {is_dimension_choice && !editing
      ? <span className='sankey_legend_panel_choice' style={{ flex: '0 0 auto', color: ui_ink_muted, fontSize: '0.75em', marginTop: '0.15em' }}>▾</span>
      : null}
    {is_title ? <PaintFlowsButton app_data={app_data} group_id={legend.tagGroupIdOfTitle(item.id)} /> : null}
  </div>
}

/**
 * os#1511 — LE PINCEAU d'un titre de dimension, sous un diagramme par membre : c'est elle qui peint
 * les flux (Julien, 07/10 : « il faut pouvoir choisir dans la légende, et le premier choix c'est
 * Ressources et emplois qui peint les branches, et pas les diagrammes »). Plein = elle peint.
 */
const PaintFlowsButton = ({ app_data, group_id }: { app_data: Class_ApplicationData, group_id: string | undefined }) => {
  const sankey = app_data.drawing_area.sankey
  const group = group_id === undefined ? undefined
    : (sankey.data_taggs_list as Class_DataTagGroup[]).find(g => g.id === group_id)
  if (group === undefined || !group.may_paint_member_bands_flows) return null
  const paints = group.paints_member_bands_flows
  const t = app_data.t as ((key: string) => string) | undefined
  const title = t ? t('Banner.legend_paints_flows') : ''
  return <button
    type='button'
    title={title || undefined}
    aria-label={title || undefined}
    aria-pressed={paints}
    onClick={evt => {
      evt.stopPropagation()
      if (!paints) applyMembersColorFlows(app_data, group, true)
    }}
    style={{
      flex: '0 0 auto', marginLeft: 'auto', padding: '0 0.2rem', border: 'none', borderRadius: '0.2rem',
      background: paints ? '#2c7a7b' : 'transparent', color: paints ? ui_white : UNCHECKED_INK,
      cursor: paints ? 'default' : 'pointer', lineHeight: 1
    }}
  >
    <svg width='12' height='12' viewBox='0 0 16 16' aria-hidden='true'>
      <path fill='currentColor' d='M14.6 1.4a1.4 1.4 0 0 0-2 0L6.8 7.2l2 2 5.8-5.8a1.4 1.4 0 0 0 0-2zM5.9 8.1c-1.6 0-2.9 1.3-2.9 2.9 0 1.2-.8 2-2 2 .8 1 2 1.6 3.4 1.6 2.3 0 4.1-1.8 4.1-4.1L5.9 8.1z' />
    </svg>
  </button>
}

/**
 * Le contenu de la colonne de légende du diagramme. L'hôte (grande zone de l'éditeur) le pose à
 * côté du dessin et lui réserve sa place ; vide quand la légende est masquée.
 */
export const SankeyLegendPanel = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const legend = app_data.drawing_area.legend
  const items = colouredLegendItems(app_data, useSankeyLegendItems(app_data))
  // Le FOND et le CADRE réglés pour la légende (menu Légende) : ceux du panneau.
  const bg_opacity = legend.legend_bg_opacity / 100
  return <div
    className='sankey_legend_panel'
    style={{
      // os#1527 — le corps de la légende des couronnes était à 14 px ; os#1511 (Julien, 10/10 : « il y a
      // moyen de jouer sur des polices plus petites ») — 12 px, sous la navigation (11 px) de la colonne.
      fontSize: '12px', color: INK,
      padding: '0.25rem 0.5rem 0.5rem', userSelect: 'none',
      background: bg_opacity > 0 ? hexWithOpacity(legend.legend_bg_color, bg_opacity) : undefined,
      border: legend.legend_bg_border ? `1px solid ${ui_ink_disabled}` : undefined,
      borderRadius: legend.legend_bg_border ? '0.25rem' : undefined
    }}
  >
    <GapSlider app_data={app_data} />
    <FlowColorSelect app_data={app_data} />
    {items.map(item => <LegendRow key={item.id} app_data={app_data} item={item} />)}
  </div>
}

/**
 * os#1511 (Julien, 10/10 : « je ne pense pas qu'il faille garder la légende pour les choses qui ne
 * sont pas de la couleur ») — LA COLONNE NE LÉGENDE QUE CE QUI EST EN COULEUR : une dimension de
 * données n'y paraît que si ses couleurs se voient sur le dessin (bandes à plusieurs membres, ou
 * c'est elle qui peint les flux). Les autres se choisissent dans la navigation, en haut de la même
 * colonne. Les zones de légende du MODÈLE (exports) ne changent pas.
 */
export const colouredLegendItems = (app_data: Class_ApplicationData, items: readonly Type_LegendItem[]): readonly Type_LegendItem[] => {
  const legend = app_data.drawing_area.legend
  // os#1511 (Julien, 10/10 : « la légende montre le dataTag qui porte la couleur ») — UNE seule
  // dimension : celle qui fait des bandes à plusieurs membres colore les flux à la place de toute
  // autre ; sans bandes, celle qui peint les flux.
  const dims = app_data.drawing_area.sankey.data_taggs_list as Class_DataTagGroup[]
  const colorer = dims.find(g => g.draws_bands && g.selected_tags_list.length > 1)
    ?? dims.find(g => g.paints_member_bands_flows)
  const hidden = new Set(dims.filter(g => g !== colorer).map(g => g.id))
  if (hidden.size === 0) return items
  return items.filter(item => {
    const group = item.tag_group_id ?? legend.tagGroupIdOfTitle(item.id)
    return group === undefined || !hidden.has(group)
  })
}

/**
 * os#1511 (Jean-Yves, 09/10 : « ce n'est pas clair comment on choisit comment on colorie le
 * diagramme ») — LA DIMENSION QUI COLORE LES FLUX, dite et choisie en haut de la légende. Mêmes
 * candidates et même geste que le pinceau des titres (`PaintFlowsButton`).
 */
const FlowColorSelect = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const groups = (app_data.drawing_area.sankey.data_taggs_list as Class_DataTagGroup[])
    .filter(g => g.may_paint_member_bands_flows)
  if (groups.length === 0) return null
  const current = groups.find(g => g.paints_member_bands_flows)
  const t = app_data.t as ((key: string, o?: { [k: string]: unknown }) => string) | undefined
  const label = (t ? t('Banner.legend_flow_color', { defaultValue: 'Couleur des flux' }) : '') || 'Couleur des flux'
  return <label
    className='sankey_legend_panel_flow_color'
    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85em', margin: '0.2rem 0 0.4rem' }}
  >
    <span style={{ flex: '0 0 auto' }}>{label}</span>
    <select
      value={current?.id ?? ''}
      style={{ flex: '1 1 auto', minWidth: 0, font: 'inherit' }}
      onChange={evt => {
        const group = groups.find(g => g.id === evt.currentTarget.value)
        if (group !== undefined) applyMembersColorFlows(app_data, group, true)
      }}
    >
      {current === undefined ? <option value=''>—</option> : null}
      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
    </select>
  </label>
}

/**
 * os#1511 — L'ÉCART VERTICAL ENTRE LES NŒUDS, en haut de la légende, comme le curseur « Spacing » de
 * SankeyMATIC (Julien, 07/10). Offert dès qu'une dimension se dessine en nœuds. Le dessin suit le
 * curseur ; un seul pas d'historique par geste, au relâcher.
 */
const GapSlider = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const da = app_data.drawing_area
  const [value, setValue] = React.useState(da.disaggregation_gap_value)
  const start = React.useRef<number | undefined>(undefined)
  const frame = React.useRef<number | undefined>(undefined)
  React.useEffect(() => () => { if (frame.current !== undefined) cancelAnimationFrame(frame.current) }, [])
  const en_noeuds = da.sankey.data_taggs_list.some(tagg => (tagg as unknown as { drawing?: string }).drawing === 'nodes')
  if (!en_noeuds) return null
  const apply = (v: number) => {
    da.disaggregation_gap_value = v
    da.rebuildDimensionNodes()
    da.draw()
  }
  const commit = () => {
    const before = start.current
    start.current = undefined
    const after = da.disaggregation_gap_value
    if (before === undefined || before === after) return
    app_data.history.saveUndo(() => { apply(before); setValue(before) })
    app_data.history.saveRedo(() => { apply(after); setValue(after) })
  }
  const t = app_data.t as ((key: string) => string) | undefined
  const label = (t ? t('MEP.childGapValue') : '') || 'Écart'
  const max = Math.max(150, Math.ceil(value * 1.5))
  return <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85em', margin: '0.2rem 0 0.4rem' }}>
    <span style={{ flex: '0 0 auto' }}>{label}</span>
    <input
      type='range' min={0} max={max} step={1} value={value}
      style={{ flex: '1 1 auto', minWidth: 0 }}
      onPointerDown={() => { if (start.current === undefined) start.current = da.disaggregation_gap_value }}
      onKeyDown={() => { if (start.current === undefined) start.current = da.disaggregation_gap_value }}
      onChange={evt => {
        const v = Number(evt.currentTarget.value)
        if (start.current === undefined) start.current = da.disaggregation_gap_value
        setValue(v)
        if (frame.current !== undefined) cancelAnimationFrame(frame.current)
        frame.current = requestAnimationFrame(() => { frame.current = undefined; apply(v) })
      }}
      onPointerUp={commit}
      onKeyUp={commit}
    />
    <span style={{ flex: '0 0 2.2em', textAlign: 'right', color: UNCHECKED_INK }}>{value}</span>
  </label>
}

/** `#rrggbb` (ou nom de couleur) avec une opacité : `color-mix`, que tous les navigateurs servis lisent. */
const hexWithOpacity = (color: string, opacity: number): string =>
  opacity >= 1 ? color : `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`
