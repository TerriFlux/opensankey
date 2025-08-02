

import { drawerAnatomy, sliderAnatomy } from '@chakra-ui/anatomy'
import { tagAnatomy } from '@chakra-ui/anatomy'
import { tabsAnatomy } from '@chakra-ui/anatomy'
import { tableAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'
import { defineStyle } from '@chakra-ui/react'
import { selectAnatomy } from '@chakra-ui/anatomy'
import { popoverAnatomy } from '@chakra-ui/anatomy'
import { numberInputAnatomy } from '@chakra-ui/anatomy'
import { accordionAnatomy } from '@chakra-ui/anatomy'
import { cardAnatomy } from '@chakra-ui/anatomy'
import { checkboxAnatomy } from '@chakra-ui/anatomy'
import { breadcrumbAnatomy } from '@chakra-ui/anatomy'
import { inputAnatomy } from '@chakra-ui/anatomy'
import { editableAnatomy } from '@chakra-ui/anatomy'
import { menuAnatomy } from '@chakra-ui/anatomy'
import { modalAnatomy } from '@chakra-ui/anatomy'
import { extendTheme } from '@chakra-ui/react'

const tag = createMultiStyleConfigHelpers(tagAnatomy.keys)
const slider = createMultiStyleConfigHelpers(sliderAnatomy.keys)
const tabs = createMultiStyleConfigHelpers(tabsAnatomy.keys)
const table = createMultiStyleConfigHelpers(tableAnatomy.keys)
const select = createMultiStyleConfigHelpers(selectAnatomy.keys)
const popover = createMultiStyleConfigHelpers(popoverAnatomy.keys)
const numberInput = createMultiStyleConfigHelpers(numberInputAnatomy.keys)
const accordion = createMultiStyleConfigHelpers(accordionAnatomy.keys)
const card = createMultiStyleConfigHelpers(cardAnatomy.keys)
const checkbox = createMultiStyleConfigHelpers(checkboxAnatomy.keys)
const breadcrumb = createMultiStyleConfigHelpers(breadcrumbAnatomy.keys)
const drawer= createMultiStyleConfigHelpers(drawerAnatomy.keys)
const input = createMultiStyleConfigHelpers(inputAnatomy.keys)
const edit = createMultiStyleConfigHelpers(editableAnatomy.keys)
const menu = createMultiStyleConfigHelpers(menuAnatomy.keys)
const modal = createMultiStyleConfigHelpers(modalAnatomy.keys)

export const heading_base_style=defineStyle({
})
export const heading_welcome_style = defineStyle({
  textAlign:'center',
  fontSize:'2rem',
  color:'openSankey.400'
})

export const heading_template_dashboard = defineStyle({
  textAlign:'center',
  fontSize:'2rem',
  textStyle:'h2',
})

export const heading_template_sankey = defineStyle({
  textAlign:'center',
  fontSize:'1.3rem',
  textStyle:'h2',
})

export const heading_tab_pref=defineStyle({
  textAlign:'center',
  fontSize:'1.3rem',
  textStyle:'h2',
})


export const modal_base_style = modal.definePartsStyle({
  header: {
    height: 'fit-content',
    textStyle: 'h1',
    color: 'white',
    background: 'primaire.2',
    borderRadius: '6px',
    paddingRight: '5rem'
  },
  closeButton: {
    right: '1rem',
    top: '1rem'
  },
  dialog: {
    width: '75vw',
    height: '75vh',
    display: 'grid',
    gridGap: '1rem',
    padding: '0.25rem',
    gridTemplateRows: '3rem auto'
  },
  body: {
    display: 'block',
    width: '100%',
    height: 'calc(75vh - 5rem)',
    padding: '0.25rem',
  }
})

export const modal_dialog = modal.definePartsStyle({
  dialog:{
    width: 'fit-content',
    height: 'fit-content',
  },
  body:{
    width: 'fit-content',
    height: 'fit-content',
    margin: '1rem'
  },
  header: {
    width: '100%'
  },
  footer: {
    justifyContent: 'center',
  }
})

export const modal_welcome = modal.definePartsStyle({
  closeButton: {
    right: '0.65rem',
    top: '0.65rem'
  },
  footer: {
    height: '3rem',
  }
})

export const modal_documentation = modal.definePartsStyle({
  overlay: {
    opacity: 0.3
  },
  // dialogContainer: {
  //   background: 'blackAlpha.500'
  // },
  dialog:{
    width:'max-content',
    height:'max-content',
    alignSelf: 'center',
  },
  body: {
    width:'max-content',
    height:'max-content',
    minWidth: 0,
  },
  footer: {
    height: 'fit-content',
    padding: '0'
  }
})

export const modal_select_unit_from_data = modal.definePartsStyle({
  body :{
    '.rd3t-tree-container':{
      height:'80vh'
    }
  }
})
export const modal_select_unit_from_excel = modal.definePartsStyle({
  body :{
    '.rd3t-tree-container':{
      height:'50vh'
    }
  }
})

export const menu_button_base_style = menu.definePartsStyle({
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
export const menu_button_subnav_style = menu.definePartsStyle({
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

export const menu_button_subnav_account_style = menu.definePartsStyle({
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

export const menu_subnav_item_demo = menu.definePartsStyle({
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


export const menu_select_elements = menu.definePartsStyle({
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

export const menu_select_style=menu.definePartsStyle({
  list: {
    maxH: 'calc(' + (window.innerHeight) + 'px - 2rem)',
    overflowY: 'auto',
    border: 'solid 1px',
    borderColor: 'primaire.5'
  }
})

export const selector_lang=menu.definePartsStyle({
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

// Define the base component styles
export const editable_base_style = edit.definePartsStyle({
})

export const name_file_editable = edit.definePartsStyle({
  preview: {
    display: 'block',
    alignItems: 'center',
    paddingLeft:'1rem',
    paddingRight:'1rem',
    height: '2rem',
    fontSize: '1rem',
    bg: 'primaire.3',
    border: '1px solid',
    borderColor: 'primaire.3',
    color: 'white',
    maxW: '15rem',
    minW: '8rem',
    width: 'unset',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  input: {
    display: 'block',
    height: '2rem',
    fontSize: '1rem',
    bg: 'primaire.3',
    border: '1px solid',
    borderColor: 'primaire.3',
    color: 'white',
    maxW: '15rem',
    minW: '8rem',
    width: 'unset',
    overflow: 'visible',
    // textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  _active: {
    secondaire: 'primaire.3',
  }
})

export const edit_name_palette=edit.definePartsStyle({
  preview:{
    fontSize:'0.8rem',
    width:'100%',
    padding:'0',
    height:'1.5rem',
    border:'1px solid',
    borderColor:'primaire.5',
  },
  input:{
    fontSize:'0.8rem',
    height:'1.5rem',
    border:'1px solid',
    borderColor:'primaire.5'
  }
})

export const input_base_style = input.definePartsStyle({
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

export const menuconfigpanel_option_input = input.definePartsStyle({
  addon: {
    bg: 'gray.100',
    bgColor: 'gray.100',
  },
  field: {
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem'
  }
})

export const menuconfigpanel_option_input_table = input.definePartsStyle({
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

export const menuconfigpanel_option_input_color = input.definePartsStyle({
  field: {
    padding: '0.1rem'
  }
})

// Define the base component styles
export const drawer_base_style = drawer.definePartsStyle({})

// Style for the drawer containing the configuration menu
export const drawer_menu_config = drawer.definePartsStyle({
  dialog: {
    maxWidth: 'inherit',
    borderRadius: '4px',
    background: 'none',
    boxShadow: 'unset',
    height:'fit-content',
    overflowY:'unset',
  },
  dialogContainer: {
    width: 'inherit',
    background: 'none',
    zIndex: 1
  },
  body: {
    padding: '0',
    overflow:'unset'
  },

})

// Define the base component styles
export const breadcrumb_base_style = breadcrumb.definePartsStyle({
})

export const pagination_welcome = breadcrumb.definePartsStyle({
  container: {
    display: 'flex',
    alignItems: 'center',
    borderRight: '2px solid',
    borderColor: 'primaire.2',
    width: '100%',
  },
  item:{
    textStyle: 'h2',
    height: 'minmax(3rem, 10vh)',
    span:{
      color:'primaire.2'
    }
  },
  link: {
    _hover: {
      color: 'secondaire.2'
    }
  },
  separator: {
  },
})

export const close_button_base_style = defineStyle({
  width: '1.5rem',
  height: '1.5rem',
  margin: '0',
  border: 'solid 1px ',
  borderRadius: '6px',
  color: 'white',
  borderColor: 'primaire.1',
  bg: 'primaire.1',
  bgColor: 'primaire.1',
  _hover: {
    borderColor: 'secondaire.1',
    bg: 'secondaire.1',
    bgColor: 'secondaire.1',
  },
  _disabled: {
    borderColor: 'gray.300',
    bg: 'gray.300',
    bgColor: 'gray.300',
  }
})

export const checkbox_base_style = checkbox.definePartsStyle({
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

export const menuconfigpanel_option_checkbox = checkbox.definePartsStyle({
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

export const menuconfigpanel_tag_checkbox = checkbox.definePartsStyle({
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

export const menuconfigpanel_part_title_1_checkbox = checkbox.definePartsStyle({
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


export const activate_antagonist_checkbox = checkbox.definePartsStyle({
  container: {
    margin:'auto',
    width:'inherit',
  }
})

export const checkbox_dont_show_again = checkbox.definePartsStyle({
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


// Define the base component styles
export const card_base_style = card.definePartsStyle({
  body: {
    margin: 'auto',
    svg: {
      margin: 'auto'
    }
  }
})

export const card_icon_selected = card.definePartsStyle({
  container: {
    borderWidth: '4px',
    borderColor: 'primaire.5'
  }
})

export const card_icon_not_selected = card.definePartsStyle({
  container: {
    borderWidth: '1px',
    borderColor: 'grey'
  }
})

export const card_import_icon = card.definePartsStyle({
  container: {
    backgroundColor: 'teal',
    borderWidth: '1px',
    borderColor: 'grey'
  }
})

export const card_account = card.definePartsStyle({
  container: {
    marginTop: '6rem',
  },
  header: {
    textAlign: 'center',
    bg: 'primaire.5',
    color: 'white',
    textStyle: 'h2',
  },
  body: {
    width: '100%'
  },
})

export const card_register = card.definePartsStyle({
  container: {
    marginTop: '175px',
    borderWidth: '1px',
    borderStyle:'solid',
    borderColor: 'primaire.5',
    width: '40vw',
  },
  header: {
    textAlign: 'center',
    bg: 'primaire.5',
    color: 'white',
    textStyle: 'h2',
  },
  body: {
    width: '90%',
    display: 'grid',
    gridRowGap: '10px',
  },
})

export const cards_template = card.definePartsStyle({
  container: {
    borderWidth: '1px',
    borderStyle:'solid',
    borderColor: 'grey'
  },
  header: {
    textStyle: 'h3',
  },
})

export const cards_empty_template = card.definePartsStyle({
  container: {
    borderWidth: '1px',
    borderStyle:'solid',
    borderColor: 'grey'
  }
})
const buttongroup_base_style = defineStyle({
  // width:'40px',
  // height:'120px',
  right:0,
  // top:(window.innerHeight/2)-120,
  margin:'0',
  marginTop:'0',
 	position:'fixed',
  zIndex:100, 
})

const buttongroup_sideBar = defineStyle({})

const badge_base_style = defineStyle({
  display: 'inline',
  padding: '0',
  height: '0.75rem',
  width: '1.75rem',
  color: 'white',
  bgColor: 'primaire.3',
  bb: 'primaire.3',
  border: '0px',
  borderRadius: '3px',
  fontSize: '0.5rem'
})

const badge_on_template_img = defineStyle({
  display: 'inline-grid',
  justifyContent: 'center',
  alignContent: 'center',
  position: 'absolute',
  width: 'fit-content',
  height: 'fit-content',
  margin: '0.5rem',
  padding: '0.5rem',
  textStyle: 'h3',
  bgColor: 'primaire.2',
  bb: 'primaire.2',
})

// The styles that all accordion have in common
const accordion_base_style = accordion.definePartsStyle({
  root: {
    margin: '0',
    padding: '0',
    color: 'primaire.5',
    bg: 'white',
    bgColor: 'white',
    '.chakra-collapse': {
      overflow: 'visible !important',
    },
  },
  container: {
    margin: '0',
    padding: '0',
    color: 'primaire.5',
    bg: 'white',
    bgColor: 'white',
    width: '100%',
    border: '0',
    borderRadius: '0'
  },
  button: {
    margin: '0',
    padding: '1rem 1.25rem',
    color: 'primaire.5',
    bg: 'white',
    bgColor: 'white',
    border: '0',
    borderRadius: '0',
    boxShadow: 'inset 0 -1px 0 rgba(0,0,0,.125)',
    width: '100%',
    height: '3.5rem',
    flex: '1',
    textAlign: 'left',
    textStyle: 'h2',

    _expanded: {
      color: 'white',
      bg: 'primaire.5',
      bgColor: 'primaire.5',
      border: '1px',
      borderColor: 'primaire.5',
    }
  },
  panel: {
    margin: '0',
    padding: '0.5rem 1.5rem',
    color: 'primaire.5',
    bg: 'white',
    bgColor: 'white',
    border: '0',
    borderRadius: '0'
  },
  icon: {
    width: '2em',
    height: '1em',
    border: '1px solid',
    borderColor: 'primaire.5',
    background: 'primaire.5',
    borderRadius: 'full',
    color: 'white',
    _active: {
      borderColor: 'white',
      background: 'white',
      color: 'primaire.5'
    }
  }
})

const button_base_style = defineStyle({
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

const menuconfigpanel_option_button = defineStyle({
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

const menuconfigpanel_move_order_node_io = defineStyle({
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

const menuconfigpanel_option_button_right = defineStyle({
  ...menuconfigpanel_option_button,
  borderRadius: '0px 6px 6px 0px',
})

const menuconfigpanel_option_button_left = defineStyle({
  ...menuconfigpanel_option_button,
  borderRadius: '6px 0px 0px 6px',
})

const menuconfigpanel_option_button_center = defineStyle({
  ...menuconfigpanel_option_button,
  borderRadius: '0px',
})

const menuconfigpanel_option_button_activated = defineStyle({
  height: '1.5rem',
  padding: '0.5rem',
  color: 'tertiaire.3',
  fill: 'tertiaire.3',
  fontSize: 'unset',
  borderColor: 'tertiaire.3',
  border: 'solid 2px',
})

const menuconfigpanel_option_button_activated_right = defineStyle({
  ...menuconfigpanel_option_button_activated,
  borderRadius: '0px 6px 6px 0px',
})

const menuconfigpanel_option_button_activated_left = defineStyle({
  ...menuconfigpanel_option_button_activated,
  borderRadius: '6px 0px 0px 6px',
})

const menuconfigpanel_option_button_activated_center = defineStyle({
  ...menuconfigpanel_option_button_activated,
  borderRadius: '0px',
})

// Style for button in table of tags  in config menu
const menuconfigpanel_option_button_in_table = defineStyle({
  height: '1.5rem',
  width: '1.5rem',
  padding: 0
})

const menuconfigpanel_add_button = defineStyle({
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

const menuconfigpanel_del_button = defineStyle({
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

const menuconfigpanel_close = defineStyle({
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
const menuconfigpanel_del_button_in_table = defineStyle({
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

const template_button_reset = defineStyle({
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



export const numberinput_base_style = numberInput.definePartsStyle({
  root: {
    width: '100%'
  },
  field: {
    width: '100%',
    height: '1.5rem',
    fontSize: 'unset',
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
  },
  stepperGroup: {
    height: '1.5rem',
    margin:'0',
  },

})

export const menuconfigpanel_option_numberinput = numberInput.definePartsStyle({
  field: {
    paddingLeft: '0.15rem',
    paddingRight: '0.15rem'
  },
  stepperGroup:{
    width:'0.8rem'
  },
  stepper: {
    'svg': {
      width: '0.4rem',
      height: '0.4rem',
    }
  }
})

export const menuconfigpanel_option_numberinput_with_right_addon = numberInput.definePartsStyle({
  field: {
    borderRadius: '6px 0px 0px 6px',
    paddingLeft: '0.15rem',
    paddingRight: '0.15rem',
  },
  stepperGroup:{
    width:'0.8rem'
  },
  stepper: {
    'svg': {
      width: '0.4rem',
      height: '0.4rem',
    }
  }
})

// Define the base component styles
export const popover_base_style = popover.definePartsStyle({
  header: {
    textStyle: 'h1',
    width:'100%',
    marginRight: '3rem'
  },
  body: {
    textStyle: 'h4',
    width:'100%',
    display: 'grid',
    gridRowGap: '0.5rem',
  },
  content:{
    width:'100%',
  },
  closeButton: {
    marginTop: '0.35rem',
    height: '1.5rem',
    width: '1.5rem',
    color: 'white',
    bg: 'primaire.1',
    bgColor: 'primaire.1'
  }
})

export const toolbar_popover_window = popover.definePartsStyle({})

export const select_base_style = select.definePartsStyle({
  field: {
    height: '1.5rem',
    border: 'solid 1px',
    borderRadius: '6px',
    borderColor: 'gray.50',
    fontSize: 'unset',
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

export const select_custom_style = select.definePartsStyle({
  field: {
    height: '1.5rem',
    borderRadius: '0px 6px 6px 0px',
  }
})

export const menuconfigpanel_option_select = select.definePartsStyle({
  field: {
    height: '1.5rem',
    border: 'solid 1px',
    borderRadius: '6px',
    borderColor: 'gray.50',
  }
})

// Style of selector in table of tags
export const menuconfigpanel_option_select_table = select.definePartsStyle({
  field: {
    paddingLeft:'0.25rem',
    paddingRight:'0.8rem',
    height: 'revert',
    border: 'solid 1px',
    borderRadius: '6px',
    borderColor: 'gray.50',
  },
  icon:{
    width:'0.75rem',
    height:'0.75rem',
  }
})


export const slider_base_style = slider.definePartsStyle({
  thumb: {
    width: '1.5rem',
    height: '1.5rem',
    border: 'solid 1px ',
    borderRadius: '6px',
    borderColor: 'gray.50',
    bg: 'openSankey.50',
    bgColor: 'openSankey.50',
  },
  filledTrack: {
    bg: 'openSankey.50',
    bgColor: 'openSankey.50',
  },
  mark: {
    textAlign: 'center',
    color: 'gray.50',
    width: '1.5rem',
    zIndex: '2',
    marginTop: '-0.25rem',
    marginLeft: '-0.75rem',
    padding: '0px'
  }
})

export const spinner_base_style = defineStyle({
  size: 'md',
  justifySelf: 'center',
  color: 'primaire.3',
})

const minHeightTableRow = '1rem'
const basic_td = { padding: 0, margin: 'auto' }
const basic_th = { paddingInlineStart: 'inherit', paddingInlineEnd: 'inherit', margin: 'auto', paddingBottom: '0', fontSize: 'unset' }
const default_table = {
  td: basic_td,
  th: basic_th,
  table: {
    display: 'grid',
    gridRowGap: '0.2rem',
    width: 'unset',
  },
  tbody: {
    display: 'grid',
    gridRowGap: '0.2rem'
  },
}
// Default style of table because we need one for the theme
export const table_base_style = table.definePartsStyle({

})

// Style of table to edit node/link/data group tags
export const table_edit_grp_tag_node_link = table.definePartsStyle({
  ...default_table,
  tr: {
    minHeight: minHeightTableRow,
    gridTemplateColumns: '0.5fr 2fr 1.5fr',
    display: 'grid',
  },
})

// Style of table to edit node/link/data group tags
export const table_edit_grp_tag_data = table.definePartsStyle({
  ...default_table,
  tr: {
    minHeight: minHeightTableRow,
    gridTemplateColumns: '0.75fr 2fr 1.5fr 1.5fr',
    display: 'grid',
  },
})

// Style of table to edit node tags
export const table_edit_tag_node = table.definePartsStyle({
  ...default_table,
  tr: {
    minHeight: minHeightTableRow,
    gridTemplateColumns: '0.5fr 2fr 0.75fr 0.5fr 1.5fr',
    display: 'grid',
  },
})

// Style of table to edit link tags
export const table_edit_tag_link = table.definePartsStyle({
  ...default_table,
  tr: {
    minHeight: minHeightTableRow,
    gridTemplateColumns: '0.5fr 2fr 0.5fr 0.75fr',
    display: 'grid',
  },
})

// Style of table to edit data tags
export const table_edit_tag_data = table.definePartsStyle({
  ...default_table,
  tr: {
    minHeight: minHeightTableRow,
    gridTemplateColumns: '0.5fr 1.5fr 0.75fr',
    display: 'grid',
  },
})

// Style of table to edit node link io
export const table_edit_node_io = table.definePartsStyle({
  ...default_table,
  tr: {
    minHeight: minHeightTableRow,
    gridTemplateColumns: '2fr 2fr',
    display: 'grid',
  },
})

export const table_welcome_buttons = table.definePartsStyle({
  table: {
    margin: '1rem',
    justifySelf: 'center',
    borderCollapse: 'separate',
    borderSpacing: '0.25rem',
  },
  thead: {
    bg: 'primaire.2',
    color: 'white',
    textStyle: 'h2',
    paddingInlineStart: '1rem',
    tr: {
      borderRadius: '6px'
    }
  },
  tbody: {
    tr: {
      '&:nth-of-type(odd)': {
        td: {
          background: 'gray.50',
        },
      },
    }
  },
  td: {
  },
  tr: {
    'td:first-child': {
      textAlign: 'end',
      minWidth: '15rem',
      textStyle: 'h3',
    },
    'td:last-child': {
      paddingInlineStart: '1rem',
      textAlign: 'start',
      textStyle: 'h4',
    },
  },
})

// Define the base component styles
export const tabs_base_style = tabs.definePartsStyle({
  root: {
    border: 'solid 1px !important',
    borderRadius: '6px',
    borderColor: 'primaire.5 !important',
  },
  tab: {
    border: 'none',
    borderBottom: 'solid 1px !important',
    borderRadius: '0px',
    borderColor: 'none',
    margin: '0 !important',
    padding: '0 !important',
    height: '2rem !important',
    _selected: {
      border: 'none',
      borderBottom: 'solid 2px !important',
      borderBottomColor: 'primaire.5',
      borderRadius: '0px',
      borderColor: 'none',
      color: 'primaire.5',
    }
  },
  tablist: {
    border: '0 !important',
    margin: '0.5rem !important'
  },
  tabpanels: {
    padding: '0px'
  },
  tabpanel: {
    padding: '0.5rem'
  },
})

export const tabs_navbar = tabs.definePartsStyle({
  root: {
    border: 'none',
    borderRadius: 'none',
    borderColor: 'none',
    borderLeft: 'solid 1px',
    borderLeftColor: 'secondaire.2',
    borderRight: 'solid 1px',
    borderRightColor: 'secondaire.2',
    fontSize: '1rem',
    textStyle: 'h1',
  },
  tab: {
    minWidth: '7rem',
    borderBottom: 'none',
    margin: '0rem 0rem 0rem 0.25rem !important',
    padding: '0rem !important',
    height: '2rem !important',
    justifySelf: 'start',
    alignSelf: 'center',
    _selected: {
      border: 'none',
      borderBottom: 'solid 2px !important',
      borderBottomColor: 'primaire.2',
      borderRadius: '0px',
      borderColor: 'none',
      color: 'primaire.2',
    }
  },
  tablist: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(8.5rem, 12rem))',
    gridColumnGap: '1px',
    border: '0 !important',
    margin: '0 !important',
    padding: '0 !important',
  },
  tabpanels: {
    margin: '0 !important',
    padding: '0 !important',
    border: 'none',
    borderRadius: '0px',
    borderColor: 'none',
  },
  tabpanel: {
    display: 'inline-grid',
    gridTemplateColumns: 'auto',
    gridAutoFlow: 'column',
    gridColumnGap: '0.25rem',
  }
})

export const tabs_variant_lib_cion = tabs.definePartsStyle({
  root: {
    border: 'inherit',
    borderRadius: '6px',
    borderColor: 'inherit',
  },
  tab: {
    border: 'solid 0px !important',
    borderRadius: '6px',
    borderColor: 'none',
    margin: '0 !important',
    padding: '0 !important',
    height: '2rem !important',
    backgroundColor: ' primaire.5',

    _selected: {
      border: 'solid 1px !important',
      borderRadius: '6px',
      color: 'primaire.5',
      borderColor: 'none',
      backgroundColor: ' openSankey.200',

    }
  },
  tablist: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr ',
    gridColumnGap: '0.25rem',
    border: '0 !important',
    margin: '0.5rem !important'
  },
  tabpanels: {
    borderTop: 'solid 1px !important',
    borderTopColor: 'gray.100 !important',
  },
  // tabpanel: {
  // },
})

export const tabs_variant_template = tabs.definePartsStyle({
  root: {
    border: 'inherit',
    borderRadius: '6px',
    borderColor: 'inherit',
    WebkitUserSelect: 'none', /* Chrome all / Safari all */
    MozUserSelect: 'none', /* Firefox all */
    msUserSelect: 'none', /* IE 10+ */
    userSelect: 'none',
  },
  tab: {
    borderRight: '0px !important',
    borderLeft: '0px !important',
    borderBottom: '0px !important',
    borderTop: '0px !important',
    borderRadius: '0px',
    margin: '0 -1px 0 0 !important',
    padding: '0 !important',
    height: '2rem !important',
    color: 'primaire.3',
    fill: 'primaire.3',
    path: 'primaire.3',
    width: '10rem',
    textStyle: 'h3',
    _selected: {
      background: 'white',
      borderRight: '0px !important',
      borderLeft: 'solid 1px !important',
      borderBottom: 'solid 1px !important',
      borderTop: 'solid 1px !important',
      borderRadius: '6px 0px 0px 6px',
      borderRightColor: 'white',
      borderLeftColor: 'primaire.2',
      borderBottomColor: 'primaire.2',
      borderTopColor: 'primaire.2',
      color: 'primaire.2',
      fill: 'primaire.2',
      path: 'primaire.2',
    }
  },
  tablist: {
    display: 'inherit',
    gridTemplateColumns: '1fr',
    gridTemplateRows: '1fr',
    borderRight: '1px !important',
    borderColor: 'primaire.2 !important',
    padding: '3rem 0 0 0 !important'
  },
  tabpanels: {
    border: '0px !important',
  },
  tabpanel: {
    display: 'block',
    height: '100%',
    width: '100%',
  }
})

export const tag_base_style=tag.definePartsStyle({
})
export const tag_dev_navbar = tag.definePartsStyle({
  container:{
    position:'absolute',
    color:'white',
    background:'primaire.3',
    fontSize:'0.4rem',
    minHeight:'0.6rem',
    right:'0px',
    bottom:'0.2rem'
  }
})

export const textarea_base_style = defineStyle({
  border: '2px dashed', // change the appearance of the border
  borderRadius: 0, // remove the border radius
  fontWeight: 'semibold', // change the font weight
})


export const opensankey_theme = extendTheme({
  components: {
    Accordion: {
      baseStyle: accordion_base_style,
    },
    Badge: {
      baseStyle: badge_base_style,
      variants: { badge_on_template_img }
    },
    Button: {
      baseStyle: button_base_style,
      variants: {
        contextmenu_button,
        menuconfigpanel_add_button,
        menuconfigpanel_del_button_in_table,
        menuconfigpanel_del_button,
        menuconfigpanel_option_button_activated_center,
        menuconfigpanel_option_button_activated_left,
        menuconfigpanel_option_button_activated_right,
        menuconfigpanel_option_button_activated,
        menuconfigpanel_option_button_center,
        menuconfigpanel_option_button_in_table,
        menuconfigpanel_option_button_left,
        menuconfigpanel_option_button_right,
        menuconfigpanel_option_button_primary_activated,
        menuconfigpanel_option_button_primary,
        menuconfigpanel_option_button_secondary_activated,
        menuconfigpanel_option_button_secondary,
        menuconfigpanel_option_button_tertiary_activated,
        menuconfigpanel_option_button_tertiary,
        menuconfigpanel_option_button,
        menutop_button_datatags,
        menutop_button_save_in_cache,
        menutop_button_with_dropdown,
        menutop_button,
        submenu_nav_btn_dropdown_item_demo,
        toolbar_button_mouse_mode,
        toolbar_button_mouse_mode_activated,
        toolbar_button_undo_redo,
        toolbar_button_undo_redo_activated,
        toolbar_button_2,
        toolbar_button_3,
        toolbar_button_5,
        toolbar_button_6,
        toolbar_main_button,
        welcome_button_license_description,
        btn_documentation,
        button_is_spreadsheet,
        button_is_spreadsheet_selected,
        button_config_element,
        button_config_element_activated,
        button_type_config,
        button_type_config_activated,
        menu_sub_section_collapse_button,
        text_menu_select,
        template_button_reset,
        menuconfigpanel_move_order_node_io,
      },
      sizes: {
        sizeToolbarButton,
        sizeMenuTopButton,
        sizeMenuTopButtonSaveCache,
        sizeCollapseButton,
        sizeConfigButton,
        sizeButtonDialog,
      }
    },
    ButtonGroup: {
      baseStyle: buttongroup_base_style,
      variants: {
        buttongroup_sideBar,
      }
    },
    Breadcrumb: {
      baseStyle: breadcrumb_base_style,
      variants: {
        pagination_welcome
      }
    },
    Card: {
      baseStyle: card_base_style,
      variants: {
        card_icon_selected,
        card_icon_not_selected,
        card_import_icon,
        card_account,
        card_register,
        cards_template,
        cards_empty_template,
      }
    },
    Checkbox: {
      baseStyle: checkbox_base_style,
      variants: {
        menuconfigpanel_part_title_1_checkbox,
        menuconfigpanel_option_checkbox,
        menuconfigpanel_tag_checkbox,
        activate_antagonist_checkbox,
        checkbox_dont_show_again,
      }
    },
    CloseButton: {
      baseStyle: close_button_base_style
    },
    Editable: {
      baseStyle: editable_base_style,
      variants: {
        name_file_editable,
        edit_name_palette,
      }
    },
    Input: {
      baseStyle: input_base_style,
      variants: {
        menuconfigpanel_option_input,
        menuconfigpanel_option_input_color,
        menuconfigpanel_option_input_table
      }
    },
    Modal: {
      baseStyle: modal_base_style,
      variants: {
        modal_welcome,
        modal_dialog,
        modal_documentation,
        modal_select_unit_from_data,
        modal_select_unit_from_excel
      }
    },
    Menu: {
      baseStyle: menu_button_base_style,
      variants: {
        menu_button_subnav_style,
        menu_button_subnav_account_style,
        menu_subnav_item_demo,
        menu_select_elements,
        menu_select_style,
        selector_lang,
      }
    },
    NumberInput: {
      baseStyle: numberinput_base_style,
      variants: {
        menuconfigpanel_option_numberinput,
        menuconfigpanel_option_numberinput_with_right_addon
      }
    },
    Popover: {
      baseStyle: popover_base_style,
      variants: {
        toolbar_popover_window
      }
    },
    Select: {
      baseStyle: select_base_style,
      variants: {
        select_custom_style,
        menuconfigpanel_option_select,
        menuconfigpanel_option_select_table,
      }
    },
    Slider: {
      baseStyle: slider_base_style
    },
    Tabs: {
      baseStyle: tabs_base_style,
      variants: {
        tabs_variant_lib_cion,
        tabs_navbar,
        tabs_variant_template,
      }
    },
    Table: {
      baseStyle: table_base_style,
      variants: {
        table_edit_tag_node,
        table_edit_tag_link,
        table_edit_tag_data,
        table_edit_grp_tag_node_link,
        table_edit_grp_tag_data,
        table_edit_node_io,
      }
    },
    Tag: {
      baseStyle: tag_base_style,
      variants: { tag_dev_navbar }
    },
    TextArea: {
      baseStyle: textarea_base_style
    },
    Drawer: {
      baseStyle: drawer_base_style,
      variants: {
        drawer_menu_config,
      }
    },
    Heading: {
      baseStyle: heading_base_style,
      variants: {
        heading_welcome_style,
        heading_template_dashboard,
        heading_template_sankey,
        heading_tab_pref,
      }
    },
    Spinner: {
      baseStyle: spinner_base_style
    }
  },
  layerStyles: {
    base: {
      margin: 0
    },
    context_menu: {
      display: 'grid',
      rowGap: '0.1rem',
      background: 'white',
      border: '1px solid gray',
      borderRadius: '4px'
    },
    menuconfig_entry: {
      textStyle: 'h1',
      textAlign: 'left',
      flex: '1',
    },
    submenuconfig_entry: {
      textStyle: 'h2',
      textAlign: 'left',
      flex: '1'
    },
    submenuconfig_tab: {
      textStyle: 'h3',
      textAlign: 'center',
      flex: '1',
      paddingStart: '0',
      paddingEnd: '0',
    },
    submenuconfig_tab_with_badge: {
      alignItems: 'center',
      color: 'openSankey.400',
      display: 'grid',
      gridColumnGap: '0.25rem',
      gridTemplateColumns: '1fr 1fr',
      paddingEnd: '0em',
      paddingStart: '1em',
      textAlign: 'center',
      textStyle: 'h3',
    },
    menu_sub_section_title: {
      textAlign: 'center',
      display: 'block',
      margin: 'auto',
      width: '100%',

    },
    menuconfigpanel_part_title_2: {
      textStyle: 'h3',
      textAlign: 'left',
      display: 'block',
      height: '1.5rem'
    },
    menuconfigpanel_part_title_3: {
      textStyle: 'h4',
      textAlign: 'left',
      display: 'block',
      height: '1rem'
    },
    menuconfigpanel_warn_msg: {
      textStyle: 'h4',
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      color: 'red'
    },
    menuconfigpanel_option_name: {
      textStyle: 'h4',
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      'svg.tooltip_overload': {
        marginLeft: 'auto',
        marginRight: '0'
      }
    },
    menuconfigpanel_suboption_name: {
      textStyle: 'h4',
      textAlign: 'left',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: '1.5rem'
    },
    menuconfigpanel_grid: {
      display: 'grid',
      gridRowGap: '0.25rem',
    },
    
    menuconfigpanel_row_droplist: {
      display: 'grid',
      gridTemplateColumns: '1fr 10fr 1fr 1fr',
      gridColumnGap: '0.25rem',


    },
    menuconfigpanel_row_droplist_simple: {
      display: 'grid',
      gridColumnGap: '0.25rem',
      gridTemplateColumns: '8fr 1fr',
    },
    menuconfigpanel_zdt_row_droplist: {
      display: 'grid',
      gridTemplateColumns: '1fr 6fr 1fr 1fr 1fr',
      gridColumnGap: '0.25rem',
    },
    menuconfigpanel_row_stylechoice: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 6fr',
      gridColumnGap: '0.25rem',
    },
    menuconfigpanel_row_2cols: {
      display: 'grid',
      gridTemplateColumns: '2fr 3fr',
      gridColumnGap: '0.25rem',
    },
    menuconfigpanel_row_2cols_little_input: {
      display: 'grid',
      gridTemplateColumns: '3fr 2fr',
      gridColumnGap: '0.25rem',
    },
    menuconfigpanel_row_3cols: {
      display: 'grid',
      gridTemplateColumns: '2fr 1.5fr 1.5fr',
      gridColumnGap: '0.25rem',
    },
    menuconfigpanel_row_3colsbis: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 2fr',
      gridColumnGap: '0.25rem',
    },
    menuconfigpanel_2row_3cols: {
      display: 'grid',
      gridTemplateColumns: '2fr 1.25fr 1.75fr',
      gridTemplateRows: '1fr 2fr',
      gridColumnGap: '0',
      gridRowGap: '0',
      height: '3rem'
    },
    menutop_layout_style: {
      display: 'grid',
      gridColumnGap: '0.25rem',
      height: '5rem',
      width: 'auto',
      padding: '0',
      margin: '0px 3px 0px 3px',
      alignItems: 'center',
      background: 'gray.50',
      color: 'gray.600'
    },
    menutop_tab_style: {
      textStyle: 'h3',
      textAlign: 'start',
      flex: '1',
      paddingStart: '0.25rem',
      paddingEnd: '1.25rem'
    },
    menutop_button_style: {
      display: 'grid',
      gridTemplateColumns: '3fr',
      gridTemplateRows: '2fr 1fr',
      gridColumnGap: '0',
      gridRowGap: '0',
      height: '3rem',
      width: '4rem',
      padding: '0',
      margin: '0',
      textStyle: 'h4',
      fontSize: '9px',
      color: 'gray.600',
      stroke: 'gray.600', // Svg params
      fill: 'gray.600',  // svg params
      alignItems: 'center',
      justifyItems: 'center'
    },
    menubottom_layout_style: {
      background: 'gray.50',
      bgColor: 'gray.50',
      width: '100%',
    },
    menubottom_item_style: {
      display: 'flex',
      color: 'black',
      textStyle: 'h4',
      alignSelf: 'center',
      justifySelf: 'center'
    },
    menucontext_layout: {
      display: 'grid',
      gridRowGap: '0.25rem',
    },
    option_with_activation: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gridColumnGap: '0.12rem',
    },
    options_2cols: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridColumnGap: '0.12rem',
    },
    options_3cols: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gridColumnGap: '0.12rem',
    },
    options_4cols: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr 1fr',
      gridColumnGap: '0.12rem',
    },
    options_cards: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr 1fr',
      gridColumnGap: '0.25rem',
      gridTemplateRows: 'repeat(auto, 1fr)',
      gridRowGap: '0.25rem'
    },
    welcome_license_row: {
      display: 'grid',
      gridTemplateColumns: '1fr 3fr',
      gridColumnGap: '0.25rem',
    },
    welcome_license_desc: {
      whiteSpace: 'pre-line'
    },
    menustylepanel_row_droplist: {
      display: 'flex',
      gap:'0.6rem',
    },
    popover_sidebar_row_tag_filter: {
      display: 'grid',
      gridTemplateColumns: '4fr 1fr',
      gridColumnGap: '0.25rem',
    },
    menu_draggable_layout: {
      padding: '0.25rem',
      display: 'grid',
      gridRowGap: '0.5rem',
      gridColGap: '0.5rem',
      alignItems: 'center',
      width: 'fit-content',
      color: 'gray.600',
      bg: 'white',
      bgColor: 'white',
      border: 'solid 1px',
      borderColor: 'primaire.2',
      borderRadius: '6px',
      fontSize: '0.6rem'
    },
    menu_draggable_title_layout: {
      display: 'grid',
      gridTemplateColumns: '9fr 1fr',
      gridColumnGap: '0.25rem',
      margin: '0.25rem',
      alignItems: 'center',
      alignContent: 'center',

      padding: '1rem',

      height: 'fit-content',
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: 'white',
      background: 'primaire.2',
      borderRadius: '6px',
      paddingRight: '1rem'
    },
    menu_draggable_content_layout: {
      display: 'grid',
      gridRowGap: '0.25rem',
      fontStyle: 'h4',
      alignItems: 'center',
      margin: '0.25rem'
    },
    image_layout: {
      height: '100%',
      margin: '1rem'
    },
    toolbar_bottom: {
      display: 'grid',
      gridTemplateColumns: '2fr 2fr 3fr 1fr',
      gridColumnGap: '1rem',
      position: 'fixed',
      zIndex: 1,
      width: 'fit-content',
      left: '50%',
      transform: 'translate(-50%)'
    },
    config_menu_layout: {
      display: 'grid',
      gridGap: '0.2rem',
      gridTemplateColumns: '8fr 1fr',
      gridTemplateAreas: `'header  header  header'
      'content content sidebar'
      'content content sidebar'`,
      color: '#444',
      borderRadius: '5px',
      padding: '0.2rem',
      fontSize: '0.6rem',
    },
    config_box: {
      gridArea: 'content',
      display: 'grid',
      gridRowGap: '0.2rem',
      color: 'primaire.5',
      overflowY: 'auto',
    },
    element_box: {
      gridArea: 'sidebar'

    },
    type_config_box: {
      gridArea: 'header',
    },
    box_content_config: {
      background: 'white',
      borderRadius: '4px',
      padding: '0.2rem',
      display: 'grid',
      gridRowGap: '0.2rem',
      gridAutoRows: 'max-content',

      '.title_box': {
        padding: '0.4rem',
        width: '100%',
        background: 'primaire.2',
        borderRadius: '4px',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '0.8rem',
      }
    },
    menu_sub_section: {
      display: 'grid',
      border: '1px solid black',
      borderRadius: '4px',
      gridRowGap: '0.2rem',
      padding: '0.2rem'
    },
    menu_sub_section_head: {
      display: 'grid',
      gridTemplateColumns: '1fr 9fr'
    },
    selector_elements: {
      // Styling box containing multi select
      width: '9rem',
      height: '1.5rem',

      // Styling of react component multi select
      '.rmsc .dropdown-container': {
        height: '1.5rem !important',
      },

      '.dropdown-content ul': {
        minHeight: 'unset',
        maxHeight: '8rem',
      },

      '.rmsc': {
        '--rmsc-radius': '6px !important',
        '--rmsc-h': '1.5rem !important',
        WebkitUserSelect: 'none',  /* Chrome all / Safari all */
        MozUserSelect: 'none',    /* Firefox all */
        msUserSelect: 'none',     /* IE 10+ */
        userSelect: 'none',
      }
    },
    selector_elements_simple: {
      // Styling box containing multi select
      width: '14vw',
      height: '1.5rem',

      // Styling of react component multi select
      '.rmsc .dropdown-container': {
        height: '1.5rem !important',
      },
      '.dropdown-content ul': {
        minHeight: 'unset',
        maxHeight: '8rem',
      },

      '.rmsc': {
        '--rmsc-radius': '6px !important',
        '--rmsc-h': '1.5rem !important',
        WebkitUserSelect: 'none',  /* Chrome all / Safari all */
        MozUserSelect: 'none',    /* Firefox all */
        msUserSelect: 'none',     /* IE 10+ */
        userSelect: 'none',
      }
    },
    empty_config_text: {
      color: 'white',
      fontSize: '0.7rem',
    },
    text_menu_select: {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    topbar_file_name: {
      margin: 'auto',
    },
    toolbar_save_and_file_name: {
      position: 'absolute',
      right: 0,
      zIndex: 2,
      display: 'grid',
      gridColumnGap: '0.25rem',
      gridTemplateColumns: 'auto auto',
    },
    drag_line_element_order: {
      display: 'grid',
      gridTemplateColumns: '6fr 3fr',
      border: '1px solid',
      borderRadius: '3px',

      '.name_element': {
        margin: 'auto',
        maxW: '7rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }
    }

  },
  textStyles: {
    xl: {
      fontSize: '16px',
    },
    lg: {
      fontSize: '14px',
    },
    md: {
      fontSize: '12px',
    },
    sm: {
      fontSize: '10px',
    },
    xs: {
      fontSize: '8px',
    },
    h1: {
      fontFamily: 'Open Sans,sans-serif',
      // fontSize: '16px',
      fontWeight: 'bold',
    },
    h2: {
      fontFamily: 'Open Sans,sans-serif',
      // fontSize: '14px',
      fontWeight: 'bold',
    },
    h3: {
      fontFamily: 'Open Sans,sans-serif',
      // fontSize: '12px',
      fontWeight: 'bold',
    },
    h4: {
      fontFamily: 'Open Sans,sans-serif',
      // fontSize: '12px',
      fontWeight: 'normal',
    },
    title_sub_section: {
      fontSize: '0.7rem',
      fontWeight: 'bold',
    }
  },
  colors: {
    openSankey: {
      50: '#C1E5DB',
      100: '#66a59366',
      200: '#66a593',
      300: '#25B48C',
      400: '#78C2AD'
    },
    primaire: {
      1: '#F7AD7C',
      2: '#78A7C2',
      3: '#78C2AD',
      4: '#B49E90',
      5: '#8EA4B1',
      6: '#8EB1A8'
    },
    secondaire: {
      1: '#DA996D',
      2: '#668EA5',
      3: '#66A593',
      4: '#968478',
      5: '#778A95',
      6: '#77958D'
    },
    tertiaire: {
      1: '#BC835E',
      2: '#557689',
      3: '#55897A',
      4: '#786960',
      5: '#606F78',
      6: '#607871'
    }
  }
})