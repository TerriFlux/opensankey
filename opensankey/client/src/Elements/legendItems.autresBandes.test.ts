// os#1511 — dimension dessinee en bandes : la legende nomme les membres DESSINES en propre sur au
// moins un flux visible, puis « Autres » s il existe quelque part — pas toute la selection.
//
// Importe le module FEUILLE legendItems (cf. LegendGenerator.test.ts pour la raison).

import { computeLegendItems, Type_LegendConfigValues, Type_SankeyForLegend } from './legendItems'

const config: Type_LegendConfigValues = {
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

const tag = (id: string) => ({ id, name: id, display_name: id.toUpperCase(), color: '#123456' })

type Group = Type_SankeyForLegend['data_taggs_list'][number]
function dimension(drawn: Group['members_drawn_in_bands']): Group {
  const membres = ['cereales', 'lait', 'vin', 'sucre'].map(tag)
  return {
    id: 'produit', name: 'Produit', use_colors: false, draws_members_in_color: true,
    selected_tags_list: membres, tags_list: membres, members_drawn_in_bands: drawn
  }
}

const sankey = (g: Group): Type_SankeyForLegend => ({
  node_taggs_list: [], flux_taggs_list: [], data_taggs_list: [g],
  visible_nodes_list: [], visible_links_list: []
})

const textes = (g: Group) => computeLegendItems(sankey(g), config, { t_others: 'Autres' }).map(i => i.text)

describe('os#1511 — legende d une dimension en bandes', () => {
  it('les membres dessines en propre, puis Autres', () => {
    expect(textes(dimension({ members: new Set(['cereales', 'lait']), has_others: true })))
      .toEqual(['Produit', 'CEREALES', 'LAIT', 'Autres'])
  })

  it('un membre en propre sur un seul flux y figure (union des flux)', () => {
    expect(textes(dimension({ members: new Set(['cereales', 'vin']), has_others: false })))
      .toEqual(['Produit', 'CEREALES', 'VIN'])
  })

  it('sans calcul de dessin, la selection entiere comme avant', () => {
    expect(textes(dimension(undefined))).toEqual(['Produit', 'CEREALES', 'LAIT', 'VIN', 'SUCRE'])
  })
})
