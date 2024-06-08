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
  svg :{
    margin:'auto',
    height:'2.5em'
  },
  _hover: {
    bg: 'inherit',
    bgColor: 'inherit',
  },
})

// Style for menu list in the subnav
export const submenu_nav_btn_dropdown = defineStyle({
  height: '2.5rem',
  width: '3.5rem',
  borderRadius: '0px',
  textStyle: 'h4',
  fontSize: '9px',
  padding:'0.2rem',
  border:'0px',
  bg: 'inherit',
  bgColor: 'inherit',
  _hover: {
    bg: 'inherit',
    bgColor: 'inherit',
  },
  span:{
    display: 'grid',
    gridTemplateColumns: '2fr',
    gridTemplateRows: '1.5fr 0.5fr',
    gridColumnGap: '0.25rem',
    gridRowGap: '0',
    svg :{
      margin:'auto',
      height:'2.5em'
    }
  }
})

export const submenu_nav_btn_dropdown_item_demo = defineStyle({
  width: 'inherit',
  textAlign:'left',
  borderRadius: '0px',
  padding:'0.2rem',
  border:'0px',
  color:'openSankey.200',
  bg: 'inherit',
  bgColor: 'inherit',
  minWidth:'inherit',

  _hover: {
    textDecoration:'underline',
    bg: 'inherit',
    bgColor: 'inherit',
  },
  
})
export const menuconfigpanel_option_button_secondary = defineStyle({
  height: '2rem',
  minWidth: '4.5rem',
  textStyle: 'h4',
  fontSize: '12px',
  bg: 'blue.200',
  bgColor: 'blue.200',
  _hover: {
    bg: 'blue.300',
    bgColor: 'blue.300',
  },
})

export const menuconfigpanel_option_button_light = defineStyle({
  height: '2rem',
  minWidth: '4.5rem',
  textStyle: 'h4',
  fontSize: '12px',
  bg: 'none',
  bgColor: 'none',
  _hover: {
    bg: 'none',
    bgColor: 'none',
  },
})

export const menuconfigpanel_option_button_tertiary = defineStyle({
  height: '2rem',
  minWidth: '4.5rem',
  textStyle: 'h4',
  fontSize: '12px',
  bg: 'yellow.200',
  bgColor: 'yellow.200',
  _hover: {
    bg: 'yellow.300',
    bgColor: 'yellow.300',
  },
})

export const btn_mode_selection_toolbar=defineStyle({
  path:{
    fill:'white'
  },
  height:'2rem',
  width: '100%',
  margin: '0',
  border: 'solid 1px ',
  borderRadius: '6px',
  borderColor: 'grey.50',
  bg: '#4DAA57',
  bgColor: '#4DAA57',
  _hover: {
    borderColor: '#4DAA57',
    bg: '#4DAA57',
    bgColor: '#4DAA57',
  },

})

export const btn_detail_level_toolbar=defineStyle({
  path:{
    fill:'white'
  },
  height:'2rem',
  width: '100%',
  margin: '0',
  border: 'solid 1px ',
  borderRadius: '6px',
  borderColor: 'grey.50',
  bg: '#587D71',
  bgColor: '#587D71',
  _hover: {
    borderColor: '#587D71',
    bg: '#587D71',
    bgColor: '#587D71',
  },

})

export const btn_link_visual_filter_toolbar=defineStyle({
  path:{
    fill:'white'
  },
  height:'2rem',
  width: '100%',
  margin: '0',
  border: 'solid 1px ',
  borderRadius: '6px',
  borderColor: 'grey.50',
  bg: '#754668',
  bgColor: '#754668',
  _hover: {
    borderColor: '#754668',
    bg: '#754668',
    bgColor: '#754668',
  },

})

export const btn_node_link_tag_filter_toolbar=defineStyle({
  path:{
    fill:'white'
  },
  height:'2rem',
  width: '100%',
  margin: '0',
  border: 'solid 1px ',
  borderRadius: '6px',
  borderColor: 'grey.50',
  bg: '#00A6A6',
  bgColor: '#00A6A6',
  _hover: {
    borderColor: '#00A6A6',
    bg: '#00A6A6',
    bgColor: '#00A6A6',
  },

})

export const btn_data_tag_filter_toolbar=defineStyle({
  path:{
    fill:'white'
  },
  height:'2rem',
  width: '100%',
  margin: '0',
  border: 'solid 1px ',
  borderRadius: '6px',
  borderColor: 'grey.50',
  bg: '#BBDEF0',
  bgColor: '#BBDEF0',
  _hover: {
    borderColor: '#BBDEF0',
    bg: '#BBDEF0',
    bgColor: '#BBDEF0',
  },
})

