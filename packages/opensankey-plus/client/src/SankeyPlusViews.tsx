// Standard libs
import React, { ChangeEvent, FunctionComponent, useRef, useState } from 'react'
import * as d3 from 'd3'

import { TFunction } from 'i18next'
import LZString from 'lz-string'
import {
  Diff,
  diff as getDiff,
  applyChange
} from 'deep-diff'

import { FaArrowDown, FaArrowUp, FaMinus, FaCheck } from 'react-icons/fa'

// Imported libs
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faLock, faListCheck, faXmark, faExclamation, faFloppyDisk, faHome, faCaretSquareLeft, faCaretSquareRight, faPlus, faCopy, faMinus } from '@fortawesome/free-solid-svg-icons'
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
  Modal,
  ModalFooter,
  ModalHeader,
  ModalBody,
  ModalContent,
  Tag,
  ModalCloseButton
} from '@chakra-ui/react'

// OpenSankey Libs
// import { SankeyLinkValueDict, TagsGroup } from './deps/OpenSankey/types/Types'
import {
  default_main_sankey_id,
  OSTooltip,
  // preferenceCheck,
  // updateLayoutOSTyped
} from './deps/OpenSankey/types/Utils'

// Local libs
import {
  CheckCurrentViewSavedFType,
  FilterViewFType,
  GetDataFromViewFType,
  getSetDiagramFType,
  // OSPKeyHandlerFType,
  // MenuEnregistrerViewFType,
  modal_transparent_view_attrFType,
  modal_view_not_savedFType,
  OpenOSPCheckpointButtonFType,
  RecomputeViewsFType,
  OSPBannerViewFType,
  OSPMenuPreferenceViewFType,
  SelecteurViewFType,
  // setValueFType,
  viewsAccordionFType
} from '../types/SankeyPlusViewsTypes'

import {
  OSPData,
  differenceType,
  DiffType,
  ViewType,
  OSPApplicationDataType,
  SankeyUnitData
} from '../types/Types'
// import { deleteGLabel } from './SankeyPlusLabels'
import { ConfigMenuTextInput } from './deps/OpenSankey/configmenus/SankeyMenuConfiguration'

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
 *   applicationData,
 *   applicationContext,
 *   dict_hook_ref_setter_show_dialog_components,
 *   convert_data,
 *   view_selector
 * }
 * @return {*}
 */
