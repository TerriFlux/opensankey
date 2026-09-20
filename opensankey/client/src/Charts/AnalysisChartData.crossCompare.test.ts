import { buildAnalysisChartData, Type_AnalysisDescriptor, Type_ChartSubject } from './AnalysisChartData'
import { drawGroupedBarChart } from './NodeStatsCharts'
import { figureNavigationOf } from './FigureNavigation'

// Le rendu tel que la PRODUCTION le fait. Depuis la réduction de l'onglet Analyse (lot 7
// du chantier « figures »), il n'y a plus de routeur descripteur → moteur : sous un
// croisement de deux axes, la représentation « Barres » de `registerOSPRepresentations`
// passe les GRAPPES extraites au moteur groupé, avec le régime d'échelle du descripteur.
// Ce helper refait ce même appel, sans indirection.
const drawGrouped = (
  el: HTMLElement,
  subject: Type_ChartSubject,
  desc: Type_AnalysisDescriptor
) => drawGroupedBarChart(
  el,
  buildAnalysisChartData(subject, desc).groups ?? [],
  { scale_mode: desc.scale_mode ?? 'auto' }
)

// Issue #390 — croiser DEUX axes non additifs : les flux d'un nœud en abscisse ET
// un groupe de dataTags en séries, rendus en barres GROUPÉES (une grappe par flux,
// une barre par tag dans la grappe). Cas d'usage : le rendement (kt/ha) du blé
// tendre par mode de production, suivi année après année.
//
// Ce qui se joue ici et que l'empilement ne peut pas dire : rien ne s'additionne.
// Deux rendements côte à côte se comparent ; empilés, ils prétendraient composer un
// total. C'est pour ça que le moteur groupé existe à côté de l'empilé.

// ── Doubles typés à la structure (module d'extraction PUR) ───────────────────

const makeTag = (id: string, name: string, color: string) => ({
  id,
  name,
  color,
  is_selected: false,
  setSelected () { this.is_selected = true },
  setUnSelected () { this.is_selected = false }
})

// `tags_dict` et `selected_tags_list` doublent ce que `Class_DataTagGroup` expose : c'est
// par eux que `resolveFigureDataTags` (os#1420) résout une épingle et complète les groupes
// non épinglés avec la sélection courante.
const makeTagg = (id: string, tags: [string, string, string][]) => {
  const tags_list = tags.map(([tid, name, color]) => makeTag(tid, name, color))
  return {
    id,
    tags_list,
    get tags_dict () { return Object.fromEntries(tags_list.map(t => [t.id, t])) },
    get selected_tags_list () { return tags_list.filter(t => t.is_selected) }
  }
}

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

// Un lien dont la valeur DÉPEND du tag sélectionné : c'est exactement ce que le
// balayage du croisement doit exercer. `valueCurrent` est un accesseur, comme dans
// le modèle réel — un nombre figé ne prouverait rien du balayage.
const linkPerTag = (
  id: string,
  source: Node,
  target: Node,
  tagg: Tagg,
  values: Record<string, number>,
  is_visible = true
) => {
  const l = {
    id,
    source,
    target,
    is_visible,
    get valueCurrent (): number {
      const selected = tagg.tags_list.find(t => t.is_selected)
      return selected ? (values[selected.id] ?? 0) : 0
    }
  }
  source.output_links_list.push(l)
  target.input_links_list.push(l)
  return l
}

// « Blé tendre » distribue vers deux modes de production ; le rendement de chacun
// évolue sur trois millésimes. Un troisième flux est masqué à l'écran.
const buildFixture = () => {
  const annees = makeTagg('tagg_annee', [
    ['t_2019', '2019', '#1f77b4'],
    ['t_2020', '2020', '#ff7f0e'],
    ['t_2021', '2021', '#2ca02c']
  ])
  const sankey: Sankey = { data_taggs_dict: { tagg_annee: annees } }
  const ble = makeNode(sankey, 'n_ble', 'Blé tendre', '#c8b400')
  const bio = makeNode(sankey, 'n_bio', 'Bio', '#2e8b57')
  const conv = makeNode(sankey, 'n_conv', 'Conventionnel', '#8b4513')
  const masque = makeNode(sankey, 'n_masque', 'Jachère', '#999999')
  linkPerTag('l_bio', ble, bio, annees, { t_2019: 3.2, t_2020: 3.5, t_2021: 3.1 })
  linkPerTag('l_conv', ble, conv, annees, { t_2019: 7.4, t_2020: 7.9, t_2021: 8.3 })
  linkPerTag('l_masque', ble, masque, annees, { t_2019: 1.1 }, false)
  return { sankey, annees, ble }
}

