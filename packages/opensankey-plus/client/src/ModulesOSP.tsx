// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// All rights reserved for TerriFlux
// ==================================================================================================

// External imports
import React from 'react'

// OpenSankey imports
import {
  MenuDraggable
} from './deps/OpenSankey/components/topmenus/SankeyMenuTop'
import {
  OpenSankeyDiagramSelector
} from './deps/OpenSankey/components/dialogs/SankeyMenuDialogs'
import {
  FType_InitializeDiagrammSelector
} from './deps/OpenSankey/components/dialogs/types/SankeyMenuDialogsTypes'
import {
  FType_InitializeReinitialization,
  FType_ModuleDialogs
} from './deps/OpenSankey/types/FunctionTypes'
import {
  IType_DictHookRefSetterShowDialogComponents
} from './deps/OpenSankey/types/MenuConfig'
import {
  initializeAdditionalMenus,
  initializeReinitialization,
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
  ZDTMenuAsAccordeonItemOSP,
  MenuConfigurationFreeLabelsOSP,
  ContextZDTOSP,
  MenuPreferenceLabelsOSP
} from './components/MenuConfigEdition/SankeyPlusMenuConfigurationLabels'
import {
  ButtonNodeContextShowTagMenu,
  ButtonNodeContextShowTooltipMenu,
  ButtonNodeContextStartAnimation,
  NodeHyperLinkOSP,
  NodeIconOSP
} from './components/MenuConfigEdition/SankeyPlusNodes'

import {
  ModalTransparentViewAttrOSP,
  MenuEnregistrerViewOSP,
  ModalViewNotSavedOSP,
  BannerViewsOSP,
  MenuPreferenceViewOSP,
  ViewsAccordion,
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
  ButtonLinkContextShowTagMenu,
  ButtonLinkContextShowTooltipMenu,
  MenuConfLinkApparenceDashedOSP,
  MenuConfLinkApparenceGradientOSP,
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
  MenuPreferenceEditionTag
} from './components/MenuConfigEdition/SankeyPlusMenuConfigurationTags'

import {
  TransformationElementsOSP
} from './components/ConvertOSP'
import {
  DrawerSequenceDataTagg,
  ImportImageAsSvgBg,
  MenuConfEditionTag,
  ToolBarDataTagFilter,
  ToolBarLevelFilter,
  ToolBarLinkTagFilter,
  ToolBarLinkVisualFilter,
  ToolBarNodeTagFilter,
} from './components/UtilsOSP'

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

