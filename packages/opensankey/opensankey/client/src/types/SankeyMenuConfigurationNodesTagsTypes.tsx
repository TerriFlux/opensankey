import { TFunction } from 'i18next'
import { SankeyData, SankeyNode } from './Types'

/**
   * Tab that handle tag association to nodes, a nodes can have tags from the same grouptag or from different group
   * To visaulize nodes according to their tag associated, the groupTags must be at least have it banner in mode one or mutliple
   * then in the nodes filter button, select the groupTag you want to apply and in the dropdown select the node/nodes you want to see
   *
   * @type {*}
   */
export type SankeyMenuConfigurationNodesTagsFType = (
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  multi_selected_nodes:{current:SankeyNode[]},
  tags_group_key:string,
  set_tags_group_key:(_:string)=>void
)=> JSX.Element


// Check if all value of the attribute "k" is the same in the selected nodes (or selected style)
// If the value come from local attribute or the style of the node doesn't matter, we look only the value
export type IsAllNodeTagsSame=(m_s_n:SankeyNode[],key_tag:string,key_grp_tag:string)=> [boolean,boolean]
