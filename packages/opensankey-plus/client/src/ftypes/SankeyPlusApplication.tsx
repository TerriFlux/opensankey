// OpenSankey imports
import type {
  FType_InitializeAdditionalMenus
} from '../deps/OpenSankey/types/FunctionTypes'
import type {
  Type_JSON
} from '../deps/OpenSankey/types/Utils'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'

// Generic Type that with given argument return a functionType that return a given type,
// Usefull when we want to only recast the returned value of OS function in submodule
//  so that when original functionType change linter should trigger in submodule too,
//  arguments are :
// - T : Parameters of the original function (generally given by 'Parameters<FunctionType>')
// - R : Type of the returned value by RecastReturnTypeOfFunction
type RecastReturnTypeOfFunction<T extends any[], R extends any> = (...args: T) => R  // eslint-disable-line

// Function components prototypes =================================================================

export type FCType_ModalSelectionIconsOSP = {
  new_data_plus: Class_ApplicationDataOSP
}

// Function prototypes =============================================================================

// Application data initializer
export type FType_InitializeApplicationDataOSP = (
  initial_data: Type_JSON | undefined
) => Class_ApplicationDataOSP

// Special parameter for additionnalMenu
// It take original AdditionalMenusType parameters but also its return object that contains array of additonal JSX.Element
// return because sub-module initialiser add element to already existing variable
type PType_InitializeAdditionalMenus = Parameters<FType_InitializeAdditionalMenus>
type PType_InitializeAdditionalMenusOSP = [...PType_InitializeAdditionalMenus]
export type FType_InitializeAdditionalMenusOSP = RecastReturnTypeOfFunction<PType_InitializeAdditionalMenusOSP, void>

