// External imports
import React, { FunctionComponent, MutableRefObject, useRef, useState } from 'react'

import {
  Box,
  Input,
  InputGroup,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  useBoolean
} from '@chakra-ui/react'

// Local types
import {
  MenuConfigurationLinksDataFType
} from './types/SankeyMenuConfigurationLinksDataTypes'
import {
  ComponentUpdaterType,
  applicationDataType
} from '../types/Types'
import {
  Class_Tag
} from '../types/Tag'

// Local components or functions
import {
  OSTooltip
} from './SankeyUtils'
import { default_value_label_unit } from '../types/Link'
import { ConfigMenuNumberInput, ConfigMenuTextInput } from './SankeyMenuConfiguration'

/*************************************************************************************************/

export const MenuConfigurationLinksData : FunctionComponent<MenuConfigurationLinksDataFType> = ({
  applicationData,
  applicationState,
  applicationContext,
  additional_data_element,
  ComponentUpdater
}) => {
  const { t } = applicationContext
  const { new_data } = applicationData
  const [ , setForceUpdate ] = useBoolean()

  const list_data_taggs = new_data.drawing_area.sankey.data_taggs_list
  const list_links_selected = new_data.drawing_area.selected_links_list

  const { displayedInputLinkValueSetterRef,displayedInputLinkValueRef  } = applicationState
  const [ displayed_input_link_value, set_displayed_input_link_value ] = useState('')

  displayedInputLinkValueSetterRef.current.push(set_displayed_input_link_value)
  displayedInputLinkValueRef.current=displayed_input_link_value

  const content = <Box
    layerStyle='menuconfigpanel_grid'
  >
    {
      // Définition des valeurs selon les paramètre dataTags
      list_data_taggs.map(data_tagg => {
        if (data_tagg.has_tags) {
          return (<>
            <Box
              as='span'
              layerStyle='menuconfigpanel_part_title_3'
            >
              {data_tagg.name}
            </Box>
            <Select
              name={data_tagg.id}
              variant='menuconfigpanel_option_select'
              value={
                data_tagg.selected_tags_list[0]?.id ?? data_tagg.tags_list[0].id // fallback to first tag
              }
              onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
                // Update selected attributes for tags
                data_tagg.tags_list.forEach(tag => {
                  if (tag.id === evt.target.value)
                    tag.setSelected()
                  else
                    tag.setUnSelected()
                })
                // Update this menu
                setForceUpdate.toggle()
                // TODO supprimer
                // //Modifie les paramètres selectionnés
                // const { name, value } = evt.target
                // let tmp={}
                // tmp= ({...tags_selected,[name]: value})
                // set_tags_selected()
                // // Create new path to get link value
                // const path_to_link_value=Object.values(tmp) as Class_Tag[]
                // displayedInputLinkValueSetterRef.current.forEach(setter=>setter(
                //   list_links_selected[0]?.text_value
                // ))
              }}
            >
              {
                data_tagg.tags_list.map(tag => {
                  return <option key={tag.id} value={tag.id}>{tag.name}</option>
                })
              }
            </Select></>
          )
        }
      })
    }

    {/* Valeur du flux pour les parametre (filtres datatags) choisis  */}

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
        <ConfigMenuNumberInput
          default_value={list_links_selected[0]?.data_value}
          function_onChange={(_) => {
            list_links_selected.forEach(link => {
              link.data_value = _ ?? null
            })}
          }
          function_onBlur={() => setForceUpdate.toggle()}
          minimum_value={0}
          stepper={true}
          step={1}
          unit_text={
            (
              list_links_selected[0]?.value_label_unit_visible &&
              list_links_selected[0]?.value_label_unit !== default_value_label_unit
            ) ?
              list_links_selected[0]?.value_label_unit :
              undefined
          }
        />
      </Box>
    </OSTooltip>


    {/* Afficher ou non les donnée sur le Sankey  */}

    <OSTooltip label={t('Flux.data.tooltips.affichage')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name' >
          {t('Flux.data.affichage')}
        </Box>
        <ConfigMenuTextInput
          default_value={list_links_selected[0]?.text_value}
          function_onChange={(_) => {
            list_links_selected.forEach(link=>{
              link.text_value = _ ?? ''
            })
          }}
          function_onBlur={() => setForceUpdate.toggle()}
        />
      </Box>
    </OSTooltip>

    {additional_data_element}

  </Box>

  return content
}


type ConfigLinkDataNumberInputType={
  applicationData:applicationDataType
  ComponentUpdater:ComponentUpdaterType
}
/**
 * TODO A supprimer apres passe sur menus contextuels
 * Component developped for number input of the link data config menu
 * @param {applicationData} TODO
 * @param {ComponentUpdater} TODO
 * @return {JSX.Elmement}
 */
export const ConfigLinkDataNumberInput: FunctionComponent<ConfigLinkDataNumberInputType>=({
  applicationData,
  ComponentUpdater,
})=>{
  const { new_data } = applicationData
  const list_links_selected = new_data.drawing_area.selected_links_list
  const ref_input = useRef<HTMLInputElement>(null)
  const variantOfInput = 'menuconfigpanel_option_numberinput'
  const isModifying:MutableRefObject<NodeJS.Timeout|undefined>=useRef<NodeJS.Timeout>()

  // Initialise hook with first link selected value
  const [ displayed_value, setDisplayedValue ] = useState(
    () => list_links_selected[0]?.data_value)

  const f_onBlur=()=>{
    ComponentUpdater.updateComponenSaveInCache.current(false)
  }

  // Add stepper addon if specified
  const stepperBtn=<NumberInputStepper>
    <NumberIncrementStepper/>
    <NumberDecrementStepper/>
  </NumberInputStepper>

  return <InputGroup variant='menuconfigpanel_option_input' >
    <NumberInput allowMouseWheel
      variant={variantOfInput}
      step={1}
      value={ (displayed_value === null) ? undefined : displayed_value }
      onChange={(_,val)=>{
        // Launch/reset timeout before the input auto blur (and update the value in data)
        if(isModifying.current){
          clearTimeout(isModifying.current)
        }
        // launch timeout that automatically blur the input
        isModifying.current=setTimeout(()=>{
          f_onBlur()
          ref_input.current?.blur()
        },2000)
        // Update only displayed value
        setDisplayedValue(val)
      }}
      onBlur={()=>{
        clearTimeout(isModifying.current)
        list_links_selected.forEach(l=>{
          l.data_value = displayed_value
        })
        f_onBlur()
      }}
    >
      <NumberInputField ref={ref_input}/>
      {stepperBtn}
    </NumberInput>
  </InputGroup>
}