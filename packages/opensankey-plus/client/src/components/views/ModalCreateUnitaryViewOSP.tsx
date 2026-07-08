// Standard libs
import React, { ChangeEvent, FC, useRef, useState, useEffect } from 'react'
import {
  Box,
  CloseButton,
  Input,
  Button,
  Spinner,
  Text,
  useToast,
} from '@chakra-ui/react'

// OpenSankey Libs
import { makeId, Type_JSON } from '@terriflux/opensankey/src/types/Utils'
import { OSMultiSelect, typeElementSelectable, OSTooltip } from '@terriflux/opensankey/src/components/configmenus/MenuCommon'
import { Class_DrawingAreaOSP, DrawingAreaPersistenceOSP } from '../../types/DrawingAreaOSP'
import { Class_NodeElement } from '@terriflux/opensankey/src/Elements/Node'
import { Class_ApplicationDataOSP } from '../../types/ApplicationDataOSP'
import { LevelTagFilter } from '@terriflux/opensankey/src/components/topmenus/Toolbar'
import { decompressGzipDataFixed } from '@terriflux/opensankey/src/Persistence/UniversalJSONCompression'
import { createUnitaryNewView } from '../UnitaryBoard'
import { BaseComponentPropsPlus, DraggableComponent, drawingZoneDraggableBounds } from './viewsShared'

/**
 * Modal to generate unitary sankey either from local sankey or from excel file
 *
 * @param {*} { app_data }
 * @return {*}  {JSX.Element}
 */
