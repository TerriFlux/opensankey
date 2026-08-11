// os#1340 — règle d'entrée en édition inline d'un libellé.
//
// Module FEUILLE : aucun import, donc utilisable depuis un test sans réveiller le
// cycle d'initialisation Element -> Handler (cf. elementInitCycle*).
//
// Deux entrées, deux intentions distinctes — convention Excel / Explorateur Windows /
// draw.io, rétablie après une convergence malheureuse des deux comportements :
//   - frappe directe d'un caractère sur un élément sélectionné (#688) = REMPLACER ;
//     le caractère tapé devient le libellé, le curseur se place après lui. Auparavant
//     il était ignoré : l'éditeur s'ouvrait tout sélectionné et la frappe était avalée.
//   - F2 / double-clic = ÉDITER l'existant, entièrement sélectionné.

export type Type_InlineEditEntry =
  /** Le libellé est remplacé par `text`, curseur APRÈS lui. */
  | { mode: 'replace', text: string }
  /** Le libellé existant est conservé et entièrement sélectionné. */
  | { mode: 'edit_existing' }

/**
 * @param initial_value caractère tapé (frappe directe), ou `undefined` pour F2/double-clic.
 *   Une chaîne vide vaut `undefined` : on ne remplace jamais un libellé par du vide.
 */
export function resolveInlineEditEntry(initial_value?: string): Type_InlineEditEntry {
  if (initial_value !== undefined && initial_value !== '')
    return { mode: 'replace', text: initial_value }
  return { mode: 'edit_existing' }
}
