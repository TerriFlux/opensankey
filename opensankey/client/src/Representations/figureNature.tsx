// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// os#1479 — DÉCLARER UNE FIGURE À PARTS : ce qui lui est PROPRE, et rien d'autre.
//
// Julien : « ce que je veux ensuite, c'est qu'il soit possible de te dire *je veux ce nouveau
// graphe avec ces caractéristiques* et que tu l'implémentes de A à Z avec le mécanisme générique —
// les styles, les attributs, tout ça. »
//
// C'est le dernier pas du cap (`notes/figures/figures-etat-et-cap.md`), et il n'était possible
// qu'une fois les six autres faits : tant que le mécanisme existait en deux exemplaires, une
// fonction qui « fait le reste » aurait dû choisir un camp.
//
// ── CE QUE LA NATURE ÉCRIT ENCORE, ET POURQUOI C'EST IRRÉDUCTIBLE ────────────────────────────
//
// Trois choses, et elles sont exactement ce qui distingue un graphe d'un autre :
//
//   `parts` — ce qu'on décompose, dans l'ordre où le tracé le lit ;
//   `draw`  — le dessin lui-même ;
//   `own`   — les réglages qui n'ont de sens que chez elle (le trou du centre d'une couronne,
//             l'orientation radiale d'un disque, l'empilement d'un histogramme).
//
// ── CE QU'ELLE N'ÉCRIT PLUS ──────────────────────────────────────────────────────────────────
//
// Le SOCLE (os#1467, 42 clés) est servi d'office : une nature ne peut plus l'oublier, et ce n'est
// pas un test qui le rattrape après coup — il n'y a plus de chemin pour l'oublier.
//
// Le CÂBLAGE des parts (os#1475, les cinq gestes) est monté avant le tracé et libéré après : la
// nature reçoit les parts déjà construites, l'aspect déjà résolu, la sélection déjà branchée.
//
// Les DEUX ÉTAGES DE STYLE (os#1462) sont semés par le câblage, à partir du seul nom de la nature.
//
// Les GARDES viennent avec : ce module tient le registre des natures déclarées, et les tests le
// BALAIENT au lieu de porter une liste. Une nature de plus est couverte le jour où on l'écrit,
// sans qu'on touche à un test — c'est la partie qui se serait périmée en premier.
//
// ── CE QUI RESTE DEHORS, ET C'EST DIT PLUTÔT QUE FAIT À MOITIÉ ───────────────────────────────
//
// Le SUNBURST ne passe pas par cette porte. Son tracé ne lit pas `part_aspect` : il reçoit les
// parts et compose leur style lui-même (`sunburstPartStyle`), parce qu'un disque a son propre
// vocabulaire — orientation radiale, profondeur, niveaux de légende. Le convertir demanderait de
// réécrire son tracé, pas de le brancher. Il DÉCLARE en revanche sa nature ici, ce qui suffit à le
// faire couvrir par les gardes : c'est la moitié qui compte pour ne pas diverger.

import React from 'react'

import {
  representation_registry,
  type Type_RepresentationContext,
  type Type_RepresentationCleanup,
  type Type_RepresentationScale,
  type Type_RepresentationZoom
} from './RepresentationRegistry'
import type { Type_ElementTargetResolver } from './WindowTarget'
import type { Class_ApplicationData } from '../types/ApplicationData'
import type { Type_FigureAttributesConfig } from './Figure'
import { figureNatureAttributes, type Type_HonourSpec } from './figureAttribute'
import { figurePartsWiring, type Type_PartsWiring } from './parts/figurePartsWiring'
import type { Type_PartInput } from './parts/buildParts'
import type { Type_FigureChartStyle } from '../Charts/figureChartStyle'
import type { Type_FigurePartContext } from '../Charts/partAspect'

/**
 * Ce qu'une figure à parts déclare d'elle-même.
 *
 * Tout ce qui n'est pas ici est servi par `registerFigureNature` — c'est la définition même de ce
 * lot, et le seul moyen de vérifier qu'il tient sa promesse : ajouter un champ à cette interface
 * devrait toujours se justifier par « aucune autre nature ne peut répondre à ma place ».
 */
