// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

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
  Class_ApplicationData,
  Type_GenericApplicationData
} from './types/Types'

import { MenuDraggable, OpenSankeySaveButton } from './components/topmenus/SankeyMenuTop'

import { SankeyMenuConfigurationNodesIO } from './components/configmenus/SankeyMenuConfigurationNodesIO'
import { MenuConfigurationLinksData } from './components/configmenus/SankeyMenuConfigurationLinksData'
import { MenuConfigurationLinksAppearence } from './components/configmenus/SankeyMenuConfigurationLinksAppearence'
import { OpenSankeyMenuConfigurationLayout } from './components/configmenus/SankeyMenuConfigurationLayout'
import { OpenSankeyConfigurationsMenus } from './components/configmenus/SankeyMenuConfiguration'

import { FType_InitializeDiagrammSelector } from './components/dialogs/types/SankeyMenuDialogsTypes'
import { OpenSankeyDiagramSelector } from './components/dialogs/SankeyMenuDialogs'


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
  const application_data = new Class_ApplicationData(window.SankeyToolsStatic)

  if (initial_data !== undefined) {
    application_data.fromJSON(initial_data)
  }
  return application_data
}

/**
 * Réinitialise data et vide les noeud/liens sélectionnés
 * @param {Type_GenericApplicationData} new_data
 */
export const initializeReinitialization: FType_InitializeReinitialization = (
  new_data: Type_GenericApplicationData,
) => (
  () => {
    localStorage.removeItem('diff')
    localStorage.removeItem('data')
    localStorage.removeItem('last_save')
    localStorage.removeItem('initial_data')
    localStorage.removeItem('icon_imported')

    // Reset Class_ApplicationData instance
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
        contextual={true}
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



