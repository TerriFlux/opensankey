import React, { FunctionComponent,useState } from 'react'
import { Col,Row} from 'react-bootstrap'
import PropTypes,{InferProps} from 'prop-types'
import SankeyEdition from './SankeyEdition'
import SankeyDraw from './SankeyDraw'
import { SankeyData, SankeyDataPropTypes } from './types'
import SankeyLinkEdition from './SankeyLinkEdition'
import SankeyNodeEdition from './SankeyNodeEdition'
import SankeySettingsEdition from './SankeySettingsEdition'
import SankeyLinkContextMenu from './SankeyLinkContextMenu'
import SankeyNodeContextMenu from './SankeyNodeContextMenu'
import Menu from './SankeyMenu'
import { isExport, normalize_name } from './SankeyUtils'
import * as SankeyUtils from './SankeyUtils'

const SankeyAppPropTypes = {
  sankey_data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  initial_subchain: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  initial_flux_types: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
}

type SankeyAppTypes = InferProps<typeof SankeyAppPropTypes>

const SankeyApp : FunctionComponent<SankeyAppTypes> = ({sankey_data,initial_subchain,initial_flux_types}) => {
  const [show_node,set_show_node] = useState(false)
  const [show_link,set_show_link] = useState(false)
  const [show_graphic_attributes,set_show_graphic_attributes] = useState(false)
  const [show_node_context,set_show_node_context] = useState(false)
  const [show_link_context,set_show_link_context] = useState(false)
  const [selected_link,set_selected_link] = useState(0)
  const [selected_node,set_selected_node] = useState(0)
  const [data,set_data] = useState<SankeyData>(sankey_data)
  const [subchain,set_subchain] =  useState(initial_subchain)
  const [flux_types] = useState(initial_flux_types)
  
  const nodeContextMenu = (i : number) => {
    set_selected_node(i)
    set_show_node_context(true)
  }
  
  const closeNodeContextMenu = () => {
    set_show_node_context(false)
  }
  
  const linkContextMenu = (i : number) => {
    set_selected_link(i)
    set_show_link_context(true)
  }
  
  const closeLinkContextMenu = () => {
    set_show_link_context(false)
  }
  
  const select_node = (i : number) => {
    set_selected_node(i)
    // set_show_graphic_attributes(false)
    // set_show_link(false)
    set_show_node(true)
  }
  
  const select_link = (i : number) => {
    set_selected_link(i)
    set_show_link(true)
  }

  const default_node = () => {
    return {
      id           : 0,
      name         : '',
      type         : 'sector',
      visible      : true,
      color        : 'darkgrey',
      x            : 100,
      y            : 100,
      input_links  : [],
      output_links : []
    }
  }

  const default_link = () => {
    return {
      source_name     : '',
      target_name     : '',
      value           : 10,
      display_value   : 'default',
      color           : 'darkgrey',
      curved          : false,
      arrow           : true,
      text_color : 'black',
      label_position  : 'middle',
      curvature       : 0.5,
      label_visible   : true,
      label_on_path   : true,
      orientation     : 'hh',
      visible         : true,
      data            : false,
      left_horiz_shift : 0,
      right_horiz_shift : 0,
      vert_shift : 0
    }
  }
  const set_current_filter = (
    new_current_filter: number
  ) => {
    const { display_style } = data
    display_style.filter = +new_current_filter
    set_data({...data})
  }

  const delete_node = (
    node_id : number
  ) => {
    
    const {nodes, links} = data
    const region_names = Object.keys(links)
    if (!region_names.includes(data.region_name)) {
      data.region_name = region_names[0]
    }
    // delete links originating from / going to the deleted node
    let i=0
    while (i < links[data.region_name].length) {
      if (links[data.region_name][i].source_name === nodes[node_id].name) {
        console.log('link'+i)
        console.log(1)
        delete_link(i)
        i -= 1
      }
      else if (links[data.region_name][i].target_name === nodes[node_id].name) {
        console.log('link'+i)
        console.log(2)
        delete_link(i)
        i -= 1
      }
      i += 1
    }

    // delete node and shift numerotation
    nodes.splice(node_id,1)
    nodes.forEach( (node,i) => node.id = i )

    // shift source and target of links and update links
    // region_names.forEach(region_name => {
    //   links[region_name].forEach(link =>{
    //     if (link.source > node_id) {
    //       link.source -= 1
    //     }
    //     if (link.target > node_id) {
    //       link.target -= 1
    //     }
    //   })
    // })
    set_data({...data})
  }

  const delete_link = (
    deleted_link_id : number
  ) => {
    
    const { links,nodes} = data
    const region_names = Object.keys(links)
    region_names.forEach(
      reg_name => links[reg_name].splice(deleted_link_id,1)
    )
    nodes.forEach(node => {
      for (let i = node.input_links.length - 1; i >= 0; i--) {
        const link_id = node.input_links[i]
        if (link_id === deleted_link_id) {
          node.input_links.splice(i,1)
        }
      }
      for (let i = node.output_links.length - 1; i >= 0; i--) {
        const link_id = node.output_links[i]
        if (link_id === deleted_link_id) {
          node.output_links.splice(i,1)
        }
      }
      node.input_links.forEach((link_id,i) => {
        if (link_id > deleted_link_id) {
          node.input_links[i] = link_id - 1
        }
      })
      node.output_links.forEach((link_id,i)=>{
        if (link_id > deleted_link_id) {
          node.output_links[i] = link_id - 1
        }
      })
    })
    set_data({...data})
  }

  const setSubChain = (new_subchain: string[]) => {  
    
    const {nodes, links} = sankey_data
    const region_names = Object.keys(links)

    // specific to filiere paille
    if ((new_subchain[0] === 'Usages' || 
        new_subchain[0] === 'Logistique' ||
        new_subchain[0] === 'Energie' ||
        new_subchain[0] === 'Autres') && sankey_data.old_user_scale === undefined
    ) {
      sankey_data.old_user_scale = sankey_data.user_scale
      sankey_data.user_scale = sankey_data.user_scale/4
      nodes.forEach((n)=>n.x -= 800)
    } else if (sankey_data.old_user_scale  && new_subchain.includes('Champs')) {
      sankey_data.old_user_scale = undefined
      sankey_data.user_scale = sankey_data.user_scale*4
      nodes.forEach((n)=>n.x += 800)      
    }

    // Use a relevant scale
    nodes.forEach( node => {
      if (!node.subchain) {
        return
      }
      const node_subchains = node.subchain.split(',')
      for (let i=0;i<node_subchains.length;i++) {
        if (!new_subchain.includes(node_subchains[i])) {
          node.visible = false
          node.label_visible = false
        } else {
          if (
            !node.name.includes('(I') && !isExport(node) && 
            !(node.input_links.length === 0 && node.output_links.length === 0)
          ) {
            node.visible = true
          }
          node.label_visible = true     
          break    
        }
      }
    })

    region_names.forEach(region_name =>{
      links[region_name].forEach((link)=>{
        const source_node = nodes.filter(n=>normalize_name(n.name)===normalize_name(link.source_name))[0]
        const target_node = nodes.filter(n=>normalize_name(n.name)===normalize_name(link.target_name))[0]
        if (source_node.visible  && target_node.visible ) {
          link.visible = true
        } else {
          link.visible = false          
        }
      })
    })
    localStorage.setItem('data',JSON.stringify(sankey_data))
    localStorage.setItem('subchain',JSON.stringify(subchain))
    set_data({...sankey_data})
    set_subchain(subchain)
  }

  return (
    <div style={{ 'backgroundColor' : 'WhiteSmoke' }}>
      <Menu data={data} set_data={set_data} delete_node={delete_node} />
      { !data.static_sankey ? (
        <Row>            
          <Col sm={11} style={{ 'color':'black'}} >
            <SankeyEdition 
              data={data} 
              set_selected_node={set_selected_node} 
              set_selected_link={set_selected_link} 
              set_show_link={set_show_link} 
              set_show_graphic_attributes={set_show_graphic_attributes} 
              default_link={default_link} 
              default_node={default_node} 
              set_data={set_data}/>
          </Col>
        </Row>
      ) : (<div/>)}
      <SankeyDraw 
        data={data}
        flux_types={flux_types}
        select_link={select_link}
        linkContextMenu={linkContextMenu}
        select_node={select_node}
        nodeContextMenu={nodeContextMenu}
        link_color ={l => l.color }
        node_color = {n => n.color }
        link_text = {SankeyUtils.link_text }
      />
      <SankeyNodeEdition 
        show={show_node}
        data={data}
        set_data={set_data}
        set_show_node={set_show_node}
        default_node={default_node}
        selected_node={selected_node}
      />
      <SankeyLinkEdition 
        show={show_link}
        data={data}
        set_data={set_data}
        set_show_link={set_show_link}
        default_link={default_link}
        selected_link={selected_link}
      />
      <SankeySettingsEdition 
        show={show_graphic_attributes}
        set_show_graphic_attributes={set_show_graphic_attributes}
        subchain={subchain}
        data={data}
        set_data={set_data}
        setSubChain={setSubChain} 
        set_current_filter={set_current_filter}
      />
      <SankeyNodeContextMenu 
        data={data} 
        show={show_node_context} 
        closeNodeContextMenu={closeNodeContextMenu} 
        selected_node={selected_node} 
        delete_node={delete_node} 
        delete_link={delete_link}
      />
      <SankeyLinkContextMenu 
        show={show_link_context} 
        delete_link={delete_link} 
        closeLinkContextMenu={closeLinkContextMenu} 
        selected_link={selected_link} />
    </div>
  )
}

SankeyApp.propTypes = SankeyAppPropTypes

export default SankeyApp