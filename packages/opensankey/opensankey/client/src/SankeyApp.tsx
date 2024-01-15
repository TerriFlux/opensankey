import React, { useState, useEffect, useRef, FunctionComponent, Dispatch, SetStateAction } from 'react'
import * as d3 from 'd3'
import { useTranslation } from 'react-i18next'
import i18next from 'i18next'
import { Popover, Form } from 'react-bootstrap'
/*************************************************************************************************/
import { 
  SankeyAppTypes, SankeyData, SankeyLink, SankeyNode, agregationType, applicationContextType, 
  dict_variable_application_dataType, contextMenuType, dict_variable_elements_selectedType, 
  dict_hook_ref_setter_show_dialog_componentsType, uiElementsRefType, applicationDrawType, processFunctionsType 
} from './types/Types'
/*************************************************************************************************/
import SankeyDraw, { keyHandler } from './draw/SankeyDraw'
import { 
  GetSankeyMinWidthAndHeight, LinkStroke, 
  DrawArrows 
} from './draw/SankeyDrawFunction'
import { ZoomFunction } from './draw/SankeyDrawEventFunction'
import {
  EventOnZoneMouseDown,
  EventOnZoneMouseMove, EventOnZoneMouseUp
} from './draw/SankeyDrawEventFunction'
import { ContextLegendTags, DrawLegend, drag_legend } from './draw/SankeyDrawLegend'
import { DrawLinks } from './draw/SankeyDrawLinks'
import { DrawNodes } from './draw/SankeyDrawNodes'
import { OpenSankeyDrawNodesLabel } from './draw/SankeyDrawNodesLabel'
import { NodeTooltipsContent, LinkTooltipsContent } from './draw/SankeyTooltip'
import { 
  GetLinkValue, NodeDisplayed, ReturnValueLink, LinkText, LinkVisible, AdjustSankeyZone, 
  DefaultSankeyData, windowSankey, LinkColor} from './configmenus/SankeyUtils'
import { RetrieveExcelResults } from './dialogs/SankeyPersistence'
import { updateLayout } from './draw/SankeyDrawLayout'
import { convert_data } from './configmenus/SankeyConvert'
import { ToolbarBuilder, addSimpleLevelDropDown, setDiagram } from './configmenus/SankeyMenuBanner'
import { OpenSankeyConfigurationsMenus } from './configmenus/SankeyMenuConfiguration'
import { OpenSankeyMenuConfigurationLayout } from './configmenus/SankeyMenuConfigurationLayout'
import { MenuConfigurationLinks } from './configmenus/SankeyMenuConfigurationLinks'
import { MenuConfigurationLinksAppearence } from './configmenus/SankeyMenuConfigurationLinksAppearence'
import { MenuConfigurationLinksData } from './configmenus/SankeyMenuConfigurationLinksData'
import { OpenSankeyMenuConfigurationNodes } from './configmenus/SankeyMenuConfigurationNodes'
import { OpenSankeyConfigurationNodesAttributes } from './configmenus/SankeyMenuConfigurationNodesAttributes'
import { SankeyMenuConfigurationNodesIO } from './configmenus/SankeyMenuConfigurationNodesIO'
import { SankeySettingsEditionElementTags } from './configmenus/SankeyMenuConfigurationTags'
import { ContextMenuLink } from './dialogs/SankeyMenuContextLink'
import { ContextMenuNode } from './dialogs/SankeyMenuContextNode'
import { ContextMenuZdd } from './dialogs/SankeyMenuContextZDD'
import { OpenSankeyDiagramSelector } from './dialogs/SankeyMenuDialogs'
import { 
  ModalPreference, OpenSankeyDefaultModalePreferenceContent 
} from './dialogs/SankeyMenuPreferences'
import { 
  OpenSankeyMenus, MenuDraggable, LastCheckpointTime, OpenSankeySaveButton, Menu 
} from './topmenus/SankeyMenuTop'
import { CardsTemplateBuilder, welcomeModalBuilder } from './dialogs/SankeyModalWelcome'
import { SankeyModalStyleLink, SankeyModalStyleNode } from './dialogs/SankeyStyle'

