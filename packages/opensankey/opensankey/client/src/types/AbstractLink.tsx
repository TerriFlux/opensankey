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
  ClassAbstract_DrawingArea,
  ClassAbstract_Sankey,
  ClassAbstract_ProtoTag
} from '../types/Abstract'
import { ClassAbstract_NodeElement } from '../types/AbstractNode'
import { ClassTemplate_ProtoElement } from '../Elements/Element'
import { Class_LinkAttribute, Class_LinkStyle } from '../Elements/LinkAttributes'
import { Class_LinkValue } from '../Elements/Link'


type TypeAbstract_NodeElement = ClassAbstract_NodeElement<ClassAbstract_DrawingArea, ClassAbstract_Sankey>
export abstract class ClassAbstract_LinkElement
  <
    Type_GenericDrawingArea extends ClassAbstract_DrawingArea,
    Type_GenericSankey extends ClassAbstract_Sankey
  >
  extends ClassTemplate_ProtoElement
  <
    Type_GenericDrawingArea,
    Type_GenericSankey
  >
{
  // Mandatory methods
  public abstract drawWithNodes(): void;
  public abstract addDataTag(_: ClassAbstract_ProtoTag): void;
  public abstract removeDataTag(_: ClassAbstract_ProtoTag): void;
  public abstract addTag(_: ClassAbstract_ProtoTag): void
  public abstract removeTag(_: ClassAbstract_ProtoTag): void;
  public abstract getAllValues(): { [_: string]: [ClassAbstract_LinkValue, ClassAbstract_ProtoTag[] | undefined]; };
  public abstract hasGivenTag(tag: ClassAbstract_ProtoTag):boolean
  public abstract resetAttributes():void
  public abstract valueForTags(_:ClassAbstract_ProtoTag[]):ClassAbstract_LinkValue|null

  // Mandatory getters / setters
  public abstract get source():TypeAbstract_NodeElement;
  public abstract get target():TypeAbstract_NodeElement;
  public abstract set shape_arrow_path(_: string)
  public abstract get value() : ClassAbstract_LinkValue | null
  public abstract get valueData() : number | null
  public abstract get valueResult() : number | null
  public abstract get style() : Class_LinkStyle[]
  public abstract set style(s:Class_LinkStyle[]) 
  public abstract get display():{style:Class_LinkStyle[],attributes:Class_LinkAttribute} 
}

export abstract class ClassAbstract_LinkValue {
  // Mandatory methods
  public abstract draw(): void
  public abstract addTag(_: ClassAbstract_ProtoTag): void
  public abstract removeTag(_: ClassAbstract_ProtoTag): void
  public abstract getAllValues(): { [_: string]: [ClassAbstract_LinkValue, ClassAbstract_ProtoTag[] | undefined]; };
  // Mandatory getters / setters
  public abstract get id(): string
  public abstract get valueResult() : number | null
  public abstract set valueResult(_: number | null)
}

export abstract class ClassAbstract_LinkStyle {
  // Mandatory getters / setters
  public abstract get id(): string
  public abstract get name(): string
}

