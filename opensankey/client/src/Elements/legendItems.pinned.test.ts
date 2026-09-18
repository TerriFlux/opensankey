// SA#550 — groupe épinglé en bas de la légende, sur une ligne « Nom : description » : contenu et
// mise en page, sans DOM.
//
// Importe le module FEUILLE legendItems (cf. LegendGenerator.test.ts pour la raison).

import {
  computeLegendItems, layoutLegendItems, legendWrappedShapeHeight, pinnedLegendGroups,
  renderableLegendItems, Type_LegendConfigValues, Type_SankeyForLegend
} from './legendItems'

const base_config: Type_LegendConfigValues = {
  masked: false,
  managed: true,
  police: 16,
  bg_border: false,
  bg_color: '#ffffff',
  bg_opacity: 0,
  horizontal: false,
  width: 180,
  display_scale: false,
  scale_unit: '',
  scale_ratio: 1,
  show_dataTags: false,
  show_constraints: false,
  show_data_type: false,
  info_link_value_void: false,
  entry_template: ''
}

const makeTag = (id: string) => ({ id, name: id, display_name: id.toUpperCase(), color: '#123456' })
const makeElement = (tag_ids: string[]) => ({ valueCurrent: 1, hasGivenTag: (t: { id: string }) => tag_ids.includes(t.id) })

type Group = Type_SankeyForLegend['node_taggs_list'][number]
function group(id: string, overrides: Partial<Group> = {}): Group {
  const tag = makeTag(id + '_t')
  return { id, name: id.toUpperCase(), use_colors: false, selected_tags_list: [tag], tags_list: [tag], ...overrides }
}

function makeSankey(overrides: Partial<Type_SankeyForLegend> = {}): Type_SankeyForLegend {
  return {
    node_taggs_list: [],
    flux_taggs_list: [],
    data_taggs_list: [],
    // Chaque étiquette de test est portée par un élément visible
    visible_nodes_list: [makeElement(['couleur_t', 'source_t', 'methode_t', 'statut_t'])],
    visible_links_list: [],
    ...overrides
  }
}

const SOURCE_DESCRIPTION = 'collecte de différentes sources de données'

describe('SA#550 — un groupe épinglé fermé va en bas de la légende', () => {
  it('donne UNE ligne « Nom : description », en dernier, sans entrée d\'étiquette', () => {
    const sankey = makeSankey({
      node_taggs_list: [
        group('source', { pinned_in_legend: true, description: SOURCE_DESCRIPTION }),
        group('couleur', { use_colors: true })
      ]
    })
    const items = computeLegendItems(sankey, { ...base_config, show_constraints: true })
    expect(items[items.length - 1]).toEqual({
      id: 'legend-group-source', text: 'SOURCE : ' + SOURCE_DESCRIPTION, starts_group: true, own_line: true,
      block_id: 'legend-block-source', pinned: true, wrap: true, pinned_name: 'SOURCE'
    })
    // Même le tableau des contraintes est au-dessus
    expect(items[items.length - 2].id).toMatch(/^legend-constraint-/)
    // Aucune entrée, aucune info-bulle pour le groupe épinglé
    expect(items.filter(i => i.block_id === 'legend-block-source')).toHaveLength(1)
  })

  it('sans description : le nom seul', () => {
    const items = computeLegendItems(makeSankey({ node_taggs_list: [group('statut', { pinned_in_legend: true })] }), base_config)
    expect(items).toEqual([expect.objectContaining({ id: 'legend-group-statut', text: 'STATUT', pinned_name: 'STATUT' })])
  })

  it('suit l\'ordre des listes de groupes (nœuds, puis flux), quel que soit le groupe qui colore', () => {
    const sankey = makeSankey({
      node_taggs_list: [
        group('statut', { pinned_in_legend: true }),
        group('couleur', { use_colors: true }),
        group('source', { pinned_in_legend: true, description: SOURCE_DESCRIPTION })
      ],
      flux_taggs_list: [group('methode', { pinned_in_legend: true, description: 'Méthode.' })]
    })
    const ids = computeLegendItems(sankey, base_config).map(i => i.id)
    expect(ids).toEqual([
      'legend-group-couleur', 'legend-tag-couleur-couleur_t',
      'legend-group-statut', 'legend-group-source', 'legend-group-methode'
    ])
  })

  it('un groupe épinglé qui met en forme garde sa place et ses entrées (l\'ouverture en tête relève du #551)', () => {
    const sankey = makeSankey({
      node_taggs_list: [group('couleur', { use_colors: true, pinned_in_legend: true, description: 'Déf.' })]
    })
    const items = computeLegendItems(sankey, base_config)
    expect(items.map(i => i.id)).toEqual(['legend-group-couleur', 'legend-tag-couleur-couleur_t'])
    expect(items.some(i => i.pinned === true || i.pinned_name !== undefined)).toBe(false)
  })

  it('sans groupe épinglé, la légende est identique à celle d\'un groupe au drapeau absent', () => {
    const avec = (pinned: boolean | undefined) => computeLegendItems(makeSankey({
      node_taggs_list: [group('source', { pinned_in_legend: pinned, description: SOURCE_DESCRIPTION }), group('couleur', { use_colors: true })]
    }), base_config)
    expect(avec(false)).toEqual(avec(undefined))
    expect(avec(undefined).some(i => i.pinned === true)).toBe(false)
  })

  it('pinnedLegendGroups : épinglés ET fermés seulement', () => {
    const groups = [
      group('a', { pinned_in_legend: true }),
      group('b', { pinned_in_legend: true, use_colors: true }),
      group('c', { pinned_in_legend: true, has_style_patch: true }),
      group('d')
    ]
    expect(pinnedLegendGroups(groups).map(g => g.id)).toEqual(['a'])
  })
})

