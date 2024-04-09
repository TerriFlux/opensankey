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
} from './ButtonStyles'
import {
  checkbox_base_style,
  menuconfigpanel_part_title_1_checkbox,
  menuconfigpanel_option_checkbox,
  menuconfigpanel_tag_checkbox
} from './CheckboxStyles'
import {
  input_base_style,
  menuconfigpanel_option_input,
  menuconfigpanel_option_input_color,
} from './InputStyles'
import {
  numberinput_base_style,
  menuconfigpanel_option_numberinput,
  menuconfigpanel_option_numberinput_with_right_addon,
} from './NumberInputStyles'
import {
  select_base_style,
  select_custom_style,
  menuconfigpanel_option_select
} from './SelectStyles'
import {
  slider_base_style
} from './SliderStyles'
import {
  tabs_base_style
} from './TabStyles'
import {
  textarea_base_style
} from './TextAreaStyles'

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
      }
    },
    Checkbox: {
      baseStyle: checkbox_base_style,
      variants: {
        menuconfigpanel_part_title_1_checkbox,
        menuconfigpanel_option_checkbox,
        menuconfigpanel_tag_checkbox
      }
    },
    Input: {
      baseStyle: input_base_style,
      variants: {
        menuconfigpanel_option_input,
        menuconfigpanel_option_input_color,
      }
    },
    NumberInput: {
      baseStyle: numberinput_base_style,
      variants: {
        menuconfigpanel_option_numberinput,
        menuconfigpanel_option_numberinput_with_right_addon
      }
    },
    Select: {
      baseStyle: select_base_style,
      variants: {
        select_custom_style,
        menuconfigpanel_option_select
      }
    },
    Slider: {
      baseStyle: slider_base_style
    },
    Tabs: {
      baseStyle: tabs_base_style,
    },
    TextArea: {
      baseStyle: textarea_base_style
    }
  },
  layerStyles: {
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
      display: 'grid',
      gridTemplateColumns: '3fr 1fr',
      gridColumnGap: '0.25rem',
      height: '2rem',
      textStyle: 'h3',
      textAlign: 'center',
      flex: '1',
      paddingStart: '0',
      paddingEnd: '0',
      color: 'openSankey.400'
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
      gridTemplateColumns: '1fr 6fr 1fr 1fr',
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