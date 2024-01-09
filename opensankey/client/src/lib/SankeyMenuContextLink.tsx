import React, { FunctionComponent, useState } from 'react'
import { Dropdown, ButtonGroup, Button, Popover } from 'react-bootstrap'
import { ContextMenuLinkFType } from '../types/SankeyMenuContextLinkTypes'
import { SankeyLink, SankeyNode,  SankeyLinkValue } from '../types/Types'
import { reorganize_inputLinksId} from './SankeyLayout'
import { handleDownLink, handleUpLink } from './SankeyMenuConfigurationLinksAppearence'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'

const icon_open_modal=<FontAwesomeIcon style={{float:'right'}} icon={faUpRightFromSquare} />
const sep=<Button variant='light' disabled><hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></Button>
const checked=(b:boolean)=><span style={{float:'right'}}>{b?'✓':''}</span>

export const ContextMenuLink : FunctionComponent<ContextMenuLinkFType> = ({
  applicationContext,
  dict_variable_application_data,
  dict_variable_elements_selected,
  contextMenu,
  dict_hook_ref_setter_show_dialog_components
})=>{
  const [ contextualised_link, set_contextualised_link] = useState<SankeyLink>()
  contextMenu.ref_setter_contextualised_link.current = set_contextualised_link

  const { pointer_pos } = contextMenu
  const { multi_selected_links } = dict_variable_elements_selected
  const { data, set_data } = dict_variable_application_data
  const { t } = applicationContext

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
  const has_flux_tags=Object.values(data.fluxTags).length>0
  // Dropdown to change some pararmeter concerning the appearence of the node
  const dropdown_c_l_tag=(contextualised_link!==undefined && has_flux_tags) && Object.entries(data.nodeTags).length>0?<Dropdown as={ButtonGroup} variant='light' autoClose='outside' drop='end'>
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
              return <Dropdown.Item onClick={()=>{
                // Assign tag to selected links
                multi_selected_links.current.filter(l=>l!==contextualised_link).forEach(l=>{
                  let val = Object(l.value)
                  Object.values(tags_selected).forEach(tag => {
                    if (val[tag] === undefined) {
                      val[tag] = {}
                    }
                    val = val[tag]
                  })
                  if(!Object.keys(val.tags).includes(nt[0])){
                    val.tags[nt[0]]=[]
                  }
                  if(!val.tags[nt[0]].includes(t)){
                    val.tags[nt[0]].push(t)
                  }else{
                    val.tags[nt[0]].splice(val.tags[nt[0]].indexOf(t))
                  }
                })

                // Assign tag to contextualised link
                let val = Object(contextualised_link!.value)
                Object.values(tags_selected).forEach(tag => {
                  if (val[tag] === undefined) {
                    val[tag] = {}
                  }
                  val = val[tag]
                })
                if(!Object.keys(val.tags).includes(nt[0])){
                  val.tags[nt[0]]=[]
                }
                if(!val.tags[nt[0]].includes(t)){
                  val.tags[nt[0]].push(t)
                }else{
                  val.tags[nt[0]].splice(val.tags[nt[0]].indexOf(t))
                }


                set_data({...data})
              }}>
                {nt[1].tags[t].name}{checked(value_selected_parameter_contextualised_link().tags[nt[0]].includes(t))}
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
        Object.values(data.style_node).map(sn=>{
          return <Dropdown.Item onClick={()=>{
            contextualised_link!.style=sn.idNode
            multi_selected_links.current.filter(n=>n!=contextualised_link).forEach(n=>n.style=sn.idNode)

            set_data({...data})
          }}>{sn.name}{checked(contextualised_link!.style==sn.idNode)}</Dropdown.Item>
        })
      }
    </Dropdown.Menu>
  </Dropdown>:<></>
  const dropdown_c_l_style=contextualised_link!==undefined?<Dropdown autoClose='outside' as={ButtonGroup} variant='light' drop='end'>
    <Dropdown.Toggle variant="light" id="dropdown-basic">
      {t('Noeud.Style')}
    </Dropdown.Toggle>
    <Dropdown.Menu variant='light'>
      <Dropdown.Item as={Button} variant='light' onClick={()=>{
        delete contextualised_link!.local
        multi_selected_links.current.filter(n=>n!=contextualised_link).forEach(n=>delete n.local)
        set_data({...data})
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
        multi_selected_links.current.forEach(n=>handleDownLink(data,n.idLink))
        set_data({...data})
      }}>{t('Flux.layoutUp')}</Dropdown.Item>
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
        set_data({...data})
      }}>{t('Flux.layoutTop')}</Dropdown.Item>





      <Dropdown.Item onClick={()=>{
        multi_selected_links.current.forEach(n=>handleUpLink(data,n.idLink))
        set_data({...data})
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
        set_data({...data})
      }}>{t('Flux.layoutBottom')}</Dropdown.Item>

    </Dropdown.Menu>
  </Dropdown>:<></>

  const button_open_link_data=contextualised_link!==undefined?<Button onClick={()=>{
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_link_data.current(true)
    set_contextualised_link(undefined)
  }} variant='light'>{t('Flux.data.données')} {icon_open_modal}</Button>:<></>

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
          set_data({ ...data })
        }}>{t('Flux.if')}</Button>

        {sep}
        {dropdown_c_l_layout}
        {has_flux_tags && sep}
        {dropdown_c_l_tag}
        {sep}
        {button_open_link_data}
        {button_open_link_appearence}
        {sep}
        {dropdown_c_l_style}

      </ButtonGroup>
    </Popover.Body>
  </Popover>:<></>
}