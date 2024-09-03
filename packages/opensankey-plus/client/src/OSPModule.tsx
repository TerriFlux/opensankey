import React, { useRef } from 'react'

import { t } from 'i18next'
import { Popover, PopoverBody, PopoverContent, PopoverHeader, PopoverTrigger, Button, PopoverArrow, PopoverCloseButton, Box, Input } from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolderTree } from '@fortawesome/free-solid-svg-icons'

import {
  dict_hook_ref_setter_show_dialog_componentsType,
  module_dialogsType,
  InitalizeSelectorDetailNodesType
} from './deps/OpenSankey/types/LegacyType'
import { AddAllDropDownNode, setDiagram } from './deps/OpenSankey/configmenus/SankeyMenuBanner'
import { MenuDraggable } from './deps/OpenSankey/topmenus/SankeyMenuTop'

import {
  OSPApplicationDataType,
  OSPApplicationDataVarType,
  OSPData,
  OSPGetDefaultData,
  OSPInitializeAdditionalMenusType,
  OSPInitializeApplicationDataVarType,
  OSPInitializeReinitializationType,
  OSPUpdateMenuConfType
} from '../types/Types'

// import { os_all_element_to_transform } from './deps/OpenSankey/dialogs/SankeyMenuDialogs'
// import { OSPDrawNodesFO, OSPNodeFO } from './SankeyPlusForeignObject'
// import { OSPDrawArrows, OSPLinkStroke, MenuConfLinkApparenceGradient } from './SankeyPlusGradient'
// import { OSPDrawLabels, sankey_plus_min_width_and_height, zone_selection_label } from './SankeyPlusLabels'
import { ZDTMenuAsAccordeonItem, OSPMenuConfigurationFreeLabels, ContextZDT } from './SankeyPlusMenuConfigurationLabels'
import { OSPHyperLink, OSPNodeIcon } from './SankeyPlusNodes'
import {
  ImportImageAsSvgBg,
} from './SankeyPlusUtils'

// import { plus_convert_data, plus_sankey_layout, plus_all_element_to_transform, OSPTransformationElements, } from './SankeyPlusConvert'
// import {
//   GetDataFromView, MenuEnregistrerView, OSPKeyHandler, OSPBannerView,
//   SelecteurView, getSetDiagramFunc, modal_transparent_view_attr, modal_view_not_saved,
//   viewsAccordion,
//   OSPMenuPreferenceView
// } from './SankeyPlusViews'

import ModalSelectionIcon from './SankeyPlusCatalogIcon'

import { Class_ApplicationDataPlus } from './Types/ApplicationDataPlus'
import { OSPNodeFO } from './SankeyPlusForeignObject'

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
  // const [master_data, set_master_data] = useState<OSPData>() // useState OK
  // const [view, pre_set_view] = useState(data_plus.current_view) // useState OK
  // const set_view=(s:string)=>{
  //   data_plus.current_view=s
  //   if(master_data){
  //     master_data.current_view=s
  //   }
  //   pre_set_view(s)
  // }
  // const [view_not_saved,set_view_not_saved]=useState('')

  const set_data_plus = set_data as (_: OSPData) => void
  const plus_get_defaut_data = get_default_data as OSPGetDefaultData
  // const useOpenSankeySetDiagram = (master_data && master_data.view.length > 0) || window.SankeyToolsStatic

  // If initial data has views & has a current view then update current data to the view (and initial data become master data)
  // if (data_plus.view && data_plus.view.length > 0 && !master_data) {
  //   set_master_data({...JSON.parse(JSON.stringify(data))})
  //   if(data_plus.current_view && data_plus.current_view!=='none'){
  //     const view_to_display= GetDataFromView(data_plus,data_plus.current_view)
  //     set_view(data_plus.current_view)
  //     set_data(view_to_display as OSPData)
  //   }
  // }

  return {
    data: data_plus,
    set_data: set_data_plus,
    get_default_data: plus_get_defaut_data,
    new_data: new Class_ApplicationDataPlus(false),
    dataVarToUpdate: useRef(['']),
    // convert_data : (data:SankeyData,DefaultSankeyData:()=>SankeyData) => {
    //   plus_convert_data(data as OSPData,DefaultSankeyData as ()=> OSPData)
    //   convert_data(data,DefaultSankeyData)
    // },
    // master_data,
    // set_master_data,
    // view,
    // set_view,
    // view_not_saved:view_not_saved,
    // set_view_not_saved:set_view_not_saved,
    // setDiagram:useOpenSankeySetDiagram?getSetDiagramFunc(set_master_data,set_view,plus_get_defaut_data ) : setDiagram,
    setDiagram: setDiagram,
    // is_catalog:false
  } as OSPApplicationDataVarType
}

