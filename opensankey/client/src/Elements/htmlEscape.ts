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

// OS#305 — Échappement HTML, PUR et sans dépendance (donc testable en isolation).
//
// Les constructeurs de contenu hérités assemblent du HTML par concaténation et
// l'injectent tel quel. Tout ce qui vient du DOCUMENT — nom d'un nœud, libellé
// d'un tag, unité, texte d'hypothèse… — est saisi par l'auteur : sans
// échappement, un `<` ou un `"` casse le tableau au mieux, injecte du balisage au
// pire. Une implémentation unique, appliquée à CHAQUE interpolation de texte
// issu du modèle.
//
// Les libellés d'interface (i18n) ne passent pas par ici : ce sont nos propres
// chaînes, et certaines contiennent volontairement du balisage.

/**
 * Échappe les caractères qui ont un sens en HTML. Couvre aussi l'apostrophe :
 * une valeur interpolée dans un attribut délimité par des apostrophes serait
 * sinon échappable.
 */
export const escapeHtml = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  return String(value)
    .split('&').join('&amp;')
    .split('<').join('&lt;')
    .split('>').join('&gt;')
    .split('"').join('&quot;')
    .split('\'').join('&#39;')
}
