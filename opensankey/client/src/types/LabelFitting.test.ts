// #377 — Tests de la logique pure d'élagage des étiquettes qui ne tiennent pas.

import { computeLabelFitPlan, countWrappedLines } from './LabelFitting'

// Mesure déterministe : 10 unités par caractère (espaces compris).
const measure = (s: string) => s.length * 10

/** Étiquette qui a opté pour l'élagage. */
const pruned = (required: number) => ({ required, prune: true })
/** Étiquette qui n'élague pas : elle occupe sa place, mais n'est jamais masquée. */
const kept = (required: number) => ({ required, prune: false })

describe('countWrappedLines', () => {
  test('texte vide ou blanc => aucune ligne', () => {
    expect(countWrappedLines('', 100, measure)).toBe(0)
    expect(countWrappedLines('   ', 100, measure)).toBe(0)
  })

  test('texte qui tient dans la boîte => une ligne', () => {
    expect(countWrappedLines('abc def', 100, measure)).toBe(1)
  })

  test('repli glouton par mots', () => {
    // 'aaa bbb ccc' = 110 unités > 100 : la 3e tranche passe à la ligne
    expect(countWrappedLines('aaa bbb ccc', 100, measure)).toBe(2)
    // Boîte de 70 : 'aaa bbb' fait exactement 70 => deux mots par ligne
    expect(countWrappedLines('aaa bbb ccc ddd', 70, measure)).toBe(2)
    // Boîte de 60 : plus aucune paire ne tient => un mot par ligne
    expect(countWrappedLines('aaa bbb ccc ddd', 60, measure)).toBe(4)
  })

  test('mot unique plus large que la boîte : pas de repli sans wrap_long_words', () => {
    expect(countWrappedLines('abcdefghijklmnop', 50, measure)).toBe(1)
  })

  test('wrap_long_words découpe le mot trop large', () => {
    // 16 caractères, boîte de 50 => 5 caractères par ligne => 4 lignes
    expect(countWrappedLines('abcdefghijklmnop', 50, measure, true)).toBe(4)
  })

  test('largeur de boîte nulle ou négative => pas de contrainte, une ligne', () => {
    expect(countWrappedLines('aaa bbb ccc ddd', 0, measure)).toBe(1)
    expect(countWrappedLines('aaa bbb ccc ddd', -10, measure)).toBe(1)
  })
})

describe('computeLabelFitPlan — les deux étiquettes élaguent', () => {
  test('élément assez haut pour le libellé ET la valeur : les deux passent', () => {
    expect(computeLabelFitPlan(40, pruned(14), pruned(14))).toEqual({ name: true, value: true })
  })

  test('place pour le seul libellé : la valeur est élaguée', () => {
    expect(computeLabelFitPlan(20, pruned(14), pruned(14))).toEqual({ name: true, value: false })
  })

  test('élément plus fin qu\'une ligne : rien ne passe', () => {
    expect(computeLabelFitPlan(6, pruned(14), pruned(14))).toEqual({ name: false, value: false })
  })

  test('libellé multi-lignes qui ne tient pas : la valeur ne le remplace pas', () => {
    // Le libellé demande 3 lignes (42) dans 20 : la valeur (14) tiendrait seule,
    // mais le libellé est prioritaire — on n'affiche pas un nombre orphelin.
    expect(computeLabelFitPlan(20, pruned(42), pruned(14))).toEqual({ name: false, value: false })
  })

  test('hauteur exactement égale au besoin : ça tient (bord inclus)', () => {
    expect(computeLabelFitPlan(14, pruned(14), pruned(0))).toEqual({ name: true, value: true })
    expect(computeLabelFitPlan(28, pruned(14), pruned(14))).toEqual({ name: true, value: true })
  })

  test('hauteur non finie traitée comme nulle', () => {
    expect(computeLabelFitPlan(Number.NaN, pruned(14), pruned(14))).toEqual({ name: false, value: false })
  })
})

describe('computeLabelFitPlan — opt-in par étiquette', () => {
  test('étiquette qui n\'élague pas : jamais masquée, même dans un élément minuscule', () => {
    expect(computeLabelFitPlan(2, kept(14), kept(14))).toEqual({ name: true, value: true })
  })

  test('libellé non élagué : il occupe quand même la place et prive la valeur', () => {
    // 20 de haut, libellé de 14 dessiné (non élagué) => il ne reste que 6 pour la valeur
    expect(computeLabelFitPlan(20, kept(14), pruned(14))).toEqual({ name: true, value: false })
    expect(computeLabelFitPlan(30, kept(14), pruned(14))).toEqual({ name: true, value: true })
  })

  test('valeur seule élaguée dans un élément trop fin', () => {
    expect(computeLabelFitPlan(10, kept(0), pruned(14))).toEqual({ name: true, value: false })
  })

  test('libellé élagué mais valeur non élagué : la valeur reste, choix assumé', () => {
    expect(computeLabelFitPlan(10, pruned(14), kept(14))).toEqual({ name: false, value: true })
  })

  test('libellé élagué faute de place : la valeur élaguée tombe avec lui', () => {
    expect(computeLabelFitPlan(10, pruned(14), pruned(4))).toEqual({ name: false, value: false })
  })
})

describe('computeLabelFitPlan — rien à dessiner', () => {
  test('pas de libellé : la valeur dispose de toute la hauteur', () => {
    expect(computeLabelFitPlan(20, pruned(0), pruned(14))).toEqual({ name: true, value: true })
    expect(computeLabelFitPlan(10, pruned(0), pruned(14))).toEqual({ name: true, value: false })
  })

  test('pas de valeur : seul le libellé est jugé', () => {
    expect(computeLabelFitPlan(20, pruned(14), pruned(0))).toEqual({ name: true, value: true })
    expect(computeLabelFitPlan(10, pruned(14), pruned(0))).toEqual({ name: false, value: true })
  })

  test('rien à dessiner : aucune contrainte ajoutée', () => {
    expect(computeLabelFitPlan(0, pruned(0), pruned(0))).toEqual({ name: true, value: true })
  })
})
