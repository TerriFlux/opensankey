// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1467 — LE SOCLE COMMUN DES FIGURES : ce que TOUTE nature doit servir.
//
// Julien, après une série de retours que je traitais un par un comme des défauts séparés :
//
//   « Chaque graphe est à la fois quelque chose de général, avec des attributs communs à tous les
//   graphes, et des attributs spécifiques. Et il faut les deux, ce n'est pas l'un ou l'autre. Et
//   tout le look and feel doit être similaire d'un graphe à l'autre, comme sur Excel. »
//
// C'était le diagnostic, et il était juste : les symptômes que je corrigeais un à un — le trait de
// rappel déclaré pour le sunburst et pas pour la couronne, l'unité résolue ici et pas là, la
// typographie réglable sur l'un et pas sur l'autre — ne sont pas trois défauts. C'est UN SEUL :
// rien ne garantissait qu'une nature serve tout le socle. Chacune l'a complété dans son coin, et
// l'écart s'est creusé sans que rien ne le dise.
//
// ── CE QUE CE MODULE EST, ET CE QU'IL N'EST PAS ───────────────────────────────────────────────
//
// Il n'ajoute AUCUN mécanisme. Le modèle d'Excel est déjà en place depuis os#1425 : un catalogue
// unique (`figureCatalogue`) déclare chaque question une fois, avec son mot et son widget, et
// chaque nature NOMME celles qui ont un sens chez elle (`honours`). Deux natures qui piquent la
// même clé partagent son libellé, son contrôle et son réglage.
//
// Ce qui manquait est la moitié d'en face : la LISTE DE CE QUI N'EST PAS OPTIONNEL. Un catalogue
// où tout est facultatif produit mécaniquement des natures inégales — celle qu'on a écrite en
// dernier sert ce dont on se souvenait ce jour-là.
//
// ── COMMENT LE SOCLE A ÉTÉ ÉTABLI ─────────────────────────────────────────────────────────────
//
// Pas par une opinion : par la mesure. Le sunburst sert 56 réglages, la couronne et les barres 27.
// Le socle est ce que le sunburst sert DÉJÀ, moins ce qui n'a de sens que dans un disque
// (l'orientation radiale, l'éclaircissement par profondeur, le nom réduit par l'anneau parent, les
// niveaux de légende). Autrement dit : la nature la plus complète a défini la barre, et les deux
// autres la rejoignent. C'est plus honnête que de trancher en chambre, et ça se vérifie.
//
// ── CE QUI RESTE PROPRE À UNE NATURE ──────────────────────────────────────────────────────────
//
// Tout le reste, et c'est la seconde moitié de la phrase de Julien : le trou et le contenu du
// centre, le pourcentage sur secteur, l'empilement des barres, l'orientation des étiquettes dans
// un disque. Le socle ne les interdit pas — il dit seulement qu'ils s'AJOUTENT, jamais qu'ils
// remplacent.

/**
 * Les clés que toute nature de figure doit déclarer.
 *
 * Groupées comme l'auteur les rencontre, et non par ordre alphabétique : c'est cette liste qu'on
 * relit pour décider si une nouvelle question est du socle ou d'une nature.
 */
export const FIGURE_COMMON_HONOURS: readonly string[] = [
  // LE TITRE — et tout ce qui l'écrit. Un titre en gras sur une couronne et un titre sans
  // graisse réglable sur un histogramme, c'est exactement le « look and feel » qui diverge.
  'title_visible',
  'title_text',
  'title_position',
  'title_font_size',
  'title_bold',

  // LA LÉGENDE.
  'legend_visible',
  'legend_parts',
  'legend_position',
  'legend_font_size',
  'legend_width',

  // LES PARTS : leur ordre, d'où vient leur couleur, à partir de quand on les replie.
  'parts_order',
  'parts_color_source',
  'parts_group_under',

  // L'ÉCHELLE, en pourcentage du cadre.
  'scale_factor',

  // LE NOM D'UNE PART — sa visibilité ET toute sa typographie. C'est le groupe où l'écart était le
  // plus large : la couronne n'en servait que deux clés sur douze.
  'name_label_is_visible',
  'name_label_font_family',
  'name_label_font_size',
  'name_label_bold',
  'name_label_italic',
  'name_label_uppercase',
  'name_label_color',
  'name_label_box_width',
  'name_label_separator',
  'name_label_separator_part',
  'name_label_prune_if_unfitting',
  'name_label_callout',

  // LA VALEUR D'UNE PART — sa visibilité et son écriture complète.
  'value_label_is_visible',
  'value_label_unit_visible',
  'value_label_significant_digits',
  'value_label_nb_significant_digits',
  'value_label_custom_digit',
  'value_label_nb_digit',
  'value_label_scientific_notation',

  // LES MENTIONS ET L'INTERACTION.
  'notes_visible',
  'interaction_tooltip',

  // LES ÉTIQUETTES DÉPOSÉES À LA MAIN. Non pas un réglage qu'on coche, mais le sac où le geste
  // s'écrit : une nature qui ne le déclare pas perd la position au premier rechargement.
  'label_positions'
] as const

/**
 * CE QUI DEVRAIT ÊTRE DANS LE SOCLE ET N'Y EST PAS ENCORE — os#1469.
 *
 * Ces clés sont communes par nature : le sunburst les sert, la couronne et les barres non. Elles ne
 * sont pas dans la liste ci-dessus parce qu'un socle qu'on ne tient pas n'est pas un socle — il
 * deviendrait un test rouge qu'on apprend à ignorer, ce qui est pire que pas de test.
 *
 * Les y faire entrer demande du DESSIN et pas seulement une déclaration, et c'est pour ça que ça
 * n'a pas été fait dans le même geste :
 *
 *   - la typographie du TITRE (police, italique, encre, alignement, retour à la ligne) : la
 *     couronne et les barres écrivent leur titre par `figureTitleOf`, qui n'en porte que cinq
 *     clés, là où le sunburst passe par les ZONES DE TEXTE et les porte toutes ;
 *   - `text_zones` : la conséquence de la même chose. Le titre n'est plus un cas à part depuis
 *     os#1449 — c'est la première zone de texte d'une figure, et l'auteur peut en ajouter
 *     d'autres. Le sunburst le fait ; les deux autres en sont restées au titre seul.
 *
 * Unifier les deux chemins de titre est le prochain pas, et il fera entrer les six d'un coup.
 */
export const FIGURE_COMMON_HONOURS_A_VENIR: readonly string[] = [
  'title_font_family',
  'title_italic',
  'title_color',
  'title_align',
  'title_wrap',
  'text_zones'
] as const

/**
 * Ce qui manque à une nature pour servir le socle, dans l'ordre de la liste.
 *
 * Rendu comme une LISTE et non comme un booléen : ce qu'on veut lire quand un test tombe, c'est
 * quelles questions cette figure ne sait pas poser — pas qu'elle a tort.
 */
export const figureCommonMisses = (
  attributes: { [key: string]: unknown } | undefined
): string[] => {
  const served = attributes ?? {}
  return FIGURE_COMMON_HONOURS.filter(key => served[key] === undefined)
}
