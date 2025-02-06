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
    borderColor: 'primaire.5'
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
    textAlign: 'center',
    bg: 'primaire.5',
    color: 'white',
    textStyle: 'h2',
  },
  body: {
    width: '100%'
  },
})

export const card_register = definePartsStyle({
  container: {
    marginTop: '175px',
    borderWidth: '1px',
    borderStyle:'solid',
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
})

export const cards_template = definePartsStyle({
  container: {
    borderWidth: '1px',
    borderStyle:'solid',
    borderColor: 'grey'
  },
  header: {
    textStyle: 'h3',
  },
})

export const cards_empty_template = definePartsStyle({
  container: {
    borderWidth: '1px',
    borderStyle:'solid',
    borderColor: 'grey'
  }
})