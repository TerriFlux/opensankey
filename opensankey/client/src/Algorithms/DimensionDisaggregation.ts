// os#1511 lot 2B — DÉSAGRÉGATION D'UN NŒUD EN SUIVANT SA DIMENSION.
//
// Un nœud peut représenter un axe entier : le nœud « Monde » EST l'axe des pays. Au niveau
// courant de cette dimension, il se remplace par un nœud par membre visible — régions, puis
// pays — et les flux qui l'atteignaient se répartissent sur eux selon leurs valeurs taguées.
//
// LES NŒUDS ENGENDRÉS SONT TRANSITOIRES (décision du 28/09) : jamais écrits dans le fichier,
// refabriqués à chaque ouverture et à chaque changement de niveau. Seul l'ATTACHEMENT du nœud
// à sa dimension est persistant. Ce que l'utilisateur déplace survit par la géométrie portée
// par le MEMBRE (`Class_DataTag.position`), pas par le nœud.
//
// TROIS GARDES REPRISES DES NŒUDS D'ÉCHANGE, qui ont coûté cher en août (Bois Savoie : 928
// nœuds au lieu de 506, « trop de flux visibles » à tous les niveaux) :
//
//  1. la forme engendrée se reconnaît SUR LE GRAPHE (`isGeneratedMemberNode`), jamais à un
//     drapeau non persisté — un tel drapeau est toujours absent au chargement, donc la garde
//     qu'il porte est toujours vraie, donc inopérante ;
//  2. on garde au PORTILLON et PAR NŒUD : un fichier mixte — un nœud d'axe plus un déjà
//     engendré — ouvre le portillon et ferait engendrer le second une seconde fois ;
//  3. on retire les engendrés d'un tour précédent AVANT d'engendrer, pour que changer de
//     niveau ne laisse pas les nœuds de l'ancien.
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import type { Class_Sankey } from '../types/Sankey'
import { MEMBER_NODE_MARK as MARQUE, isGeneratedMemberId } from '../Elements/GeneratedMemberMark'

// La marque vit dans un module SANS dépendance : le constructeur d'un flux la lit aussi, pour
// ne pas déplier de cube sur un flux engendré, et la déclarer ici ferait un cycle d'imports.
export { MEMBER_NODE_MARK } from '../Elements/GeneratedMemberMark'

/** Identifiant du nœud qui représente `membre` pour le nœud d'axe `axe`. */
export function memberNodeId(axe_id: string, membre_id: string): string {
  return `${axe_id}${MARQUE}${membre_id}`
}

/**
 * Reconnaît un nœud engendré À SA FORME, sur le graphe. C'est la garde n°1 : elle ne dépend
 * d'aucun état en mémoire, donc elle vaut aussi bien juste après un chargement qu'en plein
 * milieu d'une session.
 */
export function isGeneratedMemberNode(node: Class_NodeElement): boolean {
  return isGeneratedMemberId(node.id)
}

/** Même reconnaissance pour un flux engendré : à sa forme, sur le graphe. */
export function isGeneratedMemberLink(link: Class_LinkElement): boolean {
  return isGeneratedMemberId(link.id)
}

/** Le nœud d'axe dont `node` a été engendré, s'il en est un. */
export function drivingNodeIdOf(node: Class_NodeElement): string | undefined {
  if (!isGeneratedMemberNode(node)) return undefined
  return node.id.split(MARQUE)[0]
}

/**
 * Retire tous les nœuds engendrés d'un tour précédent. Appelée avant d'engendrer : sans elle,
 * descendre d'un niveau ajouterait les pays SANS retirer les régions.
 *
 * Les flux qui les touchaient disparaissent avec eux — ils étaient engendrés eux aussi.
 */
