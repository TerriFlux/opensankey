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
import { WrapperContentConfig } from '@terriflux/opensankey/src/components/configmenus/MenuCommon'
import { inspector_registry } from '@terriflux/opensankey/src/components/configmenus/inspector/InspectorRegistry'
import { filter_panel_registry } from '@terriflux/opensankey/src/components/topmenus/FilterPanelRegistry'
import {
  FType_InitializeAdditionalMenus,
  FType_ModuleDialogs,
  initializeAdditionalMenus,
  moduleDialogs
} from '@terriflux/opensankey/src/Modules'

import { ContextZDT } from './components/ContextZDTOSP'
import { BannerDataTagTopbar, BannerViewTagTopbar } from '@terriflux/opensankey/src/components/topmenus/Toolbar'

import {
  ModalTransparentViewAttrOSP,
  ModalViewNotSavedOSP,
  BannerViewsOSP,
  BannerViewNavOSP,
  ViewsConfig,
  renderApplyLayoutExtraTabOSP,
} from './components/SankeyPlusViews'

import { ModalAnimatedExportOSP } from './components/ModalAnimatedExportOSP'
import { ModalPublishOSP } from './components/ModalPublishOSP'
import { ModalUnitarySankeyOSP } from './components/ModalUnitarySankeyOSP'

