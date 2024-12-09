import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { resources_app_elements } from './traduction_app_elements.js'
import { resources_guided_tour } from './traduction_guided_tour.js'
import { resources_loading_toasts } from './traduction_loading_toasts.js'

/**
 * Concat s into t
 * @param {*} s
 * @param {*} t
 */
export const deep_assign_resources = (s, t) => {
  Object.entries(s).forEach(k => {
    if (typeof (k[1]) == 'object') {
      if (Object.keys(t).includes(k[0])) {
        deep_assign_resources(s[k[0]], t[k[0]])
      } else {
        t[k[0]] = s[k[0]]
      }
    } else if (typeof (k[1]) == 'string') {
      t[k[0]] = s[k[0]]
    }
  })
}

// Concat traductions resources
export const resources_opensankey = {}
deep_assign_resources(resources_app_elements, resources_opensankey)
deep_assign_resources(resources_guided_tour, resources_opensankey)
deep_assign_resources(resources_loading_toasts, resources_opensankey)

// Update traduction
const resources = resources_opensankey // /!\ i18next accept only var with name "resources"
i18next
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    // lng:'en', // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
    // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
    // if you're using a language detector, do not define the lng option

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  })

export default i18next