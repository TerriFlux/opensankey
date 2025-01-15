import { extendTheme } from '@chakra-ui/react'

import { opensankey_theme } from '../deps/OpenSankey/chakra/Theme'

import {
  button_dataTagg_sequence_menu_pause,
  button_dataTagg_sequence_menu_play,
  button_dataTagg_sequence_pause,
  button_dataTagg_sequence_play,
  toolbar_button_4
} from './ButtonOSP'
import {
  drawer_sequence
} from './DrawerOSP'
import {
  baseStyleStepper,
  sequenceStepper
} from './StepperOSP'

export const opensankeyplus_theme = {
  components: {
    Button: {
      variants: {
        toolbar_button_4,
        button_dataTagg_sequence_play,
        button_dataTagg_sequence_pause,
        button_dataTagg_sequence_menu_play,
        button_dataTagg_sequence_menu_pause,
      }
    },
    Drawer: {
      variants: {
        drawer_sequence
      }
    },
    Stepper: {
      baseStyle: baseStyleStepper,
      variants: {
        sequenceStepper
      }
    }
  },
  layerStyles: {
    config_timeout_sequence: {
      display: 'grid',
      gridTemplateColumns: '0.5fr 0.5fr',
      gridColumnGap: '0.25rem',
    },
    box_sequence: {
      display: 'grid',
      gridTemplateColumns: '1fr 11fr',
      margin: '0.2rem'
    },
    box_stepper: {
      marginLeft: '16px',
      marginRight: '16px',
    }
  }
}

// eslint-disable-next-line
const deep_assign = (s: Record<string, any>, t: Record<string, any>) => {
  Object.entries(s).forEach(k => {
    if (k[1] !== null && typeof (k[1]) == 'object') {
      if (Object.keys(t).includes(k[0])) {
        deep_assign(s[k[0]], t[k[0]])
      } else {
        t[k[0]] = s[k[0]]
      }
    } else {
      t[k[0]] = s[k[0]]
    }
  })
}

const Theme = {}
deep_assign(opensankey_theme, Theme)
deep_assign(opensankeyplus_theme, Theme)

export const ThemeOSP = extendTheme({ ...Theme })