export const OSPBannerView: FunctionComponent<OSPBannerViewFType> = ({
  applicationData
}) => {

  // Data -------------------------------------------------------------------------------

  const { new_data } = applicationData
  const { t } = new_data

  // Component updater ------------------------------------------------------------------

  // Local updater ----------------------------------------------------------------------

  const [, setCount] = useState(0)
  const refreshThis = () => {
    setCount(a => a + 1)
  }
  new_data.menu_configuration.ref_to_banner_views_updater.current = refreshThis

  // Ref to trigger other components ----------------------------------------------------

  const { ref_setter_show_modal_transparent_view_attr } = new_data.menu_configuration.dict_setter_show_dialog_plus
  const ref_to_input_loader_json_catalog = useRef<HTMLInputElement>(null) as { current: HTMLInputElement; }

  // Local variables --------------------------------------------------------------------

  const has_sankey_plus = new_data.has_sankey_plus
  const has_views = new_data.has_views
  const is_view_master = new_data.is_view_master
  const has_view_before = new_data.has_view_before
  const has_view_after = new_data.has_view_after

  // Button to create a view ------------------------------------------------------------

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
        isDisabled={!has_sankey_plus}
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
                // 'opacity': (!has_sankey_plus) ? '0.6' : '1'
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
        isDisabled={!(has_sankey_plus && has_views && !is_view_master)}
        onClick={
          // Delete the view
          () => {
            new_data.deleteCurrentView()
            // TODO update menus & view selection
            // let ind = -1
            // master_data!.view.map((v, i) => {
            //   ind = (v.id === view) ? i : ind
            // })
            // master_data!.view.splice(ind, 1)
            // // If master is not a catalog & we delete the current view then we go to master
            // // If master is a catalog and the catalog of view is empty then we got to master
            // if ((master_data!.current_view === view && master_data!.is_catalog === false) || (master_data!.view.length === 0 && master_data!.is_catalog === true)) {
            //   set_view('none')
            //   set_data(JSON.parse(JSON.stringify(master_data)))
            // } else if (master_data!.is_catalog && master_data!.view.length > 0) {
            //   // If master is a catalog and the catalog is not empty then we got to the first view
            //   set_view(master_data!.view[0].id)
            //   const tmp = GetDataFromView(master_data, master_data!.view[0].id) as OSPData
            //   if (!tmp.accordeonToShow.includes('Vis')) {
            //     tmp.accordeonToShow.push('Vis')
            //   }
            //   set_data(JSON.parse(JSON.stringify(tmp)))
            // }
            // if (master_data!.view.length === 0) {
            //   master_data!.is_catalog = false
            //   set_data(JSON.parse(JSON.stringify(master_data)))
            // }
            // set_master_data({ ...master_data! })
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

  const button_to_return_to_master = <OSTooltip
    placement='bottom'
    label={
      (!has_sankey_plus) ?
        t('Menu.sankeyOSPDisabled') :
        t('view.tooltips.home')}
  >
    <Box>
      <Button
        variant='menutop_button'
        isDisabled={!(has_sankey_plus && has_views && !is_view_master)}
        onClick={() => {
          const evt = document
          const evt_key_f7 = new KeyboardEvent('keydown', { key: 'F7'})
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
            {t('Menu.home')}
          </Box>
        </Box>
      </Button>
    </Box>
  </OSTooltip>

  // Button to go to next view ----------------------------------------------------------

  const button_to_prev_view = <OSTooltip
  placement='bottom'
  label={
    (!has_sankey_plus) ?
      t('Menu.sankeyOSPDisabled') :
      t('view.tooltips.PrevViewButton')
  }
>
  <Box>
    <Button
      variant='menutop_button'
      isDisabled={!(has_sankey_plus && has_views && has_view_before)}
      onClick={() => {
        const ev = document
        const tmp = new KeyboardEvent('keydown', { key: 'F8'})
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
          {t('Menu.precView')}
        </Box>
      </Box>
    </Button>
  </Box>
</OSTooltip>

  // Button to previous view ------------------------------------------------------------

  const button_to_next_view = <OSTooltip
  placement='bottom'
  label={
    (!has_sankey_plus) ?
      (t('Menu.sankeyOSPDisabled')) :
      t('view.tooltips.NextViewButton')}
>
  <Box>
    <Button
      variant='menutop_button'
      isDisabled={!(has_sankey_plus && has_views && has_view_after)}
      onClick={() => {
        const ev = document
        const tmp = new KeyboardEvent('keydown', { key: 'F9'})
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
              // 'opacity': (next_button_disabled || !has_views) ? '0.6' : '1'
            }}
            icon={faCaretSquareRight}
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
          {t('Menu.nextView')}
        </Box>
      </Box>
    </Button>
  </Box>
</OSTooltip>

  // Button to display attributes transfert modal ---------------------------------------

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
        isDisabled={!(has_sankey_plus && has_views && !is_view_master)}
        onClick={
          () => {
            new_data.menu_configuration.ref_to_modal_view_attributes_switcher.current(true)
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
        isDisabled={!(has_sankey_plus && has_views)}
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
      // TODO implementer dans Class_DrawingArea

      // const files = (evt.target as HTMLFormElement).files
      // const cpy_master_data = (master_data) ? master_data : JSON.parse(JSON.stringify(data))
      // cpy_master_data!.is_catalog = true
      // cpy_master_data!.nodeTags = {}
      // cpy_master_data!.fluxTags = {}
      // cpy_master_data!.dataTags = {}
      // cpy_master_data!.nodes = {}
      // cpy_master_data!.links = {}
      // cpy_master_data!.labels = {}
      // cpy_master_data!.linkZIndex = []

      // // Parcours tous les element de l'objet (contient le blob des fichiers mais aussi une variable length)
      // for (const i in files) {
      //   const reader = new FileReader()
      //   reader.onload = (() => {
      //     return (e: ProgressEvent<FileReader>) => {
      //       const result = String((e.target as FileReader).result)
      //       const result_data = JSON.parse(result)
      //       const imported_data = JSON.parse(JSON.stringify(result_data)) as OSPData
      //       convert_data(imported_data, get_default_data)
      //       let new_ind = 'view_' + String(new Date().getTime())
      //       let first_data = {} as OSPData
      //       if (imported_data.view && imported_data.view.length > 0) {
      //         // Import all view from the coming file
      //         imported_data.view.forEach((v, i2) => {
      //           const view_from_imported_data = GetDataFromView(imported_data, v.id) as OSPData
      //           convert_data(view_from_imported_data, get_default_data)

      //           if (i2 === 0 && i === '0') {
      //             new_ind = v.id
      //             first_data = view_from_imported_data
      //           }
      //           cpy_master_data!.view.push({
      //             id: v.id,
      //             view_data: view_from_imported_data,
      //             nom: (files[i].name).replace('.json', '') + ' ' + v.nom,
      //             details: '',
      //             heredited_attr_from_master: []
      //           })
      //         })
      //       } else {
      //         // Import only master data  when it doesn't have view
      //         imported_data.view = []
      //         first_data = imported_data
      //         cpy_master_data!.view.push({
      //           id: new_ind,
      //           view_data: imported_data,
      //           nom: (files[i].name).replace('.json', ''),
      //           details: '',
      //           heredited_attr_from_master: []
      //         })
      //       }
      //       if (i === '0') {

      //         set_view(new_ind)
      //         cpy_master_data!.current_view = new_ind
      //         set_data(JSON.parse(JSON.stringify(first_data)))
      //       }
      //       set_master_data(JSON.parse(JSON.stringify(cpy_master_data)))

      //     }
      //   })()
      //   // Permet d'executer la transformation des blob en vues tout en evitant la var length
      //   //   files : {0:Blob,1:Blob,2:...,n:Blob, length:n-1}
      //   if (!isNaN(+i)) {
      //     reader.readAsText(files[i])
      //   }
      // }
    }}
  />

  return <>
    {/* Load + Save  */}
    {new_data.is_static ? <></> : input_loader_json_catalog}
    {new_data.is_static ? <></> : create_data_catalog}

    {/* Return to Sankey master button */}
    {new_data.is_static ? <></> : button_to_return_to_master}

    {/* Create, switch between or delete views */}
    {new_data.is_static ? <></> : button_to_create_view}
    {button_to_prev_view}
    {button_to_next_view}
    <Box
      height='3rem'
      gridColumnEnd='span 4'
      alignSelf='center'
      alignContent='center'
    >
      <SelecteurView new_data={new_data} />

    </Box>
    {
      new_data.is_static ?
        <></>:
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
 *   applicationData,
 *   applicationState,
 *   set_view_not_saved,
 * }
 * @return {*}
 */
export const SelecteurView: FunctionComponent<SelecteurViewFType> = ({
  new_data
}) => {

  // Data -------------------------------------------------------------------------------

  const { t } = new_data

  // Components updaters ----------------------------------------------------------------

  const [s_select_or_edit, sSelectOrEdit] = useState('select')

  const refreshThisAndUpdateRelatedComponents = () => {
    // Toogle saving indicator
    new_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    // Update views components
    new_data.menu_configuration.updateComponentRelatedToViews()
  }

  const ref_set_text_value_input = useRef((_: string | null | undefined) => null)

  // Local variables --------------------------------------------------------------------

  const cur_view = new_data.drawing_area
  const has_sankey_plus = new_data.has_sankey_plus
  const has_views = new_data.has_views
  const is_view_master = new_data.is_view_master

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
        new_data.setCurrentView(evt.target.value)
        refreshThisAndUpdateRelatedComponents()
        // TODO supprimer quand OK
        // multi_selected_nodes.current = []
        // multi_selected_links.current = []
        // multi_selected_label.current = []
        // // Depending on the value selected we :
        // //  - If we select a view :Get a modified version of master data according to the modifications saved in the view selected
        // //      and save original master data in a variable that the view can't modify
        // //  - If we select master('none'): Get the data we are workinkg on to be the master data

        // // Verify if we saved the view before changing the view
        // // If not, we display a modal that will warn the user with the possibility to save before exit
        // let saved = true
        // if (view !== 'none') {
        //   const difference = CheckCurrentViewSaved(master_data, data, view)
        //   if (difference.length !== 0 && !window.SankeyToolsStatic) {
        //     saved = false
        //     set_view_not_saved(view)
        //     set_view(evt.target.value)
        //   }
        // }

        // if (saved) {
        //   if (evt.target.value === '') {
        //     return
        //   } else if (evt.target.value !== 'none') {
        //     let new_master_data: OSPData
        //     if (view === 'none') {
        //       new_master_data = JSON.parse(JSON.stringify(data))
        //       RecomputeViews(new_master_data, master_data, set_master_data)
        //     } else {
        //       new_master_data = JSON.parse(JSON.stringify(master_data)) as OSPData
        //     }
        //     const data_view = GetDataFromView(new_master_data, evt.target.value) as OSPData
        //     set_data(JSON.parse(JSON.stringify(data_view)))
        //     new_master_data.current_view = evt.target.value
        //     set_master_data(JSON.parse(JSON.stringify(new_master_data)))
        //     set_view(evt.target.value)
        //   } else if (evt.target.value === 'none') {
        //     set_view(evt.target.value)
        //     set_data(JSON.parse(JSON.stringify(master_data)))
        //   }
        // }
        // sValueEditorNameView(master_data!.view.filter(v => v.id === master_data!.current_view)[0].nom)
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
      new_data.views
        .filter(view => view.id !== default_main_sankey_id)
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
      refreshThisAndUpdateRelatedComponents()
    }}
  />

  return (has_sankey_plus && s_select_or_edit === 'edit') ? text_input : selecteur
}

/**
 * Sub accordion for view config in menu configuration
 * @param {*} {
 *   applicationData,
 * }
 * @return {*}
 */
export const ViewsAccordion: FunctionComponent<viewsAccordionFType> = ({
  applicationData,
}
) => {

  // Data -------------------------------------------------------------------------------

  const { new_data } = applicationData
  const { t } = new_data

  // Components updaters ----------------------------------------------------------------

  const [, setCount] = useState(0)
  const refreshThis = () => setCount(a => a + 1)
  new_data.menu_configuration.ref_to_accordion_views_updater.current = refreshThis

  // Local variables --------------------------------------------------------------------

  const is_activated = new_data.has_sankey_plus
  const curr_view = new_data.drawing_area
  const list_view = new_data.views //include master

  // JSX elements -----------------------------------------------------------------------

  // Popover used to select a view or master we want to take the layout from. (color,font-size,position,...)

  return <>
    <AccordionItem
      style={{ 'display': (new_data.menu_configuration.accordions_to_show.includes('Vis')) ? 'initial' : 'none' }}
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
              <SelecteurView new_data={new_data} />
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
              {list_view.map(d => {
                return (
                  <Tr style={{ 'border': (d.id === curr_view.id) ? '2px solid #5a9282' : 'none' }}>
                    <Td>
                      <Input
                        variant='menuconfigpanel_option_input'
                        value={d.name}
                        isDisabled={!is_activated || (d.id == default_main_sankey_id)}
                        onChange={evt => {
                          d.name = evt.target.value
                          new_data.menu_configuration.updateComponentRelatedToViews()
                        }}
                      />
                    </Td>
                    <Td>
                      {/* Change the position of the view in the liste of view from master data */}
                      <Button variant='menuconfigpanel_option_button_in_table' isDisabled={!is_activated || (d.id == default_main_sankey_id)}
                        onClick={() => { new_data.moveViewUpInOrder(d.id); new_data.menu_configuration.updateComponentRelatedToViews() }}
                      ><FaArrowUp />
                      </Button>
                      <Button variant='menuconfigpanel_option_button_in_table' isDisabled={!is_activated || (d.id == default_main_sankey_id)}
                        onClick={() => { new_data.moveViewDownInOrder(d.id); new_data.menu_configuration.updateComponentRelatedToViews() }}
                      ><FaArrowDown />
                      </Button>
                    </Td>
                    <Td><Button
                      variant='menuconfigpanel_del_button_in_table'
                      isDisabled={!is_activated || (d.id == default_main_sankey_id)}
                      onClick={
                        // Delete the view
                        () => {
                          new_data.deleteView(d.id)
                          new_data.menu_configuration.updateComponentRelatedToViews()
                        }
                      }
                    ><FaMinus /></Button></Td>
                  </Tr>
                )
              })}
            </Tbody>
          </Table>
        </Box>


      </AccordionPanel>
    </AccordionItem>
    {/*
    <Input
      type="file"
      ref={_load_json}
      style={{ display: 'none' }}
      onChange={(evt: ChangeEvent) => {
        const files = (evt.target as HTMLFormElement).files
        const reader = new FileReader()

        // Load a view from a JSON
        // reader.onload = (() => {
        //   return (e: ProgressEvent<FileReader>) => {
        //     const result = String((e.target as FileReader).result)
        //     const result_data = JSON.parse(result)
        //     let ind = -1
        //     master_data!.view.map((v, i) => {
        //       ind = (v.id === _load_json.current?.id) ? i : ind
        //     })
        //     const cur_view = master_data!.view[ind]
        //     const imported_data = JSON.parse(JSON.stringify(result_data))
        //     imported_data.view = []
        //     convert_data(imported_data, DefaultSankeyData)
        //     let difference = getDiff(master_data, imported_data)
        //     difference = JSON.parse(
        //       JSON.stringify(
        //         (difference !== undefined) ?
        //           difference : []
        //       )
        //     )
        //     difference = (difference as Diff<undefined, OSPData>[]).filter((d) => !(d.path!.includes('view')))
        //     cur_view.view_data = { diff: difference }

        //     cur_view.nom = (files[0].name).replace('.json', '')

        //     set_master_data(JSON.parse(JSON.stringify(master_data)))
        //     set_data(JSON.parse(JSON.stringify(imported_data)))
        //     set_view(cur_view.id)
        //   }
        // })()
        reader.readAsText(files[0])
      }}
    /> */}
  </>
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

// TODO Voir si toujours utile
// export const GetDataFromView: GetDataFromViewFType = (
//   master_data: OSPData | undefined,
//   id_view_to_see: string
// ) => {
//   // Copy master data
//   if (!master_data) {
//     alert('sankey master undefined')
//     return undefined
//   }
//   const copy_master_data = JSON.parse(JSON.stringify(master_data))
//   copy_master_data.view = []
//   let data_init = JSON.parse(JSON.stringify(copy_master_data)) as OSPData
//   // Get the difference from the view
//   if (master_data.view.filter(v => v.id === id_view_to_see).length === 0) {
//     alert('view not found')
//     return data_init
//   }
//   const view_object = master_data.view.filter(v => v.id === id_view_to_see)[0]

//   if ((view_object.view_data as DiffType).diff) {
//     const diff_view = (view_object.view_data as DiffType).diff
//     if (!diff_view) {
//       return data_init
//     }
//     diff_view.forEach((d) => applyChange(data_init, {}, d))
//   } else {
//     data_init = view_object.view_data as OSPData
//   }
//   updateLayoutOSTyped(data_init, master_data, view_object.heredited_attr_from_master)
//   // updateLayout(data_init,master_data,view_object.heredited_attr_from_master)
//   return data_init
// }


// TODO Voir si toujours utile
// export const FilterView: FilterViewFType = (pre_diff) => {
//   return JSON
//     .parse(JSON.stringify(pre_diff))
//     .filter((d: { path: string[] }) => {
//       return !d.path.includes('view')
//     })
//     .map((d: { path: string[], kind: string, item: { kind: string } }) => {
//       if (d.kind === 'D') {
//         delete ((d as unknown) as differenceType).lhs
//       }
//       if (d.kind === 'A' && d.item.kind === 'D') {
//         delete ((d as unknown) as differenceType).item.lhs
//       }
//       if (d.kind === 'E') {
//         delete ((d as unknown) as differenceType).lhs
//       }
//       return d as Diff<undefined, OSPData>
//     })
// }


// TODO Voir si toujours utile
// export const RecomputeViews: RecomputeViewsFType = (
//   new_master_data: OSPData | undefined,
//   prev_master_data: OSPData | undefined,
//   set_master_data: (d: OSPData | undefined,) => void
// ) => {
//   if (prev_master_data) {
//     new_master_data!.view.forEach(current_v => {
//       if (prev_master_data.view.filter(v => v.id === current_v.id).length === 0) {
//         return
//       }
//       const data_view = GetDataFromView(prev_master_data, current_v.id) as OSPData

//       if ((current_v.view_data as OSPData).version) {
//         current_v.view_data = data_view
//       }
//       else {
//         let difference = getDiff(new_master_data, data_view)
//         difference = (difference !== undefined) ? difference : []
//         difference = FilterView(difference)
//         if (difference.length > 0) {
//           (current_v.view_data as DiffType).diff = difference
//         }
//       }
//     })
//   }
//   // master data is now set
//   set_master_data({ ...JSON.parse(JSON.stringify(new_master_data)) })
// }

// TODO Plus necessaire à supprimer si nouvelle implementation OK
// export const OSPKeyHandler: OSPKeyHandlerFType = (
//   applicationContext,
//   e: KeyboardEvent,
//   applicationData,
//   applicationState,
//   dict_hook_ref_setter_show_dialog_components,
//   reDrawOSPLabels,
//   ComponentUpdater
// ) => {
//   const { t, has_open_sankey_plus } = applicationContext
//   const { data, set_data, master_data, set_master_data, view, set_view, set_view_not_saved } = applicationData
//   const { multi_selected_label } = applicationState
//   const { updateMenus } = ComponentUpdater
//   const is_master = applicationData.view === 'none'
//   if (e.key === 'a' && e.ctrlKey) {
//     e.preventDefault()
//     multi_selected_label.current = Object.values(data.labels)
//     reDrawOSPLabels(multi_selected_label.current)
//     ComponentUpdater.updateComponentMenuConfigZdt.current.forEach(f => f())
//   }
//   // Clone current data,if its a view clone the view
//   if (has_open_sankey_plus && e.key === 'x' && (e.ctrlKey || e.metaKey)) {
//     e.preventDefault()

//     if (is_master) {
//       // If we do a control+X while we are on is_master data, we create view empty
//       // data is is_master data and master_data might not be  se
//       const new_ind = 'view_' + String(new Date().getTime())
//       // const copy_data = {diff:[]}
//       const copy_data = JSON.parse(JSON.stringify(data))
//       const new_master_data = data
//       new_master_data.view.push({
//         id: new_ind,
//         view_data: copy_data,
//         nom: 'data_' + new_ind,
//         details: '',
//         heredited_attr_from_master: []
//       })
//       RecomputeViews(new_master_data, master_data, set_master_data)
//       // is_master data is now set
//       // at this stage data is a view and is equal with is_master data

//       set_view(new_ind)
//       new_master_data.current_view = new_ind
//       set_master_data({ ...new_master_data })
//       set_data({ ...copy_data })
//     } else {
//       const new_ind = 'view_' + String(new Date().getTime())
//       const current_view_object = master_data!.view.filter(v => v.id === view)[0]

//       const copy_data = JSON.parse(JSON.stringify(current_view_object.view_data))
//       master_data!.view.push({
//         id: new_ind,
//         view_data: copy_data,
//         nom: t('view.prefix_copy') + ' ' + current_view_object.nom,
//         details: '',
//         heredited_attr_from_master: []

//       })


//       // is_master data is now set
//       master_data!.current_view = new_ind
//       set_view(new_ind)
//       set_master_data({ ...master_data! })
//       // get view data & set_data to avoid synchronisation problem
//       const n_data = GetDataFromView(master_data, new_ind)
//       if (n_data) {
//         set_data(JSON.parse(JSON.stringify(n_data)))
//       }
//     }
//   }

//   if (e.key === 's' && e.ctrlKey && !e.shiftKey) {
//     e.preventDefault()

//     applicationData.function_on_wait.current = () => {
//       ComponentUpdater.updateComponenSaveInCache.current(false)

//       if (view !== 'none') {
//         // If we do a control+S while we are on a view, we save the difference between the data we are handling
//         // and the is_master data. These difference are the saved the view we are currently on
//         // Get difference between master_data and the current data then save it in view
//         let difference = getDiff(master_data, data)
//         difference = (difference !== undefined) ? difference : []
//         difference = difference.filter((d) => !(d.path!.includes('view')))
//         difference = FilterView(difference)

//         // Check wich format of the view is better optimized for memory storage
//         const raw_is_smaller_than_diff = JSON.stringify(data).length < JSON.stringify(difference).length
//         master_data!.view.filter(v => v.id === view)[0].view_data = raw_is_smaller_than_diff ? JSON.parse(JSON.stringify(data)) : { diff: difference }

//         // Save is_master data with the view we are currently working on updated
//         set_master_data({ ...master_data! })
//         // Save master_data data in localStorage
//         localStorage.setItem('data', LZString.compress(JSON.stringify(master_data)))

//       } else {
//         // Save current data (wich is master_data)
//         localStorage.setItem('data', LZString.compress(JSON.stringify(data)))
//         localStorage.setItem('last_save', 'true')
//       }
//       ComponentUpdater.updateComponenSaveInCache.current(true)

//     }


//     //dict_hook_ref_setter_show_dialog_components.ref_lauchToast.current()




//   }
//   // Changing view to is_master
//   if (!is_master && e.key === 'F7') {

//     // Check if there is unsaved change before we switch view
//     // If there is, we open the modal to know if the user want to save the current unsaved changes befor eswitching view
//     let saved = true
//     if (view !== 'none' && has_open_sankey_plus) {
//       const diff = CheckCurrentViewSaved(master_data, data, view)
//       if (diff.length > 0 && !window.SankeyToolsStatic) {
//         saved = false
//         set_view_not_saved(view)
//         set_view('none')
//       }
//     }

//     if (saved) {
//       set_view('none')
//       set_data(JSON.parse(JSON.stringify(master_data)))
//     }
//   }
//   // Changing view to next or previous
//   if (['F8', 'F9'].includes(e.key)) {
//     if (e.key === 'F8') {
//       // going backward
//       //Cherche la position de la vue sélectionné dans le tableau de vue
//       let ind = -1
//       master_data!.view.map((v, i) => {
//         ind = (v.id === view) ? i : ind
//       })
//       if (ind === -1) {
//         ind = 1
//       } else if (ind === 0) {
//         ind = Object.keys(master_data!.view).length
//       }
//       const data_view = GetDataFromView(master_data, master_data!.view[ind - 1].id) as OSPData

//       // Check if there is unsaved change before we switch view
//       // If there is, we open the modal to know if the user want to save the current unsaved changes befor eswitching view
//       let saved = true
//       if (view !== 'none' && has_open_sankey_plus) {
//         const diff = CheckCurrentViewSaved(master_data, data, view)
//         if (diff.length > 0 && !window.SankeyToolsStatic) {
//           saved = false
//           set_view_not_saved(view)
//           set_view(master_data!.view[ind - 1].id)
//         }
//       }
//       if (saved) {
//         set_data({ ...data_view as OSPData })
//         set_view(master_data!.view[ind - 1].id)
//       }

//     } else if (e.key === 'F9') {
//       let new_master_data: OSPData | undefined
//       if (is_master) {
//         new_master_data = data
//         RecomputeViews(new_master_data, master_data, set_master_data)
//       } else {
//         new_master_data = master_data
//       }
//       //Cherche la position de la vue sélectionné dans le tableau de vue
//       let ind = -1
//       new_master_data!.view.map((v, i) => {
//         ind = (v.id === view) ? i : ind
//       })
//       //si la vue est trouvé alors on lance l'animation entre cette vue et la suivante
//       if (ind === Object.keys(new_master_data!.view).length - 1) {
//         ind = -1
//       } else if (ind === -1) {
//         ind = -1
//       }
//       // Check if there is unsaved change before we switch view
//       // If there is, we open the modal to know if the user want to save the current unsaved changes befor eswitching view
//       if (view === 'none') {
//         new_master_data!.current_view = master_data!.view[ind + 1].id
//         set_master_data(new_master_data)
//       }
//       let saved = true
//       if (view !== 'none' && has_open_sankey_plus) {
//         const diff = CheckCurrentViewSaved(new_master_data, data, view)
//         if (diff.length > 0 && !window.SankeyToolsStatic) {
//           saved = false
//           set_view_not_saved(view)
//           set_view(master_data!.view[ind + 1].id)
//         }
//       }
//       const data_view = GetDataFromView(new_master_data, new_master_data!.view[ind + 1].id) as OSPData
//       if (saved) {
//         set_data(JSON.parse(JSON.stringify(data_view)))
//         set_view(new_master_data!.view[ind + 1].id)
//       }
//       //}
//     }
//   }
//   if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && ((document.activeElement?.tagName === 'INPUT') ? d3.select(document.activeElement).attr('value') === 'menuConfigButton' : true) && (!document.activeElement?.className.includes('ql-editor'))) {
//     // Deplace les zdt sélectionné avec les flèches du clavier, cependant ne ce déplace pas si jamais on utilise les flèches pour dépalcer le curseur dans un input
//     // (exemples : le input de la largeur minimal d'un noeud)
//     e.preventDefault()
//     if (e.key === 'ArrowUp') {
//       Object.values(data.labels).filter(f => multi_selected_label.current.map(d => {
//         if (d !== undefined) {
//           return d.idLabel
//         }
//       }).includes(f.idLabel)).map(d => {

//         d.y = d.y - data.grid_square_size

//         let y_max = 0
//         Object.values(data.labels).map(d => {
//           y_max = (d.y > y_max) ? d.y : y_max
//         })
//         //Diminue hauteur svg si le noeud est près du bord
//         if (y_max < data.height - 100 && data.height - 100 >= window.innerHeight) {
//           data.height -= 90
//         }
//       })
//     } else if (e.key === 'ArrowDown') {
//       Object.values(data.labels).filter(f => multi_selected_label.current.map(d => {
//         if (d !== undefined) {
//           return d.idLabel
//         }
//       }).includes(f.idLabel)).map(d => {


//         d.y = d.y + data.grid_square_size

//         //Augumente hauteur svg si le noeud est près du bord
//         if (d.y > data.height - 100) {
//           data.height += 100
//         }
//       })
//     } else if (e.key === 'ArrowLeft') {
//       Object.values(data.labels).filter(f => multi_selected_label.current.map(d => {
//         if (d !== undefined) {
//           return d.idLabel
//         }
//       }).includes(f.idLabel)).map(d => {


//         d.x = d.x - data.grid_square_size

//         //Diminue largeur svg si le noeud est près du bord
//         if (d.x < data.width - 100 && data.width - 100 >= window.innerWidth - 40) {
//           data.width -= 50
//         }
//       })
//     } else if (e.key === 'ArrowRight') {
//       Object.values(data.labels).filter(f => multi_selected_label.current.map(d => {
//         if (d !== undefined) {
//           return d.idLabel
//         }
//       }).includes(f.idLabel)).map(d => {


//         d.x = d.x + data.grid_square_size

//         //Augumente largeur svg si le noeud est près du bord
//         if (d.x > data.width - 100) {
//           data.width += 100
//         }
//       })
//     }
//     reDrawOSPLabels(multi_selected_label.current)
//   }

//   // Add deselection of all selected zdt
//   if (e.key === 'Escape') {

//     multi_selected_label.current.forEach(l => {
//       d3.select('#' + l.idLabel + ' rect').attr('stroke-width', 1)
//     })
//     multi_selected_label.current = []

//   }

//   if (e.key === 'Delete' && (!document.activeElement?.className.includes('ql-editor'))) {
//     if (document.activeElement?.tagName !== 'INPUT' || d3.select(document.activeElement).attr('value') === 'menuConfigButton') {
//       deleteGLabel(updateMenus, multi_selected_label.current)
//       data.labels = Object.fromEntries(Object.entries(data.labels).filter(d => !multi_selected_label.current.map(l => l.idLabel).includes(d[0])))
//       multi_selected_label.current = []
//       ComponentUpdater.updateComponentMenuConfigZdt.current.forEach(f => f())
//     }
//   }
// }

// TODO A implementer avec classes


// // Function to check if the current data of the view is unsaved
// // We compare the differences saved in the master_data with the current changement of the view
// export const CheckCurrentViewSaved: CheckCurrentViewSavedFType = (
//   master_data: OSPData | undefined,
//   data: OSPData | undefined,
//   view: string
// ) => {
//   const view_data = GetDataFromView(master_data, view)
//   //const data=JSON.parse(JSON.stringify(data))
//   //const updated_diff=JSON.parse(JSON.stringify(original_diff))

//   //updateLayout(data_updated_layout,master_data,master_data.view.filter(v=>v.id===view)[0].heredited_attr_from_master)
//   //updateLayout(updated_diff,master_data,master_data.view.filter(v=>v.id===view)[0].heredited_attr_from_master)

//   let difference = getDiff(view_data, data)
//   difference = (difference !== undefined) ? difference : []
//   difference = difference.filter((d) => {
//     // Ne prend pas en compte les modif de vue, de la largeur ou hauteur du sankey
//     return (
//       (d.path![0] !== 'current_view') &&
//       (d.path![0] !== 'view') &&
//       (d.path![0] !== 'width') &&
//       (d.path![0] !== 'height') &&
//       (d.path![0] !== 'linkZIndex') &&
//       !(d.path!.length === 4 && d.path![3] === 'vert_shift'))
//   })
//   console.log(difference)
//   return difference
// }


export const OSPMenuPreferenceView: FunctionComponent<OSPMenuPreferenceViewFType> = ({
  applicationData
}
) => {
  const [, setCount] = useState(0)
  const { new_data } = applicationData
  const { t } = new_data
  return <Checkbox
    variant='menuconfigpanel_option_checkbox'
    defaultChecked={new_data.menu_configuration.isGivenAccordionShowed('Vis')} onChange={() => {
      new_data.menu_configuration.toggleGivenAccordion('Vis')
      setCount(a => a + 1)
    }}>
    {t('view.storytelling')}
  </Checkbox>
}


// // Modal used when we want to switch to master or a view without saving some changements we made on the current view
// // It give the option save or not the changements made
// export const modal_view_not_saved: modal_view_not_savedFType = (
//   view_not_saved: string,
//   set_view_not_saved: (s: string) => void,
//   t: TFunction,
//   applicationData
// ) => {
//   const { data, set_data, view, master_data, set_master_data } = applicationData
//   return (
//     <Modal
//       isOpen={view_not_saved !== ''}
//       onClose={() => null}
//     >
//       <ModalContent
//         maxWidth='inherit'
//       >
//         <ModalHeader>
//           {t('view.ns')}
//         </ModalHeader>
//         <ModalCloseButton />
//         <ModalBody>
//           {t('view.warn_ns')}
//         </ModalBody>
//         <ModalFooter>
//           <Button
//             variant='danger'
//             onClick={() => {
//               // Don't save the view before changing to the selected one
//               if (view !== 'none') {
//                 const data_view = GetDataFromView(master_data, view) as OSPData
//                 set_data(JSON.parse(JSON.stringify(data_view)))
//               } else if (view === 'none') {
//                 set_data(JSON.parse(JSON.stringify(master_data)))
//               }
//               set_view_not_saved('')
//             }}
//           >
//             {t('view.dont_save')}
//           </Button>
//           <Button
//             variant='success'
//             onClick={() => {
//               // Save the view before changing to the selected one

//               let difference = getDiff(master_data, data)
//               difference = (difference !== undefined) ? difference : []
//               difference = difference.filter((d) => !(d.path!.includes('view')))
//               master_data!.view.filter(v => v.id === view_not_saved)[0].view_data = { diff: difference }
//               update_heredited_attr_from_master(master_data!.view.filter(v => v.id === view_not_saved)[0], data, master_data!)
//               if (view !== 'none') {
//                 const data_view = GetDataFromView(master_data, view) as OSPData

//                 set_master_data(JSON.parse(JSON.stringify(master_data)))
//                 set_data(JSON.parse(JSON.stringify(data_view)))

//               } else if (view === 'none') {
//                 set_data(JSON.parse(JSON.stringify(master_data)))
//               }
//               set_view_not_saved('')
//             }}
//           >
//             {t('view.save')}
//           </Button>
//         </ModalFooter>
//       </ModalContent>
//     </Modal>)
// }


export const ModalTransparentViewAttr: FunctionComponent<modal_transparent_view_attrFType> = (
  {
    applicationData
  }
): JSX.Element => {

  const { new_data } = applicationData
  const { t } = new_data

  const [state, setState] = useState({
    show_modal: false,
    update_modes: [] as string[]
  })
  const show_modal = state.show_modal
  const update_modes = state.update_modes

  const switchThis = (_: boolean) => {
    setState({
      show_modal: _,
      update_modes: []
    })
  }

  new_data.menu_configuration.ref_to_modal_view_attributes_switcher.current = switchThis

  // const current_view = applicationData.master_data?.view.filter(v => v.id === applicationData.master_data!.current_view)[0] ?? {} as ViewType
  // const { data, set_data, master_data, set_master_data } = applicationData as OSPApplicationDataType
  // const { ref_setter_show_modal_transparent_view_attr } = dict_hook_ref_setter_show_dialog_components

  const has_sankey_plus = new_data.has_sankey_plus
  const has_master_sankey = new_data.has_master_sankey
  const is_view_master = new_data.is_view_master

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
                  update_modes.includes('addNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!update_modes.includes('addNode')) {
                    update_modes.push('addNode')
                  } else {
                    update_modes.splice(update_modes.indexOf('addNode'), 1)
                  }
                  setState({
                    show_modal: show_modal,
                    update_modes: update_modes})
                }}
              >
                {t('Menu.Transformation.addNode')}
              </Button>

              <Button
                variant={update_modes.includes('removeNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!update_modes.includes('removeNode')) {
                    update_modes.push('removeNode')
                  } else {
                    update_modes.splice(update_modes.indexOf('removeNode'), 1)
                  }
                  setState({
                    show_modal: show_modal,
                    update_modes: update_modes})
                }}
              >
                {t('Menu.Transformation.removeNode')}
              </Button>

              <Button
                variant={update_modes.includes('addFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!update_modes.includes('addFlux')) {
                    update_modes.push('addFlux')
                  } else {
                    update_modes.splice(update_modes.indexOf('addFlux'), 1)
                  }
                  setState({
                    show_modal: show_modal,
                    update_modes: update_modes})
                }}
              >
                {t('Menu.Transformation.addFlux')}
              </Button>
              <Button
                variant={update_modes.includes('removeFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!update_modes.includes('removeFlux')) {
                    update_modes.push('removeFlux')
                  } else {
                    update_modes.splice(update_modes.indexOf('removeFlux'), 1)
                  }
                  setState({
                    show_modal: show_modal,
                    update_modes: update_modes})
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
                variant={update_modes.includes('posNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!update_modes.includes('posNode')) {
                    update_modes.push('posNode')
                  } else {
                    update_modes.splice(update_modes.indexOf('posNode'), 1)
                  }
                  setState({
                    show_modal: show_modal,
                    update_modes: update_modes})
                }}>
                {t('Menu.Transformation.PosNoeud')}
              </Button>
              <Button
                variant={update_modes.includes('posFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!update_modes.includes('posFlux')) {
                    update_modes.push('posFlux')
                  } else {
                    update_modes.splice(update_modes.indexOf('posFlux'), 1)
                  }
                  setState({
                    show_modal: show_modal,
                    update_modes: update_modes})
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
                variant={update_modes.includes('Values') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!update_modes.includes('Values')) {
                    update_modes.push('Values')
                  } else {
                    update_modes.splice(update_modes.indexOf('Values'), 1)
                  }
                  setState({
                    show_modal: show_modal,
                    update_modes: update_modes})
                }}
              >
                {update_modes.includes('Values') ? <FaCheck /> : <FontAwesomeIcon icon={faXmark} />}
              </Button>
            </Box>

          </Box>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Attribut')}</Box>
            <Box as='span' layerStyle='options_4cols'>
              <Button
                variant={update_modes.includes('attrNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!update_modes.includes('attrNode')) {
                    update_modes.push('attrNode')
                  } else {
                    update_modes.splice(update_modes.indexOf('attrNode'), 1)
                  }
                  setState({
                    show_modal: show_modal,
                    update_modes: update_modes})
                }}
              >
                {t('Menu.Transformation.attrNode')}
              </Button>

              <Button
                variant={update_modes.includes('attrFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!update_modes.includes('attrFlux')) {
                    update_modes.push('attrFlux')
                  } else {
                    update_modes.splice(update_modes.indexOf('attrFlux'), 1)
                  }
                  setState({
                    show_modal: show_modal,
                    update_modes: update_modes})
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
                variant={update_modes.includes('tagNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!update_modes.includes('tagNode')) {
                    update_modes.push('tagNode')
                  } else {
                    update_modes.splice(update_modes.indexOf('tagNode'), 1)
                  }
                  setState({
                    show_modal: show_modal,
                    update_modes: update_modes})
                }}
              >
                {t('Menu.Transformation.tagNode')}
              </Button>
              <Button
                variant={update_modes.includes('tagFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!update_modes.includes('tagFlux')) {
                    update_modes.push('tagFlux')
                  } else {
                    update_modes.splice(update_modes.indexOf('tagFlux'), 1)
                  }
                  setState({
                    show_modal: show_modal,
                    update_modes: update_modes})
                }}
              >
                {t('Menu.Transformation.tagFlux')}
              </Button>
              <Button
                variant={update_modes.includes('tagData') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!update_modes.includes('tagData')) {
                    update_modes.push('tagData')
                  } else {
                    update_modes.splice(update_modes.indexOf('tagData'), 1)
                  }
                  setState({
                    show_modal: show_modal,
                    update_modes: update_modes})
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
                variant={update_modes.includes('tagLevel') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!update_modes.includes('tagLevel')) {
                    update_modes.push('tagLevel')
                  } else {
                    update_modes.splice(update_modes.indexOf('tagLevel'), 1)
                  }
                  setState({
                    show_modal: show_modal,
                    update_modes: update_modes})
                }}
              >
                {update_modes.includes('tagLevel') ? <FaCheck /> : <FontAwesomeIcon icon={faXmark} />}
              </Button>
            </Box>
          </Box>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.attrGeneral')}</Box>

            <Box as='span' layerStyle='options_4cols'>
              <Button
                variant={update_modes.includes('attrGeneral') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => {
                  if (!update_modes.includes('attrGeneral')) {
                    update_modes.push('attrGeneral')
                  } else {
                    update_modes.splice(update_modes.indexOf('attrGeneral'), 1)
                  }
                  setState({
                    show_modal: show_modal,
                    update_modes: update_modes})
                }}
              >
                {update_modes.includes('attrGeneral') ? <FaCheck /> : <FontAwesomeIcon icon={faXmark} />}
              </Button>
            </Box>
          </Box>
        </ModalBody>

        <ModalFooter>
          <Button
            onClick={() => {
              const master_view = new_data.master_view
              if (master_view) {
                new_data.drawing_area.updateFrom(master_view, update_modes)
                new_data.drawing_area.reset()
              }
            }}>
              {t('view.updateViewWithMasterVar')}
            </Button></ModalFooter>
      </ModalContent>
    </Modal>
  }
  return <></>
}

