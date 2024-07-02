import { extendTheme } from '@chakra-ui/react'

import {
  accordion_base_style,
  accordion_sublevel_style
} from './AccordionStyles'
import {
  badge_base_style
} from './BadgeStyle'
import {
  btn_desc_licence,
  contextmenu_button,
  btn_lone_navigation,
  btn_navigation,
  button_base_style,
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
  menuconfigpanel_option_button_secondary,
  menuconfigpanel_option_button_tertiary,
  menuconfigpanel_option_button,
  menutop_button_goto_dashboard,
  menutop_button_logout,
  menutop_button_save_in_cache,
  menutop_button_with_dropdown,
  menutop_button,
  submenu_nav_btn_dropdown_item_demo,
  token_blocker_activated,
  token_blocker_deactivated,
  toolbar_button_1,
  toolbar_button_2,
  toolbar_button_3,
  toolbar_button_4,
  toolbar_button_5,
  toolbar_button_6,
  toolbar_main_button,
  menuconfigpanel_option_button_secondary_activated,
  menuconfigpanel_option_button_tertiary_activated
} from './ButtonStyles'
import {
  buttongroup_base_style,
  buttongroup_sideBar
} from './ButtonGroupStyle'
import {
  card_account,
  card_base_style,
  card_icon_not_selected,
  card_icon_selected,
  card_import_icon,
  card_register,
  cards_template
} from './CardStyle'
import {
  checkbox_base_style,
  menuconfigpanel_part_title_1_checkbox,
  menuconfigpanel_option_checkbox,
  menuconfigpanel_tag_checkbox,
  activate_antagonist_checkbox,
  checkbox_dont_show_again
} from './CheckboxStyles'
import {
  close_button_base_style
} from './CloseButtonStyle'
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
  menu_button_subnav_account_style,
  menu_button_subnav_style,
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
import {
  heading_base_style,
  heading_template_dashboard,
  heading_welcome_style
} from './HeadingStyles'
import {
  breadcrumb_base_style,
  pagination_welecome
} from './BreadcrumbStyle'
import {
  tag_base_style,
  tag_dev_navbar
} from './TagStyle'
import {
  popover_base_style,
  toolbar_popover_window
} from './PopoverStyle'
import {
  modal_base_style,
  modal_select_unit_from_data,
  modal_select_unit_from_excel,
  modal_welcome
} from './ModalStyle'

export const opensankey_theme = extendTheme({
  components: {
    Accordion: {
      baseStyle: accordion_base_style,
      variants: { accordion_sublevel_style }
    },
    Badge: {
      baseStyle: badge_base_style,
    },
    Button: {
      baseStyle: button_base_style,
      variants: {
        btn_desc_licence,
        btn_lone_navigation,
        btn_navigation,
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
        menuconfigpanel_option_button_secondary_activated,
        menuconfigpanel_option_button_secondary,
        menuconfigpanel_option_button_tertiary_activated,
        menuconfigpanel_option_button_tertiary,
        menuconfigpanel_option_button,
        menutop_button_goto_dashboard,
        menutop_button_logout,
        menutop_button_save_in_cache,
        menutop_button_with_dropdown,
        menutop_button,
        submenu_nav_btn_dropdown_item_demo,
        token_blocker_activated,
        token_blocker_deactivated,
        toolbar_button_1,
        toolbar_button_2,
        toolbar_button_3,
        toolbar_button_4,
        toolbar_button_5,
        toolbar_button_6,
        toolbar_main_button,
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
        cards_template,
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
        menu_button_subnav_account_style,
        menu_subnav_item_demo,
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
        heading_welcome_style,
        heading_template_dashboard,
      }
    }
  },
  layerStyles: {
    box_footer_welcome:{
      display:'grid'
    },
    context_menu:{
      display:'grid',
      rowGap:'0.1rem',
      background:'white',
      border:'1px solid gray',
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
    menuconfigpanel_row_3cols: {
      display: 'grid',
      gridTemplateColumns: '2fr 1.5fr 1.5fr',
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
    menutop_layout_style:{
      display: 'grid',
      gridColumnGap: '0.25rem',
      height: '6rem',
      width: 'auto',
      marginLeft: '0.5rem',
      marginRight: '0.5rem',
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
      height: '2rem',
      marginLeft: '0.5rem',
      marginRight: '0.5rem'
    },
    menubottom_item_style: {
      display: 'flex',
      color: 'black',
      textStyle: 'h4',
      alignSelf: 'center',
      justifySelf: 'center'
    },
    menutop_userpages_layout_style:{
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      gridColumnGap: '0',
      width:'100%',
      height: '6rem',
      alignItems:'center',
      background:'gray.50',
      color: 'gray.600',
      img:{
        height:'6rem',
        padding:'0.25rem'
      }
    },
    account_row:{
      display: 'grid',
      gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr',
      gridColumnGap: '0.25rem',
      alignItems: 'center',
      p:{
        margin:'0'
      }
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
    licence_row:{
      display: 'grid',
      gridTemplateColumns: '1fr 3fr',
      gridColumnGap: '0.25rem',
    },
    licence_row_inverse:{
      display: 'grid',
      gridTemplateColumns: '3fr 1fr',
      gridColumnGap: '0.25rem',
    },
    licence_desc:{
      whiteSpace:'pre-line'
    },
    menustylepanel_row_droplist: {
      display: 'grid',
      gridTemplateColumns: '1fr 6fr 1fr',
      gridColumnGap: '0.25rem',
      height: '2rem'
    },
    popover_sidebar_row_tag_filter: {
      display: 'grid',
      gridTemplateColumns: '4fr 1fr',
      gridColumnGap: '0.25rem',
      height: '2rem'
    },
    popover_sidebar_layout_filter: {
      display: 'grid',
      gridTemplateColumns: 'auto 15rem 5rem',
      gridColumnGap: '1.25rem',
      height: '2rem',
      alignItems: 'center'
    },
    menucontext_layout: {
      padding: '0.25rem',
      display: 'grid',
      gridRowGap: '0.5rem',
      gridColGap: '0.5rem',
      alignItems: 'center',
      width: 'fit-content',
      maxWidth: '40vw',
      color: 'gray.600',
      bg: 'white',
      bgColor: 'white',
      border: 'solid 1px',
      borderColor: 'primaire.2',
      borderRadius: '6px',
    },
    menucontext_title_layout: {
      display: 'grid',
      gridTemplateColumns: '9fr 1fr',
      gridColumnGap: '0.25rem',
      margin: '0.25rem',
      borderBottom:' 1px solid',
      borderBottomColor: 'primaire.2',
      height:'2rem',
      alignItems: 'center',
      alignContent: 'center'
    },
    menucontext_entries_layout: {
      display: 'grid',
      gridRowGap: '0.25rem',
      fontStyle: 'h4',
      alignItems: 'center',
      margin: '0.25rem'
    },
    image_layout: {
      height: '100%',
      margin: '1rem'
    }
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
      fontWeight:'bold',
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
      fontWeight:'normal',
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