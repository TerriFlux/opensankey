import { breadcrumbAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
  createMultiStyleConfigHelpers(breadcrumbAnatomy.keys)



// Define the base component styles
export const breadcrumb_base_style = definePartsStyle({
})

export const pagination_welcome = definePartsStyle({
  container: {
    display: 'flex',
    alignItems: 'center',
    borderRight: '2px solid',
    borderColor: 'primaire.2',
    width: '100%',
  },
  item:{
    textStyle: 'h2',
    height: 'minmax(3rem, 10vh)',
    span:{
      color:'primaire.2'
    }
  },
  link: {
    _hover: {
      color: 'secondaire.2'
    }
  },
  separator: {
  },
})