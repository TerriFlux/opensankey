import { envelopeBBoxOfMembers, Type_EnvelopeMember } from './envelopeBBox'

// Garde de régression pour l'issue #392 — la hauteur d'un cadre englobant tenait
// compte des LIBELLÉS de ses membres, pas seulement de leurs boîtes.
//
// Un libellé de nœud est centré sur sa forme (`dominant-baseline: middle`) : dès
// que le nœud est plus FIN que son propre texte, le texte déborde de part et
// d'autre et entre dans le `getBBox()` du membre — que `_computeEnvelopeBBox`
// lisait sur les quatre côtés. Le cadre devenait donc plus haut que sa pile
// d'enfants, laissant une marge résiduelle sous le dernier membre.
//
// Mesuré sur le modèle SOCLE « Détail des modes de production » (cadre « Œufs »,
// membre unique) : membre de 20 px, libellé de 30 px → cadre rendu à 31,4 px.
// Contre-épreuve faite dans l'appli : masquer le libellé du MEMBRE ramène le
// cadre à 20 px, alors que grossir ou masquer le titre du CADRE ne change rien —
// le titre du cadre n'entre pas dans l'enveloppe, contrairement à ce que
// l'énoncé de l'issue supposait.
//
// Correctif : l'enveloppe reste labels inclus HORIZONTALEMENT (acquis du #363,
// les libellés débordant à gauche doivent être entourés) mais épouse les seules
// boîtes des membres VERTICALEMENT.

/** Membre de 20 px de haut dont le libellé de 30 px déborde de 5 px de chaque côté. */
const membre_fin: Type_EnvelopeMember = {
  position_x: 260,
  position_y: 100,
  logical_w: 400,
  logical_h: 20,
  svg_bbox: { x: -140, y: -5, width: 540, height: 30 },
}

describe('#392 — envelopeBBoxOfMembers : le libellé ne pèse pas sur la hauteur', () => {
  it('la hauteur épouse la boîte du membre, pas son libellé débordant', () => {
    const bbox = envelopeBBoxOfMembers([membre_fin])!
    expect(bbox.min_y).toBe(100)
    expect(bbox.max_y).toBe(120) // et non 125 (débord bas du libellé)
  })

  it('la largeur reste labels inclus (acquis du #363)', () => {
    const bbox = envelopeBBoxOfMembers([membre_fin])!
    expect(bbox.min_x).toBe(120) // 260 − 140 de débord à gauche
    expect(bbox.max_x).toBe(660)
  })

  it('empile plusieurs membres sans marge résiduelle sous le dernier', () => {
    const membres = [0, 20, 40].map(dy => ({ ...membre_fin, position_y: 100 + dy }))
    const bbox = envelopeBBoxOfMembers(membres)!
    expect(bbox.min_y).toBe(100)
    expect(bbox.max_y).toBe(160) // 3 × 20 px collés, rien de plus
  })

  it('retombe sur la boîte logique quand la bbox SVG est absente ou vide', () => {
    const sans_dom = { ...membre_fin, svg_bbox: null }
    const vide = { ...membre_fin, svg_bbox: { x: 0, y: 0, width: 0, height: 0 } }
    for (const m of [sans_dom, vide]) {
      const bbox = envelopeBBoxOfMembers([m])!
      expect(bbox.min_x).toBe(260)
      expect(bbox.max_x).toBe(660)
      expect(bbox.min_y).toBe(100)
      expect(bbox.max_y).toBe(120)
    }
  })

  it('renvoie null sans membre à envelopper', () => {
    expect(envelopeBBoxOfMembers([])).toBeNull()
  })
})