const subjectOf = (node: Node): Type_ChartSubject =>
  ({ kind: 'node', node } as unknown as Type_ChartSubject)

const FLUX_X_ANNEE = {
  decompose: null,
  compare: { kind: 'outputs' as const },
  compare_secondary: { data_tagg_id: 'tagg_annee' }
}
const ANNEE_X_FLUX = {
  decompose: null,
  compare: { data_tagg_id: 'tagg_annee' },
  compare_secondary: { kind: 'outputs' as const }
}

describe('#390 — flux en abscisse × millésime en séries', () => {
  it('une grappe par flux, une barre par année dans la grappe', () => {
    const { ble } = buildFixture()
    const data = buildAnalysisChartData(subjectOf(ble), FLUX_X_ANNEE)
    expect(data.series.map(s => s.label)).toEqual(['Bio', 'Conventionnel'])
    data.series.forEach(s => expect(s.parts.map(p => p.label)).toEqual(['2019', '2020', '2021']))
  })

  it('chaque cellule est lue AU BON MILLÉSIME (le balayage sélectionne le tag)', () => {
    const { ble } = buildFixture()
    const data = buildAnalysisChartData(subjectOf(ble), FLUX_X_ANNEE)
    expect(data.series[0].parts.map(p => p.value)).toEqual([3.2, 3.5, 3.1])
    expect(data.series[1].parts.map(p => p.value)).toEqual([7.4, 7.9, 8.3])
  })

  it('les barres portent la couleur de leur SÉRIE (le tag), que la légende nomme', () => {
    const { ble } = buildFixture()
    const data = buildAnalysisChartData(subjectOf(ble), FLUX_X_ANNEE)
    data.series.forEach(s =>
      expect(s.parts.map(p => p.color)).toEqual(['#1f77b4', '#ff7f0e', '#2ca02c']))
  })

  it('les flux masqués restent exclus (le graphique suit ce qui est à l’écran)', () => {
    const { ble } = buildFixture()
    const data = buildAnalysisChartData(subjectOf(ble), FLUX_X_ANNEE)
    expect(data.series.map(s => s.id)).toEqual(['l_bio', 'l_conv'])
  })

  it('la sélection initiale du groupe de tags est RESTAURÉE après le balayage', () => {
    const { ble, annees } = buildFixture()
    annees.tags_list[1].setSelected()
    buildAnalysisChartData(subjectOf(ble), FLUX_X_ANNEE)
    expect(annees.tags_list.map(t => t.is_selected)).toEqual([false, true, false])
  })
})

describe('#390 — l’ORDRE des deux axes est signifiant', () => {
  it('millésime en abscisse × flux en séries transpose le tableau', () => {
    const { ble } = buildFixture()
    const data = buildAnalysisChartData(subjectOf(ble), ANNEE_X_FLUX)
    expect(data.series.map(s => s.label)).toEqual(['2019', '2020', '2021'])
    data.series.forEach(s => expect(s.parts.map(p => p.label)).toEqual(['Bio', 'Conventionnel']))
    // Mêmes valeurs, lues dans l'autre sens : c'est bien une transposition, pas un
    // autre calcul — « 2020 » porte les rendements 2020 des deux modes.
    expect(data.series[1].parts.map(p => p.value)).toEqual([3.5, 7.9])
  })

  it('les barres y portent la couleur des flux (le 2nd axe a changé de nature)', () => {
    const { ble } = buildFixture()
    const data = buildAnalysisChartData(subjectOf(ble), ANNEE_X_FLUX)
    expect(data.series[0].parts.map(p => p.color)).toEqual(['#2e8b57', '#8b4513'])
  })
})

