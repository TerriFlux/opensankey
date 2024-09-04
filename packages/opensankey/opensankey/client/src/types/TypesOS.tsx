// ==================================================================================================
// Author : Vincent LE DOZE & Vincent CLAVEL for TerriFlux SARL
// Date : 29/05/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

import { Class_ApplicationData, initial_window_height, initial_window_width } from './ApplicationData'
import { Class_DrawingArea } from './DrawingArea'
import { Class_Sankey } from './Sankey'
import { Class_LinkElement } from './Link'
import { Class_NodeElement } from './Node'

// STANDARD TYPES FOR OPENSANKEY AND MORE *********************************************************

export type Type_GenericApplicationDataOS = Class_ApplicationData<Type_GenericDrawingAreaOS, Type_GenericSankeyOS, Type_GenericNodeElementOS, Type_GenericLinkElementOS>
export type Type_GenericDrawingAreaOS = Class_DrawingArea<Type_GenericSankeyOS, Type_GenericNodeElementOS, Type_GenericLinkElementOS>
export type Type_GenericSankeyOS = Class_Sankey<Type_GenericDrawingAreaOS, Type_GenericNodeElementOS, Type_GenericLinkElementOS>
export type Type_GenericNodeElementOS = Class_NodeElement<Type_GenericDrawingAreaOS, Type_GenericSankeyOS, Type_GenericLinkElementOS>
export type Type_GenericLinkElementOS = Class_LinkElement<Type_GenericDrawingAreaOS, Type_GenericSankeyOS, Type_GenericNodeElementOS>


// STANDARD CLASSES FOR OPENSANKEY AND MORE *******************************************************

export class Class_ApplicationDataOS
  extends Class_ApplicationData<
    Class_DrawingAreaOS, Class_SankeyOS, Class_NodeElementOS, Class_LinkElementOS
  > {
  protected createNewDrawingArea(): Class_DrawingAreaOS {
    const drawing_area = new Class_DrawingAreaOS(
      initial_window_height,
      initial_window_width,
      this
    )
    return drawing_area
  }
}

export class Class_LinkElementOS
  extends Class_LinkElement<
    Class_DrawingAreaOS, Class_SankeyOS, Class_NodeElementOS
  > {
}

export class Class_NodeElementOS
  extends Class_NodeElement<
    Class_DrawingAreaOS, Class_SankeyOS, Class_LinkElementOS
  > {
  public copyInputLink(link: Class_LinkElement<any, any, any>): Class_LinkElementOS {
    const new_link = new Class_LinkElementOS(
      link.id,
      this.main_sankey.nodes_dict[link.source.id] as Class_NodeElementOS,
      this,
      this.drawing_area,
      this.menu_config
    )
    return new_link
  }

  public copyOutputLink(link: Class_LinkElement<any, any, any>): Class_LinkElementOS {
    const new_link = new Class_LinkElementOS(
      link.id,
      this,
      this.main_sankey.nodes_dict[link.target.id] as Class_NodeElementOS,
      this.drawing_area,
      this.menu_config
    )
    return new_link
  }
}

export class Class_SankeyOS
  extends Class_Sankey<
    Class_DrawingAreaOS, Class_NodeElementOS, Class_LinkElementOS
  > {
  /**
   * Specific node creation method for this Sankey
   * @param {string} id
   * @param {string} name
   * @return {Class_Node}
   * @memberof Class_Sankey
   */
  protected createNewNode(id: string, name: string): Class_NodeElementOS {
    // Create node
    const node = new Class_NodeElementOS(id, name, this.drawing_area, this._menu_config)
    return node
  }

  protected createNewLink(id: string, source: Class_NodeElementOS, target: Class_NodeElementOS): Class_LinkElementOS {
    // Create link
    const link = new Class_LinkElementOS(id, source, target, this.drawing_area, this._menu_config)
    return link
  }
}

export class Class_DrawingAreaOS
  extends Class_DrawingArea<
    Class_SankeyOS, Class_NodeElementOS, Class_LinkElementOS
  > {
  protected createNewSankey() {
    const sankey = new Class_SankeyOS(this, this.application_data.menu_configuration)
    return sankey
  }
}

