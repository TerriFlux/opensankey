// ==================================================================================================
// COMPOSANT UNIFIÉ : MenuConfigurationAppearance
// Fusionne Shape + Labels avec 5 onglets : Fond | Forme | Nom | Valeur | Icône
// ==================================================================================================

import React, { useState, useRef, ChangeEvent } from 'react'
import { Box, Button, Checkbox, InputGroup, Select, Divider, Input, ButtonGroup } from '@chakra-ui/react'
import { FaAlignCenter, FaAlignLeft, FaAlignRight } from 'react-icons/fa'
import { MdTextRotateVertical, MdTextRotationNone } from 'react-icons/md'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_ContainerElement } from '../../Elements/TextZone'
import { Class_ElementStyle } from '../../Elements/Element'
import { Class_NodeBase } from '../../Elements/NodeBase'
import { Type_Position } from '../../types/Utils'
import { svg_label_upper } from '../../css/IconLibrairie'
import { default_style_id } from '../../types/Utils'

// Imports des composants et helpers
import { SankeyMultiTypeSelectionSimple } from './MenuElementsSelection'
import { ConfigMenuStyleElement } from '../dialogs/SankeyStyle'
import {
  WrapperBoxSubSectionMenu,
  ElementAttrSetterNumberInput2Cols,
  ConfigMenuNumberInput,
  OSTooltip,
  MenuSectionCheckbox,
  MenuColorPicker,
  getButtonVariant,
  getCheckboxProps,
  LabelWithOverload,
  TooltipElementOverloaded,
  ConfigMenuNumberOrUndefinedInput,
  OSMultiSelect
} from './MenuCommon'

// Imports des configs
import {
  ElementsType,
  Type_Orientation,
  Type_Shape,
  ShapePrefix,
  getShapeValues,
  getLinkShapeValues,
  getNodeShapeValues,
  getElementsLabelValues,
  getElementsNameLabelValues,
  getLinksLabelValues,
  getIconValues,
  BASE_SHAPE_CONFIG,
  LINK_SHAPE_SPECIFIC_CONFIG,
  NODE_SHAPE_SPECIFIC_CONFIG,
  NAME_LABEL_CONFIG,
  VALUE_LABEL_CONFIG,
  ICON_LABEL_BASE_CONFIG,
  BASE_LABEL_CONFIG,
  LINKS_LABEL_SPECIFIC_CONFIG,
  ALL_ATTRIBUTES_CONFIG,
  isLinkShapeSpecificValueIndeterminate,
  isNodeShapeSpecificValueIndeterminate,
  isConfigValueIndeterminate,
  font_families,
  getShapeAttributeKey,
  isShapeValueIndeterminate,
  getLinkShapeAttributeKey,
  getNodeShapeAttributeKey,
  getLabelAttributeKey
} from '../../Elements/ElementsAttributesConfig'

// ✅ Analyse de la sélection
interface SelectionAnalysis {
  hasNodes: boolean
  hasLinks: boolean
  hasContainers: boolean
  nodes: Class_NodeElement[]
  links: Class_LinkElement[]
  containers: Class_ContainerElement[]
  allElements: (Class_NodeElement | Class_LinkElement | Class_ContainerElement)[] | Class_ElementStyle[]
}

const analyzeSelection = (
  elements: (Class_NodeElement | Class_LinkElement | Class_ContainerElement)[] | Class_ElementStyle[]
): SelectionAnalysis => {
  const nodes: Class_NodeElement[] = []
  const links: Class_LinkElement[] = []
  const containers: Class_ContainerElement[] = []

  elements.forEach(el => {
    if (el instanceof Class_NodeElement) nodes.push(el)
    else if (el instanceof Class_LinkElement) links.push(el)
    else if (el instanceof Class_ContainerElement) containers.push(el)
  })

  return {
    hasNodes: nodes.length > 0,
    hasLinks: links.length > 0,
    hasContainers: containers.length > 0,
    nodes,
    links,
    containers,
    allElements: elements
  }
}

