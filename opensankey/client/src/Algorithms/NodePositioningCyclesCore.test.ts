import { NodePositioningCyclesCore } from './NodePositioningCyclesCore'
import type { Class_DrawingArea } from '../types/DrawingArea'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_LinkElement } from '../Elements/Link'

// opensankey#1253 — Socle unique d'index horizontal, partagé par `position_x` (computeAutoSankey)
// et `position_u` (detectAllCyclesAndOptimize). Le socle ne touche que `sankey.nodes_dict`,
// `sankey.links_dict` et `sankey.visible_links_list` : il se teste sur un graphe factice.

type Edge = {
  from: string,
  to: string,
  /** Topologie structurelle : un flux à 0 reste traversé, un flux masqué ne l'est pas. */
  structural?: boolean,
  /** Verrouillage tri-state du statut recyclage (OpenSankey#711). */
  forced_recycling?: boolean,
  /** Axe de progression du flux. Absent ⇒ 'hh' (défaut historique du socle). */
  orientation?: 'hh' | 'vv' | 'hv' | 'vh'
}

/** Sous-ensemble de Class_NodeElement/Class_LinkElement réellement lu par le socle. */
type MockLink = {
  id: string,
  source: MockNode,
  target: MockNode,
  is_visible_ignoring_zero: boolean,
  shape_is_recycling_locked: boolean,
  shape_is_recycling: boolean,
  shape_orientation: 'hh' | 'vv' | 'hv' | 'vh'
}

type MockNode = {
  id: string,
  input_links_list: MockLink[],
  output_links_list: MockLink[],
  position_u: number,
  shape_position_u_locked: boolean,
  is_visible: boolean,
  hasInputLinks: () => boolean
}

type Graph = {
  core: NodePositioningCyclesCore,
  nodes: Class_NodeElement[],
  node: (id: string) => MockNode
}

/** Construit un sous-graphe factice et le socle qui l'exploite. */
function buildGraph(node_ids: string[], edges: Edge[]): Graph {
  const nodes_dict: { [id: string]: MockNode } = {}
  node_ids.forEach(id => {
    nodes_dict[id] = {
      id,
      input_links_list: [],
      output_links_list: [],
      position_u: 0,
      shape_position_u_locked: false,
      is_visible: true,
      hasInputLinks: () => nodes_dict[id].input_links_list.length > 0
    }
  })

  const links_dict: { [id: string]: MockLink } = {}
  edges.forEach(edge => {
    const id = `${edge.from}->${edge.to}`
    const link = {
      id,
      source: nodes_dict[edge.from],
      target: nodes_dict[edge.to],
      is_visible_ignoring_zero: edge.structural !== false,
      shape_is_recycling_locked: edge.forced_recycling === true,
      shape_is_recycling: edge.forced_recycling === true,
      shape_orientation: edge.orientation ?? 'hh'
    }
    links_dict[id] = link
    nodes_dict[edge.from].output_links_list.push(link)
    nodes_dict[edge.to].input_links_list.push(link)
  })

  const drawing_area = {
    sankey: {
      nodes_dict,
      links_dict,
      visible_links_list: Object.values(links_dict) as Class_LinkElement[]
    }
  } as unknown as Class_DrawingArea

  return {
    core: new NodePositioningCyclesCore(drawing_area),
    nodes: node_ids.map(id => nodes_dict[id]) as unknown as Class_NodeElement[],
    node: (id: string) => nodes_dict[id]
  }
}

