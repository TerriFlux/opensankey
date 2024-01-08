import React,{useState,ChangeEvent, FunctionComponent} from 'react'
import { Row,
  Form,
  FormControl,
  Button,
  OverlayTrigger,
  Tooltip,
  InputGroup,
  Popover,
  ButtonGroup,
  Badge} from 'react-bootstrap'
import {  SankeyPlusContextMenuType, SankeyPlusData,SankeyPlusLabel} from '../types/Types'
import { MultiSelect } from 'react-multi-select-component'
import { FaAngleDown, FaAngleUp, FaMinus, FaPlus} from 'react-icons/fa'
import { TFunction } from 'i18next'
import Accordion from 'react-bootstrap/Accordion'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpRightFromSquare, faLock} from '@fortawesome/free-solid-svg-icons'
import { Quill } from 'react-quill'
import * as d3 from 'd3'

import {  preferenceCheck } from 'open-sankey/dist/lib/SankeyMenuPreferences'
import { Checkbox } from '@chakra-ui/react'
import { SmoothClasses} from 'open-sankey/dist/lib/SankeyUtils'
import { IsAllZdtAttrSameValue } from './SankeyPlusUtils'
import { SankeyPlusMenuConfigurationFreeLabelsFType, SankeyPlusMenuPreferenceLabelsFType, blur_ZDT_wysiwygFType, context_zdtFType } from '../types/SankeyPlusMenuConfigurationLabelsTypes'



export const SankeyPlusMenuPreferenceLabels : SankeyPlusMenuPreferenceLabelsFType = (
  t:TFunction,
  data:SankeyPlusData,
  set_data:(_:SankeyPlusData)=>void
)=>{
  return <InputGroup>
    <Checkbox 
      sx={SmoothClasses({})}
      maxW={'30%'}
      isChecked={data.accordeonToShow.includes('LL')}
      onChange={() => {
        preferenceCheck('LL',data)
        set_data({ ...data })
      }}>
      {t('Menu.LL')}
    </Checkbox>
  </InputGroup>
}

/**
 * Description placeholder
 *
 * @export
 * @typedef {selected_type}
 */
export interface selected_type  {'label':string;'value':string}

