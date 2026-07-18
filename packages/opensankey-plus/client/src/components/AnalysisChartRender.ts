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

// Pont extraction → rendu D3 des graphiques d'analyse (OS#1278). Choisit le moteur
// (couronne / histogramme / histogramme empilé) selon la grammaire du descripteur
// et dessine dans le conteneur DOM fourni. Partagé par les surfaces (inspecteur,
// tooltip) pour un seul point de vérité sur la correspondance descripteur→moteur.

import { drawBarChart, drawDonutChart, drawStackedBarChart, Type_ChartOptions } from '@terriflux/opensankey/src/Charts/NodeStatsCharts'
import { deduceRepr, isDescriptorEmpty } from '@terriflux/opensankey/src/Charts/AnalysisDescriptor'
import { buildAnalysisChartData, Type_AnalysisDescriptor, Type_ChartSubject } from './AnalysisChartData'

export const drawAnalysisChart = (
  el: HTMLElement,
  subject: Type_ChartSubject,
  descriptor: Type_AnalysisDescriptor,
  opts: Type_ChartOptions = {}
): void => {
  if (isDescriptorEmpty(descriptor)) { el.innerHTML = ''; return }
  const data = buildAnalysisChartData(subject, descriptor)
  if (descriptor.decompose && descriptor.compare) {
    // Croisement → histogramme empilé (barre = série, empilement = décomposition).
    drawStackedBarChart(el, data.series, opts)
  } else if (descriptor.compare) {
    // Comparaison pure → une barre par série (valeur du sujet par tag), couleur du tag.
    const slices = data.series
      .map(s => ({ id: s.id, label: s.label, value: s.parts[0]?.value ?? 0, color: s.color }))
      .filter(s => s.value > 0)
    drawBarChart(el, slices, opts)
  } else {
    // Décomposition pure → couronne (défaut) ou barres (override).
    const parts = data.series[0]?.parts ?? []
    if (deduceRepr(descriptor) === 'donut') drawDonutChart(el, parts, opts)
    else drawBarChart(el, parts, opts)
  }
}
