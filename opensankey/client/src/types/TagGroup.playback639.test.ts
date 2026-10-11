import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTagGroup } from './TagGroup'
import type { Type_JSON } from './Utils'

// sa#639 — LA LECTURE DEVIENT UNE CASE du sélecteur d'une dimension, indépendante du nombre de
// membres. Deux contrats ici : la COMPATIBILITÉ (un fichier `banner: 'sequence'` s'ouvre sans
// changement visible, et s'écrit encore ainsi pour les viewers antérieurs), et le CHOIX DE
// L'UTILISATEUR, que le défilement ne touche jamais (fichier, sortie de lecture, geste en cours).

function groupe() {
  const app = new Class_ApplicationData(false)
  const g = app.drawing_area.sankey.addDataTagGroup('annee', 'Année', false) as unknown as Class_DataTagGroup
  g.addTag('2015', 'a')
  g.addTag('2019', 'b')
  g.addTag('2023', 'c')
  g.selectTagsFromIds(['a'])
  return { app, g }
}

const choisis = (g: Class_DataTagGroup) => g.selected_tags_list.map(t => t.id)
const enregistres = (json: Type_JSON) => Object.entries(json['tags'] as Type_JSON)
  .filter(([, tag]) => (tag as Type_JSON)['selected'] === true).map(([id]) => id)

describe('sa#639 — compatibilité de la séquence', () => {
  test('banner sequence se lit « un membre » + Lecture, réglages par défaut (2 s, sans boucle)', () => {
    const { g } = groupe()
    g.fromJSON({ ...(g.toJSON() as object), banner: 'sequence' } as unknown as Type_JSON)
    expect(g.banner).toBe('one')
    expect(g.playback).toEqual({ loop: false, shuffle: false, delay: 2, autoplay: false })
    expect(g.plays).toBe(true)
    expect(g.drawing).toBe('one')
  })

  test('is_sequence se lit de même', () => {
    const { g } = groupe()
    g.fromJSON({ ...(g.toJSON() as object), banner: 'one', is_sequence: true } as unknown as Type_JSON)
    expect(g.banner).toBe('one')
    expect(g.playback).toBeDefined()
  })

  test('un membre + Lecture s écrit encore sequence, avec ses réglages', () => {
    const { g } = groupe()
    g.banner = 'one'
    g.playback = { loop: true, shuffle: true, delay: 0.05, autoplay: true }
    const json = g.toJSON()
    expect(json['banner']).toBe('sequence')
    expect(json['playback']).toEqual({ loop: true, shuffle: true, delay: 0.05, autoplay: true })
    const { g: relu } = groupe()
    relu.fromJSON(json)
    expect(relu.banner).toBe('one')
    expect(relu.playback).toEqual({ loop: true, shuffle: true, delay: 0.05, autoplay: true })
  })

  test('plusieurs + Lecture : la bannière reste multi, la Lecture voyage à part', () => {
    const { g } = groupe()
    g.banner = 'multi'
    g.playback = { loop: false, shuffle: false, delay: 1, autoplay: false }
    const json = g.toJSON()
    expect(json['banner']).toBe('multi')
    const { g: relu } = groupe()
    relu.fromJSON(json)
    expect(relu.banner).toBe('multi')
    expect(relu.playback?.delay).toBe(1)
  })

  test('sans Lecture, aucune clé n est écrite ; une bannière explicite sans clé la décoche', () => {
    const { g } = groupe()
    const sans_lecture = g.toJSON()
    expect(sans_lecture['playback']).toBeUndefined()
    g.playback = { loop: false, shuffle: false, delay: 2, autoplay: false }
    g.fromJSON(sans_lecture)
    expect(g.playback).toBeUndefined()
    g.playback = { loop: false, shuffle: false, delay: 2, autoplay: false }
    const muet = { ...(sans_lecture as object) } as Type_JSON
    delete muet['banner']
    g.fromJSON(muet)
    expect(g.playback).toBeDefined()
  })

  test('la Lecture se recopie avec la dimension (vues)', () => {
    const { g } = groupe()
    g.playback = { loop: true, shuffle: false, delay: 3, autoplay: false }
    const { g: copie } = groupe()
    copie.copyFrom(g)
    expect(copie.playback).toEqual({ loop: true, shuffle: false, delay: 3, autoplay: false })
  })
})

describe('sa#639 — ce qui défile, et le choix qui reste', () => {
  test('un membre : toutes les valeurs, dans l ordre du groupe', () => {
    const { g } = groupe()
    expect(g.playback_steps).toEqual(['a', 'b', 'c'])
  })

  test('plusieurs : seulement les cochées, dans l ordre du groupe', () => {
    const { g } = groupe()
    g.banner = 'multi'
    g.selectTagsFromIds(['c', 'a'])
    expect(g.playback_steps).toEqual(['a', 'c'])
  })

  test('pendant la lecture, le diagramme montre un membre, le fichier et les sélecteurs gardent les cochés', () => {
    const { g } = groupe()
    g.banner = 'multi'
    g.selectTagsFromIds(['a', 'c'])
    const source = g.playbackSource()
    source.begin(() => source.end(false))
    source.show('c')
    expect(choisis(g)).toEqual(['c'])
    expect(g.playback_checked_ids).toEqual(['a', 'c'])
    expect(enregistres(g.toJSON())).toEqual(['a', 'c'])
    source.end(true)
    expect(choisis(g)).toEqual(['a', 'c'])
    expect(g.playback_checked_ids).toBeUndefined()
  })

  test('un membre : les sélecteurs montrent la valeur qui défile, le fichier garde le choix', () => {
    const { g } = groupe()
    const source = g.playbackSource()
    source.begin(() => source.end(false))
    source.show('b')
    expect(g.playback_checked_ids).toBeUndefined()
    expect(choisis(g)).toEqual(['b'])
    expect(enregistres(g.toJSON())).toEqual(['a'])
    source.end(true)
    expect(choisis(g)).toEqual(['a'])
  })

  test('un membre décoché pendant la lecture l est par rapport au choix, et la lecture s arrête', () => {
    const { g } = groupe()
    g.banner = 'multi'
    g.selectTagsFromIds(['a', 'b', 'c'])
    const source = g.playbackSource()
    const takeover = jest.fn(() => source.end(false))
    source.begin(takeover)
    source.show('a')
    g.tags_dict['c'].toogleSelected()
    expect(takeover).toHaveBeenCalledTimes(1)
    expect(choisis(g)).toEqual(['a', 'b'])
    expect(g.playback_checked_ids).toBeUndefined()
  })

  test('choisir pendant la lecture puis annuler revient au choix d avant la lecture', () => {
    const { app, g } = groupe()
    const source = g.playbackSource()
    source.begin(() => source.end(false))
    source.show('c')
    g.selectTagsFromId('b')
    expect(choisis(g)).toEqual(['b'])
    app.history.applyUndo()
    expect(choisis(g)).toEqual(['a'])
  })
})
