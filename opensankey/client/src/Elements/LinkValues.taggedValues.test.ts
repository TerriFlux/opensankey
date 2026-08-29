import { Class_ElementValue } from './LinkValues'
import { Class_FluxTagGroup, Class_DataTagGroup } from '../types/TagGroup'
import type { Class_LinkElement } from './Link'
import type { Class_Sankey } from '../types/Sankey'

// #284 — sous-valeurs à coordonnée éparse (NOTE-FUSION-TAGS.md §3.0).
// Harnais minimal : un faux lien (détecté par duck-typing source/target) relié
// à un faux sankey exposant flux_taggs_dict pour la désérialisation.

// Un « environnement » = un sankey avec son registre de groupes et un lien,
// comme un document chargé. Le roundtrip JSON se rejoue dans un environnement
// NEUF (mêmes ids de groupes/tags, instances fraîches), comme un vrai load —
// le registre de références des tags est keyé par id, recharger sur les mêmes
// instances collisionnerait.
function makeEnv() {
  const flux_taggs_dict: { [_: string]: Class_FluxTagGroup } = {}
  const sankey = {
    fluxTagsUpdated: () => { /* no-op */ },
    dataTagsUpdated: () => { /* no-op */ },
    drawing_area: { legend: { draw: () => { /* no-op */ } } },
    get flux_taggs_dict() { return flux_taggs_dict },
  } as unknown as Class_Sankey
  const link = {
    id: 'l1',
    source: {},
    target: {},
    draw: () => { /* no-op */ },
    drawing_area: { sankey },
  } as unknown as Class_LinkElement
  const makeFluxGroup = (id: string, tags: Array<[string, string]>) => {
    const group = new Class_FluxTagGroup(id, id, sankey, false)
    tags.forEach(([tag_id, tag_name]) => group.addTag(tag_name, tag_id))
    flux_taggs_dict[id] = group
    return group
  }
  return { sankey, link, makeFluxGroup }
}

const default_env = makeEnv()
const fakeSankey = default_env.sankey
const fakeLink = default_env.link
const makeFluxGroup = default_env.makeFluxGroup

describe('is_dimension — concept unifié des groupes de tags de flux', () => {
  it('is false on Class_FluxTagGroup and true on Class_DataTagGroup', () => {
    const flux_group = new Class_FluxTagGroup('g', 'G', fakeSankey, false)
    const data_group = new Class_DataTagGroup('d', 'D', fakeSankey, false)
    expect(flux_group.is_dimension).toBe(false)
    expect(data_group.is_dimension).toBe(true)
  })
})

describe('Class_ElementTaggedValue — coordonnée éparse', () => {
  it('holds at most one tag per group (same-group add replaces)', () => {
    const matiere = makeFluxGroup('matiere', [['acier', 'Acier'], ['cuivre', 'Cuivre']])
    const transport = makeFluxGroup('transport', [['route', 'Route'], ['rail', 'Rail']])
    const value = new Class_ElementValue(fakeLink)

    const sub = value.addTaggedValue()
    sub.value = 6
    sub.addTag(matiere.tags_dict['acier'])
    sub.addTag(transport.tags_dict['route'])
    expect(sub.tags_list.map(t => t.id).sort()).toEqual(['acier', 'route'])

    // Même groupe → remplace ; autre groupe → coexiste
    sub.addTag(matiere.tags_dict['cuivre'])
    expect(sub.tags_list.map(t => t.id).sort()).toEqual(['cuivre', 'route'])
    expect(sub.getTagForGroup(matiere)?.id).toBe('cuivre')
    expect(sub.getTagForGroup(transport)?.id).toBe('route')
  })

  it('several sub-values on the same value can carry different coordinates', () => {
    const matiere = makeFluxGroup('matiere2', [['acier', 'Acier'], ['cuivre', 'Cuivre']])
    const value = new Class_ElementValue(fakeLink)

    const sub1 = value.addTaggedValue()
    sub1.value = 6
    sub1.addTag(matiere.tags_dict['acier'])
    const sub2 = value.addTaggedValue()
    sub2.value = 4
    sub2.addTag(matiere.tags_dict['cuivre'])

    expect(value.tagged_values_list).toHaveLength(2)
    expect(value.tagged_values_list.map(s => s.value)).toEqual([6, 4])
  })

  it('serializes and deserializes through value JSON', () => {
    const matiere = makeFluxGroup('matiere3', [['acier', 'Acier']])
    const transport = makeFluxGroup('transport3', [['rail', 'Rail']])
    const value = new Class_ElementValue(fakeLink)
    const sub = value.addTaggedValue('sub_a')
    sub.value = 6
    sub.addTag(matiere.tags_dict['acier'])
    sub.addTag(transport.tags_dict['rail'])

    // OS#1367 — l'id de la sous-valeur n'est plus sérialisé : ce qui la
    // désigne dans le fichier, c'est sa POSITION dans le tableau.
    const json = value.toJSON()
    expect(json['tagged_values']).toEqual([
      { value: 6, tags: { matiere3: 'acier', transport3: 'rail' } },
    ])

    // Rechargement dans un document neuf (mêmes ids de tags, instances fraîches)
    const env2 = makeEnv()
    env2.makeFluxGroup('matiere3', [['acier', 'Acier']])
    env2.makeFluxGroup('transport3', [['rail', 'Rail']])
    const reloaded = new Class_ElementValue(env2.link)
    reloaded.fromJSON(json)
    expect(reloaded.tagged_values_list).toHaveLength(1)
    const rsub = reloaded.tagged_values_list[0]
    expect(rsub.value).toBe(6)
    expect(rsub.tags_list.map(t => t.id).sort()).toEqual(['acier', 'rail'])
  })

  it('tag deletion detaches it from sub-values', () => {
    const matiere = makeFluxGroup('matiere4', [['acier', 'Acier'], ['cuivre', 'Cuivre']])
    const value = new Class_ElementValue(fakeLink)
    const sub = value.addTaggedValue()
    sub.addTag(matiere.tags_dict['acier'])
    sub.addTag(matiere.tags_dict['cuivre']) // remplace acier

    const cuivre = matiere.tags_dict['cuivre']
    cuivre.delete()
    expect(sub.tags_list).toHaveLength(0)
  })

  it('value deletion / copyFrom keep tag references consistent', () => {
    const matiere = makeFluxGroup('matiere5', [['acier', 'Acier']])
    const acier = matiere.tags_dict['acier']
    const value = new Class_ElementValue(fakeLink)
    const sub = value.addTaggedValue()
    sub.value = 3
    sub.addTag(acier)

    const copy = new Class_ElementValue(fakeLink)
    copy.copyFrom(value)
    expect(copy.tagged_values_list).toHaveLength(1)
    expect(copy.tagged_values_list[0].value).toBe(3)
    expect(copy.tagged_values_list[0].tags_list.map(t => t.id)).toEqual(['acier'])

    // La suppression de la valeur d'origine détache SES sous-valeurs du tag,
    // sans toucher celles de la copie.
    value.delete()
    expect(value.tagged_values_list).toHaveLength(0)
    expect(copy.tagged_values_list[0].tags_list.map(t => t.id)).toEqual(['acier'])
    expect(acier.references).toHaveLength(1)
  })
})
