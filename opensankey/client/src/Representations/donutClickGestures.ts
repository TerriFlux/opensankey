// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1473 — LA COURONNE ET LES BARRES SONT DES FIGURES D'OPENSANKEY, comme le sunburst.
//
// Julien : « je ne comprends pas que sunburst soit dans OpenSankey et couronne dans OpenSankey
// Plus. Ça n'a pas de sens. » Il avait raison, et l'explication est historique, pas une raison :
// la couronne et les barres viennent de la pop-up de présentation d'OS+ (`element_analyses_for`)
// et y sont restées quand elles sont devenues des figures. Leurs TRACÉS, eux, ont toujours vécu ici
// (`Charts/NodeStatsCharts`).
//
// Mesuré avant de bouger : aucun des modules qui les portent n'importait quoi que ce soit d'OS+.
// Ce fichier est donc un DÉPLACEMENT PUR de `registerOSPRepresentations` — les aides d'analyse et
// les deux enregistrements —, l'étoile seule restant en OS+ où vit son document.
//
// Ce que ça rend possible, et c'est le but (cf. notes/figures/figures-etat-et-cap.md) : les deux
// moitiés du mécanisme des figures vivent enfin dans le même paquet, et peuvent converger.

// os#1511 (lot 6b, 11/10/2026) — CE QUE FAIT LE CLIC SUR UNE PART DE COURONNE (déplier, zoomer,
// remonter), sur dimensions de données comme sur une hiérarchie de nœuds ; sorti de
// `registerAnalysisRepresentations`.

import type { Type_RepresentationContext } from './RepresentationRegistry'
import { crossEnds, crossEntryLinkId, crossExpansionEntriesOf, crossExpansionEntry, crossExpansionOf, crossOpeningAt, type Type_CrossAxis, type Type_CrossSpec } from '../Charts/CrossHierarchy'
import { analysisOf, couronneGesturesOfCtx, expandedOf, hierarchyPathOf } from './analysisCore'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_NodeDimension } from '../Elements/NodeDimension'
import type { Type_FigureChartStyle } from '../Charts/figureChartStyle'
import { partClickModeOf } from './couronneGestures'
import { isFigureLinked, withElementOpening } from './figureOpening'
import { diagramIsShown } from './figureCatalogue'
import { HIERARCHY_FOCUS_KEY } from './analysisFigureAttributes'
import type { Type_JSON } from '../types/Utils'
import type { Class_LinkElement } from '../Elements/Link'
import { aggregateLocally, disaggregateAlong } from '../Algorithms/Hierarchies'

/**
 * LA DESCENTE EST POSSIBLE, ou `null` si la figure ne décompose pas par nœuds enfants.
 *
 * ⚠️ IL N'Y A PLUS DE MODE À VÉRIFIER (24/09/2026). Une couronne posée sur « les enfants »
 * descend, point : elle commence à un cran et grandit sous les clics. C'est ce qui a remplacé les
 * trois modes dont deux rendaient le clic inerte.
 */
export const hierarchyInEffect = (
  ctx: Type_RepresentationContext
): { dimension_id: string, path: string[], expanded: ReadonlySet<string>, cross?: Type_CrossSpec } | null => {
  const decompose = analysisOf(ctx)?.descriptor.decompose
  if (!decompose) return null
  // os#1509 — le croisement descend aussi : mêmes anneaux, même palette, même ensemble ouvert.
  // Il n'a pas d'axe unique (il en enchaîne deux) ni de foyer.
  if (decompose.kind === 'flux_cross') {
    return { dimension_id: '', path: [], expanded: expandedOf(ctx.options), cross: decompose }
  }
  if (decompose.kind !== 'node_children') return null
  return {
    dimension_id: decompose.dimension_id,
    path: hierarchyPathOf(ctx.options),
    expanded: expandedOf(ctx.options)
  }
}

