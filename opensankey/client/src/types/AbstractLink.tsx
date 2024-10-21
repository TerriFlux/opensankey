// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
//
// This file is used to avoid cycling dependancies inside each Class definition files.
// ==================================================================================================

import {
  Class_AbstractDrawingArea,
  Class_AbstractSankey,
  Class_AbstractTag
} from './Abstract'
import { Class_AbstractNodeElement } from './AbstractNode';
import { Class_ProtoElement } from './Element'


type Type_AbstractNodeElement = Class_AbstractNodeElement<Class_AbstractDrawingArea, Class_AbstractSankey>
export abstract class Class_AbstractLinkElement
  <
    Type_GenericDrawingArea extends Class_AbstractDrawingArea,
    Type_GenericSankey extends Class_AbstractSankey
  >
  extends Class_ProtoElement
  <
    Type_GenericDrawingArea,
    Type_GenericSankey
  >
{
  // Mandatory methods
  public abstract drawWithNodes(): void;
  public abstract addDataTag(_: Class_AbstractTag): void;
  public abstract removeDataTag(_: Class_AbstractTag): void;
  public abstract getAllValues(): { [_: string]: [Class_AbstractLinkValue, Class_AbstractTag[] | undefined]; };
  public abstract hasGivenTag(tag: Class_AbstractTag):boolean
  
  public abstract get source():Type_AbstractNodeElement;
  public abstract get target():Type_AbstractNodeElement;

}


export abstract class Class_AbstractLinkValue {
  public abstract get id(): string
  // Mandatory methods
  public abstract draw(): void
  public abstract addTag(_: Class_AbstractTag): void
  public abstract removeTag(_: Class_AbstractTag): void
  public abstract getAllValues(): { [_: string]: [Class_AbstractLinkValue, Class_AbstractTag[] | undefined]; };
}

export abstract class Class_AbstractLinkStyle {
  public abstract get id(): string
}
