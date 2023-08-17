
import {SankeyPlusData,SankeyPlusLabel,differenceType} from './types'
import {convert_tags,convert_links,convert_nodes,convert_data,complete_sankey_data} from 'open-sankey/dist/SankeyConvert'
import { get_data_from_view } from './SankeyPlusViews'
import { default_sankey_data,default_link, default_node } from 'open-sankey/dist/SankeyUtils'
interface SankeyPlusLabelToConvert extends SankeyPlusLabel{
  transparent?:boolean,
  name?:string
}

/* eslint-disable */
// @ts-ignore
const deep_diff = require('deep-diff')
/* eslint-enable */


export const plus_convert_data = (data:SankeyPlusData)=>{

  if(data.labels){
    Object.values(data.labels).forEach((l:SankeyPlusLabelToConvert)=>{
      if(l.title===undefined){
        let idZdt = Object.keys(data.labels).length
        const tab_title=Object.values(data.labels).map(zdt=>zdt.title)
        while (tab_title.includes('Zone de texte '+idZdt) ) {
          idZdt = idZdt+1
        }
        l.title='Zone de texte '+idZdt
      }
      // CONVERT TEXT ZONE TRANSPARENT -> OPACITY (0-100)
      if(l.transparent!==undefined){
        l.opacity=l.transparent?0:100
        delete ((l as unknown) as SankeyPlusLabelToConvert ).transparent
      }

      if(((l as unknown) as SankeyPlusLabelToConvert ).name!==undefined){
        const new_content=((l as unknown) as SankeyPlusLabelToConvert).name
        l.content=new_content?new_content:''
        delete ((l as unknown) as SankeyPlusLabelToConvert ).name
      }

    })
  }

  if (!data.view) {
    return
  }

  // Convert old view (when we copied the entire data)
  data.view.forEach((v)=>{
    if((v.view_data as unknown as SankeyPlusData ).version){
      complete_sankey_data(v.view_data,default_sankey_data,default_node,default_link)
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
