// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2026 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction.
// ==================================================================================================
// Author        : Julien Alapetite for TerriFlux
// ==================================================================================================

// Visibilité configurable des BLOCS d'info-bulle par élément (OS#1285). Chaque
// info-bulle (nœud / flux) est faite d'onglets ; l'attribut de style
// `tooltip_hidden_blocks` liste ceux que l'utilisateur a MASQUÉS. Défaut (attribut
// absent) = tout visible. Donnée pure (ids + record), sans dépendance au modèle :
// les tooltips lisent l'attribut résolu et interrogent isTooltipBlockVisible.

// Record des blocs masqués : { [id du bloc]: true }. Un bloc absent = visible.
export type Type_TooltipHiddenBlocks = { [block_id: string]: boolean }

// Blocs d'info-bulle d'un NŒUD (cf. TooltipsNode).
export const NODE_TOOLTIP_BLOCKS = ['values', 'tags', 'unitary', 'analysis'] as const
// Blocs d'info-bulle d'un FLUX (cf. TooltipsLink).
export const LINK_TOOLTIP_BLOCKS = ['flux', 'series_flux', 'data', 'series_data', 'analysis'] as const

export type Type_NodeTooltipBlock = typeof NODE_TOOLTIP_BLOCKS[number]
export type Type_LinkTooltipBlock = typeof LINK_TOOLTIP_BLOCKS[number]

// Clé i18n du libellé d'un bloc (inspector.tooltip_blocks.*).
export const tooltipBlockLabelKey = (block_id: string): string =>
  `inspector.tooltip_blocks.${block_id}`

// Un bloc est-il visible ? Visible sauf s'il est explicitement masqué.
export const isTooltipBlockVisible = (
  hidden: Type_TooltipHiddenBlocks | undefined,
  block_id: string
): boolean => !(hidden && hidden[block_id] === true)