/**
 * `descendant` est-il SOUS `ancestor` dans la hiérarchie ? Remonté par les parents DÉCLARÉS, tous
 * axes confondus — sur un treillis un nœud en a plusieurs, et il suffit qu'UNE route passe par
 * l'ancêtre pour que refermer celui-ci le referme aussi.
 *
 * Sert au shift+clic : refermer « Céréales » referme tout ce qu'elle portait, sans quoi la rouvrir
 * ferait réapparaître d'un coup des niveaux ouverts dix minutes plus tôt.
 *
 * Borné par les nœuds déjà vus : une hiérarchie mal formée ne doit pas faire tourner un geste
 * d'interface à l'infini.
 */
const isBelow = (
  sankey: { nodes_dict: { [id: string]: unknown } },
  descendant: string,
  ancestor: string
): boolean => {
  const seen = new Set<string>([descendant])
  const queue = [descendant]
  while (queue.length > 0) {
    const current = sankey.nodes_dict[queue.shift() as string] as Class_NodeElement | undefined
    if (!current) continue
    for (const dim of current.dimensions_as_child as Class_NodeDimension[]) {
      const parent_id = dim.parent.id
      if (parent_id === ancestor) return true
      if (!seen.has(parent_id)) { seen.add(parent_id); queue.push(parent_id) }
    }
  }
  return false
}

/**
 * os#1511 — CLIC ET SHIFT+CLIC SUR UNE DIMENSION DE DONNÉES, comme dans l'arbre du diagramme.
 *
 * Chaque dimension a une coupe, et c'est `dataCutOf` qui dit laquelle est en vigueur :
 *   clic       ouvre le membre cliqué dans SA dimension — comme le chevron de l'arbre ;
 *   shift+clic referme le membre s'il est ouvert, sinon son parent dans la dimension.
 * La racine unique ne se referme pas au clic : repasser une dimension à « ensemble » est un choix de
 * niveau, qui se fait dans « Coordonnées ».
 *
 * LIÉE, la figure n'a pas de coupe propre : son clic ÉCRIT celle du diagramme. DÉTACHÉE, il écrit
 * celle de la figure, et le diagramme ne suit que sous « Clic sur une part : le déplie dans le
 * diagramme ». Quand le diagramme suit, une dimension en choix unique passe en choix multiple — une
 * couronne montre toujours plusieurs membres à la fois.
 *
 * ── 02/10/2026 — « ZOOME DEDANS », ENFIN ─────────────────────────────────────────────────────
 *
 * Julien : « zoome dedans ne zoome pas : c'est toujours le déplie dans le diagramme ». Le zoom
 * n'existait pas ici, et une figure LIÉE écrivait la coupe du diagramme quel que soit le réglage.
 * Les quatre choix disent maintenant ce qu'ils font :
 *   'none'      ouvre l'anneau dans la figure (liée, sa coupe EST celle du diagramme) ;
 *   'aggregate' ouvre l'anneau, et le diagramme suit ;
 *   'zoom'      re-enracine la figure sur la part (`hierarchy_focus`) — sans rien ouvrir, ni chez
 *               elle ni dans le diagramme ; shift+clic remonte d'un cran, comme le centre ;
 *   'both'      re-enracine, et déplie la part dans le diagramme.
 * Sans diagramme affiché, « dans le diagramme » ne s'écrit pas (cf. `diagramIsShown`).
 *
 * `null` quand la figure ne découpe pas selon une dimension de données.
 */
const dataDimensionClickGestures = (
  ctx: Type_RepresentationContext,
  style: Type_FigureChartStyle
): {
  activate: (part_id: string, gesture: { shift: boolean }) => void
  back?: () => void
  focusTo?: (path: string[]) => void
} | null => {
  // 04/10/2026 (lot 3) — LES GESTES DE LA COURONNE (`couronneGestures`) : déplier (la part cède sa
  // place à ses enfants), zoomer (la portée), et leur shift+clic. 07/10/2026 — deux choix, Déplie /
  // Zoome ; liée, le diagramme et les autres fenêtres liées suivent (le zoom compris), détachée non.
  const g = couronneGesturesOfCtx(ctx, 'couronne')
  if (g === null) return null
  const mode = partClickModeOf(style.interaction_click)
  return {
    activate: (part_id, gesture) => g.activatePart(part_id, gesture, mode),
    // Le centre remonte d'un cran la dernière dimension zoomée, quel que soit le réglage du moment.
    back: g.back
  }
}

