import * as fs from 'fs'
import * as path from 'path'
import { parseSankeymaticText, buildSankeymaticTheme } from './sankeymaticParser'

// Valide le parseur SankeyMATIC TS sur les modèles natifs .txt de SankeyData
// (submodule de SA). En checkout OpenSankey standalone, SankeyData est absent :
// la suite se met en skip. Comptages de référence = sortie du parseur Python.

/** Modèles natifs SankeyMATIC de SankeyData (submodule de SA). */
function findTemplates(): string | null {
  let dir = __dirname
  for (let i = 0; i < 12; i++) {
    const candidate = path.join(dir, 'SankeyData', 'templates', 'other_formats', 'data')
    if (fs.existsSync(candidate)) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

const templates = findTemplates()
const describeOrSkip = templates ? describe : describe.skip

const readTemplate = (name: string): string =>
  fs.readFileSync(path.join(templates as string, name), 'utf-8')

const EXPECTED: { [name: string]: { nodes: number, links: number } } = {
  'sankeymatic_basic_budget.txt': { nodes: 9, links: 8 },
  'sankeymatic_start_simple.txt': { nodes: 3, links: 2 },
  'sankeymatic_job_search.txt': { nodes: 9, links: 8 },
  'sankeymatic_ranked_election.txt': { nodes: 10, links: 12 },
  'sankeymatic_financial_results.txt': { nodes: 11, links: 10 },
  'sankeymatic_journey.txt': { nodes: 11, links: 12 },
}

const nodeNamed = (d: ReturnType<typeof parseSankeymaticText>, name: string) =>
  Object.values(d.nodes).find(n => n.name === name)

const linkBetween = (d: ReturnType<typeof parseSankeymaticText>, from: string, to: string) => {
  const src = nodeNamed(d, from)
  const dst = nodeNamed(d, to)
  return Object.values(d.links).find(l => l.idSource === src?.id && l.idTarget === dst?.id)
}

describeOrSkip('parseSankeymaticText — modèles natifs', () => {
  Object.entries(EXPECTED).forEach(([rel, exp]) => {
    test(rel, () => {
      const d = parseSankeymaticText(readTemplate(rel))
      expect(Object.keys(d.nodes).length).toBe(exp.nodes)
      expect(Object.keys(d.links).length).toBe(exp.links)
      // Toutes les valeurs de flux finies et positives (les [*] sont résolus)
      const bad = Object.values(d.links).filter(l => !(Number.isFinite(l.value.data_value) && l.value.data_value > 0))
      expect(bad.map(l => `${l.idSource}->${l.idTarget}=${l.value.data_value}`)).toEqual([])
      // Positions calculées (layout SankeyMATIC) + échelle
      expect(d.user_scale).toBeGreaterThan(0)
      expect(Number.isFinite(d.user_scale)).toBe(true)
      expect(Object.values(d.nodes).some(n => n.x > 0)).toBe(true)
      const positions = Object.values(d.nodes).flatMap(n => [n.x, n.y])
      expect(positions.every(v => Number.isFinite(v))).toBe(true)
      // Les nœuds fantômes du layout ne doivent jamais fuiter dans le diagramme.
      expect(Object.keys(d.nodes).some(id => id.includes('sh_'))).toBe(false)
      // Fond blanc par défaut (aucun `bg color` dans ces modèles)
      expect(d.couleur_fond_sankey).toBe('#ffffff')
    })
  })

  test('basic_budget — le premier étage est collé à la marge, le dernier tient dans le canvas', () => {
    const d = parseSankeymaticText(readTemplate('sankeymatic_basic_budget.txt'))
    // `size w 600`, marges par défaut 12/12, `node w 12`.
    const xs = Object.values(d.nodes).map(n => n.x)
    expect(Math.min(...xs)).toBeCloseTo(12, 6)
    expect(Math.max(...xs) + 12).toBeLessThanOrEqual(600 - 12 + 1e-6)
  })

  test('basic_budget — [*] vaut le reste du nœud source', () => {
    const d = parseSankeymaticText(readTemplate('sankeymatic_basic_budget.txt'))
    // Budget reçoit 1750 et distribue 1685 hors `[*]`.
    expect(linkBetween(d, 'Budget', 'Savings')?.value.data_value).toBe(65)
  })

  test('basic_budget — seules les couleurs déclarées sont cuites ; la palette part dans le thème', () => {
    const d = parseSankeymaticText(readTemplate('sankeymatic_basic_budget.txt'))
    // Une couleur déclarée descend en local (priorité maximale de la cascade).
    expect(nodeNamed(d, 'Budget')?.local.color).toBe('#057')
    // Les autres NE sont PAS cuites : Sankey.themeNodeColor les dérivera. Cf. NOTE-THEMES.md.
    expect(nodeNamed(d, 'Wages')?.local.color).toBeUndefined()
    expect(nodeNamed(d, 'Savings')?.local.color).toBeUndefined()
    // `node theme a` + `themeoffset a 6` -> la palette démarre à e377c2.
    expect(d.theme.id).toBe('sankeymatic')
    expect(d.theme.palette.node_rule).toBe('by-name-first-word')
    expect(d.theme.palette.offset).toBe(6)
    expect(d.theme.palette.colors[0]).toBe('#1f77b4')
    // Couleur donnée directement au flux : elle prime, et exige la règle `flow`.
    const necessities = linkBetween(d, 'Budget', 'Other Necessities')
    expect(necessities?.local.color).toBe('#606')
    expect(necessities?.local.color_rule).toBe('flow')
  })

  test('financial_results — le marqueur `<<` peint les flux entrants du nœud', () => {
    const d = parseSankeymaticText(readTemplate('sankeymatic_financial_results.txt'))
    expect(nodeNamed(d, 'Revenue')?.local.color).toBe('#555')
    // `:Cost of Sales #bbb <<` -> le flux entrant prend la couleur de la CIBLE,
    // alors même que le fichier déclare `flow inheritfrom source`. C'est un choix
    // local, donc il doit s'accompagner de `color_rule: 'flow'` pour ne pas être
    // court-circuité par la règle `source` du style.
    const cost = linkBetween(d, 'Revenue', 'Cost of Sales')
    expect(cost?.local.color).toBe('#bbb')
    expect(cost?.local.color_rule).toBe('flow')
    expect(linkBetween(d, 'Revenue', 'Gross Profit')?.local.color).toBe('#48e')
    // Sans marqueur des deux côtés, `inheritfrom source` devient une RÈGLE vivante :
    // aucune couleur n'est recopiée sur le flux.
    const division = linkBetween(d, 'DivisionA', 'Revenue')
    expect(division?.local.color).toBeUndefined()
    expect(d.style_link.default.color_rule).toBe('source')
  })

  test('financial_results — `\\n` dans un nom devient un saut de ligne', () => {
    const d = parseSankeymaticText(readTemplate('sankeymatic_financial_results.txt'))
    expect(nodeNamed(d, 'Selling, General &\nAdministration')).toBeDefined()
  })
})

describe('parseSankeymaticText — cas construits', () => {
  test('chaîne linéaire (un nœud par étage) : pas de division par zéro', () => {
    // greatestNodeCount === 1 : la formule générale de l'espacement diviserait par 0.
    const d = parseSankeymaticText('a [1] b\nb [1] c\n')
    expect(Number.isFinite(d.user_scale)).toBe(true)
    expect(d.user_scale).toBeGreaterThan(0)
    Object.values(d.nodes).forEach(n => {
      expect(Number.isFinite(n.x)).toBe(true)
      expect(Number.isFinite(n.y)).toBe(true)
    })
  })

  test('diagramme sans flux : structure vide et échelle utilisable', () => {
    const d = parseSankeymaticText('// rien ici\n')
    expect(Object.keys(d.nodes)).toEqual([])
    expect(d.user_scale).toBeGreaterThan(0)
  })

  test('layout reversegraph : les flux sont inversés et le graphe reste cohérent', () => {
    const d = parseSankeymaticText('A [1] B\nB [1] C\n\nlayout reversegraph y\n')
    expect(linkBetween(d, 'C', 'B')).toBeDefined()
    expect(linkBetween(d, 'B', 'A')).toBeDefined()
    expect(linkBetween(d, 'A', 'B')).toBeUndefined()
    const a = nodeNamed(d, 'A')
    const c = nodeNamed(d, 'C')
    // A n'a plus que des entrées, C plus que des sorties.
    expect([a?.inputLinksId.length, a?.outputLinksId.length]).toEqual([1, 0])
    expect([c?.inputLinksId.length, c?.outputLinksId.length]).toEqual([0, 1])
    expect(a?.input_value).toBe(1)
    expect(a?.output_value).toBe(0)
    // Aucun lien orphelin dans links_order.
    Object.values(d.nodes).forEach(n => {
      n.links_order.forEach(lid => expect(d.links[lid]).toBeDefined())
    })
  })

  test('`move` décale le nœud d\'une fraction de l\'espace libre', () => {
    const base = parseSankeymaticText('a [1] b\n')
    const moved = parseSankeymaticText('a [1] b\nmove b 0, 0.5\n')
    const bBase = nodeNamed(base, 'b')
    const bMoved = nodeNamed(moved, 'b')
    expect(bMoved?.y).toBeGreaterThan(bBase?.y as number)
    // `move` ne touche pas aux autres nœuds.
    expect(nodeNamed(moved, 'a')?.y).toBeCloseTo(nodeNamed(base, 'a')?.y as number, 6)
  })

  test('un flux traversant deux étages ne crée pas de nœud visible', () => {
    // a saute l'étage de b : SankeyMATIC y insère un fantôme, qui doit rester interne.
    const d = parseSankeymaticText('a [1] b\nb [1] c\na [1] c\n')
    expect(Object.keys(d.nodes).length).toBe(3)
    expect(Object.keys(d.links).length).toBe(3)
  })

  test('les valeurs de flux sont masquées, sous le nom d\'attribut moderne', () => {
    // `label_visible` seul ne suffit pas : la migration 0.91->0.92 des styles de flux
    // l'envoie vers `name_label_is_visible`. Sans `value_label_is_visible`, SankeyMATIC
    // afficherait des valeurs sur les flux, ce qu'il ne fait jamais.
    const d = parseSankeymaticText('a [1] b\n')
    expect(d.style_link.default.value_label_is_visible).toBe(false)
    expect(d.style_link.default.label_visible).toBe(false)
  })

  test('`value suffix` devient une unité de label, `node theme none` neutralise la palette', () => {
    const d = parseSankeymaticText("a [1] b\n\nnode theme none\nnode color #123456\nvalue suffix 'GWh'\n")
    // Sans palette, la couleur vient du style, pas du local ni du thème.
    expect(nodeNamed(d, 'a')?.local.color).toBeUndefined()
    expect(d.style_node.default.color).toBe('#123456')
    expect(d.theme.palette.node_rule).toBe('none')
    expect(d.style_node.default.value_label_unit).toBe('GWh')
    expect(d.style_node.default.value_label_unit_visible).toBe(true)
  })

  test('le thème porte un patch de styles aux noms d\'attributs MODERNES', () => {
    // Les noms modernes court-circuitent la table de renommage 0.91->0.92, qui est
    // trouée pour les flux (cf. le test « valeurs de flux masquées »).
    const theme = buildSankeymaticTheme(undefined, 'source')
    expect(theme.styles.LinkStyle.shape_color_rule).toBe('source')
    expect(theme.styles.LinkStyle.shape_opacity).toBe(0.45)
    expect(theme.styles.LinkStyle.value_label_is_visible).toBe(false)
    // `labelname size 16` x `labels relativesize 110` = 17.6
    expect(theme.styles.NodeStyle.name_label_font_size).toBeCloseTo(17.6, 6)
    expect(theme.styles.NodeStyle.shape_min_width).toBe(12)
    expect(theme.styles.NodeStyle.value_label_is_visible).toBe(true)
    // Palette Category10, offset 6 : les défauts de la recette `default_budget`.
    expect(theme.palette.node_rule).toBe('by-name-first-word')
    expect(theme.palette.offset).toBe(6)
  })

  test('le thème d\'un fichier importé décrit le même style que les dicts 0.9 émis', () => {
    const d = parseSankeymaticText('a [1] b\n\nnode w 20\nflow inheritfrom source\nflow opacity 0.6\n')
    // Les deux chemins (chargement via style_link, bascule via theme.styles) doivent
    // s'accorder, sans quoi rouvrir puis rebasculer changerait l'apparence.
    expect(d.theme.styles.LinkStyle.shape_color_rule).toBe(d.style_link.default.color_rule)
    expect(d.theme.styles.LinkStyle.shape_opacity).toBe(d.style_link.default.opacity)
    expect(d.theme.styles.NodeStyle.shape_min_width).toBe(d.style_node.default.node_width)
    expect(d.theme.styles.NodeStyle.shape_color).toBe(d.style_node.default.color)
    expect(d.theme.styles.NodeStyle.name_label_font_size).toBe(d.style_node.default.font_size)
  })

  test('outside-in reste cuit (il dépend des étages), source devient une règle', () => {
    // Défaut du parseur : `flow inheritfrom outside-in`.
    const cooked = parseSankeymaticText('a [1] b\nb [1] c\n')
    expect(cooked.style_link.default.color_rule).toBe('flow')
    expect(Object.values(cooked.links).every(l => typeof l.local.color === 'string')).toBe(true)

    const ruled = parseSankeymaticText('a [1] b\nb [1] c\n\nflow inheritfrom source\n')
    expect(ruled.style_link.default.color_rule).toBe('source')
    expect(Object.values(ruled.links).every(l => l.local.color === undefined)).toBe(true)
  })
})
