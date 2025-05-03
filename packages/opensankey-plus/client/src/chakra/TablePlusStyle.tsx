import { tableAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'
const { definePartsStyle } = createMultiStyleConfigHelpers(tableAnatomy.keys)

const minHeightTableRow = '1.75rem'
const basic_td = { padding: 0, margin: 'auto'}
const basic_th = { paddingInlineStart: 'inherit', paddingInlineEnd: 'inherit', margin: 'auto', paddingBottom: '0', }


// Style of table to edit node tags
export const table_edit_tag_level = definePartsStyle({
    td: basic_td,
    th: basic_th,
    tr: {
      minHeight: minHeightTableRow,
      gridTemplateColumns: '0.75fr 4.5fr',
      display: 'grid',
    },
  })

// Style of table to edit node/link/data group tags
export const table_edit_grp_tag_level = definePartsStyle({
    td: basic_td,
    th: basic_th,
    tr: {
      minHeight: minHeightTableRow,
      gridTemplateColumns: '0.75fr 1.5fr 2fr',
      display: 'grid',
    },
  })