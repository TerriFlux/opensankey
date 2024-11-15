// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 03/09/2024
// All rights reserved for TerriFlux SARL
//
// This file is used to avoid cycling dependancies inside each Class definition files.
// ==================================================================================================


import {
  Class_AbstractLinkElement
} from './AbstractLink'
import {
  Class_AbstractSankey,
  Class_AbstractTag,
  Class_AbstractDrawingArea,
  Class_AbstractLevelTag,
  Class_AbstractLevelTagGroup
} from './Abstract'
import { Class_Element } from './Element'
import { Class_LevelTagGroup } from './Tag'
import { Class_NodeDimension } from './NodeDimension'
import { Class_Tag, Class_TagGroup } from './Tag'

type Type_AbstractLinkElement = Class_AbstractLinkElement<Class_AbstractDrawingArea, Class_AbstractSankey>
type Type_AbstractNodeElement = Class_AbstractNodeElement<Class_AbstractDrawingArea, Class_AbstractSankey>

export abstract class Class_AbstractNodeElement
  <
    Type_GenericDrawingArea extends Class_AbstractDrawingArea,
    Type_GenericSankey extends Class_AbstractSankey
  >
  extends Class_Element
  <
    Type_GenericDrawingArea,
    Type_GenericSankey
  > {
  // Mandatory getters
  public abstract get name(): string
  public abstract get position_type(): string
  public abstract get input_links_list(): Type_AbstractLinkElement[]
  public abstract get output_links_list(): Type_AbstractLinkElement[]
  public abstract get taggs_list(): Class_TagGroup[]
  public abstract get grouped_taggs_dict(): { [x: string]: Class_Tag[] }
  public abstract get dimensions_as_parent(): Class_AbstractNodeDimension[]
  public abstract get dimensions_as_child(): Class_AbstractNodeDimension[]
  // Mandatory methods
  public abstract addTag(_: Class_AbstractTag): void
  public abstract hasGivenTag(_: Class_AbstractTag): boolean
  public abstract removeTag(_: Class_AbstractTag): void
  public abstract getShapeWidthToUse(): number
  public abstract getShapeHeightToUse(): number
  public abstract addInputLink(_: Type_AbstractLinkElement): void
  public abstract addOutputLink(_: Type_AbstractLinkElement): void
  public abstract deleteInputLink(_: Type_AbstractLinkElement): void
  public abstract deleteOutputLink(_: Type_AbstractLinkElement): void
  public abstract swapInputLink(_: Type_AbstractLinkElement, __: Type_AbstractNodeElement): void
  public abstract swapOutputLink(_: Type_AbstractLinkElement, __: Type_AbstractNodeElement): void
  public abstract addNewDimensionAsParent(_: Class_AbstractNodeDimension): void
  public abstract removeDimensionAsParent(_: Class_AbstractNodeDimension): void
  public abstract addNewDimensionAsChild(_: Class_AbstractNodeDimension): void
  public abstract removeDimensionAsChild(_: Class_AbstractNodeDimension): void
  public abstract nodeDimensionAsParent(tagGroup: Class_LevelTagGroup): Class_NodeDimension | null
  public abstract addAsAntiTagged(_: Class_AbstractLevelTagGroup): void
  public abstract removeAsAntiTagged(_: Class_AbstractLevelTagGroup): void
  public abstract removeInputLink(_: Type_AbstractLinkElement): void
  public abstract removeOutputLink(_: Type_AbstractLinkElement): void
  public abstract getShapeColorToUse(): string
  public abstract shiftVertically(shift: number): void
  public abstract forceShow(): void
  public abstract forceHide(): void
}

export abstract class Class_AbstractNodeDimension {
  // Mandatory methods
  public abstract getLevel(): number
  public abstract removeTagFromChildrenLevelTag(_: Class_AbstractLevelTag): void
  protected abstract unsetForcingToShow(): Set<Type_AbstractNodeElement>
  // Mandatory getters
  public abstract get id(): string
  public abstract get parent_level_tag(): Class_AbstractLevelTag
  public abstract get children_level_tags(): Class_AbstractLevelTag[]
  public abstract get parent(): Type_AbstractNodeElement
  public abstract get children(): Type_AbstractNodeElement[]
}

export abstract class Class_AbstractNodeStyle {
  // Mandatory getters
  public abstract get id(): string
}
