// OS#1254 — tests du générateur de légende : contenu (computeLegendItems),
// layout (layoutLegendItems) et texte d'échelle (computeScaleText), sans DOM.
//
// Importe les modules FEUILLES (legendItems/legendIds), pas LegendGenerator :
// ce dernier tire ElementsAttributesConfig, dont le graphe d'imports cyclique
// ne supporte pas d'être chargé par cette porte d'entrée sous jest.

import {
  computeLegendItems, computeScaleText, layoutLegendItems,
  Type_LegendConfigValues, Type_SankeyForLegend
} from './legendItems'
import { isLegendChildId, isLegendElementId, isLegendFrameId } from './legendIds'

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

function makeTag(id: string, color = '#123456') {
  return { id, name: id, display_name: id.toUpperCase(), color }
}

// Élément (nœud/flux) minimal : porte un ensemble d'ids de tags
function makeElement(tag_ids: string[], valueCurrent: number | null = 1) {
  return {
    valueCurrent,
    hasGivenTag(t: { id: string }) { return tag_ids.includes(t.id) }
  }
}

function makeSankey(overrides: Partial<Type_SankeyForLegend> = {}): Type_SankeyForLegend {
  return {
    node_taggs_list: [],
    flux_taggs_list: [],
    data_taggs_list: [],
    visible_nodes_list: [],
    visible_links_list: [],
    ...overrides
  }
}

describe('OS#1254 — prédicats d\'ids', () => {
  it('reconnaît le cadre, les enfants, et rien d\'autre', () => {
    expect(isLegendFrameId('legend')).toBe(true)
    expect(isLegendChildId('legend')).toBe(false)
    expect(isLegendChildId('legend-tag-g1-t1')).toBe(true)
    expect(isLegendElementId('legend')).toBe(true)
    expect(isLegendElementId('legend-scale')).toBe(true)
    expect(isLegendElementId('legende')).toBe(false)
    expect(isLegendElementId('shape0')).toBe(false)
  })
})

describe('OS#1254 — computeLegendItems', () => {
  it('ignore les groupes sans use_colors', () => {
    const sankey = makeSankey({
      node_taggs_list: [
        { id: 'g1', name: 'G1', use_colors: false, selected_tags_list: [makeTag('t1')] }
      ],
      visible_nodes_list: [makeElement(['t1'])]
    })
    expect(computeLegendItems(sankey, base_config)).toEqual([])
  })

  it('émet titre de groupe + une entrée par tag porté par un élément visible', () => {
    const t1 = makeTag('t1', '#ff0000')
    const t2 = makeTag('t2', '#00ff00')
    const sankey = makeSankey({
      node_taggs_list: [
        { id: 'g1', name: 'Groupe 1', use_colors: true, selected_tags_list: [t1, t2] }
      ],
      // t1 porté par un nœud visible, t2 par personne
      visible_nodes_list: [makeElement(['t1'])]
    })
    const items = computeLegendItems(sankey, base_config)
    expect(items.map(i => i.id)).toEqual(['legend-group-g1', 'legend-tag-g1-t1'])
    expect(items[0]).toMatchObject({ text: 'Groupe 1', bold: true, starts_group: true })
    expect(items[1]).toMatchObject({
      text: 'T1', swatch_color: '#ff0000', tag_group_id: 'g1', tag_id: 't1'
    })
  })

  it('montre toujours les data tags sélectionnés (même sans élément porteur)', () => {
    const sankey = makeSankey({
      data_taggs_list: [
        { id: 'annee', name: 'Année', use_colors: true, selected_tags_list: [makeTag('2020')] }
      ]
    })
    const items = computeLegendItems(sankey, base_config)
    expect(items.map(i => i.id)).toEqual(['legend-group-annee', 'legend-tag-annee-2020'])
  })

  it('émet la ligne des data tags sélectionnés quand show_dataTags', () => {
    const sankey = makeSankey({
      data_taggs_list: [
        { id: 'annee', name: 'Année', use_colors: false, selected_tags_list: [makeTag('2020'), makeTag('2021')] }
      ]
    })
    const items = computeLegendItems(sankey, { ...base_config, show_dataTags: true })
    expect(items).toEqual([
      expect.objectContaining({ id: 'legend-datatag-annee', text: 'Année : 2020, 2021' })
    ])
  })

  it('émet l\'explication des flux pointillés seulement si option + flux à valeur nulle', () => {
    const sankey = makeSankey({
      visible_links_list: [makeElement([], null)]
    })
    const env = { t_dashed_links: 'Flux indéterminés' }
    expect(computeLegendItems(sankey, base_config, env)).toEqual([])
    const items = computeLegendItems(sankey, { ...base_config, info_link_value_void: true }, env)
    expect(items).toEqual([
      expect.objectContaining({ id: 'legend-info-dashed', text: 'Flux indéterminés' })
    ])
  })

  it('émet l\'échelle et le tableau des contraintes sur demande', () => {
    const items = computeLegendItems(
      makeSankey(),
      { ...base_config, display_scale: true, show_constraints: true },
      {},
      'Echelle : 50 t'
    )
    expect(items[0]).toMatchObject({ id: 'legend-scale', text: 'Echelle : 50 t' })
    const constraint_items = items.filter(i => i.id.startsWith('legend-constraint-'))
    expect(constraint_items).toHaveLength(6)
    expect(constraint_items[0].starts_group).toBe(true)
  })

  it('normalise les ids de tags/groupes exotiques (espaces, quotes)', () => {
    const tag = makeTag('l\'été 2020')
    const sankey = makeSankey({
      flux_taggs_list: [
        { id: 'mes tags', name: 'Mes tags', use_colors: true, selected_tags_list: [tag] }
      ],
      visible_links_list: [makeElement(['l\'été 2020'])]
    })
    const items = computeLegendItems(sankey, base_config)
    expect(items[1].id).toBe('legend-tag-mes_tags-l__t__2020')
  })
})

