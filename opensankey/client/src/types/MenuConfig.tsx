// External imports
import * as d3 from 'd3'
import { Ref, RefObject, useRef } from 'react'



export class Class_MenuConfig {
  // Button that open the configuration menu
  private _btn_toogle_menu: RefObject<HTMLLabelElement>

  // Button that open the menu elements
  private _btn_accordion_config_elements: RefObject<HTMLButtonElement>

  // Button that open the sub menu node of elements
  private _btn_accordion_config_node: RefObject<HTMLButtonElement>

  constructor() {
    this._btn_toogle_menu = useRef<HTMLLabelElement>(null)
    this._btn_accordion_config_elements = useRef<HTMLButtonElement>(null)
    this._btn_accordion_config_node = useRef<HTMLButtonElement>(null)
  }

  /**
   * Open menu configuration
   *
   * @memberof Class_MenuConfig
   */
  public OpenConfigMenu() {
    if (this._btn_toogle_menu && this._btn_toogle_menu.current) {
      this._btn_toogle_menu.current.click()
    }

  }

  /**
   * Return the ref to button to toggle the apparition of the config menu
   *
   * @return {RefObject<HTMLLabelElement>} 
   * @memberof Class_MenuConfig
   */
  public getBtnToogleMenu() {
    return this._btn_toogle_menu
  }
  /**
 * Get value of _btn_accordion_config_elements
 *
 * @type {RefObject<HTMLButtonElement>}
 * @memberof Class_MenuConfig
 */
  public get btn_accordion_config_elements(): RefObject<HTMLButtonElement> {
    return this._btn_accordion_config_elements
  }
  /**
   * Set value for _btn_accordion_config_elements
   *
   * @memberof Class_MenuConfig
   */
  public set btn_accordion_config_elements(value: RefObject<HTMLButtonElement>) {
    this._btn_accordion_config_elements = value
  }

  /**
 * Get value of _btn_accordion_config_node
 *
 * @type {RefObject<HTMLButtonElement>}
 * @memberof Class_MenuConfig
 */
  public get btn_accordion_config_node(): RefObject<HTMLButtonElement> {
    return this._btn_accordion_config_node
  }

  /**
   * Set value for _btn_accordion_config_node
   *
   * @memberof Class_MenuConfig
   */
  public set btn_accordion_config_node(value: RefObject<HTMLButtonElement>) {
    this._btn_accordion_config_node = value
  }

}