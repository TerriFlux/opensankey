// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

import { getStringFromJSON } from './Utils'
import type { Type_JSON } from './Utils'
import { copyPlaybackSettings, parsePlaybackSettings, playback } from './Playback'
import type { Type_PlaybackSettings } from './Playback'
import { gridFrames, gridFromJSON, gridKeep, gridToJSON } from './MainZoneGrid'
import type { Type_MainZoneGridFrame, Type_MainZoneGridNode } from './MainZoneGrid'

/**
 * os#1482 — LES TABLEAUX DE BORD : la vue de l'ESPACE DE TRAVAIL (cf. NOTE-TABLEAUX DE BORD.md).
 *
 * Depuis le jalon 79 une vue portait deux choses de natures différentes : le diagramme d'une
 * feuille figé, et une disposition de fenêtres (`view_main_zone`) rejouée au changement de vue.
 * La première appartient à la feuille ; la seconde décrit l'écran — et depuis os#1385 lot 0 une
 * fenêtre peut regarder une AUTRE feuille, donc une vue de A figeait dans son entrée une fenêtre
 * sur B, sans dire quelle vue de B montrer.
 *
 * Une TABLEAU DE BORD est l'état de la grande zone : la grille, les fenêtres, et pour chaque fenêtre à
 * sujet diagramme la feuille ET la vue à montrer (`subject.view`, cf. `Type_MainZoneSubject`).
 * Elle appartient à l'hôte, comme `main_zone` et `workspace` : écrite par le document principal
 * seul, jamais dans un contenu de feuille.
 *
 * Ce module est PUR (aucun import runtime, testable avec un mock) : le magasin, son format, et la
 * règle de navigation. L'activation, qui opère les documents, vit sur `Class_ApplicationData`.
 */

export type Type_Dashboard = {
  id: string
  name: string
  description?: string
  /**
   * os#1492 — LA FEUILLE AU PREMIER PLAN quand le tableau de bord a été composée.
   *
   * Un tableau de bord disait quelle feuille chaque FENÊTRE montre, mais pas laquelle est l'onglet
   * actif. Changer d'onglet la laissait donc à moitié vraie — ses fenêtres en place, son
   * diagramme principal ailleurs — sans que rien ne le signale. L'onglet actif fait partie de
   * l'état de l'écran au même titre que les fenêtres : le tableau de bord le retient et le rétablit.
   *
   * Absente (tableaux de bord d'avant, document sans feuilles) : l'activation ne touche pas à l'onglet,
   * exactement comme avant.
   */
  sheet?: string
  /** Le format de `mainZoneStateToJSON`, tel quel. */
  main_zone: Type_JSON
}

/** Le vrai type des identifiants d'ordre de navigation : un tableau de bord EXPLICITE (`s_N`, ou
 *  `dashboard_<vue>` quand elle vient d'une migration) ou IMPLICITE (`view:<vue>`). */
export const IMPLICIT_DASHBOARD_PREFIX = 'view:'
export const implicitDashboardId = (view_id: string): string => IMPLICIT_DASHBOARD_PREFIX + view_id
export const isImplicitDashboardId = (id: string): boolean => id.startsWith(IMPLICIT_DASHBOARD_PREFIX)
/** L'identifiant de vue d'un tableau de bord implicite, `null` pour un tableau de bord explicite. */
export const viewIdOfImplicitDashboard = (id: string): string | null =>
  isImplicitDashboardId(id) ? id.slice(IMPLICIT_DASHBOARD_PREFIX.length) : null
/** L'identifiant de le tableau de bord née d'une vue à `view_main_zone` (migration, idempotente). */
export const migratedDashboardId = (view_id: string): string => 'dashboard_' + view_id

/** Une référence (feuille, vue) portée par une fenêtre à sujet diagramme d'un tableau de bord. */
export type Type_DashboardViewRef = { occupant_id: string, representation: string, sheet: string, view: string }

/**
 * Les couples (feuille, vue) que les fenêtres à sujet diagramme d'une disposition demandent.
 * `sheet === ''` = la feuille courante. Une fenêtre sans `view` n'est pas listée : elle garde la
 * vue courante de son document, comme avant les tableaux de bord.
 */
