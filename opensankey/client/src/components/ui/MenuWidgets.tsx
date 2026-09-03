// ==================================================================================================
// The MIT License (MIT)
// ==================================================================================================
// Copyright (c) 2025 TerriFlux
// ==================================================================================================
// Author        : Vincent LE DOZE & Vincent CLAVEL & Julien Alapetite for TerriFlux
// ==================================================================================================

/**
 * Widgets d'interface PARTAGES — zone viewer.
 *
 * Extraits de `components/configmenus/MenuCommon.tsx` pour OS#1331, sur le meme motif
 * qu'`OSTooltip`. Ce sont des primitives de formulaire et de mise en page, sans rien de l'atelier
 * d'edition : elles ne dependent que de React, Chakra et de modules de la zone viewer. Verifie
 * avant deplacement : aucune n'utilise `SankeyLinkSelectionSimple` ni `SankeyNodeSelectionSimple`,
 * les deux seuls symboles d'edition que `MenuCommon` importe.
 *
 * Motif du deplacement : elles etaient importees depuis OSP et SA, ce qui aurait force ces paquets a
 * dependre du paquet EDITEUR (AGPL) pour un champ de saisie ou un selecteur de couleur. La frontiere
 * de licence doit passer entre « primitives d'UI partagees » et « atelier d'edition », pas au milieu
 * d'un fichier de 2231 lignes.
 *
 * `MenuCommon` les reimporte pour son usage interne et les reexporte : aucun import existant ne casse.
 */

import React, { FC, useRef, useState, ChangeEvent, useEffect, MutableRefObject, CSSProperties, forwardRef } from 'react'
import { ColorResult, SketchPicker } from 'react-color'
import {
  Box, Button, Collapse, Input, InputGroup, Menu, MenuButton, MenuDivider, MenuItem, MenuList,
  Text, useDisclosure,
} from '@chakra-ui/react'
import type { CheckboxProps } from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { FaSquare } from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSquareCheck, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'
import { t } from 'i18next'
import type { TFunction } from 'i18next'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { AttributeConfig, ElementsType, ShapePrefix } from '../../Elements/ElementsAttributesConfig'
import type { FCType_WrapperBoxSubSectionMenu } from '../SankeyMenuTypes'
import { OSTooltip } from './OSTooltip'

export const InputIndicatorWrapper = ({
  isOverloaded,
  isMultiValue = false,
  provenance,
  children,
  fit = false,
  t: _t
}: React.PropsWithChildren<{
  isOverloaded?: boolean
  isMultiValue?: boolean
  // #1243 — d'où vient la valeur (cf. elementAttributeProvenance) : rendu en
  // TOOLTIP, jamais en étiquette — le panneau est déjà dense et le
  // retrait/liseré porte déjà l'information principale.
  provenance?: string
  children: React.ReactNode
  // #1258 — bouton-icône carré : le wrapper épouse le contenu au lieu
  // d'occuper toute la cellule (sinon le carré se cale à gauche d'un vide).
  fit?: boolean
  t: (key: string) => string
}>) => {
  // Priorité : multiValue > overloaded
  const hasIndicator = isMultiValue || isOverloaded === true
  const color = isMultiValue ? 'rgba(237, 137, 54, 0.5)' : 'rgba(128, 90, 213, 0.7)' // orange (multi) ou violet (surcharge)
  const colorHover = isMultiValue ? 'rgba(237, 137, 54, 0.8)' : 'rgba(128, 90, 213, 1)'

  if (!hasIndicator) {
    // Hérité de la cascade : en retrait, cibles inchangées, pleine visibilité
    // au survol ou au focus clavier.
    if (isOverloaded === false) {
      return (
        <Box
          display='inline-flex'
          width={fit ? 'fit-content' : '100%'}
          title={provenance}
          sx={{
            opacity: 0.65,
            transition: 'opacity 0.12s',
            '&:hover, &:focus-within': { opacity: 1 },
            ...(provenance ? { cursor: 'help' } : {})
          }}
        >
          {children}
        </Box>
      )
    }
    return <>{children}</>
  }

  return (
    <Box
      position='relative'
      display='inline-flex'
      width={fit ? 'fit-content' : '100%'}
      title={provenance}
      sx={{
        '& > *': {
          boxShadow: `0 0 0 1.5px ${color}`,
          borderRadius: '6px',
          transition: 'box-shadow 0.2s'
        },
        '&:hover > *': {
          boxShadow: `0 0 0 2px ${colorHover}`,
        },
        cursor: 'help'
      }}
    >
      {children}
    </Box>
  )
}

