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

import React, {
  FunctionComponent,
  useEffect
} from 'react'
import LZString from 'lz-string'
import * as d3 from 'd3'
import { TourProvider } from '@reactour/tour'

/*************************************************************************************************/

import { Menu } from './components/topmenus/SankeyMenus'

import { MenuConfigurationNodeStyle } from './components/configmenus/SankeyMenuConfigurationNodesAttributes'

import { ContextMenuLink } from './components/dialogs/SankeyMenuContextLink'
import { DisaggregationModal, ContextMenuNode, AggregationModal } from './components/dialogs/SankeyMenuContextNode'
import { ContextMenuZdd } from './components/dialogs/SankeyMenuContextZDD'
import { ApplySaveJSONDialog } from './components/dialogs/SankeyMenuDialogs'
import { SankeyModalStyleLink, SankeyModalStyleNode } from './components/dialogs/SankeyStyle'
import { ModalPreference } from './components/dialogs/SankeyMenuPreferences'

import { Type_JSON } from './types/Utils'
import { Type_AdditionalMenus } from './types/Types'
import { FCType_OpenSankeyApp } from './types/FunctionTypes'
import { ModalDocumentation } from './components/welcome/SplashScreen'

declare const window: Window &
  typeof globalThis & {
    SankeyToolsStatic: boolean
    sankey: {
      filiere?: Type_JSON,
      header?: string,
      has_header?: boolean,
      footer?: boolean,
      logo_width?: number,
      excel?: string,
      publish?: boolean
      logo?: string
    }
  }
/*************************************************************************************************/

