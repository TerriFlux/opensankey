// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// 04/10/2026 — LES GESTES D'UNE COURONNE SUR DIMENSIONS DE DONNÉES, écrits à UN seul endroit
// (os#1511, refonte étape 2, lot 3).
//
// Chaque geste LIT l'état (`readCouronneState`), le MODIFIE, et l'ÉCRIT : la figure par
// `writeCouronneState` (la seule clé `couronne`), et — liée — ce qu'elle montre par le geste annulable
// de l'hôte sur la sélection du diagramme (`applyDimensionCut`), puisque liée, `shown` EST cette
// sélection. Les deux écritures font UN pas d'annulation (`inOneHistoryStep`). Plus rien n'écrit
// `dimension_opening`, `dimension_hidden`, `hierarchy_focus` (membres), `inactive_dimensions`,
// `levels_display(_by)`, `small_multiples_by` ni `nested_tagg_ids` : `readCouronneState` les relit
// encore pour les fichiers d'avant, et l'écriture les retire.
//
// 07/10/2026 — REVIREMENT DE JULIEN : LIÉE, LE ZOOM EST PARTAGÉ. La portée d'une dimension est
// celle du diagramme (`focus_ids` du groupe) : zoomer pose la portée ET restreint la sélection du
// diagramme à ce qu'elle couvre (`applyDimensionFocus`), et toutes les fenêtres liées suivent.
// Détachée, la figure zoome seule. Le choix « Clic sur une part » n'a plus que Déplie / Zoome.
//
// LES GESTES : en-tête (colonne seule, ctrl+clic ajoutée, reclic désactive) ; part « Déplie » (la part
// cède sa place à ses enfants : mixte) et son shift+clic (replie) ; part « Zoome » (portée) et son
// shift+clic, le centre et le ✕ (la portée remonte) ; liste de zoom (portée à plusieurs membres) ; case
// de légende (décochés : la ligne reste, liée comme détachée) ; sélecteur Arbre (membres libres) ; ⇅ /
// ▲▼ (ordre) ; dessin par ligne (secteurs, sunburst, une couronne par membre — exclusif) ; lier /
// détacher.

