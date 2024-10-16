// ==================================================================================================
// Authors :
//  - Vincent CLAVEL
//  - Julien ALAPETITE
//  - Vincent LE DOZE
// Date : 28/08/2024
// All rights reserved for TerriFlux SARL
// ==================================================================================================

// Local imports
import {
  Class_AbstractNodeElementPlus,
  type Class_AbstractDrawingAreaPlus,
  type Class_AbstractSankeyPlus
} from './Abstract'
import type { Class_MenuConfigPlus } from './MenuConfigPlus'
import type { Class_LinkElementPlus } from './LinkPlus'
import {
  Type_ElementPosition,
  type Type_JSON,
  getBooleanFromJSON,
  getStringFromJSON,
  getStringOrUndefinedFromJSON
} from '../deps/OpenSankey/types/Utils'
import { Class_NodeAttribute, Class_NodeStyle } from '../deps/OpenSankey/types/Node'
import { default_label_background } from '../MenuConfigEdition/SankeyPlusNodes'
import { Class_NodeElementOSP, Type_GenericApplicationDataOSP, Type_GenericLinkElementOSP, Type_GenericNodeElementOSP } from './TypesOSP'
import * as d3 from 'd3'

export function isAttributeOverloaded(
  nodes: Type_GenericNodeElementOSP[],
  attr: keyof Class_NodeAttributePlus
) {
  let overloaded = false
  nodes.forEach(node => overloaded = (overloaded || node.isAttributeOverloaded(attr)))
  return overloaded
}

// CLASS NODE ELEMENT PLUS **************************************************************

/**
 * Override OpenSankey's class to take in account specifities of OpenSankey+ app
 * @export
 * @class Class_NodeElementPlus
 * @extends {Class_AbstractNodeElementPlus}
 */
