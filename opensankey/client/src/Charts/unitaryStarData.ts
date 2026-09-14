// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================

// os#1390 (jalon 81 × jalon 79) — LIRE L'ÉTOILE D'UN NŒUD DANS LE MODÈLE.
//
// L'étage DONNÉES de l'aperçu unitaire : d'un nœud du diagramme AFFICHÉ, produire
// la structure plate que `drawUnitaryStar` consomme (cf. `unitaryStarTypes.ts`).
// Le pendant, côté représentation, de ce que `SunburstHierarchy` fait pour la
// couronne et `AnalysisChartData` pour l'histogramme : on lit, on ne dessine pas.
//
// CE QUE CE MODULE NE FAIT PAS, ET C'EST TOUT LE SUJET. Il ne sérialise rien, ne
// construit aucune `Class_ApplicationData`, aucune `Class_DrawingArea`, aucune
// brique. Le chemin qu'il remplace en passait par là : sérialisation du diagramme
// entier, chargement dans une seconde application, suppression un par un des
// centaines de nœuds hors de l'étoile, deuxième sérialisation, troisième
// chargement, calcul de placement — pour montrer une dizaine de flux. Ici, le coût
// est proportionnel au DEGRÉ du nœud ; le diagramme, lui, n'est ni copié ni lu
// au-delà du voisinage. La BRIQUE, elle, ne bouge pas : `extractUnitaryBrickFor`
// reste le fichier autonome du jalon 81, produit sur geste explicite, et ce prix-là
// est justifié parce qu'il achète un fichier OpenSankey complet.
//
// LA CONDITION DE NON-DIVERGENCE. Ce que l'aperçu montre et ce que la brique
// exporte doivent rester la MÊME étoile. Le périmètre n'est donc pas relu ici :
// il vient de `unitaryStarLinks` (`Algorithms/UnitaryExtraction.ts`), la seule
// définition de voisinage des deux chemins. Cf. le commentaire de cette fonction.
//
// AUCUNE MUTATION DU MODÈLE. Ce module est appelé à chaque changement de sujet et
// à chaque changement de mode ; il travaille sur le diagramme de l'utilisateur,
// pas sur une copie. Il ne pose donc ni style, ni tag sélectionné, ni
// `sankey.normalised_link` — même « le temps du calcul, puis restauré ». Les modes
// d'affichage sont obtenus en FORÇANT les réglages de libellé le temps d'un appel
// à `format_value` (le mécanisme d'`overrides` d'OS#1314), et le rapport du mode
// normalisé est calculé ici, à partir du flux de référence que l'appelant DONNE —
// la référence de l'aperçu n'est pas celle du diagramme.

import { getNameLabelValues } from '../Elements/ElementsAttributesConfig'
import { displayedNameOf } from '../Elements/ElementNaming'
import { unit_stock_percent_constants, value_option_percent_constants } from '../Elements/LinkValues'
import { format_value } from '../types/Utils'
import { unitaryStarLinks } from '../Algorithms/UnitaryExtraction'
import type { NameLabelAttributeTypes } from '../Elements/ElementsAttributesConfig'
import type { Class_LinkElement } from '../Elements/Link'
import type { Class_NodeElement } from '../Elements/Node'
import type { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_Structure } from '../types/Utils'
import type {
  Type_UnitaryStar, Type_UnitaryStarBranch, Type_UnitaryValueMode
} from './unitaryStarTypes'

/** De quel côté du nœud central se lit une branche. */
type Type_StarSide = 'inputs' | 'outputs'

/**
 * Les types d'unité qui n'écrivent PAS une quantité, mais un rapport à autre chose
 * (part des entrées/sorties d'un nœud, part d'un stock, rapport à un tag d'unité,
 * rapport au flux de référence).
 *
 * POURQUOI ON LES REPÈRE : le mode `value` de l'aperçu doit écrire une VALEUR. Un
 * flux dont l'auteur a réglé le libellé sur « % des entrées de la destination »
 * afficherait, sans ce garde-fou, un pourcentage dans la colonne des valeurs — et
 * pire encore sur le nœud central, où un `%ID` se lit « 100 % de ses propres
 * entrées ». Dans ce cas seulement on impose `unit_tag`, exactement comme le fait
 * le board unitaire d'aujourd'hui. Hors de ce cas, on ne touche PAS au type
 * d'unité : les décimales, le séparateur, l'unité du registre (OS#1286) ou du tag
 * restent ceux que le diagramme applique à ce flux, ce qui est tout l'intérêt de
 * passer par `format_value` plutôt que de formater soi-même.
 */
