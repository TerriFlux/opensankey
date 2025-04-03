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

import { checkboxAnatomy } from '@chakra-ui/anatomy'
import {
  createMultiStyleConfigHelpers
} from '@chakra-ui/react'

const { definePartsStyle } = createMultiStyleConfigHelpers(checkboxAnatomy.keys)

export const checkbox_base_style = definePartsStyle({
  container: {
    h: '2rem',
    w: '100%',
    border: 'solid 1px ',
    borderRadius: '6px',
    borderColor: 'gray.50',
    margin: '0',
    padding: '0',
    transition: 'all 150ms',
    _checked: {
      bg: 'white'
    },
    _hover: {
      bg: 'primaire.5',
      color: 'white',
      transition: 'all 250ms',
    },
  },
  control: {
    margin: '0.25rem',
    width: '0.75rem',
    height: '0.75rem',
    bg: 'gray.400',
    borderColor: 'gray.400',
    iconColor: 'white',
    border: 'solid 1px ',
    borderRadius: '4px',
    _checked: {
      bg: 'primaire.3',
      borderColor: 'primaire.3',
      iconColor: 'primaire.2',
      _hover: {
        bg: 'gray.400',
        borderColor: 'gray.400',
        iconColor: 'white',
      }
    },
    _hover: {
      bg: 'primaire.3',
      borderColor: 'primaire.3',
      iconColor: 'primaire.2',
    }
  },
  label: {
    width:'100%',
    margin: '0',
  }
})

export const menuconfigpanel_option_checkbox = definePartsStyle({
  label:{
    fontSize: 'unset',
    width:'100%',
    svg:{
      marginRight:'0.2rem',
    },
  },
  control:{
    w:'0.75rem',
    h:'0.75rem',
  },
  container: {
    h:'1.5rem',
    border: '0px',
    borderRadius: '4px',
    borderColor: 'white',
  },
})

export const menuconfigpanel_tag_checkbox = definePartsStyle({
  container: {
    border: '0px',
    borderRadius: '4px',
    borderColor: 'white',
  },
  label: {
    marginLeft: '0.5rem',
    fontSize: '14px'
  },
  control: {
    marginLeft: '1.25rem',
  }
})

export const menuconfigpanel_part_title_1_checkbox = definePartsStyle({
  label: {
    textAlign: 'center',
    // Same font as textStyle : title_sub_section
    fontSize:'0.7rem',
    fontWeight:'bold',
    svg:{
      marginRight:'0.2rem'
    }
  },
  control:{
    width: '1.25rem',
    height: '1.25rem',
  }
})


export const activate_antagonist_checkbox = definePartsStyle({
  container: {
    margin:'auto',
    width:'inherit',
  }
})

export const checkbox_dont_show_again = definePartsStyle({
  container: {
    w: 'inherit',
    border: 'none',
    margin: 'auto',
    padding: '0',
    transition: 'all 150ms',
    _checked: {
      bg: 'white'
    },
    _hover: {
      bg: 'primaire.5',
      transition: 'all 250ms',
    },
  },
  control: {
    margin: '0.25rem',
    width: '1rem',
    height: '1rem',
    bg: 'gray.400',
    borderColor: 'gray.400',
    iconColor: 'white',
    border: 'solid 1px ',
    _checked: {
      bg: 'primaire.3',
      borderColor: 'primaire.3',
      iconColor: 'primaire.2',
      _hover: {
        bg: 'gray.400',
        borderColor: 'gray.400',
        iconColor: 'white',
      }
    },
    _hover: {
      bg: 'primaire.3',
      borderColor: 'primaire.3',
      iconColor: 'primaire.2',
    }
  },
  label: {
    width:'inherit',
    margin: 'auto',
    fontSize: '12px',
    textStyle: 'h4',
  }
})