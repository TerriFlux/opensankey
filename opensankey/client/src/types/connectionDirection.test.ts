import { orientationForDirection } from './connectionDirection'

// os#1344 — garde de régression sur l'orientation du flux créé par la création connectée.
//
// Constaté à l'essai : un flux créé en cliquant la flèche du HAUT ou du BAS gardait
// l'orientation par défaut 'hh' — il sortait donc par le CÔTÉ du nœud pour rejoindre
// un nœud situé au-dessus/au-dessous, tracé incohérent avec le geste.
//
// Règle : l'axe du geste donne l'orientation. Haut/bas -> 'vv' (faces horizontales),
// gauche/droite -> 'hh' (côtés, défaut historique). Jamais de mixte 'hv'/'vh' ici :
// le geste part et arrive sur le même axe.
//
// (Le SENS du flux — toujours du nœud survolé vers le nouveau, dans la direction que
// la flèche montre — est porté par _createConnectedNode, cf. ConnectionGestureHandler.)

describe('os#1344 — orientation du flux selon la direction du geste', () => {

  it('haut et bas donnent un flux vertical (vv)', () => {
    expect(orientationForDirection('top')).toBe('vv')
    expect(orientationForDirection('bottom')).toBe('vv')
  })

  it('gauche et droite donnent un flux horizontal (hh)', () => {
    expect(orientationForDirection('left')).toBe('hh')
    expect(orientationForDirection('right')).toBe('hh')
  })

  it('aucune direction ne produit une orientation mixte', () => {
    const all = (['top', 'bottom', 'left', 'right'] as const).map(orientationForDirection)
    expect(all).not.toContain('hv')
    expect(all).not.toContain('vh')
  })
})
