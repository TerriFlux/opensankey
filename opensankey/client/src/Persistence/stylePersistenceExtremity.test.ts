import { Class_ApplicationData } from '../types/ApplicationData'
import { NodeRightExtremityStyle, NodeStyle } from '../Elements/ElementStyle'
import type { Type_JSON } from '../types/Utils'

// Regression guard for SA#232 — les styles d'extrémité (NodeLeftExtremityStyle /
// NodeRightExtremityStyle) appliqués par l'utilisateur disparaissaient au save ET
// au load.
//
// Cause : le fix #230 (non-persistance des styles STRUCTURELS pour éviter leur
// accumulation au round-trip) a réutilisé la liste `base_styles` comme filtre.
// Or `base_styles` a été élargi (mode englobant, 2026-05) pour inclure les styles
// d'extrémité — qui, eux, ne sont PAS ré-attachés à la construction mais choisis
// par l'utilisateur. Résultat : `toJSON` les retirait du tableau `style` et
// `fromJSON` les re-filtrait → perdus dans les deux sens (ex. « Bois mort » dans
// CARTOFOB perdait NodeRightExtremityStyle au chargement).
//
// Correctif : filtrer sur `structural_styles` (NodeStyle/LinkStyle/ContainerStyle/
// NodeContainerStyle) et non `base_styles`. Ce test vérifie l'aller-retour complet.

function deepClone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o)) as T
}

describe('SA#232 — round-trip des styles d\'extrémité (persistance)', () => {
  it('conserve un NodeRightExtremityStyle appliqué par l\'utilisateur au save puis au load', () => {
    const app = new Class_ApplicationData(false)
    const sankey = app.drawing_area.sankey

    const node = sankey.addNewNode('n_bois_mort', 'Bois mort')
    node.addStyle(sankey.styles_dict[NodeRightExtremityStyle])
    // Sanity : le style est bien appliqué en mémoire.
    expect(node.hasStyle(NodeRightExtremityStyle)).toBe(true)

    // 1) Écriture : le tableau `style` sérialisé doit contenir le style d'extrémité...
    const json = app.toJSON() as Type_JSON
    const node_json = (json.nodes as Type_JSON)['n_bois_mort'] as Type_JSON
    expect(node_json.style as string[]).toContain(NodeRightExtremityStyle)
    // ...mais PAS le style structurel NodeStyle (ré-attaché à la construction).
    expect(node_json.style as string[]).not.toContain(NodeStyle)

    // 2) Lecture : après rechargement, le nœud garde son style d'extrémité.
    const app2 = new Class_ApplicationData(false)
    app2.fromJSON(deepClone(json) as never, {}, false)
    const node2 = app2.drawing_area.sankey.nodes_list.find(n => n.id === 'n_bois_mort')
    expect(node2).toBeDefined()
    expect(node2!.hasStyle(NodeRightExtremityStyle)).toBe(true)
    // NodeStyle est ré-attaché structurellement à la construction : toujours présent.
    expect(node2!.hasStyle(NodeStyle)).toBe(true)
  })
})
