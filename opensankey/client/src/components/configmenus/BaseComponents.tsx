import React, { FC, ChangeEvent } from 'react'
import { Box, Select, Checkbox, Tooltip, CheckboxProps } from '@chakra-ui/react'
import { Class_DataTagGroup } from '../../types/TagGroup'
import { TFunction } from 'i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { OSTooltpFuncType } from '../SankeyMenuTypes';
import { Class_LinkAttribute, Class_LinkStyle } from '../../Elements/LinkAttributes';
import { Class_LinkElement } from '../../Elements/Link';
import { Class_NodeElement } from '../../Elements/Node'; // Add this import (adjust path if needed)
import { Class_NodeAttribute, Class_NodeStyle } from '../../Elements/NodeAttributes';


interface BOX2COLSProps {
  children: React.ReactNode
}

export const BOX2COLS: FC<BOX2COLSProps> = ({ children }) => {
  return (
    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      {children}
    </Box>
  )
}

interface BOX2COLSTITLEH4Props {
  title: string;
  children: React.ReactNode;
}

export const BOX2COLSTITLEH4: FC<BOX2COLSTITLEH4Props> = ({ title, children }) => {
  return (
    <BOX2COLS>
      <Box as='span' layerStyle='menuconfigpanel_part_title_3'>
        {title}
      </Box>
      {children}
    </BOX2COLS>
  )
}

interface BOX2COLOPTIONProps {
  tooltipLabel: string
  optionName: string
  children: React.ReactNode
}

export const BOX2COLOPTION: FC<BOX2COLOPTIONProps> = ({
  tooltipLabel,
  optionName,
  children
}) => {
  return (
    <OSTooltip label={tooltipLabel}>
      <span>
        <BOX2COLS>
          <Box layerStyle='menuconfigpanel_option_name'>
            {optionName}
          </Box>
          {children}
        </BOX2COLS>
      </span>
    </OSTooltip>
  )
}

interface OptionWithTooltipProps {
  elements: (Class_LinkElement | Class_NodeElement | Class_LinkStyle | Class_NodeStyle)[]                    // Éléments pour vérifier l'overload
  attributeKey: keyof (Class_LinkAttribute | Class_NodeAttribute)    // Clé de l'attribut pour les traductions et overload
  t: TFunction              // Fonction de traduction
  showTooltipOverload?: boolean           // Optionnel - afficher le tooltip overload
  children: React.ReactNode               // Le composant enfant (Select, Input, etc.)
}

export const OptionWithTooltip = ({
  elements,
  attributeKey,
  t,
  showTooltipOverload = true,
  children
}: OptionWithTooltipProps): JSX.Element => {

  const label = t(`Flux.labels.${String(attributeKey)}`)
  const tooltip = t(`Flux.labels.tooltips.${String(attributeKey)}`)

  return (
    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box layerStyle='menuconfigpanel_option_name'>
        {label}
        {showTooltipOverload && (
          <TooltipElementOverloaded
            k={attributeKey}
            elements={elements as (Class_LinkElement | Class_NodeElement)[]}
            t={t}
          />
        )}
      </Box>
      <OSTooltip label={tooltip}>
        {children}
      </OSTooltip>
    </Box>
  )
}

interface DataTagSelectorProps {
  data_tagg: Class_DataTagGroup
  value: string
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
}

