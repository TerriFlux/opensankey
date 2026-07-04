// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// Traductions — side-effect import : initialise i18next avec toutes les ressources SA/OSP/OS
import './traductions/traduction'

// NB : les CSS (main.css, style_elements_sankey.css, react-quill.css) ne sont PAS
// importés ici car `tsc -p .` ne copie pas les fichiers .css dans dist/.
// Le consommateur doit les importer dans son propre point d'entrée, par ex. :
//   import "@terriflux/sankeyapplication/src/deps/OpenSankey+/deps/OpenSankey/css/main.css"
// (chemin source — fonctionne via webpack/craco qui résolvent depuis node_modules).
// Sans ces CSS, Chakra rend la majorité du chrome correctement, mais le SVG D3 et
// react-quill peuvent manquer de style.

import React, { FC, useEffect, useRef, useState } from 'react'
import i18next from 'i18next'
import { I18nextProvider, useTranslation } from 'react-i18next'

import { Class_ApplicationDataSA } from './ApplicationDataSA'
import { Type_AnyJSON, Type_JSON } from 'open-sankey/src/types/Utils'
import { applyViewerOptions, ViewerSankeyOptions } from 'open-sankey/src/types/PublishOptions'
import { SankeyApp } from './AppSA'

export type ViewerSankeyApplicationProps = ViewerSankeyOptions & {
  initial_data?: Type_AnyJSON
}

const ViewerInner: FC<ViewerSankeyApplicationProps> = ({ initial_data, ...options }) => {
  const { t, i18n } = useTranslation()

  const [app_data] = useState<Class_ApplicationDataSA>(() => {
    applyViewerOptions(options)
    const data = new Class_ApplicationDataSA(true)
    data.t = t
    data.i18n = i18n
    return data
  })

  // Le menu_configuration est créé pendant le render de OpenSankeyApp (enfant),
  // donc fromJSON ne peut pas être appelé avant le mount du sous-arbre.
  useEffect(() => {
    if (initial_data && app_data.menu_configuration) {
      app_data.fromJSON(initial_data as unknown as Type_JSON)
      app_data.draw()
      // Applique l'état initial demandé via props viewer (position_mode / data_tag_selection)
      app_data.applyPublishStateOptions()
    }
  }, [app_data, initial_data])

  // Ré-application RÉACTIVE des sélections (data tag / view tag / vue / mode) SANS remonter le
  // viewer. Sans ça, un embarqueur devait forcer un remount (prop `key`) pour changer de sélection,
  // ce qui refait tout le chargement (fetch + décompression + parse + fromJSON + draw complet) —
  // très lent sur un gros diagramme. Ici on mute les champs de `publish_options` (readonly capturé
  // au load, mais ses champs sont mutables) et on rappelle `applyPublishStateOptions()`, qui suit
  // exactement le chemin léger des sélecteurs natifs (filtre in-place / setCurrentView + redraw).
  //
  // La clé sérialisée évite les faux déclenchements dus aux objets inline (`{{ region }}`) recréés
  // à chaque rendu. Le tout premier rendu est ignoré : l'application initiale est faite par le
  // chargement (App.tsx pour `diagram=`, ou l'effet `initial_data` ci-dessus).
  // Les valeurs à appliquer sont lues via un ref (mis à jour à chaque rendu), pas via les deps :
  // l'effet ne doit se relancer QUE sur un vrai changement de sélection (selection_key), pas à
  // chaque rendu (les objets inline `{{ region }}` changent d'identité sans changer de contenu).
  // Ainsi les deps restent [selection_key, app_data] (app_data stable) sans directive eslint.
  const first_apply = useRef(true)
  const options_ref = useRef(options)
  options_ref.current = options
  const selection_key = JSON.stringify([
    options.data_tag_selection ?? null,
    options.view_tag_selection ?? null,
    options.position_mode ?? null,
  ])
  useEffect(() => {
    if (first_apply.current) { first_apply.current = false; return }
    if (!app_data.menu_configuration) return
    const o = options_ref.current
    const po = app_data.publish_options
    po.data_tag_selection = o.data_tag_selection ?? null
    po.view_tag_selection = o.view_tag_selection ?? null
    if (o.position_mode !== undefined) po.position_mode = o.position_mode
    app_data.applyPublishStateOptions()
  }, [selection_key, app_data])

  return <SankeyApp new_data_app={app_data} />
}

export const ViewerSankeyApplication: FC<ViewerSankeyApplicationProps> = (props) => (
  <I18nextProvider i18n={i18next}>
    <ViewerInner {...props} />
  </I18nextProvider>
)

export default ViewerSankeyApplication
