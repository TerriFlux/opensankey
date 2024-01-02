// General import
import React, { useState, useEffect, useRef, FunctionComponent, RefObject } from 'react'
import * as d3 from 'd3'
import { useTranslation } from 'react-i18next'

import { SankeyAppTypes, SankeyData, SankeyLink, SankeyNode, applicationContextType, applicationDataType, contextMenuType, elementsSelectedType, uiElementsRefType } from './types/Types'

import SankeyDraw from './lib/SankeyDraw'
import { LinkStrokeFuncType } from './types/SankeyDrawLinksTypes'
import { GetSankeyMinWidthAndHeight, LinkStroke, ZoomFunction, RepositionneSidebar, EventOnZoneMouseDown, EventOnZoneMouseMove, EventOnZoneMouseUp, DrawArrows } from './lib/SankeyDrawFunction'
import { DrawLegend } from './lib/SankeyDrawLegend'
import { DrawLinks } from './lib/SankeyDrawLinks'
import { DrawNodes } from './lib/SankeyDrawNodes'
import { OpenSankeyDrawNodesLabel } from './lib/SankeyDrawNodesLabel'
import { NodeTooltipsContent, LinkTooltipsContent } from './lib/SankeyTooltip'
import { GetLinkValue, NodeDisplayed, ReturnValueLink, LinkText, LinkVisible, AdjustSankeyZone, DefaultSankeyData, windowSankey, LinkColor } from './lib/SankeyUtils'
import { SankeyAppBuilder } from './SankeyAppBuilder'
import { convert_data } from './lib/SankeyConvert'

/*******************************************************************************/

