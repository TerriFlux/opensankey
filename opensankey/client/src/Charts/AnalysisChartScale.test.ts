import { buildAnalysisChartData, Type_AnalysisDescriptor, Type_ChartSubject } from './AnalysisChartData'
import {
  countLifted,
  drawBarChart,
  drawGroupedBarChart,
  drawStackedBarChart,
  resolveScaleMode,
  visibilityLift
} from './NodeStatsCharts'

// Libellés explicites : sans eux les moteurs retombent sur leurs défauts anglais et le
// test ne dirait pas QUELLE mention est apparue.
const LABELS = {
  out_of_scale_label: (n: number) => `plancher:${n}`,
  independent_scales_label: 'echelles-par-grappe'
}

// Le rendu tel que la PRODUCTION le fait. Depuis la réduction de l'onglet Analyse (lot 7
// du chantier « figures »), il n'y a plus de routeur descripteur → moteur : chaque
// surface extrait les données puis appelle le moteur elle-même. Ces trois helpers
// refont ces appels, sans indirection — et c'est le DESCRIPTEUR qui porte le régime
// d'échelle (#393), exactement comme dans `registerOSPRepresentations`.
const drawGrouped = (
  el: HTMLElement,
  subject: Type_ChartSubject,
  desc: Type_AnalysisDescriptor
) => drawGroupedBarChart(
  el,
  buildAnalysisChartData(subject, desc).groups ?? [],
  { ...LABELS, scale_mode: desc.scale_mode ?? 'auto' }
)

// Hors croisement, la représentation « Barres » aplatit les parts (cf. `flatParts`) :
// comparer selon les flux donne une part par série, soit une barre par flux.
const drawFlatBars = (
  el: HTMLElement,
  subject: Type_ChartSubject,
  desc: Type_AnalysisDescriptor
) => drawBarChart(
  el,
  buildAnalysisChartData(subject, desc).series.map(s => s.parts[0]).filter(Boolean),
  LABELS
)

// L'histogramme EMPILÉ (`decompose × compare`), tel que `DiagramChartRender` l'appelle :
// une barre par série, empilée de sa décomposition.
const drawStacked = (
  el: HTMLElement,
  subject: Type_ChartSubject,
  desc: Type_AnalysisDescriptor
) => drawStackedBarChart(el, buildAnalysisChartData(subject, desc).series, LABELS)

// Issue #393 — rendre lisibles des séries d'ordres de grandeur différents.
//
// Le défaut : une échelle linéaire unique calée sur le maximum global. Tant que les
// valeurs sont commensurables, c'est elle qui les rend comparables — et elle doit
// rester le défaut. Mais dès qu'un axe porte les UNITÉS, « kt » culmine à 40 000
// pendant que « kt par ha » vaut 0,004 : la seconde barre existe, sa valeur est
// juste, et sa hauteur mesurée est de ZÉRO pixel. L'échelle partagée a cessé d'être
// une comparaison pour devenir un effacement.
//
// L'échelle se sépare par GRAPPE — une grappe par étiquette de « Comparer selon »,
// l'axe des abscisses — et jamais par série. La grappe est la seule bande où les
// barres se comparent vraiment : elles y sont côte à côte, sous une même étiquette.
// Lui donner son propre plafond rend chaque grappe lisible en son sein, ce qui est le
// geste utile (comparer Bio et Conventionnel POUR une unité donnée). C'est aussi ce
// qui fait de l'ORDRE des deux axes le levier de l'utilisateur : on met sur l'abscisse
// ce qui est incommensurable.
//
// Hors du croisement, il n'y a pas de grappe : chaque barre est seule de son espèce,
// les normaliser une à une les mettrait toutes au plafond, et un graphique dont toutes
// les hauteurs sont égales ne compare plus rien. Là, seul le plancher de visibilité
// s'applique — annoncé lui aussi.

// ── Doubles typés à la structure (mêmes que #389 / #390) ─────────────────────

const makeTag = (id: string, name: string, color: string) => ({
  id,
  name,
  color,
  is_selected: false,
  setSelected () { this.is_selected = true },
  setUnSelected () { this.is_selected = false }
})