export const dashboardViewRefs = (main_zone: Type_JSON): Type_DashboardViewRef[] => {
  const raw = main_zone['occupants']
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
  const refs: Type_DashboardViewRef[] = []
  Object.entries(raw as Type_JSON).forEach(([occupant_id, v]) => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return
    const e = v as Type_JSON
    const s = e['subject']
    if (!s || typeof s !== 'object' || Array.isArray(s)) return
    const sj = s as Type_JSON
    if (getStringFromJSON(sj, 'kind', 'diagram') !== 'diagram') return
    const view = getStringFromJSON(sj, 'view', '')
    if (view === '') return
    refs.push({
      occupant_id,
      representation: getStringFromJSON(e, 'representation', occupant_id),
      sheet: getStringFromJSON(sj, 'sheet', ''),
      view
    })
  })
  return refs
}

/**
 * Une copie de `main_zone` où chaque fenêtre à sujet diagramme SANS feuille (donc sur la feuille
 * courante) reçoit `view`. C'est le geste de la migration : une vue à `view_main_zone` devient une
 * tableau de bord qui montre CETTE vue dans ses fenêtres de la feuille courante.
 */
export const mainZoneWithViewOnCurrentSheet = (main_zone: Type_JSON, view_id: string): Type_JSON => {
  const copy = JSON.parse(JSON.stringify(main_zone)) as Type_JSON
  const raw = copy['occupants']
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return copy
  Object.values(raw as Type_JSON).forEach(v => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return
    const e = v as Type_JSON
    const s = e['subject']
    // Fenêtre d'avant os#1387, sans sujet : c'est une fenêtre diagramme (cf. mainZoneStateFromJSON).
    const sj: Type_JSON = (s && typeof s === 'object' && !Array.isArray(s)) ? s as Type_JSON : { kind: 'diagram' }
    if (getStringFromJSON(sj, 'kind', 'diagram') !== 'diagram') return
    if (getStringFromJSON(sj, 'sheet', '') !== '') return
    sj['view'] = view_id
    e['subject'] = sj
  })
  return copy
}

// sa#619 — UN TABLEAU DE BORD CITE SES VOLETS, IL NE LES RECOPIE PLUS ==========================
//
// Un tableau de bord gardait une copie complète de chacun de ses volets, réglages compris, et c'est
// cette copie qu'il rejouait. Or depuis sa#619 tout volet est une vue : ses réglages vivent dans sa
// vue (`Type_ViewEntry.window`), et une vue placée dans deux tableaux de bord est UN seul objet
// (décision D-B) — la régler dans l'un la montre réglée dans l'autre. Le tableau de bord ne garde donc
// d'un volet qui est une vue que ce qui lui est propre : sa DISPOSITION (place, taille, rang,
// géométrie s'il flotte) et la vue qu'il est. Les réglages sont ceux de la vue, relus à l'activation.
//
// UN SUJET DIAGRAMME RESTE dans la référence : il dit QUELLE vue d'un document le volet montre (un
// volet Sankey, le canevas d'une autre feuille), et c'est par lui que les tableaux de bord citent les
// vues pour la navigation (cf. `dashboardViewRefs`). Un sujet d'élément (nœud, sélection, critère…)
// est un réglage du volet : il vit dans la vue.
//
// UN VOLET QUI N'EST PAS UNE VUE garde sa forme complète : le volet Sankey qui montre une vue du
// fichier sans en être une (le diagramme, une étape de tutoriel), ou tout volet d'un document qui ne
// sait pas enregistrer de vues (OpenSankey sans licence +). Rien d'autre ne porte ses réglages.

/** Les clés d'un volet qu'un tableau de bord garde quand ce volet est une vue : sa disposition. */
export const DASHBOARD_PANE_LAYOUT_KEYS = ['place', 'size', 'order', 'representation', 'geometry', 'saved_view']

/** La vue que ce volet de tableau de bord EST (`''` s'il n'en est pas une). */
export const dashboardPaneViewOf = (entry: unknown): string =>
  (entry && typeof entry === 'object' && !Array.isArray(entry)) ? getStringFromJSON(entry as Type_JSON, 'saved_view', '') : ''

/** Un sujet de volet qui est un diagramme (absent : un volet d'avant os#1387, diagramme lui aussi). */
const isDiagramSubject = (subject: unknown): boolean =>
  !subject || (typeof subject === 'object' && !Array.isArray(subject) &&
    getStringFromJSON(subject as Type_JSON, 'kind', 'diagram') === 'diagram')

/** La RÉFÉRENCE d'un volet qui est une vue : sa disposition, et son sujet s'il est un diagramme. */
export const dashboardPaneRef = (entry: Type_JSON): Type_JSON => {
  const ref: Type_JSON = {}
  DASHBOARD_PANE_LAYOUT_KEYS.forEach(key => {
    if (entry[key] !== undefined) ref[key] = JSON.parse(JSON.stringify(entry[key])) as Type_JSON
  })
  const subject = entry['subject']
  if (subject && isDiagramSubject(subject)) ref['subject'] = JSON.parse(JSON.stringify(subject)) as Type_JSON
  return ref
}

