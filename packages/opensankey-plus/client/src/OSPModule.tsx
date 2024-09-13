// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// External imports
import React, { useRef } from 'react'
import { t } from 'i18next'
import {
  Box,
  Button,
  Input,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
} from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolderTree } from '@fortawesome/free-solid-svg-icons'

// OpenSankey imports
import {
  module_dialogsType,
  InitalizeSelectorDetailNodesType
} from './deps/OpenSankey/types/LegacyType'
import { AddAllDropDownNode, setDiagram } from './deps/OpenSankey/configmenus/SankeyMenuBanner'
import { MenuDraggable } from './deps/OpenSankey/topmenus/SankeyMenuTop'

// Local imports
import {
  OSPApplicationDataType,
  OSPApplicationDataVarType,
  OSPData,
  OSPGetDefaultData,
  OSPInitializeAdditionalMenusType,
  OSPInitializeApplicationDataVarType,
  OSPInitializeReinitializationType} from '../types/Types'
import { ZDTMenuAsAccordeonItem, OSPMenuConfigurationFreeLabels, ContextZDT, OSPMenuPreferenceLabels } from './SankeyPlusMenuConfigurationLabels'
import { OSPHyperLink, OSPNodeIcon } from './SankeyPlusNodes'
import {
  ImportImageAsSvgBg,
} from './SankeyPlusUtils'

import {
  ModalTransparentViewAttr,
  MenuEnregistrerView,
  Modal_view_not_saved,
  OSPBannerView,
  OSPMenuPreferenceView,
  ViewsAccordion,
} from './SankeyPlusViews'

import ModalSelectionIcon from './SankeyPlusCatalogIcon'

import { OSPNodeFO } from './SankeyPlusForeignObject'
import { dict_hook_ref_setter_show_dialog_componentsType } from './deps/OpenSankey/types/MenuConfig'
import { MenuConfLinkApparenceGradient } from './SankeyPlusGradient'
import { Class_ApplicationDataOSP } from './types/TypesOSP'
import { OSPTransformationElements } from './SankeyPlusConvert'

declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
  }


export const OSPDefaultData = () => {
  return {
    is_catalog: false,
    view: [],
    current_view: 'none',
    labels: {},
    icon_catalog: {},
    // style_link: { 'default': DefaultOSPStyleLink() },
    // unitary_node:[],
    // unit_link_value_display:'percent',
    background_image: ''
  }
}

export const OSPInitializeApplicationData: OSPInitializeApplicationDataVarType = (
  data,
  set_data,
  get_default_data,
  _initial_data
) => {
  const data_plus = data as OSPData

  const set_data_plus = set_data as (_: OSPData) => void
  const plus_get_defaut_data = get_default_data as OSPGetDefaultData
  // const useOpenSankeySetDiagram = (master_data && master_data.view.length > 0) || window.SankeyToolsStatic

  // If initial data has views & has a current view then update current data to the view (and initial data become master data)

  const class_dataplus = new Class_ApplicationDataOSP(false)

  // Read data from cache if it exist
  if (_initial_data !== undefined) {
    class_dataplus.fromJSON(_initial_data)
  }

  return {
    data: data_plus,
    set_data: set_data_plus,
    get_default_data: plus_get_defaut_data,
    new_data: class_dataplus,
    dataVarToUpdate: useRef(['']),
    setDiagram: setDiagram,
  } as OSPApplicationDataVarType
}

// export const OSPcloseAllMenu = closeAllMenu

export const OSPInitializeReinitialization: OSPInitializeReinitializationType = (
) => () => {
  localStorage.removeItem('icon_imported')
  sessionStorage.setItem('dismiss_warning_sankey_plus', '0')
}


/**
 * Since AdditionalMenus is an OS var specially created to add external element in menus
 *  we don't have to recast initializeAdditionalMenusType for more var or overwritting parameter types
 * @param {*} additionalMenus
 * @param {*} applicationData
 */