const makeTagg = (id: string, tags: [string, string, string][]) => ({
  id,
  tags_list: tags.map(([tid, name, color]) => makeTag(tid, name, color))
})

type Tagg = ReturnType<typeof makeTagg>
type Sankey = { data_taggs_dict: Record<string, Tagg> }

const makeNode = (sankey: Sankey, id: string, name: string, color: string) => ({
  id,
  name,
  sankey,
  data_value: 0,
  input_links_list: [] as unknown[],
  output_links_list: [] as unknown[],
  getShapeColorToUse: () => color
})

type Node = ReturnType<typeof makeNode>

const linkPerTag = (
  id: string,
  source: Node,
  target: Node,
  tagg: Tagg,
  values: Record<string, number>
) => {
  const l = {
    id,
    source,
    target,
    is_visible: true,
    get valueCurrent (): number {
      const selected = tagg.tags_list.find(t => t.is_selected)
      return selected ? (values[selected.id] ?? 0) : 0
    }
  }
  source.output_links_list.push(l)
  target.input_links_list.push(l)
  return l
}

const fixedLink = (id: string, source: Node, target: Node, value: number) => {
  const l = { id, source, target, is_visible: true, valueCurrent: value }
  source.output_links_list.push(l)
  target.input_links_list.push(l)
  return l
}

const subjectOf = (node: Node): Type_ChartSubject =>
  ({ kind: 'node', node } as unknown as Type_ChartSubject)

// Les moteurs lisent clientWidth/clientHeight, nuls sous jsdom : sans taille, ils se
// replient sur le message « vide » et le test ne prouverait rien.
const sizedContainer = () => {
  const el = document.createElement('div')
  Object.defineProperty(el, 'clientWidth', { value: 600 })
  Object.defineProperty(el, 'clientHeight', { value: 400 })
  document.body.appendChild(el)
  return el
}

const heightsByFill = (el: HTMLElement, fill: string) =>
  [...el.querySelectorAll('rect.node_stats_grouped_bar')]
    .filter(r => r.getAttribute('fill') === fill)
    .map(r => Number(r.getAttribute('height')))

// « Blé tendre » vers deux modes de production, mesuré dans DEUX unités : le tonnage
// et le rendement. Sept ordres de grandeur les séparent — c'est le cas du ticket.
const BIO = '#2e8b57'
const CONV = '#8b4513'
const buildFluxUniteFixture = (ha_bio = 0.0012, ha_conv = 0.0032) => {
  const unites = makeTagg('tagg_unite', [['u_kt', 'kt', '#777777'], ['u_ha', 'kt par ha', '#333333']])
  const sankey: Sankey = { data_taggs_dict: { tagg_unite: unites } }
  const ble = makeNode(sankey, 'n_ble', 'Blé tendre', '#c8b400')
  const bio = makeNode(sankey, 'n_bio', 'Bio', BIO)
  const conv = makeNode(sankey, 'n_conv', 'Conventionnel', CONV)
  linkPerTag('l_bio', ble, bio, unites, { u_kt: 12000, u_ha: ha_bio })
  linkPerTag('l_conv', ble, conv, unites, { u_kt: 28000, u_ha: ha_conv })
  return { ble }
}

// LA configuration visée : une grappe par UNITÉ (abscisse), une barre par FLUX SORTANT
// (série). C'est l'ordre qui met l'incommensurable sur l'abscisse — chaque grappe est
// alors homogène, et l'échelle par grappe la rend lisible en son sein.
const UNITE_X_FLUX = {
  decompose: null,
  compare: { data_tagg_id: 'tagg_unite' },
  compare_secondary: { kind: 'outputs' as const }
}
// L'ordre INVERSE : une grappe par flux, une barre par unité. Chaque grappe mêle alors
// les deux unités — l'échelle par grappe n'y peut rien, et c'est ce qui doit se voir.
const FLUX_X_UNITE = {
  decompose: null,
  compare: { kind: 'outputs' as const },
  compare_secondary: { data_tagg_id: 'tagg_unite' }
}

