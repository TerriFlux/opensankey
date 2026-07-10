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

// TYPES ================================================================================

export type Type_TemplateInfos = {
  'title'?: { [lang: string]: string };
  'file_path': string;
  'img_path': string;
  'lang': string;
  'themes': string[];
  'difficulty': string;
};
export type Type_TemplatesInfos = { [id: string]: Type_TemplateInfos; };
export type Type_TemplateIndex = { [difficulty: string]: string[]; };
export type Type_TemplatesIndexes = { [theme: string]: Type_TemplateIndex; };

// HELPERS ==============================================================================

export declare const window: Window & typeof globalThis

/**
 * Charge un modèle dans l'application (même chemin que le bouton « Utiliser » de la
 * modale) : parse front pour les modèles SankeyMATIC (.txt), converter JSON sinon.
 */
export const loadTemplate = (
  new_data: Class_ApplicationData,
  file_path: string
) => {
  if (file_path.endsWith('.txt')) {
    // Modèle SankeyMATIC natif : parsé côté front (pas de converter JSON).
    loadSankeymaticTemplate(file_path, new_data)
  } else {
    new_data.menu_configuration.ref_universal_converter_set_config.current(
      CONVERTER_CONFIGS['load_example_json'], file_path, true
    )
    new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_file_converter.current(true)
  }
}

/**
 * Récupère la bibliothèque de modèles auprès du serveur (une fois au montage).
 * Renvoie les modèles, l'index thème -> difficulté -> ids et l'ordre des difficultés.
 */
export const useTemplatesLibrary = (
  additionalMenu: MutableRefObject<Type_AdditionalMenus>
) => {
  const [templates, setTemplates] = useState<Type_TemplatesInfos>({})
  const [indexes, setIndexes] = useState<Type_TemplatesIndexes>({})
  const [difficulties, setDifficulties] = useState<string[]>([])

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
        if ('difficulties' in json_data) {
          setDifficulties(json_data['difficulties'])
        }
        if ('templates' in json_data) {
          Object.entries(json_data['templates'] as Type_TemplatesInfos)
            .forEach(([id, template]) => {
              const themes = template['themes']
              const difficulty = template['difficulty']
              themes.forEach(theme => {
                if (!(theme in new_indexes))
                  new_indexes[theme] = {}
                if (!(difficulty in new_indexes[theme]))
                  new_indexes[theme][difficulty] = []
                new_indexes[theme][difficulty].push(id)
              })
            })
          setTemplates(json_data['templates'] as Type_TemplatesInfos)
        }
        setIndexes(new_indexes)
      })
      .catch((err) => {
        console.error('Error in fetch templates - ' + err.toString())
      })
  }, [])

  return { templates, indexes, difficulties }
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
  const { templates, indexes, difficulties } = useTemplatesLibrary(additionalMenu)

  const { ref_setter_show_modal_templates_lib } = new_data.menu_configuration.dict_setter_show_dialog
  ref_setter_show_modal_templates_lib.current = set_show_template

  const path = window.location.origin

  // Tabs for each entries of the template_module_key
  const tabs_of_cards = <Tabs
    orientation='vertical'
    align='start'
    variant='tabs_variant_template'
    height='100%'
  >
    <TabList>
      {Object.keys(indexes)
        .map((theme, idx) => {
          return <Tab
            key={idx}
          >
            {new_data.t('templates.themes.' + theme)}
          </Tab>
        })}
    </TabList>
    <TabPanels>
      {Object.values(indexes)
        .map((index, idx) => {

          // Toutes les difficultes du theme, ordonnees du plus simple (en
          // premier) au plus expert (en dernier) selon l'ordre de `difficulties`.
          const ordered_ids = difficulties
            .flatMap(difficulty => (difficulty in index) ? index[difficulty] : [])

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
                          <Image
                            className='img-card'
                            src={path + '/opensankey/menus/templates_asset/' + templates[id].img_path}
                            style={{ 'objectFit': 'contain', 'maxHeight': '150px' }}
                          >
                          </Image>
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
  const { templates, indexes, difficulties } = useTemplatesLibrary(additionalMenu)
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

  const path = window.location.origin
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
      {Object.entries(indexes).map(([theme, index]) => {
        const ordered_ids = difficulties
          .flatMap(difficulty => (difficulty in index) ? index[difficulty] : [])
        return <Box key={theme} marginTop='0.5rem'>
          <Text
            fontSize='xs'
            fontWeight='bold'
            textTransform='uppercase'
            color='gray.500'
            margin='0 0 0.3rem 0'
          >
            {new_data.t('templates.themes.' + theme)}
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
              <Image
                src={path + '/opensankey/menus/templates_asset/' + templates[id].img_path}
                style={{ 'objectFit': 'contain', 'maxHeight': '90px', 'width': '100%' }}
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
