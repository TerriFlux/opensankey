
import { SankeyPlusLinkStyle } from './types'
import { default_link_style } from 'open-sankey/dist/SankeyUtils'

export const default_sankey_plus_style_link=()=>{
  const style=default_link_style() as SankeyPlusLinkStyle
  style.gradient=false
  return style
}