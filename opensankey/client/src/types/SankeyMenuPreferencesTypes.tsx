import { TFunction, i18n } from 'i18next'
import { SankeyData } from './Types'


export type OpenSankeyDefaultModalePreferenceContentFType=(
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  trad:i18n
)=> { lang: JSX.Element; form: JSX.Element[]; node_label_sep: JSX.Element; }

export type preferenceCheckFType = (str: string,data:SankeyData) => void

export type modalPreferenceTypes = {
  showPreference: boolean,
  setShowPreference: (_:boolean)=>void,
  ui: (JSX.Element[] | JSX.Element)[],
  t:TFunction
}