/*************************************************************************************************/
export const SankeyApp : FunctionComponent<SankeyAppTypes> = ({
  initial_sankey_data,
  exemple_menu,
  formations_menu,
  logo,
  logo_terriflux
}) => {
  const [, set_show_draw] = useState(false)
  /*************************************************************************************************/
  const applicationContext : applicationContextType = {
    t : useTranslation().t,
    logo_width : 100,
    app_name : 'SankeySuite',//TODO
    url_prefix : '/opensankey/',
    logo : logo,
    logo_terriflux : logo_terriflux,
  }
  /*************************************************************************************************/
  const [data, set_data] = useState<SankeyData>(initial_sankey_data)
  const display_nodes = Object.keys(data.nodes)
    .filter((key) => NodeDisplayed(data,data.nodes[key]))
    .reduce((obj, key) => {
      return Object.assign(obj, {
        [key]: data.nodes[key]
      })
    }, {}) as {[idNode:string]:SankeyNode}
  const pre_display_links=Object.keys(data.links)
    .filter((key) =>LinkVisible(data.links[key],data,display_nodes,GetLinkValue))
    .reduce((obj, key) => {
      return Object.assign(obj, {
        [key]: data.links[key]
      })
    }, {}) as {[idLink:string]:SankeyLink}
  const pre_link_key=Object.keys(pre_display_links)
  const display_links={} as {[idLink:string]:SankeyLink}
  data.linkZIndex.filter(lk=>pre_link_key.includes(lk)).forEach(lk=>display_links[lk]=pre_display_links[lk])
  const dict_variable_application_data : dict_variable_application_dataType = {
    data : data,
    set_data : set_data,
    get_default_data : DefaultSankeyData,
    display_nodes : display_nodes,
    display_links : display_links
  }
  /*************************************************************************************************/
  const dict_variable_elements_selected : dict_variable_elements_selectedType = {
    mode_selection : useRef('ln'),
    multi_selected_nodes : useRef([]),
    multi_selected_links : useRef([] as SankeyLink[]),
    ref_selected_style_node : useRef('default'),
    ref_selected_style_link :  useRef('default'),
    first_selected_node : useRef<SankeyNode>(),
    ref_pre_idSource : useRef('none'),
    ref_pre_idTarget : useRef('none'),

    ref_display_link_opacity : useRef<Dispatch<SetStateAction<string>>[]>([]),
    displayedInputLinkValueRef : useRef<Dispatch<SetStateAction<string>>[]>([]),
    userScaleRef : useRef(dict_variable_application_data.data.user_scale)
  }
  /*************************************************************************************************/  
  const uiElementsRef : uiElementsRefType = {
    button_ref : useRef<HTMLLabelElement>(null),
    accordion_ref : useRef<HTMLDivElement>(null),
    links_accordion_ref : useRef<HTMLDivElement>(null),
    nodes_accordion_ref : useRef<HTMLDivElement>(null),
    ref_setter_nav_item_active : useRef<Dispatch<SetStateAction<string>>>(()=>null),
    ref_nav_item_active : useRef<string>(''),
    ref_setter_sub_nav_item_active : useRef<Dispatch<SetStateAction<string>>>(()=>null)
  }
  /*************************************************************************************************/
  const dict_hook_ref_setter_show_dialog_components : dict_hook_ref_setter_show_dialog_componentsType = {
    ref_setter_show_menu_node_apparence : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_menu_node_io : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_menu_link_data : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_menu_link_appearence : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_menu_layout : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_modal_welcome : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_modale_tuto : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_modale_support : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_excel_dialog : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_save_json : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_getter_show_save_json : useRef(false), // TODO why not a set function
    ref_setter_show_apply_layout : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_modal_preference : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_modal_template : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_load : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_setter_show_menu_config : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_show_style_node : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    ref_show_style_link : useRef<Dispatch<SetStateAction<boolean>>>(()=>null)
  }
  /*************************************************************************************************/
  const contextMenu : contextMenuType = {
    ref_setter_contextualised_node : useRef<Dispatch<SetStateAction<SankeyNode|undefined>>>(),
    ref_contextualised_node : useRef<SankeyNode|undefined>(),
    ref_setter_contextualised_link : useRef<Dispatch<SetStateAction<SankeyLink|undefined>>>(),
    tagContext : useRef<[string|undefined, Dispatch<SetStateAction<string|undefined>>][]>([]),
    closeAllMenuContext : ()=>{
      contextMenu.ref_setter_contextualised_node.current!(undefined)
      contextMenu.ref_setter_contextualised_link.current!(undefined)
      contextMenu.tagContext.current![0][1](undefined)
      contextMenu.showContextZDDRef.current![0][1](false)
    },
    pointer_pos : useRef([window.innerWidth/4,window.innerHeight/4]),
    showContextZDDRef : useRef<[boolean, Dispatch<SetStateAction<boolean>>][]>([])
  }
  /*************************************************************************************************/
  const agregation : agregationType = {
    showAgregationRef : useRef<[boolean, Dispatch<SetStateAction<boolean>>][]>([]),
    isAgregationRef : useRef<boolean>(true),
    agregationNode : useRef<SankeyNode>()
  }
  /*************************************************************************************************/
  const processFunctions : processFunctionsType = {
    ref_processing : useRef(false),
    ref_setter_processing : useRef<Dispatch<SetStateAction<boolean>>>(()=>null),
    failure : useRef(false),
    not_started : useRef(true),
    ref_result : useRef<Dispatch<SetStateAction<string>>>(()=>null),
    path : useRef(''),
    launch : (path:string) => {
      processFunctions.path.current = path
      dict_hook_ref_setter_show_dialog_components.ref_setter_show_load.current!(true)
      processFunctions.ref_setter_processing.current(true)
      processFunctions.failure.current = true
      processFunctions.not_started.current = false
      processFunctions.ref_result.current('')
    },
    RetrieveExcelResults
  }
  /*************************************************************************************************/  
  const applicationDraw : applicationDrawType = {
    GetSankeyMinWidthAndHeight,
    updateLayout
  }
  /*************************************************************************************************/
  const start_point=useRef([0,0])
  const legend_clicked = useRef(false)
  const accept_simple_click=useRef(true)
  const elementToDispose = useRef([''])
  const never_see_again = useRef((localStorage.getItem('dontSeeAggainWelcome')==='1'))
  const active_page = useRef<Dispatch<SetStateAction<string>>>(()=>null)
  const ref_alt_key_pressed = useRef(false)
  /*************************************************************************************************/
  const mode_pref=sessionStorage.getItem('modepref')
  if(mode_pref && mode_pref==='expert' && data.accordeonToShow.length!==6){
    data.accordeonToShow = ['MEP', 'EN', 'EF', 'ED', 'LL', 'Vis']
  }
  /*************************************************************************************************/
  // Réinitialise data et vide les noeud/liens sélectionnés
  const Reinitialization = () => {
    const new_data = DefaultSankeyData()
    dict_variable_elements_selected.multi_selected_nodes.current = []
    dict_variable_elements_selected.multi_selected_links.current = []
    localStorage.removeItem('diff')
    localStorage.removeItem('data')
    localStorage.removeItem('last_save')
    localStorage.removeItem('initial_data')
    localStorage.removeItem('icon_imported')
    dict_variable_elements_selected.ref_selected_style_node.current = 'default'
    dict_variable_elements_selected.ref_selected_style_link.current = 'default'
    contextMenu.ref_setter_contextualised_node.current!(undefined)
    contextMenu.ref_setter_contextualised_link.current!(undefined)
    contextMenu.tagContext.current![0][1](undefined)
    contextMenu.showContextZDDRef.current![0][1](false)
    set_data(new_data)
    sessionStorage.setItem('dismiss_warning_sankey_plus','0')
    sessionStorage.setItem('dismiss_warning_sankey_mfa','0')
  }

  const closeAllMenu=()=>{
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_config.current(false)
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_node_apparence.current(false)
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_node_io.current(false)
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_link_data.current(false)
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_link_appearence.current(false)
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_layout.current(false)
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_apply_layout.current!(false)
    contextMenu.closeAllMenuContext()
  }
  /*************************************************************************************************/
  const menu_configuration_layout= OpenSankeyMenuConfigurationLayout(
    applicationContext,
    dict_variable_application_data,
    contextMenu,
    dict_variable_elements_selected,
    legend_clicked,
    <></>
  )

  const menu_configuration_nodes_attributes = OpenSankeyConfigurationNodesAttributes(
    applicationContext,
    dict_variable_application_data,
    dict_variable_elements_selected,
    false,
    dict_variable_elements_selected.ref_selected_style_node,
    [],
    [],
    []
  )
 
  const sankey_menus = OpenSankeyMenus(
    applicationContext.t,
    Reinitialization,
    dict_variable_application_data.get_default_data,
    dict_hook_ref_setter_show_dialog_components,
    never_see_again,
    dict_variable_application_data.data,dict_variable_application_data.set_data as (d:SankeyData)=>void,
    [],
    [],
    [],
    //dict_variable_elements_selected.set_tags_selected,
    convert_data
  )

  Object.values(dict_variable_application_data.data.levelTags).forEach(tag_group=>tag_group.activated = false)
  if ('Primaire' in dict_variable_application_data.data.levelTags) {
    dict_variable_application_data.data.levelTags['Primaire'].activated = true
  }

  const {filter}=dict_variable_application_data.data.display_style
  const toolbar = ToolbarBuilder(
    applicationContext.t,
    data,
    set_data,
    dict_variable_elements_selected,
    filter,
    ( new_current_filter: number ) => {
      const { display_style } = dict_variable_application_data.data
      display_style.filter = +new_current_filter
      dict_variable_application_data.set_data({ ...dict_variable_application_data.data })
    },
    <Popover id='popover-details-level' style={{maxWidth:'100%'}}>
      <Popover.Header as="h3">{applicationContext.t('Banner.ndd')}</Popover.Header>
      <Popover.Body style={{  marginLeft: '5px', width: '350px' }}>

        <>{(Object.entries(dict_variable_application_data.data.levelTags).length > 0) ? (<>
          {addSimpleLevelDropDown(applicationContext.t,dict_variable_application_data.data,dict_variable_application_data.set_data)}</>
        ) : (<>
          <Form.Control placeholder="Pas de filtrage" style={{ opacity: !windowSankey.SankeyToolsStatic ? '0.3' : '0', color: '#6c757d' }} disabled /></>)}</>
      </Popover.Body>
    </Popover>,
    '',
    dict_variable_elements_selected.first_selected_node,
    GetSankeyMinWidthAndHeight,
    setDiagram,
    dict_hook_ref_setter_show_dialog_components,
    never_see_again,
    convert_data,
    DefaultSankeyData
  )

  Object.keys(toolbar).forEach(k=>{
    sankey_menus[k]=toolbar[k]
  })

  const formatKeyHandler=(e:KeyboardEvent)=>{
    keyHandler(
      e,dict_variable_application_data.data,dict_variable_elements_selected.multi_selected_nodes,dict_variable_elements_selected.multi_selected_links,
      dict_variable_application_data.set_data,dict_variable_elements_selected.mode_selection,closeAllMenu
    )
  }
  document.onkeydown = formatKeyHandler

  // Wait a delay before adding the event on sankeydrawzone for the element to be created, because otherwise the d3 selection return nothing
  if( !windowSankey.SankeyToolsStatic ){
    setTimeout(()=>{
      //Ajout des events sur les l'ajout des noeuds aux click
      const svgSankey=d3.select('.opensankey #svg')
  
      svgSankey.on('mousedown',evt=>{
        EventOnZoneMouseDown(
          dict_variable_application_data,
          dict_variable_elements_selected,
          false,
          dict_hook_ref_setter_show_dialog_components,
          evt,
          start_point,
          contextMenu.closeAllMenuContext
        )
      })
      svgSankey.on('mousemove',evt=>{
        EventOnZoneMouseMove(
          dict_variable_application_data,
          dict_variable_elements_selected,
          evt,
          start_point
        )
      })
      svgSankey.on('mouseup',evt=>{
        EventOnZoneMouseUp(
          dict_variable_application_data,
          dict_variable_elements_selected,
          uiElementsRef,
          false,
          dict_hook_ref_setter_show_dialog_components,
          evt,
          start_point,
          legend_clicked
        )
      })
    },100)
  }
  /*************************************************************************************************/
  useEffect(() => {
    // Call the function that add nodes to the sankey
    DrawNodes(
      contextMenu,
      dict_variable_application_data,
      uiElementsRef,
      dict_variable_elements_selected,
      ref_alt_key_pressed,
      NodeTooltipsContent,
      LinkText,
      GetLinkValue,
      accept_simple_click
    )
    OpenSankeyDrawNodesLabel(
      data,
      set_data as (d:SankeyData)=>void,
      dict_variable_elements_selected.multi_selected_nodes,
      GetLinkValue
    )

    // const suiteDrawArrows= DrawArrows
    d3.selectAll(' .opensankey #svg #sankey_def').remove()

    // const suiteLinkStroke= LinkStroke
    // const suiteDrawArrows= OpenSankeyDrawFunction.DrawArrows

    // Call the function that add links to the sankey
    d3.select(' .opensankey #svg #sankey_def').remove()
    d3.select(' .opensankey #svg').append('defs').attr('id', 'sankey_def')
    DrawLinks(
      contextMenu,
      dict_variable_application_data,
      uiElementsRef,
      dict_variable_elements_selected,
      ref_alt_key_pressed,
      (windowSankey.SankeyToolsStatic ? windowSankey.SankeyToolsStatic : false) ? 'relative' : 'absolute',
      (data:SankeyData,n: SankeyNode) => !NodeDisplayed(data,n) || (n.inputLinksId.length === 0) || (!ReturnValueLink(data,data.links[n.inputLinksId[0]],'arrow')) ? false : true,
      LinkTooltipsContent,
      LinkText,
      GetLinkValue,
      LinkStroke,
      DrawArrows,
      LinkColor
    )
    // Create traduction function
    DrawLegend(
      dict_variable_application_data,
      applicationContext,
      contextMenu,
      GetLinkValue,
      legend_clicked
    )

    const g_legend=d3.select(' .opensankey #g_legend .drag_zone_leg') as d3.Selection<SVGGElement,unknown,HTMLElement,unknown>
    if(!windowSankey.SankeyToolsStatic){
      g_legend.call(drag_legend(data,set_data))
    }

    // Zoom Behavior
    const svgSankey = d3.select('.opensankey #svg');
    (svgSankey as d3.Selection<Element, unknown, HTMLElement, unknown>)
      .call(d3.zoom()
        .filter(ev => { // Permet d'obliger Crtl pour activer le zoom
          return (ev.ctrlKey || ev.metaKey) && ev.buttons === 0
        })
        .wheelDelta(ev => { // Permet de regler la vitesse du zoom
          return -ev.deltaY * (ev.deltaMode === 1 ? 0.05 : ev.deltaMode ? 1 : 0.002)
        })
        .on('zoom', function (evt) {
          ZoomFunction(evt,data)
        }))
      .on('dblclick.zoom', null)
  },[data])
  /*************************************************************************************************/
  //Ajout d'un delay pour laisser le temps au Menu de render pour ensuite utiliser sa hauteur afin d'ajouter un margin top au draw
  useEffect(() => {
    const timer = setTimeout(() => {
      set_show_draw(true)
      AdjustSankeyZone(data,GetSankeyMinWidthAndHeight)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  return <div style={{ 'backgroundColor' : 'WhiteSmoke' }}>
    <div className='div-Menu' style={{ 'backgroundColor' : 'WhiteSmoke'}} >
      { MenuDraggable(
        dict_hook_ref_setter_show_dialog_components,
        'ref_setter_show_menu_node_apparence',
        menu_configuration_nodes_attributes,
        contextMenu.pointer_pos,
        applicationContext.t('Menu.Noeuds')+' '+applicationContext.t('Noeud.apparence.apparence'),
      )
      }
      { MenuDraggable(
        dict_hook_ref_setter_show_dialog_components,
        'ref_setter_show_menu_node_io',
        SankeyMenuConfigurationNodesIO(
          applicationContext,
          dict_variable_application_data,
          dict_variable_elements_selected,
          GetLinkValue,
          true
        ),
        contextMenu.pointer_pos,
        applicationContext.t('Menu.Noeuds')+' '+applicationContext.t('Noeud.PF.PFM')
      )
      }
      { MenuDraggable(
        dict_hook_ref_setter_show_dialog_components,
        'ref_setter_show_menu_link_data',
        MenuConfigurationLinksData(
          dict_variable_application_data,
          dict_variable_elements_selected,
          applicationContext,
          [<></>],
          true
        ),
        contextMenu.pointer_pos,
        applicationContext.t('Menu.flux')+' '+applicationContext.t('Flux.data.données')
      )
      }
      { MenuDraggable(
        dict_hook_ref_setter_show_dialog_components,
        'ref_setter_show_menu_link_appearence',
        MenuConfigurationLinksAppearence(
          dict_variable_application_data,
          dict_variable_elements_selected,
          applicationContext,
          [],
          false,
          GetLinkValue,
          true
        ),
        contextMenu.pointer_pos,
        applicationContext.t('Menu.flux')+' '+applicationContext.t('Flux.apparence.apparence')
      )
      }
      { MenuDraggable(
        dict_hook_ref_setter_show_dialog_components,
        'ref_setter_show_menu_layout',
        menu_configuration_layout,
        contextMenu.pointer_pos,
        applicationContext.t('Menu.MEP')
      )
      }
      <>
        <Menu
          applicationContext={applicationContext}
          dict_variable_application_data={dict_variable_application_data}
          uiElementsRef={uiElementsRef}
          contextMenu={contextMenu}
          processFunctions={processFunctions}
          dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
          applicationDraw={applicationDraw}

          ref_nav_item_active={uiElementsRef.ref_nav_item_active}
          example_menu={<></>}
          configurations_menus={ OpenSankeyConfigurationsMenus(
            dict_variable_application_data,
            dict_variable_elements_selected,
            applicationContext,
            uiElementsRef,
            dict_hook_ref_setter_show_dialog_components,
            menu_configuration_layout,
            <SankeySettingsEditionElementTags
              t={applicationContext.t}
              data={dict_variable_application_data.data}
              set_data={dict_variable_application_data.set_data}
              elementTagNameProp='nodeTags'
              elementNameProp='nodes'
            />, 
            <SankeySettingsEditionElementTags
              t={applicationContext.t}
              data={dict_variable_application_data.data}
              set_data={dict_variable_application_data.set_data}
              elementTagNameProp='fluxTags'
              elementNameProp='links' 
            />,
            <SankeySettingsEditionElementTags
              t={applicationContext.t}
              data={dict_variable_application_data.data}
              set_data={dict_variable_application_data.set_data}
              elementTagNameProp='dataTags'
              elementNameProp='links' 
            />,
            OpenSankeyMenuConfigurationNodes(
              applicationContext,
              dict_variable_application_data,
              dict_variable_elements_selected,
              contextMenu,
              menu_configuration_nodes_attributes,
              GetLinkValue,
            ),
            MenuConfigurationLinks(
              dict_variable_application_data,
              dict_variable_elements_selected,
              applicationContext,
              [<></>],
              [<></>],
              GetLinkValue
            ),
            <></>,
            false, //TODO
          )}
          menus={sankey_menus}
          cardsTemplate={CardsTemplateBuilder(
            exemple_menu,
            dict_variable_elements_selected,
            dict_variable_application_data,
            applicationContext,
            Reinitialization,
            convert_data
          )}
          external_modal={[
            <React.Fragment key={'modale_style_link'}>{SankeyModalStyleLink(
              applicationContext,
              dict_variable_application_data,
              dict_variable_elements_selected,
              dict_hook_ref_setter_show_dialog_components.ref_show_style_link,
              []
            )
            }</React.Fragment>,
            <React.Fragment key={'modale_style_node'}>{SankeyModalStyleNode(
              applicationContext,
              dict_variable_application_data,
              dict_variable_elements_selected,
              dict_hook_ref_setter_show_dialog_components.ref_show_style_node,
              dict_variable_elements_selected.ref_selected_style_node,
              []
            )}</React.Fragment>,
            <React.Fragment key={'modale_preference'}><ModalPreference
              dict_hook_ref_setter_show_dialog_components={dict_hook_ref_setter_show_dialog_components}
              ui={Object.values(OpenSankeyDefaultModalePreferenceContent(applicationContext.t,
                dict_variable_application_data.data, dict_variable_application_data.set_data,
                i18next)).map(d=>{
                return <>{d}<hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }} /></>
              })}
              t={applicationContext.t}
            /></React.Fragment> ,
            welcomeModalBuilder(
              applicationContext.t,
              exemple_menu,
              dict_hook_ref_setter_show_dialog_components,
              never_see_again,
              active_page
            )
          ]}
          Reinitialization={Reinitialization}
          formations_menu={formations_menu}
          additional_nav_item={[
            LastCheckpointTime(applicationContext.t),
            OpenSankeySaveButton(applicationContext.t)
          ]}
          convert_data={convert_data}
          elementToDispose={elementToDispose}
          apply_transformation_additional_elements={[]}
          DiagramSelector={OpenSankeyDiagramSelector}
        />
      </>
    </div>
    <ContextMenuNode
      applicationContext = {applicationContext}
      dict_variable_application_data = {dict_variable_application_data}
      dict_variable_elements_selected = {dict_variable_elements_selected}
      contextMenu = {contextMenu}
      dict_hook_ref_setter_show_dialog_components = {dict_hook_ref_setter_show_dialog_components}
      agregation = {agregation}
      additional_context_element_menu = {[<></>]} 
      additional_context_element_other = {[<></>]}
    />
    <ContextMenuLink
      applicationContext = {applicationContext}
      dict_variable_application_data = {dict_variable_application_data}
      dict_variable_elements_selected = {dict_variable_elements_selected}
      contextMenu = {contextMenu}
      dict_hook_ref_setter_show_dialog_components = {dict_hook_ref_setter_show_dialog_components}
    />
    <ContextMenuZdd
      applicationContext = {applicationContext}
      dict_variable_application_data = {dict_variable_application_data}
      contextMenu = {contextMenu}
      dict_hook_ref_setter_show_dialog_components = {dict_hook_ref_setter_show_dialog_components}
    />
    <ContextLegendTags
      applicationContext = {applicationContext}
      dict_variable_application_data = {dict_variable_application_data}
      dict_variable_elements_selected = {dict_variable_elements_selected}
      contextMenu = {contextMenu}
      GetLinkValue = {GetLinkValue}
    />

    <SankeyDraw
      contextMenu={contextMenu}
      data={data}
      set_data={set_data}
      display_nodes={display_nodes}
      display_links={display_links}
      animation={useRef(false)}
      mode_selection={dict_variable_elements_selected.mode_selection}
      agregation={agregation}
      ref_alt_key_pressed={ref_alt_key_pressed}
      GetSankeyMinWidthAndHeight={GetSankeyMinWidthAndHeight}
    />
  </div>
}

export default SankeyApp


