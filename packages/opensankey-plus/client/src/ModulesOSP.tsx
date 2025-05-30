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

// External imports
import React from 'react'

// OpenSankey imports
import {
  MenuDraggable
} from './deps/OpenSankey/components/topmenus/SankeyMenus'
import { WrapperContentConfig } from './deps/OpenSankey/components/configmenus/SankeyMenuComponents'
import {
  OpenSankeyDiagramSelector
} from './deps/OpenSankey/components/dialogs/SankeyMenuDialogs'
import {
  FType_InitializeDiagrammSelector
} from './deps/OpenSankey/components/dialogs/types/SankeyMenuDialogsTypes'
import {
  FType_ModuleDialogs
} from './deps/OpenSankey/types/FunctionTypes'
import {
  IType_DictHookRefSetterShowDialogComponents
} from './deps/OpenSankey/types/MenuConfig'
import {
  initializeAdditionalMenus,
  moduleDialogs
} from './deps/OpenSankey/Modules'

// Local imports
import {
  FType_InitializeAdditionalMenusOSP,
  FType_InitializeApplicationDataOSP
} from './ftypes/SankeyPlusApplication'
import {
  Class_ApplicationDataOSP,
  Type_GenericApplicationDataOSP
} from './types/TypesOSP'

import {
  MenuConfigurationFreeLabelsOSP,
  ContextZDTOSP,
} from './components/MenuConfigEdition/SankeyPlusMenuConfigurationLabels'
import {
  ButtonNodeContextCreateUnitaryView,
  ButtonNodeContextCreateZDTAroundSelectedNode,
  ButtonNodeContextSelectDescendantOFSelectedNodes,
  ButtonNodeContextStartAnimation,
  NodeHyperLinkOSP,
  NodeIconOSP
} from './components/MenuConfigEdition/SankeyPlusNodes'

import {
  ModalTransparentViewAttrOSP,
  MenuEnregistrerViewOSP,
  ModalViewNotSavedOSP,
  BannerViewsOSP,
  ViewsConfig,
  ModalCreateUnitaryViewOSP,
} from './components/MenuConfigEdition/SankeyPlusViews'
import {
  SankeyMenuConfigurationNodesTooltip
} from './components/MenuConfigEdition/SankeyPlusMenuConfigurationNodesTooltip'
import {
  ModalSelectionIconsOSP
} from './components/MenuConfigEdition/SankeyPlusCatalogIcon'
import {
  NodeForeignObjectOSP
} from './components/MenuConfigEdition/SankeyPlusForeignObject'
import {
  ButtonLinkContextAssignTag,
  MenuConfLinkApparenceDashedOSP,
  MenuConfLinkScientificPrecision
} from './components/MenuConfigEdition/SankeyPlusLink'
import {
  SankeyMenuConfigurationNodesTags
} from './components/MenuConfigEdition/SankeyPlusMenuConfigurationNodesTags'
import {
  MenuConfigurationLinksTags
} from './components/MenuConfigEdition/SankeyPlusMenuConfigurationLinksTags'
import {
  MenuConfigurationLinksTooltip
} from './components/MenuConfigEdition/SankeyPlusMenuConfigurationLinksTooltip'
import {
  SankeySettingsEditionElementTags
} from './components/MenuConfigEdition/SankeyPlusMenuConfigurationTags'

import {
  TransformationElementsOSP
} from './components/ConvertOSP'
import {
  DrawerSequenceDataTagg,
  ImportImageAsSvgBg,
} from './components/UtilsOSP'
import { ToolbarFilter } from './components/FilterComponent/TagsFilterComponent'
import { SankeyMenuConfigurationLevelTags } from './components/MenuConfigEdition/SankeyPlusMenuConfigurationLevlTags'
import { AFMEditionMenu } from './components/AFM/AFMSankeyMenu'
import { SupplyUseModelisationProd } from './components/AFM/SankeyReconciliation'
import { Button, Menu, MenuButton, MenuList } from '@chakra-ui/react'
import { ChevronRightIcon } from '@chakra-ui/icons'

declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
  }

export const initializeApplicationDataOSP: FType_InitializeApplicationDataOSP = (
  initial_data
) => {
  // Init application data
  const new_data_plus = new Class_ApplicationDataOSP(window.SankeyToolsStatic)
  // Read data from cache if it exist
  if (initial_data !== undefined) {
    new_data_plus.fromJSON(initial_data)
  }
  return new_data_plus
}

