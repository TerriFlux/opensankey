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

// os#1511 (lot 6b, 11/10/2026) — LE TABLEAU CROISÉ (`osp.repr.matrix`), son état de vignette (+/−,
// « Autres » ouverts, tri, zoom) et son enregistrement ; sorti de `registerAnalysisRepresentations`,
// qui l'enregistre toujours avec les autres natures d'analyse.

import React from 'react'
import { MATRIX_OTHERS_PREFIX, buildDimensionMatrix, dimensionMatrixExportTable, matrixDecimals, matrixInputOfPlan, matrixNumberFormatter, nextMatrixSort, type Type_MatrixSort } from '../Charts/DimensionMatrix'
import { representation_registry, type Type_RepresentationContext, type Type_RepresentationZoom } from './RepresentationRegistry'
import { MATRIX_ZOOM_MAX, MATRIX_ZOOM_MIN, drawDimensionMatrixTable } from '../Charts/DimensionMatrixTable'
import { figureZoomHandle, publishFigureZoom } from '../Charts/figureZoomBridge'
import type { Type_FigureNavigation } from '../Charts/FigureNavigation'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_DataTag } from '../types/Tag'
import type { Type_MatrixPlan } from './dimensionViewState'
import { MATRIX_REPRESENTATION, type Type_CouronneSankey } from './couronneState'
import { dimensionRootsOf } from '../Charts/DataDimensionHierarchy'
import { displayedNameOf } from '../Elements/ElementNaming'
import type { Type_CouronneGestures } from './couronneGestures'
import { FaTable } from 'react-icons/fa'
import { MATRIX_ATTRIBUTES, matrixDecimalsChosen, matrixUnitOf } from './matrixAttributes'
import { analysisOf, couronneGesturesOfCtx, figureDimensionViewOf, hierarchyReadingOf, unitFactorOfSubject } from './analysisCore'
import { effectiveDecompose } from '../Charts/AnalysisDescriptor'
import { analysisDataCutOf } from '../Charts/AnalysisChartData'
import { DONUT_STYLE_DEFAULTS, figureChartStyleOf } from '../Charts/figureChartStyle'
import { OTHERS_MIN_SHARE_PCT } from '../Algorithms/DimensionOthers'
import { figureUnitOf, figureUnitOfNode } from './figureUnit'
import { figureNavigationTableOf } from './couronneNavigationTable'
import { ZOOM_TOPIC } from '../types/EventBus'
import { csvDecimalOf, downloadTable } from '../Charts/TableExport'

// ── os#1519 — LE TABLEAU CROISÉ ──────────────────────────────────────────────────────────────────
//
// Une autre lecture de la même analyse que la couronne : même sujet, même coupe (`analysisDataCutOf`,
// liée au diagramme par défaut), même cube. Ce n'est pas une figure À PARTS (rien à styler part par
// part) : elle s'enregistre directement, comme une vue, et se redessine sur place quand la coupe
// change (`redraw`), en gardant ses +/−.

/**
 * Les +/− posés dans chaque tableau HORS FENÊTRE (sans état où les écrire : page publiée), par vignette :
 * ils survivent au redessin. Dans une fenêtre, ils écrivent l'état commun (`openMember`).
 */
const matrix_row_toggles = new Map<string, Map<string, boolean>>()

const matrix_column_toggles = new Map<string, Map<string, boolean>>()

/** Les « Autres » ouverts (+) de chaque tableau : un état d'affichage, comme le tri. */
const matrix_others_open = new Map<string, Set<string>>()

/** Le tri choisi dans chaque tableau (absent : Total décroissant). */
const matrix_sorts = new Map<string, Type_MatrixSort>()

/** 07/10/2026 — le zoom de chaque tableau (absent : 100 %), un état d'affichage comme le tri. */
const matrix_zooms = new Map<string, number>()

/**
 * 07/10/2026 — LE ZOOM DU TABLEAU CROISÉ, capacité déclarée comme celle de la couronne : les boutons
 * −/+/% de la fenêtre parlent au tableau monté dans la vignette active (cf. `figureZoomBridge`). Des
 * crans de 25 %, comme un tableur ; « ajuster » revient à 100 %.
 */
const MATRIX_ZOOM: Type_RepresentationZoom = {
  getScale: (ctx) => matrixZoomHandleOf(ctx)?.getScale() ?? 1,
  setScale: (k, ctx) => matrixZoomHandleOf(ctx)?.setScale(k),
  scaleBy: (factor, ctx) => matrixZoomHandleOf(ctx)?.scaleBy(factor),
  step: 1.25,
  min: MATRIX_ZOOM_MIN,
  max: MATRIX_ZOOM_MAX,
  neutral: 1,
  isAvailable: (ctx) => matrixZoomHandleOf(ctx) !== null,
  fit: (ctx) => matrixZoomHandleOf(ctx)?.fit?.()
}

