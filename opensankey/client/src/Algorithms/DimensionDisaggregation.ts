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
import { foldSmallParts, OTHERS_COLOR, OTHERS_ID } from './DimensionOthers'
import { NodeLeftExtremityStyle, NodeRightExtremityStyle } from '../Elements/ElementStyle'

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
  const engendres = sankey.nodes_list.filter(isGeneratedMemberNode)

  // QUI A ENGENDRÉ CE QU'ON RETIRE — relevé AVANT la suppression, et lu SUR LE GRAPHE : la
  // marque d'id d'un nœud engendré nomme le nœud d'axe dont il vient (`drivingNodeIdOf`).
  //
  // ⚠️ C'EST LA SEULE MÉMOIRE FIABLE, et s'en passer était un défaut. La version précédente
  // rendait leur visibilité aux nœuds `is_driven_by_dimension`, c'est-à-dire aux axes
  // D'AUJOURD'HUI. Or le nœud qu'on vient de DÉTACHER n'en est plus un, et c'est précisément
  // celui qu'il faut rendre : il avait été masqué quand il était axe, plus rien ne le
  // ressuscitait. Constaté par Julien le 29/09 sur la démo — attacher « Filière » à France
  // détache « Partenaires » de « Pays » (une seule dimension se dessine en nœuds à la fois),
  // et le dessin montrait alors le nœud « Oléagineux » seul : son flux existait, avec la
  // bonne valeur, mais pointait vers une cible restée invisible.
  //
  // C'est la garde n°1 du fichier appliquée à la réparation : reconnaître sur le graphe, jamais
  // à un état en mémoire — ici l'attachement, qui a le droit de changer entre deux tours.
  const a_rendre = new Set<string>()
  engendres.forEach(node => {
    const axe_id = drivingNodeIdOf(node)
    if (axe_id !== undefined) a_rendre.add(axe_id)
  })

  sankey.links_list.filter(isGeneratedMemberLink).forEach(link => sankey.deleteLink(link))
  engendres.forEach(node => sankey.deleteNode(node))

  // Les nœuds d'axe et leurs flux n'avaient pas été supprimés mais MASQUÉS : on les rend.
  //
  // C'est le correctif d'une première version qui les supprimait, et qui n'était donc pas
  // répétable — or l'opération doit l'être à chaque changement de niveau. Après un tour, il
  // n'y avait plus d'axe d'où repartir : le second tour ne rendait rien et le diagramme se
  // vidait. Garder l'axe évite aussi d'avoir à le reconstruire à la sérialisation.
  //
  // Les axes d'aujourd'hui s'y ajoutent : au tout premier tour, rien n'a encore été engendré,
  // donc `a_rendre` est vide et c'est `is_driven_by_dimension` qui porte la liste.
  sankey.nodes_list
    .filter(node => a_rendre.has(node.id) || node.is_driven_by_dimension)
    .forEach(axe => {
      axe.setVisible()
      ;[...axe.input_links_list, ...axe.output_links_list].forEach(flux => flux.setVisible())
    })
  return engendres.length
}

/**
 * Un membre représenté, et le nœud qui le représente.
 *
 * os#1511 — « AUTRES » : une entrée peut représenter PLUSIEURS membres repliés (`replies`). Son
 * `membre` est alors le premier d'entre eux — un vrai membre de la dimension, qui sert d'identité
 * commune : c'est le MÊME objet sur tous les axes de la dimension, si bien que la diagonale d'une
 * chaîne (`repartir`) et l'ordre des bandes (`rangerEnBandes`) apparient les « Autres » entre eux.
 */
interface Type_MembreRepresente { membre: Class_DataTag, noeud: Class_NodeElement, replies?: Class_DataTag[] }

/** Les membres qu'une entrée représente : les repliés d'un « Autres », sinon son membre. */
const membresDe = (entree: Type_MembreRepresente): Class_DataTag[] => entree.replies ?? [entree.membre]

// Les membres repliés de chaque nœud « Autres » engendré. Transitoire comme le nœud lui-même :
// rebâti à chaque désagrégation, jamais sérialisé.
const replies_par_noeud = new WeakMap<Class_NodeElement, Class_DataTag[]>()

/**
 * Les membres qu'un nœud engendré représente : son membre, ou les membres repliés d'un
 * « Autres » ; vide si ce n'est pas un nœud engendré. C'est ce qu'il faut à un flux engendré pour
 * retrouver sa coordonnée (cf. `Link.tagged_value_bands`) : sommer sur plusieurs membres d'un même
 * groupe, le cube sait le faire.
 */
export function membersOfGeneratedNode(node: Class_NodeElement): Class_DataTag[] {
  const replies = replies_par_noeud.get(node)
  if (replies !== undefined) return replies
  const membre = memberOfGeneratedNode(node)
  return membre === undefined ? [] : [membre]
}

/**
 * Le membre qu'un nœud engendré représente, `undefined` si ce n'en est pas un.
 *
 * Lu SUR LE GRAPHE, par la marque d'id : elle nomme le nœud d'axe, dont la dimension nomme le
 * membre. C'est ce qui permet à un flux engendré de retrouver sa coordonnée sans que celle-ci
 * soit encodée dans son propre identifiant (cf. `Link.tagged_value_bands`).
 */
