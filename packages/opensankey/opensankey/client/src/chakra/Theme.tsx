import { extendTheme } from '@chakra-ui/react'
import { accordion_base_style, accordion_sublevel_style } from './AccordionStyles'
import { checkbox_base_style, checkbox_title_style } from './CheckboxStyles'

export const opensankey_theme = extendTheme({
  components: {
    Accordion: {
      baseStyle: accordion_base_style,
      variants: { accordion_sublevel_style }
    },
    Checkbox: {
      baseStyle: checkbox_base_style,
      variants: { checkbox_title_style }
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
    submenuconfig_part: {
      textStyle: 'h2',
      textAlign: 'center',
      display: 'block'
    },

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
      100: '#66a59366',
      200: '#66a593',
    }
  }
})