const matrixZoomHandleOf = (ctx: Type_RepresentationContext) =>
  figureZoomHandle(ctx.window_id, ctx.app_data.menu_configuration?.main_zone_active_pane_key)

/** Ce qu'on lit en plus du sujet : les coordonnées des dimensions SANS niveaux (l'année, par exemple). */
const matrixCoordinateLabel = (sankey: { data_taggs_list: unknown[] }, nav: Type_FigureNavigation): string =>
  (sankey.data_taggs_list as Class_DataTagGroup[])
    .filter(group => !group.is_hierarchical && group.tags_list.length > 1)
    .map(group => {
      const pinned = nav.data_tags?.filter(tag => tag.group.id === group.id) ?? []
      const shown = pinned.length > 0 ? pinned : (group.selected_tags_list as Class_DataTag[])
      return shown.map(tag => tag.name).join(', ')
    })
    .filter(text => text !== '')
    .join(' · ')

/** La portée des axes et la coordonnée des autres dimensions à niveaux, en noms (vide à la racine). */
const matrixScopeLabel = (plan: Type_MatrixPlan, sankey: Type_CouronneSankey): string => {
  const names = (id: string, ids: string[]) => {
    const d = sankey.data_taggs_dict[id] as Class_DataTagGroup | undefined
    if (d === undefined) return ''
    const roots = dimensionRootsOf(d).map(m => m.id)
    if (ids.length === roots.length && ids.every(m => roots.includes(m))) return ''
    return ids.map(m => d.tags_dict[m] as Class_DataTag | undefined).filter((m): m is Class_DataTag => m !== undefined)
      .map(m => displayedNameOf(m)).join(', ')
  }
  return [
    names(plan.rows.dimension_id, plan.rows.scope),
    ...(plan.columns ? [names(plan.columns.dimension_id, plan.columns.scope)] : []),
    // Les cases : leur portée seule (chaque petit tableau porte le nom de son membre).
    ...(plan.cases ? [names(plan.cases.dimension_id, plan.cases.scope)] : []),
    ...Object.entries(plan.coordinates).filter(([id]) => id !== plan.cases?.dimension_id).map(([id, ids]) => names(id, ids))
  ].filter(x => x !== '').join(' · ')
}

/** Un +/− du tableau, sur la dimension `dim_id` : le membre, ou tout son niveau (Maj). */
const toggleAxisMember = (
  g: Type_CouronneGestures, sankey: Type_CouronneSankey, dim_id: string, member_id: string, expanded: boolean, level: boolean
): void => {
  const d = sankey.data_taggs_dict[dim_id] as Class_DataTagGroup | undefined
  const m = d?.tags_dict[member_id] as Class_DataTag | undefined
  if (d === undefined || m === undefined) return
  if (level) g.showLevel(dim_id, d.depthOf(m) + (expanded ? 1 : 0))
  else if (expanded) g.openMember(dim_id, member_id)
  else g.closeMember(dim_id, member_id)
}

