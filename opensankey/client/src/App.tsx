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
import { ContextMenuNode } from './components/dialogs/SankeyMenuContextNode'
import { DisaggregationModal } from './components/dialogs/AggregationModal'
import { AggregationModal } from './components/dialogs/AggregationModal'
import { ContextMenuZdd } from './components/dialogs/SankeyMenuContextZDD'
import { ApplySaveJSONDialog } from './components/dialogs/SankeyMenuDialogs'
import { SankeyModalStyleLink, SankeyModalStyleNode } from './components/dialogs/SankeyStyle'

import { Type_JSON, WrapperInitializeAdditionalMenus } from './types/Utils'
import { FCType_OpenSankeyApp } from './types/FunctionTypes'
import { ModalDocumentation } from './components/welcome/SplashScreen'

declare const window: Window &
  typeof globalThis & {
    sankey: {
      diagram?: Type_JSON,
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
  if (window.sankey && window.sankey.diagram) {
    initial_data = window.sankey.diagram
  }

  // Initialize data
  const new_data = initializeApplicationData(initial_data)
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
  const menu_configuration_nodes_attributes = <MenuConfigurationNodeStyle
    new_data={new_data}
    menu_for_style={false}
    additional_menus={new_data.menu_configuration.additionalMenus}
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
        <WrapperInitializeAdditionalMenus
          new_data={new_data}
          initializeAdditionalMenus={initializeAdditionalMenus}
        />
        {
          moduleDialogs(
            new_data,
            new_data.menu_configuration.additionalMenus,
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
              new_data.menu_configuration.additionalMenus
            }
            apply_transformation_additional_elements={new_data.menu_configuration.additionalMenus.current.apply_transformation_additional_elements}
            diagramSelector={initializeDiagrammSelector(new_data)}
          />
        </>
        <ApplySaveJSONDialog
          new_data={new_data}
          ClickSaveDiagram={ClickSaveDiagram}
        />
      </div>
      <ContextMenuNode
        new_data={new_data}
        additionalMenu={new_data.menu_configuration.additionalMenus}
      />
      <ContextMenuLink
        new_data={new_data}
        additionalMenus={new_data.menu_configuration.additionalMenus}
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
          additionalMenus={new_data.menu_configuration.additionalMenus}
        />
      </React.Fragment>
      <React.Fragment key={'modale_style_node'}>
        <SankeyModalStyleNode
          new_data={new_data}
          additionalMenus={new_data.menu_configuration.additionalMenus}
        />
      </React.Fragment>
    </div>

  </TourProvider>
}

export default OpenSankeyApp


