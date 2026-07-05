import * as fs from 'fs'
import * as path from 'path'
import { parseSankeymaticText } from './sankeymaticParser'

// Valide le parseur SankeyMATIC TS sur les modèles natifs .txt de SankeyData
// (submodule de SA). En checkout OpenSankey standalone, SankeyData est absent :
// la suite se met en skip. Comptages de référence = sortie du parseur Python.

function findTemplates(): string | null {
  let dir = __dirname
  for (let i = 0; i < 12; i++) {
    const candidate = path.join(dir, 'SankeyData', 'templates')
    if (fs.existsSync(candidate)) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

const templates = findTemplates()
const describeOrSkip = templates ? describe : describe.skip

const EXPECTED: { [rel: string]: { nodes: number, links: number } } = {
  'essential/data/sankeymatic_basic_budget.txt': { nodes: 9, links: 8 },
  'essential/data/sankeymatic_start_simple.txt': { nodes: 3, links: 2 },
  'essential/data/sankeymatic_job_search.txt': { nodes: 9, links: 8 },
  'intermediary/data/sankeymatic_ranked_election.txt': { nodes: 10, links: 12 },
  'intermediary/data/sankeymatic_financial_results.txt': { nodes: 11, links: 10 },
  'intermediary/data/sankeymatic_journey.txt': { nodes: 11, links: 12 },
}

describeOrSkip('parseSankeymaticText — modèles natifs', () => {
  Object.entries(EXPECTED).forEach(([rel, exp]) => {
    test(rel, () => {
      const text = fs.readFileSync(path.join(templates as string, rel), 'utf-8')
      const d = parseSankeymaticText(text)
      expect(Object.keys(d.nodes).length).toBe(exp.nodes)
      expect(Object.keys(d.links).length).toBe(exp.links)
      // Toutes les valeurs de flux finies et positives (les [*] sont résolus)
      const bad = Object.values(d.links).filter(l => !(Number.isFinite(l.value.data_value) && l.value.data_value > 0))
      expect(bad.map(l => `${l.idSource}->${l.idTarget}=${l.value.data_value}`)).toEqual([])
      // Positions calculées (layout SankeyMATIC) + échelle
      expect(d.user_scale).toBeGreaterThan(0)
      expect(Object.values(d.nodes).some(n => n.x > 0)).toBe(true)
      // Fond blanc par défaut (aucun `bg color` dans ces modèles)
      expect(d.couleur_fond_sankey).toBe('#ffffff')
    })
  })

  test('financial_results — couleurs de nœuds déclarées (:Node #hex)', () => {
    const text = fs.readFileSync(
      path.join(templates as string, 'intermediary/data/sankeymatic_financial_results.txt'), 'utf-8')
    const d = parseSankeymaticText(text)
    // ":Revenue #555" -> le nœud Revenue doit porter cette couleur
    const revenue = Object.values(d.nodes).find(n => n.name === 'Revenue')
    expect(revenue).toBeDefined()
    expect(revenue?.local.color).toBe('#555')
  })
})
