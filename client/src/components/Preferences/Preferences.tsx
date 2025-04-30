import React, { useState, useRef, CSSProperties, Fragment, FunctionComponent, MutableRefObject, ChangeEvent } from 'react'
import { Box, TabList, TabPanels, TabPanel, Select, Editable, EditablePreview, EditableInput, Tabs, Text, Button, Tab, ModalCloseButton, ModalContent, ModalOverlay, ModalHeader, ModalBody, Modal, Card, CardBody, Divider, CardHeader, Input, CardFooter } from '@chakra-ui/react'
import { SketchPicker } from 'react-color'
import { FaMinus, FaPlus } from 'react-icons/fa'
import * as d3 from 'd3'
import { SankeySettingsEditionElementTags } from '../../deps/OpenSankey+/components/MenuConfigEdition/SankeyPlusMenuConfigurationTags'
import { WrapperBoxSubSectionMenu } from '../../deps/OpenSankey+/deps/OpenSankey/components/configmenus/SankeyMenuComponents'
import { getJSONFromJSON, OSTooltip, Type_MacroTagGroup } from '../../deps/OpenSankey+/deps/OpenSankey/types/Utils'
import { FCType_ModalPreference } from '../../ModulesSA'
import { Class_ApplicationDataSA } from '../../types/ApplicationDataSA'
import { Class_DataTagGroup, Class_FluxTagGroup, Class_NodeTagGroup } from '../../deps/OpenSankey+/deps/OpenSankey/types/Tag'
import { MenuConfigurationNodeContext, MenuConfigurationNodeStyle } from '../../deps/OpenSankey+/deps/OpenSankey/components/configmenus/SankeyMenuConfigurationNodesAttributes'
import { Type_AdditionalMenus } from '../../deps/OpenSankey+/deps/OpenSankey/types/Types'
import { WrapperLinkStyleSelector, WrapperNodeStyleSelector } from '../../deps/OpenSankey+/deps/OpenSankey/components/dialogs/SankeyStyle'
import { Class_NodeStyle } from '../../deps/OpenSankey+/deps/OpenSankey/Elements/NodeAttributes'
import { Class_LinkStyle } from '../../deps/OpenSankey+/deps/OpenSankey/Elements/LinkAttributes'
import { MenuConfigurationLinkContext, MenuConfigurationLinksStyle } from '../../deps/OpenSankey+/deps/OpenSankey/components/configmenus/SankeyMenuConfigurationLinksAppearence'
import { TFunction } from 'i18next'

const paddingBoxPreference = '0.6rem'
// COMPONENTS ===========================================================================