const RELATIVE_UNIT_TYPES: readonly string[] = [
  ...value_option_percent_constants,
  ...unit_stock_percent_constants,
  'unit_ratio',
  'normalized'
]

/**
 * Réglages forcés du mode POURCENTAGE : la part de la somme des entrées (`%ID`,
 * lue sur la destination du flux, c'est-à-dire le nœud central) ou de la somme des
 * sorties (`%OS`, lue sur sa source, le même nœud).
 *
 * Ce sont les deux types d'unité que le board unitaire pose sur ses styles de flux
 * (`ElementStyle.tsx`, `LinkInUnitaryStyle` / `LinkOutUnitaryStyle`) ; le calcul,
 * lui, a toujours été celui de `format_value` — on lui demande donc la même chose,
 * sans avoir à poser le style. La présentation entière est reprise de ces styles
 * (entiers, trois chiffres significatifs, pas de notation scientifique) : elle est
 * volontairement PLUS SÈCHE que le réglage du flux dans le diagramme, parce qu'un
 * pourcentage à trois décimales sur une étoile compacte ne se lit pas, et parce
 * que c'est ce que l'utilisateur a sous les yeux aujourd'hui.
 *
 * Le suffixe « % » est ajouté par `formatValueWithOption` : sur un flux du
 * diagramme (qui ne porte AUCUN style unitaire) il tombe dans la branche générique
 * `option == '%ID'` et non dans le cas particulier du board — l'aperçu n'hérite
 * donc pas de la règle « 100 % s'écrit vide », propre au board.
 *
 * UNE SEULE DIFFÉRENCE AVEC LES STYLES DU BOARD, et elle est délibérée : l'arrondi
 * à l'entier est demandé par `custom_digit` SEUL, sans `significant_digits`. La
 * branche « chiffres significatifs » de `format_value` recolle en effet un point
 * final quand le résultat fait exactement autant de caractères que de chiffres
 * demandés et finit par un zéro (`Utils.tsx`, « 12345.67 avec nb_sign = 4 ») : un
 * flux qui porte 100 % des entrées — un nœud à une seule entrée, ce qui est
 * fréquent — s'écrirait « 100.% ». Le board ne le voit pas parce qu'il escamote
 * le cas 100 en chaîne vide, ce que l'aperçu ne veut pas faire (une branche sans
 * texte se lit comme une valeur manquante). Les deux réglages donnent le même
 * entier pour tout pourcentage jusqu'à 999 %.
 */
const percentOverrides = (side: Type_StarSide): Partial<NameLabelAttributeTypes> => ({
  is_visible: true,
  unit_visible: true,
  unit_type: side === 'inputs' ? '%ID' : '%OS',
  scientific_notation: false,
  significant_digits: false,
  custom_digit: true,
  nb_digit: 0
})

/**
 * Réglages forcés du mode VALEUR : ceux de l'élément, à deux exceptions près.
 *
 * `is_visible` et `unit_visible` sont imposés parce que `format_value` rend une
 * chaîne VIDE quand le libellé est masqué (`Utils.tsx`, second temps du calcul).
 * Or « ce flux n'affiche pas sa valeur sur le diagramme » ne veut pas dire « cette
 * fenêtre ne doit pas la montrer » : l'aperçu est une représentation à part, dont
 * le propos est justement de donner à lire les valeurs de l'étoile. C'est aussi le
 * cas du nœud central, dont le style unitaire masque la valeur sur le board.
 */
const valueOverrides = (
  element: Class_LinkElement | Class_NodeElement
): Partial<NameLabelAttributeTypes> => {
  const overrides: Partial<NameLabelAttributeTypes> = { is_visible: true, unit_visible: true }
  if (RELATIVE_UNIT_TYPES.includes(getNameLabelValues(element, 'value_label').unit_type))
    overrides.unit_type = 'unit_tag'
  return overrides
}

/**
 * Réglages forcés du mode NORMALISÉ — un rapport, donc un nombre nu.
 *
 * `unit_visible: false` fait sortir `format_value` avant tout suffixe d'unité : un
 * rapport à un flux fixé à 1 n'a pas d'unité, et c'est bien ce que le board
 * affiche. `unit_type: 'unit_name'` n'est ici qu'un type NEUTRE, choisi pour ce
 * qu'il ne fait pas : il ne déclenche ni pourcentage, ni conversion par le
 * registre d'unités, ni — surtout — la division par `sankey.normalised_link` du
 * type `normalized`, qui rapporterait le nombre au flux de référence du DIAGRAMME
 * alors que nous avons déjà divisé par celui de l'APERÇU. `unit_factor: 1`
 * neutralise de même le facteur d'échelle du flux : il s'applique à une quantité,
 * pas à un rapport.
 *
 * Trois chiffres significatifs sans arrondi entier, comme le board : le mode
 * normalisé produit des 0,5 et des 1,33 qu'un `nb_digit: 0` écraserait.
 */
