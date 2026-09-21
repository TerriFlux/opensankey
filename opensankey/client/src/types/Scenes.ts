// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

import { getStringFromJSON } from './Utils'
import type { Type_JSON } from './Utils'

/**
 * os#1482 — LES SCÈNES : la vue de l'ESPACE DE TRAVAIL (cf. NOTE-SCENES.md).
 *
 * Depuis le jalon 79 une vue portait deux choses de natures différentes : le diagramme d'une
 * feuille figé, et une disposition de fenêtres (`view_main_zone`) rejouée au changement de vue.
 * La première appartient à la feuille ; la seconde décrit l'écran — et depuis os#1385 lot 0 une
 * fenêtre peut regarder une AUTRE feuille, donc une vue de A figeait dans son entrée une fenêtre
 * sur B, sans dire quelle vue de B montrer.
 *
 * Une SCÈNE est l'état de la grande zone : la grille, les fenêtres, et pour chaque fenêtre à
 * sujet diagramme la feuille ET la vue à montrer (`subject.view`, cf. `Type_MainZoneSubject`).
 * Elle appartient à l'hôte, comme `main_zone` et `workspace` : écrite par le document principal
 * seul, jamais dans un contenu de feuille.
 *
 * Ce module est PUR (aucun import runtime, testable avec un mock) : le magasin, son format, et la
 * règle de navigation. L'activation, qui opère les documents, vit sur `Class_ApplicationData`.
 */

export type Type_Scene = {
  id: string
  name: string
  description?: string
  /** Le format de `mainZoneStateToJSON`, tel quel. */
  main_zone: Type_JSON
}

/** Le vrai type des identifiants d'ordre de navigation : une scène EXPLICITE (`s_N`, ou
 *  `scene_<vue>` quand elle vient d'une migration) ou IMPLICITE (`view:<vue>`). */
export const IMPLICIT_SCENE_PREFIX = 'view:'
export const implicitSceneId = (view_id: string): string => IMPLICIT_SCENE_PREFIX + view_id
export const isImplicitSceneId = (id: string): boolean => id.startsWith(IMPLICIT_SCENE_PREFIX)
/** L'identifiant de vue d'une scène implicite, `null` pour une scène explicite. */
export const viewIdOfImplicitScene = (id: string): string | null =>
  isImplicitSceneId(id) ? id.slice(IMPLICIT_SCENE_PREFIX.length) : null
/** L'identifiant de la scène née d'une vue à `view_main_zone` (migration, idempotente). */
export const migratedSceneId = (view_id: string): string => 'scene_' + view_id

/** Une référence (feuille, vue) portée par une fenêtre à sujet diagramme d'une scène. */
export type Type_SceneViewRef = { occupant_id: string, representation: string, sheet: string, view: string }

/**
 * Les couples (feuille, vue) que les fenêtres à sujet diagramme d'une disposition demandent.
 * `sheet === ''` = la feuille courante. Une fenêtre sans `view` n'est pas listée : elle garde la
 * vue courante de son document, comme avant les scènes.
 */
