import { TFunction, i18n } from "i18next"
import { SankeyData } from "./Types"


export type OpenSankeyDefaultModalePreferenceContentFType=(
  t:TFunction,
  data:SankeyData,
  set_data:(d:SankeyData)=>void,
  trad:i18n
)=> JSX.Element

export type preferenceCheck = (str: string,data:SankeyData) => void

