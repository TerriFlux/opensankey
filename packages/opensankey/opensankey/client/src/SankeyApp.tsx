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
  applicationDataType,
  SankeyAppTypes,
  SankeyData,
  SankeyLink,
  SankeyNode
} from './types/Types'
import {
  NodeVisibleOnsSvg,
  resizeDrawingArea
} from './draw/SankeyDrawFunction'
import { applyZoomEvent } from './draw/SankeyDrawEventFunction'

import { ContextLegendTags} from './draw/SankeyDrawLegend'
import { NodeTooltipsContent } from './draw/SankeyTooltip'
import {
  GetLinkValue,
  LinkVisible,
  NodeDisplayed} from './configmenus/SankeyUtils'
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
import { DeleteGNodes } from './draw/SankeyDrawNodes'


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
  initializeApplicationContext,
  initializeApplicationData,
  initializeElementSelected,
  initializeApplicationDraw,
  initializeShowDialog,
  initializeComponentUpdater,
  initializeMenuConfiguration,
  closeAllMenu,
  initializeReinitialization,
  initializeProcessFunctions,
  initializeContextMenu,
  initializeUIElementsRef,
  initializeLinkFunctions,
  initializeNodeFunctions,
  initializeAdditionalMenus,
  initializeDiagrammSelector,
  moduleDialogs,
  DrawAll,
  installEventOnSVG,
  ClickSaveDiagram,
  InitalizeSelectorDetailNodes,
  GetSankeyMinWidthAndHeight
}) => {

  const [data, set_data] = useState<SankeyData>(initial_sankey_data)
  const toast=useToast()
  const updateMenus = useState(false)

  // Search if a data is stored in localStorage of the navigator
  const json_data = LZString.decompress(localStorage.getItem('data') as string)
  let inital_data: JSON | undefined = undefined
  // If there is, store the data in the sankey_data
  if (json_data !== null && json_data != '' && json_data != 'null') {
    const new_data = JSON.parse(json_data)

    inital_data = new_data

  }

  // Logo, names, licences
  const applicationContext = initializeApplicationContext()
  // Data, displayed data, default data
  const applicationData = initializeApplicationData(
    data,
    set_data,
    get_default_data,
    {},
    {},
    inital_data
  )
  // applicationData.new_data = new Class_ApplicationData(window, false)
  const applicationState = initializeElementSelected()
  applicationState.userScaleRef.current = applicationData.data.user_scale // TODO
  const dict_hook_ref_setter_show_dialog_components = initializeShowDialog()

  dict_hook_ref_setter_show_dialog_components.ref_lauchToast.current=(intake)=>{
    launchToastConstructor(applicationData,toast,intake)
  }


  const contextMenu = initializeContextMenu()

  const ComponentUpdater = initializeComponentUpdater()

  const processFunctions = initializeProcessFunctions(dict_hook_ref_setter_show_dialog_components)
  const uiElementsRef = initializeUIElementsRef()
  /*************************************************************************************************/

  const recomputeDisplayedElement=()=>{
    const node_visible_svg=NodeVisibleOnsSvg()
    applicationData.display_nodes = Object.keys(applicationData.data.nodes)
      .filter((key) => NodeDisplayed(applicationData.data,applicationData.data.nodes[key]))
      .reduce((obj, key) => {
        return Object.assign(obj, {
          [key]: applicationData.data.nodes[key]
        })
      }, {}) as {[idNode:string]:SankeyNode}

    const pre_display_links=Object.keys(applicationData.data.links)
      .filter((key) =>LinkVisible(
        applicationData.data.links[key],
        applicationData.data,
        applicationData.display_nodes))
      .reduce((obj, key) => {
        return Object.assign(obj, {
          [key]: applicationData.data.links[key]
        })
      }, {}) as {[idLink:string]:SankeyLink}
    const pre_link_key=Object.keys(pre_display_links)

    applicationData.display_links={}
    if (applicationData.data.linkZIndex.length == 0) {
      applicationData.data.linkZIndex=pre_link_key
    } else {
      applicationData.data.linkZIndex = applicationData.data.linkZIndex.filter(lid=>pre_display_links[lid] !== undefined)
      pre_link_key.forEach(lid=>{
        if (!applicationData.data.linkZIndex.includes(lid)) {
          applicationData.data.linkZIndex.push(lid)
        }
      })
    }
    applicationData.data.linkZIndex.forEach(lid=>applicationData.display_links[lid]=data.links[lid])

    // delete element no longer displayed
    const curr_displayed_nodes= Object.keys(applicationData.display_nodes)
    const node_to_delete=node_visible_svg.filter(nid=>!curr_displayed_nodes.includes(nid))
    DeleteGNodes(node_to_delete)

    applyZoomEvent(
      applicationData,
      applicationDraw.GetSankeyMinWidthAndHeight
    )
  }

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
  const accept_simple_click=useRef(true)
  const ref_alt_key_pressed = useRef(false) //TODO
  /*************************************************************************************************/
  const mode_pref=sessionStorage.getItem('modepref')
  if(mode_pref && mode_pref==='expert' && data.accordeonToShow.length!==6){
    data.accordeonToShow = ['MEP', 'EN', 'EF', 'ED', 'LL', 'Vis']
  }

  const link_function = initializeLinkFunctions(
    applicationData,
    applicationState,
    contextMenu,
    applicationContext,
    ComponentUpdater,
    uiElementsRef,
    dict_hook_ref_setter_show_dialog_components,
    ref_alt_key_pressed
  )

  const node_function = initializeNodeFunctions(
    applicationData,
    applicationState,
    contextMenu,
    applicationContext,
    ComponentUpdater,
    uiElementsRef,
    (applicationData:applicationDataType)=>{
      resizeDrawingArea(applicationData,GetSankeyMinWidthAndHeight) //TODO
    },
    dict_hook_ref_setter_show_dialog_components,
    ref_alt_key_pressed,
    accept_simple_click,
    recomputeDisplayedElement,
    link_function
  )
  const resizeCanvas=()=>{
    resizeDrawingArea(applicationData,GetSankeyMinWidthAndHeight)
  }
  const start_point = useRef([0,0])
  const applicationDraw = initializeApplicationDraw(
    applicationData,
    applicationState,
    contextMenu,
    applicationContext,
    ComponentUpdater,
    uiElementsRef,
    node_function,
    link_function,
    start_point,
    resizeCanvas,
    ref_alt_key_pressed
  )

  recomputeDisplayedElement()

  /*******************************************************************************/

  const Reinitialization = initializeReinitialization(
    applicationData,
    applicationState,
    contextMenu
  )

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
    applicationContext,
    applicationData
  )

  const menu_configuration_nodes_attributes = <OpenSankeyConfigurationNodesAttributes
    applicationContext={applicationContext}
    applicationData={applicationData}
    menu_for_style={false}
    ref_selected_style_node={applicationState.ref_selected_style_node}
    advanced_appearence_content={additionalMenus.advanced_appearence_content}
    advanced_label_content={additionalMenus.advanced_label_content}
    advanced_label_value_content={additionalMenus.advanced_label_value_content}
  />

  const sankey_menus = OpenSankeyMenus(
    applicationContext.t,
    Reinitialization,
    applicationData.get_default_data,
    dict_hook_ref_setter_show_dialog_components,
    applicationState.never_see_again,
    applicationData,
    additionalMenus.external_edition_item,
    additionalMenus.external_file_item,
    additionalMenus.external_file_export_item,
    additionalMenus.externale_save_item,
    additionalMenus.externale_navbar_item,
    applicationData.convert_data,
    applicationData.setDiagram,
  )

  const config_link_data = <MenuConfigurationLinksData
    applicationData={applicationData}
    applicationContext={applicationContext}
    additional_data_element={additionalMenus.additional_data_element}
  />
  const config_link_attr = <MenuConfigurationLinksAppearence
    applicationData={applicationData}
    applicationState={applicationState}
    applicationContext={applicationContext}
    additional_link_appearence_items={additionalMenus.additional_link_appearence_items}
    menu_for_style={false}
  />

  const {filter}=applicationData.data.display_style

  if (window.sankey === undefined || window.sankey.toolbar === undefined || window.sankey.toolbar === true) {
    sankey_menus['toolbar']= <ToolbarBuilder
      applicationContext={applicationContext}
      applicationData={applicationData}
      applicationState={applicationState}
      filter={filter}
      set_current_filter= {
        ( new_current_filter: number ) => {
          const { display_style } = applicationData.data
          display_style.filter = +new_current_filter
          applicationData.set_data({ ...applicationData.data })
        }}
      detail_level={InitalizeSelectorDetailNodes(  applicationContext,
        applicationData,
        applicationDraw,
        node_function,
        link_function,ComponentUpdater)}
      url_prefix={applicationContext.url_prefix}
      first_selected_node={applicationState.first_selected_node}
      dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
      never_see_again={applicationState.never_see_again}
      additional_link_visual_filter_content={additionalMenus.additional_link_visual_filter_content}
      node_function={node_function}
      link_function={link_function}
      ComponentUpdater={ComponentUpdater}
      applicationDraw={applicationDraw}
    />
  }

  Object.assign(sankey_menus,additionalMenus.sankey_menus)


  const regular_ui = OpenSankeyDefaultModalePreferenceContent(
    applicationContext.t,
    applicationData,
    i18next,
    updateMenus,
    node_function
  )
  regular_ui['form'] = [...regular_ui['form'],...additionalMenus.additional_preferences]

  const menu_configuration=initializeMenuConfiguration(
    applicationData,
    applicationState,
    applicationContext,
    uiElementsRef,
    dict_hook_ref_setter_show_dialog_components,
    additionalMenus,
    node_function,
    link_function,
    applicationDraw,
    ComponentUpdater,
    updateMenus,
    config_link_data,
    config_link_attr,
    contextMenu,
    menu_configuration_nodes_attributes,
    additionalMenus,
    ref_alt_key_pressed
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
        applicationData.new_data?.drawing_area?.reset();
  })
  /*************************************************************************************************/
  return <ChakraProvider theme={opensankey_theme}>
    <div id='sankey_app' style={{ 'backgroundColor' : 'WhiteSmoke' }}>
      <div className='div-Menu' style={{ 'backgroundColor' : 'WhiteSmoke'}} >
        {moduleDialogs(
          applicationContext,
          applicationData,
          applicationState,
          contextMenu,
          applicationDraw,
          uiElementsRef,
          dict_hook_ref_setter_show_dialog_components,
          node_function,
          link_function,
          ComponentUpdater,
          additionalMenus,
          menu_configuration_nodes_attributes,
          applicationDraw.reDrawLegend,
          processFunctions
        ).map(e=>e)}
        <>
          <Menu
            applicationContext={applicationContext}
            applicationState={applicationState}
            applicationData={applicationData}
            uiElementsRef={uiElementsRef}
            contextMenu={contextMenu}
            processFunctions={processFunctions}
            dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
            applicationDraw={applicationDraw}
            configurations_menus={menu_configuration}
            menus={sankey_menus}
            cardsTemplate={additionalMenus.cards_template}
            external_modal={[
              <React.Fragment key={'modale_style_link'}><SankeyModalStyleLink
                applicationContext={applicationContext}
                applicationData={applicationData}
                applicationState={applicationState}
                dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
                pointer_pos={contextMenu.pointer_pos}
                additional_link_appearence_items={[]}
                ComponentUpdater={ComponentUpdater}
              />
              </React.Fragment>,
              <React.Fragment key={'modale_style_node'}><SankeyModalStyleNode
                applicationContext={applicationContext}
                applicationData={applicationData}
                applicationState={applicationState}
                dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
                ComponentUpdater={ComponentUpdater}
                pointer_pos={contextMenu.pointer_pos}
                node_attribute_tab={
                  <OpenSankeyConfigurationNodesAttributes
                    applicationContext={applicationContext}
                    applicationData={applicationData}
                    menu_for_style={true}
                    ref_selected_style_node={applicationState.ref_selected_style_node}
                    advanced_appearence_content={additionalMenus.advanced_appearence_content}
                    advanced_label_content={additionalMenus.advanced_label_content}
                    advanced_label_value_content={additionalMenus.advanced_label_value_content}
                  />
                }/>
              </React.Fragment>,
              <React.Fragment key={'modale_preference'}><ModalPreference
                dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
                ui={Object.values(regular_ui).map(d=>{
                  return <>{d}<hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }} /></>
                })}
                t={applicationContext.t}
                pointer_pos={contextMenu.pointer_pos}

              /></React.Fragment> ,
              <></>
            ]}
            Reinitialization={Reinitialization}
            formations_menu={additionalMenus.formations_menu}
            additional_nav_item={
              additionalMenus.additional_nav_item
            }
            convert_data={applicationData.convert_data}
            apply_transformation_additional_elements={additionalMenus.apply_transformation_additional_elements}
            DiagramSelector={initializeDiagrammSelector(applicationData)}
            postProcessLoadExcel={node_function.postProcessLoadExcel}
            ref_alt_key_pressed={ref_alt_key_pressed}
            accept_simple_click={accept_simple_click}
            link_function={link_function}
            NodeTooltipsContent={NodeTooltipsContent}
            ComponentUpdater={ComponentUpdater}
            node_function={node_function}
          />
        </>
        <ApplySaveJSONDialog
          t={applicationContext.t}
          dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
          applicationData={applicationData}
          applicationState={applicationState}
          additional_file_save_json_option={additionalMenus.additional_file_save_json_option}
          ClickSaveDiagram={ClickSaveDiagram}
        />
      </div>

      <ContextMenuNode
        applicationContext = {applicationContext}
        applicationData = {applicationData}
        dict_hook_ref_setter_show_dialog_components = {dict_hook_ref_setter_show_dialog_components}
        agregation = {agregation}
        additional_context_element_menu = {additionalMenus.additional_context_element_menu}
        additional_context_element_other = {additionalMenus.additional_context_element_other}
      />
      <ContextMenuLink
        applicationContext = {applicationContext}
        applicationData = {applicationData}
        dict_hook_ref_setter_show_dialog_components = {dict_hook_ref_setter_show_dialog_components}
        ComponentUpdater={ComponentUpdater}
      />
      <ContextMenuZdd
        applicationContext = {applicationContext}
        applicationData = {applicationData}
        dict_hook_ref_setter_show_dialog_components = {dict_hook_ref_setter_show_dialog_components}
      />
      <ContextLegendTags
        applicationContext = {applicationContext}
        applicationData = {applicationData}
        applicationState = {applicationState}
        contextMenu = {contextMenu}
        GetLinkValue = {GetLinkValue}
        ComponentUpdater={ComponentUpdater}
      />
    </div>

  </ChakraProvider>
}

export default SankeyApp