// export const MenuEnregistrerView: FunctionComponent<MenuEnregistrerViewFType> = ({
//   t,
//   elementsSelected
// }) => {
//   const [save_only_view, set_save_only_view] = useState(false)
//   elementsSelected.saveViewGetter.current = save_only_view
//   return <Checkbox
//     variant='menuconfigpanel_option_checkbox'
//     isChecked={save_only_view}
//     onChange={() => set_save_only_view(!save_only_view)}>
//     <OSTooltip label={t('view.tooltips.buttonExportView')}>
//       {t('view.export')}
//     </OSTooltip>
//   </Checkbox>
// }

// export const OpenOSPCheckpointButton: OpenOSPCheckpointButtonFType = (
//   master_data: OSPData | undefined,
//   data: OSPData,
//   view: string,
//   view_not_saved: string,
//   has_open_sankey_plus: boolean,
//   t: TFunction
// ) => {

//   // Boolean used to change the logo of the button to save the current view :
//   //  - if there is no differences between the the saved view and the current view, then the logo has a check
//   //  - else if it contain difference, the logo contain an exclamation point
//   const is_different = false
//   if (view !== 'none' && view_not_saved === '' && master_data && has_open_sankey_plus) {
//     // find another way with a variable. Checking the all view consumes too much time
//     // const diff=CheckCurrentViewSaved(master_data,data,view)
//     // if(diff.length>0){
//     //   is_different=true
//     // }
//   }

