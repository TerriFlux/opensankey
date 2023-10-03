import React from 'react'
import { Row, Form, FormControl, Button, OverlayTrigger,Tooltip, InputGroup, Popover, ButtonGroup, Badge} from 'react-bootstrap'
import {  SankeyPlusData,SankeyPlusLabel} from './types'
import { MultiSelect } from 'react-multi-select-component'
import { FaAngleDown, FaAngleUp, FaEye, FaEyeSlash, FaMinus, FaPlus} from 'react-icons/fa'
import { TFunction } from 'i18next'
import Accordion from 'react-bootstrap/Accordion'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { FaCheck} from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faUpRightFromSquare, faLock} from '@fortawesome/free-solid-svg-icons'


import {  preferenceCheck } from 'open-sankey/dist/SankeyMenuPreferences'

declare const window: Window &
typeof globalThis & {
  SankeyToolsStatic: boolean
}


export const SankeyPlusMenuPreferenceLabels=(t:TFunction,data:SankeyPlusData,set_data:React.Dispatch<React.SetStateAction<SankeyPlusData>>)=>{
  return <InputGroup>
    <InputGroup.Text style={{width:'20%'}}>{t('Menu.LL')}</InputGroup.Text>
    <Button style={{width:'10%'}} className='btn_menu_config' key='LL' disabled={(window.SankeyToolsStatic ? window.SankeyToolsStatic : false)} variant={data.accordeonToShow.includes('LL')?'primary':'outline-primary'} onClick={() => {
      preferenceCheck('LL',data)
      set_data({ ...data })
    }} >
      {data.accordeonToShow.includes('LL')?<FaEye/>:<FaEyeSlash/>}
    </Button>
  </InputGroup>
}



/**
 * Description placeholder
 *
 * @export
 * @typedef {selected_type}
 */
export interface selected_type  {'label':string;'value':string}

