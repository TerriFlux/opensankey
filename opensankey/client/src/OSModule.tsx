import React, {
  Dispatch,
  SetStateAction,
  useRef} from 'react'
/*************************************************************************************************/
import {
  applicationDataType,
  InitalizeSelectorDetailNodesType,
  initializeAdditionalMenusType,
  initializeApplicationDataType,
  initializeCloseAllMenuContextType,
  initializeMenuConfigurationFuncType,
  initializeReinitializationType,
  module_dialogsType,
  processFunctionsType} from './types/Types'
import { RetrieveExcelResults } from './dialogs/SankeyPersistence'
import { MenuDraggable, OpenSankeySaveButton } from './topmenus/SankeyMenuTop'
import { SankeyMenuConfigurationNodesIO } from './configmenus/SankeyMenuConfigurationNodesIO'
import { MenuConfigurationLinksData } from './configmenus/SankeyMenuConfigurationLinksData'
import { MenuConfigurationLinksAppearence } from './configmenus/SankeyMenuConfigurationLinksAppearence'
import { OpenSankeyMenuConfigurationLayout } from './configmenus/SankeyMenuConfigurationLayout'
import { SankeyMenuConfigurationNodesTooltip } from './configmenus/SankeyMenuConfigurationNodesTooltip'
import { SankeyMenuConfigurationNodesTags } from './configmenus/SankeyMenuConfigurationNodesTags'
import { MenuConfigurationLinksTags } from './configmenus/SankeyMenuConfigurationLinksTags'
import { MenuConfigurationLinksTooltip } from './configmenus/SankeyMenuConfigurationLinksTooltip'
import * as SankeyConvert from './configmenus/SankeyConvert'
import { OpenSankeyConfigurationsMenus } from './configmenus/SankeyMenuConfiguration'
import { SankeySettingsEditionElementTags } from './configmenus/SankeyMenuConfigurationTags'
import { AddSimpleLevelDropDown, setDiagram } from './configmenus/SankeyMenuBanner'
import { Popover, PopoverArrow, PopoverBody, PopoverCloseButton, PopoverContent, PopoverHeader, PopoverTrigger,Button, Input } from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolderTree } from '@fortawesome/free-solid-svg-icons'

import { Class_ApplicationData } from './types/ApplicationData'

declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      filiere?: string,
      header?: string,
      has_header?: boolean,
      footer?: boolean,
      logo_width?: number,
      excel?: string,
      publish?: boolean
      logo?: string
    }
  }


/**
 * Réinitialise data et vide les noeud/liens sélectionnés
 * @param {applicationDataType} applicationData
 */
export const initializeReinitialization : initializeReinitializationType = (
  applicationData :applicationDataType,
) => ()=>{
  localStorage.removeItem('diff')
  localStorage.removeItem('data')
  localStorage.removeItem('last_save')
  localStorage.removeItem('initial_data')
  localStorage.removeItem('icon_imported')

  // Reset Class_ApplicationData instance
  applicationData.new_data.reset()

  sessionStorage.setItem('dismiss_warning_sankey_plus','0')
  sessionStorage.setItem('dismiss_warning_sankey_mfa','0')
}

// Data, displayed data, default data
export const initializeApplicationData : initializeApplicationDataType = (
  data,
  set_data,
  get_default_data,
  initial_data
)=>{
  const application_data = new Class_ApplicationData(false)
  if(initial_data !== undefined){
    application_data.fromJSON(initial_data)
  }
  return {
    data : data,
    set_data : set_data,
    get_default_data : get_default_data,
    convert_data : SankeyConvert.convert_data,
    dataVarToUpdate:useRef(['']),
    setDiagram:setDiagram,
    new_data: application_data
  }
}


export const initializeAdditionalMenus : initializeAdditionalMenusType = (
  additional_menus,
  applicationData,
) => {
  if (!window.SankeyToolsStatic) {
    additional_menus.additional_nav_item.push(
      <OpenSankeySaveButton
        applicationData={applicationData}
      />
    )
  }
}

