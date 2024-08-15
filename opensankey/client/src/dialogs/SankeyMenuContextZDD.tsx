import * as d3 from 'd3'
import React, { FunctionComponent, useState } from 'react'
import { ContextMenuZddFType } from './types/SankeyMenuContextZDDTypes'
import { ComputeAutoSankey, arrangeNodes } from '../draw/SankeyDrawLayout'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'
import { GetRandomInt, AssignNodeLocalAttribute, ReturnValueNode } from '../configmenus/SankeyUtils'
import { DrawGrid } from '../draw/SankeyDrawFunction'
import { Box, Button, ButtonGroup, Menu, MenuButton, MenuList, Input, NumberInput, NumberInputField } from '@chakra-ui/react'
import { ChevronRightIcon } from '@chakra-ui/icons'

const icon_open_modal = <FontAwesomeIcon style={{ float: 'right' }} icon={faUpRightFromSquare} />
const sep = <hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} />
const checked = (b: boolean) => <span style={{ float: 'right' }}>{b ? '✓' : ''}</span>

export const ContextMenuZdd: FunctionComponent<ContextMenuZddFType> = ({
  applicationContext,
  applicationData,
  applicationState,
  contextMenu,
  dict_hook_ref_setter_show_dialog_components,
  node_function,
  link_function,
  reDrawLegend,
  ComponentUpdater
}) => {

  const [show_context_zdd, set_show_context_zdd] = useState(false)
  contextMenu.showContextZDDRef.current = [show_context_zdd, set_show_context_zdd]
  const { data, set_data } = applicationData
  const { t } = applicationContext
  const { pointer_pos } = contextMenu
  const { RedrawNodes } = node_function
  const { RedrawLinks } = link_function
  const [node_hspace, set_node_hspace] = useState(data.h_space)
  const [node_vspace, set_node_vspace] = useState(data.v_space)
  const [forceUpdate, setForceUpdate] = useState(false)
  const list_palette_color = [d3.interpolateBlues, d3.interpolateBrBG, d3.interpolateBuGn, d3.interpolatePiYG, d3.interpolatePuOr,
    d3.interpolatePuBu, d3.interpolateRdBu, d3.interpolateRdGy, d3.interpolateRdYlBu, d3.interpolateRdYlGn, d3.interpolateSpectral,
    d3.interpolateTurbo, d3.interpolateViridis, d3.interpolateInferno, d3.interpolateMagma, d3.interpolatePlasma, d3.interpolateCividis,
    d3.interpolateWarm, d3.interpolateCool, d3.interpolateCubehelixDefault, d3.interpolateRainbow, d3.interpolateSinebow]


  let style_c_zdd = '0px 0px auto auto'
  let is_top = true
  let pos_x = pointer_pos.current[0] + 10
  let pos_y = pointer_pos.current[1] - 20

  // The limit value of the mouse position that engages the shift of the context menu
  // is arbitrary and taken by hand because it is not possible to know the dimensions of the menu before it is render
  if (show_context_zdd) {
    if (pointer_pos.current[0] + 450 > window.innerWidth) {
      pos_x = pointer_pos.current[0] - 455
    }

    if (pointer_pos.current[1] + 330 > window.innerHeight) {
      pos_y = pointer_pos.current[1] - 310
      is_top = false
    }
    style_c_zdd = pos_y + 'px auto auto ' + pos_x + 'px'
  }

  const button_bg_color = <Button variant='contextmenu_button'>
    <Input hidden type='color' id='color_bg_zdd' name='color_bg_zdd'
      onChange={(evt) => {
        data.couleur_fond_sankey = evt.target.value
        d3.select('#svg').style('background-color', data.couleur_fond_sankey)
      }}
      onBlur={() => set_data({ ...data })}
    >
    </Input>
    <label htmlFor='color_bg_zdd' style={{ width: '100%', margin: 0 }}>{t('Menu.BgC')}</label>
  </Button>

  const button_bg_grid = <><Button variant='contextmenu_button' onClick={() => {
    data.grid_visible = !data.grid_visible
    setForceUpdate(!forceUpdate)
    ComponentUpdater.updateComponenSaveInCache.current(false)
    DrawGrid(data)
  }}>{t('MEP.TCG')}{checked(data.grid_visible)}</Button>
  </>
  const button_assgn_rand_node_color = <><Button variant='contextmenu_button' onClick={() => {
    const color_selected = list_palette_color[GetRandomInt(list_palette_color.length)]
    let n_keys = Object.keys(data.nodes)
    if (applicationState.multi_selected_nodes.current.length > 0) {
      n_keys = applicationState.multi_selected_nodes.current.map(n=>n.idNode)
    }
    const size_color = n_keys.length

    for (const i in d3.range(size_color)) {
      AssignNodeLocalAttribute(data.nodes[n_keys[i]], 'color', (d3.color(color_selected(+i / size_color))?.formatHex() as string))
    }

    RedrawNodes(Object.values(applicationData.display_nodes))
    ComponentUpdater.updateComponenSaveInCache.current(false)
  }}>{t('Menu.rand_node_color')}</Button>
  </>

  // Item to change sankey scale
  const dropdown_c_zdd_scale = <Box>
    <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
      <Box as={Button} variant='contextmenu_button' layerStyle='menuconfigpanel_option_name'>
        {t('MEP.Echelle')}
      </Box>

      <NumberInput
        min={0}
        value={data.user_scale}
        onChange={evt => {
          data.user_scale = +evt
          RedrawNodes(Object.values(applicationData.display_nodes))
          RedrawLinks(Object.values(applicationData.display_links))
          ComponentUpdater.updateComponenSaveInCache.current(false)
          setForceUpdate(!forceUpdate)
        }}>
        <NumberInputField/>
      </NumberInput>
    </Box>
  </Box>

  // Item to set vert and horiz shift and automatically position nodes
  const button_pa = <Menu placement='end'>
    <MenuButton variant='contextmenu_button' as={Button} rightIcon={<ChevronRightIcon />} className="dropdown-basic">
      {t('MEP.PA')}
    </MenuButton>
    <MenuList as={Box} layerStyle='context_menu' >
      {/* Set horizontal value for automatic positionning */}
      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box  as={Button} variant='contextmenu_button' layerStyle='menuconfigpanel_option_name'>
          {t('MEP.Horizontal')}
        </Box>

        <NumberInput
          variant='menuconfigpanel_option_numberinput_with_right_addon'
          min={0}
          value={node_hspace}
          onChange={evt => {
            set_node_hspace(+evt)
            data.h_space = +evt
            ComponentUpdater.updateComponenSaveInCache.current(false)
          }}>
          <NumberInputField/>
        </NumberInput>
      </Box>

      {/* Set vertical value for automatic positionning */}

      <Box as='span' layerStyle='menuconfigpanel_row_2cols' >
        <Box as={Button} variant='contextmenu_button' layerStyle='menuconfigpanel_option_name'>
          {t('MEP.Vertical')}
        </Box>

        <NumberInput
          variant='menuconfigpanel_option_numberinput_with_right_addon'
          min={0}
          value={node_vspace}
          onChange={evt => {
            set_node_vspace(+evt)
            data.h_space = +evt
            ComponentUpdater.updateComponenSaveInCache.current(false)
          }}>
          <NumberInputField/>
        </NumberInput>
      </Box>


      <Button variant='contextmenu_button'
        onClick={() => {
          applicationData.function_on_wait.current = () => {
            applicationData.data.v_space = node_vspace
            ComputeAutoSankey(applicationData, node_hspace, false)
            Object.values(applicationData.display_nodes).forEach(n => {
              d3.select('#ggg_' + n.idNode).attr('transform', 'translate(' + n.x + ',' + n.y + ')')
            })
            RedrawLinks(Object.values(applicationData.display_links))
            ComponentUpdater.updateComponenSaveInCache.current(false)
          }
          dict_hook_ref_setter_show_dialog_components.ref_lauchToast.current({ success: 'Layout Updated' })
        }}>
        {t('MEP.PA_action')}
      </Button>
    </MenuList>
  </Menu>

  // Item to display or mask the legend
  const button_mask_leg = <Button variant='contextmenu_button'
    onClick={() => {
      data.mask_legend = !data.mask_legend
      reDrawLegend()
      ComponentUpdater.updateComponenSaveInCache.current(false)
      setForceUpdate(!forceUpdate)
    }}>
    {data.mask_legend ? t('MEP.hide_leg') : t('MEP.show_leg')}
  </Button>

  const button_an = <Button variant='contextmenu_button'
    onClick={() => {
      arrangeNodes(data)
      RedrawNodes(Object.values(applicationData.display_nodes))
      RedrawLinks(Object.values(applicationData.display_links))
      ComponentUpdater.updateComponenSaveInCache.current(false)
      Object.values(applicationData.display_nodes).filter(n => ReturnValueNode(data,n,'position')!= 'relative').forEach(n => {
        d3.select('#ggg_' + n.idNode).attr('transform', 'translate(' + n.x + ',' + n.y + ')')
      })
    }}>
    {t('MEP.AN')}
  </Button>

  let full = t('fullscreen')
  if (!document.fullscreenElement) {
    full = t('fullscreen')
  } else {
    full = t('exitFullscreen')
  }

  const button_fullscreen = <Button variant='contextmenu_button'
    onClick={() => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen()
      } else if (document.exitFullscreen) {
        document.exitFullscreen()
      }
      set_show_context_zdd(false)
    }}
  >
    {full}
  </Button>

  // Item to open a draggable modal with the configuration menu of the draw area
  const button_open_layout = <Button onClick={() => {
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_layout.current(true)
    set_show_context_zdd(false)
  }} variant='contextmenu_button'>
    {t('Menu.MEP')} {icon_open_modal}
  </Button>

  return show_context_zdd ? <Box id="context_zdd_pop_over" layerStyle='context_menu'
    className={'context_popover ' + (is_top ? '' : 'at_bot')}

    style={{ maxWidth: '100%', position: 'absolute', inset: style_c_zdd }}>
    <ButtonGroup isAttached orientation='vertical'>
      {button_pa}
      {button_an}
      {sep}
      {button_assgn_rand_node_color}
      {sep}

      {button_bg_color}
      {button_bg_grid}
      {dropdown_c_zdd_scale}
      {button_mask_leg}
      {sep}
      {button_open_layout}
      {sep}
      {button_fullscreen}

    </ButtonGroup>
  </Box> : <></>
}