/**
 * Component developped for number input of the config menu
  * @param {*} {
  *   ref_to_set_value,
  *   function_on_blur,
  *   menu_for_style = false,
  *   minimum_value = Number.MIN_SAFE_INTEGER,
  *   maximum_value = Number.MAX_SAFE_INTEGER,
  *   stepper = false,
  *   step = 1,
  *   unit_text = undefined,
  * }
  * @return {*}
  */
// forwardRef : parfois enfant direct d'un Tooltip Chakra (qui a besoin d'un
// ref DOM pour se positionner) — même motif que ConfigMenuTextInput.
export type FCType_ConfigMenuTextInput = {
  t: TFunction,
  default_value: string | null | undefined,
  function_on_blur: (_: string | null) => void,
  menu_for_style?: boolean,
  disabled?: boolean,
  multiValue?: boolean,
  isOverloaded?: boolean
  // #1243 — provenance de la valeur, rendue en tooltip par le wrapper.
  provenance?: string
}



// Déclaration du type pour l'EyeDropper API
declare global {
  interface Window {
    EyeDropper?: {
      new(): EyeDropper
    }
  }
}

export interface EyeDropper {
  open(): Promise<{ sRGBHex: string }>
}

export const WrapperBoxSubSectionMenu: FC<FCType_WrapperBoxSubSectionMenu> = ({
  new_data,
  title,
  is_open = true,
  with_border = true,
  children
}: FCType_WrapperBoxSubSectionMenu) => {
  // Hooks controlling collapse opening, initiallised at true
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: is_open })
  return <Box layerStyle={with_border ? 'menu_sub_section' : 'menu_sub_section_without_border'}>
    <Box layerStyle='menu_sub_section_head'>
      <Button variant='menu_sub_section_collapse_button'
        size='sizeCollapseButton'
        onClick={onToggle}>
        {isOpen ? new_data.icon_library.icon_collapse_up : new_data.icon_library.icon_collapse_down}
      </Button>
      <Box as='span' layerStyle='menu_sub_section_title'
        textStyle='title_sub_section'
      >{title}</Box>
    </Box>
    <Collapse in={isOpen} animateOpacity>
      <Box
        layerStyle='menuconfigpanel_grid'
      >
        {children}
      </Box>
    </Collapse>
  </Box>
}

export type typeElementSelectable = {
  label: string,
  value: string,
  selected: boolean,
  disabled?: boolean
}[]


/**
 * Component to select multple element from a list passed in parameter
 *
 * @param {*} {
 *   elements,
 *   selected_elements,
 *   onClick
 * }
 * @return {*} 
 */

