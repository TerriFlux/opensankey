import React, {
  FunctionComponent,
  useEffect,
} from 'react'
import LZString from 'lz-string'
import * as d3 from 'd3'
import { TourProvider } from '@reactour/tour'
import i18next from 'i18next'

/*************************************************************************************************/

import {
  Menu
} from './components/topmenus/SankeyMenuTop'

import { MenuConfigurationLinksAppearence } from './components/configmenus/SankeyMenuConfigurationLinksAppearence'
import { MenuConfigurationLinksData } from './components/configmenus/SankeyMenuConfigurationLinksData'
import { OpenSankeyConfigurationNodesAttributes } from './components/configmenus/SankeyMenuConfigurationNodesAttributes'

import { ContextMenuLink } from './components/dialogs/SankeyMenuContextLink'
import { DisaggregationModal, ContextMenuNode, AggregationModal } from './components/dialogs/SankeyMenuContextNode'
import { ContextMenuZdd } from './components/dialogs/SankeyMenuContextZDD'
import { ApplySaveJSONDialog } from './components/dialogs/SankeyMenuDialogs'
import { SankeyModalStyleLink, SankeyModalStyleNode } from './components/dialogs/SankeyStyle'
import { ModalPreference } from './components/dialogs/SankeyMenuPreferences'

import { Type_JSON } from './types/Utils'
import { Type_AdditionalMenus } from './types/Types'
import { FCType_OpenSankeyApp } from './types/FunctionTypes'

/*************************************************************************************************/

export const OpenSankeyApp: FunctionComponent<FCType_OpenSankeyApp> = ({
  initializeApplicationData,
  initializeMenuConfiguration,
  initializeReinitialization,
  initializeAdditionalMenus,
  initializeDiagrammSelector,
  moduleDialogs,
  ModalWelcome,
  ClickSaveDiagram,
}) => {
  // Search if a data is stored in localStorage of the navigator
  const json_data = LZString.decompress(localStorage.getItem('data') as string)
  let initial_data: Type_JSON | undefined = undefined

  // If there is, store the data in the sankey_data
  if (json_data !== null && json_data != '' && json_data != 'null') {
    const new_data = JSON.parse(json_data)
    initial_data = new_data
  }

  // Initialize data
  const new_data = initializeApplicationData(
    initial_data
  )

  /*************************************************************************************************/

  // If leveltags are present Primaire is desactivated
  new_data.drawing_area.sankey.triggerPrimaryLevelTagging()

  /*************************************************************************************************/

  const mode_pref = sessionStorage.getItem('modepref')
  const menu_config = new_data.menu_configuration
  if (
    (mode_pref) &&
    (mode_pref === 'expert') &&
    menu_config.accordions_to_show.length !== 7
  ) {
    menu_config.accordions_to_show = ['MEP', 'EN', 'EF', 'ED', 'EL', 'LL', 'Vis']
  }

  /*************************************************************************************************/

  const reinitialization = initializeReinitialization(new_data)

  const additionalMenus: Type_AdditionalMenus = {

    // Top Menu
    external_edition_item: [],
    external_file_item: [],
    external_file_export_item: [],
    externale_save_item: [],
    externale_navbar_item: {},
    footer: [],
    // Mise en page
    extra_background_element: <></>,
    apply_transformation_additional_elements: [<></>],

    // Nodes
    advanced_appearence_content: [],
    advanced_label_content: [],
    advanced_label_value_content: [],
    additional_menu_configuration_nodes: {},
    additional_node_label_layout_content: [],
    additional_node_apparence_content: [],
    context_node_order: ['aggregate', 'desaggregate', 'sep_1', 'align', 'edit_name', 'delete', 'sep_2', 'style', 'mask_shape', 'mask_label', 'sep_3', 'reorg', 'select_link', 'sep_4', 'drag_apparence', 'drag_io'],
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

    // Configuration Menu
    additional_configuration_menus_edition_elements: [],
    additional_configuration_menus_primary_accordion_elements: [],

    additional_edition_item: [],
    additional_file_save_json_option: [],
    additional_file_item: [],
    additional_file_export_item: [],

    sankey_menus: {},

    additional_nav_item: [],

    example_menu: {},
    formations_menu: {},

    toolbar_elements: {},
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



  const menu_configuration_nodes_attributes = <OpenSankeyConfigurationNodesAttributes
    new_data={new_data}
    menu_for_style={false}
    additional_menus={additionalMenus}
  />

  const config_link_data = <MenuConfigurationLinksData
    new_data={new_data}
    additional_data_element={additionalMenus.additional_data_element}
    contextual={false}
  />

  const config_link_attr = <MenuConfigurationLinksAppearence
    new_data={new_data}
    additionMenus={additionalMenus}
    menu_for_style={false}
  />


  const menu_configuration = initializeMenuConfiguration(
    new_data,
    additionalMenus,
    config_link_data,
    config_link_attr,
    menu_configuration_nodes_attributes,
  )

  // // Wait a delay before adding the event on sankeydrawzone for the element to be created, because otherwise the d3 selection return nothing
  // useEffect(() => {
  //   // Setup logic here
  //   return () => {
  //     localStorage.setItem('data', LZString.compress(JSON.stringify(data)))
  //   }
  // }, [])

  /*************************************************************************************************/

  useEffect(() => {
    // Delete potential duplicat
    d3.select('#draw_zoom').remove()
    new_data.draw()
  },[new_data.language])

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
          <ModalWelcome
            new_data={new_data}
          />
        }
        <>
          <Menu
            new_data={new_data}
            processFunctions={new_data.processFunction}
            configurations_menus={menu_configuration}
            external_modal={[
              <></>
            ]}
            reinitialization={reinitialization}
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
          node_attribute_tab={
            <OpenSankeyConfigurationNodesAttributes
              new_data={new_data}
              menu_for_style={true}
              additional_menus={additionalMenus}
            />
          }
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


