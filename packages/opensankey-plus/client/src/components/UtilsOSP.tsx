// External libs
import React, {
  ChangeEvent,
  FunctionComponent,
  useRef,
  useState
} from 'react'

import {
  Box,
  Checkbox,
  Button,
  Input,
  Stepper,
  useSteps,
  Step,
  StepIndicator,
  StepSeparator,
  StepStatus,
  StepTitle,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  ButtonGroup,
  MenuDivider
} from '@chakra-ui/react'


// OpenSankey imports
import { Class_DataTagGroup } from '../deps/OpenSankey/types/Tag'
import {
  CustomFaEyeCheckIcon,
  getBooleanFromJSON,
  getJSONOrUndefinedFromJSON,
  getNumberOrUndefinedFromJSON,
  getStringFromJSON,
  OSTooltip,
  Type_JSON
} from '../deps/OpenSankey/types/Utils'

import { ConfigMenuNumberInput } from '../deps/OpenSankey/components/configmenus/SankeyMenuConfiguration'

// Internal imports
import {
  FCType_ImportImageAsSvgBg,
} from '../ftypes/SankeyPlusUtilsTypes'
import { default_container_content } from '../types/FreeLabel'
import { OSPData, ViewType } from '../types/LegacyTypes'
import { Type_GenericApplicationDataOSP } from '../types/TypesOSP'


import { GetOldDataFromView } from './ConvertOSP'

