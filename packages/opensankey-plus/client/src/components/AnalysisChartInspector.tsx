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

// Section « Analyse » de l'inspecteur (OS#1278). Deux sélecteurs — DÉCOMPOSER PAR
// (axe additif) et COMPARER SELON (axe non-additif) — pilotent un graphique
// couronne / histogramme / histogramme empilé rendu par le moteur D3 pur
// (NodeStatsCharts), alimenté par la couche d'extraction (AnalysisChartData).
//
// Le descripteur est un ATTRIBUT DE STYLE (analysis_descriptor) : lu par la cascade,
// écrit sur la sélection (portée Sélection) ou sur le style édité (portée Styles),
// avec undo. Une case « Afficher dans l'info-bulle » publie le graphique dans le
// tooltip de l'élément (surface lecteur).

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Select, Button, ButtonGroup, Checkbox, Text } from '@chakra-ui/react'
import { isDescriptorEmpty } from '@terriflux/opensankey/src/Charts/AnalysisDescriptor'
import type { Class_ApplicationData } from '@terriflux/opensankey/src/types/ApplicationData'
import {
  Type_AnalysisDescriptor,
  Type_ChartSubject,
  Type_DecomposeSpec
} from './AnalysisChartData'
import { drawAnalysisChart } from './AnalysisChartRender'

// Portée d'édition (miroir de Type_InspectorScope, non importé pour rester découplé).
type Scope = 'selection' | 'style'

// Cible d'écriture du descripteur : élément ou style, tous deux porteurs de
// `attributes` (le storage d'attributs de config).
type DescTarget = { attributes: Record<string, unknown> }
const ATTR = 'analysis_descriptor'
const readDesc = (t: DescTarget): Type_AnalysisDescriptor | undefined =>
  t.attributes[ATTR] as Type_AnalysisDescriptor | undefined

// Un choix de décomposition présenté dans le select (option ↔ spec).
type DecomposeOption = { key: string, label: string, spec: Type_DecomposeSpec | null }

// Options de décomposition selon le sujet (nœud : flux E/S, regroupables par
// fluxTag, + nœuds enfants par dimension ; flux : flux enfants par dimension).
const buildDecomposeOptions = (subject: Type_ChartSubject): DecomposeOption[] => {
  const opts: DecomposeOption[] = [{ key: 'none', label: '— aucune —', spec: null }]
  if (subject.kind === 'node') {
    const node = subject.node
    opts.push({ key: 'inputs', label: 'Flux entrants', spec: { kind: 'inputs' } })
    opts.push({ key: 'outputs', label: 'Flux sortants', spec: { kind: 'outputs' } })
    node.sankey.flux_taggs_list.forEach(g => {
      opts.push({ key: `in_by_${g.id}`, label: `Flux entrants par ${g.name}`, spec: { kind: 'inputs', group_by_flux_tagg_id: g.id } })
      opts.push({ key: `out_by_${g.id}`, label: `Flux sortants par ${g.name}`, spec: { kind: 'outputs', group_by_flux_tagg_id: g.id } })
    })
    node.dimensions_as_parent.forEach(dim => {
      opts.push({ key: `children_${dim.id}`, label: `Nœuds enfants (${dim.name})`, spec: { kind: 'node_children', dimension_id: dim.id } })
    })
  } else {
    const link = subject.link
    const dims = new Map<string, string>()
    link.source.dimensions_as_parent.forEach(d => dims.set(d.id, d.name))
    link.target.dimensions_as_parent.forEach(d => dims.set(d.id, d.name))
    dims.forEach((name, id) => {
      opts.push({ key: `flux_children_${id}`, label: `Flux enfants (${name})`, spec: { kind: 'flux_children', dimension_id: id } })
    })
  }
  return opts
}

// Clé d'option canonique d'un spec (réciproque de buildDecomposeOptions) : sert à
// re-sélectionner l'option correspondant au descripteur persisté.
const specToKey = (spec: Type_DecomposeSpec | null): string => {
  if (!spec) return 'none'
  // switch (pas des `if` successifs) : le membre inputs/outputs a un discriminant
  // en union (`kind: 'inputs'|'outputs'`) que des `if ===` n'éliminent pas du type.
  switch (spec.kind) {
  case 'inputs': return spec.group_by_flux_tagg_id ? `in_by_${spec.group_by_flux_tagg_id}` : 'inputs'
  case 'outputs': return spec.group_by_flux_tagg_id ? `out_by_${spec.group_by_flux_tagg_id}` : 'outputs'
  case 'node_children': return `children_${spec.dimension_id}`
  case 'flux_children': return `flux_children_${spec.dimension_id}`
  }
}

