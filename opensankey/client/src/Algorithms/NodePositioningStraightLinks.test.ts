import { enforceStraightLinks } from './NodePositioningStraightLinks'

// os#1372 — Garde de l'ensemble redressé, posée en même temps que l'optimisation de
// `enforceStraightLinks`. Le profil CARTOFOB (1 608 flux dans le modèle, 36 dessinés) attribuait
// 1,9 s d'une bascule de vue de 4,4 s a cette seule fonction : pour CHAQUE flux marqué
// `include_children`, elle re-parcourait `links_list` en evaluant `is_visible` — accesseur derive,
// non memoise — sur les 1 608 flux, et recalculait les descendances de la source et de la cible.
//
// L'optimisation ne change que la façon de collecter (candidats filtres une fois, descendances
// memoisees) ; ces tests verrouillent le RESULTAT, qui doit rester identique a la lettre.

type FakeNode = {
  id: string
  position_y: number
  position_u: number
  anchor: number
  dimensions_as_parent: { children: FakeNode[] }[]
  getOutputLinkStartingPoint: () => { y: number }
  getInputLinkEndingPoint: () => { y: number }
}

const node = (id: string, position_y: number, position_u = 0, anchor = 0): FakeNode => {
  const n: FakeNode = {
    id,
    position_y,
    position_u,
    anchor,
    dimensions_as_parent: [],
    getOutputLinkStartingPoint: () => ({ y: n.position_y + n.anchor }),
    getInputLinkEndingPoint: () => ({ y: n.position_y + n.anchor }),
  }
  return n
}

type FakeLink = {
  source: FakeNode
  target: FakeNode
  is_visible: boolean
  shape_is_recycling: boolean
  shape_must_stay_straight: boolean
  shape_straight_mode?: string
  shape_straight_include_children: boolean
  shape_straight_offset: number
}

const link = (source: FakeNode, target: FakeNode, opts: Partial<FakeLink> = {}): FakeLink => ({
  source,
  target,
  is_visible: true,
  shape_is_recycling: false,
  shape_must_stay_straight: false,
  shape_straight_include_children: false,
  shape_straight_offset: 0,
  ...opts,
})

// `enforceStraightLinks` ne lit de la DrawingArea que `sankey.node_taggs_dict` et
// `sankey.links_list` : un objet structurel suffit, comme pour containerRootsToRestack.
type Arg = Parameters<typeof enforceStraightLinks>[0]
const run = (links: FakeLink[]): boolean =>
  enforceStraightLinks({ sankey: { node_taggs_dict: {}, links_list: links } } as unknown as Arg)