// export const OSPcloseAllMenu = closeAllMenu

export const OSPInitializeReinitialization: OSPInitializeReinitializationType = (
  _applicationData
) => () => {
  // const recast_selected_dict=applicationState as OSPElementsSelectedType
  // recast_selected_dict.multi_selected_label.current = []
  localStorage.removeItem('icon_imported')
  sessionStorage.setItem('dismiss_warning_sankey_plus', '0')
  // (applicationData as OSPApplicationDataType).set_master_data(undefined);
  // (applicationData as OSPApplicationDataType).set_view('none')
}



// Since AdditionalMenus is an OS var specially created to add external element in menus
// we don't have to recast initializeAdditionalMenusType for more var or overwritting parameter types
export const OSPInitializeAdditionalMenus: OSPInitializeAdditionalMenusType = (
  additionalMenus,
  applicationData,
) => {
  // const OSPApplicationContext=applicationContext as OSPApplicationContextType
  const plus_dict_app_data = applicationData as unknown as OSPApplicationDataType

  // TODO : re implement SelecteurView with class
  // (uiElementsRef as OSPUiElementsRefType).ViewSelector.current=<SelecteurView
  //   applicationData={plus_dict_app_data}
  //   applicationState={applicationState as OSPElementsSelectedType}
  //   t={applicationContext.t}
  //   set_view_not_saved={plus_dict_app_data.set_view_not_saved}
  //   connected={OSPApplicationContext.has_open_sankey_plus}
  // />
  // Top Menus
  // additionalMenus.external_file_export_item.push(<OSPItemExport />)

  // Page settings
  // TODO : re implement ImportImageAsSvgBg with class
  additionalMenus.extra_background_element = <ImportImageAsSvgBg
    applicationData={plus_dict_app_data}
    has_open_sankey_plus={true}
  />

  // TODO : re implement OSPBannerView with class

  // const has_views = OSPApplicationData.master_data &&  OSPApplicationData.master_data.view.length > 0
  // if (!window.SankeyToolsStatic || has_views ) {
  //   additionalMenus.externale_navbar_item['view']=<OSPBannerView
  //     applicationData={applicationData as OSPApplicationDataType}
  //     applicationContext={OSPApplicationContext}
  //     dict_hook_ref_setter_show_dialog_components={(dict_hook_ref_setter_show_dialog_components as OSPShowMenuComponentsType)}
  //     convert_data={applicationData.convert_data}
  //     view_selector={(uiElementsRef as OSPUiElementsRefType).ViewSelector.current as JSX.Element}
  //   />
  // }

  // Menu conf nodes
  additionalMenus.additional_menu_configuration_nodes['Noeud.tabs.icon'] = <OSPNodeIcon
    applicationData={plus_dict_app_data}
    menu_for_modal={false}

  />
  additionalMenus.additional_menu_configuration_nodes['Noeud.tabs.fo'] = <OSPNodeFO
    applicationData={plus_dict_app_data}
    is_activated={true}
  />

  additionalMenus.additional_menu_configuration_nodes['Noeud.tabs.hl'] = <OSPHyperLink
    applicationData={plus_dict_app_data}
    is_activated={true}
  />
  //Links
  // TODO : re implement MenuConfLinkApparenceGradient with class
  // additionalMenus.additional_link_appearence_items.push(<MenuConfLinkApparenceGradient
  //   applicationContext={applicationContext as OSPApplicationContextType}
  //   ComponentUpdater={ComponentUpdater as OSPComponentUpdaterType}
  //   multi_selected_links={applicationState.multi_selected_links}
  //   data={applicationData.data as OSPData}
  //   link_function={link_function}
  //   is_activated={true}
  //   menu_for_style={false}
  //   selected_style_link={applicationState.ref_selected_style_link}
  // />)

  //Preferences
  // TODO : re implement OSPMenuPreferenceLabels with class
  // additionalMenus.additional_preferences.push(
  //   <OSPMenuPreferenceLabels
  //     t={applicationContext.t}
  //     data={applicationData.data as OSPData}
  //     updateMenus={ComponentUpdater.updateMenus}
  //   />
  // )

  // TODO : re implement OSPMenuPreferenceView with class
  // additionalMenus.additional_preferences.push(
  //   OSPMenuPreferenceView(
  //     applicationContext.t,
  //     (applicationData as OSPApplicationDataType).data,
  //     (applicationData as OSPApplicationDataType).set_data
  //   )
  // )
  //- Builds Configuration Menus FreeLabel
  additionalMenus.additional_configuration_menus.push(
    <ZDTMenuAsAccordeonItem
      applicationData={plus_dict_app_data}
      content_menu_zdt={
        <OSPMenuConfigurationFreeLabels
          applicationData={plus_dict_app_data}
        />
      }
    />
  )

  const plusData = applicationData as unknown as OSPApplicationDataType
  // TODO : re implement MenuEnregistrerView with class
  // if (plusData.master_data && plusData.master_data.current_view && plusData.master_data.current_view!=='none') {
  //   additionalMenus.additional_file_save_json_option.push(
  //     <MenuEnregistrerView
  //       t={t}
  //       elementsSelected={applicationState as OSPElementsSelectedType}
  //     />
  //   )
  // }

  // add option for updateLayout (OSP var to update)
  // (Only add these options if connected with OSP)

  // TODO : re implement OSPTransformationElements with class
  // const component_apply_transfor_OSP= <OSPTransformationElements
  //   applicationData={plusData}
  //   applicationContext={applicationContext as OSPApplicationContextType}
  //   ComponentUpdater={ComponentUpdater as OSPComponentUpdaterType}
  // />

  // Add buttons in the menu transformation for adding ZDT and views as variable transferable in SuiteUpdateLayout
  // additionalMenus.apply_transformation_additional_elements.push(component_apply_transfor_OSP)
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
    // modal_transparent_view_attr(
    //   OSP_dict_hook_ref,
    //   OSP_dict_app_data,
    //   applicationContext.t
    // ),
    // modal_view_not_saved(
    //   OSP_dict_app_data.view_not_saved,
    //   OSP_dict_app_data.set_view_not_saved,
    //   applicationContext.t,
    //   applicationData as OSPApplicationDataType
    // ),
    <ModalSelectionIcon
      applicationData={OSP_dict_app_data}
    />
  ]
}





export const OSPUpdateMenuConf: OSPUpdateMenuConfType = (menu_conf,
  _applicationData
) => {

  // TODO : re implement viewsAccordion with class

  // const OSPApplicationData=applicationData as OSPApplicationDataType
  // // const  OSPUiElementsRef=uiElementsRef as OSPUiElementsRefType

  // // const OSPApplicationContext=applicationContext as OSPApplicationContextType
  // const menu_conf_view=viewsAccordion(
  //   OSPApplicationData,
  //   OSPApplicationContext.t,
  //   OSPApplicationContext.has_open_sankey_plus,
  //   OSPApplicationData.convert_data,
  //   OSPApplicationData.get_default_data,
  //   OSPUiElementsRef.ViewSelector?.current??<></>
  // )
  // menu_conf.push(menu_conf_view)
  return menu_conf

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