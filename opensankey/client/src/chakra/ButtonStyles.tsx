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


export const button_base_style = defineStyle({
  width: '100%',
  margin: '0',
  fontSize: '0.6rem',
  color: 'white',
  minW: 'unset',
  border: 'solid 1px ',
  borderRadius: '6px',
  minWidth: 'unset',
  fill: 'white',
  path: 'white',
  borderColor: 'primaire.3',
  bg: 'primaire.3',
  bgColor: 'primaire.3',
  _active: {
    borderColor: 'tertiaire.3',
    bg: 'tertiaire.3',
    bgColor: 'tertiaire.3',
  },
  _hover: {
    borderColor: 'secondaire.3',
    bg: 'secondaire.3',
    bgColor: 'secondaire.3',
  },
  _disabled: {
    borderColor: 'gray.300',
    bg: 'gray.300',
    bgColor: 'gray.300',
  }
})

export const menuconfigpanel_option_button = defineStyle({
  height: '1.5rem',
  padding: '0.5rem',
  fontSize: 'unset',
  backgroundColor: 'white',
  color: 'tertiaire.3',
  fill: 'tertiaire.3',

  _active: {
    color: 'white  '
  }
})

export const menuconfigpanel_move_order_node_io = defineStyle({
  height: '1.5rem',
  width: '3.5rem',
  padding: '0.5rem',
  fontSize: 'unset',
  backgroundColor: 'white',
  color: 'tertiaire.3',
  fill: 'tertiaire.3',

  _active: {
    color: 'white  '
  }
})

export const menuconfigpanel_option_button_right = defineStyle({
  ...menuconfigpanel_option_button,
  borderRadius: '0px 6px 6px 0px',
})

export const menuconfigpanel_option_button_left = defineStyle({
  ...menuconfigpanel_option_button,
  borderRadius: '6px 0px 0px 6px',
})

export const menuconfigpanel_option_button_center = defineStyle({
  ...menuconfigpanel_option_button,
  borderRadius: '0px',
})

export const menuconfigpanel_option_button_activated = defineStyle({
  height: '1.5rem',
  padding: '0.5rem',
  color: 'tertiaire.3',
  fill: 'tertiaire.3',
  fontSize: 'unset',
  borderColor: 'tertiaire.3',
  border: 'solid 2px',
})

export const menuconfigpanel_option_button_activated_right = defineStyle({
  ...menuconfigpanel_option_button_activated,
  borderRadius: '0px 6px 6px 0px',
})

export const menuconfigpanel_option_button_activated_left = defineStyle({
  ...menuconfigpanel_option_button_activated,
  borderRadius: '6px 0px 0px 6px',
})

export const menuconfigpanel_option_button_activated_center = defineStyle({
  ...menuconfigpanel_option_button_activated,
  borderRadius: '0px',
})

// Style for button in table of tags  in config menu
export const menuconfigpanel_option_button_in_table = defineStyle({
  height: '1.5rem',
  width: '1.5rem',
  padding: 0
})

export const menuconfigpanel_add_button = defineStyle({
  bg: 'primaire.2',
  bgColor: 'primaire.2',
  borderColor: 'primaire.2',
  padding: '0.5rem',
  _hover: {
    bg: 'secondaire.2',
    bgColor: 'secondaire.2',
    borderColor: 'secondaire.2',
  },
  _active: {
    bg: 'secondaire.2',
    bgColor: 'secondaire.2',
    borderColor: 'secondaire.2',
  },
})

export const menuconfigpanel_del_button = defineStyle({
  borderColor: 'primaire.1',
  bg: 'primaire.1',
  bgColor: 'primaire.1',
  padding: '0.5rem',
  _hover: {
    borderColor: 'secondaire.1',
    bg: 'secondaire.1',
    bgColor: 'secondaire.1',
  },
  _active: {
    borderColor: 'secondaire.1',
    bg: 'secondaire.1',
    bgColor: 'secondaire.1',
  },
})

