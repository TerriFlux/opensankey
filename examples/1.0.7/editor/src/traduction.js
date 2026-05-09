import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import { resources_opensankey } from 'open-sankey/dist/traductions/traduction.js'

i18next
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources_opensankey,
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  })

export default i18next
