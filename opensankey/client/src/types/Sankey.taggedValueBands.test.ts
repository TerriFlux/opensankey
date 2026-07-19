import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTag, Class_Tag } from './Tag'

// jest 27/jsdom n'expose pas structuredClone (utilisé par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// #285 — bandes internes : les valeurs coordonnées visibles d'un flux
// subdivisent son épaisseur (parts relatives), SANS liens enfants — les bandes
// sont un pur détail de rendu dérivé au draw (`Link.tagged_value_bands`).
// L'éclatement est piloté par la bannière `multi` d'un groupe libre.

function makeApp() {
  const app = new Class_ApplicationData(false)
  const sankey = app.drawing_area.sankey
  const source = sankey.addNewNodeWithName('Source')
  const target = sankey.addNewNodeWithName('Target')
  const link = sankey.addNewLink(source, target)
  link.valueCurrent = 10
  const tagg = sankey.addFluxTagGroup('matiere', 'Matière', false)
  const acier = tagg.addTag('Acier', 'acier') as Class_Tag
  const cuivre = tagg.addTag('Cuivre', 'cuivre') as Class_Tag
  return { app, sankey, link, tagg, acier, cuivre }
}

describe('tagged_value_bands — bandes internes des valeurs du flux', () => {
  it('derives one proportional band per visible tagged value, without child links', () => {
    const { link, acier, cuivre } = makeApp()
    const value = link.value!
    const tv1 = value.addTaggedValue()
    tv1.value = 6
    tv1.addTag(acier)
    const tv2 = value.addTaggedValue()
    tv2.value = 4
    tv2.addTag(cuivre)

    const bands = link.tagged_value_bands
    expect(bands).toHaveLength(2)
    expect(bands[0].id).toBe(tv1.id)
    expect(bands[0].share).toBeCloseTo(0.6)
    expect(bands[1].id).toBe(tv2.id)
    expect(bands[1].share).toBeCloseTo(0.4)


    // Valeur vivante : les parts suivent sans resynchronisation
    tv1.value = 12
    expect(link.tagged_value_bands[0].share).toBeCloseTo(0.75)

    // #285 (fusion/légende) — un tag porté par une valeur coordonnée doit être
    // vu par hasGivenTag (sinon la légende, qui teste l'usage via ce prédicat,
    // fait disparaître les tags des flux fusionnés, ex. import e!Sankey).
    expect(link.hasGivenTag(acier)).toBe(true)
    expect(link.hasGivenTag(cuivre)).toBe(true)
  })

  it('hides bands of deselected tags and renormalizes shares', () => {
    const { link, acier, cuivre } = makeApp()
    const value = link.value!
    const tv1 = value.addTaggedValue()
    tv1.value = 6
    tv1.addTag(acier)
    const tv2 = value.addTaggedValue()
    tv2.value = 4
    tv2.addTag(cuivre)

    cuivre.setUnSelected()
    const bands = link.tagged_value_bands
    expect(bands).toHaveLength(1)
    expect(bands[0].id).toBe(tv1.id)
    expect(bands[0].share).toBeCloseTo(1)
  })

  it('shows no bands when the group banner is one (single main value)', () => {
    const { link, tagg, acier } = makeApp()
    const tv = link.value!.addTaggedValue()
    tv.value = 6
    tv.addTag(acier)
    expect(link.tagged_value_bands).toHaveLength(1)

    tagg.banner = 'one'
    expect(link.tagged_value_bands).toHaveLength(0)
  })

  it('renders a dataTag multi banner as one band per selected slice (no child links)', () => {
    const { sankey, link } = makeApp()
    const data_tagg = sankey.addDataTagGroup('annee', 'Année', false)
    const t2020 = data_tagg.addTag('2020', 't2020') as Class_DataTag
    const t2021 = data_tagg.addTag('2021', 't2021') as Class_DataTag
    t2020.setSelected()
    t2021.setSelected()
    data_tagg.banner = 'multi'

    link.valueForTag(t2020)!.valueData = 30
    link.valueForTag(t2021)!.valueData = 10

    // Une bande par tranche sélectionnée, colorée par le tag ; priorité sur
    // les valeurs coordonnées des groupes libres
    const bands = link.tagged_value_bands
    expect(bands).toHaveLength(2)
    expect(bands.map(b => b.id)).toEqual(['t2020', 't2021'])
    expect(bands[0].share).toBeCloseTo(0.75)
    expect(bands[1].share).toBeCloseTo(0.25)
    expect(bands[0].color).toBe(t2020.color)
    // La valeur affichée est la somme des tranches sélectionnées
    expect(link.valueCurrent).toBe(40)
    // Désélection : la bande disparaît, la valeur suit
    t2021.setUnSelected()
    expect(link.tagged_value_bands).toHaveLength(1)
    expect(link.valueCurrent).toBe(30)
  })

  it('merges parallel links into one link whose bands reproduce the old ribbons', () => {
    const { sankey, link, acier, cuivre } = makeApp()
    link.valueCurrent = 6
    link.value!.addTag(acier)
    const link2 = sankey.addNewLink(link.source, link.target)
    link2.valueCurrent = 4
    link2.value!.addTag(cuivre)

    const merged = sankey.mergeParallelLinks([link, link2])

    expect(merged).toBe(link)
    expect(Object.values(sankey.links_dict)).not.toContain(link2)
    expect(link.value!.valueData).toBe(10)
    const bands = link.tagged_value_bands
    expect(bands).toHaveLength(2)
    expect(bands.find(b => b.id === link.value!.tagged_values_list[0].id)?.share).toBeCloseTo(0.6)
    expect(bands.find(b => b.id === link.value!.tagged_values_list[1].id)?.share).toBeCloseTo(0.4)
  })

  it('migrates all tagged parallel groups at load, leaving untagged pairs alone', () => {
    const { sankey, link, acier, cuivre } = makeApp()
    // Paire taguée : link (10) + un parallèle tagué
    link.value!.addTag(acier)
    const l2 = sankey.addNewLink(link.source, link.target)
    l2.valueCurrent = 4
    l2.value!.addTag(cuivre)
    // Paire NON taguée entre deux autres nœuds : à laisser telle quelle
    const a = sankey.addNewNodeWithName('A')
    const b = sankey.addNewNodeWithName('B')
    const u1 = sankey.addNewLink(a, b)
    u1.valueCurrent = 1
    const u2 = sankey.addNewLink(a, b)
    u2.valueCurrent = 2

    sankey.migrateParallelTaggedLinks()

    // La paire taguée est fusionnée
    expect(Object.values(sankey.links_dict)).not.toContain(l2)
    expect(link.value!.tagged_values_list).toHaveLength(2)
    // La paire non taguée survit
    expect(Object.values(sankey.links_dict)).toContain(u1)
    expect(Object.values(sankey.links_dict)).toContain(u2)
    // Idempotence
    sankey.migrateParallelTaggedLinks()
    expect(link.value!.tagged_values_list).toHaveLength(2)
  })

  it('round-trips tagged values through app toJSON', () => {
    const { app, link, acier } = makeApp()
    const tv = link.value!.addTaggedValue('tv_fixed_id')
    tv.value = 6
    tv.addTag(acier)

    const json = app.toJSON() as unknown as { [_: string]: unknown }
    const links_json = (json as { layout?: { links?: object } }).layout?.links ?? (json as { links?: object }).links
    expect(links_json).toBeDefined()
    expect(Object.keys(links_json as object)).toHaveLength(1)
  })
})