// ✅ Sous-composant pour le contenu des labels
const LabelContentComponent = ({
  app_data,
  elements,
  prefix,
  refreshParentComponent
}: {
  app_data: Class_ApplicationData
  elements: ElementsType
  prefix: 'name_label' | 'value_label' | 'icon'
  refreshParentComponent: () => void
}) => {
  type DisplayMode = 'simple_text' | 'rich_text' | 'icon' | 'image'

  const labelValues = elements.length > 0
    ? getElementsLabelValues(elements, prefix, refreshParentComponent)
    : Object.fromEntries(Object.entries(BASE_LABEL_CONFIG).map(([key, value]) => [key, value.default])) as {
      -readonly [K in keyof typeof BASE_LABEL_CONFIG]:
      ReturnType<(typeof BASE_LABEL_CONFIG)[K]['type']>
    }

  const [displayMode, setDisplayMode] = useState<DisplayMode>(() => {
    if (elements.length === 0) return 'simple_text'
    if (labelValues.has_fo) return 'rich_text'
    if (labelValues.is_image) return 'image'
    if (labelValues.is_icon) return 'icon'
    return 'simple_text'
  })

  const setModeSimpleText = () => {
    labelValues.has_fo = false
    labelValues.icon_name = ''
    setDisplayMode('simple_text')
  }

  const setModeRichText = () => {
    app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_rich_text_editor.current(true)
    app_data.menu_configuration.r_editor_content_set_elements.current(base_elements, 'name_label')
    labelValues.has_fo = true
    labelValues.icon_name = ''
    setDisplayMode('rich_text')
  }

  const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_ElementStyle)
  const base_elements = elements as Class_NodeBase[] | Class_LinkElement[]
  const links_elements = elements as Class_LinkElement[] | Class_ElementStyle[]
  const correct_dict_style_to_use = app_data.drawing_area.sankey.styles_dict
  const correct_ref_style_to_use = app_data.menu_configuration.ref_selected_style

  const disable_attr_props = menu_for_style
    ? correct_dict_style_to_use[correct_ref_style_to_use.current].customisable_attribute
    : correct_dict_style_to_use[default_style_id].customisable_attribute

  const linkLabelValues = elements.length > 0
    ? getLinksLabelValues(links_elements, prefix, refreshParentComponent)
    : Object.fromEntries(Object.entries(LINKS_LABEL_SPECIFIC_CONFIG).map(([key, value]) => [key, value.default]))

  const _load_image = useRef<HTMLInputElement>(null)

  const firstElement = elements.length > 0 ? elements[0] as Class_NodeBase : null
  const iconColor = firstElement?.icon_color ?? '#ffffff'
  const iconColorSustainable = firstElement?.icon_color_sustainable ?? false

  const attributePath = 'Noeud.labels'

  return (
    <Box layerStyle='menuconfigpanel_grid'>
      {/* Sélecteur de mode */}
      {prefix !== 'value_label' && (
        <Box layerStyle='menuconfigpanel_row_2cols'>
          <Box layerStyle='options_4cols'>
            {prefix === 'name_label' && (
              <>
                <Button
                  variant={displayMode === 'simple_text' ? 'menuconfigpanel_option_button_activated_left' : 'menuconfigpanel_option_button_left'}
                  onClick={setModeSimpleText}
                >
                  Text
                </Button>
                <Button
                  variant={displayMode === 'rich_text' ? 'menuconfigpanel_option_button_activated_center' : 'menuconfigpanel_option_button_center'}
                  onClick={setModeRichText}
                >
                  Rich
                </Button></>)}
            {prefix === 'icon' && (
              <>
                <Button
                  variant={displayMode === 'icon' ? 'menuconfigpanel_option_button_activated_center' : 'menuconfigpanel_option_button_center'}
                  onClick={() => {
                    labelValues.has_fo = false
                    setDisplayMode('icon')
                  }}
                >
                  Icon
                </Button>
                <Button
                  variant={displayMode === 'image' ? 'menuconfigpanel_option_button_activated_right' : 'menuconfigpanel_option_button_right'}
                  onClick={() => setDisplayMode('image')}
                >
                  Image
                </Button>
              </>
            )}
          </Box>
        </Box>
      )}

      {/* Section TEXT */}

      <Box layerStyle='options_2cols'>
        <LabelWithOverload attributeKey="font_family" elements={elements} config={BASE_LABEL_CONFIG} prefix={prefix} t={app_data.t}>
          <Select
            isDisabled={!disable_attr_props[getLabelAttributeKey(prefix, 'font_family')]}
            variant='menuconfigpanel_option_select'
            value={labelValues.font_family}
            onChange={(evt: React.ChangeEvent<HTMLSelectElement>) => {
              labelValues.font_family = evt.target.value
            }}
          >
            {font_families.map((d: string) => (
              <option style={{ fontFamily: d }} key={'ff-' + d} value={d}>{d}</option>
            ))}
          </Select>
        </LabelWithOverload>
        {displayMode === 'simple_text' && (
          <LabelWithOverload attributeKey="font_size" elements={elements} config={BASE_LABEL_CONFIG} prefix={prefix} t={app_data.t}>
            <ConfigMenuNumberInput
              disabled={!disable_attr_props[getLabelAttributeKey(prefix, 'font_size')]}
              t={app_data.t}
              default_value={labelValues.font_size}
              menu_for_style={menu_for_style}
              minimum_value={11}
              stepper={true}
              unit_text='px'
              function_on_blur={(value) => { labelValues.font_size = value ?? labelValues.font_size }}
              multiValue={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'font_size', prefix)}
            />
          </LabelWithOverload>)}
      </Box>
      {displayMode === 'simple_text' && (<>
        <Box as='span' layerStyle='options_2cols'>
          <Box display="flex" alignItems="center" gap={1}>
            <Box layerStyle='options_3cols'>
              <Button
                isDisabled={!disable_attr_props[getLabelAttributeKey(prefix, 'bold')]}
                variant={getButtonVariant('left', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'bold', prefix), labelValues.bold)}
                sx={{ padding: '4px', minWidth: 'auto', height: 'auto', '& svg': { width: '16px', height: '16px' } }}
                onClick={() => { labelValues.bold = !labelValues.bold }}
              >
                {app_data.icon_library.icon_text_bold}
              </Button>
              <Button
                isDisabled={!disable_attr_props[getLabelAttributeKey(prefix, 'uppercase')]}
                variant={getButtonVariant('center', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'uppercase', prefix), labelValues.uppercase)}
                sx={{ padding: '4px', minWidth: 'auto', height: 'auto', '& svg': { width: '16px', height: '16px' } }}
                onClick={() => { labelValues.uppercase = !labelValues.uppercase }}
              >
                {svg_label_upper}
              </Button>
              <Button
                isDisabled={!disable_attr_props[getLabelAttributeKey(prefix, 'italic')]}
                variant={getButtonVariant('right', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'italic', prefix), labelValues.italic)}
                sx={{ padding: '4px', minWidth: 'auto', height: 'auto', '& svg': { width: '16px', height: '16px' } }}
                onClick={() => { labelValues.italic = !labelValues.italic }}
              >
                {app_data.icon_library.icon_text_italic}
              </Button>
            </Box>
            <Box display="flex" gap={0}>
              <TooltipElementOverloaded prefix={prefix} attributeKey={'bold'} elements={elements} config={BASE_LABEL_CONFIG} t={app_data.t} />
              <TooltipElementOverloaded prefix={prefix} attributeKey={'uppercase'} elements={elements} config={BASE_LABEL_CONFIG} t={app_data.t} />
              <TooltipElementOverloaded prefix={prefix} attributeKey={'italic'} elements={elements} config={BASE_LABEL_CONFIG} t={app_data.t} />
            </Box>
          </Box>

          <LabelWithOverload attributeKey="color" elements={elements} config={BASE_LABEL_CONFIG} prefix={prefix} t={app_data.t}>
            <MenuColorPicker
              isDisabled={!disable_attr_props[getLabelAttributeKey(prefix, 'color')]}
              initialColor={labelValues.color}
              onColorChange={(new_color) => { labelValues.color = new_color }}
            />
          </LabelWithOverload>
        </Box>

        <Box layerStyle='options_2cols'>
          <Box display="flex" alignItems="center" gap={1}>
            <Box layerStyle='options_3cols'>
              <OSTooltip label={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'text_align', prefix) ? "Valeurs multiples" : app_data.t(attributePath + '.tooltips.left_align')}>
                <Button
                  isDisabled={!disable_attr_props[getLabelAttributeKey(prefix, 'text_align')]}
                  sx={{ padding: '4px', minWidth: 'auto', height: 'auto' }}
                  variant={getButtonVariant('left', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'text_align', prefix), labelValues.text_align === 'left')}
                  onClick={() => { labelValues.text_align = 'left' }}
                >
                  <FaAlignLeft />
                </Button>
              </OSTooltip>
              <OSTooltip label={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'text_align', prefix) ? "Valeurs multiples" : app_data.t(attributePath + '.tooltips.center_align')}>
                <Button
                  isDisabled={!disable_attr_props[getLabelAttributeKey(prefix, 'text_align')]}
                  sx={{ padding: '4px', minWidth: 'auto', height: 'auto' }}
                  variant={getButtonVariant('center', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'text_align', prefix), labelValues.text_align === 'middle')}
                  onClick={() => { labelValues.text_align = 'middle' }}
                >
                  <FaAlignCenter />
                </Button>
              </OSTooltip>
              <OSTooltip label={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'text_align', prefix) ? "Valeurs multiples" : app_data.t(attributePath + '.tooltips.right_align')}>
                <Button
                  isDisabled={!disable_attr_props[getLabelAttributeKey(prefix, 'text_align')]}
                  sx={{ padding: '4px', minWidth: 'auto', height: 'auto' }}
                  variant={getButtonVariant('right', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'text_align', prefix), labelValues.text_align === 'right')}
                  onClick={() => { labelValues.text_align = 'right' }}
                >
                  <FaAlignRight />
                </Button>
              </OSTooltip>
            </Box>
            <TooltipElementOverloaded prefix={prefix} attributeKey={'text_align'} elements={elements} config={BASE_LABEL_CONFIG} t={app_data.t} />
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Box layerStyle='options_3cols'>
              <OSTooltip label={app_data.t('Noeud.labels.tooltips.name_label_vertical_text') || 'Vertical'}>
                <Button
                  isDisabled={!disable_attr_props[getLabelAttributeKey(prefix, 'vertical_text')]}
                  variant={getButtonVariant('', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'vertical_text', prefix), labelValues.vertical_text)}
                  sx={{ padding: '4px', minWidth: 'auto', height: 'auto' }}
                  onClick={() => { labelValues.vertical_text = !labelValues.vertical_text }}
                >
                  {labelValues.vertical_text ? <MdTextRotateVertical /> : <MdTextRotationNone />}
                </Button>
              </OSTooltip>
              <Button
                variant={getButtonVariant('', isConfigValueIndeterminate(links_elements, LINKS_LABEL_SPECIFIC_CONFIG, 'on_path', prefix), linkLabelValues.on_path)}
                sx={{ padding: '4px', minWidth: 'auto', height: 'auto', '& svg': { width: '16px', height: '16px' } }}
                onClick={() => { linkLabelValues.on_path = !linkLabelValues.on_path }}
              >
                {app_data.icon_library.icon_label_on_path}
              </Button>
              <Button
                variant={getButtonVariant('', isConfigValueIndeterminate(links_elements, LINKS_LABEL_SPECIFIC_CONFIG, 'pos_auto', prefix), linkLabelValues.pos_auto)}
                sx={{ padding: '4px', minWidth: 'auto', height: 'auto', '& svg': { width: '16px', height: '16px' } }}
                onClick={() => { linkLabelValues.pos_auto = !linkLabelValues.pos_auto }}
              >
                {app_data.icon_library.icon_label_auto_position}
              </Button>
            </Box>
            <Box display="flex" gap={0}>
              <TooltipElementOverloaded prefix={prefix} attributeKey={'vertical_text'} elements={elements} config={BASE_LABEL_CONFIG} t={app_data.t} />
              <TooltipElementOverloaded prefix={prefix} attributeKey={'on_path'} elements={links_elements} config={LINKS_LABEL_SPECIFIC_CONFIG} t={app_data.t} />
              <TooltipElementOverloaded prefix={prefix} attributeKey={'pos_auto'} elements={links_elements} config={LINKS_LABEL_SPECIFIC_CONFIG} t={app_data.t} />
            </Box>
          </Box>
        </Box></>)
      }

      {/* Section ICON */}
      {displayMode === 'icon' && (
        <>
          <Box layerStyle='menuconfigpanel_row_2cols'>
            <Box as='span' layerStyle='menuconfigpanel_option_name'>Catalogue d'icônes</Box>
            <Button
              variant='menuconfigpanel_option_button'
              onClick={() => {
                app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_import_icons?.current?.(true)
                app_data.menu_configuration.icon_selector_set_elements.current(base_elements, prefix)
              }}
            >
              {app_data.icon_library.icon_open_modal_icon}
            </Button>
          </Box>

          <Box layerStyle='menuconfigpanel_row_3cols'>
            <Box as='span' layerStyle='menuconfigpanel_option_name'>Couleur icône</Box>
            <MenuColorPicker
              initialColor={iconColor}
              onColorChange={(new_color) => {
                base_elements.forEach(el => {
                  if ('icon_color' in el) {
                    el.icon_color = new_color
                    el.draw()
                  }
                })
              }}
            />
            <Button
              variant={iconColorSustainable ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                base_elements.forEach(el => {
                  if ('icon_color_sustainable' in el) {
                    el.icon_color_sustainable = !iconColorSustainable
                    el.draw()
                  }
                })
                refreshParentComponent()
              }}
            >
              {iconColorSustainable ? app_data.icon_library.icon_locked : app_data.icon_library.icon_unlocked}
            </Button>
          </Box>
        </>
      )}

      {/* Section IMAGE */}
      {displayMode === 'image' && (
        <>
          <Box layerStyle='menuconfigpanel_row_2cols'>
            <Box as='span' layerStyle='menuconfigpanel_option_name'>Source image</Box>
            <Box as='span' layerStyle='options_2cols'>
              <Button
                variant='menuconfigpanel_option_button_left'
                onClick={() => {
                  if (_load_image.current) {
                    _load_image.current.name = ''
                    _load_image.current.click()
                  }
                }}
              >
                {app_data.icon_library.icon_import_file_image}
              </Button>
              <Button
                variant='menuconfigpanel_option_button_right'
                onClick={() => {
                  base_elements.forEach(el => {
                    if ('image_src' in el) {
                      el.image_src = ''
                      el.draw()
                    }
                  })
                }}
              >
                {app_data.icon_library.icon_delete}
              </Button>
            </Box>
            <Input
              ref={_load_image}
              style={{ display: 'none' }}
              accept='image/*'
              type="file"
              onChange={(evt: ChangeEvent) => {
                const files = (evt.target as HTMLFormElement).files
                const reader = new FileReader()
                reader.onload = (e: ProgressEvent<FileReader>) => {
                  const resultat = (e.target as FileReader).result
                  const res = resultat?.toString().replaceAll('=', '')
                  base_elements.forEach(el => {
                    if ('image_src' in el) {
                      el.image_src = res as string
                      el.draw()
                    }
                  })
                }
                reader.readAsDataURL(files[0])
              }}
            />
          </Box>
        </>
      )}

      <Divider />
      <Box as='span' textStyle='title_sub_section'>Position, taille et décalages</Box>

      <Box layerStyle='options_2cols'>
        <Box display="flex" alignItems="center" gap={1}>
          <Box layerStyle='options_4cols'>
            <OSTooltip label={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'horiz', prefix) ? "Valeurs multiples" : app_data.t(attributePath + '.tooltips.deb')}>
              <Button
                isDisabled={!disable_attr_props[getLabelAttributeKey(prefix, 'horiz')]}
                sx={{ padding: '4px', minWidth: 'auto', height: 'auto', '& svg': { width: '16px', height: '16px' } }}
                variant={getButtonVariant('left', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'horiz', prefix), labelValues.horiz === 'left')}
                onClick={() => { labelValues.horiz = 'left'; labelValues.horiz_shift = 0 }}
              >
                {app_data.icon_library.icon_text_align_left}
              </Button>
            </OSTooltip>
            <OSTooltip label={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'horiz', prefix) ? "Valeurs multiples" : app_data.t(attributePath + '.tooltips.milieu_h')}>
              <Button
                isDisabled={!disable_attr_props[getLabelAttributeKey(prefix, 'horiz')]}
                sx={{ padding: '4px', minWidth: 'auto', height: 'auto', '& svg': { width: '16px', height: '16px' } }}
                variant={getButtonVariant('center', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'horiz', prefix), labelValues.horiz === 'middle')}
                onClick={() => { labelValues.horiz = 'middle'; labelValues.horiz_shift = 0 }}
              >
                {app_data.icon_library.icon_text_align_center}
              </Button>
            </OSTooltip>
            <OSTooltip label={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'horiz', prefix) ? "Valeurs multiples" : app_data.t(attributePath + '.tooltips.fin')}>
              <Button
                isDisabled={!disable_attr_props[getLabelAttributeKey(prefix, 'horiz')]}
                sx={{ padding: '4px', minWidth: 'auto', height: 'auto', '& svg': { width: '16px', height: '16px' } }}
                variant={getButtonVariant('right', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'horiz', prefix), labelValues.horiz === 'right')}
                onClick={() => { labelValues.horiz = 'right'; labelValues.horiz_shift = 0 }}
              >
                {app_data.icon_library.icon_text_align_right}
              </Button>
            </OSTooltip>
            <OSTooltip label={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'inside_horiz', prefix) ? "Valeurs multiples" : (labelValues.inside_horiz ? "Extérieur" : "Intérieur")}>
              <Button
                isDisabled={!disable_attr_props[getLabelAttributeKey(prefix, 'inside_horiz')]}
                sx={{ padding: '4px', minWidth: 'auto', height: 'auto', '& svg': { width: '16px', height: '16px' } }}
                variant={getButtonVariant('', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'inside_horiz', prefix), labelValues.inside_horiz)}
                onClick={() => { labelValues.inside_horiz = !labelValues.inside_horiz }}
              >
                {app_data.icon_library.icon_label_inside_horiz}
              </Button>
            </OSTooltip>
          </Box>
          <Box display="flex" gap={0}>
            <TooltipElementOverloaded prefix={prefix} attributeKey={'horiz'} elements={elements} config={BASE_LABEL_CONFIG} t={app_data.t} />
            <TooltipElementOverloaded prefix={prefix} attributeKey={'inside_horiz'} elements={elements} config={BASE_LABEL_CONFIG} t={app_data.t} />
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <Box layerStyle='options_4cols'>
            <OSTooltip label={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'vert', prefix) ? "Valeurs multiples" : app_data.t(attributePath + '.tooltips.dessous')}>
              <Button
                isDisabled={!disable_attr_props[getLabelAttributeKey(prefix, 'vert')]}
                sx={{ padding: '4px', minWidth: 'auto', height: 'auto', '& svg': { width: '16px', height: '16px' } }}
                variant={getButtonVariant('left', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'vert', prefix), labelValues.vert === 'bottom')}
                onClick={() => { labelValues.vert = 'bottom'; labelValues.vert_shift = 0 }}
              >
                {app_data.icon_library.icon_text_vert_pos_bottom}
              </Button>
            </OSTooltip>
            <OSTooltip label={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'vert', prefix) ? "Valeurs multiples" : app_data.t(attributePath + '.tooltips.milieu_v')}>
              <Button
                isDisabled={!disable_attr_props[getLabelAttributeKey(prefix, 'vert')]}
                sx={{ padding: '4px', minWidth: 'auto', height: 'auto', '& svg': { width: '16px', height: '16px' } }}
                variant={getButtonVariant('center', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'vert', prefix), labelValues.vert === 'middle')}
                onClick={() => { labelValues.vert = 'middle'; labelValues.vert_shift = 0 }}
              >
                {app_data.icon_library.icon_text_vert_pos_center}
              </Button>
            </OSTooltip>
            <OSTooltip label={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'vert', prefix) ? "Valeurs multiples" : app_data.t(attributePath + '.tooltips.dessus')}>
              <Button
                isDisabled={!disable_attr_props[getLabelAttributeKey(prefix, 'vert')]}
                sx={{ padding: '4px', minWidth: 'auto', height: 'auto', '& svg': { width: '16px', height: '16px' } }}
                variant={getButtonVariant('right', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'vert', prefix), labelValues.vert === 'top')}
                onClick={() => { labelValues.vert = 'top'; labelValues.vert_shift = 0 }}
              >
                {app_data.icon_library.icon_text_vert_pos_top}
              </Button>
            </OSTooltip>
            <OSTooltip label={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'inside_vert', prefix) ? "Valeurs multiples" : (labelValues.inside_vert ? "Extérieur" : "Intérieur")}>
              <Button
                isDisabled={!disable_attr_props[getLabelAttributeKey(prefix, 'inside_vert')]}
                sx={{ padding: '4px', minWidth: 'auto', height: 'auto', '& svg': { width: '16px', height: '16px' } }}
                variant={getButtonVariant('', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'inside_vert', prefix), labelValues.inside_vert)}
                onClick={() => { labelValues.inside_vert = !labelValues.inside_vert }}
              >
                {app_data.icon_library.icon_label_inside_vert}
              </Button>
            </OSTooltip>
          </Box>
          <Box display="flex" gap={0}>
            <TooltipElementOverloaded prefix={prefix} attributeKey={'vert'} elements={elements} config={BASE_LABEL_CONFIG} t={app_data.t} />
            <TooltipElementOverloaded prefix={prefix} attributeKey={'inside_vert'} elements={elements} config={BASE_LABEL_CONFIG} t={app_data.t} />
          </Box>
        </Box>
      </Box>

      <Box layerStyle='options_2cols'>
        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={attributePath}
          attributeKey={'horiz_shift'}
          config={BASE_LABEL_CONFIG}
          prefix={prefix}
          refreshParentComponent={refreshParentComponent}
          unit_text='px'
        />
        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={attributePath}
          attributeKey={'vert_shift'}
          config={BASE_LABEL_CONFIG}
          prefix={prefix}
          refreshParentComponent={refreshParentComponent}
          unit_text='px'
        />
      </Box>

      <Box layerStyle='options_2cols'>
        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={attributePath}
          attributeKey={'box_width'}
          config={BASE_LABEL_CONFIG}
          prefix={prefix}
          refreshParentComponent={refreshParentComponent}
          unit_text='px'
        />
        <></>
      </Box>

      <Divider />
      <Box as='span' textStyle='title_sub_section'>Fond</Box>
      <MenuShapeAttributes
        app_data={app_data}
        elements={elements}
        attributePath={attributePath}
        prefix={prefix + '_background' as ShapePrefix}
        disable_attr_props={disable_attr_props}
        refreshUI={refreshParentComponent}
      />
    </Box>
  )
}

