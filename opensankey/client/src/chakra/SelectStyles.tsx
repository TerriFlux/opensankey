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

import { selectAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } = createMultiStyleConfigHelpers(selectAnatomy.keys)

export const select_base_style = definePartsStyle({
  field: {
    height: '2rem',
    border: 'solid 1px',
    borderRadius: '6px',
    borderColor: 'gray.50',
    textStyle: 'h4',
    bg: 'white',
    bgColor: 'white',
    _disabled: {
      bg: 'gray.300',
      bgColor: 'gray.300'
    },
    _focus: {
      border: 'solid 2px',
      borderColor: 'openSankey.100',
    }
  }
})

export const select_custom_style = definePartsStyle({
  field: {
    borderRadius: '0px 6px 6px 0px',
    fontSize: '12px'
  }
})

export const menuconfigpanel_option_select = definePartsStyle({
  field: {
    height: '2rem',
    border: 'solid 1px',
    borderRadius: '6px',
    borderColor: 'gray.50',
  }
})

// Style of selector in table of tags
export const menuconfigpanel_option_select_table = definePartsStyle({
  field: {
    paddingLeft:'0.25rem',
    height: 'revert',
    border: 'solid 1px',
    borderRadius: '6px',
    borderColor: 'gray.50',
  }
})

