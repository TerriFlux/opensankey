// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================

/**
 * `@terriflux/opensankey` — le VIEWER OpenSankey : modèle, rendu D3, persistance, algorithmes de
 * placement, lecture des vues.
 *
 * L'API publique est en **imports profonds** :
 *
 *     import { Class_ApplicationData } from '@terriflux/opensankey/src/types/ApplicationData'
 *
 * Ce point d'entrée n'exporte rien et n'a AUCUN effet de bord — c'est voulu. L'ancien `index.tsx`
 * montait l'application au chargement (`createRoot`) : il est parti dans
 * `@terriflux/opensankey-editor` avec le reste de l'atelier d'édition (OS#1331), dont ce paquet ne
 * dépend jamais — un test l'impose (`architectureBoundary.test.ts`).
 */
export {}
