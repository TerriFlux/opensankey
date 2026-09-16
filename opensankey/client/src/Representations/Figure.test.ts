// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// os#1418 — LE CONTRAT DE `Figure.ts`, éprouvé en isolation.
//
// Ce qu'on vérifie ici est ce sur quoi tout le lot s'appuie : la cascade (surcharge propre → styles
// suivis du dernier au premier → valeur d'usine), la SURCHARGE MINIMALE (une figure réglée « comme
// son style » continue de le suivre quand il change), le garde-fou de sorte à l'écriture d'un style
// (os#1416 : ni identité ni navigation dans un style), et la persistance additive des deux côtés.
//
// Aucun rendu, aucune zone de dessin : un style de figure est un `Class_ElementStyle` construit sans
// `drawing_area`, exactement comme en production. Même discipline que RepresentationRegistry.test.ts.

import {
  Class_Figure,
  Class_FigureMigrationReport,
  Class_FigureNature,
  FIGURE_DEFAULT_STYLE_ID,
  transposableBagChanges,
  type Type_AttributeSort,
  type Type_FigureAttributeConfig
} from './Figure'

// --- une nature de test ---------------------------------------------------------------------

/** Les sept langues du dépôt (sa#531) : un libellé de figure est un catalogue comme un autre. */
const L7 = (s: string) => ({ en: s, fr: s, es: s, de: s, it: s, 'zh-CN': s, ja: s })

const attr = (
  label: string,
  default_value: unknown,
  sort?: Type_AttributeSort
): Type_FigureAttributeConfig => ({
  default: default_value,
  type: () => default_value,
  category: 'figure',
  labels: L7(label),
  tooltips: L7(label),
  actions: undefined,
  ...(sort !== undefined ? { sort } : {})
})

/**
 * Quatre attributs, une sorte chacune des trois, plus deux clés dont la valeur d'usine est
 * `undefined` — le cas qui distingue « pré-rempli » de « porte une valeur ».
 */
const NATURE_CONFIG = {
  value_mode: attr('value_mode', 'percent', 'style'),
  neutral_colors: attr('neutral_colors', true, 'style'),
  normalize_link_id: attr('normalize_link_id', undefined, 'identity'),
  descriptor: attr('descriptor', undefined, 'navigation')
}

const makeNature = (id = 'unitary_star'): Class_FigureNature =>
  new Class_FigureNature(id, { ...NATURE_CONFIG })

