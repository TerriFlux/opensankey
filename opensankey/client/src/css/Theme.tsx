import {
  drawerAnatomy, sliderAnatomy, tagAnatomy, tabsAnatomy, tableAnatomy, selectAnatomy, popoverAnatomy,
  numberInputAnatomy, accordionAnatomy, cardAnatomy, checkboxAnatomy, breadcrumbAnatomy, inputAnatomy, editableAnatomy,
  menuAnatomy, modalAnatomy, stepperAnatomy
} from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers, defineStyle, extendTheme } from '@chakra-ui/react'

const createHelpers = () => ({
  tag: createMultiStyleConfigHelpers(tagAnatomy.keys),
  slider: createMultiStyleConfigHelpers(sliderAnatomy.keys),
  tabs: createMultiStyleConfigHelpers(tabsAnatomy.keys),
  table: createMultiStyleConfigHelpers(tableAnatomy.keys),
  select: createMultiStyleConfigHelpers(selectAnatomy.keys),
  popover: createMultiStyleConfigHelpers(popoverAnatomy.keys),
  numberInput: createMultiStyleConfigHelpers(numberInputAnatomy.keys),
  accordion: createMultiStyleConfigHelpers(accordionAnatomy.keys),
  card: createMultiStyleConfigHelpers(cardAnatomy.keys),
  checkbox: createMultiStyleConfigHelpers(checkboxAnatomy.keys),
  breadcrumb: createMultiStyleConfigHelpers(breadcrumbAnatomy.keys),
  drawer: createMultiStyleConfigHelpers(drawerAnatomy.keys),
  input: createMultiStyleConfigHelpers(inputAnatomy.keys),
  edit: createMultiStyleConfigHelpers(editableAnatomy.keys),
  menu: createMultiStyleConfigHelpers(menuAnatomy.keys),
  modal: createMultiStyleConfigHelpers(modalAnatomy.keys),
  stepper: createMultiStyleConfigHelpers(stepperAnatomy.keys)
})

const { tag, slider, tabs, table, select, popover, numberInput, accordion, card, checkbox, breadcrumb, drawer, input, edit, menu, modal, stepper } = createHelpers()

// Couleurs communes
const COLORS = {
  primaire: {
    1: '#F7AD7C', 2: '#78A7C2', 3: '#78C2AD',
    4: '#B49E90', 5: '#8EA4B1', 6: '#8EB1A8'
  },
  secondaire: {
    1: '#DA996D', 2: '#668EA5', 3: '#66A593',
    4: '#968478', 5: '#778A95', 6: '#77958D'
  },
  tertiaire: {
    1: '#BC835E', 2: '#557689', 3: '#55897A',
    4: '#786960', 5: '#606F78', 6: '#607871'
  },
  openSankey: {
    50: '#C1E5DB', 100: '#66a59366', 200: '#66a593',
    300: '#25B48C', 400: '#78C2AD'
  }
}

export const default_font_size = '0.7rem'

// Styles de base communs
const BASE_STYLES = {
  borderStyle: {
    border: 'solid 1px',
    borderRadius: '6px',
    borderColor: 'gray.100'
  },
  buttonBase: {
    width: '100%',
    margin: '0',
    fontSize: default_font_size,
    color: 'white',
    minW: 'unset',
    border: 'solid 1px',
    borderRadius: '6px',
    minWidth: 'unset',
    fill: 'white',
    path: 'white'
  },
  inputField: {
    height: '1.5rem',
    border: 'solid 1px',
    borderRadius: '6px',
    borderColor: 'gray.100',
    fontSize: 'unset',
    textStyle: 'h4',
    bg: 'white',
    bgColor: 'white',
    padding: '0.1rem'
  }
}

// ===============================
// FACTORY FUNCTIONS
// ===============================

// Générateur de styles pour les boutons avec couleurs
export const createButtonStyle = (colorScheme: keyof typeof COLORS, level: number) => defineStyle({
  ...BASE_STYLES.buttonBase,
  borderColor: `${colorScheme}.${level}`,
  bg: `${colorScheme}.${level}`,
  bgColor: `${colorScheme}.${level}`,
  _active: {
    borderColor: `tertiaire.${level}`,
    bg: `tertiaire.${level}`,
    bgColor: `tertiaire.${level}`,
  },
  _hover: {
    borderColor: `secondaire.${level}`,
    bg: `secondaire.${level}`,
    bgColor: `secondaire.${level}`,
  },
  _disabled: {
    borderColor: 'gray.300',
    bg: 'gray.300',
    bgColor: 'gray.300',
  }
})

// Générateur de styles pour les tailles
export const createSizeStyle = (width: string, height: string, padding = '0.2rem') => defineStyle({
  width,
  height,
  minW: 'unset',
  padding
})

// Factory pour boutons avec position (left, center, right)
export const createPositionedButtonStyle = (baseStyle: any, position: 'left' | 'center' | 'right') => {
  const borderRadiusMap = {
    left: '6px 0px 0px 6px',
    center: '0px',
    right: '0px 6px 6px 0px'
  }
  return defineStyle({
    ...baseStyle,
    borderRadius: borderRadiusMap[position]
  })
}

// Factory pour tables
export const createTableStyle = (columns: string) => table.definePartsStyle({
  td: { padding: 0, margin: 'auto' },
  th: {
    paddingInlineStart: 'inherit',
    paddingInlineEnd: 'inherit',
    margin: 'auto',
    paddingBottom: '0',
    fontSize: 'unset'
  },
  table: { display: 'grid', gridRowGap: '0.2rem', width: 'unset' },
  tbody: { display: 'grid', gridRowGap: '0.2rem' },
  tr: {
    minHeight: '1rem',
    gridTemplateColumns: columns,
    display: 'grid',
  },
})

// ===============================
// HEADING STYLES
// ===============================
export const headingStyles = {
  base: defineStyle({}),
  heading_welcome_style: defineStyle({
    textAlign: 'center',
    fontSize: '2rem',
    color: 'openSankey.400'
  }),
  heading_template_dashboard: defineStyle({
    textAlign: 'center',
    fontSize: '2rem',
    textStyle: 'h2',
  }),
  heading_template_sankey: defineStyle({
    textAlign: 'center',
    fontSize: '1.3rem',
    textStyle: 'h2',
  }),
  heading_tab_pref: defineStyle({
    textAlign: 'center',
    fontSize: '1.3rem',
    textStyle: 'h2',
  }),
  title_filter_tagg: defineStyle({
    textAlign: 'center',
    fontSize: '0.75rem',
    fontWeight: 'bold'
  })
}

// ===============================
// MODAL STYLES
// ===============================
export const modalStyles = {
  base: modal.definePartsStyle({
    header: {
      height: 'fit-content',
      textStyle: 'h1',
      color: 'white',
      background: 'primaire.2',
      borderRadius: '6px',
      paddingRight: '5rem'
    },
    closeButton: {
      right: '1rem',
      top: '1rem'
    },
    dialog: {
      width: '75vw',
      height: '75vh',
      display: 'grid',
      gridGap: '1rem',
      padding: '0.25rem',
      gridTemplateRows: '3rem auto'
    },
    body: {
      display: 'block',
      width: '100%',
      height: 'calc(75vh - 5rem)',
      padding: '0.25rem',
    }
  }),

  modal_dialog: modal.definePartsStyle({
    dialog: { width: 'fit-content', height: 'fit-content' },
    body: { width: 'fit-content', height: 'fit-content', margin: '1rem' },
    header: { width: '100%' },
    footer: { justifyContent: 'center' }
  }),

  modal_welcome: modal.definePartsStyle({
    closeButton: { right: '0.65rem', top: '0.65rem' },
    footer: { height: '3rem' }
  }),

  modal_documentation: modal.definePartsStyle({
    overlay: { opacity: 0.3 },
    dialog: { width: 'max-content', height: 'max-content', alignSelf: 'center' },
    body: { width: 'max-content', height: 'max-content', minWidth: 0 },
    footer: { height: 'fit-content', padding: '0' }
  }),

  modal_select_unit_from_data: modal.definePartsStyle({
    body: {
      '.rd3t-tree-container': {
        height: '80vh'
      }
    }
  }),

  modal_select_unit_from_excel: modal.definePartsStyle({
    body: {
      '.rd3t-tree-container': {
        height: '50vh'
      }
    }
  }),
  modal_reconciliation: modal.definePartsStyle({
    header: {
      height: 'fit-content',
      textStyle: 'h1',
      color: 'white',
      background: 'primaire.2',
      borderRadius: '6px',
      paddingRight: '5rem'
    },
    closeButton: {
      right: '1rem',
      top: '1rem'
    },
    dialog: {
      width: '45vw',
      maxHeight: '75vh',
      height: 'unset',
      display: 'grid',
      gridGap: '1rem',
      padding: '0.25rem',
      gridTemplateRows: '3rem auto'
    },
    body: {
      display: 'block',
      width: '100%',
      height: 'unset',
      padding: '0.25rem',
    }
  })
}


// ===============================
// BUTTON STYLES
// ===============================

// Base styles pour menu config panel
export const menuconfigBaseButton = {
  height: '1.5rem',
  padding: '0.5rem',
  fontSize: 'unset',
  backgroundColor: 'white',
  color: 'tertiaire.3',
  fill: 'tertiaire.3',
}

