// Standard libs
import React, { ChangeEvent, FunctionComponent, useRef, useState } from 'react'

// Imported libs
import { FaArrowDown, FaArrowUp, FaCheck, FaMinus } from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock, faListCheck, faHome, faCaretSquareLeft, faCaretSquareRight, faPlus, faCopy, faMinus, faXmark } from '@fortawesome/free-solid-svg-icons'
import {
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Checkbox,
  Select,
  Input,
  InputGroup,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Button,
  Tag,
  Modal,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  ModalOverlay
} from '@chakra-ui/react'

// OpenSankey Libs
import {
  default_main_sankey_id,
  OSTooltip,
  Type_JSON,
} from '../deps/OpenSankey/types/Utils'
import {
  ConfigMenuTextInput
} from '../deps/OpenSankey/configmenus/SankeyMenuConfiguration'

// Local libs
import {
  FCType_BannerViewsOSP,
  FCType_MenuPreferenceViewOSP,
  FCType_SelecteurView,
  FCType_ViewAccordion,
  FCType_MenuEnregistrerViewOSP,
  FCType_ModalViewNotSavedOSP,
  FCType_ModalTransparentViewAttrOSP
} from './types/SankeyPlusViewsTypes'

import {
  OSPData
} from '../types/LegacyTypes'

// TODO Est-ce toujours utile ?
declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      diagram: string,
      sous_filieres: { [key: string]: string }
      help: { [key: string]: string }
      excel: string
      structure: boolean,
      advanced: boolean
    } & { [key: string]: OSPData }
  }

/**
 * Fucntion that return a toolbar to navigate,create or modify view, it contain :
 * - a button to return to master data
 * - a button to create a view if we are currently on master data
 * - 2 button to navigate in the list of view
 * - a dropdown to directly select the view we want to display (or select master data)
 * Then if we are in a view there is additionnal button
 * - a button to choose variable of the view that get their value from master
 * - a button to clone the actual view
 * a button that appear if the view is a unitary view and the unitary node of the view has the tag 'secteur' from the nodeTag 'Type de noeud'
 *
 * @param {*} {
 *   new_data_plus
 * }
 * @return {*}
 */
