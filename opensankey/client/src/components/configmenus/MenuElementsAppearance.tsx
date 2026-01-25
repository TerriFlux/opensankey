// ==================================================================================================
// COMPOSANT UNIFIÉ : MenuConfigurationAppearance
// Fusionne Shape + Labels avec 5 onglets : Fond | Forme | Nom | Valeur | Icône
// ==================================================================================================

import React, { useState, useRef, ChangeEvent, MutableRefObject } from 'react'
import { Box, Button, Checkbox, InputGroup, Select, Divider, Input } from '@chakra-ui/react'
import { FaAlignCenter, FaAlignLeft, FaAlignRight } from 'react-icons/fa'
import { MdTextRotateVertical, MdTextRotationNone } from 'react-icons/md'
import { TFunction } from 'i18next'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_NodeElement } from '../../Elements/Node'
import { Class_LinkElement } from '../../Elements/Link'
import { Class_ContainerElement } from '../../Elements/TextZone'
import { Class_ElementStyle } from '../../Elements/Element'
import { Class_NodeBase } from '../../Elements/NodeBase'
import { Type_Position } from '../../types/Utils'
import { svg_label_upper } from '../../css/IconLibrairie'
import { ConfigMenuStyleElement } from '../dialogs/SankeyStyle'
import {
  ElementAttrSetterNumberInput2Cols,
  ConfigMenuNumberInput,
  OSTooltip,
  MenuSectionCheckbox,
  MenuColorPicker,
  getButtonVariant,
  TooltipElementOverloaded,
  OSMultiSelect,
  ElementAttrSetterTextInput2Cols,
  ElementAttrSetterSelect2Cols,
  ColorPickerWithSustainable,
  OverloadedButton,
  OverloadedButtonGroup,
  OverloadedCheckbox,
  isElementAttributeOverloaded,
  InputIndicatorWrapper,
  CustomFaEyeCheckIcon,
  OverloadIndicatorWrapper
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
  getNodeShapeAttributeKey,
  getLabelAttributeKey,
  getConfigValues,
  getLinkShapeAttributeKey
} from '../../Elements/ElementsAttributesConfig'
import { SankeyMultiTypeSelectionSimple } from './MenuElementsSelection'
import { unit_constants } from '../../Elements/LinkValues'

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

/**
 * Composant pour sélectionner le mode d'affichage d'un label
 * Gère 3 modes pour les labels de texte : simple_text, rich_text, value
 * Gère 2 modes pour les icônes : icon, image
 */
export const LabelDisplayModeSelector = ({
  prefix,
  labelValues,
  app_data,
  menu_style = false,
  display_mode_name_label,
  refreshAll,
  t
}: {
  prefix: string
  labelValues: any
  app_data: Class_ApplicationData
  menu_style?: boolean
  display_mode_name_label: MutableRefObject<'simple_text' | 'rich_text' | 'value'>
  refreshAll: () => void
  t: TFunction
}) => {
  const setModeSimpleText = () => {
    labelValues.has_fo = false
    display_mode_name_label.current = 'simple_text'
    refreshAll()
  }

  const setModeRichText = () => {
    labelValues.has_fo = true
    display_mode_name_label.current = 'rich_text'
    refreshAll()
  }

  const setModeValue = () => {
    labelValues.has_fo = false
    display_mode_name_label.current = 'value'
    refreshAll()
  }

  const setModeIcon = () => {
    labelValues.has_fo = false
    labelValues.is_icon = true
    labelValues.is_image = false
    refreshAll()
  }

  const setModeImage = () => {
    labelValues.has_fo = false
    labelValues.is_icon = false
    labelValues.is_image = true
    refreshAll()
  }

  if (prefix === 'name_label') {
    return (
      <Box layerStyle='options_3cols'>
        <OSTooltip label={t('Menu.display_mode.tooltips.simple_text')}>
          <Button
            variant={display_mode_name_label.current === 'simple_text' ? 'menuconfigpanel_option_button_activated_left' : 'menuconfigpanel_option_button_left'}
            sx={{ padding: '4px', minWidth: 'auto', height: 'auto' }}
            onClick={setModeSimpleText}
          >
            {app_data.icon_library.icon_text_mode_simple}
          </Button>
        </OSTooltip>
        <OSTooltip label={t('Menu.display_mode.tooltips.rich_text')}>
          <Button
            variant={display_mode_name_label.current === 'rich_text' ? 'menuconfigpanel_option_button_activated_center' : 'menuconfigpanel_option_button_center'}
            sx={{ padding: '4px', minWidth: 'auto', height: 'auto' }}
            onClick={setModeRichText}
          >
            {app_data.icon_library.icon_text_mode_rich}
          </Button>
        </OSTooltip>
        <OSTooltip label={t('Menu.display_mode.tooltips.value')}>
          <Button
            variant={display_mode_name_label.current === 'value' ? 'menuconfigpanel_option_button_activated_right' : 'menuconfigpanel_option_button_right'}
            sx={{ padding: '4px', minWidth: 'auto', height: 'auto' }}
            onClick={setModeValue}
          >
            {app_data.icon_library.icon_text_mode_value}
          </Button>
        </OSTooltip>
      </Box>
    )
  }

  // Mode icône (icon label) - seulement si pas en mode style
  if (prefix === 'icon' && !menu_style) {
    return (
      <Box layerStyle='options_2cols'>
        <OSTooltip label={t('Menu.display_mode.tooltips.icon')}>
          <Button
            variant={labelValues.is_icon ? 'menuconfigpanel_option_button_activated_left' : 'menuconfigpanel_option_button_left'}
            sx={{ padding: '4px', minWidth: 'auto', height: 'auto' }}
            onClick={setModeIcon}
          >
            {t('Menu.display_mode.icon')}
          </Button>
        </OSTooltip>
        <OSTooltip label={t('Menu.display_mode.tooltips.image')}>
          <Button
            variant={labelValues.is_image ? 'menuconfigpanel_option_button_activated_right' : 'menuconfigpanel_option_button_right'}
            sx={{ padding: '4px', minWidth: 'auto', height: 'auto' }}
            onClick={setModeImage}
          >
            {t('Menu.display_mode.image')}
          </Button>
        </OSTooltip>
      </Box>
    )
  }

  // Pas de sélecteur pour les autres cas
  return null
}

/**
 * Section complète de formatage de texte (police, taille, gras, italique, majuscules)
 * Affichée uniquement pour les modes simple_text et value
 */

