// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================

// os#1390 (jalon 81) — L'ÉTOILE D'UN NŒUD, COMME DONNÉE DE DESSIN.
//
// Le contrat entre celui qui LIT le modèle (`buildUnitaryStar`) et celui qui DESSINE
// (`drawUnitaryStar`), sur le patron déjà en place pour la couronne et l'histogramme :
// une structure plate, sans instance du modèle dedans, que le moteur consomme sans rien
// savoir d'OpenSankey.
//
// POURQUOI CETTE SÉPARATION, ET POURQUOI MAINTENANT. Montrer l'étoile d'un nœud coûtait
// jusqu'ici une sérialisation du diagramme entier, le chargement d'une seconde application,
// la suppression un par un des nœuds hors de l'étoile, une deuxième sérialisation et un
// troisième chargement — pour une dizaine de nœuds. Ce prix n'achetait pas la fidélité :
// le board unitaire jette délibérément tout ce qu'il hérite (styles remis d'usine, géométrie
// effacée, format papier libre, légende masquée). Il n'achetait que le moteur de rendu.
//
// LE JALON 81 LE DIT DÉJÀ, dans sa couture avec le jalon 79 : « l'aperçu unitaire reste une
// REPRÉSENTATION ; la brique, elle, est un objet de l'étage DONNÉES ». Deux besoins, deux
// chemins. Celui-ci est l'aperçu.
//
// LA CONDITION DE NON-DIVERGENCE. Ce que l'aperçu montre et ce que la brique exporte doivent
// rester la même étoile, sinon on aurait deux vérités. Elle est tenue MÉCANIQUEMENT et non par
// discipline : `buildUnitaryStar` et `starNodeIds` (celui de l'extraction, qui définit le
// périmètre de la brique) lisent la même fonction de voisinage. Changer la définition de
// l'étoile d'un côté la change de l'autre, par construction.

/**
 * Mode d'affichage des valeurs d'une étoile. Les trois que porte déjà le board :
 * - `percent`    : part de la somme des entrées / des sorties du nœud central ;
 * - `value`      : la valeur brute, avec son unité ;
 * - `normalized` : le rapport à un flux de référence, fixé à 1.
 */
export type Type_UnitaryValueMode = 'percent' | 'value' | 'normalized'

/** Un flux de l'étoile, vu depuis le nœud central. */
export type Type_UnitaryStarBranch = {
  /** Identifiant du flux dans le modèle — sert au pointage, jamais au DOM (cf. dom_id_prefix). */
  id: string
  /**
   * Ce que le flux montre comme nom : le nom AFFICHÉ de l'autre extrémité, celui que le
   * diagramme produit (gabarit, tag, nœud ancêtre), et non le `name` brut.
   */
  label: string
  /** Valeur brute, dans l'unité du modèle. Sert à l'ÉPAISSEUR, jamais au texte. */
  value: number
  /** La valeur telle qu'elle s'écrit dans le mode courant, unité comprise. */
  text: string
  /** Couleur du flux, ou à défaut celle de l'autre extrémité. */
  color: string
}

/**
 * L'étoile d'un nœud : lui-même, ses flux entrants et ses flux sortants VISIBLES.
 * C'est exactement le périmètre de la brique — même définition de voisinage.
 */
export type Type_UnitaryStar = {
  /** Nom affiché du nœud central. */
  center_label: string
  /** Sa valeur, écrite selon le mode ; vide quand le mode ne lui en donne pas. */
  center_text: string
  /** Flux entrants, dans l'ordre du modèle. */
  inputs: Type_UnitaryStarBranch[]
  /** Flux sortants, dans l'ordre du modèle. */
  outputs: Type_UnitaryStarBranch[]
  /** Vrai quand le nœud n'a aucun flux visible : il n'y a pas d'étoile à montrer. */
  is_empty: boolean
}

/**
 * os#1422 — CIBLE D'UN GESTE dans l'étoile.
 *
 * `branch_node` est le nœud à l'AUTRE bout d'une branche — c'est ce que son libellé écrit, et
 * donc ce qu'on vise en le cliquant. Il est identifié par l'identifiant du FLUX de la branche,
 * le seul que l'étoile transporte (`Type_UnitaryStarBranch.id`) : l'appelant retrouve le nœud
 * par le flux, ce que le moteur ne saurait pas faire sans connaître le modèle.
 *
 * Le centre, lui, n'a pas d'identifiant du tout (cf. `Type_UnitaryStar`, qui n'en porte que le
 * nom affiché) : celui qui a monté la figure sait quel nœud elle montre, puisqu'il le lui a donné.
 */
export type Type_UnitaryStarGestureTarget =
  | { kind: 'center' }
  | { kind: 'ribbon', link_id: string }
  | { kind: 'branch_node', link_id: string }

/**
 * os#1422 — LES GESTES QUE L'ÉTOILE EXPOSE, et rien de ce qu'ils déclenchent.
 *
 * Le moteur ne sait ni renommer, ni sélectionner, ni agréger : il dit CE QU'ON A VISÉ, l'appelant
 * agit sur le document. C'est la même frontière que le clic droit (`Type_RepresentationMenu`) et
 * c'est ce qui permet à ce fichier de rester sans React et sans import du modèle.
 */
export type Type_UnitaryStarInteractions = {
  /** Clic gauche (pas de glissement) sur le centre, un ruban, ou le libellé d'une branche. */
  onClick?: (target: Type_UnitaryStarGestureTarget) => void
  /**
   * Renommage EN PLACE. Absent, ni le double-clic ni `beginRename` ne font quoi que ce soit —
   * et le clic simple part alors sans délai, puisque aucun double-clic n'est attendu.
   */
  rename?: {
    canRename: (target: Type_UnitaryStarGestureTarget) => boolean
    current: (target: Type_UnitaryStarGestureTarget) => string
    commit: (target: Type_UnitaryStarGestureTarget, value: string) => void
  }
}

/**
 * La poignée d'une étoile dessinée : ce que l'hôte peut lui demander APRÈS le tracé.
 *
 * Une seule entrée, et c'est voulu : le renommage est le seul geste qu'un menu contextuel ne
 * peut pas accomplir tout seul, puisqu'il a besoin d'un champ de saisie POSÉ SUR LA FIGURE —
 * l'endroit du libellé n'est connu que du moteur qui l'a écrit.
 */
export type Type_UnitaryStarHandle = {
  /** Ouvre la saisie sur le libellé visé ; ne fait rien si la cible n'en porte pas. */
  beginRename: (target: Type_UnitaryStarGestureTarget) => void
}

/** Habillage du dessin, traduit par l'appelant (le moteur ne connaît pas i18n). */
export type Type_UnitaryStarOptions = {
  /** Texte affiché quand l'étoile est vide. */
  empty_label?: string
  /** Libellé du flux de référence en mode normalisé, s'il y en a un. */
  reference_label?: string
  /**
   * Rubans en GRIS uniforme — c'est le défaut, et l'aspect qu'avait l'ancien board unitaire, qui
   * posait `default_element_color` sur tout ce qu'il dessinait. `false` rend aux branches les
   * couleurs du diagramme (`branch.color`). Le pourquoi du défaut est dans `UnitaryStarChart`,
   * là où la couleur se pose.
   */
  neutral_colors?: boolean
  /**
   * os#1422 — les gestes de l'appelant. Absents, le dessin est INERTE, exactement comme avant :
   * aucun écouteur n'est posé, et l'étoile reste une image.
   */
  interactions?: Type_UnitaryStarInteractions
}
