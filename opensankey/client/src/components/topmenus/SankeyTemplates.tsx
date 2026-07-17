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

import React, { useState, useEffect, MutableRefObject } from 'react'
import {
  Box,
  Button,
  CloseButton,
  Image,
  Text
} from '@chakra-ui/react'
import { FaThumbtack } from 'react-icons/fa'

import { Class_ApplicationData } from '../../types/ApplicationData'
import { Type_JSON } from '../../types/Utils'
import { Type_AdditionalMenus, TEMPLATE_GALLERY_WIDTH_PX } from '../../types/MenuConfig'
import { useMainZone } from '../spreadsheet/MainZoneTabs'
import { CONVERTER_CONFIGS } from '../dialogs/PersistenceProcessDialogConfigs'
import { loadSankeymaticTemplate } from '../../Persistence/sankeymaticLoad'
import { applyEsankeyFile } from '../../Persistence/esankeyLoad'
import { decompressGzipDataFixed } from '../../Persistence/UniversalJSONCompression'

// TYPES ================================================================================

/**
 * Source d'une galerie. Les deux ont le même index (categories + templates) et le
 * même panneau ; seules changent la racine des fichiers et les dialogues de
 * chargement :
 *  - 'sankeydata' : les modèles, dans le submodule SankeyData ;
 *  - 'mfadata'    : la sankeythèque, nos études publiées, dans MFAData.
 */
export type Type_TemplateSource = 'sankeydata' | 'mfadata'

export type Type_TemplateInfos = {
  'title'?: { [lang: string]: string };
  'file_path': string;
  'img_path'?: string;
  'lang': string;
  'category': string;
};
export type Type_TemplatesInfos = { [id: string]: Type_TemplateInfos; };
export type Type_TemplatesIndexes = { [category: string]: string[]; };

// HELPERS ==============================================================================

export declare const window: Window & typeof globalThis

/** URL de service d'un fichier de galerie (vignette, modèle binaire...). */
const assetUrl = (path: string, source: Type_TemplateSource) => {
  const url = window.location.origin + '/opensankey/menus/templates_asset/' + path
  return source === 'mfadata' ? url + '?source=mfadata' : url
}

/**
 * Charge un modèle STAN (.smfa SQLite / .zmfa XML gzippé) : binaire non-JSON, la
 * conversion est déléguée au serveur (open_stan), comme l'import fichier de MenuTop.
 */
const loadStanTemplate = (
  new_data: Class_ApplicationData,
  file_path: string
) => {
  const root = window.location.origin
  fetch(assetUrl(file_path, 'sankeydata'))
    .then(response => response.blob())
    .then(blob => {
      const form_data = new FormData()
      const filename = file_path.split('/').pop() as string
      form_data.append('file_content', new File([blob], filename))
      return fetch(root + new_data.url_prefix + 'open_stan', {
        method: 'POST',
        body: form_data
      })
    })
    .then(response => response.json())
    .then(json_data => new_data.fromJSON(json_data))
    .catch((error) => {
      console.error('Error in loadStanTemplate - ' + error.toString())
    })
}

/**
 * Charge un modèle e!Sankey (.sankey = ZIP + XML) : dézippé et parsé 100 % côté
 * front, comme l'import fichier de MenuTop.
 */
const loadEsankeyTemplate = (
  new_data: Class_ApplicationData,
  file_path: string
) => {
  fetch(assetUrl(file_path, 'sankeydata'))
    .then(response => response.arrayBuffer())
    .then(buffer => applyEsankeyFile(buffer, new_data))
    .catch((error) => {
      console.error('Error in loadEsankeyTemplate - ' + error.toString())
    })
}

/**
 * Charge un modèle JSON : récupéré en un seul GET, dézippé et chargé côté front.
 *
 * Le serveur n'a rien à convertir ici — il ne fait que servir un fichier — d'où
 * le court-circuit du converter (convert/launch + polling check_process +
 * retrieve_result, soit 3 aller-retours et un état en session Flask pour ouvrir
 * puis refermer un dialogue). templates_asset applique la tolérance
 * .json/.json.gz, sert le .gz brut et le rend cacheable (304).
 */
const loadJsonTemplate = (
  new_data: Class_ApplicationData,
  file_path: string,
  source: Type_TemplateSource
) => {
  new_data.sendWaitingToast(
    async () => {
      const response = await fetch(assetUrl(file_path, source))
      if (!response.ok) {
        throw new Error('chargement: ' + response.status + ' ' + response.statusText)
      }
      const buffer = await response.arrayBuffer()
      const decompressed = await decompressGzipDataFixed(buffer)
      new_data.fromJSON(JSON.parse(decompressed) as Type_JSON, {})
    },
    {
      success: { title: new_data.t('toast.load_json.success.title') },
      loading: { title: new_data.t('toast.load_json.loading.title') },
      error: { title: new_data.t('toast.load_json.error.title') }
    }
  )
}