export const OSMultiSelect = ({ elements, onClick, placeholder, with_select_all = true }: {
  t: TFunction,
  elements: typeElementSelectable,
  onClick: (entries: typeElementSelectable) => void,
  // Libellé du bouton quand rien n'est sélectionné. Par défaut « Aucune
  // sélection » (sélecteur d'éléments) ; un menu d'OPTIONS préfère annoncer ce
  // qu'il contient — « Options » — plutôt qu'un vide.
  placeholder?: string,
  // « Tout sélectionner » n'a de sens que pour une LISTE d'éléments homogènes.
  // Un menu d'options hétérogènes (chacune avec son effet, parfois destructif)
  // le désactive.
  with_select_all?: boolean
}) => {
  const [menuListItems, setMenuListItems] = useState<JSX.Element[]>([])
  const [displayBgOverlay, setDisplayBgOverlay] = useState(false)

  const selected_elements = elements.filter(el => el.selected)
  const textBtn = selected_elements.length > 0
    ? selected_elements.map(el => el.label).join(', ')
    : (placeholder ?? 'Aucune sélection')
  const selecAll = (with_select_all && elements.length > 0) ? <>
    <MenuItem
      icon={(selected_elements.length == elements.length) ? <FontAwesomeIcon icon={faSquareCheck} /> : <FaSquare />}
      onClick={() => {
        if (selected_elements.length == elements.length) {
          elements.forEach(e => e.selected = false)
        } else {
          elements.forEach(e => e.selected = true)
        }
        const new_sel = selected_elements.length == elements.length ? [] : elements //select or deselect all
        onClick(new_sel)
        setMenuListItems(renderMenu())
      }}>{t('Noeud.TS')}</MenuItem>
    <MenuDivider />
  </> : <></>

  // Create a function that render list so we can choose when to go throught list (that can be long with big sankey)
  const renderMenu = () => elements.map((el, i) => {

    return <MenuItem
      key={'elements_' + i}
      isDisabled={el.disabled}
      icon={el.selected ? <FontAwesomeIcon icon={faSquareCheck} /> : <FaSquare />}
      onClick={() => {
        // Update list of selected element before letting parent decide what to do with it (via onClick)
        el.selected = !el.selected
        const new_selected_elements = elements.filter(el => el.selected)
        // Execute parent function for newly selected elements
        onClick(new_selected_elements)
        setMenuListItems(renderMenu())
      }}>
      {el.label}
    </MenuItem>
  })

  // Background overlay for when we want to close selector by clicking outside Menu (sometime the DA) we don't trigger any other event
  const backgroundOverlay = <div style={{
    display: displayBgOverlay ? 'unset' : 'none',
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  }} onClick={() => setDisplayBgOverlay(false)}></div>

  return <Menu isLazy
    placement='auto'
    variant={'menu_select_elements'}
    closeOnSelect={false}
    isOpen={displayBgOverlay}
    onOpen={() => setMenuListItems(renderMenu())}>
    <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant={'text_menu_select'} onClick={() => setDisplayBgOverlay(!displayBgOverlay)}> {textBtn}</MenuButton>
    {backgroundOverlay}
    <MenuList>
      {selecAll}
      {menuListItems}
    </MenuList>
  </Menu>
}

export const CustomFaEyeCheckIcon = (props: CheckboxProps) => {
  const { isChecked } = props
  return isChecked
    ? <FontAwesomeIcon icon={faEye} />
    : <FontAwesomeIcon icon={faEyeSlash} />
}
/**
 * #1243 — PROVENANCE d'un attribut : d'où vient la valeur affichée ?
 *
 * Modèle de la cascade (cf. Class_ProtoElement) :
 *   surcharge locale  >  dernier style de la cascade qui définit l'attribut
 *                     >  valeur d'usine (config.default)
 *
 * Rendue en TOOLTIP du contrôle (pas en étiquette permanente : le panneau est
 * déjà dense, et le retrait/liseré porte déjà l'information principale). Le
 * nom du style répond à la question que le retrait seul laisse ouverte :
 * « hérité, oui — mais de QUI ? ».
 *
 * @returns un libellé traduit, ou undefined si non pertinent (édition de style,
 *   sélection vide, valeurs divergentes entre éléments).
 */

export const ConfigMenuTextInput = forwardRef<HTMLInputElement, FCType_ConfigMenuTextInput>(({

  default_value,
  function_on_blur,
  // #297 — menu_for_style non déstructuré (l'auto-blur différé qu'il gérait a
  // été supprimé) ; conservé dans le type public pour la compat des appelants.
  disabled = false,
  multiValue = false,
  // Tri-état (cf. InputIndicatorWrapper) : pas de défaut à false —
  // undefined = « contrôle non stylable », à ne pas mettre en retrait.
  isOverloaded,
  provenance,
  t
}: FCType_ConfigMenuTextInput, forwarded_ref) => {
  const ref_input = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState<string | null | undefined>(default_value)

  useEffect(() => {
    setValue(default_value)
  }, [default_value])

  return (
    <InputIndicatorWrapper isOverloaded={isOverloaded} isMultiValue={multiValue} provenance={provenance} t={t}>
      <InputGroup>
        <Input
          isDisabled={disabled}
          ref={(el: HTMLInputElement | null) => {
            (ref_input as MutableRefObject<HTMLInputElement | null>).current = el
            if (typeof forwarded_ref === 'function') forwarded_ref(el)
            else if (forwarded_ref) forwarded_ref.current = el
          }}
          variant='menuconfigpanel_option_input'
          value={value ?? ''}
          onChange={evt => {
            // #297 — plus d'auto-validation différée : le commit (function_on_blur)
            // n'a lieu que sur Entrée (onKeyDown) ou perte de focus (onBlur).
            const updated_value = evt.target.value
            setValue((updated_value !== '') ? updated_value : null)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              ref_input.current?.blur()
            }
          }}
          onBlur={() => {
            function_on_blur(value ?? null)
          }}
        />
      </InputGroup>
    </InputIndicatorWrapper>
  )
})
ConfigMenuTextInput.displayName = 'ConfigMenuTextInput'

