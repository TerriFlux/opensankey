import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'
import { updateFrom } from './UpdateFrom'

// jsdom + node de l'environnement jest 27 n'expose pas toujours `structuredClone`
// (utilisé par le mode `Values`/`*` d'updateFrom). En prod (navigateur) il existe
// nativement ; on le polyfill uniquement pour le test.
if (typeof (globalThis as { structuredClone?: unknown }).structuredClone === 'undefined') {
  ;(globalThis as { structuredClone: <T>(o: T) => T }).structuredClone =
    <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// #232 — Tests de la couche BASE OpenSankey : `updateFrom` applique la mise en
// page / les attributs d'une drawing_area SOURCE vers la CIBLE, selon une liste
// de modes (`mode: string[]`). C'est le socle de l'héritage de vues (OSP appelle
// `updateFrom(cible_da, source_da, attrs)` pour propager les attributs hérités).
//
// On construit deux `Class_ApplicationData` réelles (comme corpusRoundTrip) et on
// vérifie : la propagation nominale par mode, la SÉLECTIVITÉ (seuls les attrs du
// mode passent), la NON-RÉGRESSION (un attribut hors mode n'est pas écrasé), et
// les cas limites (source/cible vides, nœud présent d'un seul côté).

/** Diagramme minimal A→B, réutilisé identiquement côté source et cible pour que
 *  `updateFrom` apparie les nœuds/liens par nom+id. */
function makePair(app: Class_ApplicationData): {
  A: Class_NodeElement
  B: Class_NodeElement
  link: Class_LinkElement
} {
  const sankey = app.drawing_area.sankey
  const A = sankey.addNewNode('A', 'A')
  const B = sankey.addNewNode('B', 'B')
  const link = sankey.addNewLink(A, B)
  return { A, B, link }
}

describe('#232 updateFrom — propagation nominale par mode', () => {
  it('posNode : positions x/y/u/v propagées source → cible', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    const s = makePair(src)
    const t = makePair(tgt)

    s.A.position_x = 123
    s.A.position_y = 456
    s.A.position_u = 7
    s.A.position_v = 8

    updateFrom(tgt.drawing_area, src.drawing_area, ['posNode'])

    expect(t.A.position_x).toBe(123)
    expect(t.A.position_y).toBe(456)
    expect(t.A.position_u).toBe(7)
    expect(t.A.position_v).toBe(8)
  })

  it('attrNode : attribut de forme (shape_opacity) propagé', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    const s = makePair(src)
    const t = makePair(tgt)

    s.A.shape_opacity = 0.3

    updateFrom(tgt.drawing_area, src.drawing_area, ['attrNode'])

    expect(t.A.shape_opacity).toBe(0.3)
  })

  it('attrFlux : attribut de lien (shape_opacity) propagé', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    const s = makePair(src)
    const t = makePair(tgt)

    s.link.shape_opacity = 0.2

    updateFrom(tgt.drawing_area, src.drawing_area, ['attrFlux'])

    expect(t.link.shape_opacity).toBe(0.2)
  })
})

describe('#232 updateFrom — sélectivité (seuls les modes demandés passent)', () => {
  it('posNode ne touche PAS les attributs de nœud', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    const s = makePair(src)
    const t = makePair(tgt)

    s.A.position_x = 999
    s.A.shape_opacity = 0.1 // modifié côté source mais NON demandé
    t.A.shape_opacity = 0.7 // valeur cible à préserver

    updateFrom(tgt.drawing_area, src.drawing_area, ['posNode'])

    expect(t.A.position_x).toBe(999) // position propagée
    expect(t.A.shape_opacity).toBe(0.7) // attribut NON propagé
  })

  it('attrNode ne touche PAS la position', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    const s = makePair(src)
    const t = makePair(tgt)

    s.A.shape_opacity = 0.1
    s.A.position_x = 999 // modifié côté source mais NON demandé
    t.A.position_x = 42 // valeur cible à préserver

    updateFrom(tgt.drawing_area, src.drawing_area, ['attrNode'])

    expect(t.A.shape_opacity).toBe(0.1) // attribut propagé
    expect(t.A.position_x).toBe(42) // position NON propagée
  })

  it('attrNode ne propage pas les attributs de LIEN', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    const s = makePair(src)
    const t = makePair(tgt)

    s.link.shape_opacity = 0.15
    t.link.shape_opacity = 0.9

    updateFrom(tgt.drawing_area, src.drawing_area, ['attrNode'])

    expect(t.link.shape_opacity).toBe(0.9) // lien non touché par attrNode
  })
})

describe('#232 updateFrom — attrDrawingArea + échelle', () => {
  it('attrDrawingArea seul conserve l\'échelle de la cible', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    makePair(src)
    makePair(tgt)
    src.drawing_area.scale = 5000
    tgt.drawing_area.scale = 100

    updateFrom(tgt.drawing_area, src.drawing_area, ['attrDrawingArea'])

    expect(tgt.drawing_area.scale).toBe(100)
  })

  it('attrDrawingArea + scale copie l\'échelle de la source', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    makePair(src)
    makePair(tgt)
    src.drawing_area.scale = 5000
    tgt.drawing_area.scale = 100

    updateFrom(tgt.drawing_area, src.drawing_area, ['attrDrawingArea', 'scale'])

    expect(tgt.drawing_area.scale).toBe(5000)
  })
})

