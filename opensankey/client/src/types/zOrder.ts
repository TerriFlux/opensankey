/**
 * Politique d'ordre Z (axe Z) des éléments du diagramme — nœuds, flux ET zones de
 * texte (« zones de texte » / free labels). Logique pure, isolée du graphe d3/DOM
 * de Class_DrawingArea pour être testable.
 *
 * L'ordre est porté par la liste `list_g_element` (front-to-back : l'index 0 est au
 * 1er plan ; cf. orderElementOnDA qui trie le DOM sur la liste *inversée*).
 *
 * Régression « zones de texte / axe Z » : l'application d'une mise en page
 * (updateFrom) peut laisser des ids EN DOUBLE dans la liste. `attrDrawingArea`
 * pré-amorce la liste avec l'ordre Z de la source (les zones de la source n'existent
 * pas encore dans la cible → ids conservés tels quels), puis `addFreeLabel` crée ces
 * zones via addNewContainer, dont le constructeur (Class_ContainerElement) RE-POUSSE
 * chaque id à la fin, dans l'ordre des données. Le tri reposant sur indexOf, un
 * doublon ferait choisir l'occurrence ajoutée (ordre de création) au lieu de celle de
 * l'ordre Z source → ordre Z incorrect tant qu'on n'avait pas « nudgé » un élément au
 * 1er/dernier plan à la main (moveOrderElementInDA dédoublonne déjà, lui). On
 * dédoublonne donc en gardant la 1ʳᵉ occurrence — celle qui porte l'ordre Z voulu.
 */
export function dedupeZOrderKeepFirst(list: string[]): string[] {
  return [...new Set(list)]
}

/**
 * Comparateur d'ordre Z. `order` est la liste d'ordre du sens « arrière → avant » :
 * un id plus loin dans `order` est dessiné par-dessus. Les ids absents (indexOf = -1)
 * passent en premier, comme avant.
 */
export function compareZOrder(id_a: string, id_b: string, order: string[]): number {
  return order.indexOf(id_a) - order.indexOf(id_b)
}