describe('#393 — décision d’échelle : des fonctions pures, pas une intuition', () => {
  it('le déclencheur est la MESURE, pas la nature du groupe comparé', () => {
    // Deux grappes que 7 ordres de grandeur séparent : sur 336 px, la seconde tient
    // sous le pixel. Aucune lecture du groupe de tags n'intervient ici.
    expect(resolveScaleMode([28000, 0.0032], 336)).toBe('per_group')
    // Deux grappes commensurables : l'échelle partagée est CONSERVÉE, car c'est elle
    // qui les rend comparables. C'est le cas courant, et il ne doit rien voir changer.
    expect(resolveScaleMode([28000, 25000], 336)).toBe('shared')
    expect(resolveScaleMode([8.3, 3.2], 336)).toBe('shared')
  })

  it('le seuil dépend de la HAUTEUR disponible, pas d’un simple rapport', () => {
    // 1/200e : lisible sur 800 px (4 px), écrasé dans un cadre de 200 px (1 px).
    expect(resolveScaleMode([1000, 5], 800)).toBe('shared')
    expect(resolveScaleMode([1000, 5], 200)).toBe('per_group')
  })

  it('un choix explicite l’emporte sur la mesure, dans les deux sens', () => {
    expect(resolveScaleMode([28000, 0.0032], 336, 'shared')).toBe('shared')
    expect(resolveScaleMode([28000, 25000], 336, 'per_group')).toBe('per_group')
  })

  it('une seule grappe n’a pas d’échelle propre à prendre (elle irait au plafond)', () => {
    expect(resolveScaleMode([28000], 336, 'per_group')).toBe('shared')
    expect(resolveScaleMode([28000, 0], 336)).toBe('shared')
  })

  it('le plancher relève ce qui est sous lui, et RIEN d’autre', () => {
    expect(visibilityLift(40)).toBe(1)
    expect(visibilityLift(0.5)).toBe(4) // 0,5 px × 4 = le plancher de 2 px
    // Une valeur nulle n'a rien à montrer : la hisser inventerait une quantité.
    expect(visibilityLift(0)).toBe(1)
  })

  it('countLifted compte les BARRES relevées, jamais les barres nulles', () => {
    // Hauteurs en pixels : 300 est visible, 0,4 sera relevé au plancher, 0 n'est rien.
    expect(countLifted([300, 0.4, 0])).toBe(1)
    expect(countLifted([300, 120])).toBe(0)
  })
})