export abstract class Class_NodeElementPlus
  <
    Type_GenericDrawingArea extends Class_AbstractDrawingAreaPlus<Type_GenericSankey, Class_NodeElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>, Type_GenericLinkElement>,
    Type_GenericSankey extends Class_AbstractSankeyPlus<Type_GenericDrawingArea, Class_NodeElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>, Type_GenericLinkElement>,
    Type_GenericLinkElement extends Class_LinkElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Class_NodeElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>>
  >
  extends Class_AbstractNodeElementPlus
  <
    Type_GenericDrawingArea,
    Type_GenericSankey,
    Type_GenericLinkElement
  > {

  // PROTECTED ATTRIBUTE ================================================================
  protected abstract _display: {
    drawing_area: Type_GenericDrawingArea,
    sankey: Type_GenericSankey,
    position: Type_ElementPosition,
    style: Class_NodeStylePlus,
    attributes: Class_NodeAttributePlus
    position_x_label?: number// Relative x position of label when dragged (optionnal)
    position_y_label?: number// Relative y position of label when dragged (optionnal)
  }


  /**
   * Config menu ref to html element & function to update it
   * @protected
   * @type {Class_MenuConfigPlus}
   * @memberof Class_Element
   */
  protected _menu_config: Class_MenuConfigPlus

  // PRIVATE ATTRIBUTES =================================================================

  private _iconName: string
  private _iconColor: string
  private _iconVisible: boolean
  private _iconViewBox?: string | undefined
  private _iconColorSustainable: boolean

  private _has_FO: boolean
  private _is_FO_raw: boolean
  private _FO_content: string

  private _is_image: boolean
  private _image_src: string

  private _hyperlink: string

  // CONSTRUCTOR ========================================================================

  /**
   * Creates an instance of Class_NodeElementPlus.
   * @param {string} id
   * @param {string} name
   * @param {Type_GenericDrawingArea} drawing_area
   * @param {Class_MenuConfigPlus} menu_config
   * @memberof Class_NodeElementPlus
   */
  constructor(
    id: string,
    name: string,
    drawing_area: Type_GenericDrawingArea,
    menu_config: Class_MenuConfigPlus
  ) {
    // Heritance
    super(id, name, drawing_area, menu_config)
    // Overrides
    this._menu_config = menu_config
    // New attributes
    this._iconName = ''
    this._iconColor = ''
    this._iconVisible = false
    this._iconViewBox = ''
    this._iconColorSustainable = false
    this._has_FO = false
    this._is_FO_raw = false
    this._FO_content = ''
    this._is_image = false
    this._image_src = ''
    this._hyperlink = ''
  }

  // ABSTRACT METHODS ===================================================================

  // Nothing ...

  // PUBLIC METHOD ======================================================================

  // Overrides --------------------------------------------------------------------------

  public override draw() {
    super.draw()
    this.drawNodeLabelBg()
    this.drawIllustration()
    this.drawFO()
  }

  /**
   *Extract node attributes from json
   *
   * @param {Type_JSON} json_node_object
   * @param {{ [_: string]: string }} [matching_taggs_id]
   * @param {{ [_: string]: { [_: string]: string } }} [matching_tags_id]
   * @memberof Class_NodeElementPlus
   */
  public override fromJSON(
    json_node_object: Type_JSON,
    matching_taggs_id?: { [_: string]: string },
    matching_tags_id?: { [_: string]: { [_: string]: string } }
  ): void {
    super.fromJSON(json_node_object, matching_taggs_id, matching_tags_id)
    this._iconName = getStringFromJSON(json_node_object, 'iconName', this._iconName)
    this._iconColor = getStringFromJSON(json_node_object, 'iconColor', this._iconColor)
    this._iconVisible = getBooleanFromJSON(json_node_object, 'iconVisible', this._iconVisible)
    this._iconViewBox = getStringOrUndefinedFromJSON(json_node_object, 'iconViewBox')
    this._iconColorSustainable = getBooleanFromJSON(json_node_object, 'iconColorSustainable', this._iconColorSustainable)
    this._has_FO = getBooleanFromJSON(json_node_object, 'has_FO', this._has_FO)
    this._is_FO_raw = getBooleanFromJSON(json_node_object, 'is_FO_raw', this._is_FO_raw)
    this._FO_content = getStringFromJSON(json_node_object, 'FO_content', this._FO_content)
    this._is_image = getBooleanFromJSON(json_node_object, 'is_image', this._is_image)
    this._image_src = getStringFromJSON(json_node_object, 'image_src', this._image_src)
    this._hyperlink = getStringFromJSON(json_node_object, 'hyperlink', this._hyperlink)
  }

  /**
   * Convert node to JSON
   *
   * @return {*}  {Type_JSON}
   * @memberof Class_NodeElementPlus
   */
  public override toJSON(): Type_JSON {
    const json_entry = super.toJSON()

    json_entry['iconName'] = this._iconName
    json_entry['iconColor'] = this._iconColor
    json_entry['iconVisible'] = this._iconVisible
    if (this._iconViewBox) json_entry['iconViewBox'] = this._iconViewBox
    json_entry['iconColorSustainable'] = this._iconColorSustainable
    json_entry['has_FO'] = this._has_FO
    json_entry['is_FO_raw'] = this._is_FO_raw
    json_entry['FO_content'] = this._FO_content
    json_entry['is_image'] = this._is_image
    json_entry['image_src'] = this._image_src
    json_entry['hyperlink'] = this._hyperlink

    return json_entry
  }

  /**
   * Copy attributes from a given node & create/copy ref to current sankey (ref to node_taggs & style)
   *
   * @param {Class_NodeElementPlus} node_to_copy
   * @memberof Class_NodeElementPlus
   */
  public copyAttrFrom(
    node_to_copy: Class_NodeElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>
  ): void {
    super.copyAttrFrom(node_to_copy)

    this._iconName = node_to_copy._iconName
    this._iconColor = node_to_copy._iconColor
    this._iconVisible = node_to_copy._iconVisible
    this._iconViewBox = node_to_copy._iconViewBox
    this._iconColorSustainable = node_to_copy._iconColorSustainable
    this._has_FO = node_to_copy._has_FO
    this._is_FO_raw = node_to_copy._is_FO_raw
    this._FO_content = node_to_copy._FO_content
    this._is_image = node_to_copy._is_image
    this._image_src = node_to_copy._image_src
    this._hyperlink = node_to_copy._hyperlink
  }

  public isAttributeOverloaded(attr: keyof Class_NodeAttributePlus) {
    return this._display.attributes[attr] !== undefined
  }

  public override isEqual(
    _: Class_NodeElementPlus<Type_GenericDrawingArea, Type_GenericSankey, Type_GenericLinkElement>
  ): boolean {
    const super_equal = super.isEqual(_)
    if (super_equal == false) {
      return false
    }

    if (this._iconName != _._iconName) {
      return false
    }
    if (this._iconColor != _._iconColor) {
      return false
    }
    if (this._iconVisible != _._iconVisible) {
      return false
    }
    if (this._iconViewBox != _._iconViewBox) {
      return false
    }
    if (this._iconColorSustainable != _._iconColorSustainable) {
      return false
    }
    if (this._has_FO != _._has_FO) {
      return false
    }
    if (this._is_FO_raw != _._is_FO_raw) {
      return false
    }
    if (this._FO_content != _._FO_content) {
      return false
    }
    if (this._is_image != _._is_image) {
      return false
    }
    if (this._image_src != _._image_src) {
      return false
    }
    if (this._hyperlink != _._hyperlink) {
      return false
    }

    if (this.name_label_background !== _.name_label_background) {
      return false
    }

    return true
  }

  // New --------------------------------------------------------------------------------

  public drawIllustration() {
    this.d3_selection?.selectAll('.illustration').remove()
    if (this._is_image) {
      this.drawIllustrationImage()
    }
    if (this._iconVisible) {
      this.drawIllustrationIcon()
    }
  }

  public drawFO() {
    this.d3_selection?.select('.node_fo').remove()

    this.d3_selection?.append('foreignObject')
      .attr('id', this.id + '_fo')
      .attr('class', 'node_fo')
      .attr('width', this.getShapeWidthToUse())
      .attr('height', this.getShapeHeightToUse())
      .append('xhtml:div')
      .attr('class', 'ql-editor')
      .html(this._FO_content)
  }

  /**
   * Function to animate links path outgoing 'this' node, 
   * it propagate the animation to node target of these link until we reach a node without output links
   *
   * @param {Type_GenericApplicationDataOSP} new_data
   * @param {Type_GenericNodeElementOSP[]} nodeDisplay
   * @param {Type_GenericNodeElementOSP[]} node_visible
   * @memberof Class_NodeElementPlus
   */
  protected branchAnimate(
    new_data: Type_GenericApplicationDataOSP,
    nodeDisplay: Type_GenericNodeElementOSP[],
    node_visible: Type_GenericNodeElementOSP[],
  ) {
    const curr_node = this //Stock this var because we use a function that change the scope of this

    // Get d3 selection of all visible link who have for source curr_node
    const glinks = new_data.drawing_area.d3_selection_links?.selectAll('.gg_links')
      .filter(d => {
        const link = d as Type_GenericLinkElementOSP
        return link.source.id === curr_node.id
      })

    // Refill opacity of links we are about to animate
    glinks?.select('.link_path').attr('stroke-opacity', l => (l as Type_GenericLinkElementOSP).shape_opacity)

    // Launch animation of link exiting curr_node
    glinks?.selectAll('.link_path').each(function () {
      const totalLength = (this as SVGGeometryElement).getTotalLength()

      const link_Class = new_data.drawing_area.sankey.links_dict[d3.select(this).attr('id')]
      d3.select(this)
        .attr('stroke-dasharray', totalLength + ' ' + totalLength)
        .attr('stroke-dashoffset', totalLength)
        .style('stroke', link_Class.getPathColorToUse())
    })
      .transition()
      .duration(2000)
      .attr('stroke-dashoffset', 0)
      .on('end', function (this) {

        const idLink = d3.select(this).attr('id').replace('path_', '')
        const link_animated = new_data.drawing_area.sankey.links_dict[idLink]
        const Target = link_animated.target

        // Put initial arrow color after link_animated animation
        const arrow = link_animated.d3_selection?.selectAll('.link_arrow')
        Target.d3_selection?.select('.node_shape').attr('fill', Target.getShapeColorToUse())
        if (arrow !== undefined && arrow != null) {
          // Get color of target (can be used if link_animated was a gradient)
          const colorTarget = Target.shape_visible ? Target.getShapeColorToUse() : (Target.iconVisible ? Target.iconColor : 'grey')

          const l_grad = link_animated.shape_is_gradient
          const t = (l_grad) ? colorTarget : link_animated.getPathColorToUse()
          if (t) {
            arrow.attr('fill', t)
            arrow.attr('opacity', link_animated.shape_opacity)
          }
        }

        // reaffichage des link value après l'animation
        link_animated.d3_selection?.selectAll('.link_label').attr('display', '')


        //Propagration de l'animation sur les flux sortant du target_node
        // on teste si le noeud est déjà passé cela permet de régler le problème des links à 'recycling'
        if (!nodeDisplay.includes(Target)) {
          nodeDisplay.push(Target)
          let max = 0
          const tmp = Target.direct_son_as_distant_sibling(new_data, curr_node as unknown as Class_NodeElementOSP, 0, [link_animated], node_visible)

          max = (tmp > max) ? tmp : max
          setTimeout(() => {
            Target.branchAnimate(new_data, nodeDisplay, node_visible)
          }, max * 2000)
        }
      })
  }

  public direct_son_as_distant_sibling(
    new_data: Type_GenericApplicationDataOSP,
    nodeData: Type_GenericNodeElementOSP,
    deep: number,
    link_to_avoid: Type_GenericLinkElementOSP[],
    display_nodes_id: Type_GenericNodeElementOSP[],
  ) {
    //Cherche à savoir si un noeud qui recoit directement le flux de nodeData ai aussi un path inderectement vers ce meme noeud
    //exemple : n0 -> n1  et n0 -> n2 -> n1
    //fonction utilisé pour que le noeud qui recoit le flux direct attend les chemin indirect avant de lancer les animations suivantes
    const next_link = nodeData.output_links_list.filter(f => f.shape_is_recycling && !Object.values(link_to_avoid).includes(f) && display_nodes_id.includes(f.target))
    let max = 0
    const data_plus = new_data

    if (nodeData.id === this.id) {
      return deep - 1
    } else if (next_link.length > 0) {
      next_link.map(link => {
        const next_node = link.target
        //utilise array.concat pour ne pas modifier le tableau original (contrairement a .push)
        const to_avoid = link_to_avoid.concat([link])
        const tmp = this.direct_son_as_distant_sibling(data_plus, next_node, deep + 1, to_avoid, display_nodes_id)
        max = (tmp > max) ? tmp : max
      })
    }
    return max
  }

  // PROTECTED METHODS ====================================================================

  protected eventSimpleLMBCLick(
    event: React.MouseEvent<HTMLButtonElement, React.MouseEvent>
  ) {
    // Apply parent behavior first
    super.eventSimpleLMBCLick(event)
    if (this._display.drawing_area.static) {
      if (this._hyperlink != '') {
        window.open(this._hyperlink)
      }
    }
  }
  // PRIVATE METHODS ====================================================================

  private drawIllustrationImage() {
    this.d3_selection?.append('image')
      .attr('id', 'image_node_' + this.id)
      .attr('class', 'illustration image')
      .attr('href', this.image_src)
      .attr('height', this.getShapeHeightToUse())
      .attr('width', this.getShapeWidthToUse())
  }

  private drawIllustrationIcon() {
    this.d3_selection?.append('svg')
      .attr('id', 'icon_node_' + this.id)
      .attr('class', 'illustration icon_node')
      .attr('viewBox', this.iconViewBox ? this.iconViewBox : '0 0 1000 1000')
      .attr('height', this.getShapeHeightToUse())
      .attr('width', this.getShapeWidthToUse())
      .attr('x', 0)
      .append('g')
      .append('path')
      .style('fill', this.iconColor)
      .attr('d', this.sankey.getIconFromCatalog(this.iconName))
  }

  /**
   * Draw a background to the name label to highlight the name label
   *
   * @private
   * @memberof Class_NodeElementPlus
   */
  private drawNodeLabelBg() {
    // Preventively delete previous label bg
    this.d3_selection?.select('.node_label_bg').remove()

    // Draw label BG if attr is at true but also if we display label
    if (this.name_label_visible && this.name_label_background) {
      const box_width = Math.min(
        this.name_label.length * this.name_label_font_size,
        this.name_label_box_width)

      const [label_pos_x, label_pos_y, label_anchor] = this.getNameLabelPos()

      let box_pos_x = label_pos_x
      let box_pos_y = label_pos_y
      if (this.name_label_vert == 'top') {
        box_pos_y -= this.name_label_font_size
      } else if (this.name_label_vert == 'middle') {
        box_pos_y -= this.name_label_font_size / 2
      }
      if (label_anchor === 'end') {
        box_pos_x = box_pos_x - box_width
      }
      else if (label_anchor === 'middle') {
        box_pos_x = box_pos_x - box_width / 2
      }
      const box_height = this.name_label_font_size

      this.d3_selection?.insert('g', '.name_label_text')
        .attr('class', 'node_label_bg')
        .append('rect')
        .classed('name_label', true)
        .classed('name_label_background', true)
        .attr('id', 'name_label_background_' + this.id)
        .attr('width', box_width)
        .attr('height', box_height)
        .attr('fill', 'white')
        .attr('fill-opacity', 0.55)
        .attr('rx', 4)
        .style('stroke', 'none')
        .attr('x', box_pos_x)
        .attr('y', box_pos_y)

    }
  }

  /**
   * Make some preparation before launching the animation,
   * then launch animation from clicked node
   *
   * @memberof Class_NodeElementPlus
   */
  public launchAnimation() {

    // Fill all node shape with light grey color (the original color will re-fill when an animated input link will end)
    this.drawing_area.sankey.visible_nodes_list.filter(n => n !== this).forEach(node => {
      node.d3_selection_g_shape?.selectAll('.node_shape').attr('fill', '#dddddd')
    })

    // 'Hide' link & related elements before animation, it will be re-displayed when said links end their animation 
    this.drawing_area.sankey.visible_links_list.forEach(link => {
      link.d3_selection?.selectAll('.link_path').attr('stroke-opacity', 0)
      link.d3_selection?.selectAll('.link_arrow').attr('opacity', 0)
      link.d3_selection?.selectAll('.link_label').attr('display', 'none')
    })

    // Launch animation of output links from clicked node, the rest is done recursively from there
    this.branchAnimate(this.drawing_area.application_data as Type_GenericApplicationDataOSP, [], this.drawing_area.sankey.visible_nodes_list as unknown as Type_GenericNodeElementOSP[])

    // Compute longest possible path from clicked node (number of link before we get to a node without output link)
    // so we can determinate a timeout before reseting the sankey
    const horizontal_indexes_per_nodes_ids: { [node_id: string]: number } = {}
    this.drawing_area.computeHorizontalIndex(this, 0, [], [], horizontal_indexes_per_nodes_ids)

    // Compute time to animate the whole sankey from clicked node
    let time_to_animate = 500
    let nb_animation = Object.values(horizontal_indexes_per_nodes_ids).reduce((a, b) => Math.max(a, b), -Infinity)
    nb_animation = (nb_animation !== undefined) ? nb_animation : 0
    time_to_animate += nb_animation * 2000

    const curr_node = this
    // Launch a timeout that will activate at the end of the animation to reset drawing_area
    setTimeout(function () {
      curr_node.drawing_area.reset()
    }, time_to_animate)

  }

  // GETTERS / SETTERS ==================================================================

  // Overrides --------------------------------------------------------------------------

  // Get application config menu
  protected override get menu_config(): Class_MenuConfigPlus { return this._menu_config }

  // New ---------------------------------------------------------------------------------

  public get iconName(): string { return this._iconName }
  public set iconName(value: string) { this._iconName = value }

  public get iconColor(): string { return this._iconColor }
  public set iconColor(value: string) { this._iconColor = value }

  public get iconVisible(): boolean { return this._iconVisible }
  public set iconVisible(value: boolean) { this._iconVisible = value }

  public get iconViewBox(): string | undefined { return this._iconViewBox }
  public set iconViewBox(value: string | undefined) { this._iconViewBox = value }

  public get iconColorSustainable(): boolean { return this._iconColorSustainable }
  public set iconColorSustainable(value: boolean) { this._iconColorSustainable = value }

  public get is_image(): boolean { return this._is_image }
  public set is_image(value: boolean) { this._is_image = value }

  public get image_src(): string { return this._image_src }
  public set image_src(value: string) { this._image_src = value }

  public get hyperlink(): string { return this._hyperlink }
  public set hyperlink(value: string) { this._hyperlink = value }

  public get has_FO(): boolean { return this._has_FO }
  public set has_FO(value: boolean) { this._has_FO = value }

  public get is_FO_raw(): boolean { return this._is_FO_raw }
  public set is_FO_raw(value: boolean) { this._is_FO_raw = value }

  public get FO_content(): string { return this._FO_content }
  public set FO_content(value: string) { this._FO_content = value }


  /**
   * Getter of attribute name_label_background, get it either from display attribute if it exist else use value from related node style
   * @memberof Class_NodeElement
   */
  public get name_label_background() {
    if (this._display.attributes.name_label_background !== undefined) {
      return this._display.attributes.name_label_background
    } else if (this._display.style.name_label_background !== undefined) {
      return this._display.style.name_label_background
    }
    return default_label_background
  }

  /**
 * Set name_label_background value to node display attribute 
 * @memberof Class_NodeElement
 */
  public set name_label_background(_: boolean) {
    this._display.attributes.name_label_background = _
    this.drawNodeLabelBg()
  }

}


