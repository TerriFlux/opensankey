import React, { useState } from 'react'
import { Row, Form, FormLabel, Col, FormCheck, Tab, Button } from 'react-bootstrap'
import { SankeyData, SankeyNode } from './types'
import { reorganize_node_inputLinksId,reorganize_node_outputLinksId } from './SankeyLayout'
import { default_link } from './SankeyUtils'
import {useTranslation} from 'react-i18next'


export const SankeyMenuConfigurationNodesAgregation = (
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]}
) => {
  const {t} =useTranslation()
  const [parent_visible,set_parent_visible] = useState(false)
  const [cube_dimension,set_cube_dimension] = useState(
    Object.values(data.nodeTags).filter(tag=>tag.banner == 'level').length > 0 ? Object.entries(data.nodeTags).filter(([,tag])=>tag.banner == 'level')[0][0] : 'Primaire' 
  )
  if (Object.values(data.nodeTags).filter(tag=>tag.banner == 'level').length > 0 && cube_dimension == 'Primaire') {
    if (Object.values(data.nodeTags).filter(tag=>tag.banner == 'level' && tag.group_name == 'Primaire').length == 0) {
      set_cube_dimension(Object.entries(data.nodeTags).filter(([,tag])=>tag.banner == 'level')[0][0])
    }
  }
  return<Tab eventKey="agregation" title={t('Noeud.agre.Agré')}>
    <Form >
      <Form.Group as={Row} >
        <FormLabel column>{t('Noeud.agre.DC')}</FormLabel>
        <Col><Form.Select placeholder='all' value={cube_dimension} onChange={(evt:React.ChangeEvent<HTMLSelectElement>)=>set_cube_dimension(evt.target.value)} >
          {Object.entries(data.nodeTags).filter(tag=>tag[1].banner == 'level').map((tag,i) => {
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
                  reorganize_node_outputLinksId(data.nodes[new_link.idSource], data.nodes, data.links)
                })
                new_output_nodes.forEach(() => {
                  const new_link = default_link(data)
                  new_link.idSource = d.idNode
                  new_link.idLink = 'link' + idLink
                  data.links[new_link.idLink] = new_link
                  idLink = idLink+1
                  reorganize_node_inputLinksId(data.nodes[new_link.idTarget], data.nodes, data.links)
                })
                reorganize_node_inputLinksId(d, data.nodes, data.links)
                reorganize_node_outputLinksId(d, data.nodes, data.links)

                set_data({ ...data })
              })
            }
          }
        >{t('Noeud.agre.CLE')}</Button>
      </Col>
    </Form>
  </Tab>
}
 