describe('#393 — le cas visé : une grappe par unité, une barre par flux sortant', () => {
  it('AUTO : chaque grappe prend son plafond, et Bio/Conventionnel y redevient lisible', () => {
    const { ble } = buildFluxUniteFixture()
    const el = sizedContainer()
    drawGrouped(el, subjectOf(ble), UNITE_X_FLUX)
    const bio = heightsByFill(el, BIO)   // [kt, kt par ha]
    const conv = heightsByFill(el, CONV)
    expect(bio).toHaveLength(2)
    // Dans CHAQUE grappe, la plus haute barre touche le plafond : la grappe « kt par
    // ha » occupe enfin toute la hauteur au lieu de tenir dans un pixel.
    expect(conv[0]).toBeCloseTo(conv[1], 5)
    // Et surtout : DANS la grappe, le rapport entre les deux modes est le rapport
    // RÉEL. C'est le geste utile — comparer les rendements de Bio et de Conventionnel.
    expect(bio[0] / conv[0]).toBeCloseTo(12000 / 28000, 5)
    expect(bio[1] / conv[1]).toBeCloseTo(0.0012 / 0.0032, 5)
  })

  it('AUTO : le changement d’échelle est ANNONCÉ, et chaque grappe porte son plafond', () => {
    // Le risque de l'échelle par grappe est qu'un lecteur qui l'ignore lise un rapport
    // là où il n'y en a plus. La mention et les plafonds sont ce qui l'en empêche.
    const { ble } = buildFluxUniteFixture()
    const el = sizedContainer()
    drawGrouped(el, subjectOf(ble), UNITE_X_FLUX)
    expect(el.querySelector('div.node_stats_legend_independent_scales')?.textContent)
      .toBe('echelles-par-grappe')
    // Chaque grappe étant montée à son propre plafond, plus aucune barre au plancher.
    expect(el.querySelector('div.node_stats_legend_out_of_scale')).toBeNull()
    // Le plafond de chaque grappe vit dans l'info-bulle de son libellé d'abscisse.
    const titles = [...el.querySelectorAll('text.node_stats_bar_label title')].map(t => t.textContent)
    expect(titles[0]?.startsWith('kt\n')).toBe(true)
    expect(titles[1]?.startsWith('kt par ha\n')).toBe(true)
  })

  it('ÉCHELLE PARTAGÉE : la grappe minuscule est DESSINÉE, et l’écrasement annoncé', () => {
    // Le défaut du ticket : ces barres mesuraient 0 px. Elles tiennent désormais au
    // plancher de visibilité — leur hauteur ne dit plus rien de leur valeur, et c'est
    // précisément ce que la mention doit dire à l'écran.
    const { ble } = buildFluxUniteFixture()
    const el = sizedContainer()
    drawGrouped(el, subjectOf(ble), { ...UNITE_X_FLUX, scale_mode: 'shared' })
    expect(heightsByFill(el, BIO)[1]).toBeCloseTo(2, 5)
    expect(heightsByFill(el, CONV)[1]).toBeCloseTo(2, 5)
    // La mention compte les BARRES relevées — ici les deux de la grappe « kt par ha ».
    expect(el.querySelector('div.node_stats_legend_out_of_scale')?.textContent).toBe('plancher:2')
    expect(el.querySelector('div.node_stats_legend_independent_scales')).toBeNull()
  })

  it('des grappes COMMENSURABLES ne voient rien changer (le défaut est préservé)', () => {
    // Mêmes axes, mais les deux unités sont du même ordre : l'échelle partagée reste,
    // sans mention — et les hauteurs gardent leur rapport RÉEL entre grappes.
    const { ble } = buildFluxUniteFixture(10000, 25000)
    const el = sizedContainer()
    drawGrouped(el, subjectOf(ble), UNITE_X_FLUX)
    expect(el.querySelector('div.node_stats_legend_independent_scales')).toBeNull()
    // Aucune barre au plancher non plus : les DEUX flux sont commensurables dans les
    // deux unités. Ne changer qu'un des deux laisserait l'autre au plancher — c'est
    // l'erreur de fixture que ce test a attrapée.
    expect(el.querySelector('div.node_stats_legend_out_of_scale')).toBeNull()
    expect(heightsByFill(el, CONV)[1] / heightsByFill(el, CONV)[0]).toBeCloseTo(25000 / 28000, 5)
  })

  it('« par grappe » forcé s’applique même quand la mesure ne l’exigeait pas', () => {
    const { ble } = buildFluxUniteFixture(10000, 25000)
    const el = sizedContainer()
    drawGrouped(el, subjectOf(ble), { ...UNITE_X_FLUX, scale_mode: 'per_group' })
    expect(el.querySelector('div.node_stats_legend_independent_scales')).not.toBeNull()
    const conv = heightsByFill(el, CONV)
    expect(conv[0]).toBeCloseTo(conv[1], 5)
  })
})