/**
 * Define all attributes that can be applyied to a link
 *
 * @export
 * @class Class_LinkAttribute
 */
export class Class_NodeAttributePlus extends Class_NodeAttribute {

  // PROTECTED ATTRIBUTES ===============================================================

  protected _name_label_background?: boolean | undefined

  // PUBLIC METHODES ====================================================================

  public toJSON() {
    const json_object = super.toJSON()
    if (this._name_label_background !== undefined) json_object['label_background'] = this._name_label_background

    return json_object
  }

  public fromJSON(json_local_object: Type_JSON) {
    super.fromJSON(json_local_object)
    if (json_local_object['label_background'] !== undefined) this._name_label_background = getBooleanFromJSON(json_local_object, 'label_background', default_label_background)

  }

  public copyFrom(element: Class_NodeAttributePlus) {
    super.copyFrom(element)
    this._name_label_background = element._name_label_background

  }

  // PROTECTED METHODS ==================================================================

  // GETTERS ============================================================================

  public get name_label_background(): boolean | undefined { return this._name_label_background }

  // SETTERS ============================================================================

  public set name_label_background(_: boolean | undefined) { this._name_label_background = _; this.update() }

}


export class Class_NodeStylePlus extends Class_NodeStyle {

  // PRIVATE ATTRIBUTES =================================================================
  private _name_label_background: boolean

  // CONSTRUCTOR ========================================================================
  constructor(
    id: string,
    name: string,
    is_deletable: boolean = true
  ) {
    // Instantiate super class
    super(id, name, is_deletable)
    // Update new attributes
    this._name_label_background = default_label_background
  }

  // PROTECTED METHODS ==================================================================

  // PRIVATE METHODS ====================================================================

  // GETTERS ============================================================================
  public get name_label_background(): boolean { return this._name_label_background }
  public set name_label_background(value: boolean) { this._name_label_background = value }
}