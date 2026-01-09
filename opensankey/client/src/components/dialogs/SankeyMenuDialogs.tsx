// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

import React, { useState, } from 'react'
import {Box,Button,Input} from '@chakra-ui/react'
import { Type_JSON } from '../../types/Utils'
import { MenuDraggable } from '../topmenus/SankeyMenus'
import { OSTooltip } from '../configmenus/MenuCommon'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { DecompressedJSONData, decompressUploadedFileUniversal, detectCompressionType } from '../../Persistence/UniversalJSONCompression'
import { updateFrom } from '../../Algorithms/UpdateFrom'
import { DrawingAreaPersistence } from '../../Persistence/SankeyPersistence'


/**
 *
 * @param  { ref_setter_show_modal_apply_layout, set_show_apply_layout, sankey_data, set_sankey_data }
 * @returns {*}
 */
export const ApplyLayoutDialog = ({
  new_data
}: {
  new_data: Class_ApplicationData
}) => {
  const { data_var_to_update, t, menu_configuration } = new_data
  const { ref_to_updater_modal_apply_layout } = menu_configuration

  const [, setForceUpdate] = useState(true)
  const [mode_trans, set_mode_trans] = useState('simple')

  ref_to_updater_modal_apply_layout.current = () => setForceUpdate(b => !b)

  const simple_element_to_transform = [
    'posNode', 'posFlux',
    'attrNode', 'attrFlux',
    'attrDrawingArea'
  ]
  const default_element_to_transform = [
    'posNode', 'posFlux',
    'attrNode', 'attrFlux',
    'attrDrawingArea'
  ]

  const content_modal_layout = <Box layerStyle='menuconfigpanel_grid' >
    {OpenSankeyDiagramSelector(new_data)}

    <hr style={{ borderStyle: 'none', margin: '10px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Menu.choseTransforDifficulty')}
      </Box>
      <Box layerStyle='options_3cols' >
        <Button variant={mode_trans == 'simple' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'} onClick={() => { set_mode_trans('simple'); new_data.menu_configuration.ref_to_menu_updater.current() }}>Basiques</Button>
        <Button variant={mode_trans == 'expert' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'} onClick={() => { set_mode_trans('expert'); new_data.menu_configuration.ref_to_menu_updater.current() }}>Tous</Button>
      </Box>
    </Box>

    <OSTooltip label={t('Menu.Transformation.tooltips.Shortcuts')}>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Shortcuts')}</Box>
        <Box layerStyle='options_4cols' >

          <Button
            variant='menuconfigpanel_option_button'
            onClick={() => {
              data_var_to_update.length = 0
              menu_configuration.updateComponentApplyLayout()
            }}
          >{t('Menu.Transformation.unSelectAll')}</Button>
          <Button
            variant='menuconfigpanel_option_button'
            onClick={() => {
              data_var_to_update.length = 0
              if (mode_trans === 'simple') {
                simple_element_to_transform.forEach(el => data_var_to_update.push(el))
              } else {
                new_data.transform_layout_all_attr.forEach(el => data_var_to_update.push(el))
              }
              menu_configuration.updateComponentApplyLayout()
            }}
          >{t('Menu.Transformation.selectAll')}</Button>
          <Button
            variant='menuconfigpanel_option_button'
            onClick={() => {
              data_var_to_update.length = 0
              default_element_to_transform.forEach(el => data_var_to_update.push(el))
              menu_configuration.updateComponentApplyLayout()
            }}
          >{t('Menu.Transformation.selectDefault')}</Button>

        </Box>
      </Box>
    </OSTooltip>

    {mode_trans != 'simple' ?
      <OSTooltip label={t('Menu.Transformation.tooltips.Topology')}>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Topology')}</Box>
          <Box layerStyle='options_4cols' >
            <Button
              variant={data_var_to_update.includes('addNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                if (!data_var_to_update.includes('addNode')) {
                  data_var_to_update.push('addNode')
                  menu_configuration.updateComponentApplyLayout()
                } else {
                  data_var_to_update.splice(data_var_to_update.indexOf('addNode'), 1)
                  menu_configuration.updateComponentApplyLayout()
                }
              }
              }
            >{t('Menu.Transformation.addNode')}</Button>
            <Button
              variant={data_var_to_update.includes('removeNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                if (!data_var_to_update.includes('removeNode')) {
                  data_var_to_update.push('removeNode')
                  menu_configuration.updateComponentApplyLayout()
                } else {
                  data_var_to_update.splice(data_var_to_update.indexOf('removeNode'), 1)
                  menu_configuration.updateComponentApplyLayout()
                }
              }
              }
            >{t('Menu.Transformation.removeNode')}</Button>
            <Button
              variant={data_var_to_update.includes('addFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                if (!data_var_to_update.includes('addFlux')) {
                  data_var_to_update.push('addFlux')
                  menu_configuration.updateComponentApplyLayout()
                } else {
                  data_var_to_update.splice(data_var_to_update.indexOf('addFlux'), 1)
                  menu_configuration.updateComponentApplyLayout()
                }
              }
              }>{t('Menu.Transformation.addFlux')}</Button>
            <Button
              variant={data_var_to_update.includes('removeFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                if (!data_var_to_update.includes('removeFlux')) {
                  data_var_to_update.push('removeFlux')
                  menu_configuration.updateComponentApplyLayout()
                } else {
                  data_var_to_update.splice(data_var_to_update.indexOf('removeFlux'), 1)
                  menu_configuration.updateComponentApplyLayout()
                }
              }
              }>{t('Menu.Transformation.removeFlux')}</Button>
          </Box>
        </Box></OSTooltip> : <></>}

    {/* Taille et pos des noeud/flux */}
    <OSTooltip label={t('Menu.Transformation.tooltips.Geometry')}  >
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Geometry')}</Box>
        <Box layerStyle='options_4cols' >
          <Button
            variant={data_var_to_update.includes('posNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
            onClick={() => {
              if (!data_var_to_update.includes('posNode')) {
                data_var_to_update.push('posNode')
                menu_configuration.updateComponentApplyLayout()
              } else {
                data_var_to_update.splice(data_var_to_update.indexOf('posNode'), 1)
                menu_configuration.updateComponentApplyLayout()
              }
            }
            }>{t('Menu.Transformation.PosNoeud')}</Button>
          <Button
            variant={data_var_to_update.includes('posFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
            onClick={() => {
              if (!data_var_to_update.includes('posFlux')) {
                data_var_to_update.push('posFlux')
                menu_configuration.updateComponentApplyLayout()
              } else {
                data_var_to_update.splice(data_var_to_update.indexOf('posFlux'), 1)
                menu_configuration.updateComponentApplyLayout()
              }
            }
            }> {t('Menu.Transformation.posFlux')}</Button>
        </Box>

      </Box>
    </OSTooltip>

    {/* Valeur des flux */}
    {mode_trans != 'simple' ?
      <OSTooltip label={t('Menu.Transformation.tooltips.Values')}>
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Values')}</Box>
          <Box layerStyle='options_4cols' >
            <Button
              variant={data_var_to_update.includes('Values') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                if (!data_var_to_update.includes('Values')) {
                  data_var_to_update.push('Values')
                  // Also need dataTags because we can't only import values without the structur of dataTags
                  // (but we can import dataTags without values)
                  if (!data_var_to_update.includes('tagData')) {
                    data_var_to_update.push('tagData')
                  }
                  menu_configuration.updateComponentApplyLayout()
                } else {
                  data_var_to_update.splice(data_var_to_update.indexOf('Values'), 1)
                  menu_configuration.updateComponentApplyLayout()
                }
              }
              }
            >{data_var_to_update.includes('Values') ? new_data.icon_library.icon_activated : new_data.icon_library.icon_unactivated}</Button>
          </Box>
        </Box></OSTooltip> : <></>}

    <OSTooltip label={t('Menu.Transformation.tooltips.Attribut')} >
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'><Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Attribut')}</Box>
        <Box layerStyle='options_4cols' >
          <Button
            variant={data_var_to_update.includes('attrNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
            onClick={() => {
              if (!data_var_to_update.includes('attrNode')) {
                data_var_to_update.push('attrNode')
                menu_configuration.updateComponentApplyLayout()

              } else {
                data_var_to_update.splice(data_var_to_update.indexOf('attrNode'), 1)
                menu_configuration.updateComponentApplyLayout()
              }
            }
            }
          >{t('Menu.Transformation.attrNode')}</Button>
          <Button
            variant={data_var_to_update.includes('attrFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
            onClick={() => {
              if (!data_var_to_update.includes('attrFlux')) {
                data_var_to_update.push('attrFlux')
                menu_configuration.updateComponentApplyLayout()
              } else {
                data_var_to_update.splice(data_var_to_update.indexOf('attrFlux'), 1)
                menu_configuration.updateComponentApplyLayout()
              }
            }
            }
          >{t('Menu.Transformation.attrFlux')}</Button>
        </Box>
      </Box></OSTooltip>

    {/* Etiquette */}
    {mode_trans == 'expert' ?
      <OSTooltip label={t('Menu.Transformation.tooltips.Tags')} >
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.Tags')}</Box>
          <Box layerStyle='options_4cols' >
            <Button
              variant={data_var_to_update.includes('tagNode') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                if (!data_var_to_update.includes('tagNode')) {
                  data_var_to_update.push('tagNode')
                  menu_configuration.updateComponentApplyLayout()
                } else {
                  data_var_to_update.splice(data_var_to_update.indexOf('tagNode'), 1)
                  menu_configuration.updateComponentApplyLayout()

                }
              }
              }
            >{t('Menu.Transformation.tagNode')}</Button>
            <Button
              variant={data_var_to_update.includes('tagFlux') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                if (!data_var_to_update.includes('tagFlux')) {
                  data_var_to_update.push('tagFlux')
                  menu_configuration.updateComponentApplyLayout()
                } else {
                  data_var_to_update.splice(data_var_to_update.indexOf('tagFlux'), 1)
                  menu_configuration.updateComponentApplyLayout()
                }
              }
              }
            >{t('Menu.Transformation.tagFlux')}</Button>
            <Button
              variant={data_var_to_update.includes('tagData') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                if (!data_var_to_update.includes('tagData')) {
                  data_var_to_update.push('tagData')
                  menu_configuration.updateComponentApplyLayout()
                } else if (!data_var_to_update.includes('Values')) {
                  data_var_to_update.splice(data_var_to_update.indexOf('tagData'), 1)
                  menu_configuration.updateComponentApplyLayout()
                }
              }
              }
            >{t('Menu.Transformation.tagData')}</Button>
          </Box>
        </Box></OSTooltip> : <></>}

    {/* Aggrégation */}
    {mode_trans == 'expert' ?
      <OSTooltip label={t('Menu.Transformation.tooltips.tagLevel')} >
        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.tagLevel')}</Box>
          <Box layerStyle='options_4cols' >
            <Button
              variant={data_var_to_update.includes('tagLevel') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                if (!data_var_to_update.includes('tagLevel')) {
                  data_var_to_update.push('tagLevel')
                  menu_configuration.updateComponentApplyLayout()
                } else {
                  data_var_to_update.splice(data_var_to_update.indexOf('tagLevel'), 1)
                  menu_configuration.updateComponentApplyLayout()
                }
              }
              }
            >{data_var_to_update.includes('tagLevel') ? new_data.icon_library.icon_activated : new_data.icon_library.icon_unactivated}</Button>
          </Box>
        </Box></OSTooltip> : <></>}

    <OSTooltip label={t('Menu.Transformation.tooltips.attrDrawingArea')} >
      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.attrGeneral')}</Box>
        <Box layerStyle='options_4cols' >
          <Button
            variant={data_var_to_update.includes('attrDrawingArea') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
            onClick={() => {
              if (!data_var_to_update.includes('attrDrawingArea')) {
                data_var_to_update.push('attrDrawingArea')
                menu_configuration.updateComponentApplyLayout()
              } else {
                data_var_to_update.splice(data_var_to_update.indexOf('attrDrawingArea'), 1)
                menu_configuration.updateComponentApplyLayout()
              }
            }
            }
          >{data_var_to_update.includes('attrDrawingArea') ? new_data.icon_library.icon_activated : new_data.icon_library.icon_unactivated}</Button>
        </Box>
      </Box></OSTooltip>
    {mode_trans == 'expert' ? <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Transformation.freeLabels')}</Box>
      <Box layerStyle='options_4cols' >
        <Button
          variant={data_var_to_update.includes('freeLabels') ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
          onClick={() => {
            if (!data_var_to_update.includes('freeLabels')) {
              data_var_to_update.push('freeLabels')
            } else {
              data_var_to_update.splice(data_var_to_update.indexOf('freeLabels'), 1)
            }
            menu_configuration.updateComponentApplyLayout()
          }
          }
        >{data_var_to_update.includes('freeLabels') ? new_data.icon_library.icon_activated : new_data.icon_library.icon_unactivated}</Button>
      </Box>
    </Box> : <></>}
  </Box>

  const dragLayout = <MenuDraggable
    dict_hook_ref_setter_show_dialog_components={new_data.menu_configuration.dict_setter_show_dialog}
    dialog_name={'ref_setter_show_modal_apply_layout'}
    content={content_modal_layout}
    title={t('Menu.Transformation.title')}
  />
  return dragLayout

}

export const OpenSankeyDiagramSelector = (app_data: Class_ApplicationData) => {
  const { t, data_var_to_update } = app_data
  const [file_layout, set_file_layout] = useState<FileList | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileLoad = async () => {
    if (!file_layout || file_layout.length === 0) {
      console.warn('Aucun fichier sélectionné')
      return
    }

    const file = file_layout[0]
    setIsProcessing(true)

    try {
      console.log(`📁 Traitement du fichier: ${file.name}`)

      // Détecter le type de compression
      const compressionType = detectCompressionType(file.name)
      console.log(`🔍 Type de compression détecté: ${compressionType}`)

      // Décompresser et parser le fichier
      const json_object: DecompressedJSONData = await decompressUploadedFileUniversal(file)

      console.log('✅ Fichier traité avec succès, application des données...')

      // Appliquer les données comme dans votre code original
      const tmp_DA = app_data.createNewDrawingArea()
      tmp_DA.bypass_redraws = true
      DrawingAreaPersistence.fromJSON(tmp_DA,json_object as Type_JSON)
      tmp_DA.afterFromJSON()
      app_data.drawing_area.bypass_redraws = true
      updateFrom(app_data.drawing_area,tmp_DA, data_var_to_update)
      app_data.drawing_area.draw()
      console.log('✅ Données appliquées avec succès')

    } catch (error) {
      console.error('❌ Erreur lors du traitement du fichier:', error)

      // Optionnel: afficher une notification d'erreur à l'utilisateur
      // Vous pouvez adapter selon votre système de notifications
      alert(`Erreur lors du chargement du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)

    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Box>
      <Box as='span' layerStyle='menuconfigpanel_part_title_2'>
        {t('Menu.Transformation.fmep')}
      </Box>
      <Box layerStyle='menuconfigpanel_row_2cols'>
        <Input
          type="file"
          aria-label=''
          accept=".json,.json.gz,.json.zip,.json.br,.json.deflate,.gz,.zip,.br,.deflate"
          onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
            set_file_layout(evt.target.files)
          }
        />
        <Box layerStyle='options_2cols'>
          <Button
            variant='menuconfigpanel_option_button'
            onClick={handleFileLoad}
            isLoading={isProcessing}
            loadingText="Traitement..."
            disabled={!file_layout || file_layout.length === 0}
          >
            {t('Menu.Transformation.ad')}
          </Button>
          <Button
            variant='menuconfigpanel_option_button'
            onClick={() => {
              // set_sankey_data(JSON.parse(JSON.stringify(prev_sankey_data)))
            }}
          >
            {t('Menu.Transformation.undo')}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}