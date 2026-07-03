
import {
  default_main_sankey_id,
  getStringFromJSON,
  Type_JSON
} from '../deps/OpenSankey/types/Utils'
import { convert_data_plus_legacy } from '../components/UtilsOSP'
import { Class_DrawingArea } from '../deps/OpenSankey/types/DrawingArea'
import { Class_ApplicationDataOSP } from './ApplicationDataOSP'
import { DrawingAreaPersistence } from '../deps/OpenSankey/Persistence/SankeyPersistence'

export class Class_DrawingAreaOSP extends Class_DrawingArea {
  public application_data: Class_ApplicationDataOSP

  constructor(
    application_data: Class_ApplicationDataOSP,
    id: string = default_main_sankey_id
  ) {
    super(application_data, id)
    this.application_data = application_data as Class_ApplicationDataOSP
  }

  public delete() {
    super.delete()
    this.application_data.deleteView(this.id)
  }

  public _copyAttrFrom(drawing_area_to_copy: Class_DrawingArea) {
    super._copyAttrFrom(drawing_area_to_copy as Class_DrawingArea)
    this.name = drawing_area_to_copy.name
  }

  public get id() { return this._sankey.id }
  public get name() { return this._sankey.name }
  public set name(name: string) { this._sankey.name = name }
}

export class DrawingAreaPersistenceOSP extends DrawingAreaPersistence {

  public static toJSON(drawing_area: Class_DrawingAreaOSP, kwargs?: Type_JSON) {
    const json_entry: Type_JSON = super.toJSON(drawing_area, kwargs)
    if (drawing_area.name != default_main_sankey_id) json_entry['name'] = drawing_area.name
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
  }
}
