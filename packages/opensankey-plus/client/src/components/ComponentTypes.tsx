// ==================================================================================================
// Types consolidés pour OpenSankey+ Application
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// ==================================================================================================
// Authors: Vincent LE DOZE, Vincent CLAVEL, Julien Alapetite for TerriFlux
// ==================================================================================================

import { TFunction } from 'i18next'
import React from 'react'

// OpenSankey imports
import type { FType_InitializeAdditionalMenus } from '../deps/OpenSankey/types/FunctionTypes'
import type { Type_JSON } from '../deps/OpenSankey/types/Utils'
import { Type_MacroTagGroup } from '../deps/OpenSankey/types/Utils'
import { FType_DiagramSelector } from '../deps/OpenSankey/components/SankeyMenuTypes'

// Application Data imports
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'
import { OSPApplicationDataType, OSPData, OSPLink, OSPNode } from '../types/LegacyTypes'

// =================================================================================================
// TYPES DE BASE RÉUTILISABLES
// =================================================================================================

/**
 * Type de base pour tous les composants utilisant new_data
 */
export interface BaseComponentProps {
  new_data: Class_ApplicationDataOSP
}

/**
 * Type de base pour tous les composants utilisant new_data_plus
 */
export interface BaseComponentPropsPlus {
  new_data_plus: Class_ApplicationDataOSP
}

/**
 * Type de base pour les composants de menu avec style
 */
export interface BaseMenuStyleProps extends BaseComponentProps {
  menu_for_style: boolean
}

/**
 * Type de base pour les composants de menu avec style (version plus)
 */
export interface BaseMenuStylePropsPlus extends BaseComponentPropsPlus {
  menu_for_style: boolean
}

/**
 * Type de base pour les composants avec popover
 */
export interface BasePopoverProps extends BaseComponentProps {
  in_popover: boolean
}

/**
 * Type de base pour les composants avec niveau
 */
export interface BaseLevelProps extends BaseComponentProps {
  level: boolean
}

// =================================================================================================
// TYPES UTILITAIRES GÉNÉRIQUES
// =================================================================================================

/**
 * Generic Type that with given argument return a functionType that return a given type,
 * Useful when we want to only recast the returned value of OS function in submodule
 * so that when original functionType change linter should trigger in submodule too
 */
type RecastReturnTypeOfFunction<T extends any[], R extends any> = (...args: T) => R  // eslint-disable-line

// =================================================================================================
// TYPES D'APPLICATION PRINCIPALE
// =================================================================================================

/**
 * Application data initializer
 */
export type FType_InitializeApplicationDataOSP = (
  initial_data: Type_JSON | undefined
) => Class_ApplicationDataOSP

/**
 * Special parameter for additionalMenu
 * It takes original AdditionalMenusType parameters but also its return object that contains array of additional JSX.Element
 */
type PType_InitializeAdditionalMenus = Parameters<FType_InitializeAdditionalMenus>
type PType_InitializeAdditionalMenusOSP = [...PType_InitializeAdditionalMenus]
export type FType_InitializeAdditionalMenusOSP = RecastReturnTypeOfFunction<PType_InitializeAdditionalMenusOSP, void>

// =================================================================================================
// TYPES DE CONVERSION ET TRANSFORMATION
// =================================================================================================

export type FType_DiagramSelectorOSP = (
  applicationData: OSPApplicationDataType,
) => FType_DiagramSelector


export type FType_SankeyLayoutOSP = (
  data: OSPData,
  new_layout: OSPData,
  mode: string[]
) => void

export type FType_InitalizeSelectorDetailNodes = (
  new_data: Class_ApplicationDataOSP
) => JSX.Element

export type FType_SankeySettingsEditionElementTags = {
  new_data: Class_ApplicationDataOSP,
  elementTagNameProp: Type_MacroTagGroup
}

// =================================================================================================
// TYPES D'AGRÉGATION DE NŒUDS
// =================================================================================================

export type FType_MenuConfigurationNodesAgregationOSP = (
  t: TFunction,
  data: OSPData,
  set_data: (d: OSPData) => void,
  multi_selected_nodes: { current: OSPNode[] },
  parent_visible: boolean,
  set_parent_visible: (_: boolean) => void,
  cube_dimension: string,
  set_cube_dimension: (_: string) => void,
  OSPDefaultLink: (_: OSPData) => OSPLink
) => JSX.Element

// =================================================================================================
// TYPES D'UTILITAIRES DIVERS
// =================================================================================================

export type FCType_ImportImageAsSvgBg = BaseComponentPropsPlus

// =================================================================================================
// INTERFACES DE COMPOSANTS DE MENU CONTEXTUEL (nouvelles)
// =================================================================================================

export interface ContextMenuButtonProps {
  children: React.ReactNode
}

export interface FCType_ContextMenuColors extends BaseComponentProps {}

export interface FCType_ContextMenuPositioning extends BaseComponentProps {}

export interface FCType_ContextMenuDrawingArea extends BaseComponentProps {}

// =================================================================================================
// TYPES DE FONCTIONS UTILITAIRES
// =================================================================================================

/**
 * Type pour les fonctions de couleurs aléatoires
 */
export type FType_ApplyRandomColors = (
  new_data: Class_ApplicationDataOSP,
  elements: any[]
) => void

/**
 * Type pour les fonctions de positionnement
 */
export type FType_TogglePositionMode = (
  new_data: Class_ApplicationDataOSP
) => void
