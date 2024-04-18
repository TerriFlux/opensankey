import { defineStyle } from '@chakra-ui/react'

export const button_base_style = defineStyle({
  width: '100%',
  margin: '0',
  border: 'solid 1px ',
  borderRadius: '6px',
  borderColor: 'grey.50',
  bg: 'openSankey.50',
  bgColor: 'openSankey.50',
  _hover: {
    borderColor: 'openSankey.200',
    bg: 'openSankey.200',
    bgColor: 'openSankey.200',
  },
  _disabled: {
    borderColor: 'grey.300',
    bg: 'grey.300',
    bgColor: 'grey.300',
  }
})

export const menuconfigpanel_option_button = defineStyle({
  height: '2rem',
  minWidth: '4.5rem',
  textStyle: 'h4',
  fontSize: '12px',
})

export const menuconfigpanel_option_button_right = defineStyle({
  height: '2rem',
  minWidth: '4.5rem',
  borderRadius: '0px 6px 6px 0px',
  textStyle: 'h4',
  fontSize: '12px',
})

export const menuconfigpanel_option_button_left = defineStyle({
  height: '2rem',
  minWidth: '4.5rem',
  borderRadius: '6px 0px 0px 6px',
  textStyle: 'h4',
  fontSize: '12px',
})

export const menuconfigpanel_option_button_center = defineStyle({
  height: '2rem',
  minWidth: '4.5rem',
  borderRadius: '0px',
  textStyle: 'h4',
  fontSize: '12px',
})

export const menuconfigpanel_option_button_activated = defineStyle({
  height: '2rem',
  minWidth: '4.5rem',
  textStyle: 'h4',
  fontSize: '12px',
  bg: 'openSankey.200',
  bgColor: 'openSankey.200',
})

export const menuconfigpanel_option_button_activated_right = defineStyle({
  height: '2rem',
  minWidth: '4.5rem',
  borderRadius: '0px 6px 6px 0px',
  textStyle: 'h4',
  fontSize: '12px',
  bg: 'openSankey.200',
  bgColor: 'openSankey.200',
})

export const menuconfigpanel_option_button_activated_left = defineStyle({
  height: '2rem',
  minWidth: '4.5rem',
  borderRadius: '6px 0px 0px 6px',
  textStyle: 'h4',
  fontSize: '12px',
  bg: 'openSankey.200',
  bgColor: 'openSankey.200',
})

export const menuconfigpanel_option_button_activated_center = defineStyle({
  height: '2rem',
  minWidth: '4.5rem',
  borderRadius: '0px',
  textStyle: 'h4',
  fontSize: '12px',
  bg: 'openSankey.200',
  bgColor: 'openSankey.200',
})

export const menuconfigpanel_add_button = defineStyle({
  height: '2rem',
  textStyle: 'h4',
  fontSize: '12px',
  bg: 'green.100',
  bgColor: 'green.100',
  _hover: {
    bg: 'green.200',
    bgColor: 'green.200',
  },
})

export const menuconfigpanel_del_button = defineStyle({
  height: '2rem',
  textStyle: 'h4',
  fontSize: '12px',
  bg: 'red.100',
  bgColor: 'red.100',
  _hover: {
    bg: 'red.200',
    bgColor: 'red.200',
  },
})

// Style for button in table of tags  in config menu
export const menuconfigpanel_option_btn_in_table = defineStyle({
  height: '1.5rem',
  width: '1.5rem',
  textStyle: 'h4',
  fontSize: '12px',
  padding:0
})

// Style for delete button in table of tags in config menu
export const menuconfigpanel_del_button_in_table = defineStyle({
  height: '1.5rem',
  width: '1.5rem',
  borderRadius: '6px',
  textStyle: 'h4',
  fontSize: '12px',
  padding:0,
  bg: 'red.100',
  bgColor: 'red.100',
  _hover: {
    bg: 'red.200',
    bgColor: 'red.200',
  },
})

// Style of button in the subnav (sub elements of file/Formatting/view/help ...) 
export const submenu_nav_btn = defineStyle({
  height: '2rem',
  width: '2rem',
  borderRadius: '0px',
  textStyle: 'h4',
  fontSize: '9px',
  padding:'0.2rem 0.5rem',
  border:'0px',
  bg: 'inherit',
  bgColor: 'inherit',
  display: 'grid',
  gridTemplateColumns: '2fr',
  gridTemplateRows: '1.5fr 0.5fr',
  gridColumnGap: '0.25rem',
  gridRowGap: '0',
  _hover: {
    bg: 'inherit',
    bgColor: 'inherit',
  },
})