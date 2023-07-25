
import {SankeyPlusData,SankeyPlusLabel} from './types'


interface SankeyPlusLabelToConvert extends SankeyPlusLabel{
  transparent?:boolean
}

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
}
export const plus_sankey_layout=(data:SankeyPlusData,new_layout:SankeyPlusData)=>{
  (data as unknown as {labels:{[x: string]:SankeyPlusLabel}}).labels = {}
  for (const layout_label in (new_layout as unknown as {labels:{[x: string]:SankeyPlusLabel}}).labels) {
    (data as unknown as {labels:{[x: string]:SankeyPlusLabel}}).labels[layout_label] = 
      (new_layout as unknown as {labels:{[x: string]:SankeyPlusLabel}}).labels[layout_label]
  }
}
