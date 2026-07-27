// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
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
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import React, { FC, useEffect, useRef, useState } from 'react'
import { ChakraProvider, useToast } from '@chakra-ui/react'
import i18next from 'i18next'
import { I18nextProvider, initReactI18next, useTranslation } from 'react-i18next'

import { Class_ApplicationData } from './types/ApplicationData'
import { Type_AnyJSON, Type_JSON } from './types/Utils'
import { applyViewerOptions, ViewerSankeyOptions } from './types/PublishOptions'

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources: { en: { translation: {} } },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })
}

export type ViewerOpenSankeyAppProps = ViewerSankeyOptions & {
  initial_data?: Type_AnyJSON
}

const ViewerInner: FC<ViewerOpenSankeyAppProps> = ({ initial_data, ...options }) => {
  const { t, i18n } = useTranslation()

  const [app_data] = useState<Class_ApplicationData>(() => {
    applyViewerOptions(options)
    const data = new Class_ApplicationData(true)
    data.t = t
    data.i18n = i18n
    return data
  })

  // Le toast Chakra est un hook : acquis ici (corps du composant) puis injecté dans la
  // config. Les constructeurs des classes modèle n'appellent plus de hooks.
  const toast = useToast()
  if (typeof app_data.createNewMenuConfiguration === 'function') {
    app_data.createNewMenuConfiguration(toast)
  }

  useEffect(() => {
    if (initial_data) {
      app_data.fromJSON(initial_data as unknown as Type_JSON)
    }
    app_data.draw()
    // Applique l'état initial demandé via props viewer (position_mode / data_tag_selection)
    app_data.applyPublishStateOptions()
  }, [app_data, initial_data])

  // Ré-application RÉACTIVE des sélections (data tag / view tag / vue / mode) SANS remonter le
  // viewer. Sans ça, un embarqueur n'a pas le choix : il doit forcer un remount (prop `key`), ce
  // qui refait tout — fromJSON + draw complet — là où changer de vue ne demande qu'un filtre en
  // place ou un setCurrentView. Sur un gros diagramme, l'écart se compte en secondes.
  // On mute les champs de `publish_options` (readonly capturé au load, mais champs mutables) puis
  // on rappelle `applyPublishStateOptions()`, qui suit exactement le chemin léger des sélecteurs
  // natifs.
  //
  // La clé sérialisée évite les faux déclenchements dus aux objets inline (`{{ region }}`) recréés
  // à chaque rendu. Le tout premier rendu est ignoré : l'application initiale est faite par l'effet
  // `initial_data` ci-dessus. Les valeurs sont lues via un ref plutôt que par les deps, pour que
  // l'effet ne se relance QUE sur un vrai changement de sélection.
  //
  // Ce bloc existait déjà dans ViewerSankeyApplication (paquet sankeyapplication) — d'où
  // `cartofob-sankey/viewer` tire ses deux sélecteurs sans `key`. Il manquait ici, donc les
  // intégrateurs du paquet MIT étaient les seuls à payer le rechargement complet.
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

  return <div id="sankey_app" style={{ backgroundColor: 'WhiteSmoke' }} />
}

export const ViewerOpenSankeyApp: FC<ViewerOpenSankeyAppProps> = (props) => (
  <ChakraProvider>
    <I18nextProvider i18n={i18next}>
      <ViewerInner {...props} />
    </I18nextProvider>
  </ChakraProvider>
)

export default ViewerOpenSankeyApp