export const OpenSankeyApp: FunctionComponent<FCType_OpenSankeyApp> = ({
  initializeApplicationData,
  initializeAdditionalMenus,
  initializeDiagrammSelector,
  moduleDialogs,
  ModalWelcome,
  ClickSaveDiagram,
}) => {

  // Datas init -------------------------------------------------------------------------

  // Search if a data is stored in localStorage of the navigator
  const json_data = LZString.decompress(localStorage.getItem('data') as string)
  let initial_data: Type_JSON | undefined = undefined

  // If there is, store the data in the sankey_data
  if (json_data !== null && json_data != '' && json_data != 'null') {
    const new_data = JSON.parse(json_data)
    initial_data = new_data
  }
  if (window.sankey && window.sankey.filiere) {
    initial_data = window.sankey.filiere
  }

  // Initialize data
  const new_data = initializeApplicationData(initial_data)

  /*************************************************************************************************/

  // If leveltags are present Primaire is desactivated
  new_data.drawing_area.sankey.triggerPrimaryLevelTagging()

  /*************************************************************************************************/

  const mode_pref = sessionStorage.getItem('modepref')
  const menu_config = new_data.menu_configuration
  if (
    (mode_pref) &&
    (mode_pref === 'expert')
    // menu_config.accordions_to_show.length !== 7
  ) {
    // menu_config.accordions_to_show = ['MEP', 'EN', 'EF', 'ED', 'EL', 'LL', 'Vis']
  }

  /*************************************************************************************************/

  const additionalMenus: Type_AdditionalMenus = {

    // Top Menu
    external_edition_item: [],
    external_file_export_item: [],
    externale_save_item: [],
    external_top_buttons_item: {},
    externale_navbar_item: {},
    footer: [],

    // Menu config
    additional_menu_type: {},
    additional_menu_button_element_configurable: {},
    additional_menu_config_content:{data:{},context:{},style:{}},
    additional_new_menu_config_content:{},
    additional_node_config_style:[],

    // Mise en page
    extra_background_element: <></>,
    apply_transformation_additional_elements: [<></>],

    // Nodes
    advanced_appearence_content: [],
    advanced_label_content: [],
    context_node_order: ['aggregate', 'desaggregate', 'sep_1', 'align', 'edit_name', 'delete', 'sep_2', 'style', 'mask_shape', 'mask_label', 'mask_value', 'sep_3', 'reorg', 'select_link', 'sep_4', 'drag_apparence', 'drag_io'],
    additional_context_node_element: {},
    // Links
    additional_menu_configuration_links: {},
    additional_data_element: [],
    additional_link_appearence_items: [],
    additional_link_appearence_value: [],
    additional_link_visual_filter_content: [],
    context_link_order: ['inverse', 'sep_1', 'style', 'sep_2', 'zIndex', 'mask_label', 'edit_value', 'sep_3', 'aasign_tag', 'sep_4', 'drag_link_data', 'drag_apparence', 'drag_tag'],
    additional_context_link_element: {},

    // Preferences
    additional_preferences: [],


    additional_file_save_json_option: [],
    additional_file_export_item: [],

    additional_nav_item: [],

    formations_menu: {},

    toolbar_order: ['mode_souris',
      'node_type',
      'strectch_zdd',
      'help',
      'fullscreen'],
    template_module_key: ['essential'],
  }

  initializeAdditionalMenus(
    additionalMenus,
    new_data
  )

  const menu_configuration_nodes_attributes = <MenuConfigurationNodeStyle
    new_data={new_data}
    menu_for_style={false}
    additional_menus={additionalMenus}
  />

  // Wait a delay before adding the event on sankeydrawzone for the element to be created, because otherwise the d3 selection return nothing
  useEffect(() => {
    if (!menu_config.never_see_again.current)
      menu_config.show_splashscreen = true
  }, [])

  /*************************************************************************************************/

  useEffect(() => {
    // Delete potential duplicat
    d3.select('#draw_zoom').remove()
    new_data.draw()
    new_data.menu_configuration.ref_to_toolbar_bottom_updater.current()//update bottom toolbar to place it above footer
  }, [new_data.language])

  /*************************************************************************************************/
  return <TourProvider steps={new_data.steps}>
    <div id='sankey_app' style={{ 'backgroundColor': 'WhiteSmoke' }}>
      <div className='div-Menu' style={{ 'backgroundColor': 'WhiteSmoke' }} >
        {
          moduleDialogs(
            new_data,
            additionalMenus,
            menu_configuration_nodes_attributes,
            new_data.processFunction
          ).map((e, i) => <React.Fragment key={'dialog_key_' + i}>{e}</React.Fragment>)
        }
        {
          !new_data.is_static ?
            <ModalDocumentation
              app_data={new_data}
            /> :
            <></>
        }
        <ModalWelcome
          new_data={new_data}
        />
        <>
          <Menu
            new_data={new_data}
            external_modal={[
              <></>
            ]}
            additionalMenus={
              additionalMenus
            }
            apply_transformation_additional_elements={additionalMenus.apply_transformation_additional_elements}
            diagramSelector={initializeDiagrammSelector(new_data)}
          />
        </>
        <ApplySaveJSONDialog
          new_data={new_data}
          additional_file_save_json_option={additionalMenus.additional_file_save_json_option}
          ClickSaveDiagram={ClickSaveDiagram}
        />
      </div>
      <ContextMenuNode
        new_data={new_data}
        additionalMenu={additionalMenus}
      />
      <ContextMenuLink
        new_data={new_data}
        additionalMenus={additionalMenus}
      />
      <ContextMenuZdd
        new_data={new_data}
      />
      <DisaggregationModal
        new_data={new_data}
      />
      <AggregationModal
        new_data={new_data}
      />
      <React.Fragment key={'modale_style_link'}>
        <SankeyModalStyleLink
          new_data={new_data}
          additionalMenus={additionalMenus}
        />
      </React.Fragment>
      <React.Fragment key={'modale_style_node'}>
        <SankeyModalStyleNode
          new_data={new_data}
          additionalMenus={additionalMenus}
        />
      </React.Fragment>
      <React.Fragment key={'modale_preference'}>
        <ModalPreference
          new_data={new_data}
          additionalMenus={additionalMenus}
        />
      </React.Fragment>
    </div>
  </TourProvider>
}

export default OpenSankeyApp


