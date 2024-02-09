import React, { useState } from 'react'
import { Row, Form,  Tab, InputGroup } from 'react-bootstrap'
import {SankeyLinkValue } from '../types/Types'
import { Checkbox } from '@chakra-ui/react'
import { SmoothClasses } from './SankeyUtils'
import { MenuConfigurationLinksTagsFType } from './types/SankeyMenuConfigurationLinksTagsTypes'

export const MenuConfigurationLinksTags : MenuConfigurationLinksTagsFType = (
  dict_variable_application_data,
  dict_variable_elements_selected,
  applicationContext,
  menu_for_modal
)=>{
  const {data,set_data}=dict_variable_application_data
  const {multi_selected_links}=dict_variable_elements_selected
  const {t}=applicationContext

  const newEntries = new Map(Object.entries(data.dataTags).map(([dataTagKey, dataTag]) => {
    return (Object.keys(dataTag.tags).length > 0) ? [
      dataTagKey,
      Object.entries(dataTag.tags).filter(tag => tag[1].selected).length > 0 ? Object.entries(dataTag.tags).filter(tag => tag[1].selected)[0][0] : Object.keys(dataTag.tags)[0]] : ['n', 'n']
  }))
  const tags_selected = Object.fromEntries(newEntries)

  const [tags_group_key, set_tags_group_key] = useState(Object.keys(data.fluxTags).length > 0 ? Object.keys(data.fluxTags)[0] : '')

  const {fluxTags}=data
  const tags_visible = Object.keys(fluxTags).length > 0

  const ValueSelectedParameter = (): SankeyLinkValue => {
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
  const content =<>
    <h4 style={{fontSize:'14px' ,fontWeight:'bold',textDecoration:'underline'}}>{t('Menu.EF')}</h4>

    {/* Groupe d'étiquettes  */}
    <InputGroup>
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
                  (/*evt: React.ChangeEvent<HTMLSelectElement>*/) => {
                    //Modifie les paramètres selectionnés
                    //const { name, value } = evt.target
                    //let tmp={}
                    // set_tags_selected( prevState => {
                    //tmp= ({...tags_selected,[name]: value}) //TODO
                    // set_tags_selected(prevState => ({
                    //   ...prevState,
                    //   [name]: value
                    // }))
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

    <Form.Group as={Row} style={{margin: 'auto'}} >
      {tags_visible && tags_group_key != '' && Object.keys(fluxTags).includes(tags_group_key) && multi_selected_links.current.length!=0 ? Object.entries(fluxTags[tags_group_key].tags).map(
        ([tag_key,tag]) => {
          const is_selected= ValueSelectedParameter().tags[tags_group_key] && ValueSelectedParameter().tags[tags_group_key].includes(tag_key) 
          return (
            <Checkbox 
              sx={SmoothClasses({})}
              isChecked={is_selected}
              onChange={(evt) => {
                const visible = evt.target.checked
                Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => {
                  let val = Object(d.value)
                  Object.values(tags_selected).forEach(tag => {
                    if (val[tag] === undefined) {
                      val[tag] = {}
                    }
                    val = val[tag]
                  })
                  if (visible) {
                    if(val.tags[tags_group_key]===undefined){
                      val.tags[tags_group_key]=[]
                    }
                    val.tags[tags_group_key].push(tag_key)
                  } else {
                    val.tags[tags_group_key].splice(val.tags[tags_group_key].indexOf(tag_key),1)
                  }
                })
                set_data({ ...data })
              }}>
              {tag.name}
            </Checkbox>
          )
        }) : (<></>)}
    </Form.Group></>
    
  return menu_for_modal?content: <Tab key="tags" eventKey="tags" className='content_editon_elements' title={t('Noeud.tags_node.tags')}>
    {content}
  </Tab >
}