export const menuconfigpanel_close = defineStyle({
  height: '1.5rem',
  width: '1.5rem',
  borderColor: 'primaire.1',
  bg: 'primaire.1',
  bgColor: 'primaire.1',
  padding: '0.5rem',
  _hover: {
    borderColor: 'secondaire.1',
    bg: 'secondaire.1',
    bgColor: 'secondaire.1',
  },
  _active: {
    borderColor: 'secondaire.1',
    bg: 'secondaire.1',
    bgColor: 'secondaire.1',
  },
})

// Style for delete button in table of tags in config menu
export const menuconfigpanel_del_button_in_table = defineStyle({
  height: '1.5rem',
  width: '1.5rem',
  borderRadius: '6px',
  textStyle: 'h4',
  padding: 0,
  borderColor: 'primaire.1',
  bg: 'primaire.1',
  bgColor: 'primaire.1',
  _hover: {
    borderColor: 'secondaire.1',
    bg: 'secondaire.1',
    bgColor: 'secondaire.1',
  },
  _active: {
    borderColor: 'secondaire.1',
    bg: 'secondaire.1',
    bgColor: 'secondaire.1',
  },
})

export const template_button_reset = defineStyle({
  height: '2rem',
  minWidth: 'unset',
  width: 'unset',
  textStyle: 'h4',
  bg: 'primaire.1',
  bgColor: 'primaire.1',
  borderColor: 'primaire.1',
  _hover: {
    bg: 'secondaire.1',
    bgColor: 'secondaire.1',
    borderColor: 'secondaire.1',
  },
  _active: {
    bg: 'tertiaire.1',
    bgColor: 'tertiaire.1',
    borderColor: 'tertiaire.1',
  },
})


export const menuconfigpanel_option_button_primary = defineStyle({
  textStyle: 'h4',
  color: 'tertiaire.3',
  bg: 'none',
  bgColor: 'none',
  borderColor: 'tertiaire.3',
  border: 'solid 2px',
  _hover: {
    bg: 'secondaire.3',
    bgColor: 'secondaire.3',
    borderColor: 'secondaire.3',
  },
  _active: {
    bg: 'primaire.3',
    bgColor: 'primaire.3',
    borderColor: 'primaire.3',
  },
})

export const menuconfigpanel_option_button_primary_activated = defineStyle({
  ...menuconfigpanel_option_button_primary,
  color: 'white',
  bg: 'primaire.3',
  bgColor: 'primaire.3',
})


export const menuconfigpanel_option_button_secondary = defineStyle({
  textStyle: 'h4',
  bg: 'none',
  color: 'tertiaire.2',
  bgColor: 'none',
  borderColor: 'none',
  border: 'solid 2px',
  fill: 'white',
  stroke: 'white',
  _hover: {
    bg: 'secondaire.2',
    bgColor: 'secondaire.2',
    borderColor: 'secondaire.2',
  },
  _active: {
    color: 'white',
    bg: 'tertiaire.2',
    bgColor: 'tertiaire.2',
    borderColor: 'tertiaire.2',
  },
})




export const menuconfigpanel_option_button_secondary_activated = defineStyle({
  ...menuconfigpanel_option_button_secondary,
  color: 'white',
  bg: 'primaire.2',
  bgColor: 'primaire.2',
  borderColor: 'tertiaire.2',
})

export const menuconfigpanel_option_button_tertiary = defineStyle({
  textStyle: 'h4',
  color: 'tertiaire.4',
  bg: 'none',
  bgColor: 'none',
  borderColor: 'primaire.4',
  border: 'solid 2px',
  _hover: {
    bg: 'secondaire.4',
    bgColor: 'secondaire.4',
    borderColor: 'primaire.4',
  },
  _active: {
    bg: 'tertiaire.4',
    bgColor: 'tertiaire.4',
    borderColor: 'tertiaire.4',
  },
})

export const menuconfigpanel_option_button_tertiary_activated = defineStyle({
  ...menuconfigpanel_option_button_tertiary,
  color: 'white',
  bg: 'primaire.4',
  bgColor: 'primaire.4',
  borderColor: 'tertiaire.4',
})

