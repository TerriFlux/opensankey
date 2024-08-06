// Standard libs
import React, {
  FunctionComponent,
  MutableRefObject,
  useRef,
  useState,
} from 'react'
import { ReactElementLike } from 'prop-types'

// Imported libs
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  InputRightAddon,
  InputGroup,
  Input,
  useBoolean,
} from '@chakra-ui/react'

// Local libs
import SankeyNodeEdition from './SankeyMenuConfigurationNodes'
import SankeyMenuConfigurationLinks from './SankeyMenuConfigurationLinks'
import { OpenSankeyConfigurationsMenusFType } from './types/SankeyMenuConfigurationTypes'

// COMPONENTS ===========================================================================

/**
 *  Define configuration menu
  *
  * @param {*} {
  *     applicationData,
  *     applicationContext,
  *     menu_configuration_layout,
  *     menu_configuration_node_tags,
  *     menu_configuration_link_tags,
  *     menu_configuration_data_tags,
  *     menu_configuration_nodes_attributes,
  *     menu_config_link_data,
  *     menu_config_link_attr,
  *     additional_accordion_edition_elements,
  *   }
  * @return {*}
  */
export const OpenSankeyConfigurationsMenus: FunctionComponent<OpenSankeyConfigurationsMenusFType> = (
  {
    applicationData,
    menu_configuration_layout,
    menu_configuration_node_tags,
    menu_configuration_link_tags,
    menu_configuration_data_tags,
    menu_configuration_nodes_attributes,
    menu_config_link_data,
    menu_config_link_attr,
    additional_accordion_edition_elements,
  }
) => {

  // Data -------------------------------------------------------------------------------

  const { t } = applicationData.new_data
  const { new_data } = applicationData
  const config_object = new_data.menu_configuration

  // Component updater ------------------------------------------------------------------

  const [ , refreshThis] = useBoolean()
  config_object.ref_to_menu_config_updater.current = refreshThis.toggle

  // JSX Component ----------------------------------------------------------------------

  const show_menu_config_tag = (
    config_object.isGivenAccordionShowed('EN') ||
    config_object.isGivenAccordionShowed('EF') ||
    config_object.isGivenAccordionShowed('ED')
  )

  const menu_items = [
    config_object.isGivenAccordionShowed('MEP') ?
      <AccordionItem>
        {
          //MENU PARAMETRE GENERAUX
        }
        <AccordionButton
          onClick={()=>{
            const scroll_x = window.scrollX
            const scroll_y = window.scrollY
            setTimeout(() => {
              document.getElementsByTagName ('html')[0]?.scrollTo(scroll_x,scroll_y)
            },50)}}
        >
          <Box
            as='span'
            layerStyle='menuconfig_entry'>
            {t('Menu.MEP')}
          </Box>
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel>
          <Box layerStyle='menuconfigpanel_grid'>
            {menu_configuration_layout}
          </Box>
        </AccordionPanel>
      </AccordionItem> :
      <></>,

    <AccordionItem>
      {
        //MENU ITEMS
      }
      <AccordionButton
        ref={config_object.ref_to_btn_accordion_config_elements}
      >
        <Box
          as='span'
          layerStyle='menuconfig_entry'>
          {t('Menu.Elements')}
        </Box>
        <AccordionIcon />
      </AccordionButton>
      <AccordionPanel>
        <Accordion
          allowToggle
          variant='accordion_sublevel_style'
        >
          <AccordionItem>
            {
              //MENU NODES
            }
            <AccordionButton
              ref={config_object.ref_to_btn_accordion_config_node}
            >
              <Box
                as='span'
                layerStyle='submenuconfig_entry'>
                {t('Menu.EdN')}
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <SankeyNodeEdition
                applicationData={applicationData}
                menu_configuration_nodes_attributes={menu_configuration_nodes_attributes}
              />
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            {
              //MENU LINKS
            }
            <AccordionButton
              ref={config_object.ref_to_btn_accordion_config_link}
            >
              <Box
                as='span'
                layerStyle='submenuconfig_entry'>
                {t('Menu.EdF')}
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <SankeyMenuConfigurationLinks
                applicationData={applicationData}
                menu_config_link_data={menu_config_link_data}
                menu_config_link_attr={menu_config_link_attr}
              />
            </AccordionPanel>
          </AccordionItem>
          {additional_accordion_edition_elements}
        </Accordion>
      </AccordionPanel>
    </AccordionItem>,

    show_menu_config_tag ?
      <AccordionItem>
        {
          //MENU ETIQUETTES
        }
        <AccordionButton
          onClick={()=>{
            const scroll_x = window.scrollX
            const scroll_y = window.scrollY
            setTimeout(() => {
              document.getElementsByTagName ('html')[0]?.scrollTo(scroll_x,scroll_y)
            },50)
          }}
        >
          <Box
            as='span'
            layerStyle='menuconfig_entry'>
            {t('Menu.Etiquettes')}
          </Box>
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel>
          <Accordion
            allowToggle
            variant="accordion_sublevel_style"
          >
            <AccordionItem
              style={{ 'display': (config_object.isGivenAccordionShowed('EN')) ? 'initial' : 'none' }}
            >
              {
                //MENU ETIQUETTES DE NOEUDS
              }
              <AccordionButton
                onClick={()=>{
                  const scroll_x = window.scrollX
                  const scroll_y = window.scrollY
                  setTimeout(() => {
                    document.getElementsByTagName ('html')[0]?.scrollTo(scroll_x,scroll_y)
                  },50)
                }}>
                <Box
                  as='span'
                  layerStyle='submenuconfig_entry'>
                  {t('Menu.EN')}
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel>
                {menu_configuration_node_tags}
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem
              style={{ 'display': (config_object.isGivenAccordionShowed('EF')) ? 'initial' : 'none' }}
            >
              {
                //MENU ETIQUETTES DE FLUX
              }
              <AccordionButton
                onClick={()=>{
                  const scroll_x = window.scrollX
                  const scroll_y = window.scrollY
                  setTimeout(() => {
                    document.getElementsByTagName ('html')[0]?.scrollTo(scroll_x,scroll_y)
                  },50)
                }}
              >
                <Box
                  as='span'
                  layerStyle='submenuconfig_entry'>
                  {t('Menu.EF')}
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel>
                {menu_configuration_link_tags}
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem
              style={{ 'display': (config_object.isGivenAccordionShowed('ED')) ? 'initial' : 'none' }}
            >
              {
                //MENU ETIQUETTES DE DONNÉES
              }
              <AccordionButton
                onClick={()=>{
                  const scroll_x = window.scrollX
                  const scroll_y = window.scrollY
                  setTimeout(() => {
                    document.getElementsByTagName ('html')[0]?.scrollTo(scroll_x,scroll_y)
                  },50)
                }}
              >
                <Box
                  as='span'
                  layerStyle='submenuconfig_entry'>
                  {t('Menu.ED')}
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel>
                {menu_configuration_data_tags}
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </AccordionPanel>
      </AccordionItem> :
      <></>
  ]

  return (
    <Accordion allowToggle>
      {menu_items.map((c: ReactElementLike, i: number) => {
        return <React.Fragment key={i}>{c}</React.Fragment>
      })}
    </Accordion>
  )
}

