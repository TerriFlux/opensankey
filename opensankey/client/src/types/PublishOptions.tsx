// ==================================================================================================
// The MIT License (MIT)
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Source unique de vérité pour les options injectées via `window.sankey` côté serveur.
// `window.sankey` est `undefined` en session édition normale ; il n'est défini que sur
// les pages générées par "publish".
//
// Les mêmes options peuvent aussi être passées en props aux Viewers React
// (ViewerOpenSankeyApp / ViewerSankeyApplication) : voir applyViewerOptions().
// ==================================================================================================

// Modes de navigation / positionnement (cf. DrawingArea.setAbsoluteMode / setProportionalMode /
// setScaleAdaptedMode et styles_dict['default'].shape_position_type).
export type Type_PositionMode = 'absolute' | 'proportional' | 'scale_adapted'

export interface SankeyGlobals {
  // Mode
  publish?: boolean      // true => is_static
  editable?: boolean     // override : réactive édition + menus de configuration en publish

  // Layout / chrome
  topbar?: boolean       // default true
  footer?: boolean       // default false
  toolbar?: boolean      // default false : groupe des modes de position (absolu/proportionnel/échelle) dans la barre du bas
  fit_toolbar?: boolean  // default false : groupe ajustement/verrous/plein écran dans la barre du bas
  filter_bar?: boolean   // default true : barre de filtres à gauche (drawer)
  embedded?: boolean     // default false (height = innerHeight) ; true => 100%
  recenter?: boolean     // default true : auto-recenter à l'ouverture en publish
  edit_button?: boolean  // default true : bouton "Éditer" (renvoi vers open-sankey.fr) dans la topbar en publish

  // Branding
  logo?: string
  header?: string        // HTML brut injecté en haut

  // Diagrammes
  diagram?: string | Record<string, unknown> // URL d'un JSON à charger, OU objet JSON inline
  diagram_layout?: string                    // URL d'un layout à surimprimer
  diagram_layout_options?: string[]
  diagrams_list?: Record<string, string>    // dropdown multi-diagrammes (clés "a/b" pour groupage)
  /** @deprecated utiliser `diagrams_list` */
  sous_filieres?: Record<string, string>

  // Filtres
  data_type?: boolean             // default true
  data_type_intervals?: boolean   // default true
  value_filter?: boolean          // default true

  // État initial
  position_mode?: Type_PositionMode  // mode de navigation imposé à l'ouverture (absolu/proportionnel/échelle adaptée)
  data_tag_selection?: Record<string, string>  // { groupe (id ou nom) : tag (id ou nom) } préselectionné à l'ouverture

  // Indexer pour configs per-diagramme (diagrams_list etc.)
  [key: string]: unknown
}

export interface PublishOptions {
  publish: boolean
  editable: boolean
  topbar: boolean
  footer: boolean
  toolbar: boolean
  fit_toolbar: boolean
  filter_bar: boolean
  embedded: boolean
  recenter: boolean
  edit_button: boolean
  data_type: boolean
  data_type_intervals: boolean
  value_filter: boolean
  position_mode: Type_PositionMode | null
  data_tag_selection: Record<string, string> | null
  logo: string | null
  header: string | null
  diagram: string | Record<string, unknown> | null
  diagram_layout: string | null
  diagram_layout_options: string[] | null
  diagrams_list: Record<string, string> | null
}

declare global {
  interface Window {
    sankey?: SankeyGlobals
  }
}

const bool = (v: unknown, def: boolean): boolean => (typeof v === 'boolean' ? v : def)
const str = (v: unknown): string | null => (typeof v === 'string' ? v : null)
const POSITION_MODES: Type_PositionMode[] = ['absolute', 'proportional', 'scale_adapted']
const posMode = (v: unknown): Type_PositionMode | null =>
  (typeof v === 'string' && (POSITION_MODES as string[]).includes(v)) ? v as Type_PositionMode : null
const strRecord = (v: unknown): Record<string, string> | null => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const out: Record<string, string> = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === 'string') out[k] = val
  }
  return Object.keys(out).length > 0 ? out : null
}

let _warned_sous_filieres = false