describe('os#1372 — enforceStraightLinks : l ensemble redresse est inchange', () => {
  it('redresse un flux marque et visible en amenant la cible sur la source', () => {
    const a = node('a', 100)
    const b = node('b', 340)
    expect(run([link(a, b, { shape_must_stay_straight: true })])).toBe(true)
    expect(b.position_y).toBe(100)
  })

  it('ne touche a rien quand aucun flux n est marque', () => {
    const a = node('a', 100)
    const b = node('b', 340)
    expect(run([link(a, b)])).toBe(false)
    expect(b.position_y).toBe(340)
  })

  it('ecarte un flux marque mais INVISIBLE', () => {
    const a = node('a', 100)
    const b = node('b', 340)
    expect(run([link(a, b, { shape_must_stay_straight: true, is_visible: false })])).toBe(false)
    expect(b.position_y).toBe(340)
  })

  it('ecarte un flux marque de recyclage, et un flux boucle sur lui-meme', () => {
    const a = node('a', 100)
    const b = node('b', 340)
    expect(run([
      link(a, b, { shape_must_stay_straight: true, shape_is_recycling: true }),
      link(a, a, { shape_must_stay_straight: true }),
    ])).toBe(false)
    expect(b.position_y).toBe(340)
  })

  it('include_children redresse les flux enfant-enfant, et EUX SEULS', () => {
    // A -> B marque include_children. A a deux enfants, B en a deux. Seuls les flux dont la
    // source descend de A ET la cible descend de B heritent de la droiture.
    const a = node('a', 100), b = node('b', 340)
    const a1 = node('a1', 500), a2 = node('a2', 600)
    const b1 = node('b1', 700), b2 = node('b2', 800)
    const hors = node('hors', 900)
    a.dimensions_as_parent = [{ children: [a1, a2] }]
    b.dimensions_as_parent = [{ children: [b1, b2] }]

    const parent = link(a, b, { shape_must_stay_straight: true, shape_straight_include_children: true })
    const enfant_enfant = link(a1, b1)
    const enfant_vers_hors = link(a2, hors)

    expect(run([parent, enfant_enfant, enfant_vers_hors])).toBe(true)
    expect(b.position_y).toBe(100)   // le flux marque lui-meme
    expect(b1.position_y).toBe(500)  // amene sur a1, par heritage
    expect(hors.position_y).toBe(900) // hors de la descendance de B : intact
  })

  it('include_children ecarte un flux enfant INVISIBLE', () => {
    // Le filtrage des candidats est desormais fait une seule fois pour tout l appel : ce test
    // verrouille qu il porte toujours sur chaque candidat.
    const a = node('a', 100), b = node('b', 340)
    const a1 = node('a1', 500), b1 = node('b1', 700)
    a.dimensions_as_parent = [{ children: [a1] }]
    b.dimensions_as_parent = [{ children: [b1] }]

    run([
      link(a, b, { shape_must_stay_straight: true, shape_straight_include_children: true }),
      link(a1, b1, { is_visible: false }),
    ])
    expect(b1.position_y).toBe(700)
  })

  it('include_children traverse la hierarchie en profondeur', () => {
    // La descendance est transitive : un petit-enfant compte comme un enfant.
    const a = node('a', 100), b = node('b', 340)
    const a1 = node('a1', 500), a11 = node('a11', 510)
    const b1 = node('b1', 700), b11 = node('b11', 710)
    a.dimensions_as_parent = [{ children: [a1] }]
    a1.dimensions_as_parent = [{ children: [a11] }]
    b.dimensions_as_parent = [{ children: [b1] }]
    b1.dimensions_as_parent = [{ children: [b11] }]

    run([
      link(a, b, { shape_must_stay_straight: true, shape_straight_include_children: true }),
      link(a11, b11),
    ])
    expect(b11.position_y).toBe(510)
  })

  it('deux flux marques include_children partageant une source donnent le meme ensemble', () => {
    // Cas ou la memoisation des descendances entre en jeu : la descendance de A est demandee
    // deux fois. Le resultat doit etre celui de deux calculs independants.
    const a = node('a', 100), b = node('b', 340), c = node('c', 380)
    const a1 = node('a1', 500), b1 = node('b1', 700), c1 = node('c1', 900)
    a.dimensions_as_parent = [{ children: [a1] }]
    b.dimensions_as_parent = [{ children: [b1] }]
    c.dimensions_as_parent = [{ children: [c1] }]

    run([
      link(a, b, { shape_must_stay_straight: true, shape_straight_include_children: true }),
      link(a, c, { shape_must_stay_straight: true, shape_straight_include_children: true }),
      link(a1, b1),
      link(a1, c1),
    ])
    expect(b1.position_y).toBe(500)
    expect(c1.position_y).toBe(500)
  })

  it('est idempotent : un second passage ne bouge plus rien', () => {
    const a = node('a', 100)
    const b = node('b', 340)
    const links = [link(a, b, { shape_must_stay_straight: true })]
    expect(run(links)).toBe(true)
    expect(run(links)).toBe(false)
  })

  it('respecte l ecart vertical demande (shape_straight_offset)', () => {
    const a = node('a', 100)
    const b = node('b', 340)
    run([link(a, b, { shape_must_stay_straight: true, shape_straight_offset: 25 })])
    expect(b.position_y).toBe(125)
  })

  it('ancrage target : c est la SOURCE qui vient a la cible', () => {
    const a = node('a', 100)
    const b = node('b', 340)
    run([link(a, b, { shape_straight_mode: 'target' })])
    expect(a.position_y).toBe(340)
    expect(b.position_y).toBe(340)
  })
})
