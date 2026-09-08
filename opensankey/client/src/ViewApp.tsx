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
import { Box, ChakraProvider, useToast } from '@chakra-ui/react'
import i18next from 'i18next'
import { I18nextProvider, initReactI18next, useTranslation } from 'react-i18next'

import { Class_ApplicationData } from './types/ApplicationData'
import { Type_AnyJSON, Type_JSON } from './types/Utils'
import { applyViewerOptions, ViewerSankeyOptions } from './types/PublishOptions'
import { ComponentZoomControl } from './components/ui/ZoomControl'
import { PanelDismissLayer } from './components/panels/PanelShell'
import { PresentationPanels } from './components/panels/presentation/PresentationPanels'

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
    options.view ?? null,
    options.view_label ?? null,
  ])
  useEffect(() => {
    if (first_apply.current) { first_apply.current = false; return }
    if (!app_data.menu_configuration) return
    const o = options_ref.current
    const po = app_data.publish_options
    po.data_tag_selection = o.data_tag_selection ?? null
    po.view_tag_selection = o.view_tag_selection ?? null
    if (o.position_mode !== undefined) po.position_mode = o.position_mode
    // sa#397 — vue / label de vue également réactifs (mêmes règles additives qu'au démarrage).
    po.view = o.view ?? null
    // sa#412 — `view_label` accepte une LISTE : comme au chargement de page, le filtre actif
    // reste le PREMIER label et la liste complète alimente le sélecteur de label visible.
    // Même normalisation que le viewer de la couche SaaS (ViewAppSA) : le correctif y avait
    // été posé, mais ce chemin RÉACTIF du paquet opensankey était resté sur l'affectation
    // brute — d'où le build de `main` rouge (TS2322) alors que le paquet SaaS compilait.
    const raw_view_label = o.view_label ?? null
    const view_labels = Array.isArray(raw_view_label)
      ? raw_view_label
      : (raw_view_label !== null ? [raw_view_label] : null)
    po.view_labels = view_labels && view_labels.length > 0 ? view_labels : null
    po.view_label = view_labels && view_labels.length > 0 ? view_labels[0] : null
    app_data.applyPublishStateOptions()
  }, [selection_key, app_data])

  // `height: 100%` n'est pas cosmetique : en mode `embedded`, DrawingArea cadre le diagramme sur
  // le clientHeight de CE conteneur (window_fitting_height). Sans hauteur, le div s'effondre a la
  // hauteur intrinseque du SVG, et le dessin se reduit pour tenir dedans — un diagramme minuscule
  // dans une bande, quelle que soit la taille donnee par l'embarqueur.
  // Le paquet editeur pose deja `height: '100%'` sur le meme conteneur (App.tsx) : c'est le contrat
  // normal, l'hote decide de la taille, le viewer la remplit. Il manquait seulement ici.
  // os#1383 — `zoom_control` : la barre de zoom de l'application (+ / % / -), à droite, par-dessus
  // le dessin. Le conteneur `#sankey_app` garde ses 100 % : c'est lui que `embedded` mesure.
  // Variantes Chakra natives : ce viewer monte un `ChakraProvider` sans le thème de l'application.
  return <div style={{ position: 'relative', height: '100%' }}>
    <div id="sankey_app" style={{ backgroundColor: 'WhiteSmoke', height: '100%' }} />
    {/* os#1383 — Info-bulles et pop-ups de PRÉSENTATION (OS#305) : rendues par
        `PresentationPanels`, que seul l'éditeur montait (SankeyMenus). Le viewer MIT n'en
        avait donc AUCUNE — le survol d'un flux ne montrait rien dans `examples/cartofob`
        alors que l'application, sur le même fichier, ouvrait l'info-bulle. Même paire que
        l'éditeur : la couche de congé (OS#321) referme les pop-ups non épinglées au clic
        ailleurs. La barre latérale (`SidebarSurface`) reste propre aux menus de l'éditeur. */}
    <PanelDismissLayer app_data={app_data} />
    <PresentationPanels app_data={app_data} />
    {options.zoom_control
      ? <Box position='absolute' right='12px' top='12px' zIndex={10}>
        <ComponentZoomControl app_data={app_data} variant='outline' size='xs' />
      </Box>
      : null}
  </div>
}

export const ViewerOpenSankeyApp: FC<ViewerOpenSankeyAppProps> = (props) => (
  <ChakraProvider>
    <I18nextProvider i18n={i18next}>
      <ViewerInner {...props} />
    </I18nextProvider>
  </ChakraProvider>
)

export default ViewerOpenSankeyApp