describe('OS#1286 — unite attachee au fluxTag (groupe de type unite)', () => {
  it('derives band px from the unit coefficient (t vs kt coherents)', () => {
    const { sankey, link, tagg, acier, cuivre } = makeApp()
    tagg.banner = 'multi'
    tagg.carries_values = true
    tagg.is_unit_type = true
    const t_unit = sankey.units.getOrCreateLegacyUnit('t', 1).unit
    const kt_unit = sankey.units.getOrCreateLegacyUnit('kt', 1000).unit
    ;(acier as unknown as { unit_ref?: string }).unit_ref = t_unit.id
    ;(cuivre as unknown as { unit_ref?: string }).unit_ref = kt_unit.id
    const value = link.value!
    const tv1 = value.addTaggedValue()
    tv1.value = 1000 // 1000 t
    tv1.addTag(acier)
    const tv2 = value.addTaggedValue()
    tv2.value = 1 // 1 kt = 1000 t -> meme largeur que tv1
    tv2.addTag(cuivre)

    const bands = link.tagged_value_bands
    expect(bands).toHaveLength(2)
    // 1000 t et 1 kt representent la meme masse -> parts egales
    expect(bands[0].share).toBeCloseTo(0.5)
    expect(bands[1].share).toBeCloseTo(0.5)
    // symbole d'unite porte par la bande
    expect(bands[0].unit).toBe('t')
    expect(bands[1].unit).toBe('kt')
  })

  it('rebalances two grandeurs via the per-quantity display_scale (e!Sankey style)', () => {
    const { sankey, link, tagg, acier, cuivre } = makeApp()
    tagg.banner = 'multi'
    tagg.carries_values = true
    tagg.is_unit_type = true
    // deux grandeurs distinctes : Masse (base t) et Energie (base MWh)
    const mass = sankey.units.addUnitType('Masse', 'ut_mass')
    const t_unit = mass.addUnit('t', 1)
    const energy = sankey.units.addUnitType('Energie', 'ut_energy')
    const mwh_unit = energy.addUnit('MWh', 1)
    ;(acier as unknown as { unit_ref?: string }).unit_ref = t_unit.id
    ;(cuivre as unknown as { unit_ref?: string }).unit_ref = mwh_unit.id
    const value = link.value!
    const tv1 = value.addTaggedValue(); tv1.value = 100; tv1.addTag(acier) // 100 t
    const tv2 = value.addTaggedValue(); tv2.value = 100; tv2.addTag(cuivre) // 100 MWh

    // sans echelle propre : memes parts (meme echelle du dessin)
    expect(link.tagged_value_bands[0].share).toBeCloseTo(0.5)

    // on donne a l'energie une echelle 4x plus fine (100 base pour 100px / 4)
    // -> ses bandes deviennent 4x plus larges pour la meme quantite
    energy.display_scale = sankey.drawing_area.scale / 4
    const bands = link.tagged_value_bands
    // energie (tv2) doit peser 4x la masse (tv1) : 1/5 vs 4/5
    expect(bands[0].share).toBeCloseTo(0.2)
    expect(bands[1].share).toBeCloseTo(0.8)
  })

  it('converts an is_unit dataTag dimension into a unit-type flux group', () => {
    const { sankey } = makeApp()
    const dim = sankey.addDataTagGroup('grandeur', 'Grandeur', false)
    dim.is_unit = true
    ;(dim.addTag('t', 'g_t') as Class_DataTag)
    ;(dim.addTag('kWh', 'g_kwh') as Class_DataTag)

    const flux = sankey.convertDataTagGroupToFluxTagGroup(dim)
    expect(flux.is_unit_type).toBe(true)
    expect(flux.carries_values).toBe(true)
    flux.tags_list.forEach(tag => {
      expect((tag as unknown as { unit_ref?: string }).unit_ref).toBeTruthy()
    })
  })
})
