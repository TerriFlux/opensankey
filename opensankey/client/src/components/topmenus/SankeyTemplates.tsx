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
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardHeader,
  CloseButton,
  Heading,
  Divider,
  CardBody,
  Image,
  CardFooter,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Text
} from '@chakra-ui/react'

import { Class_ApplicationData } from '../../types/ApplicationData'
import { Type_AdditionalMenus } from '../../types/MenuConfig'
import { CONVERTER_CONFIGS } from '../dialogs/PersistenceProcessDialogConfigs'
import { loadSankeymaticTemplate } from '../../Persistence/sankeymaticLoad'
import { applyEsankeyFile } from '../../Persistence/esankeyLoad'

// TYPES ================================================================================

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

/**
 * Charge un modèle STAN (.smfa SQLite / .zmfa XML gzippé) : binaire non-JSON, la
 * conversion est déléguée au serveur (open_stan), comme l'import fichier de MenuTop.
 */
const loadStanTemplate = (
  new_data: Class_ApplicationData,
  file_path: string
) => {
  const root = window.location.origin
  fetch(root + '/opensankey/menus/templates_asset/' + file_path)
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
  const root = window.location.origin
  fetch(root + '/opensankey/menus/templates_asset/' + file_path)
    .then(response => response.arrayBuffer())
    .then(buffer => applyEsankeyFile(buffer, new_data))
    .catch((error) => {
      console.error('Error in loadEsankeyTemplate - ' + error.toString())
    })
}

/**
 * Charge un modèle dans l'application (même chemin que le bouton « Utiliser » de la
 * modale) : parse front pour les modèles SankeyMATIC (.txt) et e!Sankey (.sankey),
 * conversion serveur pour les modèles STAN (.smfa/.zmfa), converter JSON sinon.
 */
export const loadTemplate = (
  new_data: Class_ApplicationData,
  file_path: string
) => {
  if (file_path.endsWith('.txt')) {
    // Modèle SankeyMATIC natif : parsé côté front (pas de converter JSON).
    loadSankeymaticTemplate(file_path, new_data)
  } else if (/\.(smfa|zmfa)$/i.test(file_path)) {
    loadStanTemplate(new_data, file_path)
  } else if (file_path.endsWith('.sankey')) {
    loadEsankeyTemplate(new_data, file_path)
  } else {
    new_data.menu_configuration.ref_universal_converter_set_config.current(
      CONVERTER_CONFIGS['load_example_json'], file_path, true
    )
    new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_file_converter.current(true)
  }
}

/**
 * Récupère la bibliothèque de modèles auprès du serveur (une fois au montage).
 * Renvoie les modèles, l'index catégorie -> ids et l'ordre des catégories. Au sein
 * d'une catégorie, l'ordre des modèles est celui de `index.json`.
 */
export const useTemplatesLibrary = (
  additionalMenu: MutableRefObject<Type_AdditionalMenus>
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
      body: JSON.stringify({ module: additionalMenu.current.template_module_key })
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
  }, [])

  return { templates, indexes, categories }
}

/**
 * Vignette d'un modèle. Certains modèles (formats importés) n'ont pas d'image de
 * prévisualisation : on affiche alors un aplat portant leur titre.
 */
