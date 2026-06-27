// ==================================================================================================
// The MIT License (MIT) - Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Shim de types pour Univer.
// Univer (@univerjs/presets) n'expose ses déclarations QUE via le champ `exports` (condition
// "types"), non lu par la `moduleResolution: "Node"` (classique) du tsconfig du projet -> `tsc`
// remonte TS7016 « Could not find a declaration file ». On déclare les modules utilisés en `any`
// (ce qui correspond déjà à l'usage du facade Univer côté code) pour débloquer le build de types.
// Fix propre alternatif (plus intrusif) : passer le projet en moduleResolution "Bundler"/"NodeNext".
// ==================================================================================================

declare module '@univerjs/presets'
declare module '@univerjs/presets/preset-sheets-core'
// Locales chargées dynamiquement selon la langue applicative (en-US/fr-FR/es-ES/de-DE/it-IT) ->
// déclaration générique par dossier de locales.
declare module '@univerjs/presets/preset-sheets-core/locales/*'
declare module '@univerjs/presets/preset-sheets-filter'
declare module '@univerjs/presets/preset-sheets-filter/locales/*'
declare module '@univerjs/presets/preset-sheets-sort'
declare module '@univerjs/presets/preset-sheets-sort/locales/*'
declare module '@univerjs/presets/preset-sheets-data-validation'
declare module '@univerjs/presets/preset-sheets-data-validation/locales/*'
