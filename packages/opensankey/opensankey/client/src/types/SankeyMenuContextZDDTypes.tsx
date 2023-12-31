import { TFunction } from 'i18next'
import { showMenuComponentsType, SankeyData } from './Types'

export type ContextMenuZddFType = (
  showMenuComponents:showMenuComponentsType,
  show_context_zdd : boolean,
  set_show_context_zdd : (_:boolean)=>void,
  data:SankeyData,set_data:(d:SankeyData)=>void,
  pointer_pos:{current:number[]},
  node_hspace:number,
  set_node_hspace:(n:number)=>void,
  node_vspace:number,
  set_node_vspace:(n:number)=>void,
  t:TFunction
)=> JSX.Element