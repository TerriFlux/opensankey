// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1473 — LA COURONNE ET LES BARRES SONT DES FIGURES D'OPENSANKEY, comme le sunburst.
//
// Julien : « je ne comprends pas que sunburst soit dans OpenSankey et couronne dans OpenSankey
// Plus. Ça n'a pas de sens. » Il avait raison, et l'explication est historique, pas une raison :
// la couronne et les barres viennent de la pop-up de présentation d'OS+ (`element_analyses_for`)
// et y sont restées quand elles sont devenues des figures. Leurs TRACÉS, eux, ont toujours vécu ici
// (`Charts/NodeStatsCharts`).
//
// Mesuré avant de bouger : aucun des modules qui les portent n'importait quoi que ce soit d'OS+.
// Ce fichier est donc un DÉPLACEMENT PUR de `registerOSPRepresentations` — les aides d'analyse et
// les deux enregistrements —, l'étoile seule restant en OS+ où vit son document.
//
// Ce que ça rend possible, et c'est le but (cf. notes/figures/figures-etat-et-cap.md) : les deux
// moitiés du mécanisme des figures vivent enfin dans le même paquet, et peuvent converger.

// os#1511 (lot 6b, 11/10/2026) — LE TABLEAU DE NAVIGATION D'UNE FIGURE SUR DIMENSIONS DE DONNÉES
// (couronne et tableau croisé), sorti de `registerAnalysisRepresentations`. Le tracé du tableau vit
// dans `figureNavigationTable` ; ici, ce que la figure y met et les gestes qu'il appelle.

import type { Type_RepresentationContext } from './RepresentationRegistry'
import { couronneGesturesOfCtx } from './analysisCore'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_DataTag } from '../types/Tag'
import type { Type_FigureNavZoomPick } from './figureNavigationPopover'
import { dimensionRootsOf } from '../Charts/DataDimensionHierarchy'
import { DONUT_REPRESENTATION, MATRIX_REPRESENTATION } from './couronneState'
import { buildFigureNavigationTable, levelShortName, type Type_FigureNavDimension } from './figureNavigationTable'
import { displayedNameOf } from '../Elements/ElementNaming'
import type { Type_CouronneGestures } from './couronneGestures'
import type { Type_TopbarFigureChoice } from '../types/MenuConfig'

/**
 * 03/10/2026 — LE TABLEAU DE NAVIGATION D'UNE COURONNE SUR DIMENSIONS DE DONNÉES (os#1511), à la place
 * de son fil d'Ariane. Jean-Yves : « je clique sur Céréales et je veux voir les pays qui importent ⇒
 * je clique sur l'en-tête Pays du tableau ».
 *
 * LE MODÈLE EST CELUI DE LA FIGURE, rien de parallèle :
 *  - LA COLONNE (dimension d, niveau n) = d découpe au niveau n (sa coupe : la figure détachée écrit
 *    `dimension_opening`, liée le geste annulable du diagramme, comme la barre du haut) et les autres
 *    dimensions sont DÉSACTIVÉES (`inactive_dimensions`) : lues à leur zoom, ou entières (racine) ;
 *  - LE ZOOM PAR DIMENSION = le dernier cran de `hierarchy_focus` (un membre par dimension, la
 *    dimension qui découpe en dernier, cf. `withFigureDimensionZooms`) ; l'ancienne pile se relit par
 *    son dernier cran.
 * L'en-tête surligné est lu sur ce que la couronne DESSINE (la profondeur de sa frontière), pas sur un
 * état à part. `null` : la figure ne découpe pas selon des dimensions de données, ou hors fenêtre.
 */
