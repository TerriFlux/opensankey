// // External libs
import React, { ChangeEvent, FunctionComponent, useRef, useState } from 'react'



// // Internal imports
import { DefaultLinkStyle } from './deps/OpenSankey/types/Legacy'
import {
  DefaultOSPStyleLinkFType,
  ImportImageAsSvgBgFType,
} from '../types/SankeyPlusUtilsTypes'
import { OSPLinkStyle } from '../types/Types'
import { Box, Checkbox, Button, Input } from '@chakra-ui/react'
import { FaFileImport } from 'react-icons/fa'
import { CustomFaEyeCheckIcon, OSTooltip } from './deps/OpenSankey/types/Utils'


export const DefaultOSPStyleLink: DefaultOSPStyleLinkFType = () => {
  const style = DefaultLinkStyle() as OSPLinkStyle
  style.gradient = false
  return style
}


export const ImportImageAsSvgBg: FunctionComponent<ImportImageAsSvgBgFType> = ({
  applicationData,
  has_open_sankey_plus,
}) => {
  const _load_image = useRef<HTMLInputElement>(null)
  const [, setCount] = useState(0)
  const { new_data } = applicationData
  const { drawing_area, t } = new_data
  const content_image = <>
    {/* Import image */}
    <Box
      as='span'
      layerStyle='menuconfigpanel_row_2cols'
    >
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={drawing_area.show_background_image}
        isDisabled={!has_open_sankey_plus}
        icon={<CustomFaEyeCheckIcon/>}
        onChange={(evt) => {
          drawing_area.show_background_image = evt.target.checked
          drawing_area.drawBgImage()
          setCount(a => a + 1)
        }}
      >
        {t('MEP.show_image')}
      </Checkbox>
      <OSTooltip label={!has_open_sankey_plus ? t('Menu.sankeyOSPDisabled') : ''} >
        <Box>
          <Button
            variant='menuconfigpanel_option_button'
            isDisabled={!drawing_area.show_background_image || !has_open_sankey_plus}
            onClick={() => {
              if (_load_image.current) {
                _load_image.current.name = ''
                _load_image.current.click()
              }
            }}
          >
            <FaFileImport />
          </Button>
          <Input
            ref={_load_image}
            style={{ display: 'none' }}
            accept='image/*'
            type="file"
            value={''}
            disabled={!has_open_sankey_plus}
            onChange={(evt: ChangeEvent) => {
              const files = (evt.target as HTMLFormElement).files
              const reader = new FileReader()
              reader.onload = (() => {
                return (e: ProgressEvent<FileReader>) => {
                  const resultat = (e.target as FileReader).result
                  const res = resultat?.toString().replaceAll('=', '')
                  drawing_area.background_image = (res as string)
                  drawing_area.drawBgImage()
                }
              })()
              reader.readAsDataURL(files[0])
            }}
          />
        </Box>
      </OSTooltip>
    </Box>
  </>
  return content_image
}
