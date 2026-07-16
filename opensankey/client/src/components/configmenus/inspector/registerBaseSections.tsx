// #1243 — Enregistrement des sections d'inspecteur de la couche OS (base).
//
// Recompose les composants de configuration EXISTANTS (SankeyNodeSelection,
// MenuConfigurationAppearance, DrawingAreaConfig, LegendConfig, TitleConfig)
// en sections empilées, au lieu de les router par la matrice type×élément.
// Aucun de ces composants n'est réécrit : la refonte #1243 est une refonte
// d'ENVELOPPE, pas de contenu.
//
// Les couches supérieures (OSP, SA) appelleront inspector_registry.register()
// à leur tour pour ajouter leurs sections (tags, vues, …) et éventuellement
// surcharger une section de base par id.

import React from 'react'
import { inspector_registry } from './InspectorRegistry'
import { SankeyNodeSelection } from '../MenuElementsSelection'
import { MenuConfigurationAppearance } from '../MenuElementsAppearance'
import {
  DrawingAreaConfig,
  LegendConfig,
  TitleConfig
} from '../SankeyMenuConfigurationLayout'

// Idempotent : `register` remplace par id, donc un double appel (hot reload,
// re-init) ne duplique rien. On garde une garde explicite pour lisibilité.
let _registered = false

export function registerBaseInspectorSections(): void {
  if (_registered) return
  _registered = true

  // ---- Cible NODE ----------------------------------------------------------
  inspector_registry.register({
    id: 'os.node.data',
    target: 'node',
    order: 10,
    hue: 'data',
    title: (app_data) => app_data.t('Menu.Config.title_node'),
    render: (app_data) => <SankeyNodeSelection app_data={app_data} />
  })

  inspector_registry.register({
    id: 'os.node.appearance',
    target: 'node',
    order: 20,
    hue: 'style',
    title: (app_data) => app_data.t('Menu.Config.title_elements'),
    // La portée pilote directement `menu_for_style` du composant d'apparence :
    // 'selection' édite les éléments sélectionnés, 'style' édite le style/défaut
    // qu'ils suivent. C'est la fusion de l'ex-modale de styles dans l'inspecteur.
    render: (app_data, scope) => (
      <MenuConfigurationAppearance
        app_data={app_data}
        menu_for_style={scope === 'style'}
      />
    )
  })

  // ---- Cible VIEW (aucune sélection) ---------------------------------------
  inspector_registry.register({
    id: 'os.view.drawing_area',
    target: 'view',
    order: 10,
    hue: 'style',
    title: (app_data) => app_data.t('Menu.Config.title_graph'),
    render: (app_data) => <DrawingAreaConfig app_data={app_data} />
  })

  inspector_registry.register({
    id: 'os.view.legend_title',
    target: 'view',
    order: 20,
    hue: 'style',
    title: (app_data) => app_data.t('Menu.Config.title_legend'),
    render: (app_data) => (
      <>
        <LegendConfig app_data={app_data} />
        <TitleConfig app_data={app_data} />
      </>
    )
  })
}
