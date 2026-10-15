// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1530 — LE TABLEAU CROISÉ DES FLUX, à l'échelle du DIAGRAMME (`os.repr.flux_matrix`).
//
// Julien, 15/10/2026 : le tableau croisé branché sur les seules dimensions à niveaux est « une
// limitation inutile, il faudrait que ça marche sur toutes les dimensions ». Premier lot : l'axe des
// NŒUDS. Lignes = d'où partent les flux visibles, colonnes = où ils vont, cellule = leur somme à la
// coordonnée de données courante ; chaque axe se lit soit nœud par nœud, soit par un groupe
// d'étiquettes de nœuds (les flux s'agrègent par étiquette). Deux réglages de figure, un tableau.
//
// Rien de redessiné à part : la matrice (`buildFluxMatrix`) a la forme de celle du cube, le dessin,
// le tri, le zoom et l'export sont ceux de `DimensionMatrixTable`.

import React from 'react'
import { FaTable } from 'react-icons/fa'
import { representation_registry, type Type_RepresentationContext, type Type_RepresentationZoom } from './RepresentationRegistry'
import { figureAttribute } from './figureAttribute'
import { buildFluxMatrix, type Type_FluxCell } from '../Charts/FluxMatrix'
import { dimensionMatrixExportTable, matrixDecimals, matrixNumberFormatter, nextMatrixSort, type Type_MatrixSort } from '../Charts/DimensionMatrix'
import { MATRIX_ZOOM_MAX, MATRIX_ZOOM_MIN, drawDimensionMatrixTable } from '../Charts/DimensionMatrixTable'
import { figureZoomHandle, publishFigureZoom } from '../Charts/figureZoomBridge'
import { csvDecimalOf, downloadTable } from '../Charts/TableExport'
import { displayedNameOf } from '../Elements/ElementNaming'
import { figureUnitOf } from './figureUnit'
import { ZOOM_TOPIC } from '../types/EventBus'
import type { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_NodeTagGroup } from '../types/TagGroup'

export const FLUX_MATRIX_REPRESENTATION = 'os.repr.flux_matrix'
/** Les deux réglages : ce qui fait les lignes et ce qui fait les colonnes (`nodes`, ou l'id d'un groupe). */
export const FLUX_MATRIX_ROWS_KEY = 'flux_matrix_rows'
export const FLUX_MATRIX_COLUMNS_KEY = 'flux_matrix_columns'
const AXIS_NODES = 'nodes'

/** Le tri et le zoom de chaque tableau : un état d'affichage, par vignette. */
const flux_sorts = new Map<string, Type_MatrixSort>()
const flux_zooms = new Map<string, number>()

const zoomHandleOf = (ctx: Type_RepresentationContext) =>
  figureZoomHandle(ctx.window_id, ctx.app_data.menu_configuration?.main_zone_active_pane_key)

const FLUX_MATRIX_ZOOM: Type_RepresentationZoom = {
  getScale: (ctx) => zoomHandleOf(ctx)?.getScale() ?? 1,
  setScale: (k, ctx) => zoomHandleOf(ctx)?.setScale(k),
  scaleBy: (factor, ctx) => zoomHandleOf(ctx)?.scaleBy(factor),
  step: 1.25,
  min: MATRIX_ZOOM_MIN,
  max: MATRIX_ZOOM_MAX,
  neutral: 1,
  isAvailable: (ctx) => zoomHandleOf(ctx) !== null,
  fit: (ctx) => zoomHandleOf(ctx)?.fit?.()
}

const nodeTagGroupsOf = (app_data: Class_ApplicationData): Class_NodeTagGroup[] =>
  app_data.drawing_area.sankey.node_taggs_list as Class_NodeTagGroup[]

/** Les choix d'un axe : les nœuds, puis chaque groupe d'étiquettes de nœuds. */
const axisChoices = (app_data: Class_ApplicationData) => [
  { value: AXIS_NODES, label: app_data.t('matrix.flux_nodes') as string },
  ...nodeTagGroupsOf(app_data).map(g => ({ value: g.id, label: g.name }))
]

const axisAttribute = (labels: Parameters<typeof figureAttribute>[2]) =>
  figureAttribute<string>(AXIS_NODES, 'identity', labels, undefined, {
    kind: 'select',
    choicesOf: (ctx) => axisChoices(ctx.app_data as unknown as Class_ApplicationData)
  })