import {
  ModalSelectionIcon
} from './components/SankeyPlusCatalogIcon'
import { registerExtraExportMenuItems } from './components/SankeyExportsOSP'
import { BannerTrialOSP, ModalTrialExpiredOSP } from './components/ModalTrialOSP'
import {SankeyMenuConfigurationNodesTags} from './components/SankeyPlusMenuConfigurationNodesTags'
import {MenuConfigurationLinksTags} from './components/SankeyPlusMenuConfigurationLinksTags'
import {SankeySettingsEditionElementTags} from './components/SankeyPlusMenuConfigurationTags'
import {ImportImageAsSvgBg} from './components/UtilsOSP'
import { AFMEditionMenu } from './components/AFMSankeyMenu'
import { Class_ApplicationDataOSP } from './types/ApplicationDataOSP'
import { Class_MenuConfigOSP } from './types/MenuConfigOSP'

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
  // Navigation entre vues (Préc./sélecteur/Suiv.), bloc topbar isolé après « Aide ».
  additionalMenus.current.external_top_buttons_item['views_nav'] = <BannerViewNavOSP app_data={new_data_plus} />
  // Sélecteur de data tags en topbar (groupes dont la bannière vaut 'topbar'), placé
  // à côté de la navigation entre vues.
  additionalMenus.current.external_top_buttons_item['data_tag_topbar'] = <BannerDataTagTopbar app_data={new_data} />
  // Générateur de vues (view tags) en topbar, sur le modèle de la navigation entre vues
  // (Préc./sélecteur/Suiv.) ; remplace l'ancien panneau « Génération de vues » du tiroir.
  additionalMenus.current.external_top_buttons_item['view_tag_topbar'] = <BannerViewTagTopbar app_data={new_data} />

  // CTA d'essai/abonnement en topbar (reflète l'état d'essai/licence, DB-driven).
  // Masqué si l'utilisateur détient la licence réelle. Rendu en haut à droite.
  additionalMenus.current.additional_nav_item.push(
    <BannerTrialOSP app_data={new_data_plus} />
  )

  // Add an option for flow color rule
  if (has_sankey_plus) {
    const flow_color_origin_type = new_data_plus.menu_configuration.flow_color_origin_type
    if (!flow_color_origin_type.includes('gradient')) {
      flow_color_origin_type.push('gradient')
    }
    if (!flow_color_origin_type.includes('auto')) {
      flow_color_origin_type.push('auto')
    }
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


  // #1243 — la matrice type×élément ne survit que pour l'ancien panneau (hors
  // licence dev) : ses cases « presentation » sont désormais servies par
  // l'inspecteur (onglet Tags = assignation) et le panneau Filtres (onglet
  // Éditer = groupes de tags + vues). L'ensemble tombera avec la matrice.
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
    additionalMenus.current.additional_new_menu_config_content['presentation']['level_tag'] = <WrapperContentConfig title={t('Menu.Hierarchy')} >
      <><SankeySettingsEditionElementTags
        new_data={new_data_plus}
        elementTagNameProp='level_taggs'
      />
      </>
    </WrapperContentConfig>
  }

  // #1243 — Onglet TAGS de l'inspecteur : ASSIGNATION des tags existants aux
  // éléments sélectionnés. L'édition des GROUPES de tags reste hors inspecteur
  // (règle R3 — panneau Filtres, à reloger en phase de bascule). Première
  // extension de couche : OSP enregistre son onglet dans le registre OS
  // (idempotent par id, donc sans risque au re-init/hot reload).
  // #1243 (règle R3) — l'édition des GROUPES de tags et les vues ne sont pas
  // des propriétés d'un élément : elles vivent dans le panneau Filtres (onglet
  // « Éditer »), là où ces groupes sont consommés. Remplace les cases
  // presentation × {node_tag, flow_tag, data_tag, level_tag, view} de la matrice.
  filter_panel_registry.register({
    id: 'osp.filter_edit.node_taggs',
    order: 10,
    title: () => t('Menu.EN'),
    gate: (app) => app.has_sankey_plus,
    render: (app) => <SankeySettingsEditionElementTags
      new_data={app as Class_ApplicationDataOSP}
      elementTagNameProp='node_taggs'
    />
  })
  filter_panel_registry.register({
    id: 'osp.filter_edit.flux_taggs',
    order: 20,
    title: () => t('Menu.EF'),
    gate: (app) => app.has_sankey_plus,
    render: (app) => <SankeySettingsEditionElementTags
      new_data={app as Class_ApplicationDataOSP}
      elementTagNameProp='flux_taggs'
    />
  })
  filter_panel_registry.register({
    id: 'osp.filter_edit.data_taggs',
    order: 30,
    title: () => t('Menu.ED'),
    gate: (app) => app.has_sankey_plus,
    render: (app) => <SankeySettingsEditionElementTags
      new_data={app as Class_ApplicationDataOSP}
      elementTagNameProp='data_taggs'
    />
  })
  filter_panel_registry.register({
    id: 'osp.filter_edit.level_taggs',
    order: 40,
    title: () => t('Menu.Hierarchy'),
    gate: (app) => app.has_sankey_plus && app.has_sankey_dev,
    render: (app) => <SankeySettingsEditionElementTags
      new_data={app as Class_ApplicationDataOSP}
      elementTagNameProp='level_taggs'
    />
  })
  filter_panel_registry.register({
    id: 'osp.filter_edit.views',
    order: 50,
    title: () => t('view.storytelling'),
    gate: (app) => app.has_sankey_plus,
    render: (app) => <ViewsConfig app_data={app as Class_ApplicationDataOSP} />
  })

  inspector_registry.register({
    id: 'osp.tab.tags',
    target: ['node', 'link', 'mixed'],
    order: 55,
    hue: 'presentation',
    title: () => 'Tags',
    data_only: true,
    gate: (app) => app.has_sankey_plus && (
      (app.drawing_area.selected_nodes_list.length > 0
        && app.drawing_area.sankey.node_taggs_list.length > 0)
      || (app.drawing_area.selected_links_list.length > 0
        && app.drawing_area.sankey.flux_taggs_list.length > 0)),
    render: (app) => {
      const app_osp = app as Class_ApplicationDataOSP
      return <>
        {app.drawing_area.selected_nodes_list.length > 0
          && app.drawing_area.sankey.node_taggs_list.length > 0
          && <SankeyMenuConfigurationNodesTags app_data={app_osp} />}
        {app.drawing_area.selected_links_list.length > 0
          && app.drawing_area.sankey.flux_taggs_list.length > 0
          && <MenuConfigurationLinksTags new_data={app_osp} />}
      </>
    }
  })
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

  const mc = app_data.menu_configuration as Class_MenuConfigOSP

  // Grey out tagNode/tagFlux/tagData rows in UpdateModeGrid when no OSP licence
  const _osp_tag_keys = ['tagNode', 'addTagNode', 'removeTagNode', 'assignTagNode', 'tagFlux', 'addTagFlux', 'removeTagFlux', 'assignTagFlux', 'tagData', 'addTagData', 'removeTagData']
  mc.apply_layout_is_row_disabled = (key: string) =>
    _osp_tag_keys.includes(key) && !app_data.has_sankey_plus

  // Inject OSP extra tab into the layout transfer dialog (copyViews + icon_catalog)
  mc.extra_apply_layout_tab = {
    label: app_data.t('Menu.Transformation.Views'),
    disabled: () => !app_data.has_sankey_plus,
    render: (attrs: string[], onToggle: (key: string) => void, t: (key: string) => string) => renderApplyLayoutExtraTabOSP(app_data, attrs, onToggle, t)
  }

  // Inject OSP "export all views" items into the top export dropdown (PNG zip + merged PDF)
  registerExtraExportMenuItems(app_data)

  // Copy views from source file when 'copyViews' is selected
  app_data.post_apply_layout_callback = (_tmp_DA, json, mode) => {
    const effective_mode = mode ?? app_data.data_var_to_update
    if (json && effective_mode.includes('copyViews')) {
      app_data.addViewsFromJSON(json)
    }
  }


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
    <ModalUnitarySankeyOSP
      app_data={app_data}
    />,
    <ModalTrialExpiredOSP
      app_data={app_data}
    />,
    <ModalAnimatedExportOSP
      app_data={app_data}
    />,
    <ModalPublishOSP
      app_data={app_data}
    />
  ]

  return [
    ...modules_dialogs,
    ...modules_dialogs_OSP
  ]
}