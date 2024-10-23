import React, { FunctionComponent } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Image,
  SimpleGrid
} from '@chakra-ui/react'

import { Class_ApplicationDataSA } from '../../ApplicationData'
import { returnToApp } from '../../SankeyAppSA'
import { LoginOutButton } from '../Login/Login'


export type SankeyLabelTypes = {
  idLabel: string,
  title: string,
  content: string,
  opacity: number,
  color: string,
  color_border: string,
  transparent_border: boolean,

  label_width: number,
  label_height: number,

  x: number,
  y: number,

  is_image: boolean,
  image_src: string
}

export type DashboardTypes = {
  new_data_app: Class_ApplicationDataSA
  exemple_menu: object
}

// Dashboard, Register or Buy License
const Dashboard: FunctionComponent<DashboardTypes> = ({
  new_data_app,
}) => {
  // Initialise traduction function
  const { t, logo } = new_data_app

  // Define navigation behaviour to return to App
  const navigate = useNavigate()

  //If we acces this page without being logged, it is resent to the application
  if (!new_data_app.has_account) {
    returnToApp(navigate)
  }

  //If we are log the the following behaviors are defined
  //Go to myAccount
  const myAccount = () => {
    navigate('/account')
  }

  /* eslint-disable */
  // // @ts-ignore
  // const list_template = require.context('../../css/easy_template', true)
  // // @ts-ignore
  // const list_template_data = list_template.keys().filter(k => k.includes('.json')).map(image => list_template(image))
  // // @ts-ignore
  // const names = list_template.keys().filter(k => k.includes('.json'))
  // // @ts-ignore
  // const image_preview = require.context('../../css/image_preview', true)
  // // @ts-ignore
  // const imageList = image_preview.keys().map(image => {
  //   let img = image_preview(image)
  //   const path = window.location.href
  //   if (!path.includes('localhost')) {
  //     img = img.replace('static/', 'static/sankeyapp/')
  //   }
  //   return img
  // })
  /* eslint-enable */

  // List of example of sankey
  // Displayed in card
  const modalTemplate = <></>
  // <>
  //   {(list_template_data as SankeyData[]).map((_, idx) => {
  //     const title = names[idx].slice(2).split('.').splice(0, 1).join('')
  //     suite_convert_data(_, SuiteDefaultData)
  //     return (
  //       <Card variant='cards_template'>
  //         <CardBody>
  //           <Stack>
  //             <Heading variant='heading_template_dashboard'>{title.split('_').join(' ')}</Heading>
  //             <Image className='img-card' src={imageList[idx]} style={{ 'objectFit': 'contain', 'maxHeight': '150px' }} />
  //           </Stack>
  //         </CardBody>
  //         <Divider />
  //         <CardFooter>
  //           <ButtonGroup
  //             //ButtonGroup don't have variants theming so we modify directly the style
  //             style={{
  //               margin:'auto'
  //             }}>
  //             <Button
  //               variant='toolbar_button_2'
  //               onClick={() => {
  //                 navigate('/')
  //                 localStorage.setItem('data', LZString.compress(JSON.stringify(_)))
  //                 set_update(!update)
  //               }}>{t('useTemplate')}
  //             </Button>
  //             <Button
  //               variant='toolbar_button_3'
  //               onClick={() => {
  //                 ClickSaveExcel('/opensankey/', _)
  //               }}>{t('dl')}</Button>

  //           </ButtonGroup>
  //         </CardFooter>
  //       </Card>
  //     )
  //   })}
  // </>

  return (
    <div>
      {/* Top Navbar */}
      <Box
        zIndex="1"
        position="fixed"
        top="0"
        width="100%"
      >
        <Box
          layerStyle='menutop_layout_style'
          gridTemplateColumns='minmax(7vw, 150px) auto'
        >
          <Box
            margin='0.25rem'
            alignSelf='center'
            justifySelf='left'
          >
            <Image
              height='5rem'
              src={logo}
              alt='navigation logo'
              onClick={() => returnToApp(navigate)}
            />
          </Box>
          <Box
            display='grid'
            gridTemplateColumns='3fr 3fr 1fr'
            alignSelf='center'
            justifySelf='right'
          >
            <Button
              variant='btn_lone_navigation'
              onClick={() => returnToApp(navigate)}
            >
              {t('UserNav.to_app')}
            </Button>
            <Button
              variant='btn_lone_navigation'
              onClick={() => myAccount()}
            >
              {t('UserNav.to_acc')}
            </Button>
            <LoginOutButton
              new_data_app={new_data_app}
            />
          </Box>
        </Box>
      </Box>

      {/* Content of the page */}
      <Card variant='card_account' >
        <CardHeader>{t('UserPages.win_db_template')}</CardHeader>
        <CardBody>
          <SimpleGrid spacing={2} templateColumns='1fr 1fr 1fr'>
            {modalTemplate}
          </SimpleGrid>
        </CardBody>
      </Card>

    </div>
  )
}

export default Dashboard