import type { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import { applyDimensionCut, applyDimensionFocus } from '../components/ui/dimensionDrawingHost'
import { parseMemberSectorPath } from '../Charts/memberSectorId'
import {
  antichainOf, readCouronneState, writeCouronneState,
  type Type_CouronneDrawing, type Type_CouronneSankey, type Type_CouronneState
} from './couronneState'
import { drawPlanOf } from '../Charts/couronnePlan'

type Type_Bag = { [key: string]: unknown }

/**
 * 03/10/2026 — UN SEUL PAS D'ANNULATION pour un geste du diagramme suivi d'un réglage de figure :
 * les annulations que `run` empile (le geste de l'hôte, l'écriture de la figure) sont recueillies,
 * puis posées en UNE entrée, avec `undoAlso` / `redoAlso` en plus.
 */
export const inOneHistoryStep = (
  history: { saveUndo: (f: () => void) => void, saveRedo: (f: () => void) => void },
  run: () => void, undoAlso: () => void = () => undefined, redoAlso: () => void = () => undefined
) => {
  const undos: (() => void)[] = []
  const redos: (() => void)[] = []
  const own = history as unknown as { [k: string]: unknown }
  const had_own = Object.prototype.hasOwnProperty.call(own, 'saveUndo')
  const saveUndo = own.saveUndo
  const saveRedo = own.saveRedo
  own.saveUndo = (f: () => void) => { undos.push(f) }
  own.saveRedo = (f: () => void) => { redos.push(f) }
  try {
    run()
  } finally {
    // Une instance de classe retrouve les méthodes de son prototype ; un objet simple, les siennes.
    if (had_own) { own.saveUndo = saveUndo; own.saveRedo = saveRedo } else { delete own.saveUndo; delete own.saveRedo }
  }
  history.saveUndo(() => { undoAlso(); [...undos].reverse().forEach(f => f()) })
  history.saveRedo(() => { redos.forEach(f => f()); redoAlso() })
}

// ── OUTILS SUR UNE DIMENSION ─────────────────────────────────────────────────────────────────────

const rootsOf = (d: Class_DataTagGroup) => (d.tags_list as Class_DataTag[]).filter(m => m.parent === undefined)
const kidsOf = (m: Class_DataTag) => m.children as Class_DataTag[]
const membersOf = (d: Class_DataTagGroup, ids: readonly string[]) =>
  ids.map(id => d.tags_dict[id] as Class_DataTag | undefined).filter((m): m is Class_DataTag => m !== undefined)
const underOrSelf = (m: Class_DataTag, f: Class_DataTag) => m === f || m.hasAncestor(f)
/** La profondeur d'entrée : sous la racine unique, ou les racines. */
export const entryDepthOf = (d: Class_DataTagGroup) => rootsOf(d).length === 1 ? 1 : 0

/** L'ancêtre de `m` à la profondeur `depth` (lui-même s'il y est), ou `undefined`. */
const ancestorAt = (d: Class_DataTagGroup, m: Class_DataTag, depth: number): Class_DataTag | undefined => {
  let p: Class_DataTag | undefined = m
  while (p !== undefined && d.depthOf(p) > depth) p = p.parent as Class_DataTag | undefined
  return p !== undefined && d.depthOf(p) === depth ? p : undefined
}

/**
 * LES MEMBRES QUI COUVRENT UNE PORTÉE : depuis chaque membre de `scope` (ses enfants ; lui-même pour
 * une feuille) ou depuis les racines, on garde un membre de `keep`, on descend sous un ancêtre d'un
 * membre de `keep`, et l'on s'arrête à la profondeur `depthFor(départ)` (ou sur une feuille).
 */
const coverScope = (
  d: Class_DataTagGroup, scope: Class_DataTag[], keep: Class_DataTag[], depthFor: (start: Class_DataTag | null) => number
): string[] => {
  const out: string[] = []
  const visit = (m: Class_DataTag, depth: number) => {
    if (keep.includes(m)) { out.push(m.id); return }
    if (keep.some(k => k.hasAncestor(m))) { kidsOf(m).forEach(c => visit(c, depth)); return }
    if (d.depthOf(m) >= depth || kidsOf(m).length === 0) { out.push(m.id); return }
    kidsOf(m).forEach(c => visit(c, depth))
  }
  if (scope.length === 0) rootsOf(d).forEach(r => visit(r, depthFor(null)))
  else scope.forEach(f => kidsOf(f).length === 0 ? out.push(f.id) : kidsOf(f).forEach(c => visit(c, depthFor(f))))
  return antichainOf(d, out)
}

/** La profondeur la plus haute (la « colonne ») d'une liste de membres, ou `fallback`. */
const minDepth = (d: Class_DataTagGroup, ms: Class_DataTag[], fallback: number) =>
  ms.length === 0 ? fallback : Math.min(...ms.map(m => d.depthOf(m)))

// ── LE MODULE ────────────────────────────────────────────────────────────────────────────────────

export interface Type_CouronneGestureHost {
  app: Class_ApplicationData
  /** Les réglages de la figure, tels qu'écrits. */
  options: Type_Bag
  /** Les dimensions déclarées par le descripteur en vigueur. */
  declared: string[]
  /** Écrit les réglages de la figure (inscrit au journal d'annulation par l'hôte). */
  write: (options: Type_Bag) => void
  /** La figure est-elle liée ? Absent : ce que disent ses réglages. */
  linked?: boolean
}

/**
 * Ce que le clic sur une part fait en plus de sélectionner (`interaction_click`). 07/10/2026 — deux
 * choix, `aggregate` (Déplie) et `zoom` (Zoome) ; `none` et `both` sont les valeurs d'avant, relues
 * (`partClickModeOf`) : le diagramme suit selon le lien, plus selon le choix.
 */
export type Type_PartClickMode = 'none' | 'aggregate' | 'zoom' | 'both'

/** Les quatre valeurs d'avant ramenées aux deux choix : `none` / `aggregate` → Déplie, `zoom` / `both` → Zoome. */
export const partClickModeOf = (raw: unknown): 'aggregate' | 'zoom' =>
  raw === 'zoom' || raw === 'both' ? 'zoom' : 'aggregate'

/**
 * LES GESTES D'UNE COURONNE, relus à chaque appel sur ses réglages du moment. `null` : aucune
 * dimension à niveaux n'entre dans la figure.
 */
export const couronneGesturesOf = (host: Type_CouronneGestureHost) => {
  const app = host.app
  const sankey = app.drawing_area.sankey as unknown as Type_CouronneSankey
  const state = readCouronneState(host.options, sankey, host.linked, host.declared)
  if (state.order.length === 0) return null
  const linked = state.linked
  const dimOf = (id: string) => sankey.data_taggs_dict[id] as Class_DataTagGroup | undefined
  const st = (id: string) => state.dims[id]
  const focusOf = (d: Class_DataTagGroup) => membersOf(d, st(d.id)?.focus ?? [])
  const shownOf = (d: Class_DataTagGroup) => membersOf(d, st(d.id)?.shown ?? [])
  const plan = drawPlanOf(state, sankey)
  const cells_dim = plan.cells_dimension_id

  /** L'état avec la dimension `id` modifiée. */
  const withDim = (s: Type_CouronneState, id: string, patch: Partial<Type_CouronneState['dims'][string]>): Type_CouronneState =>
    ({ ...s, dims: { ...s.dims, [id]: { ...s.dims[id], ...patch } } })

  /**
   * ÉCRIT un état, et — liée — la sélection du diagramme des dimensions de `diagram` (ce que la figure
   * montre), en un seul pas d'annulation. Détachée, rien du diagramme ne bouge.
   *
   * 07/10/2026 — LIÉE, LA PORTÉE EST AU DIAGRAMME (revirement de Julien) : une dimension dont la
   * portée change zoome le diagramme (`applyDimensionFocus`) — sa portée, et sa sélection restreinte
   * aux montrés sous la nouvelle portée (ou à la coupe demandée) —, dans le même pas.
   */
  const commit = (next: Type_CouronneState, diagram: { dim: Class_DataTagGroup, ids: string[] }[] = []) => {
    const out = writeCouronneState(host.options, next)
    const asked = linked ? diagram : []
    const zooms = linked
      ? next.order.map(id => dimOf(id)).filter((d): d is Class_DataTagGroup => d !== undefined)
        .filter(d => next.dims[d.id] !== undefined && !sameIds(next.dims[d.id].focus, d.focus_ids))
      : []
    const cuts = asked.filter(c => !zooms.includes(c.dim) && c.ids.length > 0 && !sameIds(c.dim.selected_tags_list.map(m => m.id), c.ids))
    if (cuts.length === 0 && zooms.length === 0) { host.write(out); return }
    app.runHeavyGesture(() => inOneHistoryStep(app.history, () => {
      zooms.forEach(d => {
        const ids = asked.find(c => c.dim === d)?.ids ?? next.dims[d.id].shown
        applyDimensionFocus(app, d, next.dims[d.id].focus, ids)
      })
      cuts.forEach(c => applyDimensionCut(app, c.dim, c.ids, { multi: true }))
      host.write(out)
    }))
  }
  const sameIds = (a: string[], b: string[]) => a.length === b.length && a.every(id => b.includes(id))

  /** Les décochés d'avant qui tombent dans les nouveaux montrés (eux, ou un ancêtre décoché). */
  const hiddenFor = (d: Class_DataTagGroup, shown_ids: string[]) => {
    const hidden = membersOf(d, st(d.id)?.hidden ?? [])
    return membersOf(d, shown_ids).filter(m => hidden.some(h => underOrSelf(m, h))).map(m => m.id)
  }

  // ── EN-TÊTES : LA COLONNE ─────────────────────────────────────────────────────────────────────

  /**
   * La dimension `id` découpe au niveau `depth` : sa portée remonte au-dessus de ce niveau, ses
   * montrés sont les membres de ce niveau sous la portée. `alone` : les autres dimensions se
   * désactivent (le clic simple ; celle des cases reste).
   */
  const nextWithColumn = (s: Type_CouronneState, id: string, depth: number, alone: boolean) => {
    const d = dimOf(id)
    if (d === undefined) return null
    const entry = entryDepthOf(d)
    const focus: Class_DataTag[] = []
    focusOf(d).forEach(f => {
      if (d.depthOf(f) < depth) { if (!focus.includes(f)) focus.push(f); return }
      const up = depth - 1 >= entry ? ancestorAt(d, f, depth - 1) : undefined
      if (up !== undefined && !focus.includes(up)) focus.push(up)
    })
    const shown = coverScope(d, focus, [], () => depth)
    let next = withDim(s, id, { focus: focus.map(f => f.id), shown, hidden: hiddenFor(d, shown), active: true })
    if (alone) {
      next.order.forEach(o => { if (o !== id && o !== cells_dim) next = withDim(next, o, { active: false }) })
    }
    // Liée, le diagramme prend le niveau sous sa portée (07/10/2026 : la portée est partagée).
    const level = focus.length > 0 ? shown : (d.membersAtLevel(depth) as Class_DataTag[]).map(m => m.id)
    return { next, diagram: linked ? [{ dim: d, ids: level }] : [] }
  }
  const chooseColumn = (id: string, depth: number, alone: boolean) => {
    const r = nextWithColumn(state, id, depth, alone)
    if (r !== null) commit(r.next, r.diagram)
  }

  /**
   * Reclic sur la colonne qui découpe : la dimension se désactive (elle garde portée et montrés). Au
   * moins une reste active : si c'était la seule, la suivante s'active, et découpe d'un cran si elle
   * ne montrait qu'un membre.
   *
   * 05/10/2026 — EN « UNE COURONNE PAR MEMBRE », la dimension des cases COMPTE parmi les actives
   * (elle était exclue : retirer la dimension des parts ne faisait rien). Retirer celle des parts : il
   * ne reste que celle des cases, qui découpe alors seule, en secteurs (le plan ne fait de cases
   * qu'avec une autre dimension active) ; retirer celle des cases : plus de petits multiples, une
   * couronne découpée par les autres. Son dessin `multiples` reste, pour quand elle revient.
   */
  const deactivate = (id: string) => {
    const others = state.order.filter(o => o !== id)
    if (others.some(o => st(o).active)) { commit(withDim(state, id, { active: false })); return }
    const other = others[0]
    if (other === undefined) return
    const od = dimOf(other) as Class_DataTagGroup
    const base = withDim(state, id, { active: false })
    const parts = (st(other).shown ?? []).filter(m => !st(other).hidden.includes(m))
    if (parts.length >= 2) { commit(withDim(base, other, { active: true })); return }
    const r = nextWithColumn(base, other, Math.max(entryDepthOf(od), minDepth(od, focusOf(od), entryDepthOf(od) - 1) + 1), false)
    if (r !== null) commit(r.next, r.diagram)
  }

  // ── PARTS : DÉPLIER, REPLIER ─────────────────────────────────────────────────────────────────

  /** La sélection du diagramme quand `m` cède sa place à ses enfants (toute sa route s'ouvre). */
  const diagramUnfolded = (d: Class_DataTagGroup, m: Class_DataTag): string[] =>
    unfoldedIn(d, d.selected_tags_list as Class_DataTag[], m)
  /**
   * Des membres montrés `sel` quand `m` cède sa place à ses enfants : un montré au-dessus de `m` ouvre
   * toute sa route (ses autres enfants restent montrés à chaque cran).
   */
  const unfoldedIn = (d: Class_DataTagGroup, sel: Class_DataTag[], m: Class_DataTag): string[] => {
    const above = sel.filter(s => underOrSelf(m, s))
    const out = sel.filter(s => !above.includes(s)).map(s => s.id)
    above.forEach(s => {
      for (let p: Class_DataTag = m; p !== s;) {
        const parent = p.parent as Class_DataTag
        kidsOf(parent).forEach(c => { if (c !== p) out.push(c.id) })
        p = parent
      }
    })
    out.push(...(kidsOf(m).length > 0 ? kidsOf(m).map(c => c.id) : [m.id]))
    return antichainOf(d, out)
  }
  /** La sélection du diagramme quand ce qui est sous `p` se replie en `p`. */
  const diagramFolded = (d: Class_DataTagGroup, p: Class_DataTag): string[] =>
    antichainOf(d, [...(d.selected_tags_list as Class_DataTag[]).filter(s => !s.hasAncestor(p)).map(s => s.id), p.id])

  const refOf = (part_id: string) => {
    const refs = parseMemberSectorPath(part_id) ?? []
    const last = refs[refs.length - 1]
    const d = last ? dimOf(last.dimension_id) : undefined
    const m = d && last ? d.tags_dict[last.member_id] as Class_DataTag | undefined : undefined
    return { refs, d, m }
  }

  /** « Déplie » : la part cède sa place à ses enfants (mixte). Liée, le diagramme se déplie avec elle. */
  const unfold = (part_id: string) => {
    const { d, m } = refOf(part_id)
    if (d === undefined || m === undefined || kidsOf(m).length === 0) return
    if (linked) { commit(state, [{ dim: d, ids: diagramUnfolded(d, m) }]); return }
    const shown = antichainOf(d, [...(st(d.id).shown.filter(id => id !== m.id)), ...kidsOf(m).map(c => c.id)])
    commit(withDim(state, d.id, { shown, hidden: hiddenFor(d, shown) }))
  }
  /** Shift+clic « Déplie » : la part et ses voisins se replient dans leur parent (pas au-delà de la portée). */
  const fold = (part_id: string) => {
    const { d, m } = refOf(part_id)
    const p = m?.parent as Class_DataTag | undefined
    if (d === undefined || m === undefined || p === undefined) return
    if (focusOf(d).includes(p) || (p.parent === undefined && rootsOf(d).length === 1)) return
    if (linked) { commit(state, [{ dim: d, ids: diagramFolded(d, p) }]); return }
    const shown = antichainOf(d, [...st(d.id).shown.filter(id => !(d.tags_dict[id] as Class_DataTag).hasAncestor(p)), p.id])
    commit(withDim(state, d.id, { shown, hidden: hiddenFor(d, shown) }))
  }

  // ── 07/10/2026 (lot 2) — LES +/− DU TABLEAU CROISÉ ────────────────────────────────────────────
  //
  // Ouvrir une ligne ou une colonne = ouvrir un secteur du sunburst : la même information d'état
  // (`shown`, dont les ouverts se lisent). Liée, c'est la sélection du diagramme qui s'ouvre.

  /** + : `member_id` cède sa place à ses enfants ; montré sous un montré (une part unique ouverte d'un cran), sa route s'ouvre. */
  const openMember = (id: string, member_id: string) => {
    const d = dimOf(id)
    const m = d?.tags_dict[member_id] as Class_DataTag | undefined
    if (d === undefined || m === undefined || kidsOf(m).length === 0) return
    if (linked) { commit(state, [{ dim: d, ids: diagramUnfolded(d, m) }]); return }
    const shown = unfoldedIn(d, shownOf(d), m)
    commit(withDim(state, d.id, { shown, hidden: hiddenFor(d, shown) }))
  }
  /** − : ce qui est montré sous `member_id` se replie en lui (pas la portée, ni au-dessus). */
  const closeMember = (id: string, member_id: string) => {
    const d = dimOf(id)
    const m = d?.tags_dict[member_id] as Class_DataTag | undefined
    if (d === undefined || m === undefined || focusOf(d).some(f => underOrSelf(f, m))) return
    if (linked) { commit(state, [{ dim: d, ids: diagramFolded(d, m) }]); return }
    const shown = antichainOf(d, [...st(d.id).shown.filter(s => !(d.tags_dict[s] as Class_DataTag).hasAncestor(m)), m.id])
    commit(withDim(state, d.id, { shown, hidden: hiddenFor(d, shown) }))
  }
  /** Maj+clic : tout le niveau `depth` de la dimension (sous la portée), comme l'en-tête du tableau de navigation. */
  const showLevel = (id: string, depth: number) => {
    const r = nextWithColumn(state, id, depth, false)
    if (r !== null) commit(r.next, r.diagram)
  }

  // ── LA PORTÉE (ZOOM) ─────────────────────────────────────────────────────────────────────────

  /**
   * L'état quand la portée de `d` devient `ids`. Détachée, les montrés couvrent la nouvelle portée :
   * en descendant, au moins un niveau sous elle (à la colonne d'avant si elle est plus fine) ; en
   * remontant, à la profondeur de la portée quittée (« Céréales » redevient une part). Liée, c'est
   * pareil (07/10/2026, le zoom est partagé) : la portée et ces montrés deviennent la portée et la
   * sélection du diagramme (`commit`).
   */
  const nextWithFocus = (s: Type_CouronneState, d: Class_DataTagGroup, ids: string[]): Type_CouronneState => {
    const focus = membersOf(d, antichainOf(d, ids))
    const old_focus = focusOf(d)
    const old_shown = shownOf(d)
    const column = minDepth(d, old_shown, entryDepthOf(d))
    // Une couronne par membre zoomée sur plusieurs membres : une case chacun.
    if (d.id === cells_dim && focus.length > 1) {
      return withDim(s, d.id, { focus: focus.map(f => f.id), shown: focus.map(f => f.id), hidden: [] })
    }
    const outward = (f: Class_DataTag | null) => old_focus.some(o => f === null ? true : o !== f && o.hasAncestor(f))
    const depthFor = (f: Class_DataTag | null) => {
      if (outward(f)) {
        const quit = old_focus.filter(o => f === null || o.hasAncestor(f))
        return minDepth(d, quit, entryDepthOf(d))
      }
      return Math.max(column, f === null ? entryDepthOf(d) : d.depthOf(f) + 1)
    }
    const keep = old_shown.filter(m => !old_focus.some(o => underOrSelf(m, o)) || focus.some(f => m !== f && m.hasAncestor(f)))
    const shown = coverScope(d, focus, keep, depthFor)
    return withDim(s, d.id, { focus: focus.map(f => f.id), shown, hidden: hiddenFor(d, shown) })
  }
  /** La liste de zoom d'un niveau, le ✕ : la portée de `id` devient exactement `ids`. */
  const setFocus = (id: string, ids: string[]) => {
    const d = dimOf(id)
    if (d !== undefined) commit(nextWithFocus(state, d, ids))
  }

  /**
   * « Zoome » sur une part : chaque dimension de sa route prend ce membre pour portée ; la dimension
   * cliquée descend sous lui, les autres s'y lisent (ou gardent ce qu'elles montraient dessous).
   * Liée, le diagramme zoome avec elle (07/10/2026) ; détachée, la figure seule.
   */
  const zoomTo = (part_id: string) => {
    const { refs, d, m } = refOf(part_id)
    if (d === undefined || m === undefined) return
    // 05/10/2026 — UNE FEUILLE : la portée s'y pose si une autre dimension prend la découpe.
    const leaf = kidsOf(m).length === 0
    const cutter = leaf ? otherCutterFor(d.id) : undefined
    if (leaf && cutter === undefined) return
    let next = state
    refs.forEach(r => {
      const rd = dimOf(r.dimension_id)
      const rm = rd?.tags_dict[r.member_id] as Class_DataTag | undefined
      if (rd === undefined || rm === undefined) return
      if (rd === d) { next = nextWithFocus(next, rd, [rm.id]); return }
      const under = shownOf(rd).filter(x => x !== rm && x.hasAncestor(rm)).map(x => x.id)
      const shown = under.length > 0 ? under : [rm.id]
      next = withDim(next, rd.id, { focus: [rm.id], shown, hidden: hiddenFor(rd, shown) })
    })
    commit(cutter !== undefined ? withCutter(next, cutter) : next)
  }

  /**
   * 05/10/2026 — ZOOMER SUR UNE FEUILLE (Jean-Yves : « je ne peux pas voir quels pays importent du
   * blé ; ni ce qu'importe la Belgique »). Une feuille n'a plus rien à découper dans sa dimension ;
   * la portée s'y pose quand même dès qu'une AUTRE dimension peut découper : celle des cases, une
   * active à deux parts ou plus, sinon une activable (deux parts mémorisées, ou une part qui a des
   * enfants). `undefined` : aucune — le clic ne fait rien.
   */
  const partsIdsOf = (s: Type_CouronneState, o: string) => s.dims[o].shown.filter(id => !s.dims[o].hidden.includes(id))
  const otherCutterFor = (id: string): string | undefined => {
    const others = state.order.filter(o => o !== id)
    const cuts_now = (o: string) => plan.cells?.dimension_id === o || plan.cut.some(c => c.dimension_id === o)
    const can_cut = (o: string) => {
      const od = dimOf(o)
      if (od === undefined || o === cells_dim) return false
      const parts = partsIdsOf(state, o)
      return parts.length >= 2 || (parts.length === 1 && kidsOf(od.tags_dict[parts[0]] as Class_DataTag).length > 0)
    }
    return others.find(cuts_now) ?? others.find(can_cut)
  }
  /**
   * La dimension `o` prend la découpe : active sur ses parts mémorisées s'il y en a deux ; sur une
   * seule part qui a des enfants, sa portée s'y pose (elle découpe un niveau dessous ; liée, le
   * diagramme zoome avec elle, 07/10/2026).
   */
  const withCutter = (s: Type_CouronneState, o: string): Type_CouronneState => {
    const od = dimOf(o)
    if (od === undefined || o === cells_dim) return s
    const parts = partsIdsOf(s, o)
    if (parts.length >= 2) return withDim(s, o, { active: true })
    const one = od.tags_dict[parts[0]] as Class_DataTag | undefined
    if (one === undefined || kidsOf(one).length === 0) return s
    return withDim(nextWithFocus(s, od, [one.id]), o, { active: true })
  }
  /** Une feuille qu'un zoom peut regarder (une autre dimension prend la découpe). */
  const leafZoomable = (part_id: string): boolean => {
    const { d, m } = refOf(part_id)
    return d !== undefined && m !== undefined && kidsOf(m).length === 0 && otherCutterFor(d.id) !== undefined
  }
  /** La portée de `id` remonte d'un cran (partie à la racine unique). */
  const zoomUp = (id: string) => {
    const d = dimOf(id)
    if (d === undefined) return
    const single_root = rootsOf(d).length === 1
    const up: string[] = []
    focusOf(d).forEach(f => {
      const p = f.parent as Class_DataTag | undefined
      if (p === undefined || (single_root && p.parent === undefined)) return
      if (!up.includes(p.id)) up.push(p.id)
    })
    commit(nextWithFocus(state, d, up))
  }
  /**
   * Le centre « remonter » : la dernière dimension zoomée, hors celle des cases (sa portée choisit les
   * cases ; elle se remonte par le ✕ de son zoom).
   */
  const back_id = [...state.order].reverse().find(o => o !== cells_dim && st(o).focus.length > 0)
  const back = back_id === undefined ? undefined : () => zoomUp(back_id)

  /**
   * Le clic sur une part, selon « Clic sur une part » : déplier, ou zoomer ; shift+clic à l'envers.
   * 07/10/2026 — que le diagramme suive ne dépend que du LIEN (liée : oui ; détachée : non).
   */
  const activatePart = (part_id: string, gesture: { shift: boolean }, mode: Type_PartClickMode) => {
    if (partClickModeOf(mode) === 'zoom') {
      if (gesture.shift) { const { d } = refOf(part_id); if (d) zoomUp(d.id) } else zoomTo(part_id)
      return
    }
    if (gesture.shift) fold(part_id)
    // 05/10/2026 — « Déplie » sur une feuille ne se tait plus : il n'y a rien à déplier, il zoome
    // (la portée sur la feuille, une autre dimension découpe).
    else if (leafZoomable(part_id)) zoomTo(part_id)
    else unfold(part_id)
  }

  // ── LÉGENDE, ARBRE ───────────────────────────────────────────────────────────────────────────

  /** Une case de légende : décocher retire la part du dessin, la ligne reste (liée comme détachée). */
  const toggleHidden = (id: string, member_id: string, show: boolean) => {
    const s = st(id)
    if (s === undefined || !s.shown.includes(member_id)) return
    const hidden = show ? s.hidden.filter(h => h !== member_id) : [...new Set([...s.hidden, member_id])]
    if (hidden.length >= s.shown.length) return
    commit(withDim(state, id, { hidden }))
  }

  /**
   * Le sélecteur Arbre : les montrés deviennent exactement `ids` (n'importe quels niveaux). La portée
   * garde ceux de ses membres qui couvrent encore un choix. Liée : la sélection du diagramme.
   */
  const setShown = (id: string, ids: string[]) => {
    const d = dimOf(id)
    if (d === undefined || ids.length === 0) return
    const chosen = membersOf(d, antichainOf(d, ids))
    const focus = focusOf(d).filter(f => chosen.some(c => c !== f && c.hasAncestor(f))).map(f => f.id)
    if (linked) { commit(withDim(state, id, { focus }), [{ dim: d, ids: chosen.map(c => c.id) }]); return }
    const shown = chosen.map(c => c.id)
    commit(withDim(state, id, { focus, shown, hidden: hiddenFor(d, shown), active: true }))
  }
  /** Les membres que l'Arbre montre cochés : les montrés (liée : la sélection du diagramme). */
  const chosenOf = (id: string): string[] => {
    const d = dimOf(id)
    if (d === undefined) return []
    return linked ? (d.selected_tags_list as Class_DataTag[]).map(m => m.id) : st(id).shown.filter(m => !st(id).hidden.includes(m))
  }

  // ── ORDRE, DESSIN ────────────────────────────────────────────────────────────────────────────

  /**
   * Une dimension en « une couronne par membre » doit en montrer au moins deux : sinon elle descend
   * d'un niveau — détachée, sous sa portée ; liée, sa portée se pose sur le membre que le diagramme
   * montre seul (la règle liée la fait descendre dessous ; le diagramme prend la portée, sa sélection
   * ne change pas).
   */
  const withCells = (s: Type_CouronneState, d: Class_DataTagGroup): Type_CouronneState => {
    const ds = s.dims[d.id]
    if (ds.shown.filter(m => !ds.hidden.includes(m)).length >= 2) return s
    if (linked) {
      const one = (d.selected_tags_list as Class_DataTag[])[0]
      return one !== undefined && kidsOf(one).length > 0 ? withDim(s, d.id, { focus: [one.id] }) : s
    }
    const focus = membersOf(d, ds.focus)
    const depth = Math.max(entryDepthOf(d), ...membersOf(d, ds.shown).map(m => d.depthOf(m) + 1))
    return withDim(s, d.id, { shown: coverScope(d, focus, [], () => depth), hidden: [] })
  }

  /** ⇅ / ▲▼ : la ligne `id` monte ou descend ; la ligne du bas fait les cases s'il y en a. */
  const move = (row_ids: string[], id: string, delta: -1 | 1) => {
    const at = row_ids.indexOf(id)
    const to = at + delta
    if (at < 0 || to < 0 || to >= row_ids.length) return
    const order = [...row_ids]
    order[at] = row_ids[to]
    order[to] = id
    let next: Type_CouronneState = { ...state, order: [...order, ...state.order.filter(o => !order.includes(o))] }
    const was = state.order.find(o => st(o).drawing === 'multiples')
    const last = order[order.length - 1]
    if (was !== undefined && was !== last) {
      next = withDim(withDim(next, was, { drawing: 'sectors' }), last, { drawing: 'multiples', active: true })
      next = withCells(next, dimOf(last) as Class_DataTagGroup)
    }
    commit(next)
  }

  /**
   * 06/10/2026 — ⇄ DU TABLEAU CROISÉ : les dimensions `a` et `b` échangent leur place dans l'ordre (les
   * autres ne bougent pas). Même règle que ⇅ : si l'une fait les cases, l'autre les reprend.
   */
  const swap = (a: string, b: string) => {
    const ia = state.order.indexOf(a)
    const ib = state.order.indexOf(b)
    if (ia < 0 || ib < 0 || a === b) return
    const order = [...state.order]
    order[ia] = b
    order[ib] = a
    let next: Type_CouronneState = { ...state, order }
    const was = state.order.find(o => st(o).drawing === 'multiples')
    if (was === a || was === b) {
      const other = was === a ? b : a
      next = withDim(withDim(next, was, { drawing: 'sectors' }), other, { drawing: 'multiples', active: true })
      next = { ...next, order: [...next.order.filter(o => o !== other), other] }
      next = withCells(next, dimOf(other) as Class_DataTagGroup)
    }
    commit(next)
  }

  /**
   * 06/10/2026 — LES COLONNES DU TABLEAU CROISÉ : `col_id` devient la seconde dimension active (les
   * autres, hors `row_id`, se désactivent) ; `null` : plus de colonnes, `row_id` reste seule active.
   * Une dimension qui ne montre qu'un membre à enfants se pose dessus (elle découpe un cran dessous ;
   * liée, le diagramme ne bouge pas).
   */
  //
  // 07/10/2026 (lot 2) — PAR LES RÔLES : la dimension en colonnes prend le rôle CASES (« une couronne
  // par membre » : revenue à la couronne, une couronne par pays) et passe en fin d'ordre ; celle des
  // lignes, le rôle PARTS. Une colonne qui ne montre qu'un membre descend d'un cran (`withCells`).
  const setMatrixColumns = (row_id: string, col_id: string | null) => {
    if (st(row_id) === undefined || (col_id !== null && st(col_id) === undefined)) return
    const parts = (o: string) => st(o).drawing === 'multiples' ? { drawing: 'sectors' as const } : {}
    let next = withDim(state, row_id, { active: true, ...parts(row_id) })
    state.order.forEach(o => { if (o !== row_id && o !== col_id) next = withDim(next, o, { active: false, ...parts(o) }) })
    if (col_id !== null) {
      next = withDim(next, col_id, { active: true, drawing: 'multiples' })
      next = { ...next, order: [row_id, ...next.order.filter(o => o !== row_id && o !== col_id), col_id] }
      next = withCells(next, dimOf(col_id) as Class_DataTagGroup)
    }
    commit(next)
  }

  /** « En sunburst » a-t-il un effet ? La dimension doit montrer plus d'un niveau sous sa portée. */
  const offersRingsFor = (id: string): boolean => {
    const d = dimOf(id)
    if (d === undefined) return false
    const f = focusOf(d)
    const entry = f.length > 0 ? Math.min(...f.map(x => d.depthOf(x))) + 1 : entryDepthOf(d)
    return shownOf(d).some(m => d.depthOf(m) > entry)
  }
  /** « Une couronne par membre » demande une AUTRE dimension active pour les parts. */
  const offersMultiplesFor = (id: string): boolean => state.order.some(o => o !== id && st(o).active)
  const drawingOf = (id: string): Type_CouronneDrawing => st(id)?.drawing ?? 'sectors'
  /** Le dessin d'une ligne ; « une couronne par membre » est exclusif et passe la ligne en bas. */
  const setDrawing = (id: string, drawing: Type_CouronneDrawing) => {
    const d = dimOf(id)
    if (d === undefined || drawing === drawingOf(id)) return
    if (drawing !== 'multiples') { commit(withDim(state, id, { drawing })); return }
    if (!offersMultiplesFor(id)) return
    let next = state
    state.order.forEach(o => { if (o !== id && st(o).drawing === 'multiples') next = withDim(next, o, { drawing: 'sectors' }) })
    next = withDim(next, id, { drawing: 'multiples', active: true })
    next = { ...next, order: [...next.order.filter(o => o !== id), id] }
    commit(withCells(next, d))
  }

  /**
   * LIER / DÉTACHER. Détacher fige ce que la figure montre (la sélection projetée) ; lier rend `shown`
   * au diagramme. `also` : d'autres clés de la figure posées dans le même geste (épingles, couche).
   */
  const linkedOptions = (link: boolean, base: Type_Bag = host.options): Type_Bag =>
    writeCouronneState(base, { ...state, linked: link })

  return {
    state, plan, linked, cells_dim,
    chooseColumn, deactivate,
    unfold, fold, zoomTo, zoomUp, back, activatePart, openMember, closeMember, showLevel,
    setFocus, toggleHidden, setShown, chosenOf,
    move, swap, setMatrixColumns, offersRingsFor, offersMultiplesFor, drawingOf, setDrawing,
    linkedOptions
  }
}

export type Type_CouronneGestures = NonNullable<ReturnType<typeof couronneGesturesOf>>