//   return <OSTooltip
//     label={(!has_open_sankey_plus) ? (t('Menu.sankeyOSPDisabled')) : t('view.tooltips.saveView')}>
//     <Button
//       isDisabled={!has_open_sankey_plus}
//       variant='light'
//       onClick={() => {
//         const ev = document
//         const t = new KeyboardEvent('keydown', { key: 's', ctrlKey: true })
//         if (ev.onkeydown) {
//           ev.onkeydown(t)
//         }
//       }}
//     >
//       <FontAwesomeIcon
//         icon={faFloppyDisk}
//         style={{ opacity: (!has_open_sankey_plus) ? '0.6' : '1', width: '2rem', height: '2rem' }} />
//       {!has_open_sankey_plus ? <>
//         <FontAwesomeIcon
//           icon={faLock}
//           style={{
//             fontSize: '1em',
//             color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'
//           }} />
//       </>
//         : <>{is_different ?
//           <FontAwesomeIcon
//             icon={faExclamation}
//             style={{
//               fontSize: '1em',
//               color: 'rgba(var(--bs-danger-rgb), var(--bs-bg-opacity))'
//             }} />
//           : <></>}</>
//       }
//     </Button>
//   </OSTooltip>
// }

// /**
//  * Modify heredited_attr_from_master in function of the modification done in the view.
//  * If an attribute in the view is modified which was heredited from master the set attributes
//  * containing the attribute is removed from the list of heredited attributes
//  */
// const update_heredited_attr_from_master = (
//   view: ViewType,
//   view_data: OSPData,
//   master_data: OSPData
// ): void => {
//   const heredited_attr_from_master = view.heredited_attr_from_master
//   if (heredited_attr_from_master.indexOf('attrGeneral') !== -1) {
//     let differences = getDiff(view_data, master_data)
//     if (differences) {
//       const legend_pos = differences.filter(difference => difference.path![0] == 'legend_position')
//       if (legend_pos.length > 0) {
//         heredited_attr_from_master.splice(heredited_attr_from_master.indexOf('attrGeneral'), 1)
//       }
//       differences = differences.filter(
//         (difference) =>
//           (difference.kind === 'E') &&
//           (difference.path!.length === 1) &&
//           (difference.path![0] !== 'current_view'))
//       if (differences.length > 0) {
//         heredited_attr_from_master.splice(heredited_attr_from_master.indexOf('attrGeneral'), 1)
//       }
//     }
//     const display_style_diff = getDiff(view_data.display_style, master_data.display_style)
//     if (display_style_diff) {
//       heredited_attr_from_master.splice(heredited_attr_from_master.indexOf('attrGeneral'), 1)
//     }

