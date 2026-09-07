// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// SUNBURST à l'échelle du diagramme (OS#1363) — entrée prête pour le registre des
// représentations (OS#1361, Representations/RepresentationRegistry).
//
// Ce module NE S'ENREGISTRE PAS lui-même : il expose `draw` et `renderOptions` à la
// forme attendue par le registre, à charge pour celui-ci de les déclarer avec
// `scale: 'diagram'` et `needs: { hierarchy: true }`. La garde « pas de hiérarchie »
// est celle du registre ; on ne la redouble pas ici.
//
// Le contexte est typé STRUCTURELLEMENT (juste ce dont le sunburst se sert) plutôt
// qu'importé du registre : les deux chantiers avancent en parallèle, et un contexte
// plus riche reste assignable à un paramètre plus pauvre.

import React from 'react'
import { Box, Select, Text } from '@chakra-ui/react'

import type { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_NodeDimension } from '../Elements/NodeDimension'
import { aggregate, disaggregate } from '../Algorithms/Hierarchies'
import {
  buildSunburstTree,
  sunburstDimensions,
  SUNBURST_DEFAULT_MAX_DEPTH,
  Type_SunburstOptions
} from '../Charts/SunburstHierarchy'
import { drawSunburstChart } from '../Charts/SunburstChart'

// Ce que le sunburst lit du contexte du registre.
export interface Type_SunburstDrawContext {
  app_data: Class_ApplicationData
  options: { [key: string]: unknown }
}

// Options du registre (sac de clés) → options typées du sunburst. Toute clé absente ou
// mal typée retombe sur le défaut : un réglage persisté par une version ultérieure ne
// doit pas casser le rendu, il doit être ignoré.
export const readSunburstOptions = (raw: { [key: string]: unknown }): Type_SunburstOptions => {
  const value_mode = raw.value_mode === 'declared' ? 'declared' : 'sum'
  const max_depth = typeof raw.max_depth === 'number' && raw.max_depth > 0
    ? Math.floor(raw.max_depth)
    : SUNBURST_DEFAULT_MAX_DEPTH
  return {
    dimension_id: typeof raw.dimension_id === 'string' ? raw.dimension_id : undefined,
    root_ids: Array.isArray(raw.root_ids) ? raw.root_ids.filter((v): v is string => typeof v === 'string') : undefined,
    value_mode,
    max_depth
  }
}

// Clic sur un secteur → l'axe NIVEAU bouge, et lui seul. C'est le pont demandé par
// l'issue : le sunburst et le niveau d'agrégation parlent de la même chose, naviguer
// dans l'un doit bouger l'autre. Aucune coordonnée de dessin n'est touchée — c'est
// `disaggregate`/`aggregate` qui repositionnent, comme depuis le menu contextuel.
const toggleAggregation = (
  app_data: Class_ApplicationData,
  dimension_id: string,
  node_id: string
) => {
  const node = app_data.drawing_area.sankey.nodes_dict[node_id] as Class_NodeElement | undefined
  if (!node) return
  const as_parent = node.dimensions_as_parent
    .find((d: Class_NodeDimension) => d.id === dimension_id)
  if (as_parent && as_parent.children.length > 0) {
    if (as_parent.force_show_children) {
      // Déjà déplié : le geste referme, en repassant par le premier enfant — c'est
      // l'enfant qui porte la dimension côté agrégation.
      aggregate(app_data, as_parent.children[0] as Class_NodeElement, node.id)
    } else {
      disaggregate(app_data, node, as_parent.children[0].id)
    }
    return
  }
  // Feuille de la hiérarchie : le seul geste qui reste est de la replier dans son parent.
  const as_child = node.dimensions_as_child
    .find((d: Class_NodeDimension) => d.id === dimension_id)
  if (as_child) aggregate(app_data, node, as_child.parent.id)
}

