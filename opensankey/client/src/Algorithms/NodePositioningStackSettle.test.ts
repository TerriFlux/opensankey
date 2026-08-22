import {
  Type_StackMember,
  sortStackMembers,
  settleStackOrderFromY,
  settleStackGapsFromY,
} from './NodePositioningGeometry'

// Garde de régression pour l'issue #372 — un nœud déplacé à la souris revenait à sa place quand
// son positionnement vertical était en « Écartement ».
//
// Mécanisme. La position d'un nœud en écartement n'est pas stockée : elle est DÉRIVÉE de l'écart
// (`shape_position_dy`) au nœud qui le précède dans sa colonne, et rejouée à chaque dessin. Le
// déplacement posait un `position_y` sans toucher à l'écart : le dessin suivant réécrivait la
// position déposée à partir de l'écart d'avant. Même mécanisme pour les membres d'un cadre
// englobant, dont la position vient de leur rang dans la pile du cadre.
//
// Le correctif est de lire la pile DANS LES DEUX SENS à partir de la même chaîne :
//   écarts → positions  = le dessin (anchorParametricNodesToAbsolute, stackContainerChildren) ;
//   positions → écarts  = le settle de fin de déplacement (settleStackOrderFromY puis
//                         settleStackGapsFromY), testé ici.
//
// Point capital du réglage : SEULS LES MEMBRES DÉPLACÉS portent une position qui fait autorité.
// Celle des autres vient du dernier empilement et sera recalculée au dessin suivant — la relire
// comme une donnée les figerait, et une pile perdrait le droit de suivre l'ancre qu'on vient de
// déplacer. Les deux fonctions prennent donc un prédicat `moved`.
//
// La propriété qui compte est l'ALLER-RETOUR : empiler après avoir réglé doit redonner exactement
// les positions déposées (§ « Aller-retour » ci-dessous).

type Fake = Type_StackMember & { id: string, h: number }

const membre = (id: string, v: number, y: number, h: number, dy = 0): Fake => ({
  id,
  h,
  position_v: v,
  position_y: y,
  shape_position_dy: dy,
  getShapeHeightToUse() { return (this as Fake).h },
})

/** Prédicat `moved` bâti sur une liste d'identifiants. */
const deplaces = (...ids: string[]) => (m: Fake) => ids.includes(m.id)

/**
 * L'empilement du dessin, reproduit à l'identique : chaque membre retenu par `stacks` se pose à
 * l'écart `shape_position_dy` sous le bas de celui qui le précède dans la chaîne ; le premier, et
 * tout membre non retenu, gardent la position que le mode global leur donne.
 */
const empiler = (chain: Fake[], stacks: (m: Fake) => boolean = () => true) => {
  let prev_bottom: number | null = null
  chain.forEach(m => {
    if (prev_bottom !== null && stacks(m)) m.position_y = prev_bottom + (m.shape_position_dy ?? 0)
    prev_bottom = m.position_y + m.getShapeHeightToUse()
  })
}

const yParId = (chain: Fake[]) => Object.fromEntries(chain.map(m => [m.id, m.position_y]))

describe('#372 — ordre de parcours de la pile', () => {
  it('trie par position_v croissant', () => {
    const a = membre('a', 2, 0, 10)
    const b = membre('b', 1, 0, 10)
    expect(sortStackMembers([a, b]).map(m => m.id)).toEqual(['b', 'a'])
  })

  it('départage deux v égaux par position_y (chaîne stable malgré les doublons de v)', () => {
    const a = membre('a', 1, 300, 10)
    const b = membre('b', 1, 100, 10)
    expect(sortStackMembers([a, b]).map(m => m.id)).toEqual(['b', 'a'])
  })

  it('ne modifie pas le tableau reçu', () => {
    const a = membre('a', 2, 0, 10)
    const b = membre('b', 1, 0, 10)
    const source = [a, b]
    sortStackMembers(source)
    expect(source.map(m => m.id)).toEqual(['a', 'b'])
  })
})

