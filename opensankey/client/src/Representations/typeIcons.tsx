// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// sa#626 — DEUX TYPES DE VOLET, DEUX ICÔNES. La barre des tâches des volets montre une icône par type,
// côte à côte : le Sankey unitaire avait celle du Sankey, et le Tableur celle du Tableau croisé. Leurs
// icônes gardent celle de leur voisin, avec le signe qui les distingue : un « 1 » pour le Sankey
// unitaire (UN élément), une feuille de plus derrière pour le Tableur (il en a plusieurs).

import React from 'react'
import { FaProjectDiagram, FaTable } from 'react-icons/fa'

/** Le Sankey, marqué d'un petit « 1 » au coin bas-droit. */
export const UnitarySankeyIcon = () => <span style={{ position: 'relative', display: 'inline-flex' }}>
  <FaProjectDiagram />
  <span style={{
    position: 'absolute', right: '-0.35em', bottom: '-0.3em',
    fontSize: '0.6em', fontWeight: 700, lineHeight: 1,
    padding: '0 0.15em', borderRadius: '0.2em',
    background: 'white', color: 'currentColor',
  }}>1</span>
</span>

/** Un tableau posé sur une seconde feuille, décalée vers le haut à droite. */
export const SpreadsheetIcon = () => <span style={{ position: 'relative', display: 'inline-flex' }}>
  <FaTable style={{ position: 'absolute', left: '0.22em', top: '-0.22em', opacity: 0.45 }} />
  <span style={{ position: 'relative', display: 'inline-flex', background: 'white', borderRadius: '0.1em' }}>
    <FaTable />
  </span>
</span>