export function memberOfGeneratedNode(node: Class_NodeElement): Class_DataTag | undefined {
  if (!isGeneratedMemberNode(node)) return undefined
  const [axe_id, membre_id] = node.id.split(MARQUE)
  const dimension = node.sankey.nodes_dict[axe_id]?.driving_dimension
  return dimension?.tags_dict[membre_id] as Class_DataTag | undefined
}

/**
 * Désagrège tous les nœuds d'axe du diagramme sur les membres choisis de leur dimension.
 *
 * ── PLUSIEURS AXES À LA FOIS (29/09/2026) ────────────────────────────────────────────────────
 *
 * Julien : « il faut qu'une dimension ne puisse avoir qu'un nœud qui la représente, mais
 * différents nœuds peuvent représenter différentes dimensions. Dans notre cas, le nœud de gauche
 * les filières et les nœuds de droite les pays. »
 *
 * C'EST LE TABLEAU CROISÉ RENDU EN SANKEY, et c'est exactement ce que la limite d'avant
 * interdisait : une seule dimension pouvait se dessiner en nœuds, attacher la seconde détachait
 * la première. Les lignes d'un tableau croisé à gauche, ses colonnes à droite, et une CASE par
 * intersection — un flux.
 *
 * ⚠️ D'OÙ LA RÉÉCRITURE : la répartition ne peut plus se faire axe par axe. Un flux dont les DEUX
 * bouts portent un axe ne se découpe pas deux fois de suite — il se découpe UNE fois, sur le
 * produit des deux. Découper en deux passes aurait redécoupé les flux déjà engendrés du premier
 * tour, or ceux-là ne portent qu'un scalaire : chaque pays aurait reçu le total de la filière.
 *
 * Le coût est celui d'un produit cartésien, et il faut le savoir : n filières × m pays font
 * n × m flux. C'est ce que montre un tableau croisé de mêmes axes, ni plus ni moins.
 *
 * Rend le nombre de nœuds engendrés. Un axe dont aucun membre n'est choisi n'est pas désagrégé :
 * il n'y aurait rien à montrer, et le vider serait pire que le laisser.
 */
