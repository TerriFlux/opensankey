import React, { useState, useRef } from 'react'
import { 
  Box, Button, ButtonGroup,MenuItem,MenuDivider,MenuButton,Menu,MenuList,
  useSteps,Stepper,Step,StepIndicator,StepStatus,StepSeparator,StepTitle 
} from '@chakra-ui/react'
import { OSTooltip } from '../configmenus/MenuCommon'
import { Class_ApplicationData } from '../../types/ApplicationData'
import { Class_DataTagGroup } from '../../types/TagGroup'
import { ConfigMenuNumberInput } from '../configmenus/SankeyMenuConfiguration'

/**
 * Bottom toolbar for some simple functionnality on the DA (Draw flow, recenter DA,...)
 *
 * @param {*} {
 *   new_data,
 * }
 * @return {*}
 */
export const ToolBarBottom = ({new_data}:{new_data:Class_ApplicationData}) => {
  const { t } = new_data

  // Local State to update this & subcomponent
  const [, setUpdater] = useState(0)
  const refreshThis = () => setUpdater(a => a + 1)
  new_data.menu_configuration.ref_to_toolbar_bottom_updater.current = refreshThis

  let btn_mouse_mode_edition = <></>
  if (!new_data.is_static) {
    btn_mouse_mode_edition = <ComponentMouseMode app_data={new_data} updateParentComponent={refreshThis} />
  }

  // Get height of bottom menu to correctly place the toolbar above
  const sizeBottomMenu = document.getElementsByClassName('BottomMenu')[0]?.getBoundingClientRect().height ?? 0
  return <Box
    layerStyle={'toolbar_bottom'}
    bottom={'calc(' + String(sizeBottomMenu + (new_data.drawing_area.fit_margin / 2)) + 'px + 1rem)'}
  >
    {btn_mouse_mode_edition}
    {!new_data.is_static ?<ComponentUndoRedo
      app_data={new_data}
      updateParentComponent={refreshThis}
    />:<></>}
    <ComponetStretchButtons
      app_data={new_data}
      updateParentComponent={refreshThis}
    />
    <OSTooltip
      placement='top'
      label={t('Banner.tooltipHelp')}
      isAlwaysOpen={!new_data.is_static && new_data.menu_configuration.show_splashscreen}
    >
      <Button
        variant='info'
        size='sizeToolbarButton'
        onClick={() => new_data.menu_configuration.dict_setter_show_dialog.ref_setter_show_modal_welcome.current!(true)}
      >
        ?
      </Button>
    </OSTooltip>
  </Box>
}

const ComponentMouseMode = (
  { app_data, updateParentComponent }:{app_data:Class_ApplicationData,updateParentComponent: () => void}) => {
  const { t,menu_configuration,drawing_area,icon_library } = app_data

  { /* Boutons permettant soit de passer la souris en mode sélection soit en mode création noeud/flux */ }
  return <OSTooltip
    placement='top'
    label={t('Banner.tooltipLiason')}
    isAlwaysOpen={menu_configuration.show_splashscreen}
  >
    <ButtonGroup isAttached>
      <Button
        variant={drawing_area.isInEditionMode() ? 'toolbar_button_mouse_mode_activated' : 'toolbar_button_mouse_mode'}
        id='button_selection_edition'
        size='sizeToolbarButton'
        onClick={() => {
          if (!drawing_area.isInEditionMode()) {
            drawing_area.switchMode()
            updateParentComponent()
          }
        }}>
        {icon_library.icon_DA_edit}
      </Button>
      <Button
        variant={drawing_area.isInSelectionMode() ? 'toolbar_button_mouse_mode_activated' : 'toolbar_button_mouse_mode'}
        id='button_selection_edition'
        size='sizeToolbarButton'
        onClick={() => {
          if (!drawing_area.isInSelectionMode()) {
            drawing_area.switchMode()
            updateParentComponent()
          }
        }}>
        {icon_library.icon_DA_selection}
      </Button>
    </ButtonGroup>

  </OSTooltip>
}

/**
 * Components that contains buttons to apply undo or redo function,
 * called in ToolBarBottom Component
 *
 * @param {*} {new_data}
 * @return {*}
 */
