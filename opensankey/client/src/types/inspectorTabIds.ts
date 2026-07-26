// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

/**
 * Identifiants d'onglets de l'inspecteur — module FEUILLE, sans aucun import.
 *
 * Ces ids sont un contrat partagé entre deux zones : l'inspecteur les déclare (côté édition,
 * `registerBaseSections`) et le modèle les désigne (la visite guidée #1255 doit demander
 * l'ouverture de l'onglet « Valeur », parce que le champ de valeur d'un flux n'est dans le DOM
 * que si cet onglet est actif).
 *
 * Ils vivent donc du côté viewer, et non dans `InspectorRegistry` : #1331 scinde OS en un paquet
 * viewer et un paquet éditeur, et le viewer ne doit rien importer de l'éditeur. Un contrat partagé
 * appartient au côté le plus bas des deux. `InspectorRegistry` le réexporte pour ne pas casser
 * les imports existants.
 */
export const INSPECTOR_TAB_VALUE_ID = 'os.tab.valeur'
