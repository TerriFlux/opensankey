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
import { applyDimensionCut, applyMemberBands, swapDimensionDrawings } from '../components/ui/dimensionDrawingHost'
import {
  candidatsAuNiveau, coupeChoisirNiveau, coupeEffacerZoom, coupeZoomer, listeDuZoom, lireCoupe, type Type_CoupeEnTableau
} from '../Algorithms/DimensionTableCut'
import {
  buildFigureNavigationTable, levelShortName, type Type_FigureNavControl, type Type_FigureNavDimension
} from './figureNavigationTable'

export interface Type_DiagramNavigationOptions {
  /** Où le repli du tableau se souvient (barre du haut, panneau…). */
  memory_key: string
  /** Le sélecteur Arbre d'une dimension, ouvert par le ▾ de son nom (fourni par l'éditeur). */
  members?: (dim: Class_DataTagGroup) => ((close: () => void) => ReactNode) | null
  /** os#1526 — l'élément de l'hôte posé devant le nom d'une dimension (son menu), cf. `leading`. */
  leading?: (dim: Class_DataTagGroup) => HTMLElement | undefined
  /**
   * os#1511 (Julien, 10/10) — EN COLONNE, en haut de la légende : les commandes s'empilent, et une
   * dimension PLATE à choix unique (Unité) y a sa liste.
   */
  vertical?: boolean
}

/**
 * os#1526 — LES DIMENSIONS DU TABLEAU DE LA FENÊTRE SANKEY : celles à niveaux, comme la couronne.
 * Julien, 05/10/2026 : « je veux la même interface que pour les couronnes : disparition des
 * sélecteurs dans la barre du haut, et il faut que ce soit dans la zone de dessin ». C'est la seule
 * règle : la bande les montre, la barre du haut et Coordonnées les retirent. Rien en mode EMBARQUÉ,
 * dont le conteneur appartient à la page hôte : il garde ses sélecteurs.
 */
export const diagramNavigationDimensions = (
  app_data: Class_ApplicationData, options: { with_flat?: boolean } = {}
): Class_DataTagGroup[] => {
  if (app_data.publish_options.embedded) return []
  // Dans l'ORDRE des dimensions (`getTagGroupsAsList`), que ⇅ fait suivre au dessin.
  // os#1511 (10/10) — en colonne, aussi les dimensions PLATES à choix unique (Unité) : leur liste y
  // vit, la frise garde les séquences.
  return (app_data.drawing_area.sankey.getTagGroupsAsList('data_taggs') as unknown as Class_DataTagGroup[])
    .filter(dim => dim.tags_list.length > 1 &&
      (dim.is_hierarchical || (options.with_flat === true && isFlatSingleChoice(dim))))
}

/** Une dimension plate à choix unique, hors frise (la séquence a sa barre). */
const isFlatSingleChoice = (dim: Class_DataTagGroup): boolean =>
  !dim.is_hierarchical && dim.banner === 'one' && dim.drawing !== 'nodes'

/** os#1511 — LA LISTE d'une dimension plate à choix unique, en colonne. */
const flatChoiceControl = (app_data: Class_ApplicationData, dim: Class_DataTagGroup): Type_FigureNavControl => {
  const chosen = (dim.selected_tags_list as Class_DataTag[])[0]
  return {
    kind: 'level',
    label: dim.reader_control?.label ?? dim.name,
    options: (dim.tags_list as Class_DataTag[]).map(m => ({ value: m.id, label: levelShortName(m.display_name) })),
    value: chosen?.id ?? '',
    set: (id: string) => app_data.runHeavyGesture(() => applyDimensionCut(app_data, dim, [id], { multi: false, focus: [] }))
  }
}

/**
 * 07/10/2026 — LA PORTÉE QUE DIT LE TABLEAU (zoom partagé avec les fenêtres liées) : le zoom le plus
 * fin AU-DESSUS de la colonne (« Blé, Maïs » : Céréales). Un zoom au niveau de la colonne restreint
 * les membres montrés, ce n'est pas une portée ; une coupe mixte n'en a pas.
 */
export const focusOfCoupe = (coupe: Type_CoupeEnTableau): string[] => {
  if (coupe.mixte || coupe.colonnes.length !== 1) return []
  const above = [...coupe.zooms.keys()].filter(k => k < coupe.colonnes[0])
  if (above.length === 0) return []
  return (coupe.zooms.get(Math.max(...above)) ?? []).map(m => m.id)
}

/**
 * ✕ D'UN ZOOM. Quand ce zoom est la PORTÉE du diagramme (posée par une fenêtre liée, « Céréales »),
 * on en sort comme la couronne en sort : la portée redevient une part, au niveau qu'elle occupait
 * (« Céréales » parmi les filières) — tout revient. Sinon, le ✕ du tableau : ce zoom tombe, la
 * colonne reste.
 */