export const DataTagSelector: FC<DataTagSelectorProps> = ({ data_tagg, value, onChange }) => {
  return (
    <Box as='span' layerStyle='menuconfigpanel_row_2cols'>
      <Box
        as='span'
        layerStyle='menuconfigpanel_part_title_3'
      >
        {data_tagg.name}
      </Box>
      <Select
        name={data_tagg.id}
        variant='menuconfigpanel_option_select'
        value={value}
        onChange={onChange}
      >
        {data_tagg.tags_list.map(tag => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
      </Select>
    </Box>
  )
}



// Tooltipe added to input in menu when add a local value (for nodes & links local attributes)
export const TooltipValueSurcharge = (k: string, t: TFunction) => {
  return <OSTooltip label={t('Menu.overcharge_style_value')} placement='left'>
    <FontAwesomeIcon className='tooltip_overload' style={{ color: '#6cc3d5', height: '12', width: '12', float: 'right' }} icon={faCircleInfo} />
  </OSTooltip>
}


export const OSTooltip: FC<OSTooltpFuncType> = (
  {
    label,
    delay = 500,
    placement = 'auto',
    isAlwaysOpen = false,
    children
  }
) => {
  if (label === undefined) {
    return <>{children}</>
  }
  const element_key = label.split(' ').join('_')
  if (isAlwaysOpen) {
    return <Tooltip
      key={element_key}
      openDelay={delay}
      placement={placement}
      label={label}
      closeDelay={100}
      isOpen={true}
      hasArrow={true}
    >
      {children}
    </Tooltip>
  } else {
    return <Tooltip
      key={element_key}
      openDelay={delay}
      placement={placement}
      label={label}
      closeDelay={100}
    >
      {children}
    </Tooltip>
  }
}

export const CustomFaEyeCheckIcon = (props: CheckboxProps) => {
  const { isChecked } = props
  return isChecked
    ? <FontAwesomeIcon icon={faEye} />
    : <FontAwesomeIcon icon={faEyeSlash} />
}

/**
 * Check if given attribute is overloaded in at least one link
 * @export
 * @param {Class_LinkElement[]} links
 * @param {keyof Class_LinkAttribute} attr
 * @return {*}
 */
export const isElementAttributeOverloaded = (
  elements: (Class_LinkElement | Class_NodeElement)[],
  attr: keyof Class_LinkAttribute | keyof Class_NodeAttribute
) => {
  return elements.some(element => {
    if (element instanceof Class_LinkElement) {
      return element.isAttributeOverloaded(attr as unknown as keyof Class_LinkAttribute)
    } else if (element instanceof Class_NodeElement) {
      return element.isAttributeOverloaded(attr as unknown as keyof Class_NodeAttribute)
    }
    return false
  })
}

interface TooltipElementOverloadedProps {
  k: keyof Class_LinkAttribute | keyof Class_NodeAttribute                  // Clé de l'attribut à vérifier
  elements: (Class_LinkElement | Class_NodeElement)[]                          // Éléments à vérifier
  t: TFunction                   // Fonction de traduction
  tooltipPrefix?: string                       // Préfixe pour le tooltip (par défaut 'el_var_')
}
/**
   * Local component that add a icon with a tooltip to show attribute value is managed by element attribute (and not style as by default)
   *
   * @param {*} {k}
   * @return {*}
   */
/**
 * Local component that adds an icon with a tooltip to show attribute value is managed by element attribute (and not style as by default)
 * @template TElement - Type of elements (Class_LinkElement | Class_NodeElement)
 * @template TElementAttribute - Type of element attributes (Class_LinkAttribute | Class_NodeAttribute)
 */
export const TooltipElementOverloaded = ({
  k,
  elements,
  t
}: TooltipElementOverloadedProps): JSX.Element => {
  const isOverwritted = isElementAttributeOverloaded(elements, k);
  return isOverwritted ? (
    <>{TooltipValueSurcharge('el_var_', t)}</>
  ) : <></>;
}



interface MenuSectionCheckboxProps {
  elements: (Class_LinkElement | Class_NodeElement | Class_LinkStyle | Class_NodeStyle)[]                    // Éléments pour vérifier l'overload
  attributeKey: keyof (Class_LinkAttribute | Class_NodeAttribute)    // Clé typée de l'attribut
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void     // Fonction appelée lors du changement
  t: TFunction              // Fonction de traduction
  isChecked: boolean                      // État actuel du checkbox
  isDisabled?: boolean                    // Optionnel - désactivé ou non
  isStyle: boolean                        // Si c'est un style (pas d'attribut overload)
  children: React.ReactNode
}

export const MenuSectionCheckbox = ({
  elements,
  attributeKey,
  onChange,
  t,
  isStyle,
  isChecked,
  isDisabled = false,
  children
}: MenuSectionCheckboxProps): JSX.Element => {
  return (
    <Box layerStyle='menu_sub_section'>
      <Box layerStyle='menu_sub_section_title'>
        <Checkbox
          isDisabled={isDisabled}
          variant='menuconfigpanel_part_title_1_checkbox'
          icon={<CustomFaEyeCheckIcon />}
          isChecked={isChecked}
          onChange={(evt) => onChange(evt)}
        >
          <OSTooltip label={t(`Flux.labels.tooltips.${String(attributeKey)}`)}>
            {t(`Flux.labels.${String(attributeKey)}`) + ' '}
          </OSTooltip>
          {!isStyle ? <TooltipElementOverloaded
            k={attributeKey}
            elements={elements as (Class_LinkElement | Class_NodeElement)[]}
            t={t} /> : <></>}
        </Checkbox>
      </Box>
      {children}
    </Box>
  )
}