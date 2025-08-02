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

import { extendTheme } from '@chakra-ui/react'
import { defineStyle } from '@chakra-ui/react'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'
import { menutop_button } from '../deps/OpenSankey/chakra/Theme'
import { opensankey_theme } from '../deps/OpenSankey/chakra/Theme'
import { modalAnatomy } from '@chakra-ui/anatomy'
import { selectAnatomy } from '@chakra-ui/anatomy'
import { tabsAnatomy } from '@chakra-ui/anatomy'
import { sliderAnatomy } from '@chakra-ui/anatomy'
import { tableAnatomy } from '@chakra-ui/anatomy'
import { stepperAnatomy } from '@chakra-ui/anatomy'

const select = createMultiStyleConfigHelpers(selectAnatomy.keys)
const slider = createMultiStyleConfigHelpers(sliderAnatomy.keys)
const modal = createMultiStyleConfigHelpers(modalAnatomy.keys)
const tabs = createMultiStyleConfigHelpers(tabsAnatomy.keys)
const table = createMultiStyleConfigHelpers(tableAnatomy.keys)
const stepper = createMultiStyleConfigHelpers(stepperAnatomy.keys)

export const title_filter_tagg=defineStyle({
  textAlign:'center',
  fontSize:'0.75rem',
  fontWeight:'bold'
})

export const baseStyleStepper = {
  // select the indicator part
}

export const sequenceStepper = stepper.definePartsStyle({
  stepper:{
    gap:'0.5rem'
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
  title:{
    fontSize:'0.8rem'
  }
})

// Default style of table because we need one for the theme
export const table_base_style = table.definePartsStyle({})
const minHeightTableRow1 = '1rem'
const basic_td1 = { paddingLeft: '0.2rem',paddingRight: '0.2rem', margin: 'auto', }
const basic_th1 = { paddingInlineStart: 'inherit', paddingInlineEnd: 'inherit', margin: 'auto', paddingBottom: '0', fontSize: 'unset' }
// Style of table to edit node/link/data group tags
export const table_view = table.definePartsStyle({
  td: basic_td1,
  th: basic_th1,
  tr: {
    minHeight: minHeightTableRow1,
    gridTemplateColumns: '2fr 1fr 1fr',
    display: 'grid',
  },
})

const minHeightTableRow = '1.75rem'
const basic_td = { padding: 0, margin: 'auto'}
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

export const tabs_data_source_for_unitary = tabs.definePartsStyle({
  root: {
    width: '100%'
  },
  list: {
    display: 'unset'
  }
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

export const view_select = select.definePartsStyle({
  field: {
    height: '1.25rem',
    border: 'solid 1px',
    borderRadius: '6px',
    borderColor: 'gray.50',
  }
})

export const modal_reconciliation = modal.definePartsStyle({
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
// Style for the drawer containing the configuration menu
export const drawer_sequence = defineStyle({
  dialog: {
    maxWidth: 'inherit'
  },
  dialogContainer: {
    width: 'inherit',
    zIndex: 1
  },
  body: {
    padding: '0'
  }
})
export const drawer_menu_filter = defineStyle({
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

export const toolbar_button_4 = defineStyle({
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
})

export const button_dataTagg_sequence_play = defineStyle({
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
})

export const button_dataTagg_sequence_pause = defineStyle({
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
})
export const toolbar_button_open_filter = defineStyle({
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
})
export const toolbar_button_open_view_banner = defineStyle({
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
})
export const button_dataTagg_sequence_menu_play = defineStyle({
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
})

export const button_dataTagg_sequence_menu_pause = defineStyle({
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
})

export const collapse_filter = defineStyle({
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
})

export const button_collapse_banner_view = defineStyle({
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

})

export const button_banner_view = defineStyle({
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
})

export const menutop_button_view_activated = defineStyle({
  ...menutop_button,
  svg: {
    ...menutop_button['svg'],
    color: 'primaire.2',
    stroke: 'primaire.2',
  }

})

export const menuconfigpanel_button_load_file_da_bg = defineStyle({
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
})

export const btn_create_unitary_from_nodes = defineStyle({
  height: '1.5rem',
  padding: '0.5rem',
  fontSize: 'unset',
  backgroundColor: 'primaire.2',
  color: 'white',
  _active: {
    backgroundColor: 'secondaire.2  '
  }
})


export const sizeBtnCollapseFilter = defineStyle({
  width: '1.25rem',
  height: '1.25rem',

})

export const opensankeyplus_theme = {
  components: {
    Button: {
      variants: {
        toolbar_button_4,
        button_dataTagg_sequence_play,
        button_dataTagg_sequence_pause,
        button_dataTagg_sequence_menu_play,
        button_dataTagg_sequence_menu_pause,
        toolbar_button_open_filter,
        toolbar_button_open_view_banner,
        collapse_filter,
        button_banner_view,
        button_collapse_banner_view,
        menutop_button_view_activated,
        menuconfigpanel_button_load_file_da_bg,
        btn_create_unitary_from_nodes,
      },
      sizes: {
        sizeBtnCollapseFilter
      }
    },
    Drawer: {
      variants: {
        drawer_sequence,
        drawer_menu_filter
      }
    },
    Modal: {
      variants: {
        modal_reconciliation,
      }
    },
    Heading: {
      variants: {
        title_filter_tagg
      }
    },
    Stepper: {
      baseStyle: baseStyleStepper,
      variants: {
        sequenceStepper
      }
    },
    Table: {
      variants: {
        table_view,
      }
    },
    Tabs: {
      variants: {
        tabs_data_source_for_unitary
      }
    },
    Select: {
      variants: {
        view_select
      }
    },
    Slider: {
      variants: {
        slider_filter_link_value
      }
    }
  },
  layerStyles: {
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
      fontSize: '0.6rem',

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
      fontSize: '9px',
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
  },
  textStyles: {
    filter_heading: {
      fontSize: '0.6rem',
      fontWeight: 'Bold',
    }
  }
}

// eslint-disable-next-line
const deep_assign = (s: Record<string, any>, t: Record<string, any>) => {
  Object.entries(s).forEach(k => {
    if (k[1] !== null && typeof (k[1]) == 'object') {
      if (Object.keys(t).includes(k[0])) {
        deep_assign(s[k[0]], t[k[0]])
      } else {
        t[k[0]] = s[k[0]]
      }
    } else {
      t[k[0]] = s[k[0]]
    }
  })
}

const Theme = {}
deep_assign(opensankey_theme, Theme)
deep_assign(opensankeyplus_theme, Theme)

export const ThemeOSP = extendTheme({ ...Theme })
