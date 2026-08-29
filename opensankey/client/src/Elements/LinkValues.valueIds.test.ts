import { Class_ElementValue, Class_LinkValue, Class_StockValue } from './LinkValues'
import { Class_FluxTagGroup } from '../types/TagGroup'
import type { Type_JSON } from '../types/Utils'
import type { Class_LinkElement } from './Link'
import type { Class_NodeElement } from './Node'
import type { Class_Sankey } from '../types/Sankey'

// OS#1367 — l'identifiant d'une valeur de flux (ou de stock) n'est plus écrit
// dans le JSON.
//
// Ce que cet identifiant est vraiment : une clé de dictionnaire fabriquée au
// CONSTRUCTEUR par makeId(), avec un suffixe aléatoire. Il n'indexe que des
// structures de session (le dictionnaire rendu par getAllValues, le registre
// Class_Tag._references) et rien dans le fichier ne le référence. La coordonnée
// d'une valeur, c'est son flux et ses tags — sa position dans la structure.
//
// Ces tests figent les deux moitiés du contrat : on n'écrit plus l'id, mais on
// continue de le LIRE, pour qu'un fichier ancien se recharge à l'identique.

function makeEnv() {
  const flux_taggs_dict: { [_: string]: Class_FluxTagGroup } = {}
  const sankey = {
    fluxTagsUpdated: () => { /* no-op */ },
    dataTagsUpdated: () => { /* no-op */ },
    drawing_area: { legend: { draw: () => { /* no-op */ } } },
    get flux_taggs_dict() { return flux_taggs_dict },
    get flux_taggs_list() { return Object.values(flux_taggs_dict) },
  } as unknown as Class_Sankey
  const link = {
    id: 'l1',
    source: {},
    target: {},
    draw: () => { /* no-op */ },
    drawing_area: { sankey },
  } as unknown as Class_LinkElement
  const node = {
    id: 'n1',
    draw: () => { /* no-op */ },
    drawing_area: { sankey },
  } as unknown as Class_NodeElement
  const makeFluxGroup = (id: string, tags: Array<[string, string]>) => {
    const group = new Class_FluxTagGroup(id, id, sankey, false)
    tags.forEach(([tag_id, tag_name]) => group.addTag(tag_name, tag_id))
    flux_taggs_dict[id] = group
    return group
  }
  return { sankey, link, node, makeFluxGroup }
}

describe('OS#1367 — un enregistrement neuf ne porte plus les ids de valeurs', () => {

  it('a plain element value writes no id', () => {
    const env = makeEnv()
    const value = new Class_ElementValue(env.link)
    expect(value.id).not.toBe('')
    expect(value.toJSON()).not.toHaveProperty('id')
  })

  it('an element value with flux tags writes its tags but no id', () => {
    const env = makeEnv()
    const matiere = env.makeFluxGroup('matiere', [['acier', 'Acier']])
    const value = new Class_ElementValue(env.link)
    value.addTag(matiere.tags_dict['acier'])

    const json = value.toJSON()
    expect(json).not.toHaveProperty('id')
    expect(json['tags']).toEqual({ matiere: ['acier'] })
  })

  it('a link value writes its numbers but no id', () => {
    const env = makeEnv()
    const value = new Class_LinkValue(env.link)
    value.valueData = 42
    value.result_min = 1
    value.result_max = 7

    const json = value.toJSON()
    expect(json).not.toHaveProperty('id')
    expect(json['data_value']).toBe(42)
    expect(json['result_min']).toBe(1)
    expect(json['result_max']).toBe(7)
  })

  it('a stock value writes its numbers but no id', () => {
    const env = makeEnv()
    const value = new Class_StockValue(env.node)
    value.stockInitialData = 10
    value.stockVariationData = -3

    const json = value.toJSON()
    expect(json).not.toHaveProperty('id')
    expect(json['initial_stock']).toBe(10)
    expect(json['stock_variation']).toBe(-3)
  })

  it('a sub-value writes its amount and tags but no id', () => {
    const env = makeEnv()
    const matiere = env.makeFluxGroup('matiere', [['acier', 'Acier']])
    const value = new Class_ElementValue(env.link)
    const sub = value.addTaggedValue()
    sub.value = 6
    sub.addTag(matiere.tags_dict['acier'])

    const json = value.toJSON()
    expect(json['tagged_values']).toEqual([{ value: 6, tags: { matiere: 'acier' } }])
  })
})

