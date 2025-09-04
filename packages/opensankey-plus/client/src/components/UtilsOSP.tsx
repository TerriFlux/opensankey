// External libs
import React, {
  ChangeEvent,
  FC,
  useRef,
  useState
} from 'react'

import {
  Box,
  Checkbox,
  Button,
  Input
} from '@chakra-ui/react'


// OpenSankey imports
import {
  getBooleanFromJSON,
  getJSONOrUndefinedFromJSON,
  getNumberOrUndefinedFromJSON,
  getStringFromJSON,
  Type_JSON
} from '../deps/OpenSankey/types/Utils'

import { ConfigMenuNumberInput } from '../deps/OpenSankey/components/configmenus/SankeyMenuConfiguration'

import { default_container_content } from '../deps/OpenSankey/Elements/TextZone'
import { OSPData, ViewType } from '../types/LegacyTypes'


import { GetOldDataFromView } from './ConvertOSP'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'
import { Class_DataTagGroup } from '../deps/OpenSankey/types/TagGroup'
import { CustomFaEyeCheckIcon, OSTooltip } from '../deps/OpenSankey/components/configmenus/MenuCommon'

export const ImportImageAsSvgBg = ({
  new_data_plus,
}:{
  new_data_plus: Class_ApplicationDataOSP
}) => {
  const _load_image = useRef<HTMLInputElement>(null)
  const [, setCount] = useState(0)
  new_data_plus.menu_configuration_osp.ref_to_config_DA_bg_image_updater.current = () => setCount(a => a + 1)

  const { drawing_area, t, has_sankey_plus, icon_library } = new_data_plus
  const { icon_import_file_image } = icon_library
  const content_image = <>
    {/* Import image */}
    <Box
      as='span'
      layerStyle='menuconfigpanel_row_2cols'
    >
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={drawing_area.show_background_image}
        isDisabled={!has_sankey_plus}
        icon={<CustomFaEyeCheckIcon />}
        onChange={(evt) => {
          drawing_area.show_background_image = evt.target.checked
          drawing_area.drawBgImage()
          setCount(a => a + 1)
        }}
      >
        {t('MEP.show_image')}
      </Checkbox>
      <OSTooltip label={!has_sankey_plus ? t('Menu.sankeyOSPDisabled') : ''} >
        <Box>
          <Button
            variant='menuconfigpanel_button_load_file_da_bg'
            isDisabled={!drawing_area.show_background_image || !has_sankey_plus}
            onClick={() => {
              if (_load_image.current) {
                _load_image.current.name = ''
                _load_image.current.click()
              }
            }}
          >
            {icon_import_file_image}
          </Button>
          <Input
            ref={_load_image}
            style={{ display: 'none' }}
            accept='image/*'
            type="file"
            value={''}
            disabled={!has_sankey_plus}
            onChange={(evt: ChangeEvent) => {
              const files = (evt.target as HTMLFormElement).files
              const reader = new FileReader()
              reader.onload = (() => {
                return (e: ProgressEvent<FileReader>) => {
                  const resultat = (e.target as FileReader).result
                  const res = resultat?.toString().replaceAll('=', '')
                  drawing_area.background_image = (res as string)
                  drawing_area.drawBgImage()
                }
              })()
              reader.readAsDataURL(files[0])
            }}
          />
        </Box>
      </OSTooltip>
    </Box>
  </>
  return content_image
}



export const convert_data_plus_legacy = (json_object: Type_JSON) => {
  const containers = getJSONOrUndefinedFromJSON(json_object, 'labels')
  if (containers) {
    // Convert name of variable from legacy Free label to variable name of new Free labels
    Object.values(containers).forEach(el => {
      const cont = el as Type_JSON

      if (cont.name !== undefined) {
        cont.content = cont.name as string
        if (!cont.content.includes('<p')) {
          if (cont.font_uppercase && !cont.content.includes('ql-align-center')) {
            cont.content = cont.content.toUpperCase()
          }

          if (cont.font_weight) {
            cont.content = cont.content ? '<strong>' + cont.content + '</strong>' : ''
          }
          if (cont.position_horiz === 'gauche') {
            cont.content = cont.content ? '<p class="ql-align-left">' + cont.content + '</p>' : ''
          }
          if (cont.position_horiz === 'centre') {
            cont.content = cont.content ? '<p class="ql-align-center">' + cont.content + '</p>' : ''
          }
          if (cont.position_horiz === 'droite') {
            cont.content = cont.content ? '<p class="ql-align-right">' + cont.content + '</p>' : ''
          }
        }
      }

      const container_content = getStringFromJSON(cont, 'content', default_container_content)
      const container_opacity = getBooleanFromJSON(cont, 'transparent', false)
      const container_opacity_int = getNumberOrUndefinedFromJSON(cont, 'opacity')
      if (container_opacity_int !== undefined) {
        cont['opacity'] = container_opacity_int
      } else if (container_opacity) {
        cont['opacity'] = 0
      } else {
        cont['opacity'] = 100
      }
      cont['content'] = container_content

    })
    json_object.labels = Object.fromEntries(
      Object.entries(containers).reverse()
    )
  }


  const old_views = getOldViewsFromJSON(json_object, 'view') as ViewType[]
  if (old_views && old_views.length > 0) {
    json_object.views = {} as Type_JSON
    // Convert old views
    old_views.forEach((v) => {
      if (v.heredited_attr_from_master === undefined) {
        v.heredited_attr_from_master = []
      }
      // Convert old views that are diff to json
      console.log('GetOldDataFromView ',v.nom)
      const d_view = GetOldDataFromView(json_object as unknown as OSPData, v.id)
      if (d_view) {
        (json_object.views as Type_JSON)[v.id] = d_view as unknown as Type_JSON
      }

      // Set Name of view
      ((json_object.views as Type_JSON)[v.id] as Type_JSON).name = v.nom;
      // Set heredited from master attr
      ((json_object.views as Type_JSON)[v.id] as Type_JSON).heredited_attr = v.heredited_attr_from_master
    })
    delete json_object.view
  }
}

export function getArrayFromJSON(
  json_object: Type_JSON,
  key: string,
  fallback_value: Array<ViewType>
) {
  if (json_object[key] && typeof json_object[key] === typeof fallback_value) {
    return json_object[key]
  }
  return fallback_value
}


export function getOldViewsFromJSON(
  json_object: Type_JSON,
  key: string
) {
  if (json_object[key]) {
    const _ = getArrayFromJSON(json_object, key, [])
    if (Object.keys(_).length > 0)
      return _
  }
  return undefined
}

/**
 * Create an array of string, it return a list from start to stop (at a pace of step)
 * with suffix 'px'
 *
 * @param {number} start
 * @param {number} stop
 * @param {number} step
 */
const arrayRangePx = (start: number, stop: number, step: number) => Array.from({ length: (stop - start) / step + 1 }, (value, index) => (start + index * step) + 'px')

// Exported variable for Quill editor
export const listOptionSizeQuill = arrayRangePx(9, 120, 1)
