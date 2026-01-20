
import {
  default_main_sankey_id,
  getStringFromJSON,
  Type_JSON
} from '../deps/OpenSankey/types/Utils'
import { convert_data_plus_legacy, getArrayFromJSON } from '../components/UtilsOSP'
import { Class_DrawingArea } from '../deps/OpenSankey/types/DrawingArea'
import { Class_ApplicationDataOSP } from './ApplicationDataOSP'
import { DrawingAreaPersistence } from '../deps/OpenSankey/Persistence/SankeyPersistence'

export class Class_DrawingAreaOSP extends Class_DrawingArea {
  public application_data: Class_ApplicationDataOSP
  private _heredited_attr: string[] = []

  constructor(
    application_data: Class_ApplicationDataOSP,
    id: string = default_main_sankey_id
  ) {
    super(application_data, id)
    this.application_data = application_data as Class_ApplicationDataOSP
  }

  public delete() {
    super.delete()
    // Override also relations with views
    this._heredited_attr = []
    this.application_data.deleteView(this.id)
  }

  public _copyAttrFrom(drawing_area_to_copy: Class_DrawingArea) {
    // Call heredited method
    super._copyAttrFrom(drawing_area_to_copy as Class_DrawingArea)
    // Name
    this.name = drawing_area_to_copy.name

    const drawing_area_osp = drawing_area_to_copy as unknown as Class_DrawingAreaOSP
    // Attr for views
    this._heredited_attr = Object.assign([], drawing_area_osp._heredited_attr)
  }

  public get id() { return this._sankey.id }
  public get name() { return this._sankey.name }
  public set name(name: string) { this._sankey.name = name }

  public get heredited_attr(): string[] { return this._heredited_attr }
}

export class DrawingAreaPersistenceOSP extends DrawingAreaPersistence {

  public static toJSON(drawing_area: Class_DrawingAreaOSP, kwargs?: Type_JSON) {
    const json_entry: Type_JSON = super.toJSON(drawing_area, kwargs)

    if (drawing_area.name != default_main_sankey_id) json_entry['name'] = drawing_area.name
    if (Object.keys(drawing_area.heredited_attr).length > 0) json_entry['heredited_attr'] = drawing_area.heredited_attr
    return json_entry
  }
  public static fromJSON_pre_0_9(
    drawing_area: Class_DrawingArea,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    convert_data_plus_legacy(json_object)
    super.fromJSON_pre_0_9(drawing_area, json_object, kwargs)
  }

  public static fromJSON_0_9(
    drawing_area: Class_DrawingArea,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super.fromJSON_0_9(drawing_area, json_object, kwargs)
  }

  public static fromJSON_0_91(
    drawing_area: Class_DrawingArea,
    json_object: Type_JSON,
    kwargs?: Type_JSON
  ) {
    super.fromJSON_0_91(drawing_area, json_object, kwargs)
  }

  public static fromJSON(drawing_area: Class_DrawingAreaOSP, json_object: Type_JSON, kwargs?: Type_JSON): void {
    super.fromJSON(drawing_area, json_object, kwargs)

    drawing_area['name'] = getStringFromJSON(json_object, 'name', drawing_area.name)
    drawing_area['_heredited_attr'] = getArrayFromJSON(json_object, 'heredited_attr', []) as string[]
  }
}