export const BannerViewsOSP: FunctionComponent<FCType_BannerViewsOSP> = ({
  new_data_plus
}) => {

  // Data -------------------------------------------------------------------------------

  const { t } = new_data_plus

  // Component updater ------------------------------------------------------------------

  // Local updater ----------------------------------------------------------------------

  const [, setCount] = useState(0)
  const refreshThis = () => {
    setCount(a => a + 1)
  }
  new_data_plus.menu_configuration.ref_to_banner_views_updater.current = refreshThis

  // Ref to trigger other components ----------------------------------------------------

  const ref_to_input_loader_json_catalog = useRef<HTMLInputElement>(null) as { current: HTMLInputElement; }

  // Local variables --------------------------------------------------------------------

  const has_sankey_plus = new_data_plus.has_sankey_plus
  const has_views = new_data_plus.has_views
  const is_view_master = new_data_plus.is_view_master
  const has_view_before = new_data_plus.has_view_before
  const has_view_after = new_data_plus.has_view_after

  // Button to create a view ------------------------------------------------------------

  const activate_button_to_create_view = has_sankey_plus
  const button_to_create_view = <OSTooltip
    placement='bottom'
    label={
      (!has_sankey_plus) ?
        (t('Menu.sankeyOSPDisabled')) :
        t('view.tooltips.buttonCreateView')}
  >
    <Box>
      <Button
        variant='menutop_button'
        isDisabled={!activate_button_to_create_view}
        onClick={() => {
          const evt = document
          const evt_ctrl_x = new KeyboardEvent('keydown', { key: 'x', ctrlKey: true })
          if (evt.onkeydown) {
            evt.onkeydown(evt_ctrl_x)
          }
        }}
      >
        <Box
          layerStyle='menutop_button_style'
        >
          <Box
            gridRow="1"
            padding="0.1rem 0 0.1rem 0"
          >
            <FontAwesomeIcon
              style={{
                'height': '2rem',
                'width': '3rem',
              }}
              icon={faPlus}
            />
            {
              !has_sankey_plus ?
                <FontAwesomeIcon
                  icon={faLock}
                  style={{
                    'fontSize': '1em',
                    'position': 'absolute',
                    'right': '0.1em',
                    'bottom': '0em',
                    'color': 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'
                  }} />
                : <></>
            }
          </Box>
          <Box
            gridRow="2"
          >
            {t('Menu.addView')}
          </Box>
        </Box>
      </Button>
    </Box>
  </OSTooltip>

  // Button to delete actual view -------------------------------------------------------

  const activate_button_to_delete_actual_view = has_sankey_plus && has_views && !is_view_master
  const button_to_delete_actual_view = <OSTooltip
    placement='bottom'
    label={
      (!has_sankey_plus) ?
        (t('Menu.sankeyOSPDisabled')) :
        t('view.tooltips.button_delete_actual_view')
    }
  >
    <Box>
      <Button
        variant='menutop_button'
        isDisabled={!activate_button_to_delete_actual_view}
        onClick={
          // Delete the view
          () => {
            new_data_plus.deleteCurrentView()
          }
        }
      >
        <Box
          layerStyle='menutop_button_style'
        >
          <Box
            gridRow="1"
            padding="0.1rem 0 0.1rem 0"
          >
            <FontAwesomeIcon
              style={{
                'height': '2rem',
                'width': '3rem'
              }}
              icon={faMinus}
            />
            {
              (!has_sankey_plus) ?
                <FontAwesomeIcon
                  icon={faLock}
                  style={{
                    'fontSize': '1em',
                    'position': 'absolute',
                    'right': '0.1em',
                    'bottom': '0em',
                    'color': 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'
                  }} /> :
                <></>
            }
          </Box>
          <Box
            gridRow="2"
          >
            {t('view.delete')}
          </Box>
        </Box>
      </Button>
    </Box>
  </OSTooltip>

  // Button to fallback to master -------------------------------------------------------

  const activate_button_to_return_to_master = has_views && !is_view_master
  const button_to_return_to_master = <OSTooltip
    placement='bottom'
    label={t('view.tooltips.home')}
  >
    <Box>
      <Button
        variant='menutop_button'
        isDisabled={!activate_button_to_return_to_master}
        onClick={() => {
          const evt = document
          const evt_key_f7 = new KeyboardEvent('keydown', { key: 'F7' })
          if (evt.onkeydown) {
            evt.onkeydown(evt_key_f7)
          }
        }}
      >
        <Box
          layerStyle='menutop_button_style'
        >
          <Box
            gridRow="1"
            padding="0.1rem 0 0.1rem 0"
          >
            <FontAwesomeIcon
              style={{
                'height': '2rem',
                'width': '3rem',
                // 'opacity': (!has_sankey_plus && !has_views) ? '0.6' : '1'
              }}
              icon={faHome}
            />
          </Box>
          <Box
            gridRow="2"
          >
            {t('Menu.home')}
          </Box>
        </Box>
      </Button>
    </Box>
  </OSTooltip>

  // Button to go to next view ----------------------------------------------------------

  const activate_button_to_prev_view = has_views && has_view_before
  const button_to_prev_view = <OSTooltip
    placement='bottom'
    label={t('view.tooltips.PrevViewButton')}
  >
    <Box>
      <Button
        variant='menutop_button'
        isDisabled={!activate_button_to_prev_view}
        onClick={() => {
          const ev = document
          const tmp = new KeyboardEvent('keydown', { key: 'F8' })
          if (ev.onkeydown) {
            ev.onkeydown(tmp as KeyboardEvent)
          }
        }}
      >
        <Box
          layerStyle='menutop_button_style'
        >
          <Box
            gridRow="1"
            padding="0.1rem 0 0.1rem 0"
          >
            <FontAwesomeIcon
              style={{
                'height': '2rem',
                'width': '3rem',
                // 'opacity': (prev_button_disabled || !has_views) ? '0.6' : '1'
              }}
              icon={faCaretSquareLeft}
            />
          </Box>
          <Box
            gridRow="2"
          >
            {t('Menu.precView')}
          </Box>
        </Box>
      </Button>
    </Box>
  </OSTooltip>

  // Button to previous view ------------------------------------------------------------

  const activate_button_to_next_view = has_views && has_view_after
  const button_to_next_view = <OSTooltip
    placement='bottom'
    label={t('view.tooltips.NextViewButton')}
  >
    <Box>
      <Button
        variant='menutop_button'
        isDisabled={!activate_button_to_next_view}
        onClick={() => {
          const ev = document
          const tmp = new KeyboardEvent('keydown', { key: 'F9' })
          if (ev.onkeydown) {
            ev.onkeydown(tmp as KeyboardEvent)
          }
        }}
      >
        <Box
          layerStyle='menutop_button_style'
        >
          <Box
            gridRow="1"
            padding="0.1rem 0 0.1rem 0"
          >
            <FontAwesomeIcon
              style={{
                'height': '2rem',
                'width': '3rem',
              }}
              icon={faCaretSquareRight}
            />
          </Box>
          <Box
            gridRow="2"
          >
            {t('Menu.nextView')}
          </Box>
        </Box>
      </Button>
    </Box>
  </OSTooltip>

  // Button to display attributes transfert modal ---------------------------------------

  const activate_button_to_show_view_attr_transfert_modal = has_sankey_plus && has_views && !is_view_master
  const button_to_show_view_attr_transfert_modal = <OSTooltip
    placement='bottom'
    label={
      (!has_sankey_plus) ?
        (t('Menu.sankeyOSPDisabled')) :
        t('view.tooltips.buttonCloneMasterAttrView')
    }>
    <Box>
      <Button
        variant='menutop_button'
        isDisabled={!activate_button_to_show_view_attr_transfert_modal}
        onClick={
          () => {
            new_data_plus.menu_configuration.ref_to_modal_view_attributes_switcher.current(true)
          }
        }
      >
        <Box
          layerStyle='menutop_button_style'
        >
          <Box
            gridRow="1"
            padding="0.1rem 0 0.1rem 0"
          >
            <FontAwesomeIcon
              style={{
                'height': '2rem',
                'width': '3rem',
                // 'opacity': (!has_sankey_plus) ? '0.6' : '1'
              }}
              icon={faListCheck}
            />
            {
              (!has_sankey_plus) ?
                <FontAwesomeIcon
                  icon={faLock}
                  style={{
                    'fontSize': '1em',
                    'position': 'absolute',
                    'right': '0.1em',
                    'bottom': '0em',
                    'color': 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'
                  }} />
                : <></>
            }
          </Box>
          <Box
            gridRow="2"
          >
            {t('view.keep_master_var')}
          </Box>
        </Box>
      </Button>
    </Box>
  </OSTooltip>

  // Button to load views as a catalog of view (ie  JSON containing only views) ---------

  const activate_create_data_catalog = has_sankey_plus // TODO need only license ?
  const create_data_catalog = <OSTooltip
    placement='bottom'
    label={
      (!has_sankey_plus) ?
        (t('Menu.sankeyOSPDisabled')) :
        t('view.tooltips.catalog_data')
    }
  >
    <Box>
      <Button
        variant='menutop_button'
        isDisabled={!activate_create_data_catalog}
        onClick={
          () => {
            if (ref_to_input_loader_json_catalog.current) {
              ref_to_input_loader_json_catalog.current.name = ''
              ref_to_input_loader_json_catalog.current.click()
            }
          }}
      >
        <Box
          layerStyle='menutop_button_style'
        >
          <Box
            gridRow="1"
            padding="0.1rem 0 0.1rem 0"
          >
            <FontAwesomeIcon
              style={{
                'height': '2rem',
                'width': '3rem',
                // 'opacity': (!has_sankey_plus) ? '0.6' : '1'
              }}
              icon={faCopy}
            />
            {
              (!has_sankey_plus) ?
                <FontAwesomeIcon
                  icon={faLock}
                  style={{
                    'fontSize': '1em',
                    'position': 'absolute',
                    'right': '0.1em',
                    'bottom': '0em',
                    'color': 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'
                  }} />
                : <></>
            }
          </Box>
          <Box
            gridRow="2"
          >
            {t('view.catalog')}
          </Box>
        </Box>
      </Button>
    </Box>
  </OSTooltip>

  // Input to read JSON as a catalog of view (ie  JSON containing only views) ---------

  const input_loader_json_catalog = <Input
    type="file"
    multiple
    accept='.json'
    ref={ref_to_input_loader_json_catalog}
    style={{ display: 'none' }}
    onChange={(evt: ChangeEvent) => {
      const files = (evt.target as HTMLFormElement).files

      // Parcours tous les element de l'objet (contient le blob des fichiers mais aussi une variable length)
      for (const i in files) {
        const reader = new FileReader()
        reader.onload = (() => {
          return (e: ProgressEvent<FileReader>) => {
            const file_content = String((e.target as FileReader).result)
            const JSON_data = JSON.parse(file_content)

            // Extract view of files
            new_data_plus.extractViewsFromJSON(JSON_data as Type_JSON)
          }
        })()
        // Permet d'executer la transformation des blob en vues tout en evitant la var length
        //   files : {0:Blob,1:Blob,2:...,n:Blob, length:n-1}
        if (!isNaN(+i)) {
          reader.readAsText(files[i])
        }
      }
    }}
  />

  return <>
    {/* Load + Save  */}
    {new_data_plus.is_static ? <></> : input_loader_json_catalog}
    {new_data_plus.is_static ? <></> : create_data_catalog}

    {/* Return to Sankey master button */}
    {new_data_plus.is_static ? <></> : button_to_return_to_master}

    {/* Create, switch between or delete views */}
    {new_data_plus.is_static ? <></> : button_to_create_view}
    {button_to_prev_view}
    {button_to_next_view}
    <Box
      height='3rem'
      gridColumnEnd='span 4'
      alignSelf='center'
      alignContent='center'
    >
      <SelecteurView new_data_plus={new_data_plus} />

    </Box>
    {
      new_data_plus.is_static ?
        <></> :
        <>
          {button_to_delete_actual_view}
          {button_to_show_view_attr_transfert_modal}
        </>
    }
  </>
}

