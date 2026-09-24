// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// 24/09/2026 — UNE NATURE QUI S'EN VA NE DOIT PAS EMPORTER LES FICHIERS AVEC ELLE.
//
// Julien : « tu peux enlever le sunburst maintenant je pense ». Le disque a fusionné avec la
// couronne : il en est devenu un MODE (`levels_display: 'rings'`), et son entrée n'a plus de raison
// d'être offerte — deux entrées pour une figure, c'est une de trop.
//
// ⚠️ MAIS SON IDENTIFIANT EST DANS DES FICHIERS. Il est écrit dans la grande zone de tout classeur
// dont l'auteur a ouvert un disque, et dans l'attribut de placement de tout nœud sur lequel il en a
// posé un. Retirer la nature sans plus rien en dire ferait de ces fenêtres des fenêtres SANS
// nature : elles ne se dessineraient pas, et personne ne saurait pourquoi.
//
// D'où cette table. Elle ne migre RIEN et ne réécrit aucun fichier : elle traduit à la LECTURE, une
// fois, à l'endroit où un identifiant stocké devient une nature. Un fichier ouvert puis enregistré
// portera la couronne ; un fichier jamais réenregistré continuera de s'ouvrir, indéfiniment.
//
// C'est le même procédé que `os.repr.unitary` (os#1387), et pour la même raison : une nature se
// retire, un fichier ne se retire pas.

/** Ce qu'une nature retirée est DEVENUE. */
export const RETIRED_REPRESENTATIONS: { readonly [old_id: string]: string } = {
  // Le disque est un mode de la couronne depuis la fusion (24/09/2026).
  'os.repr.sunburst': 'osp.repr.donut'
} as const

/**
 * L'identifiant de nature qui S'APPLIQUE, pour un identifiant lu d'un fichier ou d'un placement.
 * Inchangé pour tout ce qui n'a pas été retiré, ce qui est le cas de tout le reste.
 */
export const canonicalRepresentationId = (id: string): string =>
  RETIRED_REPRESENTATIONS[id] ?? id

/**
 * Les réglages à POSER sur une figure dont la nature a été retirée, pour qu'elle se redessine comme
 * avant. Une couronne qui remplace un disque doit dessiner des ANNEAUX : sans cette ligne, le
 * classeur s'ouvrirait en couronne « en place », c'est-à-dire un autre dessin que celui que
 * l'auteur avait enregistré.
 *
 * Rien pour les autres, et rien quand la nature n'a pas été retirée : on ne pose que ce qu'on doit.
 */
export const retiredRepresentationOptions = (old_id: string): { [key: string]: unknown } =>
  old_id === 'os.repr.sunburst' ? { levels_display: 'rings' } : {}
