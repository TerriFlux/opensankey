import { cardAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
  createMultiStyleConfigHelpers(cardAnatomy.keys)



// Define the base component styles
export const card_base_style = definePartsStyle({
  body: {
    margin: 'auto',
    svg: {
      margin: 'auto'
    }
  }
})

export const card_icon_selected = definePartsStyle({
  container: {
    borderWidth: '4px',
    borderColor: 'openSankey.50'
  }
})

export const card_icon_not_selected = definePartsStyle({
  container: {
    borderWidth: '1px',
    borderColor: 'grey'
  }
})

export const card_import_icon = definePartsStyle({
  container: {
    backgroundColor: 'teal',
    borderWidth: '1px',
    borderColor: 'grey'
  }
})

export const card_account = definePartsStyle({
  container: {
    marginTop: '6rem',
  },
  header: {
    bg: '#f2f2f2'
  },
  body: {
    width: '100%'
  },
})

export const card_register = definePartsStyle({
  container: {
    marginTop: '175px',
    borderWidth: '1px',
    minW: '40vw',
    borderColor: 'openSankey.50'
  },
  header: {
    textAlign: 'center',
    bg: 'openSankey.50',
    textStyle: 'h2',
  },
  body: {
    display: 'grid',
    gridRowGap: '10px',
  },
})