describe('os#1418 Class_FigureNature — declaration, sortes et styles', () => {
  it('le style default est le socle, pre-rempli des valeurs usine', () => {
    const nature = makeNature()
    expect(nature.default_style.is_default_style).toBe(true)
    expect(nature.default_style.id).toBe(FIGURE_DEFAULT_STYLE_ID)
    expect(nature.default_style.getElementProperty('value_mode')).toBe('percent')
    expect(nature.default_style.getElementProperty('neutral_colors')).toBe(true)
    // Une usine `undefined` reste `undefined` : pre-rempli ne veut pas dire porteur.
    expect(nature.default_style.getElementProperty('normalize_link_id')).toBeUndefined()
    expect(nature.factoryDefault('value_mode')).toBe('percent')
    expect(nature.declared_keys).toEqual(
      ['value_mode', 'neutral_colors', 'normalize_link_id', 'descriptor']
    )
  })

  it('sortOf rend style pour une cle declaree sans sorte, undefined pour une cle inconnue', () => {
    const nature = new Class_FigureNature('n', { plain: attr('plain', 1) })
    expect(nature.sortOf('plain')).toBe('style')
    expect(nature.sortOf('zorglub')).toBeUndefined()
    expect(nature.isDeclared('plain')).toBe(true)
    expect(nature.isDeclared('zorglub')).toBe(false)

    const full = makeNature()
    expect(full.sortOf('value_mode')).toBe('style')
    expect(full.sortOf('normalize_link_id')).toBe('identity')
    expect(full.sortOf('descriptor')).toBe('navigation')
  })

  it('seule la sorte style se transpose, une cle inconnue retombe sur la regle fournie', () => {
    const nature = makeNature()
    // Le repli est OBLIGATOIRE (un defaut permissif echouerait du mauvais cote) ; pour une cle
    // declaree il n est jamais consulte.
    const never = (): boolean => { throw new Error('le repli ne doit pas etre consulte') }
    expect(nature.isTransposable('value_mode', never)).toBe(true)
    expect(nature.isTransposable('neutral_colors', never)).toBe(true)
    expect(nature.isTransposable('normalize_link_id', never)).toBe(false)
    expect(nature.isTransposable('descriptor', never)).toBe(false)
    // Non declaree : c'est le repli (isTransposableOption de MenuConfig) qui decide.
    expect(nature.isTransposable('zorglub', () => true)).toBe(true)
    expect(nature.isTransposable('zorglub', () => false)).toBe(false)
    // Et le repli ne peut PAS rattraper une cle declaree non transposable.
    expect(nature.isTransposable('normalize_link_id', () => true)).toBe(false)
  })

  it('createStyle est idempotent et deleteStyle ne touche pas au default', () => {
    const nature = makeNature()
    const s1 = nature.createStyle('s1', 'Comparaison')
    expect(s1.id).toBe('s1')
    expect(s1.name).toBe('Comparaison')
    expect(s1.is_default_style).toBe(false)
    // Un style ordinaire n'est PAS pre-rempli : il ne dit que ce qu'on y pose.
    expect(s1.getElementProperty('value_mode')).toBeUndefined()

    expect(nature.createStyle('s1')).toBe(s1)
    expect(nature.style('s1')).toBe(s1)
    expect(Object.keys(nature.styles_dict).sort()).toEqual(['default', 's1'])

    nature.deleteStyle(FIGURE_DEFAULT_STYLE_ID)
    expect(nature.style(FIGURE_DEFAULT_STYLE_ID)).toBe(nature.default_style)
    nature.deleteStyle('s1')
    expect(nature.style('s1')).toBeUndefined()
  })
})