/**
 * View selector for navbar or menuconfig
 * @param {*} {
 *   new_data_plus
 * }
 * @return {*}
 */
export const SelecteurView: FunctionComponent<FCType_SelecteurView> = (
  { new_data_plus }
) => {

  // Data -------------------------------------------------------------------------------

  const { t } = new_data_plus

  // Components updaters ----------------------------------------------------------------

  const [s_select_or_edit, sSelectOrEdit] = useState<'edit'|'select'>('select')

  const ref_set_text_value_input = useRef((_: string | null | undefined) => null)

  // Local variables --------------------------------------------------------------------

  const cur_view = new_data_plus.drawing_area
  const has_sankey_plus = new_data_plus.has_sankey_plus
  const has_views = new_data_plus.has_views
  const is_view_master = new_data_plus.is_view_master

  // JSX elements -----------------------------------------------------------------------

  const selecteur = <Select
    variant='menuconfigpanel_option_select'
    onDoubleClick={() => {
      if (
        has_sankey_plus &&
        has_views &&
        !is_view_master
      ) {
        sSelectOrEdit('edit') // Swith to edition mode
      }
    }}
    onChange={
      (evt: React.ChangeEvent<HTMLSelectElement>) => {
        new_data_plus.setCurrentView(evt.target.value)
        // Update views components (without updating save in cache button)
        new_data_plus.menu_configuration.updateComponentRelatedToViews()
      }
    }
    value={cur_view.id}
  >
    <option
      hidden
      value={default_main_sankey_id}
    >
      {t('view.actual')}
    </option>
    {
      new_data_plus.views
        .map(view => {
          return <option
            key={view.id}
            value={view.id}
          >
            {view.name}
          </option>
        })
    }
  </Select>

  const text_input = <ConfigMenuTextInput
    ref_to_set_value={ref_set_text_value_input}
    function_get_value={() => { return cur_view.name }}
    function_on_blur={(_) => {
      // Update text for links
      if ((_ !== undefined) && (_ !== null)) {
        cur_view.name = _
      }
      // Update this menu
      sSelectOrEdit('select')
      // Update views components
      new_data_plus.menu_configuration.updateComponentRelatedToViews()
    }}
    disabled={!has_views}
  />

  return ((s_select_or_edit === 'edit') || (!has_views)) ? text_input : selecteur
}