describe('#1253 computeHorizontalIndexes — graphes acycliques', () => {
  it('indexe une chaîne simple par sa profondeur', () => {
    const g = buildGraph(['A', 'B', 'C'], [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }])
    const { horizontal_indexes, recycling_links } = g.core.computeHorizontalIndexes(g.nodes)
    expect(horizontal_indexes).toEqual({ A: 0, B: 1, C: 2 })
    expect(recycling_links).toEqual([])
  })

  it('retient le plus long chemin, pas le premier trouvé', () => {
    // A->C direct (longueur 1) et A->B->C (longueur 2) : C doit être en colonne 2.
    const g = buildGraph(['A', 'B', 'C'],
      [{ from: 'A', to: 'C' }, { from: 'A', to: 'B' }, { from: 'B', to: 'C' }])
    const { horizontal_indexes } = g.core.computeHorizontalIndexes(g.nodes)
    expect(horizontal_indexes).toEqual({ A: 0, B: 1, C: 2 })
  })

  it('place les nœuds isolés en colonne 0', () => {
    const g = buildGraph(['A', 'B', 'SEUL'], [{ from: 'A', to: 'B' }])
    const { horizontal_indexes } = g.core.computeHorizontalIndexes(g.nodes)
    expect(horizontal_indexes).toEqual({ A: 0, B: 1, SEUL: 0 })
  })
})

describe('#1253 computeHorizontalIndexes — topologie structurelle', () => {
  it('traverse un flux à valeur nulle (régression : colonne u correcte mais X faux)', () => {
    // B->C fraîchement créé, valeur pas encore saisie : is_visible_ignoring_zero reste vrai.
    const g = buildGraph(['A', 'B', 'C'],
      [{ from: 'A', to: 'B' }, { from: 'B', to: 'C', structural: true }])
    const { horizontal_indexes } = g.core.computeHorizontalIndexes(g.nodes)
    expect(horizontal_indexes.C).toBe(2)
  })

  it('ne traverse pas un flux masqué', () => {
    const g = buildGraph(['A', 'B', 'C'],
      [{ from: 'A', to: 'B' }, { from: 'B', to: 'C', structural: false }])
    const { horizontal_indexes } = g.core.computeHorizontalIndexes(g.nodes)
    // C n'a aucune arête structurelle : il est traité comme un nœud isolé.
    expect(horizontal_indexes).toEqual({ A: 0, B: 1, C: 0 })
  })
})

describe('#1253 computeHorizontalIndexes — cycles', () => {
  it('coupe la back-edge d\'un cycle simple', () => {
    const g = buildGraph(['A', 'B', 'C'],
      [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }, { from: 'C', to: 'A' }])
    const { horizontal_indexes, recycling_links } = g.core.computeHorizontalIndexes(g.nodes)
    expect(recycling_links).toEqual(['C->A'])
    expect(horizontal_indexes).toEqual({ A: 0, B: 1, C: 2 })
  })

  it('respecte un lien de recyclage forcé par l\'utilisateur et n\'en détecte pas d\'autre', () => {
    // Cycle A<->B. Sans forçage, le DFS couperait B->A ; l'utilisateur impose A->B.
    const g = buildGraph(['A', 'B'],
      [{ from: 'A', to: 'B', forced_recycling: true }, { from: 'B', to: 'A' }])
    const { horizontal_indexes, recycling_links } = g.core.computeHorizontalIndexes(g.nodes)
    expect(recycling_links).toEqual(['A->B'])
    expect(horizontal_indexes).toEqual({ B: 0, A: 1 })
  })
})

describe('#1253 computeHorizontalIndexes — colonnes verrouillées', () => {
  it('écrase l\'index calculé par la colonne épinglée (position_u, base 1)', () => {
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B' }])
    g.node('B').shape_position_u_locked = true
    g.node('B').position_u = 5
    const { horizontal_indexes } = g.core.computeHorizontalIndexes(g.nodes)
    expect(horizontal_indexes).toEqual({ A: 0, B: 4 })
  })

  it('n\'accepte pas d\'index négatif', () => {
    const g = buildGraph(['A'], [])
    g.node('A').shape_position_u_locked = true
    g.node('A').position_u = 0
    const { horizontal_indexes } = g.core.computeHorizontalIndexes(g.nodes)
    expect(horizontal_indexes.A).toBe(0)
  })
})

