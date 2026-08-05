import { NodePositioning } from './NodePositioning'
import type { Class_DrawingArea } from '../types/DrawingArea'

// Issue #372 — un nœud déplacé à la souris revenait à sa place dès que son positionnement
// vertical était en « Écartement », et un membre de cadre englobant y revenait toujours.
//
// Ce test-ci prend le problème au niveau de l'ORCHESTRATION (NodePositioning), là où les deux
// empilements se recouvrent : les membres d'un cadre sont replacés depuis le HAUT du cadre, et la
// HAUTEUR du cadre est l'enveloppe de ses membres. Les fonctions de pile elles-mêmes sont
// couvertes une à une par NodePositioningStackSettle.test.ts.
//
// Le protocole reproduit la boucle réelle :
//   dessiner → déplacer (poser un position_y) → settle → redessiner
// et vérifie qu'au redessin la disposition DÉPOSÉE est reproduite. La contre-épreuve (même
// scénario sans settle) est explicitement testée : c'est le défaut du #372.

type FakeDim = { container_mode?: string, children: FakeNode[] }

type FakeNode = {
  id: string
  own_h: number
  position_u: number
  position_v: number
  position_y: number
  shape_position_type: string
  shape_position_dy: number
  shape_margin_top: number
  is_visible: boolean
  dimensions_as_parent: FakeDim[]
  dimensions_as_child: { container_mode?: string }[]
  getShapeHeightToUse(): number
  applyPosition(): void
  hasGivenTag(): boolean
  captureCenterFromCorner(): void
  reanchorTiedFrame(): void
}

const noeud = (
  id: string,
  o: { u?: number, v: number, y: number, h?: number, type?: string, dy?: number }
): FakeNode => ({
  id,
  own_h: o.h ?? 20,
  position_u: o.u ?? 0,
  position_v: o.v,
  position_y: o.y,
  shape_position_type: o.type ?? 'parametric',
  shape_position_dy: o.dy ?? 0,
  shape_margin_top: 0,
  is_visible: true,
  dimensions_as_parent: [],
  dimensions_as_child: [],
  // La hauteur d'un cadre englobant est l'ENVELOPPE de ses membres — c'est ce couplage qui
  // impose l'ordre des passes du settle (cadres d'abord, colonnes ensuite).
  getShapeHeightToUse(): number {
    const membres = (this as FakeNode).dimensions_as_parent
      .filter(d => d.container_mode)
      .flatMap(d => d.children)
      .filter(c => c.is_visible)
    if (membres.length === 0) return (this as FakeNode).own_h
    const haut = Math.min(...membres.map(c => c.position_y))
    const bas = Math.max(...membres.map(c => c.position_y + c.getShapeHeightToUse()))
    return bas - haut
  },
  applyPosition() { /* le vrai applique le coin au DOM ; sans objet ici */ },
  hasGivenTag() { return false },
  captureCenterFromCorner() { /* ancrage du centre persisté ; sans objet ici */ },
  // Un sous-cadre se recale sur l'enveloppe de ses membres ; le cadre racine reste ancré.
  reanchorTiedFrame() {
    const membres = (this as FakeNode).dimensions_as_parent
      .filter(d => d.container_mode)
      .flatMap(d => d.children)
      .filter(c => c.is_visible)
    if (membres.length > 0) (this as FakeNode).position_y = Math.min(...membres.map(c => c.position_y))
  },
})

/** Fait de `cadre` un cadre englobant de `membres` (dimension en `container_mode`). */
const englober = (cadre: FakeNode, membres: FakeNode[]) => {
  cadre.dimensions_as_parent.push({ container_mode: 'in_children_out_children', children: membres })
  membres.forEach(m => m.dimensions_as_child.push({ container_mode: 'in_children_out_children' }))
}

const positionner = (nodes: FakeNode[], gap_mode = 'constant', const_gap = 0) => {
  const drawingArea = {
    sankey: {
      node_taggs_dict: {},
      get nodes_list() { return nodes },
      get visible_nodes_list() { return nodes.filter(n => n.is_visible) },
    },
    effective_gap_mode: gap_mode,
    disaggregation_gap_value: const_gap,
  }
  const np = new NodePositioning(drawingArea as unknown as Class_DrawingArea)
  return {
    np,
    /** Les deux passes de placement du dessin, dans l'ordre de `DrawingArea.drawElements`. */
    dessiner() {
      np.anchorParametricNodesToAbsolute()
      np.restackContainerChildren()
    },
  }
}