describe('#390 — garde-fous de la grammaire, vus depuis l’extraction', () => {
  it('flux × flux n’est pas un croisement : on retombe sur le comportement #389', () => {
    const { ble } = buildFixture()
    const data = buildAnalysisChartData(subjectOf(ble), {
      decompose: null,
      compare: { kind: 'outputs' },
      compare_secondary: { kind: 'inputs' }
    })
    expect(data.is_grouped_cross).toBe(false)
    data.series.forEach(s => expect(s.parts).toHaveLength(1))
  })

  it('un axe FLUX neutralise la décomposition (chaque barre est déjà un flux)', () => {
    const { ble } = buildFixture()
    const data = buildAnalysisChartData(subjectOf(ble), { ...FLUX_X_ANNEE, decompose: { kind: 'outputs' } })
    expect(data.has_decompose).toBe(false)
    ;(data.groups ?? []).forEach(g => g.series.forEach(s => expect(s.parts).toHaveLength(1)))
  })

  it('RÉTRO-COMPAT : sans second axe, la comparaison simple est inchangée', () => {
    const { ble, annees } = buildFixture()
    annees.tags_list[0].setSelected()
    const data = buildAnalysisChartData(subjectOf(ble), { decompose: null, compare: { kind: 'outputs' } })
    expect(data.is_grouped_cross).toBe(false)
    expect(data.series.map(s => s.label)).toEqual(['Bio', 'Conventionnel'])
    data.series.forEach(s => expect(s.parts).toHaveLength(1))
  })
})

