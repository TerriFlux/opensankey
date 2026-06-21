// ==================================================================================================
// Modal — publication d'un site statique autonome (zip).
// Déclenché depuis le menu export via menu_configuration_osp.ref_show_modal_publish.
// Pattern draggable OSP (Box + react-draggable) plutôt que Chakra Modal pur.
//
// Deux sources :
//   - 'current' : l'étude ouverte dans l'app (app_data.toJSON()) -> POST /api/publish/current
//   - 'folder'  : un dossier déjà déployé côté serveur -> POST /api/publish/folder
// Le serveur recopie tout le build React compilé dans le zip : le site est autonome.
//
// Les options viewer exposées proviennent de la source de vérité
// deps/OpenSankey/types/PublishOptions.tsx (SankeyGlobals / getPublishOptions).
// Elles sont envoyées au serveur dans options.globals et émises telles quelles
// dans window.sankey du index.html publié.
// ==================================================================================================

import React, { FC, useEffect, useRef, useState } from 'react'
import Draggable, { DraggableProps } from 'react-draggable'

// react-draggable : on relâche le type comme dans ModalAnimatedExportOSP pour que
// le build passe quelle que soit la source des typings (embarqués vs @types).
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
  Input,
  Text,
  HStack,
  VStack,
  FormControl,
  FormLabel,
  Spinner,
  Divider,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  Portal,
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'

import FileSaver from 'file-saver'

import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'
import { Type_PositionMode } from '../deps/OpenSankey/types/PublishOptions'

interface Props {
  app_data: Class_ApplicationDataOSP
}

type PublishSource = 'current' | 'folder'

// Descripteur d'une option booléenne window.sankey (label + défaut = getPublishOptions).
type FlagOpt = { key: string, label: string, def: boolean }

// Groupes d'options, dans l'ordre d'affichage. Défauts alignés sur getPublishOptions().
const OPTION_GROUPS: Array<{ title: string, options: FlagOpt[] }> = [
  {
    title: 'Mode',
    options: [
      { key: 'editable', label: 'Édition réactivée (menus de configuration)', def: false },
    ],
  },
  {
    title: 'Interface',
    options: [
      { key: 'topbar', label: 'Barre du haut (topbar)', def: true },
      { key: 'edit_button', label: 'Bouton « Éditer » (renvoi vers open-sankey.fr)', def: true },
      { key: 'footer', label: 'Pied de page', def: false },
      { key: 'toolbar', label: "Barre d'outils — modes de position (absolu/proportionnel/échelle)", def: false },
      { key: 'fit_toolbar', label: "Barre d'outils — ajustement / verrous / plein écran", def: false },
      { key: 'embedded', label: 'Mode intégré (hauteur 100 %)', def: false },
      { key: 'recenter', label: 'Recentrage automatique à l’ouverture', def: true },
    ],
  },
  {
    title: 'Filtres (barre de gauche)',
    options: [
      { key: 'filter_bar', label: 'Afficher la barre de filtres', def: true },
      { key: 'view_filter', label: 'Section : génération de vues', def: true },
      { key: 'level_filter', label: 'Section : niveaux / hiérarchies', def: true },
      { key: 'node_filter', label: "Section : tags d'éléments", def: true },
      { key: 'data_filter', label: 'Section : sélection de données', def: true },
      { key: 'data_type', label: 'Filtre : type de donnée', def: true },
      { key: 'data_type_intervals', label: 'Filtre : intervalles de type de donnée', def: true },
      { key: 'value_filter', label: 'Filtre : valeurs', def: true },
    ],
  },
]

const ALL_FLAGS: FlagOpt[] = OPTION_GROUPS.flatMap((g) => g.options)
const defaultFlags = (): Record<string, boolean> =>
  Object.fromEntries(ALL_FLAGS.map((o) => [o.key, o.def]))

