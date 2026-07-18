import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTag, Class_Tag } from './Tag'

// #285 — bascule dimension→annotation SANS PERTE (NOTE-FUSION-TAGS.md §3.3) :
// les feuilles par tag deviennent des sous-valeurs coordonnées, la feuille
// fusionnée porte la somme, le groupe devient un groupe d'étiquettes libres.

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

function makeApp() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const source = sankey.addNewNodeWithName('Source')
  const target = sankey.addNewNodeWithName('Target')
  const link = sankey.addNewLink(source, target)
  return { app, sankey, link }
}

describe('convertDataTagGroupToFluxTagGroup — dimension → annotation', () => {
  it('turns per-tag leaves into coordinated values, main value = selected slice', () => {
    const { sankey, link } = makeApp()
    const annee = sankey.addDataTagGroup('annee', 'Année', false)
    const t2020 = annee.addTag('2020', 't2020') as Class_DataTag
    const t2021 = annee.addTag('2021', 't2021') as Class_DataTag
    // Tranche sélectionnée ≠ première : exerce le placement de la tranche
    // sélectionnée en tête (celle que prune conserve)
    t2021.setSelected()

    // Une valeur par tranche
    link.valueForTag(t2020)!.valueData = 10
    link.valueForTag(t2021)!.valueData = 12

    const flux_tagg = sankey.convertDataTagGroupToFluxTagGroup(annee)

    // Le groupe dimension a disparu, le groupe libre miroir existe
    expect(sankey.data_taggs_list).toHaveLength(0)
    expect(sankey.flux_taggs_dict['annee']).toBe(flux_tagg)
    expect(flux_tagg.is_dimension).toBe(false)
    expect(flux_tagg.tags_list.map(t => t.id)).toEqual(['t2020', 't2021'])

    // Valeur principale = tranche SÉLECTIONNÉE (pas de somme — valeurs non
    // additives) ; les deux tranches deviennent des valeurs coordonnées
    const value = link.value
    expect(value).not.toBeNull()
    expect(link.valueCurrent).toBe(12)
    const subs = value!.tagged_values_list
    expect(subs).toHaveLength(2)
    const by_tag = (id: string) => subs.find(s => s.tags_list.some(t => t.id === id))
    expect(by_tag('t2020')?.value).toBe(10)
    expect(by_tag('t2021')?.value).toBe(12)

    // Rubans resynchronisés (groupe créé en bannière multi par défaut)
    expect(Object.values(link.child_links)).toHaveLength(2)
  })

  it('lifts pre-existing sub-values with the slice coordinate', () => {
    const { sankey, link } = makeApp()
    const matiere = sankey.addFluxTagGroup('matiere', 'Matière', false)
    const acier = matiere.addTag('Acier', 'acier') as Class_Tag
    const annee = sankey.addDataTagGroup('annee', 'Année', false)
    const t2020 = annee.addTag('2020', 't2020') as Class_DataTag
    const t2021 = annee.addTag('2021', 't2021') as Class_DataTag
    t2020.setSelected()

    // 2020 : détail en sous-valeur ; 2021 : valeur simple
    const leaf_2020 = link.valueForTag(t2020)!
    leaf_2020.valueData = 10
    const sub = leaf_2020.addTaggedValue()
    sub.value = 4
    sub.addTag(acier)
    link.valueForTag(t2021)!.valueData = 12

    sankey.convertDataTagGroupToFluxTagGroup(annee)

    const subs = link.value!.tagged_values_list
    expect(subs).toHaveLength(2)
    // La sous-valeur de 2020 a reçu la coordonnée t2020 EN PLUS de acier
    const lifted = subs.find(s => s.tags_list.some(t => t.id === 'acier'))
    expect(lifted).toBeDefined()
    expect(lifted!.value).toBe(4)
    expect(lifted!.tags_list.map(t => t.id).sort()).toEqual(['acier', 't2020'])
    // La tranche 2021 sans détail devient une sous-valeur simple
    const simple = subs.find(s => !s.tags_list.some(t => t.id === 'acier'))
    expect(simple!.value).toBe(12)
    expect(simple!.tags_list.map(t => t.id)).toEqual(['t2021'])
  })

  it('collapses only the targeted level in a two-group tree', () => {
    const { sankey, link } = makeApp()
    const annee = sankey.addDataTagGroup('annee', 'Année', false)
    const t2020 = annee.addTag('2020', 't2020') as Class_DataTag
    const t2021 = annee.addTag('2021', 't2021') as Class_DataTag
    const region = sankey.addDataTagGroup('region', 'Région', false)
    const nord = region.addTag('Nord', 'nord') as Class_DataTag
    const sud = region.addTag('Sud', 'sud') as Class_DataTag
    t2020.setSelected()
    nord.setSelected()

    link.valueForTags([t2020, nord])!.valueData = 1
    link.valueForTags([t2020, sud])!.valueData = 2
    link.valueForTags([t2021, nord])!.valueData = 3
    link.valueForTags([t2021, sud])!.valueData = 4

    sankey.convertDataTagGroupToFluxTagGroup(annee)

    // La dimension région subsiste
    expect(sankey.data_taggs_list.map(g => g.id)).toEqual(['region'])
    // Nord : valeur principale = tranche sélectionnée (2020 → 1), les deux
    // tranches en valeurs coordonnées
    const leaf_nord = link.valueForTag(nord)!
    expect(leaf_nord.valueData).toBe(1)
    expect(leaf_nord.tagged_values_list.map(s => s.value).sort()).toEqual([1, 3])
    // Sud : 2020 → 2
    const leaf_sud = link.valueForTag(sud)!
    expect(leaf_sud.valueData).toBe(2)
    expect(leaf_sud.tagged_values_list.map(s => s.value).sort()).toEqual([2, 4])
  })
})