export const ModalPreference: FunctionComponent<FCType_ModalPreference> = (
  {
    new_data,
    additionalMenus
  }
) => {
  // Component updater ------------------------------------------------------------------
  const [, setUpdate] = useState(0)
  const [show_preference, setShowPreference] = useState(false)
  const [openingRender, setOpeningRender] = useState(true)
  new_data.menu_configuration.ref_to_modal_pref_updater.current = () => {
    setUpdate(a => a + 1)
  }

  const ghost_data = useRef<Class_ApplicationDataSA>(new Class_ApplicationDataSA(true))
  const list_palette: MutableRefObject<{ name: string, colors: string[] }[]> = useRef([])

  // user_data -------------------------------------------------------------------------------
  const { t, menu_configuration, url_prefix } = new_data
  const { ref_setter_show_modal_preference } = menu_configuration.dict_setter_show_dialog
  ref_setter_show_modal_preference.current = setShowPreference

  /**
   * Function to fetch user preference from server & update data
   *
   */
  const init_user_data = () => {
    const path = window.location.origin
    const url = path + '/user/get_preference'
    const fetchData = {
      method: 'POST',
    }
    fetch(url, fetchData).then(response => {
      response.text()
        .then(text => {
          const json_dump = JSON.parse(text)
          const formated_json = {
            version: '0.9',
            nodeTags: getJSONFromJSON(json_dump, 'node_taggs', {}),
            fluxTags: getJSONFromJSON(json_dump, 'flow_taggs', {}),
            dataTags: getJSONFromJSON(json_dump, 'data_taggs', {}),
            style_node: getJSONFromJSON(json_dump, 'style_node', {}),
            style_link: getJSONFromJSON(json_dump, 'style_link', {}),
            icon_catalog: getJSONFromJSON(json_dump, 'icon_catalog', {}),
            nodes: {},
            links: {},
          }

          ghost_data.current.drawing_area.sankey.fromJSON(formated_json, true)
          if (json_dump['palette']) {
            list_palette.current = json_dump['palette']
          }
          ghost_data.current.user_preferences.color = list_palette.current


        }).then(() => {
          setOpeningRender(false)
        })
    })
  }

  if (openingRender && show_preference) {
    init_user_data()
  }


  // JSX Component ----------------------------------------------------------------------

  const content_panel_color = <Box layerStyle='menuconfigpanel_grid'>
    <WrapperBoxSubSectionMenu new_data={new_data} title={t('Menu.preference_content.color_head')}>
      <Box padding={paddingBoxPreference}>
        <Text>{t('Menu.preference_content.color_item_1')}</Text>
        <Text>{t('Menu.preference_content.color_item_2')}</Text>
        <Text>{t('Menu.preference_content.color_item_3')}</Text>
        <Text>{t('Menu.preference_content.color_item_4')}</Text>
      </Box>
    </WrapperBoxSubSectionMenu>
    {list_palette.current.map((el, idx) => {
      return <Fragment key={'palette_' + idx}><PaletteCreator data_palette={el} t={t} deletePalette={() => {
        list_palette.current.splice(idx, 1)
        setUpdate(a => a + 1)
      }} /></Fragment>
    })}
    <Button variant='btn_create_color_palette'
      onClick={() => {
        list_palette.current.push({ name: 'Palette', colors: ['#000000'] })
        setUpdate(a => a + 1)
      }}>
      <FaPlus />
    </Button>
  </Box>

  const content = <Tabs isFitted variant='tabs_variant_preference' >
    <TabList >
      <Tab key={'pref_color'}>{t('Menu.preference_content.color')}</Tab>
      <Tab key={'pref_tag'}>{t('Menu.preference_content.tag')}</Tab>
      <Tab key={'pref_style'}>{t('Menu.preference_content.style')}</Tab>
      <Tab key={'pref_icon'}>{t('Menu.preference_content.icon')}</Tab>
    </TabList>
    <TabPanels>
      <TabPanel key={'pref_color'}>
        {content_panel_color}
      </TabPanel>
      <TabPanel key={'pref_tag'}>
        <TabsUserTags user_data={ghost_data.current} app_data={new_data} />
      </TabPanel>
      <TabPanel key={'pref_style'}>
        <TabUserStyle user_data={ghost_data.current} app_data={new_data} additionalMenus={additionalMenus} />
      </TabPanel>
      <TabPanel key={'pref_icon'}>
        <TabUserIcon user_data={ghost_data.current} app_data={new_data} />
      </TabPanel>
    </TabPanels>
  </Tabs>

  return <Modal
    isOpen={show_preference}
    onClose={() => {
      setShowPreference(false)
      setOpeningRender(true)
      const path = window.location.origin
      const url = path + '/user/set_preference'
      const sankey_user = ghost_data.current.drawing_area.sankey.toJSON()
      const user_pref = {
        palette: list_palette.current,
        icon_catalog: ghost_data.current.drawing_area.sankey.icon_catalog,
        node_taggs: sankey_user.nodeTags,
        flow_taggs: sankey_user.fluxTags,
        data_taggs: sankey_user.dataTags,
        style_node: sankey_user.style_node,
        style_link: sankey_user.style_link,
      }

      //Update palette color user
      new_data.user_preferences.color = list_palette.current

      // Update imported icon in catalog to use user icons
      const ls = localStorage.getItem('icon_imported')
      const icon_ls: { [s: string]: { path: string, Vb: string } } = ls != null && ls !== '' ? JSON.parse(ls) : {}
      const cat_parsed = Object.fromEntries(Object.entries(ghost_data.current.drawing_area.sankey.icon_catalog).map(ent => [ent[0], { path: ent[1], Vb: '0 0 1000 1000' }]))
      const icons = { ...icon_ls, ...cat_parsed }
      localStorage.setItem('icon_imported', JSON.stringify(icons))

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(user_pref)

      })
        .then(response => {
          //Nothing to do, we send data to server 
        }).catch((err) => {
          console.error('Error in fetchExamples - ' + err.toString())

        })
    }}
    scrollBehavior='inside'
    variant='modal_user_preference'

  >
    <ModalOverlay />
    <ModalContent
      maxWidth='inherit'
    >
      <ModalHeader>{t('Menu.title_pref')}</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        {content}
      </ModalBody>
    </ModalContent>
  </Modal>
}

