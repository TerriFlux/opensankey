// #1243 — Résolveur d'inspecteur piloté par la sélection.
//
// Fonction PURE (aucune dépendance React/DOM/DrawingArea) qui traduit la
// composition de la sélection courante en une « cible » d'inspecteur. C'est le
// remplaçant conceptuel de la matrice type×élément : l'utilisateur ne choisit
// plus deux axes, la sélection détermine seule ce que l'inspecteur montre.
//
// Testée en isolation (InspectorResolver.test.ts), sur le modèle de ViewsQuery
// (#244) et Class_EventBus (#248).

// Cibles possibles de l'inspecteur. `view` = aucune sélection (réglages de la
// vue : page, grille, échelle, fond). `mixed` = plusieurs types sélectionnés
// simultanément (on n'expose alors que les sections communes).
export type Type_InspectorTarget =
  | 'view'
  | 'node'
  | 'link'
  | 'container'
  | 'legend'
  | 'title'
  | 'mixed'

// Décompte de la sélection par type d'élément. Fourni par la DrawingArea
// (selected_nodes_list.length, etc.) mais gardé primitif pour rester testable.
export type Type_SelectionCounts = {
  nodes: number
  links: number
  containers: number
  // La légende et le titre sont des objets uniques, donc booléens.
  legend: boolean
  title: boolean
}

export type Type_InspectorResolution = {
  target: Type_InspectorTarget
  // Nombre total d'éléments concernés (0 pour `view`). Utilisé par le fil
  // d'Ariane pour afficher « 3 nœuds » vs « Nœud « Agriculture » ».
  count: number
}

const EMPTY: Type_SelectionCounts = {
  nodes: 0, links: 0, containers: 0, legend: false, title: false
}

/**
 * Traduit une composition de sélection en cible d'inspecteur.
 *
 * @param counts décompte de la sélection par type
 * @param view_override si vrai, force la cible `view` sans purger la sélection
 *   (fil d'Ariane : atteindre les réglages de la vue tout en gardant la sélection).
 */
export function resolveInspectorTarget(
  counts: Partial<Type_SelectionCounts> = {},
  view_override = false
): Type_InspectorResolution {
  const c: Type_SelectionCounts = { ...EMPTY, ...counts }

  if (view_override) return { target: 'view', count: 0 }

  const total =
    c.nodes + c.links + c.containers + (c.legend ? 1 : 0) + (c.title ? 1 : 0)

  // Aucune sélection → réglages de la vue. Jamais de panneau vide.
  if (total === 0) return { target: 'view', count: 0 }

  // Nombre de TYPES distincts présents dans la sélection.
  const distinct_types =
    (c.nodes > 0 ? 1 : 0) +
    (c.links > 0 ? 1 : 0) +
    (c.containers > 0 ? 1 : 0) +
    (c.legend ? 1 : 0) +
    (c.title ? 1 : 0)

  if (distinct_types > 1) return { target: 'mixed', count: total }

  // Un seul type présent : la cible est ce type.
  if (c.nodes > 0) return { target: 'node', count: c.nodes }
  if (c.links > 0) return { target: 'link', count: c.links }
  if (c.containers > 0) return { target: 'container', count: c.containers }
  if (c.legend) return { target: 'legend', count: 1 }
  return { target: 'title', count: 1 }
}
