import React, { FunctionComponent, MutableRefObject, useRef, useState } from 'react'
import * as d3 from 'd3'

import { MenuConfigurationLinksDataFType } from './types/SankeyMenuConfigurationLinksDataTypes'

import { ValueSelectedParameter } from '../draw/SankeyDrawFunction' 
import { AssignLinkLocalAttribute, OSTooltip } from './SankeyUtils'
import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, SankeyLink, SankeyNode, applicationDataType } from '../types/Types'
import { Box, Input, InputGroup, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper, Select } from '@chakra-ui/react'
/*************************************************************************************************/

export const MenuConfigurationLinksData : FunctionComponent<MenuConfigurationLinksDataFType> = ({
  applicationData,
  dict_variable_elements_selected,
  applicationContext,
  additional_data_element,
  ComponentUpdater,
  node_function,
  link_function
}) => {
  const { t } = applicationContext
  const [forceUpdate,setForceUpdate]=useState(false)
  const { data } = applicationData
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
                    applicationData,
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
    <OSTooltip label={t('Flux.data.tooltips.vpp')}>
      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box
          layerStyle='menuconfigpanel_option_name'
        >
          {t('Flux.data.vpp')}
        </Box>
        <ConfigLinkDataNumberInput
          applicationData={applicationData}
          multi_selected_links={multi_selected_links}
          tags_selected={tags_selected}
          node_function={node_function}
          link_function={link_function}
          ComponentUpdater={ComponentUpdater}
        
        />
      </Box>
    </OSTooltip>


    {/* Afficher ou non les donnée sur le Sankey  */}

    <OSTooltip label={t('Flux.data.tooltips.affichage')}>
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
            value={ ValueSelectedParameter(applicationData,multi_selected_links,tags_selected).display_value}
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
    </OSTooltip>

    {additional_data_element}

  </Box>
  return content
}


type ConfigLinkDataNumberInputType={
  applicationData:applicationDataType
  multi_selected_links:{current:SankeyLink[]}
  tags_selected: {[k: string]: string;}
  node_function:NodeFunctionTypes
  link_function:LinkFunctionTypes
  ComponentUpdater:ComponentUpdaterType
}
/**
 * Component developped for number input of the layout config menu
 * 
 * @param {SankeyData} data
 * @param {keyof SankeyData} var_of_data keyof of the variable we want to reference in the inputn the variable in SankeyData need to be a number
 * @param {number} minimum_value (optional, if not specified it mean the value can be undefined )
 * @param {boolean} stepper (default:false) add stepper to the input to increase or decrease the value
 * @param {boolean} hasUnit (default:false) add an addon after the input
 * @param {string} unitText (default:'') text of the addon
 * @param {function} function_onBlur function called when we leave the input, it is generally used to update the draw area
 * 
 * @return {JSX.Elmement}
 */
export const ConfigLinkDataNumberInput:FunctionComponent<ConfigLinkDataNumberInputType>=({
  applicationData,
  multi_selected_links,
  tags_selected,
  node_function,
  link_function,
  ComponentUpdater,
})=>{
  const {data}=applicationData
  const [update,setUpdate]=useState(false)
  const ref_input=useRef<HTMLInputElement>(null)
  const variantOfInput='menuconfigpanel_option_numberinput'
  const isModifying:MutableRefObject<NodeJS.Timeout|undefined>=useRef<NodeJS.Timeout>()

  const val_of_key=ValueSelectedParameter(
    applicationData,
    multi_selected_links,
    tags_selected
  )
  // Add stepper addon if specified
  const stepperBtn=<NumberInputStepper>
    <NumberIncrementStepper/>
    <NumberDecrementStepper/>
  </NumberInputStepper>

  const f_onBlur=()=>{
    node_function.RedrawNodes(Object.values(applicationData.display_nodes))
    link_function.RedrawLinks(Object.values(applicationData.display_links))
    ComponentUpdater.updateComponenSaveInCache.current(false)
  }
  return <InputGroup variant='menuconfigpanel_option_input' >
    <NumberInput allowMouseWheel 
      variant={variantOfInput} 
      step={1} 
      value={val_of_key.value}
      onChange={evt=>{
        const formatedValue=evt.replace(',','.')
        if(formatedValue!=='' && !isNaN(+formatedValue )){
          const was_empty=ValueSelectedParameter(applicationData,multi_selected_links,tags_selected).value===''
          let val = Object(multi_selected_links.current[0].value)
          const node_to_update:SankeyNode[]=[]

          multi_selected_links.current.map(d => {
            node_to_update.push(data.nodes[d.idSource])
            node_to_update.push(data.nodes[d.idTarget])
            if(was_empty){
              delete d.local?.dashed
            }
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
          
        }
        if(isModifying.current){
          clearTimeout(isModifying.current)
        }
        isModifying.current=setTimeout(()=>{
          f_onBlur()
          ref_input.current?.blur()
        },2000)
        setUpdate(!update)
      }}
      onBlur={()=>{
        clearTimeout(isModifying.current)
        f_onBlur()
      }}
    >
      <NumberInputField ref={ref_input}/>
      {stepperBtn}
    </NumberInput>
  </InputGroup>
}
