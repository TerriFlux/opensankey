import React, { FunctionComponent, useState } from 'react'
import { Dropdown, ButtonGroup, Button, Popover, Form } from 'react-bootstrap'
import { ContextMenuLinkFType } from './types/SankeyMenuContextLinkTypes'
import { SankeyLink, SankeyNode,  SankeyLinkValue } from '../types/Types'
import { reorganize_inputLinksId} from '../draw/SankeyDrawLayout'
import { handleDownLink, handleUpLink } from '../configmenus/SankeyMenuConfigurationLinksAppearence'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { AssignLinkLocalAttribute, ReturnValueLink, updateLinkTagValue } from '../configmenus/SankeyUtils'
import * as d3 from 'd3'
import { ValueSelectedParameter } from '../draw/SankeyDrawFunction'
import { drawAddLinks, drawLinkShape } from '../draw/SankeyDrawLinks'

const icon_open_modal=<FontAwesomeIcon style={{float:'right'}} icon={faUpRightFromSquare} />
const sep=<Button variant='light' disabled><hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></Button>
const checked=(b:boolean)=><span style={{float:'right'}}>{b?'✓':''}</span>

export const ContextMenuLink : FunctionComponent<ContextMenuLinkFType> = ({
  applicationContext,
  dict_variable_application_data,
  dict_variable_elements_selected,
  contextMenu,
  dict_hook_ref_setter_show_dialog_components,
  link_function,
  uiElementsRef,
  alt_key_pressed,
  ComponentUpdater
})=>{
  const [ contextualised_link, set_contextualised_link] = useState<SankeyLink>()
  contextMenu.ref_setter_contextualised_link.current = set_contextualised_link
  const [forceUpdate,setForceUpdate]=useState(false)
  const { pointer_pos } = contextMenu
  const { multi_selected_links,displayedInputLinkValueSetterRef,displayedInputLinkValueRef } = dict_variable_elements_selected
  const { data, set_data } = dict_variable_application_data
  const { t } = applicationContext

  const redraw_selected_links=()=>{
    d3.selectAll('.gg_links').filter((g_l)=>{
      const cast_l=g_l as SankeyLink
      return multi_selected_links.current.includes(cast_l)
    }).remove()
    drawAddLinks(contextMenu,dict_variable_application_data,uiElementsRef,dict_variable_elements_selected,applicationContext,alt_key_pressed,link_function,ComponentUpdater,dict_hook_ref_setter_show_dialog_components,multi_selected_links.current)
    ComponentUpdater.ref_set_update_menu_config_link.current(!ComponentUpdater.ref_get_update_menu_config_link.current)
    setForceUpdate(!forceUpdate)
  }

  const newEntries = new Map(Object.entries(data.dataTags).map(([dataTagKey, dataTag]) => {
    return (Object.keys(dataTag.tags).length > 0) ? [
      dataTagKey,
      Object.entries(dataTag.tags).filter(tag => tag[1].selected).length > 0 ? Object.entries(dataTag.tags).filter(tag => tag[1].selected)[0][0] : Object.keys(dataTag.tags)[0]] : ['n', 'n']
  }))
  const tags_selected = Object.fromEntries(newEntries)

  let style_c_l='0px 0px auto auto'
  if(contextualised_link){
    style_c_l=(pointer_pos.current[1]-20)+'px auto auto '+(pointer_pos.current[0]+10)+'px'
  }

  const invert_flux=(l:SankeyLink,nodes_to_reorganize: SankeyNode[])=>{

    const tmp = l.idSource
    const previous_node_s = data.nodes[l.idSource]
    previous_node_s.outputLinksId.splice(previous_node_s.outputLinksId.indexOf(l.idLink), 1)
    const source_node = data.nodes[l.idTarget]
    l.idSource = source_node.idNode
    source_node.outputLinksId.push(l.idLink)
    nodes_to_reorganize.push(source_node)
    const previous_node_t = data.nodes[l.idTarget]
    previous_node_t.inputLinksId.splice(previous_node_t.inputLinksId.indexOf(l.idLink), 1)
    const target_node = data.nodes[tmp]
    l.idTarget = target_node.idNode
    target_node.inputLinksId.push(l.idLink)
    nodes_to_reorganize.push(target_node)


  }

  const remake_display_links=()=>{
    const pre_link_key=Object.keys(dict_variable_application_data.display_links)
    const new_display_links={} as {[idLink:string]:SankeyLink}
    data.linkZIndex.filter(lk=>pre_link_key.includes(lk)).forEach(lk=>new_display_links[lk]=dict_variable_application_data.display_links[lk])
    dict_variable_application_data.display_links=new_display_links
    redraw_selected_links()  
  }
  const value_selected_parameter_contextualised_link = (): SankeyLinkValue => {
    if(contextualised_link===undefined){
      return ({} as SankeyLinkValue)
    }else{
      if ( Object.keys(data.links).length === 0 || !(contextualised_link!.idLink in data.links) ) {
        let val = JSON.parse(JSON.stringify(Object(contextualised_link!.value)))
        Object.values(tags_selected).map(tag_selected => {
          if (val[tag_selected] === undefined) {
            val[tag_selected] = {}
          }
          val = val[tag_selected]
        })
        return val
      }
      let val = JSON.parse(JSON.stringify(Object(data.links[contextualised_link!.idLink].value)))
      Object.values(tags_selected).map(tag_selected => {
        if (val[tag_selected] === undefined) {
          val[tag_selected] = {'display_value': '',tags:{},value:0}
        }
        val = val[tag_selected]
      })
      return val
    }

  }
  const context_link_label_visible=contextualised_link!==undefined?ReturnValueLink(data,contextualised_link,'label_visible') as boolean:false

  const has_flux_tags=Object.values(data.fluxTags).length>0
  // Dropdown to change some pararmeter concerning the appearence of the node
  const dropdown_c_l_tag=(contextualised_link!==undefined && has_flux_tags) && has_flux_tags?<Dropdown as={ButtonGroup} variant='light' autoClose='outside' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Menu.Transformation.tagFlux_assign')}
    </Dropdown.Toggle>

    <Dropdown.Menu  variant='light'>
      {Object.entries(data.fluxTags).filter(nt=>Object.keys(nt[1].tags).length>0).map(nt=>{
        return <Dropdown as={Button} variant='light' autoClose='outside' drop='end'>
          <Dropdown.Toggle variant="light" id="dropdown-basic">
            {nt[1].group_name}
          </Dropdown.Toggle>
          <Dropdown.Menu  variant='light'>
            {Object.keys(nt[1].tags).map(t=>{
              const has_tag=value_selected_parameter_contextualised_link().tags[nt[0]]!==undefined
              const is_selected= value_selected_parameter_contextualised_link().tags[nt[0]] && value_selected_parameter_contextualised_link().tags[nt[0]].includes(t) 
              
              return <Dropdown.Item onClick={()=>{
                // Assign tag to selected links
                multi_selected_links.current.filter(l=>l!==contextualised_link).forEach(l=>{
                  updateLinkTagValue(l,tags_selected,nt[0],t,!is_selected)
                })
                updateLinkTagValue(contextualised_link,tags_selected,nt[0],t,!is_selected)
                redraw_selected_links()
              }}>
                {nt[1].tags[t].name}{has_tag?checked(value_selected_parameter_contextualised_link().tags[nt[0]].includes(t)):<></>}
              </Dropdown.Item>
            })}
          </Dropdown.Menu>
        </Dropdown>
      })}

    </Dropdown.Menu>
  </Dropdown>:<></>


  const button_open_link_appearence=contextualised_link!==undefined?<Button onClick={()=>{
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_link_appearence.current(true)
    set_contextualised_link(undefined)
  }} variant='light'>{t('Flux.apparence.apparence')} {icon_open_modal}</Button>:<></>

  // Dropdown to change some pararmeter concerning the style of the node
  const dropdown_c_l_style_select=contextualised_link!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.SelectStyle')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      {
        Object.values(data.style_link).map(sn=>{
          return <Dropdown.Item onClick={()=>{
            contextualised_link!.style=sn.idLink
            multi_selected_links.current.filter(n=>n!=contextualised_link).forEach(n=>n.style=sn.idLink)
            redraw_selected_links()
          }}>{sn.name}{checked(contextualised_link!.style==sn.idLink)}</Dropdown.Item>
        })
      }
    </Dropdown.Menu>
  </Dropdown>:<></>
  const dropdown_c_l_style=contextualised_link!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.editStyle')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      <Dropdown.Item as={Button} variant='light' onClick={()=>{
        delete contextualised_link!.local
        multi_selected_links.current.filter(n=>n!=contextualised_link).forEach(n=>delete n.local)
      }}>{t('Noeud.AS')}</Dropdown.Item>
      {dropdown_c_l_style_select}
    </Dropdown.Menu>
  </Dropdown>:<></>

  const dropdown_c_l_layout=contextualised_link!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Flux.layout')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>

      <Dropdown.Item onClick={()=>{
        multi_selected_links.current.map(l => {
          const i = l.idLink
          const { links } = data
          const listElmt = Object.keys(links)
          const posElemt = listElmt.indexOf(i)
          listElmt.splice(posElemt, 1)
          listElmt.splice(listElmt.length, 0, i)
          const new_cat: { [key: string]: SankeyLink } = {}
          listElmt.forEach(elt => {
            new_cat[elt] = links[elt]
          })
          for (const member in links) delete links[member]
          Object.assign(links, new_cat)
        })
        remake_display_links()
      }}>{t('Flux.layoutTop')}</Dropdown.Item>

      <Dropdown.Item onClick={()=>{
        multi_selected_links.current.forEach(n=>handleDownLink(data,n.idLink))
        remake_display_links()
      }}>{t('Flux.layoutUp')}</Dropdown.Item>



      <Dropdown.Item onClick={()=>{
        multi_selected_links.current.forEach(n=>handleUpLink(data,n.idLink))
        remake_display_links()
      }}>{t('Flux.layoutDown')}</Dropdown.Item>

      <Dropdown.Item onClick={()=>{
        multi_selected_links.current.map(l => {
          const i = l.idLink
          const { links } = data
          const listElmt = Object.keys(links)
          const posElemt = listElmt.indexOf(i)
          listElmt.splice(posElemt, 1)
          listElmt.splice(0, 0, i)
          const new_cat: { [key: string]: SankeyLink } = {}
          listElmt.forEach(elt => {
            new_cat[elt] = links[elt]
          })
          for (const member in links) delete links[member]
          Object.assign(links, new_cat)
        })
        remake_display_links()
      }}>{t('Flux.layoutBottom')}</Dropdown.Item>

    </Dropdown.Menu>
  </Dropdown>:<></>

  const button_open_link_data=contextualised_link!==undefined?<Button onClick={()=>{
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_link_data.current(true)
    set_contextualised_link(undefined)
  }} variant='light'>{t('Flux.data.données')} {icon_open_modal}</Button>:<></>

  const button_mask_link_label=contextualised_link!==undefined?<Button onClick={()=>{
    multi_selected_links.current.forEach(l=>{
      AssignLinkLocalAttribute(l,'label_visible',!context_link_label_visible)
    })


  }} variant='light'>{context_link_label_visible?t('Flux.apparence.hide_link_lab'):t('Flux.apparence.display_link_lab')}</Button>:<></>

  const button_open_link_tooltip=contextualised_link!==undefined?<Button onClick={()=>{
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_link_tooltip.current(true)
    set_contextualised_link(undefined)
  }} variant='light'>{t('Flux.IS')} {icon_open_modal}</Button>:<></>

  const btn_l_show_tags_menu=<Button onClick={()=>{
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_link_tags.current(true)
    set_contextualised_link(undefined)
    contextMenu.ref_contextualised_node.current = undefined
  }} variant='light'>{t('Menu.Etiquettes')} {icon_open_modal}</Button>



  const btn_edit_value=contextualised_link!==undefined?<Dropdown  autoClose='outside' as={ButtonGroup} variant='light' drop='end'> 
    <Dropdown.Toggle variant="light" id="dropdown-basic">{t('Flux.data.edit_value')}</Dropdown.Toggle>
    <Dropdown.Menu>
      <Dropdown.Item>
        <Form.Control
          type='string'
          value={displayedInputLinkValueRef.current}
          onChange={
            evt => {
              displayedInputLinkValueSetterRef.current.forEach(setter=>setter(evt.target.value))
              const formatedValue=evt.target.value.replace(',','.')
              if(formatedValue!='' && isNaN(+formatedValue)){
                d3.select('.inputValueLink').style('border','red 1px solid')
              }else{
                d3.select('.inputValueLink').style('border','#ced4da 1px solid')
              }
            }
          }
          onBlur={evt=>{
            const formatedValue=evt.target.value.replace(',','.')
            if(formatedValue!=='' && !isNaN(+formatedValue )){
              const was_empty=ValueSelectedParameter(dict_variable_application_data,multi_selected_links,tags_selected).value===''
              let val = Object(multi_selected_links.current[0].value)
              multi_selected_links.current.map(d => {
                const dashed=ReturnValueLink(data,multi_selected_links.current[0],'dashed') as boolean
                AssignLinkLocalAttribute(d,'dashed',(was_empty)?false:dashed)

                val = d.value
                Object.values(tags_selected).forEach(tag => {
                  if (val[tag] === undefined) {
                    val[tag] = {}
                  }
                  val = val[tag]
                })
                val.value = +formatedValue
              })
              const scale = d3.scaleLinear()
                .domain([0, data.user_scale])
                .range([0, 100])
              if (scale(+formatedValue) > 500) {
                data.user_scale = +formatedValue
              }
              set_data({ ...data })
            }
            else if(formatedValue=='') {
              let val = Object(multi_selected_links.current[0].value)
              multi_selected_links.current.map(d => {
                val = d.value
                AssignLinkLocalAttribute(d,'dashed',true)
                Object.values(tags_selected).forEach(tag => {
                  if (val[tag] === undefined) {
                    val[tag] = {}
                  }
                  val = val[tag]
                })
                val.value = ''
              })
              set_data({ ...data })
            }
          }}

        ></Form.Control>
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown>:<></>


  // Pop over that serve as context menu
  return contextualised_link!==undefined?<Popover id="context_link_pop_over" style={{maxWidth:'100%',position:'absolute',inset:style_c_l}}>
    <Popover.Body >
      <ButtonGroup vertical>
        <Button variant='light' onClick={()=>{
          const nodes_to_reorganize: SankeyNode[] = []
          invert_flux(contextualised_link!,nodes_to_reorganize)
          multi_selected_links.current.filter(l=>l!==contextualised_link).forEach(l => {
            invert_flux(l,nodes_to_reorganize)
          })
          nodes_to_reorganize.forEach(n => {
            reorganize_inputLinksId(data,n, true, true, data.nodes, data.links)
          })

          let list_node:string[]=[]
          multi_selected_links.current.forEach(l=>{
            list_node.push(l.idSource)
            list_node.push(l.idTarget)
          })
          list_node=[...new Set(list_node)]

          // Redraw link attached to modified node when the modification to the node 
          // modify links path
          let link_to_update:string[]=[]
          list_node.forEach(nid=>{
            link_to_update=link_to_update.concat(data.nodes[nid].outputLinksId)
            link_to_update=link_to_update.concat(data.nodes[nid].inputLinksId)
          })
          link_to_update=[...new Set(link_to_update)]
          const list_links=link_to_update.map(lid=>data.links[lid])
          drawLinkShape(dict_variable_application_data,dict_variable_elements_selected,applicationContext,link_function,list_links,ComponentUpdater)
        }}>{t('Flux.if')}</Button>

        {sep}
        {dropdown_c_l_style}
        {sep}
        {dropdown_c_l_layout}
        {button_mask_link_label}
        {btn_edit_value}
        {has_flux_tags && sep}
        {dropdown_c_l_tag}
        {sep}
        {button_open_link_data}
        {button_open_link_appearence}
        {btn_l_show_tags_menu}
        {button_open_link_tooltip}
      </ButtonGroup>
    </Popover.Body>
  </Popover>:<></>
}