describe('#393 — l’ORDRE des deux axes est le levier de l’utilisateur', () => {
  it('l’unité en SÉRIE laisse chaque grappe hétérogène : l’échelle n’y peut rien', () => {
    // Ordre inverse : une grappe par flux, deux unités DANS chaque grappe. Séparer les
    // échelles par grappe ne sépare alors rien — les deux unités restent dans la même.
    // Le plancher garde les barres visibles, et c'est tout ce qui est honnête ici : à
    // l'utilisateur de mettre l'incommensurable sur l'abscisse.
    const { ble } = buildFluxUniteFixture()
    const el = sizedContainer()
    drawGrouped(el, subjectOf(ble), FLUX_X_UNITE)
    const heights = [...el.querySelectorAll('rect.node_stats_grouped_bar')]
      .map(r => Number(r.getAttribute('height')))
    expect(heights).toHaveLength(4)
    // Les deux barres « kt par ha » sont au plancher, pas à zéro.
    expect(heights.filter(h => Math.abs(h - 2) < 1e-5)).toHaveLength(2)
    // Les deux grappes sont commensurables ENTRE ELLES (chacune culmine à son tonnage)
    // → aucune bascule d'échelle : il n'y a rien à séparer.
    expect(el.querySelector('div.node_stats_legend_independent_scales')).toBeNull()
    // Mais le graphique ne se tait pas pour autant : deux barres sont au plancher, et
    // c'est ce qui doit ramener l'utilisateur vers l'autre ordre d'axes.
    expect(el.querySelector('div.node_stats_legend_out_of_scale')?.textContent).toBe('plancher:2')
  })
})

describe('#393 — hors du croisement, le plancher de visibilité seul', () => {
  it('une barre par flux : la minuscule est dessinée et l’écrasement annoncé', () => {
    // Ici il n'y a pas de grappe : chaque barre est seule de son espèce. Leur donner à
    // chacune son échelle les mettrait TOUTES au plafond, et un graphique dont toutes
    // les hauteurs sont égales ne compare plus rien.
    const sankey: Sankey = { data_taggs_dict: {} }
    const ble = makeNode(sankey, 'n_ble', 'Blé tendre', '#c8b400')
    const gros = makeNode(sankey, 'n_gros', 'Tonnage', BIO)
    const petit = makeNode(sankey, 'n_petit', 'Rendement', CONV)
    fixedLink('l_gros', ble, gros, 40000)
    fixedLink('l_petit', ble, petit, 0.004)

    const el = sizedContainer()
    drawFlatBars(el, subjectOf(ble), { decompose: null, compare: { kind: 'outputs' } })
    const heights = [...el.querySelectorAll('svg rect')].map(r => Number(r.getAttribute('height')))
    expect(heights).toHaveLength(2)
    expect(Math.min(...heights)).toBeCloseTo(2, 5)
    expect(el.querySelector('text.node_stats_out_of_scale')?.textContent).toBe('plancher:1')
  })

  it('un histogramme empilé relève la PILE ENTIÈRE, pas ses segments un à un', () => {
    // Relever les segments séparément décollerait le sommet de la barre de son total :
    // l'empilement porte une addition, elle doit rester vraie.
    const annees = makeTagg('tagg_annee', [['t_2019', '2019', '#1f77b4'], ['t_2020', '2020', '#ff7f0e']])
    const sankey: Sankey = { data_taggs_dict: { tagg_annee: annees } }
    const ble = makeNode(sankey, 'n_ble', 'Blé tendre', '#c8b400')
    const bio = makeNode(sankey, 'n_bio', 'Bio', BIO)
    const conv = makeNode(sankey, 'n_conv', 'Conventionnel', CONV)
    linkPerTag('l_bio', ble, bio, annees, { t_2019: 12000, t_2020: 0.001 })
    linkPerTag('l_conv', ble, conv, annees, { t_2019: 28000, t_2020: 0.003 })

    const el = sizedContainer()
    drawStacked(el, subjectOf(ble), {
      decompose: { kind: 'outputs' },
      compare: { data_tagg_id: 'tagg_annee' }
    })
    // Deux barres × deux segments. Celle de 2020 est au plancher : ses deux segments
    // s'additionnent EXACTEMENT à la hauteur plancher, dans le rapport 1/3.
    const rects = [...el.querySelectorAll('svg rect')]
    expect(rects).toHaveLength(4)
    const small = rects.slice(2).map(r => Number(r.getAttribute('height')))
    expect(small[0] + small[1]).toBeCloseTo(2, 5)
    expect(small[1] / (small[0] + small[1])).toBeCloseTo(0.25, 5)
    expect(el.querySelector('div.node_stats_legend_out_of_scale')?.textContent).toBe('plancher:1')
  })
})
