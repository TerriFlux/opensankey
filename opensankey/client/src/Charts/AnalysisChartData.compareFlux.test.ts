import { buildAnalysisChartData, Type_AnalysisDescriptor, Type_ChartSubject } from './AnalysisChartData'
import { drawBarChart } from './NodeStatsCharts'

// Issue #389 — comparer selon les flux d'un nœud : une SÉRIE par flux (donc une
// barre à l'abscisse), libellée et colorée par le nœud d'en face, au lieu des parts
// d'une couronne. Cas d'usage : les rendements (kt/ha) des flux « Blé tendre → Bio »
// et « Blé tendre → Conventionnel » se juxtaposent, ils ne s'additionnent pas.
//
// Le module d'extraction est PUR : il ne lit du modèle que quelques propriétés, ce
// qui permet de le tester sur des doubles typés à la structure (mêmes doubles que
// les autres tests de logique pure du dépôt) plutôt que sur un diagramme complet.

const makeNode = (id: string, name: string, color: string) => ({
  id,
  name,
  sankey: { data_taggs_dict: {} },
  input_links_list: [] as unknown[],
  output_links_list: [] as unknown[],
  getShapeColorToUse: () => color
})

const link = (
  id: string,
  source: ReturnType<typeof makeNode>,
  target: ReturnType<typeof makeNode>,
  value: number | null,
  is_visible = true
) => {
  const l = { id, source, target, valueCurrent: value, is_visible }
  source.output_links_list.push(l)
  target.input_links_list.push(l)
  return l
}

// « Blé tendre » distribue vers deux modes de production, plus un flux masqué.
const buildFixture = () => {
  const ble = makeNode('n_ble', 'Blé tendre', '#c8b400')
  const bio = makeNode('n_bio', 'Bio', '#2e8b57')
  const conv = makeNode('n_conv', 'Conventionnel', '#8b4513')
  const masque = makeNode('n_masque', 'Jachère', '#999999')
  const amont = makeNode('n_amont', 'Semences', '#4169e1')
  link('l_bio', ble, bio, 3.2)
  link('l_conv', ble, conv, 7.4)
  link('l_masque', ble, masque, 1.1, false)
  link('l_amont', amont, ble, 0.5)
  return { ble, bio, conv, amont }
}

const subjectOf = (node: ReturnType<typeof makeNode>): Type_ChartSubject =>
  ({ kind: 'node', node } as unknown as Type_ChartSubject)

describe('#389 — comparer selon les flux sortants', () => {
  it('une série par flux sortant visible, libellée par le nœud d’en face', () => {
    const { ble } = buildFixture()
    const data = buildAnalysisChartData(subjectOf(ble), { decompose: null, compare: { kind: 'outputs' } })
    expect(data.series.map(s => s.label)).toEqual(['Bio', 'Conventionnel'])
    expect(data.series.map(s => s.parts[0].value)).toEqual([3.2, 7.4])
  })

  it('chaque série porte UNE part (une barre, jamais un empilement)', () => {
    const { ble } = buildFixture()
    const data = buildAnalysisChartData(subjectOf(ble), { decompose: null, compare: { kind: 'outputs' } })
    data.series.forEach(s => expect(s.parts).toHaveLength(1))
  })

  it('la couleur est celle du nœud d’en face (couleurs du modèle, pas de palette)', () => {
    const { ble } = buildFixture()
    const data = buildAnalysisChartData(subjectOf(ble), { decompose: null, compare: { kind: 'outputs' } })
    expect(data.series.map(s => s.color)).toEqual(['#2e8b57', '#8b4513'])
  })

  it('les flux masqués sont exclus (le graphique suit ce qui est à l’écran)', () => {
    const { ble } = buildFixture()
    const data = buildAnalysisChartData(subjectOf(ble), { decompose: null, compare: { kind: 'outputs' } })
    expect(data.series.map(s => s.id)).not.toContain('l_masque')
  })
})

describe('#389 — comparer selon les flux entrants', () => {
  it('lit le côté amont, libellé par la source', () => {
    const { ble } = buildFixture()
    const data = buildAnalysisChartData(subjectOf(ble), { decompose: null, compare: { kind: 'inputs' } })
    expect(data.series.map(s => s.label)).toEqual(['Semences'])
    expect(data.series[0].parts[0].value).toBe(0.5)
  })
})