/**
 * LE VOLET D'UNE VUE, posé à la place que lui donne un tableau de bord : les réglages de la vue
 * (`window`), la disposition de la référence. Une vue retient aussi qu'elle était en plein écran ;
 * c'est le tableau de bord qui le dit ici (`main_zone.maximized`), d'où la clé retirée.
 */
export const dashboardPaneExpanded = (ref: Type_JSON, window: Type_JSON): Type_JSON => {
  const pane = JSON.parse(JSON.stringify(window)) as Type_JSON
  delete pane['maximized']
  DASHBOARD_PANE_LAYOUT_KEYS.forEach(key => {
    if (ref[key] !== undefined) pane[key] = JSON.parse(JSON.stringify(ref[key])) as Type_JSON
  })
  if (ref['subject'] && isDiagramSubject(ref['subject'])) pane['subject'] = JSON.parse(JSON.stringify(ref['subject'])) as Type_JSON
  return pane
}

/** Les volets d'une disposition, en dictionnaire (vide si la disposition n'en décrit pas). */
const occupantsOf = (main_zone: Type_JSON): Type_JSON => {
  const raw = main_zone['occupants']
  return (raw && typeof raw === 'object' && !Array.isArray(raw)) ? raw as Type_JSON : {}
}

/**
 * Une copie de `main_zone` où chaque volet qui est une vue du document (`isPaneView`) n'est plus
 * qu'une référence. C'est la forme qu'un tableau de bord garde.
 */
export const mainZoneWithPaneRefs = (main_zone: Type_JSON, isPaneView: (view_id: string) => boolean): Type_JSON => {
  const copy = JSON.parse(JSON.stringify(main_zone)) as Type_JSON
  const occupants = occupantsOf(copy)
  Object.entries(occupants).forEach(([id, v]) => {
    const view = dashboardPaneViewOf(v)
    if (view !== '' && isPaneView(view)) occupants[id] = dashboardPaneRef(v as Type_JSON)
  })
  return copy
}

/**
 * Une copie de `main_zone` prête à être rejouée : chaque volet qui est une vue reprend les réglages
 * de sa vue (`windowOf`). Un volet dont la vue n'existe plus (`undefined` : supprimée) n'est pas
 * rejoué : il n'y a plus rien à montrer — ni réglages, ni nature sûre. Un volet qui n'est pas une vue,
 * ou dont la vue ne garde pas de volet (`null`), est rejoué tel qu'il a été gardé.
 */
export const mainZoneWithPanesExpanded = (
  main_zone: Type_JSON, windowOf: (view_id: string) => Type_JSON | null | undefined
): Type_JSON => {
  const copy = JSON.parse(JSON.stringify(main_zone)) as Type_JSON
  const occupants = occupantsOf(copy)
  const gone: string[] = []
  Object.entries(occupants).forEach(([id, v]) => {
    const view = dashboardPaneViewOf(v)
    if (view === '') return
    const window = windowOf(view)
    if (window) occupants[id] = dashboardPaneExpanded(v as Type_JSON, window)
    else if (window === undefined) gone.push(id)
  })
  gone.forEach(id => withoutPane(copy, id))
  return copy
}

/** Retire de la disposition `main_zone` (en place) le volet `id` : sa case, son plein écran. */
const withoutPane = (main_zone: Type_JSON, id: string): void => {
  delete occupantsOf(main_zone)[id]
  const grid = gridFromJSON(main_zone['grid'])
  if (grid) {
    const kept = gridKeep(grid, x => x !== id)
    if (kept) main_zone['grid'] = gridToJSON(kept)
    else delete main_zone['grid']
  }
  if (getStringFromJSON(main_zone, 'maximized', '') === id) delete main_zone['maximized']
}

// sa#624 — L'ÉCRAN EST TOUJOURS UN TABLEAU DE BORD ==============================================
//
// Le sélecteur de la barre du haut ne montre plus que des tableaux de bord, et ce qu'on voit à
// l'écran EST le tableau de bord courant : il s'enregistre au fil de l'eau, on ne le « recapture »
// plus. Un fichier d'avant qui se lisait comme une suite de vues — un modèle SOCLE, les étapes d'un
// tutoriel — devient une suite de tableaux de bord, un par vue, dans l'ordre des vues et sous leur
// nom : la disposition de l'écran, son volet qui parcourait les vues montrant chacune à son tour.