/**
 * Tab for menu preference containing components to edit tag group & tags
 *
 * @param {*} { user_data, app_data }
 * @return {*} 
 */
const TabsUserTags: FunctionComponent<{ user_data: Class_ApplicationDataSA, app_data: Class_ApplicationDataSA }> = ({ user_data, app_data }) => {
  const { t, menu_configuration } = user_data
  const { ref_to_menu_config_nodes_selection_updater } = menu_configuration
  // Change ref of updater of node selection (not in use user_data) so SankeySettingsEditionElementTags update this composant and children

  const [, setUpdate] = useState(0)
  ref_to_menu_config_nodes_selection_updater.current = () => setUpdate(a => a + 1)

  return <Box layerStyle='menuconfigpanel_grid'>
    <WrapperBoxSubSectionMenu new_data={user_data} title={t('Menu.preference_content.tag_head')}>
      <Box padding={paddingBoxPreference}>
        <Text>{t('Menu.preference_content.tag_item_1')}</Text>
        <Text>{t('Menu.preference_content.tag_item_2')}</Text>
        <Text>{t('Menu.preference_content.tag_item_3')}</Text>
      </Box>
    </WrapperBoxSubSectionMenu>
    <Tabs isFitted variant='tabs_variant_preference_tags' >
      <TabList>
        <Tab key={'pref_tag_node'}>
          <span>{t('Menu.preference_content.tag_node')}</span>
        </Tab>
        <Tab key={'pref_tag_flow'}>
          <span>{t('Menu.preference_content.tag_flow')}</span>
        </Tab>
        <Tab key={'pref_tag_data'}>
          <span>{t('Menu.preference_content.tag_data')}</span>
        </Tab>
      </TabList>

      <TabPanels>
        <TabPanel><Box layerStyle='menuconfigpanel_grid'><SankeySettingsEditionElementTags new_data={user_data} elementTagNameProp='node_taggs' /> <TansferTags user_data={user_data} app_data={app_data} elementTagNameProp='node_taggs' />  </Box></TabPanel>
        <TabPanel><Box layerStyle='menuconfigpanel_grid'><SankeySettingsEditionElementTags new_data={user_data} elementTagNameProp='flux_taggs' /> <TansferTags user_data={user_data} app_data={app_data} elementTagNameProp='flux_taggs' />  </Box></TabPanel>
        <TabPanel><Box layerStyle='menuconfigpanel_grid'><SankeySettingsEditionElementTags new_data={user_data} elementTagNameProp='data_taggs' /> <TansferTags user_data={user_data} app_data={app_data} elementTagNameProp='data_taggs' />  </Box></TabPanel>
      </TabPanels>
    </Tabs>
  </Box>
}

/**
 * Box to select and transfer grou tags from user preference to application data
 *
 * @param {*} { user_data, app_data, elementTagNameProp }
 * @return {*} 
 */