describe('os#1418 Class_Figure — la cascade et la surcharge minimale', () => {
  let nature: Class_FigureNature
  let figure: Class_Figure

  beforeEach(() => {
    nature = makeNature()
    figure = new Class_Figure(nature, 'pane_1')
  })

  it('une figure neuve rend les valeurs usine et ne porte rien', () => {
    expect(figure.key).toBe('pane_1')
    expect(figure.getElementProperty('value_mode')).toBe('percent')
    expect(figure.getElementProperty('neutral_colors')).toBe(true)
    expect(figure.getElementProperty('normalize_link_id')).toBeUndefined()
    // Les cles sans valeur ne figurent pas dans le sac effectif.
    expect(figure.attributes).toEqual({ value_mode: 'percent', neutral_colors: true })
    expect(figure.own).toEqual({})
    expect(figure.isAttributeExplicit('value_mode')).toBe(false)
    expect(figure.isAttributeOverloaded('value_mode')).toBe(false)
  })

  it('assign ne pose que ce qui differe de la cascade', () => {
    figure.assign({ value_mode: 'value', neutral_colors: true })
    expect(figure.own).toEqual({ value_mode: 'value' })
    expect(figure.isAttributeExplicit('neutral_colors')).toBe(false)
    expect(figure.isAttributeOverloaded('value_mode')).toBe(true)
    expect(figure.getElementProperty('value_mode')).toBe('value')
    expect(figure.attributes).toEqual({ value_mode: 'value', neutral_colors: true })
  })

  it('set pose une seule cle avec la meme regle de surcharge minimale', () => {
    figure.set('value_mode', 'value')
    expect(figure.own).toEqual({ value_mode: 'value' })
    figure.set('neutral_colors', true)
    expect(figure.own).toEqual({ value_mode: 'value' })
    figure.set('value_mode', 'percent')
    expect(figure.own).toEqual({})
  })

  it('une figure sans surcharge suit le style ajoute, une figure surchargee garde le sien', () => {
    const s1 = nature.createStyle('s1')
    nature.assignStyle(s1, { value_mode: 'normalized' })

    const follower = new Class_Figure(nature, 'pane_2')
    follower.addStyle(s1)
    expect(follower.getElementProperty('value_mode')).toBe('normalized')
    expect(follower.getStyleWithAttr('value_mode')).toBe(s1)
    // Une cle que le style ne porte pas retombe sur l'usine.
    expect(follower.getElementProperty('neutral_colors')).toBe(true)

    figure.assign({ value_mode: 'value', neutral_colors: true })
    figure.addStyle(s1)
    expect(figure.getElementProperty('value_mode')).toBe('value')
    expect(figure.isAttributeOverloaded('value_mode')).toBe(true)
  })

  it('le dernier style ajoute gagne, et addStyle ne double pas', () => {
    const s1 = nature.createStyle('s1')
    const s2 = nature.createStyle('s2')
    nature.assignStyle(s1, { value_mode: 'normalized' })
    nature.assignStyle(s2, { value_mode: 'raw' })

    figure.addStyle(s1)
    figure.addStyle(s2)
    figure.addStyle(s1)
    expect(figure.style.map(s => s.id)).toEqual(['default', 's1', 's2'])
    expect(figure.getElementProperty('value_mode')).toBe('raw')
    expect(figure.getStylesWithAttr('value_mode').map(s => s.id)).toEqual(['default', 's1', 's2'])
    expect(figure.hasStyle('s1')).toBe(true)
  })

  it('removeStyleById ramene a la cascade precedente et ne retire pas le default', () => {
    const s1 = nature.createStyle('s1')
    nature.assignStyle(s1, { value_mode: 'normalized' })
    figure.addStyle(s1)
    expect(figure.getElementProperty('value_mode')).toBe('normalized')

    figure.removeStyleById('s1')
    expect(figure.hasStyle('s1')).toBe(false)
    expect(figure.getElementProperty('value_mode')).toBe('percent')

    figure.removeStyleById(FIGURE_DEFAULT_STYLE_ID)
    expect(figure.style.map(s => s.id)).toEqual(['default'])
  })

  it('replaceStyles garde le default en tete', () => {
    const s1 = nature.createStyle('s1')
    const s2 = nature.createStyle('s2')
    figure.addStyle(s1)
    figure.replaceStyles([s2])
    expect(figure.style.map(s => s.id)).toEqual(['default', 's2'])
  })

  it('regler une figure comme son style efface la surcharge, elle se remet a suivre', () => {
    const s1 = nature.createStyle('s1')
    nature.assignStyle(s1, { value_mode: 'normalized' })
    figure.addStyle(s1)
    figure.assign({ value_mode: 'value', neutral_colors: true })
    expect(figure.own).toEqual({ value_mode: 'value' })

    // Le sac revient a ce que le style dit : plus de surcharge.
    figure.assign({ value_mode: 'normalized', neutral_colors: true })
    expect(figure.own).toEqual({})
    expect(figure.getElementProperty('value_mode')).toBe('normalized')

    // Et le style qui bouge emmene la figure avec lui.
    nature.assignStyle(s1, { value_mode: 'raw' })
    expect(figure.getElementProperty('value_mode')).toBe('raw')
  })

  it('une cle absente du sac ou posee a undefined quitte la surcharge propre', () => {
    figure.assign({ value_mode: 'value', neutral_colors: false })
    expect(figure.own).toEqual({ value_mode: 'value', neutral_colors: false })

    figure.assign({ neutral_colors: false })
    expect(figure.own).toEqual({ neutral_colors: false })

    figure.assign({ neutral_colors: undefined })
    expect(figure.own).toEqual({})
    expect(figure.getElementProperty('neutral_colors')).toBe(true)
  })

  it('delete retire la surcharge, loadOwn la reprend telle quelle sans minimiser', () => {
    figure.loadOwn({ value_mode: 'percent', zorglub: 1, vide: undefined })
    // Pas de minimisation : la valeur egale a l'usine reste posee (contrat de migration).
    expect(figure.own).toEqual({ value_mode: 'percent', zorglub: 1 })
    figure.delete('value_mode')
    expect(figure.own).toEqual({ zorglub: 1 })
  })

  it('une cle non declaree est gardee et figure dans le sac effectif', () => {
    figure.assign({ value_mode: 'percent', neutral_colors: true, zorglub: 1 })
    expect(figure.own).toEqual({ zorglub: 1 })
    expect(figure.getElementProperty('zorglub')).toBe(1)
    expect(figure.attributes).toEqual({ value_mode: 'percent', neutral_colors: true, zorglub: 1 })
  })

  it('le sac effectif est un objet neuf a chaque appel', () => {
    const first = figure.attributes
    expect(figure.attributes).not.toBe(first)
    expect(figure.attributes).toEqual(first)
  })
})

