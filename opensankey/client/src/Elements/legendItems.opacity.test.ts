/**
 * SA#541 — légende d'un groupe qui pilote la transparence : la pastille porte l'opacité de son
 * étiquette, et une entrée « Non qualifiée » apparaît quand des valeurs visibles n'ont aucune
 * étiquette du groupe.
 */
import {
  computeLegendItems,
  renderableLegendItems,
  LEGEND_NEUTRAL_SWATCH_COLOR,
  Type_LegendConfigValues,
  Type_LegendItem,
  Type_SankeyForLegend
} from './legendItems'

type Patch = { [k: string]: string | number | boolean }
type MockTag = { id: string, name: string, display_name: string, color: string, style_patch?: Patch }

const CONFIG: Type_LegendConfigValues = {
  masked: false, managed: true, police: 12, bg_border: false, bg_color: 'white', bg_opacity: 0,
  horizontal: false, width: 200, display_scale: false, scale_unit: '', scale_ratio: 1,
  show_dataTags: false, show_constraints: false, show_data_type: false, info_link_value_void: false,
  entry_template: ''
}

const mkTag = (id: string, style_patch?: Patch): MockTag =>
  ({ id, name: id, display_name: id, color: '#aa0000', ...(style_patch ? { style_patch } : {}) })

function mkSankey(group_patch: Patch, opts: { use_colors?: boolean, carried: MockTag[][] }) {
  const fiable = mkTag('fiable', { shape_opacity: 1 })
  const indicative = mkTag('indicative', { shape_opacity: 0.2 })
  const sans_niveau = mkTag('sans_niveau')
  const tags = [fiable, indicative, sans_niveau]
  const group = {
    id: 'fiabilite',
    name: 'Fiabilité',
    use_colors: opts.use_colors ?? false,
    has_style_patch: Object.keys(group_patch).length > 0,
    style_patch: group_patch,
    selected_tags_list: tags,
    tags_list: tags
  }
  const links = opts.carried.map(carried => ({ hasGivenTag: (t: MockTag) => carried.includes(t) }))
  const sankey: Type_SankeyForLegend = {
    node_taggs_list: [], flux_taggs_list: [group], data_taggs_list: [],
    visible_nodes_list: [], visible_links_list: links
  }
  return { sankey, fiable, indicative, sans_niveau }
}

const entries = (items: Type_LegendItem[]) => items.filter(i => i.tag_id !== undefined || i.unqualified)

describe('SA#541 — légende d un groupe qui pilote la transparence', () => {
  it('la pastille de chaque entrée porte l opacité de son étiquette (repli : le groupe)', () => {
    const { sankey, fiable, indicative, sans_niveau } = mkSankey({ shape_opacity: 0.5 }, { carried: [] })
    sankey.visible_links_list = [fiable, indicative, sans_niveau]
      .map(carried => ({ hasGivenTag: (t: MockTag) => t === carried }))
    const items = entries(computeLegendItems(sankey, CONFIG, { t_unqualified: 'Non qualifiée' }))
    expect(items.map(i => [i.tag_id, i.swatch_opacity])).toEqual([['fiable', 1], ['indicative', 0.2], ['sans_niveau', 0.5]])
  })

  it('groupe qui ne colore pas : pastille neutre ; groupe qui colore : couleur de l étiquette', () => {
    const neutral = mkSankey({ shape_opacity: 0.5 }, { carried: [[]] })
    neutral.sankey.visible_links_list = [{ hasGivenTag: (t: MockTag) => t === neutral.fiable }]
    expect(entries(computeLegendItems(neutral.sankey, CONFIG))[0].swatch_color).toBe(LEGEND_NEUTRAL_SWATCH_COLOR)
    const colored = mkSankey({ shape_opacity: 0.5 }, { use_colors: true, carried: [] })
    colored.sankey.visible_links_list = [{ hasGivenTag: (t: MockTag) => t === colored.fiable }]
    expect(entries(computeLegendItems(colored.sankey, CONFIG))[0].swatch_color).toBe('#aa0000')
  })

  it('entrée « Non qualifiée » seulement si une valeur visible n a aucune étiquette du groupe', () => {
    const qualified = mkSankey({ shape_opacity: 0.5 }, { carried: [] })
    qualified.sankey.visible_links_list = [{ hasGivenTag: (t: MockTag) => t === qualified.fiable }]
    expect(computeLegendItems(qualified.sankey, CONFIG).some(i => i.unqualified)).toBe(false)

    const mixed = mkSankey({ shape_opacity: 0.5 }, { carried: [] })
    mixed.sankey.visible_links_list = [
      { hasGivenTag: (t: MockTag) => t === mixed.fiable },
      { hasGivenTag: () => false }
    ]
    const unq = computeLegendItems(mixed.sankey, CONFIG, { t_unqualified: 'Non qualifiée' }).filter(i => i.unqualified)
    expect(unq).toHaveLength(1)
    expect(unq[0]).toMatchObject({ text: 'Non qualifiée', swatch_opacity: 0.5, swatch_color: LEGEND_NEUTRAL_SWATCH_COLOR })
    expect(unq[0].swatch_dashed).toBeUndefined()
    expect(unq[0].tag_id).toBeUndefined()
  })

  it('variante contour : la pastille « Non qualifiée » est pointillée', () => {
    const { sankey, fiable } = mkSankey({ shape_opacity: 0.5, unqualified_outline: true }, { carried: [] })
    sankey.visible_links_list = [{ hasGivenTag: (t: MockTag) => t === fiable }, { hasGivenTag: () => false }]
    const unq = computeLegendItems(sankey, CONFIG).filter(i => i.unqualified)
    expect(unq[0].swatch_dashed).toBe(true)
  })

  it('l entrée « Non qualifiée » suit les entrées de SON groupe, avant la suite de la légende', () => {
    const { sankey, fiable } = mkSankey({ shape_opacity: 0.5 }, { carried: [] })
    sankey.visible_links_list = [{ hasGivenTag: (t: MockTag) => t === fiable }, { hasGivenTag: () => false }]
    const rendered = renderableLegendItems(computeLegendItems(sankey, { ...CONFIG, show_dataTags: true }))
    expect(rendered.map(i => i.unqualified ? 'unqualified' : i.id))
      .toEqual(['legend-group-fiabilite', 'legend-tag-fiabilite-fiable', 'unqualified'])
  })

  it('aucune étiquette du groupe portée par un élément visible : le groupe reste hors légende (règle d avant)', () => {
    const { sankey } = mkSankey({ shape_opacity: 0.5 }, { carried: [[], []] })
    expect(computeLegendItems(sankey, CONFIG)).toEqual([])
  })

  it('groupe qui porte une mise en forme SANS opacité : entrées inchangées (pas de clé nouvelle)', () => {
    const { sankey } = mkSankey({ autre: 'x' }, { carried: [] })
    const f = (sankey.flux_taggs_list[0].tags_list ?? [])[0]
    sankey.visible_links_list = [{ hasGivenTag: (t: MockTag) => t === f }, { hasGivenTag: () => false }]
    const items = computeLegendItems(sankey, CONFIG)
    expect(items.some(i => i.unqualified)).toBe(false)
    const entry = items.find(i => i.tag_id === 'fiable') as Type_LegendItem
    expect(entry).not.toHaveProperty('swatch_opacity')
    expect(entry.swatch_color).toBe('#aa0000')
  })
})
