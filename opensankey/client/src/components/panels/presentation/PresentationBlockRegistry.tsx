// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : TerriFlux
// ==================================================================================================

// OS#305 (Lot 1) — CATALOGUE des blocs d'affichage destinés au LECTEUR.
//
// Décision #3 de l'issue : on ne réutilise PAS les sections d'inspecteur en
// lecture seule. Celles-ci sont des ÉDITEURS (champs, sélecteurs d'unité,
// boutons de style) — sans objet pour quelqu'un qui lit un diagramme publié. Le
// catalogue ci-dessous est court, dédié, et rend de l'AFFICHAGE.
//
// Même patron que `inspector_registry` (#1243) : registre plat, enregistrement
// idempotent par id, applicabilité par cible, gating déclaratif, ordre. Chaque
// couche (OS, puis OS+, puis SA) y ajoute ses blocs.
//
// Les ids de blocs sont ÉCRITS DANS LE JSON du diagramme (cf. Lot 0) : ils sont
// donc stables et namespacés, jamais renommés à la légère.

import React from 'react'
import type { Class_ApplicationData } from '../../../types/ApplicationData'
import type { Class_ProtoElement } from '../../../Elements/Element'
import type { Type_PanelMode } from '../../../types/PanelManager'

/**
 * Cible d'un bloc. Volontairement distincte de `Type_InspectorTarget` : on ne
 * compose une présentation que pour ce qu'un LECTEUR peut survoler ou cliquer
 * (les éléments du dessin, et les boutons de menu au Lot 5). Pas de 'view', pas
 * de 'mixed' — ce sont des notions d'édition.
 */
export type Type_PresentationTarget = 'node' | 'link' | 'container' | 'button'

/** Contexte fourni au rendu d'un bloc. */
export type Type_BlockRenderContext = {
  app_data: Class_ApplicationData
  /** Élément ciblé ; `null` pour une cible 'button' (Lot 5). */
  element: Class_ProtoElement | null
  /** Contenant courant : permet d'adapter la densité (info-bulle = compact). */
  mode: Type_PanelMode
  /** Réglages du bloc tels que composés par l'auteur (opaques au registre). */
  options?: { [key: string]: unknown }
}

export type Type_PresentationBlock = {
  /** Id stable, écrit dans le JSON. Namespacé par couche ('os.block.*'). */
  id: string
  /** Cible(s) pour lesquelles le bloc est proposé au catalogue. */
  target: Type_PresentationTarget | Type_PresentationTarget[]
  /** Ordre d'apparition DANS LE CATALOGUE (le bouton « Ajouter »). L'ordre
   *  d'AFFICHAGE, lui, est celui de la composition de l'auteur. */
  order: number
  /** Libellé au catalogue (déjà traduit). */
  label: (app_data: Class_ApplicationData) => string
  /**
   * Rendu LECTEUR (lecture seule). Rend `null` quand le bloc n'a rien à montrer
   * pour cette cible (ex. pas de texte libre saisi) : l'appelant saute alors le
   * bloc plutôt que d'afficher une section vide.
   */
  render: (ctx: Type_BlockRenderContext) => React.ReactNode
  /** Gating déclaratif (licence, disponibilité d'un hook…). */
  gate?: (app_data: Class_ApplicationData) => boolean
}

/** Registre plat des blocs d'affichage. Instance unique partagée. */
export class Class_PresentationBlockRegistry {
  private _blocks: Map<string, Type_PresentationBlock> = new Map()

  /** Enregistre (ou remplace, par id) un bloc — idempotent, sûr au hot reload,
   *  et permet à une couche supérieure de surcharger un bloc de base. */
  public register(block: Type_PresentationBlock): void {
    this._blocks.set(block.id, block)
  }

  public unregister(id: string): void {
    this._blocks.delete(id)
  }

  public clear(): void {
    this._blocks.clear()
  }

  public get(id: string): Type_PresentationBlock | undefined {
    return this._blocks.get(id)
  }

  public has(id: string): boolean {
    return this._blocks.has(id)
  }

  /** Blocs proposables pour une cible, filtrés par gating, triés par ordre.
   *  C'est la liste du bouton « Ajouter » (Lot 2). */
  public getBlocksFor(
    target: Type_PresentationTarget,
    app_data: Class_ApplicationData
  ): Type_PresentationBlock[] {
    return [...this._blocks.values()]
      .filter(b => matchesTarget(b.target, target))
      .filter(b => (b.gate ? b.gate(app_data) : true))
      .sort((a, b) => a.order - b.order)
  }

  public get size(): number {
    return this._blocks.size
  }
}

function matchesTarget(
  decl: Type_PresentationTarget | Type_PresentationTarget[],
  target: Type_PresentationTarget
): boolean {
  return Array.isArray(decl) ? decl.includes(target) : decl === target
}

/** Instance unique partagée par toutes les couches. */
export const presentation_block_registry = new Class_PresentationBlockRegistry()

/**
 * Rend un bloc par son id. Rend `null` si l'id est INCONNU — c'est ici
 * qu'atterrit la tolérance posée au Lot 0 : le modèle CONSERVE un bloc produit
 * par une version plus récente (pour ne pas détruire le travail de l'auteur au
 * réenregistrement), et c'est le rendu qui le saute silencieusement.
 */
export const renderPresentationBlock = (
  id: string,
  ctx: Type_BlockRenderContext
): React.ReactNode => {
  const block = presentation_block_registry.get(id)
  if (!block) return null
  if (block.gate && !block.gate(ctx.app_data)) return null
  return block.render(ctx)
}
