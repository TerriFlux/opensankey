import { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import { Class_ElementValueTree, Class_LinkValue } from './LinkValues'
import type { Type_JSON } from '../types/Utils'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// os#1528 — l arbre de valeurs d un flux ne se construit qu a la lecture. Un cube de 10 x 10 x 10
// membres ne doit pas fabriquer 1 000 feuilles a la creation du flux, ni a la lecture d un fichier
// qui n en remplit que quelques-unes ; lire une coordonnee ne construit que son chemin.

function monter() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const groups = ['a', 'b', 'c'].map(g => {
    const group = sankey.addDataTagGroup(g, g.toUpperCase(), false) as Class_DataTagGroup
    for (let i = 0; i < 10; i++) group.addTag(`${g}${i}`, `${g}${i}`)
    return group
  })
  const n1 = sankey.addNewNodeWithName('N1')
  const n2 = sankey.addNewNodeWithName('N2')
  const link = sankey.addNewLink(n1, n2)
  return { app, sankey, groups, link }
}

const valuesOf = (link: unknown) => (link as { _values: Class_ElementValueTree })._values

const builtLeaves = (node: Class_ElementValueTree | Class_LinkValue): number => {
  if (node instanceof Class_LinkValue) return 1
  if (!node.is_built) return 0
  return Object.values(node.children).reduce((n: number, child) => n + builtLeaves(child as Class_ElementValueTree | Class_LinkValue), 0)
}

const tagOf = (group: Class_DataTagGroup, id: string) => group.tags_dict[id] as Class_DataTag

describe('os#1528 arbre de valeurs construit a la demande', () => {
  test('un flux neuf sur trois dimensions ne construit pas son cube', () => {
    const { link } = monter()
    const root = valuesOf(link)
    expect(root).toBeInstanceOf(Class_ElementValueTree)
    expect(builtLeaves(root)).toBeLessThan(1000)
    expect(root.has_data).toBe(false)
  })

  test('lire une coordonnee ne construit que son chemin, et la valeur est la bonne', () => {
    const { link, groups } = monter()
    const root = valuesOf(link)
    const json: Type_JSON = {
      datatag_group: 'a',
      a3: { datatag_group: 'b', b7: { datatag_group: 'c', c1: { data_value: 42 } } }
    }
    root.fromJSON(json)
    expect(builtLeaves(root)).toBe(0)
    const value = root.getValueForDataTags([tagOf(groups[0], 'a3'), tagOf(groups[1], 'b7'), tagOf(groups[2], 'c1')])
    expect((value as Class_LinkValue).valueData).toBe(42)
    // Un seul chemin construit : une branche de 10 feuilles, pas le cube.
    expect(builtLeaves(root)).toBe(10)
    const other = root.getValueForDataTags([tagOf(groups[0], 'a0'), tagOf(groups[1], 'b0'), tagOf(groups[2], 'c0')])
    expect((other as Class_LinkValue).valueData).toBeNull()
  })

  test('un aller-retour JSON garde les donnees et n ecrit pas les branches vierges', () => {
    const { link } = monter()
    const root = valuesOf(link)
    root.fromJSON({
      datatag_group: 'a',
      a3: { datatag_group: 'b', b7: { datatag_group: 'c', c1: { data_value: 42 } } }
    })
    expect(root.has_data).toBe(true)
    const out = root.toJSON() as { [k: string]: Type_JSON }
    const a3 = out['a3'] as { [k: string]: Type_JSON }
    expect((a3['b7'] as { [k: string]: Type_JSON })['c1']).toEqual({ data_value: 42 })
    // Une branche jamais ouverte n ecrit que les etiquettes que son JSON cite.
    expect(out['a0']).toBeUndefined()
  })

  test('enregistrer une branche lue ne la construit pas', () => {
    // SOCLE synthetiques transfo : 8 flux de 680 000 cases. Construire pour tester has_result
    // puis pour ecrire, c etait reconstruire le cube a chaque enregistrement (out of memory).
    const { link } = monter()
    const root = valuesOf(link)
    root.fromJSON({
      datatag_group: 'a',
      a3: { datatag_group: 'b', b7: { datatag_group: 'c', c1: { data_value: 42, result_value: 40 }, c2: {} } },
      a4: { datatag_group: 'b', b0: { datatag_group: 'c', c9: { data_min: 1, data_max: 3 } } }
    })
    expect(root.has_data).toBe(true)
    expect(root.has_result).toBe(true)
    expect(root.has_collected_data).toBe(true)
    expect(root.has_intervals).toBe(false)
    const out = root.toJSON()
    expect(builtLeaves(root)).toBe(0)
    expect(out).toEqual({
      datatag_group: 'a',
      a3: { datatag_group: 'b', b7: { datatag_group: 'c', c1: { data_value: 42, result_value: 40 }, c2: {} } },
      a4: { datatag_group: 'b', b0: { datatag_group: 'c', c9: { data_min: 1, data_max: 3 } } }
    })
  })

  test('point fixe : relire puis reecrire donne le meme texte, branche ouverte ou non', () => {
    const json: Type_JSON = {
      datatag_group: 'a',
      a3: { datatag_group: 'b', b7: { datatag_group: 'c', c1: { data_value: 42 } } },
      a4: { datatag_group: 'b', b0: { datatag_group: 'c', c9: { data_value: 5, id: 'ancien' } } }
    }
    const ecrire = (source: Type_JSON, ouvrir: boolean) => {
      const { link, groups } = monter()
      const root = valuesOf(link)
      root.fromJSON(JSON.parse(JSON.stringify(source)) as Type_JSON)
      // Le dessin ouvre le chemin des membres choisis : une branche construite, les autres non.
      if (ouvrir) root.getValueForDataTags([tagOf(groups[0], 'a3'), tagOf(groups[1], 'b7'), tagOf(groups[2], 'c1')])
      return JSON.stringify(root.toJSON())
    }
    for (const ouvrir of [false, true]) {
      const j1 = ecrire(json, ouvrir)
      // L id d un fichier ancien ne se reecrit pas (OS#1367) : le texte est celui de la valeur.
      expect(j1).not.toContain('ancien')
      const j2 = ecrire(JSON.parse(j1) as Type_JSON, ouvrir)
      expect(j2).toBe(j1)
    }
  })

  test('ecrire une valeur la retrouve, et l arbre construit reste coherent', () => {
    const { link, groups } = monter()
    const root = valuesOf(link)
    const tags = [tagOf(groups[0], 'a5'), tagOf(groups[1], 'b5'), tagOf(groups[2], 'c5')]
    const leaf = root.getValueForDataTags(tags) as Class_LinkValue
    leaf.valueData = 7
    expect((root.getValueForDataTags(tags) as Class_LinkValue).valueData).toBe(7)
    expect(root.has_data).toBe(true)
    expect(root.getMaxValue()).toBe(7)
  })

  test('absence structurelle (#188) retenue puis appliquee a la construction', () => {
    const { link, groups } = monter()
    const root = valuesOf(link)
    root.fromJSON({ datatag_group: 'a', a1: { datatag_group: 'b', b1: { datatag_group: 'c', c1: { data_value: 1 } } } }, {}, {}, true)
    expect(root.getStructurallyAbsentForDataTags([tagOf(groups[0], 'a2'), tagOf(groups[1], 'b1'), tagOf(groups[2], 'c1')])).toBe(true)
    expect(root.getStructurallyAbsentForDataTags([tagOf(groups[0], 'a1'), tagOf(groups[1], 'b1'), tagOf(groups[2], 'c1')])).toBe(false)
  })
})