// TROIS axes à la fois — l'axe additif n'est neutralisé QUE par un axe flux, jamais
// par le croisement lui-même : « décomposer par flux sortants × comparer selon
// l'année × comparer selon l'unité » est un cas légitime. Une grappe par année, une
// barre par unité, chaque barre empilée par ses flux sortants.
describe('#390 — décomposer × comparer × comparer', () => {
  // Même diagramme, mais la valeur d'un lien dépend MAINTENANT des deux groupes :
  // un tonnage par année, multiplié par le facteur de l'unité choisie.
  const buildTwoGroupFixture = () => {
    const annees = makeTagg('tagg_annee', [['t_2019', '2019', '#1f77b4'], ['t_2020', '2020', '#ff7f0e']])
    const unites = makeTagg('tagg_unite', [['u_kt', 'kt', '#777777'], ['u_ha', 'kt par ha', '#333333']])
    const sankey: Sankey = { data_taggs_dict: { tagg_annee: annees, tagg_unite: unites } }
    const ble = makeNode(sankey, 'n_ble', 'Blé tendre', '#c8b400')
    const bio = makeNode(sankey, 'n_bio', 'Bio', '#2e8b57')
    const conv = makeNode(sankey, 'n_conv', 'Conventionnel', '#8b4513')
    const mk = (id: string, target: Node, base: Record<string, number>) => {
      const l = {
        id, source: ble, target, is_visible: true,
        get valueCurrent (): number {
          const a = annees.tags_list.find(t => t.is_selected)
          const u = unites.tags_list.find(t => t.is_selected)
          if (!a || !u) return 0
          return base[a.id] * (u.id === 'u_ha' ? 0.5 : 1)
        }
      }
      ble.output_links_list.push(l); target.input_links_list.push(l)
    }
    mk('l_bio', bio, { t_2019: 3, t_2020: 5 })
    mk('l_conv', conv, { t_2019: 7, t_2020: 9 })
    return { ble, annees, unites }
  }

  const ANNEE_X_UNITE_DECOMPOSE = {
    decompose: { kind: 'outputs' as const },
    compare: { data_tagg_id: 'tagg_annee' },
    compare_secondary: { data_tagg_id: 'tagg_unite' }
  }

  it('la décomposition SURVIT au croisement de deux groupes de dataTags', () => {
    const { ble } = buildTwoGroupFixture()
    const data = buildAnalysisChartData(subjectOf(ble), ANNEE_X_UNITE_DECOMPOSE)
    expect(data.has_decompose).toBe(true)
    expect(data.is_grouped_cross).toBe(true)
  })

  it('une grappe par année, une barre par unité, chaque barre empilée par ses flux', () => {
    const { ble } = buildTwoGroupFixture()
    const groups = buildAnalysisChartData(subjectOf(ble), ANNEE_X_UNITE_DECOMPOSE).groups ?? []
    expect(groups.map(g => g.label)).toEqual(['2019', '2020'])
    groups.forEach(g => expect(g.series.map(s => s.label)).toEqual(['kt', 'kt par ha']))
    // 2019 en kt : Bio 3 + Conventionnel 7 ; en kt/ha, les mêmes de moitié.
    expect(groups[0].series[0].parts.map(p => [p.label, p.value]))
      .toEqual([['Bio', 3], ['Conventionnel', 7]])
    expect(groups[0].series[1].parts.map(p => [p.label, p.value]))
      .toEqual([['Bio', 1.5], ['Conventionnel', 3.5]])
    // 2020 : les deux tags sont bien croisés, pas seulement le premier.
    expect(groups[1].series[0].parts.map(p => p.value)).toEqual([5, 9])
  })

  it('les segments empilés portent la couleur du MODÈLE (le nœud d’en face)', () => {
    const { ble } = buildTwoGroupFixture()
    const groups = buildAnalysisChartData(subjectOf(ble), ANNEE_X_UNITE_DECOMPOSE).groups ?? []
    expect(groups[0].series[0].parts.map(p => p.color)).toEqual(['#2e8b57', '#8b4513'])
  })

  it('`series` garde le résumé plat : une part par barre, valant son TOTAL empilé', () => {
    const { ble } = buildTwoGroupFixture()
    const data = buildAnalysisChartData(subjectOf(ble), ANNEE_X_UNITE_DECOMPOSE)
    expect(data.series.map(s => s.parts.map(p => p.value))).toEqual([[10, 5], [14, 7]])
  })

  it('les sélections des DEUX groupes sont restaurées après le balayage', () => {
    const { ble, annees, unites } = buildTwoGroupFixture()
    annees.tags_list[1].setSelected()
    unites.tags_list[0].setSelected()
    buildAnalysisChartData(subjectOf(ble), ANNEE_X_UNITE_DECOMPOSE)
    expect(annees.tags_list.map(t => t.is_selected)).toEqual([false, true])
    expect(unites.tags_list.map(t => t.is_selected)).toEqual([true, false])
  })

  it('rendu : 2 grappes × 2 barres × 2 segments = 8 rectangles, empilés DEUX à deux', () => {
    const { ble } = buildTwoGroupFixture()
    const el = document.createElement('div')
    Object.defineProperty(el, 'clientWidth', { value: 600 })
    Object.defineProperty(el, 'clientHeight', { value: 400 })
    document.body.appendChild(el)
    drawGrouped(el, subjectOf(ble), ANNEE_X_UNITE_DECOMPOSE)
    const rects = [...el.querySelectorAll('rect.node_stats_grouped_bar')]
    expect(rects).toHaveLength(8)
    // Empilement DANS la barre : deux rectangles partagent chaque abscisse.
    const xs = rects.map(r => r.getAttribute('x'))
    expect(new Set(xs).size).toBe(4)
    // La couleur passe aux catégories empilées, donc la légende les nomme — et
    // chaque barre reçoit son propre libellé de série sous l'axe.
    expect([...el.querySelectorAll('div.node_stats_legend_item')].map(d => d.textContent))
      .toEqual(['Bio', 'Conventionnel'])
    expect([...el.querySelectorAll('text.node_stats_grouped_serie_label')].map(t => t.childNodes[0].textContent))
      .toEqual(['kt', 'kt par ha', 'kt', 'kt par ha'])
    expect([...el.querySelectorAll('text.node_stats_bar_label')].map(t => t.childNodes[0].textContent))
      .toEqual(['2019', '2020'])
  })
})

