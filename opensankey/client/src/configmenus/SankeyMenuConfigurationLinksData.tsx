import React, { FunctionComponent, MutableRefObject, useRef, useState } from 'react'

import { MenuConfigurationLinksDataFType } from './types/SankeyMenuConfigurationLinksDataTypes'

import { OSTooltip } from './SankeyUtils'
import { ComponentUpdaterType,  applicationDataType } from '../types/Types'
import { Box, Input, InputGroup, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper, Select, useBoolean } from '@chakra-ui/react'
/*************************************************************************************************/

export const MenuConfigurationLinksData : FunctionComponent<MenuConfigurationLinksDataFType> = ({
  applicationData,
  applicationState,
  applicationContext,
  additional_data_element,
  ComponentUpdater
}) => {
  const { t } = applicationContext
  const [,setForceUpdate]=useBoolean()
  const { new_data } = applicationData
  const entries_data_taggs=new_data.drawing_area.sankey.data_taggs_entries
  const list_links_selected=new_data.drawing_area.selected_links_list

  const { displayedInputLinkValueSetterRef,displayedInputLinkValueRef,displayedInputLinkDataTagSetterRef  } = applicationState
  const [ displayed_input_link_value, set_displayed_input_link_value ] = useState('')

  displayedInputLinkValueSetterRef.current.push(set_displayed_input_link_value)
  displayedInputLinkValueRef.current=displayed_input_link_value

  const newEntries = new Map(entries_data_taggs.map(([dataTagKey, dataTag]) => {
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
  const path_to_link_value=Object.values(tags_selected)
  const link_display_text=list_links_selected[0]?.values?.getTextForLeaf(structuredClone(path_to_link_value))

  const content=<Box
    layerStyle='menuconfigpanel_grid'
  >
    {// Définition des valeurs selon les paramètre dataTags
      entries_data_taggs.map(([dataTagKey, dataTag]) => {
        if (Object.keys(dataTag.tags).length != 0) {
          return (<>
            <Box
              as='span'
              layerStyle='menuconfigpanel_part_title_3'
            >
              {dataTag.name}
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
                tmp= ({...tags_selected,[name]: value})
                set_tags_selected(tmp)
                // Create new path to get link value
                const path_to_link_value=Object.values(tmp) as string[]
                displayedInputLinkValueSetterRef.current.forEach(setter=>setter(
                  list_links_selected[0]?.values?.getValueFromLeaf(path_to_link_value)?.toString() as string
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
          key={Object.values(tags_selected).join('&')}
          applicationData={applicationData}
          tags_selected={tags_selected}
          ComponentUpdater={ComponentUpdater}
        />
      </Box>
    </OSTooltip>


    {/* Afficher ou non les donnée sur le Sankey  */}

    <OSTooltip label={t('Flux.data.tooltips.affichage')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Flux.data.affichage')}
        </Box>

        <InputGroup variant='menuconfigpanel_option_input' >
          <Input
            variant='menuconfigpanel_option_input'
            value={link_display_text}
            onChange={evt => {
              list_links_selected.forEach(l=>{
                l.values?.setTextForLeaf(structuredClone(path_to_link_value),evt.target.value)
                l.reset()
              })
              setForceUpdate.toggle()
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
  tags_selected: {[k: string]: string;}
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
  tags_selected,
  ComponentUpdater,
})=>{
  const {new_data}=applicationData
  const list_links_selected=new_data.drawing_area.selected_links_list
  const ref_input=useRef<HTMLInputElement>(null)
  const variantOfInput='menuconfigpanel_option_numberinput'
  const isModifying:MutableRefObject<NodeJS.Timeout|undefined>=useRef<NodeJS.Timeout>()

  const path_to_link_value=Object.values(tags_selected)

  // Initialise hook with first link selected value
  const [displayed_value,setDisplayedValue]=useState(()=>list_links_selected[0]?.values?.getValueFromLeaf(path_to_link_value))



  const f_onBlur=()=>{
    ComponentUpdater.updateComponenSaveInCache.current(false)
  }
  return <InputGroup variant='menuconfigpanel_option_input' >
    <NumberInput allowMouseWheel
      variant={variantOfInput}
      step={1}
      value={displayed_value}
      onChange={(_,val)=>{
        // Launch/reset timeout before the input auto blur (and update the value in data)
        if(isModifying.current){
          clearTimeout(isModifying.current)
        }
        isModifying.current=setTimeout(()=>{
          f_onBlur()
          ref_input.current?.blur()
        },2000)

        // Update displayed value
        setDisplayedValue(val)
      }}

      onBlur={()=>{
        clearTimeout(isModifying.current)
        list_links_selected.forEach(l=>{
          l.values?.setValueForLeaf(path_to_link_value,displayed_value)
          l.reset()
        })
        f_onBlur()
      }}
    >
      <NumberInputField ref={ref_input}/>
      {stepperBtn}
    </NumberInput>
  </InputGroup>
}
// Add stepper addon if specified
const stepperBtn=<NumberInputStepper>
  <NumberIncrementStepper/>
  <NumberDecrementStepper/>
</NumberInputStepper>