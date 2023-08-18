import React, { FunctionComponent, useState } from 'react'
import { Tabs, Button, FormControl, FormLabel, OverlayTrigger, Tooltip, InputGroup} from 'react-bootstrap'
import PropTypes, { InferProps } from 'prop-types'
import { SankeyData, SankeyDataPropTypes,  SankeyNode, SankeyNodePropTypes,SankeyLinkValue,SankeyLink } from './types'
import { default_node,delete_node,return_value_node} from './SankeyUtils'
import * as d3 from 'd3'
import { FaPlus, FaMinus, FaEye} from 'react-icons/fa'
import { MultiSelect } from 'react-multi-select-component'
import { selected_type } from './SankeyMenu'
import { SankeyMenuConfigurationNodesIO } from './SankeyMenuConfigurationNodesIO'
import {SankeyMenuConfigurationNodesAttributes} from './SankeyMenuConfigurationNodesAttributes'
import {SankeyMenuConfigurationNodesTags} from './SankeyMenuConfigurationNodesTags'
import {SankeyMenuConfigurationNodesTooltip} from './SankeyMenuConfigurationNodesTooltip'
import { textwrap } from 'd3-textwrap'
import { TFunction } from 'i18next'
import { node_visible_on_svg } from './SankeyDrawFunction'

const SankeyNodeEditionPropTypes = {
  t:PropTypes.func.isRequired,
  data: PropTypes.shape(SankeyDataPropTypes).isRequired,
  set_data: PropTypes.func.isRequired,
  multi_selected_nodes: PropTypes.shape({current:PropTypes.arrayOf(PropTypes.shape(SankeyNodePropTypes).isRequired).isRequired}).isRequired,
  // style_to_apply: PropTypes.string.isRequired,
  set_style_to_apply: PropTypes.func.isRequired,
  menu_configuration_nodes: PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,
  token:PropTypes.bool.isRequired,
}

type SankeyEditionTypes = InferProps<typeof SankeyNodeEditionPropTypes>

export const OpenSankeyMenuConfigurationNodes = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]},
  menu_configuration_nodes_attributes:JSX.Element[],
  link_io:string,set_link_io:React.Dispatch<React.SetStateAction<string>>,
  link_pos:string,set_link_pos:React.Dispatch<React.SetStateAction<string>>,
  tab_colored:boolean,set_tab_colored:React.Dispatch<React.SetStateAction<boolean>>,
  getLinkValue:(data: SankeyData, idLink: string, up?: boolean) => SankeyLinkValue,
  multi_selected_links: {current:SankeyLink[]},
  set_display_link_opacity:React.Dispatch<React.SetStateAction<string>>,
) => {
  const [tags_group_key, set_tags_group_key] = useState(Object.keys(data.nodeTags).length > 0 ? Object.keys(data.nodeTags)[0] : '')

  const ui : {[s:string] : JSX.Element}= {
    'Attributes'      : SankeyMenuConfigurationNodesAttributes(t,menu_configuration_nodes_attributes),
    'Tooltip'         : SankeyMenuConfigurationNodesTooltip(t,data,set_data,multi_selected_nodes),
  }

  if (Object.keys(data.nodeTags).length > 0 && data.accordeonToShow.includes('EN') ) {
    ui['Tags'] = SankeyMenuConfigurationNodesTags(t,data,set_data,multi_selected_nodes,tags_group_key,set_tags_group_key)
  }
  if (multi_selected_nodes.current.length == 1) {
    ui['Entrées Sorties'] = SankeyMenuConfigurationNodesIO(t,data,set_data,multi_selected_nodes,link_io,set_link_io,link_pos,set_link_pos,tab_colored,set_tab_colored,getLinkValue,multi_selected_links,set_display_link_opacity)
  }
  return ui
}

