// Standard libs
import React, { ChangeEvent, FC, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Draggable, { DraggableProps } from 'react-draggable'
import { Box, Button, ButtonGroup, CloseButton, HStack, Input, Select, Spinner, Text } from '@chakra-ui/react'

// OpenSankey / OpenSankey+ libs
import { Class_NodeElement } from '../deps/OpenSankey/Elements/Node'
import { Class_LinkElement } from '../deps/OpenSankey/Elements/Link'
import { makeId, Type_JSON } from '../deps/OpenSankey/types/Utils'
import { decompressGzipDataFixed } from '../deps/OpenSankey/Persistence/UniversalJSONCompression'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'
import { Class_DrawingAreaOSP, DrawingAreaPersistenceOSP } from '../types/DrawingAreaOSP'
import { createUnitarySankeyDetached, refocusUnitaryDrawingArea, UnitaryValueMode } from './UnitaryBoard'

// react-draggable : typings embarqués optionnels vs @types requis (cf. SankeyPlusViews).
const DraggableComponent = Draggable as unknown as React.ComponentClass<Partial<DraggableProps>>

// Conteneur DOM (id fixe) de la zone de dessin du modal unitaire singleton.
const UNITARY_MODAL_CONTAINER_ID = 'unitary_sankey_app_singleton'

type SourceMode = 'local' | 'excel'

// ===========================================================================
// Modal « Sankey unitaire » (singleton) — fusion local + Excel
// ---------------------------------------------------------------------------
// Point d'entrée unique des sankeys unitaires (bouton « Unit. » de la bannière +
// clic droit sur un nœud). Remplace l'ancien mécanisme « vue unitaire » : ici le
// sankey unitaire est rendu comme un SECOND diagramme indépendant, dans un panneau
// draggable, EN PLUS du diagramme principal (rendu simultané via
// DrawingArea.container_selector). Il ne crée PLUS de vue persistante.
//
// Deux sources :
//  - Local : le nœud central est choisi dans le diagramme courant (app_data).
//  - Excel : on importe un/des fichier(s) .xlsx (conversion serveur, cf.
//    SankeyExcelParser), chargés dans un app_data temporaire ; le nœud central est
//    alors choisi dans le sankey importé. Le rendu détaché est identique.
// ===========================================================================

export const ModalUnitarySankeyOSP: FC<{ app_data: Class_ApplicationDataOSP }> = ({ app_data }) => {
  const { t } = app_data
  const [open, setOpen] = useState(false)
  // Nœud central courant (appartient au sankey de la source active).
  const [node, setNode] = useState<Class_NodeElement | null>(null)
  // Mode d'affichage des valeurs de flux : pourcentage (défaut), valeur brute, ou
  // normalisé (un flux de référence fixé à 1). Reconstruit l'unitaire à chaque changement.
  const [value_mode, setValueMode] = useState<UnitaryValueMode>('percent')
  // Flux de référence (id) pour le mode normalisé.
  const [normalize_link_id, setNormalizeLinkId] = useState<string | null>(null)

  // Source des données : diagramme courant ou import Excel.
  const [source_mode, setSourceMode] = useState<SourceMode>('local')

  // --- État de l'import Excel ------------------------------------------------
  // app_data temporaire portant le sankey importé (jamais rendu directement : sert
  // de SOURCE à createUnitarySankeyDetached, qui en copie le diagramme).
  const local_app_data = useRef<Class_ApplicationDataOSP>(new Class_ApplicationDataOSP(false))
  // Sources chargées : { id -> { name, data(JSON) } }.
  const list_data = useRef<{ [x: string]: { name: string, data: Type_JSON } }>({})
  const ref_input_file = useRef<HTMLInputElement>(null)
  const [pending_files, setPendingFiles] = useState<File[]>([])
  const [is_processing, setIsProcessing] = useState(false)
  const [current_file_name, setCurrentFileName] = useState('')
  const [processed_count, setProcessedCount] = useState(0)
  const [total_to_process, setTotalToProcess] = useState(0)
  const [selected_data_id, setSelectedDataId] = useState('')
  // Compteur de re-rendu (list_data est un ref → ne déclenche pas de rendu seul).
  const [, setUpdater] = useState(0)
  const forceUpdate = () => setUpdater(a => a + 1)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeRef = useRef<any>(null)
  const da_ref = useRef<Class_DrawingAreaOSP | null>(null)
  // Nœud central déjà affiché par la DA détachée courante : permet à l'effet de
  // re-focalisation (léger) de ne rien faire quand la construction (lourde) vient
  // justement de poser ce nœud, et inversement.
  const built_for_node = useRef<string | undefined>(undefined)
  // Lecture « live » du nœud courant pour l'effet de construction, qui ne dépend PAS
  // de node_id (sinon il reconstruirait tout à chaque changement de nœud).
  const node_live = useRef<Class_NodeElement | null>(null)
  node_live.current = node
  // Débounce du survol : ne reconstruit/refocalise qu'une fois la souris posée.
  const hover_timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Initialiser le menu config de l'app_data temporaire (requis par fromJSON/dessin).
  // createNewMenuConfiguration() appelle des hooks (useToast, et useRef via le
  // constructeur de Class_MenuConfigOSP) : il DOIT être invoqué dans le corps du
  // composant — pas dans un useEffect — sinon « Invalid hook call ». Même pattern
  // que les wrappers d'app (SpreadSheetWrapper) qui l'appellent à chaque rendu.
  local_app_data.current.createNewMenuConfiguration()

  // app_data de la source active (diagramme courant ou import Excel).
  const source_app_data = source_mode === 'local' ? app_data : local_app_data.current

  // Nœuds candidats comme centre unitaire = nœuds visibles de la source, MOINS les
  // nœuds d'échange (import/export, tag `echange`). Ces derniers sont des extrémités à
  // flux unique (un seul flux entrant/sortant vers le nœud d'échange parent) : ils n'ont
  // pas de sens comme nœud central d'un sankey unitaire et ne doivent donc pas être
  // proposés (ni dans le sélecteur, ni comme nœud par défaut).
  const centralCandidates = (sad: Class_ApplicationDataOSP): Class_NodeElement[] => {
    const sankey = (sad.drawing_area as Class_DrawingAreaOSP).sankey
    const echangeTag = sankey.node_taggs_dict['type de noeud']?.tags_dict['echange']
    return (sankey.visible_nodes_list_sorted as Class_NodeElement[])
      .filter(n => !(echangeTag && n.hasGivenTag(echangeTag)))
  }

  // Ouverture depuis le bouton « Unit. » (sans nœud) ou le clic droit (avec nœud).
  app_data.menu_configuration_osp.ref_open_unitary_sankey_modal.current = (n: Class_NodeElement | null) => {
    setSourceMode('local')
    if (n) setNode(n)
    setOpen(true)
  }

  // Onglet « Unit. » de la topbar (cf. UnitaryTabButton, OS base) : le toggle ouvre/ferme
  // ce modal singleton. Assigné à chaque rendu (idempotent), même modal fermé, pour rester
  // câblé. La disponibilité du bouton et son surlignage sont synchronisés par les effets
  // ci-dessous (sur has_sankey_plus et open).
  app_data.menu_configuration.toggleUnitaryTab = () => setOpen(o => !o)
  useEffect(() => {
    app_data.menu_configuration.unitary_tab_available = app_data.has_sankey_plus
    app_data.menu_configuration.notifyMainZone()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app_data.has_sankey_plus])
  useEffect(() => {
    app_data.menu_configuration.unitary_tab_open = open
    app_data.menu_configuration.notifyMainZone()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Hook consommé par l'onglet « Sankey unitaire » du tooltip de nœud (OS) : dessine
  // un sankey unitaire détaché focalisé sur `n` dans le conteneur DOM passé, EN PLUS
  // du diagramme principal. Renvoie un handle (redraw au resize + cleanup à la fermeture).
  app_data.draw_unitary_in_container = (n: Class_NodeElement, container_selector: string) => {
    const da = createUnitarySankeyDetached(app_data, n, container_selector)
    // Pare-feu : resync du DOM du diagramme principal après construction (cf. useEffect).
    app_data.drawing_area.draw()
    return {
      redraw: () => da.draw(),
      cleanup: () => { da.unDraw(); da.delete() }
    }
  }

  const node_id = node?.id

  // Nœud par défaut : à l'ouverture / au changement de source / de fichier, on
  // (re)pointe le nœud central sur le 1er nœud visible de la source active si le
  // nœud courant est absent ou n'appartient pas à cette source.
  useEffect(() => {
    if (!open) return
    const nodes = centralCandidates(source_app_data)
    if (nodes.length === 0) {
      if (node) setNode(null)
      return
    }
    if (!node || !nodes.some(n => n.id === node.id)) {
      setNode(nodes[0] as Class_NodeElement)
    }
    // node volontairement hors deps (évite une boucle ; lu en lecture seule).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, source_mode, selected_data_id])

  // CONSTRUCTION (lourde) du sankey unitaire détaché. Ne dépend QUE de la source et du
  // mode d'affichage : la copie JSON, le fromJSON et la création des ViewTagGroups (un
  // tag par nœud) sont indépendants du nœud choisi. Le changement de nœud passe par
  // l'effet de re-focalisation ci-dessous (léger). node est lu en live (hors deps) pour
  // la focalisation initiale ; une focalisation incorrecte serait de toute façon corrigée
  // par l'effet de refocus juste après.
  useEffect(() => {
    if (!open) return
    const src = source_app_data
    const nodes = centralCandidates(src)
    if (nodes.length === 0) return
    const wanted = node_live.current
    const focus = (wanted && nodes.some(n => n.id === wanted.id))
      ? wanted
      : (nodes[0] as Class_NodeElement)
    // Construction protégée : une exception ici casserait le composant (React Refresh
    // peut rester bloqué en erreur). On garantit l'ouverture ; le détail va en console.
    try {
      const da = createUnitarySankeyDetached(
        app_data, focus, '#' + UNITARY_MODAL_CONTAINER_ID, value_mode, normalize_link_id, src
      )
      da_ref.current = da
      built_for_node.current = focus.id
      // Pare-feu : redessiner le diagramme principal depuis son modèle (intact) après
      // construction de l'unitaire, pour resynchroniser son DOM. Sûr car le modal est
      // rendu hors de #sankey_app (portal). Une seule fois (à la construction), plus à
      // chaque changement de nœud.
      app_data.drawing_area.draw()
    } catch (e) {
      console.error('[unitary] construction du sankey unitaire échouée:', e)
    }

    // Recadrage sur redimensionnement du conteneur (poignée resize CSS).
    const el = document.getElementById(UNITARY_MODAL_CONTAINER_ID)
    let ro: ResizeObserver | null = null
    let raf = 0
    let first = true
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        if (first) { first = false; return } // 1er callback = taille initiale, déjà dessinée
        if (raf) cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => { da_ref.current?.draw() })
      })
      ro.observe(el)
    }

    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro?.disconnect()
      da_ref.current?.unDraw()
      da_ref.current?.delete()
      da_ref.current = null
      built_for_node.current = undefined
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value_mode, normalize_link_id, source_mode, selected_data_id])

  // RE-FOCALISATION (légère) au changement de nœud : re-sélectionne le tag unitaire du
  // nouveau nœud sur la DA déjà construite, sans refaire toJSON/fromJSON. C'est ce qui
  // rend le survol/parcours « instantané ».
  useEffect(() => {
    if (!open || !node) return
    const da = da_ref.current
    // Pas encore construite → l'effet de construction s'en charge (focalisation initiale).
    if (!da) return
    // Déjà affiché ce nœud (construction qui vient de tomber) → rien à faire.
    if (built_for_node.current === node.id) return
    const src = source_app_data
    const nodes = centralCandidates(src)
    if (!nodes.some(n => n.id === node.id)) return
    try {
      refocusUnitaryDrawingArea(da, node)
      da.draw()
      built_for_node.current = node.id
    } catch (e) {
      console.error('[unitary] re-focalisation du sankey unitaire échouée:', e)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node_id])

  // Annuler une présélection de survol en attente à la fermeture / au démontage.
  useEffect(() => {
    if (open) return
    if (hover_timer.current) clearTimeout(hover_timer.current)
  }, [open])

  // Flux de référence par défaut : au changement de nœud central (ou de source), on
  // restaure le flux mémorisé sur le nœud s'il est encore visible, sinon le 1er flux
  // visible. Garantit que le dropdown reste cohérent avec le sankey unitaire affiché.
  useEffect(() => {
    if (!open || !node) return
    const links = [
      ...(node.input_links_list as Class_LinkElement[]),
      ...(node.output_links_list as Class_LinkElement[])
    ].filter(l => l.is_visible)
    const stored = node.unitary_ref_link_id
    const valid = stored && links.some(l => l.id === stored)
    setNormalizeLinkId(valid ? stored : (links[0]?.id ?? null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node_id, source_mode, selected_data_id])

  // --- Import Excel : upload + poll + récupération (cf. SankeyPlusViews) -------
  const loadDataSource = (key: string) => {
    const entry = list_data.current[key]
    if (!entry) return
    DrawingAreaPersistenceOSP.fromJSON(local_app_data.current.drawing_area as Class_DrawingAreaOSP, entry.data)
    setSelectedDataId(key)
  }

  const processOneFile = async (file: File): Promise<void> => {
    const root = window.location.origin
    setCurrentFileName(file.name)
    // 1. Upload
    const form_data = new FormData()
    form_data.append('file', file)
    form_data.append('output_format', 'json')
    form_data.append('process_label', t('ProcessDialog.open_excel_file'))
    await fetch(root + '/opensankey/convert/launch', { method: 'POST', body: form_data })
    // 2. Poll jusqu'à la fin (statut machine renvoyé par le serveur).
    await new Promise<void>(resolve => {
      const url_check = root + app_data.url_prefix + 'upload/check_process'
      const interval = setInterval(() => {
        fetch(url_check, { method: 'POST', body: '' }).then(r => {
          if (!r.ok) return
          r.json().then(data => {
            if (data.status === 'finished' || data.status === 'failed') {
              clearInterval(interval)
              resolve()
            }
          })
        })
      }, 2000)
    })
    // 3. Récupérer le résultat (gzip)
    const response = await fetch(root + '/opensankey/upload/retrieve_result', { method: 'POST', body: new FormData() })
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer()
      const decompressed = await decompressGzipDataFixed(arrayBuffer)
      const jsonData = JSON.parse(decompressed)
      jsonData['version'] = local_app_data.current.version
      list_data.current[makeId('data_src_')] = { name: file.name, data: jsonData }
    }
  }

  const processQueue = async (files: File[]) => {
    setIsProcessing(true)
    setTotalToProcess(files.length)
    setProcessedCount(0)
    for (let i = 0; i < files.length; i++) {
      await processOneFile(files[i])
      setProcessedCount(i + 1)
    }
    setIsProcessing(false)
    setCurrentFileName('')
    setPendingFiles([])
    if (ref_input_file.current) ref_input_file.current.value = ''
    // Sélectionner la 1re source chargée si aucune ne l'est encore.
    const keys = Object.keys(list_data.current)
    if (keys.length > 0 && !(selected_data_id in list_data.current)) {
      loadDataSource(keys[0])
    } else {
      forceUpdate()
    }
  }

  const removeDataSource = (key: string) => {
    delete list_data.current[key]
    if (key === selected_data_id) {
      const remaining = Object.keys(list_data.current)
      if (remaining.length > 0) loadDataSource(remaining[0])
      else setSelectedDataId('')
    }
    forceUpdate()
  }

  if (!app_data.has_sankey_plus || !open) return <></>

  // Nœuds sélectionnables comme centre (source active), hors nœuds d'échange.
  const selectable_nodes = centralCandidates(source_app_data)

  // Répartition en trois groupes par type de nœud (tag du groupe « type de noeud ») :
  //  - produits  → « Processus de marché »
  //  - secteurs  → « Processus de transformation »
  //  - le reste  → « Indifférenciés »
  const node_type_tagg = (source_app_data.drawing_area as Class_DrawingAreaOSP)
    .sankey.node_taggs_dict['type de noeud']
  const product_tag = node_type_tagg?.tags_dict['produit']
  const sector_tag = node_type_tagg?.tags_dict['secteur']
  const node_groups: { key: string, label: string, nodes: Class_NodeElement[] }[] = [
    { key: 'products', label: t('view.unit_group_products'), nodes: [] },
    { key: 'sectors', label: t('view.unit_group_sectors'), nodes: [] },
    { key: 'other', label: t('view.unit_group_other'), nodes: [] }
  ]
  for (const n of selectable_nodes) {
    if (product_tag && n.hasGivenTag(product_tag)) node_groups[0].nodes.push(n)
    else if (sector_tag && n.hasGivenTag(sector_tag)) node_groups[1].nodes.push(n)
    else node_groups[2].nodes.push(n)
  }

  // Flux du nœud central VISIBLES (entrées + sorties) = exactement les flux affichés
  // dans le sankey unitaire courant → seuls candidats valides comme flux de référence
  // du mode normalisé. Les ids sont préservés par la copie JSON (résolus côté unitaire).
  const central_links = node ? [
    ...(node.input_links_list as Class_LinkElement[]),
    ...(node.output_links_list as Class_LinkElement[])
  ].filter(l => l.is_visible) : []
  const link_label = (l: Class_LinkElement) => l.source.name + ' → ' + l.target.name

  const handleModeChange = (mode: UnitaryValueMode) => setValueMode(mode)

  // Survol d'un nœud de la liste : présélection débouncée (~120 ms). Évite de
  // refocaliser le board pour chaque nœud effleuré au passage de la souris ; ne
  // déclenche qu'une fois la souris posée. Le clic, lui, sélectionne sans délai.
  const hoverNode = (n: Class_NodeElement) => {
    if (hover_timer.current) clearTimeout(hover_timer.current)
    hover_timer.current = setTimeout(() => setNode(n), 120)
  }
  const pickNode = (n: Class_NodeElement) => {
    if (hover_timer.current) clearTimeout(hover_timer.current)
    setNode(n)
  }

  // Choix d'un flux de référence : on le mémorise SUR le nœud central (restauré quand
  // on revient sur ce nœud, cf. effet « ref par défaut »), en plus de l'état local.
  const handleRefChange = (id: string | null) => {
    setNormalizeLinkId(id)
    if (node) node.unitary_ref_link_id = id
  }

  const nb_loaded = Object.keys(list_data.current).length

  const sourceButton = (mode: SourceMode, label: string) => (
    <Button
      size='sm'
      variant={source_mode === mode
        ? 'menuconfigpanel_option_button_activated'
        : 'menuconfigpanel_option_button'}
      onClick={() => setSourceMode(mode)}
    >
      {label}
    </Button>
  )

  const modeButton = (mode: UnitaryValueMode, label: string) => (
    <Button
      size='sm'
      variant={value_mode === mode
        ? 'menuconfigpanel_option_button_activated'
        : 'menuconfigpanel_option_button'}
      onClick={() => handleModeChange(mode)}
    >
      {label}
    </Button>
  )

  // Rendu via portal sur document.body : le SVG unitaire NE doit PAS être imbriqué
  // dans #sankey_app, sinon le redraw du diagramme principal supprimerait aussi le SVG
  // de l'unitaire. Le portal garde le contexte React (thème Chakra, etc.).
  return createPortal(
    <DraggableComponent
      nodeRef={nodeRef}
      handle='.title_menu'
      defaultPosition={{ x: window.innerWidth / 4, y: window.innerHeight / 8 }}
    >
      <Box
        ref={nodeRef}
        layerStyle='menu_draggable_layout'
        position='fixed'
        top='0'
        left='0'
        zIndex='1500'
      >
        <Box className='title_menu' layerStyle='menu_draggable_title_layout'>
          <Text justifySelf='start' fontStyle='h1' margin='0'>
            {t('view.unit')}{node ? ' — ' + node.name : ''}
          </Text>
          <CloseButton justifySelf='end' onClick={() => setOpen(false)} />
        </Box>
        <Box layerStyle='menu_draggable_content_layout'>
          {/* Barre de contrôle : source + (import Excel) + mode d'affichage des valeurs. */}
          <Box
            marginBottom='3'
            padding='3'
            borderRadius='md'
            border='1px solid'
            borderColor='gray.200'
            bg='gray.50'
            display='grid'
            gridRowGap='2.5'
          >
            {/* Source des données : diagramme courant ou import Excel. */}
            <HStack gap='3' flexWrap='wrap'>
              <Text fontSize='sm' fontWeight='600' color='gray.600' minWidth='6rem'>
                {t('Menu.Transformation.sourceType')}
              </Text>
              <ButtonGroup size='sm' spacing='1'>
                {sourceButton('local', t('view.unit_tab_local'))}
                {sourceButton('excel', t('view.unit_tab_excel'))}
              </ButtonGroup>
            </HStack>

          {/* Import Excel : sélection de fichier + liste des sources chargées. */}
          {source_mode === 'excel' && (
            <Box paddingBottom='2' display='grid' gridRowGap='0.4rem'>
              <Box display='grid' gridTemplateColumns='1fr auto' gap='0.4rem' alignItems='center'>
                <Input
                  type='file'
                  accept='.xlsx'
                  multiple
                  size='sm'
                  height='1.9rem'
                  padding='0.15rem'
                  ref={ref_input_file}
                  isDisabled={is_processing}
                  onChange={(evt: ChangeEvent) => {
                    const files = (evt.target as HTMLInputElement).files
                    setPendingFiles(files ? Array.from(files) : [])
                  }}
                />
                <Button
                  size='sm'
                  height='1.9rem'
                  colorScheme='blue'
                  isDisabled={is_processing || pending_files.length === 0}
                  onClick={() => processQueue(pending_files)}
                >
                  {is_processing
                    ? `${processed_count}/${total_to_process}`
                    : pending_files.length > 1
                      ? `${t('Menu.ouvrir')} (${pending_files.length})`
                      : t('Menu.ouvrir')}
                </Button>
              </Box>
              {is_processing && (
                <Box display='flex' alignItems='center' gap='0.4rem' fontSize='sm' color='gray.600'>
                  <Spinner size='xs' /><Text>{current_file_name}</Text>
                </Box>
              )}
              {nb_loaded > 0 && (
                <Box border='1px solid' borderColor='gray.200' borderRadius='4px' overflow='hidden'>
                  {Object.entries(list_data.current).map(([key, data], idx, arr) => {
                    const is_active = key === selected_data_id
                    return <Box
                      key={key}
                      display='grid'
                      gridTemplateColumns='1fr auto'
                      alignItems='center'
                      padding='0.15rem 0.4rem'
                      gap='0.4rem'
                      borderBottom={idx < arr.length - 1 ? '1px solid' : 'none'}
                      borderBottomColor='gray.100'
                      bg={is_active ? 'openSankey.50' : 'transparent'}
                      cursor='pointer'
                      _hover={{ bg: is_active ? 'openSankey.50' : 'gray.50' }}
                      onClick={() => { if (key !== selected_data_id) loadDataSource(key) }}
                    >
                      <Text fontSize='sm' fontWeight={is_active ? '600' : '400'} isTruncated>{data.name}</Text>
                      <CloseButton size='sm' onClick={(e) => { e.stopPropagation(); removeDataSource(key) }} />
                    </Box>
                  })}
                </Box>
              )}
            </Box>
          )}

            {/* Mode d'affichage des valeurs de flux : pourcentage (défaut), valeur brute,
                ou normalisé (un flux de référence fixé à 1, choisi dans le dropdown). */}
            <HStack gap='3' flexWrap='wrap'>
              <Text fontSize='sm' fontWeight='600' color='gray.600' minWidth='6rem'>
                {t('view.choose_link_ref_sankey_unit')}
              </Text>
              <ButtonGroup size='sm' spacing='1'>
                {modeButton('percent', t('view.unit_value_mode_percent'))}
                {modeButton('value', t('view.unit_value_mode_value'))}
                {modeButton('normalized', t('view.unit_value_mode_normalized'))}
              </ButtonGroup>
              {value_mode === 'normalized' && (
                <Select
                  size='sm'
                  maxWidth='18rem'
                  bg='white'
                  value={normalize_link_id ?? ''}
                  onChange={(e) => handleRefChange(e.target.value || null)}
                  placeholder={t('view.unit_value_mode_ref')}
                >
                  {central_links.map((l) => (
                    <option key={l.id} value={l.id}>{link_label(l)}</option>
                  ))}
                </Select>
              )}
            </HStack>
          </Box>

          {/* Sélecteur de nœud central À GAUCHE de la zone de dessin (flex row). Le
              SURVOL d'un nœud reconstruit l'unitaire (aperçu immédiat) ; le clic le
              sélectionne aussi. */}
          <Box display='flex' flexDirection='row' alignItems='stretch' gap='2'>
            <Box
              minWidth='12rem'
              maxWidth='16rem'
              height='52vh'
              overflowY='auto'
              borderRight='1px solid var(--chakra-colors-gray-200, #e2e8f0)'
              paddingRight='1'
            >
              {node_groups.filter(g => g.nodes.length > 0).map((g) => (
                <Box key={g.key} marginBottom='1.5'>
                  <Text
                    fontSize='xs'
                    fontWeight='700'
                    textTransform='uppercase'
                    letterSpacing='0.03em'
                    color='gray.500'
                    paddingX='2'
                    paddingY='0.5'
                  >
                    {g.label}
                  </Text>
                  {g.nodes.map((n) => (
                    <Box
                      key={n.id}
                      onMouseEnter={() => hoverNode(n as Class_NodeElement)}
                      onClick={() => pickNode(n as Class_NodeElement)}
                      cursor='pointer'
                      paddingX='2'
                      paddingY='1'
                      borderRadius='4px'
                      whiteSpace='nowrap'
                      overflow='hidden'
                      textOverflow='ellipsis'
                      fontWeight={n.id === node_id ? 'bold' : 'normal'}
                      background={n.id === node_id ? 'var(--chakra-colors-blue-100, #bee3f8)' : 'transparent'}
                      _hover={{ background: 'var(--chakra-colors-gray-100, #edf2f7)' }}
                    >
                      {n.name}
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
            <div
              id={UNITARY_MODAL_CONTAINER_ID}
              style={{
                position: 'relative',
                width: '42vw',
                height: '52vh',
                minWidth: '20rem',
                minHeight: '15rem',
                resize: 'both',
                overflow: 'hidden',
                background: 'white'
              }}
            />
          </Box>
        </Box>
      </Box>
    </DraggableComponent>,
    document.body
  )
}
