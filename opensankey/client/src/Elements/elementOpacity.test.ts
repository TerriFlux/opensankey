// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================

/**
 * SA#534 — table de vérité du résolveur d'opacité.
 *
 * La valeur de ces tests n'est pas de vérifier une fonction de six lignes : c'est de **figer les
 * formules qui existaient aux sept sites de dessin** avant la refactorisation, pour que la
 * promesse « aucun changement fonctionnel » soit vérifiable autrement que par relecture de diff
 * (leçon SA#425). Chaque bloc `describe` porte le site d'origine et sa formule littérale.
 *
 * La preuve de non-régression du RENDU, elle, est portée par le harnais d'empreinte de SA#530
 * (`corpusRenderFingerprint.test.ts`) : c'est lui qui voit la peinture réelle.
 */

import {
  DATA_LABEL_DIMMED_OPACITY,
  effectiveOpacity,
  elementSourceOpacity,
  type Type_OpacityBearer
} from './elementOpacity'

/** Fabrique un porteur d'opacité minimal. */
const bearer = (
  shape_opacity: number,
  opts: { type_data?: string, has_data?: boolean } = {}
): Type_OpacityBearer => ({
  shape_opacity,
  has_data: opts.has_data,
  drawing_area: opts.type_data !== undefined ? { type_data: opts.type_data } : null
})

describe('elementSourceOpacity — le seul point de lecture de la source', () => {
  test('rend l opacité portée par l élément, telle quelle', () => {
    expect(elementSourceOpacity(bearer(0.85))).toBe(0.85)
    expect(elementSourceOpacity(bearer(0))).toBe(0)
    expect(elementSourceOpacity(bearer(1))).toBe(1)
  })
})

describe('effectiveOpacity — sans garde, la source passe telle quelle', () => {
  // Sites : Node.drawLinksCap (capuchon), DrawLabel (image, icône).
  //   avant : .attr('opacity', link.shape_opacity)
  test.each([0, 0.2, 0.85, 1])('opacité %p inchangée', (op) => {
    expect(effectiveOpacity(bearer(op))).toBe(op)
  })

  test('le mode data_label n estompe PAS un site qui ne le demande pas', () => {
    expect(effectiveOpacity(bearer(0.85, { type_data: 'data_label', has_data: false }))).toBe(0.85)
  })
})

describe('effectiveOpacity — garde principal de LinkDrawShape.drawShape', () => {
  // avant : type_data == 'data_label' && !has_data
  //           ? 0.2
  //           : (shape_color_visible ? shape_opacity : 0)
  const resolve = (op: number, visible: boolean, type_data: string, has_data: boolean) =>
    effectiveOpacity(bearer(op, { type_data, has_data }), { dim: 'no_data', hidden: !visible })

  const legacy = (op: number, visible: boolean, type_data: string, has_data: boolean) =>
    type_data === 'data_label' && !has_data ? 0.2 : (visible ? op : 0)

  test.each([
    // op,  visible, type_data,     has_data
    [0.85, true, 'structure', true],
    [0.85, false, 'structure', true],
    [0.85, true, 'data_label', true],
    [0.85, false, 'data_label', true],
    [0.85, true, 'data_label', false],
    [0.85, false, 'data_label', false],
    [0, true, 'data_label', true],
    [0, false, 'data_label', false],
    [1, true, 'reconciled', false]
  ])('op=%p visible=%p mode=%p has_data=%p', (op, visible, type_data, has_data) => {
    expect(resolve(op, visible, type_data, has_data))
      .toBe(legacy(op, visible, type_data, has_data))
  })

  test('un flux sans donnée en mode data_label reste visible à 0,2 même couleur masquée', () => {
    expect(resolve(0.85, false, 'data_label', false)).toBe(DATA_LABEL_DIMMED_OPACITY)
  })
})

