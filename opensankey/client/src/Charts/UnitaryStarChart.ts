// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1390 (jalon 81) — MOTEUR DE DESSIN DE L'APERÇU UNITAIRE : l'ÉTOILE d'un nœud, en d3 pur.
//
// Voisin de la couronne et de l'histogramme (NodeStatsCharts) et du sunburst : même signature,
// même préparation du conteneur, même repli sur `drawEmptyLabel`, aucune dépendance à React ni
// aux classes du modèle. Les données arrivent déjà plates (Type_UnitaryStar) ; ce module ne sait
// ni ce qu'est un Sankey, ni un nœud, ni un flux — il dessine trois colonnes et des rubans.
//
// POURQUOI UN MOTEUR PLUTÔT QUE LE RENDU SANKEY. Montrer l'étoile d'un nœud passait jusqu'ici par
// la fabrication d'une BRIQUE : sérialisation du diagramme entier, seconde application, suppression
// des nœuds hors périmètre, placement, rendu Sankey complet — pour une dizaine de nœuds. Ce prix
// n'achetait pas la fidélité (le board unitaire jette de toute façon styles, géométrie et légende) :
// il n'achetait que le moteur de rendu. Ici on ne dessine que la figure, et l'aperçu redevient ce
// qu'il est — une REPRÉSENTATION, l'exact pendant de la couronne et de l'histogramme.
//
// os#1393 - DES ÉTIQUETTES `data-*`, ET TOUJOURS AUCUN `id`. Le dessin porte depuis cette issue
// `data-repr-kind` (ruban, centre) et `data-repr-id` (l'identifiant du flux, déjà présent dans les
// données de branche), pour que le clic droit sache ce qu'on a cliqué. Ce N'EST PAS un relâchement
// de la règle ci-dessous, qui reste entière : un `id` est GLOBAL au document, un attribut `data-*`
// ne se lit qu'en remontant depuis l'élément cliqué, à l'intérieur du conteneur de CETTE étoile.
// Deux étoiles côte à côte continuent donc de répondre chacune pour elle-même.
//
// AUCUN IDENTIFIANT DOM N'EST POSÉ ICI, ET C'EST DÉLIBÉRÉ. Une référence `url(#id)` (dégradé, masque,
// clip) résout au PREMIER élément du document portant cet identifiant, jamais à celui du sous-arbre
// courant : deux étoiles côte à côte dans la même page — deux vignettes, une fenêtre et son aperçu —
// et la seconde emprunterait silencieusement le dégradé de la première. Le dépôt a payé ce piège
// deux fois cette semaine (cf. `viewport_clip_id` et `dom_id_prefix` de DrawingArea, qui se
// namespacent tous deux pour cette raison). La parade la plus sûre est de n'avoir rien à namespacer :
// des rubans en aplat, des classes pour le repérage, zéro `id`, zéro `<defs>`.

import * as d3 from '../d3Modules'
// os#1393 - LES DEUX NOMS D'ATTRIBUTS DU CLIC DROIT, et rien d'autre : deux chaînes, aucun code.
// Ce module reste sans dépendance au modèle ni à React ; les nommer ici en dur les ferait diverger
// du lecteur qui les relit (cf. `representationTargetAt`), et la panne serait muette - le menu du
// navigateur reviendrait, sans erreur.
import { REPR_ID_ATTR, REPR_KIND_ATTR } from '../Representations/RepresentationContextMenu'
import type {
  Type_UnitaryStar,
  Type_UnitaryStarBranch,
  Type_UnitaryStarOptions
} from './unitaryStarTypes'

// ==================================================================================================
// Constantes de mise en page
// ==================================================================================================