export const ImportImageAsSvgBg: FunctionComponent<FCType_ImportImageAsSvgBg> = ({
  new_data_plus,
}) => {
  const _load_image = useRef<HTMLInputElement>(null)
  const [, setCount] = useState(0)
  new_data_plus.menu_configuration.ref_to_config_DA_bg_image_updater.current = () => setCount(a => a + 1)

  const { drawing_area, t, has_sankey_plus, icon_library } = new_data_plus
  const { icon_import_file_image } = icon_library
  const content_image = <>
    {/* Import image */}
    <Box
      as='span'
      layerStyle='menuconfigpanel_row_2cols'
    >
      <Checkbox
        variant='menuconfigpanel_option_checkbox'
        isChecked={drawing_area.show_background_image}
        isDisabled={!has_sankey_plus}
        icon={<CustomFaEyeCheckIcon />}
        onChange={(evt) => {
          drawing_area.show_background_image = evt.target.checked
          drawing_area.drawBgImage()
          setCount(a => a + 1)
        }}
      >
        {t('MEP.show_image')}
      </Checkbox>
      <OSTooltip label={!has_sankey_plus ? t('Menu.sankeyOSPDisabled') : ''} >
        <Box>
          <Button
            variant='menuconfigpanel_button_load_file_da_bg'
            isDisabled={!drawing_area.show_background_image || !has_sankey_plus}
            onClick={() => {
              if (_load_image.current) {
                _load_image.current.name = ''
                _load_image.current.click()
              }
            }}
          >
            {icon_import_file_image}
          </Button>
          <Input
            ref={_load_image}
            style={{ display: 'none' }}
            accept='image/*'
            type="file"
            value={''}
            disabled={!has_sankey_plus}
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



export const convert_data_plus_legacy = (json_object: Type_JSON) => {
  const containers = getJSONOrUndefinedFromJSON(json_object, 'labels')
  if (containers) {
    // Convert name of variable from legacy Free label to variable name of new Free labels
    Object.values(containers).forEach(el => {
      const cont = el as Type_JSON

      if (cont.name !== undefined) {
        cont.content = cont.name as string
        if (!cont.content.includes('<p')) {
          if (cont.font_uppercase && !cont.content.includes('ql-align-center')) {
            cont.content = cont.content.toUpperCase()
          }

          if (cont.font_weight) {
            cont.content = cont.content ? '<strong>' + cont.content + '</strong>' : ''
          }
          if (cont.position_horiz === 'gauche') {
            cont.content = cont.content ? '<p class="ql-align-left">' + cont.content + '</p>' : ''
          }
          if (cont.position_horiz === 'centre') {
            cont.content = cont.content ? '<p class="ql-align-center">' + cont.content + '</p>' : ''
          }
          if (cont.position_horiz === 'droite') {
            cont.content = cont.content ? '<p class="ql-align-right">' + cont.content + '</p>' : ''
          }
        }
      }

      const container_content = getStringFromJSON(cont, 'content', default_container_content)
      const container_opacity = getBooleanFromJSON(cont, 'transparent', false)
      const container_opacity_int = getNumberOrUndefinedFromJSON(cont, 'opacity')
      if (container_opacity_int !== undefined) {
        cont['opacity'] = container_opacity_int
      } else if (container_opacity) {
        cont['opacity'] = 0
      } else {
        cont['opacity'] = 100
      }
      cont['content'] = container_content

    })
  }


  const old_views = getOldViewsFromJSON(json_object, 'view') as ViewType[]
  if (old_views && old_views.length > 0) {
    json_object.views = {} as Type_JSON
    // Convert old views
    old_views.forEach((v) => {
      if (v.heredited_attr_from_master === undefined) {
        v.heredited_attr_from_master = []
      }
      // Convert old views that are diff to json
      const d_view = GetOldDataFromView(json_object as unknown as OSPData, v.id)
      if (d_view) {
        (json_object.views as Type_JSON)[v.id] = d_view as unknown as Type_JSON
      }

      // Set Name of view
      ((json_object.views as Type_JSON)[v.id] as Type_JSON).name = v.nom;
      // Set heredited from master attr
      ((json_object.views as Type_JSON)[v.id] as Type_JSON).heredited_attr = v.heredited_attr_from_master
    })
  }
}

export function getArrayFromJSON(
  json_object: Type_JSON,
  key: string,
  fallback_value: Array<ViewType>
) {
  if (json_object[key] && typeof json_object[key] === typeof fallback_value) {
    return json_object[key]
  }
  return fallback_value
}


export function getOldViewsFromJSON(
  json_object: Type_JSON,
  key: string
) {
  if (json_object[key]) {
    const _ = getArrayFromJSON(json_object, key, [])
    if (Object.keys(_).length > 0)
      return _
  }
  return undefined
}

type FCType_DrawerSequenceDataTagg = { new_data: Type_GenericApplicationDataOSP }

export const DrawerSequenceDataTagg: FunctionComponent<FCType_DrawerSequenceDataTagg> = ({ new_data }) => {
  const { icon_library } = new_data
  const { icon_repeat_sequence, icon_play, icon_pause, icon_activated, icon_open_selector } = icon_library
  const [, setUpdate] = useState(0)
  new_data.menu_configuration.ref_to_drawer_sequence_data_tag_updater.current = () => setUpdate(a => a + 1)
  const [active_grp, setActiveGrp] = useState('')

  const list_grp_seq = new_data.drawing_area.sankey.getTagGroupsAsList('data_taggs').filter(grp => (grp as Class_DataTagGroup).is_sequence)
  const dict_data_grp = new_data.drawing_area.sankey.getTagGroupsAsDict('data_taggs')
  const list_grp_seq_id = list_grp_seq.map(grp => grp.id)
  const has_sequence = list_grp_seq.length > 0

  if (has_sequence && !list_grp_seq_id.includes(active_grp)) {
    setActiveGrp(list_grp_seq_id[0])
  }
  const ref_set_number_input = useRef((_: string | null | undefined) => null)
  ref_set_number_input.current(String(new_data.menu_configuration.timeout_sequence))

  // Create stepper of active groupe
  const stepper_sequence: JSX.Element = <StepperDataTagg new_data={new_data} DataGroup={dict_data_grp[active_grp] as Class_DataTagGroup} />

  // Logo of the button to start/pause the sequence
  const logo_btn = !new_data.menu_configuration.is_playing_sequence ? icon_play : icon_pause
  const setter_timeout = <Box layerStyle='config_timeout_sequence' >
    <Box layerStyle='menuconfigpanel_option_name'>
      {new_data.t('Tags.sequence_timeout')}
    </Box>

    <ConfigMenuNumberInput
      t={new_data.t}
      default_value={new_data.menu_configuration.timeout_sequence}
      ref_to_set_value={ref_set_number_input}
      minimum_value={1}
      function_on_blur={(value) => {
        if (value) {
          if (value > 0) {
            new_data.menu_configuration.timeout_sequence = value
          }
        }
      }}
      unit_text='ms'
    />
  </Box>

  // If multiple dataTagg are a sequence we can add a Menu to choose which one we want to launch
  const select_active_grp = list_grp_seq.length > 1 ? <>
    {list_grp_seq.map(el => {
      return <MenuItem
        onClick={() => setActiveGrp(el.id)}
        icon={active_grp === el.id ? icon_activated : <></>}
        style={{ display: 'block' }}
      >
        {el.name}
      </MenuItem>
    })}
    <MenuDivider />
  </> : <></>

  // Menu with option like selective active sequence & timeout between steps
  const option_btn = <Menu>
    <MenuButton
      as={Button}
      isDisabled={new_data.menu_configuration.is_playing_sequence}
      variant={new_data.menu_configuration.is_playing_sequence ? 'button_dataTagg_sequence_menu_play' : 'button_dataTagg_sequence_menu_pause'}
    >
      {icon_open_selector}
    </MenuButton>
    <MenuList>
      {select_active_grp}
      {setter_timeout}
    </MenuList>
  </Menu>

  return has_sequence ? (
    <Box
      layerStyle='box_sequence'
    >
      <ButtonGroup isAttached>
        <Button
          variant={new_data.menu_configuration.is_playing_sequence ? 'button_dataTagg_sequence_play' : 'button_dataTagg_sequence_pause'}
          onClick={() => {
            // Either launch or stop data sequence
            if (new_data.menu_configuration.is_playing_sequence) {
              // Stop sequence
              new_data.menu_configuration.is_playing_sequence = false
            } else {
              // Start sequence
              new_data.menu_configuration.is_playing_sequence = true
              const curr_active_grp = new_data.drawing_area.sankey.getTagGroupsAsDict('data_taggs')[active_grp] as Class_DataTagGroup
              new_data.menu_configuration.launchDataSequence(curr_active_grp)
            }
            setUpdate(a => a + 1)
          }}
        >
          {logo_btn}
        </Button>
        <Button
          variant={new_data.menu_configuration.is_sequence_loop ? 'button_dataTagg_sequence_play' : 'button_dataTagg_sequence_pause'}
          onClick={() => {
            // Switch 'is sequence loop' value
            new_data.menu_configuration.is_sequence_loop = !new_data.menu_configuration.is_sequence_loop
            setUpdate(a => a + 1)
          }}>
          {icon_repeat_sequence}
        </Button>
        {option_btn}
      </ButtonGroup>
      {stepper_sequence}
    </Box>
  ) : <></>
}
type FCType_StepperDataTagg = { new_data: Type_GenericApplicationDataOSP, DataGroup: Class_DataTagGroup }

// Compoenent returing a stepper of a dataTagg where each step is a tag of the group with visual indication to which tag is selected
const StepperDataTagg: FunctionComponent<FCType_StepperDataTagg> = ({ new_data, DataGroup }) => {
  const stepper_sequence = DataGroup.tags_list.map((tag, idx) => { return { id_tag: tag.id, title: tag.name, selected: tag.is_selected, id: idx } })
  const selected_id = stepper_sequence.find(el => el.selected)?.id ?? -1
  const { activeStep, setActiveStep } = useSteps({
    index: selected_id,
    count: stepper_sequence.length,
  })

  if (activeStep !== -1 && activeStep !== selected_id) {
    setActiveStep(selected_id)
  }
  // Fucntion used when we click on a step to manually switch to clicked tag
  const switchCurrTag = (idx: number) => {
    DataGroup.selectTagsFromId(stepper_sequence[idx].id_tag)
    new_data.drawing_area.checkAndUpdateAreaSize()
    new_data.menu_configuration.updateAllComponentsRelatedToDataTags()
  }

  return <Box layerStyle='box_stepper'>
    {/* First stepper that have progression bar of the sequence with steps */}
    <Stepper index={activeStep} size={'sm'} variant='sequenceStepper'>
      {stepper_sequence.map((step, index) => (
        <Step key={index} onClick={() => switchCurrTag(index)}>
          <>
            <Box width='100%'>
              <Box display='flex' alignItems='center'>
                <StepIndicator
                  sx={{
                    '[data-status=complete] &': {
                      background: 'white',
                      borderWidth: '2px',
                      borderColor: 'secondaire.3',
                    },
                    '[data-status=active] &': {
                      background: 'primaire.3',
                      borderColor: 'secondaire.3',
                    },
                    '[data-status=incomplete] &': {
                      background: 'white',
                      borderColor: 'secondaire.3',
                    },
                  }}
                >
                  <StepStatus />

                </StepIndicator>

                <StepSeparator
                  sx={{
                    '[data-status=complete] &': {
                      background: 'lightgrey',
                    },
                    '[data-status=active] &': {
                      background: 'lightgrey',
                    },
                    '[data-status=incomplete] &': {
                      background: 'lightgrey',
                    },
                  }} />
              </Box>

            </Box>
          </>
        </Step>
      ))}
    </Stepper>

    {/* Second stepper just to have text well aligned with indicator */}
    <Stepper index={activeStep} size={'sm'} variant='sequenceStepper'>
      {stepper_sequence.map((step, index) => (
        <Step key={index} onClick={() => switchCurrTag(index)}>
          <>
            <Box width='100%'>
              <Box display='flex' alignItems='center'>

                <StepTitle >{step.title}</StepTitle>
              </Box>

            </Box>
          </>

        </Step>

      ))}
    </Stepper>
  </Box>
}