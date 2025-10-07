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
import { LINK_MENU_CONFIG } from '../components/dialogs/ContextLinkConfig'
import { NODE_MENU_CONFIG } from '../components/dialogs/ContextNodeConfig'
import { rcc_shortcuts } from './traduction_rcc_shortcuts'

interface TranslationSection {
  tooltips?: Record<string, string>
  [key: string]: string | TranslationSection | Record<string, string> | undefined
}

interface LanguageResource {
  translation: Record<string, TranslationSection | string>
}

interface I18nResources {
  en: LanguageResource
  fr: LanguageResource
}

interface LanguageLabels {
  en: string
  fr: string
}

interface LanguageTooltips {
  en: string
  fr: string
}

interface ToggleLabels {
  en: { true: string; false: string }
  fr: { true: string; false: string }
}

interface AttributeConfig {
  labels: LanguageLabels
  tooltips: LanguageTooltips
  category?: string
}

interface ExcelAttributeConfig {
  labels: LanguageLabels
  tooltips: LanguageTooltips
}

interface ActionConfig {
  labels: LanguageLabels
  labelsToggle?: ToggleLabels
  tooltips: LanguageTooltips
}

interface MenuConfig {
  sectionTitles: Record<string, LanguageLabels>
  actions: Record<string, ActionConfig>
}

type SectionType = 'labels' | 'apparence'
type TargetType = 'Flux' | 'Noeud'

const use_excel_config = (resources: I18nResources): void => {
  // Initialiser avec le bon type
  const menuEn = resources.en.translation['Menu'] as TranslationSection
  const menuFr = resources.fr.translation['Menu'] as TranslationSection
  
  menuEn['saveExcel'] = { tooltips: {} }
  menuFr['saveExcel'] = { tooltips: {} }
  
  const excelConfig = EXCEL_ATTRIBUTES_CONFIG as Record<string, ExcelAttributeConfig>
  
  Object.entries(excelConfig).forEach(([attributeKey, config]) => {
    const { labels, tooltips } = config
    const saveExcelEn = menuEn['saveExcel'] as TranslationSection
    const saveExcelFr = menuFr['saveExcel'] as TranslationSection
    
    saveExcelEn[attributeKey] = labels.en
    saveExcelFr[attributeKey] = labels.fr
    
    // Ajouter les tooltips
    saveExcelEn.tooltips![attributeKey] = tooltips.en
    saveExcelFr.tooltips![attributeKey] = tooltips.fr
  })
}

// Version mise à jour pour MenuConfig
export const use_context_config = (
  resources: I18nResources,
  menu_config: MenuConfig,
  path: string
): void => {
  // Initialiser les structures de traduction
  resources.en.translation[path] = { tooltips: {} }
  resources.fr.translation[path] = { tooltips: {} }
  
  const contextEn = resources.en.translation[path] as TranslationSection
  const contextFr = resources.fr.translation[path] as TranslationSection

  // Traitement des titres de section
  Object.entries(menu_config.sectionTitles).forEach(([attributeKey, attributeValue]) => {
    contextEn[attributeKey] = attributeValue.en
    contextFr[attributeKey] = attributeValue.fr
  })

  // Traitement des actions
  Object.entries(menu_config.actions).forEach(([actionKey, actionConfig]) => {
    const { labels, labelsToggle, tooltips } = actionConfig

    // Labels principaux
    contextEn[actionKey] = labels.en
    contextFr[actionKey] = labels.fr

    // Labels pour les toggles
    if (labelsToggle) {
      contextEn[actionKey + 'True'] = labelsToggle.en.true
      contextEn[actionKey + 'False'] = labelsToggle.en.false
      contextFr[actionKey + 'True'] = labelsToggle.fr.true
      contextFr[actionKey + 'False'] = labelsToggle.fr.false
    }

    // Tooltips
    contextEn.tooltips![actionKey] = tooltips.en
    contextFr.tooltips![actionKey] = tooltips.fr
  })
}