//     const node_style_differences = getDiff(view_data.style_node, master_data.style_node)
//     if (node_style_differences) {
//       heredited_attr_from_master.splice(heredited_attr_from_master.indexOf('attrGeneral'), 1)
//     }

//     const link_style_differences = getDiff(view_data.style_link, master_data.style_link)
//     if (link_style_differences) {
//       heredited_attr_from_master.splice(heredited_attr_from_master.indexOf('attrGeneral'), 1)
//     }
//   }

//   if (heredited_attr_from_master.indexOf('addNode') !== -1) {
//     let differences = getDiff(view_data.nodes, master_data.nodes)
//     if (differences) {
//       differences = differences.filter(
//         (difference) =>
//           (difference.kind === 'N') &&
//           (difference.path!.length === 1))
//       if (differences.length > 1) {
//         heredited_attr_from_master.splice(heredited_attr_from_master.indexOf('addNode'), 1)
//       }
//     }
//   }

//   if (heredited_attr_from_master.indexOf('removeNode') !== -1) {
//     let differences = getDiff(view_data.nodes, master_data.nodes)
//     if (differences) {
//       differences = differences.filter(
//         (difference) =>
//           (difference.kind === 'D') &&
//           (difference.path!.length === 1))
//       if (differences.length > 1) {
//         heredited_attr_from_master.splice(heredited_attr_from_master.indexOf('removeNode'), 1)
//       }
//     }
//   }