/**
 * La disposition d'un tableau de bord à un seul volet : le volet Sankey `pane_id` (l'identifiant du
 * diagramme, `MAIN_ZONE_CANVAS_ID`, passé par l'appelant pour garder ce module pur) qui montre la
 * vue `view_id`.
 */
export const singleSankeyPaneMainZone = (view_id: string, pane_id: string): Type_JSON => ({
  occupants: {
    [pane_id]: { place: 'main', size: 1, order: 0, representation: pane_id, subject: { kind: 'diagram', view: view_id } }
  }
})

/**
 * Une copie de `main_zone` où chaque volet qui MONTRE la vue `from` sans en être une — le volet qui
 * parcourt les vues d'un fichier d'avant — montre `to`. `null` quand aucun volet ne la montre : la
 * disposition ne sait alors pas où poser `to`.
 */
export const mainZoneWithWalkedView = (main_zone: Type_JSON, from: string, to: string): Type_JSON | null => {
  const copy = JSON.parse(JSON.stringify(main_zone)) as Type_JSON
  let found = false
  Object.values(occupantsOf(copy)).forEach(v => {
    if (!v || typeof v !== 'object' || Array.isArray(v) || dashboardPaneViewOf(v) !== '') return
    const s = (v as Type_JSON)['subject']
    if (!s || typeof s !== 'object' || Array.isArray(s)) return
    const sj = s as Type_JSON
    if (getStringFromJSON(sj, 'kind', 'diagram') !== 'diagram' || getStringFromJSON(sj, 'view', '') !== from) return
    sj['view'] = to
    found = true
  })
  return found ? copy : null
}

/** Une case de la mosaïque d'un tableau de bord : un volet et sa place, en fractions de l'écran. */
export type Type_DashboardMosaicTile = { id: string, entry: Type_JSON, frame: Type_MainZoneGridFrame }

/**
 * LA MOSAÏQUE D'UN TABLEAU DE BORD, pour sa vignette : la case de chaque volet dans un écran de
 * `1 × 1`. La grille du fichier si elle y est, sinon celle que disent les places d'avant (grande
 * case, colonne droite, bandeau du bas) ; un volet en plein écran occupe tout. Les volets flottants
 * n'ont pas de case : ils ne sont dessinés que s'il n'y en a pas d'autres.
 */
export const dashboardMosaic = (main_zone: Type_JSON): Type_DashboardMosaicTile[] => {
  const occupants = occupantsOf(main_zone)
  const entryOf = (id: string): Type_JSON | null => {
    const v = occupants[id]
    return (v && typeof v === 'object' && !Array.isArray(v)) ? v as Type_JSON : null
  }
  const ids = Object.keys(occupants)
    .filter(id => entryOf(id) !== null)
    .sort((a, b) => getNumberOrMax(entryOf(a), 'order') - getNumberOrMax(entryOf(b), 'order'))
  const full: Type_MainZoneGridFrame = { top: 0, left: 0, width: 1, height: 1 }
  const maximized = getStringFromJSON(main_zone, 'maximized', '')
  if (maximized !== '' && entryOf(maximized)) return [{ id: maximized, entry: entryOf(maximized) as Type_JSON, frame: full }]
  const place = (id: string) => getStringFromJSON(entryOf(id) as Type_JSON, 'place', 'right')
  const docked = ids.filter(id => place(id) !== 'floating')
  const file_grid = gridFromJSON(main_zone['grid'])
  let grid = file_grid ? gridKeep(file_grid, id => docked.includes(id)) : null
  if (!grid && docked.length > 0) {
    // Les places d'avant, comme `Class_MenuConfig._legacyMainZoneGrid` : la grande case, la colonne
    // droite, le bandeau du bas — à leurs parts par défaut, la vignette n'a pas besoin de mieux.
    const principal = docked.find(id => place(id) === 'main') ?? docked.find(id => place(id) === 'right') ?? docked[0]
    const right = docked.filter(id => id !== principal && place(id) !== 'bottom')
    const bottom = docked.filter(id => id !== principal && place(id) === 'bottom')
    const stack = (dir: 'row' | 'column', list: string[]): Type_MainZoneGridNode =>
      list.length === 1 ? { pane: list[0] } : { split: dir, children: list.map(pane => ({ pane })), sizes: list.map(() => 1) }
    let g: Type_MainZoneGridNode = { pane: principal }
    if (right.length > 0) g = { split: 'row', children: [g, stack('column', right)], sizes: [0.65, 0.35] }
    if (bottom.length > 0) g = { split: 'column', children: [g, stack('row', bottom)], sizes: [0.7, 0.3] }
    grid = g
  }
  if (grid) {
    const { frames } = gridFrames(grid, full, 0.02)
    return Object.entries(frames).map(([id, frame]) => ({ id, entry: entryOf(id) as Type_JSON, frame }))
  }
  // Rien que des volets flottants : côte à côte.
  return ids.map((id, i) => ({
    id, entry: entryOf(id) as Type_JSON, frame: { top: 0, left: i / ids.length, width: 1 / ids.length, height: 1 }
  }))
}

