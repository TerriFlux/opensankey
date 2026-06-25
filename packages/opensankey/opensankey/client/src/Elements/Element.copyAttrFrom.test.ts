// Regression guard for issue #195 — « Appliquer la mise en page depuis un
// diagramme source » perdait la position du libellé de nom (name_label_horiz /
// name_label_vert) sur les nœuds d'extrémité.
//
// Cause : `copyAttrFrom` ne conservait un override `_storage` de la source que
// s'il différait du style résolu de la CIBLE. Sur la cible fraîchement
// réconciliée, les nœuds d'extrémité portent (transitoirement) un style
// d'extrémité (NodeLeftExtremityStyle/NodeRightExtremityStyle) qui résout
// name_label_horiz/vert exactement aux valeurs de l'override source → l'override
// était jugé redondant et supprimé. Juste après, `styleNode` (UpdateFrom)
// remplaçait ce style d'extrémité par la chaîne plate de la source → plus
// d'override ET plus de style fournissant la valeur → libellé mal placé.
//
// Correctif : minimiser l'override contre le style de la SOURCE (un override
// réel de la source est intentionnel et doit survivre), pas contre le style
// transitoire de la cible.

// `Element.tsx` est le pivot d'un cycle d'imports dense (Element ↔ Utils/Node/
// NodeBase/Handler ↔ ElementsAttributesConfig/DrawingArea). En l'important seul
// sous jest, `Class_BaseElement` n'est pas encore défini quand `Handler` l'étend.
// On coupe le cycle en mockant les 3 imports de tête d'Element ; copyAttrFrom ne
// lit que `_storage` et `getStyleProperty` (fournis par les stubs ci-dessous),
// donc aucun de ces modules n'est réellement nécessaire au test.
jest.mock('../types/Utils', () => ({
  const_default_position_x: 0,
  const_default_position_y: 0,
  randomId: () => 'test_id',
  default_style_id: 'default'
}))
jest.mock('../types/DrawingArea', () => ({ Class_DrawingArea: class {} }))
jest.mock('./ElementsAttributesConfig', () => ({
  ALL_ATTRIBUTES_CONFIG: new Proxy({}, { get: () => ({ default: undefined }) })
}))

// eslint-disable-next-line import/first
import { Class_ProtoElement } from './Element'

// Stub minimal : copyAttrFrom ne lit que `_storage` (sac d'overrides) et
// `getStyleProperty(key)` de la source, et écrit `this._storage`.
type Stub = { _storage: Record<string, unknown>; getStyleProperty: (k: string) => unknown }

function callCopyAttrFrom(target: Stub, source: Stub): void {
  ;(Class_ProtoElement.prototype.copyAttrFrom as unknown as (this: Stub, s: Stub) => void)
    .call(target, source)
}

describe("AFMBase issue #195 — copyAttrFrom préserve les overrides réels de la source", () => {
  it("conserve un override source même s'il coïncide avec le style (extrémité) de la cible", () => {
    // Source : style plat (résout horiz=middle/vert=bottom) + override LOCAL
    // explicite left/middle (placement manuel du libellé).
    const source: Stub = {
      _storage: { name_label_horiz: 'left', name_label_vert: 'middle', name_label_font_size: 30 },
      getStyleProperty: (k) => (
        ({ name_label_horiz: 'middle', name_label_vert: 'bottom', name_label_font_size: 20 } as Record<string, unknown>)[k]
      )
    }
    // Cible : porte (transitoirement) un style d'extrémité résolvant horiz=left/
    // vert=middle — exactement les valeurs de l'override source.
    const target: Stub = {
      _storage: { stale: true },
      getStyleProperty: (k) => (
        ({ name_label_horiz: 'left', name_label_vert: 'middle', name_label_font_size: 20 } as Record<string, unknown>)[k]
      )
    }

    callCopyAttrFrom(target, source)

    // Avant le correctif : supprimés (== style de la cible). Après : conservés.
    expect(target._storage.name_label_horiz).toBe('left')
    expect(target._storage.name_label_vert).toBe('middle')
    // Les autres overrides réels restent transférés.
    expect(target._storage.name_label_font_size).toBe(30)
    // L'ancien _storage de la cible est bien remplacé (pas de fuite).
    expect(target._storage.stale).toBeUndefined()
  })

  it("ne matérialise pas un override redondant (valeur == style de la SOURCE) — transparence préservée", () => {
    // Cas vue↔maître : une valeur du _storage source égale au style résolu de la
    // source est redondante et ne doit pas être figée sur la cible.
    const source: Stub = {
      _storage: { name_label_horiz: 'middle' /* == style source */, name_label_font_size: 30 },
      getStyleProperty: (k) => (
        ({ name_label_horiz: 'middle', name_label_font_size: 20 } as Record<string, unknown>)[k]
      )
    }
    const target: Stub = { _storage: {}, getStyleProperty: () => undefined }

    callCopyAttrFrom(target, source)

    expect(target._storage.name_label_horiz).toBeUndefined() // redondant → non copié
    expect(target._storage.name_label_font_size).toBe(30)    // override réel → copié
  })
})