export const buttonStyles = {
  base: createButtonStyle('primaire', 3),

  // Toolbar buttons
  toolbar_button_mouse_mode: defineStyle({
    bgColor: 'primaire.1',
    border: 'none',
    color: 'white',
    zIndex: 0,
    _hover: { bgColor: 'tertiaire.1', border: 'none' },
    _active: { bgColor: 'secondaire.1', border: 'none' },
  }),

  toolbar_button_mouse_mode_activated: defineStyle({
    bgColor: 'secondaire.1',
    border: 'none',
    outline: '2px solid',
    outlineColor: 'secondaire.1',
    outlineOffset: '-1px',
    color: 'white',
    zIndex: 1,
    _hover: { bgColor: 'secondaire.1', borderColor: 'secondaire.1', border: 'none' },
    _active: { bgColor: 'secondaire.1', borderColor: 'secondaire.1', border: 'none' },
  }),

  // Menu top button
  menutop_button: defineStyle({
    textStyle: 'h4',
    fontSize: default_font_size,
    border: '0px',
    borderColor: 'transparent',
    lineHeight: 'unset',
    padding: '0',
    bg: 'transparent',
    bgColor: 'transparent',
    svg: {
      'height': '2rem',
      'width': '3rem'
    },
    _hover: {
      color: 'gray.600',
      borderColor: 'transparent',
      bg: 'transparent',
      bgColor: 'transparent',
    },
    _active: {
      color: 'gray.600',
      borderColor: 'transparent',
      bg: 'transparent',
      bgColor: 'transparent',
    },
    _disabled: {
      opacity: '0.6',
      color: 'gray.600',
      borderColor: 'transparent',
      bg: 'transparent',
      bgColor: 'transparent',
    }
  }),

  menutop_button_with_dropdown: defineStyle({
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gridTemplateRows: '2fr 1fr',
    gridColumnGap: '0',
    gridRowGap: '0',
    height: '3rem',
    width: '3rem',
    borderRadius: '0px',
    textStyle: 'h4',
    fontSize: default_font_size,
    padding: '0.2rem',
    margin: '0rem 0rem 0rem 0.75rem',
    border: '0px',
    color: 'gray.600',
    bg: 'transparent',
    bgColor: 'transparent',
    svg: {
      margin: 'auto',
      height: '2rem'
    },
    _hover: { bg: 'transparent', bgColor: 'transparent' },
    _active: { bg: 'transparent', bgColor: 'transparent' }
  }),

  menutop_button_save_in_cache: defineStyle({
    alignSelf: 'center',
    justifySelf: 'center',
    border: 'solid 1px',
    borderRadius: '6px',
    borderColor: 'primaire.3',
    bg: 'primaire.3',
    bgColor: 'primaire.3',
    color: 'white',
    fill: 'white',
    'svg': {
      height: '1.5rem',
      width: '1.5rem'
    },
    _hover: {
      borderColor: 'secondaire.3',
      bg: 'secondaire.3',
      bgColor: 'secondaire.3',
    },
    _active: {
      borderColor: 'secondaire.3',
      bg: 'secondaire.3',
      bgColor: 'secondaire.3',
    },
  }),

  menutop_button_datatags: defineStyle({
    height: '2.5rem',
    bg: 'none',
    bgColor: 'none',
    borderColor: 'none',
    color: '#4A5568',
    display: 'block',
    _hover: {
      borderColor: 'lightgrey',
      bg: 'lightgrey',
      bgColor: 'lightgrey',
    },
    _active: {
      borderColor: 'lightgrey',
      bg: 'lightgrey',
      bgColor: 'lightgrey',
    },
  }),

  // Context menu button
  contextmenu_button: defineStyle({
    display: 'flex',
    width: '100%',
    border: 'none',
    borderRadius: 'none',
    textAlign: 'left',
    justifyContent: 'left',
    color: 'grey.600',
    bg: 'none',
    bgColor: 'none',
    padding: '0 0.4rem',
    fontSize: default_font_size,
    _hover: {
      color: 'white',
      bg: 'secondaire.2',
      bgColor: 'secondaire.2',
    },
    _active: {
      color: 'white',
      bg: 'secondaire.2',
      bgColor: 'secondaire.2',
    },
  }),

  // Toolbar main button
  toolbar_main_button: defineStyle({
    height: '6rem',
    bg: 'primaire.1',
    bgColor: 'primaire.1',
    borderColor: 'primaire.1',
    color: 'white',
    position: 'fixed',
    zIndex: 1,
    width: '2rem',
    padding: '0',
    _hover: {
      bgColor: 'tertiaire.1',
      borderColor: 'tertiaire.1',
    },
    _active: {
      bgColor: 'tertiaire.1',
      borderColor: 'tertiaire.1',
    },
  }),

  // Menu config panel buttons avec factory
  ...(['primary', 'secondary', 'tertiary'] as const).reduce((acc, type) => {
    const colorMap = { primary: 3, secondary: 2, tertiary: 4 }
    const level = colorMap[type]

    acc[`menuconfigpanel_option_button_${type}`] = defineStyle({
      textStyle: 'h4',
      color: `tertiaire.${level}`,
      bg: 'none',
      bgColor: 'none',
      borderColor: `tertiaire.${level}`,
      border: 'solid 2px',
      _hover: {
        bg: `secondaire.${level}`,
        bgColor: `secondaire.${level}`,
        borderColor: `secondaire.${level}`,
      },
      _active: {
        bg: `primaire.${level}`,
        bgColor: `primaire.${level}`,
        borderColor: `primaire.${level}`,
      },
    })

    acc[`menuconfigpanel_option_button_${type}_activated`] = defineStyle({
      textStyle: 'h4',
      color: 'white',
      bg: `primaire.${level}`,
      bgColor: `primaire.${level}`,
      borderColor: `tertiaire.${level}`,
      border: 'solid 2px',
      _hover: {
        bg: `secondaire.${level}`,
        bgColor: `secondaire.${level}`,
        borderColor: `secondaire.${level}`,
      },
      _active: {
        bg: `primaire.${level}`,
        bgColor: `primaire.${level}`,
        borderColor: `primaire.${level}`,
      },
    })

    return acc
  }, {} as Record<string, any>),

  // Boutons avec positions (left, center, right) - factory
  ...(['left', 'center', 'right'] as const).reduce((acc, position) => {
    acc[`menuconfigpanel_option_button_${position}`] = createPositionedButtonStyle(menuconfigBaseButton, position)

    acc[`menuconfigpanel_option_button_activated_${position}`] = createPositionedButtonStyle({
      ...menuconfigBaseButton,
      color: 'tertiaire.3',
      fill: 'tertiaire.3',
      borderColor: 'tertiaire.3',
      border: 'solid 2px',
    }, position)

    return acc
  }, {} as Record<string, any>),

  // Base menu config panel buttons
  menuconfigpanel_option_button: defineStyle(menuconfigBaseButton),

  menuconfigpanel_option_button_activated: defineStyle({
    ...menuconfigBaseButton,
    color: 'tertiaire.3',
    fill: 'tertiaire.3',
    borderColor: 'tertiaire.3',
    border: 'solid 2px',
  }),

  // Boutons spécialisés
  menuconfigpanel_option_button_in_table: defineStyle({
    height: '1.5rem',
    width: '1.5rem',
    padding: 0
  }),

  menuconfigpanel_add_button: defineStyle({
    bg: 'primaire.2',
    bgColor: 'primaire.2',
    borderColor: 'primaire.2',
    padding: '0.5rem',
    _hover: {
      bg: 'secondaire.2',
      bgColor: 'secondaire.2',
      borderColor: 'secondaire.2',
    },
    _active: {
      bg: 'secondaire.2',
      bgColor: 'secondaire.2',
      borderColor: 'secondaire.2',
    },
  }),

  menuconfigpanel_del_button: defineStyle({
    borderColor: 'primaire.1',
    bg: 'primaire.1',
    bgColor: 'primaire.1',
    padding: '0.5rem',
    _hover: {
      borderColor: 'secondaire.1',
      bg: 'secondaire.1',
      bgColor: 'secondaire.1',
    },
    _active: {
      borderColor: 'secondaire.1',
      bg: 'secondaire.1',
      bgColor: 'secondaire.1',
    },
  }),

  menuconfigpanel_del_button_in_table: defineStyle({
    height: '1.5rem',
    width: '1.5rem',
    borderRadius: '6px',
    textStyle: 'h4',
    padding: 0,
    borderColor: 'primaire.1',
    bg: 'primaire.1',
    bgColor: 'primaire.1',
    _hover: {
      borderColor: 'secondaire.1',
      bg: 'secondaire.1',
      bgColor: 'secondaire.1',
    },
    _active: {
      borderColor: 'secondaire.1',
      bg: 'secondaire.1',
      bgColor: 'secondaire.1',
    },
  }),

  menuconfigpanel_close: defineStyle({
    height: '1.5rem',
    width: '1.5rem',
    borderColor: 'primaire.1',
    bg: 'primaire.1',
    bgColor: 'primaire.1',
    padding: '0.5rem',
    _hover: {
      borderColor: 'secondaire.1',
      bg: 'secondaire.1',
      bgColor: 'secondaire.1',
    },
    _active: {
      borderColor: 'secondaire.1',
      bg: 'secondaire.1',
      bgColor: 'secondaire.1',
    },
  }),

  // Boutons toolbar avec factory pour les niveaux 2-6
  ...[2, 3, 5, 6].reduce((acc, level) => {
    acc[`toolbar_button_${level}`] = createButtonStyle('primaire', level)
    if (level == 3) {
      acc[`toolbar_button_${level}`].width = 'unset'
      acc[`toolbar_button_${level}`].height = 'unset'
    }
    return acc
  }, {} as Record<string, any>),

  // Toolbar undo/redo buttons
  toolbar_button_undo_redo: defineStyle({
    bgColor: 'secondaire.3',
    borderColor: 'secondaire.2',
    color: 'white',
    _hover: { bgColor: 'secondaire.4' },
    _active: { bgColor: 'secondaire.4' },
  }),

  toolbar_button_undo_redo_activated: defineStyle({
    bgColor: 'primaire.2',
    borderColor: 'secondaire.2',
    color: 'white',
    _hover: {
      bgColor: 'tertiaire.2',
      borderColor: 'secondaire.2',
    },
    _active: {
      bgColor: 'tertiaire.2',
      borderColor: 'secondaire.2',
    },
  }),

  // Spreadsheet buttons
  button_is_spreadsheet: defineStyle({
    bgColor: 'white',
    borderColor: 'secondaire.5',
    color: 'primaire.5',
    _hover: {
      bgColor: 'tertiaire.5',
      borderColor: 'secondaire.5',
    },
    _active: {
      bgColor: 'tertiaire.5',
      borderColor: 'secondaire.5',
    },
  }),

  button_is_spreadsheet_selected: defineStyle({
    bgColor: 'primaire.5',
    borderColor: 'secondaire.5',
    _hover: {
      bgColor: 'tertiaire.5',
      borderColor: 'secondaire.5',
    },
    _active: {
      bgColor: 'tertiaire.5',
      borderColor: 'secondaire.5',
    },
  }),

  // Autres boutons spécialisés
  template_button_reset: defineStyle({
    height: '2rem',
    minWidth: 'unset',
    width: 'unset',
    textStyle: 'h4',
    bg: 'primaire.1',
    bgColor: 'primaire.1',
    borderColor: 'primaire.1',
    _hover: {
      bg: 'secondaire.1',
      bgColor: 'secondaire.1',
      borderColor: 'secondaire.1',
    },
    _active: {
      bg: 'tertiaire.1',
      bgColor: 'tertiaire.1',
      borderColor: 'tertiaire.1',
    },
  }),

  welcome_button_license_description: defineStyle({
    border: 'none',
    borderRadius: '4px',
    bg: 'openSankey.100',
    bgColor: 'openSankey.100',
    textDecoration: 'underline',
    maxW: '20vw',
    _hover: {
      bg: 'primaire.2',
      bgColor: 'primaire.2',
    },
    _active: {
      bg: 'primaire.2',
      bgColor: 'primaire.2',
    },
  }),

  btn_documentation: defineStyle({
    height: '3rem',
    maxW: '11rem',
    marginLeft: '1rem',
    marginRight: '1rem',
    paddingTop: '1rem',
    paddingBottom: '1rem',
    alignSelf: 'center',
    justifySelf: 'center',
    textAlign: 'center',
    bg: 'primaire.5',
    bgColor: 'primaire.5',
    borderColor: 'primaire.5',
    _hover: {
      bg: 'secondaire.5',
      bgColor: 'secondaire.5',
      borderColor: 'secondaire.5',
    },
    _active: {
      bg: 'secondaire.5',
      bgColor: 'secondaire.5',
      borderColor: 'secondaire.5',
    },
  }),

  button_config_element: defineStyle({
    display: 'grid',
    gridTemplateRows: '2fr',
    alignSelf: 'center',
    justifySelf: 'center',
    textAlign: 'center',
    bg: 'white',
    bgColor: 'white',
    borderColor: 'primaire.2',
    minW: 'unset',
    height: 'fit-content',
    padding: '0.2rem',
    svg: {
      gridRow: 1,
      margin: 'auto',
      stroke: 'secondaire.2',
    },
    fontSize: default_font_size,
    span: {
      gridRow: 2,
      whiteSpace: 'pre-wrap',
      color: 'primaire.2',
    },
    _hover: {
      bg: 'tertiaire.2',
      bgColor: 'tertiaire.2',
      borderColor: 'tertiaire.2',
    },
  }),

  button_config_element_activated: defineStyle({
    display: 'grid',
    gridTemplateRows: '2fr',
    alignSelf: 'center',
    justifySelf: 'center',
    textAlign: 'center',
    bg: 'tertiaire.2',
    bgColor: 'tertiaire.2',
    borderColor: 'primaire.2',
    minW: 'unset',
    height: 'fit-content',
    padding: '0.2rem',
    svg: {
      gridRow: 1,
      margin: 'auto',
      stroke: 'secondaire.2',
    },
    fontSize: default_font_size,
    span: {
      gridRow: 2,
      whiteSpace: 'pre-wrap',
      color: 'white',
    },
    _hover: {
      bg: 'primaire.2',
      bgColor: 'primaire.2',
      borderColor: 'primaire.2',
    },
  }),

  button_type_config: defineStyle({
    border: 'none',
    borderRadius: '4px',
    color: 'tertiaire.3',
    bgColor: 'white',
    minW: 'unset',
    fontSize: default_font_size,
    paddingInlineStart: '0.15rem',
    paddingInlineEnd: '0.15rem',
    _hover: {
      color: 'white',
      bgColor: 'tertiaire.3'
    }
  }),

  button_type_config_activated: defineStyle({
    border: 'none',
    borderRadius: '4px',
    color: 'white',
    bgColor: 'tertiaire.3',
    minW: 'unset',
    fontSize: '0.8rem',
    paddingInlineStart: '0.15rem',
    paddingInlineEnd: '0.15rem',
    _hover: {
      color: 'tertiaire.3',
      bgColor: 'white',
    }
  }),

  menu_sub_section_collapse_button: defineStyle({
    bg: 'white',
    color: 'primaire.5',
    bgColor: 'white',
    borderColor: 'primaire.5',
    _hover: {
      bg: 'lightgrey',
      bgColor: 'lightgrey',
      borderColor: 'lightgrey',
    },
    _active: {
      bg: 'lightgrey',
      bgColor: 'lightgrey',
      borderColor: 'lightgrey',
    },
  }),

  text_menu_select: defineStyle({
    height: '1.5rem',
    width: '100%',
    borderRadius: '6px',
    textStyle: 'h4',
    fontSize: default_font_size,
    background: 'none',
    backgroundColor: 'none',
    border: 'solid 1px',
    borderColor: 'primaire.5',
    color: 'primaire.5',
    display: 'grid',
    gridColumnGap: '0',
    gridRowGap: '0',
    padding: '0.2rem',
    margin: '0',
    textAlign: 'left',
    gridTemplateColumns: '9fr 1fr',
    '>span': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    'svg': {
      float: 'right'
    },
    _active: { color: 'white' },
    _hover: { color: 'white' }
  }),

  submenu_nav_btn_dropdown_item_demo: defineStyle({
    width: 'inherit',
    textAlign: 'left',
    borderRadius: '0px',
    padding: '0.2rem',
    border: '0px',
    color: 'primaire.2',
    bg: 'inherit',
    bgColor: 'inherit',
    minWidth: 'inherit',
    _hover: {
      textDecoration: 'underline',
      bg: 'inherit',
      bgColor: 'inherit',
    },
    _active: {
      bg: 'primaire.2'
    }
  }),

  menuconfigpanel_move_order_node_io: defineStyle({
    height: '1.5rem',
    width: '3.5rem',
    padding: '0.5rem',
    fontSize: 'unset',
    backgroundColor: 'white',
    color: 'tertiaire.3',
    fill: 'tertiaire.3',
    _active: { color: 'white' }
  }),
  toolbar_button_4: defineStyle({
    bgColor: 'primaire.4',
    borderColor: 'secondaire.4',
    width: 'unset',
    height: 'unset',
    _hover: {
      bgColor: 'tertiaire.4',
      borderColor: 'secondaire.4',
    },
    _active: {
      bgColor: 'tertiaire.4',
      borderColor: 'secondaire.4',
    },
  }),

  button_dataTagg_sequence_play: defineStyle({
    bgColor: 'primaire.3',
    borderColor: 'primaire.3',
    margin: '0',
    _hover: {
      bgColor: 'secondaire.3',
      borderColor: 'secondaire.3',
    },
    _active: {
      bgColor: 'secondaire.3',
      borderColor: 'secondaire.3',
    },
  }),
  button_dataTagg_sequence_pause: defineStyle({
    bgColor: 'white',
    color: 'primaire.3',
    borderColor: 'secondaire.3',
    margin: '0',
    _hover: {
      bgColor: 'secondaire.3',
      borderColor: 'secondaire.3',
    },
    _active: {
      bgColor: 'secondaire.3',
      borderColor: 'secondaire.3',
    },
  }),
  toolbar_button_open_filter: defineStyle({
    position: 'fixed',
    left: '0',
    zIndex: '1',
    bgColor: 'primaire.6',
    borderColor: 'secondaire.6',
    _hover: {
      bgColor: 'tertiaire.6',
      borderColor: 'secondaire.6',
    },
    _active: {
      bgColor: 'tertiaire.6',
      borderColor: 'secondaire.6',
    },
  }),
  toolbar_button_open_view_banner: defineStyle({
    position: 'fixed',
    right: '0',
    zIndex: '1',
    bgColor: 'primaire.6',
    borderColor: 'secondaire.6',
    _hover: {
      bgColor: 'tertiaire.6',
      borderColor: 'secondaire.6',
    },
    _active: {
      bgColor: 'tertiaire.6',
      borderColor: 'secondaire.6',
    },
  }),
  button_dataTagg_sequence_menu_play: defineStyle({
    width: '0.5rem',
    padding: '0px',
    margin: '0px',
    bgColor: 'primaire.3',
    borderColor: 'primaire.3',
    _hover: {
      bgColor: 'secondaire.3',
      borderColor: 'secondaire.3',
    },
    _active: {
      bgColor: 'secondaire.3',
      borderColor: 'secondaire.3',
    },
  }),
  button_dataTagg_sequence_menu_pause: defineStyle({
    width: '2rem',
    padding: '0px',
    margin: '0px',
    bgColor: 'white',
    color: 'primaire.3',
    borderColor: 'secondaire.3',
    _hover: {
      bgColor: 'secondaire.3',
      borderColor: 'secondaire.3',
    },
    _active: {
      bgColor: 'secondaire.3',
      borderColor: 'secondaire.3',
    },
  }),
  collapse_filter: defineStyle({
    bg: 'white',
    color: 'primaire.5',
    bgColor: 'white',
    margin: 'auto',
    borderColor: 'primaire.5',
    _hover: {
      bg: 'secondaire.5',
      bgColor: 'secondaire.5',
      borderColor: 'secondaire.5',
    },
    _active: {
      bg: 'secondaire.5',
      bgColor: 'secondaire.5',
      borderColor: 'secondaire.5',
    },
  }),
  button_collapse_banner_view: defineStyle({
    border: '0px',
    borderLeft: '1px solid black',
    borderRadius: 0,
    lineHeight: 'unset',
    padding: '0',
    margin: '0',
    color: 'grey',
    bg: 'transparent',
    bgColor: 'transparent',
    marginInlineStart: 0,
    _hover: {
      color: 'gray.600',
      bg: 'gray.100',
      bgColor: 'gray.100',
    },
    _active: {
      color: 'gray.600',
      bg: 'gray.100',
      bgColor: 'gray.100',
    },
  }),
  button_banner_view: defineStyle({
    textStyle: 'h4',
    border: '0px',
    borderColor: 'transparent',
    lineHeight: 'unset',
    padding: '0',
    margin: '0',
    bg: 'transparent',
    bgColor: 'transparent',
    marginInlineStart: 0,
    svg: {
      height: '1rem',
      width: '1rem'
    },
    '.iconLocked svg': {
      position: 'absolute',
      right: '0.1em',
      bottom: '10%',
      height: '0.5rem',
      width: '0.5rem'
    },
    _hover: {
      color: 'gray.600',
      borderColor: 'transparent',
      bg: 'transparent',
      bgColor: 'transparent',
    },
    _active: {
      color: 'gray.600',
      borderColor: 'transparent',
      bg: 'transparent',
      bgColor: 'transparent',
    },
    _disabled: {
      marginInlineStart: 0,
      margin: 0,
      opacity: '0.6',
      color: 'gray.600',
      borderColor: 'transparent',
      bg: 'transparent',
      bgColor: 'transparent',
    }
  }),
  menutop_button_view_activated: defineStyle({
    textStyle: 'h4',
    fontSize: default_font_size,
    border: '0px',
    borderColor: 'transparent',
    lineHeight: 'unset',
    padding: '0',
    bg: 'transparent',
    bgColor: 'transparent',
    svg: {
      'height': '2rem',
      'width': '3rem',
      color: 'primaire.2',
      stroke: 'primaire.2',
    }
  }),
  menuconfigpanel_button_load_file_da_bg: defineStyle({
    height: '1.5rem',
    width: '100%',
    padding: '0.5rem',
    fontSize: 'unset',
    backgroundColor: 'white',
    color: 'tertiaire.3',
    fill: 'tertiaire.3',

    _active: {
      color: 'white  '
    }
  }),
  btn_create_unitary_from_nodes: defineStyle({
    height: '1.5rem',
    padding: '0.5rem',
    fontSize: 'unset',
    backgroundColor: 'primaire.2',
    color: 'white',
    _active: {
      backgroundColor: 'secondaire.2  '
    },
  })
}