const TansferTags: FunctionComponent<{ user_data: Class_ApplicationDataSA, app_data: Class_ApplicationDataSA, elementTagNameProp: Type_MacroTagGroup }> = ({ user_data, app_data, elementTagNameProp }) => {
  const { t } = app_data
  const tags_group_dict = user_data.drawing_area.sankey.getTagGroupsAsDict(elementTagNameProp)
  const tags_group_list = user_data.drawing_area.sankey.getTagGroupsAsList(elementTagNameProp)
  const [tags_group_entry_id, setTagsGroupEntryId] = useState(tags_group_list[0]?.id ?? '')
  const [, setCount] = useState(0)

  const updateThis = () => {
    if (tags_group_dict[tags_group_entry_id])
      setCount(a => a + 1)
    else
      setTagsGroupEntryId(user_data.drawing_area.sankey.getTagGroupsAsList(elementTagNameProp)[0]?.id ?? '')
  }

  // Early return if no group
  if (tags_group_list.length == 0)
    return <></>
  else if (!(tags_group_dict[tags_group_entry_id])) // if tag group selected not in user pref tag group then select the first one
    setTagsGroupEntryId(user_data.drawing_area.sankey.getTagGroupsAsList(elementTagNameProp)[0]?.id ?? '')


  return <WrapperBoxSubSectionMenu new_data={user_data} title={t('Menu.preference_content.tag_head_insert')} collapse={false}>
    <>
      <Box display={'flex'}>
        <Text>{t('Menu.preference_content.tag_insert_text')}</Text>
        <Box flex='auto' >
          <Select value={tags_group_entry_id}
            onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
              setTagsGroupEntryId(evt.target.value)
              updateThis()
            }}
          >{
              tags_group_list.map((tg) => {
                return <option key={'user_tag_group_' + tg.id} value={tg.id}>{tg.name}</option>
              })}
          </Select>
        </Box>
      </Box>

      {/* Button to insert user selected group to application data */}
      <Button
        variant='btn_create_color_palette'
        onClick={() => {
          // Insert select group
          const grp_tag = app_data.drawing_area.sankey.createTagGroup(elementTagNameProp);
          (grp_tag as Class_NodeTagGroup | Class_FluxTagGroup | Class_DataTagGroup).copyFrom(tags_group_dict[tags_group_entry_id] as Class_NodeTagGroup | Class_FluxTagGroup | Class_DataTagGroup)
          // Update tags menu in application
          app_data.menu_configuration.updateAllComponentsRelatedToTags()
        }}>
        {t('Menu.preference_content.tag_insert')}
      </Button>
    </>
  </WrapperBoxSubSectionMenu>
}

const TabUserStyle: FunctionComponent<{ user_data: Class_ApplicationDataSA, app_data: Class_ApplicationDataSA, additionalMenus: MutableRefObject<Type_AdditionalMenus> }> = ({ user_data, app_data, additionalMenus }) => {
  const { t } = user_data
  const [, setUpdate] = useState(0)
  user_data.menu_configuration.ref_to_menu_config_nodes_styles_editor_updater.current = () => setUpdate(a => a + 1)
  user_data.menu_configuration.ref_to_menu_config_links_styles_editor_updater.current = () => setUpdate(a => a + 1)

  return <Box layerStyle='menuconfigpanel_grid'>
    <WrapperBoxSubSectionMenu new_data={user_data} title={t('Menu.preference_content.style_head')}>
      <Box padding={paddingBoxPreference}>
        <Text>{t('Menu.preference_content.style_item_1')}</Text>
        <Text>{t('Menu.preference_content.style_item_2')}</Text>
        <Text>{t('Menu.preference_content.style_item_3')}</Text>
      </Box>
    </WrapperBoxSubSectionMenu>

    <Tabs isFitted variant='tabs_variant_preference_style' >
      <TabList>
        <Tab key={'pref_node'}>
          <span>{t('Menu.Config.element_node')}</span>
        </Tab>
        <Tab key={'pref_flow'}>
          <span>{t('Menu.Config.element_flow')}</span>
        </Tab>

      </TabList>

      <TabPanels>
        <TabPanel>
          <Box layerStyle='menuconfigpanel_grid'>
            <WrapperNodeStyleSelector new_data={user_data}><></></WrapperNodeStyleSelector>

            <WrapperBoxSubSectionMenu new_data={user_data} title={t('Menu.preference_content.style_edit_head_node_styles_visual')} collapse={false}>
              <MenuConfigurationNodeStyle
                new_data={user_data}
                menu_for_style={true}
                additional_menus={additionalMenus}
              />
            </WrapperBoxSubSectionMenu>
            <WrapperBoxSubSectionMenu new_data={user_data} title={t('Menu.preference_content.style_edit_head_node_styles_context')} collapse={false}>
              <MenuConfigurationNodeContext
                new_data={user_data}
                menu_for_style={true}
                additional_menus={additionalMenus}
              />
            </WrapperBoxSubSectionMenu>

            <WrapperBoxSubSectionMenu new_data={user_data} title={t('Menu.preference_content.style_insert_head')} collapse={false}>
              <TansferStyle user_data={user_data} app_data={app_data} elementStyleType='_node_styles' />
            </WrapperBoxSubSectionMenu>
          </Box>
        </TabPanel>
        <TabPanel>
          <Box layerStyle='menuconfigpanel_grid'>
            <WrapperLinkStyleSelector new_data={user_data}><></></WrapperLinkStyleSelector>
            <WrapperBoxSubSectionMenu new_data={user_data} title={t('Menu.preference_content.style_edit_head_flow_styles_visual')} collapse={false}>
              <MenuConfigurationLinksStyle
                new_data={user_data}
                additionMenus={additionalMenus}
                menu_for_style={true}
              />
            </WrapperBoxSubSectionMenu>
            <WrapperBoxSubSectionMenu new_data={user_data} title={t('Menu.preference_content.style_edit_head_flow_styles_context')} collapse={false}>
              <MenuConfigurationLinkContext
                new_data={user_data}
                additionMenus={additionalMenus}
                menu_for_style={true}
              />
            </WrapperBoxSubSectionMenu>

            <WrapperBoxSubSectionMenu new_data={user_data} title={t('Menu.preference_content.style_insert_head')} collapse={false}>
              <TansferStyle user_data={user_data} app_data={app_data} elementStyleType='_link_styles' />
            </WrapperBoxSubSectionMenu>
          </Box>
        </TabPanel>      </TabPanels>
    </Tabs>
  </Box>
}

