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
  toolbar?: boolean      // default false : sélecteurs du mode d'affichage (absolu/proportionnel/échelle) — un par dimension, sur chacun de ses hôtes : ligne du panneau Filtres, topbar, frise de séquence (cf. #370)
  // default TRUE (08/08) : groupe ajustement/verrous + indicateur de zoom dans la
  // barre du bas. Il l'était à false, et une page publiée n'offrait alors AUCUN
  // moyen visible de zoomer ni de recadrer — seulement Ctrl+molette, qui ne
  // s'annonce nulle part, et rien pour revenir quand la vue est perdue. Une page
  // qui n'en veut pas pose `fit_toolbar: false`.
  fit_toolbar?: boolean
  fullscreen?: boolean   // default true : bouton plein écran isolé en publish, même quand `fit_toolbar` est masqué
  filter_bar?: boolean   // default true : barre de filtres à gauche (drawer)
  embedded?: boolean     // default false (height = innerHeight) ; true => 100%
  recenter?: boolean     // default true : auto-recenter à l'ouverture en publish
  edit_button?: boolean  // default true : bouton "Éditer" (renvoi vers open-sankey.fr) dans la topbar en publish
  unitary?: boolean      // default false : onglet « Unit. » (sankey unitaire OS+) dans la topbar en publish
  doc?: boolean          // default false : bouton « Doc » (panneau documentation) dans la topbar en publish, visible seulement si une doc existe
  navigation_help?: boolean  // default false : bouton « Aide à la navigation » dans la topbar en publish
  badge?: boolean        // default true : badge « Made with OpenSankey » (lien terriflux.com) en bas à gauche en publish

  // Langue
  language?: string      // force la langue de l'UI ('fr', 'en', ...) ; le paramètre d'URL ?lang= est prioritaire

  // Branding
  logo?: string
  header?: string        // HTML brut injecté en haut
  header_i18n?: Record<string, string>  // variantes du header par langue ({en: '...', ...}) ; prioritaire sur header pour la langue effective

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
  view_filter?: boolean           // default true : section "génération de vues" (view_taggs) dans le drawer
  level_filter?: boolean          // default true : section "niveaux/hiérarchies" (level_taggs) dans le drawer
  node_filter?: boolean           // default true : section "tags d'éléments" (node/flux_taggs) dans le drawer
  data_filter?: boolean           // default true : section "sélection de données" (data_taggs) dans le drawer

  // Interaction (viewer publish)
  lock_zoom?: boolean             // default false : bloque le zoom molette/scale (le pan au bouton milieu reste actif)
  tooltip_on_hover?: boolean      // default false : affiche les tooltips au simple survol, sans maintenir Shift
  // OS#305 — le déclencheur/délai de la présentation composée ne sont PAS ici :
  // ce sont des réglages d'AUTEUR, enregistrés dans le diagramme (cf.
  // Class_PanelManager), alors que ce bloc-ci est une config viewer read-only.

  // État initial
  // sa#373 — plancher d'épaisseur des flux (px) imposé à l'ouverture, prioritaire sur la
  // valeur enregistrée dans le diagramme. 0 est valide (flux tracés à leur épaisseur réelle) ;
  // omettre la clé laisse le réglage du document (ou le défaut 2px).
  minimum_flux?: number
  position_mode?: Type_PositionMode  // mode de navigation imposé à l'ouverture (absolu/proportionnel/échelle adaptée)
  data_tag_selection?: Record<string, string>  // { groupe (id ou nom) : tag (id ou nom) } préselectionné à l'ouverture
  view_tag_selection?: Record<string, string>  // { groupe (id ou nom) : valeur } : sélectionne une VUE (nom OU id, light/heavy) comme le sélecteur de vue ; sinon filtre le view tag sur ce tag

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
  fullscreen: boolean
  filter_bar: boolean
  embedded: boolean
  recenter: boolean
  edit_button: boolean
  unitary: boolean
  doc: boolean
  navigation_help: boolean
  badge: boolean
  data_type: boolean
  data_type_intervals: boolean
  value_filter: boolean
  view_filter: boolean
  level_filter: boolean
  node_filter: boolean
  data_filter: boolean
  lock_zoom: boolean
  tooltip_on_hover: boolean
  language: string | null
  minimum_flux: number | null
  position_mode: Type_PositionMode | null
  data_tag_selection: Record<string, string> | null
  view_tag_selection: Record<string, string> | null
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
// sa#373 — nombre positif ou nul (0 = valeur légitime pour le plancher d'épaisseur).
// Une chaîne numérique est acceptée : la page publiée est écrite à la main aussi souvent
// qu'elle est générée.
const num = (v: unknown): number | null => {
  const n = (typeof v === 'number') ? v : (typeof v === 'string' && v.trim() !== '') ? Number(v) : NaN
  return (Number.isFinite(n) && n >= 0) ? n : null
}
const POSITION_MODES: Type_PositionMode[] = ['absolute', 'proportional', 'scale_adapted']
/**
 * #370 — Garde de type des trois modes proposés par le sélecteur. Exporté depuis que le
 * mode est porté par chaque dimension (`Class_DataTagGroup.position_mode`) et relu d'un
 * fichier : une valeur inconnue, ou l'ancien mode hérité `parametric`, doit être rejetée
 * plutôt que castée à l'aveugle.
 */
