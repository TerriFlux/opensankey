// Standard libs
import React, { useState, ChangeEvent, FunctionComponent, useRef } from 'react'
import { MultiSelect } from 'react-multi-select-component'
import { FaAngleDown, FaAngleUp, FaMinus, FaPlus } from 'react-icons/fa'
import ReactQuill from 'react-quill'
// 'react-quill' seem to not be updated anymore, for new it doesn't create problem but it make a warning error in console
// to solve it when time will come we can use 'react-quill-new' wich solve this issu (https://github.com/zenoamaro/react-quill/issues/988#issuecomment-2241533429)

// Imported libs
import {
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Box,
  Checkbox,
  Button,
  InputGroup,
  Input,
  NumberInput,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInputField,
  NumberInputStepper,
  ButtonGroup
} from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpRightFromSquare } from '@fortawesome/free-solid-svg-icons'

// OpenSankey ts-code
import { Type_MenuSelectionEntry } from '../../deps/OpenSankey/components/topmenus/SankeyMenuTop'
import { OSTooltip } from '../../deps/OpenSankey/types/Utils'

// Local libs
import {
  FCType_MenuConfigurationFreeLabelsOSP,
  FCType_MenuPreferenceLabelsOSP,
  FCType_ContextZDTOSP,
  FCType_ZDTMenuAsAccordeonItemOSP
} from './types/SankeyPlusMenuConfigurationLabelsTypes'


const sep = <hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} />

/**
 *  TODO Description
 * @param { * } new_data_plus
 */
export const MenuPreferenceLabelsOSP: FunctionComponent<FCType_MenuPreferenceLabelsOSP> = ({
  new_data_plus
}) => {
  const [, setCount] = useState(0)
  new_data_plus.menu_configuration.ref_to_checkbox_pref_container_updater.current = () => setCount(a => a + 1)
  return <Checkbox
    ref={new_data_plus.checkbox_refs['LL']}
    isDisabled={!new_data_plus.has_sankey_plus}
    variant='menuconfigpanel_option_checkbox'
    isChecked={new_data_plus.menu_configuration.isGivenAccordionShowed('LL')}
    onChange={() => {
      new_data_plus.menu_configuration.toggleGivenAccordion('LL')
      setCount(a => a + 1)
    }}>
    {new_data_plus.t('Menu.LL')}
  </Checkbox>
}

/**
 * Description placeholder
 *
 * @export
 * @typedef {selected_type}
 */
export interface selected_type { 'label': string; 'value': string }