/**
 * Compoenent to transfer element style from user preference to application
 *
 * @param {*} { user_data, app_data, elementStyleType: elementTagNameProp }
 * @return {*} 
 */
const TansferStyle: FunctionComponent<{ user_data: Class_ApplicationDataSA, app_data: Class_ApplicationDataSA, elementStyleType: '_node_styles' | '_link_styles' }> = ({ user_data, app_data, elementStyleType: elementTagNameProp }) => {
  const { t } = app_data
  const style_dict = user_data.drawing_area.sankey[elementTagNameProp]
  const app_style_dict = app_data.drawing_area.sankey[elementTagNameProp]
  const style_list = Object.values(style_dict)

  const [style_entry_id, setStyleEntryId] = useState(style_list[0]?.id ?? '')
  const [, setCount] = useState(0)

  const updateThis = () => {
    if (style_dict[style_entry_id])
      setCount(a => a + 1)
    else
      setStyleEntryId(style_list[0]?.id ?? '')
  }

  // Early return if no group
  if (style_list.length == 0)
    return <></>
  else if (!(style_dict[style_entry_id])) // if tag group selected not in user pref tag group then select the first one
    setStyleEntryId(style_list[0]?.id ?? '')


  return <>
    <Box display={'flex'}>
      <Text>{t('Menu.preference_content.style_insert_text')}</Text>
      <Box flex='auto' >
        <Select value={style_entry_id}
          onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
            setStyleEntryId(evt.target.value)
            updateThis()
          }}
        >{
            style_list.map((tg) => {
              return <option key={'user_tag_group_' + tg.id} value={tg.id}>{tg.name}</option>
            })}
        </Select>
      </Box>
    </Box>

    {/* Button to insert user selected style to application data */}
    <Button
      variant='btn_create_color_palette'
      onClick={() => {
        // Update correct element style
        if (elementTagNameProp == '_node_styles') {
          let new_style: Class_NodeStyle

          // Update style if existing in application data, else create a new one
          if (style_entry_id in app_data.drawing_area.sankey.node_styles_dict)
            new_style = app_data.drawing_area.sankey.node_styles_dict[style_entry_id]
          else
            new_style = app_data.drawing_area.sankey.addNewNodeStyle(style_entry_id, style_dict[style_entry_id].name)

          new_style.copyFrom(style_dict[style_entry_id] as Class_NodeStyle)
          // Update tags menu in application
          app_data.menu_configuration.updateComponentRelatedToNodesStyles()

        } else {
          let new_style: Class_LinkStyle

          // Update style if existing in application data, else create a new one
          if (style_entry_id in app_data.drawing_area.sankey.node_styles_dict)
            new_style = app_data.drawing_area.sankey.link_styles_dict[style_entry_id]
          else
            new_style = app_data.drawing_area.sankey.addNewLinkStyle(style_entry_id, style_dict[style_entry_id].name)

          new_style.copyFrom(style_dict[style_entry_id] as Class_LinkStyle)
          app_data.menu_configuration.updateComponentRelatedToLinksStyles()
        }

        // Redraw application sankey with updated style
        app_data.drawing_area.draw()

      }}>
      {(style_entry_id in app_style_dict) ? t('Menu.preference_content.style_update') : t('Menu.preference_content.style_insert')}
    </Button>
  </>
}