describe('os#1418 assignStyle — un style ne porte que de la sorte style', () => {
  let nature: Class_FigureNature

  beforeEach(() => { nature = makeNature() })

  it('refuse identite et navigation, et rend les cles refusees', () => {
    const refused = nature.assignStyle(nature.default_style, {
      value_mode: 'value',
      normalize_link_id: 'link_42',
      descriptor: { axis: 'tag' }
    })
    expect(refused).toEqual(['normalize_link_id', 'descriptor'])
    expect(nature.default_style.getElementProperty('value_mode')).toBe('value')
    expect(nature.default_style.getElementProperty('normalize_link_id')).toBeUndefined()
    expect(nature.default_style.getElementProperty('descriptor')).toBeUndefined()
  })

  it('sur le default, une cle absente du sac reprend sa valeur usine', () => {
    const def = nature.default_style
    nature.assignStyle(def, { value_mode: 'value', neutral_colors: false })
    expect(def.getElementProperty('value_mode')).toBe('value')
    expect(def.getElementProperty('neutral_colors')).toBe(false)

    nature.assignStyle(def, { neutral_colors: false })
    expect(def.getElementProperty('value_mode')).toBe('percent')
    expect(def.getElementProperty('neutral_colors')).toBe(false)
  })

  it('sur un style ordinaire, une cle absente du sac est retiree', () => {
    const s1 = nature.createStyle('s1')
    nature.assignStyle(s1, { value_mode: 'normalized', neutral_colors: false })
    expect(s1.attributes).toEqual({ value_mode: 'normalized', neutral_colors: false })

    nature.assignStyle(s1, { neutral_colors: false })
    expect(s1.attributes).toEqual({ neutral_colors: false })
    expect(s1.getElementProperty('value_mode')).toBeUndefined()
  })

  it('une cle non declaree est acceptee par un style', () => {
    const s1 = nature.createStyle('s1')
    const refused = nature.assignStyle(s1, { zorglub: 3 })
    expect(refused).toEqual([])
    expect(s1.getElementProperty('zorglub')).toBe(3)
    expect(nature.styleBag(s1)).toEqual({ zorglub: 3 })
  })

  it('styleBag ne montre jamais une cle d identite ou de navigation', () => {
    const def = nature.default_style
    // Un default pollue par un fichier d'avant os#1394 : le sac doit quand meme rester propre.
    def.attributes = { ...def.attributes, normalize_link_id: 'link_42', descriptor: { axis: 'tag' } }
    expect(nature.styleBag(def)).toEqual({ value_mode: 'percent', neutral_colors: true })

    const s1 = nature.createStyle('s1')
    nature.assignStyle(s1, { value_mode: 'normalized' })
    expect(nature.styleBag(s1)).toEqual({ value_mode: 'normalized' })
  })
})

