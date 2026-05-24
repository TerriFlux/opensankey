// ForeignObjectEditor.tsx
import React, { useRef, MutableRefObject, forwardRef, useImperativeHandle, useState } from 'react'
import ReactQuill from 'react-quill'
import { Box, Textarea, Checkbox } from '@chakra-ui/react'
import { MenuDraggable } from '../topmenus/SankeyMenus'
import { getElementsLabelValues } from '../../Elements/ElementsAttributesConfig'
import { Class_NodeBase } from '../../Elements/NodeBase'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_LinkElement } from '../../Elements/Link'
import { BASE_LABEL_CONFIG } from '../../Elements/ElementsAttributesConfig'

/**
 * Create an array of string, it return a list from start to stop (at a pace of step)
 * with suffix 'px'
 *
 * @param {number} start
 * @param {number} stop
 * @param {number} step
 */
/**
 * Create an array with logarithmic scale for font sizes
 */
const arrayRangeLogarithmic = () => [
  // Petites tailles (pas de 1)
  8, 9, 10, 11, 12,
  // Tailles moyennes (pas de 2)
  14, 16, 18, 20, 22,
  // Tailles grandes (pas de 4)
  24, 28, 32, 36,
  // Très grandes tailles (pas de 8)
  40, 48, 56, 64, 72,
  // Énormes tailles (pas de 12-24)
  80, 96, 120
].map(n => n + 'px')

// Exported variable for Quill editor
export const listOptionSizeQuill = [
  // Les 3 tailles standard en premier
  '0.75em',  // small
  '1.5em',   // large
  '2.5em',   // huge
  
  // Puis échelle logarithmique en pixels
  ...arrayRangeLogarithmic()
]

// Configuration Quill
const QUILL_MODULES = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'size': listOptionSizeQuill }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['clean'],
  ],
}

const QUILL_MODULES_NO_TOOLBAR = {
  toolbar: false,
}

const QUILL_FORMATS = [
  'size', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'bullet', 'align'
]

// Register Size once (à faire une seule fois dans l'app)
const Size = ReactQuill.Quill.import('attributors/style/size')
Size.whitelist = listOptionSizeQuill
ReactQuill.Quill.register(Size, true)
const Align = ReactQuill.Quill.import('attributors/style/align')
ReactQuill.Quill.register(Align, true)

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

  // Afficher la toolbar Quill (default: true)
  showToolbar?: boolean

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
      showToolbar = true,
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
            modules={showToolbar ? QUILL_MODULES : QUILL_MODULES_NO_TOOLBAR}
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

/**
 * Check if HTML content contains rich formatting beyond simple <p> tags.
 * Returns true if there are tags other than <p>, </p>, <br>, <br/>.
 */