// Plancher de visibilité d'un ruban, en pixels — même doctrine que MIN_VISIBLE_BAR_PX des
// histogrammes : un flux mesuré qui se dessine à 0,3 px n'est pas « petit » à l'écran, il est
// ABSENT, et un lecteur ne distingue pas un flux minuscule d'un flux disparu. Le plancher ment
// sur l'épaisseur pour ne pas mentir sur l'existence ; la valeur exacte reste écrite et en
// info-bulle. Il s'applique IDENTIQUEMENT aux deux côtés, donc deux flux de même valeur gardent
// la même épaisseur même relevés : la comparabilité entrée/sortie survit au plancher.
const MIN_RIBBON_PX = 2
// Fraction de la hauteur de la case VISÉE par la plus grande des deux piles de rubans.
//
// Elle existe parce qu'une figure qui remplit sa case ne dit plus rien de ce qu'elle mesure :
// à une entrée et une sortie, le ruban prenait toute la hauteur quelle que soit la valeur, et
// l'étoile devenait un pavé. Ce n'est pas une marge d'esthétique, c'est ce qui rend l'épaisseur
// lisible comme une QUANTITÉ.
//
// La valeur reprend `UNITARY_CENTRAL_HEIGHT_FRACTION` (types/DrawingArea), la hauteur apparente
// que visait le nœud central du temps où l'aperçu passait par le moteur Sankey. Les deux doivent
// rester d'accord : c'est la même figure, vue par deux moteurs de rendu.
const TARGET_STACK_FILL = 0.3
// Blanc entre deux rubans voisins CÔTÉ BRANCHE. Sans lui, deux flux adjacents de même couleur
// (fréquent : un même nœud amont éclaté en plusieurs flux) se lisent comme un seul.
const ROW_GAP_PX = 2
// Largeur du talon posé au bout de chaque branche. Il porte la couleur en APLAT là où le ruban est
// translucide : quand les couleurs du diagramme sont actives, c'est la seule référence chromatique
// fiable pour rapprocher un libellé de son flux, deux teintes voisines se ressemblant une fois
// délavées. En gris uniforme il ne dit plus la couleur mais garde son autre office : borner
// franchement la branche là où le libellé vient s'aligner.
const STUB_W_PX = 6
// Translucidité des rubans. Le Sankey historique s'en sert pour montrer les croisements ; ici il
// n'y en a pas, mais elle reste utile : elle éteint la saturation d'une dizaine d'aplats côte à
// côte et laisse le texte posé dessus respirer.
const RIBBON_OPACITY = 0.55
// Le centre occupe cette fraction de l'espace horizontal libre, borné : trop étroit il ne peut plus
// porter son nom, trop large il écrase les rubans, qui sont le sujet du dessin.
//
// RÉGLÉ BAS (Julien, 10/09/2026 : « le nœud central est trop grand »). Le centre est déjà le plus
// gros aplat de la figure par sa HAUTEUR — il porte la plus grande des deux piles, donc presque
// toute la case, et cette hauteur-là n'est pas négociable : c'est la face sur laquelle les rubans
// arrivent jointifs. La seule dimension libre est donc la largeur, et chaque pixel qu'on lui reprend
// va aux rubans, c'est-à-dire à la portée sur laquelle se lit la courbe et où s'écrivent les valeurs.
//
// LE PLANCHER, LUI, NE SUIT PAS : il vaut la largeur d'une ligne de nom réelle (une dizaine de
// caractères à CENTER_FONT_PX), et le descendre plus bas ne rend pas la figure plus lisible, il
// hache seulement le nom en moignons de six lettres. C'est le plafond, pas le plancher, qui rendait
// le centre trop gros : sur une vignette large, la part de 32 % le poussait à 100 px et au-delà.
const CENTER_SHARE = 0.18
const CENTER_MIN_W_PX = 60
const CENTER_MAX_W_PX = 86
// Gouttière des libellés de branche, de chaque côté. Bornée en absolu : sur une case large, réserver
// un quart de la largeur à du texte ne sert à rien de plus qu'un plafond fixe, et les pixels gagnés
// vont aux rubans.
const GUTTER_SHARE = 0.22
const GUTTER_MAX_PX = 130
// Nombre de lignes qu'on accorde au nom du centre. Le centre est HAUT (il porte la plus grande des
// deux piles, donc presque toute la case) mais ÉTROIT : le replier sur quelques lignes est la seule
// façon d'y écrire un nom réel, une troncature à huit caractères ne nommant plus rien. Le budget
// suit la largeur qu'on lui laisse : la boîte ayant été resserrée, une ligne y tient deux fois moins
// de caractères, et s'en tenir à trois lignes reviendrait à tronquer là où il reste de la hauteur
// libre. Au-delà de quatre, en revanche, le pavé de texte prend le pas sur la figure.
const MAX_CENTER_LINES = 4
// En deçà, la case n'a plus la place de trois colonnes ET de deux gouttières de texte : on garde la
// figure et on sacrifie les libellés (les info-bulles, elles, restent). Un dessin sans nom vaut
// mieux qu'un dessin dont les noms se chevauchent.
const MIN_W_FOR_LABELS_PX = 210
// En deçà de ces bornes il n'y a plus de figure lisible du tout — repli sur le message de vide,
// comme le font la couronne et l'histogramme sous 80 × 80.
const MIN_W_PX = 110
const MIN_H_PX = 56
// Épaisseur minimale d'un ruban pour porter un libellé DE BRANCHE. C'est la garde anti-chevauchement,
// et elle se suffit à elle-même : deux libellés voisins sont écrits au centre de leur ruban, donc
// séparés d'au moins la demi-épaisseur de chacun. Deux rubans affichés font ainsi toujours ≥ 11 px
// entre leurs textes, soit plus que l'interligne — et un ruban trop fin, lui, se tait au lieu de
// venir écrire par-dessus son voisin. Rien de global à décider : les grosses branches gardent leur
// nom même quand la case est saturée de petites.
const MIN_ROW_FOR_LABEL_PX = 11
// Épaisseur minimale pour porter EN PLUS la valeur, posée sur le ruban. Plus exigeant que le nom :
// la valeur est la redondance (elle est déjà dans l'info-bulle), c'est donc elle qui saute la
// première quand les branches se multiplient.
const MIN_ROW_FOR_VALUE_PX = 13
const LABEL_FONT_PX = 10
const VALUE_FONT_PX = 9
const CENTER_FONT_PX = 11
const MENTION_FONT_PX = 9
// Largeur moyenne d'un caractère, en fraction de la taille de police. Sert au BUDGET de troncature :
// mesurer chaque chaîne dans le DOM coûterait un reflow par libellé pour un gain nul, la marge
// d'erreur d'une police système à cette taille étant absorbée par la réserve laissée autour.
const CHAR_WIDTH_RATIO = 0.58
// Bande réservée en bas à la mention du flux de référence (mode normalisé).
const MENTION_BAND_PX = 13
const MARGIN_PX = 8

