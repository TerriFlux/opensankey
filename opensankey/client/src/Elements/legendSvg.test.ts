import { legendToSvg, wrapText, type Type_LegendSvgConfig } from './legendSvg'
import { navigationSummary, colouredLegendItems, legendColorerOf } from './legendColumn'
import type { Type_LegendItem } from './legendItems'

// os#1527 lot 1 — la legende de la colonne dans les images : fonction pure, du SVG en chaine.

const config = (over: Partial<Type_LegendSvgConfig> = {}): Type_LegendSvgConfig => ({
  police: 12, width: 200, horizontal: false, bg_color: '#ffffff', bg_opacity: 0, bg_border: false, ...over
})

const items: Type_LegendItem[] = [
  { id: 'legend-group-fiab', text: 'Fiabilite', own_line: true, group_title: true, block_id: 'legend-block-fiab', bold: true },
  { id: 'legend-tag-fiab-full', text: 'Full', swatch_color: '#ff0000', tag_group_id: 'fiab', tag_id: 'full', block_id: 'legend-block-fiab' },
  { id: 'legend-tag-fiab-indic', text: 'Indicative', swatch_color: '#00ff00', tag_group_id: 'fiab', tag_id: 'indic', block_id: 'legend-block-fiab' },
  { id: 'legend-tag-fiab-off', text: 'Masquee', swatch_color: '#0000ff', tag_group_id: 'fiab', tag_id: 'off', block_id: 'legend-block-fiab', dimmed: true }
]

