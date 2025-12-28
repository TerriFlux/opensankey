// ForeignObjectEditor.tsx
import React, { useRef, MutableRefObject, forwardRef, useImperativeHandle, useState } from 'react'
import ReactQuill from 'react-quill'
import { Box, Textarea, Button, Checkbox } from '@chakra-ui/react'
import { MenuDraggable } from '../topmenus/SankeyMenus'
import { OSTooltip } from '../configmenus/MenuCommon'
import { Class_NodeBase } from '../../Elements/NodeBase'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_LinkElement } from '../../Elements/Link'

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

// Configuration Quill
const QUILL_MODULES = {
  toolbar: [
    [{ 'font': [] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'size': listOptionSizeQuill }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['clean'],
  ],
}

const QUILL_FORMATS = [
  'font', 'size', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'bullet', 'align'
]

// Register Size once (à faire une seule fois dans l'app)
const Size = ReactQuill.Quill.import('attributors/style/size')
Size.whitelist = listOptionSizeQuill
ReactQuill.Quill.register(Size, true)

// Interface pour les méthodes exposées via ref
export interface ForeignObjectEditorHandle {
  resetContent: (newValue: string) => void
}

interface ForeignObjectEditorProps {
  // Mode éditeur
  isRawMode: boolean

  // Contenu
  value: string

  // Callbacks
  onChange: (newContent: string) => void
  onBlur: (currentContent: string) => void

  // État de désactivation
  isActivated: boolean

  // Nombre de lignes pour le mode raw
  rows?: number
}

export const ForeignObjectEditor = forwardRef<ForeignObjectEditorHandle, ForeignObjectEditorProps>(
  (
    {
      isRawMode,
      value,
      onChange,
      onBlur,
      isActivated,
      rows = 5
    },
    ref
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>() as MutableRefObject<HTMLTextAreaElement>

    // Expose resetContent method via ref
    useImperativeHandle(ref, () => ({
      resetContent: (newValue: string) => {
        if (textareaRef.current) {
          textareaRef.current.value = newValue
        }
      }
    }))

    const disabled = !isActivated 

    const editorStyle = {
      color: disabled ? '#666666' : '',
      backgroundColor: disabled ? '#cccccc' : '',
      overflowY: 'scroll' as const
    }

    // Mode Rich Editor (Quill)
    if (!isRawMode) {
      return (
        <Box>
          <ReactQuill
            className='quill_editor'
            value={value}
            onChange={(evt, _, source) => {
              if (source === 'user') {
                onChange(evt)
              }
            }}
            onBlur={() => onBlur(value)}
            theme="snow"
            modules={QUILL_MODULES}
            formats={QUILL_FORMATS}
            readOnly={!isActivated}
            style={editorStyle}
          />
        </Box>
      )
    }

    // Mode Raw HTML (Textarea)
    return (
      <Textarea
        rows={rows}
        color={disabled ? '#666666' : ''}
        backgroundColor={disabled ? '#cccccc' : ''}
        disabled={!isActivated}
        ref={textareaRef}
        defaultValue={value}
        onChange={(evt) => onChange(evt.target.value)}
        onBlur={() => onBlur(value)}
      />
    )
  }
)

ForeignObjectEditor.displayName = 'ForeignObjectEditor'

export const LabelRichTextEditor = ({
  app_data,
}: {
  app_data: Class_ApplicationData
}) => {
  const { drawing_area, t } = app_data
  const is_activated = true

  const [s_editor_content_fo_node, sEditorContentFoNode] = useState('')
  const [, setCount] = useState(0)
  const [elements, setElements] = useState<Class_NodeBase[]|Class_LinkElement[]>([])
  //const elements = drawing_area.elements_list
  const editorRef = useRef<ForeignObjectEditorHandle>(null)

  app_data.menu_configuration.r_editor_content_set_elements.current = setElements
  let s_tmp_editor_content_fo_node = s_editor_content_fo_node
  app_data.menu_configuration.r_setter_editor_content_fo_node.current = sEditorContentFoNode

  let s_tmp_editor_content_changed = false
  if (elements.length > 0) {
    if (elements[0].fo_content !== s_editor_content_fo_node) {
      s_tmp_editor_content_changed = true
    }
  }
  const is_FO_raw = (elements[0]?.is_fo_raw ?? false)

  const check_indeterminate = (curr: Class_NodeBase|Class_LinkElement) => {
    //@ts-expect-error xxx
    return (elements[0].isEqual(curr))
  }
  const is_indeterminated = !elements.every(check_indeterminate)



  const updateFORaw = (_: boolean) => {
    const dict_old_value: { [x: string]: boolean } = {}
    elements.forEach(n => {
      dict_old_value[n.id] = n.is_fo_raw
    })
    const _updateFORaw = () => {
      elements.forEach(n => {
        n.is_fo_raw = _
        n.draw()
      })
      setCount(a => a + 1)
    }

    const inv_updateFORaw = () => {
      elements.forEach(n => {
        n.is_fo_raw = dict_old_value[n.id]
        n.draw()
      })
      setCount(a => a + 1)
    }
    app_data.history.saveUndo(inv_updateFORaw)
    app_data.history.saveRedo(_updateFORaw)
    _updateFORaw()
  }

  const applyEditor = () => {
    const dict_old_value: { [x: string]: string } = {}
    elements.map(node => dict_old_value[node.id] = node.fo_content!)

    const _applyEditor = () => {
      elements.map(node => {
        node.fo_content = s_tmp_editor_content_fo_node
        node.drawFO()
      })
      sEditorContentFoNode(s_tmp_editor_content_fo_node)
      app_data.menu_configuration.ref_to_save_in_cache_indicator.current(false)
    }
    const inv_applyEditor = () => {
      elements.map(node => {
        node.fo_content = dict_old_value[node.id]
        node.drawFO()
      })
      sEditorContentFoNode(elements[0].fo_content ?? '')
    }

    app_data.history.saveUndo(inv_applyEditor)
    app_data.history.saveRedo(_applyEditor)
    _applyEditor()
  }

  // ✅ UTILISATION DU NOUVEAU COMPOSANT
  const content = (
    <Box layerStyle='menu_sub_section'>

      <>
        <Checkbox
          variant='menuconfigpanel_option_checkbox'
          isDisabled={!is_activated}
          isIndeterminate={is_indeterminated}
          isChecked={is_FO_raw}
          onChange={(evt) => updateFORaw(evt.target.checked)}
        >
          {is_activated ? (
            <>{t('Noeud.foreign_object.raw')}</>
          ) : (
            <OSTooltip label={t('Menu.sankeyOSPDisabled')}>
              {t('Noeud.foreign_object.raw')}
            </OSTooltip>
          )}
        </Checkbox>

        {elements.length > 0 ? (
          <OSTooltip
            label={
              is_activated
                ? ''
                : t('Menu.sankeyOSPDisabled')
            }
          >
            <ForeignObjectEditor
              ref={editorRef}
              isRawMode={is_FO_raw}
              value={elements[0].fo_content ?? ''}
              onChange={(newContent) => {
                s_tmp_editor_content_fo_node = newContent
                if (!s_tmp_editor_content_changed) {
                  sEditorContentFoNode(newContent)
                }
              }}
              onBlur={(currentContent) => {
                sEditorContentFoNode(currentContent)
              }}
              isActivated={is_activated}
              rows={5}
            />
          </OSTooltip>
        ) : (
          <></>
        )}

        <Box as='span' layerStyle='options_2cols'>
          <Button
            variant='menuconfigpanel_option_button_left'
            isDisabled={!is_activated || !s_tmp_editor_content_changed}
            backgroundColor='red.200'
            onClick={() => {
              const resetValue = elements[0]?.fo_content ?? ''
              editorRef.current?.resetContent(resetValue)
              sEditorContentFoNode(resetValue)
              setCount(a => a + 1)
            }}
          >
            {t('Noeud.FO.cancel')}
          </Button>
          <Button
            variant='menuconfigpanel_option_button_right'
            isDisabled={!is_activated || !s_tmp_editor_content_changed}
            onClick={applyEditor}
          >
            {t('Noeud.FO.submit')}
          </Button>
        </Box>
      </>
    </Box>
  )
  return (
    <MenuDraggable
      dict_hook_ref_setter_show_dialog_components={app_data.menu_configuration.dict_setter_show_dialog}
      dialog_name={'ref_setter_show_modal_rich_text_editor'}
      content={content}
      title={'Rich Text Editor'}
      minW={'25vw'}
      maxW={'50vw'}
    />
  )
}