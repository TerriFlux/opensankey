// ==================================================================================================
// The MIT License (MIT)
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
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================
//
// This file is used to avoid cycling dependancies inside each Class definition files.
// ==================================================================================================


import {
  ClassAbstract_LinkElement,
} from './AbstractLink'
import {
  ClassAbstract_Sankey,
  ClassAbstract_ProtoTag,
  ClassAbstract_DrawingArea,
  ClassAbstract_ProtoLevelTag,
  ClassAbstract_ProtoLevelTagGroup
} from '../types/Abstract'
import { ClassTemplate_Element } from '../Elements/Element'
import { Class_LevelTagGroup } from '../types/Tag'
import { Class_NodeDimension } from '../Elements/NodeDimension'
import { Class_Tag, Class_TagGroup } from '../types/Tag'
import { Class_NodeStyle } from '../Elements/NodeAttributes'

type TypeAbstract_LinkElement = ClassAbstract_LinkElement<ClassAbstract_DrawingArea, ClassAbstract_Sankey>
type TypeAbstract_NodeElement = ClassAbstract_NodeElement<ClassAbstract_DrawingArea, ClassAbstract_Sankey>

export abstract class ClassAbstract_NodeElement
  <
    Type_GenericDrawingArea extends ClassAbstract_DrawingArea,
    Type_GenericSankey extends ClassAbstract_Sankey
  >
  extends ClassTemplate_Element
  <
    Type_GenericDrawingArea,
    Type_GenericSankey
  > {
  // Mandatory getters
  public abstract get name(): string
  public abstract get position_type(): string
  public abstract get input_links_list(): TypeAbstract_LinkElement[]
  public abstract get output_links_list(): TypeAbstract_LinkElement[]
  public abstract get taggs_list(): Class_TagGroup[]
  public abstract get grouped_taggs_dict(): { [x: string]: Class_Tag[] }
  public abstract get dimensions_as_parent(): ClassAbstract_NodeDimension[]
  public abstract get dimensions_as_parent_pure(): ClassAbstract_NodeDimension[]
  public abstract get dimensions_as_child(): ClassAbstract_NodeDimension[]
  public abstract get dimensions_as_child_pure(): ClassAbstract_NodeDimension[]
  public abstract get sibling(): ClassAbstract_NodeElement<ClassAbstract_DrawingArea,ClassAbstract_Sankey>|undefined
  public abstract set sibling(_)
  public abstract get style(): Class_NodeStyle[]
  public abstract set style(n:Class_NodeStyle[]) 
  // Mandatory methods
  public abstract addTag(_: ClassAbstract_ProtoTag): void
  public abstract hasGivenTag(_: ClassAbstract_ProtoTag): boolean
  public abstract removeTag(_: ClassAbstract_ProtoTag): void
  public abstract getShapeWidthToUse(): number
  public abstract getShapeHeightToUse(): number
  public abstract getShapeColorToUse(): string
  public abstract addInputLink(_: TypeAbstract_LinkElement): void
  public abstract addOutputLink(_: TypeAbstract_LinkElement): void
  public abstract deleteInputLink(_: TypeAbstract_LinkElement): void
  public abstract deleteOutputLink(_: TypeAbstract_LinkElement): void
  public abstract deleteRecyclingLinkOnSameNode(_: TypeAbstract_LinkElement): void
  public abstract removeInputLink(_: TypeAbstract_LinkElement): void
  public abstract removeOutputLink(_: TypeAbstract_LinkElement): void
  public abstract getOutputLinkStartingPoint(_: TypeAbstract_LinkElement): {x: number, y: number} | undefined
  public abstract getInputLinkEndingPoint(_: TypeAbstract_LinkElement): {x: number, y: number} | undefined
  public abstract swapInputLink(_: TypeAbstract_LinkElement, __: TypeAbstract_NodeElement): void
  public abstract swapOutputLink(_: TypeAbstract_LinkElement, __: TypeAbstract_NodeElement): void
  public abstract drawLinksArrow(): void
  public abstract dimensionsUpdated(): void
  public abstract addNewDimensionAsParent(_: ClassAbstract_NodeDimension): void
  public abstract removeDimensionAsParent(_: ClassAbstract_NodeDimension): void
  public abstract addNewDimensionAsChild(_: ClassAbstract_NodeDimension): void
  public abstract removeDimensionAsChild(_: ClassAbstract_NodeDimension): void
  public abstract nodeDimensionAsParent(tagGroup: Class_LevelTagGroup): Class_NodeDimension | null
  public abstract nodeDimensionAsChild(tagGroup: Class_LevelTagGroup): Class_NodeDimension | null
  public abstract addAsAntiTagged(_: ClassAbstract_ProtoLevelTagGroup): void
  public abstract removeAsAntiTagged(_: ClassAbstract_ProtoLevelTagGroup): void
  public abstract shiftVertically(shift: number): void
  public abstract reorganizeIOLinks(): void
}

export abstract class ClassAbstract_NodeDimension {
  // Mandatory methods
  public abstract getLevel(): number
  //public abstract removeTagFromChildrenLevelTag(_: ClassAbstract_ProtoLevelTag): void
  public abstract showAccordingToLevelTags(): void
  protected abstract _unsetForcingToShow(): Set<TypeAbstract_NodeElement>
  // Mandatory getters
  public abstract get id(): string
  public abstract get parent_level_tag(): ClassAbstract_ProtoLevelTag
  public abstract get child_level_tag(): ClassAbstract_ProtoLevelTag
  public abstract get parent(): TypeAbstract_NodeElement
  public abstract get children(): TypeAbstract_NodeElement[]
}

export abstract class ClassAbstract_NodeStyle {
  // Mandatory getters
  public abstract get id(): string
  public abstract get name(): string
}

