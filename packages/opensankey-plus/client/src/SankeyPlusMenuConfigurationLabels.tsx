// Standard libs
import React, { Ref, useState, ChangeEvent, FunctionComponent, useRef } from 'react'
import * as d3 from 'd3'

import {
  Form,
  FormControl,
  Popover,
  ButtonGroup,
  Badge
} from 'react-bootstrap'
import { MultiSelect } from 'react-multi-select-component'
import { FaAngleDown, FaAngleUp, FaMinus, FaPlus} from 'react-icons/fa'
import { TFunction } from 'i18next'
import ReactQuill, { Quill } from 'react-quill'
import 'react-quill/dist/quill.snow.css'

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
  NumberInputStepper
} from '@chakra-ui/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpRightFromSquare, faLock} from '@fortawesome/free-solid-svg-icons'

// Local libs
import { IsAllZdtAttrSameValue } from './SankeyPlusUtils'
import { deleteGLabel } from './SankeyPlusLabels'
import { OSPContextMenuType,OSPLabel} from '../types/Types'
import {
  OSPMenuConfigurationFreeLabelsFType,
  OSPMenuPreferenceLabelsFType,
  blur_ZDT_wysiwygFType,
  context_zdtFType,
  ZDTMenuAsAccordeonItemType
} from '../types/SankeyPlusMenuConfigurationLabelsTypes'
import { OSTooltip } from './import/OpenSankey'

// OpenSankey js-code
import { preferenceCheck } from 'open-sankey/dist/dialogs/SankeyMenuPreferences'

const sep=<Button variant='light' disabled><hr style={{ borderStyle: 'none', margin: '0px', color: 'grey', backgroundColor: 'grey', height: 2 }} /></Button>

/**
 *  TODO
 *
 * @param { TFunction } t - TODO description
 * @param { OSPData } data - TODO description
 * @param { Function } set_data - TODO description
 *
 */
export const OSPMenuPreferenceLabels : FunctionComponent<OSPMenuPreferenceLabelsFType> = ({
  t,
  data,
  updateMenus
})=>{
  return <Checkbox
    variant='menuconfigpanel_option_checkbox'
    isChecked={data.accordeonToShow.includes('LL')}
    onChange={() => {
      preferenceCheck('LL',data)
      updateMenus[1](!updateMenus[0])
    }}>
    {t('Menu.LL')}
  </Checkbox>
}

/**
 * Description placeholder
 *
 * @export
 * @typedef {selected_type}
 */
export interface selected_type  {'label':string;'value':string}

