// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1445, étape 2 — DE L'ARBRE DE LA COURONNE AUX PARTS.
//
// `buildParts` part de la monnaie commune à toutes les natures (`Type_PartInput` : un identifiant,
// un libellé, une valeur, un sujet). Ce module est l'adaptateur de LA COURONNE, et il est le seul à
// savoir comment un secteur de couronne désigne quelque chose du document. Les barres auront le
// leur, sur la même sortie : c'est ce qui fait que le chemin est commun sans être générique.
//
// ⚠️ UNE PART N'EST PAS TOUJOURS UN NŒUD, et c'est la correction que Julien a posée le 20/09. Pour
// la couronne bâtie sur la hiérarchie, un secteur porte bien l'id d'un nœud du document
// (`SunburstHierarchy.buildNode`, `id: node.id`) — SAUF le secteur de complément, dont l'id est
// `<id>__residual__` et qui ne désigne RIEN. Les autres décompositions (par flux, par étiquette)
// ont leurs propres adaptateurs, et c'est pourquoi celui-ci ne prétend pas parler pour elles.
//
// PAS DE SUJET INVENTÉ. Un identifiant qu'on ne retrouve pas dans le document rend `{kind:'none'}`
// et non une référence fabriquée : une part qui désignerait un nœud qui n'existe pas afficherait un
// nom mort et renommerait dans le vide. Le cas arrive pour de bon — un secteur replié (« Autres »,
// `foldNarrowChildren`) est fabriqué par le tracé, pas par le modèle.

import type { Type_SunburstNode, Type_SunburstTree } from '../../Charts/SunburstHierarchy'
import type { Type_PartInput } from './buildParts'
import { NO_SUBJECT } from './PartSubject'
import type { Type_NamedSubject, Type_PartSubject } from './PartSubject'

/**
 * Ce que l'adaptateur demande au diagramme source : retrouver un nœud par son identifiant, et rien
 * de plus. Structurel et non nominal, comme `Type_SunburstSankey` et pour la même raison — le
 * registre des nœuds suffit, la classe entière attacherait ce module au modèle complet.
 */
export interface Type_SunburstPartsSource {
  nodes_dict: { [node_id: string]: Type_NamedSubject }
}

/** Le suffixe que `buildSunburstTree` donne au secteur de complément (mode « valeur propre »). */
export const SUNBURST_RESIDUAL_SUFFIX = '__residual__'

/**
 * Ce qu'un secteur de couronne DÉSIGNE dans le document.
 *
 * Le complément ne désigne rien : `{kind:'none'}` est une réponse, pas un manque (cf.
 * `PartSubject.ts`). C'est lui qui fait qu'un « non réparti » se renomme chez lui sans rien
 * renommer en amont.
 */
export const sunburstPartSubject = (
  source: Type_SunburstPartsSource,
  sector: Type_SunburstNode
): Type_PartSubject => {
  // Les deux signes du complément : le drapeau que l'arbre pose, et le suffixe de son identifiant.
  // Ni l'un ni l'autre n'est de trop — un secteur replié par le tracé porte le drapeau sans le
  // suffixe, et un arbre relu d'un enregistrement porte le suffixe sans forcément le drapeau.
  if (sector.is_residual === true || sector.id.endsWith(SUNBURST_RESIDUAL_SUFFIX)) return NO_SUBJECT
  const node = source.nodes_dict[sector.id]
  // Introuvable : aucune référence inventée. Cf. l'en-tête.
  if (node === undefined) return NO_SUBJECT
  // Le nœud LUI-MÊME, pas une copie de son nom : la part suit ce que le document dit, et un
  // renommage ailleurs change ce qu'elle affiche tant qu'elle ne porte pas d'alias.
  return { kind: 'node', node }
}

/**
 * Les parts d'une couronne, DANS L'ORDRE OÙ LE TRACÉ LES DESSINE : chaque secteur puis ses enfants,
 * comme `partitionSunburst` descend l'arbre. L'ordre compte — c'est celui sous lequel `buildParts`
 * rend `ordered`, et donc celui qu'une lecture « le troisième secteur » retrouverait.
 */
export const sunburstPartInputs = (
  source: Type_SunburstPartsSource,
  tree: Type_SunburstTree
): Type_PartInput[] => {
  const out: Type_PartInput[] = []
  const walk = (sector: Type_SunburstNode) => {
    out.push({
      id: sector.id,
      label: sector.label,
      value: sector.value,
      // La couleur que le modèle impose, quand il en impose une ; sinon rien, et c'est la palette
      // de la figure qui commande (cf. `parts_color_source`).
      color: sector.color ?? undefined,
      subject: sunburstPartSubject(source, sector)
    })
    sector.children.forEach(walk)
  }
  tree.roots.forEach(walk)
  return out
}
