import { defineStyle } from '@chakra-ui/react'


export const close_button_base_style = defineStyle({
  width: '1.5rem',
  height: '1.5rem',
  margin: '0',
  border: 'solid 1px ',
  borderRadius: '6px',
  color: 'white',
  borderColor: 'primaire.1',
  bg: 'primaire.1',
  bgColor: 'primaire.1',
  _hover: {
    borderColor: 'secondaire.1',
    bg: 'secondaire.1',
    bgColor: 'secondaire.1',
  },
  _disabled: {
    borderColor: 'gray.300',
    bg: 'gray.300',
    bgColor: 'gray.300',
  }
})