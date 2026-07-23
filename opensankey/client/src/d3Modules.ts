// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// #1249 — Point d'entrée d3 UNIQUE de la lib, limité aux modules réellement
// utilisés. Remplace le méta-paquet `d3` (qui embarquait geo, hierarchy, chord,
// contour… dans le bundle publié). Usage : `import * as d3 from '<...>/d3Modules'`
// — les références `d3.select`, `d3.zoomTransform`, `d3.Selection`… restent
// inchangées, et le tree-shaking élimine les modules non consommés.
//
// Ajouter un module ICI (et dans les package.json d'OpenSankey ET d'OpenSankey+,
// cf. CI standalone) avant d'utiliser une nouvelle API d3.

export * from 'd3-selection'
// d3-transition ÉTEND d3-selection par effet de bord (selection.transition() /
// selection.interrupt() n'existent qu'après ce chargement) : il doit rester
// importé même si aucun symbole n'est consommé directement.
export * from 'd3-transition'
export * from 'd3-drag'
export * from 'd3-zoom'
export * from 'd3-scale'
export * from 'd3-color'
export * from 'd3-scale-chromatic'
export * from 'd3-ease'
export * from 'd3-array'
export * from 'd3-shape'
