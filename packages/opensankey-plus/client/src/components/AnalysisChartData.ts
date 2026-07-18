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

// Couche d'EXTRACTION des graphiques d'analyse (OS#1278). Transforme un élément du
// diagramme (nœud ou flux) en données série × parts, prêtes pour les moteurs de
// rendu (couronne / histogramme / histogramme empilé, cf. OS Charts/NodeStatsCharts).
//
// Grammaire : SUJET (nœud | flux) × DÉCOMPOSER PAR (axe additif : flux E/S, dimension,
// fluxTag) × COMPARER SELON (axe non-additif : dataTags). Chaque axe est optionnel,
// au moins un requis.
//   - décomposer seul        → une série, plusieurs parts   → couronne
//   - comparer seul          → une part par série           → histogramme
//   - décomposer ET comparer → parts × séries               → histogramme empilé
//
// Module PUR : aucune dépendance React ni D3. Il lit le modèle (valeurs, tags) et
// renvoie des nombres déjà agrégés ; le dessin est fait ailleurs.

import { Class_NodeElement } from '@terriflux/opensankey/src/Elements/Node'
import { Class_LinkElement } from '@terriflux/opensankey/src/Elements/Link'
import { Class_DataTagGroup, Class_FluxTagGroup } from '@terriflux/opensankey/src/types/TagGroup'
import { Type_StatSlice } from '@terriflux/opensankey/src/Charts/NodeStatsCharts'
import {
  Type_DecomposeSpec,
  Type_CompareSpec,
  Type_AnalysisDescriptor,
  deduceRepr
} from '@terriflux/opensankey/src/Charts/AnalysisDescriptor'

// Le descripteur et sa déduction de représentation vivent en OS (attribut de
// style) ; on les re-exporte ici pour ne pas éclater les imports des consommateurs
// OS+ (inspecteur, tooltip).
export type { Type_DecomposeSpec, Type_CompareSpec, Type_AnalysisDescriptor }
export { deduceRepr }

// Une part est une portion additive d'un tout (secteur de couronne / segment
// d'empilement). Identique à Type_StatSlice (id, label, value, color?) : les deux
// moteurs de rendu partagent la même brique.
export type Type_ChartPart = Type_StatSlice

// Une série regroupe des parts comparables entre elles (ex. une année, un scénario).
// Sans axe de comparaison, il y a une série unique de label vide.
export interface Type_ChartSerie {
  id: string
  label: string
  parts: Type_ChartPart[]
}

export interface Type_AnalysisChartData {
  series: Type_ChartSerie[]
  has_decompose: boolean
  has_compare: boolean
}

// ── Descripteur sérialisable ──────────────────────────────────────────────────
// Défini en OS (attribut de style, cf. AnalysisDescriptor.ts) et re-exporté
// ci-dessus. Pilote les quatre surfaces (inspecteur, tooltip, camembert sur nœud,
// zone canevas).

export interface Type_ExtractOptions {
  // Couleurs du diagramme imposées aux parts (surface « sur le nœud » : le graphique
  // fait partie du langage visuel du diagramme). Défaut : false → palette
  // catégorielle propre au moteur de rendu (lisibilité des surfaces détachées).
  // Le regroupement par fluxTag utilise TOUJOURS les couleurs des tags.
  use_diagram_colors?: boolean
}

// Sujet du graphique : un nœud ou un flux.
export type Type_ChartSubject =
  | { kind: 'node', node: Class_NodeElement }
  | { kind: 'flux', link: Class_LinkElement }

// ── Décomposition d'un nœud/flux au tag data COURANT ──────────────────────────
// Ces fonctions lisent le modèle tel qu'il est sélectionné à l'instant. Le
// balayage des tags (comparaison) est géré par buildAnalysisChartData, qui fixe la
// sélection avant d'appeler ces décompositions.

// Un lien porte-t-il le fluxTag d'id donné ? (appartenance, pas de sous-valeur par
// tag : un lien a une valeur unique et le jeu de fluxTags auquel il appartient.)
const linkCarriesTag = (link: Class_LinkElement, tag_id: string): boolean =>
  link.flux_tags_list.some(ft => ft.id === tag_id)

