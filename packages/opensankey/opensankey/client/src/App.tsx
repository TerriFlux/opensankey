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

import React, { Dispatch, useEffect, SetStateAction, useRef } from 'react'
import LZString from 'lz-string'
import * as d3 from 'd3'
import { TourProvider } from '@reactour/tour'

/*************************************************************************************************/

import { Menu } from './components/topmenus/SankeyMenus'

import { MenuConfigurationNodeStyle } from './components/configmenus/SankeyMenuConfigurationNodesShape'
import { ContextMenu, MenuConfig } from './components/dialogs/SankeyMenuContext'
import { SankeyModalStyleLink, SankeyModalStyleNode } from './components/dialogs/SankeyStyle'

import { checkForUrlToJSON, Type_JSON, WrapperInitializeAdditionalMenus } from './types/Utils'
import { ModalDocumentation } from './components/welcome/SplashScreen'
import { Class_ApplicationData } from './types/ApplicationData'
import { FType_InitializeAdditionalMenus, FType_ModuleDialogs } from './Modules'
import { loadUniversalJSON } from './Persistence/UniversalJSONCompression'
import { ZDDModifierType } from './components/dialogs/ContextZDDConfig'
import { LinkModifierType } from './components/dialogs/ContextLinkConfig'
import { NodeModifierType } from './components/dialogs/NodeActions'
import { ToolbarFilter } from './components/topmenus/Toolbar'
import { SaveJSONDialog } from './components/dialogs/JSONModalSaver'

declare const window: Window &
  typeof globalThis & {
    sankey: {
      diagram?: string,
      header?: string,
      publish?: boolean
      logo?: string,
      toolbar?: boolean
    }
  }