export const toolbar_button_mouse_mode = defineStyle({
  bgColor: 'primaire.1',
  border: 'none',
  color: 'white',
  zIndex: 0,
  _hover: {
    bgColor: 'tertiaire.1',
    border: 'none'
  },
  _active: {
    bgColor: 'secondaire.1',
    border: 'none'
  },
})

export const toolbar_button_mouse_mode_activated = defineStyle({
  bgColor: 'secondaire.1',
  border: 'none',
  outline: '2px solid',
  outlineColor: 'secondaire.1',
  outlineOffset: '-1px',
  color: 'white',
  zIndex: 1,
  _hover: {
    bgColor: 'secondaire.1',
    borderColor: 'secondaire.1',
    border: 'none',
  },
  _active: {
    bgColor: 'secondaire.1',
    borderColor: 'secondaire.1',
    border: 'none',
  },
})

export const toolbar_button_undo_redo = defineStyle({
  bgColor: 'secondaire.3',
  borderColor: 'secondaire.2',
  color: 'white',
  _hover: {
    bgColor: 'secondaire.4',
  },
  _active: {
    bgColor: 'secondaire.4',
  },
})

export const toolbar_button_undo_redo_activated = defineStyle({
  bgColor: 'primaire.2',
  borderColor: 'secondaire.2',
  color: 'white',
  _hover: {
    bgColor: 'tertiaire.2',
    borderColor: 'secondaire.2',
  },
  _active: {
    bgColor: 'tertiaire.2',
    borderColor: 'secondaire.2',
  },
})

export const toolbar_button_2 = defineStyle({
  bgColor: 'primaire.2',
  borderColor: 'secondaire.2',
  _hover: {
    bgColor: 'tertiaire.2',
    borderColor: 'secondaire.2',
  },
  _active: {
    bgColor: 'tertiaire.2',
    borderColor: 'secondaire.2',
  },
})

export const toolbar_button_3 = defineStyle({
  bgColor: 'primaire.3',
  width: 'unset',
  height: 'unset',
  borderColor: 'secondaire.3',
  _hover: {
    bgColor: 'tertiaire.3',
    borderColor: 'secondaire.3',
  },
  _active: {
    bgColor: 'tertiaire.3',
    borderColor: 'secondaire.3',
  },
})

export const toolbar_button_5 = defineStyle({
  bgColor: 'primaire.5',
  borderColor: 'secondaire.5',
  _hover: {
    bgColor: 'tertiaire.5',
    borderColor: 'secondaire.5',
  },
  _active: {
    bgColor: 'tertiaire.5',
    borderColor: 'secondaire.5',
  },
})

