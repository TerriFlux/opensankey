import { Type_GenericApplicationDataOS } from '../../types/TypesOS'

export type FCType_ModalWelcome = {
  new_data: Type_GenericApplicationDataOS;
  active_page: string;
  external_pagination: { [x: string]: JSX.Element; };
  external_content: { [x: string]: JSX.Element; };
}

export type FCType_ModalWelcomeBuilder = {
  new_data: Type_GenericApplicationDataOS
}