describe('#372 — positions → ORDRE (settleStackOrderFromY)', () => {
  it('ne touche à rien quand aucun membre n’a été déplacé', () => {
    // Le settle tourne à CHAQUE fin de déplacement, y compris sur les colonnes que le
    // déplacement n'a pas touchées : il ne doit pas y faire dériver les rangs.
    const chain = [membre('a', 1, 0, 10), membre('b', 2, 20, 10), membre('c', 3, 40, 10)]
    const ordered = settleStackOrderFromY(chain, () => false)
    expect(ordered.map(m => m.id)).toEqual(['a', 'b', 'c'])
    expect(ordered.map(m => m.position_v)).toEqual([1, 2, 3])
  })

  it('donne son rang à un membre déposé au-dessus de son prédécesseur', () => {
    // Le cœur du cas « tirer un nœud vers le haut » : sans reprise de l'ordre, l'écart serait
    // négatif, clampé à 0, et le nœud reviendrait se coller SOUS son prédécesseur.
    const a = membre('a', 1, 100, 10)
    const b = membre('b', 2, 200, 10)
    const c = membre('c', 3, 40, 10) // déposé tout en haut
    const ordered = settleStackOrderFromY([a, b, c], deplaces('c'))
    expect(ordered.map(m => m.id)).toEqual(['c', 'a', 'b'])
  })

  it('garde les NON déplacés dans leur ordre relatif', () => {
    // Deux membres non déplacés se croisent en y (état transitoire d'un empilement en cours) :
    // leur ordre ne bouge pas, ils ne sont que des repères pour celui qu'on réinsère.
    const a = membre('a', 1, 300, 10)
    const b = membre('b', 2, 100, 10)
    const mobile = membre('m', 3, 0, 10)
    const ordered = settleStackOrderFromY([a, b, mobile], deplaces('m'))
    expect(ordered.map(m => m.id)).toEqual(['m', 'a', 'b'])
  })

  it('PERMUTE les valeurs de v sans en inventer (l’ensemble est conservé)', () => {
    // Réattribuer des rangs neufs (0,1,2…) ferait dériver la chaîne vis-à-vis des nœuds qui n'en
    // font pas partie — invisibles sous la sélection courante, notamment.
    const chain = [membre('a', 5, 100, 10), membre('b', 9, 40, 10), membre('c', 12, 200, 10)]
    const ordered = settleStackOrderFromY(chain, deplaces('b'))
    expect(ordered.map(m => m.id)).toEqual(['b', 'a', 'c'])
    expect(ordered.map(m => m.position_v)).toEqual([5, 9, 12])
  })

  it('compare les rangs sur les CENTRES, pas sur les bords supérieurs', () => {
    // Un membre haut de 200 px et un petit déposé à cheval sur lui, bord supérieur PLUS BAS que
    // le sien : un rang lu sur les bords supérieurs le mettrait derrière, alors qu'il est
    // visiblement dans la moitié haute du gros — donc devant.
    const gros = membre('gros', 1, 0, 200) // centre 100
    const petit = membre('petit', 2, 80, 10) // bord sup. 80 > 0, mais centre 85 < 100
    const ordered = settleStackOrderFromY([gros, petit], deplaces('petit'))
    expect(ordered.map(m => m.id)).toEqual(['petit', 'gros'])
  })

  it('tolère une chaîne de moins de deux membres', () => {
    expect(settleStackOrderFromY([], () => true).length).toBe(0)
    const seul = membre('a', 7, 100, 10)
    expect(settleStackOrderFromY([seul], () => true)).toEqual([seul])
    expect(seul.position_v).toBe(7)
  })
})

describe('#372 — positions → ÉCARTS (settleStackGapsFromY)', () => {
  it('écrit l’écart au BAS du prédécesseur, pas à son haut', () => {
    const chain = [membre('a', 1, 0, 30), membre('b', 2, 50, 10)]
    expect(settleStackGapsFromY(chain, deplaces('b'))).toBe(0)
    expect(chain[1].shape_position_dy).toBe(20) // 50 − (0 + 30)
  })

  it('laisse le premier membre de la chaîne intact (il n’a pas de prédécesseur)', () => {
    const chain = [membre('a', 1, 100, 10, 42), membre('b', 2, 130, 10)]
    settleStackGapsFromY(chain, () => true)
    expect(chain[0].shape_position_dy).toBe(42)
  })

  it('clampe un chevauchement à 0 et le compte', () => {
    const chain = [membre('a', 1, 0, 30), membre('b', 2, 10, 10), membre('c', 3, 5, 10)]
    expect(settleStackGapsFromY(chain, () => true)).toBe(2)
    expect(chain[1].shape_position_dy).toBe(0)
    expect(chain[2].shape_position_dy).toBe(0)
  })

  it('saute les membres non retenus mais les garde comme PRÉDÉCESSEURS', () => {
    // Une colonne mélange des nœuds « Écartement » et des nœuds absolus : ces derniers gardent la
    // position que le mode global leur donne (on ne leur écrit pas d'écart), mais la pile pend
    // bien sous eux — ils doivent donc rester dans la chaîne.
    const a = membre('a', 1, 0, 30)
    const b = membre('b', 2, 50, 10, 999) // absolu : non réglé
    const c = membre('c', 3, 100, 10)
    settleStackGapsFromY([a, b, c], m => m.id !== 'b')
    expect(b.shape_position_dy).toBe(999)
    expect(c.shape_position_dy).toBe(40) // 100 − (50 + 10), donc bien mesuré depuis b
  })
})

