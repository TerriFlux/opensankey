
import * as d3 from 'd3'
import React, { FunctionComponent, useState, useRef, ChangeEvent } from 'react'
import { FaPlus } from 'react-icons/fa'
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

import type { FCType_ModalSelectionIconsOSP } from '../../ftypes/SankeyPlusApplication'

import SankeyListIcons from '../../icons/lib_of_icons.json'

type KeysOfIcon = keyof typeof SankeyListIcons

export const ModalSelectionIconsOSP: FunctionComponent<FCType_ModalSelectionIconsOSP> = (
  { new_data_plus }
) => {
  const list_nodes_selected = new_data_plus.drawing_area.selected_nodes_list
  const { t } = new_data_plus
  const imported_icon = localStorage.getItem('icon_imported')
  const init_imported_svg: { [s: string]: { path: string, Vb: string } } = imported_icon != null && imported_icon !== '' ? JSON.parse(imported_icon) : {}
  const [filter_name, set_filter_name] = useState('')
  const _load_svg = useRef<HTMLInputElement>(null)
  const import_svg = useRef<{ [s: string]: { path: string, Vb: string } }>(init_imported_svg)
  const [s_show_modal, sShowModal] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)

  new_data_plus.menu_configuration.dict_setter_show_dialog_plus.ref_setter_show_modal_import_icons.current = sShowModal


  const isAllIconVisible = () => {
    let selected_icon = list_nodes_selected.length > 0 ? list_nodes_selected[0].iconName : ''

    list_nodes_selected.map(d => selected_icon = (d.iconName === selected_icon) ? selected_icon : '')
    return selected_icon
  }
  const allSelectedNodeHasSameicon = isAllIconVisible()

  list_nodes_selected.length > 0 ? list_nodes_selected[0].iconName : 'None'

  // Functions we can undo ====================================================

  const updateNodeIcon = (iconName: string) => {
    const dict_old_value: { [x: string]: [name: string, color: string, viewBox: string | undefined] } = {}
    list_nodes_selected.forEach(n => {
      dict_old_value[n.id] = [n.iconName, n.iconColor, n.iconViewBox]
    })
    const _updateNodeIcon = () => {
      list_nodes_selected.forEach(n => {
        n.iconName = iconName
        if (!n.iconColor) n.iconColor = '#000000'
        delete n.iconViewBox
        n.draw()
      })
      setForceUpdate(!forceUpdate)
    }

    const inv_updateNodeIcon = () => {
      list_nodes_selected.forEach(n => {
        n.iconName = dict_old_value[n.id][0]
        n.iconColor = dict_old_value[n.id][1]
        n.iconViewBox = dict_old_value[n.id][2]
        n.draw()
      })
      setForceUpdate(!forceUpdate)
    }
    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateNodeIcon)
    new_data_plus.history.saveRedo(_updateNodeIcon)
    // Execute original attr mutation
    _updateNodeIcon()
  }

  const updateNodeIconImported = (ki: string) => {
    const dict_old_value: { [x: string]: [name: string, color: string, viewBox: string | undefined] } = {}
    list_nodes_selected.forEach(n => {
      dict_old_value[n.id] = [n.iconName, n.iconColor, n.iconViewBox]
    })
    const _updateNodeIconImported = () => {
      list_nodes_selected.forEach(n => {
        n.iconName = 'icon_imported_' + ki
        n.iconViewBox = import_svg.current[ki].Vb
        n.iconColor = '#000000'
        n.draw()
      })
      setForceUpdate(!forceUpdate)
    }

    const inv_updateNodeIconImported = () => {
      list_nodes_selected.forEach(n => {
        n.iconName = dict_old_value[n.id][0]
        n.iconColor = dict_old_value[n.id][1]
        n.iconViewBox = dict_old_value[n.id][2]
        n.draw()
      })
      setForceUpdate(!forceUpdate)
    }
    // Save undo/redo in data history
    new_data_plus.history.saveUndo(inv_updateNodeIconImported)
    new_data_plus.history.saveRedo(_updateNodeIconImported)
    // Execute original attr mutation
    _updateNodeIconImported()
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
          variant={allSelectedNodeHasSameicon === NameIcon ? 'card_icon_selected' : 'card_icon_not_selected'}
          onClick={() => {
            new_data_plus.drawing_area.sankey.icon_catalog[NameIcon] = icon[1]
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
      <FaPlus style={{ width: '5em', height: '5em' }} />
    </CardBody>
  </Card>

  // List of all imported svg icon
  // WARNING : Those icon disappear whe nwe reload the application (but the icon are still present in the catalog), so
  const card_imported = Object.keys(import_svg.current).sort(([a,], [b,]) => (a > b) ? 1 : ((b > a) ? -1 : 0)).map((ki, i) => {
    return <Card
      key={'card_icon_' + i}
      variant={allSelectedNodeHasSameicon === 'icon_imported_' + ki ? 'card_icon_selected' : 'card_icon_not_selected'}
      onClick={() => {
        new_data_plus.drawing_area.sankey.icon_catalog['icon_imported_' + ki] = import_svg.current[ki].path
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

export default ModalSelectionIconsOSP