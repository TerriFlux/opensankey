import { extendTheme } from '@chakra-ui/react'
import { toolbar_button_4 } from './ButtonPlus'
import { opensankey_theme } from '../deps/OpenSankey/chakra/Theme'



export const Theme_OSP={
  components:{
    Button:{
      variants:{
        toolbar_button_4
      }
    }
  }
}

const Theme={}

// eslint-disable-next-line
const deep_assign = (s:Record<string, any>, t:Record<string, any>) => {
  Object.entries(s).forEach(k => {
    if (k[1]!==null && typeof (k[1]) == 'object') {
      if (Object.keys(t).includes(k[0]) ) {
        deep_assign(s[k[0]], t[k[0]])
      } else {
        t[k[0]] = s[k[0]]
      }
    } else{
      t[k[0]] = s[k[0]]
    }
  })
}

deep_assign(opensankey_theme,Theme)
deep_assign(Theme_OSP,Theme)

export const Theme_SankeyPlus = extendTheme({...Theme})