describe('os#1418 persistance — additive des deux cotes', () => {
  let nature: Class_FigureNature
  let report: Class_FigureMigrationReport

  beforeEach(() => {
    nature = makeNature()
    report = new Class_FigureMigrationReport()
  })

  it('une nature que personne n a reglee n ecrit rien', () => {
    expect(nature.toJSON()).toBeUndefined()
  })

  it('le default n ecrit que ses ecarts a l usine', () => {
    nature.assignStyle(nature.default_style, { value_mode: 'value', neutral_colors: true })
    expect(nature.toJSON()).toEqual({ default: { attributes: { value_mode: 'value' } } })
  })

  it('un style ordinaire ecrit son nom et tout ce qu il porte', () => {
    const s1 = nature.createStyle('s1', 'Comparaison')
    nature.assignStyle(s1, { value_mode: 'normalized', neutral_colors: true })
    expect(nature.toJSON()).toEqual({
      s1: { name: 'Comparaison', attributes: { value_mode: 'normalized', neutral_colors: true } }
    })
  })

  it('fromJSON relit une nature a l identique', () => {
    nature.assignStyle(nature.default_style, { value_mode: 'value', neutral_colors: true })
    const s1 = nature.createStyle('s1', 'Comparaison')
    nature.assignStyle(s1, { value_mode: 'normalized', neutral_colors: true })
    const json = nature.toJSON()

    const relue = makeNature()
    relue.fromJSON(json, report, 'styles')
    expect(relue.toJSON()).toEqual(json)
    expect(relue.style('s1')?.name).toBe('Comparaison')
    expect(report.notes).toEqual([])
    expect(report.migrated).toBe(3)
  })

  it('une cle liee au sujet trouvee dans un style est ecartee et rapportee', () => {
    nature.fromJSON(
      { default: { attributes: { value_mode: 'value', normalize_link_id: 'link_42' } } },
      report, 'representation_defaults'
    )
    expect(nature.default_style.getElementProperty('value_mode')).toBe('value')
    expect(nature.default_style.getElementProperty('normalize_link_id')).toBeUndefined()
    expect(report.notes).toEqual([{
      nature: 'unitary_star',
      key: 'normalize_link_id',
      where: 'representation_defaults[default]',
      reason: 'not_transposable'
    }])
    expect(report.migrated).toBe(1)
  })

  it('une cle inconnue est relue et rapportee', () => {
    nature.fromJSON({ default: { attributes: { zorglub: 1 } } }, report, 'styles')
    expect(nature.default_style.getElementProperty('zorglub')).toBe(1)
    expect(report.notes.map(n => n.reason)).toEqual(['unknown_key'])
    expect(report.notes[0].key).toBe('zorglub')
  })

  it('fromJSON ignore une entree qui n a pas la forme attendue', () => {
    expect(() => nature.fromJSON(undefined, report, 'styles')).not.toThrow()
    expect(() => nature.fromJSON([1, 2], report, 'styles')).not.toThrow()
    expect(() => nature.fromJSON({ default: 'oups' }, report, 'styles')).not.toThrow()
    expect(() => nature.fromJSON({ default: { attributes: 3 } }, report, 'styles')).not.toThrow()
    expect(report.is_empty).toBe(true)
  })

  it('une figure qui suit le default n ecrit rien', () => {
    const figure = new Class_Figure(nature, 'pane_1')
    expect(figure.toJSON()).toBeUndefined()
  })

  it('une figure ecrit sa surcharge propre et ses styles suivis', () => {
    const s1 = nature.createStyle('s1')
    const figure = new Class_Figure(nature, 'pane_1')

    figure.assign({ value_mode: 'value' })
    expect(figure.toJSON()).toEqual({ attributes: { value_mode: 'value' } })

    const nu = new Class_Figure(nature, 'pane_2')
    nu.addStyle(s1)
    expect(nu.toJSON()).toEqual({ styles: ['s1'] })

    figure.addStyle(s1)
    expect(figure.toJSON()).toEqual({ attributes: { value_mode: 'value' }, styles: ['s1'] })
  })

  it('fromJSON relit la surcharge et les styles suivis', () => {
    nature.createStyle('s1')
    const figure = new Class_Figure(nature, 'pane_1')
    figure.fromJSON({ attributes: { value_mode: 'value' }, styles: ['s1'] }, report, 'panes[pane_1]')
    expect(figure.own).toEqual({ value_mode: 'value' })
    expect(figure.hasStyle('s1')).toBe(true)
    expect(report.migrated).toBe(1)
    expect(report.notes).toEqual([])
  })

  it('une cle non declaree relue sur une figure est gardee et rapportee', () => {
    const figure = new Class_Figure(nature, 'pane_1')
    figure.fromJSON({ attributes: { zorglub: 1 } }, report, 'panes[pane_1]')
    expect(figure.getElementProperty('zorglub')).toBe(1)
    expect(report.notes).toEqual([{
      nature: 'unitary_star', key: 'zorglub', where: 'panes[pane_1]', reason: 'unknown_key'
    }])
  })

  it('un style suivi inconnu est ignore sans lever', () => {
    const figure = new Class_Figure(nature, 'pane_1')
    expect(() => figure.fromJSON({ styles: ['inconnu', 7] }, report, 'panes[pane_1]')).not.toThrow()
    expect(figure.style.map(s => s.id)).toEqual(['default'])
    expect(() => figure.fromJSON(null, report, 'panes[pane_1]')).not.toThrow()
  })
})

