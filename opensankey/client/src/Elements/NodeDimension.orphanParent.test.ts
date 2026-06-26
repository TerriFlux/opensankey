import { NodeDimensionsManager } from './NodeDimension'
import type { Class_NodeElement } from './Node'
import type { Class_Sankey } from '../types/Sankey'

// Regression guard for issue #193 — réouverture d'un diagramme sauvegardé en
// « éléments visibles uniquement ».
//
// Un diagramme à hiérarchie d'agrégation sauvegardé avec les niveaux repliés
// exclut (à juste titre) ses nœuds parents, mais chaque feuille conserve un
// `dimensions[<levelTag>].parent_name` pendant vers un parent désormais absent
// du fichier. La résolution des dimensions matérialisait ce parent manquant via
// `sankey.addNewNode(...)` → un nœud orphelin (sans flux) réapparaissait à
// CHAQUE ré-ouverture. Le correctif : ne plus créer le parent ; une référence
// pendante est ignorée silencieusement (l'enfant reste à son niveau). Cela
// repose sur le fait que `load_nodes` crée désormais TOUS les nœuds du fichier
// avant de résoudre les dimensions, donc une absence de `nodes_dict` signifie
// bien « parent hors fichier ».

// Fake minimal : NodeDimensionsManager ne stocke que `_node`, et le chemin
// testé (Case 1 de fromJSON) ne touche que `_node.sankey.{nodes_dict,
// addNewNode, level_taggs_dict}` ; getOrCreateLowerDimension est mockée pour
// éviter le graphe d3/DOM complet.
function makeManager(present_node_ids: string[]) {
  const nodes_dict: Record<string, unknown> = {}
  present_node_ids.forEach(id => { nodes_dict[id] = { id } })
  const addNewNode = jest.fn((id: string, name: string) => {
    const n = { id, name }
    nodes_dict[id] = n
    return n
  })
  const sankey = { nodes_dict, addNewNode, level_taggs_dict: {} } as unknown as Class_Sankey
  const node = { sankey } as unknown as Class_NodeElement
  const manager = new NodeDimensionsManager(node)
  // Neutralise le câblage parent/enfant (graphe lourd) : on ne teste ici que
  // la décision « créer ou non le parent ».
  const lower = jest
    .spyOn(manager, 'getOrCreateLowerDimension')
    .mockReturnValue(undefined as never)
  return { manager, addNewNode, nodes_dict, lower }
}

function dimensionsJSON(parent_name: string) {
  return {
    dimensions: {
      'dimension 1': { parent_name, preferred_disaggregation: 'children' }
    }
  }
}

describe('AFMBase issue #193 — parent_name pendant à l\'ouverture', () => {
  it('ne recrée PAS un nœud parent absent du fichier (référence pendante ignorée)', () => {
    const { manager, addNewNode, nodes_dict, lower } = makeManager(['Abattage_2DDecoupe'])

    // La feuille référence un parent d'agrégation qui n'est pas dans le fichier
    // (cas réel du .gz porcin : « 1EreEt2NdeTransformation », etc.).
    manager.fromJSON(dimensionsJSON('1EreEt2NdeTransformation'), false, {}, {}, {})

    expect(addNewNode).not.toHaveBeenCalled()
    expect(Object.keys(nodes_dict)).toEqual(['Abattage_2DDecoupe']) // aucun orphelin
    expect(lower).not.toHaveBeenCalled() // pas de relation câblée vers un parent fantôme
  })

  it('câble bien la relation quand le parent EST présent (comportement nominal préservé)', () => {
    const { manager, addNewNode, lower } = makeManager(['PorcsCharcutiers', 'Porcs'])

    manager.fromJSON(dimensionsJSON('Porcs'), false, {}, {}, {})

    expect(addNewNode).not.toHaveBeenCalled() // jamais matérialisé, même présent
    expect(lower).toHaveBeenCalledTimes(1) // la hiérarchie enfant→parent est restaurée
  })
})
