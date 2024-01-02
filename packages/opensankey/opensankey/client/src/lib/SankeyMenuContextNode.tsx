import * as d3 from 'd3'
import React from 'react'
import { Dropdown, ButtonGroup, Button, Popover } from 'react-bootstrap'
import { SelectVisualyLinks } from './SankeyDrawFunction'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { 
  NodeContextHasAggregate, Aggregate, NodeContextHasDesaggregate, Desaggregate, DeleteNode, 
  ReturnValueLink, reorganize_node_inputLinksId, reorganize_node_outputLinksId 
} from './SankeyUtils'
import { ContextMenuNodeFType } from '../types/SankeyMenuContextNodeTypes'

const icon_open_modal=<FontAwesomeIcon style={{float:'right'}} icon={faUpRightFromSquare} />
const sep=<Button variant='light' disabled><hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></Button>
const checked=(b:boolean)=><span style={{float:'right'}}>{b?'✓':''}</span>

export const ContextMenuNode : ContextMenuNodeFType = (
  applicationContext,
  applicationData,
  elementsSelected,
  contextMenu,
  showMenuComponents,
  set_show_agregation,
  set_agregation_node,
  set_is_agregation,
  set_display_link_opacity,
  additional_context_element_menu,
  additional_context_element_other
) => {
  const { contextualised_node,pointer_pos } = contextMenu
  const { multi_selected_nodes,multi_selected_links } = elementsSelected
  const { data, set_data, display_nodes, display_links } = applicationData
  const { t } = applicationContext

  let style_c_n='0px 0px auto auto'
  if(contextualised_node.current){
    style_c_n=(pointer_pos.current[1]-20)+'px auto auto '+(pointer_pos.current[0]+10)+'px'
  }

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
  }

  // Dropdown to change some pararmeter concerning the appearence of the node
  const has_node_tags=Object.values(data.nodeTags).filter(nt=>nt.group_name!=='Type de noeud').length>0
  const dropdown_c_n_tag=has_node_tags ? <Dropdown as={ButtonGroup} variant='light' autoClose='outside' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Menu.Transformation.tagNode_assign')}
    </Dropdown.Toggle>
    <Dropdown.Menu  variant='light'>
      {Object.entries(data.nodeTags).filter(nt=>Object.keys(nt[1].tags).length>0).map(nt=>{
        return <Dropdown autoClose='outside' drop='end'>
          <Dropdown.Toggle variant="light" id="dropdown-basic">
            {nt[1].group_name}
          </Dropdown.Toggle>
          <Dropdown.Menu  variant='light'>
            {Object.keys(nt[1].tags).map(t=>{
              return <Dropdown.Item as={Button} variant='light' onClick={()=>{
                // Contextualised node
                if(!Object.keys(contextualised_node.current!.tags).includes(nt[0])){
                  contextualised_node.current!.tags[nt[0]]=[]
                }
                if(!contextualised_node.current!.tags[nt[0]].includes(t)){
                  contextualised_node.current!.tags[nt[0]].push(t)
                }else{
                  contextualised_node.current!.tags[nt[0]].splice(contextualised_node.current!.tags[nt[0]].indexOf(t))
                }
                //Selected nodes
                multi_selected_nodes.current.filter(n=>n!=contextualised_node.current!).forEach(n=>{
                  if(!Object.keys(n.tags).includes(nt[0])){
                    n.tags[nt[0]]=[]
                  }
                  if(!n.tags[nt[0]].includes(t)){
                    n.tags[nt[0]].push(t)
                  }else{
                    n.tags[nt[0]].splice(n.tags[nt[0]].indexOf(t))
                  }
                })

                set_data({...data})
              }}>
                {nt[1].tags[t].name}{/*checked(contextualised_node.current!.tags[nt[0]] &&contextualised_node.current!.tags[nt[0]].includes(t))*/}
              </Dropdown.Item>
            })}
          </Dropdown.Menu>
        </Dropdown>
      })}

    </Dropdown.Menu>
  </Dropdown>:<></>

  const dropdown_c_n_apparence=<Button onClick={()=>{
    showMenuComponents.show_menu_node_apparence[1](true)
    contextualised_node.current = undefined
  }} variant='light'>{t('Noeud.apparence.apparence')} {icon_open_modal}</Button>

  // Dropdown to change some pararmeter concerning the style of the node
  const dropdown_c_n_style_select=<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.SelectStyle')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      {
        Object.values(data.style_node).map(sn=>{
          return <Dropdown.Item onClick={()=>{
            contextualised_node.current!.style=sn.idNode
            multi_selected_nodes.current.filter(n=>n!=contextualised_node.current).forEach(n=>n.style=sn.idNode)

            set_data({...data})
          }}>{sn.name}</Dropdown.Item>
        })
      }
    </Dropdown.Menu>
  </Dropdown>

  const dropdown_c_n_style=<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.Style')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      <Dropdown.Item  as={Button} variant='light' onClick={()=>{
        delete contextualised_node.current!.local
        multi_selected_nodes.current.filter(n=>n!=contextualised_node.current).forEach(n=>delete n.local)
        set_data({...data})
      }}>{t('Noeud.AS')}</Dropdown.Item>
      {dropdown_c_n_style_select}
    </Dropdown.Menu>
  </Dropdown>

  const dropdown_c_n_io=<Button onClick={()=>{
    showMenuComponents.show_menu_node_io[1](true)
    contextualised_node.current = undefined
  }} variant='light'>{t('Noeud.PF.PFM')}{icon_open_modal}</Button>
  const dropdown_c_n_align_h_min_ori=<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.align_horiz_min')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      <Dropdown.Item onClick={()=>{
        align_node('min','x','b')
        set_data({...data})
      }}>{t('Noeud.align_horiz_left')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('min','x','m')
        set_data({...data})
      }}>{t('Noeud.align_horiz_center')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('min','x','a')
        set_data({...data})
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
        set_data({...data})
      }}>{t('Noeud.align_horiz_left')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('max','x','m')
        set_data({...data})
      }}>{t('Noeud.align_horiz_center')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('max','x','a')
        set_data({...data})
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
        set_data({...data})
      }}>{t('Noeud.align_vert_top')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('min','y','m')
        set_data({...data})
      }}>{t('Noeud.align_horiz_center')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('min','y','a')
        set_data({...data})
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
        set_data({...data})
      }}>{t('Noeud.align_vert_top')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('max','y','m')
        set_data({...data})
      }}>{t('Noeud.align_horiz_center')}
      </Dropdown.Item>
      <Dropdown.Item onClick={()=>{
        align_node('max','y','a')
        set_data({...data})
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

  const button_edit_label_node=<Button variant='light'
    onClick={()=>{
      const label_x=document.getElementById('text_'+contextualised_node.current!.idNode)?.getBoundingClientRect().x??0
      const label_y=document.getElementById('text_'+contextualised_node.current!.idNode)?.getBoundingClientRect().y??0
      const node_x=document.getElementById('shape_'+contextualised_node.current!.idNode)?.getBoundingClientRect().x??0
      const node_y=document.getElementById('shape_'+contextualised_node.current!.idNode)?.getBoundingClientRect().y??0

      d3.select('#fo_input_label_'+contextualised_node.current!.idNode).style('display','inline-block')
      d3.select('#fo_input_label_'+contextualised_node.current!.idNode).attr('x',(label_x-node_x)).attr('y',label_y-node_y)
      d3.select('#text_'+contextualised_node.current!.idNode).style('display','none')
      document.getElementById('input_label_'+contextualised_node.current!.idNode)?.focus()

      contextualised_node.current = undefined

    }}
  >
    {t('Noeud.labels.edit_node_label')}
  </Button>


  // Pop over that serve as context menu
  return <Popover ref={contextMenu.contextNodeRef} id="context_node_pop_over" style={{maxWidth:'100%',position:'absolute',inset:style_c_n}}>
    <Popover.Body>
      <ButtonGroup vertical>
        {multi_selected_nodes.current.filter(n=>n!=contextualised_node.current).length==0 && contextualised_node.current && NodeContextHasAggregate(contextualised_node.current!,data)?<Button variant='light' onClick={()=>{
          Aggregate(contextualised_node.current!,data,set_agregation_node,set_is_agregation,set_show_agregation)
          multi_selected_nodes.current =[]
          set_data({...data})
          contextualised_node.current = undefined
        }}>Agrégation</Button>:<></>}
        {multi_selected_nodes.current.filter(n=>n!=contextualised_node.current).length==0 && contextualised_node.current &&NodeContextHasDesaggregate(contextualised_node.current!,data)?<Button variant='light' onClick={()=>{
          Desaggregate(contextualised_node.current!,data,display_nodes,display_links,set_agregation_node,set_is_agregation,set_show_agregation)
          multi_selected_nodes.current =[]
          set_data({...data})
          contextualised_node.current = undefined
        }}>Désagrégation</Button>:<></>}
        {sep}
        {button_edit_label_node}
        {sep}
        <Button
          variant='light'
          onClick={() => {
            multi_selected_nodes.current.map(d => DeleteNode(data, d))
            multi_selected_nodes.current = []
            contextualised_node.current = undefined
            set_data({ ...data })

          }}>
          {t('Menu.suppr')}
        </Button>
        {sep}
        <Button
          variant='light'
          onClick={() => {
            Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
              multi_selected_links.current = multi_selected_links.current.concat(Object.values(data.links).filter(l=>  d.outputLinksId.includes(l.idLink)))
              const opacity=ReturnValueLink(data,multi_selected_links.current[0],'opacity') as string
              set_display_link_opacity(opacity)
            })
            multi_selected_links.current.forEach(l=>SelectVisualyLinks(l))
          }}>
          {t('Noeud.SlctOutLink')}
        </Button>
        <Button
          variant='light'
          onClick={() => {
            Object.values(data.nodes).filter(f => multi_selected_nodes.current.map(d => d.idNode).includes(f.idNode)).map(d => {
              multi_selected_links.current = multi_selected_links.current.concat(Object.values(data.links).filter(l=>  d.inputLinksId.includes(l.idLink)))
              const opacity=ReturnValueLink(data,multi_selected_links.current[0],'opacity') as string
              set_display_link_opacity(opacity)
            })
            multi_selected_links.current.forEach(l=>SelectVisualyLinks(l))
          }}>
          {t('Noeud.SlctInLink')}
        </Button>
        <Button
          variant='light'
          onClick={() => {
            reorganize_node_inputLinksId(data,contextualised_node.current!, data.nodes, data.links)
            reorganize_node_outputLinksId(data,contextualised_node.current!, data.nodes, data.links)
            multi_selected_nodes.current.filter(n=>n!=contextualised_node.current).forEach(n=>{
              reorganize_node_inputLinksId(data,n, data.nodes, data.links)
              reorganize_node_outputLinksId(data,n, data.nodes, data.links)
            })
            contextualised_node.current = undefined
            set_data({ ...data })
          }}>
          {t('Noeud.Reorg')}
        </Button>
        {multi_selected_nodes.current.length==1?dropdown_c_n_io:<></>}
        {sep}
        {dropdown_c_n_align_h}
        {dropdown_c_n_align_v}
        {has_node_tags?sep:<></>}
        {dropdown_c_n_tag}
        {sep}

        {dropdown_c_n_apparence}
        {additional_context_element_menu}
        {sep}
        {dropdown_c_n_style}
        {additional_context_element_other}

      </ButtonGroup>
    </Popover.Body>
  </Popover>
}