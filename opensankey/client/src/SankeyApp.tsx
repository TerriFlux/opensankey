import React, {
  Dispatch,
  FunctionComponent,
  SetStateAction,
  useEffect,
  useRef,
  useState
} from 'react'
import i18next from 'i18next'
import { Popover, Form } from 'react-bootstrap'
import { ChakraProvider } from '@chakra-ui/react'
/*************************************************************************************************/
import {
  AdditionalMenusType,
  agregationType,
  dict_variable_application_dataType,
  SankeyAppTypes,
  SankeyData,
  SankeyLink,
  SankeyNode
} from './types/Types'
/*************************************************************************************************/
import SankeyDraw from './draw/SankeyDraw'
import {
  GetSankeyMinWidthAndHeight, // TODO
  NodeVisibleOnsSvg,
  resizeDrawingArea
} from './draw/SankeyDrawFunction'
import { applyZoomEvent } from './draw/SankeyDrawEventFunction'

import { ContextLegendTags} from './draw/SankeyDrawLegend'
import { NodeTooltipsContent } from './draw/SankeyTooltip'
import {
  GetLinkValue,
  LinkVisible,
  NodeDisplayed,
  windowSankey
} from './configmenus/SankeyUtils'
import { ClickSaveDiagram } from './dialogs/SankeyPersistence'
import { ToolbarBuilder, addSimpleLevelDropDown } from './configmenus/SankeyMenuBanner'
import { MenuConfigurationLinksAppearence } from './configmenus/SankeyMenuConfigurationLinksAppearence'
import { MenuConfigurationLinksData } from './configmenus/SankeyMenuConfigurationLinksData'
import { OpenSankeyMenuConfigurationNodes } from './configmenus/SankeyMenuConfigurationNodes'
import { OpenSankeyConfigurationNodesAttributes } from './configmenus/SankeyMenuConfigurationNodesAttributes'
import { ContextMenuLink } from './dialogs/SankeyMenuContextLink'
import { ContextMenuNode } from './dialogs/SankeyMenuContextNode'
import { ContextMenuZdd } from './dialogs/SankeyMenuContextZDD'
import { ApplySaveJSONDialog } from './dialogs/SankeyMenuDialogs'
import {
  ModalPreference, OpenSankeyDefaultModalePreferenceContent
} from './dialogs/SankeyMenuPreferences'
import {
  OpenSankeyMenus, Menu, ToastWaitFunc
} from './topmenus/SankeyMenuTop'
import { SankeyModalStyleLink, SankeyModalStyleNode } from './dialogs/SankeyStyle'
import { opensankey_theme } from './chakra/Theme'
import { DrawAllLinks } from './draw/SankeyDrawLinks'
import { DeleteGNodes, DrawAllNodes } from './draw/SankeyDrawNodes'

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
  initializeKeyHandler,
  initializeDiagrammSelector,
  moduleDialogs,
  DrawAll,
  installEventOnSVG
}) => {

  const [data, set_data] = useState<SankeyData>(initial_sankey_data)

  // Logo, names, licences
  const applicationContext = initializeApplicationContext()
  // Data, displayed data, default data
  const dict_variable_application_data = initializeApplicationData(
    data,
    set_data,
    get_default_data,
    {},
    {}
  )
  const dict_variable_elements_selected = initializeElementSelected()
  dict_variable_elements_selected.userScaleRef.current = dict_variable_application_data.data.user_scale // TODO
  const dict_hook_ref_setter_show_dialog_components = initializeShowDialog() 
  const contextMenu = initializeContextMenu()
  const ComponentUpdater = initializeComponentUpdater()
  const processFunctions = initializeProcessFunctions(dict_hook_ref_setter_show_dialog_components)
  const uiElementsRef = initializeUIElementsRef()
  /*************************************************************************************************/

  const recomputeDisplayedElement=()=>{
    dict_variable_application_data.display_nodes = Object.keys(data.nodes)
      .filter((key) => NodeDisplayed(data,data.nodes[key]))
      .reduce((obj, key) => {
        return Object.assign(obj, {
          [key]: data.nodes[key]
        })
      }, {}) as {[idNode:string]:SankeyNode}

    const pre_display_links=Object.keys(data.links)
      .filter((key) =>LinkVisible(
        data.links[key],
        data,
        dict_variable_application_data.display_nodes))
      .reduce((obj, key) => {
        return Object.assign(obj, {
          [key]: data.links[key]
        })
      }, {}) as {[idLink:string]:SankeyLink}
    const pre_link_key=Object.keys(pre_display_links)

    dict_variable_application_data.display_links={}
    data.linkZIndex=pre_link_key
    pre_link_key.forEach(lid=>dict_variable_application_data.display_links[lid]=data.links[lid])

    // delete element no longer displayed
    const curr_displayed_nodes= Object.keys(dict_variable_application_data.display_nodes)
    const node_to_delete=NodeVisibleOnsSvg().filter(nid=>!curr_displayed_nodes.includes(nid))
    DeleteGNodes(node_to_delete)

    applyZoomEvent(
      dict_variable_application_data,
      applicationDraw.GetSankeyMinWidthAndHeight
    )
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
    dict_variable_application_data,
    dict_variable_elements_selected,
    contextMenu,
    applicationContext,
    ComponentUpdater,
    uiElementsRef,
    dict_hook_ref_setter_show_dialog_components,
    ref_alt_key_pressed    
  )

  const node_function = initializeNodeFunctions(
    dict_variable_application_data,
    dict_variable_elements_selected,
    contextMenu,
    applicationContext,
    ComponentUpdater,
    uiElementsRef,
    (dict_variable_application_data:dict_variable_application_dataType)=>{
      resizeDrawingArea(dict_variable_application_data,GetSankeyMinWidthAndHeight) //TODO
    },
    dict_hook_ref_setter_show_dialog_components,
    ref_alt_key_pressed,
    accept_simple_click,
    recomputeDisplayedElement,
    link_function
  )
  const resizeCanvas=()=>{
    resizeDrawingArea(dict_variable_application_data,GetSankeyMinWidthAndHeight)
  }
  const start_point = useRef([0,0])
  const applicationDraw = initializeApplicationDraw(
    dict_variable_application_data,
    dict_variable_elements_selected,
    contextMenu,
    applicationContext,
    ComponentUpdater,
    uiElementsRef,
    node_function,
    link_function,
    start_point,
    resizeCanvas
  )
  // node_function.

  recomputeDisplayedElement()

  /*******************************************************************************/
  const redrawAllNodes=()=>{
    DrawAllNodes(contextMenu,
      dict_variable_application_data,
      uiElementsRef,
      dict_variable_elements_selected,
      applicationContext,
      ref_alt_key_pressed,
      accept_simple_click,
      link_function,
      NodeTooltipsContent,
      ComponentUpdater,
      dict_hook_ref_setter_show_dialog_components,
      node_function,
      applicationDraw.GetSankeyMinWidthAndHeight,
      applicationDraw.resizeCanvas
    )
  }
  const redrawAllLinks=()=>{
    DrawAllLinks(
      contextMenu,
      dict_variable_application_data,
      uiElementsRef,
      dict_variable_elements_selected,
      applicationContext,
      ref_alt_key_pressed,
      (windowSankey.SankeyToolsStatic ? windowSankey.SankeyToolsStatic : false) ? 'relative' : 'absolute',
      link_function,
      ComponentUpdater,
      dict_hook_ref_setter_show_dialog_components
    )  }

  const Reinitialization = initializeReinitialization(
    dict_variable_application_data,
    dict_variable_elements_selected,
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
    apply_transformation_additional_elements:[],
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

    additional_nav_item:[]
  }

  initializeAdditionalMenus(
    additionalMenus,
    applicationContext,
    dict_variable_application_data,
    applicationDraw,
    ComponentUpdater,
    dict_variable_elements_selected,
    uiElementsRef,
    dict_hook_ref_setter_show_dialog_components,
    node_function,
    link_function,
    processFunctions,
    Reinitialization,
    contextMenu
  )

  const menu_configuration_nodes_attributes = OpenSankeyConfigurationNodesAttributes(
    applicationContext,
    dict_variable_application_data,
    dict_variable_elements_selected,
    false,
    dict_variable_elements_selected.ref_selected_style_node,
    additionalMenus.advanced_appearence_content,
    additionalMenus.advanced_label_content,
    additionalMenus.advanced_label_value_content,
    link_function,
    ComponentUpdater,
    node_function
  )

  const sankey_menus = OpenSankeyMenus(
    applicationContext.t,
    Reinitialization,
    dict_variable_application_data.get_default_data,
    dict_hook_ref_setter_show_dialog_components,
    dict_variable_elements_selected.never_see_again,
    dict_variable_application_data.data,
    dict_variable_application_data.set_data,
    additionalMenus.external_edition_item,
    additionalMenus.external_file_item,
    additionalMenus.external_file_export_item,
    additionalMenus.externale_save_item,
    additionalMenus.externale_navbar_item,
    dict_variable_application_data.convert_data,
    dict_variable_application_data.setDiagram,
  )

  const config_link_data = MenuConfigurationLinksData(
    dict_variable_application_data,
    dict_variable_elements_selected,
    applicationContext,
    additionalMenus.additional_data_element,
    ComponentUpdater,
    node_function,
    link_function
  )
  const config_link_attr = MenuConfigurationLinksAppearence(
    dict_variable_application_data,
    dict_variable_elements_selected,
    applicationContext,
    additionalMenus.additional_link_appearence_items,
    false,
    link_function,
    ComponentUpdater 
  )

  Object.values(dict_variable_application_data.data.levelTags).forEach(tag_group=>tag_group.activated = false)
  if ('Primaire' in dict_variable_application_data.data.levelTags) {
    dict_variable_application_data.data.levelTags['Primaire'].activated = true
  }

  const {filter}=dict_variable_application_data.data.display_style

  sankey_menus['toolbar']= <ToolbarBuilder
    applicationContext={applicationContext}
    dict_variable_application_data={dict_variable_application_data}
    dict_variable_elements_selected={dict_variable_elements_selected}
    filter={filter}
    set_current_filter= {
      ( new_current_filter: number ) => {
        const { display_style } = dict_variable_application_data.data
        display_style.filter = +new_current_filter
        dict_variable_application_data.set_data({ ...dict_variable_application_data.data })
      }}
    detail_level={<Popover id='popover-details-level' style={{maxWidth:'100%'}}>
      <Popover.Header as="h3">{applicationContext.t('Banner.ndd')}</Popover.Header>
      <Popover.Body style={{  marginLeft: '5px', width: '350px' }}>
        <>{(Object.entries(dict_variable_application_data.data.levelTags).length > 0) ? (<>
          {addSimpleLevelDropDown(
            dict_variable_application_data,applicationDraw.reDrawLegend,redrawAllNodes,redrawAllLinks,recomputeDisplayedElement
          )}</>
        ) : (<>
          <Form.Control placeholder="Pas de filtrage" style={{ opacity: !windowSankey.SankeyToolsStatic ? '0.3' : '0', color: '#6c757d' }} disabled /></>)}</>
      </Popover.Body>
    </Popover>}
    url_prefix={''}
    first_selected_node={dict_variable_elements_selected.first_selected_node}
    GetSankeyMinWidthAndHeight={applicationDraw.GetSankeyMinWidthAndHeight}
    dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
    never_see_again={dict_variable_elements_selected.never_see_again}
    additional_link_visual_filter_content={additionalMenus.additional_link_visual_filter_content}
    reDrawLegend={applicationDraw.reDrawLegend}
    node_function={node_function}
    link_function={link_function}
    recomputeDisplayedElement={recomputeDisplayedElement}
    ComponentUpdater={ComponentUpdater}
  />

  Object.assign(sankey_menus,additionalMenus.sankey_menus)

  const menu_configuration_nodes = OpenSankeyMenuConfigurationNodes(
    applicationContext,
    dict_variable_application_data,
    dict_variable_elements_selected,
    menu_configuration_nodes_attributes,
    GetLinkValue,
    node_function,link_function,
    ComponentUpdater
  )
  Object.assign(menu_configuration_nodes,additionalMenus.additional_menu_configuration_nodes)


  const regular_ui=OpenSankeyDefaultModalePreferenceContent(
    applicationContext.t,
    dict_variable_application_data,
    i18next,
    ComponentUpdater,
    node_function
  )
  regular_ui['form'] = [...regular_ui['form'],...additionalMenus.additional_preferences]


  
  const menu_configuration=initializeMenuConfiguration(
    dict_variable_application_data,
    dict_variable_elements_selected,
    applicationContext,
    uiElementsRef,
    dict_hook_ref_setter_show_dialog_components,
    additionalMenus,
    node_function,
    link_function,
    applicationDraw,
    ComponentUpdater,
    menu_configuration_nodes,
    config_link_data,
    config_link_attr,
    contextMenu,
    ref_alt_key_pressed
  )


  const formatKeyHandler=(e:KeyboardEvent)=>{
    initializeKeyHandler(dict_variable_application_data,
      uiElementsRef,
      contextMenu,
      e,
      dict_variable_elements_selected,
      closeAllMenu(dict_hook_ref_setter_show_dialog_components,contextMenu),
      ref_alt_key_pressed,
      accept_simple_click,
      link_function,
      NodeTooltipsContent,
      ComponentUpdater,
      dict_hook_ref_setter_show_dialog_components,
      applicationContext,
      node_function,
      applicationDraw)
  }
  document.onkeydown = formatKeyHandler
  // Wait a delay before adding the event on sankeydrawzone for the element to be created, because otherwise the d3 selection return nothing

  /*************************************************************************************************/
  useEffect(() => {
    // Generic function which draws all graphical elements (nodes, links, label, legend...)
    DrawAll(
      contextMenu,
      dict_variable_application_data,
      uiElementsRef,
      dict_variable_elements_selected,
      applicationContext,
      ref_alt_key_pressed,
      accept_simple_click,
      link_function,
      NodeTooltipsContent,
      ComponentUpdater,
      dict_hook_ref_setter_show_dialog_components,
      node_function,
      applicationDraw.GetSankeyMinWidthAndHeight,
      applicationDraw
    )
    // Zoom Behavior
    applyZoomEvent(
      dict_variable_application_data,
      applicationDraw.GetSankeyMinWidthAndHeight
    )

    if( !windowSankey.SankeyToolsStatic ){
      installEventOnSVG(
        contextMenu,
        dict_variable_application_data,
        uiElementsRef,
        dict_variable_elements_selected,
        link_function,
        ComponentUpdater,
        dict_hook_ref_setter_show_dialog_components,
        node_function,
        applicationDraw      
      )
    }
  },[data])
  /*************************************************************************************************/

  return <ChakraProvider theme={opensankey_theme}>
    <div style={{ 'backgroundColor' : 'WhiteSmoke' }}>
      <div className='div-Menu' style={{ 'backgroundColor' : 'WhiteSmoke'}} >
        {moduleDialogs(
          applicationContext,
          dict_variable_application_data,
          dict_variable_elements_selected,
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
            dict_variable_elements_selected={dict_variable_elements_selected}
            dict_variable_application_data={dict_variable_application_data}
            uiElementsRef={uiElementsRef}
            contextMenu={contextMenu}
            processFunctions={processFunctions}
            dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
            applicationDraw={applicationDraw}

            example_menu={<></>}
            configurations_menus={menu_configuration}
            menus={sankey_menus}
            cardsTemplate={<></>}
            external_modal={[
              <React.Fragment key={'modale_style_link'}>{SankeyModalStyleLink(
                applicationContext,
                dict_variable_application_data,
                dict_variable_elements_selected,
                dict_hook_ref_setter_show_dialog_components,
                contextMenu.pointer_pos,
                [],
                link_function,
                ComponentUpdater
              )
              }</React.Fragment>,
              <React.Fragment key={'modale_style_node'}>{SankeyModalStyleNode(
                applicationContext,
                dict_variable_application_data,
                dict_hook_ref_setter_show_dialog_components,
                dict_variable_elements_selected.ref_selected_style_node,ComponentUpdater,
                node_function,
                contextMenu.pointer_pos,
                OpenSankeyConfigurationNodesAttributes(
                  applicationContext,
                  dict_variable_application_data,
                  dict_variable_elements_selected,
                  true,
                  dict_variable_elements_selected.ref_selected_style_node,
                  additionalMenus.advanced_appearence_content,
                  additionalMenus.advanced_label_content,
                  additionalMenus.advanced_label_value_content,
                  link_function,
                  ComponentUpdater,
                  node_function
                )
              )}</React.Fragment>,
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
            formations_menu={{}}
            additional_nav_item={
              additionalMenus.additional_nav_item
            }
            convert_data={dict_variable_application_data.convert_data}
            apply_transformation_additional_elements={[]}
            DiagramSelector={initializeDiagrammSelector(dict_variable_application_data)}
            callback={()=>null}
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
          sankey_data={dict_variable_application_data.data}
          additionnal_button_option_save_json={additionalMenus.additional_file_save_json_option}
          ClickSaveDiagram={ClickSaveDiagram}
        />
      </div>
      <ContextMenuNode
        applicationContext = {applicationContext}
        dict_variable_application_data = {dict_variable_application_data}
        dict_variable_elements_selected = {dict_variable_elements_selected}
        contextMenu = {contextMenu}
        dict_hook_ref_setter_show_dialog_components = {dict_hook_ref_setter_show_dialog_components}
        agregation = {agregation}
        node_function={node_function}
        link_function={link_function}
        ComponentUpdater={ComponentUpdater}
        additional_context_element_menu = {additionalMenus.additional_context_element_menu}
        additional_context_element_other = {additionalMenus.additional_context_element_other}
      />
      <ContextMenuLink
        applicationContext = {applicationContext}
        dict_variable_application_data = {dict_variable_application_data}
        dict_variable_elements_selected = {dict_variable_elements_selected}
        contextMenu = {contextMenu}
        dict_hook_ref_setter_show_dialog_components = {dict_hook_ref_setter_show_dialog_components}
        node_function={node_function}
        link_function={link_function}
        ComponentUpdater={ComponentUpdater}
      />
      <ContextMenuZdd
        applicationContext = {applicationContext}
        dict_variable_application_data = {dict_variable_application_data}
        contextMenu = {contextMenu}
        dict_hook_ref_setter_show_dialog_components = {dict_hook_ref_setter_show_dialog_components}
        node_function={node_function}
        link_function={link_function}
        reDrawLegend={applicationDraw.reDrawLegend}
        ComponentUpdater={ComponentUpdater}

      />
      <ContextLegendTags
        applicationContext = {applicationContext}
        dict_variable_application_data = {dict_variable_application_data}
        dict_variable_elements_selected = {dict_variable_elements_selected}
        contextMenu = {contextMenu}
        GetLinkValue = {GetLinkValue}
        ComponentUpdater={ComponentUpdater}
      />

      <SankeyDraw
        contextMenu={contextMenu}
        dict_variable_application_data={dict_variable_application_data}
        animation={useRef(false)}
        dict_variable_elements_selected={dict_variable_elements_selected}
        agregation={agregation}
        ref_alt_key_pressed={ref_alt_key_pressed}
        GetSankeyMinWidthAndHeight={applicationDraw.GetSankeyMinWidthAndHeight}
      />
    </div>
    {<ToastWaitFunc
      dict_variable_application_data={dict_variable_application_data}
      dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
      applicationContext={applicationContext}
    />}
  </ChakraProvider>
}

export default SankeyApp