export const MenuConfigurationFreeLabelsOSP: FunctionComponent<FCType_MenuConfigurationFreeLabelsOSP> = ({
  new_data_plus,
}) => {
  const { t } = new_data_plus
  const selected_zdt = new_data_plus.drawing_area.selected_containers_list

  const r_editor_ZDT = useRef<ReactQuill>() as { current: ReactQuill }
  const zdt_or_image = (selected_zdt.length > 0 ? (selected_zdt[0].is_image === true ? 'image' : 'zdt') : 'zdt')
  const [button_icon_or_image, set_button_icon_or_image] = useState<'zdt' | 'image'>(zdt_or_image)

  const INITIAL_OPTIONS_label = new_data_plus.drawing_area.sankey.containers_list_sorted.map((d) => { return { 'label': d.title, 'value': d.id } })
  const selected_label = selected_zdt.map((d) => { return { 'label': d.title, 'value': d.id } })


  const [forceUpdate, setForceUpdate] = useState(false)
  // Link current component updater to menu config class
  new_data_plus.menu_configuration.ref_to_menu_config_containers_updater.current = () => setForceUpdate(!forceUpdate)


  const redrawAndRefresh = () => {
    selected_zdt.forEach(zdt => zdt.drawAsSelected())
    setForceUpdate(!forceUpdate)
  }

  //Renvoie le menue déroulant pour la sélection des labels libres
  const dropdownMultiLabel = () => {
    const DD = (
      <Box
        layerStyle='submenuconfig_droplist'
      >
        {/* Position custom pour MultiSelect */}
        <Box
          height='2rem'
          width='10rem'
        >
          <MultiSelect
            disabled={!new_data_plus.has_sankey_plus}
            valueRenderer={(selected: selected_type[]) => {
              return selected.length ? selected.map(({ label }) => label + ', ') : 'Aucun label sélectionné'
            }}
            options={INITIAL_OPTIONS_label}
            value={selected_label}
            overrideStrings={{
              'selectAll': 'Tout sélectionner',
            }}
            onChange={(entries: Type_MenuSelectionEntry[]) => {
              // Update selection list
              const entries_values = entries.map(d => d.value)
              new_data_plus.drawing_area.sankey.containers_list.forEach(zdt => {
                if (entries_values.includes(zdt.id)) {
                  new_data_plus.drawing_area.addContainerToSelection(zdt)
                }
                else {
                  new_data_plus.drawing_area.removeFreeLabelFromSelection(zdt)
                }
              })
              redrawAndRefresh()
            }}
            labelledBy={t('Noeud.TS')}
          />
        </Box></Box>)
    return DD
  }

  //=================FONCTION POUR TEST VALEUR MULTI SELECT LABEL===========================
  const allLabelHeight = () => {
    let display_size = true
    let size = 25
    if (selected_zdt.length !== 0) {
      size = selected_zdt[0].label_height
    }
    selected_zdt.map((d) => {
      display_size = (d.label_height === size) ? display_size : false
    })
    return (display_size) ? Math.round(size) : -1
  }

  const allLabelWidth = () => {
    let display_size = true
    let size = 25
    if (selected_zdt.length !== 0) {
      size = selected_zdt[0].label_width
    }
    selected_zdt.map((d) => {
      display_size = (d.label_width === size) ? display_size : false
    })
    return (display_size) ? Math.round(size) : -1
  }

  const allLabelTitle = () => {
    return selected_zdt.length > 0 ? selected_zdt[0].title : ''
  }

  const allLabelTransparent = () => {
    let display_size = true
    let opa = 100
    if (selected_zdt.length !== 0) {
      opa = selected_zdt[0].opacity
    }
    selected_zdt.map((d) => {
      display_size = (d.opacity === opa) ? display_size : false
    })
    return (display_size) ? opa : 0
  }


  const valAllLabelBorderTransparent = selected_zdt[0]?.transparent_border ?? false
  // Check if every transparent_border of selected zdt are the same as the first selected, if it true value is not indeterminate
  const valAllLabelBorderTransparentIndeterminate = !selected_zdt.every(zdt => zdt.transparent_border == valAllLabelBorderTransparent)


  const modules = {
    toolbar: [
      [{ 'font': [] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['clean'],
    ],
  }

  const formats = [
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'list',
    'bullet',
    'align'
  ]

  const disable_options = new_data_plus.has_sankey_plus ? (selected_zdt.length === 0) : true


  const content_image = <>
    {/* Import image */}
    <OSTooltip label={!new_data_plus.has_sankey_plus ? t('Menu.sankeyOSPDisabled') : ''} >

      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Noeud.img_src')}
        </Box>

        <Input
          accept='image/*'
          type="file"
          disabled={disable_options}
          onChange={(evt: ChangeEvent) => {
            const files = (evt.target as HTMLFormElement).files
            const reader = new FileReader()
            reader.onload = (() => {
              return (e: ProgressEvent<FileReader>) => {
                const resultat = (e.target as FileReader).result
                const res = resultat?.toString().replaceAll('=', '')
                selected_zdt.forEach(n => n.image_src = (res as string))
                redrawAndRefresh()

              }
            })()
            reader.readAsDataURL(files[0])
          }}
        />
      </Box>
    </OSTooltip>
  </>

  const content_menu_zdt = <OSTooltip label={!new_data_plus.has_sankey_plus ? t('Menu.sankeyOSPDisabled') : ''} >
    <Box layerStyle='menuconfigpanel_grid'>
      <Box
        as='span'
        layerStyle='menuconfigpanel_zdt_row_droplist'
      >
        <Button
          isDisabled={!new_data_plus.has_sankey_plus}
          variant='menuconfigpanel_add_button'
          onClick={() => {
          // Create default node
            const new_node = new_data_plus.drawing_area.sankey.addNewDefaultFreeLabel()
            //Deselect previously selected container
            new_data_plus.drawing_area.purgeSelectionOfContainer()
            // Add node to selection
            new_data_plus.drawing_area.addContainerToSelection(new_node)
            // Update menus
            redrawAndRefresh()
          }
          }><FaPlus /></Button>

        {dropdownMultiLabel()}

        <Button
          variant='menuconfigpanel_del_button'
          isDisabled={disable_options}
          onClick={() => {
          // Delete all selected nodes
            new_data_plus.drawing_area.sankey.deleteSelectedFreeLabels()
            // Update all menus
            redrawAndRefresh()
          }
          }><FaMinus /></Button>

        {//Boutton pour monter le label sélctionné
        }

        <Button
          variant='menuconfigpanel_option_button'
          isDisabled={disable_options}
          onClick={() => {
            selected_zdt.map(l => {
              l.increaseDisplayOrder()
            })
            setForceUpdate(a => !a)
          }}><FaAngleUp /></Button>

        <Button
          variant='menuconfigpanel_option_button'
          isDisabled={disable_options}
          onClick={() => {
            selected_zdt.map(l => {
              l.decreaseDisplayOrder()
            })
            setForceUpdate(a => !a)
          }}><FaAngleDown /></Button>

      </Box>

      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
        gridTemplateColumns='1fr 9fr'
      >
        <Box
          layerStyle='menuconfigpanel_option_name'
          textStyle='h3'
        >
          {t('LL.title')}
        </Box>
        <InputGroup
          variant='menuconfigpanel_option_input'
        >
          <Input
            variant='menuconfigpanel_option_input'
            max={100}
            disabled={disable_options}
            style={{
              color: (disable_options) ? '#666666' : '',
              backgroundColor: (disable_options) ? '#cccccc' : ''
            }}
            value={allLabelTitle()}
            onChange={evt => {
              const value = evt.target.value
              selected_zdt.map(d => d.title = value)
              setForceUpdate(!forceUpdate)
            }}
          />
        </InputGroup>
      </Box>

      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Noeud.illustration_type')}
        </Box>
        <Box
          as='span'
          layerStyle='menuconfigpanel_row_2cols'
        >
          <Button
            isDisabled={disable_options}
            variant='menuconfigpanel_option_button'
            onClick={() => {
              selected_zdt.forEach(n => n.is_image = false)
              set_button_icon_or_image('zdt')
              redrawAndRefresh()
            }}>Texte</Button>

          <Button
            disabled={disable_options}
            variant='menuconfigpanel_option_button'
            onClick={() => {
              selected_zdt.forEach(n => n.is_image = true)

              set_button_icon_or_image('image')
              redrawAndRefresh()
            }}>Image</Button></Box>
      </Box>

      {button_icon_or_image === 'zdt' ? <Box style={{ 'height': '300px' }}><ReactQuill
        className='quill_editor'
        value={selected_zdt.length > 0 ? selected_zdt[0].content : ''}
        ref={r_editor_ZDT}
        onChange={(evt, _, src) => {
          if (src == 'user') {
            selected_zdt.forEach(n => n.content = evt)
            redrawAndRefresh()
          }
        }}
        theme="snow"
        modules={modules}
        formats={formats}
        readOnly={disable_options}
        style={{
          'height': '300px',
          color: (disable_options) ? '#666666' : '',
          backgroundColor: (disable_options) ? '#cccccc' : '',
          overflowY: 'scroll'
        }}
      /></Box> : content_image}

      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box
          as='span'
          layerStyle='menuconfigpanel_row_2cols'
        >
          <Box layerStyle='menuconfigpanel_option_name'>
            {t('LL.hl')}
          </Box>
          <InputGroup
            variant='menuconfigpanel_option_input'
          >
            <NumberInput
              variant='menuconfigpanel_option_numberinput_with_right_addon'
              min={0}
              isDisabled={disable_options}
              value={allLabelHeight()}
              onChange={evt => {
                selected_zdt.map(d => d.label_height = +evt)

                redrawAndRefresh()
              }}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput></InputGroup>
        </Box>
        <Box
          as='span'
          layerStyle='menuconfigpanel_row_2cols'
        >
          <Box layerStyle='menuconfigpanel_option_name'>
            {t('LL.ll')}
          </Box>
          <InputGroup
            variant='menuconfigpanel_option_input'
          >
            <NumberInput
              variant='menuconfigpanel_option_numberinput'
              min={0}
              isDisabled={disable_options}
              value={allLabelWidth()}
              onChange={evt => {
                selected_zdt.map(d => d.label_width = +evt)

                redrawAndRefresh()
              }}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </InputGroup>
        </Box>
      </Box>

      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box
          as='span'
          layerStyle='menuconfigpanel_row_2cols'
        >
          <Box layerStyle='menuconfigpanel_option_name'>
            {t('LL.cfl')}
          </Box>
          <Input
            variant='menuconfigpanel_option_input_color'
            type='color'
            id='form_color_zdt'
            name='form_color_zdt'
            isDisabled={disable_options}
            value={(selected_zdt.length === 1) ? selected_zdt[0].color : '#ffffff'}
            onChange={evt => {
              const val = evt.target.value
              selected_zdt.map(d => d.color = val)

              redrawAndRefresh()
            }}
          />
        </Box>
        <Box
          as='span'
          layerStyle='menuconfigpanel_row_2cols'
        >
          <Box layerStyle='menuconfigpanel_option_name'>
            {t('LL.ft')}
          </Box>
          <InputGroup
            variant='menuconfigpanel_option_input'
          >
            <NumberInput
              variant='menuconfigpanel_option_numberinput_with_right_addon'
              max={100}
              min={0}
              step={1}
              isDisabled={disable_options}
              value={allLabelTransparent()}
              onChange={evt => {
                const value = +evt
                selected_zdt.map(d => d.opacity = value)

                redrawAndRefresh()
              }}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </InputGroup>
        </Box>
      </Box>

      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('LL.cbl')}
        </Box>
        <Box
          as='span'
          layerStyle='menuconfigpanel_row_2cols'
        >
          <Input
            variant='menuconfigpanel_option_input_color'
            type='color'
            id='form_color_border_zdt'
            name='form_color_border_zdt'
            disabled={!new_data_plus.has_sankey_plus && !valAllLabelBorderTransparent}
            value={(selected_zdt.length === 1) ? selected_zdt[0].color_border : '#ffffff'}
            onChange={evt => {
              const val = evt.target.value
              selected_zdt.map(d => d.color_border = val)

              redrawAndRefresh()
            }}
          />

          <Checkbox
            variant='menuconfigpanel_part_title_1_checkbox'
            iconColor={valAllLabelBorderTransparentIndeterminate ? '#78C2AD' : 'white'}
            isDisabled={disable_options}
            isIndeterminate={valAllLabelBorderTransparentIndeterminate}
            isChecked={valAllLabelBorderTransparent}
            onChange={(evt) => {
              selected_zdt.map(d => d.transparent_border = evt.target.checked)

              redrawAndRefresh()
            }}>
            {t('LL.bt')}
          </Checkbox>
        </Box>
      </Box>
    </Box>
  </OSTooltip>

  return content_menu_zdt
}


export const ContextZDTOSP: FunctionComponent<FCType_ContextZDTOSP> = (
  { new_data_plus }
) => {
  const { t } = new_data_plus

  const selected_zdt = new_data_plus.drawing_area.selected_containers_list
  const zdt_to_contextualise = new_data_plus.drawing_area.contextualised_container

  const [, setCount] = useState(0)

  let style_c_zdd = '0px 0px auto auto'
  if (zdt_to_contextualise) {
    style_c_zdd = (new_data_plus.drawing_area.pointer_pos[1] - 20) + 'px auto auto ' + (new_data_plus.drawing_area.pointer_pos[0] + 10) + 'px'
  }

  const redrawAndRefresh = () => {
    // Refresh menu config free label
    new_data_plus.menu_configuration.ref_to_menu_config_containers_updater.current()
    // Redraw selected elements
    selected_zdt.forEach(zdt => zdt.draw())
    // Refresh this menu
    setCount(a => a + 1)
  }

  const closeContextMenu = () => {
    // Unset contextualized node
    new_data_plus.drawing_area.contextualised_container = undefined
    setCount(a => a + 1)

  }

  // Check if every transparent_border of selected zdt are the same as the first selected, if it true value is not indeterminate
  const valAllLabelBorderTransparent = selected_zdt[0]?.transparent_border ?? false

  const btn_mask_border = <Button onClick={() => {
    selected_zdt.forEach(zdt => zdt.transparent_border = !valAllLabelBorderTransparent)
    redrawAndRefresh()
  }} variant='contextmenu_button'>{valAllLabelBorderTransparent ? t('LL.display_border') : t('LL.hide_border')}</Button>


  const btn_change_color = <>

    <Button variant='contextmenu_button'>
      <Input hidden type='color' id='form_color_zdt' name='color_bg_zdd'
        value={(selected_zdt.length === 1) ? selected_zdt[0].color : '#ffffff'}
        onChange={(evt) => {
          const val = evt.target.value
          selected_zdt.map(d => d.color = val)
          redrawAndRefresh()
        }}
      >
      </Input>
      <label htmlFor='form_color_zdt' style={{ width: '100%', margin: 0 }}>{t('LL.cfl')}</label>
    </Button>
  </>

  const icon_open_modal = <FontAwesomeIcon style={{ float: 'right' }} icon={faUpRightFromSquare} />

  const button_open_layout = <Button onClick={() => {
    new_data_plus.menu_configuration.dict_setter_show_dialog_plus.ref_setter_show_menu_zdt.current(true)
    closeContextMenu()

  }} variant='contextmenu_button'>{t('Menu.LL')} {icon_open_modal}</Button>

  return zdt_to_contextualise ? <Box
    layerStyle='context_menu'
    id="context_zdd_pop_over"
    style={{ maxWidth: '100%', inset: style_c_zdd, zIndex: 4 }}>
    <ButtonGroup orientation='vertical' isAttached>
      {btn_mask_border}
      {btn_change_color}
      {sep}
      {button_open_layout}
    </ButtonGroup>
  </Box> : <></>
}

/**
 *Function that return content_menu_zdt with JSX to imbricate it in the config menu
*
* @param {*} {
*   new_data_plus,
*   content_menu_zdt
* }
* @return {*}
*/
export const ZDTMenuAsAccordeonItemOSP: FunctionComponent<FCType_ZDTMenuAsAccordeonItemOSP> = ({
  new_data_plus,
  content_menu_zdt
}) => {
  const { t } = new_data_plus
  const [, setCount] = useState(0)
  const refreshThis = () => setCount(a => a + 1)
  new_data_plus.menu_configuration.ref_to_accordion_containers_updater.current = refreshThis

  return <AccordionItem
    style={{ 'display': (new_data_plus.menu_configuration.isGivenAccordionShowed('LL')) ? 'initial' : 'none' }}
  >
    <AccordionButton
      ref={new_data_plus.menu_configuration.zdt_accordion_ref}
      onClick={() => {
        const scroll_x = window.scrollX
        const scroll_y = window.scrollY
        setTimeout(() => {
          document.getElementsByTagName('html')[0]?.scrollTo(scroll_x, scroll_y)
        }, 50)
      }}
    >
      <Box
        as='span'
        layerStyle='submenuconfig_entry'
      >
        {t('Menu.LL')}
      </Box>
      <AccordionIcon />
    </AccordionButton>
    <AccordionPanel>
      {content_menu_zdt}
    </AccordionPanel>
  </AccordionItem>
}