/**
 * Variable that define the Menu element, it's variable and function
 *
 * @type {{ data: any; set_data: any;right_menu: any; settings_edition: any; settings_edition_node_tags: any; settings_edition_link_tags: any; settings_edition_data_tags: any; ... 39 more ...; launch: any; }}
 */
export type ConfigurationMenuTypes = {
  configuration_menus: JSX.Element[],
}

export const SankeyConfigurationMenu: FunctionComponent<ConfigurationMenuTypes> = (
  {
    configuration_menus
  }
) => {

  return (
    <Accordion allowToggle>
      {configuration_menus.map((c: ReactElementLike, i: number) => {
        return <React.Fragment key={i}>{c}</React.Fragment>
      })}
    </Accordion>
  )
}

/**
 * Component developped for number input of the config menu
  * @param {*} {
  *   ref_to_set_value,
  *   function_on_blur,
  *   menu_for_style = false,
  *   minimum_value = Number.MIN_SAFE_INTEGER,
  *   maximum_value = Number.MAX_SAFE_INTEGER,
  *   stepper = false,
  *   step = 1,
  *   unit_text = undefined,
  * }
  * @return {*}
  */
export const ConfigMenuNumberInput: FunctionComponent<FCType_ConfigMenuNumberInput> = ({
  default_value,
  ref_to_set_value,
  function_on_blur,
  menu_for_style = false,
  minimum_value = Number.MIN_SAFE_INTEGER,
  maximum_value = Number.MAX_SAFE_INTEGER,
  stepper = false,
  step = 1,
  unit_text = undefined,
}) => {
  const ref_input = useRef<HTMLInputElement>(null)
  const is_modifying: MutableRefObject<NodeJS.Timeout | undefined> = useRef<NodeJS.Timeout>()
  const variant = unit_text ? 'menuconfigpanel_option_numberinput_with_right_addon' : 'menuconfigpanel_option_numberinput'
  const [value, setValue] = useState<number | null | undefined>(default_value)
  ref_to_set_value.current = setValue

  // Add stepper addon if specified
  const stepperBtn = stepper ? <NumberInputStepper>
    <NumberIncrementStepper />
    <NumberDecrementStepper />
  </NumberInputStepper> : <></>

  // Add unit addon if specified
  const input_unit = unit_text ? <InputRightAddon>{unit_text}</InputRightAddon> : <></>

  return <InputGroup>
    <NumberInput
      allowMouseWheel
      variant={variant}
      min={minimum_value}
      max={maximum_value}
      step={step}
      value={value ?? ''}
      onChange={(value_as_string, value_as_number) => {
        // Launch/reset timeout before the input auto blur (and update the value in data)
        if (!menu_for_style) {
          // reset timeout if exist
          if (is_modifying.current) {
            clearTimeout(is_modifying.current)
          }
          // launch timeout that automatically blur the input
          is_modifying.current = setTimeout(() => {
            ref_input.current?.blur()
          }, 3000)
        }
        // Update displayed value_as_number
        setValue((value_as_string !== '') ? value_as_number : null)
      }}
      onKeyDown={e=> {
        if (e.key === 'Enter') {
          ref_input.current?.blur()
        }
      }}
    >
      <NumberInputField
        ref={ref_input}
        onBlur={() => {
          if (!menu_for_style) {
            clearTimeout(is_modifying.current)
          }
          // Update selected elements value
          function_on_blur(value)
        }}
      />
      {stepperBtn}
    </NumberInput>
    {input_unit}
  </InputGroup>
}

