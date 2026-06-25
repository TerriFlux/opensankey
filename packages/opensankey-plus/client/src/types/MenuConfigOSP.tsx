import { MutableRefObject, useRef } from 'react'
import { Class_MenuConfig, keyTypeConfig, keyTypeElements } from '../deps/OpenSankey/types/MenuConfig'
import { Class_NodeElement } from '../deps/OpenSankey/Elements/Node'
import { OSPShowMenuComponentsVarType } from './LegacyTypes'

export type keyTypeConfigOSP = keyTypeConfig | 'presentation'
export type keyTypeElementsOSP = keyTypeElements | 'data_tag' | 'tag_flow' | 'tag_node' | 'view'
export class Class_MenuConfigOSP extends Class_MenuConfig {
  // OSP inserts the Vues/AFM/edit group after the OS document group, pushes the
  // "Aide" dropdown after it, and isolates the view NAVIGATION (Préc./sélecteur/
  // Suiv.) in its own block at the very end (after Aide). The "Vues" management
  // dropdown stays in the main group; only the navigation trails after Aide.
  protected override _menu_top_order = [
    ...super.menu_top_order.filter(group => !group.includes('aide')),
    ['diagrams', 'views', 'afm', 'edit'],
    ['aide'],
    ['views_nav', 'data_tag_topbar'],
  ]
  private _dict_setter_show_dialog_plus: OSPShowMenuComponentsVarType

  private _ref_to_node_hyperlink_updater: MutableRefObject<(() => void)>

  private _ref_to_btn_top_pref_updater: MutableRefObject<(() => void)>

  private _ref_to_config_DA_bg_image_updater: MutableRefObject<(() => void)>
  private _ref_to_banner_views_updater: MutableRefObject<() => void>
  // Updater de la navigation entre vues (Préc./sélecteur/Suiv.), rendue dans un
  // bloc topbar distinct du menu déroulant « Vues » (cf. BannerViewNavOSP).
  private _ref_to_banner_view_nav_updater: MutableRefObject<() => void>
  private _ref_to_banner_views_opened: MutableRefObject<boolean>
  private _ref_to_views_config_updater: MutableRefObject<() => void>
  private _ref_to_modal_view_attributes_switcher: MutableRefObject<(_: boolean) => void>
  private _ref_to_modal_view_attr_updater: MutableRefObject<() => void>

  private _ref_show_modal_unitary_view: MutableRefObject<(_: boolean) => void>
  private _ref_update_modal_unitary_view: MutableRefObject<() => void>

  // Reconstruction du board sankey unitaire (ModalUnitarySankeyOSP) quand les valeurs
  // de la source changent (ex. changement de data tag sélectionné). Distinct de
  // _ref_update_modal_unitary_view (modale de VUE unitaire, cf. SankeyPlusViews).
  private _ref_to_unitary_board_data_tag_updater: MutableRefObject<() => void>

  // Ouvre le modal draggable du sankey unitaire (rendu détaché), EN PLUS du
  // diagramme principal (cf. ModalUnitarySankeyOSP). node = nœud central, ou null
  // pour ouvrir sans présélection (le modal prend alors le 1er nœud visible).
  private _ref_open_unitary_sankey_modal: MutableRefObject<(node: Class_NodeElement | null) => void>

  private _ref_show_modal_animated_export: MutableRefObject<(_: boolean) => void>

  // Ouvre le panneau de publication d'un site statique autonome (zip).
  private _ref_show_modal_publish: MutableRefObject<(_: boolean) => void>

  constructor() {
    super()

    this._ref_to_banner_views_updater = useRef(() => null)
    this._ref_to_banner_view_nav_updater = useRef(() => null)
    this._ref_to_banner_views_opened = useRef(false)
    this._ref_to_views_config_updater = useRef(() => null)

    this._ref_to_modal_view_attributes_switcher = useRef((_: boolean) => null)
    this._ref_to_modal_view_attr_updater = useRef(() => null)
    this._ref_show_modal_unitary_view = useRef((_: boolean) => null)
    this._ref_update_modal_unitary_view = useRef(() => null)
    this._ref_to_unitary_board_data_tag_updater = useRef(() => null)
    this._ref_open_unitary_sankey_modal = useRef((_: Class_NodeElement | null) => null)
    this._ref_show_modal_animated_export = useRef((_: boolean) => null)
    this._ref_show_modal_publish = useRef((_: boolean) => null)

    this._ref_to_btn_top_pref_updater = useRef(() => null)
    this._ref_to_node_hyperlink_updater = useRef(() => null)
    this._ref_to_config_DA_bg_image_updater = useRef(() => null)

    this._dict_setter_show_dialog_plus = {ref_setter_show_menu_view_not_saved: useRef(() => null)}

    //this._style_config.data.elements_configurable.push('data_tag')
    this._style_config.presentation.elements_configurable.push('level_tag')
  }

