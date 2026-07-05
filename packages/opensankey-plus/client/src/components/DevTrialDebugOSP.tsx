// ==================================================================================================
// Dev-only debug panel for the OpenSankey+ trial / subscription flow.
// --------------------------------------------------------------------------------------------------
// Gated behind `has_sankey_dev` (wired in ModulesOSP). Lets a developer force any trial state,
// open each modal step on demand, and preview the subscribe CTA destination for both login states —
// without waiting 30 days or hand-editing localStorage.
//
// Rendered as a *draggable floating panel* (react-draggable), not a pure Chakra modal: the developer
// keeps it open while interacting with the diagram / banner behind it.
//
// Labels are intentionally hard-coded in French: this never ships to end users, so it skips i18n.
// ==================================================================================================

import React, { FC, useEffect, useRef, useState } from 'react'
import Draggable, { DraggableProps } from 'react-draggable'
import {
  Badge,
  Box,
  Button,
  CloseButton,
  Code,
  Divider,
  Flex,
  Grid,
  HStack,
  NumberInput,
  NumberInputField,
  Portal,
  Radio,
  RadioGroup,
  Stack,
  Text,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'

import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'
import {
  devClearExpiredAck,
  devResetTrial,
  devSetActive,
  devSetExpired,
  devSetOffered,
  getTrialState,
  hasExpiredBeenAcknowledged,
  markExpiredAcknowledged,
} from '../utils/trial'
import {
  devForceOpenTrialModal,
  devGetForceAccount,
  devSetForceAccount,
  goToCheckout,
  refreshTrialUI,
  resolveCheckoutDestination,
} from './ModalTrialOSP'

// react-draggable ships class-component typings that clash with our React 18 setup; cast once.
const DraggableComponent = Draggable as unknown as React.ComponentClass<Partial<DraggableProps>>

interface DevTrialDebugProps {
  app_data: Class_ApplicationDataOSP
}

// The panel no longer has its own toolbar button: it is opened on demand from the drawing-area
// right-click menu (dev-gated). Module-level listener registry, mirroring devForceOpenTrialModal.
const _open_listeners: Array<() => void> = []
export const devOpenTrialDebugPanel = (): void => {
  _open_listeners.forEach((fn) => { try { fn() } catch { /* ignore */ } })
}

const readRealHasAccount = (app_data: Class_ApplicationDataOSP): boolean =>
  !!(app_data as unknown as { login_component?: { has_account?: boolean } }).login_component?.has_account

const boolBadge = (value: boolean) => (
  <Badge colorScheme={value ? 'green' : 'gray'} variant='solid'>{value ? 'true' : 'false'}</Badge>
)

/** Small section title. */
const SectionTitle: FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text fontWeight='bold' fontSize='sm' mb='1.5' color='gray.700'>{children}</Text>
)