const sortirDuZoom = (dim: Class_DataTagGroup, coupe: Type_CoupeEnTableau, depth: number, zoom: Class_DataTag[]): string[] => {
  const focus = dim.focus_ids
  const is_focus = focus.length === zoom.length && zoom.every(m => focus.includes(m.id))
  if (!is_focus) return coupeEffacerZoom(dim, coupe, depth)
  const above = new Map([...coupe.zooms.entries()].filter(([k]) => k < depth))
  return candidatsAuNiveau(dim, depth, above).map(m => m.id)
}

/**
 * Pose une sélection sur le diagramme : le geste annulable, sous le voile des gestes lourds. La
 * portée du diagramme suit le zoom que le tableau montre (✕ : elle tombe), dans le même pas.
 */
const poser = (app_data: Class_ApplicationData, dim: Class_DataTagGroup, ids: string[]) => {
  if (ids.length === 0) return
  const members = ids.map(id => dim.tags_dict[id] as Class_DataTag | undefined).filter((m): m is Class_DataTag => m !== undefined)
  const focus = focusOfCoupe(lireCoupe(dim, members))
  // Plusieurs membres sur une dimension à choix unique : elle passe en choix multiple, dans le même
  // pas d'historique (comme la couronne liée) — sinon le cube n'adresserait plus rien.
  app_data.runHeavyGesture(() => applyDimensionCut(app_data, dim, ids, { multi: ids.length > 1, focus }))
}

/** Le membre du premier niveau dont `m` descend (lui-même s'il en est un). */
const racineDe = (m: Class_DataTag): Class_DataTag => {
  let r = m
  while (r.parent !== undefined) r = r.parent
  return r
}

/** Une autre dimension SUPERPOSE plusieurs membres en bandes sur les flux (pas un diagramme par membre). */
const autreEnBandes = (app_data: Class_ApplicationData, dim: Class_DataTagGroup): Class_DataTagGroup | undefined =>
  (app_data.drawing_area.sankey.data_taggs_list as Class_DataTagGroup[]).find(other =>
    other !== dim && other.member_bands !== true && other.drawing === 'multi' && other.selected_tags_list.length > 1)

/**
 * os#1511 (Jean-Yves, 09/10) — LA COMMANDE DU LECTEUR d'une dimension, résolue sur l'état du
 * diagramme. Chaque geste passe par les gestes annulables du diagramme (`applyDimensionCut`,
 * `applyMemberBands`), sous le voile des gestes lourds.
 */
const readerControlOf = (app_data: Class_ApplicationData, dim: Class_DataTagGroup): Type_FigureNavControl | undefined => {
  const control = dim.reader_control
  if (control === undefined) return undefined
  // Une traduction absente (i18n pas encore chargée) rend `null` : repli sur le français.
  const t = (key: string, o: { [k: string]: unknown }, repli: string) => (app_data.t(key, o) as string | null) || repli
  const label = control.label ?? dim.name
  const nom = (m: Class_DataTag) => levelShortName(m.display_name)
  const selection = dim.selected_tags_list as Class_DataTag[]
  const couper = (ids: string[], multi: boolean) =>
    applyDimensionCut(app_data, dim, ids, { multi, focus: [] })
  // Les cases « Distinguer… » des autres dimensions se décochent quand celle-ci superpose plusieurs
  // membres en bandes : deux dimensions en bandes, on ne verrait plus rien (règle de Jean-Yves).
  const decocherLesCases = () => (app_data.drawing_area.sankey.data_taggs_list as Class_DataTagGroup[])
    .filter(other => other !== dim && other.reader_control?.kind === 'toggle' && other.current_level_index > 0)
    .forEach(other => {
      const racines = other.membersAtLevel(0)
      if (racines.length > 0) applyDimensionCut(app_data, other, racines.map(m => m.id), { multi: racines.length > 1, focus: [] })
    })
  if (control.kind === 'toggle') {
    const bandes = autreEnBandes(app_data, dim)
    return {
      kind: 'toggle',
      label,
      checked: dim.current_level_index > 0,
      frozen: bandes === undefined ? undefined : t('Banner.reader_toggle_frozen', {
        name: bandes.name, defaultValue: 'Indisponible : plusieurs membres de « {{name}} » sont superposés'
      }, `Indisponible : plusieurs membres de « ${bandes.name} » sont superposés`),
      set: (on: boolean) => {
        const membres = dim.membersAtLevel(on ? 1 : 0)
        if (membres.length === 0) return
        app_data.runHeavyGesture(() => couper(membres.map(m => m.id), membres.length > 1))
      }
    }
  }
  if (control.kind === 'level') {
    const coupe = lireCoupe(dim, selection)
    const options = (dim.levels as string[]).map((raw, depth) => ({ value: String(depth), label: levelShortName(raw) }))
      .filter((_o, depth) => depth >= coupe.entree)
    return {
      kind: 'level',
      label,
      options,
      value: String(coupe.colonnes.length === 1 ? coupe.colonnes[0] : dim.current_level_index),
      set: (value: string) => {
        const membres = dim.membersAtLevel(Number(value))
        if (membres.length === 0) return
        app_data.runHeavyGesture(() => couper(membres.map(m => m.id), membres.length > 1))
      }
    }
  }
  // `pick` : les membres du premier niveau.
  const racines = dim.membersAtLevel(0)
  const choisies = [...new Set(selection.map(m => racineDe(m).id))]
  const multi = dim.draws_member_bands
  const racine = !multi && choisies.length === 1 ? dim.tags_dict[choisies[0]] as Class_DataTag | undefined : undefined
  const enfants = racine ? dim.childrenOf(racine) : []
  const enfants_choisis = enfants.filter(e => selection.includes(e))
  const toutes = t('Banner.reader_all', { defaultValue: 'Toutes' }, 'Toutes')
  const sub = racine === undefined || enfants.length === 0 ? undefined : {
    label: levelShortName((dim.levels as string[])[1] ?? ''),
    summary: enfants_choisis.length === 0 ? toutes : enfants_choisis.map(nom).join(', '),
    pick: {
      members: enfants,
      // « Toutes » : le membre parent est choisi, toutes les cases sont cochées.
      chosen: enfants_choisis.length === 0 ? enfants.map(e => e.id) : enfants_choisis.map(e => e.id),
      apply: (ids: string[]) => app_data.runHeavyGesture(() => {
        if (ids.length === 0 || ids.length === enfants.length) {
          couper([racine.id], false)
          return
        }
        couper(ids, ids.length > 1)
        if (ids.length > 1) decocherLesCases()
      })
    }
  }
  return {
    kind: 'pick',
    label,
    options: racines.map(m => ({ value: m.id, label: nom(m) })),
    chosen: choisies,
    multi,
    multi_label: control.multi_label ?? t('Banner.reader_several', { defaultValue: 'Sélectionner plusieurs' }, 'Sélectionner plusieurs'),
    set_multi: (on: boolean) => app_data.runHeavyGesture(() => {
      if (on) {
        couper(choisies, choisies.length > 1)
        applyMemberBands(app_data, dim, true)
      } else {
        applyMemberBands(app_data, dim, false)
        if (choisies.length > 0) couper([choisies[0]], false)
      }
    }),
    choose: (value: string) => app_data.runHeavyGesture(() => couper([value], false)),
    pick: multi ? {
      members: racines,
      chosen: choisies,
      apply: (ids: string[]) => { if (ids.length > 0) app_data.runHeavyGesture(() => couper(ids, ids.length > 1)) }
    } : undefined,
    sub
  }
}

