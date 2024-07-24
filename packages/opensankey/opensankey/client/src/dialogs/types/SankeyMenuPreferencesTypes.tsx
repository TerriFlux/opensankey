import { TFunction, i18n } from 'i18next'
import {
  NodeFunctionTypes,
  dict_hook_ref_setter_show_dialog_componentsType,
  applicationDataType,
  applicationContextType
} from '../../types/Types'

export type OpenSankeyDefaultModalePreferenceContentFType = (
  applicationContext: applicationContextType,
  applicationData: applicationDataType,
  trad: i18n,
  node_function: NodeFunctionTypes
) => { lang: JSX.Element; form: JSX.Element[]; node_label_sep: JSX.Element; }

export type modalPreferenceTypes = {
  dict_hook_ref_setter_show_dialog_components: dict_hook_ref_setter_show_dialog_componentsType,
  ui: (JSX.Element[] | JSX.Element)[],
  t: TFunction,
  pointer_pos: {current: number[]}
}