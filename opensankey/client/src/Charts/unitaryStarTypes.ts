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
}
