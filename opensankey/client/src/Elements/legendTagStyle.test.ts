// SA#545 — une entrée de légende prend la forme du style de son étiquette : tests purs, sans DOM.
//
// Importe les modules FEUILLES (legendItems/legendTagStyle), pas LegendGenerator (même piège
// d'imports cycliques que LegendGenerator.test.ts).

import {
  computeLegendItems, layoutLegendItems, legendSwatchWidth, renderableLegendItems,
  Type_LegendConfigValues, Type_SankeyForLegend
} from './legendItems'
import { LINK_DASH_GAP, LINK_DASH_LENGTH } from './linkDash'
import { LEGEND_SAMPLE_SWATCH_EM, legendEntryFormat } from './legendTagStyle'

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

// Style nommé : ne définit QUE les paramètres donnés (comme un style créé par l'utilisateur).
function makeStyle(props: { [k: string]: unknown }, is_default_style = false) {
  return { is_default_style, getElementProperty: (k: string) => props[k] }
}

function makeTag(id: string, style_id?: string, color = '#123456') {
  return { id, name: id, display_name: id.toUpperCase(), color, style_id }
}

function makeElement(tag_ids: string[]) {
  return { valueCurrent: 1, hasGivenTag(t: { id: string }) { return tag_ids.includes(t.id) } }
}

const FULL = makeStyle({
  name_label_bold: true, name_label_color: '#330000',
  shape_color: '#ff0000', shape_opacity: 0.4, shape_border_visible: true,
  value_label_italic: true
})
const COLOR_ONLY = makeStyle({ shape_color: '#00ff00' })
const LABEL_ONLY = makeStyle({ name_label_italic: true, name_label_font_family: 'serif' })

function styledSankey(overrides: Partial<Type_SankeyForLegend> = {}): Type_SankeyForLegend {
  return {
    node_taggs_list: [{
      id: 'fiab', name: 'Fiabilité', use_colors: true, uses_tag_styles: true,
      selected_tags_list: [makeTag('full', 'S_full'), makeTag('color', 'S_color'), makeTag('label', 'S_label')]
    }],
    flux_taggs_list: [],
    data_taggs_list: [],
    visible_nodes_list: [makeElement(['full']), makeElement(['color']), makeElement(['label'])],
    visible_links_list: [],
    styles_dict: { S_full: FULL, S_color: COLOR_ONLY, S_label: LABEL_ONLY },
    ...overrides
  }
}

function entry(items: ReturnType<typeof computeLegendItems>, tag_id: string) {
  const found = items.find(i => i.tag_id === tag_id)
  if (!found) throw new Error('entrée absente : ' + tag_id)
  return found
}

describe('SA#545 — familles définies par un style', () => {
  it('libellé, forme et valeur : les trois parties, avec les seuls paramètres définis', () => {
    expect(legendEntryFormat(FULL)).toEqual({
      name: { bold: true, color: '#330000' },
      swatch: { color: '#ff0000', opacity: 0.4, border_visible: true },
      value: { italic: true }
    })
  })

  it('un style qui ne règle que la position d\'un libellé ne définit rien de visible', () => {
    expect(legendEntryFormat(makeStyle({ name_label_horiz: 'left', value_label_vert: 'top' }))).toEqual({})
  })

  it('pas de style : aucune partie', () => {
    expect(legendEntryFormat(undefined)).toEqual({})
  })

  it('flux « Hachuré » : le carré reprend les tirets du tracé de flux', () => {
    expect(legendEntryFormat(makeStyle({ shape_is_dashed: true }))).toEqual({ swatch: { link_dashed: true } })
  })

  it('hachures de nœud : le carré garde l\'orientation choisie par le style', () => {
    expect(legendEntryFormat(makeStyle({ shape_hatch: 'horizontal' }))).toEqual({ swatch: { hatch: 'horizontal' } })
    expect(legendEntryFormat(makeStyle({ shape_hatch: 'diagonal' }))).toEqual({ swatch: { hatch: 'diagonal' } })
  })

  it('« pas de hachure » et « non hachuré » ne définissent rien de visible', () => {
    expect(legendEntryFormat(makeStyle({ shape_hatch: 'none', shape_is_dashed: false }))).toEqual({})
  })

  it('icône du style : elle définit une partie, et fait apparaître le carré', () => {
    const format = legendEntryFormat(makeStyle({ icon_is_visible: true, icon_icon_name: 'factory', icon_color: '#123456' }))
    expect(format).toEqual({ icon: { is_image: false, icon_name: 'factory', color: '#123456' } })
  })

  it('image du style : choisie par `icon_is_image`, ou seule source donnée', () => {
    expect(legendEntryFormat(makeStyle({ icon_is_image: true, icon_icon_name: 'factory', icon_image_src: 'data:x' })))
      .toEqual({ icon: { is_image: true, image_src: 'data:x' } })
    expect(legendEntryFormat(makeStyle({ icon_image_src: 'data:x' }))).toEqual({ icon: { is_image: true, image_src: 'data:x' } })
  })

  it('icône éteinte explicitement : rien', () => {
    expect(legendEntryFormat(makeStyle({ icon_is_visible: false, icon_icon_name: 'factory' }))).toEqual({})
  })
})

