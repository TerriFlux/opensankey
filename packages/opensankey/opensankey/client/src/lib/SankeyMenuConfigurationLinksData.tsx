import React from 'react'
import { Form, Tab, OverlayTrigger, Tooltip, InputGroup } from 'react-bootstrap'
import { SankeyData, SankeyLink } from '../types/Types'
import {ValueSelectedParameter} from './SankeyDrawFunction'
import * as d3 from 'd3'
import {TFunction} from 'i18next'
import { ReturnValueLink,AssignLinkLocalAttribute,AssignLinkValueToCorrectVar } from './SankeyUtils'

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
  pre_idSource:string,
  set_pre_idSource:(s:string)=>void,
  pre_idTarget:string,
  set_pre_idTarget:(s:string)=>void,
  menu_for_modal=false,
)=>{
  let is_link_data_invalid=false
  if(multi_selected_links.current.length>0){
    const curr_val=ValueSelectedParameter(data,multi_selected_links,tags_selected).value
    if(curr_val==='' && displayed_input_link_value===''){
      is_link_data_invalid=false
    }else{
      is_link_data_invalid=curr_val!==Number(displayed_input_link_value)
    }
  }

  //Change the source of selected link
  const source_change = (changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
    if(multi_selected_links.current.length>0){
      const link = multi_selected_links.current[0]
      //Causait un problème d'acumulation de la valeur de des differents link sur des noeuds non associé
      const previous_node = data.nodes[link.idSource]
      previous_node.outputLinksId.splice(previous_node.outputLinksId.indexOf(multi_selected_links.current[0].idLink), 1)
  
      const source_node = data.nodes[changeEvent.target.value]
      link.idSource = source_node.idNode
      if (link.idSource === link.idTarget) {
        AssignLinkValueToCorrectVar(link,'recycling',true,false)
      }
      source_node.outputLinksId.push(multi_selected_links.current[0].idLink)
  
      set_data({ ...data })
    }else if(Object.keys(data.nodes).length>1){
      set_pre_idSource(changeEvent.target.value)
    }
    
  }

  const addDropSource = () => {
    if (Object.keys(data.nodes).length >= 2) {
      return (
        Object.values(data.nodes).map((n, i) => <option key={i} value={n.idNode}>{n.name}</option>)
      )
    }
  }

  const addDropCible = () => {
    if (Object.keys(data.nodes).length >= 2) {
      return (
        Object.values(data.nodes).map((n, i) => <option key={i} value={n.idNode} >{n.name}</option>)
      )
    }
  }

  //Change the target of selected link
  const target_change = (changeEvent: React.ChangeEvent<HTMLSelectElement>) => {
    if(multi_selected_links.current.length>0){
      const { nodes } = data
      const link = multi_selected_links.current[0]
      const previous_node = nodes[link.idTarget]
      previous_node.inputLinksId.splice(previous_node.inputLinksId.indexOf(multi_selected_links.current[0].idLink), 1)
  
      const target_node = nodes[changeEvent.target.value]
      link.idTarget = target_node.idNode
      if (link.idSource === link.idTarget) {
        AssignLinkValueToCorrectVar(link,'recycling',true,false)
  
      }
      target_node.inputLinksId.push(multi_selected_links.current[0].idLink)
      set_data({ ...data })
    }else if(Object.keys(data.nodes).length>1){
      set_pre_idTarget(changeEvent.target.value)
    }
   
  }

  const content=<Form >
    {/* Choix du point de départ du flux  */}
    <OverlayTrigger
      key={'Menu.tooltips.flux.src'}
      placement={'top'}
      delay={500}
      overlay={<Tooltip id={'Menu.tooltips.flux.src'}>{t('Flux.tooltips.src')} </Tooltip>}>
      <InputGroup>
        <InputGroup.Text style={{
          color:(multi_selected_links.current.length != 1)?'#666666':'',
          backgroundColor:(multi_selected_links.current.length != 1)?'#cccccc':'',
          width:'45%'}}>
          {t('Flux.src')}
        </InputGroup.Text>
        <Form.Select
          disabled={Object.keys(data.nodes).length<2}
          style={{width:'55%'}}
          onChange={source_change}
          value={(multi_selected_links.current.length>0)?multi_selected_links.current[0].idSource:pre_idSource}>
          {addDropSource()}
        </Form.Select>
      </InputGroup>
    </OverlayTrigger>

    {/* Choix du point d'arrivée du flux  */}
    <OverlayTrigger
      key={'Menu.tooltips.flux.trgt'}
      placement={'top'}
      delay={500}
      overlay={<Tooltip id={'Menu.tooltips.flux.trgt'}>{t('Flux.tooltips.trgt')} </Tooltip>}>
      <InputGroup>
        <InputGroup.Text style={{
          color:(multi_selected_links.current.length != 1)?'#666666':'',
          backgroundColor:(multi_selected_links.current.length != 1)?'#cccccc':'',
          width:'45%'}}>
          {t('Flux.trgt')}
        </InputGroup.Text>
        <Form.Select
          disabled={Object.keys(data.nodes).length<2}
          style={{width:'55%'}}
          onChange={target_change}
          value={(multi_selected_links.current.length>0)?multi_selected_links.current[0].idTarget:pre_idTarget}>
          {addDropCible()}
        </Form.Select>
      </InputGroup>
    </OverlayTrigger>

    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 1 }} />
    
    {// Définition des valeurs selon les paramètre dataTags
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
                    set_displayed_input_link_value(ValueSelectedParameter(data,multi_selected_links,tmp).value)

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
    <InputGroup hasValidation>
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
          isInvalid={is_link_data_invalid}
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
              const was_empty=ValueSelectedParameter(data,multi_selected_links,tags_selected).value===''
              let val = Object(multi_selected_links.current[0].value)
              multi_selected_links.current.map(d => {
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
              set_data({ ...data })
            }
            else if(formatedValue=='') {
              let val = Object(multi_selected_links.current[0].value)
              multi_selected_links.current.map(d => {
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
              set_data({ ...data })
            }
          }}/>
      </OverlayTrigger>
      <Form.Control.Feedback type='invalid'>{t('MEP.onBlur')}</Form.Control.Feedback>
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
          value={ValueSelectedParameter(data,multi_selected_links,tags_selected).display_value}
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
  return menu_for_modal?content:<Tab key="flux_data" eventKey="flux_data" title={t('Flux.data.données')}>{content}</Tab>
}
