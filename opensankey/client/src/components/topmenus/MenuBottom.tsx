import { Box, Button, ButtonGroup } from '@chakra-ui/react'
import React, { FC, useState } from 'react'
import { FCType_ToolBarBottom, FCType_ToolbarSubComponent } from '../SankeyMenuTypes'
import { OSTooltip } from '../configmenus/MenuCommon'

/**
 * Bottom toolbar for some simple functionnality on the DA (Draw flow, recenter DA,...)
 *
 * @param {*} {
 *   new_data,
 * }
 * @return {*}
 */
export const ToolBarBottom: FC<FCType_ToolBarBottom> = ({
  new_data
}) => {
  const { t } = new_data

  // Local State to update this & subcomponent
  const [, setUpdater] = useState(0)
  const refreshThis = () => setUpdater(a => a + 1)
  new_data.menu_configuration.ref_to_toolbar_bottom_updater.current = refreshThis

  let btn_mouse_mode_edition = <></>
  if (!new_data.is_static) {
    btn_mouse_mode_edition = <ComponentMouseMode new_data={new_data} updateParentComponent={refreshThis} />
  }

  // Get height of bottom menu to correctly place the toolbar above
  const sizeBottomMenu = document.getElementsByClassName('BottomMenu')[0]?.getBoundingClientRect().height ?? 0
  return <Box
    layerStyle={'toolbar_bottom'}
    bottom={'calc(' + String(sizeBottomMenu + (new_data.drawing_area.fit_margin / 2)) + 'px + 1rem)'}
  >
    {btn_mouse_mode_edition}
    <ComponentUndoRedo
      new_data={new_data}
      updateParentComponent={refreshThis}
    />
    <ComponetStretchButtons
      new_data={new_data}
      updateParentComponent={refreshThis}
    />
    <OSTooltip
      placement='top'
      label={t('Banner.tooltipHelp')}
      isAlwaysOpen={new_data.menu_configuration.show_splashscreen}
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

const ComponentMouseMode: FC<FCType_ToolbarSubComponent> = ({ new_data, updateParentComponent }) => {
  const { t } = new_data

  { /* Boutons permettant soit de passer la souris en mode sélection soit en mode création noeud/flux */ }
  return <OSTooltip
    placement='top'
    label={t('Banner.tooltipLiason')}
    isAlwaysOpen={new_data.menu_configuration.show_splashscreen}
  >
    <ButtonGroup isAttached>
      <Button
        variant={new_data.drawing_area.isInEditionMode() ? 'toolbar_button_mouse_mode_activated' : 'toolbar_button_mouse_mode'}
        id='button_selection_edition'
        size='sizeToolbarButton'
        onClick={() => {
          if (!new_data.drawing_area.isInEditionMode()) {
            new_data.drawing_area.switchMode()
            updateParentComponent()
          }
        }}>
        {new_data.icon_library.icon_DA_edit}
      </Button>
      <Button
        variant={new_data.drawing_area.isInSelectionMode() ? 'toolbar_button_mouse_mode_activated' : 'toolbar_button_mouse_mode'}
        id='button_selection_edition'
        size='sizeToolbarButton'
        onClick={() => {
          if (!new_data.drawing_area.isInSelectionMode()) {
            new_data.drawing_area.switchMode()
            updateParentComponent()
          }
        }}>
        {new_data.icon_library.icon_DA_selection}
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
const ComponentUndoRedo: FC<FCType_ToolbarSubComponent> = ({ new_data, updateParentComponent }) => {

  { /* Buttons to apply undo or redo function */ }
  return <ButtonGroup isAttached>
    <Button
      variant={new_data.history.can_undo ? 'toolbar_button_undo_redo_activated' : 'toolbar_button_undo_redo'}
      isDisabled={!new_data.history.can_undo}
      id='button_selection_edition'
      size='sizeToolbarButton'
      onClick={() => {
        new_data.history.applyUndo()
        updateParentComponent()
      }}>
      {new_data.icon_library.icon_undo}
    </Button>
    <Button
      variant={new_data.history.can_redo ? 'toolbar_button_undo_redo_activated' : 'toolbar_button_undo_redo'}
      isDisabled={!new_data.history.can_redo}
      id='button_selection_edition'
      size='sizeToolbarButton'
      onClick={() => {
        new_data.history.applyRedo()
        updateParentComponent()
      }}>
      {new_data.icon_library.icon_redo}
    </Button>
  </ButtonGroup>

}

/**
 *Buttons component to recenter DA horizontally or vertically
 *
 * @param {*} { new_data, updateParentComponent }
 * @return {*}
 */
const ComponetStretchButtons: FC<FCType_ToolbarSubComponent> = ({ new_data, updateParentComponent }) => {
  // Use variable from class
  const { t } = new_data

  const logo_btn_fs = document.fullscreenElement ? new_data.icon_library.icon_enter_fullscreen : new_data.icon_library.icon_exit_fullscreen

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
        onClick={() => new_data.drawing_area.areaFitHorizontally(true)}>
        {new_data.icon_library.icon_area_fit_horiz}
      </Button>
    </OSTooltip>
    <OSTooltip placement='top' label={t('Banner.tooltipAdjustV')}>
      <Button variant='toolbar_button_6'
        size='sizeToolbarButton'
        onClick={() => new_data.drawing_area.areaFitVertically(true)}>
        {new_data.icon_library.icon_area_fit_vert}
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
