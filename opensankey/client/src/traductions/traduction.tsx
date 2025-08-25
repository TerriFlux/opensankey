import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { resources_app_elements } from './traduction_app_elements'
import { resources_nodes } from './traduction_nodes'
import { resources_flux } from './traduction_links'
import { resources_guided_tour } from './traduction_guided_tour'
import { resources_loading_toasts } from './traduction_loading_toasts'
import { resources_template } from './traduction_templates'
import { resources_welcome } from './traduction_welcome'
import { LINKS_ATTRIBUTES_CONFIG } from '../Elements/LinkAttributesConfig'
import { NODES_ATTRIBUTES_CONFIG } from '../Elements/NodeAttributesConfig'
import { EXCEL_ATTRIBUTES_CONFIG } from '../components/dialogs/ExcelModalSaver'
import { ZDD_MENU_CONFIG } from '../components/dialogs/ContextZDDConfig'
import { MenuConfig } from '../components/dialogs/SankeyMenuContext'
import { LINK_MENU_CONFIG } from '../components/dialogs/ContextLinkConfig'
import { rcc_shortcuts } from './traduction_rcc_shortcuts'

const use_excel_config = (resources:any) => {
    resources.en.translation['Menu']['saveExcel'] = {tooltips:{}}
    resources.fr.translation['Menu']['saveExcel'] = {tooltips:{}}
    Object.entries(EXCEL_ATTRIBUTES_CONFIG).forEach(([attributeKey, config]) => {
       const { labels, tooltips } = config
      resources.en.translation['Menu']['saveExcel'][attributeKey] = labels.en
      resources.fr.translation['Menu']['saveExcel'][attributeKey] = labels.fr

      // Ajouter les tooltips
      resources.en.translation['Menu']['saveExcel'].tooltips[attributeKey] = tooltips.en
      resources.fr.translation['Menu']['saveExcel'].tooltips[attributeKey] = tooltips.fr  
    })
}

export const use_context_config = (resources:any, menu_config:MenuConfig, path:string) => {
    resources.en.translation[path] = {tooltips:{}}
    resources.fr.translation[path] = {tooltips:{}}
    Object.entries(menu_config.sectionTitles).forEach(([attributeKey, attributeValue]) => {
      resources.en.translation[path][attributeKey] = attributeValue.en
      resources.fr.translation[path][attributeKey] = attributeValue.fr
    })
    Object.entries(menu_config.actions).forEach((item) => {
      const { labels, labelsToggle } = item[1]
      resources.en.translation[path][item[0]] = labels.en
      resources.fr.translation[path][item[0]] = labels.fr
      if (labelsToggle) {
        resources.en.translation[path][item[0] + 'True'] = labelsToggle.en.true
        resources.en.translation[path][item[0] + 'False'] = labelsToggle.en.false
        resources.fr.translation[path][item[0] + 'True'] = labelsToggle.fr.true
        resources.fr.translation[path][item[0] + 'False'] = labelsToggle.fr.false
      }

      resources.en.translation[path].tooltips[item[0]] = item[1].tooltips.en
      resources.fr.translation[path].tooltips[item[0]] = item[1].tooltips.fr
    })
}

const use_link_config = (resources:any) => {
  // Génération automatique des traductions pour chaque attribut
  Object.entries(LINKS_ATTRIBUTES_CONFIG).forEach(([attributeKey, config]) => {
    const { category, labels, tooltips } = config

    // Déterminer la section et sous-section
    let section //: 'labels' | 'apparence'
    let target //: 'Flux' | 'Noeud'

    if (category === 'shape') {
      section = 'apparence'
      target = 'Flux' // Les shapes sont principalement pour les flux
    } else {
      section = 'labels'
      target = 'Flux' // Les labels peuvent être pour flux ou noeuds
    }

    // Ajouter les labels
    resources.en.translation[target][section][attributeKey] = labels.en
    resources.fr.translation[target][section][attributeKey] = labels.fr

    // Ajouter les tooltips
    resources.en.translation[target][section].tooltips[attributeKey] = tooltips.en
    resources.fr.translation[target][section].tooltips[attributeKey] = tooltips.fr

    // Dupliquer pour les noeuds si c'est un attribut de label
    // if (section === 'labels') {
    //   resources.en.translation.Noeud[section][attributeKey] = labels.en
    //   resources.fr.translation.Noeud[section][attributeKey] = labels.fr
    //   resources.en.translation.Noeud.tooltips[attributeKey] = tooltips.en
    //   resources.fr.translation.Noeud.tooltips[attributeKey] = tooltips.fr
    // }
  })
}

const use_node_config = (resources:any) => {
  // Génération automatique des traductions pour chaque attribut
  Object.entries(NODES_ATTRIBUTES_CONFIG).forEach(([attributeKey, config]) => {
    const { category, labels, tooltips } = config

    // Déterminer la section et sous-section
    let section //: 'labels' | 'apparence'
    let target //: 'Flux' | 'Noeud'

    if (category === 'shape') {
      section = 'apparence'
      target = 'Noeud' // Les shapes sont principalement pour les flux
    } else {
      section = 'labels'
      target = 'Noeud' // Les labels peuvent être pour flux ou noeuds
    }

    // Ajouter les labels
    resources.en.translation[target][section][attributeKey] = labels.en
    resources.fr.translation[target][section][attributeKey] = labels.fr

    // Ajouter les tooltips
    resources.en.translation[target][section].tooltips[attributeKey] = tooltips.en
    resources.fr.translation[target][section].tooltips[attributeKey] = tooltips.fr

    // Dupliquer pour les noeuds si c'est un attribut de label
    // if (section === 'labels') {
    //   resources.en.translation.Noeud[section][attributeKey] = labels.en
    //   resources.fr.translation.Noeud[section][attributeKey] = labels.fr
    //   resources.en.translation.Noeud.tooltips[attributeKey] = tooltips.en
    //   resources.fr.translation.Noeud.tooltips[attributeKey] = tooltips.fr
    // }
  })
}

/**
 * Concat s into t
 * @param {*} s
 * @param {*} t
 */
export const deep_assign_resources = (s:any, t:any) => {
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

use_link_config(resources_flux)
use_node_config(resources_nodes)
use_excel_config(resources_app_elements)
use_context_config(resources_app_elements,ZDD_MENU_CONFIG,'ContextMenuZDD')
use_context_config(resources_app_elements,LINK_MENU_CONFIG,'ContextMenuLinks')

// Concat traductions resources
export const resources_opensankey = {}
deep_assign_resources(rcc_shortcuts, resources_opensankey)
deep_assign_resources(resources_app_elements, resources_opensankey)
deep_assign_resources(resources_nodes, resources_opensankey)
deep_assign_resources(resources_flux, resources_opensankey)
deep_assign_resources(resources_welcome, resources_opensankey)
deep_assign_resources(resources_guided_tour, resources_opensankey)
deep_assign_resources(resources_loading_toasts, resources_opensankey)
deep_assign_resources(resources_template, resources_opensankey)

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