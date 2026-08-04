// ==================================================================================================
// #364 — Politique de visibilité d'un CADRE ENGLOBANT (nœud parent dont au moins une
// dimension est en `container_mode`) quand il ne reste aucun flux visible.
//
// Isolé ici en fonction PURE, comme les autres politiques du dossier (cf.
// `tiedFrameRefit`, `ioOrderGeometry`) : la décision se teste sans le graphe d3/DOM
// ni la cascade de visibilité de `Class_NodeElement`, qui n'en fournit que les
// entrées (`Class_NodeElement.orphan_visible` lit ses dimensions, délègue ici, puis
// applique).
// ==================================================================================================

/**
 * Vue minimale d'une dimension « en tant que parent » : le mode englobant éventuel
 * et la visibilité courante de ses enfants.
 */
export type Type_ContainerFrameDim = {
  /** `null` hors mode englobant, sinon l'un des `Type_ContainerMode`. */
  container_mode: unknown,
  /** Membres du cadre pour cette dimension. */
  children: { is_visible: boolean }[],
}

/**
 * Vrai si ces dimensions font du nœud un cadre englobant : au moins une dimension
 * en `container_mode` portant des enfants.
 */
export const isContainerFrame = (
  dims: Type_ContainerFrameDim[]
): boolean => dims.some(dim => !!dim.container_mode && dim.children.length > 0)

/**
 * Vrai si au moins un membre du cadre est visible pour la sélection courante.
 *
 * Le critère porte sur les ENFANTS, jamais sur les flux propres du cadre : en mode
 * `in_children_out_children` le parent est une enveloppe pure, dont les flux — quand
 * il en a — sont de toute façon tous masqués par le mode englobant.
 *
 * C'est le pivot des DEUX décisions, exactement complémentaires (#368) :
 * — faux → `containerFrameIsEmptied` masque le cadre (#364, soustractif) ;
 * — vrai → `Class_NodeElement.is_visible_as_container_frame` le dessine quels que
 *   soient ses flux propres (#368, additif).
 * Un cadre n'a donc plus rien à devoir à ses propres flux, dans un sens comme dans
 * l'autre — seule la règle orphelin reste au-dessus, comme levier manuel.
 */
export const hasVisibleFrameMember = (
  dims: Type_ContainerFrameDim[]
): boolean => dims.some(dim => !!dim.container_mode && dim.children.some(child => child.is_visible))

/**
 * Vrai si ce cadre englobant doit être masqué : c'est bien un cadre, et la sélection
 * courante de dataTags n'y laisse AUCUN membre visible.
 *
 * Sans cette porte, un tel cadre tombait dans la règle « nœud orphelin » (option
 * `shape_orphan_node_visible`, activée par défaut) qui le maintenait affiché — vide,
 * avec son libellé, empilé avec ses semblables. Cas d'usage : un axe de ventilation
 * (dataTag) qui ne concerne qu'une partie des filières d'un modèle transversal.
 *
 * La décision est purement SOUSTRACTIVE : un cadre à membres visibles repasse par la
 * règle orphelin d'origine, qui reste le levier de masquage manuel.
 */
export const containerFrameIsEmptied = (
  dims: Type_ContainerFrameDim[]
): boolean => isContainerFrame(dims) && !hasVisibleFrameMember(dims)