// Modal Dialogs
export const moduleDialogs : module_dialogsType = (
  applicationData,
  additional_menus,
  menu_configuration_nodes_attributes
) => {
  const {t}=applicationData.new_data
  return [
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={applicationData.new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_node_apparence'}
      content={menu_configuration_nodes_attributes}
      title={t('Menu.Noeuds')+' '+t('Noeud.apparence.apparence')}
    />,
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={applicationData.new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_node_io'}
      content={<SankeyMenuConfigurationNodesIO
        applicationData={applicationData}
        menu_for_modal={true}
      />}
      title={t('Menu.Noeuds')+' '+t('Noeud.PF.PFM')}
    />,
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={applicationData.new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_link_data'}
      content={<MenuConfigurationLinksData
        applicationData={applicationData}
        additional_data_element={additional_menus.additional_data_element}
      />}
      title={t('Menu.flux')+' '+t('Flux.data.données')}
    />,
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={applicationData.new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_link_appearence'}
      content={<MenuConfigurationLinksAppearence
        applicationData={applicationData}
        additional_link_appearence_items={additional_menus.additional_link_appearence_items}
        menu_for_style={false}
      />}
      title={t('Menu.flux')+' '+t('Flux.apparence.apparence')}
    />,
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={applicationData.new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_layout'}
      content={<OpenSankeyMenuConfigurationLayout
        applicationData={applicationData}
        extra_background_element={additional_menus.extra_background_element}
      />}
      title={t('Menu.MEP')}
    />,
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={applicationData.new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_node_tooltip'}
      content={<SankeyMenuConfigurationNodesTooltip
        applicationData={applicationData}
        menu_for_modal = {true}
      />}
      title={t('Menu.Noeuds')+' '+t('Noeud.IS')}
    />,
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={applicationData.new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_node_tags'}
      content={<SankeyMenuConfigurationNodesTags
        applicationData={applicationData}
        menu_for_modal={true}
      />}
      title={t('Menu.Noeuds')+' '+t('Menu.Etiquettes')}
    />,
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={applicationData.new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_link_tags'}
      content={<MenuConfigurationLinksTags
        applicationData={applicationData}
        menu_for_modal={true}
      />}
      title={t('Menu.Flux')+' '+t('Menu.Etiquettes')}
    />,
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={applicationData.new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_link_tooltip'}
      content={<MenuConfigurationLinksTooltip
        applicationData={applicationData}
        menu_for_modal={true}
      />}
      title={t('Menu.flux')+' '+t('Flux.IB')}
    />
  ]}

export const initializeCloseAllMenuContext:initializeCloseAllMenuContextType=(
  tagContext ,
  showContextZDDRef
)=>{
  return ()=>{
    tagContext.current![0][1](undefined)
    showContextZDDRef.current![1](false)
  }
}


//- BackEnd
export const initializeProcessFunctions : (
    applicationData:applicationDataType,
  )=> processFunctionsType = (applicationData) => {
    const _ = {
      ref_processing : useRef(false),
      ref_setter_processing : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
      failure : useRef(false),
      not_started : useRef(true),
      ref_result : useRef<Dispatch<SetStateAction<string>>>(()=>null),
      path : useRef(''),
      RetrieveExcelResults,
      launch:(cur_path:string)=>{
        _.path.current = cur_path
        applicationData.new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_load.current!(true)
        _.ref_setter_processing.current(true)
        _.failure.current = true
        _.not_started.current = false
        _.ref_result.current('')
      }
    }
    return _
  }

/***************************************************************************************/
export const initializeMenuConfiguration:initializeMenuConfigurationFuncType=(
  applicationData,
  additional_menus,
  config_link_data,
  config_link_attr,
  menu_configuration_nodes_attributes,
) => {
  return <OpenSankeyConfigurationsMenus
    applicationData = {applicationData}
    menu_configuration_layout = {
      <OpenSankeyMenuConfigurationLayout
        applicationData={applicationData}
        extra_background_element={additional_menus.extra_background_element}
      />
    }
    menu_configuration_node_tags = {
      <SankeySettingsEditionElementTags
        applicationData={applicationData}
        elementTagNameProp='node_taggs'
      />
    }
    menu_configuration_link_tags = {
      <SankeySettingsEditionElementTags
        applicationData={applicationData}
        elementTagNameProp='flux_taggs'
      />
    }
    menu_configuration_data_tags = {
      <SankeySettingsEditionElementTags
        applicationData={applicationData}
        elementTagNameProp='data_taggs'
      />
    }
    menu_configuration_nodes_attributes = {menu_configuration_nodes_attributes}
    menu_config_link_data = {config_link_data}
    menu_config_link_attr = {config_link_attr}
    additional_accordion_edition_elements = {additional_menus.additional_configuration_menus}
  />
}

/***************************************************************************************/

/**
 * TODO Description
 * @param {*} applicationContext
 * @param {*} applicationData
 * @return {*}
 */
export const InitalizeSelectorDetailNodes:InitalizeSelectorDetailNodesType=(
  applicationData
)=>{
  const { t } = applicationData.new_data

  return <Popover placement='left' id='popover_details_level'>
    <PopoverTrigger>
      <Button variant='toolbar_button_2' id='btn_open_popover_details_level'>
        <FontAwesomeIcon icon={faFolderTree} />
      </Button>
    </PopoverTrigger>
    <PopoverContent>
      <PopoverArrow />
      <PopoverCloseButton />
      <PopoverHeader>{t('Banner.ndd')}</PopoverHeader>
      <PopoverBody>
        <>
          {
            (applicationData.new_data.drawing_area.sankey.level_taggs_list.length > 0) ?
              (<>
                {
                  <AddSimpleLevelDropDown
                    applicationData={applicationData}
                  />
                }
              </>) :
              (<>
                <Input
                  placeholder="Pas de filtrage"
                  isDisabled
                />
              </>)
          }
        </>
      </PopoverBody>
    </PopoverContent>

  </Popover>
}