const positions = (nodes: FakeNode[]) => Object.fromEntries(nodes.map(n => [n.id, n.position_y]))

describe('#372 — un nœud « Écartement » déplacé reste où on le pose', () => {
  it('reproduit la position déposée au redessin', () => {
    const a = noeud('a', { v: 1, y: 0, h: 30, type: 'absolute' })
    const b = noeud('b', { v: 2, y: 0, h: 20, dy: 10 })
    const c = noeud('c', { v: 3, y: 0, h: 20, dy: 10 })
    const { np, dessiner } = positionner([a, b, c])

    dessiner()
    expect(positions([a, b, c])).toEqual({ a: 0, b: 40, c: 70 })

    b.position_y = 150 // déplacement à la souris, par-delà 'c'
    np.settleParametricStacksFromY(new Set(['b']))
    dessiner()

    expect(b.position_y).toBe(150)
    // 'c' remonte dans le créneau que 'b' vient de quitter : en « Écartement » une position n'est
    // pas absolue, elle dit « à tant sous mon prédécesseur ». 'b' n'étant plus devant lui, le
    // prédécesseur de 'c' devient l'ancre 'a', et son écart de 10 se compte à partir d'elle.
    expect(c.position_y).toBe(40)
  })

  it('CONTRE-ÉPREUVE — sans le settle, le nœud revient à sa place (le défaut)', () => {
    const a = noeud('a', { v: 1, y: 0, h: 30, type: 'absolute' })
    const b = noeud('b', { v: 2, y: 0, h: 20, dy: 10 })
    const { dessiner } = positionner([a, b])

    dessiner()
    b.position_y = 150
    dessiner()

    expect(b.position_y).toBe(40) // rappelé par l'écart d'avant
  })

  it('ne touche pas aux nœuds absolus de la colonne, qui restent des ancres', () => {
    const a = noeud('a', { v: 1, y: 0, h: 30, type: 'absolute' })
    const b = noeud('b', { v: 2, y: 0, h: 20, dy: 10 })
    const { np, dessiner } = positionner([a, b])

    dessiner()
    a.position_y = 500 // l'ancre elle-même est déplacée
    np.settleParametricStacksFromY(new Set(['a']))
    dessiner()

    expect(a.position_y).toBe(500)
    expect(b.position_y).toBe(540) // la pile suit son ancre, à l'écart réglé
  })

  it('n’intervient pas sur un diagramme sans aucun nœud en « Écartement »', () => {
    // Garde-fou de non-régression : la chaîne est vide, aucun `position_v` ni écart n'est réécrit
    // sur un diagramme entièrement en coordonnées absolues.
    const a = noeud('a', { v: 3, y: 100, h: 30, type: 'absolute', dy: 7 })
    const b = noeud('b', { v: 1, y: 0, h: 20, type: 'absolute', dy: 9 })
    const { np } = positionner([a, b])

    expect(np.settleParametricStacksFromY(new Set<string>())).toBe(false)
    expect([a.position_v, a.shape_position_dy]).toEqual([3, 7])
    expect([b.position_v, b.shape_position_dy]).toEqual([1, 9])
  })
})

describe('#372 — cadre englobant : le cadre lui-même', () => {
  it('reste où on le pose, et emmène ses membres', () => {
    const ancre = noeud('ancre', { v: 1, y: 0, h: 30, type: 'absolute' })
    const cadre = noeud('cadre', { v: 2, y: 0, dy: 10 })
    const m1 = noeud('m1', { v: 1, y: 0 })
    const m2 = noeud('m2', { v: 2, y: 0 })
    englober(cadre, [m1, m2])
    const { np, dessiner } = positionner([ancre, cadre, m1, m2])

    dessiner()
    expect(positions([cadre, m1, m2])).toEqual({ cadre: 40, m1: 40, m2: 60 })

    cadre.position_y = 300
    np.settleParametricStacksFromY(new Set(['cadre']))
    dessiner()

    expect(positions([cadre, m1, m2])).toEqual({ cadre: 300, m1: 300, m2: 320 })
  })
})

