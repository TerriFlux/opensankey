import { extendTheme } from '@chakra-ui/react'
import {
  accordion_base_style,
  accordion_sublevel_style
} from './AccordionStyles'
import {
  button_base_style,
  menuconfigpanel_option_button
} from './Button'
import {
  checkbox_base_style,
  menuconfigpanel_part_title_1_checkbox,
  menuconfigpanel_option_checkbox
} from './CheckboxStyles'
import {
  input_base_style,
  menuconfigpanel_option_input,
  menuconfigpanel_option_input_color,
} from './InputStyle'
import {
  numberinput_base_style,
  menuconfigpanel_option_numberinput,
  menuconfigpanel_option_numberinput_with_right_addon,
} from './NumberInputStyle'

export const opensankey_theme = extendTheme({
  components: {
    Accordion: {
      baseStyle: accordion_base_style,
      variants: { accordion_sublevel_style }
    },
    Button: {
      baseStyle: button_base_style,
      variants: {
        menuconfigpanel_option_button
      }
    },
    Checkbox: {
      baseStyle: checkbox_base_style,
      variants: {
        menuconfigpanel_part_title_1_checkbox,
        menuconfigpanel_option_checkbox }
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
      gridRowGap: '0.1rem',
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
    }
  },
  textStyles: {
    h1: {
      // you can also use responsive styles
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