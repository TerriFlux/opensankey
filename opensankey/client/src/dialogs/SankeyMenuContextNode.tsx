import * as d3 from 'd3'
import React, { FunctionComponent, useState } from 'react'
import { Dropdown, ButtonGroup, Button, Popover } from 'react-bootstrap'
import { SelectVisualyLinks, nodeTransform } from '../draw/SankeyDrawFunction'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import {
  NodeContextHasAggregate, NodeContextHasDesaggregate, DeleteNode,
  ReturnValueLink,
  ReturnValueNode,
  AssignNodeLocalAttribute} from '../configmenus/SankeyUtils'
import { Aggregate, Desaggregate } from '../draw/SankeyDrawLayout'
import { reorganize_node_outputLinksId } from '../draw/SankeyDrawLayout'
import { reorganize_node_inputLinksId } from '../draw/SankeyDrawLayout'
import { ContextMenuNodeFType } from './types/SankeyMenuContextNodeTypes'
import { SankeyNode } from '../types/Types'
import { DeleteGLinks } from '../draw/SankeyDrawLinks'
import { DeleteGNodes } from '../draw/SankeyDrawNodes'
import { Placement } from 'react-bootstrap/esm/types'

const icon_open_modal=<FontAwesomeIcon style={{float:'right'}} icon={faUpRightFromSquare} />
const sep=<Button variant='light' disabled><hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></Button>