// ✅ Sous-composant pour le contenu des labels
const LabelContentComponent = ({
  app_data,
  elements,
  prefix,
  displayMode,
  menu_style,
  refreshParentComponent
}: {
  app_data: Class_ApplicationData
  elements: ElementsType
  prefix: 'name_label' | 'value_label' | 'icon'
  displayMode: 'simple_text' | 'rich_text' | 'icon' | 'image' | 'value'
  menu_style: boolean
  refreshParentComponent: () => void
}) => {
  const { t } = app_data
  const labelValues = elements.length > 0
    ? getElementsLabelValues(elements, prefix, refreshParentComponent)
    : Object.fromEntries(Object.entries(BASE_LABEL_CONFIG).map(([key, value]) => [key, value.default])) as {
      -readonly [K in keyof typeof BASE_LABEL_CONFIG]:
      ReturnType<(typeof BASE_LABEL_CONFIG)[K]['type']>
    }
  //@ts-expect-error xxx
  const selection = analyzeSelection(elements)
  const unit_tagg = app_data.drawing_area.sankey.data_taggs_list.find(tagg => tagg.is_unit)



  const menu_for_style = elements.length > 0 && (elements[0] instanceof Class_ElementStyle)
  const base_elements = elements as Class_NodeBase[] | Class_LinkElement[]
  const links_elements = elements as Class_LinkElement[] | Class_ElementStyle[]
  const nodes_elements = elements as Class_NodeElement[] | Class_ElementStyle[]

  const linkLabelValues = elements.length > 0
    ? getLinksLabelValues(links_elements, prefix, refreshParentComponent)
    : Object.fromEntries(Object.entries(LINKS_LABEL_SPECIFIC_CONFIG).map(([key, value]) => [key, value.default]))

  const nodeLabelValues = elements.length > 0
    ? getElementsNameLabelValues(nodes_elements, prefix, refreshParentComponent)
    : Object.fromEntries(Object.entries(NAME_LABEL_CONFIG).map(([key, value]) => [key, value.default]))

  const _load_image = useRef<HTMLInputElement>(null)

  const firstElement = elements.length > 0 ? elements[0] as Class_NodeBase : null
  const iconColor = firstElement?.icon_color ?? '#ffffff'
  const iconColorSustainable = firstElement?.icon_color_sustainable ?? false

  const attributePath = 'Noeud.labels'

  return (
    <Box layerStyle='menuconfigpanel_grid'>
      {(prefix === 'value_label' || displayMode == 'value') && (<>
        <Divider />
        <Box layerStyle='options_1_2_2cols'>
          <Checkbox
            variant='menuconfigpanel_part_title_1_checkbox'
            icon={<CustomFaEyeCheckIcon />}
            isChecked={labelValues.unit_visible}
            onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
              labelValues.unit_visible = evt.target.checked
            }}
          >
            <OSTooltip label={t(`${String(attributePath)}.tooltips.value_label_unit_visible`)}>
              {t(`${String(attributePath)}.value_label_unit_visible`)}
            </OSTooltip>
          </Checkbox>
          {labelValues.unit_visible ? <>
            <InputIndicatorWrapper
              isOverloaded={isElementAttributeOverloaded(
                elements,
                `${prefix}_unit_type` as keyof typeof VALUE_LABEL_CONFIG,
                VALUE_LABEL_CONFIG
              )}
              isMultiValue={isConfigValueIndeterminate(elements, VALUE_LABEL_CONFIG, 'unit_type', prefix)}
              t={app_data.t}
            >
              <Select
                value={labelValues.unit_type}
                onChange={(evt) => {
                  labelValues.unit_type = evt.target.value
                }}
              >
                {unit_constants.map(el => (
                  <option key={'value_' + el} value={el}>
                    {app_data.t('Flux.labels.' + el)}
                  </option>
                ))}
              </Select>
            </InputIndicatorWrapper>

            {/* Select pour unit tag (quand type = other_unit_tag) */}
            {labelValues.unit_type == 'other_unit_tag' && unit_tagg && (
              <ElementAttrSetterSelect2Cols
                app_data={app_data}
                elements={elements}
                attributePath={attributePath}
                attributeKey={'unit'}
                config={VALUE_LABEL_CONFIG}
                prefix={prefix}
                options={unit_tagg.tags_list.map(el => ({
                  key: 'value_' + el.id,
                  value: el.id,
                  label: el.name
                }))}
                refreshParentComponent={refreshParentComponent}
              />
            )}

            {/* Text input et number input pour unit_name */}
            {labelValues.unit_type == 'unit_name' && (<>
              <InputIndicatorWrapper
                isOverloaded={isElementAttributeOverloaded(
                  elements,
                  `${prefix}_unit` as keyof typeof VALUE_LABEL_CONFIG,
                  VALUE_LABEL_CONFIG
                )}
                isMultiValue={isConfigValueIndeterminate(elements, VALUE_LABEL_CONFIG, 'unit', prefix)}
                t={app_data.t}
              >
                <Input
                  variant='menuconfigpanel_option_input'
                  value={labelValues.unit ?? ''}
                  placeholder="nom de l'unité"
                  onChange={(evt) => {
                    labelValues.unit = evt.target.value
                  }}
                  onBlur={(evt) => {
                    labelValues.unit = evt.target.value || ''
                  }}
                />
              </InputIndicatorWrapper>
            </>
            )}
          </> : <></>}
        </Box>
        <Box layerStyle='options_5cols'>
          {/* Checkbox 1 : Décimales personnalisées */}
          <OverloadedCheckbox
            elements={elements}
            config={VALUE_LABEL_CONFIG}
            prefix={prefix as any}
            attributeKey={'custom_digit'}
            isChecked={labelValues.custom_digit}
            onChange={(checked) => { labelValues.custom_digit = checked }}
            getIsIndeterminate={() => isConfigValueIndeterminate(elements, VALUE_LABEL_CONFIG, 'custom_digit', prefix)}
            tooltipLabel={t(`${attributePath}.tooltips.${getLabelAttributeKey(prefix, 'custom_digit')}`)}
            t={t}
          >
            <Box display="flex" alignItems="center" gap={1}>
              .##
            </Box>
          </OverloadedCheckbox>

          {/* Input 1 : Nombre de décimales */}
          {labelValues.custom_digit ? (
            <ConfigMenuNumberInput
              t={t}
              default_value={labelValues.nb_digit}
              menu_for_style={menu_for_style}
              minimum_value={0}
              stepper={true}
              function_on_blur={(value) => { labelValues.nb_digit = value ?? 0 }}
              multiValue={isConfigValueIndeterminate(elements, VALUE_LABEL_CONFIG, 'nb_digit', prefix)}
              isOverloaded={isElementAttributeOverloaded(elements, `${prefix}_nb_digit` as keyof typeof VALUE_LABEL_CONFIG, VALUE_LABEL_CONFIG)}
            />
          ) : <Box />}

          {/* Checkbox 2 : Notation scientifique */}
          <OverloadedCheckbox
            elements={elements}
            config={VALUE_LABEL_CONFIG}
            prefix={prefix as any}
            attributeKey={'scientific_notation'}
            isChecked={labelValues.scientific_notation}
            onChange={(checked) => { labelValues.scientific_notation = checked }}
            getIsIndeterminate={() => isConfigValueIndeterminate(elements, VALUE_LABEL_CONFIG, 'scientific_notation', prefix)}
            tooltipLabel={t('Flux.labels.tooltips.value_label_scientific_notation')}
            t={t}
          >
            <Box display="flex" alignItems="center" gap={1}>
              #e^#
            </Box>
          </OverloadedCheckbox>
          {/* Checkbox 3 : Chiffres significatifs */}
          <OverloadedCheckbox
            elements={elements}
            config={VALUE_LABEL_CONFIG}
            prefix={prefix as any}
            attributeKey={'significant_digits'}
            isChecked={labelValues.significant_digits}
            onChange={(checked) => { labelValues.significant_digits = checked }}
            getIsIndeterminate={() => isConfigValueIndeterminate(elements, VALUE_LABEL_CONFIG, 'significant_digits', prefix)}
            tooltipLabel={t(`${attributePath}.tooltips.${getLabelAttributeKey(prefix, 'significant_digits')}`)}
            t={t}
          >
            <Box display="flex" alignItems="center" gap={1}>
              #.##
            </Box>
          </OverloadedCheckbox>

          {/* Input 2 : Nombre de chiffres significatifs */}
          {labelValues.significant_digits ? (
            <ConfigMenuNumberInput
              t={t}
              default_value={labelValues.nb_significant_digits}
              menu_for_style={menu_for_style}
              minimum_value={0}
              stepper={true}
              function_on_blur={(value) => { labelValues.nb_significant_digits = value ?? 0 }}
              multiValue={isConfigValueIndeterminate(elements, VALUE_LABEL_CONFIG, 'nb_significant_digits', prefix)}
              isOverloaded={isElementAttributeOverloaded(elements, `${prefix}_nb_significant_digits` as keyof typeof VALUE_LABEL_CONFIG, VALUE_LABEL_CONFIG)}
            />

          ) : <Box />}
        </Box>
        <Box layerStyle='options_2cols'>
          <ElementAttrSetterNumberInput2Cols
            app_data={app_data}
            elements={elements}
            attributePath={attributePath}
            attributeKey={'unit_factor'}
            config={VALUE_LABEL_CONFIG}
            prefix={prefix}
            refreshParentComponent={refreshParentComponent}
            stepper={false}
            isOverloaded={isElementAttributeOverloaded(elements, prefix + '_' + String('unit_factor') as keyof typeof VALUE_LABEL_CONFIG, VALUE_LABEL_CONFIG)}
          />
        </Box>
        {/* </Box> */}
      </>
      )}
      <Box as='span' layerStyle='options_2_1_2cols'>
        {/* Section TEXT */}
        {(displayMode === 'simple_text' || displayMode === 'value') && (<>
          <InputIndicatorWrapper
            isOverloaded={isElementAttributeOverloaded(
              elements,
              `${prefix}_font_family` as keyof typeof BASE_LABEL_CONFIG,
              BASE_LABEL_CONFIG
            )}
            isMultiValue={isConfigValueIndeterminate(
              elements,
              BASE_LABEL_CONFIG,
              'font_family',
              prefix
            )}
            t={t}
          >
            <Select
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
          </InputIndicatorWrapper>

          <ConfigMenuNumberInput
            t={app_data.t}
            default_value={labelValues.font_size}
            menu_for_style={menu_for_style}
            minimum_value={11}
            stepper={true}
            unit_text='px'
            function_on_blur={(value) => { labelValues.font_size = value ?? labelValues.font_size }}
            multiValue={isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'font_size', prefix)}
            isOverloaded={isElementAttributeOverloaded(elements, `${prefix}_font_size` as keyof typeof BASE_LABEL_CONFIG, BASE_LABEL_CONFIG)}
          />


          <Box display="flex" alignItems="center" gap={1}>
            <Box layerStyle='options_3cols'>
              <OverloadedButton
                elements={elements}
                config={BASE_LABEL_CONFIG}
                attributePath={attributePath}
                prefix={prefix}
                attributeKey="bold"
                variant={getButtonVariant('left', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'bold', prefix), labelValues.bold)}
                onClick={() => { labelValues.bold = !labelValues.bold }}
              >
                {app_data.icon_library.icon_text_bold}
              </OverloadedButton>

              <OverloadedButton
                elements={elements}
                config={BASE_LABEL_CONFIG}
                attributePath={attributePath}
                prefix={prefix}
                attributeKey="uppercase"
                variant={getButtonVariant('center', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'uppercase', prefix), labelValues.uppercase)}
                onClick={() => { labelValues.uppercase = !labelValues.uppercase }}
              >
                {svg_label_upper}
              </OverloadedButton>

              <OverloadedButton
                elements={elements}
                config={BASE_LABEL_CONFIG}
                attributePath={attributePath}
                prefix={prefix}
                attributeKey="italic"
                variant={getButtonVariant('right', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'italic', prefix), labelValues.italic)}
                onClick={() => { labelValues.italic = !labelValues.italic }}
              >
                {app_data.icon_library.icon_text_italic}
              </OverloadedButton>
            </Box>
          </Box>
        </>)}
      </Box>
      {(displayMode === 'simple_text' || displayMode === 'value') && (<>
        <Box layerStyle='options_3cols'>
          <Box layerStyle='options_4cols'>

            <OverloadedButtonGroup
              elements={elements}
              config={BASE_LABEL_CONFIG}
              attributePath={attributePath}
              prefix={prefix}
              attributeKey="text_align"
              currentValue={labelValues.text_align}
              items={[
                { value: 'left', icon: <FaAlignLeft /> },
                { value: 'middle', icon: <FaAlignCenter /> },
                { value: 'right', icon: <FaAlignRight /> }
              ]}
              onChange={(value) => { labelValues.text_align = value }}
              getIsIndeterminate={() => isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'text_align', prefix)}
              t={t}
            />

            <OverloadedButton
              elements={elements}
              config={BASE_LABEL_CONFIG}
              attributePath={attributePath}
              prefix={prefix}
              attributeKey="vertical_text"
              variant={getButtonVariant('', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'vertical_text', prefix), labelValues.vertical_text)}
              onClick={() => { labelValues.vertical_text = !labelValues.vertical_text }}
            >
              {<span style={{
                display: 'inline-flex',
                width: '1rem',
                height: '1rem',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>{labelValues.vertical_text ? <MdTextRotateVertical /> : <MdTextRotationNone />}</span>}
            </OverloadedButton>
          </Box>
          <ColorPickerWithSustainable
            app_data={app_data}
            elements={elements}
            config={BASE_LABEL_CONFIG}
            prefix={prefix}
            attributePath={attributePath}
            colorAttributeKey="color"
            sustainableAttributeKey="color_sustainable"
            refreshParentComponent={refreshParentComponent}
          />
        </Box></>)
      }

      {/* Section ICON */}
      {displayMode === 'icon' && (
        <>
          <Box layerStyle='menuconfigpanel_row_2cols'>
            <Box as='span' layerStyle='menuconfigpanel_option_name'>{t('Menu.sections.icon_catalog')}</Box>
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
            <Box as='span' layerStyle='menuconfigpanel_option_name'>{t('Menu.sections.icon_color')}</Box>
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



      {displayMode === 'image' && (
        <>
          <Divider />
          <Box layerStyle='menuconfigpanel_row_2cols'>
            <Box as='span' layerStyle='menuconfigpanel_option_name'>{t('Menu.sections.image_source')}</Box>
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
                  labelValues.image_src = ''
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
                  labelValues.image_src = res
                }
                reader.readAsDataURL(files[0])
              }}
            />
          </Box>
        </>
      )}

      <Box layerStyle='options_3cols'>
        <Box layerStyle='options_4cols'>
          <OverloadedButtonGroup
            elements={elements}
            config={BASE_LABEL_CONFIG}
            attributePath={attributePath}
            prefix={prefix}
            attributeKey="horiz"
            currentValue={labelValues.horiz}
            items={[
              { value: 'left', icon: app_data.icon_library.icon_text_align_left },
              { value: 'middle', icon: app_data.icon_library.icon_text_align_center },
              { value: 'right', icon: app_data.icon_library.icon_text_align_right }
            ]}
            onChange={(value) => { labelValues.horiz = value; labelValues.horiz_shift = 0 }}
            getIsIndeterminate={() => isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'horiz', prefix)}
            t={t}
          />

          <OverloadedButton
            elements={elements}
            config={BASE_LABEL_CONFIG}
            prefix={prefix}
            attributePath={attributePath}
            attributeKey="inside_horiz"
            variant={getButtonVariant('', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'inside_horiz', prefix), labelValues.inside_horiz)}
            onClick={() => { labelValues.inside_horiz = !labelValues.inside_horiz }}
          >
            {app_data.icon_library.icon_label_inside_horiz}
          </OverloadedButton>
        </Box>

        <Box layerStyle='options_4cols'>
          <OverloadedButtonGroup
            elements={elements}
            config={BASE_LABEL_CONFIG}
            attributePath={attributePath}
            prefix={prefix}
            attributeKey="vert"
            currentValue={labelValues.vert}
            items={[
              { value: 'bottom', icon: app_data.icon_library.icon_text_vert_pos_bottom },
              { value: 'middle', icon: app_data.icon_library.icon_text_vert_pos_center },
              { value: 'top', icon: app_data.icon_library.icon_text_vert_pos_top }
            ]}
            onChange={(value) => {
              labelValues.vert = value
              labelValues.vert_shift = 0
            }}
            getIsIndeterminate={() => isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'vert', prefix)}
            t={t}
          />

          <OverloadedButton
            elements={elements}
            config={BASE_LABEL_CONFIG}
            attributePath={attributePath}
            prefix={prefix}
            attributeKey="inside_vert"
            variant={getButtonVariant('', isConfigValueIndeterminate(elements, BASE_LABEL_CONFIG, 'inside_vert', prefix), labelValues.inside_vert)}
            onClick={() => { labelValues.inside_vert = !labelValues.inside_vert }}
          >
            {app_data.icon_library.icon_label_inside_vert}
          </OverloadedButton>
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
          isOverloaded={isElementAttributeOverloaded(elements, prefix + '_' + String('horiz_shift') as keyof typeof BASE_LABEL_CONFIG, BASE_LABEL_CONFIG)}
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
          isOverloaded={isElementAttributeOverloaded(elements, prefix + '_' + String('vert_shift') as keyof typeof BASE_LABEL_CONFIG, BASE_LABEL_CONFIG)}
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
          isOverloaded={isElementAttributeOverloaded(elements, prefix + '_' + String('box_width') as keyof typeof BASE_LABEL_CONFIG, BASE_LABEL_CONFIG)}
        />
        <></>
      </Box>
      {(displayMode === 'simple_text' && selection.hasNodes && prefix !== 'value_label' || menu_for_style && prefix == 'name_label') ? <Box as='span' layerStyle='options_2cols'>
        <ElementAttrSetterTextInput2Cols
          app_data={app_data}
          elements={elements}
          config={NAME_LABEL_CONFIG}
          prefix={prefix}
          attributePath={attributePath}
          attributeKey={'separator'}
          refreshParentComponent={refreshParentComponent}
          isOverloaded={isElementAttributeOverloaded(elements, prefix + '_' + String('separator') as keyof typeof NAME_LABEL_CONFIG, NAME_LABEL_CONFIG)}
        />

        <OSTooltip label={app_data.t('Menu.tooltips.node_label_sep_pos')}>
          <Box layerStyle='options_2cols'>
            <Button variant={nodeLabelValues.separator_part == 'before' ? 'menuconfigpanel_option_button_activated_left' : 'menuconfigpanel_option_button_left'}
              onClick={() => {
                nodeLabelValues.separator_part = 'before'
              }}
            >
              {app_data.t('Menu.before')}
            </Button>
            <Button variant={nodeLabelValues.separator_part == 'after' ? 'menuconfigpanel_option_button_activated_right' : 'menuconfigpanel_option_button_right'}
              onClick={() => {
                nodeLabelValues.separator_part = 'before'
              }}
            >
              {app_data.t('Menu.after')}
            </Button>
          </Box>
        </OSTooltip></Box> : <></>}
      {selection.hasLinks ? (
        <>
          {/* <Divider /> */}
          {/* <Box as='span' textStyle='title_sub_section'>{t('Menu.sections.link_label_position')}</Box> */}
          {/* <Box display="flex" alignItems="center" gap={1}> */}
          <Box layerStyle='options_2cols'>
            <Box layerStyle='options_3cols'>
              <Box as='span'
                layerStyle='menuconfigpanel_option_name'
                display="flex"
                alignItems="center">{t('Menu.sections.link_label_position')}</Box>
              <OverloadedButton
                elements={links_elements}
                config={LINKS_LABEL_SPECIFIC_CONFIG}
                prefix={prefix}
                attributePath={'Flux.labels'}
                attributeKey="on_path"
                variant={getButtonVariant('left', isConfigValueIndeterminate(links_elements, LINKS_LABEL_SPECIFIC_CONFIG, 'on_path', prefix), linkLabelValues.on_path)}
                onClick={() => { linkLabelValues.on_path = !linkLabelValues.on_path }}
              >
                {app_data.icon_library.icon_label_on_path}
              </OverloadedButton>

              <OverloadedButton
                elements={links_elements}
                config={LINKS_LABEL_SPECIFIC_CONFIG}
                attributePath={'Flux.labels'}
                prefix={prefix}
                attributeKey="pos_auto"
                variant={getButtonVariant('right', isConfigValueIndeterminate(links_elements, LINKS_LABEL_SPECIFIC_CONFIG, 'pos_auto', prefix), linkLabelValues.pos_auto)}
                onClick={() => { linkLabelValues.pos_auto = !linkLabelValues.pos_auto }}
              >
                {app_data.icon_library.icon_label_auto_position}
              </OverloadedButton>
            </Box>
          </Box>
          {/* </Box> */}
        </>
      ) : null}
      <Divider />
      <MenuSectionCheckbox
        elements={elements}
        attributePath={attributePath}
        attributeKey={'visible'}
        config={BASE_SHAPE_CONFIG}
        prefix={`${prefix}_background` as ShapePrefix}
        refreshParentComponent={refreshParentComponent}
        rightComponent={<ShapeTypeSelector
          app_data={app_data}
          elements={elements}
          prefix={`${prefix}_background` as ShapePrefix}
          attributePath={attributePath}
          refreshUI={refreshParentComponent} />
        }
      >
        {getShapeValues(elements, `${prefix}_background` as ShapePrefix, refreshParentComponent).visible && (<>
          <MarginEditor
            app_data={app_data}
            elements={elements}
            prefix={`${prefix}_background` as ShapePrefix}
            refreshUI={refreshParentComponent}
          />
          <MenuShapeAttributes
            app_data={app_data}
            elements={elements}
            attributePath={attributePath}
            prefix={`${prefix}_background` as ShapePrefix}
            refreshUI={refreshParentComponent}
          /></>)}
      </MenuSectionCheckbox>
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
  const { sankey } = drawing_area
  const [, setCount] = useState(0)
  const { ref_selected_style } = menu_configuration

  const display_mode_name_label = useRef<'simple_text' | 'rich_text' | 'value'>('simple_text')
  // ✅ State pour l'onglet actif : 5 onglets
  type ActiveTab = 'shape' | 'name_label' | 'value_label' | 'icon'
  const [activeTab, setActiveTab] = useState<ActiveTab>('shape')
  if (activeTab !== app_data.menu_configuration.tab_selected)
    setActiveTab(app_data.menu_configuration.tab_selected)
  // ✅ Récupération éléments
  const getAllSelectedElements = (): (Class_NodeElement | Class_LinkElement | Class_ContainerElement)[] => {
    const elements: (Class_NodeElement | Class_LinkElement | Class_ContainerElement)[] = []
    const selectedNodes = drawing_area.selected_nodes_list_sorted
    elements.push(...selectedNodes)

    const selectedLinks = drawing_area.selected_links_list_sorted
    elements.push(...selectedLinks)

    const selectedContainers = drawing_area.selected_containers_list_sorted
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
          categories={activeTab === 'shape' ? ['shape'] : ['value_label', 'name_label']}
        />
      )}

      {/* ✅ 4 ONGLETS */}
      {showContent && (
        <>
          <Box layerStyle='options_4cols'>
            <Button
              variant={activeTab === 'shape' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                app_data.menu_configuration.tab_selected = 'shape'
                setActiveTab('shape')
              }}
            >
              {t('Menu.tabs.shape')}
            </Button>
            <Button
              variant={activeTab === 'name_label' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                app_data.menu_configuration.tab_selected = 'name_label'
                setActiveTab('name_label')
              }}
            >
              {t('Menu.tabs.name')}
            </Button>
            <Button
              variant={activeTab === 'value_label' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                app_data.menu_configuration.tab_selected = 'value_label'
                setActiveTab('value_label')
              }}
            >
              {t('Menu.tabs.value')}
            </Button>
            <Button
              variant={activeTab === 'icon' ? 'menuconfigpanel_option_button_activated' : 'menuconfigpanel_option_button'}
              onClick={() => {
                app_data.menu_configuration.tab_selected = 'icon'
                setActiveTab('icon')
              }}
            >
              {t('Menu.tabs.icon')}
            </Button>
          </Box>

          {/* ========== ONGLET FORME ========== */}
          {activeTab === 'shape' && (
            <Box layerStyle='menu_sub_section'>
              {(menu_for_style || selection.hasNodes || selection.hasContainers) && (<Box as='span' layerStyle='options_2cols'>

                <ShapeTypeSelector
                  app_data={app_data}
                  elements={elements}
                  prefix={'shape'}
                  attributePath={'Noeud.apparence'}
                  refreshUI={refreshAll} />
              </Box>)}
              <MenuShapeAttributes
                app_data={app_data}
                elements={elements}
                attributePath='Noeud.apparence'
                prefix='shape'
                refreshUI={refreshAll}
              />
              <>
                {(menu_for_style || selection.hasNodes || selection.hasContainers) && (
                  <Box layerStyle='menu_sub_section'>
                    <Box layerStyle='menuconfigpanel_grid'>
                      <Box as='span' layerStyle='menu_sub_section_title'
                        textStyle='title_sub_section'
                      >{!menu_for_style && selection.hasNodes ? `${t('Menu.sections.node_geometry')} (${selection.nodes.length})` : t('Menu.sections.node_geometry')}</Box>
                      <Box as='span' layerStyle='options_2cols'>
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
                          isOverloaded={isElementAttributeOverloaded(elements, 'shape_min_width' as keyof typeof BASE_SHAPE_CONFIG, BASE_SHAPE_CONFIG)}
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
                          isOverloaded={isElementAttributeOverloaded(elements, 'shape_min_height' as keyof typeof BASE_SHAPE_CONFIG, BASE_SHAPE_CONFIG)}
                        />
                      </Box>
                      <MarginEditor
                        app_data={app_data}
                        elements={elements}
                        prefix={'shape'}
                        refreshUI={refreshAll}
                      />
                      {selection.hasNodes ? <>
                        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
                          <Box layerStyle='menuconfigpanel_option_name'>{t('Noeud.apparence.geometry')}</Box>
                          <OverloadedButtonGroup
                            elements={nodes_elements}
                            config={NODE_SHAPE_SPECIFIC_CONFIG}
                            attributePath={'Noeud.apparence'}
                            prefix={'shape'}
                            attributeKey="position_type"
                            currentValue={nodeShapeValues.position_type}
                            items={[
                              { value: 'absolute' as Type_Position, label: t('Noeud.apparence.geometry_absolute'), icon: '' },
                              { value: 'parametric' as Type_Position, label: t('Noeud.apparence.geometry_parametric'), icon: '' },
                              { value: 'relative' as Type_Position, label: t('Noeud.apparence.geometry_relative'), icon: '' }
                            ]}
                            onChange={(value) => { nodeShapeValues.position_type = value }}
                            getIsIndeterminate={() => isNodeShapeSpecificValueIndeterminate(nodes_elements, 'position_type')}
                            t={t}
                          />
                        </Box>
                        {nodeShapeValues.position_type == 'parametric' ? <>
                          <ElementAttrSetterNumberInput2Cols
                            app_data={app_data}
                            config={NODE_SHAPE_SPECIFIC_CONFIG}
                            elements={elements}
                            attributePath='Noeud.apparence'
                            attributeKey={'position_dx'}
                            prefix={'shape'}
                            refreshParentComponent={refreshAll}
                            unit_text='pixels'
                            stepper={true}
                            isOverloaded={isElementAttributeOverloaded(elements, 'shape_position_dx' as keyof typeof NODE_SHAPE_SPECIFIC_CONFIG, NODE_SHAPE_SPECIFIC_CONFIG)} />
                          <ElementAttrSetterNumberInput2Cols
                            app_data={app_data}
                            config={NODE_SHAPE_SPECIFIC_CONFIG}
                            elements={elements}
                            attributePath='Noeud.apparence'
                            attributeKey={'position_dy'}
                            prefix={'shape'}
                            refreshParentComponent={refreshAll}
                            unit_text='pixels'
                            stepper={true}
                            isOverloaded={isElementAttributeOverloaded(elements, 'shape_position_dy' as keyof typeof NODE_SHAPE_SPECIFIC_CONFIG, NODE_SHAPE_SPECIFIC_CONFIG)} /></> : <></>}
                        <Box layerStyle='options_3cols'>
                          <OverloadedCheckbox
                            elements={nodes_elements}
                            config={NODE_SHAPE_SPECIFIC_CONFIG}
                            prefix={'shape'}
                            attributeKey="orphan_node_visible"
                            isChecked={nodeShapeValues.orphan_node_visible}
                            onChange={(checked) => { nodeShapeValues.orphan_node_visible = checked }}
                            getIsIndeterminate={() => isNodeShapeSpecificValueIndeterminate(nodes_elements, 'orphan_node_visible')}
                            tooltipLabel={t(`Noeud.apparence.tooltips.${getNodeShapeAttributeKey('shape', 'orphan_node_visible')}`)}
                            t={t}
                          >
                            {t(`Noeud.apparence.${getNodeShapeAttributeKey('shape', 'orphan_node_visible')}`)}
                          </OverloadedCheckbox>
                        </Box>
                      </> : <></>
                      }
                      {selection.hasNodes ?
                        <Button
                          variant={'menuconfigpanel_option_button'}
                          onClick={() => {
                            app_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_node_reorganizer_editor.current(true)
                            app_data.menu_configuration.set_node_io_reorganizer.current(nodes_elements[0] as Class_NodeElement)
                          }}
                        >
                          {t('Noeud.Reorg_title')}
                        </Button> : <></>}
                    </Box>
                  </Box>
                )}

                {(menu_for_style || selection.hasLinks) && (
                  <Box layerStyle='menu_sub_section'>
                    <Box layerStyle='menuconfigpanel_grid'>
                      <Box as='span' layerStyle='menu_sub_section_title'
                        textStyle='title_sub_section'
                      >{!menu_for_style && selection.hasLinks ? `${t('Menu.sections.link_geometry')} (${selection.links.length})` : t('Menu.sections.link_geometry')}</Box>

                      {selection.hasLinks || menu_for_style ?
                        <>
                          <Divider />
                          <Box layerStyle='options_2cols'>
                            <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
                              <Box layerStyle='menuconfigpanel_option_name'>
                                {app_data.t('Flux.apparence.shape_color_rule')}
                                <TooltipElementOverloaded
                                  prefix={'shape'} attributeKey={'color_rule'} elements={elements} config={LINK_SHAPE_SPECIFIC_CONFIG} t={app_data.t}
                                />
                              </Box>
                              <OSTooltip label={t('Flux.apparence.tooltips.color_source.def')}>
                                <Select
                                  value={linkShapeValues.color_rule}
                                  onChange={(evt) => {
                                    linkShapeValues.color_rule = evt.target.value as 'flow' | 'source' | 'target' | 'gradient' | 'auto'
                                  }}
                                >
                                  {app_data.menu_configuration.flow_color_origin_type.map(el => {
                                    return <option key={'value_' + el} value={el}>{t('Flux.apparence.' + el)}</option>
                                  })}
                                </Select>
                              </OSTooltip>
                            </Box>
                            <Box layerStyle='menuconfigpanel_row_2cols'>
                              <OverloadedCheckbox
                                elements={links_elements}
                                config={LINK_SHAPE_SPECIFIC_CONFIG}
                                prefix={'shape'}
                                attributeKey="is_arrow"
                                isChecked={linkShapeValues.is_arrow}
                                onChange={(checked) => { linkShapeValues.is_arrow = checked }}
                                getIsIndeterminate={() => isLinkShapeSpecificValueIndeterminate(links_elements, 'is_arrow')}
                                tooltipLabel={t(`Flux.apparence.tooltips.${getLinkShapeAttributeKey('shape', 'is_arrow')}`)}
                                t={t}
                              >
                                {t('Flux.apparence.shape_is_arrow')}
                              </OverloadedCheckbox>
                              {linkShapeValues.is_arrow && (
                                <InputGroup variant='menuconfigpanel_option_input'>
                                  <ConfigMenuNumberInput
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
                            </Box></Box>
                        </> : <></>}

                      <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
                        <Box layerStyle='options_5cols'>
                          <OverloadedButton
                            elements={links_elements}
                            config={LINK_SHAPE_SPECIFIC_CONFIG}
                            attributePath='Flux.apparence'
                            prefix={'shape'}
                            attributeKey="is_recycling"
                            variant={getButtonVariant('', isLinkShapeSpecificValueIndeterminate(links_elements, 'is_recycling'), linkShapeValues.is_recycling)}
                            onClick={() => { linkShapeValues.is_recycling = !linkShapeValues.is_recycling }}
                          >
                            {icon_library.icon_orientation_recycle}
                          </OverloadedButton>

                          <OverloadedButtonGroup
                            elements={links_elements}
                            config={LINK_SHAPE_SPECIFIC_CONFIG}
                            prefix={'shape'}
                            attributePath='Noeud.apparence'
                            attributeKey="orientation"
                            currentValue={linkShapeValues.orientation}
                            items={['hh', 'vv', 'vh', 'hv'].map(orientation => ({
                              value: orientation as Type_Orientation,
                              icon: icon_library[`icon_orientation_${orientation}` as keyof typeof icon_library]
                            }))}
                            onChange={(value) => { linkShapeValues.orientation = value }}
                            getIsIndeterminate={() => isLinkShapeSpecificValueIndeterminate(links_elements, 'orientation')}
                            t={t}
                          />
                        </Box>
                        <Box as='span' layerStyle='menuconfigpanel_row_2cols'>

                          <OverloadedCheckbox
                            elements={links_elements}
                            config={LINK_SHAPE_SPECIFIC_CONFIG}
                            prefix={'shape'}
                            attributeKey="is_curved"
                            isChecked={linkShapeValues.is_curved}
                            onChange={(checked) => { linkShapeValues.is_curved = checked }}
                            getIsIndeterminate={() => isLinkShapeSpecificValueIndeterminate(links_elements, 'is_curved')}
                            tooltipLabel={t('Flux.apparence.tooltips.shape_is_curved')}
                            t={t}
                          >
                            {t('Flux.apparence.shape_is_curved')}
                          </OverloadedCheckbox>
                          {linkShapeValues.is_curved && (
                            <Select
                              value={commonShapeValues.type}
                              onChange={(evt) => { commonShapeValues.type = evt.target.value as Type_Shape }}
                            >
                              {menu_configuration.shape_type.map(el => (
                                <option key={'value_' + el} value={el}>{t('Flux.apparence.' + el)}</option>
                              ))}
                            </Select>
                          )}
                        </Box>
                      </Box>


                      <Box as='span' layerStyle='options_2cols'>
                        <OverloadedCheckbox
                          elements={links_elements}
                          config={LINK_SHAPE_SPECIFIC_CONFIG}
                          prefix={'shape'}
                          attributeKey="is_structure"
                          isChecked={linkShapeValues.is_structure}
                          onChange={(checked) => { linkShapeValues.is_structure = checked }}
                          getIsIndeterminate={() => isLinkShapeSpecificValueIndeterminate(links_elements, 'is_structure')}
                          tooltipLabel={t('Flux.apparence.tooltips.structure')}
                          t={t}
                        >
                          {t('Flux.apparence.shape_is_structure')}
                        </OverloadedCheckbox>

                        {/* Value of link local scale to override scale from DA, can be undefined */}
                        <OSTooltip label={t('Flux.apparence.tooltips.local_scale')}>
                          <>
                            <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
                              <Box layerStyle='menuconfigpanel_option_name' >
                                {t('Flux.apparence.shape_local_link_scale')}
                              </Box>
                              <ConfigMenuNumberInput
                                default_value={linkShapeValues.local_link_scale}
                                function_on_blur={(_) => {
                                  linkShapeValues.local_link_scale = _ ?? linkShapeValues.local_link_scale
                                }}
                                minimum_value={0}
                                stepper={true}
                                step={1}
                                t={t}
                                isOverloaded={isElementAttributeOverloaded(links_elements, 'local_link_scale', LINK_SHAPE_SPECIFIC_CONFIG)}
                              />
                            </Box>

                          </>
                        </OSTooltip>
                      </Box>
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

                      </Box> : <></>}
                    </Box></>
                )}
              </>
            </Box>
          )}

          {/* ========== ONGLETS LABELS ========== */}
          {activeTab === 'name_label' && (
            <MenuSectionCheckbox
              elements={elements}
              attributePath='Noeud.labels'
              attributeKey={'is_visible'}
              config={NAME_LABEL_CONFIG}
              prefix={'name_label'}
              refreshParentComponent={refreshAll}
              rightComponent={<LabelDisplayModeSelector
                prefix='name_label'
                app_data={app_data}
                labelValues={nameLabelValues}
                t={t}
                display_mode_name_label={display_mode_name_label}
                refreshAll={refreshAll}
              />
              }
            >
              {nameLabelValues.is_visible && (
                <LabelContentComponent
                  app_data={app_data}
                  elements={elements}
                  prefix={'name_label'}
                  displayMode={display_mode_name_label.current}
                  menu_style={menu_for_style}
                  refreshParentComponent={refreshAll}
                />
              )}
            </MenuSectionCheckbox>
          )}

          {activeTab === 'value_label' && (
            <MenuSectionCheckbox
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
                  displayMode='value'
                  menu_style={menu_for_style}
                  refreshParentComponent={refreshAll}
                />
              )}
            </MenuSectionCheckbox>
          )}

          {activeTab === 'icon' && (
            <MenuSectionCheckbox
              elements={elements}
              attributePath='Noeud.labels'
              attributeKey={'is_visible'}
              config={ICON_LABEL_BASE_CONFIG}
              prefix={'icon'}
              refreshParentComponent={refreshAll}
              rightComponent={<LabelDisplayModeSelector
                prefix='icon'
                app_data={app_data}
                labelValues={iconValues}
                refreshAll={refreshAll}
                display_mode_name_label={display_mode_name_label}
                t={t}
              />}
            >
              {
                iconValues.is_visible && (
                  <LabelContentComponent
                    app_data={app_data}
                    elements={elements}
                    prefix={'icon'}
                    displayMode={iconValues.is_icon ? 'icon' : 'image'}
                    menu_style={menu_for_style}
                    refreshParentComponent={refreshAll}
                  />
                )
              }
            </MenuSectionCheckbox>
          )}
        </>
      )
      }
    </Box >
  )
}