// Le rendu des grappes extraites : deux axes de comparaison se lisent en barres
// GROUPÉES, jamais en histogramme empilé.
describe('#390 — rendu en barres groupées', () => {
  // Les moteurs lisent clientWidth/clientHeight, nuls sous jsdom : sans taille, ils
  // se replient sur le message « vide » et le test ne prouverait rien.
  const sizedContainer = () => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'clientWidth', { value: 600 })
    Object.defineProperty(el, 'clientHeight', { value: 400 })
    document.body.appendChild(el)
    return el
  }

  it('2 flux × 3 années → 6 barres distinctes, aucune empilée', () => {
    const { ble } = buildFixture()
    const el = sizedContainer()
    drawGrouped(el, subjectOf(ble), FLUX_X_ANNEE)
    const rects = Array.from(el.querySelectorAll('rect.node_stats_grouped_bar'))
    expect(rects).toHaveLength(6)
    // Empilées, les barres d'une grappe partageraient la même abscisse ; groupées,
    // chacune a la sienne.
    const xs = rects.map(r => r.getAttribute('x'))
    expect(new Set(xs).size).toBe(6)
  })

  it('l’échelle est celle d’UNE barre, pas d’un total empilé', () => {
    const { ble } = buildFixture()
    const el = sizedContainer()
    drawGrouped(el, subjectOf(ble), FLUX_X_ANNEE)
    const heights = Array.from(el.querySelectorAll('rect.node_stats_grouped_bar'))
      .map(r => Number(r.getAttribute('height')))
    // La plus grande valeur (8,3) touche le haut du cadre ; empilée, la grappe
    // « Conventionnel » culminerait à 23,6 et chaque barre serait trois fois plus
    // basse. On vérifie le rapport 3,2 / 8,3 sur la barre la plus courte.
    const max_h = Math.max(...heights)
    const min_h = Math.min(...heights)
    expect(min_h / max_h).toBeCloseTo(3.1 / 8.3, 2)
  })

  it('la légende nomme les SÉRIES (les années), l’abscisse les grappes (les flux)', () => {
    const { ble } = buildFixture()
    const el = sizedContainer()
    drawGrouped(el, subjectOf(ble), FLUX_X_ANNEE)
    const legend = Array.from(el.querySelectorAll('div.node_stats_legend_item'))
      .map(d => d.textContent)
    expect(legend).toEqual(['2019', '2020', '2021'])
    const labels = Array.from(el.querySelectorAll('text.node_stats_bar_label'))
      .map(t => t.childNodes[0]?.textContent)
    expect(labels).toEqual(['Bio', 'Conventionnel'])
  })

  it('une grappe de plus de 6 séries est TRONQUÉE, et la troncature est annoncée', () => {
    // Garde-fou de lisibilité : au-delà de ~6 barres une grappe devient illisible.
    // On tronque, on ne replie PAS dans un « Autres » — sommer des rendements serait
    // exactement le contresens que ce moteur évite.
    const { ble } = buildFixture()
    const many = {
      decompose: null,
      compare: { kind: 'outputs' as const },
      compare_secondary: { data_tagg_id: 'tagg_annee' }
    }
    const sankey = ble.sankey as Sankey
    sankey.data_taggs_dict.tagg_annee = makeTagg('tagg_annee',
      Array.from({ length: 9 }, (_, i) => [`t_${2015 + i}`, String(2015 + i), '#1f77b4'] as [string, string, string]))
    // Les liens de la fixture lisent l'ANCIEN groupe : on les remplace par des liens
    // branchés sur le nouveau, sinon toutes les valeurs seraient nulles.
    ble.output_links_list = []
    const bio = makeNode(sankey, 'n_bio2', 'Bio', '#2e8b57')
    const annees9 = sankey.data_taggs_dict.tagg_annee
    const values = Object.fromEntries(annees9.tags_list.map((t, i) => [t.id, 1 + i]))
    linkPerTag('l_bio2', ble, bio, annees9, values)

    const el = sizedContainer()
    drawGrouped(el, subjectOf(ble), many)
    expect(el.querySelectorAll('div.node_stats_legend_item')).toHaveLength(6)
    expect(el.querySelector('div.node_stats_legend_truncated')?.textContent).toBe('+3')
  })

  it('les 6 séries retenues restent dans l’ORDRE DU MODÈLE (un axe année reste chronologique)', () => {
    const { ble } = buildFixture()
    const sankey = ble.sankey as Sankey
    sankey.data_taggs_dict.tagg_annee = makeTagg('tagg_annee',
      Array.from({ length: 9 }, (_, i) => [`t_${2015 + i}`, String(2015 + i), '#1f77b4'] as [string, string, string]))
    ble.output_links_list = []
    const bio = makeNode(sankey, 'n_bio2', 'Bio', '#2e8b57')
    const annees9 = sankey.data_taggs_dict.tagg_annee
    // Les 6 plus grosses sont les 6 DERNIÈRES années : elles doivent s'afficher
    // 2018 → 2023, pas triées par valeur décroissante.
    const values = Object.fromEntries(annees9.tags_list.map((t, i) => [t.id, 1 + i]))
    linkPerTag('l_bio2', ble, bio, annees9, values)

    const el = sizedContainer()
    drawGrouped(el, subjectOf(ble), {
      decompose: null,
      compare: { kind: 'outputs' },
      compare_secondary: { data_tagg_id: 'tagg_annee' }
    })
    const legend = Array.from(el.querySelectorAll('div.node_stats_legend_item')).map(d => d.textContent)
    expect(legend).toEqual(['2018', '2019', '2020', '2021', '2022', '2023'])
  })
})

