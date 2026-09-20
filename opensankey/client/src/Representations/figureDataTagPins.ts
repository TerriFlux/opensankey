// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================

// os#1420 — LA RÈGLE PURE de la section « Coordonnées de la figure », séparée de son rendu.
//
// Ce module n'importe que le contrat de navigation : ni Chakra, ni le panneau de filtres, ni
// l'inspecteur. C'est ce qui le rend TESTABLE sous jest — le composant, lui, tire `Toolbar` de
// l'éditeur, qui tire la documentation, qui tire `react-markdown` en ESM que jest ne parse pas.
// La règle de fond ne doit pas dépendre de cette chaîne pour être vérifiée.

import { FIGURE_DATA_TAGS_KEY, readFigureDataTagPins } from '../Charts/FigureNavigation'

/**
 * LE SAC DE RÉGLAGES SUIVANT, une épingle posée ou retirée. Fonction PURE : c'est la seule règle
 * de fond de la section, et elle se vérifie sans monter une interface.
 *
 * `tag_id` vide RETIRE l'épingle du groupe — « suit le diagramme » n'est pas une valeur, c'est
 * l'absence de valeur.
 *
 * ET QUAND IL NE RESTE PLUS AUCUNE ÉPINGLE, la clé SORT du sac, au lieu d'y rester à `{}` : une
 * figure qui suit tout n'écrit rien dans le fichier. Sans ça, le seul fait d'avoir ouvert le
 * sélecteur puis de l'avoir remis à « suit » laisserait une trace dans l'enregistrement — un
 * diff sans objet, et une clé que les relectures futures auraient à interpréter.
 */
export const withDataTagPin = (
  options: { [key: string]: unknown },
  tagg_id: string,
  tag_id: string
): { [key: string]: unknown } => {
  const pins = { ...(readFigureDataTagPins(options) ?? {}) }
  if (tag_id === '') delete pins[tagg_id]
  else pins[tagg_id] = tag_id
  const next = { ...options }
  delete next[FIGURE_DATA_TAGS_KEY]
  if (Object.keys(pins).length > 0) next[FIGURE_DATA_TAGS_KEY] = pins
  return next
}
