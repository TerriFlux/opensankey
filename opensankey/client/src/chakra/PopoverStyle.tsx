import { popoverAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
  createMultiStyleConfigHelpers(popoverAnatomy.keys)



// Define the base component styles
export const popover_base_style = definePartsStyle({
  header: {
    textStyle: 'h1',
    width:'100%',
    marginRight: '3rem'
  },
  body: {
    textStyle: 'h4',
    width:'100%',
    display: 'grid',
    gridRowGap: '0.5rem',
  },
  content:{
    width:'100%',
  },
  closeButton: {
    marginTop: '0.35rem',
    height: '1.5rem',
    width: '1.5rem',
    color: 'white',
    bg: 'primaire.1',
    bgColor: 'primaire.1'
  }
})

export const toolbar_popover_window = definePartsStyle({
})