// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
//
// This file is used to avoid cycling dependancies inside each Class definition files.
// ==================================================================================================

import {
  ClassAbstract_DrawingArea,
  ClassAbstract_Sankey,
  ClassAbstract_ProtoTag
} from './Abstract'
import { ClassAbstract_NodeElement } from './AbstractNode'
import { ClassTemplate_ProtoElement } from './Element'


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
  public abstract getAllValues(): { [_: string]: [ClassAbstract_LinkValue, ClassAbstract_ProtoTag[] | undefined]; };
  public abstract hasGivenTag(tag: ClassAbstract_ProtoTag):boolean
  // Mandatory getters / setters
  public abstract get source():TypeAbstract_NodeElement;
  public abstract get target():TypeAbstract_NodeElement;
  public abstract set shape_arrow_path(_: string)
  public abstract get value() : ClassAbstract_LinkValue | null
}

export abstract class ClassAbstract_LinkValue {
  // Mandatory methods
  public abstract draw(): void
  public abstract addTag(_: ClassAbstract_ProtoTag): void
  public abstract removeTag(_: ClassAbstract_ProtoTag): void
  public abstract getAllValues(): { [_: string]: [ClassAbstract_LinkValue, ClassAbstract_ProtoTag[] | undefined]; };
  // Mandatory getters / setters
  public abstract get id(): string
  public abstract get data_value() : number | null
}

export abstract class ClassAbstract_LinkStyle {
  // Mandatory getters / setters
  public abstract get id(): string
}