interface MenuShapeAttributesProps {
  app_data: Class_ApplicationData
  elements: Class_NodeBase[] | Class_LinkElement[] | Class_ElementStyle[] | Class_ContainerElement[]
  attributePath: string
  prefix: ShapePrefix
  refreshUI: () => void
}

export const MenuShapeAttributes = ({
  app_data, elements, attributePath, prefix, refreshUI
}: MenuShapeAttributesProps) => {
  const { t } = app_data

  if (!elements || !attributePath || !prefix || !refreshUI) return <></>

  const config = BASE_SHAPE_CONFIG

  const shapeValues = elements.length > 0
    ? getShapeValues(elements, prefix, refreshUI)
    : Object.fromEntries(
      Object.entries(config).map(([key, value]) => [key, value.default])
    ) as {
      -readonly [K in keyof typeof config]: ReturnType<(typeof config)[K]['type']>
    }

  return (
    <>
      <Box layerStyle='menuconfigpanel_grid'>
        <Box as='span' layerStyle='options_2cols'>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <OverloadedCheckbox
              elements={elements}
              config={BASE_SHAPE_CONFIG}
              prefix={prefix}
              attributeKey="color_visible"
              isChecked={shapeValues.color_visible}
              onChange={(checked) => { shapeValues.color_visible = checked }}
              getIsIndeterminate={() => isShapeValueIndeterminate(elements, prefix, 'color_visible')}
              tooltipLabel={t(`${attributePath}.tooltips.${getShapeAttributeKey(prefix, 'color_visible')}`)}
              t={t}
            >
              {t(`${attributePath}.${getShapeAttributeKey(prefix, 'color_visible')}`)}
            </OverloadedCheckbox>
            <ColorPickerWithSustainable
              app_data={app_data}
              elements={elements}
              config={BASE_SHAPE_CONFIG}
              prefix={prefix}
              attributePath={attributePath}
              colorAttributeKey="color"
              sustainableAttributeKey="color_sustainable"
              refreshParentComponent={refreshUI}
            />
          </Box>
          <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
            <OverloadedCheckbox
              elements={elements}
              config={BASE_SHAPE_CONFIG}
              prefix={prefix}
              attributeKey="border_visible"
              isChecked={shapeValues.border_visible}
              onChange={(checked) => { shapeValues.border_visible = checked }}
              getIsIndeterminate={() => isShapeValueIndeterminate(elements, prefix, 'border_visible')}
              tooltipLabel={t(`${attributePath}.tooltips.${getShapeAttributeKey(prefix, 'border_visible')}`)}
              t={t}
            >
              {t(`${attributePath}.${getShapeAttributeKey(prefix, 'border_visible')}`)}
            </OverloadedCheckbox>
            <ColorPickerWithSustainable
              app_data={app_data}
              elements={elements}
              config={BASE_SHAPE_CONFIG}
              prefix={prefix}
              attributePath={attributePath}
              colorAttributeKey="border_color"
              sustainableAttributeKey="border_color_sustainable"
              refreshParentComponent={refreshUI}
            />
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
            stepper={true}
            isOverloaded={isElementAttributeOverloaded(elements, prefix + '_' + String('opacity') as keyof typeof BASE_SHAPE_CONFIG, BASE_SHAPE_CONFIG)} />
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
            stepper={true}
            isOverloaded={isElementAttributeOverloaded(elements, prefix + '_' + String('border_radius') as keyof typeof BASE_SHAPE_CONFIG, BASE_SHAPE_CONFIG)} />
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
            stepper={true}
            isOverloaded={isElementAttributeOverloaded(elements, prefix + '_' + String('border_thickness') as keyof typeof BASE_SHAPE_CONFIG, BASE_SHAPE_CONFIG)} />

          <Box as='span' layerStyle='options_2cols'>
            <OverloadedCheckbox
              elements={elements}
              config={config}
              prefix={prefix}
              attributeKey="border_dashed"
              isChecked={shapeValues.border_dashed}
              onChange={(checked) => { shapeValues.border_dashed = checked }}
              getIsIndeterminate={() => isShapeValueIndeterminate(elements, prefix, 'border_dashed')}
              tooltipLabel={t(`${attributePath}.tooltips.${getShapeAttributeKey(prefix, 'border_dashed')}`)}
              t={t}
            >
              {t(`${attributePath}.${getShapeAttributeKey(prefix, 'border_dashed')}`)}
            </OverloadedCheckbox>
          </Box>
          <Box />
        </Box>
      </Box>
    </>
  )
}


