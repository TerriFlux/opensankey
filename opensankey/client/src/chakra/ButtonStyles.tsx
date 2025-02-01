import { defineStyle } from '@chakra-ui/react'


export const button_base_style = defineStyle({
  width: '100%',
  margin: '0',
  border: 'solid 1px ',
  borderRadius: '6px',
  color: 'white',
  fill: 'white',
  path: 'white',
  borderColor: 'primaire.3',
  bg: 'primaire.3',
  bgColor: 'primaire.3',
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
  color: 'tertiaire.3',
  fill: 'tertiaire.3',
  borderColor: 'tertiaire.3',
  border: 'solid 2px',
})

export const menuconfigpanel_option_button_activated_right = defineStyle({
  height: '2rem',
  minWidth: '4.5rem',
  borderRadius: '0px 6px 6px 0px',
  textStyle: 'h4',
  fontSize: '12px',
  color: 'tertiaire.3',
  fill: 'tertiaire.3',
  borderColor: 'tertiaire.3',
  border: 'solid 2px',
})

export const menuconfigpanel_option_button_activated_left = defineStyle({
  height: '2rem',
  minWidth: '4.5rem',
  borderRadius: '6px 0px 0px 6px',
  textStyle: 'h4',
  fontSize: '12px',
  color: 'tertiaire.3',
  fill: 'tertiaire.3',
  borderColor: 'tertiaire.3',
  border: 'solid 2px',
})

export const menuconfigpanel_option_button_activated_center = defineStyle({
  height: '2rem',
  minWidth: '4.5rem',
  borderRadius: '0px',
  textStyle: 'h4',
  fontSize: '12px',
  color: 'tertiaire.3',
  fill: 'tertiaire.3',
  borderColor: 'tertiaire.3',
  border: 'solid 2px',
})

// Style for button in table of tags  in config menu
export const menuconfigpanel_option_button_in_table = defineStyle({
  height: '1.5rem',
  width: '1.5rem',
  textStyle: 'h4',
  fontSize: '12px',
  padding: 0
})

export const menuconfigpanel_add_button = defineStyle({
  height: '2rem',
  textStyle: 'h4',
  fontSize: '12px',
  bg: 'primaire.2',
  bgColor: 'primaire.2',
  borderColor: 'primaire.2',
  _hover: {
    bg: 'secondaire.2',
    bgColor: 'secondaire.2',
    borderColor: 'secondaire.2',
  },
})

export const menuconfigpanel_del_button = defineStyle({
  height: '2rem',
  textStyle: 'h4',
  fontSize: '12px',
  borderColor: 'primaire.1',
  bg: 'primaire.1',
  bgColor: 'primaire.1',
  _hover: {
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
  fontSize: '12px',
  padding: 0,
  borderColor: 'primaire.1',
  bg: 'primaire.1',
  bgColor: 'primaire.1',
  _hover: {
    borderColor: 'secondaire.1',
    bg: 'secondaire.1',
    bgColor: 'secondaire.1',
  },
})

export const menuconfigpanel_option_button_secondary = defineStyle({
  height: '2rem',
  minWidth: '4.5rem',
  textStyle: 'h4',
  fontSize: '12px',
  bg: 'primaire.2',
  bgColor: 'primaire.2',
  borderColor: 'primaire.2',
  _hover: {
    bg: 'secondaire.2',
    bgColor: 'secondaire.2',
    borderColor: 'secondaire.2',
  },
})

export const menuconfigpanel_option_button_secondary_activated = defineStyle({
  height: '2rem',
  minWidth: '4.5rem',
  textStyle: 'h4',
  fontSize: '12px',
  color: 'tertiaire.2',
  bg: 'primaire.2',
  bgColor: 'primaire.2',
  borderColor: 'tertiaire.2',
  border: 'solid 2px',
  _hover: {
    bg: 'secondaire.2',
    bgColor: 'secondaire.2',
    borderColor: 'secondaire.2',
  },
})

export const menuconfigpanel_option_button_tertiary = defineStyle({
  height: '2rem',
  minWidth: '4.5rem',
  textStyle: 'h4',
  fontSize: '12px',
  bg: 'primaire.4',
  bgColor: 'primaire.4',
  borderColor: 'primaire.4',
  _hover: {
    bg: 'secondaire.4',
    bgColor: 'secondaire.4',
    borderColor: 'primaire.4',
  },
})

export const menuconfigpanel_option_button_tertiary_activated = defineStyle({
  height: '2rem',
  minWidth: '4.5rem',
  textStyle: 'h4',
  fontSize: '12px',
  color: 'tertiaire.4',
  bg: 'primaire.4',
  bgColor: 'primaire.4',
  borderColor: 'tertiaire.4',
  border: 'solid 2px',
  _hover: {
    bg: 'secondaire.4',
    bgColor: 'secondaire.4',
    borderColor: 'secondaire.4',
  },
})

export const toolbar_button_1 = defineStyle({
  bgColor: 'primaire.1',
  borderColor: 'secondaire.1',
  _hover: {
    bgColor: 'tertiaire.1',
    borderColor: 'secondaire.1',
  },
})

export const toolbar_button_2 = defineStyle({
  bgColor: 'primaire.2',
  borderColor: 'secondaire.2',
  _hover: {
    bgColor: 'tertiaire.2',
    borderColor: 'secondaire.2',
  },
})

export const toolbar_button_3 = defineStyle({
  bgColor: 'primaire.3',
  borderColor: 'secondaire.3',
  _hover: {
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
})

export const toolbar_button_6 = defineStyle({
  bgColor: 'primaire.6',
  borderColor: 'secondaire.6',
  _hover: {
    bgColor: 'tertiaire.6',
    borderColor: 'secondaire.6',
  },
})

export const toolbar_main_button = defineStyle({
  height: '6rem',
  bgColor: 'primaire.1',
  borderColor: 'primaire.1',
  _hover: {
    bgColor: 'tertiaire.1',
    borderColor: 'tertiaire.1',
  },
})

// Style of button in the subnav (sub elements of file/Formatting/view/help ...)
export const menutop_button = defineStyle({
  height: '3rem',
  width: '4rem',
  textStyle: 'h4',
  fontSize: '9px',
  margin: '0rem 0rem 0rem 0.75rem',
  paddingBottom: '0.175rem',
  border: '0px',
  borderColor: 'transparent',
  bg: 'transparent',
  bgColor: 'transparent',
  _hover: {
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
  }
})

export const menutop_button_save_in_cache = defineStyle({
  padding: '0.25rem',
  alignSelf: 'center',
  justifySelf: 'center',
  height: '3rem',
  width: '4rem',
  border: 'solid 1px ',
  borderRadius: '6px',
  borderColor: 'primaire.3',
  bg: 'primaire.3',
  bgColor: 'primaire.3',
  color: 'white',
  fill: 'white',
  _hover: {
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
  width: '100%',
  border: 'none',
  borderRadius: 'none',
  textAlign: 'left',
  justifyContent: 'left',
  color: 'grey.600',
  bg: 'none',
  bgColor: 'none',
  layerStyle: 'menuconfigpanel_option_name',
  _hover: {
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
})