//   if (heredited_attr_from_master.indexOf('addFlux') !== -1) {
//     let differences = getDiff(view_data.links, master_data.links)
//     if (differences) {
//       differences = differences.filter(
//         (difference) =>
//           (difference.kind === 'N') &&
//           (difference.path!.length === 1))
//       if (differences.length > 1) {
//         heredited_attr_from_master.splice(heredited_attr_from_master.indexOf('addFlux'), 1)
//       }
//     }
//   }

//   if (heredited_attr_from_master.indexOf('removeFlux') !== -1) {
//     let differences = getDiff(view_data.links, master_data.links)
//     if (differences) {
//       differences = differences.filter(
//         (difference) =>
//           (difference.kind === 'D') &&
//           (difference.path!.length === 1))
//       if (differences.length > 1) {
//         heredited_attr_from_master.splice(heredited_attr_from_master.indexOf('removeFlux'), 1)
//       }
//     }
//   }

//   if (heredited_attr_from_master.indexOf('posNode') !== -1) {
//     let differences = getDiff(view_data.nodes, master_data.nodes)
//     if (differences) {
//       differences = differences.filter(
//         (difference) =>
//           (difference.kind === 'E') &&
//           (['x', 'y', 'x_label', 'y_label'].includes(difference.path![1])))
//       if (differences.length > 1) {
//         heredited_attr_from_master.splice(heredited_attr_from_master.indexOf('posNode'), 1)
//       }
//     }
//   }

