import { TFunction } from 'i18next'
import { SankeyData, SankeyLink } from './Types'
import { RefObject } from 'react'

export type SankeyMenuConfigurationLinksDataFType = (
  data:SankeyData,
  tags_selected:{[k: string]: string},
  multi_selected_links:{current:SankeyLink[]},
  set_data:(d:SankeyData)=>void,
  t:TFunction,
  additional_data_element:JSX.Element[],
  displayedInputLinkValueRef : RefObject<HTMLInputElement>,
  pre_idSource:string,
  set_pre_idSource:(s:string)=>void,
  pre_idTarget:string,
  set_pre_idTarget:(s:string)=>void,
  menu_for_modal : boolean,
) => JSX.Element