const TabUserIcon: FunctionComponent<{ user_data: Class_ApplicationDataSA, app_data: Class_ApplicationDataSA }> = ({ user_data, app_data }) => {
  const { t, icon_library } = app_data
  const { icon_new_da } = icon_library
  const _load_svg = useRef<HTMLInputElement>(null)
  const [, setUpdate] = useState(0)

  const imported_icon = user_data.drawing_area.sankey.icon_catalog

  const import_svg = useRef<{ [s: string]: string }>(imported_icon)

  const list_icon = Object.entries(imported_icon).map((icon, idx) => {
    return <Card
      key={'card_' + icon[0] + '_' + idx}
      variant='cards_user'
    >
      <CardBody>
        <CardHeader>
          <Editable defaultValue={icon[0]} onSubmit={(evt) => {
            if (evt) {
              icon[0] = evt
              setUpdate(a => a + 1)
            }
          }}
            maxWidth={'8vw'}
            overflow={'hidden'}
          >
            <EditablePreview />
            <EditableInput />
          </Editable>
        </CardHeader>
        <Divider />
        <div>
          <svg viewBox='0 0 1000 1000' width={50} height={50}><g><path fill='black' d={icon[1]}></path></g></svg>
        </div>
        <CardFooter>
          <Button
            variant='preference_del_button'
            onClick={() => {
              delete imported_icon[icon[0]]
              setUpdate(a => a + 1)
            }}>{t('Menu.suppr')}</Button>

        </CardFooter>
      </CardBody>
    </Card>
  })


  return <Box layerStyle='menuconfigpanel_grid'>
    <WrapperBoxSubSectionMenu new_data={user_data} title={t('Menu.preference_content.icon_head')}>
      <>
        <Text>{t('Menu.preference_content.icon_item_1')}</Text>
        <Text>{t('Menu.preference_content.icon_item_2')}</Text>

      </>
    </WrapperBoxSubSectionMenu>
    <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridGap: '0.2rem', maxWidth: '33vw' }}>
      <Card variant='cards_user_import'
        onClick={() => {
          if (_load_svg.current) {
            _load_svg.current.name = ''
            _load_svg.current.click()
          }
        }}
      >
        <CardBody>
          <CardHeader>{t('Import')}</CardHeader>
          <Divider />
          <div>
            {icon_new_da}
          </div>
        </CardBody>
      </Card>
      {list_icon}
    </Box>
    <Input
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

              import_svg.current['user_' + (files[i].name).replace('.svg', '')] = attr_d

            }
          })()
          if (Number(i) === files.length - 1) {
            reader.onloadend = (() => {
              return () => {
                Object.entries(import_svg.current).forEach(ent => {
                  app_data.drawing_area.sankey.icon_catalog[ent[0]] = ent[1]
                  user_data.drawing_area.sankey.icon_catalog[ent[0]] = ent[1]
                })
                setUpdate(a => a + 1)
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
  </Box>
}

type TypeDataPalette = {
  name: string; colors: string[]
}
/**
 * Function component to edit a color palette in preference, 
 * it allow ta add elements to palette, change color of elements delete them and change the name of the palette 
 *
 * @param {*} { name, colors }
 * @return {*} 
 */
const PaletteCreator: FunctionComponent<{ data_palette: TypeDataPalette, t: TFunction, deletePalette: () => void }> = ({ data_palette, t, deletePalette }) => {
  const [, setUpdate] = useState(0)
  const [colorToEdit, setColorToEdit] = useState(0)
  const [displayColorPicker, setDisplayColorPicker] = useState(false)
  const colorsOfPalette: MutableRefObject<string[]> = useRef(data_palette.colors)
  const colorsSelected: MutableRefObject<number[]> = useRef([])

  /**
   *Event when we close the picker
   *
   * @private
   * @memberof OSColorPicker
   */
  const handleClose = () => {
    setDisplayColorPicker(false)
  }

  const styles: { [x: string]: CSSProperties } = {
    color: {
      width: '1rem',
      height: '1rem',
      borderRadius: '2px',
    },
    swatch: {
      height: '1.5rem',
      padding: '5px',
      borderRadius: '2px',
      boxShadow: '0 0 0 1px rgba(124, 104, 104, 0.1)',
      display: 'inline-block',
    },
    popover: {
      position: 'absolute',
      top: '20%',
      zIndex: '2',
    },
    cover: {
      position: 'fixed',
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
    },
  }

  return <Box layerStyle='menu_sub_section'><Box style={{
    display: 'grid',
    gridGap: '0.2rem',
    padding: paddingBoxPreference,
    gridTemplateAreas: `'name'
    'palette'
    'palette'
    'delPalette`,
  }}>
    <Editable variant='edit_name_palette' gridArea='name' value={data_palette.name} selectAllOnFocus={false}
      onChange={(evt) => {
        data_palette.name = evt
        setUpdate(a => a + 1)
      }}
    >
      <EditablePreview />
      <EditableInput />
    </Editable>


    <Box style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }} gridArea='palette'>

      {colorsOfPalette.current.map((el, idx) => {
        return <Box key={'color_of_palette_' + idx} style={styles.swatch}
          background={colorsSelected.current.includes(idx) ? 'primaire.2' : '#ddd'}
          onContextMenu={(evt) => {
            // Delete color on right click
            evt.preventDefault()
            if (colorsSelected.current.includes(idx)) {
              const idxToDeselect = colorsSelected.current.indexOf(idx)
              colorsSelected.current.splice(idxToDeselect, 1)
            } else {
              colorsSelected.current.push(idx)
            }
            setUpdate(a => a + 1)
          }}
          onClick={() => {
            // Open color editor
            setColorToEdit(idx)
            setDisplayColorPicker(true)
          }}>
          <Box style={{ ...styles.color, background: el }} />
        </Box>
      })}
      <OSTooltip label={t('Menu.preference_content.deleteColorPalette_tooltip')}>
        <Button isDisabled={colorsSelected.current.length == 0} variant='btn_del_color_from_palette' gridArea='delColor' onClick={() => {
          // Sort index to delete then splice from reversed array to avoid messing up index to delete
          colorsSelected.current = colorsSelected.current.sort()
          colorsSelected.current.reverse().forEach(id => {
            colorsOfPalette.current.splice(id, 1)
          })
          colorsSelected.current = []
          setUpdate(a => a + 1)
        }}>
          <FaMinus />
        </Button>
      </OSTooltip>

      <OSTooltip label={t('Menu.preference_content.addColorPalette_tooltip')}>
        <Button variant='btn_add_color_to_palette' gridArea='addColor' onClick={() => {
          colorsOfPalette.current.push('#000000')
          setUpdate(a => a + 1)
        }}><FaPlus />
        </Button>
      </OSTooltip>
    </Box>

    <Button
      variant='btn_delete_color_palette'
      gridArea='delPalette'
      onClick={deletePalette}
    >
      {t('Menu.preference_content.deletePalette')}
    </Button>
    {displayColorPicker ? <Box style={styles.popover}>
      <Box style={styles.cover} onClick={handleClose} />
      <SketchPicker color={colorsOfPalette.current[colorToEdit]} onChange={(evt) => {
        colorsOfPalette.current[colorToEdit] = evt.hex
        setUpdate(a => a + 1)
      }} />
    </Box> : null}
  </Box>
  </Box>
}