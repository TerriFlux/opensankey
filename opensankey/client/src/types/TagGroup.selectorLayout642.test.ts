import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTagGroup, Class_NodeTagGroup } from './TagGroup'
import type { Type_JSON } from './Utils'
import {
  SELECTOR_BUTTONS_MAX, SELECTOR_STEPPER_MAX, effectiveSelectorForm, selectorFormRefusal
} from './SelectorLayout'

// sa#642 — LA FORME ET LA PLACE D'UN SÉLECTEUR, réglées à part du nombre de membres.
//
// Ce qui compte : (1) un fichier existant s'ouvre SANS CHANGEMENT — forme et place absentes valent
// celles d'aujourd'hui (barre du haut si `topbar`, barre du bas pour une séquence, sinon panneau ;
// rangée de boutons en bas, liste ailleurs) ; (2) un choix fait par l'auteur survit à l'aller-retour
// JSON ; (3) un choix inutilisable est refusé avec sa raison, et un réglage enregistré devenu
// inutilisable reste enregistré, l'affichage retombant sur la liste.

function app() { return new Class_ApplicationData(false) }

function dimension(nb_membres = 3) {
  const g = app().drawing_area.sankey.addDataTagGroup('annee', 'Année', false) as unknown as Class_DataTagGroup
  for (let i = 0; i < nb_membres; i++) g.addTag(`${2015 + i}`, `y${i}`)
  return g
}

function etiquettes(nb = 3) {
  const g = app().drawing_area.sankey.addNodeTagGroup('secteur', 'Secteur', false) as unknown as Class_NodeTagGroup
  for (let i = 0; i < nb; i++) g.addTag(`S${i}`, `s${i}`)
  return g
}

describe('sa#642 — règles de forme', () => {
  test('rangée de boutons en choix multiple : refusée au-delà de six valeurs, avec sa raison', () => {
    expect(selectorFormRefusal('buttons', { banner: 'multi', value_count: SELECTOR_BUTTONS_MAX })).toBeNull()
    expect(selectorFormRefusal('buttons', { banner: 'multi', value_count: SELECTOR_BUTTONS_MAX + 1 }))
      .toEqual({ key: 'Tags.selector.refused_buttons_multi', count: SELECTOR_BUTTONS_MAX + 1, max: SELECTOR_BUTTONS_MAX })
    // En choix unique, pas de seuil : la rangée devient un curseur.
    expect(selectorFormRefusal('buttons', { banner: 'one', value_count: 977 })).toBeNull()
  })

  test('frise : refusée au-delà de trente valeurs (« Frise : 977 valeurs, possible jusqu à 30 »)', () => {
    expect(selectorFormRefusal('stepper', { banner: 'one', value_count: SELECTOR_STEPPER_MAX })).toBeNull()
    expect(selectorFormRefusal('stepper', { banner: 'one', value_count: 977 }))
      .toEqual({ key: 'Tags.selector.refused_stepper', count: 977, max: SELECTOR_STEPPER_MAX })
  })

  test('la liste n est jamais refusée', () => {
    expect(selectorFormRefusal('list', { banner: 'multi', value_count: 10000 })).toBeNull()
  })

  test('forme dessinée : choisie, sinon celle d aujourd hui selon la place, et la liste si refusée', () => {
    const peu = { banner: 'one', value_count: 3 }
    expect(effectiveSelectorForm(undefined, 'bottom', peu)).toBe('buttons')
    expect(effectiveSelectorForm(undefined, 'top', peu)).toBe('list')
    expect(effectiveSelectorForm(undefined, 'panel', peu)).toBe('list')
    expect(effectiveSelectorForm('stepper', 'panel', peu)).toBe('stepper')
    expect(effectiveSelectorForm('stepper', 'bottom', { banner: 'one', value_count: 31 })).toBe('list')
    expect(effectiveSelectorForm(undefined, 'bottom', { banner: 'multi', value_count: 7 })).toBe('list')
  })
})

