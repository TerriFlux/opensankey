import React from 'react'
import { Row, Form, FormControl, FormLabel, Col, FormCheck,Button, ButtonGroup,OverlayTrigger,Tooltip } from 'react-bootstrap'
import {  SankeyPlusData,SankeyPlusLabel} from './types'
import { MultiSelect } from 'react-multi-select-component'
import { FaAngleDown, FaAngleUp, FaMinus, FaPlus,FaBold,FaItalic, FaUnderline} from 'react-icons/fa'
import { TFunction } from 'i18next'
import Accordion from 'react-bootstrap/Accordion'
import ReactQuill,{Quill} from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import ImageResize from 'quill-image-resize-module-react'
Quill.register('modules/imageResize', ImageResize)

import {  preferenceCheck } from 'open-sankey/dist/SankeyMenuPreferences'

export const SankeyPlusMenuPreferenceLabels=(t:TFunction,data:SankeyPlusData,set_data:React.Dispatch<React.SetStateAction<SankeyPlusData>>)=>{
  return  (<Form.Check disabled={data.static_sankey} checked={data.accordeonToShow.includes('LL')} type="checkbox" label={t('Menu.LL')} onChange={() => {
    preferenceCheck('LL',data)
    set_data({ ...data })
  }} />)
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
  is_activated:boolean
) => {


  const tmplabel = Object.fromEntries(Object.entries(data.labels).sort(([, a], [, b]) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0)))
  const INITIAL_OPTIONS_label = Object.values(tmplabel).map((d) => { return { 'label': d.name, 'value': d.idLabel } })
  const selected_label = multi_selected_label.current.map((d) => { return { 'label': d.name, 'value': d.idLabel } })

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
      <div id='DD_multi_label'>


        <MultiSelect
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
    return (display_size) ? size : -1
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
    return (display_size) ? size : -1
  }
  const allLabelAsHTML = () => {
    let isHTML = false

    multi_selected_label.current.map((d) => {
      isHTML = (d.isTextHTML) ? true : isHTML
    })
    return isHTML
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

  const allNodeLabelVert = (arg: string, pos: string) => {
    let all_same = true
    if (multi_selected_label.current.length > 0) {
      if (arg === 'vert') {
        multi_selected_label.current.map(d => all_same = (d.position_vert !== pos) ? false : all_same)
      } else if (arg === 'horiz') {
        multi_selected_label.current.map(d => all_same = (d.position_horiz !== pos) ? false : all_same)
      }
    } else {
      all_same = false
    }
    return all_same
  }


  const allLabelFontSize = () => {
    let display_size = true
    let size = 1
    if (multi_selected_label.current.length !== 0) {
      size = multi_selected_label.current[0].font_size
    }
    multi_selected_label.current.map((d) => {
      display_size = (d.font_size === size) ? display_size : false
    })
    return (display_size) ? size : -1
  }

  const allLabelTextBold = () => {
    let bold = false

    multi_selected_label.current.map((d) => {
      bold = (d.font_weight) ? true : bold
    })
    return bold
  }

  const allLabelTextItalic = () => {
    let italic = false

    multi_selected_label.current.map((d) => {
      italic = (d.font_style) ? true : italic
    })
    return italic
  }

  const allLabelTextUpper = () => {
    let up = false

    multi_selected_label.current.map((d) => {
      up = (d.font_uppercase) ? true : up
    })
    return up
  }
  const allLabelTextUnderlined = () => {
    let und = false

    multi_selected_label.current.map((d) => {
      und = (d.underline) ? true : und
    })
    return und
  }

  const isAllEditRaw = () => {
    let visible = false
    multi_selected_label.current.map(d => visible = (d.is_edit_raw) ? true : visible)
    return visible
  }

  const modules = {
    toolbar: [
      [{ 'font': [] }],
      [{ 'header': [1, 2, 3, 4, 5, false] }],
      ['bold', 'italic', 'underline','strike'],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'color': [] }, { 'background': [] }],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      [{'align':[]}],

      ['image'],
      ['clean'],
    ],
    imageResize: {
      parchment: Quill.import('parchment'),
      modules: ['Resize', 'DisplaySize']
    }
  }

  const formats = ['font',
    'header','size',
    'bold', 'italic', 'underline', 'strike','color','background',
    'list', 'bullet','image','align'
  ]
  //Create 2 editor :
  // - one in an editor when we can apply layout width buttons
  // - one with raw html in case the editor can't do exactly what we want
  const editor_fo=<ReactQuill
    value={multi_selected_label.current.length>0?multi_selected_label.current[0].name:''}
    onChange={(evt) => {
      Object.values(data.labels).filter(f => multi_selected_label.current.map(d => d.idLabel).includes(f.idLabel)).map(d => {
        d.name =evt
      })
    }}
    onBlur={()=>{set_data({ ...data })}}
    theme="snow"
    modules={modules}
    formats={formats}
    readOnly={!is_activated}
  />
  const editor_fo_raw=<Form.Control
    as="textarea"
    rows={5}
    disabled={is_activated?multi_selected_label.current.length !== 1:true}
    value={multi_selected_label.current.length > 0 ? multi_selected_label.current[0].name : ''}
    onChange={
      (evt) => {
        multi_selected_label.current.map(label => label.name = evt.target.value)
        set_data({ ...data })
      }
    }
  />
  const svg_upper=<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><g><path d="M22,8V9.026A4.948,4.948,0,0,0,19,8a5,5,0,0,0,0,10,4.948,4.948,0,0,0,3-1.026V18h2V8Zm-3,8a3,3,0,1,1,3-3A3,3,0,0,1,19,16Z"/><path d="M12,18h2.236L7.118,3.764,0,18H2.236l2-4H10ZM5.236,12,7.118,8.236,9,12Z"/></g></svg>


  return <Accordion.Item
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
    <Accordion.Header>{t('Menu.LL')}</Accordion.Header>
    <Accordion.Body>
      <OverlayTrigger
        key={'textZoneDisabled'}
        placement={'top'}
        delay={500}
        overlay={(!is_activated)?(<Tooltip id={'textZoneDisabled'}>{t('Menu.sankeyPlusDisabled')} </Tooltip>):<></>}
      >
        <Form>
          <Form.Group as={Row}>
            <Col xs={1}>
              <Button size="sm"
                disabled={!is_activated}
                onClick={() => {
                  const new_label = {
                    idLabel: 'label_' + String(new Date().getTime()),
                    name: 'Text Label ...',
                    label_width: 100,
                    label_height: 25,
                    color: 'white',
                    color_border: 'black',
                    opacity: 100,
                    transparent_border: false,
                    position_vert: 'middle',
                    position_horiz: 'left',
                    font_size: 12,
                    font_weight: false,
                    font_style: false,
                    font_uppercase: false,
                    isTextHTML:false,
                    x: 50,
                    y: 50,
                    x_label: 50,
                    y_label: 12,
                    is_edit_raw:false,
                    underline:false
                  }
                  data.labels[new_label.idLabel] = new_label
                  multi_selected_label.current = [new_label]
                  set_data({ ...data })
                }
                }><FaPlus /></Button>
            </Col>
            <Col xs={7}>{dropdownMultiLabel()}</Col>
            <Col xs={1}>
              <Button size="sm" variant='danger'
                disabled={!is_activated}

                onClick={() => {
                  data.labels = Object.fromEntries(Object.entries(data.labels).filter(d => !multi_selected_label.current.map(l => l.idLabel).includes(d[0])))
                  multi_selected_label.current = []
                  set_data({ ...data })
                }
                }><FaMinus /></Button>
            </Col>
            <Col xs={2}>
              {//Boutton pour monter le label sélctionné
              }
              <ButtonGroup>
                <Button variant='info' disabled={is_activated?multi_selected_label.current.length !== 1:true}

                  onClick={() => {
                    multi_selected_label.current.map(l => {
                      handleDownlabel(l.idLabel)
                    })


                  }}><FaAngleUp /></Button>

                <Button variant='warning' disabled={is_activated?multi_selected_label.current.length !== 1:true}
                  onClick={() => {
                    multi_selected_label.current.map(l => {
                      handleUplabel(l.idLabel)
                    })


                  }}><FaAngleDown /></Button>
              </ButtonGroup>
            </Col>
          </Form.Group>
          <Form.Group as={Row}>
            {isAllEditRaw()?editor_fo_raw:editor_fo}
          </Form.Group>
          <Form.Group as={Row}>
            <Col xs={4}>
              <FormLabel style={{color:is_activated?'#555555':'#DADADA'}}>{t('LL.editorRaw')}</FormLabel>
            </Col>
            <Col xs={8}>
              <Form.Check
                inline
                type='switch'
                disabled={!is_activated}
                checked={is_activated?isAllEditRaw():true}
                onChange={evt => {
                  multi_selected_label.current.map(d => d.is_edit_raw = evt.target.checked)
                  set_data({ ...data })
                }}
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row}>
            <Col xs={4}>
              <FormLabel style={{color:is_activated?'#555555':'#DADADA'}}>{t('LL.textAsHTML')}</FormLabel>
            </Col>
            <Col xs={8}>
              <Form.Check
                inline
                type='switch'
                disabled={!is_activated}
                checked={is_activated?allLabelAsHTML():true}
                onChange={evt => {
                  multi_selected_label.current.map(d => d.isTextHTML = evt.target.checked)
                  set_data({ ...data })
                }}
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row}>
            <Col xs={4}>
              <FormLabel style={{color:is_activated?'#555555':'#DADADA'}}>{t('LL.hl')}</FormLabel>
            </Col>
            <Col xs={8}>
              <FormControl size='sm'
                min={0}
                max={1000}
                disabled={!is_activated}

                type={'number'}
                value={allLabelHeight()}
                onChange={evt => {
                  multi_selected_label.current.map(d => d.label_height = +evt.target.value)
                  set_data({ ...data })
                }}
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row}>
            <Col xs={4}>
              <FormLabel style={{color:is_activated?'#555555':'#DADADA'}}>{t('LL.ll')}</FormLabel>
            </Col>
            <Col xs={8}>
              <FormControl size='sm'
                min={0}
                max={1000}
                type={'number'}
                disabled={!is_activated}
                value={allLabelWidth()}
                onChange={evt => {
                  multi_selected_label.current.map(d => d.label_width = +evt.target.value)
                  set_data({ ...data })
                }}
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row}>
            <Col xs={4}>
              <FormLabel style={{color:is_activated?'#555555':'#DADADA'}}>{t('LL.ft')}</FormLabel>
            </Col>
            <Col xs={5}>
              <Form.Range
                max={100}
                min={0}
                step={1}
                disabled={!is_activated}
                value={allLabelTransparent()}
                onChange={evt => {
                  const value=+evt.target.value
                  multi_selected_label.current.map(d => d.opacity = value)
                  set_data({ ...data })


                }}
              />
            </Col>
            <Col xs={3}>
              <Form.Control
                type='number'
                max={100}
                min={0}
                step={1}
                disabled={!is_activated}
                value={allLabelTransparent()}

                onChange={evt => {
                  const value=+evt.target.value
                  multi_selected_label.current.map(d => d.opacity = value)
                  set_data({ ...data })
                }}
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row}>
            <Col xs={4}>
              <FormLabel style={{color:is_activated?'#555555':'#DADADA'}}>{t('LL.cfl')}</FormLabel>
            </Col>
            <Col xs={8}>
              <FormControl size='sm'
                type='color'
                disabled={!is_activated}
                value={(multi_selected_label.current.length === 1) ? multi_selected_label.current[0].color : '#ffffff'}
                onChange={evt => {
                  const val = evt.target.value
                  multi_selected_label.current.map(d => d.color = val)
                  set_data({ ...data })
                }}
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row}>
            <Col xs={4}>
              <FormLabel style={{color:is_activated?'#555555':'#DADADA'}}>{t('LL.bt')}</FormLabel>
            </Col>
            <Col xs={8}>
              <Form.Check
                inline
                type='switch'
                disabled={!is_activated}
                checked={allLabelBorderTransparent()}
                onChange={evt => {
                  multi_selected_label.current.map(d => d.transparent_border = evt.target.checked)
                  set_data({ ...data })
                }}
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row}>
            <Col xs={4}>
              <FormLabel style={{color:is_activated?'#555555':'#DADADA'}}>{t('LL.cbl')}</FormLabel>
            </Col>
            <Col xs={8}>
              <FormControl size='sm'
                type='color'
                disabled={!is_activated}
                value={(multi_selected_label.current.length === 1) ? multi_selected_label.current[0].color_border : '#ffffff'}
                onChange={evt => {
                  const val = evt.target.value
                  multi_selected_label.current.map(d => d.color_border = val)
                  set_data({ ...data })
                }}
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row}>
            <Col xs={4}>
              <FormLabel style={{color:(is_activated?!allLabelAsHTML():false)?'#555555':'#DADADA'}}  >{t('LL.pvt')}</FormLabel>
            </Col>
            <Col>
              <FormCheck
                disabled={is_activated?allLabelAsHTML():true}
                type='radio'
                label={t('Noeud.labels.haut')}
                checked={allNodeLabelVert('vert', 'top')}
                onChange={
                  () => {
                    multi_selected_label.current.map(d => {
                      d.position_vert = 'top'
                    })

                    set_data({ ...data })
                  }
                }
              />
            </Col>
            <Col>
              <FormCheck
                disabled={is_activated?allLabelAsHTML():true}
                type='radio'
                label={t('Noeud.labels.Milieu')}
                checked={allNodeLabelVert('vert', 'middle')}
                onChange={
                  () => {
                    multi_selected_label.current.map(d => {
                      d.position_vert = 'middle'
                    })
                    set_data({ ...data })
                  }
                }
              />
            </Col>
            <Col>
              <FormCheck
                disabled={is_activated?allLabelAsHTML():true}
                type='radio'
                label={t('Noeud.labels.Bas')}

                checked={allNodeLabelVert('vert', 'bottom')}
                onChange={
                  () => {
                    multi_selected_label.current.map(d => {
                      d.position_vert = 'bottom'
                    })
                    set_data({ ...data })
                  }
                }
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row}>
            <Col xs={4}>
              <FormLabel style={{color:(is_activated?!allLabelAsHTML():false)?'#555555':'#DADADA'}}  >{t('LL.at')}</FormLabel>
            </Col>
            <Col>
              <FormCheck
                disabled={is_activated?allLabelAsHTML():true}
                type='radio'
                label={t('Noeud.labels.gauche')}
                checked={allNodeLabelVert('horiz', 'left')}
                onChange={
                  () => {
                    multi_selected_label.current.map(d => {
                      d.position_horiz = 'left'
                    })

                    set_data({ ...data })
                  }
                }
              />
            </Col>
            <Col>
              <FormCheck
                disabled={is_activated?allLabelAsHTML():true}
                type='radio'
                label={t('LL.centre')}
                checked={allNodeLabelVert('horiz', 'centre')}
                onChange={
                  () => {
                    multi_selected_label.current.map(d => {
                      d.position_horiz = 'centre'
                    })
                    set_data({ ...data })
                  }
                }
              />
            </Col>
            <Col>
              <FormCheck
                disabled={is_activated?allLabelAsHTML():true}
                type='radio'
                label={t('Noeud.labels.droite')}

                checked={allNodeLabelVert('horiz', 'right')}
                onChange={
                  () => {
                    multi_selected_label.current.map(d => {
                      d.position_horiz = 'right'
                    })
                    set_data({ ...data })
                  }
                }
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row}>
            <Col xs={4}>
              <FormLabel style={{color:(is_activated?!allLabelAsHTML():false)?'#555555':'#DADADA'}} >{t('Noeud.labels.tp')}</FormLabel>
            </Col>
            <Col xs={8}>
              <FormControl size='sm'
                disabled={is_activated?allLabelAsHTML():true}
                min={0}
                max={100}
                type={'number'}
                value={allLabelFontSize()}
                onChange={evt => {
                  let val = +evt.target.value
                  val = (val <= 0) ? 1 : val
                  multi_selected_label.current.map(d => d.font_size = val)
                  set_data({ ...data })
                }}
              />
            </Col>
          </Form.Group>
          <Form.Group as={Row} >
            <Col xs={4}>
              <FormLabel style={{color:(is_activated?!allLabelAsHTML():false)?'#555555':'#DADADA'}}  >{t('LL.labels')}</FormLabel>
            </Col>
            <ButtonGroup as={Col} xs={8}>
              <Button
                disabled={is_activated?allLabelAsHTML():true}
                variant={allLabelTextBold()?'dark':'outline-dark'}
                onClick={
                  () => {
                    Object.values(data.labels).filter(l=>multi_selected_label.current.includes(l)).forEach(d => d.font_weight = !multi_selected_label.current[0].font_weight)
                    set_data({ ...data })
                  }
                }
              ><FaBold/></Button>
              <Button
                disabled={is_activated?allLabelAsHTML():true}
                variant={allLabelTextUpper()?'dark':'outline-dark'}
                onClick={
                  () => {
                    Object.values(data.labels).filter(l=>multi_selected_label.current.includes(l)).map(d => d.font_uppercase = !multi_selected_label.current[0].font_uppercase)
                    set_data({ ...data })
                  }
                }
              >{svg_upper}</Button>
              <Button
                disabled={is_activated?allLabelAsHTML():true}
                variant={allLabelTextItalic()?'dark':'outline-dark'}
                onClick={
                  () => {
                    Object.values(data.labels).filter(l=>multi_selected_label.current.includes(l)).forEach(d => d.font_style = !multi_selected_label.current[0].font_style)
                    set_data({ ...data })
                  }
                }
              ><FaItalic/></Button>
              <Button
                disabled={is_activated?allLabelAsHTML():true}
                variant={allLabelTextUnderlined()?'dark':'outline-dark'}
                onClick={
                  () => {
                    Object.values(data.labels).filter(l=>multi_selected_label.current.includes(l)).forEach(d => d.underline = !multi_selected_label.current[0].underline)
                    set_data({ ...data })
                  }
                }
              ><FaUnderline/></Button>
            </ButtonGroup>
            
          </Form.Group>
        </Form></OverlayTrigger>
    </Accordion.Body>
  </Accordion.Item>


}
