import { Class_ZoneSelection } from '../deps/OpenSankey/types/Selection_Zone'
import { Class_AbstractDrawingAreaPlus, Class_AbstractSankeyPlus } from './Abstract'
import { Class_ContainerElement } from './FreeLabel'
import { Class_MenuConfigPlus } from './MenuConfigPlus'

/**
 * Class that helps to create a selection zone for elements on the drawing area
 * @export
 * @class Class_ZoneSelection
 * @extends {Class_Element}
 */
export class Class_ZoneSelectionPlus
  <
    Type_GenericDrawingArea extends Class_AbstractDrawingAreaPlus<Type_GenericSankey, any, any>,
    Type_GenericSankey extends Class_AbstractSankeyPlus<Type_GenericDrawingArea, any, any>
  >
  extends Class_ZoneSelection
  <
    Type_GenericDrawingArea,
    Type_GenericSankey
  > {

  // PROTECTED ATTRIBUTES ===============================================================

  // PRIVATE ATTRIBUTES =================================================================

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_ZoneSelection.
   * @param {Type_GenericDrawingArea} drawing_area
   * @param {Class_MenuConfig} menu_config
   * @memberof Class_ZoneSelection
   */
  constructor(
    drawing_area: Type_GenericDrawingArea,
    menu_config: Class_MenuConfigPlus,
  ) {
    // Init parent class attributes
    super(drawing_area, menu_config)
  }

  // PUBLIC METHODS =====================================================================

  /**
   * Function to select elements present in the selection zone
   * (nodes has to be fully inside the zone to be selected)
   * @memberof Class_ZoneSelection
   */
  public selectElementsInside() {
    // Get OpenSankey standard elements
    super.selectElementsInside()
    // Adds OpenSankey+ elements
    this.drawing_area.sankey.containers_list
      .filter(container => {
        // Check if node is horizontally in selection zone
        const is_node_horizontally_in_zone = (
          (container.position_x >= this.position_x) &&
          (container.position_x <= (this.position_x + this.width)) &&
          ((container.position_x + container.label_width) <= (this.position_x + this.width))
        )
        // Check if node is vertically in selection zone
        const is_node_vertically_in_zone = (
          (container.position_y >= this.position_y) &&
          (container.position_y <= (this.position_y + this.height)) &&
          ((container.position_y + container.label_height) <= (this.position_y + this.height))
        )
        // Must be verticalt & horizontaly in selection zone
        return (is_node_horizontally_in_zone && is_node_vertically_in_zone)
      })
      .forEach(container => {
        this.drawing_area.addContainerToSelection(container as Class_ContainerElement<Type_GenericDrawingArea, Type_GenericSankey>)
      })
  }
}