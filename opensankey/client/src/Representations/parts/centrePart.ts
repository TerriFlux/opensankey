// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// 25/09/2026 — LE CENTRE D'UNE COURONNE EST UNE PART.
//
// Julien : « pour la couronne, il me semble que le centre peut aussi être considéré comme un
// élément, non ? »
//
// Oui, et c'est le même mouvement que les secteurs. Le centre écrit le nom de l'objet regardé et
// son total ; il se réglait par une liste fermée de quatre choix (`centre_content` : nom et valeur,
// nom seul, valeur seule, rien) pendant que tout le reste de la figure est un élément avec son
// libellé et sa valeur. Quatre cases là où il y avait trente réglages à côté.
//
// ── CE QUI CHANGE, ET CE QUI NE CHANGE PAS ───────────────────────────────────────────────────
//
// `centre_content` reste, et reste le DÉFAUT : c'est lui que portent les couronnes enregistrées, et
// il continue de décider ce que le centre montre tant que la part ne dit rien. La part le surcharge
// comme n'importe quel élément surcharge le réglage de sa figure — la doctrine du lecteur commun,
// sans exception nouvelle.
//
// ── POURQUOI UNE SOUS-NATURE, ET PAS `donut` ─────────────────────────────────────────────────
//
// Une part de centre n'est pas un secteur : elle n'a pas d'arc, donc pas d'orientation radiale, et
// elle n'a aucune raison d'hériter du style « Part de couronne » que l'auteur règle pour ses
// secteurs. Lui donner sa propre nature de figure (`figure_nature`) répond aux deux d'un coup :
//
//   - les portées qui nomment les figures rondes ne lui parlent plus — `name_label_orientation`
//     est `{ figures: { only: ['donut', 'sunburst'] } }`, elle disparaît donc d'elle-même ;
//   - `partNatureStyleOf` ne trouve aucun style pour elle : elle s'en tient au style générique des
//     parts, ce qui est exactement ce qu'on veut.
//
// Aucune de ces deux conséquences ne demande une ligne de plus : c'est la portée par nature de
// figure (os#1483) et le semis par nature (os#1462) qui les produisent.

/**
 * L'identifiant de la part de centre, dans le document de parts d'une figure.
 *
 * ⚠️ IL NE DÉSIGNE AUCUN NŒUD, et c'est ce qui le rend sûr : un identifiant de nœud ne peut pas le
 * heurter (les deux points ne sont pas un caractère d'identifiant de nœud), et les gestes qui
 * cherchent un nœud par l'identifiant d'une part — le clic qui déplie, par exemple — ne trouvent
 * rien et s'arrêtent, ce qui est le comportement juste.
 */
export const FIGURE_CENTRE_PART_ID = 'os.figure.centre'

/** La nature de figure d'une part de centre. Cf. l'en-tête : ce n'est pas un secteur. */
export const FIGURE_CENTRE_NATURE = 'donut_centre'

/** Cette part est-elle le centre de sa figure ? */
export const isFigureCentrePart = (part_id: string): boolean =>
  part_id === FIGURE_CENTRE_PART_ID