describe('SA#545 — composition d\'une entrée de légende', () => {
  it('règle 1 — libellé + forme + valeur : nom mis en forme, carré mis en forme, valeur d\'exemple', () => {
    const item = entry(computeLegendItems(styledSankey(), base_config), 'full')
    expect(item.format).toEqual(legendEntryFormat(FULL))
    expect(item.swatch_color).toBe('#ff0000')
  })

  it('règle 2 — couleur seule : carré de cette couleur, nom par défaut, sans valeur', () => {
    const item = entry(computeLegendItems(styledSankey(), base_config), 'color')
    expect(item.format).toEqual({ swatch: { color: '#00ff00' } })
    expect(item.swatch_color).toBe('#00ff00')
  })

  it('règle 3 — libellé seul : ni carré ni valeur, le nom mis en forme', () => {
    const item = entry(computeLegendItems(styledSankey(), base_config), 'label')
    expect(item.format).toEqual({ name: { italic: true, font_family: 'serif' } })
    expect(item.swatch_color).toBeUndefined()
  })

  it('forme sans couleur : le carré garde la couleur de l\'étiquette', () => {
    const sankey = styledSankey({ styles_dict: { S_full: makeStyle({ shape_opacity: 0.5 }) } })
    expect(entry(computeLegendItems(sankey, base_config), 'full').swatch_color).toBe('#123456')
  })

  it('étiquette sans style dans un groupe à styles : le nom seul', () => {
    const sankey = styledSankey({ styles_dict: {} })
    const item = entry(computeLegendItems(sankey, base_config), 'full')
    expect(item.swatch_color).toBeUndefined()
    expect(item.format).toBeUndefined()
  })

  it('le style `default` (pré-rempli de tous les défauts) n\'est jamais un style d\'étiquette', () => {
    const sankey = styledSankey({ styles_dict: { S_full: makeStyle({ shape_color: '#ff0000' }, true) } })
    expect(entry(computeLegendItems(sankey, base_config), 'full').format).toBeUndefined()
  })

  it('groupe sans style d\'étiquette : entrée strictement identique à avant (pastille = couleur du tag)', () => {
    const sankey = styledSankey()
    sankey.node_taggs_list[0].uses_tag_styles = false
    const item = entry(computeLegendItems(sankey, base_config), 'full')
    expect(item).toEqual({
      id: 'legend-tag-fiab-full', text: 'FULL', swatch_color: '#123456',
      tag_group_id: 'fiab', tag_id: 'full', block_id: 'legend-block-fiab'
    })
  })

  it('groupe à styles mais interrupteur fermé (use_colors) : les styles n\'imposent rien, pas de légende', () => {
    const sankey = styledSankey()
    sankey.node_taggs_list[0].use_colors = false
    expect(computeLegendItems(sankey, base_config)).toEqual([])
  })
})

