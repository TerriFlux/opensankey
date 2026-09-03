import { Class_NodeTagGroup } from './TagGroup'
import type { Class_Sankey } from './Sankey'
import type { Type_JSON } from './Utils'

/**
 * #486 — les séparateurs de la feuille Etiquettes (« : » entre étiquettes d'un
 * groupe, « / » entre groupes antagonistes) sont désormais choisis par
 * l'utilisateur, groupe par groupe. Le front ne s'en sert pas pour afficher :
 * il les PORTE, pour que l'export Excel réécrive la feuille avec les mêmes.
 * Sans ce transport, un simple aller-retour par l'application réécrirait
 * « m3 / kt produit » avec « / » comme séparateur, et le classeur casserait à
 * la relecture suivante.
 */

const fakeSankey = {
  nodeTagsUpdated: () => { /* no-op */ },
  drawing_area: {
    legend: { draw: () => { /* no-op */ } },
    application_data: { language: 'fr' },
  },
} as unknown as Class_Sankey

function makeGroup(id: string, name: string): Class_NodeTagGroup {
  return new Class_NodeTagGroup(id, name, fakeSankey, false)
}

function jsonWithTags(name: string, extra: Type_JSON = {}): Type_JSON {
  return {
    name,
    banner: 'multi',
    tags: { t0: { name: 'A' } },
    ...extra,
  } as Type_JSON
}

describe('#486 Class_ProtoTagGroup — séparateurs Excel', () => {

  it('retombe sur les défauts du format quand rien n\'est déclaré', () => {
    const group = makeGroup('g', 'G')
    expect(group.tags_separator).toBe(':')
    expect(group.antagonists_separator).toBe('/')
  })

  it('n\'écrit aucune clé quand les défauts s\'appliquent', () => {
    // Un diagramme muet doit produire exactement le même JSON qu'avant : sinon
    // tous les fichiers existants seraient réécrits pour rien.
    const group = makeGroup('g', 'G')
    const json = group.toJSON()
    expect(json['tags_separator']).toBeUndefined()
    expect(json['antagonists_separator']).toBeUndefined()
  })

  it('écrit puis relit les séparateurs déclarés', () => {
    const group = makeGroup('g', 'G')
    group.tags_separator = ';'
    group.antagonists_separator = '||'
    const json = group.toJSON()
    expect(json['tags_separator']).toBe(';')
    expect(json['antagonists_separator']).toBe('||')

    const reloaded = makeGroup('g', 'G')
    reloaded.fromJSON(jsonWithTags('G', {
      tags_separator: ';',
      antagonists_separator: '||',
    }))
    expect(reloaded.tags_separator).toBe(';')
    expect(reloaded.antagonists_separator).toBe('||')
  })

  it('un fichier antérieur (clés absentes) garde les défauts', () => {
    const group = makeGroup('g', 'G')
    group.fromJSON(jsonWithTags('G'))
    expect(group.tags_separator).toBe(':')
    expect(group.antagonists_separator).toBe('/')
    // et il ressort muet : la relecture n'a pas figé les défauts dans le fichier
    expect(group.toJSON()['tags_separator']).toBeUndefined()
  })

  it('vider un séparateur revient au défaut, sans figer une chaîne vide', () => {
    // Une chaîne vide comme séparateur ferait éclater chaque libellé caractère
    // par caractère à la relecture.
    const group = makeGroup('g', 'G')
    group.tags_separator = ';'
    group.tags_separator = ''
    expect(group.tags_separator).toBe(':')
    expect(group.toJSON()['tags_separator']).toBeUndefined()
  })

  it('les séparateurs suivent le groupe lors d\'une copie', () => {
    // updateFrom / duplication : sans report, le prochain export Excel
    // casserait les libellés contenant « / ».
    const source = makeGroup('src', 'G')
    source.tags_separator = ';'
    source.antagonists_separator = '||'
    const target = makeGroup('dst', 'G')

    target.copyFrom(source, {})

    expect(target.tags_separator).toBe(';')
    expect(target.antagonists_separator).toBe('||')
  })
})
