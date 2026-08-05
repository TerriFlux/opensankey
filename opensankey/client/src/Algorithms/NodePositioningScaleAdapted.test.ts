import { NodePositioning } from './NodePositioning'
import type { Class_DrawingArea } from '../types/DrawingArea'
import type { Class_NodeElement } from '../Elements/Node'

// #384 — Référence du mode « échelle adaptée » : le DIAGRAMME ENTIER, plus un élément désigné.
//
// L'ancienne formule (échelle = base × valeur_élément_courante / valeur_élément_réf) reposait sur
// un flux ou un nœud-stock unique, choisi au clic droit. Son garde-fou `if (v <= 0) return`
// faisait que l'échelle n'était PAS adaptée — silencieusement — dès que cet élément était absent
// ou nul au datatag courant : le diagramme restait à l'échelle du datatag précédent, écrasé ou
// débordant. Cas d'usage : la dimension `axe` de l'étude SOCLE « Détail des modes de production »,
// dont les 7 étiquettes ne portent pas les mêmes flux.
//
// La grandeur de référence est désormais la somme de la colonne la plus haute, en VALEURS (jamais
// en pixels : aucune circularité avec l'échelle qu'elle sert à fixer). C'est elle qui détermine la
// hauteur rendue du diagramme, elle ne dépend d'aucun élément en particulier, et elle absorbe sans
// réglage le cas « s'adapter sur plusieurs flux à la fois » (production + importation comptent
// tous deux s'ils sont dans la colonne dimensionnante).

type FakeLink = { valueCurrent: number | null, shape_local_link_scale?: number }

type FakeNode = {
  is_visible: boolean
  shape_position_type: 'absolute' | 'relative'
  position_u: number
  tied_to_nodes: boolean
  attached_node: unknown[]
  visible_input_links_list: FakeLink[]
  visible_output_links_list: FakeLink[]
  use_stock_for_height: boolean
  stock_height_scale_factor: number
  currentStockInitialForHeight: () => number | null
  hasGivenTag: () => boolean
}

function node(
  { u = 0, ins = [], outs = [], visible = true, echange = false, relative = false, tied = false,
    stock = null as number | null, stock_factor = 1 }:
  {
    u?: number, ins?: number[], outs?: number[], visible?: boolean, echange?: boolean,
    relative?: boolean, tied?: boolean, stock?: number | null, stock_factor?: number
  }
): FakeNode {
  const link = (v: number): FakeLink => ({ valueCurrent: v })
  return {
    is_visible: visible,
    shape_position_type: relative ? 'relative' : 'absolute',
    position_u: u,
    tied_to_nodes: tied,
    attached_node: tied ? [{}] : [],
    visible_input_links_list: ins.map(link),
    visible_output_links_list: outs.map(link),
    use_stock_for_height: stock !== null,
    stock_height_scale_factor: stock_factor,
    currentStockInitialForHeight: () => stock,
    hasGivenTag: () => echange,
  }
}

// Aire de dessin minimale : assez pour `diagramMagnitude` (liste des nœuds visibles + tag
// « echange ») et pour `applyAdaptedScale`, qui écrit `_scale` et le domaine de `_scaleValueToPx`.
function positioning(nodes: FakeNode[], scale = 100) {
  const drawingArea = {
    _scale: scale,
    _scaleValueToPx: { domain: () => undefined },
    get scale() { return this._scale },
    sankey: {
      node_taggs_dict: {
        'type de noeud': { tags_dict: { echange: { id: 'echange' } } },
      },
      get visible_nodes_list() {
        return nodes.filter(n => n.is_visible) as unknown as Class_NodeElement[]
      },
    },
  }
  return { np: new NodePositioning(drawingArea as unknown as Class_DrawingArea), drawingArea }
}

