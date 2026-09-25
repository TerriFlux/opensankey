// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1445 — CE QU'UNE PART DÉSIGNE DANS LE DOCUMENT.
//
// Correction de Julien (20/09) : « une part ne correspond pas nécessairement à un nœud, ça peut
// être des flux et autres choses si on les regroupe avec une étiquette ». C'est exact, et la
// première version de ce lot généralisait depuis le seul chemin qu'elle avait lu.
//
// Les quatre sortes, telles que les décompositions les produisent :
//
//  | décomposition                   | ce qu'est une part         | identifiant          |
//  | hiérarchie (couronne)           | un nœud enfant             | `node.id`            |
//  | flux entrants / sortants        | un FLUX                    | `link.id`            |
//  | flux groupés par étiquette      | une SOMME de flux          | `tag.id`             |
//  | complément (mode « déclaré »)   | rien                       | `<id>__residual__`   |
//
// Le troisième cas est celui qui interdit de réduire une part à un élément : sous `group_by`, une
// part est l'addition de tous les flux portant une étiquette (`decomposeNodeFlows`). Aucun objet
// unique n'est derrière elle — l'étiquette est ce qu'elle désigne, pas ce qu'elle est.
//
// STRUCTUREL ET NON NOMINAL : on ne décrit ici que ce que la part LIT de son sujet. Importer
// `Class_NodeElement` / `Class_LinkElement` / `Class_Tag` attacherait ce module à trois classes
// concrètes pour trois lectures, et rouvrirait les cycles d'import que `ElementNaming` documente.

/**
 * Ce qu'une part désigne. `kind: 'none'` est une réponse et non un manque : le secteur de
 * complément ne désigne rien, et c'est ce qui fait qu'il ne renomme rien en amont.
 */
export type Type_PartSubject =
  | { kind: 'node', node: Type_NamedSubject }
  | { kind: 'flux', link: Type_NamedSubject }
  | { kind: 'tag', tag: Type_NamedSubject }
  // 25/09/2026 — LE TOUT, et c'est la cinquième sorte. Arbitrage de Julien : « pour la couronne, il
  // me semble que le centre peut aussi être considéré comme un élément, non ? »
  //
  // Oui, et c'est le même mouvement que les quatre autres. Le centre d'une couronne écrit le nom de
  // l'objet regardé et son total : il désigne donc ce dont la figure parle EN ENTIER, là où un
  // secteur en désigne un morceau. C'est une part dont le sujet est la somme des autres.
  | { kind: 'whole', whole: Type_NamedSubject }
  | { kind: 'none' }

/** Tout ce qu'une part demande à son sujet : un nom, et de quoi le suivre s'il change. */
export interface Type_NamedSubject {
  id: string
  name: string
}

export const NO_SUBJECT: Type_PartSubject = { kind: 'none' }

/** L'objet désigné, quelle que soit sa sorte — ou `null` pour un secteur de complément. */
export const subjectObjectOf = (subject: Type_PartSubject): Type_NamedSubject | null => {
  switch (subject.kind) {
  case 'node': return subject.node
  case 'flux': return subject.link
  case 'tag': return subject.tag
  case 'whole': return subject.whole
  default: return null
  }
}

/**
 * Le nom que le sujet porte AUJOURD'HUI dans le document.
 *
 * Ce n'est pas ce que la part affiche : une part peut porter un ALIAS, qui gagne (cf.
 * `Class_PartElement.name_label_effective` et le §1 ter du contrat). C'est le repli, et c'est ce
 * qui fait que renommer un nœud sur le diagramme change ce que la couronne montre — tant que
 * personne n'a écrit d'alias pour elle.
 */
export const subjectNameOf = (subject: Type_PartSubject): string =>
  subjectObjectOf(subject)?.name ?? ''