export const sceneViewRefs = (main_zone: Type_JSON): Type_SceneViewRef[] => {
  const raw = main_zone['occupants']
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
  const refs: Type_SceneViewRef[] = []
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
 * scène qui montre CETTE vue dans ses fenêtres de la feuille courante.
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

/**
 * LE MAGASIN des scènes de l'espace de travail. Un seul par hôte (cf. `Class_MenuConfig`), comme
 * la liste des fenêtres.
 */
export class Class_ScenesStore {
  protected _entries: { [id: string]: Type_Scene } = {}
  protected _order: string[] = []
  /**
   * La scène ACTIVE : explicite (`s_N`) ou implicite (`view:<vue>`). `null` tant que rien n'a été
   * activé — la lecture d'un fichier ancien la pose depuis `current_view`.
   */
  protected _current: string | null = null
  /** Compteur des `s_N`, réaligné à la lecture d'un fichier sur le plus grand N rencontré. */
  protected _seq: number = 0
  /**
   * Vrai PENDANT une activation : les bascules de vue qu'elle provoque ne doivent pas repointer
   * `current` sur une scène implicite (cf. `ViewsReader.applyViewChange`).
   */
  public activating: boolean = false

  public get entries(): { readonly [id: string]: Type_Scene } { return this._entries }
  public get order(): readonly string[] { return this._order }
  public get current(): string | null { return this._current }
  public set current(id: string | null) { this._current = id }
  public get has_scenes(): boolean { return this._order.length > 0 }

  public byId(id: string): Type_Scene | undefined { return this._entries[id] }

  public newId(): string {
    let id = ''
    do { id = `s_${++this._seq}` } while (id in this._entries)
    return id
  }

  /** Ajoute (ou remplace, à même identifiant) une scène ; rend son identifiant. */
  public add(scene: Type_Scene): string {
    if (!(scene.id in this._entries)) this._order.push(scene.id)
    this._entries[scene.id] = scene
    this._realignSeq()
    return scene.id
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
  }

  /**
   * Les vues DE LA FEUILLE COURANTE que les scènes explicites citent, par vue. `sheet` est
   * l'identifiant de la feuille courante (`''` quand le document n'a pas de feuilles) : une
   * fenêtre qui la nomme explicitement et une fenêtre sans feuille disent la même chose.
   */
  public scenesByCitedView(current_sheet: string): Map<string, string[]> {
    const by_view = new Map<string, string[]>()
    this._order.forEach(sid => {
      const scene = this._entries[sid]
      if (!scene) return
      sceneViewRefs(scene.main_zone).forEach(ref => {
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
   * Règle du repli automatique (NOTE-SCENES.md §3) : on parcourt l'ordre des vues ; une vue citée
   * par des scènes explicites est remplacée, À SA PLACE, par ces scènes ; une vue que personne ne
   * cite devient une scène implicite. Les scènes qui ne citent aucune vue de la feuille courante
   * (scènes d'autres feuilles seulement) viennent en queue. Une scène qui ne cite que des vues
   * hors de `views_order` (filtre de label, sa#397) n'apparaît pas : elle mènerait hors du filtre.
   *
   * Un fichier migré garde ainsi l'ordre qu'il avait : la scène née d'une vue est là où la vue
   * était.
   */
  public navigationOrder(views_order: readonly string[], current_sheet: string): string[] {
    const by_view = this.scenesByCitedView(current_sheet)
    const result: string[] = []
    const seen = new Set<string>()
    views_order.forEach(view_id => {
      const scenes = by_view.get(view_id)
      if (scenes && scenes.length > 0) {
        scenes.forEach(sid => { if (!seen.has(sid)) { seen.add(sid); result.push(sid) } })
      } else result.push(implicitSceneId(view_id))
    })
    const cites_current_sheet = new Set<string>()
    by_view.forEach(list => list.forEach(sid => cites_current_sheet.add(sid)))
    this._order.forEach(sid => {
      if (seen.has(sid) || cites_current_sheet.has(sid)) return
      seen.add(sid)
      result.push(sid)
    })
    return result
  }

  // --- Persistance (clé racine `scenes`) --------------------------------------------------

  /**
   * `{ order, current?, entries: { id: { name, description?, main_zone } } }`, ou `undefined`
   * quand il n'y a rien à écrire : la clé est ADDITIVE, un fichier sans scène ne change pas
   * d'un octet. `current` n'est écrit que s'il désigne une scène explicite : une implicite est
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
      entries[id] = e
    })
    const json: Type_JSON = { order: [...this._order], entries }
    if (this._current !== null && this._current in this._entries) json['current'] = this._current
    return json
  }

  /** Relit la clé racine. Absente ou malformée : le magasin est VIDÉ (c'est un autre fichier). */
  public fromJSON(json: unknown): void {
    this.clear()
    if (!json || typeof json !== 'object' || Array.isArray(json)) return
    const j = json as Type_JSON
    const raw = j['entries']
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return
    const entries: { [id: string]: Type_Scene } = {}
    Object.entries(raw as Type_JSON).forEach(([id, v]) => {
      if (id === '' || !v || typeof v !== 'object' || Array.isArray(v)) return
      const e = v as Type_JSON
      const mz = e['main_zone']
      if (!mz || typeof mz !== 'object' || Array.isArray(mz)) return
      const scene: Type_Scene = { id, name: getStringFromJSON(e, 'name', id), main_zone: mz as Type_JSON }
      const description = getStringFromJSON(e, 'description', '')
      if (description !== '') scene.description = description
      entries[id] = scene
    })
    // Ordre explicite s'il est là, sinon celui des clés ; les absents de la liste en queue, les
    // inconnus ignorés — un fichier partiellement à jour ne perd aucune scène.
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
    this._realignSeq()
  }

  protected _realignSeq(): void {
    this._seq = Math.max(this._seq, ...Object.keys(this._entries)
      .map(id => /^s_(\d+)$/.exec(id)).map(m => (m ? Number(m[1]) : 0)))
  }
}
