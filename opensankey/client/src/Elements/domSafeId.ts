// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

/**
 * sa#586 — encode un identifiant d'élément en fragment d'id DOM, de façon INJECTIVE.
 *
 * Module feuille, sans import : `Element.tsx` l'utilise (cf. `types/elementBasics.ts` pour la
 * raison de garder ses dépendances au plus court).
 *
 * L'ancien dérivé (`id.replace(/[^a-zA-Z0-9]/g, '')`) supprimait tout le reste : « 25 » et « -25 »,
 * « Co-produits » et « Coproduits », « Céréales » et « Cèreales » tombaient sur le même groupe
 * SVG, et le second élément dessiné prenait la place du premier, sans message.
 *
 * Code préfixe, donc injectif :
 *   - `[A-Za-z0-9_]` est recopié tel quel ;
 *   - `-` devient `--` ;
 *   - tout autre caractère devient `-<code point en hexadécimal minuscule>-` (`é` → `-e9-`,
 *     espace → `-20-`, `.` → `-2e-`).
 * À la lecture, un `-` ouvre toujours une séquence : suivi d'un `-`, c'est un tiret ; sinon des
 * chiffres hexadécimaux jusqu'au `-` fermant. Deux identifiants distincts donnent donc deux
 * résultats distincts.
 *
 * Le résultat ne contient que `[A-Za-z0-9_-]` : préfixé par une lettre (`gg_`, `arrowband_`…), il
 * est un id HTML valide ET un identifiant CSS utilisable tel quel dans `'#' + id` ou `url(#id)`.
 * Un identifiant déjà fait de `[A-Za-z0-9_]` est rendu inchangé (chemin rapide).
 */
export function domSafeId(id: string): string {
  if (/^[A-Za-z0-9_]*$/.test(id)) return id
  let out = ''
  for (const ch of id) { // itère par code point : un caractère hors BMP reste une seule séquence
    if (/[A-Za-z0-9_]/.test(ch)) out += ch
    else if (ch === '-') out += '--'
    else out += '-' + (ch.codePointAt(0) as number).toString(16) + '-'
  }
  return out
}