describe('#1253 convergence position_x / position_u', () => {
  // Le cœur de l'issue : `detectAllCyclesAndOptimize` (qui pilote position_u) et le socle
  // employé par computeAutoSankey (qui pilote position_x) doivent produire les mêmes colonnes.
  const cases: Array<[string, string[], Edge[]]> = [
    ['chaîne', ['A', 'B', 'C'], [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }]],
    ['diamant', ['A', 'B', 'C', 'D'],
      [{ from: 'A', to: 'B' }, { from: 'A', to: 'C' }, { from: 'B', to: 'D' }, { from: 'C', to: 'D' }]],
    ['cycle', ['A', 'B', 'C'],
      [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }, { from: 'C', to: 'A' }]],
    ['flux nul', ['A', 'B', 'C'],
      [{ from: 'A', to: 'B' }, { from: 'B', to: 'C', structural: true }]],
    ['composantes disjointes', ['A', 'B', 'X', 'Y', 'SEUL'],
      [{ from: 'A', to: 'B' }, { from: 'X', to: 'Y' }]]
  ]

  cases.forEach(([label, node_ids, edges]) => {
    it(`produit les mêmes colonnes en x et en u — ${label}`, () => {
      const gx = buildGraph(node_ids, edges)
      const gu = buildGraph(node_ids, edges)
      expect(gu.core.detectAllCyclesAndOptimize(gu.nodes))
        .toEqual(gx.core.computeHorizontalIndexes(gx.nodes))
    })
  })
})

describe('#153 markRecyclingLinks — reflaguage d\'apres les colonnes', () => {
  /** Colonnes explicites : c'est le contrat de markRecyclingLinks, pas la topologie. */
  const columns = (g: Graph, cols: { [id: string]: number }) => {
    g.core.markRecyclingLinks(g.nodes, cols)
  }

  it('flague un flux qui recule (cible a gauche de la source)', () => {
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B' }])
    columns(g, { A: 2, B: 0 })
    expect(g.node('A').output_links_list[0].shape_is_recycling).toBe(true)
  })

  it('deflague un flux qui progresse a nouveau vers la droite', () => {
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B' }])
    g.node('A').output_links_list[0].shape_is_recycling = true
    columns(g, { A: 0, B: 1 })
    expect(g.node('A').output_links_list[0].shape_is_recycling).toBe(false)
  })

  it('ne flague PAS un flux dont la cible est dans la meme colonne', () => {
    // Critere strict : seul un flux qui RECULE est du recyclage. Un flux vertical (memes
    // colonnes) ne gagne rien au rendu en boucle, et la tolerance de clusterNodesByX suffit
    // a faire entrer un noeud deplace dans la colonne de sa cible.
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B' }])
    columns(g, { A: 1, B: 1 })
    expect(g.node('A').output_links_list[0].shape_is_recycling).toBe(false)
  })

  it('deflague un flux devenu vertical (meme colonne apres deplacement)', () => {
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B' }])
    g.node('A').output_links_list[0].shape_is_recycling = true
    const previous = g.core.markRecyclingLinks(g.nodes, { A: 1, B: 1 })
    expect(g.node('A').output_links_list[0].shape_is_recycling).toBe(false)
    expect(previous).toEqual({ 'A->B': true })
  })

  it('rend les valeurs precedentes des seuls flux modifies (undo)', () => {
    const g = buildGraph(['A', 'B', 'C'], [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }])
    // A->B recule, B->C progresse et etait deja a false : seul A->B change.
    const previous = g.core.markRecyclingLinks(g.nodes, { A: 2, B: 0, C: 1 })
    expect(previous).toEqual({ 'A->B': false })
  })

  it('le verrou utilisateur prime sur la geometrie', () => {
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B', forced_recycling: true }])
    // A->B progresse vers la droite, mais l'utilisateur l'a verrouille en recyclage.
    columns(g, { A: 0, B: 1 })
    expect(g.node('A').output_links_list[0].shape_is_recycling).toBe(true)
  })

  it('deflague un flux dont une extremite n\'a pas de colonne (noeud d\'echange)', () => {
    const g = buildGraph(['A', 'ECHANGE'], [{ from: 'A', to: 'ECHANGE' }])
    g.node('A').output_links_list[0].shape_is_recycling = true
    columns(g, { A: 0 }) // ECHANGE absent du dictionnaire
    expect(g.node('A').output_links_list[0].shape_is_recycling).toBe(false)
  })

  it('ne touche pas un flux dont aucune extremite n\'a bouge (only_touching_nodes)', () => {
    // C->D est un flux arriere voulu, loin du drag de A : il doit garder son statut
    // meme si les colonnes globales le donnent en recyclage.
    const g = buildGraph(['A', 'B', 'C', 'D'],
      [{ from: 'A', to: 'B' }, { from: 'C', to: 'D' }])
    const previous = g.core.markRecyclingLinks(g.nodes,
      { A: 2, B: 0, C: 2, D: 0 }, new Set(['A']))
    expect(g.node('A').output_links_list[0].shape_is_recycling).toBe(true)
    expect(g.node('C').output_links_list[0].shape_is_recycling).toBe(false)
    expect(previous).toEqual({ 'A->B': false })
  })

  it('reflague un flux dont la cible seulement a bouge', () => {
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B' }])
    g.core.markRecyclingLinks(g.nodes, { A: 2, B: 0 }, new Set(['B']))
    expect(g.node('A').output_links_list[0].shape_is_recycling).toBe(true)
  })
})