// Encres — celles des graphiques voisins, pour que trois représentations d'une même fenêtre ne
// paraissent pas venir de trois applications différentes.
const INK = '#2D3748'
const MUTED_INK = '#718096'
const INK_ON_DARK = '#ffffff'
const CENTER_FILL = '#EDF2F7'
const CENTER_STROKE = '#CBD5E0'
// Gris des rubans en mode NEUTRE. C'est `default_element_color` d'OpenSankey — la couleur que
// l'ancien board unitaire posait sur tous ses nœuds et, par la règle « couleur de la source », sur
// tous ses flux : une étoile grise. Recopiée en dur plutôt qu'importée, pour que ce moteur reste
// consommable sans rien connaître du modèle, comme la couronne et l'histogramme d'à côté.
const NEUTRAL_COLOR = '#a9a9a9'
// Fond supposé de la case. Sert au calcul d'encre ci-dessous : un ruban translucide n'a pas la
// luminance de sa couleur, mais celle de son mélange avec ce qui est derrière.
const SURFACE = '#ffffff'

// ==================================================================================================
// Fonctions PURES — testables sans DOM
// ==================================================================================================

/**
 * Encre lisible sur un aplat : blanc sur les fonds sombres, encre normale sinon, tranché sur la
 * luminance relative (même critère que le sunburst, gardé local pour que ce moteur reste d'un seul
 * fichier). La couleur passée doit être celle EFFECTIVEMENT vue — pour un ruban translucide, son
 * mélange avec le fond, cf. blendOver : un bleu marine à 55 % n'est plus un bleu marine, et lui
 * imposer du blanc rendrait la moitié des valeurs illisibles.
 */
export const readableInk = (background: string): string => {
  const c = d3.rgb(background)
  if (isNaN(c.r)) return INK
  const chan = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const luminance = 0.2126 * chan(c.r) + 0.7152 * chan(c.g) + 0.0722 * chan(c.b)
  return luminance > 0.45 ? INK : INK_ON_DARK
}

/** Mélange d'une couleur posée à `alpha` sur un fond opaque — ce que l'œil voit réellement. */
export const blendOver = (color: string, background: string, alpha: number): string => {
  const c = d3.rgb(color)
  const b = d3.rgb(background)
  if (isNaN(c.r)) return background
  const mix = (x: number, y: number) => Math.round(x * alpha + y * (1 - alpha))
  return d3.rgb(mix(c.r, b.r), mix(c.g, b.g), mix(c.b, b.b)).formatHex()
}

/**
 * Plancher et écart EFFECTIFS quand le côté le plus fourni ne rentre pas, même réduit au minimum.
 *
 * POURQUOI LES RABOTER PLUTÔT QUE DÉBORDER. Le plancher et l'écart sont des constantes de
 * lisibilité, pas des mesures : à N branches dans une case courte, leur somme peut dépasser à elle
 * seule la hauteur disponible, et les tenir ferait sortir la moitié de l'étoile de son cadre — donc
 * disparaître des flux, ce qui est pire que de les dessiner fins. On les réduit du même facteur pour
 * que le dessin reste borné par la case ; la figure devient serrée, mais elle reste COMPLÈTE, et les
 * libellés se taisent d'eux-mêmes puisque les rubans passent sous leur seuil.
 */
export const fitRowMinima = (
  branch_count: number,
  height: number
): { floor: number, gap: number } => {
  const needed = branch_count * MIN_RIBBON_PX + Math.max(0, branch_count - 1) * ROW_GAP_PX
  const shrink = (needed > height && needed > 0) ? height / needed : 1
  return { floor: MIN_RIBBON_PX * shrink, gap: ROW_GAP_PX * shrink }
}

/**
 * ÉCHELLE COMMUNE aux deux côtés : nombre de pixels d'épaisseur par unité de valeur.
 *
 * POURQUOI COMMUNE. Deux échelles indépendantes — chaque côté rempli à la hauteur de la case —
 * donneraient à une entrée et à une sortie de MÊME VALEUR deux épaisseurs différentes. Sur une
 * figure dont tout le propos est de faire voir ce qui entre et ce qui sort, ce serait un mensonge
 * dans la seule lecture que le lecteur va faire. On prend donc la plus contraignante des deux, et
 * l'écart entre les deux piles devient ce qu'il doit être : la lecture, à vue, du déséquilibre du
 * bilan (un nœud qui accumule ou qui puise dans un stock a des piles inégales — c'est une
 * information, pas un défaut de mise en page).
 *
 * POURQUOI PAR DICHOTOMIE. La hauteur d'une pile n'est pas proportionnelle à l'échelle : le
 * plancher de visibilité la rend affine par morceaux, et le morceau dépend de quelles branches sont
 * relevées, donc de l'échelle cherchée. Résoudre en fermé demanderait de trier et d'énumérer les
 * ensembles de branches relevées ; la dichotomie sur une fonction MONOTONE tient en six lignes et se
 * relit. Quarante itérations sur une dizaine de branches, c'est gratuit à côté du moindre reflow.
 */
