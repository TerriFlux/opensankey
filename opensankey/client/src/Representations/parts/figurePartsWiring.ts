// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1475 — BRANCHER LES PARTS D'UNE FIGURE : une fois, pour toutes les natures.
//
// Julien : « je veux pouvoir te dire *je veux un nouveau graphe avec ces caractéristiques* et que
// tu l'implémentes de A à Z avec le mécanisme générique ». Deuxième des quatre choses qui étaient
// écrites deux fois et l'en empêchaient (cf. `notes/figures/figures-etat-et-cap.md`).
//
// ── LES CINQ GESTES, ET POURQUOI ILS VONT ENSEMBLE ───────────────────────────────────────────
//
// Une figure qui veut des parts réglables les fait tous les cinq, dans cet ordre, et en oublier un
// ne casse rien tout de suite — c'est ce qui rend la recopie dangereuse :
//
//  1. CONSTRUIRE les parts, en reprenant celles du dessin précédent (`figurePartsFor`). Oublier la
//     reprise perd les réglages de l'auteur au premier redessin, et le redessin arrive au geste
//     suivant.
//  2. DÉCLARER leur document à la vignette : c'est lui qui devient l'ACTIF, et c'est par là que
//     l'inspecteur montre Forme / Libellé / Valeur au lieu des réglages de la figure.
//  3. SÉLECTIONNER au clic, en purgeant d'abord — une figure se lit une part à la fois.
//  4. DIRE QUE LE DERNIER GESTE VISAIT LA SÉLECTION, sans quoi l'inspecteur continue de parler de
//     la figure (cf. le commentaire de `on_part_select`, c'est un défaut vécu).
//  5. LIBÉRER au démontage, et pas n'importe comment : hors fenêtre le jeu est jetable, dans une
//     vignette il se garde exprès.
//
// Les deux copies d'avant étaient déjà d'accord sur les cinq — au mot près pour le geste 4, dont
// le commentaire de vingt-cinq lignes était recopié à l'identique. Ce n'est pas une preuve qu'elles
// resteraient d'accord : le chantier a montré trois fois le contraire (le catalogue d'icônes, les
// règles du document de parts, les deux lecteurs d'aspect). Une copie ne diverge pas le jour où on
// l'écrit ; elle diverge le jour où on enrichit l'autre.

import type { Class_ApplicationData } from '../../types/ApplicationData'
import type { Class_PartElement } from './PartElement'
import type { Type_PartInput } from './buildParts'
import { figurePartsFor } from './figurePartsRegistry'
import { partAspectResolver } from '../../Charts/partAspect'
import { autoBarLabelAngle } from '../../Charts/NodeStatsCharts'
import { partStyleFigureNature } from '../../Elements/figureNatureDefaults'
import type {
  Type_FigurePart, Type_FigurePartAspect, Type_FigurePartContext
} from '../../Charts/partAspect'
import type { Type_FigureChartStyle } from '../../Charts/figureChartStyle'
import { readFigureLabelPositions } from '../../Charts/figureChartStyle'
import type { Type_JSON } from '../../types/Utils'

/**
 * Ce que le câblage demande au contexte de dessin.
 *
 * STRUCTUREL et non nominal : le sunburst a son propre type de contexte, les natures d'analyse en
 * ont un autre, et les deux portent déjà ces quatre champs. Les nommer ici plutôt qu'importer l'un
 * des deux évite de faire dépendre les figures d'une nature particulière.
 */
export interface Type_PartsWiringContext {
  app_data: Class_ApplicationData
  options?: { [key: string]: unknown }
  /** Absents : la figure n'est dans aucune vignette (pop-up de présentation, aperçu). */
  window_id?: string
  pane_key?: string
}

/** Ce que le câblage rend au tracé. Chaque nature prend ce dont elle a besoin. */
export interface Type_PartsWiring {
  /** Les parts par identifiant — ce que lit un tracé qui résout l'aspect lui-même. */
  by_id: { [part_id: string]: Class_PartElement }
  /** L'aspect résolu part par part — ce que lit un tracé qui préfère le recevoir monté. */
  part_aspect: (part_id: string) => Type_FigurePartAspect
  /** Les étiquettes déposées à la main, et où écrire un déplacement. */
  label_positions: { [id: string]: { x: number, y: number } }
  on_label_move?: (id: string, position: { x: number, y: number }) => void
  /** Ce que le tracé appelle quand on touche une part. */
  on_part_select: (part_id: string) => void
  /** À appeler au démontage du tracé. */
  release: () => void
}

