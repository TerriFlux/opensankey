// ==================================================================================================
// The MIT License (MIT)
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Source unique de vérité pour les options injectées via `window.sankey` côté serveur.
// `window.sankey` est `undefined` en session édition normale ; il n'est défini que sur
// les pages générées par "publish".
// ==================================================================================================

export interface SankeyGlobals {
  // Mode
  publish?: boolean      // true => is_static
  editable?: boolean     // override : réactive édition + menus de configuration en publish

  // Layout / chrome
  topbar?: boolean       // default true
  footer?: boolean       // default false
  toolbar?: boolean      // default false
  embedded?: boolean     // default false (height = innerHeight) ; true => 100%
  recenter?: boolean     // default true : auto-recenter à l'ouverture en publish

  // Branding
  logo?: string
  header?: string        // HTML brut injecté en haut

  // Diagrammes
  diagram?: string                          // URL d'un JSON à charger
  diagram_layout?: string                   // URL d'un layout à surimprimer
  diagram_layout_options?: string[]
  sous_filieres?: Record<string, string>

  // Filtres
  data_type?: boolean             // default true
  data_type_intervals?: boolean   // default true
  value_filter?: boolean          // default true

  // Indexer pour diagrammes accessibles dynamiquement (sous_filieres etc.)
  [key: string]: unknown
}

export interface PublishOptions {
  publish: boolean
  editable: boolean
  topbar: boolean
  footer: boolean
  toolbar: boolean
  embedded: boolean
  recenter: boolean
  data_type: boolean
  data_type_intervals: boolean
  value_filter: boolean
  logo: string | null
  header: string | null
  diagram: string | null
  diagram_layout: string | null
  diagram_layout_options: string[] | null
  sous_filieres: Record<string, string> | null
}

declare global {
  interface Window {
    sankey?: SankeyGlobals
  }
}

const bool = (v: unknown, def: boolean): boolean => (typeof v === 'boolean' ? v : def)
const str = (v: unknown): string | null => (typeof v === 'string' ? v : null)

export const getPublishOptions = (): PublishOptions => {
  const s = window.sankey ?? {}
  return {
    publish: bool(s.publish, false),
    editable: bool(s.editable, false),
    topbar: bool(s.topbar, true),
    footer: bool(s.footer, false),
    toolbar: bool(s.toolbar, false),
    embedded: bool(s.embedded, false),
    recenter: bool(s.recenter, true),
    data_type: bool(s.data_type, true),
    data_type_intervals: bool(s.data_type_intervals, true),
    value_filter: bool(s.value_filter, true),
    logo: str(s.logo),
    header: str(s.header),
    diagram: str(s.diagram),
    diagram_layout: str(s.diagram_layout),
    diagram_layout_options: Array.isArray(s.diagram_layout_options)
      ? (s.diagram_layout_options as string[])
      : null,
    sous_filieres: (s.sous_filieres && typeof s.sous_filieres === 'object')
      ? (s.sous_filieres as Record<string, string>)
      : null,
  }
}
