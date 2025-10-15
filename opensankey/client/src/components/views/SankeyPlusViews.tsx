// Standard libs
import React, { ChangeEvent, FC, useEffect, useRef, useState } from 'react'
import {
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
  Modal,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ButtonGroup,
  useDisclosure,
  Fade,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Spinner

} from '@chakra-ui/react'

// OpenSankey Libs
import {
  default_main_sankey_id,
  makeId,
  Type_JSON,
} from '../../types/Utils'
import {
  ConfigMenuTextInput
} from '../configmenus/SankeyMenuConfiguration'

import { OSMultiSelect, typeElementSelectable, WrapperBoxSubSectionMenu } from '../configmenus/MenuCommon'
import { FilterWrapperBox } from '../topmenus/Toolbar'
import { Class_DrawingAreaOSP } from '../../../../types/DrawingAreaOSP'
import { Class_NodeElement } from '../../Elements/Node'
import { OSTooltip } from '../configmenus/MenuCommon'
import { LevelTagFilter } from '../topmenus/Toolbar'
import { decompressUploadedFileUniversal } from '../../Persistence/UniversalJSONCompression'
import { Class_ApplicationData } from '../../types/ApplicationData'

interface BaseComponentPropsPlus {
  new_data_plus: Class_ApplicationData
}

export const logo_view = <svg
  xmlns='http://www.w3.org/2000/svg'
  viewBox='0 0 24 24'
  height='1.8rem'
  width='1.8rem'
>
  <path
    d='m17,15c-3.704,0-5.798,2.252-6.716,3.595-.376.55-.376,1.261,0,1.811.918,1.343,3.012,3.595,6.716,3.595s5.798-2.252,6.716-3.595c.376-.55.376-1.261,0-1.811-.918-1.343-3.012-3.595-6.716-3.595Zm5.891,4.841c-.807,1.18-2.646,3.159-5.891,3.159s-5.084-1.979-5.891-3.159c-.146-.214-.146-.468,0-.682.808-1.18,2.646-3.159,5.891-3.159s5.084,1.979,5.891,3.159c.146.214.146.468,0,.682Zm-5.891-2.341c-1.103,0-2,.897-2,2s.897,2,2,2,2-.897,2-2-.897-2-2-2Zm0,3c-.551,0-1-.448-1-1s.449-1,1-1,1,.448,1,1-.449,1-1,1ZM6,5.5c0,.552-.448,1-1,1s-1-.448-1-1,.448-1,1-1,1,.448,1,1Zm0,11c0,.552-.448,1-1,1s-1-.448-1-1,.448-1,1-1,1,.448,1,1Zm0-5.5c0,.552-.448,1-1,1s-1-.448-1-1,.448-1,1-1,1,.448,1,1Zm3-5.5c0-.276.224-.5.5-.5h10c.276,0,.5.224.5.5s-.224.5-.5.5h-10c-.276,0-.5-.224-.5-.5Zm10.5,6h-10c-.276,0-.5-.224-.5-.5s.224-.5.5-.5h10c.276,0,.5.224.5.5s-.224.5-.5.5Zm4.5-7v10c0,.276-.224.5-.5.5s-.5-.224-.5-.5V4.5c0-1.93-1.57-3.5-3.5-3.5H4.5c-1.93,0-3.5,1.57-3.5,3.5v13c0,1.93,1.57,3.5,3.5,3.5h3.5c.276,0,.5.224.5.5s-.224.5-.5.5h-3.5c-2.481,0-4.5-2.019-4.5-4.5V4.5C0,2.019,2.019,0,4.5,0h15c2.481,0,4.5,2.019,4.5,4.5Z'
  />
</svg>



// ================================================================

/**
 * Fucntion that return a toolbar to navigate,create or modify view, it contain :
 * - a button to return to master data
 * - a button to create a view if we are currently on master data
 * - 2 button to navigate in the list of view
 * - a dropdown to directly select the view we want to display (or select master data)
 * Then if we are in a view there is additionnal button
 * - a button to choose variable of the view that get their value from master
 * - a button to clone the actual view
 * a button that appear if the view is a unitary view and the unitary node of the view has the tag 'secteur' from the nodeTag 'type de noeud'
 *
 * @param {*} {
 *   new_data_plus
 * }
 * @return {*}
 */
