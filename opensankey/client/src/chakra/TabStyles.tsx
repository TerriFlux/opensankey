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
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gridColumnGap: '0.25rem',
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
    '-webkit-user-select': 'none', /* Chrome all / Safari all */
    '-moz-user-select': 'none', /* Firefox all */
    '-ms-user-select': 'none', /* IE 10+ */
    'user-select': 'none',
  },
  tab: {
    border: 'solid 1px !important',
    borderRadius: '6px',
    borderColor: 'primaire.6',
    margin: '0 !important',
    padding: '0 !important',
    height: '2rem !important',
    backgroundColor: 'none',
    width: '6rem',

    _selected: {
      border: 'solid 1px !important',
      borderRadius: '6px',
      color: 'primaire.3',
      borderColor: 'primaire.6',
      backgroundColor: ' openSankey.200',

    }
  },
  tablist: {
    display: 'inherit',
    gridTemplateColumns: '1fr',
    gridTemplateRows: '1fr',
    gridRowGap: '0.25rem',
    border: '0 !important',
    margin: '0.5rem !important'
  },
  tabpanels: {
    borderTop: 'solid 1px !important',
    borderTopColor: 'gray.100 !important',

  },
  tabpanel: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gridTemplateRows: '0.5fr',
    gridRowGap: '0.25rem',
    gridColumnGap: '0.25rem',

    width: '60vw',
    height: '70vh',
    overflow: 'auto'
  }
  // tabpanel: {
  // },
})