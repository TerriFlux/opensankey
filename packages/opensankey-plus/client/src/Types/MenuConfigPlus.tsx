import { Class_MenuConfig } from 'open-sankey/dist/types/MenuConfig'
import { MutableRefObject, Dispatch, SetStateAction, useRef, RefObject } from 'react'
import { OSPShowMenuComponentsVarType } from '../../types/Types'
import * as d3 from 'd3'

export class Class_MenuConfigPlus extends Class_MenuConfig {
  private _dict_setter_show_dialog_plus: OSPShowMenuComponentsVarType
  private _ref_to_menu_config_free_label_updater: MutableRefObject<(() => void)>
  // Button that open the sub menu links of elements
  private _zdt_accordion_ref: RefObject<HTMLButtonElement>



  constructor() {
    super()

    // Init value for menu_config plus variable
    this._ref_to_menu_config_free_label_updater = useRef(() => null)
    this._zdt_accordion_ref = useRef<HTMLButtonElement>(null)

    this._dict_setter_show_dialog_plus = {
      ref_setter_show_menu_node_icon: useRef(() => null),
      ref_setter_show_modal_import_icons: useRef(() => null),
      ref_setter_show_menu_zdt: useRef(() => null),
      ref_setter_show_modal_transparent_view_attr: useRef<() => void>(() => null),

    }
  }

  //PUBLIC METHODS =====================================
  public OpenConfigMenuElementsFreeLabels() {
    this.OpenConfigMenuElements()
    this._zdt_accordion_ref.current?.click()
    // Leave enough time for menus to open
    setTimeout(() => {
      // Open Free labels element menu
      if (
        this._zdt_accordion_ref.current &&
        (d3.select(this._zdt_accordion_ref.current).attr('aria-expanded') === 'false')
      ) {
        this._zdt_accordion_ref.current.click()
      }
    }, 200)
  }


  // ============GETTER && SETTER ==================

  public get zdt_accordion_ref(): RefObject<HTMLButtonElement> { return this._zdt_accordion_ref }

  public get dict_setter_show_dialog_plus(): OSPShowMenuComponentsVarType { return this._dict_setter_show_dialog_plus }
  // public set dict_setter_show_dialog_plus(value: OSPShowMenuComponentsVarType) {this._dict_setter_show_dialog_plus = value;}

  public get ref_to_menu_config_free_label_updater(): MutableRefObject<(() => void)> { return this._ref_to_menu_config_free_label_updater }
  public set ref_to_menu_config_free_label_updater(value: MutableRefObject<(() => void)>) { this._ref_to_menu_config_free_label_updater = value }
}