/**
 * Branche les parts d'une figure : les construit, déclare leur document, rend de quoi les lire et
 * les sélectionner, et dit comment libérer.
 *
 * @param ctx le contexte de dessin de la nature.
 * @param inputs les parts, dans l'ordre du tracé.
 * @param nature la sorte de figure — elle décide du second étage de styles (os#1462).
 * @param base la mise en forme de la figure, sur laquelle l'aspect d'une part se pose.
 * @param context ce que la part ne peut pas savoir seule : le format de la figure, son registre
 *   d'unités (cf. `partAspect`).
 */
export const figurePartsWiring = (
  ctx: Type_PartsWiringContext,
  inputs: Type_PartInput[],
  nature: string,
  base: Type_FigureChartStyle,
  context: Type_FigurePartContext = {}
): Type_PartsWiring => {
  const app_data = ctx.app_data
  const { window_id, pane_key } = ctx
  const in_pane = window_id !== undefined && pane_key !== undefined

  // (1) LES PARTS, ET QUI LES GARDE. Le dépôt par (fenêtre, vignette) est ce qui fait qu'un réglage
  // posé sur une part survit au redessin que provoque le geste suivant.
  const figure_parts = figurePartsFor(window_id, pane_key, app_data, inputs, nature)

  // ── os#1503 — CE QUE LA FIGURE ÉCRIT À LA PLACE DE SA VALEUR, STAMPÉ SUR CHAQUE PART ─────────
  //
  // Julien, capture à l'appui : le sélecteur d'unité d'une part affichait « Valeur » pendant que
  // la couronne dessinait des pourcentages.
  //
  // `value_label_part_unit` (os#1490) est une clé d'ÉLÉMENT : la figure ne la déclare pas, donc le
  // défaut de nature — celui qui a réparé le reste du panneau (os#1502) — n'a rien à en dire, et
  // l'inspecteur retombait sur la valeur d'usine d'un nœud, « Valeur ».
  //
  // Or ce que la figure fait est connu : c'est `value_label_percent`, RÉSOLU (réglage de la
  // figure, sinon défaut de sa nature). On le pose sur la part, comme `figure_nature` l'est depuis
  // os#1483 — même procédé, même raison : une part doit pouvoir répondre sur ce que fait sa figure
  // sans avoir à la connaître.
  // ── 24/09/2026 — ET L'ANGLE QUE LE TRACÉ VA DONNER AUX ÉTIQUETTES, POUR LA MÊME RAISON ───────
  //
  // Julien : « au début le texte est en diagonal alors que les angles sont mis à 0 ; si on édite ça
  // marche, mais au début ça ne correspond pas. »
  //
  // `autoBarLabelAngle` est le REPLI du tracé quand la part ne dit rien (os#1505) — pas un réglage,
  // et surtout pas une constante : il dépend du nombre de barres et de la longueur des libellés.
  // Aucune déclaration de nature ne peut donc le porter. On le calcule ici, sur la liste MÊME que
  // le tracé va recevoir (`draw(container, parts, …)`), et on le stampe.
  //
  // LES AUTRES NATURES N'EN ONT PAS : un secteur de couronne n'a pas d'abscisse à désencombrer, et
  // la clé lui est d'ailleurs hors de portée (`NOT_ON_A_PART_FIGURE_ROUND`). `undefined` laisse
  // alors le panneau sur ce qu'il rendait — c'est-à-dire zéro, qui est bien ce qui est dessiné.
  const auto_label_angle = nature === 'bars' ? autoBarLabelAngle(inputs) : undefined
  Object.values(figure_parts.by_id).forEach(part => {
    const rec = part as unknown as { [k: string]: unknown }
    rec['figure_value_percent'] = base.value_label_percent
    rec['figure_name_label_angle'] = auto_label_angle
  })
  // LE STYLE DE LA NATURE AUSSI : c'est l'autre panneau qui montre le même dessin — « régler toutes
  // les parts d'un coup » doit partir de ce que les parts font, sinon le premier geste déplace
  // quelque chose qu'on croyait à zéro (cf. `figureStyleDefault`).
  // LES DEUX ÉTAGES, et c'est sans ambiguïté ici : un document de parts ne porte qu'UNE figure,
  // donc ses styles — le générique comme celui de sa nature — ne servent qu'elle. C'est au
  // CATALOGUE que le générique sert trois natures, pas dans cette instance.
  //
  // ⚠️ Ce sont des propriétés propres, jamais des attributs : `StylePersistence.toJSON` n'itère que
  // le sac d'attributs, rien de ceci ne part donc en fichier.
  Object.values(figure_parts.document.drawing_area.sankey.styles_dict).forEach(style => {
    if (partStyleFigureNature(style) === null) return
    const rec = style as unknown as { [k: string]: unknown }
    rec['figure_value_percent'] = base.value_label_percent
    rec['figure_name_label_angle'] = auto_label_angle
  })

  // (2) LA FIGURE EST UN DOCUMENT, ET C'EST CE QUI OUVRE L'INSPECTEUR D'ÉLÉMENT.
  //
  // Lier la vignette à son document de parts en fait l'ACTIF dès qu'on touche la fenêtre
  // (`bindWindowDocument`, os#1422 lot 6 : c'est exactement ce que fait l'étoile). L'inspecteur
  // suit alors la sélection de CE document — donc, quand une part est sélectionnée, il montre sa
  // forme, son libellé et sa valeur, sans une ligne d'interface nouvelle. Et quand rien n'est
  // sélectionné, il retombe sur les réglages de la figure : Graphe, Titre, Légende, Styles.
  //
  // C'est la demande de Julien telle qu'elle a été posée : « figure = graphe, et les trois autres
  // parties dans forme / libellé / valeur de l'élément sélectionné ».
  if (in_pane) {
    app_data.workspace.bindWindowDocument(
      window_id as string, pane_key as string, figure_parts.document
    )
  }

  // LES ÉTIQUETTES SORTIES, DÉPOSÉES À LA MAIN. La position s'écrit sur LA FIGURE de la vignette.
  // Hors fenêtre — la pop-up de présentation —, il n'y a personne à qui l'écrire et le geste reste
  // à l'écran : c'est le comportement voulu, une pop-up ne modifiant rien.
  const label_positions = readFigureLabelPositions(ctx.options?.['label_positions'])
  const on_label_move = in_pane
    ? (id: string, position: { x: number, y: number }) => {
      const positions = {
        ...readFigureLabelPositions(ctx.options?.['label_positions']), [id]: position
      }
      app_data.menu_configuration.setMainZonePaneOptions(
        window_id as string, pane_key as string,
        { ...ctx.options, label_positions: positions } as Type_JSON
      )
    }
    : undefined

  return {
    by_id: figure_parts.by_id,
    part_aspect: partAspectResolver(
      base, figure_parts.by_id as unknown as { [id: string]: Type_FigurePart }, context
    ),
    label_positions,
    on_label_move,

    // (3) et (4) — TOUCHER UNE PART LA SÉLECTIONNE, ET L'INSPECTEUR LE SAIT.
    on_part_select: (part_id: string) => {
      const part = figure_parts.by_id[part_id]
      if (!part) return
      // Une figure se lit une part à la fois : on purge, sinon l'inspecteur montrerait une
      // sélection multiple que le geste n'a jamais demandée.
      const area = figure_parts.document.drawing_area
      area.purgeSelection()
      area.addElementToSelection(part)
      // os#1455 — ET ON DIT QUE LE DERNIER GESTE VISAIT LA SÉLECTION.
      //
      // Sans cette ligne, sélectionner une part ne se voyait PAS, et Julien l'a constaté à
      // l'écran : « quand je sélectionne une part je m'attends à avoir des attributs à configurer
      // pour cette part, comme quand je sélectionne un nœud ; c'est pas le cas ? ».
      //
      // La part était bien sélectionnée — mais toucher une vignette pose `_inspector_focus` sur
      // « representation » (`setMainZoneActivePane`, au pointerdown), et la résolution de cible
      // rend `representation` AVANT de regarder la sélection : c'est la règle de la récence du
      // geste (os#1394), et elle était juste tant que rien, DANS une figure, ne se sélectionnait.
      //
      // Cliquer une part est précisément le contraire d'un geste qui parle de la figure : c'est
      // choisir l'élément qu'on veut régler. On remet donc le focus sur la sélection, par le
      // chemin nommé qu'os#1431 a ouvert.
      app_data.menu_configuration.inspector_focus_is_representation = false
      app_data.menu_configuration.updateInspector()
    },

    // (5) LIBÉRER, ET PAS N'IMPORTE COMMENT.
    release: () => {
      if (in_pane) {
        // La vignette ne montre plus ce document : l'actif doit repartir sur la voie ordinaire
        // (la feuille que la fenêtre regarde), sinon l'inspecteur continuerait de parler d'une
        // figure démontée.
        app_data.workspace.unbindWindowDocument(window_id as string, pane_key as string)
      } else {
        // HORS FENÊTRE SEULEMENT. Un jeu de parts sans (fenêtre, vignette) est jetable et personne
        // n'en garde la trace : c'est ici qu'il cesse de vivre. Dans une vignette, au contraire,
        // le dépôt le garde exprès — un démontage est le plus souvent un simple redessin, et
        // libérer ici perdrait à chaque geste les réglages que l'auteur vient de poser. C'est la
        // fermeture de la vignette qui libère (`forgetFigureParts`).
        figure_parts.document.dispose()
      }
    }
  }
}
