import { extendTheme } from '@chakra-ui/react'
import { Theme_SankeyPlus } from '../deps/OpenSankey+/chakra/Theme'
import { Type_JSON } from '../deps/OpenSankey+/deps/OpenSankey/types/Utils'



export const Theme_SA = {}

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