// ════════════════════════════════════════════════════════════════════════════════
// os#1420 — CE QUE LA FIGURE SUIT, ET CE QU'ELLE PEUT ÉPINGLER.
//
// Deux arbitrages, testés ici parce que c'est ce module qui les applique :
//
//  1. LES FILTRES D'ÉTIQUETTES s'appliquent aux parts d'une décomposition PAR DIMENSION
//     (couronne d'un nœud par ses enfants, d'un flux par ses flux enfants). Ce n'est PAS
//     `is_visible`, qui mêle les filtres et l'ÉTAT D'AGRÉGATION : les enfants d'un nœud
//     agrégé sont cachés parce qu'il est agrégé, et les élaguer là-dessus viderait la
//     couronne dans le seul cas où elle sert.
//
//  2. L'ÉTIQUETTE DE DONNÉES peut être ÉPINGLÉE (« cette couronne en 2019, quoi que
//     montre le diagramme ») : les valeurs se lisent alors par `valueForDataTags` au lieu
//     de `valueCurrent`. Sans épingle, rien ne change — c'est la moitié du test qui
//     protège l'existant.
//
// Le diagramme de la fixture est sur 2021 ; l'épingle, quand il y en a une, est sur 2019.
// ════════════════════════════════════════════════════════════════════════════════