/** Un axe résolu : la fonction qui classe un nœud, et le nom de l'axe. */
const axisOf = (app_data: Class_ApplicationData, wanted: unknown, fallback_label: string) => {
  const group = nodeTagGroupsOf(app_data).find(g => g.id === wanted) ?? null
  if (group === null) {
    return { label: fallback_label, memberOf: (n: Class_NodeElement) => ({ id: n.id, label: displayedNameOf(n) }) }
  }
  const untagged = { id: `${group.id}:__untagged__`, label: app_data.t('matrix.flux_untagged') as string }
  return {
    label: group.name,
    memberOf: (n: Class_NodeElement) => {
      const tag = n.tags_dict[group.id]
      return tag ? { id: `${group.id}:${tag.id}`, label: tag.name } : untagged
    }
  }
}

export const registerFluxMatrix = (): void => {
  representation_registry.register({
    id: FLUX_MATRIX_REPRESENTATION,
    scale: 'diagram',
    order: 36,
    label: (a) => a.t('matrix.flux_label'),
    description: (a) => a.t('matrix.flux_description'),
    icon: <FaTable />,
    zoom: FLUX_MATRIX_ZOOM,
    // Sans flux, rien à croiser.
    isAvailable: (ctx) => ctx.app_data.drawing_area.sankey.links_list.length > 0,
    attributes: {
      [FLUX_MATRIX_ROWS_KEY]: axisAttribute({
        en: 'Rows', fr: 'Lignes', es: 'Filas', de: 'Zeilen', it: 'Righe', 'zh-CN': '行', ja: '行'
      }),
      [FLUX_MATRIX_COLUMNS_KEY]: axisAttribute({
        en: 'Columns', fr: 'Colonnes', es: 'Columnas', de: 'Spalten', it: 'Colonne', 'zh-CN': '列', ja: '列'
      })
    },
    draw: (container, ctx) => {
      const app_data = ctx.app_data
      const t = app_data.t
      const key = `${ctx.window_id ?? ''}|${ctx.pane_key ?? ''}`
      let teardown: () => void = () => { container.innerHTML = '' }

      const render = () => {
        teardown()
        const sankey = app_data.drawing_area.sankey
        const rows_axis = axisOf(app_data, ctx.options?.[FLUX_MATRIX_ROWS_KEY], t('matrix.flux_sources') as string)
        const cols_axis = axisOf(app_data, ctx.options?.[FLUX_MATRIX_COLUMNS_KEY], t('matrix.flux_targets') as string)
        // La coordonnée de données courante : ce que `valueCurrent` lit (sélection des dataTags).
        const cells: Type_FluxCell[] = sankey.visible_links_list.map(link => ({
          row: rows_axis.memberOf(link.source as Class_NodeElement),
          col: cols_axis.memberOf(link.target as Class_NodeElement),
          value: link.valueCurrent ?? null
        }))
        const matrix = buildFluxMatrix(cells, {
          row_label: rows_axis.label, column_label: cols_axis.label,
          total_label: t('matrix.total') as string, sort: flux_sorts.get(key)
        })
        const unit = figureUnitOf(sankey)
        const lang = app_data.language || 'fr'
        const total_row = matrix.rows[matrix.rows.length - 1]
        const grand = total_row.cells[total_row.cells.length - 1] ?? 0
        const decimals = matrixDecimals(grand)
        const numbers = matrixNumberFormatter(decimals, lang)
        const percent = new Intl.NumberFormat(lang, { style: 'percent', maximumFractionDigits: 1 })
        const title = `${rows_axis.label} → ${cols_axis.label}`
        teardown = drawDimensionMatrixTable(container, cells.length > 0 ? matrix : null, {
          zoom: {
            scale: flux_zooms.get(key) ?? 1,
            on_scale: (k: number) => {
              flux_zooms.set(key, k)
              app_data.menu_configuration.notify(ZOOM_TOPIC)
            },
            publish: (handle) => publishFigureZoom(ctx.window_id, ctx.pane_key, handle)
          },
          format: (v) => numbers(v),
          format_share: (v) => percent.format(v),
          title,
          unit,
          labels: {
            expand: t('matrix.expand'), collapse: t('matrix.collapse'),
            export_xlsx: t('matrix.export_xlsx'), export_csv: t('matrix.export_csv'), empty: t('matrix.empty')
          },
          // Pas d'arbre ici : rien à ouvrir.
          on_toggle: () => undefined,
          sort_label: t('matrix.sort_by'),
          on_sort: (sort_key) => {
            flux_sorts.set(key, nextMatrixSort(matrix.sort, sort_key))
            render()
          },
          on_export: (format) => {
            const table = dimensionMatrixExportTable(matrix, { title, unit, unit_label: t('matrix.unit'), decimals })
            void downloadTable(table, format, { decimal: csvDecimalOf(lang) })
          }
        })
      }
      render()
      return { redraw: render, cleanup: () => teardown() }
    }
  })
}
