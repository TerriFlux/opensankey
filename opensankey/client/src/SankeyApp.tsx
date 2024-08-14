import React, {
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useEffect,
  useRef,
  useState
} from 'react'
import i18next from 'i18next'
import LZString from 'lz-string'
import { ChakraProvider, useToast } from '@chakra-ui/react'
/*************************************************************************************************/
import {
  AdditionalMenusType,
  agregationType,
  SankeyAppTypes,
  SankeyData,
  SankeyNode
} from './types/LegacyType'

import { ToolbarBuilder } from './configmenus/SankeyMenuBanner'
import { MenuConfigurationLinksAppearence } from './configmenus/SankeyMenuConfigurationLinksAppearence'
import { MenuConfigurationLinksData } from './configmenus/SankeyMenuConfigurationLinksData'
import { OpenSankeyConfigurationNodesAttributes } from './configmenus/SankeyMenuConfigurationNodesAttributes'
import { ContextMenuLink } from './dialogs/SankeyMenuContextLink'
import { ContextMenuNode } from './dialogs/SankeyMenuContextNode'
import { ContextMenuZdd } from './dialogs/SankeyMenuContextZDD'
import { ApplySaveJSONDialog } from './dialogs/SankeyMenuDialogs'
import {
  ModalPreference, OpenSankeyDefaultModalePreferenceContent
} from './dialogs/SankeyMenuPreferences'
import {
  OpenSankeyMenus, Menu,
  launchToastConstructor
} from './topmenus/SankeyMenuTop'
import { SankeyModalStyleLink, SankeyModalStyleNode } from './dialogs/SankeyStyle'
import { opensankey_theme } from './chakra/Theme'
import { Type_JSON } from './types/Utils'
import { initializeProcessFunctions } from './OSModule'


declare const window: Window &
  typeof globalThis & {
    sankey: {
      toolbar: true,
    }
  }

