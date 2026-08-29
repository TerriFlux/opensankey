/**
 * #370 — Où proposer le sélecteur de mode d'affichage (absolu / proportionnel / échelle
 * adaptée) ?
 *
 * Le mode est porté par CHAQUE DIMENSION (`Class_DataTagGroup.position_mode`) : il dit
 * comment le diagramme doit réagir quand on fait défiler cette dimension-là — échelle
 * adaptée pour des unités, proportionnel pour des années. Il n'y a donc plus de réglage
 * global du diagramme, et la règle d'affichage devient uniforme : **un bouton à côté de
 * chaque dimension, quel que soit son hôte** — ligne du panneau Filtres, sélecteur de la
 * barre du haut, ou frise de séquence.
 *
 * Cette règle REMPLACE celle du #367, qui posait un bouton unique en en-tête de la
 * section « Flux et dimensions » (le mode y était encore un réglage global) et excluait
 * les bannières `sequence` / `topbar` / `none`. Une dimension en Séquence n'avait alors
 * aucun sélecteur nulle part : c'est le constat qui a ouvert ce ticket.
 *
 * Extrait de l'interface pour être testable sans rendu.
 *
 * os#1366 — Ce module a QUITTÉ le paquet éditeur (`opensankey-editor/components/topmenus`)
 * pour la zone viewer d'OpenSankey : le mode d'affichage n'est pas un outil d'édition mais
 * une façon de LIRE la donnée quand la sélection change. Les deux couches consomment
 * désormais la même règle — une copie dans le viewer aurait divergé de celle de l'éditeur.
 */

import type { Class_ApplicationData } from '../../types/ApplicationData'
import type { Class_DataTagGroup } from '../../types/TagGroup'
import type { Type_PositionMode } from '../../types/PublishOptions'

/** Sections du tiroir de filtres (miroir de `TagFilterMode` dans Toolbar.tsx). */
export type Type_TagFilterMode = 'element' | 'level' | 'data' | 'unitary' | 'flux'

/** Ce que la décision a besoin de savoir d'un groupe de tags. */
export type Type_PositionModeCandidate = {
  id: string
  banner: string
  tags_dict?: object | null
}

/**
 * Vrai si CE groupe doit porter le sélecteur de mode d'affichage.
 *
 * @param tagg groupe de tags rendu par l'hôte
 * @param is_data_group vrai si le groupe est une DIMENSION (et non une étiquette) — les
 * sections « Étiquettes de nœuds », « Niveaux » et le tableau unitaire rendent des
 * groupes qui ne pilotent aucune donnée : le mode n'y a pas de sens.
 * @param enabled gate d'affichage (cf. `positionModeSelectorEnabled`)
 */
export const shouldShowDimensionPositionMode = (
  tagg: Type_PositionModeCandidate,
  is_data_group: (tagg: Type_PositionModeCandidate) => boolean,
  enabled: boolean
): boolean => {
  if (!enabled) return false
  // Une dimension sans aucun tag n'est jamais parcourue : rien à régler.
  if (Object.keys(tagg.tags_dict || {}).length < 1) return false
  return is_data_group(tagg)
}

/**
 * os#1366 — Ce que « déclarer une référence » veut dire, lu sur la zone de dessin.
 *
 * Typé STRUCTURELLEMENT (et non par `Class_DrawingArea`) : la décision reste une fonction
 * pure, testable sans monter un diagramme ni un rendu.
 */
export type Type_PositionReferenceDeclaration = {
  /** `prop_reference_datatag` du fichier (cf. NodePositioningReference). */
  prop_reference_datatag_ids?: string[] | null
  /** `scale_reference_by_viewtag` du fichier (cf. DrawingArea). */
  scale_reference_by_viewtag?: { [view_tag_id: string]: unknown } | null
}

/**
 * os#1366 — Vrai si le diagramme est CONFIGURÉ pour les modes proportionnel / échelle
 * adaptée : il désigne un élément de référence au datatag (`prop_reference_datatag`) ou un
 * flux de référence d'épaisseur par view tag (`scale_reference_by_viewtag`).
 *
 * C'est la seule chose qui distingue un sélecteur utile d'un piège : sur un diagramme sans
 * référence, les trois modes ne se distinguent pas à la lecture.
 */
export const diagramDeclaresPositionReference = (
  declaration: Type_PositionReferenceDeclaration
): boolean => {
  const prop_ids = declaration.prop_reference_datatag_ids
  if (prop_ids && prop_ids.length > 0) return true
  return Object.keys(declaration.scale_reference_by_viewtag ?? {}).length > 0
}