export function removeGeneratedMemberNodes(sankey: Class_Sankey): number {
  sankey.links_list.filter(isGeneratedMemberLink).forEach(link => sankey.deleteLink(link))
  const engendres = sankey.nodes_list.filter(isGeneratedMemberNode)
  engendres.forEach(node => sankey.deleteNode(node))
  // Les nœuds d'axe et leurs flux n'avaient pas été supprimés mais MASQUÉS : on les rend.
  //
  // C'est le correctif d'une première version qui les supprimait, et qui n'était donc pas
  // répétable — or l'opération doit l'être à chaque changement de niveau. Après un tour, il
  // n'y avait plus d'axe d'où repartir : le second tour ne rendait rien et le diagramme se
  // vidait. Garder l'axe évite aussi d'avoir à le reconstruire à la sérialisation.
  sankey.nodes_list
    .filter(node => node.is_driven_by_dimension)
    .forEach(axe => {
      axe.setVisible()
      ;[...axe.input_links_list, ...axe.output_links_list].forEach(flux => flux.setVisible())
    })
  return engendres.length
}

/**
 * Désagrège tous les nœuds d'axe du diagramme sur les ENFANTS du membre choisi.
 *
 * Rend le nombre de nœuds engendrés. Un nœud d'axe dont aucun membre n'est choisi n'est pas
 * désagrégé : il n'y aurait rien à montrer, et le vider serait pire que le laisser.
 */
export function disaggregateDimensionNodes(sankey: Class_Sankey): number {
  removeGeneratedMemberNodes(sankey)

  // Garde n°2, au PORTILLON : on ne prend que les nœuds d'axe, et jamais un engendré (un
  // fichier mixte en contient, et il ne faut pas les désagréger une seconde fois).
  const axes = sankey.nodes_list.filter(node =>
    !isGeneratedMemberNode(node) && node.is_driven_by_dimension)
  if (axes.length === 0) return 0

  let engendres = 0
  axes.forEach(axe => {
    // Garde n°2, PAR NŒUD : `is_driven_by_dimension` a pu devenir faux entre-temps (dimension
    // supprimée par un tour précédent de cette même boucle).
    const dimension = axe.driving_dimension
    if (dimension === undefined) return
    // Les ENFANTS du membre choisi (décision de Julien, 28/09). On descend dans l'arbre en
    // désignant un parent : « Monde » montre les régions, « Europe » ses pays, et un membre
    // TERMINAL ne se découpe plus — il se montre seul.
    //
    // La règle vient d'une contrainte du cube : `getValueForDataTags` n'adresse qu'UN membre
    // par dimension, deux membres cochés ne rendent aucune valeur. Montrer « tous les membres
    // du niveau » rendait donc le sélecteur inopérant (choisir l'Espagne affichait les quatre
    // pays), et filtrer sur le seul membre choisi supprimait toute désagrégation. Les enfants
    // satisfont les deux : on lit toujours un membre, on en montre plusieurs.
    // Plusieurs membres cochés donnent l'UNION de leurs enfants. Ne lire que le premier
    // reviendrait à ignorer les autres en silence — or cocher deux membres veut dire qu'on
    // veut voir les deux (les bandes d'un flux, elles, se dérivent déjà ainsi au dessin).
    const choisis = dimension.selected_tags_list as Class_DataTag[]
    if (choisis.length === 0) return
    const membres: Class_DataTag[] = []
    choisis.forEach(choisi => {
      const descente = choisi.children.length > 0 ? choisi.children : [choisi]
      descente.forEach(membre => { if (!membres.includes(membre)) membres.push(membre) })
    })
    engendres += disaggregateOne(sankey, axe, dimension, membres)
  })
  return engendres
}

/** Désagrège UN nœud d'axe : un nœud par membre, puis les flux répartis, puis l'axe retiré. */
function disaggregateOne(
  sankey: Class_Sankey,
  axe: Class_NodeElement,
  dimension: Class_DataTagGroup,
  membres: Class_DataTag[]
): number {
  // Les flux à répartir sont relevés AVANT toute création : la liste du nœud change au fur et
  // à mesure qu'on l'y raccroche, et l'itérer en la modifiant sauterait des flux.
  const entrants = [...axe.input_links_list]
  const sortants = [...axe.output_links_list]

  const noeuds_par_membre = new Map<string, Class_NodeElement>()
  membres.forEach(membre => {
    const nouveau = sankey.addNewNode(memberNodeId(axe.id, membre.id), membre.name)
    // La géométrie vient du MEMBRE : c'est elle qui survit à la régénération. À défaut, le
    // nœud d'axe sert de point de départ — tous les membres s'empilent alors à sa place, ce
    // qui est au moins un endroit prévisible.
    const position = membre.position
    nouveau.setPosXY(position?.x ?? axe.position_x, position?.y ?? axe.position_y)
    nouveau.copyAttrFrom(axe)
    noeuds_par_membre.set(membre.id, nouveau)
  })

  entrants.forEach(flux => repartir(sankey, flux, membres, noeuds_par_membre, 'target'))
  sortants.forEach(flux => repartir(sankey, flux, membres, noeuds_par_membre, 'source'))

  // Le nœud d'axe quitte le DESSIN, pas le modèle : il est représenté par ses membres, mais il
  // reste ce d'où l'on repart au prochain changement de niveau — et ce que le fichier écrit.
  axe.setInvisible()
  return noeuds_par_membre.size
}