/**
 * Sub accordion for view config in menu configuration
 * @param {*} {
 *   new_data_plus,
 * }
 * @return {*}
 */
export const ViewsAccordion: FunctionComponent<FCType_ViewAccordion> = (
  { new_data_plus }
) => {

  // Data -------------------------------------------------------------------------------

  const { t } = new_data_plus

  // Components updaters ----------------------------------------------------------------

  const [, setCount] = useState(0)
  const refreshThis = () => setCount(a => a + 1)
  new_data_plus.menu_configuration.ref_to_accordion_views_updater.current = refreshThis

  // Local variables --------------------------------------------------------------------

  const is_activated = new_data_plus.has_sankey_plus
  const curr_view = new_data_plus.drawing_area
  const list_view = new_data_plus.views //include master

  // JSX elements -----------------------------------------------------------------------

  // Popover used to select a view or master we want to take the layout from. (color,font-size,position,...)

  return <AccordionItem
    style={{ 'display': (new_data_plus.menu_configuration.accordions_to_show.includes('Vis')) ? 'initial' : 'none' }}
  >
    <AccordionButton onClick={() => {
      const scroll_x = window.scrollX
      const scroll_y = window.scrollY
      setTimeout(() => {
        document.getElementsByTagName('html')[0]?.scrollTo(scroll_x, scroll_y)
      }, 50)
    }}
    >
      <Box as='span' layerStyle='menuconfig_entry'>
        {t('view.storytelling')}
      </Box>
      <Tag colorScheme='teel' >Beta</Tag>
      <AccordionIcon />
    </AccordionButton>
    <AccordionPanel>
      <Box layerStyle='menuconfigpanel_grid'>

        <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
          <Box layerStyle='menuconfigpanel_option_name' >
            {t('view.select')}
          </Box>
          <InputGroup
            variant='menuconfigpanel_option_input'>
            <SelecteurView new_data_plus={new_data_plus} />
          </InputGroup>
        </Box>
        <Table size='sm'>
          <Thead>
            <Tr>
              <Th>{t('view.name')}</Th>
              <Th>Position</Th>
              <Th>{t('view.delete')}</Th>
              {/* <Th>{t('view.copy')}</Th>
                <Th>{t('view.import')}</Th>
                <Th>{t('view.export')}</Th> */}
            </Tr>
          </Thead>
          <Tbody>
            {list_view.map((d,idx) => {
              return (
                <React.Fragment key={idx}>
                  <Tr style={{ 'border': (d.id === curr_view.id) ? '2px solid #5a9282' : 'none' }}>
                    <Td>
                      <Input
                        variant='menuconfigpanel_option_input'
                        value={d.name}
                        isDisabled={!is_activated || (d.id == default_main_sankey_id)}
                        onChange={evt => {
                          d.name = evt.target.value
                          new_data_plus.menu_configuration.updateComponentRelatedToViews()
                        }}
                      />
                    </Td>
                    <Td>
                      {/* Change the position of the view in the liste of view from master data */}
                      <Button variant='menuconfigpanel_option_button_in_table' isDisabled={!is_activated || (d.id == default_main_sankey_id)}
                        onClick={() => { new_data_plus.moveViewUpInOrder(d.id); new_data_plus.menu_configuration.updateComponentRelatedToViews() }}
                      ><FaArrowUp />
                      </Button>
                      <Button variant='menuconfigpanel_option_button_in_table' isDisabled={!is_activated || (d.id == default_main_sankey_id)}
                        onClick={() => { new_data_plus.moveViewDownInOrder(d.id); new_data_plus.menu_configuration.updateComponentRelatedToViews() }}
                      ><FaArrowDown />
                      </Button>
                    </Td>
                    <Td><Button
                      variant='menuconfigpanel_del_button_in_table'
                      isDisabled={!is_activated || (d.id == default_main_sankey_id)}
                      onClick={
                        // Delete the view
                        () => {
                          new_data_plus.deleteView(d.id)
                          new_data_plus.menu_configuration.updateComponentRelatedToViews()
                        }
                      }
                    ><FaMinus /></Button></Td>
                  </Tr>
                </React.Fragment>
              )
            })}
          </Tbody>
        </Table>
      </Box>

    </AccordionPanel>
  </AccordionItem>
}