/** Ce que le gate a besoin de savoir des options de publication. */
export type Type_PositionModePublishGate = {
  /** Option historique #370 : expose le sélecteur sur TOUTES les dimensions en publish. */
  toolbar: boolean
  /** os#1366 : autorise l'apparition automatique quand une référence est déclarée. */
  position_mode_selector: boolean
}

/**
 * os#1366 — Gate unique des trois hôtes du sélecteur (ligne du panneau Filtres, sélecteur
 * de la barre du haut, frise de séquence), en ÉDITION comme en LECTURE.
 *
 * - Éditeur : inchangé, toujours proposé (l'auteur règle le mode de chaque dimension).
 * - Publication : `toolbar` reste l'opt-in EXPLICITE de l'auteur (toutes les dimensions,
 *   référence ou non) — les pages déjà publiées avec cette option gardent donc exactement
 *   leur barre. À défaut, le sélecteur apparaît de lui-même si le diagramme DÉCLARE une
 *   référence, et l'auteur peut couper cet automatisme par `position_mode_selector: false`.
 *
 * Un diagramme publié sans référence n'affiche rien : un sélecteur inerte serait un piège.
 */
export const positionModeSelectorEnabled = (
  is_static: boolean,
  publish: Type_PositionModePublishGate,
  declaration: Type_PositionReferenceDeclaration
): boolean => {
  if (!is_static) return true
  if (publish.toolbar) return true
  return publish.position_mode_selector && diagramDeclaresPositionReference(declaration)
}

/** Ce que le gate a besoin de savoir de l'application (typage structurel, cf. ci-dessus). */
export type Type_PositionModeHostApp = {
  is_static: boolean
  publish_options: Type_PositionModePublishGate
  drawing_area: {
    scale_reference_by_viewtag: { [view_tag_id: string]: unknown }
    nodePositioning: { proportionalReferenceDatatagIds: string[] | undefined }
  }
}

/**
 * os#1366 — Même décision, lue directement sur l'application : les trois hôtes appelaient
 * chacun `!is_static || publish_options.toolbar`, une règle recopiée trois fois qui ne
 * pouvait qu'évoluer de travers.
 */
export const positionModeSelectorEnabledFor = (app: Type_PositionModeHostApp): boolean =>
  positionModeSelectorEnabled(app.is_static, app.publish_options, {
    prop_reference_datatag_ids: app.drawing_area.nodePositioning.proportionalReferenceDatatagIds,
    scale_reference_by_viewtag: app.drawing_area.scale_reference_by_viewtag,
  })

/**
 * #370 — Choisit le mode d'affichage (absolu / proportionnel / échelle adaptée) D'UNE
 * DIMENSION, et l'applique aussitôt au dessin pour que le choix se voie.
 *
 * Le mode dit comment le diagramme doit réagir au défilement de CETTE dimension : il vit
 * donc sur elle (`Class_DataTagGroup.position_mode`) et non plus sur le diagramme. Le moteur
 * de dessin, lui, n'a qu'un mode courant : c'est la dimension que l'on manipule qui le lui
 * impose (cf. `applyPositionModeToDrawing`). `force` : ce clic est un choix explicite, il
 * l'emporte donc même sur un mode hérité `parametric`.
 *
 * os#1366 — Côté LECTEUR le geste ne persiste RIEN : il pose le mode en mémoire et redessine.
 * Aucun marqueur d'enregistrement (`ref_to_save_in_cache_indicator`) n'est levé, et une page
 * publiée n'a de toute façon aucun chemin d'écriture vers le fichier servi.
 *
 * Vit ici, et non dans `PositionModeMenu.tsx`, pour rester TESTABLE : aucune suite jest du
 * dépôt ne peut charger `@chakra-ui/react`. Le composant n'importe donc que ce geste-ci.
 * Les classes ne sont prises qu'en `import type` — ce module reste une feuille sans arête
 * runtime.
 */
export const applyPositionMode = (
  app_data: Class_ApplicationData,
  tagg: Class_DataTagGroup,
  m: Type_PositionMode
) => {
  tagg.position_mode = m
  tagg.applyPositionModeToDrawing(true)
  // Rafraîchit les hôtes du sélecteur (icône du déclencheur + coche du menu), cf. MenuConfig.
  // #367 — `updateAllComponentsRelatedToDataTags` ne touche QUE la section 'data' (morte)
  // et la topbar ; l'hôte du panneau est la section « Flux et dimensions », dont l'updater
  // est `ref_to_nodetag_filter_updater` (cf. TAG_FILTER_CONFIGS.flux) — d'où le second
  // appel, sans lequel le bouton reste figé sur l'icône du mode précédent.
  app_data.menu_configuration.updateAllComponentsRelatedToDataTags()
  app_data.menu_configuration.updateAllComponentsRelatedToFluxTags()
}