export const unitaryStarScale = (
  input_values: number[],
  output_values: number[],
  height: number,
  gap: number,
  floor_px: number
): number => {
  const stackHeight = (values: number[], k: number) =>
    values.reduce((acc, v) => acc + Math.max(v * k, floor_px), 0) +
    Math.max(0, values.length - 1) * gap
  const fits = (k: number) =>
    stackHeight(input_values, k) <= height && stackHeight(output_values, k) <= height
  const total_in = input_values.reduce((acc, v) => acc + v, 0)
  const total_out = output_values.reduce((acc, v) => acc + v, 0)
  const biggest = Math.max(total_in, total_out)
  if (biggest <= 0 || height <= 0) return 0
  // ÉCHELLE VISÉE : la plus grande des deux piles occupe TARGET_STACK_FILL de la case, et non
  // la case entière.
  //
  // Remplir la hauteur donnait, sur l'étoile la plus courante — un procédé, une entrée, une
  // sortie —, deux rubans épais de toute la case : un pavé, pas un Sankey. Le défaut ne se
  // voyait qu'à peu de branches, là où rien d'autre ne limite l'épaisseur ; au-delà, planchers
  // et écarts rabotaient déjà l'échelle.
  //
  // La fraction reprend `UNITARY_CENTRAL_HEIGHT_FRACTION` du board Sankey (types/DrawingArea) :
  // c'est la hauteur apparente que visait le nœud central quand l'aperçu était rendu par le
  // moteur Sankey, donc celle à laquelle l'œil s'est habitué. Les deux chemins de calcul
  // concordent : le board posait `scale = valeur_du_centre / 1.5` et une valeur égale à
  // l'échelle vaut 100 px, soit 150 px pour le flux central — exactement 30 % d'une case de
  // 500 px.
  const ideal = (height * TARGET_STACK_FILL) / biggest
  if (fits(ideal)) return ideal
  // Si même cette épaisseur ne tient pas, c'est que les planchers et les écarts saturent la
  // case à eux seuls : on cherche alors en DESSOUS. Jamais au-dessus — une pile qui remplit la
  // case est précisément ce qu'on vient d'écarter.
  let lo = 0
  let hi = ideal
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (fits(mid)) lo = mid
    else hi = mid
  }
  return lo
}

/** Une branche placée : son épaisseur et l'ordonnée du HAUT de son ruban à chacune de ses deux extrémités. */
export type Type_UnitaryStarRow = {
  branch: Type_UnitaryStarBranch
  thickness: number
  /** Haut du ruban côté branche (extérieur), où les rubans sont séparés par un écart. */
  outer_y: number
  /** Haut du ruban côté centre, où ils sont JOINTIFS — c'est la face du nœud. */
  inner_y: number
}

/**
 * Empilement d'un côté, dans l'ORDRE REÇU — jamais trié par valeur : l'ordre du modèle est celui
 * que l'utilisateur retrouve dans ses tableaux et dans le diagramme, le réordonner ferait chercher.
 *
 * DEUX EMPILEMENTS POUR UNE MÊME BRANCHE, et c'est ce qui fait qu'une étoile ressemble à un Sankey
 * plutôt qu'à un peigne : côté branche les rubans sont espacés (on doit pouvoir les compter et les
 * nommer un par un), côté centre ils sont JOINTIFS et couvrent exactement la face du nœud (c'est
 * ainsi qu'on voit que le centre est la somme de ce qui l'atteint). Le ruban absorbe l'écart en se
 * déformant, ce que la Bézier fait sans qu'on ait à s'en occuper.
 *
 * Chaque pile est centrée sur sa propre référence : verticalement dans la case côté extérieur, sur
 * la face du centre côté intérieur. Le côté le plus léger se retrouve donc centré sur un centre plus
 * haut que lui — l'excédent de face nue étant, là encore, le déséquilibre du bilan rendu visible.
 */
export const layoutStarRows = (
  branches: Type_UnitaryStarBranch[],
  scale: number,
  gap: number,
  floor_px: number,
  height: number,
  center_top: number,
  center_height: number
): Type_UnitaryStarRow[] => {
  const thickness = branches.map(b => Math.max(b.value * scale, floor_px))
  const solid = thickness.reduce((acc, t) => acc + t, 0)
  const stacked = solid + Math.max(0, branches.length - 1) * gap
  let outer = (height - stacked) / 2
  let inner = center_top + (center_height - solid) / 2
  return branches.map((branch, i) => {
    const row = { branch, thickness: thickness[i], outer_y: outer, inner_y: inner }
    outer += thickness[i] + gap
    inner += thickness[i]
    return row
  })
}

/**
 * Contour fermé d'un ruban entre deux bords verticaux, en deux Béziers cubiques symétriques.
 *
 * POURQUOI UNE COURBE ET PAS UN SEGMENT. C'est la forme du Sankey, et le lecteur la reconnaît ;
 * mais surtout, la courbe part et arrive HORIZONTALEMENT, donc tangente aux faces qu'elle relie :
 * la jonction ruban/talon et la jonction ruban/centre ne montrent aucun angle, là où des trapèzes
 * feraient un accordéon de pointes dès que les deux empilements sont décalés.
 *
 * Une seule forme suffit à une étoile : pas de recyclage, pas de point de passage, pas de flux qui
 * remonte vers son propre nœud — un voisinage d'ordre un n'en produit jamais. Les points de contrôle
 * sont posés à mi-chemin, ce qui donne au passage une propriété utile aux libellés : à t = 0,5 la
 * courbe vaut exactement la moyenne de ses deux extrémités (les contrôles partagent l'ordonnée des
 * points qu'ils prolongent), donc le milieu du ruban se calcule sans échantillonner la courbe.
 */
export const unitaryRibbonPath = (
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  thickness: number
): string => {
  const xm = (x0 + x1) / 2
  const b0 = y0 + thickness
  const b1 = y1 + thickness
  return `M${x0},${y0}C${xm},${y0} ${xm},${y1} ${x1},${y1}` +
    `L${x1},${b1}C${xm},${b1} ${xm},${b0} ${x0},${b0}Z`
}

