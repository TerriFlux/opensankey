import React from 'react'
import { Row, Form, FormLabel, Tab, Table,Button, InputGroup } from 'react-bootstrap'
import { SankeyData, SankeyLink,SankeyLinkValue } from './types'
import { TFunction } from 'i18next'
import { FaCheck} from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

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

  return <Tab eventKey="tags" title={t('Noeud.tags_node.tags')}>

    {/* Groupe d'étiquettes  */}
    <InputGroup>
      <InputGroup.Text style={{width:'40%'}}>
        {t('Tags.GE')}
      </InputGroup.Text>
      <Form.Select
        style={{width:'60%'}}
        onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => set_tags_group_key(evt.target.value)}
        value={tags_group_key}
      >
        {Object.entries(fluxTags).map(
          (tags_group, i) =>
            <option
              key={i}
              value={tags_group[0]}>
              {tags_group[1].group_name}
            </option>)}
      </Form.Select>
    </InputGroup>

    {//Définition des valeurs selon les paramètre dataTags
      Object.entries(data.dataTags).map(([dataTagKey, dataTag]) => {
        if (Object.keys(dataTag.tags).length != 0) {
          return (
            <InputGroup>
              <InputGroup.Text style={{width:'40%'}}>
                {dataTag.group_name}
              </InputGroup.Text>
              <Form.Select
                name={dataTagKey}
                style={{width:'60%'}}
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
            </InputGroup>
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
              const is_selected=value_selected_parameter().tags[tags_group_key].includes(tag_key) 
              return (
                <tr key={tag_key}>
                  <td><FormLabel>{tag.name}</FormLabel></td>
                  <td>
                    <Button
                      size='sm'
                      name={'element_visible' + tag_key}
                      variant={is_selected?'primary':'outline-primary'}
                      id={tag_key}
                      onClick={
                        () => {
                          // const new_nb_element = evt.target as HTMLInputElement
                          // const new_tag_key = new_nb_element.id
                          const visible = !is_selected
                          Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                            let val = Object(d.value)
                            Object.values(tags_selected).forEach(tag => {
                              if (val[tag] === undefined) {
                                val[tag] = {}
                              }
                              val = val[tag]
                            })
                            if (visible) {
                              val.tags[tags_group_key].push(tag_key)
                            } else {
                              val.tags[tags_group_key].splice(val.tags[tags_group_key].indexOf(tag_key),1)
                            }
                          })
                          set_data({ ...data })
                        }
                      }>{is_selected?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
                  </td>
                </tr>
              )
            }) : (<></>)}
        </tbody>
      </Table>
    </Form.Group>
  </Tab >
}