//   if (heredited_attr_from_master.indexOf('posLink') !== -1) {
//     const geometry_attributes = [
//       'orientation',
//       'left_horiz_shift',
//       'right_horiz_shift',
//       'vert_shift',
//       'curvature',
//       'curved',
//       'recycling',
//       'arrow_size',
//       // Geometry link labels
//       'x_label',
//       'y_label',
//       'label_position',
//       'orthogonal_label_position',
//       'label_on_path'
//     ]
//     let differences = getDiff(view_data.links, master_data.links)
//     if (differences) {
//       differences = differences.filter(
//         (difference) =>
//           (difference.kind === 'D' || difference.kind === 'N') &&
//           (difference.path!.length === 3) &&
//           (difference.path![1] === 'local') &&
//           (geometry_attributes.includes(difference.path![2])) ||
//           (difference.kind === 'E' && geometry_attributes.includes(difference.path![1]))
//       )
//       if (differences.length > 1) {
//         heredited_attr_from_master.splice(heredited_attr_from_master.indexOf('posLink'), 1)
//       }
//     }
//   }

//   if (heredited_attr_from_master.indexOf('attrNode') !== -1) {
//     Object.entries(view_data.nodes).forEach(([key, node]) => {
//       const layoutNode = master_data.nodes[key]
//       if (!layoutNode) {
//         return
//       }
//       if (!node.local) {
//         node.local = {}
//       }
//       if (!layoutNode.local) {
//         layoutNode.local = {}
//       }
//       const differences = getDiff(node.local, layoutNode.local)
//       if (differences && differences.length > 1) {
//         heredited_attr_from_master.splice(heredited_attr_from_master.indexOf('attrNode'), 1)
//       }
//     })
//   }