describe('OS#1254 — layoutLegendItems', () => {
  const items = [
    { id: 'a', text: 'Titre', bold: true, starts_group: true, own_line: true },
    { id: 'b', text: 'Entrée', swatch_color: '#f00' },
    { id: 'b2', text: 'Entrée 2', swatch_color: '#0f0' },
    { id: 'c', text: 'Autre groupe', starts_group: true, own_line: true }
  ]

  it('vertical : empile, jamais de x', () => {
    const pos = layoutLegendItems(items, base_config)
    expect(pos.map(p => p.id)).toEqual(['a', 'b', 'b2', 'c'])
    expect(pos.every(p => p.x === 0)).toBe(true)
    expect(pos[0].y).toBe(0)
    expect(pos[1].y).toBeGreaterThan(pos[0].y)
    expect(pos[2].y).toBeGreaterThan(pos[1].y)
    expect(pos[3].y).toBeGreaterThan(pos[2].y)
  })

  it('vertical : un texte long (wrap) réserve plusieurs lignes', () => {
    const long_items = [
      { id: 'long', text: 'x'.repeat(200) },
      { id: 'next', text: 'suivant' }
    ]
    const pos = layoutLegendItems(long_items, base_config)
    const single_line = base_config.police * 1.5
    expect(pos[1].y).toBeGreaterThan(single_line)
  })

  it('horizontal : titre seul sur sa ligne, entrées enchaînées, nouveau groupe = nouvelle ligne', () => {
    const pos = layoutLegendItems(items, { ...base_config, horizontal: true })
    const line_height = base_config.police * 1.5
    // Titre sur sa propre ligne
    expect(pos[0]).toMatchObject({ x: 0, y: 0 })
    // Les deux entrées s'enchaînent sur la ligne suivante
    expect(pos[1]).toMatchObject({ x: 0, y: line_height })
    expect(pos[2].x).toBeGreaterThan(0)
    expect(pos[2].y).toBe(line_height)
    // Le titre du groupe suivant repart à la ligne
    expect(pos[3].x).toBe(0)
    expect(pos[3].y).toBeGreaterThan(line_height)
  })
})

describe('OS#1254 — computeScaleText', () => {
  it('échelle simple : moitié de l\'échelle du dessin, ratio appliqué', () => {
    expect(computeScaleText(100, [], base_config, 'Echelle')).toBe('Echelle : 50')
    expect(computeScaleText(100, [], { ...base_config, scale_ratio: 2 }, 'Echelle')).toBe('Echelle : 25')
  })

  it('unité du tag d\'unité sélectionné, remplacée par l\'unité utilisateur', () => {
    const data_taggs = [{
      id: 'unit', name: 'Unités', use_colors: false, is_unit: true,
      selected_tags_list: [{ ...makeTag('kt'), scale: 10, is_selected: true }]
    }]
    expect(computeScaleText(100, data_taggs, base_config, 'Echelle')).toBe('Echelle : 5 kt')
    expect(computeScaleText(100, data_taggs, { ...base_config, scale_unit: 'Mt' }, 'Echelle'))
      .toBe('Echelle : 5 Mt')
  })

  it('formatage : entier si >= 1, 3 chiffres significatifs sinon', () => {
    expect(computeScaleText(0.005, [], base_config, 'Echelle')).toBe('Echelle : 0.0025')
    expect(computeScaleText(3, [], base_config, 'Echelle')).toBe('Echelle : 1.5')
  })
})
