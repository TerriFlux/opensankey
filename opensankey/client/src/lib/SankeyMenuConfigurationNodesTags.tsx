import { TFunction } from 'i18next'
import React from 'react'
import { Row, Form, FormLabel, Col, FormCheck, Tab, Table } from 'react-bootstrap'
import { SankeyData,SankeyNode } from './types'

/**
   * Tab that handle tag association to nodes, a nodes can have tags from the same grouptag or from different group
   * To visaulize nodes according to their tag associated, the groupTags must be at least have it banner in mode one or mutliple 
   * then in the nodes filter button, select the groupTag you want to apply and in the dropdown select the node/nodes you want to see
   *
   * @type {*}
   */
export const SankeyMenuConfigurationNodesTags = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]},
  tags_group_key:string,
  set_tags_group_key:React.Dispatch<React.SetStateAction<string>>
)=> {
  const tags_visible = Object.keys(data.nodeTags).length > 0
  if ((tags_group_key == '' && Object.keys(data.nodeTags).length > 0) || (!Object.keys(data.nodeTags).includes(tags_group_key) && Object.keys(data.nodeTags).length > 0)) {
    set_tags_group_key(Object.keys(data.nodeTags)[0])
  }
  return <Tab eventKey="tags" title={t('Noeud.tags_node.tags')}
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
          {Object.entries(data.nodeTags).map(
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
        {tags_visible && tags_group_key != '' && Object.keys(data.nodeTags).includes(tags_group_key) ? Object.entries(data.nodeTags[tags_group_key].tags).map(
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
  </Tab >
}