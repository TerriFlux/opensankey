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
import {
  applyDimensionCut, applyReaderLevel, applyReaderPick, applyReaderSeveral, applyReaderSubDistinguish, applyReaderToggle,
  readerToggleBlocker, swapDimensionDrawings
} from '../components/ui/dimensionDrawingHost'
import { pluralGroupName } from '../Elements/titleTokens'
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

/**
 * os#1511 (11/10) — LES DIMENSIONS QUE LA NAVIGATION AFFICHE, la seule liste que lisent la colonne,
 * la bande et la barre du haut (qui les retire : une dimension n'est qu'à un endroit). En colonne
 * (légende posée dans son panneau, `legend.in_panel`), les dimensions à niveaux et les plates à choix
 * unique (Unité) ; en bande, les dimensions à niveaux seules.
 */
export const navigationShownDimensions = (
  app_data: Class_ApplicationData, in_column: boolean = app_data.drawing_area.legend.in_panel
): Class_DataTagGroup[] => diagramNavigationDimensions(app_data, { with_flat: in_column })

/**
 * Une dimension plate à choix unique, hors frise (la séquence a sa barre). sa#639 — la séquence est
 * devenue « un membre » + la case Lecture : une dimension qui se lit reste à la frise, comme avant.
 */
const isFlatSingleChoice = (dim: Class_DataTagGroup): boolean =>
  !dim.is_hierarchical && dim.banner === 'one' && dim.drawing !== 'nodes' && !dim.plays

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

/**
 * os#1511 (Jean-Yves, 09/10) — LA COMMANDE DU LECTEUR d'une dimension, résolue sur l'état du
 * diagramme. Ses règles (case gelée, cases décochées, « Sélectionner plusieurs ») sont des gestes
 * nommés de l'hôte (`applyReader*`, un pas d'historique chacun) ; ici, la lecture et le voile des
 * gestes lourds.
 */
const readerControlOf = (app_data: Class_ApplicationData, dim: Class_DataTagGroup): Type_FigureNavControl | undefined => {
  const control = dim.reader_control
  if (control === undefined) return undefined
  // Une traduction absente (i18n pas encore chargée) rend `null` : repli sur le français.
  // Une traduction absente rend `null` (i18n pas chargée) ou LA CLÉ ELLE-MÊME (clé inconnue, sans
  // `defaultValue`) : dans les deux cas, repli sur le français (« Banner.reader_distinguish » s'est
  // affiché en ligne le 11/10).
  const t = (key: string, o: { [k: string]: unknown }, repli: string) => {
    const s = app_data.t(key, o) as string | null
    return s && s !== key ? s : repli
  }
  const label = control.label ?? dim.name
  const nom = (m: Class_DataTag) => levelShortName(m.display_name)
  const selection = dim.selected_tags_list as Class_DataTag[]
  const heavy = (gesture: () => void) => app_data.runHeavyGesture(gesture)
  if (control.kind === 'toggle') {
    const bandes = readerToggleBlocker(app_data, dim)
    return {
      kind: 'toggle',
      label,
      checked: dim.current_level_index > 0,
      frozen: bandes === undefined ? undefined : t('Banner.reader_toggle_frozen', {
        name: bandes.name, defaultValue: 'Indisponible : plusieurs membres de « {{name}} » sont superposés'
      }, `Indisponible : plusieurs membres de « ${bandes.name} » sont superposés`),
      set: (on: boolean) => {
        if (dim.membersAtLevel(on ? 1 : 0).length > 0) heavy(() => applyReaderToggle(app_data, dim, on))
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
        const depth = Number(value)
        if (dim.membersAtLevel(depth).length > 0) heavy(() => applyReaderLevel(app_data, dim, depth))
      }
    }
  }
  // `pick` (Jean-Yves, 11/10) : la liste est un ARBRE (filière ou sous-filière, n'importe lequel) ;
  // « Sélectionner plusieurs » mélange les niveaux ; « Distinguer les sous-filières » remplace le choix
  // des sous-filières (bandes), et n'existe que pour UN membre choisi qui a des sous-membres.
  const arbre: Class_DataTag[] = []
  const descendre = (m: Class_DataTag) => { arbre.push(m); dim.childrenOf(m).forEach(descendre) }
  dim.membersAtLevel(0).forEach(descendre)
  const retrait = (m: Class_DataTag) => '   '.repeat(dim.depthOf(m))
  const multi = dim.draws_member_bands
  const ids = selection.map(m => m.id)
  // Le membre « distingué » : choisi seul, ou dont TOUS les sous-membres sont choisis (en bandes).
  const parent_commun = selection.length > 1 && selection.every(m => m.parent !== undefined && m.parent === selection[0].parent)
    ? selection[0].parent as Class_DataTag
    : undefined
  const distingue = !multi
    ? (parent_commun !== undefined && dim.childrenOf(parent_commun).length === selection.length
        ? parent_commun
        : selection.length === 1 ? selection[0] : undefined)
    : undefined
  const sous = distingue ? dim.childrenOf(distingue) : []
  const niveau_suivant = levelShortName((dim.levels as string[])[(distingue ? dim.depthOf(distingue) : 0) + 1] ?? '')
  const bloque = readerToggleBlocker(app_data, dim)
  const sub_toggle = distingue === undefined || sous.length < 2 ? undefined : {
    label: t('Banner.reader_distinguish', {
      name: pluralGroupName(niveau_suivant || 'sous-membre'), defaultValue: 'Distinguer les {{name}}'
    },
      `Distinguer les ${pluralGroupName(niveau_suivant || 'sous-membre')}`),
    checked: parent_commun === distingue,
    frozen: bloque === undefined ? undefined : t('Banner.reader_toggle_frozen', {
      name: bloque.name, defaultValue: 'Indisponible : plusieurs membres de « {{name}} » sont superposés'
    }, `Indisponible : plusieurs membres de « ${bloque.name} » sont superposés`),
    set: (on: boolean) => heavy(() => applyReaderSubDistinguish(app_data, dim, distingue, on))
  }
  return {
    kind: 'pick',
    label,
    options: arbre.map(m => ({ value: m.id, label: retrait(m) + nom(m) })),
    chosen: distingue ? [distingue.id] : ids,
    multi,
    multi_label: control.multi_label ?? t('Banner.reader_several', { defaultValue: 'Sélectionner plusieurs' }, 'Sélectionner plusieurs'),
    set_multi: (on: boolean) => heavy(() => applyReaderSeveral(app_data, dim, on)),
    choose: (value: string) => heavy(() => applyReaderPick(app_data, dim, [value])),
    pick: multi ? {
      members: arbre,
      chosen: ids,
      indentOf: (m: Class_DataTag) => dim.depthOf(m),
      apply: (picked: string[]) => { if (picked.length > 0) heavy(() => applyReaderPick(app_data, dim, picked)) }
    } : undefined,
    sub_toggle
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
