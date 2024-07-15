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
} from '@chakra-ui/react'

// Local libs
import SankeyNodeEdition from './SankeyMenuConfigurationNodes'
import SankeyMenuConfigurationLinks from './SankeyMenuConfigurationLinks'
import { OpenSankeyConfigurationsMenusFType } from './types/SankeyMenuConfigurationTypes'


/**
 *  Define configuration menu
 *
 * @param { TODO type } applicationData - TODO description
 * @param { TODO type } applicationState - TODO description
 * @param { TODO type } applicationContext - TODO description
 * @param { TODO type } uiElementsRef - TODO description
 * @param { TODO type } dict_hook_ref_setter_show_dialog_components - TODO description
 * @param { TODO type } menu_configuration_layout - TODO description
 * @param { TODO type } menu_configuration_node_tags - TODO description
 * @param { TODO type } menu_configuration_link_tags - TODO description
 * @param { TODO type } menu_configuration_data_tags - TODO description
 * @param { TODO type } menu_configuration_nodes - TODO description
 * @param { TODO type } menu_configuration_links - TODO description
 * @param { TODO type } additional_accordion_edition_elements - TODO description
 * @param { TODO type } token - TODO description
 *
 */
export const OpenSankeyConfigurationsMenus: OpenSankeyConfigurationsMenusFType = (
  applicationData,
  applicationState,
  applicationContext,
  uiElementsRef,
  dict_hook_ref_setter_show_dialog_components,
  menu_configuration_layout,
  menu_configuration_node_tags,
  menu_configuration_link_tags,
  menu_configuration_data_tags,
  menu_configuration_nodes_attributes,
  menu_config_link_data,
  menu_config_link_attr,
  additional_accordion_edition_elements,
  link_function,
  ComponentUpdater,
  contextMenu,
  alt_key_pressed,
  node_function,
  additionalMenus

) => {
  const { data, new_data } = applicationData
  const config_object = new_data.menu_configuration
  const { t } = applicationContext
  const { links_accordion_ref, nodes_accordion_ref, accordion_ref } = uiElementsRef
  const { multi_selected_nodes } = applicationState
  // const {ref_setter_show_menu_config}=dict_hook_ref_setter_show_dialog_components
  const show_menu_config_tag = (
    (data.accordeonToShow.includes('EN') ||
      data.accordeonToShow.includes('EF') ||
      data.accordeonToShow.includes('ED')))
  return [
    data.accordeonToShow.includes('MEP') ?
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
        ref={config_object.btn_accordion_config_elements}
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
              ref={config_object.btn_accordion_config_node}
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
                applicationContext={applicationContext}
                applicationData={applicationData}
                applicationState={applicationState}
                menu_configuration_nodes_attributes={menu_configuration_nodes_attributes}
                link_function={link_function}
                ComponentUpdater={ComponentUpdater}
                node_function={node_function}
                additionalMenus={additionalMenus}
              />
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            {
              //MENU LINKS
            }
            <AccordionButton
              ref={config_object.btn_accordion_config_link}
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
                applicationContext={applicationContext}
                applicationState={applicationState}
                menu_config_link_data={menu_config_link_data}
                menu_config_link_attr={menu_config_link_attr}
                link_function={link_function}
                ComponentUpdater={ComponentUpdater}
                node_function={node_function}
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
              style={{ 'display': (data.accordeonToShow.includes('EN')) ? 'initial' : 'none' }}
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
              style={{ 'display': (data.accordeonToShow.includes('EF')) ? 'initial' : 'none' }}
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
              style={{ 'display': (data.accordeonToShow.includes('ED')) ? 'initial' : 'none' }}
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
 *   default_value,
 *   function_onChange,
 *   function_onBlur,
 *   menu_for_style = false,
 *   minimum_value = 0,
 *   maximum_value = 1e6,
 *   stepper = false,
 *   step = 1,
 *   unit_text = undefined,
 * }
 * @return {*}
 */
export const ConfigMenuNumberInput: FunctionComponent<FCType_ConfigMenuNumberInput> = ({
  default_value,
  function_onChange,
  function_onBlur,
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
  const [value, setValue] = useState(default_value)

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
      value={(value === null) ? undefined : value}
      onChange={(_, updated_value) => {
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
        setValue(updated_value)
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
        function_onBlur()
        // UPdate value
        function_onChange(value)
      }}
    />
      {stepperBtn}
    </NumberInput>
    {input_unit}
  </InputGroup>
}

export type FCType_ConfigMenuNumberInput = {
  default_value: number | null | undefined,
  function_onChange: (val: number | null | undefined) => void
  function_onBlur: () => void
  menu_for_style?: boolean
  minimum_value?: number
  maximum_value?: number
  stepper?: boolean
  step?: number
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
  default_value,
  function_onChange,
  function_onBlur,
  menu_for_style = false
}) => {
  const ref_input = useRef<HTMLInputElement>(null)
  const is_modifying: MutableRefObject<NodeJS.Timeout | undefined> = useRef<NodeJS.Timeout>()
  const [value, setValue] = useState(default_value)

  return <InputGroup>
    <Input
      ref={ref_input}
      variant='menuconfigpanel_option_input'
      value={(value === null) ? undefined : value}
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
        setValue(updated_value)
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
        function_onBlur()
        function_onChange(value)
      }}
    />
  </InputGroup>
}

export type FCType_ConfigMenuTextInput = {
  default_value: string | null | undefined,
  function_onChange: (_: string | null | undefined) => void
  function_onBlur: () => void
  menu_for_style?: boolean
}