export const MenuColorPicker = ({
  initialColor,
  label = '',
  onColorChange,
  isDisabled = false,
  disabledTooltip = '',
  showLabel = true,
  showEyeDropper = true
}: {
  initialColor: string
  label?: string
  onColorChange: (color: string) => void
  isDisabled?: boolean
  disabledTooltip?: string
  showLabel?: boolean
  showEyeDropper?: boolean
}) => {
  const [displayColorPicker, setDisplayColorPicker] = useState(false)
  const [color, setColor] = useState(initialColor)
  const [isEyeDropperSupported, setIsEyeDropperSupported] = useState(false)

  // Vérifier si l'EyeDropper API est supportée
  useEffect(() => {
    setIsEyeDropperSupported('EyeDropper' in window)
  }, [])

  // Update swatch color when we change color from outside picker
  if (!displayColorPicker && color !== initialColor) {
    setColor(initialColor)
  }

  /**
   * Utiliser l'EyeDropper natif du navigateur
   */
  const useEyeDropper = async () => {

    if (!window.EyeDropper || isDisabled) return

    try {
      const eyeDropper = new window.EyeDropper()
      const result = await eyeDropper.open()
      const newColor = result.sRGBHex
      setColor(newColor)
      onColorChange(newColor)
    } catch (error) {
      console.error('EyeDropper error:', error)
    }
  }

  /**
   * Event when we click on the color button
   */
  const handleClick = () => {
    if (!isDisabled) {
      setDisplayColorPicker(!displayColorPicker)
    }
  }

  /**
   * Event when we close the picker
   */
  const handleClose = () => {
    setDisplayColorPicker(false)
    onColorChange(color)
  }

  /**
   * Event when we change color in picker
   */
  const handleChange = (color: ColorResult) => {
    setColor(color.hex)
  }

  // Styles for the color picker components
  const styles: { [x: string]: CSSProperties } = {
    colorPreview: {
      width: '100%',
      height: '1rem',
      borderRadius: '2px',
      background: `${color}`,
    },
    swatch: {
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      width: '100%',
      height: '1.5rem',
      padding: '5px',
      background: '#fff',
      borderRadius: '1px',
      boxShadow: '0 0 0 1px rgba(124, 104, 104, 0.1)',
      display: 'grid',
      gridTemplateColumns: '7fr 1fr',
      gridColumnGap: '0.25rem',
    },
    popover: {
      position: 'absolute',
      left: '-20%',
      top: '20%',
      zIndex: '2',
    },
    cover: {
      position: 'fixed',
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
    },
  }

  return (
    <Box>

      {showLabel && (
        <Text fontSize="sm" color={isDisabled ? 'gray.400' : 'gray.700'} minW="fit-content">
          {label}
        </Text>
      )}


      <Box style={styles.swatch} >
        <OSTooltip label={isDisabled ? disabledTooltip : 'Cliquer pour changer la couleur'}>
          <Box style={styles.colorPreview} onClick={handleClick} />
        </OSTooltip>
        {/* Bouton EyeDropper */}
        {showEyeDropper && (
          <OSTooltip label={
            !isEyeDropperSupported
              ? 'Pipette non supportée dans ce navigateur'
              : isDisabled
                ? disabledTooltip
                : 'Sélectionner une couleur à l\'écran'
          }>
            <Box
              onClick={useEyeDropper}
            >✏️</Box>
          </OSTooltip>
        )}
      </Box>


      {/* Color Picker Popover */}
      {
        displayColorPicker && (
          <Box style={styles.popover}>
            <Box style={styles.cover} onClick={handleClose} />
            <SketchPicker
              color={color}
              onChange={handleChange}
              disableAlpha={false}
            />
            {/* {this._user_preferences.color.length > 0 ? <SwatchesPicker colors={list_colors} onChange={handleChange} /> : <></>} */}
          </Box>
        )
      }

      {/* Message si EyeDropper n'est pas supporté
      {showEyeDropper && !isEyeDropperSupported && (
        <Text fontSize="xs" color="orange.500" mt={1}>
          💡 La pipette nécessite Chrome/Edge 95+ ou Firefox avec flag activé
        </Text>
      )} */}
    </Box >
  )
}