/**
 * CE QUE LE CLIC FAIT EN PLUS DE SÉLECTIONNER, et le retour au centre avec.
 *
 * Deux gestes, et ce sont les deux que Julien a demandés d'un coup — « les deux premiers, mais avec
 * un mode drill down à sélectionner quelque part » :
 *
 *   'aggregate' — DÉPLIER LE NŒUD DANS LE DIAGRAMME. La couronne suit alors toute seule, puisqu'en
 *                 mode 'diagram' elle dessine la frontière que le dessin dessine : le secteur
 *                 cliqué cède sa place à ses enfants, ici comme là-bas. C'est le pont du sunburst,
 *                 et c'est le même appel (`disaggregateLocally`).
 *   'zoom'      — DESCENDRE DANS LA FIGURE SEULE. Le nœud cliqué devient le tout, le diagramme ne
 *                 bouge pas. Le chemin est un RÉGLAGE de la figure (`hierarchy_focus`) et non un
 *                 état du tracé : écrit là, il survit au redessin, l'inspecteur le voit, et les
 *                 parts se reconstruisent sur le bon périmètre — un foyer gardé dans le dessin
 *                 aurait laissé le document de parts sur l'ancien.
 *
 * ── SHIFT+CLIC REMONTE, ET C'EST LE MÊME GESTE À L'ENVERS (Julien, 24/09/2026) ────────────────
 *
 * « On peut pas imaginer des combinaisons de touches, shift+clic / clic, un pour remonter un pour
 * descendre ? » C'est la réponse au trou qu'il avait relevé la minute d'avant : une couronne qui
 * déplie et ne sait pas replier oblige à ressortir de la figure pour revenir en arrière.
 *
 * Le sens de « remonter » n'est pas le même des deux côtés, et c'est pour ça que le tracé se
 * contente de rapporter la touche :
 *   en 'aggregate', shift+clic REPLIE LE SECTEUR DANS SON PARENT — cliquer « Blé » avec shift fait
 *     réapparaître « Céréales » à la place de « Blé » et « Maïs ». Le geste est LOCAL, comme
 *     déplier l'est : il ne touche que la branche qu'on désigne ;
 *   en 'zoom', il dépile le foyer d'un cran — le même effet que le centre, sous le doigt.
 */