export const OpenSankeyApp = ({
  initializeApplicationData,
  initializeAdditionalMenus,
  moduleDialogs,
  ModalWelcome,
  createZDDModifier,
  ZDD_MENU_CONFIG,
  createLinkModifier,
  LINK_MENU_CONFIG,
  NODE_MENU_CONFIG,
  createNodeModifier
}: {
  initializeApplicationData: () => Class_ApplicationData,
  initializeAdditionalMenus: FType_InitializeAdditionalMenus,
  moduleDialogs: FType_ModuleDialogs,
  ModalWelcome: React.ComponentType<{ app_data: Class_ApplicationData }>
  createZDDModifier: (app_data: Class_ApplicationData) => ZDDModifierType,
  ZDD_MENU_CONFIG: MenuConfig,
  createLinkModifier: (app_data: Class_ApplicationData) => LinkModifierType,
  LINK_MENU_CONFIG: MenuConfig,
  NODE_MENU_CONFIG: MenuConfig,
  createNodeModifier: (app_data: Class_ApplicationData) => NodeModifierType,
}) => {

  // Datas init -------------------------------------------------------------------------

  // Search if a data is stored in localStorage of the navigator
  const json_data = LZString.decompress(localStorage.getItem('data') as string)
  const url_info = checkForUrlToJSON()
  // Initialize data
  const app_data = initializeApplicationData()
  app_data.createNewMenuConfiguration()
  if (window.sankey && window.sankey.diagram) {
    console.log(window.sankey.diagram)
    app_data.file_name = window.sankey.diagram
    loadUniversalJSON(window.sankey.diagram as string).then(data => {
      app_data.fromJSON(data as Type_JSON)
      app_data.sendWaitingToast(() => app_data.file_name = window.sankey.diagram as string)
    }).catch(e => console.log(e))
  } else if (json_data !== null && json_data != '' && json_data != 'null') {
    app_data.fromJSON(JSON.parse(json_data))
  }

  if (url_info) {
    app_data.readUrlJSON(url_info)
  }

  const mode_pref = sessionStorage.getItem('modepref')
  const menu_config = app_data.menu_configuration
  if (
    (mode_pref) &&
    (mode_pref === 'expert')
    // menu_config.accordions_to_show.length !== 7
  ) {
    // menu_config.accordions_to_show = ['MEP', 'EN', 'EF', 'ED', 'EL', 'LL', 'Vis']
  }

  /*************************************************************************************************/
  const menu_configuration_nodes_attributes = <MenuConfigurationNodeStyle
    app_data={app_data}
    menu_for_style={false}
    additional_menus={app_data.menu_configuration.additionalMenus}
  />

  // Wait a delay before adding the event on sankeydrawzone for the element to be created, because otherwise the d3 selection return nothing
  useEffect(() => {
    if (!menu_config.never_see_again.current)
      menu_config.show_splashscreen = true
  }, [])

  /*************************************************************************************************/
  const processFunction = {
    ref_processing: useRef(false),
    ref_setter_processing: useRef<Dispatch<SetStateAction<boolean>>>(() => null),
    failure: useRef(false),
    not_started: useRef(true),
    ref_result: useRef<Dispatch<SetStateAction<string>>>(() => null),
    path: useRef(''),
    launch: (cur_path: string) => {
      processFunction.path.current = cur_path
      app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_excel_reading_process.current!(true)
      processFunction.ref_setter_processing.current(true)
      processFunction.failure.current = true
      processFunction.not_started.current = false
      processFunction.ref_result.current('')
    }
  }

  useEffect(() => {
    // Delete potential duplicat
    d3.select('#draw_zoom').remove()
    app_data.draw()
    app_data.menu_configuration.ref_to_toolbar_bottom_updater.current()//update bottom toolbar to place it above footer
  }, [app_data.language])

  const background_color = window.sankey?.publish ? 'white' : 'WhiteSmoke'

  /*************************************************************************************************/
  return <TourProvider steps={app_data.steps}>
    <div id='sankey_app' style={{ 'backgroundColor': background_color, 'height': '100%' }}>
      <div className='div-Menu' style={{ 'backgroundColor': 'WhiteSmoke' }} >
        <WrapperInitializeAdditionalMenus
          new_data={app_data}
          initializeAdditionalMenus={initializeAdditionalMenus}
        />
        {
          moduleDialogs(
            app_data,
            app_data.menu_configuration.additionalMenus,
            menu_configuration_nodes_attributes,
            processFunction
          ).map((e, i) => <React.Fragment key={'dialog_key_' + i}>{e}</React.Fragment>)
        }
        {
          !app_data.is_static ?
            <ModalDocumentation
              app_data={app_data}
            /> :
            <></>
        }
        <ModalWelcome
          app_data={app_data}
        />
        { window.sankey?.toolbar !== false ?
        <ToolbarFilter
          app_data={app_data}
        />:<></>}
        <>
          <Menu
            app_data={app_data}
            processFunction={processFunction}
            external_modal={[
              <></>
            ]}
            additionalMenus={
              app_data.menu_configuration.additionalMenus
            }
          />
        </>
        <SaveJSONDialog
          app_data={app_data}
        />
      </div>
      <ContextMenu
        app_data={app_data}
        createModifier={createNodeModifier}
        menuConfig={NODE_MENU_CONFIG}
        attr_is_contextualised="node_contextualised"
        attr_updater="ref_to_menu_context_nodes_updater"
        path="ContextMenuNodes"
      />
      <ContextMenu
        app_data={app_data}
        createModifier={createLinkModifier}
        menuConfig={LINK_MENU_CONFIG}
        attr_is_contextualised='link_contextualised'
        attr_updater='ref_to_menu_context_links_updater'
        path='ContextMenuLinks'
      />
      <ContextMenu
        app_data={app_data}
        createModifier={createZDDModifier}
        menuConfig={ZDD_MENU_CONFIG}
        attr_is_contextualised='is_drawing_area_contextualised'
        attr_updater='ref_to_menu_context_drawing_area_updater'
        path='ContextMenuZDD'
      />
      <React.Fragment key={'modale_style_link'}>
        <SankeyModalStyleLink
          new_data={app_data}
          additionalMenus={app_data.menu_configuration.additionalMenus}
        />
      </React.Fragment>
      <React.Fragment key={'modale_style_node'}>
        <SankeyModalStyleNode
          new_data={app_data}
          additionalMenus={app_data.menu_configuration.additionalMenus}
        />
      </React.Fragment>
    </div>

  </TourProvider>
}

export default OpenSankeyApp


