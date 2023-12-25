import { TFunction } from "i18next";
import { SankeyData, SankeyLink } from "./Types";

export type SankeyMenuConfigurationLinksTagsFType = (
  data:SankeyData,
  multi_selected_links:{current:SankeyLink[]},
  set_data:(d:SankeyData)=>void,
  tags_group_key:string,
  set_tags_group_key:React.Dispatch<React.SetStateAction<string>>,
  tags_selected:{[k: string]: string},
  set_tags_selected:React.Dispatch<React.SetStateAction<{[k: string]: string}>>,
  t:TFunction
)=> JSX.Element
