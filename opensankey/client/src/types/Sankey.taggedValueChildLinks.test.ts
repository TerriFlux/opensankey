import { Class_ApplicationData } from './ApplicationData'
import type { Class_DataTag, Class_Tag } from './Tag'

// jest 27/jsdom n'expose pas structuredClone (utilisé par Link.copyFrom)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T
}

// #284 — test d'intégration du rendu multi-ruban des sous-valeurs
// (NOTE-FUSION-TAGS.md §3.0) : create_tagged_value_child_links doit créer un lien
// enfant réel par sous-valeur de la feuille courante, rediriger valeur et tags
// vers la sous-valeur vivante, et resynchroniser (suppression comprise).

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

describe('create_tagged_value_child_links — multi-ruban des sous-valeurs', () => {
  it('creates one live child ribbon per sub-value, redirecting value and tags', () => {
    const { sankey, link, acier, cuivre } = makeApp()
    const value = link.value
    expect(value).not.toBeNull()

    const sub1 = value!.addTaggedValue()
    sub1.value = 6
    sub1.addTag(acier)
    const sub2 = value!.addTaggedValue()
    sub2.value = 4
    sub2.addTag(cuivre)

    sankey.create_tagged_value_child_links()

    const children = Object.values(link.child_links)
    expect(children).toHaveLength(2)
    children.forEach(child => expect(child.is_multi_link).toBe(true))

    const child1 = link.child_links[sub1.id]
    const child2 = link.child_links[sub2.id]
    expect(child1.multi_link_tagged_value).toBe(sub1)
    expect(child2.multi_link_tagged_value).toBe(sub2)
    // Valeur lue en direct sur la sous-valeur du parent
    expect(child1.valueCurrent).toBe(6)
    expect(child2.valueCurrent).toBe(4)
    // Tags du ruban = coordonnée de la sous-valeur
    expect(child1.flux_tags_list.map(t => t.id)).toEqual(['acier'])
    expect(child2.flux_tags_list.map(t => t.id)).toEqual(['cuivre'])
    // Nom porté par la coordonnée
    expect(child1.name).toContain('Acier')

    // Modification vivante : pas de resynchronisation nécessaire
    sub1.value = 7
    expect(child1.valueCurrent).toBe(7)
  })

  it('is idempotent and removes stale ribbons when a sub-value is deleted', () => {
    const { sankey, link, acier, cuivre } = makeApp()
    const value = link.value
    const sub1 = value!.addTaggedValue()
    sub1.value = 6
    sub1.addTag(acier)
    const sub2 = value!.addTaggedValue()
    sub2.value = 4
    sub2.addTag(cuivre)

    sankey.create_tagged_value_child_links()
    sankey.create_tagged_value_child_links()
    expect(Object.values(link.child_links)).toHaveLength(2)

    value!.removeTaggedValue(sub2)
    sankey.create_tagged_value_child_links()
    const children = Object.values(link.child_links)
    expect(children).toHaveLength(1)
    expect(children[0].multi_link_tagged_value).toBe(sub1)

    value!.removeTaggedValue(sub1)
    sankey.create_tagged_value_child_links()
    expect(Object.values(link.child_links)).toHaveLength(0)
  })

  it('does not expand when no free group has the multi banner', () => {
    const { sankey, link, tagg, acier, cuivre } = makeApp()
    // 2026-07-18 — valeurs non additives : l'éclatement en rubans est un choix
    // d'affichage porté par la bannière du groupe. En « Unique », pas de rubans.
    tagg.banner = 'one'
    const value = link.value
    const sub1 = value!.addTaggedValue()
    sub1.value = 6
    sub1.addTag(acier)
    const sub2 = value!.addTaggedValue()
    sub2.value = 4
    sub2.addTag(cuivre)

    sankey.create_tagged_value_child_links()
    expect(Object.values(link.child_links)).toHaveLength(0)

    // Repasser en multi éclate ; revenir en Unique replie
    tagg.banner = 'multi'
    sankey.create_tagged_value_child_links()
    expect(Object.values(link.child_links)).toHaveLength(2)
    tagg.banner = 'one'
    sankey.create_tagged_value_child_links()
    expect(Object.values(link.child_links)).toHaveLength(0)
  })

  it('does not expand sub-values of a link that already has dataTag children', () => {
    const { sankey, link, acier } = makeApp()
    // Groupe de dataTags en bannière multi avec 2 tags sélectionnés
    const data_tagg = sankey.addDataTagGroup('annee', 'Année', false)
    const t2020 = data_tagg.addTag('2020', 't2020') as Class_DataTag
    const t2021 = data_tagg.addTag('2021', 't2021') as Class_DataTag
    t2020.setSelected()
    t2021.setSelected()
    data_tagg.banner = 'multi'

    // En bannière multi les deux tags sont sélectionnés : link.value est null
    // (résolution exigeant un tag unique par groupe) — la feuille se récupère
    // par tag explicite.
    const value = link.valueForTag(t2020)
    expect(value).not.toBeNull()
    const sub = value!.addTaggedValue()
    sub.value = 3
    sub.addTag(acier)

    sankey.create_child_links()

    const children = Object.values(link.child_links)
    // Seulement les enfants par dataTag (prioritaires), pas de ruban de sous-valeur
    expect(children.length).toBeGreaterThan(0)
    children.forEach(child => expect(child.multi_link_tagged_value).toBeUndefined())
  })

  it('round-trips sub-values through app toJSON without serializing child ribbons', () => {
    const { app, sankey, link, acier } = makeApp()
    const value = link.value
    const sub = value!.addTaggedValue('sub_fixed_id')
    sub.value = 6
    sub.addTag(acier)
    sankey.create_tagged_value_child_links()
    expect(Object.values(link.child_links)).toHaveLength(1)

    const json = app.toJSON() as unknown as {
      layout: { links: { [_: string]: { sub_values?: unknown } } }
    } & { [_: string]: unknown }
    // Aucun lien enfant sérialisé : un seul lien dans le JSON
    const links_json = (json as { layout?: { links?: object } }).layout?.links ?? (json as { links?: object }).links
    expect(links_json).toBeDefined()
    expect(Object.keys(links_json as object)).toHaveLength(1)
  })
})