export const getPublishOptions = (): PublishOptions => {
  const s = window.sankey ?? {}
  // Alias rétrocompat : sous_filieres → diagrams_list
  let diagrams_list_value: Record<string, string> | null = null
  if (s.diagrams_list && typeof s.diagrams_list === 'object') {
    diagrams_list_value = s.diagrams_list as Record<string, string>
  } else if (s.sous_filieres && typeof s.sous_filieres === 'object') {
    diagrams_list_value = s.sous_filieres as Record<string, string>
    if (!_warned_sous_filieres) {
      _warned_sous_filieres = true
      // eslint-disable-next-line no-console
      console.warn('[OpenSankey] `window.sankey.sous_filieres` est déprécié, utiliser `diagrams_list`.')
    }
  }
  return {
    publish: bool(s.publish, false),
    editable: bool(s.editable, false),
    topbar: bool(s.topbar, true),
    footer: bool(s.footer, false),
    toolbar: bool(s.toolbar, false),
    fit_toolbar: bool(s.fit_toolbar, false),
    filter_bar: bool(s.filter_bar, true),
    embedded: bool(s.embedded, false),
    recenter: bool(s.recenter, true),
    edit_button: bool(s.edit_button, true),
    data_type: bool(s.data_type, true),
    data_type_intervals: bool(s.data_type_intervals, true),
    value_filter: bool(s.value_filter, true),
    position_mode: posMode(s.position_mode),
    data_tag_selection: strRecord(s.data_tag_selection),
    logo: str(s.logo),
    header: str(s.header),
    diagram: (typeof s.diagram === 'string')
      ? s.diagram
      : (s.diagram && typeof s.diagram === 'object' && !Array.isArray(s.diagram))
        ? (s.diagram as Record<string, unknown>)
        : null,
    diagram_layout: str(s.diagram_layout),
    diagram_layout_options: Array.isArray(s.diagram_layout_options)
      ? (s.diagram_layout_options as string[])
      : null,
    diagrams_list: diagrams_list_value,
  }
}

// ==================================================================================================
// Viewer props : sous-ensemble de SankeyGlobals utilisable comme props React.
// Les props ont priorité sur window.sankey ; applyViewerOptions() merge dans window.sankey
// avant la lecture par getPublishOptions().
// ==================================================================================================

export type ViewerSankeyOptions = {
  editable?: boolean
  topbar?: boolean
  footer?: boolean
  toolbar?: boolean
  fit_toolbar?: boolean
  filter_bar?: boolean
  embedded?: boolean
  recenter?: boolean
  edit_button?: boolean
  logo?: string
  header?: string
  diagram?: string | Record<string, unknown>
  diagram_layout?: string
  diagram_layout_options?: string[]
  diagrams_list?: Record<string, string>
  /** @deprecated utiliser `diagrams_list` */
  sous_filieres?: Record<string, string>
  data_type?: boolean
  data_type_intervals?: boolean
  value_filter?: boolean
  position_mode?: Type_PositionMode
  data_tag_selection?: Record<string, string>
  // Configs per-diagramme (clé = nom dans diagrams_list)
  diagrams_config?: Record<string, Record<string, unknown>>
}

/**
 * Merge des props Viewer dans window.sankey (force `publish: true`).
 * Props prioritaires : une clé fournie en prop écrase la valeur existante de window.sankey.
 */
export const applyViewerOptions = (options: ViewerSankeyOptions = {}): void => {
  const w = window as unknown as { sankey?: SankeyGlobals }
  const current = (w.sankey ?? {}) as SankeyGlobals
  const next: SankeyGlobals = { ...current, publish: true }

  const keys: Array<keyof ViewerSankeyOptions> = [
    'editable', 'topbar', 'footer', 'toolbar', 'fit_toolbar', 'filter_bar', 'embedded', 'recenter',
    'edit_button',
    'logo', 'header', 'diagram', 'diagram_layout', 'diagram_layout_options',
    'diagrams_list', 'sous_filieres',
    'data_type', 'data_type_intervals', 'value_filter',
    'position_mode', 'data_tag_selection',
  ]
  for (const k of keys) {
    if (options[k] !== undefined) {
      (next as Record<string, unknown>)[k as string] = options[k] as unknown
    }
  }
  if (options.diagrams_config) {
    for (const [name, cfg] of Object.entries(options.diagrams_config)) {
      (next as Record<string, unknown>)[name] = cfg
    }
  }
  w.sankey = next
}