export const ContextMenuNode : FunctionComponent<ContextMenuNodeFType> = ({
  applicationContext,
  applicationData,
  applicationState,
  contextMenu,
  dict_hook_ref_setter_show_dialog_components,
  agregation,
  node_function,
  link_function,
  ComponentUpdater,
  additional_context_element_menu,
  additional_context_element_other
}) => {
  const [ contextualised_node, set_contextualised_node] = useState<SankeyNode>()
  contextMenu.ref_setter_contextualised_node.current=set_contextualised_node
  const [forceUpdate,setForceUpdate]=useState(false)
  const { t } = applicationContext
  const { data, set_data } = applicationData
  const { multi_selected_nodes,multi_selected_links } = applicationState
  const { pointer_pos } = contextMenu
  const {RedrawNodes}=node_function
  const {RedrawLinks} = link_function
  let style_c_n='0px 0px auto auto'
  let placement='end' as Placement
  let is_top=true
  let pos_x=pointer_pos.current[0]+10
  let pos_y=pointer_pos.current[1]-20

  // The limit value of the mouse position that engages the shift of the context menu
  // is arbitrary and taken by hand because it is not possible to know the dimensions of the menu before it is render
  if(contextualised_node){
    if(pointer_pos.current[0]+410>window.innerWidth){
      pos_x=pointer_pos.current[0]-400
      placement=('start' as Placement)
    }

    if(pointer_pos.current[1]+490>window.innerHeight){
      pos_y=pointer_pos.current[1]-470
      is_top=false
    }
    style_c_n=pos_y+'px auto auto '+pos_x+'px'
  }
  const contextualised_node_shape_visible=contextualised_node!==undefined?ReturnValueNode(data,contextualised_node,'shape_visible'):false
  const contextualised_node_label_visible=contextualised_node!==undefined?ReturnValueNode(data,contextualised_node,'label_visible'):false
  const contextualised_node_value_visible=contextualised_node!==undefined?ReturnValueNode(data,contextualised_node,'show_value'):false


  // b:before,m:middle,a:after
  const align_node=(ref:'min'|'max',attr:'x'|'y',pos:'b'|'m'|'a')=>{
    const node_ref=multi_selected_nodes.current.filter(nf=>nf.position!='relative').sort((n1,n2)=>{
      return ref=='min'?n1[attr]-n2[attr]:n2[attr]-n1[attr]
    })[0]
    const pos_ref=node_ref[attr]
    const wORh=(attr=='x')?'width':'height'
    const is_circle=d3.select('#shape_'+node_ref.idNode).attr('rx')!==null

    const wORh_ref=is_circle?Number(d3.select('#shape_'+node_ref.idNode).attr('r'+attr)):Number(d3.select('#shape_'+node_ref.idNode).attr(wORh))
    let center_ref=0

    if (pos==='m'){
      center_ref=pos_ref+(wORh_ref/2)
    }

    multi_selected_nodes.current.filter(n=>n!=node_ref && n.position!='relative').forEach(n=>{

      const is_circle_to_shift=d3.select('#shape_'+n.idNode).attr('rx')!==null
      const wORh_to_shift=is_circle_to_shift?Number(d3.select('#shape_'+n.idNode).attr('r'+attr)):Number(d3.select('#shape_'+n.idNode).attr(wORh))

      if (pos==='m'){
        n[attr]=center_ref-((wORh_to_shift)/2)
      }else if(pos==='b'){
        n[attr]=pos_ref
      }else if(pos==='a'){
        n[attr]=(pos_ref+wORh_ref)-wORh_to_shift
      }
    })

    multi_selected_nodes.current.forEach(n=>{
      d3.select('#ggg_' + n.idNode).attr('transform',nodeTransform(n,applicationData.display_nodes,applicationData.display_links))})
    let link_to_update:string[]=[]
    multi_selected_nodes.current.forEach(n=>{
      link_to_update=link_to_update.concat(n.outputLinksId)
      link_to_update=link_to_update.concat(n.inputLinksId)
    })
    link_to_update=[...new Set(link_to_update)]
    RedrawLinks(link_to_update.map(lid=>data.links[lid]))
    ComponentUpdater.updateComponenSaveInCache.current(false)

  }

  const dropdown_c_n_apparence=<Button onClick={()=>{
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_node_apparence.current(true)
    set_contextualised_node(undefined)
    contextMenu.ref_contextualised_node.current = undefined
  }} variant='light'>{t('Noeud.apparence.apparence')} {icon_open_modal}</Button>

  const dropdown_c_n_tooltip=<Button onClick={()=>{
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_node_tooltip.current(true)
    set_contextualised_node(undefined)
    contextMenu.ref_contextualised_node.current = undefined
  }} variant='light'>{t('Noeud.IS')} {icon_open_modal}</Button>

  // Dropdown to change some pararmeter concerning the style of the node
  const dropdown_c_n_style_select=<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.SelectStyle')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      {
        Object.values(data.style_node).map(sn=>{
          return <Dropdown.Item onClick={()=>{
            if (contextualised_node) {
              contextualised_node.style=sn.idNode
              multi_selected_nodes.current.filter(n=>n!=contextualised_node).forEach(n=>n.style=sn.idNode)

              RedrawNodes(multi_selected_nodes.current)
              ComponentUpdater.updateComponenSaveInCache.current(false)
            }
          }}>
            {sn.name}
          </Dropdown.Item>
        })
      }
    </Dropdown.Menu>
  </Dropdown>

  const dropdown_c_n_style=<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.editStyle')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      <Dropdown.Item  as={Button} variant='light' onClick={()=>{
        delete contextualised_node!.local
        multi_selected_nodes.current.filter(n=>n!=contextualised_node).forEach(n=>delete n.local)
        RedrawNodes(multi_selected_nodes.current)
        ComponentUpdater.updateComponenSaveInCache.current(false)

      }}>{t('Noeud.AS')}</Dropdown.Item>
      {dropdown_c_n_style_select}
    </Dropdown.Menu>
  </Dropdown>

  const dropdown_c_n_io=<Button onClick={()=>{
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_node_io.current(true)
    set_contextualised_node(undefined)
    contextMenu.ref_contextualised_node.current = undefined
  }} variant='light'>{t('Noeud.PF.PF')}{icon_open_modal}</Button>
  const dropdown_c_n_align_h_min_ori=<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.align_horiz_min')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      <Dropdown.Item onClick={()=>{
        align_node('min','x','b')
      }}>{t('Noeud.align_horiz_left')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('min','x','m')
      }}>{t('Noeud.align_horiz_center')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('min','x','a')
      }}>{t('Noeud.align_horiz_right')}
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>

  const dropdown_c_n_align_h_max_ori=<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.align_horiz_max')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      <Dropdown.Item onClick={()=>{
        align_node('max','x','b')
      }}>{t('Noeud.align_horiz_left')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('max','x','m')
      }}>{t('Noeud.align_horiz_center')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('max','x','a')
      }}>{t('Noeud.align_horiz_right')}
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>


  const dropdown_c_n_align_h=<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.align_horiz')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      {dropdown_c_n_align_h_min_ori}
      {dropdown_c_n_align_h_max_ori}
    </Dropdown.Menu>
  </Dropdown>



  // ===============ALIGNEMENT VERTICAL DES NOEUDS=======================================
  const dropdown_c_n_align_v_min_ori=<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.align_vert_min')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      <Dropdown.Item onClick={()=>{
        align_node('min','y','b')
      }}>{t('Noeud.align_vert_top')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('min','y','m')
      }}>{t('Noeud.align_horiz_center')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('min','y','a')
      }}>{t('Noeud.align_vert_bottom')}
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>

  const dropdown_c_n_align_v_max_ori=<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.align_vert_max')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      <Dropdown.Item onClick={()=>{
        align_node('max','y','b')
      }}>{t('Noeud.align_vert_top')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('max','y','m')
      }}>{t('Noeud.align_horiz_center')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('max','y','a')
      }}>{t('Noeud.align_vert_bottom')}
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>

  const dropdown_c_n_align_v=<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.align_vert')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      {dropdown_c_n_align_v_min_ori}
      {dropdown_c_n_align_v_max_ori}
    </Dropdown.Menu>
  </Dropdown>

  const dropdown_c_n_align=<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.align')}
    </Dropdown.Toggle>
    <Dropdown.Menu style={{maxWidth:'190px'}} variant='light'>
      {dropdown_c_n_align_h}
      {dropdown_c_n_align_v}
    </Dropdown.Menu>
  </Dropdown>

  const button_edit_label_node=<Button variant='light'
    onClick={()=>{
      const label_x=document.getElementById('text_'+contextualised_node!.idNode)?.getBoundingClientRect().x??0
      const label_y=document.getElementById('text_'+contextualised_node!.idNode)?.getBoundingClientRect().y??0
      const node_x=document.getElementById('shape_'+contextualised_node!.idNode)?.getBoundingClientRect().x??0
      const node_y=document.getElementById('shape_'+contextualised_node!.idNode)?.getBoundingClientRect().y??0

      d3.select('#fo_input_label_'+contextualised_node!.idNode).style('display','inline-block')
      d3.select('#fo_input_label_'+contextualised_node!.idNode).attr('x',(label_x-node_x)).attr('y',label_y-node_y)
      d3.select('#text_'+contextualised_node!.idNode).style('visibility','hidden')
      document.getElementById('input_label_'+contextualised_node!.idNode)?.focus()

      set_contextualised_node(undefined)
      contextMenu.ref_contextualised_node.current = undefined
    }}
  >
    {t('Noeud.labels.edit_node_label')}
  </Button>

  // Dropdown to select output or input links of the contextualised node
  const drp_dwn_slct_link=<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.SlctL')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>

      <Dropdown.Item as={Button}
        variant='light'
        onClick={() => {
          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
            multi_selected_links.current = multi_selected_links.current.concat(Object.values(data.links).filter(l=>d.outputLinksId.includes(l.idLink)))
            const opacity=ReturnValueLink(data,multi_selected_links.current[0],'opacity') as string
            applicationState.ref_display_link_opacity.current.forEach(setter=>setter(opacity))
          })
          multi_selected_links.current.forEach(l=>SelectVisualyLinks(l))
          set_contextualised_node(undefined)

        }}>
        {t('Noeud.SlctOL')}
      </Dropdown.Item>
      <Dropdown.Item as={Button}
        variant='light'
        onClick={() => {
          Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
            multi_selected_links.current = multi_selected_links.current.concat(Object.values(data.links).filter(l=>  d.inputLinksId.includes(l.idLink)))
            const opacity=ReturnValueLink(data,multi_selected_links.current[0],'opacity') as string
            applicationState.ref_display_link_opacity.current.forEach(setter=>setter(opacity))
          })
          multi_selected_links.current.forEach(l=>SelectVisualyLinks(l))
          set_contextualised_node(undefined)
        }}>
        {t('Noeud.SlctIL')}
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>

  const btn_reorganise_link_io=<Button
    variant='light'
    onClick={() => {
      reorganize_node_inputLinksId(data,contextualised_node!, data.nodes, data.links)
      reorganize_node_outputLinksId(data,contextualised_node!, data.nodes, data.links)
      multi_selected_nodes.current.filter(n=>n!=contextualised_node).forEach(n=>{
        reorganize_node_inputLinksId(data,n, data.nodes, data.links)
        reorganize_node_outputLinksId(data,n, data.nodes, data.links)
      })
      set_contextualised_node(undefined)
      contextMenu.ref_contextualised_node.current = undefined
      RedrawNodes(multi_selected_nodes.current)
      // Redraw link attached to modified node when the modification to the node
      let link_to_update:string[]=[]
      multi_selected_nodes.current.forEach(n=>{
        link_to_update=link_to_update.concat(n.outputLinksId)
        link_to_update=link_to_update.concat(n.inputLinksId)
      })
      link_to_update=[...new Set(link_to_update)]
      const list_links=link_to_update.map(lid=>data.links[lid])
      RedrawLinks(list_links)
      ComponentUpdater.updateComponenSaveInCache.current(false)

    }}>
    {t('Noeud.Reorg')}
  </Button>

  const btn_aggregate=multi_selected_nodes.current.filter(n=>n!=contextualised_node).length==0 && contextualised_node && NodeContextHasAggregate(contextualised_node,data)?<Button variant='light' onClick={()=>{
    Aggregate(contextualised_node,data,agregation)
    multi_selected_nodes.current =[]
    node_function.recomputeDisplayedElement()
    set_data({...data})
    set_contextualised_node(undefined)
    contextMenu.ref_contextualised_node.current = undefined
    ComponentUpdater.updateComponenSaveInCache.current(false)

  }}>{t('Noeud.context_agregate')}</Button>:<></>

  const btn_desagregate=multi_selected_nodes.current.filter(n=>n!=contextualised_node).length==0 && contextualised_node &&NodeContextHasDesaggregate(contextualised_node,data)?<Button variant='light' onClick={()=>{
    Desaggregate(contextualised_node,applicationData,agregation)
    multi_selected_nodes.current =[]
    node_function.recomputeDisplayedElement()
    set_data({...data})
    set_contextualised_node(undefined)
    contextMenu.ref_contextualised_node.current = undefined
    ComponentUpdater.updateComponenSaveInCache.current(false)

  }}>{t('Noeud.context_desagregate')}</Button>:<></>

  const btn_mask_shape=<Button variant='light'
    onClick={()=>{
      multi_selected_nodes.current.forEach(n=>{
        AssignNodeLocalAttribute(n,'shape_visible',!contextualised_node_shape_visible)
      })
      RedrawNodes(multi_selected_nodes.current)
      setForceUpdate(!forceUpdate)
      ComponentUpdater.updateComponenSaveInCache.current(false)

    }}
  >
    {contextualised_node_shape_visible?t('Noeud.apparence.hide_shape'):t('Noeud.apparence.display_shape')}
  </Button>

  const btn_mask_label=<Button variant='light'
    onClick={()=>{
      multi_selected_nodes.current.forEach(n=>{
        AssignNodeLocalAttribute(n,'label_visible',!contextualised_node_label_visible)
      })
      RedrawNodes(multi_selected_nodes.current)
      setForceUpdate(!forceUpdate)
      ComponentUpdater.updateComponenSaveInCache.current(false)

    }}
  >
    {contextualised_node_label_visible?t('Noeud.apparence.hide_label'):t('Noeud.apparence.display_label')}
  </Button>

  const btn_mask_value=<Button variant='light'
    onClick={()=>{
      multi_selected_nodes.current.forEach(n=>{
        AssignNodeLocalAttribute(n,'show_value',!contextualised_node_value_visible)
      })
      RedrawNodes(multi_selected_nodes.current)
      setForceUpdate(!forceUpdate)
      ComponentUpdater.updateComponenSaveInCache.current(false)

    }}
  >
    {contextualised_node_value_visible?t('Noeud.apparence.hide_value'):t('Noeud.apparence.display_value')}
  </Button>



  const btn_c_n_show_tags_menu=<Button onClick={()=>{
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_node_tags.current(true)
    set_contextualised_node(undefined)
    contextMenu.ref_contextualised_node.current = undefined
  }} variant='light'>{t('Menu.Etiquettes')} {icon_open_modal}</Button>

  // Pop over that serve as context menu
  return contextualised_node!==undefined?<Popover id="context_node_pop_over" placement={placement} className={'context_popover '+(is_top?'':'at_bot')} style={{maxWidth:'100%',position:'absolute',inset:style_c_n}}>
    <Popover.Body>
      <ButtonGroup vertical>
        {btn_aggregate}
        {btn_desagregate}
        {sep}
        {multi_selected_nodes.current.length>1?<>
          {dropdown_c_n_align}
          {sep}</>:<></>
        }

        {additional_context_element_other}

        {button_edit_label_node}
        <Button
          variant='light'
          onClick={() => {
            multi_selected_nodes.current.map(d => DeleteNode(data, d))
            multi_selected_nodes.current = []
            set_contextualised_node(undefined)
            contextMenu.ref_contextualised_node.current = undefined

            const tmp_node=Object.keys(data.nodes)
            Object.entries(applicationData.display_nodes).filter(n=>{
              return !tmp_node.includes(n[0])
            }).forEach(n=>{
              DeleteGNodes([n[0]])
              delete applicationData.display_nodes[n[0]]
            })

            const tmp_link=Object.keys(data.links)
            Object.entries(applicationData.display_links).filter(l=>{
              return !tmp_link.includes(l[0])
            }).forEach(l=>{
              DeleteGLinks([l[0]])
              delete applicationData.display_links[l[0]]
            })

            RedrawNodes(Object.values(applicationData.display_nodes))
            RedrawLinks(Object.values(applicationData.display_links))
            ComponentUpdater.updateComponenSaveInCache.current(false)

          }}>
          {t('Menu.suppr')}
        </Button>
        {sep}

        {dropdown_c_n_style}
        {btn_mask_shape}
        {btn_mask_label}
        {btn_mask_value}
        {sep}

        {btn_reorganise_link_io}
        {drp_dwn_slct_link}

        {sep}
        {dropdown_c_n_apparence}
        {btn_c_n_show_tags_menu}
        {multi_selected_nodes.current.length==1?dropdown_c_n_io:<></>}
        {dropdown_c_n_tooltip}
        {additional_context_element_menu}


      </ButtonGroup>
    </Popover.Body>
  </Popover>:<></>
}