const ComponentUndoRedo= ({ app_data, updateParentComponent }:{app_data:Class_ApplicationData,updateParentComponent: () => void}) => {
  const { history,icon_library} = app_data
  { /* Buttons to apply undo or redo function */ }
  return <ButtonGroup isAttached>
    <Button
      variant={history.can_undo ? 'toolbar_button_undo_redo_activated' : 'toolbar_button_undo_redo'}
      isDisabled={!history.can_undo}
      id='button_selection_edition'
      size='sizeToolbarButton'
      onClick={() => {
        history.applyUndo()
        updateParentComponent()
      }}>
      {icon_library.icon_undo}
    </Button>
    <Button
      variant={history.can_redo ? 'toolbar_button_undo_redo_activated' : 'toolbar_button_undo_redo'}
      isDisabled={!history.can_redo}
      id='button_selection_edition'
      size='sizeToolbarButton'
      onClick={() => {
        history.applyRedo()
        updateParentComponent()
      }}>
      {icon_library.icon_redo}
    </Button>
  </ButtonGroup>

}

/**
 *Buttons component to recenter DA horizontally or vertically
 *
 * @param {*} { new_data, updateParentComponent }
 * @return {*}
 */
const ComponetStretchButtons = ({ app_data, updateParentComponent }:{app_data:Class_ApplicationData,updateParentComponent: () => void}) => {
  // Use variable from class
  const { t } = app_data

  const logo_btn_fs = document.fullscreenElement ? app_data.icon_library.icon_enter_fullscreen : app_data.icon_library.icon_exit_fullscreen

  const tmp = new KeyboardEvent('keydown', { key: 'F', ctrlKey: true })
  const doc = document
  // Function that trigger event on Ctrl + F
  const executeManualCtrlF = () => {
    if (doc.onkeydown) {
      doc.onkeydown(tmp as KeyboardEvent)
    }
    updateParentComponent()
  }

  return <ButtonGroup isAttached>
    <OSTooltip placement='top' label={t('Banner.tooltipAdjustH')}>
      <Button variant='toolbar_button_6'
        size='sizeToolbarButton'
        onClick={() => app_data.drawing_area.areaFitHorizontally(true)}>
        {app_data.icon_library.icon_area_fit_horiz}
      </Button>
    </OSTooltip>
    <OSTooltip placement='top' label={t('Banner.tooltipAdjustV')}>
      <Button variant='toolbar_button_6'
        size='sizeToolbarButton'
        onClick={() => app_data.drawing_area.areaFitVertically(true)}>
        {app_data.icon_library.icon_area_fit_vert}
      </Button>
    </OSTooltip>

    <OSTooltip
      placement='top'
      label={document.fullscreenElement ? t('Banner.quit_fullscreen') : t('Banner.fullscreen')}
    >
      <Button
        variant='toolbar_button_6'
        id='button_fullscreen'
        size='sizeToolbarButton'
        onClick={executeManualCtrlF}
      >
        {logo_btn_fs}
      </Button>
    </OSTooltip>
  </ButtonGroup>
}

export const DrawerSequenceDataTagg = ({ new_data }:{ new_data: Class_ApplicationData }) => {
  const { icon_library } = new_data
  const { icon_repeat_sequence, icon_play, icon_pause, icon_activated, icon_open_selector } = icon_library
  const [, setUpdate] = useState(0)
  new_data.menu_configuration.ref_to_drawer_sequence_data_tag_updater.current = () => setUpdate(a => a + 1)
  const [active_grp, setActiveGrp] = useState('')

  const list_grp_seq = new_data.drawing_area.sankey.getTagGroupsAsList('data_taggs').filter(grp => (grp as Class_DataTagGroup).banner=='sequence')
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
    {list_grp_seq.map((el, idx) => {
      return <MenuItem
        key={'select_grp_seq_' + idx}
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

// Compoenent returing a stepper of a dataTagg where each step is a tag of the group with visual indication to which tag is selected
const StepperDataTagg = ({ new_data, DataGroup }:{ new_data: Class_ApplicationData, DataGroup: Class_DataTagGroup }) => {
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