/**
 * Charge une entrée de galerie dans l'application.
 *
 * Les formats importés (SankeyMATIC .txt, e!Sankey .sankey, STAN .smfa/.zmfa) ne
 * concernent que les modèles : parse front pour les deux premiers, conversion
 * serveur pour STAN. Le JSON se charge en direct (loadJsonTemplate). Seul le
 * .xlsx passe encore par le converter, avec les dialogues de la source :
 * `load_example_json` résout contre SankeyData, `load_sankeytheque_excel`
 * contre MFAData (example_root).
 */
export const loadTemplate = (
  new_data: Class_ApplicationData,
  file_path: string,
  source: Type_TemplateSource = 'sankeydata'
) => {
  if (source === 'sankeydata' && file_path.endsWith('.txt')) {
    // Modèle SankeyMATIC natif : parsé côté front (pas de converter JSON).
    loadSankeymaticTemplate(file_path, new_data)
    return
  }
  if (source === 'sankeydata' && /\.(smfa|zmfa)$/i.test(file_path)) {
    loadStanTemplate(new_data, file_path)
    return
  }
  if (source === 'sankeydata' && file_path.endsWith('.sankey')) {
    loadEsankeyTemplate(new_data, file_path)
    return
  }
  // Un .json / .json.gz s'ouvre directement, sans dialogue : le serveur ne
  // convertit rien. Un .xlsx doit passer par le parser (dialogue excel), dont la
  // conversion tourne vraiment dans un thread — le converter garde tout son sens.
  if (!/\.xlsx$/i.test(file_path)) {
    loadJsonTemplate(new_data, file_path, source)
    return
  }
  // Mapping inchangé pour le .xlsx : côté sankeydata, c'est bien load_example_json
  // qui était utilisé, convert/launch basculant en input_format='excel' d'après
  // l'extension. (Aucun .xlsx dans l'index des modèles à ce jour.)
  const config = source === 'mfadata'
    ? CONVERTER_CONFIGS['load_sankeytheque_excel']
    : CONVERTER_CONFIGS['load_example_json']
  new_data.menu_configuration.ref_universal_converter_set_config.current(config, file_path, true)
  new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_file_converter.current(true)
}

/**
 * Récupère la bibliothèque de modèles auprès du serveur (une fois au montage).
 * Renvoie les modèles, l'index catégorie -> ids et l'ordre des catégories. Au sein
 * d'une catégorie, l'ordre des modèles est celui de `index.json`.
 */
export const useTemplatesLibrary = (
  additionalMenu: MutableRefObject<Type_AdditionalMenus>,
  source: Type_TemplateSource = 'sankeydata'
) => {
  const [templates, setTemplates] = useState<Type_TemplatesInfos>({})
  const [indexes, setIndexes] = useState<Type_TemplatesIndexes>({})
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    const url = window.location.origin + '/opensankey/menus/templates'
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        module: additionalMenu.current.template_module_key,
        source
      })
    })
      .then(response => response.text())
      .then(text => {
        const json_data = JSON.parse(text)
        const new_indexes: Type_TemplatesIndexes = {}
        if ('templates' in json_data) {
          Object.entries(json_data['templates'] as Type_TemplatesInfos)
            .forEach(([id, template]) => {
              const category = template['category']
              if (!(category in new_indexes))
                new_indexes[category] = []
              new_indexes[category].push(id)
            })
          setTemplates(json_data['templates'] as Type_TemplatesInfos)
        }
        // Les categories declarees fixent l'ordre des onglets ; une categorie
        // presente dans les modeles mais absente de la liste passe a la fin.
        const declared: string[] = json_data['categories'] ?? []
        setCategories([
          ...declared.filter(category => category in new_indexes),
          ...Object.keys(new_indexes).filter(category => !declared.includes(category))
        ])
        setIndexes(new_indexes)
      })
      .catch((err) => {
        console.error('Error in fetch templates - ' + err.toString())
      })
  }, [source])

  return { templates, indexes, categories }
}

/**
 * Vignette d'un modèle. Certains modèles (formats importés) n'ont pas d'image de
 * prévisualisation : on affiche alors un aplat portant leur titre.
 */
