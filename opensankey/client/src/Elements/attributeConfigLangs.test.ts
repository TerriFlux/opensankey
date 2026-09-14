/**
 * sa#538 — Les catalogues de libellés dérivés doivent porter les 7 langues du dépôt.
 *
 * LE DÉFAUT. `createConfigWithPrefix` et `createConfigWithPrefixAndOverrides` ne recopiaient que
 * `en/fr/es/de/it` : `zh-CN` et `ja` étaient perdus en silence pour tout attribut préfixé ou
 * surchargé. Le contrôle `check:i18n` ne pouvait pas le voir — à cet endroit les valeurs sont des
 * renvois de propriétés, pas du texte écrit en dur.
 *
 * Ces tests tiennent sur la RECOPIE, pas sur un texte particulier : ils restent vrais le jour où
 * une huitième langue est ajoutée à `AttributeConfig`.
 */
import {
  AttributeConfig,
  createConfigWithPrefix,
  createConfigWithPrefixAndOverrides
} from './ElementsAttributesConfig'

const BASE = {
  visible: {
    default: true as boolean,
    type: (() => true) as (() => boolean),
    category: 'shape' as const,
    labels: {
      en: 'Visible', fr: 'Visible', es: 'Visible', de: 'Sichtbar', it: 'Visibile',
      'zh-CN': '可见', ja: '表示'
    },
    tooltips: {
      en: 'Show or hide', fr: 'Afficher ou masquer', es: 'Mostrar u ocultar',
      de: 'Ein- oder ausblenden', it: 'Mostra o nascondi',
      'zh-CN': '显示或隐藏', ja: '表示または非表示'
    }
  } satisfies AttributeConfig<boolean>
}

describe('sa#538 — recopie des catalogues de libellés dérivés', () => {
  it('createConfigWithPrefix conserve TOUTES les langues du catalogue de base', () => {
    const derived = createConfigWithPrefix(BASE, 'background')
    expect(derived.background_visible.labels).toEqual(BASE.visible.labels)
    expect(derived.background_visible.tooltips).toEqual(BASE.visible.tooltips)
  })

  it('createConfigWithPrefixAndOverrides conserve TOUTES les langues quand rien n’est surchargé', () => {
    const derived = createConfigWithPrefixAndOverrides(BASE, 'background', 'shape', ['drawShape'])
    expect(derived.background_visible.labels).toEqual(BASE.visible.labels)
    expect(derived.background_visible.tooltips).toEqual(BASE.visible.tooltips)
  })

  it('une surcharge de libellés remplace le catalogue entier (et n’hérite pas du zh-CN d’avant)', () => {
    const override_labels = {
      en: 'Background', fr: 'Fond', es: 'Fondo', de: 'Hintergrund', it: 'Sfondo',
      'zh-CN': '背景', ja: '背景'
    }
    const derived = createConfigWithPrefixAndOverrides(
      BASE, 'background', 'shape', ['drawShape'],
      { visible: { labels: override_labels } }
    )
    expect(derived.background_visible.labels).toEqual(override_labels)
    // Les info-bulles, elles, n’étaient pas surchargées : recopie intégrale.
    expect(derived.background_visible.tooltips).toEqual(BASE.visible.tooltips)
  })
})