const use_link_config = (resources: I18nResources): void => {
  const linksConfig = LINKS_ATTRIBUTES_CONFIG as Record<string, AttributeConfig>
  
  // Génération automatique des traductions pour chaque attribut
  Object.entries(linksConfig).forEach(([attributeKey, config]) => {
    const { category, labels, tooltips } = config

    // Déterminer la section et sous-section
    let section: SectionType
    let target: TargetType

    if (category === 'shape') {
      section = 'apparence'
      target = 'Flux' // Les shapes sont principalement pour les flux
    } else {
      section = 'labels'
      target = 'Flux' // Les labels peuvent être pour flux ou noeuds
    }

    // Assurer que les structures existent
    const targetEn = resources.en.translation[target] as TranslationSection
    const targetFr = resources.fr.translation[target] as TranslationSection
    
    if (!targetEn[section]) {
      targetEn[section] = { tooltips: {} }
    }
    if (!targetFr[section]) {
      targetFr[section] = { tooltips: {} }
    }
    
    const sectionEn = targetEn[section] as TranslationSection
    const sectionFr = targetFr[section] as TranslationSection

    // Ajouter les labels
    sectionEn[attributeKey] = labels.en
    sectionFr[attributeKey] = labels.fr

    // Ajouter les tooltips
    sectionEn.tooltips![attributeKey] = tooltips.en
    sectionFr.tooltips![attributeKey] = tooltips.fr
  })
}

const use_node_config = (resources: I18nResources): void => {
  const nodesConfig = NODES_ATTRIBUTES_CONFIG as Record<string, AttributeConfig>
  
  // Génération automatique des traductions pour chaque attribut
  Object.entries(nodesConfig).forEach(([attributeKey, config]) => {
    const { category, labels, tooltips } = config

    // Déterminer la section et sous-section
    let section: SectionType
    let target: TargetType

    if (category === 'shape') {
      section = 'apparence'
      target = 'Noeud' // Les shapes sont principalement pour les flux
    } else {
      section = 'labels'
      target = 'Noeud' // Les labels peuvent être pour flux ou noeuds
    }

    // Assurer que les structures existent
    const targetEn = resources.en.translation[target] as TranslationSection
    const targetFr = resources.fr.translation[target] as TranslationSection
    
    if (!targetEn[section]) {
      targetEn[section] = { tooltips: {} }
    }
    if (!targetFr[section]) {
      targetFr[section] = { tooltips: {} }
    }
    
    const sectionEn = targetEn[section] as TranslationSection
    const sectionFr = targetFr[section] as TranslationSection

    // Ajouter les labels
    sectionEn[attributeKey] = labels.en
    sectionFr[attributeKey] = labels.fr

    // Ajouter les tooltips
    sectionEn.tooltips![attributeKey] = tooltips.en
    sectionFr.tooltips![attributeKey] = tooltips.fr
  })
}

/**
 * Concat s into t
 */
export const deep_assign_resources = (
  s: Record<string, unknown>,
  t: Record<string, unknown>
): void => {
  Object.entries(s).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (Object.keys(t).includes(key)) {
        deep_assign_resources(
          value as Record<string, unknown>,
          t[key] as Record<string, unknown>
        )
      } else {
        t[key] = value
      }
    } else if (typeof value === 'string') {
      t[key] = value
    }
  })
}

// Application des configurations de traduction
use_link_config(resources_flux as unknown as I18nResources)
use_node_config(resources_nodes as unknown as I18nResources)
use_excel_config(resources_app_elements as unknown as I18nResources)
use_context_config(
  resources_app_elements as unknown as I18nResources,
  ZDD_MENU_CONFIG as unknown as MenuConfig,
  'ContextMenuZDD'
)
use_context_config(
  resources_app_elements as unknown as  I18nResources,
  LINK_MENU_CONFIG as unknown as MenuConfig,
  'ContextMenuLinks'
)
use_context_config(
  resources_app_elements as unknown as  I18nResources,
  NODE_MENU_CONFIG as unknown as MenuConfig,
  'ContextMenuNodes'
)

// Concat traductions resources
export const resources_opensankey: Record<string, unknown> = {}
deep_assign_resources(rcc_shortcuts as Record<string, unknown>, resources_opensankey)
deep_assign_resources(resources_app_elements as Record<string, unknown>, resources_opensankey)
deep_assign_resources(resources_nodes as Record<string, unknown>, resources_opensankey)
deep_assign_resources(resources_flux as Record<string, unknown>, resources_opensankey)
deep_assign_resources(resources_welcome as Record<string, unknown>, resources_opensankey)
deep_assign_resources(resources_guided_tour as Record<string, unknown>, resources_opensankey)
deep_assign_resources(resources_loading_toasts as Record<string, unknown>, resources_opensankey)
deep_assign_resources(resources_template as Record<string, unknown>, resources_opensankey)

// Update traduction
const resources = resources_opensankey // /!\ i18next accept only var with name "resources"
i18next
  .use(LanguageDetector)
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    //@ts-expect-error xxx
    resources,
    // lng:'en', // language to use, more information here: https://www.i18next.com/overview/configuration-options#languages-namespaces-resources
    // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
    // if you're using a language detector, do not define the lng option

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  })

export default i18next