describe('os#1420 — filtres sur les dimensions, et épingle du millésime', () => {
  type Values = Record<string, number>

  const buildDimensionFixture = () => {
    const annees = makeTagg('tagg_annee', [
      ['t_2019', '2019', '#1f77b4'],
      ['t_2021', '2021', '#2ca02c']
    ])
    // `data_taggs_list` en plus de `data_taggs_dict` : c'est par la LISTE que
    // `resolveFigureDataTags` compose le jeu d'étiquettes complet qu'une épingle exige.
    const sankey = { data_taggs_dict: { tagg_annee: annees }, data_taggs_list: [annees] }
    // Ce que le diagramme montre.
    annees.tags_list[1].setSelected()

    const plainNode = (id: string, name: string, color: string) => ({
      id,
      name,
      sankey,
      dimensions_as_parent: [] as unknown[],
      are_related_node_tags_selected: true,
      input_links_list: [] as unknown[],
      output_links_list: [] as unknown[],
      getShapeColorToUse: () => color
    })

    // Un flux dont la valeur dépend du millésime, lue des DEUX façons : la sélection
    // courante (`valueCurrent`, ce que le diagramme montre) et un jeu d'étiquettes
    // explicite (`valueForDataTags`, ce qu'une figure épinglée lit — os#1231). Une
    // FABRIQUE et non un mélange par `...` : un spread évaluerait le getter une fois pour
    // toutes, et le millésime cesserait d'être suivi.
    const makeLink = (
      id: string,
      source: unknown,
      target: unknown,
      color: string,
      values: Values,
      { flux_filter = true, aggregated = false } = {}
    ) => ({
      id,
      sankey,
      source,
      target,
      is_visible: !aggregated,
      is_visible_ignoring_container_modes: true,
      is_expansion_link: false,
      are_related_flux_tags_selected: flux_filter,
      getShapeColorToUse: () => color,
      get valueCurrent (): number {
        const sel = annees.tags_list.find(t => t.is_selected)
        return sel ? (values[sel.id] ?? 0) : 0
      },
      valueForDataTags: (tags: { id: string }[]): number | null => {
        const t = tags.find(x => x.id in values)
        return t ? values[t.id] : null
      }
    })

    const marche = plainNode('n_marche', 'Marché', '#888888')
    const cereales = plainNode('n_cereales', 'Céréales', '#c8b400')
    const children: unknown[] = []

    /**
     * Un enfant de dimension et son flux vers le marché. Les trois états que le contrat
     * distingue se règlent un à un : le FILTRE d'étiquettes du nœud, celui du flux, et
     * l'AGRÉGATION — qui masque le flux à l'écran (`is_visible`) sans que l'utilisateur
     * ait rien décroché (`is_visible_ignoring_container_modes` reste vrai, et c'est par
     * ce repli que `data_value` continue de valoir quelque chose).
     */
    const addChild = (
      id: string,
      name: string,
      color: string,
      values: Values,
      { node_filter = true, flux_filter = true, aggregated = false } = {}
    ) => {
      const output_links_list: unknown[] = []
      const node = {
        ...plainNode(`n_${id}`, name, color),
        are_related_node_tags_selected: node_filter,
        output_links_list,
        get data_value (): number {
          return (output_links_list as { is_visible: boolean, valueCurrent: number }[])
            .filter(l => l.is_visible || aggregated)
            .reduce((acc, l) => acc + (l.valueCurrent ?? 0), 0)
        }
      }
      const link = makeLink(`l_${id}`, node, marche, color, values, { flux_filter, aggregated })
      output_links_list.push(link)
      marche.input_links_list.push(link)
      children.push(node)
      return node
    }

    addChild('ble', 'Blé', '#c8b400', { t_2019: 3, t_2021: 5 })
    addChild('orge', 'Orge', '#2e8b57', { t_2019: 7, t_2021: 9 }, { aggregated: true })
    addChild('avoine', 'Avoine', '#999999', { t_2019: 1, t_2021: 2 }, { node_filter: false })
    addChild('seigle', 'Seigle', '#8b4513', { t_2019: 4, t_2021: 6 }, { flux_filter: false })
    cereales.dimensions_as_parent = [{ id: 'dim_espece', children }]

    // Le flux AGRÉGÉ : sujet de la décomposition en flux enfants, et porteur de la valeur
    // du nœud « Céréales » quand c'est LUI le sujet.
    const agrege = makeLink(
      'l_cereales', cereales, marche, '#c8b400', { t_2019: 15, t_2021: 22 }
    )
    cereales.output_links_list.push(agrege)
    marche.input_links_list.push(agrege)

    return { sankey, annees, cereales, agrege }
  }

  const nodeSubject = (node: unknown): Type_ChartSubject =>
    ({ kind: 'node', node } as unknown as Type_ChartSubject)
  const fluxSubject = (link: unknown): Type_ChartSubject =>
    ({ kind: 'flux', link } as unknown as Type_ChartSubject)

  const BY_ESPECE = {
    decompose: { kind: 'node_children' as const, dimension_id: 'dim_espece' },
    compare: null
  }
  const BY_FLUX_CHILDREN = {
    decompose: { kind: 'flux_children' as const, dimension_id: 'dim_espece' },
    compare: null
  }

  // L'épingle telle qu'une figure la porte : la clé `data_tags` de son sac de réglages,
  // résolue par le contrat lui-même plutôt que fabriquée à la main.
  const pinnedOn2019 = (sankey: unknown) =>
    figureNavigationOf(
      sankey as Parameters<typeof figureNavigationOf>[0],
      { data_tags: { tagg_annee: 't_2019' } }
    )

  it('un enfant que les étiquettes de nœuds écartent sort de la décomposition', () => {
    const { cereales } = buildDimensionFixture()
    const data = buildAnalysisChartData(nodeSubject(cereales), BY_ESPECE)
    expect(data.series[0].parts.map(p => p.label)).not.toContain('Avoine')
  })

  it('un enfant caché parce que son parent est agrégé reste une part', () => {
    // Le cas où la couronne sert : le parent est agrégé, ses enfants sont donc invisibles
    // à l'écran — les élaguer là-dessus viderait la figure.
    const { cereales } = buildDimensionFixture()
    const data = buildAnalysisChartData(nodeSubject(cereales), BY_ESPECE)
    expect(data.series[0].parts.map(p => p.label)).toEqual(['Blé', 'Orge', 'Seigle'])
  })

  it('un flux que les étiquettes de flux écartent sort des parts de flux_children', () => {
    const { agrege } = buildDimensionFixture()
    const data = buildAnalysisChartData(fluxSubject(agrege), BY_FLUX_CHILDREN)
    // Seigle est écarté par son étiquette de FLUX, Avoine par celle de son NŒUD ; Orge,
    // masqué par l'agrégation, reste — c'est tout le sujet de la décomposition.
    expect(data.series[0].parts.map(p => p.id)).toEqual(['l_ble', 'l_orge'])
  })

  it('sans navigation, les parts gardent les valeurs du diagramme', () => {
    const { cereales } = buildDimensionFixture()
    const data = buildAnalysisChartData(nodeSubject(cereales), BY_ESPECE)
    expect(data.series[0].parts.map(p => p.value)).toEqual([5, 9, 6])
  })

  it('épinglée sur 2019, la couronne lit 2019 alors que le diagramme montre 2021', () => {
    const { sankey, cereales, annees } = buildDimensionFixture()
    const data = buildAnalysisChartData(nodeSubject(cereales), BY_ESPECE, pinnedOn2019(sankey))
    expect(data.series[0].parts.map(p => p.value)).toEqual([3, 7, 4])
    // Lire sous d'autres coordonnées ne DÉPLACE pas le diagramme.
    expect(annees.tags_list.map(t => t.is_selected)).toEqual([false, true])
  })

  it('épinglée sur 2019, les flux enfants lisent 2019 eux aussi', () => {
    const { sankey, agrege } = buildDimensionFixture()
    const data = buildAnalysisChartData(fluxSubject(agrege), BY_FLUX_CHILDREN, pinnedOn2019(sankey))
    expect(data.series[0].parts.map(p => p.value)).toEqual([3, 7])
  })

  it('un axe de comparaison portant sur le groupe épinglé énumère quand même ses étiquettes', () => {
    // L'arbitrage : l'axe prime sur l'épingle POUR SON GROUPE, sans quoi la figure rendrait
    // autant de séries identiques qu'il y a de millésimes. Les épingles des AUTRES groupes,
    // elles, tiendraient.
    const { sankey, cereales } = buildDimensionFixture()
    const data = buildAnalysisChartData(
      nodeSubject(cereales),
      { decompose: null, compare: { data_tagg_id: 'tagg_annee' } },
      pinnedOn2019(sankey)
    )
    expect(data.series.map(s => s.label)).toEqual(['2019', '2021'])
    // Chaque série à SON millésime : sans la substitution, les deux vaudraient 15.
    expect(data.series.map(s => s.parts[0].value)).toEqual([15, 22])
  })
})

