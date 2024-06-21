import { ComponentUpdaterType, applicationContextType, applicationDataType } from '../../types/Types'

export type SankeySettingsEditionElementTagsTypes = {
    applicationContext:applicationContextType,
    applicationData : applicationDataType,
    elementTagNameProp: 'node_taggs' | 'flux_taggs' | 'data_taggs',
    ComponentUpdater:ComponentUpdaterType,
    reDrawLegend:()=>void
  }
