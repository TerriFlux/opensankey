/**
 * sa#538 — Résolution de la langue courante et lecture d'un catalogue de libellés.
 *
 * LE DÉFAUT. La boîte d'options de réconciliation résolvait sa langue par
 * `i18n.language === 'fr' ? 'fr' : 'en'` : espagnol, allemand, italien, chinois et japonais
 * retombaient sur l'anglais alors que leurs traductions existaient déjà dans la configuration.
 */
import { localized_label, resolve_supported_lang, SUPPORTED_LANGS } from './supportedLangs'

describe('resolve_supported_lang', () => {
  it('rend chacune des 7 langues du dépôt quand i18next la nomme exactement', () => {
    SUPPORTED_LANGS.forEach(lang => {
      expect(resolve_supported_lang(lang)).toBe(lang)
    })
  })

  it('ramène un code régional au code de ressource du dépôt', () => {
    expect(resolve_supported_lang('es-ES')).toBe('es')
    expect(resolve_supported_lang('de-AT')).toBe('de')
    expect(resolve_supported_lang('fr-CA')).toBe('fr')
  })

  it('mappe toute variante de chinois sur zh-CN, seul code à 2 lettres qui diffère', () => {
    expect(resolve_supported_lang('zh')).toBe('zh-CN')
    expect(resolve_supported_lang('zh-Hans')).toBe('zh-CN')
    expect(resolve_supported_lang('zh-TW')).toBe('zh-CN')
  })

  it('replie sur l’anglais une langue inconnue ou absente', () => {
    expect(resolve_supported_lang('pt-BR')).toBe('en')
    expect(resolve_supported_lang('')).toBe('en')
    expect(resolve_supported_lang(undefined)).toBe('en')
  })
})

describe('localized_label', () => {
  const catalog = {
    en: 'None', fr: 'Aucune', es: 'Ninguna', de: 'Keine', it: 'Nessuna',
    'zh-CN': '无', ja: 'なし'
  }

  it('rend la langue demandée quand elle est renseignée', () => {
    expect(localized_label(catalog, 'ja')).toBe('なし')
    expect(localized_label(catalog, 'zh-CN')).toBe('无')
  })

  it('replie sur l’anglais quand la langue n’est pas (encore) renseignée', () => {
    // Cas des catalogues où es/de/it/zh-CN/ja sont optionnels (FormatAttributeConfig).
    expect(localized_label({ en: 'Search', fr: 'Rechercher' }, 'it')).toBe('Search')
  })
})
