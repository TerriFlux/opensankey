// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1526 — LE TABLEAU DE LA COURONNE, BRANCHÉ SUR LE DIAGRAMME. Julien, 05/10/2026 : « il faut aligner
// le comportement des sélecteurs de datatags avec level entre couronne et diagramme de Sankey ».
//
// Même constructeur (`buildFigureNavigationTable`), même lecture : une ligne par dimension, une
// colonne par niveau (clic = ce niveau entier ; reclic sur la colonne montrée = ne plus détailler),
// une case de zoom par niveau (liste à cases, ✕), le ▾ du nom pour l'arbre des membres. Ce que le
// tableau lit et écrit est ici la SÉLECTION DU DIAGRAMME, projetée en colonnes et zooms par
// `DimensionTableCut` ; chaque geste la repose par LE geste annulable du diagramme
// (`applyDimensionCut` : règle parent/enfant, nœuds d'axe redécoupés, dessin, menus, historique).

import type { ReactNode } from 'react'
import type { Class_ApplicationData } from '../types/ApplicationData'
import type { Class_DataTag } from '../types/Tag'
import type { Class_DataTagGroup } from '../types/TagGroup'
import { applyDimensionCut } from '../components/ui/dimensionDrawingHost'
import {
  coupeChoisirNiveau, coupeEffacerZoom, coupeZoomer, listeDuZoom, lireCoupe
} from '../Algorithms/DimensionTableCut'
import {
  buildFigureNavigationTable, levelShortName, type Type_FigureNavDimension
} from './figureNavigationTable'

export interface Type_DiagramNavigationOptions {
  /** Où le repli du tableau se souvient (barre du haut, panneau…). */
  memory_key: string
  /** Le sélecteur Arbre d'une dimension, ouvert par le ▾ de son nom (fourni par l'éditeur). */
  members?: (dim: Class_DataTagGroup) => ((close: () => void) => ReactNode) | null
}

/**
 * os#1526 — LES DIMENSIONS DU TABLEAU DE LA FENÊTRE SANKEY : celles à niveaux, comme la couronne.
 * Julien, 05/10/2026 : « je veux la même interface que pour les couronnes : disparition des
 * sélecteurs dans la barre du haut, et il faut que ce soit dans la zone de dessin ». C'est la seule
 * règle : la bande les montre, la barre du haut et Coordonnées les retirent. Rien en mode EMBARQUÉ,
 * dont le conteneur appartient à la page hôte : il garde ses sélecteurs.
 */
export const diagramNavigationDimensions = (app_data: Class_ApplicationData): Class_DataTagGroup[] => {
  if (app_data.publish_options.embedded) return []
  return (app_data.drawing_area.sankey.data_taggs_list as unknown as Class_DataTagGroup[])
    .filter(dim => dim.is_hierarchical && dim.tags_list.length > 1)
}

/** Pose une sélection sur le diagramme : le geste annulable, sous le voile des gestes lourds. */
const poser = (app_data: Class_ApplicationData, dim: Class_DataTagGroup, ids: string[]) => {
  if (ids.length === 0) return
  // Plusieurs membres sur une dimension à choix unique : elle passe en choix multiple, dans le même
  // pas d'historique (comme la couronne liée) — sinon le cube n'adresserait plus rien.
  app_data.runHeavyGesture(() => applyDimensionCut(app_data, dim, ids, { multi: ids.length > 1 }))
}

/** Le tableau des dimensions `dims` du diagramme. */
export const buildDiagramNavigationTable = (
  app_data: Class_ApplicationData, dims: Class_DataTagGroup[], options: Type_DiagramNavigationOptions
): HTMLElement => {
  const t = app_data.t
  const dimensions: Type_FigureNavDimension[] = dims.map(dim => {
    const coupe = lireCoupe(dim, dim.selected_tags_list as Class_DataTag[])
    const levels = (dim.levels as string[]).map((raw, depth) => ({ raw, depth })).filter(l => l.depth >= coupe.entree)
    return {
      id: dim.id,
      name: dim.name,
      summary: coupe.mixte ? t('Banner.cut_custom') as string : undefined,
      members: options.members?.(dim) ?? undefined,
      levels: levels.map(({ raw, depth }) => {
        const zoom = coupe.zooms.get(depth)
        const liste = listeDuZoom(dim, coupe, depth)
        return {
          label: levelShortName(raw),
          active: coupe.colonnes.includes(depth),
          column: !coupe.mixte && coupe.colonnes[0] === depth,
          zooms: zoom === undefined ? undefined : zoom.map(m => levelShortName(m.display_name)),
          clear: zoom === undefined ? undefined : () => poser(app_data, dim, coupeEffacerZoom(dim, coupe, depth)),
          pick: liste.membres.length === 0 ? undefined : {
            members: liste.membres,
            chosen: liste.coches,
            apply: (ids: string[]) => poser(app_data, dim, coupeZoomer(dim, coupe, depth, ids))
          },
          choose: () => poser(app_data, dim, coupeChoisirNiveau(dim, coupe, depth))
        }
      })
    }
  })
  return buildFigureNavigationTable({
    dimensions,
    memory_key: options.memory_key,
    t: (key: string, o?: { [k: string]: unknown }) => t(key, o),
    labels: {
      title: t('sunburst.nav.title') as string,
      dimension: (name: string) => t('sunburst.nav.dimension', { name }) as string,
      cut_by: (level: string) => t('Banner.nav_detail_by', { level, defaultValue: 'Détailler par {{level}}' }) as string,
      clear_zoom: t('sunburst.nav.clear_zoom') as string,
      pick_zoom: t('sunburst.nav.pick_zoom') as string,
      drawing: t('sunburst.nav.drawing') as string,
      uncut: (level: string) => t('Banner.nav_undetail', {
        level, defaultValue: 'Détaillé par {{level}} — recliquer pour ne plus détailler'
      }) as string,
      ctrl_hint: '',
      swap: t('sunburst.nav.swap') as string,
      move_up: t('sunburst.nav.move_up') as string,
      move_down: t('sunburst.nav.move_down') as string,
      settings: t('sunburst.nav.settings') as string,
      members: t('sunburst.nav.members', { defaultValue: 'Choisir les membres' }) as string
    }
  })
}