export const initializeReinitializationOSP: FType_InitializeReinitialization = (
  new_data
) => {
  return () => {
    initializeReinitialization(new_data)()
    localStorage.removeItem('icon_imported')
    sessionStorage.setItem('dismiss_warning_sankey_plus', '0')
  }
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

  // JSX Elements for views navbar ------------------------------------------------------
  if (new_data_plus.has_sankey_plus) {
    // Edition DataTag
    additionalMenus.additional_configuration_menus_primary_accordion_elements.push(<MenuConfEditionTag
      new_data_plus={new_data_plus}
    />)

    // AddMenu accordion views
    additionalMenus.additional_configuration_menus_primary_accordion_elements.push(
      <ViewsAccordion
        new_data_plus={new_data_plus}
      />
    )
  }
  if (new_data_plus.has_sankey_plus || new_data_plus.has_views)
    additionalMenus.externale_navbar_item['view'] = <BannerViewsOSP
      new_data_plus={new_data_plus}
    />

  // TODO OTHER JSX ELEMENTS -----------------------------------------------------------

  // TODO : manque implementation des exort svg
  // // Top Menus
  // additionalMenus.external_file_export_item.push(<OSPItemExport />)

  // Page settings
  additionalMenus.extra_background_element = <ImportImageAsSvgBg
    new_data_plus={new_data_plus}
  />
  additionalMenus.additional_menu_configuration_nodes['Noeud.tabs.tags'] = <SankeyMenuConfigurationNodesTags
    new_data={new_data_plus}
    menu_for_modal={false}
  />

  // Menu conf nodes
  additionalMenus.additional_menu_configuration_nodes['Noeud.tabs.infos'] = <SankeyMenuConfigurationNodesTooltip
    new_data={new_data_plus}
    menu_for_modal={false}
  />
  additionalMenus.additional_menu_configuration_nodes['Noeud.tabs.icon'] = <NodeIconOSP
    new_data_plus={new_data_plus}
    menu_for_modal={false}
  />
  additionalMenus.additional_menu_configuration_nodes['Noeud.tabs.fo'] = <NodeForeignObjectOSP
    new_data_plus={new_data_plus}
    is_activated={new_data_plus.has_sankey_plus}
  />
  additionalMenus.additional_menu_configuration_nodes['Noeud.tabs.hl'] = <NodeHyperLinkOSP
    new_data_plus={new_data_plus}
    is_activated={new_data_plus.has_sankey_plus}
  />


  //Context node
  additionalMenus.context_node_order.push('drag_tag', 'drag_tooltip')
  additionalMenus.additional_context_node_element['drag_tag'] = <ButtonNodeContextShowTagMenu new_data={new_data_plus} />
  additionalMenus.additional_context_node_element['drag_tooltip'] = <ButtonNodeContextShowTooltipMenu new_data={new_data_plus} />
  additionalMenus.additional_context_node_element['animate'] = <ButtonNodeContextStartAnimation new_data={new_data_plus} />

  // Get index of seprator in context node that come after masking node shape/label so we can then insert a button to mask value (OSP functionality)
  const idx_sep_3 = additionalMenus.context_node_order.indexOf('sep_3')
  additionalMenus.context_node_order.splice(idx_sep_3, 0, 'animate')

  //Links
  additionalMenus.additional_menu_configuration_links['Noeud.tags_node.tags'] = <MenuConfigurationLinksTags
    new_data={new_data_plus}
    menu_for_modal={false}
  />
  additionalMenus.additional_menu_configuration_links['Flux.IS'] = <MenuConfigurationLinksTooltip
    new_data={new_data_plus}
    menu_for_modal={false}
  />

  // Add dashed config
  additionalMenus.additional_link_appearence_items.push(
    (menu_for_style: boolean) => <MenuConfLinkApparenceDashedOSP
      new_data_plus={new_data_plus}
      menu_for_style={menu_for_style}
    />)

  // Add gradient config
  additionalMenus.additional_link_appearence_items.push((menu_for_style: boolean) => <MenuConfLinkApparenceGradientOSP
    new_data_plus={new_data_plus}
    menu_for_style={menu_for_style}
  />)
  additionalMenus.additional_link_appearence_value.push((menu_for_style:boolean)=><MenuConfLinkScientificPrecision
    new_data_plus={new_data_plus}
    menu_for_style={menu_for_style}
  />)


  additionalMenus.context_link_order.push('drag_tooltip')
  additionalMenus.additional_context_link_element['drag_tooltip'] = <ButtonLinkContextShowTooltipMenu new_data={new_data_plus} />
  additionalMenus.additional_context_link_element['drag_tag'] = <ButtonLinkContextShowTagMenu new_data={new_data_plus} />
  additionalMenus.additional_context_link_element['assign_tag'] = <ButtonLinkContextAssignTag new_data={new_data_plus} />

  // Insert OSP Button at a specific place in the link context menu
  const idx_sep_4 = additionalMenus.context_link_order.indexOf('sep_4')
  additionalMenus.context_link_order.splice(idx_sep_4, 0, 'assign_tag')

  //Preferences
  additionalMenus.additional_preferences.push(
    <MenuPreferenceEditionTag
      new_data={new_data_plus}
    />
  )
  additionalMenus.additional_preferences.push(
    <MenuPreferenceLabelsOSP
      new_data_plus={new_data_plus}
    />
  )
  additionalMenus.additional_preferences.push(
    <MenuPreferenceViewOSP
      new_data_plus={new_data_plus}
    />
  )

  //- Builds Configuration Menus FreeLabel
  additionalMenus.additional_configuration_menus_edition_elements.push(
    <ZDTMenuAsAccordeonItemOSP
      new_data_plus={new_data_plus}
      content_menu_zdt={
        <MenuConfigurationFreeLabelsOSP
          new_data_plus={new_data_plus}
        />
      }
    />
  )

  // Addition chackbox for dialog save JSON dagram
  additionalMenus.additional_file_save_json_option.push(
    <MenuEnregistrerViewOSP
      new_data_plus={new_data_plus}
    />
  )

  // Add new button for the toolbar
  additionalMenus.toolbar_elements['link_visual_filter'] = <ToolBarLinkVisualFilter new_data_plus={new_data_plus} />
  additionalMenus.toolbar_elements['node_tag_filter'] = <ToolBarNodeTagFilter new_data_plus={new_data_plus} />
  additionalMenus.toolbar_elements['link_tag_filter'] = <ToolBarLinkTagFilter new_data_plus={new_data_plus} />
  additionalMenus.toolbar_elements['data_tag_filter'] = <ToolBarDataTagFilter new_data_plus={new_data_plus} />
  additionalMenus.toolbar_elements['aggregation'] = <ToolBarLevelFilter new_data_plus={new_data_plus} />

  // Place new button in desired order in the toolbar
  additionalMenus.toolbar_order.splice(1, 0, 'aggregation', 'link_visual_filter', 'node_tag_filter', 'link_tag_filter', 'data_tag_filter')

  // add option for updateLayout (OSP var to update)
  // (Only add these options if connected with OSP)

  // Add buttons in the menu transformation for adding ZDT and views as variable transferable in SuiteUpdateLayout
  additionalMenus.apply_transformation_additional_elements.push(
    <TransformationElementsOSP
      new_data_plus={new_data_plus}
    />
  )

  //Add data sequence in footer
  additionalMenus.footer.push(<DrawerSequenceDataTagg new_data={new_data_plus} />)

  additionalMenus.template_module_key.push('intermediary')
  additionalMenus.template_module_key.push('advanced')
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

  // Add new_menus
  const content_draggable_menu_zdt = <MenuConfigurationFreeLabelsOSP
    new_data_plus={new_data_plus}
  />
  const modules_dialogs_OSP = [
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={new_data_plus.menu_configuration.dict_setter_show_dialog_plus as unknown as IType_DictHookRefSetterShowDialogComponents}
      dialog_name={'ref_setter_show_menu_zdt' as keyof IType_DictHookRefSetterShowDialogComponents}
      content={content_draggable_menu_zdt}
      title={new_data_plus.t('Menu.LL')}
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
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_node_tags'}
      content={<SankeyMenuConfigurationNodesTags
        new_data={new_data_plus}
        menu_for_modal={true}
      />}
      title={new_data_plus.t('Menu.Noeuds') + ' ' + new_data_plus.t('Menu.Etiquettes')}
    />,
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_link_tags'}
      content={<MenuConfigurationLinksTags
        new_data={new_data_plus}
        menu_for_modal={true}
      />}
      title={new_data_plus.t('Menu.flux') + ' ' + new_data_plus.t('Menu.Etiquettes')}
    />,
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_node_tooltip'}
      content={<SankeyMenuConfigurationNodesTooltip
        new_data={new_data_plus}
        menu_for_modal={true}
      />}
      title={new_data_plus.t('Menu.Noeuds') + ' ' + new_data_plus.t('Noeud.IS')}
    />,
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_menu_link_tooltip'}
      content={<MenuConfigurationLinksTooltip
        new_data={new_data_plus}
        menu_for_modal={true}
      />}
      title={new_data_plus.t('Menu.flux') + ' ' + new_data_plus.t('Flux.IB')}
    />,
  ]

  return [
    ...modules_dialogs,
    ...modules_dialogs_OSP
  ]
}