export const toolbar_button_6 = defineStyle({
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

export const button_is_spreadsheet_selected = defineStyle({
  bgColor: 'primaire.5',
  borderColor: 'secondaire.5',
  _hover: {
    bgColor: 'tertiaire.5',
    borderColor: 'secondaire.5',
  },
  _active: {
    bgColor: 'tertiaire.5',
    borderColor: 'secondaire.5',
  },
})
export const button_is_spreadsheet = defineStyle({
  bgColor: 'white',
  borderColor: 'secondaire.5',
  color: 'primaire.5',
  _hover: {
    bgColor: 'tertiaire.5',
    borderColor: 'secondaire.5',
  },
  _active: {
    bgColor: 'tertiaire.5',
    borderColor: 'secondaire.5',
  },
})


export const toolbar_main_button = defineStyle({
  height: '6rem',
  bg: 'primaire.1',
  bgColor: 'primaire.1',
  borderColor: 'primaire.1',
  color: 'white',
  position: 'fixed',
  zIndex: 1,
  width: '2rem',
  padding: '0',
  _hover: {
    bgColor: 'tertiaire.1',
    borderColor: 'tertiaire.1',
  },
  _active: {
    bgColor: 'tertiaire.1',
    borderColor: 'tertiaire.1',
  },
})

// Style of button in the subnav (sub elements of file/Formatting/view/help ...)
export const menutop_button = defineStyle({
  textStyle: 'h4',
  fontSize: '9px',
  border: '0px',
  borderColor: 'transparent',
  lineHeight: 'unset',
  padding: '0',
  bg: 'transparent',
  bgColor: 'transparent',
  // Size of icon in top menu
  svg: {
    'height': '2rem',
    'width': '3rem'
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
    opacity: '0.6',
    color: 'gray.600',
    borderColor: 'transparent',
    bg: 'transparent',
    bgColor: 'transparent',
  }
})

export const menutop_button_datatags = defineStyle({
  height: '2.5rem',
  bg: 'none',
  bgColor: 'none',
  borderColor: 'none',
  color: '#4A5568',
  display: 'block',
  _hover: {
    borderColor: 'lightgrey',
    bg: 'lightgrey',
    bgColor: 'lightgrey',
  },
  _active: {
    borderColor: 'lightgrey',
    bg: 'lightgrey',
    bgColor: 'lightgrey',
  },
})

// Style for menu list in the subnav
export const menutop_button_with_dropdown = defineStyle({
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gridTemplateRows: '2fr 1fr',
  gridColumnGap: '0',
  gridRowGap: '0',
  height: '3rem',
  width: '3rem',
  borderRadius: '0px',
  textStyle: 'h4',
  fontSize: '9px',
  padding: '0.2rem',
  margin: '0rem 0rem 0rem 0.75rem',
  border: '0px',
  color: 'gray.600',
  bg: 'transparent',
  bgColor: 'transparent',
  svg: {
    margin: 'auto',
    height: '2rem'
  },
  _hover: {
    bg: 'transparent',
    bgColor: 'transparent',
  },
  _active: {
    bg: 'transparent',
    bgColor: 'transparent',
  }
})

export const menutop_button_save_in_cache = defineStyle({
  alignSelf: 'center',
  justifySelf: 'center',
  border: 'solid 1px ',
  borderRadius: '6px',
  borderColor: 'primaire.3',
  bg: 'primaire.3',
  bgColor: 'primaire.3',
  color: 'white',
  fill: 'white',
  // Size of icon in button
  'svg': {
    height: '1.5rem',
    width: '1.5rem'
  },
  _hover: {
    borderColor: 'secondaire.3',
    bg: 'secondaire.3',
    bgColor: 'secondaire.3',
  },
  _active: {
    borderColor: 'secondaire.3',
    bg: 'secondaire.3',
    bgColor: 'secondaire.3',
  },
})

export const submenu_nav_btn_dropdown_item_demo = defineStyle({
  width: 'inherit',
  textAlign: 'left',
  borderRadius: '0px',
  padding: '0.2rem',
  border: '0px',
  color: 'primaire.2',
  bg: 'inherit',
  bgColor: 'inherit',
  minWidth: 'inherit',
  _hover: {
    textDecoration: 'underline',
    bg: 'inherit',
    bgColor: 'inherit',
  },
  _active: {
    bg: 'primaire.2'
  }
})

export const contextmenu_button = defineStyle({
  display: 'flex',
  width: '100%',
  border: 'none',
  borderRadius: 'none',
  textAlign: 'left',
  justifyContent: 'left',
  color: 'grey.600',
  bg: 'none',
  bgColor: 'none',
  padding: '0 0.4rem',
  fontSize: '0.6rem',
  _hover: {
    color: 'white',
    bg: 'secondaire.2',
    bgColor: 'secondaire.2',
  },
  _active: {
    color: 'white',
    bg: 'secondaire.2',
    bgColor: 'secondaire.2',
  },
})

export const welcome_button_license_description = defineStyle({
  border: 'none',
  borderRadius: '4px',
  bg: 'openSankey.100',
  bgColor: 'openSankey.100',
  textDecoration: 'underline',
  maxW: '20vw',
  _hover: {
    bg: 'primaire.2',
    bgColor: 'primaire.2',
  },
  _active: {
    bg: 'primaire.2',
    bgColor: 'primaire.2',
  },
})

export const btn_documentation = defineStyle({
  height: '3rem',
  maxW: '11rem',
  marginLeft: '1rem',
  marginRight: '1rem',
  paddingTop: '1rem',
  paddingBottom: '1rem',
  alignSelf: 'center',
  justifySelf: 'center',
  textAlign: 'center',
  bg: 'primaire.5',
  bgColor: 'primaire.5',
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

export const button_config_element = defineStyle({
  display: 'grid',
  gridTemplateRows: '2fr',
  alignSelf: 'center',
  justifySelf: 'center',
  textAlign: 'center',
  bg: 'white',
  bgColor: 'white',
  borderColor: 'primaire.2',
  minW: 'unset',
  height: 'fit-content',
  padding: '0.2rem',


  //Icon main color
  svg: {
    gridRow: 1,
    margin: 'auto',
    stroke: 'secondaire.2',
  },
  //Text button
  fontSize: '9px',
  span: {
    gridRow: 2,
    whiteSpace: 'pre-wrap',
    color: 'primaire.2',
  },
  _hover: {
    bg: 'tertiaire.2',
    bgColor: 'tertiaire.2',
    borderColor: 'tertiaire.2',
  },
})

export const button_config_element_activated = defineStyle({
  ...button_config_element,

  bg: 'tertiaire.2',
  bgColor: 'tertiaire.2',
  borderColor: 'primaire.2',

  span: {
    ...button_config_element.span,
    color: 'white',
  },

  _hover: {
    bg: 'primaire.2',
    bgColor: 'primaire.2',
    borderColor: 'primaire.2',
  },
})

export const button_type_config = defineStyle({
  border: 'none',
  borderRadius: '4px',
  color: 'tertiaire.3',
  bgColor: 'white',
  minW: 'unset',
  fontSize: '0.8rem',
  paddingInlineStart: '0.15rem',
  paddingInlineEnd: '0.15rem',

  _hover: {
    color: 'white',
    bgColor: 'tertiaire.3'
  }
})
export const button_type_config_activated = defineStyle({
  ...button_type_config,
  color: 'white',
  bgColor: 'tertiaire.3',

  _hover: {
    color: 'tertiaire.3',
    bgColor: 'white',
  }
})

export const menu_sub_section_collapse_button = defineStyle({
  bg: 'white',
  color: 'primaire.5',
  bgColor: 'white',
  borderColor: 'primaire.5',
  _hover: {
    bg: 'lightgrey',
    bgColor: 'lightgrey',
    borderColor: 'lightgrey',
  },
  _active: {
    bg: 'lightgrey',
    bgColor: 'lightgrey',
    borderColor: 'lightgrey',
  },
})

export const text_menu_select = defineStyle({
  height: '1.5rem',
  width: '100%',
  borderRadius: '6px',
  textStyle: 'h4',
  fontSize: '0.6rem',
  background: 'none',
  backgroundColor: 'none',
  border: 'solid 1px',
  borderColor: 'primaire.5',
  color: 'primaire.5',
  display: 'grid',
  gridColumnGap: '0',
  gridRowGap: '0',
  padding: '0.2rem',
  margin: '0',
  textAlign: 'left',
  gridTemplateColumns: '9fr 1fr',

  '>span': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  'svg': {
    float: 'right'
  },
  _active: {
    color: 'white'
  },
  _hover: {
    color: 'white'
  }
})


// Styles for sizes ===========================================

export const sizeToolbarButton = defineStyle({
  width: '2rem',
  height: '2rem',
  minW: 'unset',
  padding: '0.2rem',
})

export const sizeConfigButton = defineStyle({
  width: '1.5rem',
  height: '1.5rem',
  minW: 'unset',
  padding: '0.2rem',
})

export const sizeCollapseButton = defineStyle({
  width: '1.25rem',
  height: '1.25rem',
  minW: 'unset',
  padding: '0.2rem',
  margin: 'auto'
})

export const sizeMenuTopButton = defineStyle({
  width: '3rem',
  height: '3rem',
  minW: 'unset',
  padding: '0.2rem',
  marginRight: '0.5rem',
  marginLeft: '0.5rem'
})

export const sizeMenuTopButtonSaveCache = defineStyle({
  height: '2rem',
  width: '2rem',
  minW: 'unset',
})

export const sizeButtonDialog = defineStyle({
  height: '2rem',
  minWidth: 'unset',
  padding: '0.3rem',
  fontSize: '0.8rem',
})

