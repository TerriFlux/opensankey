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

// SA#551 — PRÉSENTATION D'UN GROUPE D'ÉTIQUETTES depuis la légende.
//
// Cliquer le nom d'un groupe dans la légende ouvre la même pop-up que n'importe quel élément du
// diagramme (arbitrage d'Alexandre, 2026-09-18 — le clic n'ouvre plus le groupe). Elle montre la
// définition du groupe et ses étiquettes, et sa colonne de droite porte, à la place des analyses
// d'un élément, une VUE : le diagramme mis en forme par les seules étiquettes de ce groupe.
//
// La vue est une COPIE du dessin courant, prise pendant que la cascade est mise en aperçu
// (`Class_Sankey.setTagStylePreview`) puis rendue telle quelle : le diagramme lui-même n'est pas
// modifié — deux dessins successifs dans la même tâche, donc rien ne clignote.

import React from 'react'
import { Box, Text } from '@chakra-ui/react'

import type { Class_ApplicationData } from '../../../types/ApplicationData'
import type { Class_TagGroup } from '../../../types/TagGroup'
import type { Class_DrawingArea } from '../../../types/DrawingArea'
import { LEGEND_CHILD_PREFIX } from '../../../Elements/legendIds'
import { redrawForTagStylePreview } from '../../../Elements/LegendGenerator'
import { default_font_size } from '../../../css/Theme'
import type { Type_Presentable } from './openPresentation'

/** Id des zones de titre de groupe ('legend-group-<groupe>'), lignes épinglées comprises. */
export const LEGEND_GROUP_PREFIX = LEGEND_CHILD_PREFIX + 'group-'

/** La zone est-elle le titre d'un groupe d'étiquettes dans la légende ? */
export const isLegendGroupZoneId = (id: string): boolean => id.startsWith(LEGEND_GROUP_PREFIX)

/**
 * Groupe de nœuds ou de flux que désigne une zone de titre, ou `undefined`. Le relevé est tenu par
 * le générateur de légende (les ids de zone sont des slugs : ils ne se relisent pas).
 */
export const findLegendTagGroup = (
  app_data: Class_ApplicationData,
  zone_id: string
): Class_TagGroup | undefined => {
  const sankey = app_data.drawing_area.sankey
  const group_id = app_data.drawing_area.legend.tagGroupIdOfTitle(zone_id)
  if (group_id === undefined) return undefined
  return [...sankey.node_taggs_list, ...sankey.flux_taggs_list]
    .find(group => group.id === group_id) as unknown as Class_TagGroup | undefined
}

/** Le groupe d'une zone, si cette zone est un titre de groupe de nœuds ou de flux. */
export const legendTagGroupOf = (
  app_data: Class_ApplicationData,
  element: Type_Presentable
): Class_TagGroup | undefined =>
  isLegendGroupZoneId(element.id) ? findLegendTagGroup(app_data, element.id) : undefined

// CONTENU DE LA POP-UP ==============================================================

/** Définition (groupe ou étiquette) telle que la pop-up l'affiche : rien quand elle est blanche. */
const definitionOf = (owner: { description?: string }): string | undefined => {
  const description = owner.description
  return typeof description === 'string' && description.trim() !== '' ? description : undefined
}

/**
 * Définition du groupe puis ses étiquettes, chacune avec sa pastille (couleur de son style, sinon sa
 * couleur historique) et sa propre définition. C'est ce qu'un lecteur attend d'un groupe : ce qu'il
 * veut dire, et ce qu'il contient.
 */
export const LegendTagGroupBlock = ({ app_data, group }: {
  app_data: Class_ApplicationData
  group: Class_TagGroup
}) => {
  const { t } = app_data
  const styles = app_data.drawing_area.sankey.styles_dict
  const description = definitionOf(group as unknown as { description?: string })
  const tags = group.tags_list as unknown as {
    id: string, display_name: string, color: string, style_id?: string, description?: string
  }[]
  const swatchOf = (tag: { color: string, style_id?: string }): string => {
    const style = tag.style_id ? styles[tag.style_id] : undefined
    const color = style?.getElementProperty('shape_color')
    return typeof color === 'string' ? color : tag.color
  }
  return (
    <Box style={{ fontSize: default_font_size, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {description && <Text style={{ opacity: 0.9 }}>{description}</Text>}
      <Text style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.65 }}>
        {t('MEP.legend_group_tags')}
      </Text>
      {tags.map(tag => (
        <Box key={tag.id} style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
          <Box
            as='span'
            style={{
              flex: 'none', width: '0.6rem', height: '0.6rem', borderRadius: '2px',
              backgroundColor: swatchOf(tag), border: '1px solid #cbd5e0'
            }}
          />
          <Text as='span'>
            {tag.display_name}
            {definitionOf(tag) && <Text as='span' style={{ opacity: 0.7 }}>{' — ' + definitionOf(tag)}</Text>}
          </Text>
        </Box>
      ))}
    </Box>
  )
}

