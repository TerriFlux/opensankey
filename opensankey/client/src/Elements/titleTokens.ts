// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// os#1511 — jetons du titre. Module FEUILLE (aucun import) : `TextZone` l'importe, et un test peut le
// charger seul sans réveiller le cycle Élément → gestionnaire (cf. Class_StockShape).

/**
 * Le nom d'une dimension au pluriel, en minuscules, pour le titre (« Filière » → « filières »,
 * « Type de matière » → « types de matière ») : le premier mot prend un s, sauf s'il finit déjà
 * par s, x ou z.
 */
export const pluralGroupName = (name: string): string => {
  const words = name.trim().split(/\s+/)
  if (words.length === 0 || words[0] === '') return name
  const first = words[0].charAt(0).toLocaleLowerCase() + words[0].slice(1)
  words[0] = /[sxz]$/i.test(first) ? first : first + 's'
  return words.join(' ')
}
