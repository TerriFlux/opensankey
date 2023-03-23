import React,{useState} from 'react'
import { Row, Form, Col, FormLabel, FormCheck, Tab} from 'react-bootstrap'
import { SankeyData, SankeyLink, SankeyLinkValue } from './types'
import {value_selected_parameter} from './SankeyDrawFunction'
import * as d3 from 'd3'

import {TFunction} from 'i18next'


export const SankeyMenuConfigurationLinksData = (
  data:SankeyData,
  tags_selected:{[k: string]: string},
  set_tags_selected:React.Dispatch<React.SetStateAction<{[k: string]: string}>>,
  selected_link:{current:SankeyLink},
  multi_selected_links:{current:SankeyLink[]},
  set_data:React.Dispatch<React.SetStateAction<SankeyData>>,
  t:TFunction,
  additional_data_element:JSX.Element[],
  displayed_value:string,
  set_displayed_value:(s:string)=>void

)=>{
  const isAllLinkToPrecision=(multi_selected_links:{current:SankeyLink[]},)=>{
    let toPrecision = true
    multi_selected_links.current.map(d => {
      toPrecision = (d.to_precision) ? toPrecision : false
    })
    return toPrecision
  }
  
  return <Tab eventKey="flux_data" title={t('Flux.data.données')}>
    <Form >
      {
        //Définition des valeurs selon les paramètre dataTags
        Object.entries(data.dataTags).map(([dataTagKey, dataTag]) => {
          if (Object.keys(dataTag.tags).length != 0) {
            return (
              <Row key={dataTagKey}>
                <Col >
                  <FormLabel>
                    {dataTag.group_name} :
                  </FormLabel>
                </Col>

                <Col >
                  <Form.Select
                    name={dataTagKey}
                    value={tags_selected[dataTagKey]}
                    onChange={
                      (evt: React.ChangeEvent<HTMLSelectElement>) => {
                      //Modifie les paramètres selectionnés 
                        const { name, value } = evt.target
                        set_tags_selected(prevState => ({...prevState,[name]: value}))
                      }
                    }
                  >
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
      <Col>
        <FormLabel>{t('Flux.data.vpp')}</FormLabel>
      </Col>
      <Col>
        <Form.Control
          className='inputValueLink'
          type='text'
          value={displayed_value}
          onChange={
            evt => {
              set_displayed_value(evt.target.value)
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
              let val = Object(selected_link.current.value)
              multi_selected_links.current.map(d => {
                d.dashed=(was_empty)?false:d.dashed
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

            }else if(formatedValue==''){

              let val = Object(selected_link.current.value)
              multi_selected_links.current.map(d => {
                val = d.value
                d.dashed=true
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
        />
      </Col>
      <Row>
        <Col>
          <Form.Label>{t('Flux.data.toPrecision')}</Form.Label>
        </Col>
        <Col>
  
          <FormCheck inline type='switch' checked={isAllLinkToPrecision(multi_selected_links)} onChange={evt=>{
            Object.values(data.links).filter(f => multi_selected_links.current.map(d => d.idLink).includes(f.idLink)).map(d => d.to_precision = evt.target.checked)
            set_data({...data})
          }}></FormCheck>
        </Col>
      </Row>

      
      <Row >
        <Col>
          <FormLabel>{t('Flux.data.affichage')}</FormLabel>
        </Col>
        <Col>
          <Form.Control
            type='text'
            value={value_selected_parameter(data,multi_selected_links,tags_selected).display_value}
            onChange={
              evt => {
                let val = Object(selected_link.current.value)
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
              }
            }
          />
        </Col>
      </Row>

      {additional_data_element}

    </Form>
  </Tab>
}
