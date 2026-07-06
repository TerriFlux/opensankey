// #232 — Migration du format de `heredited_attr` (attributs hérités d'une vue OSP).
//
// Ancien format (fichiers legacy) : `heredited_attr` était un `string[]` (la liste
// des modes d'attributs hérités), et la vue SOURCE était portée séparément par
// `heredited_source_id`. Format actuel : un dictionnaire indexé par id de source,
// `{ [source_id: string]: string[] }`, permettant la cascade multi-source.
//
// Cette fonction PURE (aucun import lourd → testable en isolation) normalise le
// champ d'un JSON de vue vers le format dict. Elle est appelée à l'identique par
// `viewsFromJSON` (ouverture de fichier) et `addViewsFromJSON` (import de vues).

/** JSON minimal d'une vue portant (peut-être) les champs d'héritage. */
export type Type_ViewHereditedJSON = {
  heredited_attr?: string[] | { [source_id: string]: string[] }
  heredited_source_id?: string
}

/**
 * Normalise `heredited_attr` vers le format dictionnaire `{ [source]: string[] }`.
 *
 * @param view_json JSON de la vue (peut porter l'ancien ou le nouveau format).
 * @param default_source_id id de source par défaut (le maître) utilisé quand un
 *   fichier legacy n'a pas de `heredited_source_id`.
 * @returns le dictionnaire des attributs hérités par source (jamais undefined).
 */
export function migrateHereditedAttr(
  view_json: Type_ViewHereditedJSON,
  default_source_id: string
): { [source_id: string]: string[] } {
  const raw_attr = view_json.heredited_attr
  if (Array.isArray(raw_attr)) {
    // Ancien format string[] : source dans heredited_source_id (défaut = maître).
    const legacy_src = view_json.heredited_source_id ?? default_source_id
    return { [legacy_src]: raw_attr }
  }
  // Format actuel (dict) ou champ absent → dict tel quel, ou vide.
  return raw_attr ?? {}
}
