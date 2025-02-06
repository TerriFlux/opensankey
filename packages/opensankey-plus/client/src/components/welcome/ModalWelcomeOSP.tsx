// Standard libs
import React, { FunctionComponent, useState } from 'react'

// OpenSankey libs
import { ModalWelcome, ModalWelcomeContent } from '../../deps/OpenSankey/components/welcome/ModalWelcome'
import { FCType_ModalWelcomeBuilder } from '../../deps/OpenSankey/components/welcome/types/ModalWelcome'


export const ModalWelcomeBuilderOSP: FunctionComponent<FCType_ModalWelcomeBuilder> = (
  { new_data }
) => {
  const [, setCount] = useState(0)
  new_data.menu_configuration.dict_setter_show_dialog.ref_setter_modal_welcome_active_page.current = () => setCount(a => a + 1)

  const [page_links, page_content] = ModalWelcomeContent(
    new_data,
  )

  return <ModalWelcome
    new_data={new_data}
    external_pagination={page_links}
    external_content={page_content}
  />
}

