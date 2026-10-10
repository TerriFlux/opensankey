// os#1527 — UN MODELE DE LEGENDE COMMUN aux couronnes et au Sankey (Julien, 10/10) : une meme
// dimension hierarchique donne les memes lignes des deux cotes — ordre du dessin, en-tetes gras sans
// pastille, retraits relatifs, Autres en dernier.

import { computeLegendItems, Type_LegendConfigValues, Type_LegendItem, Type_SankeyForLegend } from './legendItems'
import { dimensionLegendRows, legendSwatchMarkup, sortLegendRowsByDrawing, type Type_LegendRow } from './legendRows'
import { appendLegendRows } from './legendRowsDom'
import { couronneLegendRows, drawnLegendRows } from '../Charts/legendChecks'
import { memberSectorId } from '../Charts/memberSectorId'

const config: Type_LegendConfigValues = {
  masked: false, managed: true, police: 12, bg_border: false, bg_color: '#ffffff', bg_opacity: 0,
  horizontal: false, width: 180, display_scale: false, scale_unit: '', scale_ratio: 1, show_dataTags: false,
  show_constraints: false, show_data_type: false, info_link_value_void: false, entry_template: ''
}

// Monde > Europe > (France, Allemagne) ; Monde > Afrique ; Monde > Asie
type M = { id: string, name: string, display_name: string, color: string, parent?: M, children: M[] }
const member = (id: string, color: string, parent?: M): M => {
  const m: M = { id, name: id, display_name: id[0].toUpperCase() + id.slice(1), color, parent, children: [] }
  parent?.children.push(m)
  return m
}
const monde = member('monde', '#000000')
const europe = member('europe', '#111111', monde)
const france = member('france', '#aa0000', europe)
const allemagne = member('allemagne', '#00aa00', europe)
const afrique = member('afrique', '#0000aa', monde)
const asie = member('asie', '#aaaa00', monde)
const ALL = [monde, europe, france, allemagne, afrique, asie]
// Les membres dessines (Asie part dans Autres), et l ORDRE DU DESSIN : Afrique, puis l Europe
// (Allemagne avant France), comme le rangement par valeur des bandes et des secteurs.
const LISTED = [france, allemagne, afrique]
const DRAWN = [afrique, allemagne, france]

const sankeyRows = (): Type_LegendItem[] => {
  const group: Type_SankeyForLegend['data_taggs_list'][number] = {
    id: 'pays', name: 'Pays', use_colors: false, draws_members_in_color: true,
    selected_tags_list: LISTED, tags_list: ALL,
    members_drawn_in_bands: { members: new Set(LISTED.map(m => m.id)), has_others: true },
    legendMembersOrder: tags => [...tags].sort((a, b) =>
      DRAWN.findIndex(m => m.id === a.id) - DRAWN.findIndex(m => m.id === b.id))
  }
  const sankey: Type_SankeyForLegend = {
    node_taggs_list: [], flux_taggs_list: [], data_taggs_list: [group], visible_nodes_list: [], visible_links_list: []
  }
  return computeLegendItems(sankey, config, { t_others: 'Autres' })
}

const couronneRows = (): Type_LegendRow[] => {
  const listed = new Map(LISTED.map(m => [m.id, { checked: true }]))
  const block = couronneLegendRows({ id: 'pays' }, [monde], listed, [], m => m.display_name,
    (m, a) => { for (let p = m.parent; p !== undefined; p = p.parent) if (p === a) return true; return false })
  const rank = new Map(DRAWN.map((m, i) => [memberSectorId('pays', m.id), i]))
  const color = new Map(ALL.map(m => [memberSectorId('pays', m.id), m.color]))
  return [
    { key: 'title', kind: 'title', label: 'Pays', indent: 0 },
    ...drawnLegendRows(block, id => color.get(id), '#cccccc', id => rank.get(id)),
    { key: 'others', kind: 'others', label: 'Autres', indent: 0, swatch: '#cccccc' }
  ]
}

type Shape = [string, string, number, boolean]
const fromItems = (items: Type_LegendItem[]): Shape[] => items.map(i => [
  i.group_title === true ? 'title' : i.heading === true ? 'heading' : i.tag_id === undefined ? 'others' : 'entry',
  i.text, i.indent ?? 0, i.heading !== true && i.group_title !== true && i.swatch_color !== undefined
])
const fromRows = (rows: Type_LegendRow[]): Shape[] => rows.map(r => [r.kind, r.label, r.indent, r.swatch !== undefined])

