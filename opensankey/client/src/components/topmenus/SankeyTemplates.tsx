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
  ModalBody,
  Badge
} from '@chakra-ui/react'

// Local libs
import { UploadExemple } from '../../Persistence/SankeyPersistence'
import { OSTooltip } from '../configmenus/MenuCommon'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Type_AdditionalMenus } from '../../types/MenuConfig'

// CONSTANTS

const svg_flags: { [_: string]: React.JSX.Element } = {
  'fr': <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" transform="translate(0, 0) scale(0.75)"><path fill="#fff" d="M10 4H22V28H10z"></path><path d="M5,4h6V28H5c-2.208,0-4-1.792-4-4V8c0-2.208,1.792-4,4-4Z" fill="#092050"></path><path d="M25,4h6V28h-6c-2.208,0-4-1.792-4-4V8c0-2.208,1.792-4,4-4Z" transform="rotate(180 26 16)" fill="#be2a2c"></path><path d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z" opacity=".15"></path><path d="M27,5H5c-1.657,0-3,1.343-3,3v1c0-1.657,1.343-3,3-3H27c1.657,0,3,1.343,3,3v-1c0-1.657-1.343-3-3-3Z" fill="#fff" opacity=".2"></path></svg>,
  'en': <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" transform="translate(0, 0) scale(0.75)"><rect x="1" y="4" width="30" height="24" rx="4" ry="4" fill="#071b65"></rect><path d="M5.101,4h-.101c-1.981,0-3.615,1.444-3.933,3.334L26.899,28h.101c1.981,0,3.615-1.444,3.933-3.334L5.101,4Z" fill="#fff"></path><path d="M22.25,19h-2.5l9.934,7.947c.387-.353,.704-.777,.929-1.257l-8.363-6.691Z" fill="#b92932"></path><path d="M1.387,6.309l8.363,6.691h2.5L2.316,5.053c-.387,.353-.704,.777-.929,1.257Z" fill="#b92932"></path><path d="M5,28h.101L30.933,7.334c-.318-1.891-1.952-3.334-3.933-3.334h-.101L1.067,24.666c.318,1.891,1.952,3.334,3.933,3.334Z" fill="#fff"></path><rect x="13" y="4" width="6" height="24" fill="#fff"></rect><rect x="1" y="13" width="30" height="6" fill="#fff"></rect><rect x="14" y="4" width="4" height="24" fill="#b92932"></rect><rect x="14" y="1" width="4" height="30" transform="translate(32) rotate(90)" fill="#b92932"></rect><path d="M28.222,4.21l-9.222,7.376v1.414h.75l9.943-7.94c-.419-.384-.918-.671-1.471-.85Z" fill="#b92932"></path><path d="M2.328,26.957c.414,.374,.904,.656,1.447,.832l9.225-7.38v-1.408h-.75L2.328,26.957Z" fill="#b92932"></path><path d="M27,4H5c-2.209,0-4,1.791-4,4V24c0,2.209,1.791,4,4,4H27c2.209,0,4-1.791,4-4V8c0-2.209-1.791-4-4-4Zm3,20c0,1.654-1.346,3-3,3H5c-1.654,0-3-1.346-3-3V8c0-1.654,1.346-3,3-3H27c1.654,0,3,1.346,3,3V24Z" opacity=".15"></path><path d="M27,5H5c-1.657,0-3,1.343-3,3v1c0-1.657,1.343-3,3-3H27c1.657,0,3,1.343,3,3v-1c0-1.657-1.343-3-3-3Z" fill="#fff" opacity=".2"></path></svg>
}

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
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')

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
              setSelectedDifficulty(json_data['difficulties'][0])
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
            onClick={() => {
              if (!indexes[theme][selectedDifficulty]) {
                // Back to basic diffuclty if no template for given them & difficulty
                // -> Avoid having blank templates page
                setSelectedDifficulty(difficulties[0])
              }
            }}
          >
            {new_data.t('templates.themes.' + theme)}
          </Tab>
        })}
    </TabList>
    <TabPanels>
      {Object.values(indexes)
        .map((index, idx) => {

          return <TabPanel key={idx}>
            <Box
              display='grid'
              gridAutoFlow='row'
              gridRowGap='1rem'
              height='100%'
            >
              <Box
                display='grid'
                gridAutoFlow='column'
                gridTemplateColumns='1fr 2fr'
                gridColumnGap='1rem'
                height='100%'
              >
                <Button
                  variant='template_button_reset'
                  onClick={() => {
                    new_data.reinitialization()
                    set_show_template(false)
                  }}
                >
                  {new_data.t('Menu.from_new')}
                </Button>
                <ButtonGroup>
                  {difficulties
                    .map((difficulty,idx) => {
                      return <Button
                        key={'difficulty_'+idx}
                        variant='menuconfigpanel_option_button_secondary'
                        size='sizeButtonDialog'
                        isActive={difficulty == selectedDifficulty}
                        isDisabled={!(difficulty in index)}
                        onClick={() => setSelectedDifficulty(difficulty)}
                      >
                        {new_data.t('templates.difficulties.' + difficulty)}
                      </Button>
                    })}
                </ButtonGroup>
              </Box>
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
                  {(selectedDifficulty in index) ?
                    Object.values(index[selectedDifficulty])
                      .map((id, idx) => {
                        return <Card
                          key={idx}
                          variant='cards_template'
                          onClick={() => {
                            // Draw template by downloading data from server
                            // Reset navigator data without redrawing sankey (UploadExemple will do it after downloading data from server)
                            new_data.reinitialization(false)
                            UploadExemple(templates[id].file_path, new_data)
                            set_show_template(false)
                          }}
                        >
                          <CardHeader>
                            <Heading variant='heading_template_sankey'>
                              {new_data.t('templates.ids.' + id)}
                            </Heading>
                            <Divider />
                          </CardHeader>

                          <CardBody>
                            {/* Get the image from the server */}
                            {
                              selectedDifficulty !== difficulties[0] ?
                                <Badge
                                  variant='badge_on_template_img'
                                  right='0'
                                  marginTop='-0.5rem'
                                  marginRight='1rem'
                                >
                                  {new_data.t('templates.need_osp')}
                                </Badge> : <></>
                            }
                            <OSTooltip
                              label={new_data.t('templates.' + templates[id].lang)}
                            >
                              <Badge
                                variant='badge_on_template_img'
                                backgroundColor='none'
                                padding='0'
                                marginTop='0'
                                marginLeft='-0.5rem'
                              >
                                {svg_flags[templates[id].lang]}
                              </Badge>
                            </OSTooltip>
                            <Image
                              className='img-card'
                              src={'/fm/userfiles/' + templates[id].img_path}
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
                                  UploadExemple(templates[id].file_path, new_data)
                                  new_data.menu_configuration.ref_menu_opened.current[1](true)
                                  set_show_template(false)
                                }}>
                                {new_data.t('useTemplate')}
                              </Button>

                            </ButtonGroup>
                          </CardFooter>
                        </Card>
                      })
                    :
                    <></>}

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
