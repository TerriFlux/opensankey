import { formAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
  createMultiStyleConfigHelpers(formAnatomy.keys)



// Define the base component styles
export const form_base_style = definePartsStyle({
  container: {}
})

export const form_account_page = definePartsStyle({
  container: {
    minHeight: 'inherit',
    maxHeight: 'inherit',
    height: 'fit-content',
    display: 'grid',
    border: '2px solid',
    borderRadius: '6px',
    borderColor: 'primaire.2',
    backgroundColor: 'white',
    padding: '1rem',
    rowGap: '6px'
  }
})