export function disaggregateDimensionNodes(sankey: Class_Sankey): number {
  removeGeneratedMemberNodes(sankey)

  // Garde n°2, au PORTILLON : on ne prend que les nœuds d'axe, et jamais un engendré (un
  // fichier mixte en contient, et il ne faut pas les désagréger une seconde fois).
  const axes = sankey.nodes_list.filter(node =>
    !isGeneratedMemberNode(node) && node.is_driven_by_dimension)
  if (axes.length === 0) return 0

  // 1) UN NŒUD PAR MEMBRE, axe par axe. Aucun flux n'est encore touché : les nœuds des deux
  //    axes doivent tous exister avant qu'on croise quoi que ce soit.
  const par_axe = new Map<string, Type_MembreRepresente[]>()
  // os#1511 — « AUTRES », À LA VOLÉE (Julien, 30/09 : « il faut créer une catégorie "autre" à la
  // volée pour les flux trop petits, et les agréger, comme pour la couronne »). Le repli se décide
  // PAR DIMENSION, pas par axe : tous les nœuds qui la portent replient les mêmes membres, sinon
  // une chaîne (CARTOFOB) ne pourrait pas apparier ses « Autres » d'un maillon à l'autre.
  const replis = new Map<Class_DataTagGroup, Set<Class_DataTag>>()
  // La VALEUR d'un membre sur les flux de sa dimension, mémorisée : elle sert au repli « Autres »
  // et à l'ordre des nœuds, et un membre parent (Europe) somme ses feuilles.
  const valeurs = new Map<Class_DataTag, number>()
  const flux_par_dimension = new Map<Class_DataTagGroup, Class_LinkElement[]>()
  const valeurDe = (dimension: Class_DataTagGroup, membre: Class_DataTag): number => {
    const deja = valeurs.get(membre)
    if (deja !== undefined) return deja
    let flux_de_la_dimension = flux_par_dimension.get(dimension)
    if (flux_de_la_dimension === undefined) {
      flux_de_la_dimension = sankey.links_list.filter(flux => !isGeneratedMemberLink(flux) &&
        [flux.source, flux.target].some(bout => bout.driving_dimension === dimension))
      flux_par_dimension.set(dimension, flux_de_la_dimension)
    }
    const valeur = flux_de_la_dimension.reduce((total, flux) => total + (contributionsPourCase(flux, [membre]) ?? 0), 0)
    valeurs.set(membre, valeur)
    return valeur
  }
  const replisDe = (dimension: Class_DataTagGroup, membres: Class_DataTag[]): Set<Class_DataTag> => {
    const deja = replis.get(dimension)
    if (deja !== undefined) return deja
    const parts = membres.map(membre => ({ membre, value: valeurDe(dimension, membre) }))
    const { folded } = foldSmallParts(parts)
    const set = new Set(folded.map(part => part.membre))
    replis.set(dimension, set)
    return set
  }
  axes.forEach(axe => {
    // Garde n°2, PAR NŒUD : `is_driven_by_dimension` a pu devenir faux entre-temps.
    const dimension = axe.driving_dimension
    if (dimension === undefined) return
    // LES MEMBRES CHOISIS, et rien d'autre : le panneau nomme ainsi toujours ce que le dessin
    // montre. « Europe » donne l'Europe, « Régions continentales » — un NIVEAU, qui se choisit
    // dans la même liste — donne les régions.
    const membres = ordreArborescent(dimension, dimension.selected_tags_list as Class_DataTag[],
      dimension.nodes_by_value ? membre => valeurDe(dimension, membre) : undefined)
    if (membres.length === 0) return
    // UN SEUL MEMBRE : L'AXE EST CE MEMBRE, on n'engendre rien (retour de Julien, 30/09).
    //
    // « Je pense qu'il y a une ambiguïté sur ce niveau 1 représenté par 2 nœuds. » Il l'a vu en
    // déplaçant « Monde » : le nœud revenait à sa place. Et il l'a vu une seconde fois dans son
    // export Excel, qui portait DEUX lignes pour un seul flux — France→Partenaires et
    // France→Monde.
    //
    // Les deux symptômes ont la même cause. Au niveau racine, la coupe ne contient qu'un membre ;
    // on masquait alors le nœud d'axe pour le remplacer par un nœud engendré qui dit exactement la
    // même chose. Deux objets pour une seule idée : celui qu'on déplace est le transitoire, donc
    // le déplacement ne survit pas au premier rebâti, et celui que l'export voit est le mauvais.
    //
    // Désagréger n'a de sens qu'à partir de DEUX membres — c'est le sens du mot. Avec un seul,
    // l'axe reste lui-même, visible, et son flux porte l'agrégat du membre (`valueCurrent` fait
    // déjà ce repli). Le déplacement porte alors sur un vrai nœud du fichier, et l'export n'a plus
    // qu'une ligne.
    if (membres.length === 1) return
    par_axe.set(axe.id, creerNoeudsDeMembre(sankey, axe, membres, replisDe(dimension, membres)))
  })
  if (par_axe.size === 0) return 0

  // 1 bis) LA PENTE DE CHAQUE FLUX ENTRE DEUX AXES, relevée AVANT de le découper : l'écart
  //    vertical entre son accroche source et son accroche cible. Un flux droit vaut 0, et ses
  //    copies dans chaque bande devront valoir 0 aussi (Julien, 30/09 : « si y avait des flux
  //    droits, il faut qu'ils restent droits »). Après `repartir`, le flux d'origine est masqué
  //    et ne s'accroche plus nulle part : c'est maintenant ou jamais.
  const pentes = pentesEntreAxes(sankey, par_axe)
  // 1 ter) LE CRÉNEAU DE CHAQUE AXE, relevé lui aussi AVANT de découper : après `repartir`, ses
  //    flux sont masqués et l'axe retombe à la hauteur minimale d'un nœud (40 px au lieu de 647
  //    sur « [SOCLE] Pays partenaires ») — « remplir le slot du parent » remplissait alors un
  //    créneau qui n'existait plus.
  //    Son CENTRE est celui que le nœud mémorise (`center_y`), la vérité de sa position : quand
  //    plusieurs membres sont choisis, la hauteur de l'axe n'est que celle du premier (218 au lieu
  //    de 647 au second tour), alors que son coin répond encore à l'ancienne — le milieu déduit du
  //    coin tombait 215 px trop haut.
  //    Un axe jamais dessiné n'a pas de centre mémorisé : son coin fait alors foi, et la pile part
  //    de son haut comme avant.
  const creneaux = new Map<string, { haut: number, hauteur: number, centre: number | undefined }>()
  par_axe.forEach((_membres, axe_id) => {
    const axe = sankey.nodes_dict[axe_id]
    if (axe === undefined) return
    creneaux.set(axe_id, { haut: axe.position_y, hauteur: axe.getShapeHeightToUse(), centre: axe.center_y })
  })

  // 2) LES FLUX, une fois chacun. On relève la liste AVANT de créer quoi que ce soit : on y
  //    ajoute des flux au fur et à mesure, et itérer une liste qu'on allonge n'a pas de fin.
  sankey.links_list
    .filter(flux => !isGeneratedMemberLink(flux))
    .forEach(flux => repartir(sankey, flux, par_axe))

  // 3) LA MISE EN PAGE, APRÈS LES FLUX — et l'ordre n'est pas un détail.
  //
  //    Julien, 29/09 : « le positionnement désagrégé, ça marche toujours pas. » C'était vrai
  //    malgré la correction du matin, et pour une autre raison : « remplir le slot du parent »
  //    répartit les enfants d'après LEUR HAUTEUR, et la hauteur d'un nœud vient de ses flux.
  //    Placer les membres à leur création, c'est les placer tous à hauteur nulle — le slot se
  //    répartissait donc entre des nœuds qui ne pesaient rien encore, et le résultat ne
  //    ressemblait en rien à ce que le libellé promet.
  //
  //    Le mode « garder les positions » est le seul qui n'en dépende pas : il ne réempile rien,
  //    et il a donc déjà fait son travail à la création.
  // UN DIAGRAMME PAR MEMBRE : les axes d'une même dimension se rangent ENSEMBLE, en bandes. Ce
  // placement a sa propre règle (l'écart constant entre bandes) et ne lit pas le mode d'écart des
  // enfants, qui décrit le créneau d'UN nœud — cf. `rangerEnBandes`.
  const en_bandes = axesEnBandes(sankey, par_axe)
  en_bandes.forEach(axe_ids => rangerEnBandes(sankey, axe_ids, par_axe, pentes))
  const ranges = new Set([...en_bandes].flat())
  if (sankey.drawing_area.effective_gap_mode !== 'keep') {
    par_axe.forEach((membres, axe_id) => {
      if (ranges.has(axe_id)) return
      const axe = sankey.nodes_dict[axe_id]
      const creneau = creneaux.get(axe_id)
      if (axe === undefined || creneau === undefined) return
      const noeuds = membres.map(({ noeud }) => noeud)
      axe.drawing_area.nodePositioning.layoutChildrenInParentSlot(noeuds, creneau.haut, creneau.hauteur)
      centrerSurAxe(noeuds, creneau)
    })
  }

  // 4) Les nœuds d'axe quittent le DESSIN, pas le modèle : ils sont représentés par leurs
  //    membres, mais restent ce d'où l'on repart au prochain changement de niveau — et ce que
  //    le fichier écrit.
  let engendres = 0
  par_axe.forEach((membres, axe_id) => {
    engendres += membres.length
    sankey.nodes_dict[axe_id]?.setInvisible()
  })
  return engendres
}