/** Le tableau des dimensions `dims` du diagramme. */
export const buildDiagramNavigationTable = (
  app_data: Class_ApplicationData, dims: Class_DataTagGroup[], options: Type_DiagramNavigationOptions
): HTMLElement => {
  const t = app_data.t
  const dimensions: Type_FigureNavDimension[] = dims.map(dim => {
    const control = readerControlOf(app_data, dim) ??
      (options.vertical === true && isFlatSingleChoice(dim) ? flatChoiceControl(app_data, dim) : undefined)
    if (control !== undefined) return { id: dim.id, name: dim.name, levels: [], control }
    const coupe = lireCoupe(dim, dim.selected_tags_list as Class_DataTag[])
    const levels = (dim.levels as string[]).map((raw, depth) => ({ raw, depth })).filter(l => l.depth >= coupe.entree)
    return {
      id: dim.id,
      name: dim.name,
      summary: coupe.mixte ? t('Banner.cut_custom') as string : undefined,
      members: options.members?.(dim) ?? undefined,
      leading: options.leading?.(dim),
      levels: levels.map(({ raw, depth }) => {
        const zoom = coupe.zooms.get(depth)
        const liste = listeDuZoom(dim, coupe, depth)
        return {
          label: levelShortName(raw),
          active: coupe.colonnes.includes(depth),
          column: !coupe.mixte && coupe.colonnes[0] === depth,
          zooms: zoom === undefined ? undefined : zoom.map(m => levelShortName(m.display_name)),
          clear: zoom === undefined ? undefined : () => poser(app_data, dim, sortirDuZoom(dim, coupe, depth, zoom)),
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
  // ⇅ (▲▼ au-delà de deux) : la dimension échange son DESSIN avec sa voisine — bandes ↔ nœuds —
  // l'équivalent, sur le diagramme, de l'ordre des anneaux d'une couronne.
  const move = (dim_id: string, delta: -1 | 1) => {
    const i = dims.findIndex(d => d.id === dim_id)
    const other = dims[i + delta]
    if (i < 0 || other === undefined) return
    app_data.runHeavyGesture(() => swapDimensionDrawings(app_data, dims[i], other))
  }
  return buildFigureNavigationTable({
    dimensions,
    move,
    vertical: options.vertical,
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
      swap: t('Banner.nav_swap_drawing', { defaultValue: 'Échanger le dessin des deux dimensions (bandes ↔ nœuds)' }) as string,
      move_up: t('Banner.nav_swap_drawing_up', { defaultValue: 'Échanger le dessin avec la dimension du dessus' }) as string,
      move_down: t('Banner.nav_swap_drawing_down', { defaultValue: 'Échanger le dessin avec la dimension du dessous' }) as string,
      settings: t('sunburst.nav.settings') as string,
      members: t('sunburst.nav.members', { defaultValue: 'Choisir les membres' }) as string
    }
  })
}
