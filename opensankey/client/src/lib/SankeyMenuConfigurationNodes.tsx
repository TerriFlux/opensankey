import React, { FunctionComponent, useState } from 'react'
import { Row, Form, FormControl, FormLabel, Col, FormCheck, Tabs, Tab, Table, Button, ButtonGroup, Dropdown } from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { SankeyDataPropTypes, SankeyLinkPropTypes, SankeyNodePropTypes } from './types'
import { reorganize_node_inputLinksId,reorganize_node_outputLinksId } from './SankeyLayout'
import { default_link, link_visible,link_color, cut_name,default_node,add_new_node,delete_node } from './SankeyUtils'
import * as d3 from 'd3'
import { FaArrowAltCircleUp, FaArrowAltCircleDown, FaPlus, FaMinus} from 'react-icons/fa'
import {useTranslation} from 'react-i18next'
import { MultiSelect } from 'react-multi-select-component'
import { selected_type } from './SankeyMenu'
import { textwrap } from 'd3-textwrap'


const SankeyNodeEditionPropTypes = {
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  selected_node: PropTypes.shape({current:PropTypes.shape(SankeyNodePropTypes).isRequired}).isRequired,
  multi_selected_nodes: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired}).isRequired,
  multi_selected_links: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyLinkPropTypes).isRequired).isRequired}).isRequired,
  style_to_apply: PropTypes.string.isRequired,
  set_style_to_apply: PropTypes.func.isRequired
}

type SankeyEditionTypes = InferProps<typeof SankeyNodeEditionPropTypes>