describe('#384 — grandeur du diagramme', () => {
  it('retient la somme de la colonne la plus haute', () => {
    // Colonne 0 : 30 + 20 = 50. Colonne 1 : 45. La grandeur est 50, pas 95 (toutes colonnes) ni
    // 45 (dernière vue) ni 30 (plus gros nœud).
    const { np } = positioning([
      node({ u: 0, outs: [30] }),
      node({ u: 0, outs: [20] }),
      node({ u: 1, ins: [45] }),
    ])
    expect(np.diagramMagnitude()).toBe(50)
  })

  it('prend le côté le plus chargé de chaque nœud (max entrées / sorties)', () => {
    // Un nœud qui reçoit 10 + 10 et n'émet que 5 est dessiné à la hauteur de ses ENTRÉES.
    const { np } = positioning([node({ u: 0, ins: [10, 10], outs: [5] })])
    expect(np.diagramMagnitude()).toBe(20)
  })

  it('ignore les nœuds masqués, d\'échange, relatifs et les cadres liés', () => {
    // Mêmes exclusions que `resolveScaleAdaptedOverlaps` : sans elles, les nœuds d'import/export
    // (placés au niveau de leur flux, pas empilés) gonfleraient artificiellement une colonne.
    const { np } = positioning([
      node({ u: 0, outs: [40] }),
      node({ u: 0, outs: [1000], visible: false }),
      node({ u: 0, outs: [1000], echange: true }),
      node({ u: 0, outs: [1000], relative: true }),
      node({ u: 0, outs: [1000], tied: true }),
    ])
    expect(np.diagramMagnitude()).toBe(40)
  })

  it('compte la valeur de stock d\'un nœud dimensionné par son stock', () => {
    // Miroir en valeurs de `Node._getNaturalShapeHeight` : hauteur-stock = stock / facteur,
    // jamais plus fine que la bande de flux.
    const { np } = positioning([node({ u: 0, outs: [10], stock: 80, stock_factor: 2 })])
    expect(np.diagramMagnitude()).toBe(40)
  })

  it('ramène un flux à échelle locale à sa contribution réelle en hauteur', () => {
    // `shape_local_link_scale` divise l'échelle du flux : à échelle locale 4 il rend 4 fois plus
    // fin, il pèse donc 100/4 dans la hauteur de sa colonne.
    const n = node({ u: 0 })
    n.visible_output_links_list = [{ valueCurrent: 100, shape_local_link_scale: 4 }]
    expect(positioning([n]).np.diagramMagnitude()).toBe(25)
  })

  it('vaut 0 sur un diagramme sans aucune valeur', () => {
    expect(positioning([node({ u: 0 })]).np.diagramMagnitude()).toBe(0)
  })
})

describe('#384 — échelle adaptée sur le diagramme entier', () => {
  it('adapte l\'échelle au ratio des grandeurs (hauteur rendue constante)', () => {
    // La hauteur d'un nœud vaut sa valeur ÷ échelle : garder `grandeur / échelle` constant, c'est
    // littéralement « même hauteur de diagramme d'un datatag à l'autre ».
    const n = node({ u: 0, outs: [50] })
    const { np, drawingArea } = positioning([n], 100)

    np.applyAdaptedScale()   // capture paresseuse : base = (100, 50), ratio 1
    expect(np.scaleAdaptedReference).toEqual({ scale: 100, magnitude: 50 })
    expect(drawingArea._scale).toBe(100)

    n.visible_output_links_list = [{ valueCurrent: 150 }]  // datatag 3× plus gros
    np.applyAdaptedScale()
    expect(drawingArea._scale).toBe(300)
  })

  it('adapte l\'échelle même quand un flux donné disparaît du datatag', () => {
    // LE cas du ticket : avec l'ancienne référence (le flux `a`), le datatag suivant ne le portant
    // plus, `applyAdaptedScale` sortait sur `v <= 0` et laissait l'échelle du datatag précédent.
    const a = node({ u: 0, outs: [80] })
    const b = node({ u: 0, outs: [20] })
    const { np, drawingArea } = positioning([a, b], 100)

    np.applyAdaptedScale()   // base = (100, 100)
    a.is_visible = false     // le flux « de référence » d'hier n'existe plus ici
    b.visible_output_links_list = [{ valueCurrent: 200 }]
    np.applyAdaptedScale()
    expect(drawingArea._scale).toBe(200)
  })

  it('garde l\'échelle précédente si la grandeur est nulle', () => {
    // Datatag sans aucune valeur : no-op plutôt qu'une division par zéro.
    const n = node({ u: 0, outs: [50] })
    const { np, drawingArea } = positioning([n], 100)
    np.applyAdaptedScale()
    n.visible_output_links_list = []
    np.applyAdaptedScale()
    expect(drawingArea._scale).toBe(100)
  })

  it('n\'exige aucun élément de référence pour se déclencher', () => {
    // Aucun `shape_is_reference_flux` / `shape_is_reference_stock` n'est posé ici : avant #384,
    // `applyAdaptedScale` sortait immédiatement faute d'élément désigné.
    const n = node({ u: 0, outs: [10] })
    const { np, drawingArea } = positioning([n], 100)
    np.applyAdaptedScale()
    n.visible_output_links_list = [{ valueCurrent: 40 }]
    np.applyAdaptedScale()
    expect(drawingArea._scale).toBe(400)
  })
})
