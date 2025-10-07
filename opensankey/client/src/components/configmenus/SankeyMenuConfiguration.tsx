// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

// Standard libs
import React, {
  FC,
  MutableRefObject,
  useEffect,
  useRef,
  useState,
} from 'react'

// Imported libs
import {
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  InputRightAddon,
  InputGroup,
  Input,
  FormErrorMessage,
  FormControl,
} from '@chakra-ui/react'
import { TFunction } from 'i18next'

// Local libs

// COMPONENTS ===========================================================================

/**
 * Variable that define the Menu element, it's variable and function
 *
 * @type {{ data: any; set_data: any;right_menu: any; settings_edition: any; settings_edition_node_tags: any; settings_edition_link_tags: any; settings_edition_data_tags: any; ... 39 more ...; launch: any; }}
 */
// export type ConfigurationMenuTypes = {
//   configuration_menus: JSX.Element[],
// }

// export const SankeyConfigurationMenu: FC<ConfigurationMenuTypes> = (
//   {
//     configuration_menus
//   }
// ) => {

//   return (
//     <Accordion allowToggle>
//       {configuration_menus.map((c: ReactElementLike, i: number) => {
//         return <React.Fragment key={i}>{c}</React.Fragment>
//       })}
//     </Accordion>
//   )
// }

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
export const ConfigMenuNumberInput: FC<FCType_ConfigMenuNumberInput> = ({
  t,
  default_value,
  function_on_blur,
  menu_for_style = false,
  minimum_value = Number.MIN_SAFE_INTEGER,
  maximum_value = Number.MAX_SAFE_INTEGER,
  stepper = false,
  step = 1,
  unit_text = undefined,
  fixed_dec = 2,
  disabled = false,
  multiValue = false

}) => {
  const ref_input = useRef<HTMLInputElement>(null)
  const is_modifying: MutableRefObject<NodeJS.Timeout | undefined> = useRef<NodeJS.Timeout>()
  const variant = unit_text ? 'menuconfigpanel_option_numberinput_with_right_addon' : 'menuconfigpanel_option_numberinput'
  const getFixedVal = (_: string | number | null | undefined) => {
    const number_val = Number(_)
    // if val has decimal & we want a fixed number of decimal & the number is not an Integer then fix value decimal else return value(Integer or null)
    const new_fixed_value = (fixed_dec !== 0 && number_val !== null && number_val !== undefined && Math.trunc(number_val) != number_val) ? (number_val?.toFixed(fixed_dec)) : number_val
    return (String(new_fixed_value))
  }
  const fixed_value = getFixedVal(default_value)
  const [value, setValue] = useState<string | null | undefined>(default_value ? String(fixed_value) : '')
  useEffect(()=>{
    setValue(default_value ? String(fixed_value) : '')
  },[default_value])

  // Add stepper addon if specified
  const stepperBtn = stepper ? <NumberInputStepper>
    <NumberIncrementStepper />
    <NumberDecrementStepper />
  </NumberInputStepper> : <></>

  // Add unit addon if specified
  const input_unit = unit_text ? <InputRightAddon>{unit_text}</InputRightAddon> : <></>

  return <FormControl isInvalid={multiValue} >
    <InputGroup>
      <NumberInput
        allowMouseWheel
        isDisabled={disabled}
        variant={variant}
        min={minimum_value ?? undefined}
        max={maximum_value}
        step={step}
        value={value ?? ''}
        onChange={(value_as_string) => {
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
          setValue((value_as_string !== '') ? value_as_string : null)
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
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
            // Use functionOnBlur with either value null or value casted as number
            let new_value = value === null ? value : Number(value)
            if (fixed_dec > 0 && new_value !== null) {
              new_value = +new_value?.toFixed(2)
            }
            function_on_blur(new_value)
          }}
        />
        {stepperBtn}
      </NumberInput>
      {input_unit}
    </InputGroup>
    <FormErrorMessage marginTop={0} fontSize='0.5rem'>{t('Menu.multiValue')}</FormErrorMessage>
  </FormControl>
}