export const isPositionMode = (v: unknown): v is Type_PositionMode =>
  typeof v === 'string' && (POSITION_MODES as string[]).includes(v)
const posMode = (v: unknown): Type_PositionMode | null => (isPositionMode(v) ? v : null)
const strRecord = (v: unknown): Record<string, string> | null => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null
  const out: Record<string, string> = {}
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === 'string') out[k] = val
  }
  return Object.keys(out).length > 0 ? out : null
}

let _warned_sous_filieres = false

// Langue effective côté page publiée : ?lang= > window.sankey.language > préférence
// mémorisée (i18nextLng) > navigateur. Utilisée pour résoudre header_i18n.
const _effectiveLang = (): string | null => {
  try {
    const url_lang = new URLSearchParams(window.location.search).get('lang')
    if (url_lang) return url_lang
  } catch { /* environnement sans URL */ }
  if (typeof window.sankey?.language === 'string') return window.sankey.language
  try {
    const saved = localStorage.getItem('i18nextLng')
    if (saved) return saved.slice(0, 2)
  } catch { /* localStorage indisponible */ }
  return (typeof navigator !== 'undefined' && navigator.language)
    ? navigator.language.slice(0, 2)
    : null
}

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
  // header : variante traduite (header_i18n[langue effective]) prioritaire
  let header_value = str(s.header)
  if (s.header_i18n && typeof s.header_i18n === 'object' && !Array.isArray(s.header_i18n)) {
    const lang = _effectiveLang()
    const translated = lang ? (s.header_i18n as Record<string, unknown>)[lang] : undefined
    if (typeof translated === 'string') header_value = translated
  }
  return {
    publish: bool(s.publish, false),
    editable: bool(s.editable, false),
    topbar: bool(s.topbar, true),
    footer: bool(s.footer, false),
    toolbar: bool(s.toolbar, false),
    fit_toolbar: bool(s.fit_toolbar, true),
    fullscreen: bool(s.fullscreen, true),
    filter_bar: bool(s.filter_bar, true),
    embedded: bool(s.embedded, false),
    recenter: bool(s.recenter, true),
    edit_button: bool(s.edit_button, true),
    unitary: bool(s.unitary, false),
    doc: bool(s.doc, false),
    navigation_help: bool(s.navigation_help, false),
    badge: bool(s.badge, true),
    data_type: bool(s.data_type, true),
    data_type_intervals: bool(s.data_type_intervals, true),
    value_filter: bool(s.value_filter, true),
    view_filter: bool(s.view_filter, true),
    level_filter: bool(s.level_filter, true),
    node_filter: bool(s.node_filter, true),
    data_filter: bool(s.data_filter, true),
    lock_zoom: bool(s.lock_zoom, false),
    tooltip_on_hover: bool(s.tooltip_on_hover, false),
    language: str(s.language),
    minimum_flux: num(s.minimum_flux),
    position_mode: posMode(s.position_mode),
    data_tag_selection: strRecord(s.data_tag_selection),
    view_tag_selection: strRecord(s.view_tag_selection),
    logo: str(s.logo),
    header: header_value,
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
  fullscreen?: boolean
  filter_bar?: boolean
  embedded?: boolean
  recenter?: boolean
  edit_button?: boolean
  unitary?: boolean
  doc?: boolean
  navigation_help?: boolean
  badge?: boolean
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
  view_filter?: boolean
  level_filter?: boolean
  node_filter?: boolean
  data_filter?: boolean
  lock_zoom?: boolean
  tooltip_on_hover?: boolean
  language?: string
  header_i18n?: Record<string, string>
  minimum_flux?: number
  position_mode?: Type_PositionMode
  data_tag_selection?: Record<string, string>
  view_tag_selection?: Record<string, string>  // valeur = VUE (nom/id, light ou heavy, comme le sélecteur de vue) ou tag à filtrer
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
    'editable', 'topbar', 'footer', 'toolbar', 'fit_toolbar', 'fullscreen', 'filter_bar', 'embedded', 'recenter',
    'edit_button', 'unitary', 'doc', 'navigation_help', 'badge',
    'logo', 'header', 'diagram', 'diagram_layout', 'diagram_layout_options',
    'diagrams_list', 'sous_filieres',
    'data_type', 'data_type_intervals', 'value_filter',
    'view_filter', 'level_filter', 'node_filter', 'data_filter',
    'lock_zoom', 'tooltip_on_hover', 'language', 'header_i18n',
    'minimum_flux', 'position_mode', 'data_tag_selection', 'view_tag_selection',
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

/**
 * Langue imposée par la page hôte : paramètre d'URL `?lang=` prioritaire,
 * sinon `window.sankey.language`. Retourne null si absente ou non supportée.
 * Utilisé par les index.tsx (OS/SA) AVANT la logique de langue mémorisée :
 * les pages publiées (portfolio multilingue) lient leurs diagrams.html avec
 * `?lang=<lang>` pour que le viewer s'ouvre dans la langue de la page.
 */
export const getForcedLanguage = (supported_langs: string[]): string | null => {
  let url_lang: string | null = null
  try {
    url_lang = new URLSearchParams(window.location.search).get('lang')
  } catch {
    url_lang = null
  }
  const lang = url_lang ?? (typeof window.sankey?.language === 'string' ? window.sankey.language : null)
  return normalizeLanguage(lang, supported_langs)
}

/**
 * Normalise un code de langue quelconque (navigateur, `?lang=`, cache localStorage)
 * vers un code effectivement supporté par l'appli. Les codes supportés sont
 * majoritairement sur 2 lettres ('fr', 'en', …) mais le chinois est régionalisé
 * ('zh-CN', simplifié) : un simple `slice(0, 2)` ne suffit donc plus.
 * Ordre de résolution : correspondance exacte → insensible à la casse →
 * première variante supportée de la même langue de base ('zh', 'zh-Hans',
 * 'zh-SG' → 'zh-CN'). Retourne null si rien ne correspond.
 */
export const normalizeLanguage = (
  raw: string | null | undefined,
  supported_langs: string[]
): string | null => {
  if (!raw) return null
  const lang = raw.replace('_', '-')
  if (supported_langs.includes(lang)) return lang
  const case_insensitive = supported_langs.find(l => l.toLowerCase() === lang.toLowerCase())
  if (case_insensitive) return case_insensitive
  const base = lang.split('-')[0].toLowerCase()
  return supported_langs.find(l => l.toLowerCase().split('-')[0] === base) ?? null
}
