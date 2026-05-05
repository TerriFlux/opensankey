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

// Standard libs
import React, { useState } from 'react'

// Imported libs
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
  Heading,
  Image,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react'

import { ExempleMenuTypes } from '../welcome/MenuExamples'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { CONVERTER_CONFIGS } from '../dialogs/PersistenceProcessDialogConfigs'


// COMPONENTS ===========================================================================

/**
 * Create modal to display tutorials files
 *
 * @param {*} {
 *   new_data,
 *   show_tuto,
 *   set_show_tuto,
 * }
 * @return {*}
 */

export const ModalTuto = ({
  new_data, show_tuto, set_show_tuto,
}: {
  new_data: Class_ApplicationData
  show_tuto: boolean
  set_show_tuto: (b: boolean) => void
}) => {
  const [firstRender, setFirstRender] = useState(true)
  const [formation, setFormation] = useState<ExempleMenuTypes>({})
  const { t } = new_data

  // At first render init formation object with data from server
  if (firstRender) {
    const fetchData = {
      method: 'POST'
    }
    const path = window.location.origin
    const url = path + '/opensankey/menus/tutorials'
    fetch(url, fetchData)
      .then(response => {
        response
          .text()
          .then(text => {
            const json_data = JSON.parse(text)
            setFormation(json_data)
            setFirstRender(false)
          })
          .catch((error) => {
            console.error('Error in fetchExamples - ' + error.toString())
            setFirstRender(false)
          })
      })
  }

  // Pré-traitement du menu tuto pour trier les groupes
  const n_a = new Array(50)

  Object.keys(formation).map(d => {
    return d.replace('_', '__').split('__')
  }).forEach(element => {
    if (element.length > 1) {
      n_a[Number(element[0])] = element[0] + '_' + element[1]
    } else {
      n_a[n_a.length - 1] = element[0]
    }
  })

  // Return l'objet formation mais trier selon le numéro du groupe (quand il y en a un)
  const new_array_for_exemple = Object.fromEntries(n_a.filter(f => f).map((d) => {
    return [d, (formation)[d]]
  }))

  const tuto_sub_nav: { [s: string]: JSX.Element } = {}

  Object.entries(new_array_for_exemple).forEach(d => {
    if ((d[1] as { ['Files']: string[] })['Files'] == undefined) {
      return <></>
    }
    tuto_sub_nav[d[0]] = <>
      {(d[1] as { ['Files']: string[] })['Files'].filter((f: string) => !f.includes('.xlsx')).map((dd: string, idx: number) => {
        return <Card
          key={dd + '-' + idx}
          variant='cards_template'
        >
          <CardHeader>
            <Heading variant='heading_template_sankey'>
              {dd.replace('.json.gz', '').replace('.json', '').replaceAll('_', ' ')}
            </Heading>
            <Divider />
          </CardHeader>
          <CardBody>
            <Image
              className='img-card'
              src={'/fm/userfiles/Formations/Tutoriels/' + (d[0]) + '/images/' + (dd.replace('.json.gz', '').replace('.json', '')) + '.png'}
              style={{ 'objectFit': 'contain', 'maxHeight': '150px' }} />
          </CardBody>
          <CardFooter
            justifyItems='center'
            width='100%'
          >
            <ButtonGroup
              style={{
                width: '100%'
              }}
            >
              {/* Button to open directly the JSON file */}
              <Button variant='toolbar_button_6'
                fontSize='1rem'
                onClick={() => {
                  const file_name = 'Formations/Tutoriels/' + (d[0]) + '/' + dd
                  new_data.menu_configuration.ref_universal_converter_set_config.current(
                    CONVERTER_CONFIGS['load_example_json'], file_name, true
                  )
                  new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_file_converter.current(true)
                  set_show_tuto(false)
                }}
              >{t('useTutoJSON')}</Button>

              {/* Button to open the Excel file */}
              {(d[1] as { ['Files']: string[] })['Files'].includes(dd.replace('.json.gz', '.xlsx').replace('.json', '.xlsx')) ?
                <Button
                  variant='toolbar_button_6'
                  fontSize='1rem'
                  onClick={() => {
                    const file_name = 'Formations/Tutoriels/' + (d[0]) + '/' + dd.replace('.json.gz', '.xlsx').replace('.json', '.xlsx')
                    new_data.menu_configuration.ref_universal_converter_set_config.current(
                      CONVERTER_CONFIGS['load_example_json'], file_name, true
                    )
                    new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_file_converter.current(true)
                    set_show_tuto(false)
                  }}
                >
                  {t('useTutoExcel')}
                </Button>
                : <></>}

              {/* Button to open the Excel file reconcilied */}
              {(d[1] as { ['Files']: string[] })['Files'].includes(dd.replace('.json.gz', '_reconciled.xlsx').replace('.json', '_reconciled.xlsx')) ?
                <Button
                  variant='toolbar_button_6'
                  fontSize='1rem'
                  onClick={() => {
                    const file_name = 'Formations/' + (d[0]) + '/' + dd.replace('.json.gz', '_reconciled.xlsx').replace('.json', '_reconciled.xlsx')
                    new_data.menu_configuration.ref_universal_converter_set_config.current(
                      CONVERTER_CONFIGS['load_example_excel'], file_name, true
                    )
                    new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_file_converter.current(true)
                    set_show_tuto(false)
                  }}
                >
                  {t('useTutoExcel')}
                </Button>
                : <></>}

            </ButtonGroup>
          </CardFooter>
        </Card>
      })}
    </>
  })

  return <Modal
    id='modal_tutoriel'
    blockScrollOnMount={false}
    isOpen={show_tuto}
    onClose={() => set_show_tuto(false)}
  >
    <ModalContent
      maxWidth='inherit'
      display='flex'
    >
      <ModalHeader>{t('Menu.formation')}</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Tabs
          orientation='vertical'
          align='start'
          variant='tabs_variant_template'
          height='100%'
        >
          <TabList>
            {Object.keys(tuto_sub_nav).map((m, idx) => {
              return <Tab key={'tab_' + idx}>
                {(m.split('_').length > 1) ? m.split('_').filter(s => isNaN(+s)).join(' ') : m}
              </Tab>
            })}
          </TabList>
          <TabPanels>
            {Object.keys(tuto_sub_nav).map((m, idx) => {
              return <TabPanel key={'tabpane_' + idx}>
                <Box
                  display="block"
                  overflow='scroll'
                  height='100%'
                >
                  <Box
                    layerStyle='options_3cols'
                    gridColumnGap='0.5rem'
                    gridRowGap='0.5rem'
                  >
                    {tuto_sub_nav[m]}
                  </Box>
                </Box>
              </TabPanel>
            })}
          </TabPanels>
        </Tabs>
      </ModalBody>
    </ModalContent>
  </Modal>
}