export const ConfigMenuNumberOrUndefinedInput: FC<FCType_ConfigMenuNumberOrUndefinedInput> = ({
  default_value,
  function_on_blur,
  menu_for_style = false,
  minimum_value = Number.MIN_SAFE_INTEGER,
  maximum_value = Number.MAX_SAFE_INTEGER,
  disabled = false,
  stepper = false,
  step = 1,
  unit_text = undefined,
}) => {
  const ref_input = useRef<HTMLInputElement>(null)
  const is_modifying: MutableRefObject<NodeJS.Timeout | undefined> = useRef<NodeJS.Timeout>()
  const variant = unit_text ? 'menuconfigpanel_option_numberinput_with_right_addon' : 'menuconfigpanel_option_numberinput'
  const getFixedVal = (_: string | number | null | undefined) => {
    return _?(String(_)):undefined
  }
  
  const [value, setValue] = useState<string | undefined | null>(getFixedVal(default_value))
  useEffect(()=>{
    setValue(getFixedVal(default_value))
  },[default_value])

  // Add stepper addon if specified
  const stepperBtn = stepper ? <NumberInputStepper>
    <NumberIncrementStepper />
    <NumberDecrementStepper />
  </NumberInputStepper> : <></>

  // Add unit addon if specified
  const input_unit = unit_text ? <InputRightAddon>{unit_text}</InputRightAddon> : <></>
  return <InputGroup>
    <NumberInput
      isDisabled={disabled}
      allowMouseWheel
      variant={variant}
      min={minimum_value}
      max={maximum_value}
      step={step}
      value={value ?? ''}
      onChange={(_, value_as_number) => {
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
        setValue(isNaN(value_as_number) ? undefined : _)
      }}
      onKeyDown={e => {
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
          const new_value = value === undefined ? null : Number(value)
          // Update selected elements value
          function_on_blur(new_value)

        }}
      />
      {stepperBtn}
    </NumberInput>
    {input_unit}
  </InputGroup>
}

export type FCType_ConfigMenuNumberInput = {
  t: TFunction,
  default_value: number | null | undefined,
  function_on_blur: (val: number | null) => void,
  menu_for_style?: boolean,
  minimum_value?: number | null,
  maximum_value?: number,
  stepper?: boolean,
  step?: number,
  unit_text?: string,
  fixed_dec?: number,
  disabled?: boolean,
  multiValue?: boolean
}

export type FCType_ConfigMenuNumberOrUndefinedInput = {
  default_value: number | undefined | null,
  function_on_blur: (val: number | null) => void,
  menu_for_style?: boolean,
  minimum_value?: number,
  maximum_value?: number,
  disabled?: boolean,
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
export const ConfigMenuTextInput: FC<FCType_ConfigMenuTextInput> = ({
  default_value,
  function_on_blur,
  menu_for_style = false,
  disabled = false,
  multiValue: multiValue = false
}) => {
  const ref_input = useRef<HTMLInputElement>(null)
  const is_modifying: MutableRefObject<NodeJS.Timeout | undefined> = useRef<NodeJS.Timeout>()
  const [value, setValue] = useState<string | null | undefined>(default_value)
  useEffect(()=>{
    setValue(default_value)
  },[default_value])

  return <FormControl isInvalid={multiValue} > <InputGroup>
    <Input
      isDisabled={disabled}
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
      onKeyDown={e => {
        if (e.key === 'Enter') {
          ref_input.current?.blur()
        }
      }}
      onBlur={() => {
        if (!menu_for_style) {
          clearTimeout(is_modifying.current)
        }
        // Update selected elements value
        function_on_blur( value??null)
      }}
    />
  </InputGroup>
  <FormErrorMessage marginTop={0} fontSize='0.5rem'>Multi value</FormErrorMessage>
  </FormControl>
}

export type FCType_ConfigMenuTextInput = {
  default_value: string | null | undefined,
  function_on_blur: (_: string | null) => void,
  menu_for_style?: boolean,
  disabled?: boolean,
  multiValue?: boolean,
}