describe('#372 — cadre englobant : un membre', () => {
  it('déposé au-dessus de son prédécesseur, prend son rang dans la pile', () => {
    // En mode d'écart « constant » (le cas du modèle SOCLE, valeur 0) la pile est jointive : le
    // seul degré de liberté d'un déplacement y est l'ORDRE, et c'est lui qui doit survivre.
    const cadre = noeud('cadre', { v: 1, y: 100, type: 'absolute' })
    const m1 = noeud('m1', { v: 1, y: 0 })
    const m2 = noeud('m2', { v: 2, y: 0 })
    const m3 = noeud('m3', { v: 3, y: 0 })
    englober(cadre, [m1, m2, m3])
    const { np, dessiner } = positionner([cadre, m1, m2, m3])

    dessiner()
    expect(positions([m1, m2, m3])).toEqual({ m1: 100, m2: 120, m3: 140 })

    m3.position_y = 90 // tiré tout en haut du cadre
    np.settleParametricStacksFromY(new Set(['m3']))
    dessiner()

    expect(positions([m3, m1, m2])).toEqual({ m3: 100, m1: 120, m2: 140 })
  })

  it('CONTRE-ÉPREUVE — sans le settle, l’ordre du fichier reprend la main', () => {
    const cadre = noeud('cadre', { v: 1, y: 100, type: 'absolute' })
    const m1 = noeud('m1', { v: 1, y: 0 })
    const m2 = noeud('m2', { v: 2, y: 0 })
    englober(cadre, [m1, m2])
    const { dessiner } = positionner([cadre, m1, m2])

    dessiner()
    m2.position_y = 90
    dessiner()

    expect(positions([m1, m2])).toEqual({ m1: 100, m2: 120 })
  })

  it('l’écart de colonne sous le cadre est réglé sur la hauteur RÉ-EMPILÉE, pas sur celle du dépôt', () => {
    // Le recouvrement des deux empilements : tirer un membre loin sous le cadre gonfle
    // l'enveloppe — donc la hauteur du cadre — le temps du dépôt. Régler l'écart de la colonne
    // sur cette hauteur transitoire creuserait un trou que le dessin suivant démentirait. D'où
    // l'ordre des passes : régler les cadres et les ré-empiler AVANT de régler les colonnes.
    const cadre = noeud('cadre', { v: 1, y: 0, type: 'absolute' })
    const m1 = noeud('m1', { v: 1, y: 0 })
    const m2 = noeud('m2', { v: 2, y: 0 })
    englober(cadre, [m1, m2])
    const suivant = noeud('suivant', { v: 2, y: 0, h: 20, dy: 10 })
    const { np, dessiner } = positionner([cadre, m1, m2, suivant])

    // Deux dessins pour la ligne de base : la hauteur d'un cadre est l'enveloppe de ses membres,
    // et l'empilement de colonne tourne AVANT le ré-empilement des membres — elle a donc un
    // dessin de retard au tout premier rendu (défaut connu, traité au #366).
    dessiner()
    dessiner()
    expect(positions([suivant])).toEqual({ suivant: 50 }) // 0 + 40 (enveloppe) + 10

    m2.position_y = 800 // membre tiré très bas : le cadre est momentanément immense
    np.settleParametricStacksFromY(new Set(['m2']))
    dessiner()

    expect(positions([m1, m2])).toEqual({ m1: 0, m2: 20 }) // ré-empilés jointivement
    expect(suivant.position_y).toBe(50) // l'écart n'a pas absorbé l'enveloppe transitoire
  })

  it('ne règle rien en mode d’écart « conserver » (les membres y sont posés à la main)', () => {
    const cadre = noeud('cadre', { v: 1, y: 100, type: 'absolute' })
    const m1 = noeud('m1', { v: 1, y: 100 })
    const m2 = noeud('m2', { v: 2, y: 200 })
    englober(cadre, [m1, m2])
    const { np, dessiner } = positionner([cadre, m1, m2], 'keep')

    m2.position_y = 90
    np.settleParametricStacksFromY(new Set(['m2']))
    dessiner()

    expect(m2.position_y).toBe(90) // laissé exactement là où il a été déposé
    expect(m2.position_v).toBe(2) // et son rang n'a pas été touché
  })
})