describe('OS#1367 — la lecture reste tolérante aux fichiers anciens', () => {

  it('an old link value carrying an id reloads without loss', () => {
    const env = makeEnv()
    const matiere = env.makeFluxGroup('matiere', [['acier', 'Acier']])
    // Tel qu'un fichier enregistré AVANT ce lot le porte
    const legacy_json = {
      id: 'sourcecible_value__wA9x4',
      tags: { matiere: ['acier'] },
      data_value: 12.5,
      result_value: 13,
    }
    const value = new Class_LinkValue(env.link)
    value.fromJSON(legacy_json)

    // L'id du fichier est adopté tel quel — comportement inchangé
    expect(value.id).toBe('sourcecible_value__wA9x4')
    expect(value.valueData).toBe(12.5)
    expect(value.valueResult).toBe(13)
    expect(value.flux_tags_list.map(tag => tag.id)).toEqual(['acier'])
    expect(matiere.tags_dict['acier'].references).toHaveLength(1)
  })

  it('an old sub-value carrying an id reloads without loss', () => {
    const env = makeEnv()
    env.makeFluxGroup('matiere', [['acier', 'Acier']])
    const legacy_json = {
      id: 'sourcecible_value__wA9x4',
      tagged_values: [
        { id: 'sourcecible_value__wA9x4_sub_kk12z', value: 6, tags: { matiere: 'acier' } },
      ],
    } as unknown as Type_JSON
    const value = new Class_ElementValue(env.link)
    value.fromJSON(legacy_json)

    expect(value.tagged_values_list).toHaveLength(1)
    const sub = value.tagged_values_list[0]
    expect(sub.id).toBe('sourcecible_value__wA9x4_sub_kk12z')
    expect(sub.value).toBe(6)
    expect(sub.tags_list.map(tag => tag.id)).toEqual(['acier'])
  })

  it('a value without any id in the JSON keeps the one built by its constructor', () => {
    const env = makeEnv()
    const value = new Class_LinkValue(env.link)
    const built_id = value.id
    value.fromJSON({ data_value: 3 })

    expect(value.id).toBe(built_id)
    expect(value.valueData).toBe(3)
  })
})

describe('OS#1367 — un aller-retour JSON rend une valeur équivalente', () => {

  /** Recharge un JSON de valeur dans un document NEUF, comme un vrai load. */
  function reload(json: Type_JSON) {
    const env2 = makeEnv()
    env2.makeFluxGroup('matiere', [['acier', 'Acier'], ['cuivre', 'Cuivre']])
    env2.makeFluxGroup('transport', [['route', 'Route'], ['rail', 'Rail']])
    const value = new Class_LinkValue(env2.link)
    value.fromJSON(json)
    return value
  }

  function makeSource() {
    const env = makeEnv()
    const matiere = env.makeFluxGroup('matiere', [['acier', 'Acier'], ['cuivre', 'Cuivre']])
    const transport = env.makeFluxGroup('transport', [['route', 'Route'], ['rail', 'Rail']])
    const value = new Class_LinkValue(env.link)
    value.valueData = 10
    value.data_min = 2
    value.data_max = 20
    value.text_value = 'dix'
    const s1 = value.addTaggedValue()
    s1.value = 6
    s1.addTag(matiere.tags_dict['acier'])
    s1.addTag(transport.tags_dict['route'])
    const s2 = value.addTaggedValue()
    s2.value = 4
    s2.label_visible = true
    s2.addTag(matiere.tags_dict['cuivre'])
    s2.addTag(transport.tags_dict['rail'])
    return value
  }

  it('values, tags and sub-values survive the round trip', () => {
    const json = makeSource().toJSON()
    const reloaded = reload(json)

    expect(reloaded.valueData).toBe(10)
    expect(reloaded.data_min).toBe(2)
    expect(reloaded.data_max).toBe(20)
    expect(reloaded.text_value).toBe('dix')
    expect(reloaded.tagged_values_list).toHaveLength(2)
    expect(reloaded.tagged_values_list.map(sub => sub.value)).toEqual([6, 4])
    expect(reloaded.tagged_values_list.map(sub => sub.label_visible)).toEqual([false, true])
    expect(reloaded.tagged_values_list.map(sub => sub.tags_list.map(tag => tag.id).sort()))
      .toEqual([['acier', 'route'], ['cuivre', 'rail']])
  })

  it('the round trip is a fixed point: re-serializing gives the very same JSON', () => {
    const json_1 = makeSource().toJSON()
    const json_2 = reload(json_1).toJSON()
    expect(json_2).toEqual(json_1)
  })

  it('two sub-values sharing the same tags stay distinguished by their position', () => {
    const env = makeEnv()
    const matiere = env.makeFluxGroup('matiere', [['acier', 'Acier'], ['cuivre', 'Cuivre']])
    env.makeFluxGroup('transport', [['route', 'Route'], ['rail', 'Rail']])
    const value = new Class_LinkValue(env.link)
    const first = value.addTaggedValue()
    first.value = 7
    first.addTag(matiere.tags_dict['acier'])
    const second = value.addTaggedValue()
    second.value = 9
    second.addTag(matiere.tags_dict['acier'])

    const reloaded = reload(value.toJSON())
    expect(reloaded.tagged_values_list.map(sub => sub.value)).toEqual([7, 9])
    // Deux ids frais et DISTINCTS : la clé de session est reforgée au chargement
    const ids = reloaded.tagged_values_list.map(sub => sub.id)
    expect(new Set(ids).size).toBe(2)
  })

  it('reloading forges fresh ids that keep tag references separate', () => {
    const env = makeEnv()
    const matiere = env.makeFluxGroup('matiere', [['acier', 'Acier'], ['cuivre', 'Cuivre']])
    const a = new Class_LinkValue(env.link)
    a.addTag(matiere.tags_dict['acier'])
    const b = new Class_LinkValue(env.link)
    b.addTag(matiere.tags_dict['acier'])

    expect(a.id).not.toBe(b.id)
    expect(matiere.tags_dict['acier'].references).toHaveLength(2)
  })
})