const POSITION_MODE_LABELS: Array<{ value: '' | Type_PositionMode, label: string }> = [
  { value: '', label: 'Par défaut (libre)' },
  { value: 'absolute', label: 'Absolu' },
  { value: 'proportional', label: 'Proportionnel' },
  { value: 'scale_adapted', label: 'Échelle adaptée' },
]

const sanitizeZipName = (name: string): string =>
  (name || 'sankey_site').replace(/[^\w\-_.]/g, '_') || 'sankey_site'

// Sélecteur déroulant type filtre Excel (recherche + « Tout sélectionner »
// tri-state + cases), pilotant un Record<string,boolean>. Même ergonomie que le
// sélecteur d'autocomplétion (ChecklistDropdown d'OpenSankey), mais générique.
// z-index : la modale de publication est à 2000 ; on force le popover au-dessus
// via rootProps (le positionneur garde sinon le token de thème 'popover'=1500).
const OptionsChecklistDropdown: FC<{
  groups: Array<{ title: string, options: FlagOpt[] }>
  values: Record<string, boolean>
  onChange: (next: Record<string, boolean>) => void
}> = ({ groups, values, onChange }) => {
  const [is_open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const all_opts = groups.flatMap((g) => g.options)
  const total = all_opts.length
  const checked = all_opts.reduce((n, o) => n + (values[o.key] ? 1 : 0), 0)
  const trigger_label = checked === 0
    ? 'Aucune'
    : checked === total ? 'Toutes' : `${checked} / ${total} sélectionnée(s)`

  const s = search.trim().toLowerCase()
  const matches = (o: FlagOpt) => !s || o.label.toLowerCase().includes(s)
  const visible = all_opts.filter(matches)
  const visible_checked = visible.reduce((n, o) => n + (values[o.key] ? 1 : 0), 0)
  const all_checked = visible.length > 0 && visible_checked === visible.length
  const none_checked = visible_checked === 0

  const toggleAllVisible = (next: boolean) => {
    const out = { ...values }
    visible.forEach((o) => { out[o.key] = next })
    onChange(out)
  }

  return (
    <Popover
      isOpen={is_open}
      onOpen={() => { setSearch(''); setOpen(true) }}
      onClose={() => setOpen(false)}
      placement='bottom-start'
      isLazy
    >
      <PopoverTrigger>
        <Button
          size='sm'
          variant='outline'
          rightIcon={<ChevronDownIcon />}
          width='100%'
          justifyContent='space-between'
          fontWeight='normal'
        >
          {trigger_label}
        </Button>
      </PopoverTrigger>
      <Portal>
        <PopoverContent minW='360px' maxW='460px' rootProps={{ style: { zIndex: 2100 } }}>
          <PopoverArrow />
          <PopoverBody p='6px'>
            <Input
              size='xs'
              placeholder='Rechercher'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              mb='6px'
            />
            <Checkbox
              size='sm'
              isChecked={all_checked}
              isIndeterminate={!all_checked && !none_checked}
              onChange={(e) => toggleAllVisible(e.target.checked)}
            >
              <Text fontSize='xs' fontStyle='italic'>(Tout sélectionner)</Text>
            </Checkbox>
            <Divider my='4px' />
            <VStack align='stretch' spacing='2px' maxH='260px' overflowY='auto'>
              {groups.map((group) => {
                const rows = group.options.filter(matches)
                if (rows.length === 0) return null
                return (
                  <Box key={group.title}>
                    <Text fontSize='2xs' fontWeight='semibold' color='gray.500' mt='4px' mb='2px'>
                      {group.title}
                    </Text>
                    {rows.map((o) => (
                      <Checkbox
                        key={o.key}
                        size='sm'
                        isChecked={!!values[o.key]}
                        onChange={(e) => onChange({ ...values, [o.key]: e.target.checked })}
                      >
                        <Text fontSize='xs'>{o.label}</Text>
                      </Checkbox>
                    ))}
                  </Box>
                )
              })}
              {visible.length === 0 && (
                <Text fontSize='xs' color='gray.500' fontStyle='italic'>—</Text>
              )}
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  )
}

export const ModalPublishOSP: FC<Props> = ({ app_data }) => {
  const [is_open, setIsOpen] = useState(false)
  const [source, setSource] = useState<PublishSource>('current')
  const [publish_name, setPublishName] = useState('')
  const [header, setHeader] = useState('')
  const [flags, setFlags] = useState<Record<string, boolean>>(defaultFlags())
  const [position_mode, setPositionMode] = useState<'' | Type_PositionMode>('')
  const [logo_file, setLogoFile] = useState<File | null>(null)
  const [folders, setFolders] = useState<string[]>([])
  const [folders_available, setFoldersAvailable] = useState(false)
  const [selected_folder, setSelectedFolder] = useState('')
  const [running, setRunning] = useState(false)
  const node_ref = useRef<HTMLDivElement>(null)

  // Bind l'ouverture pour que le menu puisse appeler ref.current(true).
  app_data.menu_configuration_osp.ref_show_modal_publish.current = setIsOpen

  // (Re)initialise à l'ouverture + charge la liste des dossiers serveur.
  useEffect(() => {
    if (!is_open) return
    const name = app_data.file_name || 'sankey'
    setPublishName(name)
    setHeader(name)
    setLogoFile(null)
    setFlags(defaultFlags())
    setPositionMode('')
    setSource('current')
    fetch(window.location.origin + '/api/publish/folders')
      .then((r) => r.json())
      .then((data) => {
        setFoldersAvailable(!!data.available)
        setFolders(data.folders || [])
        setSelectedFolder((data.folders && data.folders[0]) || '')
      })
      .catch(() => {
        setFoldersAvailable(false)
        setFolders([])
      })
  }, [is_open])

  // Escape ferme.
  useEffect(() => {
    if (!is_open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [is_open])

  // PROTÉGÉE : mode dev + licence OpenSankey+ requis (défense en profondeur ;
  // l'item de menu déclencheur est déjà gardé par les mêmes conditions).
  if (!is_open || !app_data.has_sankey_dev || !app_data.has_sankey_plus) return <></>

  const downloadZip = async (response: Response, fallback_name: string) => {
    if (!response.ok) {
      let msg = 'Échec de la publication'
      try { msg = (await response.json()).error || msg } catch { /* corps non-JSON */ }
      throw new Error(msg)
    }
    const blob = await response.blob()
    const cd = response.headers.get('Content-Disposition') || ''
    const m = cd.match(/filename="?([^";]+)"?/)
    FileSaver.saveAs(blob, m ? m[1] : fallback_name)
  }

  const publishCurrent = async () => {
    const diagram = JSON.stringify(app_data.toJSON())
    const globals: Record<string, unknown> = { ...flags, header }
    if (position_mode) globals.position_mode = position_mode
    const options: Record<string, unknown> = { publish_name: publish_name || 'sankey', globals }
    let response: Response
    if (logo_file) {
      options.logo_filename = logo_file.name
      const form = new FormData()
      form.append('diagram', diagram)
      form.append('options', JSON.stringify(options))
      form.append('logo', logo_file)
      response = await fetch(window.location.origin + '/api/publish/current', {
        method: 'POST', body: form,
      })
    } else {
      response = await fetch(window.location.origin + '/api/publish/current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagram, options }),
      })
    }
    await downloadZip(response, sanitizeZipName(publish_name) + '.zip')
  }

  const publishFolder = async () => {
    const response = await fetch(window.location.origin + '/api/publish/folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: selected_folder, publish_name: publish_name || undefined }),
    })
    await downloadZip(response, sanitizeZipName(publish_name || selected_folder) + '.zip')
  }

  const can_run = !running && (source === 'current' || (source === 'folder' && !!selected_folder))

  const handlePublish = () => {
    setRunning(true)
    const run = source === 'current' ? publishCurrent() : publishFolder()
    app_data.sendWaitingToast(
      () => run.finally(() => setRunning(false)),
      {
        success: { title: 'Site publié' },
        loading: { title: 'Génération du site en cours...' },
        error: { title: 'Échec de la publication' },
      }
    )
  }

  return (
    <DraggableComponent
      nodeRef={node_ref}
      handle='.modal-publish-handle'
      defaultPosition={{ x: window.innerWidth / 3, y: window.innerHeight / 8 }}
      bounds={{ left: 0, top: 0 }}
    >
      <Box
        ref={node_ref}
        position='absolute'
        width='480px'
        bg='white'
        boxShadow='lg'
        borderRadius='md'
        border='1px solid'
        borderColor='gray.300'
        zIndex={2000}
      >
        <HStack
          className='modal-publish-handle'
          justify='space-between'
          p={3}
          bg='gray.50'
          borderTopRadius='md'
          cursor='move'
          userSelect='none'
        >
          <Text fontWeight='bold'>Publier le site (zip)</Text>
          <CloseButton onClick={() => setIsOpen(false)} />
        </HStack>

        <Box p={4} maxH='70vh' overflowY='auto'>
          <VStack align='stretch' spacing={4}>
            <FormControl>
              <FormLabel>Source</FormLabel>
              <RadioGroup value={source} onChange={(v) => setSource(v as PublishSource)}>
                <Stack direction='column' spacing={1}>
                  <Radio value='current'>L'étude ouverte</Radio>
                  <Radio value='folder' isDisabled={!folders_available || folders.length === 0}>
                    Un dossier du serveur
                    {!folders_available && ' (indisponible)'}
                  </Radio>
                </Stack>
              </RadioGroup>
            </FormControl>

            {source === 'folder' && (
              <FormControl>
                <FormLabel>Dossier</FormLabel>
                <Select value={selected_folder} onChange={(e) => setSelectedFolder(e.target.value)}>
                  {folders.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl>
              <FormLabel>Nom du fichier zip</FormLabel>
              <Input value={publish_name} onChange={(e) => setPublishName(e.target.value)} />
            </FormControl>

            {source === 'current' && (
              <>
                <FormControl>
                  <FormLabel>Titre affiché (en-tête, HTML accepté)</FormLabel>
                  <Input value={header} onChange={(e) => setHeader(e.target.value)} />
                </FormControl>

                <FormControl>
                  <FormLabel mb={2}>Logo (optionnel)</FormLabel>
                  <Input
                    type='file'
                    accept='image/png,image/jpeg'
                    height='auto'
                    py={2}
                    px={2}
                    lineHeight='1.8'
                    onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                  />
                </FormControl>

                <Divider />

                <FormControl>
                  <FormLabel fontSize='sm' color='gray.600'>Options d'affichage du viewer</FormLabel>
                  <OptionsChecklistDropdown
                    groups={OPTION_GROUPS}
                    values={flags}
                    onChange={setFlags}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel fontSize='sm' color='gray.600'>Mode de position initial</FormLabel>
                  <Select
                    value={position_mode}
                    onChange={(e) => setPositionMode(e.target.value as '' | Type_PositionMode)}
                  >
                    {POSITION_MODE_LABELS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}

            <Text fontSize='sm' color='gray.500'>
              Le zip contient un site HTML autonome (assets compilés inclus) + un lanceur
              local (server.bat / server.sh). Voir LISEZ-MOI.txt.
            </Text>
          </VStack>
        </Box>

        <HStack p={3} justify='flex-end' borderTop='1px solid' borderColor='gray.200' spacing={2}>
          <ButtonGroup>
            <Button variant='ghost' onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button
              colorScheme='blue'
              isDisabled={!can_run}
              isLoading={running}
              leftIcon={running ? <Spinner size='xs' /> : undefined}
              onClick={handlePublish}
            >
              Publier
            </Button>
          </ButtonGroup>
        </HStack>
      </Box>
    </DraggableComponent>
  )
}
