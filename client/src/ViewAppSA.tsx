// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import React, { FC, useEffect, useState } from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import i18next from 'i18next'
import { I18nextProvider, initReactI18next, useTranslation } from 'react-i18next'

import { Class_ApplicationDataSA } from './ApplicationDataSA'
import { Type_JSON } from './deps/OpenSankey+/deps/OpenSankey/types/Utils'
import { Theme_SankeyApplication } from './chakra/Theme'

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources: { en: { translation: {} } },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })
}

type ViewerSankeyApplicationProps = {
  initial_data?: Type_JSON
}

const ViewerInner: FC<ViewerSankeyApplicationProps> = ({ initial_data }) => {
  const { t, i18n } = useTranslation()

  const [app_data] = useState<Class_ApplicationDataSA>(() => {
    ;(window as unknown as { sankey?: { publish?: boolean } }).sankey = { publish: true }
    const data = new Class_ApplicationDataSA(true)
    data.t = t
    data.i18n = i18n
    return data
  })

  if (typeof app_data.createNewMenuConfiguration === 'function') {
    app_data.createNewMenuConfiguration()
  }

  useEffect(() => {
    if (initial_data) {
      app_data.fromJSON(initial_data)
    }
    app_data.draw()
  }, [app_data, initial_data])

  return <div id="sankey_app" style={{ backgroundColor: 'WhiteSmoke' }} />
}

export const ViewerSankeyApplication: FC<ViewerSankeyApplicationProps> = (props) => (
  <ChakraProvider theme={Theme_SankeyApplication}>
    <I18nextProvider i18n={i18next}>
      <ViewerInner {...props} />
    </I18nextProvider>
  </ChakraProvider>
)

export default ViewerSankeyApplication
