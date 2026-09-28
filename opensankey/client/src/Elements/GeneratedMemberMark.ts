// os#1511 — LA MARQUE DES ÉLÉMENTS ENGENDRÉS, et rien d'autre.
//
// Ce module ne dépend de rien, et c'est sa raison d'être : la marque est lue par le
// constructeur d'un flux (`Class_LinkElement`) comme par l'algorithme qui engendre ces flux
// (`Algorithms/DimensionDisaggregation`). La déclarer dans l'un des deux ferait un cycle
// d'imports entre eux — et un cycle sur une valeur lue à la construction se paie en `undefined`
// au pire moment (cf. le cycle Element → Handler).

/**
 * Marque qui sépare, dans l'identifiant d'un élément engendré, son origine de son membre.
 * Choisie longue et improbable : elle doit rester reconnaissable sur le graphe, et ne jamais
 * apparaître par hasard dans un identifiant écrit à la main ou venu d'un tableur.
 */
export const MEMBER_NODE_MARK = '--par--'

/**
 * Reconnaît un élément engendré À SON IDENTIFIANT. C'est la garde n°1 de la désagrégation :
 * elle ne dépend d'aucun état en mémoire, donc elle vaut aussi bien dans un constructeur que
 * juste après un chargement.
 */
export function isGeneratedMemberId(id: string): boolean {
  return id.includes(MEMBER_NODE_MARK)
}