const RATIO_OVERRIDES: Partial<NameLabelAttributeTypes> = {
  is_visible: true,
  unit_visible: false,
  unit_type: 'unit_name',
  unit_factor: 1,
  scientific_notation: false,
  significant_digits: true,
  nb_significant_digits: 3,
  custom_digit: false
}

/**
 * La valeur du flux de RÉFÉRENCE du mode normalisé, ou `null` si l'aperçu n'en a
 * pas d'exploitable (aucun id donné, id qui ne désigne plus rien, flux sans valeur,
 * valeur nulle — un rapport à zéro ne serait pas « 0 », il serait faux).
 *
 * La résolution se fait par ID sur le diagramme affiché, et NON par
 * `sankey.normalised_link` : celui-ci appartient au diagramme et peut désigner un
 * tout autre flux ; le nôtre est un réglage de la fenêtre, que l'appelant passe.
 * On lit la valeur exactement comme le fait `format_value` pour son mode
 * `normalized` (résultat réconcilié s'il existe, donnée collectée sinon), pour que
 * les deux chemins rapportent au même dénominateur.
 */
const referenceValue = (
  app_data: Class_ApplicationData,
  normalize_link_id: string | null
): number | null => {
  if (normalize_link_id === null || normalize_link_id === '') return null
  const reference = app_data.drawing_area.sankey.links_dict[normalize_link_id] as
    Class_LinkElement | undefined
  const value = reference?.value
  if (!value) return null
  const raw = value.valueResult ?? value.valueData
  if (raw === null || raw === undefined || raw === 0) return null
  return raw
}

/**
 * Couleur d'une branche : celle du FLUX, à défaut celle de l'autre extrémité.
 *
 * DEUX PIÈGES, tous deux dans `Class_LinkElement.getShapeColorToUse`.
 *
 * Le premier est bloquant : en règle « dégradé », ce getter ÉCRIT un `<defs>` dans
 * le SVG du diagramme principal et rend un `url(#gradient-…)` qui n'y renvoie. Une
 * telle référence, recopiée dans le SVG de l'aperçu, ne résout rien — la branche
 * sortirait sans couleur. On n'appelle donc même pas le getter dans ce cas : on
 * prend la couleur du nœud d'en face, qui est l'une des deux bornes du dégradé et
 * le meilleur résumé disponible d'un dégradé en une couleur unie.
 *
 * Le second explique pourquoi le nœud d'en face sert aussi de repli général : la
 * couleur propre d'un flux peut être vide, et c'est déjà le parti pris des
 * graphiques d'analyse (`AnalysisChartData.flowIdentity`), où le nœud d'en face
 * NOMME et COLORE le flux. Une étoile se lit de la même façon : ce sont les
 * voisins qu'on identifie, pas les tracés.
 */
const branchColor = (link: Class_LinkElement, other: Class_NodeElement): string => {
  if (link.shape_color_rule === 'gradient') return other.getShapeColorToUse()
  const own = link.getShapeColorToUse()
  return (typeof own === 'string' && own.trim() !== '') ? own : other.getShapeColorToUse()
}

/** Le texte d'une branche, dans le mode courant. */
const branchText = (
  link: Class_LinkElement,
  side: Type_StarSide,
  mode: Type_UnitaryValueMode,
  reference_value: number | null,
  type_data: Type_Structure
): string => {
  if (mode === 'percent') {
    return format_value(
      type_data, link.valueCurrent, link, link.unit_name('value_label'),
      'value_label', percentOverrides(side)
    )
  }
  if (mode === 'value') {
    return format_value(
      type_data, link.valueCurrent, link, link.unit_name('value_label'),
      'value_label', valueOverrides(link)
    )
  }
  const value = link.valueCurrent
  // Sans référence exploitable, le mode normalisé n'a rien à écrire — et surtout
  // pas la valeur brute, qu'on lirait alors comme un rapport (c'est aussi ce que
  // fait le board : sans flux de référence, ses libellés sortent vides).
  if (value === null || value === undefined || reference_value === null) return ''
  return format_value(type_data, value / reference_value, link, '', 'value_label', RATIO_OVERRIDES)
}

