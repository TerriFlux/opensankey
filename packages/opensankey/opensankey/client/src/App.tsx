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

import React, { useEffect } from 'react'
import LZString from 'lz-string'
import * as d3 from 'd3'
import { TourProvider } from '@reactour/tour'

/*************************************************************************************************/

import { SankeyMenu } from './components/topmenus/SankeyMenus'

import { MenuConfigurationAppearance } from './components/configmenus/MenuElementsAppearance'
import { ContextMenu, MenuConfig } from './components/dialogs/SankeyMenuContext'
import { GenericModalStyle } from './components/dialogs/SankeyStyle'

import { checkForUrlToJSON, Type_JSON, WrapperInitializeAdditionalMenus } from './types/Utils'
import { ModalDocumentation } from './components/welcome/SplashScreen'
import { Class_ApplicationData } from './types/ApplicationData'
import { FType_InitializeAdditionalMenus, FType_ModuleDialogs } from './Modules'
import { loadUniversalJSON } from './Persistence/UniversalJSONCompression'
import { updateFrom } from './Algorithms/UpdateFrom'
import { ZDDModifierType } from './components/dialogs/ContextZDDConfig'
import { LinkModifierType } from './components/dialogs/ContextLinkConfig'
import { NodeModifierType } from './components/dialogs/NodeActions'
import { ToolbarFilter } from './components/topmenus/Toolbar'
import { FormatConfigStructure } from './components/dialogs/PersistenceProcessDialogConfigs'

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
  createNodeModifier,
  input_config,
  output_config
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
  input_config: FormatConfigStructure,
  output_config: FormatConfigStructure,
}) => {

  // Datas init -------------------------------------------------------------------------

  // Search if a data is stored in localStorage of the navigator
  const json_data = LZString.decompress(localStorage.getItem('data') as string)
  const url_info = checkForUrlToJSON()
  // Initialize data
  const app_data = initializeApplicationData()
  app_data.createNewMenuConfiguration()
  const opts = app_data.publish_options
  const applyPublishRecenter = () => {
    if (app_data.is_static && opts.recenter) {
      app_data.drawing_area.to_recenter = true
      app_data.drawing_area.recenter()
      app_data.drawing_area.to_recenter = false
    }
  }
  const applyDiagramData = (data: Type_JSON) => {
    app_data.fromJSON(data, {}, !opts.diagram_layout)
    if (opts.diagram_layout) {
      loadUniversalJSON(opts.diagram_layout).then(layout_data => {
        const layout_mode = app_data.expandLayoutMode(opts.diagram_layout_options ?? app_data.transform_layout_all_attr)
        const tmp_DA = app_data.createNewDrawingArea()
        tmp_DA.bypass_redraws = true
        app_data.loadDrawingAreaFromJSON(tmp_DA, layout_data as Type_JSON)
        tmp_DA.afterFromJSON()
        app_data.drawing_area.bypass_redraws = true
        updateFrom(app_data.drawing_area, tmp_DA, layout_mode)
        app_data.post_apply_layout_callback?.(tmp_DA, layout_data as Type_JSON, layout_mode)
        app_data.drawing_area.draw()
        // Le layout fusionne des attributs de la drawing area (verrous taille/police,
        // banner='sequence' & sélection des data tags, etc.) APRÈS le updateAllMenuComponents()
        // déclenché par fromJSON ci-dessus. Sans ce rafraîchissement, les menus/toolbars
        // (barre de séquence, verrous) gardent l'état d'avant-layout — visible en viewer publish.
        app_data.menu_configuration.updateAllMenuComponents()
        applyPublishRecenter()
      }).catch(e => console.log(e))
    } else {
      applyPublishRecenter()
    }
  }

  if (opts.diagram) {
    if (typeof opts.diagram === 'string') {
      // URL : fetch + décompression + parse
      app_data.file_name = opts.diagram
      loadUniversalJSON(opts.diagram).then(data => {
        app_data.file_name = opts.diagram as string
        applyDiagramData(data as Type_JSON)
      }).catch(e => console.log(e))
    } else {
      // Objet JSON inline : appliqué directement (use case embed HTML one-file)
      applyDiagramData(opts.diagram as unknown as Type_JSON)
    }
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
  const menu_configuration_nodes_attributes = <MenuConfigurationAppearance
    app_data={app_data}
    menu_for_style={false}
  />

  // Wait a delay before adding the event on sankeydrawzone for the element to be created, because otherwise the d3 selection return nothing
  useEffect(() => {
    if (!menu_config.never_see_again.current)
      menu_config.show_splashscreen = true
  }, [])

  useEffect(() => {
    // Delete potential duplicat
    d3.select('#draw_zoom').remove()
    app_data.menu_configuration.ref_toolbar.current()
    app_data.draw()
    applyPublishRecenter()
    app_data.menu_configuration.ref_to_toolbar_bottom_updater.current()//update bottom toolbar to place it above footer
  }, [app_data.language])

  const background_color = app_data.is_static ? 'white' : 'WhiteSmoke'

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
            menu_configuration_nodes_attributes
          ).map((e, i) => <React.Fragment key={'dialog_key_' + i}>{e}</React.Fragment>)
        }
        {
          app_data.is_editable ?
            <ModalDocumentation
              app_data={app_data}
            /> :
            <></>
        }
        <ModalWelcome
          app_data={app_data}
        />
        {(window.sankey?.toolbar !== false) ?
          <ToolbarFilter
            app_data={app_data}
          /> : <></>}
        <>
          <SankeyMenu
            app_data={app_data}
            additionalMenus={
              app_data.menu_configuration.additionalMenus
            }
            input_config={input_config}
            output_config={output_config}
          />
        </>
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
        <GenericModalStyle
          app_data={app_data}
        />
      </React.Fragment>
    </div>

  </TourProvider>
}

export default OpenSankeyApp