describe('os#1418 Class_FigureMigrationReport — rien ne se perd en silence', () => {
  const note = (key: string) => ({
    nature: 'unitary_star', key, where: 'options', reason: 'unknown_key' as const
  })

  it('un rapport vide ne dit rien', () => {
    const report = new Class_FigureMigrationReport()
    expect(report.is_empty).toBe(true)
    expect(report.summary()).toBeNull()
  })

  it('des reglages portes sans note ne font toujours pas de resume', () => {
    const report = new Class_FigureMigrationReport()
    report.countMigrated(3)
    expect(report.is_empty).toBe(false)
    expect(report.summary()).toBeNull()
  })

  it('le resume compte et nomme des exemples', () => {
    const report = new Class_FigureMigrationReport()
    report.countMigrated(4)
    report.add(note('zorglub'))
    report.add(note('machin'))
    const summary = report.summary() as string
    expect(summary).toContain('4 ')
    expect(summary).toContain('unitary_star:zorglub (options, unknown_key)')
    expect(summary).toContain('unitary_star:machin (options, unknown_key)')
    expect(summary).not.toContain('+')
  })

  it('au dela de cinq notes le resume abrege', () => {
    const report = new Class_FigureMigrationReport()
    for (let i = 0; i < 7; i++) report.add(note(`k${i}`))
    const summary = report.summary() as string
    expect(summary).toContain('unitary_star:k4')
    expect(summary).not.toContain('unitary_star:k5')
    expect(summary).toContain('+2')
    expect(report.notes).toHaveLength(7)

    report.reset()
    expect(report.is_empty).toBe(true)
    expect(report.summary()).toBeNull()
  })
})

describe('os#1418 transposableBagChanges — le diff, moins ce qui ne voyage pas', () => {
  const nature = makeNature()
  const rule = (key: string) => nature.isTransposable(key, () => true)

  it('ne rend que ce qui change', () => {
    expect(transposableBagChanges(
      { value_mode: 'percent', neutral_colors: true },
      { value_mode: 'value', neutral_colors: true },
      rule
    )).toEqual({ value_mode: 'value' })
  })

  it('ne rend que ce qui se transpose', () => {
    expect(transposableBagChanges(
      { value_mode: 'percent', normalize_link_id: 'a', descriptor: { axis: 'tag' } },
      { value_mode: 'value', normalize_link_id: 'b', descriptor: { axis: 'level' } },
      rule
    )).toEqual({ value_mode: 'value' })
  })

  it('une cle retiree ne voyage pas', () => {
    expect(transposableBagChanges(
      { value_mode: 'value', neutral_colors: false },
      { neutral_colors: false },
      rule
    )).toEqual({})
  })

  it('une valeur composee egale n est pas un changement', () => {
    const transposable = () => true
    expect(transposableBagChanges(
      { descriptor: { axis: 'tag', depth: 2 } },
      { descriptor: { axis: 'tag', depth: 2 } },
      transposable
    )).toEqual({})
    expect(transposableBagChanges(
      { descriptor: { axis: 'tag', depth: 2 } },
      { descriptor: { axis: 'tag', depth: 3 } },
      transposable
    )).toEqual({ descriptor: { axis: 'tag', depth: 3 } })
  })

  it('un sac absent se comporte comme un sac vide', () => {
    expect(transposableBagChanges(undefined, { value_mode: 'value' }, rule))
      .toEqual({ value_mode: 'value' })
    expect(transposableBagChanges({ value_mode: 'value' }, undefined, rule)).toEqual({})
  })
})