const TemplateThumbnail = ({ title, img_path, max_height, className, source }:{
  title: string
  img_path?: string
  max_height: string
  className?: string
  source: Type_TemplateSource
}) => {
  if (img_path === undefined)
    return <Box
      display='flex'
      alignItems='center'
      justifyContent='center'
      height={max_height}
      background='gray.100'
      borderRadius='4px'
      padding='0.5rem'
    >
      <Text fontSize='sm' color='gray.600' textAlign='center' margin='0'>
        {title}
      </Text>
    </Box>
  return <Image
    className={className}
    src={assetUrl(img_path, source)}
    style={{ 'objectFit': 'contain', 'maxHeight': max_height, 'width': '100%' }}
  />
}

/** Titre localisé d'un modèle, avec repli en puis id. */
const templateTitle = (
  new_data: Class_ApplicationData,
  id: string,
  template: Type_TemplateInfos
) => {
  return template.title?.[new_data.i18n.language]
    ?? template.title?.['en']
    ?? id
}

// COMPONENTS ===========================================================================

/**
 * Galerie de modèles ancrée à droite. Deux façons de l'obtenir :
 *  - automatiquement à l'ARRIVÉE tant que le diagramme est vide : vitrine pour le
 *    nouveau visiteur (un clic charge un exemple riche). Elle s'efface d'elle-même
 *    dès que l'utilisateur travaille : diagramme non vide (modèle chargé, fichier
 *    ouvert, cache restauré), première interaction avec le canvas (création
 *    manuelle) ou fermeture explicite ;
 *  - explicitement, via Menu -> Nouveau -> « À partir d'un modèle » (et le splash
 *    screen), qui passent par ref_setter_show_modal_templates_lib. Ouverte ainsi,
 *    elle reste affichée même sur un diagramme non vide, jusqu'au choix d'un modèle
 *    ou à sa fermeture.
 *
 * L'épingle neutralise TOUTES les fermetures implicites (clic canvas, diagramme
 * non vide, choix d'un modèle) : on peut ainsi essayer les modèles l'un après
 * l'autre. Seul le bouton de fermeture la referme alors. Comme le panneau de
 * config (#1243), épinglée elle quitte l'overlay et entre dans le système de
 * fenêtrage : dockée à droite, elle réserve sa largeur (getRightChromeReservedPx)
 * et la zone de dessin se recadre à gauche.
 */
