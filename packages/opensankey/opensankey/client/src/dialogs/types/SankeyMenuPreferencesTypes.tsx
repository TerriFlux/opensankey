import { i18n } from 'i18next'
import { Type_GenericApplicationDataOS } from '../../types/TypesOS'

export type FType_OpenSankeyDefaultModalePreferenceContent = (
  new_data: Type_GenericApplicationDataOS,
  trad: i18n,
) => { lang: JSX.Element; form: JSX.Element[]; node_label_sep: JSX.Element; }

export type FCType_ModalPreference = {
  new_data: Type_GenericApplicationDataOS,
  ui: (JSX.Element[] | JSX.Element)[]
}