const SankeyNodeEdition: FunctionComponent<SankeyEditionTypes> = (
  { data, set_data,selected_node, multi_selected_nodes,multi_selected_links,style_to_apply,set_style_to_apply, children }
) => {
  const { nodeTags } = data
  const [forceUpdate, setForceUpdate] = useState(false)
  const [radio_selected] = useState<string>('local')
  const tags_visible = Object.keys(nodeTags).length > 0
  const [tags_group_key, set_tags_group_key] = useState(tags_visible ? Object.keys(nodeTags)[0] : '')
  const [parent_visible,set_parent_visible] = useState(false)
  const [cube_dimension,set_cube_dimension] = useState(
    Object.values(nodeTags).filter(tag=>tag.banner == 'level').length > 0 ? Object.entries(nodeTags).filter(([,tag])=>tag.banner == 'level')[0][0] : 'Primaire' 
  )
  const {t} =useTranslation()

  if (Object.values(nodeTags).filter(tag=>tag.banner == 'level').length > 0 && cube_dimension == 'Primaire') {
    if (Object.values(nodeTags).filter(tag=>tag.banner == 'level' && tag.group_name == 'Primaire').length == 0) {
      set_cube_dimension(Object.entries(nodeTags).filter(([,tag])=>tag.banner == 'level')[0][0])
    }
  }

  const display_nodes = data.nodes
  const display_links = data.links
  if ((tags_group_key == '' && Object.keys(nodeTags).length > 0) || (!Object.keys(nodeTags).includes(tags_group_key) && Object.keys(nodeTags).length > 0)) {
    set_tags_group_key(Object.keys(nodeTags)[0])
  }
  
  const tmpNodes = Object.fromEntries(Object.entries(data.nodes).sort(([, a], [, b]) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)))
  const INITIAL_OPTIONS = Object.values(tmpNodes).filter(d=>(data.displayed_node_selector)?d.display:true).map((d) => { return { 'label': d.name, 'value': d.idNode } })
  // const INITIAL_OPTIONS = Object.values(data.nodes).map(d => d.name).sort().map((d) => { return { 'label': d, 'value': d } })

  const selected : selected_type[] = multi_selected_nodes.current.map((d) => { return { 'label': d.name, 'value': d.idNode } })
  //Renvoie le menue déroulant pour la sélection des noeuds
  const dropdownMultiNode = () => {
    const DD = (
      <div id='DD_multi_node'>
        <MultiSelect
          valueRenderer={(selected: selected_type[]) => {
            return selected.length ? selected.map(({ label })=> label + ', ') : 'Aucun noeud sélectionné'
          }}
          options={INITIAL_OPTIONS}
          value={selected}
          overrideStrings={{
            'selectAll': 'Tout sélectionner',
          }}
          onChange={(selected: [{ label: string, value: string }]) => {
            const new_sel = selected.map(d => d.value)
            const m_s = Object.values(data.nodes).filter(d => (new_sel.includes(d.idNode)))
            multi_selected_nodes.current = m_s
            Object.values(data.nodes).forEach( n => 
              d3.select(' .opensankey #' + n.idNode).attr('stroke-width',0)
            )
            multi_selected_nodes.current.forEach( n => 
              d3.select(' .opensankey #' + n.idNode).attr('stroke-width',2)
            )
            setForceUpdate(!forceUpdate)          
          }}
          labelledBy={'hello'}
        />
      </div>)
    return DD
  }

  const apply_style_to_nodes = () => {
    const style = data.style_node[style_to_apply]
    multi_selected_nodes.current.map(d => {
    //Style Noeud
      d.shape_visible = style.shape_visible
      d.color = style.color
      d.shape = style.shape
      d.node_width = style.node_width
      d.node_height = style.node_height

      //Syle label
      d.label_visible = style.label_visible
      d.show_value = style.show_value
      d.display_style.font_size = style.display_style.font_size
      d.display_style.bold = style.display_style.bold
      d.display_style.uppercase = style.display_style.uppercase
      d.display_style.italic = style.display_style.italic
      d.display_style.label_box_width = style.display_style.label_box_width
      d.display_style.label_vert = style.display_style.label_vert
      d.display_style.label_horiz = style.display_style.label_horiz
      d.display_style.font_family = style.display_style.font_family


    })
    set_data({ ...data })


  }
  const style_of_selected_nodes = () => {
    let style_to_display = 'Aucun'
    if (multi_selected_nodes.current.length != 0) {
      style_to_display = multi_selected_nodes.current[0].style
      let inchangee = true
      multi_selected_nodes.current.map(d => {
        inchangee = (d.style == style_to_display) ? inchangee : false
      })
      if (style_to_display != '' && style_to_display !== undefined) {
        return (inchangee) ? cut_name(data.style_node[style_to_display].name, 20) : 'Multiple style parmi les noeuds sélectionnés'

      } else {
        return 'Aucun'
      }
    } else {
      return style_to_display
    }
  }

  //Function that check if all selected nodes have the same value for some parameter
  const isAllNodeVisible = () => {
    let visible = false
    multi_selected_nodes.current.map(d => visible = (d.shape_visible || d.not_to_scale) ? true : visible)
    return visible
  }
  const isAllHideIfAlone = () => {
    let hide = false
    multi_selected_nodes.current.map(d => hide = (d.hide_lone_node) ? true : hide)
    return hide
  }
  const isAllNodeToScale = () => {
    let toScale = false
    multi_selected_nodes.current.map(d => toScale = (d.not_to_scale) ? true : toScale)
    return toScale
  }
  const isAllNodeTotal = () => {
    let show_value = false
    multi_selected_nodes.current.map(d => show_value = (d.show_value) ? true : show_value)
    return show_value
  }
  const isAllNodeRect = () => {
    let rect = true
    if (multi_selected_nodes.current.length > 0) {
      multi_selected_nodes.current.map(d => rect = (d.shape !== 'rect') ? false : rect)
    } else {
      rect = false
    }
    return rect
  }
  const isAllNodeNotToScaleOrientation = (orientation:string) => {
    let same_orientation = true
    if (multi_selected_nodes.current.length > 0) {
      multi_selected_nodes.current.map(d => same_orientation = (d.not_to_scale_direction !== orientation) ? false : same_orientation)
    } else {
      same_orientation = false
    }
    return same_orientation
  }
  const isAllNodeCircle = () => {
    let circle = true
    if (multi_selected_nodes.current.length > 0) {
      multi_selected_nodes.current.map(d => circle = (d.shape !== 'ellipse') ? false : circle)
    } else {
      circle = false
    }
    return circle
  }
  const isAllLabelVisible = () => {
    let visible = false
    multi_selected_nodes.current.map(d => visible = (d.label_visible) ? true : visible)
    return visible
  }
  const isAllLabelWhite = () => {
    let visible = false
    multi_selected_nodes.current.map(d => visible = (d.display_style.label_color) ? true : visible)
    return visible
  }
  const isAllNodeColorSustainable = () => {
    let colorS = true
    if (multi_selected_nodes.current.length > 0) {
      multi_selected_nodes.current.map(d => colorS = (!d.colorSustainable) ? false : colorS)
    } else {
      colorS = false
    }
    return colorS
  }
  const displayedValueNodeWidth = () => {
    let display_width = true
    let width = 0
    if (multi_selected_nodes.current.length != 0) {
      width = multi_selected_nodes.current[0].node_width
    }
    multi_selected_nodes.current.map((d) => {
      display_width = (d.node_width == width) ? display_width : false
    })
    return (display_width) ? width : 0
  }
  const displayedValueNodeHeight = () => {
    let display_height = true
    let width = 0
    if (multi_selected_nodes.current.length != 0) {
      width = multi_selected_nodes.current[0].node_height
    }
    multi_selected_nodes.current.map((d) => {
      display_height = (d.node_height == width) ? display_height : false
    })
    return (display_height) ? width : 0
  }
  const allNodeLabelFontSize = () => {
    let display_size = true
    let size = 11
    if (multi_selected_nodes.current.length != 0) {
      size = multi_selected_nodes.current[0].display_style.font_size
    }
    multi_selected_nodes.current.map((d) => {
      display_size = (d.display_style.font_size == size) ? display_size : false
    })
    return (display_size) ? size : 11
  }
  const allNodeValueFontSize = () => {
    let display_size = true
    let size = 11
    if (multi_selected_nodes.current.length != 0) {
      size = multi_selected_nodes.current[0].display_style.value_font_size
    }
    multi_selected_nodes.current.map((d) => {
      display_size = (d.display_style.value_font_size == size) ? display_size : false
    })
    return (display_size) ? size : 11
  }
  const isAllNodeBold = () => {
    let visible = true
    multi_selected_nodes.current.map(d => visible = (!d.display_style.bold) ? false : visible)
    return (multi_selected_nodes.current.length > 0) ? visible : false
  }
  const isAllNodeUpper = () => {
    let visible = true
    multi_selected_nodes.current.map(d => visible = (!d.display_style.uppercase) ? false : visible)
    return (multi_selected_nodes.current.length > 0) ? visible : false
  }
  const isAllNodeItalic = () => {
    let visible = true
    multi_selected_nodes.current.map(d => visible = (!d.display_style.italic) ? false : visible)
    return (multi_selected_nodes.current.length > 0) ? visible : false
  }
  const isAllNodeLabelVert = (arg: string, pos: string) => {
    let all_same = true
    if (multi_selected_nodes.current.length > 0) {
      if (arg == 'vert') {
        multi_selected_nodes.current.map(d => all_same = (d.display_style.label_vert !== pos) ? false : all_same)
      } else if (arg == 'horiz') {
        multi_selected_nodes.current.map(d => all_same = (d.display_style.label_horiz !== pos) ? false : all_same)
      }
    } else {
      all_same = false
    }
    return all_same
  }
  const isAllNodeLabelValueVert = (arg: string, pos: string) => {
    let all_same = true
    if (multi_selected_nodes.current.length > 0) {
      if (arg == 'vert') {
        multi_selected_nodes.current.map(d => all_same = (d.display_style.label_vert_valeur !== pos) ? false : all_same)
      } else if (arg == 'horiz') {
        multi_selected_nodes.current.map(d => all_same = (d.display_style.label_horiz_valeur !== pos) ? false : all_same)
      }
    } else {
      all_same = false
    }
    return all_same
  }
  const valueAllNodeLabelBox = () => {
    let display_size = true
    let size = 110
    if (multi_selected_nodes.current.length != 0) {
      size = multi_selected_nodes.current[0].display_style.label_box_width
    }
    multi_selected_nodes.current.map((d) => {
      display_size = (d.display_style.label_box_width == size) ? display_size : false
    })
    const d = (size == 0) ? '' : size
    return (display_size) ? d : 110
  }
  const isAllIconSame = (param: string) => {
    let icon = true

    multi_selected_nodes.current.map(d => {
      icon = (d.iconName == param) ? icon : false
    })
    return icon
  }
  const valueAllIconRatio = () => {
    let display_ratio = true
    let ratio = 100
    if (multi_selected_nodes.current.length != 0) {
      ratio = multi_selected_nodes.current[0].iconRatio
    }
    multi_selected_nodes.current.map((d) => {
      display_ratio = (d.iconRatio == ratio) ? display_ratio : false
    })
    const d = (ratio == 0) ? '' : ratio
    return (display_ratio) ? d : 100
  }
  const isAllIconVisible = () => {
    let visible = false
    multi_selected_nodes.current.map(d => visible = (d.iconVisible) ? true : visible)
    return visible
  }

  const [link_io,set_link_io]=useState('output')
  const [link_pos,set_link_pos]=useState('right')

  // Search links coming from/going to(io) from a face of it (pos) and return them
  const getIOLink=(pos:string,io:string)=>{
    const n=multi_selected_nodes.current[0]

    let link_io=([] as string[])

    if(io=='input'){
      if(pos=='left'){
        //Recherche tous les liens entrant a gauche
        link_io=Object.values(n.inputLinksId).filter(k=>{
          const n_s=data.nodes[data.links[k].idSource]
          const cond_no_recy=(((n_s.x<=n.x && n_s.position!='relative') ||(n_s.position=='relative' && n_s.x<0))&& !data.links[k].recycling)
          const cond_recy=(data.links[k].recycling && n_s.x>n.x)
          return (cond_no_recy || cond_recy)  && (data.links[k].orientation=='hh' ||data.links[k].orientation=='vh') && link_visible(data.links[k],data)
        })
      }else if(pos=='right'){
        //Recherche tous les liens entrant a droite
        link_io=Object.values(n.inputLinksId).filter(k=>{
          const n_s=data.nodes[data.links[k].idSource]
          const cond_no_recy=(((n_s.x>=n.x && n_s.position!='relative') ||(n_s.position=='relative' && n_s.x>0))&& !data.links[k].recycling)
          const cond_recy=(data.links[k].recycling && n_s.x<n.x)
          return  (cond_no_recy ||cond_recy) && (data.links[k].orientation=='hh' ||data.links[k].orientation=='vh')&& link_visible(data.links[k],data)
        })
      }else if(pos=='top'){
        //Recherche tous les liens entrant en haut
        link_io=Object.values(n.inputLinksId).filter(k=>{
          const n_s=data.nodes[data.links[k].idSource]
          return n_s.y<n.y && (data.links[k].orientation=='vv' ||data.links[k].orientation=='hv')&& link_visible(data.links[k],data)
        })
      }else if(pos=='bottom'){
        //Recherche tous les liens entrant en haut
        link_io=Object.values(n.inputLinksId).filter(k=>{
          const n_s=data.nodes[data.links[k].idSource]
          return n_s.y>=n.y && (data.links[k].orientation=='vv' ||data.links[k].orientation=='hv')&& link_visible(data.links[k],data)
        })
      }
    }else if(io=='output'){
      if(pos=='left'){
        //Recherche tous les liens entrant a gauche
        link_io=Object.values(n.outputLinksId).filter(k=>{
          const n_t=data.nodes[data.links[k].idTarget]
          const cond_no_recy=(((n_t.x<n.x  && n_t.position!='relative') ||(n_t.position=='relative' && n_t.x<=0)) && !data.links[k].recycling)
          const cond_recy=(data.links[k].recycling && n_t.x>n.x)
          return (( cond_no_recy|| cond_recy)) && (data.links[k].orientation=='hh' ||data.links[k].orientation=='hv')&& link_visible(data.links[k],data)
        })
      }else if(pos=='right'){ 
        //Recherche tous les liens entrant a droite
        link_io=Object.values(n.outputLinksId).filter(k=>{
          const n_t=data.nodes[data.links[k].idTarget]
          const cond_no_recy=(((n_t.x>=n.x && n_t.position!='relative') ||(n_t.position=='relative' && n_t.x>0))&& !data.links[k].recycling)
          const cond_recy=(data.links[k].recycling && n_t.x<n.x)
          return  ( cond_no_recy || cond_recy) && (data.links[k].orientation=='hh' ||data.links[k].orientation=='hv')&& link_visible(data.links[k],data)
        })
      }else if(pos=='top'){
        //Recherche tous les liens entrant en haut
        link_io=Object.values(n.outputLinksId).filter(k=>{
          const n_t=data.nodes[data.links[k].idTarget]
          return n_t.y<n.y && (data.links[k].orientation=='vv' ||data.links[k].orientation=='vh')&& link_visible(data.links[k],data)
        })
      }else if(pos=='bottom'){
        //Recherche tous les liens entrant en haut
        link_io=Object.values(n.outputLinksId).filter(k=>{
          const n_t=data.nodes[data.links[k].idTarget]
          return n_t.y>=n.y && (data.links[k].orientation=='vv' ||data.links[k].orientation=='vh')&& link_visible(data.links[k],data)
        })
      }
    }
    return link_io

  }
  /**
   * Switch the link with the one on top of him (similar to drag link)
   *
   * @param {string} k_link
   * @param {string} pos
   * @param {string} io
   */
  const handleUpLinkIOPos=(k_link:string,pos:string,io:string)=>{
    const n=multi_selected_nodes.current[0]
    const link_io=getIOLink(pos,io)
    if(io=='input'){
      if(pos=='left'){
        //Recherche tous les liens entrant a gauche
        

        //Repositionne le liens avant le liens entrant du même coté
        if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
          const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
          const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
          const posElemt = n.inputLinksId.indexOf(k_link)
          n.inputLinksId.splice(posElemt, 1)
          n.inputLinksId.splice(posElementPrec,0,k_link)
        } 

      }else if(pos=='right'){
        //Recherche tous les liens entrant a droite
        
        //Repositionne le liens avant le liens entrant du même coté
        if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
          const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
          const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
          const posElemt = n.inputLinksId.indexOf(k_link)
          n.inputLinksId.splice(posElemt, 1)
          n.inputLinksId.splice(posElementPrec,0,k_link)
        }

      }else if(pos=='top'){
        //Recherche tous les liens entrant en haut
        
        //Repositionne le liens avant le liens entrant du même coté
        if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
          const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
          const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
          const posElemt = n.inputLinksId.indexOf(k_link)
          n.inputLinksId.splice(posElemt, 1)
          n.inputLinksId.splice(posElementPrec,0,k_link)
        }

      }else if(pos=='bottom'){
        //Recherche tous les liens entrant en haut
     
        //Repositionne le liens avant le liens entrant du même coté
        if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
          const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
          const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
          const posElemt = n.inputLinksId.indexOf(k_link)
          n.inputLinksId.splice(posElemt, 1)
          n.inputLinksId.splice(posElementPrec,0,k_link)
        }

      }
    }else if(io=='output'){
      if(pos=='left'){
        //Recherche tous les liens sortant a gauche


        //Repositionne le liens avant le liens sortant du même coté
        if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
          const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
          const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
          const posElemt = n.outputLinksId.indexOf(k_link)
          n.outputLinksId.splice(posElemt, 1)
          n.outputLinksId.splice(posElementPrec,0,k_link)
        }

      }else if(pos=='right'){
        //Recherche tous les liens sortant a droite

        //Repositionne le liens avant le liens sortant du même coté
        if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
          const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
          const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
          const posElemt = n.outputLinksId.indexOf(k_link)

          n.outputLinksId.splice(posElemt, 1)
          n.outputLinksId.splice(posElementPrec,0,k_link)
        }


      }else if(pos=='top'){
        //Recherche tous les liens sortant en haut
 
        
        //Repositionne le liens avant le liens sortant du même coté
        if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
          const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
          const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
          const posElemt = n.outputLinksId.indexOf(k_link)
          n.outputLinksId.splice(posElemt, 1)
          n.outputLinksId.splice(posElementPrec,0,k_link)
        }

      }else if(pos=='bottom'){
        //Recherche tous les liens sortant en bas


        //Repositionne le liens avant le liens sortant du même coté
        if(link_io.includes(k_link) && link_io.indexOf(k_link)>0){
          const ElementPrecInFilter = link_io[link_io.indexOf(k_link)-1]
          const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
          const posElemt = n.outputLinksId.indexOf(k_link)
          n.outputLinksId.splice(posElemt, 1)
          n.outputLinksId.splice(posElementPrec,0,k_link)
        }

      }
    }
    
    set_data({...data})
  }

  /**
   * Switch the link with the one below him (similar to drag link)
   *
   * @param {string} k_link
   * @param {string} pos
   * @param {string} io
   */
  const handleDownLinkIOPos=(k_link:string,pos:string,io:string)=>{
    const n=multi_selected_nodes.current[0]
    const link_io=getIOLink(pos,io)

    if(io=='input'){
      if(pos=='left'){
        //Recherche tous les liens entrant a gauche
        

        //Repositionne le liens avant le liens entrant du même coté
        if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
          const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
          const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
          const posElemt = n.inputLinksId.indexOf(k_link)
          n.inputLinksId.splice(posElemt, 1)
          n.inputLinksId.splice(posElementPrec,0,k_link)
        } 

      }else if(pos=='right'){
        //Recherche tous les liens entrant a droite
        
        //Repositionne le liens avant le liens entrant du même coté
        if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
          const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
          const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
          const posElemt = n.inputLinksId.indexOf(k_link)
          n.inputLinksId.splice(posElemt, 1)
          n.inputLinksId.splice(posElementPrec,0,k_link)
        }
      }else if(pos=='top'){
        //Recherche tous les liens entrant en haut
 
        //Repositionne le liens avant le liens entrant du même coté
        if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
          const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
          const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
          const posElemt = n.inputLinksId.indexOf(k_link)
          n.inputLinksId.splice(posElemt, 1)
          n.inputLinksId.splice(posElementPrec,0,k_link)
        }
      }else if(pos=='bottom'){
        //Recherche tous les liens entrant en haut

        //Repositionne le liens avant le liens entrant du même coté
        if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
          const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
          const posElementPrec = n.inputLinksId.indexOf(ElementPrecInFilter)
          const posElemt = n.inputLinksId.indexOf(k_link)
          n.inputLinksId.splice(posElemt, 1)
          n.inputLinksId.splice(posElementPrec,0,k_link)
        }

      }
    }else if(io=='output'){
      if(pos=='left'){
        //Recherche tous les liens sortant a gauche


        //Repositionne le liens avant le liens sortant du même coté
        if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
          const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
          const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
          const posElemt = n.outputLinksId.indexOf(k_link)
          n.outputLinksId.splice(posElemt, 1)
          n.outputLinksId.splice(posElementPrec,0,k_link)
        }

      }else if(pos=='right'){
        //Recherche tous les liens sortant a droite
        
        //Repositionne le liens avant le liens sortant du même coté
        if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){

          const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
          const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
          const posElemt = n.outputLinksId.indexOf(k_link)
          n.outputLinksId.splice(posElemt, 1)
          n.outputLinksId.splice(posElementPrec,0,k_link)
        }

      }else if(pos=='top'){
        //Recherche tous les liens sortant en haut

        //Repositionne le liens avant le liens sortant du même coté
        if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
          const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
          const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
          const posElemt = n.outputLinksId.indexOf(k_link)
          n.outputLinksId.splice(posElemt, 1)
          n.outputLinksId.splice(posElementPrec,0,k_link)
        }

      }else if(pos=='bottom'){
        //Recherche tous les liens sortant en bas
        //Repositionne le liens avant le liens sortant du même coté
        if(link_io.includes(k_link) && link_io.indexOf(k_link)<link_io.length-1){
          const ElementPrecInFilter = link_io[link_io.indexOf(k_link)+1]
          const posElementPrec = n.outputLinksId.indexOf(ElementPrecInFilter)
          const posElemt = n.outputLinksId.indexOf(k_link)
          n.outputLinksId.splice(posElemt, 1)
          n.outputLinksId.splice(posElementPrec,0,k_link)
        }

      }
    }
    
    set_data({...data})
  }
  /**
   * Check if the selected node has links coming from/going to(io) from a face of it (pos)
   *
   * @param {string} io
   * @param {string} pos
   * @returns {boolean}
   */
  const has_link_come_from=(io:string,pos:string)=>{
    const link_io=getIOLink(pos,io)
    return link_io.length==0
  }

  const [tab_colored,set_tab_colored]=useState(false)
  /**
   * Create a html table displaying links attached to the selected node and filtered by where they're coming/going from 
   *
   * @param {string} pos
   * @param {string} io
   * @returns {*}
   */
  const tab_pos_link=(pos:string,io:string)=>{
    const link_io=getIOLink(pos,io)
    return (
      <>
        <Table striped bordered hover className='node_group_tags_definition'>
          <thead>
            <tr>
              <th>{t('Menu.flux')}</th>
              <th>{t('Tags.Position')}</th>
            </tr>
          </thead>
          <tbody>
            {
              link_io.map(
                (k, i) => {
                  const color=link_color(data.links[k],data)
                  const bc={'backgroundColor': (color && tab_colored)?color:'inherit'}
                  const n_s=data.nodes[data.links[k].idSource]
                  const n_t=data.nodes[data.links[k].idTarget]

                  return (
                    <tr key={i.toString()}>
                      
                      <td style={bc}>{n_s.name+'===>'+n_t.name}</td>
                      <td style={{ 'width': '10%' }}>
                        <ButtonGroup className="button_position" size="sm">
                          <Button variant="info" onClick={() => handleUpLinkIOPos(k,pos,io)}><FaArrowAltCircleUp /></Button>
                          <Button variant="info" onClick={() => handleDownLinkIOPos(k,pos,io)}><FaArrowAltCircleDown /></Button>
                        </ButtonGroup>
                      </td>

                    </tr>
                  )
                })
            }
          </tbody>
        </Table>
      </>
    )
  }
  
  /**
   * Tab that handle tag association to nodes, a nodes can have tags from the same grouptag or from different group
   * To visaulize nodes according to their tag associated, the groupTags must be at least have it banner in mode one or mutliple 
   * then in the nodes filter button, select the groupTag you want to apply and in the dropdown select the node/nodes you want to see
   *
   * @type {*}
   */
  const node_tag = (
    <Tab eventKey="tags" title={t('Noeud.tags_node.tags')}
      disabled={/*node.colorParameter !== 'groupTag'*/false} >
      <Form.Group as={Row} >
        <Col xs={2}>
          <FormLabel >{t('Tags.GE')}</FormLabel>
        </Col>
        <Col xs={6}>
          <Form.Select
            onChange={
              (evt: React.ChangeEvent<HTMLSelectElement>) => set_tags_group_key(evt.target.value)

            }
          >
            {Object.entries(nodeTags).map(
              (tags_group, i) =>
                <option
                  key={i}
                  value={tags_group[0]}
                  selected={tags_group_key === tags_group[0]} >
                  {tags_group[1].group_name}
                </option>)}
          </Form.Select>
        </Col>
      </Form.Group>
      <Table striped bordered hover className='node_tags_affiliation' >
        <thead>
          <tr>
            <th>{t('Noeud.Nom')}</th>
            <th>{t('Noeud.tags_node.Appartenance')}</th>
          </tr>
        </thead>
        <tbody>
          {tags_visible && tags_group_key != '' && Object.keys(nodeTags).includes(tags_group_key) ? Object.entries(nodeTags[tags_group_key].tags).map(
            tags => {
              const verif = tags[0]
              let allChecked = true
              multi_selected_nodes.current.map((d) => {
                allChecked = (tags_group_key in d.tags && d.tags[tags_group_key].includes(verif)) ? allChecked : false
              })
              return (
                <tr key={tags[0]}>
                  <td><FormLabel>{tags[1].name}</FormLabel></td>
                  <td>
                    <FormCheck
                      name={'element_visible' + tags[0]}
                      checked={allChecked}
                      id={tags[0]}
                      type='checkbox'
                      onChange={
                        (evt: React.ChangeEvent) => {
                          const new_nb_element = evt.target as HTMLInputElement
                          const tag_key = new_nb_element.id
                          const visible = new_nb_element.checked
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                            if (visible) {
                              if (!d.tags[tags_group_key]) {
                                d.tags[tags_group_key] = []
                              }
                              d.tags[tags_group_key].push(tag_key)
                            } else {
                              d.tags[tags_group_key].splice(d.tags[tags_group_key].indexOf(tag_key))
                            }
                          })
                          set_data({ ...data })
                        }
                      } />
                  </td>
                </tr>
              )
            }) : (<></>)}
        </tbody>
      </Table>
    </Tab >)

  return (<>
    <Row >
      <Col xs={1}>
        <Button size="sm" onClick={() => {
          set_style_to_apply('default')
          add_new_node(data,set_data,multi_selected_nodes)
          style_to_apply = 'default'
          apply_style_to_nodes()
        }}><FaPlus /></Button>
      </Col>

      <Col xs={10}>
        {dropdownMultiNode()}
      </Col>

      <Col xs={1}>
        <Button
          size="sm"
          variant='danger'
          disabled={multi_selected_nodes.current.length == 0}
          onClick={
            () => {
              //Boutton pour supprimer le noeud selectionné
              multi_selected_nodes.current.map(d => delete_node(data, d))
              selected_node.current = default_node(data)
              multi_selected_nodes.current = []
              // Object.values(data.nodes).forEach( n => 
              //   d3.select(' .opensankey #' + n.idNode).attr('stroke-width',0)
              // )
              // setForceUpdate(!forceUpdate)
              set_data({ ...data })
            }
          }
        ><FaMinus /></Button>

      </Col>
    </Row>

    <Row >
      <Col xs={1}>
        <FormLabel>Style:</FormLabel>
      </Col>

      <Col xs={6}>
        <Dropdown>
          <Dropdown.Toggle variant="success" id="dropdown-basic">{style_of_selected_nodes()}</Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => {
              set_style_to_apply('')
              multi_selected_nodes.current.map(n => {
                n.style = ''
              })
              set_data({ ...data })
            }}>{'Aucun'}</Dropdown.Item>
            {Object.keys(data.style_node).map((d,i) => {
              return (<Dropdown.Item 
                key={i}
                onClick={() => {
                  set_style_to_apply(d)
                  multi_selected_nodes.current.map(n => {
                    n.style = d
                  })
                  set_data({ ...data })
                }}
              >{data.style_node[d].name}</Dropdown.Item>)
            })}
          </Dropdown.Menu>
        </Dropdown>
      </Col>
      <Col xs={5}>
        <Button
          size="sm"
          variant='info'

          onClick={
            () => {
              apply_style_to_nodes()
            }
          }
        >{t('Flux.as')}</Button>
      </Col>
    </Row>
    <Form.Group as={Row} >
      <Col xs={1} >
        <FormLabel >Nom</FormLabel>
      </Col>
      <Col xs={10} >

        <FormControl
          value={
            (multi_selected_nodes.current.length != 1) ? '' : multi_selected_nodes.current[0].name
          }
          onChange={evt => {
            if (multi_selected_nodes.current.length != 1) {
              return
            }
            multi_selected_nodes.current[0].name = evt.target.value
            const d = multi_selected_nodes.current[0]
            d3.select(' .opensankey #' + d.idNode + '_text').text(evt.target.value)            
            const wrap = textwrap()
              .bounds({ height: 100, width: (d.display_style.label_box_width != 0) ? d.display_style.label_box_width : 110 })
              .method('tspans')
            d3.select(' .opensankey #ggg_' + d.idNode + ' text')
              .call(wrap)
            if (!d.x_label || data.show_structure === 'structure') {
              d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
                const width = +d3.select(' .opensankey #' + d.idNode).attr('width')

                if (d.display_style.label_horiz == 'middle') {
                  return width / 2
                } else if (d.display_style.label_horiz == 'right') {
                  return d.display_style.label_vert == 'middle' ? width : 0
                } else {
                  return 0
                }
              })
            }
            d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
              const width = +d3.select(' .opensankey #' + d.idNode).attr('width')
              if (d.x_label) {
                return d.x_label
              } else if (d.display_style.label_horiz == 'middle') {
                return width / 2
              } else if (d.display_style.label_horiz == 'right') {
                return width
              } else {
                return 0
              }
            })
            setForceUpdate(!forceUpdate)
          }}
          disabled={(multi_selected_nodes.current.length == 1) ? false : true} />
      </Col>
      <Col xs={3}>
      </Col>
    </Form.Group>
    <Row>
      <Col sm={12}>
        <Tabs defaultActiveKey="nodes_desc" id="node_attributes">

          {(multi_selected_nodes.current.length !== 0) ? (
            <Tab eventKey="nodes_desc" title={t('Noeud.apparence.apparence')}
              disabled={/*!(node.colorParameter == 'local')*/false}>
              <Form >
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.apparence.Visibilité')}</FormLabel>
                  </Col>
                  <Col xs={1}>
                    <FormCheck inline
                      type='switch'
                      checked={isAllNodeVisible()}
                      onChange={evt => {
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.shape_visible = evt.target.checked)
                        set_data({ ...data })
                      }}
                    />
                  </Col>

                </Form.Group>
                <Form.Group as={Row}>
                  <Col xs={7}>
                    <FormLabel>{t('Noeud.apparence.HideAlone')}</FormLabel>
                  </Col>
                  <Col xs={1}>
                    <Form.Check
                      inline
                      type='switch'
                      checked={isAllHideIfAlone()}
                      onChange={evt => {
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.hide_lone_node = evt.target.checked)
                        set_data({ ...data })
                      }}
                    />  
                  </Col>
                </Form.Group>
                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel style={{color:(isAllNodeVisible())?'#555555':'#DADADA'}}>{t('Noeud.apparence.Couleur')}</FormLabel>
                  </Col>
                  <Col xs={3}>
                    <Form.Control
                      type='color'
                      disabled={radio_selected !== 'local' || !isAllNodeVisible()}
                      value={(multi_selected_nodes.current.length == 1) ? multi_selected_nodes.current[0].color : '#ffffff'}
                      onChange={evt => {
                        const color = evt.target.value
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.color = color)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel style={{color:(isAllNodeVisible())?'#555555':'#DADADA'}}>{t('Noeud.apparence.CouleurPérenne')}</FormLabel>
                  </Col>
                  <Col xs={3}>
                    <Form.Check
                      type='checkbox'
                      //Si la valeur est a true alors la couleur des noeuds reste celle sélectionné loreque que l'on affiche les flux celon leur étiquettes
                      checked={isAllNodeColorSustainable()}
                      onChange={evt => {
                        const checked = evt.target.checked
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.colorSustainable= checked)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel style={{color:(isAllNodeVisible())?'#555555':'#DADADA'}}>{t('Noeud.apparence.Forme')}</FormLabel>
                  </Col>
                  <Col xs={2}>
                    <FormCheck
                      value="ellipse"
                      type='radio'
                      label={t('Noeud.apparence.Cercle')}
                      disabled={!isAllNodeVisible()}
                      checked={isAllNodeCircle()}
                      onChange={evt => {
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.shape = evt.target.value)
                        set_data({ ...data })
                      }}
                    />
                  </Col>

                  <Col xs={2}>
                    <FormCheck
                      value="rect"
                      type='radio'
                      label={t('Noeud.apparence.Rectangle')}
                      disabled={!isAllNodeVisible()}
                      checked={isAllNodeRect()}
                      onChange={evt => {
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.shape = evt.target.value)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
              </Form>
              <Form >
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel style={{color:(isAllNodeVisible())?'#555555':'#DADADA'}} >{t('Noeud.apparence.TML')}</FormLabel>
                  </Col>
                  <Col>
                    <FormControl
                      min={0} max={100}
                      type={'number'}
                      value={displayedValueNodeWidth()}
                      disabled={!isAllNodeVisible()}
                      onChange={
                        evt => {
                          multi_selected_nodes.current.map(d => d.node_width = +evt.target.value)
                          //set_multi_selected_nodes(multi_selected_nodes)
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.node_width = +evt.target.value)
                          set_data({ ...data })
                        }
                      } />
                  </Col>
                  <Col style={{color:(isAllNodeVisible())?'#555555':'#DADADA'}}>px</Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel style={{color:(isAllNodeVisible())?'#555555':'#DADADA'}} >{t('Noeud.apparence.TMH')}</FormLabel>
                  </Col>
                  <Col>
                    <FormControl
                      min={0} max={100}
                      type={'number'}
                      value={displayedValueNodeHeight()}
                      disabled={!isAllNodeVisible()}
                      onChange={
                        evt => {
                          //set_multi_selected_nodes(multi_selected_nodes)
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.node_height = +evt.target.value)
                          set_data({ ...data })
                        }
                      } />
                  </Col>
                  <Col style={{color:(isAllNodeVisible())?'#555555':'#DADADA'}}>px</Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.apparence.toScale')}</FormLabel>
                  </Col>
                  <Col xs={1}>
                    <FormCheck inline
                      type='switch'
                      checked={isAllNodeToScale()}
                      onChange={evt => {
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.not_to_scale = evt.target.checked)
                        set_data({ ...data })
                      }}
                    />
                  </Col>

                </Form.Group>
                <Col xs={5}>
                  <FormLabel style={{color:(isAllNodeVisible())?'#555555':'#DADADA'}}>{t('Noeud.apparence.Orientation')}</FormLabel>
                </Col>
                <Form.Group as={Row} >
                  
                  <Col xs={3}>
                    <FormCheck
                      value="left"
                      type='radio'
                      label={t('Noeud.apparence.toScaleLeft')}
                      disabled={!isAllNodeToScale()}
                      checked={isAllNodeNotToScaleOrientation('left')}
                      onChange={evt => {
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.not_to_scale_direction = evt.target.value)
                        set_data({ ...data })
                      }}
                    />
                  </Col>

                  <Col xs={3}>
                    <FormCheck
                      value="right"
                      type='radio'
                      label={t('Noeud.apparence.toScaleRight')}
                      disabled={!isAllNodeToScale()}
                      checked={isAllNodeNotToScaleOrientation('right')}
                      onChange={evt => {
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.not_to_scale_direction = evt.target.value)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col xs={3}>
                    <FormCheck
                      value="top"
                      type='radio'
                      label={t('Noeud.apparence.toScaleTop')}
                      disabled={!isAllNodeToScale()}
                      checked={isAllNodeNotToScaleOrientation('top')}
                      onChange={evt => {
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.not_to_scale_direction = evt.target.value)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col xs={3}>
                    <FormCheck
                      value="bottom"
                      type='radio'
                      label={t('Noeud.apparence.toScaleBottom')}
                      disabled={!isAllNodeToScale()}
                      checked={isAllNodeNotToScaleOrientation('bottom')}
                      onChange={evt => {
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.not_to_scale_direction = evt.target.value)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>

              </Form>
            </Tab>) : (<></>)}
          {(multi_selected_nodes.current.length !== 0) ? (
            <Tab eventKey="label_desc" title={t('Noeud.labels.labels')}>
              <Form>



                <Form.Group as={Row} >
                  <Col xs={4}>{t('Noeud.labels.vdb')}</Col>
                  <Col xs={1}>
                    <FormCheck inline
                      type='switch'
                      checked={isAllLabelVisible()}
                      onChange={evt => {

                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.label_visible = evt.target.checked)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>{t('Noeud.labels.lb')}</Col>
                  <Col xs={1}>
                    <FormCheck inline
                      type='switch'
                      checked={isAllLabelWhite()}
                      onChange={evt => {

                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.display_style.label_color = evt.target.checked)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel style={{color:(isAllLabelVisible())?'#555555':'#DADADA'}} >{t('Noeud.labels.pv')}</FormLabel>
                  </Col>
                  <Col>
                    <FormCheck disabled={!isAllLabelVisible()}
                      type='radio'
                      label={t('Noeud.labels.haut')}
                      checked={isAllNodeLabelVert('vert', 'top')}
                      onChange={
                        () => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                            d.display_style.label_vert = 'top'
                            delete d.x_label
                            delete d.y_label
                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck disabled={!isAllLabelVisible()}
                      type='radio'
                      label={t('Noeud.labels.Milieu')}
                      checked={isAllNodeLabelVert('vert', 'middle')}
                      onChange={
                        () => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                            d.display_style.label_vert = 'middle'
                            delete d.x_label
                            delete d.y_label
                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck disabled={!isAllLabelVisible()}
                      type='radio'
                      label={t('Noeud.labels.Bas')}

                      checked={isAllNodeLabelVert('vert', 'bottom')}
                      onChange={
                        () => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                            d.display_style.label_vert = 'bottom'
                            delete d.x_label
                            delete d.y_label
                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel style={{color:(isAllLabelVisible())?'#555555':'#DADADA'}} >{t('Noeud.labels.ph')}</FormLabel>
                  </Col>
                  <Col>
                    <FormCheck disabled={!isAllLabelVisible()}
                      type='radio'
                      label={t('Noeud.labels.gauche')}
                      checked={isAllNodeLabelVert('horiz', 'left')}
                      onChange={
                        () => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                            d.display_style.label_horiz = 'left'
                            delete d.x_label
                            delete d.y_label
                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck disabled={!isAllLabelVisible()}
                      type='radio'
                      label={t('Noeud.labels.Milieu')}
                      checked={isAllNodeLabelVert('horiz', 'middle')}
                      onChange={
                        () => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                            d.display_style.label_horiz = 'middle'
                            delete d.x_label
                            delete d.y_label
                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck disabled={!isAllLabelVisible()}
                      type='radio'
                      label={t('Noeud.labels.droite')}
                      checked={isAllNodeLabelVert('horiz', 'right')}
                      onChange={
                        () => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                            d.display_style.label_horiz = 'right'
                            delete d.x_label
                            delete d.y_label
                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Form.Group>

                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel style={{color:(isAllLabelVisible())?'#555555':'#DADADA'}} >{t('Noeud.labels.tp')}</FormLabel>
                  </Col>
                  <Col xs={5}>
                    <FormControl
                      min={11}
                      type={'number'}
                      disabled={!isAllLabelVisible()}
                      value={allNodeLabelFontSize()}
                      onChange={evt => {
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.display_style.font_size = +evt.target.value)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col style={{color:(isAllLabelVisible())?'#555555':'#DADADA'}}>px</Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={3}>
                    <FormLabel style={{color:(isAllLabelVisible())?'#555555':'#DADADA'}} >{t('Noeud.labels.police')}</FormLabel>
                  </Col>
                  <Col>
                    <FormCheck
                      type='checkbox'
                      label={t('Noeud.labels.gras')}
                      checked={isAllNodeBold()}
                      disabled={!isAllLabelVisible()}
                      onChange={
                        evt => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.display_style.bold = evt.target.checked)
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='checkbox'
                      label={t('Noeud.labels.maj')}
                      disabled={!isAllLabelVisible()}
                      checked={isAllNodeUpper()}
                      onChange={
                        evt => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.display_style.uppercase = evt.target.checked)
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='checkbox'
                      label={t('Noeud.labels.ita')}
                      checked={isAllNodeItalic()}
                      disabled={!isAllLabelVisible()}
                      onChange={
                        evt => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.display_style.italic = evt.target.checked)
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel style={{color:(isAllLabelVisible())?'#555555':'#DADADA'}}>
                    Coupure des labels
                    </FormLabel>
                  </Col>
                  <Col xs={5}>
                    <FormControl
                      value={valueAllNodeLabelBox()}
                      type={'number'}
                      disabled={!isAllLabelVisible()}
                      placeholder={'110'}
                      min={0}
                      max={500}
                      onChange={evt => {
                        if (!isNaN(+evt.target.value)) {
                          const val = (+evt.target.value < 0) ? 0 : +evt.target.value
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.display_style.label_box_width = val)
                          set_data({ ...data })
                        }

                      }}
                    />
                  </Col>
                  <Col style={{color:(isAllLabelVisible())?'#555555':'#DADADA'}}>px</Col>
                </Form.Group>


                <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }} ></hr>
                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.labels.vdv')} </FormLabel>
                  </Col>
                  <Col xs={1}>
                    <FormCheck inline
                      type='switch'
                      checked={isAllNodeTotal()}
                      onChange={evt => {
                      // node.shape_visible = evt.target.checked
                      // node.node_visible = node.label_visible || node.shape_visible
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.show_value = evt.target.checked)
                        set_data({ ...data })
                      }}
                    />
                  </Col>

                </Form.Group>

                <Form.Group as={Row} >
                  <Col xs={4}>
                    <FormLabel style={{color:(isAllNodeTotal())?'#555555':'#DADADA'}} >{t('Noeud.labels.pv')}</FormLabel>
                  </Col>
                  <Col>
                    <FormCheck
                      disabled={!isAllNodeTotal()}
                      type='radio'
                      label={t('Noeud.labels.haut')}
                      checked={isAllNodeLabelValueVert('vert', 'top')}
                      onChange={
                        () => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                            d.display_style.label_vert_valeur = 'top'
                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      disabled={!isAllNodeTotal()}
                      type='radio'
                      label={t('Noeud.labels.Milieu')}
                      checked={isAllNodeLabelValueVert('vert', 'middle')}
                      onChange={
                        () => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                            d.display_style.label_vert_valeur = 'middle'

                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck
                      type='radio'
                      label={t('Noeud.labels.Bas')}
                      disabled={!isAllNodeTotal()}
                      checked={isAllNodeLabelValueVert('vert', 'bottom')}
                      onChange={
                        () => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                            d.display_style.label_vert_valeur = 'bottom'

                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel style={{color:(isAllNodeTotal())?'#555555':'#DADADA'}} >{t('Noeud.labels.ph')}</FormLabel>
                  </Col>
                  <Col>
                    <FormCheck disabled={!isAllNodeTotal()}
                      type='radio'
                      label={t('Noeud.labels.gauche')}
                      checked={isAllNodeLabelValueVert('horiz', 'left')}
                      onChange={
                        () => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                            d.display_style.label_horiz_valeur = 'left'

                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck disabled={!isAllNodeTotal()}
                      type='radio'
                      label={t('Noeud.labels.Milieu')}
                      checked={isAllNodeLabelValueVert('horiz', 'middle')}
                      onChange={
                        () => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                            d.display_style.label_horiz_valeur = 'middle'

                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                  <Col>
                    <FormCheck disabled={!isAllNodeTotal()}
                      type='radio'
                      label={t('Noeud.labels.droite')}
                      checked={isAllNodeLabelValueVert('horiz', 'right')}
                      onChange={
                        () => {
                          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                            d.display_style.label_horiz_valeur = 'right'
                            delete d.x_label
                            delete d.y_label
                          })
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={4}>

                    <FormLabel style={{color:(isAllNodeTotal())?'#555555':'#DADADA'}} >{t('Noeud.labels.tp')}
                    </FormLabel>
                  </Col>
                  <Col xs={5}>
                    <FormControl
                      min={11}
                      type={'number'}
                      disabled={!isAllNodeTotal()}
                      value={allNodeValueFontSize()}
                      onChange={evt => {
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.display_style.value_font_size = +evt.target.value)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col style={{color:(isAllNodeTotal())?'#555555':'#DADADA'}}>px</Col>
                </Form.Group>
              </Form>
            </Tab>) : (<></>)}
          {(multi_selected_nodes.current.length !== 0) ? (
            <Tab eventKey="node_icon" title={t('Noeud.icon.icon')}>
              <Form >
                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel >{t('Noeud.apparence.Visibilité')}</FormLabel>
                  </Col>
                  <Col xs={5}>
                    <FormCheck inline
                      type='switch'
                      checked={isAllIconVisible()}
                      onChange={evt => {

                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.iconVisible = evt.target.checked)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>


                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel style={{color:(isAllIconVisible())?'#555555':'#DADADA'}}>{t('Noeud.icon.si')}</FormLabel>
                  </Col>
                  <Col xs={5}>
                    <Form.Select
                      disabled={!isAllIconVisible()}
                      onChange={(evt : React.ChangeEvent<HTMLSelectElement>) => {
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                          d.iconName = evt.target.value
                        })
                        set_data({ ...data })
                      }}
                    >
                      <option key={0} value={'none'} selected={isAllIconSame('none')}>{t('Noeud.icon.Aucun')}</option>

                      {Object.keys(data.icon_catalog).map((n, i) => {
                        return <option key={i + 1} value={n} selected={isAllIconSame(n)}>{n}</option>
                      })}
                    </Form.Select>
                  </Col>
                </Form.Group>
                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel style={{color:(isAllIconVisible())?'#555555':'#DADADA'}} >{t('Noeud.apparence.Couleur')}</FormLabel>
                  </Col>
                  <Col xs={3}>
                    <Form.Control
                      type='color'
                      disabled={radio_selected !== 'local' || !isAllIconVisible()}
                      value={(multi_selected_nodes.current.length == 1) ? multi_selected_nodes.current[0].iconColor : '#ffffff'}
                      onChange={evt => {
                        const color = evt.target.value
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.iconColor = color)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                </Form.Group>
                <Form.Group as={Row}>
                  <Col xs={4}>
                    <FormLabel style={{color:(isAllIconVisible())?'#555555':'#DADADA'}} >{t('Noeud.icon.rIN')}</FormLabel>
                  </Col>
                  <Col xs={3}>
                    <Form.Control
                      type='number'
                      disabled={radio_selected !== 'local' || !isAllIconVisible()}
                      value={valueAllIconRatio()}
                      onChange={evt => {
                        let ratio = +evt.target.value
                        ratio = (ratio > 100) ? 100 : ratio
                        ratio = (ratio < 0) ? 0 : ratio
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => d.iconRatio = ratio)
                        set_data({ ...data })
                      }}
                    />
                  </Col>
                  <Col xs={4}>
                    <FormLabel style={{color:(isAllIconVisible())?'#555555':'#DADADA'}} >%</FormLabel>
                  </Col>
                </Form.Group>
              </Form>
            </Tab>) : (<></>)}
          {Object.keys(nodeTags).length > 0 && multi_selected_nodes.current.length !== 0 && data.accordeonToShow.includes('EN') ? node_tag : (<></>)}
          {(multi_selected_nodes.current.length !== 0) ? (
            <Tab eventKey="node_tooltip" title={t('Noeud.IB')}>
              <Form >
                <Row>
                  <FormLabel column sm={1}>{t('Noeud.IB')}:</FormLabel>
                  <Col sm={11}>
                    <Form.Control
                      as="textarea"
                      rows={10}
                      value={multi_selected_nodes.current.length>0 && multi_selected_nodes.current[0].tooltip_text ? multi_selected_nodes.current[0].tooltip_text : ''}
                      onChange={
                        (evt) => {
                          multi_selected_nodes.current.map(node => node.tooltip_text = evt.target.value)
                          set_data({ ...data })
                        }
                      }
                    />
                  </Col>
                </Row>
              </Form>
            </Tab>): (<></>)}

          {(multi_selected_nodes.current.length !== 0 && Object.values(nodeTags).filter(tag=>tag.banner == 'level').length > 0) ? (
            <Tab eventKey="agregation" title={t('Noeud.agre.Agré')}>
              <Form >
                <Form.Group as={Row} >
                  <FormLabel column>{t('Noeud.agre.DC')}</FormLabel>
                  <Col><Form.Select placeholder='all' value={cube_dimension} onChange={(evt:React.ChangeEvent<HTMLSelectElement>)=>set_cube_dimension(evt.target.value)} >
                    {Object.entries(nodeTags).filter(tag=>tag[1].banner == 'level').map((tag,i) => {
                      return (<option key={i} value={tag[0]}>{tag[1].group_name}</option>)
                    })}
                  </Form.Select></Col>
                </Form.Group>
                <Form.Group as={Row} >
                  <Col xs={2} >
                    <FormCheck
                      disabled={multi_selected_nodes.current.length == 0}
                      type='checkbox'
                      label={t('Noeud.agre.Parent')}
                      checked={multi_selected_nodes.current.length != 0 && parent_visible}
                      onChange={
                        evt => set_parent_visible(evt.target.checked)
                      }
                    />
                  </Col>
                  { parent_visible ? (
                    <Col xs={10}>
                      <Form.Select 
                        onChange={(changeEvent: React.ChangeEvent<HTMLSelectElement>)=>{
                          if ( changeEvent.target.value == 'none' ) {
                            multi_selected_nodes.current.forEach(n=> {
                              if (!(cube_dimension in n.dimensions)) {
                                n.dimensions[cube_dimension] = {}
                              }
                              n.dimensions[cube_dimension].parent_name = undefined

                            })
                          } else {
                            multi_selected_nodes.current.forEach(n=> {

                              if (!(cube_dimension in n.dimensions)) {
                                n.dimensions[cube_dimension] = {}
                              }
                              n.dimensions[cube_dimension].parent_name = changeEvent.target.value
                            })
                          }
                        }}>
                        <option key={0} value='none' selected={multi_selected_nodes.current.length != 0 && cube_dimension in multi_selected_nodes.current[0].dimensions && multi_selected_nodes.current[0].dimensions[cube_dimension].parent_name === undefined} >Pas de parent</option>
                        {
                          Object.values(data.nodes).map((n, i) => <option key={i+1} value={n.idNode} selected={ multi_selected_nodes.current.length != 0 && cube_dimension in  multi_selected_nodes.current[0].dimensions && multi_selected_nodes.current[0].dimensions[cube_dimension].parent_name === n.idNode} >{n.name}</option>)
                        }
                      </Form.Select>
                    </Col>) : (<></>) }
                </Form.Group>
                <Col xs={4}>
                  <Button
                    size="sm"
                    style={{ 'marginBottom': '3px', 'marginRight': '3px' }}
                    onClick={
                      () => {
                        const listId: number[] = []
                        Object.keys(data.links).forEach(elt => listId.push(Number(elt.replace('link', ''))))
                        let idLink = listId.length > 0 ? Math.max(...listId) + 1 : 0
                        Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                          const child_nodes = Object.values(data.nodes).filter(n=>n.dimensions['Primaire'].parent_name === d.idNode)
                          const new_input_nodes : string[] = []
                          child_nodes.forEach(n1=> {
                            const input_links = n1.inputLinksId.filter(idLink => new_input_nodes.includes(data.links[idLink].idSource) === false)
                            input_links.forEach( idLink => new_input_nodes.push(data.links[idLink].idSource))
                          })
                          const new_output_nodes : string[] = []
                          child_nodes.forEach(n1=> {
                            const output_links = n1.outputLinksId.filter(idLink => new_output_nodes.includes(data.links[idLink].idSource) === false)
                            output_links.forEach( idLink => new_output_nodes.push(data.links[idLink].idTarget))
                          })
                          new_input_nodes.forEach(idSource => {
                            const new_link = default_link(data)
                            new_link.idSource = idSource
                            new_link.idTarget = d.idNode
                            new_link.idLink = 'link' + idLink
                            data.links[new_link.idLink] = new_link
                            idLink = idLink+1
                            reorganize_node_outputLinksId(data.nodes[new_link.idSource], display_nodes, display_links)
                          })
                          new_output_nodes.forEach(() => {
                            const new_link = default_link(data)
                            new_link.idSource = d.idNode
                            new_link.idLink = 'link' + idLink
                            data.links[new_link.idLink] = new_link
                            idLink = idLink+1
                            reorganize_node_inputLinksId(data.nodes[new_link.idTarget], display_nodes, display_links)
                          })
                          reorganize_node_inputLinksId(d, display_nodes, display_links)
                          reorganize_node_outputLinksId(d, display_nodes, display_links)

                          set_data({ ...data })
                        })
                      }
                    }
                  >{t('Noeud.agre.CLE')}</Button>
                </Col>
              </Form>
            </Tab>
          ): (<></>)}
          {(multi_selected_nodes.current.length == 1) ? (
            
            <Tab eventKey="node_link_io" title={t('Noeud.PF.PF')}>
              <Form>
                <Form.Group as={Row}>
                  <Col xs={6}>
                    <FormLabel >{t('Noeud.PF.FES')}</FormLabel>
                  </Col>
                  <Col xs={3}>
                    <FormCheck
                      value="output"
                      type='radio'
                      label={t('Noeud.PF.sort')}
                      checked={link_io=='output'}
                      onChange={() => {
                        set_link_io('output')
                        set_link_pos('')
                      }}
                    />
                  </Col>
                  <Col xs={3}>
                    <FormCheck
                      value="input"
                      type='radio'
                      label={t('Noeud.PF.ent')}
                      checked={link_io=='input'}
                      onChange={() => {
                        set_link_io('input')
                        set_link_pos('')
                      }}
                    />
                  </Col>

                </Form.Group>

                <Form.Group as={Row}>
                  <Col xs={2}>
                    <FormLabel >{t('Noeud.PF.FRN')}</FormLabel>
                  </Col>
                  <Col xs={2}>
                    <FormCheck
                      disabled={has_link_come_from(link_io,'left')}
                      value="left"
                      type='radio'
                      label={t('Noeud.labels.gauche')}
                      checked={link_pos=='left'}
                      onChange={() => {
                        set_link_pos('left')
                      }}
                    />
                  </Col>
                  <Col xs={2}>
                    <FormCheck
                      disabled={has_link_come_from(link_io,'right')}
                      value="right"
                      type='radio'
                      label={t('Noeud.labels.droite')}
                      checked={link_pos=='right'}
                      onChange={() => {
                        set_link_pos('right')
                      }}
                    />
                  </Col>
                  <Col xs={3}>
                    <FormCheck
                      disabled={has_link_come_from(link_io,'top')}
                      value="top"
                      type='radio'
                      label={t('Noeud.PF.ades')}
                      checked={link_pos=='top'}
                      onChange={() => {
                        set_link_pos('top')
                      }}
                    />
                  </Col>
                  <Col xs={3}>
                    <FormCheck
                      disabled={has_link_come_from(link_io,'bottom')}
                      value="bottom"
                      type='radio'
                      label={t('Noeud.PF.edes')}
                      checked={link_pos=='bottom'}
                      onChange={() => {
                        set_link_pos('bottom')
                      }}
                    />
                  </Col>
                  

                </Form.Group>
                <Form.Group as={Row}>
                  <Col xs={8}>
                    <FormLabel >{t('Noeud.PF.lti')}</FormLabel>
                  </Col>
                  
                  <Col xs={3}>
                    <FormCheck
                      value="bottom"
                      type='checkbox'
                      label={t('Noeud.PF.col')}
                      checked={tab_colored}
                      onChange={() => {
                        console.log(tab_colored)
                        set_tab_colored(!tab_colored)
                      }}
                    />
                  </Col>
                  

                </Form.Group>
              </Form>
              {tab_pos_link(link_pos,link_io)}
            </Tab>) : (<></>)}


          {children} 
        </Tabs>
        {(multi_selected_nodes.current.length !== 0) ? (
          <ButtonGroup as={Row}>
            <Col>
              <Button
                size="sm"
                style={{ 'marginBottom': '3px', 'marginRight': '3px' }}
                onClick={
                  () => {
                    Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                      reorganize_node_inputLinksId(d, display_nodes, display_links)
                      reorganize_node_outputLinksId(d, display_nodes, display_links)
                    })
                    set_data({ ...data })
                  }
                }
              >Réorganiser flux entrants/sortants</Button>
            </Col>
            <Col>
              <Button
                size="sm"
                style={{ 'marginBottom': '3px', 'marginRight': '3px' }}
                onClick={
                  () => {
                    multi_selected_links.current = []
                    Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                      multi_selected_links.current = multi_selected_links.current.concat(Object.values(data.links).filter(l=>  d.outputLinksId.includes(l.idLink)))
                    })
                    multi_selected_links.current.forEach(l=>d3.selectAll(' .opensankey #gg_' + l.idLink + ' rect').attr('fill-opacity', '1'))
                  }
                }
              >Sélectionner tous les liens sortants</Button>
            </Col>
            <Col>
              <Button
                size="sm"
                style={{ 'marginBottom': '3px', 'marginRight': '3px' }}
                onClick={
                  () => {
                    multi_selected_links.current = []
                    Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
                      multi_selected_links.current = multi_selected_links.current.concat(Object.values(data.links).filter(l=>  d.inputLinksId.includes(l.idLink)))
                    })
                    multi_selected_links.current.forEach(l=>d3.selectAll(' .opensankey #gg_' + l.idLink + ' rect').attr('fill-opacity', '1'))
                  }
                }
              >Sélectionner tous les liens entrants</Button>
            </Col>
          </ButtonGroup>) : (<></>)}
      </Col>
    </Row ></>
  )
}

SankeyNodeEdition.propTypes = SankeyNodeEditionPropTypes

export default SankeyNodeEdition