export const TemplateGalleryPanel = ({ new_data, additionalMenu }:{
  new_data: Class_ApplicationData
  additionalMenu: MutableRefObject<Type_AdditionalMenus>
}) => {
  const [dismissed, setDismissed] = useState(false)
  // L'épinglage vit dans le modèle (et non en useState) : il réserve de la
  // largeur, donc le diagramme et la colonne tableur/doc doivent le lire.
  // useMainZone -> re-render quand la réserve change (ici comme ailleurs).
  useMainZone(new_data)
  const pinned = new_data.menu_configuration.template_gallery_pinned
  const setPinned = (v: boolean) => { new_data.menu_configuration.template_gallery_pinned = v }
  // Source ouverte explicitement, null si aucune. Un seul panneau pour les deux
  // galeries : elles occupent le même ancrage, donc ouvrir l'une ferme l'autre
  // par construction, sans exclusion mutuelle à tenir à jour.
  const [forced_source, setForcedSource] = useState<Type_TemplateSource | null>(null)

  // Ouverture depuis le menu / le splash screen : le panneau remplace l'ancienne modale.
  new_data.menu_configuration.dict_setter_show_dialog
    .ref_setter_show_modal_templates_lib.current = (open) => {
      const is_open = typeof open === 'function' ? open(forced_source === 'sankeydata') : open
      setForcedSource(is_open ? 'sankeydata' : null)
    }
  // Ouverture d'une galerie quelconque (la sankeythèque, côté SA).
  new_data.menu_configuration.dict_setter_show_dialog
    .ref_setter_show_gallery_source.current = setForcedSource

  // Hors ouverture explicite, seuls les modèles s'affichent d'eux-mêmes.
  const source: Type_TemplateSource = forced_source ?? 'sankeydata'
  const { templates, indexes, categories } = useTemplatesLibrary(additionalMenu, source)

  // Première interaction avec la zone de dessin -> la galerie s'efface. Écoute au
  // niveau document (capture) : #draw_zoom est recréé à chaque draw(), un listener
  // posé dessus serait perdu.
  useEffect(() => {
    const onPointerDown = (evt: PointerEvent) => {
      if ((evt.target as Element | null)?.closest?.('#draw_zoom'))
        setDismissed(true)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [])

  // drawing_area lue en LIVE (elle est remplacée au reset/changement de vue).
  // Le parent (SankeyMenu) re-rend via ref_to_menu_updater, appelé notamment par
  // updateAllMenuComponents() après tout fromJSON : la condition est réévaluée
  // dès qu'un diagramme est chargé.
  const da = new_data.drawing_area
  const diagram_empty = (da.sankey?.nodes_list?.length ?? 0) === 0

  if (new_data.is_static || !new_data.is_editable)
    return <></>
  if (!pinned && forced_source === null && (dismissed || !diagram_empty))
    return <></>
  if (Object.keys(indexes).length === 0)
    return <></>

  const mc = new_data.menu_configuration
  // Épinglée, la galerie se docke à GAUCHE du chrome déjà réservé (colonne
  // d'outils + config épinglée) : de droite à gauche, outils | config | galerie
  // | dessin. Sa propre largeur n'entre pas dans cet offset (elle la réserve).
  const docked_right = mc.getToolsColumnWidthPx() + mc.getConfigPanelPinnedReservedPx()
  const top = da.getNavBarHeight() + (pinned ? 0 : da.fit_margin)
  const bottom = da.getBottomBarHeight() + (pinned ? 0 : da.fit_margin)
  const right = pinned ? docked_right : da.fit_margin / 2 + mc.getToolsColumnWidthPx()

  return <Box
    className={pinned ? 'template_gallery_panel_pinned' : 'template_gallery_panel'}
    position='fixed'
    top={top + 'px'}
    right={right + 'px'}
    width={TEMPLATE_GALLERY_WIDTH_PX + 'px'}
    // Dockée : elle occupe toute la hauteur entre les barres, comme le panneau
    // de config épinglé. Flottante : elle s'arrête à son contenu.
    bottom={pinned ? bottom + 'px' : undefined}
    maxHeight={pinned ? undefined : 'calc(100vh - ' + (top + bottom) + 'px)'}
    zIndex={pinned ? 26 : 20}
    background='white'
    border={pinned ? undefined : '1px solid #e2e8f0'}
    borderLeft='1px solid #e2e8f0'
    borderRadius={pinned ? undefined : '6px'}
    boxShadow={pinned ? undefined : '0 4px 16px rgba(0, 0, 0, 0.25)'}
    display='flex'
    flexDirection='column'
    overflow='hidden'
  >
    <Box
      display='flex'
      alignItems='center'
      justifyContent='space-between'
      padding='0.5rem 0.75rem'
      borderBottom='1px solid #e2e8f0'
    >
      <Text fontWeight='bold' margin='0'>
        {new_data.t(source === 'mfadata' ? 'Menu.sankeytheque' : 'Menu.templates')}
      </Text>
      <Box display='flex' alignItems='center' gap='0.25rem'>
        <Button
          size='xs'
          variant={pinned
            ? 'menuconfigpanel_option_button_activated'
            : 'menuconfigpanel_option_button'}
          sx={{ paddingInline: '0.3rem', minWidth: 'auto', width: 'auto', flex: 'none' }}
          title={new_data.t(pinned ? 'templates.unpin' : 'templates.pin')}
          onClick={() => setPinned(!pinned)}
        >
          <FaThumbtack style={{ transform: pinned ? 'none' : 'rotate(45deg)' }} />
        </Button>
        <CloseButton
          size='sm'
          onClick={() => { setForcedSource(null); setDismissed(true); setPinned(false) }}
        />
      </Box>
    </Box>
    <Text
      fontSize='sm'
      color='gray.600'
      margin='0'
      padding='0.4rem 0.75rem'
    >
      {new_data.t(source === 'mfadata' ? 'templates.sankeytheque_hint' : 'templates.gallery_hint')}
    </Text>
    <Box overflowY='auto' padding='0 0.75rem 0.75rem 0.75rem'>
      {categories.map(category => {
        const ordered_ids = indexes[category]
        return <Box key={category} marginTop='0.5rem'>
          <Text
            fontSize='xs'
            fontWeight='bold'
            textTransform='uppercase'
            color='gray.500'
            margin='0 0 0.3rem 0'
          >
            {new_data.t('templates.categories.' + category)}
          </Text>
          {ordered_ids.map(id => {
            return <Box
              key={id}
              cursor='pointer'
              border='1px solid #e2e8f0'
              borderRadius='6px'
              padding='0.4rem'
              marginBottom='0.4rem'
              _hover={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)' }}
              onClick={() => {
                loadTemplate(new_data, templates[id].file_path, source)
                // Épinglée, la galerie survit au chargement : on enchaîne les essais.
                if (!pinned) setForcedSource(null)
              }}
            >
              <TemplateThumbnail
                title={templateTitle(new_data, id, templates[id])}
                img_path={templates[id].img_path}
                max_height='90px'
                source={source}
              />
              <Text fontSize='sm' textAlign='center' margin='0.2rem 0 0 0'>
                {templateTitle(new_data, id, templates[id])}
              </Text>
            </Box>
          })}
        </Box>
      })}
    </Box>
  </Box>
}
