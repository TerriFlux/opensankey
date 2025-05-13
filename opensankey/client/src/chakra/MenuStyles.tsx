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

import { menuAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'
const { definePartsStyle } = createMultiStyleConfigHelpers(menuAnatomy.keys)

export const menu_button_base_style = definePartsStyle({
  button: {
    height: '3rem',
    width: '4rem',
    borderRadius: '6px',
    textStyle: 'h4',
    fontSize: '9px',
    border: '0px',
    span: {
      display: 'grid',
      gridColumnGap: '0',
      gridRowGap: '0',
      padding: '0',
      margin: '0',
    },
  },
  list: {
    minWidth: 'inherit'
  },
  item: {
    display: 'grid',
    fontSize: '0.6rem',
  }
})

// Style used in subnav item droplist to limit minimum-width of item in the list
// (sometime the text of the item is short and the 'button' of the item is much larger)
export const menu_button_subnav_style = definePartsStyle({
  button: {
    color: 'gray.600',
    borderColor: 'transparent',
    bg: 'transparent',
    bgColor: 'transparent',
    'svg': {
      'height': '2rem',
      'width': '3rem'
    },
    _hover: {
      color: 'gray.600',
      borderColor: 'transparent',
      bg: 'transparent',
      bgColor: 'transparent',
    },
  },
  item: {
    gridTemplateColumns: '1.5rem auto',
    fontSize:'0.8rem',
  }
})

export const menu_button_subnav_account_style = definePartsStyle({
  button: {
    color: 'white',
    borderColor: 'primaire.2',
    bg: 'primaire.2',
    bgColor: 'primaire.2',
    span: {
      gridTemplateColumns: '2fr 1fr',
      gridTemplateRows: '1fr',
    },
    _hover: {
      color: 'white',
      borderColor: 'secondaire.2',
      bg: 'secondaire.2',
      bgColor: 'secondaire.2',
    },
  },
  item: {
    display: 'flex',
  }
})

export const menu_subnav_item_demo = definePartsStyle({
  button: {
    width: '8rem',
    margin: '0.2rem, 0rem, 0.2rem, 0.75rem',
    textStyle: 'h4',
    fontSize: '12px',
    color: 'gray.600',
    borderColor: 'transparent',
    bg: 'transparent',
    bgColor: 'transparent',
    span: {
      gridTemplateColumns: '7fr 1fr',
      gridTemplateRows: '1fr',
    },
    _hover: {
      color: 'gray.600',
      borderColor: 'transparent',
      bg: 'transparent',
      bgColor: 'transparent',
    },
  },
  list: {
    display: 'grid',
    gridAutoFlow: 'row',
  }
})


export const menu_select_elements = definePartsStyle({
  item: {
    display: 'grid',
    gridTemplateColumns: '1fr 9fr',
    gridColumnGap:'0.25rem',
    fontSize:'0.6rem',
    span: {
      margin: 0,
      padding: 0
    },
    'span.chakra-menu__icon-wrapper':{
      margin:'auto'
    },
    svg:{
      width:'0.8rem',
      height:'0.8rem',
    },
    _hover: {
      bg: 'lightgrey'
    }
  },
  list: {
    maxH: 'calc(' + (window.innerHeight) + 'px - 2rem)',
    overflowY: 'auto',
    border: 'solid 1px',
    borderColor: 'primaire.5'
  }
})

export const menu_select_style=definePartsStyle({
  list: {
    maxH: 'calc(' + (window.innerHeight) + 'px - 2rem)',
    overflowY: 'auto',
    border: 'solid 1px',
    borderColor: 'primaire.5'
  }
})

export const selector_lang=definePartsStyle({
  button:{
    margin:'auto',
    border:'1px solid',
    borderColor:'primaire.5',
    height:'1.5rem',
    width:'2rem',
    'span':{
      display:'grid',
      gridTemplateColumns:'4fr 1fr',
      alignItems:'center',
    }
  },
  item:{
    display:'grid',
    gridTemplateColumns:'1fr 3fr',
    gridColumnGap:'0.25rem',

  },
  list:{
    zIndex:'3'
  }
})