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
import { WrapperContentConfig } from './deps/OpenSankey/components/configmenus/MenuCommon'
import {
  FType_InitializeAdditionalMenus,
  FType_ModuleDialogs,
  initializeAdditionalMenus,
  moduleDialogs
} from './deps/OpenSankey/Modules'

import { ContextZDT } from './components/ContextZDTOSP'

import {
  ModalTransparentViewAttrOSP,
  ModalViewNotSavedOSP,
  BannerViewsOSP,
  ViewsConfig,
  ModalCreateUnitaryViewOSP,
} from './components/SankeyPlusViews'

import {
  ModalSelectionIcon
} from './components/SankeyPlusCatalogIcon'
import {SankeyMenuConfigurationNodesTags} from './components/SankeyPlusMenuConfigurationNodesTags'
import {MenuConfigurationLinksTags} from './components/SankeyPlusMenuConfigurationLinksTags'
import {SankeySettingsEditionElementTags} from './components/SankeyPlusMenuConfigurationTags'
import {ImportImageAsSvgBg} from './components/UtilsOSP'
import { AFMEditionMenu } from './components/AFMSankeyMenu'
import { Class_ApplicationDataOSP } from './types/ApplicationDataOSP'

/**
 * Generic Type that with given argument return a functionType that return a given type,
 * Useful when we want to only recast the returned value of OS function in submodule
 * so that when original functionType change linter should trigger in submodule too
 */
type RecastReturnTypeOfFunction<T extends any[], R extends any> = (...args: T) => R  // eslint-disable-line
/**
 * Special parameter for additionalMenu
 * It takes original AdditionalMenusType parameters but also its return object that contains array of additional JSX.Element
 */
type PType_InitializeAdditionalMenus = Parameters<FType_InitializeAdditionalMenus>
type PType_InitializeAdditionalMenusOSP = [...PType_InitializeAdditionalMenus]
export type FType_InitializeAdditionalMenusOSP = RecastReturnTypeOfFunction<PType_InitializeAdditionalMenusOSP, void>

/**
 * Since AdditionalMenus is an OS var specially created to add external element in menus
 *  we don't have to recast initializeAdditionalMenusType for more var or overwritting parameter types
 * @param {*} additionalMenus
 * @param {*} new_data_plus
 */
