import React from 'react'
import { Form, Tab, OverlayTrigger, Tooltip, InputGroup } from 'react-bootstrap'
import { SankeyData, SankeyLink } from './types'
import {value_selected_parameter} from './SankeyDrawFunction'
import * as d3 from 'd3'
import { return_value_link,assign_link_local_attribute } from './SankeyUtils'
import {TFunction} from 'i18next'


export const SankeyMenuConfigurationLinksData = (
  data:SankeyData,
  tags_selected:{[k: string]: string},
  set_tags_selected:React.Dispatch<React.SetStateAction<{[k: string]: string}>>,
  // selected_link:{current:SankeyLink},
  multi_selected_links:{current:SankeyLink[]},
  set_data:(d:SankeyData)=>void,
  t:TFunction,
  additional_data_element:JSX.Element[],
  displayed_input_link_value:string,
  set_displayed_input_link_value:(s:string)=>void,
  menu_for_modal=false
)=>{

  const content=<Form >
    {
      // Définition des valeurs selon les paramètre dataTags
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
                    let tmp={}
                    set_tags_selected(prevState => {
                      tmp= ({...prevState,[name]: value})
                      return ({...prevState,[name]: value})})
                    set_displayed_input_link_value(value_selected_parameter(data,multi_selected_links,tmp).value)

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

    {/* Valeur du flux pour les parametre (flitres) choisi  */}
    <InputGroup>
      <InputGroup.Text style={{width:'40%'}}>
        {t('Flux.data.vpp')}
      </InputGroup.Text>

      {/* Valeur du flux  */}
      <OverlayTrigger
        key={'flux.data.tooltips.1'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'flux.data.tooltips.1'}>{t('Flux.data.tooltips.vpp')} </Tooltip>}>
        <Form.Control
          className='inputValueLink'
          style={{width:'60%'}}
          type='text'
          value={displayed_input_link_value}
          onChange={
            evt => {
              set_displayed_input_link_value(evt.target.value)
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
              const was_empty=value_selected_parameter(data,multi_selected_links,tags_selected).value===''
              let val = Object(multi_selected_links.current[0].value)
              multi_selected_links.current.map(d => {
                const dashed=return_value_link(data,multi_selected_links.current[0],'dashed') as boolean
                assign_link_local_attribute(d,'dashed',(was_empty)?false:dashed)
                // d.dashed=(was_empty)?false:d.dashed
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
                // d.dashed=true
                assign_link_local_attribute(d,'dashed',true)
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
          }}/>
      </OverlayTrigger>
    </InputGroup>


    {/* Afficher ou non les donnée sur le Sankey  */}
    <InputGroup>
      <InputGroup.Text style={{width:'40%'}}>
        {t('Flux.data.affichage')}
      </InputGroup.Text>
      <OverlayTrigger
        key={'flux.data.tooltips.3'}
        placement={'top'}
        delay={500}
        overlay={<Tooltip id={'flux.data.tooltips.3'}>{t('Flux.data.tooltips.affichage')} </Tooltip>}>
        <Form.Control
          style={{width:'60%'}}
          type='text'
          value={value_selected_parameter(data,multi_selected_links,tags_selected).display_value}
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
              set_data({ ...data })
            }}/>
      </OverlayTrigger>
    </InputGroup>

    {additional_data_element}

  </Form>
  return menu_for_modal?content:<Tab eventKey="flux_data" title={t('Flux.data.données')}>{content}</Tab>
}