  updateAllMenuComponents(): void {
    super.updateAllMenuComponents()
    this.updateComponentRelatedToContainers()
    this.updateComponentRelatedToViews()
    this._ref_to_config_DA_bg_image_updater.current()
    this._ref_to_btn_top_pref_updater.current()
  }

  public updateComponentRelatedToViews() {
    this._ref_to_banner_views_updater.current()
    this._ref_to_banner_view_nav_updater.current()
    this._ref_to_views_config_updater.current()
    this._ref_to_modal_view_attr_updater.current()
    this.updateComponentSaveDiagramJSON()
    this.updateComponentLoadDiagramJSON()
  }

  public override updateAllComponentsRelatedToNodesConfig() {
    super.updateAllComponentsRelatedToNodesConfig()
    this._ref_to_node_hyperlink_updater.current()
  }

  public override updateAllComponentsRelatedToNodeTags() {
    super.updateAllComponentsRelatedToNodeTags()
    this._ref_update_modal_unitary_view.current()
  }

  // Le changement de data tag (sélecteur topbar, cf. BannerDataTagTopbar) modifie les
  // valeurs de flux de la source : le board unitaire doit être reconstruit pour les
  // refléter. OS base ne connaît pas ce board → on branche ici, côté OSP.
  public override updateAllComponentsRelatedToDataTags() {
    super.updateAllComponentsRelatedToDataTags()
    this._ref_to_unitary_board_data_tag_updater.current()
  }

  public override updateAllComponentsRelatedToLevelTags() {
    super.updateAllComponentsRelatedToLevelTags()
    this._ref_update_modal_unitary_view.current()
  }

  public updateComponentRelatedToLinksData() {
    this.ref_to_menu_config_links_data_updater.current()
    this.updateSpreadsheet()
    this.ref_to_menu_contextual_config_links_data_updater.current()
  }

  public get dict_setter_show_dialog_plus(): OSPShowMenuComponentsVarType { return this._dict_setter_show_dialog_plus }
  public get ref_to_banner_views_updater(): MutableRefObject<() => void> { return this._ref_to_banner_views_updater }
  public get ref_to_banner_view_nav_updater(): MutableRefObject<() => void> { return this._ref_to_banner_view_nav_updater }
  public get ref_to_banner_views_opened() { return this._ref_to_banner_views_opened }
  public get ref_to_views_config_updater(): MutableRefObject<() => void> { return this._ref_to_views_config_updater }
  public get ref_to_modal_view_attributes_switcher(): MutableRefObject<(_: boolean) => void> { return this._ref_to_modal_view_attributes_switcher }
  public get ref_to_modal_view_attr_updater(): MutableRefObject<() => void> { return this._ref_to_modal_view_attr_updater }
  public get ref_show_modal_unitary_view(): MutableRefObject<(_: boolean) => void> { return this._ref_show_modal_unitary_view }
  public get ref_update_modal_unitary_view(): MutableRefObject<() => void> { return this._ref_update_modal_unitary_view }
  public get ref_to_unitary_board_data_tag_updater(): MutableRefObject<() => void> { return this._ref_to_unitary_board_data_tag_updater }
  public get ref_open_unitary_sankey_modal(): MutableRefObject<(node: Class_NodeElement | null) => void> { return this._ref_open_unitary_sankey_modal }
  public get ref_show_modal_animated_export(): MutableRefObject<(_: boolean) => void> { return this._ref_show_modal_animated_export }
  public get ref_show_modal_publish(): MutableRefObject<(_: boolean) => void> { return this._ref_show_modal_publish }

  public get ref_to_node_hyperlink_updater(): MutableRefObject<(() => void)> { return this._ref_to_node_hyperlink_updater }

  public get ref_to_config_DA_bg_image_updater() { return this._ref_to_config_DA_bg_image_updater }
  public get ref_to_btn_top_pref_updater() { return this._ref_to_btn_top_pref_updater }
}