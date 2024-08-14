import { TFunction, i18n } from 'i18next'
import {
  applicationDataType,
} from '../../types/LegacyType'

export type OpenSankeyDefaultModalePreferenceContentFType = (
  applicationData: applicationDataType,
  trad: i18n,
) => { lang: JSX.Element; form: JSX.Element[]; node_label_sep: JSX.Element; }

export type modalPreferenceTypes = {
  applicationData:applicationDataType,
  ui: (JSX.Element[] | JSX.Element)[],
  t: TFunction,
}