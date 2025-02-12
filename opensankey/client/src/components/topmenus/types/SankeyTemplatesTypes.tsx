// ==================================================================================================
// Author : Julien ALAPETITE & Vincent LE DOZE & Vincent CLAVEL for TerriFlux
// All rights reserved for TerriFlux
//
// ==================================================================================================

import { FType_ProcessFunctions } from '../../../types/FunctionTypes'
import { Type_GenericApplicationData, Type_AdditionalMenus } from '../../../types/Types'


export type FCtype_ModalTemplate = {
  new_data: Type_GenericApplicationData
  additionalMenu: Type_AdditionalMenus
  Reinitialization: () => void
}

export type FCType_ModalTuto = {
  new_data: Type_GenericApplicationData
  processFunctions: FType_ProcessFunctions
  show_tuto: boolean
  set_show_tuto: (b: boolean) => void
  Reinitialization: () => void
}