export const DevTrialDebugOSP: FC<DevTrialDebugProps> = ({ app_data }) => {
  const [open, setOpen] = useState(false)
  const [, setTick] = useState(0)
  const [days, setDays] = useState(5)
  const nodeRef = useRef(null)

  // Opened from the drawing-area right-click menu via devOpenTrialDebugPanel().
  useEffect(() => {
    const listener = () => setOpen(true)
    _open_listeners.push(listener)
    return () => {
      const i = _open_listeners.indexOf(listener)
      if (i >= 0) _open_listeners.splice(i, 1)
    }
  }, [])

  // Re-read the (mutated) state and re-render after every action.
  const refresh = () => setTick((n) => n + 1)
  const apply = (fn: () => void) => {
    fn()
    refreshTrialUI(app_data)
    refresh()
  }

  const st = getTrialState()
  const ack = hasExpiredBeenAcknowledged()
  const real_account = readRealHasAccount(app_data)
  const forced = devGetForceAccount()
  const account_mode = forced === null ? 'real' : (forced ? 'yes' : 'no')

  const onAccountMode = (mode: string) => {
    devSetForceAccount(mode === 'real' ? null : mode === 'yes')
    refresh()
  }

  const forceOpen = (kind: 'welcome' | 'expired') => {
    setOpen(false)
    devForceOpenTrialModal(kind)
  }

  const stateRows: Array<[string, React.ReactNode]> = [
    ['offered', boolBadge(st.is_offered)],
    ['started', boolBadge(st.is_started)],
    ['active', boolBadge(st.is_active)],
    ['expired', boolBadge(st.is_expired)],
    ['jours écoulés / restants', <Code key='d'>{st.days_elapsed} / {st.days_remaining}</Code>],
    ['expired_ack', boolBadge(ack)],
    ['licence OS+ réelle', boolBadge(app_data.has_real_sankey_plus_licence)],
    ['compte réel', boolBadge(real_account)],
  ]

  return (
    <>
      {open && (
        <Portal>
          <DraggableComponent
            nodeRef={nodeRef}
            handle='.dev-trial-handle'
            defaultPosition={{ x: Math.max(20, window.innerWidth / 2 - 220), y: 70 }}
          >
            <Box
              ref={nodeRef}
              position='fixed'
              top='0'
              left='0'
              zIndex={1500}
              bg='white'
              borderRadius='md'
              boxShadow='2xl'
              border='1px solid'
              borderColor='gray.300'
              width='440px'
              maxHeight='85vh'
              display='flex'
              flexDirection='column'
              overflow='hidden'
              fontSize='sm'
            >
              {/* Draggable title bar */}
              <Flex
                className='dev-trial-handle'
                bg='purple.600'
                color='white'
                px='3'
                py='2'
                cursor='grab'
                justify='space-between'
                align='center'
                _active={{ cursor: 'grabbing' }}
              >
                <Text fontWeight='bold' fontSize='sm'>Debug essai OpenSankey+</Text>
                <CloseButton size='sm' onClick={() => setOpen(false)} />
              </Flex>

              {/* Scrollable body */}
              <Box px='4' py='3' overflowY='auto'>
                <Stack spacing='3.5' divider={<Divider />}>

                  {/* État courant */}
                  <Box>
                    <SectionTitle>État courant</SectionTitle>
                    <Grid templateColumns='1fr auto' columnGap='3' rowGap='1.5' alignItems='center'>
                      {stateRows.map(([label, node]) => (
                        <React.Fragment key={label}>
                          <Text color='gray.600'>{label}</Text>
                          <Box justifySelf='end'>{node}</Box>
                        </React.Fragment>
                      ))}
                    </Grid>
                  </Box>

                  {/* Forcer un scénario */}
                  <Box>
                    <SectionTitle>Forcer un scénario</SectionTitle>
                    <Text fontSize='xs' color='gray.500' mb='2'>
                    Écrit le localStorage + rafraîchit menus/bannière. Pour le déclenchement auto des
                    modales au chargement, utilisez « Recharger » en bas.
                    </Text>
                    <Wrap spacing='2'>
                      <WrapItem><Button size='xs' variant='outline' onClick={() => apply(devResetTrial)}>Réinitialiser</Button></WrapItem>
                      <WrapItem><Button size='xs' variant='outline' onClick={() => apply(devSetOffered)}>Offert, non démarré</Button></WrapItem>
                      <WrapItem><Button size='xs' variant='outline' onClick={() => apply(devSetExpired)}>Essai expiré</Button></WrapItem>
                    </Wrap>
                    <HStack mt='2.5' spacing='2'>
                      <Text whiteSpace='nowrap'>Essai actif —</Text>
                      <NumberInput size='xs' w='16' min={0} max={st.duration_days} value={days}
                        onChange={(_s, n) => setDays(Number.isNaN(n) ? 0 : n)}>
                        <NumberInputField px='2' />
                      </NumberInput>
                      <Text whiteSpace='nowrap'>j. restants</Text>
                      <Button size='xs' colorScheme='blue' onClick={() => apply(() => devSetActive(days))}>Appliquer</Button>
                    </HStack>
                    <Wrap mt='2.5' spacing='2'>
                      <WrapItem><Button size='xs' variant='outline' onClick={() => apply(markExpiredAcknowledged)}>Marquer acquitté</Button></WrapItem>
                      <WrapItem><Button size='xs' variant='outline' onClick={() => apply(devClearExpiredAck)}>Dé-acquitter</Button></WrapItem>
                    </Wrap>
                  </Box>

                  {/* Ouvrir une étape */}
                  <Box>
                    <SectionTitle>Ouvrir une étape directement</SectionTitle>
                    <Wrap spacing='2'>
                      <WrapItem><Button size='xs' colorScheme='teal' onClick={() => forceOpen('welcome')}>Modale Bienvenue</Button></WrapItem>
                      <WrapItem><Button size='xs' colorScheme='teal' onClick={() => forceOpen('expired')}>Modale Expiré</Button></WrapItem>
                    </Wrap>
                  </Box>

                  {/* Tester le CTA */}
                  <Box>
                    <SectionTitle>CTA souscription</SectionTitle>
                    <RadioGroup value={account_mode} onChange={onAccountMode} size='sm'>
                      <Stack spacing='1'>
                        <Radio value='real'>Compte réel</Radio>
                        <Radio value='yes'>Forcer : avec compte</Radio>
                        <Radio value='no'>Forcer : sans compte</Radio>
                      </Stack>
                    </RadioGroup>
                    <HStack mt='2' spacing='2'>
                      <Text color='gray.600'>Destination :</Text>
                      <Code>{resolveCheckoutDestination(app_data)}</Code>
                    </HStack>
                    <Button size='xs' mt='2' colorScheme='orange' onClick={() => goToCheckout(app_data)}>
                    Naviguer vers le CTA
                    </Button>
                  </Box>

                </Stack>
              </Box>

              {/* Footer */}
              <Flex px='4' py='2' borderTop='1px solid' borderColor='gray.200' justify='flex-end' gap='2' bg='gray.50'>
                <Button size='xs' variant='ghost' onClick={() => window.location.reload()}>Recharger la page</Button>
                <Button size='xs' onClick={() => setOpen(false)}>Fermer</Button>
              </Flex>
            </Box>
          </DraggableComponent>
        </Portal>
      )}
    </>
  )
}