/**
 * sa#625 — LES VUES QU'UN TABLEAU DE BORD MONTRE sur la feuille `current_sheet` (`''` sans feuilles) :
 * celles que ses volets à sujet diagramme demandent sur cette feuille, et celles que ses volets SONT
 * (sa#619). C'est par elles qu'une page publiée retrouve un tableau de bord : la vue qu'elle désigne,
 * ou l'étiquette de vue qui en sélectionne plusieurs.
 */
export const dashboardShownViews = (main_zone: Type_JSON, current_sheet: string): string[] => {
  const shown: string[] = []
  const add = (view: string) => { if (view !== '' && !shown.includes(view)) shown.push(view) }
  dashboardViewRefs(main_zone)
    .filter(ref => ref.sheet === '' || ref.sheet === current_sheet)
    .forEach(ref => add(ref.view))
  Object.values(occupantsOf(main_zone)).forEach(v => add(dashboardPaneViewOf(v)))
  return shown
}

/** sa#641 — Les tableaux de bord auprès du moteur de lecture : un seul jeu par hôte, une seule clé. */
export const DASHBOARDS_PLAYBACK_KEY = 'dashboards'

/** Un nombre d'une entrée (`Number.MAX_SAFE_INTEGER` s'il manque : rangé en dernier). */
const getNumberOrMax = (entry: Type_JSON | null, key: string): number => {
  const v = entry ? entry[key] : undefined
  return typeof v === 'number' && Number.isFinite(v) ? v : Number.MAX_SAFE_INTEGER
}

/**
 * LE MAGASIN des tableaux de bord de l'espace de travail. Un seul par hôte (cf. `Class_MenuConfig`), comme
 * la liste des fenêtres.
 */
export class Class_DashboardsStore {
  protected _entries: { [id: string]: Type_Dashboard } = {}
  protected _order: string[] = []
  /**
   * Le tableau de bord ACTIVE : explicite (`s_N`) ou implicite (`view:<vue>`). `null` tant que rien n'a été
   * activé — la lecture d'un fichier ancien la pose depuis `current_view`.
   */
  protected _current: string | null = null
  /** Compteur des `s_N`, réaligné à la lecture d'un fichier sur le plus grand N rencontré. */
  protected _seq: number = 0
  /**
   * Vrai PENDANT une activation : les bascules de vue qu'elle provoque ne doivent pas repointer
   * `current` sur un tableau de bord implicite (cf. `ViewsReader.applyViewChange`).
   */
  public activating: boolean = false
  /**
   * sa#625 — LA REPRISE DE SA#624 EST-ELLE FAITE ? Posé par la reprise, écrit dans le fichier
   * (`resumed: true`) : un fichier repris ne l'est plus. Sans ce témoin, chaque ouverture redonnait
   * un tableau de bord à toute vue parcourue qu'aucun ne montre — c'est-à-dire à celles dont
   * l'auteur avait SUPPRIMÉ le tableau de bord, qui revenaient dans l'éditeur comme sur la page publiée.
   */
  public resumed: boolean = false
  /**
   * sa#641 — LE DIAPORAMA : la case « Lecture » des réglages des tableaux de bord (`undefined` =
   * décochée) et ses réglages, ceux d'un sélecteur (sa#639) — boucle, aléatoire, délai. Enregistrés
   * avec le fichier ; `autoplay` y dit si le diaporama tournait à l'enregistrement.
   */
  protected _playback: Type_PlaybackSettings | undefined = undefined
  /** sa#641 — Compté à chaque lecture de fichier : un diaporama ne survit pas à son fichier. */
  protected _loads: number = 0

  public get playback(): Type_PlaybackSettings | undefined {
    return this._playback === undefined ? undefined : copyPlaybackSettings(this._playback)
  }
  public set playback(value: Type_PlaybackSettings | undefined) {
    this._playback = value === undefined ? undefined : copyPlaybackSettings(value)
  }
  public get loads(): number { return this._loads }

