import { TFunction, i18n } from 'i18next'
import { 
  NodeFunctionTypes, SankeyData, dict_hook_ref_setter_show_dialog_componentsType, dict_variable_application_dataType 
} from '../../types/Types'

export type OpenSankeyDefaultModalePreferenceContentFType=(
  t:TFunction,
  dict_variable_application_data:dict_variable_application_dataType,
  trad:i18n,
  updateMenus:[boolean, React.Dispatch<React.SetStateAction<boolean>>],
  node_function:NodeFunctionTypes
)=> { lang: JSX.Element; form: JSX.Element[]; node_label_sep: JSX.Element; }

export type preferenceCheckFType = (str: string,data:SankeyData) => void

export type modalPreferenceTypes = {
  dict_hook_ref_setter_show_dialog_components:dict_hook_ref_setter_show_dialog_componentsType,
  ui: (JSX.Element[] | JSX.Element)[],
  t:TFunction,
  pointer_pos:{current:number[]}
}