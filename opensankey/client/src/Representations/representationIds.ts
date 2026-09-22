// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// sa#563 — LES IDENTIFIANTS DE NATURES QUI SE CITENT AILLEURS QUE DANS LEUR DÉCLARATION.
//
// MODULE FEUILLE : aucun import, et c'est sa raison d'être — même patron qu'`Elements/legendIds`.
// Deux de ses lecteurs ne peuvent pas se permettre d'en avoir : `openPresentation.ts`, qui est
// appelé depuis les gestes de canvas et dont l'en-tête impose de rester léger (importer le module
// de RENDU refermerait un cycle), et `legendGroupPresentation.tsx`. Poser ces chaînes à côté de
// leur `register({...})` les aurait obligés à tirer tout le registre — donc les tracés d3, les
// icônes et le formulaire générique — pour connaître une chaîne de trente caractères.
//
// Ces identifiants sont STABLES : `PublishOptions.representations` les cite, donc une page
// publiée les contient. On ne les renomme pas (cf. l'en-tête de `RepresentationRegistry`).

/**
 * « Infos » — les blocs de présentation d'un élément (description, bilan des flux, étiquettes),
 * à l'échelle ÉLÉMENT. C'était la colonne gauche de la pop-up de présentation ; c'est la nature
 * par défaut du volet qu'un clic sur un nœud ou un flux ouvre.
 */
export const ELEMENT_INFO_REPRESENTATION_ID = 'os.repr.element_info'

/**
 * « Vue » d'un groupe d'étiquettes — le diagramme mis en forme par ce seul groupe, à l'échelle
 * DIAGRAMME (le groupe est un réglage, cf. `TagGroupViewRepresentation`).
 */
export const TAG_GROUP_VIEW_REPRESENTATION_ID = 'os.repr.tag_group_view'