export const ShapeTypeSelector = ({
  app_data,
  elements,
  prefix,
  attributePath,
  refreshUI
}: {
  app_data: Class_ApplicationData
  elements: ElementsType
  prefix: ShapePrefix
  attributePath: string
  refreshUI: () => void
}) => {
  const { t, icon_library } = app_data

  const shapeValues = elements.length > 0
    ? getShapeValues(elements, prefix, refreshUI)
    : { type: 'rect' as Type_Shape }

  const shapeTypes: Array<{ value: Type_Shape; position: 'left' | 'center' | 'right'; icon: JSX.Element }> = [
    { value: 'ellipse', position: 'left', icon: icon_library.icon_ellipse_shape },
    { value: 'rect', position: 'center', icon: icon_library.icon_rect_shape }
  ]
  if (prefix === 'shape') {
    shapeTypes.push({ value: 'capsule', position: 'right', icon: icon_library.icon_capsule_shape })
  }

  return (
    <OSTooltip label={t(`${attributePath}.tooltips.shape_type`)}>
      <Box layerStyle='options_3cols'>
        {shapeTypes.map(({ value, position, icon }) => (
          <Button
            key={value}
            variant={getButtonVariant(
              position,
              isShapeValueIndeterminate(elements, prefix, 'type'),
              shapeValues.type === value
            )}
            onClick={() => { shapeValues.type = value }}
          >
            {icon}
          </Button>
        ))}
      </Box>
    </OSTooltip>
  )
}


