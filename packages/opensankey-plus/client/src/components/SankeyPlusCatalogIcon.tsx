
import * as d3 from 'open-sankey/src/d3Modules'
import React, { useState, useRef, ChangeEvent } from 'react'
import {
  Box,
  Card,
  CardBody,
  Divider,
  Heading,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs
} from '@chakra-ui/react'

import SankeyListIcons from '../icons/lib_of_icons.json'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'
import { Class_NodeBase } from 'open-sankey/src/Elements/NodeBase'
import { Class_LinkElement } from 'open-sankey/src/Elements/Link'
import { getElementsLabelValues, BASE_LABEL_CONFIG, isConfigValueIndeterminate } from 'open-sankey/src/Elements/ElementsAttributesConfig'

type KeysOfIcon = keyof typeof SankeyListIcons

export const ModalSelectionIcon = (
  { app_data }: { app_data: Class_ApplicationDataOSP }
) => {
  //const list_nodes_selected = [...app_data.drawing_area.selected_nodes_list,...app_data.drawing_area.selected_links_list]
  const { t } = app_data
  const imported_icon = localStorage.getItem('icon_imported')
  const init_imported_svg: { [s: string]: { path: string, Vb: string } } = imported_icon != null && imported_icon !== '' ? JSON.parse(imported_icon) : {}
  const [filter_name, set_filter_name] = useState('')
  const _load_svg = useRef<HTMLInputElement>(null)
  const import_svg = useRef<{ [s: string]: { path: string, Vb: string } }>(init_imported_svg)
  const [s_show_modal, sShowModal] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)

  app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_import_icons.current = sShowModal
  const [elements, setElements] = useState<Class_NodeBase[] | Class_LinkElement[]>([])
  const [prefix, setPrefix] = useState<'name_label' | 'value_label' | 'icon'>('name_label')

  app_data.menu_configuration.icon_selector_set_elements.current = (
    _elements: Class_NodeBase[] | Class_LinkElement[],
    _prefix: 'name_label' | 'value_label' | 'icon'
  ) => {
    setElements(_elements)
    setPrefix(_prefix)
  }

  const labelValues = elements.length > 0
    ? getElementsLabelValues(elements, prefix, () => setForceUpdate(!forceUpdate))
    : Object.fromEntries(
      Object.entries(BASE_LABEL_CONFIG).map(([key, value]) => [key, value.default])
    ) as { -readonly [K in keyof typeof BASE_LABEL_CONFIG]: ReturnType<typeof BASE_LABEL_CONFIG[K]['type']> }

  const updateNodeIcon = (iconName: string) => {
    labelValues.icon_name = iconName
    if (!labelValues.color) labelValues.color = '#000000'
    delete labelValues.view_box
  }

  const updateNodeIconImported = (ki: string) => {
    labelValues.icon_name = 'icon_imported_' + ki
    labelValues.view_box = import_svg.current[ki].Vb
    labelValues.color = '#000000'
  }

  // Create object containing list of card elements regrouped by the icon themes
  const tuto_sub_nav: { [s: string]: JSX.Element } = {}
  {
    Object.keys(SankeyListIcons).map((cki) => {
      const ki = cki as KeysOfIcon

      tuto_sub_nav[ki] = <>{Object.entries(SankeyListIcons[ki]).filter(ic => {
        return filter_name === '' ? true : t(ki + '.' + ic[0]).includes(filter_name)
      }).sort(([a,], [b,]) => (t(ki + '.' + a) > t(ki + '.' + b)) ? 1 : ((t(ki + '.' + b) > t(ki + '.' + a)) ? -1 : 0)).map((icon, i) => {
        // icon[0]:Name of the icon
        // icon[1]:Path of the icon
        const NameIcon = ki + '_' + icon[0]

        return <Card
          key={'card_' + icon[0] + '_' + i}
          variant={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'icon_name', prefix) ? 'card_icon_selected' : 'card_icon_not_selected'}
          onClick={() => {
            app_data.drawing_area.sankey.icon_catalog[NameIcon] = icon[1]
            updateNodeIcon(NameIcon)
            sShowModal(false)
          }}
        >
          <CardBody>
            <Heading>{t(ki + '.' + icon[0])}</Heading>
            <Divider />
            <svg viewBox='0 0 1000 1000' width={50} height={50}><g><path fill='black' d={icon[1]}></path></g></svg>
          </CardBody>
        </Card>
      })}</>
    })
  }


  // File reader that can process multiple files
  // If the svg contains multiple path, we concat all of them into one big path
  // The icon name is the file name
  const file_import = <Input
    accept='.svg'
    type="file"
    multiple
    ref={_load_svg}
    style={{ display: 'none' }}
    onChange={(evt: ChangeEvent) => {
      const files = (evt.target as HTMLFormElement).files
      for (const i in files) {
        const reader = new FileReader()
        reader.onload = (() => {
          return (e: ProgressEvent<FileReader>) => {
            const result = String((e.target as FileReader).result)
            const placeholder = document.createElement('div')
            placeholder.innerHTML = result
            const path = d3.select(placeholder).selectAll('path')
            const attr_d = path.nodes().map(path_to_concat =>
              d3.select(path_to_concat).attr('d')
            ).join(' ')
            import_svg.current[(files[i].name).replace('.svg', '')] = {
              path: attr_d,
              Vb: d3.select(placeholder).select('svg').attr('viewBox')
            }
            setForceUpdate(!forceUpdate)

          }
        })()
        if (Number(i) === files.length - 1) {
          reader.onloadend = (() => {
            return () => {
              // import_svg.current=import_svg
              localStorage.setItem('icon_imported', JSON.stringify(import_svg.current))
            }
          })()
        }
        // Permet d'executer la transformation des blob en vues tout en evitant la var length
        //   files : {0:Blob,1:Blob,2:...,n:Blob, length:n-1}
        if (!isNaN(+i)) {
          reader.readAsText(files[i])
        }
      }

    }}
  />

  // Card used as a button to open a filereader and import a svg
  const card_add_svg = <Card variant='card_import_icon'
    onClick={() => {
      if (_load_svg.current) {
        _load_svg.current.name = ''
        _load_svg.current.click()
      }
    }}
  >
    <CardBody>

      <Heading>{t('Import')}</Heading>
      <Divider />
    </CardBody>
  </Card>

  // List of all imported svg icon
  // WARNING : Those icon disappear whe nwe reload the application (but the icon are still present in the catalog), so
  const card_imported = Object.keys(import_svg.current).sort(([a,], [b,]) => (a > b) ? 1 : ((b > a) ? -1 : 0)).map((ki, i) => {
    return <Card
      key={'card_icon_' + i}
      variant={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'icon_name', prefix) ? 'card_icon_selected' : 'card_icon_not_selected'}
      onClick={() => {
        app_data.drawing_area.sankey.icon_catalog['icon_imported_' + ki] = import_svg.current[ki].path
        updateNodeIconImported(ki)
        sShowModal(false)
      }}
    >
      <CardBody>
        <Heading>{ki}</Heading>
        <Divider />
        <svg viewBox={import_svg.current[ki].Vb} width={50} height={50}><g><path fill='black' d={import_svg.current[ki].path}></path></g></svg>
      </CardBody>
    </Card>

  })

  tuto_sub_nav['import'] = <>
    {card_imported}
    {card_add_svg}
  </>


  return <><Modal isOpen={s_show_modal} onClose={() => sShowModal(false)}>
    <ModalContent
      maxWidth='inherit'
    >
      <ModalHeader>{t(('Menu.import_icon'))}</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <Tabs
          orientation='vertical'
          align='start'
          variant='tabs_variant_template'
          height='100%'
        >
          <TabList>
            {
              Object.keys(tuto_sub_nav).map((m, i) => {
                return <Tab key={'tab_icon_catalog_' + i}> {t(m + '.' + m)}</Tab>
              })
            }
          </TabList>
          <TabPanels>
            {Object.keys(tuto_sub_nav).map((modale_sub_icon, i) => {

              return <TabPanel key={'panel_icon_catalog_' + i}>
                <Box
                  display='grid'
                  gridAutoFlow='row'
                  gridRowGap='1rem'
                  height='100%'
                >
                  {
                    modale_sub_icon !== 'import' ?
                      <Box
                        as='span'
                        layerStyle='menuconfigpanel_row_2cols'
                      >
                        <Box
                          layerStyle='menuconfigpanel_option_name'
                        >
                          {t('Menu.filter_by_name')}
                        </Box>
                        <Input
                          placeholder='start typing to filter displayed icon'
                          variant='menuconfigpanel_option_input'
                          value={filter_name}
                          onChange={evt => set_filter_name(evt.target.value)}
                        />
                      </Box> :
                      <></>
                  }
                  <Box
                    display="block"
                    overflow='scroll'
                    height='100%'
                  >
                    <Box
                      layerStyle='options_cards'
                    >
                      {tuto_sub_nav[modale_sub_icon]}
                    </Box>
                  </Box>
                </Box>
              </TabPanel>
            })}

          </TabPanels>
        </Tabs>

      </ModalBody>
    </ModalContent>
  </Modal>
  {file_import}
  </>
}

export default ModalSelectionIcon