  public get entries(): { readonly [id: string]: Type_Dashboard } { return this._entries }
  public get order(): readonly string[] { return this._order }
  public get current(): string | null { return this._current }
  public set current(id: string | null) { this._current = id }
  public get has_dashboards(): boolean { return this._order.length > 0 }

  public byId(id: string): Type_Dashboard | undefined { return this._entries[id] }

  public newId(): string {
    let id = ''
    do { id = `s_${++this._seq}` } while (id in this._entries)
    return id
  }

  /** sa#624 — Le rang de `id` dans l'ordre (-1 s'il n'y est pas). */
  public indexOf(id: string): number { return this._order.indexOf(id) }

  /**
   * sa#624 — Ajoute un tableau de bord au rang `index` (borné ; un identifiant déjà présent est
   * remplacé et déplacé) ; rend son identifiant. C'est le geste de Nouveau et de Dupliquer, qui
   * posent le tableau de bord juste après le courant, et de l'annulation d'une suppression.
   */
  public insert(dashboard: Type_Dashboard, index: number): string {
    this._order = this._order.filter(x => x !== dashboard.id)
    this._order.splice(Math.max(0, Math.min(index, this._order.length)), 0, dashboard.id)
    this._entries[dashboard.id] = dashboard
    this._realignSeq()
    return dashboard.id
  }

  /**
   * sa#624 — L'ORDRE, donné d'un bloc : les identifiants connus dans l'ordre dit, sans doublon ; les
   * tableaux de bord qu'il oublie suivent, dans leur ordre d'avant — rien ne disparaît.
   */
  public setOrder(ids: readonly string[]): void {
    const listed = [...new Set(ids.filter(id => id in this._entries))]
    const seen = new Set(listed)
    this._order = [...listed, ...this._order.filter(id => !seen.has(id))]
  }

  /** sa#624 — Ce nom est-il celui d'un AUTRE tableau de bord que `except` ? */
  public nameTaken(name: string, except?: string): boolean {
    const clean = name.trim()
    return this._order.some(id => id !== except && this._entries[id]?.name === clean)
  }

  /** sa#624 — `base` s'il est libre, sinon « base 2 », « base 3 »… */
  public uniqueName(base: string): string {
    const clean = base.trim()
    if (!this.nameTaken(clean)) return clean
    let n = 2
    while (this.nameTaken(`${clean} ${n}`)) n += 1
    return `${clean} ${n}`
  }

  /** Ajoute (ou remplace, à même identifiant) un tableau de bord ; rend son identifiant. */
  public add(dashboard: Type_Dashboard): string {
    if (!(dashboard.id in this._entries)) this._order.push(dashboard.id)
    this._entries[dashboard.id] = dashboard
    this._realignSeq()
    return dashboard.id
  }

  public remove(id: string): boolean {
    if (!(id in this._entries)) return false
    delete this._entries[id]
    this._order = this._order.filter(x => x !== id)
    if (this._current === id) this._current = null
    return true
  }

  public rename(id: string, name: string): boolean {
    const s = this._entries[id]
    const trimmed = name.trim()
    if (!s || trimmed === '' || s.name === trimmed) return false
    s.name = trimmed
    return true
  }

  public setDescription(id: string, description: string): boolean {
    const s = this._entries[id]
    if (!s) return false
    if (description === '') delete s.description
    else s.description = description
    return true
  }

  /** Déplace `id` à la place de `target_id` dans l'ordre (les deux explicites). */
  public moveBefore(id: string, target_id: string): boolean {
    const from = this._order.indexOf(id)
    const to = this._order.indexOf(target_id)
    if (from < 0 || to < 0 || from === to) return false
    this._order.splice(from, 1)
    this._order.splice(to, 0, id)
    return true
  }

  public moveUp(id: string): boolean {
    const i = this._order.indexOf(id)
    if (i <= 0) return false
    this._order.splice(i - 1, 2, this._order[i], this._order[i - 1])
    return true
  }

  public moveDown(id: string): boolean {
    const i = this._order.indexOf(id)
    if (i < 0 || i >= this._order.length - 1) return false
    this._order.splice(i, 2, this._order[i + 1], this._order[i])
    return true
  }

  public clear(): void {
    this._entries = {}
    this._order = []
    this._current = null
    this._seq = 0
    this.resumed = false
    this._playback = undefined
  }

