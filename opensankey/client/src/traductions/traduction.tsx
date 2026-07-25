import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { resources_app_elements } from './traduction_app_elements'
import { resources_nodes } from './traduction_nodes'
import { resources_flux } from './traduction_links'
import { resources_guided_tour } from './traduction_guided_tour'
import { resources_inspector } from './traduction_inspector'
import { resources_search } from './traduction_search'
import { resources_loading_toasts } from './traduction_loading_toasts'
import { resources_template } from './traduction_templates'
import { resources_welcome } from './traduction_welcome'
import { resources_spreadsheet } from './traduction_spreadsheet'
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
  // Merge chaque langue présente dans la cible ; repli sur l'anglais si la
  // source ne fournit pas cette langue.
  const merge_all_langs = (source: I18nResources, target: I18nResources): void => {
    langs_of(target).forEach(lang => {
      const src = source[lang] ?? source.en
      deep_merge_translations(src.translation, target[lang]!.translation)
    })
  }

  // Intégrer les traductions du menu général
  merge_all_langs(missing_menu_translations as unknown as I18nResources, resources_app_elements)

  // Intégrer les traductions des labels de nœuds
  merge_all_langs(missing_node_labels_translations as unknown as I18nResources, resources_nodes)

  // Intégrer les traductions de l'apparence des nœuds
  merge_all_langs(missing_node_apparence_translations as unknown as I18nResources, resources_nodes)

  // Intégrer les traductions de l'apparence des flux
  merge_all_langs(missing_flux_apparence_translations as unknown as I18nResources, resources_flux)
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
const SUPPORTED_LANGS = ['en', 'fr', 'es', 'de', 'it', 'zh-CN'] as const
type SupportedLang = typeof SUPPORTED_LANGS[number]

// Langues effectivement présentes dans un objet resources (racines en/fr/es/de/it/zh-CN)
const langs_of = (resources: I18nResources): SupportedLang[] =>
  SUPPORTED_LANGS.filter(lang => resources[lang] !== undefined)

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
  es?: LanguageResource
  de?: LanguageResource
  it?: LanguageResource
  'zh-CN'?: LanguageResource
}

interface LanguageLabels {
  en: string
  fr: string
  es?: string
  de?: string
  it?: string
  'zh-CN'?: string
}

interface LanguageTooltips {
  en: string
  fr: string
  es?: string
  de?: string
  it?: string
  'zh-CN'?: string
}

