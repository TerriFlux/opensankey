// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1445 (étape 3) — QUI GARDE LES PARTS D'UNE FIGURE ENTRE DEUX DESSINS.
//
// Le problème que ce fichier résout, et la raison pour laquelle l'étape 2 s'est arrêtée avant :
// `buildParts` fabrique un document par appel. Un tracé qui l'appellerait à chaque redessin
// fuirait un document à chaque geste — et perdrait, à chaque geste aussi, les réglages que
// l'auteur venait de poser sur un secteur.
//
// MÊME PATRON QUE LA MÉMOIRE DE POINT DE VUE (`Charts/figureZoomBridge`, `rememberFigureView`),
// et pour la même raison : une fenêtre porte N vignettes, une figure par objet regardé, et chacune
// a ses propres réglages. Le dépôt est donc indexé par (fenêtre, vignette).
//
// ÉTAT D'OUTIL, JAMAIS PERSISTÉ. Ce dépôt survit au remontage d'un dessin, pas à la session : ce
// qui doit être retrouvé dans un fichier rouvert sera écrit dans le document à l'étape 4, par la
// migration des clés. Ici on ne fait que ne pas perdre ce que l'auteur vient de faire.

import type { Class_ApplicationData } from '../../types/ApplicationData'
import { buildParts } from './buildParts'
import type { Type_FigureParts, Type_PartInput } from './buildParts'

const _parts = new Map<string, Type_FigureParts>()
// Les fenetres que la grande zone a REELLEMENT portees, au moins une fois. Cf. pruneClosedWindows :
// c est ce qui distingue « fermee » de « pas encore inscrite ».
const _seen_windows = new Set<string>()

const keyOf = (window_id: string, pane_key: string) => `${window_id} ${pane_key}`

/**
 * Les parts de CETTE vignette, reconstruites sur les données du moment et héritant des réglages
 * posées sur les précédentes.
 *
 * HORS FENÊTRE (`window_id` ou `pane_key` absents — la pop-up de présentation, une vignette
 * d'aperçu), il n'y a personne à qui attribuer une mémoire : on rend un jeu jetable, que
 * l'appelant libère à son démontage. C'est la même règle que pour le dépôt d'une étiquette, qui
 * reste à l'écran dans ce cas.
 */
export const figurePartsFor = (
  window_id: string | undefined,
  pane_key: string | undefined,
  source: Class_ApplicationData,
  inputs: Type_PartInput[]
): Type_FigureParts => {
  if (window_id === undefined || pane_key === undefined) {
    return buildParts(source, inputs)
  }
  pruneClosedWindows(source)
  const key = keyOf(window_id, pane_key)
  // On ne libère RIEN ici : depuis os#1453, `buildParts` réconcilie sur le jeu précédent — même
  // document, mêmes parts — au lieu de le remplacer. La libération se joue à la FERMETURE de la
  // vignette (`forgetFigureParts`, `pruneClosedWindows`), c'est-à-dire là où la figure cesse
  // vraiment d'exister.
  const next = buildParts(source, inputs, _parts.get(key))
  _parts.set(key, next)
  return next
}

/**
 * LE DÉPÔT SE NETTOIE TOUT SEUL, et c'est un choix de conception.
 *
 * Fermer une fenêtre passe par six endroits d'interface, et il en existera un septième : y poser
 * six appels de libération, c'est se garantir d'en oublier un — et un oubli se voit comme une
 * fuite lente, la pire chose à diagnostiquer. Un crochet dans `Class_MenuConfig` serait l'autre
 * réponse, mais la configuration de menus ne peut pas importer ce module (elle est en amont : le
 * document dépend d'elle, et ce module dépend du document).
 *
 * On retourne donc la question : à chaque construction, on écarte ce qui désigne une fenêtre que
 * la grande zone ne porte plus. C'est une lecture d'une liste courte, sur un geste déjà coûteux,
 * et ça ne peut pas se désynchroniser — il n'y a rien à se rappeler d'appeler.
 */
const pruneClosedWindows = (source: Class_ApplicationData): void => {
  const live = new Set(source.menu_configuration.main_zone_occupants.map(o => o.id))
  // ON NE LIBÈRE QUE CE QUI A EXISTÉ PUIS DISPARU, jamais ce qu'on n'a jamais vu. La différence
  // n'est pas théorique : une figure peut être dessinée avant que sa fenêtre ne soit inscrite
  // dans la grande zone (montage, fenêtre détachée, reprise d'une disposition enregistrée).
  // « Absent de la liste » voudrait alors dire « fermée » à tort, et on jetterait les réglages de
  // l'auteur au premier redessin — un défaut qui ne se verrait qu'à l'usage, et par intermittence.
  live.forEach(id => _seen_windows.add(id))
  _parts.forEach((entry, key) => {
    // La clé est « <fenêtre> <vignette> » ; la fenêtre est ce qui précède la première espace.
    const window_id = key.slice(0, key.indexOf(' '))
    if (live.has(window_id) || !_seen_windows.has(window_id)) return
    entry.document.dispose()
    _parts.delete(key)
  })
}

/**
 * La vignette s'en va : son document de parts cesse de vivre.
 *
 * À appeler à la FERMETURE de la vignette, pas à son démontage — un remontage est précisément ce
 * que la mémoire ci-dessus existe pour traverser.
 */
export const forgetFigureParts = (
  window_id: string | undefined,
  pane_key: string | undefined
): void => {
  if (window_id === undefined || pane_key === undefined) return
  const key = keyOf(window_id, pane_key)
  _parts.get(key)?.document.dispose()
  _parts.delete(key)
}

/** Les parts actuellement tenues pour cette vignette, ou `null`. Lu par la sélection. */
export const figurePartsOf = (
  window_id: string | undefined,
  pane_key: string | undefined
): Type_FigureParts | null => {
  if (window_id === undefined || pane_key === undefined) return null
  return _parts.get(keyOf(window_id, pane_key)) ?? null
}

/** Pour les tests : vider le dépôt sans laisser de document vivant derrière soi. */
export const resetFigureParts = (): void => {
  _parts.forEach(entry => entry.document.dispose())
  _parts.clear()
  _seen_windows.clear()
}
