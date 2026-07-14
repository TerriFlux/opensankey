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

// Extraction des données statistiques d'un nœud pour les modes graphiques du
// panneau unitaire (couronne / histogramme, cf. ModalUnitarySankeyOSP + moteur de
// rendu OS Charts/NodeStatsCharts). Sépare la lecture du modèle (liens, data tags)
// du dessin D3 pur.

import { Class_NodeElement } from '@terriflux/opensankey/src/Elements/Node'
import { Class_LinkElement } from '@terriflux/opensankey/src/Elements/Link'
import { Class_DataTagGroup } from '@terriflux/opensankey/src/types/TagGroup'
import { Type_StatSlice } from '@terriflux/opensankey/src/Charts/NodeStatsCharts'

/**
 * Répartition des flux entrants ou sortants VISIBLES du nœud : un secteur par
 * flux, libellé par le nœud d'en face. Pas de couleur imposée : les graphiques
 * utilisent leur propre palette catégorielle (les couleurs du diagramme, souvent
 * peu contrastées entre flux voisins, rendraient le donut illisible).
 */
export const buildFlowSlices = (
  node: Class_NodeElement,
  side: 'in' | 'out'
): Type_StatSlice[] => {
  const links = (side === 'in'
    ? node.input_links_list
    : node.output_links_list) as Class_LinkElement[]
  return links
    .filter(l => l.is_visible)
    .map(l => {
      const other = side === 'in' ? l.source : l.target
      return {
        id: l.id,
        label: other.name,
        value: l.valueCurrent ?? 0
      }
    })
    .filter(s => s.value > 0)
}

/**
 * Valeur du nœud (data_value = max(somme entrées, somme sorties)) pour CHAQUE tag
 * du groupe de data tags donné (ex. par année, par scénario). Même patron de
 * (dé)sélection transitoire que l'échelle unitaire (cf. updateUnitaryStyles) :
 * data_value dépend du tag sélectionné ; la sélection initiale est restaurée.
 */
export const buildDataTagSeries = (
  node: Class_NodeElement,
  tagg: Class_DataTagGroup
): Type_StatSlice[] => {
  const initially_selected = tagg.tags_list.filter(t => t.is_selected)
  tagg.tags_list.forEach(t => t.setUnSelected())
  const slices: Type_StatSlice[] = tagg.tags_list.map(tag => {
    tag.setSelected()
    const value = node.data_value
    tag.setUnSelected()
    return { id: tag.id, label: tag.name, value }
  })
  initially_selected.forEach(t => t.setSelected())
  return slices.filter(s => s.value > 0)
}
