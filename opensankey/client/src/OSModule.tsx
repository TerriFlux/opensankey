import React from 'react'

/*************************************************************************************************/

import {
  FType_InitializeAdditionalMenus,
  FType_InitializeApplicationData,
  FType_InitializeMenuConfiguration,
  FType_InitializeReinitialization,
  FType_ModuleDialogs,
} from './types/FunctionTypes'
import {
  Class_ApplicationDataOS,
  Type_GenericApplicationDataOS
} from './types/TypesOS'
import { MenuDraggable, OpenSankeySaveButton } from './topmenus/SankeyMenuTop'
import { SankeyMenuConfigurationNodesIO } from './configmenus/SankeyMenuConfigurationNodesIO'
import { MenuConfigurationLinksData } from './configmenus/SankeyMenuConfigurationLinksData'
import { MenuConfigurationLinksAppearence } from './configmenus/SankeyMenuConfigurationLinksAppearence'
import { OpenSankeyMenuConfigurationLayout } from './configmenus/SankeyMenuConfigurationLayout'
import { OpenSankeyConfigurationsMenus } from './configmenus/SankeyMenuConfiguration'

import { FType_InitializeDiagrammSelector } from './dialogs/types/SankeyMenuDialogsTypes'
import { OpenSankeyDiagramSelector } from './dialogs/SankeyMenuDialogs'


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
    new_data.draw()

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
        additionMenus={additional_menus}
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
        contextual={true}
      />}
      title={t('Menu.MEP')}
    />,


  ]
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
        contextual={false}
      />
    }
    menu_configuration_nodes_attributes={menu_configuration_nodes_attributes}
    menu_config_link_data={config_link_data}
    menu_config_link_attr={config_link_attr}
    additional_menus={additional_menus}
  />
}

/***************************************************************************************/



