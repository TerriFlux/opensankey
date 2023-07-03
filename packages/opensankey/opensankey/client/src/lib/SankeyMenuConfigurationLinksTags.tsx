import React from 'react'
import { Row, Form, Col, FormLabel, FormCheck, Tab, Table } from 'react-bootstrap'
import { SankeyData, SankeyLink,SankeyLinkValue } from './types'
import { TFunction } from 'i18next'


export const SankeyMenuConfigurationLinksTags = (
  data:SankeyData,
  multi_selected_links:{current:SankeyLink[]},
  set_data:(d:SankeyData)=>void,
  tags_group_key:string,
  set_tags_group_key:React.Dispatch<React.SetStateAction<string>>,
  tags_selected:{[k: string]: string},
  set_tags_selected:React.Dispatch<React.SetStateAction<{[k: string]: string}>>,
  t:TFunction
)=>{

  const {fluxTags}=data
  const tags_visible = Object.keys(fluxTags).length > 0

  const value_selected_parameter = (): SankeyLinkValue => {
    if(multi_selected_links.current.length==0){
      return ({} as SankeyLinkValue)
    }else{
      if ( Object.keys(data.links).length === 0 || !(multi_selected_links.current[0].idLink in data.links) ) {
        let val = JSON.parse(JSON.stringify(Object(multi_selected_links.current[0].value)))
        Object.values(tags_selected).map(tag_selected => {
          if (val[tag_selected] === undefined) {
            val[tag_selected] = {}
          }
          val = val[tag_selected]
        })
        return val
      }
      let val = JSON.parse(JSON.stringify(Object(data.links[multi_selected_links.current[0].idLink].value)))
      Object.values(tags_selected).map(tag_selected => {
        if (val[tag_selected] === undefined) {
          val[tag_selected] = {'display_value': '',tags:{},value:0}
        }
        val = val[tag_selected]
      })
      return val
    }
    
  }
  // Si le tags_group_key n'est pas (qu'il soit vide ou différent) dans la liste des keys de fluxTags, alors on met à jour en prenant le premier
  if(!Object.keys(fluxTags).includes(tags_group_key) && Object.keys(fluxTags).length>0){
    set_tags_group_key(Object.keys(fluxTags)[0])
  }
  return <Tab eventKey="tags" title={t('Noeud.tags_node.tags')}
    disabled={/*node.colorParameter !== 'groupTag'*/false} >

    {/* Groupe d'étiquettes  */}
    <Form.Group as={Row} >
      <Col xs={4}>
        <FormLabel >{t('Tags.GE')}:</FormLabel>
      </Col>
      <Col xs={8}>
        <Form.Select
          onChange={
            (evt: React.ChangeEvent<HTMLSelectElement>) => set_tags_group_key(evt.target.value)
          }>
          {Object.entries(fluxTags).map(
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

    {//Définition des valeurs selon les paramètre dataTags
      Object.entries(data.dataTags).map(([dataTagKey, dataTag]) => {
        if (Object.keys(dataTag.tags).length != 0) {
          return (
            <Row key={dataTagKey}>
              <Col xs={4} >
                <FormLabel>
                  {dataTag.group_name} :
                </FormLabel>
              </Col>

              <Col xs={8}>
                <Form.Select
                  name={dataTagKey}
                  value={tags_selected[dataTagKey]}
                  onChange={
                    (evt: React.ChangeEvent<HTMLSelectElement>) => {
                      //Modifie les paramètres selectionnés
                      const { name, value } = evt.target
                      set_tags_selected(prevState => ({
                        ...prevState,
                        [name]: value
                      }))
                    }}>
                  {Object.entries(dataTag.tags).map(([tag_key, tag]) => {
                    return (
                      <option key={tag.name} value={tag_key}>{tag.name}</option>
                    )
                  })}
                </Form.Select>
              </Col>
            </Row>
          )
        }
      })}

    <Form.Group as={Row} style={{paddingTop: '15px'}} >
      <Table striped bordered hover responsive='sm' size='sm' className='link_tags_affiliation'>
        <thead>
          <tr>
            <th>{t('Tags.Nom')}</th>
            <th>{t('Noeud.tags_node.Appartenance')}</th>
          </tr>
        </thead>
        <tbody>
          {tags_visible && tags_group_key != '' && Object.keys(fluxTags).includes(tags_group_key) && multi_selected_links.current.length!=0 ? Object.entries(fluxTags[tags_group_key].tags).map(
            ([tag_key,tag]) => {

              return (
                <tr key={tag_key}>
                  <td><FormLabel>{tag.name}</FormLabel></td>
                  <td>
                    <FormCheck
                      name={'element_visible' + tag_key}
                      checked={value_selected_parameter().tags[tags_group_key] === tag_key}
                      id={tag_key}
                      type='checkbox'
                      onChange={
                        (evt: React.ChangeEvent) => {
                          const new_nb_element = evt.target as HTMLInputElement
                          const new_tag_key = new_nb_element.id
                          const visible = new_nb_element.checked
                          Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                            let val = Object(d.value)
                            Object.values(tags_selected).forEach(tag => {
                              if (val[tag] === undefined) {
                                val[tag] = {}
                              }
                              val = val[tag]
                            })
                            val.tags[tags_group_key] = visible ? new_tag_key : ''
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
    </Form.Group>
  </Tab >
}
