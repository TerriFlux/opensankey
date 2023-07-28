
import {SankeyPlusData,SankeyPlusLabel,differenceType} from './types'
import {convert_tags,convert_links,convert_nodes,convert_data} from 'open-sankey/dist/SankeyConvert'
import { get_data_from_view } from './SankeyPlusViews'
interface SankeyPlusLabelToConvert extends SankeyPlusLabel{
  transparent?:boolean
}

/* eslint-disable */
// @ts-ignore
const deep_diff = require('deep-diff')
/* eslint-enable */


export const plus_convert_data = (data:SankeyPlusData)=>{

  if(data.labels){
    Object.values(data.labels).forEach((l:SankeyPlusLabelToConvert)=>{
      if(l.is_edit_raw===undefined){
        l.is_edit_raw=true
      }
      if(l.isTextHTML===undefined){
        l.isTextHTML=false
        l.is_edit_raw=true
      }
      if(['haut','bas'].includes(l.position_vert)){
        if(l.position_vert==='haut'){
          l.position_vert='top'
        }else if(l.position_vert==='bas'){
          l.position_vert='bottom'
        }
      }
      if(['gauche','droite'].includes(l.position_horiz)){
        if(l.position_horiz==='gauche'){
          l.position_horiz='left'
        }else if(l.position_horiz==='droite'){
          l.position_horiz='right'
        }
      }
      // CONVERT TEXT ZONE TRANSPARENT -> OPACITY (0-100)
      if(l.transparent!==undefined){
        l.opacity=l.transparent?0:100
        delete ((l as unknown) as SankeyPlusLabelToConvert ).transparent
      }
    })
  }

  if (!data.view) {
    return
  }

  // Convert old view (when we copied the entire data)
  data.view.forEach((v)=>{
    if((v.view_data as unknown as SankeyPlusData ).version){
      convert_tags(v.view_data as unknown as SankeyPlusData)
      convert_nodes(v.view_data as unknown as SankeyPlusData)
      convert_links(v.view_data as unknown as SankeyPlusData)

      let difference = deep_diff.diff(data, v.view_data)
      difference=(difference!==undefined)?difference:[]
      difference=JSON.parse(JSON.stringify(difference)).map((d:{path:string[],kind:string,item:{kind:string}})=>{
        if(d.kind==='D'){
          delete ((d as unknown) as differenceType).lhs
        }
        if(d.kind==='A' && d.item.kind==='D'){
          delete ((d as unknown) as differenceType).item.lhs
        }
        if(d.kind==='E'){
          delete ((d as unknown) as differenceType).lhs
        }
        return d
      })
      difference=difference.filter((d:{path:string[]})=>!d.path.includes('view'));
      (v.view_data as {diff:object[]}).diff=difference
    }
    if(v.view_data.diff){
      const d_view=get_data_from_view(data,v.id)
      convert_data(d_view)
      const converted_master=JSON.parse(JSON.stringify(data))
      convert_data(converted_master)

      let difference = deep_diff.diff(converted_master, d_view)
      difference=(difference !== undefined)?difference:[]
      v.view_data.diff=difference
    }

  })
}
export const plus_sankey_layout=(data:SankeyPlusData,new_layout:SankeyPlusData)=>{
  (data as unknown as {labels:{[x: string]:SankeyPlusLabel}}).labels = {}
  for (const layout_label in (new_layout as unknown as {labels:{[x: string]:SankeyPlusLabel}}).labels) {
    (data as unknown as {labels:{[x: string]:SankeyPlusLabel}}).labels[layout_label] = 
      (new_layout as unknown as {labels:{[x: string]:SankeyPlusLabel}}).labels[layout_label]
  }
}