interface ToggleLabels {
  en: { true: string; false: string }
  fr: { true: string; false: string }
  es?: { true: string; false: string }
  de?: { true: string; false: string }
  it?: { true: string; false: string }
  'zh-CN'?: { true: string; false: string }
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

// Version mise à jour pour MenuConfig — injecte toutes les langues présentes
// dans resources, avec repli sur l'anglais si la config ne fournit pas la langue.
export const use_context_config = (
  resources: I18nResources,
  menu_config: MenuConfig,
  path: string
): void => {
  langs_of(resources).forEach(lang => {
    const translation = resources[lang]!.translation

    // Initialiser les structures de traduction
    translation[path] = { tooltips: {} }
    const context = translation[path] as TranslationSection

    // Traitement des titres de section
    Object.entries(menu_config.sectionTitles).forEach(([attributeKey, attributeValue]) => {
      context[attributeKey] = attributeValue[lang] ?? attributeValue.en
    })

    // Traitement des actions
    Object.entries(menu_config.actions).forEach(([actionKey, actionConfig]) => {
      const { labels, labelsToggle, tooltips } = actionConfig

      // Labels principaux
      context[actionKey] = labels[lang] ?? labels.en

      // Labels pour les toggles
      if (labelsToggle) {
        const toggle = labelsToggle[lang] ?? labelsToggle.en
        context[actionKey + 'True'] = toggle.true
        context[actionKey + 'False'] = toggle.false
      }

      // Tooltips
      context.tooltips![actionKey] = tooltips[lang] ?? tooltips.en
    })
  })
}

const use_link_config = (resources: I18nResources): void => {
  const linksConfig = ALL_ATTRIBUTES_CONFIG as Record<string, AttributeConfig>

  // Génération automatique des traductions pour chaque attribut
  Object.entries(linksConfig).forEach(([attributeKey, config]) => {
    const { category, labels, tooltips } = config

    // Déterminer la section et sous-section
    let section: SectionType
    const target: TargetType = 'Flux'

    if (category === 'shape') {
      section = 'apparence' // Les shapes sont principalement pour les flux
    } else {
      section = 'labels' // Les labels peuvent être pour flux ou noeuds
    }

    langs_of(resources).forEach(lang => {
      const translation = resources[lang]!.translation

      // Assurer que les structures existent
      if (!translation[target]) {
        translation[target] = { tooltips: {} }
      }
      const targetSection = translation[target] as TranslationSection
      if (!targetSection[section]) {
        targetSection[section] = { tooltips: {} }
      }
      const sectionTr = targetSection[section] as TranslationSection

      // Ajouter les labels et les tooltips
      sectionTr[attributeKey] = labels[lang] ?? labels.en
      sectionTr.tooltips![attributeKey] = tooltips[lang] ?? tooltips.en
    })
  })
}

interface ElementSelectionConfig {
  labels: Record<string, LanguageLabels>
  tooltips: Record<string, LanguageTooltips>
}

interface ElementsSelectionConfig {
  node: ElementSelectionConfig
  link: ElementSelectionConfig
  container: ElementSelectionConfig
  common: {
    labels: Record<string, LanguageLabels>
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

  langs_of(resources).forEach(lang => {
    const translation = resources[lang]!.translation

    ;(['node', 'link', 'container'] as const).forEach(elementType => {
      const config = elements_config[elementType]
      const translationPath = typeMapping[elementType]

      // Initialiser les structures pour ce type d'élément
      if (!translation[translationPath]) {
        translation[translationPath] = { tooltips: {} }
      }
      const target = translation[translationPath] as TranslationSection

      // S'assurer que tooltips existe
      if (!target.tooltips) {
        target.tooltips = {} as Record<string, string | Record<string, string>>
      }
      const tooltipsTr = target.tooltips as Record<string, string>

      // Ajouter les labels au niveau racine (ex: Noeud.TS, Flux.NS)
      Object.entries(config.labels).forEach(([key, value]) => {
        target[key] = value[lang] ?? value.en
      })

      // Ajouter les tooltips (ex: Noeud.tooltips.plus, Flux.tooltips.slct)
      Object.entries(config.tooltips).forEach(([key, value]) => {
        tooltipsTr[key] = value[lang] ?? value.en
      })
    })

    // Traiter les labels communs dans Menu
    if (!translation['Menu']) {
      translation['Menu'] = { tooltips: {} }
    }
    const menu = translation['Menu'] as TranslationSection

    Object.entries(elements_config.common.labels).forEach(([key, value]) => {
      menu[key] = value[lang] ?? value.en
    })
  })
}

const use_node_config = (resources: I18nResources): void => {
  const nodesConfig = ALL_ATTRIBUTES_CONFIG as Record<string, AttributeConfig>

  // Génération automatique des traductions pour chaque attribut
  Object.entries(nodesConfig).forEach(([attributeKey, config]) => {
    const { category, labels, tooltips } = config

    // Déterminer la section et sous-section
    let section: SectionType
    const target: TargetType = 'Noeud'

    if (category === 'shape') {
      section = 'apparence'
    } else {
      section = 'labels'
    }

    langs_of(resources).forEach(lang => {
      const translation = resources[lang]!.translation

      // Assurer que les structures existent
      if (!translation[target]) {
        translation[target] = { tooltips: {} }
      }
      const targetSection = translation[target] as TranslationSection
      if (!targetSection[section]) {
        targetSection[section] = { tooltips: {} }
      }
      const sectionTr = targetSection[section] as TranslationSection

      // Ajouter les labels et les tooltips
      sectionTr[attributeKey] = labels[lang] ?? labels.en
      sectionTr.tooltips![attributeKey] = tooltips[lang] ?? tooltips.en
    })
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
deep_assign_resources(resources_inspector as Record<string, unknown>, resources_opensankey)
deep_assign_resources(resources_search as Record<string, unknown>, resources_opensankey)
deep_assign_resources(resources_loading_toasts as Record<string, unknown>, resources_opensankey)
deep_assign_resources(resources_template as Record<string, unknown>, resources_opensankey)
deep_assign_resources(resources_spreadsheet as Record<string, unknown>, resources_opensankey)
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
    fallbackLng: 'en', // clé absente dans la langue courante → libellé anglais plutôt que la clé brute

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  })

export default i18next