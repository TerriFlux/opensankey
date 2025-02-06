import { Type_GenericApplicationData } from '../../../types/Types'

export type FCType_ModalWelcome = {
  new_data: Type_GenericApplicationData;
  external_pagination: { [x: string]: JSX.Element; };
  external_content: { [x: string]: JSX.Element; };
}

export type FCType_ModalWelcomeBuilder = {
  new_data: Type_GenericApplicationData
}
