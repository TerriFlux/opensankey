import { settleNodeAnchorAfterLayout, AnchorableNode } from './applyLayoutAnchor'

// #204 — régression : « Appliquer la mise en page » décalait en diagonale les nœuds-puits
// invisibles (« Eau » de la filière porcine SOCLE en vue désagrégée), car le ré-ancrage de
// fin recapturait le centre DEPUIS le coin (settleCenterAnchor) alors que posFlux avait
// permuté largeur/hauteur. Le correctif dérive le coin DEPUIS le centre autoritaire
// (forceDeriveFromCenter) quand le centre existe.

function makeNode(center_x: number | undefined, center_y: number | undefined) {
  const calls: string[] = []
  const node: AnchorableNode = {
    center_x,
    center_y,
    forceDeriveFromCenter: () => { calls.push('forceDeriveFromCenter') },
    settleCenterAnchor: () => { calls.push('settleCenterAnchor') },
  }
  return { node, calls }
}

describe('#204 settleNodeAnchorAfterLayout', () => {
  it('dérive le coin depuis le centre (sans réécrire le centre) quand le centre est défini', () => {
    const { node, calls } = makeNode(100, 200)
    settleNodeAnchorAfterLayout(node)
    expect(calls).toEqual(['forceDeriveFromCenter'])
  })

  it('retombe sur settleCenterAnchor pour un nœud sans centre (ancien fichier coin-based)', () => {
    const { node, calls } = makeNode(undefined, undefined)
    settleNodeAnchorAfterLayout(node)
    expect(calls).toEqual(['settleCenterAnchor'])
  })

  it('exige les DEUX coordonnées de centre (x seul ne suffit pas)', () => {
    const { node, calls } = makeNode(100, undefined)
    settleNodeAnchorAfterLayout(node)
    expect(calls).toEqual(['settleCenterAnchor'])
  })
})