/**
 * Les membres dans l'ordre de l'ARBRE de la dimension, frères dans l'ordre du groupe (Julien,
 * 30/09 : « quand j'ai désagrégé Europe, il n'a pas mis ses sous-régions à la place d'Europe mais
 * réparties ailleurs, en intercalant Asie, Afrique »). L'ordre du groupe est celui d'apparition
 * dans les données : les sous-régions d'Europe y sont semées entre les autres régions.
 *
 * AVEC `valeur` (`nodes_by_value`, défaut — Julien, 30/09 : « comme pour les bandes, la
 * désagrégation devrait suivre l'ordre décroissant de valeur ») : des frères, le plus grand
 * d'abord. Le tri se fait ENTRE FRÈRES, jamais à plat : les sous-régions d'Europe restent groupées
 * à la place d'Europe, rangée elle-même d'après sa valeur parmi les régions. Seuls les membres
 * choisis et leurs ancêtres sont évalués — les autres ne comptent pas dans l'ordre.
 */
function ordreArborescent(
  dimension: Class_DataTagGroup,
  membres: Class_DataTag[],
  valeur?: (membre: Class_DataTag) => number
): Class_DataTag[] {
  const utiles = new Set<Class_DataTag>()
  membres.forEach(membre => {
    for (let tag: Class_DataTag | undefined = membre; tag !== undefined && !utiles.has(tag); tag = tag.parent) utiles.add(tag)
  })
  const tags = (dimension.tags_list as Class_DataTag[]).filter(tag => utiles.has(tag))
  const enfants = new Map<Class_DataTag | undefined, Class_DataTag[]>()
  tags.forEach(tag => {
    const parent = tag.parent
    enfants.set(parent, [...(enfants.get(parent) ?? []), tag])
  })
  // À valeur égale, l'ordre du groupe (tri stable).
  const trier = (freres: Class_DataTag[]) => valeur === undefined
    ? freres
    : [...freres].sort((a, b) => valeur(b) - valeur(a))
  const rang = new Map<Class_DataTag, number>()
  const visiter = (tag: Class_DataTag) => {
    if (rang.has(tag)) return
    rang.set(tag, rang.size)
    trier(enfants.get(tag) ?? []).forEach(visiter)
  }
  trier(enfants.get(undefined) ?? []).forEach(visiter)
  return [...membres].sort((a, b) => (rang.get(a) ?? Infinity) - (rang.get(b) ?? Infinity))
}

/**
 * Recentre la pile des membres sur le CENTRE de l'axe. Au dessin, tout nœud libre garde son
 * centre quand sa taille change (`anchorByCenterIfResized`) : son voisin « Produits agricoles »
 * grandit autour du sien. Des membres empilés depuis le HAUT de l'axe débordaient vers le bas, et
 * leur haut semblait « descendu » (Julien, 30/09).
 */
function centrerSurAxe(noeuds: Class_NodeElement[], creneau: { centre: number | undefined }): void {
  if (noeuds.length === 0 || creneau.centre === undefined) return
  const haut = Math.min(...noeuds.map(n => n.position_y))
  const bas = Math.max(...noeuds.map(n => n.position_y + n.getShapeHeightToUse()))
  const decalage = creneau.centre - (haut + bas) / 2
  if (Math.abs(decalage) < 0.5) return
  noeuds.forEach(n => {
    n.position_y += decalage
    n.captureCenterFromCorner()
  })
}

/**
 * os#1511 — UN DIAGRAMME PAR MEMBRE : la dimension se range-t-elle en bandes ?
 *
 * Julien, 30/09, sur « [SOCLE] Pays partenaires » : trois nœuds portent la dimension des pays
 * (Produits agricoles, Monde - Export, Monde - Import) ; « il faudrait que les diagrammes se
 * mettent les uns sous les autres, parallèlement ». Éclater chaque nœud dans son propre créneau
 * mélangeait les membres colonne par colonne — et dans CARTOFOB, où les quatorze étapes portent
 * l'essence, les nœuds d'une même colonne s'empilaient.
 *
 * Réglé sur la dimension (`member_bands`), automatique à défaut : oui dès que deux nœuds ou plus
 * la portent. Un seul porteur n'a pas de diagramme à répéter.
 */
export function bandesParMembre(dimension: Class_DataTagGroup, porteurs: number): boolean {
  return dimension.member_bands ?? porteurs >= 2
}