// À ajouter dans MenuCommon.tsx

export interface ColorPickerWithSustainableProps<T extends Record<string, AttributeConfig<unknown>>> {
  app_data: Class_ApplicationData
  elements: ElementsType
  config: T
  prefix: ShapePrefix | 'value_label' | 'name_label' | 'icon'
  attributePath: string
  colorAttributeKey: keyof T
  sustainableAttributeKey: keyof T
  refreshParentComponent: () => void
}

export const getButtonVariant = (
  position: 'left' | 'center' | 'right' | '',
  isIndeterminate: boolean,
  isActive: boolean
): string => {
  const suffix = position ? `_${position}` : ''

  if (isIndeterminate) {
    return `menuconfigpanel_option_button_indeterminate${suffix}`
  }

  if (isActive) {
    return `menuconfigpanel_option_button_activated${suffix}`
  }

  return `menuconfigpanel_option_button${suffix}`
}

/**
 * Sélecteur de fichier localisé.
 *
 * Le navigateur rend le bouton et le libellé d'un <input type="file"> natif
 * ("Parcourir..." / "Aucun fichier sélectionné") dans SA propre langue, non
 * traduisible via l'i18n de l'app. On masque donc l'input natif et on pilote
 * nous-mêmes un bouton + un libellé via t(), pour qu'ils suivent la langue de
 * l'application. La fenêtre système de choix de fichier reste, elle, dans la
 * langue de l'OS (hors de portée du code web).
 */

export const LocalizedFileInput: FC<{
  accept?: string
  multiple?: boolean
  onChange: (evt: ChangeEvent<HTMLInputElement>) => void
  // Mode contrôlé : si `currentFileName` est fourni (même ''), le parent pilote
  // le libellé affiché (utile quand il doit réinitialiser l'input après
  // traitement). S'il est omis (undefined), le composant gère le nom en interne.
  currentFileName?: string
  disabled?: boolean
  buttonSize?: string
  gridTemplateColumns?: string
}> = ({
  accept,
  multiple,
  onChange,
  currentFileName,
  disabled,
  buttonSize = 'sm',
  gridTemplateColumns = '1fr 2fr'
}) => {
  const ref = useRef<HTMLInputElement>(null)
  const [internal_name, set_internal_name] = useState<string | undefined>(undefined)
  const shown = currentFileName !== undefined ? currentFileName : internal_name
  return (
    <Box display='grid' gridTemplateColumns={gridTemplateColumns} gap={2} alignItems='center'>
      <Input
        ref={ref}
        display='none'
        type='file'
        accept={accept}
        multiple={multiple}
        isDisabled={disabled}
        onChange={(evt: ChangeEvent<HTMLInputElement>) => {
          const files = evt.target.files
          set_internal_name(
            files && files.length
              ? Array.from(files).map((f) => f.name).join(', ')
              : undefined
          )
          onChange(evt)
        }}
      />
      <Button
        size={buttonSize}
        isDisabled={disabled}
        onClick={() => {
          // Vider la valeur avant d'ouvrir le sélecteur pour que choisir à
          // nouveau le même fichier redéclenche bien onChange.
          if (ref.current) ref.current.value = ''
          ref.current?.click()
        }}
      >
        {shown ? t('ProcessDialog.change_file') : t('ProcessDialog.browse')}
      </Button>
      <Text fontSize='sm' noOfLines={1} title={shown} color={shown ? undefined : 'gray.500'}>
        {shown || t('ProcessDialog.no_file_selected')}
      </Text>
    </Box>
  )
}