export const SankeyPlusMenuConfigurationFreeLabels : FunctionComponent<SankeyPlusMenuConfigurationFreeLabelsFType> = ({
  data,
  set_data,
  multi_selected_label,
  t,
  ref_nav_item_active,
  is_activated,
  menu_for_modal,
  editor_content_fo_zdt,
  set_editor_content_fo_zdt,
  refWysiwygZDT
}) => {
  const zdt_or_image=(multi_selected_label.current.length>0?(multi_selected_label.current[0].is_image===true?'image':'zdt'):'zdt')
  const tmplabel = Object.fromEntries(Object.entries(data.labels).sort(([, a], [, b]) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0)))
  const INITIAL_OPTIONS_label = Object.values(tmplabel).map((d) => { return { 'label': d.title, 'value': d.idLabel } })
  const selected_label = multi_selected_label.current.map((d) => { return { 'label': d.title, 'value': d.idLabel } })
  const [button_icon_or_image,set_button_icon_or_image]=useState<'zdt'|'image'>(zdt_or_image)

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
        width:'60%',zIndex:'3'}}
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
            set_data({...data})
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

  const formats = ['font','size',
    'bold', 'italic', 'underline', 'strike','color','background',
    'list', 'bullet','align'
  ]

  const disable_options = is_activated? (multi_selected_label.current.length === 0):true
  const isQuill_invalid=multi_selected_label.current.length>0?multi_selected_label.current[0].content!==editor_content_fo_zdt:false

  //Create 2 editor :
  // - one in an editor when we can apply layout width buttons
  // - one with raw html in case the editor can't do exactly what we want
  const editor_fo=<ReactQuill
    className='quill_editor'
    value={editor_content_fo_zdt}
    ref={refWysiwygZDT}
    onChange={(evt) => {
      set_editor_content_fo_zdt(evt)
    }}
    onBlur={()=>{
      Object.values(data.labels).filter(f => multi_selected_label.current.map(d => d.idLabel).includes(f.idLabel)).map(d => {
        d.content = editor_content_fo_zdt
      })
      set_data({...data})
    }}

    theme="snow"
    modules={modules}
    formats={formats}
    readOnly={disable_options}
    style={{
      color:(disable_options)?'#666666':'',
      backgroundColor:(disable_options)?'#cccccc':''}}
  />

  const content_wysiwyg=<Form>
    <Form className='FO_zdt_editeur'>
      <Form.Group>
        {editor_fo}
      </Form.Group>
      {/* <Button
        onClick={()=>{
          Object.values(data.labels).filter(f => multi_selected_label.current.map(d => d.idLabel).includes(f.idLabel)).map(d => {
            d.content = editor_content_fo_zdt
          })
          set_data({...data})
        }}
      >{t('Menu.updateFOZdd')}</Button> */}
      <Form.Control type='text' isInvalid={isQuill_invalid} style={{display:'none'}}/>
      <FormControl.Feedback type='invalid'>{t('MEP.onBlurNoEnter')}</FormControl.Feedback>

    </Form>


  </Form>

  const content_image=<>
    {/* Import image */}
    <OverlayTrigger
      key={'imageDisabled2'}
      placement={'top'}
      delay={500}
      overlay={(!disable_options)?(<Tooltip id={'imageDisabled2'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
    >
      <InputGroup>
        <InputGroup.Text
          style={{
            color:(disable_options)?'#666666':'',
            backgroundColor:(disable_options)?'#cccccc':'',
            width:'40%'}}
        >
          {t('Noeud.img_src')}
        </InputGroup.Text>

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

                set_data({...data})

              }
            })()
            reader.readAsDataURL(files[0])
          }}
        />

      </InputGroup>
    </OverlayTrigger>
  </>

  const content_menu_zdt=<>
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

              is_image:false,
              image_src:'',
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
          variant={disable_options?'outline-primary':'primary'}
          disabled={disable_options}
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
    <InputGroup key={'node_illustration_type'} >
      <InputGroup.Text style={{width:'40%',
        color:(disable_options)?'#666666':'',
        backgroundColor:(disable_options)?'#cccccc':'',
      }}>
        {t('Noeud.illustration_type')}
      </InputGroup.Text>
      <Button
        disabled={disable_options}
        className='btn_menu_config'
        style={{width:'30%'}}
        variant={button_icon_or_image==='zdt'?'primary':'outline-primary'}
        onClick={() => {
          Object.values(data.labels).filter(f => multi_selected_label.current.map(d => d.idLabel).includes(f.idLabel))
            .forEach(n=>n.is_image=false)
          set_button_icon_or_image('zdt')
          set_data({...data})
        }}>Texte</Button>

      <Button
        disabled={disable_options}
        className='btn_menu_config'
        style={{width:'30%'}}
        variant={button_icon_or_image==='image'?'primary':'outline-primary'}
        onClick={() => {

          Object.values(data.labels).filter(f => multi_selected_label.current.map(d => d.idLabel).includes(f.idLabel))
            .forEach(n=>n.is_image=true)

          set_button_icon_or_image('image')
          set_data({...data})

        }}>Image</Button>
    </InputGroup>

    {button_icon_or_image==='zdt'?content_wysiwyg:content_image}


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

      <Checkbox 
        sx={SmoothClasses({})}
        maxW={'50%'}
        iconColor={valAllLabelBorderTransparent[1]?'#78C2AD':'white'}
        isDisabled={disable_options}
        isIndeterminate={valAllLabelBorderTransparent[1]}
        isChecked={valAllLabelBorderTransparent[0]}
        onChange={(evt) => {
          multi_selected_label.current.map(d => d.transparent_border = evt.target.checked)
          set_data({ ...data })
        }}>
        {t('LL.bt')}
      </Checkbox>
    </InputGroup>
  </>

  return menu_for_modal?content_menu_zdt:<Accordion.Item
    key='9'
    id="LL"
    eventKey="7"
    style={{ 'display': (data.accordeonToShow.includes('LL')) ? 'block' : 'none' }}
    onClick={evt => {
      if (((evt.target as unknown) as { className: string }).className === 'accordion-button' && ref_nav_item_active.current === '7') {
        ref_nav_item_active.current = ''
      } else {
        ref_nav_item_active.current = '7'
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
      {content_menu_zdt}
    </Accordion.Body>
  </Accordion.Item>
}


export const context_zdt : context_zdtFType =(
  contextMenu,
  t:TFunction,
  set_show_menu_zdt:(b:boolean)=>void
)=>{
  // const {data,set_data}=dict_variable_application_data
  const {pointer_pos,contextualised_zdt}=(contextMenu as SankeyPlusContextMenuType)
  const [zdt_to_contextualise, set_zdt_to_contextualise] = useState<SankeyPlusLabel>()
  contextualised_zdt.current=set_zdt_to_contextualise
  let style_c_zdd='0px 0px auto auto'
  if(zdt_to_contextualise){
    style_c_zdd=(pointer_pos.current[1]-20)+'px auto auto '+(pointer_pos.current[0]+10)+'px'
  }

  const button_open_layout=<Button onClick={()=>{
    set_show_menu_zdt(true)
    set_zdt_to_contextualise(undefined)

  }} variant='light'>{t('Menu.LL')} {icon_open_modal}</Button>
  return zdt_to_contextualise?<Popover id="context_zdd_pop_over" style={{maxWidth:'100%',position:'absolute',inset:style_c_zdd}}>
    <Popover.Body >
      <ButtonGroup vertical>
        {button_open_layout}
      </ButtonGroup>
    </Popover.Body>
  </Popover>:<></>
}

const icon_open_modal =<FontAwesomeIcon style={{float:'right'}} icon={faUpRightFromSquare} />

export const blur_ZDT_wysiwyg : blur_ZDT_wysiwygFType = (
  refWysiwygZDT:{current:ReactQuill}
)=>{
  if(refWysiwygZDT && refWysiwygZDT.current && (d3.select(document.activeElement)?.attr('class')?.includes('ql-editor')??false)){
    refWysiwygZDT.current.getEditor().focus()
    refWysiwygZDT.current.getEditor().blur()
  }
}