describe('os#1527 — une meme dimension hierarchique, les memes lignes', () => {
  test('Sankey : ordre du dessin, en-tete sans pastille, retraits relatifs, Autres en dernier', () => {
    expect(fromItems(sankeyRows())).toEqual([
      ['title', 'Pays', 0, false],
      ['entry', 'Afrique', 0, true],
      ['heading', 'Europe', 0, false],
      ['entry', 'Allemagne', 1, true],
      ['entry', 'France', 1, true],
      ['others', 'Autres', 0, true]
    ])
  })

  test('couronne et Sankey : les memes lignes', () => {
    expect(fromRows(couronneRows())).toEqual(fromItems(sankeyRows()))
  })

  test('les identifiants de zone du Sankey restent ceux d avant', () => {
    expect(sankeyRows().map(i => i.id)).toEqual([
      'legend-group-pays', 'legend-tag-pays-afrique', 'legend-heading-pays-europe',
      'legend-tag-pays-allemagne', 'legend-tag-pays-france', 'legend-tag-pays-__autres__'
    ])
  })

  test('un membre decoche (non dessine) reste derriere son voisin', () => {
    const rows = dimensionLegendRows({ id: 'pays' }, { listed: LISTED, labelOf: m => m.display_name })
      .map(r => r.target?.member_id === 'france' ? { ...r, checked: false } : r)
    const sorted = sortLegendRowsByDrawing(rows, r => r.target?.member_id === 'france' ? undefined
      : DRAWN.findIndex(m => m.id === r.target?.member_id))
    expect(sorted.map(r => r.label)).toEqual(['Afrique', 'Europe', 'France', 'Allemagne'])
  })

  test('un membre coche sans rien a dessiner va en fin de son niveau', () => {
    const rows = dimensionLegendRows({ id: 'pays' }, { listed: LISTED, labelOf: m => m.display_name })
      .map(r => r.kind === 'entry' ? { ...r, checked: true } : r)
    const sorted = sortLegendRowsByDrawing(rows, r => r.target?.member_id === 'afrique' ? undefined
      : DRAWN.findIndex(m => m.id === r.target?.member_id))
    expect(sorted.map(r => r.label)).toEqual(['Europe', 'Allemagne', 'France', 'Afrique'])
  })
})

describe('os#1527 — le rendu commun', () => {
  afterEach(() => { document.body.innerHTML = '' })

  test('en-tete gras sans pastille ni case ; entree a pastille et case ; decochee grisee', () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const rows: Type_LegendRow[] = [
      { key: 'h', kind: 'heading', label: 'Europe', indent: 0 },
      { key: 'f', kind: 'entry', label: 'France', indent: 1, swatch: '#aa0000', checked: true },
      { key: 'a', kind: 'entry', label: 'Allemagne', indent: 1, swatch: '#00aa00', checked: false }
    ]
    const toggled: [string, boolean][] = []
    const placed = appendLegendRows(host, rows, { font_px: 12, onToggle: (row, show) => toggled.push([row.key, show]) })
    const [h, f, a] = placed.map(p => p.el)
    expect(h.style.fontWeight).toBe('600')
    expect(h.querySelector('svg')).toBeNull()
    expect(h.querySelector('input')).toBeNull()
    expect(f.querySelector('svg.legend_swatch rect')?.getAttribute('fill')).toBe('#aa0000')
    expect(f.style.marginLeft).toBe('1em')
    expect(a.classList.contains('node_stats_legend_unchecked')).toBe(true)
    expect(a.querySelector('svg.legend_swatch rect')?.getAttribute('fill')).not.toBe('#00aa00')
    ;(a.querySelector('input') as HTMLInputElement).click()
    expect(toggled).toEqual([['a', true]])
    expect(host.style.fontSize).toBe('12px')
  })

  test('une seule pastille : couleur, ou format d etiquette (pointilles elargis)', () => {
    expect(legendSwatchMarkup('#123456')).toContain('fill="#123456"')
    const dashed = legendSwatchMarkup({ color: '#123456', format: { swatch: { link_dashed: true } } })
    expect(dashed).toContain('stroke-dasharray')
    expect(dashed).toContain('viewBox="0 0 28 14"')
    expect(legendSwatchMarkup(undefined)).toBe('')
  })
})