/**
 * Le texte du nœud CENTRAL, dans le mode courant.
 *
 * En mode POURCENTAGE il est vide, et ce n'est pas un oubli : le nœud central EST
 * le dénominateur de toutes les branches, sa part de lui-même vaut 100 % et
 * l'écrire n'apprendrait rien — le contrat prévoit explicitement le cas (« vide
 * quand le mode ne lui en donne pas »).
 *
 * Dans les deux autres modes, la grandeur est `data_value` : le DÉBIT du nœud,
 * c'est-à-dire le plus grand de ses deux totaux (entrées, sorties). C'est la même
 * grandeur que le board unitaire utilise pour caler son échelle, et la seule qui
 * ait un sens sur un nœud déséquilibré (source, puits, import/export), où choisir
 * les entrées ou les sorties reviendrait à afficher zéro une fois sur deux.
 */
const centerText = (
  node: Class_NodeElement,
  mode: Type_UnitaryValueMode,
  reference_value: number | null,
  type_data: Type_Structure
): string => {
  if (mode === 'percent') return ''
  const value = node.data_value
  if (mode === 'value') {
    return format_value(type_data, value, node, node.value_label_unit, 'value_label', valueOverrides(node))
  }
  if (reference_value === null) return ''
  return format_value(type_data, value / reference_value, node, '', 'value_label', RATIO_OVERRIDES)
}

/**
 * L'étoile d'un nœud, lue dans le modèle : le nœud, ses flux VISIBLES entrants et
 * sortants, leurs libellés, leurs couleurs, leurs valeurs et le texte de ces
 * valeurs dans le mode demandé.
 *
 * COÛT — O(degré) lectures de modèle, plus le formatage. Le mode `percent` est le
 * seul à dépasser : `format_value` resomme les flux visibles du nœud central pour
 * chaque branche, ce qui fait O(degré²) additions. Sur une étoile — quelques
 * dizaines de flux, par nature ce qui tient à l'écran — cela reste quelques
 * centaines d'opérations, à comparer aux mégaoctets de JSON que l'ancien chemin
 * sérialisait DEUX fois. Refaire cette somme nous-mêmes économiserait ces
 * centaines d'additions au prix de la fidélité : ce serait un second calcul de
 * pourcentage, à côté de celui du diagramme, exactement le genre de doublon que ce
 * chantier supprime.
 *
 * `mode` et `normalize_link_id` sont des réglages de la FENÊTRE, pas du diagramme :
 * rien de ce qui est lu ici n'est écrit nulle part, et deux fenêtres ouvertes sur
 * le même nœud dans deux modes différents ne se marchent pas dessus.
 */
export const buildUnitaryStar = (
  node: Class_NodeElement,
  mode: Type_UnitaryValueMode,
  normalize_link_id: string | null,
  app_data: Class_ApplicationData
): Type_UnitaryStar => {
  // Le périmètre PARTAGÉ avec la brique — cf. `unitaryStarLinks`.
  const { inputs, outputs } = unitaryStarLinks(node)
  // Le mode de données de la zone AFFICHÉE (collectées / réconciliées / structure).
  // C'est celui-là qu'il faut : les valeurs lues sur les flux en viennent, et
  // `format_value` s'en sert pour refuser d'écrire un pourcentage sur des données
  // collectées — des sommes incomplètes donneraient des parts trompeuses.
  const type_data = app_data.drawing_area.type_data
  const reference_value = mode === 'normalized' ? referenceValue(app_data, normalize_link_id) : null

  const branch = (link: Class_LinkElement, side: Type_StarSide): Type_UnitaryStarBranch => {
    const other = (side === 'inputs' ? link.source : link.target) as Class_NodeElement
    return {
      id: link.id,
      // Le nom AFFICHÉ du voisin, pas son `name` : un nœud peut se nommer par un
      // tag, par son ancêtre de dimension ou par un gabarit à jetons (OS#1314), et
      // l'étoile citerait sinon un nom que le diagramme ne montre nulle part.
      label: displayedNameOf(other),
      // La valeur BRUTE, pour l'épaisseur seule : le texte, lui, peut être un
      // pourcentage ou un rapport, dont l'épaisseur ne doit rien savoir.
      value: link.valueCurrent ?? 0,
      text: branchText(link, side, mode, reference_value, type_data),
      color: branchColor(link, other)
    }
  }

  return {
    center_label: displayedNameOf(node),
    center_text: centerText(node, mode, reference_value, type_data),
    inputs: inputs.map(link => branch(link, 'inputs')),
    outputs: outputs.map(link => branch(link, 'outputs')),
    is_empty: inputs.length === 0 && outputs.length === 0
  }
}