/**
 * Répartit un flux sur les nœuds de membre : un flux par membre qui porte quelque chose.
 *
 * Un membre dont la contribution est ABSENTE ne reçoit AUCUN flux — pas un flux à zéro. C'est
 * la même règle que l'agrégat du lot 1 : « ce flux n'existe pas ici » n'est pas « il vaut 0 »,
 * et un flux fantôme à zéro se dessinerait.
 */
function repartir(
  sankey: Class_Sankey,
  flux: Class_LinkElement,
  membres: Class_DataTag[],
  noeuds_par_membre: Map<string, Class_NodeElement>,
  bout: 'source' | 'target'
): void {
  const autre_bout = bout === 'target' ? flux.source : flux.target
  membres.forEach(membre => {
    const noeud_membre = noeuds_par_membre.get(membre.id)
    if (noeud_membre === undefined) return
    const contributions = contributionsPourMembre(flux, membre)
    if (contributions === null) return
    // L'identifiant porte la MARQUE : c'est ce qui rend le flux engendré reconnaissable sur le
    // graphe, comme son nœud, et donc effaçable au tour suivant sans tenir de registre.
    const id = `${flux.id}${MARQUE}${membre.id}`
    const nouveau = bout === 'target'
      ? sankey.addNewLinkWithId(id, autre_bout, noeud_membre)
      : sankey.addNewLinkWithId(id, noeud_membre, autre_bout)
    nouveau.copyAttrFrom(flux)
    // Sa valeur est un SCALAIRE : un flux engendré naît d'un choix de coordonnées, donc il ne
    // porte pas de cube (cf. le constructeur de `Class_LinkElement`, qui reconnaît la marque).
    // Elle ne dépend ainsi d'aucune sélection — ce qui la rend lisible même quand deux membres
    // sont cochés, là où une valeur rangée à une coordonnée ne l'était pas.
    const valeur = nouveau.value
    if (valeur !== null) {
      valeur.valueData = contributions
    }
  })
  // Le flux d'origine est MASQUÉ, jamais supprimé : il porte les valeurs de tous les membres,
  // c'est de lui qu'on repartira au prochain changement de niveau, et c'est lui que le fichier
  // écrit.
  flux.setInvisible()
}

/**
 * Ce que le flux apporte à CE membre, `null` s'il n'apporte rien.
 *
 * On passe par la résolution du lot 1 en visant le membre : elle rend la valeur portée au
 * niveau demandé si elle existe, sinon l'agrégat de ses feuilles, et `null` si tout est
 * absent. La sélection de la dimension est posée le temps de la lecture puis rendue — lire
 * une valeur ne doit pas laisser le diagramme sur un autre membre que celui de l'utilisateur.
 */
function contributionsPourMembre(flux: Class_LinkElement, membre: Class_DataTag): number | null {
  const dimension = membre.group
  // La coordonnée à lire : celle de l'utilisateur, sauf sur l'axe découpé, où l'on vise CE
  // membre. On ne pose rien dans le modèle — poser la sélection puis la rendre coûtait 36 s sur
  // le SOCLE pour huit membres, chaque bascule parcourant les 263 étiquettes de l'axe et
  // invalidant les caches de visibilité du diagramme entier.
  const coordonnee = (flux.selected_data_tags_list as Class_DataTag[])
    .filter(tag => tag.group !== dimension)
    .concat([membre])
  const contributions = flux.contributingValuesFor(coordonnee)
  if (contributions === null || contributions.length === 0) return null
  return contributions.reduce((total, valeur) => total + (valeur.valueData ?? 0), 0)
}
