import React, { useState } from 'react'
import {  OverlayTrigger, Tooltip } from 'react-bootstrap'
import * as d3 from 'd3'

import { MenuConfigurationLinksDataFType } from './types/SankeyMenuConfigurationLinksDataTypes'

import { ValueSelectedParameter } from '../draw/SankeyDrawFunction' 
import { ReturnValueLink,AssignLinkLocalAttribute } from './SankeyUtils'
import { SankeyNode } from '../types/Types'
import { Box, Input, InputGroup, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper, Select, Tab, TabPanel } from '@chakra-ui/react'
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
  const { multi_selected_links,displayedInputLinkValueSetterRef,displayedInputLinkValueRef,displayedInputLinkDataTagSetterRef  } = dict_variable_elements_selected
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
  displayedInputLinkDataTagSetterRef.current.push(set_tags_selected)
  if (Object.keys(tags_selected).length !== Object.keys(dataTagsSelected).length) {
    set_tags_selected(dataTagsSelected)
  }

  const content=<Box
    layerStyle='menuconfigpanel_grid'
  >
    {// Définition des valeurs selon les paramètre dataTags
      Object.entries(data.dataTags).map(([dataTagKey, dataTag]) => {
        if (Object.keys(dataTag.tags).length != 0) {
          return (<>
            <Box
              as='span'
              layerStyle='menuconfigpanel_part_title_3'
            >
              {dataTag.group_name}
            </Box>
            <Select
              name={dataTagKey}
              variant='menuconfigpanel_option_select'
              value={
                tags_selected[dataTagKey]
              }
              onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
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
              }}
            >
              {Object.entries(dataTag.tags).map(([tag_key, tag]) => {
                return (
                  <option key={tag.name} value={tag_key}>{tag.name}</option>
                )
              })}
            </Select></>

          )
        }
      })}
    {/* Valeur du flux pour les parametre (flitres) choisi  */}
    {/* Valeur du flux  */}
    <OverlayTrigger
      key={'flux.data.tooltips.1'}
      placement={'top'}
      delay={500}
      overlay={<Tooltip id={'flux.data.tooltips.1'}>{t('Flux.data.tooltips.vpp')} </Tooltip>}>
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box
          layerStyle='menuconfigpanel_option_name'
        >
          {t('Flux.data.vpp')}
        </Box>
        <InputGroup
          variant='menuconfigpanel_option_input'
        >
          <NumberInput
            variant='menuconfigpanel_option_numberinput'
            min={0}
            step={1}
            value={displayed_input_link_value}
            onChange={
              evt => {
                displayedInputLinkValueSetterRef.current.forEach(setter=>setter(evt))
                const formatedValue=evt.replace(',','.')
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
                node_function.RedrawNodes(Object.values(dict_variable_application_data.display_nodes))
                link_function.RedrawLinks(Object.values(dict_variable_application_data.display_links))
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
                link_function.RedrawLinks(multi_selected_links.current)
                ComponentUpdater.updateComponenSaveInCache.current(false)
                
              }
            }}
          >
            <NumberInputField/>
            <NumberInputStepper>
              <NumberIncrementStepper/>
              <NumberDecrementStepper/>
            </NumberInputStepper>
          </NumberInput>

        </InputGroup>
      </Box>
    </OverlayTrigger>


    {/* Afficher ou non les donnée sur le Sankey  */}

    <OverlayTrigger
      key={'flux.data.tooltips.3'}
      placement={'top'}
      delay={500}
      overlay={<Tooltip id={'flux.data.tooltips.3'}>{t('Flux.data.tooltips.affichage')} </Tooltip>}>
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box
          layerStyle='menuconfigpanel_option_name'
        >
          {t('Flux.data.affichage')}
        </Box>

        <InputGroup
          variant='menuconfigpanel_option_input'
        >
          <Input
            variant='menuconfigpanel_option_input'
            value={ ValueSelectedParameter(dict_variable_application_data,multi_selected_links,tags_selected).display_value}
            onChange={evt => {
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
              link_function.RedrawLinks(multi_selected_links.current)

            }}
          />
        </InputGroup>
      </Box>
    </OverlayTrigger>

    {additional_data_element}

  </Box>
  return menu_for_modal?[content]:
    [ 
      <Tab>
        <Box
          layerStyle='submenuconfig_tab'
        >
          {t('Flux.data.données')}
        </Box>
      </Tab>,
      <TabPanel >
        {content}
      </TabPanel>]
}