describe('markRecyclingLinks — axe de progression par orientation de flux', () => {
  const COLS = { A: 2, B: 0 } // A a DROITE de B : recule sur x
  const ROWS = { A: 0, B: 1 } // A au DESSUS de B : progresse sur y

  it('juge un flux vertical sur les rangees, pas sur les colonnes', () => {
    // Le cas du diagramme vertical : le flux descend (donc progresse) tout en partant vers la
    // gauche. Juge sur x il basculait en recyclage ; juge sur y il n'en est pas.
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B', orientation: 'vv' }])
    g.core.markRecyclingLinks(g.nodes, COLS, undefined, ROWS)
    expect(g.node('A').output_links_list[0].shape_is_recycling).toBe(false)
  })

  it('flague un flux vertical qui remonte vraiment', () => {
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B', orientation: 'vv' }])
    g.core.markRecyclingLinks(g.nodes, { A: 0, B: 1 }, undefined, { A: 2, B: 0 })
    expect(g.node('A').output_links_list[0].shape_is_recycling).toBe(true)
  })

  it('juge un flux horizontal sur les colonnes meme quand des rangees sont fournies', () => {
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B', orientation: 'hh' }])
    g.core.markRecyclingLinks(g.nodes, COLS, undefined, ROWS)
    expect(g.node('A').output_links_list[0].shape_is_recycling).toBe(true)
  })

  it('laisse un flux mixte hv/vh intact', () => {
    // Aucune des deux comparaisons ne decrit sa progression : on ne tranche pas.
    const g = buildGraph(['A', 'B', 'C', 'D'], [
      { from: 'A', to: 'B', orientation: 'hv' },
      { from: 'C', to: 'D', orientation: 'vh' }
    ])
    g.node('C').output_links_list[0].shape_is_recycling = true
    const previous = g.core.markRecyclingLinks(g.nodes,
      { A: 2, B: 0, C: 2, D: 0 }, undefined, { A: 2, B: 0, C: 2, D: 0 })
    expect(previous).toEqual({}) // rien n'a change
    expect(g.node('A').output_links_list[0].shape_is_recycling).toBe(false)
    expect(g.node('C').output_links_list[0].shape_is_recycling).toBe(true)
  })

  it('laisse un flux vertical intact quand aucune rangee n\'est fournie', () => {
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B', orientation: 'vv' }])
    expect(g.core.markRecyclingLinks(g.nodes, COLS)).toEqual({})
    expect(g.node('A').output_links_list[0].shape_is_recycling).toBe(false)
  })

  it('le verrou utilisateur prime, quelle que soit l\'orientation', () => {
    const g = buildGraph(['A', 'B'],
      [{ from: 'A', to: 'B', orientation: 'hv', forced_recycling: true }])
    g.core.markRecyclingLinks(g.nodes, { A: 0, B: 1 }, undefined, { A: 0, B: 1 })
    expect(g.node('A').output_links_list[0].shape_is_recycling).toBe(true)
  })
})