export const figureNavigationTableOf = (
  ctx: Type_RepresentationContext, representation: 'couronne' | 'matrix' = 'couronne', vertical = false
): HTMLElement | null => {
  // 04/10/2026 (lot 3) — LU SUR LE PLAN, ÉCRIT PAR LES GESTES DE LA COURONNE (`couronneGestures`) :
  // plus aucune coupe ni ancienne clé ici.
  // 07/10/2026 — LE MÊME TABLEAU AU-DESSUS DU TABLEAU CROISÉ (`representation: 'matrix'`) : mêmes
  // en-têtes, ctrl+clic, ⇅ (= lignes / colonnes), cases de zoom, ⚙ ; son sélecteur de dessin dit
  // Plat / Hiérarchique / Un tableau par membre.
  const matrix = representation === 'matrix'
  const g = couronneGesturesOfCtx(ctx, matrix ? 'matrix' : 'couronne')
  const { window_id, pane_key } = ctx
  if (g === null || window_id === undefined || pane_key === undefined) return null
  const { state, plan } = g
  const app_data = ctx.app_data
  const t = app_data.t
  const sankey_dims = app_data.drawing_area.sankey.data_taggs_dict as unknown as { [id: string]: Class_DataTagGroup | undefined }
  const rows = state.order.map(id => sankey_dims[id]).filter((d): d is Class_DataTagGroup => d !== undefined)
  if (rows.length === 0) return null
  // Le zoom de chaque dimension est sa portée (une liste de membres, « Europe ✕ Amériques ✕ »).
  const zooms = new Map<string, Class_DataTag[]>()
  rows.forEach(d => {
    const list = (state.dims[d.id]?.focus ?? [])
      .map(m => d.tags_dict[m] as Class_DataTag | undefined).filter((m): m is Class_DataTag => m !== undefined)
    if (list.length > 0) zooms.set(d.id, list)
  })
  const ancestorAt = (dim: Class_DataTagGroup, member: Class_DataTag, depth: number): Class_DataTag | undefined => {
    let m: Class_DataTag | undefined = member
    while (m !== undefined && dim.depthOf(m) > depth) m = m.parent as Class_DataTag | undefined
    return m !== undefined && dim.depthOf(m) === depth ? m : undefined
  }
  /** La portée de `dim` ramenée au-dessus de `depth`. */
  const focusAbove = (dim: Class_DataTagGroup, depth: number, entry_depth: number): string[] => {
    const out: Class_DataTag[] = []
    ;(zooms.get(dim.id) ?? []).forEach(z => {
      if (dim.depthOf(z) < depth) { if (!out.includes(z)) out.push(z); return }
      const up = depth - 1 >= entry_depth ? ancestorAt(dim, z, depth - 1) : undefined
      if (up && !out.includes(up)) out.push(up)
    })
    return out.map(m => m.id)
  }
  /**
   * LA LISTE DU ZOOM D'UN NIVEAU : cocher les membres de la portée de `depth`, à n'importe quel niveau,
   * comme le filtre d'Excel (proposés : sous la portée des niveaux au-dessus ; cochés : ceux que la
   * portée garde ; tout cocher sans portée plus profonde : plus de portée à ce niveau).
   */
  const zoomPickAt = (dim: Class_DataTagGroup, depth: number, entry_depth: number): Type_FigureNavZoomPick | undefined => {
    const zs = zooms.get(dim.id) ?? []
    const at_level = dim.membersAtLevel(depth) as Class_DataTag[]
    const above = new Set<Class_DataTag>()
    if (depth - 1 >= entry_depth) {
      zs.forEach(z => {
        if (dim.depthOf(z) < depth) above.add(z)
        else { const up = ancestorAt(dim, z, depth - 1); if (up) above.add(up) }
      })
    }
    const members = above.size === 0 ? at_level : at_level.filter(m => [...above].some(z => m.hasAncestor(z)))
    if (members.length === 0) return undefined
    const kept = (m: Class_DataTag) => zs.length === 0 || zs.some(z => z === m || m.hasAncestor(z) || z.hasAncestor(m))
    return {
      members,
      chosen: members.filter(kept).map(m => m.id),
      apply: (ids: string[], candidates: Class_DataTag[]) => {
        const picked = candidates.filter(m => ids.includes(m.id))
        if (picked.length === 0) return
        const deeper = zs.some(z => dim.depthOf(z) > depth)
        if (picked.length === candidates.length && !deeper) { g.setFocus(dim.id, focusAbove(dim, depth, entry_depth)); return }
        const picked_set = new Set(picked)
        const next: Class_DataTag[] = []
        const covered = new Set<Class_DataTag>()
        zs.forEach(z => {
          if (dim.depthOf(z) < depth) {
            const under = candidates.filter(m => m.hasAncestor(z))
            const kept_under = under.filter(m => picked_set.has(m))
            kept_under.forEach(m => covered.add(m))
            if (kept_under.length === 0 && under.length > 0) return
            if (kept_under.length === under.length) next.push(z)
            else next.push(...kept_under)
            return
          }
          const up = ancestorAt(dim, z, depth)
          if (up !== undefined && picked_set.has(up)) { next.push(z); covered.add(up) }
          else if (up !== undefined && !candidates.includes(up)) next.push(z)
        })
        picked.forEach(m => { if (!covered.has(m)) next.push(m) })
        g.setFocus(dim.id, next.map(m => m.id))
      }
    }
  }
  const entryDepthOf = (d: Class_DataTagGroup) => dimensionRootsOf(d).length === 1 ? 1 : 0
  // Les cases (« une couronne par membre ») : leur niveau est surligné aussi.
  const cells_dim = plan.cells_dimension_id
  // 09/10/2026 (lot 3) — la nature de la vignette : OS+ en tire le lecteur de ses gestes.
  const extras = app_data.menu_configuration.figure_navigation_extras?.(ctx, matrix ? MATRIX_REPRESENTATION : DONUT_REPRESENTATION) ?? null

  const dimensions: Type_FigureNavDimension[] = rows.map(dim => {
    const entry_depth = entryDepthOf(dim)
    const is_cells = cells_dim === dim.id
    const zs = zooms.get(dim.id) ?? []
    const divides = is_cells || plan.cut.some(c => c.dimension_id === dim.id)
    const depths = plan.columns[dim.id]?.depths ?? []
    const in_rings = state.dims[dim.id]?.drawing === 'sunburst'
    // 05/10/2026 — MIXTE (« Céréales » dépliée) : tous les niveaux dessinés se surlignent, et la ligne
    // le dit (« — mixte — »).
    const mixed = divides && (plan.columns[dim.id]?.mixed ?? false)
    /** La colonne qui découpe : la plus fine dessinée en sunburst, la plus haute en secteurs. */
    const column_depth = divides && depths.length > 0
      ? (in_rings ? Math.max(...depths) : Math.min(...depths))
      : undefined
    const levels = (dim.levels as string[]).map((raw, depth) => ({ raw, depth })).filter(l => l.depth >= entry_depth)
    return {
      id: dim.id,
      name: dim.name,
      drawing: drawingChoiceOf(ctx, g, dim.id, representation),
      summary: mixed && !in_rings ? t('Banner.cut_custom') as string : undefined,
      members: extras?.members?.(dim.id) ?? undefined,
      levels: levels.map(({ raw, depth }) => {
        const at_level: Class_DataTag[] = []
        zs.forEach(z => {
          const m = ancestorAt(dim, z, depth)
          if (m !== undefined && !at_level.includes(m)) at_level.push(m)
        })
        const order = dim.membersAtLevel(depth) as Class_DataTag[]
        at_level.sort((x, y) => order.indexOf(x) - order.indexOf(y))
        const column = column_depth === depth
        const active = column_depth !== undefined && (in_rings ? depth <= column_depth : mixed ? depths.includes(depth) : column)
        return {
          label: levelShortName(raw),
          active,
          column,
          zooms: at_level.length === 0 ? undefined : at_level.map(m => levelShortName(displayedNameOf(m))),
          // ✕ : cette portée et celles en dessous, dans cette dimension.
          clear: at_level.length === 0 ? undefined : () => g.setFocus(dim.id, focusAbove(dim, depth, entry_depth)),
          pick: zoomPickAt(dim, depth, entry_depth),
          // Clic simple : cette colonne seule ; reclic sur la colonne qui découpe : désactivée. La ligne
          // des cases : son en-tête règle le niveau des cases, les autres dimensions restent.
          choose: is_cells
            ? (active ? undefined : () => g.chooseColumn(dim.id, depth, false))
            : column ? () => g.deactivate(dim.id) : () => g.chooseColumn(dim.id, depth, true),
          // Ctrl+clic : ajoutée aux colonnes qui découpent (les autres restent), ou retirée — la ligne des
          // cases aussi (05/10/2026 : plus de petits multiples, son dessin reste pour son retour).
          choose_with: column ? () => g.deactivate(dim.id) : () => g.chooseColumn(dim.id, depth, false)
        }
      })
    }
  })
  return buildFigureNavigationTable({
    dimensions,
    // os#1527 (10/10) — en tête de la colonne de légende, quand elle est à côté du disque.
    vertical,
    memory_key: `${window_id}/${pane_key}`,
    t: (key: string, o?: { [k: string]: unknown }) => t(key, o),
    move: (dim_id, delta) => g.move(rows.map(d => d.id), dim_id, delta),
    // Le tableau n'a pas de parts à cliquer : « Clic sur une part » ne s'y propose pas.
    settings: matrix ? extras?.settings?.filter(s => !s.key.includes('interaction_click')) : extras?.settings,
    labels: {
      title: t('sunburst.nav.title') as string,
      dimension: (name: string) => t('sunburst.nav.dimension', { name }) as string,
      cut_by: (level: string) => t('sunburst.nav.cut_by', { level }) as string,
      clear_zoom: t('sunburst.nav.clear_zoom') as string,
      pick_zoom: t('sunburst.nav.pick_zoom') as string,
      drawing: matrix
        ? t('matrix.nav.drawing', { defaultValue: 'Comment cette dimension se dessine dans le tableau' }) as string
        : t('sunburst.nav.drawing') as string,
      // 04/10/2026 — libellés en français par défaut, traduits en une passe quand l'itération s'arrête.
      uncut: (level: string) => t('sunburst.nav.uncut', {
        level, defaultValue: 'Découpé par {{level}} — recliquer pour ne plus découper par cette dimension'
      }) as string,
      ctrl_hint: t('sunburst.nav.ctrl_hint', {
        defaultValue: 'Ctrl+clic (⌘+clic) : ajouter cette colonne à celles qui découpent, ou l\'en retirer'
      }) as string,
      swap: matrix
        ? t('matrix.nav.swap', { defaultValue: 'Échanger lignes et colonnes (ligne du haut = lignes du tableau)' }) as string
        : t('sunburst.nav.swap', {
          defaultValue: 'Échanger l\'ordre des dimensions (ligne du haut = anneau intérieur)'
        }) as string,
      move_up: matrix
        ? t('matrix.nav.move_up', { defaultValue: 'Monter cette dimension (vers les lignes)' }) as string
        : t('sunburst.nav.move_up', { defaultValue: 'Monter cette dimension (vers l\'anneau intérieur)' }) as string,
      move_down: matrix
        ? t('matrix.nav.move_down', { defaultValue: 'Descendre cette dimension (vers les colonnes)' }) as string
        : t('sunburst.nav.move_down', { defaultValue: 'Descendre cette dimension (vers l\'anneau extérieur)' }) as string,
      settings: matrix
        ? t('matrix.nav.settings', { defaultValue: 'Réglages du tableau' }) as string
        : t('sunburst.nav.settings', { defaultValue: 'Réglages de la couronne' }) as string,
      members: t('sunburst.nav.members', { defaultValue: 'Choisir les membres' }) as string
    }
  })
}