/**
 * Troncature au BUDGET de caractères tenant dans une largeur. Un texte qui déborde de sa gouttière
 * passe sous le ruban voisin ou sort de la case : dans les deux cas il devient illisible sans qu'on
 * puisse le savoir. Mieux vaut une ellipse assumée — le libellé entier reste dans l'info-bulle.
 */
const truncateToWidth = (text: string, room_px: number, font_px: number): string => {
  const room = Math.floor(room_px / (font_px * CHAR_WIDTH_RATIO))
  if (room <= 0) return ''
  return text.length > room ? text.slice(0, Math.max(1, room - 1)) + '…' : text
}

/**
 * Repli d'un texte sur au plus `max_lines` lignes tenant dans une largeur — réservé au NOM DU CENTRE.
 * Les libellés de branche, eux, restent sur une ligne : ils sont écrits au milieu de leur ruban, et
 * une seconde ligne mordrait sur le ruban voisin. Le centre, lui, est seul dans sa colonne.
 *
 * Coupure aux espaces, et coupure NETTE d'un mot plus long que la ligne (un identifiant sans espace
 * déborderait à lui seul). L'ellipse finale n'est posée que s'il reste vraiment du texte non écrit :
 * une ellipse qui ne cache rien ferait chercher un complément inexistant.
 */
export const wrapToWidth = (
  text: string,
  room_px: number,
  font_px: number,
  max_lines: number
): string[] => {
  const room = Math.floor(room_px / (font_px * CHAR_WIDTH_RATIO))
  const words = text.split(/\s+/).filter(w => w.length > 0)
  if (room <= 0 || max_lines <= 0 || words.length === 0) return []
  const lines: string[] = []
  let current = ''
  const flush = () => {
    if (current) lines.push(current)
    current = ''
  }
  for (const word of words) {
    if (lines.length >= max_lines) break
    const candidate = current ? current + ' ' + word : word
    if (candidate.length <= room) {
      current = candidate
      continue
    }
    flush()
    if (lines.length >= max_lines) break
    current = word.length <= room ? word : word.slice(0, Math.max(1, room - 1)) + '…'
  }
  flush()
  const kept = lines.slice(0, max_lines)
  const written = kept.join(' ')
  if (kept.length > 0 && written !== words.join(' ') && !written.endsWith('…')) {
    const last = kept[kept.length - 1]
    kept[kept.length - 1] = (last.length >= room ? last.slice(0, Math.max(1, room - 1)) : last) + '…'
  }
  return kept
}

/**
 * Info-bulle d'une branche. Le mode « données collectées » refuse d'écrire un nombre quand la somme
 * des flux est incomplète — une part y serait trompeuse — et rend un `text` VIDE sur chacune de ses
 * branches. Coller un séparateur sur du vide laisserait une ligne blanche dans l'info-bulle : il n'y
 * a alors que le nom à dire, et il se dit seul.
 */
const branchTooltip = (branch: Type_UnitaryStarBranch) =>
  branch.text ? `${branch.label}\n${branch.text}` : branch.label

// Vide le conteneur et renvoie sa sélection d3 + ses dimensions utiles. Même préparation que les
// graphiques voisins : la taille lue est celle du conteneur RÉEL, jamais une taille demandée — la
// vignette qui monte ce dessin est seule à savoir ce dont elle dispose, et redessine au changement.
const prepareContainer = (container: HTMLElement) => {
  const sel = d3.select(container)
  sel.selectAll('*').remove()
  return { sel, width: container.clientWidth, height: container.clientHeight }
}

const drawEmptyLabel = (
  sel: d3.Selection<HTMLElement, unknown, null, undefined>,
  label: string
) => {
  sel.append('div')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('justify-content', 'center')
    .style('height', '100%')
    .style('color', MUTED_INK)
    .style('font-size', '0.85rem')
    .text(label)
}

// ==================================================================================================
// L'ÉTOILE — entrées à gauche, nœud au milieu, sorties à droite
// ==================================================================================================