/** Les axes découpés de ce tour, regroupés par dimension rangée en bandes. */
function axesEnBandes(sankey: Class_Sankey, par_axe: Map<string, Type_MembreRepresente[]>): string[][] {
  const par_dimension = new Map<Class_DataTagGroup, string[]>()
  par_axe.forEach((_membres, axe_id) => {
    const dimension = sankey.nodes_dict[axe_id]?.driving_dimension
    if (dimension === undefined) return
    par_dimension.set(dimension, [...(par_dimension.get(dimension) ?? []), axe_id])
  })
  const out: string[][] = []
  par_dimension.forEach((axe_ids, dimension) => {
    // Le compte est celui des nœuds qui PORTENT la dimension, pas de ceux découpés à ce tour.
    const porteurs = sankey.nodes_list
      .filter(node => !isGeneratedMemberNode(node) && node.driving_dimension === dimension).length
    if (axe_ids.length >= 2 && bandesParMembre(dimension, porteurs)) out.push(axe_ids)
  })
  return out
}

/**
 * Range les nœuds engendrés de plusieurs axes d'une même dimension en BANDES, une par membre.
 *
 * Chaque axe garde sa colonne (x déjà posé à la création) ; seule la hauteur change. Deux passes,
 * comme Julien l'a décrit (30/09) — « prendre le nœud qui va le plus bas pour chaque bande,
 * appliquer l'écart constant pour aller sur le haut du nœud de la bande du dessous » :
 *
 *  1. chaque bande reprend la FORME du diagramme, flux par flux. Le nœud de l'axe le plus à
 *     gauche part de la hauteur de son axe ; de proche en proche le long des flux de la bande,
 *     chaque nœud se pose pour que le flux qui le relie garde entre ses deux accroches l'écart
 *     qu'avait le flux d'origine (`pentesEntreAxes`). Un flux droit reste droit — caler le HAUT
 *     des nœuds ne suffisait pas : un nœud engendré n'a pas la hauteur de son axe, et un flux
 *     s'accroche au milieu de sa part de la pile, pas au haut du nœud (retour de Julien, 30/09).
 *  2. bande par bande, on relève le BAS du nœud qui descend le plus, et la bande suivante est
 *     décalée pour que son nœud le plus haut commence à ce bas plus l'écart constant
 *     (`disaggregation_gap_value`).
 *
 * Le mode d'écart des enfants (« remplir le slot », etc.) n'est PAS lu : il décrit le créneau
 * d'UN nœud, et une bande en traverse plusieurs. L'éditeur le masque sous les bandes.
 *
 * Appelée APRÈS les flux : la hauteur d'un nœud engendré vient de ses flux (cf. l'étape 3).
 */
function rangerEnBandes(
  sankey: Class_Sankey,
  axe_ids: string[],
  par_axe: Map<string, Type_MembreRepresente[]>,
  pentes: Map<string, number>
): void {
  const ecart = sankey.drawing_area.disaggregation_gap_value
  // Les membres dans l'ordre choisi — le même pour tous les axes de la dimension.
  const ordre: Class_DataTag[] = []
  axe_ids.forEach(id => (par_axe.get(id) ?? []).forEach(({ membre }) => {
    if (!ordre.includes(membre)) ordre.push(membre)
  }))
  const noeudDe = (axe_id: string, membre: Class_DataTag) =>
    (par_axe.get(axe_id) ?? []).find(m => m.membre === membre)?.noeud
  // Le haut de chaque axe, relevé AVANT tout déplacement, et les axes de gauche à droite.
  const haut_axe = new Map<string, number>()
  axe_ids.forEach(id => {
    const axe = sankey.nodes_dict[id]
    if (axe !== undefined) haut_axe.set(id, axe.position_y)
  })
  if (haut_axe.size === 0) return
  const de_gauche_a_droite = [...haut_axe.keys()].sort((a, b) =>
    (sankey.nodes_dict[a].position_u - sankey.nodes_dict[b].position_u) ||
    (sankey.nodes_dict[a].position_x - sankey.nodes_dict[b].position_x))

  let bas_precedent: number | undefined = undefined
  ordre.forEach(membre => {
    // ── PASSE 1 : la forme de la bande, à une translation près ──────────────────────────────
    const axe_de = new Map<Class_NodeElement, string>()
    de_gauche_a_droite.forEach(id => {
      const noeud = noeudDe(id, membre)
      if (noeud !== undefined) axe_de.set(noeud, id)
    })
    if (axe_de.size === 0) return
    const y = new Map<Class_NodeElement, number>()
    const poser = (depart: Class_NodeElement) => {
      y.set(depart, haut_axe.get(axe_de.get(depart) as string) as number)
      const file = [depart]
      while (file.length > 0) {
        const a = file.shift() as Class_NodeElement
        const flux = [...a.input_links_list, ...a.output_links_list] as Class_LinkElement[]
        flux.forEach(lien => {
          if (!isGeneratedMemberLink(lien) || !lien.is_visible) return
          const b = (lien.source === a ? lien.target : lien.source) as Class_NodeElement
          if (!axe_de.has(b) || y.has(b)) return
          y.set(b, hauteurAlignee(a, b, lien, pentes, y.get(a) as number, haut_axe, axe_de))
          file.push(b)
        })
      }
    }
    axe_de.forEach((_id, noeud) => { if (!y.has(noeud)) poser(noeud) })

    // ── PASSE 2 : sous le nœud le plus bas de la bande précédente ───────────────────────────
    const plus_haut = Math.min(...y.values())
    const decalage = bas_precedent === undefined ? 0 : bas_precedent + ecart - plus_haut
    y.forEach((haut, noeud) => {
      noeud.position_y = haut + decalage
      noeud.captureCenterFromCorner()
    })
    bas_precedent = Math.max(...[...y.keys()].map(n => n.position_y + n.getShapeHeightToUse()))
  })
}