export interface Type_FigureNatureSpec {
  /** Id de la représentation, namespacé par couche (`os.repr.donut`). */
  id: string
  /**
   * LE NOM DE LA NATURE — `'donut'`, `'bars'`, `'sunburst'`.
   *
   * Distinct de l'id : c'est lui qui désigne le second étage de styles de part
   * (`figure_part_nature_styles`) et le jeu de parts au dépôt. Une nature sans style déclaré s'en
   * tient à l'étage générique, ce qui est légitime et permet d'en ajouter une à la fois.
   */
  nature: string
  scale?: Type_RepresentationScale
  order: number
  label: (app_data: Class_ApplicationData) => string
  icon?: React.ReactNode
  zoom?: Type_RepresentationZoom
  isAvailable?: (ctx: Type_RepresentationContext) => boolean
  resolveElementTarget?: Type_ElementTargetResolver
  /**
   * CE QUI N'A DE SENS QUE CHEZ ELLE, piqué au catalogue comme le socle (`honours`). Le trou du
   * centre d'une couronne, l'empilement d'un histogramme, l'orientation d'un disque.
   */
  own?: { [key: string]: Type_HonourSpec }
  /**
   * CE QU'ELLE CHANGE AU SOCLE : une valeur d'usine, une condition d'affichage. Jamais le libellé
   * ni le contrôle — le catalogue les tient, une fois pour toutes les natures.
   *
   * Une clé absente d'ici garde le réglage du catalogue ; une clé du socle nommée ici le
   * SURCHARGE, elle ne le remplace pas (la clé reste servie, donc le socle reste tenu).
   */
  socle?: { [key: string]: Type_HonourSpec }
  /** Des attributs DÉJÀ construits — ce que `honours` ne sait pas faire (une clé d'identité). */
  extra_attributes?: Type_FigureAttributesConfig
  /**
   * LES PARTS, dans l'ordre du tracé. `null` = rien à dessiner ici (pas d'analyse, sujet sans
   * décomposition) : la figure ne s'affiche pas, et c'est une réponse, pas une panne.
   */
  parts: (ctx: Type_RepresentationContext) => Type_PartInput[] | null
  /** La mise en forme de la figure, sur laquelle l'aspect d'une part se pose. */
  style: (ctx: Type_RepresentationContext) => Type_FigureChartStyle
  /** Ce que la part ne peut pas savoir seule : le format de la figure, son registre d'unités. */
  part_context?: (ctx: Type_RepresentationContext) => Type_FigurePartContext
  /**
   * LE DESSIN, et lui seul. Reçoit les parts telles qu'elle les a rendues, et le câblage déjà
   * monté : `part_aspect` pour lire une part, `on_part_select` à brancher sur le clic,
   * `label_positions` / `on_label_move` pour les étiquettes déposées.
   *
   * Ce qu'elle rend est appelé au démontage, AVANT la libération du câblage — comme un `useEffect`.
   */
  draw: (
    container: HTMLElement,
    parts: Type_PartInput[],
    wiring: Type_PartsWiring,
    ctx: Type_RepresentationContext
  ) => Type_RepresentationCleanup
}

/**
 * LE REGISTRE DES NATURES À PARTS, dans l'ordre où elles se déclarent.
 *
 * C'est ce que les gardes balaient (`figureCommonHonours.test`, `figureNature.test`) au lieu de
 * porter une liste écrite à la main. Une liste écrite à la main se périme au premier ajout, et
 * personne ne s'en aperçoit : le test passe, il ne teste simplement plus la nature nouvelle.
 */
const _natures: Type_FigureNatureSpec[] = []
export const figureNatures = (): readonly Type_FigureNatureSpec[] => _natures

/**
 * Déclare une figure à parts : le socle, les styles, le câblage, les gardes viennent avec.
 *
 * @param spec ce qui lui est propre (cf. `Type_FigureNatureSpec`).
 */
export const registerFigureNature = (spec: Type_FigureNatureSpec): void => {
  _natures.push(spec)
  representation_registry.register({
    id: spec.id,
    scale: spec.scale ?? 'element',
    order: spec.order,
    label: spec.label,
    icon: spec.icon,
    zoom: spec.zoom,
    isAvailable: spec.isAvailable,
    resolveElementTarget: spec.resolveElementTarget,
    attributes: figureNatureAttributes(spec),
    draw: (container, ctx) => {
      const parts = spec.parts(ctx)
      if (parts === null) return undefined
      // LES CINQ GESTES, MONTÉS AVANT LE TRACÉ (os#1475) : les parts sont construites en reprenant
      // celles du dessin précédent, leur document est déclaré à la vignette, le clic sélectionne,
      // et l'inspecteur sait que le geste visait la sélection.
      const wiring = figurePartsWiring(
        ctx, parts, spec.nature, spec.style(ctx), spec.part_context?.(ctx) ?? {}
      )
      const teardown = spec.draw(container, parts, wiring, ctx)
      return () => {
        // DANS CET ORDRE : le tracé se démonte pendant que ses parts existent encore — il peut
        // avoir à les lire pour se défaire (un écouteur, une mesure). Libérer d'abord lui
        // retirerait le sol sous les pieds.
        if (teardown) teardown()
        wiring.release()
      }
    }
  })
}