// ===============================
// INPUT
// ===============================
// INPUT STYLES
// ===============================
export const inputStyles = {
  base: input.definePartsStyle({
    addon: {
      height: '1.5rem',
      border: 'solid 1px',
      fontSize: 'unset',
      borderRadius: '6px',
      borderColor: 'gray.100',
      textStyle: 'h4',
      bg: 'gray.50',
      bgColor: 'gray.50',
      padding: '0.2rem',
    },
    field: {
      ...BASE_STYLES.inputField,
      _disabled: { bg: 'gray.300', bgColor: 'gray.300' },
      _focus: { border: 'solid 2px', borderColor: 'primaire.2' }
    },
  }),

  menuconfigpanel_option_input: input.definePartsStyle({
    addon: { bg: 'gray.100', bgColor: 'gray.100' },
    field: { paddingLeft: '0.5rem', paddingRight: '0.5rem' }
  }),

  menuconfigpanel_option_input_table: input.definePartsStyle({
    addon: { bg: 'gray.100', bgColor: 'gray.100' },
    field: {
      paddingLeft: '0.25rem',
      paddingRight: '0.25rem',
      height: 'revert'
    }
  }),

  menuconfigpanel_option_input_color: input.definePartsStyle({
    field: { padding: '0.1rem' }
  }),
}

