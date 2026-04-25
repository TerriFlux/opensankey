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
import { ZDD_MENU_CONFIG } from '../components/dialogs/ContextZDDConfig'
import { LINK_MENU_CONFIG } from '../components/dialogs/ContextLinkConfig'
import { NODE_MENU_CONFIG } from '../components/dialogs/ContextNodeConfig'
import { rcc_shortcuts } from './traduction_rcc_shortcuts'
import { translations } from '../components/dialogs/PersistenceProcessDialogConfigs'
import { ALL_ATTRIBUTES_CONFIG } from '../Elements/ElementsAttributesConfig'
import { ELEMENTS_MENU_CONFIG } from '../components/configmenus/MenuElementsSelection'
import { missing_flux_apparence_translations, missing_menu_translations, missing_node_apparence_translations, missing_node_labels_translations } from '../components/configmenus/MenuElementsAppearance'


// ==================================================================================================
// 5. FONCTION D'INTÉGRATION DANS LE SYSTÈME i18n
// ==================================================================================================

type TranslationTree = { [key: string]: unknown }

/**
 * Fonction utilitaire pour merger profondément les traductions
 * @param source - Objet source à fusionner
 * @param target - Objet cible qui recevra les nouvelles traductions
 */
export const deep_merge_translations = (source: TranslationTree, target: TranslationTree): void => {
  Object.entries(source).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (!target[key]) {
        target[key] = {}
      }
      deep_merge_translations(value as TranslationTree, target[key] as TranslationTree)
    } else {
      target[key] = value
    }
  })
}

/**
 * Fonction pour intégrer toutes les traductions manquantes
 * À appeler dans ton fichier i18n principal
 */
export const integrate_missing_translations = (
  resources_app_elements: I18nResources,
  resources_nodes: I18nResources,
  resources_flux: I18nResources
): void => {
  // Intégrer les traductions du menu général
  deep_merge_translations(missing_menu_translations.en.translation, resources_app_elements.en.translation)
  deep_merge_translations(missing_menu_translations.fr.translation, resources_app_elements.fr.translation)

  // Intégrer les traductions des labels de nœuds
  deep_merge_translations(missing_node_labels_translations.en.translation, resources_nodes.en.translation)
  deep_merge_translations(missing_node_labels_translations.fr.translation, resources_nodes.fr.translation)

  // Intégrer les traductions de l'apparence des nœuds
  deep_merge_translations(missing_node_apparence_translations.en.translation, resources_nodes.en.translation)
  deep_merge_translations(missing_node_apparence_translations.fr.translation, resources_nodes.fr.translation)

  // Intégrer les traductions de l'apparence des flux
  deep_merge_translations(missing_flux_apparence_translations.en.translation, resources_flux.en.translation)
  deep_merge_translations(missing_flux_apparence_translations.fr.translation, resources_flux.fr.translation)
}

interface TranslationItem {
  en: string
  fr: string
  [key: string]: unknown
}

interface TranslationConfig {
  [key: string]: TranslationItem | TranslationConfig
}

/**
 * Convertit le format { key: { en: '...', fr: '...' } }
 * en format i18next { en: { translation: { key: '...' } }, fr: { translation: { key: '...' } } }
 */
const SUPPORTED_LANGS = ['en', 'fr', 'es', 'de', 'it'] as const
type SupportedLang = typeof SUPPORTED_LANGS[number]

const convertToI18nFormat = (
  config: TranslationConfig,
  path: string[] = []
): Record<SupportedLang, Record<string, unknown>> => {
  const result = Object.fromEntries(
    SUPPORTED_LANGS.map(lang => [lang, {} as Record<string, unknown>])
  ) as Record<SupportedLang, Record<string, unknown>>

  Object.entries(config).forEach(([key, value]) => {
    if (value && typeof value === 'object' && 'en' in value && 'fr' in value) {
      // C'est une feuille avec traductions
      for (const lang of SUPPORTED_LANGS) {
        result[lang][key] = (value as Record<string, unknown>)[lang] ?? (value as Record<string, unknown>).en
      }
    } else if (value && typeof value === 'object') {
      // C'est un objet imbriqué, récursion
      const nested = convertToI18nFormat(value as TranslationConfig, [...path, key])
      for (const lang of SUPPORTED_LANGS) {
        result[lang][key] = nested[lang]
      }
    }
  })

  return result
}

// Convertir les traductions
const converted = convertToI18nFormat(translations as unknown as TranslationConfig)
export const resources_process_dialog = Object.fromEntries(
  SUPPORTED_LANGS.map(lang => [lang, { translation: converted[lang] }])
)
interface TranslationSection {
  tooltips?: Record<string, string | Record<string, string>>  // ✅ Permet imbrication
  [key: string]: string | TranslationSection | Record<string, string | Record<string, string>> | undefined
}