export const SankeyApp : FunctionComponent<SankeyAppTypes> = ({
  initial_sankey_data,
  exemple_menu,
  formations_menu,
  logo,
  logo_terriflux
}) => {

  //- AFMSankey
  const [flux_colormap] = useState('no_colormap')

  //- All
  const mode_selection = useRef('ln')
  const multi_selected_nodes = useRef([] as SankeyNode[])
  const multi_selected_links = useRef([] as SankeyLink[])
  const button_ref = useRef<HTMLLabelElement>(null) as {current : HTMLLabelElement}
  const accordion_ref = useRef<HTMLDivElement>(null) as {current : HTMLDivElement}
  const links_accordion_ref = useRef<HTMLDivElement>(null) as {current : HTMLDivElement}
  const nodes_accordion_ref = useRef<HTMLDivElement>(null) as {current : HTMLDivElement}
  const [data, pre_set_data] = useState<SankeyData>(initial_sankey_data)
  const start_point=useRef([0,0])
  const contextualised_node = useRef<SankeyNode>()
  const contextNodeRef = useRef<HTMLDivElement>() as RefObject<HTMLDivElement>
  const contextZDDRef = useRef<HTMLDivElement>() as RefObject<HTMLDivElement>
  const contextualised_link = useRef<SankeyLink>()
  const pointer_pos=useRef([0,0])
  const [legend_clicked,set_legend_clicked]=useState(false)
  const [show_agregation,set_show_agregation] = useState(false)
  const [maximum_flux, set_maximum_flux] = useState(data.maximum_flux)
  const [tag_contextualised,set_tag_contextualised]= useState<string>() as [string|undefined,(t: string | undefined) => void]

  const show_context_zdd=useRef(false)
  const [show_nav, set_show_nav] = useState(false)

  //- Styles
  const [selected_style_link, set_selected_style_link] = useState('default')
  const [selected_style_node, set_selected_style_node] = useState('default')

  // For SankeyDraw
  const [alt_key_pressed,set_alt_key_pressed] = useState(false)
  const [first_selected_node,set_first_selected_node] = useState({}) as unknown as  [SankeyNode,(_:SankeyNode)=>void]
  const [agregation_node, set_agregation_node] = useState('')
  const [is_agregation, set_is_agregation] = useState(true)
  const [display_link_opacity,set_display_link_opacity]=useState('0')
  const accept_simple_click=useRef(true)

  const displayedInputLinkValueRef = useRef<HTMLInputElement>() as RefObject<HTMLInputElement>

  //For OpenSankeyMenuConfigurationLegend
  const [legend_position, set_legend_position] = useState(data.legend_position)

  const set_data=(ndata:SankeyData)=>{
    //userScaleRef.current = data.user_scale
    if(ndata.legend_position!==legend_position){
      set_legend_position(ndata.legend_position)
    }

    if(data.maximum_flux && data.minimum_flux && data.minimum_flux>data.maximum_flux){
      data.maximum_flux=data.minimum_flux
      set_maximum_flux(data.minimum_flux)
    }

    pre_set_data({...ndata})
  }

  // For OpenSankeyMenuConfigurationLinks
  const newEntries = new Map(Object.entries(data.dataTags).map(([dataTagKey, dataTag]) => {
    return (Object.keys(dataTag.tags).length > 0) ? [
      dataTagKey,
      Object.entries(dataTag.tags).filter(tag => tag[1].selected).length > 0 ? Object.entries(dataTag.tags).filter(tag => tag[1].selected)[0][0] : Object.keys(dataTag.tags)[0]] : ['n', 'n']
  }))
  const dataTagsSelected = Object.fromEntries(newEntries)
  const [tags_selected, set_tags_selected] = useState(dataTagsSelected) as [{[k: string]: string},(_:{[k: string]: string})=>void]
  if (Object.keys(tags_selected).length !== Object.keys(dataTagsSelected).length) {
    set_tags_selected(dataTagsSelected)
  }

  //- Modals and Dialogs
  const [, set_show_draw] = useState(false)

  const {t} = useTranslation()
  const applicationContext : applicationContextType = {
    t:t,
    logo_width : 100,
    app_name : 'SankeySuite',//TODO
    url_prefix : '', //TODO
    logo : logo,
    logo_terriflux : logo_terriflux,
  }

  const uiElementsRef : uiElementsRefType = {
    button_ref : button_ref,
    accordion_ref : accordion_ref,
    links_accordion_ref : links_accordion_ref,
    nodes_accordion_ref : nodes_accordion_ref
  }

  const elementsSelected : elementsSelectedType = {
    multi_selected_nodes : multi_selected_nodes,
    multi_selected_links : multi_selected_links,
    tags_selected : tags_selected,
    set_tags_selected : set_tags_selected,
    selected_style_node : selected_style_node,
    set_selected_style_node : set_selected_style_node,
    selected_style_link : selected_style_link,
    set_selected_style_link : set_selected_style_link,
    first_selected_node : first_selected_node,
    set_first_selected_node : set_first_selected_node as elementsSelectedType['set_first_selected_node']
  }

  const closeAllMenuContext=()=>{
    contextualised_node.current = undefined
    contextualised_link.current = undefined
    set_tag_contextualised(undefined)
    show_context_zdd.current=false
    contextMenu.contextNodeRef.current!.hidden = true    
    contextMenu.contextZDDRef.current!.hidden = true    
  } 

  const contextMenu : contextMenuType = {
    contextNodeRef : contextNodeRef,
    contextZDDRef : contextZDDRef,
    contextualised_node : contextualised_node,
    contextualised_link : contextualised_link,
    tag_contextualised : tag_contextualised,
    set_tag_contextualised : set_tag_contextualised,
    closeAllMenuContext : closeAllMenuContext,
    pointer_pos : pointer_pos,
    show_context_zdd : show_context_zdd,
  }

  const mode_pref=sessionStorage.getItem('modepref')
  if(mode_pref && mode_pref==='expert' && data.accordeonToShow.length!==6){
    data.accordeonToShow = ['MEP', 'EN', 'EF', 'ED', 'LL', 'Vis']
  }

  // Réinitialise data et vide les noeud/liens sélectionnés
  const Reinitialization = () => {
    const new_data = DefaultSankeyData()
    multi_selected_nodes.current = []
    multi_selected_links.current = []
    localStorage.removeItem('diff')
    localStorage.removeItem('data')
    localStorage.removeItem('last_save')
    localStorage.removeItem('initial_data')
    localStorage.removeItem('icon_imported')
    set_selected_style_node('default')
    set_selected_style_link('default')
    contextualised_node.current = undefined
    contextualised_node.current = undefined
    set_tag_contextualised(undefined)
    set_data(new_data)
    sessionStorage.setItem('dismiss_warning_sankey_plus','0')
    sessionStorage.setItem('dismiss_warning_sankey_mfa','0')
  }

  const size_of_draw_zone = GetSankeyMinWidthAndHeight
  const SuiteGetLinkValue = GetLinkValue

  const default_node_arrow_visible =
  (data:SankeyData,n: SankeyNode) => !NodeDisplayed(data,n) || (n.inputLinksId.length === 0) || (!ReturnValueLink(data,data.links[n.inputLinksId[0]],'arrow')) ? false : true

  const position = (windowSankey.SankeyToolsStatic ? windowSankey.SankeyToolsStatic : false) ? 'relative' : 'absolute'

  // Test for link text function if we have a token and if so we complet a certain condition
  const pre_link_text= LinkText
  // Test if the current data is a vue of a unitary node so we display link value as percent
  const SankeyLinkText=pre_link_text
  // const SankeyLinkText=pre_link_text

  const display_nodes = Object.keys(data.nodes)
    .filter((key) => NodeDisplayed(data,data.nodes[key]))
    .reduce((obj, key) => {
      return Object.assign(obj, {
        [key]: data.nodes[key]
      })
    }, {}) as {[idNode:string]:SankeyNode}
  const pre_display_links=Object.keys(data.links)
    .filter((key) =>LinkVisible(data.links[key],data,display_nodes,SuiteGetLinkValue))
    .reduce((obj, key) => {
      return Object.assign(obj, {
        [key]: data.links[key]
      })
    }, {}) as {[idLink:string]:SankeyLink}
  const pre_link_key=Object.keys(pre_display_links)
  const display_links={} as {[idLink:string]:SankeyLink}
  data.linkZIndex.filter(lk=>pre_link_key.includes(lk)).forEach(lk=>display_links[lk]=pre_display_links[lk])


  const applicationData : applicationDataType = {
    data : data,
    set_data : set_data,
    get_default_data : DefaultSankeyData,
    display_nodes : display_nodes,
    display_links : display_links
  }

  useEffect(() => {
    // Call the function that add nodes to the sankey
    DrawNodes(
      contextMenu,
      applicationData,
      uiElementsRef,
      elementsSelected,
      mode_selection,
      alt_key_pressed,
      NodeTooltipsContent,
      SankeyLinkText, //LinkText
      SuiteGetLinkValue,
      displayedInputLinkValueRef,
      accept_simple_click
    )
    OpenSankeyDrawNodesLabel(data,set_data as (d:SankeyData)=>void,multi_selected_nodes,SuiteGetLinkValue)

    const suiteDrawArrows= DrawArrows
    d3.selectAll(' .opensankey #svg #sankey_def').remove()

    const suiteLinkStroke= LinkStroke
    // const suiteDrawArrows= OpenSankeyDrawFunction.drawArrows

    // Call the function that add links to the sankey
    d3.select(' .opensankey #svg #sankey_def').remove()
    d3.select(' .opensankey #svg').append('defs').attr('id', 'sankey_def')
    DrawLinks(
      contextMenu,
      applicationData,
      uiElementsRef,
      elementsSelected,
      mode_selection,
      alt_key_pressed,
      position,
      default_node_arrow_visible,
      LinkTooltipsContent,
      LinkText,
      GetLinkValue,
      displayedInputLinkValueRef,
      LinkStroke,
      DrawArrows,
      set_display_link_opacity,
      LinkColor
    )
    // Create traduction function
    DrawLegend(
      applicationData,
      applicationContext,
      contextMenu,
      GetLinkValue,
      legend_clicked,
      set_legend_clicked
    )

    //const g_legend=d3.select(' .opensankey #g_legend .g_drag_zone_leg') as d3.Selection<SVGGElement,unknown,HTMLElement,unknown> //TODO
    // if(!window.SankeyToolsStatic){
    //   g_legend.call(DragLegendPlus(data,set_data as (d:SankeyData)=>void,multi_selected_label))
    // }

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
  },[data, first_selected_node, alt_key_pressed, position, flux_colormap, size_of_draw_zone, SuiteGetLinkValue, tags_selected, t])

  // const shortcut_modale=OpenSankeyModalShortcut(t,showShortcut,setshowShortcut,additional_shortcut_item)
  //Event listener sur les touche du clavier
  //Réagis à :
  //-Flêches qui déplace les noeuds sélectionnés
  //-Echape qui ferme la navbar
  //-Ctrl+S qui sauvegarde une vue

  RepositionneSidebar(show_nav)

  const d= (
    <div style={{ 'backgroundColor' : 'WhiteSmoke' }}>
      <>
        <SankeyAppBuilder
          applicationContext={applicationContext}
          elementsSelected = {elementsSelected}
          uiElementsRef = {uiElementsRef}
          applicationData = {applicationData}
          contextMenu = {contextMenu}
          show_nav = {show_nav}
          set_show_nav = {set_show_nav}
          formations_menu={formations_menu}
          exemple_menu={exemple_menu}
          mode_selection={mode_selection}
          GetLinkValue={GetLinkValue}
          Reinitialization={Reinitialization}
          size_of_draw_zone={size_of_draw_zone}
          display_link_opacity={display_link_opacity}
          set_display_link_opacity={set_display_link_opacity}
          legend_position={legend_position}
          set_legend_position={set_legend_position}
          set_agregation_node={set_agregation_node}
          set_is_agregation={set_is_agregation}
          convert_data={convert_data}
          maximum_flux={maximum_flux}
          set_maximum_flux={set_maximum_flux}
          displayedInputLinkValueRef={displayedInputLinkValueRef}
          callback={()=>null}
          set_show_agregation={set_show_agregation}
        />
        {//Ajout d'un delay pour laisser le temps au Menu de render pour ensuite utiliser sa hauteur afin d'ajouter un margin top au draw
        }
        {useEffect(() => {
          const timer = setTimeout(() => {
            set_show_draw(true)
            AdjustSankeyZone(data,size_of_draw_zone)
          }, 100)
          return () => clearTimeout(timer)
        }, [])}

        <SankeyDraw
          contextMenu={contextMenu}
          data={data}
          set_data={set_data}
          display_nodes={display_nodes}
          display_links={display_links}
          animation={false}
          mode_selection={mode_selection}
          show_agregation={show_agregation}
          set_show_agregation={set_show_agregation}
          agregation_node={agregation_node}
          set_agregation_node={set_agregation_node}
          is_agregation={is_agregation}
          set_alt_key_pressed={set_alt_key_pressed}
          GetSankeyMinWidthAndHeight={size_of_draw_zone}

        />

      </>
    </div>
  )

  // Wait a delay before adding the event on sankeydrawzone for the element to be created, because otherwise the d3 selection return nothing
  if(windowSankey.SankeyToolsStatic!==true){
    setTimeout(()=>{
      //Ajout des events sur les l'ajout des noeuds aux click
      const svgSankey=d3.select('.opensankey #svg')
  
      svgSankey.on('mousedown',evt=>{
        EventOnZoneMouseDown(
          mode_selection,
          applicationData,
          elementsSelected,
          false,
          ()=>null,
          evt,
          start_point,
          closeAllMenuContext)
      })
      svgSankey.on('mousemove',evt=>{
        EventOnZoneMouseMove(mode_selection,  
          applicationData,
          elementsSelected,evt,start_point)
      })
      svgSankey.on('mouseup',evt=>{
        EventOnZoneMouseUp(
          mode_selection,
          applicationData,
          elementsSelected,
          uiElementsRef,
          false,
          ()=>null,
          displayedInputLinkValueRef,
          evt,
          start_point,
          set_legend_clicked)
      })
    },100)
  }

  return (d)
}


export default SankeyApp


