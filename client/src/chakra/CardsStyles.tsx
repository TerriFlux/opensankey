import { cardAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
  createMultiStyleConfigHelpers(cardAnatomy.keys)



export const cards_sankeytheque = definePartsStyle({
  container: {
    borderWidth: '1px',
    borderStyle:'solid',
    borderColor: 'grey'
  }
})