// ===============================
// MENU STYLES
// ===============================
export const menuStyles = {
  base: menu.definePartsStyle({
    button: {
      height: '3rem',
      width: '4rem',
      borderRadius: '6px',
      textStyle: 'h4',
      fontSize: default_font_size,
      border: '0px',
      span: {
        display: 'grid',
        gridColumnGap: '0',
        gridRowGap: '0',
        padding: '0',
        margin: '0',
      },
    },
    list: { minWidth: 'inherit' },
    item: { display: 'grid', fontSize: default_font_size }
  }),

  menu_button_subnav_style: menu.definePartsStyle({
    button: {
      color: 'gray.600',
      borderColor: 'transparent',
      bg: 'transparent',
      bgColor: 'transparent',
      'svg': { 'height': '2rem', 'width': '3rem' },
      _hover: {
        color: 'gray.600',
        borderColor: 'transparent',
        bg: 'transparent',
        bgColor: 'transparent',
      },
    },
    item: {
      gridTemplateColumns: '1.5rem auto',
      fontSize: '0.8rem',
    }
  }),

  menu_button_subnav_account_style: menu.definePartsStyle({
    button: {
      color: 'white',
      borderColor: 'primaire.2',
      bg: 'primaire.2',
      bgColor: 'primaire.2',
      span: {
        gridTemplateColumns: '2fr 1fr',
        gridTemplateRows: '1fr',
      },
      _hover: {
        color: 'white',
        borderColor: 'secondaire.2',
        bg: 'secondaire.2',
        bgColor: 'secondaire.2',
      },
    },
    item: { display: 'flex' }
  }),

  menu_select_elements: menu.definePartsStyle({
    item: {
      display: 'grid',
      gridTemplateColumns: '1fr 9fr',
      gridColumnGap: '0.25rem',
      fontSize: 'default_font_size',
      span: { margin: 0, padding: 0 },
      'span.chakra-menu__icon-wrapper': { margin: 'auto' },
      svg: { width: '0.8rem', height: '0.8rem' },
      _hover: { bg: 'lightgrey' }
    },
    list: {
      maxH: 'calc(' + (window.innerHeight) + 'px - 2rem)',
      overflowY: 'auto',
      border: 'solid 1px',
      borderColor: 'primaire.5'
    }
  }),

  menu_select_style: menu.definePartsStyle({
    list: {
      maxH: 'calc(' + (window.innerHeight) + 'px - 2rem)',
      overflowY: 'auto',
      border: 'solid 1px',
      borderColor: 'primaire.5'
    }
  }),

  selector_lang: menu.definePartsStyle({
    button: {
      margin: 'auto',
      border: '1px solid',
      borderColor: 'primaire.5',
      height: '1.5rem',
      width: '2rem',
      'span': {
        display: 'grid',
        gridTemplateColumns: '4fr 1fr',
        alignItems: 'center',
      }
    },
    item: {
      display: 'grid',
      gridTemplateColumns: '1fr 3fr',
      gridColumnGap: '0.25rem',
    },
    list: { zIndex: '3' }
  }),

  menu_subnav_item_demo: menu.definePartsStyle({
    button: {
      width: '8rem',
      margin: '0.2rem, 0rem, 0.2rem, 0.75rem',
      textStyle: 'h4',
      fontSize: '12px',
      color: 'gray.600',
      borderColor: 'transparent',
      bg: 'transparent',
      bgColor: 'transparent',
      span: {
        gridTemplateColumns: '7fr 1fr',
        gridTemplateRows: '1fr',
      },
      _hover: {
        color: 'gray.600',
        borderColor: 'transparent',
        bg: 'transparent',
        bgColor: 'transparent',
      },
    },
    list: {
      display: 'grid',
      gridAutoFlow: 'row',
    }
  }),
}

// ===============================
// CHECKBOX STYLES
// ===============================
export const checkboxStyles = {
  base: checkbox.definePartsStyle({
    container: {
      h: '2rem',
      w: '100%',
      border: 'solid 1px',
      borderRadius: '6px',
      borderColor: 'gray.50',
      margin: '0',
      padding: '0',
      transition: 'all 150ms',
      _checked: { bg: 'white' },
      _hover: {
        bg: 'primaire.5',
        color: 'white',
        transition: 'all 250ms',
      },
    },
    control: {
      margin: '0.25rem',
      width: '0.75rem',
      height: '0.75rem',
      bg: 'gray.400',
      borderColor: 'gray.400',
      iconColor: 'white',
      border: 'solid 1px',
      borderRadius: '4px',
      _checked: {
        bg: 'primaire.3',
        borderColor: 'primaire.3',
        iconColor: 'primaire.2',
        _hover: {
          bg: 'gray.400',
          borderColor: 'gray.400',
          iconColor: 'white',
        }
      },
      _hover: {
        bg: 'primaire.3',
        borderColor: 'primaire.3',
        iconColor: 'primaire.2',
      }
    },
    label: { width: '100%', margin: '0' }
  }),

  menuconfigpanel_option_checkbox: checkbox.definePartsStyle({
    label: {
      fontSize: 'unset',
      width: '100%',
      svg: { marginRight: '0.2rem' },
    },
    control: { w: '0.75rem', h: '0.75rem' },
    container: {
      h: '1.5rem',
      border: '0px',
      borderRadius: '4px',
      borderColor: 'white',
    },
  }),

  menuconfigpanel_tag_checkbox: checkbox.definePartsStyle({
    container: {
      border: '0px',
      borderRadius: '4px',
      borderColor: 'white',
    },
    label: {
      marginLeft: '0.5rem',
      fontSize: '14px'
    },
    control: { marginLeft: '1.25rem' }
  }),

  menuconfigpanel_part_title_1_checkbox: checkbox.definePartsStyle({
    label: {
      textAlign: 'center',
      fontSize: '0.7rem',
      fontWeight: 'bold',
      svg: { marginRight: '0.2rem' }
    },
    control: { width: '1.25rem', height: '1.25rem' }
  }),

  activate_antagonist_checkbox: checkbox.definePartsStyle({
    container: {
      margin: 'auto',
      width: 'inherit',
    }
  }),

  checkbox_dont_show_again: checkbox.definePartsStyle({
    container: {
      w: 'inherit',
      border: 'none',
      margin: 'auto',
      padding: '0',
      transition: 'all 150ms',
      _checked: { bg: 'white' },
      _hover: {
        bg: 'primaire.5',
        transition: 'all 250ms',
      },
    },
    control: {
      margin: '0.25rem',
      width: '1rem',
      height: '1rem',
      bg: 'gray.400',
      borderColor: 'gray.400',
      iconColor: 'white',
      border: 'solid 1px',
      _checked: {
        bg: 'primaire.3',
        borderColor: 'primaire.3',
        iconColor: 'primaire.2',
        _hover: {
          bg: 'gray.400',
          borderColor: 'gray.400',
          iconColor: 'white',
        }
      },
      _hover: {
        bg: 'primaire.3',
        borderColor: 'primaire.3',
        iconColor: 'primaire.2',
      }
    },
    label: {
      width: 'inherit',
      margin: 'auto',
      fontSize: '12px',
      textStyle: 'h4',
    }
  }),
}