//   if (heredited_attr_from_master.indexOf('attrFlux') !== -1) {
//     Object.entries(view_data.links).forEach(([key, link]) => {
//       const layoutLink = master_data.links[key]
//       if (!layoutLink) {
//         return
//       }
//       if (!link.local) {
//         link.local = {}
//       }
//       if (!layoutLink.local) {
//         layoutLink.local = {}
//       }
//       const differences = getDiff(link.local, layoutLink.local)
//       if (differences && differences.length > 1) {
//         heredited_attr_from_master.splice(heredited_attr_from_master.indexOf('attrFlux'), 1)
//       }

//     })
//   }

//   if (heredited_attr_from_master.indexOf('Values') !== -1) {
//     const dataTagsNames = Object.values(view_data.dataTags).map(tagGroup => tagGroup.group_name)
//     const layoutTagsNames = Object.values(master_data.dataTags).map(tagGroup => tagGroup.group_name)

//     if (JSON.stringify(dataTagsNames) === (JSON.stringify(layoutTagsNames))) {
//       Object.entries(view_data.links).forEach(([key, link]) => {
//         const layoutLink = master_data.links[key]
//         if (!layoutLink) {
//           return
//         }
//         const differences = getDiff(link.value, layoutLink.value)
//         if (differences) {
//           heredited_attr_from_master.splice(heredited_attr_from_master.indexOf('Values'), 1)
//         }
//       })
//     }
//   }

//   if (heredited_attr_from_master.indexOf('tagLevel') !== -1) {
//     const differences = getDiff(view_data.levelTags, master_data.levelTags)
//     if (differences) {
//       heredited_attr_from_master.splice(heredited_attr_from_master.indexOf('tagLevel'), 1)
//       //alert('Niveau de détail modifié. Cet attribut n\'est plus hérité du maître.')
//     }
//   }

//   if (heredited_attr_from_master.indexOf('tagNode') !== -1) {
//     const differences = getDiff(view_data.nodeTags, master_data.nodeTags)
//     if (differences) {
//       heredited_attr_from_master.splice(heredited_attr_from_master.indexOf('tagNode'), 1)
//       //alert('Etiquettes de noeuds modifiées. Ce groupe d\'attribut n\'est plus hérité du maître.')
//     }
//   }

//   if (heredited_attr_from_master.indexOf('tagFlux') !== -1) {
//     const differences = getDiff(view_data.nodeTags, master_data.nodeTags)
//     if (differences) {
//       heredited_attr_from_master.splice(heredited_attr_from_master.indexOf('tagFlux'), 1)
//       //alert('Etiquettes de flux modifiées. Ce groupe d\'attribut n\'est plus hérité du maître.')
//     }
//   }

//   if (heredited_attr_from_master.indexOf('tagData') !== -1) {
//     const differences = getDiff(view_data.nodeTags, master_data.nodeTags)
//     if (differences) {
//       heredited_attr_from_master.splice(heredited_attr_from_master.indexOf('tagData'), 1)
//       //alert('Etiquettes de données modifiées. Ce groupe d\'attribut n\'est plus hérité du maître.')
//     }
//   }
// }