/**
 * 04/10/2026 (lot 3) — LE SÉLECTEUR DE DESSIN D'UNE LIGNE : en secteurs, en sunburst, une couronne par
 * membre (exclusif). Un choix sans effet se grise avec sa raison ; le choix courant reste toujours
 * sélectionnable pour en sortir.
 */
const drawingChoiceOf = (
  ctx: Type_RepresentationContext, g: Type_CouronneGestures, dim_id: string, representation: 'couronne' | 'matrix' = 'couronne'
): Type_TopbarFigureChoice => {
  const t = ctx.app_data.t
  const now = g.drawingOf(dim_id)
  const value = now === 'sunburst' ? 'rings' : now
  const rings_ok = g.offersRingsFor(dim_id) || value === 'rings'
  const multiples_ok = g.offersMultiplesFor(dim_id) || value === 'multiples'
  if (representation === 'matrix') {
    // 07/10/2026 — LE TABLEAU CROISÉ : le même dessin écrit (secteurs = plat, sunburst =
    // hiérarchique, une couronne par membre = un tableau par membre), ses propres mots.
    return {
      key: `dimension_drawing:${dim_id}`,
      label: t('matrix.nav.drawing', { defaultValue: 'Comment cette dimension se dessine dans le tableau' }) as string,
      value,
      options: [
        { value: 'sectors', label: t('matrix.draw_flat', { defaultValue: 'Plat' }) as string, icon: 'table_flat' },
        {
          value: 'rings', label: t('matrix.draw_hierarchical', { defaultValue: 'Hiérarchique' }) as string, icon: 'table_tree',
          disabled: !rings_ok,
          title: rings_ok ? undefined : t('matrix.draw_hierarchical_unavailable', {
            defaultValue: 'Un seul niveau est montré : dépliez un membre (+) ou choisissez un niveau plus fin'
          }) as string
        },
        {
          value: 'multiples', label: t('matrix.draw_tables', { defaultValue: 'Un tableau par membre' }) as string, icon: 'table_multiples',
          disabled: !multiples_ok,
          title: multiples_ok ? undefined : t('matrix.draw_tables_unavailable', {
            defaultValue: 'Il faut une autre dimension active pour les lignes'
          }) as string
        }
      ],
      choose: (v) => g.setDrawing(dim_id, v === 'rings' ? 'sunburst' : v === 'multiples' ? 'multiples' : 'sectors')
    }
  }
  return {
    key: `dimension_drawing:${dim_id}`,
    label: t('sunburst.nav.drawing') as string,
    value,
    options: [
      { value: 'sectors', label: t('Banner.draw_sectors') as string, icon: 'sectors' },
      {
        value: 'rings', label: t('Banner.draw_rings') as string, icon: 'rings',
        disabled: !rings_ok, title: rings_ok ? undefined : t('Banner.draw_rings_unavailable') as string
      },
      {
        value: 'multiples', label: t('Banner.draw_small_multiples') as string, icon: 'multiples',
        disabled: !multiples_ok, title: multiples_ok ? undefined : t('Banner.draw_small_multiples_unavailable') as string
      }
    ],
    choose: (v) => g.setDrawing(dim_id, v === 'rings' ? 'sunburst' : v === 'multiples' ? 'multiples' : 'sectors')
  }
}