export const initializeAdditionalMenusOSP: FType_InitializeAdditionalMenusOSP = (
  additionalMenus,
  new_data
) => {
  // OpenSankey initialisation ----------------------------------------------------------

  initializeAdditionalMenus(
    additionalMenus,
    new_data
  )

  // Data -------------------------------------------------------------------------------
  const new_data_plus = new_data as Class_ApplicationDataOSP
  const { t, has_sankey_plus, has_sankey_afm, icon_library } = new_data_plus



  additionalMenus.current.external_top_buttons_item['views'] = <BannerViewsOSP app_data={new_data_plus} />

  // Add an option for flow color rule
  if (has_sankey_plus) {
    new_data_plus.menu_configuration.flow_color_origin_type.push('gradient')
    new_data_plus.menu_configuration.flow_color_origin_type.push('auto')
  }

  if (has_sankey_afm && !new_data.is_static) {
    additionalMenus.current.external_top_buttons_item['afm'] = <AFMEditionMenu
      app_data={new_data_plus}
    />
  }
  // TODO OTHER JSX ELEMENTS -----------------------------------------------------------

  // TODO : manque implementation des exort svg
  // // Top Menus
  // additionalMenus.current.external_file_export_item.push(<OSPItemExport />)

  // Page settings
  additionalMenus.current.extra_background_element = <ImportImageAsSvgBg
    new_data_plus={new_data_plus}
  />

  //Context node
  // if (new_data_plus.has_sankey_plus) {
  //   additionalMenus.current.additional_context_node_element['osp_context'] = <Menu placement='end'>
  //     <MenuButton variant='contextmenu_button' as={Button} rightIcon={<ChevronRightIcon />} className="dropdown-basic">
  //       {t('Noeud.osp_context')}
  //     </MenuButton>
  //     <MenuList>
  //       <ButtonNodeContextCreateUnitaryView app_data={new_data_plus} />
  //     </MenuList>
  //   </Menu>
  // }

  // Get index of seprator in context node that come after masking node shape/label so we can then insert a button to mask value (OSP functionality)
  // const idx_sep_3 = additionalMenus.current.context_node_order.indexOf('sep_3')
  // additionalMenus.current.context_node_order.splice(idx_sep_3, 0, 'osp_context')

  // additionalMenus.current.additional_node_config_style.push(<NodeIconOSP new_data_plus={new_data_plus} />)

  additionalMenus.current.template_module_key.push('intermediary')
  additionalMenus.current.template_module_key.push('advanced')


  additionalMenus.current.additional_menu_type['presentation'] = 'presentation'
 
  additionalMenus.current.additional_menu_button_element_configurable['view'] = { icon: icon_library.icon_view, text: t('Menu.Config.element_view'), disabled: !has_sankey_plus }
  additionalMenus.current.additional_menu_button_element_configurable['data_tag'] = { icon: has_sankey_plus ? icon_library.icon_data_tag_unselected : icon_library.icon_data_tag_diabled, text: t('Menu.Config.element_data_tag'), disabled: !has_sankey_plus }
  additionalMenus.current.additional_menu_button_element_configurable['flow_tag'] = { icon: has_sankey_plus ? icon_library.icon_flow_tag : icon_library.icon_flow_tag_diabled, text: t('Menu.Config.element_flow_tag'), disabled: !has_sankey_plus }
  additionalMenus.current.additional_menu_button_element_configurable['node_tag'] = { icon: has_sankey_plus ? icon_library.icon_node_tag : icon_library.icon_node_tag_diabled, text: t('Menu.Config.element_node_tag'), disabled: !has_sankey_plus }
  if (new_data_plus.has_sankey_dev) additionalMenus.current.additional_menu_button_element_configurable['level_tag'] = { icon: has_sankey_plus ? icon_library.icon_level_tag : icon_library.icon_level_tag_diabled, text: t('Menu.Config.element_level_tag'), disabled: !has_sankey_plus }

  // Add menu for new menu type 'Présentation'
  additionalMenus.current.additional_new_menu_config_content['presentation'] = {
    // 'object': <WrapperContentConfig title={t('Menu.Config.element_object')} hide={!has_sankey_plus}>
    //   <MenuConfigurationContainersOSP app_data={new_data_plus} />
    // </WrapperContentConfig>,

    // 'node': <WrapperContentConfig title={t('Flux.IS')}><>
    //   <MenuConfigurationNodesTooltip new_data={new_data_plus} />
    //   <NodeHyperLinkOSP new_data_plus={new_data_plus} />
    // </>
    // </WrapperContentConfig>,

    // 'flow': <WrapperContentConfig title={t('Noeud.IS')}>
    //   <MenuConfigurationLinksTooltip app_data={new_data_plus} />
    // </WrapperContentConfig>,
    'node_tag': <WrapperContentConfig title={t('Menu.EN')} >
      <>
        <SankeySettingsEditionElementTags
          new_data={new_data_plus}
          elementTagNameProp='node_taggs'
        />
        <SankeyMenuConfigurationNodesTags
          app_data={new_data_plus}
        /></>
    </WrapperContentConfig>,
    'flow_tag': <WrapperContentConfig title={t('Menu.EF')} >
      <><SankeySettingsEditionElementTags
        new_data={new_data_plus}
        elementTagNameProp='flux_taggs'
      />
      <MenuConfigurationLinksTags
        new_data={new_data_plus}
      />
      </>
    </WrapperContentConfig>,
    'data_tag': <WrapperContentConfig title={t('Menu.ED')} >
      <SankeySettingsEditionElementTags
        new_data={new_data_plus}
        elementTagNameProp='data_taggs'
      />
    </WrapperContentConfig>,
    'view': <WrapperContentConfig title={t('view.storytelling')}>
      <ViewsConfig app_data={new_data_plus}
      />
    </WrapperContentConfig>,
  }

  // Add menu for menu type 'data'
  // additionalMenus.current.additional_menu_config_content['data'] = {
  //   'data_tag': <WrapperContentConfig title={t('Menu.ED')} >
  //     <SankeySettingsEditionElementTags
  //       new_data={new_data_plus}
  //       elementTagNameProp='data_taggs'
  //     />
  //   </WrapperContentConfig>
  // }
  if (new_data_plus.has_sankey_dev) {
    additionalMenus.current.additional_menu_config_content['presentation']['level_tag'] = <WrapperContentConfig title={t('Menu.Hierarchy')} >
      <><SankeySettingsEditionElementTags
        new_data={new_data_plus}
        elementTagNameProp='level_taggs'
      />
      </>
    </WrapperContentConfig>
  }
}

// module_dialogsType return a JSX.Element array wich is a react type
// we don't need to recast it ( and don't need additionnal parameters for OSP dialogs)
export const moduleDialogsOSP: FType_ModuleDialogs = (
  new_data,
  additional_menus,
  menu_configuration_nodes_attributes 
) => {
  const modules_dialogs = moduleDialogs(
    new_data,
    additional_menus,
    menu_configuration_nodes_attributes
  )

  const app_data = new_data as Class_ApplicationDataOSP
  const modules_dialogs_OSP = [
    <ContextZDT
      app_data={app_data}
    />,
    <ModalTransparentViewAttrOSP
      app_data={app_data}
    />,
    <ModalViewNotSavedOSP
      app_data={app_data}
    />,
    <ModalSelectionIcon
      app_data={app_data}
    />,
    <ModalCreateUnitaryViewOSP
      app_data={app_data}
    />
  ]

  return [
    ...modules_dialogs,
    ...modules_dialogs_OSP
  ]
}