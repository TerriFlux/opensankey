// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================

// Entrée du BUNDLE AUTONOME (os#1532) : un seul fichier JS chargé par une balise `<script>`, sans
// projet React ni étape de build côté hôte. La page déclare ses options dans `window.sankey`
// (mêmes clés qu'une page publiée et que les props de `ViewerOpenSankeyApp`) et pose un
// `<div id="react-container">` ; le viewer MIT s'y monte au chargement.
//
//   <link rel="stylesheet" href="…/static/css/opensankey.css" />
//   <script defer src="…/static/js/opensankey.js"></script>
//   <div id="react-container"></div>
//   <script>window.sankey = { diagram: "example.json", embedded: false }</script>
//
// `diagram` est une URL (JSON, `.gz` servi brut, zip) OU l'objet JSON inline. Le chargement est
// fait ICI : le composant du paquet ne connaît qu'`initial_data` (cf. examples/README.md).
// Ce module n'est importé par rien d'autre : c'est le seul endroit du paquet viewer autorisé à
// monter quelque chose au chargement (le point d'entrée de la bibliothèque, `index.ts`, n'a aucun
// effet de bord — `architectureBoundary.test.ts`).

import './css/main.css'
// Catalogues i18n complets du viewer (info-bulles, panneaux de présentation) : sans cet import,
// `ViewApp.tsx` initialise i18next avec des ressources vides et les panneaux montrent des clés.
import i18next from './traductions/traduction'
import { SUPPORTED_LANGS } from './traductions/supportedLangs'

import React from 'react'
import { createRoot } from 'react-dom/client'

import { ViewerOpenSankeyApp } from './ViewApp'
import { loadUniversalJSON } from './Persistence/UniversalJSONCompression'
import { getForcedLanguage, SankeyGlobals } from './types/PublishOptions'
import { Type_AnyJSON } from './types/Utils'
import { ui_danger, ui_font_stack } from './css/uiTokens'

const options: SankeyGlobals = window.sankey ?? {}

// Langue imposée par la page hôte (`?lang=` ou `window.sankey.language`) : prioritaire sur la
// préférence mémorisée par le détecteur de langue.
const forced_lang = getForcedLanguage([...SUPPORTED_LANGS])
if (forced_lang) i18next.changeLanguage(forced_lang)

const findContainer = (): HTMLElement => {
  const found = document.getElementById('react-container') ?? document.getElementById('root')
  if (found) return found
  const created = document.createElement('div')
  created.id = 'react-container'
  document.body.appendChild(created)
  return created
}

const resolveDiagram = async (): Promise<Type_AnyJSON | undefined> => {
  const diagram = options.diagram
  if (diagram === undefined || diagram === null || diagram === '') return undefined
  if (typeof diagram === 'string') return await loadUniversalJSON(diagram) as unknown as Type_AnyJSON
  return diagram as Type_AnyJSON
}

const mount = async (): Promise<void> => {
  const container = findContainer()
  // Hors `embedded`, le viewer se cadre sur la hauteur de la fenêtre : le conteneur la prend
  // s'il n'a pas de hauteur propre, pour que le dessin ne s'effondre pas dans une bande.
  if (!options.embedded && container.style.height === '' && container.clientHeight === 0) {
    container.style.height = '100vh'
  }
  const root = createRoot(container)
  try {
    const initial_data = await resolveDiagram()
    root.render(
      <ViewerOpenSankeyApp
        initial_data={initial_data}
        zoom_control={options.zoom_control === true}
      />
    )
  } catch (error) {
    console.error('[OpenSankey] diagramme introuvable ou illisible :', options.diagram, error)
    root.render(
      <div style={{ padding: '1rem', fontFamily: ui_font_stack, color: ui_danger }}>
        OpenSankey : impossible de charger le diagramme « {String(options.diagram)} ».
      </div>
    )
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { void mount() })
} else {
  void mount()
}