export const SankeyPlusMenuConfigurationFreeLabels = (
  data:SankeyPlusData,
  set_data:React.Dispatch<React.SetStateAction<SankeyPlusData>>,
  multi_selected_label:{current:SankeyPlusLabel[]},
  t: TFunction,
  forceUpdate:boolean,
  setForceUpdate:React.Dispatch<React.SetStateAction<boolean>>,
  nav_item_active:string,
  set_nav_item_active:React.Dispatch<React.SetStateAction<string>>,
  is_activated:boolean,
  menu_for_modal:boolean,
  editor_content_fo_zdt:string,
  set_editor_content_fo_zdt:(s:string)=>void,
) => {

  const tmplabel = Object.fromEntries(Object.entries(data.labels).sort(([, a], [, b]) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0)))
  const INITIAL_OPTIONS_label = Object.values(tmplabel).map((d) => { return { 'label': d.title, 'value': d.idLabel } })
  const selected_label = multi_selected_label.current.map((d) => { return { 'label': d.title, 'value': d.idLabel } })

  //Dépalce la place des labels libres sélectionnés vers le debut dans le tableau de flux de data
  //Permet donc de les déssiner après
  const handleUplabel = (i: string) => {
    const { labels } = data
    const listElmt = Object.keys(labels)
    const posElemt = listElmt.indexOf(i)
    listElmt.splice(posElemt, 1)
    listElmt.splice(posElemt - 1, 0, i)
    const new_cat: { [key: string]: SankeyPlusLabel } = {}
    listElmt.forEach(elt => {
      new_cat[elt] = labels[elt]
    })
    for (const member in labels) delete labels[member]
    Object.assign(labels, new_cat)
    set_data({ ...data })
  }


  //Dépalce la place des labels libres sélectionnés vers la fin dans le tableau de flux de data
  //Permet donc de les déssiner après
  const handleDownlabel = (i: string) => {
    const { labels } = data
    const listElmt = Object.keys(labels)
    const posElemt = listElmt.indexOf(i)
    listElmt.splice(posElemt, 1)
    listElmt.splice(posElemt + 1, 0, i)
    const new_cat: { [key: string]: SankeyPlusLabel } = {}
    listElmt.forEach(elt => {
      new_cat[elt] = labels[elt]
    })
    for (const member in labels) delete labels[member]
    Object.assign(labels, new_cat)
    set_data({ ...data })
  }

  //Renvoie le menue déroulant pour la sélection des labels libres
  const dropdownMultiLabel = () => {
    const DD = (
      <div id='DD_multi_label' style={{
        color:(!is_activated)?'#666666':'',
        backgroundColor:(!is_activated)?'#cccccc':'',
        width:'60%'}}
      >
        <MultiSelect
          disabled={!is_activated}
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
            setForceUpdate(!forceUpdate)
          }}
          labelledBy={'hello'}
        />
      </div>)
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
  const allLabelBorderTransparent = () => {
    let transparent = false

    multi_selected_label.current.map((d) => {
      transparent = (d.transparent_border) ? true : transparent
    })
    return transparent
  }
  const valAllLabelBorderTransparent=allLabelBorderTransparent()

  const modules = {
    toolbar: [
      [{ 'font': [] }],
      [{ 'header': [1, 2, 3, 4, 5, false] }],
      ['bold', 'italic', 'underline','strike'],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'color': [] }, { 'background': [] }],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      [{'align':[]}],
      ['clean'],
    ],
  }

  const formats = ['font',
    'header','size',
    'bold', 'italic', 'underline', 'strike','color','background',
    'list', 'bullet','align'
  ]

  const disable_options = !(is_activated && (multi_selected_label.current.length === 1))
  const disable_editor = !(is_activated && (multi_selected_label.current.length >= 1))
  //Create 2 editor :
  // - one in an editor when we can apply layout width buttons
  // - one with raw html in case the editor can't do exactly what we want
  const editor_fo=<ReactQuill
    value={editor_content_fo_zdt}
    onChange={(evt) => {
      set_editor_content_fo_zdt(evt)
    }}

    theme="snow"
    modules={modules}
    formats={formats}
    readOnly={disable_editor}
    style={{
      color:(disable_editor)?'#666666':'',
      backgroundColor:(disable_editor)?'#cccccc':''}}
  />

  const content_zdt=<Form>
    <Form.Group as={Row}>
      <InputGroup>
        <Button size="sm"
          style={{width:'10%'}}
          disabled={!is_activated}
          className='btn_menu_config'
          variant={is_activated?'outline-primary':'primary'}
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
              
              x: 50,
              y: 50,
            }
            data.labels[new_label.idLabel] = new_label
            multi_selected_label.current = [new_label]
            set_data({ ...data })
          }
          }><FaPlus /></Button>

        {dropdownMultiLabel()}

        <Button size="sm"
          style={{width:'10%'}}
          className='btn_menu_config'
          variant={disable_editor?'outline-primary':'primary'}
          disabled={disable_editor}
          onClick={() => {
            data.labels = Object.fromEntries(Object.entries(data.labels).filter(d => !multi_selected_label.current.map(l => l.idLabel).includes(d[0])))
            multi_selected_label.current = []
            set_data({ ...data })
          }
          }><FaMinus /></Button>

        {//Boutton pour monter le label sélctionné
        }

        <Button
          style={{width:'10%'}}
          className='btn_menu_config'
          variant={disable_options?'primary':'outline-primary'}
          disabled={disable_options}
          onClick={() => {
            multi_selected_label.current.map(l => {
              handleDownlabel(l.idLabel)
            })
          }}><FaAngleUp /></Button>

        <Button
          style={{width:'10%'}}
          className='btn_menu_config'
          variant={disable_options?'primary':'outline-primary'}
          disabled={disable_options}
          onClick={() => {
            multi_selected_label.current.map(l => {
              handleUplabel(l.idLabel)
            })
          }}><FaAngleDown /></Button>
      </InputGroup>
    </Form.Group>

    <InputGroup>
      <InputGroup.Text
        style={{
          color:(disable_options)?'#666666':'',
          backgroundColor:(disable_options)?'#cccccc':'',
          width:'20%'}}>
        {t('LL.title')}
      </InputGroup.Text>
      <Form.Control
        type='text'
        max={100}
        disabled={disable_options}
        style={{
          color:(disable_options)?'#666666':'',
          backgroundColor:(disable_options)?'#cccccc':''}}
        value={allLabelTitle()}
        onChange={evt => {
          const value=evt.target.value
          multi_selected_label.current.map(d => d.title = value)
          set_data({ ...data })
        }}
      />
    </InputGroup>

    <Form className='FO_zdt_editeur'>
      <Form.Group>
        {editor_fo}
      </Form.Group>
      <Button
        onClick={()=>{
          Object.values(data.labels).filter(f => multi_selected_label.current.map(d => d.idLabel).includes(f.idLabel)).map(d => {
            d.content = editor_content_fo_zdt
          })
          set_data({...data})
        }}
      >{t('Menu.updateFOZdd')}</Button>
    </Form>

    <InputGroup>
      <InputGroup.Text
        style={{
          color:(disable_options)?'#666666':'',
          backgroundColor:(disable_options)?'#cccccc':'',
          width:'20%'}}>
        {t('LL.hl')}</InputGroup.Text>
      <FormControl
        style={{
          color:(disable_options)?'#666666':'',
          backgroundColor:(disable_options)?'#cccccc':'',
          width:'30%'}}
        min={0}
        max={1000}
        disabled={disable_options}
        type={'number'}
        value={allLabelHeight()}
        onChange={evt => {
          multi_selected_label.current.map(d => d.label_height = +evt.target.value)
          set_data({ ...data })
        }}
      />

      <InputGroup.Text
        style={{
          color:(disable_options)?'#666666':'',
          backgroundColor:(disable_options)?'#cccccc':'',
          width:'20%'}}>
        {t('LL.ll')}
      </InputGroup.Text>
      <FormControl
        style={{
          color:(disable_options)?'#666666':'',
          backgroundColor:(disable_options)?'#cccccc':'',
          width:'30%'}}
        min={0}
        max={1000}
        type={'number'}
        disabled={disable_options}
        value={allLabelWidth()}
        onChange={evt => {
          multi_selected_label.current.map(d => d.label_width = +evt.target.value)
          set_data({ ...data })
        }}
      />
    </InputGroup>

    <InputGroup>
      <InputGroup.Text
        style={{
          color:disable_options?'#666666':'',
          backgroundColor:disable_options?'#cccccc':'',
          width:'30%'}}>
        {t('LL.cfl')}
      </InputGroup.Text>
      <Form.Label
        htmlFor="form_color_zdt"
        style={{
          width:'20%',
          background:(is_activated && (multi_selected_label.current.length === 1)) ? multi_selected_label.current[0].color : '#cccccc',
          border:'1px solid #ced4da',
        }}/>
      <FormControl size='sm'
        type='color'
        id='form_color_zdt'
        name='form_color_zdt'
        disabled={disable_options}
        style={{display:'none'}}
        value={(multi_selected_label.current.length === 1) ? multi_selected_label.current[0].color : '#ffffff'}
        onChange={evt => {
          const val = evt.target.value
          multi_selected_label.current.map(d => d.color = val)
          set_data({ ...data })
        }}
      />

      <InputGroup.Text
        style={{
          color:disable_options?'#666666':'',
          backgroundColor:disable_options?'#cccccc':'',
          width:'30%'}}>
        {t('LL.ft')}
      </InputGroup.Text>
      <Form.Control
        style={{
          color:disable_options?'#666666':'',
          backgroundColor:disable_options?'#cccccc':'',
          width:'20%'}}
        type='number'
        max={100}
        min={0}
        step={1}
        disabled={disable_options}
        value={allLabelTransparent()}
        onChange={evt => {
          const value=+evt.target.value
          multi_selected_label.current.map(d => d.opacity = value)
          set_data({ ...data })
        }}
      />
    </InputGroup>

    <InputGroup>
      <InputGroup.Text
        style={{
          color:disable_options?'#666666':'',
          backgroundColor:disable_options?'#cccccc':'',
          width:'30%'}}>
        {t('LL.cbl')}
      </InputGroup.Text>
      <Form.Label
        htmlFor="form_color_border_zdt"
        style={{
          width:'20%',
          background:(is_activated && (multi_selected_label.current.length === 1)) ? multi_selected_label.current[0].color_border : '#cccccc',
          border:'1px solid #ced4da',
        }}/>
      <FormControl size='sm'
        type='color'
        style={{display:'none'}}
        id='form_color_border_zdt'
        name='form_color_border_zdt'
        disabled={!is_activated && !valAllLabelBorderTransparent }
        value={(multi_selected_label.current.length === 1) ? multi_selected_label.current[0].color_border : '#ffffff'}
        onChange={evt => {
          const val = evt.target.value
          multi_selected_label.current.map(d => d.color_border = val)
          set_data({ ...data })
        }}
      />

      <InputGroup.Text style={{
        color:disable_options?'#666666':'',
        backgroundColor:disable_options?'#cccccc':'',
        width:'30%'}}>
        {t('LL.bt')}
      </InputGroup.Text>

      <Button
        className='btn_menu_config'
        style={{
          color:disable_options?'#666666':'',
          backgroundColor:disable_options?'#cccccc':'',
          width:'20%'}}
        disabled={disable_options}
        variant={valAllLabelBorderTransparent?'outline-primary':'primary'}
        onClick={() => {
          multi_selected_label.current.map(d => d.transparent_border = !valAllLabelBorderTransparent)
          set_data({ ...data })
        }}
      >{valAllLabelBorderTransparent?<FaCheck/>:<FontAwesomeIcon icon={faXmark}/>}</Button>
    </InputGroup>
  </Form>

  return menu_for_modal?content_zdt:<Accordion.Item
    key='9'
    id="LL"
    eventKey="7"
    style={{ 'display': (data.accordeonToShow.includes('LL')) ? 'block' : 'none' }}
    onClick={evt => {
      if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && nav_item_active === '7') {
        set_nav_item_active('')
      } else {
        set_nav_item_active('7')
      }
    }}
  >
    <Accordion.Header>
      {t('Menu.LL')}
      {(!is_activated)?
        <OverlayTrigger
          key={'textZoneDisabled'}
          placement={'top'}
          delay={500}
          overlay={<Tooltip id={'textZoneDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>}
        >
          <Badge pill
            bg="white"
            style={{marginLeft:'5px', fontSize:'1.3em'}}>
            <FontAwesomeIcon
              icon={faLock}
              style={{
                color: 'rgba(var(--bs-info-rgb), var(--bs-bg-opacity))'}} />
          </Badge>
        </OverlayTrigger>:<></>}
    </Accordion.Header>
    <Accordion.Body>
      {content_zdt}
    </Accordion.Body>
  </Accordion.Item>
}


export const context_zdt=(show_context_zdt:boolean,set_show_context_zdt:(b:boolean)=>void,
  pointer_pos:{current:number[]},
  t:TFunction,
  set_show_menu_zdt:(b:boolean)=>void
)=>{

  let style_c_zdd='0px 0px auto auto'
  if(show_context_zdt){
    style_c_zdd=(pointer_pos.current[1]-20)+'px auto auto '+(pointer_pos.current[0]+10)+'px'
  }

  const button_open_layout=<Button onClick={()=>{
    set_show_menu_zdt(true)
    set_show_context_zdt(false)

  }} variant='light'>{t('Menu.LL')} {icon_open_modal}</Button>
  return show_context_zdt?<Popover id="context_zdd_pop_over" style={{maxWidth:'100%',position:'absolute',inset:style_c_zdd}}>
    <Popover.Body >
      <ButtonGroup vertical>
        {button_open_layout}
      </ButtonGroup>
    </Popover.Body>
  </Popover>:<></>
}

const icon_open_modal=<FontAwesomeIcon style={{float:'right'}} icon={faUpRightFromSquare} />
