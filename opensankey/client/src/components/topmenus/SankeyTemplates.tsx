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

import React, { useState, MutableRefObject } from 'react'
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
  ModalBody
} from '@chakra-ui/react'

import { Class_ApplicationData } from '../../types/ApplicationData'
import { Type_AdditionalMenus } from '../../types/MenuConfig'
import { CONVERTER_CONFIGS } from '../dialogs/PersistenceProcessDialogConfigs'

// COMPONENTS ===========================================================================

export declare const window: Window & typeof globalThis

/**
 * Modal containing templates to create sankey
 *
 * @param {*} { new_data, additionalMenu, Reinitialization }
 * @return {*}
 */
export const ModalTemplate = ({ new_data, additionalMenu }:{
  new_data: Class_ApplicationData
  additionalMenu: MutableRefObject<Type_AdditionalMenus>
}) => {

  type Type_TemplateInfos = {
    'title'?: { [lang: string]: string };
    'file_path': string;
    'img_path': string;
    'lang': string;
    'themes': string[];
    'difficulty': string;
  };
  type Type_TemplatesInfos = { [id: string]: Type_TemplateInfos; };
  type Type_TemplateIndex = { [difficulty: string]: string[]; };
  type Type_TemplatesIndexes = { [theme: string]: Type_TemplateIndex; };

  const [show_template, set_show_template] = useState(false)
  const [firstRender, setFirstRender] = useState(true)
  const [templates, setTemplates] = useState<Type_TemplatesInfos>({})
  const [indexes, setIndexes] = useState<Type_TemplatesIndexes>({})
  const [, setThemes] = useState<string[]>([])
  const [difficulties, setDifficulties] = useState<string[]>([])

  const { ref_setter_show_modal_templates_lib } = new_data.menu_configuration.dict_setter_show_dialog
  ref_setter_show_modal_templates_lib.current = set_show_template


  const path = window.location.origin
  const url = path + '/opensankey/menus/templates'

  // On first render fetch template then re-render to have component with template
  if (firstRender) {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ module: additionalMenu.current.template_module_key })
    })
      .then(response => {
        response
          .text()
          .then(text => {
            const json_data = JSON.parse(text)
            const new_indexes: Type_TemplatesIndexes = {}
            if ('themes' in json_data) {
              setThemes(json_data['themes'])
            }
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
            setFirstRender(false)
          })
          .catch((error) => {
            console.error('Error in fetchExamples - ' + error.toString())
            setFirstRender(false)
          })
      })
      .catch((err) => {
        console.error('Error in fetch templates - ' + err.toString())
      })
  }

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
                          // Draw template by downloading data from server
                          // Reset navigator data without redrawing sankey (UploadExemple will do it after downloading data from server)
                          new_data.reinitialization(false)
                            
                          //UploadExemple(templates[id].file_path, new_data)
                          set_show_template(false)
                        }}
                      >
                        <CardHeader>
                          <Heading variant='heading_template_sankey'>
                            {templates[id].title?.[new_data.i18n.language]
                              ?? templates[id].title?.['en']
                              ?? id}
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
                                // Draw template by downloading data from server
                                //UploadExemple(templates[id].file_path, new_data)
                                new_data.menu_configuration.ref_universal_converter_set_config.current(
                                  CONVERTER_CONFIGS['load_example_json'], templates[id].file_path, true
                                )
                                new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_file_converter.current(true)
                                //new_data.menu_configuration.ref_menu_opened.current[1](true)
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