const parse = (svg: string): Document =>
  new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${svg}</svg>`, 'image/svg+xml')

const texts = (doc: Document): string[] => Array.from(doc.querySelectorAll('text')).map(t => t.textContent ?? '')

describe('os#1527 legendToSvg', () => {
  test('rend les entrees : une pastille par etiquette, les noms, pas l etiquette decochee', () => {
    const out = legendToSvg(items, config())
    const doc = parse(out.svg)
    expect(doc.querySelector('parsererror')).toBeNull()
    expect(texts(doc)).toEqual(['Fiabilite', 'Full', 'Indicative'])
    const fills = Array.from(doc.querySelectorAll('rect')).map(r => r.getAttribute('fill'))
    expect(fills).toEqual(expect.arrayContaining(['#ff0000', '#00ff00']))
    expect(fills).not.toContain('#0000ff')
    expect(out.width).toBeGreaterThan(0)
    expect(out.height).toBeGreaterThan(0)
  })

  test('etiquettes masquees gardees : la decochee revient, grisee', () => {
    const doc = parse(legendToSvg(items, config({ show_hidden_tags: true })).svg)
    expect(texts(doc)).toContain('Masquee')
    expect(Array.from(doc.querySelectorAll('rect')).map(r => r.getAttribute('fill'))).not.toContain('#0000ff')
  })

  test('ligne de resume en tete', () => {
    const doc = parse(legendToSvg(items, config({ summary: 'Volailles · 2023 · kt' })).svg)
    expect(texts(doc)[0]).toBe('Volailles · 2023 · kt')
    expect(doc.querySelector('.legend_export_summary')).not.toBeNull()
    // Le resume seul suffit a faire une legende
    expect(legendToSvg([], config({ summary: 'Volailles' })).svg).not.toBe('')
  })

  test('vertical empile, horizontal enchaine sur une ligne', () => {
    const ys = (svg: string) => Array.from(parse(svg).querySelectorAll('tspan')).map(t => Number(t.getAttribute('y')))
    const vertical = legendToSvg(items, config()).svg
    const v = ys(vertical)
    expect(new Set(v).size).toBe(v.length)
    const horizontal = legendToSvg(items, config({ horizontal: true, width: 600 }))
    const h = ys(horizontal.svg)
    // Titre et entrees sur la meme ligne
    expect(new Set(h).size).toBe(1)
    expect(horizontal.height).toBeLessThan(legendToSvg(items, config()).height)
  })

  test('retour a la ligne a la largeur de la legende', () => {
    expect(wrapText('un deux trois quatre cinq six', 10, 40).length).toBeGreaterThan(1)
    const long: Type_LegendItem = { id: 'legend-tag-x', text: 'un nom tres long qui ne tient pas sur une ligne', swatch_color: '#123456' }
    const doc = parse(legendToSvg([long], config({ width: 80 })).svg)
    expect(doc.querySelectorAll('tspan').length).toBeGreaterThan(1)
  })

  test('police et facteur k', () => {
    const doc = parse(legendToSvg(items, config({ police: 10 }), 2).svg)
    expect(doc.querySelector('text')?.getAttribute('font-size')).toBe('20')
  })

  test('fond, bordure et barre d echelle', () => {
    const scale: Type_LegendItem = { id: 'legend-scale', text: 'Echelle : 50 kt', own_line: true, scale_bar: true }
    const doc = parse(legendToSvg([...items, scale], config({ bg_opacity: 50, bg_color: '#eeeeee', bg_border: true, scale_bar_height: 40 })).svg)
    const bg = doc.querySelector('.legend_export_background')
    expect(bg?.getAttribute('fill')).toBe('#eeeeee')
    expect(bg?.getAttribute('fill-opacity')).toBe('0.5')
    expect(bg?.getAttribute('stroke')).not.toBeNull()
    expect(Array.from(doc.querySelectorAll('rect')).some(r => r.getAttribute('height') === '40')).toBe(true)
  })

  test('masquee ou vide : rien', () => {
    expect(legendToSvg(items, config({ masked: true }))).toEqual({ svg: '', width: 0, height: 0 })
    expect(legendToSvg([], config())).toEqual({ svg: '', width: 0, height: 0 })
  })

  test('textes echappes', () => {
    const doc = parse(legendToSvg([{ id: 'legend-x', text: 'A & B <c>', swatch_color: '#000000' }], config()).svg)
    expect(doc.querySelector('parsererror')).toBeNull()
    expect(texts(doc)).toEqual(['A & B <c>'])
  })
})

describe('os#1527 resume de la navigation et entrees de la colonne', () => {
  const dim = (id: string, name: string, tags: string[], over: object = {}) => ({
    id, name, selected_tags_list: tags.map(t => ({ name: t, display_name: t })), ...over
  })

  test('un membre par dimension, Selection de quand plusieurs, sans la dimension qui colore', () => {
    const dims = [
      dim('fil', 'Filiere', ['Ble', 'Mais'], { draws_bands: true }),
      dim('an', 'Annee', ['2023']),
      dim('u', 'Unite', ['kt']),
      dim('prod', 'Produit', ['Volailles', 'Porcs'])
    ]
    expect(legendColorerOf(dims)?.id).toBe('fil')
    expect(navigationSummary(dims)).toBe('2023 · kt · Sélection de produits')
    const t = (key: string, o?: { [k: string]: unknown }) => key === 'Banner.title_selection' ? `Selection of ${o?.name}` : key
    expect(navigationSummary(dims, t)).toBe('2023 · kt · Selection of produits')
  })

  test('colouredLegendItems : seule la dimension qui porte la couleur, par le releve donne', () => {
    const app = {
      drawing_area: {
        legend: { tagGroupIdOfTitle: () => undefined },
        sankey: { data_taggs_list: [dim('fil', 'Filiere', ['Ble', 'Mais'], { draws_bands: true }), dim('an', 'Annee', ['2023'])] }
      }
    }
    const list: Type_LegendItem[] = [
      { id: 'legend-group-fil', text: 'Filiere', own_line: true, block_id: 'legend-block-fil' },
      { id: 'legend-tag-fil-ble', text: 'Ble', tag_group_id: 'fil', block_id: 'legend-block-fil' },
      { id: 'legend-group-an', text: 'Annee', own_line: true, block_id: 'legend-block-an' },
      { id: 'legend-tag-an-2023', text: '2023', tag_group_id: 'an', block_id: 'legend-block-an' },
      { id: 'legend-datatag-an', text: 'Annee : 2023' }
    ]
    expect(colouredLegendItems(app, list).map(i => i.id)).toEqual(['legend-group-fil', 'legend-tag-fil-ble'])
  })
})
