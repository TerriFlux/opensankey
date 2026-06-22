// Standard libs
import React, { FC, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Draggable, { DraggableProps } from 'react-draggable'
import { Box, Button, ButtonGroup, CloseButton, HStack, Select, Text } from '@chakra-ui/react'

// OpenSankey / OpenSankey+ libs
import { Class_NodeElement } from '../deps/OpenSankey/Elements/Node'
import { Class_LinkElement } from '../deps/OpenSankey/Elements/Link'
import { Class_ApplicationDataOSP } from '../types/ApplicationDataOSP'
import { Class_DrawingAreaOSP } from '../types/DrawingAreaOSP'
import { createUnitarySankeyDetached, UnitaryValueMode } from './UnitaryBoard'

// react-draggable : typings embarqués optionnels vs @types requis (cf. SankeyPlusViews).
const DraggableComponent = Draggable as unknown as React.ComponentClass<Partial<DraggableProps>>

// Conteneur DOM (id fixe) de la zone de dessin du modal unitaire singleton.
const UNITARY_MODAL_CONTAINER_ID = 'unitary_sankey_app_singleton'

// ===========================================================================
// Modal « Sankey unitaire » (singleton)
// ---------------------------------------------------------------------------
// Remplace l'ancien comportement « générer une vue unitaire » (qui échangeait
// la zone de dessin principale via setCurrentView). Ici, le sankey unitaire est
// rendu comme un SECOND diagramme indépendant, dans un panneau draggable, EN
// PLUS du diagramme principal qui reste affiché (rendu simultané via
// DrawingArea.container_selector). Un unique modal : son en-tête porte le titre
// et un sélecteur de nœud central — changer de nœud reconstruit l'unitaire et
// met à jour le titre. Les unitaires ne passent plus par le système de vues.
// ===========================================================================

export const ModalUnitarySankeyOSP: FC<{ app_data: Class_ApplicationDataOSP }> = ({ app_data }) => {
  const { t } = app_data
  const [open, setOpen] = useState(false)
  // Nœud central courant (sélectionné par clic droit, puis modifiable via le dropdown).
  const [node, setNode] = useState<Class_NodeElement | null>(null)
  // Mode d'affichage des valeurs de flux : pourcentage (défaut), valeur brute, ou
  // normalisé (un flux de référence fixé à 1). Reconstruit l'unitaire à chaque changement.
  const [value_mode, setValueMode] = useState<UnitaryValueMode>('percent')
  // Flux de référence (id) pour le mode normalisé.
  const [normalize_link_id, setNormalizeLinkId] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeRef = useRef<any>(null)
  const da_ref = useRef<Class_DrawingAreaOSP | null>(null)

  // Ouverture/mise à jour depuis le clic droit « Créer sankey unitaire ».
  app_data.menu_configuration_osp.ref_open_unitary_sankey_modal.current = (n: Class_NodeElement) => {
    setNode(n)
    setOpen(true)
  }

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

  // (Re)construit le sankey unitaire détaché à chaque changement de nœud (ou ouverture).
  useEffect(() => {
    if (!open || !node) return
    // Construction TOTALEMENT protégée : une exception ici (dans l'effet) casserait
    // le composant — et React Refresh peut ensuite rester bloqué en état d'erreur.
    // On garantit que le panneau s'ouvre quoi qu'il arrive ; le détail va en console.
    try {
      const da = createUnitarySankeyDetached(
        app_data, node, '#' + UNITARY_MODAL_CONTAINER_ID, value_mode, normalize_link_id
      )
      da_ref.current = da
      // Pare-feu : redessiner le diagramme principal depuis son modèle (intact)
      // après construction de l'unitaire, pour resynchroniser son DOM. Sûr car le
      // modal est rendu hors de #sankey_app (portal) : le redraw du base ne
      // supprime pas le SVG unitaire.
      app_data.drawing_area.draw()
    } catch (e) {
      console.error('[unitary] construction du sankey unitaire échouée:', e)
    }

    // Recadrage sur redimensionnement du conteneur (poignée resize CSS).
    // NB : centrage (recenter) volontairement non fait ici — à retravailler.
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
    }
    // node_id : on reconstruit quand le nœud central change ; value_mode/normalize_link_id :
    // quand le mode d'affichage des valeurs change.
  }, [open, node_id, value_mode, normalize_link_id])

  if (!app_data.has_sankey_plus || !open || !node) return <></>

  // Liste des nœuds sélectionnables comme centre de l'unitaire (diagramme principal).
  const base_sankey = (app_data.drawing_area as Class_DrawingAreaOSP).sankey
  const selectable_nodes = base_sankey.visible_nodes_list_sorted

  // Flux du nœud central (entrées + sorties), candidats comme flux de référence du
  // mode normalisé. On lit les ids sur le diagramme de base ; createUnitarySankeyDetached
  // les résout dans le sankey unitaire (les ids sont préservés par la copie JSON).
  const central_links = [
    ...(node.input_links_list as Class_LinkElement[]),
    ...(node.output_links_list as Class_LinkElement[])
  ]
  const link_label = (l: Class_LinkElement) => l.source.name + ' → ' + l.target.name

  // Changement de mode. En passant en « normalisé » sans flux de référence choisi,
  // on présélectionne le premier flux du nœud central pour afficher quelque chose.
  const handleModeChange = (mode: UnitaryValueMode) => {
    if (mode === 'normalized' && !normalize_link_id && central_links.length > 0) {
      setNormalizeLinkId(central_links[0].id)
    }
    setValueMode(mode)
  }

  // Rendu via portal sur document.body : le SVG unitaire NE doit PAS être imbriqué
  // dans #sankey_app, sinon le redraw du diagramme principal
  // (d3.select('#sankey_app').selectAll('#draw_zoom').remove()) supprimerait aussi
  // le SVG de l'unitaire. Le portal garde le contexte React (thème Chakra, etc.).
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
            Vues Unitaire {node.name}
          </Text>
          <CloseButton justifySelf='end' onClick={() => setOpen(false)} />
        </Box>
        <Box layerStyle='menu_draggable_content_layout'>
          {/* Sélecteur du mode d'affichage des valeurs de flux : pourcentage (défaut),
              valeur brute, ou normalisé (un flux de référence fixé à 1). En mode
              normalisé, un dropdown choisit le flux de référence. */}
          <HStack gap='3' paddingBottom='2' flexWrap='wrap'>
            <ButtonGroup size='sm' isAttached variant='outline'>
              <Button
                colorScheme={value_mode === 'percent' ? 'blue' : 'gray'}
                variant={value_mode === 'percent' ? 'solid' : 'outline'}
                onClick={() => handleModeChange('percent')}
              >
                {t('unit_value_mode_percent')}
              </Button>
              <Button
                colorScheme={value_mode === 'value' ? 'blue' : 'gray'}
                variant={value_mode === 'value' ? 'solid' : 'outline'}
                onClick={() => handleModeChange('value')}
              >
                {t('unit_value_mode_value')}
              </Button>
              <Button
                colorScheme={value_mode === 'normalized' ? 'blue' : 'gray'}
                variant={value_mode === 'normalized' ? 'solid' : 'outline'}
                onClick={() => handleModeChange('normalized')}
              >
                {t('unit_value_mode_normalized')}
              </Button>
            </ButtonGroup>
            {value_mode === 'normalized' && (
              <Select
                size='sm'
                maxWidth='20rem'
                value={normalize_link_id ?? ''}
                onChange={(e) => setNormalizeLinkId(e.target.value || null)}
                placeholder={t('unit_value_mode_ref')}
              >
                {central_links.map((l) => (
                  <option key={l.id} value={l.id}>{link_label(l)}</option>
                ))}
              </Select>
            )}
          </HStack>
          {/* Sélecteur de nœud central À GAUCHE de la zone de dessin (flex row). Le
              SURVOL d'un nœud reconstruit l'unitaire (aperçu immédiat, comme l'ancien
              comportement dans la zone principale) ; le clic le sélectionne aussi. */}
          <Box display='flex' flexDirection='row' alignItems='stretch' gap='2'>
            <Box
              minWidth='12rem'
              maxWidth='16rem'
              height='52vh'
              overflowY='auto'
              borderRight='1px solid var(--chakra-colors-gray-200, #e2e8f0)'
              paddingRight='1'
            >
              <Box fontStyle='h2' paddingX='1' paddingBottom='1'>
                {t('view.unit')}
              </Box>
              {selectable_nodes.map((n) => (
                <Box
                  key={n.id}
                  onMouseEnter={() => setNode(n as Class_NodeElement)}
                  onClick={() => setNode(n as Class_NodeElement)}
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
