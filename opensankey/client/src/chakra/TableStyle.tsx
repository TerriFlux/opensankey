import { tableAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'
const { definePartsStyle } = createMultiStyleConfigHelpers(tableAnatomy.keys)

const minHeightTableRow = '1.75rem'
const basic_td = { padding: 0, margin: 'auto' }
const basic_th = { paddingInlineStart: 'inherit', paddingInlineEnd: 'inherit', margin: 'auto', paddingBottom: '0', }

// Default style of table because we need one for the theme
export const table_base_style = definePartsStyle({})

// Style of table to edit node/link/data group tags
export const table_edit_grp_tag_node_link = definePartsStyle({
  td: basic_td,
  th: basic_th,
  tr: {
    minHeight: minHeightTableRow,
    gridTemplateColumns: '0.75fr 2fr 1.5fr',
    display: 'grid',
  },
})

// Style of table to edit node/link/data group tags
export const table_edit_grp_tag_data= definePartsStyle({
  td: basic_td,
  th: basic_th,
  tr: {
    minHeight: minHeightTableRow,
    gridTemplateColumns: '0.75fr 2fr 1.5fr 1.5fr',
    display: 'grid',
  },
})

// Style of table to edit node tags
export const table_edit_tag_node = definePartsStyle({
  td: basic_td,
  th: basic_th,
  tr: {
    minHeight: minHeightTableRow,
    gridTemplateColumns: '0.75fr 1.5fr 0.75fr 0.75fr 1.5fr',
    display: 'grid',
  },
})

// Style of table to edit link tags
export const table_edit_tag_link = definePartsStyle({
  td: basic_td,
  th: basic_th,
  tr: {
    minHeight: minHeightTableRow,
    gridTemplateColumns: '0.75fr 1.5fr 0.75fr 0.75fr',
    display: 'grid',
  },
})

// Style of table to edit data tags
export const table_edit_tag_data = definePartsStyle({
  td: basic_td,
  th: basic_th,
  tr: {
    minHeight: minHeightTableRow,
    gridTemplateColumns: '0.75fr 1.5fr 0.75fr',
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