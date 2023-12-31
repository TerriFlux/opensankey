import { TFunction } from 'i18next'
import { SankeyData } from './Types'

export type SankeySettingsEditionElementTagsTypes = {
    t:TFunction,
    data: SankeyData,
    set_data : (_:SankeyData)=>void,
    elementTagNameProp: 'nodeTags' | 'fluxTags' | 'dataTags',
    elementNameProp: 'nodes' | 'links' | 'none'
  }
  