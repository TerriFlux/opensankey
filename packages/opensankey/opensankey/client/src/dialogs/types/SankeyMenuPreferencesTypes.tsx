import { TFunction, i18n } from 'i18next'
import { ComponentUpdaterType, SankeyData, dict_hook_ref_setter_show_dialog_componentsType } from '../../types/Types'


export type OpenSankeyDefaultModalePreferenceContentFType=(
  t:TFunction,
  data:SankeyData,
  trad:i18n,
  ComponentUpdater:ComponentUpdaterType
)=> { lang: JSX.Element; form: JSX.Element[]; node_label_sep: JSX.Element; }

export type preferenceCheckFType = (str: string,data:SankeyData) => void

export type modalPreferenceTypes = {
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  ui: (JSX.Element[] | JSX.Element)[],
  t:TFunction
}