/**
 * Hauteur de `b`, déjà placé `a` à `y_a`, pour que le flux `lien` qui les relie garde la pente de
 * son flux d'origine. À défaut d'accroche calculable (ancrage radial, côté haut ou bas, port
 * importé) ou de pente relevée, `b` garde l'écart entre les HAUTS de leurs axes — le placement
 * d'avant.
 */
function hauteurAlignee(
  a: Class_NodeElement,
  b: Class_NodeElement,
  lien: Class_LinkElement,
  pentes: Map<string, number>,
  y_a: number,
  haut_axe: Map<string, number>,
  axe_de: Map<Class_NodeElement, string>
): number {
  const repli = y_a + (haut_axe.get(axe_de.get(b) as string) as number) -
    (haut_axe.get(axe_de.get(a) as string) as number)
  const pente = pentes.get(lien.id.split(MARQUE)[0])
  const acc_a = a.linkAttachOffsetY(lien)
  const acc_b = b.linkAttachOffsetY(lien)
  if (pente === undefined || acc_a === undefined || acc_b === undefined) return repli
  // pente = accroche cible - accroche source (0 : droit, positif : descend vers la cible)
  return lien.source === a
    ? y_a + acc_a + pente - acc_b
    : y_a + acc_a - pente - acc_b
}

/**
 * La pente de chaque flux RELIANT DEUX AXES de ce tour : accroche cible moins accroche source,
 * relevée sur les axes tels qu'ils sont avant d'être découpés. Un flux dont l'une des accroches
 * ne se calcule pas (cf. `linkAttachOffsetY`) n'a pas d'entrée.
 */
function pentesEntreAxes(
  sankey: Class_Sankey,
  par_axe: Map<string, Type_MembreRepresente[]>
): Map<string, number> {
  const pentes = new Map<string, number>()
  sankey.links_list.forEach(lien => {
    if (isGeneratedMemberLink(lien) || !lien.is_visible) return
    if (!par_axe.has(lien.source.id) || !par_axe.has(lien.target.id)) return
    const source = lien.source as Class_NodeElement
    const cible = lien.target as Class_NodeElement
    const acc_s = source.linkAttachOffsetY(lien)
    const acc_c = cible.linkAttachOffsetY(lien)
    if (acc_s === undefined || acc_c === undefined) return
    pentes.set(lien.id, (cible.position_y + acc_c) - (source.position_y + acc_s))
  })
  return pentes
}

/**
 * Les nœuds de membre d'UN axe, dans l'ordre des membres choisis.
 *
 * ── LA MISE EN PAGE SUIT LES OPTIONS DE DÉSAGRÉGATION (Julien, 29/09) ──────────────────────────
 *
 * « En nœud dupliqué, il faut que ça suive les options de désagrégation. » Il a raison, et c'est
 * la même exigence que partout ailleurs sur ce chantier : un nœud engendré par une dimension de
 * données doit se comporter comme un nœud engendré par une hiérarchie de nœuds. Deux façons de
 * placer des enfants seraient deux diagrammes.
 *
 * Ces options vivent sur la zone de dessin (`disaggregation_gap_mode` : remplir le slot du parent,
 * garder les positions, écart propre à chaque enfant, écart constant) et s'appliquent par
 * `layoutChildrenInParentSlot` — exactement l'appel que fait la désagrégation d'un nœud
 * (`Hierarchies.tsx`). On l'emprunte plutôt que de le réécrire.
 *
 * ⚠️ CE QUE ÇA REMPLACE : un écart de 90 px en dur, centré sur l'axe. Il ne connaissait ni la
 * hauteur des nœuds ni le slot du parent, donc il débordait sur les voisins dès que les membres
 * étaient nombreux ou épais.
 *
 * ⚠️ LA POSITION PORTÉE PAR LE MEMBRE NE VAUT QUE SOUS « GARDER LES POSITIONS ».
 *
 * Julien, 29/09 : « c'est marqué "remplir le slot du parent" mais ça fait pas ça, ça écarte. »
 * Il avait raison et c'était moi : je calculais le slot, puis je le JETAIS au profit de la
 * position enregistrée de chaque membre. Sur la démo, l'Europe est à y=150 et l'Afrique à y=380 —
 * d'où l'écart, sous un libellé qui promettait le contraire.
 *
 * La géométrie portée par le membre est ce que l'auteur a DÉPLACÉ à la main. C'est exactement ce
 * que le mode « garder les positions » demande de respecter, et exactement ce que les trois autres
 * demandent de RECALCULER. Elle ne s'applique donc que sous `keep` — où, faute de position, un
 * membre retombe sur celle de son axe plutôt que sur l'origine du dessin.
 */
