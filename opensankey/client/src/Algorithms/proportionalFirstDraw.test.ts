import { NodePositioningProportional } from './NodePositioningProportional'
import type { NodePositioning } from './NodePositioning'
import type { Class_NodeElement } from '../Elements/Node'

// Regression guard for issue #369 — RÈGLE DU PREMIER RENDU en mode proportionnel.
//
// Depuis #369 le mode d'affichage est restitué au chargement : le sélecteur rouvre sur le mode
// enregistré et le changement de dataTag le suit, sans que le diagramme change à l'ouverture.
// Le premier filet est la SUSPENSION du mode (Class_DrawingArea) ; celui-ci est le second : la
// toute première passe de compression, quand la suspension se lève, ne doit pas faire sauter le
// diagramme. Le fichier ne stocke PAS la disposition comprimée — il stocke les CENTRES — et le
// plancher anti-chevauchement, recalculé sur cette géométrie, donnait un facteur effectif de
// 3,66 contre 1,04 à l'enregistrement (corpus 0.9 commercial_pipe_monthly_report).
//
// C'est le `return` de la branche « capture paresseuse » d'`anchorProportionalNodes` qui porte
// cette règle : premier appel = capture seule, appels suivants = compression. Ce test le
// verrouille, parce que ce `return` a tout l'air d'un oubli.

/** Nœud minimal : ce que lisent `proportionalEligibleNodes`, la capture et la compression. */
function makeNode(id: string, position_u: number, position_y: number, height: number) {
  const node = {
    id,
    position_u,
    position_y,
    center_y: position_y + height / 2,
    _prop_center_ref: undefined as number | undefined,
    is_visible: true,
    shape_position_type: 'absolute',
    tied_to_nodes: false,
    attached_node: [] as unknown[],
    attached_container: [] as unknown[],
    hasGivenTag: () => false,
    getShapeHeightToUse: () => height,
    captureProportionalCenterRef() {
      this._prop_center_ref = this.position_y + height / 2
    },
    applyProportionalCompression(median_y: number, factor: number) {
      const ref = this.center_y ?? this._prop_center_ref
      if (ref === undefined) return
      this.position_y = median_y + (ref - median_y) * factor - height / 2
    },
  }
  return node
}

/**
 * Deux nœuds d'une même colonne dont les centres sont plus rapprochés que
 * ½h + ½h + écart_min : le plancher anti-chevauchement réclame un facteur > 1, donc
 * toute compression appliquée ÉCARTERAIT les nœuds — c'est exactement le saut à l'ouverture
 * que la règle du premier rendu doit éviter.
 */
function makeProportional() {
  const nodes = [makeNode('haut', 0, 100, 40), makeNode('bas', 0, 160, 40)]
  const stub = {
    drawingArea: {
      sankey: {
        visible_nodes_list: nodes,
        node_taggs_dict: {},
        styles_dict: { default: { shape_position_dy: 50 } },
        view_mode_active: false,
      },
    },
    reference: {
      gatedReference: undefined,
      rawReference: undefined,
      rawReferenceNode: undefined,
      referenceFluxRefValue: () => undefined,
      referenceCurrentValue: () => 0,
    },
  }
  const prop = new NodePositioningProportional(stub as unknown as NodePositioning)
  return { prop, nodes: nodes as unknown as Class_NodeElement[], ys: () => nodes.map(n => n.position_y) }
}

describe('#369 — premier dessin d\'un fichier rouvert en mode proportionnel', () => {
  it('capture le cadre de référence SANS déplacer les nœuds', () => {
    const { prop, ys } = makeProportional()
    expect(prop.hasReferenceFrame).toBe(false)

    prop.anchorProportionalNodes()

    // Le diagramme reste celui du fichier...
    expect(ys()).toEqual([100, 160])
    // ...et le mode est bien armé pour la suite.
    expect(prop.hasReferenceFrame).toBe(true)
  })

  it('applique la compression aux dessins SUIVANTS (le mode reste actif)', () => {
    const { prop, ys } = makeProportional()
    prop.anchorProportionalNodes()   // ouverture : capture seule
    prop.anchorProportionalNodes()   // changement de dataTag : le mode agit

    // Sans élément de référence, f vaut 1 mais le plancher anti-chevauchement (écart de
    // centres 60 < 40/2 + 40/2 + 50) impose f_eff > 1 : les nœuds s'écartent.
    const [haut, bas] = ys()
    expect(bas - haut).toBeGreaterThan(60)
  })
})