// #382 — Sur un fichier multi-unités, l'échelle affichée n'est PAS celle de la zone
// de dessin mais celle de chaque tag d'unité (`Class_DataTag.scale` retombe sur la
// zone de dessin uniquement si le groupe n'est pas `is_unit`). La case « Échelle »
// d'« Appliquer la mise en page » doit commander ces échelles-là, et rester la seule
// à le faire — avant le correctif elle ne transférait que `drawing_area.scale`
// (invisible ici) tandis que la case « Données » recopiait les échelles unitaires
// sans condition.
/** Groupe de données unitaire « Unité » avec deux tags, échelles imposées. */
function makeUnitTagGroup(
  app: Class_ApplicationData,
  scales: { [tag_name: string]: number }
) {
  const tagg = app.drawing_area.sankey.addDataTagGroup('unite', 'Unité', false)
  tagg.is_unit = true
  Object.entries(scales).forEach(([name, scale]) => {
    tagg.addTag(name, name)
    tagg.tags_dict[name].scale = scale
  })
  return tagg
}

describe('#382 updateFrom — échelle des tags d\'unité', () => {
  it('la case Échelle transfère l\'échelle de chaque tag d\'unité', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    makePair(src)
    makePair(tgt)
    makeUnitTagGroup(src, { 'kt PB': 8000, 'kt MS': 300 })
    makeUnitTagGroup(tgt, { 'kt PB': 24617, 'kt MS': 999 })

    updateFrom(tgt.drawing_area, src.drawing_area, ['attrDrawingArea', 'scale'])

    const tagg = tgt.drawing_area.sankey._data_taggs['unite']
    expect(tagg.tags_dict['kt PB'].scale).toBe(8000)
    expect(tagg.tags_dict['kt MS'].scale).toBe(300)
  })

  it('sans la case Échelle, la case Données ne transfère plus les échelles unitaires', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    makePair(src)
    makePair(tgt)
    makeUnitTagGroup(src, { 'kt PB': 8000, 'kt MS': 300 })
    makeUnitTagGroup(tgt, { 'kt PB': 24617, 'kt MS': 999 })

    updateFrom(tgt.drawing_area, src.drawing_area, ['attrDrawingArea', 'tagData'])

    const tagg = tgt.drawing_area.sankey._data_taggs['unite']
    expect(tagg.tags_dict['kt PB'].scale).toBe(24617)
    expect(tagg.tags_dict['kt MS'].scale).toBe(999)
  })

  it('case Échelle + case Données : l\'échelle passe quand même', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    makePair(src)
    makePair(tgt)
    makeUnitTagGroup(src, { 'kt PB': 8000 })
    makeUnitTagGroup(tgt, { 'kt PB': 24617 })

    updateFrom(tgt.drawing_area, src.drawing_area, ['attrDrawingArea', 'tagData', 'scale'])

    expect(tgt.drawing_area.sankey._data_taggs['unite'].tags_dict['kt PB'].scale).toBe(8000)
  })

  it('la case Échelle seule (sans attrDrawingArea) transfère les deux porteurs', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    makePair(src)
    makePair(tgt)
    src.drawing_area.scale = 10000
    tgt.drawing_area.scale = 100
    makeUnitTagGroup(src, { 'kt PB': 8000 })
    makeUnitTagGroup(tgt, { 'kt PB': 24617 })

    updateFrom(tgt.drawing_area, src.drawing_area, ['scale'])

    expect(tgt.drawing_area.scale).toBe(10000)
    expect(tgt.drawing_area.sankey._data_taggs['unite'].tags_dict['kt PB'].scale).toBe(8000)
  })

  it('un tag d\'unité absent de la source garde son échelle', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    makePair(src)
    makePair(tgt)
    makeUnitTagGroup(src, { 'kt PB': 8000 })
    makeUnitTagGroup(tgt, { 'kt PB': 24617, 'kt MS': 999 })

    updateFrom(tgt.drawing_area, src.drawing_area, ['attrDrawingArea', 'scale'])

    const tagg = tgt.drawing_area.sankey._data_taggs['unite']
    expect(tagg.tags_dict['kt PB'].scale).toBe(8000)
    expect(tagg.tags_dict['kt MS'].scale).toBe(999)
  })
})

// Groupe de données « Année » avec deux tags dont on CHOISIT les ids : c'est
// l'écart d'ids entre source et cible (à noms égaux) qui met `matching_tags_id`
// en jeu.
function makeYearTagGroup(
  app: Class_ApplicationData,
  tags: Array<[string, string]> // [id, nom]
) {
  const tagg = app.drawing_area.sankey.addDataTagGroup('annee', 'Année', false)
  tags.forEach(([id, name]) => tagg.addTag(name, id))
  tagg.tags_dict[tags[0][0]].setSelected()
  return tagg
}

