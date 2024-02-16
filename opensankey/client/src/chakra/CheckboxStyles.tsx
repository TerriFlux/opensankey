import { checkboxAnatomy } from '@chakra-ui/anatomy'
import {
  createMultiStyleConfigHelpers
} from '@chakra-ui/react'

const { definePartsStyle } = createMultiStyleConfigHelpers(checkboxAnatomy.keys)

export const checkbox_base_style = definePartsStyle({
  container: {
    h: '24px',
    px: '12px',
    w: '100%',
    borderRadius: '6px',
    border: 'solid 1px ' + '#C1E5DB',
    margin: '0',
    padding: '0',
    transition: 'all 150ms',
    _checked: {
      bg: '#C1E5DB'
    },
    _hover: {
      bg: '#C1E5DB',
      transition: 'all 250ms',
      _checked: {
        bg: '#C1E5DB'
      }
    },
  },
  control: {
    margin: '0.25rem',
    borderColor: '#25B48C',
    borderRadius: '2px',
    border: 'solid 2px ' + '#25B48C',
    width: '1rem',
    height: '1rem',
    _checked: {
      bg: '#25B48C',
      borderColor: '#25B48C'
    },
    _focus: {
      boxShadow: '0 0 0 2px #78C2AD',
      _checked: {
        boxShadow: '0 0 0 2px #78C2AD',
      }
    }
  },
  label: {
    width:'100%',
    margin: '0',
    textStyle: 'h4',
    fontSize: '12px',
  }
})

export const checkbox_title_style = definePartsStyle({
  label: {
    padding: '0 1.5rem 0 0',
    textStyle: 'h2',
    fontSize: '14px',
    textAlign: 'center'
  }
})