const SankeyNodeEdition: FunctionComponent<SankeyEditionTypes> = (
  {t,data, set_data, multi_selected_nodes,set_style_to_apply, menu_configuration_nodes,token }
) => {
  const [forceUpdate, setForceUpdate] = useState(false)
  const node_visible=node_visible_on_svg()
  const tmpNodes = Object.fromEntries(Object.entries(data.nodes).sort(([, a], [, b]) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)))
  const INITIAL_OPTIONS = Object.values(tmpNodes).filter(d=>(data.displayed_node_selector)?node_visible.includes(d.idNode):true).map((d) => { return { 'label': d.name, 'value': d.idNode } })

  const selected : selected_type[] = multi_selected_nodes.current.map((d) => { return { 'label': d.name, 'value': d.idNode } })

  //Renvoie le menu déroulant pour la sélection des noeuds
  const dropdownMultiNode = () => {
    const DD = (
      <div id='DD_multi_node' style={{width:'70%'}}>
        <MultiSelect
          valueRenderer={(selected: selected_type[]) => {
            return selected.length ? selected.map(({ label })=> label + ', ') : t('Noeud.NS')
          }}
          options={INITIAL_OPTIONS}
          value={selected}
          overrideStrings={{
            'selectAll': t('Noeud.TS'),
          }}
          onChange={(selected: [{ label: string, value: string }]) => {
            const new_sel = selected.map(d => d.value)
            const m_s = Object.values(data.nodes).filter(d => (new_sel.includes(d.idNode)))
            multi_selected_nodes.current = m_s
            Object.values(data.nodes).forEach( n =>
              d3.select(' .opensankey #shape_' + n.idNode).attr('stroke-width',0)
            )
            multi_selected_nodes.current.forEach( n =>
              d3.select(' .opensankey #shape_' + n.idNode).attr('stroke-width',2)
            )
            setForceUpdate(!forceUpdate)
            set_data({...data})
          }}
          labelledBy={'hello'}/>
      </div>)
    return DD
  }

  const add_new_node = () => {
    const { nodes } = data
    const node: SankeyNode = default_node(data)

    // Méthode pour incrementer idNode
    let idNode = Object.keys(data.nodes).length
    while (data.nodes['node'+idNode]) {
      idNode = idNode+1
    }
    node.idNode = 'node' + idNode
    node.name = node.idNode
    if (Object.keys(nodes).length < 5) {
      node.x = Object.keys(nodes).length * 200 + 200
    } else {
      node.x = 200
    }
    nodes[node.idNode] = node
    for (const tag_group_key in data.nodeTags) {
      node.tags[tag_group_key] = []
    }
    //WARNING : le set_multi_select ne semble pas changer les noeuds sélectionnés avant d'appliquer le style
    //set_multi_selected_nodes([node])
    multi_selected_nodes.current = [node]
    // style_to_apply = 'default'
    apply_style_to_nodes()
    set_data({...data})
  }

  const apply_style_to_nodes = () => {
    multi_selected_nodes.current.map(d => {
      // Delete local value so the used value come from the style
      delete d.local
    })
    set_data({ ...data })
  }



  return (<>
    {
      (token==false && Object.keys(data.nodes).length>15)?
        <>
          <FormLabel style={{'color':'red'}}>{t('Menu.warningLimitNode')}</FormLabel>
        </>
        :
        <></>
    }

    <InputGroup>
      {/* Boutton pour ajouter un noeud */}
      <OverlayTrigger
        key={'menu.tooltips.noeud.1'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'menu.tooltips.noeud.1'}>{t('Menu.tooltips.noeud.plus')} </Tooltip>}>
        <Button
          style={{width:'10%'}}
          size="sm"
          variant='outline-primary'
          className='btn_menu_config'
          disabled={token==false && Object.keys(data.nodes).length>15}
          onClick={() => {
            set_style_to_apply('default')
            add_new_node()
            apply_style_to_nodes()
          }}>
          <FaPlus/>
        </Button>
      </OverlayTrigger>

      {/* Liste déroulante pour selectionner un noeud */}
      <OverlayTrigger
        key={'menu.tooltips.noeud.2'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'menu.tooltips.noeud.2'}>{t('Menu.tooltips.noeud.slct')} </Tooltip>}>
        {dropdownMultiNode()}
      </OverlayTrigger>

      {/* Boutton pour supprimer le noeud selectionné */}
      <OverlayTrigger
        key={'menu.tooltips.noeud.3'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'menu.tooltips.noeud.3'}>{t('Menu.tooltips.noeud.rm')} </Tooltip>}>
        <Button
          style={{width:'10%'}}
          size="sm"
          variant='outline-primary'
          className='btn_menu_config'
          disabled={multi_selected_nodes.current.length == 0}
          onClick={
            () => {
              multi_selected_nodes.current.map(d => delete_node(data, d))
              multi_selected_nodes.current = []
              // Object.values(data.nodes).forEach( n =>
              //   d3.select(' .opensankey #shape_' + n.idNode).attr('stroke-width',0)
              // )
              // setForceUpdate(!forceUpdate)
              set_data({ ...data })
            }}>
          <FaMinus />
        </Button>
      </OverlayTrigger>

      {/* Checkbox permettant d'afficher que les noeuds visibles dans le selecteur */}
      <OverlayTrigger
        key={'menu.tooltips.noeud.4'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'menu.tooltips.noeud.4'}>{t('Menu.tooltips.noeud.dns')} </Tooltip>}>
        <Button
          style={{width:'10%'}}
          size="sm"
          variant={data.displayed_node_selector?'primary':'outline-primary'}
          className='btn_menu_config'
          onClick={
            () => {
              data.displayed_node_selector=!data.displayed_node_selector
              set_data({...data})
            }}>
          <FaEye />
        </Button>
      </OverlayTrigger>
    </InputGroup>

    



    {/* Affichage du nom des noeuds selectionnés */}
    
    <InputGroup>
      <InputGroup.Text>{t('Noeud.Nom')}</InputGroup.Text>
      <OverlayTrigger
        key={'menu.tooltips.noeud.6'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'menu.tooltips.noeud.6'}>{t('Noeud.tooltips.Nom')} </Tooltip>}>
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
            d3.select(' .opensankey #text_' + d.idNode).text(evt.target.value)
            const wrap = textwrap()
              .bounds({ height: 100, width: (return_value_node(data,d,'label_box_width') as number != 0) ? return_value_node(data,d,'label_box_width') as number : 110 })
              .method('tspans')
            d3.select(' .opensankey #ggg_' + d.idNode + ' text')
              .call(wrap)
            if (!d.x_label || data.show_structure === 'structure') {
              d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
                const width = +d3.select(' .opensankey #shape_' + d.idNode).attr('width')
                if (return_value_node(data,d,'label_horiz') == 'middle') {
                  return width / 2
                } else if (return_value_node(data,d,'label_horiz') == 'right') {
                  return return_value_node(data,d,'label_vert') == 'middle' ? width : 0
                } else {
                  return 0
                }
              })
            }
            d3.selectAll(' .opensankey #ggg_' + d.idNode + ' text tspan').attr('dx', 0).attr('x', () => {
              const width = +d3.select(' .opensankey #shape_' + d.idNode).attr('width')
              if (d.x_label) {
                return d.x_label
              } else if (return_value_node(data,d,'label_horiz') == 'middle') {
                return width / 2
              } else if (return_value_node(data,d,'label_horiz') == 'right') {
                return width
              } else {
                return 0
              }
            })
            setForceUpdate(!forceUpdate)
          }}
          disabled={(multi_selected_nodes.current.length == 1) ? false : true} />
      </OverlayTrigger>
    </InputGroup>
    

    {/* Declenché si des neouds sont selectionnées */}
    {(multi_selected_nodes.current.length !== 0) ? (
      <>
      
        <Tabs defaultActiveKey="nodes_desc" id="node_attributes" fill={true}>
          {menu_configuration_nodes.map((c:JSX.Element)=>{
            return c})}
        </Tabs>

        
      </>) : (<></>)}</>
  )
}

SankeyNodeEdition.propTypes = SankeyNodeEditionPropTypes

export default SankeyNodeEdition