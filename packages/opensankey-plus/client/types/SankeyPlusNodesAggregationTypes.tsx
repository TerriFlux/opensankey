import { TFunction } from "i18next";
import { SankeyData } from "./Types";
import { SankeyNode } from 'open-sankey/types/Types';

export type SankeyPlusMenuConfigurationNodesAgregationFType = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]},
  parent_visible:boolean,
  set_parent_visible:React.Dispatch<React.SetStateAction<boolean>>,
  cube_dimension:string,
  set_cube_dimension:React.Dispatch<React.SetStateAction<string>>
) => JSX.Element