export const donutClickGestures = (
  ctx: Type_RepresentationContext,
  style: Type_FigureChartStyle
): {
  activate?: (part_id: string, gesture: { shift: boolean, alt?: boolean }, route?: string[]) => void
  back?: () => void
  /** Remonte directement au foyer `path` (le fil d'Ariane) ; absent quand `back` l'est. */
  focusTo?: (path: string[]) => void
} => {
  // ⚠️ PLUS DE SORTIE SUR `interaction_click === 'none'`, et c'est le cœur du modèle : OUVRIR
  // L'ANNEAU EST LE GESTE DE BASE, il ne se règle pas. Le réglage ne dit que ce qui s'y AJOUTE
  // (déplier le diagramme, descendre dedans). Y sortir ici éteignait le geste même qu'on venait
  // de rendre inconditionnel.
  const data_gestures = dataDimensionClickGestures(ctx, style)
  if (data_gestures) return data_gestures
  const hierarchy = hierarchyInEffect(ctx)
  if (!hierarchy) return {}
  const app_data = ctx.app_data
  const sankey = app_data.drawing_area.sankey
  const { window_id, pane_key } = ctx
  const in_pane = window_id !== undefined && pane_key !== undefined
  // Sans diagramme affiché, « le déplie dans le diagramme » n'écrit rien : le menu le grise
  // (`choiceUnavailable`), le geste s'y aligne.
  // 10/10/2026 (os#1511, lot 4) — LA RÈGLE DES DIMENSIONS, ICI AUSSI (Julien : « oui ») : le réglage
  // dit seulement Déplie / Zoome (`partClickModeOf`, les quatre valeurs d'avant ramenées à deux) ; que
  // le DIAGRAMME suive, c'est le lien de la figure qui le décide (`isFigureLinked`), plus le réglage.
  const wants_unfold = isFigureLinked(ctx.options) && diagramIsShown(app_data)
  const wants_drill = partClickModeOf(style.interaction_click) === 'zoom' && in_pane

  const writePath = (path: string[]) => {
    app_data.menu_configuration.setMainZonePaneOptions(
      window_id as string, pane_key as string,
      { ...ctx.options, [HIERARCHY_FOCUS_KEY]: path } as unknown as Type_JSON
    )
  }

  /** L'axe qui porte les enfants de ce nœud : celui de la couronne d'abord, le premier sinon. */
  const dimensionOf = (node: Class_NodeElement) =>
    node.dimensions_as_parent.find(
      (d: Class_NodeDimension) => d.id === hierarchy.dimension_id && d.children.length > 0
    ) ?? node.dimensions_as_parent.find((d: Class_NodeDimension) => d.children.length > 0)

  const writeExpanded = (ids: Set<string>) => {
    app_data.menu_configuration.setMainZonePaneOptions(
      window_id as string, pane_key as string,
      withElementOpening(ctx.options, ids) as unknown as Type_JSON
    )
  }

  // ── os#1509 — LE CROISEMENT : ouvrir et refermer des CASES ───────────────────────────────────
  //
  // Un clic ouvre par l'axe de la figure, alt+clic par l'AUTRE axe (c'est ce qui permet
  // « Céréales → Europe → Belgique → blé »), shift+clic referme la case, ou le parent par lequel
  // on la voit, avec tout ce qu'ils portaient.
  //
  // ⚠️ 27/09/2026 — ET LE DIAGRAMME SUIT, quand l'auteur l'a demandé. Ce bloc disait « une case
  // est un flux du document, pas un nœud : le diagramme n'a rien à déplier pour elle ». C'était
  // vrai de la CASE et faux de l'AXE : ouvrir une case par un axe remplace l'un de ses deux bouts
  // par ses enfants, et ce bout-là est un NŒUD que le diagramme sait désagréger.
  //
  // Julien : « quand on est en mode le croisement des flux entrants et qu'on a le déplie dans le
  // diagramme, ça ne marche pas. » Le réglage restait offert en croisé sans rien faire — un bouton
  // mort, que le harnais des « bites » ne voit pas (il n'interroge pas le croisement).
  if (hierarchy.cross) {
    const cross = hierarchy.cross
    const cellBelow = (below_id: string, ancestor_id: string): boolean => {
      const below = sankey.links_dict[below_id] as Class_LinkElement | undefined
      const ancestor = sankey.links_dict[ancestor_id] as Class_LinkElement | undefined
      if (!below || !ancestor || below === ancestor) return false
      const b = crossEnds(below, cross.side)
      const a = crossEnds(ancestor, cross.side)
      const under = (n: Class_NodeElement, over: Class_NodeElement) => n === over || isBelow(sankey, n.id, over.id)
      return under(b.p, a.p) && under(b.q, a.q)
    }
    const activate = (part_id: string, gesture: { shift: boolean, alt?: boolean }, route: string[] = []) => {
      if (!in_pane || !sankey.links_dict[part_id]) return
      const next = new Set(hierarchy.expanded)
      if (gesture.shift) {
        const drawn_parent = route.length >= 2 ? route[route.length - 2] : undefined
        const target = crossExpansionOf(next, part_id).open
          ? part_id
          : (drawn_parent !== undefined && crossExpansionOf(next, drawn_parent).open ? drawn_parent : undefined)
        if (target !== undefined) {
          // ⚠️ L'AXE SE LIT AVANT L'EFFACEMENT : c'est l'ensemble des cases ouvertes qui le porte,
          // et les lignes suivantes l'en retirent. Sans axe precise, c'est celui de la figure qui
          // avait ouvert (`cross.first`), comme a l'ouverture.
          const closed_axis = crossExpansionOf(next, target).axis ?? cross.first
          crossExpansionEntriesOf(target).forEach(e => next.delete(e))
          ;[...next]
            .filter(e => cellBelow(crossEntryLinkId(e), target))
            .forEach(e => next.delete(e))
          // ET LE DIAGRAMME SE REFERME AVEC, geste symetrique de l'ouverture : on re-agrege le
          // bout que cet axe avait ouvert. `aggregateLocally` refuse d'elle-meme si le couple
          // n'est pas deplie — on ne devine pas a sa place.
          if (wants_unfold) {
            const closing = crossOpeningAt(
              sankey.links_dict[target] as Class_LinkElement, closed_axis, cross.side
            )
            if (closing) aggregateLocally(app_data, closing.first_child, closing.node.id)
          }
        }
      } else {
        const axis: Type_CrossAxis | undefined = gesture.alt
          ? (cross.first === 'self' ? 'other' : 'self')
          : undefined
        crossExpansionEntriesOf(part_id).forEach(e => next.delete(e))
        next.add(crossExpansionEntry(part_id, axis))
        // LE DIAGRAMME SUIT L'AXE QU'ON VIENT D'OUVRIR. `axis` n'est pose que par alt+clic ; sans
        // lui, c'est l'axe de la figure qui a ouvert (`cross.first`), et c'est donc lui qu'on
        // deplie. `crossOpeningAt` applique la meme regle que le trace (cf. `cellsAlong`).
        if (wants_unfold) {
          const link = sankey.links_dict[part_id] as Class_LinkElement
          const opening = crossOpeningAt(link, axis ?? cross.first, cross.side)
          if (opening) disaggregateAlong(app_data, [opening.node.id, opening.first_child.id])
        }
      }
      if (next.size !== hierarchy.expanded.size || [...next].some(e => !hierarchy.expanded.has(e))) {
        writeExpanded(next)
      }
    }
    return { activate }
  }

  const activate = (
    part_id: string, gesture: { shift: boolean }, route: string[] = []
  ) => {
    // Un secteur replié par le tracé (« Autres ») ne désigne aucun nœud : il n'y a rien à ouvrir
    // ni où descendre. On ne devine pas.
    const node = sankey.nodes_dict[part_id] as Class_NodeElement | undefined
    if (!node) return

    // ── LE GESTE DE BASE : OUVRIR, REFERMER ─────────────────────────────────────────────────
    //
    // Julien : « si je clique sur Maïs, ça ouvre une nouvelle couronne, Maïs Bio et Maïs
    // Conventionnel ; et si je fais shift+clic ça l'enlève ».
    //
    // Il se fait DANS LA FIGURE et n'y touche à rien d'autre : explorer une hiérarchie cesse
    // d'être un geste qui modifie le document. Ce qui suit — déplier le diagramme, descendre
    // dedans — s'y AJOUTE quand l'auteur l'a demandé (`interaction_click`).
    if (in_pane) {
      const next = new Set(hierarchy.expanded)
      if (gesture.shift) {
        // ── CE QU'ON REFERME QUAND ON SHIFT+CLIQUE (24/09/2026) ─────────────────────────────
        //
        // ⚠️ PAS FORCÉMENT LA PART TOUCHÉE, et c'était le trou : Julien « le shift+clic ne semble
        // pas marcher ». En place, ouvrir « Maïs » le fait DISPARAÎTRE derrière Maïs Bio et Maïs
        // Conventionnel — le nœud ouvert n'est plus à l'écran, et il n'y avait donc plus rien à
        // shift+cliquer pour le refermer. Le geste ne pouvait pas fonctionner.
        //
        // On referme donc la part si elle est ouverte, SINON LE PARENT PAR LEQUEL ON LA VOIT.
        // Shift+clic sur « Maïs Bio » referme « Maïs » : c'est ce que le geste veut dire pour qui
        // le fait — « enlève cet anneau-là ».
        const drawn_parent = route.length >= 2 ? route[route.length - 2] : undefined
        const target = next.has(part_id)
          ? part_id
          : (drawn_parent !== undefined && next.has(drawn_parent) ? drawn_parent : undefined)
        if (target !== undefined) {
          next.delete(target)
          // Refermer une branche referme TOUT CE QU'ELLE PORTAIT. Sans ça, rouvrir « Maïs » ferait
          // réapparaître d'un coup trois niveaux ouverts dix minutes plus tôt — la figure se
          // souviendrait d'un état que l'auteur croyait avoir refermé.
          ;[...next]
            .filter(id => isBelow(sankey, id, target))
            .forEach(id => next.delete(id))
        }
      } else if (node.dimensions_as_parent.some(
        (d: Class_NodeDimension) => d.children.length > 0
      )) {
        // On n'ouvre que ce qui a quelque chose dedans : un nœud sans enfant donnerait un anneau
        // vide, et la figure dirait le contraire du geste.
        next.add(part_id)
      }
      if (next.size !== hierarchy.expanded.size) writeExpanded(next)
    }

    if (gesture.shift) {
      // REPLIER AUSSI DANS LE DIAGRAMME, quand l'auteur l'a demandé. Le parent est celui de LA
      // ROUTE DESSINÉE quand on la connaît — sur un treillis, un nœud a plusieurs parents et seul
      // le chemin par lequel on l'a atteint dit lequel replier. `aggregateLocally` refuse tout
      // seul si le couple n'est pas déplié.
      if (wants_unfold) {
        const drawn_parent = route.length >= 2 ? route[route.length - 2] : undefined
        const up = drawn_parent ?? (node.dimensions_as_child.find(
          (d: Class_NodeDimension) => d.id === hierarchy.dimension_id
        ) ?? node.dimensions_as_child[0])?.parent.id
        if (up) aggregateLocally(app_data, node, up)
      }
      // En descente dans la figure, remonter c'est dépiler — le même effet que le centre.
      if (wants_drill && hierarchy.path.length > 0) writePath(hierarchy.path.slice(0, -1))
      return
    }

    if (wants_unfold) {
      // ── TOUTE LA ROUTE, ET PAS SON DERNIER CRAN ─────────────────────────────────────────────
      //
      // Julien : « sur le sunburst ça lance effectivement la commande désagréger qui met tout en
      // place ». La couronne n'appelait `disaggregateLocally` que sur le nœud cliqué : sur un nœud
      // profond, ses ancêtres restaient repliés et le diagramme montrait le parent ET ses parts.
      // `disaggregateAlong` est partagée avec le disque (cf. Algorithms/Hierarchies), et on lui
      // donne la route PLUS le premier enfant : déplier jusqu'au nœud, puis le nœud lui-même.
      const dim = dimensionOf(node)
      const first_child = dim ? (dim.children[0] as Class_NodeElement).id : undefined
      const route_down = route.length > 0 ? [...route] : [part_id]
      if (first_child !== undefined) route_down.push(first_child)
      disaggregateAlong(app_data, route_down)
    }
    // Descendre DANS LA FIGURE (drill-down) : un choix à part, qui re-enracine au lieu d'ouvrir.
    if (wants_drill && node.dimensions_as_parent.some(
      (d: Class_NodeDimension) => d.children.length > 0
    )) {
      writePath([...hierarchy.path, part_id])
    }
  }

  return {
    activate,
    back: (wants_drill && hierarchy.path.length > 0)
      ? () => writePath(hierarchy.path.slice(0, -1))
      : undefined,
    focusTo: (wants_drill && hierarchy.path.length > 0) ? writePath : undefined
  }
}