  /** sa#619 — Les tableaux de bord (dans leur ordre) où figure le volet qui est la vue `view_id`. */
  public dashboardsWithPaneView(view_id: string): string[] {
    return this._order.filter(id => {
      const dashboard = this._entries[id]
      return !!dashboard && Object.values(occupantsOf(dashboard.main_zone)).some(v => dashboardPaneViewOf(v) === view_id)
    })
  }

  /**
   * sa#619 — LA VUE `view_id` QUITTE TOUS LES TABLEAUX DE BORD : son volet en est retiré, sa case
   * rendue à ses voisins. Rend, pour l'annulation, la disposition d'avant de chaque tableau de bord
   * touché (cf. `restoreMainZones`).
   */
  public removePaneView(view_id: string): { [id: string]: Type_JSON } {
    const before: { [id: string]: Type_JSON } = {}
    this.dashboardsWithPaneView(view_id).forEach(id => {
      const dashboard = this._entries[id]
      before[id] = JSON.parse(JSON.stringify(dashboard.main_zone)) as Type_JSON
      const main_zone = JSON.parse(JSON.stringify(dashboard.main_zone)) as Type_JSON
      Object.entries(occupantsOf(main_zone))
        .filter(([, v]) => dashboardPaneViewOf(v) === view_id)
        .forEach(([occupant_id]) => withoutPane(main_zone, occupant_id))
      dashboard.main_zone = main_zone
    })
    return before
  }

  /** sa#619 — Rend à des tableaux de bord encore présents la disposition qu'ils avaient. */
  public restoreMainZones(main_zones: { [id: string]: Type_JSON }): void {
    Object.entries(main_zones).forEach(([id, main_zone]) => {
      const dashboard = this._entries[id]
      if (dashboard) dashboard.main_zone = JSON.parse(JSON.stringify(main_zone)) as Type_JSON
    })
  }

  /** sa#619 — La disposition actuelle des tableaux de bord `ids` (cf. `restoreMainZones`). */
  public mainZonesOf(ids: string[]): { [id: string]: Type_JSON } {
    const out: { [id: string]: Type_JSON } = {}
    ids.forEach(id => {
      const dashboard = this._entries[id]
      if (dashboard) out[id] = JSON.parse(JSON.stringify(dashboard.main_zone)) as Type_JSON
    })
    return out
  }

  /**
   * Les vues DE LA FEUILLE COURANTE que les tableaux de bord explicites citent, par vue. `sheet` est
   * l'identifiant de la feuille courante (`''` quand le document n'a pas de feuilles) : une
   * fenêtre qui la nomme explicitement et une fenêtre sans feuille disent la même chose.
   */
  public dashboardsByCitedView(current_sheet: string): Map<string, string[]> {
    const by_view = new Map<string, string[]>()
    this._order.forEach(sid => {
      const dashboard = this._entries[sid]
      if (!dashboard) return
      dashboardViewRefs(dashboard.main_zone).forEach(ref => {
        if (ref.sheet !== '' && ref.sheet !== current_sheet) return
        const list = by_view.get(ref.view) ?? []
        if (!list.includes(sid)) list.push(sid)
        by_view.set(ref.view, list)
      })
    })
    return by_view
  }

  /**
   * L'ORDRE DE NAVIGATION : une seule liste pour le sélecteur, les flèches et F8/F9.
   *
   * Règle du repli automatique (NOTE-TABLEAUX DE BORD.md §3) : on parcourt l'ordre des vues ; une vue citée
   * par des tableaux de bord explicites est remplacée, À SA PLACE, par ces tableaux de bord ; une vue que personne ne
   * cite devient un tableau de bord implicite.
   *
   * os#1492 — PUIS TOUTES LES TABLEAUX DE BORD QUI RESTENT, en queue. Les tableaux de bord appartiennent au
   * CLASSEUR, pas à une feuille : la liste ne doit pas se vider quand on change d'onglet. Elle
   * le faisait, et c'était un défaut mesuré (deux des trois tableaux de bord du classeur d'exemple
   * disparaissaient sur la seconde feuille) : la queue écartait les tableaux de bord de
   * `cites_current_sheet`, ensemble qui contient aussi celles citant une vue ABSENTE de
   * `views_order` — celles-là n'étaient donc ni placées à une vue, ni mises en queue.
   * `seen` suffit, et dit exactement ce qu'il faut : « déjà placée ».
   *
   * Un fichier migré garde l'ordre qu'il avait : le tableau de bord née d'une vue est là où la vue était.
   */
  public navigationOrder(views_order: readonly string[], current_sheet: string): string[] {
    const by_view = this.dashboardsByCitedView(current_sheet)
    const result: string[] = []
    const seen = new Set<string>()
    views_order.forEach(view_id => {
      const dashboards = by_view.get(view_id)
      if (dashboards && dashboards.length > 0) {
        dashboards.forEach(sid => { if (!seen.has(sid)) { seen.add(sid); result.push(sid) } })
      } else result.push(implicitDashboardId(view_id))
    })
    this._order.forEach(sid => {
      if (seen.has(sid)) return
      seen.add(sid)
      result.push(sid)
    })
    return result
  }

