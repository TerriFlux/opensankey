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

import { tabsAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
  createMultiStyleConfigHelpers(tabsAnatomy.keys)

// Define the base component styles
export const tabs_base_style = definePartsStyle({
  root: {
    border: 'solid 1px !important',
    borderRadius: '6px',
    borderColor: 'primaire.5 !important',
  },
  tab: {
    border: 'none',
    borderBottom: 'solid 1px !important',
    borderRadius: '0px',
    borderColor: 'none',
    margin: '0 !important',
    padding: '0 !important',
    height: '2rem !important',
    _selected: {
      border: 'none',
      borderBottom: 'solid 2px !important',
      borderBottomColor: 'primaire.5',
      borderRadius: '0px',
      borderColor: 'none',
      color: 'primaire.5',
    }
  },
  tablist: {
    border: '0 !important',
    margin: '0.5rem !important'
  },
  tabpanels: {
    padding: '0px'
  },
  tabpanel: {
    padding: '0.5rem'
  },
})

export const tabs_navbar = definePartsStyle({
  root: {
    border: 'none',
    borderRadius: 'none',
    borderColor: 'none',
    borderLeft: 'solid 1px',
    borderLeftColor: 'secondaire.2',
    borderRight: 'solid 1px',
    borderRightColor: 'secondaire.2',
    fontSize: '1rem',
    textStyle: 'h1',
  },
  tab: {
    minWidth: '7rem',
    borderBottom: 'none',
    margin: '0rem 0rem 0rem 0.25rem !important',
    padding: '0rem !important',
    height: '2rem !important',
    justifySelf: 'start',
    alignSelf: 'center',
    _selected: {
      border: 'none',
      borderBottom: 'solid 2px !important',
      borderBottomColor: 'primaire.2',
      borderRadius: '0px',
      borderColor: 'none',
      color: 'primaire.2',
    }
  },
  tablist: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, minmax(8.5rem, 12rem))',
    gridColumnGap: '1px',
    border: '0 !important',
    margin: '0 !important',
    padding: '0 !important',
  },
  tabpanels: {
    margin: '0 !important',
    padding: '0 !important',
    border: 'none',
    borderRadius: '0px',
    borderColor: 'none',
  },
  tabpanel: {
    display: 'inline-grid',
    gridTemplateColumns: 'auto',
    gridAutoFlow: 'column',
    gridColumnGap: '0.25rem',
  }
})

export const tabs_variant_lib_cion = definePartsStyle({
  root: {
    border: 'inherit',
    borderRadius: '6px',
    borderColor: 'inherit',
  },
  tab: {
    border: 'solid 0px !important',
    borderRadius: '6px',
    borderColor: 'none',
    margin: '0 !important',
    padding: '0 !important',
    height: '2rem !important',
    backgroundColor: ' primaire.5',

    _selected: {
      border: 'solid 1px !important',
      borderRadius: '6px',
      color: 'primaire.5',
      borderColor: 'none',
      backgroundColor: ' openSankey.200',

    }
  },
  tablist: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr ',
    gridColumnGap: '0.25rem',
    border: '0 !important',
    margin: '0.5rem !important'
  },
  tabpanels: {
    borderTop: 'solid 1px !important',
    borderTopColor: 'gray.100 !important',
  },
  // tabpanel: {
  // },
})

export const tabs_variant_template = definePartsStyle({
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
})
