import { extendTheme } from '@chakra-ui/react'

import {
  accordion_base_style,
  accordion_sublevel_style
} from './AccordionStyles'
import {
  button_base_style,
  menuconfigpanel_add_button,
  menuconfigpanel_del_button,
  menuconfigpanel_option_button_activated_center,
  menuconfigpanel_option_button_activated_left,
  menuconfigpanel_option_button_activated_right,
  menuconfigpanel_option_button_activated,
  menuconfigpanel_option_button_center,
  menuconfigpanel_option_button_left,
  menuconfigpanel_option_button_right,
  menuconfigpanel_option_button,
  menuconfigpanel_option_btn_in_table,
  menuconfigpanel_del_button_in_table,
  submenu_nav_btn,
  submenu_nav_btn_dropdown,
  menuconfigpanel_option_button_secondary,
  menuconfigpanel_option_button_light,
  menuconfigpanel_option_button_tertiary,
  btn_mode_selection_toolbar,
  btn_data_tag_filter_toolbar,
  btn_data_type_toolbar,
  btn_detail_level_toolbar,
  btn_fullscreen_toolbar,
  btn_link_visual_filter_toolbar,
  btn_node_link_tag_filter_toolbar,
  btn_stretch_toolbar,
  btn_toggle_menuconfig_toolbar,
  btn_is_connected,
  btn_not_connected,
  btn_save_in_cache,
  submenu_nav_btn_dropdown_item_demo,
  btn_in_context_menu,
  token_blocker_deactivated,
  token_blocker_activated,
  btn_navigation
} from './ButtonStyles'
import {
  checkbox_base_style,
  menuconfigpanel_part_title_1_checkbox,
  menuconfigpanel_option_checkbox,
  menuconfigpanel_tag_checkbox,
  activate_antagonist_checkbox
} from './CheckboxStyles'
import { 
  drawer_base_style, 
  drawer_menu_config 
} from './DrawerStyles'
import {
  input_base_style,
  menuconfigpanel_option_input,
  menuconfigpanel_option_input_color,
  menuconfigpanel_option_input_table
} from './InputStyles'
import { 
  menu_button_base_style, 
  menu_button_subnav_style, 
  menu_subnav_initial_item_demo, 
  menu_subnav_item_demo
} from './MenuStyles'
import {
  numberinput_base_style,
  menuconfigpanel_option_numberinput,
  menuconfigpanel_option_numberinput_with_right_addon,
} from './NumberInputStyles'
import {
  select_base_style,
  select_custom_style,
  menuconfigpanel_option_select,
  menuconfigpanel_option_select_table
} from './SelectStyles'
import {
  slider_base_style
} from './SliderStyles'
import {
  tabs_base_style,
  tabs_navbar,
  tabs_variant_lib_cion
} from './TabStyles'
import {
  textarea_base_style
} from './TextAreaStyles'
import {
  table_edit_tag_node,
  table_base_style,
  table_edit_tag_link,
  table_edit_tag_data,
  table_edit_grp_tag_node_link
} from './TableStyle'
import { heading_base_style, heading_welcome_style } from './HeadingStyles'
import { card_account, card_base_style, card_icon_not_selected, card_icon_selected, card_import_icon, card_register } from './CardStyle'
import { breadcrumb_base_style, pagination_welecome } from '../dialogs/BreadcrumbStyle'
import { tag_base_style, tag_dev_navbar } from './TagStyle'
import { buttongroup_base_style, buttongroup_sideBar } from './ButtonGroupStyle'
import { popover_base_style, popover_btn_sideBar } from './PopoverStyle'
import { modal_base_style, modal_select_unit_from_data, modal_select_unit_from_excel, modal_welcome} from './ModalStyle'