/** Valeur du lien sous le tag de nom `tag_name` du groupe « annee » de `app`. */
function valueUnderYear(
  app: Class_ApplicationData,
  link: Class_LinkElement,
  tag_name: string
) {
  const tagg = app.drawing_area.sankey._data_taggs['annee']
  const tag = tagg.tags_list.find(t => t.name === tag_name)
  if (!tag) return undefined
  tagg.selectTagsFromIds([tag.id])
  return link.valueCurrent
}

describe('updateFrom — tags de données appariés par NOM mais d\'ids différents', () => {
  it('tagData : les valeurs taguées de la cible survivent à la recopie du groupe', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    const s = makePair(src)
    const t = makePair(tgt)

    // Mêmes noms de tags des deux côtés, ids différents → matching par nom.
    makeYearTagGroup(src, [['src_a', '2020'], ['src_b', '2021']])
    const tgt_tagg = makeYearTagGroup(tgt, [['tgt_a', '2020'], ['tgt_b', '2021']])

    // Valeurs portées par le lien de la CIBLE, une par millésime.
    tgt_tagg.selectTagsFromIds(['tgt_a'])
    t.link.valueCurrent = 10
    tgt_tagg.selectTagsFromIds(['tgt_b'])
    t.link.valueCurrent = 20
    // Côté source, valeurs différentes — `tagData` ne recopie PAS les valeurs.
    const src_tagg = src.drawing_area.sankey._data_taggs['annee']
    src_tagg.selectTagsFromIds(['src_a'])
    s.link.valueCurrent = 111
    src_tagg.selectTagsFromIds(['src_b'])
    s.link.valueCurrent = 222

    updateFrom(tgt.drawing_area, src.drawing_area, ['tagData'])

    expect(valueUnderYear(tgt, t.link, '2020')).toBe(10)
    expect(valueUnderYear(tgt, t.link, '2021')).toBe(20)
  })

  it('tagData : le groupe cible ne conserve QUE ses deux tags', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    makePair(src)
    makePair(tgt)

    makeYearTagGroup(src, [['src_a', '2020'], ['src_b', '2021']])
    makeYearTagGroup(tgt, [['tgt_a', '2020'], ['tgt_b', '2021']])

    updateFrom(tgt.drawing_area, src.drawing_area, ['tagData'])

    const tagg = tgt.drawing_area.sankey._data_taggs['annee']
    expect(tagg.tags_list.map(t => t.name)).toEqual(['2020', '2021'])
    // Aucun tag fantôme laissé dans le dictionnaire hors de l'ordre affiché.
    expect(Object.keys(tagg.tags_dict).sort()).toEqual(['tgt_a', 'tgt_b'])
  })
})

describe('#232 updateFrom — non-régression (attribut hors mode préservé)', () => {
  it('un mode inconnu / vide ne modifie ni positions ni attributs', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    const s = makePair(src)
    const t = makePair(tgt)

    s.A.position_x = 111
    s.A.shape_opacity = 0.11
    t.A.position_x = 222
    t.A.shape_opacity = 0.88

    // Aucun mode reconnu => aucun transfert de nœud/lien.
    updateFrom(tgt.drawing_area, src.drawing_area, ['modeInexistant'])

    expect(t.A.position_x).toBe(222)
    expect(t.A.shape_opacity).toBe(0.88)
  })
})

describe('#232 updateFrom — cas limites', () => {
  it('source et cible vides : aucune exception', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    expect(() => updateFrom(tgt.drawing_area, src.drawing_area, ['*'])).not.toThrow()
  })

  it('source vide, cible peuplée : cible inchangée sur posNode/attrNode', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    const t = makePair(tgt)
    t.A.position_x = 321
    t.A.shape_opacity = 0.44

    updateFrom(tgt.drawing_area, src.drawing_area, ['posNode', 'attrNode'])

    expect(tgt.drawing_area.sankey.nodes_list.length).toBe(2)
    expect(t.A.position_x).toBe(321)
    expect(t.A.shape_opacity).toBe(0.44)
  })

  it('nœud présent seulement dans la source : NON ajouté sans le mode addNode', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    makePair(src)
    src.drawing_area.sankey.addNewNode('C', 'C') // uniquement côté source
    makePair(tgt)

    updateFrom(tgt.drawing_area, src.drawing_area, ['attrNode', 'posNode'])

    expect(tgt.drawing_area.sankey.nodes_dict['C']).toBeUndefined()
  })

  it('nœud présent seulement dans la source : ajouté avec le mode addNode', () => {
    const src = new Class_ApplicationData(false)
    const tgt = new Class_ApplicationData(false)
    makePair(src)
    src.drawing_area.sankey.addNewNode('C', 'C') // uniquement côté source
    makePair(tgt)

    updateFrom(tgt.drawing_area, src.drawing_area, ['addNode'])

    expect(tgt.drawing_area.sankey.nodes_dict['C']).toBeDefined()
    expect(tgt.drawing_area.sankey.nodes_dict['C'].name).toBe('C')
  })
})
