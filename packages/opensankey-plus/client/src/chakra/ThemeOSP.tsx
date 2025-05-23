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

import { opensankey_theme } from '../deps/OpenSankey/chakra/Theme'

import {
  btn_create_unitary_from_nodes,
  button_banner_view,
  button_collapse_banner_view,
  button_dataTagg_sequence_menu_pause,
  button_dataTagg_sequence_menu_play,
  button_dataTagg_sequence_pause,
  button_dataTagg_sequence_play,
  collapse_filter,
  menuconfigpanel_button_load_file_da_bg,
  menutop_button_view_activated,
  sizeBtnCollapseFilter,
  toolbar_button_4,
  toolbar_button_open_filter,
  toolbar_button_open_view_banner
} from './ButtonOSP'
import {
  drawer_menu_filter,
  drawer_sequence
} from './DrawerOSP'
import {
  baseStyleStepper,
  sequenceStepper
} from './StepperOSP'
import { slider_filter_link_value } from './SliderOSP'
import { title_filter_tagg } from './HeadingOSP'
import { view_select } from './SelectOSP'
import { table_view } from './TableOSP'
import { tabs_data_source_for_unitary } from './TabsStyle'
import {modal_reconciliation} from './ModalStyleOSP'

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
      sizes:{
        sizeBtnCollapseFilter
      }
    },
    Drawer: {
      variants: {
        drawer_sequence,
        drawer_menu_filter
      }
    },
    Modal:{
      variants:{
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
    Tabs:{
      variants:{
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

      '.content_filter':{
        display:'grid',
        paddingTop:'0.2rem',
        gridRowGap:'0.2rem',
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
    selector_node_flow_tag:{
      // Styling box containing multi select
      height: '1.5rem',
      
      // Styling of react component multi select
      '.rmsc .dropdown-container': {
        height: '1.5rem !important'
      },
      '.rmsc':{
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