export const opensankey_theme = extendTheme({
  components: {
    Accordion: {
      baseStyle: accordion_base_style,
      variants: { accordion_sublevel_style }
    },
    Button: {
      baseStyle: button_base_style,
      variants: {
        menuconfigpanel_add_button,
        menuconfigpanel_del_button,
        menuconfigpanel_option_button_activated_center,
        menuconfigpanel_option_button_activated_left,
        menuconfigpanel_option_button_activated_right,
        menuconfigpanel_option_button_activated,
        menuconfigpanel_option_button_center,
        menuconfigpanel_option_button_left,
        menuconfigpanel_option_button_right,
        menuconfigpanel_option_button,
        menuconfigpanel_option_btn_in_table,
        menuconfigpanel_del_button_in_table,
        submenu_nav_btn,
        submenu_nav_btn_dropdown,
        submenu_nav_btn_dropdown_item_demo,
        menuconfigpanel_option_button_secondary,
        menuconfigpanel_option_button_tertiary,
        menuconfigpanel_option_button_light,
        btn_mode_selection_toolbar,
        btn_detail_level_toolbar,
        btn_link_visual_filter_toolbar,
        btn_node_link_tag_filter_toolbar,
        btn_data_tag_filter_toolbar,
        btn_data_type_toolbar,
        btn_stretch_toolbar,
        btn_fullscreen_toolbar,
        btn_toggle_menuconfig_toolbar,
        btn_is_connected,
        btn_not_connected,
        btn_save_in_cache,
        btn_in_context_menu,
        token_blocker_activated,
        token_blocker_deactivated,
        btn_navigation,
        
      }
    },
    ButtonGroup:{
      baseStyle:buttongroup_base_style,
      variants:{
        buttongroup_sideBar,
      }
    },
    Breadcrumb:{
      baseStyle:breadcrumb_base_style,
      variants:{
        pagination_welecome
      }
    },
    Card:{
      baseStyle:card_base_style,
      variants:{
        card_icon_selected,
        card_icon_not_selected,
        card_import_icon,
        card_account,
        card_register,
      }
    },
    Checkbox: {
      baseStyle: checkbox_base_style,
      variants: {
        menuconfigpanel_part_title_1_checkbox,
        menuconfigpanel_option_checkbox,
        menuconfigpanel_tag_checkbox,
        activate_antagonist_checkbox
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
    Modal:{
      baseStyle:modal_base_style,
      variants:{
        modal_welcome,
        modal_select_unit_from_data,
        modal_select_unit_from_excel
      }
    },
    Menu:{
      baseStyle:menu_button_base_style,
      variants:{
        menu_button_subnav_style,
        menu_subnav_item_demo,
        menu_subnav_initial_item_demo
      }
    },
    NumberInput: {
      baseStyle: numberinput_base_style,
      variants: {
        menuconfigpanel_option_numberinput,
        menuconfigpanel_option_numberinput_with_right_addon
      }
    },
    Popover:{
      baseStyle:popover_base_style,
      variants:{
        popover_btn_sideBar
      }
    },
    Select: {
      baseStyle: select_base_style,
      variants: {
        select_custom_style,
        menuconfigpanel_option_select,
        menuconfigpanel_option_select_table
      }
    },
    Slider: {
      baseStyle: slider_base_style
    },
    Tabs: {
      baseStyle: tabs_base_style,
      variants:{
        tabs_variant_lib_cion,
        tabs_navbar
      }
    },
    Table:{
      baseStyle:table_base_style,
      variants:{table_edit_tag_node,
        table_edit_tag_link,
        table_edit_tag_data,
        table_edit_grp_tag_node_link
      }
    },
    Tag:{
      baseStyle:tag_base_style,
      variants:{tag_dev_navbar}
    },
    TextArea: {
      baseStyle: textarea_base_style
    },
    Drawer:{
      baseStyle:drawer_base_style,
      variants:{
        drawer_menu_config
      }
    },
    Heading:{
      baseStyle:heading_base_style,
      variants:{
        heading_welcome_style
      }
    }
  },
  layerStyles: {
    context_menu:{
      display:'grid',
      rowGap:'0.1rem',
      background:'white',
      border:'1px solid grey',
      borderRadius:'4px'
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
    submenuconfig_droplist: {
      textStyle: 'h2',
      textAlign: 'left',
      flex: '1',
      height: '2rem'
    },
    submenuconfig_tab: {
      textStyle: 'h3',
      textAlign: 'center',
      flex: '1',
      paddingStart: '0',
      paddingEnd: '0',
      color: 'openSankey.400'
    },
    submenuconfig_tab_with_badge: {
      alignItems: 'center',
      color: 'openSankey.400',
      display: 'grid',
      gridColumnGap: '0.25rem',
      gridTemplateColumns: '1fr 1fr',
      height: '2rem',
      paddingEnd: '0em',
      paddingStart: '1em',
      textAlign: 'center',
      textStyle: 'h3',
    },
    menuconfigpanel_part_title_1: {
      textStyle: 'h2',
      textAlign: 'center',
      display: 'block',
      height: '2rem'
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
      alignItems: 'center'
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
      gridTemplateColumns: '1fr 5fr 1fr 1fr',
      gridColumnGap: '0.25rem',
      height: '2rem'
    },
    menuconfigpanel_zdt_row_droplist: {
      display: 'grid',
      gridTemplateColumns: '1fr 6fr 1fr 1fr 1fr',
      gridColumnGap: '0.25rem',
      height: '2rem'
    },
    menuconfigpanel_row_stylechoice: {
      display: 'grid',
      gridTemplateColumns: '1fr 6fr 1fr',
      gridColumnGap: '0.25rem',
      height: '2rem'
    },
    menuconfigpanel_row_2cols: {
      display: 'grid',
      gridTemplateColumns: '2fr 3fr',
      gridColumnGap: '0.25rem',
      height: '2rem'
    },
    menuconfigpanel_2row_3cols: {
      display: 'grid',
      gridTemplateColumns: '2fr 1.5fr 1.5fr',
      gridTemplateRows: '1fr 2fr',
      gridColumnGap: '0.25rem',
      gridRowGap: '0',
      height: '3rem'
    },
    MenuNavTop:{
      display: 'grid',
      gridTemplateColumns: '0.5fr 0.5fr 3fr 2fr 1fr 0.5fr',
      gridColumnGap: '0.25rem',
      height: '6rem',
      alignItems:'center',
      background:'white'
    },
    MenuNavTopUser:{
      display: 'grid',
      gridTemplateColumns: '1fr 3fr',
      gridColumnGap: '60rem',
      height: '6rem',
      alignItems:'center',
      background:'white'
    },
    MenuNavTopUserNavigation:{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 0.5fr',
      gridColumnGap: '0.25rem',

    },
    account_row:{
      display: 'grid',
      gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr',
      p:{
        margin:'0'
      }
    },
    MenuNavfooter:{
      display: 'flex',
      width:'100%',
      height: '1rem',
      alignItems:'center',
      background:'white',
      zIndex:1, position:'fixed',bottom:0,fontSize:'0.85em'
    },
    MenuNavfooterSubItem:{
      flex:'auto'
    },
    option_with_activation: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gridColumnGap: '0.12rem',
      height: '2rem'
    },
    options_2cols: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridColumnGap: '0.12rem',
      height: '2rem'
    },
    options_3cols: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gridColumnGap: '0.12rem',
      height: '2rem'
    },
    options_4cols: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr 1fr',
      gridColumnGap: '0.12rem',
      height: '2rem'
    },
    menustylepanel_row_droplist: {
      display: 'grid',
      gridTemplateColumns: '1fr 6fr 1fr',
      gridColumnGap: '0.25rem',
      height: '2rem'
    },
    title_menu_draggable: {
      display: 'grid',
      gridTemplateColumns: '9fr 1fr',
      gridColumnGap: '0.25rem',
      zIndex:1,
      borderBottom:' 1px solid #eceeef',
      lineHeight:'1.5rem',
      backgroundColor:'white',
      position:'sticky',
      top:'0',
      padding:'1rem'
    },
    popover_sidebar_row_tag_filter: {
      display: 'grid',
      gridTemplateColumns: '4fr 1fr',
      gridColumnGap: '0.25rem',
      height: '2rem'
    },
  },
  textStyles: {
    xs: {
      fontSize: '16px',
    },
    sm: {
      fontSize: '14px',
    },
    md:{
      fontSize: '12px',
    },
    lg: {
      fontSize: '10px',
    },
    xl: {
      fontSize: '8px',
    },
    h1: {
      fontFamily: 'Open Sans,sans-serif',
      fontSize: '16px',
    },
    h2: {
      fontFamily: 'Open Sans,sans-serif',
      fontSize:'14px',
      fontWeight:'bold',
    },
    h3: {
      fontFamily: 'Open Sans,sans-serif',
      fontSize: '12px',
      fontWeight:'bold',
    },
    h4: {
      fontFamily: 'Open Sans,sans-serif',
      fontSize: '12px',
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
  }
})