
import { SankeyPlusData, SankeyPlusLinkStyle,SankeyPlusLabel,SankeyPlusNode } from './types'
import { default_link_style } from 'open-sankey/dist/SankeyUtils'
import {drag_legend_g_element} from 'open-sankey/dist/SankeyDrawLegend'
import * as d3 from 'd3'
import { opposing_drag_elements_plus } from './SankeyPlusNodes'
export const default_sankey_plus_style_link=()=>{
  const style=default_link_style() as SankeyPlusLinkStyle
  style.gradient=false
  return style
}

export  const drag_legend_plus = (data:SankeyPlusData,
  set_data:(d:SankeyPlusData)=>void,
  multi_selected_label:{current:SankeyPlusLabel[]}
) => d3.drag<SVGGElement, unknown>()
  .subject(Object).on('drag', function (event) {

    if(d3.select('.opensankey #svg').nodes().length>0){
      drag_legend_g_element(data,event)
      if(data.legend_position[0]===0 ||data.legend_position[1]===0){
        opposing_drag_elements_plus([({x: data.legend_position[0], y:data.legend_position[1]} as SankeyPlusNode)],event,({} as SankeyPlusNode),data,{current:[]},multi_selected_label)
      }
    }
  }).on('end',()=>set_data({...data}))