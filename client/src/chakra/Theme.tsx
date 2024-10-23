import { extendTheme } from '@chakra-ui/react'
import { Theme_SankeyPlus } from '../deps/OpenSankey+/chakra/Theme'
import { Type_JSON } from '../deps/OpenSankey+/deps/OpenSankey/types/Utils'

import {
  btn_accountpage,
  btn_accountpage_danger,
  btn_accountpage_embedded,
  btn_lone_navigation,
  btn_lone_navigation_primary,
  btn_lone_navigation_secondary,
  btn_lone_navigation_tertiary,
  btn_lone_navigation_tertiary_negative,
  menutop_button_goto_dashboard,
  menutop_button_logout
} from './ButtonStyles'
import {
  form_account_page,
  form_base_style
} from './FormControl'
import {
  modal_account
} from './ModalStyle'

const _text_style_log = {
  fontFamily: 'Open Sans,sans-serif',
  fontSize: '14px',
  fontWeight: 'normal'
}

export const Theme_SA = {
  components:{
    Button:{
      variants:{
        btn_lone_navigation,
        btn_lone_navigation_primary,
        btn_lone_navigation_secondary,
        btn_lone_navigation_tertiary,
        btn_lone_navigation_tertiary_negative,
        btn_accountpage,
        btn_accountpage_embedded,
        btn_accountpage_danger,
        menutop_button_logout,
        menutop_button_goto_dashboard
      }
    },
    Form: {
      baseStyle: form_base_style,
      variants: {
        form_account_page
      }
    },
    Modal: {
      variants: {
        modal_account
      }
    }
  },
  layerStyles: {
    account_row: {
      display: 'grid',
      gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr',
      gridColumnGap: '0.25rem',
      alignItems: 'center',
      p: {
        margin: '0'
      }
    },
    account_grid_col: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridColumnGap: '12px'
    },
    account_grid_row: {
      display: 'grid',
      gridRowGap: '12px',
      gridAutoFlow: 'row'
    },
    account_card_title: {
      backgroundColor: 'tertiaire.2',
      border: '0px',
      borderRadius: '6px',
      color: 'white',
      margin: '0',
      padding: '6px 0px 0px 6px',
    },
    account_card_content: {
      margin: '6px',
      display: 'grid',
      gridColumnGap: '6px',
      gridRowGap: '6px',
    },
    account_card_subcontent: {
      margin: '6px',
      display: 'grid',
      gridColumnGap: '3px',
      gridRowGap: '3px',
    }

  },
  textStyles: {
    account_log_error: {
      ..._text_style_log,
      color: 'primaire.1'
    },
    account_log_info: {
      ..._text_style_log,
      color: 'primaire.2'
    }
  }
}

const Theme = {}

const deep_assign = (s: Type_JSON, t: Type_JSON) => {
  Object.entries(s).forEach(k => {
    if (k[1] !== null && typeof (k[1]) == 'object') {
      if (Object.keys(t).includes(k[0])) {
        const next_source = s[k[0]] as Type_JSON
        const next_target = t[k[0]] as Type_JSON
        deep_assign(next_source, next_target)
      } else {
        t[k[0]] = s[k[0]]
      }
    } else {
      t[k[0]] = s[k[0]]
    }
  })
}

deep_assign(Theme_SankeyPlus, Theme)
deep_assign(Theme_SA, Theme)
export const Theme_SankeyApplication = extendTheme({...Theme})