export const MarginEditor = ({
  app_data,
  elements,
  prefix,
  refreshUI
}: {
  app_data: Class_ApplicationData
  elements: ElementsType
  prefix: ShapePrefix
  refreshUI: () => void
}) => {
  const { t } = app_data
  const [editMarginsUnified, setEditMarginsUnified] = useState(true)
  const config = BASE_SHAPE_CONFIG
  const shapeValues = elements.length > 0
    ? getConfigValues(elements, BASE_SHAPE_CONFIG, prefix, refreshUI)
    : Object.fromEntries(
      Object.entries(config).map(([key, value]) => [key, value.default])
    ) as {
      -readonly [K in keyof typeof config]: ReturnType<(typeof config)[K]['type']>
    }

  const attributePath = prefix.includes('_background') ? 'Noeud.labels' : 'Noeud.apparence'

  return (
    <>
      <Box as='span' layerStyle='options_3cols'>
        <OverloadedCheckbox
          elements={elements}
          config={BASE_SHAPE_CONFIG}
          prefix={prefix as any}
          attributeKey="margin_left"  // On utilise margin_left comme représentant
          isChecked={!editMarginsUnified}
          onChange={(checked) => setEditMarginsUnified(!checked)}
          getIsIndeterminate={() =>
            isConfigValueIndeterminate(elements, BASE_SHAPE_CONFIG, 'margin_left', prefix) ||
            isConfigValueIndeterminate(elements, BASE_SHAPE_CONFIG, 'margin_right', prefix) ||
            isConfigValueIndeterminate(elements, BASE_SHAPE_CONFIG, 'margin_top', prefix) ||
            isConfigValueIndeterminate(elements, BASE_SHAPE_CONFIG, 'margin_bottom', prefix)
          }
          tooltipLabel={t('Noeud.apparence.tooltips.shape_margin')}
          t={t}
        >
          {t('Noeud.apparence.shape_margin')}
        </OverloadedCheckbox>
        {editMarginsUnified && (
          <OSTooltip label={t('Noeud.apparence.tooltips.shape_margin')} placement='left'>
            <ConfigMenuNumberInput
              t={t}
              default_value={shapeValues.margin_left}
              function_on_blur={(value: number | null) => {
                if (value !== null) {
                  shapeValues.margin_left = value
                  shapeValues.margin_right = value
                  shapeValues.margin_top = value
                  shapeValues.margin_bottom = value
                }
              }}
              minimum_value={0}
              stepper={true}
              unit_text='px'
            />
          </OSTooltip>
        )}
      </Box>

      {!editMarginsUnified && (
        <>
          <Box as='span' layerStyle='options_2cols'>
            <ElementAttrSetterNumberInput2Cols
              app_data={app_data}
              elements={elements}
              attributePath={attributePath}
              attributeKey={'margin_left'}
              config={BASE_SHAPE_CONFIG}
              prefix={prefix}
              refreshParentComponent={refreshUI}
              unit_text='px'
              minimum_value={0}
              stepper={true}
              isOverloaded={isElementAttributeOverloaded(
                elements,
                prefix + '_margin_left' as keyof typeof BASE_SHAPE_CONFIG,
                BASE_SHAPE_CONFIG
              )}
            />
            <ElementAttrSetterNumberInput2Cols
              app_data={app_data}
              elements={elements}
              attributePath={attributePath}
              attributeKey={'margin_right'}
              config={BASE_SHAPE_CONFIG}
              prefix={prefix}
              refreshParentComponent={refreshUI}
              unit_text='px'
              minimum_value={0}
              stepper={true}
              isOverloaded={isElementAttributeOverloaded(
                elements,
                prefix + '_margin_right' as keyof typeof BASE_SHAPE_CONFIG,
                BASE_SHAPE_CONFIG
              )}
            />
          </Box>

          <Box as='span' layerStyle='options_2cols'>
            <ElementAttrSetterNumberInput2Cols
              app_data={app_data}
              elements={elements}
              attributePath={attributePath}
              attributeKey={'margin_top'}
              config={BASE_SHAPE_CONFIG}
              prefix={prefix}
              refreshParentComponent={refreshUI}
              unit_text='px'
              minimum_value={0}
              stepper={true}
              isOverloaded={isElementAttributeOverloaded(
                elements,
                prefix + '_margin_top' as keyof typeof BASE_SHAPE_CONFIG,
                BASE_SHAPE_CONFIG
              )}
            />
            <ElementAttrSetterNumberInput2Cols
              app_data={app_data}
              elements={elements}
              attributePath={attributePath}
              attributeKey={'margin_bottom'}
              config={BASE_SHAPE_CONFIG}
              prefix={prefix}
              refreshParentComponent={refreshUI}
              unit_text='px'
              minimum_value={0}
              stepper={true}
              isOverloaded={isElementAttributeOverloaded(
                elements,
                prefix + '_margin_bottom' as keyof typeof BASE_SHAPE_CONFIG,
                BASE_SHAPE_CONFIG
              )}
            />
          </Box>
        </>
      )}
    </>
  )
}

