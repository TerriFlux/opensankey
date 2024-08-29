import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, SankeyNode, applicationContextType, applicationDataType, applicationStateType } from '../../types/Types'

/**
   * Tab that handle tag association to nodes, a nodes can have tags from the same grouptag or from different group
   * To visaulize nodes according to their tag associated, the groupTags must be at least have it banner in mode one or mutliple
   * then in the nodes filter button, select the groupTag you want to apply and in the dropdown select the node/nodes you want to see
   *
   * @type {*}
   */
export type SankeyMenuConfigurationNodesTagsFType = {
  applicationContext : applicationContextType,
  applicationData : applicationDataType,
  applicationState : applicationStateType,
  node_function:NodeFunctionTypes,
  link_function:LinkFunctionTypes,
  ComponentUpdater:ComponentUpdaterType,
  menu_for_modal:boolean
}


// Check if all value of the attribute "k" is the same in the selected nodes (or selected style)
// If the value come from local attribute or the style of the node doesn't matter, we look only the value
export type IsAllNodeTagsSame=(
  m_s_n:SankeyNode[],
  key_tag:string,key_grp_tag:string
)=> [boolean,boolean]
