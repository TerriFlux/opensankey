// ==================================================================================================
// Modal — animated/sequence export configuration (GIF / WebM / PNG zip).
// Triggered from the export menu via menu_configuration_osp.ref_show_modal_animated_export.
// Uses the OSP draggable pattern (Box + react-draggable) instead of Chakra Modal so the
// dialog can be moved out of the way while editing options.
//
// Two sources are supported:
//   - 'views'  : one frame per view (default, original behaviour).
//   - <grp id> : one frame per tag of a 'sequence'-banner data-tag group.
// ==================================================================================================

import React, { FC, useEffect, useRef, useState } from 'react'
import Draggable, { DraggableProps } from 'react-draggable'

// react-draggable : les typings embarqués rendent les props optionnelles, mais
// @types/react-draggable (tiré par la résolution fraîche du CI) les rend requises.
// On relâche le type ici pour que le build passe quelle que soit la source des typings.
const DraggableComponent = Draggable as unknown as React.ComponentClass<Partial<DraggableProps>>
import {
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  CloseButton,
  RadioGroup,
  Radio,
  Stack,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  IconButton,
  Text,
  HStack,
  VStack,
  FormControl,
  FormLabel,
  Table,
  Tbody,
  Tr,
  Td,
} from '@chakra-ui/react'
import { ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons'

import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'
import { Class_DataTagGroup } from 'open-sankey/src/types/TagGroup'
import { default_main_sankey_id } from 'open-sankey/src/types/Utils'
import { default_export_dpi, Type_ExportDPI } from 'open-sankey/src/Elements/ElementsAttributesConfig'
import {
  exportAnimatedSequence,
  exportAnimatedDataTagSequence,
  AnimExportFormat,
  AnimExportLoopMode,
} from './SankeyExportsOSP'

interface Props {
  app_data: Class_ApplicationDataOSP
}

// Special source id => iterate the views. Anything else is a data-tag group id.
const VIEWS_SOURCE = 'views'

export const ModalAnimatedExportOSP: FC<Props> = ({ app_data }) => {
  const [is_open, setIsOpen] = useState(false)
  const [source, setSource] = useState<string>(VIEWS_SOURCE)
  const [item_ids, setItemIds] = useState<string[]>([])
  const [included, setIncluded] = useState<Set<string>>(new Set())
  const [format, setFormat] = useState<AnimExportFormat>('gif')
  const [delay_ms, setDelayMs] = useState<number>(1500)
  const [dpi, setDpi] = useState<Type_ExportDPI>(default_export_dpi)
  const [loop_mode, setLoopMode] = useState<AnimExportLoopMode>('loop')
  const [running, setRunning] = useState(false)
  const node_ref = useRef<HTMLDivElement>(null)

  // Bind the open setter so the menu item can call ref.current(true).
  app_data.menu_configuration_osp.ref_show_modal_animated_export.current = setIsOpen

  // Sequence-type data-tag groups available as an animation source.
  const sequence_groups = app_data.drawing_area.sankey
    .getTagGroupsAsList('data_taggs')
    .filter((g) => (g as Class_DataTagGroup).banner === 'sequence') as Class_DataTagGroup[]

  // Ordered item ids for a given source ('views' => views_order, else the group's tags).
  const itemsForSource = (src: string): string[] => {
    if (src === VIEWS_SOURCE) return [...app_data.views_order]
    const grp = sequence_groups.find((g) => g.id === src)
    return grp ? grp.tags_list.map((t) => t.id) : []
  }

  // Refresh source + item list each time the modal opens (views/sequences may have changed).
  useEffect(() => {
    if (!is_open) return
    const default_source = app_data.views_order.length > 0
      ? VIEWS_SOURCE
      : (sequence_groups[0]?.id ?? VIEWS_SOURCE)
    const ids = itemsForSource(default_source)
    setSource(default_source)
    setItemIds(ids)
    setIncluded(new Set(ids))
  }, [is_open])

  // Escape closes the modal.
  useEffect(() => {
    if (!is_open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [is_open])

  if (!app_data.has_sankey_plus || !is_open) return <></>

  const changeSource = (src: string) => {
    const ids = itemsForSource(src)
    setSource(src)
    setItemIds(ids)
    setIncluded(new Set(ids))
  }

  const moveItem = (idx: number, dir: -1 | 1) => {
    const new_idx = idx + dir
    if (new_idx < 0 || new_idx >= item_ids.length) return
    const next = [...item_ids]
    ;[next[idx], next[new_idx]] = [next[new_idx], next[idx]]
    setItemIds(next)
  }

  const toggleIncluded = (id: string) => {
    const next = new Set(included)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setIncluded(next)
  }

  const getItemLabel = (id: string): string => {
    if (source === VIEWS_SOURCE) {
      if (id === default_main_sankey_id) return 'master'
      const name = app_data.views_dict[id]?.name
      return (name && name.length > 0) ? name : id
    }
    const grp = sequence_groups.find((g) => g.id === source)
    const tag = grp?.tags_list.find((t) => t.id === id)
    return (tag && tag.name.length > 0) ? tag.name : id
  }

  const is_views = source === VIEWS_SOURCE
  const selected_ids = item_ids.filter((id) => included.has(id))
  const can_run = selected_ids.length > 0 && !running
  const items_label = is_views ? 'Vues à inclure' : 'Étiquettes à inclure'

  const handleGenerate = () => {
    setRunning(true)
    const opts = { format, delay_ms, dpi, loop_mode }
    const run = is_views
      ? exportAnimatedSequence(app_data, selected_ids, opts)
      : exportAnimatedDataTagSequence(app_data, source, selected_ids, opts)
    app_data.sendWaitingToast(
      () => run.finally(() => setRunning(false)),
      {
        success: { title: 'Animation générée' },
        loading: { title: 'Génération en cours...' },
        error: { title: 'Échec génération' },
      }
    )
  }

  return (
    <DraggableComponent
      nodeRef={node_ref}
      handle='.modal-anim-handle'
      defaultPosition={{ x: window.innerWidth / 3, y: window.innerHeight / 6 }}
      bounds={{ left: 0, top: 0 }}
    >
      <Box
        ref={node_ref}
        position='absolute'
        width='440px'
        bg='white'
        boxShadow='lg'
        borderRadius='md'
        border='1px solid'
        borderColor='gray.300'
        zIndex={2000}
      >
        <HStack
          className='modal-anim-handle'
          justify='space-between'
          p={3}
          bg='gray.50'
          borderTopRadius='md'
          cursor='move'
          userSelect='none'
        >
          <Text fontWeight='bold'>Exporter une animation</Text>
          <CloseButton onClick={() => setIsOpen(false)} />
        </HStack>

        <Box p={4}>
          <VStack align='stretch' spacing={4}>
            {sequence_groups.length > 0 && (
              <FormControl>
                <FormLabel>Source de l'animation</FormLabel>
                <Select value={source} onChange={(e) => changeSource(e.target.value)}>
                  <option value={VIEWS_SOURCE}>Vues</option>
                  {sequence_groups.map((g) => (
                    <option key={g.id} value={g.id}>Séquence : {g.name}</option>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl>
              <FormLabel>Format</FormLabel>
              <RadioGroup value={format} onChange={(v) => setFormat(v as AnimExportFormat)}>
                <Stack direction='row' spacing={4}>
                  <Radio value='gif'>GIF animé</Radio>
                  <Radio value='webm'>WebM (vidéo)</Radio>
                  <Radio value='png_zip'>Séquence PNG (zip)</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>

            <FormControl>
              <FormLabel>{items_label} ({selected_ids.length}/{item_ids.length})</FormLabel>
              <Box
                maxH='220px'
                overflowY='auto'
                overflowX='hidden'
                border='1px solid'
                borderColor='gray.200'
                borderRadius='md'
                paddingRight='25px'
              >
                <Table size='sm' width='100%' style={{ tableLayout: 'auto' }}>
                  <Tbody>
                    {item_ids.map((id, idx) => {
                      const display_name = getItemLabel(id)
                      return (
                        <Tr key={id}>
                          <Td width='1%'>
                            <Checkbox
                              isChecked={included.has(id)}
                              onChange={() => toggleIncluded(id)}
                            />
                          </Td>
                          <Td title={id} wordBreak='break-word'>
                            {idx + 1}. {display_name}
                          </Td>
                          <Td width='1%' whiteSpace='nowrap'>
                            <IconButton
                              aria-label='Monter'
                              size='xs'
                              icon={<ChevronUpIcon />}
                              isDisabled={idx === 0}
                              onClick={() => moveItem(idx, -1)}
                              mr={1}
                            />
                            <IconButton
                              aria-label='Descendre'
                              size='xs'
                              icon={<ChevronDownIcon />}
                              isDisabled={idx === item_ids.length - 1}
                              onClick={() => moveItem(idx, 1)}
                            />
                          </Td>
                        </Tr>
                      )
                    })}
                  </Tbody>
                </Table>
              </Box>
            </FormControl>

            <HStack spacing={4} align='flex-start'>
              <FormControl>
                <FormLabel>Durée par image (ms)</FormLabel>
                <NumberInput
                  value={delay_ms}
                  min={100}
                  max={10000}
                  step={100}
                  onChange={(_, n) => { if (!isNaN(n)) setDelayMs(n) }}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>DPI</FormLabel>
                <Select value={dpi} onChange={(e) => setDpi(Number(e.target.value) as Type_ExportDPI)}>
                  <option value={150}>150 DPI</option>
                  <option value={300}>300 DPI</option>
                </Select>
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel>Boucle</FormLabel>
              <RadioGroup value={loop_mode} onChange={(v) => setLoopMode(v as AnimExportLoopMode)}>
                <Stack direction='row' spacing={4}>
                  <Radio value='once'>Une fois</Radio>
                  <Radio value='loop'>Boucle infinie</Radio>
                  <Radio value='pingpong'>Aller-retour</Radio>
                </Stack>
              </RadioGroup>
            </FormControl>
          </VStack>
        </Box>

        <HStack p={3} justify='flex-end' borderTop='1px solid' borderColor='gray.200' spacing={2}>
          <ButtonGroup>
            <Button variant='ghost' onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button colorScheme='blue' isDisabled={!can_run} isLoading={running} onClick={handleGenerate}>
              Générer
            </Button>
          </ButtonGroup>
        </HStack>
      </Box>
    </DraggableComponent>
  )
}