// TODO Voir si toujours utile
// export const getSetDiagramFunc: getSetDiagramFType = (
//   set_master_data: (d: OSPData | undefined) => void,
//   set_view: (s: string) => void,
//   DefaultSankeyData: () => OSPData
// ) => {
//   return (
//     the_diagram: string,
//     set_data: (d: OSPData) => void,
//     convert_data: (d: OSPData, DefaultSankeyData: () => OSPData) => void
//   ) => {
//     const sous_filieres = window.sankey.sous_filieres

//     const new_data = JSON.parse(
//       JSON.stringify(
//         window.sankey[sous_filieres[the_diagram]]
//       )
//     ) as OSPData
//     convert_data(new_data, DefaultSankeyData)
//     window.sankey.diagram = the_diagram
//     d3.select(' .opensankey #svg').on('.zoom', null)
//     if (window.SankeyToolsStatic && new_data.view.length > 0) {
//       set_master_data(new_data)
//       set_view(new_data.view[0].id)
//       set_data(GetDataFromView(new_data, new_data.view[0].id) as OSPData)
//     } else {
//       set_master_data(undefined)
//       set_data(new_data)
//       set_view('none')
//     }
//   }
// }

// TODO Voir si toujours utile
// export const setValue: setValueFType = (
//   dataTags: TagsGroup[],
//   v_target: SankeyLinkValueDict,
//   v_source: SankeyLinkValueDict,
//   depth: number
// ) => {
//   const dataTag = Object.values(dataTags)[depth]
//   const listKey = Object.keys(dataTag.tags)
//   for (const i in listKey) {
//     if (depth === dataTags.length - 1) {
//       v_target[listKey[i]] = v_source[listKey[i]]
//     } else {
//       if (v_target[listKey[i]] === undefined) {
//         v_target[listKey[i]] = {}
//       }
//       setValue(
//         dataTags,
//         v_target[listKey[i]] as SankeyLinkValueDict,
//         v_source[listKey[i]] as SankeyLinkValueDict,
//         depth + 1)
//     }
//   }
// }