// ==================================================================================================
// TRADUCTIONS MANQUANTES - À INTÉGRER DANS LE SYSTÈME i18n
// ==================================================================================================

/**
 * Ce fichier contient toutes les traductions manquantes identifiées
 * Elles sont organisées par ressource cible pour faciliter l'intégration
 */

// ==================================================================================================
// 1. TRADUCTIONS POUR resources_app_elements (Menu général)
// ==================================================================================================

export const missing_menu_translations = {
  en: {
    translation: {
      Menu: {
        // Onglets principaux
        tabs: {
          shape: 'Shape',
          name: 'Label',
          value: 'Value',
          icon: 'Icon'
        },

        // Modes d'affichage
        display_mode: {
          text: 'Text',
          rich: 'Rich text',
          value: 'Value',
          icon: 'Icon',
          image: 'Image',
          tooltips: {
            simple_text: 'Simple text mode',
            rich_text: 'Rich text mode with formatting',
            value: 'Display numeric value',
            icon: 'Display as icon',
            image: 'Display as custom image'
          }
        },

        // Sections communes
        sections: {
          icon_catalog: 'Icon catalog',
          icon_color: 'Icon color',
          image_source: 'Image source',
          position_size_offsets: 'Position, size and offsets',
          link_label_position: 'Link',
          node_geometry: 'Node shape',
          link_geometry: 'Link shape',
          orientation: 'Orientation',
          shape: 'Shape',
          options: 'Options',
          link_background: 'Link background'
        },

        // Messages communs
        common: {
          show_background: 'Show background',
          background_visible: 'Background visible',
          show_border: 'Show border',
          border_visible: 'Border visible',
          multiple_values: 'Multiple values',
          vertical: 'Vertical',
          interior: 'Interior',
          exterior: 'Exterior'
        }
      }
    }
  },

  fr: {
    translation: {
      Menu: {
        // Onglets principaux
        tabs: {
          shape: 'Forme',
          name: 'Libellé',
          value: 'Valeur',
          icon: 'Icône'
        },

        display_mode: {
          text: 'Text',
          rich: 'Rich text',
          value: 'Value',
          icon: 'Icon',
          image: 'Image',
          tooltips: {
            simple_text: 'Mode texte simple',
            rich_text: 'Mode texte enrichi avec formatage',
            value: 'Afficher la valeur numérique',
            icon: 'Afficher sous forme d\'icône',
            image: 'Afficher sous forme d\'image personnalisée'
          }
        },

        // Sections communes
        sections: {
          icon_catalog: 'Catalogue d\'icônes',
          icon_color: 'Couleur icône',
          image_source: 'Source image',
          position_size_offsets: 'Position, taille et décalages',
          link_label_position: 'Flux',
          node_geometry: 'Nœuds',
          link_geometry: 'Flux',
          orientation: 'Orientation',
          shape: 'Forme',
          options: 'Options',
          link_background: 'Fond Flux'
        },

        // Messages communs
        common: {
          show_background: 'Afficher le fond',
          background_visible: 'Fond visible',
          show_border: 'Afficher la bordure',
          border_visible: 'Bordure visible',
          multiple_values: 'Valeurs multiples',
          vertical: 'Vertical',
          interior: 'Intérieur',
          exterior: 'Extérieur'
        }
      }
    }
  }
}

