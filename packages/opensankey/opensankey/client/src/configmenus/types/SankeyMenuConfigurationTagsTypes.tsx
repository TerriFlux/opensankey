import { TFunction } from 'i18next'
import { ComponentUpdaterType, LinkFunctionTypes, NodeFunctionTypes, dict_variable_application_dataType } from '../../types/Types'

export type SankeySettingsEditionElementTagsTypes = {
    t:TFunction,
    dict_variable_application_data : dict_variable_application_dataType,
    elementTagNameProp: 'nodeTags' | 'fluxTags' | 'dataTags',
    elementNameProp: 'nodes' | 'links' | 'none',
    node_function:NodeFunctionTypes,
    link_function:LinkFunctionTypes,
    ComponentUpdater:ComponentUpdaterType
  }
  