export const drawUnitaryStar = (
  container: HTMLElement,
  star: Type_UnitaryStar,
  opts: Type_UnitaryStarOptions = {}
) => {
  const { sel, width, height } = prepareContainer(container)

  // Les branches de valeur nulle ou négative sont ÉCARTÉES du dessin. Le plancher de visibilité ment
  // sur la taille pour sauver l'existence d'une quantité mesurée ; un flux nul n'a pas de quantité à
  // sauver, et le hisser au plancher le rendrait indiscernable d'un flux minuscule mais réel — soit
  // exactement l'inverse de ce que le plancher est là pour garantir.
  const inputs = star.inputs.filter(b => b.value > 0)
  const outputs = star.outputs.filter(b => b.value > 0)
  const total_in = inputs.reduce((acc, b) => acc + b.value, 0)
  const total_out = outputs.reduce((acc, b) => acc + b.value, 0)

  if (
    star.is_empty ||
    (inputs.length === 0 && outputs.length === 0) ||
    Math.max(total_in, total_out) <= 0 ||
    width < MIN_W_PX || height < MIN_H_PX
  ) {
    drawEmptyLabel(sel, opts.empty_label ?? '')
    return
  }

  // ── Géométrie ───────────────────────────────────────────────────────────────────
  const has_mention = Boolean(opts.reference_label)
  const W = width - 2 * MARGIN_PX
  const H = height - 2 * MARGIN_PX - (has_mention ? MENTION_BAND_PX : 0)
  if (W <= 0 || H <= 0) {
    drawEmptyLabel(sel, opts.empty_label ?? '')
    return
  }

  const has_in = inputs.length > 0
  const has_out = outputs.length > 0
  // COULEUR EFFECTIVE d'une branche. En mode neutre, l'étoile entière est grise, comme l'était le
  // board unitaire qui posait `default_element_color` sur tout ce qu'il dessinait.
  //
  // POURQUOI C'EST LE DÉFAUT, ET PAS UN REPLI. L'étoile est une figure de PROPORTIONS : ce qu'on y
  // lit, c'est l'épaisseur d'une branche rapportée à celle des autres. Les couleurs du diagramme,
  // elles, disent une tout autre chose — l'appartenance à un tag, à un secteur, à un produit — et
  // ramener cette série-là dans une figure où elle ne signifie rien met une différence bien visible
  // là où il n'y a rien à voir, pendant que la différence à lire, l'épaisseur, est celle que l'œil
  // évalue le moins bien. Le gris rend la figure comparable d'un nœud à l'autre. Les couleurs du
  // diagramme restent un choix, pour qui veut retrouver dans la vignette les teintes de sa carte.
  const neutral = opts.neutral_colors !== false
  const colorOf = (branch: Type_UnitaryStarBranch) => neutral ? NEUTRAL_COLOR : branch.color
  const show_labels = width >= MIN_W_FOR_LABELS_PX
  const gutter = Math.min(GUTTER_MAX_PX, W * GUTTER_SHARE)
  const gutter_left = (show_labels && has_in) ? gutter : 0
  const gutter_right = (show_labels && has_out) ? gutter : 0

  // Un nœud source ou puits n'a qu'un côté : la place de l'autre lui revient au lieu de rester
  // blanche. C'est aussi ce qui rend l'étoile d'un nœud d'échange lisible dans une petite vignette.
  const sides = (has_in ? 1 : 0) + (has_out ? 1 : 0)
  const free = Math.max(0, W - gutter_left - gutter_right - sides * STUB_W_PX)
  const center_w = Math.max(
    Math.min(CENTER_MIN_W_PX, free),
    Math.min(CENTER_MAX_W_PX, free * CENTER_SHARE)
  )
  const span = sides > 0 ? Math.max(0, (free - center_w) / sides) : 0

  const x_in_stub = gutter_left
  const x_in_ribbon = x_in_stub + (has_in ? STUB_W_PX : 0)
  const x_center = x_in_ribbon + (has_in ? span : 0)
  const x_center_right = x_center + center_w
  const x_out_ribbon = x_center_right + (has_out ? span : 0)

  // ── Échelle et empilements ──────────────────────────────────────────────────────
  const { floor, gap } = fitRowMinima(Math.max(inputs.length, outputs.length), H)
  const scale = unitaryStarScale(
    inputs.map(b => b.value),
    outputs.map(b => b.value),
    H, gap, floor
  )
  const solidOf = (branches: Type_UnitaryStarBranch[]) =>
    branches.reduce((acc, b) => acc + Math.max(b.value * scale, floor), 0)
  // Le centre a la hauteur de la PLUS GRANDE des deux piles : c'est la seule qui le remplit
  // entièrement, l'autre venant se centrer sur sa face.
  const center_h = Math.max(solidOf(inputs), solidOf(outputs))
  const center_top = (H - center_h) / 2
  const in_rows = layoutStarRows(inputs, scale, gap, floor, H, center_top, center_h)
  const out_rows = layoutStarRows(outputs, scale, gap, floor, H, center_top, center_h)

  // ── Racine SVG ──────────────────────────────────────────────────────────────────
  const svg = sel.append('svg')
    .attr('class', 'unitary_star')
    .attr('width', width)
    .attr('height', height)
    // os#1397 - LE FOND, étiqueté sur la racine et non sur un rectangle ajouté pour l'occasion :
    // `representationTargetAt` remonte au plus proche ancêtre étiqueté, donc un clic sur un ruban
    // trouve le ruban, et tout ce qui n'est rien en particulier retombe ici. Les textes du centre
    // n'ont pas besoin d'étiquette pour autant : ils sont en `pointer-events: none` et le clic
    // traverse jusqu'à la boîte du centre, qui porte la sienne.
    .attr(REPR_KIND_ATTR, 'background')
  const g = svg.append('g').attr('transform', `translate(${MARGIN_PX},${MARGIN_PX})`)

  // ── Rubans ──────────────────────────────────────────────────────────────────────
  // Dessinés AVANT les talons et le centre : c'est aux formes en aplat de recouvrir la naissance
  // translucide des rubans, et non l'inverse, sans quoi une lisière claire apparaît à la jonction.
  //
  // La jointure d3 se fait PAR POSITION, jamais par `branch.id`, et c'est ce qui fait tenir la boucle
  // sur soi : un flux dont la source et la cible sont le nœud central est légitimement présent des
  // DEUX côtés avec le MÊME identifiant, et toute jointure par clé — comme tout identifiant DOM qui
  // en dériverait — ferait disparaître l'une des deux moitiés. Deux tableaux disjoints joints par
  // position n'ont pas ce problème : ici, `branch.id` ne sert à rien du tout.
  const ribbon = (
    rows: Type_UnitaryStarRow[],
    outer_x: number,
    inner_x: number
  ) => g.selectAll(null)
    .data(rows)
    .enter().append('path')
    .attr('class', 'unitary_star_ribbon')
    .attr('d', d => unitaryRibbonPath(outer_x, d.outer_y, inner_x, d.inner_y, d.thickness))
    .attr('fill', d => colorOf(d.branch))
    .attr('fill-opacity', RIBBON_OPACITY)
    // os#1393 - le ruban, son talon et son libellé portent LA MÊME étiquette : ce sont trois
    // formes d'un seul objet, et l'utilisateur ne vise pas un `path`, il vise un flux.
    .attr(REPR_KIND_ATTR, 'ribbon')
    .attr(REPR_ID_ATTR, d => d.branch.id)
    .append('title')
    .text(d => branchTooltip(d.branch))

  if (has_in) ribbon(in_rows, x_in_ribbon, x_center)
  if (has_out) ribbon(out_rows, x_out_ribbon, x_center_right)

  // ── Talons colorés ──────────────────────────────────────────────────────────────
  const stub = (rows: Type_UnitaryStarRow[], x: number) => g.selectAll(null)
    .data(rows)
    .enter().append('rect')
    .attr('class', 'unitary_star_stub')
    .attr('x', x)
    .attr('y', d => d.outer_y)
    .attr('width', STUB_W_PX)
    .attr('height', d => d.thickness)
    .attr('fill', d => colorOf(d.branch))
    .attr(REPR_KIND_ATTR, 'ribbon')
    .attr(REPR_ID_ATTR, d => d.branch.id)
    .append('title')
    .text(d => branchTooltip(d.branch))

  if (has_in) stub(in_rows, x_in_stub)
  if (has_out) stub(out_rows, x_out_ribbon)

  // ── Le centre ───────────────────────────────────────────────────────────────────
  // NEUTRE, et c'est le point : il est le SUJET de la figure, pas une part parmi d'autres. Lui
  // donner une couleur le ferait entrer dans la même série que les branches et inviterait à le
  // comparer à elles, alors que la couleur ne sert ici qu'à rapprocher un ruban de son libellé.
  g.append('rect')
    .attr('class', 'unitary_star_center')
    .attr('x', x_center)
    .attr('y', center_top)
    .attr('width', center_w)
    .attr('height', Math.max(center_h, 1))
    .attr('fill', CENTER_FILL)
    .attr('stroke', CENTER_STROKE)
    // os#1393 - le centre n'a PAS de `data-repr-id` : l'étoile ne transporte pas l'identifiant
    // de son nœud (cf. Type_UnitaryStar, qui n'en porte que le nom affiché), et la
    // représentation qui déclare le menu connaît de toute façon son propre sujet. Inventer un
    // identifiant ici l'obligerait à choisir entre celui du diagramme et celui de la source
    // importée - deux fichiers, deux jeux d'identifiants.
    .attr(REPR_KIND_ATTR, 'center')
    .append('title')
    .text(star.center_text ? `${star.center_label}\n${star.center_text}` : star.center_label)

  // Le nom du centre s'écrit DANS la boîte dès qu'elle a la hauteur d'une ligne, ce qui est le cas
  // ordinaire : la boîte porte la plus grande des deux piles, donc presque toute la case. Elle est en
  // revanche étroite — d'où le repli sur plusieurs lignes plutôt qu'une troncature qui ne laisserait
  // du nom qu'un moignon. Le repli sur la boîte trop courte (une case minuscule, où même une ligne ne
  // rentre pas) écrit au-dessus, avec un budget élargi d'une portée de ruban : quand le centre est
  // court, les coins de la case sont libres par construction.
  const cx = x_center + center_w / 2
  const line_h = CENTER_FONT_PX + 3
  const value_lines = star.center_text ? 1 : 0
  const inside = center_h >= line_h * (1 + value_lines) + 4
  if (inside) {
    const room = center_w - 6
    const label_budget = Math.max(1, Math.min(
      MAX_CENTER_LINES,
      Math.floor((center_h - 4) / line_h) - value_lines
    ))
    const lines = wrapToWidth(star.center_label, room, CENTER_FONT_PX, label_budget)
    const block = (lines.length + value_lines) * line_h
    const top = center_top + (center_h - block) / 2
    const block_g = g.append('g').attr('class', 'unitary_star_center_text')
    lines.forEach((line, i) => {
      block_g.append('text')
        .attr('class', 'unitary_star_center_label')
        .attr('x', cx)
        .attr('y', top + (i + 0.5) * line_h)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', CENTER_FONT_PX)
        .attr('font-weight', 'bold')
        .attr('fill', INK)
        .attr('pointer-events', 'none')
        .text(line)
    })
    if (star.center_text) {
      block_g.append('text')
        .attr('class', 'unitary_star_center_value')
        .attr('x', cx)
        .attr('y', top + (lines.length + 0.5) * line_h)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', CENTER_FONT_PX - 1)
        .attr('fill', INK)
        .attr('pointer-events', 'none')
        .text(truncateToWidth(star.center_text, room, CENTER_FONT_PX - 1))
    }
  } else {
    const room = Math.min(W, center_w + span)
    const clampY = (y: number) => Math.max(CENTER_FONT_PX, Math.min(H - 2, y))
    g.append('text')
      .attr('class', 'unitary_star_center_label')
      .attr('x', cx)
      .attr('y', clampY(center_top - 5))
      .attr('text-anchor', 'middle')
      .attr('font-size', CENTER_FONT_PX)
      .attr('font-weight', 'bold')
      .attr('fill', INK)
      .attr('pointer-events', 'none')
      .text(truncateToWidth(star.center_label, room, CENTER_FONT_PX))
    if (star.center_text) {
      g.append('text')
        .attr('class', 'unitary_star_center_value')
        .attr('x', cx)
        .attr('y', clampY(center_top + Math.max(center_h, 1) + line_h - 2))
        .attr('text-anchor', 'middle')
        .attr('font-size', CENTER_FONT_PX - 1)
        .attr('fill', MUTED_INK)
        .attr('pointer-events', 'none')
        .text(truncateToWidth(star.center_text, room, CENTER_FONT_PX - 1))
    }
  }

  // ── Libellés de branche ─────────────────────────────────────────────────────────
  // À l'EXTÉRIEUR : à gauche des entrées, à droite des sorties. Deux raisons de ne pas les poser sur
  // les rubans comme les valeurs : un nom est long là où une valeur est courte, et l'aligner sur un
  // bord donne une colonne qui se parcourt d'un coup d'œil, ce qu'une diagonale de noms flottants ne
  // permet pas.
  const branchLabels = (rows: Type_UnitaryStarRow[], x: number, anchor: 'start' | 'end') => {
    const room = (anchor === 'end' ? gutter_left : gutter_right) - 5
    g.selectAll(null)
      .data(rows.filter(r => r.thickness >= MIN_ROW_FOR_LABEL_PX))
      .enter().append('text')
      .attr('class', 'unitary_star_branch_label')
      .attr('x', x)
      .attr('y', d => d.outer_y + d.thickness / 2)
      .attr('text-anchor', anchor)
      .attr('dominant-baseline', 'central')
      .attr('font-size', LABEL_FONT_PX)
      .attr('fill', INK)
      .attr(REPR_KIND_ATTR, 'ribbon')
      .attr(REPR_ID_ATTR, d => d.branch.id)
      .text(d => truncateToWidth(d.branch.label, room, LABEL_FONT_PX))
      .append('title')
      .text(d => branchTooltip(d.branch))
  }
  if (show_labels && has_in) branchLabels(in_rows, x_in_stub - 5, 'end')
  if (show_labels && has_out) branchLabels(out_rows, x_out_ribbon + STUB_W_PX + 5, 'start')

  // ── Valeurs sur les rubans ──────────────────────────────────────────────────────
  // Au MILIEU du ruban (t = 0,5), où son ordonnée est la moyenne exacte de ses deux extrémités et où
  // il est le plus loin de ses voisins. Trois conditions pour l'écrire : qu'il y ait un texte, que le
  // ruban soit assez épais, et qu'il ait assez de longueur — sinon on se tait. Une valeur qui déborde
  // sur le talon ou sur le centre serait à la fois fausse d'aspect et illisible, et elle est déjà
  // dans l'info-bulle.
  //
  // Le texte VIDE n'est pas un accident à contourner : en mode « données collectées », le formatage
  // refuse d'écrire une part que des sommes incomplètes rendraient trompeuse, et rend une chaîne vide
  // sur toutes les branches à la fois. L'étoile n'en est pas moins pleine — il y a des flux à
  // montrer, simplement pas de nombres à écrire. On ne pose donc rien du tout plutôt que des <text>
  // vides, qui n'apparaîtraient nulle part mais alourdiraient chaque redessin.
  const branchValues = (rows: Type_UnitaryStarRow[], outer_x: number, inner_x: number) => {
    const room = Math.abs(inner_x - outer_x) - 8
    const shown = rows.filter(r =>
      r.branch.text.length > 0 &&
      r.thickness >= MIN_ROW_FOR_VALUE_PX &&
      r.branch.text.length * VALUE_FONT_PX * CHAR_WIDTH_RATIO <= room
    )
    g.selectAll(null)
      .data(shown)
      .enter().append('text')
      .attr('class', 'unitary_star_branch_value')
      .attr('x', (outer_x + inner_x) / 2)
      .attr('y', d => (d.outer_y + d.inner_y) / 2 + d.thickness / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', VALUE_FONT_PX)
      .attr('fill', d => readableInk(blendOver(colorOf(d.branch), SURFACE, RIBBON_OPACITY)))
      .attr('pointer-events', 'none')
      .text(d => d.branch.text)
  }
  if (show_labels && has_in) branchValues(in_rows, x_in_ribbon, x_center)
  if (show_labels && has_out) branchValues(out_rows, x_out_ribbon, x_center_right)

  // ── Mention du flux de référence (mode normalisé) ───────────────────────────────
  // DISCRÈTE mais présente : en mode normalisé les épaisseurs sont des rapports, et taire à quoi
  // elles se rapportent laisserait lire des unités là où il n'y en a plus. Rien du tout dans les
  // autres modes — une bande vide n'est pas neutre, elle prend la place des rubans.
  if (opts.reference_label) {
    g.append('text')
      .attr('class', 'unitary_star_reference')
      .attr('x', 0)
      .attr('y', H + MENTION_BAND_PX - 3)
      .attr('font-size', MENTION_FONT_PX)
      .attr('font-style', 'italic')
      .attr('fill', MUTED_INK)
      .text(truncateToWidth(opts.reference_label, W, MENTION_FONT_PX))
  }
}
