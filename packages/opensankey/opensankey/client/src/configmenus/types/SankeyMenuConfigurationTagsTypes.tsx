import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, applicationContextType, applicationDataType } from '../../types/Types'

export type SankeySettingsEditionElementTagsTypes = {
    applicationContext:applicationContextType,
    applicationData : applicationDataType,
    elementTagNameProp: 'nodeTags' | 'fluxTags' | 'dataTags',
    elementNameProp: 'nodes' | 'links' | 'none',
    node_function:NodeFunctionTypes,
    link_function:LinkFunctionTypes,
    ComponentUpdater:ComponentUpdaterType,
    reDrawLegend:()=>void
  }
  