/**
 * Styles de l'axe recopiés sur son membre, et À DÉFAUT son EXTRÉMITÉ déduite (Julien, 30/09 :
 * « les nœuds désagrégés n'ont pas le label à droite du nœud »).
 *
 * Recopier les styles de l'axe ne suffit pas : un fichier enregistré sans mise en page
 * automatique porte des axes au seul style `default`, et le membre n'héritait alors de rien. On
 * lit donc la connectivité DE L'AXE — celle du membre n'existe pas encore, ses flux se
 * répartissent après (`repartir`) — avec la règle de `setNodeLabelPositioning` : que des sorties,
 * extrémité gauche ; que des entrées, extrémité droite. Un override local du placement du nom
 * (`name_label_horiz` / `_vert`) sur l'axe l'emporte, comme là-bas.
 */
function heriterExtremite(sankey: Class_Sankey, axe: Class_NodeElement, noeud: Class_NodeElement): void {
  axe.style.forEach(style => { if (!noeud.hasStyle(style.id)) noeud.addStyle(style) })
  if (axe.hasStyle(NodeLeftExtremityStyle) || axe.hasStyle(NodeRightExtremityStyle)) return
  if (axe.isAttributeOverloaded('name_label_horiz') || axe.isAttributeOverloaded('name_label_vert')) return
  const source = axe.hasOutputLinks() && !axe.hasInputLinks()
  const puits = axe.hasInputLinks() && !axe.hasOutputLinks()
  const style = source
    ? sankey.styles_dict[NodeLeftExtremityStyle]
    : (puits ? sankey.styles_dict[NodeRightExtremityStyle] : undefined)
  if (style !== undefined && !noeud.hasStyle(style.id)) noeud.addStyle(style)
}

function creerNoeudsDeMembre(
  sankey: Class_Sankey,
  axe: Class_NodeElement,
  membres: Class_DataTag[],
  replies: Set<Class_DataTag> = new Set()
): Type_MembreRepresente[] {
  // PLUSIEURS AXES SUR LA MÊME DIMENSION (CARTOFOB, 30/09) : chaque étape de la filière se décline
  // par essence, et quatorze nœuds « Chêne » ne disent plus de quelle étape ils sont. Le nom du
  // membre seul ne suffit que si l'axe est le seul à porter sa dimension.
  const partage = sankey.nodes_list.some(autre => autre !== axe &&
    !isGeneratedMemberNode(autre) && autre.driving_dimension === axe.driving_dimension)
  const gardes = membres.filter(membre => !replies.has(membre))
  const engendres: Type_MembreRepresente[] = gardes.map(membre => {
    const nom = partage ? `${axe.name} - ${membre.name}` : membre.name
    const noeud = sankey.addNewNode(memberNodeId(axe.id, membre.id), nom)
    noeud.copyAttrFrom(axe)
    // os#1511 (retour de Julien, 30/09 : « il faut que les labels soient positionnés à droite ou
    // à gauche du nœud ») — LES STYLES D'EXTRÉMITÉ DE L'AXE DESCENDENT SUR SES MEMBRES.
    //
    // `NodeLeftExtremityStyle` / `NodeRightExtremityStyle` mettent le nom du nœud À CÔTÉ plutôt
    // que dessus, du côté libre. La mise en page automatique les pose d'après la connectivité
    // (`setNodeLabelPositioning`), mais un nœud de membre est fabriqué après elle : il naissait
    // sans, et son nom se posait au milieu, par-dessus le nœud.
    //
    // Il hérite donc de l'axe, ce qui est juste par construction : il occupe sa colonne et se
    // branche sur les mêmes voisins, donc il a la même extrémité que lui.
    // `copyAttrFrom` en a déjà transféré une partie : `addStyle` avertit en console sur un style
    // déjà posé, et le faisait pour chaque membre engendré.
    heriterExtremite(sankey, axe, noeud)
    // La COLONNE est toujours celle de l'axe : `layoutChildrenInParentSlot` ne règle que le Y,
    // et un membre sans colonne se retrouverait à l'abscisse zéro.
    noeud.position_u = axe.position_u
    noeud.position_x = axe.position_x
    return { membre, noeud }
  })

  // os#1511 — « AUTRES » : un seul nœud, gris, pour tous les membres repliés, en dernier. Son
  // identité est le premier replié dans l'ordre des membres (cf. `Type_MembreRepresente`).
  const repliés = membres.filter(membre => replies.has(membre))
  if (repliés.length > 0) {
    const t = sankey.drawing_area.application_data?.t
    const libelle = (t ? t('sunburst.others') : '') || 'Autres'
    const nom = partage ? `${axe.name} - ${libelle}` : libelle
    const noeud = sankey.addNewNode(memberNodeId(axe.id, OTHERS_ID), nom)
    noeud.copyAttrFrom(axe)
    heriterExtremite(sankey, axe, noeud)
    noeud.position_u = axe.position_u
    noeud.position_x = axe.position_x
    noeud.shape_color = OTHERS_COLOR
    replies_par_noeud.set(noeud, repliés)
    engendres.push({ membre: repliés[0], noeud, replies: repliés })
  }

  if (axe.drawing_area.effective_gap_mode === 'keep') {
    // « Garder les positions » : celle du membre fait foi, et rien n'est réempilé.
    engendres.forEach(({ membre, noeud, replies }) => {
      // « Autres » ne porte pas de position à lui : il se pose sur son axe.
      const position = replies === undefined ? membre.position : undefined
      noeud.setPosXY(position?.x ?? axe.position_x, position?.y ?? axe.position_y)
    })
  }
  return engendres
}

