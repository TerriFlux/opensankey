import { cardAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
  createMultiStyleConfigHelpers(cardAnatomy.keys)



export const cards_sankeytheque = definePartsStyle({
  container: {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'grey'
  }
})

export const cards_user = definePartsStyle({
  container: {
    border: '1px solid',
    borderColor: 'primaire.2',
  },
  body: {
    padding: '0.2rem',
    minW:'5rem',
    minH:'8rem',
    svg:{
      padding:'0.4rem'
    },
  },
  header: {
    fontSize: '1.2rem',
    padding: '0',
  },
  footer:{
    padding:'0'
  }
})
export const cards_user_import = definePartsStyle({
  ...cards_user,
  container: {
    ...cards_user.container,
    bg: 'primaire.2',
  },
  body:{
    ...cards_user.body,
    margin:'auto',
    svg:{
      display:'block',
      height:'2rem',
      width:'2rem',

    },
  }
})