export const btn_data_type_toolbar=defineStyle({
  path:{
    fill:'white'
  },
  height:'2rem',
  width: '100%',
  margin: '0',
  border: 'solid 1px ',
  borderRadius: '6px',
  borderColor: 'grey.50',
  bg: '#566E3D',
  bgColor: '#566E3D',
  _hover: {
    borderColor: '#566E3D',
    bg: '#566E3D',
    bgColor: '#566E3D',
  },
})

export const btn_stretch_toolbar=defineStyle({
  path:{
    fill:'white'
  },
  height:'2rem',
  width: '100%',
  margin: '0',
  border: 'solid 1px ',
  borderRadius: '6px',
  borderColor: 'grey.50',
  bg: 'black',
  bgColor: 'black',
  _hover: {
    borderColor: 'black',
    bg: 'black',
    bgColor: 'black',
  },
})


export const btn_fullscreen_toolbar=defineStyle({
  path:{
    fill:'white'
  },
  height:'2rem',
  width: '100%',
  margin: '0',
  border: 'solid 1px ',
  borderRadius: '6px',
  borderColor: 'grey.50',
  bg: '#0C4767',
  bgColor: '#0C4767',
  _hover: {
    borderColor: '#0C4767',
    bg: '#0C4767',
    bgColor: '#0C4767',
  },
})

export const btn_toggle_menuconfig_toolbar=defineStyle({
  path:{
    fill:'white'
  },
  height:'6rem',
  width: '100%',
  border: 'solid 1px ',
  borderRadius: '6px',
  borderColor: 'grey.50',
  bg: 'openSankey.200',
  bgColor: 'openSankey.200',
  _hover: {
    borderColor: 'openSankey.200',
    bg: 'openSankey.200',
    bgColor: 'openSankey.200',
  },
})


export const btn_is_connected=defineStyle({
  path:{
    fill:'white'
  },
  height:'2rem',
  width: '100%',
  border: 'solid 1px ',
  borderRadius: '6px',
  borderColor: 'grey.50',
  bg: 'openSankey.200',
  bgColor: 'openSankey.200',
  _hover: {
    borderColor: 'openSankey.200',
    bg: 'openSankey.200',
    bgColor: 'openSankey.200',
  },
})

export const btn_not_connected=defineStyle({
  path:{
    fill:'white'
  },
  height:'2rem',
  width: '100%',
  border: 'solid 1px ',
  borderRadius: '6px',
  borderColor: 'grey.50',
  bg: '#C42021',
  bgColor: '#C42021',
  _hover: {
    borderColor: '#C42021',
    bg: '#C42021',
    bgColor: '#C42021',
  },
})

export const btn_save_in_cache=defineStyle({
  height:'3rem',
  width: '100%',
  fontSize:'2rem',
  border: 'none',
  borderRadius: 'none',
  bg: 'none',
  bgColor: 'none',
  _hover: {
    bg: 'none',
    bgColor: 'none',
  },
})


export const btn_in_context_menu=defineStyle({
  width: '100%',
  fontSize:'0.75rem',
  border: 'none',
  borderRadius: 'none',
  textAlign:'left',
  justifyContent:'left',
  bg: 'none',
  bgColor: 'none',
  _hover: {
    bg: 'lightgrey',
    bgColor: 'lightgrey',
  },
})


export const token_blocker_activated=defineStyle({
  width: '2rem',
  fontSize:'0.75rem',
  padding:'0px',
  border: '1px solid #C42021',
  borderRadius: '4px',
  bg: '#C42021',
  bgColor: '#C42021',
  _hover: {
    bg: '#C42021',
    bgColor: '#C42021',
  },
})

export const token_blocker_deactivated=defineStyle({
  width: '2rem',
  fontSize:'0.75rem',
  padding:'0px',
  border: '1px solid #C42021',
  borderRadius: '4px',
  bg: 'none',
  bgColor: 'none',
  _hover: {
    bg: 'lightgrey',
    bgColor: 'lightgrey',
  },
})

export const btn_navigation=defineStyle({
  border: 'none',
  borderRadius: '4px',
  bg: 'none',
  bgColor: 'none',
  textDecoration:'underline',
  _hover: {
    bg: 'openSankey.50',
    bgColor: 'openSankey.50',
  },
})