/*************************************************************************************************/
export const SankeyApp : FunctionComponent<SankeyAppTypes> = ({
  initial_sankey_data,
  get_default_data,
  initializeApplicationData,
  initializeMenuConfiguration,
  initializeReinitialization,
  initializeAdditionalMenus,
  initializeDiagrammSelector,
  moduleDialogs,
  ClickSaveDiagram,
}) => {

  const [data, set_data] = useState<SankeyData>(initial_sankey_data)
  const toast=useToast()

  // Search if a data is stored in localStorage of the navigator
  const json_data = LZString.decompress(localStorage.getItem('data') as string)
  let inital_data: Type_JSON | undefined = undefined
  // If there is, store the data in the sankey_data
  if (json_data !== null && json_data != '' && json_data != 'null') {
    const new_data = JSON.parse(json_data)
    inital_data = new_data
  }

  // Logo, names, licences

  // Data, displayed data, default data
  const applicationData = initializeApplicationData(
    data,
    set_data,
    get_default_data,
    inital_data
  )
  const { new_data } = applicationData


  new_data.menu_configuration.ref_lauchToast.current=(intake)=>{
    launchToastConstructor(applicationData,toast,intake)
  }




  const processFunctions = initializeProcessFunctions(applicationData)

  /*************************************************************************************************/


  // If leveltags are present Primaire is desactivated
  if ('Primaire' in applicationData.data.levelTags && applicationData.data.levelTags['Primaire'].activated === true) {
    Object.values(applicationData.data.levelTags).forEach(tag_group=> {
      if (tag_group.siblings && tag_group.siblings.length > 0) {
        return
      }
      tag_group.activated = true
    })
    Object.values(applicationData.data.levelTags).forEach(tag_group=> {
      if (tag_group.siblings && tag_group.siblings.length > 0 && tag_group.activated ) {
        tag_group.siblings.forEach(sibling=>{
          applicationData.data.levelTags[sibling].activated=false
        })
      }
    })
    if (Object.values(applicationData.data.levelTags).length > 1) {
      applicationData.data.levelTags['Primaire'].activated = false
    }
  }

  /*************************************************************************************************/

  const agregation : agregationType = {
    showAgregationRef : useRef<[boolean, Dispatch<SetStateAction<boolean>>][]>([]),
    isAgregationRef : useRef<boolean>(true),
    agregationNode : useRef<SankeyNode>()
  }

  /*************************************************************************************************/

  /*************************************************************************************************/
  const mode_pref = sessionStorage.getItem('modepref')
  const menu_config = new_data.menu_configuration
  if (
    (mode_pref) &&
    (mode_pref === 'expert') &&
    menu_config.accordions_to_show.length !== 6
  ){
    menu_config.accordions_to_show = ['MEP', 'EN', 'EF', 'ED', 'LL', 'Vis']
  }


  /*******************************************************************************/

  const reinitialization = initializeReinitialization(applicationData)

  const additionalMenus : AdditionalMenusType = {

    // Top Menu
    external_edition_item: [],
    external_file_item: [],
    external_file_export_item: [],
    externale_save_item: [],
    externale_navbar_item:{},

    // Mise en page
    extra_background_element: <></>,
    apply_transformation_additional_elements:[<></>],

    // Nodes
    advanced_appearence_content: [],
    advanced_label_content: [],
    advanced_label_value_content: [],
    additional_menu_configuration_nodes:{},
    additional_context_element_menu:[],
    additional_context_element_other:[],

    // Links
    additional_data_element: [],
    additional_link_appearence_items: [],
    additional_link_visual_filter_content: [],

    // Preferences
    additional_preferences: [],

    // Configuration Menu
    additional_configuration_menus : [],

    // menu_style_add_node_appearence_attr : [],
    // menu_style_add_node_label : [],
    // menu_style_add_node_label_value : [],

    additional_edition_item : [],
    additional_file_save_json_option : [],
    additional_file_item : [],
    additional_file_export_item : [],

    sankey_menus : {},

    additional_nav_item:[],

    example_menu:{},
    formations_menu:{},

    cards_template:<></>
  }

  initializeAdditionalMenus(
    additionalMenus,
    applicationData
  )

  const menu_configuration_nodes_attributes = <OpenSankeyConfigurationNodesAttributes
    applicationData={applicationData}
    menu_for_style={false}
    advanced_appearence_content={additionalMenus.advanced_appearence_content}
    advanced_label_content={additionalMenus.advanced_label_content}
    advanced_label_value_content={additionalMenus.advanced_label_value_content}
  />

  const sankey_menus = OpenSankeyMenus(
    applicationData.new_data.t,
    reinitialization,
    applicationData.get_default_data,
    applicationData,
    additionalMenus.external_edition_item,
    additionalMenus.external_file_item,
    additionalMenus.external_file_export_item,
    additionalMenus.externale_save_item,
    additionalMenus.externale_navbar_item,
    applicationData.setDiagram,
  )

  const config_link_data = <MenuConfigurationLinksData
    applicationData={applicationData}
    additional_data_element={additionalMenus.additional_data_element}
  />
  const config_link_attr = <MenuConfigurationLinksAppearence
    applicationData={applicationData}
    additional_link_appearence_items={additionalMenus.additional_link_appearence_items}
    menu_for_style={false}
  />

  if (
    (window.sankey === undefined) ||
    (window.sankey.toolbar === undefined) ||
    (window.sankey.toolbar === true)
  ) {
    sankey_menus['toolbar']= <ToolbarBuilder
      applicationData={applicationData}
      url_prefix={applicationData.new_data.url_prefix}
      additional_link_visual_filter_content={additionalMenus.additional_link_visual_filter_content}
    />
  }

  Object.assign(sankey_menus,additionalMenus.sankey_menus)

  const regular_ui = OpenSankeyDefaultModalePreferenceContent(
    applicationData,
    i18next,
  )
  regular_ui['form'] = [...regular_ui['form'],...additionalMenus.additional_preferences]

  const menu_configuration = initializeMenuConfiguration(
    applicationData,
    additionalMenus,
    config_link_data,
    config_link_attr,
    menu_configuration_nodes_attributes,
  )

  // Wait a delay before adding the event on sankeydrawzone for the element to be created, because otherwise the d3 selection return nothing

  useEffect(() => {
    // Setup logic here
    return () => {
      localStorage.setItem('data', LZString.compress(JSON.stringify(data)))
    }
  }, [])

  /*************************************************************************************************/

  useEffect(() => {
    // Test
    applicationData.new_data?.drawing_area?.reset()
  })

  /*************************************************************************************************/
  return <ChakraProvider theme={opensankey_theme}>
    <div id='sankey_app' style={{ 'backgroundColor' : 'WhiteSmoke' }}>
      <div className='div-Menu' style={{ 'backgroundColor' : 'WhiteSmoke'}} >
        {
          moduleDialogs(
            applicationData,
            additionalMenus,
            menu_configuration_nodes_attributes,
            processFunctions
          ).map(e=>e)
        }
        <>
          <Menu
            applicationData={applicationData}
            processFunctions={processFunctions}
            configurations_menus={menu_configuration}
            menus={sankey_menus}
            cardsTemplate={additionalMenus.cards_template}
            external_modal={[
              <React.Fragment key={'modale_style_link'}><SankeyModalStyleLink
                applicationData={applicationData}
                additional_link_appearence_items={[]}
              />
              </React.Fragment>,
              <React.Fragment key={'modale_style_node'}><SankeyModalStyleNode
                applicationData={applicationData}
                node_attribute_tab={
                  <OpenSankeyConfigurationNodesAttributes
                    applicationData={applicationData}
                    menu_for_style={true}
                    advanced_appearence_content={additionalMenus.advanced_appearence_content}
                    advanced_label_content={additionalMenus.advanced_label_content}
                    advanced_label_value_content={additionalMenus.advanced_label_value_content}
                  />
                }/>
              </React.Fragment>,
              <React.Fragment key={'modale_preference'}>
                <ModalPreference
                  applicationData={applicationData}
                  ui={Object.values(regular_ui).map(d=>{
                    return <>
                      {d}
                      <hr
                        style={{
                          borderStyle: 'none',
                          margin: '10px',
                          color: 'grey',
                          backgroundColor: 'grey',
                          height: 1
                        }}
                      />
                    </>
                  })}
                  t={new_data.t}

                />
              </React.Fragment>,
              <></>
            ]}
            reinitialization={reinitialization}
            formations_menu={additionalMenus.formations_menu}
            additional_nav_item={
              additionalMenus.additional_nav_item
            }
            apply_transformation_additional_elements={additionalMenus.apply_transformation_additional_elements}
            DiagramSelector={initializeDiagrammSelector(applicationData)}
            // postProcessLoadExcel={node_function.postProcessLoadExcel}
          />
        </>
        <ApplySaveJSONDialog
          t={new_data.t}
          applicationData={applicationData}
          additional_file_save_json_option={additionalMenus.additional_file_save_json_option}
          ClickSaveDiagram={ClickSaveDiagram}
        />
      </div>

      <ContextMenuNode
        applicationData = {applicationData}
        agregation = {agregation}
        additional_context_element_menu = {additionalMenus.additional_context_element_menu}
        additional_context_element_other = {additionalMenus.additional_context_element_other}
      />
      <ContextMenuLink
        applicationData = {applicationData}
      />
      <ContextMenuZdd
        applicationData = {applicationData}
      />

    </div>

  </ChakraProvider>
}

export default SankeyApp