export type FCType_ConfigMenuNumberInput = {
  default_value: number | null | undefined,
  ref_to_set_value: MutableRefObject<(_:number | null | undefined) => void>,
  function_on_blur: (val: number | null | undefined) => void,
  menu_for_style?: boolean,
  minimum_value?: number,
  maximum_value?: number,
  stepper?: boolean,
  step?: number,
  unit_text?: string
}

/**
 * Component developped for text input of the config menu
 * @param {*} {
 *   default_value,
 *   function_onChange,
 *   function_onBlur,
 *   menu_for_style = false
 * }
 * @return {*}
 */
export const ConfigMenuTextInput: FunctionComponent<FCType_ConfigMenuTextInput> = ({
  ref_to_set_value,
  function_get_value,
  function_on_blur,
  menu_for_style = false
}) => {
  const ref_input = useRef<HTMLInputElement>(null)
  const is_modifying: MutableRefObject<NodeJS.Timeout | undefined> = useRef<NodeJS.Timeout>()
  const [value, setValue] = useState<string | null | undefined>(function_get_value())
  ref_to_set_value.current = setValue

  return <InputGroup>
    <Input
      ref={ref_input}
      variant='menuconfigpanel_option_input'
      value={value ?? ''}
      onChange={evt => {
        const updated_value = evt.target.value
        // Launch/reset timeout before the input auto blur (and update the updated_value in data)
        if (!menu_for_style) {
          // reset timeout if exist
          if (is_modifying.current) {
            clearTimeout(is_modifying.current)
          }
          // launch timeout that automatically blur the input
          is_modifying.current = setTimeout(() => {
            ref_input.current?.blur()
          }, 2000)
        }
        // Update displayed updated_value
        setValue((updated_value !== '') ? updated_value : null)
      }}
      onKeyDown={e=> {
        if (e.key === 'Enter') {
          ref_input.current?.blur()
        }
      }}
      onBlur={() => {
        if (!menu_for_style) {
          clearTimeout(is_modifying.current)
        }
        // Update selected elements value
        function_on_blur(value)
      }}
    />
  </InputGroup>
}

export type FCType_ConfigMenuTextInput = {
  ref_to_set_value: MutableRefObject<(_:string | null | undefined) => void>,
  function_get_value: () => string | null | undefined,
  function_on_blur: (_: string | null | undefined) => void,
  menu_for_style?: boolean
}