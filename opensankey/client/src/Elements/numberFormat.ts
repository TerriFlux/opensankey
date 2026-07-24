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

// OS#305 — Helper de formatage PUR, volontairement SANS aucune dépendance.
//
// Il vit à part de ValueFormatting parce que celui-ci importe
// `getNameLabelValues`, qui tire toute la chaîne ElementsAttributesConfig ->
// Element -> Node -> Handler : intestable en isolation. Ici, la règle fragile
// (la regex de séparation des milliers) reste couverte par des tests.

/**
 * Sépare les milliers par une espace fine typographique (espace simple), sans
 * jamais toucher à la partie décimale : `1234.5678` -> `1 234.5678`.
 */
export const addThousandsSeparator = (s: string): string =>
  s.replace(/(?<!\..*)(\d)(?=(?:\d{3})+(?:\.|$))/g, '$1 ')
