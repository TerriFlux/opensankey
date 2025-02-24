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

import { numberInputAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } = createMultiStyleConfigHelpers(numberInputAnatomy.keys)

export const numberinput_base_style = definePartsStyle({
  root: {
    width: '100%'
  },
  field: {
    width: '100%',
    height: '2rem',
    border: 'solid 1px ',
    borderRadius: '6px',
    borderColor: 'gray.100',
    textStyle: 'h4',
    bg: 'white',
    bgColor: 'white',
    _disabled: {
      bg: 'gray.300',
      bgColor: 'gray.300'
    },
    _focus: {
      border: 'solid 2px ',
      borderColor: 'primaire.2',
    }
  }
})

export const menuconfigpanel_option_numberinput = definePartsStyle({
  field: {
    fontSize: '12px',
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem'
  }
})

export const menuconfigpanel_option_numberinput_with_right_addon = definePartsStyle({
  field: {
    borderRadius: '6px 0px 0px 6px',
    fontSize: '12px',
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem',
  }
})