const decomposeNodeFlows = (
  node: Class_NodeElement,
  side: 'inputs' | 'outputs',
  group_by: Class_FluxTagGroup | undefined,
  opts: Type_ExtractOptions
): Type_ChartPart[] => {
  const links = (side === 'inputs' ? node.input_links_list : node.output_links_list)
    .filter(l => l.is_visible) as Class_LinkElement[]

  // Regroupement par fluxTag : une part par tag du groupe, couleurs des tags.
  // Un lien appartient à au plus un tag par groupe (produit OU secteur), donc pas
  // de double comptage entre parts.
  if (group_by) {
    return group_by.tags_list
      .map(tag => ({
        id: tag.id,
        label: tag.name,
        value: links
          .filter(l => linkCarriesTag(l, tag.id))
          .reduce((sum, l) => sum + (l.valueCurrent ?? 0), 0),
        color: tag.color
      }))
      .filter(p => p.value > 0)
  }

  // Défaut : une part par flux, libellée par le nœud d'en face.
  return links
    .map(l => {
      const other = side === 'inputs' ? l.source : l.target
      return {
        id: l.id,
        label: other.name,
        value: l.valueCurrent ?? 0,
        color: opts.use_diagram_colors ? l.getShapeColorToUse() : undefined
      }
    })
    .filter(p => p.value > 0)
}

const decomposeNodeChildren = (
  node: Class_NodeElement,
  dimension_id: string,
  opts: Type_ExtractOptions
): Type_ChartPart[] => {
  const dim = node.dimensions_as_parent.find(d => d.id === dimension_id)
  if (!dim) return []
  return (dim.children as Class_NodeElement[])
    .map(child => ({
      id: child.id,
      label: child.name,
      value: child.data_value,
      color: opts.use_diagram_colors ? child.getShapeColorToUse() : undefined
    }))
    .filter(p => p.value > 0)
}

const decomposeFluxChildren = (
  link: Class_LinkElement,
  dimension_id: string,
  opts: Type_ExtractOptions
): Type_ChartPart[] => {
  // Flux enfants : les liens de grain plus fin qui composent le flux agrégé le long
  // de la dimension. On NE filtre PAS sur is_visible : quand l'agrégat est affiché,
  // ses liens enfants sont justement masqués — c'est leur présence STRUCTURELLE qui
  // nous intéresse. On balaie le sous-arbre {parent ∪ enfants} des deux côtés pour
  // couvrir la désagrégation d'un seul côté (A→B1/A→B2), de l'autre (A1→B/A2→B) ou
  // des deux (A1→B1…) ; le lien agrégat lui-même et les liens d'expansion sont exclus.
  const src_dim = link.source.dimensions_as_parent.find(d => d.id === dimension_id)
  const tgt_dim = link.target.dimensions_as_parent.find(d => d.id === dimension_id)
  if (!src_dim && !tgt_dim) return []

  const src_subtree = (src_dim
    ? [link.source, ...src_dim.children] : [link.source]) as Class_NodeElement[]
  const tgt_subtree = (tgt_dim
    ? [link.target, ...tgt_dim.children] : [link.target]) as Class_NodeElement[]
  const tgt_set = new Set<Class_NodeElement>(tgt_subtree)

  const parts: Type_ChartPart[] = []
  const seen = new Set<Class_LinkElement>()
  src_subtree.forEach(cs => {
    (cs.output_links_list as Class_LinkElement[]).forEach(l => {
      if (l === link || l.is_expansion_link || seen.has(l)) return
      if (!tgt_set.has(l.target)) return
      seen.add(l)
      parts.push({
        id: l.id,
        label: `${l.source.name} → ${l.target.name}`,
        value: l.valueCurrent ?? 0,
        color: opts.use_diagram_colors ? l.getShapeColorToUse() : undefined
      })
    })
  })
  return parts.filter(p => p.value > 0)
}

