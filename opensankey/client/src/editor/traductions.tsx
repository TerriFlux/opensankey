// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

/**
 * #1335 — Contributions de traduction de l'ATELIER D'ÉDITION.
 *
 * Ce module inverse la dépendance qui existait auparavant : `traductions/traduction.tsx`, base
 * viewer, importait six modules de la zone d'édition pour y moissonner leurs traductions. C'était
 * la dernière arête viewer → éditeur du découpage #1331. Désormais c'est l'édition qui importe la
 * base, et non l'inverse.
 *
 * Ordonnancement — le point délicat. L'assemblage i18n du dépôt est une cascade AU CHARGEMENT :
 * OS assemble `resources_opensankey`, OSP le recopie et empile, SA recopie et empile encore.
 * Chaque étage suppose le précédent complet à l'import. Ce module :
 *
 *  1. réapplique les contributions d'édition sur LES MÊMES objets de ressources (les modules ES
 *     sont des singletons, donc `resources_app_elements` est ici l'objet que la base a déjà
 *     recopié) ;
 *  2. réinjecte les arbres modifiés dans `resources_opensankey`, qui est un objet muté en place —
 *     les consommateurs qui en tiennent la référence voient donc le complément ;
 *  3. pousse le résultat dans i18next via `addResourceBundle`, et non par un second `init()`, pour
 *     ne pas réinitialiser la détection de langue déjà faite par la base.
 *
 * Qui doit importer ce module : toute cible qui embarque l'atelier d'édition — `index.tsx` côté
 * OS, et OpenSankey+ qui lit `resources_opensankey`. L'ordre est ainsi porté par le graphe
 * d'imports, et non supposé. Une cible purement viewer ne l'importe pas et obtient la base seule,
 * ce qui est exactement l'objectif de #1331.
 */

import i18next from '../traductions/traduction'
import {
  convertToI18nFormat,
  deep_assign_resources,
  integrate_missing_translations,
  resources_opensankey,
  SUPPORTED_LANGS,
  use_context_config,
  use_elements_selection_config,
} from '../traductions/traduction'
import type { I18nResources, MenuConfig, TranslationConfig } from '../traductions/traduction'

import { resources_app_elements } from '../traductions/traduction_app_elements'
import { resources_nodes } from '../traductions/traduction_nodes'
import { resources_flux } from '../traductions/traduction_links'

import { ZDD_MENU_CONFIG } from '../components/dialogs/ContextZDDConfig'
import { LINK_MENU_CONFIG } from '../components/dialogs/ContextLinkConfig'
import { NODE_MENU_CONFIG } from '../components/dialogs/ContextNodeConfig'
import { translations } from '../components/dialogs/PersistenceProcessDialogConfigs'
import { ELEMENTS_MENU_CONFIG } from '../components/configmenus/MenuElementsSelection'
import {
  missing_flux_apparence_translations,
  missing_menu_translations,
  missing_node_apparence_translations,
  missing_node_labels_translations,
} from '../components/configmenus/MenuElementsAppearance'

/** Traductions du dialogue de traitement, converties au format i18n. */
const converted = convertToI18nFormat(translations as unknown as TranslationConfig)
export const resources_process_dialog = Object.fromEntries(
  SUPPORTED_LANGS.map(lang => [lang, { translation: converted[lang] }])
)

// --- Contributions des menus d'édition -----------------------------------------------------------

use_elements_selection_config(
  resources_app_elements as unknown as I18nResources,
  ELEMENTS_MENU_CONFIG
)

use_context_config(
  resources_app_elements as unknown as I18nResources,
  ZDD_MENU_CONFIG as unknown as MenuConfig,
  'ContextMenuZDD'
)
use_context_config(
  resources_app_elements as unknown as I18nResources,
  LINK_MENU_CONFIG as unknown as MenuConfig,
  'ContextMenuLinks'
)
use_context_config(
  resources_app_elements as unknown as I18nResources,
  NODE_MENU_CONFIG as unknown as MenuConfig,
  'ContextMenuNodes'
)

integrate_missing_translations(
  resources_app_elements as unknown as I18nResources,
  resources_nodes as unknown as I18nResources,
  resources_flux as unknown as I18nResources,
  {
    menu: missing_menu_translations as unknown as I18nResources,
    node_labels: missing_node_labels_translations as unknown as I18nResources,
    node_apparence: missing_node_apparence_translations as unknown as I18nResources,
    flux_apparence: missing_flux_apparence_translations as unknown as I18nResources,
  }
)

// --- Complément du bundle assemblé par la base ---------------------------------------------------

// Les trois arbres ci-dessus viennent d'être enrichis APRÈS que la base les a recopiés : il faut
// donc les réinjecter. `deep_assign_resources` écrase clé par clé, l'opération est idempotente.
deep_assign_resources(resources_app_elements as Record<string, unknown>, resources_opensankey)
deep_assign_resources(resources_nodes as Record<string, unknown>, resources_opensankey)
deep_assign_resources(resources_flux as Record<string, unknown>, resources_opensankey)
deep_assign_resources(resources_process_dialog as Record<string, unknown>, resources_opensankey)

// Pousser le complément dans i18next sans réinitialiser (cf. en-tête).
SUPPORTED_LANGS.forEach(lang => {
  const bundle = (resources_opensankey as Record<string, { translation?: unknown } | undefined>)[lang]
  if (!bundle?.translation) return
  i18next.addResourceBundle(lang, 'translation', bundle.translation, true, true)
})

export { resources_opensankey }
export default i18next
