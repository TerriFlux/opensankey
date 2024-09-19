import React, {
  Dispatch,
  SetStateAction,
  useRef
} from 'react'

import {
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Button,
  Input
} from '@chakra-ui/react'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFolderTree } from '@fortawesome/free-solid-svg-icons'

/*************************************************************************************************/

import { Class_ApplicationDataOS, Type_GenericApplicationDataOS } from './types/TypesOS'
import { retrieveExcelResults } from './dialogs/SankeyPersistence'
import { MenuDraggable, OpenSankeySaveButton } from './topmenus/SankeyMenuTop'
import { SankeyMenuConfigurationNodesIO } from './configmenus/SankeyMenuConfigurationNodesIO'
import { MenuConfigurationLinksData } from './configmenus/SankeyMenuConfigurationLinksData'
import { MenuConfigurationLinksAppearence } from './configmenus/SankeyMenuConfigurationLinksAppearence'
import { OpenSankeyMenuConfigurationLayout } from './configmenus/SankeyMenuConfigurationLayout'
import { SankeyMenuConfigurationNodesTooltip } from './configmenus/SankeyMenuConfigurationNodesTooltip'
import { SankeyMenuConfigurationNodesTags } from './configmenus/SankeyMenuConfigurationNodesTags'
import { MenuConfigurationLinksTags } from './configmenus/SankeyMenuConfigurationLinksTags'
import { MenuConfigurationLinksTooltip } from './configmenus/SankeyMenuConfigurationLinksTooltip'
import { OpenSankeyConfigurationsMenus } from './configmenus/SankeyMenuConfiguration'
import { SankeySettingsEditionElementTags } from './configmenus/SankeyMenuConfigurationTags'
import { AddSimpleLevelDropDown } from './configmenus/SankeyMenuBanner'

import {
  FType_InitalizeSelectorDetailNodes,
  FType_InitializeAdditionalMenus,
  FType_InitializeApplicationData,
  FType_InitializeMenuConfiguration,
  FType_InitializeReinitialization,
  FType_ModuleDialogs,
  FType_ProcessFunctions
} from './types/FunctionTypes'


declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
  }

/**
 * Set up data with initial value as Type_JSON
 *
 * @param {*} initial_data
 * @return {*}
 */
export const initializeApplicationData: FType_InitializeApplicationData = (
  initial_data
) => {
  // Set openSankey
  const application_data = new Class_ApplicationDataOS(window.SankeyToolsStatic)
  application_data.activateAllTokens()

  if (initial_data !== undefined) {
    application_data.fromJSON(initial_data)
  }
  return application_data
}

/**
 * Réinitialise data et vide les noeud/liens sélectionnés
 * @param {Type_GenericApplicationDataOS} new_data
 */
export const initializeReinitialization: FType_InitializeReinitialization = (
  new_data: Type_GenericApplicationDataOS,
) => (
  () => {
    localStorage.removeItem('diff')
    localStorage.removeItem('data')
    localStorage.removeItem('last_save')
    localStorage.removeItem('initial_data')
    localStorage.removeItem('icon_imported')

    // Reset Class_ApplicationDataOS instance
    new_data.reset()

    sessionStorage.setItem('dismiss_warning_sankey_plus', '0')
    sessionStorage.setItem('dismiss_warning_sankey_mfa', '0')
  }
)

/**
 * Additional menus components.
 * @param {*} additional_menus
 * @param {*} new_data
 */
export const initializeAdditionalMenus: FType_InitializeAdditionalMenus = (
  additional_menus,
  new_data
) => {
  if (!new_data.is_static) {
    additional_menus.additional_nav_item.push(
      <OpenSankeySaveButton
        new_data={new_data}
      />
    )
  }
}

export const initializeDiagrammSelector: FType_InitializeDiagrammSelector = (
  _new_data
) => {
  return OpenSankeyDiagramSelector
}