  // --- Persistance (clé racine `dashboards`) --------------------------------------------------

  /**
   * `{ order, current?, entries: { id: { name, description?, main_zone } } }`, ou `undefined`
   * quand il n'y a rien à écrire : la clé est ADDITIVE, un fichier sans tableau de bord ne change pas
   * d'un octet. `current` n'est écrit que s'il désigne un tableau de bord explicite : une implicite est
   * déjà dite par `current_view`.
   */
  public toJSON(): Type_JSON | undefined {
    if (this._order.length === 0) return undefined
    const entries: Type_JSON = {}
    this._order.forEach(id => {
      const s = this._entries[id]
      if (!s) return
      const e: Type_JSON = { name: s.name, main_zone: JSON.parse(JSON.stringify(s.main_zone)) as Type_JSON }
      if (s.description) e['description'] = s.description
      // os#1492 — l'onglet actif de le tableau de bord. Additive : un tableau de bord composée dans un document
      // sans feuilles n'en porte pas, et se relit comme avant.
      if (s.sheet) e['sheet'] = s.sheet
      entries[id] = e
    })
    const json: Type_JSON = { order: [...this._order], entries }
    if (this._current !== null && this._current in this._entries) json['current'] = this._current
    if (this.resumed) json['resumed'] = true
    // sa#641 — clé ADDITIVE, écrite seulement quand la Lecture est cochée. Comme pour un sélecteur
    // (sa#639), la lecture automatique n'est pas un réglage : elle dit que le diaporama tournait.
    if (this._playback !== undefined) {
      json['playback'] = {
        ...copyPlaybackSettings(this._playback),
        autoplay: playback.isSource(DASHBOARDS_PLAYBACK_KEY) && playback.status === 'playing'
      }
    }
    return json
  }

  /** Relit la clé racine. Absente ou malformée : le magasin est VIDÉ (c'est un autre fichier). */
  public fromJSON(json: unknown): void {
    this.clear()
    this._loads += 1
    if (!json || typeof json !== 'object' || Array.isArray(json)) return
    const j = json as Type_JSON
    const raw = j['entries']
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return
    const entries: { [id: string]: Type_Dashboard } = {}
    Object.entries(raw as Type_JSON).forEach(([id, v]) => {
      if (id === '' || !v || typeof v !== 'object' || Array.isArray(v)) return
      const e = v as Type_JSON
      const mz = e['main_zone']
      if (!mz || typeof mz !== 'object' || Array.isArray(mz)) return
      const dashboard: Type_Dashboard = { id, name: getStringFromJSON(e, 'name', id), main_zone: mz as Type_JSON }
      const description = getStringFromJSON(e, 'description', '')
      if (description !== '') dashboard.description = description
      const sheet = getStringFromJSON(e, 'sheet', '')
      if (sheet !== '') dashboard.sheet = sheet
      entries[id] = dashboard
    })
    // Ordre explicite s'il est là, sinon celui des clés ; les absents de la liste en queue, les
    // inconnus ignorés — un fichier partiellement à jour ne perd aucun tableau de bord.
    const order_raw = j['order']
    const explicit = Array.isArray(order_raw)
      ? [...new Set(order_raw.filter((x): x is string => typeof x === 'string' && x in entries))]
      : []
    const seen = new Set(explicit)
    const rest = Object.keys(entries).filter(id => !seen.has(id))
    this._entries = entries
    this._order = [...explicit, ...rest]
    const current = getStringFromJSON(j, 'current', '')
    this._current = (current !== '' && current in entries) ? current : null
    this.resumed = j['resumed'] === true
    this._playback = parsePlaybackSettings(j['playback'])
    this._realignSeq()
  }

  protected _realignSeq(): void {
    this._seq = Math.max(this._seq, ...Object.keys(this._entries)
      .map(id => /^s_(\d+)$/.exec(id)).map(m => (m ? Number(m[1]) : 0)))
  }
}
