import { tabsAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
  createMultiStyleConfigHelpers(tabsAnatomy.keys)

// Define the base component styles
export const tabs_base_style = definePartsStyle({
  root: {
    border: 'solid 1px !important',
    borderRadius: '6px',
    borderColor: 'openSankey.50 !important',
  },
  tab: {
    border: 'solid 0px !important',
    borderRadius: '6px',
    borderColor: 'none',
    margin: '0 !important',
    padding: '0 !important',
    height: '2rem !important',
    _selected: {
      border: 'solid 1px !important',
      borderRadius: '6px',
      color: 'openSankey.50',
      borderColor: 'none'
    }
  },
  tablist: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
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