// Décompose le sujet au tag courant selon le spec. Renvoie [] si le spec ne
// s'applique pas au sujet (ex. inputs sur un flux).
const decomposeSubject = (
  subject: Type_ChartSubject,
  spec: Type_DecomposeSpec,
  opts: Type_ExtractOptions
): Type_ChartPart[] => {
  if (subject.kind === 'node') {
    const node = subject.node
    if (spec.kind === 'inputs' || spec.kind === 'outputs') {
      const group_by = spec.group_by_flux_tagg_id
        ? (node.sankey.flux_taggs_dict[spec.group_by_flux_tagg_id] as Class_FluxTagGroup | undefined)
        : undefined
      return decomposeNodeFlows(node, spec.kind, group_by, opts)
    }
    if (spec.kind === 'node_children') {
      return decomposeNodeChildren(node, spec.dimension_id, opts)
    }
    return []
  }
  // Sujet flux : seule la décomposition en flux enfants a un sens.
  if (spec.kind === 'flux_children') {
    return decomposeFluxChildren(subject.link, spec.dimension_id, opts)
  }
  return []
}

// Valeur scalaire du sujet au tag courant (utilisée quand il n'y a pas d'axe de
// décomposition : comparaison pure).
const subjectValue = (subject: Type_ChartSubject): number =>
  subject.kind === 'node' ? subject.node.data_value : (subject.link.valueCurrent ?? 0)

const subjectLabel = (subject: Type_ChartSubject): string =>
  subject.kind === 'node'
    ? subject.node.name
    : `${subject.link.source.name} → ${subject.link.target.name}`

// ── Point d'entrée ────────────────────────────────────────────────────────────

/**
 * Construit les données série × parts d'un graphique d'analyse.
 *
 * L'axe de comparaison balaie les tags d'un groupe de data tags : pour chaque tag,
 * on FIXE la sélection (unique) puis on lit la décomposition complète — |tags|
 * passes, pas de boucle imbriquée naïve. Même patron transitoire que l'échelle
 * unitaire : la sélection initiale du groupe est restaurée en fin de balayage.
 */
export const buildAnalysisChartData = (
  subject: Type_ChartSubject,
  descriptor: Type_AnalysisDescriptor,
  opts: Type_ExtractOptions = {}
): Type_AnalysisChartData => {
  const sankey = subject.kind === 'node' ? subject.node.sankey : subject.link.sankey
  const has_decompose = descriptor.decompose != null
  const has_compare = descriptor.compare != null

  // Parts au tag courant : soit la décomposition, soit une part unique = valeur
  // du sujet (comparaison pure).
  const partsAtCurrentTag = (): Type_ChartPart[] => {
    if (descriptor.decompose) {
      return decomposeSubject(subject, descriptor.decompose, opts)
    }
    const v = subjectValue(subject)
    return v > 0 ? [{ id: subject.kind === 'node' ? subject.node.id : subject.link.id, label: subjectLabel(subject), value: v }] : []
  }

  // Sans axe de comparaison : une série unique.
  if (!descriptor.compare) {
    return { series: [{ id: '', label: '', parts: partsAtCurrentTag() }], has_decompose, has_compare }
  }

  const tagg = sankey.data_taggs_dict[descriptor.compare.data_tagg_id] as Class_DataTagGroup | undefined
  if (!tagg) {
    return { series: [{ id: '', label: '', parts: partsAtCurrentTag() }], has_decompose, has_compare }
  }

  // Balayage transitoire : on désélectionne tout le groupe, on sélectionne chaque
  // tag à tour de rôle, on lit, on restaure la sélection initiale à la fin.
  const initially_selected = tagg.tags_list.filter(t => t.is_selected)
  tagg.tags_list.forEach(t => t.setUnSelected())
  const series: Type_ChartSerie[] = tagg.tags_list.map(tag => {
    tag.setSelected()
    const parts = partsAtCurrentTag()
    tag.setUnSelected()
    return { id: tag.id, label: tag.name, parts }
  })
  initially_selected.forEach(t => t.setSelected())

  return { series, has_decompose, has_compare }
}
