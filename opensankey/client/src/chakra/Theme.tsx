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

import { extendTheme } from '@chakra-ui/react'

import {
  accordion_base_style,
} from './AccordionStyles'
import {
  badge_base_style,
  badge_on_template_img
} from './BadgeStyle'
import {
  button_base_style,
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
  menutop_button_datatags,
  menutop_button_save_in_cache,
  menutop_button_with_dropdown,
  menutop_button,
  submenu_nav_btn_dropdown_item_demo,
  toolbar_button_mouse_mode,
  toolbar_button_2,
  toolbar_button_3,
  toolbar_button_5,
  toolbar_button_6,
  toolbar_main_button,
  welcome_button_license_description,
  btn_documentation,
  button_is_spreadsheet,
  button_is_spreadsheet_selected,
  toolbar_button_mouse_mode_activated,
  toolbar_button_undo_redo,
  toolbar_button_undo_redo_activated,
  sizeToolbarButton,
  sizeMenuTopButton,
  sizeMenuTopButtonSaveCache,
  button_config_element,
  button_config_element_activated,
  button_type_config_activated,
  button_type_config,
  menu_sub_section_collapse_button,
  sizeCollapseButton,
  text_menu_select,
  template_button_reset,
  menuconfigpanel_move_order_node_io,
  sizeConfigButton,
  sizeButtonDialog,
  menuconfigpanel_option_button_primary_activated,
  menuconfigpanel_option_button_primary,
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
  cards_empty_template,
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
  drawer_menu_config,
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
  menu_select_elements,
  menu_select_style,
  menu_subnav_item_demo,
  selector_lang
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
  tabs_variant_lib_cion,
  tabs_variant_template
} from './TabStyles'
import {
  textarea_base_style
} from './TextAreaStyles'
import {
  table_edit_tag_node,
  table_base_style,
  table_edit_tag_link,
  table_edit_tag_data,
  table_edit_grp_tag_node_link,
  table_edit_grp_tag_data,
  table_edit_node_io
} from './TableStyle'
import {
  heading_base_style,
  heading_tab_pref,
  heading_template_dashboard,
  heading_template_sankey,
  heading_welcome_style,
} from './HeadingStyles'
import {
  breadcrumb_base_style,
  pagination_welcome
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
  modal_dialog,
  modal_welcome,
  modal_documentation
} from './ModalStyle'
import {
  spinner_base_style
} from './Spinner'
import { edit_name_palette, editable_base_style, name_file_editable } from './EditableStyle'

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