export const ModalCreateUnitaryViewOSP: FC<BaseComponentPropsPlus> = (
  { app_data }
): JSX.Element => {

  const { t } = app_data

  const [display_menu, set_display_menu] = useState(false)
  const [, setUpdater] = useState(0)
  const [source_mode, set_source_mode] = useState<'local' | 'excel'>('local')
  const nodeRef = useRef(null)

  // Re-rendre (donc recalculer les bornes draggable) au toggle du tableur/doc.
  useEffect(() => {
    return app_data.menu_configuration.addMainZoneListener(() => setUpdater(a => a + 1))
  }, [])

  app_data.menu_configuration_osp.ref_show_modal_unitary_view.current = set_display_menu

  const updateComponent = () => {
    setUpdater(a => a + 1)
  }
  app_data.menu_configuration_osp.ref_update_modal_unitary_view.current = updateComponent

  const has_sankey_plus = app_data.has_sankey_plus
  if (!has_sankey_plus) return <></>

  return <DraggableComponent
    nodeRef={nodeRef}
    handle='.title_menu'
    defaultPosition={{ x: window.innerWidth / 3, y: window.innerHeight / 5 }}
    bounds={drawingZoneDraggableBounds(app_data, nodeRef)}
  >
    <Box
      ref={nodeRef}
      layerStyle='menu_draggable_layout'
      hidden={!display_menu}
      position='absolute'
      minW='28rem'
      maxW='36rem'
      w='32vw'
      zIndex='2'
    >
      <Box className='title_menu' layerStyle='menu_draggable_title_layout'>
        <Text justifySelf='start' fontStyle='h1' margin='0'>
          {t('view.create_unit')}
        </Text>
        <CloseButton justifySelf='end' onClick={() => set_display_menu(false)} />
      </Box>
      <Box layerStyle='menu_draggable_content_layout'>
        <Box layerStyle='menuconfigpanel_grid'>

          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <Box layerStyle='menuconfigpanel_option_name'>
              {t('Menu.Transformation.sourceType')}
            </Box>
            <Box layerStyle='options_2cols'>
              <Button
                variant={source_mode === 'local' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => set_source_mode('local')}
              >{t('view.unit_tab_local')}</Button>
              <Button
                variant={source_mode === 'excel' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                onClick={() => set_source_mode('excel')}
              >{t('view.unit_tab_excel')}</Button>
            </Box>
          </Box>

          <hr style={{ borderStyle: 'none', margin: '10px 0', color: 'grey', backgroundColor: 'grey', height: 2 }} />

          {source_mode === 'local'
            ? <TabLocalDataForUnitary app_data={app_data} />
            : <TabImportExcelDataForUnitary app_data={app_data} />}

        </Box>
      </Box>
    </Box>
  </DraggableComponent>
}

/**
 * Tab to create unitary sankey from local sankey
 *
 * @param {*} { app_data }
 * @return {*}
 */
const TabLocalDataForUnitary: FC<{ app_data: Class_ApplicationDataOSP }> = ({ app_data }) => {
  const { t } = app_data
  const drawing_area_plus = app_data.drawing_area as Class_DrawingAreaOSP

  const list_selected_nodes_for_unitary = useRef<Class_NodeElement[]>([])
  const [, setUpdater] = useState(0)
  const entries_for_nodes: typeElementSelectable = drawing_area_plus.sankey.visible_nodes_list_sorted.map((d) => { return { 'label': d.name, 'value': d.id, selected: list_selected_nodes_for_unitary.current.includes(d) } })

  const updateComponent = () => {
    setUpdater(a => a + 1)
  }

  const has_level_taggs = Object.keys(drawing_area_plus.sankey.level_taggs_dict).length > 0

  return <Box display='grid' gridRowGap='0.4rem'>
    {has_level_taggs ? <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Config.element_level_tag')}</Box>
      <LevelTagFilter app_data={app_data} />
    </Box> : <></>}

    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Config.title_node')}</Box>
      <OSMultiSelect
        t={t}
        elements={entries_for_nodes}
        onClick={(entries: typeElementSelectable) => {
          const entries_values = entries.map(d => d.value)
          drawing_area_plus.sankey.nodes_list.forEach(n => {
            if (entries_values.includes(n.id) && !list_selected_nodes_for_unitary.current.includes(n)) {
              list_selected_nodes_for_unitary.current.push(n)
            } else if (!entries_values.includes(n.id) && list_selected_nodes_for_unitary.current.includes(n)) {
              const n_to_del = list_selected_nodes_for_unitary.current.indexOf(n)
              list_selected_nodes_for_unitary.current.splice(n_to_del, 1)
            }
          })
          updateComponent()
        }}
      />
    </Box>

    <Box display='flex' justifyContent='flex-end'>
      <OSTooltip label={list_selected_nodes_for_unitary.current.length === 0 ? t('view.dis_createFromSelected') : ''}>
        <Button
          variant='btn_create_unitary_from_nodes'
          isDisabled={list_selected_nodes_for_unitary.current.length === 0}
          onClick={() => {
            app_data.sendWaitingToast(
              () => {
                list_selected_nodes_for_unitary.current.forEach(element => {
                  createUnitaryNewView(app_data, element)
                })
                app_data.menu_configuration_osp.updateComponentRelatedToViews()
                app_data.menu_configuration.ref_to_save_in_cache_indicator.current(true)
              },
              {
                success: { title: t('toast.u_v_loaded') },
                loading: { title: t('toast.u_v_loading') }
              }
            )
          }}>
          {t('view.create')}
        </Button>
      </OSTooltip>
    </Box>
  </Box>
}

/**
 * Tab to create unitary sankey from sankey imported via excel file
 *
 * @param {*} { app_data }
 * @return {*}
 */
const TabImportExcelDataForUnitary = ({ app_data }: { app_data: Class_ApplicationDataOSP }) => {
  const { t } = app_data
  const ref_input_file = useRef<HTMLInputElement>(null)
  const [pending_files, set_pending_files] = useState<File[]>([])
  const [is_processing, set_is_processing] = useState(false)
  const [current_file_name, set_current_file_name] = useState<string>('')
  const [processed_count, set_processed_count] = useState(0)
  const [total_to_process, set_total_to_process] = useState(0)
  const [selected_data_id, set_selected_data_id] = useState<string>('')
  const [, setUpdate] = useState(0)
  const local_app_data = useRef<Class_ApplicationDataOSP>(new Class_ApplicationDataOSP(false))
  const list_data = useRef<{ [x: string]: { name: string, data: Type_JSON } }>({})
  const list_selected_nodes_for_unitary = useRef<Class_NodeElement[]>([])

  const toast = useToast()
  local_app_data.current.createNewMenuConfiguration(toast)

  // Failesafe : si on a des données mais aucune sélection valide, basculer sur la première
  if (Object.keys(list_data.current).length > 0 && !(selected_data_id in list_data.current)) {
    list_selected_nodes_for_unitary.current = []
    const new_sel_key = Object.keys(list_data.current)[0]
    DrawingAreaPersistenceOSP.fromJSON(local_app_data.current.drawing_area as Class_DrawingAreaOSP, list_data.current[new_sel_key].data)
    set_selected_data_id(new_sel_key)
  }

  const entries_for_nodes: typeElementSelectable = local_app_data.current.drawing_area.sankey.visible_nodes_list_sorted.map((d) => ({ 'label': d.name, 'value': d.id, selected: list_selected_nodes_for_unitary.current.includes(d) }))
  const list_node_selected_data = local_app_data.current.drawing_area.sankey.visible_nodes_list_sorted

  // Upload + poll + retrieve pour un fichier
  const processOneFile = async (file: File): Promise<void> => {
    const root = window.location.origin
    set_current_file_name(file.name)

    // 1. Upload
    const form_data = new FormData()
    form_data.append('file', file)
    form_data.append('output_format', 'json')
    form_data.append('process_label', t('ProcessDialog.open_excel_file'))
    await fetch(root + '/opensankey/convert/launch', { method: 'POST', body: form_data })

    // 2. Poll jusqu'à la fin — arrêt piloté par le statut machine renvoyé par
    // le serveur (data.status), et non plus par le grep du texte localisé du log.
    await new Promise<void>(resolve => {
      const url_check = root + app_data.url_prefix + 'upload/check_process'
      const interval = setInterval(() => {
        fetch(url_check, { method: 'POST', body: '' }).then(r => {
          if (!r.ok) return
          r.json().then(data => {
            if (data.status === 'finished' || data.status === 'failed') {
              clearInterval(interval)
              resolve()
            }
          })
        })
      }, 2000)
    })

    // 3. Récupérer le résultat
    const response = await fetch(root + '/opensankey/upload/retrieve_result', { method: 'POST', body: new FormData() })
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer()
      const decompressed = await decompressGzipDataFixed(arrayBuffer)
      const jsonData = JSON.parse(decompressed)
      jsonData['version'] = local_app_data.current.version
      list_data.current[makeId('data_src_')] = { name: file.name, data: jsonData }
    }
  }

  // Traite la file séquentiellement (le serveur ne supporte qu'un job à la fois)
  const processQueue = async (files: File[]) => {
    set_is_processing(true)
    set_total_to_process(files.length)
    set_processed_count(0)
    for (let i = 0; i < files.length; i++) {
      await processOneFile(files[i])
      set_processed_count(i + 1)
    }
    set_is_processing(false)
    set_current_file_name('')
    set_pending_files([])
    if (ref_input_file.current) ref_input_file.current.value = ''
    setUpdate(a => a + 1)
  }

  const removeDataSource = (key: string) => {
    delete list_data.current[key]
    if (key === selected_data_id) {
      list_selected_nodes_for_unitary.current = []
      const remaining = Object.keys(list_data.current)
      if (remaining.length > 0) {
        DrawingAreaPersistenceOSP.fromJSON(local_app_data.current.drawing_area as Class_DrawingAreaOSP, list_data.current[remaining[0]].data)
        set_selected_data_id(remaining[0])
      } else {
        set_selected_data_id('')
      }
    }
    setUpdate(a => a + 1)
  }

  const nb_loaded = Object.keys(list_data.current).length

  return <Box display='grid' gridRowGap='0.4rem'>

    {/* Ligne fichier : label | [file input] [Ouvrir] */}
    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('Menu.Transformation.sourceFile')}
      </Box>
      <Box display='grid' gridTemplateColumns='1fr auto' gap='0.4rem' alignItems='center'>
        <Input
          type='file'
          accept='.xlsx'
          multiple
          size='sm'
          height='1.9rem'
          padding='0.15rem'
          ref={ref_input_file}
          isDisabled={is_processing}
          onChange={(evt: ChangeEvent) => {
            const files = (evt.target as HTMLInputElement).files
            set_pending_files(files ? Array.from(files) : [])
          }}
        />
        <Button
          size='sm'
          height='1.9rem'
          variant='menuconfigpanel_option_button_activated'
          isDisabled={is_processing || pending_files.length === 0}
          onClick={() => processQueue(pending_files)}
        >
          {is_processing
            ? `${processed_count}/${total_to_process}`
            : pending_files.length > 1
              ? `${t('Menu.ouvrir')} (${pending_files.length})`
              : t('Menu.ouvrir')}
        </Button>
      </Box>
    </Box>

    {/* État du traitement */}
    {is_processing ? <Box display='flex' alignItems='center' gap='0.4rem' fontSize='sm' color='gray.600' paddingLeft='0.4rem'>
      <Spinner size='xs' /><Text>{current_file_name}</Text>
    </Box> : <></>}

    {/* Liste compacte des sources chargées */}
    {nb_loaded > 0 ? <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>
        {t('view.select_data_source')}
      </Box>
      <Box border='1px solid' borderColor='gray.200' borderRadius='4px' overflow='hidden'>
        {Object.entries(list_data.current).map(([key, data], idx, arr) => {
          const is_active = key === selected_data_id
          return <Box
            key={key}
            display='grid'
            gridTemplateColumns='1fr auto'
            alignItems='center'
            padding='0.15rem 0.4rem'
            gap='0.4rem'
            borderBottom={idx < arr.length - 1 ? '1px solid' : 'none'}
            borderBottomColor='gray.100'
            bg={is_active ? 'openSankey.50' : 'transparent'}
            cursor='pointer'
            _hover={{ bg: is_active ? 'openSankey.50' : 'gray.50' }}
            onClick={() => {
              if (key === selected_data_id) return
              list_selected_nodes_for_unitary.current = []
              DrawingAreaPersistenceOSP.fromJSON(local_app_data.current.drawing_area as Class_DrawingAreaOSP, list_data.current[key].data)
              set_selected_data_id(key)
            }}
          >
            <Text fontSize='sm' fontWeight={is_active ? '600' : '400'} isTruncated>{data.name}</Text>
            <CloseButton
              size='sm'
              onClick={(e) => { e.stopPropagation(); removeDataSource(key) }}
            />
          </Box>
        })}
      </Box>
    </Box> : <></>}

    {/* Choix des nœuds + génération */}
    {list_node_selected_data.length > 0 ? <>
      {Object.keys(local_app_data.current.drawing_area.sankey.level_taggs_dict).length > 0 ? <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Config.element_level_tag')}</Box>
        <LevelTagFilter app_data={local_app_data.current} />
      </Box> : <></>}

      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
        <Box layerStyle='menuconfigpanel_option_name'>{t('Menu.Config.title_node')}</Box>
        <OSMultiSelect
          t={t}
          elements={entries_for_nodes}
          onClick={(entries: typeElementSelectable) => {
            const entries_values = entries.map(d => d.value)
            local_app_data.current.drawing_area.sankey.nodes_list.forEach(n => {
              if (entries_values.includes(n.id) && !list_selected_nodes_for_unitary.current.includes(n)) {
                list_selected_nodes_for_unitary.current.push(n)
              } else if (!entries_values.includes(n.id) && list_selected_nodes_for_unitary.current.includes(n)) {
                const n_to_del = list_selected_nodes_for_unitary.current.indexOf(n)
                list_selected_nodes_for_unitary.current.splice(n_to_del, 1)
              }
            })
            setUpdate(a => a + 1)
          }}
        />
      </Box>

      <Box display='flex' justifyContent='flex-end'>
        <OSTooltip label={list_selected_nodes_for_unitary.current.length === 0 ? t('view.dis_createFromSelected') : ''}>
          <Button
            variant='btn_create_unitary_from_nodes'
            isDisabled={list_selected_nodes_for_unitary.current.length === 0}
            onClick={() => {
              app_data.sendWaitingToast(
                () => {
                  list_selected_nodes_for_unitary.current.forEach(element => {
                    createUnitaryNewView(local_app_data.current, element)
                  })
                  const app_data_json = local_app_data.current.toJSON()
                  app_data.viewsFromJSON(app_data_json)
                  app_data.menu_configuration_osp.updateComponentRelatedToViews()
                },
                {
                  success: { title: t('toast.u_v_loaded') },
                  loading: { title: t('toast.u_v_loading') }
                }
              )
            }}
          >
            {t('view.create')}
          </Button>
        </OSTooltip>
      </Box>
    </> : <></>}
  </Box>
}