export const registerDimensionMatrix = (): void => {
  representation_registry.register({
    id: MATRIX_REPRESENTATION,
    scale: 'element',
    order: 35,
    label: (a) => a.t('matrix.label'),
    description: (a) => a.t('Spreadsheet.zone.type_description.matrix'),
    icon: <FaTable />,
    zoom: MATRIX_ZOOM,
    // sa#623 — SES RÉGLAGES À LUI (décimales, unité affichée, « Autres ») : déclarés, ils lui donnent
    // son menu de configuration — sans eux, la roue montrait ceux du diagramme (cf. matrixAttributes).
    attributes: MATRIX_ATTRIBUTES,
    reads_generated_origin: true,
    // Julien, 07/10 : le tableau d'un flux engendré « → Europe » montre TOUS les continents.
    generated_origin_whole: true,
    // Sur une décomposition par dimension(s) de données seulement : c'est elle qui a des lignes et
    // des colonnes. Un sujet sans dimension à niveaux n'a rien à croiser.
    isAvailable: (ctx) => {
      const a = analysisOf(ctx)
      return !!a && effectiveDecompose(a.descriptor)?.kind === 'data_dimension'
    },
    draw: (container, ctx) => {
      const t = ctx.app_data.t
      const key = `${ctx.window_id ?? ''}|${ctx.pane_key ?? ''}`
      const toggles = matrix_row_toggles.get(key) ?? new Map<string, boolean>()
      matrix_row_toggles.set(key, toggles)
      const column_toggles = matrix_column_toggles.get(key) ?? new Map<string, boolean>()
      matrix_column_toggles.set(key, column_toggles)
      const others_open = matrix_others_open.get(key) ?? new Set<string>()
      matrix_others_open.set(key, others_open)
      /** + / − sur un « Autres » : il montre ou cache ses membres repliés. */
      const toggleOthers = (id: string, expanded: boolean): boolean => {
        if (!id.startsWith(MATRIX_OTHERS_PREFIX)) return false
        if (expanded) others_open.add(id)
        else others_open.delete(id)
        render()
        return true
      }
      let teardown: () => void = () => { container.innerHTML = '' }

      const render = () => {
        teardown()
        const a = analysisOf(ctx)
        const decompose = a ? effectiveDecompose(a.descriptor) : null
        if (!a || decompose?.kind !== 'data_dimension') {
          container.innerHTML = ''
          return
        }
        const reading = hierarchyReadingOf(ctx)
        // 07/10/2026 (os#1511, lot 2) — LE MODÈLE COMMUN : l'état de la fenêtre (`fromFigure`, le même
        // sac que la couronne) et son plan de tableau (`planFor(…, 'matrix')`) — lignes = la dimension
        // en rôle parts, colonnes = celle en rôle cases, axes ouverts comme le sunburst, restreints à la
        // portée, sans les décochés. L'ancienne coupe (`analysisDataCutOf`) ne sert plus qu'à défaut.
        const sankey = ctx.app_data.drawing_area.sankey as unknown as Type_CouronneSankey
        // 07/10/2026 — CORRECTION DE JULIEN : lignes puis colonnes = les dimensions en parts (dans
        // l'ordre), plates ou hiérarchiques ; les cases = un tableau par membre. Un sac d'avant la
        // version 2 garde ses colonnes (`reader: 'matrix'`).
        // 09/10/2026 (lot 3) — lu au point de décision commun (`figureDimensionViewOf`).
        const figure_view = figureDimensionViewOf(ctx, 'matrix')
        const view_state = figure_view?.view ?? null
        const plan = (figure_view?.plan ?? null) as Type_MatrixPlan | null
        const input = plan ? matrixInputOfPlan(plan, sankey) : null
        const cut = input
          ? { linked: view_state?.linked ?? false, dims: [], dividing: [], opened: new Set<string>() }
          : analysisDataCutOf(a.subject, decompose, reading)
        const subject = a.subject.kind === 'node'
          ? { kind: 'node' as const, node: a.subject.node }
          : { kind: 'link' as const, link: a.subject.link }
        // Dans une fenêtre, les +/− écrivent l'état (`gestures`) ; hors fenêtre, ils restent au tableau.
        const gestures = input ? couronneGesturesOfCtx(ctx, 'matrix') : null
        // 07/10/2026 — « AUTRES » COMME LA COURONNE : ses réglages (`parts_group_under`, `parts_max`),
        // les lignes en parts, les colonnes en cases (seuil des bandes tant que l'auteur n'en pose pas).
        const style = figureChartStyleOf(ctx.options ?? {}, DONUT_STYLE_DEFAULTS)
        const matrix = cut === null ? null : buildDimensionMatrix(subject, cut, a.nav, {
          others: {
            label: t('sunburst.others') as string,
            rows: { min_share_pct: style.parts_group_under, max_parts: style.parts_max },
            columns: {
              min_share_pct: style.parts_group_under > 0 ? style.parts_group_under : OTHERS_MIN_SHARE_PCT,
              max_parts: style.parts_max
            },
            opened: others_open
          },
          axes: input ? { rows: input.rows, columns: input.columns } : undefined,
          cases: input?.cases,
          row_toggles: gestures ? undefined : toggles,
          column_toggles: gestures ? undefined : column_toggles,
          sort: matrix_sorts.get(key),
          coordinates: input?.coordinates,
          node_value_mode: reading.node_value_mode,
          residual_label: t('matrix.unallocated'),
          total_label: t('matrix.total'),
          value_label: t('matrix.value'),
          share_label: t('matrix.share')
        })
        const app_data = ctx.app_data
        const element = a.subject.kind === 'node' ? a.subject.node : a.subject.link
        // sa#623 — L'UNITÉ CHOISIE pour ce tableau (réglage `matrix_unit`), sinon celle du diagramme.
        const shown_unit = matrixUnitOf(ctx.options ?? {}, element, {
          label: a.subject.kind === 'node' ? figureUnitOfNode(a.subject.node) : figureUnitOf(app_data.drawing_area.sankey),
          factor: unitFactorOfSubject(a.subject, app_data)
        })
        const unit = shown_unit.label
        const factor = shown_unit.factor
        const lang = app_data.language || 'fr'
        // Des décimales FIXES pour tout le tableau (cf. `matrixDecimals`), l'unité dans l'en-tête.
        // sa#623 — celles que l'auteur a fixées (`matrix_decimals`), sinon d'après le total.
        const total_row = matrix?.rows[matrix.rows.length - 1]
        const grand = (total_row?.cells[matrix?.column_dimension ? total_row.cells.length - 1 : 0] ?? 0) / factor
        const decimals = matrixDecimalsChosen(ctx.options ?? {}) ?? matrixDecimals(grand)
        const numbers = matrixNumberFormatter(decimals, lang)
        const format = (v: number) => numbers(v / factor)
        const percent = new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 1 })
        const coordinate = matrixCoordinateLabel(element.sankey, a.nav)
        // 07/10/2026 — LA PORTÉE DANS LE TITRE (« Céréales ») : le tableau est restreint au zoom, il le
        // dit ; et les dimensions hors des axes lues ailleurs qu'à leur tout (« Europe »).
        const scope = plan ? matrixScopeLabel(plan, sankey) : ''
        const title = [displayedNameOf(element), scope, coordinate].filter(x => x !== '').join(' · ')
        // 07/10/2026 — LE TABLEAU DE NAVIGATION de la couronne, au-dessus du tableau croisé : lignes,
        // colonnes (⇅) et tableaux par membre s'y règlent (08/10 : seul, le sélecteur « Colonnes : » et
        // ⇄ de l'en-tête retirés).
        const row_id = plan?.rows.dimension_id
        const col_id = plan?.columns?.dimension_id ?? null
        const navigation = gestures ? figureNavigationTableOf(ctx, 'matrix') ?? undefined : undefined
        teardown = drawDimensionMatrixTable(container, matrix, {
          navigation,
          zoom: {
            scale: matrix_zooms.get(key) ?? 1,
            on_scale: (k: number) => {
              matrix_zooms.set(key, k)
              ctx.app_data.menu_configuration.notify(ZOOM_TOPIC)
            },
            publish: (handle) => publishFigureZoom(ctx.window_id, ctx.pane_key, handle)
          },
          format,
          format_share: (v) => percent.format(v),
          title,
          unit,
          labels: {
            expand: t('matrix.expand'), collapse: t('matrix.collapse'),
            export_xlsx: t('matrix.export_xlsx'), export_csv: t('matrix.export_csv'), empty: t('matrix.empty'),
            subtotal: (name: string) => t('matrix.subtotal', { name, defaultValue: 'Total {{name}}' }) as string
          },
          // 07/10/2026 (lot 2) — +/− d'une ligne ou d'une colonne : l'état commun (le secteur du
          // sunburst s'ouvre de même) ; Maj+clic : tout le niveau.
          on_toggle: (member_id, expanded, gesture) => {
            if (toggleOthers(member_id, expanded)) return
            if (gestures && row_id !== undefined) {
              toggleAxisMember(gestures, sankey, row_id, member_id, expanded, gesture.shift)
              return
            }
            toggles.set(member_id, expanded)
            render()
          },
          on_column_toggle: (member_id, expanded, gesture) => {
            if (toggleOthers(member_id, expanded)) return
            if (gestures && col_id !== null) {
              toggleAxisMember(gestures, sankey, col_id, member_id, expanded, gesture.shift)
              return
            }
            column_toggles.set(member_id, expanded)
            render()
          },
          level_hint: gestures ? t('matrix.level_hint', { defaultValue: 'Maj+clic : tout le niveau' }) as string : undefined,
          // 09/10/2026 (lot 3) — DÉCOCHER UNE LIGNE : le geste de la légende de la couronne
          // (`toggleHidden` → liée, `applyDimensionHidden` sur le diagramme).
          on_check: gestures && row_id !== undefined
            ? (member_id, checked) => gestures.toggleHidden(row_id, member_id, checked)
            : undefined,
          check_label: (name: string) => t('sunburst.nav.toggle_part', { name }) as string,
          sort_label: t('matrix.sort_by'),
          on_sort: (sort_key) => {
            if (matrix === null) return
            matrix_sorts.set(key, nextMatrixSort(matrix.sort, sort_key))
            render()
          },
          // sa#593 — le tableau tel qu'il est affiché (lignes ouvertes, tri), en Excel ou en CSV,
          // sans passer par le serveur : le lecteur d'une page publiée exporte aussi.
          on_export: (format) => {
            if (matrix === null) return
            const table = dimensionMatrixExportTable(matrix, {
              title, factor, unit, unit_label: t('matrix.unit'), decimals
            })
            void downloadTable(table, format, { decimal: csvDecimalOf(lang) })
          }
        })
      }
      render()
      return { redraw: render, cleanup: () => teardown() }
    }
  })
}