// ✅ COMPOSANT PRINCIPAL UNIFIÉ
export const MenuConfigurationAppearance = ({
  app_data,
  menu_for_style
}: {
  app_data: Class_ApplicationData
  menu_for_style: boolean
}) => {
  const { t, drawing_area, menu_configuration, icon_library } = app_data
  const { icon_to_the_left, icon_to_the_right, icon_text_vert_pos_top, icon_text_vert_pos_bottom } = icon_library
  const { sankey } = drawing_area
  const [, setCount] = useState(0)
  const { ref_selected_style } = menu_configuration

  // ✅ State pour l'onglet actif : 5 onglets
  type ActiveTab = 'background' | 'shape' | 'name' | 'value' | 'icon'
  const [activeTab, setActiveTab] = useState<ActiveTab>('background')

  // ✅ Récupération éléments
  const getAllSelectedElements = (): (Class_NodeElement | Class_LinkElement | Class_ContainerElement)[] => {
    const elements: (Class_NodeElement | Class_LinkElement | Class_ContainerElement)[] = []
    const selectedNodes = menu_configuration.is_selector_only_for_visible_elements
      ? drawing_area.visible_and_selected_nodes_list_sorted
      : drawing_area.selected_nodes_list_sorted
    elements.push(...selectedNodes)

    const selectedLinks = menu_configuration.is_selector_only_for_visible_elements
      ? drawing_area.visible_and_selected_links_list_sorted
      : drawing_area.selected_links_list_sorted
    elements.push(...selectedLinks)

    const selectedContainers = menu_configuration.is_selector_only_for_visible_elements
      ? drawing_area.visible_and_selected_containers_list_sorted
      : drawing_area.selected_containers_list_sorted
    elements.push(...selectedContainers)

    return elements
  }

  const allElements = (menu_for_style ? [sankey.styles_dict[ref_selected_style.current]] : getAllSelectedElements())
  const selection = analyzeSelection(allElements)
  const elements = allElements as ElementsType
  const base_elements = allElements as Class_NodeElement[] | Class_LinkElement[] | Class_ContainerElement[]
  const links_elements = allElements as Class_LinkElement[] | Class_ElementStyle[]
  const nodes_elements = allElements as Class_NodeBase[] | Class_ElementStyle[]

  menu_configuration.ref_to_menu_config_apparence_updater.current = () => setCount(a => a + 1)

  const refreshAll = () => {
    menu_configuration.ref_to_save_in_cache_indicator.current(false)
    if (selection.hasNodes) {
      menu_configuration.updateComponentRelatedToApparence()
      selection.nodes.forEach(n => n.draw())
    }
    if (selection.hasLinks) {
      menu_configuration.updateComponentRelatedToApparence()
      selection.links.forEach(l => l.draw())
    }
    if (selection.hasContainers) {
      menu_configuration.updateComponentRelatedToApparence()
      selection.containers.forEach(c => c.draw())
    }
    setCount(a => a + 1)
  }

  const disable_attr_props = sankey.styles_dict[ref_selected_style.current].customisable_attribute

  // ✅ Valeurs SHAPE
  const commonShapeValues = allElements.length > 0
    ? getShapeValues(elements, 'shape', refreshAll)
    : Object.fromEntries(Object.entries(BASE_SHAPE_CONFIG).map(([key, value]) => [key, value.default])) as {
      -readonly [K in keyof typeof BASE_SHAPE_CONFIG]:
      ReturnType<(typeof BASE_SHAPE_CONFIG)[K]['type']>
    }

  const nodeShapeValues = allElements.length > 0
    ? getNodeShapeValues(elements, refreshAll)
    : Object.fromEntries(Object.entries(NODE_SHAPE_SPECIFIC_CONFIG).map(([key, value]) => [key, value.default])) as {
      -readonly [K in keyof typeof NODE_SHAPE_SPECIFIC_CONFIG]:
      ReturnType<(typeof NODE_SHAPE_SPECIFIC_CONFIG)[K]['type']>
    }

  const linkShapeValues = allElements.length > 0
    ? getLinkShapeValues(elements, refreshAll)
    : Object.fromEntries(Object.entries(LINK_SHAPE_SPECIFIC_CONFIG).map(([key, value]) => [key, value.default])) as {
      -readonly [K in keyof typeof LINK_SHAPE_SPECIFIC_CONFIG]:
      ReturnType<(typeof LINK_SHAPE_SPECIFIC_CONFIG)[K]['type']>
    }

  // ✅ Valeurs LABELS
  const nameLabelValues = allElements.length > 0
    ? getElementsNameLabelValues(nodes_elements, 'name_label', refreshAll)
    : Object.fromEntries(Object.entries(NAME_LABEL_CONFIG).map(([key, value]) => [key, value.default]))

  const valueLabelValues = allElements.length > 0
    ? getElementsLabelValues(elements, 'value_label', refreshAll)
    : Object.fromEntries(Object.entries(VALUE_LABEL_CONFIG).map(([key, value]) => [key, value.default]))

  const iconValues = allElements.length > 0
    ? getIconValues(elements, refreshAll)
    : Object.fromEntries(Object.entries(ICON_LABEL_BASE_CONFIG).map(([key, value]) => [key, value.default]))

  const showContent = allElements.length > 0 || menu_for_style
  const updateLabelTiedToNodesAtExtremity = (value: boolean) => {
    if (menu_for_style) return
    const containerElements = elements.filter(e => e instanceof Class_ContainerElement) as Class_ContainerElement[]
    const dict_old_val = Object.fromEntries(containerElements.map(d => [d.id, d.at_extremity_of_attached_nodes]))

    const _update = () => {
      containerElements.forEach(d => d.at_extremity_of_attached_nodes = value)
      refreshAll()
    }
    const inv_update = () => {
      containerElements.forEach(d => d.at_extremity_of_attached_nodes = dict_old_val[d.id])
      refreshAll()
    }
    app_data.history.saveUndo(inv_update)
    app_data.history.saveRedo(_update)
    _update()
  }

  const updateLabelExtremityPos = (value: 'top' | 'bottom' | 'left' | 'right') => {
    if (menu_for_style) return
    const containerElements = elements.filter(e => e instanceof Class_ContainerElement) as Class_ContainerElement[]
    const dict_old_val = Object.fromEntries(containerElements.map(d => [d.id, d.extremity_position]))

    const _update = () => {
      containerElements.forEach(d => d.extremity_position = value)
      refreshAll()
    }
    const inv_update = () => {
      containerElements.forEach(d => d.extremity_position = dict_old_val[d.id])
      refreshAll()
    }
    app_data.history.saveUndo(inv_update)
    app_data.history.saveRedo(_update)
    _update()
  }
  const container_element = elements[0] as Class_ContainerElement
  const options_selector_node_tied = !menu_for_style
    ? app_data.drawing_area.sankey.nodes_list_sorted.map((node) => ({
      'label': node.name,
      'value': node.id,
      selected: !selection.hasContainers ? false : selection.containers[0].attached_node.includes(node)
    }))
    : []

  return (
    <Box layerStyle='box_content_config'>
      {/* ✅ SÉLECTEUR MULTI-TYPE */}
      {!menu_for_style && (
        <SankeyMultiTypeSelectionSimple app_data={app_data} />
      )}

      {/* ✅ ConfigMenuStyleElement */}
      {!menu_for_style && allElements.length > 0 && (
        <ConfigMenuStyleElement
          app_data={app_data}
          selected_elements={base_elements}
          config={ALL_ATTRIBUTES_CONFIG}
          categories={activeTab === 'background' || activeTab === 'shape' ? ['shape'] : ['value_label', 'name_label']}
        />
      )}

      {/* ✅ 5 ONGLETS */}
      {showContent && (
        <>
          <Box layerStyle='options_5cols'>
            <Button
              variant={activeTab === 'background' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => setActiveTab('background')}
            >
              {t('Menu.background') || 'Fond'}
            </Button>
            <Button
              variant={activeTab === 'shape' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => setActiveTab('shape')}
            >
              {'Forme'}
            </Button>
            <Button
              variant={activeTab === 'name' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => setActiveTab('name')}
            >
              {t('Noeud.labels.name_label_is_visible') || 'Nom'}
            </Button>
            <Button
              variant={activeTab === 'value' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => setActiveTab('value')}
            >
              {t('Noeud.labels.value_label_is_visible') || 'Valeur'}
            </Button>
            <Button
              variant={activeTab === 'icon' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => setActiveTab('icon')}
            >
              {t('Noeud.labels.icon_is_visible') || 'Icône'}
            </Button>
          </Box>

          {/* ========== ONGLET FOND ========== */}
          {activeTab === 'background' && (
            // <WrapperBoxSubSectionMenu
            //   new_data={app_data}
            //   title={t('Noeud.apparence.shape_visible') || 'Propriétés communes'}
            //   is_open={true}
            // >

            <Box layerStyle='menu_sub_section'>
              <MenuShapeAttributes
                app_data={app_data}
                elements={elements}
                attributePath='Noeud.apparence'
                prefix='shape'
                disable_attr_props={disable_attr_props}
                refreshUI={refreshAll}
              />
            </Box>
            //</WrapperBoxSubSectionMenu>
          )}

          {/* ========== ONGLET FORME ========== */}
          {activeTab === 'shape' && (
            <>
              {(menu_for_style || selection.hasNodes || selection.hasContainers) && (
                // <WrapperBoxSubSectionMenu
                //   new_data={app_data}
                //   title={`${'Forme et géométrie Nœud'} ${!menu_for_style && selection.hasNodes ? `(${selection.nodes.length})` : ''}`}
                //   is_open={!menu_for_style && selection.hasNodes}
                // >

                <Box layerStyle='menu_sub_section'>
                  <Box layerStyle='menuconfigpanel_grid'>
                    <Box as='span' layerStyle='menu_sub_section_title'
                      textStyle='title_sub_section'
                    >{`${'Forme et géométrie Nœud'} ${!menu_for_style && selection.hasNodes ? `(${selection.nodes.length})` : ''}`}</Box>
                    <OSTooltip label={t('Noeud.apparence.tooltips.shape_type')}>
                      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
                        <Box layerStyle='options_2cols'>
                          <Button
                            isDisabled={!disable_attr_props[getShapeAttributeKey('shape', 'type')]}
                            variant={getButtonVariant('left', isShapeValueIndeterminate(elements, 'shape', 'type'), commonShapeValues.type === 'ellipse')}
                            onClick={() => { commonShapeValues.type = 'ellipse' }}
                          >
                            {icon_library.icon_ellipse_shape}
                          </Button>
                          <Button
                            isDisabled={!disable_attr_props[getShapeAttributeKey('shape', 'type')]}
                            variant={getButtonVariant('right', isShapeValueIndeterminate(elements, 'shape', 'type'), commonShapeValues.type === 'rect')}
                            onClick={() => { commonShapeValues.type = 'rect' }}
                          >
                            {icon_library.icon_rect_shape}
                          </Button>
                        </Box>
                        <TooltipElementOverloaded
                          elements={nodes_elements}
                          t={t}
                          attributeKey={'type'}
                          config={BASE_SHAPE_CONFIG}
                          prefix={'shape'}
                        />
                      </Box>
                    </OSTooltip>

                    <Divider />
                    <Box as='span' textStyle='title_sub_section'>Géométrie</Box>
                    <ElementAttrSetterNumberInput2Cols
                      app_data={app_data}
                      elements={elements}
                      attributePath='Noeud.apparence'
                      attributeKey='min_width'
                      prefix='shape'
                      config={BASE_SHAPE_CONFIG}
                      refreshParentComponent={refreshAll}
                      unit_text='px'
                      stepper={true}
                    />
                    <ElementAttrSetterNumberInput2Cols
                      app_data={app_data}
                      elements={elements}
                      attributePath='Noeud.apparence'
                      attributeKey='min_height'
                      prefix='shape'
                      config={BASE_SHAPE_CONFIG}
                      refreshParentComponent={refreshAll}
                      unit_text='px'
                      stepper={true}
                    />
                    <Divider />
                    <Box as='span' textStyle='title_sub_section'>Options</Box>
                    <OSTooltip label={t('Noeud.apparence.tooltips.geometry')}>
                      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
                        <Box layerStyle='menuconfigpanel_option_name'>{t('Noeud.apparence.geometry')}</Box>
                        <Box layerStyle='options_3cols'>
                          {(['absolute', 'parametric', 'relative'] as Type_Position[]).map((type, idx) => (
                            <Button
                              key={type}
                              isDisabled={!disable_attr_props['position_type']}
                              variant={getButtonVariant(
                                idx === 0 ? 'left' : idx === 2 ? 'right' : 'center',
                                isNodeShapeSpecificValueIndeterminate(nodes_elements, 'position_type'),
                                nodeShapeValues.position_type === type
                              )}
                              onClick={() => {
                                nodeShapeValues.position_type = type
                              }}
                            >
                              {t(`Noeud.apparence.geometry_${type}`)}
                            </Button>
                          ))}
                        </Box>
                        <TooltipElementOverloaded
                          elements={nodes_elements}
                          t={t}
                          attributeKey={'position_type'}
                          config={NODE_SHAPE_SPECIFIC_CONFIG}
                          prefix={'shape'}
                        />
                      </Box>
                    </OSTooltip>
                    <Checkbox
                      {...getCheckboxProps(isNodeShapeSpecificValueIndeterminate(nodes_elements, 'orphan_node_visible'))}
                      isDisabled={!disable_attr_props['orphan_node_visible']}
                      isChecked={nodeShapeValues.orphan_node_visible}
                      onChange={(evt) => { nodeShapeValues.orphan_node_visible = evt.target.checked }}
                    >
                      <OSTooltip label={t('Noeud.apparence.tooltips.orphan_node_visible')}>
                        {t('Noeud.apparence.orphan_node_visible')}
                        <TooltipElementOverloaded
                          elements={nodes_elements}
                          t={t}
                          attributeKey={'orphan_node_visible'}
                          config={NODE_SHAPE_SPECIFIC_CONFIG}
                          prefix={'shape'}
                        />
                      </OSTooltip>
                    </Checkbox>
                  </Box>
                </Box>
              )}

              {(menu_for_style || selection.hasLinks) && (
                // <WrapperBoxSubSectionMenu
                //   new_data={app_data}
                //   title={`${'Forme et géométrie Flux'} ${!menu_for_style && selection.hasLinks ? `(${selection.links.length})` : ''}`}
                //   is_open={!menu_for_style && selection.hasLinks}
                // >

                <Box layerStyle='menu_sub_section'>
                  <Box layerStyle='menuconfigpanel_grid'>
                    <Box as='span' layerStyle='menu_sub_section_title'
                      textStyle='title_sub_section'
                    >{`${'Forme et géométrie Flux'} ${!menu_for_style && selection.hasLinks ? `(${selection.links.length})` : ''}`}</Box>

                    <Divider />
                    <Box as='span' textStyle='title_sub_section'>Orientation</Box>
                    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
                      <Box layerStyle='options_4cols'>
                        <OSTooltip label={t('Flux.apparence.tooltips.shape_is_recycling')}>
                          <Button
                            isDisabled={!disable_attr_props[getLinkShapeAttributeKey('shape', 'is_recycling')]}
                            variant={getButtonVariant('', isLinkShapeSpecificValueIndeterminate(links_elements, 'is_recycling'), linkShapeValues.is_recycling)}
                            onClick={() => { linkShapeValues.is_recycling = !linkShapeValues.is_recycling }}
                          >
                            {icon_library.icon_orientation_recycle}
                          </Button>
                        </OSTooltip>
                        <TooltipElementOverloaded
                          elements={links_elements}
                          t={t}
                          attributeKey={'is_recycling'}
                          config={LINK_SHAPE_SPECIFIC_CONFIG}
                          prefix={'shape'}
                        />
                        <></>
                        <></>
                        <></>
                      </Box>
                      <Box layerStyle='options_4cols'>
                        {['hh', 'vv', 'vh', 'hv'].map((orientation, idx) => (
                          <OSTooltip key={orientation} label={t(`Flux.apparence.tooltips.of_${orientation}`)}>
                            <Button
                              isDisabled={!disable_attr_props[getLinkShapeAttributeKey('shape', 'orientation')]}
                              variant={getButtonVariant(
                                idx === 0 ? 'left' : idx === 3 ? 'right' : 'center',
                                isLinkShapeSpecificValueIndeterminate(links_elements, 'orientation'),
                                linkShapeValues.orientation === orientation
                              )}
                              onClick={() => { linkShapeValues.orientation = orientation as Type_Orientation }}
                            >
                              {icon_library[`icon_orientation_${orientation}` as keyof typeof icon_library]}
                            </Button>
                          </OSTooltip>
                        ))}
                      </Box>
                      <TooltipElementOverloaded
                        elements={links_elements}
                        t={t}
                        attributeKey={'orientation'}
                        config={LINK_SHAPE_SPECIFIC_CONFIG}
                        prefix={'shape'}
                      />
                    </Box>

                    <Divider />
                    <Box as='span' textStyle='title_sub_section'>Forme</Box>
                    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
                      <Checkbox
                        {...getCheckboxProps(isLinkShapeSpecificValueIndeterminate(links_elements, 'is_curved'))}
                        isDisabled={!disable_attr_props[getLinkShapeAttributeKey('shape', 'is_curved')]}
                        isChecked={linkShapeValues.is_curved}
                        onChange={(evt) => { linkShapeValues.is_curved = evt.target.checked }}
                      >
                        <OSTooltip label={t('Flux.apparence.tooltips.shape_is_curved')}>
                          {t('Flux.apparence.shape_is_curved')}
                          <TooltipElementOverloaded
                            elements={links_elements}
                            t={t}
                            attributeKey={'is_curved'}
                            config={LINK_SHAPE_SPECIFIC_CONFIG}
                            prefix={'shape'}
                          />
                        </OSTooltip>
                      </Checkbox>
                      {linkShapeValues.is_curved && (
                        <Select
                          isDisabled={!disable_attr_props[getShapeAttributeKey('shape', 'type')]}
                          value={commonShapeValues.type}
                          onChange={(evt) => { commonShapeValues.type = evt.target.value as Type_Shape }}
                        >
                          {menu_configuration.shape_type.map(el => (
                            <option key={'value_' + el} value={el}>{t('Flux.apparence.' + el)}</option>
                          ))}
                        </Select>
                      )}
                    </Box>

                    <Box layerStyle='menuconfigpanel_row_2cols'>
                      <Checkbox
                        {...getCheckboxProps(isLinkShapeSpecificValueIndeterminate(links_elements, 'is_arrow'))}
                        isDisabled={!disable_attr_props[getLinkShapeAttributeKey('shape', 'is_arrow')]}
                        isChecked={linkShapeValues.is_arrow}
                        onChange={(evt) => { linkShapeValues.is_arrow = evt.target.checked }}
                      >
                        <OSTooltip label={t('Flux.apparence.tooltips.fleche')}>
                          {t('Flux.apparence.shape_is_arrow')}
                          <TooltipElementOverloaded
                            elements={links_elements}
                            t={t}
                            attributeKey={'is_arrow'}
                            config={LINK_SHAPE_SPECIFIC_CONFIG}
                            prefix={'shape'}
                          />
                        </OSTooltip>
                      </Checkbox>
                      {linkShapeValues.is_arrow && (
                        <InputGroup variant='menuconfigpanel_option_input'>
                          <ConfigMenuNumberInput
                            disabled={!disable_attr_props[getLinkShapeAttributeKey('shape', 'arrow_size')]}
                            t={t}
                            default_value={linkShapeValues.arrow_size}
                            menu_for_style={menu_for_style}
                            minimum_value={1}
                            unit_text='px'
                            stepper={true}
                            function_on_blur={(value) => { linkShapeValues.arrow_size = value ?? linkShapeValues.arrow_size }}
                            multiValue={isLinkShapeSpecificValueIndeterminate(links_elements, 'arrow_size')}
                          />
                        </InputGroup>
                      )}
                    </Box>
                    <Divider />
                    <Box as='span' textStyle='title_sub_section'>Options</Box>
                    <Checkbox
                      {...getCheckboxProps(isLinkShapeSpecificValueIndeterminate(links_elements, 'is_structure'))}
                      isDisabled={!disable_attr_props[getLinkShapeAttributeKey('shape', 'is_structure')]}
                      isChecked={linkShapeValues.is_structure}
                      onChange={(evt) => {
                        linkShapeValues.is_structure = evt.target.checked
                      }}>
                      <OSTooltip label={t('Flux.apparence.tooltips.structure')}>
                        {t('Flux.apparence.shape_is_structure')}
                        <TooltipElementOverloaded
                          elements={links_elements}
                          t={t}
                          attributeKey={'is_structure'}
                          config={LINK_SHAPE_SPECIFIC_CONFIG}
                          prefix={'shape'}
                        />
                      </OSTooltip>
                    </Checkbox>

                    {/* Value of link local scale to override scale from DA, can be undefined */}
                    <OSTooltip label={t('Flux.apparence.tooltips.local_scale')}>
                      <>
                        <Box as='span' layerStyle='options_2cols' >
                          <Box layerStyle='menuconfigpanel_option_name' >
                            {t('Flux.apparence.shape_local_link_scale')}
                            <TooltipElementOverloaded
                              elements={links_elements}
                              t={t}
                              attributeKey={'local_link_scale'}
                              config={LINK_SHAPE_SPECIFIC_CONFIG}
                              prefix={'shape'}
                            />
                          </Box>
                          <ConfigMenuNumberOrUndefinedInput
                            disabled={!disable_attr_props[getLinkShapeAttributeKey('shape', 'local_link_scale')]}
                            default_value={linkShapeValues.local_link_scale}
                            function_on_blur={(_) => {
                              linkShapeValues.local_link_scale = _ ?? linkShapeValues.local_link_scale
                            }}
                            minimum_value={0}
                            stepper={true}
                            step={1}
                          />
                        </Box>
                      </>
                    </OSTooltip>
                  </Box>
                </Box>
              )}
              {(selection.hasContainers) && (
                <>
                  <Box layerStyle='menu_sub_section'>
                    <Checkbox
                      variant='menuconfigpanel_option_checkbox'
                      iconColor={'white'}
                      isChecked={elements.length > 0 ? container_element.tied_to_nodes : false}
                      onChange={(evt) => {
                        container_element.tied_to_nodes = evt.target.checked
                        refreshAll()
                      }}>
                      <OSTooltip label={t('LL.tooltips.tiedToNodes')} placement='left'>{t('LL.tiedToNodes')}</OSTooltip>
                    </Checkbox>

                    {elements.length > 0 && container_element.tied_to_nodes ? <Box>
                      <OSMultiSelect
                        t={app_data.t}
                        elements={options_selector_node_tied}
                        onClick={(entries) => {
                          const entries_values = entries.map(d => d.value)
                          const containerElements = elements.filter(e => e instanceof Class_ContainerElement) as Class_ContainerElement[]

                          app_data.drawing_area.sankey.nodes_list.forEach(node => {
                            if (entries_values.includes(node.id)) {
                              containerElements.forEach(zdt => { zdt.attachNodeToCont(node) })
                            } else {
                              containerElements.forEach(zdt => { zdt.dettachNodeFromCont(node) })
                            }
                          })
                          refreshAll()
                        }}
                      />
                      <Box layerStyle='menuconfigpanel_option_name'>{t('LL.margin')}</Box>
                      <OSTooltip label={t('LL.tooltips.margin')} placement='left'>
                        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
                          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
                            <Box layerStyle='menuconfigpanel_option_name'>{t('LL.marginLeft') || 'Left'}</Box>
                            <ConfigMenuNumberInput
                              t={app_data.t}
                              disabled={!disable_attr_props['margin_left']}
                              default_value={nodeShapeValues.margin_left}
                              function_on_blur={(value: number | null) => nodeShapeValues.margin_left = value!}
                              minimum_value={0}
                              stepper={true} />
                          </Box>
                          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
                            <Box layerStyle='menuconfigpanel_option_name'>{t('LL.marginTop') || 'Top'}</Box>
                            <ConfigMenuNumberInput
                              t={app_data.t}
                              disabled={!disable_attr_props['margin_right']}
                              default_value={nodeShapeValues.margin_right}
                              function_on_blur={(value: number | null) => nodeShapeValues.margin_right = value!}
                              minimum_value={0}
                              stepper={true} />
                          </Box>
                        </Box>
                        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
                          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
                            <Box layerStyle='menuconfigpanel_option_name'>{t('LL.marginLeft') || 'Left'}</Box>
                            <ConfigMenuNumberInput
                              t={app_data.t}
                              disabled={!disable_attr_props['margin_top']}
                              default_value={nodeShapeValues.margin_top}
                              function_on_blur={(value: number | null) => nodeShapeValues.margin_top = value!}
                              minimum_value={0}
                              stepper={true} />
                          </Box>
                          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
                            <Box layerStyle='menuconfigpanel_option_name'>{t('LL.marginLeft') || 'Left'}</Box>
                            <ConfigMenuNumberInput
                              t={app_data.t}
                              disabled={!disable_attr_props['margin_bottom']}
                              default_value={nodeShapeValues.margin_bottom}
                              function_on_blur={(value: number | null) => nodeShapeValues.margin_bottom = value!}
                              minimum_value={0}
                              stepper={true} />
                          </Box>
                        </Box>
                      </OSTooltip>

                      <Checkbox
                        variant='menuconfigpanel_option_checkbox'
                        iconColor={'white'}
                        isChecked={elements.length > 0 ? container_element.at_extremity_of_attached_nodes : false}
                        onChange={(evt) => updateLabelTiedToNodesAtExtremity(evt.target.checked)}>
                        <OSTooltip label={t('LL.tooltips.tiedToNodesExtremity')} placement='left'>{t('LL.tiedToNodesExtremity')}</OSTooltip>
                      </Checkbox>

                      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
                        <Box layerStyle='menuconfigpanel_option_name'>{t('LL.extremityPos')}</Box>
                        <ButtonGroup isAttached>
                          <Button
                            variant={elements.length > 0 && container_element.extremity_position === 'top' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                            onClick={() => { updateLabelExtremityPos('top') }}>{icon_text_vert_pos_top}</Button>
                          <Button
                            variant={elements.length > 0 && container_element.extremity_position === 'bottom' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                            onClick={() => { updateLabelExtremityPos('bottom') }}>{icon_text_vert_pos_bottom}</Button>
                          <Button
                            variant={elements.length > 0 && container_element.extremity_position === 'left' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                            onClick={() => { updateLabelExtremityPos('left') }}>{icon_to_the_left}</Button>
                          <Button
                            variant={elements.length > 0 && container_element.extremity_position === 'right' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
                            onClick={() => { updateLabelExtremityPos('right') }}>{icon_to_the_right}</Button>
                        </ButtonGroup>
                      </Box>
                    </Box> : <></>}
                  </Box></>
              )}
            </>
          )}

          {/* ========== ONGLETS LABELS ========== */}
          {activeTab === 'name' && (
            <MenuSectionCheckbox
              app_data={app_data}
              elements={elements}
              attributePath='Noeud.labels'
              attributeKey={'is_visible'}
              config={NAME_LABEL_CONFIG}
              prefix={'name_label'}
              refreshParentComponent={refreshAll}
            >
              {nameLabelValues.is_visible && (
                <LabelContentComponent
                  app_data={app_data}
                  elements={elements}
                  prefix={'name_label'}
                  refreshParentComponent={refreshAll}
                />
              )}
            </MenuSectionCheckbox>
          )}

          {activeTab === 'value' && (
            <MenuSectionCheckbox
              app_data={app_data}
              elements={elements}
              attributePath='Noeud.labels'
              attributeKey={'is_visible'}
              config={VALUE_LABEL_CONFIG}
              prefix={'value_label'}
              refreshParentComponent={refreshAll}
            >
              {valueLabelValues.is_visible && (
                <LabelContentComponent
                  app_data={app_data}
                  elements={elements}
                  prefix={'value_label'}
                  refreshParentComponent={refreshAll}
                />
              )}
            </MenuSectionCheckbox>
          )}

          {activeTab === 'icon' && (
            <MenuSectionCheckbox
              app_data={app_data}
              elements={elements}
              attributePath='Noeud.labels'
              attributeKey={'is_visible'}
              config={ICON_LABEL_BASE_CONFIG}
              prefix={'icon'}
              refreshParentComponent={refreshAll}
            >
              {iconValues.is_visible && (
                <LabelContentComponent
                  app_data={app_data}
                  elements={elements}
                  prefix={'icon'}
                  refreshParentComponent={refreshAll}
                />
              )}
            </MenuSectionCheckbox>
          )}
        </>
      )}
    </Box>
  )
}

interface MenuShapeAttributesProps {
  app_data: Class_ApplicationData
  elements: Class_NodeBase[] | Class_LinkElement[] | Class_ElementStyle[] | Class_ContainerElement[]
  attributePath: string
  prefix: ShapePrefix
  disable_attr_props: Record<string, boolean>
  refreshUI: () => void
}

export const MenuShapeAttributes = ({
  app_data, elements, attributePath, prefix, disable_attr_props, refreshUI
}: MenuShapeAttributesProps) => {
  const { t, icon_library } = app_data
  const { icon_locked, icon_unlocked } = icon_library

  if (!elements || !attributePath || !disable_attr_props || !prefix || !refreshUI) return <></>

  const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_ElementStyle)
  const config = BASE_SHAPE_CONFIG
  const base_elements = elements as Class_NodeElement[] | Class_LinkElement[] | Class_ContainerElement[]

  const shapeValues = elements.length > 0
    ? getShapeValues(elements, prefix, refreshUI)
    : Object.fromEntries(
      Object.entries(config).map(([key, value]) => [key, value.default])
    ) as {
      -readonly [K in keyof typeof config]: ReturnType<(typeof config)[K]['type']>
    }
  const linkShapeValues = elements.length > 0
    ? getLinkShapeValues(elements, refreshUI)
    : Object.fromEntries(Object.entries(LINK_SHAPE_SPECIFIC_CONFIG).map(([key, value]) => [key, value.default])) as {
      -readonly [K in keyof typeof LINK_SHAPE_SPECIFIC_CONFIG]:
      ReturnType<(typeof LINK_SHAPE_SPECIFIC_CONFIG)[K]['type']>
    }

  const selection = analyzeSelection(base_elements)

  return (
    <>
      {/* Fond visible + Couleur */}
      {/* Choix de la source de la couleur */}
      {/* <Box layerStyle='menuconfigpanel_grid'> */}
      <Box as='span' layerStyle='menu_sub_section_title'
        textStyle='title_sub_section'
      >{`${'Fond Flux'} ${!menu_for_style && selection.hasLinks ? `(${selection.links.length})` : ''}`}</Box>
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box layerStyle='menuconfigpanel_option_name'>
          {app_data.t('Flux.apparence.shape_color_rule')}
          <TooltipElementOverloaded
            prefix={prefix} attributeKey={'color_rule'} elements={elements} config={LINK_SHAPE_SPECIFIC_CONFIG} t={app_data.t}
          />
        </Box>
        <OSTooltip label={t('Flux.apparence.tooltips.color_source.def')}>
          <Select
            isDisabled={!disable_attr_props[getLinkShapeAttributeKey('shape', 'color_rule')]}
            value={linkShapeValues.color_rule}
            onChange={(evt) => {
              //@ts-expect-error xxx
              linkShapeValues.color_rule = evt.target.value
            }}
          >
            {app_data.menu_configuration.flow_color_origin_type.map(el => {
              return <option key={'value_' + el} value={el}>{t('Flux.apparence.' + el)}</option>
            })}
          </Select>
        </OSTooltip>
      </Box>
      <Divider />
      <Box as='span' layerStyle='options_2cols'>
        <Checkbox
          {...getCheckboxProps(isShapeValueIndeterminate(elements, prefix, 'color_visible'))}
          isDisabled={!disable_attr_props[getShapeAttributeKey(prefix, 'color_visible')]}
          isChecked={shapeValues.color_visible}
          onChange={(evt) => {
            shapeValues.color_visible = evt.target.checked
          }}
        >
          <OSTooltip label={t(`${attributePath}.tooltips.${getShapeAttributeKey(prefix, 'color_visible')}`) || 'Afficher le fond'}>
            {t(`${attributePath}.${getShapeAttributeKey(prefix, 'color_visible')}`) || 'Fond visible'}
            {!menu_for_style ?
              <TooltipElementOverloaded
                elements={base_elements}
                t={t}
                attributeKey={'color_visible'}
                config={config}
                prefix={prefix} /> : <></>}
          </OSTooltip>
        </Checkbox>
        <Box layerStyle='option_with_activation'>
          <OSTooltip label={t(`${attributePath}.tooltips.${getShapeAttributeKey(prefix, 'color')}`)}>
            <Box>
              <MenuColorPicker
                isDisabled={!disable_attr_props[getShapeAttributeKey(prefix, 'color')]}
                initialColor={shapeValues.color}
                onColorChange={(new_color) => {
                  shapeValues.color = new_color
                }} />
            </Box>
          </OSTooltip>
          <OSTooltip label={t(`${attributePath}.tooltips.color_sustainable`)}>
            <Button
              isDisabled={!disable_attr_props[getShapeAttributeKey(prefix, 'color_sustainable')]}
              variant={shapeValues.color_sustainable ?
                'menuconfigpanel_option_button_activated' :
                'menuconfigpanel_option_button'}
              onClick={() => {
                shapeValues.color_sustainable = !shapeValues.color_sustainable
              }}
            >
              {shapeValues.color_sustainable ? icon_locked : icon_unlocked}
              {!menu_for_style ?
                <TooltipElementOverloaded
                  elements={base_elements}
                  t={t}
                  attributeKey={'color_sustainable'}
                  config={config}
                  prefix={prefix} /> : <></>}
            </Button>
          </OSTooltip>
        </Box>
      </Box>

      <Box as='span' layerStyle='options_2cols'>
        {/* Shape Opacity */}
        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={attributePath}
          attributeKey={'opacity'}
          prefix={prefix}
          config={BASE_SHAPE_CONFIG}
          refreshParentComponent={refreshUI}
          unit_text=''
          minimum_value={0}
          maximum_value={1}
          step={0.1}
          stepper={true} />
        {/* Radius */}
        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={attributePath}
          attributeKey={'border_radius'}
          prefix={prefix}
          config={BASE_SHAPE_CONFIG}
          refreshParentComponent={refreshUI}
          unit_text='px'
          minimum_value={0}
          maximum_value={20}
          stepper={true} />
      </Box>

      {/* Bordure visible + Couleur */}
      <Box as='span' layerStyle='options_2cols'>
        <Checkbox
          {...getCheckboxProps(isShapeValueIndeterminate(elements, prefix, 'border_visible'))}
          isDisabled={!disable_attr_props[getShapeAttributeKey(prefix, 'border_visible')]}
          isChecked={shapeValues.border_visible}
          onChange={(evt) => {
            shapeValues.border_visible = evt.target.checked
          }}
        >
          <OSTooltip label={t(`${attributePath}.tooltips.${getShapeAttributeKey(prefix, 'border_visible')}`) || 'Afficher la bordure'}>
            {t(`${attributePath}.${getShapeAttributeKey(prefix, 'border_visible')}`) || 'Bordure visible'}
            {!menu_for_style ?
              <TooltipElementOverloaded
                elements={base_elements}
                t={t}
                attributeKey={'border_visible'}
                config={config}
                prefix={prefix} /> : <></>}
          </OSTooltip>
        </Checkbox>

        <OSTooltip label={t(`${attributePath}.tooltips.${getShapeAttributeKey(prefix, 'border_color')}`) || 'Couleur de la bordure'}>
          <MenuColorPicker
            isDisabled={!disable_attr_props[getShapeAttributeKey(prefix, 'border_color')]}
            initialColor={shapeValues.border_color}
            onColorChange={(new_color) => {
              shapeValues.border_color = new_color
            }} />
        </OSTooltip>
      </Box>

      <Box as='span' layerStyle='options_2cols'>
        {/* Épaisseur */}
        <ElementAttrSetterNumberInput2Cols
          app_data={app_data}
          elements={elements}
          attributePath={attributePath}
          attributeKey={'border_thickness'}
          config={BASE_SHAPE_CONFIG}
          prefix={prefix}
          refreshParentComponent={refreshUI}
          unit_text='px'
          minimum_value={0}
          maximum_value={20}
          stepper={true} />

        {/* Pointillés */}
        <Checkbox
          {...getCheckboxProps(isShapeValueIndeterminate(elements, prefix, 'border_dashed'))}
          isDisabled={!disable_attr_props[getShapeAttributeKey(prefix, 'border_dashed')]}
          isChecked={shapeValues.border_dashed}
          onChange={(evt) => {
            shapeValues.border_dashed = evt.target.checked
          }}
        >
          <OSTooltip label={t(`${attributePath}.tooltips.${getShapeAttributeKey(prefix, 'border_dashed')}`)}>
            {t(`${attributePath}.${getShapeAttributeKey(prefix, 'border_dashed')}`)}
            {!menu_for_style ?
              <TooltipElementOverloaded
                elements={base_elements}
                t={t}
                attributeKey={'border_dashed'}
                config={config}
                prefix={prefix} /> : <></>}
          </OSTooltip>
        </Checkbox>
        <Box />
      </Box>
    </>
  )
}