// Défaut non surprenant : couronne des flux (sortants si présents, sinon
// entrants) pour un nœud ; première décomposition disponible pour un flux.
const defaultDecomposeKey = (subject: Type_ChartSubject, options: DecomposeOption[]): string => {
  if (subject.kind === 'node') {
    if (subject.node.output_links_list.some(l => l.is_visible)) return 'outputs'
    if (subject.node.input_links_list.some(l => l.is_visible)) return 'inputs'
    return 'none'
  }
  return options.find(o => o.key.startsWith('flux_children_'))?.key ?? 'none'
}

const currentSubject = (app_data: Class_ApplicationData): Type_ChartSubject | null => {
  const da = app_data.drawing_area
  const node = da.selected_nodes_list[0]
  if (node) return { kind: 'node', node }
  const link = da.selected_links_list[0]
  if (link) return { kind: 'flux', link }
  return null
}

export const AnalysisChartInspector = ({ app_data, scope }: { app_data: Class_ApplicationData, scope: Scope }) => {
  const subject = currentSubject(app_data)
  const container_ref = useRef<HTMLDivElement>(null)
  const [, forceTick] = useState(0)
  const refresh = () => forceTick(t => t + 1)

  const da = app_data.drawing_area
  const mc = app_data.menu_configuration

  // Cibles d'écriture selon la portée : le style édité, ou toute la sélection.
  const write_targets: DescTarget[] = scope === 'style'
    ? ([da.sankey.styles_dict[mc.ref_selected_style.current]].filter(Boolean) as unknown as DescTarget[])
    : ([...da.selected_nodes_list, ...da.selected_links_list] as unknown as DescTarget[])
  // Cible de lecture : la 1re cible d'écriture (valeur résolue via cascade pour un
  // élément ; valeur propre pour un style).
  const read_target = write_targets[0]

  const sig = subject
    ? `${scope}:${subject.kind}:${subject.kind === 'node' ? subject.node.id : subject.link.id}`
    : 'none'

  const decompose_options = useMemo(
    () => (subject ? buildDecomposeOptions(subject) : []),
    [sig] // eslint-disable-line -- rebâti au changement de sujet, pas d'autre dép.
  )
  const data_taggs = subject
    ? (subject.kind === 'node' ? subject.node.sankey : subject.link.sankey).data_taggs_list
    : []

  // Descripteur PERSISTÉ (lu sur la cible). Absent → on montre un défaut sans écrire.
  const persisted = read_target ? readDesc(read_target) : undefined
  const default_decompose_spec = subject
    ? (decompose_options.find(o => o.key === defaultDecomposeKey(subject, decompose_options))?.spec ?? null)
    : null
  const effective: Type_AnalysisDescriptor = persisted ?? {
    decompose: default_decompose_spec,
    compare: null
  }

  const decompose_key = specToKey(effective.decompose)
  const compare_id = effective.compare?.data_tagg_id ?? 'none'
  const repr_value: 'auto' | 'donut' | 'bars' = effective.repr ?? 'auto'
  const show_in_tooltip = effective.surfaces?.tooltip ?? false
  const show_on_node = effective.surfaces?.on_node ?? false

  // Écrit le descripteur sur les cibles (undo groupé), ou l'efface s'il est vide.
  const applyDescriptor = (next: Type_AnalysisDescriptor) => {
    if (write_targets.length === 0) return
    const value = isDescriptorEmpty(next) ? undefined : next
    const before = write_targets.map(t => ({ t, v: t.attributes[ATTR] }))
    const apply = () => {
      write_targets.forEach(t => { t.attributes[ATTR] = value })
      commit()
    }
    const undo = () => {
      before.forEach(({ t, v }) => { t.attributes[ATTR] = v })
      commit()
    }
    const commit = () => {
      mc.ref_to_save_in_cache_indicator.current(false)
      mc.updateComponentRelatedToApparence()
      // On écrit l'attribut directement (attributes[…] =), ce qui court-circuite le
      // redraw auto du setter : on redessine la zone pour refléter le camembert
      // sur le nœud (surface on_node) à l'écran.
      da.draw()
      refresh()
    }
    app_data.history.saveUndo(undo)
    app_data.history.saveRedo(apply)
    apply()
  }

  // Constructeurs de descripteur à partir de l'état effectif (les champs non
  // touchés sont préservés).
  const setDecompose = (key: string) => {
    const spec = decompose_options.find(o => o.key === key)?.spec ?? null
    applyDescriptor({ ...effective, decompose: spec })
  }
  const setCompare = (id: string) => {
    applyDescriptor({ ...effective, compare: id !== 'none' ? { data_tagg_id: id } : null })
  }
  const setRepr = (r: 'auto' | 'donut' | 'bars') => {
    applyDescriptor({ ...effective, repr: r === 'auto' ? undefined : r })
  }
  const setTooltip = (on: boolean) => {
    const surfaces = { ...effective.surfaces, tooltip: on }
    applyDescriptor({ ...effective, surfaces })
  }
  const setOnNode = (on: boolean) => {
    const surfaces = { ...effective.surfaces, on_node: on }
    applyDescriptor({ ...effective, surfaces })
  }

  // Dessin de l'aperçu : reconstruit les données et redessine à chaque changement
  // de réglage, de sujet, de portée ou de taille du conteneur.
  useEffect(() => {
    const el = container_ref.current
    if (!el || !subject) return
    const draw = () => drawAnalysisChart(el, subject, effective, { others_label: 'Autres', empty_label: 'Rien à afficher' })
    draw()
    let raf = 0
    const ro = new ResizeObserver(() => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(draw)
    })
    ro.observe(el)
    return () => { ro.disconnect(); if (raf) cancelAnimationFrame(raf) }
    // JSON.stringify : l'aperçu suit le CONTENU du descripteur effectif, pas son identité.
  }, [sig, JSON.stringify(effective), subject]) // eslint-disable-line

  if (!subject) {
    return <Box layerStyle="empty_config_text"><span>Sélectionner un nœud ou un flux.</span></Box>
  }

  const is_cross = !!(effective.decompose && effective.compare)

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.2rem' }}>
      <Box>
        <Text style={{ fontSize: '0.7rem', opacity: 0.7 }}>Décomposer par</Text>
        <Select size="xs" value={decompose_key} onChange={e => setDecompose(e.target.value)}>
          {decompose_options.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
        </Select>
      </Box>

      <Box>
        <Text style={{ fontSize: '0.7rem', opacity: 0.7 }}>Comparer selon</Text>
        <Select size="xs" value={compare_id} onChange={e => setCompare(e.target.value)}>
          <option value="none">— aucune —</option>
          {data_taggs.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </Select>
      </Box>

      {/* Override de représentation : masqué pour le croisement (toujours empilé). */}
      {!is_cross && (
        <ButtonGroup size="xs" isAttached>
          {(['auto', 'donut', 'bars'] as const).map(r => (
            <Button
              key={r}
              variant={repr_value === r ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => setRepr(r)}
            >
              {r === 'auto' ? 'Auto' : r === 'donut' ? 'Couronne' : 'Barres'}
            </Button>
          ))}
        </ButtonGroup>
      )}

      <Checkbox
        size="sm"
        isChecked={show_in_tooltip}
        isDisabled={isDescriptorEmpty(effective)}
        onChange={e => setTooltip(e.target.checked)}
      >
        <Text as="span" style={{ fontSize: '0.75rem' }}>Afficher dans l'info-bulle</Text>
      </Checkbox>

      {/* « Afficher sur le nœud » : le nœud est dessiné en couronne ou histogramme
          selon le choix ci-dessus (couleurs du modèle). Réservé au sujet nœud. */}
      {subject.kind === 'node' && (
        <Checkbox
          size="sm"
          isChecked={show_on_node}
          isDisabled={isDescriptorEmpty(effective)}
          onChange={e => setOnNode(e.target.checked)}
        >
          <Text as="span" style={{ fontSize: '0.75rem' }}>Afficher sur le nœud (couronne / histogramme)</Text>
        </Checkbox>
      )}

      <Box ref={container_ref} style={{ width: '100%', height: '260px', minHeight: '180px' }} />
    </Box>
  )
}
