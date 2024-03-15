import React, { useState } from 'react'
import { Form, Tab, OverlayTrigger, Tooltip, Row, Col } from 'react-bootstrap'
import * as d3 from 'd3'

import { MenuConfigurationLinksDataFType } from './types/SankeyMenuConfigurationLinksDataTypes'

import { ValueSelectedParameter } from '../draw/SankeyDrawFunction' 
import { ReturnValueLink,AssignLinkLocalAttribute } from './SankeyUtils'
import { SankeyNode } from '../types/Types'
/*************************************************************************************************/

export const MenuConfigurationLinksData : MenuConfigurationLinksDataFType = (
  dict_variable_application_data,
  dict_variable_elements_selected,
  applicationContext,
  additional_data_element,
  menu_for_modal,
  ComponentUpdater,
  node_function,
  link_function
) => {
  const { t } = applicationContext
  const [forceUpdate,setForceUpdate]=useState(false)
  const { data } = dict_variable_application_data
  const { multi_selected_links,displayedInputLinkValueSetterRef,displayedInputLinkValueRef  } = dict_variable_elements_selected
  const [ displayed_input_link_value, set_displayed_input_link_value ] = useState('')
  
  displayedInputLinkValueSetterRef.current.push(set_displayed_input_link_value)
  displayedInputLinkValueRef.current=displayed_input_link_value


  const newEntries = new Map(Object.entries(data.dataTags).map(([dataTagKey, dataTag]) => {
    return (Object.keys(dataTag.tags).length > 0) ? [
      dataTagKey,
      Object.entries(dataTag.tags).filter(tag => tag[1].selected).length > 0 ? Object.entries(dataTag.tags).filter(tag => tag[1].selected)[0][0] : Object.keys(dataTag.tags)[0]] : ['n', 'n']
  }))
  const dataTagsSelected = Object.fromEntries(newEntries)
  const [tags_selected, set_tags_selected] = useState(dataTagsSelected)
  if (Object.keys(tags_selected).length !== Object.keys(dataTagsSelected).length) {
    set_tags_selected(dataTagsSelected)
  }

  let is_link_data_invalid=false
  if(multi_selected_links.current.length>0){
    const curr_val=ValueSelectedParameter(dict_variable_application_data,multi_selected_links,tags_selected).value
    if(curr_val==='' && displayed_input_link_value===''){
      is_link_data_invalid=false
    }else{
      is_link_data_invalid=curr_val!==Number(displayed_input_link_value)
    }
  }

  const content=<Form >
    
    {// Définition des valeurs selon les paramètre dataTags
      Object.entries(data.dataTags).map(([dataTagKey, dataTag]) => {
        if (Object.keys(dataTag.tags).length != 0) {
          return (
            <Row className='input_row'>
              <Col>
                <Form.Label>
                  {dataTag.group_name}
                </Form.Label>
              </Col>
              <Col>
                <Form.Select
                  name={dataTagKey}
                  value={tags_selected[dataTagKey]}
                  onChange={
                    (evt: React.ChangeEvent<HTMLSelectElement>) => {
                      //Modifie les paramètres selectionnés
                      const { name, value } = evt.target
                      let tmp={}
                      // set_tags_selected( prevState => {
                      tmp= ({...tags_selected,[name]: value})
                      set_tags_selected(tmp)
                      //   return ({...prevState,[name]: value}) 
                      // } )
                      displayedInputLinkValueSetterRef.current.forEach(setter=>setter(
                        ValueSelectedParameter(
                          dict_variable_application_data,
                          multi_selected_links,
                          tmp
                        ).value as string
                      ))
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

    {/* Valeur du flux pour les parametre (flitres) choisi  */}
    <Row className='input_row' hasValidation>
      <Col>
        <Form.Label>
          {t('Flux.data.vpp')}
        </Form.Label>
      </Col>

      <Col>
        {/* Valeur du flux  */}
        <OverlayTrigger
          key={'flux.data.tooltips.1'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.data.tooltips.1'}>{t('Flux.data.tooltips.vpp')} </Tooltip>}>
          <Form.Control
            className='inputValueLink'
            type='text'
            value={displayed_input_link_value}
            isInvalid={is_link_data_invalid}
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
                const node_to_update:SankeyNode[]=[]

                multi_selected_links.current.map(d => {
                  node_to_update.push(data.nodes[d.idSource])
                  node_to_update.push(data.nodes[d.idTarget])
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
                node_function.RedrawNodes(node_to_update)
                link_function.drawLinkShape(dict_variable_application_data,dict_variable_elements_selected,applicationContext,link_function,multi_selected_links.current,ComponentUpdater)
              }
              else if(formatedValue=='') {
                let val = Object(multi_selected_links.current[0].value)
                const node_to_update:SankeyNode[]=[]
                multi_selected_links.current.map(d => {
                  node_to_update.push(data.nodes[d.idSource])
                  node_to_update.push(data.nodes[d.idTarget])
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
                node_function.RedrawNodes(node_to_update)
                link_function.drawLinkShape(dict_variable_application_data,dict_variable_elements_selected,applicationContext,link_function,multi_selected_links.current,ComponentUpdater)
              }
            }}/>
        </OverlayTrigger>
      </Col>
    </Row>
    <Form.Control.Feedback type='invalid'>{t('MEP.onBlur')}</Form.Control.Feedback>


    {/* Afficher ou non les donnée sur le Sankey  */}
    <Row className='input_row'>

      <Col>
        <Form.Label>
          {t('Flux.data.affichage')}
        </Form.Label>
      </Col>

      <Col>
        <OverlayTrigger
          key={'flux.data.tooltips.3'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'flux.data.tooltips.3'}>{t('Flux.data.tooltips.affichage')} </Tooltip>}>
          <Form.Control
            type='text'
            value={ ValueSelectedParameter(dict_variable_application_data,multi_selected_links,tags_selected).display_value}
            onChange={
              evt => {
                let val = Object(multi_selected_links.current[0].value)
                multi_selected_links.current.map(d => {
                  val = d.value
                  Object.values(tags_selected).forEach(tag => {
                    if (val[tag] === undefined) {
                      val[tag] = {}
                    }
                    val = val[tag]
                  })
                  val.display_value = evt.target.value
                })
                setForceUpdate(!forceUpdate)
                link_function.drawLinkShape(dict_variable_application_data,dict_variable_elements_selected,applicationContext,link_function,multi_selected_links.current,ComponentUpdater)

              }}/>
        </OverlayTrigger>
      </Col>
    </Row>

    {additional_data_element}

  </Form>
  return menu_for_modal?content:<Tab key="flux_data" eventKey="flux_data" className='content_editon_elements' title={t('Flux.data.données')}>{content}</Tab>
}
