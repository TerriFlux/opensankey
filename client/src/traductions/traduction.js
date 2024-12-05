import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { deep_assign_resources, resources_opensankey} from '../deps/OpenSankey+/deps/OpenSankey/traductions/traduction.js'
import { resources_opensankeyplus } from '../deps/OpenSankey+/traductions/traduction.js'
import { resources_app_elements } from './traductions_app_elements.js'

// Increments ressources
export const resources_sankeyapp = {}
deep_assign_resources(resources_opensankey, resources_sankeyapp)
deep_assign_resources(resources_opensankeyplus, resources_sankeyapp)
deep_assign_resources(resources_app_elements, resources_sankeyapp)

// Create traductions
const resources = resources_sankeyapp // /!\ i18next accept only var with name "resources"
i18next
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  })

export default i18next