describe('sa#642 — fichiers existants : rien ne change à l ouverture', () => {
  test('une séquence (banner sequence) est en barre du bas, en rangée de boutons', () => {
    const g = dimension()
    g.fromJSON({ ...(g.toJSON() as object), banner: 'sequence' } as unknown as Type_JSON)
    expect(g.plays).toBe(true)
    expect(g.selector_place).toBe('bottom')
    expect(g.selector_form).toBe('buttons')
    expect(g.stored_selector_place).toBeUndefined()
    expect(g.stored_selector_form).toBeUndefined()
  })

  test('un ancien banner topbar est en barre du haut, en liste', () => {
    const g = dimension()
    g.fromJSON({ ...(g.toJSON() as object), banner: 'topbar' } as unknown as Type_JSON)
    expect(g.selector_place).toBe('top')
    expect(g.selector_form).toBe('list')
  })

  test('la clé topbar l emporte sur la séquence (place d aujourd hui : barre du haut si topbar)', () => {
    const g = dimension()
    g.fromJSON({ ...(g.toJSON() as object), banner: 'sequence', topbar: true } as unknown as Type_JSON)
    expect(g.plays).toBe(true)
    expect(g.selector_place).toBe('top')
  })

  test('un groupe ordinaire est dans le panneau Filtres, en liste', () => {
    const g = etiquettes()
    expect(g.selector_place).toBe('panel')
    expect(g.selector_form).toBe('list')
  })

  test('sans choix de l auteur, ni form ni place ne sont écrits', () => {
    const g = dimension()
    g.banner = 'sequence'
    const json = g.toJSON() as { form?: string, place?: string, topbar?: boolean }
    expect(json.form).toBeUndefined()
    expect(json.place).toBeUndefined()
    expect(json.topbar).toBeUndefined()
  })
})

describe('sa#642 — les choix de l auteur survivent à l aller-retour JSON', () => {
  test('frise dans le panneau, pour une séquence (qui serait sinon en barre du bas)', () => {
    const g = dimension()
    g.banner = 'sequence'
    g.selector_form = 'stepper'
    g.selector_place = 'panel'
    const json = g.toJSON() as { form?: string, place?: string, banner: string }
    expect(json.form).toBe('stepper')
    expect(json.place).toBe('panel')
    expect(json.banner).toBe('sequence')
    const relu = dimension()
    relu.fromJSON(json as unknown as Type_JSON)
    expect(relu.selector_form).toBe('stepper')
    expect(relu.selector_place).toBe('panel')
  })

  test('barre du haut : écrite topbar (viewers antérieurs), relue barre du haut', () => {
    const g = etiquettes()
    g.selector_place = 'top'
    g.selector_form = 'buttons'
    const json = g.toJSON() as { topbar?: boolean, place?: string, form?: string }
    expect(json.topbar).toBe(true)
    expect(json.place).toBeUndefined()
    const relu = etiquettes()
    relu.fromJSON(json as unknown as Type_JSON)
    expect(relu.selector_place).toBe('top')
    expect(relu.in_topbar).toBe(true)
    expect(relu.selector_form).toBe('buttons')
  })

  test('barre du bas pour un groupe d étiquettes de nœuds (elle n est plus réservée à la lecture)', () => {
    const g = etiquettes()
    g.selector_place = 'bottom'
    const relu = etiquettes()
    relu.fromJSON(g.toJSON())
    expect(relu.selector_place).toBe('bottom')
    // Sans forme choisie, la barre du bas montre la rangée de boutons, comme la séquence.
    expect(relu.selector_form).toBe('buttons')
  })

  test('quitter la barre du haut par l ancien interrupteur rend la place d aujourd hui', () => {
    const g = dimension()
    g.banner = 'sequence'
    g.in_topbar = true
    expect(g.selector_place).toBe('top')
    g.in_topbar = false
    expect(g.selector_place).toBe('bottom')
  })

  test('la copie (vues, mises à jour) emporte forme et place', () => {
    const g = etiquettes()
    g.selector_place = 'bottom'
    g.selector_form = 'stepper'
    const copie = etiquettes()
    copie.copyFrom(g)
    expect(copie.stored_selector_place).toBe('bottom')
    expect(copie.stored_selector_form).toBe('stepper')
  })
})

describe('sa#642 — un réglage devenu inutilisable reste enregistré, la liste s affiche', () => {
  test('frise choisie, puis 31 valeurs : réglage gardé et écrit, forme dessinée = liste', () => {
    const g = dimension(3)
    g.selector_form = 'stepper'
    expect(g.selector_form).toBe('stepper')
    for (let i = 3; i < 31; i++) g.addTag(`${2015 + i}`, `y${i}`)
    expect(g.stored_selector_form).toBe('stepper')
    expect(g.selector_form).toBe('list')
    expect((g.toJSON() as { form?: string }).form).toBe('stepper')
  })
})