describe('#153 lockRecyclingStatusDivergences — passe post-chargement', () => {
  it('verrouille un flux arriere sauve non-recyclage sans changer sa valeur', () => {
    // La geometrie donnerait recyclage (A a droite de B) mais le fichier dit non-recyclage :
    // le fichier fait foi, le flux est verrouille pour que l'auto ne le rebascule pas.
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B' }])
    const locked = g.core.lockRecyclingStatusDivergences(g.nodes, { A: 2, B: 0 })
    expect(locked).toEqual(['A->B'])
    expect(g.node('A').output_links_list[0].shape_is_recycling).toBe(false)
    expect(g.node('A').output_links_list[0].shape_is_recycling_locked).toBe(true)
  })

  it('ne verrouille pas un flux dont le statut colle a la geometrie', () => {
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B' }])
    const locked = g.core.lockRecyclingStatusDivergences(g.nodes, { A: 0, B: 1 })
    expect(locked).toEqual([])
    expect(g.node('A').output_links_list[0].shape_is_recycling_locked).toBe(false)
  })

  it('verrouille un flux sauve recyclage que la geometrie donnerait non-recyclage', () => {
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B' }])
    g.node('A').output_links_list[0].shape_is_recycling = true
    const locked = g.core.lockRecyclingStatusDivergences(g.nodes, { A: 0, B: 1 })
    expect(locked).toEqual(['A->B'])
    expect(g.node('A').output_links_list[0].shape_is_recycling).toBe(true)
  })

  it('ignore un flux deja verrouille par l\'utilisateur', () => {
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B', forced_recycling: true }])
    const locked = g.core.lockRecyclingStatusDivergences(g.nodes, { A: 0, B: 1 })
    expect(locked).toEqual([])
    expect(g.node('A').output_links_list[0].shape_is_recycling).toBe(true)
  })

  it('ne verrouille pas un flux vertical sauve non-recyclage', () => {
    // Meme critere strict que markRecyclingLinks : memes colonnes ⇒ pas de recyclage
    // geometrique, donc aucune divergence a verrouiller.
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B' }])
    expect(g.core.lockRecyclingStatusDivergences(g.nodes, { A: 1, B: 1 })).toEqual([])
    expect(g.node('A').output_links_list[0].shape_is_recycling_locked).toBe(false)
  })

  it('juge un flux vertical sur les rangees', () => {
    // Sauve non-recyclage, et la geometrie VERTICALE le donne aussi non-recyclage (il descend) :
    // aucune divergence, donc pas de verrou — alors que les colonnes le diraient en recyclage.
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B', orientation: 'vv' }])
    expect(g.core.lockRecyclingStatusDivergences(g.nodes, { A: 2, B: 0 }, { A: 0, B: 1 })).toEqual([])
    expect(g.node('A').output_links_list[0].shape_is_recycling_locked).toBe(false)
  })

  it('guerit un flux vertical dont le statut vient de l\'ancienne regle', () => {
    // Sauve en recyclage par la detection sur x (A a droite de B), alors qu'il descend :
    // le statut s'explique entierement par l'ancienne regle ⇒ recalcule, PAS verrouille.
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B', orientation: 'vv' }])
    g.node('A').output_links_list[0].shape_is_recycling = true
    expect(g.core.lockRecyclingStatusDivergences(g.nodes, { A: 2, B: 0 }, { A: 0, B: 1 })).toEqual([])
    expect(g.node('A').output_links_list[0].shape_is_recycling).toBe(false)
    expect(g.node('A').output_links_list[0].shape_is_recycling_locked).toBe(false)
  })

  it('guerit un flux horizontal issu de la comparaison large (meme colonne)', () => {
    // L'ancienne regle comptait une cible dans la MEME colonne comme un recul.
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B', orientation: 'hh' }])
    g.node('A').output_links_list[0].shape_is_recycling = true
    expect(g.core.lockRecyclingStatusDivergences(g.nodes, { A: 1, B: 1 }, { A: 1, B: 1 })).toEqual([])
    expect(g.node('A').output_links_list[0].shape_is_recycling).toBe(false)
    expect(g.node('A').output_links_list[0].shape_is_recycling_locked).toBe(false)
  })

  it('ne fabrique pas un recyclage absent du fichier (flux vertical montant)', () => {
    // Le classique « Flux de matiere de l'economie » : l'atelier au centre, les satellites au
    // dessus (exports, emissions) et en dessous (imports). Un flux vertical qui MONTE recule sur
    // les rangees, mais le fichier ne l'a jamais dit en recyclage et l'ancienne regle ne l'y
    // mettait pas non plus (la cible est a droite). Il doit rester droit, pas devenir une boucle.
    const g = buildGraph(['ATELIER', 'EXPORTS'],
      [{ from: 'ATELIER', to: 'EXPORTS', orientation: 'vv' }])
    const locked = g.core.lockRecyclingStatusDivergences(g.nodes,
      { ATELIER: 3, EXPORTS: 6 }, { ATELIER: 2, EXPORTS: 0 })
    expect(g.node('ATELIER').output_links_list[0].shape_is_recycling).toBe(false)
    expect(locked).toEqual(['ATELIER->EXPORTS'])
    expect(g.node('ATELIER').output_links_list[0].shape_is_recycling_locked).toBe(true)
  })

  it('verrouille une divergence que l\'ancienne regle n\'explique pas', () => {
    // Les DEUX regles donnent ce flux vertical en recyclage (il recule sur x comme sur y), mais
    // le fichier le dit non-recyclage : aucune sequelle du bug ne l'explique, c'est un choix
    // d'auteur ⇒ verrouille sans changer la valeur.
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B', orientation: 'vv' }])
    expect(g.core.lockRecyclingStatusDivergences(g.nodes, { A: 2, B: 0 }, { A: 2, B: 0 })).toEqual(['A->B'])
    expect(g.node('A').output_links_list[0].shape_is_recycling).toBe(false)
    expect(g.node('A').output_links_list[0].shape_is_recycling_locked).toBe(true)
  })

  it('ne verrouille jamais un flux mixte hv/vh', () => {
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B', orientation: 'vh' }])
    expect(g.core.lockRecyclingStatusDivergences(g.nodes, { A: 2, B: 0 }, { A: 2, B: 0 })).toEqual([])
    expect(g.node('A').output_links_list[0].shape_is_recycling_locked).toBe(false)
  })

  it('est idempotente (second passage sans effet)', () => {
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B' }])
    g.core.lockRecyclingStatusDivergences(g.nodes, { A: 2, B: 0 })
    expect(g.core.lockRecyclingStatusDivergences(g.nodes, { A: 2, B: 0 })).toEqual([])
  })
})

describe('#1253 computeHorizontalIndex — appelant externe (SankeyAnimation)', () => {
  it('remplit un dictionnaire d\'index initialement vide', () => {
    // SankeyAnimation passe `{}` : aucun nœud n'est pré-amorcé à -1.
    const g = buildGraph(['A', 'B', 'C'], [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }])
    const indexes: { [id: string]: number } = {}
    g.core.computeHorizontalIndex(g.nodes[0], g.nodes, 0, [], [], indexes)
    expect(indexes).toEqual({ A: 0, B: 1, C: 2 })
  })

  it('collecte les back-edges dans la liste de recyclage fournie', () => {
    const g = buildGraph(['A', 'B'], [{ from: 'A', to: 'B' }, { from: 'B', to: 'A' }])
    const recycling: string[] = []
    g.core.computeHorizontalIndex(g.nodes[0], g.nodes, 0, [], recycling, {})
    expect(recycling).toEqual(['B->A'])
  })
})