export const MenuPreferenceViewOSP: FunctionComponent<FCType_MenuPreferenceViewOSP> = (
  { new_data_plus }
) => {
  const [, setCount] = useState(0)
  const { t } = new_data_plus
  return <Checkbox
    variant='menuconfigpanel_option_checkbox'
    defaultChecked={new_data_plus.menu_configuration.isGivenAccordionShowed('Vis')}
    onChange={() => {
      new_data_plus.menu_configuration.toggleGivenAccordion('Vis')
      setCount(a => a + 1)
    }}>
    {t('view.storytelling')}
  </Checkbox>
}

/**
 * Modal to ask user if he want to save unsaved view change before switching view
 *
 * @param {*} {new_data_plus}
 * @return {*}
 */
export const ModalViewNotSavedOSP: FunctionComponent<FCType_ModalViewNotSavedOSP> = (
  { new_data_plus }
) => {

  const { t } = new_data_plus
  const [show_modal, setShowModal] = useState(false)
  new_data_plus.menu_configuration.dict_setter_show_dialog_plus.ref_setter_show_menu_view_not_saved.current = setShowModal

  return (
    <Modal
      isCentered
      isOpen={show_modal}
      onClose={() => null}
    >
      <ModalOverlay />
      <ModalContent
        maxWidth='inherit'
      >
        <ModalHeader>
          {t('view.ns')}
        </ModalHeader>
        <ModalBody>
          {t('view.warn_ns')}
        </ModalBody>
        <ModalFooter>
          <Button
            variant='menuconfigpanel_del_button'
            onClick={() => {
              new_data_plus.resetViewWithOriginal()
              setShowModal(false)
            }}
          >
            {t('view.dont_save')}
          </Button>
          <Button
            variant='menuconfigpanel_add_button'
            onClick={() => {
              new_data_plus.saveBeforeChangingView()
              setShowModal(false)

            }}
          >
            {t('view.save')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>)
}

export const ModalTransparentViewAttrOSP: FunctionComponent<FCType_ModalTransparentViewAttrOSP> = (
  { new_data_plus }
): JSX.Element => {

  const { t } = new_data_plus

  const [state, setState] = useState(false)
  const [,setUpdater]=useState(0)
  const show_modal = state
  // const update_modes = state.update_modes

  const switchThis = (_: boolean) => {
    setState(_)
  }

  new_data_plus.menu_configuration.ref_to_modal_view_attributes_switcher.current = switchThis

  const updateComponent=()=>{
    setUpdater(a=>a+1)
  }

  const has_sankey_plus = new_data_plus.has_sankey_plus
  const has_master_sankey = new_data_plus.has_master_sankey
  const is_view_master = new_data_plus.is_view_master

  if (has_sankey_plus && has_master_sankey && !is_view_master) {

    return <Modal
      isOpen={show_modal}
      onClose={
        () => {
          switchThis(false)
        }}
    >
      <ModalContent
        maxWidth='inherit'
      >
        <ModalHeader>{t('view.setTransparentAttr')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>
              {t('Menu.Transformation.Topology')}
            </Box>
            <Box layerStyle='options_4cols'>
              <Button
                variant={
                  new_data_plus.drawing_area.heredited_attr.includes('addNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!new_data_plus.drawing_area.heredited_attr.includes('addNode')) {
                    new_data_plus.drawing_area.heredited_attr.push('addNode')
                  } else {
                    new_data_plus.drawing_area.heredited_attr.splice(new_data_plus.drawing_area.heredited_attr.indexOf('addNode'), 1)
                  }
                  updateComponent()
                }}
              >
                {t('Menu.Transformation.addNode')}
              </Button>

              <Button
                variant={new_data_plus.drawing_area.heredited_attr.includes('removeNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!new_data_plus.drawing_area.heredited_attr.includes('removeNode')) {
                    new_data_plus.drawing_area.heredited_attr.push('removeNode')
                  } else {
                    new_data_plus.drawing_area.heredited_attr.splice(new_data_plus.drawing_area.heredited_attr.indexOf('removeNode'), 1)
                  }
                  updateComponent()
                }}
              >
                {t('Menu.Transformation.removeNode')}
              </Button>

              <Button
                variant={new_data_plus.drawing_area.heredited_attr.includes('addFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!new_data_plus.drawing_area.heredited_attr.includes('addFlux')) {
                    new_data_plus.drawing_area.heredited_attr.push('addFlux')
                  } else {
                    new_data_plus.drawing_area.heredited_attr.splice(new_data_plus.drawing_area.heredited_attr.indexOf('addFlux'), 1)
                  }
                  updateComponent()
                }}
              >
                {t('Menu.Transformation.addFlux')}
              </Button>
              <Button
                variant={new_data_plus.drawing_area.heredited_attr.includes('removeFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!new_data_plus.drawing_area.heredited_attr.includes('removeFlux')) {
                    new_data_plus.drawing_area.heredited_attr.push('removeFlux')
                  } else {
                    new_data_plus.drawing_area.heredited_attr.splice(new_data_plus.drawing_area.heredited_attr.indexOf('removeFlux'), 1)
                  }
                  updateComponent()
                }}
              >
                {t('Menu.Transformation.removeFlux')}
              </Button>
            </Box>
          </Box>

          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>
              {t('Menu.Transformation.Geometry')}
            </Box>
            <Box layerStyle='options_4cols'>
              <Button
                variant={new_data_plus.drawing_area.heredited_attr.includes('posNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!new_data_plus.drawing_area.heredited_attr.includes('posNode')) {
                    new_data_plus.drawing_area.heredited_attr.push('posNode')
                  } else {
                    new_data_plus.drawing_area.heredited_attr.splice(new_data_plus.drawing_area.heredited_attr.indexOf('posNode'), 1)
                  }
                  updateComponent()
                }}>
                {t('Menu.Transformation.PosNoeud')}
              </Button>
              <Button
                variant={new_data_plus.drawing_area.heredited_attr.includes('posFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!new_data_plus.drawing_area.heredited_attr.includes('posFlux')) {
                    new_data_plus.drawing_area.heredited_attr.push('posFlux')
                  } else {
                    new_data_plus.drawing_area.heredited_attr.splice(new_data_plus.drawing_area.heredited_attr.indexOf('posFlux'), 1)
                  }
                  updateComponent()
                }}
              >
                {t('Menu.Transformation.posFlux')}
              </Button>
            </Box>
          </Box>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Values')}</Box>

            <Box as='span' layerStyle='options_4cols'>
              <Button
                variant={new_data_plus.drawing_area.heredited_attr.includes('Values') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!new_data_plus.drawing_area.heredited_attr.includes('Values')) {
                    new_data_plus.drawing_area.heredited_attr.push('Values')
                  } else {
                    new_data_plus.drawing_area.heredited_attr.splice(new_data_plus.drawing_area.heredited_attr.indexOf('Values'), 1)
                  }
                  updateComponent()
                }}
              >
                {new_data_plus.drawing_area.heredited_attr.includes('Values') ? <FaCheck /> : <FontAwesomeIcon icon={faXmark} />}
              </Button>
            </Box>

          </Box>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Attribut')}</Box>
            <Box as='span' layerStyle='options_4cols'>
              <Button
                variant={new_data_plus.drawing_area.heredited_attr.includes('attrNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!new_data_plus.drawing_area.heredited_attr.includes('attrNode')) {
                    new_data_plus.drawing_area.heredited_attr.push('attrNode')
                  } else {
                    new_data_plus.drawing_area.heredited_attr.splice(new_data_plus.drawing_area.heredited_attr.indexOf('attrNode'), 1)
                  }
                  updateComponent()
                }}
              >
                {t('Menu.Transformation.attrNode')}
              </Button>

              <Button
                variant={new_data_plus.drawing_area.heredited_attr.includes('attrFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!new_data_plus.drawing_area.heredited_attr.includes('attrFlux')) {
                    new_data_plus.drawing_area.heredited_attr.push('attrFlux')
                  } else {
                    new_data_plus.drawing_area.heredited_attr.splice(new_data_plus.drawing_area.heredited_attr.indexOf('attrFlux'), 1)
                  }
                  updateComponent()
                }}
              >
                {t('Menu.Transformation.attrFlux')}
              </Button>
            </Box>
          </Box>

          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Tags')}</Box>
            <Box layerStyle='options_4cols'>
              <Button
                variant={new_data_plus.drawing_area.heredited_attr.includes('tagNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!new_data_plus.drawing_area.heredited_attr.includes('tagNode')) {
                    new_data_plus.drawing_area.heredited_attr.push('tagNode')
                  } else {
                    new_data_plus.drawing_area.heredited_attr.splice(new_data_plus.drawing_area.heredited_attr.indexOf('tagNode'), 1)
                  }
                  updateComponent()
                }}
              >
                {t('Menu.Transformation.tagNode')}
              </Button>
              <Button
                variant={new_data_plus.drawing_area.heredited_attr.includes('tagFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!new_data_plus.drawing_area.heredited_attr.includes('tagFlux')) {
                    new_data_plus.drawing_area.heredited_attr.push('tagFlux')
                  } else {
                    new_data_plus.drawing_area.heredited_attr.splice(new_data_plus.drawing_area.heredited_attr.indexOf('tagFlux'), 1)
                  }
                  updateComponent()
                }}
              >
                {t('Menu.Transformation.tagFlux')}
              </Button>
              <Button
                variant={new_data_plus.drawing_area.heredited_attr.includes('tagData') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!new_data_plus.drawing_area.heredited_attr.includes('tagData')) {
                    new_data_plus.drawing_area.heredited_attr.push('tagData')
                  } else {
                    new_data_plus.drawing_area.heredited_attr.splice(new_data_plus.drawing_area.heredited_attr.indexOf('tagData'), 1)
                  }
                  updateComponent()
                }}
              >
                {t('Menu.Transformation.tagData')}
              </Button>
            </Box>
          </Box>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.tagLevel')}</Box>

            <Box as='span' layerStyle='options_4cols'>
              <Button
                variant={new_data_plus.drawing_area.heredited_attr.includes('tagLevel') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!new_data_plus.drawing_area.heredited_attr.includes('tagLevel')) {
                    new_data_plus.drawing_area.heredited_attr.push('tagLevel')
                  } else {
                    new_data_plus.drawing_area.heredited_attr.splice(new_data_plus.drawing_area.heredited_attr.indexOf('tagLevel'), 1)
                  }
                  updateComponent()
                }}
              >
                {new_data_plus.drawing_area.heredited_attr.includes('tagLevel') ? <FaCheck /> : <FontAwesomeIcon icon={faXmark} />}
              </Button>
            </Box>
          </Box>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.attrGeneral')}</Box>

            <Box as='span' layerStyle='options_4cols'>
              <Button
                variant={new_data_plus.drawing_area.heredited_attr.includes('attrGeneral') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!new_data_plus.drawing_area.heredited_attr.includes('attrGeneral')) {
                    new_data_plus.drawing_area.heredited_attr.push('attrGeneral')
                  } else {
                    new_data_plus.drawing_area.heredited_attr.splice(new_data_plus.drawing_area.heredited_attr.indexOf('attrGeneral'), 1)
                  }
                  updateComponent()
                }}
              >
                {new_data_plus.drawing_area.heredited_attr.includes('attrGeneral') ? <FaCheck /> : <FontAwesomeIcon icon={faXmark} />}
              </Button>
            </Box>
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button
            onClick={() => {
              const master_view = new_data_plus.master_view
              if (master_view) {
                new_data_plus.drawing_area.updateFrom(master_view, new_data_plus.drawing_area.heredited_attr)
                new_data_plus.drawing_area.reset()
              }
            }}
          >
            {t('view.updateViewWithMasterVar')}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  }
  return <></>
}

export const MenuEnregistrerViewOSP: FunctionComponent<FCType_MenuEnregistrerViewOSP> = ({
  new_data_plus
}) => {
  const [, setCount] = useState(0)
  const { t } = new_data_plus
  new_data_plus.menu_configuration.ref_to_save_diagram_only_view_updater.current = () => setCount(a => a + 1)

  return (new_data_plus.has_views && !new_data_plus.is_view_master) ? <Checkbox
    variant='menuconfigpanel_option_checkbox'
    isChecked={
      new_data_plus.options_save_json.only_current_view
    }
    onChange={(evt) => {
      new_data_plus.options_save_json.only_current_view = evt.target.checked
      new_data_plus.menu_configuration.updateComponentSaveDiagramJSON()
    }}>
    <OSTooltip label={t('view.tooltips.buttonExportView')}>
      {t('view.export')}
    </OSTooltip>
  </Checkbox> : <></>
}
