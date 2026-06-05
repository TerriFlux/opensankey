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

import React, { FC, useEffect, useState } from 'react'
import i18next from 'i18next'
import { I18nextProvider, useTranslation } from 'react-i18next'

import { Class_ApplicationDataSA } from './ApplicationDataSA'
import { Type_AnyJSON, Type_JSON } from './deps/OpenSankey+/deps/OpenSankey/types/Utils'
import { applyViewerOptions, ViewerSankeyOptions } from './deps/OpenSankey+/deps/OpenSankey/types/PublishOptions'
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

  return <SankeyApp new_data_app={app_data} />
}

export const ViewerSankeyApplication: FC<ViewerSankeyApplicationProps> = (props) => (
  <I18nextProvider i18n={i18next}>
    <ViewerInner {...props} />
  </I18nextProvider>
)

export default ViewerSankeyApplication