interface LanguageResource {
  translation: Record<string, TranslationSection | string>
}

export interface I18nResources {
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

// interface ExcelAttributeConfig {
//   labels: LanguageLabels
//   tooltips: LanguageTooltips
// }

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

// const use_excel_config = (resources: I18nResources): void => {
//   // Initialiser avec le bon type
//   const menuEn = resources.en.translation['Menu'] as TranslationSection
//   const menuFr = resources.fr.translation['Menu'] as TranslationSection
  
//   menuEn['saveExcel'] = { tooltips: {} }
//   menuFr['saveExcel'] = { tooltips: {} }
  
//   const excelConfig = EXCEL_ATTRIBUTES_CONFIG as Record<string, ExcelAttributeConfig>
  
//   Object.entries(excelConfig).forEach(([attributeKey, config]) => {
//     const { labels, tooltips } = config
//     const saveExcelEn = menuEn['saveExcel'] as TranslationSection
//     const saveExcelFr = menuFr['saveExcel'] as TranslationSection
    
//     saveExcelEn[attributeKey] = labels.en
//     saveExcelFr[attributeKey] = labels.fr
    
//     // Ajouter les tooltips
//     saveExcelEn.tooltips![attributeKey] = tooltips.en
//     saveExcelFr.tooltips![attributeKey] = tooltips.fr
//   })
// }

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
  const linksConfig = ALL_ATTRIBUTES_CONFIG as Record<string, AttributeConfig>
  
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

interface ElementSelectionConfig {
  labels: Record<string, { en: string; fr: string }>
  tooltips: Record<string, { en: string; fr: string }>
}

interface ElementsSelectionConfig {
  node: ElementSelectionConfig
  link: ElementSelectionConfig
  container: ElementSelectionConfig
  common: {
    labels: Record<string, { en: string; fr: string }>
  }
}


export const use_elements_selection_config = (
  resources: I18nResources,
  elements_config: ElementsSelectionConfig
): void => {
  // Traiter chaque type d'élément (node, link, container)
  const typeMapping = {
    node: 'Noeud',
    link: 'Flux',
    container: 'Container'
  } as const

  (['node', 'link', 'container'] as const).forEach(elementType => {
    const config = elements_config[elementType]
    const translationPath = typeMapping[elementType]
    
    // Initialiser les structures pour ce type d'élément
    const elementEn = resources.en.translation[translationPath] as TranslationSection
    const elementFr = resources.fr.translation[translationPath] as TranslationSection
    
    if (!elementEn) {
      resources.en.translation[translationPath] = { tooltips: {} }
    }
    if (!elementFr) {
      resources.fr.translation[translationPath] = { tooltips: {} }
    }
    
    const targetEn = resources.en.translation[translationPath] as TranslationSection
    const targetFr = resources.fr.translation[translationPath] as TranslationSection
    
    // S'assurer que tooltips existe
    if (!targetEn.tooltips) {
      targetEn.tooltips = {} as Record<string, string | Record<string, string>>
    }
    if (!targetFr.tooltips) {
      targetFr.tooltips = {} as Record<string, string | Record<string, string>>
    }
    
    const tooltipsEn = targetEn.tooltips as Record<string, string>
    const tooltipsFr = targetFr.tooltips as Record<string, string>
    
    // Ajouter les labels au niveau racine (ex: Noeud.TS, Flux.NS)
    Object.entries(config.labels).forEach(([key, value]) => {
      targetEn[key] = value.en
      targetFr[key] = value.fr
    })
    
    // Ajouter les tooltips (ex: Noeud.tooltips.plus, Flux.tooltips.slct)
    Object.entries(config.tooltips).forEach(([key, value]) => {
      tooltipsEn[key] = value.en
      tooltipsFr[key] = value.fr
    })
  })
  
  // Traiter les labels communs dans Menu
  const menuEn = resources.en.translation['Menu'] as TranslationSection
  const menuFr = resources.fr.translation['Menu'] as TranslationSection
  
  Object.entries(elements_config.common.labels).forEach(([key, value]) => {
    menuEn[key] = value.en
    menuFr[key] = value.fr
  })
}

const use_node_config = (resources: I18nResources): void => {
  const nodesConfig = ALL_ATTRIBUTES_CONFIG as Record<string, AttributeConfig>
  
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

use_elements_selection_config(
  resources_app_elements as unknown as I18nResources,
  ELEMENTS_MENU_CONFIG
)

// use_excel_config(resources_app_elements as unknown as I18nResources)
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

// ✅ INTÉGRATION DES TRADUCTIONS MANQUANTES
integrate_missing_translations(
  resources_app_elements as unknown as I18nResources,
  resources_nodes as unknown as I18nResources,
  resources_flux as unknown as I18nResources
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
deep_assign_resources(resources_process_dialog as Record<string, unknown>, resources_opensankey)
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