// Modal Dialogs
export const moduleDialogs: FType_ModuleDialogs = (
  new_data,
  additional_menus,
  menu_configuration_nodes_attributes,
  _processFunction // TODO unused
) => {
  const { t } = new_data
  return [
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_node_apparence'}
      content={menu_configuration_nodes_attributes}
      title={t('Menu.Noeuds') + ' ' + t('Noeud.apparence.apparence')}
    />,
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_node_io'}
      content={<SankeyMenuConfigurationNodesIO
        new_data={new_data}
        menu_for_modal={true}
      />}
      title={t('Menu.Noeuds') + ' ' + t('Noeud.PF.PFM')}
    />,
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_link_data'}
      content={<MenuConfigurationLinksData
        new_data={new_data}
        additional_data_element={additional_menus.additional_data_element}
      />}
      title={t('Menu.flux') + ' ' + t('Flux.data.données')}
    />,
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_link_appearence'}
      content={<MenuConfigurationLinksAppearence
        new_data={new_data}
        additional_link_appearence_items={additional_menus.additional_link_appearence_items}
        menu_for_style={false}
      />}
      title={t('Menu.flux') + ' ' + t('Flux.apparence.apparence')}
    />,
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_layout'}
      content={<OpenSankeyMenuConfigurationLayout
        new_data={new_data}
        extra_background_element={additional_menus.extra_background_element}
      />}
      title={t('Menu.MEP')}
    />,
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_node_tooltip'}
      content={<SankeyMenuConfigurationNodesTooltip
        new_data={new_data}
        menu_for_modal={true}
      />}
      title={t('Menu.Noeuds') + ' ' + t('Noeud.IS')}
    />,
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_node_tags'}
      content={<SankeyMenuConfigurationNodesTags
        new_data={new_data}
        menu_for_modal={true}
      />}
      title={t('Menu.Noeuds') + ' ' + t('Menu.Etiquettes')}
    />,
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_link_tags'}
      content={<MenuConfigurationLinksTags
        new_data={new_data}
        menu_for_modal={true}
      />}
      title={t('Menu.Flux') + ' ' + t('Menu.Etiquettes')}
    />,
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_link_tooltip'}
      content={<MenuConfigurationLinksTooltip
        new_data={new_data}
        menu_for_modal={true}
      />}
      title={t('Menu.flux') + ' ' + t('Flux.IB')}
    />
  ]
}

//- BackEnd
export const initializeProcessFunctions: (
  new_data: Type_GenericApplicationDataOS,
) => FType_ProcessFunctions = (new_data) => {
  const _ = {
    ref_processing: useRef(false),
    ref_setter_processing: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
    failure: useRef(false),
    not_started: useRef(true),
    ref_result: useRef<Dispatch<SetStateAction<string>>>(() => null),
    path: useRef(''),
    retrieveExcelResults,
    launch: (cur_path: string) => {
      _.path.current = cur_path
      new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_excel_reading_process.current!(true)
      _.ref_setter_processing.current(true)
      _.failure.current = true
      _.not_started.current = false
      _.ref_result.current('')
    }
  }
  return _
}

/***************************************************************************************/

export const initializeMenuConfiguration: FType_InitializeMenuConfiguration = (
  new_data,
  additional_menus,
  config_link_data,
  config_link_attr,
  menu_configuration_nodes_attributes,
) => {

  return <OpenSankeyConfigurationsMenus
    new_data={new_data}
    menu_configuration_layout={
      <OpenSankeyMenuConfigurationLayout
        new_data={new_data}
        extra_background_element={additional_menus.extra_background_element}
      />
    }
    menu_configuration_node_tags={
      <SankeySettingsEditionElementTags
        new_data={new_data}
        elementTagNameProp='node_taggs'
      />
    }
    menu_configuration_link_tags={
      <SankeySettingsEditionElementTags
        new_data={new_data}
        elementTagNameProp='flux_taggs'
      />
    }
    menu_configuration_data_tags={
      <SankeySettingsEditionElementTags
        new_data={new_data}
        elementTagNameProp='data_taggs'
      />
    }
    menu_configuration_nodes_attributes={menu_configuration_nodes_attributes}
    menu_config_link_data={config_link_data}
    menu_config_link_attr={config_link_attr}
    additional_menus={additional_menus}
  />
}

/***************************************************************************************/

/**
 * TODO Description
 * @param {*} new_data
 * @return {*}
 */
export const initalizeSelectorDetailNodes: FType_InitalizeSelectorDetailNodes = (
  new_data
) => {
  const { t } = new_data

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
            (new_data.drawing_area.sankey.level_taggs_list.length > 0) ?
              (<>
                {
                  <AddSimpleLevelDropDown
                    new_data={new_data}
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


