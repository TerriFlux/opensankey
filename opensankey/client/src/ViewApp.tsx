// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import React, { FC, useEffect, useState } from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import i18next from 'i18next'
import { I18nextProvider, initReactI18next, useTranslation } from 'react-i18next'

import { Class_ApplicationData } from './types/ApplicationData'
import { Type_AnyJSON, Type_JSON } from './types/Utils'
import { applyViewerOptions, ViewerSankeyOptions } from './types/PublishOptions'

if (!i18next.isInitialized) {
  i18next.use(initReactI18next).init({
    resources: { en: { translation: {} } },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })
}

export type ViewerOpenSankeyAppProps = ViewerSankeyOptions & {
  initial_data?: Type_AnyJSON
}

const ViewerInner: FC<ViewerOpenSankeyAppProps> = ({ initial_data, ...options }) => {
  const { t, i18n } = useTranslation()

  const [app_data] = useState<Class_ApplicationData>(() => {
    applyViewerOptions(options)
    const data = new Class_ApplicationData(true)
    data.t = t
    data.i18n = i18n
    return data
  })

  // createNewMenuConfiguration appelle des hooks Chakra (useToast) en interne :
  // doit etre invoque pendant le render, pas depuis un useEffect (sinon
  // React error #321 "Invalid hook call").
  if (typeof app_data.createNewMenuConfiguration === 'function') {
    app_data.createNewMenuConfiguration()
  }

  useEffect(() => {
    if (initial_data) {
      app_data.fromJSON(initial_data as unknown as Type_JSON)
    }
    app_data.draw()
  }, [app_data, initial_data])

  return <div id="sankey_app" style={{ backgroundColor: 'WhiteSmoke' }} />
}

export const ViewerOpenSankeyApp: FC<ViewerOpenSankeyAppProps> = (props) => (
  <ChakraProvider>
    <I18nextProvider i18n={i18next}>
      <ViewerInner {...props} />
    </I18nextProvider>
  </ChakraProvider>
)

export default ViewerOpenSankeyApp
