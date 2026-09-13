/**
 * SA#541 — opacité portée par une étiquette : règles pures du point unique (elementOpacity.ts).
 *
 * Les cas sur un vrai diagramme (la fiabilité change avec l'année) sont dans
 * `types/Link.tagDrivenOpacity.test.ts` ; ici, les règles seules, sans rien construire.
 */
import {
  effectiveOpacity,
  elementSourceOpacity,
  isUnqualifiedValue,
  opacityDrivingGroup,
  stylePatchOpacity,
  tagDrivenOpacity,
  unqualifiedOutlineRequested,
  DATA_LABEL_DIMMED_OPACITY
} from './elementOpacity'

type Patch = { [k: string]: string | number | boolean }
const group = (style_patch: Patch = {}) => ({ style_patch })
const tag = <G>(g: G, style_patch: Patch = {}) => ({ group: g, style_patch })

describe('elementSourceOpacity — l étiquette remplace l opacité propre', () => {
  it('sans étiquette pilote, la source reste shape_opacity (tous les fichiers existants)', () => {
    expect(elementSourceOpacity({ shape_opacity: 0.85 })).toBe(0.85)
    expect(elementSourceOpacity({ shape_opacity: 0.85, tag_driven_opacity: undefined })).toBe(0.85)
  })
  it('une opacité d étiquette remplace la source, sans s y multiplier', () => {
    expect(elementSourceOpacity({ shape_opacity: 0.85, tag_driven_opacity: 1 })).toBe(1)
    expect(elementSourceOpacity({ shape_opacity: 0.85, tag_driven_opacity: 0.2 })).toBe(0.2)
  })
  it('0 reste 0 (#529) ; une valeur non finie est ignorée', () => {
    expect(elementSourceOpacity({ shape_opacity: 0.85, tag_driven_opacity: 0 })).toBe(0)
    expect(elementSourceOpacity({ shape_opacity: 0.85, tag_driven_opacity: NaN })).toBe(0.85)
  })
  it('les gardes de rendu priment toujours sur l étiquette', () => {
    const dimmed = { shape_opacity: 0.85, tag_driven_opacity: 1, has_data: false, drawing_area: { type_data: 'data_label' } }
    expect(effectiveOpacity(dimmed, { dim: 'no_data' })).toBe(DATA_LABEL_DIMMED_OPACITY)
    expect(effectiveOpacity({ shape_opacity: 0.85, tag_driven_opacity: 1 }, { hidden: true })).toBe(0)
    expect(effectiveOpacity({ shape_opacity: 0.85, tag_driven_opacity: 0.4 }, { fallback: 0.8 })).toBe(0.4)
  })
})

describe('stylePatchOpacity', () => {
  it('lit shape_opacity numérique, borné à [0, 1]', () => {
    expect(stylePatchOpacity(group({ shape_opacity: 0.6 }))).toBe(0.6)
    expect(stylePatchOpacity(group({ shape_opacity: 1.7 }))).toBe(1)
    expect(stylePatchOpacity(group({ shape_opacity: -1 }))).toBe(0)
  })
  it('absent, non numérique ou patch absent : undefined', () => {
    expect(stylePatchOpacity(group())).toBeUndefined()
    expect(stylePatchOpacity(group({ shape_opacity: '0.5' }))).toBeUndefined()
    expect(stylePatchOpacity({})).toBeUndefined()
  })
})

describe('opacityDrivingGroup — interrupteur par groupe, fermé par défaut', () => {
  it('aucun groupe ne porte shape_opacity : personne ne pilote', () => {
    expect(opacityDrivingGroup([group(), group({ autre: 1 })])).toBeUndefined()
  })
  it('deux groupes l activent : le premier dans l ordre des groupes l emporte', () => {
    const a = group({ shape_opacity: 0.5 })
    const b = group({ shape_opacity: 0.3 })
    expect(opacityDrivingGroup([group(), a, b])).toBe(a)
  })
})

describe('tagDrivenOpacity — la valeur affichée décide', () => {
  const fiab = group({ shape_opacity: 0.5 })
  const autre = group({ shape_opacity: 0.9 })
  const fiable = tag(fiab, { shape_opacity: 1 })
  const approx = tag(fiab, { shape_opacity: 0.4 })
  const indicative = tag(fiab, { shape_opacity: 0.2 })

  it('une étiquette : son niveau', () => {
    expect(tagDrivenOpacity(fiab, [fiable])).toBe(1)
  })
  it('plusieurs étiquettes : la moins fiable (« le pire l emporte »), quel que soit l ordre', () => {
    expect(tagDrivenOpacity(fiab, [approx, indicative])).toBe(0.2)
    expect(tagDrivenOpacity(fiab, [indicative, fiable])).toBe(0.2)
  })
  it('les étiquettes des AUTRES groupes sont ignorées', () => {
    expect(tagDrivenOpacity(fiab, [tag(autre, { shape_opacity: 0.1 }), fiable])).toBe(1)
  })
  it('aucune étiquette du groupe : non qualifiée, opacité du groupe', () => {
    expect(tagDrivenOpacity(fiab, [])).toBe(0.5)
    expect(tagDrivenOpacity(fiab, [tag(autre)])).toBe(0.5)
    expect(isUnqualifiedValue(fiab, [tag(autre)])).toBe(true)
    expect(isUnqualifiedValue(fiab, [approx])).toBe(false)
  })
  it('une étiquette du groupe sans niveau propre vaut la valeur du groupe', () => {
    expect(tagDrivenOpacity(fiab, [tag(fiab)])).toBe(0.5)
    expect(tagDrivenOpacity(fiab, [tag(fiab), approx])).toBe(0.4)
  })
})

describe('unqualifiedOutlineRequested — variante « contour pointillé »', () => {
  it('vrai seulement quand le groupe porte unqualified_outline: true', () => {
    expect(unqualifiedOutlineRequested(group({ shape_opacity: 0.5 }))).toBe(false)
    expect(unqualifiedOutlineRequested(group({ shape_opacity: 0.5, unqualified_outline: true }))).toBe(true)
    expect(unqualifiedOutlineRequested(group({ unqualified_outline: 'true' }))).toBe(false)
  })
})