// VUE DU GROUPE (colonne de droite) =================================================

/** Marge autour du contenu dans la copie, en px écran. */
const VIEW_PADDING = 5

/**
 * Renomme les identifiants de la copie : un clone du SVG vivant porterait les MÊMES ids, et une
 * référence interne (`url(#hatch-xxx)`, `clip-path`) se résoudrait alors sur l'élément du diagramme
 * vivant — c'est-à-dire sur le motif REMIS dans son état normal après l'aperçu.
 */
const renameIds = (svg: string, suffix: string): string => svg
  .replaceAll(/\bid="([^"]+)"/g, (_m, id: string) => `id="${id}${suffix}"`)
  .replaceAll(/url\(#([^)]+)\)/g, (_m, id: string) => `url(#${id}${suffix})`)
  .replaceAll(/\bhref="#([^"]+)"/g, (_m, id: string) => `href="#${id}${suffix}"`)

/** Copie du dessin courant, recadrée sur le contenu (même recette que les vignettes de vue). */
const currentDrawingAsSvg = (drawing_area: Class_DrawingArea, suffix: string): string | null => {
  const svg_sel = drawing_area.d3_selection_zoom_area
  const node = svg_sel?.node()
  const bounds = drawing_area.contentBounds()
  if (!node || !bounds || bounds.width <= 0 || bounds.height <= 0) return null
  const scale = drawing_area.is_paper_mode ? 1 : drawing_area.getZoomScale()
  const ox = drawing_area.is_paper_mode ? 0 : bounds.x
  const oy = drawing_area.is_paper_mode ? 0 : bounds.y
  const w = (drawing_area.is_paper_mode ? bounds.x + bounds.width : bounds.width) * scale + 2 * VIEW_PADDING
  const h = (drawing_area.is_paper_mode ? bounds.y + bounds.height : bounds.height) * scale + 2 * VIEW_PADDING
  const clone = node.cloneNode(true) as SVGSVGElement
  clone.querySelector('#g_drawing')
    ?.setAttribute('transform', `translate(${-ox * scale + VIEW_PADDING},${-oy * scale + VIEW_PADDING}) scale(${scale})`)
  clone.querySelectorAll('input').forEach(input => input.remove())
  clone.querySelector('#viewport_border')?.remove()
  clone.querySelector('#g_clip')?.removeAttribute('clip-path')
  const inner = renameIds(clone.innerHTML, suffix)
  return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"' +
    ` viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">` +
    inner + '</svg>'
}

/**
 * Dessine dans `container` le diagramme mis en forme par les seules étiquettes du groupe. L'aperçu
 * est posé sur la cascade, les éléments redessinés, la copie prise, puis TOUT est rétabli : le
 * diagramme vivant retrouve son état avant la fin de la tâche, donc sans clignoter.
 */
export const renderLegendTagGroupView = (
  app_data: Class_ApplicationData,
  group: Class_TagGroup,
  container: HTMLElement
): (() => void) => {
  const drawing_area = app_data.drawing_area
  const sankey = drawing_area.sankey
  const applied = sankey.setTagStylePreview(group.id)
  let svg: string | null = null
  try {
    if (applied) redrawForTagStylePreview(drawing_area, group.id)
    svg = currentDrawingAsSvg(drawing_area, '-groupview')
  } finally {
    if (applied) {
      sankey.setTagStylePreview(undefined)
      redrawForTagStylePreview(drawing_area, group.id)
    }
  }
  container.innerHTML = svg ?? ''
  return () => { container.innerHTML = '' }
}
