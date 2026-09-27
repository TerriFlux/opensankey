/**
 * Identifiant d'un flux ÉCLATÉ (cf. Class_NodeDimension.split_links) : la bande, sur le parent
 * `parent_id`, du flux enfant `origin_id`. Jamais enregistré ; stable d'un chargement à l'autre
 * pour que l'ordre des flux d'un nœud puisse le citer.
 */
export const SPLIT_LINK_SEP = '#split:'
export const splitLinkId = (origin_id: string, parent_id: string): string => origin_id + SPLIT_LINK_SEP + parent_id