export const OSPMenuConfigurationFreeLabels : FunctionComponent<OSPMenuConfigurationFreeLabelsFType> = ({
  applicationData,
  applicationContext,
  applicationState,
  ComponentUpdater,
  reDrawOSPLabels
}) => {
  const {data}=applicationData
  const {multi_selected_label}=applicationState
  const {t,has_open_sankey_plus}=applicationContext 
  const r_editor_ZDT= useRef<ReactQuill>() as {current:ReactQuill}
  const zdt_or_image=(multi_selected_label.current.length>0?(multi_selected_label.current[0].is_image===true?'image':'zdt'):'zdt')
  const tmplabel = Object.fromEntries(Object.entries(data.labels).sort(([, a], [, b]) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0)))
  const INITIAL_OPTIONS_label = Object.values(tmplabel).map((d) => { return { 'label': d.title, 'value': d.idLabel } })
  const selected_label = multi_selected_label.current.map((d) => { return { 'label': d.title, 'value': d.idLabel } })
  const [button_icon_or_image,set_button_icon_or_image]=useState<'zdt'|'image'>(zdt_or_image)
  const [s_editor_content_fo_zdt,sEditorContentFOZdt]= useState('')
  const [forceUpdate,setForceUpdate]=useState(false)
  const {updateComponentMenuConfigZdt} = ComponentUpdater
  updateComponentMenuConfigZdt.current.push(()=>setForceUpdate(!forceUpdate))
  applicationState.r_setter_editor_content_fo_zdt.current!.push(sEditorContentFOZdt)
  //Dépalce la place des labels libres sélectionnés vers le debut dans le tableau de flux de data
  //Permet donc de les déssiner après
  const handleUplabel = (i: string) => {
    const { labels } = data
    const listElmt = Object.keys(labels)
    const posElemt = listElmt.indexOf(i)
    listElmt.splice(posElemt, 1)
    listElmt.splice(posElemt - 1, 0, i)
    const new_cat: { [key: string]: OSPLabel } = {}
    listElmt.forEach(elt => {
      new_cat[elt] = labels[elt]
    })
    for (const member in labels) delete labels[member]
    Object.assign(labels, new_cat)
    reDrawOSPLabels(Object.values(data.labels))
    setForceUpdate(!forceUpdate)
  }
  //Dépalce la place des labels libres sélectionnés vers la fin dans le tableau de flux de data
  //Permet donc de les déssiner après
  const handleDownlabel = (i: string) => {
    const { labels } = data
    const listElmt = Object.keys(labels)
    const posElemt = listElmt.indexOf(i)
    listElmt.splice(posElemt, 1)
    listElmt.splice(posElemt + 1, 0, i)
    const new_cat: { [key: string]: OSPLabel } = {}
    listElmt.forEach(elt => {
      new_cat[elt] = labels[elt]
    })
    for (const member in labels) delete labels[member]
    Object.assign(labels, new_cat)
    reDrawOSPLabels(Object.values(data.labels))
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
            disabled={!has_open_sankey_plus}
            valueRenderer={(selected: selected_type[]) => {
              return selected.length ? selected.map(({ label }) => label + ', ') : 'Aucun label sélectionné'
            }}
            options={INITIAL_OPTIONS_label}
            value={selected_label}
            overrideStrings={{
              'selectAll': 'Tout sélectionner',
            }}
            onChange={(selected: [{ label: string, value: string }]) => {
              const new_sel = selected.map(d => d.value)
              const m_s = Object.values(data.labels).filter(d => (new_sel.includes(d.idLabel)))
              multi_selected_label.current = m_s
              reDrawOSPLabels(multi_selected_label.current)
              if(multi_selected_label.current.length>0){
                const tmp = multi_selected_label.current[multi_selected_label.current.length-1].content
                applicationState.r_setter_editor_content_fo_zdt.current?.forEach(f=>f(tmp))
              }else{
                applicationState.r_setter_editor_content_fo_zdt.current?.forEach(f=>f(''))
              }
              updateComponentMenuConfigZdt.current.forEach(f=>f())
            }}
            labelledBy={'hello'}
          />
        </Box></Box>)
    return DD
  }

  //=================FONCTION POUR TEST VALEUR MULTI SELECT LABEL===========================
  const allLabelHeight = () => {
    let display_size = true
    let size = 25
    if (multi_selected_label.current.length !== 0) {
      size = multi_selected_label.current[0].label_height
    }
    multi_selected_label.current.map((d) => {
      display_size = (d.label_height === size) ? display_size : false
    })
    return (display_size) ? Math.round(size) : -1
  }

  const allLabelWidth = () => {
    let display_size = true
    let size = 25
    if (multi_selected_label.current.length !== 0) {
      size = multi_selected_label.current[0].label_width
    }
    multi_selected_label.current.map((d) => {
      display_size = (d.label_width === size) ? display_size : false
    })
    return (display_size) ? Math.round(size) : -1
  }

  const allLabelTitle = () => {
    return multi_selected_label.current.length>0?multi_selected_label.current[0].title:''
  }

  const allLabelTransparent = () => {
    let display_size = true
    let opa = 100
    if (multi_selected_label.current.length !== 0) {
      opa = multi_selected_label.current[0].opacity
    }
    multi_selected_label.current.map((d) => {
      display_size = (d.opacity === opa) ? display_size : false
    })
    return (display_size) ? opa : 0
  }

  const valAllLabelBorderTransparent=IsAllZdtAttrSameValue(data,multi_selected_label.current,'transparent_border') as boolean[]

  // Create a custom size list of font-size
  const list_size=[]
  for(let i=6;i<=50;i++){
    list_size.push(i+'px')
  }

  const Size = Quill.import('attributors/style/size')
  Size.whitelist = list_size
  Quill.register(Size, true)

  const modules = {
    toolbar: [
      [{ 'font': [] }],
      ['bold', 'italic', 'underline','strike'],
      [{ 'size': list_size }],
      [{ 'color': [] }, { 'background': [] }],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      [{'align':[]}],
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

  const disable_options = has_open_sankey_plus? (multi_selected_label.current.length === 0):true
  const isQuill_invalid=multi_selected_label.current.length>0?multi_selected_label.current[0].content!==s_editor_content_fo_zdt:false

  //Create 2 editor :
  // - one in an editor when we can apply layout width buttons
  // - one with raw html in case the editor can't do exactly what we want
  const editor_fo = <Box as='span'><ReactQuill
    className='quill_editor'
    value={s_editor_content_fo_zdt}
    ref={r_editor_ZDT}
    onChange={(evt) => {
      sEditorContentFOZdt(evt)
    }}
    onBlur={()=>{
      Object.values(data.labels).filter(f => multi_selected_label.current.map(d => d.idLabel).includes(f.idLabel)).map(d => {
        d.content = s_editor_content_fo_zdt
      })
      reDrawOSPLabels(multi_selected_label.current)
      setForceUpdate(!forceUpdate)
    }}

    theme="snow"
    modules={modules}
    formats={formats}
    readOnly={disable_options}
    style={{
      color:(disable_options)?'#666666':'',
      backgroundColor:(disable_options)?'#cccccc':''}}
  /></Box>

  const content_wysiwyg = <Form>
    <Form className='FO_zdt_editeur'>
      <Form.Group>
        {editor_fo}
      </Form.Group>
      <Form.Control type='text' isInvalid={isQuill_invalid} style={{display:'none'}}/>
      <FormControl.Feedback type='invalid'>{t('MEP.onBlurNoEnter')}</FormControl.Feedback>
    </Form>
  </Form>

  const content_image = <>
    {/* Import image */}
    <OSTooltip label={!has_open_sankey_plus?t('Menu.sankeyOSPDisabled'):''} >

      <Box
        as='span'
        layerStyle='menuconfigpanel_row_2cols'
      >
        <Box layerStyle='menuconfigpanel_option_name'>
          {t('Noeud.img_src')}
        </Box>

        <Form.Control
          accept='image/*'
          type="file"
          disabled={disable_options}
          onChange={(evt: ChangeEvent) => {
            const files = (evt.target as HTMLFormElement).files
            const reader = new FileReader()
            reader.onload = (() => {
              return (e: ProgressEvent<FileReader>) => {
                const resultat = (e.target as FileReader).result
                const res=resultat?.toString().replaceAll('=','')
                Object.values(data.labels).filter(f => multi_selected_label.current.map(d => d.idLabel).includes(f.idLabel))
                  .forEach(n=>n.image_src=(res as string))

                reDrawOSPLabels(multi_selected_label.current)
                setForceUpdate(!forceUpdate)

              }
            })()
            reader.readAsDataURL(files[0])
          }}
        />
      </Box>
    </OSTooltip>
  </>

  const content_menu_zdt= <Box layerStyle='menuconfigpanel_grid'>
    <Box
      as='span'
      layerStyle='menuconfigpanel_zdt_row_droplist'
    >
      <Button
        isDisabled={!has_open_sankey_plus}
        variant='menuconfigpanel_add_button'
        onClick={() => {

          let idZdt = Object.keys(data.labels).length
          const tab_title=Object.values(data.labels).map(zdt=>zdt.title)
          while (tab_title.includes('Zone de texte '+idZdt) ) {
            idZdt = idZdt+1
          }
          const new_label = {
            idLabel: 'label_' + String(new Date().getTime()),
            title:'Zone de texte '+idZdt,
            content: 'Text Label ...',
            label_width: 100,
            label_height: 25,
            color: 'white',
            color_border: 'black',
            opacity: 100,
            transparent_border: false,

            is_image:false,
            image_src:'',
            x: 50,
            y: 50,
          }
          data.labels[new_label.idLabel] = new_label
          multi_selected_label.current = [new_label]

          reDrawOSPLabels(multi_selected_label.current)
          setForceUpdate(!forceUpdate)
        }
        }><FaPlus /></Button>

      {dropdownMultiLabel()}

      <Button
        variant='menuconfigpanel_del_button'
        isDisabled={disable_options}
        onClick={() => {
          deleteGLabel(multi_selected_label.current,applicationState)
          data.labels = Object.fromEntries(Object.entries(data.labels).filter(d => !multi_selected_label.current.map(l => l.idLabel).includes(d[0])))
          multi_selected_label.current = []
          updateComponentMenuConfigZdt.current.forEach(f=>f())
        }
        }><FaMinus /></Button>

      {//Boutton pour monter le label sélctionné
      }

      <Button
        variant='menuconfigpanel_option_button'
        isDisabled={disable_options}
        onClick={() => {
          multi_selected_label.current.map(l => {
            handleDownlabel(l.idLabel)
          })
        }}><FaAngleUp /></Button>

      <Button
        variant='menuconfigpanel_option_button'
        isDisabled={disable_options}
        onClick={() => {
          multi_selected_label.current.map(l => {
            handleUplabel(l.idLabel)
          })
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
            color:(disable_options)?'#666666':'',
            backgroundColor:(disable_options)?'#cccccc':''}}
          value={allLabelTitle()}
          onChange={evt => {
            const value=evt.target.value
            multi_selected_label.current.map(d => d.title = value)
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
            Object.values(data.labels).filter(f => multi_selected_label.current.map(d => d.idLabel).includes(f.idLabel))
              .forEach(n=>n.is_image=false)
            set_button_icon_or_image('zdt')
            reDrawOSPLabels(multi_selected_label.current)
            setForceUpdate(!forceUpdate)
          }}>Texte</Button>

        <Button
          disabled={disable_options}
          variant='menuconfigpanel_option_button'
          onClick={() => {

            Object.values(data.labels).filter(f => multi_selected_label.current.map(d => d.idLabel).includes(f.idLabel))
              .forEach(n=>n.is_image=true)

            set_button_icon_or_image('image')
            reDrawOSPLabels(multi_selected_label.current)
            setForceUpdate(!forceUpdate)

          }}>Image</Button></Box>
    </Box>

    {button_icon_or_image==='zdt'?content_wysiwyg:content_image}

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
            max={1000}
            isDisabled={disable_options}
            value={allLabelHeight()}
            onChange={evt => {
              multi_selected_label.current.map(d => d.label_height = +evt)

              reDrawOSPLabels(multi_selected_label.current)
              setForceUpdate(!forceUpdate)
            }}
          >
            <NumberInputField/>
            <NumberInputStepper>
              <NumberIncrementStepper/>
              <NumberDecrementStepper/>
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
            max={1000}
            isDisabled={disable_options}
            value={allLabelWidth()}
            onChange={evt => {
              multi_selected_label.current.map(d => d.label_width = +evt)

              reDrawOSPLabels(multi_selected_label.current)
              setForceUpdate(!forceUpdate)
            }}
          >
            <NumberInputField/>
            <NumberInputStepper>
              <NumberIncrementStepper/>
              <NumberDecrementStepper/>
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
          value={(multi_selected_label.current.length === 1) ? multi_selected_label.current[0].color : '#ffffff'}
          onChange={evt => {
            const val = evt.target.value
            multi_selected_label.current.map(d => d.color = val)

            reDrawOSPLabels(multi_selected_label.current)
            setForceUpdate(!forceUpdate)
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
              const value=+evt
              multi_selected_label.current.map(d => d.opacity = value)

              reDrawOSPLabels(multi_selected_label.current)
              setForceUpdate(!forceUpdate)
            }}
          >
            <NumberInputField/>
            <NumberInputStepper>
              <NumberIncrementStepper/>
              <NumberDecrementStepper/>
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
          disabled={!has_open_sankey_plus && !valAllLabelBorderTransparent }
          value={(multi_selected_label.current.length === 1) ? multi_selected_label.current[0].color_border : '#ffffff'}
          onChange={evt => {
            const val = evt.target.value
            multi_selected_label.current.map(d => d.color_border = val)

            reDrawOSPLabels(multi_selected_label.current)
            setForceUpdate(!forceUpdate)
          }}
        />

        <Checkbox
          variant='menuconfigpanel_part_title_1_checkbox'
          iconColor={valAllLabelBorderTransparent[1]?'#78C2AD':'white'}
          isDisabled={disable_options}
          isIndeterminate={valAllLabelBorderTransparent[1]}
          isChecked={valAllLabelBorderTransparent[0]}
          onChange={(evt) => {
            multi_selected_label.current.map(d => d.transparent_border = evt.target.checked)

            reDrawOSPLabels(multi_selected_label.current)
            setForceUpdate(!forceUpdate)
          }}>
          {t('LL.bt')}
        </Checkbox>
      </Box>
    </Box>
  </Box>

  return content_menu_zdt
}


export const context_zdt : context_zdtFType =(
  contextMenu,
  t:TFunction,
  applicationData,
  dict_hook_ref_setter_show_dialog_components,
  applicationState,
  ComponentUpdater,
  reDrawOSPLabels
)=>{
  const {data}=applicationData
  const {pointer_pos,contextualised_zdt}=(contextMenu as OSPContextMenuType)
  const {multi_selected_label}=applicationState
  const [zdt_to_contextualise, set_zdt_to_contextualise] = useState<OSPLabel>()
  const {updateComponentMenuConfigZdt} = ComponentUpdater
  contextualised_zdt.current=set_zdt_to_contextualise
  dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_zdt.current
  let style_c_zdd='0px 0px auto auto'
  if(zdt_to_contextualise){
    style_c_zdd=(pointer_pos.current[1]-20)+'px auto auto '+(pointer_pos.current[0]+10)+'px'
  }

  const valAllLabelBorderTransparent=IsAllZdtAttrSameValue(data,multi_selected_label.current,'transparent_border') as boolean[]

  const btn_mask_border=<Button onClick={()=>{
    multi_selected_label.current.forEach(zdt=>zdt.transparent_border=!valAllLabelBorderTransparent[0])
    set_zdt_to_contextualise(undefined)
    reDrawOSPLabels(multi_selected_label.current)
    updateComponentMenuConfigZdt.current.forEach(f=>f())
  }} variant='light'>{valAllLabelBorderTransparent[0]?t('LL.display_border'):t('LL.hide_border')}</Button>


  const btn_change_color=<>
    <Button variant='light'>
      <Form.Label  htmlFor="form_color_zdt">
        {t('LL.cfl')}
      </Form.Label></Button>
    <FormControl size='sm'
      type='color'
      id='form_color_zdt'
      name='form_color_zdt'
      style={{display:'none'}}
      value={(multi_selected_label.current.length === 1) ? multi_selected_label.current[0].color : '#ffffff'}
      onChange={evt => {
        const val = evt.target.value
        multi_selected_label.current.map(d => d.color = val)
        reDrawOSPLabels(multi_selected_label.current)
        updateComponentMenuConfigZdt.current.forEach(f=>f())
      }}
    />
  </>


  const button_open_layout=<Button onClick={()=>{
    dict_hook_ref_setter_show_dialog_components.ref_setter_show_menu_zdt.current!(true)
    set_zdt_to_contextualise(undefined)

  }} variant='light'>{t('Menu.LL')} {icon_open_modal}</Button>
  return zdt_to_contextualise?<Popover id="context_zdd_pop_over" style={{maxWidth:'100%',position:'absolute',inset:style_c_zdd}}>
    <Popover.Body >
      <ButtonGroup vertical>
        {btn_mask_border}
        {btn_change_color}
        {sep}
        {button_open_layout}
      </ButtonGroup>
    </Popover.Body>
  </Popover>:<></>
}

const icon_open_modal =<FontAwesomeIcon style={{float:'right'}} icon={faUpRightFromSquare} />

export const blur_ZDT_wysiwyg : blur_ZDT_wysiwygFType = (
  r_editor_ZDT:{current:ReactQuill}
)=>{
  if(r_editor_ZDT && r_editor_ZDT.current && (d3.select(document.activeElement)?.attr('class')?.includes('ql-editor')??false)){
    r_editor_ZDT.current.getEditor().focus()
    r_editor_ZDT.current.getEditor().blur()
  }
}

/**
 *  Function that return content_menu_zdt with JSX to imbricate it in the config menu
 *
 * @param {OSPData} data
 * @param {uiElementsRefType} uiElementsRef
 * @param {boolean} has_open_sankey_plus
 * @param {TFunction} t
 * @param {JSX.Element} content_menu_zdt
 * @return {*}
 */
export const ZDTMenuAsAccordeonItem:FunctionComponent<ZDTMenuAsAccordeonItemType>=({
  data,
  uiElementsRef,
  applicationContext,
  content_menu_zdt
})=>{
  // const {ref_nav_item_active,ref_setter_sub_nav_item_active,zdt_accordion_ref}=uiElementsRef
  const {t,has_open_sankey_plus} = applicationContext
  return <AccordionItem
    style={{ 'display': (data.accordeonToShow.includes('LL')) ? 'initial' : 'none' }}
  >
    <AccordionButton
      ref={uiElementsRef.zdt_accordion_ref as Ref<HTMLButtonElement>}
    >
      <Box
        as='span'
        layerStyle='submenuconfig_entry'
      >
        {t('Menu.LL')}
      </Box>
      {
        (!has_open_sankey_plus)?
          <OSTooltip label={t('Menu.sankeyOSPDisabled')} >
            <Badge pill
              bg="white"
              style={{marginLeft:'5px', fontSize:'1.3em'}}>
              <FontAwesomeIcon
                icon={faLock}
                style={{
                  color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
            </Badge>
          </OSTooltip>:
          <></>
      }
      <AccordionIcon/>
    </AccordionButton>
    <AccordionPanel>
      {content_menu_zdt}
    </AccordionPanel>
  </AccordionItem>
}