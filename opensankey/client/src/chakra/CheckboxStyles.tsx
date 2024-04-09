import { checkboxAnatomy } from '@chakra-ui/anatomy'
import {
  createMultiStyleConfigHelpers
} from '@chakra-ui/react'

const { definePartsStyle } = createMultiStyleConfigHelpers(checkboxAnatomy.keys)

export const checkbox_base_style = definePartsStyle({
  container: {
    h: '2rem',
    w: '100%',
    border: 'solid 1px ',
    borderRadius: '6px',
    borderColor: 'grey.50',
    margin: '0',
    padding: '0',
    transition: 'all 150ms',
    _checked: {
      bg: 'white'
    },
    _hover: {
      bg: 'openSankey.50',
      transition: 'all 250ms',
    },
  },
  control: {
    margin: '0.25rem',
    width: '1rem',
    height: '1rem',
    bg: 'gray.400',
    borderColor: 'gray.400',
    iconColor: 'white',
    border: 'solid 1px ',
    borderRadius: '2px',
    _checked: {
      bg: 'openSankey.300',
      borderColor: 'openSankey.300',
      iconColor: 'openSankey.400',
      _hover: {
        bg: 'gray.400',
        borderColor: 'gray.400',
        iconColor: 'white',
      }
    },
    _hover: {
      bg: 'openSankey.300',
      borderColor: 'openSankey.300',
      iconColor: 'openSankey.400',
    }
  },
  label: {
    width:'100%',
    margin: '0',
    fontSize: '12px',
    textStyle: 'h4',
  }
})

export const menuconfigpanel_option_checkbox = definePartsStyle({
  container: {
    border: '0px',
    borderRadius: '6px',
    borderColor: 'white',
  },
  label: {
    fontSize: '12px'
  }
})

export const menuconfigpanel_tag_checkbox = definePartsStyle({
  container: {
    border: '0px',
    borderRadius: '6px',
    borderColor: 'white',
  },
  label: {
    marginLeft: '0.5rem',
    fontSize: '14px'
  },
  control: {
    marginLeft: '1.25rem',
  }
})

export const menuconfigpanel_part_title_1_checkbox = definePartsStyle({
  label: {
    padding: '0 1.5rem 0 0',
    textStyle: 'h2',
    fontSize: '14px',
    textAlign: 'center'
  }
})
