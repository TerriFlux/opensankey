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


import { defineStyle } from '@chakra-ui/react'
import { menutop_button } from '../deps/OpenSankey/chakra/ButtonStyles'

export const toolbar_button_4 = defineStyle({
  bgColor: 'primaire.4',
  borderColor: 'secondaire.4',
  width: 'unset',
  height: 'unset',
  _hover: {
    bgColor: 'tertiaire.4',
    borderColor: 'secondaire.4',
  },
  _active: {
    bgColor: 'tertiaire.4',
    borderColor: 'secondaire.4',
  },
})

export const button_dataTagg_sequence_play = defineStyle({
  bgColor: 'primaire.3',
  borderColor: 'primaire.3',
  margin: '0',
  _hover: {
    bgColor: 'secondaire.3',
    borderColor: 'secondaire.3',
  },
  _active: {
    bgColor: 'secondaire.3',
    borderColor: 'secondaire.3',
  },
})

export const button_dataTagg_sequence_pause = defineStyle({
  bgColor: 'white',
  color: 'primaire.3',
  borderColor: 'secondaire.3',
  margin: '0',
  _hover: {
    bgColor: 'secondaire.3',
    borderColor: 'secondaire.3',
  },
  _active: {
    bgColor: 'secondaire.3',
    borderColor: 'secondaire.3',
  },
})
export const toolbar_button_open_filter = defineStyle({
  position: 'fixed',
  left: '0',
  zIndex: '1',
  bgColor: 'primaire.6',
  borderColor: 'secondaire.6',
  _hover: {
    bgColor: 'tertiaire.6',
    borderColor: 'secondaire.6',
  },
  _active: {
    bgColor: 'tertiaire.6',
    borderColor: 'secondaire.6',
  },
})
export const toolbar_button_open_view_banner = defineStyle({
  position: 'fixed',
  right: '0',
  zIndex: '1',
  bgColor: 'primaire.6',
  borderColor: 'secondaire.6',
  _hover: {
    bgColor: 'tertiaire.6',
    borderColor: 'secondaire.6',
  },
  _active: {
    bgColor: 'tertiaire.6',
    borderColor: 'secondaire.6',
  },
})
export const button_dataTagg_sequence_menu_play = defineStyle({
  width: '0.5rem',
  padding: '0px',
  margin: '0px',
  bgColor: 'primaire.3',
  borderColor: 'primaire.3',
  _hover: {
    bgColor: 'secondaire.3',
    borderColor: 'secondaire.3',
  },
  _active: {
    bgColor: 'secondaire.3',
    borderColor: 'secondaire.3',
  },
})

export const button_dataTagg_sequence_menu_pause = defineStyle({
  width: '2rem',
  padding: '0px',
  margin: '0px',
  bgColor: 'white',
  color: 'primaire.3',
  borderColor: 'secondaire.3',
  _hover: {
    bgColor: 'secondaire.3',
    borderColor: 'secondaire.3',
  },
  _active: {
    bgColor: 'secondaire.3',
    borderColor: 'secondaire.3',
  },
})

export const collapse_filter = defineStyle({
  bg: 'white',
  color: 'primaire.5',
  bgColor: 'white',
  margin:'auto',
  borderColor: 'primaire.5',
  _hover: {
    bg: 'secondaire.5',
    bgColor: 'secondaire.5',
    borderColor: 'secondaire.5',
  },
  _active: {
    bg: 'secondaire.5',
    bgColor: 'secondaire.5',
    borderColor: 'secondaire.5',
  },
})

export const button_collapse_banner_view = defineStyle({
  border: '0px',
  borderLeft: '1px solid black',
  borderRadius: 0,
  lineHeight: 'unset',
  padding: '0',
  margin: '0',
  color: 'grey',
  bg: 'transparent',
  bgColor: 'transparent',
  marginInlineStart: 0,
  _hover: {
    color: 'gray.600',
    bg: 'gray.100',
    bgColor: 'gray.100',
  },
  _active: {
    color: 'gray.600',
    bg: 'gray.100',
    bgColor: 'gray.100',
  },

})

export const button_banner_view = defineStyle({
  textStyle: 'h4',
  border: '0px',
  borderColor: 'transparent',
  lineHeight: 'unset',
  padding: '0',
  margin: '0',
  bg: 'transparent',
  bgColor: 'transparent',
  marginInlineStart: 0,
  svg: {
    height: '1rem',
    width: '1rem'
  },
  '.iconLocked svg': {
    position: 'absolute',
    right: '0.1em',
    bottom: '10%',
    height: '0.5rem',
    width: '0.5rem'
  },
  _hover: {
    color: 'gray.600',
    borderColor: 'transparent',
    bg: 'transparent',
    bgColor: 'transparent',
  },
  _active: {
    color: 'gray.600',
    borderColor: 'transparent',
    bg: 'transparent',
    bgColor: 'transparent',
  },
  _disabled: {
    marginInlineStart: 0,
    margin: 0,
    opacity: '0.6',
    color: 'gray.600',
    borderColor: 'transparent',
    bg: 'transparent',
    bgColor: 'transparent',
  }
})

export const menutop_button_view_activated = defineStyle({
  ...menutop_button,
  svg: {
    ...menutop_button['svg'],
    color: 'primaire.2',
    stroke: 'primaire.2',
  }

})

export const menuconfigpanel_button_load_file_da_bg=defineStyle({
  height: '1.5rem',
  width:'100%',
  padding:'0.5rem',
  fontSize: 'unset',
  backgroundColor: 'white',
  color: 'tertiaire.3',
  fill: 'tertiaire.3',

  _active:{
    color:'white  '
  }
})

export const btn_create_unitary_from_nodes=defineStyle({
  height: '1.5rem',
  padding:'0.5rem',
  fontSize: 'unset',
  backgroundColor: 'primaire.2',
  color: 'white',
  _active:{
    backgroundColor:'secondaire.2  '
  }
})


export const sizeBtnCollapseFilter=defineStyle({
  width:'1.25rem',
  height:'1.25rem',

})