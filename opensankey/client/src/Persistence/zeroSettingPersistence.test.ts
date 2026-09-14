import { ANIMATION_FALLBACK_OPACITY } from '../Algorithms/SankeyAnimation'
import { effectiveOpacity } from '../Elements/elementOpacity'

// SA#534 — le repli de l'animation est passé au point unique de résolution de l'opacité :
// ces trois cas visent désormais `effectiveOpacity`, la fonction que le dessin appelle.
const animatedLinkOpacity = (shape_opacity: number | undefined): number =>
  effectiveOpacity({ shape_opacity: shape_opacity as number }, { fallback: ANIMATION_FALLBACK_OPACITY })
import { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_JSON } from '../types/Utils'

// sa#529 — suite de sa#373 : la même erreur (« tester la véracité d'un nombre là où 0 est une
// valeur ») vivait encore chez les voisins immédiats du site corrigé au #373.
//
// Ce que ces tests verrouillent :
//  1. ÉCRITURE — `maximum_flux`, `maximum_node` et `minimum_node` sont sérialisés dès qu'ils
//     sont DÉFINIS, 0 compris. Un fichier qui en porte un à 0 le retrouve à la réouverture.
//  2. INVARIANT — « pas de réglage » reste marqué par l'ABSENCE de la clé, jamais par un 0 :
//     un document sans réglage ne doit RIEN gagner (sans quoi les 24 goldens de
//     `corpusFirstLoad` bougeraient pour rien, cf. critère de recette du ticket).
//  3. RENDU — l'opacité d'un flux pendant l'animation : 0 est une opacité légitime (flux
//     volontairement invisible) et ne doit plus être remontée au repli 0,8.
//
// Hors périmètre volontaire (documenté dans le code) : `shape_local_link_scale`, que le ticket
// rangeait dans la même famille. C'est un DIVISEUR — 0 y est dégénéré, pas légitime ; les
// `|| 1` / `if (x)` qui l'entourent sont des garde-fous, et les passer à `??` introduirait une
// division par zéro. Le test ci-dessous fige cette convention pour qu'on ne « corrige » pas ces
// sites à l'aveugle.

const baseJSON = (extra: Record<string, unknown> = {}): Type_JSON => ({
  version: '1.1.4',
  format_version: 3,
  nodes: {},
  links: {},
  width: 1000,
  height: 800,
  user_scale: 100,
  ...extra
} as unknown as Type_JSON)

const loadAndDump = (json: Type_JSON): { app: Class_ApplicationData, dump: Type_JSON } => {
  const app = new Class_ApplicationData(false)
  app.fromJSON(JSON.parse(JSON.stringify(json)) as never, {}, false)
  return { app, dump: app.toJSON() as Type_JSON }
}

describe.each([
  ['maximum_flux', 'maximum_flux'],
  ['maximum_node', 'maximum_node'],
  ['minimum_node', 'minimum_node']
] as const)('sa#529 — aller-retour de %s', (key, attr) => {

  it('une valeur ordinaire est lue puis réécrite', () => {
    const { app, dump } = loadAndDump(baseJSON({ [key]: 42 }))
    expect((app.drawing_area as unknown as Record<string, unknown>)[attr]).toBe(42)
    expect(dump[key]).toBe(42)
  })

  it('une valeur à 0 survit à l\'enregistrement (cœur de sa#529)', () => {
    const { app, dump } = loadAndDump(baseJSON({ [key]: 0 }))
    expect((app.drawing_area as unknown as Record<string, unknown>)[attr]).toBe(0)
    // Avant correctif : la clé n'était pas écrite (0 falsy) → le réglage disparaissait.
    expect(key in dump).toBe(true)
    expect(dump[key]).toBe(0)
  })

  it('le second aller-retour est un point fixe (0 reste 0)', () => {
    const { dump } = loadAndDump(baseJSON({ [key]: 0 }))
    const { dump: dump2 } = loadAndDump(dump)
    expect(dump2[key]).toBe(0)
  })

  it('sans réglage, la clé reste ABSENTE et n\'est pas écrite à 0', () => {
    const { app, dump } = loadAndDump(baseJSON())
    expect((app.drawing_area as unknown as Record<string, unknown>)[attr]).toBeUndefined()
    expect(key in dump).toBe(false)
  })
})

describe('sa#529 — opacité d\'un flux pendant l\'animation', () => {

  it('une opacité de 0 reste 0 (cœur de sa#529)', () => {
    // Avant correctif (`|| 0.8`) : le flux redevenait visible pendant l'animation.
    expect(animatedLinkOpacity(0)).toBe(0)
  })

  it('une opacité ordinaire est respectée', () => {
    expect(animatedLinkOpacity(0.35)).toBe(0.35)
  })

  it('le repli ne joue que sur l\'ABSENCE de valeur', () => {
    expect(animatedLinkOpacity(undefined)).toBe(ANIMATION_FALLBACK_OPACITY)
  })
})