/**
 * `draw` du registre : dessine le sunburst dans le conteneur et rend le « défaire ».
 *
 * LIMITE CONNUE — le contrat `draw` ne prévoit pas de redessin sur changement de
 * coordonnées : c'est l'hôte qui remonte l'entrée. Le sunburst redessine bien seul sur
 * redimensionnement et sur navigation radiale (son propre DOM), mais un changement de
 * dataTag, de couche de données ou de niveau venu d'ailleurs ne le rafraîchit pas tant
 * que l'hôte ne remonte pas l'entrée.
 */
export const drawSunburstRepresentation = (
  container: HTMLElement,
  ctx: Type_SunburstDrawContext
): (() => void) => {
  const { app_data } = ctx
  const t = app_data.t
  const sankey = app_data.drawing_area.sankey
  const options = readSunburstOptions(ctx.options ?? {})

  const tree = buildSunburstTree(
    sankey,
    options,
    t('sunburst.unallocated') as string
  )
  if (!tree) {
    container.textContent = t('sunburst.empty') as string
    return () => { container.textContent = '' }
  }

  return drawSunburstChart(container, tree, {
    empty_label: t('sunburst.empty') as string,
    others_label: t('sunburst.others') as string,
    scope_label: (count: number) => t('sunburst.scope', { count }) as string,
    roots_sum_hint: t('sunburst.roots_sum_hint') as string,
    mismatch_label: (count: number) => t('sunburst.mismatch', { count }) as string,
    truncated_label: t('sunburst.truncated') as string,
    back_label: t('sunburst.back') as string,
    level_label: (index: number) => t('sunburst.level', { index }) as string,
    on_arc_click: (node_id: string) => toggleAggregation(app_data, tree.dimension_id, node_id)
  })
}

// ── Réglages (`renderOptions` du registre) ────────────────────────────────────────

export interface Type_SunburstOptionsProps {
  app_data: Class_ApplicationData
  options: { [key: string]: unknown }
  setOptions: (options: { [key: string]: unknown }) => void
}

export const SunburstRepresentationOptions = ({
  app_data, options, setOptions
}: Type_SunburstOptionsProps) => {
  const t = app_data.t
  const current = readSunburstOptions(options ?? {})
  const dimensions = sunburstDimensions(app_data.drawing_area.sankey)
  const dimension_id = current.dimension_id ?? dimensions[0]?.id ?? ''

  const patch = (delta: { [key: string]: unknown }) => setOptions({ ...options, ...delta })

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.2rem' }}>
      <Box>
        <Text style={{ fontSize: '0.7rem', opacity: 0.7 }}>{t('sunburst.opt_dimension')}</Text>
        <Select
          size="xs"
          value={dimension_id}
          onChange={e => patch({ dimension_id: e.target.value })}
        >
          {dimensions.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
        </Select>
      </Box>
      <Box>
        <Text style={{ fontSize: '0.7rem', opacity: 0.7 }}>{t('sunburst.opt_value_mode')}</Text>
        <Select
          size="xs"
          value={current.value_mode}
          onChange={e => patch({ value_mode: e.target.value })}
        >
          <option value="sum">{t('sunburst.opt_value_sum')}</option>
          <option value="declared">{t('sunburst.opt_value_declared')}</option>
        </Select>
      </Box>
      <Box>
        <Text style={{ fontSize: '0.7rem', opacity: 0.7 }}>{t('sunburst.opt_max_depth')}</Text>
        <Select
          size="xs"
          value={String(current.max_depth)}
          onChange={e => patch({ max_depth: Number(e.target.value) })}
        >
          {[2, 3, 4, 5, 6, 8].map(n => <option key={n} value={String(n)}>{n}</option>)}
        </Select>
      </Box>
      <Text style={{ fontSize: '0.65rem', opacity: 0.6 }}>
        {t(current.value_mode === 'declared' ? 'sunburst.hint_declared' : 'sunburst.hint_sum')}
      </Text>
    </Box>
  )
}
