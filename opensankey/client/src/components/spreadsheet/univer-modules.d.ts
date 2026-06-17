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
declare module '@univerjs/presets/preset-sheets-core/locales/fr-FR'
declare module '@univerjs/presets/preset-sheets-filter'
declare module '@univerjs/presets/preset-sheets-filter/locales/fr-FR'
declare module '@univerjs/presets/preset-sheets-sort'
declare module '@univerjs/presets/preset-sheets-sort/locales/fr-FR'
declare module '@univerjs/presets/preset-sheets-data-validation'
declare module '@univerjs/presets/preset-sheets-data-validation/locales/fr-FR'
