import { MutableRefObject } from 'react'
import { Type_GenericApplicationDataOS } from '../../deps/OpenSankey+/deps/OpenSankey/types/TypesOS'


export type FCType_ModalWelcomeOS = {
  new_data: Type_GenericApplicationDataOS;
  active_page: string;
  // set_active_page : (_:string)=>void,
  never_see_again: MutableRefObject<boolean>;
  additional_shortcut_item: JSX.Element[];
  external_pagination: { [x: string]: JSX.Element; };
  external_content: {
    read_me: string | JSX.Element | JSX.Element[];
    intro: JSX.Element;
    rc: JSX.Element;
    licence?: JSX.Element;
    news: JSX.Element;
    interface: JSX.Element;
  };
};