// ==================================================================================================
// 2. TRADUCTIONS POUR resources_nodes (Labels des nœuds)
// ==================================================================================================

export const missing_node_labels_translations = {
  en: {
    translation: {
      Noeud: {
        labels: {
          value_label_is_visible: 'Value label',
          icon_is_visible: 'Icon',
          value_label_unit_visible: 'Unit',

          tooltips: {
            left_align: 'Align left',
            center_align: 'Center',
            right_align: 'Align right',
            deb: 'Start',
            milieu_h: 'Horizontal middle',
            fin: 'End',
            dessous: 'Below',
            milieu_v: 'Vertical middle',
            dessus: 'Above'
          }
        }
      }
    }
  },

  fr: {
    translation: {
      Noeud: {
        labels: {
          value_label_is_visible: 'Valeur',
          icon_is_visible: 'Icône',
          value_label_unit_visible: 'Unité',

          tooltips: {
            left_align: 'Aligner à gauche',
            center_align: 'Centrer',
            right_align: 'Aligner à droite',
            deb: 'Début',
            milieu_h: 'Milieu horizontal',
            fin: 'Fin',
            dessous: 'Dessous',
            milieu_v: 'Milieu vertical',
            dessus: 'Dessus'
          }
        }
      }
    }
  }
}

// ==================================================================================================
// 3. TRADUCTIONS POUR resources_nodes (Apparence des nœuds)
// ==================================================================================================