export const BannerViewsOSP = ({ app_data }: { app_data: Class_ApplicationData }) => {

  // Data -------------------------------------------------------------------------------

  const { t, icon_library, menu_configuration_osp } = app_data
  const { icon_add_element, icon_remove_element, icon_welcome, icon_next, icon_previous, icon_attr_view, icon_unit_view, icon_copy, icon_locked, icon_collapse_down, icon_collapse_up } = icon_library
  // Component updater ------------------------------------------------------------------

  // Local updater ----------------------------------------------------------------------

  const [, setCount] = useState(0)
  const { isOpen, onToggle } = useDisclosure()
  const refreshThis = () => {
    setCount(a => a + 1)
  }
  const drawing_area_plus = app_data.drawing_area as Class_DrawingAreaOSP

  menu_configuration_osp.ref_to_banner_views_opened.current = isOpen
  menu_configuration_osp.ref_to_banner_views_updater.current = refreshThis

  // Ref to trigger other components ----------------------------------------------------

  const ref_to_input_loader_json_catalog = useRef<HTMLInputElement>(null) as { current: HTMLInputElement; }

  // Local variables --------------------------------------------------------------------

  const has_sankey_plus = app_data.has_sankey_plus
  const has_views = app_data.has_views
  const is_view_master = app_data.is_view_master
  const has_view_before = app_data.has_view_before
  const has_view_after = app_data.has_view_after
  const is_static = app_data.is_static

  // Button to create a view ------------------------------------------------------------

  const logo_locked = <Box className='iconLocked'>
    {icon_locked}
  </Box>

  const activate_button_to_create_view = has_sankey_plus
  const button_to_create_view = <OSTooltip
    placement='bottom'
    label={
      (!has_sankey_plus) ?
        (t('Menu.sankeyOSPDisabled')) :
        t('view.tooltips.buttonCreateView')}
  >
    <Button
      variant='button_banner_view'
      size='sizeMenuTopButton'
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
        layerStyle='banner_view_buttons'
      >
        <Box
          gridRow="1"
          padding="0.1rem 0 0.1rem 0"
        >
          {icon_add_element}
          {
            !has_sankey_plus ?
              logo_locked
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
    <Button
      variant='button_banner_view'
      size='sizeMenuTopButton'
      isDisabled={!activate_button_to_delete_actual_view}
      onClick={
        // Delete the view
        () => {
          app_data.deleteCurrentView()
        }
      }
    >
      <Box
        layerStyle='banner_view_buttons'
      >
        <Box
          gridRow="1"
          padding="0.1rem 0 0.1rem 0"
        >
          {icon_remove_element}
          {
            (!has_sankey_plus) ?
              logo_locked :
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
  </OSTooltip>

  // Button to fallback to master -------------------------------------------------------

  const activate_button_to_return_to_master = has_views && !is_view_master
  const button_to_return_to_master = <OSTooltip
    placement='bottom'
    label={t('view.tooltips.home')}
  >
    <Button
      variant='button_banner_view'
      size='sizeMenuTopButton'
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
        layerStyle='banner_view_buttons'
      >
        <Box
          gridRow="1"
          padding="0.1rem 0 0.1rem 0"
        >
          {icon_welcome}
        </Box>
        <Box
          gridRow="2"
        >
          {t('Menu.home')}
        </Box>
      </Box>
    </Button>
  </OSTooltip>

  // Button to go to next view ----------------------------------------------------------

  const activate_button_to_prev_view = has_views && has_view_before
  const button_to_prev_view = <OSTooltip
    placement='bottom'
    label={t('view.tooltips.PrevViewButton')}
  >
    <Box>
      <Button
        variant='button_banner_view'
        size='sizeMenuTopButton'
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
          layerStyle='banner_view_buttons'
        >
          <Box
            gridRow="1"
            padding="0.1rem 0 0.1rem 0"
          >
            {icon_previous}
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
    <Button
      variant='button_banner_view'
      size='sizeMenuTopButton'
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
        layerStyle='banner_view_buttons'
      >
        <Box
          gridRow="1"
          padding="0.1rem 0 0.1rem 0"
        >
          {icon_next}
        </Box>
        <Box
          gridRow="2"
        >
          {t('Menu.nextView')}
        </Box>
      </Box>
    </Button>
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
    <Button
      variant='button_banner_view'
      size='sizeMenuTopButton'
      isDisabled={!activate_button_to_show_view_attr_transfert_modal}
      onClick={
        () => {
          menu_configuration_osp.ref_to_modal_view_attributes_switcher.current(true)
        }
      }
    >
      <Box
        layerStyle='banner_view_buttons'
      >
        <Box
          gridRow="1"
          padding="0.1rem 0 0.1rem 0"
        >
          {icon_attr_view}
          {
            (!has_sankey_plus) ?
              logo_locked
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
  </OSTooltip>

  const button_to_show_modal_create_unitary_view = <OSTooltip
    placement='bottom'
    label={
      (!has_sankey_plus) ?
        (t('Menu.sankeyOSPDisabled')) :
        t('view.tooltips.buttonOpenModalUnitary')
    }>
    <Button
      variant='button_banner_view'
      size='sizeMenuTopButton'
      isDisabled={!has_sankey_plus}
      onClick={
        () => {
          menu_configuration_osp.ref_show_modal_unitary_view.current(true)
        }
      }>
      <Box layerStyle='banner_view_buttons' >
        <Box
          gridRow="1"
          padding="0.1rem 0 0.1rem 0"
        >
          {icon_unit_view}
          {
            (!has_sankey_plus) ? logo_locked : <></>}
        </Box>
        <Box gridRow="2" >
          {t('view.unit')}
        </Box>
      </Box>
    </Button>
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
    <Button
      variant='button_banner_view'
      size='sizeMenuTopButton' isDisabled={!activate_create_data_catalog}
      onClick={
        () => {
          if (ref_to_input_loader_json_catalog.current) {
            ref_to_input_loader_json_catalog.current.name = ''
            ref_to_input_loader_json_catalog.current.click()
          }
        }}
    >
      <Box
        layerStyle='banner_view_buttons'
      >
        <Box
          gridRow="1"
          padding="0.1rem 0 0.1rem 0"
        >
          {icon_copy}
          {
            (!has_sankey_plus) ?
              logo_locked
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
      for (let i = 0; i < files.length; i++) {
        decompressUploadedFileUniversal(files[i]).then(JSON_data => {
          // Extract view of files
          app_data.sendWaitingToast(
            () => {
              drawing_area_plus.bypass_redraws = true
              const v = app_data.createNewView(files[i].name, false)
              // const drawing_area_view = app_data.createNewDrawingArea(files[i].name)
              // drawing_area_view.bypass_redraws = true //this.drawing_area.bypass_redraws
              v.fromJSON(JSON_data as Type_JSON)
              // drawing_area_view.nodePositioning.arrangeTrade(false)
              // app_data.views[files[i].name] = drawing_area_view
              // app_data.pushViewIdInViewOrder(files[i].name)
              app_data.menu_configuration.updateAllMenuComponents()
              app_data.menu_configuration_osp.updateComponentRelatedToViews()
              app_data.menu_configuration.updateComponentSaveDiagramJSON()
            })
        })
      }
    }}
  />

  const style : React.CSSProperties = is_static ? {} : {
    position: 'fixed',
    top: drawing_area_plus.getNavBarHeight() + drawing_area_plus.fit_margin,
    zIndex: '1',
    background: 'white',
    border: '1px solid',
    borderRadius: '4px',
    width: 'fit-content',
    left: '50%',
    transform: 'translate(-50%)'
  }

  // ButtonsGrooup doesn't have variant so we set style here
  const buttonGroupView = <ButtonGroup
    className='BannerView'
    style={style}
  >
    {/* Load + Save  */}
    {is_static || !app_data.has_sankey_plus ? <></> : input_loader_json_catalog}
    {is_static || !app_data.has_sankey_plus? <></> : create_data_catalog}

    {/* Return to Sankey master button */}
    {is_static ? <></> : button_to_return_to_master}

    {/* Create, switch between or delete views */}
    {is_static || !app_data.has_sankey_plus ? <></> : button_to_create_view}
    {button_to_prev_view}
    {button_to_next_view}
    <Box
      height='3rem'
      gridColumnEnd='span 4'
      alignSelf='center'
      alignContent='center'
    >
      <SelecteurView new_data_plus={app_data} />

    </Box>
    {
      app_data.is_static || !app_data.has_sankey_plus ?
        <></> :
        <>
          {button_to_delete_actual_view}
          {button_to_show_view_attr_transfert_modal}
          {button_to_show_modal_create_unitary_view}
        </>
    }
    {app_data.is_static ? <></>:<Button
      variant='button_collapse_banner_view'
      size='sizeMenuTopButton'
      onClick={onToggle}>
      {isOpen ? icon_collapse_up : icon_collapse_down}
    </Button>}
  </ButtonGroup>

  const buttonShowBanner = <OSTooltip placement='bottom' label={''}>
    <Button
      variant={isOpen ? 'menutop_button_view_activated' : 'menutop_button'}
      size='sizeMenuTopButton'
      onClick={onToggle}
    >
      <Box
        layerStyle='menutop_button_style'
      >
        <Box
          gridRow='1'
          padding='0.1rem 0 0.1rem 0'
        >
          {logo_view}
        </Box>
        <Box
          gridRow='2'
        >
          {t(('Menu.view'))}
        </Box>
      </Box>
    </Button>
  </OSTooltip>
  if (app_data.is_static && app_data.has_views) return <>{buttonGroupView}</>
  else if (!app_data.is_static) return <>
    {buttonShowBanner}
    <Fade in={isOpen} style={{ display: isOpen ? 'unset' : 'none' }} >
      {buttonGroupView}
    </Fade>
  </>
  return <></>
}

/**
 * View selector for navbar or menuconfig
 * @param {*} {
 *   new_data_plus
 * }
 * @return {*}
 */
export const SelecteurView = (
  { new_data_plus }: { new_data_plus: Class_ApplicationData }
) => {
  const { t } = new_data_plus
  const drawing_area_plus = new_data_plus.drawing_area as Class_DrawingAreaOSP

  const [s_select_or_edit, sSelectOrEdit] = useState<'edit' | 'select'>('select')

  const cur_view = drawing_area_plus
  const has_sankey_plus = new_data_plus.has_sankey_plus
  const has_views = new_data_plus.has_views
  const is_view_master = new_data_plus.is_view_master

  // JSX elements -----------------------------------------------------------------------

  const selecteur = <Select
    variant='view_select'
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
        new_data_plus.menu_configuration_osp.updateComponentRelatedToViews()
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
      Object.entries(new_data_plus.views_dict).filter(([key]) => key !== default_main_sankey_id)
        .map(([, view]) => {
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
    default_value={cur_view.name}
    function_on_blur={(_) => {
      // Update text for links
      if ((_ !== undefined) && (_ !== null)) {
        cur_view.name = _
      }
      // Update this menu
      sSelectOrEdit('select')
      // Update views components
      new_data_plus.menu_configuration_osp.updateComponentRelatedToViews()
    }}
    disabled={!has_views}
  />
  return ((s_select_or_edit === 'edit') || (!has_views)) ? text_input : selecteur
}

/**
 * Content for view config in menu configuration
 * @param {*} {
 *   new_data_plus,
 * }
 * @return {*}
 */
export const ViewsConfig = (
  { app_data }: { app_data: Class_ApplicationData }
) => {

  // Data -------------------------------------------------------------------------------

  const { t, icon_library, menu_configuration_osp, drawing_area } = app_data
  const { icon_remove_element, icon_move_element_up, icon_move_element_down } = icon_library

  // Components updaters ----------------------------------------------------------------

  const [, setCount] = useState(0)
  const refreshThis = () => setCount(a => a + 1)
  menu_configuration_osp.ref_to_views_config_updater.current = refreshThis

  // Local variables --------------------------------------------------------------------
  const drawing_area_plus = drawing_area as Class_DrawingAreaOSP
  const is_activated = app_data.has_sankey_plus
  const curr_view = drawing_area_plus
  const list_view = app_data.views_order //include master

  // JSX elements -----------------------------------------------------------------------

  // Popover used to select a view or master we want to take the layout from. (color,font-size,position,...)

  return <WrapperBoxSubSectionMenu new_data={app_data} title={t('view.storytelling')}>
    <Box layerStyle='menuconfigpanel_grid'>

      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('view.select')}
        </Box>
        <InputGroup
          variant='menuconfigpanel_option_input'>
          <SelecteurView new_data_plus={app_data} />
        </InputGroup>
      </Box>
      <Table variant='table_view' size='sm'>
        <Thead>
          <Tr>
            <Th>{t('view.name')}</Th>
            <Th>Position</Th>
            <Th>{t('view.delete')}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {list_view.map((view_id, idx) => {
            return (
              <React.Fragment key={idx}>
                <Tr style={{ 'border': (view_id === curr_view.id) ? '2px solid #5a9282' : 'none' }}>
                  <Td>
                    <Input
                      variant='menuconfigpanel_option_input'
                      value={app_data.views_dict[view_id].name}
                      isDisabled={!is_activated || (view_id == default_main_sankey_id)}
                      onChange={evt => {
                        app_data.views_dict[view_id].name = evt.target.value
                        refreshThis()
                      }}
                      onBlur={() => {
                        menu_configuration_osp.updateComponentRelatedToViews()
                      }}
                    />
                  </Td>
                  <Td>
                    {/* Change the position of the view in the liste of view from master data */}
                    <Button variant='menuconfigpanel_option_button_in_table' isDisabled={!is_activated || (view_id == default_main_sankey_id)}
                      onClick={() => { app_data.moveViewUpInOrder(view_id); menu_configuration_osp.updateComponentRelatedToViews() }}
                    >
                      {icon_move_element_up}
                    </Button>
                    <Button variant='menuconfigpanel_option_button_in_table' isDisabled={!is_activated || (view_id == default_main_sankey_id)}
                      onClick={() => { app_data.moveViewDownInOrder(view_id); menu_configuration_osp.updateComponentRelatedToViews() }}
                    >
                      {icon_move_element_down}
                    </Button>
                  </Td>
                  <Td>
                    <Button
                      variant='menuconfigpanel_del_button_in_table'
                      isDisabled={!is_activated || (view_id == default_main_sankey_id)}
                      onClick={
                        // Delete the view
                        () => {
                          app_data.deleteView(view_id)
                          menu_configuration_osp.updateComponentRelatedToViews()
                        }
                      }
                    >
                      {icon_remove_element}
                    </Button>
                  </Td>
                </Tr>
              </React.Fragment>
            )
          })}
        </Tbody>
      </Table>
    </Box>

  </WrapperBoxSubSectionMenu>
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

// export const MenuPreferenceViewOSP: FC<BaseComponentPropsPlus> = (
//   { new_data_plus }
// ) => {
//   const [, setCount] = useState(0)
//   new_data_plus.menu_configuration.ref_to_checkbox_pref_view_updater.current = () => setCount(a => a + 1)
//   const { t } = new_data_plus
//   return <Checkbox
//     variant='menuconfigpanel_option_checkbox'
//     isDisabled={!new_data_plus.has_sankey_plus}
//     ref={new_data_plus.checkbox_refs['Vis']}
//     isChecked={new_data_plus.menu_configuration.isGivenAccordionShowed('Vis')}
//     onChange={() => {
//       new_data_plus.menu_configuration.toggleGivenAccordion('Vis')
//       setCount(a => a + 1)
//     }}>
//     {t('view.storytelling')}
//   </Checkbox>
// }

/**
 * Modal to ask user if he want to save unsaved view change before switching view
 *
 * @param {*} {new_data_plus}
 * @return {*}
 */
export const ModalViewNotSavedOSP: FC<BaseComponentPropsPlus> = (
  { new_data_plus }
) => {

  const { t } = new_data_plus
  const [show_modal, setShowModal] = useState(false)
  new_data_plus.menu_configuration_osp.dict_setter_show_dialog_plus.ref_setter_show_menu_view_not_saved.current = setShowModal

  return (
    <Modal
      isCentered
      isOpen={show_modal}
      onClose={() => null}
      variant='modal_dialog'
    >
      <ModalOverlay />
      <ModalContent
        maxWidth='inherit'
      >
        <ModalHeader>
          {t('view.ns')}
        </ModalHeader>
        <ModalBody
          textStyle='h4'
        >
          {t('view.warn_ns')}
        </ModalBody>
        <ModalFooter>
          <ButtonGroup>
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
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>)
}

export const ModalTransparentViewAttrOSP: FC<BaseComponentPropsPlus> = (
  { new_data_plus }
): JSX.Element => {

  const { t, icon_library } = new_data_plus
  const {
    icon_activated,
    icon_unactivated
  } = icon_library
  const [state, setState] = useState(false)
  const [, setUpdater] = useState(0)
  const show_modal = state
  // const update_modes = state.update_modes

  const switchThis = (_: boolean) => {
    setState(_)
  }
  const drawing_area_plus = new_data_plus.drawing_area as Class_DrawingAreaOSP
  new_data_plus.menu_configuration_osp.ref_to_modal_view_attributes_switcher.current = switchThis

  const updateComponent = () => {
    setUpdater(a => a + 1)
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
      variant='modal_dialog'
    >
      <ModalContent
        maxWidth='inherit'
      >
        <ModalHeader>{t('view.setTransparentAttr')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box
            display='grid'
            gridAutoFlow='row'
            gridRowGap='0.25rem'
            height='100%'
          >
            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_option_name'>
                {t('Menu.Transformation.Topology')}
              </Box>
              <Box layerStyle='options_4cols'>
                <Button
                  variant={
                    drawing_area_plus.heredited_attr.includes('addNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                  onClick={() => {
                    if (!drawing_area_plus.heredited_attr.includes('addNode')) {
                      drawing_area_plus.heredited_attr.push('addNode')
                    } else {
                      drawing_area_plus.heredited_attr.splice(drawing_area_plus.heredited_attr.indexOf('addNode'), 1)
                    }
                    updateComponent()
                  }}
                >
                  {t('Menu.Transformation.addNode')}
                </Button>

                <Button
                  variant={drawing_area_plus.heredited_attr.includes('removeNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                  onClick={() => {
                    if (!drawing_area_plus.heredited_attr.includes('removeNode')) {
                      drawing_area_plus.heredited_attr.push('removeNode')
                    } else {
                      drawing_area_plus.heredited_attr.splice(drawing_area_plus.heredited_attr.indexOf('removeNode'), 1)
                    }
                    updateComponent()
                  }}
                >
                  {t('Menu.Transformation.removeNode')}
                </Button>

                <Button
                  variant={drawing_area_plus.heredited_attr.includes('addFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                  onClick={() => {
                    if (!drawing_area_plus.heredited_attr.includes('addFlux')) {
                      drawing_area_plus.heredited_attr.push('addFlux')
                    } else {
                      drawing_area_plus.heredited_attr.splice(drawing_area_plus.heredited_attr.indexOf('addFlux'), 1)
                    }
                    updateComponent()
                  }}
                >
                  {t('Menu.Transformation.addFlux')}
                </Button>
                <Button
                  variant={drawing_area_plus.heredited_attr.includes('removeFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                  onClick={() => {
                    if (!drawing_area_plus.heredited_attr.includes('removeFlux')) {
                      drawing_area_plus.heredited_attr.push('removeFlux')
                    } else {
                      drawing_area_plus.heredited_attr.splice(drawing_area_plus.heredited_attr.indexOf('removeFlux'), 1)
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
                  variant={drawing_area_plus.heredited_attr.includes('posNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                  onClick={() => {
                    if (!drawing_area_plus.heredited_attr.includes('posNode')) {
                      drawing_area_plus.heredited_attr.push('posNode')
                    } else {
                      drawing_area_plus.heredited_attr.splice(drawing_area_plus.heredited_attr.indexOf('posNode'), 1)
                    }
                    updateComponent()
                  }}>
                  {t('Menu.Transformation.PosNoeud')}
                </Button>
                <Button
                  variant={drawing_area_plus.heredited_attr.includes('posFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                  onClick={() => {
                    if (!drawing_area_plus.heredited_attr.includes('posFlux')) {
                      drawing_area_plus.heredited_attr.push('posFlux')
                    } else {
                      drawing_area_plus.heredited_attr.splice(drawing_area_plus.heredited_attr.indexOf('posFlux'), 1)
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
                  variant={drawing_area_plus.heredited_attr.includes('Values') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                  onClick={() => {
                    if (!drawing_area_plus.heredited_attr.includes('Values')) {
                      drawing_area_plus.heredited_attr.push('Values')
                    } else {
                      drawing_area_plus.heredited_attr.splice(drawing_area_plus.heredited_attr.indexOf('Values'), 1)
                    }
                    updateComponent()
                  }}
                >
                  {drawing_area_plus.heredited_attr.includes('Values') ? icon_activated : icon_unactivated}
                </Button>
              </Box>

            </Box>

            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Attribut')}</Box>
              <Box as='span' layerStyle='options_4cols'>
                <Button
                  variant={drawing_area_plus.heredited_attr.includes('attrNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                  onClick={() => {
                    if (!drawing_area_plus.heredited_attr.includes('attrNode')) {
                      drawing_area_plus.heredited_attr.push('attrNode')
                    } else {
                      drawing_area_plus.heredited_attr.splice(drawing_area_plus.heredited_attr.indexOf('attrNode'), 1)
                    }
                    updateComponent()
                  }}
                >
                  {t('Menu.Transformation.attrNode')}
                </Button>

                <Button
                  variant={drawing_area_plus.heredited_attr.includes('attrFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                  onClick={() => {
                    if (!drawing_area_plus.heredited_attr.includes('attrFlux')) {
                      drawing_area_plus.heredited_attr.push('attrFlux')
                    } else {
                      drawing_area_plus.heredited_attr.splice(drawing_area_plus.heredited_attr.indexOf('attrFlux'), 1)
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
                  variant={drawing_area_plus.heredited_attr.includes('tagNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                  onClick={() => {
                    if (!drawing_area_plus.heredited_attr.includes('tagNode')) {
                      drawing_area_plus.heredited_attr.push('tagNode')
                    } else {
                      drawing_area_plus.heredited_attr.splice(drawing_area_plus.heredited_attr.indexOf('tagNode'), 1)
                    }
                    updateComponent()
                  }}
                >
                  {t('Menu.Transformation.tagNode')}
                </Button>
                <Button
                  variant={drawing_area_plus.heredited_attr.includes('tagFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                  onClick={() => {
                    if (!drawing_area_plus.heredited_attr.includes('tagFlux')) {
                      drawing_area_plus.heredited_attr.push('tagFlux')
                    } else {
                      drawing_area_plus.heredited_attr.splice(drawing_area_plus.heredited_attr.indexOf('tagFlux'), 1)
                    }
                    updateComponent()
                  }}
                >
                  {t('Menu.Transformation.tagFlux')}
                </Button>
                <Button
                  variant={drawing_area_plus.heredited_attr.includes('tagData') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                  onClick={() => {
                    if (!drawing_area_plus.heredited_attr.includes('tagData')) {
                      drawing_area_plus.heredited_attr.push('tagData')
                    } else {
                      drawing_area_plus.heredited_attr.splice(drawing_area_plus.heredited_attr.indexOf('tagData'), 1)
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
                  variant={drawing_area_plus.heredited_attr.includes('tagLevel') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                  onClick={() => {
                    if (!drawing_area_plus.heredited_attr.includes('tagLevel')) {
                      drawing_area_plus.heredited_attr.push('tagLevel')
                    } else {
                      drawing_area_plus.heredited_attr.splice(drawing_area_plus.heredited_attr.indexOf('tagLevel'), 1)
                    }
                    updateComponent()
                  }}
                >
                  {drawing_area_plus.heredited_attr.includes('tagLevel') ? icon_activated : icon_unactivated}
                </Button>
              </Box>
            </Box>

            <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
              <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.attrGeneral')}</Box>

              <Box as='span' layerStyle='options_4cols'>
                <Button
                  variant={drawing_area_plus.heredited_attr.includes('attrGeneral') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                  onClick={() => {
                    if (!drawing_area_plus.heredited_attr.includes('attrGeneral')) {
                      drawing_area_plus.heredited_attr.push('attrGeneral')
                    } else {
                      drawing_area_plus.heredited_attr.splice(drawing_area_plus.heredited_attr.indexOf('attrGeneral'), 1)
                    }
                    updateComponent()
                  }}
                >
                  {drawing_area_plus.heredited_attr.includes('attrGeneral') ? icon_activated : icon_unactivated}
                </Button>
              </Box>
            </Box>
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button
            onClick={() => {
              const master_view = new_data_plus.master_view
              if (master_view) {
                drawing_area_plus.updateFrom(master_view, drawing_area_plus.heredited_attr)
                new_data_plus.draw()
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

/**
 * Modal to generate unitary sankey either from local sankey or from excel file
 *
 * @param {*} { new_data_plus }
 * @return {*}  {JSX.Element}
 */
export const ModalCreateUnitaryViewOSP: FC<BaseComponentPropsPlus> = (
  { new_data_plus }
): JSX.Element => {

  const { t } = new_data_plus

  const [state, setState] = useState(false)
  const [, setUpdater] = useState(0)

  const switchThis = (_: boolean) => {
    setState(_)
  }

  new_data_plus.menu_configuration_osp.ref_show_modal_unitary_view.current = switchThis

  const updateComponent = () => {
    setUpdater(a => a + 1)
  }
  new_data_plus.menu_configuration_osp.ref_update_modal_unitary_view.current = updateComponent

  const has_sankey_plus = new_data_plus.has_sankey_plus

  if (has_sankey_plus) {

    return <Modal
      isOpen={state}
      onClose={
        () => {
          switchThis(false)
        }}
      variant='modal_dialog'
    >
      <ModalOverlay />
      <ModalContent w={'33%'} >
        <ModalHeader>{t('view.create_unit')}</ModalHeader>
        <ModalCloseButton />
        <ModalBody w={'unset'}>
          <Tabs isFitted variant='tabs_data_source_for_unitary' >
            <TabList>
              <Tab>{t('view.unit_tab_local')}</Tab>
              <Tab>{t('view.unit_tab_excel')}</Tab>
            </TabList>
            <TabPanels>
              <TabPanel><TabLocalDataForUnitary new_data_plus={new_data_plus} /></TabPanel>
              <TabPanel><TabImportExcelDataForUnitary new_data_plus={new_data_plus} /></TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
      </ModalContent>
    </Modal>
  }
  return <></>
}

/**
 * Tab to create unitary sankey from local sankey
 *
 * @param {*} { new_data_plus }
 * @return {*} 
 */
const TabLocalDataForUnitary: FC<{ new_data_plus: Class_ApplicationData }> = ({ new_data_plus }) => {
  const { t } = new_data_plus
  const drawing_area_plus = new_data_plus.drawing_area as Class_DrawingAreaOSP

  const list_selected_nodes_for_unitary = useRef<Class_NodeElement[]>([])
  const [, setUpdater] = useState(0)
  const entries_for_nodes: typeElementSelectable = drawing_area_plus.sankey.visible_nodes_list_sorted.map((d) => { return { 'label': d.name, 'value': d.id, selected: list_selected_nodes_for_unitary.current.includes(d) } })

  const updateComponent = () => {
    setUpdater(a => a + 1)
  }

  return <Box display={'grid'} gridRowGap='0.2rem'>
    <FilterWrapperBox app_data={new_data_plus} title={t('view.title_rule_modal_unit')}>
      <ul style={{ display: 'grid', gridRowGap: '0.2rem' }}>
        <li>-{t('view.rule_modal_unit_1')}</li>
        <li>-{t('view.rule_modal_unit_2')}</li>
        <li>-{t('view.rule_modal_unit_3')}</li>
      </ul>
    </FilterWrapperBox>

    {/* LevelTagFilter for current imported data */}
    <LevelTagFilter app_data={new_data_plus} />

    {/* List of visible node for current imported data 
      (visible as it would be visible if imported data were displayed, depend in majority to level tag)*/}
    <OSMultiSelect
      t={t}
      elements={entries_for_nodes}
      onClick={(entries: typeElementSelectable) => {
        // Update selection list
        const entries_values = entries.map(d => d.value)
        drawing_area_plus.sankey.nodes_list.forEach(n => {
          if (entries_values.includes(n.id) && !list_selected_nodes_for_unitary.current.includes(n)) {
            list_selected_nodes_for_unitary.current.push(n)
          } else if (!entries_values.includes(n.id) && list_selected_nodes_for_unitary.current.includes(n)) {
            const n_to_del = list_selected_nodes_for_unitary.current.indexOf(n)
            list_selected_nodes_for_unitary.current.splice(n_to_del, 1)
          }

        })
        // Update all menus
        updateComponent()
      }}
    />

    {/* Button to create unitary sankey from selected nodes */}
    <OSTooltip label={list_selected_nodes_for_unitary.current.length == 0 ? t('view.dis_createFromSelected') : ''}>
      <Button
        variant='btn_create_unitary_from_nodes'
        isDisabled={list_selected_nodes_for_unitary.current.length == 0}
        onClick={() => {
          new_data_plus.sendWaitingToast(
            () => {
              list_selected_nodes_for_unitary.current.forEach(element => {
                new_data_plus.createUnitaryNewView(element)
              })
              new_data_plus.menu_configuration_osp.updateComponentRelatedToViews()
              new_data_plus.menu_configuration.ref_to_save_in_cache_indicator.current(true)
            },
            {
              success: {
                title: t('toast.u_v_loaded'),
              },
              loading: {
                title: t('toast.u_v_loading'),
              }
            }
          )
        }}>
        {t('view.create')}
      </Button>
    </OSTooltip>
  </Box>
}

/**
 * Tab to create unitary sankey from sankey imported via excel file
 *
 * @param {*} { new_data_plus }
 * @return {*} 
 */
const TabImportExcelDataForUnitary = ({ new_data_plus }: { new_data_plus: Class_ApplicationData }) => {
  const { t, url_prefix } = new_data_plus
  const [input_file_blob, set_input_file_blob] = useState<Blob | undefined>(undefined)
  const [checkStatus, setCheckStatus] = useState(false)
  const [launchRetriveResult, setLaunchRetriveResult] = useState(false)
  const [file_name, set_file_name] = useState<string>('')
  const [selected_data_id, set_selected_data_id] = useState<string>('')
  const [, setUpdate] = useState(0)
  const local_app_data = useRef(new Class_ApplicationData(false))
  const list_data = useRef<{ [x: string]: { name: string, data: Type_JSON } }>({})
  const list_selected_nodes_for_unitary = useRef<Class_NodeElement[]>([])
  const entries_for_nodes: typeElementSelectable = local_app_data.current.drawing_area.sankey.visible_nodes_list_sorted.map((d) => { return { 'label': d.name, 'value': d.id, selected: list_selected_nodes_for_unitary.current.includes(d) } })

  const list_node_selected_data = local_app_data.current.drawing_area.sankey.visible_nodes_list_sorted


  // Failesafe if there is data but no selected data 
  if (Object.keys(list_data.current).length > 0 && !(selected_data_id in list_data.current)) {
    list_selected_nodes_for_unitary.current = []
    const new_sel_key = Object.keys(list_data.current)[0]
    local_app_data.current.drawing_area.fromJSON(list_data.current[new_sel_key].data)
    set_selected_data_id(new_sel_key)
  }


  // Function to retrieve data from server & add it to data list 
  const localRetriveResust = () => {
    const root = window.location.origin
    const url = root + url_prefix + 'excel/upload/retrieve_results'

    const form_data = new FormData()
    const fetchData = {
      method: 'POST',
      body: form_data
    }
    fetch(url, fetchData).then(response => {
      response.text()
        .then(text => {
          if (text === '{}')
            return
          // Extract JSON struct
          const data_as_json = JSON.parse(text) as Type_JSON
          data_as_json['version'] = local_app_data.current.version // Avoid converter process
          // Extract sankey datas from JSON
          list_data.current[makeId('data_src_')] = { name: file_name, data: data_as_json }
          setLaunchRetriveResult(false)
          set_file_name('')
        })

    })
  }

  // Function launched at the end of server process to get data from server
  if (launchRetriveResult) {
    localRetriveResust()
  }

  /**
   *Function to launch read & convert of excel file by the server 
   *
   */
  const ProcessExcelFile = () => {
    const root = window.location.origin
    const url = root + url_prefix + 'excel/upload/launch'
    const form_data = new FormData()
    form_data.append(
      'file', input_file_blob as Blob
    )
    const fetchData = {
      method: 'POST',
      body: form_data
    }
    fetch(url, fetchData).then(() => {
      setCheckStatus(true)
    })
  }

  return <Box
    layerStyle='menuconfigpanel_grid'
  >
    <Box>
      {t('Menu.input_file_excel')}
      <Input
        type="file"
        accept='.xlsx'
        height='unset'
        onChange={(evt: ChangeEvent) => {
          set_file_name((evt.target as HTMLFormElement).files[0].name)
          set_input_file_blob((evt.target as HTMLFormElement).files[0])
        }}
      />
    </Box>

    <Button
      variant="menuconfigpanel_option_button_secondary"
      onClick={ProcessExcelFile}
    >{t('Menu.ouvrir')}
    </Button>

    {/* Spinner to show there is a background process */}
    {(checkStatus || launchRetriveResult) ? <Spinner /> : <></>}

    {/* Regulary check server process to know if the function is processing /success/failed */}
    {checkStatus ? <CheckLoad new_data_plus={new_data_plus} setCheckStatus={setCheckStatus} setLaunchRetriveResult={setLaunchRetriveResult} /> : <></>}

    {/* List of data imported from excel */}
    {Object.keys(list_data.current).length > 0 ? <>
      <Select
        value={selected_data_id}
        onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
          list_selected_nodes_for_unitary.current = []
          local_app_data.current.fromJSON(list_data.current[evt.target.value].data)
          set_selected_data_id(evt.target.value)
        }}
      >
        {Object.entries(list_data.current).map((data, i) => {
          return <option key={'data_src_' + i} value={data[0]}>{data[1].name}</option>
        })}
      </Select>
    </> : <></>}

    {/* LevelTagFilter for current imported data */}
    <LevelTagFilter app_data={local_app_data.current} />

    {/* List of visible node for current imported data 
      (visible as it would be visible if imported data were displayed, depend in majority to level tag)*/}
    {list_node_selected_data.length > 0 ? <Box>
      <OSMultiSelect
        t={t}
        elements={entries_for_nodes}
        onClick={(entries: typeElementSelectable) => {
          // Update selection list
          const entries_values = entries.map(d => d.value)
          local_app_data.current.drawing_area.sankey.nodes_list.forEach(n => {
            if (entries_values.includes(n.id) && !list_selected_nodes_for_unitary.current.includes(n)) {
              list_selected_nodes_for_unitary.current.push(n)
            } else if (!entries_values.includes(n.id) && list_selected_nodes_for_unitary.current.includes(n)) {
              const n_to_del = list_selected_nodes_for_unitary.current.indexOf(n)
              list_selected_nodes_for_unitary.current.splice(n_to_del, 1)
            }
          })
          // Update component
          setUpdate(a => a + 1)
        }}
      />

      {/* Button to create unitary sankey from selected nodes */}
      <Button
        variant='btn_create_unitary_from_nodes'
        isDisabled={list_selected_nodes_for_unitary.current.length == 0}
        onClick={() => {
          new_data_plus.sendWaitingToast(
            () => {
              list_selected_nodes_for_unitary.current.forEach(element => {
                local_app_data.current.createUnitaryNewView(element)
              })
              const obj_view: Type_JSON = {}
              Object.values(local_app_data.current.views_dict).forEach(v => obj_view[v.id] = v.toJSON(false, false, true))
              new_data_plus.extractViewsFromJSON({ views: obj_view })
              new_data_plus.menu_configuration_osp.updateComponentRelatedToViews()
            },
            {
              success: {
                title: t('toast.u_v_loaded'),
              },
              loading: {
                title: t('toast.u_v_loading'),
              }
            }
          )
        }}
      >
        {t('view.create')}
      </Button>
    </Box> : <></>}
  </Box>
}

/**
 * Ghost component that check the loading process of the excel file in the server & set signal when it finish or fail
 *
 * @param {*} { new_data_plus, setCheckStatus, setLaunchRetriveResult }
 * @return {*} 
 */
const CheckLoad: FC<{
  new_data_plus: Class_ApplicationData
  setCheckStatus: (b: boolean) => void,
  setLaunchRetriveResult: (b: boolean) => void
}> = ({ new_data_plus, setCheckStatus, setLaunchRetriveResult }) => {
  const { url_prefix } = new_data_plus
  useEffect(() => {
    const interval = setInterval(() => {
      const root = window.location.origin
      const url = root + url_prefix + 'excel/upload/check_process'
      const fetchData = {
        method: 'POST',
        body: ''
      }
      fetch(url, fetchData).then(
        function (response) {
          if (response.ok) {
            response.json().then(
              function (data) {
                if (data.output.includes('FINISHED')) {
                  setCheckStatus(false)
                  setLaunchRetriveResult(true)
                } else if (data.output.includes('FAILED')) {
                  setCheckStatus(false)

                }
              }
            )
          }
        })
    }, 5000)
    return () => clearInterval(interval)
  })
  return <></>
}

export const MenuEnregistrerViewOSP: FC<BaseComponentPropsPlus> = ({
  new_data_plus
}) => {
  const [, setCount] = useState(0)
  const { t } = new_data_plus
  new_data_plus.menu_configuration_osp.ref_to_save_diagram_only_view_updater.current = () => setCount(a => a + 1)

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
