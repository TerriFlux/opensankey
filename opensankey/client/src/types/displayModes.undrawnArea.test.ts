import { setScaleAdaptedMode, setAbsoluteMode } from './displayModes'
import type { Class_DrawingArea } from './DrawingArea'

// ==================================================================================================
// os#1353 — Un « settle » de centre sur une aire de dessin JAMAIS MISE EN PAGE detruit les centres.
//
// `settleCenterAnchor()` commit le coin courant comme nouveau centre de verite
// (centre := coin + hauteur/2). C est le bon geste quand on quitte l absolu, ou le coin a pu etre
// deplace explicitement par l utilisateur — mais il suppose que le coin ET la hauteur sont ceux qui
// sont affiches. Sur une aire jamais dessinee ce n est pas le cas : les hauteurs valent encore le
// plancher `shape_min_height` (les epaisseurs de flux ne sont calculees qu au dessin).
//
// Le cas reel : un document qui s ouvre sur une VUE laisse la DA MAITRE non dessinee, et une option
// de page `position_mode` pose le mode sur les DEUX aires (os#1352). Les centres du maitre etaient
// alors remplaces par « coin + 1,5 px », et le premier dessin de la vue maitre, qui derive
// coin = centre - hauteur/2, remontait chaque noeud d environ une demi-hauteur.
// ==================================================================================================

/** Noeud minimal : ce que lisent les setters de mode. */
function makeNode(id: string, position_y: number, center_y: number, height: number) {
  return {
    id,
    position_y,
    center_y,
    shape_position_type: 'absolute',
    tied_to_nodes: false,
    attached_node: [] as unknown[],
    is_visible: true,
    getShapeWidthToUse: () => 100,
    getShapeHeightToUse: () => height,
    settleCenterAnchor() { this.center_y = this.position_y + height / 2 },
    forceDeriveFromCenter() { this.position_y = this.center_y - height / 2 },
  }
}

/**
 * Aire de dessin minimale. `has_been_laid_out` est le drapeau du correctif : faux tant qu aucun
 * `drawElements` effectif n a eu lieu.
 */
function makeArea(has_been_laid_out: boolean, height: number) {
  const nodes = [
    // Coin et centre TELS QUE LUS DANS LE FICHIER (format >= 1.1.5 : x/y = centre) : le coin a ete
    // derive avec la hauteur du fichier, pas avec la hauteur courante.
    makeNode('aval', 100, 500, height),
  ]
  let draws = 0
  const area = {
    has_been_laid_out,
    sankey: {
      nodes_list: nodes,
      styles_dict: { default: { shape_position_type: 'absolute' } },
    },
    nodePositioning: {
      deriveAbsoluteNodesFromCenter: () => nodes.forEach(n => n.forceDeriveFromCenter()),
      captureScaleReference: () => undefined,
      clearScaleAdaptation: () => undefined,
    },
    suspendPositionModeUntilDataChange: () => undefined,
    clearPositionModeSuspension: () => undefined,
    draw: () => { draws++ },
    // os#1377 — `setScaleAdaptedMode` pose desormais le mode sous cette enveloppe, pour que
    // l affectation ne declenche pas les actions de dessin de l attribut (un dessin par nœud et
    // par flux, hors de toute passe). La doublure execute le corps et respecte le contrat du
    // second parametre : dessiner ensuite, sauf quand on lui dit de ne pas le faire.
    withBypassRedraws: <T>(fn: () => T, redraw: boolean = true): T => {
      const result = fn()
      if (redraw) draws++
      return result
    },
  }
  return { area: area as unknown as Class_DrawingArea, nodes, draws: () => draws }
}

describe('os#1353 — bascule de mode sur une aire jamais mise en page', () => {
  // Hauteur COURANTE = plancher (3 px) : l aire n a pas ete dessinee, aucune epaisseur de flux n a
  // ete calculee. Le centre du fichier (500) et le coin (100) sont, eux, coherents entre eux.
  it('echelle adaptee : les centres du fichier sont preserves', () => {
    const { area, nodes } = makeArea(false, 3)
    setScaleAdaptedMode(area)
    expect(nodes[0].center_y).toBe(500)
    expect(area.sankey.styles_dict['default'].shape_position_type).toBe('scale_adapted')
  })

  it('absolu : les centres du fichier sont preserves', () => {
    const { area, nodes } = makeArea(false, 3)
    setAbsoluteMode(area)
    expect(nodes[0].center_y).toBe(500)
  })

  // Aire deja dessinee : le coin EST la verite (il a pu etre deplace au geste), le settle doit
  // continuer de le commiter. Sans quoi le correctif casserait le #1230/#384.
  it('aire deja dessinee : le settle commit toujours le coin courant', () => {
    const { area, nodes } = makeArea(true, 40)
    setScaleAdaptedMode(area)
    expect(nodes[0].center_y).toBe(120) // 100 + 40/2
  })
})
