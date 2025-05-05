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

import { tableAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'
const { definePartsStyle } = createMultiStyleConfigHelpers(tableAnatomy.keys)

const minHeightTableRow = '1rem'
const basic_td = { padding: 0, margin: 'auto' }
const basic_th = { paddingInlineStart: 'inherit', paddingInlineEnd: 'inherit', margin: 'auto', paddingBottom: '0', fontSize: 'unset' }
const default_table = {
  td: basic_td,
  th: basic_th,
  table: {
    display: 'grid',
    gridRowGap: '0.2rem',
    width: 'unset',
  },
  tbody: {
    display: 'grid',
    gridRowGap: '0.2rem'
  },
}
// Default style of table because we need one for the theme
export const table_base_style = definePartsStyle({

})

// Style of table to edit node/link/data group tags
export const table_edit_grp_tag_node_link = definePartsStyle({
  ...default_table,
  tr: {
    minHeight: minHeightTableRow,
    gridTemplateColumns: '0.5fr 2fr 1.5fr',
    display: 'grid',
  },
})

// Style of table to edit node/link/data group tags
export const table_edit_grp_tag_data = definePartsStyle({
  ...default_table,
  tr: {
    minHeight: minHeightTableRow,
    gridTemplateColumns: '0.5fr 2fr 1.5fr',
    display: 'grid',
  },
})

// Style of table to edit node tags
export const table_edit_tag_node = definePartsStyle({
  ...default_table,
  tr: {
    minHeight: minHeightTableRow,
    gridTemplateColumns: '0.5fr 2fr 0.75fr 0.5fr 1.5fr',
    display: 'grid',
  },
})

// Style of table to edit link tags
export const table_edit_tag_link = definePartsStyle({
  ...default_table,
  tr: {
    minHeight: minHeightTableRow,
    gridTemplateColumns: '0.5fr 2fr 0.5fr 0.75fr',
    display: 'grid',
  },
})

// Style of table to edit data tags
export const table_edit_tag_data = definePartsStyle({
  ...default_table,
  tr: {
    minHeight: minHeightTableRow,
    gridTemplateColumns: '0.5fr 1.5fr 0.75fr',
    display: 'grid',
  },
})

// Style of table to edit node link io
export const table_edit_node_io = definePartsStyle({
  ...default_table,
  tr: {
    minHeight: minHeightTableRow,
    gridTemplateColumns: '2fr 2fr',
    display: 'grid',
  },
})

export const table_welcome_buttons = definePartsStyle({
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
  td: {
  },
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
})