// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================

/**
 * sa#538 — Module feuille des langues du dépôt.
 *
 * Sorti de `traduction.tsx` pour que n'importe quel composant puisse résoudre la langue courante
 * et lire un catalogue de libellés **sans tirer les ~13,5k lignes de catalogues i18next ni l'appel
 * d'initialisation** qui vivent là-bas. `traduction.tsx` en ré-exporte le contenu : les imports
 * existants (`SUPPORTED_LANGS`) continuent de fonctionner.
 *
 * Le défaut qui l'a motivé : la famille `PersistenceProcessDialog*` était typée `lang: 'en' | 'fr'`
 * de bout en bout, si bien que la boîte d'options de réconciliation s'affichait en anglais pour
 * l'espagnol, l'allemand, l'italien, le chinois et le japonais — alors que ses traductions
 * existaient déjà dans la configuration et n'étaient simplement jamais lues.
 */

export const SUPPORTED_LANGS = ['en', 'fr', 'es', 'de', 'it', 'zh-CN', 'ja'] as const

/**
 * LE type de langue du dépôt. Tout composant qui indexe un catalogue de libellés par la langue
 * courante doit s'y référer plutôt que de redéclarer un sous-ensemble.
 */
export type SupportedLang = typeof SUPPORTED_LANGS[number]

/**
 * Résout le code de langue i18next courant (`'fr'`, `'es-ES'`, `'zh-CN'`, `'zh-Hans'`…) vers l'une
 * des 7 langues du dépôt, avec repli explicite sur l'anglais — même politique que le
 * `fallbackLng: 'en'` d'i18next, appliquée aux catalogues qui ne passent pas par i18next.
 *
 * ⚠️ `'zh'` est le seul code réduit à 2 lettres qui ne corresponde pas au code de ressource
 * (`'zh-CN'`).
 */
export const resolve_supported_lang = (language?: string): SupportedLang => {
  const code = language?.substring(0, 2) ?? 'en'
  if (code === 'zh') return 'zh-CN'
  return SUPPORTED_LANGS.find(lang => lang === code) ?? 'en'
}

/**
 * Lit une entrée d'un catalogue de libellés écrit en dur (`{ en: '…', fr: '…', … }`) dans la langue
 * demandée, avec repli sur l'anglais quand la langue n'y a pas (encore) été renseignée.
 */
export const localized_label = <T, >(
  catalog: { en: T } & Partial<Record<SupportedLang, T>>,
  lang: SupportedLang
): T => catalog[lang] ?? catalog.en