describe('SA#550 — rendu et mise en page de la ligne épinglée', () => {
  it('renderableLegendItems garde le bloc, qui n\'a aucune entrée d\'étiquette', () => {
    const sankey = makeSankey({ node_taggs_list: [group('source', { pinned_in_legend: true, description: SOURCE_DESCRIPTION })] })
    const items = computeLegendItems(sankey, base_config)
    expect(renderableLegendItems(items).map(i => i.id)).toEqual(['legend-group-source'])
  })

  it('la ligne est enveloppée à la largeur de la légende, et la rangée suivante vient après ses lignes', () => {
    const long = 'mot '.repeat(170) // ~ 680 caractères, l'ordre de grandeur de « Source » du Lait
    const sankey = makeSankey({
      node_taggs_list: [
        group('source', { pinned_in_legend: true, description: long }),
        group('methode', { pinned_in_legend: true })
      ]
    })
    const items = computeLegendItems(sankey, base_config)
    ;[false, true].forEach(horizontal => {
      const config = { ...base_config, horizontal }
      const pos = new Map(layoutLegendItems(items, config).map(p => [p.id, p]))
      const source_y = pos.get('legend-group-source')?.y as number
      const next_y = pos.get('legend-group-methode')?.y as number
      // Estimation : 690 × 16 × 0,55 / 180 px ≈ 34 lignes de 16 px (#556 : interligne = 1 police)
      expect(next_y - source_y).toBeGreaterThanOrEqual(30 * 16)
      expect(pos.get('legend-group-source')?.x).toBe(0)
    })
  })

  it('la hauteur MESURÉE (en hauteurs de police, éventuellement fractionnaire) l\'emporte sur l\'estimation', () => {
    const sankey = makeSankey({
      node_taggs_list: [
        group('source', { pinned_in_legend: true, description: SOURCE_DESCRIPTION }),
        group('methode', { pinned_in_legend: true })
      ]
    })
    const items = computeLegendItems(sankey, base_config)
    const pos = new Map(layoutLegendItems(items, base_config, new Map([['legend-group-source', 2.5]])).map(p => [p.id, p]))
    expect((pos.get('legend-group-methode')?.y as number) - (pos.get('legend-group-source')?.y as number)).toBe((2.5 + 0.5) * 16)
  })

  it('la forme d\'une zone enveloppée épouse exactement ses lignes', () => {
    expect(legendWrappedShapeHeight(1, 16)).toBe(16)
    expect(legendWrappedShapeHeight(3, 16)).toBe(48)
  })
})