const TemplateThumbnail = ({ title, img_path, max_height, className }:{
  title: string
  img_path?: string
  max_height: string
  className?: string
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
    src={window.location.origin + '/opensankey/menus/templates_asset/' + img_path}
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
 * Modal containing templates to create sankey
 *
 * @param {*} { new_data, additionalMenu }
 * @return {*}
 */
export const ModalTemplate = ({ new_data, additionalMenu }:{
  new_data: Class_ApplicationData
  additionalMenu: MutableRefObject<Type_AdditionalMenus>
}) => {

  const [show_template, set_show_template] = useState(false)
  const { templates, indexes, categories } = useTemplatesLibrary(additionalMenu)

  const { ref_setter_show_modal_templates_lib } = new_data.menu_configuration.dict_setter_show_dialog
  ref_setter_show_modal_templates_lib.current = set_show_template

  // Tabs for each entries of the template_module_key
  const tabs_of_cards = <Tabs
    orientation='vertical'
    align='start'
    variant='tabs_variant_template'
    height='100%'
  >
    <TabList>
      {categories
        .map((category, idx) => {
          return <Tab
            key={idx}
          >
            {new_data.t('templates.categories.' + category)}
          </Tab>
        })}
    </TabList>
    <TabPanels>
      {categories
        .map((category, idx) => {

          const ordered_ids = indexes[category]

          return <TabPanel key={idx}>
            <Box
              display='grid'
              gridAutoFlow='row'
              gridRowGap='1rem'
              height='100%'
            >
              <Box
                display="block"
                overflow='scroll'
                height='100%'
              >
                <Box
                  display='grid'
                  gridTemplateColumns='1fr 1fr 1fr'
                  gridTemplateRows='0.5fr'
                  gridRowGap='0.25rem'
                  gridColumnGap='0.25rem'
                  height='100%'
                >
                  {ordered_ids
                    .map((id, idx) => {
                      return <Card
                        key={idx}
                        variant='cards_template'
                        onClick={() => {
                          // Cliquer la carte charge le modèle (même action que le bouton
                          // « Utiliser ») : l'ancien comportement réinitialisait le
                          // diagramme sans rien charger.
                          loadTemplate(new_data, templates[id].file_path)
                          set_show_template(false)
                        }}
                      >
                        <CardHeader>
                          <Heading variant='heading_template_sankey'>
                            {templateTitle(new_data, id, templates[id])}
                          </Heading>
                          <Divider />
                        </CardHeader>

                        <CardBody>
                          {/* Get the image from the server */}
                          <TemplateThumbnail
                            className='img-card'
                            title={templateTitle(new_data, id, templates[id])}
                            img_path={templates[id].img_path}
                            max_height='150px'
                          />
                        </CardBody>

                        <CardFooter>
                          <ButtonGroup
                            //ButtonGroup don't have variants theming so we modify directly the style
                            style={{
                              margin: 'auto'
                            }}>
                            <Button variant='menuconfigpanel_option_button'
                              onClick={() => {
                                loadTemplate(new_data, templates[id].file_path)
                                set_show_template(false)
                              }}>
                              {new_data.t('useTemplate')}
                            </Button>

                          </ButtonGroup>
                        </CardFooter>
                      </Card>
                    })}

                </Box>
              </Box>
            </Box>
          </TabPanel>
        })}
    </TabPanels>
  </Tabs>


  return <Modal
    isOpen={show_template}
    blockScrollOnMount={false}
    onClose={() => set_show_template(false)}
  >
    <ModalOverlay />
    <ModalContent
      maxWidth='inherit'
    >
      <ModalHeader>{new_data.t('Menu.templates')}</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        {tabs_of_cards}
      </ModalBody>
    </ModalContent>
  </Modal>
}

/**
 * Galerie de modèles ancrée à droite, visible à l'ARRIVÉE tant que le diagramme est
 * vide : vitrine pour le nouveau visiteur (un clic charge un exemple riche). Elle
 * s'efface d'elle-même dès que l'utilisateur travaille : diagramme non vide (modèle
 * chargé, fichier ouvert, cache restauré), première interaction avec le canvas
 * (création manuelle) ou fermeture explicite. La modale (ModalTemplate) reste le
 * parcours Menu -> Nouveau -> « À partir d'un modèle ».
 */
export const TemplateGalleryPanel = ({ new_data, additionalMenu }:{
  new_data: Class_ApplicationData
  additionalMenu: MutableRefObject<Type_AdditionalMenus>
}) => {
  const { templates, indexes, categories } = useTemplatesLibrary(additionalMenu)
  const [dismissed, setDismissed] = useState(false)

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

  if (dismissed || !diagram_empty || new_data.is_static || !new_data.is_editable)
    return <></>
  if (Object.keys(indexes).length === 0)
    return <></>

  const top = da.getNavBarHeight() + da.fit_margin
  const bottom = da.getBottomBarHeight() + da.fit_margin
  const right = da.fit_margin / 2 + new_data.menu_configuration.getToolsColumnWidthPx()

  return <Box
    className='template_gallery_panel'
    position='fixed'
    top={top + 'px'}
    right={right + 'px'}
    width='300px'
    maxHeight={'calc(100vh - ' + (top + bottom) + 'px)'}
    zIndex={20}
    background='white'
    border='1px solid #e2e8f0'
    borderRadius='6px'
    boxShadow='0 4px 16px rgba(0, 0, 0, 0.25)'
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
        {new_data.t('Menu.templates')}
      </Text>
      <CloseButton size='sm' onClick={() => setDismissed(true)} />
    </Box>
    <Text
      fontSize='sm'
      color='gray.600'
      margin='0'
      padding='0.4rem 0.75rem'
    >
      {new_data.t('templates.gallery_hint')}
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
              onClick={() => loadTemplate(new_data, templates[id].file_path)}
            >
              <TemplateThumbnail
                title={templateTitle(new_data, id, templates[id])}
                img_path={templates[id].img_path}
                max_height='90px'
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