// ===============================
// CARD STYLES
// ===============================
export const cardStyles = {
  base: card.definePartsStyle({
    body: {
      margin: 'auto',
      svg: { margin: 'auto' }
    }
  }),

  card_icon_selected: card.definePartsStyle({
    container: {
      borderWidth: '4px',
      borderColor: 'primaire.5'
    }
  }),

  card_icon_not_selected: card.definePartsStyle({
    container: {
      borderWidth: '1px',
      borderColor: 'grey'
    }
  }),

  card_import_icon: card.definePartsStyle({
    container: {
      backgroundColor: 'teal',
      borderWidth: '1px',
      borderColor: 'grey'
    }
  }),

  card_account: card.definePartsStyle({
    container: { marginTop: '6rem' },
    header: {
      textAlign: 'center',
      bg: 'primaire.5',
      color: 'white',
      textStyle: 'h2',
    },
    body: { width: '100%' }
  }),

  card_register: card.definePartsStyle({
    container: {
      marginTop: '175px',
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'primaire.5',
      width: '40vw',
    },
    header: {
      textAlign: 'center',
      bg: 'primaire.5',
      color: 'white',
      textStyle: 'h2',
    },
    body: {
      width: '90%',
      display: 'grid',
      gridRowGap: '10px',
    },
  }),

  cards_template: card.definePartsStyle({
    container: {
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'grey'
    },
    header: { textStyle: 'h3' },
  }),

  cards_empty_template: card.definePartsStyle({
    container: {
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: 'grey'
    }
  }),
}

