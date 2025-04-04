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

import { inputAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } = createMultiStyleConfigHelpers(inputAnatomy.keys)

export const input_base_style = definePartsStyle({
  addon: {
    height: '1.5rem',
    border: 'solid 1px ',
    fontSize:'unset',
    borderRadius: '6px',
    borderColor: 'gray.100',
    textStyle: 'h4',
    bg: 'gray.50',
    bgColor: 'gray.50',
    padding:'0.2rem',
  },
  field: {
    height: '1.5rem',
    border: 'solid 1px ',
    borderRadius: '6px',
    borderColor: 'gray.100',
    fontSize: 'unset',
    textStyle: 'h4',
    bg: 'white',
    bgColor: 'white',
    padding:'0.1rem',
    _disabled: {
      bg: 'gray.300',
      bgColor: 'gray.300'
    },
    _focus: {
      border: 'solid 2px ',
      borderColor: 'primaire.2',
    }
  },
})

export const menuconfigpanel_option_input = definePartsStyle({
  addon: {
    bg: 'gray.100',
    bgColor: 'gray.100',
  },
  field: {
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem'
  }
})

export const menuconfigpanel_option_input_table = definePartsStyle({
  addon: {
    bg: 'gray.100',
    bgColor: 'gray.100',
  },
  field: {
    paddingLeft: '0.25rem',
    paddingRight: '0.25rem',
    height:'revert',
  }
})

export const menuconfigpanel_option_input_color = definePartsStyle({
  field: {
    padding: '0.1rem'
  }
})
