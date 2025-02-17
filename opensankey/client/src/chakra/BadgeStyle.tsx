import { defineStyle } from '@chakra-ui/react'


export const badge_base_style = defineStyle({
  display: 'inline',
  padding: '0',
  height: '0.75rem',
  width: '1.75rem',
  color: 'white',
  bgColor: 'primaire.3',
  bb: 'primaire.3',
  border: '0px',
  borderRadius: '3px',
  fontSize: '0.5rem'
})

export const badge_on_template_img = defineStyle({
  display: 'inline-grid',
  justifyContent: 'center',
  alignContent: 'center',
  position: 'absolute',
  width: 'fit-content',
  height: 'fit-content',
  margin: '0.5rem',
  padding: '0.5rem',
  textStyle: 'h3',
  bgColor: 'primaire.2',
  bb: 'primaire.2',
})