/**
 * Répartit un flux sur les nœuds de membre de ses DEUX bouts : un flux par case du croisement.
 *
 * Un bout sans axe ne se découpe pas et reste lui-même — c'est le cas courant, et c'est ce que
 * fait le `[undefined]` : le produit cartésien à un seul terme.
 *
 * Une case dont la contribution est ABSENTE ne reçoit AUCUN flux — pas un flux à zéro. C'est la
 * même règle que l'agrégat du lot 1 : « ce flux n'existe pas ici » n'est pas « il vaut 0 », et un
 * flux fantôme à zéro se dessinerait. Sur un croisement, ces cases vides sont la règle plutôt que
 * l'exception : c'est exactement ce qu'un tableau croisé laisse en blanc.
 */
function repartir(
  sankey: Class_Sankey,
  flux: Class_LinkElement,
  par_axe: Map<string, Type_MembreRepresente[]>
): void {
  const gauche: (Type_MembreRepresente | undefined)[] = par_axe.get(flux.source.id) ?? [undefined]
  const droite: (Type_MembreRepresente | undefined)[] = par_axe.get(flux.target.id) ?? [undefined]
  if (gauche[0] === undefined && droite[0] === undefined) return

  // UNE CHAÎNE SUR UNE MÊME DIMENSION NE SE CROISE PAS, ELLE SE SUIT (CARTOFOB, 30/09/2026).
  //
  // Deux bouts peuvent porter la MÊME dimension : dans CARTOFOB, Prélèvements, Scieries, Sciages…
  // représentent tous l'axe des essences, parce que chaque étape de la filière se décline par
  // essence. Le croisement ci-dessous fabriquerait alors Chêne → Hêtre, Chêne → Douglas… — des
  // flux qui n'existent pas : le chêne prélevé est le chêne scié. Le produit cartésien vaut pour
  // DEUX dimensions (les filières à gauche, les pays à droite) ; sur une seule, seule la
  // diagonale a un sens, chaque membre se reliant à lui-même.
  const meme_dimension = gauche[0] !== undefined && droite[0] !== undefined &&
    gauche[0].membre.group === droite[0].membre.group

  gauche.forEach(g => droite.forEach(d => {
    if (meme_dimension && g?.membre !== d?.membre) return
    // « Autres » vise TOUS ses membres repliés : le cube somme plusieurs membres d'un même groupe.
    const entrees = [g, d].filter((e): e is Type_MembreRepresente => e !== undefined)
    const vises = [...new Set(entrees.flatMap(membresDe))]
    const contributions = contributionsPourCase(flux, vises)
    if (contributions === null) return
    // L'identifiant porte la MARQUE : c'est ce qui rend le flux engendré reconnaissable sur le
    // graphe, comme son nœud, et donc effaçable au tour suivant sans tenir de registre. Les
    // membres y figurent pour l'unicité seulement — un flux engendré retrouve sa coordonnée par
    // ses NŒUDS (cf. `memberOfGeneratedNode`), qui la portent déjà.
    const id = `${flux.id}${MARQUE}${[...new Set(entrees.map(e => e.replies !== undefined ? OTHERS_ID : e.membre.id))].join(MARQUE)}`
    const nouveau = sankey.addNewLinkWithId(id, g?.noeud ?? flux.source, d?.noeud ?? flux.target)
    nouveau.copyAttrFrom(flux)
    // Sa valeur est un SCALAIRE : un flux engendré naît d'un choix de coordonnées, donc il ne
    // porte pas de cube (cf. le constructeur de `Class_LinkElement`, qui reconnaît la marque).
    // Elle ne dépend ainsi d'aucune sélection — ce qui la rend lisible même quand deux membres
    // sont cochés, là où une valeur rangée à une coordonnée ne l'était pas.
    const valeur = nouveau.value
    if (valeur !== null) {
      valeur.valueData = contributions
    }
  }))
  // Le flux d'origine est MASQUÉ, jamais supprimé : il porte les valeurs de toutes les cases,
  // c'est de lui qu'on repartira au prochain changement de niveau, et c'est lui que le fichier
  // écrit.
  flux.setInvisible()
}

/**
 * Ce que le flux apporte à CETTE case du croisement, `null` s'il n'apporte rien.
 *
 * On passe par la résolution du lot 1 en visant les membres : elle rend la valeur portée au
 * niveau demandé si elle existe, sinon l'agrégat de ses feuilles, et `null` si tout est absent.
 */
function contributionsPourCase(flux: Class_LinkElement, membres: Class_DataTag[]): number | null {
  // La coordonnée à lire : celle de l'utilisateur, sauf sur les axes découpés, où l'on vise CES
  // membres. On ne pose rien dans le modèle — poser la sélection puis la rendre coûtait 36 s sur
  // le SOCLE pour huit membres, chaque bascule parcourant les 263 étiquettes de l'axe et
  // invalidant les caches de visibilité du diagramme entier.
  const groupes = new Set(membres.map(membre => membre.group))
  const coordonnee = (flux.selected_data_tags_list as Class_DataTag[])
    .filter(tag => !groupes.has(tag.group))
    .concat(membres)
  const contributions = flux.contributingValuesFor(coordonnee)
  if (contributions === null || contributions.length === 0) return null
  return contributions.reduce((total, valeur) => total + (valeur.valueData ?? 0), 0)
}
