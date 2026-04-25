// ==================================================================================================
// Modal — animated/sequence export configuration (GIF / WebM / PNG zip).
// Triggered from the export menu via menu_configuration_osp.ref_show_modal_animated_export.
// Uses the OSP draggable pattern (Box + react-draggable) instead of Chakra Modal so the
// dialog can be moved out of the way while editing options.
// ==================================================================================================

import React, { FC, useEffect, useRef, useState } from 'react'
import Draggable from 'react-draggable'
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
import { default_main_sankey_id } from '../deps/OpenSankey/types/Utils'
import { default_export_dpi, Type_ExportDPI } from '../deps/OpenSankey/Elements/ElementsAttributesConfig'
import { exportAnimatedSequence, AnimExportFormat, AnimExportLoopMode } from './SankeyExportsOSP'

interface Props {
  app_data: Class_ApplicationDataOSP
}

export const ModalAnimatedExportOSP: FC<Props> = ({ app_data }) => {
  const [is_open, setIsOpen] = useState(false)
  const [view_ids, setViewIds] = useState<string[]>([])
  const [included, setIncluded] = useState<Set<string>>(new Set())
  const [format, setFormat] = useState<AnimExportFormat>('gif')
  const [delay_ms, setDelayMs] = useState<number>(1500)
  const [dpi, setDpi] = useState<Type_ExportDPI>(default_export_dpi)
  const [loop_mode, setLoopMode] = useState<AnimExportLoopMode>('loop')
  const [running, setRunning] = useState(false)
  const node_ref = useRef<HTMLDivElement>(null)

  // Bind the open setter so the menu item can call ref.current(true).
  app_data.menu_configuration_osp.ref_show_modal_animated_export.current = setIsOpen

  // Refresh the view list each time the modal opens (views may have changed since last use).
  useEffect(() => {
    if (is_open) {
      const current_views = [...app_data.views_order]
      setViewIds(current_views)
      setIncluded(new Set(current_views))
    }
  }, [is_open])

  // Escape closes the modal.
  useEffect(() => {
    if (!is_open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [is_open])

  if (!app_data.has_sankey_plus || !is_open) return <></>

  const moveView = (idx: number, dir: -1 | 1) => {
    const new_idx = idx + dir
    if (new_idx < 0 || new_idx >= view_ids.length) return
    const next = [...view_ids]
    ;[next[idx], next[new_idx]] = [next[new_idx], next[idx]]
    setViewIds(next)
  }

  const toggleIncluded = (view_id: string) => {
    const next = new Set(included)
    if (next.has(view_id)) next.delete(view_id)
    else next.add(view_id)
    setIncluded(next)
  }

  const getViewLabel = (view_id: string): string => {
    if (view_id === default_main_sankey_id) return 'master'
    const name = app_data.views_dict[view_id]?.name
    return (name && name.length > 0) ? name : view_id
  }

  const selected_view_ids = view_ids.filter((id) => included.has(id))
  const can_run = selected_view_ids.length > 0 && !running

  const handleGenerate = () => {
    setRunning(true)
    app_data.sendWaitingToast(
      () => exportAnimatedSequence(app_data, {
        format,
        view_ids: selected_view_ids,
        delay_ms,
        dpi,
        loop_mode,
      }).finally(() => setRunning(false)),
      {
        success: { title: 'Animation générée' },
        loading: { title: 'Génération en cours...' },
        error: { title: 'Échec génération' },
      }
    )
  }

  return (
    <Draggable
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
              <FormLabel>Vues à inclure ({selected_view_ids.length}/{view_ids.length})</FormLabel>
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
                    {view_ids.map((view_id, idx) => {
                      const raw_name = app_data.views_dict[view_id]?.name
                      const display_name = (raw_name && raw_name.length > 0) ? raw_name : view_id
                      return (
                        <Tr key={view_id}>
                          <Td width='1%'>
                            <Checkbox
                              isChecked={included.has(view_id)}
                              onChange={() => toggleIncluded(view_id)}
                            />
                          </Td>
                          <Td title={view_id} wordBreak='break-word'>
                            {idx + 1}. {display_name}
                          </Td>
                          <Td width='1%' whiteSpace='nowrap'>
                            <IconButton
                              aria-label='Monter'
                              size='xs'
                              icon={<ChevronUpIcon />}
                              isDisabled={idx === 0}
                              onClick={() => moveView(idx, -1)}
                              mr={1}
                            />
                            <IconButton
                              aria-label='Descendre'
                              size='xs'
                              icon={<ChevronDownIcon />}
                              isDisabled={idx === view_ids.length - 1}
                              onClick={() => moveView(idx, 1)}
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
                <FormLabel>Durée par vue (ms)</FormLabel>
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
    </Draggable>
  )
}
