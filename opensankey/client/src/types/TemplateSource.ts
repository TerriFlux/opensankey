// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================

/**
 * Origine d'un modele de la galerie — module FEUILLE, aucun import.
 *
 * OS#1331 : ce type etait declare dans `components/topmenus/SankeyTemplates`, parti dans le paquet
 * editeur, alors que `types/MenuConfig` (viewer) l'utilise. Un `import type` ne cree pas de
 * dependance a l'execution, mais il en cree une A LA COMPILATION : le viewer ne pouvait plus
 * type-checker sans l'editeur. Un contrat partage appartient au cote le plus bas des deux.
 */
export type Type_TemplateSource = 'sankeydata' | 'mfadata' | 'esankey-local'
