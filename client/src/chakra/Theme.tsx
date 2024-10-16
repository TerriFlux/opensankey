import { extendTheme } from '@chakra-ui/react'
import { Theme_SankeyPlus } from '../deps/OpenSankey+/chakra/Theme'



export const Theme_SA = extendTheme({

})

const Theme = {}

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

deep_assign(Theme_SankeyPlus, Theme)
deep_assign(Theme_SA, Theme)

export const Theme_SankeyApplication = Theme