describe('#372 — aller-retour : empiler après avoir réglé redonne la disposition déposée', () => {
  it('un nœud tiré vers le BAS reste où on le pose, et sa pile le suit', () => {
    const chain = [membre('a', 1, 0, 30), membre('b', 2, 30, 20), membre('c', 3, 80, 10, 30)]
    // L'utilisateur descend 'b' de 15 px, sans dépasser 'c' ; 'c' n'a pas bougé et suivra.
    chain[1].position_y = 45
    const ordered = settleStackOrderFromY(chain, deplaces('b'))
    settleStackGapsFromY(ordered, deplaces('b'))
    empiler(ordered)

    expect(ordered.map(m => m.id)).toEqual(['a', 'b', 'c'])
    expect(yParId(ordered)).toEqual({ a: 0, b: 45, c: 95 }) // 'c' garde son écart de 30
  })

  it('un nœud tiré vers le HAUT, au-dessus de son prédécesseur, y reste', () => {
    const a = membre('a', 1, 100, 30)
    const b = membre('b', 2, 130, 20)
    b.position_y = 40 // tiré au-dessus de 'a'

    const ordered = settleStackOrderFromY([a, b], deplaces('b'))
    settleStackGapsFromY(ordered, deplaces('b'))
    empiler(ordered, m => m.id === 'b') // 'a' est une ancre absolue : le dessin ne l'empile pas

    expect(ordered.map(m => m.id)).toEqual(['b', 'a'])
    expect(yParId(ordered)).toEqual({ b: 40, a: 100 })
  })

  it('SANS reprise de l’ordre, le même nœud revient se coller sous son prédécesseur', () => {
    // Contre-épreuve : c'est exactement ce que donnerait un settle qui ne règle que les écarts.
    const a = membre('a', 1, 100, 30)
    const b = membre('b', 2, 40, 20)
    const chain = sortStackMembers([a, b])
    settleStackGapsFromY(chain, deplaces('b'))
    empiler(chain)
    expect(b.position_y).toBe(130) // 100 + 30 + 0 — le déplacement est perdu
  })

  it('une ancre déplacée EMMÈNE sa pile au lieu de se faire doubler', () => {
    // Le comportement documenté du mix « Écartement » : une pile de nœuds en écartement pend
    // sous l'ancre absolue de sa colonne. Régler la pile entière sur les y la ferait passer
    // devant l'ancre dès qu'on tire celle-ci vers le bas.
    // C'est l'appelant qui applique la règle : une ancre absolue n'est pas un membre de pile,
    // donc son déplacement ne la fait pas changer de rang (prédicat `moved` vide côté ordre) et
    // n'écrit aucun écart.
    const ancre = membre('ancre', 1, 0, 30)
    const pendu = membre('pendu', 2, 40, 20, 10)
    ancre.position_y = 500

    const ordered = settleStackOrderFromY([ancre, pendu], () => false)
    settleStackGapsFromY(ordered, () => false)
    empiler(ordered, m => m.id === 'pendu')

    expect(yParId(ordered)).toEqual({ ancre: 500, pendu: 540 })
  })

  it('rejouer le settle sur une pile déjà réglée ne bouge plus rien', () => {
    const chain = [membre('a', 1, 0, 30), membre('b', 2, 30, 20), membre('c', 3, 80, 10)]
    chain[1].position_y = 130 // 'b' passe sous 'c'

    let ordered = settleStackOrderFromY(chain, deplaces('b'))
    settleStackGapsFromY(ordered, deplaces('b'))
    empiler(ordered)
    const apres_1 = ordered.map(m => [m.id, m.position_v, m.position_y, m.shape_position_dy])

    ordered = settleStackOrderFromY(ordered, deplaces('b'))
    settleStackGapsFromY(ordered, deplaces('b'))
    empiler(ordered)
    expect(ordered.map(m => [m.id, m.position_v, m.position_y, m.shape_position_dy])).toEqual(apres_1)
  })
})
