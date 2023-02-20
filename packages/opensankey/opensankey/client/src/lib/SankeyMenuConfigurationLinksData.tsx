import React from 'react'
import { Row, Form, Col, FormLabel, FormCheck, Tab} from 'react-bootstrap'
import { SankeyData, SankeyLink, SankeyLinkValue } from './types'

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

)=>{


  const isAllLinkToPrecision=(multi_selected_links:{current:SankeyLink[]},)=>{
    let toPrecision = true
    multi_selected_links.current.map(d => {
      toPrecision = (d.to_precision) ? toPrecision : false
    })
    return toPrecision
  }
  
  const value_selected_parameter = (): SankeyLinkValue => {
    if(multi_selected_links.current.length==0){
      return ({} as SankeyLinkValue)
    }else{
      if ( Object.keys(data.links).length === 0 || !(multi_selected_links.current[0].idLink in data.links) ) {
        console.log(multi_selected_links)
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
  
  const test_value=(v:number | null | undefined)=>{
    return ((v || v===0)&& v!==undefined) ? v:''
  }


  return <Tab eventKey="flux_data" title={t('Flux.data.données')}>
    <Form >
      {
        //Définition des valeurs selon les paramètre dataTags
        Object.entries(data.dataTags).map(([dataTagKey, dataTag]) => {
          if (Object.keys(dataTag.tags).length != 0) {
            // console.log(dataTagKey)
            // console.log(tags_selected)
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
        <FormLabel style={{color:(!value_selected_parameter().is_percent)?'#555555':'#DADADA'}}>Valeur pour ces paramètres</FormLabel>
      </Col>
      <Col>
        <Form.Control
          disabled={value_selected_parameter().is_percent}
          type='text'
          value={test_value(value_selected_parameter().value)}
          onChange={
            evt => {
              if(evt.target.value!=='' && !isNaN(+evt.target.value )){
                const was_empty=test_value(value_selected_parameter().value)===''
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
                  val.value = +evt.target.value

                })

                const scale = d3.scaleLinear()
                  .domain([0, data.user_scale])
                  .range([0, 100])
                if (scale(+evt.target.value) > 500) {
                  data.user_scale = +evt.target.value
                }
              }else{
  
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
              }
              
  
              set_data({ ...data })
            }
          }
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

      <Row>
        <Col>
          <FormCheck
            type='checkbox'
            checked={value_selected_parameter().is_percent}
            label='Valeur proportinnel à la valeur du noeuds source'
            onChange={evt=>{
              let val = Object(selected_link.current.value)
              multi_selected_links.current.map(d => {
              
                val = d.value
                Object.values(tags_selected).forEach(tag => {
                  if (val[tag] === undefined) {
                    val[tag] = {}
                  }
                  val = val[tag]
                })
                val.is_percent = evt.target.checked
  
              })
              set_data({...data})
            }}
          />
        </Col>
      </Row>
      <Row >
        <Col xs={3}>
          <FormLabel style={{color:(value_selected_parameter().is_percent)?'#555555':'#DADADA'}}>Pourcent</FormLabel>
        </Col>
        <Col xs={3}>
          <FormLabel style={{color:(value_selected_parameter().is_percent)?'#555555':'#DADADA'}}>{value_selected_parameter().percent}</FormLabel>
        </Col>
        <Col>
          <Form.Range
            disabled={!value_selected_parameter().is_percent}
            value={value_selected_parameter().percent}
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
                  val.percent = +evt.target.value
                })  
                set_data({ ...data })
              }
            }
          />
        </Col>
      </Row>
      <Row >
        <Col>
          <FormLabel>{t('Flux.data.affichage')}</FormLabel>
        </Col>
        <Col>
          <Form.Control
            type='text'
            value={value_selected_parameter().display_value}
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

    </Form>
  </Tab>
}