export const initializeDiagrammSelectorOSP: FType_InitializeDiagrammSelector = (
  _new_data
) => {
  return OpenSankeyDiagramSelector
}

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
  // No initialisation if static --------------------------------------------------------

  if (new_data.is_static) {
    return
  }

  // OpenSankey initialisation ----------------------------------------------------------

  initializeAdditionalMenus(
    additionalMenus,
    new_data
  )

  // Data -------------------------------------------------------------------------------
  const new_data_plus = new_data as Type_GenericApplicationDataOSP
  const { t, has_sankey_plus, has_sankey_afm, icon_library } = new_data_plus

  // Add Buttons to open banner of views
  additionalMenus.current.external_top_buttons_item['views'] = <BannerViewsOSP new_data_plus={new_data_plus} />

  // Add an option for flow color rule
  if (has_sankey_plus) {
    new_data_plus.menu_configuration.flow_color_origin_type.push('gradient')
    new_data_plus.menu_configuration.flow_color_origin_type.push('auto')
  }

  if (has_sankey_afm) {
    additionalMenus.current.external_top_buttons_item['afm'] = <AFMEditionMenu
      application_data_mfa={new_data_plus}
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
  if (new_data_plus.has_sankey_plus) {
    additionalMenus.current.additional_context_node_element['osp_context'] = <Menu placement='end'>
      <MenuButton variant='contextmenu_button' as={Button} rightIcon={<ChevronRightIcon />} className="dropdown-basic">
        {t('Noeud.osp_context')}
      </MenuButton>
      <MenuList>
        <ButtonNodeContextStartAnimation new_data={new_data_plus} />
        <ButtonNodeContextCreateUnitaryView new_data={new_data_plus} />
        <ButtonNodeContextCreateZDTAroundSelectedNode new_data={new_data_plus} />
        <ButtonNodeContextSelectDescendantOFSelectedNodes new_data={new_data_plus} />
      </MenuList>
    </Menu>
  }

  // Get index of seprator in context node that come after masking node shape/label so we can then insert a button to mask value (OSP functionality)
  const idx_sep_3 = additionalMenus.current.context_node_order.indexOf('sep_3')
additionalMenus.current.context_node_order.splice(idx_sep_3, 0, 'osp_context')

  // Add dashed config
  additionalMenus.current.additional_link_appearence_items.push(
    (menu_for_style: boolean) => <MenuConfLinkApparenceDashedOSP
      new_data_plus={new_data_plus}
      menu_for_style={menu_for_style}
    />)

  additionalMenus.current.additional_link_appearence_value.push((menu_for_style: boolean) => <MenuConfLinkScientificPrecision
    new_data_plus={new_data_plus}
    menu_for_style={menu_for_style}
  />)



  additionalMenus.current.additional_context_link_element['assign_tag'] = <ButtonLinkContextAssignTag new_data={new_data_plus} />

  // Insert OSP Button at a specific place in the link context menu
  const idx_sep_4 = additionalMenus.current.context_link_order.indexOf('sep_4')
  additionalMenus.current.context_link_order.splice(idx_sep_4, 0, 'assign_tag')


  // Addition chackbox for dialog save JSON dagram
  additionalMenus.current.additional_file_save_json_option.push(
    <MenuEnregistrerViewOSP
      new_data_plus={new_data_plus}
    />
  )

  // Place new button in desired order in the toolbar
  additionalMenus.current.toolbar_order.splice(1, 0, 'aggregation', 'link_visual_filter', 'node_tag_filter', 'link_tag_filter', 'data_tag_filter')

  // add option for updateLayout (OSP var to update)
  // (Only add these options if connected with OSP)

  // Add buttons in the menu transformation for adding ZDT and views as variable transferable in SuiteUpdateLayout
  additionalMenus.current.apply_transformation_additional_elements.push(
    <TransformationElementsOSP
      new_data_plus={new_data_plus}
    />
  )

  //Add data sequence in footer
  additionalMenus.current.footer.push(<DrawerSequenceDataTagg new_data={new_data_plus} />)




  additionalMenus.current.additional_node_config_style.push(<NodeIconOSP new_data_plus={new_data_plus} />)
  additionalMenus.current.additional_node_config_style.push(<NodeForeignObjectOSP new_data_plus={new_data_plus} />)

  additionalMenus.current.template_module_key.push('intermediary')
  additionalMenus.current.template_module_key.push('advanced')


  additionalMenus.current.additional_menu_type['presentation'] = 'presentation'
  additionalMenus.current.additional_menu_button_element_configurable['object'] = { icon: icon_library.icon_object, text: t('Menu.Config.element_object'), disabled: !has_sankey_plus }
  additionalMenus.current.additional_menu_button_element_configurable['view'] = { icon: icon_library.icon_view, text: t('Menu.Config.element_view'), disabled: !has_sankey_plus }
  additionalMenus.current.additional_menu_button_element_configurable['data_tag'] = { icon: has_sankey_plus ? icon_library.icon_data_tag_unselected : icon_library.icon_data_tag_diabled, text: t('Menu.Config.element_data_tag'), disabled: !has_sankey_plus }
  additionalMenus.current.additional_menu_button_element_configurable['flow_tag'] = { icon: has_sankey_plus ? icon_library.icon_flow_tag : icon_library.icon_flow_tag_diabled, text: t('Menu.Config.element_flow_tag'), disabled: !has_sankey_plus }
  additionalMenus.current.additional_menu_button_element_configurable['node_tag'] = { icon: has_sankey_plus ? icon_library.icon_node_tag : icon_library.icon_node_tag_diabled, text: t('Menu.Config.element_node_tag'), disabled: !has_sankey_plus }
  additionalMenus.current.additional_menu_button_element_configurable['level_tag'] = { icon: has_sankey_plus ? icon_library.icon_level_tag : icon_library.icon_level_tag_diabled, text: t('Menu.Config.element_level_tag'), disabled: !has_sankey_plus }

    // Add menu for new menu type 'Présentation'
    additionalMenus.current.additional_new_menu_config_content['presentation'] = {
      'object': <WrapperContentConfig title={t('Menu.Config.element_object')} hide={!has_sankey_plus}>
        <MenuConfigurationFreeLabelsOSP new_data_plus={new_data_plus} />
      </WrapperContentConfig>,

      'node': <WrapperContentConfig title={t('Flux.IS')}><>
        <SankeyMenuConfigurationNodesTooltip new_data={new_data_plus} />
        <NodeHyperLinkOSP new_data_plus={new_data_plus} />
      </>
      </WrapperContentConfig>,

      'flow': <WrapperContentConfig title={t('Noeud.IS')}>
        <MenuConfigurationLinksTooltip new_data={new_data_plus} />
      </WrapperContentConfig>,
      'node_tag': <WrapperContentConfig title={t('Menu.EN')} >
        <>
          <SankeySettingsEditionElementTags
            new_data={new_data_plus}
            elementTagNameProp='node_taggs'
          />
          <SankeyMenuConfigurationNodesTags
            new_data={new_data_plus}
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

      'view': <WrapperContentConfig title={t('view.storytelling')}>
        <ViewsConfig new_data_plus={new_data_plus}
        />
      </WrapperContentConfig>,
    }

  // Add menu for menu type 'data'
  additionalMenus.current.additional_menu_config_content['data'] = {
    'data_tag': <WrapperContentConfig title={t('Menu.ED')} >
      <SankeySettingsEditionElementTags
        new_data={new_data_plus}
        elementTagNameProp='data_taggs'
      />
    </WrapperContentConfig>,
    'level_tag': <WrapperContentConfig title={t('Menu.Hierarchy')} >
    <><SankeySettingsEditionElementTags
      new_data={new_data_plus}
      elementTagNameProp='level_taggs'
    />
    <SankeyMenuConfigurationLevelTags
      new_data={new_data_plus}
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
  menu_configuration_nodes_attributes,
  processFunctions
) => {

  // OpenSankey Menu
  const modules_dialogs = moduleDialogs(
    new_data,
    additional_menus,
    menu_configuration_nodes_attributes,
    processFunctions
  )

  // Cast type
  const new_data_plus = new_data as Type_GenericApplicationDataOSP
  const { t } = new_data_plus
  // Add new_menus
  const content_draggable_menu_zdt = <MenuConfigurationFreeLabelsOSP
    new_data_plus={new_data_plus}
  />
  const modules_dialogs_OSP = [
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={new_data_plus.menu_configuration.dict_setter_show_dialog_plus as unknown as IType_DictHookRefSetterShowDialogComponents}
      dialog_name={'ref_setter_show_menu_zdt' as keyof IType_DictHookRefSetterShowDialogComponents}
      content={content_draggable_menu_zdt}
      title={t('Menu.LL')}
      maxW='20%'
    />,
    <ContextZDTOSP
      new_data_plus={new_data_plus}
    />,
    <ModalTransparentViewAttrOSP
      new_data_plus={new_data_plus}
    />,
    <ModalViewNotSavedOSP
      new_data_plus={new_data_plus}
    />,
    <ModalSelectionIconsOSP
      new_data_plus={new_data_plus}
    />,
    <ModalCreateUnitaryViewOSP
      new_data_plus={new_data_plus}
    />,
    <ToolbarFilter
      new_data={new_data_plus}
    />,
    <SupplyUseModelisationProd
      application_data_mfa={new_data_plus}
      launch={processFunctions.launch}
    />
  ]

  return [
    ...modules_dialogs,
    ...modules_dialogs_OSP
  ]
}