// ===============================
// EDITABLE STYLES
// ===============================
export const editableStyles = {
  base: edit.definePartsStyle({}),

  name_file_editable: edit.definePartsStyle({
    preview: {
      display: 'block',
      alignItems: 'center',
      paddingLeft: '1rem',
      paddingRight: '1rem',
      height: '2rem',
      fontSize: '1rem',
      bg: 'primaire.3',
      border: '1px solid',
      borderColor: 'primaire.3',
      color: 'white',
      maxW: '15rem',
      minW: '8rem',
      width: 'unset',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    input: {
      display: 'block',
      height: '2rem',
      fontSize: '1rem',
      bg: 'primaire.3',
      border: '1px solid',
      borderColor: 'primaire.3',
      color: 'white',
      maxW: '15rem',
      minW: '8rem',
      width: 'unset',
      overflow: 'visible',
      whiteSpace: 'nowrap',
    },
    _active: { secondaire: 'primaire.3' }
  }),

  edit_name_palette: edit.definePartsStyle({
    preview: {
      fontSize: '0.8rem',
      width: '100%',
      padding: '0',
      height: '1.5rem',
      border: '1px solid',
      borderColor: 'primaire.5',
    },
    input: {
      fontSize: '0.8rem',
      height: '1.5rem',
      border: '1px solid',
      borderColor: 'primaire.5'
    }
  }),
}

// ===============================
// NUMBER INPUT STYLES
// ===============================
export const numberInputStyles = {
  base: numberInput.definePartsStyle({
    root: { width: '100%' },
    field: {
      width: '100%',
      height: '1.5rem',
      fontSize: 'unset',
      border: 'solid 1px',
      borderRadius: '6px',
      borderColor: 'gray.100',
      textStyle: 'h4',
      bg: 'white',
      bgColor: 'white',
      _disabled: { bg: 'gray.300', bgColor: 'gray.300' },
      _focus: { border: 'solid 2px', borderColor: 'primaire.2' }
    },
    stepperGroup: { height: '1.5rem', margin: '0' },
  }),

  menuconfigpanel_option_numberinput: numberInput.definePartsStyle({
    field: {
      paddingLeft: '0.15rem',
      paddingRight: '0.15rem'
    },
    stepperGroup: { width: '0.8rem' },
    stepper: {
      'svg': {
        width: '0.4rem',
        height: '0.4rem',
      }
    }
  }),

  menuconfigpanel_option_numberinput_with_right_addon: numberInput.definePartsStyle({
    field: {
      borderRadius: '6px 0px 0px 6px',
      paddingLeft: '0.15rem',
      paddingRight: '0.15rem',
    },
    stepperGroup: { width: '0.8rem' },
    stepper: {
      'svg': {
        width: '0.4rem',
        height: '0.4rem',
      }
    }
  }),
}

// ===============================
// SELECT STYLES
// ===============================
export const selectStyles = {
  base: select.definePartsStyle({
    field: {
      height: '1.5rem',
      border: 'solid 1px',
      borderRadius: '6px',
      borderColor: 'gray.50',
      fontSize: 'unset',
      bg: 'white',
      bgColor: 'white',
      _disabled: { bg: 'gray.300', bgColor: 'gray.300' },
      _focus: { border: 'solid 2px', borderColor: 'openSankey.100' }
    }
  }),

  select_custom_style: select.definePartsStyle({
    field: {
      height: '1.5rem',
      borderRadius: '0px 6px 6px 0px',
    }
  }),

  menuconfigpanel_option_select: select.definePartsStyle({
    field: {
      height: '1.5rem',
      border: 'solid 1px',
      borderRadius: '6px',
      borderColor: 'gray.50',
    }
  }),

  menuconfigpanel_option_select_table: select.definePartsStyle({
    field: {
      paddingLeft: '0.25rem',
      paddingRight: '0.8rem',
      height: 'revert',
      border: 'solid 1px',
      borderRadius: '6px',
      borderColor: 'gray.50',
    },
    icon: {
      width: '0.75rem',
      height: '0.75rem',
    }
  }),
  view_select: select.definePartsStyle({
    field: {
      height: '1.25rem',
      border: 'solid 1px',
      borderRadius: '6px',
      borderColor: 'gray.50',
    }
  })
}

// ===============================
// POPOVER STYLES
// ===============================
export const popoverStyles = {
  base: popover.definePartsStyle({
    header: {
      textStyle: 'h1',
      width: '100%',
      marginRight: '3rem'
    },
    body: {
      textStyle: 'h4',
      width: '100%',
      display: 'grid',
      gridRowGap: '0.5rem',
    },
    content: { width: '100%' },
    closeButton: {
      marginTop: '0.35rem',
      height: '1.5rem',
      width: '1.5rem',
      color: 'white',
      bg: 'primaire.1',
      bgColor: 'primaire.1'
    }
  }),

  toolbar_popover_window: popover.definePartsStyle({}),
}

// ===============================
// DRAWER STYLES
// ===============================
export const drawerStyles = {
  base: drawer.definePartsStyle({}),

  drawer_menu_config: drawer.definePartsStyle({
    dialog: {
      maxWidth: 'inherit',
      borderRadius: '4px',
      background: 'none',
      boxShadow: 'unset',
      height: 'fit-content',
      overflowY: 'unset',
    },
    dialogContainer: {
      width: 'inherit',
      background: 'none',
      zIndex: 1
    },
    body: {
      padding: '0',
      overflow: 'unset'
    }
    }),
    drawer_sequence: defineStyle({
      dialog: {
        maxWidth: 'inherit'
      },
      dialogContainer: {
        width: 'inherit',
        zIndex: 1
      },
      body: {
        padding: '0'
      },
    drawer_menu_filter: defineStyle({
      dialog: {
        maxWidth: 'inherit',
        background: 'primaire.5',
        borderRadius: '4px'

      },
      dialogContainer: {
        width: 'inherit',
        background: 'none',
        zIndex: 1
      },
      body: {
        overflow: 'unset',
        padding: '0',
      }
    })
}

// ===============================
// BREADCRUMB STYLES
// ===============================
export const breadcrumbStyles = {
  base: breadcrumb.definePartsStyle({}),

  pagination_welcome: breadcrumb.definePartsStyle({
    container: {
      display: 'flex',
      alignItems: 'center',
      borderRight: '2px solid',
      borderColor: 'primaire.2',
      width: '100%',
    },
    item: {
      textStyle: 'h2',
      height: 'minmax(3rem, 10vh)',
      span: { color: 'primaire.2' }
    },
    link: {
      _hover: { color: 'secondaire.2' }
    },
    separator: {},
  }),
}

// ===============================
// ACCORDION STYLES
// ===============================
export const accordionStyles = {
  base: accordion.definePartsStyle({
    root: {
      margin: '0',
      padding: '0',
      color: 'primaire.5',
      bg: 'white',
      bgColor: 'white',
      '.chakra-collapse': {
        overflow: 'visible !important',
      },
    },
    container: {
      margin: '0',
      padding: '0',
      color: 'primaire.5',
      bg: 'white',
      bgColor: 'white',
      width: '100%',
      border: '0',
      borderRadius: '0'
    },
    button: {
      margin: '0',
      padding: '1rem 1.25rem',
      color: 'primaire.5',
      bg: 'white',
      bgColor: 'white',
      border: '0',
      borderRadius: '0',
      boxShadow: 'inset 0 -1px 0 rgba(0,0,0,.125)',
      width: '100%',
      height: '3.5rem',
      flex: '1',
      textAlign: 'left',
      textStyle: 'h2',
      _expanded: {
        color: 'white',
        bg: 'primaire.5',
        bgColor: 'primaire.5',
        border: '1px',
        borderColor: 'primaire.5',
      }
    },
    panel: {
      margin: '0',
      padding: '0.5rem 1.5rem',
      color: 'primaire.5',
      bg: 'white',
      bgColor: 'white',
      border: '0',
      borderRadius: '0'
    },
    icon: {
      width: '2em',
      height: '1em',
      border: '1px solid',
      borderColor: 'primaire.5',
      background: 'primaire.5',
      borderRadius: 'full',
      color: 'white',
      _active: {
        borderColor: 'white',
        background: 'white',
        color: 'primaire.5'
      }
    }
  }),
}

// Default style of table because we need one for the theme
const minHeightTableRow1 = '1rem'
const basic_td1 = { paddingLeft: '0.2rem', paddingRight: '0.2rem', margin: 'auto', }
const basic_th1 = { paddingInlineStart: 'inherit', paddingInlineEnd: 'inherit', margin: 'auto', paddingBottom: '0', fontSize: 'unset' }
// Style of table to edit node/link/data group tags


const minHeightTableRow = '1.75rem'
const basic_td = { padding: 0, margin: 'auto' }
const basic_th = { paddingInlineStart: 'inherit', paddingInlineEnd: 'inherit', margin: 'auto', paddingBottom: '0', }
// Style of table to edit node tags
export const table_edit_tag_level = table.definePartsStyle({
  td: basic_td,
  th: basic_th,
  tr: {
    minHeight: minHeightTableRow,
    gridTemplateColumns: '0.75fr 4.5fr',
    display: 'grid',
  },
})

// Style of table to edit node/link/data group tags
export const table_edit_grp_tag_level = table.definePartsStyle({
  td: basic_td,
  th: basic_th,
  tr: {
    minHeight: minHeightTableRow,
    gridTemplateColumns: '0.75fr 1.5fr 2fr',
    display: 'grid',
  },
})

export const slider_filter_link_value = slider.definePartsStyle({
  container: {
    width: '85%',
    margin: 'auto'
  },
  thumb: {
    boxSize: 4
  }
})


// ===============================
// TABLE STYLES
// ===============================
export const tableStyles = {
  base: table.definePartsStyle({}),
  table_edit_grp_tag_node_link: createTableStyle('0.5fr 2fr 1.5fr'),
  table_edit_grp_tag_data: createTableStyle('0.75fr 2fr 1.5fr 1.5fr'),
  table_edit_tag_node: createTableStyle('0.5fr 2fr 0.75fr 0.5fr 1.5fr'),
  table_edit_tag_link: createTableStyle('0.5fr 2fr 0.5fr 0.75fr'),
  table_edit_tag_data: createTableStyle('0.5fr 1.5fr 0.75fr'),
  table_edit_node_io: createTableStyle('2fr 2fr'),

  table_welcome_buttons: table.definePartsStyle({
    table: {
      margin: '1rem',
      justifySelf: 'center',
      borderCollapse: 'separate',
      borderSpacing: '0.25rem',
    },
    thead: {
      bg: 'primaire.2',
      color: 'white',
      textStyle: 'h2',
      paddingInlineStart: '1rem',
      tr: {
        borderRadius: '6px'
      }
    },
    tbody: {
      tr: {
        '&:nth-of-type(odd)': {
          td: {
            background: 'gray.50',
          },
        },
      }
    },
    td: {},
    tr: {
      'td:first-child': {
        textAlign: 'end',
        minWidth: '15rem',
        textStyle: 'h3',
      },
      'td:last-child': {
        paddingInlineStart: '1rem',
        textAlign: 'start',
        textStyle: 'h4',
      },
    },
  }),
  table_view : table.definePartsStyle({
  td: basic_td1,
  th: basic_th1,
  tr: {
    minHeight: minHeightTableRow1,
    gridTemplateColumns: '2fr 1fr 1fr',
    display: 'grid',
  },
})
}

// ===============================
// TAG STYLES
// ===============================
export const tagStyles = {
  base: tag.definePartsStyle({}),
  tag_dev_navbar: tag.definePartsStyle({
    container: {
      position: 'absolute',
      color: 'white',
      background: 'primaire.3',
      fontSize: '0.4rem',
      minHeight: '0.6rem',
      right: '0px',
      bottom: '0.2rem'
    }
  }),
}

// ===============================
// SIZES
// ===============================
export const sizes = {
  sizeToolbarButton: defineStyle({
    width: '2rem',
    height: '2rem',
    minW: 'unset',
    padding: '0.2rem',
  }),
  sizeConfigButton: defineStyle({
    width: '1.5rem',
    height: '1.5rem',
    minW: 'unset',
    padding: '0.2rem',
  }),
  sizeCollapseButton: defineStyle({
    width: '1.25rem',
    height: '1.25rem',
    minW: 'unset',
    padding: '0.2rem',
    margin: 'auto'
  }),
  sizeMenuTopButton: defineStyle({
    width: '3rem',
    height: '3rem',
    minW: 'unset',
    padding: '0.2rem',
    marginRight: '0.5rem',
    marginLeft: '0.5rem'
  }),
  sizeMenuTopButtonSaveCache: defineStyle({
    height: '2rem',
    width: '2rem',
    minW: 'unset',
  }),
  sizeButtonDialog: defineStyle({
    height: '2rem',
    minWidth: 'unset',
    padding: '0.3rem',
    fontSize: '0.8rem',
  }),
  sizeBtnCollapseFilter: defineStyle({
    width: '1.25rem',
    height: '1.25rem',

  })
}

// ===============================
// TABS STYLES
// ===============================
export const tabsStyles = {
  base: menu.definePartsStyle({
    button: {
      height: '3rem',
      width: '4rem',
      borderRadius: '6px',
      textStyle: 'h4',
      fontSize: default_font_size,
      border: '0px',
      span: {
        display: 'grid',
        gridColumnGap: '0',
        gridRowGap: '0',
        padding: '0',
        margin: '0',
      },
    },
    list: { minWidth: 'inherit' },
    item: { display: 'grid', fontSize: default_font_size },
    root: {
      border: 'inherit',
      borderRadius: '6px',
      borderColor: 'inherit',
      WebkitUserSelect: 'none', /* Chrome all / Safari all */
      MozUserSelect: 'none', /* Firefox all */
      msUserSelect: 'none', /* IE 10+ */
      userSelect: 'none',
    },
    tab: {
      borderRight: '0px !important',
      borderLeft: '0px !important',
      borderBottom: '0px !important',
      borderTop: '0px !important',
      borderRadius: '0px',
      margin: '0 -1px 0 0 !important',
      padding: '0 !important',
      height: '2rem !important',
      color: 'primaire.3',
      fill: 'primaire.3',
      path: 'primaire.3',
      width: '10rem',
      textStyle: 'h3',
      _selected: {
        background: 'white',
        borderRight: '0px !important',
        borderLeft: 'solid 1px !important',
        borderBottom: 'solid 1px !important',
        borderTop: 'solid 1px !important',
        borderRadius: '6px 0px 0px 6px',
        borderRightColor: 'white',
        borderLeftColor: 'primaire.2',
        borderBottomColor: 'primaire.2',
        borderTopColor: 'primaire.2',
        color: 'primaire.2',
        fill: 'primaire.2',
        path: 'primaire.2',
      }
    },
    tablist: {
      display: 'inherit',
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr',
      borderRight: '1px !important',
      borderColor: 'primaire.2 !important',
      padding: '3rem 0 0 0 !important'
    },
    tabpanels: {
      border: '0px !important',
    },
    tabpanel: {
      display: 'block',
      height: '100%',
      width: '100%',
    }
  }),

  menu_button_subnav_style: menu.definePartsStyle({
    button: {
      color: 'gray.600',
      borderColor: 'transparent',
      bg: 'transparent',
      bgColor: 'transparent',
      'svg': { 'height': '2rem', 'width': '3rem' },
      _hover: {
        color: 'gray.600',
        borderColor: 'transparent',
        bg: 'transparent',
        bgColor: 'transparent',
      },
    },
    item: {
      gridTemplateColumns: '1.5rem auto',
      fontSize: '0.8rem',
    }
  }),

  menu_button_subnav_account_style: menu.definePartsStyle({
    button: {
      color: 'white',
      borderColor: 'primaire.2',
      bg: 'primaire.2',
      bgColor: 'primaire.2',
      span: {
        gridTemplateColumns: '2fr 1fr',
        gridTemplateRows: '1fr',
      },
      _hover: {
        color: 'white',
        borderColor: 'secondaire.2',
        bg: 'secondaire.2',
        bgColor: 'secondaire.2',
      },
    },
    item: { display: 'flex' }
  }),

  menu_select_elements: menu.definePartsStyle({
    item: {
      display: 'grid',
      gridTemplateColumns: '1fr 9fr',
      gridColumnGap: '0.25rem',
      fontSize: default_font_size,
      span: { margin: 0, padding: 0 },
      'span.chakra-menu__icon-wrapper': { margin: 'auto' },
      svg: { width: '0.8rem', height: '0.8rem' },
      _hover: { bg: 'lightgrey' }
    },
    list: {
      maxH: 'calc(' + (window.innerHeight) + 'px - 2rem)',
      overflowY: 'auto',
      border: 'solid 1px',
      borderColor: 'primaire.5'
    }
  }),

  menu_select_style: menu.definePartsStyle({
    list: {
      maxH: 'calc(' + (window.innerHeight) + 'px - 2rem)',
      overflowY: 'auto',
      border: 'solid 1px',
      borderColor: 'primaire.5'
    }
  }),

  selector_lang: menu.definePartsStyle({
    button: {
      margin: 'auto',
      border: '1px solid',
      borderColor: 'primaire.5',
      height: '1.5rem',
      width: '2rem',
      'span': {
        display: 'grid',
        gridTemplateColumns: '4fr 1fr',
        alignItems: 'center',
      }
    },
    item: {
      display: 'grid',
      gridTemplateColumns: '1fr 3fr',
      gridColumnGap: '0.25rem',
    },
    list: { zIndex: '3' }
  }),

  menu_subnav_item_demo: menu.definePartsStyle({
    button: {
      width: '8rem',
      margin: '0.2rem, 0rem, 0.2rem, 0.75rem',
      textStyle: 'h4',
      fontSize: '12px',
      color: 'gray.600',
      borderColor: 'transparent',
      bg: 'transparent',
      bgColor: 'transparent',
      span: {
        gridTemplateColumns: '7fr 1fr',
        gridTemplateRows: '1fr',
      },
      _hover: {
        color: 'gray.600',
        borderColor: 'transparent',
        bg: 'transparent',
        bgColor: 'transparent',
      },
    },
    list: {
      display: 'grid',
      gridAutoFlow: 'row',
    }
  }),
tabs_data_source_for_unitary : tabs.definePartsStyle({
  root: {
    width: '100%'
  },
  list: {
    display: 'unset'
  }
})

}

// ===============================
// SLIDER STYLES
// ===============================
const sliderStyles = {
  base: slider.definePartsStyle({
    thumb: {
      width: '1.5rem',
      height: '1.5rem',
      border: 'solid 1px',
      borderRadius: '6px',
      borderColor: 'gray.50',
      bg: 'openSankey.50',
      bgColor: 'openSankey.50',
    },
    filledTrack: {
      bg: 'openSankey.50',
      bgColor: 'openSankey.50',
    },
    mark: {
      textAlign: 'center',
      color: 'gray.50',
      width: '1.5rem',
      zIndex: '2',
      marginTop: '-0.25rem',
      marginLeft: '-0.75rem',
      padding: '0px'
    }
  })
}

// ===============================
// STYLES SUPPLÉMENTAIRES
// ===============================
const otherStyles = {
  close_button_base_style: defineStyle({
    width: '1.5rem',
    height: '1.5rem',
    margin: '0',
    border: 'solid 1px',
    borderRadius: '6px',
    color: 'white',
    borderColor: 'primaire.1',
    bg: 'primaire.1',
    bgColor: 'primaire.1',
    _hover: {
      borderColor: 'secondaire.1',
      bg: 'secondaire.1',
      bgColor: 'secondaire.1',
    },
    _disabled: {
      borderColor: 'gray.300',
      bg: 'gray.300',
      bgColor: 'gray.300',
    }
  }),

  badge_base_style: defineStyle({
    display: 'inline',
    padding: '0',
    height: '0.75rem',
    width: '1.75rem',
    color: 'white',
    bgColor: 'primaire.3',
    bb: 'primaire.3',
    border: '0px',
    borderRadius: '3px',
    fontSize: '0.5rem'
  }),

  badge_on_template_img: defineStyle({
    display: 'inline-grid',
    justifyContent: 'center',
    alignContent: 'center',
    position: 'absolute',
    width: 'fit-content',
    height: 'fit-content',
    margin: '0.5rem',
    padding: '0.5rem',
    textStyle: 'h3',
    bgColor: 'primaire.2',
    bb: 'primaire.2',
  }),

  buttongroup_base_style: defineStyle({
    right: 0,
    margin: '0',
    marginTop: '0',
    position: 'fixed',
    zIndex: 100,
  }),

  buttongroup_sideBar: defineStyle({}),

  spinner_base_style: defineStyle({
    size: 'md',
    justifySelf: 'center',
    color: 'primaire.3',
  }),

  textarea_base_style: defineStyle({
    border: '2px dashed',
    borderRadius: 0,
    fontWeight: 'semibold',
  }),
}

// ===============================
// LAYER STYLES COMPLETS
// ===============================
const layerStyles = {
  base: { margin: 0 },

  context_menu: {
    display: 'grid',
    rowGap: '0.1rem',
    background: 'white',
    border: '1px solid gray',
    borderRadius: '4px'
  },

  menuconfig_entry: {
    textStyle: 'h1',
    textAlign: 'left',
    flex: '1',
  },

  submenuconfig_entry: {
    textStyle: 'h2',
    textAlign: 'left',
    flex: '1'
  },

  submenuconfig_tab: {
    textStyle: 'h3',
    textAlign: 'center',
    flex: '1',
    paddingStart: '0',
    paddingEnd: '0',
  },

  submenuconfig_tab_with_badge: {
    alignItems: 'center',
    color: 'openSankey.400',
    display: 'grid',
    gridColumnGap: '0.25rem',
    gridTemplateColumns: '1fr 1fr',
    paddingEnd: '0em',
    paddingStart: '1em',
    textAlign: 'center',
    textStyle: 'h3',
  },

  menu_sub_section_title: {
    textAlign: 'center',
    display: 'block',
    margin: 'auto',
    width: '100%',
  },

  menuconfigpanel_part_title_2: {
    textStyle: 'h3',
    textAlign: 'left',
    display: 'block',
    height: '1.5rem'
  },

  menuconfigpanel_part_title_3: {
    textStyle: 'h4',
    textAlign: 'left',
    display: 'block',
    height: '1rem'
  },

  menuconfigpanel_warn_msg: {
    textStyle: 'h4',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    color: 'red'
  },

  menuconfigpanel_option_name: {
    textStyle: 'h4',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    'svg.tooltip_overload': {
      marginLeft: 'auto',
      marginRight: '0'
    }
  },

  menuconfigpanel_suboption_name: {
    textStyle: 'h4',
    textAlign: 'left',
    display: 'flex',
    alignItems: 'center',
    paddingLeft: '1.5rem'
  },

  // Grid layouts avec factory
  ...(['2cols', '3cols', '4cols'] as const).reduce((acc, type) => {
    const colCount = parseInt(type.charAt(0))
    acc[`options_${type}`] = {
      display: 'grid',
      gridTemplateColumns: `repeat(${colCount}, 1fr)`,
      gridColumnGap: '0.12rem',
    }
    return acc
  }, {} as Record<string, any>),

  options_cards: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gridColumnGap: '0.25rem',
    gridTemplateRows: 'repeat(auto, 1fr)',
    gridRowGap: '0.25rem'
  },

  option_with_activation: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gridColumnGap: '0.12rem',
  },

  welcome_license_row: {
    display: 'grid',
    gridTemplateColumns: '1fr 3fr',
    gridColumnGap: '0.25rem',
  },

  welcome_license_desc: {
    whiteSpace: 'pre-line'
  },

  menuconfigpanel_grid: {
    display: 'grid',
    gridRowGap: '0.25rem',
  },

  menuconfigpanel_row_droplist: {
    display: 'grid',
    gridTemplateColumns: '1fr 10fr 1fr 1fr',
    gridColumnGap: '0.25rem',
  },

  menuconfigpanel_row_droplist_simple: {
    display: 'grid',
    gridColumnGap: '0.25rem',
    gridTemplateColumns: '8fr 1fr',
  },

  menuconfigpanel_zdt_row_droplist: {
    display: 'grid',
    gridTemplateColumns: '1fr 6fr 1fr 1fr 1fr',
    gridColumnGap: '0.25rem',
  },

  menuconfigpanel_row_stylechoice: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 6fr',
    gridColumnGap: '0.25rem',
  },

  menuconfigpanel_row_2cols: {
    display: 'grid',
    gridTemplateColumns: '2fr 3fr',
    gridColumnGap: '0.25rem',
  },

  menuconfigpanel_row_3cols: {
    display: 'grid',
    gridTemplateColumns: '2fr 1.5fr 1.5fr',
    gridColumnGap: '0.25rem',
  },

  menuconfigpanel_row_3colsbis: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 2fr',
    gridColumnGap: '0.25rem',
  },

  menuconfigpanel_2row_3cols: {
    display: 'grid',
    gridTemplateColumns: '2fr 1.25fr 1.75fr',
    gridTemplateRows: '1fr 2fr',
    gridColumnGap: '0',
    gridRowGap: '0',
    height: '3rem'
  },

  menutop_layout_style: {
    display: 'grid',
    gridColumnGap: '0.25rem',
    height: '5rem',
    width: 'auto',
    padding: '0',
    margin: '0px 3px 0px 3px',
    alignItems: 'center',
    background: 'gray.50',
    color: 'gray.600'
  },

  menutop_tab_style: {
    textStyle: 'h3',
    textAlign: 'start',
    flex: '1',
    paddingStart: '0.25rem',
    paddingEnd: '1.25rem'
  },

  menutop_button_style: {
    display: 'grid',
    gridTemplateColumns: '3fr',
    gridTemplateRows: '2fr 1fr',
    gridColumnGap: '0',
    gridRowGap: '0',
    height: '3rem',
    width: '4rem',
    padding: '0',
    margin: '0',
    textStyle: 'h4',
    fontSize: default_font_size,
    color: 'gray.600',
    stroke: 'gray.600',
    fill: 'gray.600',
    alignItems: 'center',
    justifyItems: 'center'
  },

  menubottom_layout_style: {
    background: 'gray.50',
    bgColor: 'gray.50',
    width: '100%',
  },

  menubottom_item_style: {
    display: 'flex',
    color: 'black',
    textStyle: 'h4',
    alignSelf: 'center',
    justifySelf: 'center'
  },

  menucontext_layout: {
    display: 'grid',
    gridRowGap: '0.25rem',
  },

  menustylepanel_row_droplist: {
    display: 'flex',
    gap: '0.6rem',
  },

  popover_sidebar_row_tag_filter: {
    display: 'grid',
    gridTemplateColumns: '3.5fr 1.5fr',
    gridColumnGap: '0.25rem',
  },

  menu_draggable_layout: {
    padding: '0.25rem',
    display: 'grid',
    gridRowGap: '0.5rem',
    gridColGap: '0.5rem',
    alignItems: 'center',
    width: 'fit-content',
    color: 'gray.600',
    bg: 'white',
    bgColor: 'white',
    border: 'solid 1px',
    borderColor: 'primaire.2',
    borderRadius: '6px',
    fontSize: default_font_size
  },

  menu_draggable_title_layout: {
    display: 'grid',
    gridTemplateColumns: '9fr 1fr',
    gridColumnGap: '0.25rem',
    margin: '0.25rem',
    alignItems: 'center',
    alignContent: 'center',
    padding: '1rem',
    height: 'fit-content',
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: 'white',
    background: 'primaire.2',
    borderRadius: '6px',
    paddingRight: '1rem'
  },

  menu_draggable_content_layout: {
    display: 'grid',
    gridRowGap: '0.25rem',
    fontStyle: 'h4',
    alignItems: 'center',
    margin: '0.25rem'
  },

  image_layout: {
    height: '100%',
    margin: '1rem'
  },

  toolbar_bottom: {
    display: 'grid',
    gridTemplateColumns: '2fr 2fr 3fr 1fr',
    gridColumnGap: '1rem',
    position: 'fixed',
    zIndex: 1,
    width: 'fit-content',
    left: '50%',
    transform: 'translate(-50%)'
  },

  config_menu_layout: {
    display: 'grid',
    gridGap: '0.2rem',
    gridTemplateColumns: '8fr 1fr',
    gridTemplateAreas: `'header  header  header'
    'content content sidebar'
    'content content sidebar'`,
    color: '#444',
    borderRadius: '5px',
    padding: '0.2rem',
    fontSize: default_font_size,
  },

  config_box: {
    gridArea: 'content',
    display: 'grid',
    gridRowGap: '0.2rem',
    color: 'primaire.5',
    // overflowY: 'auto',
  },

  element_box: {
    gridArea: 'sidebar'
  },

  type_config_box: {
    gridArea: 'header',
  },

  box_content_config: {
    background: 'white',
    borderRadius: '4px',
    padding: '0.2rem',
    display: 'grid',
    gridRowGap: '0.2rem',
    gridAutoRows: 'max-content',
    '.title_box': {
      padding: '0.4rem',
      width: '100%',
      background: 'primaire.2',
      borderRadius: '4px',
      color: 'white',
      fontWeight: 'bold',
      fontSize: '0.8rem',
    }
  },

  menu_sub_section: {
    display: 'grid',
    border: '1px solid black',
    borderRadius: '4px',
    gridRowGap: '0.2rem',
    padding: '0.2rem'
  },

  menu_sub_section_head: {
    display: 'grid',
    gridTemplateColumns: '1fr 9fr'
  },

  selector_elements: {
    width: '9rem',
    height: '1.5rem',
    '.rmsc .dropdown-container': { height: '1.5rem !important' },
    '.dropdown-content ul': { minHeight: 'unset', maxHeight: '8rem' },
    '.rmsc': {
      '--rmsc-radius': '6px !important',
      '--rmsc-h': '1.5rem !important',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      userSelect: 'none',
    }
  },

  selector_elements_simple: {
    width: '14vw',
    height: '1.5rem',
    '.rmsc .dropdown-container': { height: '1.5rem !important' },
    '.dropdown-content ul': { minHeight: 'unset', maxHeight: '8rem' },
    '.rmsc': {
      '--rmsc-radius': '6px !important',
      '--rmsc-h': '1.5rem !important',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      userSelect: 'none',
    }
  },

  empty_config_text: {
    color: 'white',
    fontSize: '0.7rem',
  },

  text_menu_select: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  topbar_file_name: {
    margin: 'auto',
  },

  toolbar_save_and_file_name: {
    position: 'absolute',
    right: 0,
    zIndex: 2,
    display: 'grid',
    gridColumnGap: '0.25rem',
    gridTemplateColumns: 'auto auto',
  },

  drag_line_element_order: {
    display: 'grid',
    gridTemplateColumns: '6fr 3fr',
    border: '1px solid',
    borderRadius: '3px',
    '.name_element': {
      margin: 'auto',
      maxW: '7rem',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }
  },
  config_timeout_sequence: {
    display: 'grid',
    gridTemplateColumns: '0.5fr 0.5fr',
    gridColumnGap: '0.25rem',
  },
  box_sequence: {
    display: 'grid',
    gridTemplateColumns: '0.5fr 11fr',
    margin: '0.2rem'
  },
  box_stepper: {
    marginLeft: '16px',
    marginRight: '16px',
  },
  drawerFilterBox: {
    display: 'grid',
    gridRowGap: '0.5rem',
    overflowY: 'auto',
    padding: '0.3rem',
    color: 'primaire.5',

  },
  filter_head_box: {
    display: 'grid',
    gridTemplateColumns: '9fr 1fr'
  },
  filter_grid_row: {
    display: 'grid',
    gridTemplateColumns: '10fr 3fr',
    gridColumnGap: '0.25rem',
    height: '2rem',
    alignItems: 'center'
  },
  filter_wrapper: {
    background: 'white',
    border: 'solid 1px grey',
    borderRadius: '4px',
    padding: '5px',
    fontSize: '0.8rem',

    '.content_filter': {
      display: 'grid',
      paddingTop: '0.2rem',
      gridRowGap: '0.2rem',
    }
  },
  banner_view_buttons: {
    display: 'grid',
    gridTemplateColumns: '3fr',
    gridTemplateRows: '2fr 1fr',
    gridColumnGap: '0',
    gridRowGap: '0',
    height: '2rem',
    width: '1.5rem',
    padding: '0',
    margin: '0',
    textStyle: 'h4',
    fontSize: '0.8rem',
    color: 'gray.600',
    stroke: 'gray.600', // Svg params
    fill: 'gray.600',  // svg params
    alignItems: 'center',
    justifyItems: 'center'
  },
  selector_node_flow_tag: {
    // Styling box containing multi select
    height: '1.5rem',

    // Styling of react component multi select
    '.rmsc .dropdown-container': {
      height: '1.5rem !important'
    },
    '.rmsc': {
      // overflow:'',
      // position:'fixed',
      // zIndex:'10',
      '--rmsc-radius': '6px !important',
      '--rmsc-h': '1.5rem !important',
    }
  },
}

