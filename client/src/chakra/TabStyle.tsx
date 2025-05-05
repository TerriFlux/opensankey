
import { tabsAnatomy } from '@chakra-ui/anatomy'
import { createMultiStyleConfigHelpers } from '@chakra-ui/react'

const { definePartsStyle } =
    createMultiStyleConfigHelpers(tabsAnatomy.keys)


export const tabs_variant_preference = definePartsStyle({
  root: {
    width: '35vw',
    border: 'inherit',
    borderRadius: '6px',
    borderColor: 'inherit',
    WebkitUserSelect: 'none', /* Chrome all / Safari all */
    MozUserSelect: 'none', /* Firefox all */
    msUserSelect: 'none', /* IE 10+ */
    userSelect: 'none',
  },
  tab: {
    height: '2rem !important',
    background: 'white',
    border: '1px solid',
    borderRadius: '6px',
    color: 'primaire.2',
    fill: 'primaire.2',
    path: 'primaire.2',
    width: '10rem',
    textStyle: 'h3',
    _selected: {
      borderRadius: '6px',
      color: 'white',
      fill: 'white',
      path: 'white',
      background: 'primaire.2',
    }
  },
  tablist: {
    display: 'flex',
    borderColor: 'primaire.2 !important',
  },
  tabpanels: {
  },
  tabpanel: {
    display: 'block',
    maxH:window.innerHeight*0.6,
    overflowY:'auto',
    width: '100%',
  }

})


export const tabs_variant_preference_tags = definePartsStyle({
  root: {
    border: 'inherit',
    borderRadius: '6px',
    borderColor: 'inherit',
    WebkitUserSelect: 'none', /* Chrome all / Safari all */
    MozUserSelect: 'none', /* Firefox all */
    msUserSelect: 'none', /* IE 10+ */
    userSelect: 'none',
  },
  tab: {
    alignSelf: 'center',
    justifySelf: 'center',
    textAlign: 'center',
    bg: 'white',
    bgColor: 'white',
    border: '1px solid',
    borderColor: 'primaire.3',
    borderRadius: '6px',
    minW: 'unset',
    height: '2rem',
    width: 'unset',
    padding: '0.2rem',
    paddingLeft: '0.2rem',
    paddingTop: '0.2rem',
    paddingBottom: '0.2rem',
    paddingRight: '0.2rem',
    _selected: {
      borderRadius: '6px',
      color: 'white',
      fill: 'white',
      path: 'white',
      background: 'primaire.3',
      span:{
        color:'white'
      }

    },

    //Text button
    fontSize: '0.8rem',
    span: {
      whiteSpace: 'pre-wrap',
      color: 'primaire.3',
    },
    _hover: {
      bg: 'tertiaire.3',
      bgColor: 'tertiaire.3',
      borderColor: 'tertiaire.3',
    },

  },
  tablist: {
    display: 'flex',
    margin:'0',
    borderColor: 'primaire.3 !important',
  },
  tabpanels: {
    border: 'none',
  },
  tabpanel: {
    display: 'block',
    height: '100%',
    width: '100%',
  }

})

export const tabs_variant_preference_style = definePartsStyle({
  ...tabs_variant_preference_tags,
  tab:{
    ...tabs_variant_preference_tags.tab,
    height:'2rem'
  },
})