describe('effectiveOpacity — fill-opacity de la forme pleine (divergence historique)', () => {
  // avant : type_data == 'data_label' ? 0.2 : shape_opacity_déjà_résolue
  // Seul site à omettre `!has_data` : conservé tel quel par SA#534.
  const resolve = (op: number, visible: boolean, type_data: string, has_data: boolean) =>
    effectiveOpacity(bearer(op, { type_data, has_data }), { dim: 'always', hidden: !visible })

  const legacy = (op: number, visible: boolean, type_data: string, has_data: boolean) => {
    const already = type_data === 'data_label' && !has_data ? 0.2 : (visible ? op : 0)
    return type_data === 'data_label' ? 0.2 : already
  }

  test.each([
    [0.85, true, 'structure', true],
    [0.85, false, 'structure', true],
    [0.85, true, 'data_label', true],
    [0.85, false, 'data_label', true],
    [0.85, true, 'data_label', false],
    [0, true, 'data', true]
  ])('op=%p visible=%p mode=%p has_data=%p', (op, visible, type_data, has_data) => {
    expect(resolve(op, visible, type_data, has_data))
      .toBe(legacy(op, visible, type_data, has_data))
  })

  test('estompe un flux QUI A des données — ce que le garde principal ne fait pas', () => {
    const el = bearer(0.85, { type_data: 'data_label', has_data: true })
    expect(effectiveOpacity(el, { dim: 'always' })).toBe(DATA_LABEL_DIMMED_OPACITY)
    expect(effectiveOpacity(el, { dim: 'no_data' })).toBe(0.85)
  })
})

describe('effectiveOpacity — pointe de flèche (Link.drawArrows)', () => {
  // avant : type_data == 'data_label' && !has_data ? 0.2 : shape_opacity
  // Pas de garde de visibilité : c'est le `fill` qui vaut 'none' quand la couleur est masquée.
  const resolve = (op: number, type_data: string, has_data: boolean) =>
    effectiveOpacity(bearer(op, { type_data, has_data }), { dim: 'no_data' })

  test.each([
    [0.85, 'structure', true, 0.85],
    [0.85, 'data_label', true, 0.85],
    [0.85, 'data_label', false, 0.2],
    [0, 'data_label', false, 0.2],
    [0, 'data', true, 0]
  ])('op=%p mode=%p has_data=%p → %p', (op, type_data, has_data, expected) => {
    expect(resolve(op, type_data, has_data)).toBe(expected)
  })
})

describe('effectiveOpacity — forme du nœud (NodeDrawShape)', () => {
  // avant : shape_visible && shape_color_visible ? shape_opacity : '0'
  const resolve = (op: number, shape_visible: boolean, color_visible: boolean) =>
    effectiveOpacity(bearer(op), { hidden: !(shape_visible && color_visible) })

  test.each([
    [0.85, true, true, 0.85],
    [0.85, false, true, 0],
    [0.85, true, false, 0],
    [0.85, false, false, 0],
    [0, true, true, 0]
  ])('op=%p visible=%p couleur=%p → %p', (op, sv, cv, expected) => {
    expect(resolve(op, sv, cv)).toBe(expected)
  })
})

describe('effectiveOpacity — repli de l animation (SankeyAnimation)', () => {
  // avant : shape_opacity || 0.8
  test.each([
    [0.85, 0.85],
    [1, 1],
    [0, 0.8] // ⚠️ le défaut que SA#529 traitera : un réglage à 0 réapparaît à 0,8
  ])('op=%p → %p', (op, expected) => {
    expect(effectiveOpacity(bearer(op), { fallback: 0.8 })).toBe(expected)
  })

  test('sans fallback déclaré, une opacité nulle reste nulle', () => {
    expect(effectiveOpacity(bearer(0))).toBe(0)
  })

  test('le repli ne s applique pas quand l élément est estompé', () => {
    const el = bearer(0, { type_data: 'data_label', has_data: false })
    expect(effectiveOpacity(el, { dim: 'no_data', fallback: 0.8 })).toBe(DATA_LABEL_DIMMED_OPACITY)
  })
})

describe('effectiveOpacity — robustesse structurelle', () => {
  test('un élément sans zone de dessin n est jamais estompé', () => {
    expect(effectiveOpacity({ shape_opacity: 0.85 }, { dim: 'no_data' })).toBe(0.85)
    expect(effectiveOpacity({ shape_opacity: 0.85, drawing_area: null }, { dim: 'always' })).toBe(0.85)
  })

  test('l estompage prime sur le masquage, le masquage prime sur la source', () => {
    const dimmed = bearer(0.85, { type_data: 'data_label', has_data: false })
    expect(effectiveOpacity(dimmed, { dim: 'no_data', hidden: true })).toBe(DATA_LABEL_DIMMED_OPACITY)
    const plain = bearer(0.85, { type_data: 'structure', has_data: false })
    expect(effectiveOpacity(plain, { dim: 'no_data', hidden: true })).toBe(0)
  })
})