describe('#389 — l’axe additif est neutralisé, pas croisé', () => {
  it('une décomposition résiduelle ne produit PAS d’empilement sous chaque barre', () => {
    const { ble } = buildFixture()
    const data = buildAnalysisChartData(subjectOf(ble), {
      decompose: { kind: 'outputs' },
      compare: { kind: 'outputs' }
    })
    // Sans neutralisation, chaque série porterait la décomposition ENTIÈRE du nœud
    // (les mêmes 2 parts répétées sous chaque barre) — donc des rendements sommés.
    expect(data.has_decompose).toBe(false)
    data.series.forEach(s => expect(s.parts).toHaveLength(1))
  })
})

describe('#389 — un nœud sans flux du côté demandé', () => {
  it('ne renvoie aucune série (le moteur de rendu affiche son message « vide »)', () => {
    const { bio } = buildFixture()
    const data = buildAnalysisChartData(subjectOf(bio), { decompose: null, compare: { kind: 'outputs' } })
    expect(data.series).toEqual([])
  })
})

// Le rendu tel que la PRODUCTION le fait. Depuis la réduction de l'onglet Analyse
// (lot 7 du chantier « figures »), il n'y a plus de routeur descripteur → moteur : la
// représentation « Barres » de `registerOSPRepresentations` extrait les données, en
// aplatit les parts et appelle le moteur elle-même. Les tests refont ce même appel,
// sans indirection.
//
// Ce qui se joue : comparer selon les flux donne UNE part par série — soit une barre
// par flux, jamais un empilement, qui rendrait visuellement additifs des rendements.
describe('#389 — rendu en barres des données extraites', () => {
  // L'aplatissement de `flatParts` (registerOSPRepresentations) dans le cas « comparer
  // selon les flux » : chaque série EST un flux, donc sa part unique.
  const barParts = (subject: Type_ChartSubject, desc: Type_AnalysisDescriptor) =>
    buildAnalysisChartData(subject, desc).series.map(s => s.parts[0]).filter(Boolean)

  // Les moteurs lisent clientWidth/clientHeight, nuls sous jsdom : sans taille, ils
  // se replient sur le message « vide » et le test ne prouverait rien.
  const sizedContainer = () => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'clientWidth', { value: 400 })
    Object.defineProperty(el, 'clientHeight', { value: 300 })
    document.body.appendChild(el)
    return el
  }

  it('une barre par flux, libellée et colorée par le nœud d’en face', () => {
    const { ble } = buildFixture()
    const el = sizedContainer()
    drawBarChart(el, barParts(subjectOf(ble), { decompose: null, compare: { kind: 'outputs' } }))
    const rects = Array.from(el.querySelectorAll('svg rect'))
    expect(rects).toHaveLength(2)
    expect(rects.map(r => r.getAttribute('fill'))).toEqual(['#2e8b57', '#8b4513'])
    // Le <text> porte un <title> d'info-bulle en enfant : le libellé visible est le
    // PREMIER nœud texte, pas le textContent (qui concaténerait l'info-bulle).
    const labels = Array.from(el.querySelectorAll('text.node_stats_bar_label'))
      .map(t => t.childNodes[0]?.textContent)
    expect(labels).toEqual(['Bio', 'Conventionnel'])
  })

  it('les barres sont à l’échelle des valeurs (7,4 plus haute que 3,2)', () => {
    const { ble } = buildFixture()
    const el = sizedContainer()
    drawBarChart(el, barParts(subjectOf(ble), { decompose: null, compare: { kind: 'outputs' } }))
    const heights = Array.from(el.querySelectorAll('svg rect'))
      .map(r => Number(r.getAttribute('height')))
    expect(heights[1]).toBeGreaterThan(heights[0])
  })

  it('une décomposition résiduelle ne produit PAS de rectangles empilés', () => {
    const { ble } = buildFixture()
    const el = sizedContainer()
    drawBarChart(el, barParts(subjectOf(ble), {
      decompose: { kind: 'outputs' },
      compare: { kind: 'outputs' }
    }))
    // Empilé, chaque barre porterait plusieurs rectangles : on en attend un par flux.
    expect(el.querySelectorAll('svg rect')).toHaveLength(2)
  })
})