export const missing_node_apparence_translations = {
  en: {
    translation: {
      Noeud: {
        apparence: {
          shape_visible: 'Shape',
          shape_min_width: 'Minimum width',
          shape_min_height: 'Minimum height',
          shape_margin: 'Separate Margins,',
          shape_margin_left: 'Left',
          shape_margin_right: 'Right',
          shape_margin_top: 'Top',
          shape_margin_bottom: 'Bottom',

          tooltips: {
            margins_linked: 'Link margins',
            shape_margin: 'Margin',
            shape_margin_left: 'Left margin',
            shape_type: 'Node shape type'
          }
        }
      }
    }
  },

  fr: {
    translation: {
      Noeud: {
        apparence: {
          shape_visible: 'Forme',
          shape_min_width: 'Largeur',
          shape_min_height: 'Hauteur',
          shape_margin: 'Marges séparées',
          shape_margin_left: 'Gauche',
          shape_margin_right: 'Droite',
          shape_margin_top: 'Haute',
          shape_margin_bottom: 'Basse',

          tooltips: {
            margins_linked: 'Lier les marges',
            shape_margin: 'Marge',
            shape_margin_left: 'Marge gauche',
            shape_type: 'Type de forme du nœud'
          }
        }
      }
    }
  }
}

// ==================================================================================================
// 4. TRADUCTIONS POUR resources_flux (Apparence des flux)
// ==================================================================================================

export const missing_flux_apparence_translations = {
  en: {
    translation: {
      Flux: {
        apparence: {
          tooltips: {
            of_hh: 'Horizontal to horizontal',
            of_vv: 'Vertical to vertical',
            of_vh: 'Vertical to horizontal',
            of_hv: 'Horizontal to vertical',
            shape_is_recycling: 'Recycling flow'
          }
        }
      }
    }
  },

  fr: {
    translation: {
      Flux: {
        apparence: {
          tooltips: {
            of_hh: 'Horizontal vers horizontal',
            of_vv: 'Vertical vers vertical',
            of_vh: 'Vertical vers horizontal',
            of_hv: 'Horizontal vers vertical',
            shape_is_recycling: 'Flux de recyclage'
          }
        }
      }
    }
  }
}