const isRichContent = (html: string): boolean => {
  if (!html) return false
  // Remove <p>, </p>, <br>, <br/>, <br /> tags and check if any other tags remain
  const stripped = html
    .replace(/<\/?p[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '')
  return /<[^>]+>/.test(stripped)
}

/**
 * Strip all HTML tags from content to get plain text.
 */
export const stripHtmlTags = (html: string): string => {
  if (!html) return ''
  return html.replace(/<[^>]+>/g, '').trim()
}

/**
 * Wrap plain text in <p> tags for fo_content.
 */
export const wrapInParagraph = (text: string): string => {
  if (!text) return '<p></p>'
  return `<p>${text}</p>`
}

/**
 * Sync fo_content value to name_label (nodes) or text_value (links).
 * Strips HTML tags to extract plain text.
 */
const syncFoContentToLabel = (
  elements: Class_NodeBase[] | Class_LinkElement[],
  foContent: string
) => {
  const plainText = stripHtmlTags(foContent)
  elements.forEach(el => {
    if (el instanceof Class_NodeBase) {
      // En mode label personnalisé, écrire dans le champ de label indépendant
      // (le nœud n'est PAS renommé) ; sinon, comportement historique (= nom).
      if (el.name_label_custom) {
        el.name_label_text = plainText
      } else {
        el.name = plainText
      }
    } else if (el instanceof Class_LinkElement) {
      el.text_value = plainText
    }
  })
}

export const LabelRichTextEditor = ({ app_data }: { app_data: Class_ApplicationData }) => {
  const { t } = app_data
  const has_osp = app_data.has_sankey_plus

  const [, sEditorContentFoNode] = useState('')
  const [, setCount] = useState(0)
  const [elements, setElements] = useState<Class_NodeBase[] | Class_LinkElement[]>([])
  const [prefix, setPrefix] = useState<'name_label' | 'value_label' | 'icon'>('name_label')
  const [editorMode, setEditorMode] = useState<'node' | 'link' | null>(null)
  const editorRef = useRef<ForeignObjectEditorHandle>(null)
  const [is_raw, setIsRaw] = useState(false)

  app_data.menu_configuration.r_editor_content_set_elements.current = (
    _elements: Class_NodeBase[] | Class_LinkElement[],
    _prefix: 'name_label' | 'value_label' | 'icon'
  ) => {
    setElements(_elements)
    setPrefix(_prefix)
    if (_elements.length > 0) {
      if (_elements[0] instanceof Class_NodeBase) setEditorMode('node')
      else if (_elements[0] instanceof Class_LinkElement) setEditorMode('link')
    }
  }

  app_data.menu_configuration.r_rich_text_editor_refresh.current = () => {
    if (editorMode === 'node') {
      setElements(app_data.drawing_area.selected_nodes_list)
    } else if (editorMode === 'link') {
      setElements(app_data.drawing_area.selected_links_list)
    }
  }

  app_data.menu_configuration.r_setter_editor_content_fo_node.current = sEditorContentFoNode

  const labelValues = elements.length > 0
    ? getElementsLabelValues(elements, prefix, () => setCount(a => a + 1))
    : Object.fromEntries(
      Object.entries(BASE_LABEL_CONFIG).map(([key, value]) => [key, value.default])
    ) as { -readonly [K in keyof typeof BASE_LABEL_CONFIG]: ReturnType<typeof BASE_LABEL_CONFIG[K]['type']> }

  const currentFoContent = labelValues.fo_content ?? ''
  const contentIsRich = isRichContent(currentFoContent)

  // Without OSP license and content is rich: editing is disabled
  const editing_disabled_rich = !has_osp && contentIsRich

  const handleChange = (newContent: string) => {
    // Without OSP: enforce plain text only (strip all tags except <p>)
    let sanitized = newContent
    if (!has_osp) {
      const text = stripHtmlTags(newContent)
      sanitized = wrapInParagraph(text)
    }
    labelValues.fo_content = sanitized
    sEditorContentFoNode(sanitized)
    // Sync to name_label
    syncFoContentToLabel(elements, sanitized)
  }

  const handleBlur = (currentContent: string) => {
    let sanitized = currentContent
    if (!has_osp) {
      const text = stripHtmlTags(currentContent)
      sanitized = wrapInParagraph(text)
    }
    labelValues.fo_content = sanitized
    sEditorContentFoNode(sanitized)
    // Sync to name_label
    syncFoContentToLabel(elements, sanitized)
  }

  const content = (
    <Box layerStyle='menu_sub_section'>
      {editing_disabled_rich && (
        <Box
          p={2}
          mb={2}
          bg='orange.100'
          borderRadius='md'
          fontSize='sm'
          color='orange.800'
        >
          {t('Menu.sankeyOSPDisabled')} — OpenSankey+ {t('Menu.requiredToEditRichText')}
        </Box>
      )}

      {elements.length > 0 ? (
        <>
          {/* Quill editor: toolbar only with OSP, disabled if rich content without license */}
          <ForeignObjectEditor
            ref={editorRef}
            isRawMode={false}
            value={currentFoContent}
            onChange={handleChange}
            onBlur={handleBlur}
            isActivated={!editing_disabled_rich}
            showToolbar={has_osp}
            rows={5}
          />

          {/* Raw HTML editor at bottom (OSP only) */}
          {has_osp && (
            <>
              <Checkbox
                variant='menuconfigpanel_option_checkbox'
                isChecked={is_raw}
                onChange={(evt) => setIsRaw(evt.target.checked)}
                mt={2}
              >
                {t('Noeud.foreign_object.raw')}
              </Checkbox>

              {is_raw && (
                <ForeignObjectEditor
                  isRawMode={true}
                  value={currentFoContent}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isActivated={true}
                  rows={5}
                />
              )}
            </>
          )}
        </>
      ) : (
        <></>
      )}
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