// ===============================
// TEXT STYLES
// ===============================
const textStyles = {
  xl: { fontSize: '16px' },
  lg: { fontSize: '14px' },
  md: { fontSize: '12px' },
  sm: { fontSize: '10px' },
  xs: { fontSize: '8px' },
  h1: { fontFamily: 'Open Sans,sans-serif', fontWeight: 'bold' },
  h2: { fontFamily: 'Open Sans,sans-serif', fontWeight: 'bold' },
  h3: { fontFamily: 'Open Sans,sans-serif', fontWeight: 'bold' },
  h4: { fontFamily: 'Open Sans,sans-serif', fontWeight: 'normal' },
  title_sub_section: { fontSize: '0.7rem', fontWeight: 'bold' },
  filter_heading: {
    fontSize: '0.8rem',
    fontWeight: 'Bold',
  }
}
// ===============================
// THEME PRINCIPAL COMPLET
// ===============================
export const opensankey_theme = extendTheme({
  components: {
    Accordion: {
      baseStyle: accordionStyles.base,
    },
    Badge: {
      baseStyle: otherStyles.badge_base_style,
      variants: {
        badge_on_template_img: otherStyles.badge_on_template_img
      }
    },
    Button: {
      baseStyle: buttonStyles.base,
      variants: buttonStyles,
      sizes
    },
    ButtonGroup: {
      baseStyle: otherStyles.buttongroup_base_style,
      variants: {
        buttongroup_sideBar: otherStyles.buttongroup_sideBar,
      }
    },
    Breadcrumb: {
      baseStyle: breadcrumbStyles.base,
      variants: breadcrumbStyles
    },
    Card: {
      baseStyle: cardStyles.base,
      variants: cardStyles
    },
    Checkbox: {
      baseStyle: checkboxStyles.base,
      variants: checkboxStyles
    },
    CloseButton: {
      baseStyle: otherStyles.close_button_base_style
    },
    Editable: {
      baseStyle: editableStyles.base,
      variants: editableStyles
    },
    Input: {
      baseStyle: inputStyles.base,
      variants: inputStyles
    },
    Modal: {
      baseStyle: modalStyles.base,
      variants: modalStyles
    },
    Menu: {
      baseStyle: menuStyles.base,
      variants: menuStyles
    },
    NumberInput: {
      baseStyle: numberInputStyles.base,
      variants: numberInputStyles
    },
    Popover: {
      baseStyle: popoverStyles.base,
      variants: popoverStyles
    },
    Select: {
      baseStyle: selectStyles.base,
      variants: selectStyles
    },
    Slider: {
      baseStyle: sliderStyles.base,
      variants: {
        slider_filter_link_value
      }
    },
    Tabs: {
      baseStyle: tabsStyles.base,
      variants: tabsStyles
    },
    Table: {
      baseStyle: tableStyles.base,
      variants: tableStyles
    },
    Tag: {
      baseStyle: tagStyles.base,
      variants: tagStyles
    },
    TextArea: {
      baseStyle: otherStyles.textarea_base_style
    },
    Drawer: {
      baseStyle: drawerStyles.base,
      variants: drawerStyles
    },
    Heading: {
      baseStyle: headingStyles.base,
      variants: headingStyles
    },
    Spinner: {
      baseStyle: otherStyles.spinner_base_style
    },
    Stepper: {
      baseStyle: {},
      variants: {
        sequenceStepper: stepper.definePartsStyle({
          stepper: {
            gap: '0.5rem'
          },
          step: {
            WebkitUserSelect: 'none',  /* Chrome all / Safari all */
            MozUserSelect: 'none',     /* Firefox all */
            msUserSelect: 'none',      /* IE 10+ */
            userSelect: 'none',
          },
          separator: {
            margin: '0'
          },

          indicator: {
          },
          title: {
            fontSize: '0.8rem'
          }
        })
      }
    },
  },
  layerStyles,
  textStyles,
  colors: COLORS
})