describe('SA#545 — entrée « sans étiquette »', () => {
  const t_untagged = 'Sans étiquette'

  it('le groupe porte un style et un élément visible n\'a aucune de ses étiquettes', () => {
    const sankey = styledSankey({ visible_nodes_list: [makeElement(['full']), makeElement([])] })
    sankey.node_taggs_list[0].style_id = 'S_color'
    const items = computeLegendItems(sankey, base_config, { t_untagged })
    const untagged = items.find(i => i.untagged)
    expect(untagged).toMatchObject({ text: t_untagged, swatch_color: '#00ff00', block_id: 'legend-block-fiab' })
    expect(untagged?.format).toEqual({ swatch: { color: '#00ff00' } })
    // Placée après les étiquettes du groupe
    expect(items[items.length - 1]).toBe(untagged)
  })

  it('aucune entrée quand tous les éléments visibles portent une étiquette du groupe', () => {
    const sankey = styledSankey()
    sankey.node_taggs_list[0].style_id = 'S_color'
    expect(computeLegendItems(sankey, base_config, { t_untagged }).some(i => i.untagged)).toBe(false)
  })

  it('aucune entrée quand le groupe ne porte pas de style', () => {
    const sankey = styledSankey({ visible_nodes_list: [makeElement([])] })
    expect(computeLegendItems(sankey, base_config, { t_untagged })).toEqual([])
  })

  it('un groupe dont seuls des éléments SANS étiquette sont visibles garde son titre et son entrée au rendu', () => {
    const sankey = styledSankey({ visible_nodes_list: [makeElement([])] })
    sankey.node_taggs_list[0].style_id = 'S_color'
    const rendered = renderableLegendItems(computeLegendItems(sankey, base_config, { t_untagged }))
    expect(rendered.map(i => i.id)).toEqual(['legend-group-fiab', 'legend-untagged-fiab'])
  })
})

describe('SA#545 — carré d\'un flux « Hachuré »', () => {
  it('assez large pour montrer au moins deux vides entiers de tirets', () => {
    const item = { id: 'legend-tag-g-t', text: 'T', swatch_color: '#f00', format: { swatch: { link_dashed: true } } }
    const width = legendSwatchWidth(item, base_config.police)
    const period = LINK_DASH_LENGTH + LINK_DASH_GAP
    // Vides en [k·période − vide, k·période[ : il faut atteindre la fin du 2ᵉ
    expect(width).toBeGreaterThanOrEqual(2 * period)
    expect(Math.floor(width / period)).toBeGreaterThanOrEqual(2)
  })

  it('le carré d\'une valeur d\'exemple, déjà plus large, n\'est pas réduit', () => {
    const item = { id: 'legend-tag-g-t', text: 'T', swatch_color: '#f00', format: { swatch: { link_dashed: true }, value: { bold: true } } }
    expect(legendSwatchWidth(item, 40)).toBe(40 * LEGEND_SAMPLE_SWATCH_EM)
  })
})

describe('SA#545 — mise en page', () => {
  it('un carré qui porte la valeur d\'exemple est plus large qu\'une pastille', () => {
    const sankey = styledSankey()
    const items = computeLegendItems(sankey, { ...base_config, horizontal: true })
      .filter(i => i.tag_id === 'full' || i.tag_id === 'color')
    // Même texte de 4 lettres pour comparer les seules largeurs de carré
    items.forEach(i => { i.text = 'XXXX' })
    const [full, color] = items
    const positions = layoutLegendItems([full, color, { ...color, id: 'legend-next' }], { ...base_config, horizontal: true })
    const full_advance = positions[1].x - positions[0].x
    const color_advance = positions[2].x - positions[1].x
    expect(full_advance - color_advance).toBeCloseTo((LEGEND_SAMPLE_SWATCH_EM - 1) * base_config.police)
  })
})
