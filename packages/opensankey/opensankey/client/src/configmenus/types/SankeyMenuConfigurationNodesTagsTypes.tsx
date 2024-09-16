import { Type_GenericApplicationDataOS } from '../../types/TypesOS'

/**
   * Tab that handle tag association to nodes, a nodes can have tags from the same grouptag or from different group
   * To visaulize nodes according to their tag associated, the groupTags must be at least have it banner in mode one or mutliple
   * then in the nodes filter button, select the groupTag you want to apply and in the dropdown select the node/nodes you want to see
   *
   * @type {*}
   */
export type FCType_SankeyMenuConfigurationNodesTags = {
  new_data: Type_GenericApplicationDataOS,
  menu_for_modal: boolean
}