export const OSPInitializeAdditionalMenus: OSPInitializeAdditionalMenusType = (
  additionalMenus,
  applicationData,
) => {

  // Data -------------------------------------------------------------------------------
  // const OSPApplicationContext=applicationContext as OSPApplicationContextType
  const applicationDataOSP = applicationData as unknown as OSPApplicationDataType

  // Local variables --------------------------------------------------------------------
  const is_static = applicationDataOSP.new_data.is_static
  const has_views = applicationDataOSP.new_data.has_views

  // JSX Elements for views navbar ------------------------------------------------------
  // AddMenu accordion views
  additionalMenus.additional_configuration_menus_primary_accordion_elements.push(<ViewsAccordion applicationData={applicationDataOSP} />)


  if (!is_static || has_views) {
    additionalMenus.externale_navbar_item['view'] = <OSPBannerView
      applicationData={applicationDataOSP}
    />
  }

  // TODO OTHER JSX ELEMENTS -----------------------------------------------------------

  // TODO : manque implementation des exort svg
  // // Top Menus
  // additionalMenus.external_file_export_item.push(<OSPItemExport />)

  // Page settings
  // TODO : re implement ImportImageAsSvgBg with class
  additionalMenus.extra_background_element = <ImportImageAsSvgBg
    applicationData={applicationDataOSP}
    has_open_sankey_plus={true}
  />

  // TODO : re implement OSPBannerView with class

  // Menu conf nodes
  additionalMenus.additional_menu_configuration_nodes['Noeud.tabs.icon'] = <OSPNodeIcon
    applicationData={applicationDataOSP}
    menu_for_modal={false}

  />
  additionalMenus.additional_menu_configuration_nodes['Noeud.tabs.fo'] = <OSPNodeFO
    applicationData={applicationDataOSP}
    is_activated={true}
  />

  additionalMenus.additional_menu_configuration_nodes['Noeud.tabs.hl'] = <OSPHyperLink
    applicationData={applicationDataOSP}
    is_activated={true}
  />
  //Links
  additionalMenus.additional_link_appearence_items.push(<MenuConfLinkApparenceGradient
    applicationData={applicationDataOSP}
    is_activated={true}
    menu_for_style={false}
  />)

  //Preferences
  // TODO : re implement OSPMenuPreferenceLabels with class
  additionalMenus.additional_preferences.push(
    <OSPMenuPreferenceLabels
      applicationData={applicationDataOSP}
    />
  )

  // TODO : re implement OSPMenuPreferenceView with class
  additionalMenus.additional_preferences.push(
    <OSPMenuPreferenceView applicationData={applicationDataOSP} />
  )
  //- Builds Configuration Menus FreeLabel
  additionalMenus.additional_configuration_menus_edition_elements.push(
    <ZDTMenuAsAccordeonItem
      applicationData={applicationDataOSP}
      content_menu_zdt={
        <OSPMenuConfigurationFreeLabels
          applicationData={applicationDataOSP}
        />
      }
    />
  )

  // Addition chackbox for dialog save JSON dagram
  additionalMenus.additional_file_save_json_option.push(
    <MenuEnregistrerView
      applicationData={applicationDataOSP}
    />
  )

  // add option for updateLayout (OSP var to update)
  // (Only add these options if connected with OSP)

  // Add buttons in the menu transformation for adding ZDT and views as variable transferable in SuiteUpdateLayout
  additionalMenus.apply_transformation_additional_elements.push(<OSPTransformationElements
    applicationData={applicationDataOSP}
  />)
}

// module_dialogsType return a JSX.Element array wich is a react type
// we don't need to recast it ( and don't need additionnal parameters for OSP dialogs)
export const OSPModuleDialogs: module_dialogsType = (
  applicationData,
) => {
  const OSP_dict_app_data = applicationData as unknown as OSPApplicationDataType
  const { new_data } = OSP_dict_app_data
  const content_draggable_menu_zdt = <OSPMenuConfigurationFreeLabels
    applicationData={OSP_dict_app_data}
  />
  return [
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog_plus as unknown as dict_hook_ref_setter_show_dialog_componentsType}
      dialog_name={'ref_setter_show_menu_zdt' as keyof dict_hook_ref_setter_show_dialog_componentsType}
      content={content_draggable_menu_zdt}
      title={new_data.t('Menu.LL')}
    />,
    <ContextZDT
      applicationData={OSP_dict_app_data}
    />,
    <ModalTransparentViewAttr
      applicationData={OSP_dict_app_data}
    />,
    <Modal_view_not_saved
      applicationData={OSP_dict_app_data}
    />,
    <ModalSelectionIcon
      applicationData={OSP_dict_app_data}
    />
  ]
}

export const OSPInitalizeSelectorDetailNodes: InitalizeSelectorDetailNodesType = (
  applicationData,
) => {

  const mutiple_level_tag_filter = <AddAllDropDownNode
    applicationData={applicationData}
    level={true}

  />
  return <Popover placement='left' id='popover_details_level' >
    <PopoverTrigger>
      <Button variant='toolbar_button_2' id='btn_open_popover_details_level'>
        <FontAwesomeIcon icon={faFolderTree} />
      </Button>
    </PopoverTrigger>
    <PopoverContent>
      <PopoverArrow />
      <PopoverCloseButton />

      <PopoverHeader>{applicationData.new_data.t('Banner.ndd')}</PopoverHeader>
      <PopoverBody style={{ maxHeight: '600px', overflowY: 'auto' }}>
        <Box as='span' layerStyle='popover_sidebar_row_tag_filter'>
          <Box>{t('Menu.group')}</Box>
        </Box>
        <>{(Object.entries(applicationData.data.levelTags).length > 0) ? (<>
          {mutiple_level_tag_filter}</>
        ) : (<>
          <Input placeholder="Pas de filtrage" isDisabled /></>)}</>
      </PopoverBody>
    </PopoverContent>
  </Popover>
}